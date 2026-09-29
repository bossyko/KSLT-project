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
        A.renderTelegramStrip();
        A.renderMobileTabs();
        A.renderDashboard();
        A.renderNewsSection();
        /* ТУРНИРЫ ЗДЕСЬ НЕ РИСУЮТСЯ. Отрисовка у раздела одна, и живёт она
           в switchTab (layout.js): initTabs ниже сам рисует тот раздел, что
           в адресе. Было две — эта и та, — и вторая стирала форму, которую
           человек успел открыть: замер 29.09 поймал `element was detached
           from the DOM` на #adTrnFormat и «полей 0, после своего нажатия 35».
           ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: беда родилась ровно на шве.
           У остальных разделов шов тот же — записан в трекер. */
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
