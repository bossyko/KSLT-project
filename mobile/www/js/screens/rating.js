// ============================================
// KSLT Mobile — Rating Screen
// 3 dropdowns (category, gender, type) + podium + table
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;
  // Дом входа берётся так же, как дом языка выше: `js/auth.js` подключён
  // раньше этого файла. Без этой строки `AUTH.бесплатныйПериод()` ниже
  // падал `ReferenceError`, и экран рейтинга оставался пустым.
  var AUTH = window.KSLT_AUTH;

  var R = window.KSLT_RATING = {};
  var allPlayers = [];
  /* Слепок значков — один на экран, грузится раз за показ: по запросу на
     строку список из двух сотен человек не нарисуется никогда. */
  var _значки = null;
  var allCategories = [];      // всё, что лежит в таблице categories
  var categoriesFromDB = [];   // из них — положенные текущему полу

  var currentGender = 'men';
  var currentCatId = 'promasters';
  var currentSearch = '';
  var GUEST_VISIBLE = 5;
  var GUEST_BLUR = 3;
  var listenersReady = false;
  // Сколько строк показано сейчас. Раньше рисовали всех разом — под три
  // сотни человек на телефоне, и список заметно подвисал
  var shown = 0;

  /**
   * Оставляем разряды, положенные текущему полу. Если выбранного среди них
   * нет — переходим на первый: иначе после переключения на женщин экран
   * оставался в мужском разряде и показывал пустоту.
   */
  function applyCategoriesForGender() {
    var RULES = window.KSLT_RULES;
    categoriesFromDB = RULES
      ? RULES.categoriesFor(currentGender, allCategories)
      : (allCategories || []).filter(function(c) {
          return c.is_rating !== false && c.id !== 'friendly';
        });

    var found = categoriesFromDB.some(function(c) { return c.id === currentCatId; });
    if (!found && categoriesFromDB.length) currentCatId = categoriesFromDB[0].id;
  }

  // Gender options
  var GENDERS = [
    { key: 'men', label: function() { return I18N.t('rating.men'); } },
    { key: 'women', label: function() { return I18N.t('rating.women'); } }
  ];

  R.load = function() {
    if (!supabaseClient) return;
    if (!listenersReady) {
      initDropdowns();
      initSearch();
      listenersReady = true;
    }
    /* ЗНАЧКИ ГРУЗЯТСЯ ОДИН РАЗ ЗА ЗАПУСК, а не на каждый показ экрана:
       два запроса на две сотни игроков — это два запроса, а не двести, но
       и повторять их при каждом переключении разряда незачем.
       Список рисуется НЕ ДОЖИДАЯСЬ их: значки — украшение строки, и
       таблица без них лучше таблицы, которая ждёт. Пришли — перерисуем. */
    if (!_значки && window.KSLT_ZNACHKI) {
      window.KSLT_ZNACHKI.загрузить(supabaseClient).then(function (слепок) {
        _значки = слепок;
        if (document.getElementById('ratingContent')) render();
      });
    }
    loadCategories();
  };

  // --- Load categories from Supabase ---
  function loadCategories() {
    supabaseClient.from('categories')
      // Строка целиком: в таблице шесть строк, зато экран не падает, если
      // колонка в базе появится позже кода.
      .select('*')
      // Как на сайте: сильные категории сверху (js/players.js)
      .order('sort_order', { ascending: false })
      .then(function(r) {
        if (r.error) { console.error('Categories load error:', r.error); return; }
        // Строки таблицы держим как есть, отбор — общим сводом правил:
        // у женщин разрядов три, у мужчин пять, а в базе пола у категорий
        // нет вовсе. Раньше приложение показывало женщинам все пять
        allCategories = r.data || [];
        // Кладём в свод: оттуда названия разрядов берут карточка игрока и
        // поиск партнёра, не ходя в базу второй раз
        if (window.KSLT_RULES) window.KSLT_RULES.rememberCategories(allCategories);
        applyCategoriesForGender();
        updateAllBtnLabels();
        loadPlayers();
      });
  }

  // --- Category dropdown (bottom sheet) + toggle pills ---
  function initDropdowns() {
    var catBtn = document.getElementById('ratingCatBtn');
    var sheet = document.getElementById('ratingSheet');
    var sheetTitle = document.getElementById('ratingSheetTitle');
    var sheetOptions = document.getElementById('ratingSheetOptions');

    if (!catBtn || !sheet) return;

    // Category dropdown → bottom sheet
    catBtn.addEventListener('click', function() {
      sheetTitle.textContent = I18N.t('rating.catLabel');
      var html = '';
      categoriesFromDB.forEach(function(cat) {
        var label = getCatLabel(cat);
        html += '<button class="bs-option' + (cat.id === currentCatId ? ' active' : '') + '" data-val="' + cat.id + '">' + esc(label) + '</button>';
      });
      sheetOptions.innerHTML = html;
      sheetOptions.onclick = function(e) {
        var opt = e.target.closest('.bs-option');
        if (!opt) return;
        currentCatId = opt.getAttribute('data-val');
        sheet.classList.remove('open');
        updateAllBtnLabels();
        loadPlayers();
      };
      sheet.classList.add('open');
    });

    // Close sheet on overlay
    sheet.addEventListener('click', function(e) {
      if (e.target === sheet) sheet.classList.remove('open');
    });

    // Gender toggle pills
    document.querySelectorAll('.rating-toggle-btn[data-gender]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentGender = btn.getAttribute('data-gender');
        document.querySelectorAll('.rating-toggle-btn[data-gender]').forEach(function(b) {
          b.classList.toggle('active', b === btn);
        });
        applyCategoriesForGender();
        updateAllBtnLabels();
        loadPlayers();
      });
    });

    // Type toggle pills
  }

  function getCatLabel(cat) {
    /* 28.10, кусок 214: было `I18N.currentLang` — имени нет, и разряды
       на английском и киргизском оставались русскими. */
    var своё = I18N.поле(cat, 'name');
    if (своё) return своё;
    return cat.name || cat.id;
  }

  function updateAllBtnLabels() {
    var catBtn = document.getElementById('ratingCatBtn');
    var arrow = ' <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';

    if (catBtn) {
      var cat = categoriesFromDB.find(function(c) { return c.id === currentCatId; });
      catBtn.innerHTML = esc(cat ? getCatLabel(cat) : currentCatId) + arrow;
    }
  }

  // --- Search ---
  function initSearch() {
    var input = document.getElementById('ratingSearch');
    if (!input) return;
    var timer = null;
    input.addEventListener('input', function() {
      var q = this.value.trim().toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(function() {
        currentSearch = q;
        shown = 0;   // новый поиск — снова с начала списка
        render();
      }, 300);
    });
  }

  // --- Load players from Supabase ---
  function loadPlayers() {
    var el = document.getElementById('ratingContent');
    if (!el) return;
    shown = 0;   // новая подборка — список начинаем сначала
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';


    // Очки берутся из player_categories: игрок может стоять в двух категориях —
    // своей и на ступень выше, и в каждой таблице показывается со своими очками
    // именно этой категории. Так же устроен рейтинг на сайте.
    AUTH.бесплатныйПериод().then(function(бесплатно) {
    supabaseClient.from('player_categories')
      .select('player_id, points')
      .eq('category_id', currentCatId)
      .then(function(pc) {
        var pointsIn = {};
        (pc.data || []).forEach(function(row) { pointsIn[row.player_id] = row.points || 0; });
        var ids = Object.keys(pointsIn);

        // Берём только то, что видно на экране. Строка целиком весила
        // вчетверо больше — половину съедали created_at и updated_at,
        // которые здесь никому не нужны
        return supabaseClient.from('players')
          .select('id, name, name_en, photo, category_id, ntrp_singles, ntrp_doubles, wins, losses, is_member, is_guest')
          .eq('gender', currentGender)
          .then(function(r) {
            if (r.error) console.error('Rating load error:', r.error);
            allPlayers = (r.data || [])
              // Домашняя категория — всегда, чужая — только если там есть очки
              // Гость играет турниры, но в рейтинге его нет: он не член клуба
              .filter(function(p) { return !p.is_guest; })
              .filter(function(p) { return p.category_id === currentCatId || pointsIn[p.id] > 0; })
              .map(function(p) {
                p.points = pointsIn[p.id] || 0;
                // Пока идёт бесплатный период, клуб открыт всем: места в
                // рейтинге получают все, а не только оплатившие членство
                if (бесплатно) p.is_member = true;
                return p;
              })
              .sort(function(a, b) {
                // Очки равны — выше тот, у кого одиночный NTRP больше
                return (b.points - a.points)
                    || ((Number(b.ntrp_singles) || 0) - (Number(a.ntrp_singles) || 0));
              });
            renderSubtitle();
            renderPodium();
            render();
          });
      });
    });
  }

  // --- Subtitle ---
  /**
   * Подпись под заголовком — про клуб целиком, как на сайте: там вверху
   * «Рейтинг KSLT · 292 игрока · Сезон 2026», и только ниже переключатели.
   * Раньше здесь стоял счёт текущей категории, и на пустом Pro-Masters
   * экран встречал надписью «0 игроков» — будто ничего не загрузилось.
   */
  var _clubTotal = null;

  function renderSubtitle() {
    var el = document.getElementById('ratingSubtitle');
    if (!el) return;
    var season = new Date().getFullYear();

    function paint(n) {
      el.textContent = n + ' ' + I18N.t('rating.playersCount') + ' · ' +
                       I18N.t('rating.season') + ' ' + season;
    }

    if (_clubTotal !== null) { paint(_clubTotal); return; }

    supabaseClient.from('players')
      .select('id', { count: 'exact', head: true })
      .then(function(r) {
        _clubTotal = r.count || allPlayers.length;
        paint(_clubTotal);
      });
  }

  // --- Podium (top 3) ---
  function renderPodium() {
    var container = document.getElementById('ratingPodium');
    if (!container) return;

    // На пьедестал встают только члены клуба — как и места в таблице.
    // Иначе на первой ступени оказывается человек, который в КСЛТ не состоит
    var top3 = allPlayers.filter(function(p) { return p.is_member !== false; }).slice(0, 3);
    if (top3.length === 0) {
      container.innerHTML = '';
      return;
    }

    var medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
    var order = [1, 0, 2]; // 2nd, 1st, 3rd
    // \u041A\u043B\u0430\u0441\u0441 \u043F\u043E \u043C\u0435\u0441\u0442\u0443 \u0438\u0433\u0440\u043E\u043A\u0430, \u0430 \u043D\u0435 \u043F\u043E \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0432 \u0440\u0430\u0437\u043C\u0435\u0442\u043A\u0435: \u043F\u0435\u0440\u0432\u044B\u0439 \u2014 .rp-first,
    // \u0435\u0433\u043E CSS \u0441\u0442\u0430\u0432\u0438\u0442 \u0432 \u0446\u0435\u043D\u0442\u0440 \u0438 \u0434\u0435\u043B\u0430\u0435\u0442 \u043A\u0440\u0443\u043F\u043D\u0435\u0435 (order \u0432 app.css)
    var sizeClass = ['rp-first', 'rp-second', 'rp-third'];
    var pts = 'points';

    var html = '<div class="rating-podium" role="list" aria-label="' +
      esc(I18N.t('rating.podiumLabel')) + '">';
    for (var oi = 0; oi < order.length; oi++) {
      var i = order[oi];
      if (!top3[i]) continue;
      var p = top3[i];
      var photo = p.photo || 'https://placehold.co/60x60/1a1a2e/888?text=' + initials(p.name);
      /* Медаль — картинка смысла, а не текст: диктору читается место
         словами, сам значок от него скрыт. */
      html += '<div class="rp-card ' + sizeClass[i] + '" role="listitem"' +
          ' aria-label="' + esc((i + 1) + '. ' + p.name + ' — ' +
            (p[pts] || 0) + ' ' + I18N.t('rating.ptsShort')) + '">' +
        '<div class="rp-medal" aria-hidden="true">' + medals[i] + '</div>' +
        '<div class="rp-photo-wrap">' +
          '<img class="rp-photo" src="' + esc(photo) + '" alt="" aria-hidden="true">' +
        '</div>' +
        '<div class="rp-name">' + esc(shortName(p.name)) + '</div>' +
        '<div class="rp-pts">' + (p[pts] || 0) + ' ' + I18N.t('rating.ptsShort') + '</div>' +
      '</div>';
    }
    html += '</div>';
    container.innerHTML = html;
  }

  // --- Render table ---
  function render() {
    var el = document.getElementById('ratingContent');
    if (!el) return;

    var displayPlayers = allPlayers;
    if (currentSearch) {
      displayPlayers = allPlayers.filter(function(p) {
        return (p.name || '').toLowerCase().indexOf(currentSearch) !== -1 ||
               (p.name_en || '').toLowerCase().indexOf(currentSearch) !== -1;
      });
    }

    if (displayPlayers.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">' + I18N.t('rating.empty') + '</div><div class="empty-text">' + (currentSearch ? I18N.t('rating.noResults') : I18N.t('rating.emptyText')) + '</div></div>';
      return;
    }

    var isGuest = !(window.KSLT_AUTH && window.KSLT_AUTH.currentUser);
    var RULES = window.KSLT_RULES;
    var PAGE = (RULES && RULES.PAGE_SIZE) || 30;

    // Гостю показываем начало списка, остальное под замком. Вошедшему —
    // страницами: в Futures под две сотни человек, и рисовать их разом на
    // телефоне незачем
    if (!shown) shown = PAGE;
    var visibleCount = isGuest
      ? Math.min(GUEST_VISIBLE + GUEST_BLUR, displayPlayers.length)
      : Math.min(shown, displayPlayers.length);
    var pts = 'points';

    /* Таблица собрана на div-ах, поэтому роли ставятся явно: без них
       диктор читал пять столбцов одной строкой без имён. */
    var html = '<div class="rating-table" role="table" aria-label="' +
      esc(I18N.t('rating.tableLabel')) + '">';
    html += '<div class="rating-table-head" role="row">' +
      '<span class="rt-col-rank" role="columnheader">' + I18N.t('rating.rank') + '</span>' +
      '<span class="rt-col-name" role="columnheader">' + I18N.t('rating.player') + '</span>' +
      '<span class="rt-col-pts" role="columnheader">' + I18N.t('rating.pts') + '</span>' +
      '<span class="rt-col-ntrp" role="columnheader">' + I18N.t('rating.ntrp') + '</span>' +
      '<span class="rt-col-wl" role="columnheader">' + I18N.t('rating.wl') + '</span>' +
    '</div>';

    // Место в рейтинге получают только члены клуба: иначе первым в таблице
    // оказывается тот, кто в клубе не состоит, и она перестаёт отвечать на
    // вопрос «кто первый в КСЛТ». Фоновым — прочерк. Так же на сайте
    var rankByPlayer = RULES
      ? RULES.rankMembers(displayPlayers)
      : (function() {
          var n = 0, out = {};
          displayPlayers.forEach(function(pl) {
            if (pl.is_member !== false) { n++; out[pl.id] = n; }
          });
          return out;
        })();

    for (var i = 0; i < visibleCount; i++) {
      var p = displayPlayers[i];
      var isBg = RULES ? RULES.isBackground(p) : (p.is_member === false);
      var rank = rankByPlayer[p.id] || null;
      var blurClass = isBg ? ' rr-guest' : '';
      if (isGuest && i >= GUEST_VISIBLE) {
        var blurLevel = i - GUEST_VISIBLE + 1;
        blurClass += ' rr-blur rr-blur-' + Math.min(blurLevel, 4);
      }

      var rowClickAttr = (!isGuest && p.id) ? ' data-player-id="' + p.id + '" style="cursor:pointer"' : '';

      html += '<div class="rating-row' + blurClass + '" role="row"' + rowClickAttr + '>' +
        '<span class="rr-rank' + (rank && rank <= 3 ? ' top' : '') + '" role="cell">' + (rank || '—') + '</span>' +
        '<div class="rr-player" role="cell">' +
          (p.photo ? '<img class="rr-avatar-img" src="' + esc(p.photo) + '" alt="" aria-hidden="true">' : '<div class="rr-avatar" aria-hidden="true">' + initials(p.name) + '</div>') +
          '<span class="rr-name">' + esc(p.name) + значкиСтрокой(p.id) +
            (isBg ? '<span class="rr-guest-mark">' + I18N.t('rating.notMember') + '</span>' : '') +
          '</span>' +
        '</div>' +
        '<span class="rr-pts" role="cell">' + (p[pts] || 0) + '</span>' +
        '<span class="rr-ntrp" role="cell">' + ((RULES && RULES.ntrpКоротко
            && RULES.ntrpКоротко(p.ntrp_singles, p.ntrp_doubles)) || '—') + '</span>' +
        '<span class="rr-wl" role="cell" aria-label="' +
          esc(I18N.t('rating.wlLabel') + ': ' + (p.wins || 0) + ' / ' + (p.losses || 0)) +
          '">' + (p.wins || 0) + '/' + (p.losses || 0) + '</span>' +
      '</div>';
    }
    html += '</div>';

    if (!isGuest && displayPlayers.length > visibleCount) {
      html += '<button class="rr-more-btn" id="ratingMore">' +
        I18N.t('rating.showMore') + ' ' +
        Math.min(PAGE, displayPlayers.length - visibleCount) + '</button>';
    }

    // Guest overlay
    if (isGuest && displayPlayers.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>' +
          '<div class="rr-guest-title">' + I18N.t('rating.guestTitle') + '</div>' +
          '<div class="rr-guest-text">' + I18N.t('rating.guestText') + '</div>' +
          '<button class="rr-guest-btn" id="ratingLoginBtn">' + I18N.t('rating.guestBtn') + '</button>' +
        '</div>' +
      '</div>';
    }

    el.innerHTML = html;

    if (isGuest) {
      var loginBtn = document.getElementById('ratingLoginBtn');
      if (loginBtn) loginBtn.addEventListener('click', function() {
        if (window.KSLT_AUTH) window.KSLT_AUTH.showAuth();
      });
    }

    if (!isGuest) {
      el.querySelectorAll('.rating-row[data-player-id]').forEach(function(row) {
        row.addEventListener('click', function() {
          var pid = row.getAttribute('data-player-id');
          if (pid && window.KSLT_PLAYER_DETAIL) window.KSLT_PLAYER_DETAIL.open(pid);
        });
      });

      var moreBtn = document.getElementById('ratingMore');
      if (moreBtn) {
        moreBtn.addEventListener('click', function() {
          shown += PAGE;
          render();
        });
      }
    }
  }

  function shortName(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) return parts[0] + '\n' + parts.slice(1).join(' ');
    return name;
  }

  /**
   * ЗНАЧКИ У ИМЕНИ В СТРОКЕ РЕЙТИНГА.
   *
   * ИХ ЗДЕСЬ НЕ БЫЛО ВОВСЕ (замер 29.10: ноль упоминаний на 444 строки),
   * хотя на сайте они у имени с давних пор. Сколько показывать, в каком
   * порядке и как зовётся значок на языке — три правила, и они живут в
   * доме `js/kslt-znachki.js`, один на оба продукта.
   *
   * ЗНАЧОК И ПОДСКАЗКА ЭКРАНИРУЮТСЯ ОБА: `badge_definitions.icon` и
   * `name` — текстовые столбцы, которые пишет человек. Куском A3.7б уже
   * закрывалась дыра, где значок вставлялся сырым.
   */
  function значкиСтрокой(игрокId) {
    var Z = window.KSLT_ZNACHKI;
    if (!Z || !_значки) return '';
    var список = Z.первые(_значки, игрокId);
    if (!список.length) return '';
    var лэнг = (I18N && I18N.lang) || 'ru';
    var html = '';
    список.forEach(function (з) {
      html += '<span class="rr-badge" title="' +
        esc(Z.название(_значки, з.badge_id, лэнг)) + '">' + esc(з.icon) + '</span>';
    });
    return html;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

})();
