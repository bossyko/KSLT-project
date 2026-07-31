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

    // Auth state tracking
    var authHandled = false;
    var pendingSession = null;

    async function handleAuth(session) {
        if (authHandled) return;
        authHandled = true;

        try {
            if (!session) {
                var returnUrl = window.location.pathname + window.location.search;
                window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
                return;
            }

            window.ksltUser = session.user;

            // Load profile
            try {
                var profileResult = await client.from('profiles').select('*').eq('id', window.ksltUser.id).single();
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

            // Callback — wait for onAuthReady to be defined (by init.js loaded later)
            function tryCallback() {
                if (typeof window.onAuthReady === 'function') {
                    window.onAuthReady(window.ksltUser, window.ksltProfile);
                } else {
                    setTimeout(tryCallback, 50);
                }
            }
            tryCallback();
        } catch (e) {
            console.error('Auth Guard error:', e);
            window.location.href = authPage;
        }
    }

    // Listen for auth state changes (catches OAuth redirects reliably)
    client.auth.onAuthStateChange(function(event, session) {
        if (event === 'SIGNED_IN' || event === 'INITIAL_SESSION' || event === 'TOKEN_REFRESHED') {
            if (session) handleAuth(session);
        } else if (event === 'SIGNED_OUT') {
            if (!authHandled) {
                authHandled = true;
                var returnUrl = window.location.pathname + window.location.search;
                window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
            }
        }
    });

    // Fallback: if no event fires within 3s, check session directly
    setTimeout(function() {
        if (!authHandled) {
            client.auth.getSession().then(function(result) {
                if (result.data && result.data.session) {
                    handleAuth(result.data.session);
                } else if (!authHandled) {
                    authHandled = true;
                    var returnUrl = window.location.pathname + window.location.search;
                    window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
                }
            });
        }
    }, 3000);

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
