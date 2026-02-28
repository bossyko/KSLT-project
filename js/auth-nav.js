// ============================================
// KSLT — Auth Nav (Войти ↔ User Dropdown)
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

    var L = isEn ? {
        profile: 'My Profile',
        tournaments: 'My Tournaments',
        stats: 'Statistics',
        invitations: 'Invitations',
        settings: 'Settings',
        admin: 'Admin',
        logout: 'Sign Out'
    } : {
        profile: 'Мой профиль',
        tournaments: 'Мои турниры',
        stats: 'Статистика',
        invitations: 'Приглашения',
        settings: 'Настройки',
        admin: 'Админка',
        logout: 'Выйти'
    };

    // Check Supabase session in localStorage
    try {
        var key = 'sb-qqkzszesviukopgjbead-auth-token';
        var raw = localStorage.getItem(key);
        if (!raw) return;

        var session = JSON.parse(raw);
        if (session && session.access_token && session.expires_at) {
            var now = Math.floor(Date.now() / 1000);
            if (session.expires_at > now) {
                var role = localStorage.getItem('kslt_role');
                var userName = localStorage.getItem('kslt_name') || (isEn ? 'User' : 'Пользователь');
                var userAvatar = localStorage.getItem('kslt_avatar') || '';
                var isAdmin = role === 'admin' || role === 'manager';

                // Show admin link separately (keep existing behavior)
                if (isAdmin) {
                    var adminUrl = prefix + (isEn ? 'admin-en.html' : 'admin.html');
                    var adminLink = document.createElement('a');
                    adminLink.href = adminUrl;
                    adminLink.className = 'btn-auth';
                    adminLink.textContent = L.admin;
                    adminLink.style.borderColor = 'rgba(204, 255, 0, 0.3)';
                    adminLink.style.color = '#CCFF00';
                    btn.parentNode.insertBefore(adminLink, btn);
                }

                // Replace btn-auth with user dropdown
                var dropdown = document.createElement('div');
                dropdown.className = 'user-dropdown';

                var initials = userName.split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';
                var avatarHtml = userAvatar
                    ? '<img src="' + userAvatar + '" class="user-dropdown-avatar" alt="">'
                    : '<div class="user-dropdown-avatar-ph">' + initials + '</div>';

                dropdown.innerHTML =
                    '<button class="user-dropdown-toggle">' +
                        avatarHtml +
                        '<span class="user-dropdown-name">' + userName + '</span>' +
                        '<svg class="user-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1l4 4 4-4"/></svg>' +
                    '</button>' +
                    '<div class="user-dropdown-menu">' +
                        '<div class="user-dropdown-header">' + userName + '</div>' +
                        '<a href="' + dashUrl + '#profile" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + L.profile + '</a>' +
                        '<a href="' + dashUrl + '#tournaments" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>' + L.tournaments + '</a>' +
                        '<a href="' + dashUrl + '#stats" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>' + L.stats + '</a>' +
                        '<a href="' + dashUrl + '#invitations" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>' + L.invitations + '</a>' +
                        '<a href="' + dashUrl + '#settings" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' + L.settings + '</a>' +
                        '<div class="user-dropdown-divider"></div>' +
                        '<button class="user-dropdown-item user-dropdown-logout" id="navLogoutBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' + L.logout + '</button>' +
                    '</div>';

                btn.parentNode.replaceChild(dropdown, btn);

                // Toggle dropdown
                var toggle = dropdown.querySelector('.user-dropdown-toggle');
                var menu = dropdown.querySelector('.user-dropdown-menu');

                toggle.addEventListener('click', function(e) {
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                });

                document.addEventListener('click', function(e) {
                    if (!dropdown.contains(e.target)) {
                        dropdown.classList.remove('open');
                    }
                });

                // Logout
                dropdown.querySelector('#navLogoutBtn').addEventListener('click', function() {
                    localStorage.removeItem(key);
                    localStorage.removeItem('kslt_role');
                    localStorage.removeItem('kslt_name');
                    localStorage.removeItem('kslt_avatar');
                    window.location.href = prefix + (isEn ? 'auth-en.html' : 'auth.html');
                });
            }
        }
    } catch (e) {
        // Ignore — stay as "Войти"
    }
})();
