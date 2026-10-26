// ============================================
// Заявка в парный турнир — окно выбора напарника
// ============================================
//
// В паре заявку подаёт один за двоих, поэтому окно нужно везде, где есть
// кнопка записи: на карточке в списке турниров и на самой странице турнира.
// Раньше оно жило только на странице турнира, и с карточки записаться в
// парный было нельзя — человека уводило читать турнир заново.
//
// Напарник бывает двух видов:
//   из базы — обычный игрок клуба, заявка сразу получает своё место;
//   гость   — человека в базе нет, место за парой держим, но менеджер должен
//             подтвердить: клуб не знает ни его рейтинга, ни того, придёт ли он.
//
// window.KSLT_DOUBLES.открыть({ client, tournament, playerName, onDone })

(function () {
    'use strict';

    /* Язык — у дома (js/kslt-yazyk.js). Флаги оставлены: их ждёт
       `KSLT_REG.submit` ниже, строка 296. */
    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;

    function pick(en, kg, ru) { return KSLT_YAZYK.выбрать(en, kg, ru); }

    var L = {
        title: pick('Doubles entry', 'Жупта катталуу', 'Заявка в парный турнир'),
        titleChange: pick('Change partner', 'Өнөктөштү алмаштыруу', 'Заменить напарника'),
        you: pick('You', 'Сиз', 'Вы'),
        partner: pick('Partner', 'Өнөктөш', 'Напарник'),
        fromDb: pick('From club', 'Базадан', 'Из базы'),
        guest: pick('Guest', 'Конок', 'Гость'),
        solo: pick('Later', 'Кийин', 'Пока без'),
        genderWarn: pick('Gender does not match the tournament — the manager will review the entry.',
                         'Жынысы мелдешке дал келбейт — арызды менеджер карайт.',
                         'Пол не совпадает с турниром — заявку рассмотрит менеджер.'),
        soloNote: pick('You take a place now and add a partner later. A pair without a partner is not drawn.',
                       'Азыр орун ээлейсиз, өнөктөштү кийин кошосуз. Өнөктөшсүз жуп сеткага кирбейт.',
                       'Место занимается сразу, напарника добавите позже. Без напарника пара в сетку не попадёт.'),
        search: pick('Type name...', 'Атын жазыңыз...', 'Введите имя...'),
        guestName: pick('Guest name', 'Коноктун аты', 'Имя гостя'),
        guestNtrp: pick('NTRP', 'NTRP', 'NTRP'),
        guestGender: pick('Gender *', 'Жынысы *', 'Пол *'),
        men: pick('Men', 'Эркек', 'Мужской'),
        women: pick('Women', 'Аял', 'Женский'),
        send: pick('Send entry', 'Арыз жөнөтүү', 'Подать заявку'),
        cancel: pick('Cancel', 'Жокко чыгаруу', 'Отмена'),
        needPartner: pick('Choose a partner from the club',
                          'Клубдан өнөктөш тандаңыз',
                          'Выберите напарника из базы'),
        needName: pick('Enter the guest name', 'Коноктун атын жазыңыз', 'Введите имя гостя'),
        needGender: pick('Choose the guest gender', 'Коноктун жынысын тандаңыз', 'Укажите пол гостя'),
        needNtrp: pick('Enter the guest NTRP', 'Коноктун NTRP көрсөтүңүз', 'Укажите NTRP гостя'),
        guestNote: pick('A pair with a guest keeps its place, but the manager confirms it.',
                        'Конок менен жуп ордун сактайт, бирок менеджер ырастайт.',
                        'Пара с гостем занимает место, но её подтверждает менеджер.'),
        notFound: pick('Nobody found', 'Эч ким табылган жок', 'Никого не нашли'),
        limit: pick('Pair NTRP limit', 'Жуптун NTRP чеги', 'Лимит NTRP пары')
    };

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    /** Открыть окно. Возвращает промис: true — заявка ушла. */
    function открыть(opts) {
        var client = opts.client;
        var t = opts.tournament || {};
        var микст = t.format === 'mixed_doubles';

        var overlay = document.createElement('div');
        overlay.className = 'de-overlay';
        overlay.innerHTML =
            '<div class="de-modal">' +
                '<button class="de-close" type="button">&times;</button>' +
                '<h3 class="de-title">' + (opts.заменить ? L.titleChange : L.title) + '</h3>' +
                (t.title ? '<p class="de-trn">' + KSLT_экранировать(t.title) + '</p>' : '') +

                '<div class="de-row"><span class="de-label">' + L.you + '</span>' +
                    '<span class="de-me">' + KSLT_экранировать(opts.playerName || '') + '</span></div>' +

                (t.ntrp_combined_max
                    ? '<div class="de-limit">' + L.limit + ': ' + t.ntrp_combined_max + '</div>' : '') +

                '<div class="de-label de-label-block">' + L.partner + '</div>' +
                '<div class="de-switch">' +
                    '<button type="button" class="on" data-mode="db">' + L.fromDb + '</button>' +
                    '<button type="button" data-mode="guest">' + L.guest + '</button>' +
                    '<button type="button" data-mode="solo">' + L.solo + '</button>' +
                '</div>' +

                '<div class="de-block" data-block="db">' +
                    '<input type="text" class="de-input de-search" placeholder="' + L.search + '" autocomplete="off">' +
                    '<div class="de-results"></div>' +
                    '<input type="hidden" class="de-partner-id">' +
                '</div>' +

                '<div class="de-block" data-block="guest" hidden>' +
                    '<input type="text" class="de-input de-guest-name" placeholder="' + L.guestName + '">' +
                    '<div class="de-two">' +
                        // Страна списком, а не вводом: флаг с клавиатуры не
                        // наберёшь, а руками легко ошибиться. По умолчанию наш —
                        // приезжие редки, и обычно трогать поле не придётся
                        '<select class="de-input de-guest-country" style="max-width:120px">' +
                            (window.KSLT_COUNTRY && window.KSLT_COUNTRY.вариантыСтран
                                ? window.KSLT_COUNTRY.вариантыСтран('🇰🇬', KSLT_YAZYK.выбрать('en', 'kg', 'ru'))
                                : '<option value="🇰🇬" selected>🇰🇬</option>') +
                        '</select>' +
                        '<select class="de-input de-guest-ntrp">' +
                            '<option value="">' + L.guestNtrp + ' *</option>' +
                            // Других значений в NTRP не бывает: список снимает
                            // вопрос про точку, запятую и «45» вместо 4.5
                            [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7].map(function (v) {
                                return '<option value="' + v + '">' + v.toFixed(1) + '</option>';
                            }).join('') +
                        '</select>' +
                        // Пол обязателен у любого гостя: без него пару не
                        // проверить, а когда гость заведёт карточку, пол
                        // придётся угадывать по имени
                        '<select class="de-input de-guest-gender">' +
                            '<option value="">' + L.guestGender + '</option>' +
                            '<option value="men">' + L.men + '</option>' +
                            '<option value="women">' + L.women + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<p class="de-note">' + L.guestNote + '</p>' +
                    '<p class="de-note de-gender-warn" hidden>' + L.genderWarn + '</p>' +
                '</div>' +

                '<div class="de-block" data-block="solo" hidden>' +
                    '<p class="de-note">' + L.soloNote + '</p>' +
                '</div>' +

                '<div class="de-actions">' +
                    '<button type="button" class="de-btn de-cancel">' + L.cancel + '</button>' +
                    '<button type="button" class="de-btn de-send">' + L.send + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function () { overlay.classList.add('active'); });

        /* ОСНАСТКА ОКНА — ДОМ (кусок 156). В окне ЕСТЬ ПОЛЕ поиска
           напарника: копия ловушки, забывшая поля, отпускала бы Tab наружу
           молча — это и было третьим расхождением копий на куске 152. */
        overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, { поEsc: закрыть });

        var поиск = overlay.querySelector('.de-search');
        var список = overlay.querySelector('.de-results');
        var скрытое = overlay.querySelector('.de-partner-id');

        function закрыть() {
            if (overlay.__ksltСнять) { overlay.__ksltСнять(); overlay.__ksltСнять = null; }
            overlay.classList.remove('active');
            setTimeout(function () { overlay.remove(); }, 180);
        }
        overlay.querySelector('.de-close').addEventListener('click', закрыть);
        overlay.querySelector('.de-cancel').addEventListener('click', закрыть);
        overlay.addEventListener('click', function (e) { if (e.target === overlay) закрыть(); });

        // Переключение способа: чужие поля чистим, чтобы ушло ровно то, что видно
        overlay.querySelectorAll('.de-switch button').forEach(function (кн) {
            кн.addEventListener('click', function () {
                overlay.querySelectorAll('.de-switch button').forEach(function (x) {
                    x.classList.toggle('on', x === кн);
                });
                var режим = кн.dataset.mode;
                overlay.querySelectorAll('.de-block').forEach(function (блок) {
                    блок.hidden = блок.dataset.block !== режим;
                });
                // Поля другого способа чистим: уйти должно ровно то, что видно
                if (режим !== 'db') {
                    скрытое.value = '';
                    поиск.value = '';
                    список.innerHTML = '';
                }
                if (режим !== 'guest') {
                    overlay.querySelector('.de-guest-name').value = '';
                    overlay.querySelector('.de-guest-ntrp').value = '';
                    overlay.querySelector('.de-guest-gender').value = '';
                    overlay.querySelector('.de-guest-country').value = '🇰🇬';
                }
            });
        });

        // Пол гостя не тот, что у турнира — предупреждаем сразу, а не после отправки
        var полеПола = overlay.querySelector('.de-guest-gender');
        полеПола.addEventListener('change', function () {
            var чужой = (t.gender === 'men' || t.gender === 'women') &&
                полеПола.value && полеПола.value !== t.gender;
            overlay.querySelector('.de-gender-warn').hidden = !чужой;
        });

        // Поиск напарника среди игроков клуба
        var таймер;
        поиск.addEventListener('input', function () {
            clearTimeout(таймер);
            скрытое.value = '';
            var q = поиск.value.trim();
            if (q.length < 2) { список.innerHTML = ''; return; }

            таймер = setTimeout(async function () {
                var res = await client.from('players_public')
                    .select('id, name, name_en, gender, ntrp_singles, ntrp_doubles')
                    .or('name.ilike.%' + q + '%,name_en.ilike.%' + q + '%')
                    .limit(8);
                var найдены = (res.data || []).filter(function (p) { return p.id !== opts.playerId; });
                if (!найдены.length) {
                    список.innerHTML = '<div class="de-empty">' + L.notFound + '</div>';
                    return;
                }
                список.innerHTML = найдены.map(function (p) {
                    var имя = isEn ? (p.name_en || p.name) : p.name;
                    var ntrp = p.ntrp_doubles || p.ntrp_singles;
                    return '<div class="de-item" data-id="' + KSLT_экранировать(p.id) + '" data-name="' + KSLT_экранировать(имя) + '">' +
                        '<span>' + KSLT_экранировать(имя) + '</span>' +
                        (ntrp ? '<span class="de-ntrp">NTRP ' + ntrp + '</span>' : '') +
                    '</div>';
                }).join('');

                список.querySelectorAll('.de-item').forEach(function (строка) {
                    строка.addEventListener('click', function () {
                        скрытое.value = строка.dataset.id;
                        поиск.value = строка.dataset.name;
                        список.innerHTML = '';
                    });
                });
            }, 300);
        });

        // Незаполненные поля называем прямо и все разом: раньше кнопка просто
        // дёргалась, и человек гадал, чего от него хотят, а потом заполнял по
        // одному полю за попытку
        function пометить(поле, текст) {
            поле.classList.add('de-bad');
            var строка = document.createElement('p');
            строка.className = 'de-bad-note';
            строка.textContent = текст;
            (поле.parentNode.classList.contains('de-two') ? поле.parentNode : поле)
                .insertAdjacentElement('afterend', строка);
        }

        /** Показать все пробелы сразу. Курсор — в первый. */
        function ошибки(список) {
            снятьОшибки();
            список.forEach(function (п) { пометить(п.поле, п.текст); });
            if (список.length) список[0].поле.focus();
            return список.length > 0;
        }

        function снятьОшибки() {
            overlay.querySelectorAll('.de-bad').forEach(function (п) { п.classList.remove('de-bad'); });
            overlay.querySelectorAll('.de-bad-note').forEach(function (п) { п.remove(); });
        }

        // Исправил — подсветку убираем сразу, не дожидаясь второй попытки
        overlay.addEventListener('input', снятьОшибки);
        overlay.addEventListener('change', снятьОшибки);

        // Отправка
        overlay.querySelector('.de-send').addEventListener('click', async function () {
            var кнопка = this;
            var режим = overlay.querySelector('.de-switch button.on').dataset.mode;
            var extra = {};
            // Замена: заявка уже есть, меняем в ней только напарника
            if (opts.заменить) extra.change_partner = true;

            if (режим === 'solo') {
                // Заявка без напарника: место занято, пару соберут позже
            } else if (режим === 'guest') {
                var полеИмени = overlay.querySelector('.de-guest-name');
                // NTRP и пол спрашиваем у любого гостя. Пустой NTRP молча
                // считался нулём, и лимит суммы пары обходился сам собой; а
                // пол понадобится, когда гость заведёт себе карточку —
                // угадывать его по имени мы не станем
                var полеNtrp = overlay.querySelector('.de-guest-ntrp');
                var полеПолаГостя = overlay.querySelector('.de-guest-gender');

                var пробелы = [];
                if (!полеИмени.value.trim()) пробелы.push({ поле: полеИмени, текст: L.needName });
                if (!полеNtrp.value) пробелы.push({ поле: полеNtrp, текст: L.needNtrp });
                if (!полеПолаГостя.value) пробелы.push({ поле: полеПолаГостя, текст: L.needGender });
                if (ошибки(пробелы)) return;

                extra.partner_external_name = полеИмени.value.trim();
                extra.partner_external_ntrp = Number(полеNtrp.value);
                var страна = overlay.querySelector('.de-guest-country').value.trim();
                if (страна) extra.partner_external_country = страна;
                extra.partner_gender = полеПолаГостя.value;
            } else {
                if (ошибки(скрытое.value ? [] : [{ поле: поиск, текст: L.needPartner }])) return;
                extra.partner_id = скрытое.value;
            }

            кнопка.disabled = true;
            кнопка.textContent = pick('Sending...', 'Жөнөтүлүүдө...', 'Отправка...');

            var info = await window.KSLT_REG.submit(client, t.id, { isEn: isEn, isKg: isKg, extra: extra });
            закрыть();
            if (opts.onDone) opts.onDone(info);
        });

        стили();
    }

    /** ВИД ОКНА ЖИВЁТ В CSS (кусок 174, 26.10). Здесь стояла функция
        `стили`: тридцать три правила строкой, вписывались в <head> при
        первом открытии. Внутри жили 21 краска мимо системы, 11 кеглей в
        rem, 15 отступов и 6 радиусов числом — и ни один сторож их не
        читал. Правила переехали в `css/style.css`.
        Зов оставлен пустым телом: он стоит в начале `открыть`. */
    function стили() {}

    window.KSLT_DOUBLES = { открыть: открыть };
})();
