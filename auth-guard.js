// ============================================
// KSLT — Auth Guard (Middleware защиты роутов)
// ============================================
// Подключай на защищённых страницах ПОСЛЕ supabase-config.js:
// <script src="supabase-config.js"></script>
// <script src="auth-guard.js"></script>

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var authPage = isEn ? 'auth-en.html' : 'auth.html';
    var homePage = isEn ? 'index-en.html' : 'index.html';

    // Supabase client
    var client = null;
    if (window.supabase && window.supabase.createClient) {
        client = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    }

    // Current user (доступен глобально)
    window.ksltUser = null;
    window.ksltProfile = null;

    // Check auth and redirect if not logged in
    async function checkAuth() {
        if (!client) {
            window.location.href = authPage;
            return;
        }

        var result = await client.auth.getSession();

        if (!result.data || !result.data.session) {
            // Сохраняем URL куда хотел попасть (для редиректа после входа)
            var returnUrl = window.location.pathname + window.location.search;
            window.location.href = authPage + '?return=' + encodeURIComponent(returnUrl);
            return;
        }

        window.ksltUser = result.data.session.user;

        // Загружаем профиль
        var profileResult = await client.from('profiles').select('*').eq('id', window.ksltUser.id).single();

        if (profileResult.data) {
            window.ksltProfile = profileResult.data;
        }

        // Показываем страницу (была скрыта до проверки)
        document.body.classList.add('auth-ready');

        // Вызываем callback если есть
        if (typeof window.onAuthReady === 'function') {
            window.onAuthReady(window.ksltUser, window.ksltProfile);
        }
    }

    // Admin guard — дополнительная проверка для админ-страниц
    window.requireAdmin = async function() {
        await checkAuth();
        if (!window.ksltProfile || window.ksltProfile.role !== 'admin') {
            window.location.href = homePage;
        }
    };

    // Logout function (доступна глобально)
    window.ksltLogout = async function() {
        if (client) {
            await client.auth.signOut();
        }
        window.location.href = authPage;
    };

    // Run
    checkAuth();
})();
