const CACHE_NAME = 'chef-ling-v3.3-root';
const urlsToCache = [
  './',
  './index.html',
  './manifest.json',
  '../bau-32.png',
  '../bau-192x192.png',
  '../bau-512x512.png',
  '../bau-180.png',
  '../bau.ico'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'}))).catch(err => {
          console.log('Cache parziale, alcuni file mancano ma ok', err);
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
console.log('SW Chef Ling v3.3 root ok');
