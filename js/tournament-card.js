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

    var isEn = KSLT_YAZYK.en;
    /* ЛОКАЛЬ — ДОМ ЯЗЫКА (кусок 147). */
    var LOCALE = KSLT_YAZYK.локаль;

    var L = KSLT_YAZYK.выбрать({
        live: 'In progress', open: 'Registration open', soon: 'Upcoming',
        closed: 'Registration closed', done: 'Completed', cancelled: 'Cancelled',
        btnLive: 'View draw', btnOpen: 'Register', btnSoon: 'Details', btnDone: 'Results',
        participants: 'participants'
    }, {
        live: 'Жүрүп жатат', open: 'Каттоо ачык', soon: 'Жакында',
        closed: 'Каттоо жабык', done: 'Аяктады', cancelled: 'Жокко чыгарылды',
        btnLive: 'Торду көрүү', btnOpen: 'Катталуу', btnSoon: 'Толугураак', btnDone: 'Жыйынтыктар',
        participants: 'катышуучу'
    }, {
        live: 'Идёт сейчас', open: 'Регистрация открыта', soon: 'Предстоящий',
        closed: 'Регистрация закрыта', done: 'Завершён', cancelled: 'Отменён',
        btnLive: 'Смотреть сетку', btnOpen: 'Регистрация', btnSoon: 'Подробнее', btnDone: 'Результаты',
        participants: 'участников'
    });

    var PAGE = KSLT_YAZYK.выбрать('tournament-en.html', 'tournament-kg.html', 'tournament.html');
    var BASE = window.location.pathname.indexOf('/pages/') !== -1 ? '' : 'pages/';

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
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
        return KSLT_YAZYK.выбрать(t.title_en || t.title, t.title_kg || t.title, t.title);
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

    /** ОТСЧЁТ И ТИКЕР — В ДОМЕ (кусок 163).
     *
     * Здесь было три тела: `countdown`, `countdownText` 12 строк и свой
     * тикер. Записанное число говорило «тикеров три» — ЭТОТ в записи не
     * числился, его назвал прибор.
     *
     * СВОЯ СЕМЬЯ КЛАССОВ (`tc-countdown` / `tc-cd-*`) и своё поведение по
     * истечении (узел снимается) уходят ДОВОДОМ, поэтому css не правится.
     *
     * СВОИХ СЛОВ У КАРТОЧКИ БОЛЬШЕ НЕТ. Довод `слова` я заводил ради пяти
     * её ключей, и замер показал: различалось ОДНО слово — кыргызская
     * приставка, «Башталат» против «Башталууга». Довод при этом терялся на
     * первом же тике: тикер один, слова зовущего ему негде взять, и надпись
     * меняла написание через секунду. Два перевода одного понятия — беда, а
     * не разница назначения, поэтому словарь отсчёта теперь ОДИН, в доме, а
     * приставка на этой странице стала «Башталууга», как на трёх остальных.
     * ВИДИМЫЙ ТЕКСТ ИЗМЕНИЛСЯ — это ПРЕДПОЛОЖЕНИЕ, вынесено Косте снимком.
     *
     * СТРУКТУРА ЕДИНИЦ СВЕДЕНА К `<span class="tc-cd-unit">` вместо `<b>` —
     * слово Кости 25.10. Вид при этом НЕ меняется: css не стилизует `b`
     * отдельно, жирность приходит от `.tc-countdown`, а правил `.tc-cd-unit`
     * нет вовсе — прочитано в `css/style.css:5957-5990`, а не угадано.
     */
    function countdown(t) {
        if (!t.date_start) return '';
        return window.KSLT_TFEATURED.отсчёт(t.date_start, t.start_time, null, { семья: 'tc' });
    }

    function startTicker() { window.KSLT_TFEATURED.пустить(); }

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
            ? '<img src="' + KSLT_экранировать(src) + '" alt="" loading="lazy">'
            : '<div class="tc-noimage">🎾</div>';
        var style = src ? ' style="--tc-poster:url(&quot;' + KSLT_экранировать(src) + '&quot;)"' : '';
        return '<div class="tc-image"' + style + '>' + inner +
               '<span class="tc-badge tc-badge-' + s + '">' + KSLT_экранировать(statusLabel(s)) + '</span>' +
               '</div>';
    }

    function render(t, opts) {
        opts = opts || {};
        var s = status(t);
        var href = BASE + PAGE + '?id=' + encodeURIComponent(t.id);
        var meta = [];
        // Свободные места считает общий модуль — тот же, что на страницах
        // категорий и на самой странице турнира, чтобы цифры не разошлись
        var slots = window.KSLT_SLOTS && window.KSLT_SLOTS.line(t, opts.taken, s);
        if (slots) meta.push('<span class="tc-slots' + (slots.tight ? ' tc-slots-tight' : '') + '">' + KSLT_экранировать(slots.text) + '</span>');
        if (t.location) meta.push('<span>' + KSLT_экранировать(KSLT_YAZYK.выбрать(t.location_en || t.location, t.location_kg || t.location, t.location)) + '</span>');

        // Завершённые и отменённые приглушаем: живое должно тянуть взгляд
        // первым, а архив — не спорить за внимание
        var тускло = (s === 'done' || s === 'cancelled') ? ' tc-past' : '';
        var html = '<a class="tc' + (opts.featured ? ' tc-featured' : '') + тускло + '" href="' + href + '">' +
            imageBlock(t, s) +
            '<div class="tc-body">' +
                '<span class="tc-date">' + KSLT_экранировать(dateText(t)) + '</span>' +
                countdown(t) +
                '<h3 class="tc-title">' + KSLT_экранировать(title(t)) + '</h3>';

        if (opts.featured && t.description) {
            var d = KSLT_YAZYK.выбрать(t.description_en || t.description, t.description_kg || t.description, t.description);
            html += '<p class="tc-desc">' + KSLT_экранировать(d) + '</p>';
        }
        if (meta.length) html += '<div class="tc-meta">' + meta.join('') + '</div>';

        // Записаться можно с любой карточки, а не только с главной в блоке:
        // рядом стояли две карточки открытых турниров, и кнопка была у одной
        var парный = t.format === 'doubles' || t.format === 'mixed_doubles';
        if (s === 'open') {
            html += '<button type="button" class="tc-btn btn-register to-register" data-tid="' +
                KSLT_экранировать(t.id) + '"' + (парный ? ' data-doubles="1"' : '') + '>' +
                KSLT_экранировать(L.btnOpen) + '</button>';
        } else {
            // Кнопка у каждой карточки, а не только у главной: рядом стояли два
            // идущих турнира, и «Смотреть сетку» было лишь у одного
            html += '<span class="tc-btn">' + KSLT_экранировать(buttonFor(s)) + '</span>';
        }

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
