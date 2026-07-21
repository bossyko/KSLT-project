// ============================================
// KSLT Mobile — Tournaments Screen (Redesign)
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var T = window.KSLT_TOURNAMENTS = {};
  var allData = [];
  var currentStatus = 'all';
  var currentQuery = '';
  var PER_PAGE = 10;
  var currentPage = 1;
  var totalCount = 0;
  var isLoading = false;
  var isRefreshing = false;

  function getMonths() { return I18N.months(); }

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
        '<div class="empty-title">' + I18N.t('tournaments.empty') + '</div>' +
        '<div class="empty-text">' + I18N.t('tournaments.emptyText') + '</div></div>';
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
    var statusText = { live: 'Live', open: I18N.t('tournaments.registration'), soon: I18N.t('tournaments.soon'), completed: I18N.t('tournaments.finished') }[status] || '';

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
    html += '<div class="tc-date"><span class="tc-date-day">' + d.getDate() + '</span><span class="tc-date-month">' + getMonths()[d.getMonth()] + '</span></div>';
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
        I18N.t('tournaments.loadMore') +
        '<span class="tc-load-more-count">' + I18N.t('tournaments.showing') + ' ' + allData.length + ' ' + I18N.t('tournaments.of') + ' ' + totalCount + '</span>' +
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

    if (diff <= 0) return { text: I18N.t('tournaments.today'), urgent: true };
    if (diff === 1) return { text: I18N.t('tournaments.tomorrow'), urgent: true };
    if (diff < 3) return { text: diff + ' ' + I18N.t('tournaments.daysLeft'), urgent: true };

    return { text: diff + ' ' + I18N.t('tournaments.daysLeft'), urgent: false };
  }

  // getDayWord removed — pluralization handled by I18N

  // ============================
  // TOURNAMENT OVERLAY (fallback)
  // ============================

  function openTournamentOverlay(tid) {
    var overlay = document.getElementById('tdOverlay');
    if (!overlay) return;
    var monthsLow = getMonths().map(function(m) { return m.toLowerCase(); });

    supabaseClient.from('tournaments').select('*').eq('id', tid).single().then(function(r) {
      if (!r.data) return;
      var t = r.data;
      var d = new Date(t.date_start);
      var dateStr = d.getDate() + ' ' + monthsLow[d.getMonth()] + ' ' + d.getFullYear();

      document.getElementById('tdName').textContent = t.title;
      var badges = '';
      if (t.category_id) badges += '<span class="td-badge cat">' + esc(t.category_id) + '</span>';
      var statusMap = { upcoming: I18N.t('tournaments.registration'), live: I18N.t('tournaments.inProgress'), completed: I18N.t('tournaments.finished') };
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
      if (t.status === 'upcoming' || t.status === 'registration_open') {
        info += '<div id="tdRegArea" style="margin-top:16px"><div class="loading-center"><div class="spinner" style="width:24px;height:24px"></div></div></div>';
      }
      document.getElementById('tdInfo').innerHTML = info;

      // Async registration check
      if (t.status === 'upcoming' || t.status === 'registration_open') {
        checkAndRenderRegistration(t);
      }

      overlay.querySelectorAll('.td-tab').forEach(function(tab, i) { tab.classList.toggle('active', i === 0); });
      overlay.querySelectorAll('.td-tab-content').forEach(function(tc, i) { tc.classList.toggle('active', i === 0); });
      overlay.classList.add('open');
    });
  }

  function tdInfoRow(icon, l, v) {
    return '<div class="td-info-row"><span class="td-info-icon">' + icon + '</span><div class="td-info-text"><div class="td-info-label">' + esc(l) + '</div><div class="td-info-value">' + esc(v) + '</div></div></div>';
  }

  // ============================
  // TOURNAMENT REGISTRATION
  // ============================

  function checkAndRenderRegistration(t) {
    var area = document.getElementById('tdRegArea');
    if (!area) return;

    var AUTH = window.KSLT_AUTH;

    // 1. Not logged in
    if (!AUTH || !AUTH.currentUser) {
      area.innerHTML = '<div class="td-access-cta"><p>' + I18N.t('trn.needAuth') + '</p>' +
        '<button class="btn-accent td-register-btn" id="tdRegLogin">' + I18N.t('common.login') + '</button></div>';
      var loginBtn = document.getElementById('tdRegLogin');
      if (loginBtn) loginBtn.addEventListener('click', function() { AUTH.showAuth(); });
      return;
    }

    var profile = AUTH.currentProfile;

    // 2. No player_id linked
    if (!profile || !profile.player_id) {
      area.innerHTML = '<div class="td-access-cta"><p>' + I18N.t('trn.needPlayer') + '</p></div>';
      return;
    }

    var playerId = profile.player_id;
    var isDbl = t.format === 'doubles' || t.format === 'mixed_doubles';

    // Async checks: already registered (self + as partner), player data, membership, all registrations count
    Promise.all([
      supabaseClient.from('tournament_registrations')
        .select('id, status, partner_id')
        .eq('tournament_id', t.id)
        .eq('player_id', playerId)
        .limit(1),
      supabaseClient.from('players')
        .select('category_id, banned_until, ban_reason, ntrp_rating, gender')
        .eq('id', playerId)
        .single(),
      AUTH.checkMembership(),
      supabaseClient.from('tournament_registrations')
        .select('id, status, player_id, partner_id', { count: 'exact' })
        .eq('tournament_id', t.id)
        .in('status', ['approved', 'pending']),
      isDbl ? supabaseClient.from('tournament_registrations')
        .select('id')
        .eq('tournament_id', t.id)
        .eq('partner_id', playerId)
        .limit(1) : Promise.resolve({ data: [] })
    ]).then(function(results) {
      var existingReg = results[0].data && results[0].data[0];
      var player = results[1].data;
      var membership = results[2];
      var activeRegs = results[3].data || [];
      var activeRegCount = activeRegs.length;
      var asPartner = results[4].data && results[4].data[0];

      // Online slots check
      var onlineSlots = (t.max_participants || 0) - (t.reserved_spots || 0);
      var onlineSlotsFull = onlineSlots > 0 && activeRegCount >= onlineSlots;

      // 3. Already registered as partner
      if (!existingReg && asPartner) {
        area.innerHTML = '<div class="td-reg-done">' + I18N.t('trn.regAsPartner') + '</div>';
        return;
      }

      // 4. Already registered
      if (existingReg) {
        var statusLabels = {
          pending: I18N.t('trn.registered'),
          approved: I18N.t('trn.registered'),
          waitlist: I18N.t('trn.waitlist'),
          rejected: I18N.t('common.error'),
          withdrawn: I18N.t('common.error')
        };
        var html = '<div class="td-reg-done">' + (statusLabels[existingReg.status] || I18N.t('trn.registered')) + '</div>';

        // Doubles without partner: show "Add Partner" button
        if (isDbl && !existingReg.partner_id) {
          html += ' <button class="btn-accent td-register-btn" id="tdAddPartnerBtn" style="margin-top:8px;font-size:0.85rem;padding:8px 16px;">' + I18N.t('trn.addPartner') + '</button>';
        }
        area.innerHTML = html;

        // Bind "Add Partner" handler
        var addPartnerBtn = document.getElementById('tdAddPartnerBtn');
        if (addPartnerBtn) {
          var captainNtrp = player ? parseFloat(player.ntrp_rating) || 0 : 0;
          addPartnerBtn.addEventListener('click', function() {
            showDoublesModal(t, playerId, false, area, null, captainNtrp, onlineSlotsFull, existingReg.id);
          });
        }
        return;
      }

      // 5. Banned
      if (player && player.banned_until && new Date(player.banned_until) > new Date()) {
        area.innerHTML = '<div class="td-access-cta" style="background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.2)"><p style="color:#ff3b30">' + I18N.t('trn.banned') + '</p></div>';
        return;
      }

      // 6. No active membership
      if (!membership) {
        area.innerHTML = '<div class="td-access-cta"><p>' + I18N.t('trn.needMembership') + '</p></div>';
        return;
      }

      // Determine status: exact category match → pending, else waitlist
      var isExactCategory = true;
      if (t.category_id && player && player.category_id && t.category_id !== player.category_id) {
        isExactCategory = false;
      }

      var captainNtrp = player ? parseFloat(player.ntrp_rating) || 0 : 0;

      // 7. Online slots full → waitlist UI
      if (onlineSlotsFull) {
        area.innerHTML = '<div style="margin-bottom:8px;padding:8px 12px;border-radius:8px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.2);font-size:0.85rem;color:#ffc107;">' +
          I18N.t('trn.slotsFull') + '</div>' +
          '<button class="btn-accent td-register-btn" id="tdRegisterBtn" data-waitlist="1" style="background:rgba(255,193,7,0.3);color:#ffc107;">' + I18N.t('trn.joinWaitlist') + '</button>';
      } else {
        // Show register button
        area.innerHTML = '<button class="btn-accent td-register-btn" id="tdRegisterBtn">' + I18N.t('trn.register') + '</button>';
      }

      document.getElementById('tdRegisterBtn').addEventListener('click', function() {
        var btn = this;
        var isWaitlist = btn.dataset.waitlist === '1';

        if (isDbl) {
          // Show doubles registration modal
          showDoublesModal(t, playerId, isExactCategory, area, btn, captainNtrp, onlineSlotsFull, null);
          return;
        }

        btn.disabled = true;
        btn.textContent = I18N.t('trn.registering');

        var regStatus = isWaitlist ? 'waitlist' : (isExactCategory ? 'pending' : 'waitlist');

        supabaseClient.from('tournament_registrations').insert({
          tournament_id: t.id,
          player_id: playerId,
          status: regStatus
        }).then(function(r) {
          if (r.error) {
            if (r.error.message && r.error.message.indexOf('unique') !== -1) {
              area.innerHTML = '<div class="td-reg-done">' + I18N.t('trn.alreadyReg') + '</div>';
            } else {
              if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('common.error'));
              btn.disabled = false;
              btn.textContent = isWaitlist ? I18N.t('trn.joinWaitlist') : I18N.t('trn.register');
            }
            return;
          }
          var msg = regStatus === 'waitlist' ? I18N.t('trn.waitlist') : I18N.t('trn.registered');
          area.innerHTML = '<div class="td-reg-done">' + msg + '</div>';
          if (window.KSLT_APP) window.KSLT_APP.toast(msg);
        });
      });
    });
  }

  // ============================
  // DOUBLES REGISTRATION MODAL
  // ============================

  function showDoublesModal(tournament, playerId, isExactCategory, area, regBtn, captainNtrp, onlineSlotsFull, existingRegId) {
    var isMixed = tournament.format === 'mixed_doubles';

    // Create modal overlay
    var overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);z-index:1000;display:flex;align-items:center;justify-content:center;padding:16px;';

    // NTRP combined hint
    var ntrpHint = '';
    if (tournament.ntrp_combined_max && captainNtrp) {
      var remaining = tournament.ntrp_combined_max - captainNtrp;
      ntrpHint = '<div style="padding:8px 12px;margin-bottom:12px;border-radius:8px;background:rgba(204,255,0,0.08);border:1px solid rgba(204,255,0,0.2);font-size:0.8rem;color:var(--text-secondary);">' +
        'NTRP: ' + tournament.ntrp_combined_max + ' (' + I18N.t('rating.pts').toLowerCase() + ': ' + captainNtrp + ', max: ' + remaining.toFixed(1) + ')' +
      '</div>';
    }

    var registerLabel = existingRegId ? I18N.t('common.save') : I18N.t('trn.register');

    overlay.innerHTML =
      '<div style="background:var(--bg-card, #1a1a2e);border:1px solid rgba(255,255,255,0.1);border-radius:16px;padding:20px;width:100%;max-width:360px;max-height:70vh;overflow-y:auto;">' +
        '<h3 style="color:#fff;margin:0 0 12px;font-size:1rem;">' + I18N.t('trn.partnerSelect') + '</h3>' +
        ntrpHint +
        '<div style="margin-bottom:12px;">' +
          '<input type="text" id="mobPartnerSearch" placeholder="' + I18N.t('trn.partnerSearch') + '" ' +
            'style="width:100%;padding:10px 12px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:rgba(255,255,255,0.05);color:#fff;font-size:0.9rem;box-sizing:border-box;" autocomplete="off">' +
          '<div id="mobPartnerResults" style="max-height:180px;overflow-y:auto;margin-top:4px;"></div>' +
          '<input type="hidden" id="mobPartnerSelectedId" value="">' +
          '<div id="mobPartnerSelectedName" style="display:none;padding:8px 12px;margin-top:4px;border-radius:8px;background:rgba(204,255,0,0.1);color:#CCFF00;font-size:0.9rem;"></div>' +
        '</div>' +
        '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
          '<button id="mobDoublesCancel" style="flex:1;padding:10px;border:1px solid rgba(255,255,255,0.1);border-radius:10px;background:transparent;color:rgba(255,255,255,0.6);cursor:pointer;font-size:0.85rem;">' + I18N.t('common.cancel') + '</button>' +
          (existingRegId ? '' :
          '<button id="mobDoublesRegSolo" style="flex:1;padding:10px;border:none;border-radius:10px;background:rgba(204,255,0,0.15);color:#CCFF00;cursor:pointer;font-size:0.85rem;">' + I18N.t('trn.soloReg') + '</button>') +
          '<button id="mobDoublesRegWithPartner" style="flex:1;padding:10px;border:none;border-radius:10px;background:#CCFF00;color:#000;font-weight:600;cursor:pointer;font-size:0.85rem;" disabled>' + registerLabel + '</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(overlay);

    // Close on overlay click
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) overlay.remove();
    });

    // Cancel
    document.getElementById('mobDoublesCancel').addEventListener('click', function() {
      overlay.remove();
    });

    // Solo registration
    var soloBtn = document.getElementById('mobDoublesRegSolo');
    if (soloBtn) {
      soloBtn.addEventListener('click', function() {
        soloBtn.disabled = true;
        soloBtn.textContent = I18N.t('trn.registering');

        var regStatus = onlineSlotsFull ? 'waitlist' : (isExactCategory ? 'pending' : 'waitlist');

        supabaseClient.from('tournament_registrations').insert({
          tournament_id: tournament.id,
          player_id: playerId,
          status: regStatus
        }).then(function(r) {
          overlay.remove();
          if (r.error) {
            if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('common.error'));
            return;
          }
          var msg = regStatus === 'waitlist' ? I18N.t('trn.waitlistSolo') : I18N.t('trn.regSoloSent');
          area.innerHTML = '<div class="td-reg-done">' + msg + '</div>';
          if (window.KSLT_APP) window.KSLT_APP.toast(msg);
        });
      });
    }

    // Register with partner
    document.getElementById('mobDoublesRegWithPartner').addEventListener('click', function() {
      var partnerId = document.getElementById('mobPartnerSelectedId').value;
      if (!partnerId) return;

      var rwBtn = this;
      rwBtn.disabled = true;
      rwBtn.textContent = I18N.t('trn.registering');

      if (existingRegId) {
        // Update mode: add partner to existing registration
        supabaseClient.from('tournament_registrations').update({ partner_id: partnerId }).eq('id', existingRegId).then(function(r) {
          overlay.remove();
          if (r.error) {
            if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('common.error'));
            return;
          }
          area.innerHTML = '<div class="td-reg-done">' + I18N.t('trn.partnerAdded') + '</div>';
          if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('trn.partnerAdded'));
        });
      } else {
        var regStatus = onlineSlotsFull ? 'waitlist' : (isExactCategory ? 'pending' : 'waitlist');
        supabaseClient.from('tournament_registrations').insert({
          tournament_id: tournament.id,
          player_id: playerId,
          partner_id: partnerId,
          status: regStatus
        }).then(function(r) {
          overlay.remove();
          if (r.error) {
            if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('common.error'));
            return;
          }
          var msg = regStatus === 'waitlist' ? I18N.t('trn.waitlist') : I18N.t('trn.regSent');
          area.innerHTML = '<div class="td-reg-done">' + msg + '</div>';
          if (window.KSLT_APP) window.KSLT_APP.toast(msg);
        });
      }
    });

    // Partner search
    var searchInput = document.getElementById('mobPartnerSearch');
    var resultsDiv = document.getElementById('mobPartnerResults');
    var hiddenInput = document.getElementById('mobPartnerSelectedId');
    var selectedNameDiv = document.getElementById('mobPartnerSelectedName');
    var rwBtn = document.getElementById('mobDoublesRegWithPartner');
    var searchTimeout;

    searchInput.addEventListener('input', function() {
      clearTimeout(searchTimeout);
      var q = searchInput.value.trim();
      if (q.length < 2) { resultsDiv.innerHTML = ''; return; }

      searchTimeout = setTimeout(function() {
        supabaseClient.from('players')
          .select('id, name, name_en, name_kg, gender, ntrp_rating')
          .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
          .neq('id', playerId)
          .limit(8)
          .then(function(res) {
            var players = res.data || [];
            if (players.length === 0) {
              resultsDiv.innerHTML = '<div style="padding:8px;color:rgba(255,255,255,0.4);font-size:0.85rem;">' + I18N.t('trn.noPlayersFound') + '</div>';
              return;
            }

            var html = '';
            players.forEach(function(p) {
              var displayName = p.name || '';
              var genderIcon = p.gender === 'men' ? ' ♂' : (p.gender === 'women' ? ' ♀' : '');
              html += '<div class="mob-partner-item" data-id="' + p.id + '" data-name="' + esc(displayName) + '" data-gender="' + (p.gender || '') + '" data-ntrp="' + (p.ntrp_rating || '') + '" ' +
                'style="padding:10px 12px;cursor:pointer;border-radius:8px;font-size:0.9rem;color:#fff;display:flex;justify-content:space-between;align-items:center;border-bottom:1px solid rgba(255,255,255,0.05);">' +
                '<span>' + esc(displayName) + genderIcon + '</span>' +
                (p.ntrp_rating ? '<span style="color:rgba(255,255,255,0.4);font-size:0.75rem;">NTRP ' + p.ntrp_rating + '</span>' : '') +
              '</div>';
            });
            resultsDiv.innerHTML = html;

            resultsDiv.querySelectorAll('.mob-partner-item').forEach(function(item) {
              item.addEventListener('click', function() {
                // NTRP combined validation
                if (tournament.ntrp_combined_max && captainNtrp) {
                  var partnerNtrp = parseFloat(item.dataset.ntrp) || 0;
                  var combined = captainNtrp + partnerNtrp;
                  if (combined > tournament.ntrp_combined_max) {
                    alert(I18N.t('trn.ntrpExceed') + ': ' + combined.toFixed(1) + ' > ' + tournament.ntrp_combined_max);
                    return;
                  }
                }

                // Gender validation for mixed doubles
                if (isMixed) {
                  supabaseClient.from('players').select('gender').eq('id', playerId).single().then(function(captRes) {
                    var captGender = captRes.data ? captRes.data.gender : '';
                    var partGender = item.dataset.gender;
                    if (captGender && partGender && captGender === partGender) {
                      alert(I18N.t('trn.mixedGender'));
                      return;
                    }
                    selectPartner(item);
                  });
                } else {
                  selectPartner(item);
                }
              });
            });
          });
      }, 300);
    });

    function selectPartner(item) {
      hiddenInput.value = item.dataset.id;
      searchInput.style.display = 'none';
      resultsDiv.innerHTML = '';
      selectedNameDiv.style.display = 'block';
      selectedNameDiv.textContent = item.dataset.name;
      selectedNameDiv.innerHTML += ' <span style="cursor:pointer;margin-left:8px;color:rgba(255,255,255,0.4);" id="mobPartnerClear">✕</span>';
      rwBtn.disabled = false;

      document.getElementById('mobPartnerClear').addEventListener('click', function() {
        hiddenInput.value = '';
        searchInput.style.display = '';
        searchInput.value = '';
        selectedNameDiv.style.display = 'none';
        rwBtn.disabled = true;
      });
    }
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
