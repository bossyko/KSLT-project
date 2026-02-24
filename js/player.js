// ========================================
// PLAYER PROFILE — Detail Page Logic
// Uses playersData from players-data.js / players-data-en.js
// ========================================
(function () {
    'use strict';

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    var isEn = window.location.pathname.indexOf('-en') !== -1;

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

    // ---- Generate mock match history ----
    function generateMatchHistory(data) {
        var player = data.player;
        var cat = data.category;
        var seed = hashStr(player.id);
        var opponents = cat.players.filter(function (p) { return p.id !== player.id; });
        var matches = [];

        // Use real form + extend to 8 matches
        var results = player.form.slice();
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

        // Bonus achievements from stats
        if (player.wins >= 15) {
            achievements.push({ icon: '\u2B50', name: L.veteran, desc: player.wins + ' ' + L.victories });
        }
        var winRate = Math.round(player.wins / (player.wins + player.losses) * 100);
        if (winRate >= 70) {
            achievements.push({ icon: '\uD83D\uDCAA', name: L.dominant, desc: winRate + '% ' + L.winRateLabel });
        }

        return achievements;
    }

    // ---- Generate mock tournaments ----
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

    // ---- Render Profile ----
    function renderProfile(data) {
        var el = document.getElementById('playerDetail');
        if (!el) return;

        var player = data.player;
        var cat = data.category;
        var rank = data.rank;
        var streak = calcStreak(player.form);
        var winRate = Math.round(player.wins / (player.wins + player.losses) * 100);
        var matches = generateMatchHistory(data);
        var achievements = generateAchievements(player);
        var tournaments = generateTournaments(data);
        var authPage = isEn ? 'auth-en.html' : 'auth.html';
        var rankingsPage = isEn ? 'players-en.html' : 'players.html';

        var html = '<div class="pp-container">';

        // Back link
        html += '<a href="' + rankingsPage + '?tab=' + data.categoryKey + '" class="pp-back-link pp-fade-in">\u2190 ' + L.backToRankings + '</a>';

        // ---- Header ----
        html += '<div class="pp-header pp-fade-in">';
        html += '<div class="pp-photo-wrap">';
        html += '<img src="' + esc(player.photo.replace('w=80&h=80', 'w=240&h=240')) + '" alt="' + esc(player.name) + '" class="pp-photo">';
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
        player.form.forEach(function (f) {
            html += '<span class="pp-form-dot ' + (f === 'W' ? 'win' : 'loss') + '"></span>';
        });
        html += '</div></div>';
        html += '</div>'; // .pp-stats

        // ---- Match History ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\u2694\uFE0F ' + L.sectionMatches + '</h3>';
        html += '<div class="pp-matches">';
        matches.forEach(function (m) {
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

        // ---- Tournaments ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFBE ' + L.sectionTournaments + '</h3>';
        html += '<div class="pp-tournaments">';
        tournaments.forEach(function (t) {
            html += '<div class="pp-tournament">';
            html += '<span class="pp-tournament-name">' + t.name + '</span>';
            html += '<span class="pp-tournament-result">' + t.result + '</span>';
            html += '</div>';
        });
        html += '</div></div>';

        // ---- CTA ----
        html += '<div class="pp-cta pp-fade-in">';
        html += '<h3>' + L.ctaTitle + '</h3>';
        html += '<p>' + L.ctaText + '</p>';
        html += '<a href="' + authPage + '" class="pp-cta-btn">' + L.ctaBtn + ' \u2192</a>';
        html += '</div>';

        html += '</div>'; // .pp-container
        el.innerHTML = html;
    }

    // ---- Not Found ----
    function renderNotFound() {
        var el = document.getElementById('playerDetail');
        if (!el) return;
        var rankingsPage = isEn ? 'players-en.html' : 'players.html';
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
    document.addEventListener('DOMContentLoaded', function () {
        var params = new URLSearchParams(window.location.search);
        var playerId = params.get('id');

        renderHero();
        updateLangLinks(playerId);

        if (!playerId) {
            renderNotFound();
            return;
        }

        var data = findPlayer(playerId);
        if (!data) {
            renderNotFound();
            return;
        }

        document.title = data.player.name + ' \u2014 KSLT';
        renderProfile(data);
        initScrollAnimations();
    });
})();
