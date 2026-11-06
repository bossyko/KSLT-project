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

    /* СПИСОК ОКОН. Держится не руками: сторож `check-okna-prilozheniya.js`
       обходит ВСЕ места, где ставится класс `open`, разбирает класс узла и
       падает, если окно не накрыто этим списком и не названо исключением.
       ПОЧЕМУ НЕ «ЛЮБОЙ УЗЕЛ С КЛАССОМ open»: класс `open` носит и
       НЕ-ОКНО — `.tc-status.open` (корт «открыт», `app.css:911`). Дом,
       объявивший такую плашку окном, увёл бы в неё фокус.

       ДОБАВЛЕНО 29.10 ПО ЗАМЕРУ: кусок 230 накрыл восемь классов, а
       окон, ставящих `open`, двадцать шесть — и СЕМЬ из них в список не
       попали: возврат учётной записи, онбординг, смена пароля, вход
       через Telegram, приглашения на игру и личные встречи (из двух
       мест). Для диктора эти семь окон не существовали, Tab из них
       уходил читать страницу под окном, Esc не работал.
       СПИСОК, КОТОРЫЙ ДЕРЖИТСЯ РУКАМИ, ОТСТАЁТ — потому и сторож. */
    var ОКНА = '.td-overlay, .otp-overlay, .notif-overlay, .bottom-sheet-overlay,' +
               ' .menu-overlay, .live-full, .nm-viewer, .msa-overlay,' +
               ' .ar-overlay, .onboarding-overlay, .otp-pw-overlay,' +
               ' .tg-reg-overlay, .gi-overlay, .pd-h2h-modal,' +
               ' .push-prime-overlay';
    var ПОДПИСЬ = 'h1, h2, h3, .bs-title, .td-title, .notif-title, .otp-title,' +
                  ' .ar-title, .gi-title, .prof-sub-title, .tg-reg-title,' +
                  ' .push-prime-title';
    var ЗАКРЫТЬ = '[data-okno-zakryt], .td-back, .notif-back, .otp-close,' +
                  ' .live-back, .nm-viewer-close, .menu-close,' +
                  ' .ar-close, .gi-close, .prof-sub-back, .tg-reg-close';
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

    function вСтопке(узел) {
        for (var i = 0; i < стопка.length; i++) if (стопка[i].окно === узел) return true;
        return false;
    }

    /**
     * УВЕСТИ ФОКУС ВНУТРЬ — КОГДА ОКНО СТАНЕТ ВИДНО, А НЕ КОГДА ПОЯВИЛСЯ
     * КЛАСС.
     *
     * ЗАМЕР 06.11, ОДИННАДЦАТЬ ОКОН РАЗМЕТКИ: у ШЕСТИ фокус оставался
     * снаружи — otp, нижние шторки, боковое меню, смена пароля, вход
     * через Telegram, push-prime. И не приходил даже через полсекунды.
     *
     * ПРИЧИНА НАЗВАНА ЧИСЛОМ, А НЕ УГАДАНА: у этих окон `visibility`
     * стоит в переходе и держится `hidden` все 0.25 с, а `focus()` НА
     * СКРЫТОМ ЭЛЕМЕНТЕ НЕ ДЕЛАЕТ НИЧЕГО — браузер молча его не
     * исполняет. Дом звал фокус один раз, в тот самый миг, и второй
     * попытки не было ни у кого.
     *
     * ПОЧЕМУ НЕ УБРАТЬ `visibility` ИЗ ПЕРЕХОДОВ. Она там не для
     * красоты: закрытое окно обязано перестать ловить нажатия, а
     * `opacity: 0` их ловит. Чинить надо тот, кто спешит, а не тех, кто
     * ждёт.
     *
     * ПОЧЕМУ НЕ ПРОСТО `setTimeout` НА 300. Это число из чужого файла:
     * оно врёт при другой длительности перехода и крадёт четверть
     * секунды там, где окно видно сразу. Дом СПРАШИВАЕТ видимость, а
     * потолок (400 мс) — только страховка, если `transitionend` не
     * придёт вовсе (свёрнутое приложение кадров не рисует).
     */
    function увестиФокус(узел) {
        function внутрь() {
            /* Окно могли закрыть, пока мы ждали. Фокус в закрытое окно —
               это фокус в никуда, и Tab после него уходит под окно. */
            if (!вСтопке(узел) || !узел.classList.contains('open')) return;
            var цели = видимые(узел);
            if (цели.length) { цели[0].focus(); return; }
            if (!узел.hasAttribute('tabindex')) узел.setAttribute('tabindex', '-1');
            узел.focus();
        }

        if (!скрыт(узел)) { внутрь(); return; }

        var сделано = false;
        function попытка() {
            if (сделано) return;
            if (скрыт(узел)) return;
            сделано = true;
            узел.removeEventListener('transitionend', попытка);
            внутрь();
        }
        узел.addEventListener('transitionend', попытка);
        var тик = setInterval(function () {
            попытка();
            if (сделано) clearInterval(тик);
        }, 50);
        setTimeout(function () {
            clearInterval(тик);
            узел.removeEventListener('transitionend', попытка);
            if (!сделано) { сделано = true; внутрь(); }
        }, 400);
    }

    function скрыт(узел) {
        return getComputedStyle(узел).visibility === 'hidden';
    }

    function открылось(узел) {
        /* СРАВНИВАЕМ ОКНО С ОКНОМ, А НЕ С ЗАПИСЬЮ О НЁМ. Здесь стояло
           `стопка.indexOf(узел)`, а стопка хранит `{окно, открывший}` —
           поиск не находил НИЧЕГО НИКОГДА, и одно окно ложилось в стопку
           дважды. Замер 06.11: два окна в стопке при одном видимом. */
        if (вСтопке(узел)) return;
        узел.setAttribute('role', 'dialog');
        узел.setAttribute('aria-modal', 'true');
        подписать(узел);
        стопка.push({ окно: узел, открывший: document.activeElement });
        увестиФокус(узел);
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

    /**
     * Закрыть верхнее окно. Отдаёт true, если было что закрывать.
     *
     * Нажимаем СВОЮ кнопку закрытия, а не снимаем класс руками: у окна
     * может быть уборка (отписка, сброс полей, удаление из дома через
     * 300 мс), и обойти её значит завести второй путь закрытия.
     */
    function закрытьВерхнее() {
        var узел = верхнее();
        if (!узел) return false;
        var кнопка = узел.querySelector(ЗАКРЫТЬ);
        if (кнопка) { кнопка.click(); return true; }
        узел.classList.remove('open');
        return true;
    }

    /* ── Esc закрывает ── */
    document.addEventListener('keydown', function (e) {
        if (e.key !== 'Escape' || e.defaultPrevented) return;
        закрытьВерхнее();
    });

    /* ── АППАРАТНАЯ КНОПКА «НАЗАД» ЗАКРЫВАЕТ ОКНО, А НЕ ПРИЛОЖЕНИЕ ──
       (02.11, слово Кости: «кнопка назад она сверху, и закрыть
       уведомление, которое выходит боковым окном, тяжело»).

       ПРОЧИТАНО, А НЕ ПРЕДПОЛОЖЕНО: в `node_modules/@capacitor/android`
       обработки этой кнопки НЕТ ВОВСЕ — ни `onBackPressed`, ни
       `OnBackInvokedCallback`, ни `KEYCODE_BACK`, ноль совпадений по
       всем 60 файлам java. Значит нажатие доставалось Activity, и она
       закрывалась: человек открыл уведомления, нажал «назад» — вышел из
       приложения. На Android это ГЛАВНЫЙ способ вернуться, и у нас он
       не возвращал, а выбрасывал.

       Событие в веб отдаёт только плагин `@capacitor/app`; без него
       слушатель не ставится и поведение остаётся прежним. Esc делает то
       же самое на столе — ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: обе кнопки
       зовут `закрытьВерхнее`, а не повторяют его. */
    function аппаратнаяНазад() {
        var П = global.Capacitor && global.Capacitor.Plugins;
        if (!П || !П.App || !П.App.addListener) return;
        П.App.addListener('backButton', function (д) {
            if (закрытьВерхнее()) return;
            /* Окон нет — решает история, а не мы: внутри экрана человек
               ждёт возврата на предыдущий, на первом — выхода.
               `canGoBack` отдаёт сам плагин. */
            if (д && д.canGoBack) global.history.back();
            else if (П.App.exitApp) П.App.exitApp();
        });
    }

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
        аппаратнаяНазад();
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', завести);
    } else {
        завести();
    }

    global.KSLT_OKNO = {
        открытые: function () { return стопка.length; },
        закрытьВерхнее: закрытьВерхнее
    };
})(window);
