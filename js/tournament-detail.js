// ========================================
// TOURNAMENT DETAIL — Rendering Logic
// ========================================

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function tdCountryFlag(val) {
    var CU = window.KSLT_COUNTRY;
    if (!CU || !val) return val || '';
    return CU.flagEmoji(CU.normalizeCountry(val)) || val;
}

function getMapEmbed(url, fallbackAddress) {
    if (!url) {
        // No URL but have address — embed by address search
        if (fallbackAddress) return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackAddress) + '&output=embed';
        return null;
    }
    if (url.indexOf('google.com/maps') !== -1 || url.indexOf('goo.gl/maps') !== -1 || url.indexOf('maps.app.goo.gl') !== -1) {
        if (url.indexOf('/embed') !== -1) return url;
        var qMatch = url.match(/[?&]q=([^&]+)/);
        if (qMatch) return 'https://maps.google.com/maps?q=' + qMatch[1] + '&output=embed';
        var coordMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
        if (coordMatch) return 'https://maps.google.com/maps?q=' + coordMatch[1] + ',' + coordMatch[2] + '&output=embed';
        var placeMatch = url.match(/\/place\/([^/]+)/);
        if (placeMatch) return 'https://maps.google.com/maps?q=' + encodeURIComponent(placeMatch[1].replace(/\+/g, ' ')) + '&output=embed';
        // Short link (goo.gl) — can't extract coords, use address as fallback
        if (fallbackAddress) return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackAddress) + '&output=embed';
        return null;
    }
    if (url.indexOf('2gis.') !== -1) {
        var gisMatch = url.match(/\/([\d.]+)%2C([\d.]+)\//);
        if (!gisMatch) gisMatch = url.match(/\/([\d.]+),([\d.]+)\//);
        if (gisMatch) return 'https://maps.google.com/maps?q=' + gisMatch[2] + ',' + gisMatch[1] + '&output=embed';
        // 2GIS without coords — use address
        if (fallbackAddress) return 'https://maps.google.com/maps?q=' + encodeURIComponent(fallbackAddress) + '&output=embed';
    }
    return null;
}

// ---- Doubles helpers ----
function isDoublesTournamentPublic(t) {
    return t && (t.format === 'doubles' || t.format === 'mixed_doubles');
}

/**
 * Идут ли за турнир рейтинговые очки.
 *
 * Не идут за дружеские выходного дня и за все парные — и обычные, и
 * смешанные: рейтинг у КСЛТ личный, а в паре не разберёшь, чья заслуга.
 * Показывать таблицу очков там нечестно: она всегда пустая, а человек
 * думает, что данные потерялись.
 */
function isRatingTournament(t) {
    if (!t) return false;
    if (t.category_id === 'friendly') return false;
    if (t.format === 'doubles' || t.format === 'mixed_doubles') return false;
    return true;
}

function buildPublicRegsMap(registrations) {
    var map = {};
    registrations.forEach(function(r) {
        var key = r.player_id || ('ext_' + r.id);
        map[key] = r;
    });
    return map;
}

function getPublicTeamName(playerId, regsMap, playersMap, isEn, isKg) {
    var p = playersMap[playerId];
    var captainName = p
        ? esc(isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name))
        : (playerId ? 'TBD' : 'BYE');

    var reg = regsMap ? regsMap[playerId] : null;
    if (!reg) return captainName;

    var partnerName = '';
    if (reg.partner_id) {
        var pp = playersMap[reg.partner_id];
        partnerName = pp
            ? esc(isEn ? (pp.name_en || pp.name) : (isKg ? (pp.name_kg || pp.name) : pp.name))
            : '?';
    } else if (reg.partner_external_name) {
        partnerName = esc(reg.partner_external_name);
    }

    if (partnerName) {
        return '<span class="td-team-name">' + captainName + ' / ' + partnerName + '</span>';
    }
    return captainName;
}

// ========================================
// PLAYER HIGHLIGHT (from player profile)
// ========================================
function applyPlayerHighlight() {
    var pid = window._tdHighlightPlayer;
    // Нажали на название турнира — открываем сетку и всё. Нажали на матч в
    // истории игрока — сетку и обводим его матчи, остальные не трогаем
    var сразуВСетку = window._tdOpenBracket || !!pid;
    if (!сразуВСетку) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var playerPage = 'player' + (isEn ? '-en' : isKg ? '-kg' : '') + '.html?id=' + pid;

    // 1) Пришли из карточки игрока — «назад» возвращает туда же
    if (pid) {
        var backLabel = isEn ? 'Back to player profile' : (isKg ? 'Оюнчунун профилине кайтуу' : 'Назад к профилю игрока');
        var backSvg = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> ';

        var goBackToPlayer = function(e) {
            e.preventDefault();
            history.back();
        };
        var heroBackLink = document.querySelector('.td-back-link');
        if (heroBackLink) {
            heroBackLink.href = playerPage;
            heroBackLink.innerHTML = backSvg + backLabel;
            heroBackLink.addEventListener('click', goBackToPlayer);
        }
        var tabsBackLink = document.getElementById('tabsBackLink');
        var tabsBackText = document.getElementById('tabsBackText');
        if (tabsBackLink) {
            tabsBackLink.href = playerPage;
            if (tabsBackText) tabsBackText.textContent = backLabel;
            tabsBackLink.addEventListener('click', goBackToPlayer);
        }
    }

    // 2) Switch to bracket tab and scroll (always)
    var bracketTab = document.querySelector('.td-tab[data-target="bracket"]');
    var bracketSection = document.getElementById('bracket');
    if (bracketTab && bracketSection) {
        document.querySelectorAll('.td-tab').forEach(function(t) { t.classList.remove('active'); });
        bracketTab.classList.add('active');

        // Сетка рисуется не сразу, и раньше мы прокручивали по её месту через
        // треть секунды — а она в тот момент ещё пустая, стоит у самого верха.
        // Страница так и оставалась на начале турнира. Теперь ждём, пока в
        // сетке появятся матчи, и прокручиваем по её настоящему месту; ещё
        // раз поправляемся, когда догрузятся картинки и высота устоится.
        var попытка = 0;
        (function прокрутить() {
            // #bracket — это заголовок раздела, матчи лежат ниже, отдельным
            // блоком. Поэтому ждём их по всей странице, а не внутри заголовка
            var готова = document.querySelector('.td-match, .td-ig-match, tr[data-player-id]');
            var куда = bracketSection.getBoundingClientRect().top + window.pageYOffset - 120;
            if (готова && куда > 0) {
                // Прыгаем сразу, без плавности: человек пришёл по ссылке
                // «показать мои игры», и ему нужна сетка, а не проезд по
                // всей странице. Плавную прокрутку браузер к тому же
                // отменяет, если в этот момент страница ещё достраивается
                window.scrollTo(0, куда);
                setTimeout(function() {
                    var снова = bracketSection.getBoundingClientRect().top + window.pageYOffset - 120;
                    if (снова > 0 && Math.abs(снова - window.pageYOffset) > 40) {
                        window.scrollTo(0, снова);
                    }
                }, 800);
                return;
            }
            if (++попытка < 40) setTimeout(прокрутить, 100);
        })();
    }

    if (!pid) return;

    // 3) Матчи игрока обводим. Остальные не гасим: раньше приглушённая сетка
    //    выглядела сломанной, а клетки без второго игрока — проходы — на её
    //    фоне читались как подсвеченные, хотя к игроку отношения не имели
    var matches = document.querySelectorAll('.td-match[data-p1], .td-ig-match[data-p1]');
    matches.forEach(function(m) {
        var p1 = m.getAttribute('data-p1');
        var p2 = m.getAttribute('data-p2');
        if (p1 === pid || p2 === pid) m.classList.add('td-match-highlight');
    });

    // 4) Его строка в групповой таблице — так же, обводкой
    var rows = document.querySelectorAll('tr[data-player-id]');
    rows.forEach(function(row) {
        if (row.getAttribute('data-player-id') === pid) {
            row.classList.add('td-rr-row-highlight');
        }
    });
}

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const tournamentId = urlParams.get('id');
    window._tdHighlightPlayer = urlParams.get('player') || '';
    window._tdOpenBracket = urlParams.get('tab') === 'bracket';

    // Always preserve ?id= in language switcher
    if (tournamentId) {
        updateLangLinks(tournamentId);
    }

    if (!tournamentId) {
        renderLockedPage(tournamentId);
        return;
    }

    // Заготовки турниров из data/tournament-detail-data.js убраны. Страница
    // смотрела в них раньше базы, и настоящий турнир мог подмениться
    // выдуманным, если совпал адрес. Ровно так же вели себя тренеры:
    // при пустой базе показывались люди, которых нет в админке

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

var TD_OUTCOMES = ['RET', 'W/O', 'DEF', 'NA'];

