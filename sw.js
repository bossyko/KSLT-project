/**
 * ОФЛАЙН-СЛУЖБА КСЛТ.
 *
 * ДО 22.10 ОНА НЕ РАБОТАЛА НИ РАЗУ НА БОЕВОЙ, и это замерено, а не
 * предположено: зарегистрированных служб НОЛЬ, кэшей НОЛЬ.
 *
 * Две поломки подряд, и каждой хватало в одиночку:
 *   1. `js/script.js` просил службу по адресу от КОРНЯ ДОМЕНА — на боевой
 *      это `bossyko.github.io/sw.js`, то есть 404. Ошибка глушилась пустым
 *      `.catch()`, поэтому её не видел никто, кроме консоли.
 *   2. Все семь путей здесь тоже шли от корня домена. `cache.addAll`
 *      АТОМАРЕН — проверено в браузере: один мёртвый адрес отклоняет весь
 *      набор, и в кэш не попадает НИЧЕГО, даже живое. Значит починка
 *      первой поломки в одиночку ничего бы не дала: установка падала бы
 *      здесь.
 *
 * ПУТИ ЗДЕСЬ ОТНОСИТЕЛЬНЫЕ, И ЭТО НЕ УКРАШЕНИЕ. Служба лежит в корне
 * проекта, и браузер разрешает их относительно ЕЁ адреса — значит они
 * верны и на `localhost`, где корень проекта совпадает с корнем сайта, и
 * на боевой, где проект живёт в подпапке. ЛОКАЛЬНАЯ И БОЕВАЯ РАЗЛИЧАЮТСЯ
 * ИМЕННО КОРНЕМ (кусок 132).
 */
var CACHE_NAME = 'kslt-v7';

/* ОТНОСИТЕЛЬНО СЕБЯ: служба лежит в корне проекта, и это единственное
   место, где корень известен без вычислений. */
var PRE_CACHE = [
  'favicon.svg',
  'css/style.css',
  'js/script.js',
  'js/supabase-config.js',
  'js/auth-nav.js',
  'images/icons/icon-192.png',
  'images/icons/icon-512.png'
];

/* Путь проекта — '/' на localhost, '/KSLT-project/' на боевой. */
var КОРЕНЬ = new URL('./', self.location.href).pathname;

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

  /* АДМИНКА МИМО КЭША — но спрашиваем ОТНОСИТЕЛЬНО СВОЕГО КОРНЯ, а не
     от корня домена. Прежняя проверка искала '/admin' в полном пути: на
     боевой она срабатывала случайно, потому что подпапка проекта стоит
     перед ним. Замерено: обе проверки отсекают одни и те же 28 файлов,
     и ни одна не ловит стенды вида `otstupy-admin-zamer.html`. */
  var свой = url.pathname.indexOf(КОРЕНЬ) === 0
      ? url.pathname.slice(КОРЕНЬ.length)
      : null;
  if (свой === null) return;
  if (/(?:^|\/)admin/.test(свой)) return;

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

  // CSS, JS: Network First (always fresh, offline fallback)
  if (/\.(css|js)$/.test(url.pathname)) {
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

  // Images, fonts: Cache First (fast load, network fallback)
  if (/\.(png|jpg|jpeg|webp|svg|woff2?|ttf)$/.test(url.pathname)) {
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
