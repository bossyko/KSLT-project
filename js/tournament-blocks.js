// ============================================
// KSLT — Карточки турнира: одна разметка на весь сайт
// ============================================
//
// Крупная карточка и полоса рисовались в двух местах: на «Турнирах» —
// в tournaments-overview.js, на страницах категорий — своя, старая, из
// прототипа. Из-за этого один и тот же турнир выглядел по-разному, а
// пустые поля (призовой фонд, которого нет) на старой карточке всё равно
// занимали колонку с прочерком.
//
// Здесь живёт разметка и обратный отсчёт. Данные к ней готовят вызывающие:
// им нужен объект с полями id, name, date {day, month}, status, statusText,
// location, format, participants, prize, genderLabel, regLine, image,
// _dateSort, _startTime, _rawStatus, _rawFormat, noRating.

(function() {
    'use strict';

    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;

    var L = KSLT_YAZYK.выбрать({
        details: 'Details', register: 'Register', format: 'Format',
        participants: 'Players', pairs: 'Pairs', prize: 'Prize',
        reg: 'Reg', noRating: 'Unranked',
        fee: 'Fee', feeMember: 'KSLT members', feeGuest: 'non-members',
        perPair: 'per player', som: 'som'
    }, {
        details: 'Толугураак', register: 'Каттоо', format: 'Формат',
        participants: 'Катышуучулар', pairs: 'Жуптар', prize: 'Сыйлык',
        reg: 'Кат', noRating: 'Рейтингсиз',
        fee: 'Взнос', feeMember: 'КСЛТ мүчөлөрүнө', feeGuest: 'калгандарга',
        perPair: 'оюнчудан', som: 'сом'
    }, {
        details: 'Подробнее', register: 'Регистрация', format: 'Формат',
        participants: 'Участники', pairs: 'Пар', prize: 'Призовой',
        reg: 'Рег', noRating: 'Без рейтинга',
        fee: 'Взнос', feeMember: 'членам КСЛТ', feeGuest: 'остальным',
        perPair: 'с участника', som: 'сом'
    });

    var CL = KSLT_YAZYK.выбрать({ days: 'd', hours: 'h', min: 'm', sec: 's', live: 'LIVE NOW', prefix: 'STARTS IN' }, { days: 'к', hours: 'с', min: 'м', sec: 'с', live: 'ТҮЗ ЭФИР', prefix: 'БАШТАЛАТ' }, { days: 'д', hours: 'ч', min: 'м', sec: 'с', live: 'ИДЁТ СЕЙЧАС', prefix: 'СТАРТ ЧЕРЕЗ' });

    var detailPage = KSLT_YAZYK.выбрать('tournament-en.html', 'tournament-kg.html', 'tournament.html');


    // ---- Обратный отсчёт ----------------------------------------------

    var _timer = null;





    // ---- Разметка ------------------------------------------------------

    /** Строка «ярлык — значение». Пустое поле не рисуем вовсе: прочерк
     *  в колонке «Призовой» выглядит так, будто данные потерялись. */
    function detail(label, value, cls) {
        if (!value) return '';
        return '<div class="to-featured-detail"><span class="to-label">' + label + '</span>' +
            '<span class="to-value' + (cls ? ' ' + cls : '') + '">' + value + '</span></div>';
    }

    /** «1500» → «1 500»: пробел между тысячами, иначе сумма читается с трудом */
    function money(n) {
        return String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0');
    }

    /**
     * Взнос на карточке. Две суммы, если заведены обе; одна, если админ
     * задал только её; ничего, если не задал ни одной — про деньги молчим,
     * как и про призовой фонд, которого нет.
     */
    function feeValue(t) {
        var m = t.feeMember, g = t.feeGuest;
        if (m == null && g == null) return '';
        if (m != null && g != null && m !== g) return money(m) + ' / ' + money(g);
        return money(m != null ? m : g);
    }

    function feeTitle(t) {
        var m = t.feeMember, g = t.feeGuest;
        var pair = (t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles') ? ' (' + L.perPair + ')' : '';
        if (m != null && g != null && m !== g) {
            return money(m) + ' ' + L.som + ' — ' + L.feeMember + ', ' + money(g) + ' ' + L.som + ' — ' + L.feeGuest + pair;
        }
        var one = m != null ? m : g;
        return one == null ? '' : money(one) + ' ' + L.som + pair;
    }

    function playersLabel(t) {
        return (t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles') ? L.pairs : L.participants;
    }



    /** Крупная карточка: ближайший турнир блока */
    function featured(t, bgImage) {
        // Та же карточка, что на странице «Турниры»: разметку собирает общий
        // модуль, а страница только готовит данные под неё
        var F = window.KSLT_TFEATURED;
        var взнос = feeValue(t);
        return F.карточка({
            id: t.id,
            href: detailPage + '?id=' + t.id,
            name: t.name,
            image: bgImage || t.image || '',
            status: t.status,
            statusText: t.statusText,
            date: t.date,
            genderLabel: t.genderLabel,
            noRating: t.noRating,
            location: t.location,
            regLine: t.regLine,
            format: t.format,
            prize: t.prize,
            участники: t.participants ? { label: playersLabel(t), value: t.participants } : null,
            взнос: взнос ? { value: взнос, title: feeTitle(t) } : null,
            регПодпись: L.reg,
            форматПодпись: L.format,
            призПодпись: L.prize,
            взносПодпись: L.fee,
            _rawStatus: t._rawStatus,
            _dateSort: t._dateSort,
            _startTime: t._startTime,
            _gender: t._gender,
            _row: t._row,
            _taken: t._taken,
            // На страницах категорий живой турнир показываем афишей сбоку:
            // здесь его читают перед регистрацией, и детали важнее картинки
            боком: true
        });
    }

    /** Полоса: всё, что не первое в блоке, и весь архив */
    /**
     * ПОЛОСА — ОДНО ТЕЛО, И ОНО В ДОМЕ `KSLT_TFEATURED` (кусок 162).
     *
     * Здесь было 61 строка разметки, слово в слово повторённая в
     * `tournaments-overview.renderCompact` (65 строк). Общих блоков 13 из 14,
     * css один — ВИД БЫЛ ОДИН, А ТЕЛА ДВА, и беда с адресом афиши в куске
     * 158 родилась ровно на этом шве. Различия ушли ДОВОДАМИ.
     *
     * ДОМ ВЫБРАН ЦЕНОЙ ТЕГОВ: `tournament-featured.js` стоит на всех шести
     * страницах турниров, этот файл — только на трёх. Ноль новых тегов.
     */
    function compact(t, extraAttrs) {
        return window.KSLT_TFEATURED.полоса(t, {
            href: detailPage + '?id=' + t.id,
            атрибуты: ' data-status="' + t.status + '" data-gender="' +
                (t._gender || 'all') + '"' + (extraAttrs || '')
        });
    }

    /**
     * Блок целиком: первая карточка крупно слева, остальные полосами
     * справа — та же раскладка, что на странице «Турниры».
     */
    /**
     * ЯЧЕЙКА-КОНТЕЙНЕР ДЛЯ КАРТОЧКИ — одно определение на обе страницы.
     *
     * Карточка перестраивается по СВОЕЙ ширине, а не по ширине окна: приём
     * уже стоит в css — `@container (max-width: 480px)` снимает афишу и
     * сводит карточку в одну колонку. Но запросу нужен ОБЪЯВЛЕННЫЙ
     * контейнер, а он был только у слота обзорной. На странице категории
     * карточки лежали прямо в сетке, и сравнивать было не с чем: прогон
     * 05.10 на ТЕСТОВОЙ базе поймал карточку 355 шириной, у которой 144
     * занимал слот афиши, 104 — колонка статуса, а названию оставалось
     * СЕМНАДЦАТЬ пикселей.
     *
     * На боевой базе в том же виде карточка 734, и беды не видно:
     * БАЗА ЗАМЕРА РЕШАЕТ, ЧТО ВИДНО.
     */
    function ячейка(разметка) {
        return '<div class="to-card-slot">' + разметка + '</div>';
    }

    function grid(items, bgImage) {
        if (!items || !items.length) return '';
        var html = featured(items[0], bgImage);
        if (items.length > 1) {
            html += '<div class="to-side-stack">' +
                /* Каждой полосе — своя ячейка-контейнер. Число детей у
                   столба не меняется, поэтому проверка «слоты:N» считает то
                   же самое. */
                items.slice(1).map(function(t) { return ячейка(compact(t)); }).join('') +
            '</div>';
        }
        return html;
    }

    /** Клик по всей карточке, а не только по надписи «Подробнее» */
    function bindLinks(root) {
        (root || document).querySelectorAll('[data-href]').forEach(function(el) {
            if (el._hrefBound) return;
            el._hrefBound = true;
            el.addEventListener('click', function(e) {
                if (e.target.closest('.btn-register, .btn-calendar')) return;
                window.location.href = this.dataset.href;
            });
        });
    }


    /**
     * Окно парной заявки для кнопки в карточке. Данные турнира и имя игрока
     * подтягиваем на месте: карточка знает только его номер.
     */
    async function открытьПарнуюЗаявку(btn) {
        var client = window.supabaseClient || (typeof supabase !== 'undefined' && window.SUPABASE_URL
            ? supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null);
        if (!client || !window.KSLT_DOUBLES) return;

        var сессия = await client.auth.getSession();
        if (!сессия.data.session) {
            if (window.KSLT_REG && window.KSLT_REG.предложитьВойти) {
                window.KSLT_REG.предложитьВойти(isEn, isKg);
            }
            return;
        }

        var профиль = await client.from('profiles')
            .select('full_name, player_id').eq('id', сессия.data.session.user.id).single();
        var турнир = await client.from('tournaments')
            .select('id, title, title_en, title_kg, format, gender, ntrp_combined_max').eq('id', btn.dataset.tid).single();
        if (!турнир.data) return;

        window.KSLT_DOUBLES.открыть({
            client: client,
            tournament: турнир.data,
            playerId: профиль.data ? профиль.data.player_id : null,
            playerName: профиль.data ? профиль.data.full_name : '',
            onDone: function(info) {
                if (info && info.created && window.KSLT_REG) window.KSLT_REG.markRegistered(client);
            }
        });
    }

    /** Запись на турнир прямо из карточки. Решение принимает Edge Function */
    function initRegister() {
        if (initRegister._done) return;
        initRegister._done = true;
        document.addEventListener('click', function(e) {
            var btn = e.target.closest('.to-register');
            if (!btn) return;
            e.preventDefault();
            e.stopPropagation();          // карточка кликабельна целиком

            // Парный: открываем окно выбора напарника прямо здесь — уводить
            // человека на страницу турнира ради одной кнопки незачем
            if (btn.dataset.doubles) {
                открытьПарнуюЗаявку(btn);
                return;
            }

            var client = window.supabaseClient;
            if (!window.KSLT_REG || !client) return;

            var wasLabel = btn.textContent;
            btn.disabled = true;
            btn.textContent = KSLT_YAZYK.выбрать('Sending...', 'Жөнөтүлүүдө...', 'Отправка...');

            window.KSLT_REG.submit(client, btn.dataset.tid, { isEn: isEn, isKg: isKg }).then(function(info) {
                if (info && info.created) {
                    window.KSLT_REG.markRegistered(client);
                } else {
                    btn.disabled = false;
                    btn.textContent = wasLabel;
                }
            });
        }, true);
    }

    /* ТИКЕР ОТСЧЁТА — ОДИН, В ДОМЕ (кусок 163). Здесь было три тела:
       `countdownParts` 12 строк, `tick` 13 и `startTimer` 6. Зовущий
       (`tournaments-overlay.js`) по-прежнему зовёт `TB.startTimer()` —
       имя оставлено, чтобы не трогать его без нужды. */
    function startTimer() { window.KSLT_TFEATURED.пустить(); }

    window.KSLT_TBLOCK = {
        featured: featured,
        compact: compact,
        grid: grid,
        startTimer: startTimer,
        ячейка: ячейка,
        bindLinks: bindLinks,
        initRegister: initRegister,
        labels: L
    };
})();
