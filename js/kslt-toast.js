/**
 * Уведомление — ОДНО на весь сайт.
 *
 * Компонент Toast 30:59 говорит сам: «KSLT currently has four separate
 * notification mechanisms in code. They should all render this one
 * component». Пересчитано 09.10 — шесть; пересчитано 14.10 — их СЕМЬ:
 * battle-cards.js, battles-overview.js, coaches.js, courts.js,
 * invite-player.js, match-score.js (функция там зовётся `toast`, а не
 * `showToast`, поэтому поиск по имени её не находил) и
 * admin/core/utils.js. У каждой свой класс, своё время и свой цвет:
 * ct- · co- · pt- · bo- · bc- · ad-.
 * ПОИСК ПО ИМЕНИ НАХОДИТ ТОЛЬКО ТО, ЧТО НАЗВАЛИ ТАК ЖЕ.
 *
 * Восьмую копию заводить нельзя, поэтому здесь общий. Все семь переведены
 * 14.10 заходом B1: тела заменены вызовом, ИМЕНА ФУНКЦИЙ ОСТАВЛЕНЫ на
 * месте — тогда вызовы в файлах не трогаются вовсе. За этим следит
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

    /**
     * ПЕРЕВОД СТАРОГО ИМЕНИ ТОНА — ОДНО ОПРЕДЕЛЕНИЕ, А НЕ СЕМЬ.
     *
     * Семь своих копий уведомления звали тон по-разному: 'error' и
     * 'success' в кортах, тренерах, приглашении и счёте матча;
     * 'ad-toast-success' в админке; а в обзоре баттлов и карточках тона
     * не было вовсе. Если бы каждая копия переводила своё имя сама,
     * перевод стал бы седьмой копией понятия вместо седьмой копии кода.
     *
     * Неизвестное имя даёт 'info', а не падение: уведомление обязано
     * показаться, даже когда тон назвали незнакомым словом.
     *
     * @param {string} [вид] 'error' | 'success' | 'warning' | 'info' и
     *                       их короткие формы
     * @returns {'info'|'ok'|'warn'|'err'}
     */
    T.тон = function (вид) {
        var в = String(вид == null ? '' : вид).toLowerCase();
        if (в.indexOf('err') !== -1 || в.indexOf('danger') !== -1) return 'err';
        if (в.indexOf('success') !== -1 || в === 'ok') return 'ok';
        if (в.indexOf('warn') !== -1) return 'warn';
        return 'info';
    };

    window.KSLT_TOAST = T;
})();