function reverseScore(score) {
    if (!score) return '';
    var parts = score.split(' ');
    var suffix = '';
    if (parts.length > 0 && TD_OUTCOMES.indexOf(parts[parts.length - 1]) !== -1) {
        suffix = ' ' + parts.pop();
    }
    return parts.map(function(set) {
        var p = set.split('/');
        return p[1] + '/' + p[0];
    }).join(' ') + suffix;
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
// LEAGUE BRACKET PUBLIC RENDER
// ========================================

function renderLeagueBracketPublic(leagueMatches, playersMap, prefix, isEn, isKg, predOpts) {
    // Determine draw size from R1 matches
    var r1Matches = leagueMatches.filter(function(m) { return m.round_number === 1; });
    var drawSize = 2;
    while (drawSize < r1Matches.length * 2) drawSize *= 2;
    if (drawSize < 2) drawSize = 2;
    var totalRounds = Math.log2(drawSize);

    // Build players array for getPlayer()
    var plPlayersArr = [];
    var plAddedIds = {};
    leagueMatches.forEach(function(m) {
        [m.player1_id, m.player2_id].forEach(function(pid) {
            if (pid && !plAddedIds[pid]) {
                var p = playersMap[pid];
                plPlayersArr.push({
                    id: pid,
                    name: p ? (isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name)) : 'TBD',
                    seed: null,
                    country: p ? tdCountryFlag(p.country) : ''
                });
                plAddedIds[pid] = true;
            }
        });
    });
    // Find seeds
    leagueMatches.forEach(function(m) {
        if (m.seed1 && m.player1_id) {
            var px = plPlayersArr.find(function(x) { return x.id === m.player1_id; });
            if (px) px.seed = m.seed1;
        }
        if (m.seed2 && m.player2_id) {
            var px = plPlayersArr.find(function(x) { return x.id === m.player2_id; });
            if (px) px.seed = m.seed2;
        }
    });

    // Non-3RD matches for bracket
    var nonThird = leagueMatches.filter(function(m) { return m.round !== prefix + '-3RD'; });

    // Build rounds structure
    var plRounds = [];
    for (var pr = 1; pr <= totalRounds; pr++) {
        var prMatches = nonThird.filter(function(m) { return m.round_number === pr; })
            .sort(function(a, b) { return a.match_order - b.match_order; });
        var prf = totalRounds - pr;
        var prName = prf === 0 ? (isEn ? 'Final' : (isKg ? 'Финал' : 'Финал')) :
                     prf === 1 ? (isEn ? 'Semifinal' : (isKg ? 'Жарым финал' : 'Полуфинал')) :
                     prf === 2 ? (isEn ? 'Quarterfinal' : (isKg ? 'Чейрек финал' : 'Четвертьфинал')) :
                     (isEn ? 'Round ' + pr : (isKg ? 'Раунд ' + pr : 'Раунд ' + pr));

        var prConverted = prMatches.map(function(m) {
            return {
                matchId: m.id, player1Id: m.player1_id, player2Id: m.player2_id,
                score: m.score || '', winnerId: m.winner_id, status: m.status || 'upcoming'
            };
        });
        plRounds.push({ name: prName, matches: prConverted });
    }

    var plTournObj = {
        id: 'league', bracketType: 'single_elimination', drawSize: drawSize,
        players: plPlayersArr, bracket: { rounds: plRounds }, status: 'completed'
    };

    var bHtml = '<div class="td-bracket-scroll"><div class="td-bracket">';
    plRounds.forEach(function(round, ri) {
        bHtml += '<div class="td-bracket-round">';
        bHtml += '<div class="td-round-title">' + round.name + '</div>';
        bHtml += '<div class="td-bracket-matches">';
        round.matches.forEach(function(match) { bHtml += renderMatch(plTournObj, match, predOpts); });
        bHtml += '</div></div>';
        if (ri < plRounds.length - 1) {
            var pc = Math.floor(round.matches.length / 2);
            bHtml += '<div class="td-connector-column">';
            bHtml += '<div class="td-round-title" style="visibility:hidden;">&nbsp;</div>';
            bHtml += '<div class="td-connector-inner">';
            for (var ci = 0; ci < pc; ci++) {
                bHtml += '<div class="td-connector-pair"><div class="td-conn-top"></div><div class="td-conn-mid"></div><div class="td-conn-bottom"></div></div>';
            }
            bHtml += '</div></div>';
        }
    });
    bHtml += '</div></div>';

    // 3rd place match
    var thirdMatch = leagueMatches.find(function(m) { return m.round === prefix + '-3RD'; });
    if (thirdMatch) {
        bHtml += '<div style="margin-top:20px;max-width:200px;">';
        bHtml += '<div class="td-round-title">' + (isEn ? '3rd Place' : (isKg ? '3-орун үчүн' : 'За 3-е место')) + '</div>';
        bHtml += renderMatch(plTournObj, {
            matchId: thirdMatch.id, player1Id: thirdMatch.player1_id, player2Id: thirdMatch.player2_id,
            score: thirdMatch.score || '', winnerId: thirdMatch.winner_id, status: thirdMatch.status || 'upcoming'
        }, predOpts);
        bHtml += '</div>';
    }

    return bHtml;
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

    // Check if we're on English or Kyrgyz page
    if (window.location.pathname.indexOf('-en') !== -1) {
        backUrl = 'tournaments-en.html?category=' + tournament.category;
    } else if (window.location.pathname.indexOf('-kg') !== -1) {
        backUrl = 'tournaments-kg.html?category=' + tournament.category;
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
                    '<span class="hero-stat-value">' + (tournament.bracketType === 'single_elimination' ? (typeof window.heroLabels !== 'undefined' ? window.heroLabels.elimination : 'На вылет') : tournament.bracketType === 'fic' ? (typeof window.heroLabels !== 'undefined' ? (window.heroLabels.fic || 'All Places') : 'Все места') : (typeof window.heroLabels !== 'undefined' ? window.heroLabels.roundRobin : 'Круговая')) + '</span>' +
                    '<span class="hero-stat-label">' + (typeof window.heroLabels !== 'undefined' ? window.heroLabels.format : 'Формат') + '</span>' +
                '</div>' +
            '</div>' +
        '</div>';
}

// ========================================
// FIC SECTIONS (public)
// ========================================

function выровнятьМатчиЗаМеста(корень) {
    if (!корень) return;
    корень.querySelectorAll('.td-fic-section').forEach(function(блок) {
        var сетка = блок.querySelector('.td-bracket');
        if (!сетка) return;
        var столбцы = столбцыСетки(сетка);
        блок.querySelectorAll('.td-place-match').forEach(function(матч) {
            var круг = parseInt(матч.getAttribute('data-round'), 10);
            var цель = столбцы[круг - 1];
            if (!цель) return;
            // Дальше правого края не уводим: иначе на большой сетке карточка
            // уезжает за экран.
            var сдвиг = цель.offsetLeft - сетка.offsetLeft;
            var предел = Math.max(0, блок.clientWidth - матч.offsetWidth - 8);
            матч.style.marginLeft = Math.min(сдвиг, предел) + 'px';
        });
    });
}

function столбцыСетки(сетка) {
    return Array.prototype.filter.call(сетка.children, function(e) {
        return e.classList.contains('td-bracket-round');
    });
}

function getFicSectionsPublic(drawSize, isEn) {
    // Таблица блоков живёт в общем своде правил: её же читают админка и
    // приложение, иначе третья копия рано или поздно разойдётся
    return (window.KSLT_RULES && window.KSLT_RULES.ficSections)
        ? window.KSLT_RULES.ficSections(drawSize, isEn ? 'en' : 'ru')
        : [];
}

// ========================================
// SINGLE ELIMINATION BRACKET
// ========================================

function renderSingleEliminationBracket(tournament, predOpts) {
    var container = document.getElementById('bracketContainer');
    if (!container) return;

    var rounds = tournament.bracket.rounds;
    var html = '<div class="td-bracket-scroll"><div class="td-bracket">';

    rounds.forEach(function(round, roundIndex) {
        html += '<div class="td-bracket-round">' +
            '<div class="td-round-title">' + round.name + '</div>' +
            '<div class="td-bracket-matches">';

        round.matches.forEach(function(match) {
            html += renderMatch(tournament, match, predOpts);
        });

        html += '</div></div>';

        // Connector column between rounds
        if (roundIndex < rounds.length - 1) {
            var pairCount = Math.floor(round.matches.length / 2);
            html += '<div class="td-connector-column">' +
                '<div class="td-round-title" style="visibility:hidden;">&nbsp;</div>' +
                '<div class="td-connector-inner">';
            for (var i = 0; i < pairCount; i++) {
                html += '<div class="td-connector-pair">' +
                    '<div class="td-conn-top"></div>' +
                    '<div class="td-conn-mid"></div>' +
                    '<div class="td-conn-bottom"></div>' +
                '</div>';
            }
            html += '</div></div>';
        }
    });

    html += '</div></div>';
    container.innerHTML = html;
}

var tdИтоги = {};

/** Есть ли в блоке хоть один человек. */
function ficВБлокеЕстьЛюди(section, matches) {
    var клетки = section.rounds.map(function(rd) {
        return [rd.roundNum, rd.matchStart, rd.matchEnd];
    });
    if (section.placeMatch) {
        клетки.push([section.placeMatch.roundNum,
                     section.placeMatch.matchOrder, section.placeMatch.matchOrder]);
    }
    return matches.some(function(m) {
        if (!m.player1_id && !m.player2_id) return false;
        return клетки.some(function(к) {
            return m.round_number === к[0] && m.match_order >= к[1] && m.match_order <= к[2];
        });
    });
}

function renderMatch(tournament, match, predOpts) {
    var p1 = getPlayer(tournament, match.player1Id);
    var p2 = getPlayer(tournament, match.player2Id);

    // Пустая клетка бывает двух родов: BYE — соперника не будет вовсе,
    // TBD — он ещё не определился и приедет из прошлого круга. Решает общий
    // счёт: проход там, где в клетке в итоге окажется ровно один человек.
    var этоПроход = tdИтоги[match.roundNum + ':' + match.matchOrder] === 1;
    // «BYE» пишем только напротив человека: в пустой клетке писать нечего.
    этоПроход = этоПроход && !!(match.player1Id || match.player2Id);
    if (!match.player1Id && match.player2Id && этоПроход) {
        p1 = { name: 'BYE', seed: null, country: '' };
    }
    if (!match.player2Id && match.player1Id && этоПроход) {
        p2 = { name: 'BYE', seed: null, country: '' };
    }
    var rawScores = match.score ? match.score.split(' ') : [];
    var matchOutcome = '';
    if (rawScores.length > 0 && TD_OUTCOMES.indexOf(rawScores[rawScores.length - 1]) !== -1) {
        matchOutcome = rawScores.pop();
    }
    var scores = rawScores;

    var p1Class = match.winnerId === match.player1Id ? 'winner' : (match.winnerId ? 'loser' : '');
    var p2Class = match.winnerId === match.player2Id ? 'winner' : (match.winnerId ? 'loser' : '');

    // Номер матча нужен кнопке «вписать счёт»: по нему открывается окно
    var html = '<div class="td-match ' + match.status + '" data-p1="' + (match.player1Id || '') + '" data-p2="' + (match.player2Id || '') + '"' +
        (match.matchId ? ' data-match-id="' + match.matchId + '"' : '') + '>';

    // Player 1
    html += '<div class="td-match-player ' + p1Class + '">' +
        (p1.seed ? '<span class="td-seed">[' + p1.seed + ']</span>' : '<span class="td-seed"></span>') +
        '<span class="td-player-name">' + p1.name + '</span>';

    if (match.status === 'live' && scores.length > 0) {
        // Live: show current score
        html += '<span class="td-match-score live-score">' + scores.join(' ') + '</span>';
    } else {
        scores.forEach(function(s) {
            var parts = s.split('/');
            html += '<span class="td-match-score">' + (parts[0] || '') + '</span>';
        });
    }
    if (matchOutcome) html += '<span class="td-match-outcome">' + matchOutcome + '</span>';
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

    // Prediction bar (non-completed matches with two known players)
    if (predOpts && match.status !== 'completed' && match.player1Id && match.player2Id) {
        var p1Data = predOpts.playersMap[match.player1Id];
        var p2Data = predOpts.playersMap[match.player2Id];
        if (p1Data && p2Data && (p1Data.points || p2Data.points)) {
            var pred = calculatePrediction(p1Data, p2Data, predOpts.h2hMap);
            var isLeftFav = pred.p1Pct >= pred.p2Pct;
            // Short surname for bar label
            var p1Short = (p1.name || '').split(' ').pop() || '';
            var p2Short = (p2.name || '').split(' ').pop() || '';
            html += '<div class="td-prediction">' +
                '<div class="td-pred-names">' +
                    '<span class="td-pred-name">' + esc(p1Short) + '</span>' +
                    '<span class="td-pred-name">' + esc(p2Short) + '</span>' +
                '</div>' +
                '<div class="td-pred-bar" title="' + esc(predOpts.tooltip) + '">' +
                    '<div class="td-pred-fill ' + (isLeftFav ? 'td-pred-fav' : 'td-pred-dog') + '" data-width="' + pred.p1Pct + '%" style="width:0">' +
                        '<span class="td-pred-pct">' + pred.p1Pct + '%</span>' +
                    '</div>' +
                    '<div class="td-pred-fill ' + (isLeftFav ? 'td-pred-dog' : 'td-pred-fav') + '" data-width="' + pred.p2Pct + '%" style="width:0">' +
                        '<span class="td-pred-pct">' + pred.p2Pct + '%</span>' +
                    '</div>' +
                '</div>' +
                '<div class="td-pred-label">' + predOpts.label + '</div>' +
            '</div>';
        }
    }

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
        var rrGroupHasResults = group.matches && group.matches.some(function(m) { return m.status === 'completed'; });

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

            html += '<tr data-player-id="' + (standing.playerId || '') + '">' +
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

            var rrPlaceDisplay = rrGroupHasResults ? standing.place : '—';
            html += '<td class="td-rr-stat">' + standing.wins + '</td>' +
                '<td class="td-rr-stat td-rr-points">' + standing.points + '</td>' +
                '<td class="td-rr-stat td-rr-place">' + rrPlaceDisplay + '</td>' +
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

    // --- Back link inside tabs bar ---
    var heroBackLink = document.querySelector('.td-back-link');
    var tabsBackLink = document.getElementById('tabsBackLink');
    var tabsBackText = document.getElementById('tabsBackText');

    if (heroBackLink && tabsBackLink && tabsBackText) {
        tabsBackLink.href = heroBackLink.href;
        tabsBackText.textContent = heroBackLink.textContent.trim();

        // Show back link when hero back link scrolls out of view
        var backObserver = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                tabsBackLink.classList.toggle('visible', !entry.isIntersecting);
            });
        }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' });
        backObserver.observe(heroBackLink);
    }

    // --- Helpers ---
    // Get absolute document-top of element (unaffected by sticky)
    function getDocTop(el) {
        var top = 0;
        while (el) {
            top += el.offsetTop;
            el = el.offsetParent;
        }
        return top;
    }

    var SCROLL_OFFSET = 120; // 64px header + ~50px tabs + 6px gap

    // --- Tab click → scroll to section header ---
    tabsBar.addEventListener('click', function(e) {
        var tab = e.target.closest('.td-tab');
        if (!tab) return;

        tabsBar.querySelectorAll('.td-tab').forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');

        var targetId = tab.dataset.target;
        var targetSection = document.getElementById(targetId);
        if (targetSection) {
            window.scrollTo({ top: getDocTop(targetSection) - SCROLL_OFFSET, behavior: 'smooth' });
        }
    });

    // Update active tab on scroll (observe section headers which hold the IDs)
    var sectionHeaders = document.querySelectorAll('.td-section-header');
    var tabObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var id = entry.target.id;
                tabsBar.querySelectorAll('.td-tab').forEach(function(t) {
                    t.classList.toggle('active', t.dataset.target === id);
                });
            }
        });
    }, { rootMargin: '-140px 0px -60% 0px' });

    sectionHeaders.forEach(function(sh) { tabObserver.observe(sh); });

    // Click on section header → scroll to next section
    sectionHeaders.forEach(function(sh) {
        sh.addEventListener('click', function() {
            var next = sh.nextElementSibling;
            if (next) next = next.nextElementSibling;
            if (next && next.classList.contains('td-section-header')) {
                window.scrollTo({ top: getDocTop(next) - SCROLL_OFFSET, behavior: 'smooth' });
            }
        });
    });
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
// PREDICTION ENGINE
// ========================================

function buildH2HMap(h2hRows) {
    var map = {};
    h2hRows.forEach(function(r) {
        var a = r.player1_id < r.player2_id ? r.player1_id : r.player2_id;
        var b = r.player1_id < r.player2_id ? r.player2_id : r.player1_id;
        var key = a + ':' + b;
        if (!map[key]) map[key] = {};
        if (!map[key][r.winner_id]) map[key][r.winner_id] = 0;
        map[key][r.winner_id]++;
    });
    return map;
}

// Расчёт прогноза и анимация полос переехали в js/match-prediction.js:
// тот же вопрос «кто фаворит» задаёт и страница баттла, а две копии одной
// формулы в разных файлах однажды разойдутся.
function calculatePrediction(p1Data, p2Data, h2hMap) {
    return window.KSLT_PREDICTION.calculate(p1Data, p2Data, h2hMap);
}

function initPredictionAnimations() {
    window.KSLT_PREDICTION.animate('.td-prediction');
}

// ========================================
// SUPABASE TOURNAMENT SUPPORT
// ========================================

function incrementTournamentView(client, id) {
    if (!id) return;
    var key = 'kslt_tview_' + id;
    if (localStorage.getItem(key)) return;
    client.rpc('increment_tournament_view', { p_tournament_id: id }).then(function(res) {
        if (!res.error) localStorage.setItem(key, '1');
    });
}

function loadFromSupabase(client, id) {
    // Запоминаем, чем грузили: после подачи заявки страницу надо перечитать,
    // чтобы человек увидел себя в участниках, а не жал обновление руками
    window.ksltReload = function() { loadFromSupabase(client, id); };
    client.from('tournaments').select('*').eq('id', id).single()
        .then(function(result) {
            if (result.error || !result.data) {
                renderLockedPage(id);
                return;
            }
            var tournament = result.data;
            incrementTournamentView(client, id);

            // Load matches, registrations, and players in parallel
            var matchesPromise = client.from('matches')
                .select('*')
                .eq('tournament_id', id)
                .order('round_number', { ascending: true })
                .order('match_order', { ascending: true });

            var regsPromise = client.from('tournament_registrations')
                .select('*')
                .eq('tournament_id', id)
                .order('registered_at', { ascending: true });

            // Doubles: will also need partner player data

            var courtPromise = tournament.court_id
                ? client.from('courts').select('id, name, name_en, street, street_en, building, city, city_en, google_maps_url, twogis_url, photo').eq('id', tournament.court_id).single()
                : Promise.resolve({ data: null });

            Promise.all([matchesPromise, regsPromise, courtPromise]).then(function(results) {
                var matches = results[0].data || [];
                var registrations = results[1].data || [];
                var courtData = results[2].data || null;

                // Build players map (include partner_ids for doubles)
                var playerIds = [];
                registrations.forEach(function(r) {
                    if (r.player_id) playerIds.push(r.player_id);
                    if (r.partner_id) playerIds.push(r.partner_id);
                });
                matches.forEach(function(m) {
                    if (m.player1_id) playerIds.push(m.player1_id);
                    if (m.player2_id) playerIds.push(m.player2_id);
                    if (m.winner_id) playerIds.push(m.winner_id);
                });
                playerIds = playerIds.filter(function(v, i) { return playerIds.indexOf(v) === i; });

                if (playerIds.length > 0) {
                    var playersPromise = client.from('players').select('id, name, name_en, photo, points, country, category_id, wins, losses, form').in('id', playerIds);
                    var h2hPromise = client.from('matches')
                        .select('player1_id, player2_id, winner_id')
                        .not('winner_id', 'is', null)
                        .in('player1_id', playerIds)
                        .in('player2_id', playerIds);

                    Promise.all([playersPromise, h2hPromise]).then(function(res) {
                        var playersMap = {};
                        (res[0].data || []).forEach(function(p) { playersMap[p.id] = p; });
                        var h2hMap = buildH2HMap(res[1].data || []);
                        renderSupabaseTournament(tournament, matches, registrations, playersMap, courtData, h2hMap);
                    });
                } else {
                    renderSupabaseTournament(tournament, matches, registrations, {}, courtData, {});
                }
            });
        })
        .catch(function(e) {
            console.error('Error loading tournament from Supabase:', e);
            renderLockedPage(id);
        });
}

function computeStatus(regStart, regEnd, dateStart, dateEnd) {
    var now = new Date().toISOString().substring(0, 10);
    if (regStart && now < regStart) return 'upcoming';
    if (regStart && regEnd && now >= regStart && now <= regEnd) return 'registration_open';
    if (dateEnd && now > dateEnd) return 'completed';
    if (dateStart && now >= dateStart) return 'ongoing';
    if (regEnd && now > regEnd) return 'registration_closed';
    return 'upcoming';
}

/**
 * Места в шапке турнира. Пока свободных много — показываем вместимость,
 * с двух третей заполнения переходим на остаток: та же граница, что на
 * карточках, чтобы человек не видел на странице другую цифру.
 */
function heroSlots(t, registrations, L) {
    if (!window.KSLT_SLOTS) return '';
    var main = window.KSLT_SLOTS.MAIN_DRAW;
    var taken = (registrations || []).filter(function(r) { return main.indexOf(r.status) !== -1; }).length;
    var st = window.KSLT_SLOTS.stat(t, taken, t.status);
    if (!st) return '';

    return '<div class="hero-stat' + (st.tight ? ' hero-stat-tight' : '') + '">' +
               '<span class="hero-stat-value">' + st.value + '</span>' +
               '<span class="hero-stat-label">' + st.label + '</span>' +
           '</div>';
}

