/**
 * ПРАВОВОЙ ДОКУМЕНТ СО СКЛАДЫВАЮЩИМИСЯ РАЗДЕЛАМИ — 06.11.2026.
 *
 * Разделы свёрнуты нативным `details`, и всё, что он умеет сам —
 * раскрытие нажатием, клавиатура, диктор, поиск по странице — уже
 * работает без этого файла. Здесь только три вещи, которых у него нет.
 *
 * СОБЫТИЯ ВЕШАЮТСЯ НА ДОКУМЕНТ, А НЕ НА КНОПКИ. Тело документа
 * приходит из базы и ЗАМЕЩАЕТ разметку целиком
 * (`js/site-content.js:186`): обработчик, повешенный на кнопку при
 * загрузке, после замены указывает на выброшенный узел и молча
 * перестаёт работать. Делегирование переживает любую замену.
 */
(function () {
    'use strict';

    var СКЛАДКА = '.ip-doc-fold';

    /** Все раскрывашки страницы, сколько бы раз её ни перерисовали. */
    function складки() {
        return Array.prototype.slice.call(document.querySelectorAll(СКЛАДКА));
    }

    /* ── 1. ПЕРЕХОД ПО ОГЛАВЛЕНИЮ ОТКРЫВАЕТ РАЗДЕЛ ──────────────────
       Браузер прокручивает к закрытому `details` и показывает пустую
       полосу: человек нажал «Права пользователя» и видит заголовок без
       текста. Открываем сами. */

    function открытьПоЯкорю(якорь) {
        if (!якорь || якорь.length < 2) return;
        var цель;
        try { цель = document.getElementById(decodeURIComponent(якорь.slice(1))); }
        catch (e) { return; }
        if (!цель) return;
        if (цель.tagName === 'DETAILS') цель.open = true;
        else {
            var род = цель.closest ? цель.closest(СКЛАДКА) : null;
            if (род) род.open = true;
        }
        /* Прокрутку делаем сами: браузер уже отработал по закрытому
           разделу, и высота под ним изменилась. */
        цель.scrollIntoView({ block: 'start', behavior: 'auto' });
    }

    document.addEventListener('click', function (e) {
        var ссылка = e.target.closest && e.target.closest('.ip-toc-list a[href^="#"]');
        if (!ссылка) return;
        e.preventDefault();
        var якорь = ссылка.getAttribute('href');
        открытьПоЯкорю(якорь);
        if (window.history && window.history.replaceState) {
            window.history.replaceState(null, '', якорь);
        }
    });

    /* Пришли по ссылке с якорем снаружи — открыть тот же раздел.
       Текст может прийти из базы позже, поэтому пробуем и после неё. */
    window.addEventListener('hashchange', function () { открытьПоЯкорю(window.location.hash); });

    /* ── 2. «РАСКРЫТЬ ВСЕ» ──────────────────────────────────────────
       Нужна, когда человек ищет слово глазами, а не через поиск, и
       когда документ пересылают целиком. Кнопка знает оба состояния:
       раскрыть и свернуть обратно. */

    /* Надпись на трёх языках. Берём её у дома языка, а не считаем по
       адресу страницы: адрес — способ доставки, а не свойство
       документа (`js/kslt-yazyk.js`). Дома нет — пишем по-русски: это
       язык, на котором документ утверждён. */
    function надпись(открыто) {
        var Я = window.KSLT_YAZYK;
        if (!Я || !Я.выбрать) return открыто ? 'Свернуть все разделы' : 'Раскрыть все разделы';
        return открыто
            ? Я.выбрать('Collapse all sections', 'Бардык бөлүмдөрдү жыйноо', 'Свернуть все разделы')
            : Я.выбрать('Expand all sections',   'Бардык бөлүмдөрдү ачуу',   'Раскрыть все разделы');
    }

    function обновитьКнопку(кнопка) {
        var всеОткрыты = складки().every(function (д) { return д.open; });
        кнопка.textContent = надпись(всеОткрыты);
        кнопка.setAttribute('aria-expanded', всеОткрыты ? 'true' : 'false');
    }

    document.addEventListener('click', function (e) {
        var кнопка = e.target.closest && e.target.closest('[data-doc-expand]');
        if (!кнопка) return;
        var всеОткрыты = складки().every(function (д) { return д.open; });
        складки().forEach(function (д) { д.open = !всеОткрыты; });
        обновитьКнопку(кнопка);
    });

    /* Состояние кнопки меняется и от нажатия на сам раздел. */
    document.addEventListener('toggle', function (e) {
        if (!e.target.matches || !e.target.matches(СКЛАДКА)) return;
        var кнопка = document.querySelector('[data-doc-expand]');
        if (кнопка) обновитьКнопку(кнопка);
    }, true);

    /* ── 3. ПЕЧАТЬ ──────────────────────────────────────────────────
       Пункт 1.5 политики обещает, что её можно сохранить и
       распечатать. Свёрнутый `details` на бумагу не идёт: браузер
       прячет содержимое сам, и css этого не отменяет. Поэтому
       открываем все разделы ПЕРЕД печатью и возвращаем как было
       после — иначе человек вернётся к странице, развёрнутой без
       спроса. */

    var былиОткрыты = null;

    function передПечатью() {
        былиОткрыты = складки().map(function (д) { return д.open; });
        складки().forEach(function (д) { д.open = true; });
    }

    function послеПечати() {
        if (!былиОткрыты) return;
        складки().forEach(function (д, i) { д.open = былиОткрыты[i]; });
        былиОткрыты = null;
    }

    window.addEventListener('beforeprint', передПечатью);
    window.addEventListener('afterprint', послеПечати);

    document.addEventListener('click', function (e) {
        if (!e.target.closest || !e.target.closest('[data-doc-print]')) return;
        /* Safari на телефоне события печати не шлёт — открываем сами,
           а возвращаем по таймеру: afterprint может не прийти вовсе. */
        передПечатью();
        window.print();
        setTimeout(послеПечати, 1000);
    });
}());
