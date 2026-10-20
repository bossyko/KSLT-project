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
    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    function render(box, list) {
        var html = '';

        list.forEach(function(s) {
            var inner = s.logo
                ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '" loading="lazy">'
                : '<span>' + esc(s.name) + '</span>';
            html += s.url
                ? '<a class="sn-logo filled" href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer">' + inner + '</a>'
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

        function фокусируемые() {
            return [].slice.call(modal.querySelectorAll(
                'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(function(э) { return э.offsetParent !== null; });
        }

        function открыть(кнопка) {
            ктоОткрыл = кнопка || null;
            modal.hidden = false;
            var поля = фокусируемые();
            if (поля.length) фокус(поля[0]);
        }

        function фокус(э) { try { э.focus(); } catch (e) {} }

        function закрыть() {
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
        document.addEventListener('keydown', function(e) {
            if (modal.hidden) return;
            if (e.key === 'Escape') { закрыть(); return; }
            /* ЛОВУШКА TAB: по кругу внутри окна, а не на страницу под ним */
            if (e.key !== 'Tab') return;
            var поля = фокусируемые();
            if (!поля.length) return;
            var первый = поля[0], последний = поля[поля.length - 1];
            if (e.shiftKey && document.activeElement === первый) {
                e.preventDefault(); фокус(последний);
            } else if (!e.shiftKey && document.activeElement === последний) {
                e.preventDefault(); фокус(первый);
            }
        });

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
