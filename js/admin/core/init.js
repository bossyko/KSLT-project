// ============================================
// KSLT Admin — Initialization (load last)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;

    window.onAuthReady = function(user, profile) {
        window.requireStaff();

        A.client = window.supabaseClient;
        A.currentRole = profile.role || 'manager';
        A.currentUserId = user.id;

        A.renderSidebar(profile);
        A.renderMobileTabs();
        A.renderDashboard();
        A.renderNewsSection();
        A.renderTournamentsSection();
        A.renderPlayersSection();
        A.renderCourtsSection();
        A.renderCoachesSection();
        A.renderSponsorsSection();
        A.renderFinancesSection();
        A.renderVouchersSection();
        A.renderLoyaltySection();
        A.renderUsersSection();
        A.renderSettingsSection();
        A.initTabs();
    };

})();
