// ============================================
// KSLT — Подача заявки на турнир
// Общий модуль для всех точек входа: карточка турнира, страница турнира.
//
// Решение о допуске принимает Edge Function tournament-register:
// клиент не выбирает себе статус и не может подвинуть чужую заявку.
// ============================================

(function() {
    'use strict';

    /* ВИД ОКНА ЖИВЁТ В CSS (кусок 174, 26.10). Здесь стояла функция
       injectStyles: семнадцать правил строкой, вписывались в <head> при
       первом открытии. Пояснение автора было верным — модуль подключается
       на разные страницы, — но правило в строке js не читает ни один
       сторож, и внутри жили 12 красок мимо системы, 5 кеглей в rem и 7
       отступов числом. Правила переехали в `css/style.css`, который
       подключён на всех шестнадцати страницах с этим окном.
       Зов оставлен пустым телом: он стоит в трёх местах файла, и это
       ОДИН шов вместо трёх правок. */
    function injectStyles() {}

    /**
     * Отправляет заявку на турнир.
     * @param {any} client Supabase client
     * @param {string} tournamentId
     * @param {Object} [extra] Партнёр для парных: partner_id или partner_external_*
     * @returns {Promise<{ok:boolean, data:Object}>}
     */
    /* ЗОВ ФУНКЦИИ ДОПУСКА — ДОМ (кусок A3.7д): js/kslt-zayavka.js.
       Сессия, токен, отсев пустых полей и заголовки были написаны здесь
       и в приложении — знак в знак, только одно через `await`, другое
       через `then`. Имя `callRegister` оставлено: его отдают наружу как
       `KSLT_REG.call`, и зовущих трогать не нужно. */
    function callRegister(client, tournamentId, extra) {
        return window.KSLT_ZAYAVKA.зов(client, tournamentId, extra);
    }

    /** Надписи окна заявки — общий файл js/zayavka-texts.js. */
    function надписи() {
        var T = window.KSLT_ZAYAVKA_TEXTS;
        return T ? T.of(KSLT_YAZYK.выбрать('en', 'kg', 'ru')) : {};
    }

    /**
     * Человеческий текст по ответу функции.
     *
     * ДЕРЕВО РЕШЕНИЙ — ДОМ (кусок A3.7д): js/kslt-zayavka.js. Здесь
     * жили девятнадцать слов на коды отказа, восемь статусов, восемь
     * коротких подписей и сам порядок ветвей — и всё это было написано
     * второй раз в приложении, где из девятнадцати слов было ДЕВЯТЬ, а
     * ветки смены напарника не было вовсе.
     *
     * Доводы `isEn`, `isKg` оставлены в подписи: их передают двадцать
     * зовов из шести файлов, а язык всё равно берётся у `KSLT_YAZYK` —
     * так было и до этого куска.
     *
     * @returns {{title:string, text:string, note:string, tone:string, short:string}}
     */
    function resultText(data, isEn, isKg) {
        var Z = window.KSLT_ZAYAVKA;
        var слова = Z.словами(Z.разобрать(data), надписи(), data);
        return {
            tone: слова.тон,
            icon: слова.значок,
            title: слова.титул,
            text: слова.текст,
            note: слова.заметка,
            short: слова.коротко
        };
    }

    /** Показывает модалку с результатом подачи заявки. */
    /**
     * ЗАКРЫТЬ ОКНО — ОДНО ОПРЕДЕЛЕНИЕ НА ФАЙЛ (кусок 155).
     *
     * Файл строит ТРИ окна, и каждое гасило себя своей копией: два знак
     * в знак, третье с тем же телом плюс сторож ответа и `resolve`.
     * Прибор копий видел два — у третьего в подписи есть довод, и для
     * него это уже не копия.
     *
     * СНЯТИЕ ЖДЁТ СТОЛЬКО ЖЕ, СКОЛЬКО ИДЁТ ПЕРЕХОД В CSS: `.2s ease`
     * объявлен выше в этом же файле, а 200 стояло числом в трёх местах.
     * Теперь число одно, и шов между css и js виден.
     *
     * СЮДА ЖЕ ЛЯЖЕТ СНЯТИЕ ЗАПИРАНИЯ ФОКУСА: обход 24.10 показал, что ни
     * одно из трёх окон этого файла Tab не запирает, Escape не слушает и
     * диктору окном не называется. Это своя запись и свой кусок — место
     * под неё готово.
     */
    var СНЯТИЕ_МС = 200;

    function закрытьОкно(overlay) {
        if (!overlay) return;
        /* СНЯТИЕ ОСНАСТКИ ЖИВЁТ НА САМОМ УЗЛЕ, а не в замыкании: закрытие у
           этого файла одно на три окна, и иначе ему пришлось бы знать, какое
           из трёх закрывают. Образец — `player.js`, кусок 153. */
        if (overlay.__ksltСнять) { overlay.__ksltСнять(); overlay.__ksltСнять = null; }
        overlay.classList.remove('active');
        setTimeout(function () { overlay.remove(); }, СНЯТИЕ_МС);
    }

    /**
     * ЭКРАНИРОВАНИЕ ПО УМОЛЧАНИЮ, А НЕ ПО ЖЕЛАНИЮ ЗОВУЩЕГО (кусок 157).
     *
     * ЧТО БЫЛО. Окна этого файла вставляли `info.title`, `info.text`,
     * `info.note`, `opts.title` и `opts.text` в разметку КАК ЕСТЬ. Проверено
     * НАЖАТИЕМ на живой странице турнира: `<b>весна</b>` в названии стало
     * ТЕГОМ, `<i>` в тексте — тегом, а узел `<img>` создался. С обработчиком
     * это было бы внедрением на ПУБЛИЧНОЙ странице.
     *
     * ПОЧЕМУ ДОМ, А НЕ ТРИДЦАТЬ ПРАВОК. Прибор 157 нашёл 30 мест, где в
     * разметку идёт то, что пишет человек. Экранировать их по одному значит
     * разъехаться на тридцать первом — так уже разъезжались четыре копии
     * ловушки и семь записей правила счёта.
     *
     * РОД ЗНАЧЕНИЯ ВИДЕН В ИМЕНИ ДОВОДА — приём FAANG (в React опасный путь
     * зовётся `dangerouslySetInnerHTML`, и имя кричит):
     *   `title`, `text`, `note`   — ТЕКСТ, дом экранирует сам;
     *   `textHtml`                — разметка ПО ЗАМЫСЛУ, и зовущий отвечает
     *                               за экранирование данных ВНУТРИ неё.
     *
     * ЭТО НЕ СЛОМАЛО ПРОДУКТ, И ЭТО ПОСЧИТАНО ДО ПРАВКИ: из трёх зовов окон
     * разметку передавал ОДИН — `<b>` вокруг названия турнира при снятии
     * заявки. Он переведён на `textHtml` и экранирует название явно.
     *
     * ЗНАЧОК НЕ ЭКРАНИРУЕТСЯ НАМЕРЕННО: его задаёт КОД (эмодзи или `<svg>`),
     * а не человек, и ни один зов не берёт его из базы — проверено по всем
     * зовам `notice`, `confirm` и `showModal`.
     */
    function текстом(значение) {
        return значение == null ? '' : window.KSLT_экранировать(String(значение));
    }

    function showModal(info, isEn, isKg) {
        injectStyles();

        var old = document.querySelector('.trn-register-modal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'trn-register-modal-overlay';
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon">' + info.icon + '</div>' +
                '<h3 class="trn-register-modal-title">' + текстом(info.title) + '</h3>' +
                '<p class="trn-register-modal-text">' +
                    (info.textHtml != null ? info.textHtml : текстом(info.text)) + '</p>' +
                (info.note ? '<div class="trn-register-modal-note">' + текстом(info.note) + '</div>' : '') +
                '<button class="trn-register-modal-btn' + (info.tone === 'error' ? ' is-error' : '') + '">' +
                    текстом(надписи().ok) +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('active'); });

        function close() { закрытьОкно(overlay); }
        /* ОСНАСТКА ОКНА — ДОМ (кусок 156): роль диктору, фокус внутрь,
           запирание Tab, Escape и возврат фокуса. */
        overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, { поEsc: close });
        overlay.querySelector('.trn-register-modal-close').addEventListener('click', close);
        overlay.querySelector('.trn-register-modal-btn').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    }

    /**
     * Окно «войдите, чтобы записаться». Кнопка ведёт на страницу входа и
     * возвращает обратно, чтобы человек не искал турнир заново.
     */
    function предложитьВойти(isEn, isKg) {
        function pick(en, kg, ru) { return KSLT_YAZYK.выбрать(en, kg, ru); }
        injectStyles();

        var old = document.querySelector('.trn-register-modal-overlay');
        if (old) old.remove();

        var путьВхода = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');
        var вПапке = window.location.pathname.indexOf('/pages/') !== -1;
        var адрес = (вПапке ? '' : 'pages/') + путьВхода +
            '?return=' + encodeURIComponent(window.location.href);

        var overlay = document.createElement('div');
        overlay.className = 'trn-register-modal-overlay';
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon">\uD83D\uDD11</div>' +
                '<h3 class="trn-register-modal-title">' +
                    pick('Sign in to register', 'Катталуу үчүн кириңиз', 'Войдите, чтобы записаться') + '</h3>' +
                '<p class="trn-register-modal-text">' +
                    pick('Entries are accepted from registered players. It takes a minute.',
                         'Арыздар катталган оюнчулардан кабыл алынат. Бир мүнөт талап кылынат.',
                         'Заявки принимаем от зарегистрированных игроков. Это займёт минуту.') + '</p>' +
                '<button class="trn-register-modal-btn">' +
                    pick('Sign in / Sign up', 'Кирүү / Каттоо', 'Войти / Регистрация') + '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('active'); });

        function close() { закрытьОкно(overlay); }
        /* ОСНАСТКА ОКНА — ДОМ (кусок 156). */
        overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, { поEsc: close });
        overlay.querySelector('.trn-register-modal-close').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
        overlay.querySelector('.trn-register-modal-btn').addEventListener('click', function() {
            window.location.href = адрес;
        });
    }

    /**
     * Подаёт заявку и показывает результат. Используется и карточкой, и страницей турнира.
     * @returns {Promise<Object>} info из resultText — вызывающий код может обновить кнопку
     */
    /**
     * Пара с гостем занимает место, но ждёт решения менеджера: клуб не знает
     * ни его рейтинга, ни того, придёт ли он. Дописываем это в окно, иначе
     * человек уверен, что уже играет.
     */
    /* СЛОВА ПРИПИСОК — ТЕ ЖЕ, ЧТО У ДОМА. `noteGuest` дом уже отдаёт
       как текст ветки смены напарника: одно слово, одно место. */
    function приписать(info, ключ) {
        var L = надписи();
        var текст = L[ключ] || '';
        info.note = info.note ? (info.note + ' ' + текст) : текст;
        info.short = L.shortReview || '';
        return info;
    }

    function приписатьПроГостя(info, isEn, isKg) {
        return приписать(info, 'noteGuest');
    }

    function приписатьПроСостав(info, isEn, isKg) {
        return приписать(info, 'noteGender');
    }

    function pick3(isEn, isKg, en, kg, ru) { return KSLT_YAZYK.выбрать(en, kg, ru); }

    /**
     * Чего не хватает в профиле для участия: ФИО, пол, телефон.
     *
     * Тот же набор, что показывает баннер в кабинете: «Заполните профиль».
     * Возвращает true, если чего-то нет.
     */
    async function профильНеполон(client) {
        try {
            var сессия = await client.auth.getSession();
            if (!сессия.data.session) return false;
            var res = await client.from('profiles')
                .select('full_name, gender, phone')
                .eq('id', сессия.data.session.user.id)
                .maybeSingle();
            var p = res.data;
            if (!p) return false;
            if (!p.full_name || !p.full_name.trim()) return true;
            if (p.gender !== 'men' && p.gender !== 'women') return true;
            if (!p.phone || !p.phone.trim()) return true;
            return false;
        } catch (e) {
            // Не смогли прочитать — не держим человека: решение примет сервер
            return false;
        }
    }

    /**
     * Завести карточку игрока тому, у кого её ещё нет.
     *
     * Та же проверка, что в кабинете: нашлась похожая — не присваиваем молча,
     * там чужой рейтинг и история; не нашлась — сервер заводит новую.
     *
     * Возвращает 'created', 'candidate' или пусто.
     */
    /* ЗОВ — ДОМ ВХОДА (кусок A3.7е): он стоял в ПЯТИ местах. */
    function завестиКарточку(client) {
        return window.KSLT_VHOD.завестиКарточку(client);
    }

    async function submit(client, tournamentId, opts) {
        opts = opts || {};
        var isEn = !!opts.isEn;
        var isKg = !!opts.isKg;

        // Не вошёл — предлагаем войти, а не отказываем. Раньше человек видел
        // «Заявка не принята: Unauthorized» и не понимал, что делать
        var сессия = await client.auth.getSession();
        if (!сессия.data.session) {
            предложитьВойти(isEn, isKg);
            return { created: false, needAuth: true };
        }

        // Профиль должен быть заполнен: без пола не проверить ни микст, ни
        // мужской с женским, без телефона клуб не дозвонится, если человек не
        // вышел на корт. Не объясняем окном, а сразу уводим в кабинет — там
        // эти поля и заполняют, и там же видно, чего не хватает
        var неполный = await профильНеполон(client);
        if (неполный) {
            window.location.href = (window.location.pathname.indexOf('/pages/') !== -1 ? '' : 'pages/') +
                pick3(isEn, isKg, 'dashboard-en.html', 'dashboard-kg.html', 'dashboard.html') + '#profile';
            return { created: false, needProfile: true };
        }

        var reg = await callRegister(client, tournamentId, opts.extra);

        // «У вас нет карточки игрока» — тупик, из которого человек сам не
        // выйдет. Такое бывает у того, кто пришёл по ссылке из рассылки и до
        // кабинета не доходил: карточку там заводят при первом заходе.
        // Заводим её здесь же и подаём заявку снова
        if (reg.data && reg.data.error === 'no_player') {
            var карточка = await завестиКарточку(client);
            if (карточка === 'created') {
                reg = await callRegister(client, tournamentId, opts.extra);
            } else if (карточка === 'candidate') {
                // Нашлась похожая карточка с чужим рейтингом и историей —
                // присваивать молча нельзя, человек подтверждает сам в кабинете
                showModal({
                    ok: false,
                    title: pick3(isEn, isKg,
                        'Confirm your player card',
                        'Оюнчу картаңызды ырастаңыз',
                        'Подтвердите карточку игрока'),
                    note: pick3(isEn, isKg,
                        'We found a card that looks like yours. Open your dashboard and confirm it — then entry will work.',
                        'Сизге окшош карта табылды. Кабинетти ачып ырастаңыз — андан кийин катталуу иштейт.',
                        'Нашли карточку, похожую на вашу. Откройте кабинет и подтвердите её — после этого запись заработает.')
                }, isEn, isKg);
                return { created: false, needCard: true };
            }
        }

        var info = resultText(reg.data, isEn, isKg);
        var сГостем = opts.extra && opts.extra.partner_external_name;
        if (сГостем && !(reg.data && reg.data.error)) приписатьПроГостя(info, isEn, isKg);
        // Состав не сошёлся с турниром: заявка принята, место держится, но
        // играть пару пустят только с одобрения клуба — сказать об этом надо
        // сразу, а не оставлять человека в уверенности, что он в сетке
        if (reg.data && reg.data.gender_review) приписатьПроСостав(info, isEn, isKg);
        showModal(info, isEn, isKg);
        /* ПРИЗНАК «ЗАЯВКА СОЗДАНА» — ДОМ: по нему кнопка меняет вид, и
           он стоял в двух файлах знак в знак. Тонкость в том, что
           `already_registered` — отказ по коду, а кнопку менять надо. */
        info.created = window.KSLT_ZAYAVKA.создана(reg.data);
        return info;
    }

    /**
     * Подтверждение в том же оформлении, что и остальные модалки страницы.
     * Нативный confirm() выбивается из дизайна и на разных браузерах выглядит
     * по-своему.
     * @returns {Promise<boolean>}
     */
    function confirmModal(opts) {
        injectStyles();

        var old = document.querySelector('.trn-register-modal-overlay');
        if (old) old.remove();

        return new Promise(function(resolve) {
            var overlay = document.createElement('div');
            overlay.className = 'trn-register-modal-overlay';
            overlay.innerHTML =
                '<div class="trn-register-modal">' +
                    '<button class="trn-register-modal-close">&times;</button>' +
                    (opts.icon ? '<div class="trn-register-modal-icon">' + opts.icon + '</div>' : '') +
                    '<h3 class="trn-register-modal-title">' + текстом(opts.title) + '</h3>' +
                    (opts.textHtml != null
                        ? '<p class="trn-register-modal-text">' + opts.textHtml + '</p>'
                        : (opts.text ? '<p class="trn-register-modal-text">' + текстом(opts.text) + '</p>' : '')) +
                    '<div class="trn-register-modal-actions">' +
                        '<button class="trn-register-modal-btn is-ghost" data-no>' + текстом(opts.cancelText) + '</button>' +
                        '<button class="trn-register-modal-btn' + (opts.tone === 'error' ? ' is-error' : '') + '" data-yes>' + текстом(opts.okText) + '</button>' +
                    '</div>' +
                '</div>';

            document.body.appendChild(overlay);
            requestAnimationFrame(function() { overlay.classList.add('active'); });

            var answered = false;
            /* ОСНАСТКА ОКНА — ДОМ (кусок 156). Escape отвечает «нет»: отказ —
               обратимое решение, согласие — нет. */
            overlay.__ksltСнять = window.KSLT_FOKUS.оснастить(overlay, {
                поEsc: function () { close(false); }
            });
            function close(answer) {
                if (answered) return;      /* два нажатия — один ответ */
                answered = true;
                закрытьОкно(overlay);
                resolve(answer);
            }
            overlay.querySelector('.trn-register-modal-close').addEventListener('click', function() { close(false); });
            overlay.querySelector('[data-no]').addEventListener('click', function() { close(false); });
            overlay.querySelector('[data-yes]').addEventListener('click', function() { close(true); });
            overlay.addEventListener('click', function(e) { if (e.target === overlay) close(false); });
        });
    }

    /** Короткое сообщение в том же оформлении — вместо alert() */
    /**
     * ПЕРЕХОДНИК НЕ ПЕРЕСОБИРАЕТ ОБЪЕКТ ПОЛЕ ЗА ПОЛЕМ (кусок 157).
     *
     * Он перечислял пять полей руками — и терял КАЖДОЕ новое. Поймала это
     * ПРОБА, а не сторож: сторож проверял `showModal`, а путь шёл через этот
     * переходник, и довод `textHtml` до окна не доезжал. Окно открывалось с
     * пустым текстом, и ни одна красная строка этого не показывала.
     * Заодно выяснилось, что `note: ''` затирал заметку ВСЕГДА: ни один
     * зовущий её не передавал, и потому потери никто не замечал.
     *
     * Теперь поля переносятся целиком, а умолчания ставятся поверх: новый
     * довод дома работает у всех зовущих сразу.
     */
    function noticeModal(opts, isEn, isKg) {
        var о = {};
        for (var к in opts) {
            if (Object.prototype.hasOwnProperty.call(opts, к)) о[к] = opts[к];
        }
        о.icon = opts.icon || '';
        о.text = opts.text != null ? opts.text : '';
        о.tone = opts.tone || '';
        showModal(о, isEn, isKg);
    }

    /**
     * Помечает карточки турниров, куда игрок уже подал заявку: кнопка гаснет
     * и подписывается статусом. Раньше она оставалась активной, и человек
     * узнавал о своей заявке только по модалке после нажатия.
     */
    async function markRegistered(client) {
        var btns = Array.prototype.slice.call(document.querySelectorAll('.tournament-card[data-id] .btn-register, .btn-register[data-tid]'));
        if (btns.length === 0 || !client) return;

        var isEn = KSLT_YAZYK.en;
        var isKg = KSLT_YAZYK.kg;

        try {
            var session = await client.auth.getSession();
            if (!session.data.session) return;

            var prof = await client.from('profiles')
                .select('player_id').eq('id', session.data.session.user.id).single();
            var playerId = prof.data && prof.data.player_id;
            if (!playerId) return;

            // Кнопка либо лежит в карточке с data-id, либо носит id на себе
            function idOf(btn) {
                if (btn.dataset && btn.dataset.tid) return btn.dataset.tid;
                var card = btn.closest('.tournament-card');
                return card && card.dataset ? card.dataset.id : null;
            }

            var ids = [];
            btns.forEach(function(b) {
                var id = idOf(b);
                if (id && ids.indexOf(id) === -1) ids.push(id);
            });
            if (ids.length === 0) return;

            // Заявка бывает и на напарника: в паре её подаёт один за двоих,
            // а состояние должны видеть оба
            var regs = await client.from('tournament_registrations')
                .select('tournament_id, status, partner_external_name, guest_confirmed')
                .or('player_id.eq.' + playerId + ',partner_id.eq.' + playerId)
                .in('tournament_id', ids);

            var byTournament = {};
            (regs.data || []).forEach(function(r) {
                // Снятую заявку не показываем: игрок вправе записаться снова
                if (r.status === 'withdrawn') return;
                byTournament[r.tournament_id] = r;
            });

            var labels = {
                approved: KSLT_YAZYK.выбрать('You are in the draw', 'Сиз негизги сеткадасыз', 'Вы в основной сетке'),
                draw: KSLT_YAZYK.выбрать('You are in the draw', 'Сиз негизги сеткадасыз', 'Вы в основной сетке'),
                pending: KSLT_YAZYK.выбрать('Entry sent', 'Арыз жөнөтүлдү', 'Заявка подана'),
                waitlist: KSLT_YAZYK.выбрать('On the waiting list', 'Күтүү тизмесинде', 'В листе ожидания'),
                rejected: KSLT_YAZYK.выбрать('Entry declined', 'Арыз четке кагылды', 'Заявка отклонена'),
                blocked: KSLT_YAZYK.выбрать('Not admitted', 'Уруксат жок', 'Не допущен')
            };
            var ждётГостя = KSLT_YAZYK.выбрать('Entry under review', 'Арыз каралууда', 'Заявка на рассмотрении');

            btns.forEach(function(btn) {
                var заявка = byTournament[idOf(btn)];
                if (!заявка) return;
                btn.disabled = true;
                // Вид состояния — общий на весь сайт, в style.css. Здесь только
                // выбираем, какое оно: раньше цвета жили в трёх местах и
                // расходились между карточкой и страницей турнира
                btn.classList.remove('btn-register', 'to-register', 'tc-btn', 'to-compact-regbtn');
                btn.classList.add('kslt-status');
                // Пара с неподтверждённым гостем ждёт решения менеджера — место
                // за ней держится, но говорить «вы в сетке» рано
                var ждёт = заявка.partner_external_name && !заявка.guest_confirmed;
                btn.textContent = ждёт ? ждётГостя : (labels[заявка.status] || labels.approved);

                // Цвет по смыслу: в сетке — наш лайм, ждёт решения или стоит в
                // очереди — янтарный, отказ — красный. Серым всё подряд читалось
                // как «кнопка выключена», и человек не понимал, что с ним
                if (заявка.status === 'rejected' || заявка.status === 'blocked') {
                    btn.classList.add('kslt-status-refused');
                } else if (ждёт || заявка.status === 'waitlist' || заявка.status === 'pending') {
                    btn.classList.add('kslt-status-wait');
                } else {
                    btn.classList.add('kslt-status-draw');
                }

                // Строка мест рядом со статусом сбивала с толку: «лист ожидания»
                // там про свободные места, а не про эту заявку
                var карточка = btn.closest('.tc, .to-compact, .to-featured, .tournament-card');
                if (карточка) {
                    карточка.querySelectorAll('.tc-slots, .to-compact-slots, .to-slots-tight')
                        .forEach(function(эл) { эл.style.display = 'none'; });
                }
            });
        } catch (e) {
            console.warn('[KSLT] mark registered:', e.message);
        }
    }

    window.KSLT_REG = {
        call: callRegister,
        предложитьВойти: предложитьВойти,
        markRegistered: markRegistered,
        resultText: resultText,
        showModal: showModal,
        confirm: confirmModal,
        notice: noticeModal,
        submit: submit
    };
})();
