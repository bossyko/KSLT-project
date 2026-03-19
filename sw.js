var CACHE_NAME = 'kslt-v1';

var PRE_CACHE = [
  '/favicon.svg',
  '/css/style.css',
  '/js/script.js',
  '/js/supabase-config.js',
  '/js/auth-nav.js',
  '/images/icons/icon-192.png',
  '/images/icons/icon-512.png'
];

// Install: pre-cache core assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(PRE_CACHE);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(names) {
      return Promise.all(
        names.filter(function(n) { return n !== CACHE_NAME; })
             .map(function(n) { return caches.delete(n); })
      );
    })
  );
  self.clients.claim();
});

// Fetch strategy
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // Skip: non-GET, Supabase API, CDN, admin files, chrome-extension
  if (e.request.method !== 'GET') return;
  if (url.hostname !== self.location.hostname) return;
  if (url.pathname.indexOf('/admin') !== -1) return;

  // HTML: Network First (fresh content, offline fallback)
  if (e.request.headers.get('accept') && e.request.headers.get('accept').indexOf('text/html') !== -1) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // CSS, JS, images, fonts: Cache First (fast load, network fallback)
  if (/\.(css|js|png|jpg|jpeg|webp|svg|woff2?|ttf)$/.test(url.pathname)) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        if (cached) return cached;
        return fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }
});
