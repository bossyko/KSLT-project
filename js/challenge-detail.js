/**
 * Challenge Battle Detail Page (IIFE)
 * Public page: VS layout, voting, H2H, score
 */
(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn ? {
        loading: 'Loading...',
        notFound: 'Battle not found',
        notFoundDesc: 'This battle does not exist or has not been published yet.',
        back: 'Back',
        vs: 'VS',
        wins: 'W',
        losses: 'L',
        rating: 'Rating',
        whoWins: 'Who will win?',
        vote: 'Vote',
        votes: 'votes',
        totalVotes: 'Total votes',
        votingClosed: 'Voting closed',
        votingUntil: 'Voting open until',
        loginToVote: 'Log in to vote',
        yourVote: 'Your vote',
        voteChanged: 'Vote changed!',
        voteAccepted: 'Vote accepted!',
        alreadyVotedTg: 'You already voted via Telegram!',
        details: 'Details',
        date: 'Date',
        time: 'Time',
        venue: 'Venue',
        h2h: 'Head-to-Head',
        noH2H: 'No previous meetings',
        h2hRecord: 'H2H Record',
        result: 'Result',
        winner: 'Winner',
        predictionResult: 'of viewers predicted correctly',
        score: 'Score',
        set: 'Set'
    } : isKg ? {
        loading: 'Жүктөлүүдө...',
        notFound: 'Баттл табылган жок',
        notFoundDesc: 'Бул баттл жок же азырынча жарыяланган эмес.',
        back: 'Артка',
        vs: 'VS',
        wins: 'Ж',
        losses: 'У',
        rating: 'Рейтинг',
        whoWins: 'Ким жеңет?',
        vote: 'Добуш',
        votes: 'добуш',
        totalVotes: 'Жалпы добуштар',
        votingClosed: 'Добуш берүү жабылды',
        votingUntil: 'Добуш берүү ачык',
        loginToVote: 'Добуш берүү үчүн кириңиз',
        yourVote: 'Сиздин добушуңуз',
        voteChanged: 'Добуш өзгөртүлдү!',
        voteAccepted: 'Добуш кабыл алынды!',
        alreadyVotedTg: 'Сиз Телеграмда добуш бергенсиз!',
        details: 'Маалымат',
        date: 'Күнү',
        time: 'Убактысы',
        venue: 'Орду',
        h2h: 'Жолугушуу тарыхы',
        noH2H: 'Мурунку жолугушуулар жок',
        h2hRecord: 'H2H жазуусу',
        result: 'Натыйжа',
        winner: 'Жеңүүчү',
        predictionResult: 'көрүүчүлөр туура болжоду',
        score: 'Эсеп',
        set: 'Сет'
    } : {
        loading: 'Загрузка...',
        notFound: 'Баттл не найден',
        notFoundDesc: 'Этот баттл не существует или ещё не опубликован.',
        back: 'Назад',
        vs: 'VS',
        wins: 'П',
        losses: 'Пр',
        rating: 'Рейтинг',
        whoWins: 'Кто победит?',
        vote: 'Голос',
        votes: 'гол.',
        totalVotes: 'Всего голосов',
        votingClosed: 'Голосование закрыто',
        votingUntil: 'Голосование открыто до',
        loginToVote: 'Войдите, чтобы голосовать',
        yourVote: 'Ваш голос',
        voteChanged: 'Голос изменён!',
        voteAccepted: 'Голос принят!',
        alreadyVotedTg: 'Вы уже голосовали в Telegram!',
        details: 'Подробности',
        date: 'Дата',
        time: 'Время',
        venue: 'Площадка',
        h2h: 'История встреч',
        noH2H: 'Нет предыдущих встреч',
        h2hRecord: 'Счёт H2H',
        result: 'Результат',
        winner: 'Победитель',
        predictionResult: 'зрителей угадали правильно',
        score: 'Счёт',
        set: 'Сет'
    };

    var CAT_LABELS = {
        'men-tour': 'Tour', 'men-futures': 'Futures', 'men-challenger': 'Challenger',
        'men-masters': 'Masters', 'men-promasters': 'Pro-Masters',
        'women-tour': 'Tour', 'women-futures': 'Futures', 'women-challenger': 'Challenger',
        'women-masters': 'Masters', 'women-promasters': 'Pro-Masters'
    };

    var _userId = null;
    var _battle = null;
    var _votes = null;
    var _challengeId = null;

    document.addEventListener('DOMContentLoaded', function() {
        renderBreadcrumb();

        var id = new URLSearchParams(window.location.search).get('id');
        if (!id) { renderNotFound(); return; }
        _challengeId = id;

        var client = window.supabaseClient;
        if (!client) { renderNotFound(); return; }

        loadBattle(client, id);
    });

    function renderBreadcrumb() {
        var el = document.getElementById('challengeBreadcrumb');
        if (!el) return;

        // Detect where user came from
        var ref = document.referrer || '';
        var fromHome = ref.indexOf('index') !== -1 || ref.match(/\/[^\/]*\/?$/);
        var fromTournaments = ref.indexOf('tournaments-overview') !== -1;

        var suffix = isEn ? '-en' : (isKg ? '-kg' : '');

        var homeLabel = isEn ? 'Home' : (isKg ? 'Башкы бет' : 'Главная');
        var tourLabel = isEn ? 'Tournaments' : (isKg ? 'Турнирлер' : 'Турниры');
        var battleLabel = isEn ? 'Battles' : (isKg ? 'Баттлдар' : 'Баттлы');

        var html = '';

        if (fromTournaments) {
            html += '<a href="tournaments-overview' + suffix + '.html" class="kslt-back">\u2190 ' + tourLabel + '</a>';
            html += '<span class="kslt-back-sep">/</span>';
            html += '<span class="kslt-back" style="color:var(--text-muted);cursor:default;">' + battleLabel + '</span>';
        } else {
            var homeHref = isEn ? '../index-en.html' : (isKg ? '../index-kg.html' : '../index.html');
            html += '<a href="' + homeHref + '" class="kslt-back">\u2190 ' + homeLabel + '</a>';
            html += '<span class="kslt-back-sep">/</span>';
            html += '<span class="kslt-back" style="color:var(--text-muted);cursor:default;">' + battleLabel + '</span>';
        }

        el.innerHTML = html;
    }

    /* ========== LOAD ========== */
    function loadBattle(client, id) {
        // Check auth in parallel
        client.auth.getUser().then(function(res) {
            if (res.data && res.data.user) _userId = res.data.user.id;
        });

        Promise.all([
            client.rpc('get_battle_public', { p_challenge_id: id }),
            client.rpc('get_battle_votes', { p_challenge_id: id })
        ]).then(function(results) {
            var battleRes = results[0];
            var votesRes = results[1];

            if (battleRes.error || !battleRes.data) {
                renderNotFound();
                return;
            }

            _battle = battleRes.data;
            _votes = {};
            if (votesRes.data) {
                votesRes.data.forEach(function(v) {
                    _votes[v.player_id] = parseInt(v.votes) || 0;
                });
            }

            renderHero(_battle);
            renderVoting(_battle, _votes);
            renderDetails(_battle);
            loadH2H(client, _battle);
            loadScore(client, _battle);
        }).catch(function() {
            renderNotFound();
        });
    }

    /* ========== NOT FOUND ========== */
    function renderNotFound() {
        var hero = document.getElementById('challengeHero');
        if (hero) {
            hero.innerHTML = '<div class="ch-not-found">' +
                '<h2>' + L.notFound + '</h2>' +
                '<p>' + L.notFoundDesc + '</p>' +
                '</div>';
        }
    }

    /* ========== HERO ========== */
    function renderHero(b) {
        var hero = document.getElementById('challengeHero');
        if (!hero) return;

        var c1Name = isEn ? (b.challenger_name_en || b.challenger_name) : (isKg ? (b.challenger_name_kg || b.challenger_name) : b.challenger_name);
        var c2Name = isEn ? (b.opponent_name_en || b.opponent_name) : (isKg ? (b.opponent_name_kg || b.opponent_name) : b.opponent_name);
        var c1Photo = b.challenger_photo || 'https://placehold.co/120x160/1a1a1a/666?text=?';
        var c2Photo = b.opponent_photo || 'https://placehold.co/120x160/1a1a1a/666?text=?';
        var c1Cat = CAT_LABELS[b.challenger_cat] || b.challenger_cat || '';
        var c2Cat = CAT_LABELS[b.opponent_cat] || b.opponent_cat || '';

        // Date/time/venue — use counter values if available, else proposed
        var date = b.counter_date || b.proposed_date || '';
        var time = b.counter_time || b.proposed_time || '';
        var venue = b.counter_venue || b.proposed_venue || '';

        var formattedDate = date ? formatDate(date) : '';

        hero.innerHTML =
            '<div class="ch-hero-inner">' +
                '<h1 class="ch-battle-title">' + esc(b.battle_title || 'Battle') + '</h1>' +
                (b.banner_url ? '<div class="ch-banner"><img src="' + esc(b.banner_url) + '" alt="' + esc(b.battle_title || 'Battle') + '"></div>' : '') +
                '<div class="ch-vs-container">' +
                    '<div class="ch-player-card">' +
                        '<img class="ch-player-photo" src="' + esc(c1Photo) + '" alt="' + esc(c1Name) + '">' +
                        '<div class="ch-player-name">' + esc(c1Name) + '</div>' +
                        '<div class="ch-player-cat">' + esc(c1Cat) + '</div>' +
                        '<div class="ch-player-stats">' +
                            '<span class="ch-stat-w">' + L.wins + ': ' + (b.challenger_wins || 0) + '</span>' +
                            '<span class="ch-stat-l">' + L.losses + ': ' + (b.challenger_losses || 0) + '</span>' +
                        '</div>' +
                        '<div class="ch-player-rating">' + L.rating + ': <strong>' + (b.challenger_points || 0) + '</strong></div>' +
                    '</div>' +
                    '<div class="ch-vs-divider">' +
                        '<span class="ch-vs-text">' + L.vs + '</span>' +
                    '</div>' +
                    '<div class="ch-player-card">' +
                        '<img class="ch-player-photo" src="' + esc(c2Photo) + '" alt="' + esc(c2Name) + '">' +
                        '<div class="ch-player-name">' + esc(c2Name) + '</div>' +
                        '<div class="ch-player-cat">' + esc(c2Cat) + '</div>' +
                        '<div class="ch-player-stats">' +
                            '<span class="ch-stat-w">' + L.wins + ': ' + (b.opponent_wins || 0) + '</span>' +
                            '<span class="ch-stat-l">' + L.losses + ': ' + (b.opponent_losses || 0) + '</span>' +
                        '</div>' +
                        '<div class="ch-player-rating">' + L.rating + ': <strong>' + (b.opponent_points || 0) + '</strong></div>' +
                    '</div>' +
                '</div>' +
                '<div class="ch-meta">' +
                    (formattedDate ? '<span class="ch-meta-item">📅 ' + formattedDate + '</span>' : '') +
                    (time ? '<span class="ch-meta-item">⏰ ' + esc(time) + '</span>' : '') +
                    (venue ? '<span class="ch-meta-item">📍 ' + esc(venue) + '</span>' : '') +
                '</div>' +
            '</div>';
    }

    /* ========== VOTING ========== */
    function renderVoting(b, votes) {
        var section = document.getElementById('challengeVoting');
        if (!section) return;
        section.style.display = '';

        var c1Id = b.challenger_player_id;
        var c2Id = b.opponent_player_id;
        var v1 = votes[c1Id] || 0;
        var v2 = votes[c2Id] || 0;
        var total = v1 + v2;
        var pct1 = total > 0 ? Math.round(v1 / total * 100) : 50;
        var pct2 = total > 0 ? 100 - pct1 : 50;

        var c1Name = isEn ? (b.challenger_name_en || b.challenger_name) : (isKg ? (b.challenger_name_kg || b.challenger_name) : b.challenger_name);
        var c2Name = isEn ? (b.opponent_name_en || b.opponent_name) : (isKg ? (b.opponent_name_kg || b.opponent_name) : b.opponent_name);

        // Auto-close voting when match time arrives (Asia/Bishkek = UTC+6)
        var matchDate = b.counter_date || b.proposed_date || '';
        var matchTime = b.counter_time || b.proposed_time || '';
        var timeExpired = false;
        if (matchDate && matchTime) {
            var matchDt = new Date(matchDate + 'T' + matchTime + ':00+06:00');
            if (!isNaN(matchDt.getTime()) && Date.now() >= matchDt.getTime()) {
                timeExpired = true;
            }
        }
        var closed = b.voting_closed || b.status === 'completed' || timeExpired;
        var canVote = _userId && !closed;

        // Check if user already voted
        var myVoteHtml = '';
        if (_userId && !closed) {
            // We'll load user's vote async
            loadMyVote();
        }

        section.innerHTML =
            '<div class="ch-voting-inner">' +
                '<h2 class="ch-voting-title">' + L.whoWins + '</h2>' +
                '<div class="ch-voting-bar">' +
                    '<div class="ch-bar-left" style="width:' + pct1 + '%">' +
                        (total > 0 ? '<span>' + pct1 + '%</span>' : '') +
                    '</div>' +
                    '<div class="ch-bar-right" style="width:' + pct2 + '%">' +
                        (total > 0 ? '<span>' + pct2 + '%</span>' : '') +
                    '</div>' +
                '</div>' +
                '<div class="ch-vote-buttons" id="voteButtons">' +
                    '<button class="ch-vote-btn' + (closed ? ' disabled' : '') + '" id="voteBtn1" data-player="' + c1Id + '"' + (closed ? ' disabled' : '') + '>' +
                        '<span class="ch-vote-dot-red">●</span> ' + esc(c1Name) + ' <small>(' + v1 + ' ' + L.votes + ')</small>' +
                    '</button>' +
                    '<button class="ch-vote-btn' + (closed ? ' disabled' : '') + '" id="voteBtn2" data-player="' + c2Id + '"' + (closed ? ' disabled' : '') + '>' +
                        '<span class="ch-vote-dot-blue">●</span> ' + esc(c2Name) + ' <small>(' + v2 + ' ' + L.votes + ')</small>' +
                    '</button>' +
                '</div>' +
                '<div class="ch-voting-total">' + L.totalVotes + ': ' + total + '</div>' +
                (closed
                    ? '<div class="ch-voting-closed-badge">' + L.votingClosed + '</div>'
                    : (matchDate && matchTime
                        ? '<div class="ch-voting-until">' + L.votingUntil + ' ' + matchDate + ' ' + matchTime + '</div>'
                        : '')) +
                (!_userId && !closed ? '<div class="ch-voting-login"><a href="' + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html')) + '">' + L.loginToVote + '</a></div>' : '') +
                '<div id="voteStatus"></div>' +
            '</div>';

        if (canVote) {
            var btn1 = document.getElementById('voteBtn1');
            var btn2 = document.getElementById('voteBtn2');
            if (btn1) btn1.addEventListener('click', function() { castVote(c1Id); });
            if (btn2) btn2.addEventListener('click', function() { castVote(c2Id); });
        }
    }

    function loadMyVote() {
        if (!_userId || !_challengeId) return;
        var client = window.supabaseClient;
        if (!client) return;

        client.from('challenge_predictions')
            .select('predicted_winner_id')
            .eq('challenge_id', _challengeId)
            .eq('voter_type', 'site')
            .eq('voter_id', _userId)
            .maybeSingle()
            .then(function(res) {
                if (res.data) {
                    highlightVote(res.data.predicted_winner_id);
                }
            });
    }

    function highlightVote(playerId) {
        var btn1 = document.getElementById('voteBtn1');
        var btn2 = document.getElementById('voteBtn2');
        if (btn1) btn1.classList.toggle('selected', btn1.dataset.player === playerId);
        if (btn2) btn2.classList.toggle('selected', btn2.dataset.player === playerId);
    }

    function castVote(playerId) {
        if (!_userId || !_challengeId) return;
        var client = window.supabaseClient;
        if (!client) return;

        var btn1 = document.getElementById('voteBtn1');
        var btn2 = document.getElementById('voteBtn2');
        if (btn1) btn1.disabled = true;
        if (btn2) btn2.disabled = true;

        // Use RPC for one-time voting (no change allowed)
        client.rpc('cast_battle_vote', {
            p_challenge_id: _challengeId,
            p_player_id: playerId
        }).then(function(res) {
            if (res.error) {
                console.error('Vote error:', res.error);
                if (btn1) btn1.disabled = false;
                if (btn2) btn2.disabled = false;
                return;
            }
            var result = res.data;
            if (result && result.ok === false) {
                // Already voted — lock buttons
                var msg = result.error === 'already_voted_tg' ? L.alreadyVotedTg : L.yourVote;
                showVoteStatus(msg);
                highlightVote(playerId);
                return;
            }
            // Success — refresh votes
            client.rpc('get_battle_votes', { p_challenge_id: _challengeId })
                .then(function(vRes) {
                    _votes = {};
                    if (vRes.data) {
                        vRes.data.forEach(function(v) {
                            _votes[v.player_id] = parseInt(v.votes) || 0;
                        });
                    }
                    renderVoting(_battle, _votes);
                    highlightVote(playerId);
                    showVoteStatus(L.voteAccepted);
                });
        }).catch(function(e) {
            console.error('Vote error:', e);
            if (btn1) btn1.disabled = false;
            if (btn2) btn2.disabled = false;
        });
    }

    function showVoteStatus(msg) {
        var el = document.getElementById('voteStatus');
        if (!el) return;
        el.innerHTML = '<div style="color:var(--accent);margin-top:8px;font-size:0.9rem">' + msg + '</div>';
        setTimeout(function() { if (el) el.innerHTML = ''; }, 3000);
    }

    /* ========== DETAILS ========== */
    function renderDetails(b) {
        var section = document.getElementById('challengeDetails');
        if (!section) return;

        var date = b.counter_date || b.proposed_date || '';
        var time = b.counter_time || b.proposed_time || '';
        var venue = b.counter_venue || b.proposed_venue || '';

        if (!date && !time && !venue) return;

        section.style.display = '';
        section.innerHTML =
            '<div class="ch-details-inner">' +
                '<h2 class="ch-details-title">' + L.details + '</h2>' +
                '<div class="ch-details-grid">' +
                    (date ? '<div class="ch-detail-item"><span class="ch-detail-icon">📅</span><div><div class="ch-detail-label">' + L.date + '</div><div class="ch-detail-value">' + formatDate(date) + '</div></div></div>' : '') +
                    (time ? '<div class="ch-detail-item"><span class="ch-detail-icon">⏰</span><div><div class="ch-detail-label">' + L.time + '</div><div class="ch-detail-value">' + esc(time) + '</div></div></div>' : '') +
                    (venue ? '<div class="ch-detail-item"><span class="ch-detail-icon">📍</span><div><div class="ch-detail-label">' + L.venue + '</div><div class="ch-detail-value">' + esc(venue) + '</div></div></div>' : '') +
                '</div>' +
            '</div>';
    }

    /* ========== H2H ========== */
    function loadH2H(client, b) {
        var p1 = b.challenger_player_id;
        var p2 = b.opponent_player_id;

        // Query matches where these two players faced each other
        client.from('matches')
            .select('id, player1_id, player2_id, winner_id, score, created_at, status, match_type')
            .eq('status', 'completed')
            .or('and(player1_id.eq.' + p1 + ',player2_id.eq.' + p2 + '),and(player1_id.eq.' + p2 + ',player2_id.eq.' + p1 + ')')
            .order('created_at', { ascending: false })
            .limit(10)
            .then(function(res) {
                renderH2H(res.data || [], b);
            });
    }

    function renderH2H(matches, b) {
        var section = document.getElementById('challengeH2H');
        if (!section) return;
        section.style.display = '';

        var p1 = b.challenger_player_id;
        var p2 = b.opponent_player_id;
        var c1Name = isEn ? (b.challenger_name_en || b.challenger_name) : (isKg ? (b.challenger_name_kg || b.challenger_name) : b.challenger_name);
        var c2Name = isEn ? (b.opponent_name_en || b.opponent_name) : (isKg ? (b.opponent_name_kg || b.opponent_name) : b.opponent_name);

        var w1 = 0, w2 = 0;
        matches.forEach(function(m) {
            if (m.winner_id === p1) w1++;
            else if (m.winner_id === p2) w2++;
        });

        var listHtml = '';
        if (matches.length === 0) {
            listHtml = '<div class="ch-h2h-empty">' + L.noH2H + '</div>';
        } else {
            var duelLabel = isEn ? '(Duel)' : (isKg ? '(Чакыруу)' : '(Вызов)');
            listHtml = '<div class="ch-h2h-list">';
            matches.forEach(function(m) {
                var winName = m.winner_id === p1 ? c1Name : c2Name;
                var typeTag = m.match_type === 'duel' ? ' <span style="color:var(--accent);font-size:0.8em;">' + duelLabel + '</span>' : '';
                listHtml +=
                    '<div class="ch-h2h-match">' +
                        '<span class="ch-h2h-date">' + formatDate(m.created_at) + typeTag + '</span>' +
                        '<span class="ch-h2h-score-text">' + esc(m.score || '-') + '</span>' +
                        '<span class="ch-h2h-winner">' + esc(winName) + '</span>' +
                    '</div>';
            });
            listHtml += '</div>';
        }

        section.innerHTML =
            '<div class="ch-h2h-inner">' +
                '<h2 class="ch-h2h-title">' + L.h2h + '</h2>' +
                '<div class="ch-h2h-summary">' +
                    '<div class="ch-h2h-score">' +
                        '<div class="ch-h2h-score-num">' + w1 + '</div>' +
                        '<div class="ch-h2h-score-label">' + esc(c1Name) + '</div>' +
                    '</div>' +
                    '<div class="ch-h2h-score" style="color:var(--text-secondary);font-size:1.5rem;font-weight:700;align-self:center">:</div>' +
                    '<div class="ch-h2h-score">' +
                        '<div class="ch-h2h-score-num">' + w2 + '</div>' +
                        '<div class="ch-h2h-score-label">' + esc(c2Name) + '</div>' +
                    '</div>' +
                '</div>' +
                listHtml +
            '</div>';
    }

    /* ========== SCORE ========== */
    function loadScore(client, b) {
        if (b.status !== 'completed' || !b.match_id) return;

        client.from('matches')
            .select('id, player1_id, player2_id, winner_id, score')
            .eq('id', b.match_id)
            .single()
            .then(function(res) {
                if (res.data) {
                    renderScore(b, res.data);
                }
            });
    }

    function renderScore(b, match) {
        var section = document.getElementById('challengeScore');
        if (!section) return;
        section.style.display = '';

        var p1 = b.challenger_player_id;
        var c1Name = isEn ? (b.challenger_name_en || b.challenger_name) : (isKg ? (b.challenger_name_kg || b.challenger_name) : b.challenger_name);
        var c2Name = isEn ? (b.opponent_name_en || b.opponent_name) : (isKg ? (b.opponent_name_kg || b.opponent_name) : b.opponent_name);

        var winnerName = match.winner_id === p1 ? c1Name : c2Name;
        var isP1Winner = match.winner_id === p1;

        // Parse score: "6/4 7/6(11-9)" → sets
        var sets = (match.score || '').split(' ').filter(Boolean);
        var setsHtml = '<div class="ch-score-sets">';
        sets.forEach(function(s) {
            setsHtml += '<span class="ch-score-set">' + esc(s.replace('/', ':')) + '</span>';
        });
        setsHtml += '</div>';

        // Prediction accuracy
        var v1 = _votes[b.challenger_player_id] || 0;
        var v2 = _votes[b.opponent_player_id] || 0;
        var total = v1 + v2;
        var correctVotes = match.winner_id === p1 ? v1 : v2;
        var pctCorrect = total > 0 ? Math.round(correctVotes / total * 100) : 0;

        section.innerHTML =
            '<div class="ch-score-inner">' +
                '<h2 class="ch-score-title">' + L.result + '</h2>' +
                '<div class="ch-score-display">' +
                    '<span class="ch-score-player' + (isP1Winner ? ' winner' : '') + '">' + esc(c1Name) + '</span>' +
                    setsHtml +
                    '<span class="ch-score-player' + (!isP1Winner ? ' winner' : '') + '">' + esc(c2Name) + '</span>' +
                '</div>' +
                '<div class="ch-winner-badge">' + L.winner + ': ' + esc(winnerName) + '</div>' +
                (total > 0 ? '<div class="ch-prediction-result"><strong>' + pctCorrect + '%</strong> ' + L.predictionResult + '</div>' : '') +
            '</div>';
    }

    /* ========== UTILS ========== */
    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

    function formatDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        var day = ('0' + d.getDate()).slice(-2);
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        var year = d.getFullYear();
        return day + '.' + month + '.' + year;
    }
})();
