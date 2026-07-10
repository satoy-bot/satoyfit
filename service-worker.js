const CACHE_NAME = 'satoyfit-v1';
const ASSETS = [
  './index.html',
  './manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request).catch(() => cached))
  );
});

// Weekly export reminder: fire if last export was >7 days ago or never
self.addEventListener('message', e => {
  if (e.data && e.data.type === 'CHECK_EXPORT_REMINDER') {
    const last = e.data.lastExport || 0;
    const daysSince = (Date.now() - last) / 864e5;
    if (daysSince >= 7) {
      self.registration.showNotification('SatoyFit — Back up your data', {
        body: 'It\'s been a week. Export your workout data so you don\'t lose your streak.',
        icon: './icon-192.png',
        badge: './icon-192.png',
        tag: 'export-reminder',
        renotify: false,
        actions: [{ action: 'export', title: '📥 Export Now' }]
      }).catch(() => {});
    }
  }
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'export') {
    e.waitUntil(
      self.clients.matchAll({ type: 'window' }).then(clients => {
        if (clients.length) {
          clients[0].focus();
          clients[0].postMessage({ type: 'TRIGGER_EXPORT' });
        } else {
          self.clients.openWindow('./index.html#export');
        }
      })
    );
  } else {
    e.waitUntil(self.clients.openWindow('./index.html'));
  }
});
