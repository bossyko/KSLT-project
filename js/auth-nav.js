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

                // Show admin link if role is admin or manager
                var role = localStorage.getItem('kslt_role');
                if (role === 'admin' || role === 'manager') {
                    var adminUrl = prefix + (isEn ? 'admin-en.html' : 'admin.html');
                    var labelAdmin = isEn ? 'Admin' : 'Админка';
                    var adminLink = document.createElement('a');
                    adminLink.href = adminUrl;
                    adminLink.className = 'btn-auth';
                    adminLink.textContent = labelAdmin;
                    adminLink.style.borderColor = 'rgba(204, 255, 0, 0.3)';
                    adminLink.style.color = '#CCFF00';
                    btn.parentNode.insertBefore(adminLink, btn);
                }
            }
        }
    } catch (e) {
        // Ignore — stay as "Войти"
    }
})();
