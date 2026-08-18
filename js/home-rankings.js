// ============================================
// Главная — блок «Топ рейтинга»
// ============================================
//
// Данные берём оттуда же, откуда их берёт страница рейтинга: общий модуль
// js/rankings-data.js. Пересчитался рейтинг после турнира — на главной он
// изменится сам.
//
// Раньше здесь лежали восемьдесят две строки, вписанные в разметку руками:
// выдуманные имена, выдуманные очки, чужие фотографии.
//
// Гостю показываем пять строк чётко и три в тумане, поверх — карточка входа.
// Правило то же, что на странице рейтинга: видно, что рейтинг длиннее.

(function() {
    'use strict';

    var section = document.getElementById('rankings');
    if (!section) return;

    var ROWS = 8;          // строк в каждой категории
    var GUEST_CLEAR = 5;   // гостю чётко видны первые пять

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn
        ? { rank: '#', player: 'Player', country: 'Ctry', ntrp: 'NTRP', wl: 'W/L', points: 'Pts', change: 'Δ', empty: 'No players in this category yet' }
        : (isKg
            ? { rank: '#', player: 'Оюнчу', country: 'Өлк.', ntrp: 'NTRP', wl: 'Ж/Ж', points: 'Упай', change: 'Δ', empty: 'Бул категорияда оюнчулар жок' }
            : { rank: '#', player: 'Игрок', country: 'Стр.', ntrp: 'NTRP', wl: 'В/П', points: 'Очки', change: 'Δ', empty: 'В этой категории пока нет игроков' });

    var playerPage = isEn ? 'pages/player-en.html' : (isKg ? 'pages/player-kg.html' : 'pages/player.html');

    start();

    async function start() {
        if (!window.KSLT_RANKINGS) return;

        var data = null;
        try {
            data = await window.KSLT_RANKINGS.load();
        } catch (e) {
            console.error('[KSLT] рейтинг на главной не загружен:', e);
        }

        if (!data) {
            // База молчит — панели останутся пустыми, но заголовок раздела
            // и ссылка «Полный рейтинг» на месте, а не дыра в странице
            section.querySelectorAll('.rankings-panel').forEach(function(panel) {
                panel.innerHTML = '<div class="rk-empty">' + L.empty + '</div>';
            });
            return;
        }

        var guest = isGuest();

        section.querySelectorAll('.rankings-panel').forEach(function(panel) {
            var cat = data[panel.id];
            var list = (cat && cat.players) || [];
            panel.innerHTML = list.length ? table(list, guest)
                                          : '<div class="rk-empty">' + L.empty + '</div>';
        });
    }

    function isGuest() {
        try {
            var raw = localStorage.getItem('sb-qqkzszesviukopgjbead-auth-token');
            if (!raw) return true;
            var s = JSON.parse(raw);
            return !(s && s.access_token && s.expires_at > Math.floor(Date.now() / 1000));
        } catch (e) { return true; }
    }

    function table(list, guest) {
        var html = '<div class="rk-row rk-head">' +
            '<span class="rk-rank">' + L.rank + '</span>' +
            '<span>' + L.player + '</span>' +
            '<span class="rk-country">' + L.country + '</span>' +
            '<span class="rk-ntrp">' + L.ntrp + '</span>' +
            '<span class="rk-wl">' + L.wl + '</span>' +
            '<span class="rk-points">' + L.points + '</span>' +
            '<span class="rk-change">' + L.change + '</span>' +
        '</div>';

        for (var i = 0; i < Math.min(list.length, ROWS); i++) {
            html += row(list[i], i, guest);
        }
        return html;
    }

    function row(p, i, guest) {
        var blur = '';
        if (guest && i >= GUEST_CLEAR) {
            blur = ' rk-blur-' + Math.min(i - GUEST_CLEAR + 1, 2);
        }

        var ch = p.change || 0;
        var chHtml = ch > 0 ? '<span class="rk-up">+' + ch + '</span>'
                   : (ch < 0 ? '<span class="rk-down">' + ch + '</span>'
                             : '<span class="rk-same">—</span>');

        var ntrp = p.ntrp_rating
            ? (Math.round(Number(p.ntrp_rating) / 0.25) * 0.25).toFixed(2).replace(/0$/, '')
            : '—';

        // Гостю имя не ссылка: страница игрока ему всё равно закрыта
        var name = guest
            ? '<span>' + esc(p.name) + '</span>'
            : '<a href="' + playerPage + '?id=' + encodeURIComponent(p.id) + '">' + esc(p.name) + '</a>';

        return '<div class="rk-row' + blur + '">' +
            '<span class="rk-rank' + (i < 3 ? ' top' : '') + '">' + (i + 1) + '</span>' +
            '<div class="rk-player">' +
                '<img src="' + esc(p.photo) + '" alt="" loading="lazy">' + name +
            '</div>' +
            '<span class="rk-country">' + esc(p.country) + '</span>' +
            '<span class="rk-ntrp">' + ntrp + '</span>' +
            '<span class="rk-wl">' + (p.wins || 0) + '/' + (p.losses || 0) + '</span>' +
            '<span class="rk-points">' + Number(p.points || 0).toLocaleString('ru-RU') + '</span>' +
            '<span class="rk-change">' + chHtml + '</span>' +
        '</div>';
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
