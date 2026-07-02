const CACHE = 'u2b-takuma-v1';

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

self.addEventListener('fetch', e => {
  // Cache static assets only
  if (e.request.url.includes('/api/')) return;
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener('push', e => {
  const data = e.data?.json() || {};
  const title = data.title || '🔔 Новый заказ!';
  const body = data.body || 'Клиент сделал заказ';
  
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icon-192.png',
      badge: '/icon-192.png',
      vibrate: [200, 100, 200],
      data: { url: '/admin' },
      actions: [
        { action: 'view', title: '👁 Посмотреть' },
        { action: 'close', title: '✕ Закрыть' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'view' || !e.action) {
    e.waitUntil(
      clients.matchAll({ type: 'window' }).then(cs => {
        if (cs.length > 0) {
          cs[0].focus();
          cs[0].navigate('/admin');
        } else {
          clients.openWindow('/admin');
        }
      })
    );
  }
});
