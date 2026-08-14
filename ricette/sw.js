const CACHE_NAME = 'chef-ling-v3';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  './bau-32.png',
  './bau-192x192.png',
  './bau-512x512.png',
  './bau-180.png',
  './bau.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Proviamo a cachare, ma se uno fallisce non blocchiamo tutto
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'}))).catch(err => {
          console.log('Cache parziale, alcuni file mancano ma ok', err);
          // Prova uno a uno
          return Promise.allSettled(urlsToCache.map(u => cache.add(u).catch(e => console.log('Skip', u))));
        });
      })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))))
  );
  self.clients.claim();
});
console.log('SW Chef Ling ok');
