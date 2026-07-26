// ============================================
// KSLT Mobile — Rating Screen
// 3 dropdowns (category, gender, type) + podium + table
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var R = window.KSLT_RATING = {};
  var allPlayers = [];
  var categoriesFromDB = [];

  var currentGender = 'men';
  var currentCatId = 'promasters';
  var currentSearch = '';
  var currentRatingType = 'singles';
  var GUEST_VISIBLE = 5;
  var GUEST_BLUR = 3;
  var listenersReady = false;

  // Gender options
  var GENDERS = [
    { key: 'men', label: function() { return I18N.t('rating.men'); } },
    { key: 'women', label: function() { return I18N.t('rating.women'); } }
  ];

  // Type options
  var TYPES = [
    { key: 'singles', label: function() { return I18N.t('rating.singles'); } },
    { key: 'doubles', label: function() { return I18N.t('rating.doubles'); } }
  ];

  R.load = function() {
    if (!supabaseClient) return;
    if (!listenersReady) {
      initDropdowns();
      initSearch();
      listenersReady = true;
    }
    loadCategories();
  };

  // --- Load categories from Supabase ---
  function loadCategories() {
    supabaseClient.from('categories')
      .select('id, name, name_en, name_kg, sort_order')
      .order('sort_order', { ascending: true })
      .then(function(r) {
        if (r.error) { console.error('Categories load error:', r.error); return; }
        categoriesFromDB = (r.data || []).filter(function(c) {
          return !(c.name && c.name.toLowerCase().indexOf('friendly') !== -1);
        });
        if (!currentCatId && categoriesFromDB.length > 0) {
          currentCatId = categoriesFromDB[0].id;
        }
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
        loadPlayers();
      });
    });

    // Type toggle pills
    document.querySelectorAll('.rating-toggle-btn[data-type]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        currentRatingType = btn.getAttribute('data-type');
        document.querySelectorAll('.rating-toggle-btn[data-type]').forEach(function(b) {
          b.classList.toggle('active', b === btn);
        });
        loadPlayers();
      });
    });
  }

  function getCatLabel(cat) {
    if (I18N && I18N.currentLang === 'en' && cat.name_en) return cat.name_en;
    if (I18N && I18N.currentLang === 'kg' && cat.name_kg) return cat.name_kg;
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
        render();
      }, 300);
    });
  }

  // --- Load players from Supabase ---
  function loadPlayers() {
    var el = document.getElementById('ratingContent');
    if (!el) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    var orderField = currentRatingType === 'doubles' ? 'doubles_points' : 'points';

    supabaseClient.from('players')
      .select('*')
      .eq('category_id', currentCatId)
      .eq('gender', currentGender)
      .order(orderField, { ascending: false })
      .then(function(r) {
        if (r.error) console.error('Rating load error:', r.error);
        allPlayers = r.data || [];
        if (currentRatingType === 'doubles') {
          allPlayers = allPlayers.filter(function(p) { return (p.doubles_points || 0) > 0; });
        }
        renderSubtitle();
        renderPodium();
        render();
      });
  }

  // --- Subtitle ---
  function renderSubtitle() {
    var el = document.getElementById('ratingSubtitle');
    if (!el) return;
    var count = allPlayers.length;
    var season = new Date().getFullYear();
    el.textContent = count + ' ' + I18N.t('rating.playersCount') + ' · ' + I18N.t('rating.season') + ' ' + season;
  }

  // --- Podium (top 3) ---
  function renderPodium() {
    var container = document.getElementById('ratingPodium');
    if (!container) return;

    var top3 = allPlayers.slice(0, 3);
    if (top3.length === 0) {
      container.innerHTML = '';
      return;
    }

    var medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
    var order = [1, 0, 2]; // 2nd, 1st, 3rd
    var sizeClass = ['rp-second', 'rp-first', 'rp-third'];
    var pts = currentRatingType === 'doubles' ? 'doubles_points' : 'points';

    var html = '<div class="rating-podium">';
    for (var oi = 0; oi < order.length; oi++) {
      var i = order[oi];
      if (!top3[i]) continue;
      var p = top3[i];
      var photo = p.photo || 'https://placehold.co/60x60/1a1a2e/888?text=' + initials(p.name);
      html += '<div class="rp-card ' + sizeClass[i] + '">' +
        '<div class="rp-medal">' + medals[i] + '</div>' +
        '<div class="rp-photo-wrap">' +
          '<img class="rp-photo" src="' + esc(photo) + '" alt="' + esc(p.name) + '">' +
        '</div>' +
        '<div class="rp-name">' + esc(shortName(p.name)) + '</div>' +
        '<div class="rp-pts">' + (p[pts] || 0) + ' pts</div>' +
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
    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE + GUEST_BLUR, displayPlayers.length) : displayPlayers.length;
    var pts = currentRatingType === 'doubles' ? 'doubles_points' : 'points';

    var html = '<div class="rating-table">';
    html += '<div class="rating-table-head">' +
      '<span class="rt-col-rank">' + I18N.t('rating.rank') + '</span>' +
      '<span class="rt-col-name">' + I18N.t('rating.player') + '</span>' +
      '<span class="rt-col-pts">' + I18N.t('rating.pts') + '</span>' +
      '<span class="rt-col-ntrp">' + I18N.t('rating.ntrp') + '</span>' +
      '<span class="rt-col-wl">' + I18N.t('rating.wl') + '</span>' +
    '</div>';

    for (var i = 0; i < visibleCount; i++) {
      var p = displayPlayers[i];
      var rank = i + 1;
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
        '<span class="rr-pts">' + (p[pts] || 0) + '</span>' +
        '<span class="rr-ntrp">' + (p.ntrp_rating || '—') + '</span>' +
        '<span class="rr-wl">' + (p.wins || 0) + '/' + (p.losses || 0) + '</span>' +
      '</div>';
    }
    html += '</div>';

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
    }
  }

  function shortName(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) return parts[0] + '\n' + parts.slice(1).join(' ');
    return name;
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
