// ============================================
// KSLT — Логотипы спонсоров на странице «Спонсорам»
// ============================================
//
// Блок «Нас уже поддерживают» рисуется из базы: добавили спонсора в админке —
// он появился и здесь, без правки разметки. Пустые места оставляем, чтобы
// блок не выглядел куцым, когда спонсоров двое: пустая карточка со словами
// «место для вашего логотипа» работает лучше, чем ряд из двух логотипов.

(function() {
    'use strict';

    /** Свободных мест не дорисовываем: в ряду настоящих логотипов пустая
     *  плитка читалась как незагрузившаяся картинка, а не как приглашение */
    var FREE_SLOTS = 0;

    document.addEventListener('DOMContentLoaded', function() {
        var box = document.getElementById('snLogos');
        if (!box || !window.supabaseClient) return;

        window.supabaseClient
            .from('sponsors')
            .select('name, logo, url, is_hero, sort_order')
            .order('sort_order', { ascending: false })
            .then(function(res) {
                if (res.error || !res.data) return;
                render(box, res.data);
            });
    });

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    function render(box, list) {
        var html = '';

        list.forEach(function(s) {
            var inner = s.logo
                ? '<img src="' + KSLT_экранировать(s.logo) + '" alt="' + KSLT_экранировать(s.name) + '" loading="lazy">'
                : '<span>' + KSLT_экранировать(s.name) + '</span>';
            html += s.url
                ? '<a class="sn-logo filled" href="' + KSLT_экранировать(s.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'
                : '<div class="sn-logo filled">' + inner + '</div>';
        });

        for (var i = 0; i < FREE_SLOTS; i++) {
            html += '<div class="sn-logo">место для вашего логотипа</div>';
        }

        box.innerHTML = html;
    }
})();

// ============================================
// Связаться, не долистывая до конца
// ============================================
//
// Контакты стоят в конце страницы, а решение «давайте обсудим» человек
// принимает на первом экране. Кнопка обложки открывает окно сразу, а внизу
// висит полоса — она появляется, когда обложка ушла вверх, и прячется,
// когда до блока с контактами долистали.

(function() {
    'use strict';

    document.addEventListener('DOMContentLoaded', function() {
        var modal = document.getElementById('snModal');
        var bar = document.getElementById('snBar');
        var final = document.querySelector('.sn-final');
        if (!modal) return;

        /* ОКНО ДЕРЖИТ ФОКУС И ВОЗВРАЩАЕТ ЕГО. Разбор 13.10: роли не было,
           имени не было, Tab уходил на страницу под окном, а закрытие
           бросало фокус в никуда. Esc и клик по фону уже работали. Правило
           куплено на окне обмена баллов в кабинете (12.10) и применяется
           сюда без нового разбора. */
        var ктоОткрыл = null;

        /* ЗАПИРАНИЕ БЕРЁТСЯ ДОМОМ (153, 24.10). Свой список здесь был
           ПОЛНЕЕ остальных трёх копий — с полями, — и видимость он
           проверял; но `offsetParent` врёт на `position: fixed`, ветви
           «фокус под окном» не было, а пустое окно отпускало Tab. */
        var снять = null;

        function открыть(кнопка) {
            ктоОткрыл = кнопка || null;
            modal.hidden = false;
            /* ЗАПИРАТЬ ПОСЛЕ ПОКАЗА, А НЕ ДО: пока окно спрятано атрибутом,
               фокусируемого в нём НОЛЬ и высота НОЛЬ — дом такую запись
               снимает сам (замер 24.10). */
            снять = window.KSLT_FOKUS.запереть(modal, { поEsc: закрыть });
            var поля = window.KSLT_FOKUS.фокусируемые(modal);
            if (поля.length) фокус(поля[0]);
        }

        function фокус(э) { try { э.focus(); } catch (e) {} }

        function закрыть() {
            /* СНЯТИЕ ДО ПРЯТАНЬЯ: окно прячется АТРИБУТОМ, узел остаётся в
               документе, и признак «узел ушёл» дом не выручит. */
            if (снять) { снять(); снять = null; }
            modal.hidden = true;
            /* ВОЗВРАТ ФОКУСА ТУДА, ОТКУДА ОТКРЫЛИ: иначе человек с
               клавиатуры оказывается в начале страницы */
            if (ктоОткрыл) фокус(ктоОткрыл);
            ктоОткрыл = null;
        }

        document.querySelectorAll('[data-open-contacts]').forEach(function(b) {
            b.addEventListener('click', function() { открыть(b); });
        });
        document.getElementById('snModalClose').addEventListener('click', закрыть);
        modal.addEventListener('click', function(e) { if (e.target === modal) закрыть(); });
        /* Escape И Tab УШЛИ В ДОМ вместе с запиранием: своего слушателя на
           `document` у окна больше нет. */

        if (!bar) return;

        var finalVisible = false;
        if (final && 'IntersectionObserver' in window) {
            new IntersectionObserver(function(entries) {
                finalVisible = entries[0].isIntersecting;
                update();
            }, { threshold: 0.2 }).observe(final);
        }

        function update() {
            var scrolled = window.scrollY > window.innerHeight * 0.6;
            bar.classList.toggle('show', scrolled && !finalVisible);
        }

        window.addEventListener('scroll', update, { passive: true });
        update();
    });
})();
