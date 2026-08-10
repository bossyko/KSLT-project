// ============================================
// KSLT Mobile — Auth Module
// ============================================
(function() {
  'use strict';

  var AUTH = window.KSLT_AUTH = {};
  var I18N = window.KSLT_I18N;

  var _loginAttempts = 0;
  var _lockoutUntil = 0;

  AUTH.currentUser = null;
  AUTH.currentProfile = null;
  AUTH._membershipStatus = false;  // cached membership check

  // Check session on load
  AUTH.checkSession = function() {
    if (!supabaseClient) return Promise.resolve(null);
    return supabaseClient.auth.getSession().then(function(res) {
      if (res.data && res.data.session) {
        // Check session expiry before proceeding
        if (AUTH._checkSessionExpiry && AUTH._checkSessionExpiry()) {
          return null;
        }
        AUTH.currentUser = res.data.session.user;
        return AUTH.loadProfile(AUTH.currentUser.id).then(function(profile) {
          // Cache membership status
          return AUTH.checkMembership().then(function(mem) {
            AUTH._membershipStatus = !!mem;
            return profile;
          });
        });
      }
      return null;
    });
  };

  // Load profile from DB (with retry for new registrations)
  AUTH.loadProfile = function(uid, retries) {
    retries = retries || 0;
    return supabaseClient.from('profiles')
      .select('*, players(*)')
      .eq('id', uid)
      .single()
      .then(function(r) {
        if (r.data) {
          AUTH.currentProfile = r.data;
          // Update last_seen
          supabaseClient.from('profiles')
            .update({ last_seen: new Date().toISOString() })
            .eq('id', uid).then(function(){});
          return r.data;
        }
        // Profile not yet created by trigger — retry up to 3 times
        if (retries < 3) {
          return new Promise(function(resolve) {
            setTimeout(function() {
              resolve(AUTH.loadProfile(uid, retries + 1));
            }, 1000);
          });
        }
        // Fallback: create profile manually
        var meta = AUTH.currentUser.user_metadata || {};
        return supabaseClient.from('profiles')
          .insert({
            id: uid,
            full_name: meta.full_name || meta.name || '',
            email: AUTH.currentUser.email || '',
            phone: meta.phone || '',
            role: 'user'
          })
          .select('*, players(*)')
          .single()
          .then(function(ins) {
            if (ins.data) {
              AUTH.currentProfile = ins.data;
            }
            return ins.data;
          });
      });
  };

  // Login with email/password
  AUTH.login = function(email, password) {
    return supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });
  };

  // Register
  AUTH.register = function(email, password, fullName) {
    return supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName
        }
      }
    });
  };

  // Telegram Login
  AUTH.telegramAuth = function(action, tgData, extra) {
    var SUPABASE_URL = window.SUPABASE_URL || 'https://qqkzszesviukopgjbead.supabase.co';
    var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    var body = { action: action, tg_data: tgData };
    if (extra) {
      Object.keys(extra).forEach(function(k) { body[k] = extra[k]; });
    }
    return fetch(SUPABASE_URL + '/functions/v1/telegram-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  };

  // Verify OTP (magic link token from telegram-auth Edge Function)
  AUTH.verifyTelegramOtp = function(email, hashedToken) {
    return supabaseClient.auth.verifyOtp({
      email: email,
      token: hashedToken,
      type: 'magiclink'
    });
  };

  // Google OAuth
  AUTH.loginGoogle = function() {
    return supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/index.html',
        queryParams: { prompt: 'select_account' }
      }
    });
  };

  // Logout
  AUTH.logout = function() {
    return supabaseClient.auth.signOut().then(function() {
      AUTH.currentUser = null;
      AUTH.currentProfile = null;
      AUTH._membershipStatus = false;
    });
  };

  // Check membership
  AUTH.checkMembership = function() {
    if (!AUTH.currentProfile) return Promise.resolve(null);
    var uid = AUTH.currentProfile.id;
    return supabaseClient.from('memberships')
      .select('*')
      .eq('profile_id', uid)
      .eq('status', 'active')
      .gte('end_date', new Date().toISOString().split('T')[0])
      .order('end_date', { ascending: false })
      .limit(1)
      .then(function(r) {
        return r.data && r.data.length > 0 ? r.data[0] : null;
      });
  };

  // Reset password (legacy — kept for fallback)
  AUTH.resetPassword = function(email) {
    var siteUrl = 'https://kslt.kg';
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl + '/pages/reset-password.html'
    });
  };

  // Send OTP code
  AUTH.sendOtp = function(flow, identifier, identifierType, telegramChatId) {
    var SUPABASE_URL = window.SUPABASE_URL || '';
    var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    var body = { flow: flow, identifier: identifier, identifier_type: identifierType };
    if (telegramChatId) body.telegram_chat_id = telegramChatId;
    return fetch(SUPABASE_URL + '/functions/v1/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  };

  // Verify OTP code
  AUTH.verifyOtp = function(flow, identifier, code, extra) {
    var SUPABASE_URL = window.SUPABASE_URL || '';
    var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
    var body = { flow: flow, identifier: identifier, code: code };
    if (extra) Object.keys(extra).forEach(function(k) { body[k] = extra[k]; });
    return fetch(SUPABASE_URL + '/functions/v1/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
      body: JSON.stringify(body)
    }).then(function(r) { return r.json(); });
  };

  // Setup auth UI handlers
  AUTH.setupAuthUI = function() {
    var authScreen = document.getElementById('authScreen');
    var loginForm = document.getElementById('authLogin');
    var regForm = document.getElementById('authRegister');
    var forgotForm = document.getElementById('authForgot');
    var tabLogin = document.getElementById('authTabLogin');
    var tabRegister = document.getElementById('authTabRegister');
    var skipBtn = document.getElementById('authSkip');
    var googleBtn = document.getElementById('authGoogle');
    var forgotLink = document.getElementById('authForgotLink');
    var backToLogin = document.getElementById('authBackToLogin');

    var loginDivider = document.getElementById('authLoginDivider');
    var loginSocial = document.getElementById('authLoginSocial');
    var regOptions = document.getElementById('regOptions');
    var regFields = document.getElementById('regFields');
    var regShowForm = document.getElementById('regShowForm');
    var regGoogleBtn = document.getElementById('regGoogle');
    var regTelegramBtn = document.getElementById('regTelegram');

    function switchTab(tab) {
      tabLogin.classList.toggle('active', tab === 'login');
      tabRegister.classList.toggle('active', tab === 'register');
      loginForm.classList.toggle('active', tab === 'login');
      regForm.classList.toggle('active', tab === 'register');
      if (forgotForm) forgotForm.classList.toggle('active', tab === 'forgot');
      // Show/hide login social buttons
      if (loginDivider) loginDivider.style.display = (tab === 'login') ? '' : 'none';
      if (loginSocial) loginSocial.style.display = (tab === 'login') ? '' : 'none';
      // Reset register view: show options, hide fields
      if (regOptions) regOptions.style.display = '';
      if (regFields) regFields.style.display = 'none';
    }

    tabLogin.addEventListener('click', function() { switchTab('login'); });
    tabRegister.addEventListener('click', function() { switchTab('register'); });

    // Register: show form on button click
    if (regShowForm && regFields && regOptions) {
      regShowForm.addEventListener('click', function() {
        regOptions.style.display = 'none';
        regFields.style.display = '';
      });
    }

    // Register Google → same as login Google
    if (regGoogleBtn) {
      regGoogleBtn.addEventListener('click', function() {
        AUTH.loginGoogle();
      });
    }

    // Register Telegram → same as login Telegram
    if (regTelegramBtn) {
      regTelegramBtn.addEventListener('click', function() {
        var tgBtnLogin = document.getElementById('authTelegram');
        if (tgBtnLogin) tgBtnLogin.click();
      });
    }

    // Forgot password link
    if (forgotLink) {
      forgotLink.addEventListener('click', function() { switchTab('forgot'); });
    }
    if (backToLogin) {
      backToLogin.addEventListener('click', function() { switchTab('login'); });
    }

    // --- OTP overlay management ---
    var _otpFlow = null;
    var _otpIdentifier = null;
    var _otpIdentifierType = null;
    var _otpCallback = null;
    var _otpTimerInterval = null;
    var _otpFormData = null;
    var _otpTelegramChatId = null;

    var otpOverlay = document.getElementById('otpOverlay');
    var otpPwOverlay = document.getElementById('otpPwOverlay');
    var otpPwForm = document.getElementById('otpPwForm');

    function setupOtpDigits() {
      var digits = document.querySelectorAll('#otpInputs .otp-digit');
      digits.forEach(function(input, idx) {
        input.value = '';
        input.classList.remove('filled');
        input.addEventListener('input', function() {
          var val = this.value.replace(/\D/g, '');
          this.value = val ? val[0] : '';
          this.classList.toggle('filled', !!this.value);
          if (val && idx < digits.length - 1) digits[idx + 1].focus();
          var code = '';
          digits.forEach(function(d) { code += d.value; });
          if (code.length === 6 && _otpCallback) _otpCallback(code);
        });
        input.addEventListener('keydown', function(e) {
          if (e.key === 'Backspace' && !this.value && idx > 0) {
            digits[idx - 1].focus();
            digits[idx - 1].value = '';
            digits[idx - 1].classList.remove('filled');
          }
        });
        input.addEventListener('paste', function(e) {
          e.preventDefault();
          var paste = (e.clipboardData || window.clipboardData).getData('text').replace(/\D/g, '');
          if (paste.length >= 6) {
            for (var i = 0; i < 6; i++) {
              digits[i].value = paste[i] || '';
              digits[i].classList.toggle('filled', !!digits[i].value);
            }
            digits[5].focus();
            if (_otpCallback) _otpCallback(paste.substring(0, 6));
          }
        });
      });
    }
    setupOtpDigits();

    function clearOtpInputs() {
      document.querySelectorAll('#otpInputs .otp-digit').forEach(function(d) {
        d.value = ''; d.classList.remove('filled');
      });
      var w = document.getElementById('otpInputs');
      if (w) w.classList.remove('shake');
    }

    function startOtpTimer(seconds) {
      clearOtpTimer();
      var el = document.getElementById('otpTimer');
      var remaining = seconds;
      function tick() {
        var m = Math.floor(remaining / 60);
        var s = remaining % 60;
        el.innerHTML = I18N.t('otp.validFor') + ' <strong>' + m + ':' + (s < 10 ? '0' : '') + s + '</strong>';
        if (remaining <= 0) { clearOtpTimer(); el.innerHTML = '<strong style="color:var(--red)">Код истёк</strong>'; }
        remaining--;
      }
      tick();
      _otpTimerInterval = setInterval(tick, 1000);
    }

    function clearOtpTimer() {
      if (_otpTimerInterval) { clearInterval(_otpTimerInterval); _otpTimerInterval = null; }
    }

    function showOtpOverlay(flow, identifier, identifierType, channel, callback) {
      startResendCooldown(60);
      _otpFlow = flow;
      _otpIdentifier = identifier;
      _otpIdentifierType = identifierType;
      _otpCallback = callback;
      var sub = document.getElementById('otpSubtitle');
      if (sub) sub.textContent = I18N.t(channel === 'telegram' ? 'otp.sentToTelegram' : 'otp.sentToEmail');
      var hint = document.getElementById('otpChannelHint');
      if (hint) {
        hint.innerHTML = channel === 'telegram'
          ? '<svg viewBox="0 0 24 24" fill="#2AABEE" width="16" height="16"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg> Telegram'
          : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="16" height="16"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="M22 4l-10 8L2 4"/></svg> Email';
      }
      var errEl = document.getElementById('otpError');
      if (errEl) errEl.textContent = '';
      clearOtpInputs();
      otpOverlay.classList.add('open');
      startOtpTimer(600);
      var first = document.querySelector('#otpInputs .otp-digit');
      if (first) setTimeout(function() { first.focus(); }, 200);
    }

    function hideOtpOverlay() {
      otpOverlay.classList.remove('open');
      clearOtpTimer();
      _otpCallback = null;
    }

    function showOtpError(msg) {
      var el = document.getElementById('otpError');
      if (el) el.textContent = msg;
    }

    function shakeOtp() {
      var w = document.getElementById('otpInputs');
      if (w) { w.classList.add('shake'); setTimeout(function() { w.classList.remove('shake'); }, 500); }
    }

    /**
     * Задержка перед повторной отправкой кода.
     *
     * Без неё человек, не увидевший письма, жмёт ссылку подряд, упирается в
     * серверный лимит в пять запросов и получает блокировку на четверть часа —
     * то есть наказание за то, что письмо шло медленно.
     */
    var otpResendLink = document.getElementById('otpResend');
    var _resendInterval = null;

    function startResendCooldown(seconds) {
      if (!otpResendLink) return;
      clearInterval(_resendInterval);
      var left = seconds;

      function tick() {
        if (left <= 0) {
          clearInterval(_resendInterval);
          otpResendLink.textContent = I18N.t('otp.resend');
          otpResendLink.style.pointerEvents = '';
          otpResendLink.style.opacity = '';
          return;
        }
        otpResendLink.textContent = I18N.t('otp.resend') + ' (' + left + ')';
        left--;
      }

      otpResendLink.style.pointerEvents = 'none';
      otpResendLink.style.opacity = '0.5';
      tick();
      _resendInterval = setInterval(tick, 1000);
    }

    if (otpResendLink) {
      otpResendLink.addEventListener('click', function(e) {
        e.preventDefault();
        if (!_otpFlow || !_otpIdentifier) return;
        this.textContent = I18N.t('otp.sending');
        var self = this;
        AUTH.sendOtp(_otpFlow, _otpIdentifier, _otpIdentifierType || 'email', _otpTelegramChatId).then(function() {
          clearOtpInputs();
          startOtpTimer(600);
          self.textContent = I18N.t('otp.sent');
          setTimeout(function() { startResendCooldown(60); }, 1500);
        });
      });
    }

    // Auto-login helper after OTP verification
    function autoLoginAfterOtp(data, onDone) {
      if (data.hashed_token && data.email) {
        supabaseClient.auth.verifyOtp({
          token_hash: data.hashed_token,
          type: 'magiclink'
        }).then(function(otpRes) {
          if (!otpRes.error && otpRes.data.user) {
            AUTH.currentUser = otpRes.data.user;
            localStorage.setItem('kslt_session_start', Date.now().toString());
            localStorage.setItem('kslt_last_activity', Date.now().toString());
            try { checkDeviceFingerprint(otpRes.data.user.id); } catch(e) {}
            AUTH.loadProfile(otpRes.data.user.id).then(function() {
              onDone();
            });
          } else {
            onDone();
          }
        });
      } else {
        onDone();
      }
    }

    // Method tabs for forgot password
    var fMethodTabs = document.querySelectorAll('#authForgot .otp-method-tab');
    var fEmailField = document.getElementById('forgotEmailField');
    var fPhoneField = document.getElementById('forgotPhoneField');
    fMethodTabs.forEach(function(tab) {
      tab.addEventListener('click', function() {
        fMethodTabs.forEach(function(t) { t.classList.remove('active'); });
        tab.classList.add('active');
        var m = tab.dataset.method;
        if (fEmailField) fEmailField.style.display = m === 'email' ? '' : 'none';
        if (fPhoneField) fPhoneField.style.display = m === 'phone' ? '' : 'none';
      });
    });

    // Forgot password form — OTP flow
    if (forgotForm) {
      forgotForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var errEl = document.getElementById('forgotError');
        var btn = document.getElementById('forgotSubmitBtn');
        errEl.className = 'auth-error';
        errEl.textContent = '';

        var activeTab = forgotForm.querySelector('.otp-method-tab.active');
        var method = activeTab ? activeTab.dataset.method : 'email';
        var identifier, identifierType;

        if (method === 'phone') {
          var country = document.getElementById('forgotCountry').value;
          var phone = document.getElementById('forgotPhone').value.trim();
          if (!phone) return;
          identifier = country + phone.replace(/[\s\-()]/g, '');
          identifierType = 'phone';
        } else {
          identifier = document.getElementById('forgotEmail').value.trim();
          identifierType = 'email';
          if (!identifier) return;
        }

        btn.disabled = true;
        btn.textContent = I18N.t('otp.sending');

        try {
          var result = await AUTH.sendOtp('forgot_password', identifier, identifierType);
          btn.disabled = false;
          btn.textContent = I18N.t('otp.sendCode');

          showOtpOverlay('forgot_password', identifier, identifierType, result.channel || 'email', async function(code) {
            var data = await AUTH.verifyOtp('forgot_password', identifier, code);
            if (data.error === 'wrong_code') {
              shakeOtp();
              showOtpError(data.remaining > 0 ? I18N.t('otp.wrongCode') + ' (' + data.remaining + ' ' + I18N.t('otp.attemptsLeft') + ')' : I18N.t('otp.exhausted'));
              clearOtpInputs();
              var first = document.querySelector('#otpInputs .otp-digit');
              if (first) first.focus();
              return;
            }
            if (data.error === 'code_expired') { showOtpError(I18N.t('otp.expired')); return; }
            if (data.error === 'code_exhausted') { showOtpError(I18N.t('otp.exhausted')); return; }
            if (data.error) { showOtpError(I18N.t('otp.genericError')); return; }

            // Code verified — save code for password step
            _otpFormData = _otpFormData || {};
            _otpFormData._verifiedCode = code;
            hideOtpOverlay();
            otpPwOverlay.classList.add('open');
          });
        } catch (err) {
          btn.disabled = false;
          btn.textContent = I18N.t('otp.sendCode');
          errEl.textContent = I18N.t('otp.genericError');
          errEl.className = 'auth-error show';
        }
      });
    }

    // New password form submit (after forgot password OTP)
    if (otpPwForm) {
      otpPwForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        var newPw = document.getElementById('otpNewPassword').value;
        var confirmPw = document.getElementById('otpConfirmPassword').value;
        var errEl = document.getElementById('otpPwError');
        errEl.className = 'auth-error';
        errEl.textContent = '';

        if (newPw.length < 8 || !/[A-Z]/.test(newPw) || !/[0-9]/.test(newPw) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(newPw)) {
          errEl.textContent = I18N.t('otp.passwordRule');
          errEl.className = 'auth-error show';
          return;
        }
        if (newPw !== confirmPw) {
          errEl.textContent = I18N.t('otp.passwordMismatch');
          errEl.className = 'auth-error show';
          return;
        }

        var btn = otpPwForm.querySelector('.auth-submit');
        btn.disabled = true;
        btn.textContent = I18N.t('otp.saving');

        try {
          var data = await AUTH.verifyOtp('forgot_password', _otpIdentifier, (_otpFormData && _otpFormData._verifiedCode) || '', {
            new_password: newPw
          });

          if (data.error) {
            errEl.textContent = data.error;
            errEl.className = 'auth-error show';
            btn.disabled = false;
            btn.textContent = I18N.t('otp.savePassword');
            return;
          }

          autoLoginAfterOtp(data, function() {
            otpPwOverlay.classList.remove('open');
            authScreen.classList.remove('open');
            if (window.KSLT_APP && window.KSLT_APP.onAuthChange) window.KSLT_APP.onAuthChange();
          });
        } catch (err) {
          errEl.textContent = I18N.t('otp.genericError');
          errEl.className = 'auth-error show';
          btn.disabled = false;
          btn.textContent = I18N.t('otp.savePassword');
        }
      });
    }

    skipBtn.addEventListener('click', function() {
      authScreen.classList.remove('open');
      // Load home screen for guest
      if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
        window.KSLT_APP.onAuthChange();
      }
    });

    // Login
    loginForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value.trim();
      var pass = document.getElementById('loginPassword').value;
      var errEl = document.getElementById('loginError');
      errEl.className = 'auth-error';
      errEl.textContent = '';

      // Client-side rate limit
      if (Date.now() < _lockoutUntil) {
        errEl.textContent = I18N.t('otp.tooManyTries');
        errEl.className = 'auth-error show';
        return;
      }

      // Server-side rate limit
      try {
        var SUPABASE_URL = window.SUPABASE_URL || 'https://qqkzszesviukopgjbead.supabase.co';
        var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
        var rlRes = await fetch(SUPABASE_URL + '/functions/v1/rate-limit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'apikey': SUPABASE_ANON_KEY },
          body: JSON.stringify({ action: 'login', key: email })
        });
        var rlData = await rlRes.json();
        if (!rlData.allowed) {
          errEl.textContent = I18N.t('otp.tooManyTries');
          errEl.className = 'auth-error show';
          return;
        }
      } catch (e) { /* fail open */ }

      AUTH.login(email, pass).then(function(res) {
        if (res.error) {
          _loginAttempts++;
          if (_loginAttempts >= 5) {
            _lockoutUntil = Date.now() + 60000;
            _loginAttempts = 0;
          }
          errEl.textContent = res.error.message === 'Invalid login credentials'
            ? 'Неверный email или пароль' : res.error.message;
          errEl.className = 'auth-error show';
          return;
        }
        _loginAttempts = 0;
        AUTH.currentUser = res.data.user;
        localStorage.setItem('kslt_session_start', Date.now().toString());
        localStorage.setItem('kslt_last_activity', Date.now().toString());
        try { checkDeviceFingerprint(res.data.user.id); } catch(e) {}
        AUTH.loadProfile(res.data.user.id).then(function() {
          authScreen.classList.remove('open');
          if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
            window.KSLT_APP.onAuthChange();
          }
        });
      });
    });

    // Register — OTP flow
    regForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      var name = document.getElementById('regName').value.trim();
      var email = document.getElementById('regEmail').value.trim();
      var pass = document.getElementById('regPassword').value;
      var errEl = document.getElementById('regError');
      errEl.className = 'auth-error';
      errEl.textContent = '';

      if (pass.length < 8 || !/[A-Z]/.test(pass) || !/[0-9]/.test(pass) || !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pass)) {
        errEl.textContent = I18N.t('otp.passwordRule');
        errEl.className = 'auth-error show';
        return;
      }

      _otpFormData = { email: email, password: pass, full_name: name };

      try {
        var result = await AUTH.sendOtp('register', email, 'email');

        showOtpOverlay('register', email, 'email', result.channel || 'email', async function(code) {
          var data = await AUTH.verifyOtp('register', email, code, {
            email: _otpFormData.email,
            password: _otpFormData.password,
            full_name: _otpFormData.full_name
          });

          if (data.error === 'wrong_code') {
            shakeOtp();
            showOtpError(data.remaining > 0 ? I18N.t('otp.wrongCode') + ' (' + data.remaining + ' ' + I18N.t('otp.attemptsLeft') + ')' : I18N.t('otp.exhausted'));
            clearOtpInputs();
            var first = document.querySelector('#otpInputs .otp-digit');
            if (first) first.focus();
            return;
          }
          if (data.error === 'code_expired') { showOtpError(I18N.t('otp.expired')); return; }
          if (data.error === 'code_exhausted') { showOtpError(I18N.t('otp.exhausted')); return; }
          if (data.error === 'email_taken') { showOtpError('Этот email уже зарегистрирован'); return; }
          if (data.error) { showOtpError(I18N.t('otp.genericError')); return; }

          hideOtpOverlay();
          autoLoginAfterOtp(data, function() {
            authScreen.classList.remove('open');
            if (window.KSLT_APP && window.KSLT_APP.onAuthChange) window.KSLT_APP.onAuthChange();
          });
        });
      } catch (err) {
        errEl.textContent = I18N.t('otp.genericError');
        errEl.className = 'auth-error show';
      }
    });

    // Google
    if (googleBtn) {
      googleBtn.addEventListener('click', function() {
        AUTH.loginGoogle();
      });
    }

    // Telegram
    var tgBtn = document.getElementById('authTelegram');
    if (tgBtn) {
      tgBtn.addEventListener('click', function() {
        // Load Telegram widget in hidden container
        var container = document.getElementById('tg-widget-mob');
        if (!container) {
          container = document.createElement('div');
          container.id = 'tg-widget-mob';
          container.style.cssText = 'position:absolute;overflow:hidden;width:1px;height:1px;opacity:0.01;';
          document.body.appendChild(container);
          var script = document.createElement('script');
          var botName = window.KSLT_TG_BOT || 'KSLTennisBot';
          script.src = 'https://telegram.org/js/telegram-widget.js?22';
          script.setAttribute('data-telegram-login', botName);
          script.setAttribute('data-size', 'large');
          script.setAttribute('data-onauth', '_onMobileTgAuth(user)');
          script.setAttribute('data-request-access', 'write');
          script.async = true;
          container.appendChild(script);
        }
        // Show container for user to click TG widget
        container.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.5);opacity:1;';
        var iframe = container.querySelector('iframe');
        if (iframe) {
          iframe.style.cssText = 'width:250px;height:40px;border:none;cursor:pointer;';
        }
        // Click outside to close
        container.onclick = function(e) {
          if (e.target === container) {
            container.style.cssText = 'position:absolute;overflow:hidden;width:1px;height:1px;opacity:0.01;';
          }
        };
      });
    }

    // --- Telegram Registration Modal ---
    var _pendingTgData = null;
    var tgRegOverlay = document.getElementById('tgRegOverlay');
    var tgRegClose = document.getElementById('tgRegClose');
    var tgRegForm = document.getElementById('tgRegForm');
    var tgRegNameInput = document.getElementById('tgRegName');
    var tgRegEmailInput = document.getElementById('tgRegEmail');
    var tgRegError = document.getElementById('tgRegError');
    var tgRegSubtitle = document.getElementById('tgRegSubtitle');

    function showTgRegModal(tgData) {
      _pendingTgData = tgData;
      var tgName = ((tgData.first_name || '') + ' ' + (tgData.last_name || '')).trim();
      tgRegNameInput.value = tgName || '';
      tgRegNameInput.placeholder = tgName || 'Иван Иванов';
      tgRegEmailInput.value = '';
      tgRegError.className = 'auth-error';
      tgRegError.textContent = '';
      tgRegSubtitle.textContent = tgData.username ? '@' + tgData.username : '';
      tgRegOverlay.classList.add('open');
    }

    function hideTgRegModal() {
      tgRegOverlay.classList.remove('open');
      _pendingTgData = null;
    }

    if (tgRegClose) tgRegClose.addEventListener('click', hideTgRegModal);
    if (tgRegOverlay) tgRegOverlay.addEventListener('click', function(e) {
      if (e.target === tgRegOverlay) hideTgRegModal();
    });

    if (tgRegForm) {
      tgRegForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        if (!_pendingTgData) return;

        var fullName = tgRegNameInput.value.trim();
        var email = tgRegEmailInput.value.trim().toLowerCase();
        tgRegError.className = 'auth-error';
        tgRegError.textContent = '';

        if (!fullName) {
          tgRegError.textContent = 'Введите полное имя';
          tgRegError.className = 'auth-error show';
          return;
        }
        if (!email) {
          tgRegError.textContent = 'Введите email';
          tgRegError.className = 'auth-error show';
          return;
        }

        var submitBtn = tgRegForm.querySelector('.auth-submit');
        submitBtn.disabled = true;
        submitBtn.textContent = 'Создание...';

        _otpFormData = {
          email: email,
          tg_data: _pendingTgData,
          full_name: fullName
        };
        _otpTelegramChatId = _pendingTgData.id || null;

        try {
          var result = await AUTH.sendOtp('telegram_register', email, 'email', _otpTelegramChatId);
          submitBtn.disabled = false;
          submitBtn.textContent = 'Создать аккаунт';
          hideTgRegModal();

          showOtpOverlay('telegram_register', email, 'email', result.channel || 'email', async function(code) {
            var data = await AUTH.verifyOtp('telegram_register', email, code, {
              email: _otpFormData.email,
              tg_data: _otpFormData.tg_data,
              full_name: _otpFormData.full_name
            });

            if (data.error === 'wrong_code') {
              shakeOtp();
              showOtpError(data.remaining > 0 ? I18N.t('otp.wrongCode') + ' (' + data.remaining + ' ' + I18N.t('otp.attemptsLeft') + ')' : I18N.t('otp.exhausted'));
              clearOtpInputs();
              var first = document.querySelector('#otpInputs .otp-digit');
              if (first) first.focus();
              return;
            }
            if (data.error === 'code_expired') { showOtpError(I18N.t('otp.expired')); return; }
            if (data.error === 'code_exhausted') { showOtpError(I18N.t('otp.exhausted')); return; }
            if (data.error === 'email_taken') { showOtpError('Этот email уже зарегистрирован'); return; }
            if (data.error) { showOtpError(I18N.t('otp.genericError')); return; }

            hideOtpOverlay();
            _pendingTgData = null;
            autoLoginAfterOtp(data, function() {
              authScreen.classList.remove('open');
              if (window.KSLT_APP && window.KSLT_APP.onAuthChange) window.KSLT_APP.onAuthChange();
            });
          });
        } catch (err) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Создать аккаунт';
          tgRegError.textContent = 'Ошибка. Попробуйте снова.';
          tgRegError.className = 'auth-error show';
        }
      });
    }

    // Global TG auth callback for mobile
    window._onMobileTgAuth = function(tgUser) {
      var tgData = {
        id: String(tgUser.id),
        first_name: tgUser.first_name || '',
        last_name: tgUser.last_name || '',
        username: tgUser.username || '',
        photo_url: tgUser.photo_url || '',
        auth_date: String(tgUser.auth_date),
        hash: tgUser.hash
      };
      var container = document.getElementById('tg-widget-mob');
      if (container) container.style.cssText = 'position:absolute;overflow:hidden;width:1px;height:1px;opacity:0.01;';

      AUTH.telegramAuth('login', tgData).then(function(data) {
        if (data.status === 'new_user') {
          showTgRegModal(tgData);
          return;
        }

        if (data.status === 'ok' && data.hashed_token) {
          AUTH.verifyTelegramOtp(data.email, data.hashed_token).then(function(otpRes) {
            if (otpRes.error) return;
            AUTH.currentUser = otpRes.data.user;
            localStorage.setItem('kslt_session_start', Date.now().toString());
            localStorage.setItem('kslt_last_activity', Date.now().toString());
            try { checkDeviceFingerprint(otpRes.data.user.id); } catch(e) {}
            AUTH.loadProfile(otpRes.data.user.id).then(function() {
              authScreen.classList.remove('open');
              if (window.KSLT_APP && window.KSLT_APP.onAuthChange) window.KSLT_APP.onAuthChange();
            });
          });
        }
      });
    };
  };

  // Show auth screen
  AUTH.showAuth = function() {
    document.getElementById('authScreen').classList.add('open');
  };

  // ---- Device fingerprint ----
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
      supabaseClient.from('user_devices').select('id').eq('profile_id', userId).eq('device_hash', deviceHash).maybeSingle().then(function(res) {
        var isNew = !res.data;
        supabaseClient.from('user_devices').upsert({
          profile_id: userId,
          device_hash: deviceHash,
          user_agent: navigator.userAgent.substring(0, 500),
          last_seen: new Date().toISOString()
        }, { onConflict: 'profile_id,device_hash' }).then(function() {});
        if (isNew) {
          supabaseClient.auth.getSession().then(function(s) {
            var token = s.data && s.data.session && s.data.session.access_token;
            if (token) {
              var SUPABASE_URL = window.SUPABASE_URL || 'https://qqkzszesviukopgjbead.supabase.co';
              var SUPABASE_ANON_KEY = window.SUPABASE_ANON_KEY || '';
              fetch(SUPABASE_URL + '/functions/v1/security-notify', {
                method: 'POST',
                headers: {
                  'Authorization': 'Bearer ' + token,
                  'Content-Type': 'application/json',
                  'apikey': SUPABASE_ANON_KEY
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

  AUTH.checkDeviceFingerprint = checkDeviceFingerprint;

  // ---- Session monitor ----
  var SESSION_IDLE_MS = 30 * 60 * 1000;   // 30 min
  var SESSION_MAX_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

  function updateActivity() {
    localStorage.setItem('kslt_last_activity', Date.now().toString());
  }

  function checkSessionExpiry() {
    var lastActivity = parseInt(localStorage.getItem('kslt_last_activity')) || Date.now();
    var sessionStart = parseInt(localStorage.getItem('kslt_session_start')) || Date.now();
    var now = Date.now();

    if ((now - lastActivity > SESSION_IDLE_MS) || (now - sessionStart > SESSION_MAX_MS)) {
      AUTH.logout().then(function() {
        AUTH.showAuth();
        if (window.KSLT_APP) window.KSLT_APP.toast('Session expired');
      });
      return true;
    }
    return false;
  }

  // Track activity on touch/click
  document.addEventListener('touchstart', updateActivity, { passive: true });
  document.addEventListener('click', updateActivity, { passive: true });

  AUTH._checkSessionExpiry = checkSessionExpiry;

})();
