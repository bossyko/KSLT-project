// ============================================
// KSLT — Auth (Supabase)
// ============================================

(function() {
    'use strict';

    // Detect language
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Labels
    /**
     * Похоже ли это на адрес почты.
     *
     * Браузерная проверка type="email" пропускает почти всё: ей довольно
     * «собаки» без пробелов. Адрес bossyko@gmail.comвавыпвыр она считает
     * верным, и человек уходит ждать письмо, которое никуда не ушло.
     *
     * Держимся латиницы: домены в кириллице бывают, но у наших писем и
     * рассылки их не будет, а опечатку раскладкой ловить важнее.
     */
    function похоже_на_почту(адрес) {
        return /^[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}$/.test(адрес || '');
    }

    var L = isKg ? {
        signingIn: 'Кирүү...',
        signIn: 'Кирүү',
        creatingAccount: 'Аккаунт түзүлүүдө...',
        createAccount: 'Аккаунт түзүү',
        sendingLink: 'Жөнөтүлүүдө...',
        sendLink: 'Шилтеме жөнөтүү',
        sent: 'Жөнөтүлдү!',
        resend: 'Кайра жөнөтүү',
        errEmailMatch: 'Email даректер дал келбейт',
        errPwRules: 'Сыр сөз талаптарга жооп бербейт:',
        errPwMatch: 'Сыр сөздөр дал келбейт',
        ruleLength: '8+ символ',
        ruleUpper: 'Чоң тамга (A-Z)',
        ruleDigit: 'Сан (0-9)',
        ruleSpecial: 'Атайын белги (!@#$)',
        errGeneric: 'Ката кетти. Кайра аракет кылыңыз.',
        errInvalidLogin: 'Туура эмес email же сыр сөз',
        errCaptcha: 'Текшерүүдөн өтүңүз',
        errEmailBad: 'Почта введена неверно',
        errTooMany: 'Өтө көп аракеттер. 60 секунд күтүңүз.',
        errEmailTaken: 'Бул email менен аккаунт бар',
        tgLoggingIn: 'Telegram менен кирүү...',
        tgRegistering: 'Аккаунт түзүлүүдө...',
        tgNewUserTitle: 'Каттоону аяктаңыз',
        tgNewUserSubtitle: 'Telegram: ',
        tgEmailRequired: 'Email киргизиңиз',
        tgEmailTaken: 'Бул email катталган. Кириңиз жана Telegram\'ды профилде байлаңыз.',
        resetTitle: 'Жаңы сыр сөз',
        resetSaving: 'Сакталууда...',
        resetSave: 'Сыр сөздү сактоо',
        resetSuccess: 'Сыр сөз ийгиликтүү жаңыланды!',
        errResetPwRules: 'Сыр сөз талаптарга жооп бербейт',
        errResetPwMatch: 'Сыр сөздөр дал келбейт',
        successCheckEmail: 'Аккаунтуңузду тастыктоо үчүн email текшериңиз!',
        successResetSent: 'Сыр сөздү калыбына келтирүү шилтемеси email\'ге жөнөтүлдү',
        redirecting: 'Ийгиликтүү! Багыттоо...',
        otpSentToEmail: 'почтага',
        otpSentToTelegram: 'Telegram ботко',
        otpWrongCode: 'Туура эмес код',
        otpExpired: 'Код мөөнөтү бүттү. Жаңысын сураңыз.',
        otpExhausted: 'Аракеттер бүттү. Жаңы код сураңыз.',
        otpSavingPw: 'Сакталууда...',
        otpSavePw: 'Сыр сөздү сактоо',
        otpVerifying: 'Текшерилүүдө...',
        otpTimerPrefix: 'Код жарактуу: ',
        otpAttemptsLeft: ' аракет калды',
        sendCode: 'Код жөнөтүү',
        sendingCode: 'Жөнөтүлүүдө...'
    } : isEn ? {
        signingIn: 'Signing in...',
        signIn: 'Sign In',
        creatingAccount: 'Creating account...',
        createAccount: 'Create Account',
        sendingLink: 'Sending...',
        sendLink: 'Send Reset Link',
        sent: 'Sent!',
        resend: 'Resend',
        errEmailMatch: 'Email addresses do not match',
        errPwRules: 'Password does not meet requirements:',
        errPwMatch: 'Passwords do not match',
        ruleLength: '8+ characters',
        ruleUpper: 'Uppercase letter (A-Z)',
        ruleDigit: 'Number (0-9)',
        ruleSpecial: 'Special character (!@#$)',
        errGeneric: 'An error occurred. Please try again.',
        errInvalidLogin: 'Invalid email or password',
        errCaptcha: 'Please complete the verification',
        errEmailBad: 'Check the email address',
        errTooMany: 'Too many attempts. Please wait 60 seconds.',
        errEmailTaken: 'An account with this email already exists',
        tgLoggingIn: 'Signing in via Telegram...',
        tgRegistering: 'Creating account...',
        tgNewUserTitle: 'Complete Registration',
        tgNewUserSubtitle: 'Telegram: ',
        tgEmailRequired: 'Please enter your email',
        tgEmailTaken: 'This email is already registered. Sign in and link Telegram in your profile.',
        resetTitle: 'New Password',
        resetSaving: 'Saving...',
        resetSave: 'Save Password',
        resetSuccess: 'Password updated successfully!',
        errResetPwRules: 'Password does not meet requirements',
        errResetPwMatch: 'Passwords do not match',
        successCheckEmail: 'Check your email to confirm your account!',
        successResetSent: 'Password reset link sent to your email',
        redirecting: 'Success! Redirecting...',
        otpSentToEmail: 'to your email',
        otpSentToTelegram: 'to Telegram bot',
        otpWrongCode: 'Wrong code',
        otpExpired: 'Code expired. Please request a new one.',
        otpExhausted: 'Too many attempts. Please request a new code.',
        otpSavingPw: 'Saving...',
        otpSavePw: 'Save Password',
        otpVerifying: 'Verifying...',
        otpTimerPrefix: 'Code valid for: ',
        otpAttemptsLeft: ' attempts left',
        sendCode: 'Send Code',
        sendingCode: 'Sending...'
    } : {
        signingIn: 'Вход...',
        signIn: 'Войти',
        creatingAccount: 'Создание аккаунта...',
        createAccount: 'Создать аккаунт',
        sendingLink: 'Отправка...',
        sendLink: 'Отправить ссылку',
        sent: 'Отправлено!',
        resend: 'Отправить повторно',
        errEmailMatch: 'Email адреса не совпадают',
        errPwRules: 'Пароль не соответствует требованиям:',
        errPwMatch: 'Пароли не совпадают',
        ruleLength: '8+ символов',
        ruleUpper: 'Заглавная буква (A-Z)',
        ruleDigit: 'Цифра (0-9)',
        ruleSpecial: 'Спецсимвол (!@#$)',
        errGeneric: 'Произошла ошибка. Попробуйте снова.',
        errInvalidLogin: 'Неверный email или пароль',
        errCaptcha: 'Пройдите проверку',
        errEmailBad: 'Проверьте адрес почты',
        errTooMany: 'Слишком много попыток. Подождите 60 сек.',
        errEmailTaken: 'Аккаунт с этим email уже существует',
        tgLoggingIn: 'Вход через Telegram...',
        tgRegistering: 'Создание аккаунта...',
        tgNewUserTitle: 'Завершите регистрацию',
        tgNewUserSubtitle: 'Telegram: ',
        tgEmailRequired: 'Введите email',
        tgEmailTaken: 'Этот email уже зарегистрирован. Войдите и привяжите Telegram в профиле.',
        resetTitle: 'Новый пароль',
        resetSaving: 'Сохранение...',
        resetSave: 'Сохранить пароль',
        resetSuccess: 'Пароль успешно обновлён!',
        errResetPwRules: 'Пароль не соответствует требованиям',
        errResetPwMatch: 'Пароли не совпадают',
        successCheckEmail: 'Проверьте почту для подтверждения аккаунта!',
        successResetSent: 'Ссылка для сброса пароля отправлена на вашу почту',
        redirecting: 'Успешно! Перенаправление...',
        otpSentToEmail: 'на почту',
        otpSentToTelegram: 'в Telegram бот',
        otpWrongCode: 'Неверный код',
        otpExpired: 'Код истёк. Запросите новый.',
        otpExhausted: 'Попытки исчерпаны. Запросите новый код.',
        otpSavingPw: 'Сохранение...',
        otpSavePw: 'Сохранить пароль',
        otpVerifying: 'Проверка...',
        otpTimerPrefix: 'Код действителен: ',
        otpAttemptsLeft: ' попыток осталось',
        sendCode: 'Отправить код',
        sendingCode: 'Отправка...'
    };

    // Turnstile CAPTCHA
    var TURNSTILE_SITE_KEY = '0x4AAAAAAEDoNUH1Z2T9Iiab';
    var _signupToken = null;
    var _forgotToken = null;
    // Капча может не подняться: на localhost ключ не разрешён, у человека
    // может не открыться challenges.cloudflare.com. Тогда токена не будет
    // никогда, и требовать его — значит запереть вход насовсем.
    var _turnstileBroken = false;

    function initTurnstile() {
        if (typeof turnstile === 'undefined') return setTimeout(initTurnstile, 300);
        var su = document.getElementById('signupTurnstile');
        var fg = document.getElementById('forgotTurnstile');
        if (su) turnstile.render(su, {
            sitekey: TURNSTILE_SITE_KEY, theme: 'dark',
            callback: function(t) { _signupToken = t; _turnstileBroken = false; },
            'expired-callback': function() { _signupToken = null; },
            'error-callback': function() { _turnstileBroken = true; }
        });
        if (fg) turnstile.render(fg, {
            sitekey: TURNSTILE_SITE_KEY, theme: 'dark',
            callback: function(t) { _forgotToken = t; _turnstileBroken = false; },
            'expired-callback': function() { _forgotToken = null; },
            'error-callback': function() { _turnstileBroken = true; }
        });
    }
    // Список стран берём из общего модуля: он же используется в кабинете,
    // в админке и в приложении, и расходиться между ними не должен
    (function fillCountries() {
        var sel = document.getElementById('forgot-country');
        if (!sel || !window.KSLT_PHONE) return;
        var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');
        sel.innerHTML = KSLT_PHONE.countries.map(function(c) {
            return '<option value="' + c.iso + '">' + c.flag + '  ' + KSLT_PHONE.name(c, lang) + '  ' + c.code + '</option>';
        }).join('');
    })();

    initTurnstile();

    // Rate limiting (client-side)
    var _loginAttempts = 0;
    var _lockoutUntil = 0;

    // Use shared Supabase client from supabase-config.js
    var client = window.supabaseClient;

    // ---- Device fingerprint helpers ----
    function simpleHash(str) {
        var hash = 0;
        for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(i);
            hash |= 0;
        }
        return hash.toString(36);
    }

    function checkDeviceFingerprint(userId) {
        try {
            var deviceHash = simpleHash(navigator.userAgent + '|' + screen.width + 'x' + screen.height);
            client.from('user_devices').select('id').eq('profile_id', userId).eq('device_hash', deviceHash).maybeSingle().then(function(res) {
                var isNew = !res.data;
                // Upsert device (update last_seen or insert)
                client.from('user_devices').upsert({
                    profile_id: userId,
                    device_hash: deviceHash,
                    user_agent: navigator.userAgent.substring(0, 500),
                    last_seen: new Date().toISOString()
                }, { onConflict: 'profile_id,device_hash' }).then(function() {});
                // Notify if new device
                if (isNew) {
                    client.auth.getSession().then(function(s) {
                        var token = s.data && s.data.session && s.data.session.access_token;
                        if (token) {
                            fetch(window.SUPABASE_URL + '/functions/v1/security-notify', {
                                method: 'POST',
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json',
                                    'apikey': window.SUPABASE_ANON_KEY
                                },
                                body: JSON.stringify({
                                    event_type: 'new_device_login',
                                    metadata: { user_agent: navigator.userAgent.substring(0, 500) }
                                })
                            }).catch(function() {});
                        }
                    });
                }
            });
        } catch (e) { /* non-blocking */ }
    }

    // ---- Return URL (from auth-guard redirect) ----
    var params = new URLSearchParams(window.location.search);
    var returnUrl = params.get('return');

    // Base URL (for Supabase OAuth/email redirects)
    var basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    function getRedirectUrl() {
        // Обратный адрес не должен вести на саму страницу входа: иначе она
        // уводит на себя же, и вкладка перезагружается без конца.
        if (returnUrl && returnUrl.indexOf('auth') === -1) return returnUrl;
        var role = localStorage.getItem('kslt_role');
        if (role === 'admin' || role === 'manager') {
            return 'admin.html';   // админка только на русском
        }
        return наЯзыке('dashboard.html');
    }

    /**
     * Адрес страницы на языке человека.
     *
     * Язык запоминается при каждом переключении и лежит в профиле. После
     * нового входа человек должен попасть туда же, где закончил: выбрал
     * английский вчера — сегодня открывается английский кабинет, а не
     * русский только потому, что вход был с русской страницы.
     */
    /**
     * Карточка игрока — сразу при входе, а не при первом заходе в кабинет.
     *
     * Без карточки человек не может ни записаться на турнир, ни вызвать
     * кого-то на баттл: раньше она заводилась только в кабинете, и тот, кто
     * пришёл по ссылке из рассылки, упирался в «у вас нет карточки игрока».
     *
     * Если в клубе нашлась похожая карточка — с рейтингом и историей, — сервер
     * её не присваивает: человек подтвердит сам в кабинете. Молча отдавать
     * чужой рейтинг однофамильцу нельзя.
     */
    async function завестиКарточкуИгрока() {
        try {
            var сессия = await client.auth.getSession();
            var session = сессия.data && сессия.data.session;
            if (!session || !session.access_token) return;
            await fetch(window.SUPABASE_URL + '/functions/v1/ensure-player-card', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY,
                    'Authorization': 'Bearer ' + session.access_token
                },
                body: JSON.stringify({})
            });
        } catch (e) {
            // Не получилось — не беда: кабинет и подача заявки попробуют снова
            console.warn('[KSLT] карточка игрока:', e.message);
        }
    }

    function наЯзыке(файл) {
        var язык = localStorage.getItem('kslt_lang_saved');
        if (язык === 'en') return файл.replace('.html', '-en.html');
        if (язык === 'kg') return файл.replace('.html', '-kg.html');
        return файл;
    }

    // ---- Populate birthday day select (1-31) ----
    var daySelect = document.getElementById('signup-birth-day');
    if (daySelect) {
        for (var d = 1; d <= 31; d++) {
            var opt = document.createElement('option');
            opt.value = d;
            opt.textContent = d;
            daySelect.appendChild(opt);
        }
    }

    // ---- Clear forms on page load (security) ----
    window.addEventListener('pageshow', function() {
        document.querySelectorAll('form').forEach(function(f) { f.reset(); });
        document.querySelectorAll('.pw-rule').forEach(function(r) { r.classList.remove('valid'); });
    });

    // ---- DOM elements ----
    var tabs = document.querySelectorAll('.auth-tab');
    var forms = document.querySelectorAll('.auth-form');
    var authTabs = document.querySelector('.auth-tabs');

    var signinForm = document.getElementById('signinForm');
    var signupForm = document.getElementById('signupForm');
    var forgotStep1 = document.getElementById('forgotStep1');
    var otpCodeForm = document.getElementById('otpCodeForm');
    var otpNewPasswordForm = document.getElementById('otpNewPasswordForm');

    var forgotLink = document.querySelector('.auth-forgot');
    var forgotBack = document.getElementById('forgotBack');
    var otpBackToForgot = document.getElementById('otpBackToForgot');
    var otpResend = document.getElementById('otpResend');

    var signupSuccess = document.getElementById('signupSuccess');
    var signupBackToLogin = document.getElementById('signupBackToLogin');
    var signupEmailDisplay = document.getElementById('signupEmailDisplay');

    var resetForm = document.getElementById('resetForm');
    var resetSuccess = document.getElementById('resetSuccess');
    var resetBackToLogin = document.getElementById('resetBackToLogin');

    var emailTakenModal = document.getElementById('emailTakenModal');
    var emailTakenLogin = document.getElementById('emailTakenLogin');
    var emailTakenForgot = document.getElementById('emailTakenForgot');
    var emailTakenClose = document.getElementById('emailTakenClose');

    // ---- Error/Success message ----
    function showMessage(form, text, isError) {
        var existing = form.querySelector('.auth-message');
        if (existing) existing.remove();

        var msg = document.createElement('div');
        msg.className = 'auth-message ' + (isError ? 'auth-message-error' : 'auth-message-success');
        msg.textContent = text;

        var btn = form.querySelector('.auth-btn');
        if (btn) {
            btn.parentNode.insertBefore(msg, btn);
        } else {
            form.appendChild(msg);
        }

        if (!isError) {
            setTimeout(function() { msg.remove(); }, 5000);
        }
    }

    // Detailed password error — lists exactly which rules failed
    function showPwError(form, password) {
        var ruleLabels = {
            length: L.ruleLength,
            upper: L.ruleUpper,
            digit: L.ruleDigit,
            special: L.ruleSpecial
        };

        var missing = [];
        Object.keys(rules).forEach(function(key) {
            if (!rules[key](password)) {
                missing.push(ruleLabels[key] || key);
            }
        });

        var text = L.errPwRules + '\n' + missing.join(', ');

        var existing = form.querySelector('.auth-message');
        if (existing) existing.remove();

        var msg = document.createElement('div');
        msg.className = 'auth-message auth-message-error auth-pw-detail';
        msg.innerHTML = '<strong>' + L.errPwRules + '</strong><ul>' +
            missing.map(function(m) { return '<li>' + m + '</li>'; }).join('') +
            '</ul>';

        var btn = form.querySelector('.auth-btn');
        if (btn) {
            btn.parentNode.insertBefore(msg, btn);
        } else {
            form.appendChild(msg);
        }
    }

    function clearMessages(form) {
        var msgs = form.querySelectorAll('.auth-message');
        msgs.forEach(function(m) { m.remove(); });
    }

    function setLoading(btn, loading, loadingText, normalText) {
        btn.disabled = loading;
        btn.textContent = loading ? loadingText : normalText;
    }

    // ---- Tab switching ----
    function showScreen(screenId) {
        // Clear all forms and messages when switching
        forms.forEach(function(f) {
            f.classList.remove('active');
            if (typeof f.reset === 'function') f.reset();
            clearMessages(f);
        });
        if (forgotStep1) forgotStep1.classList.remove('active');
        if (otpCodeForm) otpCodeForm.classList.remove('active');
        if (otpNewPasswordForm) otpNewPasswordForm.classList.remove('active');
        if (signupSuccess) signupSuccess.classList.remove('active');
        if (resetForm) resetForm.classList.remove('active');
        if (resetSuccess) resetSuccess.classList.remove('active');
        var tgRegForm = document.getElementById('tgRegisterForm');
        if (tgRegForm) tgRegForm.classList.remove('active');
        document.querySelectorAll('.pw-rule').forEach(function(r) { r.classList.remove('valid'); });
        document.querySelectorAll('.pw-rule-reset').forEach(function(r) { r.classList.remove('valid'); });
        document.getElementById(screenId).classList.add('active');
        var hideTabs = (screenId === 'forgotStep1' || screenId === 'otpCodeForm' || screenId === 'otpNewPasswordForm' || screenId === 'signupSuccess' || screenId === 'resetForm' || screenId === 'resetSuccess' || screenId === 'tgRegisterForm');
        authTabs.style.display = hideTabs ? 'none' : 'flex';
    }

    // ---- Signup form: show/hide fields ----
    var signupFieldsWrap = document.getElementById('signupFields');
    var signupShowForm = document.getElementById('signupShowForm');
    var signupOptions = document.querySelector('.auth-signup-options');
    if (signupShowForm && signupFieldsWrap) {
        signupShowForm.addEventListener('click', function() {
            signupFieldsWrap.style.display = '';
            if (signupOptions) signupOptions.style.display = 'none';
        });
    }


    // ---- Telegram App Modal ----
    var tgAppModal = document.getElementById('tgAppModal');
    function showTgAppModal() {
        if (tgAppModal) tgAppModal.classList.add('active');
    }
    function hideTgAppModal() {
        if (tgAppModal) tgAppModal.classList.remove('active');
    }
    var tgAppClose = document.getElementById('tgAppClose');
    var tgAppCloseX = document.getElementById('tgAppCloseX');
    if (tgAppClose) tgAppClose.addEventListener('click', hideTgAppModal);
    if (tgAppCloseX) tgAppCloseX.addEventListener('click', hideTgAppModal);
    if (tgAppModal) tgAppModal.addEventListener('click', function(e) {
        if (e.target === tgAppModal) hideTgAppModal();
    });

    // All TG buttons on page → show modal
    document.querySelectorAll('.auth-tg-app-btn').forEach(function(btn) {
        btn.addEventListener('click', showTgAppModal);
    });
    var signupTgBtn = document.getElementById('signupTgBtn');
    if (signupTgBtn) {
        signupTgBtn.addEventListener('click', showTgAppModal);
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var target = tab.dataset.tab;
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            forms.forEach(function(f) { f.classList.remove('active'); });
            document.getElementById(target === 'signin' ? 'signinForm' : 'signupForm').classList.add('active');
            // Reset signup form: always show options, hide fields
            if (signupFieldsWrap) signupFieldsWrap.style.display = 'none';
            if (signupOptions) signupOptions.style.display = '';
        });
    });

    // ---- Forgot password flow ----
    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(function(t) { t.classList.remove('active'); });
        showScreen('forgotStep1');
    });

    forgotBack.addEventListener('click', function(e) {
        e.preventDefault();
        tabs[0].classList.add('active');
        showScreen('signinForm');
    });

    if (otpBackToForgot) {
        otpBackToForgot.addEventListener('click', function(e) {
            e.preventDefault();
            clearOtpTimer();
            showScreen('forgotStep1');
        });
    }

    if (signupBackToLogin) {
        signupBackToLogin.addEventListener('click', function() {
            tabs[0].classList.add('active');
            showScreen('signinForm');
        });
    }

    if (resetBackToLogin) {
        resetBackToLogin.addEventListener('click', async function() {
            // Sign out recovery session before going to login
            if (client) await client.auth.signOut();
            tabs[0].classList.add('active');
            showScreen('signinForm');
        });
    }

    // ---- Email Taken Modal ----
    function showEmailTakenModal() {
        if (emailTakenModal) emailTakenModal.classList.add('active');
    }

    function hideEmailTakenModal() {
        if (emailTakenModal) emailTakenModal.classList.remove('active');
    }

    if (emailTakenClose) {
        emailTakenClose.addEventListener('click', hideEmailTakenModal);
    }

    if (emailTakenLogin) {
        emailTakenLogin.addEventListener('click', function() {
            hideEmailTakenModal();
            tabs[0].classList.add('active');
            tabs[1].classList.remove('active');
            showScreen('signinForm');
        });
    }

    if (emailTakenForgot) {
        emailTakenForgot.addEventListener('click', function() {
            hideEmailTakenModal();
            tabs.forEach(function(t) { t.classList.remove('active'); });
            showScreen('forgotStep1');
        });
    }

    if (emailTakenModal) {
        emailTakenModal.addEventListener('click', function(e) {
            if (e.target === emailTakenModal) hideEmailTakenModal();
        });
    }

    // ---- Password rules for reset form ----
    var resetPwInput = document.getElementById('reset-password');
    if (resetPwInput) {
        resetPwInput.addEventListener('input', function() {
            var val = this.value;
            Object.keys(rules).forEach(function(key) {
                var el = document.querySelector('.pw-rule-reset[data-rule="' + key + '"]');
                if (el) {
                    if (rules[key](val)) {
                        el.classList.add('valid');
                        el.classList.remove('pw-rule-error');
                    } else {
                        el.classList.remove('valid');
                    }
                }
            });
            var detailMsg = resetForm.querySelector('.auth-pw-detail');
            if (detailMsg) detailMsg.remove();
        });
    }

    // (email confirm removed)

    // ---- Eye toggle ----
    document.querySelectorAll('.auth-eye').forEach(function(btn) {
        btn.addEventListener('click', function() {
            // Раньше поле искалось только по data-target: там, где его забыли
            // проставить, скрипт получал null и падал, а глаз молча не работал.
            var input = btn.dataset.target
                ? document.getElementById(btn.dataset.target)
                : (btn.closest('.auth-password-wrap') || document).querySelector('input');
            if (!input) return;

            var isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';

            var open = btn.querySelector('.eye-open');
            var closed = btn.querySelector('.eye-closed');
            if (open) open.style.display = isPassword ? 'none' : 'block';
            if (closed) closed.style.display = isPassword ? 'block' : 'none';
        });
    });

    // ---- Password rules ----
    var pwInput = document.getElementById('signup-password');
    var rules = {
        length: function(val) { return val.length >= 8; },
        upper: function(val) { return /[A-Z]/.test(val); },
        digit: function(val) { return /[0-9]/.test(val); },
        special: function(val) { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(val); }
    };

    /* Подсказка о правилах пароля живёт только там, где есть само поле.
       На регистрации поля больше нет (вариант B, 21.09), и без этой
       проверки страница падала с «Cannot read properties of null» на
       каждой загрузке — поймано прогоном, а не глазами. */
    if (pwInput) {
        pwInput.addEventListener('input', function() {
            var val = this.value;
            Object.keys(rules).forEach(function(key) {
                var el = document.querySelector('.pw-rule[data-rule="' + key + '"]');
                if (!el) return;
                if (rules[key](val)) {
                    el.classList.add('valid');
                    el.classList.remove('pw-rule-error');
                } else {
                    el.classList.remove('valid');
                }
            });
            // Clear detailed error message when user starts typing
            var detailMsg = signupForm.querySelector('.auth-pw-detail');
            if (detailMsg) detailMsg.remove();
        });
    }

    /* Поля «Подтвердите пароль» на регистрации больше нет (решение 21.09):
       у поля пароля есть глаз показа, а подтверждение — приём из времён,
       когда посмотреть на введённое было нельзя. Обработчик оставлен
       защищённым: те же элементы есть на экранах смены пароля. */
    var подтвержд = document.getElementById('signup-confirm');
    if (подтвержд) {
        подтвержд.addEventListener('input', function() {
            this.setCustomValidity('');
        });
    }

    // ---- Name script validation (allow Cyrillic + Kyrgyz + Latin on all versions) ----
    var _sRe = /^[a-zA-Zа-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;
    var _sHint = isKg ? 'Туура эмес символдор' : isEn ? 'Invalid characters in name' : 'Допустимы буквы, пробел, дефис';

    ['signup-firstname', 'signup-lastname'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var hint = document.createElement('div');
        hint.style.cssText = 'color:#ff4444;font-size:0.75rem;margin-top:2px;display:none;';
        hint.textContent = _sHint;
        el.parentNode.appendChild(hint);
        var _nameTimer = null;
        el.addEventListener('input', function() {
            clearTimeout(_nameTimer);
            _nameTimer = setTimeout(function() {
                var v = el.value.trim();
                var bad = v.length > 2 && !_sRe.test(v);
                el.style.borderColor = bad ? '#ff4444' : '';
                hint.style.display = bad ? '' : 'none';
            }, 500);
        });
    });

    // ============================================
    // SIGN IN — Supabase
    // ============================================
    signinForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages(signinForm);

        var email = document.getElementById('signin-email').value.trim();
        var password = document.getElementById('signin-password').value;
        var btn = signinForm.querySelector('.auth-btn');

        if (!похоже_на_почту(email)) {
            showMessage(signinForm, L.errEmailBad, true);
            return;
        }

        // Rate limiting
        if (Date.now() < _lockoutUntil) {
            showMessage(signinForm, L.errTooMany, true);
            return;
        }

        if (!client) {
            showMessage(signinForm, L.errGeneric, true);
            return;
        }

        setLoading(btn, true, L.signingIn, L.signIn);

        // Server-side rate limit check
        try {
            var rlRes = await fetch(SUPABASE_URL + '/functions/v1/rate-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                body: JSON.stringify({ action: 'login', key: email })
            });
            var rlData = await rlRes.json();
            if (!rlData.allowed) {
                setLoading(btn, false, L.signingIn, L.signIn);
                showMessage(signinForm, L.errTooMany, true);
                return;
            }
        } catch (e) { /* fail open */ }

        var result = await client.auth.signInWithPassword({ email: email, password: password });

        if (result.error) {
            setLoading(btn, false, L.signingIn, L.signIn);
            showMessage(signinForm, L.errInvalidLogin, true);
            _loginAttempts++;
            if (_loginAttempts >= 5) {
                _lockoutUntil = Date.now() + 60000;
                _loginAttempts = 0;
            }
            return;
        }

        _loginAttempts = 0;

        // Cache profile data for nav dropdown before redirect
        var user = result.data.user;
        if (user && user.user_metadata && user.user_metadata.full_name) {
            localStorage.setItem('kslt_name', user.user_metadata.full_name);
        }
        if (user) {
            try {
                var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', user.id).single();
                if (profileRes.data) {
                    if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                    if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                    if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                }
            } catch (e) { /* continue with redirect */ }
        }

        checkDeviceFingerprint(user.id);
        // Карточка игрока — сразу, чтобы человек мог записаться
        // на турнир, не заходя в кабинет
        завестиКарточкуИгрока();
        localStorage.setItem('kslt_session_start', Date.now().toString());
        showMessage(signinForm, L.redirecting, false);
        setTimeout(function() {
            window.location.href = getRedirectUrl();
        }, 1000);
    });

    // ============================================
    // SIGN UP — Supabase
    // ============================================
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages(signupForm);

        var firstName = document.getElementById('signup-firstname').value.trim();
        var lastName = document.getElementById('signup-lastname').value.trim();
        var email = document.getElementById('signup-email').value.trim();
        var gender = document.querySelector('input[name="gender"]:checked');
        // Дата рождения при РЕГИСТРАЦИИ больше не спрашивается (решение
        // Кости 21.09). Она нужна промо-акции ко дню рождения, которой в
        // админке ещё нет (задача dr-kalendar), и собирать её впрок значит
        // удлинять форму ради того, чего пока не существует.
        //
        // Чтение оставлено защищённым, а не выброшено: те же строки работают
        // на экране дозаполнения после Telegram, где поля ДР есть.
        // Год рождения не спрашивался ни на одной из трёх страниц уже давно —
        // это записанная задача про мёртвое чтение (#90).
        var деньЭл = document.getElementById('signup-birth-day');
        var месяцЭл = document.getElementById('signup-birth-month');
        var birthDay = деньЭл ? деньЭл.value : '';
        var birthMonth = месяцЭл ? месяцЭл.value : '';
        var birthYearEl = document.getElementById('signup-birth-year');
        var birthYear = birthYearEl ? birthYearEl.value : '';
        /* ПАРОЛЯ В ФОРМЕ РЕГИСТРАЦИИ БОЛЬШЕ НЕТ (решение Кости 21.09,
           вариант B). Почта подтверждается кодом — это и есть дверь.
           Пароль предлагаем ПОСЛЕ регистрации, на экране «Готово», с
           возможностью пропустить; войти потом можно и по коду.
           Чтение защищено, а не выброшено: те же элементы есть на экранах
           смены пароля. */
        var парольЭл = document.getElementById('signup-password');
        var password = парольЭл ? парольЭл.value : '';
        var подтверждЭл = document.getElementById('signup-confirm');
        var confirmPw = подтверждЭл ? подтверждЭл.value : password;
        var btn = signupForm.querySelector('.auth-btn');

        if (!похоже_на_почту(email)) {
            showMessage(signupForm, L.errEmailBad, true);
            document.getElementById('signup-email').focus();
            return;
        }

        var allRulesPass = !парольЭл || Object.keys(rules).every(function(key) { return rules[key](password); });
        if (!allRulesPass) {
            showPwError(signupForm, password);
            // Highlight unfulfilled rules
            document.querySelectorAll('.pw-rule').forEach(function(el) {
                var key = el.dataset.rule;
                if (rules[key] && !rules[key](password)) {
                    el.classList.add('pw-rule-error');
                } else {
                    el.classList.remove('pw-rule-error');
                }
            });
            // Scroll to password field
            pwInput.focus();
            pwInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
            return;
        }

        if (подтверждЭл && password !== confirmPw) {
            подтверждЭл.setCustomValidity(L.errPwMatch);
            подтверждЭл.reportValidity();
            return;
        }

        if (!client) {
            showMessage(signupForm, L.errGeneric, true);
            return;
        }

        // Script validation (allow Cyrillic + Kyrgyz + Latin)
        var _scriptRe = /^[a-zA-Zа-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;
        var _scriptMsg = isKg ? 'Туура эмес символдор' : isEn ? 'Invalid characters in name' : 'Допустимы буквы, пробел, дефис';

        if ((firstName && !_scriptRe.test(firstName)) || (lastName && !_scriptRe.test(lastName))) {
            showMessage(signupForm, _scriptMsg, true);
            return;
        }

        if (!_signupToken && !_turnstileBroken) {
            showMessage(signupForm, L.errCaptcha, true);
            return;
        }

        setLoading(btn, true, L.creatingAccount, L.createAccount);

        // Server-side rate limit check
        try {
            var rlRes = await fetch(SUPABASE_URL + '/functions/v1/rate-limit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                body: JSON.stringify({ action: 'signup', key: email })
            });
            var rlData = await rlRes.json();
            if (!rlData.allowed) {
                setLoading(btn, false, L.creatingAccount, L.createAccount);
                showMessage(signupForm, L.errTooMany, true);
                return;
            }
        } catch (e) { /* fail open */ }

        // Check email uniqueness before sending OTP
        try {
            var checkResult = await client.rpc('check_registration_available', {
                p_email: email
            });
            if (checkResult.data && checkResult.data.email_taken) {
                setLoading(btn, false, L.creatingAccount, L.createAccount);
                showEmailTakenModal();
                return;
            }
        } catch (e) {
            // continue — server will catch duplicates
        }

        // Cache form data for after OTP verification
        _otpFormData = {
            email: email,
            password: парольЭл ? password : undefined,
            full_name: firstName + ' ' + lastName,
            gender: gender ? gender.value : '',
            birth_day: birthDay ? parseInt(birthDay) : null,
            birth_month: birthMonth ? parseInt(birthMonth) : null,
            birth_year: birthYear ? parseInt(birthYear) : null,
            // Уровень игры НЕ спрашиваем при регистрации (решение 21.09).
            //
            // Раньше здесь читалось поле #signup-ntrp. Оно стояло только на
            // русской странице — на английской и кыргызской его не было
            // вовсе, то есть три версии сайта собирали разные данные.
            //
            // Проверено по коду: допуск в турнир от него не зависит.
            // supabase/functions/tournament-register/index.ts:420 отправляет
            // игрока без категории в рассмотрение админом, а не блокирует.
            // Значит поле ничего не решало, а форму удлиняло.
            //
            // Уровень проставляет клуб по играм; человек видит это
            // уведомлением в профиле, а не полем при входе.
            ntrp: null
        };

        // Send OTP to email
        try {
            var otpResult = await sendOtp('register', email, 'email');

            // Отказ функции проходил мимо: код шёл дальше и открывал экран
            // ввода кода, которого никто не отправлял
            if (!otpResult || otpResult.error) {
                setLoading(btn, false, L.creatingAccount, L.createAccount);
                showMessage(signupForm,
                    otpResult && otpResult.error === 'captcha_failed'
                        ? L.errCaptcha
                        : L.errGeneric + ' (' + ((otpResult && otpResult.error) || 'no response') + ')',
                    true);
                return;
            }

            setLoading(btn, false, L.creatingAccount, L.createAccount);
            _signupToken = null;
            if (typeof turnstile !== 'undefined') turnstile.reset('#signupTurnstile');

            showOtpScreen('register', email, 'email', otpResult.channel || 'email', async function(code) {
                // Verify OTP and create user
                var resp = await fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                    body: JSON.stringify({
                        flow: 'register',
                        identifier: email,
                        code: code,
                        email: _otpFormData.email,
                        password: _otpFormData.password,
                        full_name: _otpFormData.full_name,
                        gender: _otpFormData.gender,
                        birth_day: _otpFormData.birth_day,
                        birth_month: _otpFormData.birth_month,
                        birth_year: _otpFormData.birth_year,
                        ntrp: _otpFormData.ntrp
                    })
                });
                var data = await resp.json();

                if (data.error === 'wrong_code') {
                    var inputsWrap = document.getElementById('otpInputs');
                    if (inputsWrap) {
                        inputsWrap.classList.add('shake');
                        setTimeout(function() { inputsWrap.classList.remove('shake'); }, 500);
                    }
                    showMessage(otpCodeForm, (data.remaining > 0 ? L.otpWrongCode + ' (' + data.remaining + L.otpAttemptsLeft + ')' : L.otpExhausted), true);
                    clearOtpInputs();
                    var firstDigit = document.querySelector('#otpInputs .otp-digit');
                    if (firstDigit) firstDigit.focus();
                    return;
                }
                if (data.error === 'code_expired') { showMessage(otpCodeForm, L.otpExpired, true); return; }
                if (data.error === 'code_exhausted') { showMessage(otpCodeForm, L.otpExhausted, true); return; }
                if (data.error === 'email_taken') { showMessage(otpCodeForm, L.errEmailTaken, true); return; }
                if (data.error) { showMessage(otpCodeForm, L.errGeneric, true); return; }

                // Auto-login via magic link
                clearOtpTimer();
                if (data.hashed_token && data.email) {
                    var loginResult = await client.auth.verifyOtp({
                        token_hash: data.hashed_token,
                        type: 'magiclink'
                    });
                    if (!loginResult.error && loginResult.data.user) {
                        var user = loginResult.data.user;
                        try {
                            var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', user.id).single();
                            if (profileRes.data) {
                                if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                                if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                                if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                            }
                        } catch (e) { /* continue */ }
                        checkDeviceFingerprint(user.id);
                        // Карточка игрока — сразу, чтобы человек мог записаться
                        // на турнир, не заходя в кабинет
                        завестиКарточкуИгрока();
                        localStorage.setItem('kslt_session_start', Date.now().toString());
                    }
                }
                /* Раньше здесь через секунду уводило в кабинет. Теперь
                   показываем «Готово» и предлагаем поставить пароль —
                   без этого человек, зарегистрировавшийся без пароля,
                   никогда бы его не завёл. Кнопка «Пропустить» рядом:
                   войти можно и по коду. */
                показатьГотово();
            });
        } catch (err) {
            console.error('[KSLT] регистрация:', err);
            setLoading(btn, false, L.creatingAccount, L.createAccount);
            showMessage(signupForm, L.errGeneric + ' (' + (err && err.message ? err.message : 'network') + ')', true);
        }
    });

    // ============================================
    // OTP SYSTEM — shared state & functions
    // ============================================
    var _otpFlow = null;         // 'forgot_password' | 'register' | 'telegram_register'
    var _otpIdentifier = null;   // email or phone
    var _otpIdentifierType = null; // 'email' | 'phone'
    var _otpChannel = null;      // 'telegram' | 'email'
    var _otpCallback = null;     // function to call after code verified
    var _otpTimerInterval = null;
    var _otpTelegramChatId = null;
    var _otpFormData = null;     // cached form data for register/tg flows
    var _otpVerifiedCode = null; // store code after verification for password step

    // OTP method tabs (email/phone toggle)
    var methodTabs = document.querySelectorAll('.otp-method-tab');
    var forgotEmailField = document.getElementById('forgotEmailField');
    var forgotPhoneField = document.getElementById('forgotPhoneField');

    methodTabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            methodTabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            var method = tab.dataset.method;
            if (forgotEmailField) forgotEmailField.style.display = method === 'email' ? '' : 'none';
            if (forgotPhoneField) forgotPhoneField.style.display = method === 'phone' ? '' : 'none';
            // Toggle required
            var emailInput = document.getElementById('forgot-email');
            var phoneInput = document.getElementById('forgot-phone');
            if (emailInput) emailInput.required = method === 'email';
            if (phoneInput) phoneInput.required = method === 'phone';
        });
    });

    // OTP digit inputs setup
    function setupOtpInputs(container) {
        var digits = container.querySelectorAll('.otp-digit');
        digits.forEach(function(input, idx) {
            input.value = '';
            input.classList.remove('filled');

            input.addEventListener('input', function(e) {
                var val = this.value.replace(/\D/g, '');
                this.value = val ? val[0] : '';
                this.classList.toggle('filled', !!this.value);
                if (val && idx < digits.length - 1) {
                    digits[idx + 1].focus();
                }
                // Auto-submit when all 6 filled
                var code = '';
                digits.forEach(function(d) { code += d.value; });
                if (code.length === 6) {
                    submitOtpCode(code);
                }
            });

            input.addEventListener('keydown', function(e) {
                if (e.key === 'Backspace' && !this.value && idx > 0) {
                    digits[idx - 1].focus();
                    digits[idx - 1].value = '';
                    digits[idx - 1].classList.remove('filled');
                }
            });

            // Paste handler
            input.addEventListener('paste', function(e) {
                e.preventDefault();
                var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
                if (paste.length >= 6) {
                    for (var i = 0; i < 6; i++) {
                        digits[i].value = paste[i] || '';
                        digits[i].classList.toggle('filled', !!digits[i].value);
                    }
                    digits[5].focus();
                    submitOtpCode(paste.substring(0, 6));
                }
            });
        });
    }

    // Clear OTP inputs
    function clearOtpInputs() {
        var digits = document.querySelectorAll('#otpInputs .otp-digit');
        digits.forEach(function(d) { d.value = ''; d.classList.remove('filled'); });
        var inputsWrap = document.getElementById('otpInputs');
        if (inputsWrap) inputsWrap.classList.remove('shake');
    }

    // OTP timer
    function startOtpTimer(seconds) {
        clearOtpTimer();
        var timerEl = document.getElementById('otpTimer');
        if (!timerEl) return;
        var remaining = seconds;

        function update() {
            var min = Math.floor(remaining / 60);
            var sec = remaining % 60;
            timerEl.innerHTML = L.otpTimerPrefix + '<strong>' + min + ':' + (sec < 10 ? '0' : '') + sec + '</strong>';
            if (remaining <= 0) {
                clearOtpTimer();
                timerEl.innerHTML = '<strong style="color:#ff6b6b;">' + L.otpExpired + '</strong>';
            }
            remaining--;
        }
        update();
        _otpTimerInterval = setInterval(update, 1000);
    }

    function clearOtpTimer() {
        if (_otpTimerInterval) {
            clearInterval(_otpTimerInterval);
            _otpTimerInterval = null;
        }
    }

    // Send OTP via Edge Function
    async function sendOtp(flow, identifier, identifierType, telegramChatId) {
        var body = {
            flow: flow,
            identifier: identifier,
            identifier_type: identifierType
        };
        // Язык страницы: при регистрации профиля ещё нет, и сервер не знает,
        // на каком языке писать. Код придёт на том, с которого человек
        // регистрируется
        body.lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');
        if (telegramChatId) body.telegram_chat_id = telegramChatId;
        if (flow === 'forgot_password' && _forgotToken) body.turnstile_token = _forgotToken;

        var resp = await fetch(SUPABASE_URL + '/functions/v1/send-otp', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
            body: JSON.stringify(body)
        });

        // Ответ разбирался вслепую. Если функция не развёрнута или упала,
        // тело приходит не в JSON, разбор падает, и человек видел
        // «Произошла ошибка» без единого намёка на причину — а в консоли
        // не оставалось и того
        var text = await resp.text();
        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            console.error('[KSLT] send-otp ответил не JSON:', resp.status, text.slice(0, 300));
            throw new Error('send-otp: HTTP ' + resp.status);
        }
        if (!resp.ok || data.error) {
            console.error('[KSLT] send-otp:', resp.status, data);
        }
        return data;
    }

    // Show OTP code entry screen
    /**
     * Задержка перед повторной отправкой кода.
     *
     * Без неё человек, не увидевший письма, жмёт ссылку подряд, упирается в
     * серверный лимит в пять запросов и получает блокировку на четверть часа —
     * то есть наказание за то, что письмо шло медленно.
     */
    var _resendInterval = null;

    function startResendCooldown(seconds) {
        if (!otpResend) return;
        clearInterval(_resendInterval);
        var left = seconds;

        function tick() {
            if (left <= 0) {
                clearInterval(_resendInterval);
                otpResend.textContent = L.resend;
                otpResend.classList.remove('disabled');
                otpResend.style.pointerEvents = '';
                return;
            }
            otpResend.textContent = L.resend + ' (' + left + ')';
            left--;
        }

        otpResend.classList.add('disabled');
        otpResend.style.pointerEvents = 'none';
        tick();
        _resendInterval = setInterval(tick, 1000);
    }

    function showOtpScreen(flow, identifier, identifierType, channel, callback) {
        _otpFlow = flow;
        _otpIdentifier = identifier;
        _otpIdentifierType = identifierType;
        _otpChannel = channel;
        _otpCallback = callback;
        startResendCooldown(60);

        // Set channel hint text
        var channelText = document.getElementById('otpChannelText');
        if (channelText) {
            channelText.textContent = channel === 'telegram' ? L.otpSentToTelegram : L.otpSentToEmail;
        }

        // Channel icon hint
        var channelHint = document.getElementById('otpChannelHint');
        if (channelHint) {
            if (channel === 'telegram') {
                channelHint.innerHTML = '<svg viewBox="0 0 24 24" fill="#2AABEE"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram';
            } else {
                channelHint.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg> Email';
            }
        }

        clearOtpInputs();
        showScreen('otpCodeForm');
        startOtpTimer(600); // 10 minutes

        // Focus first digit
        var firstDigit = document.querySelector('#otpInputs .otp-digit');
        if (firstDigit) setTimeout(function() { firstDigit.focus(); }, 100);
    }

    // Submit OTP code
    async function submitOtpCode(code) {
        if (!_otpFlow || !_otpIdentifier) return;

        if (_otpCallback) {
            await _otpCallback(code);
        }
    }

    // OTP resend
    if (otpResend) {
        otpResend.addEventListener('click', async function(e) {
            e.preventDefault();
            if (!_otpFlow || !_otpIdentifier) return;
            this.textContent = L.sendingCode;
            await sendOtp(_otpFlow, _otpIdentifier, _otpIdentifierType || 'email', _otpTelegramChatId);
            clearOtpInputs();
            startOtpTimer(600);
            this.textContent = L.sent;
            setTimeout(function() { startResendCooldown(60); }, 1500);
        });
    }

    // Setup digit inputs on load
    var otpInputsContainer = document.getElementById('otpInputs');
    if (otpInputsContainer) setupOtpInputs(otpInputsContainer);

    // ============================================
    // FORGOT PASSWORD — OTP flow
    // ============================================
    forgotStep1.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages(forgotStep1);

        var activeTab = document.querySelector('.otp-method-tab.active');
        var method = activeTab ? activeTab.dataset.method : 'email';
        var identifier, identifierType;

        if (method === 'phone') {
            var countryEl = document.getElementById('forgot-country');
            var phone = document.getElementById('forgot-phone').value.trim();
            if (!phone) return;
            // Значением стал код страны (KG, RU), а был телефонный префикс
            identifier = window.KSLT_PHONE
                ? KSLT_PHONE.join(countryEl.value, phone)
                : countryEl.value + phone.replace(/[\s\-()]/g, '');
            identifierType = 'phone';
        } else {
            identifier = document.getElementById('forgot-email').value.trim();
            identifierType = 'email';
            if (!identifier) return;
            if (!похоже_на_почту(identifier)) {
                showMessage(forgotStep1, L.errEmailBad, true);
                return;
            }
        }

        var btn = forgotStep1.querySelector('.auth-btn');

        if (!_forgotToken && !_turnstileBroken) {
            showMessage(forgotStep1, L.errCaptcha, true);
            return;
        }

        setLoading(btn, true, L.sendingCode, L.sendCode);

        try {
            var result = await sendOtp('forgot_password', identifier, identifierType);

            setLoading(btn, false, L.sendingCode, L.sendCode);
            _forgotToken = null;
            if (typeof turnstile !== 'undefined') turnstile.reset('#forgotTurnstile');

            var channel = result.channel || 'email';

            showOtpScreen('forgot_password', identifier, identifierType, channel, async function(code) {
                // Step 1: verify code only
                var verifyResp = await fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                    body: JSON.stringify({ flow: 'forgot_password', identifier: identifier, code: code })
                });
                var verifyData = await verifyResp.json();

                if (verifyData.error === 'wrong_code') {
                    var inputsWrap = document.getElementById('otpInputs');
                    if (inputsWrap) {
                        inputsWrap.classList.add('shake');
                        setTimeout(function() { inputsWrap.classList.remove('shake'); }, 500);
                    }
                    showMessage(otpCodeForm, (verifyData.remaining > 0 ? L.otpWrongCode + ' (' + verifyData.remaining + L.otpAttemptsLeft + ')' : L.otpExhausted), true);
                    clearOtpInputs();
                    var firstDigit = document.querySelector('#otpInputs .otp-digit');
                    if (firstDigit) firstDigit.focus();
                    return;
                }
                if (verifyData.error === 'code_expired') {
                    showMessage(otpCodeForm, L.otpExpired, true);
                    return;
                }
                if (verifyData.error === 'code_exhausted') {
                    showMessage(otpCodeForm, L.otpExhausted, true);
                    return;
                }
                if (verifyData.error) {
                    showMessage(otpCodeForm, L.errGeneric, true);
                    return;
                }

                // Code verified — save code for password step
                _otpVerifiedCode = code;
                clearOtpTimer();
                showScreen('otpNewPasswordForm');
            });
        } catch (err) {
            setLoading(btn, false, L.sendingCode, L.sendCode);
            showMessage(forgotStep1, L.errGeneric, true);
        }
    });

    // OTP New Password form submit
    if (otpNewPasswordForm) {
        // Password rules live validation for OTP new password form
        var otpNewPwInput = document.getElementById('otp-new-password');
        if (otpNewPwInput) {
            otpNewPwInput.addEventListener('input', function() {
                var val = this.value;
                var pwDetail = document.getElementById('otpPwRules');
                if (pwDetail) {
                    pwDetail.querySelectorAll('li').forEach(function(li) {
                        var rule = li.dataset.rule;
                        if (rule && rules[rule]) {
                            li.classList.toggle('valid', rules[rule](val));
                        }
                    });
                }
            });
        }

        otpNewPasswordForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages(otpNewPasswordForm);

            var newPw = document.getElementById('otp-new-password').value;
            var confirmPw = document.getElementById('otp-confirm-password').value;
            var btn = otpNewPasswordForm.querySelector('.auth-btn');

            var allRulesPass = Object.keys(rules).every(function(key) { return rules[key](newPw); });
            if (!allRulesPass) {
                showPwError(otpNewPasswordForm, newPw);
                return;
            }
            if (newPw !== confirmPw) {
                showMessage(otpNewPasswordForm, L.errResetPwMatch, true);
                return;
            }

            setLoading(btn, true, L.otpSavingPw, L.otpSavePw);

            /* Режим «Готово» после регистрации: человек УЖЕ вошёл, код
               израсходован. Значит пароль ставится обычным updateUser, а
               не через verify-otp — тому нужен неиспользованный код, и он
               бы честно ответил «code_expired». */
            if (_режимГотово) {
                try {
                    var итог = await client.auth.updateUser({ password: newPw });
                    if (итог.error) {
                        setLoading(btn, false, L.otpSavingPw, L.otpSavePw);
                        showMessage(otpNewPasswordForm, L.errGeneric, true);
                        return;
                    }
                    showMessage(otpNewPasswordForm, L.redirecting, false);
                    setTimeout(function() { window.location.href = getRedirectUrl(); }, 800);
                } catch (е) {
                    setLoading(btn, false, L.otpSavingPw, L.otpSavePw);
                    showMessage(otpNewPasswordForm, L.errGeneric, true);
                }
                return;
            }

            try {
                var resp = await fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                    body: JSON.stringify({
                        flow: 'forgot_password',
                        identifier: _otpIdentifier,
                        code: _otpVerifiedCode,
                        new_password: newPw
                    })
                });
                var data = await resp.json();

                if (data.error) {
                    setLoading(btn, false, L.otpSavingPw, L.otpSavePw);
                    showMessage(otpNewPasswordForm, data.error, true);
                    return;
                }

                // Auto-login via magic link
                if (data.hashed_token && data.email) {
                    var otpResult = await client.auth.verifyOtp({
                        token_hash: data.hashed_token,
                        type: 'magiclink'
                    });

                    if (!otpResult.error && otpResult.data.user) {
                        var user = otpResult.data.user;
                        try {
                            var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', user.id).single();
                            if (profileRes.data) {
                                if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                                if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                                if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                            }
                        } catch (e) { /* continue */ }
                        checkDeviceFingerprint(user.id);
                        // Карточка игрока — сразу, чтобы человек мог записаться
                        // на турнир, не заходя в кабинет
                        завестиКарточкуИгрока();
                        localStorage.setItem('kslt_session_start', Date.now().toString());
                    }
                }

                showMessage(otpNewPasswordForm, L.redirecting, false);
                setTimeout(function() { window.location.href = getRedirectUrl(); }, 1000);
            } catch (err) {
                setLoading(btn, false, L.otpSavingPw, L.otpSavePw);
                showMessage(otpNewPasswordForm, L.errGeneric, true);
            }
        });
    }

    // ============================================
    // «ГОТОВО» — предложение поставить пароль после регистрации
    // ============================================
    //
    // Отдельного экрана в разметке не заводим: otpNewPasswordForm — это
    // ровно та же форма (поле пароля, глаз показа, кнопка). Меняем ей
    // подписи и добавляем «Пропустить». Тексты лежат в разметке в
    // data-атрибутах, по одному набору на каждый из трёх языков —
    // в словаре L их нет, и плодить дубли переводов незачем.
    var _режимГотово = false;

    function показатьГотово() {
        if (!otpNewPasswordForm) { window.location.href = getRedirectUrl(); return; }
        _режимГотово = true;
        clearOtpTimer();

        var заголовок = otpNewPasswordForm.querySelector('.auth-screen-title');
        var подзаголовок = otpNewPasswordForm.querySelector('.auth-screen-subtitle');
        var кнопка = otpNewPasswordForm.querySelector('.auth-btn');
        var д = otpNewPasswordForm.dataset;
        if (заголовок && д.gotovoTitle) заголовок.textContent = д.gotovoTitle;
        if (подзаголовок && д.gotovoSub) подзаголовок.textContent = д.gotovoSub;
        if (кнопка && д.gotovoBtn) кнопка.textContent = д.gotovoBtn;

        if (!document.getElementById('gotovoSkip')) {
            var пропустить = document.createElement('button');
            пропустить.type = 'button';
            пропустить.id = 'gotovoSkip';
            пропустить.className = 'auth-forgot';
            пропустить.style.cssText = 'align-self:center;background:none;border:none;cursor:pointer;font-family:inherit';
            пропустить.textContent = д.gotovoSkip || 'Skip';
            пропустить.addEventListener('click', function() {
                window.location.href = getRedirectUrl();
            });
            otpNewPasswordForm.appendChild(пропустить);
        }

        forms.forEach(function(f) { f.classList.remove('active'); });
        otpNewPasswordForm.classList.add('active');
    }

    // ============================================
    // ВХОД ПО КОДУ
    // ============================================
    //
    // Нужен ровно потому, что пароль ушёл из регистрации: без явной двери
    // человек без пароля попадал внутрь только через «Забыли пароль?» —
    // то есть через починку того, что не сломано.
    //
    // Код уходит существующим потоком forgot_password: тексты писем лежат
    // в таблице notification_texts, и новый поток потребовал бы правки
    // базы. Разделяет их флаг login_only при проверке.
    var входПоКоду = document.getElementById('signinByCode');
    if (входПоКоду) {
        входПоКоду.addEventListener('click', async function(e) {
            e.preventDefault();
            var почта = (document.getElementById('signin-email').value || '').trim();
            if (!похоже_на_почту(почта)) {
                showMessage(signinForm, L.errEmailBad, true);
                document.getElementById('signin-email').focus();
                return;
            }
            var отправка = await sendOtp('forgot_password', почта, 'email');
            if (!отправка || отправка.error) {
                showMessage(signinForm, L.errGeneric, true);
                return;
            }
            showOtpScreen('forgot_password', почта, 'email', отправка.channel || 'email', async function(код) {
                var ответ = await fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                    body: JSON.stringify({
                        flow: 'forgot_password',
                        identifier: почта,
                        code: код,
                        login_only: true
                    })
                });
                var данные = await ответ.json();
                if (данные.error === 'wrong_code') {
                    showMessage(otpCodeForm, (данные.remaining > 0
                        ? L.otpWrongCode + ' (' + данные.remaining + L.otpAttemptsLeft + ')'
                        : L.otpExhausted), true);
                    clearOtpInputs();
                    return;
                }
                if (данные.error) { showMessage(otpCodeForm, L.errGeneric, true); return; }
                if (данные.hashed_token && данные.email) {
                    var вход = await client.auth.verifyOtp({
                        token_hash: данные.hashed_token,
                        type: 'magiclink'
                    });
                    if (!вход.error) {
                        clearOtpTimer();
                        localStorage.setItem('kslt_session_start', Date.now().toString());
                        showMessage(otpCodeForm, L.redirecting, false);
                        setTimeout(function() { window.location.href = getRedirectUrl(); }, 800);
                        return;
                    }
                }
                showMessage(otpCodeForm, L.errGeneric, true);
            });
        });
    }

    // ============================================
    // RESET PASSWORD — Supabase (from email link)
    // ============================================
    if (resetForm) {
        resetForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages(resetForm);

            var newPw = document.getElementById('reset-password').value;
            var confirmPw = document.getElementById('reset-confirm').value;
            var btn = resetForm.querySelector('.auth-btn');

            var allRulesPass = Object.keys(rules).every(function(key) { return rules[key](newPw); });
            if (!allRulesPass) {
                showPwError(resetForm, newPw);
                document.querySelectorAll('.pw-rule-reset').forEach(function(el) {
                    var key = el.dataset.rule;
                    if (rules[key] && !rules[key](newPw)) {
                        el.classList.add('pw-rule-error');
                    } else {
                        el.classList.remove('pw-rule-error');
                    }
                });
                resetPwInput.focus();
                resetPwInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
                return;
            }

            if (newPw !== confirmPw) {
                showMessage(resetForm, L.errResetPwMatch, true);
                return;
            }

            if (!client) {
                showMessage(resetForm, L.errGeneric, true);
                return;
            }

            setLoading(btn, true, L.resetSaving, L.resetSave);

            var result = await client.auth.updateUser({ password: newPw });

            if (result.error) {
                setLoading(btn, false, L.resetSaving, L.resetSave);
                showMessage(resetForm, result.error.message, true);
                return;
            }

            // Sign out so user re-logs with new password
            await client.auth.signOut();
            showScreen('resetSuccess');
        });
    }

    // ============================================
    // GOOGLE OAUTH — Supabase
    // ============================================
    document.querySelectorAll('.auth-social-btn').forEach(function(btn) {
        btn.addEventListener('click', async function() {
            if (!client) return;

            await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: basePath + (isKg ? 'dashboard-kg.html' : isEn ? 'dashboard-en.html' : 'dashboard.html'),
                    queryParams: { prompt: 'select_account' }
                }
            });
        });
    });

    // ============================================
    // APPLE OAUTH — Supabase
    // ============================================
    // Кнопки лежат в разметке спрятанными. Показываем ТОЛЬКО когда провайдер
    // настроен: window.KSLT_APPLE в js/supabase-config.js. Мёртвая кнопка
    // хуже отсутствующей — человек жмёт и получает ошибку провайдера.
    if (window.KSLT_APPLE) {
        document.querySelectorAll('[data-apple-slot]').forEach(function(slot) {
            slot.hidden = false;
        });
        document.querySelectorAll('[data-apple]').forEach(function(btn) {
            btn.hidden = false;
            btn.addEventListener('click', async function() {
                if (!client) return;
                await client.auth.signInWithOAuth({
                    provider: 'apple',
                    options: {
                        redirectTo: basePath + (isKg ? 'dashboard-kg.html' : isEn ? 'dashboard-en.html' : 'dashboard.html')
                    }
                });
            });
        });
    }

    // ============================================
    // CHECK SESSION — redirect if logged in
    // Intercept recovery flow (password reset link)
    // ============================================
    var isRecoveryFlow = false;

    // Clean token hash from URL (after Supabase reads it)
    function cleanHash() {
        if (window.location.hash && window.location.hash.indexOf('access_token') !== -1) {
            history.replaceState(null, '', window.location.pathname + window.location.search);
        }
    }

    // Supabase v2: listen for PASSWORD_RECOVERY event
    if (client) {
        client.auth.onAuthStateChange(function(event, session) {
            cleanHash();
            if (event === 'PASSWORD_RECOVERY') {
                isRecoveryFlow = true;
                showScreen('resetForm');
            }
        });
    }

    async function checkSession() {
        if (!client) return;

        // Check URL hash for recovery type (fallback)
        var hash = window.location.hash;
        if (hash && hash.indexOf('type=recovery') !== -1) {
            // Let onAuthStateChange handle it
            return;
        }

        var result = await client.auth.getSession();

        // Вход из хранилища браузера может оказаться мёртвым: аккаунт удалили,
        // ключ сменили, срок истёк. getSession об этом не знает — он читает
        // localStorage и не спрашивает сервер. Раньше страница входа видела
        // такой вход, уводила на защищённую страницу, та не находила профиль и
        // возвращала обратно — и так без конца, вкладка перезагружалась сама.
        // Поэтому спрашиваем сервер: жив ли этот человек.
        if (result.data && result.data.session) {
            var проверка = await client.auth.getUser();
            if (проверка.error || !проверка.data || !проверка.data.user) {
                await client.auth.signOut().catch(function() {});
                ['kslt_session_start', 'kslt_name', 'kslt_avatar', 'kslt_role']
                    .forEach(function(k) { localStorage.removeItem(k); });
                return;   // остаёмся на странице входа
            }
        }

        if (result.data && result.data.session && !isRecoveryFlow) {
            // Load profile to get role before redirect (important for Google OAuth)
            try {
                var uid = result.data.session.user.id;
                var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', uid).single();
                if (profileRes.data) {
                    if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                    if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                    if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                }
            } catch (e) { /* continue */ }
            checkDeviceFingerprint(result.data.session.user.id);
            // Set session start if not already set (Google OAuth redirect flow)
            if (!localStorage.getItem('kslt_session_start')) {
                localStorage.setItem('kslt_session_start', Date.now().toString());
            }
            window.location.href = getRedirectUrl();
        }
    }
    checkSession();

    // ============================================
    // TELEGRAM LOGIN
    // ============================================
    // Globals from supabase-config.js: SUPABASE_URL, SUPABASE_ANON_KEY, KSLT_TG_BOT
    var TG_BOT = window.KSLT_TG_BOT || 'KSLTennisBot';

    // Populate TG birthday day select (1-31)
    var tgDaySelect = document.getElementById('tg-birth-day');
    if (tgDaySelect) {
        for (var td = 1; td <= 31; td++) {
            var topt = document.createElement('option');
            topt.value = td;
            topt.textContent = td;
            tgDaySelect.appendChild(topt);
        }
    }

    // Populate TG birthday year select
    var tgYearSelect = document.getElementById('tg-birth-year');
    if (tgYearSelect) {
        for (var ty = 2020; ty >= 1940; ty--) {
            var tyopt = document.createElement('option');
            tyopt.value = ty;
            tyopt.textContent = ty;
            tgYearSelect.appendChild(tyopt);
        }
    }

    // Store pending TG data for registration flow
    var _pendingTgData = null;

    var tgRegisterForm = document.getElementById('tgRegisterForm');
    var tgRegBack = document.getElementById('tgRegBack');

    if (tgRegBack) {
        tgRegBack.addEventListener('click', function(e) {
            e.preventDefault();
            _pendingTgData = null;
            tabs[0].classList.add('active');
            showScreen('signinForm');
        });
    }

    // Telegram Login Widget callback (global)
    var _tgAuthInProgress = false;
    window.onTelegramAuth = async function(tgUser) {
        if (!client || _tgAuthInProgress) return;
        _tgAuthInProgress = true;

        // Pass all tgUser fields as-is (Telegram widget provides exact data for HMAC)
        var tgData = {};
        for (var k in tgUser) {
            if (tgUser.hasOwnProperty(k)) {
                tgData[k] = String(tgUser[k]);
            }
        }

        // Show loading on signin form
        var btn = signinForm.querySelector('.auth-btn');
        if (btn) setLoading(btn, true, L.tgLoggingIn, L.signIn);

        try {
            var resp = await fetch(window.SUPABASE_URL + '/functions/v1/telegram-auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ action: 'login', tg_data: tgData })
            });

            var data = await resp.json();

            if (data.status === 'new_user') {
                // Show mini registration form
                _tgAuthInProgress = false;
                if (btn) setLoading(btn, false, L.tgLoggingIn, L.signIn);
                _pendingTgData = tgData;
                var tgRegTitle = document.getElementById('tgRegTitle');
                var tgRegSubtitle = document.getElementById('tgRegSubtitle');
                if (tgRegTitle) tgRegTitle.textContent = L.tgNewUserTitle;
                var tgName = (tgData.first_name || '') + ' ' + (tgData.last_name || '');
                if (tgRegSubtitle) tgRegSubtitle.textContent = L.tgNewUserSubtitle + tgName.trim();
                showScreen('tgRegisterForm');
                return;
            }

            if (data.status === 'ok' && data.hashed_token && data.email) {
                // Verify OTP with hashed token
                var otpResult = await client.auth.verifyOtp({
                    token_hash: data.hashed_token,
                    type: 'magiclink'
                });

                if (otpResult.error) {
                    if (btn) setLoading(btn, false, L.tgLoggingIn, L.signIn);
                    showMessage(signinForm, L.errGeneric, true);
                    return;
                }

                // Cache profile data
                var user = otpResult.data.user;
                if (user) {
                    try {
                        var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', user.id).single();
                        if (profileRes.data) {
                            if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                            if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                            if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                        }
                    } catch (e) { /* continue */ }
                    checkDeviceFingerprint(user.id);
                    // Карточка игрока — сразу, чтобы человек мог записаться
                    // на турнир, не заходя в кабинет
                    завестиКарточкуИгрока();
                }

                localStorage.setItem('kslt_session_start', Date.now().toString());
                showMessage(signinForm, L.redirecting, false);
                setTimeout(function() {
                    window.location.href = getRedirectUrl();
                }, 1000);
                return;
            }

            // Error
            _tgAuthInProgress = false;
            if (btn) setLoading(btn, false, L.tgLoggingIn, L.signIn);
            showMessage(signinForm, data.error || L.errGeneric, true);
        } catch (err) {
            _tgAuthInProgress = false;
            if (btn) setLoading(btn, false, L.tgLoggingIn, L.signIn);
            showMessage(signinForm, L.errGeneric, true);
        }
    };

    // TG mini registration form submit — now uses OTP
    if (tgRegisterForm) {
        tgRegisterForm.addEventListener('submit', async function(e) {
            e.preventDefault();
            clearMessages(tgRegisterForm);

            if (!_pendingTgData || !client) {
                showMessage(tgRegisterForm, L.errGeneric, true);
                return;
            }

            var email = document.getElementById('tg-email').value.trim();
            var gender = document.querySelector('input[name="tg-gender"]:checked');
            var birthDay = document.getElementById('tg-birth-day').value;
            var birthMonth = document.getElementById('tg-birth-month').value;
            var birthYear = document.getElementById('tg-birth-year').value;
            var btn = document.getElementById('tgRegSubmit');

            if (!email) {
                showMessage(tgRegisterForm, L.tgEmailRequired, true);
                return;
            }

            setLoading(btn, true, L.tgRegistering, L.createAccount);

            // Cache TG form data for after OTP
            _otpFormData = {
                email: email,
                tg_data: _pendingTgData,
                full_name: (_pendingTgData.first_name || '') + ' ' + (_pendingTgData.last_name || ''),
                gender: gender ? gender.value : '',
                birth_day: birthDay ? parseInt(birthDay) : null,
                birth_month: birthMonth ? parseInt(birthMonth) : null,
                birth_year: birthYear ? parseInt(birthYear) : null
            };
            _otpTelegramChatId = _pendingTgData.id || null;

            try {
                // Send OTP to Telegram (if chat_id available) or email
                var otpResult = await sendOtp('telegram_register', email, 'email', _otpTelegramChatId);
                setLoading(btn, false, L.tgRegistering, L.createAccount);

                var channel = otpResult.channel || 'email';

                showOtpScreen('telegram_register', email, 'email', channel, async function(code) {
                    var resp = await fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
                        body: JSON.stringify({
                            flow: 'telegram_register',
                            identifier: email,
                            code: code,
                            email: _otpFormData.email,
                            tg_data: _otpFormData.tg_data,
                            full_name: _otpFormData.full_name,
                            gender: _otpFormData.gender,
                            birth_day: _otpFormData.birth_day,
                            birth_month: _otpFormData.birth_month,
                            birth_year: _otpFormData.birth_year
                        })
                    });
                    var data = await resp.json();

                    if (data.error === 'wrong_code') {
                        var inputsWrap = document.getElementById('otpInputs');
                        if (inputsWrap) {
                            inputsWrap.classList.add('shake');
                            setTimeout(function() { inputsWrap.classList.remove('shake'); }, 500);
                        }
                        showMessage(otpCodeForm, (data.remaining > 0 ? L.otpWrongCode + ' (' + data.remaining + L.otpAttemptsLeft + ')' : L.otpExhausted), true);
                        clearOtpInputs();
                        var firstDigit = document.querySelector('#otpInputs .otp-digit');
                        if (firstDigit) firstDigit.focus();
                        return;
                    }
                    if (data.error === 'code_expired') { showMessage(otpCodeForm, L.otpExpired, true); return; }
                    if (data.error === 'code_exhausted') { showMessage(otpCodeForm, L.otpExhausted, true); return; }
                    if (data.error === 'email_taken') { showMessage(otpCodeForm, L.tgEmailTaken, true); return; }
                    if (data.error) { showMessage(otpCodeForm, L.errGeneric, true); return; }

                    // Auto-login
                    clearOtpTimer();
                    if (data.hashed_token && data.email) {
                        var loginResult = await client.auth.verifyOtp({
                            token_hash: data.hashed_token,
                            type: 'magiclink'
                        });
                        if (!loginResult.error && loginResult.data.user) {
                            var user = loginResult.data.user;
                            try {
                                var profileRes = await client.from('profiles').select('full_name, avatar_url, role, lang').eq('id', user.id).single();
                                if (profileRes.data) {
                                    if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                                    if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                                    if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                    // Язык, который человек выбрал в прошлый раз: по нему
                    // откроется кабинет и придут уведомления
                    if (profileRes.data.lang) localStorage.setItem('kslt_lang_saved', profileRes.data.lang);
                                }
                            } catch (e) { /* continue */ }
                            checkDeviceFingerprint(user.id);
                            // Карточка игрока — сразу, чтобы человек мог записаться
                            // на турнир, не заходя в кабинет
                            завестиКарточкуИгрока();
                            localStorage.setItem('kslt_session_start', Date.now().toString());
                        }
                    }
                    _pendingTgData = null;
                    showMessage(otpCodeForm, L.redirecting, false);
                    setTimeout(function() { window.location.href = getRedirectUrl(); }, 1000);
                });
            } catch (err) {
                setLoading(btn, false, L.tgRegistering, L.createAccount);
                showMessage(tgRegisterForm, L.errGeneric, true);
            }
        });
    }

    // Telegram Widget is embedded directly in auth HTML pages
    // It calls window.onTelegramAuth(user) on successful auth — defined above

})();
