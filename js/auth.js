// ============================================
// KSLT — Auth (Supabase)
// ============================================

(function() {
    'use strict';

    // Detect language
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Labels
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
        errPwRules: 'Сыр сөз талаптарга жооп бербейт',
        errPwMatch: 'Сыр сөздөр дал келбейт',
        errGeneric: 'Ката кетти. Кайра аракет кылыңыз.',
        errInvalidLogin: 'Туура эмес email же сыр сөз',
        errEmailTaken: 'Бул email менен аккаунт бар',
        errPhoneTaken: 'Бул телефон номери катталган',
        resetTitle: 'Жаңы сыр сөз',
        resetSaving: 'Сакталууда...',
        resetSave: 'Сыр сөздү сактоо',
        resetSuccess: 'Сыр сөз ийгиликтүү жаңыланды!',
        errResetPwRules: 'Сыр сөз талаптарга жооп бербейт',
        errResetPwMatch: 'Сыр сөздөр дал келбейт',
        successCheckEmail: 'Аккаунтуңузду тастыктоо үчүн email текшериңиз!',
        successResetSent: 'Сыр сөздү калыбына келтирүү шилтемеси email\'ге жөнөтүлдү',
        redirecting: 'Ийгиликтүү! Багыттоо...'
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
        errPwRules: 'Password does not meet requirements',
        errPwMatch: 'Passwords do not match',
        errGeneric: 'An error occurred. Please try again.',
        errInvalidLogin: 'Invalid email or password',
        errEmailTaken: 'An account with this email already exists',
        errPhoneTaken: 'This phone number is already registered',
        resetTitle: 'New Password',
        resetSaving: 'Saving...',
        resetSave: 'Save Password',
        resetSuccess: 'Password updated successfully!',
        errResetPwRules: 'Password does not meet requirements',
        errResetPwMatch: 'Passwords do not match',
        successCheckEmail: 'Check your email to confirm your account!',
        successResetSent: 'Password reset link sent to your email',
        redirecting: 'Success! Redirecting...'
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
        errPwRules: 'Пароль не соответствует требованиям',
        errPwMatch: 'Пароли не совпадают',
        errGeneric: 'Произошла ошибка. Попробуйте снова.',
        errInvalidLogin: 'Неверный email или пароль',
        errEmailTaken: 'Аккаунт с этим email уже существует',
        errPhoneTaken: 'Этот номер телефона уже зарегистрирован',
        resetTitle: 'Новый пароль',
        resetSaving: 'Сохранение...',
        resetSave: 'Сохранить пароль',
        resetSuccess: 'Пароль успешно обновлён!',
        errResetPwRules: 'Пароль не соответствует требованиям',
        errResetPwMatch: 'Пароли не совпадают',
        successCheckEmail: 'Проверьте почту для подтверждения аккаунта!',
        successResetSent: 'Ссылка для сброса пароля отправлена на вашу почту',
        redirecting: 'Успешно! Перенаправление...'
    };

    // Use shared Supabase client from supabase-config.js
    var client = window.supabaseClient;

    // ---- Return URL (from auth-guard redirect) ----
    var params = new URLSearchParams(window.location.search);
    var returnUrl = params.get('return');

    // Base URL (for Supabase OAuth/email redirects)
    var basePath = window.location.href.substring(0, window.location.href.lastIndexOf('/') + 1);

    function getRedirectUrl() {
        if (returnUrl) return returnUrl;
        return isKg ? '../index-kg.html' : isEn ? '../index-en.html' : '../index.html';
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
    var forgotForm = document.getElementById('forgotForm');
    var forgotSuccess = document.getElementById('forgotSuccess');

    var forgotLink = document.querySelector('.auth-forgot');
    var forgotBack = document.getElementById('forgotBack');
    var forgotBackToLogin = document.getElementById('forgotBackToLogin');
    var forgotResend = document.getElementById('forgotResend');
    var forgotEmailConfirm = document.getElementById('forgot-email-confirm');

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
        forgotForm.classList.remove('active');
        forgotSuccess.classList.remove('active');
        if (signupSuccess) signupSuccess.classList.remove('active');
        if (resetForm) resetForm.classList.remove('active');
        if (resetSuccess) resetSuccess.classList.remove('active');
        document.querySelectorAll('.pw-rule').forEach(function(r) { r.classList.remove('valid'); });
        document.querySelectorAll('.pw-rule-reset').forEach(function(r) { r.classList.remove('valid'); });
        document.getElementById(screenId).classList.add('active');
        var hideTabs = (screenId === 'forgotForm' || screenId === 'forgotSuccess' || screenId === 'signupSuccess' || screenId === 'resetForm' || screenId === 'resetSuccess');
        authTabs.style.display = hideTabs ? 'none' : 'flex';
    }

    tabs.forEach(function(tab) {
        tab.addEventListener('click', function() {
            var target = tab.dataset.tab;
            tabs.forEach(function(t) { t.classList.remove('active'); });
            tab.classList.add('active');
            forms.forEach(function(f) { f.classList.remove('active'); });
            document.getElementById(target === 'signin' ? 'signinForm' : 'signupForm').classList.add('active');
        });
    });

    // ---- Forgot password flow ----
    forgotLink.addEventListener('click', function(e) {
        e.preventDefault();
        tabs.forEach(function(t) { t.classList.remove('active'); });
        showScreen('forgotForm');
    });

    forgotBack.addEventListener('click', function(e) {
        e.preventDefault();
        tabs[0].classList.add('active');
        showScreen('signinForm');
    });

    forgotBackToLogin.addEventListener('click', function() {
        tabs[0].classList.add('active');
        showScreen('signinForm');
    });

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
            showScreen('forgotForm');
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
                    } else {
                        el.classList.remove('valid');
                    }
                }
            });
        });
    }

    forgotEmailConfirm.addEventListener('input', function() {
        if (this.value !== document.getElementById('forgot-email').value) {
            this.setCustomValidity(L.errEmailMatch);
        } else {
            this.setCustomValidity('');
        }
    });

    // ---- Eye toggle ----
    document.querySelectorAll('.auth-eye').forEach(function(btn) {
        btn.addEventListener('click', function() {
            var input = document.getElementById(btn.dataset.target);
            var isPassword = input.type === 'password';
            input.type = isPassword ? 'text' : 'password';
            btn.querySelector('.eye-open').style.display = isPassword ? 'none' : 'block';
            btn.querySelector('.eye-closed').style.display = isPassword ? 'block' : 'none';
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

    pwInput.addEventListener('input', function() {
        var val = this.value;
        Object.keys(rules).forEach(function(key) {
            var el = document.querySelector('.pw-rule[data-rule="' + key + '"]');
            if (rules[key](val)) {
                el.classList.add('valid');
            } else {
                el.classList.remove('valid');
            }
        });
    });

    // ---- Email confirm validation ----
    var emailField = document.getElementById('signup-email');
    var emailConfirm = document.getElementById('signup-email-confirm');

    emailConfirm.addEventListener('input', function() {
        if (this.value !== emailField.value) {
            this.setCustomValidity(L.errEmailMatch);
        } else {
            this.setCustomValidity('');
        }
    });

    document.getElementById('signup-confirm').addEventListener('input', function() {
        this.setCustomValidity('');
    });

    // ---- Name script validation (RU → Cyrillic, EN → Latin, KG → Kyrgyz) ----
    var _sRu = /^[а-яА-ЯёЁ\s\-'.]+$/;
    var _sEn = /^[a-zA-Z\s\-'.]+$/;
    var _sKg = /^[а-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;
    var _sRe = isKg ? _sKg : isEn ? _sEn : _sRu;
    var _sHint = isKg ? 'Кыргыз тамгалары гана' : isEn ? 'Latin characters only' : 'Только кириллица';

    ['signup-firstname', 'signup-lastname'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        var hint = document.createElement('div');
        hint.style.cssText = 'color:#ff4444;font-size:0.75rem;margin-top:2px;display:none;';
        hint.textContent = _sHint;
        el.parentNode.appendChild(hint);
        el.addEventListener('input', function() {
            var v = el.value.trim();
            var bad = v.length > 0 && !_sRe.test(v);
            el.style.borderColor = bad ? '#ff4444' : '';
            hint.style.display = bad ? '' : 'none';
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

        if (!client) {
            showMessage(signinForm, L.errGeneric, true);
            return;
        }

        setLoading(btn, true, L.signingIn, L.signIn);

        var result = await client.auth.signInWithPassword({ email: email, password: password });

        if (result.error) {
            setLoading(btn, false, L.signingIn, L.signIn);
            showMessage(signinForm, L.errInvalidLogin, true);
            return;
        }

        // Cache profile data for nav dropdown before redirect
        var user = result.data.user;
        if (user && user.user_metadata && user.user_metadata.full_name) {
            localStorage.setItem('kslt_name', user.user_metadata.full_name);
        }
        if (user) {
            try {
                var profileRes = await client.from('profiles').select('full_name, avatar_url, role').eq('id', user.id).single();
                if (profileRes.data) {
                    if (profileRes.data.full_name) localStorage.setItem('kslt_name', profileRes.data.full_name);
                    if (profileRes.data.avatar_url) localStorage.setItem('kslt_avatar', profileRes.data.avatar_url);
                    if (profileRes.data.role) localStorage.setItem('kslt_role', profileRes.data.role);
                }
            } catch (e) { /* continue with redirect */ }
        }

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
        var emailConf = document.getElementById('signup-email-confirm').value.trim();
        var phoneCode = document.getElementById('signup-phone-code').value.replace(/[A-Z]/g, '');
        var phoneNum = document.getElementById('signup-phone').value.trim().replace(/\s/g, '');
        var gender = document.querySelector('input[name="gender"]:checked');
        var birthDay = document.getElementById('signup-birth-day').value;
        var birthMonth = document.getElementById('signup-birth-month').value;
        var birthYear = document.getElementById('signup-birth-year').value;
        var password = document.getElementById('signup-password').value;
        var confirmPw = document.getElementById('signup-confirm').value;
        var btn = signupForm.querySelector('.auth-btn');

        // Validations
        if (email !== emailConf) {
            emailConfirm.setCustomValidity(L.errEmailMatch);
            emailConfirm.reportValidity();
            return;
        }

        var allRulesPass = Object.keys(rules).every(function(key) { return rules[key](password); });
        if (!allRulesPass) {
            showMessage(signupForm, L.errPwRules, true);
            return;
        }

        if (password !== confirmPw) {
            document.getElementById('signup-confirm').setCustomValidity(L.errPwMatch);
            document.getElementById('signup-confirm').reportValidity();
            return;
        }

        if (!client) {
            showMessage(signupForm, L.errGeneric, true);
            return;
        }

        // Script validation (RU → Cyrillic, EN → Latin, KG → Kyrgyz Cyrillic)
        var _scriptRu = /^[а-яА-ЯёЁ\s\-'.]+$/;
        var _scriptEn = /^[a-zA-Z\s\-'.]+$/;
        var _scriptKg = /^[а-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;
        var _scriptRe = isKg ? _scriptKg : isEn ? _scriptEn : _scriptRu;
        var _scriptMsg = isKg ? 'Атыңызды кыргыз тамгалары менен жазыңыз' : isEn ? 'Name must use Latin characters' : 'Имя и фамилия должны быть на кириллице';

        if ((firstName && !_scriptRe.test(firstName)) || (lastName && !_scriptRe.test(lastName))) {
            showMessage(signupForm, _scriptMsg, true);
            return;
        }

        setLoading(btn, true, L.creatingAccount, L.createAccount);

        // Check email/phone uniqueness before signUp
        var phone = phoneCode + phoneNum;
        try {
            var checkResult = await client.rpc('check_registration_available', {
                p_email: email,
                p_phone: phone
            });
            if (checkResult.data) {
                if (checkResult.data.email_taken) {
                    setLoading(btn, false, L.creatingAccount, L.createAccount);
                    showEmailTakenModal();
                    return;
                }
                if (checkResult.data.phone_taken) {
                    setLoading(btn, false, L.creatingAccount, L.createAccount);
                    showMessage(signupForm, L.errPhoneTaken, true);
                    return;
                }
            }
        } catch (e) {
            console.error('Registration check error:', e);
        }

        var result = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: firstName + ' ' + lastName,
                    phone: phone,
                    gender: gender ? gender.value : '',
                    birth_day: birthDay ? parseInt(birthDay) : null,
                    birth_month: birthMonth ? parseInt(birthMonth) : null,
                    birth_year: birthYear ? parseInt(birthYear) : null
                }
            }
        });

        if (result.error) {
            setLoading(btn, false, L.creatingAccount, L.createAccount);
            if (result.error.message.indexOf('already') !== -1) {
                showEmailTakenModal();
            } else {
                showMessage(signupForm, result.error.message, true);
            }
            return;
        }

        // Detect fake success (email already exists, Supabase hides it)
        if (result.data && result.data.user && result.data.user.identities && result.data.user.identities.length === 0) {
            setLoading(btn, false, L.creatingAccount, L.createAccount);
            showEmailTakenModal();
            return;
        }

        setLoading(btn, false, L.creatingAccount, L.createAccount);

        // Show success screen
        if (signupEmailDisplay) signupEmailDisplay.textContent = email;
        showScreen('signupSuccess');
    });

    // ============================================
    // FORGOT PASSWORD — Supabase
    // ============================================
    forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        clearMessages(forgotForm);

        var email = document.getElementById('forgot-email').value.trim();
        var emailConf = forgotEmailConfirm.value.trim();
        var btn = forgotForm.querySelector('.auth-btn');

        if (email !== emailConf) {
            forgotEmailConfirm.setCustomValidity(L.errEmailMatch);
            forgotEmailConfirm.reportValidity();
            return;
        }

        if (!client) {
            showMessage(forgotForm, L.errGeneric, true);
            return;
        }

        setLoading(btn, true, L.sendingLink, L.sendLink);

        var result = await client.auth.resetPasswordForEmail(email, {
            redirectTo: basePath + (isKg ? 'auth-kg.html' : isEn ? 'auth-en.html' : 'auth.html')
        });

        setLoading(btn, false, L.sendingLink, L.sendLink);

        if (result.error) {
            showMessage(forgotForm, result.error.message, true);
            return;
        }

        document.getElementById('forgotEmailDisplay').textContent = email;
        showScreen('forgotSuccess');
    });

    // Resend
    forgotResend.addEventListener('click', async function(e) {
        e.preventDefault();
        if (!client) return;

        var email = document.getElementById('forgotEmailDisplay').textContent;
        this.textContent = L.sendingLink;

        await client.auth.resetPasswordForEmail(email, {
            redirectTo: basePath + (isKg ? 'auth-kg.html' : isEn ? 'auth-en.html' : 'auth.html')
        });

        this.textContent = L.sent;
        var self = this;
        setTimeout(function() { self.textContent = L.resend; }, 2000);
    });

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
                showMessage(resetForm, L.errResetPwRules, true);
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
    var googleBtn = document.querySelector('.auth-social-btn');
    if (googleBtn) {
        googleBtn.addEventListener('click', async function() {
            if (!client) return;

            await client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: basePath + (isKg ? 'dashboard-kg.html' : isEn ? 'dashboard-en.html' : 'dashboard.html')
                }
            });
        });
    }

    // ============================================
    // CHECK SESSION — redirect if logged in
    // Intercept recovery flow (password reset link)
    // ============================================
    var isRecoveryFlow = false;

    // Supabase v2: listen for PASSWORD_RECOVERY event
    if (client) {
        client.auth.onAuthStateChange(function(event, session) {
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
        if (result.data && result.data.session && !isRecoveryFlow) {
            window.location.href = getRedirectUrl();
        }
    }
    checkSession();

})();
