// ========================================
// PLAYERS PAGE — Rendering + Interactivity
// Supabase primary, static data fallback
// ========================================

(function() {
    /** Ячейка NTRP в списке: «4.5 / 4» — одиночный и парный. */
    /** Подпись к числу очков на подиуме — на языке страницы. */
    function подписьОчков() {
        return isEnPage() ? 'pts' : (isKgPage() ? 'упай' : 'очков');
    }

    /** Подпись к столбцу NTRP: в ячейке два числа, надо сказать какие. */
    function ntrpПодпись() {
        return isEnPage() ? 'sng / dbl' : (isKgPage() ? 'жеке / жуп' : 'од. / пар.');
    }

    function ntrpЯчейка(p) {
        var R = window.KSLT_RULES;
        var к = (R && R.ntrpКоротко) ? R.ntrpКоротко(p.ntrp_singles, p.ntrp_doubles) : '';
        return к ? '<span class="pl-ntrp-value">' + к + '</span>'
                 : '<span class="pl-ntrp-na">\u2014</span>';
    }

    /* Нет фото — инициалы, а не запрос на чужой CDN. Заглушка берёт ТОТ ЖЕ
       класс, что и фотография, поэтому размер и скругление у них общие —
       второго объявления не появляется. Avatar 29:82. */
    function инициалы(имя) {
        return (имя || '').trim().split(/\s+/).slice(0, 2)
            .map(function (ч) { return ч.charAt(0); }).join('');
    }
    function лицо(p, класс, alt) {
        return p.photo
            ? '<img src="' + esc(p.photo) + '" alt="' + esc(alt || '') + '" class="' + класс + '">'
            : '<span class="' + класс + ' avatar-initials" aria-hidden="true">'
              + esc(инициалы(p.name)) + '</span>';
    }

    function esc(str) {
        if (!str) return '';
        return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    }

    var PER_PAGE = 10;
    var CAT_PER_PAGE = 20;
    var currentTab = 'men-promasters';
    var currentPage = 1;
    var searchQuery = '';
    var catSearchQuery = '';
    var debounceTimer = null;
    var isCategoryMode = false;
    var catCurrentPage = 1;
    var _accessLevel = 'guest'; // guest | registered | member
    var _catObserver = null;
    var _catListenersReady = false;

    var GUEST_VISIBLE_ROWS = 8;
    var GUEST_BLURRED_ROWS = 4;
    // В поиске открытых строк меньше: этого хватает, чтобы человек узнал
    // того, кого искал, а остальное остаётся поводом завести аккаунт
    var GUEST_SEARCH_VISIBLE = 3;
    var GUEST_CAT_VISIBLE = 8;
    var GUEST_CAT_BLURRED = 4;

    var CU = window.KSLT_COUNTRY;

    // Will be populated from Supabase or static
    var categoriesData = {};

    function isLoggedIn() {
        try {
            var key = 'sb-qqkzszesviukopgjbead-auth-token';
            var raw = localStorage.getItem(key);
            if (!raw) return false;
            var session = JSON.parse(raw);
            if (session && session.access_token && session.expires_at) {
                return session.expires_at > Math.floor(Date.now() / 1000);
            }
        } catch (e) {}
        return false;
    }

    // Badge data loaded from Supabase (player_id → [{badge_id, icon, name}])
    var _badgesByPlayer = {};
    var _badgeDefsMap = {};

    // ========================================
    // HELPERS
    // ========================================

    /**
     * Подписи страницы рейтинга на трёх языках.
     *
     * Раньше здесь ждали `window.playersLabels`, но такой переменной нет ни на
     * одной странице — и рейтинг на английской и киргизской версиях выводил
     * всё по-русски: «373 игроков», «Мужчины», «Показать всех».
     *
     * Слова взяты те же, что в таблице рейтинга на главной: игрок должен
     * видеть одну и ту же подпись в обоих местах.
     */
    function getLabels() {
        var isEn = isEnPage();
        var isKg = isKgPage();

        if (isEn) return {
            title: 'KSLT Rankings',
            subtitle: 'Season 2026',
            statPlayers: 'players', statOnline: 'online',
            searchPlaceholder: 'Search player...',
            men: 'Men', women: 'Women',
            rank: '#', player: 'Player', country: 'Ctry', points: 'Pts',
            record: 'W/L', form: 'Form', change: '\u0394',
            actions: 'Challenge', ntrp: 'NTRP', online: 'Online',
            message: 'Message', challenge: 'Challenge',
            prevPage: '\u2190 Back', nextPage: 'Next \u2192',
            shownOf: 'of', pageOf: 'of',
            viewAll: 'Show all',
            noResults: 'No players found',
            guestTitle: 'Sign up for full access',
            guestText: 'Full rankings, player profiles and statistics open after registration',
            guestBtn: 'Sign in / Sign up',
            catPageBack: 'Back to rankings',
        };

        if (isKg) return {
            title: 'KSLT рейтинги',
            subtitle: '2026-сезон',
            statPlayers: 'оюнчу', statOnline: 'онлайн',
            searchPlaceholder: 'Оюнчуну издөө...',
            men: 'Эркектер', women: 'Аялдар',
            rank: '#', player: 'Оюнчу', country: 'Өлк.', points: 'Упай',
            record: 'Ж/Ж', form: 'Форма', change: '\u0394',
            actions: 'Чакыруу', ntrp: 'NTRP', online: 'Онлайн',
            message: 'Жазуу', challenge: 'Чакыруу',
            prevPage: '\u2190 Артка', nextPage: 'Кийинки \u2192',
            shownOf: 'ичинен', pageOf: 'ичинен',
            viewAll: 'Баарын көрсөтүү',
            noResults: 'Оюнчулар табылган жок',
            guestTitle: 'Толук кирүү үчүн катталыңыз',
            guestText: 'Толук рейтинг, оюнчулардын профилдери жана статистикасы каттоодон кийин ачылат',
            guestBtn: 'Кирүү / Катталуу',
            catPageBack: 'Рейтингге кайтуу',
        };

        return {
            title: 'Рейтинг KSLT',
            subtitle: 'Сезон 2026',
            statPlayers: 'игроков', statOnline: 'онлайн',
            searchPlaceholder: 'Поиск игрока...',
            men: 'Мужчины', women: 'Женщины',
            rank: '#', player: 'Игрок', country: 'Стр.', points: 'Очки',
            record: 'В/П', form: 'Форма', change: '\u0394',
            actions: 'Вызов', ntrp: 'NTRP', online: 'Онлайн',
            message: 'Написать', challenge: 'Вызов',
            prevPage: '\u2190 Назад', nextPage: 'Далее \u2192',
            shownOf: 'из', pageOf: 'из',
            viewAll: 'Показать всех',
            noResults: 'Игроки не найдены',
            guestTitle: 'Зарегистрируйтесь для полного доступа',
            guestText: 'Полный рейтинг, профили игроков и статистика доступны после регистрации',
            guestBtn: 'Войти / Регистрация',
            catPageBack: 'Назад к рейтингу',
        };
    }

    function searchLockedTitle() {
        if (isEnPage()) return 'Sign in to see all results';
        if (isKgPage()) return 'Бардык натыйжаларды көрүү үчүн кириңиз';
        return 'Войдите, чтобы увидеть всех найденных';
    }

    // Вторая строка не повторяет заголовок, а добавляет: что именно
    // откроется после входа
    function hiddenFoundText() {
        if (isEnPage()) return 'Player profiles and statistics open after sign-in';
        if (isKgPage()) return 'Оюнчулардын профилдери жана статистикасы кирүүдөн кийин ачылат';
        return 'Профили игроков и статистика открываются после входа';
    }

    function isEnPage() {
        return window.location.pathname.indexOf('-en') !== -1;
    }

    function isKgPage() {
        return window.location.pathname.indexOf('-kg') !== -1;
    }

    function getAuthUrl() {
        return isEnPage() ? 'auth-en.html' : (isKgPage() ? 'auth-kg.html' : 'auth.html');
    }

    function getBadgeTooltip(badgeId) {
        var def = _badgeDefsMap[badgeId];
        if (!def) return badgeId;
        return isEnPage() ? (def.name_en || def.name) : (isKgPage() ? (def.name_kg || def.name) : def.name);
    }

    function getPlayerBadgesHtml(playerId, maxCount) {
        var badges = _badgesByPlayer[playerId];
        if (!badges || badges.length === 0) return '';
        var html = '';
        var show = badges.slice(0, maxCount || 5);
        for (var i = 0; i < show.length; i++) {
            var b = show[i];
            html += '<span class="pl-badge" title="' + esc(getBadgeTooltip(b.badge_id)) + '">' + (b.icon || '') + '</span>';
        }
        return html;
    }

    /**
     * Все игроки — по людям, а не по строкам рейтинга.
     *
     * Один человек стоит сразу в нескольких категориях: в Masters со своими
     * очками, в Tour со своими. Для таблицы это разные строки и смешивать их
     * нельзя, а для счётчика в шапке — один игрок. Раньше списки категорий
     * просто склеивались, и в шапке выходило 515 при 374 живых карточках.
     *
     * Гостей в списках нет вовсе: их отсеивает загрузчик рейтинга. А те, кто
     * зарегистрировался и ещё не играл, считаются — они уже игроки клуба.
     */
    function getAllPlayers() {
        var all = [];
        var виденные = {};
        for (var key in categoriesData) {
            if (!categoriesData.hasOwnProperty(key)) continue;
            var список = categoriesData[key].players || [];
            for (var i = 0; i < список.length; i++) {
                var игрок = список[i];
                var id = игрок && игрок.id;
                if (id) {
                    if (виденные[id]) continue;
                    виденные[id] = true;
                }
                all.push(игрок);
            }
        }
        return all;
    }

    function countOnline() {
        var count = 0;
        var all = getAllPlayers();
        for (var i = 0; i < all.length; i++) {
            if (all[i].online) count++;
        }
        return count;
    }

    /**
     * У женщин три категории: Masters, Tour и Futures — так у клуба.
     * Pro-Masters и Challengers женскими не бывают, и показывать их пустыми
     * нельзя: человек решит, что туда просто некого записать.
     */
    // Какие разряды у женщин — в общем своде правил (js/kslt-rules.js),
    // оттуда же их берёт приложение. Раньше список лежал здесь, а в
    // приложении свой, и они разошлись
    function isWomenCategory(key) {
        var R = window.KSLT_RULES;
        if (!R) return false;
        var parts = R.splitKey(key);
        return parts.gender === 'women' && R.allowsCategory('women', parts.id);
    }

    function getCategory(tab) {
        return categoriesData[tab] || categoriesData['men-promasters'] || { players: [] };
    }

    function getFilteredPlayers(tab) {
        var cat = getCategory(tab);
        if (!searchQuery) return cat.players || [];
        var q = searchQuery.toLowerCase();
        var results = [];
        for (var key in categoriesData) {
            if (!categoriesData.hasOwnProperty(key)) continue;
            var c = categoriesData[key];
            var players = c.players || [];
            for (var i = 0; i < players.length; i++) {
                var p = players[i];
                if (p.name.toLowerCase().indexOf(q) !== -1) {
                    results.push({
                        player: p,
                        categoryKey: key,
                        categoryName: c.name,
                        rankInCategory: i + 1
                    });
                }
            }
        }
        return results;
    }

    var isSearchMode = false;

    // ========================================
    // ACCESS LEVEL DETECTION
    // ========================================

    async function detectAccess() {
        var client = window.supabaseClient;
        if (!client) { _accessLevel = 'guest'; return; }

        var loggedIn = false;
        try {
            var res = await client.auth.getSession();
            if (res.data && res.data.session) loggedIn = true;
        } catch(e) {}

        if (!loggedIn) { _accessLevel = 'guest'; return; }

        _accessLevel = 'registered';

        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) _accessLevel = 'member';
            } catch(e) {}
        }
    }

    // ========================================
    // LOAD BADGES FROM SUPABASE
    // ========================================

    async function loadBadgesFromSupabase() {
        if (!window.supabaseClient) return;
        var client = window.supabaseClient;
        try {
            // Load badge definitions
            var defsRes = await client.from('badge_definitions').select('*');
            if (defsRes.data) {
                defsRes.data.forEach(function(d) { _badgeDefsMap[d.id] = d; });
            }
            // Load all player badges
            var pbRes = await client.from('player_badges')
                .select('player_id, badge_id, badge:badge_definitions(icon)')
                .order('earned_at', { ascending: true });
            if (pbRes.data) {
                pbRes.data.forEach(function(pb) {
                    if (!_badgesByPlayer[pb.player_id]) _badgesByPlayer[pb.player_id] = [];
                    _badgesByPlayer[pb.player_id].push({
                        badge_id: pb.badge_id,
                        icon: pb.badge ? pb.badge.icon : ''
                    });
                });
            }
        } catch(e) {
            console.warn('[KSLT] badges load error:', e);
        }
    }

    // ========================================
    // SUPABASE DATA LOADER
    // ========================================

    /**
     * Данные рейтинга живут в отдельном файле: их же читает блок «Топ
     * рейтинга» на главной. Одна логика на двоих — иначе однажды разойдутся.
     */
    async function loadFromSupabase() {
        if (!window.KSLT_RANKINGS) return null;
        return window.KSLT_RANKINGS.load();
    }

    function loadStaticData() {
        if (typeof playersData !== 'undefined' && playersData.categories) {
            return playersData.categories;
        }
        return {};
    }

    // ========================================
    // INIT
    // ========================================

    document.addEventListener('DOMContentLoaded', async function() {
        // Load badges + players in parallel from Supabase
        var results = await Promise.all([loadFromSupabase(), loadBadgesFromSupabase()]);
        var dbData = results[0];
        if (dbData && Object.keys(dbData).length > 0) {
            categoriesData = dbData;
        } else {
            categoriesData = loadStaticData();
        }

        var params = new URLSearchParams(window.location.search);
        var tabParam = params.get('tab');

        // Прямая ссылка на женские Pro-Masters или Challengers ведёт в
        // Masters: таких категорий у женщин нет
        if (tabParam && tabParam.indexOf('women-') === 0 && !isWomenCategory(tabParam)) {
            tabParam = 'women-masters';
        }

        // Category page mode: ?tab=men-tour → full page for that category
        if (tabParam && categoriesData[tabParam]) {
            isCategoryMode = true;
            currentTab = tabParam;
            await detectAccess();
            renderCategoryPage(tabParam);
            return;
        }

        // Overview mode (no ?tab or invalid tab)
        var firstKey = Object.keys(categoriesData)[0];
        if (firstKey) currentTab = firstKey;

        renderHero();
        renderFilters();
        renderPodium(currentTab);
        renderTable(currentTab, 1);
        initTabs();
        initSearch();
        initScrollAnimations();
    });

    // ========================================
    // HERO
    // ========================================

    function renderHero() {
        var container = document.getElementById('playersHero');
        if (!container) return;

        var labels = getLabels();
        // Число игроков берём у загрузчика: он считает карточки клуба целиком,
        // включая тех, кто записался и ещё не играл — в разряды они не попадают
        var поКарточкам = window.KSLT_RANKINGS && window.KSLT_RANKINGS.всегоИгроков;
        var totalPlayers = поКарточкам || getAllPlayers().length;
        var onlineCount = countOnline();
        /* НА ОБЛОЖКЕ РЕЙТИНГА ЧИСЕЛ НЕТ — слово Кости 06.10: сперва
           «онлайн убери, смысла нет», потом «391 игроков — убери тоже,
           числа не надо». Обложка называет раздел и сезон; числа живут
           там, где по ним принимают решение, — в самом списке. */
        container.innerHTML =
            '<div class="pl-hero-bg"></div>' +
            '<div class="pl-hero-overlay"></div>' +
            '<div class="pl-hero-content">' +
                '<h1 class="pl-hero-title">' + labels.title + '</h1>' +
                '<p class="pl-hero-subtitle">' + labels.subtitle + '</p>' +
                /* ОНЛАЙН С РЕЙТИНГА СНЯТ — слово Кости 06.10: «смысла нет
                   там это отображать». Рейтинг отвечает на вопрос «кто
                   где стоит», а не «кто сейчас в сети». Счётчик онлайна
                   остаётся в коде: он нужен точке в списке. */
            '</div>';
    }

    // ========================================
    // PODIUM (Top 3)
    // ========================================

    function renderPodium(tab, instant) {
        var container = document.getElementById('playersPodium');
        if (!container) return;

        var cat = getCategory(tab);
        var players = cat.players || [];
        var top3 = players.slice(0, 3);
        var medals = ['\ud83e\udd47', '\ud83e\udd48', '\ud83e\udd49'];
        /* РАЗМЕТКА ИДЁТ ПО МЕСТАМ: 1 – 2 – 3. Порядок на экране (2 – 1 – 3)
           задаёт css свойством order — см. css/podium.css. 24.09 */
        var order = [0, 1, 2];
        var placeClass = ['pl-podium-first', 'pl-podium-second', 'pl-podium-third'];

        var animClasses = instant ? 'pl-animate pl-visible' : 'pl-animate';

        var html = '<div class="pl-podium">';
        for (var oi = 0; oi < order.length; oi++) {
            var i = order[oi];
            if (!top3[i]) continue;
            var p = top3[i];
            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            html += '<div class="pl-podium-card ' + placeClass[i] + ' ' + animClasses + '">' +
                '<div class="pl-podium-medal">' + medals[i] + '</div>' +
                '<div class="pl-podium-photo-wrap">' +
                    лицо(p, 'pl-podium-photo', p.name) +
                    (p.online ? '<span class="pl-online-dot pl-online-pulse"></span>' : '') +
                '</div>' +
                /* ТУМБА — ЭТО КОРОБКА, А НЕ ПОЛОСА ПОД КАРТОЧКОЙ.
                   До 24.09 тумбу рисовал ::after с жёсткой высотой, и её
                   верхняя грань резала фамилию пополам, как только имя
                   ложилось в две строки. Теперь имя и очки лежат ВНУТРИ
                   тумбы, а лесенку держит её верхнее поле. */
                '<div class="pl-podium-base">' +
                    '<div class="pl-podium-name">' + p.name + '</div>' +
                    '<div class="pl-podium-points">' + p.points.toLocaleString() + ' ' + подписьОчков() + '</div>' +
                    (badgesHtml ? '<div class="pl-podium-badges">' + badgesHtml + '</div>' : '') +
                '</div>' +
            '</div>';
        }
        html += '</div>';
        container.innerHTML = html;
    }

    // ========================================
    // FILTERS (Gender Tabs + Category Pills)
    // ========================================

    function renderFilters() {
        var container = document.getElementById('playersFilters');
        if (!container) return;

        var labels = getLabels();
        var currentGender = currentTab.split('-')[0];

        var menCats = [];
        var womenCats = [];
        for (var key in categoriesData) {
            if (categoriesData.hasOwnProperty(key)) {
                var cat = categoriesData[key];
                if (cat.gender === 'men') menCats.push({ key: key, name: cat.name });
                else if (isWomenCategory(key)) womenCats.push({ key: key, name: cat.name });
            }
        }

        /* ФИЛЬТР ПОЛА ВЕРНУЛСЯ. 06.10 я снял его вместе с поиском и свёл оба
           пола в один ряд пилюль — и получил «Masters» и «Tour» дважды, без
           признака, какой из них женский. Слово Кости: «где муж и жен
           фильтр». Снятым остаётся только поиск, о чём и была просьба.
           Рейтинг ведётся только в одиночном разряде: парные и микст очков не
           начисляют, поэтому переключателя разрядов здесь нет и не было. */
        var html = '<div class="pl-gender-tabs">' +
            '<button class="pl-gender-tab' + (currentGender === 'men' ? ' active' : '') + '" data-gender="men">' + labels.men + '</button>' +
            '<button class="pl-gender-tab' + (currentGender === 'women' ? ' active' : '') + '" data-gender="women">' + labels.women + '</button>' +
        '</div>';

        /* РАСКЛАДКА ОБЗОРНОЙ НЕ ТРОГАЕТСЯ. 06.10 я снял отсюда поиск и чипы
           пола, а просьба была другая: «проверить размеры и раскладку
           оставить, привести к стандартам». Состав экрана вернулся к
           исходному — поиск, чипы пола и пилюли разрядов на своих местах;
           менялись только размеры и ступени. */
        /* ПОИСКОВОЙ СТРОКИ НА ОБЗОРНОЙ НЕТ. Слово Кости сказано трижды:
           «на обзорной убери, там всё равно обрезанная версия стоит»,
           «поисковая строка не нужна», «поисковая строка — сколько раз
           можно писать». Фильтр пола и пилюли разрядов при этом остаются:
           их снятие было моей отсебятиной, и оно откачено.
           Поиск по игрокам живёт на отдельной странице. */
        html += '<div class="pl-category-row">';
        html += '<div class="pl-category-pills" id="categoryPills">';
        var cats = currentGender === 'men' ? menCats : womenCats;
        for (var i = 0; i < cats.length; i++) {
            html += '<button class="pl-category-pill' + (cats[i].key === currentTab ? ' active' : '') + '" data-tab="' + cats[i].key + '">' + cats[i].name + '</button>';
        }
        html += '</div>';
        var playersPage = isEnPage() ? 'players-en.html' : (isKgPage() ? 'players-kg.html' : 'players.html');
        html += '<a href="' + playersPage + '?tab=' + currentTab + '" class="pl-view-all">' + labels.viewAll + ' <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg></a>';
        html += '</div>';

        container.innerHTML = html;
    }

    // ========================================
    // TABLE
    // ========================================

    function renderTable(tab, page) {
        var container = document.getElementById('playersTable');
        if (!container) return;

        var labels = getLabels();
        var filtered = getFilteredPlayers(tab);
        isSearchMode = !!searchQuery;

        var items = filtered;
        var pageItems = isSearchMode ? items : items.slice(0, PER_PAGE);

        var podiumEl = document.getElementById('playersPodium');
        var filtersEl = document.getElementById('playersFilters');
        if (podiumEl) podiumEl.style.display = isSearchMode ? 'none' : '';
        if (filtersEl) {
            filtersEl.style.display = '';
            filtersEl.classList.toggle('pl-filters-searching', isSearchMode);
        }
        if (container) container.style.paddingBottom = isSearchMode ? '16px' : '';

        if (pageItems.length === 0) {
            container.innerHTML = '<div class="pl-no-results">' + labels.noResults + '</div>';
            renderPagination(0, 1);
            return;
        }

        var logged = isLoggedIn();
        var isGuest = !logged;
        var clearRows = isSearchMode ? GUEST_SEARCH_VISIBLE : GUEST_VISIBLE_ROWS;
        var totalVisible = isGuest ? Math.min(pageItems.length, clearRows + GUEST_BLURRED_ROWS) : pageItems.length;

        /* ТАБЛИЦА РЕЙТИНГА — ОДНА НА ДВА ЭКРАНА. Слово Кости 06.10: «таблицу
           надо было привести к стандарту как на обзорной». Было две: 1100 с
           девятью колонками здесь и 860 с семью на разряде — шестнадцать
           чисел ширин, заведённых дважды. Теперь состав ячеек один, сетка
           объявлена один раз в css, а ширина у обеих 1100.
           «ОНЛАЙН» СНЯТА С ОБЕИХ — слово Кости: «онлайн можно убрать, она не
           нужна на рейтингах». Колонка действий живёт только у вошедшего и
           только здесь, поэтому она не в общем наборе, а пристраивается
           классом: восемь колонок объявлены один раз, девятая дописывается. */
        var html = '<div class="pl-table' + (logged ? ' pl-table-actions' : '') + '">';

        // Header
        html += '<div class="pl-row pl-row-header">' +
            '<span class="pl-col-rank">' + labels.rank + '</span>' +
            '<span class="pl-col-player">' + labels.player + '</span>' +
            '<span class="pl-col-country">' + labels.country + '</span>' +
            '<span class="pl-col-ntrp">' + (labels.ntrp || 'NTRP') +
                '<span class="pl-col-sub">' + ntrpПодпись() + '</span></span>' +
            '<span class="pl-col-points">' + labels.points + '</span>' +
            '<span class="pl-col-record">' + labels.record + '</span>' +
            '<span class="pl-col-form">' + labels.form + '</span>' +
            '<span class="pl-col-change">' + labels.change + '</span>' +
            (logged ? '<span class="pl-col-actions">' + labels.actions + '</span>' : '') +
        '</div>';

        // Место в рейтинге получают только члены клуба: иначе первым в
        // таблице оказывается тот, кто в клубе не состоит, и она перестаёт
        // отвечать на вопрос «кто первый в КСЛТ». Фоновым — прочерк
        var memberRank = 0;
        var rankByPlayer = {};
        if (!isSearchMode) {
            items.forEach(function(pl) {
                if (pl.isMember !== false) { memberRank++; rankByPlayer[pl.id] = memberRank; }
            });
        }

        // Rows
        for (var i = 0; i < totalVisible; i++) {
            var item = pageItems[i];
            var p = isSearchMode ? item.player : item;
            var rank = isSearchMode ? item.rankInCategory : (rankByPlayer[p.id] || null);
            var rankClass = rank && rank <= 3 ? ' pl-rank-top' : '';

            var blurClass = '';
            if (isGuest && i >= clearRows) {
                var blurLevel = i - clearRows + 1;
                blurClass = ' pl-row-blur pl-row-blur-' + blurLevel;
            }

            // Фоновая карточка — человек есть в списках клуба, но членство
            // не оплачено. Показываем приглушённо: строка видна, играть с
            // ним нельзя. Место в рейтинге такие не занимают
            var isBg = p.isMember === false;
            if (isBg) blurClass += ' pl-row-guest';

            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            var catLabel = isSearchMode ? '<span class="pl-player-category">' + item.categoryName + '</span>' : '';

            var pForm = p.form || [];
            var formHtml = '';
            for (var f = 0; f < pForm.length; f++) {
                formHtml += '<span class="pl-form-dot ' + (pForm[f] === 'W' ? 'pl-form-win' : 'pl-form-loss') + '"></span>';
            }

            var changeHtml = '';
            if (p.change > 0) {
                changeHtml = '<span class="pl-change-up">\u2191' + p.change + '</span>';
            } else if (p.change < 0) {
                changeHtml = '<span class="pl-change-down">\u2193' + Math.abs(p.change) + '</span>';
            } else {
                changeHtml = '<span class="pl-change-neutral">\u2014</span>';
            }

            var actionsHtml = '';
            // Звать можно только того, у кого есть учётная запись: карточка
            // из списков клуба вызова не получит — по ту сторону никого нет.
            // Ведём на карточку игрока: там кнопка вызова и работает
            if (logged && p.hasAccount) {
                var картаИгрока = (isEnPage() ? 'player-en.html' : (isKgPage() ? 'player-kg.html' : 'player.html')) + '?id=' + p.id;
                if (p.online) {
                    actionsHtml += '<a href="' + картаИгрока + '" class="pl-btn-message" title="' + labels.message + '">\u2709\ufe0f</a>';
                }
                actionsHtml += '<a href="' + картаИгрока + '" class="pl-btn-challenge" title="' + labels.challenge + '">\u2694\ufe0f</a>';
            }

            html += '<div class="pl-row pl-animate' + blurClass + '" style="transition-delay:' + Math.min(i * 30, 300) + 'ms">' +
                '<span class="pl-col-rank' + rankClass + '">' + (rank || '\u2014') + '</span>' +
                '<div class="pl-col-player">' +
                    лицо(p, 'pl-player-photo') +
                    '<div class="pl-player-info">' +
                        '<div class="pl-player-name-row">' +
                            (isGuest
                                ? '<a href="#" class="pl-player-name" data-guest-profile="1">' + p.name + '</a>'
                                : '<a href="' + (isEnPage() ? 'player-en.html' : (isKgPage() ? 'player-kg.html' : 'player.html')) + '?id=' + p.id + '" class="pl-player-name">' + p.name + '</a>') +
                            (badgesHtml ? '<span class="pl-player-badges">' + badgesHtml + '</span>' : '') +
                            (isBg ? '<span class="pl-guest-mark" title="' +
                                (isEnPage() ? 'In the club database, membership not paid' : (isKgPage() ? 'Клубдун базасында бар, мүчөлүк төлөнгөн эмес' : 'Есть в базе клуба, членство не оплачено')) + '">' +
                                (isEnPage() ? 'not a member' : (isKgPage() ? 'мүчө эмес' : 'не член клуба')) + '</span>' : '') +
                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + (isEnPage() ? 'Banned' : (isKgPage() ? 'Бөгөт.' : 'Заблок.')) + '</span>' : '') +
                        '</div>' +
                        catLabel +
                    '</div>' +
                '</div>' +
                '<span class="pl-col-country">' + p.country + '</span>' +
                '<span class="pl-col-ntrp">' + ntrpЯчейка(p) + '</span>' +
                '<span class="pl-col-points">' + p.points.toLocaleString() + '</span>' +
                '<span class="pl-col-record">' + p.wins + '/' + p.losses + '</span>' +
                '<span class="pl-col-form">' + formHtml + '</span>' +
                '<span class="pl-col-change">' + changeHtml + '</span>' +
                (logged ? '<span class="pl-col-actions">' + actionsHtml + '</span>' : '') +
            '</div>';
        }

        html += '</div>';

        // Guest CTA banner
        if (isGuest && pageItems.length > clearRows) {
            var authUrl = getAuthUrl();
            var ctaTitle = isSearchMode ? searchLockedTitle() : labels.guestTitle;
            var ctaText = isSearchMode ? hiddenFoundText() : labels.guestText;
            html += '<div class="pl-guest-overlay">' +
                '<div class="pl-guest-cta">' +
                    '<div class="pl-guest-icon">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                            '<circle cx="12" cy="16" r="1"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h3 class="pl-guest-title">' + ctaTitle + '</h3>' +
                    '<p class="pl-guest-text">' + ctaText + '</p>' +
                    '<a href="' + authUrl + '" class="pl-guest-btn">' + labels.guestBtn + '</a>' +
                '</div>' +
            '</div>';
        }

        container.innerHTML = html;

        initScrollAnimations();
    }

    // ========================================
    // PAGINATION
    // ========================================

    /* ОДНА ПОЛОСА СТРАНИЦ НА ДВА ЭКРАНА.
       До 06.10 её рисовали ДВЕ копии кода — `renderPagination` для обзорной
       и `renderCatPaginationUI` для категории, — и различались они ровно
       одним: шагом страницы (10 против 20). Одно определение на одно
       понятие; беда родилась бы ровно на шве между копиями.

       ОКНО, А НЕ ВСЕ СТРАНИЦЫ ПОДРЯД. 391 игрок при шаге 10 — это сорок
       кнопок в строку: на телефоне они занимали шесть ряд­ов и полоса
       страниц становилась выше самой страницы. ATP, WTA и ITF показывают
       окно: первая, многоточие, сосед­и текущей, многоточие, последняя.
       Окно считается, а не рисуется наугад: всегда видно не больше семи
       номеров, и первая с последней видны всегда. */
    function полосаСтраниц(total, page, шаг) {
        var container = document.getElementById('playersPagination');
        if (!container) return;

        var всего = Math.max(1, Math.ceil(total / шаг));
        if (всего <= 1) {
            container.innerHTML = '';
            return;
        }

        page = Math.min(Math.max(1, page), всего);
        var labels = getLabels();

        /* Какие номера показываем: первая, последняя, текущая и по соседу с
           каждой стороны. Многоточие ставится там, где между соседями
           остался разрыв больше одной страницы. */
        /* ОКНО УЗКОГО ВИДА УЖЕ НА ОДНУ СТУПЕНЬ — ЭТО ПОСЧИТАНО, А НЕ НА ГЛАЗ.
           Замер 06.10 на стенде `maket/polosa-stranic-zamer.html`, крайний
           случай «40 страниц, два многоточия»: при соседях ±1 полоса просит
           364 при ряде 343 на телефоне 375 — перелив 21 даже после того, как
           кнопки сели на ступень 36. Соседи ±0 (первая · … · текущая · … ·
           последняя) просят 276 из 343. На всех остальных видах окно
           прежнее. */
        var узкий = window.matchMedia && window.matchMedia('(max-width: 640px)').matches;
        var соседей = 1;
        var номера = [];
        for (var n = 1; n <= всего; n++) {
            if (n === 1 || n === всего || Math.abs(n - page) <= соседей) номера.push(n);
        }

        /* ШЕВРОН, А НЕ СЛОВО — ТАК НАПИСАНО В КОМПОНЕНТЕ `Pagination item
           31:43`: «Previous and next reuse this component with a chevron
           instead of a number». Слово «Назад» просило 66 на широких видах и
           сжималось до 44 на телефоне, обрезая само себя. Слово не теряется:
           оно уходит в `aria-label`, диктор читает его целиком. */
        var шеврон = function (влево) {
            return '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" ' +
                'stroke="currentColor" stroke-width="2" aria-hidden="true">' +
                '<path d="' + (влево ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6') + '"/></svg>';
        };

        /* СЧЁТЧИК ОБЯЗАТЕЛЕН, А НЕ УКРАШЕНИЕ. Правило отрасли, а не мой вкус:
           Elastic EUI, «Always present a clear indicator of how many results
           have been returned». У нас его не было вовсе: человек видел кнопки
           страниц и не знал, сколько всего строк. Счётчик слева, страницы
           справа — ровно так устроен и компонент `Pagination row 115:171`. */
        var первый = (page - 1) * шаг + 1;
        var последний = Math.min(page * шаг, total);

        /* НА УЗКОМ ВИДЕ — СЖАТАЯ ФОРМА, А НЕ УЗКОЕ ОКНО. Та же EUI: numbered
           для малых наборов, compressed для больших. Сорок номеров в ряд 343
           не влезают ни при каком окне; «20 из 40» между стрелками влезает
           всегда и говорит больше, чем три номера с многоточиями. */
        var html = '<div class="pl-pagination">';
        html += '<span class="pl-page-count">' + первый + '\u2013' + последний +
            ' ' + labels.shownOf + ' ' + total + '</span>';
        html += '<div class="pl-pagination-pages">';
        html += '<button class="pl-page-btn pl-page-prev" aria-label="' +
            esc(labels.prevPage.replace(/[\u2190\u2192]/g, '').trim()) + '"' +
            (page === 1 ? ' disabled' : '') + '>' + шеврон(true) + '</button>';

        if (узкий) {
            html += '<span class="pl-page-now">' + page + ' ' + labels.pageOf +
                ' ' + всего + '</span>';
        }

        var прошлый = 0;
        if (!узкий) номера.forEach(function (n) {
            if (прошлый && n - прошлый > 1) {
                html += '<span class="pl-page-gap" aria-hidden="true">…</span>';
            }
            html += '<button class="pl-page-btn pl-page-num' +
                (n === page ? ' active' : '') + '" data-page="' + n + '"' +
                (n === page ? ' aria-current="page"' : '') + '>' + n + '</button>';
            прошлый = n;
        });

        html += '<button class="pl-page-btn pl-page-next" aria-label="' +
            esc(labels.nextPage.replace(/[\u2190\u2192]/g, '').trim()) + '"' +
            (page === всего ? ' disabled' : '') + '>' + шеврон(false) + '</button>';
        html += '</div></div>';

        container.innerHTML = html;
    }

    function renderPagination(total, page) {
        полосаСтраниц(total, page, PER_PAGE);
    }

    function renderCatPaginationUI(total, page) {
        полосаСтраниц(total, page, CAT_PER_PAGE);
    }

    // ========================================
    // SPONSORS — loaded via sponsors-loader.js
    // ========================================

    // ========================================
    // CATEGORY PAGE MODE
    // ========================================

    async function renderCategoryPage(tabId) {
        // Cleanup previous observer/sentinel
        if (_catObserver) { _catObserver.disconnect(); _catObserver = null; }
        document.querySelectorAll('.pl-cat-sentinel').forEach(function(el) { el.remove(); });

        currentTab = tabId;
        catSearchQuery = '';
        catCurrentPage = 1;

        var cat = getCategory(tabId);
        var labels = getLabels();
        var isEn = isEnPage();
        var isKg = isKgPage();
        var playersPage = isEn ? 'players-en.html' : (isKg ? 'players-kg.html' : 'players.html');

        // Extract base category ID (e.g. "men-promasters" → "promasters")
        var baseCatId = tabId.indexOf('-') !== -1 ? tabId.split('-').slice(1).join('-') : tabId;

        /* ЗАПРОС, РЕЗУЛЬТАТ КОТОРОГО НЕ ПОКАЗЫВАЕТСЯ, — ЭТО ПОТРАЧЕННАЯ
           КВОТА. Здесь считалось число завершённых турниров категории
           ОДНИМ запросом к базе на каждую загрузку страницы, и единственным
           его потребителем была плашка на обложке. Плашек на обложке больше
           нет (слово Кости 06.10), значит и запроса быть не должно. */
        renderCatHero(cat, labels, playersPage);

        var hasWomenHalf = isWomenCategory('women-' + baseCatId);

        // Пьедестал тройки — такой же, как на главной странице рейтинга.
        // Раньше на страницах категорий он прятался, и первое, что видел
        // человек, был безликий список
        var podiumEl = document.getElementById('playersPodium');
        if (podiumEl) {
            podiumEl.style.display = '';
            renderPodium(tabId, true);
        }

        // Render sticky category bar in filters section (back link + name + search — all inline)
        var filtersEl = document.getElementById('playersFilters');
        if (filtersEl) {
            // Полоса та же, что на турнирах, кортах и тренерах: ссылка назад,
            // поиск и название — одной строкой. Раньше они стояли на трёх
            // разных уровнях и не совпадали ни с чем на странице
            /* ПОЛОСА РАЗРЯДА — ТОТ ЖЕ КОМПОНЕНТ, ЧТО СТРОКА ФИЛЬТРОВ НА
               ОБЗОРНОЙ. Слово Кости 06.10: «мне не нравится раскладка
               фильтра и поисковой строки и назад», «они должны быть
               одинаковыми по ширине и содержанию — приведи как с обзорной
               стр рейтинга», «обзорная уже есть на всех видах, не
               придумывай — отталкивайся от неё».
               Было два разных компонента: здесь `trn-filters` в ОДИН ряд
               (назад и поиск слева, чипы втиснуты в середину, имя у правого
               края), а на обзорной — чипы отдельным рядом по центру плюс
               `pl-category-row`. Ни ширина, ни состав не совпадали.
               Теперь это буквально те же классы: `pl-gender-tabs` сверху и
               `pl-category-row` снизу — ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ,
               раскладку и ступени держит один набор правил на два экрана. */
            filtersEl.className = 'pl-filters-section pl-cat-mode';
            filtersEl.innerHTML =
                // Переключатель пола показываем только там, где есть обе
                // половины: женских Pro-Masters и Challengers у клуба нет
                (hasWomenHalf ? '<div class="pl-gender-tabs">' +
                    '<button class="pl-gender-tab' + (cat.gender === 'men' ? ' active' : '') + '" data-gender="men">' +
                        (isEnPage() ? 'Men' : (isKgPage() ? 'Эркектер' : 'Мужчины')) + '</button>' +
                    '<button class="pl-gender-tab' + (cat.gender === 'women' ? ' active' : '') + '" data-gender="women">' +
                        (isEnPage() ? 'Women' : (isKgPage() ? 'Аялдар' : 'Женщины')) + '</button>' +
                '</div>' : '') +
                '<div class="pl-category-row">' +
                    '<a href="' + playersPage + '" class="kslt-back trn-back pl-cat-back">\u2190 ' + labels.catPageBack + '</a>' +
                    /* ПОИСК В ПОЛОСЕ РАЗРЯДА ЕСТЬ — слово Кости 06.10, второе и
                       окончательное: «тут у нас уже должна быть поисковая
                       строка — на стр категории рейтинга сюда надо будет
                       вернуть». На разряде список полный, искать по нему
                       есть что; убрана поисковая строка только с обзорной,
                       где видно первые десять строк. */
                    '<div class="trn-search-wrap">' +
                        '<svg class="trn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                        '<input type="text" class="trn-search-input" id="catSearchSticky" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
                    '</div>' +
                    // Название НЕ снимается: при прокрутке обложки уже не
                    // видно, и полоса остаётся единственным местом, которое
                    // говорит, в каком ты разряде
                    '<span class="trn-cat-name">' + esc(cat.name) + '</span>' +
                '</div>';

            // Sentinel before filters — when scrolled past hero, add .stuck
            var sentinel = document.createElement('div');
            sentinel.className = 'pl-cat-sentinel';
            sentinel.style.height = '1px';
            filtersEl.parentNode.insertBefore(sentinel, filtersEl);
            _catObserver = new IntersectionObserver(function(entries) {
                filtersEl.classList.toggle('stuck', !entries[0].isIntersecting);
            }, { threshold: [1], rootMargin: '-65px 0px 0px 0px' });
            _catObserver.observe(sentinel);
        }

        // Render table
        renderCatTable(tabId, 1);

        // Sponsors

        // Init delegated listeners once
        if (!_catListenersReady) {
            initCatPagination();
            initCatSearch();
            initCatGenderToggle();
            _catListenersReady = true;
        }

        initScrollAnimations();
        updateCatLangLinks(tabId);
    }

    function initCatGenderToggle() {
        document.addEventListener('click', function(e) {
            // Чип пола на обеих страницах рейтинга — ОДИН класс
            // `pl-gender-tab`. Разводит не класс, а режим: в обзорном
            // слушателя ставит initTabs, здесь — этот, и оба за одним
            // `isCategoryMode`
            var btn = e.target.closest('.pl-gender-tab');
            if (!btn || !isCategoryMode) return;
            var newGender = btn.dataset.gender;
            var baseCatId = currentTab.indexOf('-') !== -1 ? currentTab.split('-').slice(1).join('-') : currentTab;
            var newTabId = newGender + '-' + baseCatId;
            if (!categoriesData[newTabId] || newTabId === currentTab) return;
            history.replaceState(null, '', '?tab=' + newTabId);
            renderCategoryPage(newTabId);
        });
    }

    function renderCatHero(cat, labels, playersPage) {
        var container = document.getElementById('playersHero');
        if (!container) return;

        // Ни поиска, ни переключателя пола в шапке нет: и то и другое живёт
        // в липкой полосе и здесь только дублировалось

        /* ОБЛОЖКА КАТЕГОРИИ ЖИВЁТ ПО ТОМУ ЖЕ ПРАВИЛУ, ЧТО ОБЗОРНАЯ.
           Слово Кости 06.10 про обложку рейтинга: сперва «онлайн убери,
           смысла нет», потом «391 игроков — убери тоже, числа не надо».
           ПРАВИЛО, ВЫВЕДЕННОЕ НА ОДНОМ КУСКЕ, ПРИМЕНЯЕТСЯ К СЛЕДУЮЩЕМУ БЕЗ
           НОВОГО РАЗБОРА: здесь стояли те же три плашки — игроки, турниры и
           онлайн, — и та же обложка называет теперь раздел и сезон. Числа
           живут там, где по ним принимают решение, — в самом списке.
           Подзаголовок берётся из тех же подписей, что у обзорной: сезон
           объявлен ОДИН раз на три языка. */
        container.innerHTML =
            '<div class="pl-hero-bg"></div>' +
            '<div class="pl-hero-overlay"></div>' +
            '<div class="pl-cat-hero-content">' +
                '<h1 class="pl-cat-title">' + esc(cat.name) + '</h1>' +
                '<p class="pl-cat-subtitle">' + labels.subtitle + '</p>' +
            '</div>';
    }

    function renderCatTable(tabId, page) {
        var container = document.getElementById('playersTable');
        if (!container) return;

        var labels = getLabels();
        var cat = getCategory(tabId);
        var allPlayers = cat.players || [];
        var isEn = isEnPage();
        var isKg = isKgPage();

        // Filter by search query
        var players = allPlayers;
        if (catSearchQuery) {
            var q = catSearchQuery.toLowerCase();
            players = allPlayers.filter(function(p) {
                return p.name.toLowerCase().indexOf(q) !== -1;
            });
        }

        catCurrentPage = page;
        var totalPages = Math.max(1, Math.ceil(players.length / CAT_PER_PAGE));
        var start = (page - 1) * CAT_PER_PAGE;
        var pageItems = players.slice(start, start + CAT_PER_PAGE);

        if (pageItems.length === 0) {
            container.innerHTML = '<div class="pl-cat-table-wrap"><div class="pl-no-results">' + labels.noResults + '</div></div>';
            renderCatPaginationUI(0, 1);
            return;
        }

        var isGuest = _accessLevel === 'guest';
        var playerPage = isEn ? 'player-en.html' : (isKg ? 'player-kg.html' : 'player.html');

        // Guest: limit visible rows
        var clearRows = catSearchQuery ? GUEST_SEARCH_VISIBLE : GUEST_CAT_VISIBLE;
        var totalVisible = isGuest ? Math.min(pageItems.length, clearRows + GUEST_CAT_BLURRED) : pageItems.length;

        var headerRow = '<div class="pl-row pl-row-header pl-cat-row">' +
            '<span class="pl-col-rank">' + labels.rank + '</span>' +
            '<span class="pl-col-player">' + labels.player + '</span>' +
            '<span class="pl-col-country">' + labels.country + '</span>' +
            '<span class="pl-col-ntrp">' + (labels.ntrp || 'NTRP') +
                '<span class="pl-col-sub">' + ntrpПодпись() + '</span></span>' +
            '<span class="pl-col-points">' + labels.points + '</span>' +
            '<span class="pl-col-record">' + labels.record + '</span>' +
            '<span class="pl-col-form">' + labels.form + '</span>' +
            '<span class="pl-col-change">' + labels.change + '</span>' +
        '</div>';

        var html = '<div class="pl-cat-table-wrap">';

        // Table with header as first row (no separate sticky wrapper)
        html += '<div class="pl-table pl-cat-table-body">';
        html += headerRow;

        // Rows
        for (var i = 0; i < totalVisible; i++) {
            var p = pageItems[i];
            var rank = catSearchQuery ? (allPlayers.indexOf(p) + 1) : (start + i + 1);
            var rankClass = rank <= 3 ? ' pl-rank-top' : '';
            var rowClass = '';

            // Blur for guests after clearRows
            var blurClass = '';
            if (isGuest && i >= clearRows) {
                var blurLevel = i - clearRows + 1;
                blurClass = ' pl-row-blur pl-row-blur-' + blurLevel;
            }

            var badgesHtml = getPlayerBadgesHtml(p.id, 3);

            var pForm = p.form || [];
            var formHtml = '';
            for (var f = 0; f < pForm.length; f++) {
                formHtml += '<span class="pl-form-dot ' + (pForm[f] === 'W' ? 'pl-form-win' : 'pl-form-loss') + '"></span>';
            }

            var changeHtml = '';
            if (p.change > 0) {
                changeHtml = '<span class="pl-change-up">\u2191' + p.change + '</span>';
            } else if (p.change < 0) {
                changeHtml = '<span class="pl-change-down">\u2193' + Math.abs(p.change) + '</span>';
            } else {
                changeHtml = '<span class="pl-change-neutral">\u2014</span>';
            }

            // Name: link for all, guests get modal instead of navigation
            var nameHtml;
            if (isGuest) {
                nameHtml = '<a href="#" class="pl-player-name" data-guest-profile="1">' + esc(p.name) + '</a>';
            } else {
                nameHtml = '<a href="' + playerPage + '?id=' + p.id + '" class="pl-player-name">' + esc(p.name) + '</a>';
            }

            html += '<div class="pl-row pl-cat-row pl-animate' + rowClass + blurClass + '" style="transition-delay:' + Math.min(i * 30, 300) + 'ms"' +
                (!isGuest ? ' data-player-id="' + p.id + '"' : '') +
                (!isGuest ? ' data-access="full"' : '') + '>' +
                '<span class="pl-col-rank' + rankClass + '">' + rank + '</span>' +
                '<div class="pl-col-player">' +
                    лицо(p, 'pl-player-photo') +
                    '<div class="pl-player-info">' +
                        '<div class="pl-player-name-row">' +
                            nameHtml +
                            (badgesHtml ? '<span class="pl-player-badges">' + badgesHtml + '</span>' : '') +
                            (p.banned_until && new Date(p.banned_until) > new Date() ? '<span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.65rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + (isEnPage() ? 'Banned' : (isKgPage() ? 'Бөгөт.' : 'Заблок.')) + '</span>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<span class="pl-col-country">' + (p.country || '') + '</span>' +
                '<span class="pl-col-ntrp">' + ntrpЯчейка(p) + '</span>' +
                '<span class="pl-col-points">' + p.points.toLocaleString() + '</span>' +
                '<span class="pl-col-record">' + p.wins + '/' + p.losses + '</span>' +
                '<span class="pl-col-form">' + formHtml + '</span>' +
                '<span class="pl-col-change">' + changeHtml + '</span>' +
            '</div>';
        }

        html += '</div>'; // close pl-table

        // Guest CTA overlay (same pattern as main ranking page)
        if (isGuest && pageItems.length > clearRows) {
            var authUrl = getAuthUrl();
            var ctaTitle = catSearchQuery ? searchLockedTitle() : labels.guestTitle;
            var ctaText = catSearchQuery ? hiddenFoundText() : labels.guestText;
            html += '<div class="pl-guest-overlay">' +
                '<div class="pl-guest-cta">' +
                    '<div class="pl-guest-icon">' +
                        '<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                            '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                            '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                            '<circle cx="12" cy="16" r="1"/>' +
                        '</svg>' +
                    '</div>' +
                    '<h3 class="pl-guest-title">' + ctaTitle + '</h3>' +
                    '<p class="pl-guest-text">' + ctaText + '</p>' +
                    '<a href="' + authUrl + '" class="pl-guest-btn">' + labels.guestBtn + '</a>' +
                '</div>' +
            '</div>';
        }

        html += '</div>'; // close pl-cat-table-wrap

        container.innerHTML = html;

        // Clickable rows for non-guests
        if (!isGuest) {
            var rows = container.querySelectorAll('.pl-cat-row[data-player-id]');
            rows.forEach(function(row) {
                row.style.cursor = 'pointer';
                row.addEventListener('click', function(e) {
                    if (e.target.closest('a')) return; // let link handle it
                    var pid = row.dataset.playerId;
                    window.location.href = playerPage + '?id=' + pid;
                });
            });
        }

        // Pagination UI (hide for guests)
        if (!isGuest) {
            renderCatPaginationUI(players.length, page);
        } else {
            var paginationEl = document.getElementById('playersPagination');
            if (paginationEl) paginationEl.innerHTML = '';
        }


        initScrollAnimations();
    }

    function initCatPagination() {
        document.addEventListener('click', function(e) {
            if (!isCategoryMode) return;

            var pageBtn = e.target.closest('.pl-page-btn');
            if (pageBtn && !pageBtn.disabled) {
                var cat = getCategory(currentTab);
                var totalPages = Math.max(1, Math.ceil((cat.players || []).length / CAT_PER_PAGE));

                if (pageBtn.classList.contains('pl-page-prev')) {
                    catCurrentPage = Math.max(1, catCurrentPage - 1);
                } else if (pageBtn.classList.contains('pl-page-next')) {
                    catCurrentPage = Math.min(totalPages, catCurrentPage + 1);
                } else if (pageBtn.dataset.page) {
                    catCurrentPage = parseInt(pageBtn.dataset.page);
                }

                renderCatTable(currentTab, catCurrentPage);
                window.KSLT_прокрутитьКСписку(document.getElementById('playersTable'));
            }
        });
    }

    function updateCatLangLinks(tabId) {
        document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('players') !== -1) {
                var base = href.split('?')[0];
                link.setAttribute('href', base + '?tab=' + tabId);
            }
        });
    }

    // ========================================
    // INTERACTIVITY
    // ========================================

    function initTabs() {
        document.addEventListener('click', function(e) {
            var genderBtn = e.target.closest('.pl-gender-tab');
            if (genderBtn) {
                var gender = genderBtn.dataset.gender;
                for (var key in categoriesData) {
                    if (categoriesData.hasOwnProperty(key) && categoriesData[key].gender === gender) {
                        switchTab(key);
                        break;
                    }
                }
                return;
            }

            var catBtn = e.target.closest('.pl-category-pill');
            if (catBtn) {
                switchTab(catBtn.dataset.tab);
                return;
            }

            var pageBtn = e.target.closest('.pl-page-btn');
            if (pageBtn && !pageBtn.disabled) {
                if (pageBtn.classList.contains('pl-page-prev')) {
                    currentPage = Math.max(1, currentPage - 1);
                } else if (pageBtn.classList.contains('pl-page-next')) {
                    currentPage++;
                } else if (pageBtn.dataset.page) {
                    currentPage = parseInt(pageBtn.dataset.page);
                }
                renderTable(currentTab, currentPage);
                window.KSLT_прокрутитьКСписку(document.getElementById('playersTable'));
            }
        });
    }

    function switchTab(tab) {
        if (!categoriesData[tab]) return;
        currentTab = tab;
        currentPage = 1;
        searchQuery = '';

        var searchInput = document.getElementById('playersSearch');
        if (searchInput) searchInput.value = '';

        renderFilters();
        renderPodium(tab);
        renderTable(tab, 1);
    }

    function initSearch() {
        document.addEventListener('input', function(e) {
            if (e.target.id !== 'playersSearch') return;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                var val = e.target.value.trim();
                searchQuery = val;
                currentPage = 1;

                if (!val) {
                    isSearchMode = false;
                    renderPodium(currentTab, true);
                    renderFilters();
                    var podiumEl = document.getElementById('playersPodium');
                    var filtersEl = document.getElementById('playersFilters');
                    if (podiumEl) podiumEl.style.display = '';
                    if (filtersEl) filtersEl.style.display = '';
                    renderTable(currentTab, 1);
                } else {
                    renderTable(currentTab, 1);
                }
            }, 200);
        });
    }

    function initCatSearch() {
        function handleSearch(e) {
            if (e.target.id !== 'catSearch' && e.target.id !== 'catSearchSticky') return;

            // Поиск работает у всех. Гостю закрыт не сам поиск, а объём
            // выдачи: он видит первых найденных, а сколько осталось за
            // порогом — написано под таблицей. Раньше поле у гостя молчало
            // после первого же окна, и человек печатал в пустоту

            // Sync both inputs
            var val = e.target.value;
            var hero = document.getElementById('catSearch');
            var sticky = document.getElementById('catSearchSticky');
            if (hero && hero !== e.target) hero.value = val;
            if (sticky && sticky !== e.target) sticky.value = val;

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                catSearchQuery = val.trim();
                catCurrentPage = 1;
                renderCatTable(currentTab, 1);
            }, 200);
        }

        document.addEventListener('input', handleSearch);
    }

    // ========================================
    // GUEST PROFILE MODAL + DELEGATION
    // ========================================

    function showProfileAuthModal() {
        var authUrl = getAuthUrl();
        var isEn = isEnPage();
        var isKg = isKgPage();
        var labels = getLabels();

        var overlay = document.createElement('div');
        overlay.className = 'pl-search-modal-overlay';
        overlay.innerHTML =
            '<div class="pl-search-modal">' +
                '<button class="pl-search-modal-close">&times;</button>' +
                '<div class="pl-search-modal-icon">' +
                    '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="1.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' +
                '</div>' +
                '<h3>' + labels.guestTitle + '</h3>' +
                '<p>' + (isEn ? 'Sign up to view player profiles and full rankings' : (isKg ? 'Оюнчулардын профилдерин жана толук рейтингди көрүү үчүн катталыңыз' : 'Зарегистрируйтесь, чтобы просматривать профили игроков и полный рейтинг')) + '</p>' +
                '<a href="' + authUrl + '" class="pl-search-modal-btn">' + labels.guestBtn + '</a>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        var closeBtn = overlay.querySelector('.pl-search-modal-close');
        closeBtn.addEventListener('click', function() { closeModal(overlay); });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
        document.addEventListener('keydown', function handler(e) {
            if (e.key === 'Escape') {
                closeModal(overlay);
                document.removeEventListener('keydown', handler);
            }
        });

        function closeModal(el) {
            el.classList.remove('visible');
            setTimeout(function() { if (el.parentNode) el.remove(); }, 300);
        }
    }

    // Event delegation for guest profile clicks
    document.addEventListener('click', function(e) {
        var link = e.target.closest('[data-guest-profile]');
        if (link) {
            e.preventDefault();
            showProfileAuthModal();
        }
    });

    // ========================================
    // SCROLL ANIMATIONS
    // ========================================

    function initScrollAnimations() {
        var elements = document.querySelectorAll('.pl-animate:not(.pl-visible)');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function(entries) {
            entries.forEach(function(entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('pl-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1, rootMargin: '0px 0px -20px 0px' });

        elements.forEach(function(el) { observer.observe(el); });
    }

    // ========================================
    // LANGUAGE LINKS
    // ========================================

    function updateLangLinks(tab) {
        document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('players') !== -1) {
                var base = href.split('?')[0];
                link.setAttribute('href', base + '?tab=' + tab);
            }
        });
    }
})();
