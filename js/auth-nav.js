// ============================================
// KSLT — Auth Nav (Войти ↔ User Dropdown)
// Lightweight — no Supabase SDK needed
// ============================================

(function() {
    'use strict';

    var btn = document.querySelector('.btn-auth');
    if (!btn) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var inPages = window.location.pathname.indexOf('/pages/') !== -1;
    var prefix = inPages ? '' : 'pages/';
    var dashUrl = prefix + (isEn ? 'dashboard-en.html' : (isKg ? 'dashboard-kg.html' : 'dashboard.html'));
    var adminUrl = prefix + (isEn ? 'admin-en.html' : 'admin.html');

    var L = isEn ? {
        profile: 'My Profile',
        loyalty: 'Points',
        settings: 'Settings',
        admin: 'Admin',
        logout: 'Sign Out'
    } : isKg ? {
        profile: 'Менин профилим',
        loyalty: 'Баллдар',
        settings: 'Жөндөөлөр',
        admin: 'Админка',
        logout: 'Чыгуу'
    } : {
        profile: 'Мой профиль',
        loyalty: 'Баллы',
        settings: 'Настройки',
        admin: 'Админка',
        logout: 'Выйти'
    };

    // Admin dropdown sections
    var ADMIN_SECTIONS = isEn ? [
        { key: 'dashboard', icon: '📊', label: 'Dashboard' },
        { key: 'content', icon: '📰', label: 'News' },
        { key: 'tournaments', icon: '🏆', label: 'Tournaments' },
        { key: 'challenges', icon: '⚔️', label: 'Battles' },
        { key: 'players', icon: '🎾', label: 'Players' },
        { key: 'courts', icon: '🏟️', label: 'Courts' },
        { key: 'coaches', icon: '🎓', label: 'Coaches' },
        { key: 'ratings', icon: '⭐', label: 'Ratings' },
        { key: 'users', icon: '👥', label: 'Users', adminOnly: true },
        { key: 'memberships', icon: '💳', label: 'Memberships' },
        { key: 'payments', icon: '💰', label: 'Payments' },
        { key: 'loyalty', icon: '⭐', label: 'Loyalty' }
    ] : [
        { key: 'dashboard', icon: '📊', label: 'Дашборд' },
        { key: 'content', icon: '📰', label: 'Новости' },
        { key: 'tournaments', icon: '🏆', label: 'Турниры' },
        { key: 'challenges', icon: '⚔️', label: 'Вызовы' },
        { key: 'players', icon: '🎾', label: 'Игроки' },
        { key: 'courts', icon: '🏟️', label: 'Корты' },
        { key: 'coaches', icon: '🎓', label: 'Тренеры' },
        { key: 'ratings', icon: '⭐', label: 'Рейтинг' },
        { key: 'users', icon: '👥', label: 'Пользователи', adminOnly: true },
        { key: 'memberships', icon: '💳', label: 'Членство' },
        { key: 'payments', icon: '💰', label: 'Оплаты' },
        { key: 'loyalty', icon: '⭐', label: 'Лояльность' }
    ];

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
                var userName = localStorage.getItem('kslt_name') || (isEn ? 'User' : (isKg ? 'Колдонуучу' : 'Пользователь'));
                var userAvatar = localStorage.getItem('kslt_avatar') || '';
                var isStaff = role === 'admin' || role === 'manager';

                if (isStaff) {
                    // ---- ADMIN / MANAGER: single "Админка" dropdown ----
                    // Hover → dropdown with admin sections + profile/logout
                    // Click → navigates to admin page

                    var menuItems = '';
                    ADMIN_SECTIONS.forEach(function(s) {
                        if (s.adminOnly && role !== 'admin') return;
                        menuItems += '<a href="' + adminUrl + '#' + s.key + '" class="nav-dropdown-item">' +
                            '<span style="font-size:14px;">' + s.icon + '</span> ' +
                            s.label + '</a>';
                    });

                    // Add divider + logout
                    menuItems += '<div style="height:1px;background:var(--border-subtle);margin:6px 0;"></div>';
                    menuItems += '<button class="nav-dropdown-item admin-nav-logout" style="width:100%;border:none;background:none;cursor:pointer;color:#ff6b6b;font:inherit;text-align:left;">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> ' +
                        L.logout + '</button>';

                    var adminDd = document.createElement('div');
                    adminDd.className = 'admin-nav-dropdown';
                    adminDd.innerHTML =
                        '<a href="' + adminUrl + '" class="btn-auth admin-nav-toggle">' +
                            L.admin +
                            '<svg class="nav-arrow" width="10" height="6" viewBox="0 0 10 6" fill="currentColor" style="margin-left:4px;"><path d="M1 1l4 4 4-4"/></svg>' +
                        '</a>' +
                        '<div class="nav-dropdown-menu admin-nav-menu">' +
                            menuItems +
                        '</div>';

                    btn.parentNode.replaceChild(adminDd, btn);

                    // Logout handler
                    adminDd.querySelector('.admin-nav-logout').addEventListener('click', function() {
                        localStorage.removeItem(key);
                        localStorage.removeItem('kslt_role');
                        localStorage.removeItem('kslt_name');
                        localStorage.removeItem('kslt_avatar');
                        window.location.href = prefix + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html'));
                    });

                } else {
                    // ---- REGULAR USER: user dropdown (click) ----

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
                            '<a href="' + dashUrl + '" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + L.profile + '</a>' +
                            '<a href="' + dashUrl + '#loyalty" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + L.loyalty + '</a>' +
                            '<a href="' + dashUrl + '#settings" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' + L.settings + '</a>' +
                            '<div class="user-dropdown-divider"></div>' +
                            '<button class="user-dropdown-item user-dropdown-logout" id="navLogoutBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' + L.logout + '</button>' +
                        '</div>';

                    btn.parentNode.replaceChild(dropdown, btn);

                    dropdown.querySelector('.user-dropdown-toggle').addEventListener('click', function(e) {
                        e.stopPropagation();
                        dropdown.classList.toggle('open');
                    });

                    document.addEventListener('click', function(e) {
                        if (!dropdown.contains(e.target)) {
                            dropdown.classList.remove('open');
                        }
                    });

                    dropdown.querySelector('#navLogoutBtn').addEventListener('click', function() {
                        localStorage.removeItem(key);
                        localStorage.removeItem('kslt_role');
                        localStorage.removeItem('kslt_name');
                        localStorage.removeItem('kslt_avatar');
                        window.location.href = prefix + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html'));
                    });
                }
            }
        }
    } catch (e) {
        // Ignore — stay as "Войти"
    }
})();
