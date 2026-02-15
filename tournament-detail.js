// ========================================
// TOURNAMENT DETAIL — Rendering Logic
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');

    // Always preserve ?id= in language switcher
    if (tournamentId) {
        updateLangLinks(tournamentId);
    }

    if (!tournamentId || !tournamentDetailData[tournamentId]) {
        renderLockedPage(tournamentId);
        return;
    }

    const tournament = tournamentDetailData[tournamentId];

    renderHero(tournament);

    if (tournament.bracketType === 'single_elimination') {
        renderSingleEliminationBracket(tournament);
    } else if (tournament.bracketType === 'round_robin') {
        renderRoundRobin(tournament);
    }

    renderSchedule(tournament);
    renderParticipants(tournament);
    renderResults(tournament);
    initTabsNavigation();
    initScheduleFilters();
});

// ========================================
// HELPERS
// ========================================

function getPlayer(tournament, playerId) {
    if (!playerId) return { name: 'TBD', seed: null, country: '' };
    return tournament.players.find(p => p.id === playerId) || { name: 'TBD', seed: null, country: '' };
}

function reverseScore(score) {
    return score.split(' ').map(function(set) {
        var parts = set.split('/');
        return parts[1] + '/' + parts[0];
    }).join(' ');
}

function getStatusLabel(status) {
    var labels = typeof window.statusLabels !== 'undefined' ? window.statusLabels : {
        completed: 'Завершён',
        live: 'Live',
        upcoming: 'Предстоит'
    };
    return labels[status] || status;
}

// ========================================
// HERO
// ========================================

