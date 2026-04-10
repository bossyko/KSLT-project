// ============================================
// KSLT Mobile — Coaches Screen
// ============================================
(function() {
  'use strict';

  var C = window.KSLT_COACHES = {};
  var allCoaches = [];
  var GUEST_VISIBLE = 5;

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  C.load = function() {
    var el = document.getElementById('coachesList');
    if (!el || !supabaseClient) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('coaches')
      .select('*')
      .order('promoted', { ascending: false })
      .order('created_at', { ascending: false })
      .then(function(r) {
        allCoaches = (r.data || []).map(function(row) {
          var name = row.last_name && row.first_name
            ? row.last_name + ' ' + row.first_name
            : row.name || 'Тренер';
          return {
            id: row.id,
            name: name,
            photo: row.photo || '',
            position: row.position || '',
            experience: row.experience || 0,
            price: row.price || 0,
            court: row.court || '',
            tags: row.tags || [],
            shortDesc: row.short_desc || '',
            bio: row.bio || '',
            achievements: row.achievements || [],
            telegram: row.telegram || '',
            whatsapp: row.whatsapp || '',
            promoted: row.promoted,
            partner: row.partner
          };
        });
        render();
      });
  };

  function render() {
    var el = document.getElementById('coachesList');
    if (!el) return;

    if (allCoaches.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">👨‍🏫</div><div class="empty-title">Нет тренеров</div></div>';
      return;
    }

    var AUTH = window.KSLT_AUTH;
    var isGuest = !(AUTH && AUTH.currentUser);
    var isMember = AUTH && AUTH._membershipStatus;
    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE, allCoaches.length) : allCoaches.length;

    var html = '';
    for (var i = 0; i < visibleCount; i++) {
      var c = allCoaches[i];
      html += '<div class="coach-card" data-coach-idx="' + i + '">';
      html += '<div class="coach-card-photo">';
      html += c.photo
        ? '<img src="' + esc(c.photo) + '" alt="">'
        : '<div class="coach-card-initials">' + initials(c.name) + '</div>';
      if (c.partner) html += '<span class="coach-partner-badge">Партнёр</span>';
      html += '</div>';
      html += '<div class="coach-card-body">';
      html += '<div class="coach-card-name">' + esc(c.name) + '</div>';
      if (c.position) html += '<div class="coach-card-spec">' + esc(c.position) + '</div>';
      html += '<div class="coach-card-meta">';
      if (c.experience) html += '<span>🎯 ' + c.experience + ' лет</span>';
      if (c.price) html += '<span>💰 ' + c.price + ' сом/час</span>';
      html += '</div>';
      if (c.tags.length > 0) {
        html += '<div class="coach-card-tags">';
        c.tags.slice(0, 3).forEach(function(t) {
          html += '<span class="coach-tag">' + esc(t) + '</span>';
        });
        html += '</div>';
      }
      html += '</div></div>';
    }

    // Guest blur overlay
    if (isGuest && allCoaches.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>' +
          '<div class="rr-guest-title">Все тренеры доступны<br>после входа</div>' +
          '<div class="rr-guest-text">Войдите, чтобы увидеть контакты и отзывы</div>' +
          '<button class="rr-guest-btn" id="coachesLoginBtn">Войти</button>' +
        '</div></div>';
    }

    el.innerHTML = html;

    // Login button
    var loginBtn = document.getElementById('coachesLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        if (AUTH) AUTH.showAuth();
      });
    }

    // Card click → detail overlay
    el.querySelectorAll('.coach-card[data-coach-idx]').forEach(function(card) {
      card.addEventListener('click', function() {
        var idx = parseInt(card.getAttribute('data-coach-idx'));
        if (isGuest) {
          if (AUTH) AUTH.showAuth();
          return;
        }
        openCoachDetail(allCoaches[idx], isMember);
      });
    });
  }

  function openCoachDetail(c, isMember) {
    var existing = document.getElementById('coachDetailOverlay');
    if (existing) existing.remove();

    var html = '<div class="td-topbar">' +
      '<button class="td-back" id="coachDetailBack">' +
        '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Назад' +
      '</button>' +
      '<span class="td-topbar-title">Тренер</span>' +
      '<span style="width:60px"></span>' +
    '</div>';

    html += '<div style="padding:16px">';

    // Photo + name
    html += '<div class="pd-hero">';
    html += c.photo
      ? '<div class="pd-avatar-wrap"><img class="pd-avatar" src="' + esc(c.photo) + '" alt=""></div>'
      : '<div class="pd-avatar-wrap"><div class="pd-avatar-fallback">' + initials(c.name) + '</div></div>';
    html += '<h2 class="pd-name">' + esc(c.name) + '</h2>';
    if (c.position) html += '<div class="pd-meta"><span class="pd-category">' + esc(c.position) + '</span></div>';
    html += '</div>';

    // Stats
    html += '<div class="pd-stats" style="grid-template-columns:repeat(2,1fr)">';
    if (c.experience) html += '<div class="pd-stat"><div class="pd-stat-num">' + c.experience + '</div><div class="pd-stat-label">Лет опыта</div></div>';
    if (c.price) html += '<div class="pd-stat"><div class="pd-stat-num">' + c.price + '</div><div class="pd-stat-label">Сом/час</div></div>';
    html += '</div>';

    // Court
    if (c.court) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📍 Площадка</h3><div class="pd-empty-small" style="color:var(--text)">' + esc(c.court) + '</div></div>';
    }

    // Bio
    if (c.bio) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📝 О тренере</h3><div style="font-size:13px;color:var(--text-sec);line-height:1.5">' + esc(c.bio) + '</div></div>';
    }

    // Achievements
    if (c.achievements.length > 0) {
      html += '<div class="pd-section"><h3 class="pd-section-title">🏆 Достижения</h3>';
      c.achievements.forEach(function(a) {
        html += '<div style="font-size:13px;color:var(--text-sec);padding:4px 0">• ' + esc(a) + '</div>';
      });
      html += '</div>';
    }

    // Contacts (member only)
    if (isMember && (c.telegram || c.whatsapp)) {
      html += '<div class="pd-section"><h3 class="pd-section-title">📞 Контакты</h3>';
      if (c.telegram) html += '<a href="https://t.me/' + esc(c.telegram) + '" target="_blank" class="pd-challenge-btn" style="background:var(--blue);margin-bottom:8px;display:block;text-align:center;text-decoration:none;color:#fff">Telegram: @' + esc(c.telegram) + '</a>';
      if (c.whatsapp) html += '<a href="https://wa.me/' + esc(c.whatsapp) + '" target="_blank" class="pd-challenge-btn" style="background:var(--green);display:block;text-align:center;text-decoration:none;color:#fff">WhatsApp</a>';
      html += '</div>';
    } else if (!isMember) {
      html += '<div class="pd-cta-membership"><p>Контакты тренера доступны для членов KSLT</p></div>';
    }

    html += '</div>';

    var overlay = document.createElement('div');
    overlay.id = 'coachDetailOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML = html;
    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    document.getElementById('coachDetailBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });
  }

})();
