// ============================================
// KSLT Mobile — App (Navigation + Init)
// ============================================
(function() {
  'use strict';

  var APP = window.KSLT_APP = {};
  var currentScreen = 'screenHome';
  var loadedScreens = {};

  // === Theme ===
  var _themeMode = localStorage.getItem('kslt_theme') || 'system';

  function applyTheme() {
    var isDark;
    if (_themeMode === 'dark') {
      isDark = true;
    } else if (_themeMode === 'light') {
      isDark = false;
    } else {
      isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
    // StatusBar (Capacitor)
    if (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.StatusBar) {
      var SB = window.Capacitor.Plugins.StatusBar;
      SB.setStyle({ style: isDark ? 'DARK' : 'LIGHT' });
      SB.setBackgroundColor({ color: isDark ? '#0A0A0A' : '#F5F5F5' });
    }
  }

  APP.setTheme = function(mode) {
    _themeMode = mode;
    localStorage.setItem('kslt_theme', mode);
    applyTheme();
  };

  APP.getTheme = function() { return _themeMode; };

  // Listen for system theme changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function() {
    if (_themeMode === 'system') applyTheme();
  });

  // Apply immediately
  applyTheme();

  // === Tab Navigation ===
  var tabs = document.querySelectorAll('.tab-item');
  var screens = document.querySelectorAll('.screen');
  var menuOverlay = document.getElementById('menuOverlay');
  var menuBtn = document.getElementById('menuBtn');
  var menuClose = document.getElementById('menuClose');

  APP.switchScreen = function(screenId) {
    screens.forEach(function(s) { s.classList.remove('active'); });
    tabs.forEach(function(t) { t.classList.remove('active'); });

    var target = document.getElementById(screenId);
    if (target) {
      target.classList.add('active');
      target.scrollTop = 0;
    }

    tabs.forEach(function(t) {
      if (t.getAttribute('data-screen') === screenId) {
        t.classList.add('active');
      }
    });

    currentScreen = screenId;
    menuOverlay.classList.remove('open');

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
      container.querySelectorAll('.filter-chip').forEach(function(c) { c.classList.remove('active'); });
      chip.classList.add('active');
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

  setupChipFilter('courtTypeChips', function(val) {
    if (window.KSLT_COURTS) window.KSLT_COURTS.filter(val);
  });

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
        b.classList.toggle('active', b.getAttribute('data-theme') === current);
      });
      themeCtrl.addEventListener('click', function(e) {
        var btn = e.target.closest('.seg-btn');
        if (!btn) return;
        themeCtrl.querySelectorAll('.seg-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
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
          html += '<div class="notif-item' + (n.is_read ? '' : ' unread') + '">' +
            '<div class="notif-item-type">' + (n.type || 'system') + '</div>' +
            '<div class="notif-item-text">' + (n.message || n.title || '') + '</div>' +
            '<div class="notif-item-time">' + timeStr + '</div>' +
          '</div>';
        });
        notifList.innerHTML = html;

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
  function showOnboarding() {
    if (localStorage.getItem('kslt_onboarding_done')) return;
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

      document.getElementById('onbNext').addEventListener('click', function() {
        if (isLast) {
          closeOnboarding();
        } else {
          currentStep++;
          renderStep();
        }
      });
      document.getElementById('onbSkip').addEventListener('click', closeOnboarding);
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
  function init() {
    // Apply i18n to static DOM elements
    if (window.KSLT_I18N) window.KSLT_I18N.updateDOM();

    // Track app visit (once per session)
    trackAppVisit();

    var AUTH = window.KSLT_AUTH;
    var authScreen = document.getElementById('authScreen');

    // Minimum splash display time (let animations play)
    var splashStart = Date.now();
    var SPLASH_MIN_MS = 1500;

    function finishInit() {
      var elapsed = Date.now() - splashStart;
      var remaining = Math.max(0, SPLASH_MIN_MS - elapsed);
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
