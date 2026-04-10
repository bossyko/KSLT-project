// ============================================
// KSLT Mobile — Rating Screen
// ============================================
(function() {
  'use strict';

  var R = window.KSLT_RATING = {};
  var allPlayers = [];

  // Fixed categories (match DB category_id format: men-tour, women-masters, etc.)
  var CATEGORIES = [
    { key: 'tour', label: 'Tour' },
    { key: 'futures', label: 'Futures' },
    { key: 'challenger', label: 'Challenger' },
    { key: 'masters', label: 'Masters' },
    { key: 'promasters', label: 'Pro-Masters' }
  ];

  var currentGender = 'men';
  var currentCatKey = 'masters';
  var currentSearch = '';
  var GUEST_VISIBLE = 5;
  var GUEST_BLUR = 3;
  var listenersReady = false;

  R.load = function() {
    if (!supabaseClient) return;
    if (!listenersReady) {
      initGenderToggle();
      initCategoryDropdown();
      initSearch();
      listenersReady = true;
    }
    updateCatBtnLabel();
    loadPlayers();
  };

  // --- Gender toggle ---
  function initGenderToggle() {
    var container = document.getElementById('ratingGender');
    if (!container) return;
    container.addEventListener('click', function(e) {
      var btn = e.target.closest('.gender-toggle-btn');
      if (!btn || btn.classList.contains('active')) return;
      container.querySelectorAll('.gender-toggle-btn').forEach(function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentGender = btn.getAttribute('data-gender');
      loadPlayers();
    });
  }

  // --- Category dropdown (bottom sheet) ---
  function initCategoryDropdown() {
    var catBtn = document.getElementById('ratingCatBtn');
    var sheet = document.getElementById('ratingCatSheet');
    var optionsEl = document.getElementById('ratingCatOptions');
    if (!catBtn || !sheet || !optionsEl) return;

    // Render category options
    var html = '';
    CATEGORIES.forEach(function(cat) {
      html += '<button class="bs-option' + (cat.key === currentCatKey ? ' active' : '') + '" data-cat="' + cat.key + '">' + esc(cat.label) + '</button>';
    });
    optionsEl.innerHTML = html;

    // Open sheet
    catBtn.addEventListener('click', function() {
      // Update active state before opening
      optionsEl.querySelectorAll('.bs-option').forEach(function(opt) {
        opt.classList.toggle('active', opt.getAttribute('data-cat') === currentCatKey);
      });
      sheet.classList.add('open');
    });

    // Select category
    optionsEl.addEventListener('click', function(e) {
      var opt = e.target.closest('.bs-option');
      if (!opt) return;
      currentCatKey = opt.getAttribute('data-cat');
      sheet.classList.remove('open');
      updateCatBtnLabel();
      loadPlayers();
    });

    // Close on overlay click
    sheet.addEventListener('click', function(e) {
      if (e.target === sheet) sheet.classList.remove('open');
    });
  }

  function updateCatBtnLabel() {
    var catBtn = document.getElementById('ratingCatBtn');
    if (!catBtn) return;
    var cat = CATEGORIES.find(function(c) { return c.key === currentCatKey; });
    var label = cat ? cat.label : 'Masters';
    catBtn.innerHTML = esc(label) + ' <svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>';
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
        render();
      }, 300);
    });
  }

  // --- Load players from Supabase ---
  function loadPlayers() {
    var el = document.getElementById('ratingContent');
    if (!el) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    var categoryId = currentGender + '-' + currentCatKey;

    supabaseClient.from('players')
      .select('*')
      .eq('category_id', categoryId)
      .order('points', { ascending: false })
      .then(function(r) {
        allPlayers = r.data || [];
        render();
      });
  }

  // --- Render table ---
  function render() {
    var el = document.getElementById('ratingContent');
    if (!el) return;

    // Filter by search
    var displayPlayers = allPlayers;
    if (currentSearch) {
      displayPlayers = allPlayers.filter(function(p) {
        return (p.name || '').toLowerCase().indexOf(currentSearch) !== -1;
      });
    }

    if (displayPlayers.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">Нет игроков</div><div class="empty-text">' + (currentSearch ? 'По запросу «' + esc(currentSearch) + '» ничего не найдено' : 'В этой категории пока нет игроков') + '</div></div>';
      return;
    }

    var isGuest = !(window.KSLT_AUTH && window.KSLT_AUTH.currentUser);
    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE + GUEST_BLUR, displayPlayers.length) : displayPlayers.length;

    var html = '<div class="rating-table">';
    html += '<div class="rating-table-head">' +
      '<span class="rt-col-rank">#</span>' +
      '<span class="rt-col-name">Игрок</span>' +
      '<span class="rt-col-pts">Очки</span>' +
      '<span class="rt-col-wl">В/П</span>' +
      '<span class="rt-col-form">Форма</span>' +
    '</div>';

    for (var i = 0; i < visibleCount; i++) {
      var p = displayPlayers[i];
      var rank = i + 1;
      var form = p.form || [];
      var formDots = form.slice(-5).map(function(f) {
        return '<span class="rr-form-dot ' + (f === 'W' || f === 'w' ? 'w' : 'l') + '"></span>';
      }).join('');

      // Guest blur for rows after GUEST_VISIBLE
      var blurClass = '';
      if (isGuest && i >= GUEST_VISIBLE) {
        var blurLevel = i - GUEST_VISIBLE + 1;
        blurClass = ' rr-blur rr-blur-' + Math.min(blurLevel, 4);
      }

      var rowClickAttr = (!isGuest && p.id) ? ' data-player-id="' + p.id + '" style="cursor:pointer"' : '';

      html += '<div class="rating-row' + blurClass + '"' + rowClickAttr + '>' +
        '<span class="rr-rank' + (rank <= 3 ? ' top' : '') + '">' + rank + '</span>' +
        '<div class="rr-player">' +
          (p.photo ? '<img class="rr-avatar-img" src="' + esc(p.photo) + '" alt="">' : '<div class="rr-avatar">' + initials(p.name) + '</div>') +
          '<span class="rr-name">' + esc(p.name) + '</span>' +
        '</div>' +
        '<span class="rr-pts">' + (p.points || 0) + '</span>' +
        '<span class="rr-wl">' + (p.wins || 0) + '/' + (p.losses || 0) + '</span>' +
        '<div class="rr-form">' + formDots + '</div>' +
      '</div>';
    }

    html += '</div>';

    // Guest overlay with CTA
    if (isGuest && displayPlayers.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon">' +
            '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">' +
              '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>' +
              '<path d="M7 11V7a5 5 0 0110 0v4"/>' +
            '</svg>' +
          '</div>' +
          '<div class="rr-guest-title">Полный рейтинг доступен<br>после входа</div>' +
          '<div class="rr-guest-text">Войдите, чтобы увидеть всех игроков, статистику и форму</div>' +
          '<button class="rr-guest-btn" id="ratingLoginBtn">Войти</button>' +
        '</div>' +
      '</div>';
    }

    el.innerHTML = html;

    // Bind login button
    if (isGuest) {
      var loginBtn = document.getElementById('ratingLoginBtn');
      if (loginBtn) {
        loginBtn.addEventListener('click', function() {
          if (window.KSLT_AUTH && window.KSLT_AUTH.showAuth) {
            window.KSLT_AUTH.showAuth();
          }
        });
      }
    }

    // Bind player row clicks → open player detail
    if (!isGuest) {
      el.querySelectorAll('.rating-row[data-player-id]').forEach(function(row) {
        row.addEventListener('click', function() {
          var pid = row.getAttribute('data-player-id');
          if (pid && window.KSLT_PLAYER_DETAIL) {
            window.KSLT_PLAYER_DETAIL.open(pid);
          }
        });
      });
    }
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
