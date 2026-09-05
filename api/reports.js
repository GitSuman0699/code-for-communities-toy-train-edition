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

// In serverless environment, /tmp is writable across warm invocations
const TMP_FILE = path.join('/tmp', 'reports.json');

// In-memory cache for fast warm-lambda retrieval
let memoryCache = null;

function loadReports() {
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

function persistReports(reports) {
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

  if (req.method === 'GET') {
    const reports = loadReports();
    return res.status(200).json(reports);
  }

  if (req.method === 'POST') {
    try {
      const report = req.body;
      if (!report || typeof report !== 'object') {
        return res.status(400).json({ error: 'Invalid report payload' });
      }

      const reports = loadReports();

      // Upsert: replace if existing ID, otherwise insert at top
      const idx = reports.findIndex((r) => r && r.id === report.id);
      if (idx !== -1) {
        reports[idx] = report;
      } else {
        reports.unshift(report);
      }

      persistReports(reports);

      return res.status(200).json({
        success: true,
        id: report.id,
        total: reports.length,
        message: 'Report committed to Central Dispatch',
      });
    } catch (err) {
      console.error('[Vercel API] POST error:', err);
      return res.status(500).json({ error: 'Failed to process report: ' + err.message });
    }
  }

  if (req.method === 'DELETE') {
    persistReports([]);
    return res.status(200).json({ success: true, message: 'All central reports cleared' });
  }

  return res.status(405).json({ error: `Method ${req.method} Not Allowed` });
};
