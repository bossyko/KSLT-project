// ============================================
// KSLT — Membership Logic
// ============================================

(function() {
    'use strict';

    /**
     * @typedef {Object} CheckMembershipResult
     * @property {boolean} active
     * @property {boolean} paid
     * @property {Object|null} membership
     * @property {number} daysLeft
     */

    // ТРЕТЬЯ КОПИЯ ЦЕНЫ СНЯТА 09.10.
    //
    // Здесь лежал window.KSLT_MEMBERSHIP_PLAN с price: 1000 и списком выгод.
    // Поиск по проекту показал: единственное упоминание — само объявление,
    // читателей ноль. МЁРТВЫМ КОД НАЗЫВАЕТСЯ ПОСЛЕ ПРОВЕРКИ, и проверка
    // проведена. Суммы живут в таблице pricing_plans и меняются в админке:
    // Настройки → Цены.

    /**
     * Checks current user's active membership status.
     * Staff (admin/manager) bypass — always returns active.
     * @returns {Promise<CheckMembershipResult>}
     */
    // ---- Бесплатный период ----
    //
    // До назначенной даты платформа открыта всем, кто вошёл: членство не
    // спрашиваем. Дата лежит в базе, в app_settings, и меняется в админке —
    // так она действует и на сайте, и в установленном приложении, без новой
    // сборки. Пусто — обычный порядок, доступ по членству.
    var _бесплатноДо;      // undefined — ещё не спрашивали, null — не задано

    window.бесплатныйДоступДо = async function() {
        if (_бесплатноДо !== undefined) return _бесплатноДо;
        _бесплатноДо = null;
        try {
            var r = await window.supabaseClient
                .from('app_settings').select('value').eq('key', 'free_access_until').maybeSingle();
            if (r.data && r.data.value) _бесплатноДо = String(r.data.value).replace(/"/g, '');
        } catch (e) { /* нет настройки — работаем по членству */ }
        return _бесплатноДо;
    };

    /** Идёт ли сейчас бесплатный период. */
    window.бесплатныйПериод = async function() {
        var до = await window.бесплатныйДоступДо();
        if (!до) return false;
        // ДЕНЬ СЧИТАЕТСЯ ПО БИШКЕКУ — слово Кости 09.10: основное время клуба.
        // Было по Гринвичу: с полуночи до 6 утра в Бишкеке бесплатный период
        // считался ещё вчерашним днём и заканчивался на шесть часов позже.
        var сегодня = (window.KSLT_VREMYA && window.KSLT_VREMYA.сегодня())
            || new Date().toISOString().split('T')[0];
        return сегодня <= до;
    };

    window.checkMembership = async function() {
        var client = window.supabaseClient;
        if (!client) {
            return { active: false, paid: false, membership: null, daysLeft: 0 };
        }

        // window.ksltUser заполняет auth-guard.js, но он подключён не на всех страницах —
        // на страницах турниров его нет. Без этого проверка молча возвращала
        // «членства нет», ни разу не обратившись к базе, и записаться на турнир
        // не мог никто. Берём сессию сами.
        if (!window.ksltUser) {
            try {
                var sessRes = await client.auth.getSession();
                if (sessRes.data && sessRes.data.session) {
                    window.ksltUser = sessRes.data.session.user;
                }
            } catch (e) { /* нет сессии — обработается ниже */ }
        }

        if (!window.ksltUser) {
            return { active: false, paid: false, membership: null, daysLeft: 0 };
        }

        // Staff bypass — admin and manager skip membership check
        var role = window.ksltProfile && window.ksltProfile.role;
        if (!role) {
            // Public pages may not have ksltProfile — check from localStorage or DB
            role = localStorage.getItem('kslt_role');
            if (!role) {
                try {
                    var pr = await client.from('profiles').select('role').eq('id', window.ksltUser.id).single();
                    if (pr.data) role = pr.data.role;
                } catch (e) { /* ignore */ }
            }
        }
        if (role === 'admin' || role === 'manager') {
            return { active: true, paid: true, membership: { staff_bypass: true }, daysLeft: 999 };
        }

        // Бесплатный период: вошёл — значит доступ есть
        if (await window.бесплатныйПериод()) {
            var до = await window.бесплатныйДоступДо();
            var осталось = Math.max(0, Math.ceil(
                (new Date(до).getTime() - Date.now()) / 86400000));
            return { active: true, paid: false, daysLeft: осталось,
                     membership: { free_period: true, until: до } };
        }

        // Тот же день Бишкека: членство, истекающее сегодня, живо до конца
        // КЛУБНОГО дня, а не до полуночи по Гринвичу
        var today = (window.KSLT_VREMYA && window.KSLT_VREMYA.сегодня())
            || new Date().toISOString().split('T')[0];

        var result = await client
            .from('memberships')
            .select('*')
            .eq('profile_id', window.ksltUser.id)
            .eq('status', 'active')
            .gte('expires_at', today)
            .order('expires_at', { ascending: false })
            .limit(1);

        if (result.error || !result.data || result.data.length === 0) {
            return { active: false, paid: false, membership: null, daysLeft: 0 };
        }

        var m = result.data[0];
        var expires = new Date(m.expires_at);
        var now = new Date();
        var daysLeft = Math.ceil((expires.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        // Check if membership has a completed payment
        var paid = false;
        var payRes = await client
            .from('payments')
            .select('id')
            .eq('membership_id', m.id)
            .eq('status', 'completed')
            .limit(1);

        if (payRes.data && payRes.data.length > 0) {
            paid = true;
        }

        return { active: true, paid: paid, membership: m, daysLeft: daysLeft };
    };

    /**
     * Fetches all memberships for the current user, newest first.
     * @returns {Promise<Object[]>}
     */
    window.getMembershipHistory = async function() {
        var client = window.supabaseClient;
        if (!client || !window.ksltUser) return [];

        var result = await client
            .from('memberships')
            .select('*')
            .eq('profile_id', window.ksltUser.id)
            .order('created_at', { ascending: false });

        if (result.error || !result.data) return [];
        return result.data;
    };

})();
