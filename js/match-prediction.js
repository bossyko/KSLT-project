// ============================================
// Прогноз исхода матча
// ============================================
//
// Считает, с какой вероятностью выиграет каждая сторона. Формула жила внутри
// страницы турнира и работала только в сетке. Вынесена сюда, потому что тот
// же вопрос — «кто фаворит» — встаёт и на странице баттла, а два одинаковых
// расчёта в разных файлах однажды разойдутся.
//
// Из чего складывается:
//
//   60%  разница очков по формуле Эло — основной вес;
//   20%  процент побед: очки говорят о прошлом сезоне, а этот — о форме;
//   10%  текущая серия побед или поражений, не больше десяти пунктов;
//   10%  личные встречи, не больше пяти пунктов — они бывают старыми.
//
// Итог зажат между 5 и 95 процентами. Стопроцентных фаворитов в теннисе не
// бывает, и рисовать их — обманывать зрителя.
//
// Для парных игр не применяется: формула берёт очки, победы и форму одного
// человека, а у пары ни очков, ни рейтинга нет — так мы и договорились.

(function() {
    'use strict';

    var P = window.KSLT_PREDICTION = {};

    /**
     * ПОЛОСА ВЫКЛЮЧЕНА ДО ДЕКАБРЯ — РЕШЕНИЕ КОСТИ 02.10.
     *
     * Формула честная, но вход у неё слабый: `players.points` — это очки за
     * МЕСТА в турнире, а не за победы над конкретными соперниками. Обыграть
     * первую ракетку и обыграть новичка дают одинаковый вклад.
     *
     * ЧИСЛА, ПО КОТОРЫМ ПРИНЯТО РЕШЕНИЕ (чтение боевой базы 02.10, отбор
     * «одиночные рейтинговые»): 130 матчей, 3 турнира, 64 игрока, по 4
     * матча на человека. Десять матчей и больше — У ОДНОГО, двадцать — НИ У
     * КОГО. История 14 дней, архива прошлых лет нет.
     *
     * На таких объёмах любой рейтинг по встречам — шум, а проценты рядом с
     * именами читаются как знание. Молчать честнее, чем выдать 73 % из
     * воздуха.
     *
     * КОГДА ВКЛЮЧАТЬ: когда у игроков наберётся по двадцать матчей —
     * посчитано, при нынешних девяти матчах в день это около двух с
     * половиной месяцев, то есть декабрь. И включать уже не это, а
     * Glicko-2: он несёт вместе с рейтингом ПОГРЕШНОСТЬ и сам молчит там,
     * где данных мало. NTRP идёт стартовым значением, очки за места в
     * рейтинг силы НЕ входят — они производны от тех же матчей, и счёт
     * вышел бы двойным.
     *
     * КОД НЕ УДАЛЁН НАМЕРЕННО: в декабре он нужен как основа, а
     * переписанное заново теряет то, что уже выверено. Выключатель ОДИН на
     * продукт — иначе через месяц полоса вернётся на одном экране из двух.
     */
    P.ВКЛЮЧЁН = false;

    /** Спрашивают оба экрана: страница турнира и страница вызова. */
    P.показывать = function () {
        return P.ВКЛЮЧЁН === true;
    };

    /** Длина текущей серии: плюс — победы подряд, минус — поражения. */
    function streak(form) {
        if (!form || !form.length) return 0;
        var first = form[0];
        if (first !== 'W' && first !== 'L') return 0;
        var count = 0;
        for (var i = 0; i < form.length; i++) {
            if (form[i] === first) count++;
            else break;
        }
        return first === 'W' ? count : -count;
    }

    /**
     * Личные встречи из готовой карты. Ключ собран из двух идентификаторов
     * по алфавиту, чтобы пара «А против Б» и «Б против А» была одной записью.
     */
    function h2h(map, idA, idB) {
        if (!map) return { winsA: 0, winsB: 0 };
        var a = idA < idB ? idA : idB;
        var b = idA < idB ? idB : idA;
        var rec = map[a + ':' + b];
        if (!rec) return { winsA: 0, winsB: 0 };
        return { winsA: rec[idA] || 0, winsB: rec[idB] || 0 };
    }

    P.streak = streak;
    P.h2h = h2h;

    /**
     * @param {{id:string, points:number, wins:number, losses:number, form:Array}} a
     * @param {{id:string, points:number, wins:number, losses:number, form:Array}} b
     * @param {Object} [h2hMap] личные встречи, если известны
     * @returns {{p1Pct:number, p2Pct:number}}
     */
    P.calculate = function(a, b, h2hMap) {
        var rA = a.points || 0;
        var rB = b.points || 0;

        var elo = 1 / (1 + Math.pow(10, (rB - rA) / 400));

        var wA = a.wins || 0, lA = a.losses || 0;
        var wB = b.wins || 0, lB = b.losses || 0;
        var wrA = (wA + lA) > 0 ? wA / (wA + lA) : 0.5;
        var wrB = (wB + lB) > 0 ? wB / (wB + lB) : 0.5;
        var winRate = (wrA + wrB) > 0 ? wrA / (wrA + wrB) : 0.5;

        var bonus = 0;
        bonus += Math.max(-0.10, Math.min(0.10, streak(a.form) * 0.03));
        bonus -= Math.max(-0.10, Math.min(0.10, streak(b.form) * 0.03));
        var series = 0.5 + bonus;

        var rec = h2h(h2hMap, a.id, b.id);
        var played = rec.winsA + rec.winsB;
        var personal = 0.5;
        if (played > 0) {
            var diff = (rec.winsA - rec.winsB) / played;
            personal = 0.5 + Math.max(-0.05, Math.min(0.05, diff * 0.1));
        }

        var total = 0.6 * elo + 0.2 * winRate + 0.1 * series + 0.1 * personal;
        var pct = Math.round(Math.max(5, Math.min(95, total * 100)));
        return { p1Pct: pct, p2Pct: 100 - pct };
    };

    /**
     * Полосы прогноза выезжают, когда попадают на экран: иначе на длинной
     * сетке они все уже стоят на месте к тому времени, как до них долистают.
     */
    P.animate = function(selector) {
        var bars = document.querySelectorAll(selector || '.td-prediction');
        if (!bars.length) return;
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (!entry.isIntersecting) return;
                entry.target.querySelectorAll('[data-width]').forEach(function(fill) {
                    fill.style.width = fill.getAttribute('data-width');
                });
                entry.target.classList.add('animated');
                observer.unobserve(entry.target);
            });
        }, { threshold: 0.3 });
        bars.forEach(function(bar) { observer.observe(bar); });
    };
})();
