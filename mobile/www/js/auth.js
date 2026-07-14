// ============================================
// KSLT Mobile — Auth Module
// ============================================
(function() {
  'use strict';

  var AUTH = window.KSLT_AUTH = {};

  AUTH.currentUser = null;
  AUTH.currentProfile = null;
  AUTH._membershipStatus = false;  // cached membership check

  // Check session on load
  AUTH.checkSession = function() {
    if (!supabaseClient) return Promise.resolve(null);
    return supabaseClient.auth.getSession().then(function(res) {
      if (res.data && res.data.session) {
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

  // Reset password
  AUTH.resetPassword = function(email) {
    var siteUrl = 'https://kslt.kg';
    return supabaseClient.auth.resetPasswordForEmail(email, {
      redirectTo: siteUrl + '/pages/reset-password.html'
    });
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

    // Forgot password form
    if (forgotForm) {
      forgotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var email = document.getElementById('forgotEmail').value.trim();
        var errEl = document.getElementById('forgotError');
        var successEl = document.getElementById('forgotSuccess');
        var btn = document.getElementById('forgotSubmitBtn');
        var I18N = window.KSLT_I18N;

        errEl.className = 'auth-error';
        errEl.textContent = '';
        successEl.style.display = 'none';

        if (!email) return;

        btn.disabled = true;
        btn.textContent = I18N ? I18N.t('common.loading') : 'Loading...';

        AUTH.resetPassword(email).then(function(res) {
          btn.disabled = false;
          btn.textContent = I18N ? I18N.t('auth.sendReset') : 'Send link';

          if (res.error) {
            errEl.textContent = res.error.message;
            errEl.className = 'auth-error show';
            return;
          }
          successEl.textContent = I18N ? I18N.t('auth.checkEmail') : 'Check your email';
          successEl.style.display = 'block';
        });
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
    loginForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var email = document.getElementById('loginEmail').value.trim();
      var pass = document.getElementById('loginPassword').value;
      var errEl = document.getElementById('loginError');
      errEl.className = 'auth-error';
      errEl.textContent = '';

      AUTH.login(email, pass).then(function(res) {
        if (res.error) {
          errEl.textContent = res.error.message === 'Invalid login credentials'
            ? 'Неверный email или пароль' : res.error.message;
          errEl.className = 'auth-error show';
          return;
        }
        AUTH.currentUser = res.data.user;
        AUTH.loadProfile(res.data.user.id).then(function() {
          authScreen.classList.remove('open');
          if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
            window.KSLT_APP.onAuthChange();
          }
        });
      });
    });

    // Register
    regForm.addEventListener('submit', function(e) {
      e.preventDefault();
      var name = document.getElementById('regName').value.trim();
      var email = document.getElementById('regEmail').value.trim();
      var pass = document.getElementById('regPassword').value;
      var errEl = document.getElementById('regError');
      errEl.className = 'auth-error';
      errEl.textContent = '';

      if (pass.length < 6) {
        errEl.textContent = 'Пароль минимум 6 символов';
        errEl.className = 'auth-error show';
        return;
      }

      AUTH.register(email, pass, name).then(function(res) {
        if (res.error) {
          errEl.textContent = res.error.message === 'User already registered'
            ? 'Этот email уже зарегистрирован. Войдите.' : res.error.message;
          errEl.className = 'auth-error show';
          return;
        }
        // Supabase returns fake success for duplicate email (when confirm email is on)
        if (res.data.user && res.data.user.identities && res.data.user.identities.length === 0) {
          errEl.textContent = 'Этот email уже зарегистрирован. Войдите.';
          errEl.className = 'auth-error show';
          return;
        }
        if (res.data.user) {
          // Check if email confirmation is required
          if (res.data.session) {
            // Session exists — email confirmed or confirmation disabled
            AUTH.currentUser = res.data.user;
            AUTH.loadProfile(res.data.user.id).then(function() {
              authScreen.classList.remove('open');
              if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
                window.KSLT_APP.onAuthChange();
              }
            });
          } else {
            // No session — email confirmation required
            var I18N = window.KSLT_I18N;
            errEl.textContent = I18N ? I18N.t('auth.verifyEmail') : 'Проверьте почту для подтверждения email';
            errEl.className = 'auth-error show';
            errEl.style.background = 'rgba(52,199,89,0.1)';
            errEl.style.borderColor = 'rgba(52,199,89,0.3)';
            errEl.style.color = '#34c759';
          }
        }
      });
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
          // For mobile: show a simple prompt for email (simplified flow)
          var email = prompt('Enter your email to complete registration:');
          if (!email) return;

          AUTH.telegramAuth('register', tgData, { email: email, gender: '', birth_day: null, birth_month: null, birth_year: null }).then(function(regData) {
            if (regData.error === 'email_taken') {
              var errEl = document.getElementById('loginError');
              if (errEl) { errEl.textContent = 'Email already registered. Sign in and link Telegram.'; errEl.className = 'auth-error show'; }
              return;
            }
            if (regData.status === 'ok' && regData.hashed_token) {
              AUTH.verifyTelegramOtp(regData.email, regData.hashed_token).then(function(otpRes) {
                if (otpRes.error) return;
                AUTH.currentUser = otpRes.data.user;
                AUTH.loadProfile(otpRes.data.user.id).then(function() {
                  authScreen.classList.remove('open');
                  if (window.KSLT_APP && window.KSLT_APP.onAuthChange) window.KSLT_APP.onAuthChange();
                });
              });
            }
          });
          return;
        }

        if (data.status === 'ok' && data.hashed_token) {
          AUTH.verifyTelegramOtp(data.email, data.hashed_token).then(function(otpRes) {
            if (otpRes.error) return;
            AUTH.currentUser = otpRes.data.user;
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

})();
