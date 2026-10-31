// ============================================
// KSLT — Auth Guard (Middleware защиты роутов)
// ============================================

(function() {
    'use strict';

    var isEn = KSLT_YAZYK.en;
    var authPage = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');
    var homePage = KSLT_YAZYK.выбрать('../index-en.html', '../index-kg.html', '../index.html');

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

    /* ══════════════════════════════════════════════════════════════════
       БЕЗ СВЯЗИ — НЕ ЗНАЧИТ БЕЗ ВХОДА (31.10).

       ЧТО БЫЛО. Охрана спрашивала сервер (`getUser`, затем профиль) и
       ЛЮБУЮ ошибку оттуда считала мёртвым входом: `signOut`, чистка
       хранилища, увод на форму. «Сервер ответил, что входа нет» и «до
       сервера не дошли» — два разных события, а ветка была одна.
       Ночной прогон 30.10 показал цену: 118 падений кабинета и админки,
       и ни одно не от вёрстки — под нагрузкой запрос срывался, и
       страница выходила из аккаунта сама. В жизни это метро, лифт,
       слабый вайфай: человек терял вход на ровном месте.

       ЧТО СТАЛО. Выход — только по ОТВЕТУ сервера. Нет ответа —
       повторяем, а потом открываем страницу по локальной сессии и
       честно говорим, что связи нет. Это не дыра: сессия — подписанный
       токен со сроком, срок уже проверен `getSession`, а право на
       данные решает база своими правилами. Открытая страница без связи
       покажет пусто; стёртый вход заставит заходить заново.

       ПОЧЕМУ ПОВТОРЫ, А НЕ СРАЗУ ЩУП. Блип короче полусекунды, и два
       повтора его переживают, не отправляя лишнего запроса никому.
       ══════════════════════════════════════════════════════════════════ */
    var ПОВТОРЫ = [400, 1200];

    function подождать(мс) {
        return new Promise(function (д) { setTimeout(д, мс); });
    }

    /** Спросить сервер, живой ли вход, пережив короткий сбой сети. */
    async function живЛиВход() {
        var ответ = await client.auth.getUser();
        for (var i = 0; i < ПОВТОРЫ.length; i++) {
            if (!ответ.error && ответ.data && ответ.data.user) return ответ;
            await подождать(ПОВТОРЫ[i]);
            ответ = await client.auth.getUser();
        }
        return ответ;
    }

    /**
     * ОТКРЫТЬ СТРАНИЦУ БЕЗ СВЯЗИ. Вход НЕ стирается.
     *
     * Признак `auth-ready` ставится, иначе страница осталась бы скрытой
     * (css/dashboard.css:11, css/admin.css:11) — то есть человек увидел
     * бы пустоту вместо объяснения. Второй класс назван так, чтобы его
     * нельзя было спутать с `offline` у партнёров: там это состояние
     * ЧЕЛОВЕКА, а здесь — состояние СВЯЗИ.
     */
    function безСвязи(почему) {
        document.body.classList.add('auth-ready', 'kslt-bez-svyazi');
        console.warn('Auth Guard: связи с сервером входа нет (' + почему +
                     '). Вход НЕ стёрт, страница открыта по локальной сессии.');
        if (window.KSLT_TOAST) {
            KSLT_TOAST.показать(KSLT_YAZYK.выбрать(
                'No connection to the server. You are still signed in, but the page may be empty or stale.',
                'Серверге байланыш жок. Сиз чыккан жоксуз, бирок бет бош же эскирген болушу мүмкүн.',
                'Нет связи с сервером. Из аккаунта вы не вышли, но страница может быть пустой или устаревшей.'
            ), { тон: 'warn' });
        }
        if (typeof window.onAuthReady === 'function') {
            window.onAuthReady(window.ksltUser, window.ksltProfile);
        }
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
            var живой = await живЛиВход();
            if (живой.error || !живой.data || !живой.data.user) {
                /* РАЗНИЦА, КОТОРОЙ ЗДЕСЬ НЕ БЫЛО. Спрашиваем ОТВЕТИЛ ЛИ
                   сервер вообще: `KSLT_BAZA.входОтозван` даёт `true`
                   только на 401/403, то есть на настоящее «токен больше
                   не ваш». Нет ответа или 5xx — это не ответ, и выходом
                   на него отвечать нельзя. */
                var отозван = await window.KSLT_BAZA.входОтозван(
                    result.data.session.access_token);
                if (!отозван) {
                    window.ksltUser = result.data.session.user;
                    безСвязи('getUser не ответил, а сервер входа не сказал «отозван»');
                    return;
                }
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

                /* «НЕ СПРОСИЛИ» — ЭТО НЕ «В БАЗЕ НЕТ» (31.10). Та же беда,
                   что и у входа, и в том же файле: `maybeSingle()` при
                   сбое сети возвращает `{ data: null, error }`, а ветка
                   ниже смотрела ТОЛЬКО на `data` — и показывала человеку
                   «Профиль не найден», затирая `body.innerHTML` целиком.
                   То есть на одном оборванном запросе страница сообщала о
                   беде, которой нет. Ошибку запроса отделяем: это нет
                   связи, а не нет профиля. */
                if (profileResult.error) {
                    безСвязи('профиль не прочитался: ' + profileResult.error.message);
                    return;
                }

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
                        (KSLT_YAZYK.выбрать('Profile not found', "Профиль табылган жок", 'Профиль не найден')) + '</h1>' +
                        '<p style="color:#999;line-height:1.6;margin-bottom:20px;">' +
                        (KSLT_YAZYK.выбрать('Your sign-in works, but the profile is missing. Write to us and we will restore it.', "Кирүү иштейт, бирок базада профиль жок. Бизге жазыңыз — калыбына келтиребиз.", 'Вход работает, но профиля в базе нет. Напишите нам — восстановим.')) +
                        '</p>' +
                        '<button id="ksltDeadLogout" style="padding:10px 24px;border-radius:999px;' +
                        'border:1px solid #333;background:var(--accent);color:var(--accent-on);font-weight:600;cursor:pointer;">' +
                        (KSLT_YAZYK.выбрать('Sign out', "Чыгуу", 'Выйти')) + '</button>' +
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
            /* ТО ЖЕ ПРАВИЛО НА ПОСЛЕДНЕЙ ВЕТКЕ: брошенная ошибка — чаще
               всего сеть, а не отозванный вход. Есть локальная сессия —
               открываем страницу и говорим про связь; нет — уводим. */
            if (window.KSLT_BAZA && window.KSLT_BAZA.вошёл()) {
                var з = window.KSLT_BAZA.запись();
                window.ksltUser = (з && з.user) || window.ksltUser;
                безСвязи('охрана бросила: ' + (e && e.message));
                return;
            }
            window.location.href = authPage;
        }
    });

    /**
     * РОЛЬ БЕЗ СВЯЗИ БЕРЁТСЯ ИЗ ХРАНИЛИЩА, И ЭТО НАЗВАНО ПРЯМО (31.10).
     *
     * Без связи профиль не прочитан, `ksltProfile` пуст — и прежние
     * сторожа уводили сотрудника на главную. Это третье место той же
     * беды: решение принималось по ОТСУТСТВИЮ ответа.
     *
     * `kslt_role` в хранилище пишет эта же охрана при удачном чтении
     * (`:105` выше), то есть запись своя, а не чужая. ОНА НИЧЕГО НЕ
     * РАЗРЕШАЕТ: право на данные решает база своими правилами, и админка
     * без связи покажет пустые списки. Разница только в том, увидит
     * человек свою пустую админку или главную страницу.
     *
     * Поэтому хранилищу верим ТОЛЬКО пока связи нет. Есть связь —
     * спрашиваем профиль, как и раньше.
     */
    function рольСейчас() {
        if (window.ksltProfile) return window.ksltProfile.role;
        if (document.body.classList.contains('kslt-bez-svyazi')) {
            try { return localStorage.getItem('kslt_role'); } catch (e) { return null; }
        }
        return null;
    }

    // Staff guard (admin + manager can access admin panel)
    window.requireStaff = function() {
        var staffRoles = ['admin', 'manager'];
        if (staffRoles.indexOf(рольСейчас()) === -1) {
            window.location.href = homePage;
        }
    };

    // Admin-only guard
    window.requireAdmin = function() {
        if (рольСейчас() !== 'admin') {
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
