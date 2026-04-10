// ============================================
// KSLT Mobile — Profile Screen (Mini-Dashboard)
// ============================================
(function() {
  'use strict';

  var P = window.KSLT_PROFILE = {};
  var _profile = null;
  var _player = null;
  var _membership = null;

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

  var months = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
  }

  P.load = function() {
    var el = document.getElementById('profileContent');
    var AUTH = window.KSLT_AUTH;

    if (!AUTH || !AUTH.currentUser) {
      el.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">👤</div>' +
          '<div class="empty-title">Вы не авторизованы</div>' +
          '<div class="empty-text">Войдите, чтобы увидеть свой профиль</div>' +
          '<button class="btn-accent" style="margin-top:16px" id="profileLoginBtn">Войти</button>' +
        '</div>';
      var btn = document.getElementById('profileLoginBtn');
      if (btn) {
        btn.addEventListener('click', function() { if (window.KSLT_AUTH) window.KSLT_AUTH.showAuth(); });
      }
      return;
    }

    _profile = AUTH.currentProfile;
    _player = _profile && _profile.players ? _profile.players : null;
    var name = (_profile && _profile.full_name) || 'Пользователь';

    var html = '';

    // ---- Hero ----
    html += '<div class="profile-hero">';
    if (_profile && _profile.avatar_url) {
      html += '<div class="profile-avatar"><img src="' + esc(_profile.avatar_url) + '" alt=""></div>';
    } else {
      html += '<div class="profile-avatar">' + initials(name) + '</div>';
    }
    html += '<div class="profile-name">' + esc(name) + '</div>';

    var roleText = '';
    if (_player) {
      var catMap = {'men-tour':'Tour','men-futures':'Futures','men-challenger':'Challenger','men-masters':'Masters','men-promasters':'Pro-Masters','women-tour':'Tour Ж','women-futures':'Futures Ж','women-challenger':'Challenger Ж','women-masters':'Masters Ж','women-promasters':'Pro-Masters Ж'};
      roleText = (catMap[_player.category_id] || 'Игрок');
    } else {
      roleText = _profile.role === 'admin' ? 'Администратор' : _profile.role === 'manager' ? 'Менеджер' : 'Участник';
    }
    html += '<div class="profile-role">' + esc(roleText) + '</div>';
    html += '</div>';

    // ---- Membership card ----
    html += '<div id="profMembership"></div>';

    // ---- Stats (if player) ----
    if (_player) {
      var totalM = (_player.wins || 0) + (_player.losses || 0);
      var winRate = totalM > 0 ? Math.round(_player.wins / totalM * 100) : 0;
      html += '<div class="stats-grid">';
      html += '<div class="stat-card"><div class="stat-value">' + (_player.points || 0) + '</div><div class="stat-label">Очки</div></div>';
      html += '<div class="stat-card"><div class="stat-value">' + (_player.wins || 0) + '</div><div class="stat-label">Победы</div></div>';
      html += '<div class="stat-card"><div class="stat-value">' + (_player.losses || 0) + '</div><div class="stat-label">Поражения</div></div>';
      html += '<div class="stat-card"><div class="stat-value">' + winRate + '%</div><div class="stat-label">% побед</div></div>';
      html += '</div>';

      // Form dots
      var form = _player.form || [];
      if (form.length > 0) {
        html += '<div class="prof-form-row">';
        html += '<span class="prof-form-label">Форма:</span>';
        form.slice(-8).forEach(function(f) {
          html += '<span class="pd-form-dot ' + (f === 'W' || f === 'w' ? 'w' : 'l') + '"></span>';
        });
        html += '</div>';
      }
    }

    // ---- Rating mini-chart (SVG sparkline from form) ----
    if (_player && _player.form && _player.form.length >= 3) {
      var formArr = _player.form;
      var cumPoints = [0];
      for (var fi = 0; fi < formArr.length; fi++) {
        cumPoints.push(cumPoints[fi] + (formArr[fi] === 'W' || formArr[fi] === 'w' ? 1 : -1));
      }
      var minP = Math.min.apply(null, cumPoints);
      var maxP = Math.max.apply(null, cumPoints);
      var range = Math.max(1, maxP - minP);
      var svgW = 280, svgH = 60;
      var points = cumPoints.map(function(v, idx) {
        var x = (idx / (cumPoints.length - 1)) * svgW;
        var y = svgH - ((v - minP) / range) * (svgH - 4) - 2;
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      html += '<div style="padding:0 16px;margin-bottom:8px">';
      html += '<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px">Тренд формы</div>';
      html += '<svg viewBox="0 0 ' + svgW + ' ' + svgH + '" style="width:100%;height:60px"><polyline points="' + points + '" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
      html += '</div>';
    }

    // ---- Activity ----
    html += '<div class="profile-section">';
    html += '<div class="profile-section-title">Активность</div>';

    // My Tournaments
    html += profileRow('green',
      '<svg viewBox="0 0 24 24"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/></svg>',
      'Мои турниры', '', '', true, 'profTournamentsRow');

    // My Matches
    if (_player) {
      html += profileRow('blue',
        '<svg viewBox="0 0 24 24"><path d="M14.5 17.5L3 6V3h3l11.5 11.5"/><path d="M13 19l6-6"/><path d="M16 16l4 4"/></svg>',
        'Мои матчи', '', '', true, 'profMatchesRow');
    }

    // Badges
    html += profileRow('purple',
      '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      'Достижения', '', '', true, 'profBadgesRow');

    // Loyalty
    html += profileRow('yellow',
      '<svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
      'Баллы лояльности', 'Доступно для обмена', '', true, 'profLoyaltyRow');

    // Vouchers
    html += profileRow('cyan',
      '<svg viewBox="0 0 24 24"><path d="M20 12V8H6a2 2 0 01-2-2c0-1.1.9-2 2-2h12v4"/><path d="M4 6v12c0 1.1.9 2 2 2h14v-4"/><path d="M18 12a2 2 0 000 4h4v-4h-4z"/></svg>',
      'Ваучеры', 'Скидки на корты и тренеров', '', true, 'profVouchersRow');

    // Payments
    html += profileRow('orange',
      '<svg viewBox="0 0 24 24"><rect x="1" y="4" width="22" height="16" rx="2"/><path d="M1 10h22"/></svg>',
      'История платежей', '', '', true, 'profPaymentsRow');
    html += '</div>';

    // ---- Settings ----
    html += '<div class="profile-section">';
    html += '<div class="profile-section-title">Настройки</div>';
    html += profileRow('orange',
      '<svg viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
      'Редактировать профиль', '', '', true, 'profEditRow');
    html += profileRow('blue',
      '<svg viewBox="0 0 24 24"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0"/></svg>',
      'Уведомления', '', '', true, 'profNotifyRow');
    html += profileRow('red',
      '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>',
      'Смена пароля', '', '', true, 'profPasswordRow');

    // Telegram connect
    var tgLinked = _profile && _profile.telegram_id;
    html += profileRow(tgLinked ? 'green' : 'blue',
      '<svg viewBox="0 0 24 24"><path d="M21.2 4.4L2.4 11.4c-.5.2-.5.8 0 1l4.8 1.8 1.8 5.8c.1.4.6.5.9.3l2.7-2.2 4.8 3.5c.4.3 1 .1 1.1-.4l3.3-15c.1-.6-.4-1-.6-.8z"/></svg>',
      'Telegram', tgLinked ? 'Подключён' : 'Подключить бота', '', true, 'profTelegramRow');

    // Delete account
    html += profileRow('red',
      '<svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2"/></svg>',
      'Удалить аккаунт', '', '', true, 'profDeleteRow');
    html += '</div>';

    // ---- Logout ----
    html += '<div class="profile-section">';
    html += '<div class="profile-row" id="logoutRow" style="cursor:pointer">' +
      '<div class="profile-row-icon red"><svg viewBox="0 0 24 24"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9"/></svg></div>' +
      '<div class="profile-row-text"><div class="profile-row-label">Выйти</div></div>' +
      '<span class="profile-row-arrow">›</span>' +
    '</div>';
    html += '</div>';

    html += '<div style="height:16px"></div>';

    el.innerHTML = html;

    // Bind events
    bindLogout();
    loadMembership();
    bindRowOverlays();
    loadLoyaltyBalance();
  };

  // ---- Membership card ----
  function loadMembership() {
    var container = document.getElementById('profMembership');
    if (!container) return;

    var AUTH = window.KSLT_AUTH;
    if (!AUTH) return;

    AUTH.checkMembership().then(function(mem) {
      _membership = mem;
      AUTH._membershipStatus = !!mem;

      if (!mem) {
        container.innerHTML = '<div class="prof-membership none">' +
          '<div class="prof-mem-icon">📋</div>' +
          '<div class="prof-mem-info"><div class="prof-mem-status">Нет членства</div><div class="prof-mem-sub">Оформите для доступа ко всем функциям</div></div>' +
        '</div>';
        return;
      }

      var endDate = new Date(mem.end_date);
      var now = new Date();
      var daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
      var pct = 100;
      if (mem.start_date) {
        var startDate = new Date(mem.start_date);
        var total = Math.max(1, (endDate - startDate) / (1000 * 60 * 60 * 24));
        var elapsed = Math.max(0, (now - startDate) / (1000 * 60 * 60 * 24));
        pct = Math.max(0, Math.min(100, Math.round((1 - elapsed / total) * 100)));
      }

      var statusClass = daysLeft > 30 ? 'active' : (daysLeft > 0 ? 'expiring' : 'expired');
      var statusText = daysLeft > 0 ? 'Активно' : 'Истекло';
      var subText = daysLeft > 0 ? 'Осталось ' + daysLeft + ' дн.' : 'Продлите членство';

      container.innerHTML = '<div class="prof-membership ' + statusClass + '">' +
        '<div class="prof-mem-icon">✅</div>' +
        '<div class="prof-mem-info">' +
          '<div class="prof-mem-status">' + statusText + '</div>' +
          '<div class="prof-mem-sub">' + subText + '</div>' +
          '<div class="prof-mem-bar"><div class="prof-mem-bar-fill" style="width:' + pct + '%"></div></div>' +
        '</div>' +
      '</div>';
    });
  }

  // ---- Loyalty balance ----
  function loadLoyaltyBalance() {
    var row = document.getElementById('profLoyaltyRow');
    if (!row || !_profile) return;

    supabaseClient.rpc('get_loyalty_balance', { p_profile_id: _profile.id })
      .then(function(r) {
        var balance = (r.data !== null && r.data !== undefined) ? r.data : 0;
        var valEl = row.querySelector('.profile-row-value');
        if (valEl) valEl.textContent = balance + ' б.';
      })
      .catch(function() {});
  }

  // ---- Row overlay navigation ----
  function bindRowOverlays() {
    bindRowClick('profTournamentsRow', showMyTournaments);
    bindRowClick('profMatchesRow', showMyMatches);
    bindRowClick('profBadgesRow', showBadges);
    bindRowClick('profLoyaltyRow', showLoyalty);
    bindRowClick('profVouchersRow', showVouchers);
    bindRowClick('profPaymentsRow', showPayments);
    bindRowClick('profEditRow', showEditProfile);
    bindRowClick('profNotifyRow', showNotifications);
    bindRowClick('profPasswordRow', showPasswordChange);
    bindRowClick('profTelegramRow', showTelegramConnect);
    bindRowClick('profDeleteRow', showDeleteAccount);
  }

  function bindRowClick(id, handler) {
    var el = document.getElementById(id);
    if (el) el.addEventListener('click', handler);
  }

  // ---- Sub-overlay helper ----
  function openSubOverlay(title, contentHtml) {
    var existing = document.getElementById('profSubOverlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.id = 'profSubOverlay';
    overlay.className = 'td-overlay';
    overlay.innerHTML =
      '<div class="td-topbar">' +
        '<button class="td-back" id="profSubBack">' +
          '<svg viewBox="0 0 24 24" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"/></svg>' +
          'Назад' +
        '</button>' +
        '<span class="td-topbar-title">' + esc(title) + '</span>' +
        '<span style="width:60px"></span>' +
      '</div>' +
      '<div class="prof-sub-content" style="padding:16px">' + contentHtml + '</div>';

    document.getElementById('app').appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('open'); });

    document.getElementById('profSubBack').addEventListener('click', function() {
      overlay.classList.remove('open');
      setTimeout(function() { overlay.remove(); }, 300);
    });

    return overlay;
  }

  // ---- My Tournaments ----
  function showMyTournaments() {
    var ov = openSubOverlay('Мои турниры', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    if (!_player) {
      // Check registrations by profile_id
      supabaseClient.from('tournament_registrations')
        .select('*, tournament:tournaments(id, title, date_start, status)')
        .eq('profile_id', _profile.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(function(r) {
          renderTournamentsList(content, r.data || []);
        });
    } else {
      supabaseClient.from('tournament_registrations')
        .select('*, tournament:tournaments(id, title, date_start, status)')
        .eq('player_id', _player.id)
        .order('created_at', { ascending: false })
        .limit(20)
        .then(function(r) {
          renderTournamentsList(content, r.data || []);
        });
    }
  }

  function renderTournamentsList(container, regs) {
    if (!regs || regs.length === 0) {
      container.innerHTML = '<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-title">Нет турниров</div><div class="empty-text">Вы ещё не участвовали в турнирах</div></div>';
      return;
    }
    var html = '';
    regs.forEach(function(reg) {
      if (!reg.tournament) return;
      var t = reg.tournament;
      var statusClass = t.status === 'completed' ? 'completed' : 'upcoming';
      var statusText = t.status === 'completed' ? 'Завершён' : (t.status === 'live' ? 'Идёт' : 'Предстоит');
      html += '<div class="pd-tournament">';
      html += '<div class="pd-tournament-date">' + formatDate(t.date_start) + '</div>';
      html += '<div class="pd-tournament-name">' + esc(t.title) + '</div>';
      html += '<div class="pd-tournament-status ' + statusClass + '">' + statusText + '</div>';
      html += '</div>';
    });
    container.innerHTML = html;
  }

  // ---- My Matches ----
  function showMyMatches() {
    if (!_player) return;
    var ov = openSubOverlay('Мои матчи', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('matches')
      .select('*, tournament:tournaments(title)')
      .or('player1_id.eq.' + _player.id + ',player2_id.eq.' + _player.id)
      .not('winner_id', 'is', null)
      .order('played_at', { ascending: false })
      .limit(30)
      .then(function(r) {
        if (!r.data || r.data.length === 0) {
          content.innerHTML = '<div class="empty-state"><div class="empty-icon">⚔️</div><div class="empty-title">Нет матчей</div></div>';
          return;
        }
        var matches = r.data;
        // Load all opponent IDs
        var oppIds = [];
        matches.forEach(function(m) {
          var oppId = m.player1_id === _player.id ? m.player2_id : m.player1_id;
          if (oppIds.indexOf(oppId) === -1) oppIds.push(oppId);
        });

        supabaseClient.from('players').select('id, name').in('id', oppIds).then(function(pr) {
          var nameMap = {};
          if (pr.data) pr.data.forEach(function(p) { nameMap[p.id] = p.name; });

          var html = '<div class="pd-matches-list">';
          matches.forEach(function(m) {
            var isP1 = m.player1_id === _player.id;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var result = m.winner_id === _player.id ? 'W' : 'L';
            var score = m.score || '';
            var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));

            html += '<div class="pd-match">';
            html += '<div class="pd-match-date">' + formatDate(m.played_at).split(' ').slice(0, 2).join(' ') + '</div>';
            html += '<div class="pd-match-info">';
            if (m.tournament) html += '<div class="pd-match-tournament">' + esc(m.tournament.title) + '</div>';
            html += '<div class="pd-match-opp">' + esc(nameMap[oppId] || oppId) + '</div>';
            html += '</div>';
            html += '<div class="pd-match-score">' + displayScore + '</div>';
            html += '<div class="pd-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + result + '</div>';
            html += '</div>';
          });
          html += '</div>';
          content.innerHTML = html;
        });
      });
  }

  function formatScore(score) {
    if (!score) return '—';
    return score.replace(/(\d+)\/(\d+)/g, '$1:$2');
  }
  function flipScore(score) {
    if (!score) return score;
    return score.replace(/(\d+)\/(\d+)/g, '$2/$1');
  }

  // ---- Badges ----
  function showBadges() {
    var ov = openSubOverlay('Достижения', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    Promise.all([
      supabaseClient.from('badge_definitions').select('*').order('sort_order', { ascending: true }),
      _player
        ? supabaseClient.from('player_badges').select('badge_id, earned_at, badge:badge_definitions(*)').eq('player_id', _player.id)
        : Promise.resolve({ data: [] })
    ]).then(function(results) {
      var allBadges = results[0].data || [];
      var earned = results[1].data || [];
      var earnedIds = {};
      earned.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

      if (allBadges.length === 0) {
        content.innerHTML = '<div class="empty-state"><div class="empty-icon">🏅</div><div class="empty-title">Нет бейджей</div></div>';
        return;
      }

      var html = '<div class="pd-badges-grid">';
      allBadges.forEach(function(b) {
        var e = earnedIds[b.id];
        html += '<div class="pd-badge-card ' + (e ? 'earned' : 'locked') + '">';
        html += '<div class="pd-badge-icon">' + (b.icon || '🏅') + '</div>';
        html += '<div class="pd-badge-name">' + esc(b.name || '') + '</div>';
        if (e) {
          html += '<div class="pd-badge-date">' + formatDate(e.earned_at) + '</div>';
        } else {
          html += '<div class="pd-badge-locked">🔒</div>';
        }
        html += '</div>';
      });
      html += '</div>';
      content.innerHTML = html;
    });
  }

  // ---- Loyalty ----
  function showLoyalty() {
    var ov = openSubOverlay('Баллы лояльности', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    Promise.all([
      supabaseClient.rpc('get_loyalty_balance', { p_profile_id: _profile.id }),
      supabaseClient.from('loyalty_transactions')
        .select('*')
        .eq('profile_id', _profile.id)
        .order('created_at', { ascending: false })
        .limit(30),
      supabaseClient.from('loyalty_rewards')
        .select('*')
        .eq('is_active', true)
        .order('cost', { ascending: true })
    ]).then(function(results) {
      var balance = (results[0].data !== null) ? results[0].data : 0;
      var transactions = results[1].data || [];
      var rewards = results[2].data || [];

      var html = '';

      // Balance card
      html += '<div class="prof-loyalty-balance">';
      html += '<div class="prof-loy-num">' + balance + '</div>';
      html += '<div class="prof-loy-label">баллов</div>';
      html += '</div>';

      // Rewards
      if (rewards.length > 0) {
        html += '<h4 class="prof-sub-title">Обменять баллы</h4>';
        rewards.forEach(function(rw) {
          var canRedeem = balance >= rw.cost;
          html += '<div class="prof-reward-card' + (canRedeem ? '' : ' disabled') + '"' +
            (canRedeem ? ' data-reward-id="' + rw.id + '" data-cost="' + rw.cost + '"' : '') + '>';
          html += '<div class="prof-reward-info">';
          html += '<div class="prof-reward-name">' + esc(rw.name) + '</div>';
          if (rw.description) html += '<div class="prof-reward-desc">' + esc(rw.description) + '</div>';
          html += '</div>';
          html += '<div class="prof-reward-cost">' + rw.cost + ' б.</div>';
          html += '</div>';
        });
      }

      // History
      if (transactions.length > 0) {
        html += '<h4 class="prof-sub-title">История</h4>';
        html += '<div class="prof-loy-history">';
        transactions.forEach(function(t) {
          var isEarn = t.type === 'earn' || t.points > 0;
          html += '<div class="prof-loy-tx">';
          html += '<div class="prof-loy-tx-info">';
          html += '<span class="prof-loy-tx-desc">' + esc(t.description || (isEarn ? 'Начисление' : 'Списание')) + '</span>';
          html += '<span class="prof-loy-tx-date">' + formatDate(t.created_at) + '</span>';
          html += '</div>';
          html += '<span class="prof-loy-tx-pts ' + (isEarn ? 'earn' : 'spend') + '">' + (isEarn ? '+' : '') + t.points + '</span>';
          html += '</div>';
        });
        html += '</div>';
      } else {
        html += '<div class="pd-empty-small">Нет транзакций</div>';
      }

      content.innerHTML = html;

      // Redeem handlers
      content.querySelectorAll('.prof-reward-card[data-reward-id]').forEach(function(card) {
        card.addEventListener('click', function() {
          var rewardId = card.getAttribute('data-reward-id');
          var cost = parseInt(card.getAttribute('data-cost'));
          if (confirm('Обменять ' + cost + ' баллов?')) {
            redeemReward(rewardId, content);
          }
        });
      });
    });
  }

  function redeemReward(rewardId, container) {
    supabaseClient.from('loyalty_transactions').insert({
      profile_id: _profile.id,
      type: 'redeem',
      reward_id: rewardId,
      description: 'Обмен на награду'
    }).then(function(r) {
      if (r.error) {
        window.KSLT_APP.toast('Ошибка: ' + (r.error.message || 'Попробуйте позже'));
      } else {
        window.KSLT_APP.toast('Баллы списаны!');
        showLoyalty(); // Refresh
      }
    });
  }

  // ---- Vouchers ----
  function showVouchers() {
    var ov = openSubOverlay('Ваучеры', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('discount_vouchers')
      .select('*')
      .eq('profile_id', _profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(function(r) {
        var vouchers = r.data || [];
        if (vouchers.length === 0) {
          content.innerHTML = '<div class="empty-state"><div class="empty-icon">🎫</div><div class="empty-title">Нет ваучеров</div><div class="empty-text">Ваучеры появятся при оформлении членства</div></div>';
          return;
        }

        var html = '';
        vouchers.forEach(function(v) {
          var isActive = v.status === 'active' && (!v.expires_at || new Date(v.expires_at) > new Date());
          var statusText = isActive ? 'Активен' : (v.status === 'used' ? 'Использован' : 'Истёк');
          var statusClass = isActive ? 'active' : 'inactive';

          html += '<div class="prof-voucher ' + statusClass + '"' + (isActive ? ' data-code="' + esc(v.code || '') + '"' : '') + '>';
          html += '<div class="prof-voucher-info">';
          html += '<div class="prof-voucher-name">' + esc(v.service_name || v.entity_type || 'Скидка') + '</div>';
          html += '<div class="prof-voucher-code">' + esc(v.code || '') + '</div>';
          if (v.expires_at) html += '<div class="prof-voucher-exp">до ' + formatDate(v.expires_at) + '</div>';
          html += '</div>';
          html += '<div class="prof-voucher-discount">-' + (v.discount_percent || v.discount || 0) + '%</div>';
          html += '<div class="prof-voucher-status ' + statusClass + '">' + statusText + '</div>';
          html += '</div>';
        });
        content.innerHTML = html;

        // Click active voucher → show QR code
        content.querySelectorAll('.prof-voucher[data-code]').forEach(function(vc) {
          vc.addEventListener('click', function() {
            var code = vc.getAttribute('data-code');
            if (!code) return;
            showVoucherQR(code);
          });
        });
      });
  }

  function showVoucherQR(code) {
    var existing = document.getElementById('voucherQRModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'voucherQRModal';
    modal.className = 'pd-h2h-modal';
    modal.innerHTML =
      '<div class="pd-h2h-content" style="max-width:300px;text-align:center">' +
        '<div class="pd-h2h-header"><button class="pd-h2h-close" id="qrClose">✕</button><h3>Ваучер</h3></div>' +
        '<div style="padding:24px">' +
          '<img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=' + encodeURIComponent(code) + '" alt="QR" style="width:200px;height:200px;border-radius:8px;background:#fff;padding:8px">' +
          '<div style="margin-top:12px;font-family:monospace;font-size:18px;color:var(--accent);letter-spacing:2px">' + code + '</div>' +
          '<div style="margin-top:8px;font-size:12px;color:var(--text-muted)">Покажите QR-код для получения скидки</div>' +
        '</div>' +
      '</div>';

    document.getElementById('app').appendChild(modal);
    requestAnimationFrame(function() { modal.classList.add('open'); });

    document.getElementById('qrClose').addEventListener('click', function() {
      modal.classList.remove('open');
      setTimeout(function() { modal.remove(); }, 300);
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('open');
        setTimeout(function() { modal.remove(); }, 300);
      }
    });
  }

  // ---- Payments ----
  function showPayments() {
    var ov = openSubOverlay('Платежи', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('finances')
      .select('*')
      .eq('profile_id', _profile.id)
      .order('created_at', { ascending: false })
      .limit(30)
      .then(function(r) {
        var payments = r.data || [];
        if (payments.length === 0) {
          content.innerHTML = '<div class="empty-state"><div class="empty-icon">💳</div><div class="empty-title">Нет платежей</div></div>';
          return;
        }

        var total = 0;
        payments.forEach(function(p) { total += (p.amount || 0); });

        var html = '<div class="prof-pay-summary">Всего: <strong>' + total.toLocaleString() + ' сом</strong></div>';
        html += '<div class="prof-pay-list">';
        payments.forEach(function(p) {
          html += '<div class="prof-pay-item">';
          html += '<div class="prof-pay-date">' + formatDate(p.created_at) + '</div>';
          html += '<div class="prof-pay-info">';
          html += '<div class="prof-pay-desc">' + esc(p.description || p.entity_type || 'Оплата') + '</div>';
          if (p.method) html += '<div class="prof-pay-method">' + esc(p.method) + '</div>';
          html += '</div>';
          html += '<div class="prof-pay-amount">' + (p.amount || 0).toLocaleString() + ' с</div>';
          html += '</div>';
        });
        html += '</div>';
        content.innerHTML = html;
      });
  }

  // ---- Edit Profile ----
  function showEditProfile() {
    var p = _profile;
    var nameParts = (p.full_name || '').split(' ');
    var lastName = nameParts[0] || '';
    var firstName = nameParts.slice(1).join(' ') || '';

    var html = '<div class="prof-edit-form">';

    // Avatar
    html += '<div class="prof-edit-avatar" id="profEditAvatar">';
    if (p.avatar_url) {
      html += '<img src="' + esc(p.avatar_url) + '" alt="">';
    } else {
      html += '<span>' + initials(p.full_name) + '</span>';
    }
    html += '<div class="prof-edit-avatar-hint">Нажмите для смены</div>';
    html += '</div>';
    html += '<input type="file" id="profAvatarInput" accept="image/*" style="display:none">';

    html += profField('Фамилия', 'profLastName', lastName, 'text');
    html += profField('Имя', 'profFirstName', firstName, 'text');
    html += profField('Телефон', 'profPhone', p.phone || '', 'tel');

    // Gender
    html += '<div class="prof-field">';
    html += '<label class="prof-field-label">Пол</label>';
    html += '<select class="prof-field-input" id="profGender">';
    html += '<option value="">Не указан</option>';
    html += '<option value="male"' + (p.gender === 'male' ? ' selected' : '') + '>Мужской</option>';
    html += '<option value="female"' + (p.gender === 'female' ? ' selected' : '') + '>Женский</option>';
    html += '</select></div>';

    // Save button
    html += '<button class="pd-challenge-btn" id="profSaveBtn" style="margin-top:16px">Сохранить</button>';
    html += '</div>';

    var ov = openSubOverlay('Профиль', html);

    // Avatar upload
    var avatarEl = document.getElementById('profEditAvatar');
    var avatarInput = document.getElementById('profAvatarInput');
    if (avatarEl && avatarInput) {
      avatarEl.addEventListener('click', function() { avatarInput.click(); });
      avatarInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
          uploadAvatar(this.files[0]);
        }
      });
    }

    // Save
    document.getElementById('profSaveBtn').addEventListener('click', function() {
      var ln = document.getElementById('profLastName').value.trim();
      var fn = document.getElementById('profFirstName').value.trim();
      var phone = document.getElementById('profPhone').value.trim();
      var gender = document.getElementById('profGender').value;
      var fullName = (ln + ' ' + fn).trim();

      supabaseClient.from('profiles')
        .update({ full_name: fullName, phone: phone, gender: gender })
        .eq('id', _profile.id)
        .then(function(r) {
          if (r.error) {
            window.KSLT_APP.toast('Ошибка сохранения');
          } else {
            _profile.full_name = fullName;
            _profile.phone = phone;
            _profile.gender = gender;
            window.KSLT_AUTH.currentProfile = _profile;
            window.KSLT_APP.toast('Профиль обновлён');
          }
        });
    });
  }

  function profField(label, id, value, type) {
    return '<div class="prof-field">' +
      '<label class="prof-field-label">' + esc(label) + '</label>' +
      '<input class="prof-field-input" type="' + type + '" id="' + id + '" value="' + esc(value) + '">' +
    '</div>';
  }

  function uploadAvatar(file) {
    if (file.size > 2 * 1024 * 1024) {
      window.KSLT_APP.toast('Файл слишком большой (макс. 2MB)');
      return;
    }
    var ext = file.name.split('.').pop().toLowerCase();
    var path = 'avatars/' + _profile.id + '.' + ext;

    supabaseClient.storage.from('avatars')
      .upload(path, file, { upsert: true })
      .then(function(r) {
        if (r.error) {
          window.KSLT_APP.toast('Ошибка загрузки');
          return;
        }
        var publicUrl = supabaseClient.storage.from('avatars').getPublicUrl(path).data.publicUrl;
        supabaseClient.from('profiles')
          .update({ avatar_url: publicUrl })
          .eq('id', _profile.id)
          .then(function() {
            _profile.avatar_url = publicUrl;
            window.KSLT_AUTH.currentProfile = _profile;
            window.KSLT_APP.toast('Аватар обновлён');
            // Update avatar in edit form
            var avatarEl = document.getElementById('profEditAvatar');
            if (avatarEl) avatarEl.innerHTML = '<img src="' + esc(publicUrl) + '" alt=""><div class="prof-edit-avatar-hint">Нажмите для смены</div>';
          });
      });
  }

  // ---- Notifications ----
  function showNotifications() {
    var ov = openSubOverlay('Уведомления', '<div class="loading-center"><div class="spinner"></div></div>');
    var content = ov.querySelector('.prof-sub-content');

    supabaseClient.from('notification_preferences')
      .select('*')
      .eq('profile_id', _profile.id)
      .then(function(r) {
        var prefs = {};
        if (r.data) {
          r.data.forEach(function(p) {
            prefs[p.category + '_' + p.channel] = !p.opted_out;
          });
        }

        var categories = [
          { key: 'tournament', label: 'Турниры', desc: 'Напоминания о турнирах' },
          { key: 'payment', label: 'Платежи', desc: 'Напоминания об оплате' },
          { key: 'system', label: 'Система', desc: 'Системные уведомления' },
          { key: 'marketing', label: 'Маркетинг', desc: 'Новости и акции' }
        ];
        var channels = [
          { key: 'telegram', label: 'Telegram' },
          { key: 'email', label: 'Email' }
        ];

        var html = '';
        categories.forEach(function(cat) {
          html += '<div class="prof-notif-card">';
          html += '<div class="prof-notif-header">' + esc(cat.label) + '</div>';
          html += '<div class="prof-notif-desc">' + esc(cat.desc) + '</div>';
          html += '<div class="prof-notif-toggles">';
          channels.forEach(function(ch) {
            var key = cat.key + '_' + ch.key;
            var checked = prefs[key] !== false; // default on
            html += '<label class="prof-notif-toggle">';
            html += '<span>' + ch.label + '</span>';
            html += '<input type="checkbox" class="prof-notif-cb" data-category="' + cat.key + '" data-channel="' + ch.key + '"' + (checked ? ' checked' : '') + '>';
            html += '<span class="prof-toggle-switch"></span>';
            html += '</label>';
          });
          html += '</div></div>';
        });

        content.innerHTML = html;

        // Toggle handlers
        content.querySelectorAll('.prof-notif-cb').forEach(function(cb) {
          cb.addEventListener('change', function() {
            var category = cb.getAttribute('data-category');
            var channel = cb.getAttribute('data-channel');
            var optedOut = !cb.checked;

            supabaseClient.from('notification_preferences')
              .upsert({
                profile_id: _profile.id,
                category: category,
                channel: channel,
                opted_out: optedOut
              }, { onConflict: 'profile_id,category,channel' })
              .then(function(r) {
                if (r.error) window.KSLT_APP.toast('Ошибка сохранения');
              });
          });
        });
      });
  }

  // ---- Password change ----
  function showPasswordChange() {
    var html = '<div class="prof-edit-form">';
    html += profField('Новый пароль', 'profNewPass', '', 'password');
    html += profField('Подтверждение', 'profConfirmPass', '', 'password');
    html += '<div class="prof-pass-rules" id="profPassRules">';
    html += '<div class="prof-pass-rule" data-rule="length">Минимум 6 символов</div>';
    html += '</div>';
    html += '<button class="pd-challenge-btn" id="profChangePassBtn" style="margin-top:16px" disabled>Изменить пароль</button>';
    html += '</div>';

    var ov = openSubOverlay('Смена пароля', html);

    var newPass = document.getElementById('profNewPass');
    var confirmPass = document.getElementById('profConfirmPass');
    var btn = document.getElementById('profChangePassBtn');

    function validate() {
      var pass = newPass.value;
      var confirm = confirmPass.value;
      var ok = pass.length >= 6 && pass === confirm;
      btn.disabled = !ok;
    }

    newPass.addEventListener('input', validate);
    confirmPass.addEventListener('input', validate);

    btn.addEventListener('click', function() {
      btn.disabled = true;
      btn.textContent = 'Сохраняем...';
      supabaseClient.auth.updateUser({ password: newPass.value })
        .then(function(r) {
          if (r.error) {
            window.KSLT_APP.toast('Ошибка: ' + (r.error.message || 'Попробуйте позже'));
            btn.disabled = false;
            btn.textContent = 'Изменить пароль';
          } else {
            window.KSLT_APP.toast('Пароль изменён!');
            // Close overlay
            var overlay = document.getElementById('profSubOverlay');
            if (overlay) {
              overlay.classList.remove('open');
              setTimeout(function() { overlay.remove(); }, 300);
            }
          }
        });
    });
  }

  // ---- Logout ----
  function bindLogout() {
    var logoutEl = document.getElementById('logoutRow');
    if (logoutEl) {
      logoutEl.addEventListener('click', function() {
        window.KSLT_AUTH.logout().then(function() {
          P.load();
          if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
            window.KSLT_APP.onAuthChange();
          }
        });
      });
    }
  }

  // ---- Telegram connect ----
  function showTelegramConnect() {
    var tgBot = window.KSLT_TG_BOT || 'KSLTennisBot';
    var linked = _profile && _profile.telegram_id;

    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:56px;margin-bottom:16px">🤖</div>';

    if (linked) {
      html += '<h3 style="color:var(--accent);margin-bottom:8px">Telegram подключён</h3>';
      html += '<p style="color:var(--text-sec);font-size:13px">Вы получаете уведомления через бота @' + esc(tgBot) + '</p>';
    } else {
      html += '<h3 style="color:var(--text);margin-bottom:8px">Подключите Telegram</h3>';
      html += '<p style="color:var(--text-sec);font-size:13px;margin-bottom:16px">Откройте бота и нажмите /start для привязки аккаунта</p>';
      html += '<a href="https://t.me/' + esc(tgBot) + '?start=link_' + (_profile ? _profile.id : '') + '" target="_blank" class="pd-challenge-btn" style="display:block;text-decoration:none;text-align:center;background:var(--blue)">Открыть @' + esc(tgBot) + '</a>';
    }
    html += '</div>';

    openSubOverlay('Telegram', html);
  }

  // ---- Delete account ----
  function showDeleteAccount() {
    var html = '<div style="text-align:center;padding:20px 0">';
    html += '<div style="font-size:48px;margin-bottom:16px">⚠️</div>';
    html += '<h3 style="color:var(--red);margin-bottom:8px">Удаление аккаунта</h3>';
    html += '<p style="color:var(--text-sec);font-size:13px;margin-bottom:24px">Это действие необратимо. Все ваши данные, турниры, матчи и баллы будут удалены.</p>';
    html += '<button class="pd-challenge-btn" id="profDeleteConfirm" style="background:var(--red)">Удалить аккаунт навсегда</button>';
    html += '</div>';

    var ov = openSubOverlay('Удаление', html);

    document.getElementById('profDeleteConfirm').addEventListener('click', function() {
      if (!confirm('Вы уверены? Это действие нельзя отменить.')) return;
      this.disabled = true;
      this.textContent = 'Удаление...';

      // Call edge function or just sign out (actual deletion requires admin)
      supabaseClient.from('profiles')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', _profile.id)
        .then(function() {
          window.KSLT_AUTH.logout().then(function() {
            if (window.KSLT_APP) window.KSLT_APP.toast('Аккаунт помечен на удаление');
            P.load();
          });
        });
    });
  }

  // ---- Helper ----
  function profileRow(colorClass, iconSvg, label, sub, value, hasArrow, id) {
    return '<div class="profile-row"' + (id ? ' id="' + id + '" style="cursor:pointer"' : '') + '>' +
      '<div class="profile-row-icon ' + colorClass + '">' + iconSvg + '</div>' +
      '<div class="profile-row-text">' +
        '<div class="profile-row-label">' + esc(label) + '</div>' +
        (sub ? '<div class="profile-row-sub">' + esc(sub) + '</div>' : '') +
      '</div>' +
      (value !== undefined ? '<span class="profile-row-value">' + esc(String(value)) + '</span>' : '') +
      (hasArrow ? '<span class="profile-row-arrow">›</span>' : '') +
    '</div>';
  }

})();
