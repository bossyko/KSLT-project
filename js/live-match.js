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

    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;

    var L = {
        loading:   KSLT_YAZYK.выбрать('Loading...', 'Жүктөлүүдө...', 'Загрузка...'),
        notFound:  KSLT_YAZYK.выбрать('Match not found', 'Матч табылган жок', 'Матч не найден'),
        /* ПОДПИСИ СОСТОЯНИЯ УШЛИ В ОБЩИЙ СЛОВАРЬ js/live-texts.js.
           Слово paused трогают четыре файла проекта, а человеческое слово до
           25.09 стояло только здесь — и причина перерыва разошлась бы ровно
           на этом шве. Одно определение на одно понятие. */
        tiebreak:  KSLT_YAZYK.выбрать('Tiebreak', 'Тайбрейк', 'Тайбрейк'),
        /* Кыргызские подписи до 24.09 повторяли русские — перевод мой. */
        tournament: KSLT_YAZYK.выбрать('Tournament', 'Мелдеш', 'Турнир'),
        format:     KSLT_YAZYK.выбрать('Format', 'Формат', 'Формат'),
        serving:    KSLT_YAZYK.выбрать('Serving', 'Берүүдө', 'Подаёт'),
        wins:       KSLT_YAZYK.выбрать('wins!', 'жеңет!', 'побеждает!'),
        backHome:   KSLT_YAZYK.выбрать('Home', 'Башкы бетке', 'На главную'),
        sponsor:    KSLT_YAZYK.выбрать('Match supported by', 'Матчты колдогон', 'Матч при поддержке'),
        feedTitle:  KSLT_YAZYK.выбрать('Match progress', 'Матчтын жүрүшү', 'Ход матча'),
        setN:       KSLT_YAZYK.выбрать('set', 'сет', 'сет'),
        gameNow:    KSLT_YAZYK.выбрать('Current game', 'Учурдагы гейм', 'Текущий гейм'),
        ace:        KSLT_YAZYK.выбрать('ace', 'эйс', 'эйс'),
        doubleF:    KSLT_YAZYK.выбрать('double', 'кош ката', 'двойная'),
        game:       KSLT_YAZYK.выбрать('game', 'гейм', 'гейм'),
        allSets:    KSLT_YAZYK.выбрать('All', 'Баары', 'Все'),
        breakLabel: KSLT_YAZYK.выбрать('break', 'брейк', 'брейк'),
        /* Ячейка того, кто выиграл гейм. Короткое слово, а не нули:
           база пишет выигравшее очко уже со сброшенным счётом. */
        gameCell:   KSLT_YAZYK.выбрать('game', 'гейм', 'гейм'),
        /* Пометка идущего гейма. Короче, чем «Текущий гейм»: стоит
           в правом углу заголовка, где места на одно слово. */
        gameLive:   KSLT_YAZYK.выбрать('live', 'жүрүүдө', 'идёт'),
        emptyTitle: KSLT_YAZYK.выбрать('The match has not started yet', 'Матч азырынча башталган жок', 'Матч ещё не начался'),
        emptyText:  KSLT_YAZYK.выбрать('Match progress will appear here with the first point.', 'Матчтын жүрүшү биринчи розыгрыштан кийин ушул жерде чыгат.', 'Ход матча появится здесь с первым розыгрышем.')
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
    /* РОЗЫГРЫШИ В ГЕЙМЫ собирает дом (`KSLT_ZHURNAL.геймы`). */

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

        var pageSuffix = KSLT_YAZYK.суффикс;
        var backHtml = '<a href="../index' + pageSuffix + '.html" class="lm-back-link">' +
            '<span aria-hidden="true">←</span>' + L.backHome + '</a>';

        var titleHtml =
            '<h1 class="lm-title">' + KSLT_экранировать(p1Name) + ' — ' + KSLT_экранировать(p2Name) + '</h1>' +
            /* ИМЯ ТУРНИРА — ОТДЕЛЬНЫМ ЭЛЕМЕНТОМ. Решение Кости 25.09:
               «это название турнира же». В строке под заголовком стояли
               рядом имя турнира и формат, одинаково тихие, — а это две
               разные вещи: одна отвечает на «где играют», вторая на
               «сколько сетов». Отличаем весом, а не вторым цветом. */
            '<p class="lm-meta">' +
                (m.tournament_label
                    ? '<span class="lm-meta-tour">' + KSLT_экранировать(m.tournament_label) + '</span> · '
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
                'title="' + KSLT_экранировать(p1Name) + ' — ' + KSLT_экранировать(p2Name) + '" ' +
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
            p1SetsHtml += '<div class="lm-points-score">' + KSLT_экранировать(pt1) + '</div>';
            p2SetsHtml += '<div class="lm-points-score">' + KSLT_экранировать(pt2) + '</div>';
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
                        '<div class="lm-winner-text">' + KSLT_экранировать(m.winner_player === 1 ? p1Name : p2Name) + ' ' + L.wins + '</div>' +
                        (m.final_score ? '<div class="lm-final-score">' + KSLT_экранировать(m.final_score) + '</div>' : '') +
                      '</div>'
                    : '') +
                /* СПОНСОР МАТЧА. Имя — не украшение: картинка без имени
                   подписывается диктору как «Sponsor». Если имя есть, оно и
                   становится подписью логотипа и видимым текстом. */
                (m.sponsor_logo || m.sponsor_name
                    ? '<div class="lm-sponsor"><span>' + L.sponsor + '</span>' +
                      (m.sponsor_logo
                        ? '<img class="lm-sponsor-logo" src="' + KSLT_экранировать(m.sponsor_logo) + '" alt="' + KSLT_экранировать(m.sponsor_name || L.sponsor) + '">'
                        : '') +
                      (m.sponsor_name ? '<span class="lm-sponsor-name">' + KSLT_экранировать(m.sponsor_name) + '</span>' : '') +
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
                    ? '<div class="lm-info-row"><span>' + L.serving + '</span><span class="lm-info-val">' + KSLT_экранировать(servingName) + '</span></div>'
                    : '') +
                (m.tournament_label ? '<div class="lm-info-row"><span>' + L.tournament + '</span><span class="lm-info-val">' + KSLT_экранировать(m.tournament_label) + '</span></div>' : '') +
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
            '<div class="lm-name-block"><div class="lm-player-name" title="' + KSLT_экранировать(name) + '">' +
                (serving ? '<span class="lm-serve-indicator" aria-hidden="true"></span>' : '') +
                KSLT_экранировать(window.KSLT_ZHURNAL.короткоеИмя(name)) +
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
    /**
     * ЖУРНАЛ СТРОИТ ДОМ `js/kslt-zhurnal-matcha.js` (02.11).
     *
     * Здесь он был написан целиком — и был единственным: в приложении
     * журнала не было вовсе, на месте видео стояла надпись «Нет
     * трансляции». Продукты показывают ОДИН И ТОТ ЖЕ матч, и писать
     * ленту во второй раз значило бы развести их на пятистах строках.
     *
     * Снаружи остаётся то, что знает только эта страница: язык подписей
     * и выбранный сет.
     */
    function feedHtml(m, setsData, isWarmup) {
        return window.KSLT_ZHURNAL.разметка({
            очки: points,
            сеты: setsData,
            имя: function (n) { return nameOf(m, n); },
            подающий: m.serving_player,
            выбранСет: selectedSet,
            разминка: isWarmup,
            завершён: m.status === 'completed',
            тайбрейк: m.is_tiebreak,
            тб1: m.tiebreak_p1, тб2: m.tiebreak_p2,
            очки1: m.points_p1, очки2: m.points_p2,
            гейм1: m.current_game_p1, гейм2: m.current_game_p2,
            подписи: L
        });
    }

    /* ГЕЙМ, СТРОКА ИГРОКА И ЯЧЕЙКА СЧЁТА переехали в дом
       `js/kslt-zhurnal-matcha.js` 02.11 вместе со всеми решениями по
       ним: краска не кодирует победителя гейма, последнее очко
       приходит со сброшенным счётом, точка подачи только на идущем
       гейме. Снято отсюда, а не скопировано. */

    /* ЗАПАСНАЯ ЛЕНТА и ЧИП СЕТА — там же, в доме журнала. */

    function nameOf(m, n) {
        var p = n === 1 ? (m.player1 || {}) : (m.player2 || {});
        return getPlayerName(p, n === 1 ? m.player1_name : m.player2_name);
    }

    /* КОРОТКОЕ ИМЯ — в доме журнала (`KSLT_ZHURNAL.короткоеИмя`): оно
       нужно ленте, а лента теперь общая. */

    function getPlayerName(p, fallbackName) {
        if (isEn && p && p.name_en) return p.name_en;
        if (isKg && p && p.name_kg) return p.name_kg;
        if (p && p.name) return p.name;
        return fallbackName || '—';
    }

    function avatarHtml(player, name) {
        if (player && player.photo) {
            return '<img class="lm-avatar" src="' + KSLT_экранировать(player.photo) + '" alt="' + KSLT_экранировать(name) + '">';
        }
        /* ИНИЦИАЛ — ТОЖЕ ПОЛЕ ЧЕЛОВЕКА, ХОТЬ И ОДИН ЗНАК. `live_matches.player1_name`
           пишет судья, и первым знаком может стоять `<` или `&`. ОДИН ЗНАК НЕ
           ДЕЛАЕТ ЗНАЧЕНИЕ БЕЗОПАСНЫМ. Нашлось куском 169, когда признак
           научился разворачивать местные переменные внутри функции: до этого
           `initial` был для него непрозрачным, и вся функция считалась
           экраном. */
        /* КРУЖОК РИСУЕТ ДОМ (кусок 194): js/kslt-lico.js. Здесь была ОДНА
           буква — второе и последнее такое место в продукте (первым был
           `match-score.js`, сведён куском 75). Продукт берёт две: первую
           и последнюю. Экранирование и `aria-hidden` отдаёт дом. */
        return window.KSLT_LICO.кружок(name, 'lm-avatar-placeholder');
    }

    function showError(msg) {
        var container = document.getElementById('lmContainer');
        if (container) container.innerHTML = '<div class="lm-error">' + msg + '</div>';
    }

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА. Прежде здесь
       стоял способ через `textContent`: он безопасен в текстовом узле, но
       НЕ ЭКРАНИРУЕТ КАВЫЧКИ ВОВСЕ, а результат подставляется внутрь
       атрибута (`title=`, `src=`, `alt=`) — там кавычка в имени игрока
       или в адресе логотипа закрывает атрибут. Эталон взят дословно у
       `js/kslt-lenta.js`. */
    /* ИМЯ РОЛИКА РАЗБИРАЕТ ДОМ `js/kslt-video.js` (02.11). Здесь стоял
       свой разборщик, и он знал НЕ ТО ЖЕ, что дом: дом понимал
       `shorts/`, но не `live/`, этот — наоборот. Трансляция, вставленная
       в новость, не открылась бы ни разу, и узнали бы мы об этом в
       эфире. ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ. */
    function extractYoutubeId(url) {
        return window.KSLT_VIDEO ? window.KSLT_VIDEO.ytId(url) : null;
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
