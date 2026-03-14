// ============================================
// KSLT — Voucher Verification Page
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

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
        successTitle: 'Ваучер ырасталды!',
        successText: 'Арзандатуу колдонулду',
        errorInvalid: 'Жараксыз QR-код',
        errorInvalidText: 'Бул ваучер табылган жок',
        errorExpired: 'Ваучер мөөнөтү бүттү',
        errorExpiredText: 'Бул ваучердин мөөнөтү бүттү',
        errorUsed: 'QR мурунтан колдонулган',
        errorUsedText: 'Бул ваучер колдонулду',
        errorWrongPin: 'Туура эмес PIN-код',
        errorNoToken: 'Жараксыз шилтеме',
        errorNoTokenText: 'QR-код табылган жок'
    } : (isEn ? {
        loading: 'Loading...',
        validBadge: 'VALID VOUCHER',
        playerName: 'Member',
        service: 'Service',
        discount: 'Discount',
        venue: 'Venue',
        validUntil: 'Valid until',
        enterPin: 'Administrator: enter PIN code',
        confirm: 'Confirm',
        confirming: 'Confirming...',
        successTitle: 'Voucher Confirmed!',
        successText: 'Discount has been applied',
        errorInvalid: 'Invalid QR code',
        errorInvalidText: 'This voucher was not found',
        errorExpired: 'Voucher expired',
        errorExpiredText: 'This voucher has expired',
        errorUsed: 'QR already used',
        errorUsedText: 'This voucher was already used',
        errorWrongPin: 'Wrong PIN code',
        errorNoToken: 'Invalid link',
        errorNoTokenText: 'No QR code found'
    } : {
        loading: 'Загрузка...',
        validBadge: 'ДЕЙСТВИТЕЛЬНЫЙ ВАУЧЕР',
        playerName: 'Член KSLT',
        service: 'Услуга',
        discount: 'Скидка',
        venue: 'Заведение',
        validUntil: 'Действителен до',
        enterPin: 'Администратор: введите PIN-код',
        confirm: 'Подтвердить',
        confirming: 'Подтверждение...',
        successTitle: 'Ваучер подтверждён!',
        successText: 'Скидка применена',
        errorInvalid: 'Недействительный QR-код',
        errorInvalidText: 'Данный ваучер не найден',
        errorExpired: 'Ваучер истёк',
        errorExpiredText: 'Срок действия ваучера истёк',
        errorUsed: 'QR уже использован',
        errorUsedText: 'Данный ваучер уже использован',
        errorWrongPin: 'Неверный PIN-код',
        errorNoToken: 'Некорректная ссылка',
        errorNoTokenText: 'QR-код не найден'
    });

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    var client = window.supabaseClient;
    var card = document.getElementById('vrCard');
    var token = new URLSearchParams(window.location.search).get('token');

    function init() {
        if (!token) {
            showError(L.errorNoToken, L.errorNoTokenText);
            return;
        }
        if (!client) {
            showError('Error', 'Supabase not loaded');
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
                showError(L.errorInvalid, L.errorInvalidText);
                return;
            }
            if (data.status === 'expired') {
                showError(L.errorExpired, L.errorExpiredText);
                return;
            }
            if (data.status === 'already_used') {
                var usedDate = data.used_at ? new Date(data.used_at).toLocaleString(isEn ? 'en-US' : 'ru-RU') : '';
                showError(L.errorUsed, L.errorUsedText + (usedDate ? ' (' + usedDate + ')' : ''));
                return;
            }
            if (data.status === 'valid') {
                showValid(data);
            }
        } catch (e) {
            showError('Error', e.message || 'Unknown error');
        }
    }

    function showValid(data) {
        var expiresDate = new Date(data.expires_at);
        var expiresStr = expiresDate.toLocaleString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

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
                    '<label class="vr-pin-label">' + L.enterPin + '</label>' +
                    '<input type="text" class="vr-pin-input" id="vrPinInput" maxlength="4" inputmode="numeric" pattern="[0-9]*" autocomplete="off">' +
                    '<div class="vr-pin-error-msg" id="vrPinError" style="display:none;"></div>' +
                    '<button class="vr-confirm-btn" id="vrConfirmBtn">' + L.confirm + '</button>' +
                '</div>' +
            '</div>';

        var pinInput = document.getElementById('vrPinInput');
        var confirmBtn = document.getElementById('vrConfirmBtn');
        var pinError = document.getElementById('vrPinError');

        // Auto-focus PIN
        pinInput.focus();

        // Only allow digits
        pinInput.addEventListener('input', function() {
            this.value = this.value.replace(/\D/g, '');
            pinInput.classList.remove('vr-pin-error');
            pinError.style.display = 'none';
        });

        // Enter key
        pinInput.addEventListener('keydown', function(e) {
            if (e.key === 'Enter') confirmBtn.click();
        });

        confirmBtn.addEventListener('click', function() {
            var pin = pinInput.value.trim();
            if (pin.length !== 4) {
                pinInput.classList.add('vr-pin-error');
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
                pinError.style.display = 'block';
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
            showError(msgs[data.status] || data.status, '');
        } catch (e) {
            confirmBtn.disabled = false;
            confirmBtn.textContent = L.confirm;
            pinError.textContent = e.message || 'Error';
            pinError.style.display = 'block';
        }
    }

    function showSuccess() {
        card.innerHTML =
            '<div class="vr-success">' +
                '<div class="vr-success-icon">&#10003;</div>' +
                '<h3 class="vr-success-title">' + L.successTitle + '</h3>' +
                '<p class="vr-success-text">' + L.successText + '</p>' +
            '</div>';
    }

    function showError(title, text) {
        card.innerHTML =
            '<div class="vr-error">' +
                '<div class="vr-error-icon">&#10060;</div>' +
                '<h3 class="vr-error-title">' + esc(title) + '</h3>' +
                '<p class="vr-error-text">' + esc(text) + '</p>' +
            '</div>';
    }

    init();
})();
