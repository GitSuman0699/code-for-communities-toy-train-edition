/**
 * Service Worker — Gangman's Logbook
 *
 * Strategy:
 *   - App shell & static assets: Network-first when online, Cache fallback when offline
 *   - Google Fonts: Cache-first with network fallback
 *   - Offline navigation: Fallback to cached index.html
 *   - API / sync: Background Sync queue
 */

const CACHE_NAME = 'gangmans-log-v8';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './css/styles.css',
  './js/i18n.js',
  './js/app.js',
  './js/db.js',
  './js/geo.js',
  './js/camera.js',
  './js/ai.js',
  './js/sync.js',
  './js/dashboard.js',
  './manifest.json',
  './assets/icons/favicon.svg',
  './assets/icons/icon-192.png',
  './assets/icons/icon-512.png',
];

// ─── Install: Precache app shell ────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[SW] Precaching app shell (v5)');
      return cache.addAll(PRECACHE_ASSETS);
    })
  );
  self.skipWaiting();
});

// ─── Activate: Clean old caches ─────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== 'fonts-cache')
          .map((key) => {
            console.log('[SW] Deleting old cache:', key);
            return caches.delete(key);
          })
      )
    )
  );
  self.clients.claim();
});

// ─── Fetch: Network-first for app shell, cache fallback for offline ─
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Google Fonts — cache-first with network fallback
  if (url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com') {
    event.respondWith(
      caches.open('fonts-cache').then((cache) =>
        cache.match(request).then((cached) => {
          if (cached) return cached;
          return fetch(request).then((response) => {
            cache.put(request, response.clone());
            return response;
          }).catch(() => cached);
        })
      )
    );
    return;
  }

  // App shell & static assets — Network-first, fallback to cache when offline
  if (url.origin === location.origin) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.ok) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          // Offline fallback
          return caches.match(request).then((cached) => {
            if (cached) return cached;
            if (request.mode === 'navigate') {
              return caches.match('./index.html') || caches.match('./');
            }
          });
        })
    );
    return;
  }
});

// ─── Background Sync: Retry queued reports ──────────────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-reports') {
    event.waitUntil(syncReports());
  }
});

async function syncReports() {
  const clients = await self.clients.matchAll();
  clients.forEach((client) => {
    client.postMessage({ type: 'SYNC_TRIGGERED' });
  });
}

// ─── Messages from the app ─────────────────────────────────
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