function renderSupabaseTournament(t, matches, registrations, playersMap, courtData, h2hMap) {
    h2hMap = h2hMap || {};
    matches = matches || [];
    registrations = registrations || [];
    playersMap = playersMap || {};
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var isDbl = isDoublesTournamentPublic(t);
    var regsMap = isDbl ? buildPublicRegsMap(registrations) : null;

    // Helper: get player/team display name (respects doubles)
    function pName(playerId) {
        if (isDbl) return getPublicTeamName(playerId, regsMap, playersMap, isEn, isKg);
        var p = playersMap[playerId];
        return p ? esc(isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name)) : (playerId ? 'TBD' : 'BYE');
    }

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

    // Registration dates line (show only if reg_end >= today)
    var today = new Date().toISOString().substring(0, 10);
    var regDateRange = '';
    if (t.registration_start && t.registration_end && t.registration_end >= today) {
        var rs = new Date(t.registration_start + 'T00:00:00');
        var re = new Date(t.registration_end + 'T00:00:00');
        regDateRange = rs.getDate() + ' ' + months[rs.getMonth()] + ' — ' + re.getDate() + ' ' + months[re.getMonth()] + ' ' + rs.getFullYear();
    }

    // Auto-compute status (with overrides)
    var effectiveStatus;
    if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
        effectiveStatus = t.status;
    } else {
        effectiveStatus = computeStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
    }

    // Status labels & CSS class mapping
    var statusLabels = isEn
        ? { registration_open: 'Registration Open', upcoming: 'Coming Soon', registration_closed: 'Registration Closed', ongoing: 'In Progress', completed: 'Completed', cancelled: 'Cancelled' }
        : (isKg ? { registration_open: 'Каттоо ачык', upcoming: 'Жакында', registration_closed: 'Каттоо жабык', ongoing: 'Жүрүп жатат', completed: 'Аяктады', cancelled: 'Жокко чыгарылды' }
        : { registration_open: 'Регистрация открыта', upcoming: 'Скоро', registration_closed: 'Регистрация закрыта', ongoing: 'Идёт', completed: 'Завершён', cancelled: 'Отменён' });

    var statusClassMap = { registration_open: 'live', registration_closed: 'upcoming', ongoing: 'live', cancelled: 'completed', upcoming: 'upcoming', completed: 'completed' };
    var statusClass = statusClassMap[effectiveStatus] || 'upcoming';
    var statusText = statusLabels[effectiveStatus] || effectiveStatus;

    // Format labels
    var formatLabels = isEn
        ? { singles: 'Singles', doubles: 'Doubles', mixed_doubles: 'Mixed Doubles' }
        : (isKg ? { singles: 'Жалгыз', doubles: 'Жуптук', mixed_doubles: 'Аралаш жуптук' }
        : { singles: 'Одиночный', doubles: 'Парный', mixed_doubles: 'Смешанный парный' });

    // Category name from category_id
    var catId = t.category_id || '';
    var catName = catId.charAt(0).toUpperCase() + catId.slice(1);
    var category = catId;

    // Gender badge (from tournament.gender field)
    var gender = t.gender || '';
    var genderLabel = gender === 'women'
        ? (isEn ? '♀ Women' : (isKg ? '♀ Аялдар' : '♀ Женский'))
        : gender === 'men'
        ? (isEn ? '♂ Men' : (isKg ? '♂ Эркектер' : '♂ Мужской'))
        : gender === 'mixed'
        ? (isEn ? '⚤ Mixed' : (isKg ? '⚤ Аралаш' : '⚤ Смешанный'))
        : '';

    var backUrl = isEn
        ? 'tournaments-en.html?category=' + category
        : (isKg ? 'tournaments-kg.html?category=' + category
        : 'tournaments.html?category=' + category);

    var L = isEn ? {
        format: 'Format', participants: 'Participants', pairs: 'Pairs', prizeFund: 'Prize Fund',
        fee: 'Entry fee', feePair: 'Entry fee per player', som: 'som',
        feeYouMember: 'You are a KSLT member — your fee is {sum} {cur}',
        feeYouGuest: 'Your fee is {sum} {cur}. KSLT membership brings it down to {member} {cur}',
        description: 'About Tournament', scheduleSoon: 'Schedule will be published soon',
        noParticipants: 'Participants will be announced soon',
        noResults: 'Points will be awarded after the tournament ends',
        noResultsPlain: 'Results will appear after the tournament ends',
        countdownTitle: 'TOURNAMENT STARTS IN',
        countdownDays: 'days', countdownHours: 'hours', countdownMin: 'min', countdownSec: 'sec',
        tournamentLive: 'Tournament in progress',
        regClosingSoon: 'Registration closes in less than 24 hours!'
    } : (isKg ? {
        format: 'Формат', participants: 'Катышуучулар', pairs: 'Жуптар', prizeFund: 'Сыйлык фонду',
        fee: 'Катышуу акысы', feePair: 'Катышуу акысы оюнчудан', som: 'сом',
        feeYouMember: 'Сиз КСЛТ мүчөсүсүз — сиздин акыңыз {sum} {cur}',
        feeYouGuest: 'Сиздин акыңыз {sum} {cur}. КСЛТ мүчөлүгү менен {member} {cur} болот',
        description: 'Мелдеш жөнүндө', scheduleSoon: 'Тартип кийинчерээк жарыяланат',
        noParticipants: 'Катышуучулар кийинчерээк жарыяланат',
        noResults: 'Жыйынтыктар мелдеш аяктагандан кийин жеткиликтүү болот',
        noResultsPlain: 'Жыйынтыктар мелдеш аяктагандан кийин чыгат',
        countdownTitle: 'МЕЛДЕШ БАШТАЛГАНГА',
        countdownDays: 'күн', countdownHours: 'саат', countdownMin: 'мүн', countdownSec: 'сек',
        tournamentLive: 'Мелдеш жүрүп жатат',
        regClosingSoon: 'Каттоо 24 сааттан кийин жабылат!'
    } : {
        format: 'Формат', participants: 'Участники', pairs: 'Пар', prizeFund: 'Призовой фонд',
        fee: 'Взнос', feePair: 'Взнос с участника', som: 'сом',
        feeYouMember: 'Вы член КСЛТ — ваш взнос {sum} {cur}',
        feeYouGuest: 'Ваш взнос {sum} {cur}. С членством КСЛТ — {member} {cur}',
        description: 'О турнире', scheduleSoon: 'Расписание будет опубликовано позже',
        noParticipants: 'Участники будут объявлены позже',
        noResults: 'Очки будут начислены после завершения турнира',
        noResultsPlain: 'Результаты появятся после завершения турнира',
        countdownTitle: 'ТУРНИР НАЧИНАЕТСЯ ЧЕРЕЗ',
        countdownDays: 'дней', countdownHours: 'часов', countdownMin: 'минут', countdownSec: 'секунд',
        tournamentLive: 'Турнир идёт',
        regClosingSoon: 'Регистрация закроется менее чем через 24 часа!'
    });

    // Prediction options for renderMatch
    var predOpts = {
        playersMap: playersMap,
        h2hMap: h2hMap,
        label: isEn ? 'KSLT AI Prediction' : (isKg ? 'KSLT AI Болжолу' : 'Прогноз KSLT AI'),
        tooltip: isEn ? 'Based on rating, form, and head-to-head' : (isKg ? 'Рейтинг, форма жана жолугушуулар тарыхы' : 'На основе рейтинга, формы и истории встреч')
    };

    // ---- Render Hero ----
    var hero = document.getElementById('tournamentHero');
    if (hero) {
        // Афиши у турниров теперь свои; на случай, когда её не завели,
        // подставляем картинку раздела, а не снимок с чужого сайта
        var bgImage = t.image || '../images/heroes/tournaments.jpg';
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
                    (catName ? '<span class="tournament-category-badge">' + catName + '</span>' : '') +
                    (genderLabel ? '<span class="tournament-gender-badge">' + genderLabel + '</span>' : '') +
                    '<span class="td-status-badge ' + statusClass + '">' + statusText + '</span>' +
                '</div>' +
                '<h1>' + (isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title)) + '</h1>' +
                '<div class="td-hero-meta">' +
                    '<div class="td-meta-item">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>' +
                        ' ' + dateRange +
                    '</div>' +
                    (regDateRange ? '<div class="td-meta-item td-meta-reg">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>' +
                        ' ' + (isEn ? 'Reg: ' : (isKg ? 'Кат: ' : 'Рег: ')) + regDateRange +
                    '</div>' : '') +
                    '<div class="td-meta-item">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
                        ' ' + (isEn ? (t.location_en || t.location || '') : (isKg ? (t.location_kg || t.location || '') : (t.location || ''))) +
                    '</div>' +
                '</div>' +
                '<div class="td-hero-stats">' +
                    heroSlots(t, registrations, L) +
                    // Призовой фонд без суммы раньше показывался прочерком —
                    // будто данные потерялись. Нет суммы — нет и блока
                    (t.prize_fund ? '<div class="hero-stat">' +
                        '<span class="hero-stat-value">' + t.prize_fund + '</span>' +
                        '<span class="hero-stat-label">' + L.prizeFund + '</span>' +
                    '</div>' : '') +
                    feeStat(t) +
                    '<div class="hero-stat">' +
                        '<span class="hero-stat-value">' + (formatLabels[t.format] || t.format || '—') + '</span>' +
                        '<span class="hero-stat-label">' + L.format + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="td-fee-note" id="tdFeeNote" hidden></div>' +
                '<div id="tdCountdown"></div>' +
            '</div>';
    }

    /** «1500» → «1 500»: пробел между тысячами, иначе сумма читается с трудом */
    function money(n) {
        return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    }

    /**
     * Взнос в шапке турнира. Две суммы, если заданы обе; одна, если задана
     * одна; блока нет, если не задано ничего — про деньги молчим, как и про
     * призовой фонд, которого нет.
     */
    function feeStat(t) {
        var m = t.fee_member != null ? Number(t.fee_member) : null;
        var g = t.fee_guest != null ? Number(t.fee_guest) : null;
        if (m == null && g == null) return '';
        var pair = (t.format === 'doubles' || t.format === 'mixed_doubles');
        var value = (m != null && g != null && m !== g)
            ? money(m) + ' / ' + money(g)
            : money(m != null ? m : g);
        return '<div class="hero-stat">' +
            '<span class="hero-stat-value">' + value + '</span>' +
            '<span class="hero-stat-label">' + (pair ? L.feePair : L.fee) + '</span>' +
        '</div>';
    }

    /**
     * Своя цена под шапкой.
     *
     * Две суммы в шапке — это прайс, а человеку важно, сколько платить ему.
     * Членство проверяем по действующей записи, а не по роли: роль «игрок»
     * есть и у тех, кто взнос не платил.
     */
    async function renderFeeNote(t) {
        var box = document.getElementById('tdFeeNote');
        if (!box) return;
        var m = t.fee_member != null ? Number(t.fee_member) : null;
        var g = t.fee_guest != null ? Number(t.fee_guest) : null;
        if (m == null || g == null || m === g) return;
        if (typeof window.checkMembership !== 'function') return;

        var info = null;
        try {
            info = await window.checkMembership();
        } catch (e) { return; }
        // Не вошёл — показывать «ваша цена» не за что, в шапке уже прайс
        if (!info || !window.ksltUser) return;

        var tpl = info.active ? L.feeYouMember : L.feeYouGuest;
        box.textContent = tpl
            .replace('{sum}', money(info.active ? m : g))
            .replace('{member}', money(m))
            .replace(/\{cur\}/g, L.som);
        box.classList.toggle('td-fee-note-member', !!info.active);
        box.hidden = false;
    }

    // ---- Countdown Timer ----
    initCountdown(t);
    renderFeeNote(t);

    // ---- Description section ----
    var descContent = document.getElementById('descriptionContent');
    if (descContent) {
        var descText = isEn ? (t.description_en || t.description || '') : (isKg ? (t.description_kg || t.description || '') : (t.description || ''));
        if (descText) {
            descContent.innerHTML = '<div class="td-description-text">' + descText.replace(/\n/g, '<br>') + '</div>';
        } else {
            descContent.innerHTML = '<div class="td-no-results"><p>' + (isEn ? 'No description available.' : (isKg ? 'Сүрөттөмө жок.' : 'Описание отсутствует.')) + '</p></div>';
        }
    }

    // ---- Расписание запусков ----
    //
    // Тот же порядок, что видит менеджер в админке: по кортам, от раннего
    // запуска к позднему. Только смотреть — время и пары здесь не правятся.
    var scheduleContainer = document.getElementById('scheduleContainer');
    if (scheduleContainer) {
        var расписанные = matches.filter(function(m) {
            return m.scheduled_time && m.score !== 'BYE' && (m.player1_id || m.player2_id);
        });

        if (!расписанные.length) {
            var нетРасписания = isEn ? 'The schedule is not published yet'
                : (isKg ? 'Жадыбал азырынча жарыяланган жок' : 'Расписание пока не опубликовано');
            scheduleContainer.innerHTML = '<div class="td-no-results"><p>' + нетРасписания + '</p></div>';
            var вкладкаРасп = document.querySelector('.td-tab[data-target="schedule"]');
            if (вкладкаРасп) вкладкаРасп.style.display = 'none';
            var шапкаРасп = document.getElementById('schedule');
            if (шапкаРасп) шапкаРасп.style.display = 'none';
        } else {
            var буквы = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

            // Одна очередь, как у ведущего в админке. По кортам больше не
            // делим: корт заранее известен только у первых запусков, дальше
            // его ставят по ходу дня — какой освободится, тот и будет
            var очередь = расписанные.slice().sort(function(a, b) {
                var д = String(a.scheduled_day || '').localeCompare(String(b.scheduled_day || ''));
                if (д) return д;
                var в = String(a.scheduled_time || '').localeCompare(String(b.scheduled_time || ''));
                if (в) return в;
                return String(a.court || '').localeCompare(String(b.court || ''), undefined, { numeric: true });
            });

            var подписи = isEn
                ? { court: 'Court', time: 'Time', round: 'Round', status: 'Status', group: 'Group',
                    done: 'Done', live: 'Live', soon: 'Upcoming' }
                : (isKg
                    ? { court: 'Корт', time: 'Убакыт', round: 'Раунд', status: 'Абалы', group: 'Топ',
                        done: 'Аяктады', live: 'Live', soon: 'Күтүүдө' }
                    : { court: 'Корт', time: 'Время', round: 'Раунд', status: 'Статус', group: 'Группа',
                        done: 'Завершён', live: 'Идёт', soon: 'Ожидает' });

            var расписаниеHtml = '<div class="td-sched-court">' +
                '<table class="td-sched-table"><thead><tr>' +
                    '<th>№</th>' +
                    '<th>' + подписи.time + '</th>' +
                    '<th>' + подписи.round + '</th>' +
                    '<th colspan="3">' + (isEn ? 'Match' : (isKg ? 'Оюн' : 'Игра')) + '</th>' +
                    '<th>' + подписи.court + '</th>' +
                    '<th>' + подписи.status + '</th>' +
                '</tr></thead><tbody>';

            очередь.forEach(function(m, i) {
                var круг = m.round || '';
                if (m.group_number) круг = подписи.group + ' ' + (буквы[m.group_number - 1] || m.group_number);

                var состояние = m.status === 'completed' ? подписи.done
                    : (m.status === 'live' ? подписи.live : подписи.soon);
                var классСост = m.status === 'completed' ? 'td-sched-done'
                    : (m.status === 'live' ? 'td-sched-live' : 'td-sched-soon');

                расписаниеHtml += '<tr' + (m.status === 'live' ? ' class="td-sched-row-live"' : '') + '>' +
                    '<td class="td-sched-num">' + (i + 1) + '</td>' +
                    '<td class="td-sched-time">' + esc(String(m.scheduled_time).slice(0, 5)) + '</td>' +
                    '<td><span class="td-sched-round">' + esc(круг) + '</span></td>' +
                    '<td class="td-sched-p">' + pName(m.player1_id) + '</td>' +
                    '<td class="td-sched-vs">vs</td>' +
                    '<td class="td-sched-p">' + pName(m.player2_id) + '</td>' +
                    '<td class="td-sched-court-cell">' +
                        (m.court ? подписи.court + ' ' + esc(String(m.court)) : '\u2014') + '</td>' +
                    '<td><span class="td-sched-status ' + классСост + '">' + состояние + '</span></td>' +
                '</tr>';
            });

            расписаниеHtml += '</tbody></table></div>';

            scheduleContainer.innerHTML = расписаниеHtml;
        }
    }

    // ---- Bracket section ----
    var bracketContainer = document.getElementById('bracketContainer');
    if (bracketContainer) {
        if (matches.length > 0 && (t.bracket_type === 'single_elimination' || t.bracket_type === 'fic' || t.bracket_type === 'round_robin' || t.bracket_type === 'group_league')) {

            // ---- Group League: groups + dual leagues ----
            if (t.bracket_type === 'group_league') {
                var glGroupCount = t.group_count || 2;
                var glGroupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                var glGrpMatches = matches.filter(function(m) { return m.group_number && m.group_number > 0; });
                var glPLMatches = matches.filter(function(m) { return m.round && m.round.indexOf('PL-') === 0; });
                var glCLMatches = matches.filter(function(m) { return m.round && m.round.indexOf('CL-') === 0; });
                var glHasLeagues = glPLMatches.length > 0 || glCLMatches.length > 0;
                var glAllGroupDone = glGrpMatches.length > 0 && glGrpMatches.every(function(m) { return m.status === 'completed'; });

                var glHtml = '';

                // ---- League brackets (above groups) ----
                if (glHasLeagues) {
                    glHtml += '<div class="td-dual-league">';

                    // Premier League
                    glHtml += '<div class="td-league-bracket">';
                    glHtml += '<h3 class="td-league-title td-league-title-premier">' + (isEn ? 'Premier League' : (isKg ? 'Жогорку лига' : 'Высшая лига')) + '</h3>';
                    glHtml += renderLeagueBracketPublic(glPLMatches, playersMap, 'PL', isEn, isKg, predOpts);
                    glHtml += '</div>';

                    // Consolation League
                    glHtml += '<div class="td-league-bracket">';
                    glHtml += '<h3 class="td-league-title td-league-title-consolation">' + (isEn ? 'Consolation League' : (isKg ? 'Сооротуу лигасы' : 'Утешительная лига')) + '</h3>';
                    glHtml += renderLeagueBracketPublic(glCLMatches, playersMap, 'CL', isEn, isKg, predOpts);
                    glHtml += '</div>';

                    glHtml += '</div>'; // /td-dual-league
                }

                // ---- Group tables (below) ----
                glHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Group Stage' : (isKg ? 'Топтук этап' : 'Групповой этап')) + '</h3>';
                glHtml += '<div class="td-groups-grid">';

                for (var gg = 1; gg <= glGroupCount; gg++) {
                    var ggMatches = glGrpMatches.filter(function(m) { return m.group_number === gg; });
                    if (!ggMatches.length) continue;

                    var ggPlayerIds = [];
                    ggMatches.forEach(function(m) {
                        if (m.player1_id && ggPlayerIds.indexOf(m.player1_id) === -1) ggPlayerIds.push(m.player1_id);
                        if (m.player2_id && ggPlayerIds.indexOf(m.player2_id) === -1) ggPlayerIds.push(m.player2_id);
                    });

                    var ggStats = {};
                    ggPlayerIds.forEach(function(pid) { ggStats[pid] = { playerId: pid, wins: 0, losses: 0, seed: null }; });
                    ggMatches.forEach(function(m) {
                        if (m.seed1 && ggStats[m.player1_id]) ggStats[m.player1_id].seed = m.seed1;
                        if (m.seed2 && ggStats[m.player2_id]) ggStats[m.player2_id].seed = m.seed2;
                        if (m.status === 'completed' && m.winner_id && m.score !== 'BYE') {
                            if (ggStats[m.winner_id]) ggStats[m.winner_id].wins++;
                            var lid = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                            if (ggStats[lid]) ggStats[lid].losses++;
                        }
                    });
                    var ggStandings = ggPlayerIds.map(function(pid) { return ggStats[pid]; });
                    var ggHasResults = ggMatches.some(function(m) { return m.status === 'completed'; });
                    ggStandings.sort(function(a, b) {
                        var sa = a.seed || 9999; var sb = b.seed || 9999;
                        if (sa !== sb) return sa - sb;
                        return ggPlayerIds.indexOf(a.playerId) - ggPlayerIds.indexOf(b.playerId);
                    });
                    var ggByWins = ggStandings.slice().sort(function(a, b) { return b.wins - a.wins; });
                    ggByWins.forEach(function(st, i) { st.place = i + 1; });

                    var ggMgp = t.manual_group_places || {};
                    if (ggMgp[String(gg)]) {
                        var ggOv = ggMgp[String(gg)];
                        ggStandings.forEach(function(st) {
                            if (ggOv[st.playerId] !== undefined) st.place = ggOv[st.playerId];
                        });
                    }

                    var ggLetter = glGroupLetters[gg - 1] || String(gg);
                    glHtml += '<div style="margin-bottom:24px;">';
                    glHtml += '<div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:0.95rem;">' + (isEn ? 'Group ' : (isKg ? 'Топ ' : 'Группа ')) + ggLetter + '</div>';
                    glHtml += '<div style="overflow-x:auto;"><table class="td-group-table">';
                    glHtml += '<thead><tr><th>№</th><th>' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th>';
                    for (var gc = 0; gc < ggStandings.length; gc++) glHtml += '<th style="text-align:center;min-width:65px;white-space:nowrap;">' + (gc + 1) + '</th>';
                    glHtml += '<th style="text-align:center;width:30px;">' + (isEn ? 'W' : (isKg ? 'Ж' : 'П')) + '</th>';
                    glHtml += '<th style="text-align:center;width:40px;">' + (isEn ? 'Pos' : (isKg ? 'О' : 'М')) + '</th>';
                    glHtml += '</tr></thead><tbody>';

                    for (var grow = 0; grow < ggStandings.length; grow++) {
                        var gst = ggStandings[grow];
                        var gpName = pName(gst.playerId);
                        var gSeedHtml = gst.seed ? ' <span style="color:var(--accent);font-size:0.7rem;">[' + gst.seed + ']</span>' : '';
                        var glQPG = t.qualifiers_per_group || 4;
                        var glPLCut = Math.floor(Math.min(glQPG, ggStandings.length) / 2);
                        var gIsPL = gst.place <= glPLCut && glAllGroupDone;
                        var gIsCL = gst.place > glPLCut && gst.place <= glQPG && glAllGroupDone;

                        glHtml += '<tr data-player-id="' + gst.playerId + '"' + (gIsPL && glAllGroupDone ? ' style="background:rgba(204,255,0,0.06);"' : (gIsCL && glAllGroupDone ? ' style="background:rgba(204,255,0,0.03);"' : '')) + '>';
                        glHtml += '<td style="text-align:center;font-weight:600;">' + (grow + 1) + '</td>';
                        glHtml += '<td style="white-space:nowrap;">' + gpName + gSeedHtml + '</td>';

                        for (var gcol = 0; gcol < ggStandings.length; gcol++) {
                            if (grow === gcol) {
                                glHtml += '<td style="text-align:center;background:rgba(255,255,255,0.03);color:var(--text-dim);">&times;</td>';
                            } else {
                                var gOppId = ggStandings[gcol].playerId;
                                var gMatch = ggMatches.find(function(m) {
                                    return (m.player1_id === gst.playerId && m.player2_id === gOppId) ||
                                           (m.player1_id === gOppId && m.player2_id === gst.playerId);
                                });
                                if (gMatch && gMatch.status === 'completed' && gMatch.score) {
                                    var gScoreParts = gMatch.score.split(' ');
                                    var gCellOutcome = '';
                                    if (gScoreParts.length > 0 && TD_OUTCOMES.indexOf(gScoreParts[gScoreParts.length - 1]) !== -1) {
                                        gCellOutcome = gScoreParts.pop();
                                    }
                                    var gIsWinner = gMatch.winner_id === gst.playerId;
                                    var gNeedFlip = gMatch.player1_id !== gst.playerId;
                                    var gScoreDisp = gScoreParts.map(function(s) {
                                        var pp = s.match(/^(\d+)\/(\d+)/);
                                        if (!pp) return s;
                                        return gNeedFlip ? pp[2] + ':' + pp[1] : pp[1] + ':' + pp[2];
                                    }).join(' ') + (gCellOutcome ? ' ' + gCellOutcome : '');
                                    glHtml += '<td style="text-align:center;font-size:0.8rem;' + (gIsWinner ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-secondary);') + '">' + gScoreDisp + '</td>';
                                } else {
                                    glHtml += '<td style="text-align:center;color:var(--text-dim);">—</td>';
                                }
                            }
                        }

                        glHtml += '<td style="text-align:center;font-weight:600;">' + gst.wins + '</td>';
                        glHtml += '<td style="text-align:center;font-weight:700;' + (gIsPL ? 'color:var(--accent);' : '') + '">' + (ggHasResults ? gst.place : '—') + '</td>';
                        glHtml += '</tr>';
                    }
                    glHtml += '</tbody></table></div></div>';
                }
                glHtml += '</div>'; // /td-groups-grid

                bracketContainer.innerHTML = glHtml;
            }

            // ---- Round Robin: group tables + playoff bracket ----
            else if (t.bracket_type === 'round_robin') {
                var groupCount = t.group_count || 2;
                var qualifiers = t.qualifiers_per_group || 2;
                var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
                var grpMatches = matches.filter(function(m) { return m.group_number && m.group_number > 0; });
                var igMatches = matches.filter(function(m) { return m.round === 'IG'; });
                var ploffMatches = matches.filter(function(m) { return (!m.group_number || m.group_number <= 0) && m.round !== 'IG'; });
                var hasPlayoff = ploffMatches.length > 0;
                var hasIG = igMatches.length > 0;
                var allGroupDone = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });

                var bHtml = '';

                // Playoff bracket (SE-style visual bracket above groups)
                if (hasPlayoff) {
                    // Determine playoff draw size
                    var plDrawSize = groupCount * qualifiers;
                    var d = 2; while (d < plDrawSize) d *= 2; plDrawSize = d;
                    var plTotalRounds = Math.log2(plDrawSize);

                    // Build players array for getPlayer()
                    var plPlayersArr = [];
                    var plAddedIds = {};
                    ploffMatches.forEach(function(m) {
                        [m.player1_id, m.player2_id].forEach(function(pid) {
                            if (pid && !plAddedIds[pid]) {
                                var p = playersMap[pid];
                                plPlayersArr.push({
                                    id: pid,
                                    name: p ? (isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name)) : 'TBD',
                                    seed: null,
                                    country: p ? tdCountryFlag(p.country) : ''
                                });
                                plAddedIds[pid] = true;
                            }
                        });
                    });
                    // Find seeds
                    ploffMatches.forEach(function(m) {
                        if (m.seed1 && m.player1_id) {
                            var px = plPlayersArr.find(function(x) { return x.id === m.player1_id; });
                            if (px) px.seed = m.seed1;
                        }
                        if (m.seed2 && m.player2_id) {
                            var px = plPlayersArr.find(function(x) { return x.id === m.player2_id; });
                            if (px) px.seed = m.seed2;
                        }
                    });

                    // Build rounds structure
                    var plRounds = [];
                    for (var pr = 1; pr <= plTotalRounds; pr++) {
                        var prMatches = ploffMatches.filter(function(m) { return m.round_number === pr && m.round !== '3RD'; })
                            .sort(function(a, b) { return a.match_order - b.match_order; });
                        var prf = plTotalRounds - pr;
                        var prName = prf === 0 ? (isEn ? 'Final' : (isKg ? 'Финал' : 'Финал')) :
                                     prf === 1 ? (isEn ? 'Semifinal' : (isKg ? 'Жарым финал' : 'Полуфинал')) :
                                     prf === 2 ? (isEn ? 'Quarterfinal' : (isKg ? 'Чейрек финал' : 'Четвертьфинал')) :
                                     (isEn ? 'Round ' + pr : (isKg ? 'Раунд ' + pr : 'Раунд ' + pr));

                        var prConverted = prMatches.map(function(m) {
                            return {
                                matchId: m.id, player1Id: m.player1_id, player2Id: m.player2_id,
                                score: m.score || '', winnerId: m.winner_id, status: m.status || 'upcoming'
                            };
                        });
                        plRounds.push({ name: prName, matches: prConverted });
                    }

                    var plTournObj = {
                        id: t.id, bracketType: 'single_elimination', drawSize: plDrawSize,
                        players: plPlayersArr, bracket: { rounds: plRounds }, status: statusClass
                    };

                    var thirdMatch = ploffMatches.find(function(m) { return m.round === '3RD'; });

                    bHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Playoff' : (isKg ? 'Плей-офф' : 'Плей-офф')) + '</h3>';
                    bHtml += '<div class="td-bracket-scroll"><div class="td-bracket">';
                    plRounds.forEach(function(round, ri) {
                        var isLastRound = ri === plRounds.length - 1;
                        bHtml += '<div class="td-bracket-round">';
                        bHtml += '<div class="td-round-title">' + round.name + '</div>';
                        bHtml += '<div class="td-bracket-matches">';
                        round.matches.forEach(function(match) { bHtml += renderMatch(plTournObj, match, predOpts); });
                        bHtml += '</div>';
                        bHtml += '</div>';
                        if (ri < plRounds.length - 1) {
                            var pc = Math.floor(round.matches.length / 2);
                            bHtml += '<div class="td-connector-column">';
                            bHtml += '<div class="td-round-title" style="visibility:hidden;">&nbsp;</div>';
                            bHtml += '<div class="td-connector-inner">';
                            for (var ci = 0; ci < pc; ci++) {
                                bHtml += '<div class="td-connector-pair"><div class="td-conn-top"></div><div class="td-conn-mid"></div><div class="td-conn-bottom"></div></div>';
                            }
                            bHtml += '</div></div>';
                        }
                    });
                    bHtml += '</div></div>';

                    // 3rd place — separate block under bracket
                    if (thirdMatch) {
                        bHtml += '<div style="margin-top:20px;max-width:200px;">';
                        bHtml += '<div class="td-round-title">' + (isEn ? '3rd Place' : (isKg ? '3-орун үчүн' : 'За 3-е место')) + '</div>';
                        bHtml += renderMatch(plTournObj, {
                            matchId: thirdMatch.id, player1Id: thirdMatch.player1_id, player2Id: thirdMatch.player2_id,
                            score: thirdMatch.score || '', winnerId: thirdMatch.winner_id, status: thirdMatch.status || 'upcoming'
                        }, predOpts);
                        bHtml += '</div>';
                    }

                    bHtml += '<div style="margin-bottom:32px;"></div>';
                }

                // Inter-group matches section
                if (hasIG) {
                    bHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Additional Matches' : (isKg ? 'Кошумча матчтар' : 'Дополнительные матчи')) + '</h3>';
                    bHtml += '<div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:32px;">';
                    igMatches.sort(function(a, b) { return a.match_order - b.match_order; });
                    igMatches.forEach(function(m, idx) {
                        var p1Name = pName(m.player1_id);
                        var p2Name = pName(m.player2_id);
                        var isCompleted = m.status === 'completed';
                        var isP1Winner = isCompleted && m.winner_id === m.player1_id;
                        var isP2Winner = isCompleted && m.winner_id === m.player2_id;

                        var p1Score = '', p2Score = '', igOutcomeLabel = '';
                        if (isCompleted && m.score) {
                            var rawParts = m.score.split(' ');
                            if (rawParts.length > 0 && TD_OUTCOMES.indexOf(rawParts[rawParts.length - 1]) !== -1) {
                                igOutcomeLabel = rawParts.pop();
                            }
                            var sets = rawParts;
                            p1Score = sets.map(function(s) { var p = s.match(/^(\d+)\/(\d+)/); return p ? p[1] : ''; }).filter(Boolean).join(' ');
                            p2Score = sets.map(function(s) { var p = s.match(/^(\d+)\/(\d+)/); return p ? p[2] : ''; }).filter(Boolean).join(' ');
                            if (igOutcomeLabel) { p1Score = (p1Score ? p1Score + ' ' : '') + igOutcomeLabel; }
                        }

                        var matchLabel = isEn ? 'Match ' : (isKg ? 'Матч ' : 'Матч ');
                        bHtml += '<div class="td-ig-match" data-p1="' + (m.player1_id || '') + '" data-p2="' + (m.player2_id || '') + '" style="background:var(--bg-card);border:1px solid var(--border);border-radius:8px;overflow:hidden;">';
                        bHtml += '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:0.5px;color:var(--text-dim);padding:6px 12px;background:rgba(255,255,255,0.03);border-bottom:1px solid rgba(255,255,255,0.06);">' + matchLabel + (idx + 1) + '</div>';
                        // P1
                        bHtml += '<div style="display:flex;justify-content:space-between;padding:8px 12px;border-bottom:1px solid rgba(255,255,255,0.06);' + (isP1Winner ? 'background:rgba(204,255,0,0.06);' : '') + '">';
                        bHtml += '<span style="font-size:0.85rem;' + (isP1Winner ? 'color:var(--accent);font-weight:700;' : 'color:var(--text-primary);') + '">' + p1Name + '</span>';
                        bHtml += '<span style="font-size:0.8rem;font-weight:600;' + (isP1Winner ? 'color:var(--accent);' : 'color:var(--text-secondary);') + '">' + (p1Score || '—') + '</span>';
                        bHtml += '</div>';
                        // P2
                        bHtml += '<div style="display:flex;justify-content:space-between;padding:8px 12px;' + (isP2Winner ? 'background:rgba(204,255,0,0.06);' : '') + '">';
                        bHtml += '<span style="font-size:0.85rem;' + (isP2Winner ? 'color:var(--accent);font-weight:700;' : 'color:var(--text-primary);') + '">' + p2Name + '</span>';
                        bHtml += '<span style="font-size:0.8rem;font-weight:600;' + (isP2Winner ? 'color:var(--accent);' : 'color:var(--text-secondary);') + '">' + (p2Score || '—') + '</span>';
                        bHtml += '</div></div>';
                    });
                    bHtml += '</div>';
                }

                // Group tables (2-column grid)
                bHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Group Stage' : (isKg ? 'Топтук этап' : 'Групповой этап')) + '</h3>';
                bHtml += '<div class="td-groups-grid">';

                for (var g = 1; g <= groupCount; g++) {
                    var gMatches = grpMatches.filter(function(m) { return m.group_number === g; });
                    if (!gMatches.length) continue;

                    // Collect players
                    var gPlayerIds = [];
                    gMatches.forEach(function(m) {
                        if (m.player1_id && gPlayerIds.indexOf(m.player1_id) === -1) gPlayerIds.push(m.player1_id);
                        if (m.player2_id && gPlayerIds.indexOf(m.player2_id) === -1) gPlayerIds.push(m.player2_id);
                    });

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
                    var sbGroupHasResults = gMatches.some(function(m) { return m.status === 'completed'; });
                    // Stable sort by seed
                    standings.sort(function(a, b) {
                        var sa = a.seed || 9999; var sb = b.seed || 9999;
                        if (sa !== sb) return sa - sb;
                        return gPlayerIds.indexOf(a.playerId) - gPlayerIds.indexOf(b.playerId);
                    });
                    // Calculate place by wins
                    var byWins = standings.slice().sort(function(a, b) { return b.wins - a.wins; });
                    byWins.forEach(function(st, i) { st.place = i + 1; });

                    // Apply manual overrides
                    var tdMgp = t.manual_group_places || {};
                    if (tdMgp[String(g)]) {
                        var tdOv = tdMgp[String(g)];
                        standings.forEach(function(st) {
                            if (tdOv[st.playerId] !== undefined) st.place = tdOv[st.playerId];
                        });
                    }

                    var letter = groupLetters[g - 1] || String(g);
                    bHtml += '<div style="margin-bottom:24px;">';
                    bHtml += '<div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:0.95rem;">' + (isEn ? 'Group ' : (isKg ? 'Топ ' : 'Группа ')) + letter + '</div>';
                    bHtml += '<div style="overflow-x:auto;"><table class="td-group-table">';
                    bHtml += '<thead><tr><th>№</th><th>' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th>';
                    for (var c = 0; c < standings.length; c++) bHtml += '<th style="text-align:center;min-width:65px;white-space:nowrap;">' + (c + 1) + '</th>';
                    bHtml += '<th style="text-align:center;width:30px;">' + (isEn ? 'W' : (isKg ? 'Ж' : 'П')) + '</th>';
                    bHtml += '<th style="text-align:center;width:40px;">' + (isEn ? 'Pos' : (isKg ? 'О' : 'М')) + '</th>';
                    bHtml += '</tr></thead><tbody>';

                    for (var row = 0; row < standings.length; row++) {
                        var st = standings[row];
                        var stName = pName(st.playerId);
                        var seedHtml = st.seed ? ' <span style="color:var(--accent);font-size:0.7rem;">[' + st.seed + ']</span>' : '';
                        var isQualified = st.place <= qualifiers && allGroupDone;

                        bHtml += '<tr data-player-id="' + st.playerId + '"' + (isQualified && allGroupDone ? ' style="background:rgba(204,255,0,0.06);"' : '') + '>';
                        bHtml += '<td style="text-align:center;font-weight:600;">' + (row + 1) + '</td>';
                        bHtml += '<td style="white-space:nowrap;">' + stName + seedHtml + '</td>';

                        for (var col = 0; col < standings.length; col++) {
                            if (row === col) {
                                bHtml += '<td style="text-align:center;background:rgba(255,255,255,0.03);color:var(--text-dim);">&times;</td>';
                            } else {
                                var oppId = standings[col].playerId;
                                var match = gMatches.find(function(m) {
                                    return (m.player1_id === st.playerId && m.player2_id === oppId) ||
                                           (m.player1_id === oppId && m.player2_id === st.playerId);
                                });
                                if (match && match.status === 'completed' && match.score) {
                                    var scoreParts = match.score.split(' ');
                                    var cellOutcome = '';
                                    if (scoreParts.length > 0 && TD_OUTCOMES.indexOf(scoreParts[scoreParts.length - 1]) !== -1) {
                                        cellOutcome = scoreParts.pop();
                                    }
                                    var score;
                                    // Flip score if current player is player2
                                    if (match.player2_id === st.playerId) {
                                        score = scoreParts.map(function(s) {
                                            var parts = s.split('/');
                                            return parts.length === 2 ? parts[1] + ':' + parts[0] : s;
                                        }).join(' ');
                                    } else {
                                        score = scoreParts.join(' ').replace(/\//g, ':');
                                    }
                                    if (cellOutcome) score += ' ' + cellOutcome;
                                    var isWin = match.winner_id === st.playerId;
                                    bHtml += '<td style="text-align:center;font-size:0.8rem;white-space:nowrap;' + (isWin ? 'color:var(--accent);font-weight:600;' : 'color:var(--text-dim);') + '">' + score + '</td>';
                                } else if (match) {
                                    // Матч есть, счёта ещё нет: клетка несёт номер и имя
                                    // соперника — по ним свой матч заполняется прямо отсюда
                                    var противName = pName(oppId).replace(/<[^>]*>/g, '');
                                    var противФам = противName.trim().split(/\s+/).pop();
                                    bHtml += '<td class="td-grp-cell" data-match-id="' + match.id +
                                             '" data-opp="' + противФам +
                                             '" style="text-align:center;color:var(--text-dim);">—</td>';
                                } else {
                                    bHtml += '<td style="text-align:center;color:var(--text-dim);">—</td>';
                                }
                            }
                        }

                        var sbPlaceDisplay = sbGroupHasResults ? st.place : '—';
                        bHtml += '<td style="text-align:center;font-weight:600;">' + st.wins + '</td>';
                        bHtml += '<td style="text-align:center;font-weight:700;' + (isQualified ? 'color:var(--accent);' : '') + '">' + sbPlaceDisplay + '</td>';
                        bHtml += '</tr>';
                    }

                    bHtml += '</tbody></table></div></div>';
                }

                bHtml += '</div>'; // close td-groups-grid
                bracketContainer.innerHTML = bHtml;


            } else if (t.bracket_type === 'fic') {

            // ---- FIC (Full Individual Consolation) bracket ----
            var drawSize = t.draw_size || 16;
            var ficSections = getFicSectionsPublic(drawSize, isEn);

            // Сколько человек окажется в каждой клетке — общий счёт из
            // bracket-draw.js, тот же, по которому решает база. Из него
            // видно, где настоящий проход, а где ещё ждут соперника.
            tdИтоги = (window.KSLT_DRAW && window.KSLT_DRAW.итоги)
                ? window.KSLT_DRAW.итоги(drawSize, matches.map(function(m) {
                    return {
                        круг: m.round_number,
                        номер: m.match_order,
                        людей: (m.player1_id ? 1 : 0) + (m.player2_id ? 1 : 0)
                    };
                }))
                : {};

            // Build players array
            var ficPlayersArr = [];
            Object.keys(playersMap).forEach(function(pid) {
                var p = playersMap[pid];
                ficPlayersArr.push({
                    id: pid,
                    name: isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name),
                    seed: null,
                    country: tdCountryFlag(p.country)
                });
            });
            matches.forEach(function(m) {
                if (m.seed1 && m.player1_id) {
                    var p = ficPlayersArr.find(function(x) { return x.id === m.player1_id; });
                    if (p) p.seed = m.seed1;
                }
                if (m.seed2 && m.player2_id) {
                    var p = ficPlayersArr.find(function(x) { return x.id === m.player2_id; });
                    if (p) p.seed = m.seed2;
                }
            });

            var ficTournObj = {
                id: t.id, bracketType: 'fic', drawSize: drawSize,
                players: ficPlayersArr, status: statusClass
            };

            var bHtml = '';
            // Сколько человек на самом деле в сетке
            var вСетке = {};
            matches.forEach(function(m) {
                if (m.round_number !== 1) return;
                if (m.player1_id) вСетке[m.player1_id] = 1;
                if (m.player2_id) вСетке[m.player2_id] = 1;
            });
            var участниковВСетке = Object.keys(вСетке).length || drawSize;

            ficSections.forEach(function(section) {
                // Прячем только ветки, чьих мест в турнире не бывает: сетка
                // строится на степень двойки, и при 22 участниках из 32 мест
                // десять выдуманные.
                if (section.первоеМесто > участниковВСетке) return;
                // И пока в блоке никого нет — тоже не рисуем: блоки
                // появляются по мере игры.
                if (!ficВБлокеЕстьЛюди(section, matches)) return;

                bHtml += '<div class="td-fic-section">';
                bHtml += '<div class="td-fic-section-title">' + section.label + '</div>';
                bHtml += '<div class="td-bracket-scroll"><div class="td-bracket">';

                // Круги у всех блоков общие: полуфинал за 5-8 место должен
                // стоять под общим полуфиналом, а «за 3-4», «финал 5-6» и
                // «за 7-8» — в одном ряду с финалом. Поэтому недостающие
                // слева круги закрываем пустыми столбцами той же ширины:
                // без них каждый блок начинался заново от левого края.
                var первыйКруг = section.rounds[0].roundNum;
                for (var пусто = 1; пусто < первыйКруг; пусто++) {
                    bHtml += '<div class="td-bracket-round td-round-spacer">' +
                             '<div class="td-round-title" style="visibility:hidden;">&nbsp;</div>' +
                             '<div class="td-bracket-matches"></div></div>';
                    // И столбец под соединительные линии: в основной сетке
                    // он есть между кругами, и без него блоки за места
                    // расходились с ней на его ширину
                    bHtml += '<div class="td-connector-column"></div>';
                }

                section.rounds.forEach(function(rd, ri) {
                    var roundMatches = matches.filter(function(m) {
                        return m.round_number === rd.roundNum &&
                               m.match_order >= rd.matchStart &&
                               m.match_order <= rd.matchEnd;
                    }).sort(function(a, b) { return a.match_order - b.match_order; });

                    bHtml += '<div class="td-bracket-round">';
                    bHtml += '<div class="td-round-title">' + rd.name + '</div>';
                    bHtml += '<div class="td-bracket-matches">';
                    roundMatches.forEach(function(m) {
                        bHtml += renderMatch(ficTournObj, {
                            matchId: m.id, player1Id: m.player1_id, player2Id: m.player2_id,
                            score: m.score || '', winnerId: m.winner_id,
                            status: m.status || 'upcoming', roundNum: m.round_number,
                            matchOrder: m.match_order
                        }, predOpts);
                    });
                    bHtml += '</div></div>';

                    if (ri < section.rounds.length - 1) {
                        var pc = Math.floor(roundMatches.length / 2);
                        if (pc > 0) {
                            bHtml += '<div class="td-connector-column">';
                            bHtml += '<div class="td-round-title" style="visibility:hidden;">&nbsp;</div>';
                            bHtml += '<div class="td-connector-inner">';
                            for (var ci = 0; ci < pc; ci++) {
                                bHtml += '<div class="td-connector-pair"><div class="td-conn-top"></div><div class="td-conn-mid"></div><div class="td-conn-bottom"></div></div>';
                            }
                            bHtml += '</div></div>';
                        }
                    }
                });

                bHtml += '</div></div>'; // /td-bracket /td-bracket-scroll

                // Place match under section
                if (section.placeMatch) {
                    var pm = matches.find(function(m) {
                        return m.round_number === section.placeMatch.roundNum &&
                               m.match_order === section.placeMatch.matchOrder;
                    });
                    if (pm) {
                        // Сдвиг считаем после отрисовки, по месту: между
                        // кругами стоят столбцы с линиями, и на глаз ширину
                        // не угадать — матч за место уезжал левее финала.
                        bHtml += '<div class="td-place-match" data-round="' +
                                 section.placeMatch.roundNum + '" ' +
                                 'style="margin-top:12px;max-width:200px;">';
                        bHtml += '<div class="td-round-title">' + section.placeMatch.label + '</div>';
                        bHtml += renderMatch(ficTournObj, {
                            matchId: pm.id, player1Id: pm.player1_id, player2Id: pm.player2_id,
                            score: pm.score || '', winnerId: pm.winner_id,
                            status: pm.status || 'upcoming', roundNum: pm.round_number,
                            matchOrder: pm.match_order
                        }, predOpts);
                        bHtml += '</div>';
                    }
                }

                bHtml += '</div>'; // /td-fic-section
            });

            bracketContainer.innerHTML = bHtml;

            // Ставим матчи за места под их круг: измеряем, где стоит нужный
            // столбец, и сдвигаем на столько же. Считать в уме нельзя —
            // между кругами есть столбцы с соединительными линиями.
            // Ждём, пока браузер разложит столбцы: они резиновые, и сразу
            // после отрисовки их ширина ещё не окончательная — сдвиг
            // считался от старых позиций, и матч за место уезжал влево.
            requestAnimationFrame(function() {
                выровнятьМатчиЗаМеста(bracketContainer);
            });

            } else {

            // ---- Single Elimination bracket ----
            var drawSize = t.draw_size || 16;
            var totalRounds = Math.log2(drawSize);

            // Build players array for getPlayer()
            var playersArr = [];
            var addedIds = {};
            Object.keys(playersMap).forEach(function(pid) {
                var p = playersMap[pid];
                var displayName;
                if (isDbl && regsMap && regsMap[pid]) {
                    // Strip HTML tags for SE bracket (uses text rendering)
                    displayName = getPublicTeamName(pid, regsMap, playersMap, isEn, isKg).replace(/<[^>]*>/g, '');
                } else {
                    displayName = isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name);
                }
                playersArr.push({
                    id: pid,
                    name: displayName,
                    seed: null,
                    country: tdCountryFlag(p.country)
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
                    if (rf === 0) roundName = isEn ? 'Final' : (isKg ? 'Финал' : 'Финал');
                    else if (rf === 1) roundName = isEn ? 'Semifinal' : (isKg ? 'Жарым финал' : 'Полуфинал');
                    else if (rf === 2) roundName = isEn ? 'Quarterfinal' : (isKg ? 'Чейрек финал' : 'Четвертьфинал');
                    else roundName = isEn ? 'Round ' + r : (isKg ? 'Раунд ' + r : 'Раунд ' + r);
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
                name: isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title),
                bracketType: 'single_elimination',
                drawSize: drawSize,
                players: playersArr,
                bracket: { rounds: rounds },
                status: statusClass
            };

            // Override getPlayer for this context
            var origGetPlayer = window.getPlayer || getPlayer;

            renderSingleEliminationBracket(tournamentObj, predOpts);
            }
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

    // ---- Participants from registrations ----
    var participantsGrid = document.getElementById('participantsGrid');
    if (participantsGrid) {
        var maxPart = t.max_participants || 16;
        var mainDrawRegs = registrations.filter(function(r) { return r.status === 'approved' || r.status === 'pending'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var waitlistRegs = registrations.filter(function(r) { return r.status === 'waitlist'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });

        var mainDraw = mainDrawRegs.slice(0, maxPart);
        var waitlist = mainDrawRegs.slice(maxPart).concat(waitlistRegs);

        if (mainDraw.length > 0) {
            var partHtml = '';
            var mainDrawLabel = isEn ? 'Main Draw' : (isKg ? 'Негизги тор' : 'Основная сетка');
            var waitlistLabel = isEn ? 'Waitlist' : (isKg ? 'Күтүү тизмеси' : 'Лист ожидания');
            var thName = isEn ? 'Name' : (isKg ? 'Аты-жөнү' : 'ФИО');
            var thCat = isEn ? 'Category' : (isKg ? 'Категория' : 'Категория');
            var thDate = isEn ? 'Date' : (isKg ? 'Датасы' : 'Дата');
            var thTime = isEn ? 'Time' : (isKg ? 'Убактысы' : 'Время');

            function pubRegRow(reg, idx) {
                var p = reg.players || playersMap[reg.player_id] || {};
                var regDisplayName = isDbl
                    ? getPublicTeamName(reg.player_id, regsMap, playersMap, isEn, isKg).replace(/<[^>]*>/g, '')
                    : (isEn ? (p.name_en || p.name || '—') : (isKg ? (p.name_kg || p.name || '—') : (p.name || '—')));
                var pName = regDisplayName;
                var photo = p.photo || '';
                var photoHtml = photo
                    ? '<img class="td-reg-photo" src="' + esc(photo) + '" alt="">'
                    : '<div class="td-reg-photo td-reg-photo-empty">—</div>';
                var catId = p.category_id || '';
                var catLabel = catId ? catId.charAt(0).toUpperCase() + catId.slice(1) : '—';
                var regDate = '', regTime = '';
                if (reg.registered_at) {
                    var d = new Date(reg.registered_at);
                    regDate = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' });
                    regTime = d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                }
                return '<tr>' +
                    '<td>' + idx + '</td>' +
                    '<td>' + photoHtml + '</td>' +
                    '<td>' + esc(pName) + '</td>' +
                    '<td>' + esc(catLabel) + '</td>' +
                    '<td>' + regDate + '</td>' +
                    '<td>' + regTime + '</td>' +
                '</tr>';
            }

            var regTHead = '<th>#</th><th></th><th>' + thName + '</th><th>' + thCat + '</th><th>' + thDate + '</th><th>' + thTime + '</th>';

            partHtml += '<div class="td-reg-columns">';

            // Left: Main Draw
            partHtml += '<div>';
            partHtml += '<h3 class="td-participants-subtitle">' + mainDrawLabel + ' <span class="td-participants-count">' + mainDraw.length + '/' + maxPart + '</span></h3>';
            partHtml += '<div class="td-reg-table-wrap"><table class="td-reg-table"><thead><tr>' +
                regTHead +
            '</tr></thead><tbody>';
            mainDraw.forEach(function(reg, idx) { partHtml += pubRegRow(reg, idx + 1); });
            partHtml += '</tbody></table></div>';
            partHtml += '</div>';

            // Right: Waitlist
            partHtml += '<div>';
            partHtml += '<h3 class="td-participants-subtitle">' + waitlistLabel + ' <span class="td-participants-count">' + waitlist.length + '</span></h3>';
            if (waitlist.length > 0) {
                partHtml += '<div class="td-reg-table-wrap"><table class="td-reg-table td-reg-table-waitlist"><thead><tr>' +
                    regTHead +
                '</tr></thead><tbody>';
                waitlist.forEach(function(reg, idx) { partHtml += pubRegRow(reg, idx + 1); });
                partHtml += '</tbody></table></div>';
            } else {
                partHtml += '<div class="td-no-results" style="padding:var(--space-md) 0;"><p>' + (isEn ? 'No waitlisted players' : (isKg ? 'Күтүү тизмесинде оюнчулар жок' : 'Нет игроков в листе ожидания')) + '</p></div>';
            }
            partHtml += '</div>';

            partHtml += '</div>';
            participantsGrid.innerHTML = partHtml;
        } else {
            participantsGrid.innerHTML = '<div class="td-no-results"><p>' + L.noParticipants + '</p></div>';
        }
    }

    // ---- Registration button for players ----
    // Бейдж статуса считается по датам регистрации (effectiveStatus), а кнопка
    // раньше смотрела только на сырое поле t.status. Из-за этого турнир с
    // выставленными датами показывал «Регистрация открыта», но кнопки не давал.
    if (t.status === 'registration_open' || effectiveStatus === 'registration_open') {
        // Запоминаем турнир: блок заявки перерисовывается после подачи и
        // снятия, и ему нужны эти данные без повторной загрузки страницы
        window.ksltTournament = t;
        renderRegistrationButton(t, registrations, isEn);
    }

    // ---- Results from matches ----
    var resultsPodium = document.getElementById('resultsPodium');
    if (resultsPodium) {
        if (t.status === 'completed' && matches.length > 0) {
            var drawSize = t.draw_size || 16;
            var totalRounds = Math.log2(drawSize);

            var placeLabel = isEn ? 'place' : 'место';
            var defaultPhoto = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 80 80"><rect fill="%231a1f2e" width="80" height="80" rx="40"/><text x="40" y="48" text-anchor="middle" fill="%23666" font-size="28">?</text></svg>');

            function podiumCard(player, place, medal) {
                var podName = isDbl
                    ? getPublicTeamName(player.id, regsMap, playersMap, isEn, isKg).replace(/<[^>]*>/g, '')
                    : (isEn ? (player.name_en || player.name || '?') : (isKg ? (player.name_kg || player.name || '?') : (player.name || '?')));
                var photo = player.photo || defaultPhoto;
                return '<div class="td-podium-card td-podium-' + place + '">' +
                    '<div class="td-podium-medal">' + medal + '</div>' +
                    '<div class="td-podium-photo-wrap">' +
                        '<img class="td-podium-photo" src="' + esc(photo) + '" alt="' + esc(podName) + '">' +
                    '</div>' +
                    '<div class="td-podium-place">' + place + '-e ' + placeLabel + '</div>' +
                    '<div class="td-podium-name">' + esc(podName) + '</div>' +
                '</div>';
            }

            if (t.bracket_type === 'fic') {
                // FIC results: bit-reversal for all places
                function ficBitReverse(num, bits) {
                    var result = 0;
                    for (var i = 0; i < bits; i++) {
                        result = (result << 1) | (num & 1);
                        num >>= 1;
                    }
                    return result;
                }

                var ficFinalMatches = matches.filter(function(m) {
                    return m.round_number === totalRounds && m.status === 'completed' && m.winner_id;
                }).sort(function(a, b) { return a.match_order - b.match_order; });

                var ficPlaces = []; // {place, playerId}
                ficFinalMatches.forEach(function(m) {
                    // Место читается прямо по номеру матча последнего круга:
                    // первый разыгрывает места 1-2, второй 3-4, третий 5-6.
                    // Переворот битов был написан под прежнюю нумерацию, и
                    // третье место доставалось человеку из нижней ветки.
                    var winnerPlace = (m.match_order - 1) * 2 + 1;
                    var loserPlace = winnerPlace + 1;
                    var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;

                    ficPlaces.push({ place: winnerPlace, playerId: m.winner_id });
                    if (loserId) ficPlaces.push({ place: loserPlace, playerId: loserId });
                });

                ficPlaces.sort(function(a, b) { return a.place - b.place; });

                if (ficPlaces.length > 0) {
                    // Podium: top 3
                    var resHtml = '<div class="td-podium">';
                    var medals = ['🥇', '🥈', '🥉'];
                    for (var i = 0; i < Math.min(3, ficPlaces.length); i++) {
                        var fp = playersMap[ficPlaces[i].playerId] || {};
                        resHtml += podiumCard(fp, ficPlaces[i].place, medals[i]);
                    }
                    resHtml += '</div>';

                    // Table for remaining places
                    if (ficPlaces.length > 3) {
                        resHtml += '<div style="max-width:500px;margin:24px auto 0;">';
                        resHtml += '<table style="width:100%;border-collapse:collapse;">';
                        resHtml += '<thead><tr><th style="text-align:center;padding:6px 8px;color:var(--text-secondary);font-size:0.8rem;">#</th>' +
                            '<th style="padding:6px 8px;color:var(--text-secondary);font-size:0.8rem;">' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th></tr></thead><tbody>';
                        for (var i = 3; i < ficPlaces.length; i++) {
                            var fpName = pName(ficPlaces[i].playerId);
                            resHtml += '<tr style="border-bottom:1px solid var(--border, rgba(255,255,255,0.06));">' +
                                '<td style="text-align:center;padding:8px;font-weight:600;color:var(--text-secondary);">' + ficPlaces[i].place + '</td>' +
                                '<td style="padding:8px;">' + fpName + '</td></tr>';
                        }
                        resHtml += '</tbody></table></div>';
                    }

                    resultsPodium.innerHTML = resHtml;
                } else {
                    resultsPodium.innerHTML = '<div class="td-no-results"><p>' + (isRatingTournament(t) ? L.noResults : L.noResultsPlain) + '</p></div>';
                }
            } else if (t.bracket_type === 'group_league') {
                // GL results: find PL final (highest round_number among PL- matches)
                var plMatches = matches.filter(function(m) { return m.round && m.round.indexOf('PL-') === 0 && m.round !== 'PL-3RD'; });
                var plMaxRound = 0;
                plMatches.forEach(function(m) { if (m.round_number > plMaxRound) plMaxRound = m.round_number; });
                var plFinal = plMatches.find(function(m) { return m.round_number === plMaxRound && m.status === 'completed' && m.winner_id; });

                if (plFinal && plFinal.winner_id) {
                    var winner = playersMap[plFinal.winner_id] || {};
                    var finalist_id = plFinal.winner_id === plFinal.player1_id ? plFinal.player2_id : plFinal.player1_id;
                    var finalist = playersMap[finalist_id] || {};

                    var resHtml = '<div class="td-podium">' +
                        podiumCard(winner, 1, '🥇') +
                        podiumCard(finalist, 2, '🥈');

                    var plThird = matches.find(function(m) { return m.round === 'PL-3RD' && m.status === 'completed' && m.winner_id; });
                    if (plThird) {
                        var thirdPlayer = playersMap[plThird.winner_id] || {};
                        resHtml += podiumCard(thirdPlayer, 3, '🥉');
                    }

                    resHtml += '</div>';

                    // Таблица очков — только для рейтинговых турниров
                    if (isRatingTournament(t)) supabaseClient.from('rating_history')
                        .select('player_id, points_earned')
                        .eq('tournament_id', t.id)
                        .order('points_earned', { ascending: false })
                        .then(function(rhRes) {
                            if (rhRes.data && rhRes.data.length > 0) {
                                var tblHtml = '<div style="max-width:600px;margin:24px auto 0;">';
                                tblHtml += '<table style="width:100%;border-collapse:collapse;">';
                                tblHtml += '<thead><tr><th style="text-align:center;padding:6px 8px;color:var(--text-secondary);font-size:0.8rem;">#</th>' +
                                    '<th style="padding:6px 8px;color:var(--text-secondary);font-size:0.8rem;">' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th>' +
                                    '<th style="text-align:right;padding:6px 8px;color:var(--text-secondary);font-size:0.8rem;">' + (isEn ? 'Points' : (isKg ? 'Упай' : 'Очки')) + '</th></tr></thead><tbody>';
                                rhRes.data.forEach(function(row, i) {
                                    var rpName = pName(row.player_id);
                                    tblHtml += '<tr style="border-bottom:1px solid var(--border, rgba(255,255,255,0.06));">' +
                                        '<td style="text-align:center;padding:8px;font-weight:600;color:var(--text-secondary);">' + (i + 1) + '</td>' +
                                        '<td style="padding:8px;">' + rpName + '</td>' +
                                        '<td style="text-align:right;padding:8px;color:var(--accent);font-weight:600;">+' + (row.points_earned || 0) + '</td></tr>';
                                });
                                tblHtml += '</tbody></table></div>';
                                resultsPodium.innerHTML += tblHtml;
                            }
                        });

                    resultsPodium.innerHTML = resHtml;
                } else {
                    resultsPodium.innerHTML = '<div class="td-no-results"><p>' + (isRatingTournament(t) ? L.noResults : L.noResultsPlain) + '</p></div>';
                }
            } else {
                // SE / RR results
                var finalMatch = t.bracket_type === 'round_robin'
                    ? matches.find(function(m) { return m.round === 'F' && m.status === 'completed' && m.winner_id; })
                    : matches.find(function(m) { return m.round_number === totalRounds && m.round !== '3RD'; });

                if (finalMatch && finalMatch.winner_id) {
                    var winner = playersMap[finalMatch.winner_id] || {};
                    var finalist_id = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                    var finalist = playersMap[finalist_id] || {};

                    var resHtml = '<div class="td-podium">' +
                        podiumCard(winner, 1, '🥇') +
                        podiumCard(finalist, 2, '🥈');

                    // 3rd place match result
                    var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
                    if (thirdPlaceMatch) {
                        var thirdPlayer = playersMap[thirdPlaceMatch.winner_id] || {};
                        resHtml += podiumCard(thirdPlayer, 3, '🥉');
                    } else {
                        var sfMatches = matches.filter(function(m) { return m.round_number === totalRounds - 1 && m.status === 'completed'; });
                        sfMatches.forEach(function(m) {
                            var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                            if (loserId) {
                                var sfPlayer = playersMap[loserId] || {};
                                resHtml += podiumCard(sfPlayer, 3, '🥉');
                            }
                        });
                    }

                    resHtml += '</div>';
                    resultsPodium.innerHTML = resHtml;
                } else {
                    resultsPodium.innerHTML = '<div class="td-no-results"><p>' + (isRatingTournament(t) ? L.noResults : L.noResultsPlain) + '</p></div>';
                }
            }
        } else {
            resultsPodium.innerHTML = '<div class="td-no-results"><p>' + (isRatingTournament(t) ? L.noResults : L.noResultsPlain) + '</p></div>';
        }
    }

    // ---- Venue section ----
    var venueContent = document.getElementById('venueContent');
    if (courtData) {
        renderVenueSection(courtData, isEn);
    } else if (venueContent) {
        venueContent.innerHTML = '<div class="td-no-results"><p>' + (isEn ? 'Venue information not available.' : (isKg ? 'Өткөрүлүүчү жер жөнүндө маалымат жок.' : 'Информация о месте проведения отсутствует.')) + '</p></div>';
    }

    // Init tabs navigation
    initTabsNavigation();

    // Init prediction bar animations
    initPredictionAnimations();

    // Highlight player matches if ?player= param
    applyPlayerHighlight();
}

// ========================================
// VENUE SECTION
// ========================================

function renderVenueSection(court, isEn) {
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var venueSection = document.getElementById('venue');
    var venueContent = document.getElementById('venueContent');
    if (!venueSection || !venueContent) return;

    var courtName = isEn ? (court.name_en || court.name) : (isKg ? (court.name_kg || court.name) : court.name);
    var street = isEn ? (court.street_en || court.street || '') : (isKg ? (court.street_kg || court.street || '') : (court.street || ''));
    var city = isEn ? (court.city_en || court.city || '') : (isKg ? (court.city_kg || court.city || '') : (court.city || ''));
    var building = court.building || '';

    var addressParts = [];
    if (street) addressParts.push(street);
    if (building) addressParts.push(building);
    if (city) addressParts.push(city);
    var address = addressParts.join(', ');

    var courtUrl = isEn ? 'court-en.html?id=' + court.id : (isKg ? 'court-kg.html?id=' + court.id : 'court.html?id=' + court.id);
    var mapUrl = court.google_maps_url || court.twogis_url || '';
    var fullAddress = [courtName, address, 'Bishkek'].filter(Boolean).join(', ');
    var embedUrl = getMapEmbed(mapUrl, fullAddress);

    var html = '<div class="td-venue-card">';

    // Info block
    html += '<div class="td-venue-info">' +
        '<a href="' + esc(courtUrl) + '" class="td-venue-name">' + esc(courtName) + '</a>';
    if (address) {
        html += '<div class="td-venue-address">' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>' +
            ' ' + esc(address) +
        '</div>';
    }

    // Map links
    var linksHtml = '';
    if (court.google_maps_url) {
        linksHtml += '<a href="' + esc(court.google_maps_url) + '" target="_blank" rel="noopener" class="td-venue-link">Google Maps</a>';
    }
    if (court.twogis_url) {
        linksHtml += '<a href="' + esc(court.twogis_url) + '" target="_blank" rel="noopener" class="td-venue-link">2GIS</a>';
    }
    if (linksHtml) {
        html += '<div class="td-venue-links">' + linksHtml + '</div>';
    }
    html += '</div>';

    // Map embed
    if (embedUrl) {
        html += '<div class="td-venue-map">' +
            '<iframe src="' + esc(embedUrl) + '" allowfullscreen="" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>' +
        '</div>';
    }

    html += '</div>';
    venueContent.innerHTML = html;
}

// ========================================
// PLAYER REGISTRATION BUTTON
// ========================================

/**
 * Перерисовать блок заявки на странице турнира.
 *
 * После подачи или снятия менялся только текст кнопки, а «Снять заявку» и
 * «Добавить партнёра» появлялись лишь после обновления страницы. Перечитываем
 * заявки и собираем блок заново — человек видит своё состояние сразу.
 */
async function обновитьБлокЗаявки() {
    var client = window.supabaseClient;
    var t = window.ksltTournament;
    if (!client || !t) { window.location.reload(); return; }

    // Перечитываем страницу целиком: она сама соберёт и блок заявки, и список
    // участников. Раньше я рисовал блок здесь и следом вызывал перезагрузку —
    // блок рисовался дважды, и статус задваивался
    if (window.ksltReload) {
        window.ksltReload();
        return;
    }

    var res = await client.from('tournament_registrations')
        .select('*').eq('tournament_id', t.id);
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    renderRegistrationButton(t, res.data || [], isEn);
}

/** Кнопка записи для гостя: ведёт ко входу, а не в пустоту. */
function гостюКнопкуЗаписи(isEn, isKg) {
    var heroContent = document.querySelector('.td-hero-content');
    if (!heroContent || document.getElementById('tdRegisterBtn')) return;
    document.querySelectorAll('.td-register-wrap, .td-registration-area')
        .forEach(function(эл) { эл.remove(); });

    var подпись = isEn ? 'Register for Tournament'
        : (isKg ? 'Мелдешке каттоо' : 'Записаться на турнир');

    heroContent.insertAdjacentHTML('beforeend',
        '<div class="td-register-wrap" style="margin-top:20px;">' +
            '<button class="td-register-btn" id="tdRegisterBtn" style="padding:10px 24px;border:none;' +
            'border-radius:8px;background:var(--accent);color:#000;font-weight:600;cursor:pointer;' +
            'font-size:1rem;">' + подпись + '</button>' +
        '</div>');

    document.getElementById('tdRegisterBtn').addEventListener('click', function() {
        if (window.KSLT_REG && window.KSLT_REG.предложитьВойти) {
            window.KSLT_REG.предложитьВойти(isEn, isKg);
        }
    });
}

function renderRegistrationButton(tournament, registrations, isEn) {
    var client = window.supabaseClient;
    if (!client) return;

    // Блок один на странице. Вставляют его два пути — загрузка страницы и
    // обновление после заявки, — поэтому прежний убираем всегда
    document.querySelectorAll('.td-register-wrap, .td-registration-area')
        .forEach(function(эл) { эл.remove(); });

    // isKg объявлялся только в renderVenueSection — здесь его не было,
    // и первое же обращение роняло функцию с ReferenceError внутри .then(),
    // то есть молча. Кнопка не рисовалась с 24.02.2026 (коммит 0cdd6d6).
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Check if user is logged in and has a player_id
    client.auth.getUser().then(function(userRes) {
        if (!userRes.data || !userRes.data.user) {
            // Гостю тоже показываем кнопку: раньше на странице турнира с
            // открытой регистрацией не было вообще ничего, и человек не
            // понимал, куда нажимать. По нажатию предлагаем войти
            гостюКнопкуЗаписи(isEn, isKg);
            return;
        }
        var userId = userRes.data.user.id;

        client.from('profiles').select('player_id, role, full_name').eq('id', userId).single().then(function(profRes) {
            if (!profRes.data || !profRes.data.player_id) return;
            var playerId = profRes.data.player_id;
            var isStaff = profRes.data.role === 'admin' || profRes.data.role === 'manager';
            window.ksltProfileName = profRes.data.full_name || '';

            // Check if already registered
            // Снятая заявка не считается действующей: игрок вправе записаться
            // снова, и кнопка записи должна вернуться на место
            // Заявка общая для пары: напарник видит её наравне с тем, кто
            // подал, — иначе первый номер снимет заявку, и второй останется
            // ни с чем, даже не узнав об этом
            var alreadyRegistered = registrations.find(function(r) {
                return r.player_id === playerId && r.status !== 'withdrawn';
            }) || registrations.find(function(r) {
                return r.partner_id === playerId && r.status !== 'withdrawn';
            });

            // Check category match + ban status + NTRP
            client.from('players').select('category_id, banned_until, ban_reason, ntrp_singles, ntrp_doubles').eq('id', playerId).single().then(async function(plRes) {
                if (!plRes.data) return;

                // Get player gender from profile
                var profGenderRes = await client.from('profiles').select('gender').eq('player_id', playerId).maybeSingle();
                var playerGenderProfile = profGenderRes.data ? profGenderRes.data.gender : null;

                var genderBlocked = false;
                var ntrpBlocked = false;

                // Gender check: use tournament.gender field
                var trnGender = tournament.gender;
                if (trnGender && trnGender !== 'mixed') {
                    var pGender = playerGenderProfile;
                    if (pGender && pGender !== trnGender) {
                        genderBlocked = true;
                    }
                }

                // NTRP check (singles)
                var playerNtrp = plRes.data.ntrp_singles;
                if (playerNtrp && tournament.ntrp_min && playerNtrp < tournament.ntrp_min) {
                    ntrpBlocked = true;
                }
                if (playerNtrp && tournament.ntrp_max && playerNtrp > tournament.ntrp_max) {
                    ntrpBlocked = true;
                }

                // Check membership (staff bypass)
                //
                // Пока идёт бесплатный период, членство не спрашиваем: страница
                // предлагала оплатить, хотя вход открыт всем. То же правило
                // действует и в функции записи — здесь оно просто повторяется,
                // чтобы человек не видел лишнего окна
                var membershipOk = isStaff;
                var paidOk = isStaff;
                var бесплатно = window.бесплатныйПериод ? await window.бесплатныйПериод() : false;
                if (бесплатно) {
                    membershipOk = true;
                    paidOk = true;
                } else if (!isStaff && window.checkMembership) {
                    var memResult = await window.checkMembership();
                    membershipOk = memResult && memResult.active;
                    paidOk = memResult && memResult.paid;
                }

                var pricingUrl = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');

                // Find hero content to append button
                var heroContent = document.querySelector('.td-hero-content');
                if (!heroContent) return;

                // Сверху статус, под ним пояснение, ещё ниже — кнопки. Так
                // читается сверху вниз: что со мной, почему, что могу сделать
                var btnHtml = '<div class="td-registration-area" style="margin-top:var(--space-md);' +
                    'display:flex;flex-direction:column;align-items:flex-start;gap:10px;">';

                // Ban check
                var playerBanned = plRes.data.banned_until && new Date(plRes.data.banned_until) > new Date();

                if (alreadyRegistered) {
                    // Подписи те же, что на карточках турниров: человек должен
                    // видеть одно и то же слово везде — «Вы в основной сетке»,
                    // а не «зарегистрированы» здесь и «в сетке» там
                    var statusLabels = isEn
                        ? { pending: 'Entry under review', approved: 'You are in the draw', draw: 'You are in the draw', rejected: 'Entry declined', withdrawn: 'Withdrawn', waitlist: 'On the waiting list', blocked: 'Not admitted' }
                        : (isKg ? { pending: 'Арыз каралууда', approved: 'Сиз негизги сеткадасыз', draw: 'Сиз негизги сеткадасыз', rejected: 'Арыз четке кагылды', withdrawn: 'Арыз кайтарылды', waitlist: 'Күтүү тизмесинде', blocked: 'Уруксат жок' }
                        : { pending: 'Заявка на рассмотрении', approved: 'Вы в основной сетке', draw: 'Вы в основной сетке', rejected: 'Заявка отклонена', withdrawn: 'Заявка отозвана', waitlist: 'В листе ожидания', blocked: 'Не допущен' });

                    // Отказ подписываем красным и показываем причину — она приходит
                    // из правил допуска и написана человеческим языком
                    var isRefused = alreadyRegistered.status === 'blocked' || alreadyRegistered.status === 'rejected';
                    // Пара с неподтверждённым гостем: место за ней держится, но
                    // говорить «вы в сетке» рано — решает менеджер
                    var ждётГостя = alreadyRegistered.partner_external_name && !alreadyRegistered.guest_confirmed;
                    var ожидание = alreadyRegistered.status === 'waitlist' || alreadyRegistered.status === 'pending';
                    var подписьСтатуса = ждётГостя
                        ? (isEn ? 'Entry under review' : (isKg ? 'Арыз каралууда' : 'Заявка на рассмотрении'))
                        : (statusLabels[alreadyRegistered.status] || statusLabels.approved);
                    // Вид состояния общий на весь сайт — класс из style.css.
                    // Раньше цвета были прописаны прямо здесь, и страница
                    // турнира расходилась с карточками
                    var видСтатуса = isRefused ? 'kslt-status-refused'
                        : ((ждётГостя || ожидание) ? 'kslt-status-wait' : 'kslt-status-draw');
                    btnHtml += '<span class="kslt-status ' + видСтатуса + '">' + подписьСтатуса + '</span>';
                    if (ждётГостя) {
                        var местоТекст = alreadyRegistered.status === 'waitlist'
                            ? (isEn ? 'On the waiting list' : (isKg ? 'Күтүү тизмесинде' : 'В листе ожидания'))
                            : (isEn ? 'In the main draw' : (isKg ? 'Негизги сеткада' : 'В основной сетке'));
                        btnHtml += '<div style="flex-basis:100%;max-width:520px;color:var(--text-muted);font-size:0.85rem;line-height:1.5;">' +
                            местоТекст + ' \u00B7 ' +
                            (isEn ? 'the guest partner is confirmed by the manager'
                                  : (isKg ? 'конок өнөктөштү менеджер ырастайт'
                                          : 'напарника-гостя подтверждает менеджер')) +
                        '</div>';
                    }
                    if (isRefused && alreadyRegistered.block_reason) {
                        btnHtml += '<div style="flex-basis:100%;max-width:520px;color:var(--text-muted);font-size:0.85rem;line-height:1.5;">' +
                            alreadyRegistered.block_reason + '</div>';
                    }
                    // Снять заявку — пока не проведена жеребьёвка. После неё игрок
                    // уже в сетке, снимает организатор. Правило «за 3 часа» и штраф — #29
                    var canWithdraw = ['approved', 'pending', 'waitlist'].indexOf(alreadyRegistered.status) !== -1
                        && alreadyRegistered.draw_position == null
                        && alreadyRegistered.group_number == null;
                    var кнопкиHtml = '';
                    if (canWithdraw) {
                        // В паре снимают себя, а не заявку: место остаётся
                        // второму, и он ищет нового напарника
                        var вПаре = !!(alreadyRegistered.partner_id || alreadyRegistered.partner_external_name);
                        кнопкиHtml += '<button id="tdWithdrawBtn" data-reg="' + alreadyRegistered.id + '"' +
                            (вПаре ? ' data-leave="1"' : '') +
                            ' style="padding:8px 16px;border:1px solid rgba(255,255,255,0.15);border-radius:8px;background:transparent;color:var(--text-muted);font-weight:500;cursor:pointer;font-size:0.9rem;">' +
                            (вПаре
                                ? (isEn ? 'Leave the pair' : (isKg ? 'Жуптан чыгуу' : 'Выйти из пары'))
                                : (isEn ? 'Withdraw' : (isKg ? 'Арызды алуу' : 'Снять заявку'))) + '</button>';
                    }

                    // В паре напарник либо есть, либо нет — и кнопка должна
                    // говорить об этом честно. Гость тоже напарник: с ним
                    // «добавить» звучало так, будто места ещё свободны
                    // Заявка вне турнира: менеджер отказал или игрок снялся сам.
                    // Менять на ней напарника нечего — места у пары нет. Раньше
                    // кнопка «Заменить напарника» всё равно висела, замена молча
                    // проходила, а заявка как была отклонена, так и оставалась
                    var мертва = alreadyRegistered.status === 'rejected' ||
                        alreadyRegistered.status === 'withdrawn';

                    var isTournamentDoublesCheck = tournament.format === 'doubles' || tournament.format === 'mixed_doubles';
                    if (isTournamentDoublesCheck && !мертва) {
                        var естьНапарник = alreadyRegistered.partner_id || alreadyRegistered.partner_external_name;
                        кнопкиHtml += '<button id="tdAddPartnerBtn" style="padding:8px 16px;border:1px solid var(--accent);border-radius:8px;background:transparent;color:var(--accent);font-weight:500;cursor:pointer;font-size:0.9rem;">' +
                            (естьНапарник
                                ? (isEn ? 'Change partner' : (isKg ? 'Өнөктөштү алмаштыруу' : 'Заменить напарника'))
                                : (isEn ? 'Add Partner' : (isKg ? 'Өнөктөш кошуу' : 'Добавить партнёра'))) + '</button>';
                    }

                    // Отказ менеджера окончателен: подать заявку заново игрок не
                    // может. Вернуть её вправе только тот, кто отказал — иначе
                    // решение клуба ничего не значило бы
                    if (alreadyRegistered.status === 'rejected') {
                        btnHtml += '<div style="flex-basis:100%;max-width:520px;color:var(--text-muted);' +
                            'font-size:0.85rem;line-height:1.5;">' +
                            (isEn ? 'The club closed this entry. To return to the tournament, contact a manager'
                                  : (isKg ? 'Арызды клуб жапты. Мелдешке кайра кирүү үчүн менеджерге кайрылыңыз'
                                          : 'Заявку закрыл клуб. Чтобы вернуться в турнир, обратитесь к менеджеру')) +
                        '</div>';
                    }

                    if (кнопкиHtml) {
                        btnHtml += '<div style="display:flex;gap:12px;flex-wrap:wrap;">' + кнопкиHtml + '</div>';
                    }
                } else if (playerBanned) {
                    var isPerm = new Date(plRes.data.banned_until).getFullYear() >= 2099;
                    var banDateStr = isPerm
                        ? (isEn ? 'permanently' : (isKg ? 'түбөлүккө' : 'навсегда'))
                        : new Date(plRes.data.banned_until).toLocaleDateString(isEn ? 'en-US' : 'ru-RU');
                    var banReasonText = plRes.data.ban_reason
                        ? '<div style="color:var(--text-dim);font-size:0.85rem;margin-top:4px;">' +
                            (isEn ? 'Reason: ' : (isKg ? 'Себеби: ' : 'Причина: ')) + plRes.data.ban_reason + '</div>'
                        : '';
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.3);">' +
                        '<div style="color:#ff3b30;font-weight:500;margin-bottom:4px;">' +
                            (isEn ? 'You are banned from tournaments until ' + banDateStr
                                : (isKg ? 'Сиз мелдештерден ' + banDateStr + ' чейин бөгөттөлгөнсүз'
                                : 'Вы заблокированы для участия в турнирах до ' + banDateStr)) +
                        '</div>' +
                        banReasonText +
                    '</div>';
                } else if (genderBlocked) {
                    var tGender = tournament.gender;
                    var genderMsg = tGender === 'men'
                        ? (isEn ? 'This tournament is for men only' : (isKg ? 'Бул мелдеш эркектер үчүн гана' : 'Этот турнир только для мужчин'))
                        : (isEn ? 'This tournament is for women only' : (isKg ? 'Бул мелдеш аялдар үчүн гана' : 'Этот турнир только для женщин'));
                    btnHtml += '<span style="color:var(--text-secondary);font-size:0.9rem;">' + genderMsg + '</span>';
                } else if (ntrpBlocked) {
                    var ntrpMsg = isEn ? 'Your NTRP (' + (playerNtrp || '?') + ') does not meet tournament requirements'
                        : (isKg ? 'Сиздин NTRP (' + (playerNtrp || '?') + ') мелдеш талаптарына туура келбейт'
                        : 'Ваш NTRP (' + (playerNtrp || '?') + ') не соответствует требованиям турнира');
                    var rangeStr = '';
                    if (tournament.ntrp_min && tournament.ntrp_max) rangeStr = tournament.ntrp_min + ' – ' + tournament.ntrp_max;
                    else if (tournament.ntrp_min) rangeStr = '≥ ' + tournament.ntrp_min;
                    else if (tournament.ntrp_max) rangeStr = '≤ ' + tournament.ntrp_max;
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,59,48,0.1);border:1px solid rgba(255,59,48,0.3);">' +
                        '<div style="color:#ff3b30;font-weight:500;">' + ntrpMsg + '</div>' +
                        (rangeStr ? '<div style="color:var(--text-dim);font-size:0.85rem;margin-top:4px;">' +
                            (isEn ? 'Required NTRP: ' : (isKg ? 'Талап кылынган NTRP: ' : 'Требуемый NTRP: ')) + rangeStr + '</div>' : '') +
                    '</div>';
                } else if (!membershipOk) {
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);">' +
                        '<div style="color:#ffc107;font-weight:500;margin-bottom:4px;">' +
                            (isEn ? 'Active KSLT membership required' : (isKg ? 'KSLT активдүү мүчөлүгү талап кылынат' : 'Требуется активное членство KSLT')) +
                        '</div>' +
                        '<a href="' + pricingUrl + '" style="color:var(--accent);font-size:0.85rem;">' +
                            (isEn ? 'View membership plans →' : (isKg ? 'Мүчөлүк жөнүндө билүү →' : 'Узнать о членстве →')) +
                        '</a>' +
                    '</div>';
                } else if (!paidOk) {
                    btnHtml += '<div style="padding:12px 20px;border-radius:8px;background:rgba(255,193,7,0.1);border:1px solid rgba(255,193,7,0.3);">' +
                        '<div style="color:#ffc107;font-weight:500;margin-bottom:4px;">' +
                            (isEn ? 'Please pay your membership to register' : (isKg ? 'Каттоо үчүн мүчөлүк төлөмүн төлөңүз' : 'Оплатите членство для записи на турнир')) +
                        '</div>' +
                        '<a href="' + pricingUrl + '" style="color:var(--accent);font-size:0.85rem;">' +
                            (isEn ? 'Go to payment →' : (isKg ? 'Төлөмгө өтүү →' : 'Перейти к оплате →')) +
                        '</a>' +
                    '</div>';
                } else {
                    // Кнопка одна и та же независимо от заполненности сетки.
                    // Что вышло — заявка в сетку или в лист ожидания — скажет модалка
                    // после нажатия, по ответу сервера.
                    btnHtml += '<button class="td-register-btn" id="tdRegisterBtn" style="padding:10px 24px;border:none;border-radius:8px;background:var(--accent);color:#000;font-weight:600;cursor:pointer;font-size:1rem;">' +
                        (isEn ? 'Register for Tournament' : (isKg ? 'Мелдешке каттоо' : 'Записаться на турнир')) + '</button>';
                }

                btnHtml += '</div>';
                heroContent.insertAdjacentHTML('beforeend', btnHtml);

                // Check if doubles tournament
                var isTournamentDoubles = tournament.format === 'doubles' || tournament.format === 'mixed_doubles';

                // "Add Partner" button handler for solo doubles registration
                var addPartnerBtn = document.getElementById('tdAddPartnerBtn');
                if (addPartnerBtn) {
                    addPartnerBtn.addEventListener('click', function() {
                        // То же окно, что при записи: «Из базы», «Гость» или
                        // «Пока без». Старое умело только искать по базе
                        if (window.KSLT_DOUBLES) {
                            window.KSLT_DOUBLES.открыть({
                                client: client,
                                tournament: tournament,
                                playerId: playerId,
                                playerName: (window.ksltProfileName || ''),
                                // Заявка уже подана: меняем напарника, а не
                                // подаём заново — место и очередь остаются
                                заменить: true,
                                onDone: function() { обновитьБлокЗаявки(); }
                            });
                        }
                    });
                }

                // Снятие заявки
                var withdrawBtn = document.getElementById('tdWithdrawBtn');
                if (withdrawBtn) {
                    withdrawBtn.addEventListener('click', async function() {
                        var tName = isEn ? (tournament.title_en || tournament.title) : (isKg ? (tournament.title_kg || tournament.title) : tournament.title);

                        // Модалка та же, что у результата регистрации на этой странице
                        var выходИзПары = !!withdrawBtn.dataset.leave;
                        var ok = await window.KSLT_REG.confirm({
                            icon: '\uD83C\uDFBE',
                            title: выходИзПары
                                ? (isEn ? 'Leave the pair?' : (isKg ? 'Жуптан чыгасызбы?' : 'Выйти из пары?'))
                                : (isEn ? 'Withdraw from the tournament?'
                                    : (isKg ? 'Турнирден арызды аласызбы?' : 'Снять заявку с турнира?')),
                            text: выходИзПары
                                ? (isEn ? 'You leave, your partner keeps the place in <b>' + tName + '</b> and looks for a new partner.'
                                    : (isKg ? 'Сиз чыгасыз, өнөктөшүңүз <b>' + tName + '</b> турниринде орун сактап, жаңы өнөктөш издейт.'
                                    : 'Вы выходите, напарник остаётся в <b>' + tName + '</b> с вашим общим местом и ищет нового напарника.'))
                                : (isEn ? 'Your entry for <b>' + tName + '</b> will be withdrawn. You can enter again while registration is open.'
                                    : (isKg ? '<b>' + tName + '</b> турнирине берилген арыз алынат. Каттоо ачык турганда кайра катталса болот.'
                                    : 'Заявка на <b>' + tName + '</b> будет снята. Записаться снова можно, пока открыта регистрация.')),
                            okText: выходИзПары
                                ? (isEn ? 'Leave' : (isKg ? 'Чыгуу' : 'Выйти'))
                                : (isEn ? 'Withdraw' : (isKg ? 'Арызды алуу' : 'Снять заявку')),
                            cancelText: isEn ? 'Cancel' : (isKg ? 'Жокко чыгаруу' : 'Отмена'),
                            tone: 'error'
                        });
                        if (!ok) return;

                        withdrawBtn.disabled = true;

                        // В паре выходит только сам игрок: заявка и место
                        // остаются второму. Решает сервер — там же правила
                        if (withdrawBtn.dataset.leave) {
                            var сессия = await client.auth.getSession();
                            var ответ = await fetch(SUPABASE_URL + '/functions/v1/tournament-register', {
                                method: 'POST',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'apikey': SUPABASE_ANON_KEY,
                                    'Authorization': 'Bearer ' + (сессия.data.session ? сессия.data.session.access_token : '')
                                },
                                body: JSON.stringify({ tournament_id: tournament.id, leave_pair: true })
                            });
                            var д = await ответ.json();
                            if (!ответ.ok || д.error) {
                                withdrawBtn.disabled = false;
                                window.KSLT_REG.notice({
                                    icon: '\u26A0\uFE0F',
                                    title: isEn ? 'Could not leave the pair' : (isKg ? 'Жуптан чыгуу мүмкүн болгон жок' : 'Не удалось выйти из пары'),
                                    text: д.error || '',
                                    tone: 'error'
                                }, isEn, isKg);
                                return;
                            }
                            обновитьБлокЗаявки();
                            return;
                        }

                        var upd = await client.from('tournament_registrations')
                            .update({ status: 'withdrawn' })
                            .eq('id', withdrawBtn.dataset.reg);

                        if (upd.error) {
                            withdrawBtn.disabled = false;
                            window.KSLT_REG.notice({
                                icon: '\u26A0\uFE0F',
                                title: isEn ? 'Could not withdraw the entry' : (isKg ? 'Арызды алуу мүмкүн болгон жок' : 'Не удалось снять заявку'),
                                text: upd.error.message || '',
                                tone: 'error'
                            }, isEn, isKg);
                            return;
                        }
                        обновитьБлокЗаявки();
                    });
                }

                // Also check if player is already registered as partner
                var alreadyAsPartner = registrations.find(function(r) { return r.partner_id === playerId; });
                if (alreadyAsPartner && !alreadyRegistered) {
                    // Player is already in a team as partner — show status
                    var partnerBtn = document.getElementById('tdRegisterBtn');
                    if (partnerBtn) {
                        partnerBtn.outerHTML = '<span class="td-reg-status" style="display:inline-block;padding:8px 16px;border-radius:8px;background:rgba(204,255,0,0.15);color:var(--accent);font-weight:500;">' +
                            (isEn ? 'Registered as partner' : (isKg ? 'Өнөктөш катары катталган' : 'Зарегистрирован как партнёр')) + '</span>';
                    }
                }

                // Register button click handler
                var regBtn = document.getElementById('tdRegisterBtn');
                if (regBtn) {
                    regBtn.addEventListener('click', async function() {
                        if (isTournamentDoubles) {
                            // Окно то же, что на карточках турниров: одно место,
                            // где живут «из базы», «гость» и «пока без напарника»
                            window.KSLT_DOUBLES.открыть({
                                client: client,
                                tournament: tournament,
                                playerId: playerId,
                                playerName: (window.ksltProfileName || ''),
                                onDone: function() { обновитьБлокЗаявки(); }
                            });
                            return;
                        }

                        regBtn.disabled = true;
                        regBtn.textContent = isEn ? 'Registering...' : (isKg ? 'Жөнөтүлүүдө...' : 'Отправка...');

                        // Статус определяет сервер по правилам допуска
                        var info = await window.KSLT_REG.submit(client, tournament.id, { isEn: isEn, isKg: isKg });

                        // Заявку не создали вообще — возвращаем кнопку
                        if (!info.created) {
                            regBtn.disabled = false;
                            regBtn.textContent = isEn ? 'Register for Tournament' : (isKg ? 'Мелдешке каттоо' : 'Записаться на турнир');
                            return;
                        }

                        // Перерисовываем блок целиком: рядом со статусом должны
                        // сразу появиться «Снять заявку» и «Добавить партнёра»,
                        // а не после того, как человек обновит страницу
                        обновитьБлокЗаявки();
                    });
                }
            });
        });
    });
}

