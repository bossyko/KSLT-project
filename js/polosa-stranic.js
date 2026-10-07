/**
 * ПОЛОСА СТРАНИЦ — ОДНО ОПРЕДЕЛЕНИЕ НА ВЕСЬ САЙТ.
 *
 * Жила в `js/players.js` с 06.10 и была там одна на два экрана рейтинга.
 * 07.10 полосу попросили корты — и определение переехало сюда целиком,
 * а не скопировалось: ДВЕ КОПИИ РАСХОДЯТСЯ НЕ СРАЗУ, А НА ВТОРОЙ ПРАВКЕ.
 * У кортов своя полоса была как раз второй копией, и худшей: слова
 * «← Назад / Далее →» вместо шевронов, все номера подряд без окна и без
 * счётчика строк.
 *
 * Разметка и причины — ровно те, что были в рейтинге; поменялись только
 * две вещи: контейнер и подписи приходят снаружи, потому что у разделов
 * они свои. Классы `pl-` оставлены: это ИМЯ КОМПОНЕНТА, а не прописка, и
 * по ним стоят правила заморозки и проба. Стили компонента переехали
 * вместе с ним — в `css/style.css`.
 *
 * Подписи (labels): shownOf, pageOf, prevPage, nextPage.
 */
(function () {
    'use strict';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    function полосаСтраниц(container, total, page, шаг, labels) {
        if (!container) return;

        var всего = Math.max(1, Math.ceil(total / шаг));
        if (всего <= 1) {
            container.innerHTML = '';
            return;
        }

        page = Math.min(Math.max(1, page), всего);

        /* Какие номера показываем: первая, последняя, текущая и по соседу с
           каждой стороны. Многоточие ставится там, где между соседями
           остался разрыв больше одной страницы. */
        /* ОКНО УЗКОГО ВИДА УЖЕ НА ОДНУ СТУПЕНЬ — ЭТО ПОСЧИТАНО, А НЕ НА ГЛАЗ.
           Замер 06.10 на стенде `maket/polosa-stranic-zamer.html`, крайний
           случай «40 страниц, два многоточия»: при соседях ±1 полоса просит
           364 при ряде 343 на телефоне 375 — перелив 21 даже после того, как
           кнопки сели на ступень 36. Соседи ±0 (первая · … · текущая · … ·
           последняя) просят 276 из 343. На всех остальных видах окно
           прежнее. */
        var узкий = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        var соседей = 1;
        var номера = [];
        for (var n = 1; n <= всего; n++) {
            if (n === 1 || n === всего || Math.abs(n - page) <= соседей) номера.push(n);
        }

        /* ШЕВРОН, А НЕ СЛОВО — ТАК НАПИСАНО В КОМПОНЕНТЕ `Pagination item
           31:43`: «Previous and next reuse this component with a chevron
           instead of a number». Слово «Назад» просило 66 на широких видах и
           сжималось до 44 на телефоне, обрезая само себя. Слово не теряется:
           оно уходит в `aria-label`, диктор читает его целиком. */
        var шеврон = function (влево) {
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
                'stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                '<path d="' + (влево ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>';
        };

        /* СЧЁТЧИК ОБЯЗАТЕЛЕН, А НЕ УКРАШЕНИЕ. Правило отрасли, а не мой вкус:
           Elastic EUI, «Always present a clear indicator of how many results
           have been returned». У нас его не было вовсе: человек видел кнопки
           страниц и не знал, сколько всего строк. Счётчик слева, страницы
           справа — ровно так устроен и компонент `Pagination row 115:171`. */
        var первый = (page - 1) * шаг + 1;
        var последний = Math.min(page * шаг, total);

        /* НА УЗКОМ ВИДЕ — СЖАТАЯ ФОРМА, А НЕ УЗКОЕ ОКНО. Та же EUI: numbered
           для малых наборов, compressed для больших. Сорок номеров в ряд 343
           не влезают ни при каком окне; «20 из 40» между стрелками влезает
           всегда и говорит больше, чем три номера с многоточиями. */
        var html = '<div class="pl-pagination">';
        html += '<span class="pl-page-count">' + первый + '\u2013' + последний +
            ' ' + labels.shownOf + ' ' + total + '</span>';
        html += '<div class="pl-pagination-pages">';
        html += '<button class="pl-page-btn pl-page-prev" aria-label="' +
            esc(labels.prevPage.replace(/[\u2190\u2192]/g, '').trim()) + '"' +
            (page === 1 ? ' disabled' : '') + '>' + шеврон(true) + '</button>';

        if (узкий) {
            html += '<span class="pl-page-now">' + page + ' ' + labels.pageOf +
                ' ' + всего + '</span>';
        }

        var прошлый = 0;
        if (!узкий) номера.forEach(function (n) {
            if (прошлый && n - прошлый > 1) {
                html += '<span class="pl-page-gap" aria-hidden="true">…</span>';
            }
            html += '<button class="pl-page-btn pl-page-num' +
                (n === page ? ' active' : '') + '" data-page="' + n + '"' +
                (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
            прошлый = n;
        });

        html += '<button class="pl-page-btn pl-page-next" aria-label="' +
            esc(labels.nextPage.replace(/[\u2190\u2192]/g, '').trim()) + '"' +
            (page === всего ? ' disabled' : '') + '>' + шеврон(false) + '</button>';
        html += '</div></div>';

        container.innerHTML = html;
    }

    window.KSLT_полосаСтраниц = полосаСтраниц;
})();
