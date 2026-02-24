// ========================================
// TOURNAMENT DETAIL — Rendering Logic
// ========================================

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');

    // Always preserve ?id= in language switcher
    if (tournamentId) {
        updateLangLinks(tournamentId);
    }

    if (!tournamentId) {
        renderLockedPage(tournamentId);
        return;
    }

    // Try static data first
    if (typeof tournamentDetailData !== 'undefined' && tournamentDetailData[tournamentId]) {
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
        return;
    }

    // Try Supabase
    var client = window.supabaseClient;
    if (client) {
        loadFromSupabase(client, tournamentId);
    } else {
        renderLockedPage(tournamentId);
    }
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
            '<img src="' + esc(tournament.bgImage) + '" alt="">' +
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

// ========================================
// SUPABASE TOURNAMENT SUPPORT
// ========================================

function loadFromSupabase(client, id) {
    client.from('tournaments').select('*').eq('id', id).single()
        .then(function(result) {
            if (result.error || !result.data) {
                renderLockedPage(id);
                return;
            }
            var tournament = result.data;

            // Load matches, registrations, and players in parallel
            var matchesPromise = client.from('matches')
                .select('*')
                .eq('tournament_id', id)
                .order('round_number', { ascending: true })
                .order('match_order', { ascending: true });

            var regsPromise = client.from('tournament_registrations')
                .select('*, players(id, name, name_en, points)')
                .eq('tournament_id', id)
                .order('seed_number', { ascending: true, nullsFirst: false });

            Promise.all([matchesPromise, regsPromise]).then(function(results) {
                var matches = results[0].data || [];
                var registrations = results[1].data || [];

                // Build players map
                var playerIds = [];
                registrations.forEach(function(r) { if (r.player_id) playerIds.push(r.player_id); });
                matches.forEach(function(m) {
                    if (m.player1_id) playerIds.push(m.player1_id);
                    if (m.player2_id) playerIds.push(m.player2_id);
                    if (m.winner_id) playerIds.push(m.winner_id);
                });
                playerIds = playerIds.filter(function(v, i) { return playerIds.indexOf(v) === i; });

                if (playerIds.length > 0) {
                    client.from('players').select('id, name, name_en, points, country').in('id', playerIds)
                        .then(function(plRes) {
                            var playersMap = {};
                            (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });
                            renderSupabaseTournament(tournament, matches, registrations, playersMap);
                        });
                } else {
                    renderSupabaseTournament(tournament, matches, registrations, {});
                }
            });
        })
        .catch(function(e) {
            console.error('Error loading tournament from Supabase:', e);
            renderLockedPage(id);
        });
}

