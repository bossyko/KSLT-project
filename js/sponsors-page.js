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

    /** Сколько мест показываем всего — заполненных и свободных вместе. */
    var SLOTS = 4;

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

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
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

        for (var i = list.length; i < SLOTS; i++) {
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

        document.querySelectorAll('[data-open-contacts]').forEach(function(b) {
            b.addEventListener('click', function() { modal.hidden = false; });
        });
        document.getElementById('snModalClose').addEventListener('click', function() { modal.hidden = true; });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.hidden = true; });
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && !modal.hidden) modal.hidden = true;
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
