// Service Worker - Assistente Vocale - Holly & Rex
// Scope: /Telefono/ - Cache isolata, nessuna dipendenza da altre app
const CACHE_NAME = 'assistente-vocale-v1';
const ASSETS = [
  './',
  './assistente-vocale.html',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // Network first per API vocali, Cache first per shell
  if (e.request.url.includes('/api/') || e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => cached || fetch(e.request).then((res) => {
      const clone = res.clone();
      caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
      return res;
    }))
  );
});
// Gestione delle notifiche Push in arrivo da Firebase
self.addEventListener('push', (event) => {
  if (!event.data) return;
  
  const dati = event.data.json();
  const titolo = dati.notification?.title || 'Holly & Rex - Assistente';
  const messaggio = dati.notification?.body || 'Nuovo messaggio in arrivo';

  const opzioni = {
    body: messaggio,
    icon: './bau-192x192.png',
    badge: './bau-32.png',
    vibrate: [200, 100, 200]
  };

  event.waitUntil(
    self.registration.showNotification(titolo, opzioni)
  );
});

// Gestione del click sulla notifica per riaprire l'assistente
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('./assistente-vocale.html')
  );
});