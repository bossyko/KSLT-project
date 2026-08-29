/**
 * Постоянные разделы главной: достижения, «О проекте», спонсоры.
 *
 * Верх главной живой и меняется — Live, баттлы, турниры, новости. Но пока
 * сезон не начался, там пусто, и экран выглядит заброшенным. Эти три
 * держат страницу всегда.
 *
 * Порядок разговора: сначала зовём что-то сделать (достижения), потом
 * объясняем новичку, зачем ему клуб, и в самом низу — те, кто клуб
 * оплачивает.
 */
(function () {
  'use strict';

  var I18N = window.KSLT_I18N;
  var HB = window.KSLT_HOME_BLOCKS = {};

  function esc(s) {
    if (s === null || s === undefined) return '';
    var d = document.createElement('div');
    d.textContent = String(s);
    return d.innerHTML;
  }

  function lang() { return (I18N && I18N.currentLang) || 'ru'; }

  /** Название и описание на языке, который выбран в приложении. */
  function field(row, base) {
    var l = lang();
    if (l === 'en') return row[base + '_en'] || row[base] || '';
    if (l === 'kg') return row[base + '_kg'] || row[base] || '';
    return row[base] || '';
  }

  function accessLevel() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) return 'guest';
    return AUTH._membershipStatus ? 'member' : 'registered';
  }

  HB.load = function () {
    loadBadges();
    loadAbout();
    loadSponsors();
  };

  // ---- Достижения -----------------------------------------------------

  /**
   * Лента значков: заработанные ярко, остальные приглушённо. Это
   * единственный раздел на главной, который зовёт что-то сделать, а не
   * просто читается, поэтому стоит первым из трёх.
   */
  function loadBadges() {
    var el = document.getElementById('homeBadges');
    if (!el || !supabaseClient) return;

    var AUTH = window.KSLT_AUTH;
    var playerId = AUTH && AUTH.currentProfile && AUTH.currentProfile.player_id;

    var earned = playerId
      ? supabaseClient.from('player_badges').select('badge_id').eq('player_id', playerId)
          .then(function (r) {
            var set = {};
            (r.data || []).forEach(function (b) { set[b.badge_id] = true; });
            return set;
          })
      : Promise.resolve({});

    Promise.all([
      supabaseClient.from('badge_definitions').select('*').order('sort_order', { ascending: true })
        .then(function (r) { return r.data || []; }),
      earned
    ]).then(function (res) {
      var all = res[0], mine = res[1];
      if (!all.length) { el.innerHTML = ''; return; }

      // Заработанные — вперёд: человек видит, что уже собрал, а следом что
      // можно взять дальше
      var list = all.slice().sort(function (a, b) {
        var da = mine[a.id] ? 0 : 1, db = mine[b.id] ? 0 : 1;
        return da - db || (a.sort_order || 0) - (b.sort_order || 0);
      });

      // Дюжина, как на сайте: значков полсотни, и лента во всю их длину
      // превращается в бесконечную прокрутку вбок
      list = list.slice(0, 12);

      var html = '<div class="section-title"><h2>' + I18N.t('home.badgesTitle') + '</h2>' +
        '<span class="see-all" data-nav="badges">' + I18N.t('home.all') + '</span></div>';
      html += '<div class="hb-badges-scroll">';
      list.forEach(function (b) {
        var got = !!mine[b.id];
        html += '<div class="hb-badge' + (got ? ' hb-badge--got' : '') + '">' +
          '<div class="hb-badge-icon">' + esc(b.icon || '🏅') + '</div>' +
          '<div class="hb-badge-name">' + esc(field(b, 'name')) + '</div>' +
          '<div class="hb-badge-text">' + esc(field(b, 'description')) + '</div>' +
        '</div>';
      });
      html += '</div>';

      // Гостю показываем, куда нажать, чтобы всё это стало доступно
      if (accessLevel() === 'guest') {
        html += '<button class="hb-cta" id="hbBadgesCta">' + I18N.t('home.badgesCta') + '</button>';
      }

      el.innerHTML = html;

      var cta = document.getElementById('hbBadgesCta');
      if (cta) cta.addEventListener('click', function () {
        if (window.KSLT_AUTH && window.KSLT_AUTH.showAuth) window.KSLT_AUTH.showAuth();
      });

      // «Все» ведёт в свои достижения — они живут в профиле
      var all = el.querySelector('[data-nav="badges"]');
      if (all) all.addEventListener('click', function () {
        if (window.KSLT_APP) window.KSLT_APP.switchScreen('screenProfile');
      });
    });
  }

  // ---- О проекте ------------------------------------------------------

  /**
   * Рассказ новичку, зачем ему клуб. Оплатившему не показываем: он это уже
   * знает, а раздел каждый раз стоял бы между ним и его рейтингом.
   */
  function loadAbout() {
    var el = document.getElementById('homeAbout');
    if (!el) return;

    if (accessLevel() === 'member') { el.innerHTML = ''; return; }

    var items = [
      ['🎾', 'about1'], ['👥', 'about2'], ['📊', 'about3'],
      ['🏟', 'about4'], ['🎯', 'about5'], ['💚', 'about6']
    ];

    var html = '<div class="section-title"><h2>' + I18N.t('home.aboutTitle') + '</h2></div>';
    html += '<div class="hb-about-text">' + I18N.t('home.aboutText') + '</div>';
    html += '<div class="hb-about-grid">';
    items.forEach(function (it) {
      html += '<div class="hb-about-item">' +
        '<div class="hb-about-icon">' + it[0] + '</div>' +
        '<div class="hb-about-name">' + I18N.t('home.' + it[1]) + '</div>' +
        '<div class="hb-about-desc">' + I18N.t('home.' + it[1] + 'Text') + '</div>' +
      '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  // ---- Спонсоры -------------------------------------------------------

  /**
   * Логотипы тех, кто содержит клуб. Не для заполнения места: в предложении
   * спонсорам записано «логотип на сайте и в мобильном приложении», а
   * лежали они в отдельном разделе, куда почти никто не заходит.
   */
  function loadSponsors() {
    var el = document.getElementById('homeSponsors');
    if (!el || !supabaseClient) return;

    supabaseClient.from('sponsors')
      .select('id, name, logo, url')
      .order('sort_order', { ascending: true })
      .then(function (r) {
        var list = r.data || [];
        if (!list.length) { el.innerHTML = ''; return; }

        var html = '<div class="section-title"><h2>' + I18N.t('home.sponsorsTitle') + '</h2>' +
          '<span class="see-all" data-nav="screenSponsors">' + I18N.t('home.all') + '</span></div>';
        html += '<div class="hb-sponsors">';
        list.forEach(function (s) {
          html += '<div class="hb-sponsor" data-sponsor="' + esc(s.id) + '">' +
            (s.logo
              ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy">'
              : '<span>' + esc(s.name) + '</span>') +
          '</div>';
        });
        html += '</div>';
        el.innerHTML = html;

        var all = el.querySelector('[data-nav]');
        if (all) all.addEventListener('click', function () {
          if (window.KSLT_APP) window.KSLT_APP.switchScreen('screenSponsors');
        });
      });
  }
})();