function renderHero(tournament) {
    var container = document.getElementById('tournamentHero');
    if (!container) return;

    var statusClass = tournament.status;
    var statusText = getStatusLabel(tournament.status);
    var backUrl = 'tournaments.html?category=' + tournament.category;

    // Check if we're on English page
    if (window.location.pathname.indexOf('-en') !== -1) {
        backUrl = 'tournaments-en.html?category=' + tournament.category;
    }

    container.innerHTML =
        '<div class="td-hero-bg">' +
            '<img src="' + tournament.bgImage + '" alt="">' +
            '<div class="td-hero-overlay"></div>' +
        '</div>' +
        '<div class="td-hero-content">' +
            '<a href="' + backUrl + '" class="td-back-link">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>' +
                ' ' + tournament.categoryName +
            '</a>' +
            '<div class="td-hero-badges">' +
                '<span class="tournament-category-badge">' + tournament.categoryName + '</span>' +
                '<span class="td-status-badge ' + statusClass + '">' +
                    (tournament.status === 'live' ? '<span class="live-dot"></span> ' : '') +
                    statusText +
                '</span>' +
            '</div>' +
            '<h1>' + tournament.name + '</h1>' +
            '<div class="td-hero-meta">' +
                '<div class="td-meta-item">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                    ' ' + tournament.dateRange +
                '</div>' +
                '<div class="td-meta-item">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                    ' ' + tournament.location +
                '</div>' +
                '<div class="td-meta-item">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>' +
                    ' ' + tournament.time +
                '</div>' +
            '</div>' +
            '<div class="td-hero-stats">' +
                '<div class="hero-stat">' +
                    '<span class="hero-stat-value">' + tournament.drawSize + '</span>' +
                    '<span class="hero-stat-label">' + (typeof window.heroLabels !== 'undefined' ? window.heroLabels.players : 'Участников') + '</span>' +
                '</div>' +
                '<div class="hero-stat">' +
                    '<span class="hero-stat-value">' + tournament.prize + '</span>' +
                    '<span class="hero-stat-label">' + (typeof window.heroLabels !== 'undefined' ? window.heroLabels.prize : 'Призовой фонд') + '</span>' +
                '</div>' +
                '<div class="hero-stat">' +
                    '<span class="hero-stat-value">' + (tournament.bracketType === 'single_elimination' ? (typeof window.heroLabels !== 'undefined' ? window.heroLabels.elimination : 'На вылет') : (typeof window.heroLabels !== 'undefined' ? window.heroLabels.roundRobin : 'Круговая')) + '</span>' +
                    '<span class="hero-stat-label">' + (typeof window.heroLabels !== 'undefined' ? window.heroLabels.format : 'Формат') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ========================================
// SINGLE ELIMINATION BRACKET
// ========================================

function renderSingleEliminationBracket(tournament) {
    var container = document.getElementById('bracketContainer');
    if (!container) return;

    var rounds = tournament.bracket.rounds;
    var html = '<div class="td-bracket-scroll"><div class="td-bracket">';

    rounds.forEach(function(round, roundIndex) {
        html += '<div class="td-bracket-round">' +
            '<div class="td-round-title">' + round.name + '</div>' +
            '<div class="td-bracket-matches">';

        round.matches.forEach(function(match) {
            html += renderMatch(tournament, match);
        });

        html += '</div></div>';

        // Connector column between rounds
        if (roundIndex < rounds.length - 1) {
            var pairCount = Math.floor(round.matches.length / 2);
            html += '<div class="td-connector-column">';
            for (var i = 0; i < pairCount; i++) {
                html += '<div class="td-connector-pair">' +
                    '<div class="td-conn-top"></div>' +
                    '<div class="td-conn-mid"></div>' +
                    '<div class="td-conn-bottom"></div>' +
                '</div>';
            }
            html += '</div>';
        }
    });

    html += '</div></div>';
    container.innerHTML = html;
}

function renderMatch(tournament, match) {
    var p1 = getPlayer(tournament, match.player1Id);
    var p2 = getPlayer(tournament, match.player2Id);
    var scores = match.score ? match.score.split(' ') : [];

    var p1Class = match.winnerId === match.player1Id ? 'winner' : (match.winnerId ? 'loser' : '');
    var p2Class = match.winnerId === match.player2Id ? 'winner' : (match.winnerId ? 'loser' : '');

    var html = '<div class="td-match ' + match.status + '">';

    // Player 1
    html += '<div class="td-match-player ' + p1Class + '">' +
        (p1.seed ? '<span class="td-seed">[' + p1.seed + ']</span>' : '<span class="td-seed"></span>') +
        '<span class="td-player-name">' + p1.name + '</span>';

    if (match.status === 'live' && scores.length > 0) {
        // Live: show current score
        html += '<span class="td-match-score live-score">' + match.score + '</span>';
    } else {
        scores.forEach(function(s) {
            var parts = s.split('/');
            html += '<span class="td-match-score">' + (parts[0] || '') + '</span>';
        });
    }
    html += '</div>';

    // Player 2
    html += '<div class="td-match-player ' + p2Class + '">' +
        (p2.seed ? '<span class="td-seed">[' + p2.seed + ']</span>' : '<span class="td-seed"></span>') +
        '<span class="td-player-name">' + p2.name + '</span>';

    if (match.status !== 'live') {
        scores.forEach(function(s) {
            var parts = s.split('/');
            html += '<span class="td-match-score">' + (parts[1] || '') + '</span>';
        });
    }
    html += '</div>';

    html += '</div>';
    return html;
}

// ========================================
// ROUND ROBIN
// ========================================

function renderRoundRobin(tournament) {
    var container = document.getElementById('bracketContainer');
    if (!container) return;

    var rr = tournament.roundRobin;
    var colHeaders = typeof window.rrHeaders !== 'undefined' ? window.rrHeaders : { player: 'Игрок', wins: 'П', points: 'О', place: 'Место' };
    var html = '<div class="td-rr-groups">';

    rr.groups.forEach(function(group) {
        var groupPlayers = group.playerIds.map(function(id) { return getPlayer(tournament, id); });

        html += '<div class="td-rr-group">' +
            '<h3 class="td-rr-group-title">' + group.name + '</h3>' +
            '<div class="td-rr-table-scroll">' +
            '<table class="td-rr-table"><thead><tr>' +
            '<th class="td-rr-num">№</th>' +
            '<th class="td-rr-player-header">' + colHeaders.player + '</th>';

        // Column per player (number)
        groupPlayers.forEach(function(p, idx) {
            html += '<th class="td-rr-vs-header">' + (idx + 1) + '</th>';
        });

        html += '<th class="td-rr-stat-header">' + colHeaders.wins + '</th>' +
            '<th class="td-rr-stat-header">' + colHeaders.points + '</th>' +
            '<th class="td-rr-stat-header">' + colHeaders.place + '</th>' +
            '</tr></thead><tbody>';

        // Rows by standings order
        group.standings.forEach(function(standing, rowIdx) {
            var rowPlayer = getPlayer(tournament, standing.playerId);
            var rowPlayerIndex = group.playerIds.indexOf(standing.playerId);

            html += '<tr>' +
                '<td class="td-rr-rank">' + (rowIdx + 1) + '.</td>' +
                '<td class="td-rr-player"><strong>' + rowPlayer.name + '</strong></td>';

            // Cross-table cells
            groupPlayers.forEach(function(colPlayer, colIdx) {
                if (colPlayer.id === standing.playerId) {
                    html += '<td class="td-rr-cell td-rr-diagonal"></td>';
                } else {
                    var match = group.matches.find(function(m) {
                        return (m.player1Id === standing.playerId && m.player2Id === colPlayer.id) ||
                               (m.player2Id === standing.playerId && m.player1Id === colPlayer.id);
                    });

                    if (match && match.status === 'completed') {
                        var isWin = match.winnerId === standing.playerId;
                        var displayScore = match.player1Id === standing.playerId ? match.score : reverseScore(match.score);
                        html += '<td class="td-rr-cell ' + (isWin ? 'td-rr-win' : 'td-rr-loss') + '">' +
                            '<span class="td-rr-score-text">' + displayScore + '</span>' +
                            '<span class="td-rr-result">' + (isWin ? '1' : '0') + '</span>' +
                        '</td>';
                    } else {
                        html += '<td class="td-rr-cell">—</td>';
                    }
                }
            });

            html += '<td class="td-rr-stat">' + standing.wins + '</td>' +
                '<td class="td-rr-stat td-rr-points">' + standing.points + '</td>' +
                '<td class="td-rr-stat td-rr-place">' + standing.place + '</td>' +
                '</tr>';
        });

        html += '</tbody></table></div></div>';
    });

    html += '</div>';

    // Knockout phase
    if (rr.knockout && rr.knockout.rounds.length > 0) {
        html += '<div class="td-rr-knockout">' +
            '<h3 class="td-section-subtitle">' + (typeof window.rrHeaders !== 'undefined' && window.rrHeaders.playoff ? window.rrHeaders.playoff : 'Плей-офф') + '</h3>' +
            '<div class="td-rr-knockout-matches">';

        rr.knockout.rounds.forEach(function(round) {
            round.matches.forEach(function(match) {
                html += '<div class="td-rr-ko-match">' +
                    '<div class="td-rr-ko-label">' + round.name + '</div>' +
                    renderMatch(tournament, match) +
                '</div>';
            });
        });

        html += '</div></div>';
    }

    container.innerHTML = html;
}

// ========================================
// SCHEDULE
// ========================================

function renderSchedule(tournament) {
    var filtersEl = document.getElementById('scheduleFilters');
    var listEl = document.getElementById('scheduleList');
    if (!filtersEl || !listEl) return;

    var days = tournament.schedule.days;
    var allLabel = typeof window.scheduleLabels !== 'undefined' ? window.scheduleLabels.allDays : 'Все дни';
    var courtLabel = typeof window.scheduleLabels !== 'undefined' ? window.scheduleLabels.court : 'Корт';

    // Day filter buttons
    var filtersHtml = '<button class="filter-btn active" data-day="all">' + allLabel + '</button>';
    days.forEach(function(day) {
        filtersHtml += '<button class="filter-btn" data-day="' + day.date + '">' + day.label + '</button>';
    });
    filtersEl.innerHTML = filtersHtml;

    // Match rows
    var listHtml = '';
    days.forEach(function(day) {
        listHtml += '<div class="td-schedule-day" data-day="' + day.date + '">' +
            '<h3 class="td-schedule-day-title">' + day.label + '</h3>' +
            '<div class="td-schedule-matches">';

        day.matches.forEach(function(match) {
            var p1 = getPlayer(tournament, match.player1Id);
            var p2 = getPlayer(tournament, match.player2Id);
            var statusText = getStatusLabel(match.status);

            listHtml += '<div class="td-schedule-match ' + match.status + '">' +
                '<div class="td-schedule-time">' + match.time + '</div>' +
                '<div class="td-schedule-court">' + courtLabel + ' ' + match.court + '</div>' +
                '<div class="td-schedule-players">' +
                    '<span class="td-schedule-p1 ' + (match.winnerId === match.player1Id ? 'winner' : '') + '">' + p1.name + '</span>' +
                    '<span class="td-schedule-vs">vs</span>' +
                    '<span class="td-schedule-p2 ' + (match.winnerId === match.player2Id ? 'winner' : '') + '">' + p2.name + '</span>' +
                '</div>' +
                '<div class="td-schedule-round">' + match.roundName + '</div>' +
                '<div class="td-schedule-score">' + (match.score || '—') + '</div>' +
                '<div class="td-schedule-status">' +
                    '<span class="td-status-pill ' + match.status + '">' +
                        (match.status === 'live' ? '<span class="live-dot"></span> ' : '') +
                        statusText +
                    '</span>' +
                '</div>' +
            '</div>';
        });

        listHtml += '</div></div>';
    });

    listEl.innerHTML = listHtml;
}

// ========================================
// PARTICIPANTS
// ========================================

function renderParticipants(tournament) {
    var grid = document.getElementById('participantsGrid');
    if (!grid) return;

    var html = '';
    tournament.players.forEach(function(player) {
        html += '<div class="td-participant-card">' +
            '<div class="td-participant-info">' +
                (player.seed ? '<span class="td-participant-seed">[' + player.seed + ']</span>' : '') +
                '<span class="td-participant-name">' + player.name + '</span>' +
                '<span class="td-participant-country">' + player.country + '</span>' +
            '</div>' +
        '</div>';
    });

    grid.innerHTML = html;
}

// ========================================
// RESULTS
// ========================================

function renderResults(tournament) {
    var container = document.getElementById('resultsPodium');
    if (!container) return;

    if (!tournament.results) {
        container.innerHTML = '<div class="td-no-results">' +
            '<p>' + (typeof window.resultsLabels !== 'undefined' ? window.resultsLabels.noResults : 'Результаты будут доступны после завершения турнира') + '</p>' +
        '</div>';
        return;
    }

    var r = tournament.results;
    var winner = getPlayer(tournament, r.winner.playerId);
    var runnerUp = getPlayer(tournament, r.runnerUp.playerId);

    var placeLabel = typeof window.resultsLabels !== 'undefined' ? window.resultsLabels.place : 'место';
    var prizeLabel = typeof window.resultsLabels !== 'undefined' ? window.resultsLabels.prize : 'Приз';

    var html = '<div class="td-podium">' +
        // 1st place
        '<div class="td-podium-card td-podium-1">' +
            '<div class="td-podium-medal">🥇</div>' +
            '<div class="td-podium-place">1-e ' + placeLabel + '</div>' +
            '<div class="td-podium-name">' + winner.name + '</div>' +
            '<div class="td-podium-country">' + winner.country + '</div>' +
            '<div class="td-podium-prize">' + prizeLabel + ': ' + r.winner.prize + '</div>' +
        '</div>' +
        // 2nd place
        '<div class="td-podium-card td-podium-2">' +
            '<div class="td-podium-medal">🥈</div>' +
            '<div class="td-podium-place">2-e ' + placeLabel + '</div>' +
            '<div class="td-podium-name">' + runnerUp.name + '</div>' +
            '<div class="td-podium-country">' + runnerUp.country + '</div>' +
            '<div class="td-podium-prize">' + prizeLabel + ': ' + r.runnerUp.prize + '</div>' +
        '</div>';

    // Semifinalists
    if (r.semifinalists && r.semifinalists.length > 0) {
        r.semifinalists.forEach(function(sf) {
            var player = getPlayer(tournament, sf.playerId);
            html += '<div class="td-podium-card td-podium-3">' +
                '<div class="td-podium-medal">🥉</div>' +
                '<div class="td-podium-place">3-e ' + placeLabel + '</div>' +
                '<div class="td-podium-name">' + player.name + '</div>' +
                '<div class="td-podium-country">' + player.country + '</div>' +
                '<div class="td-podium-prize">' + prizeLabel + ': ' + sf.prize + '</div>' +
            '</div>';
        });
    }

    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// TABS NAVIGATION
// ========================================

function initTabsNavigation() {
    var tabsBar = document.getElementById('tabsBar');
    if (!tabsBar) return;

    tabsBar.addEventListener('click', function(e) {
        var tab = e.target.closest('.td-tab');
        if (!tab) return;

        tabsBar.querySelectorAll('.td-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var targetId = tab.dataset.target;
        var targetSection = document.getElementById(targetId);
        if (targetSection) {
            var headerOffset = 120;
            var top = targetSection.getBoundingClientRect().top + window.pageYOffset - headerOffset;
            window.scrollTo({ top: top, behavior: 'smooth' });
        }
    });

    // Update active tab on scroll
    var sections = document.querySelectorAll('.td-section');
    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var id = entry.target.id;
                tabsBar.querySelectorAll('.td-tab').forEach(function(t) {
                    t.classList.toggle('active', t.dataset.target === id);
                });
            }
        });
    }, { rootMargin: '-120px 0px -60% 0px' });

    sections.forEach(function(section) { observer.observe(section); });
}

