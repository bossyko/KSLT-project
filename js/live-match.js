/**
 * КСЛТ — СТРАНИЦА МАТЧА.
 *
 * ЭКРАНА-СПИСКА БОЛЬШЕ НЕТ. До 24.09 файл умел два вида: с ?id= —
 * один матч, без ?id= — список всех живых. На список не ссылался
 * НИ ОДИН файл проекта, а надпись «Все матчи» вела на секцию Live
 * главной. Костя 24.09: «у нас нет второго экрана». Убрано 132
 * строки здесь и 119 в css, ссылка стала «На главную».
 *
 * СЕТКА НЕ МЕНЯЕТСЯ: слева видео, если есть youtube_url, и ход
 * матча, если его нет. Табло справа всегда. Решение Кости 24.09.
 */
(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = {
        loading:   isEn ? 'Loading...'      : isKg ? 'Жүктөлүүдө...'   : 'Загрузка...',
        notFound:  isEn ? 'Match not found' : isKg ? 'Матч табылган жок': 'Матч не найден',
        live:      'LIVE',
        warmup:    isEn ? 'WARM-UP'   : isKg ? 'ДАЯРДОО'  : 'РАЗМИНКА',
        paused:    isEn ? 'PAUSED'    : isKg ? 'ТЫНЫМ'    : 'ПАУЗА',
        completed: isEn ? 'COMPLETED' : isKg ? 'АЯКТАГАН' : 'ЗАВЕРШЁН',
        tiebreak:  isEn ? 'Tiebreak'  : isKg ? 'Тайбрейк' : 'Тайбрейк',
        /* Кыргызские подписи до 24.09 повторяли русские — перевод мой. */
        tournament: isEn ? 'Tournament' : isKg ? 'Мелдеш' : 'Турнир',
        format:     isEn ? 'Format'     : isKg ? 'Формат' : 'Формат',
        serving:    isEn ? 'Serving'    : isKg ? 'Берүүдө': 'Подаёт',
        wins:       isEn ? 'wins!'      : isKg ? 'жеңет!' : 'побеждает!',
        backHome:   isEn ? 'Home'       : isKg ? 'Башкы бетке' : 'На главную',
        sponsor:    isEn ? 'Match supported by' : isKg ? 'Матчты колдогон' : 'Матч при поддержке',
        feedTitle:  isEn ? 'Match progress' : isKg ? 'Матчтын жүрүшү' : 'Ход матча',
        setN:       isEn ? 'set'  : isKg ? 'сет' : 'сет',
        gameNow:    isEn ? 'Current game' : isKg ? 'Учурдагы гейм' : 'Текущий гейм',
        ace:        isEn ? 'ace'    : isKg ? 'эйс'     : 'эйс',
        doubleF:    isEn ? 'double' : isKg ? 'кош ката': 'двойная',
        game:       isEn ? 'game'  : isKg ? 'гейм' : 'гейм',
        allSets:    isEn ? 'All'   : isKg ? 'Баары' : 'Все',
        breakLabel: isEn ? 'break' : isKg ? 'брейк' : 'брейк',
        emptyTitle: isEn ? 'The match has not started yet' : isKg ? 'Матч азырынча башталган жок' : 'Матч ещё не начался',
        emptyText:  isEn ? 'Match progress will appear here with the first point.'
                  : isKg ? 'Матчтын жүрүшү биринчи розыгрыштан кийин ушул жерде чыгат.'
                         : 'Ход матча появится здесь с первым розыгрышем.'
    };

    /** «Лучший из 3» по-русски, «Best of 3» по-английски, «3 сет» по-кыргызски. */
    function formatValue(bestOf) {
        var n = bestOf || 3;
        if (isEn) return 'Best of ' + n;
        if (isKg) return n + ' сет';
        return 'Лучший из ' + n;
    }

    var QUERY = '*, player1:players!live_matches_player1_id_fkey(id, name, name_en, name_kg, photo), player2:players!live_matches_player2_id_fkey(id, name, name_en, name_kg, photo)';

    var matchId = null;
    var matchChannel = null;
    var pointsChannel = null;
    var points = [];          // журнал розыгрышей, по возрастанию seq
    var lastMatch = null;     // последняя отрисованная строка матча
    var selectedSet = null;   // выбранный чип: null = все
    var pollTimer = null;
    var realtimeConnected = false;

    function init() {
        var params = new URLSearchParams(window.location.search);
        matchId = params.get('id');
        if (!matchId) { showError(L.notFound); return; }
        loadMatch();
        loadPoints();
        subscribeMatch();
        subscribePoints();
        pollTimer = setInterval(function() {
            if (!realtimeConnected) loadMatch();
        }, 5000);
    }

    function loadMatch() {
        var client = window.supabaseClient;
        if (!client) return;
        client.from('live_matches').select(QUERY).eq('id', matchId).single()
            .then(function(res) {
                if (res.error || !res.data) { showError(L.notFound); return; }
                render(res.data);
            });
    }

    function subscribeMatch() {
        var client = window.supabaseClient;
        if (!client) return;
        matchChannel = client.channel('live-match-' + matchId)
            .on('postgres_changes', {
                event: 'UPDATE', schema: 'public', table: 'live_matches',
                filter: 'id=eq.' + matchId
            }, function() { realtimeConnected = true; loadMatch(); })
            .subscribe(function(status) {
                if (status === 'SUBSCRIBED') {
                    realtimeConnected = true;
                    if (pollTimer) { clearInterval(pollTimer); pollTimer = null; }
                }
            });
    }

    /* ЖУРНАЛ РОЗЫГРЫШЕЙ. Таблица live_match_points, пишет судейский модуль.
       Здесь только чтение. */
    function loadPoints() {
        var client = window.supabaseClient;
        if (!client) return;
        client.from('live_match_points')
            .select('seq,set_no,game_no,winner,p1,p2,g1,g2,game_won,is_break,is_tiebreak,mark')
            .eq('match_id', matchId)
            .order('seq', { ascending: true })
            .then(function(res) {
                if (res.error) return;
                points = res.data || [];
                if (lastMatch) render(lastMatch);
            });
    }

    function subscribePoints() {
        var client = window.supabaseClient;
        if (!client) return;
        pointsChannel = client.channel('live-points-' + matchId)
            .on('postgres_changes', {
                event: '*', schema: 'public', table: 'live_match_points',
                filter: 'match_id=eq.' + matchId
            }, function() { loadPoints(); })
            .subscribe();
    }

    /* Розыгрыши в геймы. Гейм закрыт тем розыгрышем, у которого стоит
       game_won; последний незакрытый — текущий. */
    function groupGames(list) {
        var games = [];
        var cur = null;
        list.forEach(function(pt) {
            if (!cur || cur.set_no !== pt.set_no || cur.game_no !== pt.game_no) {
                cur = { set_no: pt.set_no, game_no: pt.game_no, points: [], won: null, is_break: false };
                games.push(cur);
            }
            cur.points.push(pt);
            if (pt.game_won) { cur.won = pt.game_won; cur.is_break = !!pt.is_break; cur.g1 = pt.g1; cur.g2 = pt.g2; }
        });
        return games;
    }

    function render(m) {
        var container = document.getElementById('lmContainer');
        if (!container) return;
        lastMatch = m;

        var p1 = m.player1 || {};
        var p2 = m.player2 || {};
        var p1Name = getPlayerName(p1, m.player1_name);
        var p2Name = getPlayerName(p2, m.player2_name);

        var setsData = m.sets_data || [];
        var isCompleted = m.status === 'completed';
        var isWarmup    = m.status === 'warmup';
        var isPaused    = m.status === 'paused';

        var pageSuffix = isEn ? '-en' : isKg ? '-kg' : '';
        var backHtml = '<a href="../index' + pageSuffix + '.html" class="lm-back-link">' +
            '<span aria-hidden="true">←</span>' + L.backHome + '</a>';

        var titleHtml =
            '<h1 class="lm-title">' + esc(p1Name) + ' — ' + esc(p2Name) + '</h1>' +
            '<p class="lm-meta">' +
                (m.tournament_label ? esc(m.tournament_label) + ' · ' : '') +
                formatValue(m.best_of) +
            '</p>';

        /* ЛЕВАЯ КОЛОНКА. Одна сетка, разное содержимое. */
        var ytId = extractYoutubeId(m.youtube_url);
        var leftHtml = ytId
            ? '<div class="lm-video"><div class="lm-video-wrapper">' +
                '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&rel=0" ' +
                'title="' + esc(p1Name) + ' — ' + esc(p2Name) + '" ' +
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
                '</div></div>'
            : feedHtml(m, setsData, isWarmup);

        /* Тона бейджа — общие с лендингом: .live-badge + is-*.
           Своих классов у страницы больше нет. */
        var badgeMod  = isWarmup ? 'is-warmup' : isPaused ? 'is-paused' : isCompleted ? 'is-completed' : 'is-live';
        var badgeText = isWarmup ? L.warmup : isPaused ? L.paused : isCompleted ? L.completed : L.live;

        var p1SetsHtml = '', p2SetsHtml = '';
        setsData.forEach(function(s) {
            p1SetsHtml += '<div class="lm-set-score">' + s.g1 + '</div>';
            p2SetsHtml += '<div class="lm-set-score">' + s.g2 + '</div>';
        });
        if (!isCompleted) {
            p1SetsHtml += '<div class="lm-set-score lm-current">' + (m.current_game_p1 || 0) + '</div>';
            p2SetsHtml += '<div class="lm-set-score lm-current">' + (m.current_game_p2 || 0) + '</div>';
            var pt1, pt2;
            if (m.is_tiebreak) { pt1 = m.tiebreak_p1 || 0; pt2 = m.tiebreak_p2 || 0; }
            else               { pt1 = m.points_p1 || '0'; pt2 = m.points_p2 || '0'; }
            p1SetsHtml += '<div class="lm-points-score">' + pt1 + '</div>';
            p2SetsHtml += '<div class="lm-points-score">' + pt2 + '</div>';
        }

        var servingName = m.serving_player === 1 ? p1Name : m.serving_player === 2 ? p2Name : null;

        /* aria-live: счёт меняется сам, и диктор обязан об этом узнать.
           До 24.09 на странице не было ни одного aria. */
        var scorePanelHtml =
            '<div class="lm-score-panel" aria-live="polite" aria-atomic="false">' +
                '<div class="lm-live-badge-wrap" style="padding:var(--space-3) var(--space-4);border-bottom:1px solid var(--border-subtle)">' +
                    '<span class="live-badge ' + badgeMod + '">' + badgeText + '</span>' +
                '</div>' +
                '<div class="lm-players">' +
                    playerRow(p1, p1Name, p1SetsHtml, m.serving_player === 1, m.winner_player === 1) +
                    playerRow(p2, p2Name, p2SetsHtml, m.serving_player === 2, m.winner_player === 2) +
                '</div>' +
                (m.is_tiebreak && !isCompleted ? '<div class="lm-tiebreak-badge">' + L.tiebreak + '</div>' : '') +
                (isCompleted && m.winner_player
                    ? '<div class="lm-winner-block">' +
                        '<div class="lm-winner-text">' + esc(m.winner_player === 1 ? p1Name : p2Name) + ' ' + L.wins + '</div>' +
                        (m.final_score ? '<div class="lm-final-score">' + esc(m.final_score) + '</div>' : '') +
                      '</div>'
                    : '') +
                '<div class="lm-info">' +
                    (servingName && !isCompleted
                        ? '<div class="lm-info-row"><span>' + L.serving + '</span><span class="lm-info-val">' + esc(servingName) + '</span></div>'
                        : '') +
                    (m.tournament_label ? '<div class="lm-info-row"><span>' + L.tournament + '</span><span class="lm-info-val">' + esc(m.tournament_label) + '</span></div>' : '') +
                    '<div class="lm-info-row"><span>' + L.format + '</span><span class="lm-info-val">' + formatValue(m.best_of) + '</span></div>' +
                '</div>' +
                /* СПОНСОР МАТЧА. Имя — не украшение: картинка без имени
                   подписывается диктору как «Sponsor». Если имя есть, оно и
                   становится подписью логотипа и видимым текстом. */
                (m.sponsor_logo || m.sponsor_name
                    ? '<div class="lm-sponsor"><span>' + L.sponsor + '</span>' +
                      (m.sponsor_logo
                        ? '<img class="lm-sponsor-logo" src="' + esc(m.sponsor_logo) + '" alt="' + esc(m.sponsor_name || L.sponsor) + '">'
                        : '') +
                      (m.sponsor_name ? '<span class="lm-sponsor-name">' + esc(m.sponsor_name) + '</span>' : '') +
                      '</div>'
                    : '') +
            '</div>';

        container.innerHTML =
            backHtml + titleHtml +
            '<div class="lm-grid">' + leftHtml + scorePanelHtml + '</div>';

        /* Чип фильтрует список на месте — перерисовываем только ленту. */
        var чипы = container.querySelectorAll('.lm-chip');
        for (var i = 0; i < чипы.length; i++) {
            чипы[i].addEventListener('click', function() {
                var v = this.getAttribute('data-set');
                selectedSet = v === '' ? null : parseInt(v, 10);
                render(lastMatch);
            });
        }
    }

    function playerRow(p, name, scoresHtml, serving, winner) {
        return '<div class="lm-player-row' + (serving ? ' lm-serving' : '') + (winner ? ' lm-winner-row' : '') + '">' +
            avatarHtml(p, name) +
            '<div class="lm-name-block"><div class="lm-player-name">' +
                (serving ? '<span class="lm-serve-indicator" aria-hidden="true"></span>' : '') +
                esc(name) +
            '</div></div>' +
            '<div class="lm-scores">' + scoresHtml + '</div>' +
        '</div>';
    }

    /**
     * ХОД МАТЧА. Занимает место видео, когда трансляции нет.
     *
     * ЭТО ПЕРВАЯ ВЕРСИЯ: она строится из того, что база пишет
     * сегодня — sets_data и текущий гейм. Ленты пойнт-за-пойнтом
     * пока нет: поле history — это судейский стек отмены
     * (js/umpire.js:41-52), нажатие «отменить» стирает из него
     * запись, и зрителю такую ленту показывать нельзя. Нестираемый
     * журнал заводится отдельным заходом.
     */
    /**
     * ХОД МАТЧА, вариант А — выбран мной, не Костей: геймы, и текущий гейм
     * очко за очком. ~30 строк за матч вместо 400-500, и на телефоне лента
     * читается без бесконечной прокрутки. Так же устроены ленты у сервисов
     * живого счёта: прошлое свёрнуто, разворачивается нажатием.
     *
     * Переключение сетов — ЧИП, а не таб. Описание Filter chip 49:77:
     * «a chip filters a list in place, a Tab switches the whole view».
     */
    function feedHtml(m, setsData, isWarmup) {
        var games = groupGames(points);

        /* ЖУРНАЛА НЕТ — ЭТО ТРИ РАЗНЫХ СЛУЧАЯ, И ОНИ НЕ ОДИН.
           Первым заходом я показывал на все три «Матч ещё не начался», и
           Костя это поймал на живом матче: справа шёл счёт 1 : 0 и статус
           LIVE, а слева стояло, что матч не начался. Подпись врала.

           Разминка — да, не начался. Идёт или завершён, а журнала нет
           (судейский модуль ещё не пишет, запись не дошла, матч начат до
           того, как журнал завели) — показываем то, что база даёт наверняка:
           сыгранные сеты и текущий гейм. Меньше, чем розыгрыш за розыгрышем,
           но правда. */
        if (!games.length) {
            if (isWarmup) {
                return '<div class="lm-empty">' +
                    '<p class="lm-empty-title">' + L.emptyTitle + '</p>' +
                    '<p class="lm-empty-text">' + L.emptyText + '</p>' +
                '</div>';
            }
            return грубаяЛента(m, setsData);
        }

        var наборы = [];
        games.forEach(function(g) { if (наборы.indexOf(g.set_no) === -1) наборы.push(g.set_no); });
        var чипы = '';
        if (наборы.length > 1) {
            чипы += chip(null, L.allSets, selectedSet === null);
            наборы.forEach(function(n) {
                чипы += chip(n, n + '-й ' + L.setN, selectedSet === n);
            });
            чипы = '<div class="lm-feed-chips">' + чипы + '</div>';
        }

        var видимые = games.filter(function(g) {
            return selectedSet === null || g.set_no === selectedSet;
        });

        var текущий = видимые.length && !видимые[видимые.length - 1].won
            ? видимые[видимые.length - 1] : null;
        var закрытые = видимые.filter(function(g) { return g.won; }).reverse();

        var html = '<div class="lm-feed">' +
            '<p class="lm-feed-title">' + L.feedTitle + '</p>' + чипы;

        if (текущий) {
            html += '<p class="lm-feed-now">' + L.gameNow + ' · ' +
                esc(текущий.set_no + '-й ' + L.setN + ', ' + L.game + ' ' + текущий.game_no) + '</p>' +
                '<ul class="lm-points" aria-live="polite">' +
                текущий.points.map(function(pt) {
                    /* Метка показывается, когда судья её поставил, и молчит,
                       когда нет. Пусто значит «не отмечено», а НЕ «эйса не
                       было»: метка у судьи необязательная. */
                    var метка = pt.mark === 'ace' ? L.ace : pt.mark === 'double' ? L.doubleF : '';
                    return '<li class="lm-point lm-point-w' + pt.winner +
                        (метка ? ' has-mark' : '') + '">' +
                        esc(pt.p1 + '\u2013' + pt.p2) +
                        (метка ? '<span class="lm-point-mark">' + метка + '</span>' : '') +
                    '</li>';
                }).join('') +
                '</ul>';
        }

        html += '<ul class="lm-feed-list">' +
            закрытые.map(function(g) {
                var кто = g.won === 1 ? nameOf(m, 1) : nameOf(m, 2);
                return '<li class="lm-feed-item">' +
                    '<span>' + esc(L.game + ' ' + g.game_no + ' \u2014 ' + кто) + '</span>' +
                    (g.is_break
                        ? '<span class="lm-break">' + L.breakLabel + '</span>'
                        : '<span class="lm-feed-note">' + esc(g.g1 + ' : ' + g.g2) + '</span>') +
                '</li>';
            }).join('') +
            '</ul></div>';
        return html;
    }

    /**
     * ЛЕНТА ИЗ ТОГО, ЧТО БАЗА ПИШЕТ ВСЕГДА — сеты и текущий гейм.
     * Запасной путь, когда журнала розыгрышей нет. Не притворяется
     * подробной: показывает ровно столько, сколько знает.
     */
    function грубаяЛента(m, setsData) {
        var строки = (setsData || []).map(function(s, i) {
            return { lead: (i + 1) + '-й ' + L.setN + ' — ' + s.g1 + ' : ' + s.g2, note: '', now: false };
        });
        if (m.status !== 'completed') {
            /* Счёт очков стоит СРАЗУ за геймом, а не улетает к дальнему краю:
               в списке геймов справа живёт «брейк» и счёт по геймам, а в
               одной строке разрыв на три четверти ширины читается так же
               плохо, как растянутое табло. */
            var очки = m.is_tiebreak ? (m.tiebreak_p1 || 0) + ' : ' + (m.tiebreak_p2 || 0)
                                     : (m.points_p1 || '0') + ' : ' + (m.points_p2 || '0');
            строки.push({
                lead: L.gameNow + ' — ' + (m.current_game_p1 || 0) + ' : ' + (m.current_game_p2 || 0) +
                      '   ·   ' + очки,
                note: '',
                now: true
            });
        }
        if (!строки.length) return '';
        return '<div class="lm-feed">' +
            '<p class="lm-feed-title">' + L.feedTitle + '</p>' +
            '<ul class="lm-feed-list">' +
            строки.map(function(it) {
                return '<li class="lm-feed-item' + (it.now ? ' is-now' : '') + '">' +
                    '<span>' + esc(it.lead) + '</span>' +
                    (it.note ? '<span class="lm-feed-note">' + esc(it.note) + '</span>' : '') +
                '</li>';
            }).join('') +
            '</ul></div>';
    }

    function chip(value, label, active) {
        return '<button type="button" class="lm-chip' + (active ? ' is-active' : '') +
            '" data-set="' + (value === null ? '' : value) + '"' +
            (active ? ' aria-pressed="true"' : ' aria-pressed="false"') + '>' +
            esc(label) + '</button>';
    }

    function nameOf(m, n) {
        var p = n === 1 ? (m.player1 || {}) : (m.player2 || {});
        return getPlayerName(p, n === 1 ? m.player1_name : m.player2_name);
    }

    function getPlayerName(p, fallbackName) {
        if (isEn && p && p.name_en) return p.name_en;
        if (isKg && p && p.name_kg) return p.name_kg;
        if (p && p.name) return p.name;
        return fallbackName || '—';
    }

    function avatarHtml(player, name) {
        if (player && player.photo) {
            return '<img class="lm-avatar" src="' + esc(player.photo) + '" alt="' + esc(name) + '">';
        }
        var initial = name ? name.charAt(0).toUpperCase() : '?';
        return '<div class="lm-avatar-placeholder" aria-hidden="true">' + initial + '</div>';
    }

    function showError(msg) {
        var container = document.getElementById('lmContainer');
        if (container) container.innerHTML = '<div class="lm-error">' + msg + '</div>';
    }

    function esc(s) {
        if (!s) return '';
        var d = document.createElement('div');
        d.textContent = s;
        return d.innerHTML;
    }

    function extractYoutubeId(url) {
        if (!url) return null;
        var m = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|live\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
        return m ? m[1] : null;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
