// ============================================
// KSLT Mobile — App (Navigation + Init)
// ============================================
(function() {
  'use strict';

  var APP = window.KSLT_APP = {};

  // Номер этой сборки. Держим рядом с versionCode из android/app/build.gradle:
  // по нему приложение понимает, не устарело ли оно. Поднимать вместе с ним.
  APP.BUILD = 3;
  APP.BUILD_NAME = '1.2';
  var currentScreen = 'screenHome';
  var loadedScreens = {};

  // === Theme ===
  /* ТЕМЫ ДВЕ, ПОЛОЖЕНИЙ ТРИ (08.11). Светлая вернулась новым куском:
     своя палитра ролей в `css/tokens.css`, числа посчитаны по WCAG на
     худшем из светлых фонов. Прежняя запись («тема одна») снята вместе
     с причиной, а не затёрта: причина была в том, что светлая тема
     спорила с зашитыми красками, и этот кусок свёл их на роли.

     ВЫБОР — СВОЙСТВО ЧЕЛОВЕКА, А НЕ ЭКРАНА, и потому хранится. Положений
     три: `light`, `dark` и `system`. Третье — ПО УМОЛЧАНИЮ: человек
     ставит ночной режим в телефоне один раз и ждёт, что приложения ему
     подчинятся. Так устроены Settings > Appearance у Apple и
     `AppCompatDelegate.MODE_NIGHT_FOLLOW_SYSTEM` у Google.

     УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ: в разметке
     `data-theme="dark"` стоит затем, чтобы первый кадр не мигнул белым,
     а настоящее решение принимает этот дом при запуске.

     ХРАНИМ ВЫБОР, А НЕ ИТОГ: записано `system` — значит и завтра, когда
     человек переключит телефон на ночной режим, приложение пойдёт за
     ним. Записать вычисленное `dark` значило бы запомнить сегодняшнюю
     погоду вместо желания. */
  var ТЕМА_КЛЮЧ = 'kslt-tema';
  var ТЕМЫ = ['light', 'dark', 'system'];

  function выборТемы() {
    try {
      var в = localStorage.getItem(ТЕМА_КЛЮЧ);
      return ТЕМЫ.indexOf(в) !== -1 ? в : 'system';
    } catch (e) { return 'system'; }
  }

  /* СИСТЕМА СПРАШИВАЕТСЯ У БРАУЗЕРА, А НЕ УГАДЫВАЕТСЯ ПО ЧАСАМ. */
  function системнаяТема() {
    try {
      return (window.matchMedia &&
              window.matchMedia('(prefers-color-scheme: light)').matches) ? 'light' : 'dark';
    } catch (e) { return 'dark'; }
  }

  function действующаяТема() {
    var в = выборТемы();
    return в === 'system' ? системнаяТема() : в;
  }

  function applyTheme() {
    var т = действующаяТема();
    document.documentElement.setAttribute('data-theme', т);
    // Системные полосы (Capacitor 8).
    // Под край-в-край фон полос не красится: в плагине System Bars
    // setBackgroundColor помечен Unsupported, а под верхней полосой рисует
    // сам .status-bar-spacer (app.css: padding-top: var(--safe-top),
    // background: var(--bg)). Остаётся задать только цвет значков.
    // 'DARK' в обоих плагинах значит СВЕТЛЫЕ значки на тёмном фоне.
    /* ЗНАЧКИ СИСТЕМНЫХ ПОЛОС ИДУТ ЗА ТЕМОЙ. В обоих плагинах 'DARK'
       значит СВЕТЛЫЕ значки (для тёмного фона), 'LIGHT' — ТЁМНЫЕ. Имена
       читаются наоборот смыслу, и это уже стоило одному продукту белых
       значков на белой полосе. */
    var стиль = (т === 'light') ? 'LIGHT' : 'DARK';
    var _plugins = window.Capacitor && window.Capacitor.Plugins;
    if (_plugins && _plugins.SystemBars) {
      _plugins.SystemBars.setStyle({ style: стиль });
    } else if (_plugins && _plugins.StatusBar) {
      _plugins.StatusBar.setStyle({ style: стиль });
    }
  }

  APP.setTheme = function(в) {
    if (ТЕМЫ.indexOf(в) === -1) return;
    try { localStorage.setItem(ТЕМА_КЛЮЧ, в); } catch (e) {}
    applyTheme();
  };

  /* ОТДАЁМ ВЫБОР, А НЕ ИТОГ: переключателю нужно знать, на какой кнопке
     стоит человек, а не какую тему посчитал дом. */
  APP.getTheme = function() { return выборТемы(); };

  // Apply immediately
  applyTheme();

  /* СИСТЕМА МЕНЯЕТСЯ НА ХОДУ — И МЫ ЗА НЕЙ. Человек тянет шторку,
     включает ночной режим, возвращается в приложение: без этой
     подписки оно осталось бы в прежней теме до перезапуска. Слушаем
     только пока выбран `system`: иначе ручной выбор перебивался бы
     системным. */
  try {
    if (window.matchMedia) {
      var слух = window.matchMedia('(prefers-color-scheme: light)');
      var насистему = function() { if (выборТемы() === 'system') applyTheme(); };
      if (слух.addEventListener) слух.addEventListener('change', насистему);
      else if (слух.addListener) слух.addListener(насистему);
    }
  } catch (e) {}

  // === Tab Navigation ===
  var tabs = document.querySelectorAll('.tab-item');
  var screens = document.querySelectorAll('.screen');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuBtn = document.getElementById('menuBtn');
  var menuClose = document.getElementById('menuClose');

  APP.switchScreen = function(screenId) {
    screens.forEach(function(s) { s.classList.remove('active'); });
    tabs.forEach(function(t) {
      t.classList.remove('active');
      /* 28.10, КУСОК 215: диктор узнаёт текущий раздел по `aria-current`,
         а не по классу — класс он не видит вовсе. Метка снимается со всех
         и ставится одной, ровно там же, где и подсветка. ОДНО МЕСТО НА
         ОДНО СОСТОЯНИЕ: разойтись им негде. */
      t.removeAttribute('aria-current');
    });

    var target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }

    tabs.forEach(function(t) {
      if (t.getAttribute('data-screen') === screenId) {
        t.classList.add('active');
        t.setAttribute('aria-current', 'page');
      }
    });

    currentScreen = screenId;
    menuOverlay.classList.remove('open');
    /* 28.10, КУСОК 222: НИЖНЯЯ ПАНЕЛЬ ТЕПЕРЬ ВИДНА НА ЭКРАНАХ-
       ПОДРОБНОСТЯХ, И ОНА ОБЯЗАНА ИХ ЗАКРЫВАТЬ. Куском 221 накладка
       перестала перекрывать панель, кнопка стала доступна — и нажатие
       переключало экран ПОД накладкой, а сама накладка оставалась
       поверх. Снаружи это читалось как «кнопки не работают»: подсветка
       переезжала, картинка не менялась. Закрывается ровно так же, как
       кнопкой «Назад» (`home.js:1969`) — снятием класса. */
    document.querySelectorAll('.td-overlay.open, .live-full.open').forEach(function (o) {
      o.classList.remove('open');
    });

    // Lazy-load screen data
    loadScreen(screenId);
  };

  function loadScreen(screenId) {
    if (loadedScreens[screenId]) return;
    loadedScreens[screenId] = true;

    switch (screenId) {
      case 'screenHome':
        if (window.KSLT_HOME) window.KSLT_HOME.load();
        break;
      case 'screenTournaments':
        if (window.KSLT_TOURNAMENTS) window.KSLT_TOURNAMENTS.load();
        break;
      case 'screenRating':
        if (window.KSLT_RATING) window.KSLT_RATING.load();
        break;
      case 'screenNews':
        if (window.KSLT_NEWS) window.KSLT_NEWS.load();
        break;
      case 'screenProfile':
        if (window.KSLT_PROFILE) window.KSLT_PROFILE.load();
        break;
      case 'screenLive':
        if (window.KSLT_LIVE) {
          window.KSLT_LIVE.load();
          window.KSLT_LIVE.startAutoRefresh();
        }
        break;
      case 'screenBattles':
        if (window.KSLT_BATTLES) window.KSLT_BATTLES.load();
        break;
      case 'screenCoaches':
        if (window.KSLT_COACHES) window.KSLT_COACHES.load();
        break;
      case 'screenCourts':
        if (window.KSLT_COURTS) window.KSLT_COURTS.load();
        break;
      case 'screenPartners':
        if (window.KSLT_PARTNERS) window.KSLT_PARTNERS.load();
        break;
      case 'screenSponsors':
        if (window.KSLT_SPONSORS) window.KSLT_SPONSORS.load();
        break;
    }
  }

  // Tab clicks
  tabs.forEach(function(tab) {
    tab.addEventListener('click', function() {
      APP.switchScreen(this.getAttribute('data-screen'));
    });
  });

  // Logo → Home
  document.getElementById('headerLogo').addEventListener('click', function() {
    APP.switchScreen('screenHome');
  });

  // Side menu
  menuBtn.addEventListener('click', function() {
    menuOverlay.classList.add('open');
  });

  menuClose.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
  });

  menuOverlay.addEventListener('click', function(e) {
    if (e.target === menuOverlay) {
      menuOverlay.classList.remove('open');
    }
  });

  // Menu items with data-screen
  document.querySelectorAll('.menu-item[data-screen]').forEach(function(item) {
    item.addEventListener('click', function() {
      APP.switchScreen(this.getAttribute('data-screen'));
    });
  });

  // "See all" navigation from Home
  document.addEventListener('click', function(e) {
    var seeAll = e.target.closest('[data-nav]');
    if (seeAll) {
      APP.switchScreen(seeAll.getAttribute('data-nav'));
    }
  });

  // === Filter chips (generic) ===
  function setupChipFilter(containerId, callback) {
    var container = document.getElementById(containerId);
    if (!container) return;
    container.addEventListener('click', function(e) {
      var chip = e.target.closest('.filter-chip');
      if (!chip) return;
      /* Нажатость для диктора ставится ТАМ ЖЕ, где класс: разъедутся —
         диктор будет называть выбранным прежний фильтр (кусок 215). */
      container.querySelectorAll('.filter-chip').forEach(function(c) {
        c.classList.remove('active');
        c.setAttribute('aria-pressed', 'false');
      });
      chip.classList.add('active');
      chip.setAttribute('aria-pressed', 'true');
      var val = chip.getAttribute('data-status') || chip.getAttribute('data-tag') || chip.getAttribute('data-filter') || chip.textContent.trim();
      callback(val);
    });
  }

  setupChipFilter('tournamentStatusChips', function(val) {
    if (window.KSLT_TOURNAMENTS) window.KSLT_TOURNAMENTS.filter(val);
  });

  setupChipFilter('newsChips', function(val) {
    if (window.KSLT_NEWS) window.KSLT_NEWS.filter(val);
  });

  setupChipFilter('battleChips', function(val) {
    if (window.KSLT_BATTLES) window.KSLT_BATTLES.filter(val);
  });

  setupChipFilter('partnerNtrpChips', function(val) {
    if (window.KSLT_PARTNERS) window.KSLT_PARTNERS.filter(val);
  });

  setupChipFilter('partnerGenderChips', function(val) {
    if (window.KSLT_PARTNERS) window.KSLT_PARTNERS.filterGender(val);
  });

  /* У КОРТОВ ЧИПОВ БОЛЬШЕ НЕТ: с 02.11 там три выпадашки, и нажатия в
     них ловит один обработчик дома `KSLT_VYPADASHKA`, включаемый из
     `js/screens/courts.js`. Три `setupChipFilter` сняты вместе с рядами:
     МЁРТВЫМ КОД НАЗЫВАЕТСЯ ПОСЛЕ ПРОВЕРКИ — ни одного из трёх id в
     разметке не осталось. */

  // Gender toggle — handled in rating.js (initGenderToggle)

  // Tournament search
  var tournamentSearchInput = document.getElementById('tournamentSearch');
  if (tournamentSearchInput) {
    var searchTimer = null;
    tournamentSearchInput.addEventListener('input', function() {
      var q = this.value;
      clearTimeout(searchTimer);
      searchTimer = setTimeout(function() {
        if (window.KSLT_TOURNAMENTS) window.KSLT_TOURNAMENTS.search(q);
      }, 300);
    });
  }

  // Info menu items (About, Rules, FAQ)
  var menuAbout = document.getElementById('menuAbout');
  var menuRules = document.getElementById('menuRules');
  var menuFaq = document.getElementById('menuFaq');
  if (menuAbout) menuAbout.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
    if (window.KSLT_INFO) window.KSLT_INFO.showAbout();
  });
  if (menuRules) menuRules.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
    if (window.KSLT_INFO) window.KSLT_INFO.showRules();
  });
  if (menuFaq) menuFaq.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
    if (window.KSLT_INFO) window.KSLT_INFO.showFaq();
  });
  // Условия и политика на экране регистрации: открываем внутри окном, а
  // не ссылкой в браузер — человек не должен уходить из приложения ровно
  // в тот момент, когда решает, соглашаться ли
  document.addEventListener('click', function(e) {
    var link = e.target.closest('.auth-doc-link, .menu-item[data-doc]');
    if (!link) return;
    var menu = document.getElementById('menuOverlay');
    if (menu) menu.classList.remove('open');
    e.preventDefault();
    if (window.KSLT_INFO) window.KSLT_INFO.showDocument(link.getAttribute('data-doc'));
  });

  var menuPricing = document.getElementById('menuPricing');
  if (menuPricing) menuPricing.addEventListener('click', function() {
    menuOverlay.classList.remove('open');
    if (window.KSLT_INFO) window.KSLT_INFO.showPricing();
  });

  // === Menu theme/lang controls ===
  function initMenuControls() {
    var themeCtrl = document.getElementById('menuThemeControl');
    var langCtrl = document.getElementById('menuLangControl');

    if (themeCtrl) {
      // Set active on load
      var current = APP.getTheme();
      themeCtrl.querySelectorAll('.seg-btn').forEach(function(b) {
        var он = b.getAttribute('data-theme') === current;
        b.classList.toggle('active', он);
        /* ДИКТОР ЧИТАЕТ `aria-pressed`, А НЕ КЛАСС `active`: класс — это
           краска, а нажатость — состояние, и его нужно объявить. */
        b.setAttribute('aria-pressed', он ? 'true' : 'false');
      });
      themeCtrl.addEventListener('click', function(e) {
        var btn = e.target.closest('.seg-btn');
        if (!btn) return;
        themeCtrl.querySelectorAll('.seg-btn').forEach(function(b) {
          b.classList.remove('active');
          b.setAttribute('aria-pressed', 'false');
        });
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
        APP.setTheme(btn.getAttribute('data-theme'));
      });
    }

    if (langCtrl) {
      var I18N = window.KSLT_I18N;
      var curLang = I18N ? I18N.lang : 'ru';
      langCtrl.querySelectorAll('.seg-btn').forEach(function(b) {
        b.classList.toggle('active', b.getAttribute('data-lang') === curLang);
      });
      langCtrl.addEventListener('click', function(e) {
        var btn = e.target.closest('.seg-btn');
        if (!btn) return;
        langCtrl.querySelectorAll('.seg-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        if (I18N) {
          I18N.setLang(btn.getAttribute('data-lang'));
          // Re-render current screen
          loadedScreens = {};
          loadScreen(currentScreen);
        }
      });
    }
  }
  initMenuControls();

  // === Notification Bell ===
  var notifBtn = document.getElementById('notifBtn');
  var notifDot = document.getElementById('notifDot');
  var notifOverlay = document.getElementById('notifOverlay');
  var notifBack = document.getElementById('notifBack');
  var notifList = document.getElementById('notifList');

  if (notifBtn) {
    notifBtn.addEventListener('click', function() {
      notifOverlay.classList.add('open');
      loadNotifications();
      /* ПЕРВОЕ ИСПОЛЬЗОВАНИЕ УВЕДОМЛЕНИЙ (Ю10, кусок 230): человек сам
         пришёл за ними — вот здесь и спрашиваем разрешение, а не на
         первом экране после входа. */
      if (window.KSLT_PUSH && window.KSLT_PUSH.спросить) window.KSLT_PUSH.спросить();
    });
  }
  if (notifBack) {
    notifBack.addEventListener('click', function() {
      notifOverlay.classList.remove('open');
    });
  }

  function loadNotifications() {
    var I18N = window.KSLT_I18N;
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser || !supabaseClient) {
      notifList.innerHTML = '<div class="notif-empty">' + I18N.t('profile.login') + '</div>';
      return;
    }
    notifList.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('notification_log')
      .select('*')
      .eq('profile_id', AUTH.currentUser.id)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(function(r) {
        if (r.error || !r.data || !r.data.length) {
          notifList.innerHTML = '<div class="notif-empty">' + I18N.t('notif.empty') + '</div>';
          return;
        }
        var html = '';
        r.data.forEach(function(n) {
          var d = new Date(n.created_at);
          var timeStr = d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear() + ', ' + d.getHours() + ':' + String(d.getMinutes()).replace(/^(\d)$/, '0$1');
          // Уведомление про счёт ведёт прямо в окно ввода или подтверждения:
          // раньше строки были неживые, и человек, пришедший по push, должен
          // был сам искать матч в кабинете
          var ведёт = (n.action_type === 'match_score' && n.action_id) ? n.action_id : '';
          html += '<div class="notif-item' + (n.is_read ? '' : ' unread') +
                  (ведёт ? ' notif-item-live" data-match="' + ведёт : '') + '">' +
            '<div class="notif-item-type">' + KSLT_экранировать(n.type || 'system') + '</div>' +
            '<div class="notif-item-text">' + KSLT_экранировать(n.message || n.title || '') + '</div>' +
            '<div class="notif-item-time">' + timeStr + '</div>' +
          '</div>';
        });
        notifList.innerHTML = html;

        notifList.querySelectorAll('[data-match]').forEach(function(el) {
          el.addEventListener('click', function() {
            var MS = window.KSLT_MATCH_SCORE;
            if (!MS) return;
            notifOverlay.classList.remove('open');
            MS.open(el.dataset.match);
          });
        });

        // Mark as read
        supabaseClient.from('notification_log')
          .update({ is_read: true })
          .eq('profile_id', AUTH.currentUser.id)
          .eq('is_read', false)
          .then(function() {
            if (notifDot) notifDot.style.display = 'none';
          });
      });
  }

  APP.checkUnreadNotifications = function() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser || !supabaseClient) return;
    supabaseClient.from('notification_log')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', AUTH.currentUser.id)
      .eq('is_read', false)
      .then(function(r) {
        if (notifDot) {
          notifDot.style.display = (r.count && r.count > 0) ? '' : 'none';
        }
      });
  };

  // === Haptic-style feedback ===
  document.addEventListener('touchstart', function(e) {
    var el = e.target.closest('.card, .tc-card, .tournament-list-item, .news-list-item, .rating-row, .battle-card, .profile-row, .live-list-card');
    if (el) {
      el.style.transform = 'scale(0.98)';
      el.style.transition = 'transform 0.1s';
    }
  }, { passive: true });

  document.addEventListener('touchend', function(e) {
    var el = e.target.closest('.card, .tc-card, .tournament-list-item, .news-list-item, .rating-row, .battle-card, .profile-row, .live-list-card');
    if (el) {
      setTimeout(function() { el.style.transform = ''; }, 100);
    }
  }, { passive: true });

  // === Toast ===
  APP.toast = function(msg) {
    var existing = document.querySelector('.toast');
    if (existing) existing.remove();

    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);

    requestAnimationFrame(function() {
      t.classList.add('show');
    });

    setTimeout(function() {
      t.classList.remove('show');
      setTimeout(function() { t.remove(); }, 300);
    }, 2500);
  };

  // === Onboarding ===
  /**
   * ЗНАКОМСТВО ПРИ ПЕРВОМ ЗАПУСКЕ.
   *
   * ЗВАТЬ ЭТО МОЖНО ДВАЖДЫ, И ЭТО НЕ ОПИСКА: один зов стоит в
   * `checkSession().then` (вошедший открывает приложение), второй — в
   * `APP.onAuthChange` (вход только что произошёл). Какой сработает
   * первым, зависит от того, лежала ли сессия в памяти.
   *
   * ДО 02.11 ЗАЩИТЫ ОТ ВТОРОГО ОКНА НЕ БЫЛО, и когда срабатывали оба,
   * в доме оказывалось ДВА узла с одним и тем же `id`. Человек видел
   * верхний, а `document.getElementById('onbNext')` отдавал кнопку
   * НИЖНЕГО — обработчики вешались не на то, что нажимают. Кнопки
   * «Далее» и «Пропустить» не отвечали вовсе, и из знакомства нельзя
   * было выйти: приложение запиралось на первом экране.
   *
   * Отметка в `localStorage` ставится только при закрытии и от второго
   * зова не спасает — её ещё нет.
   */
  function showOnboarding() {
    if (localStorage.getItem('kslt_onboarding_done')) return;
    /* ОДНО ОКНО, А НЕ ДВА: узел в доме и есть признак того, что
       знакомство уже идёт. */
    if (document.getElementById('onboardingOverlay')) return;
    var I18N = window.KSLT_I18N;

    var steps = [
      { icon: '🎾', title: I18N.t('onb.step1.title'), text: I18N.t('onb.step1.text') },
      { icon: '🏆', title: I18N.t('onb.step2.title'), text: I18N.t('onb.step2.text') },
      { icon: '⭐', title: I18N.t('onb.step3.title'), text: I18N.t('onb.step3.text') }
    ];

    var currentStep = 0;

    var overlay = document.createElement('div');
    overlay.id = 'onboardingOverlay';
    overlay.className = 'onboarding-overlay';

    function renderStep() {
      var s = steps[currentStep];
      var isLast = currentStep === steps.length - 1;
      var dots = '';
      for (var i = 0; i < steps.length; i++) {
        dots += '<span class="onb-dot' + (i === currentStep ? ' active' : '') + '"></span>';
      }

      overlay.innerHTML =
        '<div class="onb-card">' +
          '<div class="onb-icon">' + s.icon + '</div>' +
          '<h2 class="onb-title">' + s.title + '</h2>' +
          '<p class="onb-text">' + s.text + '</p>' +
          '<div class="onb-dots">' + dots + '</div>' +
          '<button class="onb-btn" id="onbNext">' + (isLast ? I18N.t('onb.start') : I18N.t('onb.next')) + '</button>' +
          '<button class="onb-skip" id="onbSkip">' + I18N.t('onb.skip') + '</button>' +
        '</div>';

      /* ЧАСТИ ИЩУТСЯ ВНУТРИ СВОЕГО УЗЛА, А НЕ ПО ВСЕМУ ДОМУ.
         `document.getElementById` отдаёт ПЕРВЫЙ подходящий узел во всём
         документе — не обязательно наш. Узел, собранный кодом, обязан
         искать своё в себе: тогда даже два таких окна не мешают друг
         другу, и беда не зависит от того, уникален ли `id`. */
      overlay.querySelector('#onbNext').addEventListener('click', function() {
        if (isLast) {
          closeOnboarding();
        } else {
          currentStep++;
          renderStep();
        }
      });
      overlay.querySelector('#onbSkip').addEventListener('click', closeOnboarding);
    }

    function closeOnboarding() {
      localStorage.setItem('kslt_onboarding_done', '1');
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    }

    document.body.appendChild(overlay);
    renderStep();
    requestAnimationFrame(function() { overlay.classList.add('open'); });
  }

  // === Auth change handler ===
  APP.onAuthChange = function() {
    // Reload all screens (reset cache + reload current)
    loadedScreens = {};
    loadScreen('screenHome');
    if (currentScreen !== 'screenHome') {
      loadScreen(currentScreen);
    }
    showOnboarding();
  };

  // === Splash Screen ===

  /**
   * ГЕНЕРАЛЬНЫЙ СПОНСОР НА ЭКРАНЕ ЗАГРУЗКИ (кусок 205, 27.10).
   *
   * СНАЧАЛА ИЗ ПАМЯТИ, ПОТОМ ИЗ БАЗЫ. Экран загрузки показывается до
   * того, как база ответит, и ждать её — значит держать человека перед
   * пустым экраном неизвестное время. Поэтому последний известный
   * логотип берётся из памяти и показывается сразу, а свежий приходит
   * следом и запоминается на следующий запуск.
   *
   * ПЕРВЫЙ ЗАПУСК ЖИВЁТ БЕЗ СПОНСОРА — и экран тогда не задерживается:
   * держать человека лишнюю секунду перед тем, чего он не увидит, незачем.
   *
   * ЧТЕНИЕ — ОДНО НА САЙТ И ПРИЛОЖЕНИЕ: `js/kslt-sponsory.js`. Свой
   * запрос здесь стал бы вторым определением одного понятия.
   *
   * ОДИН ПОКАЗ В СУТКИ — СЛОВО КОСТИ 08.11: «давай сделаем 1 раз в день,
   * так как у нас в приложении спонсор отображается на главной и в
   * разделе Спонсоры, то есть слишком много будет раздражать клиентов».
   * Замерено: спонсор и правда виден в ТРЁХ местах — здесь,
   * `screens/home-blocks.js` и `screens/partners.js`, — и экран загрузки
   * из них единственный, который человек не звал.
   *
   * ПОЧЕМУ ИМЕННО СУТКИ, А НЕ «ТРИ РАЗА В ДЕНЬ». Единого верного числа
   * показов нет: измерение Lewis на 2.8 млрд показов (30 кампаний,
   * настоящая рандомизация) даёт у десяти кампаний из тридцати ровную
   * отдачу даже после пятидесяти показов, а у четырёх — спад уже после
   * одного-двух. Усталость — свойство самого объявления, а не число из
   * таблицы. Известное «правило трёх» — работа 1972 года, а нынешние
   * отраслевые «3 в день» опубликованных данных под собой не имеют
   * (проверено по источникам 08.11).
   * Зато здесь работает другое: второй показ за день почти всегда
   * придётся на ТОТ ЖЕ ВЕЧЕР ТОГО ЖЕ ТУРНИРА, когда логотип видели час
   * назад. Раздражение переносится на спонсора — то есть бьёт ровно по
   * тому, за чем он сюда пришёл.
   *
   * ДЕНЬ СЧИТАЕТСЯ ПО БИШКЕКУ, А НЕ ПО ЧАСАМ УСТРОЙСТВА: это тот же
   * день, которым продукт меряет турниры (`KSLT_VREMYA.сегодня()`), и
   * спонсору он называется одной строкой — «один показ в сутки».
   * ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ, и «сутки» тут тоже понятие.
   *
   * ПАМЯТЬ НЕ ОБЯЗАНА БЫТЬ: в частном окне или при запрете хранилища
   * чтение бросает. Тогда показываем — спонсор важнее бережливости, и
   * падать на этом нельзя.
   *
   * @returns {boolean} показан ли спонсор — от этого зависит, сколько
   *                    держать экран загрузки
   */
  var СПОНСОР_КЛЮЧ = 'kslt-sponsor-den';

  function деньПоказаСпонсора() {
    var В = window.KSLT_VREMYA;
    if (В && typeof В.сегодня === 'function') return В.сегодня();
    /* Дома нет — показываем каждый запуск, но не падаем. */
    return null;
  }

  function спонсораУжеПоказывали() {
    var сегодня = деньПоказаСпонсора();
    if (!сегодня) return false;
    try {
      return localStorage.getItem(СПОНСОР_КЛЮЧ) === сегодня;
    } catch (e) { return false; }
  }

  function записатьПоказСпонсора() {
    var сегодня = деньПоказаСпонсора();
    if (!сегодня) return;
    try { localStorage.setItem(СПОНСОР_КЛЮЧ, сегодня); } catch (e) {}
  }

  function показатьСпонсораНаЗагрузке() {
    var блок = document.getElementById('splashSponsor');
    var знак = document.getElementById('splashSponsorLogo');
    var ярлык = document.getElementById('splashSponsorLabel');
    var Д = window.KSLT_SPONSORY;
    if (!блок || !знак || !ярлык || !Д) return false;

    /* СЕГОДНЯ УЖЕ ВИДЕЛИ — не показываем и не задерживаем экран. */
    if (спонсораУжеПоказывали()) return false;

    ярлык.textContent = Д.ярлык();

    function поставить(с) {
      if (!с || !с.logo) return false;
      знак.src = с.logo;
      знак.alt = с.name || '';
      блок.hidden = false;
      return true;
    }

    var показан = поставить(Д.изПамяти());

    /* Свежий спонсор догоняет: если в базе он сменился, человек увидит
       нового на этом же экране, а не со следующего запуска. */
    Д.генеральный().then(function (с) {
      if (с && поставить(с)) записатьПоказСпонсора();
    });

    /* ДЕНЬ ЗАПИСЫВАЕТСЯ ЗА ПОКАЗ, А НЕ ЗА ПОПЫТКУ. Первый запуск живёт
       без спонсора — памяти ещё нет, база не ответила, — и записать день
       тогда значило бы съесть единственный за сутки показ на пустом
       месте. */
    if (показан) записатьПоказСпонсора();

    return показан;
  }

  function hideSplash() {
    var splash = document.getElementById('splashOverlay');
    if (!splash) return;
    splash.classList.add('hide');
    setTimeout(function() { splash.remove(); }, 900);
    // Also hide Capacitor native splash
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.SplashScreen) {
      window.Capacitor.Plugins.SplashScreen.hide();
    }
  }

  // === Род матча ===
  //
  // В историю матчей попадает всё сыгранное, а в статистику — только
  // рейтинговые одиночные. Без метки это выглядит ошибкой: матчей
  // одиннадцать, побед четыре. Метка отвечает на вопрос у самой строки.
  //
  // Дуэль в базе — это баттл: счёт вводится в админке только у
  // опубликованных баттлов, другого пути к match_type = 'duel' нет.
  APP.matchKind = function(m) {
    if (m.match_type === 'duel') return 'battle';
    var t = m.tournament;
    if (t) {
      if (t.format === 'mixed_doubles') return 'mixed';
      if (t.format === 'doubles') return 'doubles';
      if (window.KSLT_RULES && window.KSLT_RULES.нерейтинговая(t.category_id)) return 'friendly';
    }
    return 'rating';
  };

  var KIND_KEY = {
    rating: 'match.tagRating', friendly: 'match.tagFriendly',
    doubles: 'match.tagDoubles', mixed: 'match.tagMixed', battle: 'match.tagBattle'
  };

  APP.matchKindTag = function(m) {
    var kind = APP.matchKind(m);
    var i18n = window.KSLT_I18N;
    return '<span class="match-tag match-tag-' + kind + '">' +
           (i18n ? i18n.t(KIND_KEY[kind]) : kind) + '</span>';
  };

  // === Состав баттла ===
  //
  // Баттл бывает одиночным, парным и смешанным. Участник — член клуба или
  // гость: у гостя есть только имя, карточки игрока у него нет.
  //
  // Состав называем словами: «мужские пары», «женские пары», «микст». Пол
  // база знает и по нему же проверяет состав при заведении — подпись
  // собирается сама. Если состав неровный (показательная игра, где проверку
  // сняли), пишем просто «пары»: соврать нельзя, промолчать можно.
  APP.battleIsPair = function(b) {
    return !!b && b.format && b.format !== 'singles';
  };

  APP.battleFormatLabel = function(b) {
    if (!APP.battleIsPair(b)) return '';
    var i18n = window.KSLT_I18N;
    var t = function(k) { return i18n ? i18n.t(k) : k; };
    if (b.format === 'mixed_doubles') return t('battle.mixed');

    var all = [b.challenger_gender, b.challenger_partner_gender,
               b.opponent_gender, b.opponent_partner_gender];
    if (all.some(function(x) { return !x; })) return t('battle.doubles');
    if (all.every(function(x) { return x === 'men'; })) return t('battle.menDoubles');
    if (all.every(function(x) { return x === 'women'; })) return t('battle.womenDoubles');
    return t('battle.doubles');
  };

  /** Имена стороны: основной участник и напарник, если он есть. */
  APP.battleSideNames = function(b, side) {
    var pre = side === 1 ? 'challenger' : 'opponent';
    var out = [];
    var main = (b[pre + '_player'] && b[pre + '_player'].name) ||
               b[pre + '_name'] || b[pre + '_external_name'];
    if (main) out.push(main);
    if (APP.battleIsPair(b)) {
      var mate = b[pre + '_partner_display'] || b[pre + '_partner_name'];
      if (mate) out.push(mate);
    }
    return out;
  };

  /** Фамилии через косую — для кнопок, куда полные имена не влезают. */
  APP.battleShortSide = function(names) {
    return (names || []).map(function(n) {
      var parts = String(n).trim().split(/\s+/);
      return parts[parts.length - 1] || n;
    }).join(' / ');
  };

  // === Парные игры ===
  //
  // В рейтинг они не идут: очков за пары не начисляют, места в таблице нет.
  // Но сыгранное надо где-то показать — иначе история матчей длиннее, чем
  // объясняет статистика. Пары и микст порознь: партнёр в них разный.
  //
  // У кого таких игр нет, блока нет: пустые нули читаются как неудача.
  APP.pairBlocks = function(p, esc) {
    var i18n = window.KSLT_I18N;
    var t = function(k) { return i18n ? i18n.t(k) : k; };

    function one(title, cls, w, l) {
      var played = w + l;
      if (!played) return '';
      var rate = window.KSLT_RULES.процентПобед(w, l);
      return '<div class="prof-pair-block">' +
        '<div class="prof-pair-head">' +
          '<span class="prof-pair-title">' + title + '</span>' +
          '<span class="match-tag ' + cls + '">' + t('pairs.note') + '</span>' +
        '</div>' +
        /* Плитки даёт общий дом `js/kslt-plitki.js` (шаг A3.5) */
        window.KSLT_PLITKI.сетка([
          window.KSLT_PLITKI.плитка(played, t('pairs.matches')),
          window.KSLT_PLITKI.плитка(w,      t('profile.wins')),
          window.KSLT_PLITKI.плитка(l,      t('profile.losses'))
        ], { свой: 'kst-grid-3' }) +
        '<div class="prof-pair-bar">' +
          '<i class="prof-pair-w" style="width:' + rate + '%"></i>' +
          '<i class="prof-pair-l" style="width:' + (100 - rate) + '%"></i>' +
        '</div>' +
      '</div>';
    }

    return one(t('pairs.title'), 'match-tag-doubles', p.doubles_wins || 0, p.doubles_losses || 0) +
           one(t('pairs.mixed'), 'match-tag-mixed',   p.mixed_wins   || 0, p.mixed_losses   || 0);
  };

  // === View Tracking ===
  APP.incrementView = function(rpcName, params) {
    var key = 'kslt_appview_' + rpcName + '_' + Object.values(params).join('');
    if (localStorage.getItem(key)) return;
    params.p_source = 'app';
    supabaseClient.rpc(rpcName, params).then(function() {
      localStorage.setItem(key, '1');
    });
  };

  function trackAppVisit() {
    if (sessionStorage.getItem('kslt_av')) return;
    supabaseClient.rpc('increment_page_view', { p_page_name: 'app_visit' });
    sessionStorage.setItem('kslt_av', '1');
  }

  // === Init ===
  /**
   * Не устарела ли сборка.
   *
   * Приложение ставится файлом и само не обновляется. Узнать о новой сборке
   * человеку было неоткуда: тестировщица месяц работала на августовской и
   * жаловалась на давно исправленное. Теперь последняя сборка записана в
   * базе, и если своя старее — показываем полоску со ссылкой.
   *
   * Молчим при любой ошибке: не смогли спросить — не мешаем работать.
   */
  function проверитьОбновление() {
    if (!window.supabaseClient) return;
    supabaseClient.from('app_releases')
      .select('version_code, version_name, url, notes')
      .eq('platform', 'android')
      .order('version_code', { ascending: false })
      .limit(1)
      .then(function(r) {
        var последняя = r && r.data && r.data[0];
        if (!последняя || последняя.version_code <= APP.BUILD) return;
        показатьПолосуОбновления(последняя);
      })
      .catch(function() {});
  }

  function показатьПолосуОбновления(сборка) {
    if (document.getElementById('appUpdateBar')) return;
    var полоса = document.createElement('div');
    полоса.id = 'appUpdateBar';
    полоса.className = 'app-update-bar';
    var текст = I18N.t('app.updateReady').replace('{v}', KSLT_экранировать(сборка.version_name));
    полоса.innerHTML =
      '<span>' + текст + '</span>' +
      (сборка.url
        ? '<a href="' + KSLT_экранировать(сборка.url) + '" target="_blank" rel="noopener">' + I18N.t('app.updateGet') + '</a>'
        : '') +
      '<button type="button" aria-label="' + I18N.t('common.close') + '">&times;</button>';
    document.body.appendChild(полоса);
    полоса.querySelector('button').addEventListener('click', function() { полоса.remove(); });
  }

  function init() {
    // Apply i18n to static DOM elements
    if (window.KSLT_I18N) window.KSLT_I18N.updateDOM();

    // Track app visit (once per session)
    trackAppVisit();

    // Номер сборки в меню берём отсюда же, чтобы не разошёлся с проверкой
    var верс = document.getElementById('menuVersion');
    if (верс) верс.textContent = APP.BUILD_NAME;

    проверитьОбновление();

    var AUTH = window.KSLT_AUTH;
    var authScreen = document.getElementById('authScreen');

    // Minimum splash display time (let animations play)
    var splashStart = Date.now();
    /* ДВА СРОКА, А НЕ ОДИН (кусок 205). Без спонсора экран держится
       прежние 1500 мс — столько идут анимации знака и слогана. Со
       спонсором дольше: его ярлык и логотип — второй объект на экране,
       и прочитать его за полсекунды нельзя. Держать длинный срок там,
       где спонсора нет, значило бы задерживать человека перед пустым
       местом.

       СРОК СО СПОНСОРОМ ОПУЩЕН 08.11: 3000 -> 2000, и число взято у
       платформ, а не из вкуса.
         · Apple, Human Interface Guidelines, «Launching»: «Launch
           instantly… sometimes they don't want to wait more than a
           couple of seconds».
         · Google, Splash screens: анимацию значка «рекомендуем не
           превышать 1000 мс», задержка старта не длиннее 166 мс.
       Прежние 3000 были выше планки ОБЕИХ. 2000 — верхняя граница
       Apple, и спонсора на ней видно: он появляется вместе с экраном,
       а не в конце.

       ЧИСЛО ИЗ БЛОГОВ НЕ БЕРЁТСЯ. Ходовые «12% уходят после двух
       секунд» и «8% за каждую лишнюю секунду» проверены 08.11 по
       источникам: ни методики, ни данных под ними нет, а печатают их
       те, кто продаёт генераторы экранов загрузки. */
    var SPLASH_MIN_MS = 1500;
    var SPLASH_SO_SPONSOROM_MS = 2000;
    var спонсорПоказан = показатьСпонсораНаЗагрузке();

    function finishInit() {
      var нужно = спонсорПоказан ? SPLASH_SO_SPONSOROM_MS : SPLASH_MIN_MS;
      var elapsed = Date.now() - splashStart;
      var remaining = Math.max(0, нужно - elapsed);
      setTimeout(hideSplash, remaining);
    }

    if (AUTH) {
      AUTH.setupAuthUI();
      AUTH.checkSession().then(function(profile) {
        if (profile) {
          // Already logged in — hide auth, show home
          authScreen.classList.remove('open');
          loadScreen('screenHome');
          showOnboarding();
          // Check unread notifications
          APP.checkUnreadNotifications();
          // Init push notifications
          if (window.KSLT_PUSH) window.KSLT_PUSH.init();
          // Заработал что-то с прошлого раза — поздравляем. Отметка о показе
          // общая с сайтом, поэтому дважды не всплывёт
          if (window.KSLT_BADGE_CELEBRATION && profile.player_id) {
            window.KSLT_BADGE_CELEBRATION.check(profile.player_id);
          }
        }
        // Else auth screen stays open (visible by default in HTML)
        finishInit();
      });
    } else {
      // No auth module — just show home
      authScreen.classList.remove('open');
      loadScreen('screenHome');
      finishInit();
    }
  }

  // Wait for Supabase
  if (supabaseClient) {
    init();
  } else {
    // Retry
    var retries = 0;
    var interval = setInterval(function() {
      retries++;
      if (window.supabaseClient || retries > 10) {
        clearInterval(interval);
        initSupabase();
        init();
      }
    }, 200);
  }

})();
