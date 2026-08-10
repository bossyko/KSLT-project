// ============================================
// KSLT Mobile — i18n (RU / EN / KG)
// ============================================
(function() {
  'use strict';

  var I18N = window.KSLT_I18N = {};

  var _lang = localStorage.getItem('kslt_lang') || 'ru';

  var T = {
    // === Navigation (tab bar) ===
    'nav.home':        { ru: 'Главная',   en: 'Home',        kg: 'Башкы' },
    'nav.tournaments': { ru: 'Турниры',   en: 'Tournaments',  kg: 'Мелдештер' },
    'nav.rating':      { ru: 'Рейтинг',   en: 'Rating',       kg: 'Рейтинг' },
    'nav.news':        { ru: 'Новости',   en: 'News',         kg: 'Жанылыктар' },
    'nav.profile':     { ru: 'Профиль',   en: 'Profile',      kg: 'Профиль' },

    // === Side menu sections ===
    'menu.sections':    { ru: 'Разделы',      en: 'Sections',     kg: 'Бөлүмдөр' },
    'menu.live':        { ru: 'Live',          en: 'Live',          kg: 'Live' },
    'menu.news':        { ru: 'Новости',      en: 'News',          kg: 'Жанылыктар' },
    'menu.battles':     { ru: 'Баттлы',       en: 'Battles',       kg: 'Баттлдар' },
    'menu.courts':      { ru: 'Корты',        en: 'Courts',        kg: 'Корттор' },
    'menu.coaches':     { ru: 'Тренеры',      en: 'Coaches',       kg: 'Машыктыруучулар' },
    'menu.partners':    { ru: 'Поиск игрока', en: 'Player Search', kg: 'Оюнчу издөө' },
    'menu.sponsors':    { ru: 'Спонсоры',     en: 'Sponsors',      kg: 'Демөөрчүлөр' },
    'menu.info':        { ru: 'Информация',   en: 'Information',   kg: 'Маалымат' },
    'menu.about':       { ru: 'О KSLT',       en: 'About KSLT',    kg: 'KSLT жөнүндө' },
    'menu.rules':       { ru: 'Правила',      en: 'Rules',         kg: 'Эрежелер' },
    'menu.faq':         { ru: 'FAQ',           en: 'FAQ',           kg: 'FAQ' },
    'menu.pricing':     { ru: 'Членство',     en: 'Membership',    kg: 'Мүчөлүк' },
    'menu.contact':     { ru: 'Связаться',    en: 'Contact',       kg: 'Байланыш' },
    'menu.version':     { ru: 'Версия',       en: 'Version',       kg: 'Версия' },

    // === Header ===
    'header.notifications': { ru: 'Уведомления', en: 'Notifications', kg: 'Билдирүүлөр' },
    'header.menu':          { ru: 'Меню',         en: 'Menu',           kg: 'Меню' },
    'notif.empty':          { ru: 'Нет уведомлений', en: 'No notifications', kg: 'Билдирүү жок' },

    // === Home screen ===
    'home.live':            { ru: 'Live',            en: 'Live',             kg: 'Live' },
    'home.watch':           { ru: 'Смотреть',        en: 'Watch',            kg: 'Көрүү' },
    'home.battles':         { ru: 'Баттлы',          en: 'Battles',          kg: 'Баттлдар' },
    'home.all':             { ru: 'Все',             en: 'All',              kg: 'Баары' },
    'home.upcoming':        { ru: 'Ближайшие турниры', en: 'Upcoming Tournaments', kg: 'Жакынкы мелдештер' },
    'home.latestNews':      { ru: 'Новости',         en: 'News',             kg: 'Жанылыктар' },
    'home.loginToWatch':    { ru: 'Войдите, чтобы смотреть трансляцию', en: 'Log in to watch the stream', kg: 'Көрүү үчүн кириңиз' },
    'home.player':          { ru: 'Игрок',           en: 'Player',           kg: 'Оюнчу' },

    // === Tournaments screen ===
    'tournaments.title':     { ru: 'Турниры',         en: 'Tournaments',      kg: 'Мелдештер' },
    'tournaments.search':    { ru: 'Поиск турнира...', en: 'Search tournament...', kg: 'Мелдеш издөө...' },
    'tournaments.all':       { ru: 'Все',              en: 'All',              kg: 'Баары' },
    'tournaments.upcoming':  { ru: 'Предстоящие',     en: 'Upcoming',          kg: 'Алдыдагы' },
    'tournaments.live':      { ru: 'Текущие',          en: 'Live',             kg: 'Учурдагы' },
    'tournaments.completed': { ru: 'Завершённые',     en: 'Completed',         kg: 'Аяктаган' },
    'tournaments.empty':     { ru: 'Нет турниров',    en: 'No tournaments',    kg: 'Мелдеш жок' },
    'tournaments.emptyText': { ru: 'По выбранному фильтру турниры не найдены', en: 'No tournaments found for the selected filter', kg: 'Тандалган фильтр боюнча мелдеш табылган жок' },
    'tournaments.loadMore':  { ru: 'Показать ещё',    en: 'Show more',        kg: 'Дагы көрсөтүү' },
    'tournaments.showing':   { ru: 'Показано',        en: 'Showing',           kg: 'Көрсөтүлүүдө' },
    'tournaments.of':        { ru: 'из',               en: 'of',               kg: 'ичинен' },
    'tournaments.registration': { ru: 'Регистрация',  en: 'Registration',      kg: 'Каттоо' },
    'tournaments.inProgress':{ ru: 'Идёт',            en: 'In progress',       kg: 'Жүрүп жатат' },
    'tournaments.finished':  { ru: 'Завершён',        en: 'Finished',          kg: 'Аяктады' },
    'tournaments.players':   { ru: 'игроков',          en: 'players',          kg: 'оюнчу' },
    'tournaments.daysLeft':  { ru: 'дн. до начала',   en: 'days left',         kg: 'күн калды' },
    'tournaments.hoursLeft': { ru: 'ч. до начала',    en: 'hours left',        kg: 'саат калды' },

    // === Tournament detail ===
    'td.back':          { ru: 'Назад',             en: 'Back',             kg: 'Артка' },
    'td.tournament':    { ru: 'Турнир',            en: 'Tournament',       kg: 'Мелдеш' },
    'td.info':          { ru: 'Информация',        en: 'Info',             kg: 'Маалымат' },
    'td.bracket':       { ru: 'Сетка',             en: 'Bracket',          kg: 'Тор' },
    'td.results':       { ru: 'Очки',              en: 'Points',           kg: 'Упай' },
    'td.date':          { ru: 'Дата',              en: 'Date',             kg: 'Күнү' },
    'td.location':      { ru: 'Место',             en: 'Location',         kg: 'Орду' },
    'td.participants':  { ru: 'Участники',         en: 'Participants',     kg: 'Катышуучулар' },
    'td.pairs':         { ru: 'Пар',               en: 'Pairs',            kg: 'Жуптар' },
    'td.regUntil':      { ru: 'Регистрация до',    en: 'Registration until', kg: 'Каттоо мөөнөтү' },
    'td.prizeFund':     { ru: 'Призовой фонд',     en: 'Prize fund',       kg: 'Байге фонду' },
    'td.som':           { ru: 'сом',               en: 'KGS',             kg: 'сом' },
    'td.max':           { ru: 'макс.',             en: 'max',              kg: 'макс.' },
    'td.loginToReg':    { ru: 'Войдите, чтобы записаться на турнир', en: 'Log in to register for the tournament', kg: 'Мелдешке жазылуу үчүн кириңиз' },
    'td.needMembership':{ ru: 'Для участия нужно членство KSLT', en: 'KSLT membership required to participate', kg: 'Катышуу үчүн KSLT мүчөлүгү керек' },
    'td.getMembership': { ru: 'Оформить членство',  en: 'Get membership',   kg: 'Мүчөлүк алуу' },
    'td.register':      { ru: 'Записаться на турнир', en: 'Register for tournament', kg: 'Мелдешке жазылуу' },
    'td.bracketEmpty':  { ru: 'Сетка пока не сформирована', en: 'Bracket not yet formed', kg: 'Тор азырынча түзүлө элек' },
    'td.resultsEmpty':  { ru: 'Очки пока не начислены', en: 'Points not yet awarded', kg: 'Упай азырынча берилген жок' },
    'td.regApproved':   { ru: 'Вы зарегистрированы ✓', en: 'You are registered ✓', kg: 'Сиз катталдыңыз ✓' },

    // === Tournament registration ===
    'trn.register':       { ru: 'Записаться на турнир', en: 'Register for tournament', kg: 'Мелдешке жазылуу' },
    'trn.registered':     { ru: 'Вы записаны ✓',       en: 'You are registered ✓',   kg: 'Сиз жазылдыңыз ✓' },
    'trn.needAuth':       { ru: 'Войдите, чтобы записаться на турнир', en: 'Log in to register for the tournament', kg: 'Мелдешке жазылуу үчүн кириңиз' },
    'trn.needMembership': { ru: 'Для участия необходимо членство KSLT', en: 'KSLT membership required to participate', kg: 'Катышуу үчүн KSLT мүчөлүгү керек' },
    'trn.needPlayer':     { ru: 'Ваш профиль не привязан к карточке игрока. Обратитесь к администратору.', en: 'Your profile is not linked to a player card. Contact admin.', kg: 'Профилиңиз оюнчу картасына байланган эмес. Администраторго кайрылыңыз.' },
    'trn.banned':         { ru: 'Вы отстранены от участия в турнирах', en: 'You are banned from tournaments', kg: 'Сиз мелдештерден четтетилдиңиз' },
    'trn.waitlist':       { ru: 'Лист ожидания — ожидает одобрения', en: 'Waitlist — awaiting approval', kg: 'Күтүү тизмеси — бекитүүнү күтүүдө' },
    'trn.alreadyReg':     { ru: 'Вы уже записаны на этот турнир', en: 'You are already registered for this tournament', kg: 'Сиз бул мелдешке жазылгансыз' },
    'trn.joinWaitlist':   { ru: 'Встать в лист ожидания', en: 'Join Waitlist', kg: 'Күтүү тизмесине кошулуу' },
    'trn.slotsFull':      { ru: 'Основная сетка заполнена. Вы можете встать в лист ожидания.', en: 'Main draw is full. You can join the waitlist.', kg: 'Негизги сетка толук. Күтүү тизмесине кошулсаңыз болот.' },
    'trn.partnerSelect':  { ru: 'Выбор партнёра', en: 'Partner Selection', kg: 'Өнөктөштү тандоо' },
    'trn.partnerSearch':  { ru: 'Поиск партнёра по имени...', en: 'Search partner by name...', kg: 'Өнөктөштү аты боюнча издөө...' },
    'trn.soloReg':        { ru: 'Без партнёра', en: 'Solo', kg: 'Жалгыз' },
    'trn.registering':    { ru: 'Отправка...', en: 'Registering...', kg: 'Жөнөтүлүүдө...' },
    'trn.regSent':        { ru: 'Заявка отправлена!', en: 'Registration Submitted!', kg: 'Арыз жөнөтүлдү!' },
    'trn.regSoloSent':    { ru: 'Зарегистрирован (без партнёра)', en: 'Registered (no partner)', kg: 'Катталды (өнөктөш жок)' },
    'trn.noPlayersFound': { ru: 'Игроков не найдено', en: 'No players found', kg: 'Оюнчулар табылган жок' },
    'trn.ntrpExceed':     { ru: 'Суммарный NTRP превышает лимит', en: 'Combined NTRP exceeds the limit', kg: 'Жалпы NTRP чектен ашып кетти' },
    'trn.mixedGender':    { ru: 'Микст требует одного мужчину и одну женщину', en: 'Mixed doubles requires one man and one woman', kg: 'Микст бир эркек жана бир аял талап кылат' },
    'trn.regAsPartner':   { ru: 'Зарегистрирован как партнёр', en: 'Registered as partner', kg: 'Өнөктөш катары катталган' },
    'trn.addPartner':     { ru: 'Добавить партнёра', en: 'Add Partner', kg: 'Өнөктөш кошуу' },
    'trn.partnerAdded':   { ru: 'Партнёр добавлен!', en: 'Partner added!', kg: 'Өнөктөш кошулду!' },
    'trn.waitlistSolo':   { ru: 'В листе ожидания (без партнёра)', en: 'On Waitlist (no partner yet)', kg: 'Күтүү тизмесинде (өнөктөш жок)' },

    // === Правила допуска на турнир (ответы функции tournament-register) ===
    'reg.acceptedTitle':  { ru: 'Заявка принята', en: 'Application accepted', kg: 'Арыз кабыл алынды' },
    'reg.inMainDraw':     { ru: 'Вы в основной сетке.', en: 'You are in the main draw.', kg: 'Сиз негизги сеткадасыз.' },
    'reg.shortInDraw':    { ru: 'В основной сетке', en: 'In the main draw', kg: 'Негизги сеткада' },
    'reg.spotNotLocked':  { ru: 'Место не закреплено: если заявку подаст игрок категории турнира, вы можете быть перемещены в лист ожидания.', en: 'Your spot is not locked in: if a player of the tournament category applies, you may be moved to the waiting list.', kg: 'Орун бекитилген эмес: мелдеш категориясындагы оюнчу арыз берсе, сиз күтүү тизмесине өтүшүңүз мүмкүн.' },

    'reg.reviewTitle':    { ru: 'Заявка принята — на рассмотрении', en: 'Application accepted — under review', kg: 'Арыз кабыл алынды — каралууда' },
    'reg.shortReview':    { ru: 'На рассмотрении', en: 'Under review', kg: 'Каралууда' },
    'reg.noCategory':     { ru: 'Вам ещё не присвоена категория, поэтому заявка требует рассмотрения.', en: 'Your category is not assigned yet, so the application needs a review.', kg: 'Категорияңыз дайындала элек, ошондуктан арыз каралат.' },
    'reg.rankWaitlist':   { ru: 'Вы занимаете с 11 по 20 место в своей категории — заявка требует одобрения.', en: 'You are ranked 11-20 in your category — the application needs approval.', kg: 'Категорияңызда 11-20 орундасыз — арыз бекитүүнү талап кылат.' },
    'reg.drawFull':       { ru: 'Основная сетка заполнена.', en: 'The main draw is full.', kg: 'Негизги сетка толук.' },
    'reg.adminDecides':   { ru: 'Решение примет администратор.', en: 'The administrator will make a decision.', kg: 'Чечимди администратор кабыл алат.' },

    'reg.blockedTitle':   { ru: 'Заявка не принята', en: 'Application not accepted', kg: 'Арыз кабыл алынган жок' },
    'reg.shortBlocked':   { ru: 'Не принята', en: 'Not accepted', kg: 'Кабыл алынган жок' },
    'reg.blockedGeneric': { ru: 'Вы не проходите по правилам допуска на турнир.', en: 'You do not meet the tournament entry rules.', kg: 'Сиз мелдешке катышуу эрежелерине туура келбейсиз.' },

    'reg.alreadyTitle':   { ru: 'Вы уже подали заявку', en: 'You have already applied', kg: 'Сиз буга чейин арыз бергенсиз' },
    'reg.stApproved':     { ru: 'Вы в основной сетке.', en: 'You are in the main draw.', kg: 'Сиз негизги сеткадасыз.' },
    'reg.stDraw':         { ru: 'Вы в основной сетке, жеребьёвка проведена.', en: 'You are in the main draw, the draw has been made.', kg: 'Сиз негизги сеткадасыз, жеребьёвка өттү.' },
    'reg.stPending':      { ru: 'Заявка ожидает решения администратора.', en: 'The application is awaiting a decision.', kg: 'Арыз чечимди күтүүдө.' },
    'reg.stWaitlist':     { ru: 'Вы в листе ожидания.', en: 'You are on the waiting list.', kg: 'Сиз күтүү тизмесиндесиз.' },
    'reg.stRejected':     { ru: 'Заявка отклонена администратором.', en: 'The application was rejected by the administrator.', kg: 'Арызды администратор четке какты.' },
    'reg.stWithdrawn':    { ru: 'Заявка была отозвана.', en: 'The application was withdrawn.', kg: 'Арыз кайтарылып алынган.' },
    'reg.stBlocked':      { ru: 'Заявка не прошла правила допуска.', en: 'The application did not pass the entry rules.', kg: 'Арыз катышуу эрежелеринен өткөн жок.' },

    'reg.errNoPlayer':    { ru: 'Ваш аккаунт не связан с карточкой игрока', en: 'Your account is not linked to a player profile', kg: 'Аккаунтуңуз оюнчу картасына байланган эмес' },
    'reg.errNoMember':    { ru: 'Требуется активное членство KSLT', en: 'Active KSLT membership required', kg: 'KSLT активдүү мүчөлүгү талап кылынат' },
    'reg.errNotPaid':     { ru: 'Сначала оплатите членство', en: 'Please pay your membership first', kg: 'Адегенде мүчөлүк төлөмүн төлөңүз' },
    'reg.errBanned':      { ru: 'Ваш аккаунт временно заблокирован', en: 'Your account is temporarily blocked', kg: 'Аккаунтуңуз убактылуу бөгөттөлгөн' },
    'reg.errClosed':      { ru: 'Регистрация на этот турнир закрыта', en: 'Registration for this tournament is closed', kg: 'Бул мелдешке каттоо жабык' },
    'reg.errGender':      { ru: 'Этот турнир для другой гендерной категории', en: 'This tournament is for another gender category', kg: 'Бул мелдеш башка жыныс категориясы үчүн' },
    'reg.errNtrpLow':     { ru: 'Ваш NTRP ниже минимального для турнира', en: 'Your NTRP is below the tournament minimum', kg: 'NTRP көрсөткүчүңүз мелдештин минимумунан төмөн' },
    'reg.errNtrpHigh':    { ru: 'Ваш NTRP выше максимального для турнира', en: 'Your NTRP is above the tournament maximum', kg: 'NTRP көрсөткүчүңүз мелдештин максимумунан жогору' },
    'reg.errNtrpComb':    { ru: 'Суммарный NTRP пары превышает лимит турнира', en: 'Combined NTRP of the pair exceeds the tournament limit', kg: 'Жуптун жалпы NTRP көрсөткүчү чектен ашты' },

    // === Rating screen ===
    'rating.title':      { ru: 'Рейтинг',           en: 'Rating',          kg: 'Рейтинг' },
    'rating.search':     { ru: 'Поиск игрока...',    en: 'Search player...', kg: 'Оюнчу издөө...' },
    'rating.men':        { ru: 'МУЖ',                en: 'MEN',             kg: 'ЭР' },
    'rating.women':      { ru: 'ЖЕН',                en: 'WOMEN',           kg: 'АЯЛ' },
    'rating.category':   { ru: 'Категория',          en: 'Category',        kg: 'Категория' },
    'rating.rank':       { ru: '#',                   en: '#',               kg: '#' },
    'rating.player':     { ru: 'Игрок',              en: 'Player',          kg: 'Оюнчу' },
    'rating.pts':        { ru: 'Очки',               en: 'Pts',             kg: 'Упай' },
    'rating.ntrp':       { ru: 'NTRP',               en: 'NTRP',            kg: 'NTRP' },
    'rating.wl':         { ru: 'В/П',                en: 'W/L',             kg: 'Ж/У' },
    'rating.empty':      { ru: 'Нет игроков',        en: 'No players',      kg: 'Оюнчу жок' },
    'rating.emptyText':  { ru: 'В данной категории пока нет игроков', en: 'No players in this category yet', kg: 'Бул категорияда азырынча оюнчу жок' },
    'rating.guestTitle': { ru: 'Полный рейтинг',     en: 'Full Rating',     kg: 'Толук рейтинг' },
    'rating.guestText':  { ru: 'Зарегистрируйтесь, чтобы видеть полный рейтинг всех игроков', en: 'Register to see the full rating of all players', kg: 'Бардык оюнчулардын рейтингин көрүү үчүн катталыңыз' },
    'rating.guestBtn':   { ru: 'Регистрация',        en: 'Register',        kg: 'Каттоо' },
    'rating.singles':    { ru: 'Одиночный',          en: 'Singles',         kg: 'Жалгыз' },
    'rating.doubles':    { ru: 'Парный',              en: 'Doubles',        kg: 'Жуп' },
    'rating.playersCount': { ru: 'игроков',           en: 'players',        kg: 'оюнчу' },
    'rating.season':     { ru: 'Сезон',               en: 'Season',         kg: 'Сезон' },
    'rating.noResults':  { ru: 'Ничего не найдено',   en: 'No results',     kg: 'Эч нерсе табылган жок' },
    'rating.catLabel':   { ru: 'Категория',           en: 'Category',       kg: 'Категория' },
    'rating.genderLabel': { ru: 'Пол',                en: 'Gender',         kg: 'Жынысы' },
    'rating.typeLabel':  { ru: 'Тип',                 en: 'Type',           kg: 'Түрү' },

    // === News screen ===
    'news.title':       { ru: 'Новости',              en: 'News',            kg: 'Жанылыктар' },
    'news.subtitle':    { ru: 'Последние события KSLT', en: 'Latest KSLT events', kg: 'KSLT акыркы окуялар' },
    'news.search':      { ru: 'Поиск новости...',     en: 'Search news...',   kg: 'Жанылык издөө...' },
    'news.all':         { ru: 'Все',                   en: 'All',             kg: 'Баары' },
    'news.tournaments': { ru: 'Турниры',              en: 'Tournaments',      kg: 'Мелдештер' },
    'news.club':        { ru: 'КСЛТ',                 en: 'KSLT',            kg: 'КСЛТ' },
    'news.empty':       { ru: 'Нет новостей',         en: 'No news',          kg: 'Жанылык жок' },
    'news.emptySearch': { ru: 'По запросу ничего не найдено', en: 'Nothing found for your query', kg: 'Сурам боюнча эч нерсе табылган жок' },
    'news.emptyFilter': { ru: 'По выбранному фильтру новости не найдены', en: 'No news found for the selected filter', kg: 'Тандалган фильтр боюнча жанылык жок' },
    'news.views':       { ru: 'просмотров',           en: 'views',           kg: 'көрүү' },
    'news.default':     { ru: 'Новости',              en: 'News',            kg: 'Жанылыктар' },
    'news.detail':      { ru: 'Новость',              en: 'Article',         kg: 'Жанылык' },
    'news.rateTitle':   { ru: 'Оцените статью',       en: 'Rate this article', kg: 'Макаланы баалаңыз' },
    'news.loginToRate': { ru: 'Войдите, чтобы оценить', en: 'Log in to rate',  kg: 'Баалоо үчүн кириңиз' },
    'news.pollTotal':   { ru: 'голосов',              en: 'votes',            kg: 'добуш' },

    // === Profile screen ===
    'profile.title':        { ru: 'Профиль',              en: 'Profile',           kg: 'Профиль' },
    'profile.notAuth':      { ru: 'Вы не авторизованы',   en: 'Not logged in',     kg: 'Сиз кире элексиз' },
    'profile.loginText':    { ru: 'Войдите, чтобы увидеть свой профиль', en: 'Log in to see your profile', kg: 'Профилиңизди көрүү үчүн кириңиз' },
    'profile.login':        { ru: 'Войти',                en: 'Log in',            kg: 'Кирүү' },
    'profile.user':         { ru: 'Пользователь',         en: 'User',              kg: 'Колдонуучу' },
    'profile.admin':        { ru: 'Администратор',        en: 'Administrator',     kg: 'Администратор' },
    'profile.manager':      { ru: 'Менеджер',             en: 'Manager',           kg: 'Менеджер' },
    'profile.member':       { ru: 'Участник',             en: 'Member',            kg: 'Катышуучу' },
    'profile.player':       { ru: 'Игрок',                en: 'Player',            kg: 'Оюнчу' },
    'profile.points':       { ru: 'Очки',                 en: 'Points',            kg: 'Упай' },
    'profile.wins':         { ru: 'Победы',               en: 'Wins',              kg: 'Жеңиштер' },
    'profile.losses':       { ru: 'Поражения',            en: 'Losses',            kg: 'Утулуштар' },
    'profile.winRate':      { ru: '% побед',              en: 'Win %',             kg: '% жеңиш' },
    'profile.formLabel':    { ru: 'Форма:',               en: 'Form:',             kg: 'Форма:' },
    'profile.formTrend':    { ru: 'Тренд формы',          en: 'Form trend',        kg: 'Форма тренди' },

    // Profile — Activity
    'profile.activity':     { ru: 'Активность',           en: 'Activity',          kg: 'Активдүүлүк' },
    'profile.myTournaments':{ ru: 'Мои турниры',          en: 'My Tournaments',    kg: 'Менин мелдештерим' },
    'profile.myMatches':    { ru: 'Мои матчи',            en: 'My Matches',        kg: 'Менин матчтарым' },
    'profile.achievements': { ru: 'Достижения',           en: 'Achievements',      kg: 'Жетишкендиктер' },
    'profile.loyalty':      { ru: 'Баллы лояльности',     en: 'Loyalty Points',    kg: 'Лоялдуулук упайлары' },
    'profile.loyaltySub':   { ru: 'Доступно для обмена',  en: 'Available to redeem', kg: 'Алмашууга жеткиликтүү' },
    'profile.vouchers':     { ru: 'Ваучеры',              en: 'Vouchers',          kg: 'Ваучерлер' },
    'profile.vouchersSub':  { ru: 'Скидки на корты и тренеров', en: 'Discounts on courts & coaches', kg: 'Корт жана тренерлерге арзандатуулар' },
    'profile.payments':     { ru: 'История платежей',     en: 'Payment History',   kg: 'Төлөм тарыхы' },

    // Profile — Settings
    'profile.settings':     { ru: 'Настройки',            en: 'Settings',          kg: 'Орнотуулар' },
    'profile.editProfile':  { ru: 'Редактировать профиль', en: 'Edit Profile',     kg: 'Профилди өзгөртүү' },
    'profile.notifications':{ ru: 'Уведомления',          en: 'Notifications',     kg: 'Билдирүүлөр' },
    'profile.changePass':   { ru: 'Смена пароля',         en: 'Change Password',   kg: 'Сырсөздү өзгөртүү' },
    'profile.telegram':     { ru: 'Telegram',             en: 'Telegram',          kg: 'Telegram' },
    'profile.tgLinked':     { ru: 'Подключён',            en: 'Connected',         kg: 'Туташкан' },
    'profile.tgLink':       { ru: 'Подключить бота',      en: 'Connect bot',       kg: 'Ботту туташтыруу' },
    'profile.deleteAccount':{ ru: 'Удалить аккаунт',      en: 'Delete Account',    kg: 'Аккаунтту өчүрүү' },
    'profile.logout':       { ru: 'Выйти',               en: 'Log out',           kg: 'Чыгуу' },
    'profile.theme':        { ru: 'Тема',                 en: 'Theme',             kg: 'Тема' },
    'profile.language':     { ru: 'Язык',                 en: 'Language',          kg: 'Тил' },

    // Profile — Membership
    'profile.noMembership':   { ru: 'Нет членства',                  en: 'No membership',           kg: 'Мүчөлүк жок' },
    'profile.getMembership':  { ru: 'Оформите для доступа ко всем функциям', en: 'Get access to all features', kg: 'Бардык функцияларга жетүү үчүн алыңыз' },
    'profile.memActive':      { ru: 'Активно',                       en: 'Active',                  kg: 'Активдүү' },
    'profile.memExpired':     { ru: 'Истекло',                       en: 'Expired',                 kg: 'Мөөнөтү бүттү' },
    'profile.memDaysLeft':    { ru: 'Осталось',                      en: 'days left',               kg: 'күн калды' },
    'profile.memRenew':       { ru: 'Продлите членство',             en: 'Renew membership',        kg: 'Мүчөлүктү узартыңыз' },
    'profile.daysShort':      { ru: 'дн.',                            en: 'days',                   kg: 'күн' },

    // Profile — Loyalty sub
    'profile.loyaltyPts':     { ru: 'баллов',           en: 'points',         kg: 'упай' },
    'profile.redeemTitle':    { ru: 'Обменять баллы',   en: 'Redeem Points',  kg: 'Упай алмаштыруу' },
    'profile.historyTitle':   { ru: 'История',          en: 'History',        kg: 'Тарых' },
    'profile.noTournaments':  { ru: 'Вы ещё не участвовали в турнирах', en: 'You haven\'t participated in tournaments yet', kg: 'Сиз азырынча мелдешке катышкан жоксуз' },
    'profile.noMatches':      { ru: 'Нет матчей',       en: 'No matches',     kg: 'Матч жок' },
    'profile.noBadges':       { ru: 'Нет бейджей',      en: 'No badges',      kg: 'Бейдж жок' },

    // === Battles screen ===
    'battles.title':       { ru: 'Баттлы',              en: 'Battles',          kg: 'Баттлдар' },
    'battles.subtitle':    { ru: 'Голосуй за любимого игрока', en: 'Vote for your favorite player', kg: 'Сүйүктүү оюнчуңуз үчүн добуш бериңиз' },
    'battles.active':      { ru: 'Активные',            en: 'Active',           kg: 'Активдүү' },
    'battles.completed':   { ru: 'Завершённые',         en: 'Completed',        kg: 'Аяктаган' },
    'battles.empty':       { ru: 'Нет баттлов',         en: 'No battles',       kg: 'Баттл жок' },
    'battles.emptyActive': { ru: 'Активных баттлов пока нет', en: 'No active battles yet', kg: 'Активдүү баттлдар азырынча жок' },
    'battles.emptyDone':   { ru: 'Завершённых баттлов пока нет', en: 'No completed battles yet', kg: 'Аяктаган баттлдар азырынча жок' },
    'battles.details':     { ru: 'Подробнее',           en: 'Details',          kg: 'Толугураак' },
    'battles.battle':      { ru: 'Баттл',               en: 'Battle',           kg: 'Баттл' },
    'battles.soon':        { ru: 'Скоро здесь появятся баттлы', en: 'Battles coming soon', kg: 'Баттлдар жакында пайда болот' },

    // === Partners screen ===
    'partners.title':      { ru: 'Поиск игрока',       en: 'Player Search',      kg: 'Оюнчу издөө' },
    'partners.subtitle':   { ru: 'Найди игрока по NTRP уровню', en: 'Find a player by NTRP level', kg: 'NTRP деңгээли боюнча оюнчу издөө' },
    'partners.search':     { ru: 'Поиск по имени...',    en: 'Search by name...', kg: 'Аты боюнча издөө...' },
    'partners.all':        { ru: 'Все',                   en: 'All',              kg: 'Баары' },
    'partners.empty':      { ru: 'Нет партнёров',        en: 'No partners',       kg: 'Өнөктөш жок' },
    'partners.emptyText':  { ru: 'Нет игроков с указанным NTRP уровнем', en: 'No players with the specified NTRP level', kg: 'Көрсөтүлгөн NTRP деңгээлдеги оюнчулар жок' },

    // === Coaches screen ===
    'coaches.title':       { ru: 'Тренеры',              en: 'Coaches',           kg: 'Машыктыруучулар' },
    'coaches.subtitle':    { ru: 'Профессиональные тренеры KSLT', en: 'Professional KSLT coaches', kg: 'KSLT профессионал машыктыруучулар' },
    'coaches.empty':       { ru: 'Нет тренеров',         en: 'No coaches',        kg: 'Машыктыруучу жок' },
    'coaches.years':       { ru: 'лет',                   en: 'years',            kg: 'жыл' },
    'coaches.perHour':     { ru: 'сом/час',               en: 'KGS/h',           kg: 'сом/саат' },
    'coaches.partner':     { ru: 'Партнёр',               en: 'Partner',          kg: 'Өнөктөш' },
    'coach.detail':        { ru: 'Тренер',                en: 'Coach',            kg: 'Машыктыруучу' },
    'coach.yearsExp':      { ru: 'Лет опыта',             en: 'Years exp.',       kg: 'Жыл тажрыйба' },
    'coach.pricePerH':     { ru: 'Сом/час',               en: 'KGS/h',           kg: 'Сом/саат' },
    'coach.court':         { ru: 'Площадка',              en: 'Court',            kg: 'Аянтча' },
    'coach.about':         { ru: 'О тренере',             en: 'About',            kg: 'Тренер жөнүндө' },
    'coach.achievements':  { ru: 'Достижения',            en: 'Achievements',     kg: 'Жетишкендиктер' },
    'coach.contacts':      { ru: 'Контакты',              en: 'Contacts',         kg: 'Байланыштар' },
    'coach.contactsLocked':{ ru: 'Контакты тренера доступны для членов KSLT', en: 'Coach contacts available for KSLT members', kg: 'Тренер байланыштары KSLT мүчөлөрү үчүн жеткиликтүү' },

    // === Courts screen ===
    'courts.title':        { ru: 'Корты',                 en: 'Courts',           kg: 'Корттор' },
    'courts.subtitle':     { ru: 'Теннисные площадки Бишкека', en: 'Tennis courts of Bishkek', kg: 'Бишкектин теннис корттору' },
    'courts.all':          { ru: 'Все',                    en: 'All',             kg: 'Баары' },
    'courts.empty':        { ru: 'Нет кортов',            en: 'No courts',        kg: 'Корт жок' },
    'courts.court':        { ru: 'корт',                   en: 'court',           kg: 'корт' },
    'courts.courts':       { ru: 'кортов',                 en: 'courts',          kg: 'корт' },
    'courts.from':         { ru: 'от',                     en: 'from',            kg: 'баштап' },
    'court.detail':        { ru: 'Корт',                  en: 'Court',            kg: 'Корт' },
    'court.swipe':         { ru: 'свайпните для просмотра', en: 'swipe to view',  kg: 'көрүү үчүн сүрүңүз' },
    'court.address':       { ru: 'Адрес',                 en: 'Address',          kg: 'Дарек' },
    'court.prices':        { ru: 'Цены',                  en: 'Prices',           kg: 'Баалар' },
    'court.description':   { ru: 'Описание',              en: 'Description',      kg: 'Сүрөттөмө' },
    'court.amenities':     { ru: 'Удобства',              en: 'Amenities',        kg: 'Ыңгайлуулуктар' },
    'court.contact':       { ru: 'Контакт',               en: 'Contact',          kg: 'Байланыш' },
    'court.contactLocked': { ru: 'Контакты корта доступны для членов KSLT', en: 'Court contacts available for KSLT members', kg: 'Корт байланыштары KSLT мүчөлөрү үчүн жеткиликтүү' },

    // === Sponsors screen ===
    'sponsors.title':      { ru: 'Спонсоры',              en: 'Sponsors',         kg: 'Демөөрчүлөр' },
    'sponsors.subtitle':   { ru: 'Наши партнёры и спонсоры', en: 'Our partners and sponsors', kg: 'Биздин өнөктөштөр жана демөөрчүлөр' },

    // === Live screen ===
    'live.title':          { ru: 'Live',                   en: 'Live',            kg: 'Live' },
    'live.subtitle':       { ru: 'Матчи в реальном времени', en: 'Live matches',  kg: 'Реалдуу убакыт матчтары' },
    'live.empty':          { ru: 'Нет матчей',             en: 'No matches',      kg: 'Матч жок' },
    'live.emptyText':      { ru: 'Сейчас нет live-трансляций. Следите за расписанием турниров.', en: 'No live streams right now. Follow the tournament schedule.', kg: 'Азырынча live-трансляция жок. Мелдеш расписаниесин байкаңыз.' },
    'live.noStream':       { ru: 'Нет трансляции',         en: 'No stream',       kg: 'Трансляция жок' },
    'live.noVideo':        { ru: 'Нет трансляции',         en: 'No broadcast',    kg: 'Трансляция жок' },
    'live.warmup':         { ru: 'РАЗМИНКА',               en: 'WARM-UP',         kg: 'ДАЯРДОО' },
    'live.paused':         { ru: 'ПАУЗА',                  en: 'PAUSED',          kg: 'ТЫНЫМ' },
    'live.completed':      { ru: 'ЗАВЕРШЁН',               en: 'COMPLETED',       kg: 'АЯКТАГАН' },
    'live.tiebreak':       { ru: 'Тайбрейк',              en: 'Tiebreak',        kg: 'Тайбрейк' },
    'live.bestOf':         { ru: 'Лучший из',              en: 'Best of',         kg: 'Лучший из' },
    'live.wins':           { ru: 'побеждает!',             en: 'wins!',           kg: 'жеңет!' },
    'live.tournament':     { ru: 'Турнир',                 en: 'Tournament',      kg: 'Турнир' },
    'live.format':         { ru: 'Формат',                 en: 'Format',          kg: 'Формат' },
    'live.round':          { ru: 'Раунд',                  en: 'Round',           kg: 'Раунд' },
    'live.court':          { ru: 'Корт',                   en: 'Court',           kg: 'Корт' },

    // === Player detail ===
    'pd.back':           { ru: 'Назад',               en: 'Back',             kg: 'Артка' },
    'pd.profile':        { ru: 'Профиль',             en: 'Profile',          kg: 'Профиль' },
    'pd.notFound':       { ru: 'Игрок не найден',     en: 'Player not found', kg: 'Оюнчу табылган жок' },
    'pd.challenge':      { ru: 'Вызвать на матч',     en: 'Challenge',        kg: 'Матчка чакыруу' },
    'pd.stats':          { ru: 'Статистика',          en: 'Statistics',       kg: 'Статистика' },
    'pd.matches':        { ru: 'Матчи',               en: 'Matches',          kg: 'Матчтар' },
    'pd.ratingHistory':  { ru: 'История рейтинга',   en: 'Rating history',   kg: 'Рейтинг тарыхы' },
    'reg.withdraw':      { ru: 'Снять заявку',        en: 'Withdraw',         kg: 'Арызды алуу' },
    'reg.withdrawn':     { ru: 'Заявка снята',        en: 'Withdrawn',        kg: 'Арыз алынды' },
    'reg.withdrawAsk':   { ru: 'Снять заявку с турнира?', en: 'Withdraw from the tournament?', kg: 'Турнирден арызды аласызбы?' },
    'reg.withdrawYes':   { ru: 'Снять',               en: 'Withdraw',         kg: 'Алуу' },
    'reg.withdrawNo':    { ru: 'Отмена',              en: 'Cancel',           kg: 'Жокко чыгаруу' },
    'reg.withdrawDone':  { ru: 'Заявка снята',        en: 'Entry withdrawn',  kg: 'Арыз алынды' },
    'reg.withdrawError': { ru: 'Не удалось снять заявку', en: 'Could not withdraw the entry', kg: 'Арызды алуу мүмкүн болгон жок' },
    'reg.registered':    { ru: 'Вы записаны',         en: 'You are entered',  kg: 'Сиз катталдыңыз' },
    'reg.again':         { ru: 'Записаться снова',    en: 'Enter again',      kg: 'Кайра катталуу' },
    'reg.refused':       { ru: 'Не допущен',          en: 'Not admitted',     kg: 'Уруксат жок' },
    'reg.upcoming':      { ru: 'Предстоящие',         en: 'Upcoming',         kg: 'Алдыдагы' },
    'reg.played':        { ru: 'Сыгранные',           en: 'Played',           kg: 'Ойнолгон' },
    'pd.tournaments':    { ru: 'Турниры',             en: 'Tournaments',      kg: 'Мелдештер' },
    'pd.badges':         { ru: 'Достижения',          en: 'Achievements',     kg: 'Жетишкендиктер' },
    'pd.showAll':        { ru: 'Показать все',         en: 'Show all',        kg: 'Баарын көрсөтүү' },
    'pd.guestTitle':     { ru: 'Хотите узнать больше?', en: 'Want to know more?', kg: 'Көбүрөөк билгиңиз келеби?' },
    'pd.guestText':      { ru: 'Зарегистрируйтесь, чтобы видеть полную статистику, матчи и достижения', en: 'Register to see full stats, matches and achievements', kg: 'Толук статистика, матчтар жана жетишкендиктерди көрүү үчүн катталыңыз' },
    'pd.guestBtn':       { ru: 'Регистрация',         en: 'Register',        kg: 'Каттоо' },
    'pd.memberCta':      { ru: 'Для вызовов нужно членство KSLT', en: 'KSLT membership required for challenges', kg: 'Чакыруулар үчүн KSLT мүчөлүгү керек' },
    'pd.h2h':            { ru: 'Личные встречи',      en: 'Head to Head',     kg: 'Жеке жолугушуулар' },

    // === Коды подтверждения ===
    'otp.title':         { ru: 'Введите код',          en: 'Enter the code',     kg: 'Кодду киргизиңиз' },
    'otp.sentToEmail':   { ru: 'Код отправлен на почту', en: 'Code sent to your email', kg: 'Код почтага жөнөтүлдү' },
    'otp.sentToTelegram':{ ru: 'Код отправлен в Telegram бот', en: 'Code sent to the Telegram bot', kg: 'Код Telegram ботко жөнөтүлдү' },
    'otp.validFor':      { ru: 'Код действителен:',    en: 'Code valid for:',    kg: 'Код жарактуу:' },
    'otp.wrongCode':     { ru: 'Неверный код',         en: 'Wrong code',         kg: 'Туура эмес код' },
    'otp.attemptsLeft':  { ru: 'попыток осталось',     en: 'attempts left',      kg: 'аракет калды' },
    'otp.expired':       { ru: 'Код истёк. Запросите новый.', en: 'Code expired. Request a new one.', kg: 'Код мөөнөтү бүттү. Жаңысын сураңыз.' },
    'otp.exhausted':     { ru: 'Попытки исчерпаны. Запросите новый код.', en: 'Too many attempts. Request a new code.', kg: 'Аракеттер бүттү. Жаңы код сураңыз.' },
    'otp.resend':        { ru: 'Отправить повторно',   en: 'Resend',             kg: 'Кайра жөнөтүү' },
    'otp.sending':       { ru: 'Отправка...',          en: 'Sending...',         kg: 'Жөнөтүлүүдө...' },
    'otp.sent':          { ru: 'Отправлено!',          en: 'Sent!',              kg: 'Жөнөтүлдү!' },
    'otp.sendCode':      { ru: 'Отправить код',        en: 'Send code',          kg: 'Код жөнөтүү' },
    'otp.saving':        { ru: 'Сохранение...',        en: 'Saving...',          kg: 'Сакталууда...' },
    'otp.savePassword':  { ru: 'Сохранить пароль',     en: 'Save password',      kg: 'Сырсөздү сактоо' },
    'otp.passwordRule':  { ru: 'Пароль: 8+ символов, заглавная, цифра, спецсимвол', en: 'Password: 8+ characters, uppercase, digit, special character', kg: 'Сырсөз: 8+ белги, баш тамга, сан, атайын белги' },
    'otp.passwordMismatch': { ru: 'Пароли не совпадают', en: 'Passwords do not match', kg: 'Сырсөздөр дал келбейт' },
    'otp.tooManyTries':  { ru: 'Слишком много попыток. Подождите минуту.', en: 'Too many attempts. Wait a minute.', kg: 'Аракет өтө көп. Бир мүнөт күтүңүз.' },
    'otp.genericError':  { ru: 'Ошибка. Попробуйте снова.', en: 'Something went wrong. Try again.', kg: 'Ката. Кайра аракет кылыңыз.' },

    // === Auth screen ===
    'auth.skip':         { ru: 'Пропустить',           en: 'Skip',            kg: 'Өткөрүп жиберүү' },
    'profile.visibleToClub': { ru: 'виден членам КСЛТ', en: 'visible to KSLT members', kg: 'КСЛТ мүчөлөрүнө көрүнөт' },
    'profile.hiddenFromAll': { ru: 'скрыт от всех', en: 'hidden from everyone', kg: 'эч кимге көрүнбөйт' },
    'profile.contactsHint': { ru: 'Контакты видят только члены КСЛТ. Гостям и просто зарегистрированным они не показываются.', en: 'Contact details are visible to club members only. Guests and registered users without a membership do not see them.', kg: 'Байланыш маалыматын клубдун мүчөлөрү гана көрөт. Меймандар менен жөн катталгандар аны көрүшпөйт.' },
    'profile.whatsappSame': { ru: 'тот же, что телефон', en: 'same as phone', kg: 'телефон менен бирдей' },
    'profile.showPhone': { ru: 'Показывать мой телефон членам клуба', en: 'Show my phone to club members', kg: 'Клуб мүчөлөрүнө телефонумду көрсөтүү' },
    'news.fullPoster':   { ru: 'Афиша целиком', en: 'Full poster', kg: 'Толук афиша' },
    'brand.tagline':     { ru: 'Кыргызстанское Сообщество Любителей Тенниса', en: 'Kyrgyzstan Social Lawn Tennis', kg: 'Кыргызстандын Теннис Сүйүүчүлөрүнүн Коому' },
    'auth.login':        { ru: 'Вход',                 en: 'Log in',           kg: 'Кирүү' },
    'auth.register':     { ru: 'Регистрация',          en: 'Register',         kg: 'Каттоо' },
    'auth.email':        { ru: 'Email',                en: 'Email',             kg: 'Email' },
    'auth.password':     { ru: 'Пароль',               en: 'Password',          kg: 'Сырсөз' },
    'auth.submit':       { ru: 'Войти',                en: 'Log in',            kg: 'Кирүү' },
    'auth.forgot':       { ru: 'Забыли пароль?',       en: 'Forgot password?',  kg: 'Сырсөздү унуттуңузбу?' },
    'auth.forgotText':   { ru: 'Введите email и мы отправим ссылку для сброса пароля', en: 'Enter your email and we\'ll send a reset link', kg: 'Email жазыңыз, биз сырсөздү калыбына келтирүү шилтемесин жөнөтөбүз' },
    'auth.sendReset':    { ru: 'Отправить ссылку',    en: 'Send reset link',   kg: 'Шилтеме жөнөтүү' },
    'auth.checkEmail':   { ru: 'Проверьте почту! Ссылка для сброса отправлена.', en: 'Check your email! Reset link has been sent.', kg: 'Почтаңызды текшериңиз! Калыбына келтирүү шилтемеси жөнөтүлдү.' },
    'auth.backToLogin':  { ru: 'Вернуться ко входу',  en: 'Back to login',     kg: 'Кирүүгө кайтуу' },
    'auth.verifyEmail':  { ru: 'Проверьте почту для подтверждения email', en: 'Check your email to verify your account', kg: 'Email ырастоо үчүн почтаңызды текшери��из' },
    'auth.name':         { ru: 'Имя и фамилия',       en: 'Full name',          kg: 'Аты-жөнү' },
    'auth.phone':        { ru: 'Телефон +996...',      en: 'Phone +996...',      kg: 'Телефон +996...' },
    'auth.passMin':      { ru: 'Пароль (мин. 6 символов)', en: 'Password (min 6 chars)', kg: 'Сырсөз (мин. 6 белги)' },
    'auth.registerBtn':  { ru: 'Зарегистрироваться',   en: 'Register',          kg: 'Каттоо' },
    'auth.or':           { ru: 'или',                  en: 'or',                kg: 'же' },
    'auth.terms':        { ru: 'Регистрируясь, вы соглашаетесь с', en: 'By registering, you agree to the', kg: 'Катталуу менен сиз макулдугуңузду бересиз' },
    'auth.termsLink':    { ru: 'условиями использования', en: 'terms of service', kg: 'колдонуу шарттары' },
    'auth.privacyLink':  { ru: 'политикой конфиденциальности', en: 'privacy policy', kg: 'купуялуулук саясаты' },

    // === Onboarding ===
    'onb.step1.title':   { ru: 'Добро пожаловать!',     en: 'Welcome!',          kg: 'Кош келиңиз!' },
    'onb.step1.text':    { ru: 'KSLT — теннисное сообщество Кыргызстана. Рейтинги, турниры и баттлы в одном приложении.', en: 'KSLT — tennis community of Kyrgyzstan. Rankings, tournaments and battles in one app.', kg: 'KSLT — Кыргызстандын теннис коому. Рейтингдер, мелдештер жана баттлдар бир тиркемеде.' },
    'onb.step2.title':   { ru: 'Турниры и рейтинг',     en: 'Tournaments & Rating', kg: 'Мелдештер жана рейтинг' },
    'onb.step2.text':    { ru: 'Участвуйте в турнирах, поднимайтесь в рейтинге и бросайте вызов другим игрокам.', en: 'Participate in tournaments, climb the rankings and challenge other players.', kg: 'Мелдештерге катышыңыз, рейтингде көтөрүлүңүз жана башка оюнчуларга чакыруу жөнөтүңүз.' },
    'onb.step3.title':   { ru: 'Оформите членство',     en: 'Get Membership',      kg: 'Мүчөлүк алыңыз' },
    'onb.step3.text':    { ru: 'Члены KSLT получают полный доступ: турниры, вызовы, скидки и баллы лояльности.', en: 'KSLT members get full access: tournaments, challenges, discounts and loyalty points.', kg: 'KSLT мүчөлөрү толук мүмкүнчүлүк алышат: мелдештер, чакыруулар, арзандатуулар жана лоялдуулук упайлары.' },
    'onb.next':          { ru: 'Далее',                  en: 'Next',              kg: 'Кийинки' },
    'onb.start':         { ru: 'Начать',                 en: 'Start',             kg: 'Баштоо' },
    'onb.skip':          { ru: 'Пропустить',             en: 'Skip',              kg: 'Өткөрүп жиберүү' },

    // === Profile — Sub-overlays ===
    'profile.noTournamentsTitle': { ru: 'Нет турниров',     en: 'No tournaments',   kg: 'Мелдеш жок' },
    'profile.tCompleted':  { ru: 'Завершён',  en: 'Finished',    kg: 'Аяктады' },
    'profile.tUpcoming':   { ru: 'Предстоит', en: 'Upcoming',    kg: 'Алдыдагы' },
    'profile.tLive':       { ru: 'Идёт',      en: 'In progress', kg: 'Жүрүп жатат' },
    'profile.noVouchers':     { ru: 'Нет ваучеров',    en: 'No vouchers',    kg: 'Ваучер жок' },
    'profile.noVouchersSub':  { ru: 'Ваучеры появятся при оформлении членства', en: 'Vouchers appear with membership', kg: 'Мүчөлүк алганда ваучерлер пайда болот' },
    'profile.vActive':        { ru: 'Активен',       en: 'Active',   kg: 'Активдүү' },
    'profile.vUsed':          { ru: 'Использован',   en: 'Used',     kg: 'Колдонулган' },
    'profile.vExpired':       { ru: 'Истёк',         en: 'Expired',  kg: 'Мөөнөтү бүттү' },
    'profile.vUntil':         { ru: 'до',            en: 'until',    kg: 'чейин' },
    'profile.vDiscount':      { ru: 'Скидка',         en: 'Discount', kg: 'Арзандатуу' },
    'profile.vQRTitle':       { ru: 'Ваучер',        en: 'Voucher',  kg: 'Ваучер' },
    'profile.vQRText':        { ru: 'Покажите QR-код для получения скидки', en: 'Show QR code to get discount', kg: 'Арзандатуу алуу үчүн QR-кодду көрсөтүңүз' },
    'profile.noPayments':     { ru: 'Нет платежей',  en: 'No payments',  kg: 'Төлөм жок' },
    'profile.payTotal':       { ru: 'Всего:',        en: 'Total:',       kg: 'Бардыгы:' },
    'profile.payDefault':     { ru: 'Оплата',        en: 'Payment',      kg: 'Төлөм' },
    'profile.noTransactions': { ru: 'Нет транзакций', en: 'No transactions', kg: 'Транзакция жок' },
    'profile.earnDesc':       { ru: 'Начисление',    en: 'Earned',       kg: 'Кошулду' },
    'profile.spendDesc':      { ru: 'Списание',      en: 'Spent',        kg: 'Алынды' },
    'profile.redeemConfirm':  { ru: 'Обменять баллов?', en: 'Redeem points?', kg: 'Упай алмаштырасызбы?' },
    'profile.redeemError':    { ru: 'Попробуйте позже', en: 'Try again later', kg: 'Кийинчерээк аракет кылыңыз' },
    'profile.redeemSuccess':  { ru: 'Баллы списаны!', en: 'Points redeemed!', kg: 'Упайлар алынды!' },
    'profile.redeemDesc':     { ru: 'Обмен на награду', en: 'Reward redemption', kg: 'Сыйлыкка алмаштыруу' },
    'profile.editAvatar':     { ru: 'Нажмите для смены', en: 'Tap to change', kg: 'Алмаштыруу үчүн басыңыз' },
    'profile.lastName':       { ru: 'Фамилия',   en: 'Last name',  kg: 'Фамилия' },
    'profile.firstName':      { ru: 'Имя',       en: 'First name', kg: 'Аты' },
    'profile.phoneLbl':       { ru: 'Телефон',   en: 'Phone',      kg: 'Телефон' },
    'profile.gender':         { ru: 'Пол',       en: 'Gender',     kg: 'Жынысы' },
    'profile.genderNone':     { ru: 'Не указан', en: 'Not specified', kg: 'Көрсөтүлгөн эмес' },
    'profile.genderMale':     { ru: 'Мужской',   en: 'Male',       kg: 'Эркек' },
    'profile.genderFemale':   { ru: 'Женский',   en: 'Female',     kg: 'Аял' },
    'profile.showSocials':     { ru: 'Показывать соцсети', en: 'Show socials', kg: 'Соц тармактарды көрсөтүү' },
    'profile.savedOk':        { ru: 'Профиль обновлён', en: 'Profile updated', kg: 'Профиль жаңыланды' },
    'profile.savedErr':       { ru: 'Ошибка сохранения', en: 'Save error', kg: 'Сактоо катасы' },
    'profile.fileTooLarge':   { ru: 'Файл слишком большой (макс. 2MB)', en: 'File too large (max 2MB)', kg: 'Файл өтө чоң (макс. 2MB)' },
    'profile.avatarOk':       { ru: 'Аватар обновлён', en: 'Avatar updated', kg: 'Аватар жаңыланды' },
    'profile.avatarErr':      { ru: 'Ошибка загрузки', en: 'Upload error', kg: 'Жүктөө катасы' },
    'profile.notifTournaments':    { ru: 'Турниры', en: 'Tournaments', kg: 'Мелдештер' },
    'profile.notifTournamentsDesc':{ ru: 'Напоминания о турнирах', en: 'Tournament reminders', kg: 'Мелдеш эскертмелери' },
    'profile.notifPayments':       { ru: 'Платежи', en: 'Payments', kg: 'Төлөмдөр' },
    'profile.notifPaymentsDesc':   { ru: 'Напоминания об оплате', en: 'Payment reminders', kg: 'Төлөм эскертмелери' },
    'profile.notifSystem':         { ru: 'Система', en: 'System', kg: 'Система' },
    'profile.notifSystemDesc':     { ru: 'Системные уведомления', en: 'System notifications', kg: 'Системалык билдирүүлөр' },
    'profile.notifMarketing':      { ru: 'Маркетинг', en: 'Marketing', kg: 'Маркетинг' },
    'profile.notifMarketingDesc':  { ru: 'Новости и акции', en: 'News & promotions', kg: 'Жанылыктар жана акциялар' },
    'profile.newPass':        { ru: 'Новый пароль', en: 'New password', kg: 'Жаңы сырсөз' },
    'profile.confirmPass':    { ru: 'Подтверждение', en: 'Confirm', kg: 'Ырастоо' },
    'profile.passRule':       { ru: 'Минимум 6 символов', en: 'Min 6 characters', kg: 'Жок дегенде 6 белги' },
    'profile.changePassBtn':  { ru: 'Изменить пароль', en: 'Change password', kg: 'Сырсөздү өзгөртүү' },
    'profile.changingPass':   { ru: 'Сохраняем...', en: 'Saving...', kg: 'Сакталууда...' },
    'profile.passChanged':    { ru: 'Пароль изменён!', en: 'Password changed!', kg: 'Сырсөз өзгөрдү!' },
    'profile.tgConnectedTitle':{ ru: 'Telegram подключён', en: 'Telegram connected', kg: 'Telegram туташкан' },
    'profile.tgReceive':      { ru: 'Вы получаете уведомления через бота', en: 'You receive notifications via bot', kg: 'Сиз бот аркылуу билдирүүлөрдү аласыз' },
    'profile.tgConnectTitle': { ru: 'Подключите Telegram', en: 'Connect Telegram', kg: 'Telegram туташтырыңыз' },
    'profile.tgConnectText':  { ru: 'Откройте бота и нажмите /start', en: 'Open bot and press /start', kg: 'Ботту ачып /start басыңыз' },
    'profile.tgOpenBot':      { ru: 'Открыть', en: 'Open', kg: 'Ачуу' },
    'profile.deleteTitle':    { ru: 'Удаление аккаунта', en: 'Delete Account', kg: 'Аккаунтту өчүрүү' },
    'profile.deleteText':     { ru: 'Это действие необратимо. Все данные будут удалены.', en: 'This is irreversible. All data will be deleted.', kg: 'Бул кайтарылгыс. Бардык дайындар өчүрүлөт.' },
    'profile.deleteBtn':      { ru: 'Удалить навсегда', en: 'Delete permanently', kg: 'Биротоло өчүрүү' },
    'profile.deleteConfirm':  { ru: 'Вы уверены? Это нельзя отменить.', en: 'Are you sure? Cannot be undone.', kg: 'Ишенесизби? Жокко чыгаруу мүмкүн эмес.' },
    'profile.deleting':       { ru: 'Удаление...', en: 'Deleting...', kg: 'Өчүрүлүүдө...' },
    'profile.deletedOk':      { ru: 'Аккаунт удалён', en: 'Account deleted', kg: 'Аккаунт өчүрүлдү' },
    'profile.deleteError':    { ru: 'Ошибка удаления аккаунта', en: 'Account deletion error', kg: 'Аккаунтту өчүрүүдө ката' },

    // === Player detail — extra ===
    'pd.rating':        { ru: 'Рейтинг',     en: 'Rating',    kg: 'Рейтинг' },
    'pd.wins':          { ru: 'Победы',       en: 'Wins',      kg: 'Жеңиштер' },
    'pd.losses':        { ru: 'Поражения',    en: 'Losses',    kg: 'Утулуштар' },
    'pd.winRate':       { ru: '% Побед',      en: 'Win %',     kg: '% Жеңиш' },
    'pd.streak':        { ru: 'Серия',        en: 'Streak',    kg: 'Сериясы' },
    'pd.guestRegister': { ru: 'Зарегистрируйтесь', en: 'Register', kg: 'Катталыңыз' },
    'pd.guestRegText':  { ru: 'Полная статистика, матчи и достижения доступны после входа', en: 'Full stats, matches and achievements available after login', kg: 'Толук статистика кирүүдөн кийин жеткиликтүү' },
    'pd.guestLoginBtn': { ru: 'Войти / Регистрация', en: 'Log in / Register', kg: 'Кирүү / Каттоо' },
    'pd.noMatches':     { ru: 'Нет данных о матчах', en: 'No match data', kg: 'Матч маалыматы жок' },
    'pd.noTournaments': { ru: 'Нет данных о турнирах', en: 'No tournament data', kg: 'Мелдеш маалыматы жок' },
    'pd.noBadges':      { ru: 'Нет бейджей',  en: 'No badges',  kg: 'Бейдж жок' },
    'pd.h2hNoData':     { ru: 'Данные не найдены', en: 'No data found', kg: 'Маалымат табылган жок' },
    'pd.h2hWins':       { ru: 'Победы',   en: 'Wins',   kg: 'Жеңиштер' },
    'pd.h2hSets':       { ru: 'Сеты',     en: 'Sets',   kg: 'Сеттер' },
    'pd.h2hGames':      { ru: 'Геймы',    en: 'Games',  kg: 'Геймдер' },
    'pd.h2hLatest':     { ru: 'Последние матчи', en: 'Recent matches', kg: 'Акыркы матчтар' },
    'pd.contact':       { ru: 'Контакты',          en: 'Contacts',        kg: 'Байланыштар' },
    'pd.h2hNoMatches':  { ru: 'Матчей не найдено', en: 'No matches found', kg: 'Матч табылган жок' },
    'pd.completed':     { ru: 'Завершён',  en: 'Finished', kg: 'Аяктады' },
    'pd.upcoming':      { ru: 'Предстоит', en: 'Upcoming', kg: 'Алдыдагы' },
    'pd.chalLogin':     { ru: 'Войдите в аккаунт', en: 'Log in first', kg: 'Аккаунтуңузга кириңиз' },
    'pd.chalLinkPlayer':{ ru: 'Привяжите профиль игрока', en: 'Link player profile', kg: 'Оюнчу профилин байлаңыз' },
    'pd.chalSelf':      { ru: 'Нельзя вызвать самого себя', en: 'Cannot challenge yourself', kg: 'Өзүңүздү чакыра албайсыз' },
    'pd.chalExists':    { ru: 'Активный вызов уже есть', en: 'Active challenge exists', kg: 'Активдүү чакыруу бар' },
    'pd.chalSent':      { ru: 'Вызов отправлен!', en: 'Challenge sent!', kg: 'Чакыруу жөнөтүлдү!' },

    // === Pricing ===
    'pricing.title':             { ru: 'Членство KSLT',          en: 'KSLT Membership',       kg: 'KSLT мүчөлүгү' },
    'pricing.singlePlan':        { ru: 'Единый тариф',           en: 'Single plan',           kg: 'Бирдиктүү тариф' },
    'pricing.monthlyMembership': { ru: 'Ежемесячное членство',   en: 'Monthly membership',    kg: 'Ай сайын мүчөлүк' },
    'pricing.perMonth':          { ru: 'мес',                     en: 'mo',                   kg: 'ай' },
    'pricing.feat1':             { ru: 'Участие во всех турнирах KSLT', en: 'Participate in all KSLT tournaments', kg: 'Бардык KSLT мелдештерине катышуу' },
    'pricing.feat2':             { ru: 'Полный рейтинг и статистика',   en: 'Full rating & statistics',           kg: 'Толук рейтинг жана статистика' },
    'pricing.feat3':             { ru: 'Скидки на аренду кортов',       en: 'Discounts on court rental',          kg: 'Корт ижарасына арзандатуу' },
    'pricing.feat4':             { ru: 'Доступ к закрытым мероприятиям', en: 'Access to exclusive events',         kg: 'Жабык иш-чараларга жетүү' },
    'pricing.feat5':             { ru: 'Система вызовов между игроками', en: 'Player challenge system',            kg: 'Оюнчулар арасында чакыруу системасы' },
    'pricing.feat6':             { ru: 'Программа лояльности (баллы)',   en: 'Loyalty program (points)',            kg: 'Лоялдуулук программасы (упайлар)' },
    'pricing.howToPay':          { ru: 'Для оплаты свяжитесь с нами:',  en: 'To pay, contact us:',                kg: 'Төлөө үчүн биз менен байланышыңыз:' },

    // === Generic ===
    'common.back':       { ru: 'Назад',     en: 'Back',     kg: 'Артка' },
    'common.login':      { ru: 'Войти',     en: 'Log in',   kg: 'Кирүү' },
    'common.save':       { ru: 'Сохранить', en: 'Save',     kg: 'Сактоо' },
    'common.cancel':     { ru: 'Отмена',    en: 'Cancel',   kg: 'Жокко чыгаруу' },
    'common.loading':    { ru: 'Загрузка...', en: 'Loading...', kg: 'Жүктөлүүдө...' },
    'common.error':      { ru: 'Ошибка',    en: 'Error',    kg: 'Ката' },
    'common.ok':         { ru: 'Понятно',   en: 'Got it',   kg: 'Түшүндүм' },
    'common.success':    { ru: 'Успешно',   en: 'Success',  kg: 'Ийгиликтүү' },
    'common.notFound':   { ru: 'не найден', en: 'not found', kg: 'табылган жок' },
    'common.tryLater':   { ru: 'Попробуйте позже', en: 'Try again later', kg: 'Кийинчерээк аракет кылыңыз' },
    'tournaments.today':    { ru: 'Сегодня',  en: 'Today',    kg: 'Бүгүн' },
    'tournaments.tomorrow': { ru: 'Завтра',   en: 'Tomorrow', kg: 'Эртең' },
    'tournaments.soon':     { ru: 'Скоро',    en: 'Soon',     kg: 'Жакында' },

    // === Months ===
    'month.0':  { ru: 'Янв', en: 'Jan', kg: 'Янв' },
    'month.1':  { ru: 'Фев', en: 'Feb', kg: 'Фев' },
    'month.2':  { ru: 'Мар', en: 'Mar', kg: 'Мар' },
    'month.3':  { ru: 'Апр', en: 'Apr', kg: 'Апр' },
    'month.4':  { ru: 'Май', en: 'May', kg: 'Май' },
    'month.5':  { ru: 'Июн', en: 'Jun', kg: 'Июн' },
    'month.6':  { ru: 'Июл', en: 'Jul', kg: 'Июл' },
    'month.7':  { ru: 'Авг', en: 'Aug', kg: 'Авг' },
    'month.8':  { ru: 'Сен', en: 'Sep', kg: 'Сен' },
    'month.9':  { ru: 'Окт', en: 'Oct', kg: 'Окт' },
    'month.10': { ru: 'Ноя', en: 'Nov', kg: 'Ноя' },
    'month.11': { ru: 'Дек', en: 'Dec', kg: 'Дек' },

    // === Round names ===
    'round.final':   { ru: 'Финал',       en: 'Final',       kg: 'Финал' },
    'round.semi':    { ru: 'Полуфинал',   en: 'Semifinal',    kg: 'Жарым финал' },
    'round.quarter': { ru: 'Четвертьфинал', en: 'Quarterfinal', kg: 'Чейрек финал' },
    'round.r16':     { ru: '1/8 финала',  en: 'Round of 16',  kg: '1/8 финал' },
    'round.r32':     { ru: '1/16 финала', en: 'Round of 32',  kg: '1/16 финал' },
    'round.round':   { ru: 'Раунд',       en: 'Round',        kg: 'Раунд' },

    // === Tournament bracket — groups / playoff ===
    'td.groupStage':   { ru: 'Групповой этап',  en: 'Group Stage',    kg: 'Топтук этап' },
    'td.playoff':      { ru: 'Плей-офф',        en: 'Playoff',        kg: 'Плей-офф' },
    'td.group':        { ru: 'Группа',           en: 'Group',         kg: 'Топ' },
    'td.winsShort':    { ru: 'В',                en: 'W',             kg: 'Ж' },
    'td.lossesShort':  { ru: 'П',                en: 'L',             kg: 'Ж' },
    'td.posShort':     { ru: 'М',                en: 'Pos',           kg: 'О' },
    'td.final':        { ru: 'Финал',            en: 'Final',         kg: 'Финал' },
    'td.semifinal':    { ru: 'Полуфинал',        en: 'Semifinal',     kg: 'Жарым финал' },
    'td.quarterfinal': { ru: 'Четвертьфинал',    en: 'Quarterfinal',  kg: 'Чейрек финал' },
    'td.thirdPlace':   { ru: 'За 3-е место',     en: '3rd Place',     kg: '3-орун үчүн' },
    'td.roundN':       { ru: 'Раунд',            en: 'Round',         kg: 'Раунд' },
    'td.premierLeague':     { ru: 'Высшая лига',        en: 'Premier League',     kg: 'Жогорку лига' },
    'td.consolationLeague': { ru: 'Утешительная лига',   en: 'Consolation League', kg: 'Сооротуу лигасы' },

    // === Tournament info — extra fields ===
    'td.format':       { ru: 'Формат',           en: 'Format',         kg: 'Формат' },
    'td.bracketType':  { ru: 'Тип сетки',        en: 'Bracket',        kg: 'Тор түрү' },
    'td.category':     { ru: 'Категория',        en: 'Category',       kg: 'Категория' },
    'td.venue':        { ru: 'Место проведения', en: 'Venue',          kg: 'Өткөрүлүүчү жер' },
    'td.navigate':     { ru: 'Навигация',        en: 'Navigate',       kg: 'Навигация' },
    'td.openIn':       { ru: 'Открыть в',        en: 'Open in',        kg: 'Ачуу' },
    'td.description':  { ru: 'Описание',         en: 'Description',    kg: 'Сүрөттөмө' }
  };

  // === Public API ===

  I18N.t = function(key) {
    var entry = T[key];
    if (!entry) return key;
    return entry[_lang] || entry['ru'] || key;
  };

  I18N.setLang = function(lang) {
    _lang = lang;
    localStorage.setItem('kslt_lang', lang);
    I18N.lang = lang;
    I18N.updateDOM();
  };

  I18N.updateDOM = function() {
    var els = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < els.length; i++) {
      var key = els[i].getAttribute('data-i18n');
      var ph = els[i].getAttribute('data-i18n-placeholder');
      if (ph) {
        els[i].placeholder = I18N.t(ph);
      }
      var val = I18N.t(key);
      if (val !== key) {
        els[i].textContent = val;
      }
    }
    // Update placeholders with data-i18n-ph
    var phEls = document.querySelectorAll('[data-i18n-ph]');
    for (var j = 0; j < phEls.length; j++) {
      var phKey = phEls[j].getAttribute('data-i18n-ph');
      phEls[j].placeholder = I18N.t(phKey);
    }
  };

  /**
   * Перевод не из словаря, а из базы.
   *
   * Новости менеджер пишет по-русски, переводы лежат соседними колонками:
   * title_en, title_kg. Пустой перевод показывать нельзя — тогда экран
   * окажется дырявым, поэтому откатываемся на русский.
   */
  I18N.field = function(row, name) {
    if (!row) return '';
    if (_lang !== 'ru' && row[name + '_' + _lang]) return row[name + '_' + _lang];
    return row[name] || '';
  };

  // Month helper
  I18N.month = function(idx) {
    return I18N.t('month.' + idx);
  };

  // Months array (for compatibility)
  I18N.months = function() {
    var arr = [];
    for (var i = 0; i < 12; i++) arr.push(I18N.t('month.' + i));
    return arr;
  };

  I18N.lang = _lang;

})();
