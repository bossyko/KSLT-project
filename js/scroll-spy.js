// ============================================
// KSLT — Подсветка раздела при прокрутке главной
// ============================================
//
// На внутренних страницах пункт меню подсвечивает script.js: он смотрит на
// адрес страницы. На главной адрес один, а разделов восемь, и человек,
// пролистав до кортов, не понимает, где находится.
//
// Липкие заголовки для этого не годятся: секции главной короткие, от 0.4 до
// 1.3 экрана — заголовок повисел бы секунду и его вытолкнуло бы следующим.
// Плюс наверху уже закреплена шапка, а вторая полоса на телефоне съедает
// половину видимой области.
//
// Поэтому подсвечиваем прямо в меню: у пунктов уже нарисован вид .is-active
// с загорающейся точкой — им никто не пользовался, кроме подсветки страницы.

(function() {
    'use strict';

    // Какому пункту меню принадлежит какая секция. Пункт ищем по адресу
    // ссылки, чтобы не зависеть от языка страницы.
    var MAP = [
        { section: 'live',        match: '#live' },
        { section: 'tournaments', match: 'tournaments-overview' },
        { section: 'rankings',    match: 'players' },
        { section: 'players',     match: 'players' },
        { section: 'venues',      match: 'services' },
        { section: 'about',       match: 'info' }
    ];

    document.addEventListener('DOMContentLoaded', function() {
        var sections = [];
        MAP.forEach(function(m) {
            var el = document.getElementById(m.section);
            if (el) sections.push({ el: el, match: m.match });
        });
        // Не главная — здесь подсвечивать нечего
        if (sections.length < 3) return;

        /** Пункты меню, отвечающие за раздел: настольный и мобильный. */
        function itemsFor(match) {
            var found = [];
            document.querySelectorAll('.nav-item, .mobile-dropdown-toggle, .mobile-nav-links > li > a')
                .forEach(function(a) {
                    var href = a.getAttribute('href') || '';
                    if (href.indexOf(match) !== -1) found.push(a);
                });
            return found;
        }

        var groups = {};
        sections.forEach(function(s) {
            if (!groups[s.match]) groups[s.match] = itemsFor(s.match);
        });

        var current = null;

        function highlight(match) {
            if (match === current) return;
            current = match;
            Object.keys(groups).forEach(function(key) {
                groups[key].forEach(function(a) {
                    a.classList.toggle('is-active', key === match);
                });
            });
        }

        // Активной считаем секцию, пересекающую верхнюю треть экрана: туда
        // смотрит человек, а не в самый верх, закрытый шапкой.
        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(e) {
                if (!e.isIntersecting) return;
                var hit = sections.filter(function(s) { return s.el === e.target; })[0];
                if (hit) highlight(hit.match);
            });
        }, { rootMargin: '-20% 0px -70% 0px', threshold: 0 });

        sections.forEach(function(s) { observer.observe(s.el); });

        // Выше первой секции и ниже последней подсветку снимаем: на главном
        // экране и у спонсоров разделу соответствовать нечему.
        window.addEventListener('scroll', function() {
            if (window.scrollY < 120) highlight(null);
        }, { passive: true });
    });
})();
