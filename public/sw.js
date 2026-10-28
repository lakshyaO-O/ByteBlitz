const CACHE_NAME = 'devrann-shell-v2';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(['/', '/manifest.webmanifest', '/logo.svg'])).catch(() => undefined)
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
  self.clients.claim();
});

// NOTE: intentionally NO fetch handler.
// The previous cache-everything proxy refetched through the worker, which
// (a) applied the install-time CSP to Firebase/Google auth fetches and blocked
//     Google sign-in with connect-src violations (`auth/internal-error`), and
// (b) served stale HTML/JS from `devrann-shell-v1` indefinitely because sw.js
//     bytes never changed, so Chrome never reinstalled it with new headers.
// Without a fetch handler every request goes straight to the network.
