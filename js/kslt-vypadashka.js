/**
 * KSLT — ВЫПАДАЮЩИЙ ФИЛЬТР. ОДИН ОРГАН НА ВЕСЬ ПРОДУКТ.
 *
 * ЗАЧЕМ ОН ЕСТЬ. Слово Кости 02.11 про приложение: «фильтры наверно надо
 * будет сделать выпадающем меню, а не так как сейчас». Замер показал не
 * то, чего я ждал: выпадающий фильтр на сайте УЖЕ НАПИСАН ЧЕТЫРЕЖДЫ —
 * `js/courts.js`, `js/coaches.js`, `js/partners.js`, `js/news.js`, — и
 * ряд чипов в приложении был бы пятым способом. Понятие одно, определений
 * пять. БЕДА РОЖДАЕТСЯ РОВНО НА ШВЕ, и она уже родилась:
 *
 *   · `aria-haspopup`, `aria-expanded`, `role="listbox"` и `aria-current`
 *     есть ТОЛЬКО у кортов. Для тренеров, партнёров и новостей диктор
 *     читает просто кнопку с непонятным словом.
 *   · ГАЛОЧКА у выбранного пункта — тоже только у кортов. Компонент
 *     `Menu item 32:44` требует её прямо: «never rely on the tint alone,
 *     it is invisible to anyone who cannot separate the two greys».
 *   · Закрытие по Escape у кортов снимает класс, но НЕ сбрасывает
 *     `aria-expanded` — хотя соседний комментарий обещает, что оно
 *     «обновляется в одном месте». Мест два, и второе забыло.
 *
 * СВЕРКА ФИГМЫ (02.11), ЧИТАНЫ ОПИСАНИЯ, А НЕ ВИД:
 *   `Dropdown 34:55` — панель 240 для навигации и фильтров, 320 для
 *   списка уведомлений; заливка bg/surface, радиус md, рамка 1px
 *   border/subtle, внутренний отступ 4, тень 0/12/32 при 45% чёрного —
 *   «the same elevation as Toast, because both float above the page».
 *   `Menu item 32:44` — высота 36, боковые отступы 12, радиус sm,
 *   подпись 14, четыре состояния, у выбранного галочка.
 *
 * ИМЯ В КОДЕ РАЗОШЛОСЬ С КОМПОНЕНТОМ, И ЭТО НАМЕРЕНО. Компонент велит
 * `.dropdown` и `.menu-item`; `.menu-item` в продукте ЗАНЯТ — это строка
 * бокового меню приложения. Поэтому `.kslt-dd` и `.kslt-dd-item`, по
 * образцу прижившегося `.kslt-cc`. Расхождение дописано в описание
 * компонента на доске.
 *
 * ЧТО ДОМ НЕ РЕШАЕТ. Откуда берутся пункты и что значит выбор — дело
 * зовущего: у кортов это города и покрытия со счётчиками, у новостей
 * разделы. Дом знает только, как это выглядит, как открывается и что
 * слышит диктор.
 */
