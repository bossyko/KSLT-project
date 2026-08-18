// ============================================
// Карточка турнира — одна на весь сайт
// ============================================
//
// Карточек турнира в проекте было три: своя на главной, своя в обзоре и своя
// на странице категории. Две из них назывались одинаково (.tournament-card),
// а внутри были устроены по-разному — правка размера ломала одну из них.
//
// Здесь одна карточка и одно место, где живут состояние, счётчик и подписи.
// Дальше её подхватят обзор турниров и страница категории.
//
// window.KSLT_TCARD:
//   status(t)        — состояние турнира по датам
//   statusLabel(s)   — подпись состояния на языке страницы
//   countdown(t)     — счётчик, если до старта меньше 48 часов
//   render(t, opts)  — разметка карточки, opts.featured — большая
//   startTicker()    — оживить счётчики на странице (раз в секунду)

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var LOCALE = isEn ? 'en-US' : (isKg ? 'ky-KG' : 'ru-RU');

    var L = isEn ? {
        live: 'In progress', open: 'Registration open', soon: 'Upcoming',
        closed: 'Registration closed', done: 'Completed', cancelled: 'Cancelled',
        btnLive: 'View draw', btnOpen: 'Register', btnSoon: 'Details', btnDone: 'Results',
        participants: 'participants', cdPrefix: 'Starts in',
        d: 'd', h: 'h', m: 'm', s: 's'
    } : isKg ? {
        live: 'Жүрүп жатат', open: 'Каттоо ачык', soon: 'Жакында',
        closed: 'Каттоо жабык', done: 'Аяктады', cancelled: 'Жокко чыгарылды',
        btnLive: 'Торду көрүү', btnOpen: 'Катталуу', btnSoon: 'Толугураак', btnDone: 'Жыйынтыктар',
        participants: 'катышуучу', cdPrefix: 'Башталат',
        d: 'к', h: 'с', m: 'м', s: 'сек'
    } : {
        live: 'Идёт сейчас', open: 'Регистрация открыта', soon: 'Предстоящий',
        closed: 'Регистрация закрыта', done: 'Завершён', cancelled: 'Отменён',
        btnLive: 'Смотреть сетку', btnOpen: 'Регистрация', btnSoon: 'Подробнее', btnDone: 'Результаты',
        participants: 'участников', cdPrefix: 'Старт через',
        d: 'д', h: 'ч', m: 'м', s: 'с'
    };

    var PAGE = isEn ? 'tournament-en.html' : (isKg ? 'tournament-kg.html' : 'tournament.html');
    var BASE = window.location.pathname.indexOf('/pages/') !== -1 ? '' : 'pages/';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;');
    }

    function today() { return new Date().toISOString().substring(0, 10); }

    /**
     * Состояние турнира считаем по датам, а не по колонке status: колонку
     * кто-то должен переключать вручную, а даты меняются сами.
     * Отмену берём из колонки — её датами не вычислить.
     */
    function status(t) {
        if (t.status === 'cancelled') return 'cancelled';
        var now = today();
        if (t.date_end && now > t.date_end) return 'done';
        if (t.date_start && now >= t.date_start) return 'live';
        if (t.registration_start && t.registration_end &&
            now >= t.registration_start && now <= t.registration_end) return 'open';
        if (t.registration_end && now > t.registration_end) return 'closed';
        return 'soon';
    }

    function statusLabel(s) { return L[s] || L.soon; }

    function title(t) {
        return isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
    }

    /** Русская локаль дописывает « г.» после года — в карточке это мусор. */
    function trimYear(str) { return str.replace(/\s*г\.$/, ''); }

    function dateText(t) {
        if (!t.date_start) return '';
        var opts = { day: 'numeric', month: 'long', year: 'numeric' };
        var a = new Date(t.date_start + 'T00:00:00');
        if (!t.date_end || t.date_end === t.date_start) {
            return trimYear(a.toLocaleDateString(LOCALE, opts));
        }
        var b = new Date(t.date_end + 'T00:00:00');
        var sameMonth = a.getMonth() === b.getMonth() && a.getFullYear() === b.getFullYear();
        if (sameMonth) {
            return a.getDate() + '–' + trimYear(b.toLocaleDateString(LOCALE, opts));
        }
        return a.toLocaleDateString(LOCALE, { day: 'numeric', month: 'long' }) +
               ' – ' + trimYear(b.toLocaleDateString(LOCALE, opts));
    }

    /** Счётчик показываем только когда он что-то значит — за двое суток до старта. */
    function countdown(t) {
        if (!t.date_start) return '';
        var target = new Date(t.date_start + 'T' + (t.start_time || '00:00') + ':00');
        var diff = target.getTime() - Date.now();
        if (diff <= 0 || diff > 48 * 3600 * 1000) return '';
        return '<span class="tc-countdown" data-cd="' + t.date_start + 'T' +
               (t.start_time || '00:00') + '">' + countdownText(diff) + '</span>';
    }

    function countdownText(diff) {
        var d = Math.floor(diff / 86400000);
        var h = Math.floor((diff % 86400000) / 3600000);
        var m = Math.floor((diff % 3600000) / 60000);
        var s = Math.floor((diff % 60000) / 1000);
        var out = '<span class="tc-cd-label">' + L.cdPrefix + '</span>';
        if (d > 0) out += '<b>' + d + '<small>' + L.d + '</small></b>';
        out += '<b>' + String(h).padStart(2, '0') + '<small>' + L.h + '</small></b>';
        out += '<b>' + String(m).padStart(2, '0') + '<small>' + L.m + '</small></b>';
        out += '<b>' + String(s).padStart(2, '0') + '<small>' + L.s + '</small></b>';
        return out;
    }

    var _ticker = null;

    function startTicker() {
        if (_ticker) clearInterval(_ticker);
        _ticker = setInterval(function() {
            var nodes = document.querySelectorAll('.tc-countdown[data-cd]');
            if (!nodes.length) { clearInterval(_ticker); _ticker = null; return; }
            nodes.forEach(function(el) {
                var diff = new Date(el.getAttribute('data-cd') + ':00').getTime() - Date.now();
                if (diff <= 0) { el.remove(); return; }
                el.innerHTML = countdownText(diff);
                el.classList.toggle('tc-cd-urgent', diff < 3600000);
            });
        }, 1000);
    }

    function buttonFor(s) {
        if (s === 'live') return L.btnLive;
        if (s === 'open') return L.btnOpen;
        if (s === 'done') return L.btnDone;
        return L.btnSoon;
    }

    /**
     * Афиша может быть и горизонтальной, и вертикальной. Обрезать вертикальную
     * нельзя — на ней текст, ради которого её и рисовали. Поэтому вписываем
     * целиком, а поля достраиваем размытой копией её же.
     */
    function imageBlock(t, s) {
        var src = t.image || '';
        var inner = src
            ? '<img src="' + esc(src) + '" alt="" loading="lazy">'
            : '<div class="tc-noimage">🎾</div>';
        var style = src ? ' style="--tc-poster:url(&quot;' + esc(src) + '&quot;)"' : '';
        return '<div class="tc-image"' + style + '>' + inner +
               '<span class="tc-badge tc-badge-' + s + '">' + esc(statusLabel(s)) + '</span>' +
               '</div>';
    }

    function render(t, opts) {
        opts = opts || {};
        var s = status(t);
        var href = BASE + PAGE + '?id=' + encodeURIComponent(t.id);
        var meta = [];
        if (t.max_participants) meta.push('<span><strong>' + t.max_participants + '</strong> ' + L.participants + '</span>');
        if (t.location) meta.push('<span>' + esc(isEn ? (t.location_en || t.location) : t.location) + '</span>');

        var html = '<a class="tc' + (opts.featured ? ' tc-featured' : '') + '" href="' + href + '">' +
            imageBlock(t, s) +
            '<div class="tc-body">' +
                '<span class="tc-date">' + esc(dateText(t)) + '</span>' +
                countdown(t) +
                '<h3 class="tc-title">' + esc(title(t)) + '</h3>';

        if (opts.featured && t.description) {
            var d = isEn ? (t.description_en || t.description)
                         : (isKg ? (t.description_kg || t.description) : t.description);
            html += '<p class="tc-desc">' + esc(d) + '</p>';
        }
        if (meta.length) html += '<div class="tc-meta">' + meta.join('') + '</div>';
        if (opts.featured) html += '<span class="tc-btn">' + esc(buttonFor(s)) + '</span>';

        html += '</div></a>';
        return html;
    }

    window.KSLT_TCARD = {
        status: status,
        statusLabel: statusLabel,
        countdown: countdown,
        render: render,
        startTicker: startTicker,
        title: title,
        dateText: dateText
    };
})();
