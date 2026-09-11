// ============================================
// Большая карточка турнира — одна на весь сайт
// ============================================
//
// Раньше её собирали в двух местах: своя сборка на странице «Турниры» и своя
// на страницах категорий. Классы одинаковые, а состав разный — где-то мест
// осталось, где-то число пар, по-разному считался отсчёт. Правка в одном месте
// до другого не доезжала, и карточки постепенно разошлись.
//
// Здесь одна сборка и один отсчёт. Данные приходят готовыми: страница сама
// знает, как читать свой турнир, а карточка — как его показать.
//
// window.KSLT_TFEATURED:
//   отсчёт(dateSort, startTime, статус) — счётчик до старта или «идёт сейчас»
//   карточка(t)                        — разметка большой карточки
//
// t.боком = true — живой турнир показать карточкой с афишей сбоку (так на
// страницах категорий). Без этого рисуется карточка с афишей фоном.
//
// Поля t: id, href, name, image, status, statusText, date{day,month},
//         genderLabel, noRating, location, regLine, format, prize,
//         участники {label, value, tight}, взнос {value, title},
//         _rawStatus, _dateSort, _startTime, _gender

(function () {
    'use strict';

    var путь = window.location.pathname;
    var isEn = путь.indexOf('-en') !== -1;
    var isKg = путь.indexOf('-kg') !== -1;

    var L = isEn
        ? { details: 'Details', register: 'Register', noRating: 'No rating',
            live: 'IN PROGRESS', prefix: 'Starts in', days: 'd', hours: 'h', min: 'm', sec: 's' }
        : (isKg
            ? { details: 'Толугураак', register: 'Катталуу', noRating: 'Рейтингсиз',
                live: 'АЗЫР ЖҮРҮҮДӨ', prefix: 'Башталууга', days: 'к', hours: 'с', min: 'м', sec: 'сек' }
            : { details: 'Подробнее', register: 'Регистрация', noRating: 'Без рейтинга',
                live: 'ИДЁТ СЕЙЧАС', prefix: 'Старт через', days: 'д', hours: 'ч', min: 'м', sec: 'с' });

    var pinSvg = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" ' +
        'stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>' +
        '<circle cx="12" cy="10" r="3"/></svg>';

    function esc(s) {
        return String(s == null ? '' : s)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    /**
     * Отсчёт до старта. Показываем только за двое суток: раньше он не помогает,
     * а место занимает. Завершённым не рисуем совсем — у них дата в прошлом,
     * и «осталось меньше нуля» превращалось в «идёт сейчас».
     */
    function отсчёт(dateSort, startTime, статус) {
        if (!dateSort || статус === 'past') return '';
        var время = startTime || '00:00';
        var цель = new Date(dateSort + 'T' + время + ':00');
        var разница = цель.getTime() - Date.now();

        if (разница <= 0) {
            return '<span class="to-cd to-cd-live"><span class="to-cd-dot"></span>' + L.live + '</span>';
        }
        if (разница > 48 * 60 * 60 * 1000) return '';

        var д = Math.floor(разница / 86400000);
        var ч = Math.floor((разница % 86400000) / 3600000);
        var м = Math.floor((разница % 3600000) / 60000);
        var с = Math.floor((разница % 60000) / 1000);
        var срочно = разница < 3600000 ? ' to-cd-urgent' : '';

        var части = '<span class="to-cd-label">' + L.prefix + '</span>';
        if (д > 0) части += '<span class="to-cd-unit">' + д + '<small>' + L.days + '</small></span>';
        части += '<span class="to-cd-unit">' + String(ч).padStart(2, '0') + '<small>' + L.hours + '</small></span>';
        части += '<span class="to-cd-unit">' + String(м).padStart(2, '0') + '<small>' + L.min + '</small></span>';
        части += '<span class="to-cd-unit">' + String(с).padStart(2, '0') + '<small>' + L.sec + '</small></span>';

        return '<span class="to-cd' + срочно + '" data-cd-date="' + dateSort +
            '" data-cd-time="' + время + '">' + части + '</span>';
    }

    /** Строка подробностей. Пустое значение не показываем вовсе. */
    function строка(подпись, значение, класс, подсказка) {
        if (!значение) return '';
        return '<div class="to-featured-detail"' + (подсказка ? ' title="' + esc(подсказка) + '"' : '') + '>' +
            '<span class="to-label">' + esc(подпись) + '</span>' +
            '<span class="to-value' + (класс ? ' ' + класс : '') + '">' + значение + '</span></div>';
    }

    /**
     * Живой турнир показываем карточкой с афишей сбоку — той же, что на
     * главной: афиша целиком, справа дата, отсчёт, описание и кнопка. Так
     * карточка отвечает на вопросы «когда, где, успею ли записаться».
     *
     * Завершённым это не нужно: у них смотрят только имя и итог, а афиша
     * на весь блок занимала бы пол-экрана впустую.
     */
    function боком(t) {
        var TC = window.KSLT_TCARD;
        // Только там, где страница сама попросила: на «Турнирах» все разряды
        // должны выглядеть одинаково, и вытянутая афиша ломала бы ряд
        if (!t.боком || !TC || !t._row || t.status === 'past') return '';
        return '<div class="to-featured-side">' +
            TC.render(t._row, { featured: true, taken: t._taken }) +
        '</div>';
    }

    function карточка(t) {
        var сбоку = боком(t);
        if (сбоку) return сбоку;

        var фон = t.image || '';
        var участники = t.участники || null;
        var взнос = t.взнос || null;

        return '<div class="to-featured" data-status="' + esc(t.status) + '"' +
            ' data-gender="' + esc(t._gender || 'all') + '" data-href="' + esc(t.href) + '">' +
            (фон
                ? '<div class="to-featured-bg"><img src="' + esc(фон) + '" alt="" loading="lazy"></div>' +
                  '<div class="to-featured-overlay"></div>'
                : '<div class="to-featured-overlay" style="background:var(--bg-card)"></div>') +
            '<div class="to-featured-content">' +
                '<div>' +
                    '<span class="to-featured-date">' +
                        '<span class="to-day">' + esc(t.date.day) + '</span>' +
                        '<span class="to-month">' + esc(t.date.month) + '</span></span>' +
                    (t.genderLabel ? '<span class="to-gender-badge">' + esc(t.genderLabel) + '</span>' : '') +
                    (t.noRating ? '<span class="to-norating-badge">' + L.noRating + '</span>' : '') +
                '</div>' +
                отсчёт(t._dateSort, t._startTime, t.status) +
                '<span class="to-featured-status ' + esc(t.status) + '">' + esc(t.statusText) + '</span>' +
                '<h3>' + esc(t.name) + '</h3>' +
                (t.location ? '<div class="to-featured-meta"><span>' + pinSvg + ' ' + esc(t.location) + '</span></div>' : '') +
                '<div class="to-featured-details">' +
                    строка(t.регПодпись, t.regLine ? esc(t.regLine) : '') +
                    строка(t.форматПодпись, t.format ? esc(t.format) : '') +
                    (участники
                        ? строка(участники.label, esc(участники.value), участники.tight ? 'to-slots-tight' : '')
                        : '') +
                    строка(t.призПодпись, t.prize ? esc(t.prize) : '', 'prize') +
                    (взнос ? строка(t.взносПодпись, esc(взнос.value), 'to-fee', взнос.title) : '') +
                '</div>' +
                '<div class="to-featured-actions">' +
                    '<span class="to-featured-link">' + L.details + '</span>' +
                    (t._rawStatus === 'registration_open'
                        ? '<button class="btn-register to-register" data-tid="' + esc(t.id) + '">' + L.register + '</button>'
                        : '') +
                '</div>' +
            '</div>' +
        '</div>';
    }

    window.KSLT_TFEATURED = {
        отсчёт: отсчёт,
        карточка: карточка
    };
})();
