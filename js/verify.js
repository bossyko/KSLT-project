// ============================================
// KSLT — Voucher Verification Page
// ============================================

(function() {
    'use strict';

    var isEn = KSLT_YAZYK.en;
    var isKg = KSLT_YAZYK.kg;

    var L = isKg ? {
        loading: 'Жүктөлүүдө...',
        validBadge: 'ЖАРАКТУУ ВАУЧЕР',
        playerName: 'Мүчө',
        service: 'Кызмат',
        discount: 'Арзандатуу',
        venue: 'Жер',
        validUntil: 'Мөөнөтү',
        enterPin: 'Администратор PIN-кодду киргизиңиз',
        confirm: 'Ырастоо',
        confirming: 'Ырасталууда...',
        successTitle: 'Скидка ырасталды!',
        successText: 'Арзандатуу колдонулду',
        errorInvalid: 'Жараксыз QR-код',
        errorInvalidText: 'Бул скидка табылган жок',
        errorExpired: 'Скидка мөөнөтү бүттү',
        errorExpiredText: 'Бул скидканын мөөнөтү бүттү',
        errorUsed: 'QR мурунтан колдонулган',
        errorUsedText: 'Бул скидка колдонулду',
        errorWrongPin: 'Туура эмес PIN-код',
        errorNoToken: 'Жараксыз шилтеме',
        errorNoTokenText: 'QR-код табылган жок',
        errorPinShort: 'Код төрт сандан турат',
        errorSystem: 'Текшерүү мүмкүн болбоду',
        errorSystemText: 'Байланыш үзүлдү',
        nextScan: 'QR-кодду кайра көрсөтүүнү сураңыз.',
        nextNew: 'КСЛТ колдонмосунан жаңы ваучер түзүүнү сураңыз.',
        nextRetry: 'Кайра аракет кылыңыз же бетти жаңылаңыз.'
    } : (isEn ? {
        loading: 'Loading...',
        validBadge: 'VALID DISCOUNT',
        playerName: 'Member',
        service: 'Service',
        discount: 'Discount',
        venue: 'Venue',
        validUntil: 'Valid until',
        enterPin: 'Administrator: enter PIN code',
        confirm: 'Confirm',
        confirming: 'Confirming...',
        successTitle: 'Discount Confirmed!',
        successText: 'Discount has been applied',
        errorInvalid: 'Invalid QR code',
        errorInvalidText: 'This discount was not found',
        errorExpired: 'Discount expired',
        errorExpiredText: 'This discount has expired',
        errorUsed: 'QR already used',
        errorUsedText: 'This discount was already used',
        errorWrongPin: 'Wrong PIN code',
        errorNoToken: 'Invalid link',
        errorNoTokenText: 'No QR code found',
        errorPinShort: 'The code is four digits',
        errorSystem: 'Could not verify',
        errorSystemText: 'Connection failed',
        nextScan: 'Ask the member to show the QR code again.',
        nextNew: 'Ask the member to create a new voucher in the KSLT app.',
        nextRetry: 'Try again or reload the page.'
    } : {
        loading: 'Загрузка...',
        validBadge: 'ДЕЙСТВИТЕЛЬНАЯ СКИДКА',
        playerName: 'Член КСЛТ',
        service: 'Услуга',
        discount: 'Скидка',
        venue: 'Заведение',
        validUntil: 'Действительна до',
        enterPin: 'Администратор: введите PIN-код',
        confirm: 'Подтвердить',
        confirming: 'Подтверждение...',
        successTitle: 'Скидка подтверждена!',
        successText: 'Скидка применена',
        errorInvalid: 'Недействительный QR-код',
        errorInvalidText: 'Данная скидка не найдена',
        errorExpired: 'Скидка истекла',
        errorExpiredText: 'Срок действия скидки истёк',
        errorUsed: 'QR уже использован',
        errorUsedText: 'Данная скидка уже использована',
        errorWrongPin: 'Неверный PIN-код',
        errorNoToken: 'Некорректная ссылка',
        errorNoTokenText: 'QR-код не найден',
        errorPinShort: 'Код состоит из четырёх цифр',
        errorSystem: 'Не удалось проверить',
        errorSystemText: 'Связь прервалась',
        nextScan: 'Попросите показать QR-код ещё раз.',
        nextNew: 'Попросите создать новый ваучер в приложении КСЛТ.',
        nextRetry: 'Попробуйте ещё раз или обновите страницу.'
    });

    /* ЯЗЫК ДАТЫ. Трёхходовка уже решена в продукте — js/home-news.js:42 и
       js/news.js:53. Здесь до 13.10 стояла двухходовка, и кыргызский
       получал русский формат. */
    var ЛОКАЛЬ = KSLT_YAZYK.выбрать('en-US', 'ky-KG', 'ru-RU');

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    function esc(str) {
        return String(str == null ? '' : str)
            .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
    }

    var client = window.supabaseClient;
    var card = document.getElementById('vrCard');
    var token = new URLSearchParams(window.location.search).get('token');

    function init() {
        if (!token) {
            showError(L.errorNoToken, L.errorNoTokenText, L.nextScan);
            return;
        }
        if (!client) {
            /* ТЕХНИЧЕСКОЕ СООБЩЕНИЕ ЧЕЛОВЕКУ НЕ ПОКАЗЫВАЕМ. До 13.10 здесь
               стояло «Error / Supabase not loaded» — непереведённое и ничего
               не говорящее администратору в зале. */
            console.error('verify: supabaseClient не подключён');
            showError(L.errorSystem, L.errorSystemText, L.nextRetry);
            return;
        }
        card.innerHTML = '<div class="vr-loading">' + L.loading + '</div>';
        verifyToken();
    }

    async function verifyToken() {
        try {
            var result = await client.rpc('verify_voucher', { p_token: token });
            var data = result.data;

            if (!data || data.status === 'invalid') {
                showError(L.errorInvalid, L.errorInvalidText, L.nextScan);
                return;
            }
            if (data.status === 'expired') {
                showError(L.errorExpired, L.errorExpiredText, L.nextNew);
                return;
            }
            if (data.status === 'already_used') {
                var usedDate = data.used_at ? new Date(data.used_at).toLocaleString(ЛОКАЛЬ) : '';
                showError(L.errorUsed, L.errorUsedText + (usedDate ? ' (' + usedDate + ')' : ''), L.nextNew);
                return;
            }
            if (data.status === 'valid') {
                showValid(data);
            }
        } catch (e) {
            console.error('verify_voucher:', e);
            showError(L.errorSystem, L.errorSystemText, L.nextRetry);
        }
    }

    function showValid(data) {
        var expiresDate = new Date(data.expires_at);
        var expiresStr = expiresDate.toLocaleString(ЛОКАЛЬ, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

        card.innerHTML =
            '<div class="vr-valid">' +
                '<div class="vr-badge">' + L.validBadge + '</div>' +
                '<div class="vr-details">' +
                    '<div class="vr-row"><span class="vr-row-label">' + L.playerName + '</span><span class="vr-row-value">' + esc(data.player_name) + '</span></div>' +
                    '<div class="vr-row"><span class="vr-row-label">' + L.service + '</span><span class="vr-row-value">' + esc(data.service_name) + '</span></div>' +
                    '<div class="vr-row"><span class="vr-row-label">' + L.discount + '</span><span class="vr-discount-badge">-' + data.discount_percent + '%</span></div>' +
                    '<div class="vr-row"><span class="vr-row-label">' + L.venue + '</span><span class="vr-row-value">' + esc(data.entity_name) + '</span></div>' +
                    '<div class="vr-row"><span class="vr-row-label">' + L.validUntil + '</span><span class="vr-row-value">' + expiresStr + '</span></div>' +
                '</div>' +
                '<div class="vr-pin-section">' +
                    '<label class="vr-pin-label" for="vrPinInput">' + L.enterPin + '</label>' +
                    '<input type="text" class="vr-pin-input" id="vrPinInput" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="off" aria-describedby="vrPinError">' +
                    /* role="alert" — иначе диктор смену текста не объявит, а
                       зрячий видит только дрожание рамки. */
                    '<div class="vr-pin-error-msg" id="vrPinError" role="alert"></div>' +
                    '<button class="vr-confirm-btn" id="vrConfirmBtn">' + L.confirm + '</button>' +
                '</div>' +
            '</div>';

        var pinInput = document.getElementById('vrPinInput');
        var confirmBtn = document.getElementById('vrConfirmBtn');
        var pinError = document.getElementById('vrPinError');

        /* АВТОФОКУС БЕЗ ПРОКРУТКИ. Померено 13.10 на 844 × 390: обычный
           focus() прокручивал страницу на 259, и администратор видел поле
           PIN и кнопку, но НЕ видел плашку «действительная» и имя
           владельца — подтверждал скидку, не видя чью. Вёрстка здесь ни
           при чём: при нулевой прокрутке верх карточки 93 и плашка 119. */
        pinInput.focus({ preventScroll: true });

        // Only allow digits
        pinInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            pinInput.classList.remove('vr-pin-error');
            pinError.textContent = '';
        });

        // Enter key
        pinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') confirmBtn.click();
        });

        confirmBtn.addEventListener('click', function() {
            var pin = pinInput.value.trim();
            if (pin.length !== 4) {
                /* КРАСНАЯ РАМКА БЕЗ СЛОВА — ЭТО НЕ ОТВЕТ. До 13.10 короткий
                   код ставил класс и молча выходил: диктор не говорил
                   ничего, зрячий видел только тряску. */
                pinInput.classList.add('vr-pin-error');
                pinError.textContent = L.errorPinShort;
                pinInput.focus();
                return;
            }
            confirmBtn.disabled = true;
            confirmBtn.textContent = L.confirming;
            confirmVoucher(pin);
        });
    }

    async function confirmVoucher(pin) {
        var pinInput = document.getElementById('vrPinInput');
        var confirmBtn = document.getElementById('vrConfirmBtn');
        var pinError = document.getElementById('vrPinError');

        try {
            var result = await client.rpc('confirm_voucher', { p_token: token, p_pin: pin });
            var data = result.data;

            if (!data) {
                confirmBtn.disabled = false;
                confirmBtn.textContent = L.confirm;
                return;
            }

            if (data.status === 'confirmed') {
                showSuccess();
                return;
            }

            if (data.status === 'wrong_pin') {
                pinInput.value = '';
                pinInput.classList.add('vr-pin-error');
                pinError.textContent = L.errorWrongPin;
                pinInput.focus();
                confirmBtn.disabled = false;
                confirmBtn.textContent = L.confirm;
                return;
            }

            // Other errors (expired, used, etc.)
            var msgs = {
                expired: L.errorExpired,
                already_used: L.errorUsed,
                invalid: L.errorInvalid
            };
            var дальше = data.status === 'invalid' ? L.nextScan : L.nextNew;
            showError(msgs[data.status] || L.errorSystem, '', дальше);
        } catch (e) {
            console.error('confirm_voucher:', e);
            confirmBtn.disabled = false;
            confirmBtn.textContent = L.confirm;
            pinError.textContent = L.errorSystemText;
        }
    }

    function showSuccess() {
        card.innerHTML =
            '<div class="vr-success">' +
                '<div class="vr-success-icon" aria-hidden="true">&#10003;</div>' +
                '<h3 class="vr-success-title">' + L.successTitle + '</h3>' +
                '<p class="vr-success-text">' + L.successText + '</p>' +
            '</div>';
    }

    function showError(title, text, next) {
        card.innerHTML =
            '<div class="vr-error">' +
                '<div class="vr-error-icon" aria-hidden="true">&#10060;</div>' +
                '<h3 class="vr-error-title">' + esc(title) + '</h3>' +
                (text ? '<p class="vr-error-text">' + esc(text) + '</p>' : '') +
                (next ? '<p class="vr-error-next">' + esc(next) + '</p>' : '') +
            '</div>';
    }

    init();
})();
