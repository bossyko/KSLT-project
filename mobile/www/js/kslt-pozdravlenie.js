/**
 * ПОЗДРАВЛЕНИЕ С ДОСТИЖЕНИЕМ — ОДИН ДОМ (шаг A3.7б, 29.10).
 *
 * ЧТО БЫЛО. `js/badge-celebration.js` (137 строк) и
 * `mobile/www/js/badge-celebration.js` (119) — одно имя, два тела.
 * Логика совпадала ПО СМЫСЛУ целиком: прочитать `player_badges` с
 * `seen_at = null`, отбросить строки без значка, отсортировать по
 * `sort_order`, показать, и СРАЗУ пометить просмотренными (человек может
 * закрыть вкладку на середине — иначе его встречало бы то же
 * поздравление при каждом входе).
 *
 * РАСХОДИЛОСЬ ЗАКОННО: откуда берётся `playerId`. Сайт добывает его сам
 * (`auth.getUser()` → `profiles`), приложение получает снаружи из
 * `app.js` после входа. Это строение запуска, и оно остаётся своим.
 *
 * РАСХОДИЛОСЬ БЕДОЙ: **сайт экранировал значок
 * (`KSLT_экранировать(b.icon)`), приложение вставляло его СЫРЫМ.**
 * `icon` — текстовый столбец базы. Сторож `check-dannye-v-razmetku`
 * запер `js/badge-celebration.js` ещё куском 166 — но его признак
 * обходит ТОЛЬКО `js/` (`tools/priznak-dannye-v-razmetke.js:179`), и
 * приложения не видит вовсе. Дыра жила ровно в слепом пятне.
 *
 * Ещё расходилось молча: шариков 26 против 22.
 *
 * ЧТО В ДОМЕ: чтение очереди, отметка о показе, разметка карточки — с
 * экранированием в одном месте. Чего нет: добыча `playerId` и снятие
 * окна (у сайта оснастка окна из куска 156, у приложения свой таймер).
 *
 * Правка правится В ДВУХ МЕСТАХ: побайтовая копия в `mobile/www/js/`.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_POZDRAVLENIE = {};

    /** Сколько шариков летит: одно число на оба продукта. */
    API.ШАРИКОВ = 24;

    function экр(s) {
        if (global.KSLT_экранировать) return global.KSLT_экранировать(s);
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;',
                     '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /**
     * ОЧЕРЕДЬ НЕПОКАЗАННЫХ ДОСТИЖЕНИЙ.
     *
     * Ошибку чтения НЕ ГЛОТАЕМ: человек так и не узнает, что что-то
     * заработал, а мы не узнаем, что поздравление не работает.
     */
    API.очередь = function (client, playerId) {
        if (!client || !playerId) return Promise.resolve([]);

        return client.from('player_badges')
            .select('badge_id, earned_at, badge:badge_definitions(icon, name, ' +
                    'name_en, name_kg, description, description_en, ' +
                    'description_kg, sort_order)')
            .eq('player_id', playerId)
            .is('seen_at', null)
            .then(function (res) {
                if (res.error) {
                    console.error('[KSLT] достижения не проверены:',
                        res.error.message || res.error);
                    return [];
                }
                return (res.data || [])
                    .filter(function (r) { return r.badge; })
                    .sort(function (a, b) {
                        return (a.badge.sort_order || 0) - (b.badge.sort_order || 0);
                    });
            });
    };

    /**
     * ОТМЕТКА О ПОКАЗЕ СТАВИТСЯ СРАЗУ, А НЕ ПОСЛЕ ПРОСМОТРА. Человек
     * может закрыть вкладку на середине, и тогда при каждом входе его
     * встречало бы одно и то же поздравление.
     */
    API.пометить = function (client) {
        if (!client) return Promise.resolve();
        return client.rpc('mark_badges_seen').then(function (r) {
            if (r && r.error) {
                console.error('[KSLT] отметка о показе не сохранена:', r.error.message);
            }
        });
    };

    /** Пустая оболочка окна: её наполняет `карточка`. */
    API.оболочка = function (документ) {
        var д = документ || global.document;
        var узел = д.createElement('div');
        узел.className = 'ach-overlay';
        узел.innerHTML = '<div class="ach-card"></div>';
        д.body.appendChild(узел);
        return узел;
    };

    /**
     * РАЗМЕТКА ОДНОГО ПОЗДРАВЛЕНИЯ.
     *
     * Имя и описание дом НЕ вставляет разметкой: их кладёт `назвать`
     * текстом, как и было в обоих продуктах. А вот ЗНАЧОК идёт внутрь
     * разметки, и экранируется ЗДЕСЬ — в одном месте на оба продукта.
     *
     * @param {object} значок — строка `badge_definitions`
     * @param {number} осталось — сколько поздравлений после этого
     * @param {object} слова — { шапка, дальше, готово, осталось }
     * @param {function} шарики — рисует фон; у каждого продукта свой
     */
    API.карточка = function (значок, осталось, слова, шарики) {
        var с = слова || {};
        var фон = шарики ? шарики(API.ШАРИКОВ) : '';
        return '<div class="ach-fx balls">' + фон + '</div>' +
               '<div class="ach-halo"></div>' +
               '<div class="ach-kicker">' + экр(с.шапка) + '</div>' +
               /* Значок — текстовый столбец базы. Экранируется один раз
                  здесь: в приложении он шёл СЫРЫМ, и сторож разметки
                  этого не видел, потому что не обходит `mobile/www`. */
               '<div class="ach-emoji">' + экр(значок.icon || '🏅') + '</div>' +
               '<div class="ach-name"></div>' +
               '<div class="ach-desc"></div>' +
               '<button class="ach-btn" type="button">' +
                   экр(осталось ? с.дальше : с.готово) +
               '</button>' +
               (осталось
                   ? '<div class="ach-count">' + экр(с.осталось) + осталось + '</div>'
                   : '');
    };

    /**
     * Имя и описание — ТЕКСТОМ, а не разметкой: они приходят из базы.
     *
     * @param {Element} карточка — узел `.ach-card`
     * @param {object} значок — строка базы
     * @param {function} поле — (значок, основа) → строка на языке
     *        продукта: у сайта через `KSLT_YAZYK`, у приложения через
     *        `KSLT_I18N`
     */
    API.назвать = function (карточка, значок, поле) {
        if (!карточка) return;
        var имя = карточка.querySelector('.ach-name');
        var опис = карточка.querySelector('.ach-desc');
        if (имя) имя.textContent = поле(значок, 'name') || '';
        if (опис) опис.textContent = поле(значок, 'description') || '';
    };

})(typeof window !== 'undefined' ? window : this);
