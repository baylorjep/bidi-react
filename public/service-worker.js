// const CACHE_NAME = 'bidi-cache-v1';
// const urlsToCache = [
//   '/',
//   '/index.html',
//   '/static/js/main.chunk.js',
//   '/static/js/0.chunk.js',
//   '/static/js/bundle.js',
//   '/manifest.json',
//   '/favicon.ico',
//   '/logo192.png',
//   '/logo512.png'
// ];

// // Install event - cache static assets
// self.addEventListener('install', event => {
//   event.waitUntil(
//     caches.open(CACHE_NAME)
//       .then(cache => cache.addAll(urlsToCache))
//   );
// });

// // Activate event - clean up old caches
// self.addEventListener("activate", (event) => {
//   event.waitUntil(
//     caches.keys().then((cacheNames) => {
//       return Promise.all(
//         cacheNames
//           .filter((name) => name !== CACHE_NAME)
//           .map((name) => caches.delete(name))
//       );
//     })
//   );
// });

// // Fetch event - handle image requests
// self.addEventListener('fetch', event => {
//   event.respondWith(
//     caches.match(event.request)
//       .then(response => {
//         if (response) {
//           return response;
//         }
//         return fetch(event.request);
//       })
//   );
// });

self.addEventListener("push", function (event) {
  const options = {
    body: event.data.text(),
    icon: "/Bidi-Favicon.png",
    badge: "/Bidi-Favicon.png",
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
    },
  };

  event.waitUntil(
    self.registration.showNotification("Bidi Notification", options)
  );
});

// Handle notification click
self.addEventListener("notificationclick", function (event) {
  event.notification.close();
  event.waitUntil(clients.openWindow("/open-requests"));
});
