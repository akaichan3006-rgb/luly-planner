// Luly Planner — Service Worker
// Cache-first for static assets, network-first for data

const CACHE_NAME = 'luly-planner-v8';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/styles.css',
  '/manifest.json',
  '/tweaks-panel.jsx',
  '/icons.jsx',
  '/data.jsx',
  '/events.jsx',
  '/ui.jsx',
  '/screen-login.jsx',
  '/screen-dashboard.jsx',
  '/screen-finance.jsx',
  '/screen-agenda.jsx',
  '/screen-tasks.jsx',
  '/screen-goals.jsx',
  '/screen-habits.jsx',
  '/screen-integrations.jsx',
  '/screen-investments.jsx',
  '/screen-settings.jsx',
  '/app.jsx',
  '/images/luly-logo.png',
  '/images/icon-192.png',
  '/images/icon-512.png',
  '/images/apple-touch-icon.png',
];

// External CDN assets
const CDN_ASSETS = [
  'https://unpkg.com/react@18.3.1/umd/react.development.js',
  'https://unpkg.com/react-dom@18.3.1/umd/react-dom.development.js',
  'https://unpkg.com/@babel/standalone@7.29.0/babel.min.js',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Instrument+Serif:ital@0;1&display=swap',
];

// ── Install: pre-cache static assets ──────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Cache local assets (critical)
      const localCache = cache.addAll(STATIC_ASSETS);
      // Cache CDN assets (best-effort)
      const cdnCache = Promise.allSettled(
        CDN_ASSETS.map((url) =>
          fetch(url, { mode: 'cors' })
            .then((res) => res.ok ? cache.put(url, res) : null)
            .catch(() => null)
        )
      );
      return Promise.all([localCache, cdnCache]);
    }).then(() => self.skipWaiting())
  );
});

// ── Activate: clean old caches ─────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ── Fetch: cache-first for static, network-first for API ──────────────────────
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET and chrome-extension requests
  if (request.method !== 'GET') return;
  if (url.protocol === 'chrome-extension:') return;

  // Network-first for Supabase/API calls
  if (url.hostname.includes('supabase') || url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .catch(() => caches.match(request))
    );
    return;
  }

  // Cache-first for everything else
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (!response || response.status !== 200) return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
        return response;
      }).catch(() => {
        // Offline fallback for navigation requests
        if (request.mode === 'navigate') return caches.match('/index.html');
      });
    })
  );
});

// ── Background sync placeholder (future: sync localStorage → Supabase) ────────
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    // Future: flush pending localStorage mutations to Supabase
    console.log('[SW] Background sync triggered');
  }
});

// ── Push notifications placeholder ────────────────────────────────────────────
self.addEventListener('push', (event) => {
  const data = event.data ? event.data.json() : { title: 'Luly Planner', body: '' };
  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/images/icon-192.png',
      badge: '/images/icon-72.png',
      vibrate: [100, 50, 100],
      data: { url: data.url || '/' },
    })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow(event.notification.data.url || '/')
  );
});
