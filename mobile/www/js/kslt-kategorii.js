/**
 * РАЗБИВКА СТАТИСТИКИ ПО КАТЕГОРИЯМ — ОДИН ДОМ (шаг A3.6, 29.10).
 *
 * ЧТО БЫЛО. На сайте этот блок есть (`js/dashboard.js`,
 * `renderStatsCategories`, 22 правила css под `db-cat-*`), в приложении
 * — НЕТ ВОВСЕ. Слово Кости 29.10: «если на сайте есть, значит и в
 * приложении надо будет сделать, так как мы сайт создавали и писали и
 * отображали информацию, которая нужна будет для пользователя».
 *
 * Поэтому дом пишется СРАЗУ общим: иначе приложение получило бы вторую
 * реализацию, и мы бы сводили её через неделю, как свели плитки (A3.5) и
 * график (A3.3).
 *
 * ПРИСТАВКА `kst-cat-*` — продолжение семьи плиток `kst-*`. На сайте
 * блок звался `db-cat-*`; приставка `db-` значит «кабинет», а в
 * приложении это профиль.
 *
 * ЧТО В ДОМЕ. И ДАННЫЕ, и РАЗМЕТКА: самое ценное здесь — расчёт МЕСТА, и
 * он непрост (свой пол; домашняя категория считается всегда, чужая —
 * только если в ней есть очки). Разойдись он между продуктами — человек
 * увидел бы на сайте «#4», а в приложении «#6», и это хуже отсутствия
 * блока.
 *
 * ЧЕГО В ДОМЕ НЕТ. Слова и склонение: дом принимает их снаружи
 * (`опции.слова`, `опции.счёт`), потому что у сайта словарь свой, у
 * приложения свой. Тот же приём, что в доме графика.
 *
 * Правка правится В ДВУХ МЕСТАХ: файл лежит побайтовой копией в
 * `mobile/www/js/`. Расхождение ловит сторож `check-kategorii.js`.
 */
