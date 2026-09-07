// ============================================
// Свои матчи в сетке турнира
// ============================================
//
// Человек открывает сетку и должен сразу видеть две вещи: где играет он сам
// и что от него сейчас требуется. Подсветка своих пар на сайте была, но
// включалась только при переходе с карточки игрока — вошедшему она не
// доставалась. Здесь включаем её для себя и добавляем кнопку.
//
// Кнопка появляется, как только пара известна: ждать назначенного времени
// нельзя — в длинном турнире его просто нет, люди договариваются сами.
// Где соперник ещё не определён, вместо кнопки стоит «ждём соперника».
//
// Сама работа со счётом — в js/match-score.js, общем для сетки и кабинета.

(function () {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { enter: 'Enter score', confirm: 'Confirm score', wait: 'waiting for opponent',
            sent: 'waiting for confirmation', enterShort: 'score', confirmShort: 'confirm' }
        : (isKg
            ? { enter: 'Эсепти жазуу', confirm: 'Эсепти ырастоо', wait: 'каршылашты күтөбүз',
                sent: 'ырастоону күтөбүз', enterShort: 'эсеп', confirmShort: 'ырастоо' }
            : { enter: 'Вписать счёт', confirm: 'Подтвердить счёт', wait: 'ждём соперника',
                sent: 'ждём подтверждения', enterShort: 'счёт', confirmShort: 'подтвердить' });

    var _мои = null;     // номер матча → его состояние
    var _pid = null;
    var _uid = null;

    document.addEventListener('DOMContentLoaded', function () {
        // Сетка рисуется после ответа базы, поэтому ждём появления матчей,
        // а не готовности разметки
        var попыток = 0;
        var таймер = setInterval(function () {
            попыток++;
            // В групповом турнире карточек матча нет вовсе — только клетки
            // таблицы. Ждём любое из двух, иначе на группах не запустимся
            if (document.querySelector('.td-match[data-match-id], td.td-grp-cell[data-match-id]')) {
                clearInterval(таймер);
                разметить();
            } else if (попыток > 40) {
                clearInterval(таймер);   // сетки на этой странице нет
            }
        }, 250);
    });

    async function разметить() {
        var client = window.supabaseClient;
        var MS = window.KSLT_MATCH_SCORE;
        if (!client || !MS) return;

        // Свой номер и капитаны пар, где человек напарник: в парном турнире
        // в матче стоит капитан, и без списка напарник не увидел бы ничего
        _pid = await MS.myPlayerIds();
        if (!_pid || !_pid.length) return;        // гость или без карточки игрока

        var u = await client.auth.getUser();
        _uid = u.data && u.data.user ? u.data.user.id : null;

        var id = новыйПараметр('id');
        if (!id) return;

        var res = await client.from('matches')
            .select('id, player1_id, player2_id, winner_id, score_status, score_submitted_by')
            .eq('tournament_id', id)
            .or('player1_id.in.(' + _pid.join(',') + '),player2_id.in.(' + _pid.join(',') + ')');

        if (res.error || !res.data) return;

        _мои = {};
        res.data.forEach(function (m) { _мои[m.id] = MS.stateOf(m, _pid, _uid); });

        применить();

        // Сетка перерисовывается при переключении вкладок и после правок —
        // следим и размечаем заново, иначе кнопка пропадает
        var корень = document.getElementById('bracket') || document.body;
        var наблюдатель = new MutationObserver(function () { применить(); });
        наблюдатель.observe(корень, { childList: true, subtree: true });
    }

    function применить() {
        if (!_мои) return;

        // Групповой этап: матч — клетка перекрёстной таблицы. Кнопки там нет
        // места, поэтому сама клетка становится нажимаемой
        document.querySelectorAll('td.td-grp-cell[data-match-id]').forEach(function (td) {
            var состояние = _мои[td.dataset.matchId];
            if (!состояние || td.dataset.ready) return;
            if (состояние !== 'enter' && состояние !== 'confirm') return;
            td.dataset.ready = '1';
            td.classList.add('td-grp-mine');
            // Фамилия соперника — подложкой, приглушённо: в турнирной сетке
            // её не пишут, но без неё две соседние клетки сливаются в одну
            // полосу и непонятно, с кем какой матч
            td.innerHTML = '<span class="td-grp-act">' +
                    (состояние === 'enter' ? L.enterShort : L.confirmShort) + '</span>' +
                '<span class="td-grp-opp">' + (td.dataset.opp || '') + '</span>';
            td.addEventListener('click', function () {
                window.KSLT_MATCH_SCORE.open(td.dataset.matchId, обновить);
            });
        });

        // Гасим чужое, только если своё вообще есть. Иначе в турнире, где
        // человек не играл, гасла вся сетка — он открывал посмотреть
        // результаты и видел тёмное поле.
        var естьСвои = Array.prototype.some.call(
            document.querySelectorAll('.td-match[data-match-id]'),
            function (el) { return !!_мои[el.dataset.matchId]; });

        document.querySelectorAll('.td-match[data-match-id]').forEach(function (el) {
            var состояние = _мои[el.dataset.matchId];
            if (!состояние) {
                // Чужие пары приглушаем, чтобы свои читались с одного взгляда
                if (естьСвои && !el.classList.contains('td-match-dimmed') &&
                    el.dataset.p1 && el.dataset.p2) {
                    el.classList.add('td-match-dimmed');
                }
                return;
            }

            el.classList.remove('td-match-dimmed');
            el.classList.add('td-match-highlight');
            if (el.querySelector('.td-match-act')) return;   // уже размечен

            if (состояние === 'enter' || состояние === 'confirm') {
                var btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'td-match-act td-match-enter';
                btn.textContent = состояние === 'enter' ? L.enter : L.confirm;
                btn.addEventListener('click', function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    window.KSLT_MATCH_SCORE.open(el.dataset.matchId, обновить);
                });
                el.appendChild(btn);
            } else if (состояние === 'wait') {
                el.appendChild(подпись(L.sent));
            } else if (состояние === 'none') {
                el.appendChild(подпись(L.wait));
            }
        });
    }

    function подпись(текст) {
        var s = document.createElement('span');
        s.className = 'td-match-act td-match-wait';
        s.textContent = текст;
        return s;
    }

    /** Перечитать состояние после ввода или подтверждения. */
    function обновить() {
        _мои = null;
        разметить();
    }

    function новыйПараметр(имя) {
        var m = new RegExp('[?&]' + имя + '=([^&]*)').exec(window.location.search);
        return m ? decodeURIComponent(m[1]) : null;
    }
})();
