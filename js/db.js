/**
 * db.js — IndexedDB Module
 *
 * Handles all persistent storage for inspection reports.
 * Uses a single 'reports' object store with indexes for
 * section, severity, sync status, and timestamp.
 */

const DB_NAME = 'gangmans-logbook';
const DB_VERSION = 1;
const STORE_REPORTS = 'reports';

let _db = null;

/**
 * Open (or create) the IndexedDB database.
 * @returns {Promise<IDBDatabase>}
 */
function openDB() {
  if (_db) return Promise.resolve(_db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains(STORE_REPORTS)) {
        const store = db.createObjectStore(STORE_REPORTS, {
          keyPath: 'id',
          autoIncrement: false,
        });

        store.createIndex('section', 'section', { unique: false });
        store.createIndex('severity', 'severity', { unique: false });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('hazardType', 'hazardType', { unique: false });
      }
    };

    request.onsuccess = (event) => {
      _db = event.target.result;
      resolve(_db);
    };

    request.onerror = (event) => {
      console.error('[DB] Failed to open IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Generate a unique report ID.
 * Format: RPT-{timestamp}-{random}
 */
function generateReportId() {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `RPT-${ts}-${rand}`;
}

/**
 * Save a new inspection report.
 * @param {Object} report - The report data
 * @returns {Promise<string>} The report ID
 */
async function saveReport(report) {
  const db = await openDB();
  const id = generateReportId();

  const record = {
    id,
    ...report,
    timestamp: Date.now(),
    syncStatus: 'pending', // 'pending' | 'synced' | 'failed'
    createdAt: new Date().toISOString(),
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.add(record);

    request.onsuccess = () => resolve(id);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get a single report by ID.
 * @param {string} id
 * @returns {Promise<Object|null>}
 */
async function getReport(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readonly');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.get(id);

    request.onsuccess = () => resolve(request.result || null);
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get all reports, optionally filtered.
 * @param {Object} filters - { section, severity, syncStatus }
 * @returns {Promise<Array>}
 */
async function getAllReports(filters = {}) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readonly');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.getAll();

    request.onsuccess = () => {
      let results = request.result || [];

      // Apply filters
      if (filters.section && filters.section !== 'all') {
        results = results.filter((r) => r.section === filters.section);
      }
      if (filters.severity && filters.severity !== 'all') {
        results = results.filter((r) => r.severity === filters.severity);
      }
      if (filters.syncStatus) {
        results = results.filter((r) => r.syncStatus === filters.syncStatus);
      }

      // Sort by timestamp descending (most recent first)
      results.sort((a, b) => b.timestamp - a.timestamp);

      resolve(results);
    };

    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get reports created today.
 * @returns {Promise<Array>}
 */
async function getTodayReports() {
  const all = await getAllReports();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const startOfDay = today.getTime();

  return all.filter((r) => r.timestamp >= startOfDay);
}

/**
 * Get counts grouped by section and severity.
 * @returns {Promise<Object>} { sectionName: { critical: n, high: n, ... } }
 */
async function getSectionSummary() {
  const all = await getAllReports();
  const summary = {};

  all.forEach((report) => {
    const section = report.section || 'Unknown';
    if (!summary[section]) {
      summary[section] = { critical: 0, high: 0, medium: 0, low: 0, total: 0 };
    }
    summary[section][report.severity] = (summary[section][report.severity] || 0) + 1;
    summary[section].total += 1;
  });

  return summary;
}

/**
 * Update the sync status of a report.
 * @param {string} id
 * @param {'pending'|'synced'|'failed'} status
 */
async function updateSyncStatus(id, status) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const report = getReq.result;
      if (report) {
        report.syncStatus = status;
        report.syncedAt = status === 'synced' ? new Date().toISOString() : null;
        const putReq = store.put(report);
        putReq.onsuccess = () => resolve();
        putReq.onerror = (event) => reject(event.target.error);
      } else {
        reject(new Error('Report not found'));
      }
    };

    getReq.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Get pending (un-synced) reports.
 * @returns {Promise<Array>}
 */
async function getPendingReports() {
  return getAllReports({ syncStatus: 'pending' });
}

/**
 * Delete a report by ID.
 * @param {string} id
 */
async function deleteReport(id) {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Delete all reports in the database.
 * @returns {Promise<void>}
 */
async function clearAllReports() {
  const db = await openDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    const request = store.clear();

    request.onsuccess = () => {
      console.log('[DB] Cleared all reports');
      resolve();
    };
    request.onerror = (event) => reject(event.target.error);
  });
}

/**
 * Merge reports received from the central server into IndexedDB.
 * @param {Array<Object>} remoteReports
 * @returns {Promise<number>} Number of reports merged
 */
async function mergeRemoteReports(remoteReports) {
  if (!Array.isArray(remoteReports) || remoteReports.length === 0) return 0;
  const db = await openDB();

  return new Promise((resolve) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);
    let count = 0;

    remoteReports.forEach((rpt) => {
      if (rpt && rpt.id) {
        // Mark as synced locally since it exists on the central server
        const copy = { ...rpt, syncStatus: 'synced' };
        store.put(copy);
        count++;
      }
    });

    tx.oncomplete = () => {
      console.log(`[DB] Merged ${count} reports from central dispatch`);
      resolve(count);
    };
    tx.onerror = (e) => {
      console.warn('[DB] Failed to merge remote reports:', e);
      resolve(0);
    };
  });
}

/**
 * Generate a representative SVG data URL for demo hazards.
 */
function createDemoHazardImage(type, title) {
  const bgColors = {
    slip: '#5c3a21',
    rockfall: '#475569',
    drain: '#1e3a8a',
    wall: '#78350f',
    track: '#334155',
  };
  const icons = {
    slip: '⛰️',
    rockfall: '🪨',
    drain: '🌊',
    wall: '🧱',
    track: '🛤️',
  };
  const bg = bgColors[type] || '#1e293b';
  const icon = icons[type] || '⚠️';

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300" viewBox="0 0 400 300">
    <rect width="400" height="300" fill="${bg}"/>
    <line x1="50" y1="280" x2="350" y2="280" stroke="#94a3b8" stroke-width="8"/>
    <line x1="70" y1="250" x2="330" y2="250" stroke="#94a3b8" stroke-width="6"/>
    <text x="200" y="140" font-size="72" text-anchor="middle">${icon}</text>
    <rect x="20" y="20" width="360" height="40" rx="8" fill="rgba(0,0,0,0.6)"/>
    <text x="200" y="46" font-family="sans-serif" font-size="16" font-weight="bold" fill="#f8fafc" text-anchor="middle">DHR PATROL — ${title}</text>
  </svg>`;

  return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
}

/**
 * Seed sample DHR inspection reports for demonstration.
 */
async function seedDemoReports() {
  const db = await openDB();
  const existing = await getAllReports();
  if (existing.length > 0) {
    console.log('[DB] Reports already exist, skipping auto-seed');
    return existing.length;
  }

  const now = Date.now();
  const sampleReports = [
    {
      id: 'RPT-DHR-82K-SLIP',
      hazardType: 'slip',
      severity: 'critical',
      section: 'BatasiaLoop-Darjeeling',
      passable: 'no',
      km: 82.4,
      coords: { lat: 27.0235, lng: 88.2538 },
      notes: 'Major mudslip above Batasia Loop outer curve following heavy monsoon overnight. ~15m track covered in wet silt.',
      aiNote: 'CRITICAL severity slip observed in Batasia Loop – Darjeeling near KM 82.4. Track NOT passable — emergency line block required. IMMEDIATE ACTION REQUIRED — notify Kurseong Control.',
      photo: createDemoHazardImage('slip', 'Batasia Loop Mudslip KM 82.4'),
      syncStatus: 'synced',
      timestamp: now - (2 * 3600 * 1000), // 2h ago
      createdAt: new Date(now - (2 * 3600 * 1000)).toISOString(),
    },
    {
      id: 'RPT-DHR-42K-ROCK',
      hazardType: 'rockfall',
      severity: 'high',
      section: 'Gayabari-Mahanadi',
      passable: 'caution',
      km: 42.1,
      coords: { lat: 26.9142, lng: 88.2975 },
      notes: 'Pagla Jhora stretch: Large granite boulder dislodged from cliff, resting 0.5m from outer rail. Shaling required.',
      aiNote: 'HIGH severity rockfall observed near Pagla Jhora (KM 42.1). Track passable with caution — caution order 10 km/h advised. Urgent attention required.',
      photo: createDemoHazardImage('rockfall', 'Pagla Jhora Boulder KM 42.1'),
      syncStatus: 'pending',
      timestamp: now - (45 * 60 * 1000), // 45m ago
      createdAt: new Date(now - (45 * 60 * 1000)).toISOString(),
    },
    {
      id: 'RPT-DHR-18K-DRAN',
      hazardType: 'drain',
      severity: 'medium',
      section: 'Sukna-Rangtong',
      passable: 'yes',
      km: 19.8,
      coords: { lat: 26.8621, lng: 88.3382 },
      notes: 'Catchwater drain clogged with fallen bamboo and mountain gravel near Hill Cart Road crossing.',
      aiNote: 'MEDIUM severity blocked drain observed in Sukna – Rangtong section. Track remains passable. Schedule permanent-way clearance within 48 hours.',
      photo: createDemoHazardImage('drain', 'Sukna Catchwater Drain KM 19.8'),
      syncStatus: 'pending',
      timestamp: now - (15 * 60 * 1000), // 15m ago
      createdAt: new Date(now - (15 * 60 * 1000)).toISOString(),
    },
    {
      id: 'RPT-DHR-51K-WALL',
      hazardType: 'wall',
      severity: 'high',
      section: 'Kurseong-Tung',
      passable: 'caution',
      km: 52.6,
      coords: { lat: 26.8842, lng: 26.8842 },
      notes: 'Stone masonry retaining wall shows vertical shear crack 2cm wide. Slight outward bulge noted.',
      aiNote: 'HIGH severity damaged wall in Kurseong – Tung section near KM 52.6. Track passable with caution. Notify Assistant Divisional Engineer.',
      photo: createDemoHazardImage('wall', 'Kurseong Retaining Wall KM 52.6'),
      syncStatus: 'synced',
      timestamp: now - (5 * 3600 * 1000),
      createdAt: new Date(now - (5 * 3600 * 1000)).toISOString(),
    },
  ];

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_REPORTS, 'readwrite');
    const store = tx.objectStore(STORE_REPORTS);

    sampleReports.forEach((rpt) => store.add(rpt));

    tx.oncomplete = () => {
      console.log('[DB] Seeded 4 sample DHR patrol reports');
      resolve(sampleReports.length);
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

// Export for use in other modules
window.DB = {
  openDB,
  saveReport,
  getReport,
  getAllReports,
  getTodayReports,
  getSectionSummary,
  updateSyncStatus,
  getPendingReports,
  deleteReport,
  clearAllReports,
  mergeRemoteReports,
  seedDemoReports,
  createDemoHazardImage,
};

