// ============================================
// KSLT Mobile — Live Screen
// Realtime live_matches + detail overlay
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;
  var L = window.KSLT_LIVE = {};

  var _channel = null;
  var _matchChannel = null;
  var _pollTimer = null;
  var _realtimeOk = false;
  var _currentMatchId = null;

  // ====== LIST ======

  L.load = function() {
    var el = document.getElementById('liveList');
    if (!supabaseClient || !el) return;

    el.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('live_matches')
      .select('*, player1:players!live_matches_player1_id_fkey(id, name, name_en, name_kg, photo), player2:players!live_matches_player2_id_fkey(id, name, name_en, name_kg, photo)')
      .in('status', ['live', 'warmup', 'paused'])
      .order('updated_at', { ascending: false })
      .then(function(r) {
        renderList(el, r.data || []);
      });
  };

  function renderList(el, matches) {
    if (matches.length === 0) {
      el.innerHTML =
        '<div class="empty-state">' +
          '<div class="empty-icon">📺</div>' +
          '<div class="empty-title">' + I18N.t('live.empty') + '</div>' +
          '<div class="empty-text">' + I18N.t('live.emptyText') + '</div>' +
        '</div>';
      return;
    }

    var html = '';
    matches.forEach(function(m) {
      var p1Name = pName(m.player1, m.player1_name);
      var p2Name = pName(m.player2, m.player2_name);
      var setsData = m.sets_data || [];
      var isWarmup = m.status === 'warmup';
      var isPaused = m.status === 'paused';

      var badgeClass = isWarmup ? 'live-badge-warmup' : isPaused ? 'live-badge-paused' : '';
      var badgeText = isWarmup ? I18N.t('live.warmup') : isPaused ? I18N.t('live.paused') : 'LIVE';

      html += '<div class="live-list-card" data-match-id="' + m.id + '">' +
        '<div class="live-list-top">' +
          '<span class="live-badge ' + badgeClass + '">' + badgeText + '</span>' +
          '<span class="live-list-info">' + esc(m.tournament_label || '') + '</span>' +
        '</div>' +
        '<div class="live-list-players">' +
          '<div class="live-list-p">' +
            avatarSmall(m.player1, p1Name) +
            '<div class="live-list-pname">' + shortName(p1Name) +
              (m.serving_player === 1 ? ' <span class="serving-dot"></span>' : '') +
            '</div>' +
          '</div>' +
          '<div class="live-list-score">' +
            renderSetsCompact(setsData, m) +
          '</div>' +
          '<div class="live-list-p right">' +
            avatarSmall(m.player2, p2Name) +
            '<div class="live-list-pname">' + shortName(p2Name) +
              (m.serving_player === 2 ? ' <span class="serving-dot"></span>' : '') +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>';
    });
    el.innerHTML = html;

    // Bind click events
    el.querySelectorAll('.live-list-card').forEach(function(card) {
      card.addEventListener('click', function() {
        var id = this.getAttribute('data-match-id');
        if (id) openMatchOverlay(id);
      });
    });
  }

  function renderSetsCompact(setsData, m) {
    if (!setsData || setsData.length === 0) {
      return '<div class="live-list-sets"><span style="font-size:14px;color:var(--text-dim)">VS</span></div>';
    }
    var html = '<div class="live-list-sets">';
    setsData.forEach(function(s) {
      var g1 = s.g1 || 0, g2 = s.g2 || 0;
      var p1lead = g1 > g2;
      var p2lead = g2 > g1;
      html += '<div class="live-list-set">' +
        '<span class="s-top' + (p1lead ? ' leading' : '') + '">' + g1 + '</span>' +
        '<span' + (p2lead ? ' class="leading" style="color:var(--accent)"' : '') + '>' + g2 + '</span>' +
      '</div>';
    });
    // Current game
    if (m.status !== 'completed') {
      html += '<div class="live-list-set">' +
        '<span class="s-top" style="color:var(--accent)">' + (m.current_game_p1 || 0) + '</span>' +
        '<span style="color:var(--accent)">' + (m.current_game_p2 || 0) + '</span>' +
      '</div>';
    }
    html += '</div>';
    return html;
  }

  // ====== REALTIME (list) ======

  L.startAutoRefresh = function() {
    _realtimeOk = false;
    subscribeList();
    // Fallback polling 5 sec
    _pollTimer = setInterval(function() {
      var screen = document.getElementById('screenLive');
      if (screen && screen.classList.contains('active') && !_realtimeOk) {
        L.load();
      }
    }, 5000);
  };

  L.stopAutoRefresh = function() {
    if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
    if (_channel) { supabaseClient.removeChannel(_channel); _channel = null; }
    closeMatchOverlay();
  };

  function subscribeList() {
    if (!supabaseClient) return;
    _channel = supabaseClient.channel('live-list')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'live_matches'
      }, function() {
        _realtimeOk = true;
        L.load();
      })
      .subscribe(function(status) {
        if (status === 'SUBSCRIBED') {
          _realtimeOk = true;
          if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
        }
      });
  }

  // ====== MATCH DETAIL OVERLAY ======

  function openMatchOverlay(matchId) {
    _currentMatchId = matchId;
    var overlay = document.getElementById('liveFullOverlay');
    if (!overlay) return;

    // Show loading
    document.getElementById('liveScoreboard').innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';
    document.getElementById('liveVideo').innerHTML = '';
    document.getElementById('liveInfo').innerHTML = '';
    overlay.classList.add('open');

    loadMatchDetail(matchId);
    subscribeMatch(matchId);
  }

  function closeMatchOverlay() {
    _currentMatchId = null;
    var overlay = document.getElementById('liveFullOverlay');
    if (overlay) overlay.classList.remove('open');
    if (_matchChannel) {
      supabaseClient.removeChannel(_matchChannel);
      _matchChannel = null;
    }
  }

  function loadMatchDetail(matchId) {
    supabaseClient.from('live_matches')
      .select('*, player1:players!live_matches_player1_id_fkey(id, name, name_en, name_kg, photo), player2:players!live_matches_player2_id_fkey(id, name, name_en, name_kg, photo)')
      .eq('id', matchId)
      .single()
      .then(function(res) {
        if (res.error || !res.data) return;
        renderMatchDetail(res.data);
      });
  }

  function subscribeMatch(matchId) {
    if (_matchChannel) {
      supabaseClient.removeChannel(_matchChannel);
    }
    _matchChannel = supabaseClient.channel('live-match-' + matchId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'live_matches',
        filter: 'id=eq.' + matchId
      }, function() {
        if (_currentMatchId === matchId) loadMatchDetail(matchId);
      })
      .subscribe();
  }

  function renderMatchDetail(m) {
    var p1 = m.player1 || {};
    var p2 = m.player2 || {};
    var p1Name = pName(p1, m.player1_name);
    var p2Name = pName(p2, m.player2_name);
    var setsData = m.sets_data || [];
    var isCompleted = m.status === 'completed';
    var isWarmup = m.status === 'warmup';
    var isPaused = m.status === 'paused';

    // ---- Video ----
    var videoEl = document.getElementById('liveVideo');
    var ytId = extractYoutubeId(m.youtube_url);
    if (ytId) {
      videoEl.innerHTML =
        '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&rel=0&playsinline=1" ' +
        'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" ' +
        'allowfullscreen style="width:100%;height:100%;border:none;border-radius:var(--radius-lg)"></iframe>';
    } else {
      videoEl.innerHTML = '<span>' + I18N.t('live.noVideo') + '</span>';
    }

    // ---- Status badge ----
    var badgeClass = isWarmup ? 'lm-badge-warmup' : isPaused ? 'lm-badge-paused' : isCompleted ? 'lm-badge-completed' : '';
    var badgeText = isWarmup ? I18N.t('live.warmup') : isPaused ? I18N.t('live.paused') : isCompleted ? I18N.t('live.completed') : 'LIVE';

    // ---- Scoreboard ----
    var sbHtml = '<div class="live-full-sb-header">';
    if (isCompleted) {
      sbHtml += '<span class="sb-label" style="color:var(--text-muted)">' + I18N.t('live.completed') + '</span>';
    } else {
      sbHtml += '<span class="sb-dot"></span><span class="sb-label">' + badgeText + '</span>';
    }
    sbHtml += '</div>';

    // Player 1 row
    sbHtml += scoreRow(p1, p1Name, setsData, 1, m, isCompleted);
    // Player 2 row
    sbHtml += scoreRow(p2, p2Name, setsData, 2, m, isCompleted);

    document.getElementById('liveScoreboard').innerHTML = sbHtml;

    // ---- Tiebreak + Winner + Info ----
    var infoHtml = '';

    if (m.is_tiebreak && !isCompleted) {
      infoHtml += '<div class="lm-tiebreak-tag">' + I18N.t('live.tiebreak') + '</div>';
    }

    if (isCompleted && m.winner_player) {
      var winnerName = m.winner_player === 1 ? p1Name : p2Name;
      infoHtml += '<div class="lm-winner-block">' +
        '<div class="lm-winner-text">' + esc(winnerName) + ' ' + I18N.t('live.wins') + '</div>' +
        (m.final_score ? '<div class="lm-final-score">' + esc(m.final_score) + '</div>' : '') +
      '</div>';
    }

    var rows = '';
    if (m.tournament_label) rows += infoRow(I18N.t('live.tournament'), m.tournament_label);
    rows += infoRow(I18N.t('live.format'), I18N.t('live.bestOf') + ' ' + (m.best_of || 3));
    if (rows) {
      infoHtml += '<div class="live-full-info">' + rows + '</div>';
    }

    document.getElementById('liveInfo').innerHTML = infoHtml;
  }

  function scoreRow(player, name, setsData, pNum, m, isCompleted) {
    var isServing = m.serving_player === pNum;
    var isWinner = m.winner_player === pNum;

    var setsHtml = '';
    setsData.forEach(function(s) {
      var g = pNum === 1 ? (s.g1 || 0) : (s.g2 || 0);
      var opp = pNum === 1 ? (s.g2 || 0) : (s.g1 || 0);
      var wonSet = g > opp;
      setsHtml += '<span class="sb-set-val' + (wonSet ? ' won' : '') + '">' + g + '</span>';
    });

    if (!isCompleted) {
      // Current game
      var cg = pNum === 1 ? (m.current_game_p1 || 0) : (m.current_game_p2 || 0);
      setsHtml += '<span class="sb-set-val current">' + cg + '</span>';

      // Points
      var pt;
      if (m.is_tiebreak) {
        pt = pNum === 1 ? (m.tiebreak_p1 || 0) : (m.tiebreak_p2 || 0);
      } else {
        pt = pNum === 1 ? (m.points_p1 || '0') : (m.points_p2 || '0');
      }
      setsHtml += '<span class="sb-set-val sb-points">' + pt + '</span>';
    }

    var avatarHtml = '';
    if (player && player.photo) {
      avatarHtml = '<img class="sb-avatar" src="' + esc(player.photo) + '" alt="' + esc(name) + '">';
    } else {
      var initial = name ? name.charAt(0).toUpperCase() : '?';
      avatarHtml = '<div class="sb-avatar">' + initial + '</div>';
    }

    return '<div class="live-full-sb-row' + (isServing ? ' serving' : '') + (isWinner ? ' winner-row' : '') + '">' +
      avatarHtml +
      (isServing ? '<span class="sb-dot-serve"></span>' : '<span class="sb-no-serve"></span>') +
      '<span class="sb-pname">' + esc(name) + '</span>' +
      '<div class="sb-sets">' + setsHtml + '</div>' +
    '</div>';
  }

  function infoRow(label, val) {
    return '<div class="live-full-info-row"><span class="lfi-label">' + esc(label) + '</span><span class="lfi-val">' + esc(val) + '</span></div>';
  }

  // ====== HELPERS ======

  function pName(player, fallback) {
    var lang = I18N.lang || 'ru';
    if (lang === 'en' && player && player.name_en) return player.name_en;
    if (lang === 'kg' && player && player.name_kg) return player.name_kg;
    if (player && player.name) return player.name;
    return fallback || '—';
  }

  function avatarSmall(player, name) {
    if (player && player.photo) {
      return '<img class="live-list-av" src="' + esc(player.photo) + '" alt="' + esc(name) + '" style="object-fit:cover">';
    }
    return '<div class="live-list-av">' + initials(name) + '</div>';
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0, 2).join('');
  }

  function shortName(name) {
    if (!name) return '?';
    var parts = name.split(' ');
    if (parts.length >= 2) {
      return esc(parts[0].charAt(0) + '. ' + parts[parts.length - 1]);
    }
    return esc(name);
  }

  function extractYoutubeId(url) {
    if (!url) return null;
    var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
    return m ? m[1] : null;
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  // ====== BACK BUTTON ======

  var backBtn = document.getElementById('liveBack');
  if (backBtn) {
    backBtn.addEventListener('click', function() {
      closeMatchOverlay();
    });
  }

})();
