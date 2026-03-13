// ========================================
// PLAYER PROFILE — Detail Page Logic
// Uses playersData from players-data.js / -en / -kg
// Supabase: real matches + tournaments, mock fallback
// H2H modal on opponent click
// ========================================
(function () {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var client = window.supabaseClient;
    var _playerId = null;
    var _playerName = '';
    var _playerPhoto = '';

    // Seeded random for consistent mock data per player
    function seededRandom(seed) {
        var x = Math.sin(seed) * 10000;
        return x - Math.floor(x);
    }

    function hashStr(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash);
    }

    // ---- Labels ----
    var L = window.playerProfileLabels || {
        heroTitle: 'Профиль игрока',
        backToRankings: 'Назад к рейтингу',
        online: 'Онлайн',
        message: 'Написать',
        challenge: 'Вызвать на матч',
        statsPoints: 'Рейтинг',
        statsWins: 'Победы',
        statsLosses: 'Поражения',
        statsWinRate: '% Побед',
        statsStreak: 'Серия',
        sectionMatches: 'История матчей',
        sectionAchievements: 'Достижения',
        sectionTournaments: 'Турниры',
        ctaTitle: 'Хочешь <span>сыграть</span>?',
        ctaText: 'Зарегистрируйся в KSLT, чтобы бросить вызов игрокам и участвовать в турнирах',
        ctaBtn: 'Регистрация',
        win: 'W',
        loss: 'L',
        playerNotFound: 'Игрок не найден',
        playerNotFoundText: 'Возможно, ссылка устарела или игрок был удалён',
        badgeChampion: 'Чемпион турнира',
        badgeStreak: 'Серия 5+ побед',
        badgeTop1: '#1 месяца',
        badgeNewbie: 'Новичок',
        badgeBreakthrough: 'Прорыв',
        veteran: 'Ветеран',
        dominant: 'Доминирование',
        victories: 'побед',
        winRateLabel: 'побед',
        joined: 'С декабря 2025',
        positionsMonth: 'позиций за месяц',
        winsThisSeason: 'побед в сезоне',
        monthName: 'Январь 2026',
        matchDates: ['14 Фев', '7 Фев', '28 Янв', '21 Янв', '14 Янв', '5 Янв', '28 Дек', '20 Дек'],
        tournamentNames: ['KSLT Open 2026', 'Winter Cup 2025', 'Autumn Classic 2025', 'KSLT Summer Series 2025'],
        tournamentResults: ['Четвертьфинал', 'Полуфинал', '1/8 финала', 'Финалист', 'Победитель']
    };

    // ---- H2H Labels ----
    var LH = isEn ? {
        vs: 'VS', wins: 'Wins', setsWon: 'Sets won', gamesWon: 'Games won',
        last5: 'Last 5 matches', fullProfile: 'Open full profile',
        noMatches: 'No head-to-head matches found', loading: 'Loading...',
        noData: 'No match data yet', participated: 'Participated'
    } : isKg ? {
        vs: 'VS', wins: 'Жеңиштер', setsWon: 'Утулган сеттер', gamesWon: 'Утулган геймдер',
        last5: 'Акыркы 5 матч', fullProfile: 'Толук профилди ачуу',
        noMatches: 'Бетме-бет матчтар жок', loading: 'Жүктөлүүдө...',
        noData: 'Матч маалыматы жок', participated: 'Катышкан'
    } : {
        vs: 'VS', wins: 'Победы', setsWon: 'Выигранные сеты', gamesWon: 'Выигранные геймы',
        last5: 'Последние 5 матчей', fullProfile: 'Открыть полный профиль',
        noMatches: 'Матчей между игроками не найдено', loading: 'Загрузка...',
        noData: 'Нет данных о матчах', participated: 'Участвовал'
    };

    // ---- Find player across all categories ----
    function findPlayer(id) {
        var cats = playersData.categories;
        for (var catKey in cats) {
            if (!cats.hasOwnProperty(catKey)) continue;
            var cat = cats[catKey];
            for (var i = 0; i < cat.players.length; i++) {
                if (cat.players[i].id === id) {
                    return {
                        player: cat.players[i],
                        category: cat,
                        categoryKey: catKey,
                        rank: i + 1
                    };
                }
            }
        }
        return null;
    }

    // ---- Generate mock match history (fallback) ----
    function generateMatchHistory(data) {
        var player = data.player;
        var cat = data.category;
        var seed = hashStr(player.id);
        var opponents = (cat.players || []).filter(function (p) { return p.id !== player.id; });
        if (opponents.length === 0) return [];
        var matches = [];

        var results = (player.form || []).slice();
        for (var i = results.length; i < 8; i++) {
            results.push(seededRandom(seed + i * 7) > 0.45 ? 'W' : 'L');
        }

        var winScores = [
            ['6:4', '6:3'], ['6:2', '7:5'], ['7:6', '6:4'],
            ['6:3', '6:1'], ['6:4', '7:5'], ['7:5', '6:2'],
            ['6:1', '6:4'], ['6:3', '4:6', '6:2']
        ];
        var lossScores = [
            ['4:6', '3:6'], ['5:7', '4:6'], ['6:7', '4:6'],
            ['3:6', '1:6'], ['5:7', '2:6'], ['6:4', '3:6', '2:6']
        ];

        for (var j = 0; j < results.length; j++) {
            var oppIdx = Math.floor(seededRandom(seed + j * 13) * opponents.length);
            var opp = opponents[oppIdx];
            var scores = results[j] === 'W'
                ? winScores[Math.floor(seededRandom(seed + j * 17) * winScores.length)]
                : lossScores[Math.floor(seededRandom(seed + j * 19) * lossScores.length)];
            matches.push({
                date: L.matchDates[j] || L.matchDates[L.matchDates.length - 1],
                opponent: opp,
                score: scores.join(', '),
                result: results[j]
            });
        }
        return matches;
    }

    // ---- Generate achievements from badges + stats ----
    function generateAchievements(player) {
        var badgeMap = {
            champion: { icon: '\uD83C\uDFC6', name: L.badgeChampion, desc: 'KSLT Open 2026' },
            streak: { icon: '\uD83D\uDD25', name: L.badgeStreak, desc: player.wins + ' ' + L.winsThisSeason },
            top1: { icon: '\uD83D\uDC51', name: L.badgeTop1, desc: L.monthName },
            newbie: { icon: '\uD83C\uDD95', name: L.badgeNewbie, desc: L.joined },
            breakthrough: { icon: '\u2B06\uFE0F', name: L.badgeBreakthrough, desc: '+' + Math.abs(player.change) + ' ' + L.positionsMonth }
        };

        var achievements = [];
        player.badges.forEach(function (b) {
            if (badgeMap[b]) achievements.push(badgeMap[b]);
        });

        if (player.wins >= 15) {
            achievements.push({ icon: '\u2B50', name: L.veteran, desc: player.wins + ' ' + L.victories });
        }
        var totalG = (player.wins || 0) + (player.losses || 0);
        var winRate = totalG > 0 ? Math.round(player.wins / totalG * 100) : 0;
        if (winRate >= 70) {
            achievements.push({ icon: '\uD83D\uDCAA', name: L.dominant, desc: winRate + '% ' + L.winRateLabel });
        }

        return achievements;
    }

    // ---- Generate mock tournaments (fallback) ----
    function generateTournaments(data) {
        var seed = hashStr(data.player.id);
        var results = L.tournamentResults;
        return L.tournamentNames.map(function (name, i) {
            var resIdx = Math.floor(seededRandom(seed + i * 23) * results.length);
            return { name: name, result: results[resIdx] };
        });
    }

    // ---- Calculate current streak ----
    function calcStreak(form) {
        if (!form || !form.length) return { count: 0, type: 'neutral' };
        var first = form[0];
        var count = 0;
        for (var i = 0; i < form.length; i++) {
            if (form[i] === first) count++;
            else break;
        }
        return { count: count, type: first === 'W' ? 'up' : 'down' };
    }

    // ---- Badge emoji map ----
    var badgeEmoji = {
        champion: '\uD83C\uDFC6',
        streak: '\uD83D\uDD25',
        top1: '\uD83D\uDC51',
        newbie: '\uD83C\uDD95',
        breakthrough: '\u2B06\uFE0F'
    };

    // ---- Score helpers ----
    function formatMatchDate(dateStr) {
        if (!dateStr) return '\u2014';
        var d = new Date(dateStr);
        var months = isEn
            ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
            : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];
        return d.getDate() + ' ' + months[d.getMonth()];
    }

    function formatScore(score) {
        if (!score) return '\u2014';
        return score.replace(/(\d+)\/(\d+)/g, '$1:$2');
    }

    function flipScore(score) {
        if (!score) return score;
        return score.replace(/(\d+)\/(\d+)/g, '$2/$1');
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

    function playerPage() {
        return isEn ? 'player-en.html' : (isKg ? 'player-kg.html' : 'player.html');
    }

    // ---- Render helpers ----
    function statCard(num, label, change, changeClass) {
        var h = '<div class="pp-stat"><div class="pp-stat-num">' + num + '</div>' +
            '<div class="pp-stat-label">' + label + '</div>';
        if (change) {
            h += '<div class="pp-stat-change ' + changeClass + '">' + change + '</div>';
        }
        h += '</div>';
        return h;
    }

    // ---- Render Hero ----
    function renderHero() {
        var el = document.getElementById('playerHero');
        if (!el) return;
        el.innerHTML =
            '<div class="pp-hero-bg"></div>' +
            '<div class="pp-hero-content">' +
            '<h1>' + L.heroTitle + '</h1>' +
            '</div>';
    }

    // ---- Access level detection ----
    var _accessLevel = 'guest';

    async function detectAccess() {
        if (!client) { _accessLevel = 'guest'; return; }
        try {
            var res = await client.auth.getSession();
            if (!res.data || !res.data.session) { _accessLevel = 'guest'; return; }
            // Set ksltUser for membership.js (not set on public pages without auth-guard)
            if (!window.ksltUser) window.ksltUser = res.data.session.user;
        } catch(e) { _accessLevel = 'guest'; return; }

        _accessLevel = 'registered';

        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) _accessLevel = 'member';
            } catch(e) {}
        }
    }

    // ---- Render Profile ----
    function renderProfile(data) {
        var el = document.getElementById('playerDetail');
        if (!el) return;

        var player = data.player;
        var cat = data.category;
        var rank = data.rank;
        var streak = calcStreak(player.form || []);
        var totalM = (player.wins || 0) + (player.losses || 0);
        var winRate = totalM > 0 ? Math.round(player.wins / totalM * 100) : 0;
        var achievements = generateAchievements(player);
        var authPage = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var rankingsPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');

        var html = '';

        // Back link — contextual label
        var cameFromPlayer = document.referrer && document.referrer.indexOf('player') !== -1 && document.referrer.indexOf('players') === -1 && document.referrer.indexOf('id=') !== -1;
        var backLabel = cameFromPlayer
            ? (isEn ? 'Back' : (isKg ? 'Артка' : 'Назад'))
            : L.backToRankings;
        html += '<div class="kslt-back-wrap">';
        html += '<a href="' + rankingsPage + '?tab=' + data.categoryKey + '" class="kslt-back">\u2190 ' + backLabel + '</a>';
        html += '</div>';

        html += '<div class="pp-container">';

        // ---- Header ----
        html += '<div class="pp-header pp-fade-in">';
        html += '<div class="pp-photo-wrap">';
        var photoUrl = player.photo ? player.photo.replace('w=80&h=80', 'w=240&h=240') : 'https://placehold.co/240x240?text=No+Photo';
        html += '<img src="' + esc(photoUrl) + '" alt="' + esc(player.name) + '" class="pp-photo">';
        if (player.online) html += '<div class="pp-online-dot"></div>';
        html += '</div>';

        html += '<div class="pp-info">';
        html += '<h2 class="pp-name">' + player.name + '</h2>';
        html += '<div class="pp-meta">';
        html += '<span class="pp-meta-country">' + player.country + '</span>';
        html += '<span class="pp-meta-category">' + cat.name + ' \u00b7 #' + rank + '</span>';
        if (player.online) {
            html += '<span class="pp-meta-online">' + L.online + '</span>';
        }
        html += '</div>';

        if (player.badges.length > 0) {
            html += '<div class="pp-badges">';
            player.badges.forEach(function (b) {
                html += '<span class="pp-badge"><span class="pp-badge-icon">' + (badgeEmoji[b] || '') + '</span></span>';
            });
            html += '</div>';
        }
        html += '</div>'; // .pp-info

        // Actions
        html += '<div class="pp-actions">';
        if (player.online) {
            html += '<a href="' + authPage + '" class="pp-action-btn pp-action-secondary">\u2709\uFE0F ' + L.message + '</a>';
        }
        html += '<a href="' + authPage + '" class="pp-action-btn pp-action-primary">\u2694\uFE0F ' + L.challenge + '</a>';
        html += '</div>';

        html += '</div>'; // .pp-header

        // ---- Stats ----
        html += '<div class="pp-stats pp-fade-in">';
        var changeText = player.change > 0 ? '+' + player.change : (player.change < 0 ? '' + player.change : '\u2014');
        var changeClass = player.change > 0 ? 'up' : (player.change < 0 ? 'down' : 'neutral');
        html += statCard(player.points, L.statsPoints, changeText, changeClass);
        html += statCard(player.wins, L.statsWins, '', '');
        html += statCard(player.losses, L.statsLosses, '', '');
        html += statCard(winRate + '%', L.statsWinRate, '', '');

        // Streak card with form dots
        var streakLabel = streak.count + (streak.type === 'up' ? 'W' : 'L');
        html += '<div class="pp-stat">';
        html += '<div class="pp-stat-num">' + streakLabel + '</div>';
        html += '<div class="pp-stat-label">' + L.statsStreak + '</div>';
        html += '<div class="pp-form">';
        (player.form || []).forEach(function (f) {
            html += '<span class="pp-form-dot ' + (f === 'W' ? 'win' : 'loss') + '"></span>';
        });
        html += '</div></div>';
        html += '</div>'; // .pp-stats

        // ---- Match History (async loaded) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\u2694\uFE0F ' + L.sectionMatches + '</h3>';
        html += '<div class="pp-matches" id="ppMatchesContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div>';

        // ---- Achievements ----
        if (achievements.length > 0) {
            html += '<div class="pp-section pp-fade-in">';
            html += '<h3 class="pp-section-title">\uD83C\uDFC5 ' + L.sectionAchievements + '</h3>';
            html += '<div class="pp-achievements">';
            achievements.forEach(function (a) {
                html += '<div class="pp-achievement">';
                html += '<div class="pp-achievement-icon">' + a.icon + '</div>';
                html += '<div class="pp-achievement-info">';
                html += '<div class="pp-achievement-name">' + a.name + '</div>';
                html += '<div class="pp-achievement-desc">' + a.desc + '</div>';
                html += '</div></div>';
            });
            html += '</div></div>';
        }

        // ---- Tournaments (async loaded) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFBE ' + L.sectionTournaments + '</h3>';
        html += '<div class="pp-tournaments" id="ppTournamentsContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div>';

        // ---- CTA (guest / registered only, hidden for members) ----
        if (_accessLevel !== 'member') {
            var pricingPage = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');
            html += '<div class="pp-cta pp-fade-in">';
            if (_accessLevel === 'registered') {
                var ctaTitleReg = isEn ? 'Want to <span>compete</span>?' : (isKg ? '<span>Мелдешкиңиз</span> келеби?' : 'Хочешь <span>играть</span>?');
                var ctaTextReg = isEn ? 'Get a KSLT membership to challenge players and join tournaments' : (isKg ? 'Оюнчуларга кыйынчылык жана мелдештерге катышуу үчүн KSLT мүчөлүгүн алыңыз' : 'Оформи членство KSLT, чтобы бросить вызов игрокам и участвовать в турнирах');
                var ctaBtnReg = isEn ? 'Get Membership' : (isKg ? 'Мүчөлүк алуу' : 'Оформить членство');
                html += '<h3>' + ctaTitleReg + '</h3>';
                html += '<p>' + ctaTextReg + '</p>';
                html += '<a href="' + pricingPage + '" class="pp-cta-btn">' + ctaBtnReg + ' \u2192</a>';
            } else {
                html += '<h3>' + L.ctaTitle + '</h3>';
                html += '<p>' + L.ctaText + '</p>';
                html += '<a href="' + authPage + '" class="pp-cta-btn">' + L.ctaBtn + ' \u2192</a>';
            }
            html += '</div>';
        }

        html += '</div>'; // .pp-container
        el.innerHTML = html;

        // Back button: history.back() with ratings fallback
        var backBtn = el.querySelector('.kslt-back');
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var fallback = backBtn.getAttribute('href');
                history.back();
                setTimeout(function() { window.location.href = fallback; }, 200);
            });
        }

        // Async load real data from Supabase
        loadRealMatches(data);
        loadRealTournaments(data);
    }

    // ================================================
    // SUPABASE: Real Matches
    // ================================================

    // Cache for Supabase-loaded player names (opponent display)
    var _playerCache = {};

    // Look up player from static data or cache
    function lookupPlayer(id) {
        var d = findPlayer(id);
        if (d) return { id: id, name: d.player.name, photo: d.player.photo || '' };
        if (_playerCache[id]) return _playerCache[id];
        // Async load into cache for next render
        if (client) {
            client.from('players').select('id, name, name_en, name_kg, photo').eq('id', id).single()
                .then(function(res) {
                    if (res.data) {
                        var n = isEn ? (res.data.name_en || res.data.name) : (isKg ? (res.data.name_kg || res.data.name) : res.data.name);
                        _playerCache[id] = { id: id, name: n || id, photo: res.data.photo || '' };
                    }
                });
        }
        return { id: id, name: id, photo: '' };
    }

    function loadRealMatches(data) {
        var container = document.getElementById('ppMatchesContainer');
        if (!container) return;

        if (!client) {
            renderMockMatches(container, data);
            return;
        }

        client.from('matches')
            .select('*')
            .or('player1_id.eq.' + _playerId + ',player2_id.eq.' + _playerId)
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .limit(10)
            .then(function(res) {
                console.log('[KSLT] matches query:', res.error ? res.error.message : (res.data ? res.data.length + ' results' : 'no data'));
                if (res.error || !res.data || res.data.length === 0) {
                    renderMockMatches(container, data);
                    return;
                }
                renderRealMatches(container, res.data);
            });
    }

    function renderRealMatches(container, matches) {
        var html = '';
        matches.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var opp = lookupPlayer(oppId);
            var result = m.winner_id === _playerId ? 'W' : 'L';
            var oppPhoto = opp.photo || 'https://placehold.co/36x36?text=?';
            var score = m.score || '';
            var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));

            html += '<div class="pp-match pp-match-clickable" data-opponent-id="' + esc(opp.id) + '" data-opponent-name="' + esc(opp.name) + '" data-opponent-photo="' + esc(oppPhoto) + '">';
            html += '<div class="pp-match-date">' + formatMatchDate(m.played_at) + '</div>';
            html += '<div class="pp-match-opponent">';
            html += '<img src="' + esc(oppPhoto) + '" alt="' + esc(opp.name) + '" class="pp-match-opponent-photo">';
            html += '<span class="pp-match-opponent-name">' + esc(opp.name) + '</span>';
            html += '</div>';
            html += '<div class="pp-match-score">' + displayScore + '</div>';
            html += '<div class="pp-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</div>';
            html += '<button class="pp-match-h2h" title="Head to Head">H2H</button>';
            html += '</div>';
        });
        container.innerHTML = html;
        attachMatchClickHandlers(container);
    }

    function renderMockMatches(container, data) {
        var matches = generateMatchHistory(data);
        var html = '';
        matches.forEach(function(m) {
            html += '<div class="pp-match">';
            html += '<div class="pp-match-date">' + m.date + '</div>';
            html += '<div class="pp-match-opponent">';
            html += '<img src="' + esc(m.opponent.photo) + '" alt="' + esc(m.opponent.name) + '" class="pp-match-opponent-photo">';
            html += '<span class="pp-match-opponent-name">' + m.opponent.name + '</span>';
            html += '</div>';
            html += '<div class="pp-match-score">' + m.score + '</div>';
            html += '<div class="pp-match-result ' + (m.result === 'W' ? 'win' : 'loss') + '">' + (m.result === 'W' ? L.win : L.loss) + '</div>';
            html += '</div>';
        });
        container.innerHTML = html;
    }

    function attachMatchClickHandlers(container) {
        container.querySelectorAll('.pp-match-h2h').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var row = btn.closest('.pp-match-clickable');
                if (!row) return;
                var oppId = row.getAttribute('data-opponent-id');
                var oppName = row.getAttribute('data-opponent-name');
                var oppPhoto = row.getAttribute('data-opponent-photo');
                showH2H(oppId, oppName, oppPhoto);
            });
        });
    }

    // ================================================
    // SUPABASE: Real Tournaments
    // ================================================
    function loadRealTournaments(data) {
        var container = document.getElementById('ppTournamentsContainer');
        if (!container) return;

        if (!client) {
            renderMockTournaments(container, data);
            return;
        }

        client.from('tournament_registrations')
            .select('status, tournament:tournaments(id, title, title_en, title_kg, date_start)')
            .eq('player_id', _playerId)
            .eq('status', 'approved')
            .order('registered_at', { ascending: false })
            .limit(8)
            .then(function(res) {
                console.log('[KSLT] tournaments query:', res.error ? res.error.message : (res.data ? res.data.length + ' results' : 'no data'));
                if (res.error || !res.data || res.data.length === 0) {
                    renderMockTournaments(container, data);
                    return;
                }
                var html = '';
                res.data.forEach(function(reg) {
                    var t = reg.tournament;
                    if (!t) return;
                    var tName = isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
                    html += '<div class="pp-tournament">';
                    html += '<span class="pp-tournament-name">' + esc(tName) + '</span>';
                    html += '<span class="pp-tournament-result">' + LH.participated + '</span>';
                    html += '</div>';
                });
                container.innerHTML = html;
            });
    }

    function renderMockTournaments(container, data) {
        var tournaments = generateTournaments(data);
        var html = '';
        tournaments.forEach(function(t) {
            html += '<div class="pp-tournament">';
            html += '<span class="pp-tournament-name">' + t.name + '</span>';
            html += '<span class="pp-tournament-result">' + t.result + '</span>';
            html += '</div>';
        });
        container.innerHTML = html;
    }

    // ================================================
    // H2H MODAL
    // ================================================
    function showH2H(oppId, oppName, oppPhoto) {
        var old = document.querySelector('.h2h-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'h2h-overlay';
        overlay.innerHTML =
            '<div class="h2h-modal">' +
                '<button class="h2h-close">&times;</button>' +
                '<div class="h2h-loading">' + LH.loading + '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        // Close handlers
        var closeBtn = overlay.querySelector('.h2h-close');
        closeBtn.addEventListener('click', function() { closeH2H(overlay); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeH2H(overlay);
        });
        var escHandler = function(e) {
            if (e.key === 'Escape') {
                closeH2H(overlay);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);

        if (!client) {
            renderH2HEmpty(overlay);
            return;
        }

        client.from('matches')
            .select('id, player1_id, player2_id, score, winner_id, played_at, tournament:tournaments(title, title_en, title_kg)')
            .or('and(player1_id.eq.' + _playerId + ',player2_id.eq.' + oppId + '),and(player1_id.eq.' + oppId + ',player2_id.eq.' + _playerId + ')')
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .then(function(res) {
                var modal = overlay.querySelector('.h2h-modal');
                if (!modal) return;

                if (res.error || !res.data || res.data.length === 0) {
                    renderH2HEmpty(overlay);
                    return;
                }

                renderH2HContent(modal, res.data, oppId, oppName, oppPhoto);
                attachH2HCloseBtn(overlay);
            });
    }

    function renderH2HContent(modal, matches, oppId, oppName, oppPhoto) {
        var myWins = 0, oppWins = 0;
        var mySets = 0, oppSets = 0;
        var myGames = 0, oppGames = 0;

        matches.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            if (m.winner_id === _playerId) myWins++; else oppWins++;

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

        var profileUrl = playerPage() + '?id=' + oppId;

        var html = '<button class="h2h-close">&times;</button>';

        // Header: avatars + score
        html += '<div class="h2h-header">';
        html += '<div class="h2h-player">';
        html += '<img src="' + esc(_playerPhoto) + '" class="h2h-photo" alt="">';
        html += '<div class="h2h-name">' + esc(_playerName) + '</div>';
        html += '</div>';
        html += '<div class="h2h-center">';
        var totalMatches = matches.length;
        var matchesLabel = isEn ? (totalMatches + ' matches') : (isKg ? (totalMatches + ' матч') : (totalMatches + ' матчей'));
        html += '<div class="h2h-score">' + myWins + ' \u2014 ' + oppWins + '</div>';
        html += '<div class="h2h-label">' + matchesLabel + '</div>';
        html += '</div>';
        html += '<div class="h2h-player">';
        html += '<img src="' + esc(oppPhoto) + '" class="h2h-photo" alt="">';
        html += '<div class="h2h-name">' + esc(oppName) + '</div>';
        html += '</div>';
        html += '</div>';

        // Stats
        html += '<div class="h2h-stats">';
        html += '<div class="h2h-stat-row">';
        html += '<span class="h2h-stat-val h2h-val-left">' + mySets + '</span>';
        html += '<span class="h2h-stat-label">' + LH.setsWon + '</span>';
        html += '<span class="h2h-stat-val h2h-val-right">' + oppSets + '</span>';
        html += '</div>';
        html += '<div class="h2h-stat-row">';
        html += '<span class="h2h-stat-val h2h-val-left">' + myGames + '</span>';
        html += '<span class="h2h-stat-label">' + LH.gamesWon + '</span>';
        html += '<span class="h2h-stat-val h2h-val-right">' + oppGames + '</span>';
        html += '</div>';
        html += '</div>';

        // Last 5 matches
        var last5 = matches.slice(0, 5);
        html += '<div class="h2h-matches">';
        html += '<div class="h2h-matches-title">' + LH.last5 + '</div>';
        last5.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            var result = m.winner_id === _playerId ? 'W' : 'L';
            var score = m.score || '';
            var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));
            var tName = '';
            if (m.tournament) {
                tName = isEn ? (m.tournament.title_en || m.tournament.title) : (isKg ? (m.tournament.title_kg || m.tournament.title) : m.tournament.title);
            }

            html += '<div class="h2h-match">';
            html += '<span class="h2h-match-date">' + formatMatchDate(m.played_at) + '</span>';
            if (tName) html += '<span class="h2h-match-tournament">' + esc(tName) + '</span>';
            html += '<span class="h2h-match-score">' + displayScore + '</span>';
            html += '<span class="h2h-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</span>';
            html += '</div>';
        });
        html += '</div>';

        // Profile link
        html += '<a href="' + profileUrl + '" class="h2h-profile-btn">' + LH.fullProfile + ' \u2192</a>';

        modal.innerHTML = html;
    }

    function renderH2HEmpty(overlay) {
        var modal = overlay.querySelector('.h2h-modal');
        if (!modal) return;
        modal.innerHTML =
            '<button class="h2h-close">&times;</button>' +
            '<div class="h2h-empty">' + LH.noMatches + '</div>';
        attachH2HCloseBtn(overlay);
    }

    function closeH2H(overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 300);
    }

    function attachH2HCloseBtn(overlay) {
        var btn = overlay.querySelector('.h2h-close');
        if (btn) {
            btn.addEventListener('click', function() { closeH2H(overlay); });
        }
    }

    // ---- Not Found ----
    function renderNotFound() {
        var el = document.getElementById('playerDetail');
        if (!el) return;
        var rankingsPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');
        el.innerHTML =
            '<div class="pp-container" style="text-align:center; padding:120px 24px;">' +
            '<h2 style="font-size:1.8rem; margin-bottom:12px;">' + L.playerNotFound + '</h2>' +
            '<p style="color:var(--text-secondary); margin-bottom:24px;">' + L.playerNotFoundText + '</p>' +
            '<a href="' + rankingsPage + '" class="pp-cta-btn">\u2190 ' + L.backToRankings + '</a>' +
            '</div>';
    }

    // ---- Scroll Animations ----
    function initScrollAnimations() {
        var items = document.querySelectorAll('.pp-fade-in');
        if (!items.length) return;
        var obs = new IntersectionObserver(function (entries) {
            entries.forEach(function (e) {
                if (e.isIntersecting) {
                    e.target.classList.add('visible');
                    obs.unobserve(e.target);
                }
            });
        }, { threshold: 0.1 });
        items.forEach(function (el) { obs.observe(el); });
    }

    // ---- Update language links with ?id= ----
    function updateLangLinks(playerId) {
        if (!playerId) return;
        var langLinks = document.querySelectorAll('.lang-option, .mobile-lang-option');
        langLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('player') !== -1) {
                link.setAttribute('href', href.split('?')[0] + '?id=' + playerId);
            }
        });
    }

    // ---- Init ----
    document.addEventListener('DOMContentLoaded', async function () {
        var params = new URLSearchParams(window.location.search);
        var playerId = params.get('id');
        _playerId = playerId;

        renderHero();
        updateLangLinks(playerId);

        if (!playerId) {
            renderNotFound();
            return;
        }

        var data = null;
        try {
            data = findPlayer(playerId);
        } catch(e) {
            console.warn('[KSLT] findPlayer static error:', e);
        }
        console.log('[KSLT] Player lookup:', playerId, 'static:', !!data, 'client:', !!client);

        // Supabase fallback — if player not in static data, load from DB
        if (!data && client) {
            try {
                var plrRes = await client.from('players').select('*').eq('id', playerId).single();
                console.log('[KSLT] Supabase fallback:', plrRes.error ? plrRes.error.message : 'found', plrRes.data);
                if (plrRes.data) {
                    var p = plrRes.data;
                    var catName = '';
                    var catKey = '';
                    var rank = 0;
                    if (p.category_id) {
                        var catRes = await client.from('categories').select('*').eq('id', p.category_id).single();
                        if (catRes.data) {
                            var c = catRes.data;
                            catName = isEn ? (c.name_en || c.name) : (isKg ? (c.name_kg || c.name) : c.name);
                            catKey = (c.gender === 'female' ? 'women-' : 'men-') + (c.name_en || c.name).toLowerCase().replace(/[^a-z0-9-]/g, '');
                        }
                        // Calculate rank in category
                        var rankRes = await client.from('players').select('id', { count: 'exact', head: true })
                            .eq('category_id', p.category_id).gt('points', p.points || 0);
                        rank = (rankRes.count || 0) + 1;
                    }
                    var playerName = isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name);
                    // If player has no photo, try linked profile avatar
                    var playerPhoto = p.photo || '';
                    if (!playerPhoto) {
                        var profRes = await client.from('profiles').select('avatar_url').eq('player_id', p.id).maybeSingle();
                        if (profRes.data && profRes.data.avatar_url) playerPhoto = profRes.data.avatar_url;
                    }
                    data = {
                        player: {
                            id: p.id,
                            name: playerName || playerId,
                            photo: playerPhoto,
                            country: p.country || '',
                            points: p.points || 0,
                            wins: p.wins || 0,
                            losses: p.losses || 0,
                            change: p.rank_change || 0,
                            form: p.form || [],
                            badges: [],
                            online: false
                        },
                        category: { name: catName || '\u2014', players: [] },
                        categoryKey: catKey,
                        rank: rank
                    };
                }
            } catch(e) {
                console.error('[KSLT] player Supabase fallback error:', e);
            }
        }

        if (!data) {
            renderNotFound();
            return;
        }

        _playerName = data.player.name;
        _playerPhoto = data.player.photo
            ? data.player.photo.replace('w=80&h=80', 'w=240&h=240')
            : 'https://placehold.co/80x80?text=?';

        await detectAccess();
        document.title = data.player.name + ' \u2014 KSLT';
        renderProfile(data);
        initScrollAnimations();
    });
})();
