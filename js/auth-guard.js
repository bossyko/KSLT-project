// ============================================
// KSLT — Auth Guard (Middleware защиты роутов)
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var authPage = isEn ? 'auth-en.html' : 'auth.html';
    var homePage = isEn ? '../index-en.html' : '../index.html';

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

    // Check auth with small delay (allows OAuth token capture from URL)
    setTimeout(async function() {
        try {
            var result = await client.auth.getSession();

            if (!result.data || !result.data.session) {
                var returnUrl = window.location.pathname + window.location.search;
                window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
                return;
            }

            window.ksltUser = result.data.session.user;

            // Load profile
            try {
                var profileResult = await client.from('profiles').select('*').eq('id', window.ksltUser.id).single();
                if (profileResult.data) {
                    window.ksltProfile = profileResult.data;
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
    }, 200);

    // Admin guard
    window.requireAdmin = function() {
        if (!window.ksltProfile || window.ksltProfile.role !== 'admin') {
            window.location.href = homePage;
        }
    };

    // Logout
    window.ksltLogout = async function() {
        if (client) {
            await client.auth.signOut();
        }
        window.location.href = authPage;
    };
})();
