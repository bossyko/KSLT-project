/**
 * Session Monitor — auto-logout after 30 min of inactivity
 * Include on protected pages after supabase-config.js and auth-guard.js
 */
(function() {
    var TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
    var CHECK_INTERVAL_MS = 60 * 1000; // check every 1 minute
    var lastActivity = Date.now();

    function updateActivity() {
        lastActivity = Date.now();
    }

    ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(function(evt) {
        document.addEventListener(evt, updateActivity, { passive: true });
    });

    function doLogout() {
        var isEn = window.location.pathname.indexOf('-en') !== -1;
        var authPage = isEn ? 'auth-en.html' : 'auth.html';
        var inPages = window.location.pathname.indexOf('/pages/') !== -1;
        var href = inPages ? authPage : 'pages/' + authPage;

        if (typeof supabaseClient !== 'undefined') {
            supabaseClient.auth.signOut().finally(function() {
                window.location.href = href;
            });
        } else {
            localStorage.removeItem('sb-qqkzszesviukopgjbead-auth-token');
            window.location.href = href;
        }
    }

    setInterval(function() {
        if (Date.now() - lastActivity < TIMEOUT_MS) return;
        doLogout();
    }, CHECK_INTERVAL_MS);
})();
