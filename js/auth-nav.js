// ============================================
// KSLT — Auth Nav (Войти ↔ Кабинет)
// Lightweight — no Supabase SDK needed
// ============================================

(function() {
    'use strict';

    var btn = document.querySelector('.btn-auth');
    if (!btn) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var inPages = window.location.pathname.indexOf('/pages/') !== -1;
    var prefix = inPages ? '' : 'pages/';
    var dashUrl = prefix + (isEn ? 'dashboard-en.html' : 'dashboard.html');
    var labelDash = isEn ? 'Dashboard' : 'Кабинет';

    // Check Supabase session in localStorage
    try {
        var key = 'sb-qqkzszesviukopgjbead-auth-token';
        var raw = localStorage.getItem(key);
        if (!raw) return;

        var session = JSON.parse(raw);
        if (session && session.access_token && session.expires_at) {
            // Check if token is not expired
            var now = Math.floor(Date.now() / 1000);
            if (session.expires_at > now) {
                btn.href = dashUrl;
                btn.textContent = labelDash;
            }
        }
    } catch (e) {
        // Ignore — stay as "Войти"
    }
})();
