// ============================================
// KSLT Mobile — фотографии внутри новости
// ============================================
//
// То же, что на сайте: больше двух снимков не выкладываются столбиком —
// читатель прокручивает их вместо того, чтобы читать. Показываем один крупно,
// остальные лентой под ним, по нажатию — во весь экран.
//
// Отличие от сайта одно: там листают стрелками и клавишами, здесь пальцем.
// И полноэкранный просмотр обязан закрываться кнопкой «назад» на телефоне,
// иначе она свернёт всё приложение.
(function() {
  'use strict';

  var M = window.KSLT_NEWS_MEDIA = {};

  var SWIPE = 40;   // px, меньше — срабатывает на обычной прокрутке

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /** Разметка галереи под текстом новости. */
  M.render = function(gallery) {
    if (!gallery || !gallery.length) return '';

    if (gallery.length > 2) {
      return '<div class="nm-carousel">' +
          '<div class="nm-stage">' +
            '<img class="nm-main" src="' + esc(gallery[0]) + '" alt="" data-index="0">' +
            '<div class="nm-count">1 / ' + gallery.length + '</div>' +
          '</div>' +
          '<div class="nm-thumbs">' +
            gallery.map(function(url, i) {
              return '<button type="button" class="nm-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
                '<img src="' + esc(url) + '" alt="" loading="lazy">' +
              '</button>';
            }).join('') +
          '</div>' +
        '</div>';
    }

    return '<div class="nm-grid">' +
      gallery.map(function(url) {
        return '<img class="nm-grid-item" src="' + esc(url) + '" alt="" loading="lazy">';
      }).join('') +
    '</div>';
  };

  /** Открывает снимок во весь экран — нужен и шапке новости, не только галерее. */
  M.open = function(urls, index) { open(urls, index || 0); };

  /** Оживляет разметку: листание ленты и просмотр во весь экран. */
  M.init = function(root, gallery) {
    if (!root) return;
    собратьСнимкиВТексте(root);
    initCarousel(root, gallery || []);
    initViewer(root, gallery || []);
  };

  /**
   * Снимки, идущие в тексте подряд, показываем галереей — крупный кадр и
   * лента миниатюр, как на сайте. Раньше они шли столбиком на всю ширину, и
   * человек прокручивал десяток фотографий вместо того, чтобы читать.
   *
   * Одиночный снимок остаётся снимком: галерея из одного кадра ни к чему.
   */
  function собратьСнимкиВТексте(root) {
    var тело = root.querySelector('.nd-body');
    if (!тело) return;

    var дети = Array.prototype.slice.call(тело.children);
    var набор = [];

    function закрыть() {
      if (набор.length < 2) { набор = []; return; }
      var адреса = набор.map(function(f) { return f.querySelector('img').src; });
      var блок = document.createElement('div');
      блок.className = 'nm-carousel';
      блок.dataset.photos = JSON.stringify(адреса);
      блок.innerHTML =
        '<div class="nm-stage">' +
          '<img class="nm-main" src="' + esc(адреса[0]) + '" alt="" data-index="0">' +
          '<div class="nm-count">1 / ' + адреса.length + '</div>' +
        '</div>' +
        '<div class="nm-thumbs">' +
          адреса.map(function(url, i) {
            return '<button type="button" class="nm-thumb' + (i === 0 ? ' active' : '') +
              '" data-index="' + i + '"><img src="' + esc(url) + '" alt="" loading="lazy"></button>';
          }).join('') +
        '</div>';
      набор[0].parentNode.insertBefore(блок, набор[0]);
      набор.forEach(function(f) { f.remove(); });
      набор = [];
    }

    дети.forEach(function(эл) {
      var снимок = эл.tagName === 'FIGURE' && эл.querySelector('img') && !эл.textContent.trim();
      if (снимок) { набор.push(эл); return; }
      закрыть();
    });
    закрыть();
  }

  function initCarousel(root, photos) {
    // Каруселей может быть несколько: галерея новости и наборы снимков в
    // тексте. У каждой свои адреса.
    Array.prototype.forEach.call(root.querySelectorAll('.nm-carousel'), function(wrap) {
      var свои = wrap.dataset.photos ? JSON.parse(wrap.dataset.photos) : photos;
      завестиОдну(wrap, свои || []);
    });
  }

  function завестиОдну(wrap, photos) {
    if (!wrap || photos.length < 2) return;

    var main = wrap.querySelector('.nm-main');
    var count = wrap.querySelector('.nm-count');
    var thumbs = Array.prototype.slice.call(wrap.querySelectorAll('.nm-thumb'));
    var index = 0;

    function show(i) {
      index = (i + photos.length) % photos.length;
      main.src = photos[index];
      main.dataset.index = index;
      count.textContent = (index + 1) + ' / ' + photos.length;
      thumbs.forEach(function(t, n) { t.classList.toggle('active', n === index); });
      var active = thumbs[index];
      if (active) active.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    }

    thumbs.forEach(function(t) {
      t.addEventListener('click', function() { show(Number(t.dataset.index)); });
    });
    onSwipe(wrap.querySelector('.nm-stage'), function(dir) { show(index + dir); });
  }

  /**
   * Просмотр снимка поверх экрана.
   *
   * Что листается — зависит от того, куда нажали. Крупный кадр карусели
   * открывает всю галерею целиком: в разметке она одна картинка, но человек
   * видит ленту и ждёт, что пролистает её и на весь экран. Снимки из текста
   * листаются между собой.
   */
  function initViewer(root, gallery) {
    // .nd-body img — снимки, вставленные в текст: редактор оборачивает их
    // в figure, а старые новости из блоков — в обычный div
    var IN_TEXT = '.nm-grid-item, .nd-body img';

    root.addEventListener('click', function(e) {
      var main = e.target.closest('.nm-main');
      if (main) {
        var wrap = main.closest('.nm-carousel');
        var свои = (wrap && wrap.dataset.photos) ? JSON.parse(wrap.dataset.photos) : gallery;
        if (свои && свои.length) {
          e.preventDefault();
          open(свои, Number(main.dataset.index) || 0);
          return;
        }
      }

      var el = e.target.closest(IN_TEXT);
      if (!el) return;
      e.preventDefault();
      var items = Array.prototype.slice.call(root.querySelectorAll(IN_TEXT));
      var i = items.indexOf(el);
      if (i !== -1) open(items.map(function(n) { return n.src; }), i);
    });
  }

  function open(urls, index) {
    var overlay = document.createElement('div');
    overlay.className = 'nm-viewer';
    overlay.innerHTML =
      '<button type="button" class="nm-viewer-close" aria-label="Закрыть">&times;</button>' +
      '<img class="nm-viewer-img" src="' + esc(urls[index]) + '" alt="">' +
      '<div class="nm-viewer-count"></div>';
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    var img = overlay.querySelector('.nm-viewer-img');
    var count = overlay.querySelector('.nm-viewer-count');

    function show(i) {
      index = (i + urls.length) % urls.length;
      img.src = urls[index];
      count.textContent = urls.length > 1 ? (index + 1) + ' / ' + urls.length : '';
    }

    // Аппаратная «назад» в Capacitor отматывает историю webview, поэтому
    // открытие просмотра — это отдельный шаг истории, а не просто элемент в DOM
    var closed = false;
    history.pushState({ kslt: 'viewer' }, '');

    function destroy() {
      if (closed) return;
      closed = true;
      overlay.remove();
      document.body.style.overflow = '';
      window.removeEventListener('popstate', onPop);
    }
    function onPop() { destroy(); }
    function close() {
      if (closed) return;
      history.back();       // снимаем свой шаг, дальше сработает onPop
    }

    window.addEventListener('popstate', onPop);
    overlay.querySelector('.nm-viewer-close').addEventListener('click', close);
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay || e.target === img) close();
    });
    onSwipe(overlay, function(dir) { show(index + dir); });

    show(index);
  }

  /** Свайп влево-вправо; вертикальное движение отдаём прокрутке. */
  function onSwipe(el, cb) {
    if (!el) return;
    var x0 = 0, y0 = 0;
    el.addEventListener('touchstart', function(e) {
      x0 = e.touches[0].clientX;
      y0 = e.touches[0].clientY;
    }, { passive: true });
    el.addEventListener('touchend', function(e) {
      var dx = e.changedTouches[0].clientX - x0;
      var dy = e.changedTouches[0].clientY - y0;
      if (Math.abs(dx) < SWIPE || Math.abs(dx) < Math.abs(dy)) return;
      cb(dx < 0 ? 1 : -1);
    }, { passive: true });
  }

})();