function renderSupabaseTournament(t, matches, registrations, playersMap) {
    matches = matches || [];
    registrations = registrations || [];
    playersMap = playersMap || {};
    var isEn = window.location.pathname.indexOf('-en') !== -1;

    var months = isEn
        ? ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
        : ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'];

    // Format date range
    var d1 = new Date(t.date_start + 'T00:00:00');
    var dateRange = d1.getDate() + ' ' + months[d1.getMonth()];
    if (t.date_end && t.date_end !== t.date_start) {
        var d2 = new Date(t.date_end + 'T00:00:00');
        dateRange += ' — ' + d2.getDate() + ' ' + months[d2.getMonth()];
    }
    dateRange += ' ' + d1.getFullYear();

    // Status labels & CSS class mapping
    var statusLabels = isEn
        ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Registration Closed', ongoing: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
        : { registration_open: 'Регистрация открыта', upcoming: 'Скоро', registration_closed: 'Регистрация закрыта', ongoing: 'Идёт', completed: 'Завершён', cancelled: 'Отменён' };

    var statusClassMap = { registration_open: 'live', registration_closed: 'upcoming', ongoing: 'live', cancelled: 'completed', upcoming: 'upcoming', completed: 'completed' };
    var statusClass = statusClassMap[t.status] || 'upcoming';
    var statusText = statusLabels[t.status] || t.status;

    // Format labels
    var formatLabels = isEn
        ? { singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles' }
        : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' };

    // Category name from category_id (e.g. "men-tour" → "Tour")
    var catId = t.category_id || '';
    var catParts = catId.split('-');
    var catName = catParts.length > 1
        ? catParts.slice(1).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('-')
        : catId;
    var category = catParts.length > 1 ? catParts.slice(1).join('-') : catId;

    // Gender badge
    var gender = catParts[0] || '';
    var genderLabel = gender === 'women'
        ? (isEn ? '♀ Women' : '♀ Женский')
        : (isEn ? '♂ Men' : '♂ Мужской');

    var backUrl = isEn
        ? 'tournaments-en.html?category=' + category
        : 'tournaments.html?category=' + category;

    var L = isEn ? {
        format: 'Format', participants: 'Participants', prizeFund: 'Prize Fund',
        description: 'About Tournament', scheduleSoon: 'Schedule will be published soon',
        noParticipants: 'Participants will be announced soon',
        noResults: 'Results will be available after the tournament ends'
    } : {
        format: 'Формат', participants: 'Участники', prizeFund: 'Призовой фонд',
        description: 'О турнире', scheduleSoon: 'Расписание будет опубликовано позже',
        noParticipants: 'Участники будут объявлены позже',
        noResults: 'Результаты будут доступны после завершения турнира'
    };

    // ---- Render Hero ----
    var hero = document.getElementById('tournamentHero');
    if (hero) {
        var bgImage = t.image || 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80';
        hero.innerHTML =
            '<div class="td-hero-bg">' +
                '<img src="' + esc(bgImage) + '" alt="">' +
                '<div class="td-hero-overlay"></div>' +
            '</div>' +
            '<div class="td-hero-content">' +
                '<a href="' + backUrl + '" class="td-back-link">' +
                    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>' +
                    ' ' + catName +
                '</a>' +
                '<div class="td-hero-badges">' +
                    '<span class="tournament-category-badge">' + catName + '</span>' +
                    '<span class="tournament-gender-badge" style="margin-left:8px">' + genderLabel + '</span>' +
                    '<span class="td-status-badge ' + statusClass + '">' + statusText + '</span>' +
                '</div>' +
                '<h1>' + (isEn ? (t.title_en || t.title) : t.title) + '</h1>' +
                '<div class="td-hero-meta">' +
                    '<div class="td-meta-item">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                        ' ' + dateRange +
                    '</div>' +
                    '<div class="td-meta-item">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                        ' ' + (isEn ? (t.location_en || t.location || '') : (t.location || '')) +
                    '</div>' +
                '</div>' +
                '<div class="td-hero-stats">' +
                    '<div class="hero-stat">' +
                        '<span class="hero-stat-value">' + (t.max_participants || '—') + '</span>' +
                        '<span class="hero-stat-label">' + L.participants + '</span>' +
                    '</div>' +
                    '<div class="hero-stat">' +
                        '<span class="hero-stat-value">' + (t.prize_fund || '—') + '</span>' +
                        '<span class="hero-stat-label">' + L.prizeFund + '</span>' +
                    '</div>' +
                    '<div class="hero-stat">' +
                        '<span class="hero-stat-value">' + (formatLabels[t.format] || t.format || '—') + '</span>' +
                        '<span class="hero-stat-label">' + L.format + '</span>' +
                    '</div>' +
                '</div>' +
            '</div>';
    }

    // ---- Bracket section ----
    var bracketContainer = document.getElementById('bracketContainer');
    if (bracketContainer) {
        if (matches.length > 0 && t.bracket_type === 'single_elimination') {
            // Convert Supabase matches to tournament-detail format
            var drawSize = t.draw_size || 16;
            var totalRounds = Math.log2(drawSize);

            // Build players array for getPlayer()
            var playersArr = [];
            var addedIds = {};
            Object.keys(playersMap).forEach(function(pid) {
                var p = playersMap[pid];
                playersArr.push({
                    id: pid,
                    name: isEn ? (p.name_en || p.name) : p.name,
                    seed: null,
                    country: p.country || ''
                });
                addedIds[pid] = true;
            });

            // Find seeds from matches
            matches.forEach(function(m) {
                if (m.seed1 && m.player1_id) {
                    var p = playersArr.find(function(x) { return x.id === m.player1_id; });
                    if (p) p.seed = m.seed1;
                }
                if (m.seed2 && m.player2_id) {
                    var p = playersArr.find(function(x) { return x.id === m.player2_id; });
                    if (p) p.seed = m.seed2;
                }
            });

            // Build rounds structure
            var rounds = [];
            var lang = isEn ? 'en' : 'ru';
            var roundDefs = (typeof ROUND_DEFS !== 'undefined' && ROUND_DEFS[lang] && ROUND_DEFS[lang][drawSize])
                ? ROUND_DEFS[lang][drawSize]
                : null;

            for (var r = 1; r <= totalRounds; r++) {
                var roundMatches = matches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                    .sort(function(a, b) { return a.match_order - b.match_order; });

                var roundName = '';
                if (roundDefs && roundDefs[r - 1]) {
                    roundName = roundDefs[r - 1].name;
                } else {
                    var rf = totalRounds - r;
                    if (rf === 0) roundName = isEn ? 'Final' : 'Финал';
                    else if (rf === 1) roundName = isEn ? 'Semifinal' : 'Полуфинал';
                    else if (rf === 2) roundName = isEn ? 'Quarterfinal' : 'Четвертьфинал';
                    else roundName = isEn ? 'Round ' + r : 'Раунд ' + r;
                }

                var convertedMatches = roundMatches.map(function(m) {
                    return {
                        matchId: m.id,
                        player1Id: m.player1_id,
                        player2Id: m.player2_id,
                        score: m.score || '',
                        winnerId: m.winner_id,
                        status: m.status || 'upcoming',
                        court: m.court,
                        scheduledTime: m.scheduled_time,
                        scheduledDay: m.scheduled_day
                    };
                });

                rounds.push({
                    name: roundName,
                    nameShort: roundDefs && roundDefs[r - 1] ? roundDefs[r - 1].nameShort : 'R' + r,
                    matches: convertedMatches
                });
            }

            // Build tournament object for renderer
            var tournamentObj = {
                id: t.id,
                name: isEn ? (t.title_en || t.title) : t.title,
                bracketType: 'single_elimination',
                drawSize: drawSize,
                players: playersArr,
                bracket: { rounds: rounds },
                status: statusClass
            };

            // Override getPlayer for this context
            var origGetPlayer = window.getPlayer || getPlayer;

            renderSingleEliminationBracket(tournamentObj);
        } else {
            var desc = isEn ? (t.description_en || t.description || '') : (t.description || '');
            if (desc) {
                bracketContainer.innerHTML =
                    '<div style="max-width:800px">' +
                        '<h3 style="color:var(--text-primary);margin-bottom:var(--space-md)">' + L.description + '</h3>' +
                        '<p style="color:var(--text-secondary);line-height:1.8;font-size:1rem">' + desc.replace(/\n/g, '<br>') + '</p>' +
                    '</div>';
            } else {
                bracketContainer.innerHTML = '<div class="td-no-results"><p>' + L.scheduleSoon + '</p></div>';
            }
        }
    }

    // ---- Schedule from matches ----
    var scheduleFilters = document.getElementById('scheduleFilters');
    var scheduleList = document.getElementById('scheduleList');
    if (scheduleFilters) scheduleFilters.innerHTML = '';

    if (scheduleList) {
        if (matches.length > 0) {
            // Group matches by day
            var dayMap = {};
            var dayOrder = [];
            matches.forEach(function(m) {
                var day = m.scheduled_day || 'TBD';
                if (!dayMap[day]) {
                    dayMap[day] = [];
                    dayOrder.push(day);
                }
                dayMap[day].push(m);
            });

            var courtLabel = isEn ? 'Court' : 'Корт';
            var schedHtml = '';
            dayOrder.forEach(function(day) {
                var dayLabel = day !== 'TBD' ? new Date(day + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'long' }) : 'TBD';
                schedHtml += '<div class="td-schedule-day" data-day="' + day + '">' +
                    '<h3 class="td-schedule-day-title">' + dayLabel + '</h3>' +
                    '<div class="td-schedule-matches">';

                dayMap[day].forEach(function(m) {
                    var p1 = playersMap[m.player1_id] || {};
                    var p2 = playersMap[m.player2_id] || {};
                    var p1Name = isEn ? (p1.name_en || p1.name || 'TBD') : (p1.name || 'TBD');
                    var p2Name = isEn ? (p2.name_en || p2.name || 'TBD') : (p2.name || 'TBD');

                    schedHtml += '<div class="td-schedule-match ' + (m.status || 'upcoming') + '">' +
                        '<div class="td-schedule-time">' + (m.scheduled_time || '—') + '</div>' +
                        '<div class="td-schedule-court">' + courtLabel + ' ' + (m.court || '—') + '</div>' +
                        '<div class="td-schedule-players">' +
                            '<span class="td-schedule-p1 ' + (m.winner_id === m.player1_id ? 'winner' : '') + '">' + p1Name + '</span>' +
                            '<span class="td-schedule-vs">vs</span>' +
                            '<span class="td-schedule-p2 ' + (m.winner_id === m.player2_id ? 'winner' : '') + '">' + p2Name + '</span>' +
                        '</div>' +
                        '<div class="td-schedule-round">' + (m.round || '') + '</div>' +
                        '<div class="td-schedule-score">' + (m.score || '—') + '</div>' +
                        '<div class="td-schedule-status">' +
                            '<span class="td-status-pill ' + (m.status || 'upcoming') + '">' +
                                getStatusLabel(m.status || 'upcoming') +
                            '</span>' +
                        '</div>' +
                    '</div>';
                });

                schedHtml += '</div></div>';
            });
            scheduleList.innerHTML = schedHtml;

            // Add day filters
            if (scheduleFilters && dayOrder.length > 1) {
                var allLabel = isEn ? 'All Days' : 'Все дни';
                var fHtml = '<button class="filter-btn active" data-day="all">' + allLabel + '</button>';
                dayOrder.forEach(function(day) {
                    var dayLabel = day !== 'TBD' ? new Date(day + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' }) : 'TBD';
                    fHtml += '<button class="filter-btn" data-day="' + day + '">' + dayLabel + '</button>';
                });
                scheduleFilters.innerHTML = fHtml;
                initScheduleFilters();
            }
        } else {
            scheduleList.innerHTML = '<div class="td-no-results"><p>' + L.scheduleSoon + '</p></div>';
        }
    }

    // ---- Participants from registrations ----
    var participantsGrid = document.getElementById('participantsGrid');
    if (participantsGrid) {
        var approvedRegs = registrations.filter(function(r) { return r.status === 'approved'; });
        if (approvedRegs.length > 0) {
            var partHtml = '';
            approvedRegs.sort(function(a, b) {
                return (a.seed_number || 999) - (b.seed_number || 999);
            });
            approvedRegs.forEach(function(reg) {
                var p = reg.players || playersMap[reg.player_id] || {};
                var pName = isEn ? (p.name_en || p.name || reg.player_id) : (p.name || reg.player_id);
                partHtml += '<div class="td-participant-card">' +
                    '<div class="td-participant-info">' +
                        (reg.seed_number ? '<span class="td-participant-seed">[' + reg.seed_number + ']</span>' : '') +
                        '<span class="td-participant-name">' + pName + '</span>' +
                        '<span class="td-participant-country">' + (p.country || '') + '</span>' +
                    '</div>' +
                '</div>';
            });
            participantsGrid.innerHTML = partHtml;
        } else {
            participantsGrid.innerHTML = '<div class="td-no-results"><p>' + L.noParticipants + '</p></div>';
        }
    }

    // ---- Registration button for players ----
    if (t.status === 'registration_open') {
        renderRegistrationButton(t, registrations, isEn);
    }

    // ---- Results from matches ----
    var resultsPodium = document.getElementById('resultsPodium');
    if (resultsPodium) {
        if (t.status === 'completed' && matches.length > 0) {
            var drawSize = t.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var finalMatch = matches.find(function(m) { return m.round_number === totalRounds && m.round !== '3RD'; });

            if (finalMatch && finalMatch.winner_id) {
                var winner = playersMap[finalMatch.winner_id] || {};
                var finalist_id = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                var finalist = playersMap[finalist_id] || {};

                var placeLabel = isEn ? 'place' : 'место';
                var resHtml = '<div class="td-podium">' +
                    '<div class="td-podium-card td-podium-1">' +
                        '<div class="td-podium-medal">🥇</div>' +
                        '<div class="td-podium-place">1-e ' + placeLabel + '</div>' +
                        '<div class="td-podium-name">' + (isEn ? (winner.name_en || winner.name || '?') : (winner.name || '?')) + '</div>' +
                    '</div>' +
                    '<div class="td-podium-card td-podium-2">' +
                        '<div class="td-podium-medal">🥈</div>' +
                        '<div class="td-podium-place">2-e ' + placeLabel + '</div>' +
                        '<div class="td-podium-name">' + (isEn ? (finalist.name_en || finalist.name || '?') : (finalist.name || '?')) + '</div>' +
                    '</div>';

                // 3rd place match result
                var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
                if (thirdPlaceMatch) {
                    var thirdPlayer = playersMap[thirdPlaceMatch.winner_id] || {};
                    resHtml += '<div class="td-podium-card td-podium-3">' +
                        '<div class="td-podium-medal">🥉</div>' +
                        '<div class="td-podium-place">3-e ' + placeLabel + '</div>' +
                        '<div class="td-podium-name">' + (isEn ? (thirdPlayer.name_en || thirdPlayer.name || '?') : (thirdPlayer.name || '?')) + '</div>' +
                    '</div>';
                    var fourthId = thirdPlaceMatch.winner_id === thirdPlaceMatch.player1_id ? thirdPlaceMatch.player2_id : thirdPlaceMatch.player1_id;
                    if (fourthId) {
                        var fourthPlayer = playersMap[fourthId] || {};
                        resHtml += '<div class="td-podium-card td-podium-4">' +
                            '<div class="td-podium-medal">4</div>' +
                            '<div class="td-podium-place">4-e ' + placeLabel + '</div>' +
                            '<div class="td-podium-name">' + (isEn ? (fourthPlayer.name_en || fourthPlayer.name || '?') : (fourthPlayer.name || '?')) + '</div>' +
                        '</div>';
                    }
                } else {
                    // Fallback: show SF losers as 3rd place (no 3rd place match)
                    var sfMatches = matches.filter(function(m) { return m.round_number === totalRounds - 1 && m.status === 'completed'; });
                    sfMatches.forEach(function(m) {
                        var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                        if (loserId) {
                            var sfPlayer = playersMap[loserId] || {};
                            resHtml += '<div class="td-podium-card td-podium-3">' +
                                '<div class="td-podium-medal">🥉</div>' +
                                '<div class="td-podium-place">3-e ' + placeLabel + '</div>' +
                                '<div class="td-podium-name">' + (isEn ? (sfPlayer.name_en || sfPlayer.name || '?') : (sfPlayer.name || '?')) + '</div>' +
                            '</div>';
                        }
                    });
                }

                resHtml += '</div>';
                resultsPodium.innerHTML = resHtml;
            } else {
                resultsPodium.innerHTML = '<div class="td-no-results"><p>' + L.noResults + '</p></div>';
            }
        } else {
            resultsPodium.innerHTML = '<div class="td-no-results"><p>' + L.noResults + '</p></div>';
        }
    }

    // Init tabs navigation
    initTabsNavigation();
}

// ========================================
// PLAYER REGISTRATION BUTTON
// ========================================

function renderRegistrationButton(tournament, registrations, isEn) {
    var client = window.supabaseClient;
    if (!client) return;

    // Check if user is logged in and has a player_id
    client.auth.getUser().then(function(userRes) {
        if (!userRes.data || !userRes.data.user) return;
        var userId = userRes.data.user.id;

        client.from('profiles').select('player_id').eq('id', userId).single().then(function(profRes) {
            if (!profRes.data || !profRes.data.player_id) return;
            var playerId = profRes.data.player_id;

            // Check if already registered
            var alreadyRegistered = registrations.find(function(r) { return r.player_id === playerId; });

            // Check category match
            client.from('players').select('category_id').eq('id', playerId).single().then(async function(plRes) {
                if (!plRes.data) return;

                var categoryMatch = !tournament.category_id || plRes.data.category_id === tournament.category_id;

                // Check membership
                var membershipOk = false;
                var paidOk = false;
                if (window.checkMembership) {
                    var memResult = await window.checkMembership();
                    membershipOk = memResult && memResult.active;
                    paidOk = memResult && memResult.paid;
                }

                var pricingUrl = isEn ? 'pricing-en.html' : 'pricing.html';

                // Find hero content to append button
                var heroContent = document.querySelector('.td-hero-content');
                if (!heroContent) return;

                var btnHtml = '<div class="td-registration-area" style="margin-top:var(--space-md);">';

                if (alreadyRegistered) {
                    var statusLabels = isEn
                        ? { pending: 'Registration Pending', approved: 'Registered', rejected: 'Registration Rejected', withdrawn: 'Withdrawn' }
                        : { pending: 'Заявка на рассмотрении', approved: 'Вы зарегистрированы', rejected: 'Заявка отклонена', withdrawn: 'Заявка отозвана' };
                    btnHtml += '<span class="td-reg-status" style="display:inline-block;padding:8px 16px;border-radius:8px;background:rgba(204,255,0,0.15);color:var(--accent);font-weight:500;">' +
                        statusLabels[alreadyRegistered.status] + '</span>';
                } else if (!categoryMatch) {
                    btnHtml += '<span style="color:var(--text-secondary);font-size:0.9rem;">' +
                        (isEn ? 'Your category does not match this tournament' : 'Ваша категория не соответствует этому турниру') + '</span>';
                } else if (!membershipOk) {
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);">' +
                        '<div style="color:#ffc107;font-weight:500;margin-bottom:4px;">' +
                            (isEn ? 'Active KSLT membership required' : 'Требуется активное членство KSLT') +
                        '</div>' +
                        '<a href="' + pricingUrl + '" style="color:var(--accent);font-size:0.85rem;">' +
                            (isEn ? 'View membership plans →' : 'Узнать о членстве →') +
                        '</a>' +
                    '</div>';
                } else if (!paidOk) {
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);">' +
                        '<div style="color:#ffc107;font-weight:500;margin-bottom:4px;">' +
                            (isEn ? 'Please pay your membership to register' : 'Оплатите членство для записи на турнир') +
                        '</div>' +
                        '<a href="' + pricingUrl + '" style="color:var(--accent);font-size:0.85rem;">' +
                            (isEn ? 'Go to payment →' : 'Перейти к оплате →') +
                        '</a>' +
                    '</div>';
                } else {
                    btnHtml += '<button class="td-register-btn" id="tdRegisterBtn" style="padding:10px 24px;border:none;border-radius:8px;background:var(--accent);color:#000;font-weight:600;cursor:pointer;font-size:1rem;">' +
                        (isEn ? 'Register for Tournament' : 'Записаться на турнир') + '</button>';
                }

                btnHtml += '</div>';
                heroContent.insertAdjacentHTML('beforeend', btnHtml);

                // Register button click handler
                var regBtn = document.getElementById('tdRegisterBtn');
                if (regBtn) {
                    regBtn.addEventListener('click', async function() {
                        regBtn.disabled = true;
                        regBtn.textContent = isEn ? 'Registering...' : 'Отправка...';

                        var res = await client.from('tournament_registrations').insert({
                            tournament_id: tournament.id,
                            player_id: playerId,
                            status: 'pending'
                        });

                        if (res.error) {
                            alert(res.error.message);
                            regBtn.disabled = false;
                            regBtn.textContent = isEn ? 'Register for Tournament' : 'Записаться на турнир';
                            return;
                        }

                        regBtn.outerHTML = '<span class="td-reg-status" style="display:inline-block;padding:8px 16px;border-radius:8px;background:rgba(204,255,0,0.15);color:var(--accent);font-weight:500;">' +
                            (isEn ? 'Registration Submitted!' : 'Заявка отправлена!') + '</span>';
                    });
                }
            });
        });
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