(function (global) {
    'use strict';

    var API = global.KSLT_KATEGORII = {};

    function экр(s) {
        if (global.KSLT_экранировать) return global.KSLT_экранировать(s);
        return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
            return { '&': '&amp;', '<': '&lt;', '>': '&gt;',
                     '"': '&quot;', "'": '&#39;' }[c];
        });
    }

    /**
     * ДАННЫЕ: строки категорий игрока с посчитанным местом.
     *
     * @param {object} client — клиент базы
     * @param {object} игрок — { id, gender, category_id }
     * @returns {Promise<Array>} строки: { category_id, points, wins,
     *          losses, closed_at, closed_reason, место, домашняя }
     */
    API.строки = function (client, игрок) {
        if (!client || !игрок || !игрок.id) return Promise.resolve([]);

        return client.from('player_categories')
            .select('player_id, category_id, points, wins, losses, closed_at, closed_reason')
            .order('points', { ascending: false })
            .then(function (pc) {
                var все = pc.data || [];

                /* Friendly в рейтинге не участвует: турниры и матчи
                   записываются, очков за них нет. То же правило, что в
                   доме графика (`kslt-grafik-dannye.js`). */
                var свои = все.filter(function (r) {
                    return r.player_id === игрок.id && r.category_id !== 'friendly';
                });

                /* Домашняя категория видна и без очков: игрок в ней уже
                   числится, просто ещё ничего не набрал. */
                if (игрок.category_id && !свои.some(function (r) {
                        return r.category_id === игрок.category_id;
                    })) {
                    свои.push({
                        player_id: игрок.id, category_id: игрок.category_id,
                        points: 0, wins: 0, losses: 0
                    });
                }
                if (свои.length === 0) return [];

                return client.from('players').select('id, gender, category_id')
                    .eq('gender', игрок.gender)
                    .then(function (pl) {
                        var своегоПола = pl.data || [];
                        return свои.map(function (строка) {
                            /* МЕСТО СЧИТАЕТСЯ ТАК ЖЕ, КАК В ПУБЛИЧНОМ
                               РЕЙТИНГЕ: свой пол, домашняя категория —
                               всегда, чужая — только если там есть очки.
                               Разойдись это между продуктами, человек
                               увидел бы два разных места. */
                            var очкиВ = {};
                            все.forEach(function (r) {
                                if (r.category_id === строка.category_id) {
                                    очкиВ[r.player_id] = r.points || 0;
                                }
                            });
                            var место = своегоПола.filter(function (o) {
                                if (o.category_id !== строка.category_id &&
                                    !(очкиВ[o.id] > 0)) return false;
                                return (очкиВ[o.id] || 0) > (строка.points || 0);
                            }).length + 1;

                            return {
                                category_id: строка.category_id,
                                points: строка.points || 0,
                                wins: строка.wins || 0,
                                losses: строка.losses || 0,
                                closed_at: строка.closed_at || null,
                                closed_reason: строка.closed_reason || null,
                                место: место,
                                домашняя: строка.category_id === игрок.category_id
                            };
                        });
                    });
            });
    };

    /**
     * Полоса побед и поражений под плитками.
     *
     * Четыре цифры одинакового размера не показывали главного — как
     * игрок выступает. Соотношение видно полоской, цвета те же, что у
     * значков в таблице матчей: зелёный — победа, красный — поражение.
     */
    function полоса(строка, о) {
        var в = строка.wins, п = строка.losses, игр = в + п;
        var с = о.слова || {};
        /* ЧИСЛО ДОБАВЛЯЕТ ДОМ, А ФОРМУ ВЫБИРАЕТ ПРОДУКТ. `опции.счёт` —
           это правило выбора формы («матч / матча / матчей»), оно
           отдаёт ТОЛЬКО слово: так устроен дом языка
           (`js/kslt-yazyk.js`, `Я.счёт`). Если бы число приписывал
           зовущий, сайт и приложение разошлись бы на пробеле. */
        var форма = о.счёт || function (н, один) { return один; };
        var счёт = function (н, один, немного, много) {
            return н + ' ' + форма(н, один, немного, много);
        };

        if (!игр) {
            return '<div class="kst-cat-bar"></div>' +
                   '<div class="kst-cat-legend"><span>' +
                   экр(с.нетМатчей || '') + '</span></div>';
        }
        return '<div class="kst-cat-bar">' +
                   '<i class="kst-cat-bar-w" style="width:' + (в / игр * 100) + '%"></i>' +
                   '<i class="kst-cat-bar-l" style="width:' + (п / игр * 100) + '%"></i>' +
               '</div>' +
               '<div class="kst-cat-legend">' +
                   '<span>' + экр(с.всего || '') + ': ' + игр + '</span>' +
                   '<span class="kst-cat-record">' +
                       '<span class="kst-cat-mark kst-cat-mark-w"></span>' +
                       экр(счёт(в, с.победа, с.победы, с.побед)) +
                       '<span class="kst-cat-mark kst-cat-mark-l"></span>' +
                       экр(счёт(п, с.поражение, с.поражения, с.поражений)) +
                   '</span>' +
               '</div>';
    }

    /** Процент побед у правого края строки: это итог категории. */
    function процент(строка, о) {
        var игр = строка.wins + строка.losses;
        var П = global.KSLT_RULES;
        var значение = П && П.процентПобедТекст
            ? П.процентПобедТекст(строка.wins, строка.losses)
            : '—';
        return '<div class="kst-cat-rate' + (игр ? '' : ' kst-cat-rate-empty') + '">' +
                   '<b>' + экр(значение) + '</b>' +
                   '<span>' + экр((о.слова || {}).процент || '') + '</span>' +
               '</div>';
    }

    /**
     * Один блок категории.
     *
     * @param {object} строка — из `API.строки`
     * @param {object} о — { слова, счёт, цвет, имя }
     */
    API.блок = function (строка, о) {
        о = о || {};
        var с = о.слова || {};
        var П = global.KSLT_PLITKI;

        var плитки = П
            ? П.сетка([
                  П.плитка(строка.points, с.очки),
                  П.плитка(строка.wins,   с.победыКратко),
                  П.плитка(строка.losses, с.поражКратко),
                  П.плитка('#' + строка.место, с.место)
              ], { мини: true })
            : '';

        return '<div class="kst-cat-block">' +
                   '<div class="kst-cat-name">' +
                       '<span class="kst-cat-dot" style="background:' +
                           экр(о.цвет || '#8A8A8F') + '"></span>' +
                       экр(о.имя || строка.category_id) +
                       (строка.домашняя
                           ? ' <span class="kst-cat-home">' + экр(с.домашняя || '') + '</span>'
                           : '') +
                       /* Категория закрыта для новых заявок. Очки и матчи
                          в ней остаются, поэтому она видна, но помечена.
                          Причину игрок видит у себя: это про него. */
                       (строка.closed_at
                           ? ' <span class="kst-cat-closed">' + экр(с.закрыта || '') +
                             (строка.closed_reason
                                 ? ' · ' + экр(строка.closed_reason) : '') +
                             '</span>'
                           : '') +
                   '</div>' +
                   '<div class="kst-cat-top">' + плитки + процент(строка, о) + '</div>' +
                   полоса(строка, о) +
               '</div>';
    };

    /**
     * Все блоки подряд. Порядок — тот, в котором пришли строки: база
     * отдаёт их по очкам вниз.
     */
    API.все = function (строки, о) {
        о = о || {};
        if (!строки || строки.length === 0) return '';
        return (строки || []).map(function (строка) {
            return API.блок(строка, {
                слова: о.слова,
                счёт: о.счёт,
                имя: (о.имена || {})[строка.category_id],
                цвет: (о.цвета || {})[строка.category_id]
            });
        }).join('');
    };

})(typeof window !== 'undefined' ? window : this);
