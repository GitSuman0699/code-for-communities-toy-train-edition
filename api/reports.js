/**
 * api/reports.js — Vercel Serverless Function
 * Central Dispatch REST API for DHR Gangman's Logbook
 *
 * Supports:
 *  - GET    /api/reports  -> Returns all centralized reports
 *  - POST   /api/reports  -> Receives & saves a report from track patrol
 *  - DELETE /api/reports  -> Clears centralized reports
 */

const fs = require('fs');
const path = require('path');

// Optional database pool (CockroachDB / PostgreSQL)
let pool = null;
let tableInitialized = false;

function getPool() {
  if (pool) return pool;
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  try {
    const { Pool } = require('pg');
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });
    return pool;
  } catch (err) {
    console.warn('[Vercel API] pg module initialization failed:', err.message);
    return null;
  }
}

async function ensureTable(p) {
  if (tableInitialized) return;
  const sql = `
    CREATE TABLE IF NOT EXISTS dhr_reports (
      id VARCHAR(120) PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    CREATE INDEX IF NOT EXISTS idx_dhr_reports_updated ON dhr_reports (updated_at DESC);
  `;
  await p.query(sql);
  tableInitialized = true;
}

// In serverless fallback environment, /tmp is writable across warm invocations
const TMP_FILE = path.join('/tmp', 'reports.json');
let memoryCache = null;

function loadLocalFallbackReports() {
  if (memoryCache) return memoryCache;

  try {
    if (fs.existsSync(TMP_FILE)) {
      const data = fs.readFileSync(TMP_FILE, 'utf-8');
      memoryCache = JSON.parse(data);
      return memoryCache;
    }
  } catch (err) {
    console.warn('[Vercel API] Error reading /tmp/reports.json:', err.message);
  }

  // Fallback: try reading from repo data/reports.json if bundled
  try {
    const localFile = path.join(process.cwd(), 'data', 'reports.json');
    if (fs.existsSync(localFile)) {
      const data = fs.readFileSync(localFile, 'utf-8');
      memoryCache = JSON.parse(data);
      return memoryCache;
    }
  } catch (err) {
    console.warn('[Vercel API] Error reading data/reports.json:', err.message);
  }

  memoryCache = [];
  return memoryCache;
}

function persistLocalFallbackReports(reports) {
  memoryCache = reports;
  try {
    fs.writeFileSync(TMP_FILE, JSON.stringify(reports, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Vercel API] Failed to write /tmp/reports.json:', err.message);
  }
}

module.exports = async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Cache-Control', 'no-store, max-age=0');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const p = getPool();
  const isCloudDB = Boolean(p);

  // Inform clients whether cloud persistence is active
  res.setHeader('X-DHR-Storage-Mode', isCloudDB ? 'CockroachDB-Cloud' : 'Serverless-Ephemeral');

  if (req.method === 'GET') {
    if (isCloudDB) {
      try {
        await ensureTable(p);
        const result = await p.query('SELECT data FROM dhr_reports ORDER BY updated_at DESC LIMIT 200;');
        const reports = result.rows.map((r) => r.data);
        return res.status(200).json(reports);
      } catch (err) {
        console.error('[Vercel API] CockroachDB query error, falling back to local:', err.message);
      }
    }

    const reports = loadLocalFallbackReports();
    return res.status(200).json(reports);
  }

  if (req.method === 'POST') {
    try {
      const report = req.body;
      if (!report || typeof report !== 'object') {
        return res.status(400).json({ error: 'Invalid report payload' });
      }

      if (!report.id) {
        report.id = 'REP-' + Date.now();
      }

      if (isCloudDB) {
        try {
          await ensureTable(p);
          const upsertSql = `
            INSERT INTO dhr_reports (id, data, updated_at)
            VALUES ($1, $2, NOW())
            ON CONFLICT (id) DO UPDATE
            SET data = EXCLUDED.data, updated_at = NOW();
          `;
          await p.query(upsertSql, [report.id, JSON.stringify(report)]);

          const countResult = await p.query('SELECT COUNT(*)::int AS count FROM dhr_reports;');
          return res.status(200).json({
            success: true,
            id: report.id,
            total: countResult.rows[0].count,
            storage: 'CockroachDB Cloud (Permanent)',
            message: 'Report committed to Central Dispatch Cloud Database',
          });
        } catch (dbErr) {
          console.error('[Vercel API] CockroachDB insert failed, writing to fallback:', dbErr.message);
        }
      }

      // Ephemeral fallback
      const reports = loadLocalFallbackReports();
      const idx = reports.findIndex((r) => r && r.id === report.id);
      if (idx !== -1) {
        reports[idx] = report;
      } else {
        reports.unshift(report);
      }
      persistLocalFallbackReports(reports);

      return res.status(200).json({
        success: true,
        id: report.id,
        total: reports.length,
        storage: 'Serverless /tmp (Ephemeral)',
        message: 'Report committed to Central Dispatch',
      });
    } catch (err) {
      console.error('[Vercel API] POST error:', err);
      return res.status(500).json({ error: 'Failed to process report: ' + err.message });
    }
  }

  if (req.method === 'DELETE') {
    if (isCloudDB) {
      try {
        await ensureTable(p);
        await p.query('TRUNCATE TABLE dhr_reports;');
        return res.status(200).json({ success: true, storage: 'CockroachDB', message: 'All central cloud reports cleared' });
      } catch (err) {
        console.error('[Vercel API] CockroachDB truncate error:', err.message);
      }
    }
    persistLocalFallbackReports([]);
    return res.status(200).json({ success: true, storage: 'Fallback', message: 'All central reports cleared' });
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
