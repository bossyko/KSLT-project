// ============================================
// KSLT Mobile — Player Detail Overlay
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var PD = window.KSLT_PLAYER_DETAIL = {};
  var _player = null;
  var _playerId = null;
  var _categoryLabel = '';
  var _rank = 0;
  var _earnedBadges = [];
  var _allBadges = [];
  var _playerCache = {};

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

  function getMonths() { return I18N.months(); }

  function formatDate(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear();
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '—';
    var d = new Date(dateStr);
    return d.getDate() + ' ' + I18N.month(d.getMonth());
  }

  function formatScore(score) {
    if (!score) return '—';
    return score.replace(/(\d+)\/(\d+)/g, '$1:$2');
  }

  function flipScore(score) {
    if (!score) return score;
    return score.replace(/(\d+)\/(\d+)/g, '$2/$1');
  }

  var CAT_MAP = {
    'men-tour': 'Tour', 'men-futures': 'Futures', 'men-challenger': 'Challenger',
    'men-masters': 'Masters', 'men-promasters': 'Pro-Masters',
    'women-tour': 'Tour Ж', 'women-futures': 'Futures Ж', 'women-challenger': 'Challenger Ж',
    'women-masters': 'Masters Ж', 'women-promasters': 'Pro-Masters Ж'
  };

  // ---- Access check ----
  function getAccessLevel() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) return 'guest';
    // member check: AUTH.checkMembership returns true/false via cached result
    if (AUTH._membershipStatus) return 'member';
    return 'registered';
  }

  // ---- Open player detail ----
  PD.open = function(playerId) {
    _playerId = playerId;
    _player = null;
    _earnedBadges = [];
    _allBadges = [];
    _rank = 0;
    _categoryLabel = '';

    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_player_view', { p_id: playerId });
    }

    var overlay = document.getElementById('playerOverlay');
    if (!overlay) return;

    var detail = document.getElementById('playerDetail');
    if (detail) detail.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
    overlay.classList.add('open');

    var access = getAccessLevel();

    // Load player data
    supabaseClient.from('players')
      .select('*')
      .eq('id', playerId)
      .single()
      .then(function(r) {
        if (r.error || !r.data) {
          detail.innerHTML = '<div class="pd-empty"><div class="pd-empty-icon">🔍</div><div class="pd-empty-title">' + I18N.t('pd.notFound') + '</div></div>';
          return;
        }
        _player = r.data;
        _categoryLabel = CAT_MAP[_player.category_id] || _player.category_id || '';

        // Load rank (count players with more points in same category)
        supabaseClient.from('players')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', _player.category_id)
          .gt('points', _player.points || 0)
          .then(function(rr) {
            _rank = ((rr.count || 0) + 1);

            if (access === 'guest') {
              renderGuestView();
            } else {
              // Load badges + render in parallel
              Promise.all([
                loadPlayerBadges(playerId),
                loadAllBadges()
              ]).then(function(results) {
                _earnedBadges = results[0];
                _allBadges = results[1];
                renderFullProfile(access);
              });
            }
          });
      });
  };

  // ---- Close overlay ----
  PD.close = function() {
    var overlay = document.getElementById('playerOverlay');
    if (overlay) overlay.classList.remove('open');
  };

  // ---- Guest view: minimal info + CTA ----
  function renderGuestView() {
    var detail = document.getElementById('playerDetail');
    if (!detail || !_player) return;

    var p = _player;
    var photoUrl = p.photo || '';

    var html = '<div class="pd-guest">';
    html += '<div class="pd-guest-avatar-wrap">';
    html += photoUrl
      ? '<img class="pd-guest-avatar" src="' + esc(photoUrl) + '" alt="">'
      : '<div class="pd-guest-avatar-fallback">' + initials(p.name) + '</div>';
    html += '</div>';
    html += '<h2 class="pd-guest-name">' + esc(p.name) + '</h2>';
    html += '<div class="pd-guest-cat">' + esc(_categoryLabel) + ' · #' + _rank + '</div>';

    html += '<div class="pd-guest-cta">';
    html += '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="40" height="40"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/><circle cx="12" cy="16" r="1"/></svg>';
    html += '<h3>' + I18N.t('pd.guestRegister') + '</h3>';
    html += '<p>' + I18N.t('pd.guestRegText') + '</p>';
    html += '<button class="pd-guest-btn" id="pdLoginBtn">' + I18N.t('pd.guestLoginBtn') + '</button>';
    html += '</div></div>';

    detail.innerHTML = html;

    var loginBtn = document.getElementById('pdLoginBtn');
    if (loginBtn) {
      loginBtn.addEventListener('click', function() {
        PD.close();
        if (window.KSLT_AUTH && window.KSLT_AUTH.showAuth) {
          window.KSLT_AUTH.showAuth();
        }
      });
    }
  }

  // ---- Full profile ----
  function renderFullProfile(access) {
    var detail = document.getElementById('playerDetail');
    if (!detail || !_player) return;

    var p = _player;
    var form = p.form || [];
    var totalM = (p.wins || 0) + (p.losses || 0);
    var winRate = totalM > 0 ? Math.round(p.wins / totalM * 100) : 0;
    var streak = calcStreak(form);

    var html = '';

    // ---- Hero section ----
    html += '<div class="pd-hero">';
    html += '<div class="pd-avatar-wrap">';
    html += p.photo
      ? '<img class="pd-avatar" src="' + esc(p.photo) + '" alt="">'
      : '<div class="pd-avatar-fallback">' + initials(p.name) + '</div>';
    html += '</div>';
    html += '<h2 class="pd-name">' + esc(p.name) + '</h2>';
    html += '<div class="pd-meta">';
    if (p.country) html += '<span class="pd-country">' + esc(p.country) + '</span>';
    html += '<span class="pd-category">' + esc(_categoryLabel) + ' · #' + _rank + '</span>';
    html += '</div>';

    // NTRP
    if (p.ntrp_rating) {
      html += '<div class="pd-ntrp">NTRP <strong>' + Number(p.ntrp_rating).toFixed(1) + '</strong></div>';
    }

    // Header badges
    if (_earnedBadges.length > 0) {
      html += '<div class="pd-badges-row">';
      _earnedBadges.slice(0, 5).forEach(function(pb) {
        if (pb.badge) html += '<span class="pd-badge" title="' + esc(pb.badge.name || '') + '">' + (pb.badge.icon || '🏅') + '</span>';
      });
      if (_earnedBadges.length > 5) html += '<span class="pd-badge pd-badge-more">+' + (_earnedBadges.length - 5) + '</span>';
      html += '</div>';
    }

    // Bio
    if (p.bio) {
      html += '<div class="pd-bio">«' + esc(p.bio) + '»</div>';
    }

    html += '</div>'; // .pd-hero

    // ---- Stats grid ----
    html += '<div class="pd-stats">';
    html += pdStatCard(p.points || 0, I18N.t('pd.rating'), p.rank_change);
    html += pdStatCard(p.wins || 0, I18N.t('pd.wins'), null);
    html += pdStatCard(p.losses || 0, I18N.t('pd.losses'), null);
    html += pdStatCard(winRate + '%', I18N.t('pd.winRate'), null);
    // Streak with form dots
    html += '<div class="pd-stat">';
    html += '<div class="pd-stat-num">' + streak.count + (streak.type === 'up' ? 'W' : 'L') + '</div>';
    html += '<div class="pd-stat-label">' + I18N.t('pd.streak') + '</div>';
    html += '<div class="pd-form-dots">';
    form.slice(-5).forEach(function(f) {
      html += '<span class="pd-form-dot ' + (f === 'W' || f === 'w' ? 'w' : 'l') + '"></span>';
    });
    html += '</div></div>';
    html += '</div>'; // .pd-stats

    // ---- Matches section ----
    html += '<div class="pd-section">';
    html += '<h3 class="pd-section-title">⚔️ ' + I18N.t('pd.matches') + '</h3>';
    html += '<div id="pdMatches"><div class="loading-center"><div class="spinner"></div></div></div>';
    html += '</div>';

    // ---- Tournaments section ----
    html += '<div class="pd-section">';
    html += '<h3 class="pd-section-title">🏆 ' + I18N.t('pd.tournaments') + '</h3>';
    html += '<div id="pdTournaments"><div class="loading-center"><div class="spinner"></div></div></div>';
    html += '</div>';

    // ---- Achievements section ----
    html += '<div class="pd-section">';
    html += '<h3 class="pd-section-title">🏅 ' + I18N.t('pd.badges') + '</h3>';
    html += '<div id="pdAchievements"></div>';
    html += '</div>';

    // ---- Contact info (member only, if player allows) ----
    if (access === 'member') {
      var hasContact = (p.phone && p.show_phone) || p.telegram || p.instagram;
      if (hasContact) {
        html += '<div class="pd-section"><h3 class="pd-section-title">📞 ' + I18N.t('pd.contact') + '</h3>';
        html += '<div style="display:flex;flex-direction:column;gap:8px">';
        if (p.phone && p.show_phone) {
          html += '<a href="tel:' + esc(p.phone) + '" class="pd-challenge-btn" style="display:block;text-align:center;text-decoration:none;color:#0A0A0A">📱 ' + esc(p.phone) + '</a>';
          html += '<a href="https://wa.me/' + esc(p.phone.replace(/[^0-9]/g, '')) + '" target="_blank" class="pd-challenge-btn" style="background:#25D366;display:block;text-align:center;text-decoration:none;color:#fff">WhatsApp</a>';
        }
        if (p.telegram) {
          var tgHandle = p.telegram.replace('@', '');
          html += '<a href="https://t.me/' + esc(tgHandle) + '" target="_blank" class="pd-challenge-btn" style="background:#2AABEE;display:block;text-align:center;text-decoration:none;color:#fff">Telegram @' + esc(tgHandle) + '</a>';
        }
        if (p.instagram) {
          html += '<a href="https://instagram.com/' + esc(p.instagram.replace('@', '')) + '" target="_blank" class="pd-challenge-btn" style="background:linear-gradient(45deg,#f09433,#e6683c,#dc2743,#cc2366,#bc1888);display:block;text-align:center;text-decoration:none;color:#fff">Instagram @' + esc(p.instagram.replace('@', '')) + '</a>';
        }
        html += '</div></div>';
      }
    }

    // ---- Challenge button (member only) ----
    if (access === 'member') {
      html += '<div class="pd-challenge-wrap">';
      html += '<button class="pd-challenge-btn" id="pdChallengeBtn">⚔️ ' + I18N.t('pd.challenge') + '</button>';
      html += '</div>';
    } else if (access === 'registered') {
      html += '<div class="pd-cta-membership">';
      html += '<p>' + I18N.t('pd.memberCta') + '</p>';
      html += '</div>';
    }

    detail.innerHTML = html;

    // Async load data
    loadMatches();
    loadTournaments();
    renderAchievements();

    // Challenge button
    if (access === 'member') {
      var chalBtn = document.getElementById('pdChallengeBtn');
      if (chalBtn) {
        chalBtn.addEventListener('click', function() {
          handleChallenge();
        });
      }
    }
  }

  function pdStatCard(num, label, change) {
    var h = '<div class="pd-stat">';
    h += '<div class="pd-stat-num">' + num + '</div>';
    h += '<div class="pd-stat-label">' + label + '</div>';
    if (change !== null && change !== undefined && change !== 0) {
      var cls = change > 0 ? 'up' : 'down';
      var text = change > 0 ? '+' + change : '' + change;
      h += '<div class="pd-stat-change ' + cls + '">' + text + '</div>';
    }
    h += '</div>';
    return h;
  }

  function calcStreak(form) {
    if (!form || !form.length) return { count: 0, type: 'neutral' };
    var reversed = form.slice().reverse();
    var first = reversed[0];
    var count = 0;
    for (var i = 0; i < reversed.length; i++) {
      if (reversed[i] === first) count++;
      else break;
    }
    return { count: count, type: first === 'W' || first === 'w' ? 'up' : 'down' };
  }

  // ---- Load Badges ----
  function loadPlayerBadges(playerId) {
    return supabaseClient.from('player_badges')
      .select('badge_id, earned_at, badge:badge_definitions(*)')
      .eq('player_id', playerId)
      .order('earned_at', { ascending: true })
      .then(function(r) { return r.data || []; });
  }

  function loadAllBadges() {
    return supabaseClient.from('badge_definitions')
      .select('*')
      .order('sort_order', { ascending: true })
      .then(function(r) { return r.data || []; });
  }

  // ---- Load Matches ----
  function loadMatches() {
    var container = document.getElementById('pdMatches');
    if (!container) return;

    supabaseClient.from('matches')
      .select('*, tournament:tournaments(id, title)')
      .or('player1_id.eq.' + _playerId + ',player2_id.eq.' + _playerId)
      .not('winner_id', 'is', null)
      .order('played_at', { ascending: false })
      .limit(20)
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noMatches') + '</div>';
          return;
        }
        // Filter tournament matches only
        var matches = r.data.filter(function(m) { return !m.match_type || m.match_type === 'tournament'; });
        if (matches.length === 0) {
          container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noMatches') + '</div>';
          return;
        }
        renderMatches(container, matches);
      });
  }

  function renderMatches(container, matches) {
    var LIMIT = 10;
    var showAll = matches.length <= LIMIT;
    var visible = showAll ? matches : matches.slice(0, LIMIT);

    var html = '<div class="pd-matches-list">';
    visible.forEach(function(m) {
      var isP1 = m.player1_id === _playerId;
      var oppId = isP1 ? m.player2_id : m.player1_id;
      var result = m.winner_id === _playerId ? 'W' : 'L';
      var score = m.score || '';
      var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));
      var tName = m.tournament ? m.tournament.title : '';

      html += '<div class="pd-match" data-opponent-id="' + esc(oppId) + '">';
      html += '<div class="pd-match-date">' + formatDateShort(m.played_at) + '</div>';
      html += '<div class="pd-match-info">';
      if (tName) html += '<div class="pd-match-tournament">' + esc(tName) + '</div>';
      html += '<div class="pd-match-opp" id="pdOpp_' + esc(oppId) + '">' + I18N.t('common.loading') + '</div>';
      html += '</div>';
      html += '<div class="pd-match-score">' + displayScore + '</div>';
      html += '<div class="pd-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + result + '</div>';
      html += '</div>';
    });
    html += '</div>';

    if (!showAll) {
      html += '<button class="pd-show-all" id="pdShowAllMatches">' + I18N.t('pd.showAll') + ' (' + matches.length + ')</button>';
    }

    container.innerHTML = html;

    // Load opponent names
    var oppIds = [];
    visible.forEach(function(m) {
      var oppId = m.player1_id === _playerId ? m.player2_id : m.player1_id;
      if (oppIds.indexOf(oppId) === -1) oppIds.push(oppId);
    });
    loadOpponentNames(oppIds);

    // Show all button
    var showAllBtn = document.getElementById('pdShowAllMatches');
    if (showAllBtn) {
      showAllBtn.addEventListener('click', function() {
        renderMatches(container, matches.slice(0, matches.length)); // show all
        showAllBtn.remove();
      });
    }

    // Match click → H2H
    container.querySelectorAll('.pd-match').forEach(function(row) {
      row.addEventListener('click', function() {
        var oppId = row.getAttribute('data-opponent-id');
        if (oppId) openH2H(oppId);
      });
    });
  }

  function loadOpponentNames(ids) {
    if (!ids.length) return;
    supabaseClient.from('players')
      .select('id, name, photo')
      .in('id', ids)
      .then(function(r) {
        if (!r.data) return;
        r.data.forEach(function(p) {
          _playerCache[p.id] = p;
          var el = document.getElementById('pdOpp_' + p.id);
          if (el) el.textContent = p.name;
        });
      });
  }

  // ---- Load Tournaments ----
  function loadTournaments() {
    var container = document.getElementById('pdTournaments');
    if (!container) return;

    // Get tournament registrations for this player
    supabaseClient.from('tournament_registrations')
      .select('*, tournament:tournaments(id, title, date_start, status)')
      .eq('player_id', _playerId)
      .order('created_at', { ascending: false })
      .limit(20)
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noTournaments') + '</div>';
          return;
        }
        var html = '<div class="pd-tournaments-list">';
        r.data.forEach(function(reg) {
          if (!reg.tournament) return;
          var t = reg.tournament;
          var statusClass = t.status === 'completed' ? 'completed' : 'upcoming';
          html += '<div class="pd-tournament">';
          html += '<div class="pd-tournament-date">' + formatDateShort(t.date_start) + '</div>';
          html += '<div class="pd-tournament-name">' + esc(t.title) + '</div>';
          html += '<div class="pd-tournament-status ' + statusClass + '">' + (t.status === 'completed' ? I18N.t('pd.completed') : I18N.t('pd.upcoming')) + '</div>';
          html += '</div>';
        });
        html += '</div>';
        container.innerHTML = html;
      });
  }

  // ---- Achievements ----
  function renderAchievements() {
    var container = document.getElementById('pdAchievements');
    if (!container) return;

    if (_allBadges.length === 0 && _earnedBadges.length === 0) {
      container.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.noBadges') + '</div>';
      return;
    }

    var earnedIds = {};
    _earnedBadges.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

    var html = '<div class="pd-badges-grid">';
    _allBadges.forEach(function(b) {
      var earned = earnedIds[b.id];
      html += '<div class="pd-badge-card ' + (earned ? 'earned' : 'locked') + '">';
      html += '<div class="pd-badge-icon">' + (b.icon || '🏅') + '</div>';
      html += '<div class="pd-badge-name">' + esc(b.name || '') + '</div>';
      if (earned) {
        html += '<div class="pd-badge-date">' + formatDate(earned.earned_at) + '</div>';
      } else {
        html += '<div class="pd-badge-locked">🔒</div>';
      }
      html += '</div>';
    });
    html += '</div>';
    container.innerHTML = html;
  }

  // ---- H2H Modal ----
  function openH2H(opponentId) {
    var overlay = document.getElementById('playerOverlay');
    if (!overlay) return;

    // Create H2H modal
    var existing = document.getElementById('pdH2HModal');
    if (existing) existing.remove();

    var modal = document.createElement('div');
    modal.id = 'pdH2HModal';
    modal.className = 'pd-h2h-modal';
    modal.innerHTML =
      '<div class="pd-h2h-content">' +
        '<div class="pd-h2h-header">' +
          '<button class="pd-h2h-close" id="pdH2HClose">✕</button>' +
          '<h3>Head-to-Head</h3>' +
        '</div>' +
        '<div class="pd-h2h-body" id="pdH2HBody">' +
          '<div class="loading-center"><div class="spinner"></div></div>' +
        '</div>' +
      '</div>';

    overlay.appendChild(modal);
    requestAnimationFrame(function() { modal.classList.add('open'); });

    document.getElementById('pdH2HClose').addEventListener('click', function() {
      modal.classList.remove('open');
      setTimeout(function() { modal.remove(); }, 300);
    });
    modal.addEventListener('click', function(e) {
      if (e.target === modal) {
        modal.classList.remove('open');
        setTimeout(function() { modal.remove(); }, 300);
      }
    });

    // Load H2H data
    loadH2HData(opponentId);
  }

  function loadH2HData(opponentId) {
    var body = document.getElementById('pdH2HBody');
    if (!body) return;

    // Load opponent info
    var oppPromise = _playerCache[opponentId]
      ? Promise.resolve(_playerCache[opponentId])
      : supabaseClient.from('players').select('id, name, photo, points, wins, losses').eq('id', opponentId).single().then(function(r) {
          if (r.data) _playerCache[opponentId] = r.data;
          return r.data;
        });

    // Load matches between them
    var matchesPromise = supabaseClient.from('matches')
      .select('*, tournament:tournaments(title)')
      .or(
        'and(player1_id.eq.' + _playerId + ',player2_id.eq.' + opponentId + '),' +
        'and(player1_id.eq.' + opponentId + ',player2_id.eq.' + _playerId + ')'
      )
      .not('winner_id', 'is', null)
      .order('played_at', { ascending: false })
      .limit(10)
      .then(function(r) { return r.data || []; });

    Promise.all([oppPromise, matchesPromise]).then(function(results) {
      var opp = results[0];
      var matches = results[1];

      if (!opp) {
        body.innerHTML = '<div class="pd-empty-small">' + I18N.t('pd.h2hNoData') + '</div>';
        return;
      }

      // Calculate H2H stats
      var myWins = 0, oppWins = 0, mySets = 0, oppSets = 0, myGames = 0, oppGames = 0;
      matches.forEach(function(m) {
        var isP1 = m.player1_id === _playerId;
        if (m.winner_id === _playerId) myWins++;
        else oppWins++;

        if (m.score) {
          var stats = parseScoreStats(m.score);
          if (stats) {
            if (isP1) {
              mySets += stats.p1Sets; oppSets += stats.p2Sets;
              myGames += stats.p1Games; oppGames += stats.p2Games;
            } else {
              mySets += stats.p2Sets; oppSets += stats.p1Sets;
              myGames += stats.p2Games; oppGames += stats.p1Games;
            }
          }
        }
      });

      var html = '';

      // VS header
      html += '<div class="pd-h2h-vs">';
      html += '<div class="pd-h2h-player">';
      html += '<div class="pd-h2h-avatar">' + (_player.photo ? '<img src="' + esc(_player.photo) + '" alt="">' : initials(_player.name)) + '</div>';
      html += '<div class="pd-h2h-pname">' + esc(_player.name) + '</div>';
      html += '</div>';
      html += '<div class="pd-h2h-vs-text">VS</div>';
      html += '<div class="pd-h2h-player">';
      html += '<div class="pd-h2h-avatar">' + (opp.photo ? '<img src="' + esc(opp.photo) + '" alt="">' : initials(opp.name)) + '</div>';
      html += '<div class="pd-h2h-pname">' + esc(opp.name) + '</div>';
      html += '</div>';
      html += '</div>';

      // Stats row
      html += '<div class="pd-h2h-stats">';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + myWins + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hWins') + '</span><span class="pd-h2h-val opp">' + oppWins + '</span></div>';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + mySets + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hSets') + '</span><span class="pd-h2h-val opp">' + oppSets + '</span></div>';
      html += '<div class="pd-h2h-stat"><span class="pd-h2h-val my">' + myGames + '</span><span class="pd-h2h-label">' + I18N.t('pd.h2hGames') + '</span><span class="pd-h2h-val opp">' + oppGames + '</span></div>';
      html += '</div>';

      // Match list
      if (matches.length === 0) {
        html += '<div class="pd-empty-small">' + I18N.t('pd.h2hNoMatches') + '</div>';
      } else {
        html += '<h4 class="pd-h2h-matches-title">' + I18N.t('pd.h2hLatest') + '</h4>';
        html += '<div class="pd-h2h-matches">';
        matches.forEach(function(m) {
          var isP1 = m.player1_id === _playerId;
          var result = m.winner_id === _playerId ? 'W' : 'L';
          var score = m.score || '';
          var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));
          var tName = m.tournament ? m.tournament.title : '';

          html += '<div class="pd-h2h-match ' + (result === 'W' ? 'win' : 'loss') + '">';
          html += '<span class="pd-h2h-m-date">' + formatDateShort(m.played_at) + '</span>';
          html += '<span class="pd-h2h-m-score">' + displayScore + '</span>';
          html += '<span class="pd-h2h-m-result">' + result + '</span>';
          if (tName) html += '<span class="pd-h2h-m-tournament">' + esc(tName) + '</span>';
          html += '</div>';
        });
        html += '</div>';
      }

      body.innerHTML = html;
    });
  }

  function parseScoreStats(score) {
    if (!score || score === 'BYE') return null;
    var sets = score.trim().split(/\s+/);
    var p1S = 0, p2S = 0, p1G = 0, p2G = 0;
    sets.forEach(function(s) {
      var m = s.match(/^(\d+)\/(\d+)/);
      if (m) {
        var g1 = parseInt(m[1], 10), g2 = parseInt(m[2], 10);
        p1G += g1; p2G += g2;
        if (g1 > g2) p1S++; else if (g2 > g1) p2S++;
      }
    });
    return { p1Sets: p1S, p2Sets: p2S, p1Games: p1G, p2Games: p2G };
  }

  // ---- Challenge handler ----
  function handleChallenge() {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) {
      window.KSLT_APP.toast(I18N.t('pd.chalLogin'));
      return;
    }
    if (!AUTH.currentProfile || !AUTH.currentProfile.player_id) {
      window.KSLT_APP.toast(I18N.t('pd.chalLinkPlayer'));
      return;
    }
    if (AUTH.currentProfile.player_id === _playerId) {
      window.KSLT_APP.toast(I18N.t('pd.chalSelf'));
      return;
    }

    // Check pending challenge
    supabaseClient.from('challenges')
      .select('id')
      .eq('challenger_id', AUTH.currentUser.id)
      .eq('opponent_player_id', _playerId)
      .in('status', ['pending', 'accepted'])
      .limit(1)
      .then(function(r) {
        if (r.data && r.data.length > 0) {
          window.KSLT_APP.toast(I18N.t('pd.chalExists'));
          return;
        }
        // Create challenge
        supabaseClient.from('challenges').insert({
          challenger_id: AUTH.currentUser.id,
          challenger_player_id: AUTH.currentProfile.player_id,
          opponent_player_id: _playerId,
          status: 'pending'
        }).then(function(res) {
          if (res.error) {
            window.KSLT_APP.toast(I18N.t('common.error') + ': ' + (res.error.message || I18N.t('common.tryLater')));
          } else {
            window.KSLT_APP.toast(I18N.t('pd.chalSent'));
          }
        });
      });
  }

  // ---- Init overlay back button ----
  document.addEventListener('click', function(e) {
    if (e.target.closest('#playerBack')) {
      PD.close();
    }
  });

})();
