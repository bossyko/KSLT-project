// ============================================
// KSLT — Admin Panel
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var client = window.supabaseClient;

    // ---- Labels ----
    var L = isEn ? {
        dashboard: 'Dashboard',
        users: 'Users',
        tournaments: 'Tournaments',
        players: 'Players',
        content: 'News',
        memberships: 'Memberships',
        soon: 'Soon',
        dashboardTitle: 'Dashboard',
        totalUsers: 'Total Users',
        activeMemberships: 'Active Memberships',
        upcomingTournaments: 'Upcoming Tournaments',
        rankedPlayers: 'Ranked Players',
        recentRegistrations: 'Recent Registrations',
        thUser: 'User',
        thEmail: 'Email',
        thRole: 'Role',
        thDate: 'Registered',
        roleAdmin: 'Admin',
        roleManager: 'Manager',
        rolePlayer: 'Player',
        roleUser: 'User',
        comingSoonTitle: 'Coming Soon',
        comingSoonText: 'This section is under development',
        noData: '—',
        iconUsers: '👥',
        iconMemberships: '💳',
        iconTournaments: '🏆',
        iconPlayers: '📊',
        // Dashboard cards
        iconOverdue: '⚠️',
        iconApproaching: '⏰',
        iconNews: '📰',
        statMembersDetail: 'members / users',
        statOverdueDetail: 'expired memberships',
        statApproachingDetail: 'expiring within 10 days',
        statTournamentsDetail: 'past / upcoming',
        statNewsDetail: 'articles published',
        // Dashboard activity tables
        actApproaching: 'Approaching Payment',
        actOverdue: 'Overdue Payments',
        actRecentRegistrations: 'Recent Registrations',
        actRecentTournaments: 'Recent Tournaments',
        actRecentNews: 'Recent News',
        viewAll: 'View all',
        thName: 'Name',
        thExpires: 'Expires',
        thDaysLeft: 'Days Left',
        thOverdueDays: 'Overdue',
        thTournament: 'Tournament',
        thDateStart: 'Date',
        thArticle: 'Article',
        thStatus: 'Status',
        iconPending: '📋',
        iconCourts: '🏟️',
        iconCoaches: '🎓',
        iconManagers: '👔',
        statPendingDetail: 'pending registrations',
        statCourtsDetail: 'courts total',
        statCoachesDetail: 'coaches total',
        statManagersDetail: 'managers',
        actPendingRegs: 'Pending Registrations',
        thPlayer: 'Player',
        thCategory: 'Category',
        noPendingRegs: 'No pending registrations',
        noApproaching: 'No expiring memberships',
        noOverdue: 'No overdue payments',
        noRecentUsers: 'No recent registrations',
        noRecentTournaments: 'No recent tournaments',
        noRecentNews: 'No recent news',
        // News
        addNews: 'Add Article',
        editNews: 'Edit Article',
        newsList: 'All Articles',
        newsTitle: 'Title',
        newsSlug: 'Slug',
        newsExcerpt: 'Excerpt',
        newsContent: 'Content',
        newsImage: 'Cover Image',
        newsCategory: 'Category',
        newsAuthor: 'Author',
        newsPublishedAt: 'Publish Date',
        newsDraft: 'Draft',
        newsPublished: 'Published',
        newsSearch: 'Search by title...',
        newsAll: 'All',
        save: 'Save',
        saving: 'Saving...',
        saved: 'Saved!',
        delete: 'Delete',
        deleteSelected: 'Delete Selected',
        deleteSelectedConfirm: 'Delete selected items?',
        deleteConfirm: 'Delete this article?',
        deleteConfirmText: 'This action cannot be undone.',
        cancel: 'Cancel',
        back: 'Back to List',
        uploadImage: 'Click to upload or drag image',
        uploadHint: 'JPG or PNG, max 2MB',
        orPasteUrl: 'Or paste image URL',
        applyUrl: 'Apply',
        publish: 'Publish',
        update: 'Update',
        newsGallery: 'Gallery',
        contentPreview: 'Preview',
        insertPhoto: '+ Photo',
        pollSection: 'Poll',
        pollQuestion: 'Question',
        pollOption: 'Option',
        pollAdd: '+ Add option',
        pollEnable: 'Add poll',
        pollRemove: 'Remove poll',
        thReactions: 'Reactions',
        thVotes: 'Votes',
        engagement: 'Engagement',
        totalVotes: 'Total votes',
        newsStatPublished: 'Published',
        newsStatDrafts: 'Drafts',
        newsStatPopular: 'Most Popular',
        newsStatLastDate: 'Last',
        newsStatNoArticles: 'No articles yet',
        catResults: 'Report',
        catInterview: 'Interview',
        catAnnouncement: 'Announcement',
        catWorld: 'World Tennis',
        selectCategory: '— Select —',
        slugHint: 'Auto-generated from title. Used in URL.',
        translateBtn: 'Translate from RU',
        translating: 'Translating...',
        translateError: 'Translation error',
        fillRuFirst: 'Fill in RU field first',
        fillAnyLang: 'Fill in any language',
        textCopied: 'Text copied',
        metaReadTime: 'min read',
        translateFromAny: 'Translate',
        noArticles: 'No articles yet',
        noArticlesText: 'Click "Add Article" to create your first article',
        thTitle: 'Title',
        thCategory: 'Category',
        thStatus: 'Status',
        thPublished: 'Date',
        thPubDate: 'Pub. Date',
        thViews: 'Views',
        thExecutor: 'Executor',
        newsExecutor: 'Executor',
        draftSaved: 'Draft saved',
        unsavedChanges: 'Unsaved changes',
        unsavedChangesText: 'You have unsaved changes. Leave without saving?',
        unsavedLeaveBtn: 'Leave',
        // Tournaments
        addTournament: 'Add Tournament',
        editTournament: 'Edit Tournament',
        trnTitle: 'Title',
        trnDescription: 'Description',
        trnLocation: 'Location',
        trnCategory: 'Category',
        trnStatus: 'Status',
        trnDateStart: 'Start Date',
        trnDateEnd: 'End Date',
        trnDateEndShort: 'End Date',
        trnMaxParticipants: 'Max Participants',
        trnMaxParticipantsShort: 'Max Part.',
        trnPrizeFund: 'Prize Fund',
        trnImage: 'Cover Image',
        noTournaments: 'No tournaments yet',
        noTournamentsText: 'Click "Add Tournament" to create your first tournament',
        trnDeleteConfirm: 'Delete this tournament?',
        statusUpcoming: 'Upcoming',
        statusRegOpen: 'Registration Open',
        statusRegClosed: 'Registration Closed',
        statusOngoing: 'Ongoing',
        statusCompleted: 'Completed',
        statusCancelled: 'Cancelled',
        selectStatus: '— Select —',
        selectCategoryTrn: '— Select —',
        trnFormat: 'Format',
        formatSingles: 'Singles',
        formatDoubles: 'Doubles',
        formatMixedDoubles: 'Mixed Doubles',
        selectFormat: '— Select —',
        genderMen: 'Men',
        genderWomen: 'Women',
        trnDrawSize: 'Draw Size',
        trnBracketType: 'Bracket Type',
        trnCourtCount: 'Courts',
        trnMatchDuration: 'Match Duration (min)',
        trnRegDeadline: 'Registration Deadline',
        bracketSE: 'Single Elimination',
        bracketRR: 'Round Robin',
        selectDrawSize: '— Select —',
        selectBracketType: '— Select —',
        trnStatTotal: 'Total Tournaments',
        trnStatUpcoming: 'Upcoming',
        trnStatCompleted: 'Completed',
        trnStatMenSingles: "Men's Singles",
        trnStatWomenSingles: "Women's Singles",
        trnStatMenDoubles: "Men's Doubles",
        trnStatWomenDoubles: "Women's Doubles",
        trnStatFriendly: 'Friendly',
        trnSearch: 'Search by title...',
        trnAllCategories: 'All Categories',
        trnAllStatuses: 'All Statuses',
        // Bracket management
        bracketTab: 'Bracket',
        registrationsTab: 'Registrations',
        resultsTab: 'Results',
        resPlace: 'Place',
        resPlayer: 'Player',
        resRound: 'Round Reached',
        resPoints: 'Points',
        resTotalPlayers: 'Total players',
        generateDraw: 'Generate Draw',
        generateDrawConfirm: 'Generate draw? This will create the bracket and close registration.',
        drawGenerated: 'Draw generated successfully',
        noRegistrations: 'No registrations yet',
        regStatus: 'Status',
        regApprove: 'Approve',
        regReject: 'Reject',
        regApproved: 'Approved',
        regRejected: 'Rejected',
        regPending: 'Pending',
        regWithdrawn: 'Withdrawn',
        regCount: 'registered',
        enterScore: 'Enter Score',
        saveScore: 'Save Score',
        addSet: '+ Add Set',
        removeSet: '- Remove Set',
        matchScore: 'Score',
        matchWinner: 'Winner',
        matchCompleted: 'completed',
        matchUpcoming: 'upcoming',
        matchLive: 'live',
        finalizeTournament: 'Finalize Tournament',
        finalizeConfirm: 'Finalize tournament? This will calculate points for all players.',
        tournamentFinalized: 'Tournament finalized. Points calculated.',
        seedLabel: 'Seed',
        byeLabel: 'BYE',
        vsLabel: 'vs',
        roundR1: 'Round 1',
        roundQF: 'Quarterfinals',
        roundSF: 'Semifinals',
        roundF: 'Final',
        round3rd: '3rd Place',
        roundR16: 'Round of 16',
        // Players
        addPlayer: 'Add Player',
        editPlayer: 'Edit Player',
        plrName: 'Name',
        plrCountry: 'Country',
        plrCategory: 'Category',
        plrPoints: 'Points',
        plrWins: 'Wins',
        plrLosses: 'Losses',
        plrRankChange: 'Rank Change',
        plrForm: 'Recent Form',
        plrBadges: 'Badges',
        plrBio: 'Biography',
        plrPhone: 'Phone',
        plrEmail: 'Email',
        plrPhoto: 'Photo',
        plrShowPhone: 'Show phone publicly',
        noPlayers: 'No players yet',
        noPlayersText: 'Click "Add Player" to add your first player',
        plrDeleteConfirm: 'Delete this player?',
        plrSearch: 'Search by name...',
        plrAllCategories: 'All Categories',
        badgeChampion: 'Champion',
        badgeTop1: 'Top 1',
        badgeStreak: 'Win Streak',
        badgeNewbie: 'Newcomer',
        badgeBreakthrough: 'Breakthrough',
        thPoints: 'Points',
        thWL: 'W/L',
        thChange: 'Change',
        // Courts
        courts: 'Courts',
        addCourt: 'Add Court',
        editCourt: 'Edit Court',
        crtName: 'Name',
        crtType: 'Type',
        crtSurface: 'Surface',
        crtCourtsCount: 'Qty',
        crtPrice: 'Price<br><span style="font-size:0.65rem;font-weight:400;color:var(--text-dim);">(som/hr)</span>',
        crtMobile: 'Mobile',
        crtLandline: 'Landline',
        crtAddPhone: '+ Add phone',
        crtEmail: 'Email',
        crtDescription: 'Description',
        crtAmenities: 'Amenities',
        crtPartner: 'Partner',
        crtPromoted: 'Promoted',
        crtPhoto: 'Main Photo',
        crtGallery: 'Gallery',
        crtGoogleMaps: 'Google Maps',
        crtTwoGis: '2GIS',
        crtStreet: 'Street',
        crtBuilding: 'Number',
        crtDistrict: 'District / Landmark',
        crtCity: 'City',
        crtPostalCode: 'Postal Code',
        crtSlogan: 'Additional Info',
        crtAdd: '+ Add',
        noCourts: 'No courts yet',
        noCourtsText: 'Click "Add Court" to add your first court',
        crtDeleteConfirm: 'Delete this court?',
        crtSearch: 'Search by name...',
        crtAllTypes: 'All Types',
        crtStatOutdoor: 'Outdoor',
        crtStatIndoor: 'Indoor',
        crtStatTotal: 'Total',
        crtAllSurfaces: 'All Surfaces',
        crtOther: 'Other',
        crtCustomAmenity: 'Custom amenity',
        crtAddCustom: '+ Add custom',
        crtAddByUrl: '+ By URL',
        translateAllBtn: 'Translate to empty',
        allFieldsFilled: 'All fields are already filled',
        // Coaches
        coaches: 'Coaches',
        addCoach: 'Add Coach',
        editCoach: 'Edit Coach',
        cchLastName: 'Last Name',
        cchFirstName: 'First Name',
        cchPatronymic: 'Patronymic',
        cchPosition: 'Position',
        cchTags: 'Tags',
        cchExperience: 'Experience (years)',
        cchPrice: 'Price (som/hr)',
        cchShortDesc: 'Short Description',
        cchBio: 'Biography',
        cchAchievements: 'Achievements',
        cchAchievementAdd: '+ Add achievement',
        cchCourt: 'Court / Club',
        cchPhone: 'Phone (internal)',
        cchTelegram: 'Telegram',
        cchWhatsapp: 'WhatsApp',
        cchPhoto: 'Photo',
        noCoaches: 'No coaches yet',
        noCoachesText: 'Click "Add Coach" to add your first coach',
        cchDeleteConfirm: 'Delete this coach?',
        cchSearch: 'Search by name...',
        cchAllTags: 'All Tags',
        cchPromoted: 'Promoted',
        cchStatTotal: 'Total Coaches',
        cchStatPromoted: 'Promoted',
        cchStatNew: 'New This Month',
        cchViewTitle: 'Coach Overview',
        cchViewInfo: 'Information',
        cchViewPayments: 'Payments & Services',
        cchViewNoPayments: 'No payments for this coach',
        cchViewEdit: 'Edit',
        cchPromotedBadge: 'Promoted',
        cchPromotedHint: 'Managed via Payments section',
        // Ratings
        ratings: 'Ratings',
        ratSubRankings: 'Rankings',
        ratSubResults: 'Results',
        ratSubRules: 'Points Rules',
        ratSubPromotions: 'Promotions',
        ratSelectCategory: 'Select category',
        ratAllCategories: 'All Categories',
        ratRank: '#',
        ratPlayer: 'Player',
        ratPoints: 'Points',
        ratWL: 'W/L',
        ratForm: 'Form',
        ratNoPlayers: 'No players in this category',
        ratSelectTournament: 'Select tournament',
        ratCompletedOnly: 'Completed tournaments only',
        ratRound: 'Round',
        ratPointsEarned: 'Points',
        ratAddResult: '+ Add Result',
        ratSaveResults: 'Save Results',
        ratNoResults: 'No results entered yet',
        ratLevel: 'Tournament Level',
        ratW: 'Winner',
        ratF: 'Finalist',
        rat3RD: '3rd Place',
        rat4TH: '4th Place',
        ratSF: 'Semifinal',
        ratQF: 'Quarterfinal',
        ratR16: 'Round of 16',
        ratR32: 'Round of 32',
        ratSaveRules: 'Save Rules',
        ratRulesSaved: 'Points rules saved',
        ratResultsSaved: 'Results saved, points recalculated',
        ratEligible: 'Eligible',
        ratTransition: 'In Transition',
        ratCompleted: 'Completed',
        ratFromCat: 'From',
        ratToCat: 'To',
        ratSeason: 'Season',
        ratStatus: 'Status',
        ratNoPromotions: 'No promotions',
        ratTop5Info: 'Top 5 players in each category are eligible for promotion',
        ratSelectPlayer: 'Select player',
        ratTournamentLevel: 'Tournament Level',
        ratNoLevels: 'Run SQL migration first to create tournament levels',
        // Memberships
        memList: 'All Memberships',
        memAdd: 'Add Membership',
        memEdit: 'Edit Membership',
        memUser: 'User',
        memStatus: 'Status',
        memStartsAt: 'Start Date',
        memExpiresAt: 'End Date',
        memDaysLeft: 'Days Left',
        memNote: 'Note',
        memActive: 'Active',
        memExpired: 'Expired',
        memCancelled: 'Cancelled',
        memExtend: 'Extend +1 month',
        memCancel: 'Cancel',
        memExtendConfirm: 'Extend membership by 1 month?',
        memCancelConfirm: 'Cancel this membership?',
        memDeleteConfirm: 'Delete this membership?',
        memNoMembers: 'No memberships yet',
        memNoMembersText: 'Click "Add Membership" to create one',
        memSearch: 'Search by name or email...',
        memAllStatuses: 'All Statuses',
        memSelectUser: '— Select User —',
        memRecordPayment: 'Record payment',
        memPaymentAmount: 'Amount (KGS)',
        memPaymentMethod: 'Method',
        memPaymentCash: 'Cash',
        memPaymentTransfer: 'Bank Transfer',
        memPaymentCard: 'Card',
        memPayments: 'Payment History',
        memPayDate: 'Date',
        memPayAmount: 'Amount',
        memPayMethod: 'Method',
        memPayStatus: 'Status',
        memPayNote: 'Note',
        memNoPayments: 'No payments',
        memExpiringSoon: 'Expiring Soon',
        memPayment: 'Payment',
        memPaid: 'Paid',
        memUnpaid: 'Unpaid',
        memTgConnected: 'TG',
        memProfile: 'Member Profile',
        memPhone: 'Phone',
        memRole: 'Role',
        memRegistered: 'Registered',
        memMembership: 'Membership',
        memDaysLeft: 'Days Left',
        memPaymentHistory: 'Payment History',
        memAmount: 'Amount',
        memDate: 'Date',
        memClose: 'Close',
        // Users
        usrList: 'All Users',
        usrSearch: 'Search by name or email...',
        usrAllRoles: 'All Roles',
        usrEdit: 'Edit User',
        usrProfile: 'Profile',
        usrFullName: 'Full Name',
        usrEmail: 'Email',
        usrPhone: 'Phone',
        usrRole: 'Role',
        usrTelegram: 'Telegram',
        usrTgConnected: 'Connected',
        usrTgNotConnected: 'Not connected',
        usrLastSeen: 'Last Seen',
        usrRegistered: 'Registered',
        usrMembership: 'Membership',
        usrNoMembership: 'No membership',
        usrGiveMembership: 'Give Membership',
        usrExtendMembership: 'Extend',
        usrCancelMembership: 'Cancel Membership',
        usrMembershipPeriod: 'Period',
        usrMonths1: '1 month',
        usrMonths3: '3 months',
        usrMonths6: '6 months',
        usrMonths12: '12 months',
        usrActions: 'Actions',
        usrMakeManager: 'Make Manager',
        usrRemoveManager: 'Remove Manager',
        usrDeleteUser: 'Delete User',
        usrDeleteConfirm: 'Delete this user? This cannot be undone.',
        usrDeleteConfirmTitle: 'Delete User',
        usrCannotDeleteSelf: 'Cannot change your own role',
        usrRoleChanged: 'Role changed',
        usrMembershipGiven: 'Membership activated',
        usrMembershipExtended: 'Membership extended',
        usrMembershipCancelled: 'Membership cancelled',
        usrUserDeleted: 'User deleted',
        usrUserSaved: 'User saved',
        usrNoUsers: 'No users yet',
        usrNoUsersText: 'Users will appear after registration',
        usrAddManager: 'Add Manager',
        usrAddManagerTitle: 'Add Manager',
        usrAddManagerEmail: 'Email',
        usrAddManagerFirstName: 'First Name',
        usrAddManagerLastName: 'Last Name',
        usrAddManagerHint: 'If user exists — role will be updated. If not — invitation will be sent.',
        usrManagerAdded: 'Manager added',
        usrManagerInvited: 'Invitation sent',
        usrThMembership: 'Membership',
        usrOnline: 'Online',
        usrOffline: 'Offline',
        usrActive: 'Active',
        usrExpired: 'Expired',
        usrNone: 'None',
        // Payments
        payments: 'Payments',
        addPayment: 'Add Payment',
        editPayment: 'Edit Payment',
        payEntityType: 'Entity Type',
        payEntity: 'Payer',
        paySearchEntity: 'Search by name...',
        payAmount: 'Amount',
        payCurrency: 'Currency',
        payPeriodStart: 'Period Start',
        payPeriodEnd: 'Period End',
        payMethod: 'Payment Method',
        payPurpose: 'Purpose',
        payNote: 'Note',
        payStatus: 'Status',
        payActive: 'Active',
        payExpired: 'Expired',
        payAllStatuses: 'All statuses',
        payAllTypes: 'All types',
        payAllPurposes: 'All purposes',
        paySearch: 'Search payments...',
        payCash: 'Cash',
        payTransfer: 'Transfer',
        payCard: 'Card',
        payPromoted: 'Promoted',
        paySponsorship: 'Sponsorship',
        payRental: 'Rental',
        payOther: 'Other',
        payCourt: 'Court',
        payCoach: 'Coach',
        payPlayer: 'Player',
        payNoPayments: 'No payments yet',
        payNoPaymentsText: 'Add the first payment',
        payStatActive: 'Active',
        payStatExpired: 'Expired',
        payStatMonth: 'This Month',
        payCreatedAt: 'Created',
        payEntityRequired: 'Select an entity',
        payAmountRequired: 'Enter the amount',
        payPeriodRequired: 'Enter the period',
        paySaved: 'Payment saved',
        payDeleted: 'Payment deleted',
        payDeleteConfirm: 'Delete this payment?',
        crtPromotedBadge: 'Promoted',
        crtPromotedHint: 'Managed via Payments section',
        crtViewTitle: 'Court Overview',
        crtViewInfo: 'Information',
        crtViewPayments: 'Payments & Services',
        crtViewNoPayments: 'No payments for this court',
        crtViewEdit: 'Edit',
        crtViewAmount: 'Amount',
        crtViewPurpose: 'Purpose',
        crtViewActiveUntil: 'Active Until',
        crtViewStatus: 'Status',
        crtViewMethod: 'Method'
    } : {
        dashboard: 'Дашборд',
        users: 'Пользователи',
        tournaments: 'Турниры',
        players: 'Игроки',
        content: 'Новости',
        memberships: 'Членство',
        soon: 'Скоро',
        dashboardTitle: 'Дашборд',
        totalUsers: 'Всего пользователей',
        activeMemberships: 'Активных членств',
        upcomingTournaments: 'Ближайших турниров',
        rankedPlayers: 'Игроков в рейтинге',
        recentRegistrations: 'Последние регистрации',
        thUser: 'Пользователь',
        thEmail: 'Email',
        thRole: 'Роль',
        thDate: 'Дата регистрации',
        roleAdmin: 'Администратор',
        roleManager: 'Менеджер',
        rolePlayer: 'Игрок',
        roleUser: 'Пользователь',
        comingSoonTitle: 'В разработке',
        comingSoonText: 'Этот раздел находится в разработке',
        noData: '—',
        iconUsers: '👥',
        iconMemberships: '💳',
        iconTournaments: '🏆',
        iconPlayers: '📊',
        // Dashboard cards
        iconOverdue: '⚠️',
        iconApproaching: '⏰',
        iconNews: '📰',
        statMembersDetail: 'членов / пользователей',
        statOverdueDetail: 'просроченных членств',
        statApproachingDetail: 'истекает в ближ. 10 дней',
        statTournamentsDetail: 'прошло / предстоит',
        statNewsDetail: 'статей опубликовано',
        // Dashboard activity tables
        actApproaching: 'Скоро оплата',
        actOverdue: 'Просроченные оплаты',
        actRecentRegistrations: 'Последние регистрации',
        actRecentTournaments: 'Последние турниры',
        actRecentNews: 'Последние новости',
        viewAll: 'Все',
        thName: 'Имя',
        thExpires: 'Истекает',
        thDaysLeft: 'Осталось',
        thOverdueDays: 'Просрочка',
        thTournament: 'Турнир',
        thDateStart: 'Дата',
        thArticle: 'Статья',
        thStatus: 'Статус',
        iconPending: '📋',
        iconCourts: '🏟️',
        iconCoaches: '🎓',
        iconManagers: '👔',
        statPendingDetail: 'заявок на турниры',
        statCourtsDetail: 'кортов всего',
        statCoachesDetail: 'тренеров всего',
        statManagersDetail: 'менеджеров',
        actPendingRegs: 'Ожидают одобрения',
        thPlayer: 'Игрок',
        thCategory: 'Категория',
        noPendingRegs: 'Нет заявок на одобрение',
        noApproaching: 'Нет истекающих членств',
        noOverdue: 'Нет просроченных оплат',
        noRecentUsers: 'Нет новых регистраций',
        noRecentTournaments: 'Нет последних турниров',
        noRecentNews: 'Нет последних новостей',
        // News
        addNews: 'Добавить статью',
        editNews: 'Редактировать статью',
        newsList: 'Все статьи',
        newsTitle: 'Заголовок',
        newsSlug: 'Slug (URL)',
        newsExcerpt: 'Краткое описание',
        newsContent: 'Содержание',
        newsImage: 'Обложка',
        newsCategory: 'Категория',
        newsAuthor: 'Автор',
        newsPublishedAt: 'Дата публикации',
        newsDraft: 'Черновик',
        newsPublished: 'Опубликовано',
        newsSearch: 'Поиск по заголовку...',
        newsAll: 'Все',
        save: 'Сохранить',
        saving: 'Сохранение...',
        saved: 'Сохранено!',
        delete: 'Удалить',
        deleteSelected: 'Удалить выбранные',
        deleteSelectedConfirm: 'Удалить выбранные элементы?',
        deleteConfirm: 'Удалить эту статью?',
        deleteConfirmText: 'Это действие нельзя отменить.',
        cancel: 'Отмена',
        back: 'Назад к списку',
        uploadImage: 'Нажмите для загрузки или перетащите изображение',
        uploadHint: 'JPG или PNG, до 2 МБ',
        orPasteUrl: 'Или вставьте URL изображения',
        applyUrl: 'Применить',
        publish: 'Опубликовать',
        update: 'Обновить',
        newsGallery: 'Галерея',
        contentPreview: 'Предпросмотр',
        insertPhoto: '+ Фото',
        pollSection: 'Голосование',
        pollQuestion: 'Вопрос',
        pollOption: 'Вариант',
        pollAdd: '+ Добавить вариант',
        pollEnable: 'Добавить голосование',
        pollRemove: 'Убрать голосование',
        thReactions: 'Реакции',
        thVotes: 'Голоса',
        engagement: 'Вовлечённость',
        totalVotes: 'Всего голосов',
        newsStatPublished: 'Опубликовано',
        newsStatDrafts: 'Черновики',
        newsStatPopular: 'Популярные',
        newsStatLastDate: 'Последняя',
        newsStatNoArticles: 'Статей пока нет',
        catResults: 'Репортаж',
        catInterview: 'Интервью',
        catAnnouncement: 'Анонс',
        catWorld: 'Мировой теннис',
        selectCategory: '— Выберите —',
        slugHint: 'Генерируется из заголовка. Используется в URL.',
        translateBtn: 'Перевести с RU',
        translating: 'Перевод...',
        translateError: 'Ошибка перевода',
        fillRuFirst: 'Сначала заполните поле RU',
        fillAnyLang: 'Заполните на любом языке',
        textCopied: 'Текст скопирован',
        metaReadTime: 'мин чтения',
        translateFromAny: 'Перевести',
        noArticles: 'Статей пока нет',
        noArticlesText: 'Нажмите "Добавить статью" чтобы создать первую статью',
        thTitle: 'Заголовок',
        thCategory: 'Категория',
        thStatus: 'Статус',
        thPublished: 'Дата',
        thPubDate: 'Дата публикации',
        thViews: 'Просмотры',
        thExecutor: 'Исполнитель',
        newsExecutor: 'Исполнитель',
        draftSaved: 'Черновик сохранён',
        unsavedChanges: 'Несохранённые изменения',
        unsavedChangesText: 'Есть несохранённые изменения. Выйти без сохранения?',
        unsavedLeaveBtn: 'Выйти',
        // Tournaments
        addTournament: 'Добавить турнир',
        editTournament: 'Редактировать турнир',
        trnTitle: 'Название',
        trnDescription: 'Описание',
        trnLocation: 'Место проведения',
        trnCategory: 'Категория',
        trnStatus: 'Статус',
        trnDateStart: 'Дата начала',
        trnDateEnd: 'Дата окончания',
        trnDateEndShort: 'Дата оконч.',
        trnMaxParticipants: 'Макс. участников',
        trnMaxParticipantsShort: 'Макс. участ.',
        trnPrizeFund: 'Призовой фонд',
        trnImage: 'Обложка',
        noTournaments: 'Турниров пока нет',
        noTournamentsText: 'Нажмите "Добавить турнир" чтобы создать первый турнир',
        trnDeleteConfirm: 'Удалить этот турнир?',
        statusUpcoming: 'Предстоящий',
        statusRegOpen: 'Регистрация открыта',
        statusRegClosed: 'Регистрация закрыта',
        statusOngoing: 'Идёт',
        statusCompleted: 'Завершён',
        statusCancelled: 'Отменён',
        selectStatus: '— Выберите —',
        selectCategoryTrn: '— Выберите —',
        trnFormat: 'Формат',
        formatSingles: 'Одиночный',
        formatDoubles: 'Парный',
        formatMixedDoubles: 'Смешанный парный',
        selectFormat: '— Выберите —',
        genderMen: 'Мужской',
        genderWomen: 'Женский',
        trnDrawSize: 'Размер сетки',
        trnBracketType: 'Тип сетки',
        trnCourtCount: 'Корты',
        trnMatchDuration: 'Длит. матча (мин)',
        trnRegDeadline: 'Дедлайн регистрации',
        bracketSE: 'Олимпийская система',
        bracketRR: 'Круговая система',
        selectDrawSize: '— Выберите —',
        selectBracketType: '— Выберите —',
        trnStatTotal: 'Всего турниров',
        trnStatUpcoming: 'Предстоящие',
        trnStatCompleted: 'Прошедшие',
        trnStatMenSingles: 'Мужские одиночные',
        trnStatWomenSingles: 'Женские одиночные',
        trnStatMenDoubles: 'Мужские парные',
        trnStatWomenDoubles: 'Женские парные',
        trnStatFriendly: 'Дружеские',
        trnSearch: 'Поиск по названию...',
        trnAllCategories: 'Все категории',
        trnAllStatuses: 'Все статусы',
        // Bracket management
        bracketTab: 'Сетка',
        registrationsTab: 'Заявки',
        resultsTab: 'Результаты',
        resPlace: 'Место',
        resPlayer: 'Игрок',
        resRound: 'Раунд',
        resPoints: 'Очки',
        resTotalPlayers: 'Всего игроков',
        generateDraw: 'Сгенерировать сетку',
        generateDrawConfirm: 'Сгенерировать сетку? Регистрация будет закрыта.',
        drawGenerated: 'Сетка успешно сгенерирована',
        noRegistrations: 'Заявок пока нет',
        regStatus: 'Статус',
        regApprove: 'Одобрить',
        regReject: 'Отклонить',
        regApproved: 'Одобрена',
        regRejected: 'Отклонена',
        regPending: 'Ожидает',
        regWithdrawn: 'Отозвана',
        regCount: 'зарегистрировано',
        enterScore: 'Ввести счёт',
        saveScore: 'Сохранить счёт',
        addSet: '+ Добавить сет',
        removeSet: '- Убрать сет',
        matchScore: 'Счёт',
        matchWinner: 'Победитель',
        matchCompleted: 'завершён',
        matchUpcoming: 'предстоит',
        matchLive: 'идёт',
        finalizeTournament: 'Завершить турнир',
        finalizeConfirm: 'Завершить турнир? Очки будут рассчитаны для всех игроков.',
        tournamentFinalized: 'Турнир завершён. Очки рассчитаны.',
        seedLabel: 'Посев',
        byeLabel: 'BYE',
        vsLabel: 'vs',
        roundR1: '1-й раунд',
        roundQF: 'Четвертьфинал',
        roundSF: 'Полуфинал',
        roundF: 'Финал',
        round3rd: 'За 3-е место',
        roundR16: '1/8 финала',
        // Players
        addPlayer: 'Добавить игрока',
        editPlayer: 'Редактировать игрока',
        plrName: 'Имя',
        plrCountry: 'Страна',
        plrCategory: 'Категория',
        plrPoints: 'Очки',
        plrWins: 'Победы',
        plrLosses: 'Поражения',
        plrRankChange: 'Динамика',
        plrForm: 'Последняя форма',
        plrBadges: 'Бейджи',
        plrBio: 'Биография',
        plrPhone: 'Телефон',
        plrEmail: 'Email',
        plrPhoto: 'Фото',
        plrShowPhone: 'Показывать телефон',
        noPlayers: 'Игроков пока нет',
        noPlayersText: 'Нажмите "Добавить игрока" для создания',
        plrDeleteConfirm: 'Удалить этого игрока?',
        plrSearch: 'Поиск по имени...',
        plrAllCategories: 'Все категории',
        badgeChampion: 'Чемпион',
        badgeTop1: 'Топ 1',
        badgeStreak: 'Серия побед',
        badgeNewbie: 'Новичок',
        badgeBreakthrough: 'Прорыв',
        thPoints: 'Очки',
        thWL: 'В/П',
        thChange: 'Динамика',
        // Courts
        courts: 'Корты',
        addCourt: 'Добавить корт',
        editCourt: 'Редактировать корт',
        crtName: 'Название',
        crtType: 'Тип',
        crtSurface: 'Покрытие',
        crtCourtsCount: 'Кол-во',
        crtPrice: 'Цена<br><span style="font-size:0.65rem;font-weight:400;color:var(--text-dim);">(сом/час)</span>',
        crtMobile: 'Мобильный',
        crtLandline: 'Стационарный',
        crtAddPhone: '+ Добавить телефон',
        crtEmail: 'Email',
        crtDescription: 'Описание',
        crtAmenities: 'Удобства',
        crtPartner: 'Партнёр',
        crtPromoted: 'Promoted',
        crtPhoto: 'Главное фото',
        crtGallery: 'Галерея',
        crtGoogleMaps: 'Google Maps',
        crtTwoGis: '2GIS',
        crtStreet: 'Улица',
        crtBuilding: 'Номер',
        crtDistrict: 'Район / Ориентир',
        crtCity: 'Город',
        crtPostalCode: 'Индекс',
        crtSlogan: 'Дополнительно',
        crtAdd: '+ Добавить',
        noCourts: 'Кортов пока нет',
        noCourtsText: 'Нажмите "Добавить корт" для создания',
        crtDeleteConfirm: 'Удалить этот корт?',
        crtSearch: 'Поиск по названию...',
        crtAllTypes: 'Все типы',
        crtStatOutdoor: 'Открытые',
        crtStatIndoor: 'Закрытые',
        crtStatTotal: 'Всего',
        crtAllSurfaces: 'Все покрытия',
        crtOther: 'Другое',
        crtCustomAmenity: 'Своё удобство',
        crtAddCustom: '+ Добавить своё',
        crtAddByUrl: '+ По ссылке',
        translateAllBtn: 'Перевести в пустые',
        allFieldsFilled: 'Все поля уже заполнены',
        // Coaches
        coaches: 'Тренеры',
        addCoach: 'Добавить тренера',
        editCoach: 'Редактировать тренера',
        cchLastName: 'Фамилия',
        cchFirstName: 'Имя',
        cchPatronymic: 'Отчество',
        cchPosition: 'Должность',
        cchTags: 'Теги',
        cchExperience: 'Опыт (лет)',
        cchPrice: 'Цена (сом/час)',
        cchShortDesc: 'Краткое описание',
        cchBio: 'Биография',
        cchAchievements: 'Достижения',
        cchAchievementAdd: '+ Добавить достижение',
        cchCourt: 'Корт / Клуб',
        cchPhone: 'Телефон (внутренний)',
        cchTelegram: 'Telegram',
        cchWhatsapp: 'WhatsApp',
        cchPhoto: 'Фото',
        noCoaches: 'Тренеров пока нет',
        noCoachesText: 'Нажмите "Добавить тренера" для создания',
        cchDeleteConfirm: 'Удалить этого тренера?',
        cchSearch: 'Поиск по имени...',
        cchAllTags: 'Все теги',
        cchPromoted: 'Promoted',
        cchStatTotal: 'Всего тренеров',
        cchStatPromoted: 'Продвигаются',
        cchStatNew: 'Новые за месяц',
        cchViewTitle: 'Обзор тренера',
        cchViewInfo: 'Информация',
        cchViewPayments: 'Оплаты и услуги',
        cchViewNoPayments: 'Нет оплат по этому тренеру',
        cchViewEdit: 'Редактировать',
        cchPromotedBadge: 'Продвигается',
        cchPromotedHint: 'Управляется через раздел Оплаты',
        // Ratings
        ratings: 'Рейтинг',
        ratSubRankings: 'Рейтинги',
        ratSubResults: 'Результаты',
        ratSubRules: 'Правила очков',
        ratSubPromotions: 'Промоушен',
        ratSelectCategory: 'Выберите категорию',
        ratAllCategories: 'Все категории',
        ratRank: '#',
        ratPlayer: 'Игрок',
        ratPoints: 'Очки',
        ratWL: 'В/П',
        ratForm: 'Форма',
        ratNoPlayers: 'Нет игроков в этой категории',
        ratSelectTournament: 'Выберите турнир',
        ratCompletedOnly: 'Только завершённые турниры',
        ratRound: 'Раунд',
        ratPointsEarned: 'Очки',
        ratAddResult: '+ Добавить результат',
        ratSaveResults: 'Сохранить результаты',
        ratNoResults: 'Результатов пока нет',
        ratLevel: 'Уровень турнира',
        ratW: 'Победитель',
        ratF: 'Финалист',
        rat3RD: '3-е место',
        rat4TH: '4-е место',
        ratSF: 'Полуфинал',
        ratQF: 'Четвертьфинал',
        ratR16: '1/8 финала',
        ratR32: '1/16 финала',
        ratSaveRules: 'Сохранить правила',
        ratRulesSaved: 'Правила очков сохранены',
        ratResultsSaved: 'Результаты сохранены, очки пересчитаны',
        ratEligible: 'Доступен',
        ratTransition: 'Переходный период',
        ratCompleted: 'Завершён',
        ratFromCat: 'Из',
        ratToCat: 'В',
        ratSeason: 'Сезон',
        ratStatus: 'Статус',
        ratNoPromotions: 'Нет промоушенов',
        ratTop5Info: 'Топ-5 игроков каждой категории могут перейти на уровень выше',
        ratSelectPlayer: 'Выберите игрока',
        ratTournamentLevel: 'Уровень турнира',
        ratNoLevels: 'Сначала выполните SQL миграцию для создания уровней турниров',
        // Memberships
        memList: 'Все членства',
        memAdd: 'Добавить членство',
        memEdit: 'Редактировать членство',
        memUser: 'Пользователь',
        memStatus: 'Статус',
        memStartsAt: 'Дата начала',
        memExpiresAt: 'Дата окончания',
        memDaysLeft: 'Осталось дней',
        memNote: 'Заметка',
        memActive: 'Активно',
        memExpired: 'Истекло',
        memCancelled: 'Отменено',
        memExtend: 'Продлить +1 мес',
        memCancel: 'Отменить',
        memExtendConfirm: 'Продлить членство на 1 месяц?',
        memCancelConfirm: 'Отменить это членство?',
        memDeleteConfirm: 'Удалить это членство?',
        memNoMembers: 'Членств пока нет',
        memNoMembersText: 'Нажмите "Добавить членство" для создания',
        memSearch: 'Поиск по имени или email...',
        memAllStatuses: 'Все статусы',
        memSelectUser: '— Выберите пользователя —',
        memRecordPayment: 'Записать оплату',
        memPaymentAmount: 'Сумма (KGS)',
        memPaymentMethod: 'Способ оплаты',
        memPaymentCash: 'Наличные',
        memPaymentTransfer: 'Банковский перевод',
        memPaymentCard: 'Карта',
        memPayments: 'История платежей',
        memPayDate: 'Дата',
        memPayAmount: 'Сумма',
        memPayMethod: 'Способ',
        memPayStatus: 'Статус',
        memPayNote: 'Заметка',
        memNoPayments: 'Платежей нет',
        memExpiringSoon: 'Скоро истекает',
        memPayment: 'Оплата',
        memPaid: 'Оплачено',
        memUnpaid: 'Не оплачено',
        memTgConnected: 'TG',
        memProfile: 'Профиль участника',
        memPhone: 'Телефон',
        memRole: 'Роль',
        memRegistered: 'Дата регистрации',
        memMembership: 'Членство',
        memDaysLeft: 'Дней осталось',
        memPaymentHistory: 'История оплат',
        memAmount: 'Сумма',
        memDate: 'Дата',
        memClose: 'Закрыть',
        // Users
        usrList: 'Все пользователи',
        usrSearch: 'Поиск по имени или email...',
        usrAllRoles: 'Все роли',
        usrEdit: 'Редактировать пользователя',
        usrProfile: 'Профиль',
        usrFullName: 'Полное имя',
        usrEmail: 'Email',
        usrPhone: 'Телефон',
        usrRole: 'Роль',
        usrTelegram: 'Telegram',
        usrTgConnected: 'Подключён',
        usrTgNotConnected: 'Не подключён',
        usrLastSeen: 'Последний визит',
        usrRegistered: 'Дата регистрации',
        usrMembership: 'Членство',
        usrNoMembership: 'Нет членства',
        usrGiveMembership: 'Выдать членство',
        usrExtendMembership: 'Продлить',
        usrCancelMembership: 'Отменить членство',
        usrMembershipPeriod: 'Период',
        usrMonths1: '1 месяц',
        usrMonths3: '3 месяца',
        usrMonths6: '6 месяцев',
        usrMonths12: '12 месяцев',
        usrActions: 'Действия',
        usrMakeManager: 'Сделать менеджером',
        usrRemoveManager: 'Убрать менеджера',
        usrDeleteUser: 'Удалить пользователя',
        usrDeleteConfirm: 'Удалить пользователя? Это действие нельзя отменить.',
        usrDeleteConfirmTitle: 'Удаление пользователя',
        usrCannotDeleteSelf: 'Нельзя изменить свою роль',
        usrRoleChanged: 'Роль изменена',
        usrMembershipGiven: 'Членство активировано',
        usrMembershipExtended: 'Членство продлено',
        usrMembershipCancelled: 'Членство отменено',
        usrUserDeleted: 'Пользователь удалён',
        usrUserSaved: 'Пользователь сохранён',
        usrNoUsers: 'Пользователей пока нет',
        usrNoUsersText: 'Пользователи появятся после регистрации',
        usrAddManager: 'Добавить менеджера',
        usrAddManagerTitle: 'Добавить менеджера',
        usrAddManagerEmail: 'Email',
        usrAddManagerFirstName: 'Имя',
        usrAddManagerLastName: 'Фамилия',
        usrAddManagerHint: 'Если пользователь есть — обновится роль. Если нет — будет отправлено приглашение.',
        usrManagerAdded: 'Менеджер добавлен',
        usrManagerInvited: 'Приглашение отправлено',
        usrThMembership: 'Членство',
        usrOnline: 'Онлайн',
        usrOffline: 'Офлайн',
        usrActive: 'Активно',
        usrExpired: 'Истекло',
        usrNone: 'Нет',
        // Payments
        payments: 'Оплаты',
        addPayment: 'Добавить оплату',
        editPayment: 'Редактировать оплату',
        payEntityType: 'Тип объекта',
        payEntity: 'Плательщик',
        paySearchEntity: 'Поиск по названию...',
        payAmount: 'Сумма',
        payCurrency: 'Валюта',
        payPeriodStart: 'Начало периода',
        payPeriodEnd: 'Конец периода',
        payMethod: 'Способ оплаты',
        payPurpose: 'Назначение',
        payNote: 'Примечание',
        payStatus: 'Статус',
        payActive: 'Активна',
        payExpired: 'Истекла',
        payAllStatuses: 'Все статусы',
        payAllTypes: 'Все типы',
        payAllPurposes: 'Все назначения',
        paySearch: 'Поиск оплат...',
        payCash: 'Наличные',
        payTransfer: 'Перевод',
        payCard: 'Карта',
        payPromoted: 'Продвижение',
        paySponsorship: 'Спонсорство',
        payRental: 'Аренда',
        payOther: 'Другое',
        payCourt: 'Корт',
        payCoach: 'Тренер',
        payPlayer: 'Игрок',
        payNoPayments: 'Оплат пока нет',
        payNoPaymentsText: 'Добавьте первую оплату',
        payStatActive: 'Активных',
        payStatExpired: 'Просроченных',
        payStatMonth: 'За этот месяц',
        payCreatedAt: 'Создано',
        payEntityRequired: 'Выберите объект',
        payAmountRequired: 'Введите сумму',
        payPeriodRequired: 'Укажите период',
        paySaved: 'Оплата сохранена',
        payDeleted: 'Оплата удалена',
        payDeleteConfirm: 'Удалить эту оплату?',
        crtPromotedBadge: 'Продвигается',
        crtPromotedHint: 'Управляется через раздел Оплаты',
        crtViewTitle: 'Обзор корта',
        crtViewInfo: 'Информация',
        crtViewPayments: 'Оплаты и услуги',
        crtViewNoPayments: 'Нет оплат по этому корту',
        crtViewEdit: 'Редактировать',
        crtViewAmount: 'Сумма',
        crtViewPurpose: 'Назначение',
        crtViewActiveUntil: 'Активен до',
        crtViewStatus: 'Статус',
        crtViewMethod: 'Способ'
    };

    // Category map
    var CATEGORIES = {
        results: isEn ? 'Report' : 'Репортаж',
        interview: isEn ? 'Interview' : 'Интервью',
        announcement: isEn ? 'Announcement' : 'Анонс',
        world: isEn ? 'World Tennis' : 'Мировой теннис'
    };

    // ---- Tournament Maps ----
    var cachedCategories = [];
    var categoriesMap = {};

    async function loadCategories() {
        if (cachedCategories.length > 0) return;
        if (!client) return;
        var result = await client.from('categories').select('*').order('sort_order', { ascending: true });
        cachedCategories = result.data || [];
        cachedCategories.forEach(function(c) {
            categoriesMap[c.id] = c;
        });
    }

    var TOURNAMENT_FORMATS = {
        singles: L.formatSingles,
        doubles: L.formatDoubles,
        mixed_doubles: L.formatMixedDoubles
    };

    var PLAYER_BADGES = {
        champion: isEn ? 'Champion' : 'Чемпион',
        top1: isEn ? 'Top 1' : 'Топ 1',
        streak: isEn ? 'Win Streak' : 'Серия побед',
        newbie: isEn ? 'Newcomer' : 'Новичок',
        breakthrough: isEn ? 'Breakthrough' : 'Прорыв'
    };

    var COURT_TYPES = {
        indoor: isEn ? 'Indoor' : 'Крытый',
        outdoor: isEn ? 'Outdoor' : 'Открытый'
    };

    var COURT_SURFACES = {
        hard: isEn ? 'Hard' : 'Хард',
        clay: isEn ? 'Clay' : 'Грунт',
        carpet: isEn ? 'Carpet' : 'Ковёр'
    };

    var COURT_AMENITIES = [
        { key: 'locker_rooms', label: isEn ? 'Locker Rooms' : 'Раздевалки' },
        { key: 'showers', label: isEn ? 'Showers' : 'Душевые' },
        { key: 'parking', label: isEn ? 'Parking' : 'Парковка' },
        { key: 'racket_rental', label: isEn ? 'Racket Rental' : 'Прокат ракеток' },
        { key: 'pro_shop', label: 'Pro-shop' },
        { key: 'cafe', label: isEn ? 'Café' : 'Кафе' },
        { key: 'gym', label: isEn ? 'Gym' : 'Тренажёрный зал' },
        { key: 'pool', label: isEn ? 'Swimming Pool' : 'Бассейн' },
        { key: 'sauna', label: isEn ? 'Sauna' : 'Сауна' },
        { key: 'climate', label: isEn ? 'Climate Control' : 'Климат-контроль' },
        { key: 'lighting', label: isEn ? 'Night Lighting' : 'Вечернее освещение' },
        { key: 'kids_area', label: isEn ? 'Kids Area' : 'Детская площадка' },
        { key: 'kids_school', label: isEn ? 'Kids School' : 'Детская школа' },
        { key: 'video', label: isEn ? 'Video Analysis' : 'Видеоанализ' },
        { key: 'wifi', label: 'Wi-Fi' },
        { key: 'benches', label: isEn ? 'Benches' : 'Скамейки' }
    ];

    var TOURNAMENT_STATUSES = {
        upcoming: L.statusUpcoming,
        registration_open: L.statusRegOpen,
        registration_closed: L.statusRegClosed,
        ongoing: L.statusOngoing,
        completed: L.statusCompleted,
        cancelled: L.statusCancelled
    };

    // ---- SVG Icons ----
    var ICONS = {
        grid: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>',
        users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>',
        trophy: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>',
        chart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>',
        file: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>',
        card: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
        location: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/></svg>',
        coach: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
        wallet: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="5" width="22" height="16" rx="2"/><path d="M1 10h22"/><circle cx="18" cy="15" r="1"/></svg>'
    };

    var SECTION_ICONS = {
        users: '👥',
        tournaments: '🏆',
        players: '📊',
        memberships: '💳',
        courts: '🏟️',
        coaches: '🎓',
        ratings: '⭐',
        payments: '💰'
    };

    var currentRole = 'manager';

    var ROLE_SECTIONS = {
        admin:   ['dashboard', 'content', 'tournaments', 'players', 'courts', 'coaches', 'ratings', 'users', 'memberships', 'payments'],
        manager: ['dashboard', 'content', 'tournaments', 'players', 'courts', 'coaches', 'ratings', 'users', 'memberships', 'payments']
    };

    // ---- Auth Ready Callback ----
    window.onAuthReady = function(user, profile) {
        window.requireStaff();
        currentRole = profile.role || 'manager';
        usrCurrentUserId = user.id;
        renderSidebar(profile);
        renderMobileTabs();
        renderDashboard();
        renderNewsSection();
        renderTournamentsSection();
        renderPlayersSection();
        renderCourtsSection();
        renderCoachesSection();
        renderRatingsSection();
        renderMembershipsSection();
        renderPaymentsSection();
        renderUsersSection();
        initTabs();
    };

    // ---- Render Sidebar ----
    function renderSidebar(profile) {
        var container = document.getElementById('adSidebar');
        if (!container) return;

        var nameParts = (profile.full_name || '').split(' ');
        var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';

        var avatarHtml = profile.avatar_url
            ? '<img src="' + esc(profile.avatar_url) + '" class="ad-sidebar-avatar" alt="">'
            : '<div class="ad-sidebar-avatar-placeholder">' + initials + '</div>';

        var roleLabel = L['role' + profile.role.charAt(0).toUpperCase() + profile.role.slice(1)] || profile.role;

        var sections = ROLE_SECTIONS[currentRole] || ROLE_SECTIONS.manager;

        var allItems = [
            { key: 'dashboard', icon: ICONS.grid,   label: L.dashboard, badge: false },
            { key: 'content',   icon: ICONS.file,   label: L.content,   badge: false },
            { key: 'tournaments', icon: ICONS.trophy, label: L.tournaments, badge: false },
            { key: 'players',   icon: ICONS.chart,  label: L.players,   badge: false },
            { key: 'courts',   icon: ICONS.location, label: L.courts,  badge: false },
            { key: 'coaches', icon: ICONS.coach,    label: L.coaches, badge: false },
            { key: 'ratings', icon: ICONS.star,    label: L.ratings, badge: false },
            { key: '_divider' },
            { key: 'users',     icon: ICONS.users,  label: L.users,     badge: false },
            { key: 'memberships', icon: ICONS.card, label: L.memberships, badge: true },
            { key: 'payments', icon: ICONS.wallet, label: L.payments, badge: false }
        ];

        var navHtml = '';
        allItems.forEach(function(item) {
            if (item.key === '_divider') {
                if (currentRole === 'admin') {
                    navHtml += '<li class="ad-sidebar-item"><div class="ad-sidebar-divider"></div></li>';
                }
                return;
            }
            if (sections.indexOf(item.key) === -1) return;
            var isActive = item.key === 'dashboard' ? ' active' : '';
            var badgeHtml = item.badge ? '<span class="ad-sidebar-badge">' + L.soon + '</span>' : '';
            navHtml += '<li class="ad-sidebar-item"><button class="ad-sidebar-link' + isActive + '" data-tab="' + item.key + '">' + item.icon + item.label + badgeHtml + '</button></li>';
        });

        container.innerHTML =
            '<div class="ad-sidebar-user">' +
                avatarHtml +
                '<div class="ad-sidebar-name">' + (profile.full_name || 'Admin') + '</div>' +
                '<div class="ad-sidebar-email">' + (profile.email || '') + '</div>' +
                '<div class="ad-sidebar-role">' + roleLabel + '</div>' +
            '</div>' +
            '<ul class="ad-sidebar-nav">' + navHtml + '</ul>';
    }

    // ---- Render Mobile Tabs ----
    function renderMobileTabs() {
        var container = document.getElementById('adMobileTabs');
        if (!container) return;

        var sections = ROLE_SECTIONS[currentRole] || ROLE_SECTIONS.manager;
        var html = '';
        sections.forEach(function(key) {
            var isActive = key === 'dashboard' ? ' active' : '';
            html += '<button class="ad-mobile-tab' + isActive + '" data-tab="' + key + '">' + (L[key] || key) + '</button>';
        });
        container.innerHTML = html;
    }

    // ---- Init Tabs ----
    function initTabs() {
        var hash = window.location.hash.replace('#', '') || 'dashboard';
        switchTab(hash);

        document.addEventListener('click', function(e) {
            var link = e.target.closest('[data-tab]');
            if (!link) return;
            var tab = link.dataset.tab;
            switchTab(tab);
            window.location.hash = tab;
        });

        window.addEventListener('hashchange', function() {
            var hash = window.location.hash.replace('#', '') || 'dashboard';
            switchTab(hash);
        });
    }

    function switchTab(tab) {
        document.querySelectorAll('.ad-sidebar-link').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.ad-mobile-tab').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.ad-section').forEach(function(el) {
            el.classList.toggle('active', el.id === 'ad-' + tab);
        });
        // Reset to list view when switching tabs via sidebar
        var resetMap = {
            content: renderNewsList,
            tournaments: renderTournamentsList,
            players: renderPlayersList,
            courts: renderCourtsList,
            coaches: renderCoachesList,
            users: renderUsersList,
            memberships: renderMembershipsList,
            payments: renderPaymentsList
        };
        if (resetMap[tab]) {
            resetMap[tab]();
        }
    }

    // ---- Render Dashboard ----
    function renderDashboard() {
        var container = document.getElementById('ad-dashboard');
        if (!container) return;

        var isAdm = currentRole === 'admin';

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.dashboardTitle + '</h2>' +
            // Stat cards (3x3 grid)
            '<div class="ad-stats-grid" id="adStatsGrid">' +
                // Row 1: Members, Overdue, Approaching
                renderStatCard(L.iconUsers, '...', L.statMembersDetail) +
                renderStatCard(L.iconOverdue, '...', L.statOverdueDetail, 'ad-stat-card--danger', 'adDashOverdue') +
                renderStatCard(L.iconApproaching, '...', L.statApproachingDetail, 'ad-stat-card--warning', 'adDashApproaching') +
                // Row 2: Pending regs, Tournaments, News
                renderStatCard(L.iconPending, '...', L.statPendingDetail, 'ad-stat-card--warning', 'adDashPendingRegs') +
                renderStatCard(L.iconTournaments, '...', L.statTournamentsDetail) +
                renderStatCard(L.iconNews, '...', L.statNewsDetail) +
                // Row 3: Courts, Coaches, Managers (admin only)
                renderStatCard(L.iconCourts, '...', L.statCourtsDetail) +
                renderStatCard(L.iconCoaches, '...', L.statCoachesDetail) +
                (isAdm ? renderStatCard(L.iconManagers, '...', L.statManagersDetail) : '') +
            '</div>' +
            // Activity tables
            '<div class="ad-dash-activity-grid">' +
                buildActivityTableHtml('adDashPendingRegs', L.actPendingRegs, 'warning',
                    [L.thPlayer, L.thTournament, L.thDate], 'tournaments') +
                buildActivityTableHtml('adDashApproaching', L.actApproaching, 'warning',
                    [L.thName, L.thExpires, L.thDaysLeft], 'memberships') +
                buildActivityTableHtml('adDashOverdue', L.actOverdue, 'danger',
                    [L.thName, L.thExpires, L.thOverdueDays], 'memberships') +
                buildActivityTableHtml('adDashRecentUsers', L.actRecentRegistrations, 'neutral',
                    [L.thUser, L.thEmail, L.thRole, L.thDate], 'users') +
                buildActivityTableHtml('adDashRecentTournaments', L.actRecentTournaments, 'neutral',
                    [L.thTournament, L.thDateStart, L.thStatus], 'tournaments') +
                buildActivityTableHtml('adDashRecentNews', L.actRecentNews, 'neutral',
                    [L.thArticle, L.thCategory, L.thExecutor, L.thStatus, L.thPubDate, '&#128065;'], 'content') +
            '</div>';

        loadStats();
    }

    function renderStatCard(icon, value, label, modifier, clickTarget) {
        var cls = 'ad-stat-card' + (modifier ? ' ' + modifier : '');
        var clickAttr = clickTarget ? ' data-scroll-to="' + clickTarget + '"' : '';
        return '<div class="' + cls + '"' + clickAttr + '>' +
            '<div class="ad-stat-icon">' + icon + '</div>' +
            '<div class="ad-stat-value">' + value + '</div>' +
            '<div class="ad-stat-label">' + label + '</div>' +
        '</div>';
    }

    function buildActivityTableHtml(id, title, badgeType, headers, tabTarget) {
        var headerHtml = '';
        headers.forEach(function(h) { headerHtml += '<th>' + h + '</th>'; });
        return '<div class="ad-table-card" id="' + id + '">' +
            '<div class="ad-table-card-header">' +
                '<div class="ad-table-card-title">' + title +
                    '<span class="ad-dash-count-badge ad-dash-count-badge--' + badgeType + '" id="' + id + 'Count"></span>' +
                '</div>' +
                '<a class="ad-dash-view-all" data-tab="' + tabTarget + '">' + L.viewAll + ' →</a>' +
            '</div>' +
            '<div class="ad-table-wrap">' +
                '<table class="ad-table">' +
                    '<thead><tr>' + headerHtml + '</tr></thead>' +
                    '<tbody><tr><td colspan="' + headers.length + '" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                '</table>' +
            '</div>' +
        '</div>';
    }

    function fillDashTable(containerId, result, rowFn, emptyMsg) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var tbody = container.querySelector('tbody');
        if (!tbody) return;
        var items = (result.status === 'fulfilled' && result.value.data) ? result.value.data : [];
        // Update count badge
        var badge = document.getElementById(containerId + 'Count');
        if (badge) badge.textContent = items.length > 0 ? items.length : '';
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10"><div class="ad-dash-empty"><div class="ad-dash-empty-icon">✅</div>' + emptyMsg + '</div></td></tr>';
            return;
        }
        tbody.innerHTML = '';
        items.forEach(function(item) { tbody.innerHTML += rowFn(item); });
    }

    function fmtDate(dateStr) {
        if (!dateStr) return L.noData;
        return new Date(dateStr).toLocaleDateString(isEn ? 'en-US' : 'ru-RU');
    }

    async function loadStats() {
        if (!client) return;

        var isAdm = currentRole === 'admin';
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var plus10 = new Date(now);
        plus10.setDate(plus10.getDate() + 10);
        var todayPlus10 = plus10.toISOString().split('T')[0];
        var todayMs = new Date(today).getTime();

        var results = await Promise.allSettled([
            // Counts
            client.from('players').select('id', { count: 'exact', head: true }),                                                       // [0] members
            client.from('profiles').select('id', { count: 'exact', head: true }),                                                      // [1] users
            client.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').lt('expires_at', today),     // [2] overdue
            client.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('expires_at', today).lte('expires_at', todayPlus10), // [3] approaching
            client.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),               // [4] pending regs
            client.from('tournaments').select('id', { count: 'exact', head: true }).lt('date_start', today),                           // [5] past tournaments
            client.from('tournaments').select('id', { count: 'exact', head: true }).gte('date_start', today),                          // [6] upcoming tournaments
            client.from('news').select('id', { count: 'exact', head: true }).not('published_at', 'is', null),                           // [7] published news
            client.from('courts').select('id', { count: 'exact', head: true }),                                                        // [8] courts
            client.from('coaches').select('id', { count: 'exact', head: true }),                                                       // [9] coaches
            client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'manager'),                                // [10] managers
            // Data for tables
            client.from('memberships').select('id, profile_id, expires_at, profiles!profile_id(full_name, email)')
                .eq('status', 'active').gte('expires_at', today).lte('expires_at', todayPlus10)
                .order('expires_at', { ascending: true }).limit(10),                                                                   // [11] approaching list
            client.from('memberships').select('id, profile_id, expires_at, profiles!profile_id(full_name, email)')
                .eq('status', 'active').lt('expires_at', today)
                .order('expires_at', { ascending: true }).limit(10),                                                                   // [12] overdue list
            client.from('tournament_registrations').select('id, player_id, tournament_id, registered_at, players(name), tournaments(title)')
                .eq('status', 'pending')
                .order('registered_at', { ascending: false }).limit(10),                                                               // [13] pending regs list
            client.from('profiles').select('id,full_name,email,role,avatar_url,created_at')
                .order('created_at', { ascending: false }).limit(10),                                                                  // [14] recent users
            client.from('tournaments').select('id, title, date_start, status')
                .order('date_start', { ascending: false }).limit(10),                                                                  // [15] recent tournaments
            client.from('news').select('id, title, category, executor, published_at, created_at, view_count')
                .order('created_at', { ascending: false }).limit(10)                                                                    // [16] recent news
        ]);

        // --- Stat cards ---
        var grid = document.getElementById('adStatsGrid');
        if (grid) {
            var membersCount = getCount(results[0]);
            var usersCount = getCount(results[1]);
            var overdueCount = getCount(results[2]);
            var approachingCount = getCount(results[3]);
            var pendingCount = getCount(results[4]);
            var pastTrn = getCount(results[5]);
            var upcomingTrn = getCount(results[6]);
            var newsCount = getCount(results[7]);
            var courtsCount = getCount(results[8]);
            var coachesCount = getCount(results[9]);
            var managersCount = getCount(results[10]);

            grid.innerHTML =
                // Row 1
                renderStatCard(L.iconUsers, membersCount + ' / ' + usersCount, L.statMembersDetail) +
                renderStatCard(L.iconOverdue, overdueCount, L.statOverdueDetail, 'ad-stat-card--danger', 'adDashOverdue') +
                renderStatCard(L.iconApproaching, approachingCount, L.statApproachingDetail, 'ad-stat-card--warning', 'adDashApproaching') +
                // Row 2
                renderStatCard(L.iconPending, pendingCount, L.statPendingDetail, 'ad-stat-card--warning', 'adDashPendingRegs') +
                renderStatCard(L.iconTournaments, pastTrn + ' / ' + upcomingTrn, L.statTournamentsDetail) +
                renderStatCard(L.iconNews, newsCount, L.statNewsDetail) +
                // Row 3
                renderStatCard(L.iconCourts, courtsCount, L.statCourtsDetail) +
                renderStatCard(L.iconCoaches, coachesCount, L.statCoachesDetail) +
                (isAdm ? renderStatCard(L.iconManagers, managersCount, L.statManagersDetail) : '');
        }

        // --- Activity tables ---

        // Approaching payments
        fillDashTable('adDashApproaching', results[11], function(m) {
            var name = m.profiles ? esc(m.profiles.full_name || '') : L.noData;
            var email = m.profiles ? esc(m.profiles.email || '') : '';
            var expMs = m.expires_at ? new Date(m.expires_at).getTime() : 0;
            var diff = Math.ceil((expMs - todayMs) / 86400000);
            var dCls = diff <= 3 ? 'ad-days-danger' : diff <= 7 ? 'ad-days-warning' : 'ad-days-caution';
            return '<tr>' +
                '<td><div style="font-weight:500;">' + name + '</div><div style="font-size:0.7rem;color:var(--text-dim);">' + email + '</div></td>' +
                '<td>' + fmtDate(m.expires_at) + '</td>' +
                '<td class="' + dCls + '">' + diff + (isEn ? 'd' : ' дн.') + '</td>' +
            '</tr>';
        }, L.noApproaching);

        // Overdue payments
        fillDashTable('adDashOverdue', results[12], function(m) {
            var name = m.profiles ? esc(m.profiles.full_name || '') : L.noData;
            var email = m.profiles ? esc(m.profiles.email || '') : '';
            var expMs = m.expires_at ? new Date(m.expires_at).getTime() : 0;
            var diff = Math.ceil((todayMs - expMs) / 86400000);
            return '<tr>' +
                '<td><div style="font-weight:500;">' + name + '</div><div style="font-size:0.7rem;color:var(--text-dim);">' + email + '</div></td>' +
                '<td style="color:#f44336;">' + fmtDate(m.expires_at) + '</td>' +
                '<td class="ad-days-danger">' + diff + (isEn ? 'd' : ' дн.') + '</td>' +
            '</tr>';
        }, L.noOverdue);

        // Pending registrations
        fillDashTable('adDashPendingRegs', results[13], function(r) {
            var playerName = r.players ? esc(r.players.name || '') : L.noData;
            var trnName = r.tournaments ? esc(r.tournaments.title || '') : L.noData;
            return '<tr>' +
                '<td style="font-weight:500;">' + playerName + '</td>' +
                '<td>' + trnName + '</td>' +
                '<td>' + fmtDate(r.registered_at) + '</td>' +
            '</tr>';
        }, L.noPendingRegs);

        // Recent registrations
        fillDashTable('adDashRecentUsers', results[14], function(u) {
            var nameParts = (u.full_name || '').split(' ');
            var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';
            var avatarHtml = u.avatar_url
                ? '<img src="' + esc(u.avatar_url) + '" class="ad-table-avatar" alt="">'
                : '<div class="ad-table-avatar-placeholder">' + initials + '</div>';
            var roleClass = 'ad-role-badge-' + (u.role || 'user');
            var roleLabel = L['role' + (u.role || 'user').charAt(0).toUpperCase() + (u.role || 'user').slice(1)] || u.role;
            return '<tr>' +
                '<td><div class="ad-table-user-cell">' + avatarHtml +
                    '<div><div class="ad-table-user-name">' + esc(u.full_name || L.noData) + '</div></div>' +
                '</div></td>' +
                '<td>' + esc(u.email || L.noData) + '</td>' +
                '<td><span class="ad-role-badge ' + roleClass + '">' + roleLabel + '</span></td>' +
                '<td>' + fmtDate(u.created_at) + '</td>' +
            '</tr>';
        }, L.noRecentUsers);

        // Recent tournaments
        fillDashTable('adDashRecentTournaments', results[15], function(t) {
            var statusCls = 'ad-status-' + (t.status || '').replace(/_/g, '-');
            var statusLabel = t.status ? t.status.replace(/_/g, ' ') : L.noData;
            return '<tr>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + esc(t.title || L.noData) + '</td>' +
                '<td>' + fmtDate(t.date_start) + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
            '</tr>';
        }, L.noRecentTournaments);

        // Recent news
        fillDashTable('adDashRecentNews', results[16], function(n) {
            var isPublished = !!n.published_at;
            var statusCls = isPublished ? 'ad-status-published' : 'ad-status-draft';
            var statusLabel = isPublished ? (isEn ? 'Published' : 'Опубликована') : (isEn ? 'Draft' : 'Черновик');
            var title = n.title || L.noData;
            if (title.length > 50) title = title.substring(0, 47) + '...';
            return '<tr>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + esc(title) + '</td>' +
                '<td>' + esc(n.category || '—') + '</td>' +
                '<td>' + esc(n.executor || '—') + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                '<td>' + (n.published_at ? fmtDate(n.published_at) : '—') + '</td>' +
                '<td style="text-align:center;">' + (n.view_count || 0) + '</td>' +
            '</tr>';
        }, L.noRecentNews);

        // --- Click handlers ---

        // Stat card scroll-to
        document.querySelectorAll('#ad-dashboard .ad-stat-card[data-scroll-to]').forEach(function(card) {
            card.addEventListener('click', function() {
                var target = document.getElementById(this.dataset.scrollTo);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // "View all" → switchTab
        document.querySelectorAll('#ad-dashboard .ad-dash-view-all[data-tab]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var tab = this.dataset.tab;
                switchTab(tab);
                window.location.hash = tab;
            });
        });
    }

    function getCount(result) {
        if (result.status === 'fulfilled' && result.value.count !== null && result.value.count !== undefined) {
            return result.value.count;
        }
        return L.noData;
    }

    // ============================================
    // NEWS CRUD
    // ============================================

    var newsEditingId = null;
    var newsEditingPublishedAt = null;
    var newsImageFile = null;
    var newsImageUrl = '';
    var newsGalleryUrls = [];
    var newsGalleryFiles = [];
    var newsContentImages = [];
    var newsContentImageFiles = [];
    var newsPollData = null;
    var newsSearchQuery = '';
    var newsSortCol = 'created_at';
    var newsSortAsc = false;
    var newsFilters = { category: [], published_at: [] };
    var newsAllData = [];
    var newsDraftDirty = false;

    function renderNewsSection() {
        renderNewsList();
    }

    // ---- News List ----
    async function renderNewsList() {
        var container = document.getElementById('ad-content');
        if (!container) return;

        function colHeader(col, label, filterable) {
            var isActive = newsSortCol === col;
            var hasFilter = filterable && newsFilters[col] && newsFilters[col].length > 0;
            var cls = 'ad-col-header' + (isActive || hasFilter ? ' ad-col-active' : '');
            return '<th><div class="' + cls + '" data-col="' + col + '">' +
                '<span>' + label + '</span>' +
                (isActive ? '<span class="ad-sort-arrow">' + (newsSortAsc ? '↑' : '↓') + '</span>' : '') +
                '<span class="ad-col-filter-btn' + (hasFilter ? ' ad-col-filtered' : '') + '">▼</span>' +
            '</div></th>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.content + '</h2>' +
            '</div>' +
            // News stat cards
            '<div class="ad-news-stats-grid" id="adNewsStatsGrid">' +
                '<div class="ad-news-stat-card">' +
                    '<div class="ad-news-stat-icon">&#128240;</div>' +
                    '<div class="ad-news-stat-value" id="adNewsStatPubCount">...</div>' +
                    '<div class="ad-news-stat-label">' + L.newsStatPublished + '</div>' +
                    '<div class="ad-news-stat-sub" id="adNewsStatPubDate"></div>' +
                '</div>' +
                '<div class="ad-news-stat-card">' +
                    '<div class="ad-news-stat-icon">&#128221;</div>' +
                    '<div class="ad-news-stat-value" id="adNewsStatDraftCount">...</div>' +
                    '<div class="ad-news-stat-label">' + L.newsStatDrafts + '</div>' +
                    '<div class="ad-news-stat-sub" id="adNewsStatDraftDate"></div>' +
                '</div>' +
                '<div class="ad-news-stat-card ad-news-stat-card--popular">' +
                    '<div class="ad-news-stat-icon">&#128293; ' + L.newsStatPopular + '</div>' +
                    '<div class="ad-news-stat-top-list" id="adNewsStatTopList">' +
                        '<div style="color:var(--text-dim);font-size:0.8rem;">...</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adNewsSearch" placeholder="' + L.newsSearch + '" value="' + esc(newsSearchQuery) + '">' +
                '<button class="ad-btn ad-btn-primary" id="adNewsAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addNews + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adNewsTable">' +
                        '<thead><tr>' +
                            '<th style="width:40px;"></th>' +
                            colHeader('title', L.thTitle, false) +
                            colHeader('category', L.thCategory, true) +
                            '<th>' + L.thExecutor + '</th>' +
                            colHeader('published_at', L.thStatus, true) +
                            colHeader('created_at', L.thPublished, false) +
                            colHeader('view_count', '&#128065;', false) +
                            colHeader('reactions', L.thReactions, false) +
                            colHeader('votes', L.thVotes, false) +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="10" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="ad-col-dropdown" id="adNewsColDropdown" style="display:none;"></div>' +
            '</div>';

        document.getElementById('adNewsAdd').addEventListener('click', function() {
            renderNewsForm(null);
        });

        var searchTimer = null;
        document.getElementById('adNewsSearch').addEventListener('input', function() {
            newsSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadNewsList, 300);
        });

        // Column header click → open dropdown
        document.getElementById('adNewsTable').querySelector('thead').addEventListener('click', function(e) {
            e.stopPropagation();
            var hdr = e.target.closest('.ad-col-header');
            if (!hdr) return;
            openNewsColDropdown(hdr.dataset.col, hdr);
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adNewsColDropdown');
            if (dd && dd.style.display !== 'none' && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        await loadNewsList();
        loadNewsStats(); // fire-and-forget
    }

    async function loadNewsStats() {
        if (!client) return;
        try {
            var results = await Promise.allSettled([
                client.rpc('get_news_stats'),
                client.rpc('get_top_news', { p_limit: 3 })
            ]);

            // Published + Drafts
            var statsRes = results[0];
            if (statsRes.status === 'fulfilled' && statsRes.value.data && statsRes.value.data.length) {
                var s = statsRes.value.data[0];
                var pubCountEl = document.getElementById('adNewsStatPubCount');
                var pubDateEl = document.getElementById('adNewsStatPubDate');
                var draftCountEl = document.getElementById('adNewsStatDraftCount');
                var draftDateEl = document.getElementById('adNewsStatDraftDate');

                if (pubCountEl) pubCountEl.textContent = s.published_count || 0;
                if (draftCountEl) draftCountEl.textContent = s.draft_count || 0;

                var dateFmt = isEn ? 'en-US' : 'ru-RU';
                var dateOpts = { day: 'numeric', month: 'short' };
                if (pubDateEl) {
                    pubDateEl.textContent = s.last_published
                        ? L.newsStatLastDate + ': ' + new Date(s.last_published).toLocaleDateString(dateFmt, dateOpts)
                        : L.newsStatNoArticles;
                }
                if (draftDateEl) {
                    draftDateEl.textContent = s.last_draft
                        ? L.newsStatLastDate + ': ' + new Date(s.last_draft).toLocaleDateString(dateFmt, dateOpts)
                        : '';
                }
            }

            // Top-3 popular
            var topRes = results[1];
            var topList = document.getElementById('adNewsStatTopList');
            if (topList && topRes.status === 'fulfilled' && topRes.value.data) {
                var medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
                var rows = topRes.value.data;
                if (rows.length === 0) {
                    topList.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.newsStatNoArticles + '</div>';
                } else {
                    var html = '';
                    rows.forEach(function(row, i) {
                        html += '<div class="ad-news-stat-top-item">' +
                            '<span class="ad-news-stat-top-medal">' + (medals[i] || '') + '</span>' +
                            '<span class="ad-news-stat-top-title">' + esc(row.title) + '</span>' +
                            '<span class="ad-news-stat-top-score">(' + (row.score || 0) + ')</span>' +
                        '</div>';
                    });
                    topList.innerHTML = html;
                }
            }
        } catch (e) {
            console.error('loadNewsStats error:', e);
        }
    }

    function openNewsColDropdown(col, hdr) {
        var dd = document.getElementById('adNewsColDropdown');
        if (!dd) return;

        // Toggle: if already open for same column, close it
        if (dd.style.display === 'block' && dd.dataset.col === col) {
            dd.style.display = 'none';
            return;
        }
        dd.dataset.col = col;

        // Position dropdown below header
        var rect = hdr.getBoundingClientRect();
        var cardRect = dd.parentElement.getBoundingClientRect();
        dd.style.left = Math.max(0, rect.left - cardRect.left) + 'px';
        dd.style.top = (rect.bottom - cardRect.top + 4) + 'px';

        var colLabels = { title: L.thTitle, category: L.thCategory, published_at: L.thStatus, created_at: L.thPublished, view_count: '&#128065;', reactions: L.thReactions, votes: L.thVotes };
        var isDateCol = col === 'created_at';
        var isNumericCol = col === 'view_count' || col === 'reactions' || col === 'votes';
        var filterable = col === 'category' || col === 'published_at';

        var html = '';

        // Checkboxes first (for filterable columns)
        if (filterable) {
            var values;
            if (col === 'category') {
                values = Object.keys(CATEGORIES);
            } else {
                values = ['published', 'draft'];
            }

            var activeFilters = newsFilters[col] || [];
            var allChecked = activeFilters.length === values.length;

            // Select All + Title on same line
            html += '<div class="ad-col-dd-title-row">' +
                '<label class="ad-col-dd-check-all"><input type="checkbox" id="adColSelectAll"' + (allChecked ? ' checked' : '') + '> ' + (isEn ? 'All' : 'Все') + '</label>' +
                '<span class="ad-col-dd-title">' + (colLabels[col] || col) + '</span>' +
            '</div>';

            values.forEach(function(v) {
                var label = col === 'category' ? (CATEGORIES[v] || v) : (v === 'published' ? L.newsPublished : L.newsDraft);
                var checked = activeFilters.indexOf(v) !== -1 ? ' checked' : '';
                html += '<label class="ad-col-dd-check"><input type="checkbox" value="' + esc(v) + '"' + checked + '> ' + esc(label) + '</label>';
            });

            html += '<div class="ad-col-dd-divider"></div>';
        } else {
            html += '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';
        }

        // Sort options after checkboxes
        if (isDateCol) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Newest first' : '↓ Сначала новые') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Oldest first' : '↑ Сначала старые') + '</div>';
        } else if (isNumericCol) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Most first' : '↓ Сначала больше') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Least first' : '↑ Сначала меньше') + '</div>';
        } else {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ A → Z' : '↑ А → Я') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Z → A' : '↓ Я → А') + '</div>';
        }

        dd.innerHTML = html;
        dd.style.display = 'block';

        // Sort click
        dd.querySelectorAll('.ad-col-dd-sort').forEach(function(el) {
            el.addEventListener('click', function(ev) {
                ev.stopPropagation();
                newsSortCol = col;
                newsSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateNewsColHeaders();
                loadNewsList();
            });
        });

        // Select All checkbox
        var selectAllCb = dd.querySelector('#adColSelectAll');
        var itemCbs = dd.querySelectorAll('input[type="checkbox"]:not(#adColSelectAll)');

        if (selectAllCb) {
            selectAllCb.addEventListener('change', function(ev) {
                ev.stopPropagation();
                var checked = this.checked;
                var arr = [];
                itemCbs.forEach(function(cb) {
                    cb.checked = checked;
                    if (checked) arr.push(cb.value);
                });
                newsFilters[col] = arr;
                applyNewsFilters();
                updateNewsColHeaders();
            });
        }

        // Checkbox change
        itemCbs.forEach(function(cb) {
            cb.addEventListener('change', function(ev) {
                ev.stopPropagation();
                var val = this.value;
                var arr = newsFilters[col] || [];
                if (this.checked) {
                    if (arr.indexOf(val) === -1) arr.push(val);
                } else {
                    arr = arr.filter(function(v) { return v !== val; });
                }
                newsFilters[col] = arr;
                // Sync "Select All" state
                if (selectAllCb) {
                    selectAllCb.checked = arr.length === itemCbs.length;
                }
                applyNewsFilters();
                updateNewsColHeaders();
            });
        });
    }

    function updateNewsColHeaders() {
        var table = document.getElementById('adNewsTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = newsSortCol === c;
            var filterable = c === 'category' || c === 'published_at';
            var hasFilter = filterable && newsFilters[c] && newsFilters[c].length > 0;
            hdr.classList.toggle('ad-col-active', isActive || hasFilter);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = newsSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
            var fb = hdr.querySelector('.ad-col-filter-btn');
            if (fb) fb.classList.toggle('ad-col-filtered', hasFilter);
        });
    }

    function applyNewsFilters() {
        var filtered = newsAllData.slice();

        // Category filter
        if (newsFilters.category && newsFilters.category.length > 0) {
            filtered = filtered.filter(function(a) {
                return newsFilters.category.indexOf(a.category || '') !== -1;
            });
        }

        // Status filter
        if (newsFilters.published_at && newsFilters.published_at.length > 0) {
            filtered = filtered.filter(function(a) {
                var status = a.published_at ? 'published' : 'draft';
                return newsFilters.published_at.indexOf(status) !== -1;
            });
        }

        renderNewsRows(filtered);
    }

    async function loadNewsList() {
        if (!client) return;

        // reactions/votes are not DB columns — sort client-side
        var serverSortCol = (newsSortCol === 'reactions' || newsSortCol === 'votes') ? 'created_at' : newsSortCol;
        var serverSortAsc = (newsSortCol === 'reactions' || newsSortCol === 'votes') ? false : newsSortAsc;

        var query = client.from('news')
            .select('id,title,image,category,published_at,created_at,executor,view_count')
            .order(serverSortCol, { ascending: serverSortAsc });

        if (newsSearchQuery) {
            query = query.ilike('title', '%' + newsSearchQuery + '%');
        }

        var result = await query;
        newsAllData = result.data || [];
        applyNewsFilters();
    }

    async function renderNewsRows(articles) {
        var table = document.getElementById('adNewsTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (articles.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="10" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📝</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noArticles + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noArticlesText + '</div>' +
                '</td></tr>';
            return;
        }

        // Load engagement data
        var engMap = {};
        if (client) {
            var ids = articles.map(function(a) { return a.id; });
            var engRes = await client.rpc('get_news_engagement', { p_news_ids: ids });
            if (engRes.data) {
                engRes.data.forEach(function(row) {
                    engMap[row.news_id] = { reactions: row.total_reactions || 0, votes: row.total_votes || 0 };
                });
            }
        }

        // Client-side sort for reactions/votes
        if (newsSortCol === 'reactions' || newsSortCol === 'votes') {
            var sortKey = newsSortCol;
            articles.sort(function(a, b) {
                var va = (engMap[a.id] || {})[sortKey] || 0;
                var vb = (engMap[b.id] || {})[sortKey] || 0;
                return newsSortAsc ? va - vb : vb - va;
            });
        }

        tbody.innerHTML = '';
        articles.forEach(function(a) {
            var thumbHtml = a.image
                ? '<img src="' + esc(a.image) + '" class="ad-table-thumb" alt="">'
                : '<div class="ad-table-thumb" style="background:var(--bg-elevated);"></div>';

            var catLabel = CATEGORIES[a.category] || a.category || L.noData;
            var isPublished = !!a.published_at;
            var statusHtml = isPublished
                ? '<span class="ad-status-badge ad-status-published">' + L.newsPublished + '</span>'
                : '<span class="ad-status-badge ad-status-draft">' + L.newsDraft + '</span>';

            var dateStr = a.published_at
                ? new Date(a.published_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : L.noData;

            var eng = engMap[a.id] || { reactions: 0, votes: 0 };
            var viewsCell = (a.view_count || 0) > 0 ? a.view_count : '\u2014';
            var reactionsCell = eng.reactions > 0 ? eng.reactions : '\u2014';
            var votesCell = eng.votes > 0 ? eng.votes : '\u2014';

            tbody.innerHTML +=
                '<tr data-news-id="' + a.id + '">' +
                    bulkCheckboxTd(a.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (a.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="color:var(--text-secondary);">' + esc(a.executor || '\u2014') + '</td>' +
                    '<td>' + statusHtml + '</td>' +
                    '<td>' + dateStr + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + viewsCell + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + reactionsCell + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + votesCell + '</td>' +
                '</tr>';
        });

        // Click to edit
        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-news-id]');
            if (!row) return;
            loadAndEditNews(row.dataset.newsId);
        });

        setupBulkDelete({ tableId: 'adNewsTable', tableName: 'news', reloadFn: loadNewsList });
    }

    async function loadAndEditNews(id) {
        if (!client) return;
        var result = await client.from('news').select('*').eq('id', id).single();
        if (result.data) {
            renderNewsForm(result.data);
        }
    }

    // ---- News Form ----
    function renderNewsForm(article) {
        var container = document.getElementById('ad-content');
        if (!container) return;

        newsEditingId = article ? article.id : null;
        newsEditingPublishedAt = (article && article.published_at) ? article.published_at : null;
        newsImageFile = null;
        newsImageUrl = (article && article.image) ? article.image : '';
        newsGalleryUrls = (article && article.gallery) ? article.gallery.slice() : [];
        newsGalleryFiles = [];
        newsContentImages = (article && article.content_images) ? article.content_images.slice() : [];
        newsContentImageFiles = [];
        for (var ci = 0; ci < newsContentImages.length; ci++) newsContentImageFiles.push(null);
        newsPollData = (article && article.poll) ? { question: article.poll.question || '', options: (article.poll.options || []).slice() } : null;

        var title = article ? L.editNews : L.addNews;

        var imagePreviewHtml = newsImageUrl
            ? '<img src="' + esc(newsImageUrl) + '" class="ad-image-upload-preview" id="adNewsImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adNewsImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">🖼</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = newsImageUrl ? ' has-image' : '';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adNewsBack">' + L.back + '</button>' +
            '</div>' +

            // Image
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsImage + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adNewsImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adNewsImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adNewsImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (newsImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Meta preview
            '<div class="ad-form-card ad-news-meta-preview">' +
                '<div class="ad-news-meta-row">' +
                    '<span>\uD83D\uDCC5 <span id="adMetaDate">\u2014</span></span>' +
                    '<span>\uD83D\uDC64 <span id="adMetaAuthor">KSLT Media</span></span>' +
                    '<span>\u23F1 <span id="adMetaReadTime">0</span> ' + L.metaReadTime + '</span>' +
                '</div>' +
            '</div>' +

            // Engagement (shown only for published articles)
            '<div class="ad-form-card" id="adNewsEngagement" style="display:none">' +
                '<div class="ad-form-card-title">' + L.engagement + '</div>' +
                '<div class="ad-engagement-stats">' +
                    '<div class="ad-engagement-item">&#128065; <span id="adEngViews">0</span></div>' +
                    '<div class="ad-engagement-item">&#127934; <span id="adEngTennis">0</span></div>' +
                    '<div class="ad-engagement-item">&#128293; <span id="adEngFire">0</span></div>' +
                    '<div class="ad-engagement-item">&#128079; <span id="adEngClap">0</span></div>' +
                '</div>' +
                '<div id="adNewsPollStats"></div>' +
            '</div>' +

            // Title + Slug
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsTitle + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitle" placeholder="' + L.newsTitle + ' (RU)" value="' + esc(article ? article.title : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitleEn" placeholder="' + L.newsTitle + ' (EN)" value="' + esc(article ? article.title_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-tolang="en">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitleKg" placeholder="' + L.newsTitle + ' (KG)" value="' + esc(article ? article.title_kg : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-tolang="kg">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.newsSlug + '</label>' +
                    '<input type="text" class="ad-field-input" id="adNewsSlug" placeholder="my-article-slug" value="' + esc(article ? article.slug : '') + '">' +
                    '<div class="ad-field-hint">' + L.slugHint + '</div>' +
                '</div>' +
            '</div>' +

            // Excerpt
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsExcerpt + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerpt" placeholder="' + L.newsExcerpt + ' (RU)">' + esc(article ? article.excerpt : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerptEn" placeholder="' + L.newsExcerpt + ' (EN)">' + esc(article ? article.excerpt_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-tolang="en">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerptKg" placeholder="' + L.newsExcerpt + ' (KG)">' + esc(article ? article.excerpt_kg : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-tolang="kg">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Content
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsContent + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContent" placeholder="' + L.newsContent + ' (RU)">' + esc(article ? article.content : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContentEn" placeholder="' + L.newsContent + ' (EN)">' + esc(article ? article.content_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-tolang="en">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContentKg" placeholder="' + L.newsContent + ' (KG)">' + esc(article ? article.content_kg : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-tolang="kg">&#127760; ' + L.translateFromAny + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Content Preview (WYSIWYG with inline photos)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.contentPreview + '</div>' +
                '<div id="adNewsPreview"></div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adNewsContentImgInput" style="display:none">' +
            '</div>' +

            // Meta: category, author, executor, date
            '<div class="ad-form-card">' +
                '<div class="ad-field-row-4 ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsCategory + '</label>' +
                        '<select class="ad-field-input" id="adNewsCat">' +
                            '<option value="">' + L.selectCategory + '</option>' +
                            '<option value="results"' + sel(article, 'category', 'results') + '>' + CATEGORIES.results + '</option>' +
                            '<option value="interview"' + sel(article, 'category', 'interview') + '>' + CATEGORIES.interview + '</option>' +
                            '<option value="announcement"' + sel(article, 'category', 'announcement') + '>' + CATEGORIES.announcement + '</option>' +
                            '<option value="world"' + sel(article, 'category', 'world') + '>' + CATEGORIES.world + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsAuthor + '</label>' +
                        '<input type="text" class="ad-field-input" id="adNewsAuthor" value="' + esc(article ? article.author : 'KSLT Media') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsExecutor + '</label>' +
                        '<input type="text" class="ad-field-input" id="adNewsExecutor" value="' + esc(article ? (article.executor || '') : (localStorage.getItem('kslt_name') || '')) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsPublishedAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adNewsPubDate" value="' + (article && article.published_at ? article.published_at.substring(0, 10) : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Poll
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.pollSection + '</div>' +
                '<div id="adNewsPollBody" style="display:none">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsPollQ" placeholder="' + L.pollQuestion + '">' +
                    '</div>' +
                    '<div id="adNewsPollOptions"></div>' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsPollAddOpt">' + L.pollAdd + '</button>' +
                '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsPollToggle">' +
                    (newsPollData ? L.pollRemove : L.pollEnable) +
                '</button>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-secondary" id="adNewsSave">' + L.save + '</button>' +
                '<button class="ad-btn ad-btn-primary" id="adNewsPublish">' + (newsEditingPublishedAt ? L.update : L.publish) + '</button>' +
                '<span class="ad-draft-status" id="adDraftStatus"></span>' +
                (newsEditingId ? '<button class="ad-btn ad-btn-danger" id="adNewsDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back (with unsaved changes protection)
        document.getElementById('adNewsBack').addEventListener('click', function() {
            if (newsDraftDirty) {
                showConfirm(L.unsavedChanges, L.unsavedChangesText, function() {
                    newsDraftDirty = false;
                    renderNewsList();
                }, L.unsavedLeaveBtn);
            } else {
                renderNewsList();
            }
        });

        // Lang tabs (delegate) + auto-copy
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });

            // Auto-copy: if target field is empty, copy from first non-empty panel
            var activePanel = card.querySelector('.ad-lang-panel.active');
            if (!activePanel) return;
            var field = activePanel.querySelector('textarea, input.ad-field-input');
            if (field && !field.value.trim()) {
                card.querySelectorAll('.ad-lang-panel').forEach(function(p) {
                    if (p === activePanel) return;
                    var src = p.querySelector('textarea, input.ad-field-input');
                    if (src && src.value.trim() && !field.value.trim()) {
                        field.value = src.value;
                        field.classList.add('ad-auto-copied');
                    }
                });
            }
        });

        // Remove auto-copied hint on focus
        container.addEventListener('focus', function(e) {
            if (e.target.classList && e.target.classList.contains('ad-auto-copied')) {
                e.target.classList.remove('ad-auto-copied');
            }
        }, true);

        // Translate buttons (delegate) — universal: find source from other panels
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate');
            if (!btn) return;
            var toLang = btn.dataset.tolang;
            var card = btn.closest('.ad-form-card');
            if (!card) return;

            // Find target field in current panel
            var currentPanel = btn.closest('.ad-lang-panel');
            var targetEl = currentPanel ? currentPanel.querySelector('textarea, input.ad-field-input') : null;
            if (!targetEl) return;

            // Find first non-empty source from other panels
            var srcText = '';
            var srcLang = '';
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) {
                if (p === currentPanel || srcText) return;
                var src = p.querySelector('textarea, input.ad-field-input');
                if (src && src.value.trim()) {
                    srcText = src.value.trim();
                    srcLang = p.dataset.langPanel;
                }
            });

            if (!srcText) {
                showToast(L.fillAnyLang, 'error');
                return;
            }

            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;

            translateText(srcText, srcLang, toLang).then(function(result) {
                targetEl.value = result;
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Auto-slug from title
        var titleInput = document.getElementById('adNewsTitle');
        var slugInput = document.getElementById('adNewsSlug');
        if (titleInput && slugInput && !newsEditingId) {
            titleInput.addEventListener('input', function() {
                slugInput.value = slugify(titleInput.value);
            });
        }

        // Meta preview live update
        var MONTHS_RU = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
        var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        function updateMetaPreview() {
            var dateEl = document.getElementById('adMetaDate');
            var authorEl = document.getElementById('adMetaAuthor');
            var readEl = document.getElementById('adMetaReadTime');
            var pubInput = document.getElementById('adNewsPubDate');
            var authorInput = document.getElementById('adNewsAuthor');
            var contentInput = document.getElementById('adNewsContent');
            if (dateEl && pubInput && pubInput.value) {
                var d = new Date(pubInput.value + 'T12:00:00');
                var months = isEn ? MONTHS_EN : MONTHS_RU;
                dateEl.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
            } else if (dateEl) {
                dateEl.textContent = L.newsDraft;
            }
            if (authorEl && authorInput) {
                authorEl.textContent = authorInput.value.trim() || 'KSLT Media';
            }
            if (readEl && contentInput) {
                var words = contentInput.value.trim().split(/\s+/).filter(function(w) { return w; }).length;
                readEl.textContent = Math.max(1, Math.ceil(words / 200));
            }
        }
        ['adNewsPubDate', 'adNewsAuthor', 'adNewsContent'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateMetaPreview);
        });
        updateMetaPreview();

        // Load engagement stats for existing published articles
        if (article && article.id && article.published_at && client) {
            (async function() {
                var engCard = document.getElementById('adNewsEngagement');
                if (!engCard) return;

                // View count (from article data — already in select('*'))
                var viewsEl = document.getElementById('adEngViews');
                if (viewsEl) viewsEl.textContent = article.view_count || 0;

                // Reaction counts
                var countsRes = await client.rpc('get_reaction_counts', { p_news_id: article.id });
                if (countsRes.data && countsRes.data.length) {
                    var c = countsRes.data[0];
                    var el;
                    el = document.getElementById('adEngTennis');
                    if (el) el.textContent = c.tennis || 0;
                    el = document.getElementById('adEngFire');
                    if (el) el.textContent = c.fire || 0;
                    el = document.getElementById('adEngClap');
                    if (el) el.textContent = c.clap || 0;
                }

                // Poll results
                var pollStatsEl = document.getElementById('adNewsPollStats');
                if (pollStatsEl && article.poll && article.poll.options && article.poll.options.length) {
                    var pollRes = await client.rpc('get_poll_results', { p_news_id: article.id });
                    var votes = [];
                    for (var pi = 0; pi < article.poll.options.length; pi++) votes.push(0);
                    if (pollRes.data) {
                        pollRes.data.forEach(function(row) {
                            if (row.option_index >= 0 && row.option_index < votes.length) {
                                votes[row.option_index] = row.count || 0;
                            }
                        });
                    }
                    var totalV = votes.reduce(function(a, b) { return a + b; }, 0);
                    var pollHtml = '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color);">' +
                        '<div style="font-weight:500;margin-bottom:8px;">' + esc(article.poll.question || '') + '</div>';
                    for (var vi = 0; vi < article.poll.options.length; vi++) {
                        var pct = totalV > 0 ? Math.round((votes[vi] / totalV) * 100) : 0;
                        pollHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                            '<span style="color:var(--text-secondary);">' + esc(article.poll.options[vi]) + '</span>' +
                            '<span style="color:var(--accent);font-weight:500;">' + pct + '% (' + votes[vi] + ')</span>' +
                        '</div>';
                    }
                    pollHtml += '<div style="margin-top:8px;color:var(--text-dim);font-size:0.85rem;">' + L.totalVotes + ': ' + totalV + '</div></div>';
                    pollStatsEl.innerHTML = pollHtml;
                }

                engCard.style.display = '';
            })();
        }

        // Image upload zone
        var imgZone = document.getElementById('adNewsImgZone');
        var imgInput = document.getElementById('adNewsImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                newsImageFile = imgInput.files[0];
                previewNewsImage(URL.createObjectURL(newsImageFile));
            }
        });

        // Drag & drop
        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                newsImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewNewsImage(URL.createObjectURL(newsImageFile));
            }
        });

        // Remove image
        setupImgRemove();

        // URL apply
        document.getElementById('adNewsImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adNewsImgUrl').value.trim();
            if (url) {
                newsImageFile = null;
                newsImageUrl = url;
                previewNewsImage(url);
            }
        });

        // Content Preview: render + live update
        renderNewsPreview();
        var previewTimer = null;
        var contentTextarea = document.getElementById('adNewsContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', function() {
                clearTimeout(previewTimer);
                previewTimer = setTimeout(renderNewsPreview, 300);
            });
        }

        // Content Preview: file input handler
        var contentImgInput = document.getElementById('adNewsContentImgInput');
        contentImgInput.addEventListener('change', function() {
            var files = this.files;
            if (!files || !files[0]) return;
            var afterPar = parseInt(this.dataset.afterParagraph, 10) || 1;
            var file = files[0];
            newsContentImages.push({ url: URL.createObjectURL(file), after_paragraph: afterPar });
            newsContentImageFiles.push(file);
            renderNewsPreview();
            this.value = '';
        });

        // Content Preview: delegated clicks (insert photo + remove photo)
        document.getElementById('adNewsPreview').addEventListener('click', function(e) {
            // Insert photo from file
            var insertBtn = e.target.closest('.ad-preview-insert-btn');
            if (insertBtn) {
                var afterPar = parseInt(insertBtn.dataset.afterParagraph, 10) || 1;
                contentImgInput.dataset.afterParagraph = afterPar;
                contentImgInput.click();
                return;
            }
            // Insert photo from URL
            var urlBtn = e.target.closest('.ad-preview-insert-url-btn');
            if (urlBtn) {
                var afterPar = parseInt(urlBtn.dataset.afterParagraph, 10) || 1;
                var url = prompt(isEn ? 'Paste image URL:' : 'Вставьте URL изображения:');
                if (url && url.trim()) {
                    newsContentImages.push({ url: url.trim(), after_paragraph: afterPar });
                    newsContentImageFiles.push(null);
                    renderNewsPreview();
                }
                return;
            }
            // Remove photo button
            var rmBtn = e.target.closest('.ad-preview-img-remove');
            if (rmBtn) {
                var imgAfter = parseInt(rmBtn.dataset.afterParagraph, 10);
                var imgIdx = parseInt(rmBtn.dataset.imgIdx, 10);
                // Find and remove from arrays
                var removeAt = -1;
                var count = 0;
                for (var i = 0; i < newsContentImages.length; i++) {
                    if (newsContentImages[i].after_paragraph === imgAfter) {
                        if (count === imgIdx) { removeAt = i; break; }
                        count++;
                    }
                }
                if (removeAt >= 0) {
                    newsContentImages.splice(removeAt, 1);
                    newsContentImageFiles.splice(removeAt, 1);
                }
                renderNewsPreview();
            }
        });

        // Poll: init display
        if (newsPollData) {
            document.getElementById('adNewsPollBody').style.display = '';
            document.getElementById('adNewsPollQ').value = newsPollData.question;
            renderNewsPollOptions();
        }

        // Poll: toggle
        document.getElementById('adNewsPollToggle').addEventListener('click', function() {
            if (newsPollData) {
                newsPollData = null;
                document.getElementById('adNewsPollBody').style.display = 'none';
                this.textContent = L.pollEnable;
            } else {
                newsPollData = { question: '', options: ['', ''] };
                document.getElementById('adNewsPollBody').style.display = '';
                document.getElementById('adNewsPollQ').value = '';
                renderNewsPollOptions();
                this.textContent = L.pollRemove;
            }
        });

        // Poll: add option
        document.getElementById('adNewsPollAddOpt').addEventListener('click', function() {
            if (!newsPollData) return;
            newsPollData.options.push('');
            renderNewsPollOptions();
        });

        // Poll: question input
        document.getElementById('adNewsPollQ').addEventListener('input', function() {
            if (newsPollData) newsPollData.question = this.value;
        });

        // Poll: delegated remove + option input
        document.getElementById('adNewsPollOptions').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-poll-opt-remove');
            if (!rmBtn || !newsPollData) return;
            if (newsPollData.options.length <= 2) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            newsPollData.options.splice(idx, 1);
            renderNewsPollOptions();
        });
        document.getElementById('adNewsPollOptions').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-poll-opt-input') || !newsPollData) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            newsPollData.options[idx] = e.target.value;
        });

        // Save (draft)
        document.getElementById('adNewsSave').addEventListener('click', function() { saveNewsHandler(false); });

        // Publish / Update
        document.getElementById('adNewsPublish').addEventListener('click', function() { saveNewsHandler(true); });

        // Delete
        var delBtn = document.getElementById('adNewsDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.deleteConfirm, L.deleteConfirmText, function() {
                    deleteNewsHandler();
                });
            });
        }

        // ---- Autosave to Supabase ----
        newsDraftDirty = false;

        function collectDraftData() {
            return {
                title: (document.getElementById('adNewsTitle') || {}).value || '',
                title_en: (document.getElementById('adNewsTitleEn') || {}).value || '',
                title_kg: (document.getElementById('adNewsTitleKg') || {}).value || '',
                slug: (document.getElementById('adNewsSlug') || {}).value || '',
                excerpt: (document.getElementById('adNewsExcerpt') || {}).value || '',
                excerpt_en: (document.getElementById('adNewsExcerptEn') || {}).value || '',
                excerpt_kg: (document.getElementById('adNewsExcerptKg') || {}).value || '',
                content: (document.getElementById('adNewsContent') || {}).value || '',
                content_en: (document.getElementById('adNewsContentEn') || {}).value || '',
                content_kg: (document.getElementById('adNewsContentKg') || {}).value || '',
                category: (document.getElementById('adNewsCat') || {}).value || '',
                author: (document.getElementById('adNewsAuthor') || {}).value || '',
                executor: (document.getElementById('adNewsExecutor') || {}).value || '',
                image: newsImageUrl || null,
                content_images: newsContentImages.filter(function(ci) { return ci.url && !ci.url.startsWith('blob:'); }),
                poll: newsPollData,
                published_at: null
            };
        }

        var autosaveTimer = null;
        var autosaving = false;

        async function autosaveDraft() {
            var title = (document.getElementById('adNewsTitle') || {}).value || '';
            if (!title.trim()) return; // Don't save empty drafts

            if (autosaving) return;
            autosaving = true;

            try {
                var data = collectDraftData();
                if (!data.slug) data.slug = slugify(data.title);

                var result;
                if (newsEditingId) {
                    result = await client.from('news').update(data).eq('id', newsEditingId);
                } else {
                    data.id = crypto.randomUUID();
                    result = await client.from('news').insert(data);
                    if (!result.error) {
                        newsEditingId = data.id;
                    }
                }

                if (!result.error) {
                    newsDraftDirty = false;
                    var statusEl = document.getElementById('adDraftStatus');
                    if (statusEl) {
                        var now = new Date();
                        var hh = String(now.getHours()).padStart(2, '0');
                        var mm = String(now.getMinutes()).padStart(2, '0');
                        statusEl.textContent = '\u2713 ' + L.draftSaved + ' ' + hh + ':' + mm;
                    }
                }
            } catch (e) {
                console.error('Autosave error:', e);
            }
            autosaving = false;
        }

        container.addEventListener('input', function(e) {
            if (!e.target.closest('.ad-form-card, .ad-field')) return;
            newsDraftDirty = true;
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(autosaveDraft, 3000);
        });
    }

    function previewNewsImage(src) {
        var zone = document.getElementById('adNewsImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + esc(src) + '" class="ad-image-upload-preview" id="adNewsImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adNewsImgRemove">&times;</button>';
        setupImgRemove();
    }

    function setupImgRemove() {
        var rmBtn = document.getElementById('adNewsImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                newsImageFile = null;
                newsImageUrl = '';
                var zone = document.getElementById('adNewsImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">🖼</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adNewsImgUrl').value = '';
                document.getElementById('adNewsImgInput').value = '';
            });
        }
    }

    // ---- Content Preview (WYSIWYG) ----
    function renderNewsPreview() {
        var container = document.getElementById('adNewsPreview');
        if (!container) return;

        var textEl = document.getElementById('adNewsContent');
        var text = textEl ? textEl.value.trim() : '';

        if (!text) {
            container.innerHTML = '<div style="color:var(--text-secondary);font-size:0.92em;padding:20px 0;text-align:center">' +
                (isEn ? 'Start typing content to see preview' : 'Начните вводить текст для предпросмотра') + '</div>';
            return;
        }

        // Split into paragraphs
        var paragraphs = text.split(/\n\n+/).filter(function(p) { return p.trim(); });

        // Group content_images by after_paragraph
        var imgsByPar = {};
        newsContentImages.forEach(function(item, idx) {
            var key = item.after_paragraph || 1;
            if (!imgsByPar[key]) imgsByPar[key] = [];
            imgsByPar[key].push({ url: item.url, globalIdx: idx });
        });

        var html = '';
        paragraphs.forEach(function(para, idx) {
            var parNum = idx + 1;

            // Paragraph text
            html += '<div style="padding:10px 12px;margin:2px 0;background:rgba(255,255,255,0.03);border-radius:6px;border-left:3px solid rgba(204,255,0,0.15);font-size:0.9em;color:var(--text-secondary);line-height:1.5">' +
                '<span style="color:var(--accent);font-size:0.75em;opacity:0.5;margin-right:6px">' + parNum + '</span>' +
                esc(para.length > 200 ? para.substring(0, 200) + '...' : para) +
            '</div>';

            // Photos after this paragraph
            if (imgsByPar[parNum]) {
                imgsByPar[parNum].forEach(function(img, imgIdx) {
                    html += '<div style="position:relative;display:inline-block;margin:6px 0 6px 24px">' +
                        '<img src="' + esc(img.url) + '" alt="" style="max-width:300px;max-height:200px;border-radius:8px;display:block">' +
                        '<button type="button" class="ad-preview-img-remove" data-after-paragraph="' + parNum + '" data-img-idx="' + imgIdx + '" ' +
                            'style="position:absolute;top:4px;right:4px;width:24px;height:24px;border-radius:50%;background:rgba(0,0,0,0.7);color:#fff;border:none;cursor:pointer;font-size:14px;display:flex;align-items:center;justify-content:center">&times;</button>' +
                    '</div>';
                });
            }

            // Insert photo buttons (file + URL)
            html += '<div style="text-align:center;padding:4px 0;display:flex;justify-content:center;gap:8px">' +
                '<button type="button" class="ad-preview-insert-btn" data-after-paragraph="' + parNum + '" ' +
                    'style="background:none;border:1px dashed rgba(204,255,0,0.25);color:var(--accent);padding:4px 16px;border-radius:6px;cursor:pointer;font-size:0.8em;opacity:0.5;transition:opacity 0.2s"' +
                    ' onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">' +
                    L.insertPhoto +
                '</button>' +
                '<button type="button" class="ad-preview-insert-url-btn" data-after-paragraph="' + parNum + '" ' +
                    'style="background:none;border:1px dashed rgba(204,255,0,0.15);color:var(--text-secondary);padding:4px 12px;border-radius:6px;cursor:pointer;font-size:0.8em;opacity:0.5;transition:opacity 0.2s"' +
                    ' onmouseover="this.style.opacity=1" onmouseout="this.style.opacity=0.5">' +
                    'URL' +
                '</button>' +
            '</div>';
        });

        container.innerHTML = html;
    }

    // ---- Poll Options (News) ----
    function renderNewsPollOptions() {
        var container = document.getElementById('adNewsPollOptions');
        if (!container || !newsPollData) return;
        var html = '';
        newsPollData.options.forEach(function(opt, idx) {
            html += '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
                '<span style="color:var(--text-secondary);font-size:0.85em;min-width:20px">' + (idx + 1) + '.</span>' +
                '<input type="text" class="ad-field-input ad-poll-opt-input" data-idx="' + idx + '" value="' + esc(opt) + '" placeholder="' + L.pollOption + ' ' + (idx + 1) + '" style="flex:1">' +
                (newsPollData.options.length > 2 ? '<button type="button" class="ad-gallery-remove ad-poll-opt-remove" data-idx="' + idx + '" style="position:static;width:24px;height:24px;font-size:14px">&times;</button>' : '') +
            '</div>';
        });
        container.innerHTML = html;
    }

    // ---- Save News ----
    async function saveNewsHandler(doPublish) {
        var saveBtn = document.getElementById('adNewsSave');
        var pubBtn = document.getElementById('adNewsPublish');
        var activeBtn = doPublish ? pubBtn : saveBtn;
        activeBtn.disabled = true;
        activeBtn.textContent = L.saving;

        try {
            // Upload cover image if file selected
            var imageUrl = newsImageUrl;
            if (newsImageFile) {
                imageUrl = await uploadNewsImage(newsImageFile);
                if (!imageUrl) {
                    activeBtn.disabled = false;
                    activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                    return;
                }
            }

            // Upload new content image files
            var contentImagesFinal = [];
            for (var ci = 0; ci < newsContentImages.length; ci++) {
                var ciUrl = newsContentImages[ci].url;
                if (newsContentImageFiles[ci]) {
                    var ciUploaded = await uploadNewsImage(newsContentImageFiles[ci]);
                    if (ciUploaded) {
                        ciUrl = ciUploaded;
                    } else {
                        continue; // Skip failed uploads, don't save blob URL
                    }
                }
                // Skip blob URLs (shouldn't happen but safety check)
                if (ciUrl && ciUrl.startsWith('blob:')) continue;
                if (ciUrl) {
                    contentImagesFinal.push({ url: ciUrl, after_paragraph: newsContentImages[ci].after_paragraph || 1 });
                }
            }

            // Collect poll data
            var pollFinal = null;
            if (newsPollData && newsPollData.question && newsPollData.question.trim()) {
                var filteredOpts = newsPollData.options.filter(function(o) { return o && o.trim(); });
                if (filteredOpts.length >= 2) {
                    pollFinal = { question: newsPollData.question.trim(), options: filteredOpts };
                }
            }

            // Determine published_at (date from field, time preserved internally)
            var pubDateInput = document.getElementById('adNewsPubDate').value; // YYYY-MM-DD or ''
            var publishedAt;
            if (doPublish) {
                if (pubDateInput) {
                    // Use selected date + current time for tracking
                    var now = new Date();
                    publishedAt = pubDateInput + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00.000Z';
                    // If already published, keep original time
                    if (newsEditingPublishedAt && newsEditingPublishedAt.substring(0, 10) === pubDateInput) {
                        publishedAt = newsEditingPublishedAt;
                    }
                } else {
                    publishedAt = newsEditingPublishedAt || new Date().toISOString();
                }
            } else {
                // Save draft: keep existing published_at or null
                if (pubDateInput && newsEditingPublishedAt) {
                    publishedAt = newsEditingPublishedAt;
                } else {
                    publishedAt = null;
                }
            }

            var data = {
                title: document.getElementById('adNewsTitle').value.trim(),
                title_en: document.getElementById('adNewsTitleEn').value.trim(),
                title_kg: document.getElementById('adNewsTitleKg').value.trim(),
                slug: document.getElementById('adNewsSlug').value.trim(),
                excerpt: document.getElementById('adNewsExcerpt').value.trim(),
                excerpt_en: document.getElementById('adNewsExcerptEn').value.trim(),
                excerpt_kg: document.getElementById('adNewsExcerptKg').value.trim(),
                content: document.getElementById('adNewsContent').value.trim(),
                content_en: document.getElementById('adNewsContentEn').value.trim(),
                content_kg: document.getElementById('adNewsContentKg').value.trim(),
                image: imageUrl || null,
                content_images: contentImagesFinal,
                poll: pollFinal,
                category: document.getElementById('adNewsCat').value,
                author: document.getElementById('adNewsAuthor').value.trim(),
                executor: document.getElementById('adNewsExecutor').value.trim(),
                published_at: publishedAt
            };

            if (!data.title) {
                showToast(isEn ? 'Title is required' : 'Заголовок обязателен', 'error');
                activeBtn.disabled = false;
                activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                return;
            }

            if (!data.slug) {
                data.slug = slugify(data.title);
            }

            var result;
            if (newsEditingId) {
                result = await client.from('news').update(data).eq('id', newsEditingId);
            } else {
                data.id = crypto.randomUUID();
                result = await client.from('news').insert(data);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
                activeBtn.disabled = false;
                activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                return;
            }

            newsDraftDirty = false;
            showToast(L.saved, 'success');
            renderNewsList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            activeBtn.disabled = false;
            activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
        }
    }

    // ---- Delete News ----
    async function deleteNewsHandler() {
        if (!newsEditingId) return;
        var result = await client.from('news').delete().eq('id', newsEditingId);
        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }
        showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderNewsList();
    }

    // ---- Upload Image to Supabase Storage ----
    async function uploadNewsImage(file) {
        if (!client || !file) return null;

        var ext = file.name.split('.').pop().toLowerCase();
        var filename = Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;

        try {
            var result = await client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (result.error) {
                showToast('Storage: ' + (result.error.message || result.error.statusCode || JSON.stringify(result.error)), 'error');
                console.error('Upload error:', result.error);
                return null;
            }

            var urlResult = client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            console.error('Upload exception:', e);
            return null;
        }
    }

    // ============================================
    // TOURNAMENTS CRUD
    // ============================================

    var trnEditingId = null;
    var trnImageFile = null;
    var trnImageUrl = '';
    var trnAllData = [];
    var trnSearchQuery = '';
    var trnFilterCategory = '';
    var trnFilterStatus = '';
    var trnSortCol = 'date_start';
    var trnSortAsc = false;
    var trnPage = 1;
    var TRN_PER_PAGE = 15;

    async function renderTournamentsSection() {
        await loadCategories();
        await loadTournamentLevels();
        renderTournamentsList();
    }

    // ---- Tournament List ----
    async function renderTournamentsList() {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        // Reset filters
        trnSearchQuery = '';
        trnFilterCategory = '';
        trnFilterStatus = '';
        trnSortCol = 'date_start';
        trnSortAsc = false;
        trnPage = 1;

        // Category filter options
        var catFilterHtml = '<option value="">' + L.trnAllCategories + '</option>';
        cachedCategories.forEach(function(c) {
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            catFilterHtml += '<option value="' + c.id + '">' + genderIcon + catName + '</option>';
        });

        // Status filter options
        var statusFilterHtml = '<option value="">' + L.trnAllStatuses + '</option>';
        Object.keys(TOURNAMENT_STATUSES).forEach(function(key) {
            statusFilterHtml += '<option value="' + key + '">' + TOURNAMENT_STATUSES[key] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.tournaments + '</h2>' +
            '</div>' +
            '<div class="ad-trn-stats-header">' +
                L.trnStatTotal + ': <span id="adTrnStatTotal">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatUpcoming + ': <span id="adTrnStatUpcoming">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatCompleted + ': <span id="adTrnStatCompleted">...</span>' +
            '</div>' +
            '<div class="ad-trn-stats-grid">' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2642 ' + L.trnStatMenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMS">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyMS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2640 ' + L.trnStatWomenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWS">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyWS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2642 ' + L.trnStatMenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMD">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyMD"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2640 ' + L.trnStatWomenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWD">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyWD"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\uD83E\uDD1D ' + L.trnStatFriendly + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalFR">...</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky" id="adTrnFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adTrnSearch" placeholder="' + L.trnSearch + '">' +
                '<select class="ad-field-input ad-filter-select" id="adTrnCategoryFilter">' + catFilterHtml + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="adTrnStatusFilter">' + statusFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adTrnAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addTournament + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-col-dropdown" id="adTrnColDropdown" style="display:none;"></div>' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adTrnTable">' +
                        '<thead><tr>' +
                            trnColHeader('title', L.trnTitle) +
                            trnColHeader('category', L.trnCategory) +
                            trnColHeader('status', L.trnStatus) +
                            trnColHeader('date_start', L.trnDateStart) +
                            trnColHeader('date_end', L.trnDateEndShort) +
                            trnColHeader('participants', L.trnMaxParticipantsShort) +
                            '<th></th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        // Add button
        document.getElementById('adTrnAdd').addEventListener('click', function() {
            renderTournamentForm(null);
        });

        // Search with debounce
        var trnSearchTimer = null;
        document.getElementById('adTrnSearch').addEventListener('input', function() {
            var val = this.value.trim();
            clearTimeout(trnSearchTimer);
            trnSearchTimer = setTimeout(function() {
                trnSearchQuery = val;
                trnPage = 1;
                applyTrnFilters();
            }, 300);
        });

        // Category filter
        document.getElementById('adTrnCategoryFilter').addEventListener('change', function() {
            trnFilterCategory = this.value;
            trnPage = 1;
            applyTrnFilters();
        });

        // Status filter
        document.getElementById('adTrnStatusFilter').addEventListener('change', function() {
            trnFilterStatus = this.value;
            trnPage = 1;
            applyTrnFilters();
        });

        // Column header click → dropdown
        var thead = document.querySelector('#adTrnTable thead');
        if (thead) {
            thead.addEventListener('click', function(e) {
                var hdr = e.target.closest('.ad-col-header');
                if (!hdr) return;
                openTrnColDropdown(hdr.dataset.col, hdr);
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adTrnColDropdown');
            if (dd && dd.style.display === 'block' && !e.target.closest('.ad-col-dropdown') && !e.target.closest('.ad-col-header')) {
                dd.style.display = 'none';
            }
        });

        await loadTournamentsList();
    }

    async function loadTournamentsList() {
        if (!client) return;

        var result = await client.from('tournaments')
            .select('id,title,image,category_id,format,status,date_start,date_end,max_participants,bracket_type,draw_size')
            .order('created_at', { ascending: false });

        var items = result.data || [];
        trnAllData = items;
        updateTournamentStats();
        applyTrnFilters();
    }

    function updateTournamentStats() {
        var upcomingStatuses = ['upcoming', 'registration_open', 'registration_closed', 'ongoing'];
        var total = trnAllData.length;
        var upcoming = 0;
        var completed = 0;
        trnAllData.forEach(function(t) {
            if (upcomingStatuses.indexOf(t.status) !== -1) upcoming++;
            if (t.status === 'completed') completed++;
        });

        var elTotal = document.getElementById('adTrnStatTotal');
        var elUp = document.getElementById('adTrnStatUpcoming');
        var elComp = document.getElementById('adTrnStatCompleted');
        if (elTotal) elTotal.textContent = total;
        if (elUp) elUp.textContent = upcoming;
        if (elComp) elComp.textContent = completed;

        var cards = [
            { gender: 'men', format: 'singles', totalId: 'adTrnTotalMS', bodyId: 'adTrnBodyMS' },
            { gender: 'women', format: 'singles', totalId: 'adTrnTotalWS', bodyId: 'adTrnBodyWS' },
            { gender: 'men', format: 'doubles', totalId: 'adTrnTotalMD', bodyId: 'adTrnBodyMD' },
            { gender: 'women', format: 'doubles', totalId: 'adTrnTotalWD', bodyId: 'adTrnBodyWD' }
        ];

        cards.forEach(function(card) {
            var filtered = trnAllData.filter(function(t) {
                var cat = categoriesMap[t.category_id];
                return cat && cat.gender === card.gender && t.format === card.format;
            });
            var cardTotal = filtered.length;
            var totalEl = document.getElementById(card.totalId);
            var bodyEl = document.getElementById(card.bodyId);
            if (totalEl) totalEl.textContent = cardTotal;
            if (!bodyEl) return;

            var breakdown = {};
            filtered.forEach(function(t) {
                var cat = categoriesMap[t.category_id];
                if (!cat) return;
                var key = cat.id;
                if (!breakdown[key]) breakdown[key] = { name: isEn ? cat.name_en : cat.name, sort: cat.sort_order || 0, count: 0 };
                breakdown[key].count++;
            });

            var sorted = Object.keys(breakdown).map(function(k) { return breakdown[k]; });
            sorted.sort(function(a, b) { return a.sort - b.sort; });

            var html = '';
            sorted.forEach(function(row) {
                if (row.count > 0) {
                    var pct = cardTotal > 0 ? Math.round(row.count / cardTotal * 100) : 0;
                    html += '<div class="ad-crt-stat-row">' +
                        '<span class="ad-crt-stat-surface">' + row.name + '</span>' +
                        '<div class="ad-crt-stat-bar-wrap"><div class="ad-crt-stat-bar" style="width:' + pct + '%;"></div></div>' +
                        '<span class="ad-crt-stat-count">' + row.count + '</span>' +
                    '</div>';
                }
            });
            bodyEl.innerHTML = html;
        });

        var friendlyTotal = trnAllData.filter(function(t) { return t.format === 'mixed_doubles'; }).length;
        var elFR = document.getElementById('adTrnTotalFR');
        if (elFR) elFR.textContent = friendlyTotal;
    }

    // ---- Tournament Column Header ----
    function trnColHeader(col, label) {
        var sortable = col === 'title' || col === 'category' || col === 'status' || col === 'date_start' || col === 'date_end' || col === 'participants';
        if (!sortable) return '<th>' + label + '</th>';
        var isActive = trnSortCol === col;
        var cls = 'ad-col-header' + (isActive ? ' ad-col-active' : '');
        return '<th><div class="' + cls + '" data-col="' + col + '">' +
            '<span>' + label + '</span>' +
            (isActive ? '<span class="ad-sort-arrow">' + (trnSortAsc ? '↑' : '↓') + '</span>' : '') +
            '<span class="ad-col-filter-btn">▼</span>' +
        '</div></th>';
    }

    // ---- Tournament Apply Filters ----
    function applyTrnFilters() {
        var items = trnAllData.slice();

        // Filter by category
        if (trnFilterCategory) {
            items = items.filter(function(t) {
                return t.category_id === trnFilterCategory;
            });
        }

        // Filter by status
        if (trnFilterStatus) {
            items = items.filter(function(t) {
                return t.status === trnFilterStatus;
            });
        }

        // Search by title
        if (trnSearchQuery) {
            var q = trnSearchQuery.toLowerCase();
            items = items.filter(function(t) {
                return (t.title || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        // Sort
        if (trnSortCol === 'title') {
            items.sort(function(a, b) {
                var va = (a.title || '').toLowerCase();
                var vb = (b.title || '').toLowerCase();
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'category') {
            items.sort(function(a, b) {
                var ca = categoriesMap[a.category_id];
                var cb = categoriesMap[b.category_id];
                var va = ca ? (isEn ? ca.name_en : ca.name) : '';
                var vb = cb ? (isEn ? cb.name_en : cb.name) : '';
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'status') {
            items.sort(function(a, b) {
                var va = (TOURNAMENT_STATUSES[a.status] || a.status || '').toLowerCase();
                var vb = (TOURNAMENT_STATUSES[b.status] || b.status || '').toLowerCase();
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'date_start') {
            items.sort(function(a, b) {
                var va = a.date_start || '';
                var vb = b.date_start || '';
                return trnSortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (vb < va ? -1 : vb > va ? 1 : 0);
            });
        } else if (trnSortCol === 'date_end') {
            items.sort(function(a, b) {
                var va = a.date_end || '';
                var vb = b.date_end || '';
                return trnSortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (vb < va ? -1 : vb > va ? 1 : 0);
            });
        } else if (trnSortCol === 'participants') {
            items.sort(function(a, b) {
                var va = a.max_participants || 0;
                var vb = b.max_participants || 0;
                return trnSortAsc ? va - vb : vb - va;
            });
        }

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / TRN_PER_PAGE));
        if (trnPage > totalPages) trnPage = totalPages;
        var start = (trnPage - 1) * TRN_PER_PAGE;
        var pageItems = items.slice(start, start + TRN_PER_PAGE);

        renderTrnRows(pageItems);
        renderTrnPagination(items.length, totalPages);
    }

    // ---- Tournament Render Rows ----
    function renderTrnRows(items) {
        var table = document.getElementById('adTrnTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="8" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏆</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noTournaments + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noTournamentsText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(t) {
            var catObj = categoriesMap[t.category_id];
            var catLabel = catObj ? (catObj.gender === 'women' ? '♀ ' : '♂ ') + (isEn ? catObj.name_en : catObj.name) : (t.category_id || L.noData);
            var statusLabel = TOURNAMENT_STATUSES[t.status] || t.status || L.noData;
            var statusClass = 'ad-status-' + (t.status || '').replace(/_/g, '-');

            var dateStartStr = t.date_start
                ? new Date(t.date_start + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : L.noData;
            var dateEndStr = t.date_end
                ? new Date(t.date_end + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : '—';

            tbody.innerHTML +=
                '<tr data-trn-id="' + t.id + '">' +
                    bulkCheckboxTd(t.id) +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (t.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="text-align:center;"><span class="ad-status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td style="text-align:center;">' + dateStartStr + '</td>' +
                    '<td style="text-align:center;">' + dateEndStr + '</td>' +
                    '<td style="text-align:center;">' + (t.max_participants || L.noData) + '</td>' +
                    '<td>' + (t.bracket_type ? '<button class="ad-btn ad-btn-sm ad-btn-secondary ad-brk-btn" data-brk-id="' + t.id + '">' + L.bracketTab + '</button>' : '') + '</td>' +
                '</tr>';
        });

        // Click bracket button / row
        tbody.onclick = function(e) {
            var brkBtn = e.target.closest('.ad-brk-btn');
            if (brkBtn) {
                e.stopPropagation();
                renderBracketManagement(brkBtn.dataset.brkId);
                return;
            }
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-trn-id]');
            if (!row) return;
            loadAndEditTournament(row.dataset.trnId);
        };

        setupBulkDelete({ tableId: 'adTrnTable', tableName: 'tournaments', reloadFn: function() { loadTournamentsList(); } });
    }

    // ---- Tournament Pagination ----
    function renderTrnPagination(totalItems, totalPages) {
        var existing = document.getElementById('adTrnPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adTrnPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        html += '<button class="ad-crt-page-btn" data-page="' + (trnPage - 1) + '"' + (trnPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === trnPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="ad-crt-page-btn" data-page="' + (trnPage + 1) + '"' + (trnPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adTrnTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            trnPage = parseInt(btn.dataset.page, 10);
            applyTrnFilters();
        });
    }

    // ---- Tournament Column Dropdown ----
    function openTrnColDropdown(col, hdr) {
        var dd = document.getElementById('adTrnColDropdown');
        if (!dd) return;

        if (dd.style.display === 'block' && dd.dataset.col === col) {
            dd.style.display = 'none';
            return;
        }
        dd.dataset.col = col;

        var rect = hdr.getBoundingClientRect();
        var cardRect = dd.parentElement.getBoundingClientRect();
        dd.style.left = Math.max(0, rect.left - cardRect.left) + 'px';
        dd.style.top = (rect.bottom - cardRect.top + 4) + 'px';

        var colLabels = { title: L.trnTitle, category: L.trnCategory, status: L.trnStatus, date_start: L.trnDateStart, date_end: L.trnDateEnd, participants: L.trnMaxParticipants };
        var isNumeric = col === 'participants';
        var isDate = col === 'date_start' || col === 'date_end';

        var html = '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';

        if (isNumeric) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Most first' : '↓ Сначала больше') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Least first' : '↑ Сначала меньше') + '</div>';
        } else if (isDate) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Newest first' : '↓ Сначала новые') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Oldest first' : '↑ Сначала старые') + '</div>';
        } else {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ A → Z' : '↑ А → Я') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Z → A' : '↓ Я → А') + '</div>';
        }

        dd.innerHTML = html;
        dd.style.display = 'block';

        dd.querySelectorAll('.ad-col-dd-sort').forEach(function(el) {
            el.addEventListener('click', function(ev) {
                ev.stopPropagation();
                trnSortCol = col;
                trnSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateTrnColHeaders();
                applyTrnFilters();
            });
        });
    }

    // ---- Tournament Update Column Headers ----
    function updateTrnColHeaders() {
        var table = document.getElementById('adTrnTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = trnSortCol === c;
            hdr.classList.toggle('ad-col-active', isActive);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = trnSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
        });
    }

    async function loadAndEditTournament(id) {
        if (!client) return;
        var result = await client.from('tournaments').select('*').eq('id', id).single();
        if (result.data) {
            renderTournamentForm(result.data);
        }
    }

    // ---- Tournament Form ----
    function renderTournamentForm(item) {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        trnEditingId = item ? item.id : null;
        trnImageFile = null;
        trnImageUrl = (item && item.image) ? item.image : '';

        var title = item ? L.editTournament : L.addTournament;

        var imagePreviewHtml = trnImageUrl
            ? '<img src="' + esc(trnImageUrl) + '" class="ad-image-upload-preview" id="adTrnImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adTrnImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">🖼</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = trnImageUrl ? ' has-image' : '';

        // Category options (from Supabase)
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        cachedCategories.forEach(function(c) {
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        // Status options
        var statusOptionsHtml = '<option value="">' + L.selectStatus + '</option>';
        Object.keys(TOURNAMENT_STATUSES).forEach(function(key) {
            var selected = (item && item.status === key) ? ' selected' : '';
            statusOptionsHtml += '<option value="' + key + '"' + selected + '>' + TOURNAMENT_STATUSES[key] + '</option>';
        });

        // Tournament level options
        var trnLevelOptionsHtml = '<option value="">—</option>';
        cachedLevels.forEach(function(lv) {
            var selected = (item && item.level_id === lv.id) ? ' selected' : '';
            var name = isEn ? (lv.name_en || lv.name) : lv.name;
            trnLevelOptionsHtml += '<option value="' + lv.id + '"' + selected + '>' + name + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adTrnBack">' + L.back + '</button>' +
            '</div>' +

            // Image
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnImage + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adTrnImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adTrnImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adTrnImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (trnImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adTrnImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Title (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnTitle + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitle" placeholder="' + L.trnTitle + ' (RU)" value="' + esc(item ? item.title : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleEn" placeholder="' + L.trnTitle + ' (EN)" value="' + esc(item ? item.title_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adTrnTitle" data-target="adTrnTitleEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleKg" placeholder="' + L.trnTitle + ' (KG)" value="' + esc(item ? item.title_kg : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adTrnTitle" data-target="adTrnTitleKg" data-tolang="kg">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Description (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnDescription + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDesc" placeholder="' + L.trnDescription + ' (RU)">' + esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDescEn" placeholder="' + L.trnDescription + ' (EN)">' + esc(item ? item.description_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adTrnDesc" data-target="adTrnDescEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Location (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnLocation + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnLocation" placeholder="' + L.trnLocation + ' (RU)" value="' + esc(item ? item.location : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnLocationEn" placeholder="' + L.trnLocation + ' (EN)" value="' + esc(item ? item.location_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adTrnLocation" data-target="adTrnLocationEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Meta: category, status, format, max participants
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnCategory + '</label>' +
                        '<select class="ad-field-input" id="adTrnCat">' + catOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnStatus + '</label>' +
                        '<select class="ad-field-input" id="adTrnStatus">' + statusOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnFormat + '</label>' +
                        '<select class="ad-field-input" id="adTrnFormat">' +
                            '<option value="">' + L.selectFormat + '</option>' +
                            '<option value="singles"' + sel(item, 'format', 'singles') + '>' + L.formatSingles + '</option>' +
                            '<option value="doubles"' + sel(item, 'format', 'doubles') + '>' + L.formatDoubles + '</option>' +
                            '<option value="mixed_doubles"' + sel(item, 'format', 'mixed_doubles') + '>' + L.formatMixedDoubles + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnDateStart + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnDateStart" value="' + (item ? (item.date_start || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnDateEnd + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnDateEnd" value="' + (item ? (item.date_end || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnMaxParticipants + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnMaxPart" min="0" value="' + (item ? (item.max_participants || '') : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnPrizeFund + '</label>' +
                        '<input type="text" class="ad-field-input" id="adTrnPrize" placeholder="100,000 сом" value="' + esc(item ? item.prize_fund : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.ratTournamentLevel + '</label>' +
                        '<select class="ad-field-input" id="adTrnLevel">' + trnLevelOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field"></div>' +
                '</div>' +
            '</div>' +

            // Bracket settings
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnBracketType + '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnBracketType + '</label>' +
                        '<select class="ad-field-input" id="adTrnBracketType">' +
                            '<option value="">' + L.selectBracketType + '</option>' +
                            '<option value="single_elimination"' + sel(item, 'bracket_type', 'single_elimination') + '>' + L.bracketSE + '</option>' +
                            '<option value="round_robin"' + sel(item, 'bracket_type', 'round_robin') + '>' + L.bracketRR + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnDrawSize + '</label>' +
                        '<select class="ad-field-input" id="adTrnDrawSize">' +
                            '<option value="">' + L.selectDrawSize + '</option>' +
                            '<option value="8"' + (item && +item.draw_size === 8 ? ' selected' : '') + '>8</option>' +
                            '<option value="16"' + (item && +item.draw_size === 16 ? ' selected' : '') + '>16</option>' +
                            '<option value="32"' + (item && +item.draw_size === 32 ? ' selected' : '') + '>32</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnRegDeadline + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnRegDeadline" value="' + (item ? (item.registration_deadline || '') : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnCourtCount + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnCourtCount" min="1" max="10" value="' + (item ? (item.court_count || 2) : 2) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnMatchDuration + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnMatchDuration" min="30" max="180" value="' + (item ? (item.match_duration || 90) : 90) + '">' +
                    '</div>' +
                    '<div class="ad-field"></div>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adTrnSave">' + L.save + '</button>' +
                (trnEditingId && item && item.bracket_type ? '<button class="ad-btn ad-btn-secondary" id="adTrnBracket">' + L.bracketTab + '</button>' : '') +
                (trnEditingId ? '<button class="ad-btn ad-btn-danger" id="adTrnDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back
        document.getElementById('adTrnBack').addEventListener('click', function() {
            renderTournamentsList();
        });

        // Lang tabs (delegate)
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });
        });

        // Translate buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate');
            if (!btn) return;
            var srcId = btn.dataset.src;
            var targetId = btn.dataset.target;
            var toLang = btn.dataset.tolang;
            var srcEl = document.getElementById(srcId);
            var targetEl = document.getElementById(targetId);
            if (!srcEl || !targetEl) return;

            var srcText = srcEl.value.trim();
            if (!srcText) {
                showToast(L.fillRuFirst, 'error');
                return;
            }

            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;

            translateFromRu(srcText, toLang).then(function(result) {
                targetEl.value = result;
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Image upload zone
        var imgZone = document.getElementById('adTrnImgZone');
        var imgInput = document.getElementById('adTrnImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                trnImageFile = imgInput.files[0];
                previewTrnImage(URL.createObjectURL(trnImageFile));
            }
        });

        // Drag & drop
        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                trnImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewTrnImage(URL.createObjectURL(trnImageFile));
            }
        });

        // Remove image
        setupTrnImgRemove();

        // URL apply
        document.getElementById('adTrnImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adTrnImgUrl').value.trim();
            if (url) {
                trnImageFile = null;
                trnImageUrl = url;
                previewTrnImage(url);
            }
        });

        // Save
        document.getElementById('adTrnSave').addEventListener('click', saveTournamentHandler);

        // Bracket management
        var brkBtn = document.getElementById('adTrnBracket');
        if (brkBtn) {
            brkBtn.addEventListener('click', function() {
                renderBracketManagement(trnEditingId);
            });
        }

        // Delete
        var delBtn = document.getElementById('adTrnDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.trnDeleteConfirm, L.deleteConfirmText, function() {
                    deleteTournamentHandler();
                });
            });
        }
    }

    function previewTrnImage(src) {
        var zone = document.getElementById('adTrnImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + esc(src) + '" class="ad-image-upload-preview" id="adTrnImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adTrnImgRemove">&times;</button>';
        setupTrnImgRemove();
    }

    function setupTrnImgRemove() {
        var rmBtn = document.getElementById('adTrnImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                trnImageFile = null;
                trnImageUrl = '';
                var zone = document.getElementById('adTrnImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">🖼</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adTrnImgUrl').value = '';
                document.getElementById('adTrnImgInput').value = '';
            });
        }
    }

    // ---- Save Tournament ----
    async function saveTournamentHandler() {
        var saveBtn = document.getElementById('adTrnSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            var imageUrl = trnImageUrl;
            if (trnImageFile) {
                imageUrl = await uploadTournamentImage(trnImageFile);
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            var maxPart = document.getElementById('adTrnMaxPart').value;

            var data = {
                title: document.getElementById('adTrnTitle').value.trim(),
                title_en: document.getElementById('adTrnTitleEn').value.trim(),
                title_kg: document.getElementById('adTrnTitleKg').value.trim(),
                description: document.getElementById('adTrnDesc').value.trim(),
                description_en: document.getElementById('adTrnDescEn').value.trim(),
                location: document.getElementById('adTrnLocation').value.trim(),
                location_en: document.getElementById('adTrnLocationEn').value.trim(),
                category_id: document.getElementById('adTrnCat').value,
                status: document.getElementById('adTrnStatus').value,
                date_start: document.getElementById('adTrnDateStart').value || null,
                date_end: document.getElementById('adTrnDateEnd').value || null,
                max_participants: maxPart ? parseInt(maxPart, 10) : null,
                prize_fund: document.getElementById('adTrnPrize').value.trim() || null,
                image: imageUrl || null,
                format: document.getElementById('adTrnFormat').value || 'singles',
                level_id: document.getElementById('adTrnLevel').value || null,
                bracket_type: document.getElementById('adTrnBracketType').value || null,
                draw_size: (function() { var v = document.getElementById('adTrnDrawSize').value; return v ? parseInt(v, 10) : null; })(),
                court_count: parseInt(document.getElementById('adTrnCourtCount').value, 10) || 2,
                match_duration: parseInt(document.getElementById('adTrnMatchDuration').value, 10) || 90,
                registration_deadline: document.getElementById('adTrnRegDeadline').value || null
            };

            if (!data.title) {
                showToast(isEn ? 'Title is required' : 'Название обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (trnEditingId) {
                result = await client.from('tournaments').update(data).eq('id', trnEditingId);
            } else {
                data.id = crypto.randomUUID();
                result = await client.from('tournaments').insert(data);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            showToast(L.saved, 'success');
            renderTournamentsList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Tournament ----
    async function deleteTournamentHandler() {
        if (!trnEditingId) return;
        var result = await client.from('tournaments').delete().eq('id', trnEditingId);
        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }
        showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderTournamentsList();
    }

    // ---- Upload Tournament Image ----
    async function uploadTournamentImage(file) {
        if (!client || !file) return null;

        var ext = file.name.split('.').pop().toLowerCase();
        var filename = 'trn-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;

        try {
            var result = await client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (result.error) {
                showToast('Storage: ' + (result.error.message || result.error.statusCode || JSON.stringify(result.error)), 'error');
                return null;
            }

            var urlResult = client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    // ============================================
    // BRACKET MANAGEMENT (Draw, Registrations, Score Entry)
    // ============================================

    // Round mapping: round_number → round_reached key for points
    var ROUND_TO_KEY = {};
    // Will be populated dynamically based on draw_size

    function getRoundKey(roundNumber, totalRounds) {
        // For losers: roundsFromEnd = which round they lost in
        // Lost in Final → F, Lost in SF → SF, Lost in QF → QF, etc.
        var roundsFromEnd = totalRounds - roundNumber;
        if (roundsFromEnd === 0) return 'F';   // lost in Final
        if (roundsFromEnd === 1) return 'SF';  // lost in Semifinal
        if (roundsFromEnd === 2) return 'QF';  // lost in Quarterfinal
        if (roundsFromEnd === 3) return 'R16';
        if (roundsFromEnd === 4) return 'R32';
        return 'R32';
    }

    // Round names for bracket display
    function getRoundName(roundNum, totalRounds, drawSize) {
        var roundsFromEnd = totalRounds - roundNum;
        if (roundsFromEnd === 0) return L.roundF;
        if (roundsFromEnd === 1) return L.roundSF;
        if (roundsFromEnd === 2) return L.roundQF;
        if (roundsFromEnd === 3) return L.roundR16;
        if (roundsFromEnd === 4) return isEn ? 'Round of 32' : '1/16 финала';
        return isEn ? 'Round ' + roundNum : 'Раунд ' + roundNum;
    }

    // ---- Render Bracket Management View ----
    // Called after saving a tournament that has bracket_type set, or from edit view
    async function renderBracketManagement(tournamentId) {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        // Ensure levels are loaded for results display
        await loadTournamentLevels();

        // Load tournament
        var tRes = await client.from('tournaments').select('*').eq('id', tournamentId).single();
        if (tRes.error || !tRes.data) {
            showToast(tRes.error ? tRes.error.message : 'Tournament not found', 'error');
            return;
        }
        var tournament = tRes.data;

        // Load registrations
        var regRes = await client.from('tournament_registrations')
            .select('*, players(id, name, name_en, points, category_id)')
            .eq('tournament_id', tournamentId)
            .order('registered_at', { ascending: true });
        var registrations = regRes.data || [];

        // Load matches
        var matchRes = await client.from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: true })
            .order('match_order', { ascending: true });
        var matches = matchRes.data || [];

        // Load players map for display
        var playerIds = [];
        registrations.forEach(function(r) { if (r.player_id) playerIds.push(r.player_id); });
        matches.forEach(function(m) {
            if (m.player1_id) playerIds.push(m.player1_id);
            if (m.player2_id) playerIds.push(m.player2_id);
            if (m.winner_id) playerIds.push(m.winner_id);
        });
        playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        var playersMap = {};
        if (playerIds.length > 0) {
            var plRes = await client.from('players').select('id, name, name_en, points').in('id', playerIds);
            (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });
        }

        var hasMatches = matches.length > 0;
        var isRegOpen = tournament.status === 'registration_open';
        var canGenerate = !hasMatches && registrations.filter(function(r) { return r.status === 'approved'; }).length >= 2;
        var allCompleted = hasMatches && matches.every(function(m) { return m.status === 'completed'; });
        var isTournamentCompleted = tournament.status === 'completed';

        // Load tournament_results if completed
        var tournamentResults = [];
        if (isTournamentCompleted) {
            var trRes = await client.from('tournament_results')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('points_earned', { ascending: false });
            tournamentResults = trRes.data || [];
        }

        // Build tabs
        var activeTab = isTournamentCompleted ? 'results' : (hasMatches ? 'bracket' : 'registrations');

        var html = '<div class="ad-section-header">' +
            '<h2 class="ad-section-title">' + esc(isEn ? (tournament.title_en || tournament.title) : tournament.title) + ' — ' + L.bracketTab + '</h2>' +
            '<button class="ad-btn ad-btn-secondary" id="adBrkBack">' + L.back + '</button>' +
        '</div>';

        // Tab buttons
        html += '<div class="ad-tabs" style="margin-bottom:16px;">' +
            '<button class="ad-tab' + (activeTab === 'registrations' ? ' active' : '') + '" data-brk-tab="registrations">' + L.registrationsTab +
                ' <span class="ad-badge">' + registrations.filter(function(r) { return r.status === 'approved'; }).length +
                '/' + (tournament.draw_size || tournament.max_participants || '?') + '</span>' +
            '</button>' +
            '<button class="ad-tab' + (activeTab === 'bracket' ? ' active' : '') + '" data-brk-tab="bracket">' + L.bracketTab + '</button>' +
            (isTournamentCompleted
                ? '<button class="ad-tab' + (activeTab === 'results' ? ' active' : '') + '" data-brk-tab="results">' + L.resultsTab + '</button>'
                : '') +
        '</div>';

        // Registrations panel
        html += '<div class="ad-brk-panel" id="adBrkRegPanel" style="' + (activeTab !== 'registrations' ? 'display:none;' : '') + '">';
        html += renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate);
        html += '</div>';

        // Bracket panel
        html += '<div class="ad-brk-panel" id="adBrkBracketPanel" style="' + (activeTab !== 'bracket' ? 'display:none;' : '') + '">';
        if (hasMatches) {
            html += renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted);
        } else {
            html += '<div class="ad-empty-state"><p>' + (isEn ? 'No bracket generated yet. Approve registrations and generate draw.' : 'Сетка ещё не сгенерирована. Одобрите заявки и сгенерируйте жеребьёвку.') + '</p></div>';
        }
        html += '</div>';

        // Results panel (only for completed tournaments)
        if (isTournamentCompleted) {
            html += '<div class="ad-brk-panel" id="adBrkResultsPanel" style="' + (activeTab !== 'results' ? 'display:none;' : '') + '">';
            html += renderResultsPanel(tournament, tournamentResults, playersMap, matches);
            html += '</div>';
        }

        container.innerHTML = html;

        // Tab switching
        container.querySelectorAll('[data-brk-tab]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                container.querySelectorAll('.ad-tab').forEach(function(t) { t.classList.remove('active'); });
                btn.classList.add('active');
                var tab = btn.dataset.brkTab;
                document.getElementById('adBrkRegPanel').style.display = tab === 'registrations' ? '' : 'none';
                document.getElementById('adBrkBracketPanel').style.display = tab === 'bracket' ? '' : 'none';
                var resPanel = document.getElementById('adBrkResultsPanel');
                if (resPanel) resPanel.style.display = tab === 'results' ? '' : 'none';
            });
        });

        // Back button
        document.getElementById('adBrkBack').addEventListener('click', function() {
            renderTournamentsList();
        });

        // Registration action buttons
        container.querySelectorAll('[data-reg-action]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                var action = btn.dataset.regAction;
                var newStatus = action === 'approve' ? 'approved' : 'rejected';
                var res = await client.from('tournament_registrations').update({ status: newStatus }).eq('id', regId);
                if (res.error) { showToast(res.error.message, 'error'); return; }
                renderBracketManagement(tournamentId);
            });
        });

        // Generate draw button
        var genBtn = document.getElementById('adBrkGenerateDraw');
        if (genBtn) {
            genBtn.addEventListener('click', function() {
                showConfirm(L.generateDrawConfirm, '', async function() {
                    await generateBracketDraw(tournament, registrations, playersMap);
                    renderBracketManagement(tournamentId);
                }, L.generateDraw);
            });
        }

        // Score entry buttons
        container.querySelectorAll('[data-match-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var matchId = btn.dataset.matchEdit;
                var match = matches.find(function(m) { return m.id === matchId; });
                if (match) openScoreModal(match, playersMap, tournamentId);
            });
        });

        // Finalize button
        var finBtn = document.getElementById('adBrkFinalize');
        if (finBtn) {
            finBtn.addEventListener('click', function() {
                showConfirm(L.finalizeConfirm, '', async function() {
                    await finalizeTournament(tournament, matches, playersMap);
                    renderBracketManagement(tournamentId);
                }, L.finalizeTournament);
            });
        }

        // Recalculate points button (for completed tournaments)
        var recalcBtn = document.getElementById('adBrkRecalc');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', async function() {
                recalcBtn.disabled = true;
                recalcBtn.textContent = isEn ? 'Recalculating...' : 'Пересчёт...';
                // Reload fresh matches from DB before recalculating
                var freshRes = await client.from('matches').select('*')
                    .eq('tournament_id', tournamentId)
                    .order('round_number', { ascending: true })
                    .order('match_order', { ascending: true });
                var freshMatches = freshRes.data || matches;
                await finalizeTournament(tournament, freshMatches, playersMap);
                renderBracketManagement(tournamentId);
            });
        }
    }

    // ---- Registrations Panel HTML ----
    function renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate) {
        var html = '';
        if (registrations.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.noRegistrations + '</p></div>';
        } else {
            html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                '<th>#</th><th>' + L.plrName + '</th><th>' + L.plrPoints + '</th><th>' + (isEn ? 'Registered' : 'Подал заявку') + '</th><th>' + L.regStatus + '</th><th></th>' +
            '</tr></thead><tbody>';

            registrations.forEach(function(reg, idx) {
                var player = reg.players || playersMap[reg.player_id] || {};
                var pName = isEn ? (player.name_en || player.name || reg.player_id) : (player.name || reg.player_id);
                var statusClass = 'ad-status-' + reg.status;
                var statusLabel = reg.status === 'approved' ? L.regApproved :
                                  reg.status === 'rejected' ? L.regRejected :
                                  reg.status === 'withdrawn' ? L.regWithdrawn : L.regPending;
                var seedHtml = reg.seed_number ? ' <span class="ad-badge ad-badge-accent">[' + reg.seed_number + ']</span>' : '';

                // Format registration time
                var regTime = '';
                if (reg.registered_at) {
                    var d = new Date(reg.registered_at);
                    regTime = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' }) +
                        ' ' + d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit' });
                }

                html += '<tr>' +
                    '<td>' + (idx + 1) + '</td>' +
                    '<td>' + esc(pName) + seedHtml + '</td>' +
                    '<td>' + (player.points || 0) + '</td>' +
                    '<td style="font-size:0.8rem;color:var(--text-secondary);">' + regTime + '</td>' +
                    '<td><span class="ad-status ' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td>';

                if (reg.status === 'pending') {
                    html += '<button class="ad-btn ad-btn-sm ad-btn-primary" data-reg-action="approve" data-reg-id="' + reg.id + '">' + L.regApprove + '</button> ' +
                            '<button class="ad-btn ad-btn-sm ad-btn-danger" data-reg-action="reject" data-reg-id="' + reg.id + '">' + L.regReject + '</button>';
                }
                html += '</td></tr>';
            });
            html += '</tbody></table></div>';
        }

        // Generate draw button
        if (canGenerate && tournament.bracket_type) {
            var approvedCount = registrations.filter(function(r) { return r.status === 'approved'; }).length;
            var drawSize = tournament.draw_size || 16;
            html += '<div style="margin-top:16px;text-align:center;">' +
                '<p style="margin-bottom:8px;">' + approvedCount + ' ' + L.regCount + ' / ' + drawSize + '</p>' +
                '<button class="ad-btn ad-btn-primary" id="adBrkGenerateDraw">' + L.generateDraw + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- Bracket Panel HTML ----
    function renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var html = '';

        // Parse score into per-set arrays for each player
        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [] };
            var sets = score.split(' ');
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets };
        }

        // Visual bracket with connectors
        html += '<div class="ad-brk-scroll">' +
                '<div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = matches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = getRoundName(r, totalRounds, drawSize);

            // Round column
            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                var p1Name = p1 ? esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE');
                var p2Name = p2 ? esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE');

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match';
                if (isCompleted) matchClass += ' completed';
                if (match.status === 'live') matchClass += ' live';

                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';

                // Player 1 row
                var p1Class = 'ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : ''));
                html += '<div class="' + p1Class + '">' +
                    (match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p1Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';

                // Player 2 row
                var p2Class = 'ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : ''));
                html += '<div class="' + p2Class + '">' +
                    (match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p2Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';

                // Edit score button
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }

                html += '</div>'; // /ad-brk-match
            });

            html += '</div>'; // /ad-brk-matches

            // If this is the final round, add 3rd place match below the final in same column
            if (r === totalRounds) {
                var thirdMatch = matches.find(function(m) { return m.round === '3RD'; });
                if (thirdMatch) {
                    var tp1 = playersMap[thirdMatch.player1_id];
                    var tp2 = playersMap[thirdMatch.player2_id];
                    var tp1Name = tp1 ? esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
                    var tp2Name = tp2 ? esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
                    var tCompleted = thirdMatch.status === 'completed';
                    var tBye = thirdMatch.score === 'BYE';
                    var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
                    var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
                    var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && !tBye;
                    var tSetData = parseSets(thirdMatch.score);
                    var tMatchClass = 'ad-brk-match' + (tCompleted ? ' completed' : '') + (thirdMatch.status === 'live' ? ' live' : '');

                    html += '<div class="ad-brk-third-sep" style="margin-top:24px;border-top:1px solid var(--border);padding-top:12px;">' +
                        '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>' +
                    '</div>' +
                    '<div class="' + tMatchClass + '">' +
                        '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                            (thirdMatch.seed1 ? '<span class="ad-brk-seed">[' + thirdMatch.seed1 + ']</span>' : '') +
                            '<span class="ad-brk-name">' + tp1Name + '</span>' +
                            '<span class="ad-brk-sets">';
                    tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                    html += '</span></div>' +
                        '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                            (thirdMatch.seed2 ? '<span class="ad-brk-seed">[' + thirdMatch.seed2 + ']</span>' : '') +
                            '<span class="ad-brk-name">' + tp2Name + '</span>' +
                            '<span class="ad-brk-sets">';
                    tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                    html += '</span></div>';

                    if (tCanEdit) {
                        html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                            (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                    }
                    html += '</div>'; // /ad-brk-match
                }
            }

            html += '</div>'; // /ad-brk-round

            // Connector column between rounds (not after last round)
            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                for (var i = 0; i < pairCount; i++) {
                    html += '<div class="ad-brk-conn-pair">' +
                        '<div class="ad-brk-conn-top"></div>' +
                        '<div class="ad-brk-conn-mid"></div>' +
                        '<div class="ad-brk-conn-bottom"></div>' +
                    '</div>';
                }
                html += '</div>';
            }
        }

        html += '</div>'; // /ad-brk-grid
        html += '</div>'; // /ad-brk-scroll

        // Finalize button
        if (allCompleted && !isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>' +
            '</div>';
        }

        if (isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<span style="color:var(--accent);font-weight:600;">' + (isEn ? 'Tournament completed.' : 'Турнир завершён.') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" id="adBrkRecalc">' + (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- Results Panel (points summary) ----
    function renderResultsPanel(tournament, results, playersMap, matches) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);

        // Round labels for display
        var roundLabels = isEn
            ? { W: 'Winner', F: 'Finalist', '3RD': '3rd Place', '4TH': '4th Place', SF: 'Semifinal', QF: 'Quarterfinal', R16: 'Round of 16', R32: 'Round of 32' }
            : { W: 'Победитель', F: 'Финалист', '3RD': '3-е место', '4TH': '4-е место', SF: 'Полуфинал', QF: 'Четвертьфинал', R16: '1/8 финала', R32: '1/32 финала' };

        // Sort results: W first, then F, 3RD, 4TH, QF, etc. then by points
        var roundOrder = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 5, QF: 6, R16: 7, R32: 8 };
        results.sort(function(a, b) {
            var orderA = roundOrder[a.round_reached] || 99;
            var orderB = roundOrder[b.round_reached] || 99;
            if (orderA !== orderB) return orderA - orderB;
            return (b.points_earned || 0) - (a.points_earned || 0);
        });

        var totalPoints = 0;
        results.forEach(function(r) { totalPoints += r.points_earned || 0; });

        var html = '';

        // Summary header
        html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + L.resTotalPlayers + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + results.length + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Total Points Distributed' : 'Всего очков распределено') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--accent);">' + totalPoints + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Tournament Level' : 'Уровень турнира') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + (function() {
                    if (!tournament.level_id) return '—';
                    var lv = cachedLevels.find(function(l) { return l.id === tournament.level_id; });
                    return lv ? esc(isEn ? (lv.name_en || lv.name) : lv.name) : '—';
                })() + '</div>' +
            '</div>' +
        '</div>';

        // Results table
        html += '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table">' +
            '<thead><tr>' +
                '<th style="width:50px;">' + L.resPlace + '</th>' +
                '<th>' + L.resPlayer + '</th>' +
                '<th>' + L.resRound + '</th>' +
                '<th style="text-align:right;">' + L.resPoints + '</th>' +
            '</tr></thead><tbody>';

        // Place mapping: W=1, F=2, 3RD=3, 4TH=4, SF=3(fallback), QF=5, R16=9, R32=17
        var placeByRound = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 3, QF: 5, R16: 9, R32: 17 };

        results.forEach(function(r, idx) {
            var place = placeByRound[r.round_reached] || (idx + 1);

            var p = playersMap[r.player_id] || {};
            var pName = isEn ? (p.name_en || p.name || r.player_id) : (p.name || r.player_id);
            var roundLabel = roundLabels[r.round_reached] || r.round_reached;
            var isWinner = r.round_reached === 'W';
            var isFinalist = r.round_reached === 'F';

            var medal = '';
            if (place === 1) medal = '<span style="margin-right:4px;">🥇</span>';
            else if (place === 2) medal = '<span style="margin-right:4px;">🥈</span>';
            else if (place === 3) medal = '<span style="margin-right:4px;">🥉</span>';

            html += '<tr style="' + (isWinner ? 'background:rgba(204,255,0,0.08);' : '') + '">' +
                '<td style="font-weight:600;text-align:center;">' + medal + place + '</td>' +
                '<td style="' + (isWinner ? 'font-weight:700;color:var(--accent);' : (isFinalist ? 'font-weight:600;' : '')) + '">' + esc(pName) + '</td>' +
                '<td>' + roundLabel + '</td>' +
                '<td style="text-align:right;font-weight:700;color:var(--accent);font-size:1.1rem;">' + (r.points_earned || 0) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div></div>';

        return html;
    }

    // ---- Generate Bracket Draw ----
    async function generateBracketDraw(tournament, registrations, playersMap) {
        var drawSize = tournament.draw_size || 16;
        var bracketType = tournament.bracket_type || 'single_elimination';
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;

        // Get approved registrations
        var approved = registrations.filter(function(r) { return r.status === 'approved'; });
        if (approved.length < 2) {
            showToast(isEn ? 'Need at least 2 approved players' : 'Нужно минимум 2 одобренных игрока', 'error');
            return;
        }

        // Sort by points DESC (seeded first)
        approved.sort(function(a, b) {
            var pA = (a.players ? a.players.points : 0) || 0;
            var pB = (b.players ? b.players.points : 0) || 0;
            return pB - pA;
        });

        // Determine seed count
        var seedCount = 0;
        if (bracketType === 'single_elimination') {
            seedCount = drawSize >= 32 ? 8 : (drawSize >= 16 ? 4 : 2);
            seedCount = Math.min(seedCount, approved.length);
        }

        // Seed positions from SEED_POSITIONS (global from tournament-generator.js)
        var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
            ? SEED_POSITIONS[drawSize]
            : (drawSize === 8 ? [1, 8, 5, 4] : [1, 16, 9, 8]);

        // Build draw array
        var draw = new Array(drawSize);
        for (var i = 0; i < drawSize; i++) draw[i] = null;

        // Place seeded players
        for (var s = 0; s < seedCount && s < seedPositions.length; s++) {
            draw[seedPositions[s] - 1] = {
                player_id: approved[s].player_id,
                seed: s + 1,
                reg_id: approved[s].id
            };
        }

        // Fisher-Yates shuffle for unseeded
        var unseeded = approved.slice(seedCount);
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Fill empty slots
        var emptySlots = [];
        for (var i = 0; i < drawSize; i++) {
            if (draw[i] === null) emptySlots.push(i);
        }
        for (var i = 0; i < unseeded.length && i < emptySlots.length; i++) {
            draw[emptySlots[i]] = {
                player_id: unseeded[i].player_id,
                seed: null,
                reg_id: unseeded[i].id
            };
        }

        // Generate matches
        var totalRounds = Math.log2(drawSize);
        var matchesToInsert = [];

        // First round
        var matchOrder = 0;
        for (var i = 0; i < drawSize; i += 2) {
            matchOrder++;
            var slot1 = draw[i];
            var slot2 = draw[i + 1];

            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: 'R1',
                round_number: 1,
                match_order: matchOrder,
                status: 'upcoming',
                seed1: slot1 ? slot1.seed : null,
                seed2: slot2 ? slot2.seed : null
            });
        }

        // Subsequent rounds (empty)
        for (var r = 2; r <= totalRounds; r++) {
            var matchesInRound = drawSize / Math.pow(2, r);
            for (var m = 1; m <= matchesInRound; m++) {
                var roundPrefix = r === totalRounds ? 'F' :
                                  r === totalRounds - 1 ? 'SF' :
                                  r === totalRounds - 2 ? 'QF' : 'R' + r;
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null,
                    player2_id: null,
                    round: roundPrefix,
                    round_number: r,
                    match_order: m,
                    status: 'upcoming',
                    seed1: null,
                    seed2: null
                });
            }
        }

        // 3rd place match (between SF losers)
        matchesToInsert.push({
            tournament_id: tournament.id,
            player1_id: null,
            player2_id: null,
            round: '3RD',
            round_number: totalRounds,
            match_order: 0,
            status: 'upcoming',
            seed1: null,
            seed2: null
        });

        // Handle BYEs in first round: if one player is null, auto-advance
        for (var i = 0; i < matchesToInsert.length; i++) {
            var match = matchesToInsert[i];
            if (match.round_number !== 1) continue;

            if (match.player1_id && !match.player2_id) {
                match.winner_id = match.player1_id;
                match.status = 'completed';
                match.score = 'BYE';
            } else if (!match.player1_id && match.player2_id) {
                match.winner_id = match.player2_id;
                match.status = 'completed';
                match.score = 'BYE';
            }
        }

        // Insert matches into DB
        var insertRes = await client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            showToast(insertRes.error.message, 'error');
            return;
        }

        // Auto-advance BYE winners to round 2
        var r1Matches = matchesToInsert.filter(function(m) { return m.round_number === 1; });
        var r2Matches = matchesToInsert.filter(function(m) { return m.round_number === 2; });

        // We need the actual inserted match IDs to update round 2
        // Re-fetch matches from DB
        var freshRes = await client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var freshMatches = freshRes.data || [];

        // Advance BYE winners
        var r1Fresh = freshMatches.filter(function(m) { return m.round_number === 1; });
        var r2Fresh = freshMatches.filter(function(m) { return m.round_number === 2; });

        for (var i = 0; i < r1Fresh.length; i++) {
            var m = r1Fresh[i];
            if (m.winner_id && m.score === 'BYE') {
                // Match i in R1 → goes to match ceil((i+1)/2) in R2, slot depends on odd/even
                var nextMatchIdx = Math.floor(i / 2);
                if (nextMatchIdx < r2Fresh.length) {
                    var nextMatch = r2Fresh[nextMatchIdx];
                    var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                    var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                    var updateData = {};
                    updateData[updateField] = m.winner_id;
                    updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                    await client.from('matches').update(updateData).eq('id', nextMatch.id);
                }
            }
        }

        // Update tournament_registrations with seed_number and draw_position
        for (var i = 0; i < drawSize; i++) {
            if (draw[i]) {
                await client.from('tournament_registrations').update({
                    seed_number: draw[i].seed,
                    draw_position: i + 1
                }).eq('id', draw[i].reg_id);
            }
        }

        // Update tournament status
        await client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        showToast(L.drawGenerated, 'success');
    }

    // ---- Score Entry Modal ----
    // Tennis score validation
    function isValidSet(a, b) {
        a = parseInt(a); b = parseInt(b);
        if (isNaN(a) || isNaN(b)) return false;
        if (a < 0 || b < 0 || a > 7 || b > 7) return false;
        // Normal win: 6-0..6-4
        if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
        // 7-5
        if ((a === 7 && b === 5) || (b === 7 && a === 5)) return true;
        // Tiebreak: 7-6
        if ((a === 7 && b === 6) || (b === 7 && a === 6)) return true;
        return false;
    }

    function formatScoreDisplay(score) {
        if (!score || score === 'BYE') return score || '';
        return score.split(' ').map(function(set) {
            var p = set.split('/');
            return p[0] + ':' + (p[1] || '0');
        }).join('  ');
    }

    function openScoreModal(match, playersMap, tournamentId) {
        var p1 = playersMap[match.player1_id] || {};
        var p2 = playersMap[match.player2_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        // Parse existing score: "6/4 7/6(11-9) 6/3" → sets + tiebreaks
        var existingSets = (match.score && match.score !== 'BYE') ? match.score.split(' ') : [];
        var sv = [['','','',''],['','','',''],['','','','']];
        for (var i = 0; i < 3; i++) {
            if (existingSets[i]) {
                var tbMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (tbMatch) {
                    sv[i] = [tbMatch[1], tbMatch[2], tbMatch[3] || '', tbMatch[4] || ''];
                } else {
                    var oldMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)\))?$/);
                    if (oldMatch) {
                        sv[i] = [oldMatch[1], oldMatch[2], '', oldMatch[3] || ''];
                    }
                }
            }
        }

        // Determine initial visible sets count from existing data
        var visibleSets = 1;
        if (existingSets.length >= 3) visibleSets = 3;
        else if (existingSets.length === 2) visibleSets = 2;

        function setRowHtml(setNum, vals) {
            var id1 = 'adS' + setNum + 'P1';
            var id2 = 'adS' + setNum + 'P2';
            var idTB1 = 'adS' + setNum + 'TB1';
            var idTB2 = 'adS' + setNum + 'TB2';
            return '<div class="ad-score-set-row" data-set="' + setNum + '" id="adSetRow' + setNum + '">' +
                '<label class="ad-field-label" style="min-width:40px;">Set ' + setNum + '</label>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id1 + '" value="' + vals[0] + '">' +
                '<span style="font-weight:600;">:</span>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id2 + '" value="' + vals[1] + '">' +
                '<span class="ad-tb-wrap" id="' + idTB1 + 'Wrap" style="display:none;">' +
                    '<span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">TB</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB1 + '" value="' + vals[2] + '">' +
                    '<span style="font-weight:600;font-size:11px;">:</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB2 + '" value="' + vals[3] + '">' +
                '</span>' +
            '</div>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.enterScore + '</h3>' +
                    '<button class="ad-modal-close" id="adScoreClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="text-align:center;margin-bottom:16px;">' +
                        '<div style="font-weight:600;">' + esc(p1Name) + (match.seed1 ? ' <span style="color:var(--accent);font-size:11px;">[' + match.seed1 + ']</span>' : '') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:12px;margin:4px 0;">' + L.vsLabel + '</div>' +
                        '<div style="font-weight:600;">' + esc(p2Name) + (match.seed2 ? ' <span style="color:var(--accent);font-size:11px;">[' + match.seed2 + ']</span>' : '') + '</div>' +
                    '</div>' +
                    '<div id="adSetsContainer">' +
                        setRowHtml(1, sv[0]) +
                        setRowHtml(2, sv[1]) +
                        setRowHtml(3, sv[2]) +
                    '</div>' +
                    '<div id="adSetButtons" style="display:flex;gap:8px;justify-content:center;margin-top:8px;">' +
                        '<button class="ad-btn ad-btn-secondary" id="adAddSet" style="font-size:0.8rem;padding:4px 12px;">' + L.addSet + '</button>' +
                        '<button class="ad-btn ad-btn-secondary" id="adRemoveSet" style="font-size:0.8rem;padding:4px 12px;">' + L.removeSet + '</button>' +
                    '</div>' +
                    '<div style="margin-top:12px;text-align:center;">' +
                        '<label class="ad-field-label">' + L.matchWinner + '</label>' +
                        '<div id="adWinnerDisplay" style="padding:8px;font-size:0.95rem;"></div>' +
                        '<input type="hidden" id="adScoreWinner" value="' + (match.winner_id || '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-primary" id="adScoreSave">' + L.saveScore + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var currentSets = visibleSets;

        function updateSetsVisibility() {
            for (var s = 1; s <= 3; s++) {
                var row = document.getElementById('adSetRow' + s);
                if (row) row.style.display = s <= currentSets ? '' : 'none';
            }
            document.getElementById('adAddSet').style.display = currentSets < 3 ? '' : 'none';
            document.getElementById('adRemoveSet').style.display = currentSets > 1 ? '' : 'none';
            // Clear hidden sets
            for (var s = currentSets + 1; s <= 3; s++) {
                var p1Input = document.getElementById('adS' + s + 'P1');
                var p2Input = document.getElementById('adS' + s + 'P2');
                var tb1Input = document.getElementById('adS' + s + 'TB1');
                var tb2Input = document.getElementById('adS' + s + 'TB2');
                if (p1Input) p1Input.value = '';
                if (p2Input) p2Input.value = '';
                if (tb1Input) tb1Input.value = '';
                if (tb2Input) tb2Input.value = '';
            }
            updateState();
        }

        document.getElementById('adAddSet').addEventListener('click', function() {
            if (currentSets < 3) { currentSets++; updateSetsVisibility(); }
        });
        document.getElementById('adRemoveSet').addEventListener('click', function() {
            if (currentSets > 1) { currentSets--; updateSetsVisibility(); }
        });

        // Show/hide tiebreak inputs when 7:6 or 6:7
        function checkTiebreaks() {
            for (var s = 1; s <= 3; s++) {
                var p1El = document.getElementById('adS' + s + 'P1');
                var p2El = document.getElementById('adS' + s + 'P2');
                if (!p1El || !p2El) continue;
                var v1 = parseInt(p1El.value) || 0;
                var v2 = parseInt(p2El.value) || 0;
                var tbWrap = document.getElementById('adS' + s + 'TB1Wrap');
                if (tbWrap) {
                    tbWrap.style.display = ((v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7)) ? 'inline-flex' : 'none';
                }
            }
        }

        function updateState() {
            checkTiebreaks();

            var p1Sets = 0, p2Sets = 0;
            for (var s = 1; s <= currentSets; s++) {
                var v1 = parseInt(document.getElementById('adS' + s + 'P1').value) || 0;
                var v2 = parseInt(document.getElementById('adS' + s + 'P2').value) || 0;
                if (v1 > v2) p1Sets++; else if (v2 > v1) p2Sets++;
            }

            // Winner logic based on number of visible sets
            var winnerId = '';
            var winnerDisplay = document.getElementById('adWinnerDisplay');
            var neededToWin = currentSets === 1 ? 1 : 2;

            if (p1Sets >= neededToWin) {
                winnerId = match.player1_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + esc(p1Name) + '</span>';
            } else if (p2Sets >= neededToWin) {
                winnerId = match.player2_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + esc(p2Name) + '</span>';
            } else {
                var totalPlayed = p1Sets + p2Sets;
                var label = totalPlayed > 0 ? (p1Sets + ':' + p2Sets) : (isEn ? 'Enter score' : 'Введите счёт');
                winnerDisplay.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem;">' + label + '</span>';
            }
            document.getElementById('adScoreWinner').value = winnerId;
        }

        function bindInputEvents() {
            overlay.querySelectorAll('.ad-set-game').forEach(function(input) {
                input.removeEventListener('input', input._handler);
                input._handler = function() {
                    var v = input.value.replace(/[^0-7]/g, '');
                    if (v.length > 1) v = v.charAt(v.length - 1);
                    input.value = v;
                    updateState();
                    if (v.length === 1) {
                        var allInputs = Array.from(overlay.querySelectorAll('.ad-set-game:not([style*="display: none"] *), .ad-tb-input'));
                        var visibleInputs = allInputs.filter(function(el) { return el.offsetParent !== null; });
                        var idx = visibleInputs.indexOf(input);
                        if (idx >= 0 && idx < visibleInputs.length - 1) visibleInputs[idx + 1].focus();
                    }
                };
                input.addEventListener('input', input._handler);
            });
            overlay.querySelectorAll('.ad-tb-input').forEach(function(input) {
                input.removeEventListener('input', input._tbHandler);
                input._tbHandler = function() {
                    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 2);
                    updateState();
                };
                input.addEventListener('input', input._tbHandler);
            });
        }

        bindInputEvents();
        updateSetsVisibility();

        // Close
        document.getElementById('adScoreClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Save
        document.getElementById('adScoreSave').addEventListener('click', async function() {
            // Validate visible sets
            for (var s = 1; s <= currentSets; s++) {
                var v1 = document.getElementById('adS' + s + 'P1').value;
                var v2 = document.getElementById('adS' + s + 'P2').value;
                if (v1 === '' || v2 === '') {
                    showToast((isEn ? 'Fill in Set ' : 'Заполните сет ') + s, 'error');
                    return;
                }
                if (!isValidSet(v1, v2)) {
                    showToast((isEn ? 'Invalid Set ' : 'Некорректный счёт сета ') + s, 'error');
                    return;
                }
            }

            var winnerId = document.getElementById('adScoreWinner').value;
            if (!winnerId) {
                showToast(isEn ? 'Cannot determine winner' : 'Невозможно определить победителя', 'error');
                return;
            }

            // Build score string
            function buildSet(num) {
                var v1 = document.getElementById('adS' + num + 'P1').value;
                var v2 = document.getElementById('adS' + num + 'P2').value;
                if (v1 === '' || v2 === '') return null;
                var tb1 = document.getElementById('adS' + num + 'TB1').value;
                var tb2 = document.getElementById('adS' + num + 'TB2').value;
                var setStr = v1 + '/' + v2;
                if (tb1 !== '' && tb2 !== '' && ((+v1 === 7 && +v2 === 6) || (+v1 === 6 && +v2 === 7))) {
                    setStr += '(' + tb1 + '-' + tb2 + ')';
                }
                return setStr;
            }

            var scoreParts = [];
            for (var s = 1; s <= currentSets; s++) {
                var setStr = buildSet(s);
                if (setStr) scoreParts.push(setStr);
            }
            var scoreStr = scoreParts.join(' ');

            var updateData = {
                score: scoreStr,
                winner_id: winnerId,
                status: 'completed',
                played_at: new Date().toISOString()
            };

            var res = await client.from('matches').update(updateData).eq('id', match.id);
            if (res.error) {
                showToast(res.error.message, 'error');
                return;
            }

            await advanceWinner(match, winnerId, tournamentId);

            overlay.remove();
            showToast(L.saved, 'success');
            renderBracketManagement(tournamentId);
        });
    }

    // ---- Auto-advance winner to next round ----
    async function advanceWinner(match, winnerId, tournamentId) {
        var roundNumber = match.round_number;
        var matchOrder = match.match_order;
        var nextRound = roundNumber + 1;

        // Skip 3rd place match — it doesn't advance anywhere
        if (match.round === '3RD') return;

        // Find next match: match_order = ceil(matchOrder / 2)
        var nextMatchOrder = Math.ceil(matchOrder / 2);

        var nextRes = await client.from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round_number', nextRound)
            .eq('match_order', nextMatchOrder)
            .maybeSingle();

        if (!nextRes.data) return; // Final match or error

        var nextMatch = nextRes.data;
        // If matchOrder is odd → player1, even → player2
        var isSlot1 = (matchOrder % 2 !== 0);
        var updateField = isSlot1 ? 'player1_id' : 'player2_id';
        var seedField = isSlot1 ? 'seed1' : 'seed2';

        // Carry over the seed of the winner
        var winnerSeed = null;
        if (match.winner_id === match.player1_id) winnerSeed = match.seed1;
        else if (match.winner_id === match.player2_id) winnerSeed = match.seed2;

        var update = {};
        update[updateField] = winnerId;
        update[seedField] = winnerSeed;

        await client.from('matches').update(update).eq('id', nextMatch.id);

        // SF match: also place LOSER into 3rd place match
        if (match.round === 'SF') {
            var loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
            var loserSeed = loserId === match.player1_id ? match.seed1 : match.seed2;

            // Find 3rd place match
            var thirdRes = await client.from('matches')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('round', '3RD')
                .maybeSingle();

            if (thirdRes.data) {
                var thirdMatch = thirdRes.data;
                // SF match 1 (match_order=1) loser → player1, SF match 2 loser → player2
                var tField = matchOrder === 1 ? 'player1_id' : 'player2_id';
                var tSeedField = matchOrder === 1 ? 'seed1' : 'seed2';
                var tUpdate = {};
                tUpdate[tField] = loserId;
                tUpdate[tSeedField] = loserSeed;
                await client.from('matches').update(tUpdate).eq('id', thirdMatch.id);
            }
        }
    }

    // ---- Finalize Tournament ----
    async function finalizeTournament(tournament, matches, playersMap) {
        try {
            var drawSize = tournament.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var season = new Date().getFullYear();

            // Load points rules for this tournament's level
            var rulesMap = {};
            if (tournament.level_id) {
                var rulesRes = await client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Determine round_reached for each player
            var playerResults = {}; // player_id → { round_reached, points_earned }

            // Find the final match to determine winner (exclude 3RD place match)
            var finalMatch = matches.find(function(m) { return m.round_number === totalRounds && m.round !== '3RD'; });

            if (finalMatch && finalMatch.winner_id) {
                // Winner
                playerResults[finalMatch.winner_id] = {
                    round_reached: 'W',
                    points_earned: rulesMap['W'] || 0
                };
                // Finalist (loser of final)
                var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                if (finalist) {
                    playerResults[finalist] = {
                        round_reached: 'F',
                        points_earned: rulesMap['F'] || 0
                    };
                }
            }

            // 3rd place match: winner = 3rd, loser = 4th
            var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
            if (thirdPlaceMatch) {
                playerResults[thirdPlaceMatch.winner_id] = {
                    round_reached: '3RD',
                    points_earned: rulesMap['3RD'] || rulesMap['SF'] || 0
                };
                var fourthId = thirdPlaceMatch.winner_id === thirdPlaceMatch.player1_id ? thirdPlaceMatch.player2_id : thirdPlaceMatch.player1_id;
                if (fourthId) {
                    playerResults[fourthId] = {
                        round_reached: '4TH',
                        points_earned: rulesMap['4TH'] || rulesMap['SF'] || 0
                    };
                }
            }

            // Other players: lost in their round
            matches.forEach(function(m) {
                if (m.status !== 'completed' || !m.winner_id) return;
                if (m.score === 'BYE') return; // Skip BYEs
                if (m.round === '3RD') return; // Handled above

                var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                if (!loserId || playerResults[loserId]) return; // Already set (winner/finalist/3rd/4th)

                // Player lost in round m.round_number → their round_reached is based on that
                var roundKey = getRoundKey(m.round_number, totalRounds);
                playerResults[loserId] = {
                    round_reached: roundKey,
                    points_earned: rulesMap[roundKey] || 0
                };
            });

            // Upsert tournament_results
            var toUpsert = [];
            Object.keys(playerResults).forEach(function(pid) {
                toUpsert.push({
                    tournament_id: tournament.id,
                    player_id: pid,
                    round_reached: playerResults[pid].round_reached,
                    points_earned: playerResults[pid].points_earned,
                    season: season,
                    category_id: tournament.category_id
                });
            });

            if (toUpsert.length > 0) {
                var upsRes = await client.from('tournament_results').upsert(toUpsert, { onConflict: 'tournament_id,player_id' });
                if (upsRes.error) {
                    showToast(upsRes.error.message, 'error');
                    return;
                }

                // Recalculate player points
                await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));
            }

            // Update player form arrays (W/L from recent matches)
            var allPlayerIds = Object.keys(playerResults);
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);

                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });

                    await client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            // Update tournament status
            var statusRes = await client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            if (statusRes.error) {
                showToast(statusRes.error.message, 'error');
                return;
            }

            showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize tournament error:', err);
            showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Hook: Add "Bracket" button to tournament list ----
    // Extend renderTournamentsList to add bracket management button

    // ============================================
    // PLAYERS CRUD
    // ============================================

    var plrEditingId = null;
    var plrImageFile = null;
    var plrImageUrl = '';
    var plrFilterCategory = '';
    var plrSearchQuery = '';

    async function renderPlayersSection() {
        await loadCategories();
        renderPlayersList();
    }

    // ---- Players List ----
    async function renderPlayersList() {
        var container = document.getElementById('ad-players');
        if (!container) return;

        var catFilterHtml = '<option value="">' + L.plrAllCategories + '</option>';
        cachedCategories.forEach(function(c) {
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            var selected = plrFilterCategory === c.id ? ' selected' : '';
            catFilterHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        var isAdm = currentRole === 'admin';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.players + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adPlrAdd">+ ' + L.addPlayer + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adPlrSearch" placeholder="' + L.plrSearch + '" value="' + esc(plrSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adPlrCatFilter">' + catFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adPlrTable">' +
                        '<thead><tr>' +
                            '<th></th>' +
                            '<th>' + L.plrName + '</th>' +
                            '<th>' + L.plrCategory + '</th>' +
                            '<th>' + L.thPoints + '</th>' +
                            '<th>' + L.thWL + '</th>' +
                            '<th>' + L.thChange + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var plrAddBtn = document.getElementById('adPlrAdd');
        if (plrAddBtn) {
            plrAddBtn.addEventListener('click', function() {
                renderPlayerForm(null);
            });
        }

        var searchTimer = null;
        document.getElementById('adPlrSearch').addEventListener('input', function() {
            plrSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadPlayersList(); }, 300);
        });

        document.getElementById('adPlrCatFilter').addEventListener('change', function() {
            plrFilterCategory = this.value;
            loadPlayersList();
        });

        await loadPlayersList();
    }

    async function loadPlayersList() {
        if (!client) return;
        var isAdm = currentRole === 'admin';

        var query = client.from('players')
            .select('id,name,photo,country,category_id,points,wins,losses,rank_change')
            .order('points', { ascending: false });

        if (plrFilterCategory) {
            query = query.eq('category_id', plrFilterCategory);
        }
        if (plrSearchQuery) {
            query = query.ilike('name', '%' + plrSearchQuery + '%');
        }

        var result = await query;

        var table = document.getElementById('adPlrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📊</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noPlayers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noPlayersText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(p) {
            var thumbHtml = p.photo
                ? '<img src="' + esc(p.photo) + '" class="ad-table-thumb ad-table-thumb-round" alt="">'
                : '<div class="ad-table-thumb ad-table-thumb-round" style="background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">' + (p.country || '?') + '</div>';

            var catObj = categoriesMap[p.category_id];
            var catLabel = catObj ? (catObj.gender === 'women' ? '♀ ' : '♂ ') + (isEn ? catObj.name_en : catObj.name) : (p.category_id || L.noData);

            var changeStr = p.rank_change > 0 ? '+' + p.rank_change : (p.rank_change < 0 ? String(p.rank_change) : '0');
            var changeClass = p.rank_change > 0 ? 'ad-change-up' : (p.rank_change < 0 ? 'ad-change-down' : '');

            tbody.innerHTML +=
                '<tr data-plr-id="' + p.id + '"' + (isAdm ? ' style="cursor:pointer;"' : '') + '>' +
                    (isAdm ? bulkCheckboxTd(p.id) : '') +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (p.country || '') + ' ' + (p.name || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.points || 0) + '</td>' +
                    '<td>' + (p.wins || 0) + '/' + (p.losses || 0) + '</td>' +
                    '<td><span class="' + changeClass + '">' + changeStr + '</span></td>' +
                '</tr>';
        });

        if (isAdm) {
            tbody.addEventListener('click', function(e) {
                if (e.target.closest('.ad-bulk-cell')) return;
                var row = e.target.closest('tr[data-plr-id]');
                if (!row) return;
                loadAndEditPlayer(row.dataset.plrId);
            });

            setupBulkDelete({ tableId: 'adPlrTable', tableName: 'players', reloadFn: loadPlayersList });
        }
    }

    async function loadAndEditPlayer(id) {
        if (!client) return;
        var result = await client.from('players').select('*').eq('id', id).single();
        if (result.data) {
            renderPlayerForm(result.data);
        }
    }

    // ---- Player Form ----
    function renderPlayerForm(item) {
        var container = document.getElementById('ad-players');
        if (!container) return;

        plrEditingId = item ? item.id : null;
        plrImageFile = null;
        plrImageUrl = (item && item.photo) ? item.photo : '';

        var title = item ? L.editPlayer : L.addPlayer;

        var imagePreviewHtml = plrImageUrl
            ? '<img src="' + esc(plrImageUrl) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:50%;">' +
              '<button type="button" class="ad-image-upload-remove" id="adPlrImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = plrImageUrl ? ' has-image' : '';

        // Category options
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        cachedCategories.forEach(function(c) {
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        // Badges checkboxes
        var badgesHtml = '';
        var currentBadges = (item && item.badges) ? item.badges : [];
        Object.keys(PLAYER_BADGES).forEach(function(key) {
            var checked = currentBadges.indexOf(key) !== -1 ? ' checked' : '';
            badgesHtml += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-plr-badge" value="' + key + '"' + checked + '> ' + PLAYER_BADGES[key] + '</label>';
        });

        // Form (W/L) — 5 toggle pairs
        var currentForm = (item && item.form) ? item.form : [];
        var formHtml = '';
        for (var i = 0; i < 5; i++) {
            var val = currentForm[i] || '';
            var wActive = val === 'W' ? ' active' : '';
            var lActive = val === 'L' ? ' active' : '';
            formHtml += '<div class="ad-form-toggle" data-index="' + i + '">' +
                '<button type="button" class="ad-form-btn-w' + wActive + '" data-val="W">W</button>' +
                '<button type="button" class="ad-form-btn-l' + lActive + '" data-val="L">L</button>' +
            '</div>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adPlrBack">' + L.back + '</button>' +
            '</div>' +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrPhoto + '</div>' +
                '<div class="ad-image-upload ad-image-upload-round' + hasImageClass + '" id="adPlrImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adPlrImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adPlrImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (plrImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adPlrImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Name (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrName + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrName" placeholder="' + L.plrName + ' (RU)" value="' + esc(item ? item.name : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrNameEn" placeholder="' + L.plrName + ' (EN)" value="' + esc(item ? item.name_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrName" data-target="adPlrNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrNameKg" placeholder="' + L.plrName + ' (KG)" value="' + esc(item ? item.name_kg : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrName" data-target="adPlrNameKg" data-tolang="kg">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Category + Country
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrCategory + '</label>' +
                        '<select class="ad-field-input" id="adPlrCat">' + catOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrCountry + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrCountry" placeholder="🇰🇬" value="' + esc(item ? item.country : '') + '" style="font-size:1.5rem;text-align:center;">' +
                    '</div>' +
                    '<div class="ad-field"></div>' +
                '</div>' +
            '</div>' +

            // Stats: Points, Wins, Losses, Rank Change
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.thPoints + '</div>' +
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPoints + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrPoints" min="0" value="' + (item ? (item.points || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrWins + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrWins" min="0" value="' + (item ? (item.wins || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrLosses + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrLosses" min="0" value="' + (item ? (item.losses || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrRankChange + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrRankChange" value="' + (item ? (item.rank_change || 0) : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Form (W/L)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrForm + '</div>' +
                '<div class="ad-form-toggles" id="adPlrFormToggles">' + formHtml + '</div>' +
            '</div>' +

            // Badges
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrBadges + '</div>' +
                '<div class="ad-badges-grid" id="adPlrBadges">' + badgesHtml + '</div>' +
            '</div>' +

            // Bio (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrBio + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adPlrBio" placeholder="' + L.plrBio + ' (RU)">' + esc(item ? item.bio : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adPlrBioEn" placeholder="' + L.plrBio + ' (EN)">' + esc(item ? item.bio_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrBio" data-target="adPlrBioEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Contact: Phone, Email, Show Phone
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrPhone" placeholder="+996 ..." value="' + esc(item ? item.phone : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrEmail + '</label>' +
                        '<input type="email" class="ad-field-input" id="adPlrEmail" placeholder="email@example.com" value="' + esc(item ? item.email : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="display:flex;align-items:flex-end;padding-bottom:8px;">' +
                        '<label class="ad-checkbox-label"><input type="checkbox" id="adPlrShowPhone"' + (item && item.show_phone ? ' checked' : '') + '> ' + L.plrShowPhone + '</label>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adPlrSave">' + L.save + '</button>' +
                (plrEditingId ? '<button class="ad-btn ad-btn-danger" id="adPlrDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back
        document.getElementById('adPlrBack').addEventListener('click', function() {
            renderPlayersList();
        });

        // Lang tabs (delegate)
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });
        });

        // Translate buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate');
            if (!btn) return;
            var srcId = btn.dataset.src;
            var targetId = btn.dataset.target;
            var toLang = btn.dataset.tolang;
            var srcEl = document.getElementById(srcId);
            var targetEl = document.getElementById(targetId);
            if (!srcEl || !targetEl) return;

            var srcText = srcEl.value.trim();
            if (!srcText) {
                showToast(L.fillRuFirst, 'error');
                return;
            }

            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;

            translateFromRu(srcText, toLang).then(function(result) {
                targetEl.value = result;
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Form toggles (W/L)
        document.getElementById('adPlrFormToggles').addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-form-btn-w, .ad-form-btn-l');
            if (!btn) return;
            var toggle = btn.closest('.ad-form-toggle');
            toggle.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });

        // Image upload
        var imgZone = document.getElementById('adPlrImgZone');
        var imgInput = document.getElementById('adPlrImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                plrImageFile = imgInput.files[0];
                previewPlrImage(URL.createObjectURL(plrImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                plrImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewPlrImage(URL.createObjectURL(plrImageFile));
            }
        });

        setupPlrImgRemove();

        document.getElementById('adPlrImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adPlrImgUrl').value.trim();
            if (url) {
                plrImageFile = null;
                plrImageUrl = url;
                previewPlrImage(url);
            }
        });

        // Save
        document.getElementById('adPlrSave').addEventListener('click', savePlayerHandler);

        // Delete
        var delBtn = document.getElementById('adPlrDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.plrDeleteConfirm, L.deleteConfirmText, function() {
                    deletePlayerHandler();
                });
            });
        }
    }

    function previewPlrImage(src) {
        var zone = document.getElementById('adPlrImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + esc(src) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:50%;">' +
            '<button type="button" class="ad-image-upload-remove" id="adPlrImgRemove">&times;</button>';
        setupPlrImgRemove();
    }

    function setupPlrImgRemove() {
        var rmBtn = document.getElementById('adPlrImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                plrImageFile = null;
                plrImageUrl = '';
                var zone = document.getElementById('adPlrImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adPlrImgUrl').value = '';
                document.getElementById('adPlrImgInput').value = '';
            });
        }
    }

    // ---- Save Player ----
    async function savePlayerHandler() {
        var saveBtn = document.getElementById('adPlrSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            var imageUrl = plrImageUrl;
            if (plrImageFile) {
                imageUrl = await uploadPlayerImage(plrImageFile);
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Collect form (W/L)
            var formArr = [];
            document.querySelectorAll('.ad-form-toggle').forEach(function(toggle) {
                var active = toggle.querySelector('button.active');
                if (active) formArr.push(active.dataset.val);
            });

            // Collect badges
            var badges = [];
            document.querySelectorAll('.ad-plr-badge:checked').forEach(function(cb) {
                badges.push(cb.value);
            });

            var name = document.getElementById('adPlrName').value.trim();

            var data = {
                name: name,
                name_en: document.getElementById('adPlrNameEn').value.trim() || null,
                name_kg: document.getElementById('adPlrNameKg').value.trim() || null,
                photo: imageUrl || null,
                country: document.getElementById('adPlrCountry').value.trim() || null,
                category_id: document.getElementById('adPlrCat').value || null,
                points: parseInt(document.getElementById('adPlrPoints').value, 10) || 0,
                wins: parseInt(document.getElementById('adPlrWins').value, 10) || 0,
                losses: parseInt(document.getElementById('adPlrLosses').value, 10) || 0,
                rank_change: parseInt(document.getElementById('adPlrRankChange').value, 10) || 0,
                form: formArr,
                badges: badges,
                bio: document.getElementById('adPlrBio').value.trim() || null,
                bio_en: document.getElementById('adPlrBioEn').value.trim() || null,
                phone: document.getElementById('adPlrPhone').value.trim() || null,
                email: document.getElementById('adPlrEmail').value.trim() || null,
                show_phone: document.getElementById('adPlrShowPhone').checked
            };

            if (!data.name) {
                showToast(isEn ? 'Name is required' : 'Имя обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (plrEditingId) {
                result = await client.from('players').update(data).eq('id', plrEditingId);
            } else {
                data.id = slugify(name);
                result = await client.from('players').insert(data);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            showToast(L.saved, 'success');
            renderPlayersList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Player ----
    async function deletePlayerHandler() {
        if (!plrEditingId) return;
        var result = await client.from('players').delete().eq('id', plrEditingId);
        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }
        showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderPlayersList();
    }

    // ---- Upload Player Image ----
    async function uploadPlayerImage(file) {
        if (!client || !file) return null;

        var ext = file.name.split('.').pop().toLowerCase();
        var filename = 'plr-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;

        try {
            var result = await client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (result.error) {
                showToast('Upload: ' + result.error.message, 'error');
                return null;
            }

            var urlResult = client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    // ============================================
    // COURTS CRUD
    // ============================================

    var crtEditingId = null;
    var crtImageFile = null;
    var crtImageUrl = '';
    var crtGalleryUrls = [];
    var crtGalleryFiles = [];
    var crtFilterType = '';
    var crtFilterSurface = '';
    var crtSortCol = 'name';
    var crtSortAsc = true;
    var crtAllData = [];
    var crtSearchQuery = '';
    var crtPage = 1;
    var CRT_PER_PAGE = 10;
    var crtCourtTypes = [];
    var crtPhones = [];

    async function renderCourtsSection() {
        renderCourtsList();
    }

    // ---- Courts List ----

    function crtColHeader(col, label) {
        var sortable = col === 'name' || col === 'price' || col === 'count' || col === 'city' || col === 'type' || col === 'surface' || col === 'partner';
        if (!sortable) return '<th>' + label + '</th>';
        var isActive = crtSortCol === col;
        var cls = 'ad-col-header' + (isActive ? ' ad-col-active' : '');
        return '<th><div class="' + cls + '" data-col="' + col + '">' +
            '<span>' + label + '</span>' +
            (isActive ? '<span class="ad-sort-arrow">' + (crtSortAsc ? '↑' : '↓') + '</span>' : '') +
            '<span class="ad-col-filter-btn">▼</span>' +
        '</div></th>';
    }

    function openCrtColDropdown(col, hdr) {
        var dd = document.getElementById('adCrtColDropdown');
        if (!dd) return;

        if (dd.style.display === 'block' && dd.dataset.col === col) {
            dd.style.display = 'none';
            return;
        }
        dd.dataset.col = col;

        var rect = hdr.getBoundingClientRect();
        var cardRect = dd.parentElement.getBoundingClientRect();
        dd.style.left = Math.max(0, rect.left - cardRect.left) + 'px';
        dd.style.top = (rect.bottom - cardRect.top + 4) + 'px';

        var colLabels = { name: L.crtName, price: L.crtPrice, count: isEn ? 'Count' : 'Кол-во', city: L.crtCity, type: L.crtType, surface: L.crtSurface, partner: L.crtPartner };
        var isNumeric = col === 'price' || col === 'count' || col === 'partner';

        var html = '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';

        if (isNumeric) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Most first' : '↓ Сначала больше') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Least first' : '↑ Сначала меньше') + '</div>';
        } else {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ A → Z' : '↑ А → Я') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Z → A' : '↓ Я → А') + '</div>';
        }

        dd.innerHTML = html;
        dd.style.display = 'block';

        // Sort click
        dd.querySelectorAll('.ad-col-dd-sort').forEach(function(el) {
            el.addEventListener('click', function(ev) {
                ev.stopPropagation();
                crtSortCol = col;
                crtSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateCrtColHeaders();
                applyCrtFilters();
            });
        });

    }

    function updateCrtColHeaders() {
        var table = document.getElementById('adCrtTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = crtSortCol === c;
            hdr.classList.toggle('ad-col-active', isActive);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = crtSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
        });
    }

    function updateCourtStats() {
        var outdoorEl = document.getElementById('adCrtStatOutdoor');
        var indoorEl = document.getElementById('adCrtStatIndoor');
        var totalOutEl = document.getElementById('adCrtTotalOutdoor');
        var totalInEl = document.getElementById('adCrtTotalIndoor');
        if (!outdoorEl || !indoorEl) return;

        var stats = { outdoor: {}, indoor: {} };
        crtAllData.forEach(function(c) {
            (c.court_types || []).forEach(function(t) {
                var type = t.type || 'indoor';
                var surface = t.surface || 'hard';
                var count = t.count || 1;
                if (!stats[type]) stats[type] = {};
                stats[type][surface] = (stats[type][surface] || 0) + count;
            });
        });

        var surfaceKeys = ['hard', 'clay', 'carpet'];
        ['outdoor', 'indoor'].forEach(function(type) {
            var el = type === 'outdoor' ? outdoorEl : indoorEl;
            var totalEl = type === 'outdoor' ? totalOutEl : totalInEl;
            var total = 0;
            surfaceKeys.forEach(function(s) { total += (stats[type][s] || 0); });

            if (totalEl) totalEl.textContent = total;

            var html = '';
            surfaceKeys.forEach(function(s) {
                var cnt = stats[type][s] || 0;
                if (cnt > 0) {
                    var pct = total > 0 ? Math.round(cnt / total * 100) : 0;
                    html += '<div class="ad-crt-stat-row">' +
                        '<span class="ad-crt-stat-surface">' + (COURT_SURFACES[s] || s) + '</span>' +
                        '<div class="ad-crt-stat-bar-wrap"><div class="ad-crt-stat-bar" style="width:' + pct + '%;"></div></div>' +
                        '<span class="ad-crt-stat-count">' + cnt + '</span>' +
                    '</div>';
                }
            });
            el.innerHTML = html;
        });
    }

    function getFilteredCrtTypes(c) {
        var types = c.court_types || [];
        if (crtFilterType) {
            types = types.filter(function(t) { return t.type === crtFilterType; });
        }
        if (crtFilterSurface) {
            types = types.filter(function(t) { return t.surface === crtFilterSurface; });
        }
        return types;
    }

    function applyCrtFilters() {
        var items = crtAllData.slice();

        // Filter — keep courts that have at least one matching type
        if (crtFilterType || crtFilterSurface) {
            items = items.filter(function(c) {
                return getFilteredCrtTypes(c).length > 0;
            });
        }

        // Search by name
        if (crtSearchQuery) {
            var q = crtSearchQuery.toLowerCase();
            items = items.filter(function(c) {
                return (c.name || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        // Client-side sort for price/count (sum of visible types only)
        if (crtSortCol === 'price') {
            items.sort(function(a, b) {
                var va = getFilteredCrtTypes(a).reduce(function(s, t) { return s + (t.price || 0); }, 0);
                var vb = getFilteredCrtTypes(b).reduce(function(s, t) { return s + (t.price || 0); }, 0);
                return crtSortAsc ? va - vb : vb - va;
            });
        } else if (crtSortCol === 'count') {
            items.sort(function(a, b) {
                var va = getFilteredCrtTypes(a).reduce(function(s, t) { return s + (t.count || 0); }, 0);
                var vb = getFilteredCrtTypes(b).reduce(function(s, t) { return s + (t.count || 0); }, 0);
                return crtSortAsc ? va - vb : vb - va;
            });
        } else if (crtSortCol === 'city') {
            items.sort(function(a, b) {
                var va = (a.city || '').toLowerCase();
                var vb = (b.city || '').toLowerCase();
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'type') {
            items.sort(function(a, b) {
                var va = ((a.court_types || [])[0] || {}).type || '';
                var vb = ((b.court_types || [])[0] || {}).type || '';
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'surface') {
            items.sort(function(a, b) {
                var va = ((a.court_types || [])[0] || {}).surface || '';
                var vb = ((b.court_types || [])[0] || {}).surface || '';
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'partner') {
            items.sort(function(a, b) {
                var va = a.partner ? 1 : 0;
                var vb = b.partner ? 1 : 0;
                return crtSortAsc ? va - vb : vb - va;
            });
        }
        // name sort is handled server-side (default)

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / CRT_PER_PAGE));
        if (crtPage > totalPages) crtPage = totalPages;
        var start = (crtPage - 1) * CRT_PER_PAGE;
        var pageItems = items.slice(start, start + CRT_PER_PAGE);

        renderCrtRows(pageItems);
        renderCrtPagination(items.length, totalPages);
    }

    function renderCrtRows(items) {
        var table = document.getElementById('adCrtTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        var editBtnHtml = '<button class="ad-crt-edit-btn" title="' + L.crtViewEdit + '" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:1rem;padding:4px;border-radius:4px;transition:color 0.15s;">✏️</button>';

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="11" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏟️</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noCourts + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noCourtsText + '</div>' +
                '</td></tr>';
            return;
        }

        var html = '';
        items.forEach(function(c) {
            var types = getFilteredCrtTypes(c);
            var rowCount = Math.max(1, types.length);
            var partnerHtml = c.partner ? '<span class="ad-partner-badge">✓</span>' : '';
            var promotedHtml = c.promoted ? '<span style="color:var(--accent);">⭐</span>' : '—';
            var cityText = esc(c.city || '—');

            if (types.length === 0) {
                html +=
                    '<tr data-crt-id="' + c.id + '">' +
                        bulkCheckboxTd(c.id) +
                        '<td style="text-align:center;">' + editBtnHtml + '</td>' +
                        '<td style="font-weight:500;color:var(--text-primary);">' + esc(c.name || L.noData) + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td style="text-align:center;">' + L.noData + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td>' + cityText + '</td>' +
                        '<td style="text-align:center;">' + partnerHtml + '</td>' +
                        '<td style="text-align:center;">' + promotedHtml + '</td>' +
                    '</tr>';
            } else {
                // First row with rowspan
                var t0 = types[0];
                html +=
                    '<tr data-crt-id="' + c.id + '">' +
                        '<td class="ad-bulk-cell" rowspan="' + rowCount + '" style="width:36px;text-align:center;vertical-align:middle;">' +
                            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + c.id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
                        '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + editBtnHtml + '</td>' +
                        '<td rowspan="' + rowCount + '" style="font-weight:500;color:var(--text-primary);vertical-align:middle;">' + esc(c.name || L.noData) + '</td>' +
                        '<td><span class="ad-type-badge ad-type-' + (t0.type || 'indoor') + '">' + (COURT_TYPES[t0.type] || t0.type || '') + '</span></td>' +
                        '<td style="text-align:center;">' + (COURT_SURFACES[t0.surface] || t0.surface || '') + '</td>' +
                        '<td style="text-align:center;">' + (t0.count || 1) + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + (t0.price || 0) + '</td>' +
                        '<td rowspan="' + rowCount + '" style="vertical-align:middle;">' + cityText + '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + partnerHtml + '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + promotedHtml + '</td>' +
                    '</tr>';

                // Sub-rows
                for (var i = 1; i < types.length; i++) {
                    var ti = types[i];
                    html +=
                        '<tr class="ad-crt-subrow" data-crt-id="' + c.id + '">' +
                            '<td><span class="ad-type-badge ad-type-' + (ti.type || 'indoor') + '">' + (COURT_TYPES[ti.type] || ti.type || '') + '</span></td>' +
                            '<td style="text-align:center;">' + (COURT_SURFACES[ti.surface] || ti.surface || '') + '</td>' +
                            '<td style="text-align:center;">' + (ti.count || 1) + '</td>' +
                            '<td style="font-weight:600;color:var(--accent);">' + (ti.price || 0) + '</td>' +
                        '</tr>';
                }
            }
        });

        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            // Edit button → direct edit
            if (e.target.closest('.ad-crt-edit-btn')) {
                var row = e.target.closest('tr[data-crt-id]');
                if (row) loadAndEditCourt(row.dataset.crtId);
                return;
            }
            // Row click → snapshot view
            var row = e.target.closest('tr[data-crt-id]');
            if (!row) return;
            loadAndViewCourt(row.dataset.crtId);
        });

        setupBulkDelete({ tableId: 'adCrtTable', tableName: 'courts', reloadFn: loadCourtsList });
    }

    function renderCrtPagination(totalItems, totalPages) {
        var existing = document.getElementById('adCrtPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adCrtPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        // Prev
        html += '<button class="ad-crt-page-btn" data-page="' + (crtPage - 1) + '"' + (crtPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        // Page numbers
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === crtPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        // Next
        html += '<button class="ad-crt-page-btn" data-page="' + (crtPage + 1) + '"' + (crtPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        // Info
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adCrtTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            crtPage = parseInt(btn.dataset.page, 10);
            applyCrtFilters();
        });
    }

    async function renderCourtsList() {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        var typeFilterHtml = '<option value="">' + L.crtAllTypes + '</option>';
        Object.keys(COURT_TYPES).forEach(function(k) {
            var selected = crtFilterType === k ? ' selected' : '';
            typeFilterHtml += '<option value="' + k + '"' + selected + '>' + COURT_TYPES[k] + '</option>';
        });

        var surfaceFilterHtml = '<option value="">' + L.crtAllSurfaces + '</option>';
        Object.keys(COURT_SURFACES).forEach(function(k) {
            var selected = crtFilterSurface === k ? ' selected' : '';
            surfaceFilterHtml += '<option value="' + k + '"' + selected + '>' + COURT_SURFACES[k] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.courts + '</h2>' +
            '</div>' +
            // Court stat cards
            '<div class="ad-crt-stats-grid">' +
                '<div class="ad-crt-stat-card" id="adCrtCardOutdoor">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">🌤 ' + L.crtStatOutdoor + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adCrtTotalOutdoor">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adCrtStatOutdoor"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card" id="adCrtCardIndoor">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">🏠 ' + L.crtStatIndoor + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adCrtTotalIndoor">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adCrtStatIndoor"></div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky" id="adCrtFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCrtSearch" placeholder="' + L.crtSearch + '" value="' + esc(crtSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCrtTypeFilter">' + typeFilterHtml + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="adCrtSurfaceFilter">' + surfaceFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adCrtAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addCourt + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adCrtTable">' +
                        '<colgroup>' +
                            '<col style="width:40px;">' +
                            '<col style="width:36px;">' +
                            '<col style="min-width:180px;">' +
                            '<col style="width:90px;">' +
                            '<col style="width:80px;">' +
                            '<col style="width:55px;">' +
                            '<col style="width:100px;">' +
                            '<col style="width:90px;">' +
                            '<col style="width:70px;">' +
                            '<col style="width:70px;">' +
                        '</colgroup>' +
                        '<thead><tr>' +
                            '<th style="width:36px;"></th>' +
                            crtColHeader('name', L.crtName) +
                            crtColHeader('type', L.crtType) +
                            crtColHeader('surface', L.crtSurface) +
                            crtColHeader('count', isEn ? 'Count' : 'Кол-во') +
                            crtColHeader('price', L.crtPrice) +
                            crtColHeader('city', L.crtCity) +
                            crtColHeader('partner', L.crtPartner) +
                            crtColHeader('promoted', L.crtPromoted) +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="10" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="ad-col-dropdown" id="adCrtColDropdown" style="display:none;"></div>' +
            '</div>';

        document.getElementById('adCrtAdd').addEventListener('click', function() {
            renderCourtForm(null);
        });

        var searchTimer = null;
        document.getElementById('adCrtSearch').addEventListener('input', function() {
            crtSearchQuery = this.value;
            crtPage = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { applyCrtFilters(); }, 300);
        });

        document.getElementById('adCrtTypeFilter').addEventListener('change', function() {
            crtFilterType = this.value;
            crtPage = 1;
            applyCrtFilters();
        });

        document.getElementById('adCrtSurfaceFilter').addEventListener('change', function() {
            crtFilterSurface = this.value;
            crtPage = 1;
            applyCrtFilters();
        });

        // Column header click → open dropdown
        document.getElementById('adCrtTable').querySelector('thead').addEventListener('click', function(e) {
            e.stopPropagation();
            var hdr = e.target.closest('.ad-col-header');
            if (!hdr) return;
            openCrtColDropdown(hdr.dataset.col, hdr);
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adCrtColDropdown');
            if (dd && dd.style.display !== 'none' && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        await loadCourtsList();
    }

    async function syncAllExpiredPromoted() {
        if (!client) return;
        var today = new Date().toISOString().slice(0, 10);

        // Find courts that are promoted but have no active promoted payment
        var promoted = await client.from('courts').select('id').eq('promoted', true);
        var ids = (promoted.data || []).map(function(c) { return String(c.id); });
        if (ids.length === 0) return;

        // Check which have active promoted payments
        var payments = await client.from('entity_payments')
            .select('entity_id')
            .eq('entity_type', 'court')
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .in('entity_id', ids);

        var activeIds = {};
        (payments.data || []).forEach(function(p) { activeIds[p.entity_id] = true; });

        // Reset promoted for courts without active payment
        for (var i = 0; i < ids.length; i++) {
            if (!activeIds[ids[i]]) {
                await client.from('courts').update({ promoted: false }).eq('id', ids[i]);
            }
        }
    }

    async function loadCourtsList() {
        if (!client) return;

        await syncAllExpiredPromoted();

        var serverSortCol = (crtSortCol === 'name' || crtSortCol === 'city') ? crtSortCol : 'name';

        var query = client.from('courts')
            .select('id,name,court_types,partner,city,promoted')
            .order(serverSortCol, { ascending: crtSortCol === serverSortCol ? crtSortAsc : true });

        var result = await query;
        crtAllData = result.data || [];

        // Update surface filter dropdown with custom surfaces from DB
        var surfaceSelect = document.getElementById('adCrtSurfaceFilter');
        if (surfaceSelect) {
            var knownSurfaces = {};
            Object.keys(COURT_SURFACES).forEach(function(k) { knownSurfaces[k] = true; });
            var customSurfaces = [];
            crtAllData.forEach(function(c) {
                (c.court_types || []).forEach(function(t) {
                    if (t.surface && !knownSurfaces[t.surface]) {
                        knownSurfaces[t.surface] = true;
                        customSurfaces.push(t.surface);
                    }
                });
            });
            customSurfaces.sort().forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                if (crtFilterSurface === s) opt.selected = true;
                surfaceSelect.appendChild(opt);
            });
        }

        applyCrtFilters();
        updateCourtStats();
    }

    async function loadAndViewCourt(id) {
        if (!client) return;
        var result = await client.from('courts').select('*').eq('id', id).single();
        if (!result.data) return;

        var payments = await client.from('entity_payments')
            .select('*')
            .eq('entity_type', 'court')
            .eq('entity_id', String(id))
            .order('created_at', { ascending: false });

        renderCourtView(result.data, payments.data || []);
    }

    function renderCourtView(item, payments) {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        var today = new Date().toISOString().slice(0, 10);

        // Court types info
        var typesHtml = '';
        (item.court_types || []).forEach(function(t) {
            typesHtml +=
                '<span class="ad-type-badge ad-type-' + (t.type || 'indoor') + '" style="margin-right:6px;">' +
                    (COURT_TYPES[t.type] || t.type || '') +
                '</span>' +
                '<span style="color:var(--text-secondary);margin-right:12px;">' +
                    (COURT_SURFACES[t.surface] || t.surface || '') + ' × ' + (t.count || 1) +
                    ' — ' + (t.price || 0) + ' ' + (isEn ? 'som' : 'сом') +
                '</span>';
        });
        if (!typesHtml) typesHtml = '<span style="color:var(--text-dim);">' + L.noData + '</span>';

        // Promoted status
        var promotedHtml = item.promoted
            ? '<span class="ad-pay-badge ad-pay-active">⭐ ' + L.crtPromotedBadge + '</span>'
            : '<span style="color:var(--text-dim);">—</span>';

        // Partner
        var partnerHtml = item.partner
            ? '<span class="ad-partner-badge" style="margin-right:4px;">✓</span>' + (isEn ? 'Yes' : 'Да')
            : '<span style="color:var(--text-dim);">' + (isEn ? 'No' : 'Нет') + '</span>';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml =
                '<div style="text-align:center;padding:30px 20px;color:var(--text-dim);">' +
                    '<div style="font-size:1.5rem;opacity:0.3;margin-bottom:6px;">💰</div>' +
                    L.crtViewNoPayments +
                '</div>';
        } else {
            paymentsHtml =
                '<table class="ad-table" style="margin:0;">' +
                    '<thead><tr>' +
                        '<th>' + L.crtViewPurpose + '</th>' +
                        '<th>' + L.crtViewAmount + '</th>' +
                        '<th>' + L.crtViewActiveUntil + '</th>' +
                        '<th>' + L.crtViewMethod + '</th>' +
                        '<th>' + L.crtViewStatus + '</th>' +
                    '</tr></thead><tbody>';

            payments.forEach(function(p) {
                var isActive = p.period_end >= today;
                var statusBadge = isActive
                    ? '<span class="ad-pay-badge ad-pay-active">' + L.payActive + '</span>'
                    : '<span class="ad-pay-badge ad-pay-expired">' + L.payExpired + '</span>';
                var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';

                paymentsHtml +=
                    '<tr>' +
                        '<td>' + purposeBadge + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                        '<td style="font-size:0.85rem;">' + formatPayDate(p.period_end) + '</td>' +
                        '<td>' + (PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                    '</tr>';
            });

            paymentsHtml += '</tbody></table>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.crtViewTitle + '</h2>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adCrtViewEditBtn">' + L.crtViewEdit + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adCrtViewBackBtn">' + L.back + '</button>' +
                '</div>' +
            '</div>' +

            // Info card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtViewInfo + '</div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:0.9rem;">' +
                    '<span style="color:var(--text-dim);">' + L.crtName + '</span>' +
                    '<span style="color:var(--text-primary);font-weight:500;">' + esc(item.name || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtCity + '</span>' +
                    '<span style="color:var(--text-secondary);">' + esc(item.city || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtType + ' / ' + L.crtSurface + '</span>' +
                    '<span>' + typesHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtPartner + '</span>' +
                    '<span>' + partnerHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtPromoted + '</span>' +
                    '<span>' + promotedHtml + '</span>' +
                '</div>' +
            '</div>' +

            // Payments card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtViewPayments + '</div>' +
                paymentsHtml +
            '</div>';

        document.getElementById('adCrtViewEditBtn').addEventListener('click', function() {
            renderCourtForm(item);
        });

        document.getElementById('adCrtViewBackBtn').addEventListener('click', function() {
            renderCourtsList();
        });
    }

    async function loadAndEditCourt(id) {
        if (!client) return;
        var result = await client.from('courts').select('*').eq('id', id).single();
        if (result.data) {
            renderCourtForm(result.data);
        }
    }

    // ---- Court Form ----
    function renderCourtForm(item) {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        crtEditingId = item ? item.id : null;
        crtImageFile = null;
        crtImageUrl = (item && item.photo) ? item.photo : '';
        crtGalleryUrls = (item && item.gallery) ? item.gallery.slice() : [];
        crtGalleryFiles = [];
        crtCourtTypes = (item && item.court_types) ? JSON.parse(JSON.stringify(item.court_types)) : [];

        var title = item ? L.editCourt : L.addCourt;

        var imagePreviewHtml = crtImageUrl
            ? '<img src="' + esc(crtImageUrl) + '" class="ad-image-upload-preview" id="adCrtImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adCrtImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = crtImageUrl ? ' has-image' : '';

        // Amenities checkboxes
        var currentAmenities = (item && item.amenities) ? item.amenities : [];
        var amenitiesCheckboxHtml = '';
        COURT_AMENITIES.forEach(function(a) {
            var checked = currentAmenities.indexOf(a.key) !== -1 ? ' checked' : '';
            amenitiesCheckboxHtml += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-crt-amenity" value="' + a.key + '"' + checked + '> ' + a.label + '</label>';
        });

        // Phones
        crtPhones = [];
        if (item && item.phone) {
            crtPhones = item.phone.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        if (crtPhones.length < 2) {
            while (crtPhones.length < 2) crtPhones.push('');
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adCrtBack">' + L.back + '</button>' +
            '</div>' +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtPhoto + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adCrtImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adCrtImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adCrtImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (crtImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Promoted badge (read-only, managed via Payments)
            (item && item.promoted ?
                '<div class="ad-form-card"><span class="ad-pay-badge ad-pay-active">⭐ ' + L.crtPromotedBadge + '</span> <span style="color:var(--text-dim);font-size:0.8rem;">' + L.crtPromotedHint + '</span></div>'
            : '') +

            // Name (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtName + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtName" placeholder="' + L.crtName + ' (RU)" value="' + esc(item ? item.name : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtNameEn" placeholder="' + L.crtName + ' (EN)" value="' + esc(item ? item.name_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtNameKg" placeholder="' + L.crtName + ' (KG)" value="' + esc(item ? item.name_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtName" data-en="adCrtNameEn" data-kg="adCrtNameKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Court Types (dynamic rows with headers)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtType + '</div>' +
                '<div class="ad-court-type-header">' +
                    '<span>' + L.crtType + '</span>' +
                    '<span>' + L.crtSurface + '</span>' +
                    '<span>' + L.crtCourtsCount + '</span>' +
                    '<span>' + L.crtPrice + '</span>' +
                    '<span>' + L.crtPartner + '</span>' +
                    '<span></span>' +
                '</div>' +
                '<div id="adCrtTypesRows"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtTypesAdd">' + L.crtAdd + '</button>' +
            '</div>' +

            // Address form (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Address' : 'Адрес') + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreet" value="' + esc(item ? item.street : '') + '">' +
                        '</div>' +
                        '<div class="ad-field" style="max-width:100px;">' +
                            '<label class="ad-field-label">' + L.crtBuilding + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtBuilding" value="' + esc(item ? item.building : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field-row" style="margin-top:8px;">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtDistrict + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtDistrict" value="' + esc(item ? item.district : '') + '">' +
                        '</div>' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtCity + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtCity" value="' + esc(item ? item.city : 'Бишкек') + '">' +
                        '</div>' +
                        '<div class="ad-field" style="max-width:100px;">' +
                            '<label class="ad-field-label">' + L.crtPostalCode + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtPostal" value="' + esc(item ? item.postal_code : '') + '">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + ' (EN)</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreetEn" value="' + esc(item ? item.street_en : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtDistrict + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtDistrictEn" value="' + esc(item ? item.district_en : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtCity + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtCityEn" value="' + esc(item ? item.city_en : 'Bishkek') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + ' (KG)</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreetKg" value="' + esc(item ? item.street_kg : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtDistrict + ' (KG)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtDistrictKg" value="' + esc(item ? item.district_kg : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtCity + ' (KG)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtCityKg" value="' + esc(item ? item.city_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-group="address">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Links: Google Maps + 2GIS with iframe preview
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtGoogleMaps + ' / ' + L.crtTwoGis + '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.crtGoogleMaps + '</label>' +
                        '<input type="url" class="ad-field-input" id="adCrtGoogleMaps" placeholder="https://maps.google.com/..." value="' + esc(item ? item.google_maps_url : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.crtTwoGis + '</label>' +
                        '<input type="url" class="ad-field-input" id="adCrtTwoGis" placeholder="https://2gis.kg/..." value="' + esc(item ? item.twogis_url : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-crt-map-preview" id="adCrtMapPreview"></div>' +
            '</div>' +

            // Phones + Email
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Contacts' : 'Контакты') + '</div>' +
                '<div id="adCrtPhones"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtAddPhone">' + L.crtAddPhone + '</button>' +
                '<div class="ad-field" style="margin-top:12px;max-width:400px;">' +
                    '<label class="ad-field-label">' + L.crtEmail + '</label>' +
                    '<input type="email" class="ad-field-input" id="adCrtEmail" placeholder="info@example.com" value="' + esc(item ? item.email : '') + '">' +
                '</div>' +
            '</div>' +

            // Description (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtDescription + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDesc" rows="4" placeholder="' + L.crtDescription + ' (RU)">' + esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDescEn" rows="4" placeholder="' + L.crtDescription + ' (EN)">' + esc(item ? item.description_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDescKg" rows="4" placeholder="' + L.crtDescription + ' (KG)">' + esc(item ? item.description_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtDesc" data-en="adCrtDescEn" data-kg="adCrtDescKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Amenities (checkbox grid + custom)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtAmenities + '</div>' +
                '<div class="ad-badges-grid" id="adCrtAmenities">' + amenitiesCheckboxHtml + '</div>' +
                '<div id="adCrtCustomAmenities"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtAmenityAdd" style="margin-top:8px;">' + L.crtAddCustom + '</button>' +
            '</div>' +

            // Slogan / Additional Info (RU/EN/KG) — textarea
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtSlogan + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSlogan" rows="3" placeholder="' + L.crtSlogan + ' (RU)">' + esc(item ? item.slogan : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSloganEn" rows="3" placeholder="' + L.crtSlogan + ' (EN)">' + esc(item ? item.slogan_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSloganKg" rows="3" placeholder="' + L.crtSlogan + ' (KG)">' + esc(item ? item.slogan_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtSlogan" data-en="adCrtSloganEn" data-kg="adCrtSloganKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Gallery (moved to bottom — thumbnails + upload + URL)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtGallery + '</div>' +
                '<div class="ad-gallery-grid" id="adCrtGalleryGrid"></div>' +
                '<input type="file" accept="image/jpeg,image/png" multiple id="adCrtGalleryInput" style="display:none">' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtGalleryAdd">+ ' + L.uploadImage + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtGalleryAddUrl">' + L.crtAddByUrl + '</button>' +
                '</div>' +
                '<div id="adCrtGalleryUrlRow" style="display:none;" class="ad-crt-gallery-url-row">' +
                    '<input type="url" class="ad-field-input" id="adCrtGalleryUrlInput" placeholder="https://example.com/photo.jpg" style="flex:1;">' +
                    '<button type="button" class="ad-btn ad-btn-sm" id="adCrtGalleryUrlConfirm">&#10003;</button>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adCrtSave">' + L.save + '</button>' +
                (crtEditingId ? '<button class="ad-btn ad-btn-danger" id="adCrtDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back
        document.getElementById('adCrtBack').addEventListener('click', function() {
            renderCourtsList();
        });

        // Lang tabs (delegate)
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card') || tab.closest('.ad-field');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });
        });

        // Translate ALL — 3-language "translate to empty" buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all');
            if (!btn) return;

            // Address group has 3 field-pairs
            if (btn.dataset.group === 'address') {
                var fields = [
                    { ru: 'adCrtStreet', en: 'adCrtStreetEn', kg: 'adCrtStreetKg' },
                    { ru: 'adCrtDistrict', en: 'adCrtDistrictEn', kg: 'adCrtDistrictKg' },
                    { ru: 'adCrtCity', en: 'adCrtCityEn', kg: 'adCrtCityKg' }
                ];
                var origLabel = btn.textContent;
                btn.textContent = L.translating;
                btn.disabled = true;
                (async function() {
                    try {
                        for (var f = 0; f < fields.length; f++) {
                            await translateToEmpty(fields[f].ru, fields[f].en, fields[f].kg, { textContent: '', disabled: false });
                        }
                    } catch (ex) { /* handled inside */ }
                    btn.textContent = origLabel;
                    btn.disabled = false;
                })();
                return;
            }

            // Standard: data-ru, data-en, data-kg
            translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
        });

        // Map preview on URL blur
        function updateCrtMapPreview() {
            var preview = document.getElementById('adCrtMapPreview');
            if (!preview) return;
            var gUrl = document.getElementById('adCrtGoogleMaps').value.trim();
            var tUrl = document.getElementById('adCrtTwoGis').value.trim();
            var embedUrl = getCrtMapEmbed(gUrl) || getCrtMapEmbed(tUrl);
            if (embedUrl) {
                preview.innerHTML = '<iframe src="' + esc(embedUrl) + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
            } else {
                preview.innerHTML = '';
            }
        }
        document.getElementById('adCrtGoogleMaps').addEventListener('blur', updateCrtMapPreview);
        document.getElementById('adCrtTwoGis').addEventListener('blur', updateCrtMapPreview);
        updateCrtMapPreview();

        // Custom amenities
        var crtCustomAmenities = [];
        if (item && item.amenities) {
            var knownKeys = COURT_AMENITIES.map(function(a) { return a.key; });
            item.amenities.forEach(function(a) {
                if (knownKeys.indexOf(a) === -1) crtCustomAmenities.push(a);
            });
        }
        function renderCrtCustomAmenities() {
            var wrap = document.getElementById('adCrtCustomAmenities');
            if (!wrap) return;
            var html = '';
            crtCustomAmenities.forEach(function(a, idx) {
                html += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-crt-amenity ad-crt-custom-amenity" value="' + esc(a) + '" checked> ' + esc(a) +
                    ' <button type="button" class="ad-btn-icon ad-crt-custom-amenity-remove" data-idx="' + idx + '" style="font-size:0.7rem;">&times;</button></label>';
            });
            wrap.innerHTML = html;
        }
        renderCrtCustomAmenities();

        document.getElementById('adCrtAmenityAdd').addEventListener('click', function() {
            var wrap = document.getElementById('adCrtCustomAmenities');
            // Check if input row already exists
            if (wrap.querySelector('.ad-crt-custom-amenity-row')) return;
            var row = document.createElement('div');
            row.className = 'ad-crt-custom-amenity-row';
            row.innerHTML = '<input type="text" class="ad-field-input" placeholder="' + L.crtCustomAmenity + '..." style="flex:1;">' +
                '<button type="button" class="ad-btn ad-btn-sm ad-crt-custom-amenity-confirm">&#10003;</button>';
            wrap.appendChild(row);
            row.querySelector('input').focus();
        });
        document.getElementById('adCrtCustomAmenities').addEventListener('click', function(e) {
            // Confirm custom amenity
            var confirmBtn = e.target.closest('.ad-crt-custom-amenity-confirm');
            if (confirmBtn) {
                var row = confirmBtn.closest('.ad-crt-custom-amenity-row');
                var val = row.querySelector('input').value.trim();
                if (val) {
                    crtCustomAmenities.push(val);
                    renderCrtCustomAmenities();
                }
                return;
            }
            // Remove custom amenity
            var rmBtn = e.target.closest('.ad-crt-custom-amenity-remove');
            if (rmBtn) {
                var idx = parseInt(rmBtn.dataset.idx, 10);
                crtCustomAmenities.splice(idx, 1);
                renderCrtCustomAmenities();
            }
        });
        // Enter key in custom amenity input
        document.getElementById('adCrtCustomAmenities').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var row = e.target.closest('.ad-crt-custom-amenity-row');
                if (row) {
                    e.preventDefault();
                    var val = e.target.value.trim();
                    if (val) {
                        crtCustomAmenities.push(val);
                        renderCrtCustomAmenities();
                    }
                }
            }
        });

        // Gallery URL add
        document.getElementById('adCrtGalleryAddUrl').addEventListener('click', function() {
            var row = document.getElementById('adCrtGalleryUrlRow');
            row.style.display = row.style.display === 'none' ? 'flex' : 'none';
            if (row.style.display === 'flex') document.getElementById('adCrtGalleryUrlInput').focus();
        });
        document.getElementById('adCrtGalleryUrlConfirm').addEventListener('click', function() {
            var input = document.getElementById('adCrtGalleryUrlInput');
            var url = input.value.trim();
            if (url) {
                crtGalleryUrls.push(url);
                crtGalleryFiles.push(null);
                renderCrtGallery();
                input.value = '';
                document.getElementById('adCrtGalleryUrlRow').style.display = 'none';
            }
        });

        // Court types: render rows
        if (crtCourtTypes.length === 0) {
            crtCourtTypes.push({ type: '', surface: '', count: 1, price: 0, partner: false });
        }

        function buildTypeOptions(selected) {
            var html = '<option value="">—</option>';
            Object.keys(COURT_TYPES).forEach(function(k) {
                html += '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>' + COURT_TYPES[k] + '</option>';
            });
            return html;
        }
        function buildSurfaceOptions(selected) {
            var html = '<option value="">—</option>';
            Object.keys(COURT_SURFACES).forEach(function(k) {
                html += '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>' + COURT_SURFACES[k] + '</option>';
            });
            html += '<option value="__other__"' + (selected === '__other__' ? ' selected' : '') + '>' + L.crtOther + '...</option>';
            return html;
        }
        function isCustomSurface(val) {
            return val && val !== '__other__' && !COURT_SURFACES.hasOwnProperty(val);
        }
        function renderCrtTypeRows() {
            var rowsEl = document.getElementById('adCrtTypesRows');
            if (!rowsEl) return;
            var html = '';
            crtCourtTypes.forEach(function(ct, idx) {
                var surfaceHtml;
                if (isCustomSurface(ct.surface)) {
                    surfaceHtml = '<input type="text" class="ad-field-input ad-ct-surface ad-ct-surface-custom" value="' + esc(ct.surface) + '" placeholder="' + L.crtSurface + '...">';
                } else {
                    surfaceHtml = '<select class="ad-field-input ad-ct-surface">' + buildSurfaceOptions(ct.surface) + '</select>';
                }
                html += '<div class="ad-court-type-row" data-idx="' + idx + '">' +
                    '<select class="ad-field-input ad-ct-type">' + buildTypeOptions(ct.type) + '</select>' +
                    surfaceHtml +
                    '<input type="text" class="ad-field-input ad-ct-count" inputmode="numeric" pattern="[0-9]*" value="' + (ct.count || '') + '">' +
                    '<input type="text" class="ad-field-input ad-ct-price" inputmode="numeric" pattern="[0-9]*" value="' + (ct.price || '') + '">' +
                    '<label class="ad-ct-partner-wrap"><input type="checkbox" class="ad-ct-partner"' + (ct.partner ? ' checked' : '') + '></label>' +
                    (crtCourtTypes.length > 1 ? '<button type="button" class="ad-btn-icon ad-ct-remove">&times;</button>' : '<div></div>') +
                '</div>';
            });
            rowsEl.innerHTML = html;
        }
        renderCrtTypeRows();

        document.getElementById('adCrtTypesAdd').addEventListener('click', function() {
            crtCourtTypes.push({ type: '', surface: '', count: 1, price: 0, partner: false });
            renderCrtTypeRows();
        });

        document.getElementById('adCrtTypesRows').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-ct-remove');
            if (!rmBtn) return;
            if (crtCourtTypes.length <= 1) return; // keep at least 1
            var row = rmBtn.closest('.ad-court-type-row');
            var idx = parseInt(row.dataset.idx, 10);
            crtCourtTypes.splice(idx, 1);
            renderCrtTypeRows();
        });

        // Sync court types on change
        document.getElementById('adCrtTypesRows').addEventListener('change', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-type')) crtCourtTypes[idx].type = e.target.value;
            if (e.target.classList.contains('ad-ct-surface')) {
                if (e.target.value === '__other__') {
                    crtCourtTypes[idx].surface = '';
                    renderCrtTypeRows();
                    var newInput = document.querySelector('.ad-court-type-row[data-idx="' + idx + '"] .ad-ct-surface-custom');
                    if (newInput) newInput.focus();
                } else {
                    crtCourtTypes[idx].surface = e.target.value;
                }
            }
            if (e.target.classList.contains('ad-ct-partner')) crtCourtTypes[idx].partner = e.target.checked;
        });
        document.getElementById('adCrtTypesRows').addEventListener('input', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-count')) {
                e.target.value = e.target.value.replace(/\D/g, '');
                crtCourtTypes[idx].count = parseInt(e.target.value, 10) || 0;
            }
            if (e.target.classList.contains('ad-ct-price')) {
                e.target.value = e.target.value.replace(/\D/g, '');
                crtCourtTypes[idx].price = parseInt(e.target.value, 10) || 0;
            }
            if (e.target.classList.contains('ad-ct-surface-custom')) {
                crtCourtTypes[idx].surface = e.target.value.trim();
            }
        });

        // Phones: render
        function renderCrtPhones() {
            var phonesEl = document.getElementById('adCrtPhones');
            if (!phonesEl) return;
            var html = '';
            crtPhones.forEach(function(ph, idx) {
                var label = idx === 0 ? L.crtMobile : (idx === 1 ? L.crtLandline : (isEn ? 'Phone ' + (idx + 1) : 'Телефон ' + (idx + 1)));
                var placeholder = idx === 0 ? '555 12-34-56' : (idx === 1 ? '312 12-34-56' : '555 12-34-56');
                // Strip +996 prefix and format for display
                var rawDigits = ph.replace(/^\+?996\s*/, '').replace(/\D/g, '');
                if (rawDigits.length > 9) rawDigits = rawDigits.substr(0, 9);
                var displayVal = '';
                if (rawDigits.length > 0) displayVal = rawDigits.substr(0, 3);
                if (rawDigits.length > 3) displayVal += ' ' + rawDigits.substr(3, 2);
                if (rawDigits.length > 5) displayVal += '-' + rawDigits.substr(5, 2);
                if (rawDigits.length > 7) displayVal += '-' + rawDigits.substr(7, 2);
                html += '<div class="ad-phone-row">' +
                    '<div class="ad-field" style="flex:1;">' +
                        '<label class="ad-field-label">' + label + '</label>' +
                        '<div style="display:flex;gap:6px;">' +
                            '<div class="ad-phone-prefix">🇰🇬 +996</div>' +
                            '<input type="text" class="ad-field-input ad-crt-phone" data-idx="' + idx + '" placeholder="' + placeholder + '" value="' + esc(displayVal) + '" style="flex:1;">' +
                        '</div>' +
                    '</div>' +
                    (idx >= 2 ? '<button type="button" class="ad-btn-icon ad-phone-remove" data-idx="' + idx + '" style="margin-bottom:4px;">&times;</button>' : '') +
                '</div>';
            });
            phonesEl.innerHTML = html;
        }
        renderCrtPhones();

        document.getElementById('adCrtAddPhone').addEventListener('click', function() {
            crtPhones.push('');
            renderCrtPhones();
        });
        document.getElementById('adCrtPhones').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-phone-remove');
            if (!rmBtn) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            crtPhones.splice(idx, 1);
            renderCrtPhones();
        });
        document.getElementById('adCrtPhones').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-crt-phone')) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            // Strip non-digits
            var digits = e.target.value.replace(/\D/g, '');
            // Limit to 9 digits (KG local number after +996)
            if (digits.length > 9) digits = digits.substr(0, 9);
            // Format: XXX XX-XX-XX
            var formatted = '';
            if (digits.length > 0) formatted = digits.substr(0, 3);
            if (digits.length > 3) formatted += ' ' + digits.substr(3, 2);
            if (digits.length > 5) formatted += '-' + digits.substr(5, 2);
            if (digits.length > 7) formatted += '-' + digits.substr(7, 2);
            // Update input display
            e.target.value = formatted;
            // Store with +996 prefix
            crtPhones[idx] = digits ? '+996 ' + formatted : '';
        });

        // Gallery: render thumbnails
        renderCrtGallery();

        // Gallery: add files
        document.getElementById('adCrtGalleryAdd').addEventListener('click', function() {
            document.getElementById('adCrtGalleryInput').click();
        });

        document.getElementById('adCrtGalleryInput').addEventListener('change', function() {
            var files = this.files;
            if (!files) return;
            for (var i = 0; i < files.length; i++) {
                crtGalleryFiles.push(files[i]);
                crtGalleryUrls.push(URL.createObjectURL(files[i]));
            }
            renderCrtGallery();
            this.value = '';
        });

        // Gallery: remove (delegated)
        document.getElementById('adCrtGalleryGrid').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-gallery-remove');
            if (!rmBtn) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            crtGalleryUrls.splice(idx, 1);
            crtGalleryFiles.splice(idx, 1);
            renderCrtGallery();
        });

        // Image upload
        var imgZone = document.getElementById('adCrtImgZone');
        var imgInput = document.getElementById('adCrtImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                crtImageFile = imgInput.files[0];
                previewCrtImage(URL.createObjectURL(crtImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                crtImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewCrtImage(URL.createObjectURL(crtImageFile));
            }
        });

        setupCrtImgRemove();

        document.getElementById('adCrtImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adCrtImgUrl').value.trim();
            if (url) {
                crtImageFile = null;
                crtImageUrl = url;
                previewCrtImage(url);
            }
        });

        // Save
        document.getElementById('adCrtSave').addEventListener('click', saveCourtHandler);

        // Delete
        var delBtn = document.getElementById('adCrtDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.crtDeleteConfirm, L.deleteConfirmText, function() {
                    deleteCourtHandler();
                });
            });
        }
    }

    // ---- Map embed URL parser ----
    function getCrtMapEmbed(url) {
        if (!url) return null;
        // Google Maps
        if (url.indexOf('google.com/maps') !== -1 || url.indexOf('goo.gl/maps') !== -1 || url.indexOf('maps.app.goo.gl') !== -1) {
            if (url.indexOf('/embed') !== -1) return url;
            var qMatch = url.match(/[?&]q=([^&]+)/);
            if (qMatch) return 'https://maps.google.com/maps?q=' + qMatch[1] + '&output=embed';
            var coordMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
            if (coordMatch) return 'https://maps.google.com/maps?q=' + coordMatch[1] + ',' + coordMatch[2] + '&output=embed';
            var placeMatch = url.match(/\/place\/([^/]+)/);
            if (placeMatch) return 'https://maps.google.com/maps?q=' + placeMatch[1] + '&output=embed';
            return 'https://maps.google.com/maps?q=' + encodeURIComponent(url) + '&output=embed';
        }
        // 2GIS
        if (url.indexOf('2gis.') !== -1) {
            var gisMatch = url.match(/\/([\d.]+)%2C([\d.]+)\//);
            if (!gisMatch) gisMatch = url.match(/\/([\d.]+),([\d.]+)\//);
            if (gisMatch) {
                return 'https://maps.google.com/maps?q=' + gisMatch[2] + ',' + gisMatch[1] + '&output=embed';
            }
        }
        return null;
    }

    // ---- Gallery Thumbnails ----
    function renderCrtGallery() {
        var grid = document.getElementById('adCrtGalleryGrid');
        if (!grid) return;
        if (crtGalleryUrls.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:8px 0;">' + (isEn ? 'No photos yet' : 'Фото ещё нет') + '</div>';
            return;
        }
        var html = '';
        crtGalleryUrls.forEach(function(url, idx) {
            html += '<div class="ad-gallery-thumb">' +
                '<img src="' + esc(url) + '" alt="">' +
                '<button type="button" class="ad-gallery-remove" data-idx="' + idx + '">&times;</button>' +
            '</div>';
        });
        grid.innerHTML = html;
    }

    function previewCrtImage(src) {
        var zone = document.getElementById('adCrtImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + esc(src) + '" class="ad-image-upload-preview" id="adCrtImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adCrtImgRemove">&times;</button>';
        setupCrtImgRemove();
    }

    function setupCrtImgRemove() {
        var rmBtn = document.getElementById('adCrtImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                crtImageFile = null;
                crtImageUrl = '';
                var zone = document.getElementById('adCrtImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adCrtImgUrl').value = '';
                document.getElementById('adCrtImgInput').value = '';
            });
        }
    }

    // ---- Save Court ----
    async function saveCourtHandler() {
        var saveBtn = document.getElementById('adCrtSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Main photo
            var imageUrl = crtImageUrl;
            if (crtImageFile) {
                imageUrl = await uploadCourtImage(crtImageFile);
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Upload new gallery files
            var galleryFinal = [];
            for (var g = 0; g < crtGalleryUrls.length; g++) {
                if (crtGalleryFiles[g]) {
                    var uploaded = await uploadCourtImage(crtGalleryFiles[g]);
                    if (uploaded) galleryFinal.push(uploaded);
                } else {
                    galleryFinal.push(crtGalleryUrls[g]);
                }
            }

            // Amenities (from checkboxes)
            var amenities = [];
            document.querySelectorAll('.ad-crt-amenity:checked').forEach(function(cb) {
                amenities.push(cb.value);
            });

            // Phones
            var phonesStr = crtPhones.filter(Boolean).join(', ');

            var name = document.getElementById('adCrtName').value.trim();

            var data = {
                name: name,
                name_en: document.getElementById('adCrtNameEn').value.trim() || null,
                name_kg: document.getElementById('adCrtNameKg').value.trim() || null,
                photo: imageUrl || null,
                gallery: galleryFinal,
                court_types: crtCourtTypes,
                google_maps_url: document.getElementById('adCrtGoogleMaps').value.trim() || null,
                twogis_url: document.getElementById('adCrtTwoGis').value.trim() || null,
                street: document.getElementById('adCrtStreet').value.trim() || null,
                street_en: document.getElementById('adCrtStreetEn').value.trim() || null,
                street_kg: document.getElementById('adCrtStreetKg').value.trim() || null,
                building: document.getElementById('adCrtBuilding').value.trim() || null,
                district: document.getElementById('adCrtDistrict').value.trim() || null,
                district_en: document.getElementById('adCrtDistrictEn').value.trim() || null,
                district_kg: document.getElementById('adCrtDistrictKg').value.trim() || null,
                city: document.getElementById('adCrtCity').value.trim() || null,
                city_en: document.getElementById('adCrtCityEn').value.trim() || null,
                city_kg: document.getElementById('adCrtCityKg').value.trim() || null,
                postal_code: document.getElementById('adCrtPostal').value.trim() || null,
                phone: phonesStr || null,
                email: document.getElementById('adCrtEmail').value.trim() || null,
                description: document.getElementById('adCrtDesc').value.trim() || null,
                description_en: document.getElementById('adCrtDescEn').value.trim() || null,
                description_kg: document.getElementById('adCrtDescKg').value.trim() || null,
                amenities: amenities,
                slogan: document.getElementById('adCrtSlogan').value.trim() || null,
                slogan_en: document.getElementById('adCrtSloganEn').value.trim() || null,
                slogan_kg: document.getElementById('adCrtSloganKg').value.trim() || null,
                partner: crtCourtTypes.some(function(ct) { return ct.partner; })
            };

            if (!data.name) {
                showToast(isEn ? 'Name is required' : 'Название обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (crtEditingId) {
                result = await client.from('courts').update(data).eq('id', crtEditingId);
            } else {
                data.id = slugify(name);
                result = await client.from('courts').insert(data);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            showToast(L.saved, 'success');
            renderCourtsList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Court ----
    async function deleteCourtHandler() {
        if (!crtEditingId) return;
        var result = await client.from('courts').delete().eq('id', crtEditingId);
        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }
        showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderCourtsList();
    }

    // ---- Upload Court Image ----
    async function uploadCourtImage(file) {
        if (!client || !file) return null;

        var ext = file.name.split('.').pop().toLowerCase();
        var filename = 'crt-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;

        try {
            var result = await client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });

            if (result.error) {
                showToast('Upload: ' + result.error.message, 'error');
                return null;
            }

            var urlResult = client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    // ============================================
    // COACHES CRUD
    // ============================================

    var cchEditingId = null;
    var cchImageFile = null;
    var cchImageUrl = '';
    var cchSearchQuery = '';
    var cchFilterTag = '';
    var cchAchievements = [];
    var cchAchievementsEn = [];
    var cchPage = 1;
    var cchAllData = [];
    var CCH_PER_PAGE = 15;

    var COACH_TAGS = {
        adults: isEn ? 'Adults' : 'Взрослые',
        kids: isEn ? 'Kids' : 'Дети',
        individual: isEn ? 'Individual' : 'Индивидуальные',
        group: isEn ? 'Group' : 'Групповые',
        beginner: isEn ? 'Beginner' : 'Начинающие',
        advanced: isEn ? 'Advanced' : 'Продвинутые'
    };

    function renderCoachesSection() {
        renderCoachesList();
    }

    // ---- Coaches List ----
    function renderCoachesList() {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        var tagFilterHtml = '<option value="">' + L.cchAllTags + '</option>';
        Object.keys(COACH_TAGS).forEach(function(key) {
            tagFilterHtml += '<option value="' + key + '"' + (cchFilterTag === key ? ' selected' : '') + '>' + COACH_TAGS[key] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.coaches + '</h2>' +
            '</div>' +
            // Stat cards
            '<div class="ad-cch-stats-grid">' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatTotal + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatTotal">...</div>' +
                '</div>' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatPromoted + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatPromoted">...</div>' +
                '</div>' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatNew + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatNew">...</div>' +
                '</div>' +
            '</div>' +
            // Filter row
            '<div class="ad-filter-row ad-filter-sticky" id="adCchFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCchSearch" placeholder="' + L.cchSearch + '" value="' + esc(cchSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCchTagFilter">' + tagFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adCchAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addCoach + '</button>' +
            '</div>' +
            // Table
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adCchTable">' +
                        '<colgroup>' +
                            '<col style="width:40px;">' +
                            '<col style="width:36px;">' +
                            '<col style="min-width:130px;">' +
                            '<col style="width:130px;">' +
                            '<col style="width:120px;">' +
                            '<col style="width:140px;">' +
                            '<col style="width:80px;">' +
                            '<col style="width:80px;">' +
                        '</colgroup>' +
                        '<thead><tr>' +
                            '<th style="width:36px;"></th>' +
                            '<th>' + (isEn ? 'Name' : 'ФИО') + '</th>' +
                            '<th>' + L.cchPosition + '</th>' +
                            '<th>' + L.cchCourt + '</th>' +
                            '<th>' + L.cchTags + '</th>' +
                            '<th style="text-align:center;">' + (isEn ? 'Price' : 'Цена') + '</th>' +
                            '<th style="text-align:center;">' + L.cchPromoted + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('adCchAdd').addEventListener('click', function() {
            renderCoachForm(null);
        });

        var searchTimer = null;
        document.getElementById('adCchSearch').addEventListener('input', function() {
            cchSearchQuery = this.value;
            cchPage = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { applyCchFilters(); }, 300);
        });
        document.getElementById('adCchTagFilter').addEventListener('change', function() {
            cchFilterTag = this.value;
            cchPage = 1;
            applyCchFilters();
        });

        loadCoachesList();
    }

    function applyCchFilters() {
        var items = cchAllData.slice();

        // Client-side tag filter
        if (cchFilterTag) {
            items = items.filter(function(r) {
                return (r.tags || []).indexOf(cchFilterTag) !== -1;
            });
        }

        // Client-side search
        if (cchSearchQuery) {
            var q = cchSearchQuery.toLowerCase();
            items = items.filter(function(r) {
                var name = ((r.last_name || '') + ' ' + (r.first_name || '')).toLowerCase();
                return name.indexOf(q) !== -1;
            });
        }

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / CCH_PER_PAGE));
        if (cchPage > totalPages) cchPage = totalPages;
        var start = (cchPage - 1) * CCH_PER_PAGE;
        var pageItems = items.slice(start, start + CCH_PER_PAGE);

        renderCchRows(pageItems);
        renderCchPagination(items.length, totalPages);
    }

    function renderCchRows(items) {
        var table = document.getElementById('adCchTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        var editBtnHtml = '<button class="ad-crt-edit-btn" title="' + L.cchViewEdit + '" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:1rem;padding:4px;border-radius:4px;transition:color 0.15s;">✏️</button>';

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="8" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🎓</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noCoaches + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noCoachesText + '</div>' +
                '</td></tr>';
            return;
        }

        var html = '';
        items.forEach(function(row) {
            var fullName = isEn
                ? ((row.last_name_en || row.last_name || '') + ' ' + (row.first_name_en || row.first_name || ''))
                : ((row.last_name || '') + ' ' + (row.first_name || ''));
            var pos = isEn ? (row.position_en || row.position || '') : (row.position || '');
            var courtText = esc(row.court || '—');
            var tagsHtml = '';
            (row.tags || []).forEach(function(t) {
                tagsHtml += '<span class="ad-cch-tag-badge">' + (COACH_TAGS[t] || t) + '</span>';
            });
            if (!tagsHtml) tagsHtml = '<span style="color:var(--text-dim);">—</span>';
            var promotedHtml = row.promoted ? '<span style="color:var(--accent);">⭐</span>' : '—';

            html += '<tr data-id="' + row.id + '">' +
                bulkCheckboxTd(row.id) +
                '<td style="text-align:center;">' + editBtnHtml + '</td>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + esc(fullName.trim()) + '</td>' +
                '<td>' + esc(pos) + '</td>' +
                '<td>' + courtText + '</td>' +
                '<td>' + tagsHtml + '</td>' +
                '<td style="font-weight:600;color:var(--accent);text-align:center;">' + (row.price || '—') + '</td>' +
                '<td style="text-align:center;">' + promotedHtml + '</td>' +
            '</tr>';
        });
        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            // Edit button → direct edit
            if (e.target.closest('.ad-crt-edit-btn')) {
                var row = e.target.closest('tr[data-id]');
                if (row) loadAndEditCoach(row.dataset.id);
                return;
            }
            // Row click → snapshot view
            var row = e.target.closest('tr[data-id]');
            if (!row) return;
            loadAndViewCoach(row.dataset.id);
        });

        setupBulkDelete({ tableId: 'adCchTable', tableName: 'coaches', reloadFn: loadCoachesList });
    }

    function renderCchPagination(totalItems, totalPages) {
        var existing = document.getElementById('adCchPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adCchPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        html += '<button class="ad-crt-page-btn" data-page="' + (cchPage - 1) + '"' + (cchPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === cchPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="ad-crt-page-btn" data-page="' + (cchPage + 1) + '"' + (cchPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adCchTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            cchPage = parseInt(btn.dataset.page, 10);
            applyCchFilters();
        });
    }

    function updateCchStats() {
        var totalEl = document.getElementById('adCchStatTotal');
        var promotedEl = document.getElementById('adCchStatPromoted');
        var newEl = document.getElementById('adCchStatNew');
        if (!totalEl) return;

        var total = cchAllData.length;
        var promoted = cchAllData.filter(function(c) { return c.promoted; }).length;

        // New this month
        var now = new Date();
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        var newCount = cchAllData.filter(function(c) {
            return c.created_at && c.created_at.slice(0, 10) >= monthStart;
        }).length;

        totalEl.textContent = total;
        promotedEl.textContent = promoted;
        newEl.textContent = newCount;
    }

    async function loadCoachesList() {
        if (!client) return;

        await syncAllExpiredPromotedCoaches();

        var query = client.from('coaches')
            .select('id,last_name,first_name,last_name_en,first_name_en,photo,position,position_en,court,tags,price,promoted,created_at')
            .order('created_at', { ascending: false });

        var result = await query;
        if (result.error) { showToast(result.error.message, 'error'); return; }

        cchAllData = result.data || [];
        updateCchStats();
        applyCchFilters();
    }

    // ---- Snapshot View ----
    async function loadAndViewCoach(id) {
        if (!client) return;
        var result = await client.from('coaches').select('*').eq('id', id).single();
        if (!result.data) return;

        var payments = await client.from('entity_payments')
            .select('*')
            .eq('entity_type', 'coach')
            .eq('entity_id', String(id))
            .order('created_at', { ascending: false });

        renderCoachView(result.data, payments.data || []);
    }

    function renderCoachView(item, payments) {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        var today = new Date().toISOString().slice(0, 10);

        var fullName = isEn
            ? ((item.last_name_en || item.last_name || '') + ' ' + (item.first_name_en || item.first_name || ''))
            : ((item.last_name || '') + ' ' + (item.first_name || ''));
        var pos = isEn ? (item.position_en || item.position || '') : (item.position || '');
        var tagsHtml = '';
        (item.tags || []).forEach(function(t) {
            tagsHtml += '<span class="ad-cch-tag-badge" style="margin-right:4px;">' + (COACH_TAGS[t] || t) + '</span>';
        });
        if (!tagsHtml) tagsHtml = '<span style="color:var(--text-dim);">—</span>';

        var promotedHtml = item.promoted
            ? '<span class="ad-pay-badge ad-pay-active">⭐ ' + L.cchPromotedBadge + '</span>'
            : '<span style="color:var(--text-dim);">—</span>';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml =
                '<div style="text-align:center;padding:30px 20px;color:var(--text-dim);">' +
                    '<div style="font-size:1.5rem;opacity:0.3;margin-bottom:6px;">💰</div>' +
                    L.cchViewNoPayments +
                '</div>';
        } else {
            paymentsHtml =
                '<table class="ad-table" style="margin:0;">' +
                    '<thead><tr>' +
                        '<th>' + L.crtViewPurpose + '</th>' +
                        '<th>' + L.crtViewAmount + '</th>' +
                        '<th>' + L.crtViewActiveUntil + '</th>' +
                        '<th>' + L.crtViewMethod + '</th>' +
                        '<th>' + L.crtViewStatus + '</th>' +
                    '</tr></thead><tbody>';

            payments.forEach(function(p) {
                var isActive = p.period_end >= today;
                var statusBadge = isActive
                    ? '<span class="ad-pay-badge ad-pay-active">' + L.payActive + '</span>'
                    : '<span class="ad-pay-badge ad-pay-expired">' + L.payExpired + '</span>';
                var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';

                paymentsHtml +=
                    '<tr>' +
                        '<td>' + purposeBadge + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                        '<td style="font-size:0.85rem;">' + formatPayDate(p.period_end) + '</td>' +
                        '<td>' + (PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                    '</tr>';
            });

            paymentsHtml += '</tbody></table>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.cchViewTitle + '</h2>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adCchViewEditBtn">' + L.cchViewEdit + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adCchViewBackBtn">' + L.back + '</button>' +
                '</div>' +
            '</div>' +

            // Info card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchViewInfo + '</div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:0.9rem;">' +
                    '<span style="color:var(--text-dim);">' + (isEn ? 'Name' : 'ФИО') + '</span>' +
                    '<span style="color:var(--text-primary);font-weight:500;">' + esc(fullName.trim()) + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPosition + '</span>' +
                    '<span style="color:var(--text-secondary);">' + esc(pos || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchCourt + '</span>' +
                    '<span style="color:var(--text-secondary);">' + esc(item.court || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchExperience + '</span>' +
                    '<span style="color:var(--text-secondary);">' + (item.experience || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPrice + '</span>' +
                    '<span style="color:var(--text-secondary);font-weight:600;">' + (item.price || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchTags + '</span>' +
                    '<span>' + tagsHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPromoted + '</span>' +
                    '<span>' + promotedHtml + '</span>' +
                '</div>' +
            '</div>' +

            // Payments card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchViewPayments + '</div>' +
                paymentsHtml +
            '</div>';

        document.getElementById('adCchViewEditBtn').addEventListener('click', function() {
            renderCoachForm(item);
        });

        document.getElementById('adCchViewBackBtn').addEventListener('click', function() {
            renderCoachesList();
        });
    }

    async function loadAndEditCoach(id) {
        if (!client) return;
        var result = await client.from('coaches').select('*').eq('id', id).single();
        if (result.error) { showToast(result.error.message, 'error'); return; }
        renderCoachForm(result.data);
    }

    async function syncAllExpiredPromotedCoaches() {
        if (!client) return;
        var today = new Date().toISOString().slice(0, 10);

        var promoted = await client.from('coaches').select('id').eq('promoted', true);
        var ids = (promoted.data || []).map(function(c) { return String(c.id); });
        if (ids.length === 0) return;

        var payments = await client.from('entity_payments')
            .select('entity_id')
            .eq('entity_type', 'coach')
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .in('entity_id', ids);

        var activeIds = {};
        (payments.data || []).forEach(function(p) { activeIds[p.entity_id] = true; });

        for (var i = 0; i < ids.length; i++) {
            if (!activeIds[ids[i]]) {
                await client.from('coaches').update({ promoted: false }).eq('id', ids[i]);
            }
        }
    }

    // ---- Coach Form ----
    async function renderCoachForm(item) {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        cchEditingId = item ? item.id : null;
        cchImageFile = null;
        cchImageUrl = (item && item.photo) ? item.photo : '';
        cchAchievements = (item && item.achievements) ? item.achievements.slice() : [];
        cchAchievementsEn = (item && item.achievements_en) ? item.achievements_en.slice() : [];

        // Load courts from DB for dropdown
        var courtsList = [];
        if (client) {
            var cRes = await client.from('courts').select('id,name,name_en').order('name');
            if (cRes.data) courtsList = cRes.data;
        }
        var courtOptionsHtml = '<option value="">' + (isEn ? '— Select —' : '— Выберите —') + '</option>';
        courtsList.forEach(function(c) {
            var courtName = isEn ? (c.name_en || c.name) : c.name;
            var sel = (item && item.court === c.name) ? ' selected' : '';
            courtOptionsHtml += '<option value="' + esc(c.id) + '" data-name="' + esc(c.name) + '" data-name-en="' + esc(c.name_en || '') + '"' + sel + '>' + esc(courtName) + '</option>';
        });

        // Helper: strip phone to local digits for display (remove +996 prefix)
        function phoneToLocal(phone) {
            if (!phone) return '';
            var d = phone.replace(/\D/g, '');
            if (d.indexOf('996') === 0) d = d.substr(3);
            if (d.length > 9) d = d.substr(0, 9);
            var f = '';
            if (d.length > 0) f = d.substr(0, 3);
            if (d.length > 3) f += ' ' + d.substr(3, 2);
            if (d.length > 5) f += '-' + d.substr(5, 2);
            if (d.length > 7) f += '-' + d.substr(7, 2);
            return f;
        }

        var title = item ? L.editCoach : L.addCoach;

        var imagePreviewHtml = cchImageUrl
            ? '<img src="' + esc(cchImageUrl) + '" class="ad-image-upload-preview" id="adCchImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adCchImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = cchImageUrl ? ' has-image' : '';

        // Tags checkboxes
        var currentTags = (item && item.tags) ? item.tags : [];
        var tagsHtml = '';
        Object.keys(COACH_TAGS).forEach(function(key) {
            var checked = currentTags.indexOf(key) !== -1 ? ' checked' : '';
            tagsHtml += '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:8px;cursor:pointer;">' +
                '<input type="checkbox" class="ad-cch-tag" value="' + key + '"' + checked + ' style="width:18px;height:18px;accent-color:var(--accent);appearance:auto;-webkit-appearance:auto;">' +
                '<span>' + COACH_TAGS[key] + '</span>' +
            '</label>';
        });

        // Achievements list helpers
        function renderAchievementsHtml() {
            var html = '';
            cchAchievements.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement" data-idx="' + idx + '" value="' + esc(ach) + '" style="flex:1;">' +
                    (cchAchievements.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            return html;
        }
        function renderAchievementsEnHtml() {
            var html = '';
            cchAchievementsEn.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement-en" data-idx="' + idx + '" value="' + esc(ach) + '" style="flex:1;">' +
                    (cchAchievementsEn.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-en-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            return html;
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adCchBack">' + L.back + '</button>' +
            '</div>' +

            // Promoted badge (read-only)
            (item && item.promoted
                ? '<div class="ad-form-card"><span class="ad-pay-badge ad-pay-active">⭐ ' + L.cchPromotedBadge + '</span> <span style="color:var(--text-dim);font-size:0.8rem;">' + L.cchPromotedHint + '</span></div>'
                : '') +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchPhoto + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adCchImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adCchImgInput" style="display:none">' +
                '<div style="display:flex;gap:8px;margin-top:8px;">' +
                    '<input type="text" class="ad-field-input" id="adCchImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (cchImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // ФИО (Last Name / First Name / Patronymic) — RU
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Full Name' : 'ФИО') + '</div>' +
                '<div style="font-weight:600;margin-bottom:6px;">RU</div>' +
                '<div class="ad-form-row" style="grid-template-columns:1fr 1fr 1fr;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchLastName" value="' + esc(item ? item.last_name : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchFirstName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchFirstName" value="' + esc(item ? item.first_name : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPatronymic + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPatronymic" value="' + esc(item ? item.patronymic : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div style="font-weight:600;margin-top:14px;margin-bottom:6px;">EN' +
                    '<button type="button" class="ad-btn-translate" data-src="adCchLastName" data-target="adCchLastNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchLastNameEn" value="' + esc(item ? item.last_name_en : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchFirstName + ' ' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchFirstName" data-target="adCchFirstNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchFirstNameEn" value="' + esc(item ? item.first_name_en : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Position + Tags
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchPosition + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPosition" placeholder="' + (isEn ? 'Head coach' : 'Старший тренер') + '" value="' + esc(item ? item.position : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchPosition" data-target="adCchPositionEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPositionEn" value="' + esc(item ? item.position_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field" style="margin-top:12px;">' +
                    '<label class="ad-field-label">' + L.cchTags + '</label>' +
                    '<div>' + tagsHtml + '</div>' +
                '</div>' +
            '</div>' +

            // Stats + Price (experience + price only)
            '<div class="ad-form-card">' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchExperience + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adCchExp" value="' + (item ? item.experience || '' : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPrice + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adCchPrice" value="' + (item ? item.price || '' : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Court (dropdown from DB)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchCourt + '</div>' +
                '<select class="ad-field-input" id="adCchCourt">' + courtOptionsHtml + '</select>' +
            '</div>' +

            // Contacts
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Contacts' : 'Контакты') + '</div>' +
                '<div class="ad-form-row" style="grid-template-columns:1fr 1fr 1fr;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPhone + '</label>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                            '<span style="white-space:nowrap;font-weight:600;color:var(--accent);">🇰🇬 +996</span>' +
                            '<input type="text" class="ad-field-input ad-cch-phone-fmt" id="adCchPhone" placeholder="555 12-34-56" value="' + phoneToLocal(item ? item.phone : '') + '" inputmode="numeric">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchTelegram + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchTelegram" placeholder="@username" value="' + esc(item ? item.telegram : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchWhatsapp + '</label>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                            '<span style="white-space:nowrap;font-weight:600;color:var(--accent);">🇰🇬 +996</span>' +
                            '<input type="text" class="ad-field-input ad-cch-phone-fmt" id="adCchWhatsapp" placeholder="555 12-34-56" value="' + phoneToLocal(item ? item.whatsapp : '') + '" inputmode="numeric">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Short description
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchShortDesc + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchShortDesc" rows="2">' + esc(item ? item.short_desc : '') + '</textarea>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchShortDesc" data-target="adCchShortDescEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchShortDescEn" rows="2">' + esc(item ? item.short_desc_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Bio
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchBio + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchBio" rows="4">' + esc(item ? item.bio : '') + '</textarea>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchBio" data-target="adCchBioEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchBioEn" rows="4">' + esc(item ? item.bio_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Achievements RU
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchAchievements + '</div>' +
                '<div style="font-weight:600;margin-bottom:6px;">RU</div>' +
                '<div id="adCchAchievements">' + renderAchievementsHtml() + '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchAchAdd">' + L.cchAchievementAdd + '</button>' +
                '<div style="font-weight:600;margin-top:14px;margin-bottom:6px;">EN' +
                    '<button type="button" class="ad-btn-translate" id="adCchAchTranslateAll">&#127760; ' + L.translateBtn + '</button>' +
                '</div>' +
                '<div id="adCchAchievementsEn">' + renderAchievementsEnHtml() + '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchAchAddEn">' + L.cchAchievementAdd + '</button>' +
            '</div>' +

            // Actions
            '<div class="ad-form-actions">' +
                '<button class="ad-btn ad-btn-primary" id="adCchSave">' + L.save + '</button>' +
                (cchEditingId ? '<button class="ad-btn ad-btn-danger" id="adCchDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // Back
        document.getElementById('adCchBack').addEventListener('click', function() {
            renderCoachesList();
        });

        // Achievements RU: add/remove/edit
        function renderAchievementsUI() {
            var el = document.getElementById('adCchAchievements');
            if (!el) return;
            var html = '';
            cchAchievements.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement" data-idx="' + idx + '" value="' + esc(ach) + '" style="flex:1;">' +
                    (cchAchievements.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            el.innerHTML = html;
        }
        document.getElementById('adCchAchAdd').addEventListener('click', function() {
            cchAchievements.push('');
            renderAchievementsUI();
        });
        document.getElementById('adCchAchievements').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-cch-ach-remove');
            if (!rmBtn) return;
            cchAchievements.splice(parseInt(rmBtn.dataset.idx, 10), 1);
            renderAchievementsUI();
        });
        document.getElementById('adCchAchievements').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement')) return;
            cchAchievements[parseInt(e.target.dataset.idx, 10)] = e.target.value;
        });

        // Achievements EN: add/remove/edit
        function renderAchievementsEnUI() {
            var el = document.getElementById('adCchAchievementsEn');
            if (!el) return;
            var html = '';
            cchAchievementsEn.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement-en" data-idx="' + idx + '" value="' + esc(ach) + '" style="flex:1;">' +
                    (cchAchievementsEn.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-en-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            el.innerHTML = html;
        }
        document.getElementById('adCchAchAddEn').addEventListener('click', function() {
            cchAchievementsEn.push('');
            renderAchievementsEnUI();
        });
        document.getElementById('adCchAchievementsEn').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-cch-ach-en-remove');
            if (!rmBtn) return;
            cchAchievementsEn.splice(parseInt(rmBtn.dataset.idx, 10), 1);
            renderAchievementsEnUI();
        });
        document.getElementById('adCchAchievementsEn').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement-en')) return;
            cchAchievementsEn[parseInt(e.target.dataset.idx, 10)] = e.target.value;
        });

        // Translate all achievements RU → EN
        document.getElementById('adCchAchTranslateAll').addEventListener('click', function() {
            var btn = this;
            var ruItems = cchAchievements.filter(function(a) { return a.trim(); });
            if (ruItems.length === 0) { showToast(L.fillRuFirst, 'error'); return; }
            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;
            var joined = ruItems.join('\n');
            translateFromRu(joined, 'en').then(function(result) {
                var translated = result.split('\n');
                cchAchievementsEn = [];
                for (var i = 0; i < ruItems.length; i++) {
                    cchAchievementsEn.push(translated[i] || '');
                }
                renderAchievementsEnUI();
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Image upload
        var imgZone = document.getElementById('adCchImgZone');
        var imgInput = document.getElementById('adCchImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                cchImageFile = imgInput.files[0];
                previewCchImage(URL.createObjectURL(cchImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                cchImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewCchImage(URL.createObjectURL(cchImageFile));
            }
        });

        setupCchImgRemove();

        document.getElementById('adCchImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adCchImgUrl').value.trim();
            if (url) {
                cchImageFile = null;
                cchImageUrl = url;
                previewCchImage(url);
            }
        });

        // Phone/WhatsApp formatting (KG: +996 XXX XX-XX-XX)
        container.querySelectorAll('.ad-cch-phone-fmt').forEach(function(inp) {
            inp.addEventListener('input', function() {
                var digits = inp.value.replace(/\D/g, '');
                if (digits.length > 9) digits = digits.substr(0, 9);
                var formatted = '';
                if (digits.length > 0) formatted = digits.substr(0, 3);
                if (digits.length > 3) formatted += ' ' + digits.substr(3, 2);
                if (digits.length > 5) formatted += '-' + digits.substr(5, 2);
                if (digits.length > 7) formatted += '-' + digits.substr(7, 2);
                inp.value = formatted;
            });
        });

        // Auto-transliterate names RU → EN on blur
        var cchNamePairs = [
            ['adCchLastName', 'adCchLastNameEn'],
            ['adCchFirstName', 'adCchFirstNameEn']
        ];
        cchNamePairs.forEach(function(pair) {
            var srcEl = document.getElementById(pair[0]);
            var targetEl = document.getElementById(pair[1]);
            if (!srcEl || !targetEl) return;
            srcEl.addEventListener('blur', function() {
                var srcText = srcEl.value.trim();
                if (!srcText || targetEl.value.trim()) return;
                targetEl.value = transliterate(srcText);
            });
        });

        // Auto-translate text fields RU → EN on blur (API)
        var cchTranslatePairs = [
            ['adCchPosition', 'adCchPositionEn'],
            ['adCchShortDesc', 'adCchShortDescEn'],
            ['adCchBio', 'adCchBioEn']
        ];
        cchTranslatePairs.forEach(function(pair) {
            var srcEl = document.getElementById(pair[0]);
            var targetEl = document.getElementById(pair[1]);
            if (!srcEl || !targetEl) return;
            srcEl.addEventListener('blur', function() {
                var srcText = srcEl.value.trim();
                if (!srcText || targetEl.value.trim()) return;
                targetEl.placeholder = L.translating || 'Translating...';
                translateFromRu(srcText, 'en').then(function(result) {
                    if (!targetEl.value.trim()) targetEl.value = result;
                    targetEl.placeholder = '';
                }).catch(function() {
                    targetEl.placeholder = '';
                });
            });
        });

        // Auto-translate achievements RU → EN on blur
        document.getElementById('adCchAchievements').addEventListener('focusout', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement')) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            var ruText = cchAchievements[idx];
            if (!ruText || !ruText.trim()) return;
            // Ensure EN slot exists
            while (cchAchievementsEn.length <= idx) cchAchievementsEn.push('');
            if (cchAchievementsEn[idx] && cchAchievementsEn[idx].trim()) return;
            translateFromRu(ruText, 'en').then(function(result) {
                if (!cchAchievementsEn[idx] || !cchAchievementsEn[idx].trim()) {
                    cchAchievementsEn[idx] = result;
                    renderAchievementsEnUI();
                }
            }).catch(function() {});
        });

        // Manual translate buttons (fallback)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate');
            if (!btn) return;
            var srcId = btn.dataset.src;
            var targetId = btn.dataset.target;
            var toLang = btn.dataset.tolang;
            var srcEl = document.getElementById(srcId);
            var targetEl = document.getElementById(targetId);
            if (!srcEl || !targetEl) return;

            var srcText = srcEl.value.trim();
            if (!srcText) {
                showToast(L.fillRuFirst, 'error');
                return;
            }

            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;

            translateFromRu(srcText, toLang).then(function(result) {
                targetEl.value = result;
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Save
        document.getElementById('adCchSave').addEventListener('click', saveCoachHandler);

        // Delete
        var delBtn = document.getElementById('adCchDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.cchDeleteConfirm, L.deleteConfirmText, function() {
                    deleteCoachHandler();
                });
            });
        }
    }

    function previewCchImage(src) {
        var zone = document.getElementById('adCchImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + esc(src) + '" class="ad-image-upload-preview" id="adCchImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adCchImgRemove">&times;</button>';
        setupCchImgRemove();
    }

    function setupCchImgRemove() {
        var rmBtn = document.getElementById('adCchImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                cchImageFile = null;
                cchImageUrl = '';
                var zone = document.getElementById('adCchImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adCchImgUrl').value = '';
                document.getElementById('adCchImgInput').value = '';
            });
        }
    }

    // ---- Save Coach ----
    async function saveCoachHandler() {
        var saveBtn = document.getElementById('adCchSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Photo
            var imageUrl = cchImageUrl;
            if (cchImageFile) {
                imageUrl = await uploadCoachImage(cchImageFile);
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Tags
            var tags = [];
            document.querySelectorAll('.ad-cch-tag:checked').forEach(function(cb) {
                tags.push(cb.value);
            });

            // Achievements (filter empty)
            var achievements = cchAchievements.filter(function(a) { return a.trim(); });

            var lastName = document.getElementById('adCchLastName').value.trim();
            var firstName = document.getElementById('adCchFirstName').value.trim();
            var lastNameEn = document.getElementById('adCchLastNameEn').value.trim();
            var firstNameEn = document.getElementById('adCchFirstNameEn').value.trim();

            // Court from dropdown
            var courtSelect = document.getElementById('adCchCourt');
            var courtOpt = courtSelect.options[courtSelect.selectedIndex];
            var courtName = courtOpt && courtOpt.dataset.name ? courtOpt.dataset.name : '';
            var courtNameEn = courtOpt && courtOpt.dataset.nameEn ? courtOpt.dataset.nameEn : '';

            // Phone & WhatsApp: add +996 prefix
            var phoneLocal = document.getElementById('adCchPhone').value.replace(/\D/g, '');
            var waLocal = document.getElementById('adCchWhatsapp').value.replace(/\D/g, '');

            var data = {
                last_name: lastName || null,
                first_name: firstName || null,
                patronymic: document.getElementById('adCchPatronymic').value.trim() || null,
                last_name_en: lastNameEn || null,
                first_name_en: firstNameEn || null,
                name: (lastName + ' ' + firstName).trim(),
                name_en: (lastNameEn + ' ' + firstNameEn).trim() || null,
                photo: imageUrl || null,
                position: document.getElementById('adCchPosition').value.trim() || null,
                position_en: document.getElementById('adCchPositionEn').value.trim() || null,
                tags: tags,
                experience: parseInt(document.getElementById('adCchExp').value, 10) || 0,
                price: parseInt(document.getElementById('adCchPrice').value, 10) || 0,
                short_desc: document.getElementById('adCchShortDesc').value.trim() || null,
                short_desc_en: document.getElementById('adCchShortDescEn').value.trim() || null,
                bio: document.getElementById('adCchBio').value.trim() || null,
                bio_en: document.getElementById('adCchBioEn').value.trim() || null,
                achievements: achievements,
                achievements_en: cchAchievementsEn.filter(function(a) { return a.trim(); }),
                court: courtName || null,
                court_en: courtNameEn || null,
                phone: phoneLocal ? '+996' + phoneLocal : null,
                telegram: document.getElementById('adCchTelegram').value.trim() || null,
                whatsapp: waLocal ? '+996' + waLocal : null
            };

            if (!lastName) {
                showToast(isEn ? 'Last name is required' : 'Фамилия обязательна', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (cchEditingId) {
                result = await client.from('coaches').update(data).eq('id', cchEditingId);
            } else {
                data.id = slugify(lastName + ' ' + firstName);
                result = await client.from('coaches').insert(data);
            }

            if (result.error) {
                showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            showToast(L.saved, 'success');
            renderCoachesList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Coach ----
    async function deleteCoachHandler() {
        if (!cchEditingId) return;
        var result = await client.from('coaches').delete().eq('id', cchEditingId);
        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }
        showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderCoachesList();
    }

    // ---- Upload Coach Image ----
    async function uploadCoachImage(file) {
        if (!client || !file) return null;
        var ext = file.name.split('.').pop().toLowerCase();
        var filename = 'cch-' + Date.now() + '-' + Math.random().toString(36).substr(2, 8) + '.' + ext;
        try {
            var result = await client.storage.from('news').upload(filename, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (result.error) {
                showToast('Upload: ' + result.error.message, 'error');
                return null;
            }
            var urlResult = client.storage.from('news').getPublicUrl(filename);
            return urlResult.data ? urlResult.data.publicUrl : null;
        } catch (e) {
            showToast('Upload exception: ' + e.message, 'error');
            return null;
        }
    }

    // ============================================
    // BULK DELETE (universal for all list tables)
    // ============================================

    /**
     * Setup bulk delete for a list table.
     * @param {Object} opts
     *   tableId   - id of <table> element
     *   rowAttr   - data attribute on <tr> for item id, e.g. 'data-id'
     *   tableName - Supabase table name
     *   reloadFn  - function to reload the list after delete
     *   confirmMsg - confirmation message
     */
    function setupBulkDelete(opts) {
        var table = document.getElementById(opts.tableId);
        if (!table) return;

        // Guard: don't set up twice
        if (table.querySelector('.ad-bulk-all')) return;

        var thead = table.querySelector('thead tr');
        if (!thead) return;

        // Add checkbox header
        var thCheck = document.createElement('th');
        thCheck.style.width = '36px';
        thCheck.innerHTML = '<input type="checkbox" class="ad-bulk-all" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">';
        thead.insertBefore(thCheck, thead.firstChild);

        // Add bulk delete button (hidden initially)
        var btnWrap = document.createElement('div');
        btnWrap.className = 'ad-bulk-actions';
        btnWrap.style.display = 'none';
        btnWrap.innerHTML = '<button class="ad-btn ad-btn-danger ad-btn-sm ad-bulk-delete-btn">' + L.deleteSelected + ' (<span class="ad-bulk-count">0</span>)</button>';
        table.parentNode.parentNode.insertBefore(btnWrap, table.parentNode);

        var checkAll = thCheck.querySelector('.ad-bulk-all');
        var bulkBtn = btnWrap.querySelector('.ad-bulk-delete-btn');
        var countEl = btnWrap.querySelector('.ad-bulk-count');

        function updateBulkUI() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var total = table.querySelectorAll('tbody .ad-bulk-item');
            var count = checked.length;
            btnWrap.style.display = count > 0 ? 'flex' : 'none';
            countEl.textContent = count;
            checkAll.checked = total.length > 0 && count === total.length;
        }

        // Select all
        checkAll.addEventListener('change', function() {
            var boxes = table.querySelectorAll('tbody .ad-bulk-item');
            boxes.forEach(function(cb) { cb.checked = checkAll.checked; });
            updateBulkUI();
        });

        // Individual checkboxes (delegate)
        table.addEventListener('change', function(e) {
            if (e.target.classList.contains('ad-bulk-item')) {
                updateBulkUI();
            }
        });

        // Prevent row click when clicking checkbox
        table.addEventListener('click', function(e) {
            if (e.target.classList.contains('ad-bulk-item') || e.target.closest('.ad-bulk-cell')) {
                e.stopPropagation();
            }
        });

        // Bulk delete
        bulkBtn.addEventListener('click', function() {
            var checked = table.querySelectorAll('tbody .ad-bulk-item:checked');
            var ids = [];
            checked.forEach(function(cb) { ids.push(cb.dataset.bulkId); });
            if (ids.length === 0) return;

            showConfirm(opts.confirmMsg || L.deleteSelectedConfirm, L.deleteConfirmText, async function() {
                var result = await client.from(opts.tableName).delete().in('id', ids);
                if (result.error) {
                    showToast(result.error.message, 'error');
                } else {
                    showToast(isEn ? 'Deleted ' + ids.length + ' items' : 'Удалено: ' + ids.length, 'success');
                    opts.reloadFn();
                }
            });
        });
    }

    /**
     * Returns checkbox TD html for a row.
     */
    function bulkCheckboxTd(id) {
        return '<td class="ad-bulk-cell" style="width:36px;text-align:center;">' +
            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
        '</td>';
    }

    // ============================================
    // RATINGS SECTION
    // ============================================

    var cachedLevels = [];
    var cachedRules = {};
    var ROUND_KEYS = ['W', 'F', '3RD', '4TH', 'SF', 'QF', 'R16', 'R32'];
    var ROUND_LABELS = { W: L.ratW, F: L.ratF, '3RD': L.rat3RD, '4TH': L.rat4TH, SF: L.ratSF, QF: L.ratQF, R16: L.ratR16, R32: L.ratR32 };

    async function loadTournamentLevels() {
        if (cachedLevels.length > 0) return;
        var res = await client.from('tournament_levels').select('*').order('sort_order');
        cachedLevels = res.data || [];
    }

    async function loadPointsRules() {
        var res = await client.from('points_rules').select('*');
        cachedRules = {};
        (res.data || []).forEach(function(r) {
            if (!cachedRules[r.level_id]) cachedRules[r.level_id] = {};
            cachedRules[r.level_id][r.round] = { id: r.id, points: r.points };
        });
    }

    function renderRatingsSection() {
        var container = document.getElementById('ad-ratings');
        if (!container) return;
        var isAdm = currentRole === 'admin';

        var tabsHtml = '<button class="ad-rat-tab active" data-rattab="rankings">' + L.ratSubRankings + '</button>';
        var panelsHtml = '<div class="ad-rat-panel active" id="ratPanelRankings"></div>';

        if (isAdm) {
            tabsHtml +=
                '<button class="ad-rat-tab" data-rattab="results">' + L.ratSubResults + '</button>' +
                '<button class="ad-rat-tab" data-rattab="rules">' + L.ratSubRules + '</button>' +
                '<button class="ad-rat-tab" data-rattab="promotions">' + L.ratSubPromotions + '</button>';
            panelsHtml +=
                '<div class="ad-rat-panel" id="ratPanelResults"></div>' +
                '<div class="ad-rat-panel" id="ratPanelRules"></div>' +
                '<div class="ad-rat-panel" id="ratPanelPromotions"></div>';
        }

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.ratings + '</h2>' +
            '<div class="ad-rat-tabs">' + tabsHtml + '</div>' +
            panelsHtml;

        // Sub-tab switching
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-rat-tab');
            if (!tab) return;
            var key = tab.dataset.rattab;
            container.querySelectorAll('.ad-rat-tab').forEach(function(t) { t.classList.toggle('active', t === tab); });
            container.querySelectorAll('.ad-rat-panel').forEach(function(p) {
                p.classList.toggle('active', p.id === 'ratPanel' + key.charAt(0).toUpperCase() + key.slice(1));
            });
        });

        loadCategories().then(function() {
            loadTournamentLevels().then(function() {
                loadPointsRules().then(function() {
                    renderRatRankings();
                    if (isAdm) {
                        renderRatResults();
                        renderRatRules();
                        renderRatPromotions();
                    }
                });
            });
        });
    }

    // ---- Rankings Sub-tab ----
    function renderRatRankings() {
        var panel = document.getElementById('ratPanelRankings');
        if (!panel) return;

        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-rat-filters">' +
                '<select class="ad-field-select" id="ratCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="ratRankingsBody"></div>';

        document.getElementById('ratCatFilter').addEventListener('change', function() {
            loadRatRankings(this.value);
        });

        loadRatRankings('');
    }

    async function loadRatRankings(categoryId) {
        var body = document.getElementById('ratRankingsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        var query = client.from('players').select('*, categories(name, name_en, gender)').order('points', { ascending: false });
        if (categoryId) query = query.eq('category_id', categoryId);
        var res = await query;
        var players = res.data || [];

        if (players.length === 0) {
            body.innerHTML = '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
            return;
        }

        // Group by category
        var groups = {};
        players.forEach(function(p) {
            var catId = p.category_id || 'none';
            if (!groups[catId]) groups[catId] = [];
            groups[catId].push(p);
        });

        // Sort category keys by sort_order descending (Pro-Masters first)
        var sortedCatIds = Object.keys(groups).sort(function(a, b) {
            var orderA = categoriesMap[a] ? (categoriesMap[a].sort_order || 0) : 0;
            var orderB = categoriesMap[b] ? (categoriesMap[b].sort_order || 0) : 0;
            return orderB - orderA;
        });

        var html = '';
        sortedCatIds.forEach(function(catId) {
            var catPlayers = groups[catId];
            var catName = '';
            if (catId !== 'none' && categoriesMap[catId]) {
                catName = isEn ? (categoriesMap[catId].name_en || categoriesMap[catId].name) : categoriesMap[catId].name;
            }

            if (!categoryId) {
                html += '<h3 class="ad-rat-cat-title">' + (catName || 'N/A') + '</h3>';
            }

            html += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th style="width:50px">' + L.ratRank + '</th>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th style="width:80px">' + L.ratPoints + '</th>' +
                '<th style="width:80px">' + L.ratWL + '</th>' +
                '<th style="width:100px">' + L.ratForm + '</th>' +
            '</tr></thead><tbody>';

            catPlayers.forEach(function(p, i) {
                var formHtml = '';
                (p.form || []).forEach(function(f) {
                    formHtml += '<span class="ad-rat-form-' + f.toLowerCase() + '">' + f + '</span>';
                });
                var name = isEn ? (p.name_en || p.name) : p.name;
                var changeIcon = p.rank_change > 0 ? '<span style="color:#4caf50">&#9650;</span>' :
                                 p.rank_change < 0 ? '<span style="color:#f44336">&#9660;</span>' : '';

                html += '<tr>' +
                    '<td>' + (i + 1) + ' ' + changeIcon + '</td>' +
                    '<td>' + esc(name) + '</td>' +
                    '<td><strong>' + (p.points || 0) + '</strong></td>' +
                    '<td>' + (p.wins || 0) + '/' + (p.losses || 0) + '</td>' +
                    '<td class="ad-rat-form-cell">' + formHtml + '</td>' +
                '</tr>';
            });

            html += '</tbody></table></div></div>';
        });

        body.innerHTML = html;
    }

    // ---- Tournament Results Sub-tab ----
    function renderRatResults() {
        var panel = document.getElementById('ratPanelResults');
        if (!panel) return;

        panel.innerHTML =
            '<div class="ad-rat-filters">' +
                '<select class="ad-field-select" id="ratTrnSelect" style="flex:1;max-width:400px;">' +
                    '<option value="">' + L.ratSelectTournament + '</option>' +
                '</select>' +
                '<span class="ad-rat-hint">' + L.ratCompletedOnly + '</span>' +
            '</div>' +
            '<div id="ratResultsBody"></div>';

        // Load completed tournaments
        loadCompletedTournaments();

        document.getElementById('ratTrnSelect').addEventListener('change', function() {
            if (this.value) loadTournamentResults(this.value);
            else document.getElementById('ratResultsBody').innerHTML = '';
        });
    }

    async function loadCompletedTournaments() {
        var sel = document.getElementById('ratTrnSelect');
        if (!sel) return;
        var res = await client.from('tournaments').select('*').eq('status', 'completed').order('date_start', { ascending: false });
        var tournaments = res.data || [];
        var html = '<option value="">' + L.ratSelectTournament + '</option>';
        tournaments.forEach(function(t) {
            var title = isEn ? (t.title_en || t.title) : t.title;
            var date = t.date_start ? t.date_start.substring(0, 10) : '';
            html += '<option value="' + t.id + '" data-level="' + (t.level_id || '') + '" data-category="' + (t.category_id || '') + '">' + esc(title) + ' (' + date + ')' + '</option>';
        });
        sel.innerHTML = html;
    }

    async function loadTournamentResults(tournamentId) {
        var body = document.getElementById('ratResultsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load existing results
        var res = await client.from('tournament_results').select('*, players(name, name_en)').eq('tournament_id', tournamentId);
        var results = res.data || [];

        // Load tournament info
        var trnRes = await client.from('tournaments').select('*, tournament_levels(name, name_en)').eq('id', tournamentId).single();
        var tournament = trnRes.data;

        // Load all players for dropdown
        var plrRes = await client.from('players').select('id, name, name_en, category_id').order('name');
        var allPlayers = plrRes.data || [];

        var levelName = '';
        if (tournament && tournament.tournament_levels) {
            levelName = isEn ? (tournament.tournament_levels.name_en || tournament.tournament_levels.name) : tournament.tournament_levels.name;
        }

        var levelHtml = levelName
            ? '<div class="ad-rat-level-badge">' + L.ratTournamentLevel + ': <strong>' + esc(levelName) + '</strong></div>'
            : '<div class="ad-rat-level-badge" style="color:#f44336;">' + L.ratTournamentLevel + ': ' + (isEn ? 'Not set! Edit tournament to assign level.' : 'Не задан! Отредактируйте турнир для назначения уровня.') + '</div>';

        // Player dropdown options
        var plrOpts = '<option value="">' + L.ratSelectPlayer + '</option>';
        allPlayers.forEach(function(p) {
            var name = isEn ? (p.name_en || p.name) : p.name;
            var cat = categoriesMap[p.category_id] ? (isEn ? categoriesMap[p.category_id].name_en : categoriesMap[p.category_id].name) : '';
            plrOpts += '<option value="' + p.id + '">' + esc(name) + (cat ? ' [' + cat + ']' : '') + '</option>';
        });

        // Round dropdown
        var roundOpts = '';
        ROUND_KEYS.forEach(function(r) {
            roundOpts += '<option value="' + r + '">' + ROUND_LABELS[r] + '</option>';
        });

        var html = levelHtml +
            '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table" id="ratResultsTable"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th style="width:160px">' + L.ratRound + '</th>' +
                '<th style="width:80px">' + L.ratPointsEarned + '</th>' +
                '<th style="width:50px"></th>' +
            '</tr></thead><tbody id="ratResultsTbody">';

        results.forEach(function(r) {
            var name = r.players ? (isEn ? (r.players.name_en || r.players.name) : r.players.name) : '?';
            html += renderResultRow(r.id, r.player_id, name, r.round_reached, r.points_earned, plrOpts, roundOpts, true);
        });

        html += '</tbody></table></div></div>' +
            '<div class="ad-rat-actions">' +
                '<button class="ad-btn-secondary" id="ratAddResultBtn">' + L.ratAddResult + '</button>' +
                '<button class="ad-btn-primary" id="ratSaveResultsBtn">' + L.ratSaveResults + '</button>' +
            '</div>';

        body.innerHTML = html;
        body.dataset.tournamentId = tournamentId;
        body.dataset.levelId = tournament ? (tournament.level_id || '') : '';

        // Add result row
        document.getElementById('ratAddResultBtn').addEventListener('click', function() {
            var tbody = document.getElementById('ratResultsTbody');
            var tr = document.createElement('tr');
            tr.innerHTML = renderResultRowInner('', '', '', 'W', 0, plrOpts, roundOpts, false);
            tbody.appendChild(tr);
            updateResultPoints(tr);
        });

        // Save results
        document.getElementById('ratSaveResultsBtn').addEventListener('click', function() {
            saveResults(tournamentId);
        });

        // Delegate round change → auto-calc points
        document.getElementById('ratResultsTable').addEventListener('change', function(e) {
            if (e.target.classList.contains('rat-round-select')) {
                updateResultPoints(e.target.closest('tr'));
            }
        });
    }

    function renderResultRow(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) {
        return '<tr data-result-id="' + (id || '') + '">' +
            renderResultRowInner(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) +
        '</tr>';
    }

    function renderResultRowInner(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) {
        // Player cell: if existing show name, else show dropdown
        var playerCell = existing
            ? '<td>' + esc(playerName) + '<input type="hidden" class="rat-player-id" value="' + playerId + '"></td>'
            : '<td><select class="ad-field-select rat-player-select">' + plrOpts.replace('value="' + playerId + '"', 'value="' + playerId + '" selected') + '</select></td>';

        // Round dropdown
        var roundCell = '<td><select class="ad-field-select rat-round-select">';
        ROUND_KEYS.forEach(function(r) {
            roundCell += '<option value="' + r + '"' + (r === round ? ' selected' : '') + '>' + ROUND_LABELS[r] + '</option>';
        });
        roundCell += '</select></td>';

        // Points (auto-calculated, readonly)
        var pointsCell = '<td><span class="rat-points-display">' + (points || 0) + '</span></td>';

        // Delete button
        var deleteCell = '<td><button class="ad-btn-icon rat-delete-row" title="' + L.delete + '">&times;</button></td>';

        return playerCell + roundCell + pointsCell + deleteCell;
    }

    function updateResultPoints(tr) {
        if (!tr) return;
        var body = document.getElementById('ratResultsBody');
        var levelId = body ? body.dataset.levelId : '';
        var roundSel = tr.querySelector('.rat-round-select');
        var pointsSpan = tr.querySelector('.rat-points-display');
        if (!roundSel || !pointsSpan) return;

        var round = roundSel.value;
        var pts = 0;
        if (levelId && cachedRules[levelId] && cachedRules[levelId][round]) {
            pts = cachedRules[levelId][round].points;
        }
        pointsSpan.textContent = pts;
    }

    async function saveResults(tournamentId) {
        var tbody = document.getElementById('ratResultsTbody');
        if (!tbody) return;
        var rows = tbody.querySelectorAll('tr');
        var body = document.getElementById('ratResultsBody');
        var levelId = body ? body.dataset.levelId : '';
        var season = new Date().getFullYear();

        var toUpsert = [];
        var toDelete = [];

        rows.forEach(function(tr) {
            var existingId = tr.dataset.resultId;
            var playerInput = tr.querySelector('.rat-player-id') || tr.querySelector('.rat-player-select');
            var playerId = playerInput ? playerInput.value : '';
            var roundSel = tr.querySelector('.rat-round-select');
            var round = roundSel ? roundSel.value : 'W';

            if (!playerId) return;

            var pts = 0;
            if (levelId && cachedRules[levelId] && cachedRules[levelId][round]) {
                pts = cachedRules[levelId][round].points;
            }

            var record = {
                tournament_id: tournamentId,
                player_id: playerId,
                round_reached: round,
                points_earned: pts,
                season: season
            };
            if (existingId) record.id = existingId;

            toUpsert.push(record);
        });

        if (toUpsert.length === 0) {
            showToast(isEn ? 'No results to save' : 'Нет результатов для сохранения', 'error');
            return;
        }

        var res = await client.from('tournament_results').upsert(toUpsert, { onConflict: 'tournament_id,player_id' });
        if (res.error) {
            showToast(res.error.message, 'error');
            return;
        }

        // Recalculate points for affected players
        await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));

        showToast(L.ratResultsSaved, 'success');
        loadTournamentResults(tournamentId);
    }

    async function recalcPlayerPoints(playerIds) {
        var unique = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        for (var i = 0; i < unique.length; i++) {
            var pid = unique[i];
            // Get all results for this player in current season
            var res = await client.from('tournament_results').select('points_earned').eq('player_id', pid);
            var total = 0;
            var wins = 0;
            var losses = 0;
            (res.data || []).forEach(function(r) {
                total += r.points_earned || 0;
                if (r.round_reached === 'W') wins++;
                else losses++;
            });

            await client.from('players').update({ points: total, wins: wins, losses: losses }).eq('id', pid);
        }
    }

    // ---- Points Rules Sub-tab ----
    function renderRatRules() {
        var panel = document.getElementById('ratPanelRules');
        if (!panel) return;

        if (cachedLevels.length === 0) {
            panel.innerHTML = '<div class="ad-empty-state"><p>' + L.ratNoLevels + '</p></div>';
            return;
        }

        var html = '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table" id="ratRulesTable"><thead><tr>' +
            '<th>' + L.ratRound + '</th>';

        cachedLevels.forEach(function(lv) {
            var name = isEn ? (lv.name_en || lv.name) : lv.name;
            html += '<th style="text-align:center;">' + esc(name) + '</th>';
        });
        html += '</tr></thead><tbody>';

        ROUND_KEYS.forEach(function(round) {
            html += '<tr><td><strong>' + ROUND_LABELS[round] + '</strong></td>';
            cachedLevels.forEach(function(lv) {
                var val = (cachedRules[lv.id] && cachedRules[lv.id][round]) ? cachedRules[lv.id][round].points : 0;
                html += '<td style="text-align:center;"><input type="number" class="ad-field-input rat-rule-input" ' +
                    'data-level="' + lv.id + '" data-round="' + round + '" ' +
                    'value="' + val + '" min="0" style="width:70px;text-align:center;"></td>';
            });
            html += '</tr>';
        });

        html += '</tbody></table></div></div>' +
            '<div class="ad-rat-actions">' +
                '<button class="ad-btn-primary" id="ratSaveRulesBtn">' + L.ratSaveRules + '</button>' +
            '</div>';

        panel.innerHTML = html;

        document.getElementById('ratSaveRulesBtn').addEventListener('click', savePointsRules);
    }

    async function savePointsRules() {
        var inputs = document.querySelectorAll('.rat-rule-input');
        var toUpsert = [];

        inputs.forEach(function(inp) {
            var levelId = inp.dataset.level;
            var round = inp.dataset.round;
            var pts = parseInt(inp.value, 10) || 0;

            var existing = (cachedRules[levelId] && cachedRules[levelId][round]) ? cachedRules[levelId][round].id : null;
            var record = { level_id: levelId, round: round, points: pts };
            if (existing) record.id = existing;
            toUpsert.push(record);
        });

        var res = await client.from('points_rules').upsert(toUpsert, { onConflict: 'level_id,round' });
        if (res.error) {
            showToast(res.error.message, 'error');
            return;
        }

        showToast(L.ratRulesSaved, 'success');
        await loadPointsRules();
    }

    // ---- Promotions Sub-tab ----
    function renderRatPromotions() {
        var panel = document.getElementById('ratPanelPromotions');
        if (!panel) return;

        panel.innerHTML =
            '<div class="ad-rat-info-banner">' + L.ratTop5Info + '</div>' +
            '<div id="ratPromotionsBody"></div>';

        loadPromotions();
    }

    async function loadPromotions() {
        var body = document.getElementById('ratPromotionsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load current promotions
        var res = await client.from('player_promotions').select('*, players(name, name_en), from_cat:categories!player_promotions_from_category_id_fkey(name, name_en), to_cat:categories!player_promotions_to_category_id_fkey(name, name_en)').order('created_at', { ascending: false });
        var promotions = res.data || [];

        // Group categories by gender, sort by sort_order ascending (Tour→Pro-Masters)
        var catsByGender = {};
        cachedCategories.forEach(function(c) {
            var g = c.gender || 'other';
            if (!catsByGender[g]) catsByGender[g] = [];
            catsByGender[g].push(c);
        });
        Object.keys(catsByGender).forEach(function(g) {
            catsByGender[g].sort(function(a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
        });

        // Build eligible list
        var eligibleHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Eligible for Promotion' : 'Доступны для промоушена') + '</h3>';
        var hasEligible = false;

        var genders = Object.keys(catsByGender);
        for (var gi = 0; gi < genders.length; gi++) {
            var genderCats = catsByGender[genders[gi]];
            var genderLabel = genders[gi] === 'men' ? (isEn ? 'Men' : 'Мужчины') : (isEn ? 'Women' : 'Женщины');

            for (var ci = 0; ci < genderCats.length - 1; ci++) {
                var cat = genderCats[ci];
                var nextCat = genderCats[ci + 1];
                var catName = isEn ? (cat.name_en || cat.name) : cat.name;
                var nextCatName = isEn ? (nextCat.name_en || nextCat.name) : nextCat.name;

                var plrRes = await client.from('players').select('id, name, name_en, points').eq('category_id', cat.id).order('points', { ascending: false }).limit(5);
                var top5 = plrRes.data || [];

                if (top5.length > 0) {
                    hasEligible = true;
                    eligibleHtml += '<div class="ad-table-card" style="margin-bottom:12px;">' +
                        '<div class="ad-table-card-title">' + genderLabel + ': ' + catName + ' → ' + nextCatName + '</div>' +
                        '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                        '<th>#</th><th>' + L.ratPlayer + '</th><th>' + L.ratPoints + '</th>' +
                        '</tr></thead><tbody>';

                    top5.forEach(function(p, idx) {
                        var name = isEn ? (p.name_en || p.name) : p.name;
                        eligibleHtml += '<tr><td>' + (idx + 1) + '</td><td>' + esc(name) + '</td><td>' + (p.points || 0) + '</td></tr>';
                    });
                    eligibleHtml += '</tbody></table></div></div>';
                }
            }
        }

        if (!hasEligible) {
            eligibleHtml += '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
        }

        // Existing promotions history
        var historyHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Promotion History' : 'История промоушенов') + '</h3>';

        if (promotions.length === 0) {
            historyHtml += '<div class="ad-empty-state"><p>' + L.ratNoPromotions + '</p></div>';
        } else {
            historyHtml += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th>' + L.ratFromCat + '</th>' +
                '<th>' + L.ratToCat + '</th>' +
                '<th>' + L.ratSeason + '</th>' +
                '<th>' + L.ratStatus + '</th>' +
            '</tr></thead><tbody>';

            promotions.forEach(function(pr) {
                var name = pr.players ? (isEn ? (pr.players.name_en || pr.players.name) : pr.players.name) : '?';
                var fromCat = pr.from_cat ? (isEn ? (pr.from_cat.name_en || pr.from_cat.name) : pr.from_cat.name) : '?';
                var toCat = pr.to_cat ? (isEn ? (pr.to_cat.name_en || pr.to_cat.name) : pr.to_cat.name) : '?';
                var statusLabel = pr.status === 'eligible' ? L.ratEligible : pr.status === 'transition' ? L.ratTransition : L.ratCompleted;
                var statusClass = 'ad-status-badge ad-status-' + pr.status;

                historyHtml += '<tr>' +
                    '<td>' + esc(name) + '</td>' +
                    '<td>' + esc(fromCat) + '</td>' +
                    '<td>' + esc(toCat) + '</td>' +
                    '<td>' + pr.season + '</td>' +
                    '<td><span class="' + statusClass + '">' + statusLabel + '</span></td>' +
                '</tr>';
            });
            historyHtml += '</tbody></table></div></div>';
        }

        body.innerHTML = eligibleHtml + historyHtml;
    }

    // Delete result row (delegate)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rat-delete-row')) {
            var tr = e.target.closest('tr');
            if (tr) tr.remove();
        }
    });

    // ============================================
    // MEMBERSHIPS
    // ============================================

    var memSearchQuery = '';
    var memFilterStatus = '';

    async function renderMembershipsSection() {
        renderMembershipsList();
    }

    // ---- Memberships List ----
    async function renderMembershipsList() {
        var container = document.getElementById('ad-memberships');
        if (!container) return;
        var isAdm = currentRole === 'admin';

        var statusFilterHtml = '<option value="">' + L.memAllStatuses + '</option>' +
            '<option value="active"' + (memFilterStatus === 'active' ? ' selected' : '') + '>' + L.memActive + '</option>' +
            '<option value="expiring"' + (memFilterStatus === 'expiring' ? ' selected' : '') + '>' + L.memExpiringSoon + '</option>' +
            '<option value="expired"' + (memFilterStatus === 'expired' ? ' selected' : '') + '>' + L.memExpired + '</option>' +
            '<option value="cancelled"' + (memFilterStatus === 'cancelled' ? ' selected' : '') + '>' + L.memCancelled + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.memberships + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adMemAdd">+ ' + L.memAdd + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adMemSearch" placeholder="' + L.memSearch + '" value="' + esc(memSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adMemStatusFilter">' + statusFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adMemTable">' +
                        '<thead><tr>' +
                            '<th>' + L.memUser + '</th>' +
                            '<th>' + L.memStatus + '</th>' +
                            '<th>' + L.memPayment + '</th>' +
                            '<th>' + L.memStartsAt + '</th>' +
                            '<th>' + L.memExpiresAt + '</th>' +
                            '<th>' + L.memDaysLeft + '</th>' +
                            '<th>' + L.memNote + '</th>' +
                            '<th></th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var memAddBtn = document.getElementById('adMemAdd');
        if (memAddBtn) {
            memAddBtn.addEventListener('click', function() {
                renderMembershipForm(null);
            });
        }

        var searchTimer = null;
        document.getElementById('adMemSearch').addEventListener('input', function() {
            memSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadMembershipsList(); }, 300);
        });

        document.getElementById('adMemStatusFilter').addEventListener('change', function() {
            memFilterStatus = this.value;
            loadMembershipsList();
        });

        await loadMembershipsList();
    }

    async function loadMembershipsList() {
        if (!client) return;
        var isAdm = currentRole === 'admin';

        var query = client.from('memberships')
            .select('id, profile_id, status, starts_at, expires_at, note, profiles!profile_id(full_name, email)')
            .order('created_at', { ascending: false });

        if (memFilterStatus && memFilterStatus !== 'expiring') {
            query = query.eq('status', memFilterStatus);
        }
        if (memFilterStatus === 'expiring') {
            query = query.eq('status', 'active');
        }

        var result = await query;
        if (result.error) console.error('Memberships query error:', JSON.stringify(result.error));

        var table = document.getElementById('adMemTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        // Load payments + telegram status separately to avoid join issues
        var memIds = items.map(function(m) { return m.id; });
        var profileIds = items.map(function(m) { return m.profile_id; }).filter(Boolean);
        var paymentsMap = {};
        var tgMap = {};
        if (memIds.length > 0) {
            var payResult = await client.from('payments').select('id, membership_id, status').in('membership_id', memIds);
            (payResult.data || []).forEach(function(p) {
                if (!paymentsMap[p.membership_id]) paymentsMap[p.membership_id] = [];
                paymentsMap[p.membership_id].push(p);
            });
        }
        if (profileIds.length > 0) {
            var tgResult = await client.from('profiles').select('id, telegram_chat_id').in('id', profileIds);
            (tgResult.data || []).forEach(function(p) {
                if (p.telegram_chat_id) tgMap[p.id] = true;
            });
        }

        // Client-side search filter
        if (memSearchQuery) {
            var q = memSearchQuery.toLowerCase();
            items = items.filter(function(m) {
                var name = (m.profiles && m.profiles.full_name || '').toLowerCase();
                var email = (m.profiles && m.profiles.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        // Client-side "expiring" filter (active + ≤7 days left)
        if (memFilterStatus === 'expiring') {
            var nowMs = new Date().setHours(0,0,0,0);
            items = items.filter(function(m) {
                if (!m.expires_at) return false;
                var exp = new Date(m.expires_at); exp.setHours(0,0,0,0);
                var diff = Math.ceil((exp - nowMs) / 86400000);
                return diff > 0 && diff <= 7;
            });
        }

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">💳</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.memNoMembers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.memNoMembersText + '</div>' +
                '</td></tr>';
            return;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        tbody.innerHTML = '';
        items.forEach(function(m) {
            var name = m.profiles ? esc(m.profiles.full_name || '') : '—';
            var email = m.profiles ? esc(m.profiles.email || '') : '';
            var hasTg = tgMap[m.profile_id];

            var statusClass = m.status === 'active' ? 'ad-mem-active' :
                              m.status === 'expired' ? 'ad-mem-expired' : 'ad-mem-cancelled';
            var statusLabel = m.status === 'active' ? L.memActive :
                              m.status === 'expired' ? L.memExpired : L.memCancelled;

            var daysLeft = '';
            var daysLeftNum = null;
            if (m.expires_at) {
                var exp = new Date(m.expires_at);
                exp.setHours(0, 0, 0, 0);
                var diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                daysLeftNum = diff > 0 ? diff : 0;
                daysLeft = daysLeftNum + (isEn ? ' d' : ' дн.');
                if (diff <= 0 && m.status === 'active') {
                    statusClass = 'ad-mem-expired';
                    statusLabel = L.memExpired;
                }
            }

            // Expiring soon badge (active + ≤7 days)
            var expiringBadge = '';
            if (m.status === 'active' && daysLeftNum !== null && daysLeftNum > 0 && daysLeftNum <= 7) {
                expiringBadge = ' <span class="ad-mem-badge ad-mem-expiring">' + L.memExpiringSoon + '</span>';
            }

            // Payment badge
            var payBadge = '';
            var payments = paymentsMap[m.id] || [];
            var hasPaid = payments.some(function(p) { return p.status === 'completed'; });
            if (hasPaid) {
                payBadge = '<span class="ad-mem-badge ad-mem-paid">' + L.memPaid + '</span>';
            } else {
                payBadge = '<span class="ad-mem-badge ad-mem-unpaid">' + L.memUnpaid + '</span>';
            }

            // Days left color
            var daysColor = 'var(--text-primary)';
            if (daysLeftNum !== null && daysLeftNum <= 3) {
                daysColor = '#f44336';
            } else if (daysLeftNum !== null && daysLeftNum <= 7) {
                daysColor = '#ff9800';
            }

            // Telegram indicator
            var tgBadge = hasTg ? '<span class="ad-mem-badge ad-mem-tg" title="Telegram connected">' + L.memTgConnected + '</span> ' : '';

            tbody.innerHTML +=
                '<tr data-mem-id="' + m.id + '">' +
                    (isAdm ? bulkCheckboxTd(m.id) : '') +
                    '<td>' +
                        '<div style="font-weight:500;">' + tgBadge + '<a href="#" class="ad-mem-profile-link" data-profile-id="' + m.profile_id + '" data-mem-id="' + m.id + '">' + name + '</a></div>' +
                        '<div style="font-size:0.75rem;color:var(--text-dim);">' + email + '</div>' +
                    '</td>' +
                    '<td><span class="ad-mem-badge ' + statusClass + '">' + statusLabel + '</span>' + expiringBadge + '</td>' +
                    '<td>' + payBadge + '</td>' +
                    '<td>' + (m.starts_at || '—') + '</td>' +
                    '<td>' + (m.expires_at || '—') + '</td>' +
                    '<td style="text-align:center;font-weight:600;color:' + daysColor + ';">' + daysLeft + '</td>' +
                    '<td style="color:var(--text-dim);font-size:0.75rem;">' + esc(m.note || '') + '</td>' +
                    (isAdm ? '<td class="ad-mem-actions">' +
                        '<button class="ad-btn-sm ad-btn-extend" data-id="' + m.id + '" title="' + L.memExtend + '">+1</button>' +
                        '<button class="ad-btn-sm ad-btn-cancel-mem" data-id="' + m.id + '" title="' + L.memCancel + '">✕</button>' +
                        '<button class="ad-btn-sm ad-btn-edit-mem" data-id="' + m.id + '" title="' + L.memEdit + '">✎</button>' +
                    '</td>' : '') +
                '</tr>';
        });

        if (isAdm) {
            setupBulkDelete({ tableId: 'adMemTable', tableName: 'memberships', reloadFn: loadMembershipsList });

            // Quick action: Extend
            tbody.querySelectorAll('.ad-btn-extend').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    if (confirm(L.memExtendConfirm)) extendMembership(id);
                });
            });

            // Quick action: Cancel
            tbody.querySelectorAll('.ad-btn-cancel-mem').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    if (confirm(L.memCancelConfirm)) cancelMembership(id);
                });
            });

            // Quick action: Edit
            tbody.querySelectorAll('.ad-btn-edit-mem').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    var mem = items.find(function(m) { return m.id === id; });
                    if (mem) renderMembershipForm(mem);
                });
            });
        }

        // Profile link click
        tbody.querySelectorAll('.ad-mem-profile-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var profileId = this.getAttribute('data-profile-id');
                var memId = this.getAttribute('data-mem-id');
                if (profileId && memId) showMemberProfileModal(profileId, memId);
            });
        });
    }

    // ---- Member Profile Modal ----
    async function showMemberProfileModal(profileId, membershipId) {
        if (!client) return;

        // Load profile and payments in parallel
        var profilePromise = client.from('profiles').select('*').eq('id', profileId).single();
        var paymentsPromise = client.from('payments').select('*').eq('membership_id', membershipId).order('created_at', { ascending: false });
        var memPromise = client.from('memberships').select('*').eq('id', membershipId).single();

        var results = await Promise.all([profilePromise, paymentsPromise, memPromise]);
        var profile = results[0].data;
        var payments = results[1].data || [];
        var mem = results[2].data;

        if (!profile) return;

        // Avatar
        var avatarUrl = profile.avatar_url || '';
        var avatarHtml = avatarUrl
            ? '<img src="' + esc(avatarUrl) + '" class="ad-mem-profile-avatar" alt="">'
            : '<div class="ad-mem-profile-avatar ad-mem-profile-avatar-placeholder">' + esc((profile.full_name || '?').charAt(0).toUpperCase()) + '</div>';

        // Membership info
        var statusLabel = '—';
        var statusClass = '';
        if (mem) {
            var sMap = { active: 'ad-mem-active', expired: 'ad-mem-expired', cancelled: 'ad-mem-cancelled', pending: 'ad-mem-pending' };
            statusClass = sMap[mem.status] || '';
            statusLabel = '<span class="ad-mem-badge ' + statusClass + '">' + esc(mem.status) + '</span>';
            if (mem.expires_at) {
                var dLeft = Math.ceil((new Date(mem.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                statusLabel += ' <span style="color:var(--text-secondary);font-size:0.8rem;">(' + dLeft + ' ' + L.memDaysLeft.toLowerCase() + ')</span>';
            }
        }

        // Role
        var roleLabel = profile.role || 'user';

        // Phone
        var phone = profile.phone || '—';
        if (phone.length === 13 && phone.startsWith('+996')) {
            phone = phone.slice(0, 4) + ' ' + phone.slice(4, 7) + ' ' + phone.slice(7, 9) + '-' + phone.slice(9, 11) + '-' + phone.slice(11, 13);
        }

        // Registration date
        var regDate = profile.created_at ? profile.created_at.split('T')[0] : '—';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml = '<div style="color:var(--text-dim);padding:12px 0;">' + L.memNoPayments + '</div>';
        } else {
            paymentsHtml = '<table class="ad-mem-profile-payments"><thead><tr>' +
                '<th>' + L.memDate + '</th><th>' + L.memAmount + '</th><th>' + L.memPayStatus + '</th><th>' + L.memPayNote + '</th>' +
                '</tr></thead><tbody>';
            payments.forEach(function(p) {
                var pDate = p.created_at ? p.created_at.split('T')[0] : '—';
                var pStatusCls = p.status === 'completed' ? 'ad-mem-paid' : 'ad-mem-unpaid';
                paymentsHtml += '<tr>' +
                    '<td>' + pDate + '</td>' +
                    '<td>' + (p.amount || 0) + ' ' + esc(p.currency || 'KGS') + '</td>' +
                    '<td><span class="ad-mem-badge ' + pStatusCls + '">' + esc(p.status || '') + '</span></td>' +
                    '<td style="color:var(--text-dim);font-size:0.8rem;">' + esc(p.note || '') + '</td>' +
                '</tr>';
            });
            paymentsHtml += '</tbody></table>';
        }

        // Build modal
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal ad-mem-profile-modal">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.memProfile + '</h3>' +
                    '<button class="ad-modal-close" id="adMemProfileClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-mem-profile-top">' +
                        avatarHtml +
                        '<div class="ad-mem-profile-info">' +
                            '<div class="ad-mem-profile-name">' + esc(profile.full_name || '—') + '</div>' +
                            '<div class="ad-mem-profile-email">' + esc(profile.email || '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-mem-profile-details">' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memPhone + '</span><span>' + esc(phone) + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memRole + '</span><span>' + esc(roleLabel) + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memRegistered + '</span><span>' + regDate + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memMembership + '</span><span>' + statusLabel + '</span></div>' +
                    '</div>' +
                    '<div class="ad-mem-profile-payments-section">' +
                        '<h4 style="margin:0 0 8px;color:var(--text-primary);font-size:0.95rem;">' + L.memPaymentHistory + '</h4>' +
                        paymentsHtml +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close handlers
        var closeModal = function() { overlay.remove(); };
        overlay.querySelector('#adMemProfileClose').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', function onEsc(e) {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); }
        });
    }

    async function extendMembership(id) {
        if (!client) return;
        var result = await client.from('memberships').select('expires_at').eq('id', id).single();
        if (!result.data) return;

        var current = result.data.expires_at ? new Date(result.data.expires_at) : new Date();
        var today = new Date();
        if (current < today) current = today;
        current.setMonth(current.getMonth() + 1);
        var newDate = current.toISOString().split('T')[0];

        await client.from('memberships').update({ expires_at: newDate, status: 'active' }).eq('id', id);
        loadMembershipsList();
    }

    async function cancelMembership(id) {
        if (!client) return;
        await client.from('memberships').update({ status: 'cancelled' }).eq('id', id);
        loadMembershipsList();
    }

    // ---- Membership Form ----
    async function renderMembershipForm(mem) {
        var container = document.getElementById('ad-memberships');
        if (!container) return;

        var isEdit = !!mem;
        var title = isEdit ? L.memEdit : L.memAdd;

        // Load all profiles for user select
        var profilesResult = await client.from('profiles').select('id, full_name, email').order('full_name', { ascending: true });
        var profiles = profilesResult.data || [];

        var today = new Date().toISOString().split('T')[0];
        var nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        var defaultEnd = nextMonth.toISOString().split('T')[0];

        var userOptions = '<option value="">' + L.memSelectUser + '</option>';
        profiles.forEach(function(p) {
            var selected = (isEdit && mem.profile_id === p.id) ? ' selected' : '';
            var label = esc((p.full_name || '') + ' (' + (p.email || '') + ')');
            userOptions += '<option value="' + p.id + '"' + selected + '>' + label + '</option>';
        });

        var statusOptions = '';
        ['active', 'expired', 'cancelled'].forEach(function(s) {
            var selected = (isEdit && mem.status === s) ? ' selected' : '';
            var label = s === 'active' ? L.memActive : s === 'expired' ? L.memExpired : L.memCancelled;
            statusOptions += '<option value="' + s + '"' + selected + '>' + label + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn" id="adMemBack">' + L.back + '</button>' +
            '</div>' +
            '<div class="ad-form-card">' +
                '<div class="ad-form-grid">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memUser + '</label>' +
                        '<select class="ad-field-input" id="adMemUser"' + (isEdit ? ' disabled' : '') + '>' + userOptions + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memStatus + '</label>' +
                        '<select class="ad-field-input" id="adMemStatus">' + statusOptions + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memStartsAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adMemStart" value="' + (isEdit ? (mem.starts_at || '') : today) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memExpiresAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adMemEnd" value="' + (isEdit ? (mem.expires_at || '') : defaultEnd) + '">' +
                    '</div>' +
                    '<div class="ad-field ad-field-full">' +
                        '<label class="ad-field-label">' + L.memNote + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMemNote" value="' + esc(isEdit ? (mem.note || '') : '') + '">' +
                    '</div>' +
                '</div>' +
                (!isEdit ?
                    '<div class="ad-field" style="margin-top:16px;">' +
                        '<label class="ad-field-label" style="display:flex;align-items:center;gap:8px;">' +
                            '<input type="checkbox" id="adMemRecordPay"> ' + L.memRecordPayment +
                        '</label>' +
                    '</div>' +
                    '<div id="adMemPayFields" style="display:none;margin-top:12px;">' +
                        '<div class="ad-form-grid">' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.memPaymentAmount + '</label>' +
                                '<input type="number" class="ad-field-input" id="adMemPayAmount" value="1000">' +
                            '</div>' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.memPaymentMethod + '</label>' +
                                '<select class="ad-field-input" id="adMemPayMethod">' +
                                    '<option value="cash">' + L.memPaymentCash + '</option>' +
                                    '<option value="transfer">' + L.memPaymentTransfer + '</option>' +
                                    '<option value="card">' + L.memPaymentCard + '</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                : '') +
                (isEdit ?
                    '<div id="adMemPayHistory" style="margin-top:24px;"></div>'
                : '') +
                '<div class="ad-form-actions" style="margin-top:20px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adMemSave">' + L.save + '</button>' +
                    (isEdit ?
                        '<button class="ad-btn ad-btn-danger" id="adMemDelete" style="margin-left:auto;">' + L.delete + '</button>'
                    : '') +
                '</div>' +
            '</div>';

        // Back button
        document.getElementById('adMemBack').addEventListener('click', function() {
            renderMembershipsList();
        });

        // Payment toggle
        var payCheck = document.getElementById('adMemRecordPay');
        if (payCheck) {
            payCheck.addEventListener('change', function() {
                document.getElementById('adMemPayFields').style.display = this.checked ? '' : 'none';
            });
        }

        // Save
        document.getElementById('adMemSave').addEventListener('click', function() {
            saveMembership(isEdit ? mem.id : null);
        });

        // Delete
        var delBtn = document.getElementById('adMemDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                if (confirm(L.memDeleteConfirm)) deleteMembership(mem.id);
            });
        }

        // Load payments for edit mode
        if (isEdit) {
            loadMembershipPayments(mem.id, mem.profile_id);
        }
    }

    async function saveMembership(editId) {
        if (!client) return;

        var profileId = document.getElementById('adMemUser').value;
        var status = document.getElementById('adMemStatus').value;
        var startsAt = document.getElementById('adMemStart').value;
        var expiresAt = document.getElementById('adMemEnd').value;
        var note = document.getElementById('adMemNote').value.trim();

        if (!editId && !profileId) {
            alert(L.memSelectUser);
            return;
        }

        var data = {
            status: status,
            starts_at: startsAt || null,
            expires_at: expiresAt || null,
            note: note || null
        };

        var saveBtn = document.getElementById('adMemSave');
        saveBtn.textContent = L.saving;
        saveBtn.disabled = true;

        if (editId) {
            await client.from('memberships').update(data).eq('id', editId);
        } else {
            data.profile_id = profileId;
            var result = await client.from('memberships').insert(data).select().single();

            // Record payment if checked
            var payCheck = document.getElementById('adMemRecordPay');
            if (payCheck && payCheck.checked && result.data) {
                var amount = parseFloat(document.getElementById('adMemPayAmount').value) || 0;
                var method = document.getElementById('adMemPayMethod').value;
                await client.from('payments').insert({
                    profile_id: profileId,
                    membership_id: result.data.id,
                    amount: amount,
                    currency: 'KGS',
                    status: 'completed',
                    payment_method: method,
                    note: note || null
                });
            }
        }

        saveBtn.textContent = L.saved;
        setTimeout(function() { renderMembershipsList(); }, 600);
    }

    async function deleteMembership(id) {
        if (!client) return;
        await client.from('memberships').delete().eq('id', id);
        renderMembershipsList();
    }

    async function loadMembershipPayments(membershipId, profileId) {
        if (!client) return;
        var container = document.getElementById('adMemPayHistory');
        if (!container) return;

        var result = await client.from('payments')
            .select('*')
            .eq('membership_id', membershipId)
            .order('created_at', { ascending: false });

        var payments = result.data || [];

        var html = '<h3 style="margin-bottom:12px;font-size:0.95rem;color:var(--text-secondary);">' + L.memPayments + '</h3>';

        if (payments.length === 0) {
            html += '<div style="color:var(--text-dim);font-size:0.85rem;">' + L.memNoPayments + '</div>';
        } else {
            html += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.memPayDate + '</th>' +
                '<th>' + L.memPayAmount + '</th>' +
                '<th>' + L.memPayMethod + '</th>' +
                '<th>' + L.memPayStatus + '</th>' +
                '<th>' + L.memPayNote + '</th>' +
            '</tr></thead><tbody>';

            var methodLabels = { cash: L.memPaymentCash, transfer: L.memPaymentTransfer, card: L.memPaymentCard };

            payments.forEach(function(p) {
                html += '<tr>' +
                    '<td>' + (p.created_at ? p.created_at.split('T')[0] : '—') + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.amount || 0) + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td>' + (methodLabels[p.payment_method] || p.payment_method || '—') + '</td>' +
                    '<td><span class="ad-mem-badge ad-mem-' + (p.status === 'completed' ? 'active' : 'expired') + '">' + (p.status || '—') + '</span></td>' +
                    '<td style="color:var(--text-dim);font-size:0.8rem;">' + esc(p.note || '') + '</td>' +
                '</tr>';
            });

            html += '</tbody></table></div></div>';
        }

        container.innerHTML = html;
    }

    // ============================================
    // PAYMENTS SECTION
    // ============================================

    var PAYMENT_METHODS = { cash: L.payCash, transfer: L.payTransfer, card: L.payCard };
    var PAYMENT_PURPOSES = { promoted: L.payPromoted, sponsorship: L.paySponsorship, rental: L.payRental, other: L.payOther };
    var PAYMENT_ENTITY_TYPES = { court: L.payCourt, coach: L.payCoach, player: L.payPlayer };

    function formatPayDate(d) {
        if (!d) return '—';
        var parts = d.split('-');
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    }

    var paySearchQuery = '', payFilterType = '', payFilterPurpose = '', payFilterStatus = '';
    var payPage = 1, payAllData = [], payEditingId = null;
    var PAY_PER_PAGE = 15;

    function renderPaymentsSection() {
        renderPaymentsList();
    }

    function renderPaymentsList() {
        var container = document.getElementById('ad-payments');
        if (!container) return;

        var typeOptions = '<option value="">' + L.payAllTypes + '</option>';
        Object.keys(PAYMENT_ENTITY_TYPES).forEach(function(k) {
            typeOptions += '<option value="' + k + '"' + (payFilterType === k ? ' selected' : '') + '>' + PAYMENT_ENTITY_TYPES[k] + '</option>';
        });

        var purposeOptions = '<option value="">' + L.payAllPurposes + '</option>';
        Object.keys(PAYMENT_PURPOSES).forEach(function(k) {
            purposeOptions += '<option value="' + k + '"' + (payFilterPurpose === k ? ' selected' : '') + '>' + PAYMENT_PURPOSES[k] + '</option>';
        });

        var statusOptions = '<option value="">' + L.payAllStatuses + '</option>' +
            '<option value="active"' + (payFilterStatus === 'active' ? ' selected' : '') + '>' + L.payActive + '</option>' +
            '<option value="expired"' + (payFilterStatus === 'expired' ? ' selected' : '') + '>' + L.payExpired + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.payments + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adPayAddBtn">+ ' + L.addPayment + '</button>' +
            '</div>' +

            '<div class="ad-pay-stats-grid">' +
                '<div class="ad-pay-stat-card" id="adPayStatActive"><div class="stat-value">0</div><div class="stat-label">' + L.payStatActive + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adPayStatExpired"><div class="stat-value">0</div><div class="stat-label">' + L.payStatExpired + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adPayStatMonth"><div class="stat-value">0</div><div class="stat-label">' + L.payStatMonth + '</div></div>' +
            '</div>' +

            '<div class="ad-filter-row sticky">' +
                '<input type="text" class="ad-field-input" id="adPaySearch" placeholder="' + L.paySearch + '" value="' + esc(paySearchQuery) + '" style="max-width:220px;">' +
                '<select class="ad-field-input" id="adPayTypeFilter" style="max-width:150px;">' + typeOptions + '</select>' +
                '<select class="ad-field-input" id="adPayPurposeFilter" style="max-width:150px;">' + purposeOptions + '</select>' +
                '<select class="ad-field-input" id="adPayStatusFilter" style="max-width:150px;">' + statusOptions + '</select>' +
            '</div>' +

            '<div class="ad-table-wrap">' +
                '<table class="ad-table ad-table-clickable" id="adPayTable">' +
                    '<thead><tr>' +
                        '<th>' + L.payEntity + '</th>' +
                        '<th>' + L.payEntityType + '</th>' +
                        '<th>' + L.payPurpose + '</th>' +
                        '<th>' + L.payAmount + '</th>' +
                        '<th>' + (isEn ? 'Active Until' : 'Активен до') + '</th>' +
                        '<th>' + L.payMethod + '</th>' +
                        '<th>' + L.payStatus + '</th>' +
                        '<th>' + L.payCreatedAt + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>';

        document.getElementById('adPayAddBtn').addEventListener('click', function() {
            renderPaymentForm(null);
        });

        var searchInput = document.getElementById('adPaySearch');
        var debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                paySearchQuery = searchInput.value.trim().toLowerCase();
                payPage = 1;
                applyPayFilters();
            }, 300);
        });

        document.getElementById('adPayTypeFilter').addEventListener('change', function() {
            payFilterType = this.value;
            payPage = 1;
            loadPaymentsList();
        });

        document.getElementById('adPayPurposeFilter').addEventListener('change', function() {
            payFilterPurpose = this.value;
            payPage = 1;
            loadPaymentsList();
        });

        document.getElementById('adPayStatusFilter').addEventListener('change', function() {
            payFilterStatus = this.value;
            payPage = 1;
            applyPayFilters();
        });

        loadPaymentsList();
    }

    async function loadPaymentsList() {
        if (!client) return;

        var query = client.from('entity_payments').select('*').order('created_at', { ascending: false });

        if (payFilterType) {
            query = query.eq('entity_type', payFilterType);
        }
        if (payFilterPurpose) {
            query = query.eq('purpose', payFilterPurpose);
        }

        var result = await query;
        payAllData = result.data || [];

        applyPayFilters();
        updatePayStats();
    }

    function applyPayFilters() {
        var today = new Date().toISOString().slice(0, 10);
        var filtered = payAllData.slice();

        if (paySearchQuery) {
            filtered = filtered.filter(function(p) {
                return (p.entity_name || '').toLowerCase().indexOf(paySearchQuery) !== -1;
            });
        }

        if (payFilterStatus === 'active') {
            filtered = filtered.filter(function(p) { return p.period_end >= today; });
        } else if (payFilterStatus === 'expired') {
            filtered = filtered.filter(function(p) { return p.period_end < today; });
        }

        var totalItems = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / PAY_PER_PAGE));
        if (payPage > totalPages) payPage = totalPages;
        var start = (payPage - 1) * PAY_PER_PAGE;
        var pageItems = filtered.slice(start, start + PAY_PER_PAGE);

        renderPayRows(pageItems);
        renderPayPagination(totalItems, totalPages);
    }

    function updatePayStats() {
        var today = new Date().toISOString().slice(0, 10);
        var now = new Date();
        var monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';

        var active = 0, expired = 0, month = 0;
        payAllData.forEach(function(p) {
            if (p.period_end >= today) active++;
            else expired++;
            if (p.created_at >= monthStart) month++;
        });

        var elActive = document.querySelector('#adPayStatActive .stat-value');
        var elExpired = document.querySelector('#adPayStatExpired .stat-value');
        var elMonth = document.querySelector('#adPayStatMonth .stat-value');
        if (elActive) elActive.textContent = active;
        if (elExpired) elExpired.textContent = expired;
        if (elMonth) elMonth.textContent = month;
    }

    function renderPayRows(items) {
        var table = document.getElementById('adPayTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">💰</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.payNoPayments + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.payNoPaymentsText + '</div>' +
                '</td></tr>';
            return;
        }

        var today = new Date().toISOString().slice(0, 10);
        var html = '';
        items.forEach(function(p) {
            var isActive = p.period_end >= today;
            var statusBadge = isActive
                ? '<span class="ad-pay-badge ad-pay-active">' + L.payActive + '</span>'
                : '<span class="ad-pay-badge ad-pay-expired">' + L.payExpired + '</span>';
            var typeBadge = '<span class="ad-pay-badge ad-pay-type-' + p.entity_type + '">' + (PAYMENT_ENTITY_TYPES[p.entity_type] || p.entity_type) + '</span>';
            var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';
            var periodEnd = formatPayDate(p.period_end);
            var createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';

            html +=
                '<tr data-pay-id="' + p.id + '">' +
                    bulkCheckboxTd(p.id) +
                    '<td style="font-weight:500;color:var(--text-primary);">' + esc(p.entity_name || '—') + '</td>' +
                    '<td>' + typeBadge + '</td>' +
                    '<td>' + purposeBadge + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td style="font-size:0.8rem;white-space:nowrap;">' + periodEnd + '</td>' +
                    '<td>' + (PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                    '<td>' + statusBadge + '</td>' +
                    '<td style="font-size:0.8rem;color:var(--text-dim);">' + createdDate + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-pay-id]');
            if (!row) return;
            loadAndEditPayment(row.dataset.payId);
        });

        setupBulkDelete({ tableId: 'adPayTable', tableName: 'entity_payments', reloadFn: loadPaymentsList });
    }

    function renderPayPagination(totalItems, totalPages) {
        var existing = document.getElementById('adPayPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adPayPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        if (payPage > 1) {
            html += '<button class="ad-crt-page-btn" data-pay-page="' + (payPage - 1) + '">&laquo;</button>';
        }
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="ad-crt-page-btn' + (i === payPage ? ' active' : '') + '" data-pay-page="' + i + '">' + i + '</button>';
        }
        if (payPage < totalPages) {
            html += '<button class="ad-crt-page-btn" data-pay-page="' + (payPage + 1) + '">&raquo;</button>';
        }
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;
        var container = document.getElementById('ad-payments');
        if (container) container.appendChild(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-pay-page]');
            if (!btn) return;
            payPage = parseInt(btn.dataset.payPage);
            applyPayFilters();
        });
    }

    async function loadAndEditPayment(id) {
        if (!client) return;
        var result = await client.from('entity_payments').select('*').eq('id', id).single();
        if (result.data) {
            renderPaymentForm(result.data);
        }
    }

    function renderPaymentForm(item) {
        var container = document.getElementById('ad-payments');
        if (!container) return;

        payEditingId = item ? item.id : null;

        var entityTypeOptions = '';
        Object.keys(PAYMENT_ENTITY_TYPES).forEach(function(k) {
            entityTypeOptions += '<option value="' + k + '"' + (item && item.entity_type === k ? ' selected' : '') + '>' + PAYMENT_ENTITY_TYPES[k] + '</option>';
        });

        var purposeOptions = '';
        Object.keys(PAYMENT_PURPOSES).forEach(function(k) {
            purposeOptions += '<option value="' + k + '"' + (item && item.purpose === k ? ' selected' : '') + '>' + PAYMENT_PURPOSES[k] + '</option>';
        });

        var methodOptions = '';
        Object.keys(PAYMENT_METHODS).forEach(function(k) {
            methodOptions += '<option value="' + k + '"' + (item && item.payment_method === k ? ' selected' : '') + '>' + PAYMENT_METHODS[k] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + (item ? L.editPayment : L.addPayment) + '</h2>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payEntityType + '</div>' +
                '<select class="ad-field-input" id="adPayEntityType">' + entityTypeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payEntity + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adPayEntitySearch" placeholder="' + L.paySearchEntity + '" value="' + esc(item ? item.entity_name : '') + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adPayEntityResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adPayEntityId" value="' + (item ? item.entity_id : '') + '">' +
                '<input type="hidden" id="adPayEntityName" value="' + esc(item ? item.entity_name : '') + '">' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payPurpose + '</div>' +
                '<select class="ad-field-input" id="adPayPurpose">' + purposeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payAmount + '</div>' +
                '<div style="display:flex;gap:10px;">' +
                    '<input type="text" inputmode="numeric" class="ad-field-input" id="adPayAmount" placeholder="0" value="' + (item ? item.amount : '') + '" style="max-width:180px;">' +
                    '<input type="text" class="ad-field-input" id="adPayCurrency" value="' + (item ? item.currency : 'KGS') + '" style="width:70px;text-align:center;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Period' : 'Период') + '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<input type="date" class="ad-field-input" id="adPayPeriodStart" value="' + (item ? item.period_start : '') + '" style="flex:1;">' +
                    '<span style="color:var(--text-dim);">—</span>' +
                    '<input type="date" class="ad-field-input" id="adPayPeriodEnd" value="' + (item ? item.period_end : '') + '" style="flex:1;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payMethod + '</div>' +
                '<select class="ad-field-input" id="adPayMethod">' + methodOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payNote + '</div>' +
                '<textarea class="ad-field-input" id="adPayNote" rows="3">' + esc(item ? item.note || '' : '') + '</textarea>' +
            '</div>' +

            '<div class="ad-form-actions">' +
                '<button class="ad-btn ad-btn-primary" id="adPaySaveBtn">' + L.save + '</button>' +
                '<button class="ad-btn ad-btn-secondary" id="adPayBackBtn">' + L.back + '</button>' +
                (item ? '<button class="ad-btn ad-btn-danger" id="adPayDeleteBtn" style="margin-left:auto;">' + L.delete + '</button>' : '') +
            '</div>';

        // Entity search
        var searchInput = document.getElementById('adPayEntitySearch');
        var resultsDiv = document.getElementById('adPayEntityResults');
        var searchTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            var q = searchInput.value.trim();
            if (q.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            searchTimer = setTimeout(function() {
                var type = document.getElementById('adPayEntityType').value;
                searchPayEntity(type, q);
            }, 300);
        });

        searchInput.addEventListener('focus', function() {
            if (searchInput.value.trim().length >= 2) {
                var type = document.getElementById('adPayEntityType').value;
                searchPayEntity(type, searchInput.value.trim());
            }
        });

        document.addEventListener('click', function hideResults(e) {
            if (!e.target.closest('.ad-pay-entity-wrap')) {
                resultsDiv.style.display = 'none';
            }
        });

        document.getElementById('adPayEntityType').addEventListener('change', function() {
            document.getElementById('adPayEntityId').value = '';
            document.getElementById('adPayEntityName').value = '';
            searchInput.value = '';
            resultsDiv.style.display = 'none';
        });

        // Only digits allowed in amount field
        var amountInput = document.getElementById('adPayAmount');
        amountInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        amountInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        amountInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        });

        document.getElementById('adPaySaveBtn').addEventListener('click', savePaymentHandler);
        document.getElementById('adPayBackBtn').addEventListener('click', function() {
            renderPaymentsList();
        });

        if (item) {
            document.getElementById('adPayDeleteBtn').addEventListener('click', function() {
                if (confirm(L.payDeleteConfirm)) {
                    deletePayment(item.id);
                }
            });
        }
    }

    async function searchPayEntity(type, query) {
        if (!client) return;
        var resultsDiv = document.getElementById('adPayEntityResults');
        if (!resultsDiv) return;

        var result;
        var items = [];

        if (type === 'court') {
            result = await client.from('courts').select('id,name').ilike('name', '%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: r.name }; });
        } else if (type === 'coach') {
            result = await client.from('coaches').select('id,last_name,first_name').or('last_name.ilike.%' + query + '%,first_name.ilike.%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: (r.last_name || '') + ' ' + (r.first_name || '') }; });
        } else if (type === 'player') {
            result = await client.from('players').select('id,name').ilike('name', '%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: r.name }; });
        }

        if (items.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        var html = '';
        items.forEach(function(item) {
            html += '<div class="ad-pay-entity-item" data-id="' + item.id + '" data-name="' + esc(item.name) + '">' + esc(item.name) + '</div>';
        });
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('.ad-pay-entity-item').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('adPayEntityId').value = el.dataset.id;
                document.getElementById('adPayEntityName').value = el.dataset.name;
                document.getElementById('adPayEntitySearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
            });
        });
    }

    async function savePaymentHandler() {
        var entityId = document.getElementById('adPayEntityId').value;
        var entityName = document.getElementById('adPayEntityName').value;
        var entityType = document.getElementById('adPayEntityType').value;
        var amount = parseFloat(document.getElementById('adPayAmount').value);
        var periodStart = document.getElementById('adPayPeriodStart').value;
        var periodEnd = document.getElementById('adPayPeriodEnd').value;

        if (!entityId || !entityName) {
            showToast(L.payEntityRequired, 'error');
            return;
        }
        if (!amount || amount <= 0) {
            showToast(L.payAmountRequired, 'error');
            return;
        }
        if (!periodStart || !periodEnd) {
            showToast(L.payPeriodRequired, 'error');
            return;
        }

        var saveBtn = document.getElementById('adPaySaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '...';

        var data = {
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            amount: amount,
            currency: document.getElementById('adPayCurrency').value.trim() || 'KGS',
            period_start: periodStart,
            period_end: periodEnd,
            payment_method: document.getElementById('adPayMethod').value,
            purpose: document.getElementById('adPayPurpose').value,
            note: document.getElementById('adPayNote').value.trim() || null
        };

        var result;
        if (payEditingId) {
            result = await client.from('entity_payments').update(data).eq('id', payEditingId);
        } else {
            var session = await client.auth.getSession();
            data.created_by = session.data.session ? session.data.session.user.id : null;
            result = await client.from('entity_payments').insert(data);
        }

        if (result.error) {
            showToast(result.error.message, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
            return;
        }

        await syncPromotedStatus(entityType, entityId);
        showToast(L.paySaved, 'success');
        renderPaymentsList();
    }

    async function syncPromotedStatus(entityType, entityId) {
        if (entityType !== 'court' && entityType !== 'coach') return;

        var today = new Date().toISOString().slice(0, 10);

        var check = await client.from('entity_payments')
            .select('id')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .limit(1);

        var hasActive = (check.data && check.data.length > 0);
        var tableName = entityType === 'court' ? 'courts' : 'coaches';

        await client.from(tableName).update({ promoted: hasActive }).eq('id', entityId);
    }

    async function deletePayment(id) {
        if (!client) return;

        var item = payAllData.find(function(p) { return p.id === id; });
        var result = await client.from('entity_payments').delete().eq('id', id);

        if (result.error) {
            showToast(result.error.message, 'error');
            return;
        }

        if (item) {
            await syncPromotedStatus(item.entity_type, item.entity_id);
        }

        showToast(L.payDeleted, 'success');
        renderPaymentsList();
    }

    // ============================================
    // USERS SECTION (Admin only)
    // ============================================

    var usrSearchQuery = '';
    var usrFilterRole = '';
    var usrCurrentUserId = null; // Set in onAuthReady

    async function renderUsersSection() {
        renderUsersList();
    }

    async function renderUsersList() {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var roleFilterHtml = '<option value="">' + L.usrAllRoles + '</option>' +
            '<option value="admin"' + (usrFilterRole === 'admin' ? ' selected' : '') + '>' + L.roleAdmin + '</option>' +
            '<option value="manager"' + (usrFilterRole === 'manager' ? ' selected' : '') + '>' + L.roleManager + '</option>' +
            '<option value="user"' + (usrFilterRole === 'user' ? ' selected' : '') + '>' + L.roleUser + '</option>';

        var isAdm = currentRole === 'admin';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.users + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adUsrAddManager">+ ' + L.usrAddManager + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adUsrSearch" placeholder="' + L.usrSearch + '" value="' + esc(usrSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adUsrRoleFilter">' + roleFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adUsrTable">' +
                        '<thead><tr>' +
                            '<th>' + L.thUser + '</th>' +
                            '<th>' + L.thEmail + '</th>' +
                            '<th>' + L.thRole + '</th>' +
                            '<th>' + L.usrThMembership + '</th>' +
                            '<th>' + L.thDate + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var addMgrBtn = document.getElementById('adUsrAddManager');
        if (addMgrBtn) {
            addMgrBtn.addEventListener('click', function() {
                openAddManagerModal();
            });
        }

        var searchTimer = null;
        document.getElementById('adUsrSearch').addEventListener('input', function() {
            usrSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadUsersList(); }, 300);
        });

        document.getElementById('adUsrRoleFilter').addEventListener('change', function() {
            usrFilterRole = this.value;
            loadUsersList();
        });

        await loadUsersList();
    }

    async function loadUsersList() {
        if (!client) return;
        var isAdm = currentRole === 'admin';

        var query = client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at')
            .order('created_at', { ascending: false });

        if (usrFilterRole) {
            query = query.eq('role', usrFilterRole);
        }

        var result = await query;
        if (result.error) { console.error('Users query error:', result.error); return; }

        var items = result.data || [];

        // Load memberships for all users
        var profileIds = items.map(function(u) { return u.id; });
        var memMap = {};
        if (profileIds.length > 0) {
            var memResult = await client.from('memberships')
                .select('profile_id, status, expires_at')
                .in('profile_id', profileIds)
                .order('created_at', { ascending: false });
            (memResult.data || []).forEach(function(m) {
                if (!memMap[m.profile_id]) memMap[m.profile_id] = m;
            });
        }

        // Client-side search
        if (usrSearchQuery) {
            var q = usrSearchQuery.toLowerCase();
            items = items.filter(function(u) {
                var name = (u.full_name || '').toLowerCase();
                var email = (u.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        var table = document.getElementById('adUsrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">👥</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.usrNoUsers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.usrNoUsersText + '</div>' +
                '</td></tr>';
            return;
        }

        var now = Date.now();
        tbody.innerHTML = '';

        items.forEach(function(u) {
            var name = esc(u.full_name || '');
            var email = esc(u.email || '');
            var initials = (u.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();

            var avatarHtml = u.avatar_url
                ? '<img src="' + esc(u.avatar_url) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:32px;height:32px;border-radius:50%;background:rgba(204,255,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;">' + initials + '</div>';

            // Role badge
            var roleLabel = L['role' + u.role.charAt(0).toUpperCase() + u.role.slice(1)] || u.role;
            var roleBg = u.role === 'admin' ? 'rgba(255,59,48,0.15)' : u.role === 'manager' ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.08)';
            var roleColor = u.role === 'admin' ? '#ff3b30' : u.role === 'manager' ? 'var(--accent)' : 'var(--text-secondary)';
            var roleBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;background:' + roleBg + ';color:' + roleColor + ';">' + roleLabel + '</span>';

            // Membership badge
            var mem = memMap[u.id];
            var memBadge;
            if (mem && mem.status === 'active') {
                memBadge = '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>';
            } else if (mem && mem.status === 'expired') {
                memBadge = '<span class="ad-mem-badge ad-mem-expired">' + L.usrExpired + '</span>';
            } else {
                memBadge = '<span style="color:var(--text-dim);font-size:0.8rem;">' + L.usrNone + '</span>';
            }

            // Online indicator
            var isOnline = u.last_seen && (now - new Date(u.last_seen).getTime()) < 5 * 60 * 1000;
            var onlineDot = isOnline ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34c759;margin-left:6px;" title="' + L.usrOnline + '"></span>' : '';

            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';

            var tr = document.createElement('tr');
            if (isAdm) tr.style.cursor = 'pointer';
            tr.innerHTML =
                '<td><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml + '<span>' + (name || email) + onlineDot + '</span></div></td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + email + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + memBadge + '</td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + regDate + '</td>';

            if (isAdm) {
                tr.addEventListener('click', function() {
                    loadAndEditUser(u.id);
                });
            }

            tbody.appendChild(tr);
        });

        // Setup bulk delete (admin only)
        if (isAdm) {
            setupBulkDelete({
                tableId: 'adUsrTable',
                tableName: 'profiles',
                confirmMsg: L.deleteSelectedConfirm,
                reloadFn: loadUsersList
            });

            // Add checkbox column to rows
            var rows = tbody.querySelectorAll('tr');
            rows.forEach(function(tr, idx) {
                if (items[idx]) {
                    var td = document.createElement('td');
                    td.className = 'ad-bulk-cell';
                td.style.width = '36px';
                td.style.textAlign = 'center';
                td.innerHTML = '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + items[idx].id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">';
                tr.insertBefore(td, tr.firstChild);
            }
        });
        } // end if (isAdm)
    }

    async function loadAndEditUser(id) {
        if (!client) return;

        var userRes = await client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at')
            .eq('id', id)
            .single();

        if (userRes.error || !userRes.data) {
            showToast('User not found', 'error');
            return;
        }

        var user = userRes.data;

        // Load membership
        var memRes = await client.from('memberships')
            .select('id, status, starts_at, expires_at')
            .eq('profile_id', id)
            .order('created_at', { ascending: false })
            .limit(1);

        var membership = (memRes.data && memRes.data.length > 0) ? memRes.data[0] : null;

        renderUserForm(user, membership);
    }

    function renderUserForm(user, membership) {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var roleLabel = L['role' + user.role.charAt(0).toUpperCase() + user.role.slice(1)] || user.role;
        var tgStatus = user.telegram_chat_id ? L.usrTgConnected : L.usrTgNotConnected;
        var tgColor = user.telegram_chat_id ? '#34c759' : 'var(--text-dim)';
        var lastSeen = user.last_seen ? user.last_seen.split('T')[0] + ' ' + user.last_seen.split('T')[1].substring(0, 5) : '—';
        var regDate = user.created_at ? user.created_at.split('T')[0] : '—';

        var initials = (user.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
        var avatarHtml = user.avatar_url
            ? '<img src="' + esc(user.avatar_url) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:64px;height:64px;border-radius:50%;background:rgba(204,255,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;">' + initials + '</div>';

        // Membership section
        var memHtml = '';
        if (membership && membership.status === 'active') {
            var expDate = membership.expires_at ? membership.expires_at.split('T')[0] : '—';
            var daysLeft = '';
            if (membership.expires_at) {
                var today = new Date(); today.setHours(0,0,0,0);
                var exp = new Date(membership.expires_at); exp.setHours(0,0,0,0);
                var diff = Math.ceil((exp - today) / 86400000);
                daysLeft = diff > 0 ? ' (' + diff + ' ' + (isEn ? 'days left' : 'дн.') + ')' : '';
            }
            memHtml =
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                    '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>' +
                    '<span style="color:var(--text-secondary);font-size:0.85rem;">' + (isEn ? 'until ' : 'до ') + expDate + daysLeft + '</span>' +
                '</div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrExtendMem">' + L.usrExtendMembership + '</button>' +
                    '<select class="ad-field-input" id="adUsrExtendPeriod" style="width:auto;padding:4px 8px;font-size:0.8rem;">' +
                        '<option value="1">' + L.usrMonths1 + '</option>' +
                        '<option value="3">' + L.usrMonths3 + '</option>' +
                        '<option value="6">' + L.usrMonths6 + '</option>' +
                        '<option value="12">' + L.usrMonths12 + '</option>' +
                    '</select>' +
                    '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrCancelMem">' + L.usrCancelMembership + '</button>' +
                '</div>';
        } else {
            memHtml =
                '<div style="color:var(--text-dim);margin-bottom:12px;">' + L.usrNoMembership + '</div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrGiveMem">' + L.usrGiveMembership + '</button>' +
                    '<select class="ad-field-input" id="adUsrGivePeriod" style="width:auto;padding:4px 8px;font-size:0.8rem;">' +
                        '<option value="1">' + L.usrMonths1 + '</option>' +
                        '<option value="3">' + L.usrMonths3 + '</option>' +
                        '<option value="6">' + L.usrMonths6 + '</option>' +
                        '<option value="12">' + L.usrMonths12 + '</option>' +
                    '</select>' +
                '</div>';
        }

        // Role actions
        var isSelf = user.id === usrCurrentUserId;
        var roleActionsHtml = '';
        if (isSelf) {
            roleActionsHtml = '<div style="color:var(--text-dim);font-size:0.85rem;font-style:italic;">' + L.usrCannotDeleteSelf + '</div>';
        } else if (user.role === 'manager') {
            roleActionsHtml =
                '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrRemoveManager">' + L.usrRemoveManager + '</button>' +
                '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>';
        } else if (user.role === 'user') {
            roleActionsHtml =
                '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrMakeManager">' + L.usrMakeManager + '</button>' +
                '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>';
        } else {
            roleActionsHtml = '';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<button class="ad-btn ad-btn-secondary" id="adUsrBack">' + L.back + '</button>' +
                '<h2 class="ad-section-title">' + L.usrEdit + '</h2>' +
            '</div>' +
            '<div class="ad-form-card" style="max-width:700px;">' +
                // Avatar + info header
                '<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                    avatarHtml +
                    '<div>' +
                        '<div style="font-size:1.1rem;font-weight:600;color:var(--text-primary);">' + esc(user.full_name || user.email) + '</div>' +
                        '<div style="color:var(--text-dim);font-size:0.85rem;">' + esc(user.email || '') + '</div>' +
                        '<div style="display:flex;gap:8px;margin-top:4px;">' +
                            '<span style="color:' + tgColor + ';font-size:0.8rem;">TG: ' + tgStatus + '</span>' +
                            '<span style="color:var(--text-dim);font-size:0.8rem;">' + L.usrLastSeen + ': ' + lastSeen + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Profile form
                '<h3 style="font-size:0.9rem;color:var(--accent);margin-bottom:12px;font-weight:600;">' + L.usrProfile + '</h3>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrFullName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrName" value="' + esc(user.full_name || '') + '">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrPhone" value="' + esc(user.phone || '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrEmail + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrEmail" value="' + esc(user.email || '') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrRegistered + '</label>' +
                        '<input type="text" class="ad-field-input" value="' + regDate + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                '</div>' +
                '<button class="ad-btn ad-btn-primary" id="adUsrSave" style="margin-top:8px;">' + L.save + '</button>' +
                // Membership
                '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrMembership + '</h3>' +
                memHtml +
                // Actions
                '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrActions + '</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    roleActionsHtml +
                '</div>' +
            '</div>';

        // Event listeners
        document.getElementById('adUsrBack').addEventListener('click', function() {
            renderUsersList();
        });

        document.getElementById('adUsrSave').addEventListener('click', function() {
            saveUserHandler(user.id);
        });

        // Membership actions
        var giveMem = document.getElementById('adUsrGiveMem');
        if (giveMem) {
            giveMem.addEventListener('click', function() {
                var months = parseInt(document.getElementById('adUsrGivePeriod').value);
                giveMembership(user.id, months);
            });
        }

        var extendMem = document.getElementById('adUsrExtendMem');
        if (extendMem) {
            extendMem.addEventListener('click', function() {
                var months = parseInt(document.getElementById('adUsrExtendPeriod').value);
                extendMembership(membership.id, months);
            });
        }

        var cancelMem = document.getElementById('adUsrCancelMem');
        if (cancelMem) {
            cancelMem.addEventListener('click', function() {
                cancelMembership(membership.id, user.id);
            });
        }

        // Role actions
        var makeManager = document.getElementById('adUsrMakeManager');
        if (makeManager) {
            makeManager.addEventListener('click', function() {
                changeUserRole(user.id, 'manager');
            });
        }

        var removeManager = document.getElementById('adUsrRemoveManager');
        if (removeManager) {
            removeManager.addEventListener('click', function() {
                changeUserRole(user.id, 'user');
            });
        }

        var deleteBtn = document.getElementById('adUsrDelete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteUserHandler(user.id);
            });
        }
    }

    async function saveUserHandler(userId) {
        var nameEl = document.getElementById('adUsrName');
        var phoneEl = document.getElementById('adUsrPhone');
        if (!nameEl) return;

        var btn = document.getElementById('adUsrSave');
        if (btn) { btn.textContent = L.saving; btn.disabled = true; }

        var result = await client.from('profiles').update({
            full_name: nameEl.value.trim(),
            phone: phoneEl.value.trim() || null
        }).eq('id', userId);

        if (btn) { btn.disabled = false; btn.textContent = L.save; }

        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast(L.usrUserSaved, 'success');
        }
    }

    async function giveMembership(profileId, months) {
        var now = new Date();
        var end = new Date(now);
        end.setMonth(end.getMonth() + months);

        var result = await client.from('memberships').insert({
            profile_id: profileId,
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: end.toISOString(),
            note: isEn ? 'Admin: free membership' : 'Админ: бесплатное членство'
        });

        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast(L.usrMembershipGiven, 'success');
            loadAndEditUser(profileId);
        }
    }

    async function extendMembership(memId, months) {
        // Get current expiry
        var res = await client.from('memberships').select('expires_at').eq('id', memId).single();
        if (res.error || !res.data) { showToast('Error', 'error'); return; }

        var expiry = new Date(res.data.expires_at);
        if (expiry < new Date()) expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);

        var result = await client.from('memberships').update({
            expires_at: expiry.toISOString(),
            status: 'active'
        }).eq('id', memId);

        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast(L.usrMembershipExtended, 'success');
            // Reload current user
            var profileRes = await client.from('memberships').select('profile_id').eq('id', memId).single();
            if (profileRes.data) loadAndEditUser(profileRes.data.profile_id);
        }
    }

    async function cancelMembership(memId, profileId) {
        showConfirm(L.usrCancelMembership, L.deleteConfirmText, async function() {
            var result = await client.from('memberships').update({
                status: 'cancelled'
            }).eq('id', memId);

            if (result.error) {
                showToast(result.error.message, 'error');
            } else {
                showToast(L.usrMembershipCancelled, 'success');
                loadAndEditUser(profileId);
            }
        }, L.usrCancelMembership);
    }

    async function changeUserRole(userId, newRole) {
        if (userId === usrCurrentUserId) {
            showToast(L.usrCannotDeleteSelf, 'error');
            return;
        }

        var result = await client.from('profiles').update({ role: newRole }).eq('id', userId);

        if (result.error) {
            showToast(result.error.message, 'error');
        } else {
            showToast(L.usrRoleChanged, 'success');
            loadAndEditUser(userId);
        }
    }

    async function deleteUserHandler(userId) {
        if (userId === usrCurrentUserId) {
            showToast(L.usrCannotDeleteSelf, 'error');
            return;
        }

        showConfirm(L.usrDeleteConfirmTitle, L.usrDeleteConfirm, async function() {
            try {
                var session = await client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ action: 'delete_user', user_id: userId })
                });

                var data = await resp.json();
                if (data.error) {
                    showToast(data.error, 'error');
                } else {
                    showToast(L.usrUserDeleted, 'success');
                    renderUsersList();
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
            }
        });
    }

    function openAddManagerModal() {
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal" style="max-width:440px;">' +
                '<div class="ad-confirm-title">' + L.usrAddManagerTitle + '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.usrAddManagerEmail + ' *</label>' +
                    '<input type="email" class="ad-field-input" id="adMgrEmail" placeholder="email@example.com">' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrAddManagerFirstName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMgrFirstName">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrAddManagerLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMgrLastName">' +
                    '</div>' +
                '</div>' +
                '<div style="color:var(--text-dim);font-size:0.8rem;margin-bottom:16px;">' + L.usrAddManagerHint + '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adMgrCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-primary" id="adMgrSubmit">' + L.usrAddManager + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('adMgrCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('adMgrSubmit').addEventListener('click', async function() {
            var email = document.getElementById('adMgrEmail').value.trim();
            var firstName = document.getElementById('adMgrFirstName').value.trim();
            var lastName = document.getElementById('adMgrLastName').value.trim();

            if (!email) {
                showToast('Email required', 'error');
                return;
            }

            var btn = document.getElementById('adMgrSubmit');
            btn.textContent = L.saving;
            btn.disabled = true;

            try {
                var session = await client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        action: 'create_manager',
                        email: email,
                        first_name: firstName,
                        last_name: lastName
                    })
                });

                var data = await resp.json();
                if (data.error) {
                    showToast(data.error, 'error');
                    btn.textContent = L.usrAddManager;
                    btn.disabled = false;
                } else {
                    overlay.remove();
                    showToast(data.action === 'invited' ? L.usrManagerInvited : L.usrManagerAdded, 'success');
                    loadUsersList();
                }
            } catch (err) {
                showToast('Error: ' + err.message, 'error');
                btn.textContent = L.usrAddManager;
                btn.disabled = false;
            }
        });
    }

    // ============================================
    // UTILITIES
    // ============================================

    function transliterate(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'kh','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.split('').map(function(c) {
            var lower = c.toLowerCase();
            var mapped = map[lower];
            if (mapped === undefined) return c;
            if (mapped === '') return '';
            if (c !== lower) return mapped.charAt(0).toUpperCase() + mapped.slice(1);
            return mapped;
        }).join('');
    }

    function slugify(text) {
        var map = {'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'zh','з':'z','и':'i','й':'j','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'h','ц':'ts','ч':'ch','ш':'sh','щ':'shch','ъ':'','ы':'y','ь':'','э':'e','ю':'yu','я':'ya'};
        return text.toLowerCase().split('').map(function(c) { return map[c] || c; }).join('')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function sel(article, field, value) {
        return (article && article[field] === value) ? ' selected' : '';
    }

    function formatDateLocal(isoStr) {
        if (!isoStr) return '';
        var d = new Date(isoStr);
        if (isNaN(d)) return '';
        var pad = function(n) { return n < 10 ? '0' + n : n; };
        return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T' + pad(d.getHours()) + ':' + pad(d.getMinutes());
    }

    // ---- Toast ----
    function showToast(message, type) {
        var existing = document.querySelector('.ad-toast');
        if (existing) existing.remove();

        var toast = document.createElement('div');
        toast.className = 'ad-toast ad-toast-' + (type || 'success');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('ad-toast-show');
        });

        setTimeout(function() {
            toast.classList.remove('ad-toast-show');
            setTimeout(function() { toast.remove(); }, 400);
        }, 3000);
    }

    // ---- Confirm Modal ----
    function showConfirm(title, text, onConfirm, confirmLabel, onCancel) {
        var btnLabel = confirmLabel || L.delete;
        var btnClass = confirmLabel ? 'ad-btn-primary' : 'ad-btn-danger';
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal">' +
                '<div class="ad-confirm-title">' + title + '</div>' +
                '<div class="ad-confirm-text">' + text + '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adConfirmCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ' + btnClass + '" id="adConfirmOk">' + btnLabel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function dismiss() { overlay.remove(); if (onCancel) onCancel(); }
        document.getElementById('adConfirmCancel').addEventListener('click', dismiss);
        document.getElementById('adConfirmOk').addEventListener('click', function() { overlay.remove(); onConfirm(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) dismiss(); });
    }

    // ---- Translation (MyMemory API, free, no key) ----

    // Translate filled field(s) to empty ones (auto-detect source language)
    async function translateToEmpty(ruId, enId, kgId, btn) {
        var ruEl = document.getElementById(ruId);
        var enEl = document.getElementById(enId);
        var kgEl = kgId ? document.getElementById(kgId) : null;

        var ruVal = ruEl ? ruEl.value.trim() : '';
        var enVal = enEl ? enEl.value.trim() : '';
        var kgVal = kgEl ? kgEl.value.trim() : '';

        // Find source: first non-empty
        var srcLang = '';
        var srcText = '';
        if (ruVal) { srcLang = 'ru'; srcText = ruVal; }
        else if (enVal) { srcLang = 'en'; srcText = enVal; }
        else if (kgVal) { srcLang = 'kg'; srcText = kgVal; }

        if (!srcText) {
            showToast(L.fillRuFirst, 'error');
            return;
        }

        // Determine targets
        var targets = [];
        if (!ruVal && ruEl && srcLang !== 'ru') targets.push({ el: ruEl, lang: 'ru' });
        if (!enVal && enEl && srcLang !== 'en') targets.push({ el: enEl, lang: 'en' });
        if (!kgVal && kgEl && srcLang !== 'kg') targets.push({ el: kgEl, lang: 'kg' });

        if (targets.length === 0) {
            showToast(L.allFieldsFilled, 'info');
            return;
        }

        var origLabel = btn.textContent;
        btn.textContent = L.translating;
        btn.disabled = true;

        try {
            for (var i = 0; i < targets.length; i++) {
                var result = await translateText(srcText, srcLang, targets[i].lang);
                targets[i].el.value = result;
            }
        } catch (e) {
            showToast(L.translateError, 'error');
        }

        btn.textContent = origLabel;
        btn.disabled = false;
    }

    async function translateFromRu(text, targetLang) {
        return translateText(text, 'ru', targetLang);
    }

    async function translateText(text, fromLang, toLang) {
        var langMap = { ru: 'ru', en: 'en', kg: 'ky' };
        var from = langMap[fromLang] || fromLang;
        var to = langMap[toLang] || toLang;

        // Split long text into chunks (API limit ~500 chars)
        var lines = text.split('\n');
        var chunks = [];
        var current = '';

        for (var i = 0; i < lines.length; i++) {
            var next = current ? current + '\n' + lines[i] : lines[i];
            if (next.length > 450 && current) {
                chunks.push(current);
                current = lines[i];
            } else {
                current = next;
            }
        }
        if (current) chunks.push(current);

        var results = [];
        for (var j = 0; j < chunks.length; j++) {
            var url = 'https://api.mymemory.translated.net/get?q=' +
                encodeURIComponent(chunks[j]) + '&langpair=' + from + '|' + to;
            var resp = await fetch(url);
            var data = await resp.json();
            if (data.responseData && data.responseData.translatedText) {
                results.push(data.responseData.translatedText);
            } else {
                results.push(chunks[j]);
            }
        }

        return results.join('\n');
    }

})();
