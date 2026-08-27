/**
 * Свободные места на турнире — единый расчёт для карточек и страницы турнира.
 *
 * Раньше на карточке стояло число из формы создания: одинаковое и в первый
 * день записи, и в последний. Оно ничего не говорило человеку, потому что
 * не двигалось. Теперь считаем занятое и показываем остаток.
 *
 * Правила, о которых договорились:
 *   — пока занято меньше двух третей, пишем вместимость: «6 мест».
 *     Строка «0 из 6 записались» отпугивает: видно, что турнир пустой;
 *   — с двух третей переходим на остаток: «осталось 2 места» — так виден
 *     дефицит, ради которого счётчик и заводили;
 *   — мест нет — «лист ожидания»;
 *   — турнир прошёл — сколько человек сыграло, без вместимости.
 *
 * Часть мест придерживают под запись без сайта (reserved_spots), поэтому
 * вместимость для онлайна считаем за вычетом придержанных. Иначе карточка
 * обещала бы места, которых на странице турнира уже нет.
 */
(function () {
    'use strict';

    var THRESHOLD = 2 / 3;   // с какой заполненности переходим на «осталось»

    // Заявки, занимающие место в основной сетке. Тот же набор, что в
    // функции записи tournament-register: она по нему решает, попадёт
    // человек в основу или в лист ожидания. Считать иначе — значит
    // обещать на карточке места, которых при подаче заявки уже нет
    var MAIN_DRAW = ['approved', 'pending', 'draw'];

    var TEXT = {
        ru: {
            spots: ['место', 'места', 'мест'],
            left: 'осталось',
            players: ['участник', 'участника', 'участников'],
            pairs: ['пара', 'пары', 'пар'],
            waitlist: 'лист ожидания',
            statPlayers: 'Участники', statPairs: 'Пар', statLeft: 'Мест осталось'
        },
        en: {
            spots: ['spot', 'spots', 'spots'],
            left: 'left',
            players: ['player', 'players', 'players'],
            pairs: ['pair', 'pairs', 'pairs'],
            waitlist: 'waitlist',
            statPlayers: 'Participants', statPairs: 'Pairs', statLeft: 'Spots left'
        },
        kg: {
            spots: ['орун', 'орун', 'орун'],
            left: 'калды',
            players: ['катышуучу', 'катышуучу', 'катышуучу'],
            pairs: ['жуп', 'жуп', 'жуп'],
            waitlist: 'күтүү тизмеси',
            statPlayers: 'Катышуучулар', statPairs: 'Жуптар', statLeft: 'Орун калды'
        }
    };

    function lang() {
        // В приложении страница одна, язык переключается внутри — там его
        // знает I18N. На сайте язык виден по адресу страницы
        if (window.KSLT_I18N && window.KSLT_I18N.lang) {
            var l = window.KSLT_I18N.lang;
            return TEXT[l] ? l : 'ru';
        }
        var p = window.location.pathname;
        if (p.indexOf('-en') !== -1) return 'en';
        if (p.indexOf('-kg') !== -1) return 'kg';
        return 'ru';
    }

    /** Склонение по числу: 1 место, 2 места, 5 мест */
    function plural(n, forms) {
        var a = Math.abs(n) % 100;
        var b = a % 10;
        if (a > 10 && a < 20) return forms[2];
        if (b > 1 && b < 5) return forms[1];
        if (b === 1) return forms[0];
        return forms[2];
    }

    /**
     * Состояния, когда мест уже не набирают: турнир прошёл, отменён,
     * идёт прямо сейчас или запись закрыта. Названия у карточек и у базы
     * разные — 'done' на главной, 'past' на страницах категорий,
     * 'completed' в самой записи турнира, поэтому принимаем все
     */
    function isOver(state) {
        return state === 'past' || state === 'done' || state === 'live' ||
               state === 'ongoing' || state === 'closed' || state === 'completed' ||
               state === 'cancelled' || state === 'registration_closed';
    }

    function isDoubles(t) {
        var f = t.format || t._rawFormat || '';
        return f === 'doubles' || f === 'mixed_doubles';
    }

    /**
     * Разбор мест турнира.
     * @param {Object} t     запись турнира из базы
     * @param {number} taken одобренных заявок
     * @returns {{total:number, taken:number, free:number, tight:boolean, full:boolean}}
     */
    function count(t, taken) {
        taken = Number(taken) || 0;
        var total = Number(t.max_participants) || 0;
        var reserved = Number(t.reserved_spots) || 0;
        if (reserved > total) reserved = total;

        // Придержанные под запись без сайта места входят в основу и заняты
        // с первого дня: организатор их уже кому-то отдал. Показываем полный
        // размер турнира, а резерв кладём в занятое — иначе человек видел бы
        // сетку меньше настоящей и не понимал, куда делись места
        var busy = taken + reserved;
        var free = total > 0 ? Math.max(0, total - busy) : 0;
        return {
            total: total,
            taken: taken,
            reserved: reserved,
            busy: busy,
            free: free,
            tight: total > 0 && free > 0 && busy >= total * THRESHOLD,
            full: total > 0 && free <= 0
        };
    }

    /**
     * Строка для карточки. Возвращает null, когда показывать нечего:
     * у турниров, перенесённых из новостей, вместимость служебная.
     * @param {Object} t
     * @param {number} taken
     * @param {string} state 'past' у завершённых и отменённых
     */
    function line(t, taken, state) {
        var L = TEXT[lang()];
        var c = count(t, taken);
        var past = isOver(state);

        if (past) {
            if (!c.taken) return null;
            var word = isDoubles(t) ? L.pairs : L.players;
            return { text: c.taken + ' ' + plural(c.taken, word), tight: false };
        }

        if (!c.total) return null;
        if (c.full) return { text: L.waitlist, tight: true };

        if (c.tight) {
            var n = c.free;
            var tail = n + ' ' + plural(n, L.spots);
            // По-русски «осталось» идёт впереди, а по-английски и
            // по-кыргызски — в конце: «2 spots left», «2 орун калды»
            return { text: lang() === 'ru' ? (L.left + ' ' + tail) : (tail + ' ' + L.left), tight: true };
        }

        return { text: c.total + ' ' + plural(c.total, L.spots), tight: false };
    }

    /**
     * Вид «подпись сверху, число снизу» — для шапки турнира и афишной
     * карточки, где текст «осталось 2 места» рядом с подписью «Пар»
     * читался бы как оговорка.
     * @returns {{value:number|string, label:string, tight:boolean}|null}
     */
    function stat(t, taken, state) {
        var L = TEXT[lang()];
        var c = count(t, taken);
        var past = isOver(state);
        var word = isDoubles(t) ? L.statPairs : L.statPlayers;

        if (past) {
            return c.taken ? { value: c.taken, label: word, tight: false } : null;
        }
        if (!c.total) return null;
        if (c.tight || c.full) return { value: c.free, label: L.statLeft, tight: true };
        return { value: c.total, label: word, tight: false };
    }

    window.KSLT_SLOTS = {
        MAIN_DRAW: MAIN_DRAW,
        count: count,
        line: line,
        stat: stat,
        plural: plural,
        threshold: THRESHOLD
    };
})();
