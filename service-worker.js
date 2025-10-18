// Minimal service worker for PWA installability
// No caching strategy - just makes the app installable

self.addEventListener('install', (event) => {
  // Skip waiting to activate immediately
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  // Take control of all clients immediately
  event.waitUntil(self.clients.claim());
});

// Minimal fetch handler - just pass through to network
self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});
