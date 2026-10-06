// ========================================
// TOURNAMENT DETAIL — Rendering Logic
// ========================================

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/**
 * Подпись под местом в группе: почему оно такое.
 *
 * Равных по победам разводит личная встреча, матчи между собой, сеты или
 * геймы. Где не развело ничто — жеребьёвка. Без подписи одинаковые цифры в
 * таблице выглядели произволом.
 */
function почемуМесто(st, isEn, isKg) {
    var pick3 = function(en, kg, ru) { return isEn ? en : (isKg ? kg : ru); };

    if (st.жребий) {
        return '<span class="td-grp-lot" title="' +
            pick3('Wins, sets and games are all equal — the place is decided by lot',
                  'Жеңиштер, сеттер жана геймдер бирдей — орун чүчүкулак менен аныкталган',
                  'Победы, сеты и геймы равны — место определено жребием') + '">' +
            pick3('by lot', 'чүчүкулак', 'жребий') + '</span>';
    }

    var текст = {
        'встреча': pick3('head-to-head', 'өз ара беттеш', 'личная встреча'),
        'между собой': pick3('among tied', 'өз ара', 'между собой'),
        'сеты': pick3('on sets', 'сеттер боюнча', 'по сетам'),
        'геймы': pick3('on games', 'геймдер боюнча', 'по геймам')
    }[st.причина];

    return текст ? '<span class="td-grp-lot">' + текст + '</span>' : '';
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

function renderLeagueBracketPublic(leagueMatches, playersMap, prefix, isEn, isKg, predOpts, имяУчастника) {
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
                    // В парном турнире на корт выходят двое: страница передаёт,
                    // как назвать участника, и тогда в сетке видно обоих
                    name: имяУчастника
                        ? имяУчастника(pid)
                        : (p ? (isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name)) : 'TBD'),
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
        /* ПОДПИСЬ КРУГА БЕРЁТСЯ ИЗ ОДНОГО МЕСТА. Здесь стоял свой
           тернарник, и на 32 он давал «Раунд 1» там, где соседняя
           ветка давала «1/16 Финала». */
        var prName = KSLT_ROUNDS.подпись((isEn ? 'en' : (isKg ? 'kg' : 'ru')),
            Math.pow(2, totalRounds), pr, totalRounds);

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
    var thirdMatch = leagueMatches.find(function(m) {
        return m.round === prefix + '-3RD' && m.status !== 'cancelled';
    });
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
        ? window.KSLT_RULES.ficSections(drawSize, isEn ? 'en' : (isKg ? 'kg' : 'ru'))
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

/* КТО ИЗ КАКОЙ ГРУППЫ ВЫШЕЛ: `playerId` → `A1`, `G2`.
   Приём взят у `tdИтоги` строкой выше, а не придуман свой: карта считается
   один раз перед отрисовкой и читается из `renderMatch`, куда объект
   турнира приходит разными путями — их семь. Строит её
   `KSLT_GROUPS.меткиИгроков`, та же, что и в админке: иначе метка у
   менеджера и у зрителя разошлась бы ровно так же, как расходилось место
   в рейтинге. Сбрасывается на каждой отрисовке — турнир может смениться
   без перезагрузки страницы. */
var tdМеткиГрупп = {};

/* ЧЬЮ КЛЕТКУ ЖДЁМ: `matchId` → метки обоих слотов (`A1`, `IG1`, `Q1`).
   Метка живёт в базе в `slot1_label` / `slot2_label` и до 02.10 читалась
   ТОЛЬКО админкой (`bracket.js:6009`): зритель видел пятнадцать клеток
   «TBD» и не понимал ни одной, пока менеджер видел, кто куда выйдет. */
var tdМеткиСлотов = {};

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

/**
 * Фамилии для подписи под полосой прогноза.
 *
 * В одиночном это одна фамилия, в парном — обе через косую черту. Разметку
 * сначала убираем: имя пары приходит с тегами, и резать его по словам нельзя.
 */
function краткоеИмя(имя) {
    var текст = String(имя || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    if (!текст) return '';
    if (текст.indexOf('/') !== -1) {
        return текст.split('/').map(function (часть) {
            return часть.trim().split(' ').pop();
        }).filter(Boolean).join(' / ');
    }
    return текст.split(' ').pop() || '';
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

    /* МЕТКА ГРУППЫ — ПОСЛЕ ПОСЕВА, ПЕРЕД ИМЕНЕМ, как в админке. Пустая
       метка не рисуется вовсе: в сетке без групп её нет ни у кого, и
       пустая плашка съедала бы ширину у имени. */
    var p1Grp = tdМеткиГрупп[match.player1Id] || '';
    var p2Grp = tdМеткиГрупп[match.player2Id] || '';

    /* ПУСТАЯ КЛЕТКА ГОВОРИТ, КОГО ЖДЁТ. «A1» — победитель группы A, «IG1» —
       победитель первого дополнительного матча, «Q1» — первый из отбора.
       Это понятнее безликого «TBD» и видно сразу после жеребьёвки, когда
       групп ещё никто не доиграл. Правило и слова взяты у админки
       (`emptySlotName`, `bracket.js:6005`), а не придуманы заново.
       BYE не трогаем: там соперника не будет вовсе, и ждать некого. */
    var слоты = tdМеткиСлотов[match.matchId];
    if (слоты) {
        /* В КЛЕТКЕ С МЕТКАМИ ПУСТОЙ СЛОТ — ЭТО BYE, А НЕ «ЖДЁМ».
           `создатьПустойПлейофф` пишет метку каждому слоту, куда кто-то
           придёт; где не придёт — оставляет пусто. Значит отсутствие метки
           в такой клетке и есть свободное место: играть не с кем, а не
           «соперник ещё не определился». Слово Кости 02.10: «давай на
           публичной поставим BYE, а не TBD, где понятно, что нет игр».
           Замер на боевом CHALLENGERS: 14 меток на 16 слотов — свободных
           мест ровно два, и admin их тоже зовёт BYE. */
        if (!match.player1Id && p1.name === 'TBD') {
            p1 = слоты.s1
                ? { name: '<span class="td-slot-wait">' + esc(слоты.s1) + '</span>',
                    seed: null, country: '' }
                : { name: 'BYE', seed: null, country: '' };
        }
        if (!match.player2Id && p2.name === 'TBD') {
            p2 = слоты.s2
                ? { name: '<span class="td-slot-wait">' + esc(слоты.s2) + '</span>',
                    seed: null, country: '' }
                : { name: 'BYE', seed: null, country: '' };
        }
    }

    // Player 1
    html += '<div class="td-match-player ' + p1Class + '">' +
        (p1.seed ? '<span class="td-seed">[' + p1.seed + ']</span>' : '<span class="td-seed"></span>') +
        (p1Grp ? '<span class="td-grp-label">' + p1Grp + '</span>' : '') +
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
        (p2Grp ? '<span class="td-grp-label">' + p2Grp + '</span>' : '') +
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
            // Подпись под полосой — фамилии. Имя пары приходит с разметкой
            // (два игрока, каждый в своём теге), и «последнее слово» цепляло
            // кусок тега: на экране появлялось «Кульджаев</span>»
            var p1Short = краткоеИмя(p1.name);
            var p2Short = краткоеИмя(p2.name);
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

    // Кто проводил и кто судил — как в бумажном протоколе. Показываем только
    // заполненное: клуб вводит имена не для каждого турнира
    var директор = tournament.director_name || tournament.directorName;
    var судья = tournament.referee_name || tournament.refereeName;
    if (директор || судья) {
        var подпись = function(звание, имя) {
            if (!имя) return '';
            return '<div class="td-official">' +
                '<span class="td-official-role">' + звание + '</span>' +
                '<span class="td-official-name">' + esc(имя) + '</span>' +
            '</div>';
        };
        var язык = window.location.pathname;
        var наАнгл = язык.indexOf('-en') !== -1;
        var наКырг = язык.indexOf('-kg') !== -1;
        var звания = наАнгл
            ? { director: 'Tournament director', referee: 'Head referee' }
            : (наКырг
                ? { director: 'Турнир директору', referee: 'Башкы калыс' }
                : { director: 'Директор турнира', referee: 'Главный судья' });
        html += '<div class="td-officials">' +
            подпись(звания.director, директор) +
            подпись(звания.referee, судья) +
        '</div>';
    }

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

        // Возврат к категории появляется в полосе, когда такая же ссылка в
        // обложке уходит за верх экрана.
        //
        // Раньше за этим следил IntersectionObserver, привязанный к ссылке в
        // обложке. Но обложка перерисовывается, когда догружаются данные
        // турнира: наблюдаемый элемент выбрасывается из страницы, событий
        // больше нет, и ссылка в полосе не появлялась вовсе. Поэтому смотрим
        // на положение самой обложки и ищем её заново при каждой проверке
        var проверитьВозврат = function() {
            var обложка = document.querySelector('.td-hero');
            var ссылка = document.querySelector('.td-hero .td-back-link') || обложка;
            if (!ссылка) return;
            var ушла = ссылка.getBoundingClientRect().bottom < 64;
            tabsBackLink.classList.toggle('visible', ушла);
        };

        проверитьВозврат();
        window.addEventListener('scroll', проверитьВозврат, { passive: true });
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

    /* ЧИСЛО, КОТОРОЕ МОЖНО ПОМЕРИТЬ, НЕ ПИШЕТСЯ РУКАМИ.
       Было `var SCROLL_OFFSET = 120` с комментарием «64px header + ~50px
       tabs + 6px gap» — и тильда в нём не случайна: высоту полосы никто не
       мерил. Обход 05.10 померил: шапка 64, полоса вкладок **45**, не ~50.
       Отсюда и зазор под полосой выходил 11 — числа, которого нет на шкале
       отступов 8 · 12 · 16 · 24 · 32 · 40.
       Теперь обе высоты спрашиваются у страницы, а своим остаётся только
       зазор — и он ступень. Высота полосы зависит от числа вкладок (у
       дружеского их пять, у рейтингового шесть) и от вида, поэтому
       считается при КАЖДОМ прыжке, а не один раз при загрузке. */
    function смещениеПодПолосу() {
        var шапка = document.querySelector('.floating-header');
        var полоса = document.querySelector('.td-tabs-bar');
        var высота = (шапка ? шапка.getBoundingClientRect().height : 0) +
                     (полоса ? полоса.getBoundingClientRect().height : 0);
        return Math.round(высота) + 12;
    }

    /**
     * Лента вкладок едет за разделом, который читают.
     *
     * На телефоне шесть вкладок не помещаются в ширину: видно три, остальные
     * за краем. Пока листаешь страницу, подсветка уходила за границу ленты, и
     * приходилось искать её пальцем. Теперь активная вкладка сама подъезжает
     * в середину — как в приложениях с лентой разделов.
     *
     * Только вбок и только внутри ленты: страница от этого не дёргается.
     */
    var лента = tabsBar.querySelector('.td-tabs') || tabsBar;

    function показатьАктивную() {
        var активная = лента.querySelector('.td-tab.active');
        if (!активная || лента.scrollWidth <= лента.clientWidth) return;

        // Считаем по месту на экране, а не по offsetLeft: у вкладок он
        // отсчитывается от липкой полосы, и со ссылкой возврата слева
        // середина уезжала на её ширину
        var рЛ = лента.getBoundingClientRect();
        var рА = активная.getBoundingClientRect();
        var середина = лента.scrollLeft + (рА.left - рЛ.left) - (рЛ.width - рА.width) / 2;
        var предел = лента.scrollWidth - лента.clientWidth;
        var куда = Math.max(0, Math.min(предел, Math.round(середина)));
        if (Math.abs(лента.scrollLeft - куда) < 4) return;

        лента.scrollTo({ left: куда, behavior: 'smooth' });
    }

    // --- Tab click → scroll to section header ---
    tabsBar.addEventListener('click', function(e) {
        var tab = e.target.closest('.td-tab');
        if (!tab) return;

        tabsBar.querySelectorAll('.td-tab').forEach(function(t) {
            t.classList.remove('active');
            /* ДИКТОР ДОЛЖЕН ЗНАТЬ, КУДА МЫ ПРИШЛИ. Обход 05.10: вкладки —
               `button` без `role`, без `aria-selected` и без `aria-current`.
               Фокус встаёт, Tab доходит, нажатие работает — а какая из шести
               выбрана, диктор не говорит.
               Берём `aria-current`, а не `aria-selected`: вкладки не
               переключают вид, все шесть разделов на странице видны всегда.
               Это навигация по одной странице, а `aria-selected` обещало бы
               набор вкладок, которого здесь нет. */
            t.removeAttribute('aria-current');
        });
        tab.classList.add('active');
        tab.setAttribute('aria-current', 'true');
        показатьАктивную();
        // Ещё раз, когда плавная прокрутка страницы утихнет: она успевает
        // перебить движение ленты, и крайняя вкладка не доезжала
        setTimeout(показатьАктивную, 700);

        var targetId = tab.dataset.target;
        var targetSection = document.getElementById(targetId);
        if (targetSection) {
            window.scrollTo({ top: getDocTop(targetSection) - смещениеПодПолосу(), behavior: 'smooth' });
        }
    });

    // Update active tab on scroll (observe section headers which hold the IDs)
    var sectionHeaders = document.querySelectorAll('.td-section-header');
    var tabObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                var id = entry.target.id;
                tabsBar.querySelectorAll('.td-tab').forEach(function(t) {
                    var своя = (t.dataset.target === id);
                    t.classList.toggle('active', своя);
                    /* Пометка ставится ТАМ ЖЕ, где класс: разведи их по двум
                       местам — и диктор рано или поздно назовёт не ту. */
                    if (своя) t.setAttribute('aria-current', 'true');
                    else t.removeAttribute('aria-current');
                });
                показатьАктивную();
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
                window.scrollTo({ top: getDocTop(next) - смещениеПодПолосу(), behavior: 'smooth' });
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
                /* НЕ НАЙДЕН И «НУЖЕН ВХОД» — РАЗНЫЕ ЭКРАНЫ, И ДО 04.10 ОНИ
                   БЫЛИ ОДНИМ. Человек, открывший устаревшую ссылку, видел
                   «Войдите, чтобы увидеть полную сетку» у турнира, которого
                   нет вовсе.

                   ОТЛИЧИТЬ ИХ ПО ОТВЕТУ БАЗЫ НЕЛЬЗЯ: RLS прячет строку тем же
                   нулём строк, что и несуществующий id, а PostgREST отвечает
                   на .single() при нуле строк кодом 406 в обоих случаях.
                   Поэтому решает не ошибка, а ВОШЁЛ ЛИ ЧЕЛОВЕК: гостю
                   показываем вход — дело может быть в доступе; вошедшему
                   «не найден», потому что доступ у него уже есть. */
                var клиент = client;
                try {
                    клиент.auth.getSession().then(function(сес) {
                        var вошёл = !!(сес && сес.data && сес.data.session);
                        if (вошёл) renderNotFoundPage(); else renderLockedPage(id);
                    }).catch(function() { renderLockedPage(id); });
                } catch (e) { renderLockedPage(id); }
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
                ? client.from('courts').select('id, name, name_en, street, street_en, street_kg, building, city, city_en, city_kg, country, country_en, google_maps_url, twogis_url, photo').eq('id', tournament.court_id).single()
                : Promise.resolve({ data: null });

            Promise.all([matchesPromise, regsPromise, courtPromise]).then(function(results) {
                var matches = results[0].data || [];
                var registrations = results[1].data || [];
                var courtData = results[2].data || null;

                // Состав берём из заявок: матч знает свою заявку (reg1_id,
                // reg2_id), а кто в ней сегодня — дело самой заявки. Заменили
                // человека — имя меняется и здесь, без переписывания матчей.
                // Сыгранные не трогаем: их счёт принадлежит тем, кто играл
                (function освежитьСостав() {
                    var поId = {};
                    registrations.forEach(function(r) { поId[r.id] = r; });
                    matches.forEach(function(m) {
                        if (m.status === 'completed') return;
                        var r1 = m.reg1_id && поId[m.reg1_id];
                        var r2 = m.reg2_id && поId[m.reg2_id];
                        if (r1 && r1.player_id && m.player1_id) m.player1_id = r1.player_id;
                        if (r2 && r2.player_id && m.player2_id) m.player2_id = r2.player_id;
                    });
                })();

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
                    var playersPromise = client.from('players_public').select('id, name, name_en, photo, points, country, category_id, wins, losses, form, ntrp_singles, ntrp_doubles').in('id', playerIds);
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

/* Вычисление одно на всю КСЛТ — js/tournament-status.js */
function computeStatus(a, b, c, d) { return window.KSLT_STATUS.вычислить(a, b, c, d); }

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
    /* Подписи статусов живут в js/tournament-status.js — одно определение на одно понятие */
    var statusLabels = window.KSLT_STATUS.подписи(isEn ? 'en' : (isKg ? 'kg' : 'ru'));

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
        ? (isEn ? 'Women' : (isKg ? 'Аялдар' : 'Женский'))
        : gender === 'men'
        ? (isEn ? 'Men' : (isKg ? 'Эркектер' : 'Мужской'))
        : gender === 'mixed'
        ? (isEn ? 'Mixed' : (isKg ? 'Аралаш' : 'Смешанный'))
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
        drawNotYet: 'The draw has not been made yet',
        drawNotYetHint: 'The bracket will appear here once the draw is done.',
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
        drawNotYet: 'Жеребьёвка әлі өткөн жок',
        drawNotYetHint: 'Жеребьёвка өткөндөн кийин тор ушул жерде көрүнөт.',
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
        drawNotYet: 'Сетка ещё не сформирована',
        drawNotYetHint: 'Она появится здесь, когда пройдёт жеребьёвка.',
        noResults: 'Очки будут начислены после завершения турнира',
        noResultsPlain: 'Результаты появятся после завершения турнира',
        countdownTitle: 'ТУРНИР НАЧИНАЕТСЯ ЧЕРЕЗ',
        countdownDays: 'дней', countdownHours: 'часов', countdownMin: 'минут', countdownSec: 'секунд',
        tournamentLive: 'Турнир идёт',
        regClosingSoon: 'Регистрация закроется менее чем через 24 часа!'
    });

    // Прогноз показываем только в одиночных.
    //
    // В парном он считается по рейтингу капитана — а на корт выходят двое, и
    // сила пары складывается из обоих. Полоса выглядела уверенно, а опиралась
    // на половину данных, поэтому в парных её не показываем вовсе.
    /* Полоса прогноза выключена до декабря — решение Кости 02.10. Спрашиваем
       ТОТ ЖЕ выключатель, что и страница вызова: причина и числа в шапке
       js/match-prediction.js. Парные отключены отдельно и давно: формула
       берёт силу одного человека, а на корт выходят двое. */
    var предсказаниеВидно = !!(window.KSLT_PREDICTION && window.KSLT_PREDICTION.показывать());
    var predOpts = (isDbl || !предсказаниеВидно) ? null : {
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

            var естьГруппы = очередь.some(function(m) { return !!m.group_number; });

            var расписаниеHtml = '<div class="td-sched-court">' +
                '<table class="td-sched-table" id="tdSchedTable"><thead><tr>' +
                    '<th>№</th>' +
                    '<th>' + подписи.time + '</th>' +
                    // Заголовок по содержимому: в групповых турнирах в этой
                    // колонке стоит «Группа A», а не круг сетки
                    '<th>' + (естьГруппы ? подписи.group : подписи.round) + '</th>' +
                    '<th colspan="3">' + (isEn ? 'Match' : (isKg ? 'Оюн' : 'Игра')) + '</th>' +
                    '<th>' + подписи.court + '</th>' +
                    '<th>' + подписи.status + '</th>' +
                '</tr></thead>';

            var сыграноШтук = очередь.filter(function(m) { return m.status === 'completed'; }).length;
            расписаниеHtml += '<tbody>';

            очередь.forEach(function(m, i) {
                var круг = m.round || '';
                if (m.group_number) круг = подписи.group + ' ' + (KSLT_RULES.букваГруппы(m.group_number) || m.group_number);

                var состояние = m.status === 'completed' ? подписи.done
                    : (m.status === 'live' ? подписи.live : подписи.soon);
                var классСост = m.status === 'completed' ? 'td-sched-done'
                    : (m.status === 'live' ? 'td-sched-live' : 'td-sched-soon');

                /* СЫГРАННОЕ ПРЯЧЕТСЯ НА СВОЁМ МЕСТЕ, А НЕ УЕЗЖАЕТ В ОТДЕЛЬНОЕ
                   ТЕЛО ТАБЛИЦЫ.

                   Первая редакция собирала два `<tbody>`: сыгранные первым,
                   ждущие вторым. Довод был «сыгранные — это ранние запуски»,
                   и он НЕВЕРЕН: прогон 05.10 уронил проверку хронологии, а
                   замер боевого CHALLENGERS показал почему — в запуске 09:00
                   три матча «Завершён» и один «Ожидает». ОДИН ЗАПУСК БЫВАЕТ
                   ДОИГРАН НАПОЛОВИНУ: на четырёх кортах матчи кончаются в
                   разное время. Раздели строки по состоянию — и при раскрытии
                   номера пойдут 1, 3, 5… 2, 4, 6, то есть порядок по времени,
                   единственный смысл этой таблицы, порвётся.

                   Поэтому тело одно, строки стоят в своём порядке всегда, а
                   сыгранные прячутся атрибутом `hidden` каждая у себя. */
                var вСыгранные = (m.status === 'completed');
                расписаниеHtml += '<tr' + (m.status === 'live' ? ' class="td-sched-row-live"' : '') +
                    (вСыгранные ? ' data-sygran="1"' : '') + '>' +
                    '<td class="td-sched-num">' + (i + 1) + '</td>' +
                    '<td class="td-sched-time">' + esc(String(m.scheduled_time).slice(0, 5)) + '</td>' +
                    // Короткая подпись для телефона: там колонка узкая, и вместо
                    // «Группа A» показываем только букву — её берёт стиль из
                    // data-short
                    '<td><span class="td-sched-round" data-short="' +
                        esc(m.group_number ? (KSLT_RULES.букваГруппы(m.group_number) || m.group_number) : круг) +
                        '">' + esc(круг) + '</span></td>' +
                    '<td class="td-sched-p">' + pName(m.player1_id) + '</td>' +
                    '<td class="td-sched-vs">vs</td>' +
                    '<td class="td-sched-p">' + pName(m.player2_id) + '</td>' +
                    '<td class="td-sched-court-cell" data-short="' +
                        (m.court ? esc(String(m.court)) : '\u2014') + '">' +
                        (m.court ? подписи.court + ' ' + esc(String(m.court)) : '\u2014') + '</td>' +
                    '<td><span class="td-sched-status ' + классСост + '">' + состояние + '</span></td>' +
                '</tr>';
            });

            /* ПОЛОСА ПРЯЧЕТ ЛИШНЕЕ ТОЛЬКО ТОГДА, КОГДА ЕСТЬ ГЛАВНОЕ.
               Поймал замер 05.10, а не рассуждение: у `tsikl-odinochka`
               сыграны ВСЕ 42 матча, и раздел схлопнулся в одну кнопку с
               пустой таблицей высотой 94 — зритель завершённого турнира не
               видел расписания вовсе. Прятать сыгранное имеет смысл, пока
               есть несыгранное, которое оно загораживает; когда играть
               больше нечего, сыгранное И ЕСТЬ расписание.
               Поэтому два условия, а не одно: есть что прятать И есть ради
               чего прятать. */
            var ждутШтук = очередь.length - сыграноШтук;
            var полосаHtml = '';
            if (сыграноШтук && ждутШтук) {
                var словоСыгранные = isEn ? 'Played matches' : (isKg ? 'Ойнолгон оюндар' : 'Сыгранные');
                полосаHtml = '<button type="button" class="td-sched-ranshe" ' +
                    /* Называем ТАБЛИЦУ, а не исчезнувшее тело: строки прячутся
                       каждая у себя, общего узла у них нет, а `aria-controls`,
                       указывающий в пустоту, хуже отсутствующего. */
                    'aria-expanded="false" aria-controls="tdSchedTable">' +
                    '<span class="td-sched-ranshe-znak" aria-hidden="true"></span>' +
                    esc(словоСыгранные) + ' — ' + сыграноШтук + '</button>';
            }

            расписаниеHtml = полосаHtml + расписаниеHtml + '</tbody></table></div>';

            scheduleContainer.innerHTML = расписаниеHtml;

            var полоса = scheduleContainer.querySelector('.td-sched-ranshe');
            var сыгранныеСтроки = scheduleContainer.querySelectorAll('tr[data-sygran]');
            if (полоса && сыгранныеСтроки.length) {
                var показать = function (видно) {
                    сыгранныеСтроки.forEach(function (тр) { тр.hidden = !видно; });
                    полоса.setAttribute('aria-expanded', видно ? 'true' : 'false');
                    полоса.classList.toggle('is-open', видно);
                };
                показать(false);
                полоса.addEventListener('click', function () {
                    показать(полоса.getAttribute('aria-expanded') !== 'true');
                });
            }
        }
    }

    // ---- Bracket section ----
    var bracketContainer = document.getElementById('bracketContainer');
    if (bracketContainer) {
        if (matches.length > 0 && (t.bracket_type === 'single_elimination' || t.bracket_type === 'fic' || t.bracket_type === 'round_robin' || t.bracket_type === 'group_league')) {
            // Метки прошлой отрисовки не наследуются: турнир меняется без
            // перезагрузки страницы, и чужая метка пережила бы смену
            tdМеткиГрупп = {};

            /* МЕТКИ СЛОТОВ СНИМАЮТСЯ ОДИН РАЗ, А НЕ В СЕМИ МЕСТАХ.
               Объект матча для `renderMatch` собирается здесь семью
               разными кусками (`:346`, `:386`, `:1846`, `:1885`, `:2180`,
               `:2219`, `:2307`), и протащить два поля через каждый значило
               бы завести семь мест, где их можно забыть. Карта строится
               одной точкой — приёмом `tdИтоги`, который уже стоит рядом. */
            tdМеткиСлотов = {};
            matches.forEach(function(м) {
                if (м.slot1_label || м.slot2_label) {
                    tdМеткиСлотов[м.id] = {
                        s1: м.slot1_label || '',
                        s2: м.slot2_label || ''
                    };
                }
            });

            // ---- Group League: groups + dual leagues ----
            if (t.bracket_type === 'group_league') {
                var glGroupCount = t.group_count || 2;
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
                    glHtml += '<h3 class="td-league-title td-league-title-premier">' + подписьЛиги('PL', isEn, isKg) + '</h3>';
                    glHtml += renderLeagueBracketPublic(glPLMatches, playersMap, 'PL', isEn, isKg, predOpts, pName);
                    glHtml += '</div>';

                    // Consolation League
                    glHtml += '<div class="td-league-bracket">';
                    glHtml += '<h3 class="td-league-title td-league-title-consolation">' + подписьЛиги('CL', isEn, isKg) + '</h3>';
                    glHtml += renderLeagueBracketPublic(glCLMatches, playersMap, 'CL', isEn, isKg, predOpts, pName);
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

                    // Тот же общий расчёт, что в админке
                    var ggStandings = KSLT_GROUPS.расчёт(ggPlayerIds, ggMatches);
                    var ggHasResults = ggMatches.some(function(m) { return m.status === 'completed'; });
                    var ggGroupDone = ggMatches.length > 0 && ggMatches.every(function(m) {
                        return m.status === 'completed';
                    });

                    /* Ручные места — ОБЩЕЙ функцией, со своей проверкой.
                       Здесь стояла своя копия: она присваивала место без
                       проверки, что это ПЕРЕСТАНОВКА, и «два вторых» на
                       публичной были возможны, а в админке нет. */
                    KSLT_GROUPS.ручныеМеста(ggStandings,
                        (t.manual_group_places || {})[String(gg)]);

                    // Порядок строк не зависит от результатов: по посеву,
                    // дальше по порядку в группе
                    ggStandings.sort(function(a, b) {
                        var sa = a.seed || 9999; var sb = b.seed || 9999;
                        if (sa !== sb) return sa - sb;
                        return ggPlayerIds.indexOf(a.playerId) - ggPlayerIds.indexOf(b.playerId);
                    });

                    var ggLetter = KSLT_RULES.букваГруппы(gg) || String(gg);
                    glHtml += '<div style="margin-bottom:24px;">';
                    glHtml += '<div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:0.95rem;">' + (isEn ? 'Group ' : (isKg ? 'Топ ' : 'Группа ')) + ggLetter + '</div>';
                    glHtml += '<div style="overflow-x:auto;"><table class="td-group-table">';
                    glHtml += '<thead><tr><th>№</th><th>' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th>';
                    for (var gc = 0; gc < ggStandings.length; gc++) glHtml += '<th style="text-align:center;min-width:46px;white-space:nowrap;">' + (gc + 1) + '</th>';
                    glHtml += '<th style="text-align:center;width:30px;">' + (isEn ? 'W' : (isKg ? 'Ж' : 'П')) + '</th>';
                    glHtml += '<th style="text-align:center;width:44px;white-space:nowrap;">' + (isEn ? 'Games' : (isKg ? 'Геймдер' : 'Геймы')) + '</th>';
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

                        var glLot = ggGroupDone ? почемуМесто(gst, isEn, isKg) : '';
                        glHtml += '<td style="text-align:center;font-weight:600;">' + gst.wins + '</td>';
                        /* ПРОЦЕНТ ГЕЙМОВ — ТОЛЬКО У СПОРНЫХ, как в админке.
                           `разбор` заполняется лишь у тех, кого разводил
                           расчёт при равных победах. У кого спора не было —
                           прочерк: сравнивать не с чем, и число там только
                           мешает. Слово Кости 01.10.
                           Числа — ТЕ ЖЕ, ЧТО У МЕНЕДЖЕРА: встречи между
                           равными, а не по всей группе. */
                        var glДоли = KSLT_GROUPS.долиГеймов(gst.разбор);
                        glHtml += '<td style="text-align:center;font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' +
                            (ggHasResults && glДоли
                                ? gst.разбор.gamesWon + '-' + gst.разбор.gamesLost +
                                  '<br><span style="opacity:0.7;">' + glДоли.процент + '</span>'
                                : '—') + '</td>';
                        glHtml += '<td style="text-align:center;font-weight:700;white-space:nowrap;' + (gIsPL ? 'color:var(--accent);' : '') + '">' +
                            (ggHasResults ? gst.place : '—') + glLot + '</td>';
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
                var grpMatches = matches.filter(function(m) { return m.group_number && m.group_number > 0; });
                var igMatches = matches.filter(function(m) { return m.round === 'IG'; });
                var ploffMatches = matches.filter(function(m) { return (!m.group_number || m.group_number <= 0) && m.round !== 'IG'; });
                var hasPlayoff = ploffMatches.length > 0;
                var hasIG = igMatches.length > 0;
                var allGroupDone = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });

                /* ОТКУДА ПРИЕХАЛ ЧЕЛОВЕК В КЛЕТКЕ. Просьба Кости, сказанная
                   трижды: «в админке показывается, кто с какой группы
                   выходит куда, а на публичной нет — может, также отрисовать
                   её с G1 F1». Карту строит общий модуль, тот же, что и для
                   админки, и считается она ДО отрисовки сетки — ниже её
                   читает `renderMatch`. */
                tdМеткиГрупп = KSLT_GROUPS.меткиИгроков(
                    grpMatches, groupCount, t.manual_group_places);

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
                                    // В парном на корт выходят двое: берём имя пары,
                                    // а не одного капитана — иначе по сетке непонятно,
                                    // кто вообще играет
                                    name: pName(pid),
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
                        var prName = KSLT_ROUNDS.подпись((isEn ? 'en' : (isKg ? 'kg' : 'ru')),
                            Math.pow(2, plTotalRounds), pr, plTotalRounds);

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

                    // Отменённый матч за третье место участникам не показываем:
                    // он остаётся только в админке, пометкой
                    var thirdMatch = ploffMatches.find(function(m) {
                        return m.round === '3RD' && m.status !== 'cancelled';
                    });

                    bHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Playoff' : (isKg ? 'Плей-офф' : 'Плей-офф')) + '</h3>';
                    bHtml += '<div class="td-bracket-scroll"><div class="td-bracket">';
                    plRounds.forEach(function(round, ri) {
                        var isLastRound = ri === plRounds.length - 1;
                        bHtml += '<div class="td-bracket-round">';
                        bHtml += '<div class="td-round-title">' + round.name + '</div>';
                        bHtml += '<div class="td-bracket-matches">';
                        round.matches.forEach(function(match) { bHtml += renderMatch(plTournObj, match, predOpts); });
                        bHtml += '</div>';

                        // Матч за третье место — в колонке финала, но ниже
                        // самого финала, а не рядом с ним.
                        //
                        // Внутри контейнера матчей он делил место с финалом:
                        // финал уезжал вверх и переставал попадать на свою
                        // соединительную линию
                        if (isLastRound && thirdMatch) {
                            bHtml += '<div class="td-third-place">';
                            bHtml += '<div class="td-round-title">' +
                                (isEn ? '3rd Place' : (isKg ? '3-орун үчүн' : 'За 3-е место')) + '</div>';
                            bHtml += renderMatch(plTournObj, {
                                matchId: thirdMatch.id, player1Id: thirdMatch.player1_id, player2Id: thirdMatch.player2_id,
                                score: thirdMatch.score || '', winnerId: thirdMatch.winner_id, status: thirdMatch.status || 'upcoming'
                            }, predOpts);
                            bHtml += '</div>';
                        }

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

                    bHtml += '<div style="margin-bottom:32px;"></div>';
                }

                // Inter-group matches section
                if (hasIG) {
                    bHtml += '<h3 style="color:var(--accent);margin-bottom:16px;font-size:1.1rem;">' + (isEn ? 'Additional Matches' : (isKg ? 'Кошумча матчтар' : 'Дополнительные матчи')) + '</h3>';
                    // Класс нужен, чтобы на телефоне поставить карточки по две
                    // в ряд: минимум в 220 пикселей оставлял их по одной
                    bHtml += '<div class="td-ig-grid" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;margin-bottom:32px;">';
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

                    // Места считает общий расчёт — тот же, что в админке:
                    // победы, личная встреча, доля сетов, доля геймов. Раньше
                    // здесь место ставилось просто по числу побед, и при
                    // равенстве игрок видел один порядок, а менеджер другой
                    var standings = KSLT_GROUPS.расчёт(gPlayerIds, gMatches);
                    var sbGroupHasResults = gMatches.some(function(m) { return m.status === 'completed'; });
                    // Доиграна ли эта группа — по ней и решаем, показывать ли
                    // знак жеребьёвки. Готовность всего турнира тут ни при
                    // чём: соседние группы могут ещё играть
                    var sbGroupDone = gMatches.length > 0 && gMatches.every(function(m) {
                        return m.status === 'completed';
                    });

                    // Ручные места менеджера поверх расчёта — общей функцией,
                    // вторая копия из двух
                    KSLT_GROUPS.ручныеМеста(standings,
                        (t.manual_group_places || {})[String(g)]);

                    // Порядок строк не зависит от результатов: по посеву,
                    // дальше по порядку в группе
                    standings.sort(function(a, b) {
                        var sa = a.seed || 9999; var sb = b.seed || 9999;
                        if (sa !== sb) return sa - sb;
                        return gPlayerIds.indexOf(a.playerId) - gPlayerIds.indexOf(b.playerId);
                    });

                    var letter = KSLT_RULES.букваГруппы(g) || String(g);
                    bHtml += '<div style="margin-bottom:24px;">';
                    bHtml += '<div style="font-weight:700;color:var(--text-primary);margin-bottom:8px;font-size:0.95rem;">' + (isEn ? 'Group ' : (isKg ? 'Топ ' : 'Группа ')) + letter + '</div>';
                    bHtml += '<div style="overflow-x:auto;"><table class="td-group-table">';
                    bHtml += '<thead><tr><th>№</th><th>' + (isEn ? 'Player' : (isKg ? 'Оюнчу' : 'Игрок')) + '</th>';
                    for (var c = 0; c < standings.length; c++) bHtml += '<th style="text-align:center;min-width:46px;white-space:nowrap;">' + (c + 1) + '</th>';
                    bHtml += '<th style="text-align:center;width:30px;">' + (isEn ? 'W' : (isKg ? 'Ж' : 'П')) + '</th>';
                    bHtml += '<th style="text-align:center;width:44px;white-space:nowrap;">' + (isEn ? 'Games' : (isKg ? 'Геймдер' : 'Геймы')) + '</th>';
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
                        var sbLot = sbGroupDone ? почемуМесто(st, isEn, isKg) : '';
                        bHtml += '<td style="text-align:center;font-weight:600;">' + st.wins + '</td>';
                        /* ПРОЦЕНТ ГЕЙМОВ — ТОЛЬКО У СПОРНЫХ, как в админке.
                           `разбор` заполняется лишь у тех, кого разводил
                           расчёт при равных победах. У кого спора не было —
                           прочерк: сравнивать не с чем, и число там только
                           мешает. Слово Кости 01.10.
                           Числа — ТЕ ЖЕ, ЧТО У МЕНЕДЖЕРА: встречи между
                           равными, а не по всей группе. */
                        var sbДоли = KSLT_GROUPS.долиГеймов(st.разбор);
                        bHtml += '<td style="text-align:center;font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' +
                            (sbGroupHasResults && sbДоли
                                ? st.разбор.gamesWon + '-' + st.разбор.gamesLost +
                                  '<br><span style="opacity:0.7;">' + sbДоли.процент + '</span>'
                                : '—') + '</td>';
                        bHtml += '<td style="text-align:center;font-weight:700;white-space:nowrap;' + (isQualified ? 'color:var(--accent);' : '') + '">' +
                            sbPlaceDisplay + sbLot + '</td>';
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

            /* ЛЕНТА ВЫБОРА БЛОКА — вместо стопки из пятнадцати.
               Замер 05.10: у «всех мест» 32 сетка 5279, и основная занимает
               1416 — ВОСЕМЬ процентов из каждых тридцати. У 64 ещё хуже:
               11 270, основная 2553. Человек, которому нужен финал, листал
               четыре экрана мимо утешительных блоков; человек, взявший 23-е
               место, листал их же в обратную сторону.
               Собираем подписи по ходу отрисовки, а не заранее: какие блоки
               рисуются, решают два условия ниже, и вторая копия этих условий
               разошлась бы с первой ровно на шве. */
            var ficВидимые = [];
            ficSections.forEach(function(section) {
                // Прячем только ветки, чьих мест в турнире не бывает: сетка
                // строится на степень двойки, и при 22 участниках из 32 мест
                // десять выдуманные.
                if (section.первоеМесто > участниковВСетке) return;
                // И пока в блоке никого нет — тоже не рисуем: блоки
                // появляются по мере игры.
                if (!ficВБлокеЕстьЛюди(section, matches)) return;

                var номерБлока = ficВидимые.length;
                ficВидимые.push(section.label);
                bHtml += '<div class="td-fic-section' + (номерБлока ? ' td-fic-skryt' : '') +
                         '" data-fic-blok="' + номерБлока + '">';
                /* Подпись блока остаётся в разметке: лента называет блок
                   кнопкой, а диктор читает заголовок. Прятать её значило бы
                   оставить раздел без имени для того, кто ленты не видит. */
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

            /* Лента рисуется ТОЛЬКО когда блоков больше одного: при одном
               она не выбирает ничего и лишь отнимает ступень высоты. */
            if (ficВидимые.length > 1) {
                var подписьЛенты = isEn ? 'Bracket blocks'
                    : (isKg ? 'Тор блокторy' : 'Блоки сетки');
                var лентаHtml = '<div class="td-fic-lenta" role="radiogroup" aria-label="' +
                    esc(подписьЛенты) + '">';
                ficВидимые.forEach(function(имя, i) {
                    лентаHtml += '<button type="button" class="td-fic-chip' +
                        (i ? '' : ' is-active') + '" role="radio" aria-checked="' +
                        (i ? 'false' : 'true') + '" data-fic-chip="' + i + '">' +
                        esc(имя) + '</button>';
                });
                лентаHtml += '</div>';
                bHtml = лентаHtml + bHtml;
            }

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

            /* ВЫРАВНИВАНИЕ СЧИТАЕТСЯ ЗАНОВО ПРИ ПОКАЗЕ БЛОКА.
               `выровнятьМатчиЗаМеста` меряет `offsetLeft` и `clientWidth`, а
               ЭЛЕМЕНТ СО СКРЫТЫМ РОДИТЕЛЕМ ОТДАЁТ НУЛИ — правило выведено
               24.09 и стоит в указателе. Посчитай мы сдвиг один раз при
               отрисовке, у всех скрытых блоков матчи за места встали бы к
               левому краю и остались там навсегда. */
            if (ficВидимые.length > 1) {
                bracketContainer.addEventListener('click', function(e) {
                    var чип = e.target.closest('.td-fic-chip');
                    if (!чип) return;
                    var нужен = чип.getAttribute('data-fic-chip');
                    bracketContainer.querySelectorAll('.td-fic-chip').forEach(function(к) {
                        var свой = k_акт(к, нужен);
                        к.classList.toggle('is-active', свой);
                        к.setAttribute('aria-checked', свой ? 'true' : 'false');
                    });
                    bracketContainer.querySelectorAll('.td-fic-section').forEach(function(б) {
                        б.classList.toggle('td-fic-skryt', б.getAttribute('data-fic-blok') !== нужен);
                    });
                    requestAnimationFrame(function() {
                        выровнятьМатчиЗаМеста(bracketContainer);
                    });
                });
            }
            function k_акт(узел, нужен) {
                return узел.getAttribute('data-fic-chip') === нужен;
            }

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
            /* КИРГИЗСКИЙ ЗДЕСЬ ПАДАЛ В РУССКИЙ: ветки `kg` не было вовсе. */
            var lang = (isEn ? 'en' : (isKg ? 'kg' : 'ru'));
            var roundDefs = (typeof ROUND_DEFS !== 'undefined' && ROUND_DEFS[lang] && ROUND_DEFS[lang][drawSize])
                ? ROUND_DEFS[lang][drawSize]
                : null;

            for (var r = 1; r <= totalRounds; r++) {
                var roundMatches = matches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                    .sort(function(a, b) { return a.match_order - b.match_order; });

                var roundName = '';
                roundName = KSLT_ROUNDS.подпись(lang, drawSize, r, totalRounds);

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
            /* ПОД ЗАГОЛОВКОМ «ТУРНИРНАЯ СЕТКА» ЛЕЖИТ СЕТКА, А НЕ ОПИСАНИЕ.
               Здесь стояло описание турнира — то же самое, что уже стоит
               разделом выше: на странице оно оказывалось ДВАЖДЫ, а человек,
               пришедший за сеткой, читал вместо неё пересказ регламента.
               Замер 06.10 по боевой базе: под эту ветку попадают два живых
               турнира и тридцать архивных.
               Пустое состояние НЕ МОЛЧИТ, а называет причину и срок:
               `Empty state 37:53` — «never just no data». */
            bracketContainer.innerHTML =
                '<div class="td-no-results">' +
                    '<p class="td-empty-title">' + L.drawNotYet + '</p>' +
                    '<p class="td-empty-hint">' + L.drawNotYetHint + '</p>' +
                '</div>';
        }
    }

    // ---- Participants from registrations ----
    // Раздел «Очки» — только у турниров с рейтингом
    //
    // На дружеских и парных очки не начисляются, и вкладка вела в пустой
    // раздел с надписью «результатов пока нет». Человек ждал, что там
    // что-то появится, а появиться было нечему
    (function() {
        if (isRatingTournament(t)) return;
        var вкладка = document.querySelector('.td-tab[data-target="results"]');
        if (вкладка) вкладка.remove();
        var заголовок = document.getElementById('results');
        if (заголовок) {
            var раздел = заголовок.nextElementSibling;
            заголовок.remove();
            if (раздел && раздел.querySelector('#resultsPodium')) раздел.remove();
        }
    })();

    var participantsGrid = document.getElementById('participantsGrid');
    if (participantsGrid) {
        var maxPart = t.max_participants || 16;
        // После жеребьёвки заявка получает состояние draw — и раздел
        // «Участники» оставался пустым, хотя в турнире 18 пар. Берём все
        // живые заявки: одобренные, ожидающие проверки и попавшие в сетку
        var mainDrawRegs = registrations.filter(function(r) {
            return r.status === 'approved' || r.status === 'pending' || r.status === 'draw';
        }).sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var waitlistRegs = registrations.filter(function(r) { return r.status === 'waitlist'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });

        var mainDraw = mainDrawRegs.slice(0, maxPart);
        var waitlist = mainDrawRegs.slice(maxPart).concat(waitlistRegs);

        if (mainDraw.length > 0) {
            var partHtml = '';
            var mainDrawLabel = isEn ? 'Main Draw' : (isKg ? 'Негизги тор' : 'Основная сетка');
            var waitlistLabel = isEn ? 'Waitlist' : (isKg ? 'Күтүү тизмеси' : 'Лист ожидания');
            var thName = isEn ? 'Name' : (isKg ? 'Аты-жөнү' : 'ФИО');
            var thCat = 'NTRP';
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
                // Вместо категории — NTRP: в списке заявок важен уровень игры,
                // а не разряд. У пары показываем обоих через косую черту.
                // В парном турнире берём парный рейтинг, в одиночном — одиночный
                function ntrpИгрока(id) {
                    var и = playersMap[id];
                    if (!и) return null;
                    var знач = isDbl ? (и.ntrp_doubles || и.ntrp_singles) : и.ntrp_singles;
                    return знач ? Number(знач).toFixed(1) : null;
                }

                var catLabel;
                if (isDbl) {
                    var н1 = ntrpИгрока(reg.player_id);
                    var н2 = ntrpИгрока(reg.partner_id);
                    catLabel = (н1 || н2) ? ((н1 || '—') + ' / ' + (н2 || '—')) : '—';
                } else {
                    catLabel = ntrpИгрока(reg.player_id) || '—';
                }
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

                    resultsPodium.innerHTML = resHtml;

                    /* ИТОГИ — ОДНА ТАБЛИЦА НА ВСЕ ЧЕТЫРЕ ТИПА СЕТКИ.
                       Здесь стояла своя: номер и имя, ОЧКОВ НЕ БЫЛО ВОВСЕ, а
                       стили зашиты в разметку. Понятие одно — «итоги
                       турнира», — и экранов у него было три.

                       Место у фика ТОЧНОЕ, а не полоса: там разыграны все
                       места, и считает их эта же страница по номеру матча
                       последнего круга. В базе их нет — `tournament_results`
                       хранит только буквенный код, — поэтому отдаём картой
                       отсюда. */
                    var местаФика = {};
                    ficPlaces.forEach(function(ф) { местаФика[ф.playerId] = ф.place; });
                    показатьРаскладкуОчков(t, resultsPodium, resHtml, isEn, isKg, pName, местаФика);
                } else {
                    resultsPodium.innerHTML = '<div class="td-no-results"><p>' + (isRatingTournament(t) ? L.noResults : L.noResultsPlain) + '</p></div>';
                }
            } else if (t.bracket_type === 'group_league') {
                /* ПЬЕДЕСТАЛ У КАЖДОЙ ЛИГИ СВОЙ — слово Кости 03.10:
                   «в утешиловке тоже сделай пьедестал такой же, 1 2 3 места».
                   Лиг две, результата два; один пьедестал на обе читался бы
                   так, будто утешительная — часть верхней. */
                function пьедесталЛиги(вид) {
                    var свои = matches.filter(function (m) {
                        return m.round && m.round.indexOf(вид + '-') === 0 &&
                               m.round !== вид + '-3RD';
                    });
                    var макс = 0;
                    свои.forEach(function (m) { if (m.round_number > макс) макс = m.round_number; });
                    var финал = свои.find(function (m) {
                        return m.round_number === макс && m.status === 'completed' && m.winner_id;
                    });
                    if (!финал || !финал.winner_id) return '';

                    var поб = playersMap[финал.winner_id] || {};
                    var ид2 = финал.winner_id === финал.player1_id ? финал.player2_id : финал.player1_id;
                    var h = '<h3 class="td-league-title td-league-title-' +
                            (вид === 'PL' ? 'premier' : 'consolation') + '">' +
                            подписьЛиги(вид, isEn, isKg) + '</h3>' +
                        '<div class="td-podium">' +
                            podiumCard(поб, 1, '🥇') +
                            podiumCard(playersMap[ид2] || {}, 2, '🥈');

                    /* ТРЕТЬЕ МЕСТО ДАЁТ ТОЛЬКО МАТЧ ЗА ТРЕТЬЕ МЕСТО — решение
                       Кости 01.10, и оно одно на все типы сетки. */
                    var третий = matches.find(function (m) {
                        return m.round === вид + '-3RD' && m.status === 'completed' && m.winner_id;
                    });
                    if (третий) h += podiumCard(playersMap[третий.winner_id] || {}, 3, '🥉');
                    return h + '</div>';
                }

                var пьедесталПЛ = пьедесталЛиги('PL');
                var пьедесталЦЛ = пьедесталЛиги('CL');

                if (пьедесталПЛ || пьедесталЦЛ) {
                    resultsPodium.innerHTML = пьедесталПЛ + пьедесталЦЛ;

                    /* ЛИГА ИГРОКА БЕРЁТСЯ ИЗ МАТЧЕЙ, А НЕ ВЫВОДИТСЯ. В
                       `tournament_results` её нет, а в матчах она стоит
                       приставкой круга — `PL-` и `CL-`, тем же признаком, по
                       которому страница рисует две сетки выше (`:1688`). */
                    var лигаИгрока = {};
                    matches.forEach(function (m) {
                        var вид = m.round && m.round.indexOf('PL-') === 0 ? 'PL'
                                : m.round && m.round.indexOf('CL-') === 0 ? 'CL' : null;
                        if (!вид) return;
                        [m.player1_id, m.player2_id].forEach(function (ид) {
                            if (ид) лигаИгрока[ид] = вид;
                        });
                    });

                    /* ИТОГИ ЧИТАЮТСЯ ОТТУДА ЖЕ, ОТКУДА У ВСЕХ. Здесь стояла
                       своя таблица из `rating_history`: второй источник одного
                       понятия, где место было НОМЕРОМ СТРОКИ, а этапа не было
                       совсем. */
                    показатьРаскладкуОчков(t, resultsPodium, '', isEn, isKg, pName,
                        null, лигаИгрока, { PL: пьедесталПЛ, CL: пьедесталЦЛ });
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

                    /* ТРЕТЬЕ МЕСТО ДАЁТ ТОЛЬКО МАТЧ ЗА ТРЕТЬЕ МЕСТО.
                       Слово Кости 01.10: «3 места — если не играли за 3 место,
                       то только 1 и 2».

                       Здесь стоял запасной ход: раз матча за третье нет —
                       раздать бронзу всем проигравшим полуфинал. Он брал их
                       фильтром `round_number === totalRounds - 1`, который НЕ
                       ОТСЕКАЕТ ГРУППОВЫЕ МАТЧИ, а `round_number` у них тоже
                       заполнен. Замер 01.10 на d8b39287: искался
                       `round_number === 3`, находилось 16 матчей, из них 14
                       групповых — и на пьедестале выросли шестнадцать
                       «третьих мест». Восемнадцать карточек на 800 пикселей
                       дают по 45 на каждую, и имена рассыпались по буквам
                       в столбик.

                       `totalRounds` считался из `t.draw_size || 16`, а
                       `draw_size` у турнира пуст — круг «полуфинала» выбирался
                       наугад и совпал случайно.

                       Соседняя ветка `group_league` (`:2563`) всё это время
                       делала правильно: третье место там только из матча за
                       третье место. Берём её поведение, а не изобретаем своё. */
                    var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
                    if (thirdPlaceMatch) {
                        var thirdPlayer = playersMap[thirdPlaceMatch.winner_id] || {};
                        resHtml += podiumCard(thirdPlayer, 3, '🥉');
                    }

                    resHtml += '</div>';
                    resultsPodium.innerHTML = resHtml;

                    /* ПЬЕДЕСТАЛ ПОКАЗЫВАЕТ ТРОИХ, А СЫГРАЛИ ВСЕ.
                       Слово Кости 01.10: «надо будет отобразить так, как
                       надо, чтобы все видели». Под пьедесталом — вся
                       раскладка: кто на каком этапе остановился и сколько
                       очков получил.

                       Источник — `tournament_results`, то, что посчитала и
                       записала админка при завершении турнира. Своего счёта
                       страница не ведёт: именно второй счёт мест и развёл
                       пьедестал с действительностью (16 «третьих мест»).

                       МЕСТО ПИШЕМ ТОЛЬКО ТАМ, ГДЕ ОНО ОПРЕДЕЛЕНО. У
                       сеточных этапов оно выводится однозначно; у места в
                       группе — нет: третье место группы A и третье группы B
                       стоят в таблице по силе, а не по букве. Там прочерк,
                       а не номер строки. */
                    показатьРаскладкуОчков(t, resultsPodium, resHtml, isEn, isKg, pName);
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

/**
 * РАСКЛАДКА ОЧКОВ ПОД ПЬЕДЕСТАЛОМ.
 *
 * Читает `tournament_results` — то, что админка посчитала при завершении
 * турнира, — и показывает всех: место, имя, этап, очки. Своего счёта тут
 * нет и быть не должно: второй счёт одного понятия и развёл пьедестал с
 * действительностью.
 *
 * Подписи этапа и место по этапу берём из `KSLT_POINTS`: их читают ещё
 * админка, кабинет и страница игрока.
 *
 * Дорисовываем ПОВЕРХ уже выставленного пьедестала, а не вместо него:
 * ответ базы приходит позже, и присваивание целиком стёрло бы карточки.
 */
/* ───────── НАЗВАНИЯ ЛИГ — ОДНО ОПРЕДЕЛЕНИЕ ─────────
 *
 * Слова «Высшая лига» и «Утешительная лига» стояли вписанными прямо в
 * разметку сеток (`:1701` и `:1707`). Таблице итогов они нужны те же, и
 * вторая копия родила бы расхождение ровно на шве: сетка называет лигу
 * одним словом, таблица под ней — другим.
 */
function подписьЛиги(вид, isEn, isKg) {
    var П = {
        PL: { ru: 'Высшая лига',       en: 'Premier League',     kg: 'Жогорку лига' },
        CL: { ru: 'Утешительная лига', en: 'Consolation League', kg: 'Сооротуу лигасы' }
    }[вид] || { ru: '', en: '', kg: '' };
    return isEn ? П.en : (isKg ? П.kg : П.ru);
}

function показатьРаскладкуОчков(t, контейнер, пьедесталHtml, isEn, isKg, имя, точныеМеста, лиги, пьедесталыЛиг) {
    if (!контейнер || typeof supabaseClient === 'undefined') return;
    if (typeof KSLT_POINTS === 'undefined') return;

    var язык = isEn ? 'en' : (isKg ? 'kg' : 'ru');
    var П = {
        ru: { место: 'Место', игрок: 'Игрок', этап: 'Этап', очки: 'Очки', итог: 'Итоги турнира' },
        en: { место: 'Place', игрок: 'Player', этап: 'Stage', очки: 'Points', итог: 'Tournament results' },
        kg: { место: 'Орун', игрок: 'Оюнчу', этап: 'Этап', очки: 'Упай', итог: 'Турнирдин жыйынтыгы' }
    }[язык];
    var ВСЕХ = { ru: 'Показать всех', en: 'Show all', kg: 'Баарын көрсөтүү' }[язык];

    /* СКОЛЬКО СТРОК ВИДНО СРАЗУ.
       Ограничения не было вовсе: запрос идёт без `limit`, и строки рисуются
       все до одной. На восьми это читается, на 64 — стена в треть экрана, и
       смотрят её с телефона. Восемь — не красивое число, а размер самой
       мелкой сетки: столько мест разыгрывает турнир, где играют все.
       Решение Кости 03.10: «первые 8, остальные под кнопку». */
    var СТРОК_СРАЗУ = 8;

    supabaseClient.from('tournament_results')
        .select('player_id, round_reached, points_earned')
        .eq('tournament_id', t.id)
        .then(function(ответ) {
            var строки = ответ.data || [];
            if (!строки.length) return;

            /* ТАМ, ГДЕ МЕСТА РАЗЫГРАНЫ ВСЕ, ПОРЯДОК ЗАДАЁТ МЕСТО.
               В сетке «все места» второй и третий по очкам могут стоять
               вровень, а места у них разные и разыграны матчем: сортировать
               такую таблицу очками значило бы спорить с кортом.
               Где точного места нет — порядок прежний: сперва очки, при
               равных кто прошёл дальше. */
            var поМесту = function (ид) {
                return точныеМеста && точныеМеста[ид] !== undefined
                    ? точныеМеста[ид] : null;
            };
            строки.sort(function(a, b) {
                var ма = поМесту(a.player_id), мб = поМесту(b.player_id);
                if (ма !== null && мб !== null) return ма - мб;
                var оа = a.points_earned || 0, об = b.points_earned || 0;
                if (оа !== об) return об - оа;
                return KSLT_POINTS.порядокРаунда(a.round_reached) -
                       KSLT_POINTS.порядокРаунда(b.round_reached);
            });

            /* ТАБЛИЦА РИСУЕТСЯ ОДНОЙ ФУНКЦИЕЙ, А ЗОВЁТСЯ ОДИН РАЗ ИЛИ ДВА.
               В двух лигах РЕЗУЛЬТАТА ДВА: у верхней сетки свой победитель и
               свои 1-2, у утешительной свои, и платятся они РАЗНЫМИ таблицами
               (`bracket.js:2351`). Один список с прочерками это прятал.
               Слово Кости 03.10: «2 лиги — значит 2 результата». */
            function таблица(свои, заголовок) {
                if (!свои.length) return '';
                var h = '<div class="td-results-table">' +
                (заголовок ? '<h3 class="td-results-title">' + заголовок + '</h3>' : '') +
                '<table><thead><tr>' +
                    '<th class="td-res-place">' + П.место + '</th>' +
                    '<th>' + П.игрок + '</th>' +
                    '<th class="td-res-stage">' + П.этап + '</th>' +
                    '<th class="td-res-pts">' + П.очки + '</th>' +
                '</tr></thead><tbody>';
                h += строкиТаблицы(свои);
                h += '</tbody></table>';
                if (свои.length > СТРОК_СРАЗУ) {
                    h += '<button type="button" class="td-res-more">' +
                         ВСЕХ + ' (' + свои.length + ')</button>';
                }
                return h + '</div>';
            }

            function строкиТаблицы(свои) {
                var html = '';
                свои.forEach(function(р, номер) {
                var своё = поМесту(р.player_id);

                /* МЕСТО: ТОЧНОЕ ТАМ, ГДЕ ЕГО РАЗЫГРАЛИ, ПОЛОСА — ГДЕ НЕТ.
                   Четверо проигравших четвертьфинал между собой не играли и
                   стоят на 5-8; в сетке «все места» тот же пятый сыграл за
                   пятое и шестое, и полоса у него была бы неправдой. */
                var место = своё !== null ? своё : KSLT_POINTS.местоПоРаунду(р.round_reached);
                var подпись = своё !== null ? String(своё)
                    : KSLT_POINTS.подписьМеста(р.round_reached);

                /* ЭТАП НАЗЫВАЕТ ТО, ЧТО БЫЛО. Где места разыграны, этап — это
                   матч за места: буквенный код там взят для ОЧКОВ, и
                   «Полуфинал» у пятого означал бы матч, которого не было. */
                var этап = своё !== null
                    ? KSLT_POINTS.подписьМатчаЗаМеста(своё, язык)
                    : KSLT_POINTS.подписьРаунда(р.round_reached, язык);

                var медаль = место === 1 ? '🥇 ' : место === 2 ? '🥈 ' : место === 3 ? '🥉 ' : '';
                /* СКРЫТА, А НЕ ВЫБРОШЕНА: строка есть в разметке, её читает
                   поиск по странице и диктор, кнопка лишь снимает класс.
                   Выброшенную пришлось бы дорисовывать вторым проходом. */
                var скрыта = свои.length > СТРОК_СРАЗУ && номер >= СТРОК_СРАЗУ
                    ? ' td-res-hidden' : '';
                var классы = (место === 1 ? 'td-res-winner' : '') + скрыта;
                html += '<tr' + (классы ? ' class="' + классы.trim() + '"' : '') + '>' +
                    '<td class="td-res-place">' + медаль + (подпись === null ? '—' : подпись) + '</td>' +
                    '<td>' + имя(р.player_id) + '</td>' +
                    '<td class="td-res-stage">' + этап + '</td>' +
                    '<td class="td-res-pts">' + (р.points_earned || 0) + '</td>' +
                '</tr>';
                });
                return html;
            }

            var html;
            if (лиги) {
                var своиЛиги = function (вид) {
                    return строки.filter(function (р) { return лиги[р.player_id] === вид; });
                };
                /* Кто не попал ни в одну лигу — не выброшен: он вышел из
                   группы и не сыграл ни одного матча плей-офф. Таблица «вне
                   лиг» показывает его под своим заголовком, а не прячет. */
                var безЛиги = строки.filter(function (р) { return !лиги[р.player_id]; });

                /* ЛИГА — ОДИН БЛОК: её название, её пьедестал, её таблица.
                   Название стоит ОДИН раз, на пьедестале: повторять его ещё и
                   над таблицей значило бы сказать одно дважды, а читается это
                   как две разные вещи. Пьедестала нет (лига не доиграна) —
                   название берёт на себя таблица. */
                var блок = function (вид, свои) {
                    var пьед = (пьедесталыЛиг && пьедесталыЛиг[вид]) || '';
                    return пьед + таблица(свои, пьед ? '' : подписьЛиги(вид, isEn, isKg));
                };
                html = блок('PL', своиЛиги('PL')) +
                       блок('CL', своиЛиги('CL')) +
                       таблица(безЛиги, П.итог);
            } else {
                html = таблица(строки, П.итог);
            }

            контейнер.innerHTML = пьедесталHtml + html;

            /* Кнопка снимает класс со СВОЕЙ таблицы, а не со всех: лиг две, и
               раскрытая верхняя не должна раскрывать утешительную. */
            контейнер.querySelectorAll('.td-res-more').forEach(function (кнопка) {
                кнопка.addEventListener('click', function () {
                    var таб = кнопка.closest('.td-results-table');
                    if (таб) таб.classList.add('td-res-full');
                    кнопка.remove();
                });
            });
        });
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
    /* Адрес собирается в одном месте — js/court-address.js */
    var address = window.KSLT_ADDRESS.адрес(court, isEn ? 'en' : (isKg ? 'kg' : 'ru'));

    /* Черновик — корт без фотографий, покрытий и цен: его страницы на сайте
       нет, и вести на неё некуда. Название остаётся текстом, карта работает:
       доехать до места важнее, чем открыть карточку */
    var черновик = !court.published_at;
    var courtUrl = черновик ? '' : (isEn ? 'court-en.html?id=' + court.id : (isKg ? 'court-kg.html?id=' + court.id : 'court.html?id=' + court.id));
    var mapUrl = court.google_maps_url || court.twogis_url || '';
    var fullAddress = [courtName, address, 'Bishkek'].filter(Boolean).join(', ');
    var embedUrl = getMapEmbed(mapUrl, fullAddress);

    var html = '<div class="td-venue-card">';

    // Info block
    html += '<div class="td-venue-info">' +
        (черновик
            ? '<span class="td-venue-name td-venue-name-plain">' + esc(courtName) + '</span>'
            : '<a href="' + esc(courtUrl) + '" class="td-venue-name">' + esc(courtName) + '</a>');
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
            // Своя карточка вошедшего: бан и категория нужны, чтобы объяснить
            // отказ до нажатия. Гостю это чтение не выполняется — он сюда не
            // доходит, — поэтому берём саму таблицу, не публичную вьюху
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

/**
 * Спрятать тело страницы турнира: вкладки, разделы, ИХ ЗАГОЛОВКИ и спонсоров.
 *
 * ЗАГОЛОВКИ РАЗДЕЛОВ ПРЯТАЛИСЬ НЕ ВСЕ. До 04.10 скрывались только .td-section,
 * а заголовок каждого раздела живёт в СОСЕДНЕМ узле .td-section-header — и
 * шесть пустых заголовков оставались на экране: «Описание турнира», «Место
 * проведения», «Участники», «Турнирная сетка», «Расписание запусков», «Очки».
 * Человек видел турнир, в котором «ничего нет». Замер 04.10 на боевой базе:
 * видимых разделов ноль, видимых заголовков шесть, высота страницы 1502.
 */
function спрятатьТелоСтраницы() {
    var tabsBar = document.getElementById('tabsBar');
    if (tabsBar) tabsBar.style.display = 'none';
    document.querySelectorAll('.td-section, .td-section-header').forEach(function(s) {
        s.style.display = 'none';
    });
    var sponsors = document.getElementById('sponsors');
    if (sponsors) sponsors.style.display = 'none';
}

/**
 * Турнира нет. Говорим это словами и даём дорогу назад.
 *
 * ПРОЧЕРК НЕ ОБЪЯСНЯЕТ СЕБЯ — и пустая страница тоже. Кнопки входа здесь нет
 * нарочно: человек уже вошёл, и предлагать ему войти значит врать о причине.
 */
function renderNotFoundPage() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var backUrl = isEn ? 'tournaments-en.html' : (isKg ? 'tournaments-kg.html' : 'tournaments.html');

    var texts = isEn ? {
        title: 'Tournament not found',
        subtitle: 'The link may be out of date, or the tournament has been removed.',
        back: 'Back to Tournaments'
    } : (isKg ? {
        title: 'Мелдеш табылган жок',
        subtitle: 'Шилтеме эскирген болушу мүмкүн же мелдеш өчүрүлгөн.',
        back: 'Мелдештерге кайтуу'
    } : {
        title: 'Турнир не найден',
        subtitle: 'Возможно, ссылка устарела или турнир удалили.',
        back: 'Назад к турнирам'
    });

    спрятатьТелоСтраницы();

    var hero = document.getElementById('tournamentHero');
    if (!hero) return;
    hero.innerHTML =
        '<div class="td-hero-bg">' +
            '<img src="../images/heroes/tournaments.jpg" alt="">' +
            '<div class="td-hero-overlay"></div>' +
        '</div>' +
        '<div class="td-hero-content td-hero-locked">' +
            '<h1>' + texts.title + '</h1>' +
            '<p class="td-locked-subtitle">' + texts.subtitle + '</p>' +
            '<a href="' + backUrl + '" class="td-back-link td-notfound-back">' +
                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> ' +
                texts.back +
            '</a>' +
        '</div>';
    /* ТИТУЛ В ПОРЯДКЕ СТРАНИЦЫ, А НЕ НАОБОРОТ: остальные страницы пишут
       «КСЛТ — X», и латиницей на английской и кыргызской. Первый заход 04.10
       дал «Tournament not found — КСЛТ» — кириллица в английском титуле.
       ЧИСЛО, ПОМЕРЕННОЕ НА ОДНОМ ЯЗЫКЕ, НЕ ЯВЛЯЕТСЯ ЧИСЛОМ; к подписям это
       относится так же. */
    document.title = (isEn || isKg ? 'KSLT' : 'КСЛТ') + ' — ' + texts.title;
}

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

    спрятатьТелоСтраницы();

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
