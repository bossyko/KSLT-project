/**
 * СЧЁТ МАТЧА: ВПИСАТЬ И ПОДТВЕРДИТЬ — ОДИН ДОМ (шаг A3.7г, 29.10).
 *
 * ЧТО БЫЛО. `js/match-score.js` (366 строк) и
 * `mobile/www/js/match-score.js` (321) — одно имя `KSLT_MATCH_SCORE`,
 * два тела. Правила счёта давно жили в общем `kslt-rules.js`
 * (`buildScore`, `matchScoreState`), а вокруг них было написано дважды:
 *
 *   · сколько сетов спрашивать — `(set_format === 'short') ? 2 : 3`;
 *   · сбор пар из полей ввода;
 *   · зов `submit_match_score`;
 *   · зов `confirm_match_score` и `dispute_match_score`;
 *   · разбор кода ошибки, который вернула база.
 *
 * И В РАЗБОРЕ ОШИБОК БЫЛА БЕДА: у сайта есть ветка
 * `tied_set`/`bad_score`/`empty_score` → «проверьте счёт: геймы в сете
 * не могут быть равны», а в приложении её НЕТ ВОВСЕ — человек видел
 * общее «не удалось сохранить счёт» и не понимал, что именно не так.
 *
 * ЧЕГО В ДОМЕ НЕТ: разметка окон, тексты, способ показать ошибку (у
 * сайта тост, у приложения своя полоска). Дом отдаёт КЛЮЧ ошибки, а
 * слово по ключу находит продукт — у каждого свой словарь.
 *
 * Правка правится В ДВУХ МЕСТАХ: побайтовая копия в `mobile/www/js/`.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_SCHYOT_MATCHA = {};

    /**
     * СКОЛЬКО СЕТОВ СПРАШИВАТЬ. Короткий формат — два, обычный — три.
     * Одно правило: разойдись оно, один продукт собрал бы три сета, а
     * другой два, и счёт у одного матча вышел бы разным.
     */
    API.сетов = function (турнир) {
        return (турнир && турнир.set_format === 'short') ? 2 : 3;
    };

    /**
     * Пары «геймы первого, геймы второго» из полей ввода.
     *
     * @param {function} поле — (имя) → строка из поля
     * @param {string} приставка — у сайта поля зовутся `ms1s1`, у
     *        приложения `msa1s1`: имена полей — забота разметки
     * @param {number} сетов
     */
    API.собрать = function (поле, приставка, сетов) {
        var пары = [];
        for (var i = 1; i <= сетов; i++) {
            пары.push([поле(приставка + '1s' + i), поле(приставка + '2s' + i)]);
        }
        return пары;
    };

    /**
     * КЛЮЧ СЛОВА ОШИБКИ по коду, который вернула база.
     *
     * Отдаёт КЛЮЧ, а не текст: словарь у сайта свой, у приложения свой.
     * Ветка `tied_set`/`bad_score`/`empty_score` была только у сайта —
     * здесь она одна на оба.
     */
    API.ключОшибки = function (код) {
        if (код === 'own_score') return 'errOwn';
        if (код === 'already_final') return 'errFinal';
        if (код === 'not_a_player') return 'errNotPlayer';
        if (код === 'no_winner') return 'errNoWinner';
        if (код === 'tied_set' || код === 'bad_score' || код === 'empty_score') return 'errBad';
        return 'err';
    };

    /* Один разбор ответа базы на все три зова: `ok` в данных или код. */
    function разобрать(res) {
        if (res && res.error) return { ок: false, ключ: 'err' };
        var d = (res && res.data) || null;
        if (!d || !d.ok) {
            return { ок: false, ключ: API.ключОшибки(d && d.error) };
        }
        return { ок: true };
    }

    /**
     * ВПИСАТЬ СЧЁТ.
     *
     * Сборку строки делает дом правил (`buildScore`) — здесь только зов
     * и разбор ответа. Возвращает `{ ок }` либо `{ ок: false, ключ }`.
     */
    API.вписать = function (client, матчId, пары, дата) {
        var R = global.KSLT_RULES;
        if (!R || !R.buildScore) {
            /* Сборку счёта в строку НЕ ПОВТОРЯЕМ: своя арифметика здесь и
               была бы вторым определением одного понятия. Без дома правил
               дом отказывается писать — и говорит об этом вслух, иначе
               беда выглядела бы как «база не ответила». */
            if (global.console && console.error) {
                console.error('KSLT_SCHYOT_MATCHA: нет KSLT_RULES.buildScore — ' +
                    'счёт не собран и в базу НЕ ОТПРАВЛЕН; ' +
                    'проверьте порядок подключения kslt-rules.js');
            }
            return Promise.resolve({ ок: false, ключ: 'err' });
        }
        var собран = R.buildScore(пары);
        if (!собран.ok) return Promise.resolve({ ок: false, ключ: 'errBad' });

        return client.rpc('submit_match_score', {
            p_match_id: матчId,
            p_score: собран.score,
            p_played_at: дата || null
        }).then(разобрать).catch(function () {
            return { ок: false, ключ: 'err' };
        });
    };

    /**
     * ОТВЕТИТЬ НА ЧУЖОЙ СЧЁТ: согласен или нет.
     *
     * `согласен = false` отправляет матч организатору — это `dispute`,
     * а не отказ: счёт остаётся, решать будет человек.
     */
    API.ответить = function (client, матчId, согласен) {
        var зов = согласен ? 'confirm_match_score' : 'dispute_match_score';
        return client.rpc(зов, { p_match_id: матчId })
            .then(разобрать)
            .catch(function () { return { ок: false, ключ: 'err' }; });
    };

})(typeof window !== 'undefined' ? window : this);
