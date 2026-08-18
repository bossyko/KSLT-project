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

    supabaseClient.from('player_badges')
      .select('badge_id, badge:badge_definitions(icon, name, name_en, name_kg, ' +
              'description, description_en, description_kg, sort_order)')
      .eq('player_id', playerId)
      .is('seen_at', null)
      .then(function(res) {
        if (res.error) {
          // Молчать нельзя: человек не узнает, что заработал, а мы не узнаем,
          // что поздравление сломалось
          console.error('[KSLT] достижения не проверены:', res.error.message || res.error);
          return;
        }

        queue = (res.data || [])
          .filter(function(r) { return r.badge; })
          .sort(function(a, b) { return (a.badge.sort_order || 0) - (b.badge.sort_order || 0); });

        if (!queue.length) return;

        build();
        next();

        // Отмечаем сразу, а не по нажатию: приложение могут закрыть на
        // середине, и тогда при каждом запуске встречало бы одно и то же
        supabaseClient.rpc('mark_badges_seen').then(function(r) {
          if (r.error) console.error('[KSLT] отметка о показе не сохранена:', r.error.message);
        });
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
    overlay = document.createElement('div');
    overlay.className = 'ach-overlay';
    overlay.innerHTML = '<div class="ach-card"></div>';
    document.body.appendChild(overlay);
  }

  function next() {
    if (!queue.length) {
      overlay.classList.remove('show');
      setTimeout(function() { if (overlay) overlay.remove(); overlay = null; }, 250);
      return;
    }

    var b = queue.shift().badge;
    var left = queue.length;

    overlay.querySelector('.ach-card').innerHTML =
      '<div class="ach-fx balls">' + balls(22) + '</div>' +
      '<div class="ach-halo"></div>' +
      '<div class="ach-kicker">' + t('ach.kicker') + '</div>' +
      '<div class="ach-emoji">' + (b.icon || '🏅') + '</div>' +
      '<div class="ach-name"></div>' +
      '<div class="ach-desc"></div>' +
      '<button class="ach-btn" type="button">' + (left ? t('ach.next') : t('ach.done')) + '</button>' +
      (left ? '<div class="ach-count">' + t('ach.left') + left + '</div>' : '');

    // Текстом, а не разметкой: названия приходят из базы
    overlay.querySelector('.ach-name').textContent = pick(b, 'name') || '';
    overlay.querySelector('.ach-desc').textContent = pick(b, 'description') || '';
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
