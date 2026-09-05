/**
 * geo.js — Geolocation Module
 *
 * Handles GPS coordinate acquisition for tagging reports
 * with their position along the DHR alignment.
 */

const GEO_OPTIONS = {
  enableHighAccuracy: true,
  timeout: 15000,
  maximumAge: 30000, // Accept cached positions up to 30s old
};

let _currentPosition = null;
let _watchId = null;

/**
 * Get the current GPS position.
 * @returns {Promise<{lat: number, lng: number, accuracy: number, altitude: number|null}>}
 */
function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new Error('Geolocation API not supported'));
      return;
    }

    // Try high accuracy first (GPS satellites)
    navigator.geolocation.getCurrentPosition(
      (position) => {
        _currentPosition = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          altitude: position.coords.altitude,
          timestamp: position.timestamp,
        };
        resolve(_currentPosition);
      },
      (error) => {
        console.warn('[GEO] High accuracy GPS failed, falling back to cell/wifi location:', error.message);
        // Fast fallback to cell/wifi location
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            _currentPosition = {
              lat: pos.coords.latitude,
              lng: pos.coords.longitude,
              accuracy: pos.coords.accuracy,
              altitude: pos.coords.altitude,
              timestamp: pos.timestamp,
            };
            resolve(_currentPosition);
          },
          (error2) => {
            console.warn('[GEO] Network geolocation also failed:', error2.message);
            reject(error2);
          },
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 60000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 15000 }
    );
  });
}

/**
 * Start watching the position (for continuous updates).
 * @param {Function} onUpdate - Called with position object on each update
 * @param {Function} onError - Called on errors
 */
function startWatching(onUpdate, onError) {
  if (!('geolocation' in navigator)) {
    if (onError) onError(new Error('Geolocation API not supported'));
    return;
  }

  stopWatching(); // Clear any existing watch

  _watchId = navigator.geolocation.watchPosition(
    (position) => {
      _currentPosition = {
        lat: position.coords.latitude,
        lng: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        timestamp: position.timestamp,
      };
      if (onUpdate) onUpdate(_currentPosition);
    },
    (error) => {
      console.warn('[GEO] Watch error:', error.message);
      if (onError) onError(error);
    },
    GEO_OPTIONS
  );
}

/**
 * Stop watching position.
 */
function stopWatching() {
  if (_watchId !== null) {
    navigator.geolocation.clearWatch(_watchId);
    _watchId = null;
  }
}

/**
 * Get the last known position without making a new request.
 * @returns {{lat, lng, accuracy, altitude, timestamp}|null}
 */
function getLastPosition() {
  return _currentPosition;
}

/**
 * Format coordinates for display.
 * @param {number} lat
 * @param {number} lng
 * @returns {string}
 */
function formatCoords(lat, lng) {
  return `${lat.toFixed(6)}°N, ${lng.toFixed(6)}°E`;
}

/**
 * Estimate the approximate KM marker along the DHR line
 * based on proximity to known station coordinates.
 *
 * This is a rough estimate using nearest-station interpolation.
 * Stations along the NJP → Darjeeling route with approximate km markers.
 */
const DHR_STATIONS = [
  { name: 'New Jalpaiguri',  km: 0,    lat: 26.7086, lng: 88.4297 },
  { name: 'Siliguri Town',   km: 5,    lat: 26.7271, lng: 88.4337 },
  { name: 'Siliguri Jn',     km: 8,    lat: 26.7093, lng: 88.4283 },
  { name: 'Sukna',           km: 18,   lat: 26.8575, lng: 88.3450 },
  { name: 'Rangtong',        km: 26,   lat: 26.8770, lng: 88.3195 },
  { name: 'Tindharia',       km: 32,   lat: 26.8881, lng: 88.3097 },
  { name: 'Gayabari',        km: 39,   lat: 26.9070, lng: 88.3019 },
  { name: 'Mahanadi',        km: 45,   lat: 26.9200, lng: 88.2913 },
  { name: 'Kurseong',        km: 51,   lat: 26.8765, lng: 88.2780 },
  { name: 'Tung',            km: 57,   lat: 26.9020, lng: 88.2650 },
  { name: 'Sonada',          km: 63,   lat: 26.9527, lng: 88.2652 },
  { name: 'Jor Bunglow',     km: 72,   lat: 26.9820, lng: 88.2560 },
  { name: 'Ghum',            km: 78,   lat: 27.0120, lng: 88.2560 },
  { name: 'Batasia Loop',    km: 82,   lat: 27.0230, lng: 88.2540 },
  { name: 'Darjeeling',      km: 88,   lat: 27.0410, lng: 88.2627 },
];

