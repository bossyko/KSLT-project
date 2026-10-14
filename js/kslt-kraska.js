/**
 * КРАСКА ПРОДУКТА — ОДНО ОПРЕДЕЛЕНИЕ, ДОСТУПНОЕ И ХОЛСТУ.
 *
 * Цвет акцента объявлен ОДИН раз, в `css/tokens.css`. Но холст (`<canvas>`)
 * и настройки Chart.js css-переменных не понимают: им нужна строка. Пока
 * читалки не было, цвет писали числом — замер 13.10 нашёл `#CCFF00`
 * литералом в 73 местах двадцати файлов и `rgba(204, 255, 0, …)` ещё в 378,
 * причём прозрачностей оказалось ТРИДЦАТЬ ТРИ.
 *
 * Здесь не «удобная обёртка», а единственный законный способ взять цвет в
 * js: токен читается у корня документа, то есть там же, где его видит css.
 * Поменяли токен — поменялся и холст.
 *
 *     KSLT_KRASKA.цвет('--accent')          → '#CCFF00'
 *     KSLT_KRASKA.цвет('--accent', 0.12)    → 'var(--alpha-lime-12)'
 *
 * ЧИТАЕТСЯ ПРИ КАЖДОМ ВЫЗОВЕ, А НЕ ЗАПОМИНАЕТСЯ: тема может смениться
 * после загрузки, и запомненное значение врало бы молча.
 */
(function () {
    'use strict';

    function сырое(имя) {
        try {
            return window.getComputedStyle(document.documentElement)
                .getPropertyValue(имя).trim();
        } catch (e) { return ''; }
    }

    /* #RGB и #RRGGBB → [r, g, b]. Другое — null: число, которого не
       разобрать, не выдумывается. */
    function разобрать(цв) {
        var м = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(цв);
        if (м) {
            var h = м[1];
            if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
            return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16),
                    parseInt(h.slice(4, 6), 16)];
        }
        var р = /^rgba?\(([^)]+)\)$/i.exec(цв);
        if (р) {
            var ч = р[1].split(',').map(function (x) { return parseFloat(x); });
            if (ч.length >= 3) return [ч[0], ч[1], ч[2]];
        }
        return null;
    }

    window.KSLT_KRASKA = {
        /**
         * @param {string} имя   имя токена, как в css: '--accent'
         * @param {number} [альфа] прозрачность 0..1; без неё — цвет как есть
         * @returns {string} строка для холста, Chart.js или инлайна
         */
        цвет: function (имя, альфа) {
            var знач = сырое(имя);
            if (!знач) return '';
            if (альфа === undefined || альфа === null) return знач;
            var ч = разобрать(знач);
            if (!ч) return знач;
            return 'rgba(' + ч[0] + ', ' + ч[1] + ', ' + ч[2] + ', ' + альфа + ')';
        }
    };
})();
