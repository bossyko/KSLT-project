// ============================================
// KSLT Mobile — Home Screen
// ============================================
(function() {
  'use strict';

  var HOME = window.KSLT_HOME = {};
  var months = ['янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
  var MONTHS = ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

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
          var html = '<div class="section-title"><h2>Live</h2><span class="see-all" data-nav="screenLive">Смотреть</span></div>';
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
    var p1 = m.player1 ? m.player1.name : 'Игрок 1';
    var p2 = m.player2 ? m.player2.name : 'Игрок 2';
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
      if (window.KSLT_APP) window.KSLT_APP.toast('Войдите, чтобы смотреть трансляцию');
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
        var p1 = m.player1 ? m.player1.name : 'Игрок 1';
        var p2 = m.player2 ? m.player2.name : 'Игрок 2';
        var sets = parseScore(m.score);

        var sbHtml = '<div class="live-full-sb-header"><span class="sb-dot"></span><span class="sb-label">LIVE</span></div>';
        sbHtml += sbRow(p1, sets, 0, true);
        sbHtml += sbRow(p2, sets, 1, false);
        document.getElementById('liveScoreboard').innerHTML = sbHtml;

        document.getElementById('liveVideo').textContent = 'Нет трансляции';

        var rows = '';
        if (m.tournament) rows += infoRow('Турнир', m.tournament.title);
        if (m.round_number) rows += infoRow('Раунд', roundName(m.round_number));
        if (m.court) rows += infoRow('Корт', m.court);
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
        var html = '<div class="section-title"><h2>Баттлы</h2><span class="see-all" data-nav="screenBattles">Все</span></div>';
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
    var chName = b.challenger ? b.challenger.name : 'Игрок 1';
    var opName = b.opponent ? b.opponent.name : 'Игрок 2';
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
        '<span class="tcv-badge">Баттл</span>' +
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
        var html = '<div class="section-title"><h2>Ближайшие турниры</h2><span class="see-all" data-nav="screenTournaments">Все</span></div>';
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
          '<span class="tcv-date-month">' + MONTHS[d.getMonth()] + '</span>' +
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
    var overlay = document.getElementById('tdOverlay');
    if (!overlay) return;
    supabaseClient.from('tournaments').select('*').eq('id', tid).single().then(function(r) {
      if (!r.data) return;
      var t = r.data;
      var d = new Date(t.date_start);
      var dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();

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
        info += tdInfoRow('⏰', 'Регистрация до', dl.getDate() + ' ' + months[dl.getMonth()] + ' ' + dl.getFullYear());
      }
      if (t.prize_fund && t.prize_fund !== '0') info += tdInfoRow('💰', 'Призовой фонд', t.prize_fund + ' сом');
      info += '</div>';
      if (t.description) info += '<p class="td-description">' + esc(t.description) + '</p>';
      if (t.status === 'upcoming') {
        var AUTH2 = window.KSLT_AUTH;
        var isGuest2 = !(AUTH2 && AUTH2.currentUser);
        var isMember2 = AUTH2 && AUTH2._membershipStatus;
        if (isGuest2) {
          info += '<div class="td-access-cta"><p>Войдите, чтобы записаться на турнир</p><button class="btn-accent td-register-btn" data-action="login">Войти</button></div>';
        } else if (!isMember2) {
          info += '<div class="td-access-cta"><p>Для участия нужно членство KSLT</p><button class="btn-accent td-register-btn" data-action="membership">Оформить членство</button></div>';
        } else {
          info += '<button class="btn-accent td-register-btn" data-tid="' + t.id + '">Записаться на турнир</button>';
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
          if (days > 0) info += days + ' дн. ';
          info += hours + ' ч. до начала';
          info += '</div>';
        }
      }

      // Participants section
      info += '<div id="tdParticipants"></div>';

      document.getElementById('tdInfo').innerHTML = info;

      overlay.querySelectorAll('.td-tab').forEach(function(tab, i) { tab.classList.toggle('active', i === 0); });
      overlay.querySelectorAll('.td-tab-content').forEach(function(tc, i) { tc.classList.toggle('active', i === 0); });
      overlay.classList.add('open');

      // Load bracket, results, and participants
      loadBracket(t.id);
      loadResults(t.id);
      loadParticipants(t.id);
    });
  }

  // ============================
  // BRACKET TAB
  // ============================
  function loadBracket(tournamentId) {
    var container = document.getElementById('tdBracket');
    if (!container) return;
    container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('matches')
      .select('*, player1:players!matches_player1_id_fkey(id, name, photo), player2:players!matches_player2_id_fkey(id, name, photo)')
      .eq('tournament_id', tournamentId)
      .order('round_number', { ascending: false })
      .order('match_order', { ascending: true })
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small" style="padding:40px 16px">Сетка пока не сформирована</div>';
          return;
        }
        renderBracket(container, r.data);
      });
  }

  function renderBracket(container, matches) {
    // Group by rounds
    var rounds = {};
    matches.forEach(function(m) {
      var rn = m.round_number || 1;
      if (!rounds[rn]) rounds[rn] = [];
      rounds[rn].push(m);
    });

    var roundNums = Object.keys(rounds).map(Number).sort(function(a, b) { return b - a; });

    var html = '<div class="bracket-container">';
    roundNums.forEach(function(rn) {
      var roundLabel = roundName(rn);
      html += '<div class="bracket-round">';
      html += '<div class="bracket-round-title">' + roundLabel + '</div>';

      rounds[rn].forEach(function(m) {
        var p1Name = m.player1 ? m.player1.name : (m.seed1 ? 'Seed ' + m.seed1 : 'TBD');
        var p2Name = m.player2 ? m.player2.name : (m.seed2 ? 'Seed ' + m.seed2 : 'TBD');
        var score = m.score ? m.score.replace(/(\d+)\/(\d+)/g, '$1:$2') : '';
        var isCompleted = !!m.winner_id;
        var p1Win = m.winner_id && m.player1 && m.winner_id === m.player1.id;
        var p2Win = m.winner_id && m.player2 && m.winner_id === m.player2.id;

        html += '<div class="bracket-match">';
        html += '<div class="bracket-player' + (p1Win ? ' winner' : '') + '">';
        html += '<span class="bracket-pname">' + esc(p1Name) + '</span>';
        html += '</div>';
        html += '<div class="bracket-player' + (p2Win ? ' winner' : '') + '">';
        html += '<span class="bracket-pname">' + esc(p2Name) + '</span>';
        html += '</div>';
        if (score) html += '<div class="bracket-score">' + score + '</div>';
        html += '</div>';
      });

      html += '</div>';
    });
    html += '</div>';

    container.innerHTML = '<div style="padding:16px;overflow-x:auto">' + html + '</div>';
  }

  // ============================
  // RESULTS TAB
  // ============================
  function loadResults(tournamentId) {
    var container = document.getElementById('tdResults');
    if (!container) return;
    container.innerHTML = '<div class="loading-center"><div class="spinner"></div></div>';

    supabaseClient.from('tournament_registrations')
      .select('*, player:players!tournament_registrations_player_id_fkey(id, name, points)')
      .eq('tournament_id', tournamentId)
      .eq('status', 'draw')
      .then(function(r) {
        if (r.error || !r.data || r.data.length === 0) {
          container.innerHTML = '<div class="pd-empty-small" style="padding:40px 16px">Результаты пока недоступны</div>';
          return;
        }

        // Sort by points_earned desc (if available), otherwise by player points
        var regs = r.data.sort(function(a, b) {
          return (b.points_earned || 0) - (a.points_earned || 0);
        });

        var html = '<div style="padding:16px"><div class="pd-matches-list">';
        regs.forEach(function(reg, i) {
          var pName = reg.player ? reg.player.name : 'Игрок';
          html += '<div class="pd-match" style="cursor:default">';
          html += '<div class="pd-match-date" style="font-weight:700;color:var(--text)">#' + (i + 1) + '</div>';
          html += '<div class="pd-match-info"><div class="pd-match-opp">' + esc(pName) + '</div></div>';
          if (reg.points_earned) html += '<div class="pd-match-score" style="color:var(--accent)">+' + reg.points_earned + ' очк.</div>';
          html += '</div>';
        });
        html += '</div></div>';
        container.innerHTML = html;
      });
  }

  // ============================
  // PARTICIPANTS
  // ============================
  function loadParticipants(tournamentId) {
    var container = document.getElementById('tdParticipants');
    if (!container) return;

    supabaseClient.from('tournament_registrations')
      .select('*, player:players!tournament_registrations_player_id_fkey(id, name, photo, category_id)')
      .eq('tournament_id', tournamentId)
      .in('status', ['approved', 'draw', 'pending'])
      .order('created_at', { ascending: true })
      .then(function(r) {
        if (!r.data || r.data.length === 0) return;

        var html = '<div style="margin-top:16px"><div class="pd-section-title" style="font-size:14px;font-weight:600;margin-bottom:8px">Участники (' + r.data.length + ')</div>';
        html += '<div style="display:flex;flex-wrap:wrap;gap:8px">';
        r.data.forEach(function(reg) {
          var pName = reg.player ? reg.player.name : 'Игрок';
          var photo = reg.player ? reg.player.photo : '';
          html += '<div style="display:flex;align-items:center;gap:6px;background:var(--glass);border:1px solid var(--border);border-radius:20px;padding:4px 10px 4px 4px;font-size:12px">';
          html += photo
            ? '<img src="' + esc(photo) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover" alt="">'
            : '<div style="width:24px;height:24px;border-radius:50%;background:var(--accent-dim);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:600">' + initials(pName) + '</div>';
          html += '<span style="color:var(--text-sec)">' + esc(pName) + '</span>';
          if (reg.status === 'pending') html += '<span style="color:var(--orange);font-size:10px">⏳</span>';
          html += '</div>';
        });
        html += '</div></div>';
        container.innerHTML = html;
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
        var html = '<div class="section-title"><h2>Новости</h2><span class="see-all" data-nav="screenNews">Все</span></div>';
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
    var dateStr = d.getDate() + ' ' + months[d.getMonth()];
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
        '<div class="tcv-name">' + esc(n.title) + '</div>' +
        '<div class="tcv-meta"><span>' + dateStr + '</span></div>' +
      '</div>' +
    '</div>';
  }

  function openNewsDetail(nid) {
    var overlay = document.getElementById('newsOverlay');
    if (!overlay) return;
    supabaseClient.from('news').select('*').eq('id', nid).single().then(function(r) {
      if (!r.data) return;
      var n = r.data;
      var d = new Date(n.created_at);
      var dateStr = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
      var html = '';
      if (n.image) html += '<div class="nd-hero-img" style="background-image:url(' + n.image + ')"></div>';
      html += '<div class="nd-content">';
      html += '<div class="nd-tag">' + esc(n.category || 'Новости') + '</div>';
      html += '<h1 class="nd-title">' + esc(n.title) + '</h1>';
      html += '<div class="nd-date">' + dateStr + '</div>';
      // Render content blocks if JSON array, otherwise raw HTML
      var contentHtml = '';
      if (n.content) {
        try {
          var blocks = JSON.parse(n.content);
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
            contentHtml = n.content;
          }
        } catch(e) {
          contentHtml = n.content;
        }
      }
      html += '<div class="nd-body">' + contentHtml + '</div></div>';
      document.getElementById('newsDetail').innerHTML = html;
      overlay.classList.add('open');
    });
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
        document.getElementById('battleDetail').innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Баттл не найден</div>';
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
    var c1Name = b.challenger_name || 'Игрок 1';
    var c2Name = b.opponent_name || 'Игрок 2';
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
    var c1Name = b.challenger_name || 'Игрок 1';
    var c2Name = b.opponent_name || 'Игрок 2';
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
        var c1Name = b.challenger_name || 'Игрок 1';
        var c2Name = b.opponent_name || 'Игрок 2';
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
        var c1Name = b.challenger_name || 'Игрок 1';
        var c2Name = b.opponent_name || 'Игрок 2';
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
    return d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
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
        if (window.KSLT_APP) window.KSLT_APP.toast('Войдите, чтобы записаться');
        return;
      }
      if (action === 'membership') {
        if (window.KSLT_APP) window.KSLT_APP.toast('Оформите членство для участия');
        return;
      }

      // Real registration
      var tid = regBtn.getAttribute('data-tid');
      if (!tid) return;
      var playerId = AUTH.currentProfile && AUTH.currentProfile.player_id;
      if (!playerId) {
        if (window.KSLT_APP) window.KSLT_APP.toast('Привяжите профиль игрока');
        return;
      }
      regBtn.disabled = true;
      regBtn.textContent = 'Отправка...';

      // Check if already registered
      supabaseClient.from('tournament_registrations')
        .select('id')
        .eq('tournament_id', tid)
        .eq('player_id', playerId)
        .limit(1)
        .then(function(chk) {
          if (chk.data && chk.data.length > 0) {
            regBtn.outerHTML = '<span style="padding:8px 16px;border-radius:8px;background:var(--accent-dim);color:var(--accent);font-weight:500;display:inline-block">Вы уже записаны</span>';
            return;
          }
          supabaseClient.from('tournament_registrations').insert({
            tournament_id: tid,
            player_id: playerId,
            status: 'pending'
          }).then(function(res) {
            if (res.error) {
              if (window.KSLT_APP) window.KSLT_APP.toast('Ошибка: ' + (res.error.message || ''));
              regBtn.disabled = false;
              regBtn.textContent = 'Записаться на турнир';
            } else {
              regBtn.outerHTML = '<span style="padding:8px 16px;border-radius:8px;background:var(--accent-dim);color:var(--accent);font-weight:500;display:inline-block">Заявка отправлена!</span>';
            }
          });
        });
    });
  });

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

  function tdInfoRow(icon, l, v) {
    return '<div class="td-info-row"><span class="td-info-icon">' + icon + '</span><div class="td-info-text"><div class="td-info-label">' + esc(l) + '</div><div class="td-info-value">' + esc(v) + '</div></div></div>';
  }

  function roundName(n) {
    return {1:'Финал',2:'Полуфинал',4:'Четвертьфинал',8:'1/8 финала'}[n] || 'Раунд '+n;
  }

})();
