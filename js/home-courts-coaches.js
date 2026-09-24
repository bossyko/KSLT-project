// ============================================
// Главная — блок «Где играть и у кого учиться»
// ============================================
//
// Раньше это были два раздела по три карточки, и каждый собирался своим
// куском кода прямо в разметке страницы — по двести строк на каждом из трёх
// языков. Здесь одно место на оба ряда и на все языки.
//
// Кто попадает на главную.
//
// Партнёр не выпадает никогда: у кого в базе стоит признак партнёра, тот на
// главной есть всегда. Меняется только место в ряду — порядок при каждой
// загрузке свой, чтобы первый слева не доставался одному и тому же.
//
// Свободные места занимают остальные, случайным набором. Так на главную со
// временем попадают все, а не только первые по алфавиту.
//
// Если партнёров больше, чем мест, разыгрываются уже они между собой. Иначе
// шестой партнёр не появился бы на главной никогда, а платят все одинаково.

(function() {
    'use strict';

    var client = window.supabaseClient;
    if (!client) return;

    var section = document.getElementById('venues');
    if (!section) return;

    var SLOTS = 4;   // по четыре в ряд

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    // Фотографий у кортов и тренеров пока нет: реестр собирали из 2ГИС и
    // гидов. Без запасной картинки на месте снимка зияла пустая рамка
    var COURT_PHOTO = 'images/heroes/courts.jpg';
    var COACH_PHOTO = 'images/heroes/coaches.jpg';

    // Три ступени, решение Кости 24.09: своё фото → заглушка по покрытию →
    // общая картинка. Файлов покрытий пока нет, поэтому у <img> стоит onerror:
    // пока их не положили, карточка молча падает на общую, а не на битую рамку
    var SURFACE_PHOTO = {
        clay:   'images/courts/surface-clay.jpg',
        hard:   'images/courts/surface-hard.jpg',
        grass:  'images/courts/surface-grass.jpg',
        carpet: 'images/courts/surface-carpet.jpg',
        indoor: 'images/courts/surface-indoor.jpg'
    };

    function courtPhoto(row, ct) {
        if (row.photo) return row.photo;
        var s = (ct && ct[0] && ct[0].surface) || '';
        return SURFACE_PHOTO[s] || COURT_PHOTO;
    }

    var FALLBACK = ' onerror="this.onerror=null;this.src=\'' + COURT_PHOTO + '\'"';


    var L = isEn ? {
        partner: 'KSLT partner', discount: 'Discount for KSLT members',
        details: 'Details', courts: 'courts', years: 'yrs',
        from: 'from', perHour: 'som/h',
        surface: { hard: 'Hard', clay: 'Clay', carpet: 'Carpet' },
        emptyCourts: 'Courts appear here as soon as they join the KSLT registry',
        emptyCoaches: 'Coaches appear here as soon as they join the KSLT registry',
        failed: 'Could not load this row — please refresh the page'
    } : (isKg ? {
        partner: 'КСЛТ өнөктөшү', discount: 'КСЛТ мүчөлөрүнө арзандатуу',
        details: 'Толугураак', courts: 'корт', years: 'жыл',
        from: '', perHour: 'сом/саат',
        surface: { hard: 'Хард', clay: 'Топурак', carpet: 'Килем' },
        emptyCourts: 'Корттор КСЛТ реестрине кошулганда ушул жерде көрүнөт',
        emptyCoaches: 'Машыктыруучулар КСЛТ реестрине кошулганда ушул жерде көрүнөт',
        failed: 'Жүктөлгөн жок — баракты жаңыртыңыз'
    } : {
        partner: 'Партнёр КСЛТ', discount: 'Скидка членам КСЛТ',
        details: 'Подробнее', courts: 'кортов', years: 'лет',
        from: 'от', perHour: 'сом/час',
        surface: { hard: 'Хард', clay: 'Грунт', carpet: 'Ковёр' },
        emptyCourts: 'Корты появятся здесь, как только попадут в реестр КСЛТ',
        emptyCoaches: 'Тренеры появятся здесь, как только попадут в реестр КСЛТ',
        failed: 'Не удалось загрузить ряд — обновите страницу'
    });

    var page = function(name) {
        return 'pages/' + name + (isEn ? '-en' : (isKg ? '-kg' : '')) + '.html';
    };

    start();

    async function start() {
        var courts = await load('courts');
        var coaches = await load('coaches');

        fill('venuesCourts', pick(courts).map(courtCard).join(''), courts, 'courts');
        fill('venuesCoaches', pick(coaches).map(coachCard).join(''), coaches, 'coaches');
    }

    async function load(table) {
        try {
            var res = await client.from(table).select('*');
            if (res.error) {
                console.error('[KSLT] ' + table + ' не загружены:', res.error.message || res.error);
                return null;
            }
            return res.data || [];
        } catch (e) {
            console.error('[KSLT] ' + table + ':', e);
            return null;
        }
    }

    /**
     * Пустой ряд и сбой запроса — разные вещи, и выглядеть они должны
     * по-разному. У сбоя ряд остаётся с сообщением, а не тихо исчезает.
     */
    function fill(id, html, data, kind) {
        var grid = document.getElementById(id);
        if (!grid) return;
        var empty = kind === 'coaches' ? L.emptyCoaches : L.emptyCourts;
        if (data === null) {
            grid.innerHTML = '<div class="vn-notice">' + L.failed + '</div>';
            return;
        }
        grid.innerHTML = html || '<div class="vn-notice">' + empty + '</div>';
    }

    /**
     * Кто попадёт в ряд: сначала партнёры, потом остальные на свободные
     * места. И те, и другие — в случайном порядке.
     */
    function pick(rows) {
        if (!rows || !rows.length) return [];
        var partners = shuffle(rows.filter(function(r) { return !!r.partner; }));
        var rest = shuffle(rows.filter(function(r) { return !r.partner; }));
        return partners.concat(rest).slice(0, SLOTS);
    }

    function shuffle(arr) {
        var a = arr.slice();
        for (var i = a.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var t = a[i]; a[i] = a[j]; a[j] = t;
        }
        return a;
    }

    function badge(row) {
        return row.partner ? '<span class="vn-partner">' + esc(L.partner) + '</span>' : '';
    }

    function discount(row) {
        return row.partner ? '<span class="vn-discount">' + esc(L.discount) + '</span>' : '';
    }

    function localized(row, field) {
        if (isEn && row[field + '_en']) return row[field + '_en'];
        if (isKg && row[field + '_kg']) return row[field + '_kg'];
        return row[field] || '';
    }

    function courtCard(row) {
        var ct = row.court_types || [];
        var surfaces = [];
        var total = 0;
        var minPrice = 0;
        ct.forEach(function(c) {
            var s = L.surface[c.surface] || c.surface;
            if (s && surfaces.indexOf(s) === -1) surfaces.push(s);
            total += (c.count || 0);
            var pr = parseFloat(c.price);
            if (pr && (!minPrice || pr < minPrice)) minPrice = pr;
        });

        // Висячая точка: при пустом покрытии строка начиналась с « · 1 кортов».
        // УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ: склеиваем только то, что есть
        var части = [];
        if (surfaces.length) части.push(surfaces.join(', '));
        if (total) части.push(total + ' ' + L.courts);
        var line = части.join(' · ');
        var city = localized(row, 'city') || '';
        var href = page('court') + '?id=' + encodeURIComponent(row.id);

        var price = minPrice ? (L.from + ' ' + minPrice + ' ' + L.perHour).trim() : '';

        return '<a class="court-card" href="' + href + '">' +
            '<img src="' + esc(courtPhoto(row, ct)) + '" alt="' + esc(localized(row, 'name')) + '" loading="lazy"' + FALLBACK + '>' +
            '<div class="court-info">' +
                badge(row) +
                '<h4>' + esc(localized(row, 'name')) + '</h4>' +
                (line ? '<span class="court-surface">' + esc(line) + '</span>' : '') +
                (city ? '<span>📍 ' + esc(city) + '</span>' : '') +
                discount(row) +
                foot(price) +
            '</div>' +
        '</a>';
    }

    function coachCard(row) {
        var name = ((localized(row, 'last_name') || '') + ' ' +
                    (localized(row, 'first_name') || '')).trim() || localized(row, 'name');
        var exp = row.experience ? row.experience + ' ' + L.years : '';
        var price = row.price ? L.from + ' ' + row.price + ' ' + L.perHour : '';
        var href = page('coach') + '?id=' + encodeURIComponent(row.id);

        return '<a class="coach-card" href="' + href + '">' +
            '<img class="coach-photo" src="' + esc(row.photo || COACH_PHOTO) + '" alt="' + esc(name) + '" loading="lazy">' +
            '<div class="coach-info">' +
                badge(row) +
                '<h4>' + esc(name) + '</h4>' +
                (localized(row, 'position') ? '<span class="coach-speciality">' + esc(localized(row, 'position')) + '</span>' : '') +
                (exp ? '<span class="coach-experience">' + esc(exp) + '</span>' : '') +
                discount(row) +
                foot(price) +
            '</div>' +
        '</a>';
    }

    /**
     * Нижняя строка карточки: цена слева, метка перехода справа, прижата к низу.
     * Метка скрыта от диктора: карточка и так ссылка, и диктор читает её целиком.
     */
    function foot(price) {
        return '<div class="vn-foot">' +
            (price ? '<span class="coach-price">' + esc(price) + '</span>' : '<span></span>') +
            '<span class="vn-go" aria-hidden="true">\u2192</span>' +
        '</div>';
    }

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;')
            .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }
})();
