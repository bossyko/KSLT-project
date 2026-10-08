// @ts-nocheck
// ============================================
// KSLT Admin — Utility Functions
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    /**
     * Sets up bulk-delete UI (checkboxes + delete button) for an admin table.
     * @param {{ tableId: string, tableName: string, confirmMsg?: string, reloadFn: function }} opts
     */
    function setupBulkDelete(opts) {
        var table = document.getElementById(opts.tableId);
        if (!table) return;

        // Guard: don't set up twice
        if (table.querySelector('.ad-bulk-all')) return;

        var thead = table.querySelector('thead tr');
        if (!thead) return;

        // Add checkbox header
        var thCheck = document.createElement('th');
        thCheck.style.width = '36px';
        thCheck.innerHTML = '<input type="checkbox" class="ad-bulk-all" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">';
        thead.insertBefore(thCheck, thead.firstChild);

        // Add bulk delete button (hidden initially)
        var btnWrap = document.createElement('div');
        btnWrap.className = 'ad-bulk-actions';
        btnWrap.style.display = 'none';
        btnWrap.innerHTML = '<button class="ad-btn ad-btn-danger ad-btn-sm ad-bulk-delete-btn">' + L.deleteSelected + ' (<span class="ad-bulk-count">0</span>)</button>';
        table.parentNode.parentNode.insertBefore(btnWrap, table.parentNode);

        var checkAll = thCheck.querySelector('.ad-bulk-all');
        var bulkBtn = btnWrap.querySelector('.ad-bulk-delete-btn');
        var countEl = btnWrap.querySelector('.ad-bulk-count');

        function updateBulkUI() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var total = table.querySelectorAll('tbody .ad-bulk-item');
            var count = checked.length;
            btnWrap.style.display = count > 0 ? 'flex' : 'none';
            countEl.textContent = count;
            checkAll.checked = total.length > 0 && count === total.length;
        }

        // Select all
        checkAll.addEventListener('change', function() {
            var boxes = table.querySelectorAll('tbody .ad-bulk-item');
            boxes.forEach(function(cb) { cb.checked = checkAll.checked; });
            updateBulkUI();
        });

        // Individual checkboxes (delegate)
        table.addEventListener('change', function(e) {
            if (e.target.classList.contains('ad-bulk-item')) {
                updateBulkUI();
            }
        });

        // Prevent row click when clicking checkbox
        table.addEventListener('click', function(e) {
            if (e.target.classList.contains('ad-bulk-item') || e.target.closest('.ad-bulk-cell')) {
                e.stopPropagation();
            }
        });

        // Bulk delete
        bulkBtn.addEventListener('click', function() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var ids = [];
            checked.forEach(function(cb) { ids.push(cb.dataset.bulkId); });
            if (ids.length === 0) return;

            showConfirm(opts.confirmMsg || L.deleteSelectedConfirm, L.deleteConfirmText, async function() {
                var result = await A.client.from(opts.tableName).delete().in('id', ids);
                if (result.error) {
                    showToast(result.error.message, 'error');
                } else {
                    showToast(isEn ? 'Deleted ' + ids.length + ' items' : 'Удалено: ' + ids.length, 'success');
                    opts.reloadFn();
                }
            });
        });
    }

    /**
     * Returns checkbox TD html for a row.
     */
    /**
     * Returns HTML for a bulk-select checkbox table cell.
     * @param {string} id - Row identifier
     * @returns {string} HTML string
     */
    function bulkCheckboxTd(id) {
        return '<td class="ad-bulk-cell" style="width:36px;text-align:center;">' +
            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
        '</td>';
    }

    /**
     * Transliterates Cyrillic text to Latin.
     * @param {string} text
     * @returns {string}
     */
    function transliterate(text) {
        /* ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: транслит живёт в
           js/court-address.js, потому что нужен и публичной странице —
           номер дома пишется «97Б». Здесь только вход для админки. */
        return window.KSLT_ADDRESS ? window.KSLT_ADDRESS.транслит(text) : (text || '');
    }


    /**
     * Улица по-английски: родовое слово ПЕРЕВОДИТСЯ, собственное имя
     * ТРАНСЛИТЕРИРУЕТСЯ, и родовое уезжает в конец.
     *
     *   «улица Ахунбаева»  → «Akhunbaeva St»    (а не «ulitsa Akhunbaeva»)
     *   «проспект Чуй»     → «Chuy Ave»
     *
     * Так пишут карты и так читает почта: в английском адресе тип улицы
     * стоит после имени и сокращается. «ulitsa Akhunbaeva» англоговорящий
     * прочтёт, но не узнает в нём улицу.
     *
     * РОДОВОГО СЛОВА НЕТ В СПИСКЕ — отдаём чистый транслит, то есть ровно
     * то, что было до этого списка. Словарь может отстать от жизни, и
     * отставание не должно ломать адрес.
     */
    var УЛИЧНЫЕ_СЛОВА = [
        // [что ищем в русском/кыргызском, чем заменяем в английском]
        [['улица', 'ул', 'көчөсү', 'көчө', 'көч'],              'St'],
        [['аллея', 'аллеясы'],                                  'Alley'],
        [['проспект', 'пр-т', 'пр-кт', 'пр', 'проспектиси'],    'Ave'],
        [['переулок', 'пер'],                                   'Ln'],
        [['бульвар', 'б-р'],                                    'Blvd'],
        [['шоссе'],                                             'Hwy'],
        [['площадь', 'пл'],                                     'Sq'],
        [['набережная', 'наб'],                                 'Emb'],
        [['микрорайон', 'мкр-н', 'мкр', 'м-н'],                 'Microdistrict']
    ];

    /* «с. Бостери», «г. Чолпон-Ата» — это не улица, а населённый пункт,
       положенный в поле улицы: так в базе у шести кортов из тридцати
       одного (замер 28.09). По-английски пишут одно имя, без «s.» и
       «g.» — их и сносим. */
    var НЕ_УЛИЦА = /^(с|село|г|город|пос|посёлок|поселок|айыл)\.?\s+/i;

    /* «12-й микрорайон» → «Microdistrict 12»: номер по-английски встаёт
       ПОСЛЕ названия единицы, а хвост «-й» латиницей — мусор «12-y» */
    var НОМЕР_ВПЕРЕДИ = /^(\d+)\s*-?\s*[а-яё]{0,3}\s*$/i;

    function streetEn(text) {
        var строка = (text || '').trim();
        if (!строка) return '';
        // Латиницу не трогаем: там уже написано по-английски
        if (!/[Ѐ-ӿ]/.test(строка)) return строка;
        строка = строка.replace(НЕ_УЛИЦА, '');

        for (var i = 0; i < УЛИЧНЫЕ_СЛОВА.length; i++) {
            var слова = УЛИЧНЫЕ_СЛОВА[i][0];
            var англ = УЛИЧНЫЕ_СЛОВА[i][1];
            for (var j = 0; j < слова.length; j++) {
                /* Слово ищем целиком и с любого края: «улица Ахунбаева»,
                   «Ахунбаева улица», «ул. Ахунбаева» — одно и то же место */
                var re = new RegExp('(^|\\s)' + слова[j] + '\\.?(\\s|$)', 'i');
                if (!re.test(строка)) continue;
                var имя = строка.replace(re, ' ').replace(/\s+/g, ' ').trim();
                if (!имя) break;   // «улица» без имени — оставляем как есть
                var номер = имя.match(НОМЕР_ВПЕРЕДИ);
                if (номер) return англ + ' ' + номер[1];
                return (transliterate(имя) + ' ' + англ).trim();
            }
        }
        return transliterate(строка);
    }

    /**
     * Creates a URL-friendly slug from Russian text.
     * @param {string} text
     * @returns {string}
     */
    function slugify(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.toLowerCase().split('').map(function(c) { return map[c] || c; }).join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    /**
     * Адрес страницы корта делается из названия и должен быть единственным
     * на весь сайт. Два корта с одним названием раньше упирались в отказ
     * базы: человек видел техническую ошибку про дубликат ключа.
     */
    async function uniqueCourtId(name) {
        var base = slugify(name) || 'court';
        if (!A.client) return base;

        var res = await A.client.from('courts').select('id').like('id', base + '%');
        if (res.error || !res.data || !res.data.length) return base;

        var taken = {};
        res.data.forEach(function(row) { taken[row.id] = true; });
        if (!taken[base]) return base;

        for (var n = 2; n < 100; n++) {
            if (!taken[base + '-' + n]) return base + '-' + n;
        }
        return base + '-' + Date.now();
    }

    /**
     * Escapes HTML entities (& " < >).
     * @param {*} str
     * @returns {string}
     */
    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    /**
     * Returns ' selected' attribute if article[field] === value.
     * @param {Object} article
     * @param {string} field
     * @param {*} value
     * @returns {string}
     */
    function sel(article, field, value) {
        return (article && article[field] === value) ? ' selected' : '';
    }

    /**
     * Converts ISO date string to local YYYY-MM-DDTHH:MM format.
     * @param {string} isoStr
     * @returns {string}
     */
    function formatDateLocal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        if (isNaN(d)) return '';
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    /**
     * Shows a toast notification (auto-dismiss 3s).
     * @param {string} message
     * @param {string} [type='success'] - 'success' | 'error' | 'warning' | 'info'
     */
    function showToast(message, type) {
        var existing = document.querySelector('.ad-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'ad-toast ad-toast-' + (type || 'success');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('ad-toast-show');
        });

        setTimeout(function() {
            toast.classList.remove('ad-toast-show');
            setTimeout(function() { toast.remove(); }, 400);
        }, 3000);
    }

    /**
     * Shows a confirm dialog modal.
     * @param {string} title
     * @param {string} text
     * @param {function} onConfirm - Called when user confirms
     * @param {string} [confirmLabel] - Custom confirm button text
     * @param {function} [onCancel] - Called when user cancels
     */
    /**
     * Окно подтверждения админки.
     *
     * @param {Object} [ещё] — средняя кнопка: { label, action }. Заведена
     *        для несохранённого черновика: там выбор не двоичный, а тройной —
     *        сохранить, уйти без сохранения, остаться. Отдельного окна для
     *        этого не делаем: одно определение на одно понятие.
     */
    /* Номер окна — чтобы `aria-labelledby` не указывал на чужой заголовок,
       когда окон за одну загрузку страницы открыли несколько. */
    var счётчикОкон = 0;

    /**
     * ОБОЛОЧКА ОКНА — ОДНА НА ВСЮ АДМИНКУ.
     *
     * Было двенадцать мест, создающих окно: три сборщика здесь и девять
     * рукодельных в разделах. Замер 04.10: `role="dialog"` и фокус были
     * ровно у одного из двенадцати, Esc — у двух. Одно понятие, двенадцать
     * определений — и беда рождается ровно на шве.
     *
     * Оболочка даёт: подложку, окно с `role`/`aria-modal`/уникальной
     * подписью, фокус внутрь, ЛОВУШКУ ФОКУСА (Tab не уходит под окно),
     * ВОЗВРАТ ФОКУСА тому, кто звал, Esc, клик мимо, одно окно за раз.
     * Тело и кнопки даёт зовущий — оболочка в них не лезет.
     *
     * @param {Object} о — {заголовок, тело, кнопки, широкое, слева, приЗакрытии}
     * @returns {{overlay: Element, окно: Element, тело: Element, закрыть: Function}}
     */
    function оболочкаОкна(о) {
        // Одно окно за раз. Иначе повторные нажатия складывают их стопкой:
        // закрываешь верхнее, под ним такое же — и кажется, что оно замерло
        document.querySelectorAll('.ad-confirm-overlay').forEach(function(el) { el.remove(); });

        /* КОМУ ВЕРНУТЬ ФОКУС. Окно забирает фокус себе, и после закрытия
           он обязан вернуться туда, откуда пришёл, — иначе клавиатура
           начинает обход страницы с начала. Если звавший элемент к тому
           времени стёрт перерисовкой раздела, отдаём фокус заголовку
           раздела: он есть всегда. */
        var звал = document.activeElement;

        var номерОкна = 'adConfirmTitle' + (++счётчикОкон);
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        /* ДВА ВХОДА, ОДНА ОБОЛОЧКА.
           `о.сырое` принимает ГОТОВУЮ разметку окна — ту, что девять
           рукодельных окон уже написали у себя. Так они получают `role`,
           фокус, ловушку и Esc, не переписывая ни строки своего тела:
           переписывание девяти разных тел за один заход — это девять
           поводов сломать работающее. Их вёрстка остаётся долгом и стоит
           в трекере числом, а не прячется.
           Остальные зовут по частям: заголовок, тело, кнопки. */
        overlay.innerHTML = о.сырое ||
            ('<div class="ad-confirm-modal' + (о.широкое ? ' ad-confirm-modal-wide' : '') +
                 '" role="dialog" aria-modal="true" ' +
                 'aria-labelledby="' + номерОкна + '" tabindex="-1"' +
                 (о.слева ? ' style="text-align:left;"' : '') + '>' +
                '<div class="ad-confirm-title" id="' + номерОкна + '">' + (о.заголовок || '') + '</div>' +
                '<div class="ad-confirm-text">' + (о.тело || '') + '</div>' +
                '<div class="ad-confirm-actions">' + (о.кнопки || '') + '</div>' +
            '</div>');
        document.body.appendChild(overlay);
        var окно = overlay.querySelector('.ad-confirm-modal');
        /* ГОТОВОЙ РАЗМЕТКЕ ДОСТАВЛЯЕМ ТО, ЧЕГО В НЕЙ НЕТ. Подпись диктору
           вешаем на её же заголовок — у окна он есть всегда. */
        if (окно && о.сырое) {
            окно.setAttribute('role', 'dialog');
            окно.setAttribute('aria-modal', 'true');
            окно.setAttribute('tabindex', '-1');
            var свойЗаголовок = окно.querySelector('.ad-confirm-title');
            if (свойЗаголовок) {
                if (!свойЗаголовок.id) свойЗаголовок.id = номерОкна;
                окно.setAttribute('aria-labelledby', свойЗаголовок.id);
            }
        }
        if (окно && окно.focus) окно.focus();

        var закрыто = false;
        function закрыть() {
            if (закрыто) return;
            закрыто = true;
            document.removeEventListener('keydown', поКлавише);
            overlay.remove();
            /* РАЗДЕЛЫ ПРЯЧУТСЯ КЛАССОМ, А НЕ СТИЛЕМ. Замер 04.10: в
               админке десять `.ad-section-title`, видим ОДИН, а мой
               селектор по `style*="display: none"` брал первый из десяти
               — скрытый, и фокус уезжал на `body`. Берём видимый.
               ВИДИМОСТЬ ПРОВЕРЯЕТСЯ ЗАМЕРОМ, А НЕ СЕЛЕКТОРОМ. */
            /* «ЕЩЁ В РАЗМЕТКЕ» НЕ ЗНАЧИТ «НА ЭКРАНЕ». Замер 04.10: окно
               звала кнопка из выпадающего меню; меню закрылось КЛАССОМ, и
               кнопка осталась в разметке, но невидимой. `focus()` на
               скрытом не делает ничего — фокус оставался на `body`.
               Спрашиваем про высоту, а не про присутствие. */
            var звалЖив = звал && document.body.contains(звал) &&
                          звал.getBoundingClientRect().height > 0;
            var куда = звалЖив ? звал : null;
            if (!куда) {
                куда = Array.prototype.slice
                    .call(document.querySelectorAll('.ad-section-title'))
                    .filter(function(э) { return э.getBoundingClientRect().height > 0; })[0] || null;
            }
            /* ЗАГОЛОВОК РАЗДЕЛА САМ ПО СЕБЕ ФОКУС НЕ БЕРЁТ. Замер 04.10:
               окно звала кнопка внутри меню, меню закрылось вместе с
               окном, запасным был заголовок — и фокус уехал на `body`,
               то есть обход начался с начала страницы. Даём заголовку
               `tabindex="-1"`: мышью он по-прежнему не фокусируется, а
               программно — да. */
            if (куда && куда.focus) {
                if (!куда.hasAttribute('tabindex') && !/^(A|BUTTON|INPUT|SELECT|TEXTAREA)$/.test(куда.tagName)) {
                    куда.setAttribute('tabindex', '-1');
                }
                try { куда.focus(); } catch (e) {}
            }
            if (о.приЗакрытии) о.приЗакрытии();
        }

        /* ВЫЙТИ БЕЗ ДЕЙСТВИЯ МОЖНО С КЛАВИАТУРЫ, И TAB НЕ УХОДИТ ПОД ОКНО.
           Ловушка нужна не для красоты: под окном лежит вся страница с
           кнопками, которые меняют данные, и слепой обход по ней из
           открытого окна — это нажатие вслепую. */
        function поКлавише(e) {
            if (e.key === 'Escape') { закрыть(); return; }
            if (e.key !== 'Tab') return;
            var куда = окно.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]),' +
                ' textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
            if (!куда.length) { e.preventDefault(); окно.focus(); return; }
            var первый = куда[0], последний = куда[куда.length - 1];
            if (!окно.contains(document.activeElement)) { e.preventDefault(); первый.focus(); return; }
            if (e.shiftKey && document.activeElement === первый) { e.preventDefault(); последний.focus(); }
            else if (!e.shiftKey && document.activeElement === последний) { e.preventDefault(); первый.focus(); }
        }
        document.addEventListener('keydown', поКлавише);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) закрыть(); });

        return { overlay: overlay, окно: окно,
                 тело: overlay.querySelector('.ad-confirm-text'), закрыть: закрыть };
    }

    function showConfirm(title, text, onConfirm, confirmLabel, onCancel, ещё) {
        /* `ещё` принимает и одну кнопку, и список: старые двадцать с лишним
           вызовов передают объект, и переписывать их ради новой — значит
           трогать то, что работает. */
        var добавочные = !ещё ? [] : (Array.isArray(ещё) ? ещё : [ещё]);

        var btnLabel = confirmLabel || L.delete;
        var btnClass = confirmLabel ? 'ad-btn-primary' : 'ad-btn-danger';

        /* ОКНО СТРОИТ ОБОЛОЧКА, А НЕ ЭТОТ СБОРЩИК. Здесь остаются только
           кнопки и то, что они делают: подложка, край, подпись диктору,
           фокус, ловушка, Esc и клик мимо — её работа, одна на админку. */
        var окноГот = оболочкаОкна({
            заголовок: title,
            тело: text,
            кнопки:
                '<button class="ad-btn ad-btn-secondary ad-confirm-cancel" id="adConfirmCancel">' + L.cancel + '</button>' +
                /* ДОПОЛНИТЕЛЬНЫХ ДЕЙСТВИЙ БЫВАЕТ НЕСКОЛЬКО, И ОНИ УМЕЮТ
                   БЫТЬ ОПАСНЫМИ. Было одно, и всегда такое же серое, как
                   «Отмена»: в окне решения по заявке рядом стояли два
                   одинаковых на вид действия — безобидное закрытие и
                   необратимый отказ. Замер 30.09: обе rgba(255,255,255,.72).
                   У заявки исходов три — снять, отклонить, одобрить, —
                   и все три обязаны стоять в одном окне. Решение Кости. */
                добавочные.map(function(д, и) {
                    return '<button class="ad-btn ' + (д.опасная ? 'ad-btn-danger' : 'ad-btn-secondary') +
                           '" data-dop="' + и + '">' + д.label + '</button>';
                }).join('') +
                '<button class="ad-btn ' + btnClass + '" id="adConfirmOk">' + btnLabel + '</button>',
            приЗакрытии: onCancel
        });
        var overlay = окноГот.overlay;

        overlay.querySelector('#adConfirmCancel').addEventListener('click', окноГот.закрыть);
        // Ошибку внутри действия надо показать, а не проглотить: раньше окно
        // просто оставалось на экране и выглядело замершим — «кнопка не
        // реагирует», хотя на самом деле код упал
        overlay.querySelector('#adConfirmOk').addEventListener('click', async function() {
            // Кнопку гасим сразу: два быстрых нажатия запускали действие дважды.
            // На жеребьёвке это стоило дорого — две раскладки складывались в
            // одну сетку, и пары оказывались сразу в двух группах
            if (this.disabled) return;
            this.disabled = true;
            try {
                await onConfirm();
            } catch (e) {
                console.error('[KSLT] действие не выполнилось:', e);
                showToast((e && e.message) || 'Не удалось выполнить действие', 'error');
            }
            overlay.remove();
        });
        overlay.querySelectorAll('[data-dop]').forEach(function(кн) {
            кн.addEventListener('click', async function() {
                if (this.disabled) return;
                this.disabled = true;
                try {
                    await добавочные[Number(this.dataset.dop)].action();
                } catch (e) {
                    console.error('[KSLT] действие не выполнилось:', e);
                    showToast((e && e.message) || 'Не удалось выполнить действие', 'error');
                }
                overlay.remove();
            });
        });
    }

    /**
     * Окно-сообщение с одной кнопкой — в оформлении админки.
     *
     * Для случаев, где выбирать нечего, а всплывашка слишком мимолётна:
     * например, заявка ушла в лист ожидания, и это надо заметить.
     */
    /**
     * @param {string} вид — 'info' (по умолчанию) или 'warn'. Предупреждение
     *        рисуем красным: лаймовый в админке означает «всё хорошо, жми»,
     *        и на отказе он читается как приглашение продолжить.
     */
    function showNotice(title, text, okLabel, вид) {
        /* ТА ЖЕ ОБОЛОЧКА. До 04.10 у этого окна не было ни `role`, ни
           фокуса, ни Esc: чинили только `showConfirm`, а сообщение
           осталось как было. */
        var окноГот = оболочкаОкна({
            заголовок: title,
            тело: text,
            кнопки: '<button class="ad-btn ' + (вид === 'warn' ? 'ad-btn-danger' : 'ad-btn-primary') +
                    '" id="adNoticeOk">' + (okLabel || (L.ok || 'Понятно')) + '</button>'
        });
        if (вид === 'warn') окноГот.окно.classList.add('ad-confirm-warn');
        окноГот.overlay.querySelector('#adNoticeOk').addEventListener('click', окноГот.закрыть);
    }

    /**
     * Окно с полем ввода — в оформлении админки.
     *
     * Заменяет prompt(): тот рисуется браузером, выглядит на каждом по-своему
     * и выбивается из вида сайта.
     *
     * @returns {Promise<string|null>} введённое значение или null, если отменили
     */
    function showPromptAsync(opts) {
        return new Promise(function(resolve) {
            /* ТА ЖЕ ОБОЛОЧКА. Esc и клик мимо тут были и раньше, а вот
               `role`, подписи диктору и ловушки фокуса — не было. */
            var готово = false;
            function finish(value) {
                if (готово) return;
                готово = true;
                окноГот.закрыть();
                resolve(value);
            }
            var окноГот = оболочкаОкна({
                заголовок: opts.title || '',
                тело: (opts.text ? '<div class="ad-confirm-text">' + opts.text + '</div>' : '') +
                      '<input type="text" class="ad-field-input" id="adPromptInput" ' +
                          'placeholder="' + (opts.placeholder || '') + '" ' +
                          'value="' + (opts.value || '') + '">',
                кнопки:
                    '<button class="ad-btn ad-btn-secondary" id="adPromptCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-primary" id="adPromptOk">' + (opts.okLabel || L.confirm || 'OK') + '</button>',
                приЗакрытии: function() { if (!готово) { готово = true; resolve(null); } }
            });

            var overlay = окноГот.overlay;
            var input = overlay.querySelector('#adPromptInput');
            /* ФОКУС В ПОЛЕ, А НЕ В ОКНО: тут вводят, и первое нажатие
               клавиши должно попасть в поле. Это единственное окно, где
               фокус уезжает с самого окна — потому и сказано вслух. */
            if (input) input.focus();

            overlay.querySelector('#adPromptCancel').addEventListener('click', function() { finish(null); });
            overlay.querySelector('#adPromptOk').addEventListener('click', function() { finish(input.value.trim() || ''); });
            input.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') finish(input.value.trim() || '');
            });
        });
    }

    /**
     * Promise-based confirm dialog.
     * @param {string} title
     * @param {string} [text]
     * @param {string} [confirmLabel]
     * @returns {Promise<boolean>}
     */
    function showConfirmAsync(title, text, confirmLabel) {
        return new Promise(function(resolve) {
            showConfirm(
                title,
                text || '',
                function() { resolve(true); },
                confirmLabel || L.confirm || 'OK',
                function() { resolve(false); }
            );
        });
    }

    // ---- Translation (MyMemory API, free, no key) ----

    /**
     * Auto-translates filled form fields to empty ones using MyMemory API.
     * @param {string} ruId - Russian field input ID
     * @param {string} enId - English field input ID
     * @param {string} [kgId] - Kyrgyz field input ID
     * @param {HTMLButtonElement} btn - Trigger button (for loading state)
     */
    async function translateToEmpty(ruId, enId, kgId, btn) {
        var ruEl = document.getElementById(ruId);
        var enEl = document.getElementById(enId);
        var kgEl = kgId ? document.getElementById(kgId) : null;

        var ruVal = ruEl ? ruEl.value.trim() : '';
        var enVal = enEl ? enEl.value.trim() : '';
        var kgVal = kgEl ? kgEl.value.trim() : '';

        // Detect active language tab — translate FROM the currently visible tab
        var activeLang = '';
        var card = btn.closest('.ad-form-card');
        if (card) {
            var activeTab = card.querySelector('.ad-lang-tab.active');
            if (activeTab) activeLang = activeTab.dataset.lang;
        }

        // Find source: active tab first, then first non-empty
        var srcLang = '';
        var srcText = '';
        if (activeLang === 'ru' && ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (activeLang === 'en' && enVal) { srcLang = 'en'; srcText = enVal; }
        else if (activeLang === 'kg' && kgVal) { srcLang = 'kg'; srcText = kgVal; }
        else if (ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (enVal) { srcLang = 'en'; srcText = enVal; }
        else if (kgVal) { srcLang = 'kg'; srcText = kgVal; }

        if (!srcText) {
            showToast(L.fillRuFirst, 'error');
            return;
        }

        // Поле считается требующим перевода, если оно пустое, если в нём лежит
        // копия исходника (так бывало после неудачного перевода) или если
        // исходный текст изменился после того, как перевод сделали: иначе
        // правку в русском приходилось разносить руками, вычищая каждый язык.
        function needsTranslation(el, val) {
            if (!val || val === srcText) return true;
            var was = el.dataset.translatedFrom;
            return !!was && was !== srcText;
        }

        var targets = [];
        if (ruEl && srcLang !== 'ru' && needsTranslation(ruEl, ruVal)) targets.push({ el: ruEl, lang: 'ru' });
        if (enEl && srcLang !== 'en' && needsTranslation(enEl, enVal)) targets.push({ el: enEl, lang: 'en' });
        if (kgEl && srcLang !== 'kg' && needsTranslation(kgEl, kgVal)) targets.push({ el: kgEl, lang: 'kg' });

        if (targets.length === 0) {
            // Всё заполнено и исходник с тех пор не менялся — спрашиваем,
            // а не отказываем: у человека может быть своя причина
            var again = confirm(isEn
                ? 'Translations are already filled. Translate again and overwrite them?'
                : 'Переводы уже заполнены. Перевести заново и заменить их?');
            if (!again) return;
            if (enEl && srcLang !== 'en') targets.push({ el: enEl, lang: 'en' });
            if (kgEl && srcLang !== 'kg') targets.push({ el: kgEl, lang: 'kg' });
            if (ruEl && srcLang !== 'ru') targets.push({ el: ruEl, lang: 'ru' });
        }

        var origLabel = btn.textContent;
        btn.textContent = L.translating;
        btn.disabled = true;

        try {
            var failed = [];
            for (var i = 0; i < targets.length; i++) {
                var result = await translateText(srcText, srcLang, targets[i].lang);
                // Сервис при отказе возвращает исходную строку. Записать её —
                // значит выдать непереведённое за перевод, поэтому пропускаем.
                if (!result || result === srcText) {
                    failed.push(targets[i].lang.toUpperCase());
                    continue;
                }
                targets[i].el.value = result;
                targets[i].el.dataset.translatedFrom = srcText;   // чтобы заметить правку исходника
                // Над полем может стоять визуальный редактор — пусть перерисуется
                targets[i].el.dispatchEvent(new Event('change'));
                /* И «input» — иначе раздел не узнаёт, что в черновике
                   появилось несохранённое: присваивание value события не
                   рождает, а сторож ухода со страницы слушает именно input.
                   Перевёл, ушёл — и перевод пропадал молча */
                targets[i].el.dispatchEvent(new Event('input', { bubbles: true }));
            }
            if (failed.length === targets.length) {
                var why = A.lastTranslateError === 'quota'
                    ? (isEn ? 'Daily free translation limit reached. It resets in a few hours — or fill the fields manually.'
                            : 'Дневной лимит бесплатных переводов исчерпан. Он обновится через несколько часов — или заполните поля вручную.')
                    : (isEn ? 'Translation service did not respond. Fields left empty.'
                            : 'Сервис перевода не ответил. Поля оставлены пустыми — переведите вручную.');
                showToast(why, 'error');
            } else if (failed.length) {
                showToast((isEn ? 'Not translated: ' : 'Не переведено: ') + failed.join(', '), 'warning');
            }
        } catch (e) {
            showToast(L.translateError, 'error');
        }

        btn.textContent = origLabel;
        btn.disabled = false;

        // Переводить больше нечего — гасим кнопку. Загорится снова, когда
        // исходный текст поправят: следит за этим watchSource, один на всю
        // админку. Раньше кнопка оставалась живой всегда, и было непонятно,
        // сработала она или нет
        settleTranslateButton(btn, [ruEl, enEl, kgEl]);
    }

    /**
     * Погасить кнопку перевода, когда все языки заполнены, и зажечь её
     * обратно, как только исходный текст изменят.
     *
     * Живёт в одном месте и применяется ко всем кнопкам админки: раньше
     * каждый раздел решал это сам, и вели они себя по-разному.
     */
    function settleTranslateButton(btn, fields) {
        var live = fields.filter(Boolean);
        if (!live.length) return;

        var filled = live.every(function (el) { return el.value.trim(); });
        if (!filled) return;

        btn.disabled = true;
        btn.classList.add('is-done');
        var doneLabel = isEn ? 'Translated' : 'Переведено';
        var was = btn.textContent;
        btn.textContent = '\u2713 ' + doneLabel;

        // Правка в любом из полей означает, что перевод устарел
        function wake() {
            btn.disabled = false;
            btn.classList.remove('is-done');
            btn.textContent = was;
            live.forEach(function (el) { el.removeEventListener('input', wake); });
        }
        live.forEach(function (el) { el.addEventListener('input', wake); });
    }

    /**
     * Погасить кнопки перевода, у которых переводить уже нечего.
     *
     * settleTranslateButton вызывалась только в конце самого перевода,
     * поэтому после сохранения и перерисовки формы все кнопки загорались
     * заново — будто ничего не переведено. Теперь состояние кнопки
     * выводится из полей при каждой отрисовке, а не помнится с прошлого
     * нажатия: состояние кнопки — свойство данных, а не разметки.
     *
     * @param {Element} [root] — где искать кнопки, по умолчанию весь документ
     */
    function settleTranslateButtons(root) {
        var где = root || document;
        где.querySelectorAll('.ad-btn-translate-all[data-ru]').forEach(function(btn) {
            var поля = [btn.dataset.ru, btn.dataset.en, btn.dataset.kg]
                .map(function(id) { return id ? document.getElementById(id) : null; });
            settleTranslateButton(btn, поля);
        });
    }

    /**
     * Translates Russian text to target language.
     * @param {string} text
     * @param {string} targetLang - 'ru' | 'en' | 'kg'
     * @returns {Promise<string>}
     */
    async function translateFromRu(text, targetLang) {
        return translateText(text, 'ru', targetLang);
    }

    /**
     * Translates text via MyMemory API with chunking for long strings.
     * @param {string} text
     * @param {string} fromLang - Source language code
     * @param {string} toLang - Target language code
     * @returns {Promise<string>}
     */
    async function translateText(text, fromLang, toLang) {
        var langMap = { ru: 'ru', en: 'en', kg: 'ky' };
        var from = langMap[fromLang] || fromLang;
        var to = langMap[toLang] || toLang;

        // Почта в запросе поднимает дневной лимит сервиса с пяти тысяч слов
        // до пятидесяти. Регистрироваться не нужно — достаточно передавать
        // рабочий адрес, MyMemory считает квоту по нему.
        var CONTACT_EMAIL = 'kslt.kyrgyzstan@gmail.com';

        // У сервиса жёсткий предел в 500 знаков на запрос. Раньше текст резался
        // только по переносам строк, и абзац длиннее предела уезжал целиком —
        // в ответ приходило «QUERY LENGTH LIMIT EXCEEDED», которое попадало
        // в поле вместо перевода. Теперь длинные куски дробим по предложениям.
        var LIMIT = 450;

        function splitLong(piece) {
            if (piece.length <= LIMIT) return [piece];
            var parts = [];
            var rest = piece;
            while (rest.length > LIMIT) {
                var cut = rest.lastIndexOf('. ', LIMIT);
                if (cut < LIMIT / 2) cut = rest.lastIndexOf(' ', LIMIT);
                if (cut < 1) cut = LIMIT;
                parts.push(rest.slice(0, cut + 1).trim());
                rest = rest.slice(cut + 1);
            }
            if (rest.trim()) parts.push(rest.trim());
            return parts;
        }

        var chunks = [];
        var current = '';
        text.split('\n').forEach(function(line) {
            splitLong(line).forEach(function(piece) {
                var next = current ? current + '\n' + piece : piece;
                if (next.length > LIMIT && current) {
                    chunks.push(current);
                    current = piece;
                } else {
                    current = next;
                }
            });
        });
        if (current) chunks.push(current);

        // Сервис отвечает своими сообщениями прямо в поле перевода: про лимит
        // запроса, про исчерпанную дневную квоту, про неизвестный язык.
        // Раз это не перевод, в текст новости оно попасть не должно.
        var SERVICE_ERROR = /QUERY LENGTH LIMIT EXCEEDED|MYMEMORY WARNING|YOU USED ALL AVAILABLE FREE TRANSLATIONS|INVALID (SOURCE|TARGET) LANGUAGE|PLEASE SELECT TWO DISTINCT LANGUAGES/i;
        var QUOTA_ERROR = /YOU USED ALL AVAILABLE FREE TRANSLATIONS/i;

        var results = [];
        for (var j = 0; j < chunks.length; j++) {
            var url = 'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(chunks[j]) + '&langpair=' + from + '|' + to +
                '&de=' + encodeURIComponent(CONTACT_EMAIL);
            try {
                var resp = await fetch(url);
                var data = await resp.json();
                var out = data.responseData && data.responseData.translatedText;
                if (!out || SERVICE_ERROR.test(out) || Number(data.responseStatus) !== 200) {
                    A.lastTranslateError = QUOTA_ERROR.test(out || '') ? 'quota' : 'service';
                    return text;      // отдаём исходник — вызывающий код поймёт, что не вышло
                }
                results.push(out);
            } catch (e) {
                A.lastTranslateError = 'network';
                return text;
            }
        }

        A.lastTranslateError = '';
        return results.join('\n');
    }


    /**
     * Compresses an image file using canvas.
     * @param {File} file - Original file
     * @param {number} maxWidth - Max width in px
     * @param {number} quality - JPEG quality 0-1
     * @returns {Promise<{blob: Blob, ext: string}>}
     */
    function compressImage(file, maxWidth, quality) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                var w = img.width;
                var h = img.height;
                if (w > maxWidth) {
                    h = Math.round(h * maxWidth / w);
                    w = maxWidth;
                }
                var canvas = document.createElement('canvas');
                canvas.width = w;
                canvas.height = h;
                var ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(function(blob) {
                    if (blob) {
                        resolve({ blob: blob, ext: 'jpg' });
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                }, 'image/jpeg', quality);
                URL.revokeObjectURL(img.src);
            };
            img.onerror = function() {
                URL.revokeObjectURL(img.src);
                reject(new Error('Image load failed'));
            };
            img.src = URL.createObjectURL(file);
        });
    }

    var MAX_FILE_SIZE = 5 * 1024 * 1024;      // 5 MB hard limit
    var COMPRESS_THRESHOLD = 500 * 1024;        // compress if > 500 KB
    var COMPRESS_MAX_WIDTH = 1200;              // resize to 1200px width
    var COMPRESS_QUALITY = 0.82;                // JPEG quality 82%

    /**
     * Uploads an image to Supabase Storage (news bucket).
     * Auto-compresses large images (>500KB → 1200px, quality 82%).
     * @param {File} file - The file to upload
     * @param {string} prefix - Filename prefix (e.g. 'news-', 'coach-')
     * @returns {Promise<string|null>} Public URL or null on failure
     */
    async function uploadImage(file, prefix) {
        if (!A.client || !file) return null;

        // Validate format
        // SVG нужен логотипам: у компаний они почти всегда векторные, а
        // растровая копия на экранах с высокой плотностью выглядит мыльной
        var allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
        if (allowed.indexOf(file.type) === -1) {
            showToast(L.uploadFormatError || 'Формат: JPEG, PNG, WebP, GIF, SVG', 'error');
            return null;
        }

        // Hard size limit (before compression)
        if (file.size > MAX_FILE_SIZE) {
            showToast(L.uploadSizeError || 'Макс. размер файла: 5 МБ', 'error');
            return null;
        }

        var uploadBlob = file;
        var ext = file.name.split('.').pop().toLowerCase();

        // Auto-compress if > 500 KB
        // Вектор сжимать нечем: холст превратил бы его в растр и потерял
        // главное достоинство — чёткость на любом размере
        if (file.size > COMPRESS_THRESHOLD && file.type !== 'image/gif' && file.type !== 'image/svg+xml') {
            try {
                var compressed = await compressImage(file, COMPRESS_MAX_WIDTH, COMPRESS_QUALITY);
                uploadBlob = compressed.blob;
                ext = compressed.ext;
                var saved = Math.round((1 - uploadBlob.size / file.size) * 100);
                if (saved > 5) {
                    showToast((L.imageCompressed || 'Сжато') + ': ' + formatBytes(file.size) + ' → ' + formatBytes(uploadBlob.size) + ' (-' + saved + '%)');
                }
            } catch (e) {
                // Compression failed — upload original
            }
        }

        var filename = (prefix || '') + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;
        try {
            var result = await A.client.storage.from('news').upload(filename, uploadBlob, {
                // Имя файла случайное и не переиспользуется: по одному адресу
                // всегда одна и та же картинка, поэтому кэшируем надолго.
                // С часовым сроком фотографии новостей скачивались заново по
                // несколько раз в день у каждого читателя.
                cacheControl: '31536000',
                upsert: false,
                contentType: 'image/' + (ext === 'jpg' ? 'jpeg' : ext)
            });
            if (result.error) {
                showToast('Storage: ' + (result.error.message || result.error.statusCode || JSON.stringify(result.error)), 'error');
                return null;
            }
            var urlResult = A.client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    function formatBytes(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    /**
     * Exports data as a CSV file download (UTF-8 BOM for Excel).
     * @param {string} filename
     * @param {string[]} headers
     * @param {Array<Array<*>>} rows
     */
    function exportCsv(filename, headers, rows) {
        var BOM = '\uFEFF';
        var csvRows = [];
        csvRows.push(headers.map(csvCell).join(','));
        for (var i = 0; i < rows.length; i++) {
            csvRows.push(rows[i].map(csvCell).join(','));
        }
        var csvString = BOM + csvRows.join('\r\n');
        var blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    /**
     * Escapes and quotes a CSV cell value.
     * @param {*} val
     * @returns {string}
     */
    function csvCell(val) {
        var s = val === null || val === undefined ? '' : String(val);
        if (s.indexOf('"') !== -1 || s.indexOf(',') !== -1 || s.indexOf('\n') !== -1 || s.indexOf('\r') !== -1) {
            return '"' + s.replace(/"/g, '""') + '"';
        }
        return s;
    }

    // ---- Export to namespace ----
    A.showToast = showToast;
    /* ОБОЛОЧКА ОТДАЁТСЯ РАЗДЕЛАМ. Девять окон в разделах строились
       руками; теперь берут её — и `role`, фокус, ловушка и Esc у них
       те же, что у сборщиков. */
    A.оболочкаОкна = оболочкаОкна;
    A.showConfirm = showConfirm;
    A.showNotice = showNotice;
    A.showConfirmAsync = showConfirmAsync;
    A.showPromptAsync = showPromptAsync;

    /**
     * Приводит текст новости к нашей разметке.
     *
     * Менеджер пишет в обычное поле: может набрать простой текст, а может
     * вставить из Word или Телеграма — тогда прилетают инлайновые цвета, белый
     * фон и всё подряд в <strong>. На тёмной теме это выглядит как белые плашки
     * поверх страницы. Здесь остаются только абзацы, переносы, ссылки и списки,
     * а простой текст сам раскладывается по абзацам.
     *
     * @param {string} html
     * @returns {string}
     */
    /**
     * ЧИСТКА СРЕЗАЛА НАШИ ЖЕ КЛАССЫ — найдено чтением 08.10.
     *
     * Редактор ставит кадру `news-video news-video-ig`, а сохранение тут же
     * выбрасывало `class="..."` целиком — вместе с ним. В базе лежат голые
     * iframe, и правило вертикального кадра не применялось НИКОГДА:
     * инстаграмовский ролик 9:16 показывался в коробке 16:9, с полосой
     * прокрутки внутри. БЕДА РОДИЛАСЬ РОВНО НА ШВЕ.
     *
     * Оставляем только СВОИ классы — те, что начинаются на `news-`. Всё
     * чужое (вставка из Word, Google Docs, сайтов) по-прежнему уходит.
     */
    /**
     * Служебное из редактора в базу не уезжает: кнопка снятия и щит поверх
     * кадра живут только в редакторе. Без этого они попали бы в текст
     * новости и вылезли бы на сайте.
     */
    function убратьСлужебное(h) {
        return String(h)
            /* ПО ПРИЗНАКУ, А НЕ ПО КЛАССУ. Класс срезает соседняя чистка, и
               если искать по нему, то после первого же круга кнопка теряет
               класс, перестаёт находиться — а редактор, не видя её, рисует
               ВТОРУЮ. Замер 08.10: в редакторе оказалось ДЕСЯТЬ кнопок на
               пять кусков. В тексте новости кнопок не бывает вовсе, поэтому
               снимаем их все. */
            .replace(/<button[\s\S]*?<\/button>/gi, '')
            .replace(/<span[^>]*class="ad-editor-media-shchit"[^>]*>\s*<\/span>/gi, '')
            .replace(/<span><\/span>/gi, '')
            .replace(/\s*contenteditable="[^"]*"/gi, '')
            .replace(/\s*class="ad-editor-media"/gi, '');
    }

    function оставитьСвоиКлассы(h) {
        return String(h).replace(/\s*class="([^"]*)"/gi, function(всё, классы) {
            var свои = классы.split(/\s+/).filter(function(к) { return /^news-/.test(к); });
            return свои.length ? ' class="' + свои.join(' ') + '"' : '';
        });
    }

    function cleanNewsHtml(html) {
        if (!html) return '';
        var h = String(html).trim();

        // Текст без единого тега — раскладываем по пустым строкам
        if (!/<[a-z][\s\S]*>/i.test(h)) {
            return h.split(/\n\s*\n/)
                .map(function(block) { return block.trim(); })
                .filter(Boolean)
                .map(function(block) { return '<p>' + block.replace(/\n/g, '<br>') + '</p>'; })
                .join('');
        }

        h = h.replace(/\s*style="[^"]*"/gi, '');
        h = убратьСлужебное(h);
        h = оставитьСвоиКлассы(h);
        h = h.replace(/<\/?span[^>]*>/gi, '');
        h = h.replace(/<\/?(?:strong|b)[^>]*>/gi, '');
        h = h.replace(/<\/?font[^>]*>/gi, '');
        h = h.replace(/<p>(?:\s|&nbsp;|<br\s*\/?>)*<\/p>/gi, '');
        h = h.replace(/(?:<br\s*\/?>\s*){3,}/gi, '<br><br>');
        h = h.replace(/&nbsp;/g, ' ');
        h = h.replace(/<p>\s+/gi, '<p>').replace(/\s+<\/p>/gi, '</p>');
        return h.trim();
    }


    /**
     * Чистка при сохранении — мягкая.
     *
     * Жирный, курсив и пустые строки между абзацами ставит сам менеджер в
     * редакторе, и сохранение не вправе их выбрасывать: текст после кнопки
     * «Сохранить» должен выглядеть так же, как до неё. Вычищаем только то,
     * что приносит вставка из Word: инлайновые цвета, фоны, шрифты и обёртки.
     *
     * @param {string} html
     * @returns {string}
     */
    function cleanNewsHtmlOnSave(html) {
        if (!html) return '';
        var h = String(html).trim();

        // Простой текст без единого тега — раскладываем по абзацам
        if (!/<[a-z][\s\S]*>/i.test(h)) return cleanNewsHtml(h);

        h = h.replace(/\s*style="[^"]*"/gi, '');
        h = убратьСлужебное(h);
        h = оставитьСвоиКлассы(h);
        h = h.replace(/<\/?span[^>]*>/gi, '');
        h = h.replace(/<\/?font[^>]*>/gi, '');
        h = h.replace(/<div>/gi, '<p>').replace(/<\/div>/gi, '</p>');
        h = h.replace(/&nbsp;/g, ' ');
        return h.trim();
    }

    /**
     * Категория, которая не начисляет очки.
     *
     * Одно определение на одно понятие: от неё зависит и показ «Уровня
     * турнира» в форме, и наличие вкладки «Результаты». Стояло двумя
     * копиями — поймал прувер заморозки 28.09.
     */
    /**
     * ПОЛОСА ВКЛАДОК ТУРНИРА — ОДНА НА ОБА ПУТИ.
     *
     * Было два определения: форма (`tournaments.js:780`) и сетка
     * (`bracket.js:2654`). Беда родилась ровно на шве — у формы вкладки
     * «Новости» не было ВОВСЕ, и открыв турнир кликом из списка, её не
     * видел никто. Замер 04.10: из списка пять вкладок, по прямой ссылке
     * шесть, статус турнира `completed` в обоих случаях.
     *
     * СОСТАВ ВКЛАДОК — ПРОИЗВОДНОЕ ОТ ТУРНИРА, А НЕ ОТ МАРШРУТА. Маршрут
     * решает, какая вкладка ОТКРЫТА, и только это.
     *
     * @param {Object} о — { турнир, активная, заявок, новый }
     *   турнир  — запись турнира (или null для нового);
     *   активная— ключ открытой вкладки ('edit' | 'regs' | ...);
     *   заявок  — число для счётчика у «Заявок» (не передали — без него);
     *   новый   — турнир ещё не сохранён: кроме «Редактирования» всё закрыто.
     * @returns {string} html полосы
     */
    A.полосаВкладокТурнира = function(о) {
        var т = о.турнир || null;
        var естьЗапись = !о.новый && !!(т && т.id);
        var естьСетка = естьЗапись && !!t_поле(т, 'bracket_type');
        var завершён = естьЗапись && t_поле(т, 'status') === 'completed';
        var безОчков = t_поле(т, 'category_id')
            ? A.безОчковЗаКатегорию(t_поле(т, 'category_id')) : false;
        var группами = t_поле(т, 'bracket_type') === 'round_robin' ||
                       t_поле(т, 'bracket_type') === 'group_league';

        function вкладка(ключ, подпись, доступна) {
            var классы = 'ad-tab' + (о.активная === ключ ? ' active' : '') +
                         (доступна ? '' : ' disabled');
            return '<button class="' + классы + '"' +
                   (доступна ? ' data-trn-nav="' + ключ + '"' : ' disabled') + '>' +
                   подпись + '</button>';
        }

        var подписьЗаявок = L.trnTabRegs + (typeof о.заявок === 'number'
            ? ' <span class="ad-badge">' + (t_поле(т, 'max_participants') || '?') +
              '/' + о.заявок + '</span>' : '');

        return '<div class="ad-tabs ad-trn-nav-tabs">' +
            вкладка('edit', L.trnTabEdit, true) +
            вкладка('regs', подписьЗаявок, естьЗапись) +
            вкладка('bracket', группами ? L.groupLabel : L.trnTabBracket, естьСетка) +
            вкладка('schedule', L.trnTabSchedule, естьСетка) +
            /* Дружеский и прочие без очков за категорию: вкладки
               «Результаты» у них нет — начислять нечего. */
            (безОчков ? '' : вкладка('points', L.trnTabPoints, естьЗапись)) +
            /* Новость пишут по итогам, поэтому вкладка только у
               завершённого. Раньше этого условия не знала форма. */
            (завершён ? вкладка('news', '\uD83D\uDCF0 ' + L.trnTabNews, true) : '') +
        '</div>';
    };

    /** Поле турнира, не падая на null. */
    function t_поле(т, имя) { return т && т[имя] !== undefined ? т[имя] : null; }

    /**
     * ПОЛОСА ДЕЙСТВИЙ ТУРНИРА — ОДНО ОПРЕДЕЛЕНИЕ НА ЧЕТЫРЕ РАСКЛАДКИ.
     *
     * До 06.10 кнопка завершения была объявлена ЧЕТЫРЕ раза, и все четыре
     * вели себя по-разному: групповая показывала её всегда и гасила, три
     * остальные прятали вовсе; «Турнир завершён» было только у олимпийки и
     * «всех мест», а у групповой и у лиг завершённый турнир не говорил о
     * себе НИЧЕГО — под сеткой оставалось пустое место. Костя 06.10:
     * «после завершения турнира не понятно что можно тут».
     *
     * Состояний три, и они взаимоисключающие:
     *   · завершён       — говорим об этом и даём пересчёт;
     *   · всё сыграно    — даём завершить;
     *   · сыграно не всё — кнопка на месте, но погашена, и рядом сказано,
     *                      сколько счетов осталось записать.
     *
     * ПОГАСАНИЕ ВИСИТ НА `[disabled]`, А НЕ ВТОРЫМ СПОСОБОМ СКАЗАТЬ ТО ЖЕ.
     * Обёртку выбирает вызывающий: у групповой и у лиг это `ad-brk-actions`,
     * у олимпийки и «всех мест» — `ad-brk-btn-row`. Геометрию, принятую
     * Костей, правка не трогает: меняется СОСТАВ полосы, а не её коробка.
     *
     * @param {Object} о  { завершён, всёСыграно, незаписано, подписи, обёртка, широкая }
     */
    A.полосаЗавершения = function(о) {
        о = о || {};
        var L = о.подписи || {};
        var обёртка = о.обёртка || 'ad-brk-actions';
        var незаписано = о.незаписано || 0;
        var пояснение = (L.finalizeLeft || '').replace('{n}', незаписано);

        if (о.завершён) {
            return '<div class="ad-brk-done">' +
                '<span class="ad-brk-accent">' + (L.tournamentDone || '') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" ' +
                'id="adBrkRecalc">' + (L.recalcPoints || '') + '</button>' +
            '</div>';
        }

        var html = '<div class="' + обёртка + '">';
        html += '<button class="ad-btn ad-btn-primary' +
            (о.широкая === false ? '' : ' ad-btn-wide') + '" id="adBrkFinalize"' +
            (о.всёСыграно ? '' : ' disabled title="' + пояснение + '"') +
            '>' + (L.finalizeTournament || '') + '</button>';
        /* КНОПКА И ПОЯСНЕНИЕ СТОЯТ В ОДНОЙ СТРОКЕ — ЗНАЧИТ И ПО ОДНОЙ
           ЛИНИИ. Замер 01.10: с `margin-top: 10px` верх полосы был ниже
           верха кнопки на 10, низ — на 11, и 10 мимо шкалы. Высота
           выравнивается по центру родителем, а не числом. */
        if (!о.всёСыграно && незаписано > 0) {
            html += '<div class="ad-sched-note ad-sched-note-flat">' + пояснение + '</div>';
        }
        return html + '</div>';
    };

    A.безОчковЗаКатегорию = function(категория) {
        return категория === 'friendly';
    };

    A.esc = esc;
    A.оставитьСвоиКлассы = оставитьСвоиКлассы;
    A.убратьСлужебное = убратьСлужебное;
    A.cleanNewsHtmlOnSave = cleanNewsHtmlOnSave;
    A.cleanNewsHtml = cleanNewsHtml;
    A.sel = sel;
    A.transliterate = transliterate;
    A.slugify = slugify;
    A.streetEn = streetEn;
    A.formatDateLocal = formatDateLocal;
    A.translateFromRu = translateFromRu;
    A.translateToEmpty = translateToEmpty;
    A.settleTranslateButtons = settleTranslateButtons;
    A.uniqueCourtId = uniqueCourtId;
    A.settleTranslateButton = settleTranslateButton;
    A.translateText = translateText;
    A.setupBulkDelete = setupBulkDelete;
    A.bulkCheckboxTd = bulkCheckboxTd;
    A.uploadImage = uploadImage;
    A.compressImage = compressImage;
    A.exportCsv = exportCsv;

    // NTRP select options helper (1.0 - 7.0, step 0.25)
    A.ntrpOptions = function(selectedVal, opts) {
        opts = opts || {};
        var min = opts.min || 1.0;
        var max = opts.max || 7.0;
        var step = opts.step || 0.25;
        var emptyLabel = opts.emptyLabel || '—';
        // Round selected value to nearest step
        var selNum = selectedVal ? Math.round(parseFloat(selectedVal) / step) * step : null;
        var html = '<option value="">' + emptyLabel + '</option>';
        for (var v = min; v <= max + 0.01; v += step) {
            var val = v.toFixed(2).replace(/0$/, '');
            var sel = (selNum !== null && Math.abs(v - selNum) < 0.001) ? ' selected' : '';
            html += '<option value="' + val + '"' + sel + '>' + val + '</option>';
        }
        return html;
    };


    /**
     * Поля даты: календарь открывается один раз.
     *
     * У тёмного поля значок календаря занимает всю правую часть, и один клик
     * успевает сработать дважды: браузер открывает календарь по нажатию и тут
     * же закрывает его по клику на значок. Со стороны выглядит так, будто
     * календарь мигнул и пропал.
     *
     * Поэтому родное открытие гасим и вызываем календарь сами.
     */
    document.addEventListener('mousedown', function(e) {
        var поле = e.target.closest ? e.target.closest('input[type="date"], input[type="time"]') : null;
        if (!поле || поле.disabled || поле.readOnly) return;
        if (typeof поле.showPicker !== 'function') return;   // старый браузер — пусть как умеет

        e.preventDefault();
        поле.focus();
        try { поле.showPicker(); } catch (err) { /* календарь мог быть уже открыт */ }
    }, true);

    /* ════════════════════════════════════════════════════════════════
       ТАБЛИЦА ОЧКОВ ЗА МЕСТО — ОДНО ОПРЕДЕЛЕНИЕ НА ВСЮ АДМИНКУ
       ════════════════════════════════════════════════════════════════
       Эти четыре функции живут ЗДЕСЬ, в core, а не в своих разделах,
       потому что читателей у таблицы мест двое и они не должны
       расходиться: начисление при завершении турнира
       (`sections/bracket.js`) и экран «Правила очков»
       (`sections/settings.js`). До 03.10 чтение стояло в коде ДВАЖДЫ —
       и предел мест завёлся бы только в одном из них.

       Каждое из решений названо одним местом:
         · КАКАЯ ВЕРСИЯ В СИЛЕ    — `действующаяВерсия`
         · ЧТО ТАКОЕ СЕГОДНЯ      — `сегодняБишкек`
         · СКОЛЬКО МЕСТ ПЛАТЯТ    — `пределМест`
         · КАКИЕ СТРОКИ ЧИТАЕМ    — `местаВсехУровней`
    */

    /**
     * СЕГОДНЯ ПО БИШКЕКУ, А НЕ ПО БРАУЗЕРУ.
     *
     * Дата вступления версии стоит в одном календаре с
     * `tournaments.date_start` — это дата турнира в клубе, а клуб в
     * Бишкеке. Сторож в базе считает так же
     * (`sql/схема/versii-tablicy-ochkov.sql`, `AT TIME ZONE
     * 'Asia/Bishkek'`). Костя работает по Чикаго: без приведения к
     * Бишкеку экран и база назвали бы действующей РАЗНЫЕ версии целый
     * вечер.
     *
     * Два определения «сегодня» неизбежны — одно на SQL, одно на JS, —
     * и потому оба названы одной зоной и сверяются прувером.
     */
    A.сегодняБишкек = function() {
        // sv-SE даёт ISO-вид «2026-10-03» без ручной сборки из частей
        return new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Bishkek' });
    };

    /**
     * ДЕЙСТВУЮЩАЯ ВЕРСИЯ ТАБЛИЦЫ: последняя, чья дата уже наступила.
     *
     * Возвращает строку `points_versions` либо `null`, если версий в
     * базе нет вовсе — так бывает до прогона
     * `sql/схема/versii-tablicy-ochkov.sql`. `null` значит «версия
     * одна и это вся таблица», и читатели обязаны вести себя как
     * сегодня, а не ломаться.
     */
    A.всеВерсии = async function(обновить) {
        if (!обновить && A._версииОчков) return A._версииОчков;

        var ответ = await A.client.from('points_versions')
            .select('id, effective_from, per_win, per_entry, note')
            .order('effective_from', { ascending: false });

        /* Таблицы может не быть — миграция версий ещё не прогнана. Это НЕ
           беда экрана, а состояние базы: отдаём пустой список, и читатели
           ведут себя как до версий. Ошибку не глотаем молча. */
        if (ответ.error) {
            console.warn('[очки] версии недоступны: ' + ответ.error.message);
            A._версииОчков = [];
            return A._версииОчков;
        }
        A._версииОчков = ответ.data || [];
        return A._версииОчков;
    };

    /**
     * ДЕЙСТВУЮЩАЯ ВЕРСИЯ: последняя, чья дата уже наступила.
     *
     * Считается ИЗ ТОГО ЖЕ СПИСКА, что показывает экран, — иначе «какая
     * версия в силе» было бы определено дважды: запросом здесь и подписью
     * там, и разойтись они могли бы ровно в день вступления.
     * `null` — версий нет вовсе; читатели работают как до миграции.
     */
    A.действующаяВерсия = async function(обновить) {
        var все = await A.всеВерсии(обновить);
        var сегодня = A.сегодняБишкек();
        var в = все.filter(function(в) { return в.effective_from <= сегодня; })[0] || null;
        A._версияОчков = в;
        return в;
    };

    /** Версия по id — из того же списка. */
    A.версияПоId = function(id) {
        return (A._версииОчков || []).filter(function(в) { return в.id === id; })[0] || null;
    };

    /** Вступила ли версия: правится только та, чья дата ещё не наступила. */
    A.версияВСиле = function(версия) {
        return !!версия && версия.effective_from <= A.сегодняБишкек();
    };

    /**
     * ПРЕДЕЛ МЕСТ УРОВНЯ: наибольшее место, которое уровень платит.
     *
     * Четырём категориям 64, итоговому турниру 8 — слово Кости:
     * «итоговый это просто восьмёрка, 8 строк там больше и не может
     * быть». Живёт колонкой `tournament_levels.max_place`.
     *
     * ПРЕДЕЛ И `on_ladder` — РАЗНЫЕ ФАКТЫ. Первый говорит, СКОЛЬКО мест
     * уровень платит, второй — входит ли он в лестницу категорий.
     *
     * `|| 64` — порядок выката: пока колонки в базе нет, предел равен
     * 64 и всё работает ровно как до миграции.
     */
    A.пределМест = function(levelId) {
        var у = (A.cachedLevels || []).find(function(l) { return l.id === levelId; });
        return (у && у.max_place) || 64;
    };

    /**
     * ВСЕ СТРОКИ ТАБЛИЦЫ МЕСТ, КОТОРЫЕ СЕГОДНЯ ПЛАТЯТ.
     *
     * Один запрос на всю админку. Отдаёт `[{id, level_id, place,
     * points}]` — только действующей версии и только в пределах уровня.
     * Место за пределом не приходит вовсе, поэтому `заМесто`
     * (`js/rating-points.js`) отдаёт за него ноль сам, а экран рисует
     * прочерк: отдельного условия на предел ни там, ни там не нужно.
     */
    A.местаВерсии = async function(versionId, обновить) {
        if (!обновить && A._местаОчков && A._местаВерсииId === versionId) return A._местаОчков;

        await A.loadTournamentLevels();

        var запрос = A.client.from('points_by_place').select('id, level_id, place, points');
        if (versionId) запрос = запрос.eq('version_id', versionId);

        var ответ = await запрос;
        if (ответ.error) {
            A.showToast(ответ.error.message, 'error');
            return [];
        }

        A._местаВерсииId = versionId;
        A._местаОчков = (ответ.data || []).filter(function(с) {
            return с.place <= A.пределМест(с.level_id);
        });
        return A._местаОчков;
    };

    /** Места ДЕЙСТВУЮЩЕЙ версии — то, по чему считает начисление. */
    A.местаВсехУровней = async function(обновить) {
        var версия = await A.действующаяВерсия(обновить);
        return await A.местаВерсии(версия ? версия.id : null, обновить);
    };

    /**
     * ПРАВИЛА НАЧИСЛЕНИЯ ДЕЙСТВУЮЩЕЙ ВЕРСИИ.
     *
     * Версия несёт ТРИ вещи: таблицу мест плюс два числа, которых в таблице
     * нет вовсе — за победу и за участие. Их получает тот, кому таблица не
     * платит (места ниже четвёртого в группах).
     *
     * ДО 03.10 ВЕРСИЯ ИХ НЕСЛА, А НАЧИСЛЕНИЕ НЕ ЧИТАЛО: 25 и 10 были зашиты
     * в `js/rating-points.js`, и правка на экране не меняла ничего — та же
     * беда, из-за которой переписывался экран раундов.
     *
     * Нет версии — не передаём ничего, и `rating-points` берёт свои
     * умолчания: порядок выката, как `|| 64` у предела.
     */
    A.правилаНачисления = async function(заПобеды) {
        var правила = { заПобеды: !!заПобеды };
        var версия = await A.действующаяВерсия();
        if (версия) {
            if (typeof версия.per_win   === 'number') правила.заПобеду  = версия.per_win;
            if (typeof версия.per_entry === 'number') правила.заУчастие = версия.per_entry;
        }
        return правила;
    };

    /**
     * Таблица одного уровня разбором `{место: очки}` — вид, в котором её
     * ждёт `KSLT_POINTS.поТурниру`.
     */
    A.местаУровня = async function(levelId) {
        /* ВСЕГДА ДЕЙСТВУЮЩАЯ. Начисление не знает и не должно знать, какую
           версию открыл человек на экране. */
        var версия = await A.действующаяВерсия();
        var все = await A.местаВерсии(версия ? версия.id : null);
        var таблица = {};
        все.forEach(function(с) {
            if (с.level_id === levelId) таблица[с.place] = с.points;
        });
        return таблица;
    };

})();
