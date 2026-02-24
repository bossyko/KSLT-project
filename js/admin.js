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
        catResults: 'Results',
        catInterview: 'Interview',
        catAnnouncement: 'Announcement',
        selectCategory: '— Select —',
        slugHint: 'Auto-generated from title. Used in URL.',
        publishedHint: 'Leave empty for draft',
        translateBtn: 'Translate from RU',
        translating: 'Translating...',
        translateError: 'Translation error',
        fillRuFirst: 'Fill in RU field first',
        noArticles: 'No articles yet',
        noArticlesText: 'Click "Add Article" to create your first article',
        thTitle: 'Title',
        thCategory: 'Category',
        thStatus: 'Status',
        thPublished: 'Date',
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
        trnMaxParticipants: 'Max Participants',
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
        crtPrice: 'Price (som/hr)',
        crtMobile: 'Mobile',
        crtLandline: 'Landline',
        crtAddPhone: '+ Add phone',
        crtEmail: 'Email',
        crtDescription: 'Description',
        crtAmenities: 'Amenities',
        crtPartner: 'Partner',
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
        ratNoLevels: 'Run SQL migration first to create tournament levels'
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
        catResults: 'Результаты',
        catInterview: 'Интервью',
        catAnnouncement: 'Анонс',
        selectCategory: '— Выберите —',
        slugHint: 'Генерируется из заголовка. Используется в URL.',
        publishedHint: 'Оставьте пустым для черновика',
        translateBtn: 'Перевести с RU',
        translating: 'Перевод...',
        translateError: 'Ошибка перевода',
        fillRuFirst: 'Сначала заполните поле RU',
        noArticles: 'Статей пока нет',
        noArticlesText: 'Нажмите "Добавить статью" чтобы создать первую статью',
        thTitle: 'Заголовок',
        thCategory: 'Категория',
        thStatus: 'Статус',
        thPublished: 'Дата',
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
        trnMaxParticipants: 'Макс. участников',
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
        crtPrice: 'Цена (сом/час)',
        crtMobile: 'Мобильный',
        crtLandline: 'Стационарный',
        crtAddPhone: '+ Добавить телефон',
        crtEmail: 'Email',
        crtDescription: 'Описание',
        crtAmenities: 'Удобства',
        crtPartner: 'Партнёр',
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
        ratNoLevels: 'Сначала выполните SQL миграцию для создания уровней турниров'
    };

    // Category map
    var CATEGORIES = {
        results: isEn ? 'Results' : 'Результаты',
        interview: isEn ? 'Interview' : 'Интервью',
        announcement: isEn ? 'Announcement' : 'Анонс'
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
        star: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>'
    };

    var SECTION_ICONS = {
        users: '👥',
        tournaments: '🏆',
        players: '📊',
        memberships: '💳',
        courts: '🏟️',
        coaches: '🎓',
        ratings: '⭐'
    };

    var currentRole = 'manager';

    var ROLE_SECTIONS = {
        admin:   ['dashboard', 'content', 'tournaments', 'players', 'courts', 'coaches', 'ratings', 'users', 'memberships'],
        manager: ['dashboard', 'content', 'tournaments', 'players', 'courts', 'coaches', 'ratings']
    };

    // ---- Auth Ready Callback ----
    window.onAuthReady = function(user, profile) {
        window.requireStaff();
        currentRole = profile.role || 'manager';
        renderSidebar(profile);
        renderMobileTabs();
        renderDashboard();
        renderNewsSection();
        renderTournamentsSection();
        renderPlayersSection();
        renderCourtsSection();
        renderCoachesSection();
        renderRatingsSection();
        renderPlaceholders();
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
            { key: 'users',     icon: ICONS.users,  label: L.users,     badge: true },
            { key: 'memberships', icon: ICONS.card, label: L.memberships, badge: true }
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
    }

    // ---- Render Dashboard ----
    function renderDashboard() {
        var container = document.getElementById('ad-dashboard');
        if (!container) return;

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.dashboardTitle + '</h2>' +
            '<div class="ad-stats-grid" id="adStatsGrid">' +
                renderStatCard(L.iconUsers, '...', L.totalUsers) +
                renderStatCard(L.iconMemberships, '...', L.activeMemberships) +
                renderStatCard(L.iconTournaments, '...', L.upcomingTournaments) +
                renderStatCard(L.iconPlayers, '...', L.rankedPlayers) +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-card-title">' + L.recentRegistrations + '</div>' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adRecentTable">' +
                        '<thead><tr>' +
                            '<th>' + L.thUser + '</th>' +
                            '<th>' + L.thEmail + '</th>' +
                            '<th>' + L.thRole + '</th>' +
                            '<th>' + L.thDate + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        loadStats();
    }

    function renderStatCard(icon, value, label) {
        return '<div class="ad-stat-card">' +
            '<div class="ad-stat-icon">' + icon + '</div>' +
            '<div class="ad-stat-value">' + value + '</div>' +
            '<div class="ad-stat-label">' + label + '</div>' +
        '</div>';
    }

    async function loadStats() {
        if (!client) return;

        var today = new Date().toISOString().split('T')[0];

        var results = await Promise.allSettled([
            client.from('profiles').select('id', { count: 'exact', head: true }),
            client.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('expires_at', today),
            client.from('tournaments').select('id', { count: 'exact', head: true }).gte('date_start', today),
            client.from('players').select('id', { count: 'exact', head: true }),
            client.from('profiles').select('id,full_name,email,role,avatar_url,created_at').order('created_at', { ascending: false }).limit(10)
        ]);

        var grid = document.getElementById('adStatsGrid');
        if (grid) {
            var counts = [getCount(results[0]), getCount(results[1]), getCount(results[2]), getCount(results[3])];
            var labels = [L.totalUsers, L.activeMemberships, L.upcomingTournaments, L.rankedPlayers];
            var icons = [L.iconUsers, L.iconMemberships, L.iconTournaments, L.iconPlayers];
            grid.innerHTML = '';
            for (var i = 0; i < 4; i++) {
                grid.innerHTML += renderStatCard(icons[i], counts[i], labels[i]);
            }
        }

        var table = document.getElementById('adRecentTable');
        if (table) {
            var tbody = table.querySelector('tbody');
            var users = (results[4].status === 'fulfilled' && results[4].value.data) ? results[4].value.data : [];

            if (users.length === 0) {
                tbody.innerHTML = '<tr><td colspan="4" style="text-align:center;color:var(--text-dim);padding:40px;">' + L.noData + '</td></tr>';
            } else {
                tbody.innerHTML = '';
                users.forEach(function(u) {
                    var nameParts = (u.full_name || '').split(' ');
                    var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';
                    var avatarHtml = u.avatar_url
                        ? '<img src="' + esc(u.avatar_url) + '" class="ad-table-avatar" alt="">'
                        : '<div class="ad-table-avatar-placeholder">' + initials + '</div>';
                    var roleClass = 'ad-role-badge-' + (u.role || 'user');
                    var roleLabel = L['role' + (u.role || 'user').charAt(0).toUpperCase() + (u.role || 'user').slice(1)] || u.role;
                    var dateStr = u.created_at ? new Date(u.created_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU') : L.noData;

                    tbody.innerHTML +=
                        '<tr>' +
                            '<td><div class="ad-table-user-cell">' + avatarHtml +
                                '<div><div class="ad-table-user-name">' + (u.full_name || L.noData) + '</div></div>' +
                            '</div></td>' +
                            '<td>' + (u.email || L.noData) + '</td>' +
                            '<td><span class="ad-role-badge ' + roleClass + '">' + roleLabel + '</span></td>' +
                            '<td>' + dateStr + '</td>' +
                        '</tr>';
                });
            }
        }
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
    var newsImageFile = null;
    var newsImageUrl = '';

    function renderNewsSection() {
        renderNewsList();
    }

    // ---- News List ----
    async function renderNewsList() {
        var container = document.getElementById('ad-content');
        if (!container) return;

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.content + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adNewsAdd">+ ' + L.addNews + '</button>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adNewsTable">' +
                        '<thead><tr>' +
                            '<th></th>' +
                            '<th>' + L.thTitle + '</th>' +
                            '<th>' + L.thCategory + '</th>' +
                            '<th>' + L.thStatus + '</th>' +
                            '<th>' + L.thPublished + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('adNewsAdd').addEventListener('click', function() {
            renderNewsForm(null);
        });

        await loadNewsList();
    }

    async function loadNewsList() {
        if (!client) return;

        var result = await client.from('news')
            .select('id,title,image,category,published_at,created_at')
            .order('created_at', { ascending: false });

        var table = document.getElementById('adNewsTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var articles = result.data || [];

        if (articles.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📝</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noArticles + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noArticlesText + '</div>' +
                '</td></tr>';
            return;
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

            tbody.innerHTML +=
                '<tr data-news-id="' + a.id + '">' +
                    bulkCheckboxTd(a.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (a.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td>' + statusHtml + '</td>' +
                    '<td>' + dateStr + '</td>' +
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
        newsImageFile = null;
        newsImageUrl = (article && article.image) ? article.image : '';

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
                        '<button type="button" class="ad-btn-translate" data-src="adNewsTitle" data-target="adNewsTitleEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitleKg" placeholder="' + L.newsTitle + ' (KG)" value="' + esc(article ? article.title_kg : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adNewsTitle" data-target="adNewsTitleKg" data-tolang="kg">&#127760; ' + L.translateBtn + '</button>' +
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
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerpt" placeholder="' + L.newsExcerpt + ' (RU)">' + esc(article ? article.excerpt : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerptEn" placeholder="' + L.newsExcerpt + ' (EN)">' + esc(article ? article.excerpt_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adNewsExcerpt" data-target="adNewsExcerptEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Content
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsContent + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContent" placeholder="' + L.newsContent + ' (RU)">' + esc(article ? article.content : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContentEn" placeholder="' + L.newsContent + ' (EN)">' + esc(article ? article.content_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adNewsContent" data-target="adNewsContentEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Meta: category, author, date
            '<div class="ad-form-card">' +
                '<div class="ad-field-row-3 ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsCategory + '</label>' +
                        '<select class="ad-field-input" id="adNewsCat">' +
                            '<option value="">' + L.selectCategory + '</option>' +
                            '<option value="results"' + sel(article, 'category', 'results') + '>' + CATEGORIES.results + '</option>' +
                            '<option value="interview"' + sel(article, 'category', 'interview') + '>' + CATEGORIES.interview + '</option>' +
                            '<option value="announcement"' + sel(article, 'category', 'announcement') + '>' + CATEGORIES.announcement + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsAuthor + '</label>' +
                        '<input type="text" class="ad-field-input" id="adNewsAuthor" value="' + esc(article ? article.author : 'KSLT Media') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsPublishedAt + '</label>' +
                        '<input type="datetime-local" class="ad-field-input" id="adNewsPubDate" value="' + formatDateLocal(article ? article.published_at : '') + '">' +
                        '<div class="ad-field-hint">' + L.publishedHint + '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adNewsSave">' + L.save + '</button>' +
                (newsEditingId ? '<button class="ad-btn ad-btn-danger" id="adNewsDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back
        document.getElementById('adNewsBack').addEventListener('click', function() {
            renderNewsList();
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

        // Auto-slug from title
        var titleInput = document.getElementById('adNewsTitle');
        var slugInput = document.getElementById('adNewsSlug');
        if (titleInput && slugInput && !newsEditingId) {
            titleInput.addEventListener('input', function() {
                slugInput.value = slugify(titleInput.value);
            });
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

        // Save
        document.getElementById('adNewsSave').addEventListener('click', saveNewsHandler);

        // Delete
        var delBtn = document.getElementById('adNewsDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                showConfirm(L.deleteConfirm, L.deleteConfirmText, function() {
                    deleteNewsHandler();
                });
            });
        }
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

    // ---- Save News ----
    async function saveNewsHandler() {
        var saveBtn = document.getElementById('adNewsSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Upload image if file selected
            var imageUrl = newsImageUrl;
            if (newsImageFile) {
                imageUrl = await uploadNewsImage(newsImageFile);
                if (!imageUrl) {
                    // detailed error already shown by uploadNewsImage
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            var pubDate = document.getElementById('adNewsPubDate').value;

            var data = {
                title: document.getElementById('adNewsTitle').value.trim(),
                title_en: document.getElementById('adNewsTitleEn').value.trim(),
                title_kg: document.getElementById('adNewsTitleKg').value.trim(),
                slug: document.getElementById('adNewsSlug').value.trim(),
                excerpt: document.getElementById('adNewsExcerpt').value.trim(),
                excerpt_en: document.getElementById('adNewsExcerptEn').value.trim(),
                content: document.getElementById('adNewsContent').value.trim(),
                content_en: document.getElementById('adNewsContentEn').value.trim(),
                image: imageUrl || null,
                category: document.getElementById('adNewsCat').value,
                author: document.getElementById('adNewsAuthor').value.trim(),
                published_at: pubDate ? new Date(pubDate).toISOString() : null
            };

            if (!data.title) {
                showToast(isEn ? 'Title is required' : 'Заголовок обязателен', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
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
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            showToast(L.saved, 'success');
            renderNewsList();
        } catch (e) {
            showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
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

    async function renderTournamentsSection() {
        await loadCategories();
        await loadTournamentLevels();
        renderTournamentsList();
    }

    // ---- Tournament List ----
    async function renderTournamentsList() {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.tournaments + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adTrnAdd">+ ' + L.addTournament + '</button>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adTrnTable">' +
                        '<thead><tr>' +
                            '<th></th>' +
                            '<th>' + L.trnTitle + '</th>' +
                            '<th>' + L.trnCategory + '</th>' +
                            '<th>' + L.trnStatus + '</th>' +
                            '<th>' + L.trnDateStart + '</th>' +
                            '<th>' + L.trnMaxParticipants + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('adTrnAdd').addEventListener('click', function() {
            renderTournamentForm(null);
        });

        await loadTournamentsList();
    }

    async function loadTournamentsList() {
        if (!client) return;

        var result = await client.from('tournaments')
            .select('id,title,image,category_id,status,date_start,date_end,max_participants,bracket_type,draw_size')
            .order('created_at', { ascending: false });

        var table = document.getElementById('adTrnTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏆</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noTournaments + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noTournamentsText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(t) {
            var thumbHtml = t.image
                ? '<img src="' + esc(t.image) + '" class="ad-table-thumb" alt="">'
                : '<div class="ad-table-thumb" style="background:var(--bg-elevated);"></div>';

            var catObj = categoriesMap[t.category_id];
            var catLabel = catObj ? (catObj.gender === 'women' ? '♀ ' : '♂ ') + (isEn ? catObj.name_en : catObj.name) : (t.category_id || L.noData);
            var statusLabel = TOURNAMENT_STATUSES[t.status] || t.status || L.noData;
            var statusClass = 'ad-status-' + (t.status || '').replace(/_/g, '-');

            var dateStr = t.date_start
                ? new Date(t.date_start + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : L.noData;
            if (t.date_end && t.date_end !== t.date_start) {
                dateStr += ' — ' + new Date(t.date_end + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU');
            }

            tbody.innerHTML +=
                '<tr data-trn-id="' + t.id + '">' +
                    bulkCheckboxTd(t.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (t.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td><span class="ad-status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td>' + dateStr + '</td>' +
                    '<td>' + (t.max_participants || L.noData) + '</td>' +
                    '<td>' + (t.bracket_type ? '<button class="ad-btn ad-btn-sm ad-btn-secondary ad-brk-btn" data-brk-id="' + t.id + '">' + L.bracketTab + '</button>' : '') + '</td>' +
                '</tr>';
        });

        // Click bracket button
        tbody.addEventListener('click', function(e) {
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
        });

        setupBulkDelete({ tableId: 'adTrnTable', tableName: 'tournaments', reloadFn: loadTournamentsList });
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
                });
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
                await finalizeTournament(tournament, matches, playersMap);
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
            else if (place <= 4) medal = '<span style="margin-right:4px;">🥉</span>';

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
        var sets = (match.score && match.score !== 'BYE') ? match.score.split(' ') : [];
        var sv = [['','','',''],['','','',''],['','','','']]; // [p1, p2, tb1, tb2]
        for (var i = 0; i < 3; i++) {
            if (sets[i]) {
                var tbMatch = sets[i].match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (tbMatch) {
                    sv[i] = [tbMatch[1], tbMatch[2], tbMatch[3] || '', tbMatch[4] || ''];
                } else {
                    // fallback: old format 7/6(4) → loser score only
                    var oldMatch = sets[i].match(/^(\d+)\/(\d+)(?:\((\d+)\))?$/);
                    if (oldMatch) {
                        sv[i] = [oldMatch[1], oldMatch[2], '', oldMatch[3] || ''];
                    }
                }
            }
        }

        function setRowHtml(setNum, vals) {
            var id1 = 'adS' + setNum + 'P1';
            var id2 = 'adS' + setNum + 'P2';
            var idTB1 = 'adS' + setNum + 'TB1';
            var idTB2 = 'adS' + setNum + 'TB2';
            return '<div class="ad-score-set-row" data-set="' + setNum + '">' +
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
                    setRowHtml(1, sv[0]) +
                    setRowHtml(2, sv[1]) +
                    '<div id="adSet3Block" style="display:none;">' +
                        setRowHtml(3, sv[2]) +
                    '</div>' +
                    // Winner auto-display
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

        // Show/hide tiebreak inputs when 7:6 or 6:7
        function checkTiebreaks() {
            for (var s = 1; s <= 3; s++) {
                var v1 = parseInt(document.getElementById('adS' + s + 'P1').value) || 0;
                var v2 = parseInt(document.getElementById('adS' + s + 'P2').value) || 0;
                var tbWrap = document.getElementById('adS' + s + 'TB1Wrap');
                if (tbWrap) {
                    tbWrap.style.display = ((v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7)) ? 'inline-flex' : 'none';
                }
            }
        }

        function updateState() {
            checkTiebreaks();

            var s1p1 = parseInt(document.getElementById('adS1P1').value) || 0;
            var s1p2 = parseInt(document.getElementById('adS1P2').value) || 0;
            var s2p1 = parseInt(document.getElementById('adS2P1').value) || 0;
            var s2p2 = parseInt(document.getElementById('adS2P2').value) || 0;
            var s3p1 = parseInt(document.getElementById('adS3P1').value) || 0;
            var s3p2 = parseInt(document.getElementById('adS3P2').value) || 0;

            var p1Sets = 0, p2Sets = 0;
            if (s1p1 > s1p2) p1Sets++; else if (s1p2 > s1p1) p2Sets++;
            if (s2p1 > s2p2) p1Sets++; else if (s2p2 > s2p1) p2Sets++;

            // Show set 3 if 1:1
            var set3Block = document.getElementById('adSet3Block');
            var showSet3 = (p1Sets === 1 && p2Sets === 1);
            set3Block.style.display = showSet3 ? '' : 'none';

            if (showSet3) {
                if (s3p1 > s3p2) p1Sets++; else if (s3p2 > s3p1) p2Sets++;
            }

            // Winner
            var winnerId = '';
            var winnerDisplay = document.getElementById('adWinnerDisplay');
            if (p1Sets >= 2) {
                winnerId = match.player1_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + esc(p1Name) + '</span>';
            } else if (p2Sets >= 2) {
                winnerId = match.player2_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + esc(p2Name) + '</span>';
            } else {
                var label = (p1Sets + p2Sets > 0) ? (p1Sets + ':' + p2Sets) : (isEn ? 'Enter score' : 'Введите счёт');
                winnerDisplay.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem;">' + label + '</span>';
            }
            document.getElementById('adScoreWinner').value = winnerId;
        }

        // Filter input: only 0-7 for game scores, digits for TB
        overlay.querySelectorAll('.ad-set-game').forEach(function(input) {
            input.addEventListener('input', function() {
                var v = input.value.replace(/[^0-7]/g, '');
                if (v.length > 1) v = v.charAt(v.length - 1);
                input.value = v;
                updateState();
                // Auto-focus next input
                if (v.length === 1) {
                    var next = input.closest('.ad-score-set-row').querySelector('.ad-set-game:not(:focus) , .ad-tb-input');
                    var allInputs = Array.from(overlay.querySelectorAll('.ad-set-game, .ad-tb-input'));
                    var idx = allInputs.indexOf(input);
                    if (idx >= 0 && idx < allInputs.length - 1) allInputs[idx + 1].focus();
                }
            });
        });
        overlay.querySelectorAll('.ad-tb-input').forEach(function(input) {
            input.addEventListener('input', function() {
                input.value = input.value.replace(/[^0-9]/g, '').slice(0, 2);
                updateState();
            });
        });

        updateState();

        // Close
        document.getElementById('adScoreClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Save
        document.getElementById('adScoreSave').addEventListener('click', async function() {
            var s1p1 = document.getElementById('adS1P1').value;
            var s1p2 = document.getElementById('adS1P2').value;
            var s2p1 = document.getElementById('adS2P1').value;
            var s2p2 = document.getElementById('adS2P2').value;
            var s3p1 = document.getElementById('adS3P1').value;
            var s3p2 = document.getElementById('adS3P2').value;
            var winnerId = document.getElementById('adScoreWinner').value;

            if (s1p1 === '' || s1p2 === '' || s2p1 === '' || s2p2 === '') {
                showToast(isEn ? 'Enter at least 2 sets' : 'Введите минимум 2 сета', 'error');
                return;
            }
            if (!isValidSet(s1p1, s1p2)) {
                showToast(isEn ? 'Invalid Set 1 score' : 'Некорректный счёт сета 1', 'error');
                return;
            }
            if (!isValidSet(s2p1, s2p2)) {
                showToast(isEn ? 'Invalid Set 2 score' : 'Некорректный счёт сета 2', 'error');
                return;
            }
            if (s3p1 !== '' && s3p2 !== '' && !isValidSet(s3p1, s3p2)) {
                showToast(isEn ? 'Invalid Set 3 score' : 'Некорректный счёт сета 3', 'error');
                return;
            }
            if (!winnerId) {
                showToast(isEn ? 'Cannot determine winner' : 'Невозможно определить победителя', 'error');
                return;
            }

            // Build score string with tiebreak: "6/4 7/6(11-9)" format
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
            var set1 = buildSet(1); if (set1) scoreParts.push(set1);
            var set2 = buildSet(2); if (set2) scoreParts.push(set2);
            var set3 = buildSet(3); if (set3) scoreParts.push(set3);
            var scoreStr = scoreParts.join(' ');

            // Update match
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

            // Auto-advance winner to next round
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

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.players + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adPlrAdd">+ ' + L.addPlayer + '</button>' +
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

        document.getElementById('adPlrAdd').addEventListener('click', function() {
            renderPlayerForm(null);
        });

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
                '<tr data-plr-id="' + p.id + '">' +
                    bulkCheckboxTd(p.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (p.country || '') + ' ' + (p.name || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.points || 0) + '</td>' +
                    '<td>' + (p.wins || 0) + '/' + (p.losses || 0) + '</td>' +
                    '<td><span class="' + changeClass + '">' + changeStr + '</span></td>' +
                '</tr>';
        });

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-plr-id]');
            if (!row) return;
            loadAndEditPlayer(row.dataset.plrId);
        });

        setupBulkDelete({ tableId: 'adPlrTable', tableName: 'players', reloadFn: loadPlayersList });
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
    var crtSearchQuery = '';
    var crtCourtTypes = [];
    var crtPhones = [];

    async function renderCourtsSection() {
        renderCourtsList();
    }

    // ---- Courts List ----
    async function renderCourtsList() {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        var typeFilterHtml = '<option value="">' + L.crtAllTypes + '</option>';
        Object.keys(COURT_TYPES).forEach(function(k) {
            var selected = crtFilterType === k ? ' selected' : '';
            typeFilterHtml += '<option value="' + k + '"' + selected + '>' + COURT_TYPES[k] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.courts + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adCrtAdd">+ ' + L.addCourt + '</button>' +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCrtSearch" placeholder="' + L.crtSearch + '" value="' + esc(crtSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCrtTypeFilter">' + typeFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adCrtTable">' +
                        '<thead><tr>' +
                            '<th></th>' +
                            '<th>' + L.crtName + '</th>' +
                            '<th>' + L.crtType + ' / ' + L.crtSurface + '</th>' +
                            '<th>' + L.crtPrice + '</th>' +
                            '<th>' + L.crtPartner + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('adCrtAdd').addEventListener('click', function() {
            renderCourtForm(null);
        });

        var searchTimer = null;
        document.getElementById('adCrtSearch').addEventListener('input', function() {
            crtSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadCourtsList(); }, 300);
        });

        document.getElementById('adCrtTypeFilter').addEventListener('change', function() {
            crtFilterType = this.value;
            loadCourtsList();
        });

        await loadCourtsList();
    }

    async function loadCourtsList() {
        if (!client) return;

        var query = client.from('courts')
            .select('id,name,photo,court_types,partner')
            .order('created_at', { ascending: false });

        if (crtSearchQuery) {
            query = query.ilike('name', '%' + crtSearchQuery + '%');
        }

        var result = await query;

        var table = document.getElementById('adCrtTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        // Client-side filter by type
        if (crtFilterType) {
            items = items.filter(function(c) {
                var types = c.court_types || [];
                return types.some(function(t) { return t.type === crtFilterType; });
            });
        }

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏟️</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noCourts + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noCourtsText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(c) {
            var thumbHtml = c.photo
                ? '<img src="' + esc(c.photo) + '" class="ad-table-thumb" alt="">'
                : '<div class="ad-table-thumb" style="background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">🏟️</div>';

            var types = c.court_types || [];
            var typeSummary = types.map(function(t) {
                return '<div class="ad-court-type-line">' +
                    '<span class="ad-type-badge ad-type-' + (t.type || 'indoor') + '">' + (COURT_TYPES[t.type] || t.type) + '</span> ' +
                    (COURT_SURFACES[t.surface] || t.surface || '') + ' &times;' + (t.count || 1) +
                    ' <span style="color:var(--accent);font-weight:600;">' + (t.price || 0) + ' сом</span>' +
                '</div>';
            }).join('');
            if (!typeSummary) typeSummary = L.noData;

            var partnerHtml = c.partner ? '<span class="ad-partner-badge">✓</span>' : '';

            tbody.innerHTML +=
                '<tr data-crt-id="' + c.id + '">' +
                    bulkCheckboxTd(c.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (c.name || L.noData) + '</td>' +
                    '<td>' + typeSummary + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + types.reduce(function(s, t) { return s + (t.price || 0); }, 0) + '</td>' +
                    '<td style="text-align:center;">' + partnerHtml + '</td>' +
                '</tr>';
        });

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-crt-id]');
            if (!row) return;
            loadAndEditCourt(row.dataset.crtId);
        });

        setupBulkDelete({ tableId: 'adCrtTable', tableName: 'courts', reloadFn: loadCourtsList });
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

            // Gallery (thumbnails + upload)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtGallery + '</div>' +
                '<div class="ad-gallery-grid" id="adCrtGalleryGrid"></div>' +
                '<input type="file" accept="image/jpeg,image/png" multiple id="adCrtGalleryInput" style="display:none">' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtGalleryAdd">+ ' + L.uploadImage + '</button>' +
            '</div>' +

            // Name (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtName + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtName" placeholder="' + L.crtName + ' (RU)" value="' + esc(item ? item.name : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtNameEn" placeholder="' + L.crtName + ' (EN)" value="' + esc(item ? item.name_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adCrtName" data-target="adCrtNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
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

            // Links: Google Maps + 2GIS
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
            '</div>' +

            // Address form
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Address' : 'Адрес') + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
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
                            '<button type="button" class="ad-btn-translate" data-src="adCrtStreet" data-target="adCrtStreetEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtDistrict + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtDistrictEn" value="' + esc(item ? item.district_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adCrtDistrict" data-target="adCrtDistrictEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtCity + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtCityEn" value="' + esc(item ? item.city_en : 'Bishkek') + '">' +
                    '</div>' +
                '</div>' +
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

            // Description (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtDescription + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDesc" rows="4" placeholder="' + L.crtDescription + ' (RU)">' + esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDescEn" rows="4" placeholder="' + L.crtDescription + ' (EN)">' + esc(item ? item.description_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adCrtDesc" data-target="adCrtDescEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Amenities (checkbox grid)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtAmenities + '</div>' +
                '<div class="ad-badges-grid" id="adCrtAmenities">' + amenitiesCheckboxHtml + '</div>' +
            '</div>' +

            // Slogan (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtSlogan + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtSlogan" placeholder="' + L.crtSlogan + ' (RU)" value="' + esc(item ? item.slogan : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtSloganEn" placeholder="' + L.crtSlogan + ' (EN)" value="' + esc(item ? item.slogan_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adCrtSlogan" data-target="adCrtSloganEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
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
            return html;
        }
        function renderCrtTypeRows() {
            var rowsEl = document.getElementById('adCrtTypesRows');
            if (!rowsEl) return;
            var html = '';
            crtCourtTypes.forEach(function(ct, idx) {
                html += '<div class="ad-court-type-row" data-idx="' + idx + '">' +
                    '<select class="ad-field-input ad-ct-type">' + buildTypeOptions(ct.type) + '</select>' +
                    '<select class="ad-field-input ad-ct-surface">' + buildSurfaceOptions(ct.surface) + '</select>' +
                    '<input type="text" class="ad-field-input ad-ct-count" inputmode="numeric" value="' + (ct.count || '') + '">' +
                    '<input type="text" class="ad-field-input ad-ct-price" inputmode="numeric" value="' + (ct.price || '') + '">' +
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
            if (e.target.classList.contains('ad-ct-surface')) crtCourtTypes[idx].surface = e.target.value;
            if (e.target.classList.contains('ad-ct-partner')) crtCourtTypes[idx].partner = e.target.checked;
        });
        document.getElementById('adCrtTypesRows').addEventListener('input', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-count')) crtCourtTypes[idx].count = parseInt(e.target.value, 10) || 0;
            if (e.target.classList.contains('ad-ct-price')) crtCourtTypes[idx].price = parseInt(e.target.value, 10) || 0;
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
                photo: imageUrl || null,
                gallery: galleryFinal,
                court_types: crtCourtTypes,
                google_maps_url: document.getElementById('adCrtGoogleMaps').value.trim() || null,
                twogis_url: document.getElementById('adCrtTwoGis').value.trim() || null,
                street: document.getElementById('adCrtStreet').value.trim() || null,
                street_en: document.getElementById('adCrtStreetEn').value.trim() || null,
                building: document.getElementById('adCrtBuilding').value.trim() || null,
                district: document.getElementById('adCrtDistrict').value.trim() || null,
                district_en: document.getElementById('adCrtDistrictEn').value.trim() || null,
                city: document.getElementById('adCrtCity').value.trim() || null,
                city_en: document.getElementById('adCrtCityEn').value.trim() || null,
                postal_code: document.getElementById('adCrtPostal').value.trim() || null,
                phone: phonesStr || null,
                email: document.getElementById('adCrtEmail').value.trim() || null,
                description: document.getElementById('adCrtDesc').value.trim() || null,
                description_en: document.getElementById('adCrtDescEn').value.trim() || null,
                amenities: amenities,
                slogan: document.getElementById('adCrtSlogan').value.trim() || null,
                slogan_en: document.getElementById('adCrtSloganEn').value.trim() || null,
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
                '<button class="ad-btn ad-btn-primary" id="adCchAdd">+ ' + L.addCoach + '</button>' +
            '</div>' +
            '<div class="ad-filters">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCchSearch" placeholder="' + L.cchSearch + '" value="' + esc(cchSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCchTagFilter">' + tagFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-wrap">' +
                '<table class="ad-table ad-table-clickable" id="adCchTable">' +
                    '<thead><tr>' +
                        '<th style="width:50px"></th>' +
                        '<th>' + (isEn ? 'Name' : 'ФИО') + '</th>' +
                        '<th>' + L.cchPosition + '</th>' +
                        '<th>' + L.cchPrice + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>';

        document.getElementById('adCchAdd').addEventListener('click', function() {
            renderCoachForm(null);
        });
        document.getElementById('adCchSearch').addEventListener('input', function() {
            cchSearchQuery = this.value;
            loadCoachesList();
        });
        document.getElementById('adCchTagFilter').addEventListener('change', function() {
            cchFilterTag = this.value;
            loadCoachesList();
        });

        loadCoachesList();
    }

    async function loadCoachesList() {
        if (!client) return;
        var table = document.getElementById('adCchTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        var query = client.from('coaches').select('*').order('created_at', { ascending: false });
        if (cchSearchQuery) {
            query = query.or('last_name.ilike.%' + cchSearchQuery + '%,first_name.ilike.%' + cchSearchQuery + '%');
        }

        var result = await query;
        if (result.error) { showToast(result.error.message, 'error'); return; }

        var rows = result.data || [];

        // Client-side tag filter
        if (cchFilterTag) {
            rows = rows.filter(function(r) {
                return (r.tags || []).indexOf(cchFilterTag) !== -1;
            });
        }

        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" class="ad-empty">' +
                '<div class="ad-empty-icon">🎓</div>' +
                '<div class="ad-empty-title">' + L.noCoaches + '</div>' +
                '<div class="ad-empty-text">' + L.noCoachesText + '</div>' +
            '</td></tr>';
            return;
        }

        var html = '';
        rows.forEach(function(row) {
            var photoHtml = row.photo
                ? '<img src="' + esc(row.photo) + '" class="ad-table-thumb" alt="">'
                : '<div class="ad-table-thumb-placeholder">🎓</div>';
            var fullName = isEn
                ? ((row.last_name_en || row.last_name || '') + ' ' + (row.first_name_en || row.first_name || ''))
                : ((row.last_name || '') + ' ' + (row.first_name || ''));
            var pos = isEn ? (row.position_en || row.position || '') : (row.position || '');

            html += '<tr data-id="' + row.id + '">' +
                bulkCheckboxTd(row.id) +
                '<td>' + photoHtml + '</td>' +
                '<td><strong>' + esc(fullName.trim()) + '</strong></td>' +
                '<td>' + esc(pos) + '</td>' +
                '<td>' + (row.price || '—') + '</td>' +
            '</tr>';
        });
        tbody.innerHTML = html;

        // Click to edit
        tbody.querySelectorAll('tr[data-id]').forEach(function(tr) {
            tr.addEventListener('click', function(e) {
                if (e.target.closest('.ad-bulk-cell')) return;
                loadAndEditCoach(tr.dataset.id);
            });
        });

        setupBulkDelete({ tableId: 'adCchTable', tableName: 'coaches', reloadFn: loadCoachesList });
    }

    async function loadAndEditCoach(id) {
        if (!client) return;
        var result = await client.from('coaches').select('*').eq('id', id).single();
        if (result.error) { showToast(result.error.message, 'error'); return; }
        renderCoachForm(result.data);
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

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.ratings + '</h2>' +
            '<div class="ad-rat-tabs">' +
                '<button class="ad-rat-tab active" data-rattab="rankings">' + L.ratSubRankings + '</button>' +
                '<button class="ad-rat-tab" data-rattab="results">' + L.ratSubResults + '</button>' +
                '<button class="ad-rat-tab" data-rattab="rules">' + L.ratSubRules + '</button>' +
                '<button class="ad-rat-tab" data-rattab="promotions">' + L.ratSubPromotions + '</button>' +
            '</div>' +
            '<div class="ad-rat-panel active" id="ratPanelRankings"></div>' +
            '<div class="ad-rat-panel" id="ratPanelResults"></div>' +
            '<div class="ad-rat-panel" id="ratPanelRules"></div>' +
            '<div class="ad-rat-panel" id="ratPanelPromotions"></div>';

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
                    renderRatResults();
                    renderRatRules();
                    renderRatPromotions();
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
    // PLACEHOLDERS
    // ============================================

    function renderPlaceholders() {
        var sections = ['users', 'memberships'];
        sections.forEach(function(key) {
            var container = document.getElementById('ad-' + key);
            if (!container) return;

            var title = L[key] || key;
            var icon = SECTION_ICONS[key] || '🔧';

            container.innerHTML =
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<div class="ad-coming-soon">' +
                    '<div class="ad-coming-soon-icon">' + icon + '</div>' +
                    '<div class="ad-coming-soon-title">' + L.comingSoonTitle + '</div>' +
                    '<div class="ad-coming-soon-text">' + L.comingSoonText + '</div>' +
                '</div>';
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
    function showConfirm(title, text, onConfirm, confirmLabel) {
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

        document.getElementById('adConfirmCancel').addEventListener('click', function() { overlay.remove(); });
        document.getElementById('adConfirmOk').addEventListener('click', function() { overlay.remove(); onConfirm(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    }

    // ---- Translation (MyMemory API, free, no key) ----
    async function translateFromRu(text, targetLang) {
        var langMap = { en: 'en', kg: 'ky' };
        var toLang = langMap[targetLang] || targetLang;

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
                encodeURIComponent(chunks[j]) + '&langpair=ru|' + toLang;
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
