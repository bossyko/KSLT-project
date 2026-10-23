/**
 * ВАУЧЕРНЫЙ БЛОК — ОДИН НА ВЕСЬ ПРОДУКТ. Кусок 145, 23.10.
 *
 * ЧТО БЫЛО. «Корты» и «Тренеры» держали весь путь ваучера дважды:
 * загрузку услуг по нажатию кнопки, выбор услуги, заведение ваучера,
 * окно ваучера с QR, окно лимита и историю ваучеров. Замер прибором
 * `tools/razovye/145-vaucher-zamer.js`: **271 строка на сторону, 140
 * строк расхождения — и ВСЁ расхождение в приставках классов, в
 * идентификаторах окон и в именах самих функций.**
 *
 * ПАР НЕ БЫЛО ВИДНО ПО ИМЕНАМ: `coGenerateVoucher` против
 * `generateVoucher`. Нашлись сравнением ТЕЛ — ИМЯ У КОПИИ МОЖЕТ БЫТЬ
 * ЛЮБЫМ (правило куска 144).
 *
 * ИМЕНА КЛАССОВ И ОКОН ПРИХОДЯТ ЦЕЛИКОМ, а не склеиваются из приставки:
 * сторож мёртвого кода признаёт склеенный класс живым только по префиксу
 * из двух сегментов, и на куске 144 склейка разом сделала десять живых
 * классов «мёртвыми». КЛАСС, КОТОРОГО НЕТ В КОДЕ ЦЕЛИКОМ, НЕ НАХОДИТСЯ
 * ПОИСКОМ.
 *
 * ОДНА РАЗНИЦА БЫЛА НЕ В ИМЕНАХ, И ОНА НАЗВАНА ВСЛУХ: у кортов, когда
 * библиотека QR не загрузилась, в коробке появлялась надпись «QR library
 * not loaded» — ПО-АНГЛИЙСКИ в трёхъязычном продукте и инлайн-стилем. У
 * тренеров этой ветви не было вовсе: коробка оставалась пустой молча.
 * Взято ЛУЧШЕЕ из двух и починено: надпись есть, на языке страницы, без
 * инлайна.
 *
 * ЭТО НЕ ДОМ КАРТИНКИ. Рисование и скачивание карточки ваучера живут в
 * `js/kslt-vaucher-kartochka.js` (`KSLT_VAUCHER`) с 19.10 — другое
 * понятие, другой дом.
 *
 * ЗА ЧЛЕНСТВОМ. Весь блок виден только члену клуба, поэтому с моей
 * стороны он проверяется стендом `maket/stend-vaucher-blok.html` с
 * подставным клиентом базы, а не живым экраном: входа у меня нет.
 */
