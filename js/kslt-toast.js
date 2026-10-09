/**
 * Уведомление — ОДНО на весь сайт.
 *
 * Компонент Toast 30:59 говорит сам: «KSLT currently has four separate
 * notification mechanisms in code. They should all render this one
 * component». Пересчитано 09.10 — их ШЕСТЬ: battle-cards.js:423,
 * battles-overview.js:853, coaches.js:238, courts.js:296,
 * invite-player.js:372 и match-score.js:335, у каждого свой размер,
 * своё время и свой цвет.
 *
 * Седьмую копию заводить нельзя, поэтому здесь общий. «Цены» зовут его
 * первыми; остальные пять переводятся отдельным куском — за ними следит
 * правило-сторож, которое падает при появлении новой своей копии.
 *
 * ТОН НЕСЁТ ТОЧКА, А НЕ ФОН — правило компонента: сплошная цветная
 * плашка спорит с лаймовым акцентом сайта.
 *
 *   KSLT_TOAST.показать('Текст', { тон: 'info' | 'ok' | 'warn' | 'err',
 *                                  заголовок: 'Скоро' });
 */
(function () {
    'use strict';

    var T = {};
    var КОРОБКА = null;
    var ЖИВУТ = 4500;

    function короб() {
        if (КОРОБКА && document.body.contains(КОРОБКА)) return КОРОБКА;
        КОРОБКА = document.createElement('div');
        КОРОБКА.className = 'kslt-toasts';
        КОРОБКА.setAttribute('role', 'status');
        КОРОБКА.setAttribute('aria-live', 'polite');
        document.body.appendChild(КОРОБКА);
        return КОРОБКА;
    }

    /**
     * @param {string} текст
     * @param {{тон?: string, заголовок?: string, живёт?: number}} [опции]
     */
    T.показать = function (текст, опции) {
        опции = опции || {};
        var тон = опции.тон || 'info';

        var t = document.createElement('div');
        t.className = 'kslt-toast kslt-toast--' + тон;

        var точка = document.createElement('span');
        точка.className = 'kslt-toast-dot';
        t.appendChild(точка);

        var тело = document.createElement('div');
        тело.className = 'kslt-toast-body';
        if (опции.заголовок) {
            var з = document.createElement('div');
            з.className = 'kslt-toast-title';
            з.textContent = опции.заголовок;
            тело.appendChild(з);
        }
        var п = document.createElement('div');
        п.className = 'kslt-toast-text';
        п.textContent = текст;
        тело.appendChild(п);
        t.appendChild(тело);

        var закрыть = document.createElement('button');
        закрыть.type = 'button';
        закрыть.className = 'kslt-toast-close';
        закрыть.setAttribute('aria-label', 'Закрыть уведомление');
        закрыть.textContent = '×';
        закрыть.addEventListener('click', function () { убрать(t); });
        t.appendChild(закрыть);

        короб().appendChild(t);

        var срок = опции.живёт || ЖИВУТ;
        var таймер = setTimeout(function () { убрать(t); }, срок);
        t.addEventListener('mouseenter', function () { clearTimeout(таймер); });
        t.addEventListener('mouseleave', function () {
            таймер = setTimeout(function () { убрать(t); }, 1500);
        });
        return t;
    };

    function убрать(t) {
        if (!t || !t.parentNode) return;
        t.classList.add('kslt-toast--uhodit');
        setTimeout(function () {
            if (t.parentNode) t.parentNode.removeChild(t);
        }, 200);
    }

    window.KSLT_TOAST = T;
})();
