// ============================================
// КСЛТ Mobile — поздравление с достижением
// ============================================
//
// То же, что на сайте: игрок открыл приложение, и если с прошлого раза что-то
// заработал — ему это показывают. Один раз.
//
// Отметку о показе ставит база, одна на сайт и приложение. Открыл утром
// приложение — днём на сайте уже не всплывёт, и наоборот.
//
// Вызывается из app.js после входа: window.KSLT_BADGE_CELEBRATION.check()

(function() {
  'use strict';

  var C = window.KSLT_BADGE_CELEBRATION = {};
  var queue = [];
  var overlay = null;

  C.check = function(playerId) {
    if (!playerId || !window.supabaseClient) return;

    /* ЧТЕНИЕ ОЧЕРЕДИ И ОТМЕТКА — В ОБЩЕМ ДОМЕ
       `js/kslt-pozdravlenie.js` (шаг A3.7б, 29.10). Здесь остаётся
       только то, что законно своё: `playerId` приходит СНАРУЖИ, из
       `app.js` после входа, а не добывается самим файлом. */
    window.KSLT_POZDRAVLENIE.очередь(supabaseClient, playerId)
      .then(function (список) {
        queue = список;
        if (!queue.length) return;
        build();
        next();
        return window.KSLT_POZDRAVLENIE.пометить(supabaseClient);
      });
  };

  function t(key) {
    var I = window.KSLT_I18N;
    var fallback = {
      'ach.kicker': 'Новое достижение',
      'ach.next': 'Дальше',
      'ach.done': 'Отлично',
      'ach.left': 'осталось ещё '
    };
    return (I && I.t) ? I.t(key) : fallback[key];
  }

  function pick(b, field) {
    var lang = (window.KSLT_I18N && window.KSLT_I18N.lang) || 'ru';
    if (lang === 'en') return b[field + '_en'] || b[field];
    if (lang === 'kg') return b[field + '_kg'] || b[field];
    return b[field];
  }

  function build() {
    overlay = window.KSLT_POZDRAVLENIE.оболочка(document);
  }

  function next() {
    if (!queue.length) {
      overlay.classList.remove('show');
      setTimeout(function() { if (overlay) overlay.remove(); overlay = null; }, 250);
      return;
    }

    var b = queue.shift().badge;
    var left = queue.length;

    /* ЗНАЧОК ШЁЛ ЗДЕСЬ СЫРЫМ (шаг A3.7б, 29.10): `icon` — текстовый
       столбец базы, а экранирования не было. Сторож разметки этого не
       видел, потому что его признак обходит только `js/`. Теперь
       разметку даёт дом, и экранирование в нём одно на оба продукта. */
    overlay.querySelector('.ach-card').innerHTML =
      window.KSLT_POZDRAVLENIE.карточка(b, left,
        { шапка: t('ach.kicker'), дальше: t('ach.next'),
          готово: t('ach.done'), осталось: t('ach.left') },
        balls);

    // Текстом, а не разметкой: названия приходят из базы
    window.KSLT_POZDRAVLENIE.назвать(overlay.querySelector('.ach-card'), b, pick);
    overlay.querySelector('.ach-btn').addEventListener('click', next);

    overlay.classList.remove('show');
    void overlay.offsetWidth;
    overlay.classList.add('show');
  }

  /** Падающие теннисные мячи. */
  function balls(n) {
    var out = '';
    for (var i = 0; i < n; i++) {
      out += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;' +
             'animation-duration:' + (1.2 + Math.random() * 0.9).toFixed(2) + 's;' +
             'animation-delay:' + (Math.random() * 0.4).toFixed(2) + 's"></i>';
    }
    return out;
  }
})();