(function () {
    'use strict';

    var D = window.KSLT_VYPADASHKA = {};

    function экр(s) {
        return window.KSLT_экранировать
            ? window.KSLT_экранировать(s)
            : String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
                return { '&': '&amp;', '<': '&lt;', '>': '&gt;',
                         '"': '&quot;', "'": '&#39;' }[c];
            });
    }

    /* Галочка ставится ПЕРЕД счётчиком, а не вместо него: счёт говорит,
       сколько там всего, галочка — что выбрано именно это. Два разных
       сообщения, и одно другое не заменяет. */
    var ГАЛКА = '<svg class="kslt-dd-tick" width="14" height="14" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="3" aria-hidden="true">' +
        '<path d="M20 6L9 17l-5-5"/></svg>';

    var СТРЕЛКА = '<svg class="kslt-dd-arrow" width="12" height="12" viewBox="0 0 24 24" ' +
        'fill="none" stroke="currentColor" stroke-width="2.5" aria-hidden="true">' +
        '<path d="M6 9l6 6 6-6"/></svg>';

    /**
     * Разметка одного фильтра.
     *
     * о.вид      — имя признака, приезжает обратно в `приВыборе` (`city`)
     * о.подпись  — что написано, когда не выбрано ничего («Город»)
     * о.текущее  — выбранное значение или 'all'
     * о.пункты   — [{ значение, подпись, счёт }]; счёт необязателен
     * о.широкая  — панель 320 вместо 240 (`Dropdown 34:55`, Size=Wide)
     * о.класс    — добавочный класс на корень
     *
     * ПУСТОЙ СПИСОК НЕ РИСУЕТСЯ ВОВСЕ. Фильтр, под которым нет ни одной
     * записи, — это орган, который не делает ничего: нажать можно,
     * произойти не может. Пусть лучше его не будет.
     */
    D.разметка = function (о) {
        о = о || {};
        var пункты = о.пункты || [];
        if (!пункты.length) return '';

        var текущее = о.текущее == null ? 'all' : String(о.текущее);
        var подписьКнопки = о.подпись;
        пункты.forEach(function (п) {
            if (String(п.значение) === текущее) подписьКнопки = п.подпись;
        });

        function пункт(значение, подпись, счёт) {
            var выбран = String(значение) === текущее;
            return '<button type="button" class="kslt-dd-item' + (выбран ? ' is-selected' : '') +
                '" data-dd-value="' + экр(значение) + '" role="option"' +
                ' aria-selected="' + (выбран ? 'true' : 'false') + '">' +
                '<span class="kslt-dd-label">' + экр(подпись) + '</span>' +
                (выбран ? ГАЛКА : '') +
                (счёт == null ? '' : '<span class="kslt-dd-count">' + экр(счёт) + '</span>') +
            '</button>';
        }

        var список = пункт('all', о.подпись, null);
        пункты.forEach(function (п) {
            список += пункт(п.значение, п.подпись, п.счёт);
        });

        /* ЧТО ЧИТАЕТ ДИКТОР. Без `aria-haspopup` и `aria-expanded` это
           просто кнопка с непонятным словом: не слышно ни что она
           раскрывается, ни открыта ли она сейчас. */
        return '<div class="kslt-dd' + (о.широкая ? ' kslt-dd--wide' : '') +
                (о.класс ? ' ' + о.класс : '') + '" data-dd="' + экр(о.вид) + '">' +
            '<button type="button" class="kslt-dd-toggle' +
                (текущее !== 'all' ? ' is-selected' : '') + '"' +
                ' aria-haspopup="listbox" aria-expanded="false">' +
                '<span class="kslt-dd-toggle-label">' + экр(подписьКнопки) + '</span>' +
                СТРЕЛКА +
            '</button>' +
            '<div class="kslt-dd-menu" role="listbox">' + список + '</div>' +
        '</div>';
    };

    /**
     * Один обработчик на всю страницу. Звать можно сколько угодно —
     * второй раз выходит сразу, иначе нажатие ловилось бы дважды.
     *
     * приВыборе(вид, значение, корень) — зовущий решает, что с этим
     * делать и когда перерисовывать.
     */
    D.включить = function (приВыборе) {
        if (D._готов) return;
        D._готов = true;

        /* ЗАКРЫТИЕ ЖИВЁТ В ОДНОМ МЕСТЕ, И ЭТО НЕ ПРИДИРКА: у кортов
           закрытий было два — нажатием мимо и клавишей Escape, — и
           второе забыло про `aria-expanded`. Экран закрывался, диктор
           продолжал говорить «открыто». */
        function закрытьВсе() {
            document.querySelectorAll('.kslt-dd.open').forEach(function (д) {
                д.classList.remove('open');
                var к = д.querySelector('.kslt-dd-toggle');
                if (к) к.setAttribute('aria-expanded', 'false');
            });
        }
        D.закрытьВсе = закрытьВсе;

        document.addEventListener('click', function (e) {
            var кнопка = e.target.closest ? e.target.closest('.kslt-dd-toggle') : null;
            var пункт = e.target.closest ? e.target.closest('.kslt-dd-item') : null;

            if (!кнопка && !пункт) { закрытьВсе(); return; }

            if (кнопка) {
                var корень = кнопка.closest('.kslt-dd');
                var былоОткрыто = корень.classList.contains('open');
                закрытьВсе();
                корень.classList.toggle('open', !былоОткрыто);
                кнопка.setAttribute('aria-expanded', String(!былоОткрыто));
                return;
            }

            var обёртка = пункт.closest('.kslt-dd');
            закрытьВсе();
            if (typeof приВыборе === 'function') {
                приВыборе(обёртка.getAttribute('data-dd'),
                          пункт.getAttribute('data-dd-value'),
                          обёртка);
            }
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') закрытьВсе();
        });
    };
})();