// ========================================
// SCHEDULE FILTERS
// ========================================

function initScheduleFilters() {
    var filtersEl = document.getElementById('scheduleFilters');
    if (!filtersEl) return;

    filtersEl.addEventListener('click', function(e) {
        var btn = e.target.closest('.filter-btn');
        if (!btn) return;

        filtersEl.querySelectorAll('.filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');

        var dayFilter = btn.dataset.day;
        document.querySelectorAll('.td-schedule-day').forEach(function(dayEl) {
            dayEl.style.display = (dayFilter === 'all' || dayEl.dataset.day === dayFilter) ? 'block' : 'none';
        });
    });
}

// ========================================
// LANGUAGE LINKS
// ========================================

function updateLangLinks(tournamentId) {
    // Update language switcher links to preserve tournament ID
    document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.indexOf('tournament') !== -1) {
            var separator = href.indexOf('?') !== -1 ? '&' : '?';
            link.setAttribute('href', href + separator + 'id=' + tournamentId);
        }
    });
}

// ========================================
// LOCKED PAGE (not authorized)
// ========================================

function renderLockedPage(tournamentId) {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var authUrl = isEn ? 'auth-en.html' : 'auth.html';
    var backUrl = isEn ? 'tournaments-en.html' : 'tournaments.html';

    var texts = isEn ? {
        title: 'Tournament Details',
        subtitle: 'Sign in to view the full bracket, schedule, and match results',
        features: ['Full tournament bracket', 'Match schedule with courts', 'Live scores and results', 'Player statistics'],
        btn: 'Sign In',
        btnRegister: 'Create Account',
        back: 'Back to Tournaments'
    } : {
        title: 'Детали турнира',
        subtitle: 'Войдите, чтобы увидеть полную сетку, расписание и результаты матчей',
        features: ['Полная турнирная сетка', 'Расписание матчей по кортам', 'Счёт в реальном времени', 'Статистика игроков'],
        btn: 'Войти',
        btnRegister: 'Создать аккаунт',
        back: 'Назад к турнирам'
    };

    // Hide tabs
    var tabsBar = document.getElementById('tabsBar');
    if (tabsBar) tabsBar.style.display = 'none';

    // Hide all sections and sponsors
    document.querySelectorAll('.td-section').forEach(function(s) { s.style.display = 'none'; });
    var sponsors = document.getElementById('sponsors');
    if (sponsors) sponsors.style.display = 'none';

    // Render hero as locked
    var hero = document.getElementById('tournamentHero');
    if (hero) {
        hero.innerHTML =
            '<div class="td-hero-bg">' +
                '<img src="https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80" alt="">' +
                '<div class="td-hero-overlay"></div>' +
            '</div>' +
            '<div class="td-hero-content td-hero-locked">' +
                '<h1>' + texts.title + '</h1>' +
                '<p class="td-locked-subtitle">' + texts.subtitle + '</p>' +
                '<div class="td-locked-buttons">' +
                    '<a href="' + authUrl + '" class="td-locked-btn">' + texts.btn + '</a>' +
                    '<a href="' + authUrl + '?tab=register" class="td-locked-btn-secondary">' + texts.btnRegister + '</a>' +
                '</div>' +
                '<a href="' + backUrl + '" class="td-back-link" style="margin-top:var(--space-md);">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> ' +
                    texts.back +
                '</a>' +
            '</div>';
    }
}
