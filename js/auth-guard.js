// ============================================
// KSLT — Auth Guard (Middleware защиты роутов)
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var authPage = isEn ? 'auth-en.html' : isKg ? 'auth-kg.html' : 'auth.html';
    var homePage = isEn ? '../index-en.html' : isKg ? '../index-kg.html' : '../index.html';

    // Use shared client from supabase-config.js
    var client = window.supabaseClient;

    // Current user (global)
    window.ksltUser = null;
    window.ksltProfile = null;

    if (!client) {
        console.error('Auth Guard: Supabase client not found');
        window.location.href = authPage;
        return;
    }

    // Wait for all scripts to load, then check auth
    window.addEventListener('load', async function() {
        try {
            var result = await client.auth.getSession();

            if (!result.data || !result.data.session) {
                var returnUrl = window.location.pathname + window.location.search;
                window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
                return;
            }

            // Вход в хранилище есть, но живой ли он — знает только сервер.
            // Аккаунт могли удалить, ключ сменить, срок мог истечь. Пока мы
            // этого не проверяли, страница пускала дальше, профиль не
            // находился, и вкладка начинала перезагружаться по кругу.
            var живой = await client.auth.getUser();
            if (живой.error || !живой.data || !живой.data.user) {
                await client.auth.signOut().catch(function() {});
                ['kslt_session_start', 'kslt_name', 'kslt_avatar', 'kslt_role']
                    .forEach(function(k) { localStorage.removeItem(k); });
                // Без «вернуться сюда»: иначе страница входа уведёт обратно
                window.location.href = authPage;
                return;
            }

            window.ksltUser = result.data.session.user;

            // Load profile
            try {
                var profileResult = await client.from('profiles').select('*').eq('id', window.ksltUser.id).maybeSingle();

                // Вход живой, а профиля нет. Раньше страница молча пускала
                // дальше, дальше кто-нибудь отправлял человека на вход, вход
                // видел живой вход и возвращал обратно — вкладка
                // перезагружалась без конца. Теперь останавливаемся и
                // говорим прямо, что случилось.
                if (!profileResult.data) {
                    document.body.classList.add('auth-ready');
                    document.body.innerHTML =
                        '<div style="min-height:100vh;display:flex;align-items:center;' +
                        'justify-content:center;padding:24px;text-align:center;font-family:Inter,sans-serif;">' +
                        '<div style="max-width:420px;">' +
                        '<h1 style="font-size:1.2rem;margin-bottom:12px;">' +
                        (isEn ? 'Profile not found' : 'Профиль не найден') + '</h1>' +
                        '<p style="color:#999;line-height:1.6;margin-bottom:20px;">' +
                        (isEn
                            ? 'Your sign-in works, but the profile is missing. Write to us and we will restore it.'
                            : 'Вход работает, но профиля в базе нет. Напишите нам — восстановим.') +
                        '</p>' +
                        '<button id="ksltDeadLogout" style="padding:10px 24px;border-radius:999px;' +
                        'border:1px solid #333;background:#CCFF00;color:#000;font-weight:600;cursor:pointer;">' +
                        (isEn ? 'Sign out' : 'Выйти') + '</button>' +
                        '</div></div>';
                    document.getElementById('ksltDeadLogout').addEventListener('click', async function() {
                        await client.auth.signOut().catch(function() {});
                        ['kslt_session_start', 'kslt_name', 'kslt_avatar', 'kslt_role']
                            .forEach(function(k) { localStorage.removeItem(k); });
                        window.location.href = authPage;
                    });
                    return;
                }

                if (profileResult.data) {
                    window.ksltProfile = profileResult.data;

                    // Ban check
                    if (profileResult.data.banned_until && new Date(profileResult.data.banned_until) > new Date()) {
                        await client.auth.signOut();
                        localStorage.removeItem('kslt_role');
                        window.location.href = authPage + '?banned=1';
                        return;
                    }

                    localStorage.setItem('kslt_role', profileResult.data.role);
                    if (profileResult.data.full_name) localStorage.setItem('kslt_name', profileResult.data.full_name);
                    if (profileResult.data.avatar_url) localStorage.setItem('kslt_avatar', profileResult.data.avatar_url);
                }
            } catch (e) {
                console.error('Profile load error:', e);
            }

            // Show page
            document.body.classList.add('auth-ready');

            // Callback
            if (typeof window.onAuthReady === 'function') {
                window.onAuthReady(window.ksltUser, window.ksltProfile);
            }
        } catch (e) {
            console.error('Auth Guard error:', e);
            window.location.href = authPage;
        }
    });

    // Staff guard (admin + manager can access admin panel)
    window.requireStaff = function() {
        var staffRoles = ['admin', 'manager'];
        if (!window.ksltProfile || staffRoles.indexOf(window.ksltProfile.role) === -1) {
            window.location.href = homePage;
        }
    };

    // Admin-only guard
    window.requireAdmin = function() {
        if (!window.ksltProfile || window.ksltProfile.role !== 'admin') {
            window.location.href = homePage;
        }
    };

    // Logout
    window.ksltLogout = async function() {
        localStorage.removeItem('kslt_role');
        localStorage.removeItem('kslt_name');
        localStorage.removeItem('kslt_avatar');
        if (client) {
            await client.auth.signOut();
        }
        window.location.href = authPage;
    };
})();
