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

  // Load profile from DB
  AUTH.loadProfile = function(uid) {
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
        }
        return r.data;
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
  AUTH.register = function(email, password, fullName, phone) {
    return supabaseClient.auth.signUp({
      email: email,
      password: password,
      options: {
        data: {
          full_name: fullName,
          phone: phone || ''
        }
      }
    });
  };

  // Google OAuth
  AUTH.loginGoogle = function() {
    return supabaseClient.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/index.html'
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

  // Setup auth UI handlers
  AUTH.setupAuthUI = function() {
    var authScreen = document.getElementById('authScreen');
    var loginForm = document.getElementById('authLogin');
    var regForm = document.getElementById('authRegister');
    var tabLogin = document.getElementById('authTabLogin');
    var tabRegister = document.getElementById('authTabRegister');
    var skipBtn = document.getElementById('authSkip');
    var googleBtn = document.getElementById('authGoogle');

    function switchTab(tab) {
      tabLogin.classList.toggle('active', tab === 'login');
      tabRegister.classList.toggle('active', tab === 'register');
      loginForm.classList.toggle('active', tab === 'login');
      regForm.classList.toggle('active', tab === 'register');
    }

    tabLogin.addEventListener('click', function() { switchTab('login'); });
    tabRegister.addEventListener('click', function() { switchTab('register'); });

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
      var phone = document.getElementById('regPhone').value.trim();
      var pass = document.getElementById('regPassword').value;
      var errEl = document.getElementById('regError');
      errEl.className = 'auth-error';
      errEl.textContent = '';

      if (pass.length < 6) {
        errEl.textContent = 'Пароль минимум 6 символов';
        errEl.className = 'auth-error show';
        return;
      }

      AUTH.register(email, pass, name, phone).then(function(res) {
        if (res.error) {
          errEl.textContent = res.error.message;
          errEl.className = 'auth-error show';
          return;
        }
        if (res.data.user) {
          AUTH.currentUser = res.data.user;
          AUTH.loadProfile(res.data.user.id).then(function() {
            authScreen.classList.remove('open');
            if (window.KSLT_APP && window.KSLT_APP.onAuthChange) {
              window.KSLT_APP.onAuthChange();
            }
          });
        }
      });
    });

    // Google
    if (googleBtn) {
      googleBtn.addEventListener('click', function() {
        AUTH.loginGoogle();
      });
    }
  };

  // Show auth screen
  AUTH.showAuth = function() {
    document.getElementById('authScreen').classList.add('open');
  };

})();
