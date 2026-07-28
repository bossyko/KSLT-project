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
    var CU = window.KSLT_COUNTRY;
    var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');
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
        sectionGames: 'Мои Игры',
        subsectionTournaments: 'Турниры',
        subsectionMatches: 'Матчи',
        subsectionChallenges: 'Вызовы',
        sectionMatches: 'История матчей',
        sectionAchievements: 'Достижения',
        sectionTournaments: 'Турниры',
        sectionChallenges: 'Вызовы',
        challengeAccepted: 'Принят',
        challengeCompleted: 'Сыгран',
        tournament: 'Турнир',
        showAll: 'Показать все',
        collapse: 'Свернуть',
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
        tournamentResults: ['Четвертьфинал', 'Полуфинал', '1/8 финала', 'Финалист', 'Победитель'],
        challengeModalTitle: 'Бросить вызов',
        challengeDate: 'Дата',
        challengeTime: 'Время',
        challengeVenue: 'Площадка',
        challengeMessage: 'Сообщение (необязательно)',
        challengeSend: 'Отправить вызов',
        challengeSending: 'Отправка...',
        challengeSent: 'Вызов отправлен!',
        challengeSentText: 'Оппонент получит уведомление в Telegram и сможет принять, предложить другое время или отклонить вызов.',
        challengeNoTg: 'Telegram не подключён',
        challengeNoTgText: 'У этого игрока не подключён Telegram-бот. Вызов можно отправить только игрокам с подключённым Telegram.',
        challengeError: 'Ошибка отправки',
        challengeLimit: 'Лимит вызовов: 5 в день',
        challengePending: 'Активный вызов',
        challengePendingText: 'У вас уже есть активный вызов этому игроку. Дождитесь ответа или истечения срока (72 часа).',
        challengeSelf: 'Нельзя вызвать самого себя',
        challengeSelectVenue: 'Выберите корт',
        challengeOtherVenue: 'Другая площадка',
        challengeLoginRequired: 'Войдите в аккаунт',
        challengeLoginText: 'Для отправки вызова необходимо авторизоваться',
        challengeMemberRequired: 'Оформите членство',
        challengeMemberText: 'Для отправки вызова необходимо членство KSLT',
        challengeNoPlayer: 'Привяжите профиль игрока для отправки вызовов',
        challengeDisclaimer: 'Отправляя вызов, вы соглашаетесь, что ваш контакт в Telegram может быть передан оппоненту.'
    };

    // ---- H2H Labels ----
    var LH = isEn ? {
        vs: 'VS', wins: 'Wins', setsWon: 'Sets won', gamesWon: 'Games won',
        last5: 'Last 5 matches', fullProfile: 'Open full profile',
        noMatches: 'No head-to-head matches found', loading: 'Loading...',
        noData: 'No match data yet', participated: 'Participated',
        winner: '🏆 Winner', roundF: 'Final', roundSF: 'SF', roundQF: 'QF',
        round3rd: '3rd place', round4th: '4th place', upcoming: 'Upcoming', registered: 'Registered'
    } : isKg ? {
        vs: 'VS', wins: 'Жеңиштер', setsWon: 'Утулган сеттер', gamesWon: 'Утулган геймдер',
        last5: 'Акыркы 5 матч', fullProfile: 'Толук профилди ачуу',
        noMatches: 'Бетме-бет матчтар жок', loading: 'Жүктөлүүдө...',
        noData: 'Матч маалыматы жок', participated: 'Катышкан',
        winner: '🏆 Жеңүүчү', roundF: 'Финал', roundSF: '1/2', roundQF: '1/4',
        round3rd: '3-орун', round4th: '4-орун', upcoming: 'Алдыда', registered: 'Катталган'
    } : {
        vs: 'VS', wins: 'Победы', setsWon: 'Выигранные сеты', gamesWon: 'Выигранные геймы',
        last5: 'Последние 5 матчей', fullProfile: 'Открыть полный профиль',
        noMatches: 'Матчей между игроками не найдено', loading: 'Загрузка...',
        noData: 'Нет данных о матчах', participated: 'Участвовал',
        winner: '🏆 Победитель', roundF: 'Финал', roundSF: '1/2', roundQF: '1/4',
        round3rd: '3-е место', round4th: '4-е место', upcoming: 'Скоро', registered: 'Зарегистрирован'
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

    // ---- Badge data (loaded from Supabase) ----
    var _earnedBadges = [];
    var _allBadges = [];

    async function loadPlayerBadges(playerId) {
        if (!client) return [];
        try {
            var res = await client.from('player_badges')
                .select('badge_id, earned_at, badge:badge_definitions(*)')
                .eq('player_id', playerId)
                .order('earned_at', { ascending: true });
            return res.data || [];
        } catch(e) { return []; }
    }

    async function loadAllBadges() {
        if (!client) return [];
        try {
            var res = await client.from('badge_definitions')
                .select('*')
                .order('sort_order', { ascending: true });
            return res.data || [];
        } catch(e) { return []; }
    }

    function getBadgeName(b) {
        if (!b) return '';
        return isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name);
    }
    function getBadgeDesc(b) {
        if (!b) return '';
        return isEn ? (b.description_en || b.description) : (isKg ? (b.description_kg || b.description) : b.description);
    }

    function formatBadgeDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        var yy = d.getFullYear();
        return dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + yy;
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

    // Badge emoji map removed — now loaded from badge_definitions

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

    // ---- Guest block ----
    function renderGuestBlock(data) {
        var el = document.getElementById('playerDetail');
        if (!el) return;

        var player = data.player;
        var rankingsPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');
        var authPage = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var photoUrl = player.photo ? player.photo.replace('w=80&h=80', 'w=240&h=240') : 'https://placehold.co/240x240?text=?';

        var titleText = isEn ? 'Register to view player profiles' : (isKg ? 'Оюнчулардын профилин көрүү үчүн катталыңыз' : 'Зарегистрируйтесь для просмотра профилей');
        var descText = isEn ? 'Full stats, match history, achievements and challenges are available after registration' : (isKg ? 'Толук статистика, матч тарыхы, жетишкендиктер жана чакырыктар каттоодон кийин жеткиликтүү' : 'Полная статистика, история матчей, достижения и вызовы доступны после регистрации');
        var btnText = isEn ? 'Sign In / Register' : (isKg ? 'Кирүү / Каттоо' : 'Войти / Регистрация');
        var backText = isEn ? 'Back to rankings' : (isKg ? 'Рейтингге кайтуу' : 'Назад к рейтингу');

        document.title = player.name + ' \u2014 KSLT';

        el.innerHTML =
            '<div class="kslt-back-wrap">' +
                '<a href="' + rankingsPage + '" class="kslt-back">\u2190 ' + backText + '</a>' +
            '</div>' +
            '<div class="pp-guest-block">' +
                '<div class="pp-guest-preview">' +
                    '<img src="' + esc(photoUrl) + '" alt="" class="pp-guest-photo">' +
                    '<h2 class="pp-guest-name">' + esc(player.name) + '</h2>' +
                '</div>' +
                '<div class="pp-guest-cta">' +
                    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                        '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                        '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                        '<circle cx="12" cy="16" r="1"/>' +
                    '</svg>' +
                    '<h3>' + titleText + '</h3>' +
                    '<p>' + descText + '</p>' +
                    '<a href="' + authPage + '?tab=register" class="pp-guest-btn">' + btnText + '</a>' +
                '</div>' +
            '</div>';
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
        var authPage = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
        var rankingsPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');

        var html = '';

        // Back link — always go to rankings with correct category tab
        html += '<div class="kslt-back-wrap">';
        html += '<a href="' + rankingsPage + '?tab=' + data.categoryKey + '" class="kslt-back">\u2190 ' + L.backToRankings + '</a>';
        html += '</div>';

        html += '<div class="pp-container">';

        // ---- Header ----
        html += '<div class="pp-header pp-fade-in">';
        html += '<div class="pp-photo-wrap">';
        var photoUrl = player.photo ? player.photo.replace('w=80&h=80', 'w=240&h=240') : 'https://placehold.co/240x240?text=No+Photo';
        html += '<img src="' + esc(photoUrl) + '" alt="' + esc(player.name) + '" class="pp-photo">';
        if (player.online) html += '<div class="pp-online-dot"></div>';
        // Motto under photo
        var motto = isEn ? (player.bio_en || player.bio) : (isKg ? (player.bio_kg || player.bio) : player.bio);
        if (motto) {
            html += '<div style="text-align:center;font-style:italic;color:var(--text-secondary);font-size:0.85rem;margin-top:10px;opacity:0.8;">&laquo;' + esc(motto) + '&raquo;</div>';
        }
        html += '</div>'; // .pp-photo-wrap

        html += '<div class="pp-info">';
        html += '<h2 class="pp-name">' + player.name + '</h2>';
        html += '<div class="pp-meta">';
        if (player.country) html += '<span class="pp-meta-country">' + CU.renderCountry(CU.normalizeCountry(player.country), lang, true) + '</span>';
        if (player.online) {
            html += '<span class="pp-meta-online">' + L.online + '</span>';
        }
        html += '</div>';

        // Ratings block — Singles
        html += '<div class="pp-ratings">';
        html += '<div class="pp-rating-row"><span class="pp-rating-label">KSLT</span><span class="pp-rating-value">' + cat.name + ' · #' + rank + '</span></div>';
        if (player.ntrp_rating) {
            var ntrpVal = Math.round(Number(player.ntrp_rating) / 0.25) * 0.25;
            html += '<div class="pp-rating-row"><span class="pp-rating-label">NTRP</span><span class="pp-rating-value">' + ntrpVal.toFixed(2).replace(/0$/, '') + '</span></div>';
        }
        html += '</div>';

        // Header badges — show all earned badge emoji
        if (_earnedBadges.length > 0) {
            html += '<div class="pp-badges">';
            _earnedBadges.forEach(function (pb) {
                var b = pb.badge;
                if (b) {
                    html += '<span class="pp-badge" title="' + esc(getBadgeName(b)) + '"><span class="pp-badge-icon">' + b.icon + '</span></span>';
                }
            });
            html += '</div>';
        }
        html += '</div>'; // .pp-info

        // Actions
        html += '<div class="pp-actions">';
        if (player.online) {
            html += '<a href="' + authPage + '" class="pp-action-btn pp-action-secondary">\u2709\uFE0F ' + L.message + '</a>';
        }
        html += '<button class="pp-action-btn pp-action-primary" id="ppChallengeBtn">\u2694\uFE0F ' + L.challenge + '</button>';
        html += '</div>';

        html += '</div>'; // .pp-header

        // ---- Singles Stats ----
        var singlesTitle = isEn ? 'Singles Rating' : (isKg ? 'Жеке рейтинг' : 'Одиночный рейтинг');
        html += '<h3 class="pp-section-title pp-fade-in">' + singlesTitle + '</h3>';
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
        html += '</div>'; // .pp-stats singles

        // ---- Doubles Stats (always shown) ----
        var doublesTitle = isEn ? 'Doubles Rating' : (isKg ? 'Жуптук рейтинг' : 'Парный рейтинг');
        html += '<h3 class="pp-section-title pp-fade-in">' + doublesTitle + '</h3>';
        html += '<div class="pp-stats pp-stats-doubles pp-fade-in">';
        var dblChange = player.doubles_rank_change || 0;
        var dblChangeText = dblChange > 0 ? '+' + dblChange : (dblChange < 0 ? '' + dblChange : '\u2014');
        var dblChangeClass = dblChange > 0 ? 'up' : (dblChange < 0 ? 'down' : 'neutral');
        var dblPts = player.doubles_points || 0;
        var dblW = player.doubles_wins || 0;
        var dblL = player.doubles_losses || 0;
        var dblTotal = dblW + dblL;
        var dblWinRate = dblTotal > 0 ? Math.round(dblW / dblTotal * 100) : 0;
        html += statCard(dblPts || '\u2014', L.statsPoints, dblPts ? dblChangeText : '', dblPts ? dblChangeClass : '');
        html += statCard(dblTotal > 0 ? dblW : '\u2014', L.statsWins, '', '');
        html += statCard(dblTotal > 0 ? dblL : '\u2014', L.statsLosses, '', '');
        html += statCard(dblTotal > 0 ? dblWinRate + '%' : '\u2014', L.statsWinRate, '', '');

        // Doubles streak card with form dots
        var dblStreak = calcStreak(player.doubles_form || []);
        var dblStreakLabel = dblStreak.count > 0 ? dblStreak.count + (dblStreak.type === 'up' ? 'W' : 'L') : '\u2014';
        html += '<div class="pp-stat">';
        html += '<div class="pp-stat-num">' + dblStreakLabel + '</div>';
        html += '<div class="pp-stat-label">' + L.statsStreak + '</div>';
        if (player.doubles_form && player.doubles_form.length > 0) {
            html += '<div class="pp-form">';
            player.doubles_form.forEach(function(f) {
                html += '<span class="pp-form-dot ' + (f === 'W' ? 'win' : 'loss') + '"></span>';
            });
            html += '</div>';
        }
        html += '</div>';
        html += '</div>';

        // ---- My Games (combined: Matches + Challenges + Tournaments) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFBE ' + L.sectionGames + '</h3>';

        // -- Subsection: Matches --
        html += '<div class="pp-subsection">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubMatches">';
        html += '<span>\u2694\uFE0F ' + L.subsectionMatches + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubMatches">';
        html += '<div class="pp-matches" id="ppMatchesContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        // -- Subsection: Challenges --
        html += '<div class="pp-subsection" id="ppChallengesSection" style="display:none">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubChallenges">';
        html += '<span>\uD83E\uDD4A ' + L.subsectionChallenges + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubChallenges">';
        html += '<div class="pp-matches" id="ppChallengesContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        // -- Subsection: Tournaments --
        html += '<div class="pp-subsection">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubTournaments">';
        html += '<span>\uD83C\uDFC6 ' + L.subsectionTournaments + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubTournaments">';
        html += '<div class="pp-tournaments" id="ppTournamentsContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        html += '</div>'; // .pp-section (My Games)

        // ---- Achievements (bottom of page) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFC5 ' + L.sectionAchievements + '</h3>';
        html += '<div class="pp-achievements" id="ppAchievements">';
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

        // Challenge button handler
        var chalBtn = el.querySelector('#ppChallengeBtn');
        if (chalBtn) {
            chalBtn.addEventListener('click', function() {
                handleChallengeClick(data.player);
            });
        }

        // Subsection toggle handlers
        el.querySelectorAll('.pp-subsection-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = btn.getAttribute('data-target');
                var body = document.getElementById(targetId);
                if (!body) return;
                var isOpen = btn.classList.contains('pp-subsection-open');
                if (isOpen) {
                    body.classList.add('pp-subsection-collapsed');
                    btn.classList.remove('pp-subsection-open');
                    btn.querySelector('.pp-toggle-arrow').textContent = '\u25B6';
                } else {
                    body.classList.remove('pp-subsection-collapsed');
                    btn.classList.add('pp-subsection-open');
                    btn.querySelector('.pp-toggle-arrow').textContent = '\u25BC';
                }
            });
        });

        // Async load real data from Supabase
        loadRealMatches(data);
        loadRealTournaments(data);
        loadPlayerChallenges();
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
            .select('*, match_type, tournament:tournaments(id, title, title_en, title_kg, format)')
            .or('player1_id.eq.' + _playerId + ',player2_id.eq.' + _playerId)
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .limit(50)
            .then(function(res) {
                if (res.error || !res.data || res.data.length === 0) {
                    renderMockMatches(container, data);
                    return;
                }
                // Filter out duel matches — only tournament matches here
                var filtered = res.data.filter(function(m) { return !m.match_type || m.match_type === 'tournament'; });
                if (filtered.length === 0) { renderMockMatches(container, data); return; }
                renderRealMatches(container, filtered);
            });
    }

    var _allMatchesLoaded = false;

    function renderRealMatches(container, matches, showAll) {
        var LIMIT = 25;
        var visible = showAll ? matches : matches.slice(0, LIMIT);
        var hasMore = !showAll && matches.length > LIMIT;
        var html = '';
        visible.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var opp = lookupPlayer(oppId);
            var result = m.winner_id === _playerId ? 'W' : 'L';
            var oppPhoto = opp.photo || 'https://placehold.co/36x36?text=?';
            var score = m.score || '';
            var displayScore = isP1 ? formatScore(score) : formatScore(flipScore(score));

            var tName = m.tournament ? (isEn ? (m.tournament.title_en || m.tournament.title) : (isKg ? (m.tournament.title_kg || m.tournament.title) : m.tournament.title)) : '';
            var tId = m.tournament ? m.tournament.id : '';

            var isDblMatch = m.tournament && (m.tournament.format === 'doubles' || m.tournament.format === 'mixed_doubles');
            html += '<div class="pp-match pp-match-clickable" data-opponent-id="' + esc(opp.id) + '" data-opponent-name="' + esc(opp.name) + '" data-opponent-photo="' + esc(oppPhoto) + '"' + (isDblMatch ? ' data-is-doubles="1" data-tournament-id="' + esc(tId) + '"' : '') + '>';
            html += '<div class="pp-match-date">' + formatMatchDate(m.played_at) + '</div>';
            if (tName) {
                var tPage = isEn ? 'tournament-en.html' : (isKg ? 'tournament-kg.html' : 'tournament.html');
                var isDbl = m.tournament && (m.tournament.format === 'doubles' || m.tournament.format === 'mixed_doubles');
                html += '<div class="pp-match-tournament">' + (isDbl ? '<span class="pp-match-doubles-badge" title="' + (isEn ? 'Doubles' : (isKg ? 'Жуптук' : 'Парный')) + '">\uD83D\uDC65</span> ' : '') + '<a href="' + tPage + '?id=' + esc(tId) + '">' + esc(tName) + '</a></div>';
            } else {
                html += '<div class="pp-match-tournament"></div>';
            }
            html += '<div class="pp-match-opponent">';
            html += '<img src="' + esc(oppPhoto) + '" alt="' + esc(opp.name) + '" class="pp-match-opponent-photo">';
            html += '<span class="pp-match-opponent-name">' + esc(opp.name) + '</span>';
            html += '</div>';
            html += '<div class="pp-match-score">' + displayScore + '</div>';
            html += '<div class="pp-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</div>';
            html += '<button class="pp-match-h2h" title="Head to Head">H2H</button>';
            html += '</div>';
        });

        if (hasMore) {
            html += '<button class="pp-show-all-btn" id="ppShowAllMatches">' + L.showAll + ' (' + matches.length + ')</button>';
        } else if (showAll && matches.length > 10) {
            html += '<button class="pp-show-all-btn" id="ppCollapseMatches">' + L.collapse + '</button>';
        }

        container.innerHTML = html;
        attachMatchClickHandlers(container);

        var showBtn = document.getElementById('ppShowAllMatches');
        if (showBtn) {
            showBtn.addEventListener('click', function() {
                renderRealMatches(container, matches, true);
            });
        }
        var colBtn = document.getElementById('ppCollapseMatches');
        if (colBtn) {
            colBtn.addEventListener('click', function() {
                renderRealMatches(container, matches, false);
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }
    }

    function renderMockMatches(container, data) {
        var matches = generateMatchHistory(data);
        var html = '';
        matches.forEach(function(m) {
            html += '<div class="pp-match">';
            html += '<div class="pp-match-date">' + m.date + '</div>';
            html += '<div class="pp-match-tournament"></div>';
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
                var isDoubles = row.getAttribute('data-is-doubles') === '1';
                var tournamentId = row.getAttribute('data-tournament-id') || '';
                showH2H(oppId, oppName, oppPhoto, isDoubles, tournamentId);
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

        Promise.all([
            client.from('tournament_registrations')
                .select('status, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                .eq('player_id', _playerId)
                .in('status', ['approved', 'draw'])
                .order('registered_at', { ascending: false })
                .limit(10),
            client.from('tournament_results')
                .select('tournament_id, round_reached, points_earned, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                .eq('player_id', _playerId)
                .order('created_at', { ascending: false })
                .limit(10)
        ]).then(function(results) {
            var regs = results[0].data || [];
            var tResults = results[1].data || [];

            // Map results by tournament_id
            var resultsMap = {};
            tResults.forEach(function(tr) { resultsMap[tr.tournament_id] = tr; });

            // Merge registrations + results
            var items = [];
            var seen = {};
            regs.forEach(function(reg) {
                if (!reg.tournament || seen[reg.tournament.id]) return;
                seen[reg.tournament.id] = true;
                var tr = resultsMap[reg.tournament.id];
                items.push({ tournament: reg.tournament, round_reached: tr ? tr.round_reached : null, points_earned: tr ? tr.points_earned : 0 });
            });
            tResults.forEach(function(tr) {
                if (!tr.tournament || seen[tr.tournament_id]) return;
                seen[tr.tournament_id] = true;
                items.push({ tournament: tr.tournament, round_reached: tr.round_reached, points_earned: tr.points_earned });
            });

            if (items.length === 0) { renderMockTournaments(container, data); return; }

            // Split into upcoming and past
            var today = new Date().toISOString().slice(0, 10);
            var upcoming = [];
            var past = [];
            items.forEach(function(item) {
                var isUpcoming = !item.round_reached && item.tournament.date_start && item.tournament.date_start >= today;
                if (isUpcoming) upcoming.push(item);
                else past.push(item);
            });

            var html = '';

            // Upcoming tournaments
            if (upcoming.length) {
                html += '<div class="pp-tournament-section-label">' + LH.upcoming + '</div>';
                upcoming.forEach(function(item) {
                    html += renderTournamentCard(item, true);
                });
            }

            // Past tournaments
            if (past.length) {
                if (upcoming.length) {
                    html += '<div class="pp-tournament-section-label" style="margin-top:12px;">' +
                        (isEn ? 'Played' : isKg ? 'Ойнолгон' : 'Сыгранные') + '</div>';
                }
                past.forEach(function(item) {
                    html += renderTournamentCard(item, false);
                });
            }

            container.innerHTML = html;
        });
    }

    function renderTournamentCard(item, isUpcoming) {
        var ROUND_LABELS = {
            'W': LH.winner, 'F': LH.roundF, 'SF': LH.roundSF, 'QF': LH.roundQF,
            'R16': 'R16', 'R32': 'R32', '3RD': LH.round3rd, '4TH': LH.round4th
        };
        var t = item.tournament;
        var tName = isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
        var dateStr = t.date_start ? t.date_start.slice(8,10) + '.' + t.date_start.slice(5,7) + '.' + t.date_start.slice(0,4) : '';
        var tImg = t.image || '';
        var tPage = 'tournament' + (isEn ? '-en' : isKg ? '-kg' : '') + '.html?id=' + t.id + '&player=' + _playerId;
        var result;
        if (isUpcoming) {
            result = LH.registered;
        } else {
            result = item.round_reached ? (ROUND_LABELS[item.round_reached] || item.round_reached) : LH.participated;
            if (item.points_earned > 0) result += ' · +' + item.points_earned;
        }
        var resultClass = isUpcoming ? ' pp-tournament-upcoming' : (item.round_reached === 'W' ? ' pp-tournament-winner' : '');
        var html = '<a class="pp-tournament" href="' + tPage + '">';
        if (tImg) {
            html += '<img src="' + esc(tImg) + '" alt="' + esc(tName) + '" class="pp-tournament-photo">';
        } else {
            html += '<div class="pp-tournament-photo pp-tournament-photo-empty">\uD83C\uDFBE</div>';
        }
        html += '<div class="pp-tournament-info"><span class="pp-tournament-name">' + esc(tName) + '</span>';
        if (dateStr) html += '<span class="pp-tournament-date">' + dateStr + '</span>';
        html += '</div>';
        html += '<span class="pp-tournament-result' + resultClass + '">' + result + '</span>';
        html += '</a>';
        return html;
    }

    function renderMockTournaments(container, data) {
        var tournaments = generateTournaments(data);
        var html = '';
        tournaments.forEach(function(t) {
            html += '<div class="pp-tournament">';
            html += '<div class="pp-tournament-photo pp-tournament-photo-empty">\uD83C\uDFBE</div>';
            html += '<div class="pp-tournament-info"><span class="pp-tournament-name">' + t.name + '</span></div>';
            html += '<span class="pp-tournament-result">' + t.result + '</span>';
            html += '</div>';
        });
        container.innerHTML = html;
    }

    // ================================================
    // SUPABASE: Player Challenges
    // ================================================
    function loadPlayerChallenges() {
        var section = document.getElementById('ppChallengesSection');
        var container = document.getElementById('ppChallengesContainer');
        if (!container || !section || !client) return;

        client.rpc('get_player_challenges', { p_player_id: _playerId })
            .then(function(res) {
                if (res.error || !res.data || res.data.length === 0) {
                    section.style.display = 'none';
                    return;
                }
                section.style.display = '';
                // Force expanded state
                var btn = section.querySelector('.pp-subsection-toggle');
                var body = document.getElementById('ppSubChallenges');
                if (btn && body) {
                    body.classList.remove('pp-subsection-collapsed');
                    btn.classList.add('pp-subsection-open');
                    var arrow = btn.querySelector('.pp-toggle-arrow');
                    if (arrow) arrow.textContent = '\u25BC';
                }
                renderChallenges(container, res.data);
            });
    }

    function renderChallenges(container, challenges) {
        var html = '';
        challenges.forEach(function(c) {
            var isChallenger = c.challenger_player_id === _playerId;
            var oppName, oppPhoto, oppId;
            if (isChallenger) {
                oppName = isEn ? (c.opponent_name_en || c.opponent_name) : (isKg ? (c.opponent_name_kg || c.opponent_name) : c.opponent_name);
                oppPhoto = c.opponent_photo || 'https://placehold.co/36x36?text=?';
                oppId = c.opponent_player_id;
            } else {
                oppName = isEn ? (c.challenger_name_en || c.challenger_name) : (isKg ? (c.challenger_name_kg || c.challenger_name) : c.challenger_name);
                oppPhoto = c.challenger_photo || 'https://placehold.co/36x36?text=?';
                oppId = c.challenger_player_id;
            }

            var date = c.counter_date || c.proposed_date || '';
            var score = c.match_score || '';
            var result = chalWinLoss(score, isChallenger);

            var playerPage = isEn ? 'player-en.html' : (isKg ? 'player-kg.html' : 'player.html');

            html += '<div class="pp-match' + (oppId ? ' pp-match-clickable' : '') + '" data-opponent-id="' + esc(oppId || '') + '" data-opponent-name="' + esc(oppName) + '" data-opponent-photo="' + esc(oppPhoto) + '">';
            html += '<div class="pp-match-date">' + formatChalDate(date) + '</div>';
            html += '<div class="pp-match-tournament"></div>';
            html += '<div class="pp-match-opponent">';
            if (oppId) {
                html += '<a href="' + playerPage + '?id=' + esc(oppId) + '">';
                html += '<img src="' + esc(oppPhoto) + '" alt="' + esc(oppName) + '" class="pp-match-opponent-photo">';
                html += '</a>';
                html += '<a href="' + playerPage + '?id=' + esc(oppId) + '" class="pp-match-opponent-name" style="color:inherit;text-decoration:none;">' + esc(oppName) + '</a>';
            } else {
                html += '<img src="' + esc(oppPhoto) + '" alt="' + esc(oppName) + '" class="pp-match-opponent-photo">';
                html += '<span class="pp-match-opponent-name" style="color:rgba(255,255,255,0.5);">' + esc(oppName || 'Unknown') + '</span>';
            }
            html += '</div>';
            html += '<div class="pp-match-score">' + esc(score || '—') + '</div>';
            if (c.status === 'completed' && result) {
                html += '<div class="pp-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</div>';
            } else {
                html += '<div class="pp-match-result accepted">' + L.challengeAccepted + '</div>';
            }
            if (oppId) {
                html += '<button class="pp-match-h2h" title="Head to Head">H2H</button>';
            }
            html += '</div>';
        });
        container.innerHTML = html;
        attachMatchClickHandlers(container);
    }

    function chalWinnerId(score, p1Id, p2Id) {
        if (!score) return null;
        var sets = score.trim().split(/\s+/);
        var s1 = 0, s2 = 0;
        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (m) {
                if (parseInt(m[1]) > parseInt(m[2])) s1++;
                else s2++;
            }
        });
        if (s1 > s2) return p1Id;
        if (s2 > s1) return p2Id;
        return null;
    }

    function chalWinLoss(score, isChallenger) {
        if (!score) return null;
        var sets = score.trim().split(/\s+/);
        var s1 = 0, s2 = 0;
        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (m) {
                if (parseInt(m[1]) > parseInt(m[2])) s1++;
                else s2++;
            }
        });
        if (s1 === s2) return null;
        var p1Won = s1 > s2;
        return isChallenger ? (p1Won ? 'W' : 'L') : (p1Won ? 'L' : 'W');
    }

    function formatChalDate(d) {
        if (!d) return '';
        var parts = d.split('-');
        if (parts.length === 3) return parts[2] + '.' + parts[1];
        return d;
    }

    // ================================================
    // H2H MODAL
    // ================================================
    function showH2H(oppId, oppName, oppPhoto, isDoubles, tournamentId) {
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

        var queries = [
            client.from('matches')
                .select('id, player1_id, player2_id, score, winner_id, played_at, tournament:tournaments(title, title_en, title_kg, format)')
                .or('and(player1_id.eq.' + _playerId + ',player2_id.eq.' + oppId + '),and(player1_id.eq.' + oppId + ',player2_id.eq.' + _playerId + ')')
                .not('winner_id', 'is', null)
                .order('played_at', { ascending: false }),
            client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, score_draft, proposed_date, created_at')
                .or('and(challenger_player_id.eq.' + _playerId + ',opponent_player_id.eq.' + oppId + '),and(challenger_player_id.eq.' + oppId + ',opponent_player_id.eq.' + _playerId + ')')
                .eq('status', 'completed')
                .not('score_draft', 'is', null)
                .order('created_at', { ascending: false })
        ];

        // For doubles: load partner info
        if (isDoubles && tournamentId) {
            queries.push(
                client.from('tournament_registrations')
                    .select('player_id, partner_id, partner_external_name, partner:players!tournament_registrations_partner_id_fkey(id, name, name_en, name_kg, photo)')
                    .eq('tournament_id', tournamentId)
                    .in('player_id', [_playerId, oppId])
            );
        }

        Promise.all(queries).then(function(results) {
                var modal = overlay.querySelector('.h2h-modal');
                if (!modal) return;

                var tournamentMatches = results[0].data || [];
                var chalMatches = results[1].data || [];

                // Convert challenges to match-like format
                var chalConverted = chalMatches.map(function(c) {
                    var score = c.score_draft || '';
                    var winnerId = chalWinnerId(score, c.challenger_player_id, c.opponent_player_id);
                    return {
                        id: c.id,
                        player1_id: c.challenger_player_id,
                        player2_id: c.opponent_player_id,
                        score: score,
                        winner_id: winnerId,
                        played_at: c.proposed_date || c.created_at,
                        tournament: null,
                        _isChallenge: true
                    };
                });

                // Merge and sort by date descending
                var allMatches = tournamentMatches.concat(chalConverted);
                allMatches.sort(function(a, b) {
                    return (b.played_at || '').localeCompare(a.played_at || '');
                });

                if (allMatches.length === 0) {
                    renderH2HEmpty(overlay);
                    return;
                }

                // Build partner info for doubles
                var doublesInfo = null;
                if (isDoubles && results[2] && results[2].data) {
                    doublesInfo = { myPartner: null, oppPartner: null };
                    results[2].data.forEach(function(reg) {
                        var partnerName = '';
                        if (reg.partner && reg.partner.id) {
                            partnerName = isEn ? (reg.partner.name_en || reg.partner.name) : (isKg ? (reg.partner.name_kg || reg.partner.name) : reg.partner.name);
                        } else if (reg.partner_external_name) {
                            partnerName = reg.partner_external_name;
                        }
                        var partnerPhoto = (reg.partner && reg.partner.photo) || '';
                        if (reg.player_id === _playerId) {
                            doublesInfo.myPartner = { name: partnerName, photo: partnerPhoto };
                        } else if (reg.player_id === oppId) {
                            doublesInfo.oppPartner = { name: partnerName, photo: partnerPhoto };
                        }
                    });
                }

                renderH2HContent(modal, allMatches, oppId, oppName, oppPhoto, doublesInfo);
                attachH2HCloseBtn(overlay);
            });
    }

    function renderH2HContent(modal, matches, oppId, oppName, oppPhoto, doublesInfo) {
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
        if (doublesInfo && doublesInfo.myPartner && doublesInfo.myPartner.name) {
            html += '<div class="h2h-partner">+ ' + esc(doublesInfo.myPartner.name) + '</div>';
        }
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
        if (doublesInfo && doublesInfo.oppPartner && doublesInfo.oppPartner.name) {
            html += '<div class="h2h-partner">+ ' + esc(doublesInfo.oppPartner.name) + '</div>';
        }
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

    // ---- Render Badges Section ----
    function renderBadgesSection() {
        var container = document.getElementById('ppAchievements');
        if (!container) return;

        var earnedIds = {};
        _earnedBadges.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

        var earned = [];
        var locked = [];
        _allBadges.forEach(function(b) {
            if (earnedIds[b.id]) {
                earned.push({ def: b, pb: earnedIds[b.id] });
            } else {
                locked.push(b);
            }
        });

        if (earned.length === 0 && locked.length === 0) {
            container.innerHTML = '<div class="pp-badges-empty">' +
                (isEn ? 'No achievements yet' : (isKg ? 'Жетишкендиктер жок' : 'Достижений пока нет')) + '</div>';
            return;
        }

        // Progress bar
        var total = earned.length + locked.length;
        var pct = total > 0 ? Math.round(earned.length / total * 100) : 0;
        var progressLabel = earned.length + '/' + total;
        var html = '<div class="pp-badges-progress">' +
            '<div class="pp-badges-progress-bar"><div class="pp-badges-progress-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="pp-badges-progress-text">' + progressLabel + '</span>' +
            '</div>';

        // Visible logic: all earned always visible, locked limited to 4 initially
        var LOCKED_VISIBLE = 4;

        // All earned badges (always visible)
        earned.forEach(function(item) {
            var b = item.def;
            html += '<div class="pp-achievement pp-achievement-earned" title="' + esc(getBadgeName(b)) + ' — ' + formatBadgeDate(item.pb.earned_at) + '">';
            html += '<div class="pp-achievement-icon">' + b.icon + '</div>';
            html += '<div class="pp-achievement-info">';
            html += '<div class="pp-achievement-name">' + esc(getBadgeName(b)) + '</div>';
            html += '<div class="pp-achievement-desc">' + formatBadgeDate(item.pb.earned_at) + '</div>';
            html += '</div></div>';
        });

        // Locked badges — first LOCKED_VISIBLE visible, rest hidden
        locked.forEach(function(b, idx) {
            var hidden = idx >= LOCKED_VISIBLE ? ' pp-badge-hidden' : '';
            html += '<div class="pp-achievement pp-achievement-locked' + hidden + '">';
            html += '<div class="pp-achievement-icon pp-achievement-icon-locked">' + b.icon + '</div>';
            html += '<div class="pp-achievement-info">';
            html += '<div class="pp-achievement-name pp-achievement-name-locked">' + esc(getBadgeName(b)) + '</div>';
            html += '<div class="pp-achievement-desc">' + esc(getBadgeDesc(b)) + '</div>';
            html += '</div></div>';
        });

        // Expand button (only if there are hidden locked badges)
        var hiddenCount = Math.max(0, locked.length - LOCKED_VISIBLE);
        if (hiddenCount > 0) {
            var moreLabel = isEn ? 'Show all' : (isKg ? 'Баарын көрсөтүү' : 'Показать все');
            var lessLabel = isEn ? 'Show less' : (isKg ? 'Жашыруу' : 'Свернуть');
            html += '<button class="pp-badges-expand" id="ppBadgesExpand">+' + hiddenCount + ' ' + moreLabel + '</button>';
        }

        container.innerHTML = html;

        // Expand toggle
        var expandBtn = document.getElementById('ppBadgesExpand');
        if (expandBtn) {
            var expanded = false;
            expandBtn.addEventListener('click', function() {
                expanded = !expanded;
                var moreLabel = isEn ? 'Show all' : (isKg ? 'Баарын көрсөтүү' : 'Показать все');
                var lessLabel = isEn ? 'Show less' : (isKg ? 'Жашыруу' : 'Свернуть');
                container.querySelectorAll('.pp-badge-hidden').forEach(function(el) {
                    el.style.display = expanded ? '' : 'none';
                });
                expandBtn.textContent = expanded ? lessLabel : ('+' + hiddenCount + ' ' + moreLabel);
            });
            // Initially hide overflow
            container.querySelectorAll('.pp-badge-hidden').forEach(function(el) {
                el.style.display = 'none';
            });
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

    // View counter for player detail page (localStorage dedup)
    function incrementPlayerView(id) {
        if (!id) return;
        var key = 'kslt_plview_' + id;
        if (localStorage.getItem(key)) return;
        if (!client) return;
        client.rpc('increment_player_view', { p_id: id }).then(function(res) {
            if (!res.error) localStorage.setItem(key, '1');
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
        // Supabase first — always prefer live data
        if (client) {
            try {
                var plrRes = await client.from('players').select('*').eq('id', playerId).single();
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
                        var avatarRes = await client.rpc('get_player_avatar', { p_player_id: p.id });
                        if (avatarRes.data) playerPhoto = avatarRes.data;
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
                            online: false,
                            ntrp_rating: p.ntrp_rating || null,
                            doubles_points: p.doubles_points || 0,
                            doubles_wins: p.doubles_wins || 0,
                            doubles_losses: p.doubles_losses || 0,
                            doubles_rank_change: p.doubles_rank_change || 0,
                            doubles_form: p.doubles_form || [],
                            bio: p.bio || '',
                            bio_en: p.bio_en || '',
                            bio_kg: p.bio_kg || ''
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

        // Static data fallback — if Supabase failed or unavailable
        if (!data) {
            try {
                data = findPlayer(playerId);
            } catch(e) {
                console.warn('[KSLT] findPlayer static error:', e);
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

        // Load badges from Supabase (parallel)
        var badgeResults = await Promise.all([
            loadPlayerBadges(playerId),
            loadAllBadges()
        ]);
        _earnedBadges = badgeResults[0];
        _allBadges = badgeResults[1];

        await detectAccess();

        // Block guests from viewing profiles
        if (_accessLevel === 'guest') {
            renderGuestBlock(data);
            return;
        }

        document.title = data.player.name + ' \u2014 KSLT';
        renderProfile(data);
        renderBadgesSection();
        initScrollAnimations();
        incrementPlayerView(playerId);
    });

    // ================================================
    // CHALLENGE MODAL
    // ================================================
    var _challengeSending = false;

    function handleChallengeClick(player) {
        if (_accessLevel === 'guest') {
            showChallengeAlert(L.challengeLoginRequired, L.challengeLoginText);
            return;
        }
        if (_accessLevel === 'registered') {
            showChallengeAlert(L.challengeMemberRequired, L.challengeMemberText);
            return;
        }
        showChallengeModal(player);
    }

    function showChallengeAlert(title, text) {
        var old = document.querySelector('.pp-chal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'pp-chal-overlay';
        overlay.innerHTML =
            '<div class="pp-chal-modal">' +
                '<button class="pp-chal-close">&times;</button>' +
                '<h3 class="pp-chal-title">' + esc(title) + '</h3>' +
                '<p style="color:var(--text-muted);margin:var(--space-md) 0;">' + esc(text) + '</p>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });
        attachChalClose(overlay);
    }

    function showChallengeModal(player) {
        var old = document.querySelector('.pp-chal-overlay');
        if (old) old.remove();

        var today = new Date().toISOString().split('T')[0];
        var playerName = player.name || '';

        var overlay = document.createElement('div');
        overlay.className = 'pp-chal-overlay';
        overlay.innerHTML =
            '<div class="pp-chal-modal">' +
                '<button class="pp-chal-close">&times;</button>' +
                '<h3 class="pp-chal-title">\u2694\uFE0F ' + esc(L.challengeModalTitle) + ' ' + esc(playerName) + '</h3>' +
                '<div class="pp-chal-form">' +
                    '<div class="pp-chal-row">' +
                        '<div class="pp-chal-field">' +
                            '<label class="pp-chal-label">' + L.challengeDate + ' *</label>' +
                            '<input type="date" class="pp-chal-input" id="ppChalDate" min="' + today + '" required>' +
                        '</div>' +
                        '<div class="pp-chal-field">' +
                            '<label class="pp-chal-label">' + L.challengeTime + ' *</label>' +
                            '<input type="time" class="pp-chal-input" id="ppChalTime" required>' +
                        '</div>' +
                    '</div>' +
                    '<div class="pp-chal-field">' +
                        '<label class="pp-chal-label">' + L.challengeVenue + '</label>' +
                        '<select class="pp-chal-input" id="ppChalCourt">' +
                            '<option value="">' + L.challengeSelectVenue + '</option>' +
                            '<option value="other">' + L.challengeOtherVenue + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="pp-chal-field" id="ppChalVenueWrap" style="display:none;">' +
                        '<input type="text" class="pp-chal-input" id="ppChalVenueText" placeholder="' + L.challengeOtherVenue + '">' +
                    '</div>' +
                    '<div class="pp-chal-field">' +
                        '<label class="pp-chal-label">' + L.challengeMessage + '</label>' +
                        '<textarea class="pp-chal-input pp-chal-textarea" id="ppChalMsg" maxlength="150" rows="2"></textarea>' +
                        '<div class="pp-chal-counter"><span id="ppChalMsgCount">0</span>/150</div>' +
                    '</div>' +
                    '<div style="font-size:0.75rem;color:var(--text-dim);text-align:center;margin:8px 0 4px;">&#9888;&#65039; ' + esc(L.challengeDisclaimer) + '</div>' +
                    '<button class="pp-chal-submit" id="ppChalSubmit">' + L.challengeSend + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });
        attachChalClose(overlay);

        // Load courts into select
        loadCourtsForChallenge();

        // Court select toggle
        var courtSel = document.getElementById('ppChalCourt');
        var venueWrap = document.getElementById('ppChalVenueWrap');
        if (courtSel) {
            courtSel.addEventListener('change', function() {
                venueWrap.style.display = courtSel.value === 'other' ? '' : 'none';
            });
        }

        // Message counter
        var msgInput = document.getElementById('ppChalMsg');
        var msgCount = document.getElementById('ppChalMsgCount');
        if (msgInput && msgCount) {
            msgInput.addEventListener('input', function() {
                msgCount.textContent = msgInput.value.length;
            });
        }

        // Submit
        var submitBtn = document.getElementById('ppChalSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                submitChallenge(player, overlay);
            });
        }
    }

    function loadCourtsForChallenge() {
        if (!client) return;
        client.from('courts').select('id, name').order('name').then(function(res) {
            var sel = document.getElementById('ppChalCourt');
            if (!sel || !res.data) return;
            for (var i = 0; i < res.data.length; i++) {
                var opt = document.createElement('option');
                opt.value = res.data[i].id;
                opt.textContent = res.data[i].name;
                sel.insertBefore(opt, sel.lastElementChild);
            }
        });
    }

    async function submitChallenge(player, overlay) {
        if (_challengeSending) return;

        var dateEl = document.getElementById('ppChalDate');
        var timeEl = document.getElementById('ppChalTime');
        var courtEl = document.getElementById('ppChalCourt');
        var venueEl = document.getElementById('ppChalVenueText');
        var msgEl = document.getElementById('ppChalMsg');
        var submitBtn = document.getElementById('ppChalSubmit');

        if (!dateEl.value || !timeEl.value) return;

        _challengeSending = true;
        if (submitBtn) {
            submitBtn.textContent = L.challengeSending;
            submitBtn.disabled = true;
        }

        try {
            var session = await client.auth.getSession();
            var token = session.data.session ? session.data.session.access_token : null;
            if (!token) {
                showChalToast(L.challengeError, 'error');
                return;
            }

            var body = {
                opponent_player_id: _playerId,
                proposed_date: dateEl.value,
                proposed_time: timeEl.value
            };

            if (courtEl.value && courtEl.value !== '' && courtEl.value !== 'other') {
                body.court_id = courtEl.value;
            }
            if (courtEl.value === 'other' && venueEl && venueEl.value.trim()) {
                body.venue_text = venueEl.value.trim();
            }
            if (msgEl && msgEl.value.trim()) {
                body.message = msgEl.value.trim();
            }

            var res = await fetch(SUPABASE_URL + '/functions/v1/create-challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify(body)
            });

            var data = await res.json();

            if (res.ok && data.success) {
                closeChalModal(overlay);
                showChallengeAlert('\u2694\uFE0F ' + L.challengeSent, L.challengeSentText);
            } else if (data.error === 'no_telegram') {
                closeChalModal(overlay);
                showChallengeAlert(L.challengeNoTg, L.challengeNoTgText);
            } else if (data.error === 'already_pending') {
                closeChalModal(overlay);
                showChallengeAlert(L.challengePending, L.challengePendingText);
            } else {
                var errMsg = L.challengeError;
                if (data.error === 'daily_limit') errMsg = L.challengeLimit;
                else if (data.error === 'self_challenge') errMsg = L.challengeSelf;
                else if (data.error === 'no_player') errMsg = L.challengeNoPlayer;
                showChalToast(errMsg, 'error');
            }
        } catch (e) {
            console.error('Challenge error:', e);
            showChalToast(L.challengeError, 'error');
        } finally {
            _challengeSending = false;
            if (submitBtn) {
                submitBtn.textContent = L.challengeSend;
                submitBtn.disabled = false;
            }
        }
    }

    function attachChalClose(overlay) {
        var closeBtn = overlay.querySelector('.pp-chal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { closeChalModal(overlay); });
        }
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeChalModal(overlay);
        });
        var escHandler = function(e) {
            if (e.key === 'Escape') {
                closeChalModal(overlay);
                document.removeEventListener('keydown', escHandler);
            }
        };
        document.addEventListener('keydown', escHandler);
    }

    function closeChalModal(overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 300);
    }

    function showChalToast(msg, type) {
        var toast = document.createElement('div');
        toast.className = 'pp-chal-toast pp-chal-toast-' + type;
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.classList.add('visible'); });
        setTimeout(function() {
            toast.classList.remove('visible');
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }, 3000);
    }
})();