// 13 Consecutive Track Sections with Stations and KM boundaries
const DHR_TRACK_SECTIONS = [
  { section: 'NJP-Siliguri',          startKm: 0,  endKm: 5,  from: 'New Jalpaiguri', to: 'Siliguri Town', lat1: 26.7086, lng1: 88.4297, lat2: 26.7271, lng2: 88.4337 },
  { section: 'Siliguri-Sukna',        startKm: 5,  endKm: 18, from: 'Siliguri Town',  to: 'Sukna',         lat1: 26.7271, lng1: 88.4337, lat2: 26.8575, lng2: 88.3450 },
  { section: 'Sukna-Rangtong',        startKm: 18, endKm: 26, from: 'Sukna',          to: 'Rangtong',      lat1: 26.8575, lng1: 88.3450, lat2: 26.8770, lng2: 88.3195 },
  { section: 'Rangtong-Tindharia',    startKm: 26, endKm: 32, from: 'Rangtong',       to: 'Tindharia',     lat1: 26.8770, lng1: 88.3195, lat2: 26.8881, lng2: 88.3097 },
  { section: 'Tindharia-Gayabari',    startKm: 32, endKm: 39, from: 'Tindharia',      to: 'Gayabari',      lat1: 26.8881, lng1: 88.3097, lat2: 26.9070, lng2: 88.3019 },
  { section: 'Gayabari-Mahanadi',     startKm: 39, endKm: 45, from: 'Gayabari',       to: 'Mahanadi',      lat1: 26.9070, lng1: 88.3019, lat2: 26.9200, lng2: 88.2913 },
  { section: 'Mahanadi-Kurseong',     startKm: 45, endKm: 51, from: 'Mahanadi',       to: 'Kurseong',      lat1: 26.9200, lng1: 88.2913, lat2: 26.8765, lng2: 88.2780 },
  { section: 'Kurseong-Tung',         startKm: 51, endKm: 57, from: 'Kurseong',       to: 'Tung',          lat1: 26.8765, lng1: 88.2780, lat2: 26.9020, lng2: 88.2650 },
  { section: 'Tung-Sonada',           startKm: 57, endKm: 63, from: 'Tung',           to: 'Sonada',        lat1: 26.9020, lng1: 88.2650, lat2: 26.9527, lng2: 88.2652 },
  { section: 'Sonada-Jorbunglow',     startKm: 63, endKm: 72, from: 'Sonada',         to: 'Jor Bunglow',   lat1: 26.9527, lng1: 88.2652, lat2: 26.9820, lng2: 88.2560 },
  { section: 'Jorbunglow-Ghum',       startKm: 72, endKm: 78, from: 'Jor Bunglow',    to: 'Ghum',          lat1: 26.9820, lng1: 88.2560, lat2: 27.0120, lng2: 88.2560 },
  { section: 'Ghum-BatasiaLoop',      startKm: 78, endKm: 82, from: 'Ghum',           to: 'Batasia Loop',  lat1: 27.0120, lng1: 88.2560, lat2: 27.0230, lng2: 88.2540 },
  { section: 'BatasiaLoop-Darjeeling',startKm: 82, endKm: 88, from: 'Batasia Loop',   to: 'Darjeeling',    lat1: 27.0230, lng1: 88.2540, lat2: 27.0410, lng2: 88.2627 },
];

