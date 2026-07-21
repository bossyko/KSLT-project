/**
 * Session Monitor
 * - Auto-logout after 30 min of inactivity
 * - Max session age: 7 days (forced re-login)
 * - Cross-tab logout synchronization
 * Include on all pages after supabase-config.js
 */
(function() {
    var TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes inactivity
    var CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute
    var MAX_SESSION_MS = 7 * 24 * 60 * 60 * 1000; // 7 days max session
    var SESSION_START_KEY = 'kslt_session_start';
    var AUTH_TOKEN_KEY = 'sb-qqkzszesviukopgjbead-auth-token';
    var lastActivity = Date.now();

    function updateActivity() {
        lastActivity = Date.now();
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function(evt) {
        document.addEventListener(evt, updateActivity, { passive: true });
    });

    // Protected pages require redirect to auth on logout
    function isProtectedPage() {
        var path = window.location.pathname;
        return /\/(dashboard|admin|player|offer)(-en|-kg)?\.html/.test(path);
    }

    function getLangSuffix() {
        var path = window.location.pathname;
        if (path.indexOf('-kg') !== -1) return '-kg';
        if (path.indexOf('-en') !== -1) return '-en';
        return '';
    }

    function doLogout() {
        var suffix = getLangSuffix();
        var authPage = 'auth' + suffix + '.html';
        var inPages = window.location.pathname.indexOf('/pages/') !== -1;
        var href = inPages ? authPage : 'pages/' + authPage;

        function cleanup() {
            localStorage.removeItem(SESSION_START_KEY);
            localStorage.removeItem('kslt_name');
            localStorage.removeItem('kslt_avatar');
            localStorage.removeItem('kslt_role');
        }

        if (isProtectedPage()) {
            // Protected page — redirect to auth
            if (typeof supabaseClient !== 'undefined') {
                supabaseClient.auth.signOut().finally(function() {
                    cleanup();
                    window.location.href = href;
                });
            } else {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                cleanup();
                window.location.href = href;
            }
        } else {
            // Public page — sign out silently and reload
            if (typeof supabaseClient !== 'undefined') {
                supabaseClient.auth.signOut().finally(function() {
                    cleanup();
                    window.location.reload();
                });
            } else {
                localStorage.removeItem(AUTH_TOKEN_KEY);
                cleanup();
                window.location.reload();
            }
        }
    }

    // Check if user has an active session
    function hasSession() {
        return !!localStorage.getItem(AUTH_TOKEN_KEY);
    }

    // --- Cross-tab logout ---
    window.addEventListener('storage', function(e) {
        // Auth token removed in another tab → sync logout
        if (e.key === AUTH_TOKEN_KEY && !e.newValue) {
            localStorage.removeItem(SESSION_START_KEY);
            if (isProtectedPage()) {
                var suffix = getLangSuffix();
                var authPage = 'auth' + suffix + '.html';
                var inPages = window.location.pathname.indexOf('/pages/') !== -1;
                window.location.href = inPages ? authPage : 'pages/' + authPage;
            } else {
                window.location.reload();
            }
        }
    });

    // --- Periodic checks ---
    setInterval(function() {
        if (!hasSession()) return; // No session — nothing to monitor

        // Check max session age (7 days)
        var sessionStart = parseInt(localStorage.getItem(SESSION_START_KEY), 10);
        if (sessionStart && (Date.now() - sessionStart > MAX_SESSION_MS)) {
            doLogout();
            return;
        }

        // Check inactivity (30 min)
        if (Date.now() - lastActivity > TIMEOUT_MS) {
            doLogout();
        }
    }, CHECK_INTERVAL_MS);
})();
