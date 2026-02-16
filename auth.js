// ============================================
// KSLT — Auth (Supabase)
// ============================================

(function() {
    'use strict';

    // Detect language
    var isEn = window.location.pathname.indexOf('-en') !== -1;

    // Labels
    var L = isEn ? {
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
        successCheckEmail: 'Проверьте почту для подтверждения аккаунта!',
        successResetSent: 'Ссылка для сброса пароля отправлена на вашу почту',
        redirecting: 'Успешно! Перенаправление...'
    };

    // Init Supabase
    var client = null;
    if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

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
        forms.forEach(function(f) { f.classList.remove('active'); });
        forgotForm.classList.remove('active');
        forgotSuccess.classList.remove('active');
        document.getElementById(screenId).classList.add('active');
        authTabs.style.display = (screenId === 'forgotForm' || screenId === 'forgotSuccess') ? 'none' : 'flex';
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

        showMessage(signinForm, L.redirecting, false);
        setTimeout(function() {
            window.location.href = isEn ? 'index-en.html' : 'index.html';
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

        setLoading(btn, true, L.creatingAccount, L.createAccount);

        var result = await client.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: firstName + ' ' + lastName,
                    phone: phoneCode + phoneNum,
                    gender: gender ? gender.value : ''
                }
            }
        });

        if (result.error) {
            setLoading(btn, false, L.creatingAccount, L.createAccount);
            if (result.error.message.indexOf('already') !== -1) {
                showMessage(signupForm, L.errEmailTaken, true);
            } else {
                showMessage(signupForm, result.error.message, true);
            }
            return;
        }

        setLoading(btn, false, L.creatingAccount, L.createAccount);
        showMessage(signupForm, L.successCheckEmail, false);
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
            redirectTo: window.location.origin + (isEn ? '/auth-en.html' : '/auth.html')
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
            redirectTo: window.location.origin + (isEn ? '/auth-en.html' : '/auth.html')
        });

        this.textContent = L.sent;
        var self = this;
        setTimeout(function() { self.textContent = L.resend; }, 2000);
    });

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
                    redirectTo: window.location.origin + (isEn ? '/index-en.html' : '/index.html')
                }
            });
        });
    }

    // ============================================
    // CHECK SESSION — redirect if logged in
    // ============================================
    async function checkSession() {
        if (!client) return;
        var result = await client.auth.getSession();
        if (result.data && result.data.session) {
            window.location.href = isEn ? 'index-en.html' : 'index.html';
        }
    }
    checkSession();

})();
