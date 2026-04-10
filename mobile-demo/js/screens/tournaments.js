// ============================================
// KSLT Mobile — Tournaments Screen (Redesign)
// ============================================
(function() {
  'use strict';

  var T = window.KSLT_TOURNAMENTS = {};
  var allData = [];
  var currentStatus = 'all';
  var currentQuery = '';
  var PER_PAGE = 10;
  var currentPage = 1;
  var totalCount = 0;
  var isLoading = false;
  var isRefreshing = false;

  var months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

  // ============================
  // PUBLIC API
  // ============================

  T.load = function() {
    showSkeleton();
    loadData(true);
  };

  T.filter = function(status) {
    currentStatus = status;
    currentPage = 1;
    allData = [];
    showSkeleton();
    loadData(true);
  };

  T.search = function(query) {
    currentQuery = query;
    currentPage = 1;
    allData = [];
    showSkeleton();
    loadData(true);
  };

  T.refresh = function() {
    if (isRefreshing) return;
    isRefreshing = true;
    currentPage = 1;
    allData = [];
    loadData(true, function() {
      isRefreshing = false;
      hidePullIndicator();
    });
  };

  // ============================
  // DATA LOADING
  // ============================

  function loadData(replace, cb) {
    if (!supabaseClient || isLoading) { if (cb) cb(); return; }
    isLoading = true;

    var today = new Date().toISOString().split('T')[0];
    var offset = (currentPage - 1) * PER_PAGE;

    var query = supabaseClient.from('tournaments')
      .select('*', { count: 'exact' })
      .order('date_start', { ascending: false })
      .range(offset, offset + PER_PAGE - 1);

    // Status filter via DB
    if (currentStatus === 'all') {
      // No filter — show all tournaments
    } else if (currentStatus === 'live') {
      query = query.in('status', ['live', 'in_progress']);
    } else if (currentStatus === 'completed') {
      query = query.or('status.eq.completed,status.eq.finalized,date_start.lt.' + today);
    } else if (currentStatus === 'upcoming') {
      query = query.gte('date_start', today);
    }

    // Text search
    if (currentQuery) {
      var q = '%' + currentQuery + '%';
      query = query.or('title.ilike.' + q + ',location.ilike.' + q);
    }

    query.then(function(r) {
      isLoading = false;
      if (r.error) { console.error('Tournaments:', r.error); if (cb) cb(); return; }

      totalCount = r.count || 0;
      var newData = r.data || [];

      if (replace) {
        allData = newData;
      } else {
        allData = allData.concat(newData);
      }

      render();
      if (cb) cb();
    });
  }

  // ============================
  // RENDER
  // ============================

  function render() {
    var el = document.getElementById('tournamentList');
    if (!el) return;

    var today = new Date().toISOString().split('T')[0];

    if (allData.length === 0 && !isLoading) {
      el.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div>' +
        '<div class="empty-title">Нет турниров</div>' +
        '<div class="empty-text">По данному фильтру турниры не найдены</div></div>';
      hideLoadMore();
      return;
    }

    var html = '';
    allData.forEach(function(t) {
      html += renderCard(t, today);
    });
    el.innerHTML = html;

    // Click handlers
    el.querySelectorAll('.tc-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var tid = this.getAttribute('data-tournament-id');
        if (window.KSLT_HOME && window.KSLT_HOME.openTournamentDetail) {
          window.KSLT_HOME.openTournamentDetail(tid);
        } else {
          openTournamentOverlay(tid);
        }
      });
    });

    // Load more button
    renderLoadMore();
  }

  function renderCard(t, today) {
    var d = new Date(t.date_start);
    var status = getStatus(t, today);

    // Image
    var imgStyle = t.image
      ? 'background-image:url(' + t.image + ')'
      : 'background:linear-gradient(135deg,#0d2818,#1a4030)';

    // Status badge
    var statusCls = status;
    var statusText = { live: 'Live', open: 'Регистрация', soon: 'Скоро', completed: 'Завершён' }[status] || '';

    // Countdown
    var countdown = getCountdown(t, today, status);

    // Format
    var formatText = t.format || '';
    if (formatText === 'singles') formatText = 'Одиночный';
    else if (formatText === 'doubles') formatText = 'Парный';
    else if (formatText === 'mixed') formatText = 'Микст';

    var html = '<div class="tc-card" data-tournament-id="' + t.id + '">';

    // Image block
    html += '<div class="tc-img" style="' + imgStyle + '">';
    if (!t.image) html += '<span class="tc-img-icon">🏆</span>';
    html += '<div class="tc-date"><span class="tc-date-day">' + d.getDate() + '</span><span class="tc-date-month">' + months[d.getMonth()] + '</span></div>';
    html += '<span class="tc-status ' + statusCls + '">' + statusText + '</span>';
    html += '</div>';

    // Body
    html += '<div class="tc-body">';
    html += '<div class="tc-name">' + esc(t.title) + '</div>';

    if (t.location) {
      html += '<div class="tc-location">📍 ' + esc(t.location) + '</div>';
    }

    // Details row
    var details = [];
    if (t.max_participants) details.push('👥 ' + (t.registered_count || 0) + '/' + t.max_participants);
    if (t.prize_fund && t.prize_fund !== '0') details.push('💰 ' + esc(t.prize_fund) + ' сом');
    if (formatText) details.push(formatText);

    if (details.length > 0) {
      html += '<div class="tc-details">';
      details.forEach(function(d) { html += '<span class="tc-detail">' + d + '</span>'; });
      html += '</div>';
    }

    // Countdown
    if (countdown) {
      html += '<div class="tc-countdown' + (countdown.urgent ? ' urgent' : '') + '">' + countdown.text + '</div>';
    }

    html += '</div></div>';
    return html;
  }

  // ============================
  // LOAD MORE
  // ============================

  function renderLoadMore() {
    var container = document.getElementById('tcLoadMore');
    if (!container) return;

    if (allData.length >= totalCount || allData.length === 0) {
      container.innerHTML = '';
      container.style.display = 'none';
      return;
    }

    container.style.display = 'block';
    container.innerHTML =
      '<button class="tc-load-more-btn" id="tcLoadMoreBtn">' +
        'Загрузить ещё' +
        '<span class="tc-load-more-count">Показано ' + allData.length + ' из ' + totalCount + '</span>' +
      '</button>';

    document.getElementById('tcLoadMoreBtn').addEventListener('click', function() {
      this.disabled = true;
      this.innerHTML = '<span class="tc-spinner"></span> Загрузка...';
      currentPage++;
      loadData(false, function() {
        // Button re-rendered in render()
      });
    });
  }

  function hideLoadMore() {
    var container = document.getElementById('tcLoadMore');
    if (container) { container.innerHTML = ''; container.style.display = 'none'; }
  }

  // ============================
  // SKELETON
  // ============================

  function showSkeleton() {
    var el = document.getElementById('tournamentList');
    if (!el) return;
    var html = '';
    for (var i = 0; i < 3; i++) {
      html += '<div class="tc-skeleton">' +
        '<div class="tc-skeleton-img shimmer"></div>' +
        '<div class="tc-skeleton-body">' +
          '<div class="tc-skeleton-line w70 shimmer"></div>' +
          '<div class="tc-skeleton-line w50 shimmer"></div>' +
          '<div class="tc-skeleton-line w40 shimmer"></div>' +
        '</div></div>';
    }
    el.innerHTML = html;
    hideLoadMore();
  }

  // ============================
  // PULL-TO-REFRESH
  // ============================

  T.setupPullToRefresh = function() {
    var screen = document.getElementById('screenTournaments');
    var indicator = document.getElementById('tcPullIndicator');
    if (!screen || !indicator) return;

    var startY = 0;
    var pulling = false;
    var threshold = 80;

    screen.addEventListener('touchstart', function(e) {
      if (screen.scrollTop === 0) {
        startY = e.touches[0].clientY;
        pulling = true;
      }
    }, { passive: true });

    screen.addEventListener('touchmove', function(e) {
      if (!pulling) return;
      var dy = e.touches[0].clientY - startY;
      if (dy > 0 && dy < 150) {
        indicator.style.height = Math.min(dy * 0.6, 60) + 'px';
        indicator.style.opacity = Math.min(dy / threshold, 1);
        if (dy >= threshold) {
          indicator.classList.add('ready');
        } else {
          indicator.classList.remove('ready');
        }
      }
    }, { passive: true });

    screen.addEventListener('touchend', function() {
      if (!pulling) return;
      pulling = false;
      if (indicator.classList.contains('ready')) {
        indicator.style.height = '50px';
        indicator.style.opacity = '1';
        indicator.classList.remove('ready');
        indicator.classList.add('refreshing');
        T.refresh();
      } else {
        hidePullIndicator();
      }
    }, { passive: true });
  };

  function hidePullIndicator() {
    var indicator = document.getElementById('tcPullIndicator');
    if (!indicator) return;
    indicator.classList.remove('ready', 'refreshing');
    indicator.style.height = '0';
    indicator.style.opacity = '0';
  }

  // ============================
  // STATUS LOGIC
  // ============================

  function getStatus(t, today) {
    if (t.status === 'live' || t.status === 'in_progress') return 'live';
    if (t.status === 'completed' || t.status === 'finalized') return 'completed';
    if (t.date_start > today) {
      // Future tournament
      if (t.registration_end && t.registration_end < today) return 'soon';
      return 'open';
    }
    return 'completed';
  }

  // ============================
  // COUNTDOWN
  // ============================

  function getCountdown(t, today, status) {
    if (status !== 'open' && status !== 'soon') return null;
    var now = new Date(today);
    var start = new Date(t.date_start);
    var diff = Math.ceil((start - now) / (1000 * 60 * 60 * 24));

    if (diff <= 0) return { text: 'Сегодня', urgent: true };
    if (diff === 1) return { text: 'Завтра', urgent: true };
    if (diff < 3) return { text: 'Через ' + diff + ' дня', urgent: true };

    var dayWord = getDayWord(diff);
    return { text: 'Через ' + diff + ' ' + dayWord, urgent: false };
  }

  function getDayWord(n) {
    var abs = Math.abs(n) % 100;
    var last = abs % 10;
    if (abs > 10 && abs < 20) return 'дней';
    if (last > 1 && last < 5) return 'дня';
    if (last === 1) return 'день';
    return 'дней';
  }

  // ============================
  // TOURNAMENT OVERLAY (fallback)
  // ============================

  function openTournamentOverlay(tid) {
    var overlay = document.getElementById('tdOverlay');
    if (!overlay) return;
    var monthsLow = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];

    supabaseClient.from('tournaments').select('*').eq('id', tid).single().then(function(r) {
      if (!r.data) return;
      var t = r.data;
      var d = new Date(t.date_start);
      var dateStr = d.getDate() + ' ' + monthsLow[d.getMonth()] + ' ' + d.getFullYear();

      document.getElementById('tdName').textContent = t.title;
      var badges = '';
      if (t.category_id) badges += '<span class="td-badge cat">' + esc(t.category_id) + '</span>';
      var statusMap = { upcoming: 'Регистрация', live: 'Идёт', completed: 'Завершён' };
      if (t.status) badges += '<span class="td-badge status-' + t.status + '">' + (statusMap[t.status] || t.status) + '</span>';
      document.getElementById('tdBadges').innerHTML = badges;
      document.getElementById('tdDetails').textContent = dateStr + (t.location ? ' · ' + t.location : '') + (t.max_participants ? ' · ' + t.max_participants + ' игроков' : '');

      var info = '<div class="td-info-section">';
      info += tdInfoRow('📅', 'Дата', dateStr + (t.start_time ? ', ' + t.start_time : ''));
      if (t.location) info += tdInfoRow('📍', 'Место', t.location);
      if (t.max_participants) info += tdInfoRow('👥', 'Участники', t.max_participants + ' макс.');
      if (t.registration_end) {
        var dl = new Date(t.registration_end);
        info += tdInfoRow('⏰', 'Регистрация до', dl.getDate() + ' ' + monthsLow[dl.getMonth()] + ' ' + dl.getFullYear());
      }
      if (t.prize_fund && t.prize_fund !== '0') info += tdInfoRow('💰', 'Призовой фонд', t.prize_fund + ' сом');
      info += '</div>';
      if (t.description) info += '<p class="td-description">' + esc(t.description) + '</p>';
      if (t.status === 'upcoming') {
        var AUTH = window.KSLT_AUTH;
        var isGuest = !(AUTH && AUTH.currentUser);
        var isMember = AUTH && AUTH._membershipStatus;

        if (isGuest) {
          info += '<div class="td-access-cta"><p>Войдите, чтобы записаться на турнир</p><button class="btn-accent td-register-btn" data-action="login">Войти</button></div>';
        } else if (!isMember) {
          info += '<div class="td-access-cta"><p>Для участия в турнирах необходимо членство KSLT</p><button class="btn-accent td-register-btn" data-action="membership">Оформить членство</button></div>';
        } else {
          info += '<button class="btn-accent td-register-btn" data-tid="' + t.id + '">Записаться на турнир</button>';
        }
      }
      document.getElementById('tdInfo').innerHTML = info;

      overlay.querySelectorAll('.td-tab').forEach(function(tab, i) { tab.classList.toggle('active', i === 0); });
      overlay.querySelectorAll('.td-tab-content').forEach(function(tc, i) { tc.classList.toggle('active', i === 0); });
      overlay.classList.add('open');
    });
  }

  function tdInfoRow(icon, l, v) {
    return '<div class="td-info-row"><span class="td-info-icon">' + icon + '</span><div class="td-info-text"><div class="td-info-label">' + esc(l) + '</div><div class="td-info-value">' + esc(v) + '</div></div></div>';
  }

  // ============================
  // HELPERS
  // ============================

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // Init pull-to-refresh on DOM ready
  document.addEventListener('DOMContentLoaded', function() {
    T.setupPullToRefresh();
  });

})();
