// ============================================
// KSLT Mobile — Home Screen
// ============================================
(function() {
  'use strict';
  var I18N = window.KSLT_I18N;

  var HOME = window.KSLT_HOME = {};

  HOME.load = function() {
    loadLiveMatches();
    loadBattles();
    loadUpcomingTournaments();
    loadLatestNews();
  };

  // ============================
  // LIVE MATCHES
  // ============================
  function loadLiveMatches() {
    var el = document.getElementById('homeLive');
    if (!supabaseClient) return;

    supabaseClient.from('matches')
      .select('*, player1:players!matches_player1_id_fkey(name, photo), player2:players!matches_player2_id_fkey(name, photo), tournament:tournaments(title)')
      .eq('status', 'live')
      .limit(3)
      .then(function(r) {
        if (r.error) console.error('Live:', r.error);
        if (r.data && r.data.length > 0) {
          var html = '<div class="section-title"><h2>Live</h2><span class="see-all" data-nav="screenLive">' + I18N.t('home.watch') + '</span></div>';
          r.data.forEach(function(m) { html += renderLiveCard(m); });
          el.innerHTML = html;
          el.querySelectorAll('.live-card').forEach(function(card) {
            card.addEventListener('click', function() {
              openLiveMatch(this.getAttribute('data-match-id'));
            });
          });
        } else {
          el.innerHTML = '';
        }
      });
  }

  function renderLiveCard(m) {
    var p1 = m.player1 ? m.player1.name : I18N.t('home.player') + ' 1';
    var p2 = m.player2 ? m.player2.name : I18N.t('home.player') + ' 2';
    var tName = m.tournament ? m.tournament.title : '';
    return '<div class="card live-card" data-match-id="' + m.id + '">' +
      '<div class="live-header">' +
        '<span class="live-badge">LIVE</span>' +
        '<span class="live-court">' + esc(m.court || '') + (tName ? ' · ' + esc(tName) : '') + '</span>' +
      '</div>' +
      '<div class="live-players">' +
        '<div class="live-player">' +
          '<div class="live-avatar">' + initials(p1) + '</div>' +
          '<div class="live-player-name">' + esc(p1) + '</div>' +
        '</div>' +
        '<div class="live-score-block">' + renderScore(m.score) + '</div>' +
        '<div class="live-player">' +
          '<div class="live-avatar">' + initials(p2) + '</div>' +
          '<div class="live-player-name">' + esc(p2) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function openLiveMatch(matchId) {
    var AUTH = window.KSLT_AUTH;
    if (!AUTH || !AUTH.currentUser) {
      if (AUTH && AUTH.showAuth) AUTH.showAuth();
      if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('home.loginToWatch'));
      return;
    }
    var overlay = document.getElementById('liveFullOverlay');
    if (!overlay) return;

    supabaseClient.from('matches')
      .select('*, player1:players!matches_player1_id_fkey(name), player2:players!matches_player2_id_fkey(name), tournament:tournaments(title, location)')
      .eq('id', matchId).single()
      .then(function(r) {
        if (!r.data) return;
        var m = r.data;
        var p1 = m.player1 ? m.player1.name : I18N.t('home.player') + ' 1';
        var p2 = m.player2 ? m.player2.name : I18N.t('home.player') + ' 2';
        var sets = parseScore(m.score);

        var sbHtml = '<div class="live-full-sb-header"><span class="sb-dot"></span><span class="sb-label">LIVE</span></div>';
        sbHtml += sbRow(p1, sets, 0, true);
        sbHtml += sbRow(p2, sets, 1, false);
        document.getElementById('liveScoreboard').innerHTML = sbHtml;

        document.getElementById('liveVideo').textContent = I18N.t('live.noStream');

        var rows = '';
        if (m.tournament) rows += infoRow(I18N.t('td.tournament'), m.tournament.title);
        if (m.round_number) rows += infoRow(I18N.t('live.round'), roundName(m.round_number));
        if (m.court) rows += infoRow(I18N.t('live.court'), m.court);
        document.getElementById('liveInfo').innerHTML = rows;
        overlay.classList.add('open');
      });
  }

  function sbRow(name, sets, idx, serving) {
    var html = '';
    sets.forEach(function(s, i) {
      var v = s[idx], isLast = i === sets.length - 1;
      var cls = isLast ? 'sb-set-val current' : 'sb-set-val';
      html += '<span class="' + cls + '">' + v + '</span>';
    });
    return '<div class="live-full-sb-row' + (serving ? ' serving' : '') + '">' +
      '<div class="sb-avatar">' + initials(name) + '</div>' +
      (serving ? '<span class="sb-dot-serve"></span>' : '<span class="sb-no-serve"></span>') +
      '<span class="sb-pname">' + esc(name) + '</span>' +
      '<div class="sb-sets">' + html + '</div></div>';
  }

  // ============================
  // BATTLES
  // ============================
  function loadBattles() {
    var el = document.getElementById('homeBattles');
    if (!el || !supabaseClient) return;

    supabaseClient.from('challenges')
      .select('*, challenger:players!challenges_challenger_player_id_fkey(name, photo), opponent:players!challenges_opponent_player_id_fkey(name, photo)')
      .eq('battle_published', true)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(function(r) {
        if (r.error) console.error('Battles:', r.error);
        if (!r.data || r.data.length === 0) { el.innerHTML = ''; return; }
        var html = '<div class="section-title"><h2>' + I18N.t('home.battles') + '</h2><span class="see-all" data-nav="screenBattles">' + I18N.t('home.all') + '</span></div>';
        html += '<div class="tournament-scroll">';
        r.data.forEach(function(b) { html += renderBattleCard(b); });
        html += '</div>';
        el.innerHTML = html;
        el.querySelectorAll('[data-battle-id]').forEach(function(card) {
          card.addEventListener('click', function() {
            openBattleDetail(this.getAttribute('data-battle-id'));
          });
        });
      });
  }

  function renderBattleCard(b) {
    var chName = b.challenger ? b.challenger.name : I18N.t('home.player') + ' 1';
    var opName = b.opponent ? b.opponent.name : I18N.t('home.player') + ' 2';
    var imgStyle = b.banner_url
      ? 'background-image:url(' + b.banner_url + ');background-size:cover;background-position:center'
      : 'background:linear-gradient(135deg,#2d1b4e,#1a0a2e)';

    return '<div class="tournament-card-v" data-battle-id="' + b.id + '">' +
      '<div class="tcv-img" style="' + imgStyle + '">' +
        (b.banner_url ? '' : '<div class="battle-vs-mini">' +
          '<div class="bvm-avatar">' + initials(chName) + '</div>' +
          '<span class="bvm-vs">VS</span>' +
          '<div class="bvm-avatar">' + initials(opName) + '</div>' +
        '</div>') +
        '<span class="tcv-badge">' + I18N.t('battles.battle') + '</span>' +
      '</div>' +
      '<div class="tcv-body">' +
        '<div class="tcv-name">' + esc(b.battle_title || chName + ' vs ' + opName) + '</div>' +
        '<div class="tcv-meta"><span>' + esc(chName) + ' vs ' + esc(opName) + '</span></div>' +
      '</div>' +
    '</div>';
  }

  // ============================
  // UPCOMING TOURNAMENTS
  // ============================
  function loadUpcomingTournaments() {
    var el = document.getElementById('homeTournament');
    if (!supabaseClient) return;

    var today = new Date().toISOString().split('T')[0];
    supabaseClient.from('tournaments')
      .select('*')
      .gte('date_start', today)
      .order('date_start', { ascending: true })
      .limit(3)
      .then(function(r) {
        if (r.error) console.error('Tournaments:', r.error);
        if (!r.data || r.data.length === 0) { el.innerHTML = ''; return; }
        var html = '<div class="section-title"><h2>' + I18N.t('home.upcoming') + '</h2><span class="see-all" data-nav="screenTournaments">' + I18N.t('home.all') + '</span></div>';
        html += '<div class="tournament-scroll">';
        r.data.forEach(function(t) { html += renderTournamentCard(t); });
        html += '</div>';
        el.innerHTML = html;
        el.querySelectorAll('.tournament-card-v').forEach(function(card) {
          card.addEventListener('click', function() {
            openTournamentDetail(this.getAttribute('data-tournament-id'));
          });
        });
      });
  }

  function renderTournamentCard(t) {
    var d = new Date(t.date_start);
    var imgStyle = t.image
      ? 'background-image:url(' + t.image + ');background-size:cover;background-position:center'
      : 'background:linear-gradient(135deg,#0d2818,#1a4030)';

    return '<div class="tournament-card-v" data-tournament-id="' + t.id + '">' +
      '<div class="tcv-img" style="' + imgStyle + '">' +
        (t.image ? '' : '<span class="tcv-img-icon">🏆</span>') +
        '<div class="tcv-date">' +
          '<span class="tcv-date-day">' + d.getDate() + '</span>' +
          '<span class="tcv-date-month">' + I18N.month(d.getMonth()) + '</span>' +
        '</div>' +
      '</div>' +
      '<div class="tcv-body">' +
        '<div class="tcv-name">' + esc(t.title) + '</div>' +
        '<div class="tcv-meta">' +
          (t.location ? '<svg viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg><span>' + esc(t.location) + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</div>';
  }

  HOME.openTournamentDetail = openTournamentDetail;
  HOME.openBattleDetail = openBattleDetail;
  HOME.openNewsDetail = openNewsDetail;
  function openTournamentDetail(tid) {
    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_tournament_view', { p_tournament_id: tid });
    }

    var overlay = document.getElementById('tdOverlay');
    if (!overlay) return;
    // Load tournament + court in parallel
    var trnP = supabaseClient.from('tournaments').select('*').eq('id', tid).single();

    trnP.then(function(r) {
      if (!r.data) return;
      var t = r.data;

      // Load court if available
      var courtP = t.court_id
        ? supabaseClient.from('courts').select('id, name, street, building, city, google_maps_url, twogis_url, photo').eq('id', t.court_id).single()
        : Promise.resolve({ data: null });

      courtP.then(function(cRes) {
        var court = cRes.data;
        renderTournamentInfo(overlay, t, court);

        // Load bracket, results, and participants
        loadBracket(t);
        loadResults(t.id);
        loadParticipants(t);
      }); // courtP
    }); // trnP
  }

  // ============================
  // BRACKET TAB
  // ============================

  // Helper: shorten name to "И. Фамилия" format
  function shortName(fullName) {
    if (!fullName) return '?';
    var parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) return parts[0];
    // Russian names: "Фамилия Имя" or "Имя Фамилия"
    // Keep last part as surname, shorten others
    var surname = parts[parts.length - 1];
    var inits = '';
    for (var i = 0; i < parts.length - 1; i++) {
      inits += parts[i].charAt(0).toUpperCase() + '. ';
    }
    return inits + surname;
  }

  // Helper: get team name for doubles or singles (shortened)
  function getMobileTeamName(playerId, regsMap, playersMap, isDbl) {
    var p = playersMap[playerId];
    var captainName = p ? esc(shortName(p.name)) : (playerId ? 'TBD' : 'BYE');
    if (!isDbl) return captainName;
    var reg = regsMap ? regsMap[playerId] : null;
    if (!reg) return captainName;
    var partnerName = '';
    if (reg.partner_id) {
      var pp = playersMap[reg.partner_id];
      partnerName = pp ? esc(shortName(pp.name)) : '?';
    } else if (reg.partner_external_name) {
      partnerName = esc(shortName(reg.partner_external_name));
    }
    return partnerName ? captainName + ' / ' + partnerName : captainName;
  }

  // Helper: parse score "6/3 4/6 7/5" → [[6,3],[4,6],[7,5]]
  function parseSets(score) {
    if (!score || typeof score !== 'string') return [];
    return score.split(' ').filter(function(s) { return /\d+\/\d+/.test(s); }).map(function(s) {
      var p = s.split('/');
      return [parseInt(p[0]) || 0, parseInt(p[1]) || 0];
    });
  }

  // Render match card (shared for groups + playoff)
  function renderMatchCard(m, regsMap, playersMap, isDbl) {
    var p1Name = m.player1_id ? getMobileTeamName(m.player1_id, regsMap, playersMap, isDbl) : (m.seed1 ? 'Seed ' + m.seed1 : 'TBD');
    var p2Name = m.player2_id ? getMobileTeamName(m.player2_id, regsMap, playersMap, isDbl) : (m.seed2 ? 'Seed ' + m.seed2 : 'TBD');
    var p1Win = m.winner_id && m.winner_id === m.player1_id;
    var p2Win = m.winner_id && m.winner_id === m.player2_id;
    var sets = parseSets(m.score);

    var seed1Html = m.seed1 ? '<span class="mob-match-seed">[' + m.seed1 + ']</span>' : '<span class="mob-match-seed"></span>';
    var seed2Html = m.seed2 ? '<span class="mob-match-seed">[' + m.seed2 + ']</span>' : '<span class="mob-match-seed"></span>';

    var sets1Html = '', sets2Html = '';
    if (sets.length > 0) {
      sets.forEach(function(s) {
        sets1Html += '<span class="mob-set">' + s[0] + '</span>';
        sets2Html += '<span class="mob-set">' + s[1] + '</span>';
      });
    }

    var html = '<div class="mob-match-card">';
    html += '<div class="mob-match-row' + (p1Win ? ' winner' : '') + '">';
    html += seed1Html;
    html += '<span class="mob-match-name">' + p1Name + '</span>';
    if (sets.length) html += '<div class="mob-match-sets">' + sets1Html + '</div>';
    html += '</div>';
    html += '<div class="mob-match-row' + (p2Win ? ' winner' : '') + '">';
    html += seed2Html;
    html += '<span class="mob-match-name">' + p2Name + '</span>';
    if (sets.length) html += '<div class="mob-match-sets">' + sets2Html + '</div>';
    html += '</div>';
    html += '</div>';
    return html;
  }

  function loadBracket(tournament) {
    var container = document.getElementById('tdBracket');
    if (!container) return;
    container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    var tid = tournament.id;
    var isDbl = tournament.format === 'doubles' || tournament.format === 'mixed_doubles';

    // Load matches + registrations in parallel
    var matchesP = supabaseClient.from('matches')
      .select('id, tournament_id, player1_id, player2_id, winner_id, score, status, round_number, match_order, round, group_number, seed1, seed2, court, scheduled_time')
      .eq('tournament_id', tid)
      .order('round_number', { ascending: false })
      .order('match_order', { ascending: true });

    var regsP = supabaseClient.from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tid);

    Promise.all([matchesP, regsP]).then(function(results) {
      var mRes = results[0];
      var rRes = results[1];

      if (mRes.error || !mRes.data || mRes.data.length === 0) {
        container.innerHTML = '<div class="pd-empty-small" style="padding:40px 16px">' + I18N.t('td.bracketEmpty') + '</div>';
        return;
      }

      var matches = mRes.data;
      var regs = rRes.data || [];

      var regsMap = {};
      regs.forEach(function(reg) { if (reg.player_id) regsMap[reg.player_id] = reg; });

      // Collect all player IDs
      var playerIds = {};
      matches.forEach(function(m) {
        if (m.player1_id) playerIds[m.player1_id] = true;
        if (m.player2_id) playerIds[m.player2_id] = true;
      });
      if (isDbl) {
        regs.forEach(function(reg) { if (reg.partner_id) playerIds[reg.partner_id] = true; });
      }
      var pIds = Object.keys(playerIds);

      if (pIds.length === 0) {
        renderBracketContent(container, tournament, matches, regsMap, {}, isDbl);
        return;
      }

      supabaseClient.from('players').select('id, name, photo').in('id', pIds).then(function(pRes) {
        var playersMap = {};
        (pRes.data || []).forEach(function(p) { playersMap[p.id] = p; });
        renderBracketContent(container, tournament, matches, regsMap, playersMap, isDbl);
      });
    });
  }

  function renderBracketContent(container, tournament, matches, regsMap, playersMap, isDbl) {
    var hasGroups = matches.some(function(m) { return m.group_number && m.group_number > 0; });
    if (hasGroups) {
      renderMobileGroups(container, tournament, matches, regsMap, playersMap, isDbl);
    } else {
      renderMobilePlayoff(container, tournament, matches, regsMap, playersMap, isDbl);
    }
  }

  // ============================
  // GROUPS
  // ============================
  function renderMobileGroups(container, tournament, matches, regsMap, playersMap, isDbl) {
    var grpMatches = matches.filter(function(m) { return m.group_number && m.group_number > 0; });
    var ploffMatches = matches.filter(function(m) { return (!m.group_number || m.group_number <= 0) && m.round !== 'IG'; });

    var maxGroup = 0;
    grpMatches.forEach(function(m) { if (m.group_number > maxGroup) maxGroup = m.group_number; });

    var letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    var qualifiers = tournament.qualifiers_per_group || 2;
    var allGroupDone = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });

    // Build groups HTML
    var groupsHtml = '';
    groupsHtml += '<div class="mob-section-title">' + I18N.t('td.groupStage') + '</div>';

    for (var g = 1; g <= maxGroup; g++) {
      var gMatches = grpMatches.filter(function(m) { return m.group_number === g; });
      if (!gMatches.length) continue;

      var gPlayerIds = [];
      gMatches.forEach(function(m) {
        if (m.player1_id && gPlayerIds.indexOf(m.player1_id) === -1) gPlayerIds.push(m.player1_id);
        if (m.player2_id && gPlayerIds.indexOf(m.player2_id) === -1) gPlayerIds.push(m.player2_id);
      });

      var hasResults = gMatches.some(function(m) { return m.status === 'completed'; });

      // Calculate standings
      var stats = {};
      gPlayerIds.forEach(function(pid) { stats[pid] = { playerId: pid, wins: 0, losses: 0, seed: null }; });
      gMatches.forEach(function(m) {
        if (m.seed1 && stats[m.player1_id]) stats[m.player1_id].seed = m.seed1;
        if (m.seed2 && stats[m.player2_id]) stats[m.player2_id].seed = m.seed2;
        if (m.status === 'completed' && m.winner_id && m.score !== 'BYE') {
          if (stats[m.winner_id]) stats[m.winner_id].wins++;
          var lid = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
          if (stats[lid]) stats[lid].losses++;
        }
      });

      var standings = gPlayerIds.map(function(pid) { return stats[pid]; });
      standings.sort(function(a, b) {
        if (b.wins !== a.wins) return b.wins - a.wins;
        var sa = a.seed || 9999; var sb = b.seed || 9999;
        return sa - sb;
      });
      standings.forEach(function(st, i) { st.place = i + 1; });

      var mgp = tournament.manual_group_places || {};
      if (mgp[String(g)]) {
        var ov = mgp[String(g)];
        standings.forEach(function(st) {
          if (ov[st.playerId] !== undefined) st.place = ov[st.playerId];
        });
      }

      var letter = letters[g - 1] || String(g);
      groupsHtml += '<div class="mob-group">';
      groupsHtml += '<div class="mob-group-title">' + I18N.t('td.group') + ' ' + letter + '</div>';

      // Standings table — only when there are results
      if (hasResults) {
        groupsHtml += '<table class="mob-standings">';
        groupsHtml += '<thead><tr><th class="num">#</th><th>' + I18N.t('home.player') + '</th>';
        groupsHtml += '<th class="stat">' + I18N.t('td.winsShort') + '</th>';
        groupsHtml += '<th class="stat">' + I18N.t('td.lossesShort') + '</th>';
        groupsHtml += '<th class="stat">' + I18N.t('td.posShort') + '</th>';
        groupsHtml += '</tr></thead><tbody>';

        standings.forEach(function(st, idx) {
          var name = getMobileTeamName(st.playerId, regsMap, playersMap, isDbl);
          var seedHtml = st.seed ? '<span class="seed">[' + st.seed + ']</span>' : '';
          var isQualified = st.place <= qualifiers && allGroupDone;
          groupsHtml += '<tr' + (isQualified ? ' class="qualified"' : '') + '>';
          groupsHtml += '<td class="num">' + (idx + 1) + '</td>';
          groupsHtml += '<td>' + name + seedHtml + '</td>';
          groupsHtml += '<td class="stat">' + st.wins + '</td>';
          groupsHtml += '<td class="stat">' + st.losses + '</td>';
          groupsHtml += '<td class="stat" style="font-weight:700' + (isQualified ? ';color:var(--accent)' : '') + '">' + st.place + '</td>';
          groupsHtml += '</tr>';
        });
        groupsHtml += '</tbody></table>';
      }

      // Match cards for this group
      gMatches.forEach(function(m) {
        groupsHtml += renderMatchCard(m, regsMap, playersMap, isDbl);
      });

      groupsHtml += '</div>'; // /mob-group
    }

    // Build playoff HTML — check for GL dual leagues (PL-/CL- rounds)
    var playoffHtml = '';
    var plMatches = ploffMatches.filter(function(m) { return m.round && m.round.indexOf('PL-') === 0; });
    var clMatches = ploffMatches.filter(function(m) { return m.round && m.round.indexOf('CL-') === 0; });
    var hasLeagues = plMatches.length > 0 || clMatches.length > 0;

    if (hasLeagues) {
      // GL mode: two separate league sections
      if (plMatches.length > 0) {
        playoffHtml += '<div class="mob-section-title">' + I18N.t('td.premierLeague') + '</div>';
        playoffHtml += renderPlayoffWithPills(container, plMatches, regsMap, playersMap, isDbl, 'PL');
      }
      if (clMatches.length > 0) {
        playoffHtml += '<div class="mob-section-title" style="margin-top:24px">' + I18N.t('td.consolationLeague') + '</div>';
        playoffHtml += renderPlayoffWithPills(container, clMatches, regsMap, playersMap, isDbl, 'CL');
      }
    } else if (ploffMatches.length > 0) {
      // Standard SE playoff
      playoffHtml += '<div class="mob-section-title">' + I18N.t('td.playoff') + '</div>';
      playoffHtml += renderPlayoffWithPills(container, ploffMatches, regsMap, playersMap, isDbl, '');
    }

    // Order: completed → playoff first, otherwise groups first
    var html = '<div style="padding:16px">';
    if (tournament.status === 'completed' && playoffHtml) {
      html += playoffHtml + groupsHtml;
    } else {
      html += groupsHtml + playoffHtml;
    }
    html += '</div>';
    container.innerHTML = html;
    bindRoundPills(container);
  }

  // ============================
  // PLAYOFF — Round Pills
  // ============================
  function renderMobilePlayoff(container, tournament, matches, regsMap, playersMap, isDbl) {
    var html = '<div style="padding:16px">';
    html += renderPlayoffWithPills(container, matches, regsMap, playersMap, isDbl, '');
    html += '</div>';
    container.innerHTML = html;
    bindRoundPills(container);
  }

  function renderPlayoffWithPills(container, matches, regsMap, playersMap, isDbl, prefix) {
    // Separate 3rd-place matches (supports '3RD', 'PL-3RD', 'CL-3RD')
    var thirdPlace = matches.filter(function(m) {
      return m.round === '3RD' || m.round === (prefix + '-3RD');
    });
    var regularMatches = matches.filter(function(m) {
      return m.round !== '3RD' && m.round !== (prefix + '-3RD');
    });

    // Group by round_number
    var rounds = {};
    regularMatches.forEach(function(m) {
      var rn = m.round_number || 1;
      if (!rounds[rn]) rounds[rn] = [];
      rounds[rn].push(m);
    });

    var thirdKey = '3RD-' + (prefix || 'SE');
    if (thirdPlace.length > 0) {
      rounds[thirdKey] = thirdPlace;
    }

    // Sort: Final → 3rd place → Semi → Quarter → ...
    var numericKeys = Object.keys(rounds).filter(function(k) { return k.indexOf('3RD') !== 0; }).map(Number);
    var maxRound = numericKeys.length > 0 ? Math.max.apply(null, numericKeys) : 1;
    var roundKeys = numericKeys.sort(function(a, b) { return b - a; });
    // Insert 3rd place right after final (index 1)
    if (thirdPlace.length > 0) roundKeys.splice(1, 0, thirdKey);

    if (roundKeys.length === 0) return '';

    // Unique data-attribute prefix to avoid collisions between PL/CL pills
    var uid = prefix || 'se';

    // Build pills with relative round names
    var html = '<div class="round-pills">';
    roundKeys.forEach(function(rk, idx) {
      var label = (typeof rk === 'string' && rk.indexOf('3RD') === 0) ? I18N.t('td.thirdPlace') : playoffRoundName(rk, maxRound);
      html += '<button class="round-pill' + (idx === 0 ? ' active' : '') + '" data-rpill="' + uid + '" data-round="' + rk + '">' + label + '</button>';
    });
    html += '</div>';

    // Build round panels
    roundKeys.forEach(function(rk, idx) {
      var rMatches = rounds[rk];
      html += '<div class="round-panel" data-rpill="' + uid + '" data-round-panel="' + rk + '"' + (idx !== 0 ? ' style="display:none"' : '') + '>';
      rMatches.forEach(function(m) {
        html += renderMatchCard(m, regsMap, playersMap, isDbl);
      });
      html += '</div>';
    });

    return html;
  }

  function bindRoundPills(container) {
    var pills = container.querySelectorAll('.round-pill');
    pills.forEach(function(pill) {
      pill.addEventListener('click', function() {
        var rk = this.getAttribute('data-round');
        var uid = this.getAttribute('data-rpill');
        // Toggle active pill within same group
        container.querySelectorAll('.round-pill[data-rpill="' + uid + '"]').forEach(function(p) { p.classList.remove('active'); });
        this.classList.add('active');
        // Show/hide panels within same group
        container.querySelectorAll('.round-panel[data-rpill="' + uid + '"]').forEach(function(panel) {
          panel.style.display = panel.getAttribute('data-round-panel') === rk ? '' : 'none';
        });
      });
    });
  }

  function playoffRoundName(rn, maxRound) {
    var fromEnd = (maxRound || rn) - rn;
    if (fromEnd === 0) return I18N.t('td.final');
    if (fromEnd === 1) return I18N.t('td.semifinal');
    if (fromEnd === 2) return I18N.t('td.quarterfinal');
    return I18N.t('td.roundN') + ' ' + rn;
  }

  // ============================
  // RESULTS TAB
  // ============================
  function loadResults(tournamentId) {
    var container = document.getElementById('tdResults');
    if (!container) return;
    container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    // Results are stored in rating_history, not tournament_registrations
    supabaseClient.from('rating_history')
      .select('player_id, points_earned')
      .eq('tournament_id', tournamentId)
      .order('points_earned', { ascending: false })
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small" style="padding:40px 16px">' + I18N.t('td.resultsEmpty') + '</div>';
          return;
        }

        var rows = r.data;
        var pIds = rows.map(function(row) { return row.player_id; });

        supabaseClient.from('players').select('id, name').in('id', pIds).then(function(pRes) {
          var playersMap = {};
          (pRes.data || []).forEach(function(p) { playersMap[p.id] = p; });

          var html = '<div style="padding:16px"><div class="pd-matches-list">';
          rows.forEach(function(row, i) {
            var p = playersMap[row.player_id];
            var pName = p ? p.name : '?';
            html += '<div class="pd-match" style="cursor:default">';
            html += '<div class="pd-match-date" style="font-weight:700;color:var(--text);min-width:28px">#' + (i + 1) + '</div>';
            html += '<div class="pd-match-info"><div class="pd-match-opp">' + esc(shortName(pName)) + '</div></div>';
            html += '<div class="pd-match-score" style="color:var(--accent);font-weight:700">+' + (row.points_earned || 0) + '</div>';
            html += '</div>';
          });
          html += '</div></div>';
          container.innerHTML = html;
        });
      });
  }

  // ============================
  // PARTICIPANTS
  // ============================
  function loadParticipants(tournament) {
    var container = document.getElementById('tdParticipants');
    if (!container) return;

    var tid = tournament.id;
    var isDbl = tournament.format === 'doubles' || tournament.format === 'mixed_doubles';

    supabaseClient.from('tournament_registrations')
      .select('*')
      .eq('tournament_id', tid)
      .in('status', ['approved', 'draw', 'pending'])
      .order('created_at', { ascending: true })
      .then(function(r) {
        if (!r.data || r.data.length === 0) return;
        var regs = r.data;

        // Collect all player IDs (player_id + partner_id)
        var pIds = {};
        regs.forEach(function(reg) {
          if (reg.player_id) pIds[reg.player_id] = true;
          if (isDbl && reg.partner_id) pIds[reg.partner_id] = true;
        });
        var idArr = Object.keys(pIds);
        if (idArr.length === 0) return;

        supabaseClient.from('players').select('id, name, photo, category_id').in('id', idArr).then(function(pRes) {
          var playersMap = {};
          (pRes.data || []).forEach(function(p) { playersMap[p.id] = p; });

          // Build regsMap for getMobileTeamName
          var regsMap = {};
          regs.forEach(function(reg) { if (reg.player_id) regsMap[reg.player_id] = reg; });

          var html = '<div style="margin-top:16px"><div class="pd-section-title" style="font-size:14px;font-weight:600;margin-bottom:8px">' + (isDbl ? I18N.t('td.pairs') : I18N.t('td.participants')) + ' (' + regs.length + ')</div>';
          html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
          regs.forEach(function(reg) {
            var p = playersMap[reg.player_id];
            var displayName = getMobileTeamName(reg.player_id, regsMap, playersMap, isDbl);
            var photo = p ? p.photo : '';
            var plainName = p ? p.name : I18N.t('home.player');
            html += '<div style="display:flex;align-items:center;gap:6px;background:var(--glass);border:1px solid var(--border);border-radius:20px;padding:4px 10px 4px 4px;font-size:12px">';
            html += photo
              ? '<img src="' + esc(photo) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover" alt="">'
              : '<div style="width:24px;height:24px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600">' + initials(plainName) + '</div>';
            html += '<span style="color:var(--text-sec)">' + displayName + '</span>';
            if (reg.status === 'pending') html += '<span style="color:var(--orange);font-size:10px">⏳</span>';
            html += '</div>';
          });
          html += '</div></div>';
          container.innerHTML = html;
        });
      });
  }

  // ============================
  // LATEST NEWS
  // ============================
  function loadLatestNews() {
    var el = document.getElementById('homeNews');
    if (!supabaseClient) return;

    supabaseClient.from('news')
      .select('*')
      .not('published_at', 'is', null)
      .order('created_at', { ascending: false })
      .limit(3)
      .then(function(r) {
        if (r.error) console.error('News:', r.error);
        if (!r.data || r.data.length === 0) { el.innerHTML = ''; return; }
        var html = '<div class="section-title"><h2>' + I18N.t('home.latestNews') + '</h2><span class="see-all" data-nav="screenNews">' + I18N.t('home.all') + '</span></div>';
        html += '<div class="tournament-scroll">';
        r.data.forEach(function(n) { html += renderNewsCard(n); });
        html += '</div>';
        el.innerHTML = html;
        el.querySelectorAll('.news-card-v').forEach(function(card) {
          card.addEventListener('click', function() {
            openNewsDetail(this.getAttribute('data-news-id'));
          });
        });
      });
  }

  function renderNewsCard(n) {
    var d = new Date(n.created_at);
    var dateStr = d.getDate() + ' ' + I18N.month(d.getMonth());
    var imgStyle = n.image
      ? 'background-image:url(' + n.image + ');background-size:cover;background-position:center'
      : 'background:linear-gradient(135deg,#1a1a2e,#16213e)';
    var catLabels = { announcement: 'Анонс', tournament: 'Турнир', club: 'Клуб', rating: 'Рейтинг', news: 'Новости' };

    return '<div class="tournament-card-v news-card-v" data-news-id="' + n.id + '">' +
      '<div class="tcv-img" style="' + imgStyle + '">' +
        (n.image ? '' : '<span class="tcv-img-icon">📰</span>') +
        '<span class="tcv-badge">' + esc(catLabels[n.category] || n.category || 'Новости') + '</span>' +
      '</div>' +
      '<div class="tcv-body">' +
        '<div class="tcv-name">' + esc(I18N.field(n, 'title')) + '</div>' +
        '<div class="tcv-meta"><span>' + dateStr + '</span></div>' +
      '</div>' +
    '</div>';
  }

  function openNewsDetail(nid) {
    if (window.KSLT_APP && window.KSLT_APP.incrementView) {
      window.KSLT_APP.incrementView('increment_news_view', { p_news_id: nid });
    }

    var overlay = document.getElementById('newsOverlay');
    if (!overlay) return;
    supabaseClient.from('news').select('*').eq('id', nid).single().then(function(r) {
      if (!r.data) return;
      var n = r.data;
      var d = new Date(n.created_at);
      var dateStr = d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear();
      var html = '';
      // Шапка режет афишу: вертикальные постеры теряют даты и состав.
      // Если сохранён исходник — его открывает кнопка поверх обложки.
      if (n.image) {
        html += '<div class="nd-hero-img" style="background-image:url(' + n.image + ')">' +
          (n.image_original
            ? '<button type="button" class="nd-hero-zoom" data-full="' + esc(n.image_original) + '">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
                  '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>' +
                '</svg>' + I18N.t('news.fullPoster') +
              '</button>'
            : '') +
        '</div>';
      }
      html += '<div class="nd-content">';
      html += '<div class="nd-tag">' + esc(n.category || I18N.t('home.latestNews')) + '</div>';
      html += '<h1 class="nd-title">' + esc(I18N.field(n, 'title')) + '</h1>';
      html += '<div class="nd-date">' + dateStr + '</div>';
      // Render content blocks if JSON array, otherwise raw HTML
      var text = I18N.field(n, 'content');
      var contentHtml = '';
      if (text) {
        try {
          var blocks = JSON.parse(text);
          if (Array.isArray(blocks)) {
            blocks.forEach(function(block) {
              if (block.type === 'text' || block.type === 'paragraph') {
                contentHtml += '<p style="margin-bottom:12px;line-height:1.6">' + (block.text || block.content || '') + '</p>';
              } else if (block.type === 'image') {
                contentHtml += '<div style="margin:16px 0"><img src="' + esc(block.url || block.src || '') + '" style="width:100%;border-radius:8px" alt=""><div style="font-size:11px;color:var(--text-muted);margin-top:4px">' + esc(block.caption || '') + '</div></div>';
              } else if (block.type === 'quote') {
                contentHtml += '<blockquote style="border-left:3px solid var(--accent);padding:8px 12px;margin:12px 0;color:var(--text-sec);font-style:italic">' + (block.text || block.content || '') + '</blockquote>';
              } else if (block.type === 'heading' || block.type === 'header') {
                contentHtml += '<h3 style="margin:16px 0 8px">' + esc(block.text || block.content || '') + '</h3>';
              } else {
                contentHtml += '<p>' + (block.text || block.content || '') + '</p>';
              }
            });
          } else {
            contentHtml = text;
          }
        } catch(e) {
          contentHtml = text;
        }
      }
      html += '<div class="nd-body">' + contentHtml + '</div>';

      var gallery = Array.isArray(n.gallery) ? n.gallery.filter(Boolean) : [];
      if (window.KSLT_NEWS_MEDIA) html += KSLT_NEWS_MEDIA.render(gallery);

      // Poll block (if news has poll)
      if (n.poll && n.poll.question && n.poll.options && n.poll.options.length) {
        html += '<div class="nd-poll" id="ndPoll">';
        html += '<div class="nd-poll-question">' + esc(n.poll.question) + '</div>';
        html += '<div class="nd-poll-options" id="ndPollOptions">';
        n.poll.options.forEach(function(opt, i) {
          html += '<button class="nd-poll-option" data-index="' + i + '">' + esc(opt) + '</button>';
        });
        html += '</div>';
        html += '<div class="nd-poll-results" id="ndPollResults" style="display:none"></div>';
        html += '</div>';
      }

      // Reactions block
      html += '<div class="nd-reactions">' +
        '<div class="nd-reactions-title">' + I18N.t('news.rateTitle') + '</div>' +
        '<div class="nd-reactions-row">' +
          '<button class="nd-react-btn" data-type="tennis"><span class="nd-react-emoji">&#127934;</span><span class="nd-react-count" id="nrc-tennis">0</span></button>' +
          '<button class="nd-react-btn" data-type="fire"><span class="nd-react-emoji">&#128293;</span><span class="nd-react-count" id="nrc-fire">0</span></button>' +
          '<button class="nd-react-btn" data-type="clap"><span class="nd-react-emoji">&#128079;</span><span class="nd-react-count" id="nrc-clap">0</span></button>' +
        '</div>' +
      '</div>';

      html += '</div>'; // close nd-content
      var detail = document.getElementById('newsDetail');
      detail.innerHTML = html;
      overlay.classList.add('open');
      if (window.KSLT_NEWS_MEDIA) {
        KSLT_NEWS_MEDIA.init(detail, gallery);
        var zoom = detail.querySelector('.nd-hero-zoom');
        if (zoom) zoom.addEventListener('click', function() {
          KSLT_NEWS_MEDIA.open([zoom.dataset.full], 0);
        });
      }

      // Load poll
      if (n.poll && n.poll.question) {
        initNewsPoll(nid, n.poll.options.length);
      }

      // Load reaction counts + user reactions
      loadNewsReactions(nid);
    });
  }

  // --- News Reactions ---
  function loadNewsReactions(newsId) {
    if (!supabaseClient) return;

    // Load counts
    supabaseClient.rpc('get_reaction_counts', { p_news_id: newsId }).then(function(r) {
      if (r.data && r.data.length) {
        var c = r.data[0];
        var el;
        el = document.getElementById('nrc-tennis'); if (el) el.textContent = c.tennis || 0;
        el = document.getElementById('nrc-fire');   if (el) el.textContent = c.fire || 0;
        el = document.getElementById('nrc-clap');   if (el) el.textContent = c.clap || 0;
      }
    });

    // Load user's own reactions (if logged in)
    var auth = window.KSLT_AUTH;
    var user = auth && auth.currentUser;
    if (user) {
      supabaseClient.rpc('get_user_reactions', { p_news_id: newsId, p_user_id: user.id }).then(function(r) {
        if (r.data) {
          r.data.forEach(function(row) {
            var btn = document.querySelector('.nd-react-btn[data-type="' + row.reaction_type + '"]');
            if (btn) {
              btn.classList.add('active');
              if (!btn.querySelector('.nd-react-check')) {
                btn.insertAdjacentHTML('beforeend', '<span class="nd-react-check">&#10003;</span>');
              }
            }
          });
        }
      });
    }

    // Click handler
    var row = document.querySelector('.nd-reactions-row');
    if (!row) return;
    var busy = false;
    row.addEventListener('click', function(e) {
      var btn = e.target.closest('.nd-react-btn');
      if (!btn || busy) return;
      if (btn.classList.contains('active')) return;

      // Auth check
      var currentUser = auth && auth.currentUser;
      if (!currentUser) {
        if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('news.loginToRate'));
        return;
      }

      var type = btn.getAttribute('data-type');
      var countEl = document.getElementById('nrc-' + type);
      var count = parseInt(countEl.textContent) || 0;

      // Optimistic UI
      btn.classList.add('active');
      countEl.textContent = count + 1;
      btn.insertAdjacentHTML('beforeend', '<span class="nd-react-check">&#10003;</span>');
      btn.classList.add('nd-react-bounce');
      setTimeout(function() { btn.classList.remove('nd-react-bounce'); }, 400);

      busy = true;
      supabaseClient.from('news_reactions')
        .insert({ news_id: newsId, user_id: currentUser.id, reaction_type: type })
        .then(function(res) {
          if (res.error) {
            btn.classList.remove('active');
            countEl.textContent = count;
            var chk = btn.querySelector('.nd-react-check');
            if (chk) chk.remove();
          }
          busy = false;
        });
    });
  }

  // --- News Polls ---
  function initNewsPoll(newsId, optionCount) {
    var pollEl = document.getElementById('ndPoll');
    if (!pollEl || !supabaseClient) return;

    var optionBtns = pollEl.querySelectorAll('.nd-poll-option');
    if (!optionBtns.length) return;

    var votes = [];
    for (var i = 0; i < optionCount; i++) votes.push(0);

    // Load existing results
    supabaseClient.rpc('get_poll_results', { p_news_id: newsId }).then(function(r) {
      if (r.data) {
        r.data.forEach(function(row) {
          if (row.option_index >= 0 && row.option_index < optionCount) {
            votes[row.option_index] = row.count || 0;
          }
        });
      }

      // Check if user already voted
      var auth = window.KSLT_AUTH;
      var user = auth && auth.currentUser;
      if (user) {
        supabaseClient.from('news_poll_votes')
          .select('option_index')
          .eq('news_id', newsId)
          .eq('user_id', user.id)
          .maybeSingle()
          .then(function(vr) {
            if (vr.data) {
              showPollResults(pollEl, votes, vr.data.option_index);
            }
          });
      }
    });

    // Click handler
    optionBtns.forEach(function(btn) {
      btn.addEventListener('click', function() {
        var auth = window.KSLT_AUTH;
        var currentUser = auth && auth.currentUser;
        if (!currentUser) {
          if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('news.loginToRate'));
          return;
        }

        var index = parseInt(btn.getAttribute('data-index'));
        votes[index] = (votes[index] || 0) + 1;
        showPollResults(pollEl, votes, index);

        supabaseClient.from('news_poll_votes')
          .insert({ news_id: newsId, user_id: currentUser.id, option_index: index })
          .then(function(res) {
            if (res.error) {
              votes[index]--;
            }
          });
      });
    });
  }

  function showPollResults(pollEl, votes, votedIndex) {
    var optionsEl = pollEl.querySelector('#ndPollOptions');
    var resultsEl = pollEl.querySelector('#ndPollResults');
    if (!optionsEl || !resultsEl) return;

    optionsEl.style.display = 'none';
    resultsEl.style.display = 'block';

    var total = votes.reduce(function(a, b) { return a + b; }, 0);
    var optionBtns = pollEl.querySelectorAll('.nd-poll-option');
    var html = '';
    for (var i = 0; i < votes.length; i++) {
      var pct = total > 0 ? Math.round(votes[i] / total * 100) : 0;
      var label = optionBtns[i] ? optionBtns[i].textContent : '';
      var isVoted = i === votedIndex;
      html += '<div class="nd-poll-result' + (isVoted ? ' voted' : '') + '">' +
        '<div class="nd-poll-result-bar" style="width:' + pct + '%"></div>' +
        '<span class="nd-poll-result-label">' + esc(label) + '</span>' +
        '<span class="nd-poll-result-pct">' + pct + '%</span>' +
      '</div>';
    }
    html += '<div class="nd-poll-total">' + total + ' ' + I18N.t('news.pollTotal') + '</div>';
    resultsEl.innerHTML = html;
  }

  // Battle detail state
  var _battleData = null;
  var _battleVotes = {};
  var _battleUserId = null;
  var _battleMyVote = null;

  function openBattleDetail(bid) {
    var overlay = document.getElementById('battleOverlay');
    if (!overlay) return;

    _battleData = null;
    _battleVotes = {};
    _battleMyVote = null;

    // Check auth
    var AUTH = window.KSLT_AUTH;
    _battleUserId = (AUTH && AUTH.currentUser) ? AUTH.currentUser.id : null;

    Promise.all([
      supabaseClient.rpc('get_battle_public', { p_challenge_id: bid }),
      supabaseClient.rpc('get_battle_votes', { p_challenge_id: bid })
    ]).then(function(results) {
      var bRes = results[0];
      var vRes = results[1];

      if (bRes.error || !bRes.data) {
        document.getElementById('battleDetail').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">' + I18N.t('battles.battle') + ' ' + I18N.t('common.notFound') + '</div>';
        overlay.classList.add('open');
        return;
      }

      _battleData = bRes.data;
      _battleVotes = {};
      if (vRes.data) {
        vRes.data.forEach(function(v) {
          _battleVotes[v.player_id] = parseInt(v.votes) || 0;
        });
      }

      renderBattleOverlay(_battleData, _battleVotes);
      overlay.classList.add('open');

      // Load user's vote if logged in
      if (_battleUserId && !_battleData.voting_closed) {
        loadBattleMyVote(bid);
      }

      // Load H2H
      loadBattleH2H(_battleData);
    });
  }

  function renderBattleOverlay(b, votes) {
    var c1Name = b.challenger_name || I18N.t('home.player') + ' 1';
    var c2Name = b.opponent_name || I18N.t('home.player') + ' 2';
    var c1Photo = b.challenger_photo || '';
    var c2Photo = b.opponent_photo || '';
    var CAT = { 'men-tour': 'Tour', 'men-futures': 'Futures', 'men-challenger': 'Challenger', 'men-masters': 'Masters', 'men-promasters': 'Pro-Masters', 'women-tour': 'Tour Ж', 'women-futures': 'Futures Ж', 'women-challenger': 'Challenger Ж' };

    var html = '';

    // Banner
    if (b.banner_url) {
      html += '<div class="nd-hero-img" style="background-image:url(' + b.banner_url + ')"></div>';
    }

    // Title
    html += '<h2 class="bd-title">' + esc(b.battle_title || c1Name + ' vs ' + c2Name) + '</h2>';

    // VS block with stats
    html += '<div class="bd-vs-block">';
    html += renderBattlePlayer(c1Name, c1Photo, b.challenger_cat, b.challenger_wins, b.challenger_losses, b.challenger_points, CAT);
    html += '<div class="bd-vs">VS</div>';
    html += renderBattlePlayer(c2Name, c2Photo, b.opponent_cat, b.opponent_wins, b.opponent_losses, b.opponent_points, CAT);
    html += '</div>';

    // Meta (date, time, venue)
    var date = b.counter_date || b.proposed_date || '';
    var time = b.counter_time || b.proposed_time || '';
    var venue = b.counter_venue || b.proposed_venue || '';
    if (date || time || venue) {
      html += '<div class="bd-meta">';
      if (date) html += '<span class="bd-meta-item">📅 ' + formatDateShort(date) + '</span>';
      if (time) html += '<span class="bd-meta-item">⏰ ' + esc(time) + '</span>';
      if (venue) html += '<span class="bd-meta-item">📍 ' + esc(venue) + '</span>';
      html += '</div>';
    }

    // Voting
    html += renderBattleVoting(b, votes);

    // H2H placeholder
    html += '<div id="battleH2H"></div>';

    // Score (if completed)
    if (b.status === 'completed' && b.match_id) {
      html += '<div id="battleScore"></div>';
      loadBattleScore(b);
    }

    document.getElementById('battleDetail').innerHTML = html;

    // Attach vote handlers
    if (_battleUserId && !b.voting_closed && b.status !== 'completed' && !_battleMyVote) {
      var btn1 = document.getElementById('bdVoteBtn1');
      var btn2 = document.getElementById('bdVoteBtn2');
      if (btn1) btn1.addEventListener('click', function() { castBattleVote(b.id, b.challenger_player_id); });
      if (btn2) btn2.addEventListener('click', function() { castBattleVote(b.id, b.opponent_player_id); });
    }
  }

  function renderBattlePlayer(name, photo, cat, wins, losses, points, CAT) {
    var html = '<div class="bd-player">';
    html += photo
      ? '<img class="bd-avatar" src="' + photo + '" alt="">'
      : '<div class="bd-avatar-fallback">' + initials(name) + '</div>';
    html += '<div class="bd-player-name">' + esc(name) + '</div>';
    if (cat) html += '<div class="bd-player-cat">' + esc(CAT[cat] || cat) + '</div>';
    html += '<div class="bd-player-stats">';
    html += '<span class="bd-stat-w">П: ' + (wins || 0) + '</span>';
    html += '<span class="bd-stat-l">У: ' + (losses || 0) + '</span>';
    html += '</div>';
    if (points !== undefined && points !== null) {
      html += '<div class="bd-player-rating">Рейтинг: <strong>' + (points || 0) + '</strong></div>';
    }
    html += '</div>';
    return html;
  }

  function renderBattleVoting(b, votes) {
    var c1Id = b.challenger_player_id;
    var c2Id = b.opponent_player_id;
    var v1 = votes[c1Id] || 0;
    var v2 = votes[c2Id] || 0;
    var total = v1 + v2;
    var pct1 = total > 0 ? Math.round(v1 / total * 100) : 50;
    var pct2 = total > 0 ? 100 - pct1 : 50;
    var c1Name = b.challenger_name || I18N.t('home.player') + ' 1';
    var c2Name = b.opponent_name || I18N.t('home.player') + ' 2';
    var closed = b.voting_closed || b.status === 'completed';

    var html = '<div class="bd-voting-section">';
    html += '<h3 class="bd-section-title">Кто победит?</h3>';

    // Bar
    html += '<div class="bd-vote-bar">';
    html += '<div class="bd-bar-left" style="width:' + pct1 + '%">' + (total > 0 ? '<span>' + pct1 + '%</span>' : '') + '</div>';
    html += '<div class="bd-bar-right" style="width:' + pct2 + '%">' + (total > 0 ? '<span>' + pct2 + '%</span>' : '') + '</div>';
    html += '</div>';

    // Buttons
    var canVote = _battleUserId && !closed && !_battleMyVote;
    var btnDisabled = closed || _battleMyVote || !_battleUserId;
    html += '<div class="bd-vote-buttons">';
    html += '<button class="bd-vote-btn' + (_battleMyVote === c1Id ? ' selected' : '') + '" id="bdVoteBtn1"' + (btnDisabled ? ' disabled' : '') + '>';
    html += (_battleMyVote === c1Id ? '✓ ' : '') + esc(c1Name) + ' <small>(' + v1 + ')</small></button>';
    html += '<button class="bd-vote-btn' + (_battleMyVote === c2Id ? ' selected' : '') + '" id="bdVoteBtn2"' + (btnDisabled ? ' disabled' : '') + '>';
    html += (_battleMyVote === c2Id ? '✓ ' : '') + esc(c2Name) + ' <small>(' + v2 + ')</small></button>';
    html += '</div>';

    html += '<div class="bd-vote-total">Всего голосов: ' + total + '</div>';

    if (closed) {
      html += '<div class="bd-vote-closed">Голосование закрыто</div>';
    } else if (!_battleUserId) {
      html += '<div class="bd-vote-login">Войдите, чтобы голосовать</div>';
    }

    html += '</div>';
    return html;
  }

  function loadBattleMyVote(bid) {
    supabaseClient.from('challenge_predictions')
      .select('predicted_winner_id')
      .eq('challenge_id', bid)
      .eq('voter_type', 'site')
      .eq('voter_id', _battleUserId)
      .maybeSingle()
      .then(function(r) {
        if (r.data) {
          _battleMyVote = r.data.predicted_winner_id;
          if (_battleData) renderBattleOverlay(_battleData, _battleVotes);
        }
      });
  }

  function castBattleVote(bid, playerId) {
    if (!_battleUserId || _battleMyVote) return;
    var btn1 = document.getElementById('bdVoteBtn1');
    var btn2 = document.getElementById('bdVoteBtn2');
    if (btn1) btn1.disabled = true;
    if (btn2) btn2.disabled = true;

    supabaseClient.rpc('cast_battle_vote', {
      p_challenge_id: bid,
      p_player_id: playerId
    }).then(function(res) {
      if (res.error) { console.error('Vote:', res.error); return; }
      _battleMyVote = playerId;
      // Refresh votes
      supabaseClient.rpc('get_battle_votes', { p_challenge_id: bid }).then(function(vRes) {
        _battleVotes = {};
        if (vRes.data) {
          vRes.data.forEach(function(v) { _battleVotes[v.player_id] = parseInt(v.votes) || 0; });
        }
        renderBattleOverlay(_battleData, _battleVotes);
        if (window.KSLT_APP) window.KSLT_APP.toast('Голос принят!');
      });
    });
  }

  function loadBattleH2H(b) {
    var p1 = b.challenger_player_id;
    var p2 = b.opponent_player_id;
    supabaseClient.from('matches')
      .select('id, player1_id, player2_id, winner_id, score, created_at, status')
      .eq('status', 'completed')
      .or('and(player1_id.eq.' + p1 + ',player2_id.eq.' + p2 + '),and(player1_id.eq.' + p2 + ',player2_id.eq.' + p1 + ')')
      .order('created_at', { ascending: false })
      .limit(10)
      .then(function(res) {
        var el = document.getElementById('battleH2H');
        if (!el) return;
        var matches = res.data || [];
        var c1Name = b.challenger_name || I18N.t('home.player') + ' 1';
        var c2Name = b.opponent_name || I18N.t('home.player') + ' 2';
        var w1 = 0, w2 = 0;
        matches.forEach(function(m) {
          if (m.winner_id === p1) w1++;
          else if (m.winner_id === p2) w2++;
        });

        var html = '<div class="bd-h2h-section">';
        html += '<h3 class="bd-section-title">Личные встречи</h3>';
        html += '<div class="bd-h2h-summary">';
        html += '<div class="bd-h2h-score"><span class="bd-h2h-num">' + w1 + '</span><span class="bd-h2h-name">' + esc(c1Name) + '</span></div>';
        html += '<span class="bd-h2h-colon">:</span>';
        html += '<div class="bd-h2h-score"><span class="bd-h2h-num">' + w2 + '</span><span class="bd-h2h-name">' + esc(c2Name) + '</span></div>';
        html += '</div>';

        if (matches.length > 0) {
          matches.forEach(function(m) {
            var winName = m.winner_id === p1 ? c1Name : c2Name;
            html += '<div class="bd-h2h-match">';
            html += '<span class="bd-h2h-date">' + formatDateShort(m.created_at) + '</span>';
            html += '<span class="bd-h2h-match-score">' + esc(m.score || '-') + '</span>';
            html += '<span class="bd-h2h-winner">' + esc(winName) + '</span>';
            html += '</div>';
          });
        } else {
          html += '<div class="bd-h2h-empty">Нет предыдущих встреч</div>';
        }
        html += '</div>';
        el.innerHTML = html;
      });
  }

  function loadBattleScore(b) {
    supabaseClient.from('matches')
      .select('id, player1_id, player2_id, winner_id, score')
      .eq('id', b.match_id).single()
      .then(function(res) {
        if (!res.data) return;
        var el = document.getElementById('battleScore');
        if (!el) return;
        var m = res.data;
        var c1Name = b.challenger_name || I18N.t('home.player') + ' 1';
        var c2Name = b.opponent_name || I18N.t('home.player') + ' 2';
        var winnerName = m.winner_id === b.challenger_player_id ? c1Name : c2Name;

        var sets = (m.score || '').split(' ').filter(Boolean);
        var setsHtml = '';
        sets.forEach(function(s) { setsHtml += '<span class="bd-score-set">' + esc(s.replace('/', ':')) + '</span>'; });

        var html = '<div class="bd-score-section">';
        html += '<h3 class="bd-section-title">Результат</h3>';
        html += '<div class="bd-score-display">' + setsHtml + '</div>';
        html += '<div class="bd-winner-badge">Победитель: ' + esc(winnerName) + '</div>';
        html += '</div>';
        el.innerHTML = html;
      });
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return '';
    var d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    return d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear();
  }

  // ============================
  // OVERLAY NAVIGATION
  // ============================
  document.addEventListener('DOMContentLoaded', function() {
    var tdTabs = document.getElementById('tdTabs');
    if (tdTabs) {
      tdTabs.addEventListener('click', function(e) {
        var tab = e.target.closest('.td-tab');
        if (!tab) return;
        var tabId = tab.getAttribute('data-tab');
        tdTabs.querySelectorAll('.td-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        document.querySelectorAll('#tdOverlay .td-tab-content').forEach(function(tc) {
          tc.classList.toggle('active', tc.id === tabId);
        });
      });
    }
    document.getElementById('tdBack').addEventListener('click', function() {
      document.getElementById('tdOverlay').classList.remove('open');
    });
    document.getElementById('liveBack').addEventListener('click', function() {
      document.getElementById('liveFullOverlay').classList.remove('open');
    });
    document.getElementById('newsBack').addEventListener('click', function() {
      document.getElementById('newsOverlay').classList.remove('open');
    });
    document.getElementById('battleBack').addEventListener('click', function() {
      document.getElementById('battleOverlay').classList.remove('open');
    });
    // "Войдите, чтобы голосовать" click → auth
    document.addEventListener('click', function(e) {
      if (e.target.closest('.bd-vote-login')) {
        var AUTH = window.KSLT_AUTH;
        if (AUTH) AUTH.showAuth();
      }
    });
    document.addEventListener('click', function(e) {
      var regBtn = e.target.closest('.td-register-btn');
      if (!regBtn) return;
      var AUTH = window.KSLT_AUTH;
      var action = regBtn.getAttribute('data-action');

      if (action === 'login' || (!AUTH || !AUTH.currentUser)) {
        if (AUTH) AUTH.showAuth();
        if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('td.loginToReg'));
        return;
      }
      if (action === 'membership') {
        if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('td.needMembership'));
        return;
      }

      // Заявку принимает Edge Function tournament-register — она же решает,
      // допущен ли игрок: категория, членство, места, бан. Раньше здесь стояла
      // прямая запись в таблицу, и правила допуска этот экран обходил целиком.
      var tid = regBtn.getAttribute('data-tid');
      if (!tid) return;
      if (!window.KSLT_REG) return;

      regBtn.disabled = true;
      regBtn.textContent = I18N.t('trn.registering');

      window.KSLT_REG.submit(tid).then(function(info) {
        if (!info.created) {
          regBtn.disabled = false;
          regBtn.textContent = I18N.t('td.register');
          return;
        }
        regBtn.outerHTML = '<span class="td-reg-badge">' + info.short + '</span>';
      });
    });
  });

  // ---- Своя заявка на турнир ----
  function checkMyRegistration(t) {
    var AUTH = window.KSLT_AUTH;
    var playerId = AUTH && AUTH.currentProfile && AUTH.currentProfile.player_id;
    if (!playerId || !t || !t.id) return;

    supabaseClient.from('tournament_registrations')
      .select('id, status, draw_position, group_number, block_reason')
      .eq('tournament_id', t.id)
      .eq('player_id', playerId)
      .limit(1)
      .then(function(r) {
        var reg = (r.data || [])[0];
        if (!reg || reg.status === 'withdrawn') return;

        var btn = document.querySelector('#tdInfo .td-register-btn[data-tid]');
        if (!btn) return;

        // Снять можно, пока не проведена жеребьёвка — после неё снимает организатор
        var canWithdraw = ['approved', 'pending', 'waitlist'].indexOf(reg.status) !== -1
          && reg.draw_position == null && reg.group_number == null;

        var refused = reg.status === 'blocked' || reg.status === 'rejected';
        var label = refused ? I18N.t('reg.refused')
          : (reg.status === 'waitlist' ? I18N.t('trn.waitlist') : I18N.t('reg.registered'));
        var html = '<span class="td-reg-badge' + (refused ? ' td-reg-badge-off' : '') + '">' + label + '</span>';
        if (refused && reg.block_reason) {
          html += '<div class="td-reg-reason">' + esc(reg.block_reason) + '</div>';
        }
        if (canWithdraw) {
          html += '<button class="td-withdraw-btn" data-reg="' + reg.id + '" data-tid="' + t.id + '">' +
            I18N.t('reg.withdraw') + '</button>';
        }
        btn.outerHTML = html;
      });
  }

  document.addEventListener('click', function(e) {
    var btn = e.target.closest('.td-withdraw-btn');
    if (!btn) return;

    confirmWithdraw(function() {
      btn.disabled = true;
      supabaseClient.from('tournament_registrations')
        .update({ status: 'withdrawn' })
        .eq('id', btn.getAttribute('data-reg'))
        .then(function(res) {
          if (res.error) {
            btn.disabled = false;
            if (window.KSLT_APP) window.KSLT_APP.toast(res.error.message || I18N.t('reg.withdrawError'));
            return;
          }
          if (window.KSLT_APP) window.KSLT_APP.toast(I18N.t('reg.withdrawDone'));
          btn.outerHTML = '<span class="td-reg-badge td-reg-badge-off">' + I18N.t('reg.withdrawn') + '</span>';
        });
    });
  });

  // Подтверждение в стиле приложения — нативный confirm() блокирует WebView
  function confirmWithdraw(onYes) {
    var ov = document.createElement('div');
    ov.className = 'rc-confirm';
    ov.innerHTML =
      '<div class="rc-confirm-box">' +
        '<div class="rc-confirm-title">' + I18N.t('reg.withdrawAsk') + '</div>' +
        '<div class="rc-confirm-actions">' +
          '<button class="rc-confirm-no">' + I18N.t('reg.withdrawNo') + '</button>' +
          '<button class="rc-confirm-yes">' + I18N.t('reg.withdrawYes') + '</button>' +
        '</div>' +
      '</div>';
    document.body.appendChild(ov);

    function close() { ov.remove(); }
    ov.addEventListener('click', function(e) { if (e.target === ov) close(); });
    ov.querySelector('.rc-confirm-no').addEventListener('click', close);
    ov.querySelector('.rc-confirm-yes').addEventListener('click', function() {
      close();
      onYes();
    });
  }

  // ============================
  // HELPERS
  // ============================
  // Score is a string like "6/3" or "6/3 4/6 7/5"
  function parseScore(s) {
    if (!s || typeof s !== 'string') return [];
    return s.split(' ').map(function(set) {
      var parts = set.split('/');
      return [parseInt(parts[0]) || 0, parseInt(parts[1]) || 0];
    });
  }

  function renderScore(s) {
    var sets = parseScore(s);
    if (!sets.length) return '<span class="live-vs">VS</span>';
    var html = '<div class="live-sets">';
    sets.forEach(function(set) {
      html += '<div class="live-set"><span class="live-set-score">' + set[0] + '</span><div class="live-set-divider"></div><span class="live-set-score">' + set[1] + '</span></div>';
    });
    html += '</div>';
    return html;
  }

  function initials(name) {
    if (!name) return '?';
    return name.split(' ').map(function(p) { return p.charAt(0).toUpperCase(); }).slice(0,2).join('');
  }

  function esc(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function infoRow(l, v) {
    return '<div class="live-full-info-row"><span class="lfi-label">' + esc(l) + '</span><span class="lfi-val">' + esc(v) + '</span></div>';
  }

  // Build full tournament info tab
  function renderTournamentInfo(overlay, t, court) {
    var d = new Date(t.date_start + 'T00:00:00');
    var dateStr = d.getDate() + ' ' + I18N.month(d.getMonth()) + ' ' + d.getFullYear();
    if (t.date_end && t.date_end !== t.date_start) {
      var d2 = new Date(t.date_end + 'T00:00:00');
      dateStr += ' — ' + d2.getDate() + ' ' + I18N.month(d2.getMonth());
    }

    // Hero
    document.getElementById('tdName').textContent = t.title;
    var badges = '';
    if (t.category_id) badges += '<span class="td-badge cat">' + esc(t.category_id) + '</span>';
    var statusMap = { upcoming: I18N.t('tournaments.registration'), live: I18N.t('tournaments.inProgress'), completed: I18N.t('tournaments.finished') };
    if (t.status) badges += '<span class="td-badge status-' + t.status + '">' + (statusMap[t.status] || t.status) + '</span>';
    document.getElementById('tdBadges').innerHTML = badges;
    document.getElementById('tdDetails').textContent = dateStr + (t.location ? ' · ' + t.location : '') + (t.max_participants ? ' · ' + t.max_participants + ' ' + I18N.t('tournaments.players') : '');

    // Format labels
    var formatLabels = { singles: I18N.t('td.format') === 'Format' ? 'Singles' : 'Одиночный', doubles: I18N.t('td.format') === 'Format' ? 'Doubles' : 'Парный', mixed_doubles: I18N.t('td.format') === 'Format' ? 'Mixed Doubles' : 'Микст' };
    var bracketLabels = { single_elimination: 'Single Elimination', round_robin: 'Round Robin', group_league: 'Group League', fic: 'FIC' };

    // Info rows
    var info = '<div class="td-info-section">';
    info += tdInfoRow('📅', I18N.t('td.date'), dateStr + (t.start_time ? ', ' + t.start_time : ''));
    if (t.format) info += tdInfoRow('🎾', I18N.t('td.format'), formatLabels[t.format] || t.format);
    if (t.bracket_type) info += tdInfoRow('📊', I18N.t('td.bracketType'), bracketLabels[t.bracket_type] || t.bracket_type);
    var _isDbl = t.format === 'doubles' || t.format === 'mixed_doubles';
    if (t.max_participants) info += tdInfoRow('👥', _isDbl ? I18N.t('td.pairs') : I18N.t('td.participants'), t.max_participants + ' ' + I18N.t('td.max'));
    if (t.registration_end) {
      var dl = new Date(t.registration_end + 'T00:00:00');
      info += tdInfoRow('⏰', I18N.t('td.regUntil'), dl.getDate() + ' ' + I18N.month(dl.getMonth()) + ' ' + dl.getFullYear());
    }
    if (t.prize_fund && t.prize_fund !== '0') info += tdInfoRow('💰', I18N.t('td.prizeFund'), t.prize_fund + ' ' + I18N.t('td.som'));
    if (t.category_id) info += tdInfoRow('🏷', I18N.t('td.category'), t.category_id);
    info += '</div>';

    // Description
    if (t.description) {
      info += '<div class="mob-section-title" style="margin-top:16px">' + I18N.t('td.description') + '</div>';
      info += '<p class="td-description">' + esc(t.description) + '</p>';
    }

    // Venue — clickable with navigation
    if (court) {
      var courtName = court.name || '';
      var addressParts = [];
      if (court.street) addressParts.push(court.street);
      if (court.building) addressParts.push(court.building);
      if (court.city) addressParts.push(court.city);
      var address = addressParts.join(', ');

      info += '<div class="mob-section-title" style="margin-top:16px">' + I18N.t('td.venue') + '</div>';
      info += '<div class="td-venue-card" id="tdVenueCard">';
      if (court.photo) info += '<img src="' + esc(court.photo) + '" style="width:100%;height:120px;object-fit:cover;border-radius:var(--radius-sm);margin-bottom:8px" alt="">';
      info += '<div style="font-weight:600;color:var(--text);margin-bottom:4px">' + esc(courtName) + '</div>';
      if (address) info += '<div style="font-size:12px;color:var(--text-muted);margin-bottom:8px">📍 ' + esc(address) + '</div>';

      // Navigation buttons
      var hasNav = court.google_maps_url || court.twogis_url;
      if (hasNav) {
        info += '<div style="display:flex;gap:8px">';
        if (court.twogis_url) {
          info += '<button class="btn-accent td-nav-btn" data-nav-url="' + esc(court.twogis_url) + '" style="flex:1;padding:8px;font-size:12px;border-radius:var(--radius-sm)">2GIS</button>';
        }
        if (court.google_maps_url) {
          info += '<button class="btn-accent td-nav-btn" data-nav-url="' + esc(court.google_maps_url) + '" style="flex:1;padding:8px;font-size:12px;border-radius:var(--radius-sm);background:transparent;border:1px solid var(--accent);color:var(--accent)">Google Maps</button>';
        }
        info += '</div>';
      }
      info += '</div>';
    } else if (t.location) {
      info += tdInfoRow('📍', I18N.t('td.location'), t.location);
    }

    // Registration CTA
    if (t.status === 'upcoming') {
      var AUTH2 = window.KSLT_AUTH;
      var isGuest2 = !(AUTH2 && AUTH2.currentUser);
      var isMember2 = AUTH2 && AUTH2._membershipStatus;
      if (isGuest2) {
        info += '<div class="td-access-cta"><p>' + I18N.t('td.loginToReg') + '</p><button class="btn-accent td-register-btn" data-action="login">' + I18N.t('common.login') + '</button></div>';
      } else if (!isMember2) {
        info += '<div class="td-access-cta"><p>' + I18N.t('td.needMembership') + '</p><button class="btn-accent td-register-btn" data-action="membership">' + I18N.t('td.getMembership') + '</button></div>';
      } else {
        info += '<button class="btn-accent td-register-btn" data-tid="' + t.id + '">' + I18N.t('td.register') + '</button>';
      }
    }

    // Countdown
    if (t.status === 'upcoming' || !t.status) {
      var now = new Date();
      var start = new Date(t.date_start + (t.start_time ? 'T' + t.start_time : ''));
      var diff = start - now;
      if (diff > 0) {
        var days = Math.floor(diff / 86400000);
        var hours = Math.floor((diff % 86400000) / 3600000);
        info += '<div class="td-countdown" style="text-align:center;padding:12px;margin:12px 0;background:var(--accent-dim);border-radius:var(--radius-md);color:var(--accent);font-weight:600">';
        if (days > 0) info += days + ' ' + I18N.t('tournaments.daysLeft') + ' ';
        info += hours + ' ' + I18N.t('tournaments.hoursLeft');
        info += '</div>';
      }
    }

    // Participants
    info += '<div id="tdParticipants"></div>';

    document.getElementById('tdInfo').innerHTML = info;

    // Уже записан? Меняем «Записаться» на статус и кнопку снятия
    checkMyRegistration(t);

    // Bind nav buttons — open external app
    document.querySelectorAll('.td-nav-btn').forEach(function(btn) {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        var url = this.getAttribute('data-nav-url');
        if (url) window.open(url, '_system');
      });
    });

    overlay.querySelectorAll('.td-tab').forEach(function(tab, i) { tab.classList.toggle('active', i === 0); });
    overlay.querySelectorAll('.td-tab-content').forEach(function(tc, i) { tc.classList.toggle('active', i === 0); });
    overlay.classList.add('open');
  }

  function tdInfoRow(icon, l, v) {
    return '<div class="td-info-row"><span class="td-info-icon">' + icon + '</span><div class="td-info-text"><div class="td-info-label">' + esc(l) + '</div><div class="td-info-value">' + esc(v) + '</div></div></div>';
  }

  function roundName(n) {
    return {1:I18N.t('round.final'),2:I18N.t('round.semi'),4:I18N.t('round.quarter'),8:I18N.t('round.r16')}[n] || I18N.t('round.round')+' '+n;
  }

})();
