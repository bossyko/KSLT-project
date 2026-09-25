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
        /* ПОДПИСИ СОСТОЯНИЯ УШЛИ В ОБЩИЙ СЛОВАРЬ js/live-texts.js.
           Слово paused трогают четыре файла проекта, а человеческое слово до
           25.09 стояло только здесь — и причина перерыва разошлась бы ровно
           на этом шве. Одно определение на одно понятие. */
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
        /* Ячейка того, кто выиграл гейм. Короткое слово, а не нули:
           база пишет выигравшее очко уже со сброшенным счётом. */
        gameCell:   isEn ? 'game'  : isKg ? 'гейм'  : 'гейм',
        /* Пометка идущего гейма. Короче, чем «Текущий гейм»: стоит
           в правом углу заголовка, где места на одно слово. */
        gameLive:   isEn ? 'live'  : isKg ? 'жүрүүдө' : 'идёт',
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
    /* Блок спонсоров лиги: живёт вне контейнера, переносится в правую
       колонку при каждой перерисовке. См. render(). */
    var спонсорыУзел = null;
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
            /* ИМЯ ТУРНИРА — ОТДЕЛЬНЫМ ЭЛЕМЕНТОМ. Решение Кости 25.09:
               «это название турнира же». В строке под заголовком стояли
               рядом имя турнира и формат, одинаково тихие, — а это две
               разные вещи: одна отвечает на «где играют», вторая на
               «сколько сетов». Отличаем весом, а не вторым цветом. */
            '<p class="lm-meta">' +
                (m.tournament_label
                    ? '<span class="lm-meta-tour">' + esc(m.tournament_label) + '</span> · '
                    : '') +
                formatValue(m.best_of) +
            '</p>';

        /* ЛЕВАЯ КОЛОНКА. Одна сетка, разное содержимое. */
        /* РАСКЛАДКА ВЫВОДИТСЯ ИЗ ДАННЫХ — есть ли youtube_url.
           Решение Кости 25.09 по макету, вариант Б2.

           ЕСТЬ ТРАНСЛЯЦИЯ: слева видео и под ним УЗКАЯ полоса спонсоров,
           справа табло и под ним журнал. Кадр получает 656 x 369 вместо
           485 x 273 — почти вдвое по площади. Журнал становится вторым.
           НЕТ ТРАНСЛЯЦИИ: слева журнал во всю колонку 800, справа табло и
           обычный блок спонсоров. Журналу больше нечего уступать.

           ЧЕМ ПЛАТИМ, посчитано ДО правки: в колонке 400 в ряд помещается
           СЕМЬ очков против восемнадцати в колонке 800 — ширина минус поля
           32, минус колонка имени 104, делить на шаг ячейки 36. Обычный
           гейм четыре-шесть очков, влезает; гейм «на ровно» от восьми —
           поедет вбок. Костя видел это числом и на макете 1:1.

           ОТВЕРГНУТ вариант без сжатия полосы спонсоров: там видео росло
           на 29 пикселей, а журнал терял ровно столько же, сколько здесь.
           Цена без выигрыша. */
        var ytId = extractYoutubeId(m.youtube_url);
        var естьВидео = !!ytId;
        var videoHtml = естьВидео
            ? '<div class="lm-video"><div class="lm-video-wrapper">' +
                '<iframe src="https://www.youtube.com/embed/' + ytId + '?autoplay=1&mute=1&rel=0" ' +
                'title="' + esc(p1Name) + ' — ' + esc(p2Name) + '" ' +
                'allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>' +
                '</div></div>'
            : '';
        var feedHtmlStr = feedHtml(m, setsData, isWarmup);
        var leftHtml = '<div class="lm-left' + (естьВидео ? ' has-video' : '') + '">' +
            (естьВидео ? videoHtml : feedHtmlStr) + '</div>';

        /* Тона бейджа — общие с лендингом: .live-badge + is-*.
           Своих классов у страницы больше нет. */
        /* ПЕРЕРЫВ И ПРИЧИНА ПАУЗЫ. До 25.09 зритель видел голое «ПАУЗА» и
           обычное «LIVE» во время смены сторон — и не понимал, почему две
           минуты ничего не происходит. Слова собирает общий словарь
           js/live-texts.js: одно определение на одно понятие. */
        /* Словарь подключается тегом в трёх html-файлах. Если его забыли —
           это беда сборки, а не повод уронить всю страницу матча: говорим о
           ней в консоли и показываем хотя бы состояние. Глушим беду, а не
           её голос. */
        var Т = window.KSLTLiveTexts;
        if (!Т) {
            console.error('Не подключён js/live-texts.js — подписи состояния будут неполными');
            Т = { слово: function (к) { return к === 'live' ? 'LIVE' : ''; },
                  пауза: function () { return 'PAUSE'; },
                  остаток: function () { return 0; } };
        }
        var остатокПерерыва = isCompleted ? 0 : Т.остаток(m.break_until);
        var идётПерерыв = остатокПерерыва > 0 && !isPaused && !isWarmup;

        var badgeMod  = isWarmup ? 'is-warmup'
                      : isPaused ? 'is-paused'
                      : isCompleted ? 'is-completed'
                      : идётПерерыв ? 'is-paused'
                      : 'is-live';
        var badgeText = isWarmup ? Т.слово('warmup')
                      : isPaused ? Т.пауза(m.pause_reason)
                      : isCompleted ? Т.слово('completed')
                      /* ЧИСЛА ЗРИТЕЛЮ НЕ ПОКАЗЫВАЕМ. Страница опрашивает базу
                         раз в пять секунд (js/live-match.js:84–86), и отсчёт
                         прыгал бы через четыре секунды — это выглядит поломкой.
                         Зрителю нужно знать ПОЧЕМУ ничего не происходит, а часы
                         есть у судьи. */
                      : идётПерерыв ? Т.слово(m.break_kind || 'changeover')
                      : Т.слово('live');

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

        /* СВЕДЕНИЯ — ПОДПИСЬ ПОД ТАБЛО, А НЕ ЧАСТЬ ТАБЛО.
           Решение Кости 25.09: «а „подаёт · турнир · формат“ — может,
           убрать там рамку». Он прав по существу: карточка счёта обязана
           кончаться полосой под вторым игроком, иначе рядом стоящий блок
           спонсоров тянется ей вровень и пустует снизу. Подпись живёт
           отдельным узлом, без подложки и без рамки.
           При идущей трансляции подписи нет вовсе: её высоту забирает
           журнал, а кто подаёт — видно по мячику в строке игрока.
           Костя: «не надо возвращать, там мячик есть, кто подаёт». */
        var infoHtml =
            '<div class="lm-info">' +
                (servingName && !isCompleted
                    ? '<div class="lm-info-row"><span>' + L.serving + '</span><span class="lm-info-val">' + esc(servingName) + '</span></div>'
                    : '') +
                (m.tournament_label ? '<div class="lm-info-row"><span>' + L.tournament + '</span><span class="lm-info-val">' + esc(m.tournament_label) + '</span></div>' : '') +
                '<div class="lm-info-row"><span>' + L.format + '</span><span class="lm-info-val">' + formatValue(m.best_of) + '</span></div>' +
            '</div>';

        /* ОДИН ПРИЗНАК НА ОДНО ПОНЯТИЕ: «идёт трансляция» помечается
           классом на body и только им. Раскладка узких видов трогает
           шапку, подвал и отбивку страницы — узлы вне сетки, — поэтому
           признак обязан жить выше них. */
        document.body.classList.toggle('lm-video-idet', естьВидео);

        /* ПРАВАЯ КОЛОНКА — ТАБЛО И СПОНСОРЫ ЛИГИ. Решение Кости 25.09:
           «надо будет, чтобы лента карусель спонсоров была всегда видна».
           Померено, почему именно сюда: блок спонсоров 395 высотой, а над
           ним шапка, воздух, ссылка и заголовок — ещё 247. Чтобы его низ
           попал в экран 800, на сетку осталось бы 118 пикселей, тогда как
           одно табло — 277. Внизу страницы спонсоры не помещаются на
           первый экран НИ ПРИ КАКОЙ длине журнала.
           А под табло пустовало 267 пикселей — чёрный провал, видный на
           снимке. Спонсоры встают ровно туда: рядом со счётом, куда
           человек и смотрит дольше всего.
           Узел не копируется, а ПЕРЕНОСИТСЯ: разметка блока и его
           загрузчик остаются единственными. */
        container.innerHTML =
            backHtml + titleHtml +
            '<div class="lm-grid">' + leftHtml +
                '<div class="lm-right' + (естьВидео ? ' has-feed' : '') + '">' +
                    scorePanelHtml + infoHtml + (естьВидео ? feedHtmlStr : '') +
                '</div>' +
            '</div>';

        /* УЗЕЛ СПОНСОРОВ ХРАНИТСЯ ССЫЛКОЙ, А НЕ ИЩЕТСЯ КАЖДЫЙ РАЗ.
           Поймано сразу же, 25.09: перенеся блок ВНУТРЬ контейнера, я
           отдал его на съедение следующему же render() — счёт приходит по
           сокету, render переписывает container.innerHTML, и блок вместе с
           двадцатью логотипами исчезал из документа насовсем. Костя увидел
           это раньше меня: «а где спонсоры?».
           Ссылка на открепившийся узел остаётся действительной, и
           appendChild возвращает его на место со всем содержимым. Поэтому
           запоминаем один раз и возвращаем при каждой перерисовке. */
        if (!спонсорыУзел) спонсорыУзел = document.querySelector('.lm-sponsors');
        /* Спонсоры идут в ту колонку, где для них место: под видео, когда
           трансляция идёт, и под табло, когда нет. Узел один и тот же. */
        var куда = container.querySelector(естьВидео ? '.lm-left' : '.lm-right');
        if (куда && спонсорыУзел) {
            спонсорыУзел.classList.toggle('is-strip', естьВидео);
            куда.appendChild(спонсорыУзел);
        }

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

    /**
     * СТРОКА ИГРОКА НА ТАБЛО.
     *
     * ИМЯ СОКРАЩЁННОЕ — решение Кости 25.09: «наверно писать надо имя и
     * фамилия сокращённо, первая буква фамилии — Иван К.».
     *
     * Почему сокращать вообще пришлось, померено: колонка счёта РАСТЁТ С
     * КАЖДЫМ СЕТОМ. На одном сете там три числа и она 108 широкая, на
     * третьем станет четыре и ~144 — а имени при 400 на колонку оставалось
     * бы ~158 при потребности 208. Полное имя обрезалось бы всегда, и тем
     * вернее, чем дольше идёт матч.
     *
     * Берём ту же функцию, что и в журнале, а не заводим второй формат:
     * одно определение на одно понятие. Полное имя на странице остаётся —
     * в заголовке и в строке «Подаёт», где ему хватает места и где оно
     * стоит один раз, а не повторяется в каждой строке.
     */
    function playerRow(p, name, scoresHtml, serving, winner) {
        return '<div class="lm-player-row' + (serving ? ' lm-serving' : '') + (winner ? ' lm-winner-row' : '') + '">' +
            avatarHtml(p, name) +
            '<div class="lm-name-block"><div class="lm-player-name" title="' + esc(name) + '">' +
                (serving ? '<span class="lm-serve-indicator" aria-hidden="true"></span>' : '') +
                esc(короткоеИмя(name)) +
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

        /* ГЕЙМЫ ИДУТ НОВЫМ СВЕРХУ. Внутри гейма очки слева направо, и у
           каждого гейма написан номер — направление времени нигде не
           гадается. До 25.09 закрытый гейм схлопывался в одну строку и
           терял все свои очки: Костя открыл матч после гейма и увидел
           пустую панель. Теперь гейм уносит свои розыгрыши с собой. */
        var показать = видимые.slice().reverse();

        /* Заголовок и чипы сетов стоят НЕПОДВИЖНО, прокручивается только
           список геймов. Иначе, уехав к первому сету, человек теряет и
           подпись панели, и переключатель, которым он туда шёл. */
        var html = '<div class="lm-feed">' +
            '<p class="lm-feed-title">' + L.feedTitle + '</p>' + чипы +
            '<div class="lm-feed-games">' +
                показать.map(function(g) { return играHtml(m, g); }).join('') +
            '</div>' +
        '</div>';
        return html;
    }

    /**
     * ОДИН ГЕЙМ — ДВЕ СТРОКИ, ВЫРОВНЕННЫЕ ПО КОЛОНКАМ.
     * Решение Кости 25.09 по макету.
     *
     * Было: один ряд чипов «15–0 · 30–0 · 30–15», где не сказано, ЧЕЙ
     * счёт первый, а победитель очка закодирован дугой в три пикселя без
     * подписи. Костя: «не понятно».
     *
     * Стало: верхняя строка — очки первого, нижняя — второго. Выигравший
     * очко виден по тому, ЧЬЁ ЧИСЛО СДВИНУЛОСЬ: оно белое и на подложке,
     * второе на --text-muted. Краска больше ничего не кодирует — осталась
     * рельсом слева, тем же, что на табло. Так показывают пойнт-бай-пойнт
     * Уимблдон, ATP и Flashscore.
     *
     * ПОЧЕМУ НЕ КРАСИТЬ ГЕЙМЫ, как предлагал Костя: синий и оранжевый уже
     * значат «кто взял ОЧКО». Та же пара красок за «кто взял ГЕЙМ» — это
     * одно определение на два понятия, и оба перестают читаться.
     */
    function играHtml(m, g) {
        var очки = g.points;
        var ячеек1 = '', ячеек2 = '';

        for (var i = 0; i < очки.length; i++) {
            var pt = очки[i];
            var последнее = (i === очки.length - 1) && g.won;

            if (последнее) {
                /* ДЕФЕКТ ЗАПИСИ, НЕ ВИДА. Очко, которым выигран гейм,
                   приходит из базы уже со сброшенным счётом — 0 : 0.
                   Настоящий счёт розыгрыша (40–AD) потерян. Пишет его
                   судейский модуль; там и чинить. Здесь не показываю
                   нули, которые ничего не значат: у победителя стоит
                   слово, у второго — ничего. */
                ячеек1 += ячейка(g.won === 1 ? L.gameCell : '\u00b7', g.won === 1, true);
                ячеек2 += ячейка(g.won === 2 ? L.gameCell : '\u00b7', g.won === 2, true);
            } else {
                var метка = pt.mark === 'ace' ? L.ace : pt.mark === 'double' ? L.doubleF : '';
                ячеек1 += ячейка(pt.p1, pt.winner === 1, false, pt.winner === 1 ? метка : '');
                ячеек2 += ячейка(pt.p2, pt.winner === 2, false, pt.winner === 2 ? метка : '');
            }
        }

        /* Точка подачи ставится ТОЛЬКО на идущем гейме: подающего на
           прошлых геймах база не хранит, а выводить его чередованием
           нельзя — на тай-брейке подача меняется каждые два очка.
           Число, которого не могу померить, не выдумываю.
           Брейк база знает сама и отдаёт флагом. */
        var идёт = !g.won;
        var подаёт1 = идёт && m.serving_player === 1;
        var подаёт2 = идёт && m.serving_player === 2;

        var итог;
        if (!g.won) {
            итог = '<span class="lm-game-res is-now">' + L.gameLive + '</span>';
        } else if (g.is_break) {
            итог = '<span class="lm-break">' + L.breakLabel + '</span>';
        } else {
            итог = '<span class="lm-game-res">' +
                esc(короткоеИмя(nameOf(m, g.won)) + ' \u2014 ' + (g.g1 + ' : ' + g.g2)) +
                '</span>';
        }

        return '<div class="lm-game' + (идёт ? ' is-now' : '') + '"' +
                (идёт ? ' aria-live="polite"' : '') + '>' +
            '<div class="lm-game-head">' +
                '<span class="lm-game-no">' + esc(L.game + ' ' + g.game_no) + '</span>' +
                итог +
            '</div>' +
            строкаИгрока(m, 1, подаёт1, ячеек1) +
            строкаИгрока(m, 2, подаёт2, ячеек2) +
        '</div>';
    }

    function строкаИгрока(m, n, подаёт, ячейки) {
        return '<div class="lm-game-row lm-row-' + n + '">' +
            '<span class="lm-row-name">' +
                (подаёт ? '<i class="lm-row-serve" aria-hidden="true"></i>' : '') +
                esc(короткоеИмя(nameOf(m, n))) +
            '</span>' +
            '<span class="lm-row-cells">' + ячейки + '</span>' +
        '</div>';
    }

    /**
     * ЯЧЕЙКА СЧЁТА. Взявший очко — белым на подложке, второй —
     * на --text-muted.
     *
     * ПОЧЕМУ ИМЕННО --text-muted, А НЕ ТИШЕ. В макете стояло 38 % белого,
     * и это померено: 3.54 при пороге 4.5. Тусклая цифра — не украшение,
     * это СЧЁТ, его обязаны прочитать. На --text-muted (50 %) выходит
     * 5.33. Своего числа не завожу, ступень уже есть.
     */
    function ячейка(текст, взял, гейм, метка) {
        return '<span class="lm-cell' + (взял ? ' is-won' : '') +
            (гейм ? ' is-game' : '') + '">' + esc(String(текст)) +
            (метка ? '<i class="lm-cell-mark">' + метка + '</i>' : '') +
        '</span>';
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

    /**
     * «Иван Корабельников» → «Иван К.» — по просьбе Кости 24.09.
     * В ленте имя стоит в строке гейма рядом со счётом, и полное имя её
     * разрывает. Первое слово целиком, от второго — буква с точкой.
     * Одно слово («Петя») остаётся как есть: сокращать нечего.
     */
    function короткоеИмя(полное) {
        var части = String(полное || '').trim().split(/\s+/);
        if (части.length < 2) return части[0] || '—';
        return части[0] + ' ' + части[1].charAt(0).toUpperCase() + '.';
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
