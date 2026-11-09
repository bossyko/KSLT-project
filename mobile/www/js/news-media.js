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
      /* ЭКРАНИРОВАНИЕ ОДНО НА ВЕСЬ ПРОДУКТ. Здесь стояло своё тело на
         `textContent`/`innerHTML`, и оно НЕ ЭКРАНИРУЕТ КАВЫЧКИ: проверено
         работой 08.11 — имя игрока `Костя" onmouseover="alert(1)` давало
         кнопку с чужим обработчиком, потому что значения атрибутов здесь
         собираются строками. Ещё `if (!s)` съедал ноль: счёт «0» пропадал.
         Имя `esc` оставлено: одна правка ТЕЛА чинит все зовы файла. */
      return KSLT_экранировать(s);
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
    /* Ленту собирает общий дом — тот же, что на сайте и в предпросмотре
       админки. `.nd-body` переименован в `.news-html` на время сборки:
       дом ищет тело новости по этому имени, и заводить ему второе
       значило бы развести одно понятие по двум именам. */
    var тело = root.querySelector('.nd-body');
    var подпись = window.KSLT_I18N ? window.KSLT_I18N.t('news.open') : 'Открыть';
    if (тело && window.KSLT_LENTA) {
      тело.classList.add('news-html');
      KSLT_LENTA.собрать(root, подпись);
      тело.classList.remove('news-html');
      /* Сборка только рисует. Обработчики каждой ленте вешает `завести` —
         так же делает и сайт (`js/news.js:729`). Без этого кнопки стоят,
         а не работают: я это и поймал замером. */
      Array.prototype.forEach.call(root.querySelectorAll('.news-carousel'), function (wrap) {
        var кадры = wrap.dataset.kadry ? JSON.parse(wrap.dataset.kadry) : null;
        if (!кадры) {
          var адреса = wrap.dataset.photos ? JSON.parse(wrap.dataset.photos) : [];
          кадры = адреса.map(function (а) { return { вид: 'фото', адрес: а }; });
        }
        KSLT_LENTA.завести(wrap, кадры, подпись);
      });
    }
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
  /* 28.10, КУСОК 220: своя сборка ленты снесена. Она брала ТОЛЬКО
     фотографии, и видео шло отдельными кадрами друг за другом — Костя
     увидел это и сказал: «инста наверно тоже карусель сделать, или
     поместить вместе с фото в одну». На сайте это решено ещё 08.10 его
     же словами, и для этого есть общий дом `js/kslt-lenta.js`: он
     собирает фото и видео в ОДНУ ленту и снимает отношение коробки с
     первого кадра, чтобы она не прыгала при листании. */


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
    /* Кнопки листания: свайп остаётся, но он не единственный путь. */
    var назад = wrap.querySelector('.nm-nav.nm-prev');
    var вперёд = wrap.querySelector('.nm-nav.nm-next');
    if (назад) назад.addEventListener('click', function(e) { e.stopPropagation(); show(index - 1); });
    if (вперёд) вперёд.addEventListener('click', function(e) { e.stopPropagation(); show(index + 1); });
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
    /* Крупный кадр ленты, которую собрал общий дом. Листается она сама,
       а нажатие открывает снимок на весь экран. */
    var КАДР_ЛЕНТЫ = '.news-carousel-kadr, .news-carousel-main';

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

      var кадр = e.target.closest(КАДР_ЛЕНТЫ);
      if (кадр) {
        var лента = кадр.closest('.news-carousel');
        var снимок = лента && лента.querySelector('.news-carousel-main');
        /* У видео своего снимка нет — его открывает сам проигрыватель. */
        if (снимок && снимок.src && !лента.querySelector('.news-carousel-video:not([hidden])')) {
          var все = Array.prototype.slice.call(лента.querySelectorAll('.news-carousel-thumb img'))
            .map(function (i) { return i.src; });
          var текущий = лента.querySelector('.news-carousel-thumb.active');
          e.preventDefault();
          open(все.length ? все : [снимок.src],
               текущий ? Array.prototype.indexOf.call(
                 лента.querySelectorAll('.news-carousel-thumb'), текущий) : 0);
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
    /* 28.10, КУСОК 219: листать можно БЫЛО только свайпом, а по снимку
       клик ЗАКРЫВАЛ окно. На компьютере свайпа нет вовсе, на телефоне
       неточный свайп читался как нажатие — и вместо следующего кадра
       окно пропадало. Костя: «не получается листать фото в увеличенном
       и в миниатюре». Ставим кнопки и снимаем закрытие по снимку. */
    var многоКадров = urls.length > 1;
    overlay.innerHTML =
      '<button type="button" class="nm-viewer-close" aria-label="Закрыть">&times;</button>' +
      (многоКадров ? '<button type="button" class="nm-viewer-nav nm-prev" aria-label="Предыдущий">&#8249;</button>' : '') +
      '<img class="nm-viewer-img" src="' + esc(urls[index]) + '" alt="">' +
      (многоКадров ? '<button type="button" class="nm-viewer-nav nm-next" aria-label="Следующий">&#8250;</button>' : '') +
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
    /* Закрывает только фон. Нажатие по самому снимку раньше закрывало —
       и это съедало неточный свайп. */
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) close();
    });
    if (многоКадров) {
      overlay.querySelector('.nm-prev').addEventListener('click', function(e) {
        e.stopPropagation(); show(index - 1);
      });
      overlay.querySelector('.nm-next').addEventListener('click', function(e) {
        e.stopPropagation(); show(index + 1);
      });
      /* С клавиатуры — стрелками: на планшете с клавиатурой и в окне
         разработчика свайпа нет. */
      overlay.tabIndex = -1;
      overlay.addEventListener('keydown', function(e) {
        if (e.key === 'ArrowLeft') show(index - 1);
        else if (e.key === 'ArrowRight') show(index + 1);
        else if (e.key === 'Escape') close();
      });
      setTimeout(function() { overlay.focus(); }, 0);
    }
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