function initCountdown(t) {
    var container = document.getElementById('tdCountdown');
    if (!container) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var CL = isEn ? {
        title: 'TOURNAMENT STARTS IN',
        days: 'days', hours: 'hours', min: 'min', sec: 'sec',
        live: 'Tournament in progress',
        regClosing: 'Registration closes in less than 24 hours!'
    } : (isKg ? {
        title: 'МЕЛДЕШ БАШТАЛГАНГА',
        days: 'күн', hours: 'саат', min: 'мүн', sec: 'сек',
        live: 'Мелдеш жүрүп жатат',
        regClosing: 'Каттоо 24 сааттан кийин жабылат!'
    } : {
        title: 'ТУРНИР НАЧИНАЕТСЯ ЧЕРЕЗ',
        days: 'дней', hours: 'часов', min: 'минут', sec: 'секунд',
        live: 'Турнир идёт',
        regClosing: 'Регистрация закроется менее чем через 24 часа!'
    });

    // Parse tournament start datetime
    if (!t.date_start) return;
    var startStr = t.date_start; // YYYY-MM-DD
    var timeStr = t.start_time || '00:00'; // HH:MM
    var startDate = new Date(startStr + 'T' + timeStr + ':00');

    // Parse tournament end date
    var endDate = t.date_end ? new Date(t.date_end + 'T23:59:59') : null;

    // Parse registration end
    var regEnd = t.registration_end ? new Date(t.registration_end + 'T23:59:59') : null;

    // Status check
    var now = new Date();
    var diff = startDate.getTime() - now.getTime();

    // Tournament already ended
    if (endDate && now > endDate) return;

    // Tournament in progress (started but not ended)
    if (diff <= 0) {
        container.innerHTML =
            '<div class="td-countdown td-countdown-live">' +
                '<div class="td-cd-pulse-dot"></div>' +
                '<span class="td-cd-live-text">' + CL.live + '</span>' +
            '</div>';
        return;
    }

    // Only show countdown if ≤ 48 hours
    if (diff > 48 * 60 * 60 * 1000) {
        // Check registration closing warning
        if (regEnd) {
            var regDiff = regEnd.getTime() - now.getTime();
            if (regDiff > 0 && regDiff < 24 * 60 * 60 * 1000) {
                container.innerHTML =
                    '<div class="td-countdown td-countdown-reg">' +
                        '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ' +
                        '<span>' + CL.regClosing + '</span>' +
                    '</div>';
            }
        }
        return;
    }

    // Render countdown boxes
    function renderTimer() {
        var now2 = new Date();
        var d = startDate.getTime() - now2.getTime();

        if (d <= 0) {
            clearInterval(interval);
            container.innerHTML =
                '<div class="td-countdown td-countdown-live">' +
                    '<div class="td-cd-pulse-dot"></div>' +
                    '<span class="td-cd-live-text">' + CL.live + '</span>' +
                '</div>';
            return;
        }

        var days = Math.floor(d / (1000 * 60 * 60 * 24));
        var hours = Math.floor((d % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var mins = Math.floor((d % (1000 * 60 * 60)) / (1000 * 60));
        var secs = Math.floor((d % (1000 * 60)) / 1000);

        var isUrgent = d < 10 * 60 * 1000; // < 10 min
        var isPulse = d < 60 * 60 * 1000;  // < 1 hour
        var urgentClass = isUrgent ? ' td-cd-urgent' : '';
        var pulseClass = isPulse ? ' td-cd-pulse' : '';

        var regWarning = '';
        if (regEnd) {
            var regDiff2 = regEnd.getTime() - now2.getTime();
            if (regDiff2 > 0 && regDiff2 < 24 * 60 * 60 * 1000) {
                regWarning =
                    '<div class="td-cd-reg-warning">' +
                        '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> ' +
                        CL.regClosing +
                    '</div>';
            }
        }

        var html =
            '<div class="td-countdown' + pulseClass + '">' +
                '<div class="td-cd-title">' + CL.title + '</div>' +
                '<div class="td-cd-boxes">';

        if (days > 0) {
            html +=
                    '<div class="td-cd-box' + urgentClass + '">' +
                        '<span class="td-cd-num">' + days + '</span>' +
                        '<span class="td-cd-label">' + CL.days + '</span>' +
                    '</div>';
        }

        html +=
                    '<div class="td-cd-box' + urgentClass + '">' +
                        '<span class="td-cd-num">' + String(hours).padStart(2, '0') + '</span>' +
                        '<span class="td-cd-label">' + CL.hours + '</span>' +
                    '</div>' +
                    '<div class="td-cd-box' + urgentClass + '">' +
                        '<span class="td-cd-num">' + String(mins).padStart(2, '0') + '</span>' +
                        '<span class="td-cd-label">' + CL.min + '</span>' +
                    '</div>' +
                    '<div class="td-cd-box' + urgentClass + '">' +
                        '<span class="td-cd-num">' + String(secs).padStart(2, '0') + '</span>' +
                        '<span class="td-cd-label">' + CL.sec + '</span>' +
                    '</div>' +
                '</div>' +
                regWarning +
            '</div>';

        container.innerHTML = html;
    }

    renderTimer();
    var interval = setInterval(renderTimer, 1000);
}

// ========================================
// LOCKED PAGE (not authorized)
// ========================================

function renderLockedPage(tournamentId) {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var authUrl = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');
    var backUrl = isEn ? 'tournaments-en.html' : (isKg ? 'tournaments-kg.html' : 'tournaments.html');

    var texts = isEn ? {
        title: 'Tournament Details',
        subtitle: 'Sign in to view the full bracket and match results',
        features: ['Full tournament bracket', 'Live scores and results', 'Player statistics'],
        btn: 'Sign In',
        btnRegister: 'Create Account',
        back: 'Back to Tournaments'
    } : (isKg ? {
        title: 'Мелдештин чоо-жайы',
        subtitle: 'Толук торду жана матч жыйынтыктарын көрүү үчүн кириңиз',
        features: ['Толук мелдеш тору', 'Түз эфирдеги упайлар жана жыйынтыктар', 'Оюнчулардын статистикасы'],
        btn: 'Кирүү',
        btnRegister: 'Аккаунт түзүү',
        back: 'Мелдештерге кайтуу'
    } : {
        title: 'Детали турнира',
        subtitle: 'Войдите, чтобы увидеть полную сетку и результаты матчей',
        features: ['Полная турнирная сетка', 'Счёт в реальном времени', 'Статистика игроков'],
        btn: 'Войти',
        btnRegister: 'Создать аккаунт',
        back: 'Назад к турнирам'
    });

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
                '<img src="../images/heroes/tournaments.jpg" alt="">' +
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
