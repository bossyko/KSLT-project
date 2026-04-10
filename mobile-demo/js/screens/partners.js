// ============================================
// KSLT Mobile — Partners + Sponsors + Info Screens
// ============================================
(function() {
  'use strict';

  var PR = window.KSLT_PARTNERS = {};
  var SP = window.KSLT_SPONSORS = {};
  var allPartners = [];
  var GUEST_VISIBLE = 5;
  var currentNtrp = 'all';
  var currentPartnerSearch = '';

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

  // ============================
  // PARTNERS (Find a Partner)
  // ============================

  PR.load = function() {
    var el = document.getElementById('partnersList');
    if (!el || !supabaseClient) return;
    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    // Load all players with NTRP rating for partner matching
    supabaseClient.from('players')
      .select('id, name, photo, category_id, ntrp_rating, points, wins, losses, bio')
      .not('ntrp_rating', 'is', null)
      .order('ntrp_rating', { ascending: true })
      .then(function(r) {
        allPartners = r.data || [];
        renderPartners();
        initPartnerSearch();
      });
  };

  function initPartnerSearch() {
    var input = document.getElementById('partnerSearch');
    if (!input || input._bound) return;
    input._bound = true;
    var timer = null;
    input.addEventListener('input', function() {
      var q = this.value.trim().toLowerCase();
      clearTimeout(timer);
      timer = setTimeout(function() {
        currentPartnerSearch = q;
        renderPartners();
      }, 300);
    });
  }

  PR.filter = function(ntrp) {
    currentNtrp = ntrp;
    renderPartners();
  };

  function renderPartners() {
    var el = document.getElementById('partnersList');
    if (!el) return;

    var AUTH = window.KSLT_AUTH;
    var isGuest = !(AUTH && AUTH.currentUser);

    // Filter by NTRP
    var filtered = allPartners;
    if (currentNtrp !== 'all') {
      var nVal = parseFloat(currentNtrp);
      filtered = filtered.filter(function(p) {
        var r = parseFloat(p.ntrp_rating);
        return r >= nVal - 0.5 && r <= nVal + 0.5;
      });
    }
    // Filter by name search
    if (currentPartnerSearch) {
      filtered = filtered.filter(function(p) {
        return (p.name || '').toLowerCase().indexOf(currentPartnerSearch) !== -1;
      });
    }

    if (filtered.length === 0) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🤝</div><div class="empty-title">Нет партнёров</div><div class="empty-text">Нет игроков с указанным NTRP уровнем</div></div>';
      return;
    }

    var visibleCount = isGuest ? Math.min(GUEST_VISIBLE, filtered.length) : filtered.length;
    var html = '';

    for (var i = 0; i < visibleCount; i++) {
      var p = filtered[i];
      var CAT_MAP = {'men-tour':'Tour','men-futures':'Futures','men-challenger':'Challenger','men-masters':'Masters','men-promasters':'Pro-Masters','women-tour':'Tour Ж','women-futures':'Futures Ж','women-challenger':'Challenger Ж'};

      html += '<div class="partner-card"' + (isGuest ? '' : ' data-player-id="' + p.id + '"') + '>';
      html += '<div class="partner-avatar">';
      html += p.photo ? '<img src="' + esc(p.photo) + '" alt="">' : '<span>' + initials(p.name) + '</span>';
      html += '</div>';
      html += '<div class="partner-info">';
      html += '<div class="coach-card-name">' + esc(p.name) + '</div>';
      html += '<div class="coach-card-meta">';
      if (p.ntrp_rating) html += '<span>NTRP ' + Number(p.ntrp_rating).toFixed(1) + '</span>';
      if (p.category_id) html += '<span>' + esc(CAT_MAP[p.category_id] || p.category_id) + '</span>';
      html += '</div>';
      html += '</div>';
      html += '</div>';
    }

    // Guest overlay
    if (isGuest && filtered.length > GUEST_VISIBLE) {
      html += '<div class="rr-guest-overlay">' +
        '<div class="rr-guest-cta">' +
          '<div class="rr-guest-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg></div>' +
          '<div class="rr-guest-title">Все партнёры доступны<br>после входа</div>' +
          '<button class="rr-guest-btn" id="partnersLoginBtn">Войти</button>' +
        '</div></div>';
    }

    el.innerHTML = html;

    if (isGuest) {
      var loginBtn = document.getElementById('partnersLoginBtn');
      if (loginBtn) loginBtn.addEventListener('click', function() { if (AUTH) AUTH.showAuth(); });
    }

    // Click → open player detail
    el.querySelectorAll('.partner-card[data-player-id]').forEach(function(card) {
      card.addEventListener('click', function() {
        var pid = card.getAttribute('data-player-id');
        if (pid && window.KSLT_PLAYER_DETAIL) {
          window.KSLT_PLAYER_DETAIL.open(pid);
        }
      });
    });
  }

  // ============================
  // SPONSORS
  // ============================

  SP.load = function() {
    var el = document.getElementById('sponsorsList');
    if (!el) return;

    // Load from Supabase sponsors table if exists, otherwise static
    if (supabaseClient) {
      supabaseClient.from('sponsors')
        .select('*')
        .order('sort_order', { ascending: true })
        .then(function(r) {
          if (r.data && r.data.length > 0) {
            renderSponsors(el, r.data);
          } else {
            renderStaticSponsors(el);
          }
        })
        .catch(function() {
          renderStaticSponsors(el);
        });
    } else {
      renderStaticSponsors(el);
    }
  };

  function renderSponsors(el, sponsors) {
    var html = '<div class="sponsors-grid">';
    sponsors.forEach(function(s) {
      html += '<div class="sponsor-card">';
      if (s.logo) html += '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" class="sponsor-logo">';
      html += '<div class="sponsor-name">' + esc(s.name) + '</div>';
      if (s.description) html += '<div class="sponsor-desc">' + esc(s.description) + '</div>';
      if (s.url) html += '<a href="' + esc(s.url) + '" target="_blank" class="sponsor-link">Подробнее ↗</a>';
      html += '</div>';
    });
    html += '</div>';
    el.innerHTML = html;
  }

  function renderStaticSponsors(el) {
    el.innerHTML =
      '<div class="sponsors-grid">' +
        '<div class="sponsor-card">' +
          '<div class="sponsor-logo-placeholder">NURZAMAN</div>' +
          '<div class="sponsor-name">Nurzaman</div>' +
          '<div class="sponsor-desc">Генеральный спонсор KSLT</div>' +
        '</div>' +
      '</div>' +
      '<div class="pd-empty-small" style="margin-top:16px">Хотите стать спонсором? Свяжитесь с нами</div>';
  }

  // ============================
  // INFO overlays (About, Rules, FAQ)
  // ============================

  window.KSLT_INFO = {};

  window.KSLT_INFO.showAbout = function() {
    showInfoOverlay('О KSLT',
      '<div class="info-content">' +
        '<h3>Kyrgyzstan Social Lawn Tennis</h3>' +
        '<p>KSLT — это теннисное сообщество Кыргызстана, объединяющее любителей и профессионалов тенниса.</p>' +
        '<h4>Наша миссия</h4>' +
        '<p>Развитие тенниса в Кыргызстане, создание комфортной среды для игроков всех уровней.</p>' +
        '<h4>Что мы предлагаем</h4>' +
        '<ul>' +
          '<li>Рейтинговая система (5 категорий)</li>' +
          '<li>Регулярные турниры</li>' +
          '<li>Система вызовов между игроками</li>' +
          '<li>Профессиональные тренеры</li>' +
          '<li>Партнёрские корты</li>' +
          '<li>Программа лояльности</li>' +
        '</ul>' +
      '</div>'
    );
  };

  window.KSLT_INFO.showRules = function() {
    showInfoOverlay('Правила',
      '<div class="info-content">' +
        '<h3>Правила рейтинговой системы</h3>' +
        '<h4>Категории</h4>' +
        '<p>Tour → Futures → Challenger → Masters → Pro-Masters (высшая)</p>' +
        '<h4>Начисление очков</h4>' +
        '<p>Очки начисляются за участие в турнирах KSLT. Количество зависит от уровня турнира и результата.</p>' +
        '<h4>Промоушен</h4>' +
        '<p>Топ-5 игроков категории получают повышение в следующую категорию в конце сезона.</p>' +
        '<h4>Сезон</h4>' +
        '<p>Сезон = календарный год. Очки обнуляются при переходе в новую категорию.</p>' +
        '<h4>Вызовы</h4>' +
        '<p>Члены KSLT могут вызывать друг друга на матчи через систему вызовов.</p>' +
      '</div>'
    );
  };

  window.KSLT_INFO.showFaq = function() {
    showInfoOverlay('FAQ',
      '<div class="info-content">' +
        '<div class="faq-item"><h4>Как стать членом KSLT?</h4><p>Зарегистрируйтесь на сайте и оформите членство через раздел «Членство».</p></div>' +
        '<div class="faq-item"><h4>Сколько стоит членство?</h4><p>Актуальные цены доступны в разделе «Членство» на сайте.</p></div>' +
        '<div class="faq-item"><h4>Как записаться на турнир?</h4><p>Откройте турнир и нажмите «Записаться». Необходимо активное членство.</p></div>' +
        '<div class="faq-item"><h4>Как работает рейтинг?</h4><p>Рейтинг ведётся внутри категории. Очки начисляются за турниры.</p></div>' +
        '<div class="faq-item"><h4>Как отправить вызов?</h4><p>Откройте профиль игрока и нажмите «Вызвать на матч». Нужно членство.</p></div>' +
        '<div class="faq-item"><h4>Как подключить Telegram?</h4><p>Найдите бота @KSLTennisBot в Telegram и нажмите /start.</p></div>' +
      '</div>'
    );
  };

  function showInfoOverlay(title, contentHtml) {
    var existing = document.getElementById('infoOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'infoOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML =
      '<div class="td-topbar">' +
        '<button class="td-back" id="infoBack">' +
          '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>Назад' +
        '</button>' +
        '<span class="td-topbar-title">' + esc(title) + '</span>' +
        '<span style="width:60px"></span>' +
      '</div>' +
      '<div style="padding:16px">' + contentHtml + '</div>';

    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    document.getElementById('infoBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });
  }

})();
