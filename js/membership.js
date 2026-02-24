// ============================================
// KSLT — Membership Logic
// ============================================

(function() {
    'use strict';

    // ---- Plan Config ----
    window.KSLT_MEMBERSHIP_PLAN = {
        id: 'monthly-2026',
        name: 'Ежемесячное членство KSLT',
        name_en: 'KSLT Monthly Membership',
        price: 1000,
        currency: 'KGS',
        duration_months: 1,
        features: [
            'Участие во всех турнирах KSLT',
            'Полный рейтинг и статистика',
            'Скидки на аренду кортов',
            'Доступ к закрытым мероприятиям'
        ],
        features_en: [
            'Participate in all KSLT tournaments',
            'Full rankings and statistics',
            'Court rental discounts',
            'Access to exclusive events'
        ]
    };

    // ---- Check Membership ----
    // Returns { active: bool, paid: bool, membership: object|null, daysLeft: number }
    window.checkMembership = async function() {
        var client = window.supabaseClient;
        if (!client || !window.ksltUser) {
            return { active: false, paid: false, membership: null, daysLeft: 0 };
        }

        var today = new Date().toISOString().split('T')[0];

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
        var daysLeft = Math.ceil((expires - now) / (1000 * 60 * 60 * 24));

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

    // ---- Get Membership History ----
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
