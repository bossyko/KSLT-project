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
        notifTgOff: 'Telegram\u2011боту байланган эмес — билдирүүлөр келбейт. Профилден байласаңыз болот.',
        close: 'Жабуу',
        cancel: 'Жокко чыгаруу',
        tgConnectTitle: 'Telegram\u2011ботту байлоо',
        tgOpenBot: 'Ботту ачуу',
        tgSteps: ['Telegramда «Старт» басыңыз', 'Ушул бетке кайтыңыз — статус өзү жаңырат'],
        tgOpened: 'Telegram жаңы өтмөктө ачылды.',
        tgOpenAgain: 'Кайра ачуу',
        tgWaiting: 'Байланууну күтүүдө…',
        tgConnectedNow: 'Байланды!',
        tgDisconnectTitle: 'Ботту ажыратуу',
        tgDisconnectYes: 'Ажыратуу',
        tgDisconnect: 'ажыратуу',
        tgDisconnectAsk: 'Ботту ажыратасызбы? Telegram аркылуу билдирүүлөр келбей калат.',
        tgWhy: 'Ботту байласаңыз, эмне келет:',
        tgBenefits: ['Матчтын убактысы жана каршылашы', 'Мелдешке чакыруу жана эскертме', 'Мүчөлүк мөөнөтү бүтөрү жөнүндө', 'Сырсөз алмашкан жөнүндө коопсуздук билдирүүсү', 'Кирүү кодду — кат ордуна, ошол замат'],
        tgWhatComes: 'Матчтар, чакыруулар, мелдештер жана коопсуздук билдирүүлөрү ушул жерге келет. Кайсынысы керек экенин Жөндөөлөрдөн тандасаңыз болот.',
        tgConnectHint: 'Мүчөлүк мөөнөтү жөнүндө Telegram аркылуу эскертме алыңыз',
        visibleToClub: 'КСЛТ мүчөлөрүнө көрүнөт',
        hiddenFromAll: 'эч кимге көрүнбөйт',
        showToClub: 'Клуб мүчөлөрүнө көрүнөт',
        showShort: 'клуб мүчөлөрүнө',
        contactsHint: 'Байланыш маалыматын клубдун мүчөлөрү гана көрөт. Меймандар менен жөн катталгандар аны көрүшпөйт.',
        whatsappHint: 'Бош — телефон номери менен бирдей',
        whatsappSame: 'телефон менен бирдей',
        showPhone: 'Клуб мүчөлөрүнө телефонумду көрсөтүү',
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
        phCurrentPassword: 'Учурдагы сыр сөзүңүз',
        phNewPassword: 'Кеминде 8 белги',
        phConfirmPassword: 'Сыр сөздү кайталаңыз',
        newPassword: 'Жаңы сыр сөз',
        confirmPassword: 'Сыр сөздү тастыктаңыз',
        updatePassword: 'Сыр сөздү жаңылоо',
        updating: 'Жаңылануулда...',
        passwordUpdated: 'Сыр сөз ийгиликтүү жаңыланды',
        errWrongPw: 'Учурдагы сыр сөз туура эмес',
        language: 'Тил',
        dangerZone: 'Коркунучтуу аймак',
        deleteAccount: 'Аккаунтту жок кылуу',
        deleteLoses: ['Рейтингдеги орун жана топтолгон упайлар', 'Мелдештердин жана матчтардын тарыхы', 'Топтолгон упайлар менен жеңилдиктер', 'Тиркеме менен сайттагы аккаунт'],
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
        regAgain: 'Кайра катталуу',
        regWaitlist: 'Күтүү тизмесинде',
        regRefused: 'Уруксат жок',
        tourUpcoming: 'Алдыдагы',
        tourPlayed: 'Ойнолгон',
        regWithdrawn: 'Арыз алынды',
        regWithdrawTitle: 'Турнирден арызды аласызбы?',
        regWithdrawText: '{name} турнирине берилген арыз алынат. Каттоо ачык турганда кайра катталса болот.',
        regWithdrawYes: 'Арызды алуу',
        regWithdrawNo: 'Жокко чыгаруу',
        regWithdrawDone: 'Арыз алынды',
        regWithdrawError: 'Арызды алуу мүмкүн болгон жок',
        wins: 'Жеңиштер', losses: 'Жеңилүүлөр', rank: 'Рейтинг өзгөрүшү',
        catsTitle: 'Категориялар боюнча упайлар', catHome: 'негизги', place: 'Орун',
        catWins: ['жеңиш', 'жеңиш', 'жеңиш'],
        catLosses: ['жеңилүү', 'жеңилүү', 'жеңилүү'],
        catTotal: 'Бардык матчтар', catWinRate: 'жеңиш', catNoMatches: 'матчтар азырынча жок',
        pairsTitle: 'Жуптук', mixedTitle: 'Аралаш', pairsTag: 'жуптук', mixedTag: 'аралаш',
        pairsNote: 'рейтингге кирбейт', pairsMatches: 'Матчтар',
        notificationsTab: 'Билдирмелер', notifEmpty: 'Билдирмелер жок',
        notifEmptyText: 'Мелдештер, чакыруулар жана төлөмдөр жөнүндө кабарлар ушул жерде көрүнөт',
        catClosed: 'жабык',
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
        ratingHistory: 'Упайлар',
        rhTotalPoints: 'Жалпы упайлар',
        qrShare: 'QR код',
        qrTitle: 'Профилди бөлүшүү',
        qrDownload: 'PNG жүктөө',
        qrCopy: 'Шилтемени көчүрүү',
        qrCopied: 'Көчүрүлдү!',
        games: 'Менин оюндарым',
        gamesTitle: 'Менин оюндарым',
        subTournaments: 'Өткөн мелдештер',
        subMatches: 'Матчтар',
        subChallenges: 'Чакыруулар',
        subBattles: 'Баттлдар',
        subUpcoming: 'Алдыдагы турнирлер',
        chalAccept: 'Кабыл алуу', chalDecline: 'Четке кагуу', chalCancel: 'Кайра чакыруу',
        chalCancelledBySelf: 'Алынды', chalCancelledByOpp: 'Алынды',
        chalDirSent: 'сиз чакырдыңыз', chalDirGot: 'сизди чакырышты', chalSentOn: 'чакырык',
        chalTheyAccepted: 'Атаандаш кабыл алды', chalYouAccepted: 'Сиз кабыл алдыңыз',
        chalTheyDeclined: 'Атаандаш четке какты', chalYouDeclined: 'Сиз четке кактыңыз',
        chalActionDone: 'Бул чакырыкка мурун жооп берилген',
        chalGone: 'Бул чакырык эми жок',
        tourNoResults: 'Жыйынтык киргизилген жок',
        regRefusedShort: 'Четке кагылган',
        tourStatus: 'Абалы', tourResult: 'Жыйынтык', invDirection: 'Багыты',
        showAll: 'Баарын көрсөтүү',
        collapseBtn: 'Жыйуу',
        loadingList: 'Жүктөлүүдө...',
        noMatches: 'Матчтар жок',
        noMatchesText: 'Сиздин матчтарыңыз мелдештерден кийин бул жерде көрүнөт',
        matchDate: 'Күн', matchOpponent: 'Атаандаш', matchScore: 'Эсеп', matchResult: 'Жыйынтык', matchTournament: 'Мелдеш', matchRound: 'Раунд', matchDoubles: 'Жуптук', matchWith: 'жупташы',
        tagRating: 'рейтинг', tagFriendly: 'достук', tagDoubles: 'жуптук', tagMixed: 'аралаш', tagBattle: 'баттл',
        statsNote: 'Статистика рейтингдик жеке мелдештер боюнча',
        challenges: 'Сынактар',
        challengesTitle: 'Матчка чакыруулар',
        chalSent: 'Жөнөтүлдү',
        chalReceived: 'Алынды',
        chalBattle: 'Баттл',
        chalWon: 'Жеңиш',
        chalLost: 'Жеңилүү',
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
        notifSite: 'Сайт и приложение',
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
        notifTgOff: 'The Telegram bot is not connected, so nothing will arrive there. You can connect it in your profile.',
        close: 'Close',
        cancel: 'Cancel',
        tgConnectTitle: 'Connect the Telegram bot',
        tgOpenBot: 'Open the bot',
        tgSteps: ['Press «Start» in Telegram', 'Come back to this page — the status updates on its own'],
        tgOpened: 'Telegram has opened in a new tab.',
        tgOpenAgain: 'Open again',
        tgWaiting: 'Waiting for the connection…',
        tgConnectedNow: 'Connected!',
        tgDisconnectTitle: 'Disconnect the bot',
        tgDisconnectYes: 'Disconnect',
        tgDisconnect: 'disconnect',
        tgDisconnectAsk: 'Disconnect the bot? Telegram notifications will stop arriving.',
        tgWhy: 'What you get after connecting the bot:',
        tgBenefits: ['Match time and opponent', 'Challenges and tournament reminders', 'Membership expiry notice', 'Security alerts when your password changes', 'Sign-in codes — instantly, instead of email'],
        tgWhatComes: 'Matches, challenges, tournaments and security alerts arrive here. You can choose which ones in Settings.',
        tgConnectHint: 'Get membership expiry reminders via Telegram',
        visibleToClub: 'visible to KSLT members',
        hiddenFromAll: 'hidden from everyone',
        showToClub: 'Visible to club members',
        showShort: 'to club members',
        contactsHint: 'Contact details are visible only to KSLT members with an active membership. Guests and registered users without one do not see them.',
        whatsappHint: 'Leave empty if it is the same as your phone',
        whatsappSame: 'same as phone',
        showPhone: 'Show my phone to club members',
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
        phCurrentPassword: 'Your current password',
        phNewPassword: 'At least 8 characters',
        phConfirmPassword: 'Repeat the password',
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        updatePassword: 'Update Password',
        updating: 'Updating...',
        passwordUpdated: 'Password updated successfully',
        errWrongPw: 'Current password is incorrect',
        language: 'Language',
        dangerZone: 'Danger Zone',
        deleteAccount: 'Delete Account',
        deleteLoses: ['Your ranking position and points', 'Tournament and match history', 'Loyalty points and discounts', 'Your account on the site and in the app'],
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
        regAgain: 'Enter again',
        regWaitlist: 'On the waiting list',
        regRefused: 'Not admitted',
        tourUpcoming: 'Upcoming',
        tourPlayed: 'Played',
        regWithdrawn: 'Withdrawn',
        regWithdrawTitle: 'Withdraw from the tournament?',
        regWithdrawText: 'Your entry for {name} will be withdrawn. You can enter again while registration is open.',
        regWithdrawYes: 'Withdraw',
        regWithdrawNo: 'Cancel',
        regWithdrawDone: 'Entry withdrawn',
        regWithdrawError: 'Could not withdraw the entry',
        wins: 'Wins', losses: 'Losses', rank: 'Rank Change',
        catsTitle: 'Points by category', catHome: 'home', place: 'Place',
        catWins: ['win', 'wins', 'wins'],
        catLosses: ['loss', 'losses', 'losses'],
        catTotal: 'Matches played', catWinRate: 'wins', catNoMatches: 'no matches yet',
        pairsTitle: 'Doubles', mixedTitle: 'Mixed', pairsTag: 'doubles', mixedTag: 'mixed',
        pairsNote: 'not counted in rating', pairsMatches: 'Matches',
        notificationsTab: 'Notifications', notifEmpty: 'No notifications',
        notifEmptyText: 'Messages about tournaments, challenges and payments appear here',
        catClosed: 'closed',
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
        ratingHistory: 'Points',
        rhTotalPoints: 'Total Points',
        qrShare: 'QR Code',
        qrTitle: 'Share Profile',
        qrDownload: 'Download PNG',
        qrCopy: 'Copy Link',
        qrCopied: 'Copied!',
        games: 'My Games',
        gamesTitle: 'My Games',
        subTournaments: 'Past tournaments',
        subMatches: 'Matches',
        subChallenges: 'Challenges',
        subBattles: 'Battles',
        subUpcoming: 'Upcoming tournaments',
        chalAccept: 'Accept', chalDecline: 'Decline', chalCancel: 'Withdraw',
        chalCancelledBySelf: 'Withdrawn', chalCancelledByOpp: 'Withdrawn',
        chalDirSent: 'you challenged', chalDirGot: 'you were challenged', chalSentOn: 'sent',
        chalTheyAccepted: 'Opponent accepted', chalYouAccepted: 'You accepted',
        chalTheyDeclined: 'Opponent declined', chalYouDeclined: 'You declined',
        chalActionDone: 'This challenge has already been answered',
        chalGone: 'This challenge no longer exists',
        tourNoResults: 'Results not entered',
        regRefusedShort: 'Declined',
        tourStatus: 'Status', tourResult: 'Result', invDirection: 'Direction',
        showAll: 'Show all',
        collapseBtn: 'Collapse',
        loadingList: 'Loading...',
        noMatches: 'No matches yet',
        noMatchesText: 'Your matches will appear here after tournaments',
        matchDate: 'Date', matchOpponent: 'Opponent', matchScore: 'Score', matchResult: 'Result', matchTournament: 'Tournament', matchRound: 'Round', matchDoubles: 'Doubles', matchWith: 'with',
        tagRating: 'rating', tagFriendly: 'friendly', tagDoubles: 'doubles', tagMixed: 'mixed', tagBattle: 'battle',
        statsNote: 'Statistics from rating singles tournaments only',
        challenges: 'Challenges',
        challengesTitle: 'Match Challenges',
        chalSent: 'Sent',
        chalReceived: 'Received',
        chalBattle: 'Battle',
        chalWon: 'Won',
        chalLost: 'Lost',
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
        notifSite: 'Site and app',
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
        notifTgOff: 'Telegram\u2011бот не подключён — сюда ничего не придёт. Подключить его можно в Профиле.',
        close: 'Закрыть',
        cancel: 'Отмена',
        tgConnectTitle: 'Подключение Telegram\u2011бота',
        tgOpenBot: 'Открыть бота',
        tgSteps: ['В Telegram нажмите «Старт»', 'Вернитесь на эту страницу — состояние обновится само'],
        tgOpened: 'Telegram открылся в новой вкладке.',
        tgOpenAgain: 'Открыть ещё раз',
        tgWaiting: 'Ждём подключения…',
        tgConnectedNow: 'Подключено!',
        tgDisconnectTitle: 'Отключение бота',
        tgDisconnectYes: 'Отключить',
        tgDisconnect: 'отключить',
        tgDisconnectAsk: 'Отключить бота? Уведомления в Telegram приходить перестанут.',
        tgWhy: 'Что будет приходить в Telegram:',
        tgBenefits: ['Время матча и соперник', 'Вызовы на игру и напоминания о турнирах', 'Когда истекает членство', 'Оповещение, если сменили пароль или почту', 'Код для входа — сразу, вместо письма'],
        tgWhatComes: 'Сюда приходят матчи, вызовы, турниры и оповещения безопасности. Выбрать, что именно получать, можно в Настройках.',
        tgConnectHint: 'Получайте напоминания об истечении членства в Telegram',
        visibleToClub: 'виден членам КСЛТ',
        hiddenFromAll: 'скрыт от всех',
        showToClub: 'Виден членам клуба',
        showShort: 'членам клуба',
        contactsHint: 'Контакты видят только члены КСЛТ с действующим членством. Гостям и просто зарегистрированным они не показываются.',
        whatsappHint: 'Пусто — тот же, что телефон',
        whatsappSame: 'тот же, что телефон',
        showPhone: 'Показывать мой телефон членам клуба',
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
        phCurrentPassword: 'Ваш текущий пароль',
        phNewPassword: 'Минимум 8 символов',
        phConfirmPassword: 'Повторите пароль',
        newPassword: 'Новый пароль',
        confirmPassword: 'Подтвердите пароль',
        updatePassword: 'Обновить пароль',
        updating: 'Обновление...',
        passwordUpdated: 'Пароль успешно обновлён',
        errWrongPw: 'Неверный текущий пароль',
        language: 'Язык',
        dangerZone: 'Опасная зона',
        deleteAccount: 'Удалить аккаунт',
        deleteLoses: ['Место в рейтинге и набранные очки', 'История турниров и матчей', 'Накопленные баллы и скидки', 'Аккаунт на сайте и в приложении'],
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
        regAgain: 'Записаться снова',
        regWaitlist: 'В листе ожидания',
        regRefused: 'Не допущен',
        tourUpcoming: 'Предстоящие',
        tourPlayed: 'Сыгранные',
        regWithdrawn: 'Заявка снята',
        regWithdrawTitle: 'Снять заявку с турнира?',
        regWithdrawText: 'Заявка на {name} будет снята. Записаться снова можно, пока открыта регистрация.',
        regWithdrawYes: 'Снять заявку',
        regWithdrawNo: 'Отмена',
        regWithdrawDone: 'Заявка снята',
        regWithdrawError: 'Не удалось снять заявку',
        wins: 'Победы', losses: 'Поражения', rank: 'Изм. рейтинга',
        catsTitle: 'Очки по категориям', catHome: 'домашняя', place: 'Место',
        catWins: ['победа', 'победы', 'побед'],
        catLosses: ['поражение', 'поражения', 'поражений'],
        catTotal: 'Всего матчей', catWinRate: 'побед', catNoMatches: 'матчей пока нет',
        pairsTitle: 'Парные', mixedTitle: 'Микст', pairsTag: 'пары', mixedTag: 'микст',
        pairsNote: 'в рейтинг не идут', pairsMatches: 'Матчей',
        notificationsTab: 'Уведомления', notifEmpty: 'Уведомлений пока нет',
        notifEmptyText: 'Здесь появятся сообщения о турнирах, вызовах и платежах',
        catClosed: 'закрыта',
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
        ratingHistory: 'Очки',
        rhTotalPoints: 'Всего очков',
        qrShare: 'QR код',
        qrTitle: 'Поделиться профилем',
        qrDownload: 'Скачать PNG',
        qrCopy: 'Скопировать ссылку',
        qrCopied: 'Скопировано!',
        games: 'Мои игры',
        gamesTitle: 'Мои игры',
        subTournaments: 'Прошедшие турниры',
        subMatches: 'Матчи',
        subChallenges: 'Вызовы',
        subBattles: 'Баттлы',
        subUpcoming: 'Предстоящие турниры',
        chalAccept: 'Принять', chalDecline: 'Отклонить', chalCancel: 'Отозвать',
        chalCancelledBySelf: 'Отозван', chalCancelledByOpp: 'Отозван',
        chalDirSent: 'вы вызвали', chalDirGot: 'вас вызвали', chalSentOn: 'вызов от',
        chalTheyAccepted: 'Соперник принял', chalYouAccepted: 'Вы приняли',
        chalTheyDeclined: 'Соперник отклонил', chalYouDeclined: 'Вы отклонили',
        chalActionDone: 'На этот вызов уже ответили',
        chalGone: 'Этого вызова больше нет',
        tourNoResults: 'Результаты не внесены',
        regRefusedShort: 'Отклонена',
        tourStatus: 'Статус', tourResult: 'Результат', invDirection: 'Направление',
        showAll: 'Показать все',
        collapseBtn: 'Свернуть',
        loadingList: 'Загрузка...',
        noMatches: 'Матчей пока нет',
        noMatchesText: 'Ваши матчи появятся здесь после участия в турнирах',
        matchDate: 'Дата', matchOpponent: 'Соперник', matchScore: 'Счёт', matchResult: 'Итог', matchTournament: 'Турнир', matchRound: 'Раунд', matchDoubles: 'Парный', matchWith: 'в паре с',
        tagRating: 'рейтинг', tagFriendly: 'дружеский', tagDoubles: 'пары', tagMixed: 'микст', tagBattle: 'баттл',
        statsNote: 'Статистика по рейтинговым одиночным турнирам',
        challenges: 'Вызовы',
        challengesTitle: 'Вызовы на матч',
        chalSent: 'Отправлено',
        chalReceived: 'Получено',
        chalBattle: 'Баттл',
        chalWon: 'Победа',
        chalLost: 'Поражение',
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
        notifSite: 'Сайт и приложение',
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

    // ---- Проверка имени ----
    //
    // Раньше письменность требовалась по языку страницы: на русской версии
    // только кириллица, на английской только латиница. Из-за этого человек с
    // именем Konstantin Han не мог сохранить профиль на русской странице, а
    // кыргызское имя с буквами ң, ө, ү — ни на русской, ни на английской:
    // этих букв нет ни в одном из двух алфавитов. На сайте кыргызского клуба.
    //
    // Имя принадлежит человеку, а не странице, на которой он его вводит.
    // Принимаем любую из трёх письменностей и отсекаем только явный мусор —
    // цифры и посторонние знаки.
    var SCRIPT_ANY = /^[а-яА-ЯёЁңҢүҮөӨa-zA-Z\s\-'.]+$/;
    var scriptRegex = SCRIPT_ANY;
    var scriptHint = isKg ? 'Ат тамгалардан турушу керек' :
                     isEn ? 'Letters only — no digits or symbols' :
                            'Только буквы, без цифр и символов';

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
    /** Вошедший пользователь: нужен при переключении разделов. */
    var _dashUser = null;
    var _dashProfile = null;

    window.onAuthReady = function(user, profile) {
        _dashUser = user;
        renderSidebar(profile);
        initQrButton(profile);
        loadSidebarRatings(profile);
        renderMobileTabs();
        renderProfile(user, profile);
        renderMembershipCard().then(function(state) {
            applyMembershipRestrictions(state);
        });
        _dashProfile = profile;
        renderGames(profile);
        renderStats(profile);
        renderNotifications(user);
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

    /**
     * Ссылка на платежи в карточке членства.
     *
     * Раньше здесь выводились последние пять платежей — те же самые, что в
     * разделе «Платежи», только урезанные. Человек видел одно и то же дважды
     * и не понимал, зачем ему второй список.
     *
     * Оставляем ссылку: из карточки членства должно быть видно, где искать
     * платежи, но повторять их незачем.
     */
    async function renderPaymentHistory(card) {
        if (!client) return;

        var userRes = await client.auth.getUser();
        if (!userRes.data || !userRes.data.user) return;

        var result = await client.from('payments')
            .select('id', { count: 'exact', head: true })
            .eq('profile_id', userRes.data.user.id);

        if (!result.count) return;

        card.insertAdjacentHTML('beforeend',
            '<div class="db-pay-link">' +
                '<button type="button" class="db-pay-link-btn" data-tab="payments">' +
                    L.payHistory + ' \u2192' +
                '</button>' +
            '</div>');

        var link = card.querySelector('.db-pay-link-btn');
        if (link) link.addEventListener('click', function() {
            var tab = document.querySelector('.db-sidebar-link[data-tab="payments"]');
            if (tab) tab.click();
        });
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
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="vouchers"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>' + L.vouchers + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="loyalty"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + L.loyaltyTab + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="payments"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>' + L.payments + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="notifications"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' + L.notificationsTab + '</button></li>' +
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
            .select('category_id, points, closed_at')
            .eq('player_id', profile.player_id)
            .order('points', { ascending: false });

        // Закрытые категории остаются в карточке, но приглушёнными: игрок
        // в них больше не выступает, и строка не должна читаться как
        // действующая. Friendly в рейтинге не участвует вовсе
        var myCats = (pcRes.data || []).filter(function(r) {
            return r.category_id !== 'friendly';
        });
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
                html += '<div class="db-sidebar-rating-row' +
                        (row.closed_at ? ' db-sidebar-rating-off' : '') + '">' +
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
        if (tab === 'tournaments' || tab === 'challenges' || tab === 'invitations') {
            tab = 'games'; window.location.hash = 'games';
        }
        document.querySelectorAll('.db-sidebar-link').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.db-mobile-tab').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.db-section').forEach(function(el) {
            el.classList.toggle('active', el.id === 'db-' + tab);
        });

        // Статус вызова мог измениться, пока раздел был закрыт: ответить
        // можно из колокольчика и с телефона. Перечитываем при заходе,
        // иначе приходится обновлять страницу руками
        if (tab === 'games' && _dashProfile) loadGamesBattles(_dashProfile);

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
    /**
     * Телефон: страна списком, номер отдельно.
     *
     * Раньше это была одна строка, и в базе оказывалось «+996 555 12 34 56»,
     * «0555123456» — у каждого по-своему. Восстановление доступа ищет человека
     * по номеру, и такие записи между собой не сходятся.
     */
    /**
     * Переключатель видимости рядом с полем связи.
     *
     * Обычная галочка тут не годилась: по ней не прочитать, что именно
     * произойдёт. Ползунок сразу показывает состояние, а подпись меняется
     * вместе с ним — «виден членам клуба» или «скрыт».
     */
    function showToggle(id, checked) {
        return '<label class="db-show-toggle">' +
            '<span class="db-show-label" data-for="' + id + '">' +
                (checked ? L.visibleToClub : L.hiddenFromAll) +
            '</span>' +
            '<span class="db-switch">' +
                '<input type="checkbox" id="' + id + '"' + (checked ? ' checked' : '') + '>' +
                '<span class="db-switch-slider"></span>' +
            '</span>' +
        '</label>';
    }

    /** Подпись переключателя следует за его состоянием. */
    function bindShowToggleLabels() {
        document.querySelectorAll('.db-show-toggle input').forEach(function(input) {
            input.addEventListener('change', function() {
                var label = document.querySelector('.db-show-label[data-for="' + input.id + '"]');
                if (label) label.textContent = input.checked ? L.visibleToClub : L.hiddenFromAll;
            });
        });
    }

    /**
     * Номер WhatsApp. Необязательный: пустое поле значит «тот же, что телефон».
     * Вводить номер дважды никого не заставляем, но у кого WhatsApp на другом
     * номере — впишет свой.
     */
    function whatsappFieldHtml(profile) {
        var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');
        var stored = profile.whatsapp_phone || '';
        var parts = window.KSLT_PHONE
            ? KSLT_PHONE.split(stored, profile.whatsapp_country || profile.phone_country)
            : { iso: 'KG', rest: stored };

        return '<div class="db-phone-row">' +
            (window.KSLT_PHONE
                ? KSLT_PHONE.selectHtml('profileWhatsappCountry', parts.iso, lang, 'db-field-input db-phone-country')
                : '') +
            '<input class="db-field-input db-phone-number" type="tel" id="profileWhatsapp" value="' +
                escHtml(stored ? parts.rest : '') + '" placeholder="' + L.whatsappSame + '" inputmode="tel">' +
        '</div>';
    }

    function phoneFieldHtml(profile) {
        var lang = isKg ? 'kg' : (isEn ? 'en' : 'ru');
        var parts = window.KSLT_PHONE
            ? KSLT_PHONE.split(profile.phone || '', profile.phone_country)
            : { iso: 'KG', rest: profile.phone || '' };

        return '<div class="db-phone-row">' +
            (window.KSLT_PHONE
                ? KSLT_PHONE.selectHtml('profilePhoneCountry', parts.iso, lang, 'db-field-input db-phone-country')
                : '') +
            '<input class="db-field-input db-phone-number" type="tel" id="profilePhone" value="' +
                escHtml(parts.rest) + '" placeholder="555 123 456" inputmode="tel">' +
        '</div>';
    }

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
                // Телефон занимает строку целиком: рядом с полом на список
                // стран оставалась половина ширины, и названия обрезались
                // Каждый способ связи открывается отдельно: телеграм может быть
                // рабочий, WhatsApp личный. Переключатель стоит у своего поля.
                '<div class="db-contacts-note">' + L.contactsHint + '</div>' +
                '<div class="db-field">' +
                    '<div class="db-contact-head">' +
                        '<label class="db-field-label">' + L.phone + ' <span class="db-required">*</span></label>' +
                        showToggle('profileShowPhone', profile.show_phone) +
                    '</div>' +
                    phoneFieldHtml(profile) +
                '</div>' +
                '<div class="db-field">' +
                    '<div class="db-contact-head">' +
                        '<label class="db-field-label">WhatsApp</label>' +
                        showToggle('profileShowWhatsapp', profile.show_whatsapp) +
                    '</div>' +
                    whatsappFieldHtml(profile) +
                    '<div class="db-field-hint">' + L.whatsappHint + '</div>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.gender + ' <span class="db-required">*</span></label>' +
                    genderSelect +
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
                        '<div class="db-contact-head">' +
                            '<label class="db-field-label">' + L.instagram + '</label>' +
                            showToggle('profileShowInstagram', profile.show_instagram) +
                        '</div>' +
                        '<input class="db-field-input" type="text" id="profileInstagram" value="' + escHtml(profile.instagram || '') + '" placeholder="@username">' +
                    '</div>' +
                    '<div class="db-field">' +
                        '<div class="db-contact-head">' +
                            '<label class="db-field-label">' + L.telegram + '</label>' +
                            showToggle('profileShowTelegram', profile.show_telegram) +
                        '</div>' +
                        '<input class="db-field-input" type="text" id="profileTelegram" value="' + escHtml(profile.telegram || '') + '" placeholder="@username">' +
                    '</div>' +
                '</div>' +
                // Раньше здесь было написано только про напоминания о членстве —
                // человек не понимал, зачем подключать бота и что он получит.
                // Перечисляем всё, что приходит, до нажатия, а не после.
                '<div class="db-tg-block">' +
                    // Подпись слева, состояние и действие справа — как у контактов.
                    // Ползунок тут не годится: подключение уводит в телеграм, где
                    // надо нажать «Старт». Человек включил бы ползунок, ничего там
                    // не нажал и вернулся к надписи «подключено» — ровно та ложь,
                    // от которой мы уходим.
                    '<div class="db-contact-head">' +
                        '<label class="db-field-label">Telegram-бот</label>' +
                        (profile.telegram_chat_id
                            ? '<span class="db-tg-state">' + L.tgConnected +
                              ' \u00b7 <button type="button" class="db-tg-off" id="tgDisconnect">' + L.tgDisconnect + '</button></span>'
                            : '<a href="https://t.me/' + (window.KSLT_TG_BOT || 'KSLTennisBot') + '?start=' + (profile.id || '') +
                              '" target="_blank" rel="noopener" class="db-tg-btn" id="tgConnect">\u2709 ' + L.tgConnect + '</a>') +
                    '</div>' +
                    (profile.telegram_chat_id
                        ? '<div class="db-tg-note">' + L.tgWhatComes + '</div>'
                        : '<div class="db-tg-title">' + L.tgWhy + '</div>' +
                          '<ul class="db-tg-list">' +
                              L.tgBenefits.map(function(item) { return '<li>' + item + '</li>'; }).join('') +
                          '</ul>'
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

        bindShowToggleLabels();

        // Отключение бота: раньше отвязаться из кабинета было нельзя вовсе —
        // человек блокировал бота в телеграме, а здесь оставалось «подключён»
        var tgOff = document.getElementById('tgDisconnect');
        if (tgOff) {
            tgOff.addEventListener('click', function() {
                dbModal({
                    title: L.tgDisconnectTitle,
                    body: '<p class="db-modal-text">' + L.tgDisconnectAsk + '</p>',
                    actions: [
                        { label: L.cancel },
                        { label: L.tgDisconnectYes, primary: true, onClick: async function(close) {
                            var res = await client.from('profiles')
                                .update({ telegram_chat_id: null, telegram_username: null })
                                .eq('id', window.ksltUser.id);
                            close();
                            if (res.error) { showMessage('profileMessage', res.error.message, true); return; }
                            window.ksltProfile.telegram_chat_id = null;
                            window.ksltProfile.telegram_username = null;
                            renderProfile(window.ksltUser, window.ksltProfile);
                        } }
                    ]
                });
            });
        }

        // Подключение. Раньше ссылка просто уводила в телеграм: человек
        // возвращался, а в кабинете по-прежнему «не подключён», пока он сам не
        // перезагрузит страницу. Теперь окно ждёт подключения и меняет
        // состояние само.
        var tgOn = document.getElementById('tgConnect');
        if (tgOn) {
            tgOn.addEventListener('click', function() {
                // Телеграм открывает сама ссылка — лишнего шага «нажмите ещё
                // раз» быть не должно. Окно появляется следом и ждёт ответа
                // бота: человек возвращается на готовое состояние.
                var botUrl = tgOn.getAttribute('href');
                var modal = dbModal({
                    title: L.tgConnectTitle,
                    body:
                        '<p class="db-modal-text">' + L.tgOpened + '</p>' +
                        '<ol class="db-modal-steps">' +
                            L.tgSteps.map(function(st) { return '<li>' + st + '</li>'; }).join('') +
                        '</ol>' +
                        '<div class="db-modal-wait" id="tgWait">' +
                            '<span class="db-modal-spinner"></span>' +
                            '<span id="tgWaitText">' + L.tgWaiting + '</span>' +
                        '</div>',
                    actions: [{ label: L.tgOpenAgain, onClick: function() {
                        window.open(botUrl, '_blank', 'noopener');
                    } }]
                });

                // Ждём, пока бот отзовётся: телеграм открывается отдельно, и
                // вернуться человек может в любой момент
                var stop = false;
                modal.el.addEventListener('kslt-closed', function() { stop = true; });
                var origClose = modal.close;
                modal.close = function() { stop = true; origClose(); };
                modal.el.querySelector('.db-modal-close').addEventListener('click', function() { stop = true; });
                modal.el.addEventListener('click', function(e) { if (e.target === modal.el) stop = true; });

                (async function poll() {
                    for (var i = 0; i < 100 && !stop; i++) {
                        await new Promise(function(r) { setTimeout(r, 3000); });
                        if (stop) return;
                        var res = await client.from('profiles')
                            .select('telegram_chat_id, telegram_username')
                            .eq('id', window.ksltUser.id).single();
                        if (res.data && res.data.telegram_chat_id) {
                            window.ksltProfile.telegram_chat_id = res.data.telegram_chat_id;
                            window.ksltProfile.telegram_username = res.data.telegram_username;
                            var wait = document.getElementById('tgWait');
                            if (wait) {
                                wait.innerHTML = '<span class="db-modal-done">\u2713 ' + L.tgConnectedNow + '</span>';
                            }
                            setTimeout(function() {
                                modal.close();
                                renderProfile(window.ksltUser, window.ksltProfile);
                            }, 1200);
                            return;
                        }
                    }
                })();
            });
        }

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

    // Отдельного раздела «Приглашения» больше нет: позвать поиграть — это
    // ещё не игра, и держать ради него пункт меню наравне с турнирами
    // незачем. Список живёт подразделом в «Моих играх».

    async function loadGameInvites() {
        var card = document.getElementById('dbGamesInvites');
        if (!card || !client) return;

        try {
            var result = await client.rpc('get_my_game_invites');
            var invites = result.data || [];

            if (invites.length === 0) {
                card.innerHTML =
                    '<div class="db-empty" style="padding:16px 0;">' +
                        '<div class="db-empty-icon">&#127934;</div>' +
                        '<div class="db-empty-title">' + L.invNoInvites + '</div>' +
                        '<div class="db-empty-text">' + L.invNoInvitesText + '</div>' +
                    '</div>';
                return;
            }

            renderPaged(card, invites, function(rows) {
                return '<table class="db-matches-table db-battles-table"><thead><tr>' +
                        '<th>' + L.matchDate + '</th>' +
                        '<th>' + L.matchOpponent + '</th>' +
                        '<th>' + L.invDirection + '</th>' +
                        '<th>' + L.tourStatus + '</th>' +
                    '</tr></thead><tbody>' +
                    rows.map(inviteRow).join('') +
                    '</tbody></table>';
            }, 0);
        } catch(e) {
            console.error('Game invites error:', e);
            card.innerHTML = '<p style="color:var(--text-muted);">\u2014</p>';
        }

        function inviteRow(inv) {
            var name = inv.partner_name || '\u2014';
            var statusLabel = inv.status === 'accepted' ? L.invAccepted
                : inv.status === 'declined' ? L.invDeclined : L.invPending;
            var statusClass = inv.status === 'accepted' ? 'accepted'
                : inv.status === 'declined' ? 'declined' : 'pending';

            var dateStr = '';
            if (inv.created_at) {
                var d = String(inv.created_at);
                dateStr = d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(2, 4);
            }

            return '<tr>' +
                '<td class="db-match-date">' + dateStr + '</td>' +
                '<td><div class="db-match-opponent">' +
                    matchAvatar(name, inv.partner_avatar) +
                    '<span>' + escHtml(name) + '</span>' +
                '</div></td>' +
                '<td class="db-tour-status">' +
                    (inv.direction === 'sent' ? L.invSent : L.invReceived) + '</td>' +
                '<td><span class="db-status-badge db-invite-' + statusClass + '">' + statusLabel + '</span></td>' +
            '</tr>';
        }
    }
    function renderGames(profile) {
        var container = document.getElementById('db-games');
        if (!container) return;

        var html = '<h2 class="db-section-title">' + L.gamesTitle + '</h2>';

        // \u041F\u043E\u0440\u044F\u0434\u043E\u043A \u043E\u0442 \u0433\u043B\u0430\u0432\u043D\u043E\u0433\u043E \u043A \u0432\u0442\u043E\u0440\u043E\u0441\u0442\u0435\u043F\u0435\u043D\u043D\u043E\u043C\u0443: \u0442\u0443\u0440\u043D\u0438\u0440\u044B \u0434\u0430\u044E\u0442 \u0440\u0435\u0439\u0442\u0438\u043D\u0433,
        // \u043C\u0430\u0442\u0447\u0438 \u2014 \u0438\u0445 \u0440\u0430\u0437\u0431\u043E\u0440, \u0431\u0430\u0442\u0442\u043B\u044B \u0438\u0433\u0440\u0430\u044E\u0442\u0441\u044F \u0432\u043D\u0435 \u0437\u0430\u0447\u0451\u0442\u0430, \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u044F \u0435\u0449\u0451
        // \u0434\u0430\u0436\u0435 \u043D\u0435 \u0438\u0433\u0440\u0430.
        //
        // \u0412\u044B\u0437\u043E\u0432\u043E\u0432 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u043C \u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u0435 \u043D\u0435\u0442. \u0411\u0430\u0442\u0442\u043B \u2014 \u043D\u0435 \u0434\u0440\u0443\u0433\u0430\u044F
        // \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u044C, \u0430 \u0442\u043E\u0442 \u0436\u0435 \u0432\u044B\u0437\u043E\u0432 \u043F\u043E\u0441\u043B\u0435 \u043F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u0438: \u043E\u0434\u043D\u0430 \u0441\u0442\u0440\u043E\u043A\u0430 \u0432
        // challenges \u0441 \u043F\u0440\u0438\u0437\u043D\u0430\u043A\u043E\u043C battle_published. \u041F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u044D\u0442\u043E \u0434\u0432\u0443\u043C\u044F
        // \u0441\u043F\u0438\u0441\u043A\u0430\u043C\u0438 \u0437\u043D\u0430\u0447\u0438\u043B\u043E \u0431\u044B \u0434\u0435\u043B\u0438\u0442\u044C \u043E\u0434\u043D\u0443 \u0438\u0433\u0440\u0443 \u043D\u0430\u0434\u0432\u043E\u0435 \u043F\u043E \u0435\u0451 \u0441\u0442\u0430\u0434\u0438\u0438.
        function sub(bodyId, icon, title, innerId) {
            return '<div class="db-subsection">' +
                '<button class="db-subsection-toggle db-subsection-open" data-target="' + bodyId + '">' +
                '<span>' + icon + ' ' + title + '</span>' +
                '<span class="db-toggle-arrow">\u25BC</span></button>' +
                '<div class="db-subsection-body" id="' + bodyId + '">' +
                '<div id="' + innerId + '"><p class="db-subsection-loading">' + L.loadingList + '</p></div>' +
                '</div></div>';
        }

        // Предстоящие турниры стоят первыми и живут отдельным подразделом:
        // это единственное здесь, что требует действия — не пропустить, не
        // забыть сняться. Всё остальное — архив. Внутри общего блока
        // «Турниры» предстоящее было спрятано, да ещё и сворачивалось
        html += sub('dbSubUpcoming', '\uD83D\uDCC5', L.subUpcoming, 'dbGamesUpcoming');
        html += sub('dbSubTournaments', '\uD83C\uDFC6', L.subTournaments, 'dbGamesTournaments');
        html += sub('dbSubMatches', '\u2694\uFE0F', L.subMatches, 'dbGamesMatches');
        html += sub('dbSubBattles', '\uD83D\uDD25', L.subBattles, 'dbGamesBattles');
        html += sub('dbSubInvites', '\uD83C\uDFBE', L.invitations, 'dbGamesInvites');

        // Достижения живут в «Статистике»: они про показатели игрока, а не про
        // сыгранные встречи. Здесь стоял их второй, точно такой же блок

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
        loadGamesTournaments(profile);
        loadGamesMatches(profile);
        loadGamesBattles(profile);
        loadGameInvites();
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
            var REG_FIELDS = 'id, status, draw_position, group_number, tournament:tournaments(id, title, title_en, title_kg, date_start, image, status)';
            var REG_STATUSES = ['approved', 'draw', 'waitlist', 'pending', 'withdrawn', 'blocked', 'rejected'];

            // Без ограничения: раньше брали по десять записей на заявки и на
            // результаты, и турниры постарше просто исчезали из кабинета,
            // ничем себя не обозначив.
            //
            // Второй запрос — про парные турниры. Заявку подаёт капитан, и
            // напарник в ней стоит отдельным полем: своих парных турниров он
            // в кабинете не видел вовсе
            var results = await Promise.all([
                client.from('tournament_registrations')
                    .select(REG_FIELDS)
                    .eq('player_id', pid).in('status', REG_STATUSES)
                    .order('registered_at', { ascending: false }),
                client.from('tournament_results')
                    .select('tournament_id, round_reached, points_earned, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                    .eq('player_id', pid).order('created_at', { ascending: false }),
                client.from('tournament_registrations')
                    .select(REG_FIELDS)
                    .eq('partner_id', pid).in('status', REG_STATUSES)
                    .order('registered_at', { ascending: false }),
                // Записи истории без турнира — их админ добавляет руками
                client.from('rating_history')
                    .select('tournament_name, points_earned, recorded_at')
                    .eq('player_id', pid).is('tournament_id', null)
                    .not('category_id', 'is', null)
                    .order('recorded_at', { ascending: false })
            ]);

            var own = results[0].data || [];
            var asPartner = (results[2].data || []).map(function(r) {
                // Заявку подавал капитан: снимать её напарник не может
                r.as_partner = true;
                return r;
            });
            var regs = own.concat(asPartner);
            var tResults = results[1].data || [];
            var resultsMap = {};
            tResults.forEach(function(tr) { resultsMap[tr.tournament_id] = tr; });

            var items = [];
            var seen = {};
            regs.forEach(function(reg) {
                if (!reg.tournament || seen[reg.tournament.id]) return;
                seen[reg.tournament.id] = true;
                var tr = resultsMap[reg.tournament.id];
                items.push({ tournament: reg.tournament, reg: reg, round_reached: tr ? tr.round_reached : null, points_earned: tr ? tr.points_earned : 0 });
            });
            tResults.forEach(function(tr) {
                if (!tr.tournament || seen[tr.tournament_id]) return;
                seen[tr.tournament_id] = true;
                items.push({ tournament: tr.tournament, round_reached: tr.round_reached, points_earned: tr.points_earned });
            });

            // Записи, добавленные админом руками: турнира в базе нет, но очки
            // начислены и игра была. Показываем их названием и очками
            (results[3].data || []).forEach(function(rh) {
                items.push({
                    tournament: { id: '', title: rh.tournament_name, date_start: rh.recorded_at },
                    points_earned: rh.points_earned || 0,
                    manual: true
                });
            });

            // Предстоящие — всё, где турнир ещё не начался, с любым статусом
            // заявки: снятую и отклонённую игрок должен видеть до дня начала,
            // иначе он не поймёт, почему его там нет.
            //
            // Прошедшие — только участие. Раньше сюда падало всё подряд, и
            // турнир, куда игрока не пустили, стоял рядом с сыгранными,
            // как будто он в нём играл.
            var upcoming = items.filter(isUpcoming);
            var played = items.filter(function(i) { return !isUpcoming(i) && didPlay(i); });

            renderUpcomingTournaments(profile, upcoming);
            renderGamesTournaments(container, profile, played);
        } catch(e) {
            console.warn('[KSLT] games tournaments error:', e);
            container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83C\uDFC6</div><div class="db-empty-title">' + L.noTournaments + '</div></div>';
        }
    }

    /** Сколько сыгранных турниров показываем сразу. */
    var GAMES_PAGE = 10;

    /**
     * Постраничный список — один на все подразделы «Моих игр».
     *
     * «Показать все» на сотне строк проблему не решает, а переносит: блок
     * становится длинным, и вернуться к нужному месту нечем. Страницами
     * высота блока постоянна, и до прошлого сезона два нажатия.
     *
     * renderRows получает срез и возвращает разметку. Управление рисуется
     * только когда страниц больше одной.
     */
    function renderPaged(container, items, renderRows, page, afterRender) {
        page = page || 0;
        var pages = Math.ceil(items.length / GAMES_PAGE) || 1;
        if (page >= pages) page = pages - 1;
        var from = page * GAMES_PAGE;

        var html = renderRows(items.slice(from, from + GAMES_PAGE));

        if (pages > 1) {
            html += '<div class="db-pager">';
            html += '<button class="db-pager-btn" data-page="' + (page - 1) + '"' +
                    (page === 0 ? ' disabled' : '') + '>\u2039</button>';
            for (var i = 0; i < pages; i++) {
                html += '<button class="db-pager-btn' + (i === page ? ' active' : '') +
                        '" data-page="' + i + '">' + (i + 1) + '</button>';
            }
            html += '<button class="db-pager-btn" data-page="' + (page + 1) + '"' +
                    (page === pages - 1 ? ' disabled' : '') + '>\u203A</button>';
            html += '</div>';
        }

        container.innerHTML = html;
        // Разметка переписывается на каждой странице, значит и обработчики
        // на строках надо навешивать заново
        if (afterRender) afterRender(container);

        container.querySelectorAll('.db-pager-btn').forEach(function(btn) {
            if (btn.disabled) return;
            btn.addEventListener('click', function() {
                renderPaged(container, items, renderRows, parseInt(btn.dataset.page, 10), afterRender);
            });
        });
    }


    /**
     * Предстоящие турниры.
     *
     * Отдельный блок и первым по счёту: это единственное в «Моих играх», где
     * от игрока что-то требуется — не пропустить и, если передумал, сняться.
     * Когда заявок нет, блок прячется целиком: пустая рамка висела бы девять
     * месяцев в году.
     *
     * Страниц здесь нет намеренно — записаться можно только в турниры с
     * открытой регистрацией, их всегда единицы.
     */
    function renderUpcomingTournaments(profile, upcoming) {
        var body = document.getElementById('dbSubUpcoming');
        var wrap = body && body.parentNode;
        var container = document.getElementById('dbGamesUpcoming');
        if (!container || !wrap) return;

        if (upcoming.length === 0) {
            wrap.style.display = 'none';
            return;
        }
        wrap.style.display = '';

        container.innerHTML =
            '<table class="db-matches-table db-tour-table"><thead><tr>' +
                '<th>' + L.matchDate + '</th>' +
                '<th>' + L.matchTournament + '</th>' +
                '<th>' + L.tourStatus + '</th>' +
                '<th></th>' +
            '</tr></thead><tbody>' +
            upcoming.map(upcomingRow).join('') +
            '</tbody></table>';

        bindWithdraw(container, profile, loadGamesTournaments);
    }

    /** Прошедшие турниры — архив участия, страницами по десять. */
    function renderGamesTournaments(container, profile, played) {
        if (!container) return;

        if (played.length === 0) {
            container.innerHTML = '<div class="db-empty" style="padding:16px 0;">' +
                '<div class="db-empty-icon">\uD83C\uDFC6</div>' +
                '<div class="db-empty-title">' + L.noTournaments + '</div></div>';
            return;
        }

        renderPaged(container, played, function(rows) {
            return '<table class="db-matches-table db-tour-table"><thead><tr>' +
                    '<th>' + L.matchDate + '</th>' +
                    '<th>' + L.matchTournament + '</th>' +
                    '<th>' + L.tourResult + '</th>' +
                    '<th style="text-align:right">' + L.points + '</th>' +
                '</tr></thead><tbody>' +
                rows.map(playedRow).join('') +
                '</tbody></table>';
        }, 0);
    }

    /** Играл ли он в этом турнире на самом деле. */
    function didPlay(item) {
        if (item.round_reached || item.manual) return true;
        var st = item.reg && item.reg.status;
        return st === 'approved' || st === 'draw';
    }

    function tourDate(t) {
        return t && t.date_start
            ? t.date_start.slice(8, 10) + '.' + t.date_start.slice(5, 7) + '.' + t.date_start.slice(2, 4)
            : '';
    }

    function tourNameCell(t) {
        var name = isEn ? (t.title_en || t.title) : (isKg ? (t.title_kg || t.title) : t.title);
        // Записи, добавленные админом руками: турнира с таким названием в базе
        // нет, открывать нечего
        if (!t.id) return '<td class="db-match-tournament">' + escHtml(name) + '</td>';
        var page = 'tournament' + (isEn ? '-en' : isKg ? '-kg' : '') + '.html?id=' + t.id;
        return '<td class="db-match-tournament">' +
            '<a href="' + page + '" class="db-tour-link">' + escHtml(name) + '</a></td>';
    }

    function upcomingRow(item) {
        var reg = item.reg;
        var st = reg && reg.status;
        var label = st === 'withdrawn' ? L.regWithdrawn
            : (st === 'blocked' || st === 'rejected') ? L.regRefusedShort
            : st === 'waitlist' ? L.regWaitlist
            : (isEn ? 'Registered' : isKg ? 'Катталган' : 'Зарегистрирован');
        var cls = (st === 'withdrawn' || st === 'blocked' || st === 'rejected')
            ? ' db-tour-status-off' : '';

        var action = '';
        if (canWithdraw(item)) {
            action = '<button class="db-withdraw-btn" data-reg="' + reg.id +
                '" data-name="' + escHtml(item.tournament.title || '') + '">' + L.regWithdraw + '</button>';
        } else if (canReenter(item)) {
            action = '<button class="db-withdraw-btn db-reenter-btn" data-tid="' +
                escHtml(item.tournament.id) + '">' + L.regAgain + '</button>';
        }

        return '<tr>' +
            '<td class="db-match-date">' + tourDate(item.tournament) + '</td>' +
            tourNameCell(item.tournament) +
            '<td class="db-tour-status' + cls + '">' + label + '</td>' +
            '<td style="text-align:right">' + action + '</td>' +
        '</tr>';
    }

    function playedRow(item) {
        // Турнир кончился, а результаты не внесли: игрок в нём был, и молча
        // терять запись нельзя
        var result = item.round_reached
            ? (ROUND_LABELS_DB[item.round_reached] || item.round_reached)
            : (item.manual ? (isEn ? 'Participated' : isKg ? 'Катышкан' : 'Участвовал')
                           : L.tourNoResults);
        var isWinner = item.round_reached === 'W';
        var pts = item.points_earned > 0 ? '+' + item.points_earned : '';

        return '<tr>' +
            '<td class="db-match-date">' + tourDate(item.tournament) + '</td>' +
            tourNameCell(item.tournament) +
            '<td class="db-tour-status' + (isWinner ? ' db-tournament-winner' : '') + '">' +
                escHtml(result) + '</td>' +
            '<td class="db-tour-pts">' + pts + '</td>' +
        '</tr>';
    }

    // ---- Score utils ----
    /**
     * \u0414\u0430\u0442\u0430 \u043c\u0430\u0442\u0447\u0430 \u043f\u043e \u0431\u0438\u0448\u043a\u0435\u043a\u0441\u043a\u043e\u043c\u0443 \u0432\u0440\u0435\u043c\u0435\u043d\u0438.
     *
     * \u0412 \u0431\u0430\u0437\u0435 \u043c\u043e\u043c\u0435\u043d\u0442 \u043c\u0430\u0442\u0447\u0430 \u0445\u0440\u0430\u043d\u0438\u0442\u0441\u044f \u0441 \u0447\u0430\u0441\u043e\u0432\u044b\u043c \u043f\u043e\u044f\u0441\u043e\u043c, \u0438 \u0431\u0440\u0430\u0443\u0437\u0435\u0440 \u043f\u043e \u0443\u043c\u043e\u043b\u0447\u0430\u043d\u0438\u044e
     * \u043f\u0435\u0440\u0435\u0432\u043e\u0434\u0438\u0442 \u0435\u0433\u043e \u0432 \u0441\u0432\u043e\u0439. \u041c\u0430\u0442\u0447 16 \u043c\u0430\u0440\u0442\u0430 00:30 \u043f\u043e \u0411\u0438\u0448\u043a\u0435\u043a\u0443 \u0443 \u0438\u0433\u0440\u043e\u043a\u0430 \u0432 \u043f\u043e\u0435\u0437\u0434\u043a\u0435
     * \u0440\u0438\u0441\u043e\u0432\u0430\u043b\u0441\u044f \u0432\u0447\u0435\u0440\u0430\u0448\u043d\u0438\u043c \u0447\u0438\u0441\u043b\u043e\u043c, \u0445\u043e\u0442\u044f \u0434\u0430\u0442\u0430 \u0442\u0443\u0440\u043d\u0438\u0440\u0430 \u0440\u044f\u0434\u043e\u043c \u043d\u0435 \u0441\u0434\u0432\u0438\u0433\u0430\u043b\u0430\u0441\u044c \u2014
     * \u043e\u043d\u0430 \u043e\u0431\u044b\u0447\u043d\u0430\u044f \u0434\u0430\u0442\u0430 \u0431\u0435\u0437 \u0432\u0440\u0435\u043c\u0435\u043d\u0438. \u0418\u0433\u0440\u0430\u0435\u043c \u043c\u044b \u0432 \u0411\u0438\u0448\u043a\u0435\u043a\u0435, \u0435\u0433\u043e \u0438 \u043f\u043e\u043a\u0430\u0437\u044b\u0432\u0430\u0435\u043c.
     */
    var DB_TZ = 'Asia/Bishkek';

    function dbFormatDate(dateStr) {
        if (!dateStr) return '\u2014';
        try {
            var d = new Date(dateStr);
            if (isNaN(d.getTime())) return '\u2014';
            var parts = {};
            new Intl.DateTimeFormat('en-GB', {
                timeZone: DB_TZ, day: '2-digit', month: '2-digit', year: '2-digit'
            }).formatToParts(d).forEach(function(p) { parts[p.type] = p.value; });
            return isEn
                ? parts.month + '/' + parts.day + '/' + parts.year
                : parts.day + '.' + parts.month + '.' + parts.year;
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
        noMatches: 'Бетме-бет матчтар жок', notMet: 'Азырынча беттешкен жок', loading: 'Жүктөлүүдө...',
        matchesLabel: ' матч'
    } : isEn ? {
        setsWon: 'Sets won', gamesWon: 'Games won',
        last5: 'Last 5 matches', fullProfile: 'Open full profile',
        noMatches: 'No head-to-head matches found', notMet: 'Haven\u2019t met yet', loading: 'Loading...',
        matchesLabel: ' matches'
    } : {
        setsWon: 'Выигранные сеты', gamesWon: 'Выигранные геймы',
        last5: 'Последние 5 матчей', fullProfile: 'Открыть полный профиль',
        noMatches: 'Матчей между игроками не найдено', notMet: 'Ещё не встречались', loading: 'Загрузка...',
        matchesLabel: ' матчей'
    };

    // ---- Games: Matches subsection ----
    var _matchesOpponents = {}; // cache: oppId → { name, photo }

    /** Сколько матчей показываем сразу; остальные — по кнопке. */

    /** tournament_id → напарник капитана в этом турнире. */
    var _matchPairs = {};

    function isDoubles(t) {
        return !!t && (t.format === 'doubles' || t.format === 'mixed_doubles');
    }

    /**
     * Какого рода этот матч.
     *
     * В истории лежит всё вперемешку, и без метки человек не понимает, почему
     * матчей одиннадцать, а побед в статистике четыре. Метка отвечает на это
     * прямо у строки: в зачёт идёт только «рейтинг».
     *
     * Дуэль в базе — это баттл: счёт вводится в админке лишь у опубликованных
     * баттлов, другого пути к match_type = 'duel' нет.
     */
    function matchKind(m) {
        if (m.match_type === 'duel') return 'battle';
        var t = m.tournament;
        if (t) {
            if (t.format === 'mixed_doubles') return 'mixed';
            if (t.format === 'doubles') return 'doubles';
            if (t.category_id === 'friendly') return 'friendly';
        }
        return 'rating';
    }

    var KIND_LABEL = {
        rating: 'tagRating', friendly: 'tagFriendly',
        doubles: 'tagDoubles', mixed: 'tagMixed', battle: 'tagBattle'
    };

    function matchKindTag(m) {
        var kind = matchKind(m);
        return '<span class="db-match-tag db-tag-' + kind + '">' + escHtml(L[KIND_LABEL[kind]]) + '</span>';
    }

    /**
     * Турниры, где игрок заявлен напарником.
     *
     * В матче помещаются только двое: player1_id и player2_id — это капитаны
     * пар. Напарник в матче не упомянут вовсе, и своих парных игр он в
     * кабинете не видел. Пару восстанавливаем по заявке: она знает и
     * капитана, и напарника.
     *
     * Возвращает { tournament_id: capitan_id }.
     */
    async function loadPartnerTournaments(pid) {
        var out = {};
        var res = await client.from('tournament_registrations')
            .select('tournament_id, player_id')
            .eq('partner_id', pid)
            .in('status', ['approved', 'draw']);
        (res.data || []).forEach(function(r) {
            if (r.tournament_id && r.player_id) out[r.tournament_id] = r.player_id;
        });
        return out;
    }

    /**
     * Страница матчей игрока — своих и тех, где он напарник.
     *
     * Здесь всё, что человек сыграл: рейтинговые и дружеские турниры, парные,
     * микст и баттлы. История — это память о сыгранном, а не выписка из
     * рейтинга; что из этого идёт в зачёт, говорит метка у названия.
     *
     * В зачёт (победы, поражения, форма) идут только рейтинговые одиночные —
     * это считает база, в recalc_player_categories.
     *
     * count: 'exact' нужен, чтобы кнопка «Показать все» называла настоящее
     * число, а не число загруженных.
     */
    function fetchMatchesPage(pid, from, to, myCaptains) {
        var conds = ['player1_id.eq.' + pid, 'player2_id.eq.' + pid];
        Object.keys(myCaptains || {}).forEach(function(tid) {
            var cap = myCaptains[tid];
            conds.push('and(tournament_id.eq.' + tid + ',player1_id.eq.' + cap + ')');
            conds.push('and(tournament_id.eq.' + tid + ',player2_id.eq.' + cap + ')');
        });

        return client.from('matches')
            .select('*, tournament:tournaments(id, title, title_en, title_kg, draw_size, format, category_id)',
                { count: 'exact' })
            .or(conds.join(','))
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .range(from, to);
    }

    /**
     * Составы пар в парных баттлах.
     *
     * У баттла нет заявки на турнир, поэтому состав пары лежит в самом
     * вызове. Без него парный баттл в истории выглядел игрой один на один:
     * соперник без напарника, а строка «в паре с» пустая.
     *
     * Ключ — идентификатор матча: именно им вызов на матч и ссылается.
     */
    var _battlePairs = {};

    async function cacheBattlePairs(matches) {
        var ids = [];
        matches.forEach(function(m) {
            if (m.match_type === 'duel' && m.id && !_battlePairs[m.id] && ids.indexOf(m.id) === -1) {
                ids.push(m.id);
            }
        });
        if (ids.length === 0) return;

        var res = await client.from('challenges')
            .select('match_id, format, challenger_player_id, opponent_player_id, ' +
                    'challenger_partner_id, opponent_partner_id, ' +
                    'challenger_partner_name, opponent_partner_name')
            .in('match_id', ids);

        // Отмечаем все запрошенные, даже пустые: иначе одиночные баттлы
        // будут спрашиваться заново при каждой подгрузке страницы
        ids.forEach(function(id) { _battlePairs[id] = null; });
        (res.data || []).forEach(function(c) {
            if (!c.match_id || !c.format || c.format === 'singles') return;
            _battlePairs[c.match_id] = c;
        });
    }

    /** Составы пар в парных турнирах: без них соперник выглядит одиночкой. */
    async function cachePairs(matches) {
        var tIds = [];
        matches.forEach(function(m) {
            var tid = m.tournament_id;
            if (isDoubles(m.tournament) && tid && !_matchPairs[tid] && tIds.indexOf(tid) === -1) {
                tIds.push(tid);
            }
        });
        if (tIds.length === 0) return;

        var res = await client.from('tournament_registrations')
            .select('tournament_id, player_id, partner_id, partner_external_name')
            .in('tournament_id', tIds);
        tIds.forEach(function(tid) { _matchPairs[tid] = {}; });
        (res.data || []).forEach(function(r) {
            if (!_matchPairs[r.tournament_id] || !r.player_id) return;
            _matchPairs[r.tournament_id][r.player_id] = {
                id: r.partner_id || '',
                external: r.partner_external_name || ''
            };
        });
    }

    /**
     * Напарник в парном баттле — по капитану стороны.
     *
     * Гость баттла в базе игроков не заведён: у него есть только имя,
     * записанное в самом вызове, и фото взять неоткуда.
     */
    function battleMate(c, capId) {
        var mateId, mateExt;
        if (capId === c.challenger_player_id) {
            mateId = c.challenger_partner_id; mateExt = c.challenger_partner_name;
        } else if (capId === c.opponent_player_id) {
            mateId = c.opponent_partner_id; mateExt = c.opponent_partner_name;
        } else {
            return null;
        }
        if (mateId && _matchesOpponents[mateId]) return _matchesOpponents[mateId];
        if (mateExt) return { name: mateExt, photo: '' };
        return null;
    }

    /**
     * Напарник капитана в конкретном турнире: имя и фото.
     *
     * Напарник может быть не из клуба — тогда в заявке от него осталось
     * только вписанное имя, и фото взять неоткуда.
     */
    function partnerInfo(tid, captainId) {
        var pair = _matchPairs[tid] && _matchPairs[tid][captainId];
        if (!pair) return null;
        if (pair.id && _matchesOpponents[pair.id]) {
            return { name: _matchesOpponents[pair.id].name, photo: _matchesOpponents[pair.id].photo };
        }
        if (pair.external) return { name: pair.external, photo: '' };
        return null;
    }

    /**
     * Инициалы для кружка вместо фотографии.
     *
     * Две буквы, не одна: по одной букве однофамильцы и тёзки сливаются, а
     * в паре два кружка выглядели бы одинаково. Больше двух в кружок не
     * влезает, поэтому у длинных имён берём первое и последнее слово.
     */
    function dbInitials(name) {
        var words = String(name || '').trim().split(/\s+/).filter(Boolean);
        if (words.length === 0) return '?';
        if (words.length === 1) return words[0].charAt(0).toUpperCase();
        return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
    }

    /** Кружок игрока: фото, а без него — инициалы. */
    /**
     * Имя соперника ссылкой на его страницу.
     *
     * Карточка игрока открыта всем, и соперник в таблице — первое, куда
     * человек хочет ткнуть: посмотреть, кому проиграл. Раньше это был
     * простой текст, и приходилось идти в рейтинг и искать по фамилии.
     */
    function playerLink(playerId, name) {
        if (!playerId) return escHtml(name);
        var page = 'player' + (isEn ? '-en' : isKg ? '-kg' : '') + '.html?id=' + encodeURIComponent(playerId);
        return '<a href="' + page + '" class="db-opp-link">' + escHtml(name) + '</a>';
    }

    function matchAvatar(name, photo, extraClass) {
        var cls = 'db-match-avatar' + (extraClass ? ' ' + extraClass : '');
        return photo
            ? '<img src="' + escHtml(photo) + '" alt="" class="' + cls + '">'
            : '<div class="' + cls + ' db-match-avatar-ph">' + escHtml(dbInitials(name)) + '</div>';
    }

    /** Имена и фото соперников — одним запросом на всю пачку матчей. */
    async function cacheOpponents(matches, pid) {
        var ids = [];
        function want(id) {
            if (id && !_matchesOpponents[id] && ids.indexOf(id) === -1) ids.push(id);
        }
        matches.forEach(function(m) {
            want(m.player1_id);
            want(m.player2_id);
            var bp = _battlePairs[m.id];
            if (bp) {
                want(bp.challenger_partner_id);
                want(bp.opponent_partner_id);
            }
            var pairs = _matchPairs[m.tournament_id];
            if (pairs) {
                [m.player1_id, m.player2_id].forEach(function(cap) {
                    if (pairs[cap] && pairs[cap].id) want(pairs[cap].id);
                });
            }
        });
        if (ids.length === 0) return;

        var oppRes = await client.from('players')
            .select('id, name, name_en, name_kg, photo')
            .in('id', ids);
        (oppRes.data || []).forEach(function(p) {
            _matchesOpponents[p.id] = {
                name: isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name),
                photo: p.photo || ''
            };
        });
    }

    async function loadGamesMatches(profile) {
        var container = document.getElementById('dbGamesMatches');
        if (!container || !profile || !profile.player_id || !client) {
            if (container) container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\u2694\uFE0F</div><div class="db-empty-title">' + L.noMatches + '</div><div class="db-empty-text">' + L.noMatchesText + '</div></div>';
            return;
        }

        try {
            var pid = profile.player_id;
            var myCaptains = await loadPartnerTournaments(pid);
            // Берём всё сразу: список листается страницами на месте, а
            // догрузка по частям заставляла бы ходить в базу на каждый
            // переход. Даже у самого играющего человека это сотня строк
            var res = await fetchMatchesPage(pid, 0, 999, myCaptains);

            if (res.error || !res.data || res.data.length === 0) {
                container.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\u2694\uFE0F</div><div class="db-empty-title">' + L.noMatches + '</div><div class="db-empty-text">' + L.noMatchesText + '</div></div>';
                return;
            }

            await cachePairs(res.data);
            await cacheBattlePairs(res.data);
            await cacheOpponents(res.data, pid);
            renderGamesMatchesList(container, res.data, pid, profile, myCaptains);
        } catch(e) {
            console.warn('[KSLT] games matches error:', e);
        }
    }

    /**
     * Раунд матча.
     *
     * Колонка round в базе заполнена: R1, SF, F, 3RD, GS_*. Раньше её читали
     * только ради двух особых случаев, а остальное считали из номера раунда и
     * размера сетки — и совпадало это лишь пока draw_size проставлен. Где он
     * пуст, подставлялась сетка на 16, и четвертьфинал показывался как R16.
     * Теперь запись из базы главнее, а вычисление осталось запасным.
     */
    function getRoundLabel(m) {
        if (m.round) {
            if (m.round === '3RD') return '3rd';
            if (m.round.indexOf('GS_') === 0) return 'GS';
            return m.round;
        }
        var rn = m.round_number;
        if (!rn) return '';
        var ds = (m.tournament && m.tournament.draw_size) ? m.tournament.draw_size : 0;
        var totalRounds = ds > 1 ? Math.log2(ds) : 0;
        // Нецелое число раундов — сетка не степень двойки, вычислять нечего
        if (!totalRounds || totalRounds % 1 !== 0) return 'R' + rn;
        var fromEnd = totalRounds - rn;
        if (fromEnd === 0) return 'F';
        if (fromEnd === 1) return 'SF';
        if (fromEnd === 2) return 'QF';
        if (fromEnd === 3) return 'R16';
        if (fromEnd === 4) return 'R32';
        return 'R' + rn;
    }

    /** Таблица матчей — страницами по десять, как и остальные подразделы. */
    function renderGamesMatchesList(container, matches, pid, profile, myCaptains) {
        myCaptains = myCaptains || {};

        renderPaged(container, matches, function(rows) {
            var html = '<table class="db-matches-table"><thead><tr>';
            html += '<th>' + L.matchDate + '</th>';
            html += '<th>' + L.matchOpponent + '</th>';
            html += '<th style="text-align:center">' + L.matchScore + '</th>';
            html += '<th style="text-align:center">' + L.matchResult + '</th>';
            html += '<th>' + L.matchTournament + '</th>';
            html += '<th style="text-align:center">' + L.matchRound + '</th>';
            html += '<th style="text-align:center">H2H</th>';
            html += '</tr></thead><tbody>';
            rows.forEach(function(m) {
                // В парном турнире в матче записаны капитаны пар. Своей может
                // быть та сторона, где стоит не сам игрок, а его капитан
                var myCap = myCaptains[m.tournament_id];
                var mineIsP1 = m.player1_id === pid ||
                    (m.player2_id !== pid && !!myCap && m.player1_id === myCap);

                var oppId = mineIsP1 ? m.player2_id : m.player1_id;
                var opp = _matchesOpponents[oppId] || { name: oppId, photo: '' };
                var isWin = m.winner_id === (mineIsP1 ? m.player1_id : m.player2_id);
                var score = m.score || '';
                var displayScore = mineIsP1 ? dbFormatScore(score) : dbFormatScore(dbFlipScore(score));

                // Пара бывает и в турнире, и в баттле. В турнире состав знает
                // заявка, в баттле — сам вызов
                var battlePair = _battlePairs[m.id] || null;
                var dbl = isDoubles(m.tournament) || !!battlePair;
                var oppMate = battlePair
                    ? battleMate(battlePair, oppId)
                    : (dbl ? partnerInfo(m.tournament_id, oppId) : null);
                // У пары два имени, и в узкой колонке через косую черту они
                // ломались на три строки. Даём по имени на строку — под два кружка
                var oppTitle = oppMate
                    ? '<span class="db-match-pair"><span>' + playerLink(oppId, opp.name) + '</span>' +
                      '<span>' + escHtml(oppMate.name) + '</span></span>'
                    : '<span>' + playerLink(oppId, opp.name) + '</span>';

                // С кем игрок был в паре. Своя половина пары в матче не записана:
                // если он капитан — напарника берём из заявки, если напарник —
                // его парой был капитан, стоящий в матче
                var myMate = '';
                if (battlePair) {
                    var mySide = mineIsP1 ? m.player1_id : m.player2_id;
                    var mineB = mySide === pid
                        ? battleMate(battlePair, pid)
                        : _matchesOpponents[mySide];
                    myMate = mineB ? mineB.name : '';
                } else if (dbl) {
                    var mySideCap = mineIsP1 ? m.player1_id : m.player2_id;
                    var mine = mySideCap === pid
                        ? partnerInfo(m.tournament_id, pid)
                        : _matchesOpponents[mySideCap];
                    myMate = mine ? mine.name : '';
                }

                var tName = '';
                if (m.tournament) {
                    tName = isEn ? (m.tournament.title_en || m.tournament.title) : (isKg ? (m.tournament.title_kg || m.tournament.title) : m.tournament.title);
                }
                var roundLabel = getRoundLabel(m);

                var dateStr = dbFormatDate(m.played_at || m.created_at);
                var resultCls = isWin ? 'win' : 'loss';
                var resultLabel = isWin ? 'W' : 'L';

                // У пары кружков два, внахлёст: одно фото на двоих обманывало —
                // имени рядом стояло два
                var avatarHtml = matchAvatar(opp.name, opp.photo);
                if (oppMate) {
                    avatarHtml = '<div class="db-match-avatars">' + avatarHtml +
                        matchAvatar(oppMate.name, oppMate.photo, 'db-match-avatar-2nd') + '</div>';
                }

                html += '<tr>';
                html += '<td class="db-match-date">' + dateStr + '</td>';
                html += '<td><div class="db-match-opponent">' + avatarHtml + oppTitle + '</div></td>';
                html += '<td class="db-match-score">' + displayScore + '</td>';
                html += '<td class="db-match-result-cell"><span class="db-match-result ' + resultCls + '">' + resultLabel + '</span></td>';
                html += '<td class="db-match-tournament">' +
                    escHtml(tName) + matchKindTag(m) +
                    (myMate ? '<div class="db-match-mate">' + L.matchWith +
                        ' <span class="db-match-mate-name">' + escHtml(myMate) + '</span></div>' : '') +
                    '</td>';
                html += '<td class="db-match-round">' + roundLabel + '</td>';
                // H2H — про личные встречи двоих, у пар состав меняется от турнира
                html += '<td>' + (dbl ? '' :
                    '<button class="db-match-h2h" data-opp-id="' + escHtml(oppId) + '" data-opp-name="' + escHtml(opp.name) + '" data-opp-photo="' + escHtml(opp.photo) + '" title="Head to Head">H2H</button>') +
                    '</td>';
                html += '</tr>';
            });
            return html + '</tbody></table>';
        }, 0, function(root) {
            bindH2HButtons(root, pid, profile);
        });
    }

    /**
     * Принять, отклонить, отозвать.
     *
     * Все три ответа идут через функции базы: правило «отвечает только
     * адресат» должно жить там, а не в кнопке. Список к моменту нажатия мог
     * устареть — на этот случай база отвечает «already_answered», и мы
     * говорим об этом прямо, а не молчим.
     */
    function bindChallengeActions(root, profile) {
        if (!root || !client) return;

        function act(btn, run, tellAuthor) {
            btn.disabled = true;
            var was = btn.textContent;
            btn.textContent = L.saving;
            run().then(function(res) {
                var err = (res.error && res.error.message) || (res.data && res.data.error);
                if (err) {
                    // Коды базы человеку ничего не говорят: вызов мог быть
                    // отвечен с другого устройства, просрочен или удалён
                    showMessage(null, chalErrText(err), true);
                    btn.disabled = false;
                    btn.textContent = was;
                    loadGamesBattles(profile);
                    return;
                }
                // Автору сообщаем только про ответ на его вызов. При
                // отзыве автор — сам нажимающий, ему сообщать нечего
                if (tellAuthor) notifyChallengeAuthor(btn.dataset.id);
                announceChallengeAnswered();
            }).catch(function(e) {
                console.warn('[KSLT] challenge action:', e);
                btn.disabled = false;
                btn.textContent = was;
            });
        }

        root.querySelectorAll('.db-chal-yes').forEach(function(b) {
            b.addEventListener('click', function() {
                act(b, function() {
                    return client.rpc('respond_to_challenge', { p_id: b.dataset.id, p_accept: true });
                }, true);
            });
        });
        root.querySelectorAll('.db-chal-no').forEach(function(b) {
            b.addEventListener('click', function() {
                act(b, function() {
                    return client.rpc('respond_to_challenge', { p_id: b.dataset.id, p_accept: false });
                }, true);
            });
        });
        root.querySelectorAll('.db-chal-off').forEach(function(b) {
            b.addEventListener('click', function() {
                act(b, function() {
                    return client.rpc('cancel_challenge', { p_id: b.dataset.id });
                });
            });
        });
    }

    /** Вызов уже отвеченный — вместо кнопок строка с исходом. */
    async function checkChallengeOpen(n, modal) {
        if (!client || !modal || !modal.el) return;
        try {
            var res = await client.from('challenges')
                .select('status, expires_at').eq('id', n.action_id).single();
            var st = res.data && res.data.status;
            var alive = st === 'active' &&
                (!res.data.expires_at || new Date(res.data.expires_at) > new Date());
            if (alive) return;

            var box = modal.el.querySelector('.db-modal-actions');
            if (!box) return;

            // Исход — значком, теми же цветами, что и в таблице «Баттлы»:
            // серая строчка внизу выглядела остатком, а не ответом
            var label = !st ? L.chalGone
                : st === 'accepted' ? L.chalYouAccepted
                : st === 'declined' ? L.chalYouDeclined
                : st === 'cancelled' ? L.chalCancelledByOpp
                : st === 'completed' ? L.chalCompleted
                : L.chalExpired;
            var cls = (st === 'accepted' || st === 'completed') ? 'accepted' : 'declined';
            box.outerHTML = '<div class="db-modal-answered">' +
                '<span class="db-status-badge db-invite-' + cls + '">' + escHtml(label) + '</span>' +
            '</div>';
        } catch(e) { /* не смогли спросить — кнопки останутся, база всё равно откажет */ }
    }

    /**
     * Сообщить автору вызова, что ему ответили.
     *
     * В колокольчик уведомление кладёт сама база, вместе со сменой статуса.
     * Сюда вынесено только то, до чего база не дотягивается: личное
     * сообщение в Telegram и письмо.
     */
    function notifyChallengeAuthor(challengeId) {
        if (!client || !window.SUPABASE_URL) return;
        client.auth.getSession().then(function(sRes) {
            var token = sRes.data.session ? sRes.data.session.access_token : '';
            return fetch(window.SUPABASE_URL + '/functions/v1/challenge-notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': window.SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ challenge_id: challengeId })
            });
        }).then(function(r) { return r.json(); }).then(function(d) {
            if (!d || d.error) console.warn('[KSLT] challenge-notify:', d);
        }).catch(function(e) { console.warn('[KSLT] challenge-notify:', e); });
    }

    /** Коды отказа от базы — по-человечески. */
    function chalErrText(err) {
        if (err === 'already_answered' || err === 'expired') return L.chalActionDone;
        if (err === 'not_found') return L.chalGone;
        if (err === 'forbidden') return L.chalActionDone;
        return err;
    }

    /** Кнопки H2H одинаковы в турнирной таблице и в списке баттлов. */
    function bindH2HButtons(root, pid, profile) {
        if (!root || !pid) return;
        root.querySelectorAll('.db-match-h2h').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showDashboardH2H(pid, profile,
                    btn.getAttribute('data-opp-id'),
                    btn.getAttribute('data-opp-name'),
                    btn.getAttribute('data-opp-photo'));
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
            .select('id, player1_id, player2_id, score, winner_id, played_at, match_type, tournament:tournaments(title, title_en, title_kg, format, category_id)')
            .or('and(player1_id.eq.' + pid + ',player2_id.eq.' + oppId + '),and(player1_id.eq.' + oppId + ',player2_id.eq.' + pid + ')')
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .then(function(res) {
                var modal = overlay.querySelector('.h2h-modal');
                if (!modal) return;
                // Пустая история — не повод прятать окно: «0 — 0» это тоже
                // ответ на вопрос «как мы с ним играли». Пустой вид оставлен
                // только на случай настоящего сбоя запроса
                if (res.error) {
                    renderDashH2HEmpty(overlay);
                    return;
                }
                // Парные и микст сюда не идут: в матче записаны капитаны, а
                // состав пары меняется от турнира к турниру — счёт «трое на
                // трое» получался бы личной встречей двоих
                var personal = (res.data || []).filter(function(m) {
                    var k = matchKind(m);
                    return k !== 'doubles' && k !== 'mixed';
                });
                renderDashH2HContent(modal, personal, pid, profile, oppId, oppName, oppPhoto);
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
        html += '<div class="h2h-matches">';
        html += last5.length
            ? '<div class="h2h-matches-title">' + LH.last5 + '</div>'
            : '<div class="h2h-empty" style="padding:12px 0;">' + LH.notMet + '</div>';
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
            html += '<span class="h2h-match-tournament">' +
                '<span class="h2h-tname">' + escHtml(tName) + '</span>' + matchKindTag(m) + '</span>';
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
    async function loadGamesBattles(profile) {
        var card = document.getElementById('dbGamesBattles');
        if (!card || !client) return;
        var myPlayerId = profile && profile.player_id;

        try {
            var result = await client.rpc('get_my_challenges');
            var items = result.data || [];

            if (!items || items.length === 0) {
                card.innerHTML = '<div class="db-empty" style="padding:16px 0;"><div class="db-empty-icon">\uD83D\uDD25</div><div class="db-empty-title">' + L.chalNoChallenges + '</div><div class="db-empty-text">' + L.chalNoChallengesText + '</div></div>';
                return;
            }

            var chalPage = isEn ? 'challenge-en.html' : (isKg ? 'challenge-kg.html' : 'challenge.html');

            renderPaged(card, items, function(rows) {
                return '<table class="db-matches-table db-battles-table"><thead><tr>' +
                        '<th>' + L.matchDate + '</th>' +
                        '<th>' + L.matchOpponent + '</th>' +
                        '<th style="text-align:center">' + L.matchScore + '</th>' +
                        '<th style="text-align:center">' + L.matchResult + '</th>' +
                        '<th style="text-align:center">' + L.tourStatus + '</th>' +
                        '<th style="text-align:center">H2H</th>' +
                    '</tr></thead><tbody>' +
                    rows.map(battleRow).join('') +
                    '</tbody></table>';
            }, 0, function(root) {
                bindH2HButtons(root, myPlayerId, profile);
                bindChallengeActions(root, profile);
            });
        } catch(e) {
            console.warn('[KSLT] games battles error:', e);
        }

        function battleRow(ch) {
            var isSent = ch.direction === 'sent';
            var partnerName = isSent ? (ch.opponent_name || '\u2014') : (ch.challenger_name || '\u2014');
            var partnerAvatar = isSent ? ch.opponent_avatar : ch.challenger_avatar;

            var statusMap = {
                cancelled: { label: L.chalCancelledByOpp, cls: 'declined' },
                active: { label: L.chalActive, cls: 'pending' },
                negotiating: { label: L.chalNegotiating, cls: 'pending' },
                countered: { label: L.chalCountered, cls: 'pending' },
                accepted: { label: L.chalAccepted, cls: 'accepted' },
                declined: { label: L.chalDeclined, cls: 'declined' },
                expired: { label: L.chalExpired, cls: 'declined' },
                completed: { label: L.chalCompleted, cls: 'accepted' }
            };
            var st = statusMap[ch.status] || { label: ch.status, cls: 'pending' };

            // В столбце — когда вызов отправлен: эта дата есть всегда.
            // Дата самой игры появляется только после того, как менеджер
            // опубликует баттл, и живёт отдельной строкой ниже — иначе в
            // одном столбце оказались бы два разных смысла, а до публикации
            // он просто пустовал (читалась ещё и counter_date, которой
            // миграция больше не оставила)
            // В столбце — дата матча. Её задаёт менеджер при публикации
            // баттла, до этого её просто нет. Дата самого вызова живёт
            // строкой ниже: два разных смысла в одном столбце на глаз не
            // различить
            var dateStr = '';
            if (ch.proposed_date) {
                var pd = String(ch.proposed_date);
                dateStr = pd.slice(8, 10) + '.' + pd.slice(5, 7) + '.' + pd.slice(2, 4);
            }

            var sentStr = '';
            if (ch.created_at) {
                var d = String(ch.created_at);
                sentStr = d.slice(8, 10) + '.' + d.slice(5, 7) + '.' + d.slice(2, 4);
            }

            // Счёт сам по себе не говорит, чей он: победителя показываем
            // тем же значком, что и в матчах
            var myPid = isSent ? ch.challenger_player_id : ch.opponent_player_id;
            var outcome = '';
            if (ch.match_winner_id && myPid) {
                var won = ch.match_winner_id === myPid;
                outcome = '<span class="db-match-result ' + (won ? 'win' : 'loss') + '">' +
                    (won ? 'W' : 'L') + '</span>';
            }

            // Баттл — тот же вызов, только опубликованный на сайте
            // Сообщение — единственное, что человек пишет при вызове.
            // В строке его не было вовсе: приходилось искать в уведомлении
            // Направление: в таблице его не осталось вовсе, и понять,
            // сам ты вызвал или тебя, можно было только по кнопке «Отозвать»
            // Направление и дата вызова — одной строкой: порознь строка
            // вырастала до четырёх этажей и съедала экран
            var sub = '<div class="db-match-mate db-chal-dir">' +
                (isSent ? '\u2197 ' + L.chalDirSent : '\u2199 ' + L.chalDirGot) +
                (sentStr ? ' \u00B7 ' + sentStr : '') + '</div>';
            if (ch.message) {
                sub += '<div class="db-match-mate db-chal-msg">\u00AB' + escHtml(ch.message) + '\u00BB</div>';
            }
            if (ch.battle_published) {
                sub += '<a class="db-match-mate db-battle-link" href="' + chalPage +
                    '?id=' + escHtml(ch.id) + '&from=battles">\uD83D\uDD25 ' +
                    escHtml(ch.battle_title || L.chalBattle) + '</a>';
            }

            // Где играем — появляется вместе с публикацией баттла
            var place = ch.court_name || ch.proposed_venue || '';
            if (place) {
                sub += '<div class="db-match-mate">\uD83D\uDCCD ' + escHtml(place) + '</div>';
            }


            // Безличные «Принят» и «Отклонён» не говорят, кто именно ответил,
            // а в списке лежат обе стороны — и свои вызовы, и чужие
            if (ch.status === 'cancelled' && isSent) {
                st = { label: L.chalCancelledBySelf, cls: 'declined' };
            }

            var oppPid = isSent ? ch.opponent_player_id : ch.challenger_player_id;
            // Кнопка активна всегда, а не только у сыгранного баттла: личные
            // встречи существуют независимо от того, чем кончился этот вызов,
            // а если их не было — окно честно покажет 0 — 0
            var h2h = (myPlayerId && oppPid)
                ? '<button class="db-match-h2h" data-opp-id="' + escHtml(oppPid) +
                  '" data-opp-name="' + escHtml(partnerName) +
                  '" data-opp-photo="' + escHtml(partnerAvatar || '') + '" title="Head to Head">H2H</button>'
                : '';

            // Ответ на вызов живёт здесь и в колокольчике. Раньше он жил
            // только в Telegram, и на сайте кнопок не было вовсе
            var waiting = ch.status === 'active' &&
                (!ch.expires_at || new Date(ch.expires_at) > new Date());
            var actions = '';
            if (waiting && !isSent) {
                actions = '<button class="db-chal-btn db-chal-yes" data-id="' + escHtml(ch.id) + '">' +
                        L.chalAccept + '</button>' +
                    '<button class="db-chal-btn db-chal-no" data-id="' + escHtml(ch.id) + '">' +
                        L.chalDecline + '</button>';
            } else if (waiting && isSent) {
                actions = '<button class="db-chal-btn db-chal-off" data-id="' + escHtml(ch.id) + '">' +
                    L.chalCancel + '</button>';
            }

            return '<tr>' +
                '<td class="db-match-date">' + dateStr + '</td>' +
                '<td><div class="db-match-opponent">' +
                    matchAvatar(partnerName, partnerAvatar) +
                    '<span>' + playerLink(oppPid, partnerName) + sub + '</span>' +
                '</div></td>' +
                '<td class="db-match-score">' + escHtml(ch.match_score || '') + '</td>' +
                '<td class="db-match-result-cell">' + outcome + '</td>' +
                '<td style="text-align:center">' + (actions
                    ? '<div class="db-chal-actions">' + actions + '</div>'
                    : '<span class="db-status-badge db-invite-' + st.cls + '">' + st.label + '</span>') + '</td>' +
                '<td style="text-align:center">' + h2h + '</td>' +
            '</tr>';
        }
    }

    async function loadBadgeProgress(playerId) {
        var out = {};
        try {
            var res = await Promise.all([
                client.from('matches')
                    .select('id', { count: 'exact', head: true })
                    .or('player1_id.eq.' + playerId + ',player2_id.eq.' + playerId)
                    .eq('status', 'completed').not('winner_id', 'is', null),
                client.from('tournament_registrations')
                    .select('tournament_id', { count: 'exact', head: true })
                    .eq('player_id', playerId).in('status', ['approved', 'draw']),
                client.from('players').select('wins, form').eq('id', playerId).single()
            ]);

            out.matches_played = res[0].count || 0;
            out.tournaments_played = res[1].count || 0;

            var plr = res[2].data || {};
            out.wins = plr.wins || 0;

            var streak = 0;
            (plr.form || []).some(function(r) {
                if (r !== 'W') return true;
                streak++;
                return false;
            });
            out.streak = streak;
        } catch(e) {
            console.warn('[KSLT] badge progress error:', e);
        }
        return out;
    }

    /**
     * Раздел «Уведомления».
     *
     * Колокольчик в шапке показывает последние двадцать и годится, чтобы
     * заметить новое. Вернуться к сообщению недельной давности через него
     * нельзя — для этого раздел здесь.
     */
    async function renderNotifications(user) {
        var container = document.getElementById('db-notifications');
        if (!container || !client || !user) return;

        container.innerHTML = '<h2 class="db-section-title">' + L.notificationsTab + '</h2>' +
            '<div class="db-card"><p class="db-subsection-loading">' + L.loadingList + '</p></div>';

        try {
            var res = await client.from('notification_log')
                // action_* нужны окну: по ним оно рисует «Принять» и
                // «Отклонить». Без них уведомление о вызове открывалось
                // просто текстом, и ответить из кабинета было нечем
                .select('id, type, title, message, is_read, created_at, action_type, action_id')
                .eq('profile_id', user.id)
                .order('created_at', { ascending: false })
                .limit(100);

            var items = res.data || [];
            if (items.length === 0) {
                container.innerHTML = '<h2 class="db-section-title">' + L.notificationsTab + '</h2>' +
                    '<div class="db-card"><div class="db-empty">' +
                        '<div class="db-empty-icon">\uD83D\uDD14</div>' +
                        '<div class="db-empty-title">' + L.notifEmpty + '</div>' +
                        '<div class="db-empty-text">' + L.notifEmptyText + '</div>' +
                    '</div></div>';
                return;
            }

            // Значок по виду уведомления: список из одинаковых строк читается
            // хуже, а тип подсказывает, о чём речь, ещё до текста
            var ICONS = {
                // Знак — по типу уведомления, а не буквой в тексте: сменить
                // его так можно одной строкой, не трогая ни функцию, ни
                // уже разосланные записи
                tournament: '\uD83C\uDFC6', challenge: '\uD83D\uDD25', match: '\uD83C\uDFBE',
                payment: '\uD83D\uDCB3', membership: '\uD83D\uDC9A', system: '\uD83D\uDD14'
            };

            var unreadCount = items.filter(function(n) { return !n.is_read; }).length;
            var allReadLabel = isEn ? 'Mark all as read' : (isKg ? 'Баарын окулду деп белгилөө' : 'Отметить все прочитанными');

            // Таблица, как в «Моих играх»: дата слева, фильтры сверху,
            // страницы по десять. Раздел жил своей вёрсткой — карточками с
            // датой справа, — и выглядел чужим среди остальных
            var TYPES = ['all', 'unread', 'challenge', 'tournament', 'match', 'membership'];
            var typeLabels = {
                all: isEn ? 'All' : (isKg ? 'Баары' : 'Все'),
                unread: isEn ? 'Unread' : (isKg ? 'Окулбаган' : 'Непрочитанные'),
                challenge: L.notifChallenges,
                tournament: L.notifTournaments,
                match: L.notifMatches,
                membership: L.notifMembership
            };
            var have = {};
            items.forEach(function(n) { have[n.type] = true; });

            var chips = TYPES.filter(function(t) {
                return t === 'all' || (t === 'unread' ? unreadCount > 0 : have[t]);
            });

            function pick(list, f) {
                if (f === 'all') return list;
                if (f === 'unread') return list.filter(function(n) { return !n.is_read; });
                return list.filter(function(n) { return n.type === f; });
            }

            function notifRow(n) {
                return '<tr class="db-notif-row' + (n.is_read ? '' : ' unread') + '" data-id="' +
                        escHtml(n.id) + '">' +
                    '<td class="db-match-date">' + dbFormatDate(n.created_at) + '</td>' +
                    '<td class="db-notif-type">' + (ICONS[n.type] || ICONS.system) + '</td>' +
                    '<td>' +
                        '<div class="db-notif-title">' + escHtml(n.title || '') + '</div>' +
                        '<div class="db-notif-msg">' + escHtml(n.message || '') + '</div>' +
                    '</td>' +
                '</tr>';
            }

            var html = '<h2 class="db-section-title">' + L.notificationsTab + '</h2>';
            html += '<div class="db-notif-bar">' +
                '<div class="db-notif-filters">' +
                    chips.map(function(t) {
                        return '<button class="db-chip' + (t === 'all' ? ' active' : '') +
                            '" data-filter="' + t + '">' + typeLabels[t] + '</button>';
                    }).join('') +
                '</div>' +
                (unreadCount > 0
                    ? '<button class="db-notif-all-read" id="dbNotifAllRead">' + allReadLabel + '</button>'
                    : '') +
            '</div>';
            html += '<div id="dbNotifTable"></div>';
            container.innerHTML = html;

            function paint(filter) {
                var box = document.getElementById('dbNotifTable');
                var list = pick(items, filter);
                if (list.length === 0) {
                    box.innerHTML = '<div class="db-empty" style="padding:24px 0;">' +
                        '<div class="db-empty-title">' + L.notifEmpty + '</div></div>';
                    return;
                }
                renderPaged(box, list, function(rows) {
                    return '<table class="db-matches-table db-notif-table"><tbody>' +
                        rows.map(notifRow).join('') + '</tbody></table>';
                }, 0, bindRows);
            }

            container.querySelectorAll('.db-chip').forEach(function(chip) {
                chip.addEventListener('click', function() {
                    container.querySelectorAll('.db-chip').forEach(function(c) {
                        c.classList.toggle('active', c === chip);
                    });
                    paint(chip.dataset.filter);
                });
            });

            paint('all');

            // Открыл уведомление — оно прочитано. Просто зашёл в раздел —
            // ничего не изменилось, как со списком писем
            function bindRows(root) {
            root.querySelectorAll('.db-notif-row').forEach(function(el) {
                el.addEventListener('click', function() {
                    var n = items.filter(function(x) { return x.id === el.dataset.id; })[0];
                    if (!n) return;
                    // У вызова ответ прямо в окне: две кнопки вместо похода
                    // в раздел «Баттлы» за тем же самым
                    // Кнопки рисуются по факту «это вызов», но ответить могли
                    // уже с телефона или из колокольчика. Настоящее состояние
                    // спрашиваем у базы и гасим кнопки, если отвечать нечего
                    var isChal = n.action_type === 'challenge' && n.action_id;
                    var modal = dbModal({
                        title: escHtml(n.title || ''),
                        body: '<p style="line-height:1.5;white-space:pre-wrap;">' + escHtml(n.message || '') + '</p>' +
                              '<p style="margin-top:10px;font-size:0.75rem;color:var(--text-dim);">' +
                              dbFormatDate(n.created_at) + '</p>',
                        actions: isChal ? [
                            { label: L.chalDecline, onClick: function(close) { answerChallenge(n, false, modal, close); } },
                            { label: L.chalAccept, primary: true, onClick: function(close) { answerChallenge(n, true, modal, close); } }
                        ] : null
                    });
                    if (isChal) checkChallengeOpen(n, modal);
                    if (!n.is_read) {
                        n.is_read = true;
                        markOneRead(n.id, el);
                    }
                });
            });
            }

            var allBtn = document.getElementById('dbNotifAllRead');
            if (allBtn) {
                allBtn.addEventListener('click', function() {
                    items.forEach(function(n) { n.is_read = true; });
                    allBtn.style.display = 'none';
                    markAllNotificationsRead(user);
                });
            }
        } catch(e) {
            console.warn('[KSLT] notifications:', e);
        }
    }

    /**
     * Ответ на вызов из окна уведомления.
     *
     * Уведомление — снимок момента: пока оно висело непрочитанным, на вызов
     * могли ответить с телефона или у него вышел срок. Правило живёт в базе,
     * окно только спрашивает и честно передаёт отказ.
     */
    async function answerChallenge(n, accept, modal, close) {
        if (!client) return;
        var btns = modal && modal.el ? modal.el.querySelectorAll('.db-modal-actions button') : [];
        btns.forEach(function(b) { b.disabled = true; });
        try {
            var res = await client.rpc('respond_to_challenge', { p_id: n.action_id, p_accept: accept });
            var err = (res.error && res.error.message) || (res.data && res.data.error);
            if (err) showMessage(null, chalErrText(err), true);
            else notifyChallengeAuthor(n.action_id);
        } catch(e) {
            console.warn('[KSLT] challenge answer:', e);
        }
        if (close) close();
        announceChallengeAnswered();
    }

    /**
     * Об ответе на вызов узнают все разделы разом.
     *
     * Ответить можно из трёх мест — окно уведомления, колокольчик, строка в
     * «Баттлах». Раньше обновлялось только то, откуда нажали: в остальных
     * оставался старый статус до перезагрузки страницы.
     */
    function announceChallengeAnswered() {
        try {
            document.dispatchEvent(new CustomEvent('kslt:challenge-answered'));
        } catch(e) { /* старый браузер — обойдётся без синхронизации */ }
    }

    document.addEventListener('kslt:challenge-answered', function() {
        if (_dashProfile) loadGamesBattles(_dashProfile);
        if (_dashUser) renderNotifications(_dashUser);
    });

    /**
     * Отметить одно уведомление прочитанным.
     *
     * Как в почте: открыл список — ничего не изменилось, открыл сообщение —
     * оно прочитано. Раньше раздел гасил всё разом самим фактом открытия, и
     * достаточно было заглянуть, чтобы «прочитать» то, чего не читал.
     */
    async function markOneRead(id, el) {
        if (!client || !id) return;
        try {
            var res = await client.from('notification_log')
                .update({ is_read: true }).eq('id', id);
            if (res.error) {
                console.warn('[KSLT] notifications:', res.error.message);
                return;
            }
            if (el) el.classList.remove('unread');
            announceRead({ id: id });
            refreshNotifDot();
        } catch(e) {
            console.warn('[KSLT] notifications:', e);
        }
    }

    /** Пересчитать точку на колокольчике после прочтения. */
    async function refreshNotifDot() {
        var dot = document.getElementById('siteNotifDot');
        if (!dot || !client || !_dashUser) return;
        try {
            var res = await client.from('notification_log')
                .select('id').eq('profile_id', _dashUser.id).eq('is_read', false);
            var n = (res.data || []).length;
            if (n > 0) {
                dot.style.display = '';
                dot.textContent = n > 9 ? '9+' : n;
            } else {
                dot.style.display = 'none';
            }
        } catch(e) { /* точка не главное — молча оставляем как есть */ }
    }

    /** Отметить прочитанными все — по кнопке, а не молча. */
    async function markAllNotificationsRead(user) {
        if (!client || !user) return;
        var container = document.getElementById('db-notifications');
        var res = await client.from('notification_log')
            .update({ is_read: true })
            .eq('profile_id', user.id).eq('is_read', false);
        if (res.error) {
            console.warn('[KSLT] notifications:', res.error.message);
            return;
        }
        if (container) {
            container.querySelectorAll('.db-notif-row.unread').forEach(function(el) {
                el.classList.remove('unread');
            });
        }
        announceRead({ all: true });
        refreshNotifDot();
    }

    /**
     * О прочтении объявляем на весь документ: колокольчик в шапке живёт в
     * другом скрипте (js/auth-nav.js) и иначе узнавал бы об этом только
     * после перезагрузки. Слушаем и обратное — прочитанное через колокольчик
     * должно тут же гаснуть и в списке кабинета.
     */
    function announceRead(detail) {
        try {
            document.dispatchEvent(new CustomEvent('kslt:notification-read', { detail: detail }));
        } catch(e) { /* старый браузер — обойдётся без синхронизации */ }
    }

    document.addEventListener('kslt:notification-read', function(e) {
        var d = e.detail || {};
        var container = document.getElementById('db-notifications');
        if (!container) return;
        if (d.all) {
            container.querySelectorAll('.db-notif-row.unread').forEach(function(el) {
                el.classList.remove('unread');
            });
            var allBtn = document.getElementById('dbNotifAllRead');
            if (allBtn) allBtn.style.display = 'none';
        } else if (d.id) {
            var one = container.querySelector('.db-notif-row[data-id="' + d.id + '"]');
            if (one) one.classList.remove('unread');
            // Непрочитанных не осталось — кнопке «Отметить все» нечего делать
            if (!container.querySelector('.db-notif-row.unread')) {
                var btn = document.getElementById('dbNotifAllRead');
                if (btn) btn.style.display = 'none';
            }
        }
    });

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
            showPhone: (document.getElementById('profileShowPhone') || {}).checked || false,
            showWhatsapp: (document.getElementById('profileShowWhatsapp') || {}).checked || false,
            showTelegram: (document.getElementById('profileShowTelegram') || {}).checked || false,
            showInstagram: (document.getElementById('profileShowInstagram') || {}).checked || false,
            phoneCountry: (document.getElementById('profilePhoneCountry') || {}).value || '',
            whatsapp: (document.getElementById('profileWhatsapp') || {}).value || '',
            whatsappCountry: (document.getElementById('profileWhatsappCountry') || {}).value || ''
        };
    }

    function checkProfileDirty() {
        var btn = document.getElementById('profileSaveBtn');
        if (!btn || !window._profileSnapshot) return;

        var current = getProfileFormValues();
        var snap = window._profileSnapshot;

        // Сравниваем все поля снимка, а не перечисленные вручную. Раньше список
        // был написан руками, и добавленные позже — галочка «показывать телефон»
        // и страна — в него не попали: человек ставил галочку, кнопка оставалась
        // заблокированной, и сохранить было нечем.
        var dirty = Object.keys(current).some(function(key) {
            return current[key] !== snap[key];
        });

        btn.disabled = !dirty;
        btn.classList.remove('db-btn-saved');
    }

    /**
     * Модальное окно кабинета.
     *
     * Раньше подтверждения показывались системным confirm() — чужой рамкой
     * посреди тёмной страницы, — а каждое окно собиралось со своими стилями
     * прямо в коде.
     *
     * @param {{title: string, body: string, actions: Array}} opts
     * @returns {{el: HTMLElement, close: Function}}
     */
    function dbModal(opts) {
        var back = document.createElement('div');
        back.className = 'db-modal-back';

        var actions = (opts.actions || []).map(function(a, i) {
            var cls = a.danger ? 'db-btn-danger' : (a.primary ? 'db-btn-primary' : 'db-btn-outline');
            return '<button type="button" class="db-btn ' + cls +
                   '" data-act="' + i + '">' + a.label + '</button>';
        }).join('');

        back.innerHTML =
            '<div class="db-modal" role="dialog" aria-modal="true">' +
                '<div class="db-modal-head">' +
                    '<h3 class="db-modal-title">' + opts.title + '</h3>' +
                    '<button type="button" class="db-modal-close" aria-label="' + L.close + '">&times;</button>' +
                '</div>' +
                opts.body +
                (actions ? '<div class="db-modal-actions">' + actions + '</div>' : '') +
            '</div>';

        document.body.appendChild(back);
        document.body.style.overflow = 'hidden';

        function close() {
            back.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e) { if (e.key === 'Escape') close(); }

        back.querySelector('.db-modal-close').addEventListener('click', close);
        back.addEventListener('click', function(e) { if (e.target === back) close(); });
        document.addEventListener('keydown', onKey);

        (opts.actions || []).forEach(function(a, i) {
            var btn = back.querySelector('[data-act="' + i + '"]');
            if (btn) btn.addEventListener('click', function() {
                if (a.onClick) a.onClick(close);
                else close();
            });
        });

        return { el: back, close: close };
    }

    // ---- Save Profile ----
    async function saveProfile() {
        if (!client) return;

        var btn = document.getElementById('profileSaveBtn');
        var firstName = document.getElementById('profileFirstName').value.trim();
        var lastName = document.getElementById('profileLastName').value.trim();

        // Script validation
        if (firstName && !scriptRegex.test(firstName)) {
            var msg = isKg ? 'Атта тамгалар гана болушу керек' : isEn ? 'The first name may contain letters only' : 'В имени допустимы только буквы';
            alert(msg);
            return;
        }
        if (lastName && !scriptRegex.test(lastName)) {
            var msg2 = isKg ? 'Фамилияда тамгалар гана болушу керек' : isEn ? 'The last name may contain letters only' : 'В фамилии допустимы только буквы';
            alert(msg2);
            return;
        }
        var phoneCountryEl = document.getElementById('profilePhoneCountry');
        var phoneCountry = phoneCountryEl ? phoneCountryEl.value : null;
        var phone = window.KSLT_PHONE
            ? KSLT_PHONE.join(phoneCountry, document.getElementById('profilePhone').value)
            : document.getElementById('profilePhone').value.trim();
        // Проверка была жёстко под Кыргызстан: +996 и ровно девять цифр.
        // Страну теперь выбирают из списка, и у каждой своя длина номера —
        // у американского после кода десять цифр, у нашего девять. Поэтому
        // проверяем разумный диапазон, а не один формат.
        var phoneDigits = phone.replace(/[^0-9]/g, '');
        if (phone && (phoneDigits.length < 8 || phoneDigits.length > 15)) {
            showMessage('profileMessage',
                isKg ? 'Номер телефонду толук жазыңыз' :
                isEn ? 'Enter the full phone number' : 'Введите номер телефона полностью', true);
            return;
        }
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

        var checkedById = function(id) {
            var el = document.getElementById(id);
            return el ? el.checked : false;
        };
        var showPhone = checkedById('profileShowPhone');
        var showWhatsapp = checkedById('profileShowWhatsapp');
        var showTelegram = checkedById('profileShowTelegram');
        var showInstagram = checkedById('profileShowInstagram');

        // Номер WhatsApp необязателен: пустое поле значит «тот же, что телефон»
        var waCountryEl = document.getElementById('profileWhatsappCountry');
        var waInput = document.getElementById('profileWhatsapp');
        var waRaw = waInput ? waInput.value.trim() : '';
        var whatsapp = waRaw && window.KSLT_PHONE
            ? KSLT_PHONE.join(waCountryEl ? waCountryEl.value : null, waRaw)
            : '';
        var whatsappCountry = whatsapp ? (waCountryEl ? waCountryEl.value : null) : null;
        var fullName = firstName + (lastName ? ' ' + lastName : '');

        btn.textContent = L.saving;
        btn.disabled = true;

        // Track changed sensitive fields for security notification
        var oldPhone = (window.ksltProfile && window.ksltProfile.phone) || '';
        var oldEmail = (window.ksltUser && window.ksltUser.email) || '';

        var result = await client.from('profiles').update({
            full_name: fullName,
            phone: phone,
            phone_country: phoneCountry,
            gender: gender,
            birth_day: birthDay ? parseInt(birthDay) : null,
            birth_month: birthMonth ? parseInt(birthMonth) : null,
            birth_year: birthYear ? parseInt(birthYear) : null,
            instagram: instagram,
            telegram: telegram,
            show_phone: showPhone,
            show_whatsapp: showWhatsapp,
            show_telegram: showTelegram,
            show_instagram: showInstagram,
            whatsapp_phone: whatsapp || null,
            whatsapp_country: whatsappCountry
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
            window.ksltProfile.show_phone = showPhone;
            window.ksltProfile.show_whatsapp = showWhatsapp;
            window.ksltProfile.show_telegram = showTelegram;
            window.ksltProfile.show_instagram = showInstagram;
            window.ksltProfile.whatsapp_phone = whatsapp || null;
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
            // Год: к адресу ниже дописывается метка времени, поэтому новая
            // фотография видна сразу, а старая не скачивается заново при
            // каждом открытии кабинета
            cacheControl: '31536000',
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


    // Турнир ещё впереди, если он не сыгран и результата по нему нет
    function isUpcoming(item) {
        if (item.round_reached) return false;
        var st = item.tournament && item.tournament.status;
        return st === 'registration_open' || st === 'registration_closed' || st === 'upcoming';
    }

    // Записаться снова можно, пока регистрация открыта. Сама запись идёт
    // обычным путём на странице турнира — там все проверки допуска
    function canReenter(item) {
        return item.reg && item.reg.status === 'withdrawn'
            && item.tournament && item.tournament.status === 'registration_open';
    }

    // ---- Снятие заявки с турнира ----
    // Снять можно, пока не проведена жеребьёвка: после неё игрок уже в сетке,
    // и его снимает организатор. Правило «за 3 часа» и штраф — отдельная задача.
    function canWithdraw(item) {
        var reg = item.reg;
        if (!reg || reg.status === 'withdrawn') return false;
        // В парном турнире заявка одна на пару, и подаёт её капитан.
        // Напарник видит турнир, но снять пару с него не может
        if (reg.as_partner) return false;
        if (reg.draw_position != null || reg.group_number != null) return false;
        if (item.round_reached) return false;
        // Статусы турнира до начала игры. Снять заявку можно и после закрытия
        // регистрации — правило привязано к жеребьёвке, а не к дедлайну записи
        var st = item.tournament && item.tournament.status;
        return st === 'registration_open' || st === 'registration_closed' || st === 'upcoming';
    }

    function bindWithdraw(container, profile, refresh) {
        container.querySelectorAll('.db-withdraw-btn[data-reg]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                showWithdrawModal(btn.dataset.reg, btn.dataset.name, profile, refresh);
            });
        });

        // «Записаться снова» — подаём заявку прямо из кабинета. Гонять игрока
        // на страницу турнира ради одного нажатия незачем, а решение о допуске
        // всё равно принимает сервер
        container.querySelectorAll('.db-reenter-btn[data-tid]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                if (!window.KSLT_REG) return;
                var wasLabel = btn.textContent;
                btn.disabled = true;
                btn.textContent = L.saving;

                var info = await window.KSLT_REG.submit(client, btn.dataset.tid, { isEn: isEn, isKg: isKg });
                if (info && info.created) {
                    (refresh || loadGamesTournaments)(profile);
                } else {
                    btn.disabled = false;
                    btn.textContent = wasLabel;
                }
            });
        });
    }

    /**
     * Снятие заявки — в общем окне кабинета, а не в своём собственном.
     *
     * Здесь стояла отдельная разметка с инлайновыми стилями: другой отступ,
     * другой заголовок, без крестика и без выхода по Escape. Окно на сайте
     * должно быть одно.
     */
    function showWithdrawModal(regId, tournamentName, profile, refresh) {
        var modal = dbModal({
            title: L.regWithdrawTitle,
            body: '<p class="db-modal-text">' +
                L.regWithdrawText.replace('{name}',
                    '<strong>' + escHtml(tournamentName) + '</strong>') + '</p>',
            actions: [
                { label: L.regWithdrawNo },
                { label: L.regWithdrawYes, danger: true, onClick: async function(close) {
                    var btn = modal.el.querySelector('[data-act="1"]');
                    if (btn) { btn.disabled = true; btn.textContent = L.saving; }

                    var res = await client.from('tournament_registrations')
                        .update({ status: 'withdrawn' })
                        .eq('id', regId);

                    close();
                    if (res.error) {
                        showMessage(null, res.error.message || L.regWithdrawError, true);
                        return;
                    }
                    showMessage(null, L.regWithdrawDone, false);
                    (refresh || loadGamesTournaments)(profile);
                } }
            ]
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

        // Сводный ряд — только для игрока без категорий; у остальных цифры
        // берутся из player_categories.
        //
        // Раньше здесь считались ВСЕ матчи подряд, включая баттлы: тот же
        // игрок на публичной странице и в кабинете видел разные числа, а
        // показательная игра попадала в рейтинговую статистику. Теперь
        // берём готовые players.wins/losses — их считает база по одному
        // правилу: только турнирные встречи
        var wins = p.wins || 0, losses = p.losses || 0;

        container.innerHTML =
            '<h2 class="db-section-title">' + L.statsTitle + '</h2>' +
            // Без этой строчки цифры выглядят враньём: в истории матчей
            // одиннадцать игр, а побед и поражений здесь считается четыре.
            // Дружеские, парные, микст и баттлы в зачёт не идут
            '<div class="db-stats-note">' + L.statsNote + '</div>' +
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
            pairBlocksHtml(p) +
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
    /**
     * Число со словом в нужном падеже: 1 победа, 2 победы, 5 побед.
     *
     * forms — [одна, две, пять]. У английского и кыргызского формы совпадают,
     * поэтому правило считаем только для русского.
     */
    function plural(n, forms) {
        var word;
        if (!isEn && !isKg) {
            var a = Math.abs(n) % 100, b = a % 10;
            word = (a > 10 && a < 20) ? forms[2]
                 : (b > 1 && b < 5) ? forms[1]
                 : (b === 1) ? forms[0] : forms[2];
        } else {
            word = n === 1 ? forms[0] : forms[1];
        }
        return n + ' ' + word;
    }

    /**
     * Парные и смешанные игры — счёт отдельным блоком.
     *
     * В рейтинговую статистику они не идут: очков за пары не начисляют, и
     * места в таблице у них нет. Но сыгранное — это сыгранное, и без этих
     * чисел история матчей выглядела длиннее, чем статистика объясняет.
     *
     * Пары и микст порознь: партнёр в них разный, и складывать их — терять
     * то немногое, что число говорит.
     *
     * У кого таких игр нет, блока тоже нет: пустые нули читаются как
     * неудача, а человек просто не играл в парах.
     */
    function pairBlockHtml(title, tagText, tagClass, w, l) {
        var played = w + l;
        if (!played) return '';
        var rate = Math.round(w / played * 100);
        return '<div class="db-pair-block">' +
            '<div class="db-pair-head">' +
                '<span class="db-pair-title">' + escHtml(title) + '</span>' +
                '<span class="db-pair-tag ' + tagClass + '">' + escHtml(tagText) + '</span>' +
                '<span class="db-pair-note">' + escHtml(L.pairsNote) + '</span>' +
            '</div>' +
            '<div class="db-cat-top">' +
                '<div class="db-stats-grid db-stats-grid-mini db-pair-grid">' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + played + '</div><div class="db-stat-label">' + L.pairsMatches + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + w + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                    '<div class="db-stat-card"><div class="db-stat-value">' + l + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                '</div>' +
                '<div class="db-cat-rate"><b>' + rate + '%</b><span>' + L.catWinRate + '</span></div>' +
            '</div>' +
            '<div class="db-cat-bar">' +
                '<i class="db-cat-bar-w" style="width:' + rate + '%"></i>' +
                '<i class="db-cat-bar-l" style="width:' + (100 - rate) + '%"></i>' +
            '</div>' +
        '</div>';
    }

    function pairBlocksHtml(p) {
        return pairBlockHtml(L.pairsTitle, L.pairsTag, 'db-pair-tag-dbl',
                             p.doubles_wins || 0, p.doubles_losses || 0) +
               pairBlockHtml(L.mixedTitle, L.mixedTag, 'db-pair-tag-mix',
                             p.mixed_wins || 0, p.mixed_losses || 0);
    }

    async function renderStatsCategories(p) {
        if (!client) return '';

        var pcRes = await client.from('player_categories')
            .select('player_id, category_id, points, wins, losses, closed_at, closed_reason')
            .order('points', { ascending: false });
        var allRows = pcRes.data || [];
        // Friendly в рейтинге не участвует: турниры и матчи записываются,
        // очков за них нет
        var myRows = allRows.filter(function(r) {
            return r.player_id === p.id && r.category_id !== 'friendly';
        });

        // Домашняя категория видна и без очков: игрок в ней уже числится,
        // просто ещё ничего не набрал
        if (p.category_id && !myRows.some(function(r) { return r.category_id === p.category_id; })) {
            myRows.push({ player_id: p.id, category_id: p.category_id, points: 0, wins: 0, losses: 0 });
        }

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
                    // Категория закрыта для новых заявок. Очки и матчи в ней
                    // остаются, поэтому она видна, но помечена. Причину игрок
                    // видит у себя: это про него
                    (row.closed_at
                        ? ' <span class="db-cat-closed">' + L.catClosed +
                          (row.closed_reason ? ' \u00b7 ' + escHtml(row.closed_reason) : '') + '</span>'
                        : '') +
                '</div>' +
                '<div class="db-cat-top">' +
                    '<div class="db-stats-grid db-stats-grid-mini">' +
                        '<div class="db-stat-card"><div class="db-stat-value">' + (row.points || 0) + '</div><div class="db-stat-label">' + L.points + '</div></div>' +
                        '<div class="db-stat-card"><div class="db-stat-value">' + (row.wins || 0) + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                        '<div class="db-stat-card"><div class="db-stat-value">' + (row.losses || 0) + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                        '<div class="db-stat-card"><div class="db-stat-value">#' + place + '</div><div class="db-stat-label">' + L.place + '</div></div>' +
                    '</div>' +
                    catRateHtml(row) +
                '</div>' +
                catBarHtml(row) +
            '</div>';
        });

        return html + '</div>';
    }

    /**
     * Полоса побед и поражений под плитками категории.
     *
     * Четыре цифры одинакового размера не показывали главного — как игрок
     * выступает. Соотношение видно полоской, а цвета взяты из таблицы
     * матчей: там зелёный значок — победа, красный — поражение.
     */
    /**
     * Процент побед у правого края строки.
     *
     * Он и раньше был в блоке, но мелким текстом под полосой, в одном ряду
     * с легендой. Правая половина блока при этом пустовала: все числа
     * стояли слева. Процент — итог категории, ему там и место.
     */
    function catRateHtml(row) {
        var w = row.wins || 0, l = row.losses || 0, played = w + l;
        var value = played ? Math.round(w / played * 100) + '%' : '\u2014';
        return '<div class="db-cat-rate' + (played ? '' : ' db-cat-rate-empty') + '">' +
            '<b>' + value + '</b>' +
            '<span>' + L.catWinRate + '</span>' +
        '</div>';
    }

    function catBarHtml(row) {
        var w = row.wins || 0, l = row.losses || 0, played = w + l;

        if (!played) {
            return '<div class="db-cat-bar"></div>' +
                '<div class="db-cat-legend"><span>' + L.catNoMatches + '</span></div>';
        }

        return '<div class="db-cat-bar">' +
                '<i class="db-cat-bar-w" style="width:' + (w / played * 100) + '%"></i>' +
                '<i class="db-cat-bar-l" style="width:' + (l / played * 100) + '%"></i>' +
            '</div>' +
            '<div class="db-cat-legend">' +
                '<span>' + L.catTotal + ': ' + played + '</span>' +
                '<span class="db-cat-record">' +
                    '<span class="db-cat-mark db-cat-mark-w"></span>' + plural(w, L.catWins) +
                    '<span class="db-cat-mark db-cat-mark-l"></span>' + plural(l, L.catLosses) +
                '</span>' +
            '</div>';
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
                    html += '<div class="db-badge-item db-badge-earned" title="' + escHtml(bDesc(b) || bName(b)) + '">';
                    html += '<span class="db-badge-icon">' + escHtml(b.icon) + '</span>';
                    html += '<span class="db-badge-name">' + escHtml(bName(b)) + '</span>';
                    html += '</div>';
                });
                html += '</div>';
            }

            // Ближайшие цели. Раньше здесь брались первые три по порядку
            // сортировки, и игрок, которому до значка оставался один матч,
            // видел три случайных
            var lockedDefs = allDefs.filter(function(d) { return !earnedMap[d.id] && d.condition_type !== 'manual'; });
            var progress = await loadBadgeProgress(playerId);

            lockedDefs.forEach(function(d) {
                var have = progress[d.condition_type];
                d._have = have;
                d._need = d.condition_value;
                // Значки без счётчика (чемпион, сенсация, членство) идут
                // после измеримых: сказать, сколько до них осталось, нельзя
                d._left = (have == null || !d.condition_value) ? Infinity : Math.max(0, d.condition_value - have);
            });
            lockedDefs.sort(function(a, b) {
                if (a._left !== b._left) return a._left - b._left;
                return (a.sort_order || 0) - (b.sort_order || 0);
            });

            var nearest = lockedDefs.slice(0, 3);
            if (nearest.length > 0) {
                var nextLabel = isKg ? 'Кийинки максаттар' : isEn ? 'Next goals' : 'Следующие цели';
                html += '<div class="db-badges-next-label">' + nextLabel + '</div>';
                html += '<div class="db-badges-earned">';
                nearest.forEach(function(d) {
                    var counter = d._left === Infinity ? ''
                        : '<span class="db-badge-progress">' + d._have + '/' + d._need + '</span>';
                    html += '<div class="db-badge-item db-badge-locked" title="' + escHtml(bDesc(d) || bName(d)) + '">';
                    html += '<span class="db-badge-icon db-badge-icon-locked">' + escHtml(d.icon) + '</span>';
                    html += '<span class="db-badge-name">' + escHtml(bName(d)) + '</span>';
                    html += counter;
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
    // Колокольчик показывал всё подряд: переключатели управляли только
    // Telegram и почтой, а отключить уведомления о чужих баттлах было нечем
    var NOTIF_CHANNELS = ['site', 'tg', 'email'];

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

        // Без подключённого бота столбец телеграма бесполезен: человек включал
        // ползунок и ждал сообщений, которым неоткуда взяться. Гасим его и
        // говорим, что делать.
        var tgLinked = !!(window.ksltProfile && window.ksltProfile.telegram_chat_id);

        var rows = '';
        NOTIF_CATS.forEach(function(cat) {
            var cells = '';
            NOTIF_CHANNELS.forEach(function(ch) {
                var on = isNotifOn(prefs, ch, cat);
                var off = (ch === 'tg' && !tgLinked);
                cells +=
                    '<td style="text-align:center;padding:8px 12px;">' +
                        '<label class="db-notif-toggle' + (off ? ' db-notif-off' : '') + '">' +
                            '<input type="checkbox" data-ch="' + ch + '" data-cat="' + cat + '"' +
                                (on && !off ? ' checked' : '') + (off ? ' disabled' : '') + '>' +
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
                    '<th style="text-align:center;padding:4px 12px;color:var(--text-muted);font-size:0.8rem;font-weight:500;">' + L.notifSite + '</th>' +
                    '<th style="text-align:center;padding:4px 12px;color:var(--text-muted);font-size:0.8rem;font-weight:500;">' + L.notifTelegram + '</th>' +
                    '<th style="text-align:center;padding:4px 12px;color:var(--text-muted);font-size:0.8rem;font-weight:500;">' + L.notifEmail + '</th>' +
                '</tr></thead>' +
                '<tbody>' + rows + '</tbody>' +
            '</table>' +
            (tgLinked ? '' :
                '<div class="db-notif-hint">' + L.notifTgOff + '</div>') +
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
                        '<input class="db-field-input" type="password" id="settingsCurrentPw" placeholder="' + L.phCurrentPassword + '" autocomplete="current-password">' +
                        '<button type="button" class="db-pw-eye" data-target="settingsCurrentPw">' + eyeSvgOpen + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="db-field">' +
                    '<label class="db-field-label">' + L.newPassword + '</label>' +
                    '<div class="db-pw-field">' +
                        '<input class="db-field-input" type="password" id="settingsNewPw" placeholder="' + L.phNewPassword + '" autocomplete="new-password">' +
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
                        '<input class="db-field-input" type="password" id="settingsConfirmPw" placeholder="' + L.phConfirmPassword + '" autocomplete="new-password">' +
                        '<button type="button" class="db-pw-eye" data-target="settingsConfirmPw">' + eyeSvgOpen + '</button>' +
                    '</div>' +
                '</div>' +
                '<button class="db-btn db-btn-primary" id="settingsUpdatePwBtn" disabled>' + L.updatePassword + '</button>' +
            '</div>' +

            // Выбор языка убран: он есть в шапке на каждой странице, и второй
            // переключатель в настройках только заставляет гадать, чем они
            // отличаются

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

        // Удаление аккаунта. Привязка стояла на верхнем уровне файла, а раздел
        // настроек рисуется позже — обработчик не навешивался никогда, и кнопка
        // просто ничего не делала.
        var deleteBtn = document.getElementById('settingsDeleteBtn');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                // Спрашивали дважды одним и тем же текстом — человек жал «ОК»
                // два раза не читая, и защиты в этом не было. Одно окно, но с
                // перечнем того, что теряется, останавливает лучше.
                dbModal({
                    title: L.deleteAccount,
                    body:
                        '<p class="db-modal-text">' + L.deleteConfirm + '</p>' +
                        '<ul class="db-modal-steps">' +
                            L.deleteLoses.map(function(x) { return '<li>' + x + '</li>'; }).join('') +
                        '</ul>',
                    actions: [
                        { label: L.cancel },
                        { label: L.deleteAccount, primary: true, onClick: function(close) {
                            close();
                            doDeleteAccount(deleteBtn);
                        } }
                    ]
                });
            });
        }
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

    async function doDeleteAccount(btn) {
        {
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
        }
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

})();
