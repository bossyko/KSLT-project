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

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn ? {
        details: 'Details', register: 'Register', format: 'Format',
        participants: 'Players', pairs: 'Pairs', prize: 'Prize',
        reg: 'Reg', noRating: 'Unranked',
        fee: 'Fee', feeMember: 'KSLT members', feeGuest: 'non-members',
        perPair: 'per player', som: 'som'
    } : (isKg ? {
        details: 'Толугураак', register: 'Каттоо', format: 'Формат',
        participants: 'Катышуучулар', pairs: 'Жуптар', prize: 'Сыйлык',
        reg: 'Кат', noRating: 'Рейтингсиз',
        fee: 'Взнос', feeMember: 'КСЛТ мүчөлөрүнө', feeGuest: 'калгандарга',
        perPair: 'оюнчудан', som: 'сом'
    } : {
        details: 'Подробнее', register: 'Регистрация', format: 'Формат',
        participants: 'Участники', pairs: 'Пар', prize: 'Призовой',
        reg: 'Рег', noRating: 'Без рейтинга',
        fee: 'Взнос', feeMember: 'членам КСЛТ', feeGuest: 'остальным',
        perPair: 'с участника', som: 'сом'
    });

    var CL = isEn
        ? { days: 'd', hours: 'h', min: 'm', sec: 's', live: 'LIVE NOW', prefix: 'STARTS IN' }
        : (isKg
            ? { days: 'к', hours: 'с', min: 'м', sec: 'с', live: 'ТҮЗ ЭФИР', prefix: 'БАШТАЛАТ' }
            : { days: 'д', hours: 'ч', min: 'м', sec: 'с', live: 'ИДЁТ СЕЙЧАС', prefix: 'СТАРТ ЧЕРЕЗ' });

    var detailPage = isEn ? 'tournament-en.html' : (isKg ? 'tournament-kg.html' : 'tournament.html');

    var pinSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>';

    // ---- Обратный отсчёт ----------------------------------------------

    var _timer = null;

    function countdownParts(diff) {
        var d = Math.floor(diff / (1000 * 60 * 60 * 24));
        var h = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        var m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        var s = Math.floor((diff % (1000 * 60)) / 1000);
        var out = '<span class="to-cd-label">' + CL.prefix + '</span>';
        if (d > 0) out += '<span class="to-cd-unit">' + d + '<small>' + CL.days + '</small></span>';
        out += '<span class="to-cd-unit">' + String(h).padStart(2, '0') + '<small>' + CL.hours + '</small></span>';
        out += '<span class="to-cd-unit">' + String(m).padStart(2, '0') + '<small>' + CL.min + '</small></span>';
        out += '<span class="to-cd-unit">' + String(s).padStart(2, '0') + '<small>' + CL.sec + '</small></span>';
        return out;
    }

    /**
     * Отсчёт до старта. Показываем только за двое суток до матча —
     * раньше он не помогает, а место занимает.
     *
     * Завершённым турнирам отсчёт не рисуем совсем: у них дата в прошлом,
     * и «осталось меньше нуля» превращалось в «ИДЁТ СЕЙЧАС» рядом с
     * плашкой «Завершён».
     */
    function countdown(t) {
        if (!t || t.status === 'past' || !t._dateSort) return '';
        var timeStr = t._startTime || '00:00';
        var diff = new Date(t._dateSort + 'T' + timeStr + ':00').getTime() - Date.now();
        if (diff <= 0) return '<span class="to-cd to-cd-live"><span class="to-cd-dot"></span>' + CL.live + '</span>';
        if (diff > 48 * 60 * 60 * 1000) return '';
        var urgent = diff < 60 * 60 * 1000 ? ' to-cd-urgent' : '';
        return '<span class="to-cd' + urgent + '" data-cd-date="' + t._dateSort + '" data-cd-time="' + timeStr + '">' +
            countdownParts(diff) + '</span>';
    }

    function tick() {
        document.querySelectorAll('.to-cd[data-cd-date]').forEach(function(el) {
            var target = new Date(el.dataset.cdDate + 'T' + (el.dataset.cdTime || '00:00') + ':00');
            var diff = target.getTime() - Date.now();
            if (diff <= 0) {
                el.className = 'to-cd to-cd-live';
                el.innerHTML = '<span class="to-cd-dot"></span>' + CL.live;
                return;
            }
            el.classList.toggle('to-cd-urgent', diff < 60 * 60 * 1000);
            el.innerHTML = countdownParts(diff);
        });
    }

    function startTimer() {
        if (_timer) clearInterval(_timer);
        if (document.querySelectorAll('.to-cd[data-cd-date]').length) {
            _timer = setInterval(tick, 1000);
        }
    }

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


    /** Парный или микст: заявку с двумя людьми собирают на странице турнира. */
    function парный(t) {
        return t._rawFormat === 'doubles' || t._rawFormat === 'mixed_doubles';
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
    function compact(t, extraAttrs) {
        // Афиша живого турнира — миниатюрой слева, у архивного остаётся фоном
        // под сильным затемнением: там важнее компактность строки
        var прошёл = t.status === 'past';
        var афиша = t.image
            ? (прошёл ? ' style="background-image:url(' + t.image + ')"'
                      : ' style="--poster:url(' + t.image + ')"')
            : '';

        return '<div class="to-compact ' + (прошёл ? 'to-compact-past' : 'to-compact-thumb') + '"' +
            (extraAttrs || '') +
            ' data-status="' + t.status + '" data-gender="' + (t._gender || 'all') + '"' +
            ' data-href="' + detailPage + '?id=' + t.id + '"' +
            афиша + '>' +
            '<div class="to-compact-left">' +
                '<div class="to-compact-date">' +
                    '<span class="to-day">' + t.date.day + '</span>' +
                    '<span class="to-month">' + t.date.month + '</span>' +
                '</div>' +
                (t.genderLabel ? '<span class="to-compact-gender-badge">' + t.genderLabel + '</span>' : '') +
                (t.noRating ? '<span class="to-compact-norating-badge">' + L.noRating + '</span>' : '') +
            '</div>' +
            '<div class="to-compact-info">' +
                '<h4>' + t.name + '</h4>' +
                '<div class="to-compact-sub">' +
                    (t.location ? '<span>' + pinSvg + ' ' + t.location + '</span>' : '') +
                    (t.regLine ? '<span class="to-compact-reg">' + L.reg + ': ' + t.regLine + '</span>' : '') +
                '</div>' +
            '</div>' +
            '<div class="to-compact-right">' +
                '<span class="to-compact-status ' + t.status + '">' + t.statusText + '</span>' +
                // Запись прямо отсюда: раньше в боковой карточке был только
                // статус «регистрация открыта», а записаться было негде —
                // приходилось открывать турнир ради одной кнопки
                (t._rawStatus === 'registration_open'
                    ? '<button class="btn-register to-register to-compact-regbtn" data-tid="' + t.id + '"' +
                        // В парном нужен напарник — заявку собирают на странице
                        // турнира, отсюда только ведём туда
                        (парный(t) ? ' data-doubles="1"' : '') + '>' + L.register + '</button>'
                    : '') +
                countdown(t) +
            '</div>' +
        '</div>';
    }

    /**
     * Блок целиком: первая карточка крупно слева, остальные полосами
     * справа — та же раскладка, что на странице «Турниры».
     */
    function grid(items, bgImage) {
        if (!items || !items.length) return '';
        var html = featured(items[0], bgImage);
        if (items.length > 1) {
            html += '<div class="to-side-stack">' +
                items.slice(1).map(function(t) { return compact(t); }).join('') +
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
            btn.textContent = isEn ? 'Sending...' : (isKg ? 'Жөнөтүлүүдө...' : 'Отправка...');

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

    window.KSLT_TBLOCK = {
        featured: featured,
        compact: compact,
        grid: grid,
        countdown: countdown,
        startTimer: startTimer,
        bindLinks: bindLinks,
        initRegister: initRegister,
        labels: L
    };
})();