(function () {
    'use strict';

    var Б = {};

    /** Название услуги на языке страницы; запасное — русское из базы. */
    function имяУслуги(у) {
        return KSLT_YAZYK.выбрать(у.service_name_en || у.service_name,
                                  у.service_name_kg || у.service_name,
                                  у.service_name);
    }

    /**
     * НАЖАЛИ КНОПКУ НА КАРТОЧКЕ: тянем услуги заведения. Одна — ваучер
     * заводится сразу; несколько — спрашиваем, какая.
     */
    Б.услугиПоКнопке = async function (о) {
        var client = window.supabaseClient;
        if (!client) return;
        var былТекст = о.кнопка.textContent;
        о.кнопка.textContent = '...';
        о.кнопка.style.pointerEvents = 'none';
        try {
            var res = await client.from('partner_services')
                .select('*')
                .eq('entity_type', о.видСущности)
                .eq('entity_id', о.idСущности)
                .eq('is_active', true);
            var услуги = res.data || [];
            if (!услуги.length) {
                showToast(о.L.noDiscountsConfigured, 'info');
                return;
            }
            if (услуги.length === 1) {
                Б.завести({ видСущности: о.видСущности, idСущности: о.idСущности,
                            idУслуги: услуги[0].id, L: о.L, класс: о.класс });
            } else {
                Б.выборУслуги({ видСущности: о.видСущности, idСущности: о.idСущности,
                                услуги: услуги, L: о.L, класс: о.класс });
            }
        } catch (e) {
            showToast(e.message || 'Error', 'error');
        } finally {
            о.кнопка.textContent = былТекст;
            о.кнопка.style.pointerEvents = '';
        }
    };

    /** ВЫБОР УСЛУГИ. Первая выбрана заранее — чаще всего она и нужна. */
    Б.выборУслуги = function (о) {
        var к = о.класс.выбор;
        var было = document.getElementById(к.id);
        if (было) было.remove();

        var подложка = document.createElement('div');
        подложка.id = к.id;
        подложка.className = к.подложка;

        var пункты = '';
        о.услуги.forEach(function (у, i) {
            пункты += '<div class="' + к.пункт + (i === 0 ? ' selected' : '') +
                        '" data-service-id="' + у.id + '">' +
                    '<div class="' + к.точка + '"></div>' +
                    '<span class="' + к.подпись + '">' + KSLT_экранировать(имяУслуги(у)) + '</span>' +
                    '<span class="' + к.процент + '">-' + у.discount_percent + '%</span>' +
                '</div>';
        });

        подложка.innerHTML =
            '<div class="' + к.окно + '">' +
                '<button class="' + к.закрыть + '">&times;</button>' +
                '<div class="' + к.заголовок + '">' + о.L.pickService + '</div>' +
                '<div class="' + к.список + '">' + пункты + '</div>' +
                '<button class="' + к.кнопка + '">' + о.L.pickSubmit + '</button>' +
            '</div>';

        document.body.appendChild(подложка);

        var выбрано = о.услуги[0].id;
        подложка.querySelectorAll('.' + к.пункт).forEach(function (пункт) {
            пункт.addEventListener('click', function () {
                подложка.querySelectorAll('.' + к.пункт).forEach(function (п) {
                    п.classList.remove('selected');
                });
                this.classList.add('selected');
                выбрано = this.dataset.serviceId;
            });
        });
        подложка.querySelector('.' + к.закрыть)
            .addEventListener('click', function () { подложка.remove(); });
        подложка.addEventListener('click', function (e) {
            if (e.target === подложка) подложка.remove();
        });
        подложка.querySelector('.' + к.кнопка).addEventListener('click', function () {
            подложка.remove();
            Б.завести({ видСущности: о.видСущности, idСущности: о.idСущности,
                        idУслуги: выбрано, L: о.L, класс: о.класс });
        });
        return подложка;
    };

    /**
     * ЗАВЕСТИ ВАУЧЕР. Решение принимает база (`generate_voucher`), и её
     * отказы разбираются поимённо: лимит — своим окном, остальное —
     * уведомлением на языке страницы.
     */
    Б.завести = async function (о) {
        var client = window.supabaseClient;
        if (!client) return;
        try {
            var итог = await client.rpc('generate_voucher', {
                p_entity_type: о.видСущности,
                p_entity_id: о.idСущности,
                p_service_id: о.idУслуги
            });
            var ошибкаОбщая = KSLT_YAZYK.выбрать('Error getting discount',
                'Арзандатуу алууда ката', 'Ошибка получения скидки');
            if (итог.error) {
                console.error('Voucher RPC error:', итог.error);
                showToast(итог.error.message || ошибкаОбщая, 'error');
                return;
            }
            var данные = итог.data;
            if (!данные) { showToast(ошибкаОбщая, 'error'); return; }
            if (данные.error) {
                if (данные.error === 'active_voucher_exists') {
                    Б.окноЛимита({ причина: 'active', L: о.L, класс: о.класс });
                    return;
                }
                if (данные.error === 'daily_limit') {
                    Б.окноЛимита({ причина: 'daily', L: о.L, класс: о.класс });
                    return;
                }
                var тексты = {
                    not_authenticated: KSLT_YAZYK.выбрать('Please log in', 'Кириңиз', 'Войдите в систему'),
                    not_member: KSLT_YAZYK.выбрать('Membership required', 'Мүчөлүк керек', 'Требуется членство'),
                    service_not_found: KSLT_YAZYK.выбрать('Service not found', 'Кызмат табылган жок', 'Услуга не найдена'),
                    entity_not_partner: KSLT_YAZYK.выбрать('Not a partner', 'Өнөктөш эмес', 'Не партнёр')
                };
                showToast(тексты[данные.error] || данные.error, 'error');
                return;
            }
            if (данные.success && данные.voucher) {
                Б.окноВаучера({ ваучер: данные.voucher, L: о.L, класс: о.класс });
                if (typeof о.послеУспеха === 'function') о.послеУспеха();
            }
        } catch (e) {
            showToast(e.message || 'Error', 'error');
        }
    };

    /** ОКНО ВАУЧЕРА С QR. */
    Б.окноВаучера = function (о) {
        var к = о.класс.ваучер;
        var в = о.ваучер;
        var было = document.getElementById(к.id);
        if (было) было.remove();

        /* ЯЗЫК ВАУЧЕРА — 13.10. `verify-en.html` и `verify-kg.html`
           существуют и верны, но все три генератора QR строили только
           русский адрес, и обе переведённые страницы были недостижимы.
           Язык здесь уже известен — им подписан сам QR. */
        var адресПроверки = window.KSLT_SAYT.адрес + '/pages/verify' +
            KSLT_YAZYK.суффикс + '.html?token=' + в.qr_token;
        var срок = new Date(в.expires_at).toLocaleString(
            KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU'),
            { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        var окно = document.createElement('div');
        окно.id = к.id;
        окно.className = к.подложка;
        окно.innerHTML =
            '<div class="' + к.окно + '">' +
                '<button class="' + к.закрыть + '" id="' + к.idЗакрыть + '">&times;</button>' +
                '<h3 class="' + к.заголовок + '">' + о.L.voucherReady + '</h3>' +
                '<div class="' + к.qr + '" id="' + к.idQR + '"></div>' +
                '<div class="' + к.детали + '">' +
                    '<div class="' + к.строка + '"><span>' + о.L.voucherService + ':</span><span>' +
                        KSLT_экранировать(в.service_name) + '</span></div>' +
                    '<div class="' + к.строка + '"><span>' + о.L.voucherDiscount + ':</span><span class="' +
                        к.процент + '">-' + в.discount_percent + '%</span></div>' +
                    '<div class="' + к.строка + '"><span>' + KSLT_экранировать(в.entity_name) + '</span></div>' +
                    '<div class="' + к.строка + '"><span>' + о.L.voucherExpires + ':</span><span>' +
                        срок + '</span></div>' +
                '</div>' +
                '<div class="' + к.действия + '">' +
                    '<button class="' + к.скачать + '" id="' + к.idСкачать + '">' +
                        о.L.voucherDownload + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(окно);

        var коробкаQR = document.getElementById(к.idQR);
        if (typeof QRCode !== 'undefined') {
            new QRCode(коробкаQR, {
                text: адресПроверки, width: 200, height: 200,
                colorDark: '#000000', colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        } else {
            /* ВЗЯТО ЛУЧШЕЕ ИЗ ДВУХ И ПОЧИНЕНО: у кортов эта надпись была
               по-английски и инлайн-стилем, у тренеров её не было вовсе —
               коробка оставалась пустой МОЛЧА. Теперь надпись есть, на
               языке страницы и без инлайна: НЕЗАПОЛНЕННОЕ МЕСТО ДОЛЖНО
               БРОСАТЬСЯ В ГЛАЗА. */
            коробкаQR.textContent = KSLT_YAZYK.выбрать(
                'QR could not be drawn — show this screen at the venue',
                'QR тартылбай калды — бул экранды көрсөтүңүз',
                'QR не нарисовался — покажите этот экран на месте');
        }

        document.getElementById(к.idЗакрыть)
            .addEventListener('click', function () { окно.remove(); });
        окно.addEventListener('click', function (e) { if (e.target === окно) окно.remove(); });

        /* Скачать картинку рисует ДРУГОЙ дом — `js/kslt-vaucher-kartochka.js`.
           Задержка нужна QR: холст появляется не в тот же кадр. */
        document.getElementById(к.idСкачать).addEventListener('click', function () {
            setTimeout(function () {
                var холст = коробкаQR.querySelector('canvas');
                if (!холст) return;
                var карточка = window.KSLT_VAUCHER.нарисовать({
                    qrCanvas: холст,
                    скидка: в.discount_percent,
                    услуга: в.service_name,
                    заведение: в.entity_name,
                    срок: срок,
                    язык: KSLT_YAZYK.выбрать('en', 'kg', 'ru')
                });
                window.KSLT_VAUCHER.скачать(карточка,
                    'KSLT-voucher-' + в.qr_token.substring(0, 8) + '.png');
            }, 300);
        });
        return окно;
    };

    /** ОКНО ЛИМИТА. Классы те же, что у окна ваучера, свои только адреса. */
    Б.окноЛимита = function (о) {
        var к = о.класс.ваучер;
        var л = о.класс.лимит;
        var было = document.getElementById(л.id);
        if (было) было.remove();

        var заголовок, пояснение;
        if (о.причина === 'daily') {
            заголовок = KSLT_YAZYK.выбрать('Daily limit reached', 'Күнүмдүк лимит', 'Дневной лимит');
            пояснение = KSLT_YAZYK.выбрать(
                'You can get a new discount for this service tomorrow',
                'Бул кызмат үчүн жаңы арзандатууну эртең ала аласыз',
                'Новую скидку на эту услугу можно получить завтра');
        } else {
            заголовок = о.L.voucherLimit;
            пояснение = KSLT_YAZYK.выбрать(
                'Use or wait for your current discount to expire',
                'Учурдагы арзандатууңузду колдонуңуз же мөөнөтү бүткөнчө күтүңүз',
                'Используйте текущую скидку или дождитесь её истечения');
        }

        var окно = document.createElement('div');
        окно.id = л.id;
        окно.className = к.подложка;
        окно.innerHTML =
            '<div class="' + к.окно + '" style="text-align:center;">' +
                '<button class="' + к.закрыть + '" id="' + л.idЗакрыть + '">&times;</button>' +
                '<div style="font-size:2.5rem;margin-bottom:12px;">&#9203;</div>' +
                '<h3 class="' + к.заголовок + '">' + заголовок + '</h3>' +
                '<p style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:20px;">' +
                    пояснение + '</p>' +
                '<button class="' + к.скачать + '" id="' + л.idOk + '">OK</button>' +
            '</div>';

        document.body.appendChild(окно);
        document.getElementById(л.idЗакрыть)
            .addEventListener('click', function () { окно.remove(); });
        document.getElementById(л.idOk)
            .addEventListener('click', function () { окно.remove(); });
        окно.addEventListener('click', function (e) { if (e.target === окно) окно.remove(); });
        return окно;
    };

    /**
     * ИСТОРИЯ ВАУЧЕРОВ ЗАВЕДЕНИЯ — только члену клуба и только своя:
     * отбор идёт по своему профилю, десять последних.
     */
    Б.история = async function (о) {
        if (о.уровень !== 'member') return;
        var client = window.supabaseClient;
        if (!client) return;
        var к = о.класс.история;
        try {
            var сессия = await client.auth.getSession();
            if (!сессия.data || !сессия.data.session) return;
            var яId = сессия.data.session.user.id;

            var res = await client.from('discount_vouchers')
                .select('*')
                .eq('entity_type', о.видСущности)
                .eq('entity_id', о.idСущности)
                .eq('profile_id', яId)
                .order('created_at', { ascending: false })
                .limit(10);
            var ваучеры = res.data || [];

            var имена = {};
            о.услуги.forEach(function (у) { имена[у.id] = имяУслуги(у); });

            var старое = о.коробка.querySelector('.' + к.коробка);
            if (старое) старое.remove();

            var блок = document.createElement('div');
            блок.className = к.коробка;
            блок.innerHTML = '<h4>' + о.L.myVouchers + '</h4>';

            if (!ваучеры.length) {
                блок.innerHTML += '<p class="' + к.пусто + '">' + о.L.noVouchersYet + '</p>';
            } else {
                var сейчас = new Date();
                var список = '<div class="' + к.список + '">';
                ваучеры.forEach(function (в) {
                    var дата = new Date(в.created_at).toLocaleDateString(
                        KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU'),
                        { day: 'numeric', month: 'short' });
                    var имя = имена[в.service_id] || в.service_id;
                    var состояние = в.status;
                    if (состояние === 'active' && в.expires_at &&
                        new Date(в.expires_at) < сейчас) состояние = 'expired';
                    var подписьСостояния = состояние === 'active' ? о.L.voucherActive
                        : (состояние === 'used' ? о.L.voucherUsed : о.L.voucherExpired);

                    список += '<div class="' + к.строка + '">' +
                        '<span class="' + к.дата + '">' + дата + '</span>' +
                        '<span class="' + к.услуга + '">' + KSLT_экранировать(имя) + '</span>' +
                        '<span class="' + к.скидка + '">-' + в.discount_percent + '%</span>' +
                        /* ИМЯ СОСТОЯНИЯ ПРИХОДИТ ЦЕЛИКОМ, а не склеивается:
                           склеенный класс сторож мёртвого кода признаёт живым
                           только по префиксу из двух сегментов, стоящему в js
                           (урок куска 144). Поэтому зовущий передаёт все три. */
                        '<span class="' + к.состояние + ' ' + (к.состояния[состояние] || '') + '">' +
                            подписьСостояния + '</span>';
                    if (состояние === 'active') {
                        список += '<button class="' + к.кнопкаQR + '" data-token="' +
                            KSLT_экранировать(в.qr_token) + '" data-service="' +
                            KSLT_экранировать(имя) + '" data-percent="' + в.discount_percent +
                            '" data-entity="' + KSLT_экранировать(в.entity_name || '') +
                            '" data-expires="' + в.expires_at + '">' + о.L.voucherShowQR + '</button>';
                    }
                    список += '</div>';
                });
                список += '</div>';
                блок.innerHTML += список;
            }

            о.коробка.appendChild(блок);

            блок.querySelectorAll('.' + к.кнопкаQR).forEach(function (кнопка) {
                кнопка.addEventListener('click', function () {
                    Б.окноВаучера({
                        ваучер: {
                            qr_token: this.dataset.token,
                            service_name: this.dataset.service,
                            discount_percent: this.dataset.percent,
                            entity_name: this.dataset.entity,
                            expires_at: this.dataset.expires
                        },
                        L: о.L, класс: о.класс
                    });
                });
            });
            return блок;
        } catch (e) {
            console.error('Voucher history error:', e);
        }
    };

    window.KSLT_VAUCHER_BLOK = Б;
})();
