// ============================================
// KSLT Mobile — Courts Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var CT = window.KSLT_COURTS = {};
  var allCourts = [];
  var currentCourtFilter = 'all';
  var GUEST_VISIBLE = 5;

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function courtWord(n) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return 'кортов';
    if (last > 1 && last < 5) return 'корта';
    if (last === 1) return 'корт';
    return 'кортов';
  }

  var SURFACE_MAP = { hard: 'Хард', clay: 'Грунт', carpet: 'Ковёр', grass: 'Трава' };
  var AMENITY_MAP = {
    locker_rooms: '🔑 Раздевалки', showers: '🚿 Душевые', parking: '🅿️ Парковка',
    racket_rental: '🎾 Прокат', pro_shop: '🛍 Магазин', cafe: '☕ Кафе',
    gym: '💪 Зал', lighting: '💡 Освещение', wifi: '📶 Wi-Fi',
    climate: '❄️ Климат', kids_area: '👶 Детская', video: '📹 Видео'
  };

  CT.load = function() {
    var el = document.getElementById('courtsList');
    if (!el || !supabaseClient) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('courts')
      .select('*')
      .order('promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .then(function(r) {
        allCourts = (r.data || []).map(function(row) {
          var types = row.court_types || [];
          var totalCourts = 0;
          var minPrice = Infinity;
          var hasIndoor = false, hasOutdoor = false;
          types.forEach(function(t) {
            totalCourts += (t.count || 1);
            if (t.price && t.price < minPrice) minPrice = t.price;
            if (t.type === 'indoor') hasIndoor = true;
            if (t.type === 'outdoor') hasOutdoor = true;
          });
          if (minPrice === Infinity) minPrice = 0;

          var address = [row.street, row.building, row.city || 'Бишкек'].filter(Boolean).join(', ');

          return {
            id: row.id,
            name: row.name || I18N.t('courts.court'),
            photo: row.photo || '',
            totalCourts: totalCourts,
            minPrice: minPrice,
            hasIndoor: hasIndoor,
            hasOutdoor: hasOutdoor,
            surface: types.length > 0 ? (SURFACE_MAP[types[0].surface] || types[0].surface) : '',
            address: address,
            phone: row.phone || '',
            description: row.description || '',
            amenities: row.amenities || [],
            gallery: row.gallery || [],
            google_maps_url: row.google_maps_url || '',
            twogis_url: row.twogis_url || '',
            promoted: row.promoted,
            partner: row.partner,
            courtTypes: types
          };
        });
        render();
      });
  };

  CT.filter = function(f) {
    currentCourtFilter = f;
    render();
  };

  function render() {
    var el = document.getElementById('courtsList');
    if (!el) return;

    var courtsToShow = allCourts;
    if (currentCourtFilter === 'indoor') {
      courtsToShow = allCourts.filter(function(c) { return c.hasIndoor; });
    } else if (currentCourtFilter === 'outdoor') {
      courtsToShow = allCourts.filter(function(c) { return c.hasOutdoor; });
    }

    if (courtsToShow.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏟</div><div class="empty-title">' + I18N.t('courts.empty') + '</div></div>';
      return;
    }

    var AUTH = window.KSLT_AUTH;
    var isGuest = !(AUTH && AUTH.currentUser);
    var isMember = AUTH && AUTH._membershipStatus;
    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE, courtsToShow.length) : courtsToShow.length;

    var html = '';
    for (var i = 0; i < visibleCount; i++) {
      var c = courtsToShow[i];
      html += '<div class="court-card" data-court-idx="' + i + '">';
      if (c.photo) {
        html += '<div class="court-card-photo"><img src="' + esc(c.photo) + '" alt="">';
        if (c.partner) html += '<span class="coach-partner-badge">Партнёр</span>';
        html += '</div>';
      }
      html += '<div class="court-card-body">';
      html += '<div class="coach-card-name">' + esc(c.name) + '</div>';
      html += '<div class="court-card-meta">';
      var typeLabel = c.hasIndoor && c.hasOutdoor ? 'Indoor + Outdoor' : (c.hasIndoor ? 'Indoor' : 'Outdoor');
      html += '<span>🎾 ' + c.totalCourts + ' ' + I18N.t('courts.courts') + '</span>';
      html += '<span>' + typeLabel + '</span>';
      if (c.surface) html += '<span>' + esc(c.surface) + '</span>';
      html += '</div>';
      if (c.address) html += '<div class="court-card-address">📍 ' + esc(c.address) + '</div>';
      if (c.minPrice > 0) html += '<div class="court-card-price">' + I18N.t('courts.from') + ' ' + c.minPrice + ' ' + I18N.t('coaches.perHour') + '</div>';
      html += '</div></div>';
    }

    // Guest blur overlay
    if (isGuest && courtsToShow.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>' +
          '<div class="rr-guest-title">Все корты доступны<br>после входа</div>' +
          '<div class="rr-guest-text">Войдите, чтобы увидеть все корты и цены</div>' +
          '<button class="rr-guest-btn" id="courtsLoginBtn">Войти</button>' +
        '</div></div>';
    }

    el.innerHTML = html;

    // Login button
    var loginBtn = document.getElementById('courtsLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        if (AUTH) AUTH.showAuth();
      });
    }

    // Card click → detail
    el.querySelectorAll('.court-card[data-court-idx]').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(card.getAttribute('data-court-idx'));
        if (isGuest) {
          if (AUTH) AUTH.showAuth();
          return;
        }
        openCourtDetail(courtsToShow[idx], isMember);
      });
    });
  }

  function openCourtDetail(c, isMember) {
    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_court_view', { p_id: c.id });
    }

    var existing = document.getElementById('courtDetailOverlay');
    if (existing) existing.remove();

    var html = '<div class="td-topbar">' +
      '<button class="td-back" id="courtDetailBack">' +
        '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' + I18N.t('common.back') +
      '</button>' +
      '<span class="td-topbar-title">' + I18N.t('court.detail') + '</span>' +
      '<span style="width:60px"></span>' +
    '</div>';

    // Hero image / gallery
    var galleryImages = [c.photo].concat(c.gallery || []).filter(Boolean);
    if (galleryImages.length > 1) {
      html += '<div class="court-gallery" style="overflow-x:auto;white-space:nowrap;-webkit-overflow-scrolling:touch;scroll-snap-type:x mandatory">';
      galleryImages.forEach(function(img) {
        html += '<div class="nd-hero-img" style="display:inline-block;width:100%;scroll-snap-align:start;background-image:url(' + img + ')"></div>';
      });
      html += '</div>';
      html += '<div style="text-align:center;padding:4px 0;font-size:11px;color:var(--text-muted)">← ' + I18N.t('court.swipe') + ' (' + galleryImages.length + ') →</div>';
    } else if (c.photo) {
      html += '<div class="nd-hero-img" style="background-image:url(' + c.photo + ')"></div>';
    }

    html += '<div style="padding:16px">';
    html += '<h2 class="pd-name" style="text-align:left">' + esc(c.name) + '</h2>';

    // Type + courts count
    var typeLabel = c.hasIndoor && c.hasOutdoor ? 'Indoor + Outdoor' : (c.hasIndoor ? 'Indoor' : 'Outdoor');
    html += '<div class="pd-meta" style="justify-content:flex-start">';
    html += '<span>🎾 ' + c.totalCourts + ' ' + I18N.t('courts.courts') + '</span>';
    html += '<span>' + typeLabel + '</span>';
    if (c.surface) html += '<span>' + esc(c.surface) + '</span>';
    html += '</div>';

    // Address
    if (c.address) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📍 ' + I18N.t('court.address') + '</h3>';
      html += '<div style="font-size:13px;color:var(--text-sec)">' + esc(c.address) + '</div>';
      if (c.google_maps_url || c.twogis_url) {
        html += '<div style="display:flex;gap:8px;margin-top:8px">';
        if (c.google_maps_url) html += '<a href="' + esc(c.google_maps_url) + '" target="_blank" style="font-size:12px;color:var(--accent)">Google Maps ↗</a>';
        if (c.twogis_url) html += '<a href="' + esc(c.twogis_url) + '" target="_blank" style="font-size:12px;color:var(--accent)">2GIS ↗</a>';
        html += '</div>';
      }
      html += '</div>';
    }

    // Prices table
    if (c.courtTypes.length > 0) {
      html += '<div class="pd-section"><h3 class="pd-section-title">💰 ' + I18N.t('court.prices') + '</h3>';
      html += '<div class="pd-matches-list">';
      c.courtTypes.forEach(function(t) {
        var typeName = t.type === 'indoor' ? 'Indoor' : 'Outdoor';
        var surfName = SURFACE_MAP[t.surface] || t.surface || '';
        html += '<div class="pd-match" style="cursor:default">';
        html += '<div class="pd-match-info"><div class="pd-match-opp">' + typeName + ' · ' + surfName + '</div><div class="pd-match-tournament">' + (t.count || 1) + ' корт(ов)</div></div>';
        html += '<div class="pd-match-score" style="color:var(--accent)">' + (t.price || '—') + ' сом</div>';
        html += '</div>';
      });
      html += '</div></div>';
    }

    // Description
    if (c.description) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📝 ' + I18N.t('court.description') + '</h3>';
      html += '<div style="font-size:13px;color:var(--text-sec);line-height:1.5">' + esc(c.description) + '</div></div>';
    }

    // Amenities
    if (c.amenities.length > 0) {
      html += '<div class="pd-section"><h3 class="pd-section-title">🏗 ' + I18N.t('court.amenities') + '</h3>';
      html += '<div style="display:flex;flex-wrap:wrap;gap:6px">';
      c.amenities.forEach(function(a) {
        var label = AMENITY_MAP[a] || a;
        html += '<span class="coach-tag">' + label + '</span>';
      });
      html += '</div></div>';
    }

    // Contact (member only)
    if (isMember && c.phone) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📞 ' + I18N.t('court.contact') + '</h3>';
      html += '<a href="tel:' + esc(c.phone) + '" class="pd-challenge-btn" style="display:block;text-align:center;text-decoration:none">' + esc(c.phone) + '</a>';
      html += '</div>';
    } else if (!isMember && c.phone) {
      html += '<div class="pd-cta-membership"><p>' + I18N.t('court.contactLocked') + '</p></div>';
    }

    html += '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'courtDetailOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML = html;
    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    document.getElementById('courtDetailBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });
  }

})();
