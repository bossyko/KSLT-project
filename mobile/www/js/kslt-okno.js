/**
 * ОКНА ПРИЛОЖЕНИЯ — ОДИН ДОМ НА ВСЕ НАКЛАДКИ (кусок 230, 28.10).
 *
 * ЧТО БЫЛО. Окон двенадцать: турнир, баттл, игрок, новость, меню,
 * уведомления, ввод кода, смена пароля, вход через Telegram, шторка
 * рейтинга, полноэкранный Live, просмотр снимка. Ни у одного не было
 * `role="dialog"`, ни у одного — `aria-modal`, удержания фокуса и
 * возврата фокуса на кнопку, которая окно открыла. Для диктора такого
 * окна не существует: он продолжает читать страницу ПОД ним. С
 * клавиатуры из окна нельзя было выйти — Esc не работал нигде.
 *
 * ПОЧЕМУ ОДИН ДОМ, А НЕ ПРАВКА В ДВЕНАДЦАТИ МЕСТАХ. Класс `open`
 * ставится в 26 местах и снимается в 50, в пятнадцати файлах. Написать
 * поведение в каждом значило бы завести семьдесят шесть определений
 * одного понятия — и беда родилась бы ровно на шве, в том месте, которое
 * забыли. Поэтому дом СЛУШАЕТ смену класса, а не зовётся руками: ни один
 * из 76 зовов не правится, и новое окно получает поведение само.
 *
 * ПРИЗНАК ДЛЯ ДИКТОРА ЖИВЁТ ТАМ ЖЕ, ГДЕ КЛАСС — правило куска 215.
 * Класс ставит js, значит и `role` с `aria-modal` ставит он же, в тот
 * же миг. В разметке их нет намеренно: иначе признак и класс разъехались
 * бы при первом же окне, открытом иначе.
 */
(function (global) {
    'use strict';

    var ОКНА = '.td-overlay, .otp-overlay, .notif-overlay, .bottom-sheet-overlay,' +
               ' .menu-overlay, .live-full, .nm-viewer, .msa-overlay';
    var ПОДПИСЬ = 'h1, h2, h3, .bs-title, .td-title, .notif-title, .otp-title';
    var ЗАКРЫТЬ = '[data-okno-zakryt], .td-back, .notif-back, .otp-close,' +
                  ' .live-back, .nm-viewer-close, .menu-close';
    var ФОКУС = 'a[href], button:not([disabled]), input:not([disabled]),' +
                ' select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

    /* Стопка открытых окон: окно может открыться поверх окна (игрок из
       сетки турнира), и возвращать фокус надо тому, кто открыл ИМЕННО
       это, а не первому в истории. */
    var стопка = [];

    function видимые(узел) {
        return Array.prototype.filter.call(узел.querySelectorAll(ФОКУС), function (э) {
            return э.offsetParent !== null || э === document.activeElement;
        });
    }

    function подписать(узел) {
        if (узел.getAttribute('aria-label') || узел.getAttribute('aria-labelledby')) return;
        var з = узел.querySelector(ПОДПИСЬ);
        if (!з) return;
        if (з.id) { узел.setAttribute('aria-labelledby', з.id); return; }
        var текст = (з.textContent || '').trim();
        if (текст) узел.setAttribute('aria-label', текст);
    }

    function открылось(узел) {
        if (стопка.indexOf(узел) >= 0) return;
        узел.setAttribute('role', 'dialog');
        узел.setAttribute('aria-modal', 'true');
        подписать(узел);
        стопка.push({ окно: узел, открывший: document.activeElement });
        /* Фокус уводится ВНУТРЬ: иначе он остаётся на кнопке под окном, и
           следующий Tab уходит читать то, что окно закрыло. */
        var цели = видимые(узел);
        if (цели.length) {
            цели[0].focus();
        } else {
            if (!узел.hasAttribute('tabindex')) узел.setAttribute('tabindex', '-1');
            узел.focus();
        }
    }

    function закрылось(узел) {
        for (var i = стопка.length - 1; i >= 0; i--) {
            if (стопка[i].окно !== узел) continue;
            var кто = стопка[i].открывший;
            стопка.splice(i, 1);
            узел.removeAttribute('aria-modal');
            /* Фокус возвращается ТОМУ, КТО ОТКРЫЛ. Без этого он падает на
               начало страницы, и человек с клавиатуры начинает путь заново. */
            if (кто && document.contains(кто) && кто.offsetParent !== null) кто.focus();
            return;
        }
    }

    function верхнее() {
        return стопка.length ? стопка[стопка.length - 1].окно : null;
    }

    /* ── Esc закрывает ── */
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || e.defaultPrevented) return;
        var узел = верхнее();
        if (!узел) return;
        /* Нажимаем СВОЮ кнопку закрытия, а не снимаем класс руками: у окна
           может быть уборка (отписка, сброс полей), и обойти её значит
           завести второй путь закрытия. */
        var кнопка = узел.querySelector(ЗАКРЫТЬ);
        if (кнопка) { кнопка.click(); return; }
        узел.classList.remove('open');
    });

    /* ── Tab не уходит из окна ── */
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Tab') return;
        var узел = верхнее();
        if (!узел) return;
        var цели = видимые(узел);
        if (!цели.length) { e.preventDefault(); return; }
        var первый = цели[0], последний = цели[цели.length - 1];
        if (!e.shiftKey && document.activeElement === последний) {
            e.preventDefault(); первый.focus();
        } else if (e.shiftKey && document.activeElement === первый) {
            e.preventDefault(); последний.focus();
        } else if (!узел.contains(document.activeElement)) {
            e.preventDefault(); первый.focus();
        }
    });

    /* ── Слушаем класс, а не зовы ── */
    function осмотреть(узел) {
        if (!узел.matches || !узел.matches(ОКНА)) return;
        if (узел.classList.contains('open')) открылось(узел);
        else закрылось(узел);
    }

    var наблюдатель = new MutationObserver(function (записи) {
        записи.forEach(function (з) {
            if (з.type === 'attributes') { осмотреть(з.target); return; }
            Array.prototype.forEach.call(з.addedNodes, function (у) {
                if (у.nodeType === 1) осмотреть(у);
            });
        });
    });

    function завести() {
        наблюдатель.observe(document.body, {
            subtree: true, childList: true,
            attributes: true, attributeFilter: ['class']
        });
        Array.prototype.forEach.call(document.querySelectorAll(ОКНА), осмотреть);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', завести);
    } else {
        завести();
    }

    global.KSLT_OKNO = { открытые: function () { return стопка.length; } };
})(window);
