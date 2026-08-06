// @ts-nocheck
// ============================================
// KSLT — Dashboard (Личный кабинет)
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Labels
    var L = isKg ? {
        profile: 'Профиль', tournaments: 'Менин мелдештерим',
        stats: 'Статистика', invitations: 'Чакыруулар', settings: 'Жөндөөлөр',
        profileTitle: 'Менин профилим', tournamentsTitle: 'Менин мелдештерим',
        statsTitle: 'Статистика', settingsTitle: 'Жөндөөлөр',
        membership: 'Мүчөлүк',
        memberActive: 'Активдүү',
        memberExpired: 'Мөөнөтү бүттү',
        memberNone: 'Мүчөлүк жок',
        memberExpiresIn: 'Мөөнөтү бүтөт',
        memberDays: 'күн',
        memberExpiredText: 'Сиздин мүчөлүгүңүздүн мөөнөтү бүттү',
        memberNoneText: 'Мелдештерге катышуу үчүн мүчөлүк алыңыз',
        memberRenew: 'Жаңылоо',
        memberGet: 'Мүчөлүк алуу',
        firstName: 'Аты', lastName: 'Фамилиясы',
        email: 'Email', phone: 'Телефон', gender: 'Жынысы',
        birthday: 'Туулган күнү', birthDay: 'Күн', birthMonth: 'Ай', birthYear: 'Жыл (милдеттүү эмес)',
        months: ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
        male: 'Эркек', female: 'Аял', selectGender: '— Тандаңыз —',
        instagram: 'Instagram', telegram: 'Telegram',
        tgConnected: 'Telegram байланган',
        tgConnect: 'Telegram байлоо',
        tgConnectHint: 'Мүчөлүк мөөнөтү жөнүндө Telegram аркылуу эскертме алыңыз',
        showSocials: 'Башка колдонуучулар менин социалдык тармактарымды көрө алат',
        save: 'Сактоо', saving: 'Сакталууда...', saved: 'Сакталды!',
        changeAvatar: 'Сүрөттү өзгөртүү', removeAvatar: 'Жок кылуу',
        avatarHint: 'JPG же PNG, макс 2 МБ',
        required: 'Милдеттүү',
        profileIncomplete: 'Мелдештерге катышуу үчүн профилиңизди толтуруңуз',
        profileIncompleteFields: 'Толтуруңуз: ',
        fieldName: 'Аты', fieldGender: 'Жынысы', fieldPhone: 'Телефон',
        noTournaments: 'Сиз мелдештерге катышкан жоксуз',
        noTournamentsText: 'Тарыхыңызды бул жерден көрүү үчүн мелдешке катталыңыз',
        noStats: 'Статистика жеткиликтүү эмес',
        noStatsText: 'Статистиканы көрүү үчүн аккаунтуңузду оюнчу профили менен байланыштырыңыз',
        playerNotLinked: 'Оюнчу профили байланган эмес',
        playerNotLinkedText: 'Аккаунтуңузду оюнчу профили менен байланыштыруу үчүн администраторго кайрылыңыз',
        changePassword: 'Сыр сөздү өзгөртүү',
        currentPassword: 'Учурдагы сыр сөз',
        newPassword: 'Жаңы сыр сөз',
        confirmPassword: 'Сыр сөздү тастыктаңыз',
        updatePassword: 'Сыр сөздү жаңылоо',
        updating: 'Жаңылануулда...',
        passwordUpdated: 'Сыр сөз ийгиликтүү жаңыланды',
        errWrongPw: 'Учурдагы сыр сөз туура эмес',
        language: 'Тил',
        dangerZone: 'Коркунучтуу аймак',
        deleteAccount: 'Аккаунтту жок кылуу',
        deleteConfirm: 'Ишенесизби? Бул аракетти кайтаруу мүмкүн эмес.',
        errPwMatch: 'Сыр сөздөр дал келбейт',
        errPwShort: 'Сыр сөз кеминде 8 белгиден турушу керек',
        pwRuleLength: 'Кеминде 8 белги',
        pwRuleUpper: 'Бир чоң тамга',
        pwRuleDigit: 'Бир сан',
        pwRuleSpecial: 'Бир атайын белги',
        showPassword: 'Сыр сөздү көрсөтүү',
        role_user: 'Колдонуучу', role_player: 'Оюнчу', role_admin: 'Администратор', role_manager: 'Менеджер',
        category: 'Категория', points: 'Упайлар',
        regWithdraw: 'Арызды алуу',
        regWithdrawn: 'Арыз алынды',
        regWithdrawTitle: 'Турнирден арызды аласызбы?',
        regWithdrawText: '{name} турнирине берилген арыз алынат. Каттоо ачык турганда кайра катталса болот.',
        regWithdrawYes: 'Арызды алуу',
        regWithdrawNo: 'Жокко чыгаруу',
        regWithdrawDone: 'Арыз алынды',
        regWithdrawError: 'Арызды алуу мүмкүн болгон жок',
        wins: 'Жеңиштер', losses: 'Жеңилүүлөр', rank: 'Рейтинг өзгөрүшү',
        catsTitle: 'Категориялар боюнча упайлар', catHome: 'негизги', place: 'Орун',
        socialMedia: 'Социалдык тармактар',
        cropTitle: 'Сүрөттү кыркуу',
        cropApply: 'Колдонуу',
        cropCancel: 'Жокко чыгаруу',
        lockedTitle: 'Мүчөлүк алыңыз',
        lockedTitleExpired: 'Мүчөлүктү жаңылаңыз',
        lockedText: 'Мелдештерге жана статистикага кирүү үчүн KSLT мүчөлүгүн тариздеңиз',
        lockedTextExpired: 'Мүчөлүгүңүздүн мөөнөтү бүттү. Мелдештерге жана статистикага кирүү үчүн жаңылаңыз',
        lockedBtn: 'Мүчөлүк алуу',
        lockedBtnExpired: 'Жаңылоо',
        payHistory: 'Төлөм тарыхы',
        payDate: 'Күнү',
        payAmount: 'Суммасы',
        payMethod: 'Ыкмасы',
        payStatus: 'Статусу',
        payNoPayments: 'Төлөмдөр жок',
        payCash: 'Накталай',
        payTransfer: 'Которуу',
        payCard: 'Карта',
        payments: 'Төлөмдөр',
        payPurposeMembership: 'Мүчөлүк',
        payPurposeTournament: 'Мелдеш',
        payPurposeOther: 'Башка',
        payCompleted: 'Аткарылды',
        payPending: 'Күтүүдө',
        payNote: 'Эскертүү',
        invitationsTitle: 'Оюнга чакыруулар',
        invSent: 'Жөнөтүлдү',
        invReceived: 'Алынды',
        invAccepted: 'Кабыл алынды',
        invDeclined: 'Четке кагылды',
        invPending: 'Күтүүдө',
        invNoInvites: 'Чакыруулар жок',
        invNoInvitesText: '«Оюнчу издөө» барагынан оюнга чакыруулар жөнөтүңүз',
        ratingHistory: 'Рейтинг тарыхы',
        rhTotalPoints: 'Жалпы упайлар',
        qrShare: 'QR код',
        qrTitle: 'Профилди бөлүшүү',
        qrDownload: 'PNG жүктөө',
        qrCopy: 'Шилтемени көчүрүү',
        qrCopied: 'Көчүрүлдү!',
        games: 'Менин оюндарым',
        gamesTitle: 'Менин оюндарым',
        subTournaments: 'Мелдештер',
        subMatches: 'Матчтар',
        subChallenges: 'Чакыруулар',
        showAll: 'Баарын көрсөтүү',
        collapseBtn: 'Жыйуу',
        noMatches: 'Матчтар жок',
        noMatchesText: 'Сиздин матчтарыңыз мелдештерден кийин бул жерде көрүнөт',
        matchDate: 'Күн', matchOpponent: 'Атаандаш', matchScore: 'Эсеп', matchResult: 'Жыйынтык', matchTournament: 'Мелдеш', matchRound: 'Раунд',
        challenges: 'Сынактар',
        challengesTitle: 'Матчка чакыруулар',
        chalSent: 'Жөнөтүлдү',
        chalReceived: 'Алынды',
        chalActive: 'Активдүү',
        chalNegotiating: 'Сүйлөшүүдө',
        chalCountered: 'Каршы сунуш',
        chalAccepted: 'Кабыл алынды',
        chalDeclined: 'Четке кагылды',
        chalExpired: 'Мөөнөтү бүттү',
        chalCompleted: 'Аяктады',
        chalNoChallenges: 'Чакыруулар жок',
        chalNoChallengesText: 'Оюнчунун профилинен матчка чакыруу жөнөтүңүз',
        chalDate: 'Күнү',
        chalTime: 'Убакыт',
        chalVenue: 'Аянтча',
        vouchers: 'Арзандатуулар',
        vouchersTitle: 'Менин арзандатууларым',
        voucherActive: 'Активдүү',
        voucherUsed: 'Колдонулду',
        voucherExpired: 'Мөөнөтү бүттү',
        voucherNoVouchers: 'Арзандатуулар жок',
        voucherNoVouchersText: 'Өнөктөш корт же машыктыруучу бетинен арзандатуу алыңыз',
        voucherSaved: 'Үнөмдөлдү',
        voucherShowQR: 'QR көрсөтүү',
        voucherService: 'Кызмат',
        voucherDiscount: 'Арзандатуу',
        voucherExpires: 'Мөөнөтү',
        voucherVenue: 'Жер',
        voucherCourts: 'Корттор',
        voucherCoaches: 'Машыктыруучулар',
        voucherShowAll: 'Баарын көрсөтүү',
        notifications: 'Билдирмелер',
        notifMembership: 'Мүчөлүк',
        notifTournaments: 'Мелдештер',
        notifMatches: 'Матчтар',
        notifChallenges: 'Сынактар',
        notifTelegram: 'Telegram',
        notifEmail: 'Email',
        notifSaved: 'Билдирме жөндөөлөрү сакталды',
        errPhoneTaken: 'Бул телефон башка аккаунтка катталган',
        // Loyalty
        loyaltyTab: 'Баллдар',
        loyBalance: 'Баланс',
        loyPoints: 'балл',
        loyHistory: 'Тарыхы',
        loyDate: 'Күнү',
        loyAction: 'Аракет',
        loyPointsCol: 'Баллдар',
        loySource: 'Булак',
        loyEarn: 'Алуу',
        loyRedeem: 'Чыгымдоо',
        loyExpire: 'Мөөнөтү бүттү',
        loyAdjust: 'Оңдоо',
        loyNoHistory: 'Баллдар жок',
        loyNoHistoryText: 'Мелдештерге катышуу, корт арендалоо аркылуу балл топтоңуз',
        loyRedeemTitle: 'Баллдарды алмаштыруу',
        loyRedeemBtn: 'Алмаштыруу',
        loyRedeemed: 'Балдар ийгиликтүү алмаштырылды',
        loyNotEnough: 'Балдар жетишсиз',
        loyNextExpiry: 'Кийинки сгорание',
        loyPointsIn: 'балл',
        loyDays: 'күн ичинде',
        // Onboarding
        obStep1Title: 'KSLT\'ге кош келиңиз!',
        obStep1Text: 'Кыргызстандын теннис коомчулугу. Мелдештер, рейтинг, оюнга өнөктөш — баары бир жерде.',
        obStep2Title: 'Клубдун мүчөсү бол',
        obStep2Text: 'Мелдештерге катыш, рейтингге кир, өнөктөштөрдөн арзандатуу ал. «Мүчөлүк» бөлүмүнөн тариздеңиз.',
        obStep3Title: 'Telegram\'ды байла',
        obStep3Text: 'Мелдештер жана матчтар жөнүндө билдирме алыңыз. Ботту байлоо үчүн баскычты басыңыз.',
        obConnectTg: 'Telegram байлоо',
        obNext: 'Кийинки',
        obDone: 'Баштайлы!'
    } : isEn ? {
        profile: 'Profile', tournaments: 'My Tournaments',
        stats: 'Statistics', invitations: 'Invitations', settings: 'Settings',
        profileTitle: 'My Profile', tournamentsTitle: 'My Tournaments',
        statsTitle: 'Statistics', settingsTitle: 'Settings',
        membership: 'Membership',
        memberActive: 'Active',
        memberExpired: 'Expired',
        memberNone: 'No Membership',
        memberExpiresIn: 'Expires in',
        memberDays: 'days',
        memberExpiredText: 'Your membership has expired',
        memberNoneText: 'Get a membership to participate in tournaments',
        memberRenew: 'Renew',
        memberGet: 'Get Membership',
        firstName: 'First Name', lastName: 'Last Name',
        email: 'Email', phone: 'Phone', gender: 'Gender',
        birthday: 'Date of Birth', birthDay: 'Day', birthMonth: 'Month', birthYear: 'Year (optional)',
        months: ['','January','February','March','April','May','June','July','August','September','October','November','December'],
        male: 'Male', female: 'Female', selectGender: '— Select —',
        instagram: 'Instagram', telegram: 'Telegram',
        tgConnected: 'Telegram connected',
        tgConnect: 'Connect Telegram',
        tgConnectHint: 'Get membership expiry reminders via Telegram',
        showSocials: 'Allow other users to see my social media',
        save: 'Save', saving: 'Saving...', saved: 'Saved!',
        changeAvatar: 'Change Photo', removeAvatar: 'Remove',
        avatarHint: 'JPG or PNG, max 2MB',
        required: 'Required',
        profileIncomplete: 'Complete your profile to participate in tournaments',
        profileIncompleteFields: 'Please fill in: ',
        fieldName: 'Name', fieldGender: 'Gender', fieldPhone: 'Phone',
        noTournaments: 'You have not participated in tournaments yet',
        noTournamentsText: 'Register for a tournament to see your history here',
        noStats: 'No statistics available',
        noStatsText: 'Link your account with a player profile to see stats',
        playerNotLinked: 'Player profile not linked',
        playerNotLinkedText: 'Contact admin to link your account with a player profile',
        changePassword: 'Change Password',
        currentPassword: 'Current Password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        updatePassword: 'Update Password',
        updating: 'Updating...',
        passwordUpdated: 'Password updated successfully',
        errWrongPw: 'Current password is incorrect',
        language: 'Language',
        dangerZone: 'Danger Zone',
        deleteAccount: 'Delete Account',
        deleteConfirm: 'Are you sure? This cannot be undone.',
        errPwMatch: 'Passwords do not match',
        errPwShort: 'Password must be at least 8 characters',
        pwRuleLength: 'At least 8 characters',
        pwRuleUpper: 'One uppercase letter',
        pwRuleDigit: 'One digit',
        pwRuleSpecial: 'One special character',
        showPassword: 'Show password',
        role_user: 'User', role_player: 'Player', role_admin: 'Admin', role_manager: 'Manager',
        category: 'Category', points: 'Points',
        regWithdraw: 'Withdraw',
        regWithdrawn: 'Withdrawn',
        regWithdrawTitle: 'Withdraw from the tournament?',
        regWithdrawText: 'Your entry for {name} will be withdrawn. You can enter again while registration is open.',
        regWithdrawYes: 'Withdraw',
        regWithdrawNo: 'Cancel',
        regWithdrawDone: 'Entry withdrawn',
        regWithdrawError: 'Could not withdraw the entry',
        wins: 'Wins', losses: 'Losses', rank: 'Rank Change',
        catsTitle: 'Points by category', catHome: 'home', place: 'Place',
        socialMedia: 'Social Media',
        cropTitle: 'Crop Photo',
        cropApply: 'Apply',
        cropCancel: 'Cancel',
        lockedTitle: 'Get Membership',
        lockedTitleExpired: 'Renew Membership',
        lockedText: 'Subscribe to KSLT membership to access tournaments and statistics',
        lockedTextExpired: 'Your membership has expired. Renew to access tournaments and statistics',
        lockedBtn: 'Get Membership',
        lockedBtnExpired: 'Renew',
        payHistory: 'Payment History',
        payDate: 'Date',
        payAmount: 'Amount',
        payMethod: 'Method',
        payStatus: 'Status',
        payNoPayments: 'No payments yet',
        payCash: 'Cash',
        payTransfer: 'Transfer',
        payCard: 'Card',
        payments: 'Payments',
        payPurposeMembership: 'Membership',
        payPurposeTournament: 'Tournament',
        payPurposeOther: 'Other',
        payCompleted: 'Completed',
        payPending: 'Pending',
        payNote: 'Note',
        invitationsTitle: 'Game Invitations',
        invSent: 'Sent',
        invReceived: 'Received',
        invAccepted: 'Accepted',
        invDeclined: 'Declined',
        invPending: 'Pending',
        invNoInvites: 'No invitations yet',
        invNoInvitesText: 'Send game invitations from the Player Search page',
        ratingHistory: 'Rating History',
        rhTotalPoints: 'Total Points',
        qrShare: 'QR Code',
        qrTitle: 'Share Profile',
        qrDownload: 'Download PNG',
        qrCopy: 'Copy Link',
        qrCopied: 'Copied!',
        games: 'My Games',
        gamesTitle: 'My Games',
        subTournaments: 'Tournaments',
        subMatches: 'Matches',
        subChallenges: 'Challenges',
        showAll: 'Show all',
        collapseBtn: 'Collapse',
        noMatches: 'No matches yet',
        noMatchesText: 'Your matches will appear here after tournaments',
        matchDate: 'Date', matchOpponent: 'Opponent', matchScore: 'Score', matchResult: 'Result', matchTournament: 'Tournament', matchRound: 'Round',
        challenges: 'Challenges',
        challengesTitle: 'Match Challenges',
        chalSent: 'Sent',
        chalReceived: 'Received',
        chalActive: 'Active',
        chalNegotiating: 'Negotiating',
        chalCountered: 'Counter-proposal',
        chalAccepted: 'Accepted',
        chalDeclined: 'Declined',
        chalExpired: 'Expired',
        chalCompleted: 'Completed',
        chalNoChallenges: 'No challenges yet',
        chalNoChallengesText: 'Send a match challenge from a player\'s profile page',
        chalDate: 'Date',
        chalTime: 'Time',
        chalVenue: 'Venue',
        vouchers: 'Discounts',
        vouchersTitle: 'My Discounts',
        voucherActive: 'Active',
        voucherUsed: 'Used',
        voucherExpired: 'Expired',
        voucherNoVouchers: 'No discounts yet',
        voucherNoVouchersText: 'Get a discount from a partner court or coach page',
        voucherSaved: 'Saved',
        voucherShowQR: 'Show QR',
        voucherService: 'Service',
        voucherDiscount: 'Discount',
        voucherExpires: 'Expires',
        voucherVenue: 'Venue',
        voucherCourts: 'Courts',
        voucherCoaches: 'Coaches',
        voucherShowAll: 'Show all',
        notifications: 'Notifications',
        notifMembership: 'Membership',
        notifTournaments: 'Tournaments',
        notifMatches: 'Matches',
        notifChallenges: 'Challenges',
        notifTelegram: 'Telegram',
        notifEmail: 'Email',
        notifSaved: 'Notification settings saved',
        errPhoneTaken: 'This phone number is already linked to another account',
        // Loyalty
        loyaltyTab: 'Points',
        loyBalance: 'Balance',
        loyPoints: 'pts',
        loyHistory: 'History',
        loyDate: 'Date',
        loyAction: 'Action',
        loyPointsCol: 'Points',
        loySource: 'Source',
        loyEarn: 'Earned',
        loyRedeem: 'Redeemed',
        loyExpire: 'Expired',
        loyAdjust: 'Adjusted',
        loyNoHistory: 'No points yet',
        loyNoHistoryText: 'Earn points by participating in tournaments, booking courts, and more',
        loyRedeemTitle: 'Redeem Points',
        loyRedeemBtn: 'Redeem',
        loyRedeemed: 'Points redeemed successfully',
        loyNotEnough: 'Not enough points',
        loyNextExpiry: 'Next expiry',
        loyPointsIn: 'pts in',
        loyDays: 'days',
        // Onboarding
        obStep1Title: 'Welcome to KSLT!',
        obStep1Text: 'Tennis community of Kyrgyzstan. Tournaments, rankings, partners for a game — all in one place.',
        obStep2Title: 'Become a Club Member',
        obStep2Text: 'Participate in tournaments, get ranked, enjoy partner discounts. Sign up in the "Membership" section.',
        obStep3Title: 'Connect Telegram',
        obStep3Text: 'Get notifications about tournaments and matches. Tap the button below to connect the bot.',
        obConnectTg: 'Connect Telegram',
        obNext: 'Next',
        obDone: 'Let\'s go!'
    } : {
        profile: 'Профиль', tournaments: 'Мои турниры',
        stats: 'Статистика', invitations: 'Приглашения', settings: 'Настройки',
        profileTitle: 'Мой профиль', tournamentsTitle: 'Мои турниры',
        statsTitle: 'Статистика', settingsTitle: 'Настройки',
        membership: 'Членство',
        memberActive: 'Активно',
        memberExpired: 'Истекло',
        memberNone: 'Нет членства',
        memberExpiresIn: 'Истекает через',
        memberDays: 'дн.',
        memberExpiredText: 'Ваше членство истекло',
        memberNoneText: 'Оформите членство для участия в турнирах',
        memberRenew: 'Продлить',
        memberGet: 'Оформить',
        firstName: 'Имя', lastName: 'Фамилия',
        email: 'Email', phone: 'Телефон', gender: 'Пол',
        birthday: 'Дата рождения', birthDay: 'День', birthMonth: 'Месяц', birthYear: 'Год (необяз.)',
        months: ['','Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'],
        male: 'Мужской', female: 'Женский', selectGender: '— Выберите —',
        instagram: 'Instagram', telegram: 'Telegram',
        tgConnected: 'Telegram подключён',
        tgConnect: 'Подключить Telegram',
        tgConnectHint: 'Получайте напоминания об истечении членства в Telegram',
        showSocials: 'Разрешить другим пользователям видеть мои соцсети',
        save: 'Сохранить', saving: 'Сохранение...', saved: 'Сохранено!',
        changeAvatar: 'Изменить фото', removeAvatar: 'Удалить',
        avatarHint: 'JPG или PNG, до 2 МБ',
        required: 'Обязательное',
        profileIncomplete: 'Заполните профиль для участия в турнирах',
        profileIncompleteFields: 'Укажите: ',
        fieldName: 'Имя', fieldGender: 'Пол', fieldPhone: 'Телефон',
        noTournaments: 'Вы пока не участвовали в турнирах',
        noTournamentsText: 'Зарегистрируйтесь на турнир, чтобы видеть историю здесь',
        noStats: 'Статистика недоступна',
        noStatsText: 'Свяжите аккаунт с профилем игрока для просмотра статистики',
        playerNotLinked: 'Профиль игрока не привязан',
        playerNotLinkedText: 'Обратитесь к администратору для привязки аккаунта к профилю игрока',
        changePassword: 'Смена пароля',
        currentPassword: 'Текущий пароль',
        newPassword: 'Новый пароль',
        confirmPassword: 'Подтвердите пароль',
        updatePassword: 'Обновить пароль',
        updating: 'Обновление...',
        passwordUpdated: 'Пароль успешно обновлён',
        errWrongPw: 'Неверный текущий пароль',
        language: 'Язык',
        dangerZone: 'Опасная зона',
        deleteAccount: 'Удалить аккаунт',
        deleteConfirm: 'Вы уверены? Это действие нельзя отменить.',
        errPwMatch: 'Пароли не совпадают',
        errPwShort: 'Пароль должен быть не менее 8 символов',
        pwRuleLength: 'Минимум 8 символов',
        pwRuleUpper: 'Одна заглавная буква',
        pwRuleDigit: 'Одна цифра',
        pwRuleSpecial: 'Один спецсимвол',
        showPassword: 'Показать пароль',
        role_user: 'Пользователь', role_player: 'Игрок', role_admin: 'Администратор', role_manager: 'Менеджер',
        category: 'Категория', points: 'Очки',
        regWithdraw: 'Снять заявку',
        regWithdrawn: 'Заявка снята',
        regWithdrawTitle: 'Снять заявку с турнира?',
        regWithdrawText: 'Заявка на {name} будет снята. Записаться снова можно, пока открыта регистрация.',
        regWithdrawYes: 'Снять заявку',
        regWithdrawNo: 'Отмена',
        regWithdrawDone: 'Заявка снята',
        regWithdrawError: 'Не удалось снять заявку',
        wins: 'Победы', losses: 'Поражения', rank: 'Изм. рейтинга',
        catsTitle: 'Очки по категориям', catHome: 'домашняя', place: 'Место',
        socialMedia: 'Соцсети',
        cropTitle: 'Обрезка фото',
        cropApply: 'Применить',
        cropCancel: 'Отмена',
        lockedTitle: 'Оформите членство',
        lockedTitleExpired: 'Продлите членство',
        lockedText: 'Для доступа к турнирам и статистике оформите членство KSLT',
        lockedTextExpired: 'Ваше членство истекло. Продлите для доступа к турнирам и статистике',
        lockedBtn: 'Оформить членство',
        lockedBtnExpired: 'Продлить',
        payHistory: 'История платежей',
        payDate: 'Дата',
        payAmount: 'Сумма',
        payMethod: 'Способ',
        payStatus: 'Статус',
        payNoPayments: 'Платежей пока нет',
        payCash: 'Наличные',
        payTransfer: 'Перевод',
        payCard: 'Карта',
        payments: 'Платежи',
        payPurposeMembership: 'Членство',
        payPurposeTournament: 'Турнир',
        payPurposeOther: 'Другое',
        payCompleted: 'Завершён',
        payPending: 'Ожидание',
        payNote: 'Примечание',
        invitationsTitle: 'Приглашения на игру',
        invSent: 'Отправлено',
        invReceived: 'Получено',
        invAccepted: 'Принято',
        invDeclined: 'Отклонено',
        invPending: 'Ожидает',
        invNoInvites: 'Приглашений пока нет',
        invNoInvitesText: 'Отправляйте приглашения со страницы «Поиск игрока»',
        ratingHistory: 'История рейтинга',
        rhTotalPoints: 'Всего очков',
        qrShare: 'QR код',
        qrTitle: 'Поделиться профилем',
        qrDownload: 'Скачать PNG',
        qrCopy: 'Скопировать ссылку',
        qrCopied: 'Скопировано!',
        games: 'Мои Игры',
        gamesTitle: 'Мои Игры',
        subTournaments: 'Турниры',
        subMatches: 'Матчи',
        subChallenges: 'Вызовы',
        showAll: 'Показать все',
        collapseBtn: 'Свернуть',
        noMatches: 'Матчей пока нет',
        noMatchesText: 'Ваши матчи появятся здесь после участия в турнирах',
        matchDate: 'Дата', matchOpponent: 'Соперник', matchScore: 'Счёт', matchResult: 'Итог', matchTournament: 'Турнир', matchRound: 'Раунд',
        challenges: 'Вызовы',
        challengesTitle: 'Вызовы на матч',
        chalSent: 'Отправлено',
        chalReceived: 'Получено',
        chalActive: 'Активный',
        chalNegotiating: 'Переговоры',
        chalCountered: 'Встречное',
        chalAccepted: 'Принят',
        chalDeclined: 'Отклонён',
        chalExpired: 'Истёк',
        chalCompleted: 'Завершён',
        chalNoChallenges: 'Вызовов пока нет',
        chalNoChallengesText: 'Отправьте вызов на матч со страницы профиля игрока',
        chalDate: 'Дата',
        chalTime: 'Время',
        chalVenue: 'Площадка',
        vouchers: 'Скидки',
        vouchersTitle: 'Мои скидки',
        voucherActive: 'Активный',
        voucherUsed: 'Использован',
        voucherExpired: 'Истёк',
        voucherNoVouchers: 'Скидок пока нет',
        voucherNoVouchersText: 'Получите скидку на странице партнёрского корта или тренера',
        voucherSaved: 'Сэкономлено',
        voucherShowQR: 'Показать QR',
        voucherService: 'Услуга',
        voucherDiscount: 'Скидка',
        voucherExpires: 'Действует до',
        voucherVenue: 'Заведение',
        voucherCourts: 'Корты',
        voucherCoaches: 'Тренеры',
        voucherShowAll: 'Показать все',
        notifications: 'Уведомления',
        notifMembership: 'Членство',
        notifTournaments: 'Турниры',
        notifMatches: 'Матчи',
        notifChallenges: 'Вызовы',
        notifTelegram: 'Telegram',
        notifEmail: 'Email',
        notifSaved: 'Настройки уведомлений сохранены',
        errPhoneTaken: 'Этот номер телефона уже привязан к другому аккаунту',
        // Loyalty
        loyaltyTab: 'Баллы',
        loyBalance: 'Баланс',
        loyPoints: 'б.',
        loyHistory: 'История',
        loyDate: 'Дата',
        loyAction: 'Действие',
        loyPointsCol: 'Баллы',
        loySource: 'Источник',
        loyEarn: 'Начисление',
        loyRedeem: 'Списание',
        loyExpire: 'Сгорание',
        loyAdjust: 'Корректировка',
        loyNoHistory: 'Баллов пока нет',
        loyNoHistoryText: 'Зарабатывайте баллы участвуя в турнирах, бронируя корты и тренировки',
        loyRedeemTitle: 'Обменять баллы',
        loyRedeemBtn: 'Обменять',
        loyRedeemed: 'Баллы успешно обменяны',
        loyNotEnough: 'Недостаточно баллов',
        loyNextExpiry: 'Ближайшее сгорание',
        loyPointsIn: 'б. через',
        loyDays: 'дн.',
        // Onboarding
        obStep1Title: 'Добро пожаловать в KSLT!',
        obStep1Text: 'Теннисное сообщество Кыргызстана. Турниры, рейтинг, партнёры для игры — всё в одном месте.',
        obStep2Title: 'Стань членом клуба',
        obStep2Text: 'Участвуй в турнирах, попади в рейтинг, получай скидки у партнёров. Оформи членство в разделе «Членство».',
        obStep3Title: 'Подключи Telegram',
        obStep3Text: 'Получай уведомления о турнирах и матчах. Нажми кнопку ниже, чтобы подключить бота.',
        obConnectTg: 'Подключить Telegram',
        obNext: 'Далее',
        obDone: 'Начнём!'
    };

    // Use shared Supabase client from supabase-config.js
    var client = window.supabaseClient;

    function dbEsc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    function roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }

    // ---- Script validation (Cyrillic / Latin / Kyrgyz) ----
    var SCRIPT_RU = /^[а-яА-ЯёЁ\s\-'.]+$/;
    var SCRIPT_EN = /^[a-zA-Z\s\-'.]+$/;
    var SCRIPT_KG = /^[а-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;
    var scriptRegex = isKg ? SCRIPT_KG : isEn ? SCRIPT_EN : SCRIPT_RU;
    var scriptHint = isKg ? 'Кыргыз тамгалары гана' : isEn ? 'Latin characters only' : 'Только кириллица';

    function attachScriptCheck(inputId) {
        var el = document.getElementById(inputId);
        if (!el) return;
        var hint = document.createElement('div');
        hint.style.cssText = 'color:#ff4444;font-size:0.75rem;margin-top:2px;display:none;';
        hint.textContent = scriptHint;
        el.parentNode.appendChild(hint);
        el.addEventListener('input', function() {
            var v = el.value.trim();
            var bad = v.length > 0 && !scriptRegex.test(v);
            el.style.borderColor = bad ? '#ff4444' : '';
            hint.style.display = bad ? '' : 'none';
        });
    }

    // ---- Profile completeness check (global) ----
    window.isProfileComplete = function() {
        var p = window.ksltProfile;
        return p && p.full_name && p.full_name.trim() !== '' &&
               p.gender && (p.gender === 'male' || p.gender === 'female') &&
               p.phone && p.phone.trim() !== '';
    };

    // ---- Badge Toast ----
    function showBadgeToast(icon, name) {
        var label = isKg ? 'Жаңы бейдж' : isEn ? 'New badge' : 'Новый бейдж';
        var el = document.createElement('div');
        el.className = 'db-badge-toast';
        el.innerHTML = '<span class="db-badge-toast-icon">' + icon + '</span> ' + label + ': ' + name;
        document.body.appendChild(el);
        requestAnimationFrame(function() { el.classList.add('visible'); });
        setTimeout(function() {
            el.classList.remove('visible');
            setTimeout(function() { if (el.parentNode) el.remove(); }, 400);
        }, 4000);
    }

    async function checkNewBadges(playerId) {
        if (!client || !playerId) return;
        // Throttle: check max once per hour
        var key = 'kslt_last_badge_check';
        var last = parseInt(localStorage.getItem(key) || '0', 10);
        if (Date.now() - last < 3600000) return;
        localStorage.setItem(key, String(Date.now()));

        try {
            var res = await client.rpc('check_and_award_badges', { p_player_id: playerId });
            var newBadges = res.data || [];
            if (newBadges.length === 0) return;

            // Load badge definitions for the new badges
            var defsRes = await client.from('badge_definitions')
                .select('id, icon, name, name_en, name_kg')
                .in('id', newBadges);
            var defs = defsRes.data || [];

            defs.forEach(function(b) {
                var name = isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name);
                showBadgeToast(b.icon, name);
            });
        } catch(e) {
            console.warn('[KSLT] badge check error:', e);
        }
    }

    /**
     * Shows a 3-step onboarding modal for first-time users.
     * Skips for staff and users who completed onboarding (localStorage flag).
     * @param {{ id: string, role: string }} profile
     */
    function showOnboarding(profile) {
        if (localStorage.getItem('kslt_onboarding_done')) return;
        if (profile.role === 'admin' || profile.role === 'manager') return;

        var steps = [
            {
                icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><circle cx="12" cy="12" r="10"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>',
                emoji: '🎾',
                title: L.obStep1Title,
                text: L.obStep1Text,
                extra: ''
            },
            {
                icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>',
                emoji: '⭐',
                title: L.obStep2Title,
                text: L.obStep2Text,
                extra: ''
            },
            {
                icon: '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>',
                emoji: '📱',
                title: L.obStep3Title,
                text: L.obStep3Text,
                extra: '<a href="https://t.me/KSLTennisBot?start=' + profile.id + '" target="_blank" rel="noopener" class="db-onboarding-tg-btn">' +
                    '<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0h-.056zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>' +
                    ' ' + L.obConnectTg + '</a>'
            }
        ];

        var currentStep = 0;

        var overlay = document.createElement('div');
        overlay.className = 'db-onboarding-overlay';

        function renderStep() {
            var s = steps[currentStep];
            var isLast = currentStep === steps.length - 1;
            var dots = '';
            for (var i = 0; i < steps.length; i++) {
                dots += '<span class="db-onboarding-dot' + (i === currentStep ? ' active' : '') + '"></span>';
            }

            overlay.innerHTML =
                '<div class="db-onboarding-modal">' +
                    '<button class="db-onboarding-close" aria-label="Close">&times;</button>' +
                    '<div class="db-onboarding-emoji">' + s.emoji + '</div>' +
                    '<h3 class="db-onboarding-title">' + s.title + '</h3>' +
                    '<p class="db-onboarding-text">' + s.text + '</p>' +
                    s.extra +
                    '<div class="db-onboarding-dots">' + dots + '</div>' +
                    '<button class="db-onboarding-btn">' + (isLast ? L.obDone : L.obNext) + '</button>' +
                '</div>';

            // Animate modal in
            var modal = overlay.querySelector('.db-onboarding-modal');
            requestAnimationFrame(function() { modal.classList.add('visible'); });

            // Button handler
            overlay.querySelector('.db-onboarding-btn').onclick = function() {
                if (isLast) {
                    closeOnboarding();
                } else {
                    currentStep++;
                    modal.classList.remove('visible');
                    setTimeout(function() { renderStep(); }, 200);
                }
            };

            // Close button
            overlay.querySelector('.db-onboarding-close').onclick = closeOnboarding;
        }

        function closeOnboarding() {
            localStorage.setItem('kslt_onboarding_done', '1');
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 300);
        }

        // Overlay click to close
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeOnboarding();
        });

        document.body.appendChild(overlay);
        renderStep();
        requestAnimationFrame(function() { overlay.classList.add('visible'); });
    }

    // ---- Auth Ready Callback ----
    window.onAuthReady = function(user, profile) {
        renderSidebar(profile);
        initQrButton(profile);
        loadSidebarRatings(profile);
        renderMobileTabs();
        renderProfile(user, profile);
        renderMembershipCard().then(function(state) {
            applyMembershipRestrictions(state);
        });
        renderGames(profile);
        renderStats(profile);
        renderInvitations();
        renderVouchers();
        renderLoyalty(user);
        renderPayments();
        renderSettings(user);
        initTabs();

        // Check for new badges (async, non-blocking)
        if (profile.player_id) {
            checkNewBadges(profile.player_id);
        }

        // Onboarding for first-time users
        showOnboarding(profile);
    };

    // ---- Render Membership Card ----
    var pricingUrl = isKg ? 'pricing-kg.html' : isEn ? 'pricing-en.html' : 'pricing.html';

    async function renderMembershipCard() {
        var noMembership = { active: false, membership: null, daysLeft: 0, state: 'none' };
        var container = document.getElementById('db-profile');
        if (!container) return noMembership;

        // Create placeholder
        var card = document.createElement('div');
        card.className = 'db-membership-card db-membership-loading';
        card.id = 'dbMembershipCard';
        card.innerHTML =
            '<div class="db-card-title">' + L.membership + '</div>' +
            '<p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p>';

        // Insert after section title and banner, before first .db-card
        var firstCard = container.querySelector('.db-card');
        if (firstCard) {
            container.insertBefore(card, firstCard);
        } else {
            container.appendChild(card);
        }

        // Check membership via global function (from membership.js)
        if (typeof window.checkMembership !== 'function') {
            renderMembershipState(card, 'none', null, 0);
            return { active: false, membership: null, daysLeft: 0, state: 'none' };
        }

        var result = await window.checkMembership();

        if (result.active) {
            renderMembershipState(card, 'active', result.membership, result.daysLeft);
            renderPaymentHistory(card);
            return { active: true, membership: result.membership, daysLeft: result.daysLeft, state: 'active' };
        } else {
            // Check if there was any expired membership
            var history = typeof window.getMembershipHistory === 'function' ? await window.getMembershipHistory() : [];
            if (history.length > 0) {
                renderMembershipState(card, 'expired', history[0], 0);
                renderPaymentHistory(card);
                return { active: false, membership: history[0], daysLeft: 0, state: 'expired' };
            } else {
                renderMembershipState(card, 'none', null, 0);
                return { active: false, membership: null, daysLeft: 0, state: 'none' };
            }
        }
    }

    function renderMembershipState(card, state, membership, daysLeft) {
        card.classList.remove('db-membership-loading');

        if (state === 'active') {
            var totalDays = 365;
            if (membership && membership.starts_at && membership.expires_at) {
                var s = new Date(membership.starts_at);
                var e = new Date(membership.expires_at);
                totalDays = Math.ceil((e - s) / (1000 * 60 * 60 * 24));
            }
            var progress = totalDays > 0 ? Math.round((daysLeft / totalDays) * 100) : 0;

            card.className = 'db-membership-card db-membership-active';
            card.innerHTML =
                '<div class="db-membership-header">' +
                    '<div class="db-card-title">' + L.membership + '</div>' +
                    '<span class="db-membership-badge db-membership-badge-active">' + L.memberActive + '</span>' +
                '</div>' +
                '<div class="db-membership-progress-wrap">' +
                    '<div class="db-membership-progress">' +
                        '<div class="db-membership-progress-bar" style="width:' + progress + '%"></div>' +
                    '</div>' +
                    '<div class="db-membership-days">' + L.memberExpiresIn + ' <strong>' + daysLeft + '</strong> ' + L.memberDays + '</div>' +
                '</div>';
        } else if (state === 'expired') {
            card.className = 'db-membership-card db-membership-expired';
            card.innerHTML =
                '<div class="db-membership-header">' +
                    '<div class="db-card-title">' + L.membership + '</div>' +
                    '<span class="db-membership-badge db-membership-badge-expired">' + L.memberExpired + '</span>' +
                '</div>' +
                '<p class="db-membership-text">' + L.memberExpiredText + '</p>' +
                '<a href="' + pricingUrl + '" class="db-btn db-btn-primary db-membership-btn">' + L.memberRenew + '</a>';
        } else {
            card.className = 'db-membership-card db-membership-none';
            card.innerHTML =
                '<div class="db-card-title">' + L.membership + '</div>' +
                '<p class="db-membership-text">' + L.memberNoneText + '</p>' +
                '<a href="' + pricingUrl + '" class="db-btn db-btn-primary db-membership-btn">' + L.memberGet + '</a>';
        }
    }

    // ---- Payment History (inside membership card) ----
    async function renderPaymentHistory(card) {
        if (!client) return;

        var userRes = await client.auth.getUser();
        if (!userRes.data || !userRes.data.user) return;

        var result = await client.from('payments')
            .select('*')
            .eq('profile_id', userRes.data.user.id)
            .order('created_at', { ascending: false })
            .limit(5);

        var payments = result.data || [];
        if (payments.length === 0) return;

        var methodLabels = { cash: L.payCash, transfer: L.payTransfer, card: L.payCard };

        var html = '<div class="db-pay-history" style="margin-top:16px;padding-top:12px;border-top:1px solid var(--border-subtle);">' +
            '<div style="font-size:0.8rem;font-weight:600;color:var(--text-secondary);margin-bottom:8px;">' + L.payHistory + '</div>';

        payments.forEach(function(p) {
            var date = p.created_at ? p.created_at.split('T')[0] : '—';
            var statusColor = p.status === 'completed' ? 'var(--accent)' : 'var(--text-dim)';
            html += '<div style="display:grid;grid-template-columns:100px 1fr auto;gap:8px;align-items:center;padding:4px 0;font-size:0.8rem;">' +
                '<span style="color:var(--text-dim);">' + date + '</span>' +
                '<span style="font-weight:600;color:' + statusColor + ';">' + (p.amount || 0) + ' ' + (p.currency || 'KGS') + '</span>' +
                '<span style="color:var(--text-dim);text-align:right;">' + (methodLabels[p.payment_method] || p.payment_method || '—') + '</span>' +
            '</div>';
        });

        html += '</div>';
        card.insertAdjacentHTML('beforeend', html);
    }

    // ---- Membership Restrictions ----
    function applyMembershipRestrictions(state) {
        if (!state || state.active) return;

        var isExpired = state.state === 'expired';
        var title = isExpired ? L.lockedTitleExpired : L.lockedTitle;
        var text = isExpired ? L.lockedTextExpired : L.lockedText;
        var btnLabel = isExpired ? L.lockedBtnExpired : L.lockedBtn;
        var btnUrl = isEn ? 'pricing-en.html' : 'pricing.html';

        var lockSvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>';

        var overlayHtml =
            '<div class="db-locked-overlay">' +
                '<div class="db-locked-icon">' + lockSvg + '</div>' +
                '<h3 class="db-locked-title">' + title + '</h3>' +
                '<p class="db-locked-text">' + text + '</p>' +
                '<a href="' + btnUrl + '" class="db-btn db-btn-primary db-locked-btn">' + btnLabel + '</a>' +
            '</div>';

        // Apply overlay to tournaments and stats sections
        var targets = ['db-games', 'db-stats'];
        targets.forEach(function(id) {
            var section = document.getElementById(id);
            if (!section) return;
            // Keep section title, replace content
            var sectionTitle = section.querySelector('.db-section-title');
            var titleHtml = sectionTitle ? sectionTitle.outerHTML : '';
            section.innerHTML = titleHtml + overlayHtml;
        });

        // Mark tab buttons as locked
        document.querySelectorAll('[data-tab="tournaments"], [data-tab="stats"]').forEach(function(btn) {
            btn.classList.add('db-tab-locked');
        });
    }

    // ---- Render Sidebar ----
    function renderSidebar(profile) {
        var container = document.getElementById('dbSidebar');
        if (!container) return;

        var nameParts = (profile.full_name || '').split(' ');
        var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';

        var avatarHtml = profile.avatar_url
            ? '<img src="' + escHtml(profile.avatar_url) + '" class="db-sidebar-avatar" alt="">'
            : '<div class="db-sidebar-avatar-placeholder">' + initials + '</div>';

        // Role badge for admin/manager only
        var roleHtml = '';
        if (profile.role === 'admin' || profile.role === 'manager') {
            roleHtml = '<div class="db-sidebar-role">' + (L['role_' + profile.role] || profile.role) + '</div>';
        }

        var qrBtnHtml = profile.player_id
            ? '<button class="db-sidebar-qr-btn" id="dbQrBtn" title="' + L.qrShare + '"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><line x1="20" y1="14" x2="20" y2="20"/><line x1="14" y1="20" x2="20" y2="20"/></svg> ' + L.qrShare + '</button>'
            : '';

        container.innerHTML =
            '<div class="db-sidebar-user">' +
                avatarHtml +
                '<div class="db-sidebar-name">' + (profile.full_name || 'User') + '</div>' +
                roleHtml +
                '<div class="db-sidebar-ratings" id="dbSidebarRatings"></div>' +
                qrBtnHtml +
            '</div>' +
            '<ul class="db-sidebar-nav">' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link active" data-tab="games"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>' + L.games + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="stats"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>' + L.stats + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="invitations"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>' + L.invitations + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="vouchers"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>' + L.vouchers + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="loyalty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + L.loyaltyTab + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="payments"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' + L.payments + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="profile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + L.profile + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' + L.settings + '</button></li>' +
            '</ul>';
    }

    // ---- Sidebar Ratings (KSLT rank + NTRP) ----
    async function loadSidebarRatings(profile) {
        var container = document.getElementById('dbSidebarRatings');
        if (!container || !profile.player_id || !client) return;

        var res = await client.from('players').select('points, category_id, ntrp_rating').eq('id', profile.player_id).single();
        if (!res.data) return;

        var player = res.data;
        var html = '';

        // Категории игрока с очками и местом в каждой. Играть можно в своей
        // и на ступень выше, очки в этих категориях считаются раздельно.
        var pcRes = await client.from('player_categories')
            .select('category_id, points')
            .eq('player_id', profile.player_id)
            .order('points', { ascending: false });

        var myCats = pcRes.data || [];
        if (myCats.length > 0) {
            var catsRes = await client.from('categories').select('id, name');
            var catName = {};
            (catsRes.data || []).forEach(function(c) { catName[c.id] = c.name; });

            for (var i = 0; i < myCats.length; i++) {
                var row = myCats[i];
                var rankRes = await client.from('player_categories')
                    .select('player_id', { count: 'exact', head: true })
                    .eq('category_id', row.category_id)
                    .gt('points', row.points || 0);
                html += '<div class="db-sidebar-rating-row">' +
                    '<span class="db-sidebar-rating-label">' + escHtml(catName[row.category_id] || row.category_id) + '</span>' +
                    '<span class="db-sidebar-rating-value">' + (row.points || 0) + ' · #' + ((rankRes.count || 0) + 1) + '</span>' +
                '</div>';
            }
        }

        // NTRP rating
        if (player.ntrp_rating) {
            html += '<div class="db-sidebar-rating-row">' +
                '<span class="db-sidebar-rating-label">NTRP</span>' +
                '<span class="db-sidebar-rating-value">' + player.ntrp_rating.toFixed(1) + '</span>' +
            '</div>';
        }

        if (html) container.innerHTML = html;
    }

    // ---- QR Code Modal ----
    function initQrButton(profile) {
        var btn = document.getElementById('dbQrBtn');
        if (!btn || !profile.player_id) return;

        btn.addEventListener('click', function() {
            showQrModal(profile);
        });
    }

    function showQrModal(profile) {
        // Remove existing modal
        var old = document.getElementById('dbQrModal');
        if (old) old.remove();

        var baseUrl = 'https://kslt.netlify.app';
        var playerUrl = baseUrl + '/pages/player.html?id=' + encodeURIComponent(profile.player_id);

        var overlay = document.createElement('div');
        overlay.id = 'dbQrModal';
        overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);z-index:9999;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;animation:dbModalFadeIn 0.25s ease forwards;';

        overlay.innerHTML =
            '<style>@keyframes dbModalFadeIn{to{opacity:1}}@keyframes dbModalSlideIn{to{transform:translateY(0) scale(1)}}</style>' +
            '<div style="background:rgba(26,26,30,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;text-align:center;max-width:340px;width:90%;position:relative;transform:translateY(20px) scale(0.95);animation:dbModalSlideIn 0.25s ease forwards;">' +
                '<button id="dbQrClose" style="position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.5rem;cursor:pointer;">&times;</button>' +
                '<div style="font-size:1.5rem;font-weight:700;color:#CCFF00;margin-bottom:4px;">KSLT</div>' +
                '<div style="font-size:0.85rem;color:#888;margin-bottom:20px;">' + L.qrTitle + '</div>' +
                '<div id="dbQrCode" style="display:inline-block;padding:12px;background:#fff;border-radius:8px;margin-bottom:16px;"></div>' +
                '<div style="font-weight:600;font-size:1rem;color:#fff;margin-bottom:4px;">' + escHtml(profile.full_name || '') + '</div>' +
                '<div id="dbQrCategory" style="font-size:0.85rem;color:var(--accent);margin-bottom:20px;"></div>' +
                '<div style="display:flex;gap:8px;justify-content:center;">' +
                    '<button class="db-btn db-btn-primary" id="dbQrDownload">' + L.qrDownload + '</button>' +
                    '<button class="db-btn db-btn-outline" id="dbQrCopy">' + L.qrCopy + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Generate QR
        var qrEl = document.getElementById('dbQrCode');
        var qr = new QRCode(qrEl, {
            text: playerUrl,
            width: 200,
            height: 200,
            colorDark: '#000000',
            colorLight: '#ffffff',
            correctLevel: QRCode.CorrectLevel.H
        });

        // Load category
        if (client && profile.player_id) {
            client.from('players').select('category_id').eq('id', profile.player_id).single().then(function(res) {
                if (res.data && res.data.category_id) {
                    client.from('categories').select('name').eq('id', res.data.category_id).single().then(function(catRes) {
                        var catEl = document.getElementById('dbQrCategory');
                        if (catEl && catRes.data) catEl.textContent = catRes.data.name;
                    });
                }
            });
        }

        // Close
        document.getElementById('dbQrClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Copy link
        document.getElementById('dbQrCopy').addEventListener('click', function() {
            navigator.clipboard.writeText(playerUrl).then(function() {
                var btn = document.getElementById('dbQrCopy');
                btn.textContent = L.qrCopied;
                setTimeout(function() { btn.textContent = L.qrCopy; }, 2000);
            });
        });

        // Download branded PNG
        document.getElementById('dbQrDownload').addEventListener('click', function() {
            setTimeout(function() {
                var qrCanvas = qrEl.querySelector('canvas');
                if (!qrCanvas) return;

                var w = 380;
                var h = 480;
                var c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                var ctx = c.getContext('2d');

                // Gradient background
                var grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0f0f0f');
                grad.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                // Accent top stripe
                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, 0, w, 4);

                // Logo
                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 26px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KSLT', w / 2, 42);

                // Subtitle
                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '11px Inter, Arial, sans-serif';
                ctx.fillText('KYRGYZSTAN SOCIAL LAWN TENNIS', w / 2, 60);

                // Divider
                ctx.strokeStyle = 'rgba(204,255,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, 75);
                ctx.lineTo(w - 40, 75);
                ctx.stroke();

                // Player name
                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 18px Inter, Arial, sans-serif';
                ctx.fillText(profile.full_name || '', w / 2, 105);

                // Category
                var catEl = document.getElementById('dbQrCategory');
                if (catEl && catEl.textContent) {
                    ctx.fillStyle = '#CCFF00';
                    ctx.font = '14px Inter, Arial, sans-serif';
                    ctx.fillText(catEl.textContent, w / 2, 128);
                }

                // QR code with rounded white bg
                var qrSize = 200;
                var qrX = (w - qrSize) / 2;
                var qrY = 150;
                var pad = 12;
                ctx.fillStyle = '#ffffff';
                roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 12);
                ctx.fill();
                ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

                // Scan text
                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '11px Inter, Arial, sans-serif';
                var scanLabel = isEn ? 'Scan to view player profile' : (isKg ? 'Оюнчунун профилин көрүү үчүн сканерлеңиз' : 'Отсканируйте для просмотра профиля');
                ctx.fillText(scanLabel, w / 2, qrY + qrSize + pad + 22);

                // Bottom accent stripe
                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, h - 4, w, 4);

                // URL footer
                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '10px Inter, Arial, sans-serif';
                ctx.fillText('kslt.netlify.app', w / 2, h - 14);

                var link = document.createElement('a');
                link.download = 'KSLT-' + (profile.player_id || 'profile') + '.png';
                link.href = c.toDataURL('image/png');
                link.click();
            }, 300);
        });
    }

    // ---- Render Mobile Tabs ----
    function renderMobileTabs() {
        var container = document.getElementById('dbMobileTabs');
        if (!container) return;

        container.innerHTML =
            '<button class="db-mobile-tab active" data-tab="games">' + L.games + '</button>' +
            '<button class="db-mobile-tab" data-tab="stats">' + L.stats + '</button>' +
            '<button class="db-mobile-tab" data-tab="invitations">' + L.invitations + '</button>' +
            '<button class="db-mobile-tab" data-tab="vouchers">' + L.vouchers + '</button>' +
            '<button class="db-mobile-tab" data-tab="loyalty">' + L.loyaltyTab + '</button>' +
            '<button class="db-mobile-tab" data-tab="payments">' + L.payments + '</button>' +
            '<button class="db-mobile-tab" data-tab="profile">' + L.profile + '</button>' +
            '<button class="db-mobile-tab" data-tab="settings">' + L.settings + '</button>';
    }

    // ---- Init Tabs ----
    function initTabs() {
        var hash = window.location.hash.replace('#', '') || 'games';
        switchTab(hash);

        document.addEventListener('click', function(e) {
            var link = e.target.closest('[data-tab]');
            if (!link) return;
            var tab = link.dataset.tab;
            switchTab(tab);
            window.location.hash = tab;
        });

        window.addEventListener('hashchange', function() {
            var hash = window.location.hash.replace('#', '') || 'games';
            switchTab(hash);
        });
    }

    function switchTab(tab) {
        // Backward compat: old tabs redirect to games
        if (tab === 'tournaments' || tab === 'challenges') { tab = 'games'; window.location.hash = 'games'; }
        document.querySelectorAll('.db-sidebar-link').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.db-mobile-tab').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.db-section').forEach(function(el) {
            el.classList.toggle('active', el.id === 'db-' + tab);
        });
    }

    // ---- Profile completeness banner ----
    function getProfileBanner(profile) {
        var missing = [];
        if (!profile.full_name || !profile.full_name.trim()) missing.push(L.fieldName);
        if (!profile.gender || (profile.gender !== 'male' && profile.gender !== 'female')) missing.push(L.fieldGender);
        if (!profile.phone || !profile.phone.trim()) missing.push(L.fieldPhone);

        if (missing.length === 0) return '';

        return '<div class="db-banner-warning">' +
            '<strong>' + L.profileIncomplete + '</strong><br>' +
            L.profileIncompleteFields + missing.join(', ') +
        '</div>';
    }

    // ---- Render Profile ----
    function renderProfile(user, profile) {
        var container = document.getElementById('db-profile');
        if (!container) return;

        var nameParts = (profile.full_name || '').split(' ');
        var firstName = nameParts[0] || '';
        var lastName = nameParts.slice(1).join(' ') || '';
        var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';

        var avatarHtml = profile.avatar_url
            ? '<img src="' + escHtml(profile.avatar_url) + '" class="db-avatar-preview" id="avatarPreview" alt="">'
            : '<div class="db-avatar-preview-placeholder" id="avatarPreview">' + initials + '</div>';

        // Gender select
        var genderSelect =
            '<select class="db-field-input" id="profileGender">' +
                '<option value=""' + (!profile.gender ? ' selected' : '') + '>' + L.selectGender + '</option>' +
                '<option value="male"' + (profile.gender === 'male' ? ' selected' : '') + '>' + L.male + '</option>' +
                '<option value="female"' + (profile.gender === 'female' ? ' selected' : '') + '>' + L.female + '</option>' +
            '</select>';

        // Birthday selects
        var dayOpts = '<option value="">' + L.birthDay + '</option>';
        for (var d = 1; d <= 31; d++) {
            dayOpts += '<option value="' + d + '"' + (profile.birth_day === d ? ' selected' : '') + '>' + d + '</option>';
        }
        var monthOpts = '<option value="">' + L.birthMonth + '</option>';
        for (var m = 1; m <= 12; m++) {
            monthOpts += '<option value="' + m + '"' + (profile.birth_month === m ? ' selected' : '') + '>' + L.months[m] + '</option>';
        }
        var yearVal = profile.birth_year || '';


        container.innerHTML =
            '<h2 class="db-section-title">' + L.profileTitle + '</h2>' +
            getProfileBanner(profile) +
            '<div id="profileMessage"></div>' +

            // Personal info card
            '<div class="db-card">' +
                '<div class="db-card-title">' + L.profileTitle + '</div>' +
                '<div class="db-avatar-upload">' +
                    avatarHtml +
                    '<div class="db-avatar-actions">' +
                        '<button class="db-avatar-btn" id="avatarUploadBtn">' + L.changeAvatar + '</button>' +
                        '<input type="file" id="avatarInput" accept="image/jpeg,image/png" style="display:none">' +
                        '<span class="db-avatar-hint">' + L.avatarHint + '</span>' +
                    '</div>' +
                '</div>' +
                '<div class="db-field-row">' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.firstName + ' <span class="db-required">*</span></label>' +
                        '<input class="db-field-input" type="text" id="profileFirstName" value="' + escHtml(firstName) + '">' +
                    '</div>' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.lastName + ' <span class="db-required">*</span></label>' +
                        '<input class="db-field-input" type="text" id="profileLastName" value="' + escHtml(lastName) + '">' +
                    '</div>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.email + '</label>' +
                    '<input class="db-field-input" type="email" value="' + escHtml(profile.email || '') + '" readonly>' +
                '</div>' +
                '<div class="db-field-row">' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.phone + ' <span class="db-required">*</span></label>' +
                        '<input class="db-field-input" type="tel" id="profilePhone" value="' + escHtml(profile.phone || '') + '" placeholder="+996 ...">' +
                    '</div>' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.gender + ' <span class="db-required">*</span></label>' +
                        genderSelect +
                    '</div>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.birthday + ' <span class="db-required">*</span></label>' +
                    '<div class="db-field-row db-field-row-3">' +
                        '<select class="db-field-input" id="profileBirthDay">' + dayOpts + '</select>' +
                        '<select class="db-field-input" id="profileBirthMonth">' + monthOpts + '</select>' +
                        '<input class="db-field-input" type="number" id="profileBirthYear" value="' + yearVal + '" placeholder="' + L.birthYear + '" min="1940" max="2015">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Social media card
            '<div class="db-card">' +
                '<div class="db-card-title">' + L.socialMedia + '</div>' +
                '<div class="db-field-row">' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.instagram + '</label>' +
                        '<input class="db-field-input" type="text" id="profileInstagram" value="' + escHtml(profile.instagram || '') + '" placeholder="@username">' +
                    '</div>' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.telegram + '</label>' +
                        '<input class="db-field-input" type="text" id="profileTelegram" value="' + escHtml(profile.telegram || '') + '" placeholder="@username">' +
                    '</div>' +
                '</div>' +
                '<label class="db-checkbox">' +
                    '<input type="checkbox" id="profileShowSocials"' + (profile.show_socials ? ' checked' : '') + '>' +
                    '<span class="db-checkbox-text">' + L.showSocials + '</span>' +
                '</label>' +
                '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06);">' +
                    (profile.telegram_chat_id
                        ? '<div style="display:flex;align-items:center;gap:8px;color:#4caf50;font-size:0.85rem;"><span style="font-size:1.1rem;">&#10003;</span> ' + L.tgConnected + '</div>'
                        : '<div style="font-size:0.75rem;color:var(--text-dim);margin-bottom:6px;">' + L.tgConnectHint + '</div>' +
                          '<a href="https://t.me/' + (window.KSLT_TG_BOT || 'KSLTennisBot') + '?start=' + (profile.id || '') + '" target="_blank" rel="noopener" class="db-btn" style="display:inline-flex;align-items:center;gap:6px;padding:6px 14px;font-size:0.8rem;background:rgba(0,136,204,0.15);color:#0088cc;border-radius:8px;text-decoration:none;border:1px solid rgba(0,136,204,0.3);">&#9993; ' + L.tgConnect + '</a>'
                    ) +
                '</div>' +
            '</div>' +

            // Save button
            '<div class="db-btn-row">' +
                '<button class="db-btn db-btn-primary" id="profileSaveBtn">' + L.save + '</button>' +
            '</div>';

        // Event listeners
        var saveBtn = document.getElementById('profileSaveBtn');
        saveBtn.addEventListener('click', saveProfile);
        saveBtn.disabled = true; // disabled by default — no changes yet

        document.getElementById('avatarUploadBtn').addEventListener('click', function() {
            document.getElementById('avatarInput').click();
        });
        document.getElementById('avatarInput').addEventListener('change', uploadAvatar);

        // Track initial values for dirty check
        window._profileSnapshot = getProfileFormValues();

        // Listen for changes on all editable fields
        var formFields = document.querySelectorAll('#db-profile .db-field-input, #db-profile input[type="checkbox"]');
        formFields.forEach(function(field) {
            field.addEventListener('input', checkProfileDirty);
            field.addEventListener('change', checkProfileDirty);
        });

        // Script validation on name fields
        attachScriptCheck('profileFirstName');
        attachScriptCheck('profileLastName');

    }

    // ---- Invitations section ----
    function renderInvitations() {
        var container = document.getElementById('db-invitations');
        if (!container) return;

        container.innerHTML =
            '<h2 class="db-section-title">' + L.invitationsTitle + '</h2>' +
            '<div class="db-card" id="dbGameInvites">' +
                '<p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p>' +
            '</div>';

        if (client) {
            loadGameInvites();
        }
    }

    async function loadGameInvites() {
        var card = document.getElementById('dbGameInvites');
        if (!card || !client) return;

        try {
            var result = await client.rpc('get_my_game_invites');
            var invites = result.data || [];

            if (invites.length === 0) {
                card.innerHTML =
                    '<div class="db-empty" style="padding:var(--space-lg) 0;">' +
                        '<div class="db-empty-icon">&#127934;</div>' +
                        '<div class="db-empty-title">' + L.invNoInvites + '</div>' +
                        '<div class="db-empty-text">' + L.invNoInvitesText + '</div>' +
                    '</div>';
                return;
            }

            var html = '<div class="db-invite-list">';

            for (var i = 0; i < invites.length; i++) {
                var inv = invites[i];
                var initials = (inv.partner_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
                var avatarHtml = inv.partner_avatar
                    ? '<img src="' + escHtml(inv.partner_avatar) + '" class="db-invite-avatar" alt="">'
                    : '<div class="db-invite-avatar-ph">' + initials + '</div>';

                var dirLabel = inv.direction === 'sent' ? L.invSent : L.invReceived;
                var statusLabel = inv.status === 'accepted' ? L.invAccepted : inv.status === 'declined' ? L.invDeclined : L.invPending;
                var statusClass = inv.status === 'accepted' ? 'accepted' : inv.status === 'declined' ? 'declined' : 'pending';

                var dateStr = '';
                try {
                    var d = new Date(inv.created_at);
                    dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
                } catch(e) {}

                html += '<div class="db-invite-item">' +
                    avatarHtml +
                    '<div class="db-invite-info">' +
                        '<div class="db-invite-name">' + escHtml(inv.partner_name || '—') + '</div>' +
                        '<div class="db-invite-meta">' + dirLabel + ' &middot; ' + dateStr + '</div>' +
                    '</div>' +
                    '<div class="db-invite-status db-invite-' + statusClass + '">' + statusLabel + '</div>' +
                '</div>';
            }

            html += '</div>';
            card.innerHTML = html;
        } catch(e) {
            console.error('Game invites error:', e);
            card.innerHTML = '<p style="color:var(--text-muted);">—</p>';
        }
    }

    // ================================================
    // MY GAMES — combined: Tournaments + Matches + Challenges
    // ================================================
    function renderGames(profile) {
        var container = document.getElementById('db-games');
        if (!container) return;

        var html = '<h2 class="db-section-title">' + L.gamesTitle + '</h2>';

        // -- Subsection: Matches (tournament only) --
        html += '<div class="db-subsection">';
        html += '<button class="db-subsection-toggle db-subsection-open" data-target="dbSubMatches">';
        html += '<span>\u2694\uFE0F ' + L.subMatches + '</span><span class="db-toggle-arrow">\u25BC</span></button>';
        html += '<div class="db-subsection-body" id="dbSubMatches">';
        html += '<div id="dbGamesMatches"><p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p></div>';
        html += '</div></div>';

        // -- Subsection: Challenges --
        html += '<div class="db-subsection">';
        html += '<button class="db-subsection-toggle db-subsection-open" data-target="dbSubChallenges">';
        html += '<span>\uD83E\uDD4A ' + L.subChallenges + '</span><span class="db-toggle-arrow">\u25BC</span></button>';
        html += '<div class="db-subsection-body" id="dbSubChallenges">';
        html += '<div id="dbGamesChallenges"><p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p></div>';
        html += '</div></div>';

        // -- Subsection: Tournaments --
        html += '<div class="db-subsection">';
        html += '<button class="db-subsection-toggle db-subsection-open" data-target="dbSubTournaments">';
        html += '<span>\uD83C\uDFC6 ' + L.subTournaments + '</span><span class="db-toggle-arrow">\u25BC</span></button>';
        html += '<div class="db-subsection-body" id="dbSubTournaments">';
        html += '<div id="dbGamesTournaments"><p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p></div>';
        html += '</div></div>';

        // -- Achievements (flat, bottom of page) --
        var achLabel = isKg ? 'Жетишкендиктер' : isEn ? 'Achievements' : 'Достижения';
        html += '<div style="margin-top:var(--space-xl,2rem);">';
        html += '<h3 style="font-size:1.1rem;font-weight:700;margin-bottom:12px;">\uD83C\uDFC5 ' + achLabel + '</h3>';
        html += '<div id="dbGamesAchievements"><p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p></div>';
        html += '</div>';

        container.innerHTML = html;

        // Toggle handlers
        container.querySelectorAll('.db-subsection-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = btn.getAttribute('data-target');
                var body = document.getElementById(targetId);
                if (!body) return;
                var isOpen = btn.classList.contains('db-subsection-open');
                if (isOpen) {
                    body.classList.add('db-subsection-collapsed');
                    btn.classList.remove('db-subsection-open');
                    btn.querySelector('.db-toggle-arrow').textContent = '\u25B6';
                } else {
                    body.classList.remove('db-subsection-collapsed');
                    btn.classList.add('db-subsection-open');
                    btn.querySelector('.db-toggle-arrow').textContent = '\u25BC';
                }
            });
        });

        // Load data
        loadGamesMatches(profile);
        loadGamesChallenges();
        loadGamesTournaments(profile);
        loadGamesAchievements(profile);
    }

    // ---- Games: Tournaments subsection ----
    async function loadGamesTournaments(profile) {
        var container = document.getElementById('dbGamesTournaments');
        if (!container || !profile || !profile.player_id || !client) {
            if (container) container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC6</div><div class="db-empty-title">' + L.noTournaments + '</div></div>';
            return;
        }

        try {
            var pid = profile.player_id;
            var results = await Promise.all([
                client.from('tournament_registrations')
                    .select('status, tournament:tournaments(id, title, title_en, title_kg, date_start, image, status)')
                    .eq('player_id', pid).in('status', ['approved', 'draw'])
                    .order('registered_at', { ascending: false }).limit(10),
                client.from('tournament_results')
                    .select('tournament_id, round_reached, points_earned, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                    .eq('player_id', pid).order('created_at', { ascending: false }).limit(10)
            ]);

            var regs = results[0].data || [];
            var tResults = results[1].data || [];
            var resultsMap = {};
            tResults.forEach(function(tr) { resultsMap[tr.tournament_id] = tr; });

            var items = [];
            var seen = {};
            regs.forEach(function(reg) {
                if (!reg.tournament || seen[reg.tournament.id]) return;
                seen[reg.tournament.id] = true;
                var tr = resultsMap[reg.tournament.id];
                items.push({ tournament: reg.tournament, round_reached: tr ? tr.round_reached : null, points_earned: tr ? tr.points_earned : 0 });
            });
            tResults.forEach(function(tr) {
                if (!tr.tournament || seen[tr.tournament_id]) return;
                seen[tr.tournament_id] = true;
                items.push({ tournament: tr.tournament, round_reached: tr.round_reached, points_earned: tr.points_earned });
            });

            if (items.length === 0) {
                container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC6</div><div class="db-empty-title">' + L.noTournaments + '</div></div>';
                return;
            }

            var html = '<div class="db-tournaments-list">';
            items.forEach(function(item) {
                var t = item.tournament;
                var tName = isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
                var dateStr = t.date_start ? t.date_start.slice(8,10) + '.' + t.date_start.slice(5,7) + '.' + t.date_start.slice(0,4) : '';
                var result = item.round_reached
                    ? (ROUND_LABELS_DB[item.round_reached] || item.round_reached)
                    : (isEn ? 'Registered' : isKg ? 'Катталган' : 'Зарегистрирован');
                var pts = item.points_earned > 0 ? ' \u00B7 +' + item.points_earned + ' pts' : '';
                var isWinner = item.round_reached === 'W';
                var tImg = t.image || '';

                html += '<a class="db-tournament-row" href="tournament' + (isEn ? '-en' : isKg ? '-kg' : '') + '.html?id=' + t.id + '">';
                if (tImg) {
                    html += '<img src="' + escHtml(tImg) + '" alt="" class="db-tournament-photo">';
                } else {
                    html += '<div class="db-tournament-photo db-tournament-photo-empty">\uD83C\uDFBE</div>';
                }
                html += '<div class="db-tournament-info">';
                html += '<span class="db-tournament-name">' + escHtml(tName) + '</span>';
                html += '<span class="db-tournament-date">' + dateStr + '</span>';
                html += '</div>';
                html += '<span class="db-tournament-result' + (isWinner ? ' db-tournament-winner' : '') + '">' + result + pts + '</span>';
                html += '</a>';
            });
            html += '</div>';
            container.innerHTML = html;
        } catch(e) {
            console.warn('[KSLT] games tournaments error:', e);
            container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC6</div><div class="db-empty-title">' + L.noTournaments + '</div></div>';
        }
    }

    // ---- Score utils ----
    function dbFormatDate(dateStr) {
        if (!dateStr) return '\u2014';
        try {
            var d = new Date(dateStr);
            var dd = String(d.getDate()).padStart(2, '0');
            var mm = String(d.getMonth() + 1).padStart(2, '0');
            var yy = String(d.getFullYear()).slice(2);
            return isEn ? mm + '/' + dd + '/' + yy : dd + '.' + mm + '.' + yy;
        } catch(e) { return '\u2014'; }
    }

    function dbFlipScore(score) {
        if (!score) return score;
        return score.replace(/(\d+)\/(\d+)/g, '$2/$1');
    }

    function dbFormatScore(score) {
        if (!score) return '\u2014';
        return score.replace(/(\d+)\/(\d+)/g, '$1:$2');
    }

    function dbParseScoreStats(score) {
        if (!score || score === 'BYE') return null;
        var sets = score.trim().split(/\s+/);
        var p1S = 0, p2S = 0, p1G = 0, p2G = 0;
        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (m) {
                var g1 = parseInt(m[1], 10), g2 = parseInt(m[2], 10);
                p1G += g1; p2G += g2;
                if (g1 > g2) p1S++; else if (g2 > g1) p2S++;
            }
        });
        return { p1Sets: p1S, p2Sets: p2S, p1Games: p1G, p2Games: p2G };
    }

    // ---- H2H labels ----
    var LH = isKg ? {
        setsWon: 'Утулган сеттер', gamesWon: 'Утулган геймдер',
        last5: 'Акыркы 5 матч', fullProfile: 'Толук профилди ачуу',
        noMatches: 'Бетме-бет матчтар жок', loading: 'Жүктөлүүдө...',
        matchesLabel: ' матч'
    } : isEn ? {
        setsWon: 'Sets won', gamesWon: 'Games won',
        last5: 'Last 5 matches', fullProfile: 'Open full profile',
        noMatches: 'No head-to-head matches found', loading: 'Loading...',
        matchesLabel: ' matches'
    } : {
        setsWon: 'Выигранные сеты', gamesWon: 'Выигранные геймы',
        last5: 'Последние 5 матчей', fullProfile: 'Открыть полный профиль',
        noMatches: 'Матчей между игроками не найдено', loading: 'Загрузка...',
        matchesLabel: ' матчей'
    };

    // ---- Games: Matches subsection ----
    var _matchesOpponents = {}; // cache: oppId → { name, photo }

    async function loadGamesMatches(profile) {
        var container = document.getElementById('dbGamesMatches');
        if (!container || !profile || !profile.player_id || !client) {
            if (container) container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\u2694\uFE0F</div><div class="db-empty-title">' + L.noMatches + '</div><div class="db-empty-text">' + L.noMatchesText + '</div></div>';
            return;
        }

        try {
            var pid = profile.player_id;
            var res = await client.from('matches')
                .select('*, tournament:tournaments(id, title, title_en, title_kg, draw_size)')
                .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                .not('winner_id', 'is', null)
                .order('played_at', { ascending: false })
                .limit(50);

            // Filter out duel matches — show only tournament matches
            if (res.data) {
                res.data = res.data.filter(function(m) { return !m.match_type || m.match_type === 'tournament'; });
            }

            if (res.error || !res.data || res.data.length === 0) {
                container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\u2694\uFE0F</div><div class="db-empty-title">' + L.noMatches + '</div><div class="db-empty-text">' + L.noMatchesText + '</div></div>';
                return;
            }

            // Bulk load opponent names + photos
            var oppIds = [];
            res.data.forEach(function(m) {
                var oid = m.player1_id === pid ? m.player2_id : m.player1_id;
                if (oid && oppIds.indexOf(oid) === -1) oppIds.push(oid);
            });

            if (oppIds.length > 0) {
                var oppRes = await client.from('players')
                    .select('id, name, name_en, name_kg, photo')
                    .in('id', oppIds);
                if (oppRes.data) {
                    oppRes.data.forEach(function(p) {
                        _matchesOpponents[p.id] = {
                            name: isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name),
                            photo: p.photo || ''
                        };
                    });
                }
            }

            renderGamesMatchesList(container, res.data, pid, profile, false);
        } catch(e) {
            console.warn('[KSLT] games matches error:', e);
        }
    }

    function getRoundLabel(m) {
        // Use text 'round' field if present
        if (m.round) {
            if (m.round === '3RD') return '3rd';
            if (m.round.indexOf('GS_') === 0) return 'GS';
        }
        // Derive from round_number + draw_size from tournament
        var rn = m.round_number;
        if (!rn) return '';
        var ds = (m.tournament && m.tournament.draw_size) ? m.tournament.draw_size : 16;
        var totalRounds = Math.log2(ds);
        var fromEnd = totalRounds - rn;
        if (fromEnd === 0) return 'F';
        if (fromEnd === 1) return 'SF';
        if (fromEnd === 2) return 'QF';
        if (fromEnd === 3) return 'R16';
        if (fromEnd === 4) return 'R32';
        return 'R' + rn;
    }

    function renderGamesMatchesList(container, matches, pid, profile, showAll) {
        var LIMIT = 25;
        var visible = showAll ? matches : matches.slice(0, LIMIT);
        var hasMore = !showAll && matches.length > LIMIT;

        var html = '<table class="db-matches-table"><thead><tr>';
        html += '<th>' + L.matchDate + '</th>';
        html += '<th>' + L.matchOpponent + '</th>';
        html += '<th style="text-align:center">' + L.matchScore + '</th>';
        html += '<th style="text-align:center">' + L.matchResult + '</th>';
        html += '<th>' + L.matchTournament + '</th>';
        html += '<th style="text-align:center">' + L.matchRound + '</th>';
        html += '<th style="text-align:center">H2H</th>';
        html += '</tr></thead><tbody>';

        visible.forEach(function(m) {
            var isP1 = m.player1_id === pid;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var opp = _matchesOpponents[oppId] || { name: oppId, photo: '' };
            var isWin = m.winner_id === pid;
            var score = m.score || '';
            var displayScore = isP1 ? dbFormatScore(score) : dbFormatScore(dbFlipScore(score));

            var tName = '';
            if (m.tournament) {
                tName = isEn ? (m.tournament.title_en || m.tournament.title) : (isKg ? (m.tournament.title_kg || m.tournament.title) : m.tournament.title);
            }
            var roundLabel = getRoundLabel(m);

            var dateStr = dbFormatDate(m.played_at || m.created_at);
            var resultCls = isWin ? 'win' : 'loss';
            var resultLabel = isWin ? 'W' : 'L';

            var avatarHtml = opp.photo
                ? '<img src="' + escHtml(opp.photo) + '" alt="" class="db-match-avatar">'
                : '<div class="db-match-avatar db-match-avatar-ph">' + escHtml(opp.name.charAt(0)) + '</div>';

            html += '<tr>';
            html += '<td class="db-match-date">' + dateStr + '</td>';
            html += '<td><div class="db-match-opponent">' + avatarHtml + '<span>' + escHtml(opp.name) + '</span></div></td>';
            html += '<td class="db-match-score">' + displayScore + '</td>';
            html += '<td class="db-match-result-cell"><span class="db-match-result ' + resultCls + '">' + resultLabel + '</span></td>';
            html += '<td class="db-match-tournament">' + escHtml(tName) + '</td>';
            html += '<td class="db-match-round">' + roundLabel + '</td>';
            html += '<td><button class="db-match-h2h" data-opp-id="' + escHtml(oppId) + '" data-opp-name="' + escHtml(opp.name) + '" data-opp-photo="' + escHtml(opp.photo) + '" title="Head to Head">H2H</button></td>';
            html += '</tr>';
        });
        html += '</tbody></table>';

        if (hasMore) {
            html += '<button class="db-show-all-btn" id="dbShowAllMatches">' + L.showAll + ' (' + matches.length + ')</button>';
        } else if (showAll && matches.length > LIMIT) {
            html += '<button class="db-show-all-btn" id="dbCollapseMatches">' + L.collapseBtn + '</button>';
        }

        container.innerHTML = html;

        // Show all / Collapse
        var showBtn = document.getElementById('dbShowAllMatches');
        if (showBtn) {
            showBtn.addEventListener('click', function() { renderGamesMatchesList(container, matches, pid, profile, true); });
        }
        var colBtn = document.getElementById('dbCollapseMatches');
        if (colBtn) {
            colBtn.addEventListener('click', function() {
                renderGamesMatchesList(container, matches, pid, profile, false);
                container.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        }

        // H2H buttons
        container.querySelectorAll('.db-match-h2h').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var oppId = btn.getAttribute('data-opp-id');
                var oppName = btn.getAttribute('data-opp-name');
                var oppPhoto = btn.getAttribute('data-opp-photo');
                showDashboardH2H(pid, profile, oppId, oppName, oppPhoto);
            });
        });
    }

    // ---- H2H Modal ----
    function showDashboardH2H(pid, profile, oppId, oppName, oppPhoto) {
        var old = document.querySelector('.h2h-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'h2h-overlay';
        overlay.innerHTML = '<div class="h2h-modal"><button class="h2h-close">&times;</button><div class="h2h-loading">' + LH.loading + '</div></div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        var closeOverlay = function() {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 300);
        };
        overlay.querySelector('.h2h-close').addEventListener('click', closeOverlay);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeOverlay(); });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') { closeOverlay(); document.removeEventListener('keydown', handler); }
        });

        if (!client) { renderDashH2HEmpty(overlay); return; }

        client.from('matches')
            .select('id, player1_id, player2_id, score, winner_id, played_at, tournament:tournaments(title, title_en, title_kg)')
            .or('and(player1_id.eq.' + pid + ',player2_id.eq.' + oppId + '),and(player1_id.eq.' + oppId + ',player2_id.eq.' + pid + ')')
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .then(function(res) {
                var modal = overlay.querySelector('.h2h-modal');
                if (!modal) return;
                if (res.error || !res.data || res.data.length === 0) {
                    renderDashH2HEmpty(overlay);
                    return;
                }
                renderDashH2HContent(modal, res.data, pid, profile, oppId, oppName, oppPhoto);
                modal.querySelector('.h2h-close').addEventListener('click', closeOverlay);
            });
    }

    function renderDashH2HContent(modal, matches, pid, profile, oppId, oppName, oppPhoto) {
        var myWins = 0, oppWins = 0, mySets = 0, oppSets = 0, myGames = 0, oppGames = 0;

        matches.forEach(function(m) {
            var isP1 = m.player1_id === pid;
            if (m.winner_id === pid) myWins++; else oppWins++;
            if (m.score) {
                var stats = dbParseScoreStats(m.score);
                if (stats) {
                    if (isP1) {
                        mySets += stats.p1Sets; oppSets += stats.p2Sets;
                        myGames += stats.p1Games; oppGames += stats.p2Games;
                    } else {
                        mySets += stats.p2Sets; oppSets += stats.p1Sets;
                        myGames += stats.p2Games; oppGames += stats.p1Games;
                    }
                }
            }
        });

        var myName = profile.full_name || 'You';
        var myPhoto = profile.avatar_url || '';
        var playerPage = isEn ? 'player-en.html' : (isKg ? 'player-kg.html' : 'player.html');

        var html = '<button class="h2h-close">&times;</button>';

        // Header
        html += '<div class="h2h-header">';
        html += '<div class="h2h-player">';
        html += myPhoto ? '<img src="' + escHtml(myPhoto) + '" class="h2h-photo" alt="">' : '<div class="h2h-photo h2h-photo-ph">' + escHtml(myName.charAt(0)) + '</div>';
        html += '<div class="h2h-name">' + escHtml(myName) + '</div>';
        html += '</div>';
        html += '<div class="h2h-center">';
        html += '<div class="h2h-score">' + myWins + ' \u2014 ' + oppWins + '</div>';
        html += '<div class="h2h-label">' + matches.length + LH.matchesLabel + '</div>';
        html += '</div>';
        html += '<div class="h2h-player">';
        html += oppPhoto ? '<img src="' + escHtml(oppPhoto) + '" class="h2h-photo" alt="">' : '<div class="h2h-photo h2h-photo-ph">' + escHtml(oppName.charAt(0)) + '</div>';
        html += '<div class="h2h-name">' + escHtml(oppName) + '</div>';
        html += '</div>';
        html += '</div>';

        // Stats
        html += '<div class="h2h-stats">';
        html += '<div class="h2h-stat-row"><span class="h2h-stat-val h2h-val-left">' + mySets + '</span><span class="h2h-stat-label">' + LH.setsWon + '</span><span class="h2h-stat-val h2h-val-right">' + oppSets + '</span></div>';
        html += '<div class="h2h-stat-row"><span class="h2h-stat-val h2h-val-left">' + myGames + '</span><span class="h2h-stat-label">' + LH.gamesWon + '</span><span class="h2h-stat-val h2h-val-right">' + oppGames + '</span></div>';
        html += '</div>';

        // Last 5 matches
        var last5 = matches.slice(0, 5);
        html += '<div class="h2h-matches"><div class="h2h-matches-title">' + LH.last5 + '</div>';
        last5.forEach(function(m) {
            var isP1 = m.player1_id === pid;
            var result = m.winner_id === pid ? 'W' : 'L';
            var displayScore = isP1 ? dbFormatScore(m.score) : dbFormatScore(dbFlipScore(m.score));
            var tName = '';
            if (m.tournament) {
                tName = isEn ? (m.tournament.title_en || m.tournament.title) : (isKg ? (m.tournament.title_kg || m.tournament.title) : m.tournament.title);
            }
            html += '<div class="h2h-match">';
            html += '<span class="h2h-match-date">' + dbFormatDate(m.played_at) + '</span>';
            if (tName) html += '<span class="h2h-match-tournament">' + escHtml(tName) + '</span>';
            html += '<span class="h2h-match-score">' + displayScore + '</span>';
            html += '<span class="h2h-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + result + '</span>';
            html += '</div>';
        });
        html += '</div>';

        // Profile link
        html += '<a href="' + playerPage + '?id=' + escHtml(oppId) + '" class="h2h-profile-btn">' + LH.fullProfile + ' \u2192</a>';

        modal.innerHTML = html;
    }

    function renderDashH2HEmpty(overlay) {
        var modal = overlay.querySelector('.h2h-modal');
        if (!modal) return;
        modal.innerHTML = '<button class="h2h-close">&times;</button><div class="h2h-empty">' + LH.noMatches + '</div>';
        modal.querySelector('.h2h-close').addEventListener('click', function() {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 300);
        });
    }

    // ---- Games: Challenges subsection ----
    async function loadGamesChallenges() {
        var card = document.getElementById('dbGamesChallenges');
        if (!card || !client) return;

        try {
            var result = await client.rpc('get_my_challenges');
            var items = result.data || [];

            if (!items || items.length === 0) {
                card.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\u2694\uFE0F</div><div class="db-empty-title">' + L.chalNoChallenges + '</div><div class="db-empty-text">' + L.chalNoChallengesText + '</div></div>';
                return;
            }

            var html = '<div class="db-invite-list">';
            for (var i = 0; i < items.length; i++) {
                var ch = items[i];
                var isSent = ch.direction === 'sent';
                var partnerName = isSent ? (ch.opponent_name || '\u2014') : (ch.challenger_name || '\u2014');
                var partnerAvatar = isSent ? ch.opponent_avatar : ch.challenger_avatar;
                var initials = (partnerName).split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
                var avatarHtml = partnerAvatar
                    ? '<img src="' + escHtml(partnerAvatar) + '" class="db-invite-avatar" alt="">'
                    : '<div class="db-invite-avatar-ph">' + initials + '</div>';

                var dirLabel = isSent ? L.chalSent : L.chalReceived;
                var statusMap = {
                    active: { label: L.chalActive, cls: 'pending' },
                    negotiating: { label: L.chalNegotiating, cls: 'pending' },
                    countered: { label: L.chalCountered, cls: 'pending' },
                    accepted: { label: L.chalAccepted, cls: 'accepted' },
                    declined: { label: L.chalDeclined, cls: 'declined' },
                    expired: { label: L.chalExpired, cls: 'declined' },
                    completed: { label: L.chalCompleted, cls: 'accepted' }
                };
                var st = statusMap[ch.status] || { label: ch.status, cls: 'pending' };
                var finalDate = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_date ? ch.counter_date : ch.proposed_date;
                var finalTime = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_time ? ch.counter_time : ch.proposed_time;
                var finalVenue = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_venue ? ch.counter_venue : (ch.court_name || ch.proposed_venue || '');

                var dateStr = '';
                try {
                    var d = new Date(finalDate);
                    dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
                } catch(e) {}

                var metaParts = [dirLabel];
                if (dateStr) metaParts.push(dateStr);
                if (finalTime) metaParts.push(finalTime);
                var venueHtml = finalVenue ? '<div class="db-invite-meta" style="font-size:0.75rem;">\uD83D\uDCCD ' + escHtml(finalVenue) + '</div>' : '';
                var scoreHtml = ch.match_score ? '<div class="db-invite-meta" style="font-size:0.8rem;font-weight:700;">' + escHtml(ch.match_score) + '</div>' : '';

                html += '<div class="db-invite-item">' +
                    avatarHtml +
                    '<div class="db-invite-info">' +
                        '<div class="db-invite-name">' + escHtml(partnerName) + '</div>' +
                        '<div class="db-invite-meta">' + metaParts.join(' \u00B7 ') + '</div>' +
                        venueHtml + scoreHtml +
                    '</div>' +
                    '<div class="db-invite-status ' + st.cls + '">' + st.label + '</div>' +
                '</div>';
            }
            html += '</div>';
            card.innerHTML = html;
        } catch(e) {
            console.warn('[KSLT] games challenges error:', e);
        }
    }

    // ---- Games: Achievements subsection ----
    async function loadGamesAchievements(profile) {
        var container = document.getElementById('dbGamesAchievements');
        if (!container || !client) return;

        var noAchLabel = isKg ? 'Жетишкендиктер жок' : isEn ? 'No achievements yet' : 'Нет достижений';

        if (!profile || !profile.player_id) {
            container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC5</div><div class="db-empty-title">' + noAchLabel + '</div></div>';
            return;
        }

        try {
            var results = await Promise.all([
                client.from('badge_definitions').select('*').order('sort_order', { ascending: true }),
                client.from('player_badges')
                    .select('badge_id, earned_at, badge:badge_definitions(icon, name, name_en, name_kg, description, description_en, description_kg)')
                    .eq('player_id', profile.player_id)
                    .order('earned_at', { ascending: true })
            ]);

            var allDefs = results[0].data || [];
            var earned = results[1].data || [];
            var total = allDefs.length;

            if (total === 0) {
                container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC5</div><div class="db-empty-title">' + noAchLabel + '</div></div>';
                return;
            }

            var earnedMap = {};
            earned.forEach(function(pb) { earnedMap[pb.badge_id] = pb; });
            var pct = Math.round(earned.length / total * 100);

            function bName(b) { return isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name); }
            function bDesc(b) { return isEn ? (b.description_en || b.description) : (isKg ? (b.description_kg || b.description) : b.description); }

            var html = '';
            // Progress
            html += '<div class="db-badges-progress">';
            html += '<div class="db-badges-progress-bar"><div class="db-badges-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '<span class="db-badges-progress-text">' + earned.length + '/' + total + '</span>';
            html += '</div>';

            // Earned badges
            if (earned.length > 0) {
                html += '<div class="db-badges-earned">';
                earned.forEach(function(pb) {
                    var b = pb.badge;
                    if (!b) return;
                    html += '<div class="db-badge-item db-badge-earned" title="' + bName(b) + '">';
                    html += '<span class="db-badge-icon">' + b.icon + '</span>';
                    html += '<span class="db-badge-name">' + bName(b) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            // Nearest locked goals
            var lockedDefs = allDefs.filter(function(d) { return !earnedMap[d.id] && d.condition_type !== 'manual'; });
            var nearest = lockedDefs.slice(0, 3);
            if (nearest.length > 0) {
                var nextLabel = isKg ? 'Кийинки максаттар' : isEn ? 'Next goals' : 'Следующие цели';
                html += '<div class="db-badges-next-label">' + nextLabel + '</div>';
                html += '<div class="db-badges-earned">';
                nearest.forEach(function(d) {
                    html += '<div class="db-badge-item db-badge-locked" title="' + bDesc(d) + '">';
                    html += '<span class="db-badge-icon db-badge-icon-locked">' + d.icon + '</span>';
                    html += '<span class="db-badge-name">' + bName(d) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            container.innerHTML = html;
        } catch(e) {
            console.warn('[KSLT] games achievements error:', e);
            container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC5</div><div class="db-empty-title">' + noAchLabel + '</div></div>';
        }
    }

    // ---- Challenges section (legacy, kept for reference) ----
    function renderChallenges() {
        var container = document.getElementById('db-challenges');
        if (!container) return;

        container.innerHTML =
            '<h2 class="db-section-title">' + L.challengesTitle + '</h2>' +
            '<div class="db-card" id="dbChallenges">' +
                '<p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p>' +
            '</div>';

        if (client) {
            loadChallenges();
        }
    }

    async function loadChallenges() {
        var card = document.getElementById('dbChallenges');
        if (!card || !client) return;

        try {
            var result = await client.rpc('get_my_challenges');
            var items = result.data || [];

            if (!items || items.length === 0) {
                card.innerHTML =
                    '<div class="db-empty" style="padding:var(--space-lg) 0;">' +
                        '<div class="db-empty-icon">&#9876;&#65039;</div>' +
                        '<div class="db-empty-title">' + L.chalNoChallenges + '</div>' +
                        '<div class="db-empty-text">' + L.chalNoChallengesText + '</div>' +
                    '</div>';
                return;
            }

            var html = '<div class="db-invite-list">';

            for (var i = 0; i < items.length; i++) {
                var ch = items[i];
                var isSent = ch.direction === 'sent';
                var partnerName = isSent ? (ch.opponent_name || '—') : (ch.challenger_name || '—');
                var partnerAvatar = isSent ? ch.opponent_avatar : ch.challenger_avatar;

                var initials = (partnerName).split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
                var avatarHtml = partnerAvatar
                    ? '<img src="' + escHtml(partnerAvatar) + '" class="db-invite-avatar" alt="">'
                    : '<div class="db-invite-avatar-ph">' + initials + '</div>';

                var dirLabel = isSent ? L.chalSent : L.chalReceived;

                // Status label + class
                var statusMap = {
                    active: { label: L.chalActive, cls: 'pending' },
                    negotiating: { label: L.chalNegotiating, cls: 'pending' },
                    countered: { label: L.chalCountered, cls: 'pending' },
                    accepted: { label: L.chalAccepted, cls: 'accepted' },
                    declined: { label: L.chalDeclined, cls: 'declined' },
                    expired: { label: L.chalExpired, cls: 'declined' },
                    completed: { label: L.chalCompleted, cls: 'accepted' }
                };
                var st = statusMap[ch.status] || { label: ch.status, cls: 'pending' };

                // Date/time/venue
                var finalDate = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_date ? ch.counter_date : ch.proposed_date;
                var finalTime = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_time ? ch.counter_time : ch.proposed_time;
                var finalVenue = (ch.status === 'countered' || ch.status === 'accepted') && ch.counter_venue ? ch.counter_venue : (ch.court_name || ch.proposed_venue || '');

                var dateStr = '';
                try {
                    var d = new Date(finalDate);
                    dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
                } catch(e) {}

                var metaParts = [dirLabel];
                if (dateStr) metaParts.push(dateStr);
                if (finalTime) metaParts.push(finalTime);

                var venueHtml = finalVenue ? '<div class="db-invite-meta" style="font-size:0.75rem;">\uD83D\uDCCD ' + escHtml(finalVenue) + '</div>' : '';

                html += '<div class="db-invite-item">' +
                    avatarHtml +
                    '<div class="db-invite-info">' +
                        '<div class="db-invite-name">' + escHtml(partnerName) + '</div>' +
                        '<div class="db-invite-meta">' + metaParts.join(' &middot; ') + '</div>' +
                        venueHtml +
                    '</div>' +
                    '<div class="db-invite-status db-invite-' + st.cls + '">' + st.label + '</div>' +
                '</div>';
            }

            html += '</div>';
            card.innerHTML = html;
        } catch(e) {
            console.error('Challenges error:', e);
            card.innerHTML = '<p style="color:var(--text-muted);">—</p>';
        }
    }

    // ---- Dirty check ----
    function getProfileFormValues() {
        return {
            firstName: (document.getElementById('profileFirstName') || {}).value || '',
            lastName: (document.getElementById('profileLastName') || {}).value || '',
            phone: (document.getElementById('profilePhone') || {}).value || '',
            gender: (document.getElementById('profileGender') || {}).value || '',
            birthDay: (document.getElementById('profileBirthDay') || {}).value || '',
            birthMonth: (document.getElementById('profileBirthMonth') || {}).value || '',
            birthYear: (document.getElementById('profileBirthYear') || {}).value || '',
            instagram: (document.getElementById('profileInstagram') || {}).value || '',
            telegram: (document.getElementById('profileTelegram') || {}).value || '',
            showSocials: (document.getElementById('profileShowSocials') || {}).checked || false
        };
    }

    function checkProfileDirty() {
        var btn = document.getElementById('profileSaveBtn');
        if (!btn || !window._profileSnapshot) return;

        var current = getProfileFormValues();
        var snap = window._profileSnapshot;
        var dirty = current.firstName !== snap.firstName ||
                    current.lastName !== snap.lastName ||
                    current.phone !== snap.phone ||
                    current.gender !== snap.gender ||
                    current.birthDay !== snap.birthDay ||
                    current.birthMonth !== snap.birthMonth ||
                    current.birthYear !== snap.birthYear ||
                    current.instagram !== snap.instagram ||
                    current.telegram !== snap.telegram ||
                    current.showSocials !== snap.showSocials;

        btn.disabled = !dirty;
        btn.classList.remove('db-btn-saved');
    }

    // ---- Save Profile ----
    async function saveProfile() {
        if (!client) return;

        var btn = document.getElementById('profileSaveBtn');
        var firstName = document.getElementById('profileFirstName').value.trim();
        var lastName = document.getElementById('profileLastName').value.trim();

        // Script validation
        if (firstName && !scriptRegex.test(firstName)) {
            var msg = isKg ? 'Атын кыргыз тамгалары менен жазыңыз' : isEn ? 'First name must use Latin characters' : 'Имя должно быть на кириллице';
            alert(msg);
            return;
        }
        if (lastName && !scriptRegex.test(lastName)) {
            var msg2 = isKg ? 'Фамилиясын кыргыз тамгалары менен жазыңыз' : isEn ? 'Last name must use Latin characters' : 'Фамилия должна быть на кириллице';
            alert(msg2);
            return;
        }
        var phone = document.getElementById('profilePhone').value.trim();
        if (phone && !/^\+996\d{9}$/.test(phone.replace(/[\s\-]/g, ''))) {
            showMessage('profileMessage', isKg ? 'Формат: +996XXXXXXXXX' : isEn ? 'Format: +996XXXXXXXXX' : 'Формат: +996XXXXXXXXX', true);
            return;
        }
        phone = phone.replace(/[\s\-]/g, '');
        var gender = document.getElementById('profileGender').value;
        var birthDay = document.getElementById('profileBirthDay').value;
        var birthMonth = document.getElementById('profileBirthMonth').value;
        var birthYear = document.getElementById('profileBirthYear').value;
        var instagram = document.getElementById('profileInstagram').value.trim();
        var telegram = document.getElementById('profileTelegram').value.trim();

        // Validate Instagram handle
        if (instagram && !/^@?[a-zA-Z0-9._]{1,30}$/.test(instagram)) {
            showMessage('profileMessage', isKg ? 'Instagram: @username (тамгалар, сандар, чекит, _)' : isEn ? 'Instagram: @username (letters, digits, dot, _)' : 'Instagram: @username (буквы, цифры, точка, _)', true);
            return;
        }
        // Validate Telegram handle
        if (telegram && !/^@?[a-zA-Z0-9_]{5,32}$/.test(telegram)) {
            showMessage('profileMessage', isKg ? 'Telegram: @username (5-32 белги, тамгалар, сандар, _)' : isEn ? 'Telegram: @username (5-32 chars, letters, digits, _)' : 'Telegram: @username (5-32 символа, буквы, цифры, _)', true);
            return;
        }

        var showSocials = document.getElementById('profileShowSocials').checked;
        var fullName = firstName + (lastName ? ' ' + lastName : '');

        btn.textContent = L.saving;
        btn.disabled = true;

        // Track changed sensitive fields for security notification
        var oldPhone = (window.ksltProfile && window.ksltProfile.phone) || '';
        var oldEmail = (window.ksltUser && window.ksltUser.email) || '';

        var result = await client.from('profiles').update({
            full_name: fullName,
            phone: phone,
            gender: gender,
            birth_day: birthDay ? parseInt(birthDay) : null,
            birth_month: birthMonth ? parseInt(birthMonth) : null,
            birth_year: birthYear ? parseInt(birthYear) : null,
            instagram: instagram,
            telegram: telegram,
            show_socials: showSocials
        }).eq('id', window.ksltUser.id);

        if (result.error) {
            var errMsg = result.error.message;
            if (result.error.code === '23505' && errMsg.indexOf('phone') !== -1) {
                errMsg = L.errPhoneTaken;
            }
            showMessage('profileMessage', errMsg, true);
            btn.textContent = L.save;
            btn.disabled = false;
        } else {
            // Update local profile
            window.ksltProfile.full_name = fullName;
            window.ksltProfile.phone = phone;
            window.ksltProfile.gender = gender;
            window.ksltProfile.birth_day = birthDay ? parseInt(birthDay) : null;
            window.ksltProfile.birth_month = birthMonth ? parseInt(birthMonth) : null;
            window.ksltProfile.birth_year = birthYear ? parseInt(birthYear) : null;
            window.ksltProfile.instagram = instagram;
            window.ksltProfile.telegram = telegram;
            window.ksltProfile.show_socials = showSocials;
            renderSidebar(window.ksltProfile);

            // Security notify if phone changed
            if (phone !== oldPhone && oldPhone) {
                try {
                    var session = await client.auth.getSession();
                    var token = session.data && session.data.session && session.data.session.access_token;
                    if (token) {
                        fetch(SUPABASE_URL + '/functions/v1/security-notify', {
                            method: 'POST',
                            headers: {
                                'Authorization': 'Bearer ' + token,
                                'Content-Type': 'application/json',
                                'apikey': SUPABASE_ANON_KEY
                            },
                            body: JSON.stringify({ event_type: 'phone_changed', metadata: { old_phone: oldPhone, new_phone: phone } })
                        }).catch(function() {});
                    }
                } catch (e) {}
            }

            // Update banner
            var banner = document.querySelector('.db-banner-warning');
            if (banner && window.isProfileComplete()) {
                banner.remove();
            }

            // Success feedback: green button
            btn.textContent = '✓ ' + L.saved;
            btn.classList.add('db-btn-saved');
            btn.disabled = true;

            // Flash cards green
            var cards = document.querySelectorAll('#db-profile .db-card');
            cards.forEach(function(c) {
                c.classList.add('db-card-flash');
            });

            // Scroll to message
            showMessage('profileMessage', L.saved, false);
            var msgEl = document.getElementById('profileMessage');
            if (msgEl) msgEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

            // Update snapshot — form is now "clean"
            window._profileSnapshot = getProfileFormValues();

            // Reset button after 3s — stays disabled (no changes)
            setTimeout(function() {
                btn.textContent = L.save;
                btn.classList.remove('db-btn-saved');
                btn.disabled = true;
                cards.forEach(function(c) {
                    c.classList.remove('db-card-flash');
                });
            }, 3000);
        }
    }

    // ---- Upload Avatar (with Cropper) ----
    function uploadAvatar(e) {
        if (!e.target.files || !e.target.files[0]) return;

        var file = e.target.files[0];
        if (file.size > 5 * 1024 * 1024) {
            showMessage('profileMessage', 'Max 5MB', true);
            return;
        }

        // Read file and open crop modal
        var reader = new FileReader();
        reader.onload = function(ev) {
            openCropModal(ev.target.result);
        };
        reader.readAsDataURL(file);

        // Reset input so same file can be re-selected
        e.target.value = '';
    }

    function openCropModal(imageSrc) {
        // Create modal
        var overlay = document.createElement('div');
        overlay.className = 'db-crop-overlay';
        overlay.innerHTML =
            '<div class="db-crop-modal">' +
                '<div class="db-crop-header">' +
                    '<span class="db-crop-title">' + L.cropTitle + '</span>' +
                    '<button class="db-crop-close" id="cropClose">&times;</button>' +
                '</div>' +
                '<div class="db-crop-body">' +
                    '<img id="cropImage" src="' + escHtml(imageSrc) + '">' +
                '</div>' +
                '<div class="db-crop-footer">' +
                    '<button class="db-btn db-btn-outline" id="cropCancel">' + L.cropCancel + '</button>' +
                    '<button class="db-btn db-btn-primary" id="cropApply">' + L.cropApply + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Init Cropper
        var cropImage = document.getElementById('cropImage');
        var cropper = new Cropper(cropImage, {
            aspectRatio: 1,
            viewMode: 1,
            dragMode: 'move',
            cropBoxResizable: true,
            cropBoxMovable: true,
            background: false,
            guides: true,
            center: true,
            highlight: false,
            autoCropArea: 0.85
        });

        // Close / Cancel
        function closeModal() {
            cropper.destroy();
            overlay.remove();
        }

        document.getElementById('cropClose').addEventListener('click', closeModal);
        document.getElementById('cropCancel').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(ev) {
            if (ev.target === overlay) closeModal();
        });

        // Apply crop and upload
        document.getElementById('cropApply').addEventListener('click', function() {
            var canvas = cropper.getCroppedCanvas({
                width: 400,
                height: 400,
                imageSmoothingQuality: 'high'
            });

            canvas.toBlob(function(blob) {
                closeModal();
                doAvatarUpload(blob);
            }, 'image/jpeg', 0.9);
        });
    }

    async function doAvatarUpload(blob) {
        if (!client) return;

        var path = window.ksltUser.id + '/avatar.jpg';

        showMessage('profileMessage', L.saving, false);

        var uploadResult = await client.storage.from('avatars').upload(path, blob, {
            upsert: true,
            contentType: 'image/jpeg'
        });

        if (uploadResult.error) {
            showMessage('profileMessage', uploadResult.error.message, true);
            return;
        }

        var urlResult = client.storage.from('avatars').getPublicUrl(path);
        var publicUrl = urlResult.data.publicUrl + '?t=' + Date.now();

        await client.from('profiles').update({ avatar_url: publicUrl }).eq('id', window.ksltUser.id);

        window.ksltProfile.avatar_url = publicUrl;

        var preview = document.getElementById('avatarPreview');
        if (preview) {
            var img = document.createElement('img');
            img.src = publicUrl;
            img.className = 'db-avatar-preview';
            img.id = 'avatarPreview';
            preview.replaceWith(img);
        }

        renderSidebar(window.ksltProfile);
        showMessage('profileMessage', L.saved, false);
    }

    // ---- Render Tournaments ----
    var ROUND_LABELS_DB = isEn ? {
        'W': '🏆 Winner', 'F': 'Final', 'SF': 'Semifinal', 'QF': 'Quarterfinal',
        'R16': 'R16', 'R32': 'R32', '3RD': '3rd place', '4TH': '4th place'
    } : isKg ? {
        'W': '🏆 Жеңүүчү', 'F': 'Финал', 'SF': '1/2 финал', 'QF': '1/4 финал',
        'R16': 'R16', 'R32': 'R32', '3RD': '3-орун', '4TH': '4-орун'
    } : {
        'W': '🏆 Победитель', 'F': 'Финал', 'SF': '1/2 финала', 'QF': '1/4 финала',
        'R16': 'R16', 'R32': 'R32', '3RD': '3-е место', '4TH': '4-е место'
    };

    async function renderTournaments(profile) {
        var container = document.getElementById('db-tournaments');
        if (!container) return;

        var emptyHtml =
            '<h2 class="db-section-title">' + L.tournamentsTitle + '</h2>' +
            '<div class="db-card">' +
                '<div class="db-empty">' +
                    '<div class="db-empty-icon">🏆</div>' +
                    '<div class="db-empty-title">' + L.noTournaments + '</div>' +
                    '<div class="db-empty-text">' + L.noTournamentsText + '</div>' +
                '</div>' +
            '</div>';

        if (!profile || !profile.player_id || !client) {
            container.innerHTML = emptyHtml;
            return;
        }

        var pid = profile.player_id;

        try {
            var results = await Promise.all([
                client.from('tournament_registrations')
                    .select('id, status, draw_position, group_number, tournament:tournaments(id, title, title_en, title_kg, date_start, status)')
                    .eq('player_id', pid)
                    .in('status', ['approved', 'draw', 'withdrawn'])
                    .order('registered_at', { ascending: false })
                    .limit(20),
                client.from('tournament_results')
                    .select('tournament_id, round_reached, points_earned, tournament:tournaments(id, title, title_en, title_kg, date_start)')
                    .eq('player_id', pid)
                    .order('created_at', { ascending: false })
                    .limit(20)
            ]);

            var regs = results[0].data || [];
            var tResults = results[1].data || [];

            // Map results by tournament_id
            var resultsMap = {};
            tResults.forEach(function(tr) { resultsMap[tr.tournament_id] = tr; });

            // Merge
            var items = [];
            var seen = {};
            regs.forEach(function(reg) {
                if (!reg.tournament || seen[reg.tournament.id]) return;
                seen[reg.tournament.id] = true;
                var tr = resultsMap[reg.tournament.id];
                items.push({
                    tournament: reg.tournament,
                    reg: reg,
                    round_reached: tr ? tr.round_reached : null,
                    points_earned: tr ? tr.points_earned : 0
                });
            });
            tResults.forEach(function(tr) {
                if (!tr.tournament || seen[tr.tournament_id]) return;
                seen[tr.tournament_id] = true;
                items.push({
                    tournament: tr.tournament,
                    round_reached: tr.round_reached,
                    points_earned: tr.points_earned
                });
            });

            if (items.length === 0) {
                container.innerHTML = emptyHtml;
                return;
            }

            var html = '<h2 class="db-section-title">' + L.tournamentsTitle + '</h2>';
            html += '<div class="db-tournaments-list">';
            items.forEach(function(item) {
                var t = item.tournament;
                var tName = isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
                var dateStr = t.date_start ? t.date_start.slice(8,10) + '.' + t.date_start.slice(5,7) + '.' + t.date_start.slice(0,4) : '';
                var result = item.round_reached
                    ? (ROUND_LABELS_DB[item.round_reached] || item.round_reached)
                    : (isEn ? 'Registered' : isKg ? 'Катталган' : 'Зарегистрирован');
                var pts = item.points_earned > 0 ? ' · +' + item.points_earned + ' pts' : '';
                var isWinner = item.round_reached === 'W';
                var reg = item.reg;
                var withdrawn = reg && reg.status === 'withdrawn';
                if (withdrawn) result = L.regWithdrawn;

                html += '<div class="db-tournament-item' + (withdrawn ? ' db-tournament-withdrawn' : '') + '">';
                html += '<a class="db-tournament-row" href="tournament.html' + (isEn ? '-en' : isKg ? '-kg' : '') + '?id=' + t.id + '">';
                html += '<div class="db-tournament-info">';
                html += '<span class="db-tournament-name">' + escHtml(tName) + '</span>';
                html += '<span class="db-tournament-date">' + dateStr + '</span>';
                html += '</div>';
                html += '<span class="db-tournament-result' + (isWinner ? ' db-tournament-winner' : '') + '">' + result + pts + '</span>';
                html += '</a>';
                if (canWithdraw(item)) {
                    html += '<button class="db-withdraw-btn" data-reg="' + reg.id + '" data-name="' + escHtml(tName) + '">' + L.regWithdraw + '</button>';
                }
                html += '</div>';
            });
            html += '</div>';
            container.innerHTML = html;
            bindWithdraw(container, profile);

        } catch(e) {
            console.warn('[KSLT] tournaments load error:', e);
            container.innerHTML = emptyHtml;
        }
    }

    // ---- Снятие заявки с турнира ----
    // Снять можно, пока не проведена жеребьёвка: после неё игрок уже в сетке,
    // и его снимает организатор. Правило «за 3 часа» и штраф — отдельная задача.
    function canWithdraw(item) {
        var reg = item.reg;
        if (!reg || reg.status === 'withdrawn') return false;
        if (reg.draw_position != null || reg.group_number != null) return false;
        if (item.round_reached) return false;
        var st = item.tournament && item.tournament.status;
        return st === 'registration' || st === 'upcoming' || st === 'draft';
    }

    function bindWithdraw(container, profile) {
        container.querySelectorAll('.db-withdraw-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showWithdrawModal(btn.dataset.reg, btn.dataset.name, profile);
            });
        });
    }

    function showWithdrawModal(regId, tournamentName, profile) {
        var old = document.getElementById('dbWithdrawModal');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'dbWithdrawModal';
        overlay.className = 'db-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';
        overlay.innerHTML =
            '<div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;max-width:420px;width:90%;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
                '<h3 style="margin:0 0 12px;font-size:1.15rem;color:#fff;">' + L.regWithdrawTitle + '</h3>' +
                '<p style="margin:0 0 24px;color:var(--text-muted);font-size:0.9rem;line-height:1.5;">' +
                    L.regWithdrawText.replace('{name}', '<strong style="color:#fff;">' + escHtml(tournamentName) + '</strong>') +
                '</p>' +
                '<div style="display:flex;gap:10px;justify-content:flex-end;">' +
                    '<button class="db-btn db-btn-outline" id="dbWithdrawCancel">' + L.regWithdrawNo + '</button>' +
                    '<button class="db-btn db-btn-danger" id="dbWithdrawOk">' + L.regWithdrawYes + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        function close() { overlay.remove(); }
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
        document.getElementById('dbWithdrawCancel').addEventListener('click', close);

        document.getElementById('dbWithdrawOk').addEventListener('click', async function() {
            var btn = this;
            btn.disabled = true;
            btn.textContent = L.saving;

            var res = await client.from('tournament_registrations')
                .update({ status: 'withdrawn' })
                .eq('id', regId);

            close();
            if (res.error) {
                showMessage(null, res.error.message || L.regWithdrawError, true);
                return;
            }
            showMessage(null, L.regWithdrawDone, false);
            renderTournaments(profile);
        });
    }

    // ---- Render Stats ----
    async function renderStats(profile) {
        var container = document.getElementById('db-stats');
        if (!container) return;

        if (!profile.player_id) {
            container.innerHTML =
                '<h2 class="db-section-title">' + L.statsTitle + '</h2>' +
                '<div class="db-card">' +
                    '<div class="db-empty">' +
                        '<div class="db-empty-icon">📊</div>' +
                        '<div class="db-empty-title">' + L.noStats + '</div>' +
                        '<div class="db-empty-text">' + L.noStatsText + '</div>' +
                    '</div>' +
                '</div>';
            return;
        }

        if (!client) return;

        var result = await client.from('players').select('*').eq('id', profile.player_id).single();

        if (!result.data) {
            container.innerHTML = '<h2 class="db-section-title">' + L.statsTitle + '</h2><div class="db-card"><div class="db-empty"><div class="db-empty-icon">📊</div><div class="db-empty-title">' + L.noStats + '</div></div></div>';
            return;
        }

        var p = result.data;
        _statsHomeCategory = p.category_id || null;
        var catName = '-';
        if (p.category_id) {
            var catRes = await client.from('categories').select('name').eq('id', p.category_id).single();
            if (catRes.data) catName = catRes.data.name;
        }

        var catsHtml = await renderStatsCategories(p);

        // Count wins/losses from actual matches — только для сводного ряда,
        // у игрока с категориями цифры берутся из player_categories
        var wins = 0, losses = 0;
        if (!catsHtml) {
            var matchesRes = await client.from('matches')
                .select('winner_id')
                .or('player1_id.eq.' + p.id + ',player2_id.eq.' + p.id)
                .not('winner_id', 'is', null)
                .neq('score', 'BYE');
            if (matchesRes.data) {
                matchesRes.data.forEach(function(m) {
                    if (m.winner_id === p.id) wins++;
                    else losses++;
                });
            }
        }

        container.innerHTML =
            '<h2 class="db-section-title">' + L.statsTitle + '</h2>' +
            // Сводный ряд повторяет домашнюю категорию — показываем его только
            // тем, у кого категорий ещё нет. Так же сделано в админке.
            (catsHtml ? '' :
                '<div class="db-stats-grid">' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + (p.points || 0) + '</div><div class="db-stat-label">' + L.points + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + wins + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + losses + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + ((p.rank_change || 0) > 0 ? '+' : '') + (p.rank_change || 0) + '</div><div class="db-stat-label">' + L.rank + '</div></div>' +
                '</div>') +
            (catsHtml ||
                '<div class="db-card">' +
                    '<div class="db-card-title">' + L.category + '</div>' +
                    '<p style="color:var(--accent);font-size:1.1rem;font-weight:600;">' + catName + '</p>' +
                '</div>') +
            '<div id="dbRatingChartWrap" style="display:none;">' +
                '<div class="db-card">' +
                    '<div class="db-card-title">' + L.ratingHistory + '</div>' +
                    '<div style="position:relative;height:340px;">' +
                        '<canvas id="dbRatingChart"></canvas>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="dbNtrpChartWrap" style="display:none;">' +
                '<div class="db-card">' +
                    '<div class="db-card-title">NTRP</div>' +
                    '<div style="position:relative;height:180px;">' +
                        '<canvas id="dbNtrpChart"></canvas>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div id="dbBadgesCard"></div>';

        // Render rating history chart
        renderRatingChart(profile.player_id, 'dbRatingChart', 'dbRatingChartWrap');

        // Render badges card
        renderStatsBadges(profile.player_id);
    }

    // Домашняя категория игрока — её линия на графике толще остальных
    var _statsHomeCategory = null;

    // Название, цвет и порядок категорий — общий загрузчик с графиком,
    // чтобы цвет в блоках очков и в линиях был один и тот же
    async function loadCategoriesMeta() {
        if (window.KSLT_RATING_CHART) return window.KSLT_RATING_CHART.categories(client, isEn, isKg);

        var res = await client.from('categories').select('id, name, name_en, name_kg, sort_order');
        var map = {};
        (res.data || []).forEach(function(c) {
            map[c.id] = {
                name: isKg ? (c.name_kg || c.name) : (isEn ? (c.name_en || c.name) : c.name),
                color: '#8A8A8F',
                sort: c.sort_order || 0
            };
        });
        return map;
    }

    // ---- Points by category (Stats tab) ----
    // Игрок играет в своей категории и на ступень выше, очки, победы и поражения
    // в каждой считаются раздельно. Возвращает '' — тогда показывается старый
    // блок с одной категорией (у игрока ещё нет ни одной записи).
    async function renderStatsCategories(p) {
        if (!client) return '';

        var pcRes = await client.from('player_categories')
            .select('player_id, category_id, points, wins, losses')
            .order('points', { ascending: false });
        var allRows = pcRes.data || [];
        var myRows = allRows.filter(function(r) { return r.player_id === p.id; });
        if (myRows.length === 0) return '';

        var cats = await loadCategoriesMeta();
        var catName = {}, catColor = {};
        Object.keys(cats).forEach(function(id) {
            catName[id] = cats[id].name;
            catColor[id] = cats[id].color;
        });

        // Место считается так же, как в публичном рейтинге: свой пол, домашняя
        // категория — всегда, чужая — только если там есть очки
        var plrRes = await client.from('players').select('id, gender, category_id').eq('gender', p.gender);
        var sameGender = plrRes.data || [];

        var html = '<div class="db-card"><div class="db-card-title">' + L.catsTitle + '</div>';

        myRows.forEach(function(row) {
            var pointsIn = {};
            allRows.forEach(function(r) {
                if (r.category_id === row.category_id) pointsIn[r.player_id] = r.points || 0;
            });
            var place = sameGender.filter(function(o) {
                if (o.category_id !== row.category_id && !(pointsIn[o.id] > 0)) return false;
                return (pointsIn[o.id] || 0) > (row.points || 0);
            }).length + 1;

            var isHome = row.category_id === p.category_id;
            html += '<div class="db-cat-block">' +
                '<div class="db-cat-name">' +
                    '<span class="db-cat-dot" style="background:' + escHtml(catColor[row.category_id] || '#8A8A8F') + '"></span>' +
                    escHtml(catName[row.category_id] || row.category_id) +
                    (isHome ? ' <span class="db-cat-home">' + L.catHome + '</span>' : '') +
                '</div>' +
                '<div class="db-stats-grid db-stats-grid-mini">' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + (row.points || 0) + '</div><div class="db-stat-label">' + L.points + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + (row.wins || 0) + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + (row.losses || 0) + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">#' + place + '</div><div class="db-stat-label">' + L.place + '</div></div>' +
                '</div>' +
            '</div>';
        });

        return html + '</div>';
    }

    // ---- Badges Card in Stats ----
    async function renderStatsBadges(playerId) {
        var container = document.getElementById('dbBadgesCard');
        if (!container || !client) return;

        var badgesLabel = isKg ? 'Жетишкендиктер' : isEn ? 'Achievements' : 'Достижения';

        try {
            // Load all definitions + earned in parallel
            var results = await Promise.all([
                client.from('badge_definitions').select('*').order('sort_order', { ascending: true }),
                client.from('player_badges')
                    .select('badge_id, earned_at, badge:badge_definitions(icon, name, name_en, name_kg, description, description_en, description_kg)')
                    .eq('player_id', playerId)
                    .order('earned_at', { ascending: true })
            ]);

            var allDefs = results[0].data || [];
            var earned = results[1].data || [];
            var total = allDefs.length;

            if (total === 0) return;

            var earnedMap = {};
            earned.forEach(function(pb) { earnedMap[pb.badge_id] = pb; });

            var pct = Math.round(earned.length / total * 100);

            function bName(b) { return isEn ? (b.name_en || b.name) : (isKg ? (b.name_kg || b.name) : b.name); }
            function bDesc(b) { return isEn ? (b.description_en || b.description) : (isKg ? (b.description_kg || b.description) : b.description); }

            var html = '<div class="db-card">';
            html += '<div class="db-card-title">' + badgesLabel + '</div>';

            // Progress
            html += '<div class="db-badges-progress">';
            html += '<div class="db-badges-progress-bar"><div class="db-badges-progress-fill" style="width:' + pct + '%"></div></div>';
            html += '<span class="db-badges-progress-text">' + earned.length + '/' + total + '</span>';
            html += '</div>';

            // Earned badges
            if (earned.length > 0) {
                html += '<div class="db-badges-earned">';
                earned.forEach(function(pb) {
                    var b = pb.badge;
                    if (!b) return;
                    html += '<div class="db-badge-item db-badge-earned" title="' + bName(b) + '">';
                    html += '<span class="db-badge-icon">' + b.icon + '</span>';
                    html += '<span class="db-badge-name">' + bName(b) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            // Nearest locked (3 goals)
            var lockedDefs = allDefs.filter(function(d) { return !earnedMap[d.id] && d.condition_type !== 'manual'; });
            var nearest = lockedDefs.slice(0, 3);
            if (nearest.length > 0) {
                var nextLabel = isKg ? 'Кийинки максаттар' : isEn ? 'Next goals' : 'Следующие цели';
                html += '<div class="db-badges-next-label">' + nextLabel + '</div>';
                html += '<div class="db-badges-earned">';
                nearest.forEach(function(d) {
                    html += '<div class="db-badge-item db-badge-locked" title="' + bDesc(d) + '">';
                    html += '<span class="db-badge-icon db-badge-icon-locked">' + d.icon + '</span>';
                    html += '<span class="db-badge-name">' + bName(d) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            // "All achievements" expandable grid
            var allLabel = isKg ? 'Бардык жетишкендиктер' : isEn ? 'All achievements' : 'Все достижения';
            var collapseLabel = isKg ? 'Жашыруу' : isEn ? 'Collapse' : 'Свернуть';
            html += '<button class="db-badges-expand-btn" id="dbBadgesExpandBtn">' + allLabel + ' (' + total + ')</button>';
            html += '<div class="db-badges-all" id="dbBadgesAll" style="display:none;">';

            allDefs.forEach(function(d) {
                var isEarned = !!earnedMap[d.id];
                var cls = isEarned ? 'db-badge-all-item db-badge-all-earned' : 'db-badge-all-item db-badge-all-locked';
                var subtitle = isEarned ? formatBadgeDate(earnedMap[d.id].earned_at) : bDesc(d);
                html += '<div class="' + cls + '">';
                html += '<div class="db-badge-all-icon' + (isEarned ? '' : ' db-badge-icon-locked') + '">' + d.icon + '</div>';
                html += '<div class="db-badge-all-info">';
                html += '<div class="db-badge-all-name">' + bName(d) + '</div>';
                html += '<div class="db-badge-all-desc">' + subtitle + '</div>';
                html += '</div>';
                if (isEarned) html += '<div class="db-badge-all-check">✓</div>';
                html += '</div>';
            });

            html += '</div>'; // .db-badges-all
            html += '</div>'; // .db-card
            container.innerHTML = html;

            // Expand/collapse toggle
            var expandBtn = document.getElementById('dbBadgesExpandBtn');
            var allGrid = document.getElementById('dbBadgesAll');
            var expanded = false;
            expandBtn.addEventListener('click', function() {
                expanded = !expanded;
                allGrid.style.display = expanded ? '' : 'none';
                expandBtn.textContent = expanded ? collapseLabel : (allLabel + ' (' + total + ')');
                expandBtn.classList.toggle('active', expanded);
            });
        } catch(e) {
            console.warn('[KSLT] badges stats load error:', e);
        }
    }

    function formatBadgeDate(dateStr) {
        if (!dateStr) return '';
        var d = new Date(dateStr);
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        return dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + d.getFullYear();
    }

    // ---- Rating History Chart ----
    // Логика общая с публичным профилем игрока — js/rating-chart.js
    function renderRatingChart(playerId, canvasId, wrapId) {
        if (!window.KSLT_RATING_CHART) return;
        window.KSLT_RATING_CHART.render({
            client: client,
            playerId: playerId,
            homeCategory: _statsHomeCategory,
            isEn: isEn,
            isKg: isKg,
            canvasId: canvasId,
            wrapId: wrapId,
            ntrpCanvasId: 'dbNtrpChart',
            ntrpWrapId: 'dbNtrpChartWrap'
        });
    }

    // ---- Render Vouchers ----
    function renderVouchers() {
        var container = document.getElementById('db-vouchers');
        if (!container) return;

        container.innerHTML =
            '<h2 class="db-section-title">' + L.vouchersTitle + '</h2>' +
            '<div class="db-card" id="dbVouchers">' +
                '<p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p>' +
            '</div>';

        if (client) loadVouchers();
    }

    var VOUCHER_PREVIEW = 5;

    function renderVoucherItem(v, hiddenType) {
        var statusClass = v.status === 'active' ? 'db-status-active' : (v.status === 'used' ? 'db-status-approved' : 'db-status-rejected');
        var statusLabel = v.status === 'active' ? L.voucherActive : (v.status === 'used' ? L.voucherUsed : L.voucherExpired);
        var dateStr = new Date(v.created_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });
        var expiresStr = '';
        if (v.expires_at) {
            expiresStr = new Date(v.expires_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }
        var isHidden = !!hiddenType;
        var h = '<div class="db-invite-card" style="padding:14px 16px;' + (isHidden ? 'display:none;' : '') + '"' +
            (isHidden ? ' data-vg-hidden="' + hiddenType + '"' : '') + '>' +
            '<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:12px;">' +
                '<div style="flex:1;">' +
                    '<div style="font-weight:600;color:rgba(255,255,255,0.9);margin-bottom:4px;">' + dbEsc(v.entity_name) + '</div>' +
                    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.5);">' + dbEsc(v.service_name) + ' &middot; -' + v.discount_percent + '%</div>' +
                    '<div style="font-size:0.75rem;color:rgba(255,255,255,0.35);margin-top:4px;">' + dateStr +
                        (expiresStr ? ' &middot; ' + L.voucherExpires + ': ' + expiresStr : '') +
                    '</div>' +
                '</div>' +
                '<div style="display:flex;align-items:center;gap:8px;">' +
                    '<span class="' + statusClass + '" style="font-size:0.75rem;padding:3px 10px;border-radius:6px;">' + statusLabel + '</span>';
        if (v.status === 'active') {
            h += '<button class="db-voucher-qr-btn" data-token="' + v.qr_token + '" data-service="' + dbEsc(v.service_name || '') + '" data-entity="' + dbEsc(v.entity_name || '') + '" data-discount="' + (v.discount_percent || '') + '" data-expires="' + (v.expires_at || '') + '" style="background:var(--accent);color:#000;border:none;padding:4px 10px;border-radius:6px;font-size:0.75rem;font-weight:600;cursor:pointer;">' + L.voucherShowQR + '</button>';
        }
        h += '</div></div></div>';
        return h;
    }

    async function loadVouchers() {
        var card = document.getElementById('dbVouchers');
        if (!card || !client) return;

        try {
            var result = await client.from('discount_vouchers')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            var items = result.data || [];

            if (!items.length) {
                card.innerHTML =
                    '<div class="db-empty" style="padding:var(--space-lg) 0;">' +
                        '<div class="db-empty-icon">&#127915;</div>' +
                        '<div class="db-empty-title">' + L.voucherNoVouchers + '</div>' +
                        '<div class="db-empty-text">' + L.voucherNoVouchersText + '</div>' +
                    '</div>';
                return;
            }

            // Auto-expire active vouchers past expiry
            var now = new Date();
            items.forEach(function(v) {
                if (v.status === 'active' && new Date(v.expires_at) < now) {
                    v.status = 'expired';
                }
            });

            // Count saved
            var totalSaved = 0;
            items.forEach(function(v) {
                if (v.status === 'used') totalSaved++;
            });

            // Group by entity_type
            var groups = {};
            items.forEach(function(v) {
                var t = v.entity_type || 'other';
                if (!groups[t]) groups[t] = [];
                groups[t].push(v);
            });

            var groupLabels = {
                court: L.voucherCourts,
                coach: L.voucherCoaches
            };
            var groupIcons = {
                court: '&#127934;',
                coach: '&#127947;'
            };

            var html = '';
            if (totalSaved > 0) {
                html += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:16px;padding:12px 16px;background:rgba(204,255,0,0.06);border-radius:10px;border:1px solid rgba(204,255,0,0.12);">' +
                    '<span style="font-size:1.2rem;">&#127881;</span>' +
                    '<span style="color:var(--accent);font-weight:600;">' + L.voucherSaved + ': ' + totalSaved + ' ' + (totalSaved === 1 ? (isEn ? 'discount' : (isKg ? 'арзандатуу' : 'скидка')) : (isEn ? 'discounts' : (isKg ? 'арзандатуу' : 'скидок'))) + '</span>' +
                '</div>';
            }

            var groupOrder = ['court', 'coach'];
            // Add any other types not in groupOrder
            Object.keys(groups).forEach(function(t) {
                if (groupOrder.indexOf(t) === -1) groupOrder.push(t);
            });

            groupOrder.forEach(function(type) {
                var arr = groups[type];
                if (!arr || !arr.length) return;

                var label = groupLabels[type] || type;
                var icon = groupIcons[type] || '&#127903;';
                var groupId = 'dbVG_' + type;

                html += '<div style="margin-bottom:20px;">' +
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">' +
                        '<span style="font-size:1.1rem;">' + icon + '</span>' +
                        '<span style="font-weight:700;font-size:0.95rem;color:rgba(255,255,255,0.85);">' + label + '</span>' +
                        '<span style="font-size:0.78rem;color:rgba(255,255,255,0.35);margin-left:4px;">(' + arr.length + ')</span>' +
                    '</div>' +
                    '<div class="db-invite-list" id="' + groupId + '">';

                arr.forEach(function(v, idx) {
                    html += renderVoucherItem(v, idx >= VOUCHER_PREVIEW ? type : null);
                });

                html += '</div>';

                if (arr.length > VOUCHER_PREVIEW) {
                    html += '<button class="db-voucher-show-all" data-vg-type="' + type + '" style="display:block;width:100%;margin-top:8px;padding:8px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:8px;color:var(--accent);font-size:0.82rem;font-weight:600;cursor:pointer;transition:background 0.2s;">' +
                        L.voucherShowAll + ' (' + (arr.length - VOUCHER_PREVIEW) + ')' +
                    '</button>';
                }

                html += '</div>';
            });

            card.innerHTML = html;

            // QR button clicks
            card.querySelectorAll('.db-voucher-qr-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    showDashboardVoucherQR({
                        qr_token: this.dataset.token,
                        service_name: this.dataset.service,
                        entity_name: this.dataset.entity,
                        discount_percent: this.dataset.discount,
                        expires_at: this.dataset.expires
                    });
                });
            });

            // Show all buttons
            card.querySelectorAll('.db-voucher-show-all').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    var type = this.dataset.vgType;
                    document.querySelectorAll('[data-vg-hidden="' + type + '"]').forEach(function(el) {
                        el.style.display = '';
                    });
                    this.remove();
                });
            });
        } catch (e) {
            console.error('Vouchers error:', e);
            card.innerHTML = '<p style="color:var(--text-muted);">—</p>';
        }
    }

    function showDashboardVoucherQR(voucher) {
        var existing = document.getElementById('dbVoucherQRModal');
        if (existing) existing.remove();

        var token = voucher.qr_token;
        var verifyUrl = 'https://kslt.netlify.app/pages/verify.html?token=' + token;
        var expiresStr = '';
        if (voucher.expires_at) {
            expiresStr = new Date(voucher.expires_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
        }

        var modal = document.createElement('div');
        modal.id = 'dbVoucherQRModal';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.6);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;opacity:0;animation:dbModalFadeIn 0.25s ease forwards;';
        modal.innerHTML =
            '<style>@keyframes dbModalFadeIn{to{opacity:1}}@keyframes dbModalSlideIn{to{transform:translateY(0) scale(1)}}</style>' +
            '<div style="background:rgba(26,26,30,0.95);border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:32px;max-width:340px;width:100%;text-align:center;position:relative;transform:translateY(20px) scale(0.95);animation:dbModalSlideIn 0.25s ease forwards;">' +
                '<button id="dbVQRClose" style="position:absolute;top:12px;right:16px;background:none;border:none;color:rgba(255,255,255,0.5);font-size:1.5rem;cursor:pointer;">&times;</button>' +
                (voucher.discount_percent ? '<div style="color:#CCFF00;font-size:1.8rem;font-weight:700;margin-bottom:4px;">-' + voucher.discount_percent + '%</div>' : '') +
                (voucher.service_name ? '<div style="color:#fff;font-weight:600;font-size:0.95rem;margin-bottom:2px;">' + dbEsc(voucher.service_name) + '</div>' : '') +
                (voucher.entity_name ? '<div style="color:rgba(255,255,255,0.5);font-size:0.85rem;margin-bottom:12px;">' + dbEsc(voucher.entity_name) + '</div>' : '') +
                '<div id="dbVQRCode" style="display:flex;justify-content:center;background:#fff;border-radius:12px;padding:16px;width:fit-content;margin:0 auto 16px;"></div>' +
                (expiresStr ? '<div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-bottom:12px;">' + expiresStr + '</div>' : '') +
                '<button id="dbVQRDownload" style="background:var(--accent);color:#000;border:none;padding:10px 24px;border-radius:8px;font-weight:600;font-size:0.85rem;cursor:pointer;">' + (isEn ? 'Download QR' : (isKg ? 'QR жүктөө' : 'Скачать QR')) + '</button>' +
            '</div>';

        document.body.appendChild(modal);

        var qrContainer = document.getElementById('dbVQRCode');
        if (typeof QRCode !== 'undefined') {
            new QRCode(qrContainer, {
                text: verifyUrl,
                width: 200,
                height: 200,
                colorDark: '#000000',
                colorLight: '#ffffff',
                correctLevel: QRCode.CorrectLevel.M
            });
        }

        document.getElementById('dbVQRClose').addEventListener('click', function() { modal.remove(); });
        modal.addEventListener('click', function(e) { if (e.target === modal) modal.remove(); });

        document.getElementById('dbVQRDownload').addEventListener('click', function() {
            setTimeout(function() {
                var qrCanvas = qrContainer.querySelector('canvas');
                if (!qrCanvas) return;

                var w = 380;
                var h = 520;
                var c = document.createElement('canvas');
                c.width = w;
                c.height = h;
                var ctx = c.getContext('2d');

                var grad = ctx.createLinearGradient(0, 0, 0, h);
                grad.addColorStop(0, '#0f0f0f');
                grad.addColorStop(1, '#1a1a2e');
                ctx.fillStyle = grad;
                ctx.fillRect(0, 0, w, h);

                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, 0, w, 4);

                ctx.fillStyle = '#CCFF00';
                ctx.font = 'bold 26px Inter, Arial, sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('KSLT', w / 2, 42);

                ctx.fillStyle = 'rgba(255,255,255,0.4)';
                ctx.font = '11px Inter, Arial, sans-serif';
                ctx.fillText('KYRGYZSTAN SOCIAL LAWN TENNIS', w / 2, 60);

                ctx.strokeStyle = 'rgba(204,255,0,0.2)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(40, 75);
                ctx.lineTo(w - 40, 75);
                ctx.stroke();

                if (voucher.discount_percent) {
                    ctx.fillStyle = '#CCFF00';
                    ctx.font = 'bold 32px Inter, Arial, sans-serif';
                    ctx.fillText('-' + voucher.discount_percent + '%', w / 2, 112);
                }

                ctx.fillStyle = '#ffffff';
                ctx.font = 'bold 15px Inter, Arial, sans-serif';
                ctx.fillText(voucher.service_name || '', w / 2, 138);

                ctx.fillStyle = 'rgba(255,255,255,0.6)';
                ctx.font = '13px Inter, Arial, sans-serif';
                ctx.fillText(voucher.entity_name || '', w / 2, 160);

                var qrSize = 200;
                var qrX = (w - qrSize) / 2;
                var qrY = 180;
                var pad = 12;
                ctx.fillStyle = '#ffffff';
                roundRect(ctx, qrX - pad, qrY - pad, qrSize + pad * 2, qrSize + pad * 2, 12);
                ctx.fill();
                ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

                ctx.fillStyle = 'rgba(255,255,255,0.35)';
                ctx.font = '11px Inter, Arial, sans-serif';
                var scanLabel = isEn ? 'Scan QR to verify discount' : (isKg ? 'Арзандатууну текшерүү үчүн QR сканерлеңиз' : 'Отсканируйте QR для проверки скидки');
                ctx.fillText(scanLabel, w / 2, qrY + qrSize + pad + 22);

                if (expiresStr) {
                    ctx.fillStyle = 'rgba(255,255,255,0.5)';
                    ctx.font = '12px Inter, Arial, sans-serif';
                    ctx.fillText(expiresStr, w / 2, qrY + qrSize + pad + 44);
                }

                ctx.fillStyle = '#CCFF00';
                ctx.fillRect(0, h - 4, w, 4);

                ctx.fillStyle = 'rgba(255,255,255,0.25)';
                ctx.font = '10px Inter, Arial, sans-serif';
                ctx.fillText('kslt.netlify.app', w / 2, h - 14);

                var link = document.createElement('a');
                link.download = 'KSLT-voucher-' + token.substring(0, 8) + '.png';
                link.href = c.toDataURL('image/png');
                link.click();
            }, 300);
        });
    }

    // ---- Notification Preferences ----
    var NOTIF_CATS = ['membership', 'tournaments', 'matches', 'challenges'];
    var NOTIF_CHANNELS = ['tg', 'email'];

    function getNotifyPrefs() {
        var p = window.ksltProfile;
        return (p && p.notify_preferences) ? p.notify_preferences : {};
    }

    function isNotifOn(prefs, channel, cat) {
        if (!prefs || !prefs[channel]) return true;
        return prefs[channel][cat] !== false;
    }

    function buildNotifySection() {
        var prefs = getNotifyPrefs();
        var catLabels = {
            membership: L.notifMembership,
            tournaments: L.notifTournaments,
            matches: L.notifMatches,
            challenges: L.notifChallenges
        };

        var rows = '';
        NOTIF_CATS.forEach(function(cat) {
            var cells = '';
            NOTIF_CHANNELS.forEach(function(ch) {
                var on = isNotifOn(prefs, ch, cat);
                cells +=
                    '<td style="text-align:center;padding:8px 12px;">' +
                        '<label class="db-notif-toggle">' +
                            '<input type="checkbox" data-ch="' + ch + '" data-cat="' + cat + '"' + (on ? ' checked' : '') + '>' +
                            '<span class="db-notif-slider"></span>' +
                        '</label>' +
                    '</td>';
            });
            rows +=
                '<tr>' +
                    '<td style="padding:8px 12px;color:var(--text-secondary);font-size:0.9rem;">' + catLabels[cat] + '</td>' +
                    cells +
                '</tr>';
        });

        return '<div class="db-card db-settings-section">' +
            '<div class="db-card-title">' + L.notifications + '</div>' +
            '<table style="width:100%;border-collapse:collapse;">' +
                '<thead><tr>' +
                    '<th></th>' +
                    '<th style="text-align:center;padding:4px 12px;color:var(--text-muted);font-size:0.8rem;font-weight:500;">' + L.notifTelegram + '</th>' +
                    '<th style="text-align:center;padding:4px 12px;color:var(--text-muted);font-size:0.8rem;font-weight:500;">' + L.notifEmail + '</th>' +
                '</tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>' +
        '</div>';
    }

    async function onNotifToggle(e) {
        var cb = e.target;
        if (!cb.dataset || !cb.dataset.ch) return;
        var ch = cb.dataset.ch;
        var cat = cb.dataset.cat;
        var on = cb.checked;

        var prefs = getNotifyPrefs();
        if (!prefs[ch]) prefs[ch] = {};
        prefs[ch][cat] = on;

        // Optimistic update
        if (window.ksltProfile) window.ksltProfile.notify_preferences = prefs;

        var res = await client.from('profiles').update({ notify_preferences: prefs }).eq('id', window.ksltUser.id);
        if (res.error) {
            // Revert
            cb.checked = !on;
            if (window.ksltProfile) {
                prefs[ch][cat] = !on;
                window.ksltProfile.notify_preferences = prefs;
            }
            showMessage('settingsMessage', res.error.message, true);
        } else {
            showMessage('settingsMessage', L.notifSaved, false);
        }
    }

    // ---- Render Payments ----
    // ---- Render Loyalty Tab ----
    var LOY_PER_PAGE = 20;
    var loyPage = 1;
    var loyAllTx = [];

    var LOY_ACTION_MAP = {
        tournament: isKg ? 'Мелдеш' : isEn ? 'Tournament' : 'Турнир',
        court: isKg ? 'Корт' : isEn ? 'Court' : 'Корт',
        coach: isKg ? 'Машыктыруучу' : isEn ? 'Coach' : 'Тренер',
        membership: isKg ? 'Мүчөлүк' : isEn ? 'Membership' : 'Членство',
        expiry: isKg ? 'Сгорание' : isEn ? 'Expiry' : 'Сгорание',
        admin: isKg ? 'Администратор' : isEn ? 'Admin' : 'Админ'
    };

    async function renderLoyalty(user) {
        var container = document.getElementById('db-loyalty');
        if (!container || !client) return;

        container.innerHTML = '<h2 class="db-section-title">' + L.loyaltyTab + '</h2><div class="db-card" id="dbLoyCard"><p style="color:var(--text-muted);">...</p></div>';

        try {
            // Get balance
            var balRes = await client.rpc('get_loyalty_balance', { p_profile_id: user.id });
            var balance = balRes.data || 0;

            // Get transactions
            var txRes = await client.from('loyalty_transactions')
                .select('*')
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false });

            loyAllTx = txRes.data || [];

            // Next expiry
            var now = new Date();
            var nextExpiry = null;
            loyAllTx.forEach(function(t) {
                if (t.type === 'earn' && t.expires_at) {
                    var exp = new Date(t.expires_at);
                    if (exp > now) {
                        if (!nextExpiry || exp < nextExpiry.date) {
                            nextExpiry = { date: exp, points: t.points };
                        }
                    }
                }
            });

            // Get rewards
            var rwRes = await client.from('loyalty_rewards').select('*').eq('active', true).order('cost');
            var rewards = rwRes.data || [];

            var card = document.getElementById('dbLoyCard');
            if (!card) return;

            // Balance card
            var expiryHtml = '';
            if (nextExpiry) {
                var daysUntil = Math.ceil((nextExpiry.date - now) / 86400000);
                expiryHtml = '<div style="font-size:0.8rem;color:var(--text-muted);margin-top:8px;">' +
                    L.loyNextExpiry + ': ' + nextExpiry.points + ' ' + L.loyPointsIn + ' ' + daysUntil + ' ' + L.loyDays +
                    '</div>';
            }

            var balanceHtml =
                '<div style="text-align:center;padding:28px 16px 20px;background:linear-gradient(135deg, rgba(204,255,0,0.08) 0%, rgba(204,255,0,0.02) 100%);border-radius:12px;border:1px solid rgba(204,255,0,0.15);">' +
                    '<div style="font-size:0.7rem;text-transform:uppercase;letter-spacing:1.5px;color:rgba(255,255,255,0.4);margin-bottom:8px;">' + L.loyBalance + '</div>' +
                    '<div style="font-size:3rem;font-weight:800;color:#CCFF00;line-height:1;">' + balance + '</div>' +
                    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.35);margin-top:4px;">' + L.loyPoints + '</div>' +
                    expiryHtml +
                    (rewards.length > 0 ? '<button style="margin-top:20px;background:#CCFF00;color:#000;border:none;padding:10px 28px;border-radius:8px;font-weight:700;font-size:0.9rem;cursor:pointer;" id="dbLoyRedeemBtn">' + L.loyRedeemTitle + '</button>' : '') +
                '</div>';

            // History table
            var historyHtml = '<h3 style="margin:20px 0 12px;font-size:1rem;">' + L.loyHistory + '</h3>';

            if (loyAllTx.length === 0) {
                historyHtml += '<div class="db-empty" style="padding:24px 0;">' +
                    '<div class="db-empty-icon">⭐</div>' +
                    '<div class="db-empty-title">' + L.loyNoHistory + '</div>' +
                    '<div class="db-empty-text">' + L.loyNoHistoryText + '</div>' +
                    '</div>';
            } else {
                historyHtml += '<div id="dbLoyHistory"></div>';
            }

            card.innerHTML = balanceHtml + historyHtml;

            if (loyAllTx.length > 0) {
                loyPage = 1;
                renderLoyaltyHistory();
            }

            // Redeem button
            var redeemBtn = document.getElementById('dbLoyRedeemBtn');
            if (redeemBtn) {
                redeemBtn.addEventListener('click', function() {
                    showRedeemModal(user.id, balance, rewards);
                });
            }
        } catch (err) {
            console.error('Loyalty load error:', err);
        }
    }

    function renderLoyaltyHistory() {
        var wrap = document.getElementById('dbLoyHistory');
        if (!wrap) return;

        var total = loyAllTx.length;
        var start = (loyPage - 1) * LOY_PER_PAGE;
        var page = loyAllTx.slice(start, start + LOY_PER_PAGE);

        var html = '<div class="db-table-wrap" style="overflow-x:auto;"><table class="db-matches-table" style="width:100%;"><thead><tr>' +
            '<th>' + L.loyDate + '</th>' +
            '<th>' + L.loyAction + '</th>' +
            '<th>' + L.loyPointsCol + '</th>' +
            '</tr></thead><tbody>';

        page.forEach(function(t) {
            var typeLabel = '';
            if (t.type === 'earn') typeLabel = L.loyEarn;
            else if (t.type === 'redeem') typeLabel = L.loyRedeem;
            else if (t.type === 'expire') typeLabel = L.loyExpire;
            else typeLabel = L.loyAdjust;

            var actionLabel = LOY_ACTION_MAP[t.action] || (t.action || '—');
            var dateStr = new Date(t.created_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: 'numeric', month: 'short' });

            var ptsStyle = '';
            var ptsPrefix = '';
            if (t.type === 'earn' || (t.type === 'admin_adjust' && t.points > 0)) {
                ptsStyle = 'color:#4caf50;';
                ptsPrefix = '+';
            } else {
                ptsStyle = 'color:#f44336;';
                ptsPrefix = '-';
            }

            html += '<tr>' +
                '<td style="font-size:0.8rem;color:var(--text-muted);">' + dateStr + '</td>' +
                '<td><span style="font-size:0.75rem;padding:2px 8px;border-radius:4px;background:rgba(255,255,255,0.06);">' + dbEsc(typeLabel) + '</span> ' + dbEsc(actionLabel) + '</td>' +
                '<td style="font-weight:600;' + ptsStyle + '">' + ptsPrefix + Math.abs(t.points) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';

        // Pagination
        var totalPages = Math.ceil(total / LOY_PER_PAGE);
        if (totalPages > 1) {
            html += '<div style="display:flex;justify-content:center;gap:4px;margin-top:12px;">';
            for (var p = 1; p <= totalPages; p++) {
                var activeStyle = p === loyPage ? 'background:var(--accent);color:#000;' : 'background:rgba(255,255,255,0.06);color:var(--text-muted);';
                html += '<button class="db-loy-page" data-loyp="' + p + '" style="border:none;padding:4px 10px;border-radius:4px;cursor:pointer;font-size:0.8rem;' + activeStyle + '">' + p + '</button>';
            }
            html += '</div>';
        }

        wrap.innerHTML = html;

        wrap.querySelectorAll('[data-loyp]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                loyPage = parseInt(this.dataset.loyp);
                renderLoyaltyHistory();
            });
        });
    }

    function showRedeemModal(profileId, balance, rewards) {
        // Build overlay
        var overlay = document.createElement('div');
        overlay.className = 'db-modal-overlay';
        overlay.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.75);z-index:9999;display:flex;align-items:center;justify-content:center;backdrop-filter:blur(4px);';

        var html = '<div style="background:#111111;border:1px solid rgba(255,255,255,0.08);border-radius:16px;padding:28px 24px;max-width:420px;width:90%;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">' +
                '<h3 style="margin:0;font-size:1.15rem;color:#fff;">' + L.loyRedeemTitle + '</h3>' +
                '<button class="db-loy-close" style="background:none;border:none;color:rgba(255,255,255,0.4);font-size:1.2rem;cursor:pointer;padding:4px 8px;line-height:1;">✕</button>' +
            '</div>' +
            '<div style="text-align:center;padding:16px 0 20px;border-bottom:1px solid rgba(255,255,255,0.08);margin-bottom:16px;">' +
                '<div style="font-size:2.2rem;font-weight:700;color:#CCFF00;">' + balance + '</div>' +
                '<div style="font-size:0.8rem;color:rgba(255,255,255,0.45);margin-top:4px;">' + L.loyBalance + '</div>' +
            '</div>';

        rewards.forEach(function(rw) {
            var title = isEn ? (rw.title_en || rw.title) : rw.title;
            var canRedeem = balance >= rw.cost;
            var btnStyle = canRedeem
                ? 'background:#CCFF00;color:#000;cursor:pointer;font-weight:700;'
                : 'background:rgba(255,255,255,0.06);color:rgba(255,255,255,0.3);cursor:not-allowed;';

            html += '<div style="display:flex;justify-content:space-between;align-items:center;padding:14px 16px;background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.06);border-radius:10px;margin-bottom:8px;">' +
                '<div>' +
                    '<div style="font-weight:600;color:#fff;font-size:0.95rem;">' + dbEsc(title) + '</div>' +
                    '<div style="font-size:0.8rem;color:rgba(255,255,255,0.4);margin-top:2px;">' + rw.cost + ' ' + L.loyPoints + '</div>' +
                '</div>' +
                '<button class="db-loy-redeem-item" data-rwid="' + rw.id + '" data-rwcost="' + rw.cost + '" data-rwcode="' + rw.code + '"' +
                    (!canRedeem ? ' disabled' : '') +
                    ' style="border:none;padding:8px 18px;border-radius:8px;font-size:0.8rem;' + btnStyle + '">' + L.loyRedeemBtn + '</button>' +
            '</div>';
        });

        html += '</div>';

        overlay.innerHTML = html;
        document.body.appendChild(overlay);

        // Close
        overlay.querySelector('.db-loy-close').addEventListener('click', function() {
            overlay.remove();
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) overlay.remove();
        });

        // Redeem buttons
        overlay.querySelectorAll('.db-loy-redeem-item').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (this.disabled) return;
                var rwId = this.dataset.rwid;
                var rwCost = parseInt(this.dataset.rwcost);
                var rwCode = this.dataset.rwcode;

                this.disabled = true;
                this.textContent = '...';

                // Check balance again
                var balCheck = await client.rpc('get_loyalty_balance', { p_profile_id: profileId });
                var currentBal = balCheck.data || 0;
                if (currentBal < rwCost) {
                    alert(L.loyNotEnough);
                    this.disabled = false;
                    this.textContent = L.loyRedeemBtn;
                    return;
                }

                // Insert redeem transaction
                var res = await client.from('loyalty_transactions').insert({
                    profile_id: profileId,
                    type: 'redeem',
                    points: rwCost,
                    action: rwCode,
                    note: null
                });

                if (res.error) {
                    alert(res.error.message);
                    this.disabled = false;
                    this.textContent = L.loyRedeemBtn;
                    return;
                }

                overlay.remove();
                // Refresh loyalty tab
                var session = await client.auth.getSession();
                if (session.data.session) {
                    renderLoyalty(session.data.session.user);
                }
            });
        });
    }

    // ---- Payments ----
    var payPage = 1;
    var PAY_PER_PAGE = 10;
    var payAllData = [];

    async function renderPayments() {
        var container = document.getElementById('db-payments');
        if (!container || !client) return;

        var userRes = await client.auth.getUser();
        if (!userRes.data || !userRes.data.user) return;

        var userId = userRes.data.user.id;

        var result = await client.from('payments')
            .select('*')
            .eq('profile_id', userId)
            .order('created_at', { ascending: false });

        payAllData = result.data || [];

        var methodLabels = { cash: L.payCash, transfer: L.payTransfer, card: L.payCard };
        var statusLabels = { completed: L.payCompleted, pending: L.payPending };

        function renderPayTable() {
            var total = payAllData.length;
            var totalPages = Math.ceil(total / PAY_PER_PAGE) || 1;
            if (payPage > totalPages) payPage = totalPages;
            var start = (payPage - 1) * PAY_PER_PAGE;
            var pageData = payAllData.slice(start, start + PAY_PER_PAGE);

            if (total === 0) {
                container.innerHTML =
                    '<h2 class="db-section-title">' + L.payHistory + '</h2>' +
                    '<div class="db-card"><div class="db-empty">' +
                        '<div class="db-empty-icon">💳</div>' +
                        '<div class="db-empty-title">' + L.payNoPayments + '</div>' +
                    '</div></div>';
                return;
            }

            var html = '<h2 class="db-section-title">' + L.payHistory + '</h2>';

            // Stats summary
            var totalAmount = 0;
            var completedCount = 0;
            payAllData.forEach(function(p) {
                if (p.status === 'completed') {
                    totalAmount += (p.amount || 0);
                    completedCount++;
                }
            });

            html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">' +
                '<div class="db-card" style="text-align:center;padding:20px 16px;">' +
                    '<div style="font-size:2rem;font-weight:700;color:var(--accent);">' + total + '</div>' +
                    '<div style="font-size:0.8rem;color:var(--text-dim);margin-top:4px;">' + L.payHistory + '</div>' +
                '</div>' +
                '<div class="db-card" style="text-align:center;padding:20px 16px;">' +
                    '<div style="font-size:2rem;font-weight:700;color:var(--accent);">' + totalAmount.toLocaleString() + '</div>' +
                    '<div style="font-size:0.8rem;color:var(--text-dim);margin-top:4px;">' + L.payAmount + ' (KGS)</div>' +
                '</div>' +
            '</div>';

            // Table
            html += '<div class="db-card" style="overflow-x:auto;">' +
                '<table style="width:100%;border-collapse:collapse;font-size:0.85rem;">' +
                '<thead><tr style="border-bottom:1px solid var(--border-subtle);">' +
                    '<th style="text-align:left;padding:8px;color:var(--text-dim);font-weight:600;">' + L.payDate + '</th>' +
                    '<th style="text-align:right;padding:8px;color:var(--text-dim);font-weight:600;">' + L.payAmount + '</th>' +
                    '<th style="text-align:left;padding:8px;color:var(--text-dim);font-weight:600;">' + L.payMethod + '</th>' +
                    '<th style="text-align:left;padding:8px;color:var(--text-dim);font-weight:600;">' + L.payStatus + '</th>' +
                    '<th style="text-align:left;padding:8px;color:var(--text-dim);font-weight:600;">' + L.payNote + '</th>' +
                '</tr></thead><tbody>';

            pageData.forEach(function(p) {
                var date = p.created_at ? p.created_at.split('T')[0].split('-').reverse().join('.') : '—';
                var amount = (p.amount || 0).toLocaleString() + ' ' + (p.currency || 'KGS');
                var method = methodLabels[p.payment_method] || p.payment_method || '—';
                var statusColor = p.status === 'completed' ? 'var(--accent)' : 'var(--text-dim)';
                var statusText = statusLabels[p.status] || p.status || '—';
                var note = p.note ? escHtml(p.note) : '—';

                html += '<tr style="border-bottom:1px solid var(--border-subtle);">' +
                    '<td style="padding:8px;color:var(--text-secondary);">' + date + '</td>' +
                    '<td style="padding:8px;text-align:right;font-weight:600;">' + amount + '</td>' +
                    '<td style="padding:8px;color:var(--text-secondary);">' + method + '</td>' +
                    '<td style="padding:8px;"><span style="color:' + statusColor + ';font-weight:600;">' + statusText + '</span></td>' +
                    '<td style="padding:8px;color:var(--text-dim);font-size:0.8rem;">' + note + '</td>' +
                '</tr>';
            });

            html += '</tbody></table></div>';

            // Pagination
            if (totalPages > 1) {
                html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
                for (var pg = 1; pg <= totalPages; pg++) {
                    var activeStyle = pg === payPage ? 'background:var(--accent);color:#000;' : 'background:var(--card-bg);color:var(--text-secondary);';
                    html += '<button class="db-pay-page-btn" data-page="' + pg + '" style="' + activeStyle + 'border:1px solid var(--border-subtle);border-radius:6px;padding:4px 10px;cursor:pointer;font-size:0.8rem;">' + pg + '</button>';
                }
                html += '</div>';
            }

            container.innerHTML = html;

            // Pagination clicks
            container.querySelectorAll('.db-pay-page-btn').forEach(function(btn) {
                btn.addEventListener('click', function() {
                    payPage = parseInt(this.dataset.page);
                    renderPayTable();
                });
            });
        }

        renderPayTable();
    }

    // ---- Render Settings ----
    function renderSettings(user) {
        var container = document.getElementById('db-settings');
        if (!container) return;

        var eyeSvgOpen = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        var eyeSvgClosed = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';

        container.innerHTML =
            '<h2 class="db-section-title">' + L.settingsTitle + '</h2>' +
            '<div id="settingsMessage"></div>' +

            '<div class="db-card db-settings-section">' +
                '<div class="db-card-title">' + L.changePassword + '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.currentPassword + '</label>' +
                    '<div class="db-pw-field">' +
                        '<input class="db-field-input" type="password" id="settingsCurrentPw" placeholder="••••••••" autocomplete="current-password">' +
                        '<button type="button" class="db-pw-eye" data-target="settingsCurrentPw">' + eyeSvgOpen + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.newPassword + '</label>' +
                    '<div class="db-pw-field">' +
                        '<input class="db-field-input" type="password" id="settingsNewPw" placeholder="••••••••" autocomplete="new-password">' +
                        '<button type="button" class="db-pw-eye" data-target="settingsNewPw">' + eyeSvgOpen + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="db-pw-rules">' +
                    '<span class="db-pw-rule" data-rule="length">8+ симв.</span>' +
                    '<span class="db-pw-rule" data-rule="upper">A-Z</span>' +
                    '<span class="db-pw-rule" data-rule="digit">0-9</span>' +
                    '<span class="db-pw-rule" data-rule="special">!@#$</span>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.confirmPassword + '</label>' +
                    '<div class="db-pw-field">' +
                        '<input class="db-field-input" type="password" id="settingsConfirmPw" placeholder="••••••••" autocomplete="new-password">' +
                        '<button type="button" class="db-pw-eye" data-target="settingsConfirmPw">' + eyeSvgOpen + '</button>' +
                    '</div>' +
                '</div>' +
                '<button class="db-btn db-btn-primary" id="settingsUpdatePwBtn" disabled>' + L.updatePassword + '</button>' +
            '</div>' +

            '<div class="db-card db-settings-section">' +
                '<div class="db-card-title">' + L.language + '</div>' +
                '<div class="db-btn-row">' +
                    '<a href="dashboard.html#settings" class="db-btn ' + (!isEn && !isKg ? 'db-btn-primary' : 'db-btn-outline') + '">Русский</a>' +
                    '<a href="dashboard-en.html#settings" class="db-btn ' + (isEn ? 'db-btn-primary' : 'db-btn-outline') + '">English</a>' +
                    '<a href="dashboard-kg.html#settings" class="db-btn ' + (isKg ? 'db-btn-primary' : 'db-btn-outline') + '">Кыргызча</a>' +
                '</div>' +
            '</div>' +

            buildNotifySection() +

            '<div class="db-card db-danger-zone">' +
                '<div class="db-card-title">' + L.dangerZone + '</div>' +
                '<p style="color:var(--text-muted);font-size:0.85rem;margin-bottom:16px;">' + L.deleteConfirm + '</p>' +
                '<button class="db-btn db-btn-danger" id="settingsDeleteBtn">' + L.deleteAccount + '</button>' +
            '</div>';

        // Password rules validation
        var pwRules = {
            length: function(v) { return v.length >= 8; },
            upper: function(v) { return /[A-Z]/.test(v); },
            digit: function(v) { return /[0-9]/.test(v); },
            special: function(v) { return /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(v); }
        };

        var currentPwInput = document.getElementById('settingsCurrentPw');
        var newPwInput = document.getElementById('settingsNewPw');
        var confirmPwInput = document.getElementById('settingsConfirmPw');
        var updateBtn = document.getElementById('settingsUpdatePwBtn');

        function checkPwReady() {
            var val = newPwInput.value;
            var allPass = Object.keys(pwRules).every(function(k) { return pwRules[k](val); });
            var match = val && confirmPwInput.value && val === confirmPwInput.value;
            var hasCurrent = currentPwInput.value.length > 0;
            updateBtn.disabled = !(allPass && match && hasCurrent);
        }

        currentPwInput.addEventListener('input', checkPwReady);

        newPwInput.addEventListener('input', function() {
            var val = this.value;
            Object.keys(pwRules).forEach(function(key) {
                var el = document.querySelector('.db-pw-rule[data-rule="' + key + '"]');
                if (el) el.classList.toggle('valid', pwRules[key](val));
            });
            checkPwReady();
        });

        confirmPwInput.addEventListener('input', checkPwReady);

        // Eye toggle
        document.querySelectorAll('.db-pw-eye').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var input = document.getElementById(btn.dataset.target);
                var isHidden = input.type === 'password';
                input.type = isHidden ? 'text' : 'password';
                btn.innerHTML = isHidden ? eyeSvgClosed : eyeSvgOpen;
            });
        });

        updateBtn.addEventListener('click', updatePassword);

        // Notification toggles
        document.querySelectorAll('.db-notif-toggle input').forEach(function(cb) {
            cb.addEventListener('change', onNotifToggle);
        });
    }

    // ---- Update Password ----
    var _pwChangeAttempts = 0;
    var _pwChangeLockout = 0;

    async function updatePassword() {
        if (!client) return;

        // Rate limit: 3 attempts per 5 minutes
        if (Date.now() < _pwChangeLockout) {
            var secsLeft = Math.ceil((_pwChangeLockout - Date.now()) / 1000);
            showMessage('settingsMessage', (L.errTooManyPw || 'Слишком много попыток. Подождите ' + secsLeft + ' сек.'), true);
            return;
        }

        var currentPw = document.getElementById('settingsCurrentPw').value;
        var newPw = document.getElementById('settingsNewPw').value;
        var confirmPw = document.getElementById('settingsConfirmPw').value;
        var btn = document.getElementById('settingsUpdatePwBtn');

        if (!currentPw) {
            showMessage('settingsMessage', L.currentPassword, true);
            return;
        }
        if (newPw.length < 8) {
            showMessage('settingsMessage', L.errPwShort, true);
            return;
        }
        if (newPw !== confirmPw) {
            showMessage('settingsMessage', L.errPwMatch, true);
            return;
        }

        btn.textContent = L.updating;
        btn.disabled = true;

        // Verify current password
        var email = window.ksltUser && window.ksltUser.email;
        if (!email) {
            showMessage('settingsMessage', L.errWrongPw, true);
            btn.textContent = L.updatePassword;
            btn.disabled = false;
            return;
        }

        var verifyResult = await client.auth.signInWithPassword({ email: email, password: currentPw });
        if (verifyResult.error) {
            _pwChangeAttempts++;
            if (_pwChangeAttempts >= 3) {
                _pwChangeLockout = Date.now() + 300000; // 5 min
                _pwChangeAttempts = 0;
            }
            showMessage('settingsMessage', L.errWrongPw, true);
            btn.textContent = L.updatePassword;
            btn.disabled = false;
            return;
        }

        _pwChangeAttempts = 0;

        var result = await client.auth.updateUser({ password: newPw });

        if (result.error) {
            showMessage('settingsMessage', result.error.message, true);
        } else {
            showMessage('settingsMessage', L.passwordUpdated, false);
            document.getElementById('settingsCurrentPw').value = '';
            document.getElementById('settingsNewPw').value = '';
            document.getElementById('settingsConfirmPw').value = '';

            // Invalidate all other sessions
            try {
                await client.auth.signOut({ scope: 'others' });
            } catch (e) {}

            // Notify user about password change (email + TG)
            try {
                var session = await client.auth.getSession();
                var token = session.data && session.data.session && session.data.session.access_token;
                if (token) {
                    fetch(SUPABASE_URL + '/functions/v1/security-notify', {
                        method: 'POST',
                        headers: {
                            'Authorization': 'Bearer ' + token,
                            'Content-Type': 'application/json',
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({ event_type: 'password_changed' })
                    }).catch(function() {});
                }
            } catch (e) {}
        }

        btn.textContent = L.updatePassword;
        btn.disabled = false;
    }

    // ---- Delete Account ----
    var settingsDeleteBtn = document.getElementById('settingsDeleteBtn');
    if (settingsDeleteBtn) {
        settingsDeleteBtn.addEventListener('click', async function() {
            if (!confirm(L.deleteConfirm)) return;
            if (!confirm(L.deleteConfirm)) return; // double confirm

            var btn = this;
            btn.disabled = true;
            btn.textContent = '...';

            try {
                var session = await client.auth.getSession();
                var token = session.data && session.data.session && session.data.session.access_token;
                if (!token) {
                    showMessage('settingsMessage', 'Not authenticated', true);
                    btn.disabled = false;
                    btn.textContent = L.deleteAccount;
                    return;
                }

                var resp = await fetch(SUPABASE_URL + '/functions/v1/delete-account', {
                    method: 'POST',
                    headers: {
                        'Authorization': 'Bearer ' + token,
                        'Content-Type': 'application/json',
                        'apikey': SUPABASE_ANON_KEY
                    }
                });

                var data = await resp.json();
                if (data.error) {
                    showMessage('settingsMessage', data.error, true);
                    btn.disabled = false;
                    btn.textContent = L.deleteAccount;
                } else {
                    await client.auth.signOut();
                    window.location.href = window.location.origin + '/index.html';
                }
            } catch (e) {
                showMessage('settingsMessage', e.message || 'Error', true);
                btn.disabled = false;
                btn.textContent = L.deleteAccount;
            }
        });
    }

    // ---- Helpers ----
    function showMessage(containerId, text, isError) {
        // Remove any existing toast
        var prev = document.querySelector('.db-toast');
        if (prev) prev.remove();

        var toast = document.createElement('div');
        toast.className = 'db-toast ' + (isError ? 'db-toast-error' : 'db-toast-success');
        toast.textContent = text;
        document.body.appendChild(toast);

        // Trigger slide-in animation
        requestAnimationFrame(function() {
            toast.classList.add('db-toast-show');
        });

        // Auto-hide
        var duration = isError ? 5000 : 3000;
        setTimeout(function() {
            toast.classList.remove('db-toast-show');
            toast.classList.add('db-toast-hide');
            setTimeout(function() { toast.remove(); }, 400);
        }, duration);
    }

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    // ---- Notification Bell ----
    var bellUserId = null;

    function initNotificationBell(user) {
        bellUserId = user.id;

        // Create bell button in sidebar (before nav)
        var sidebar = document.getElementById('dbSidebar');
        if (!sidebar) return;

        var userBlock = sidebar.querySelector('.db-sidebar-user');
        if (!userBlock) return;

        // Check if already exists
        if (document.getElementById('dbNotifBell')) return;

        var bellBtn = document.createElement('button');
        bellBtn.id = 'dbNotifBell';
        bellBtn.className = 'site-notif-btn';
        bellBtn.title = isKg ? 'Билдирмелер' : isEn ? 'Notifications' : 'Уведомления';
        bellBtn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="20" height="20"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg><span class="site-notif-dot" id="dbNotifDot" style="display:none;"></span>';
        userBlock.style.position = 'relative';
        userBlock.appendChild(bellBtn);

        // Dropdown container
        var dropdown = document.createElement('div');
        dropdown.id = 'dbNotifDropdown';
        dropdown.className = 'site-notif-dropdown';
        dropdown.style.display = 'none';
        userBlock.appendChild(dropdown);

        // Toggle dropdown
        bellBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            var dd = document.getElementById('dbNotifDropdown');
            if (dd.style.display === 'none') {
                loadSiteNotifications();
                dd.style.display = '';
            } else {
                dd.style.display = 'none';
            }
        });

        // Close on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('dbNotifDropdown');
            if (dd && dd.style.display !== 'none' && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        // Initial unread check
        checkSiteUnread();
    }

    async function checkSiteUnread() {
        if (!client || !bellUserId) return;

        var res = await client.from('notification_log')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', bellUserId)
            .eq('is_read', false);

        var dot = document.getElementById('dbNotifDot');
        if (dot) {
            dot.style.display = (res.count && res.count > 0) ? '' : 'none';
            if (res.count && res.count > 0) dot.textContent = res.count > 9 ? '9+' : res.count;
        }
    }

    async function loadSiteNotifications() {
        var dropdown = document.getElementById('dbNotifDropdown');
        if (!dropdown || !client || !bellUserId) return;

        dropdown.innerHTML = '<div style="padding:12px;text-align:center;color:var(--text-dim);font-size:0.8rem;">...</div>';

        var res = await client.from('notification_log')
            .select('*')
            .eq('profile_id', bellUserId)
            .order('created_at', { ascending: false })
            .limit(20);

        var items = res.data || [];
        var noNotifLabel = isKg ? 'Билдирмелер жок' : isEn ? 'No notifications' : 'Нет уведомлений';

        if (items.length === 0) {
            dropdown.innerHTML = '<div style="padding:20px;text-align:center;color:var(--text-dim);font-size:0.85rem;">' + noNotifLabel + '</div>';
            return;
        }

        var html = '';
        var unreadIds = [];

        items.forEach(function(n) {
            var cls = 'site-notif-item' + (n.is_read ? '' : ' unread');
            var time = n.created_at ? timeAgo(new Date(n.created_at)) : '';
            if (!n.is_read) unreadIds.push(n.id);
            html += '<div class="' + cls + '">' +
                '<div class="site-notif-item-title">' + escHtml(n.title || '') + '</div>' +
                '<div class="site-notif-item-msg">' + escHtml(n.message || '') + '</div>' +
                '<div class="site-notif-item-time">' + time + '</div>' +
            '</div>';
        });

        dropdown.innerHTML = html;

        // Mark all as read
        if (unreadIds.length > 0) {
            await client.from('notification_log')
                .update({ is_read: true })
                .in('id', unreadIds);

            var dot = document.getElementById('dbNotifDot');
            if (dot) dot.style.display = 'none';
        }
    }

    function timeAgo(date) {
        var now = new Date();
        var diff = Math.floor((now - date) / 1000);
        if (diff < 60) return isEn ? 'just now' : 'только что';
        if (diff < 3600) { var m = Math.floor(diff / 60); return m + (isEn ? 'm ago' : ' мин.'); }
        if (diff < 86400) { var h = Math.floor(diff / 3600); return h + (isEn ? 'h ago' : ' ч.'); }
        var d = Math.floor(diff / 86400);
        return d + (isEn ? 'd ago' : ' дн.');
    }

})();