const DHR_PRESETS = [
  { name: 'Batasia Loop', km: 82.4, lat: 27.0235, lng: 88.2538, section: 'BatasiaLoop-Darjeeling', key: 'Batasia Loop' },
  { name: 'Ghum (Highest Station)', km: 78.0, lat: 27.0120, lng: 88.2560, section: 'Jorbunglow-Ghum', key: 'Ghum' },
  { name: 'Kurseong Junction', km: 51.0, lat: 26.8765, lng: 88.2780, section: 'Mahanadi-Kurseong', key: 'Kurseong' },
  { name: 'Pagla Jhora (Landslide Zone)', km: 42.1, lat: 26.9142, lng: 88.2975, section: 'Gayabari-Mahanadi', key: 'Pagla Jhora' },
  { name: 'Tindharia Workshop', km: 32.0, lat: 26.8881, lng: 88.3097, section: 'Rangtong-Tindharia', key: 'Tindharia' },
  { name: 'Sukna (Plain to Hill Entry)', km: 18.2, lat: 26.8575, lng: 88.3450, section: 'Sukna-Rangtong', key: 'Sukna' },
];

/**
 * Estimate the nearest station, approximate KM, track section, and closest preset
 * by projecting coordinates onto the DHR railway alignment.
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {{ station: string, km: number, section: string, nearestPreset: string, distance: number }}
 */
function estimateKM(lat, lng) {
  let bestDist = Infinity;
  let bestSection = DHR_TRACK_SECTIONS[0].section;
  let bestKm = 0;
  let nearestStationName = 'New Jalpaiguri';

  const cosLat = Math.cos(toRad(26.9)); // mean latitude factor for projection

  // Find closest track segment
  DHR_TRACK_SECTIONS.forEach((seg) => {
    const dx = (lng - seg.lng1) * cosLat;
    const dy = lat - seg.lat1;
    const segDx = (seg.lng2 - seg.lng1) * cosLat;
    const segDy = seg.lat2 - seg.lat1;
    const segLenSq = segDx * segDx + segDy * segDy;

    let t = 0;
    if (segLenSq > 0) {
      t = Math.max(0, Math.min(1, (dx * segDx + dy * segDy) / segLenSq));
    }

    const projLat = seg.lat1 + t * (seg.lat2 - seg.lat1);
    const projLng = seg.lng1 + t * (seg.lng2 - seg.lng1);
    const dist = haversineDistance(lat, lng, projLat, projLng);

    if (dist < bestDist) {
      bestDist = dist;
      bestSection = seg.section;
      bestKm = Math.round((seg.startKm + t * (seg.endKm - seg.startKm)) * 10) / 10;
      nearestStationName = t < 0.5 ? seg.from : seg.to;
    }
  });

  // Find nearest DHR preset pill to match UI data-station attribute
  let minPresetDist = Infinity;
  let nearestPresetKey = 'Batasia Loop';
  DHR_PRESETS.forEach((preset) => {
    const pDist = haversineDistance(lat, lng, preset.lat, preset.lng);
    if (pDist < minPresetDist) {
      minPresetDist = pDist;
      nearestPresetKey = preset.key;
    }
  });

  return {
    station: nearestStationName,
    km: bestKm,
    section: bestSection,
    nearestPreset: nearestPresetKey,
    distance: Math.round(bestDist),
  };
}

/**
 * Haversine distance in metres.
 */
function haversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth radius in metres
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function toRad(deg) {
  return (deg * Math.PI) / 180;
}

// Export
window.GEO = {
  getCurrentPosition,
  startWatching,
  stopWatching,
  getLastPosition,
  formatCoords,
  estimateKM,
  DHR_STATIONS,
  DHR_TRACK_SECTIONS,
  DHR_PRESETS,
};
