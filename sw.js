const CACHE_NAME = 'vivi-pwa-v6';
const APP_SHELL = [
  './', './index.html', './quotes.html', './project.html', './machine.html',
  './contact.html', './styles.css', './nav.js', './dog.svg',
  './plain-image-32x31-69b9d3-rectangle.png', './%E5%BE%AE%E4%BF%A1%E5%A4%B4%E5%83%8F.jpg', './app-icon-192.png', './app-icon-512.png', './apple-touch-icon.png', './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(
    keys.filter((key) => key.startsWith('vivi-pwa-') && key !== CACHE_NAME).map((key) => caches.delete(key))
  )));
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  event.respondWith(caches.match(request).then((cached) => cached || fetch(request).then((response) => {
    if (response.ok) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  })));
});