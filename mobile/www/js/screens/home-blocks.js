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
    renderHero();
    loadBadges();
    loadAbout();
    loadSponsors();

    // Свежие тексты подтягиваем следом. Экран уже нарисован тем, что
    // запомнили в прошлый раз, и перерисуется, только если что-то и
    // правда поменяли в админке
    if (window.KSLT_CONTENT) {
      window.KSLT_CONTENT.refresh(supabaseClient, renderHero);
    }
  };

  // ---- Заглавный экран ------------------------------------------------

  /**
   * Первое, что видит человек: куда он попал и что здесь делать.
   *
   * Раньше приложение открывалось сразу списком турниров — без единого
   * слова о клубе. Тексты и картинка берутся из базы, поэтому меняются
   * через админку и попадают и на сайт, и сюда, без новой сборки.
   */
  function renderHero() {
    var el = document.getElementById('homeHero');
    if (!el) return;

    var C = window.KSLT_CONTENT;
    function txt(key, fallback) { return C ? C.get(key, fallback) : fallback; }

    var img = txt('hero.image', '');
    // Путь в базе записан относительно сайта: приложение лежит отдельно,
    // поэтому короткие пути достраиваем до полного адреса
    if (img && img.indexOf('http') !== 0) {
      img = (window.KSLT_SITE_URL || 'https://kslt.netlify.app') + '/' + img.replace(/^\/+/, '');
    }

    var stats = _stats;   // считаются один раз, ниже

    el.innerHTML =
      '<div class="hh"' + (img ? ' style="background-image:linear-gradient(180deg,rgba(0,0,0,.35),rgba(0,0,0,.88)),url(' + img + ')"' : '') + '>' +
        '<div class="hh-season">' + esc(txt('hero.season', 'Сезон 2026')) + '</div>' +
        '<div class="hh-mark">КСЛТ</div>' +
        '<div class="hh-sub">' + esc(txt('hero.tagline', 'Кыргызстанское Сообщество Любителей Тенниса')) + '</div>' +
        '<div class="hh-claim">' + esc(txt('hero.claim', 'ИСКУССТВО СТАНОВИТЬСЯ ПЕРВЫМ')) + '</div>' +
        '<div class="hh-text">' + esc(txt('hero.text', I18N.t('home.heroText'))) + '</div>' +
        '<button class="hh-btn" id="hhFind">' + esc(txt('hero.button', 'Найти игрока')) + ' →</button>' +
        (stats ? statsHtml(stats) : '<div class="hh-stats" id="hhStats"></div>') +
      '</div>';

    var btn = document.getElementById('hhFind');
    if (btn) btn.addEventListener('click', function () {
      if (window.KSLT_APP) window.KSLT_APP.switchScreen('screenPartners');
    });

    if (!stats) loadStats();
  }

  /**
   * Числа клуба. Считает их функция в базе — та же, что на сайте, чтобы
   * им неоткуда было разойтись.
   */
  var _stats = null;

  function loadStats() {
    if (!supabaseClient) return;
    supabaseClient.rpc('get_club_stats').then(function (r) {
      var d = (r.data && r.data[0]) || null;
      if (!d) return;
      _stats = d;
      var box = document.getElementById('hhStats');
      if (box) box.outerHTML = statsHtml(d);
    });
  }

  function statsHtml(d) {
    var ARCHIVE = 300;   // турниры до 2025 года в базе не заведены
    var cards = [
      [d.members, I18N.t('home.stMembers')],
      [d.users, I18N.t('home.stUsers')],
      [ARCHIVE + (d.tournaments || 0), I18N.t('home.stTournaments')],
      [d.courts, I18N.t('home.stCourts')]
    ];
    // Тренеров нет — карточку не рисуем: «ноль тренеров» хуже молчания
    if (d.coaches) cards.push([d.coaches, I18N.t('home.stCoaches')]);

    return '<div class="hh-stats">' + cards.map(function (c) {
      return '<div class="hh-stat"><span class="hh-stat-num">' + c[0] + '</span>' +
             '<span class="hh-stat-cap">' + c[1] + '</span></div>';
    }).join('') + '</div>';
  }

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

      // Заголовок короткий, лозунг — подписью под ним: «Играй. Расти.
      // Собирай достижения» рядом со словом «Все» не помещался и лез в
      // две строки, наезжая на него
      var html = '<div class="section-title"><h2>' + I18N.t('home.badgesShort') + '</h2>' +
        '<span class="see-all" data-nav="badges">' + I18N.t('home.all') + '</span></div>';
      html += '<div class="hb-motto">' + I18N.t('home.badgesTitle') + '</div>';
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
        '<div>' +
          '<div class="hb-about-name">' + I18N.t('home.' + it[1]) + '</div>' +
          '<div class="hb-about-desc">' + I18N.t('home.' + it[1] + 'Text') + '</div>' +
        '</div>' +
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
      .select('id, name, logo, url, description, description_en, description_kg, phone, whatsapp, telegram, instagram, address')
      .order('sort_order', { ascending: true })
      .then(function (r) {
        var list = r.data || [];
        if (!list.length) { el.innerHTML = ''; return; }

        var html = '<div class="section-title"><h2>' + I18N.t('home.sponsorsTitle') + '</h2>' +
          '<span class="see-all" data-nav="screenSponsors">' + I18N.t('home.all') + '</span></div>';
        // Список выводим дважды: лента едет непрерывно и в момент, когда
        // сдвинулась на половину, вторая копия оказывается ровно на месте
        // первой — стык не виден, движение не прерывается
        function tile(s) {
          return '<div class="hb-sponsor" data-sponsor="' + esc(s.id) + '">' +
            (s.logo
              ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy">'
              : '<span>' + esc(s.name) + '</span>') +
          '</div>';
        }
        html += '<div class="hb-sponsors"><div class="hb-sponsors-track">' +
          list.map(tile).join('') + list.map(tile).join('') +
        '</div></div>';
        el.innerHTML = html;

        var all = el.querySelector('[data-nav]');
        if (all) all.addEventListener('click', function () {
          if (window.KSLT_APP) window.KSLT_APP.switchScreen('screenSponsors');
        });

        // Плитка открывает окно, а не выкидывает из приложения. Человек
        // сначала видит, кто это и чем занимается, и сам решает, идти ли
        var byId = {};
        list.forEach(function (s) { byId[s.id] = s; });
        el.addEventListener('click', function (e) {
          var t = e.target.closest('[data-sponsor]');
          if (!t) return;
          HB.showSponsor(byId[t.getAttribute('data-sponsor')]);
        });
      });
  }

  /**
   * Карточка спонсора: кто это, чем занимается и как связаться.
   *
   * Раньше нажатие сразу уводило на чужой сайт — человек уходил из
   * приложения, не поняв, куда попал. А на главной плитки не нажимались
   * вовсе.
   */
  HB.showSponsor = function (s) {
    if (!s || !window.KSLT_INVITES) return;

    var ICON = window.KSLT_CONTACT_ICONS || {};
    var body = '';

    if (s.logo) body += '<div class="hb-sp-logo"><img src="' + esc(s.logo) + '" alt=""></div>';
    body += '<div class="hb-sp-name">' + esc(s.name) + '</div>';

    var about = field(s, 'description');
    if (about) body += '<p class="gi-text">' + esc(about) + '</p>';

    // Способы связи — теми же значками и цветами, что у контактов игрока
    var R = window.KSLT_RULES;
    var rows = [];
    if (s.phone) rows.push([ICON.phone, esc(s.phone), 'tel:' + s.phone, 'phone']);
    if (s.whatsapp) rows.push([ICON.whatsapp, esc(s.whatsapp), R.socialUrl('wa', s.whatsapp), 'wa']);
    if (s.telegram) rows.push([ICON.telegram, '@' + esc(R.handle(s.telegram)), R.socialUrl('tg', s.telegram), 'tg']);
    if (s.instagram) rows.push([ICON.instagram, '@' + esc(R.handle(s.instagram)), R.socialUrl('ig', s.instagram), 'ig']);

    if (rows.length) {
      body += '<div class="gi-contacts">' + rows.map(function (r) {
        return '<a class="gi-contact gi-contact--' + r[3] + '" href="' + r[2] + '" target="_blank" rel="noopener">' +
          '<span class="gi-contact-icon">' + r[0] + '</span><span>' + r[1] + '</span></a>';
      }).join('') + '</div>';
    }

    if (s.address) body += '<div class="hb-sp-addr">' + esc(s.address) + '</div>';

    var actions = [{ label: I18N.t('inv.close'), primary: !s.url }];
    if (s.url) {
      actions.push({ label: I18N.t('home.sponsorSite'), primary: true, onClick: function (close) {
        window.open(s.url, '_blank', 'noopener');
        close();
      } });
    }

    window.KSLT_INVITES.modal({ title: I18N.t('home.sponsorTitle'), body: body, actions: actions });
  };

})();
