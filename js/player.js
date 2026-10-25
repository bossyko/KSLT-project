// ========================================
// PLAYER PROFILE — Detail Page Logic
// Uses playersData from players-data.js / -en / -kg
// Supabase: real matches + tournaments, mock fallback
// H2H modal on opponent click
// ========================================
(function () {
    'use strict';

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    var isEn = KSLT_YAZYK.en;
    var _бесплатныйПериод = false;
    var isKg = KSLT_YAZYK.kg;
    var CU = window.KSLT_COUNTRY;
    var lang = KSLT_YAZYK.код;
    var client = window.supabaseClient;
    var _playerId = null;
    var _playerName = '';
    var _playerPhoto = '';

    // Detect referrer to show correct "Back" button
    var _fromPartners = document.referrer && document.referrer.indexOf('partners') !== -1;
    function getBackLink(categoryKey) {
        if (_fromPartners) {
            var partnersPage = KSLT_YAZYK.выбрать('partners-en.html', 'partners-kg.html', 'partners.html');
            var backLabel = KSLT_YAZYK.выбрать('Back to partner search', 'Партнёр издөөгө кайтуу', 'Назад к поиску игрока');
            return { href: partnersPage, text: backLabel };
        }
        var rankingsPage = KSLT_YAZYK.выбрать('players-en.html', 'players-kg.html', 'players.html');
        var href = rankingsPage + (categoryKey ? '?tab=' + categoryKey : '');
        var text = KSLT_YAZYK.выбрать('Back to rankings', 'Рейтингге кайтуу', 'Назад к рейтингу');
        return { href: href, text: text };
    }

    // Seeded random for consistent mock data per player


    // ---- Labels ----
    /* ════════ МЕТКИ СТРАНИЦЫ — НА ТРЁХ ЯЗЫКАХ, КАК LH НИЖЕ ════════
       Здесь стояло `window.playerProfileLabels || { …по-русски… }`, и
       сам файл об этом знал: «словарь на этой странице всегда русский —
       window.playerProfileLabels нигде не заводится, померено 11.10 на
       player-en.html». Так и было: на английской и киргизской странице
       человек читал «Профиль игрока» и «Вызвать на матч» по-русски.
       ЗАПИСЬ ГОВОРИЛА «СЛОВАРЬ МЁРТВ» — он не мёртв, он ЖИВ И РАБОТАЕТ
       НЕПРАВИЛЬНО, а это разные беды и чинятся они по-разному.

       Приём взят не со стороны, а из этого же файла: LH ниже сделан
       правильно с самого начала — `isEn ? {…} : isKg ? {…} : {…}`.
       ОДНО ПОНЯТИЕ, ДВА ПОВЕДЕНИЯ В ОДНОМ ФАЙЛЕ: один словарь знал три
       языка, другой — ни одного.

       Снято 26 ключей, не встречавшихся в коде ни разу: heroTitle,
       backToRankings, statsStreak, sectionMatches, sectionTournaments,
       sectionChallenges, challengeCompleted, tournament, showAll,
       collapse, tagRating, tagFriendly, tagDoubles, tagMixed, tagBattle,
       veteran, dominant, victories, winRateLabel, joined, positionsMonth,
       winsThisSeason, monthName — и три, обслуживавших выдуманные
       турниры: matchDates, tournamentNames, tournamentResults.
       `window.playerProfileLabels` оставлен первым: подмена меток снаружи
       работала и продолжает работать, теперь поверх нужного языка. */
    var L = window.playerProfileLabels || (KSLT_YAZYK.выбрать({
        online: 'Online',
        message: 'Message',
        challenge: 'Challenge to a match',
        invite: 'Invite to play',
        statsPoints: 'Rating',
        statsWins: 'Wins',
        statsLosses: 'Losses',
        statsWinRate: 'Win %',
        pairsTitle: 'Doubles', mixedTitle: 'Mixed', pairsTag: 'doubles', mixedTag: 'mixed',
        pairsNote: 'not counted in the rating', pairsMatches: 'Matches', pairsWinRate: 'wins',
        sectionGames: 'My games',
        subsectionTournaments: 'Tournaments',
        subsectionMatches: 'Matches',
        subsectionChallenges: 'Challenges',
        sectionAchievements: 'Achievements',
        sectionRatingHistory: 'Rating history',
        chartPoints: 'Points',
        challengeAccepted: 'Accepted',
        statsNote: 'Statistics for rating singles tournaments',
        ctaTitle: 'Want to <span>play</span>?',
        ctaText: 'Sign up for KSLT to challenge players and enter tournaments',
        ctaBtn: 'Sign up',
        win: 'W',
        loss: 'L',
        playerNotFound: 'Player not found',
        playerNotFoundText: 'The link may be out of date, or the player was removed',
        challengeModalTitle: 'Send a challenge',
        challengeMessage: 'Message',
        challengeMsgHint: 'For example: shall we play at the weekend?',
        challengeSend: 'Send challenge',
        challengeSending: 'Sending…',
        challengeSent: 'Challenge sent!',
        challengeSentText: 'Your opponent will get a notification and can accept or decline.\nWe wait 10 days for an answer. After that the challenge expires.',
        challengeError: 'Could not send',
        challengeLimit: 'Three challenges are already waiting for an answer. Wait for at least one of them.',
        challengeMatchPending: 'A match with this player is already scheduled. Wait until it has been played.',
        challengeBtnWaiting: 'Challenge sent',
        challengeBtnMatchSet: 'Match scheduled',
        challengeNotMember: 'Only a KSLT member can send a challenge',
        challengePending: 'Active challenge',
        challengePendingText: 'You already have a challenge to this player.\nWait for an answer or for it to expire — 10 days.\nYou can withdraw it in your dashboard, section «Battles».',
        challengeSelf: 'You cannot challenge yourself',
        challengeLoginRequired: 'Sign in',
        challengeLoginText: 'You need to sign in to send a challenge',
        challengeMemberRequired: 'Get a membership',
        challengeMemberText: 'A KSLT membership is required to send a challenge',
        challengeNoPlayer: 'Link a player profile to send challenges'
    }, {
        online: 'Онлайн',
        message: 'Жазуу',
        challenge: 'Матчка чакыруу',
        invite: 'Оюнга чакыруу',
        statsPoints: 'Рейтинг',
        statsWins: 'Жеңиштер',
        statsLosses: 'Жеңилиштер',
        statsWinRate: 'Жеңиш %',
        pairsTitle: 'Жуптук', mixedTitle: 'Микст', pairsTag: 'жуп', mixedTag: 'микст',
        pairsNote: 'рейтингге кирбейт', pairsMatches: 'Матчтар', pairsWinRate: 'жеңиш',
        sectionGames: 'Менин оюндарым',
        subsectionTournaments: 'Турнирлер',
        subsectionMatches: 'Матчтар',
        subsectionChallenges: 'Чакырыктар',
        sectionAchievements: 'Жетишкендиктер',
        sectionRatingHistory: 'Рейтинг тарыхы',
        chartPoints: 'Упайлар',
        challengeAccepted: 'Кабыл алынды',
        statsNote: 'Рейтингдик жекече турнирлер боюнча статистика',
        ctaTitle: '<span>Ойногуң</span> келеби?',
        ctaText: 'Оюнчуларга чакырык таштоо жана турнирлерге катышуу үчүн KSLT-ке катталыңыз',
        ctaBtn: 'Катталуу',
        win: 'Ж',
        loss: 'У',
        playerNotFound: 'Оюнчу табылган жок',
        playerNotFoundText: 'Шилтеме эскирген болушу мүмкүн же оюнчу өчүрүлгөн',
        challengeModalTitle: 'Чакырык таштоо',
        challengeMessage: 'Билдирүү',
        challengeMsgHint: 'Мисалы: дем алышта ойнойбузбу?',
        challengeSend: 'Чакырык жөнөтүү',
        challengeSending: 'Жөнөтүлүүдө…',
        challengeSent: 'Чакырык жөнөтүлдү!',
        challengeSentText: 'Атаандашыңыз билдирме алат жана чакырыкты кабыл алат же четке кагат.\nЖообун 10 күн күтөбүз. Андан кийин чакырык күйүп кетет.',
        challengeError: 'Жөнөтүү катасы',
        challengeLimit: 'Үч чакырык жооп күтүүдө. Жок дегенде бирине жооп күтүңүз.',
        challengeMatchPending: 'Бул оюнчу менен матч мурун эле дайындалган. Ал ойнолгонго чейин күтүңүз.',
        challengeBtnWaiting: 'Чакырык жөнөтүлдү',
        challengeBtnMatchSet: 'Матч дайындалды',
        challengeNotMember: 'Чакырык таштоого KSLT мүчөсү гана укуктуу',
        challengePending: 'Жандуу чакырык',
        challengePendingText: 'Сизде бул оюнчуга чакырык бар.\nЖоопту же мөөнөттүн бүтүшүн күтүңүз — 10 күн.\nЧакырыкты кабинеттеги «Баттлдар» бөлүмүнөн кайра алса болот.',
        challengeSelf: 'Өзүңүздү чакыра албайсыз',
        challengeLoginRequired: 'Аккаунтка кириңиз',
        challengeLoginText: 'Чакырык жөнөтүү үчүн авторизациядан өтүү керек',
        challengeMemberRequired: 'Мүчөлүктү тариздеңиз',
        challengeMemberText: 'Чакырык жөнөтүү үчүн KSLT мүчөлүгү керек',
        challengeNoPlayer: 'Чакырык жөнөтүү үчүн оюнчу профилин байлаңыз'
    }, {
        online: 'Онлайн',
        message: 'Написать',
        challenge: 'Вызвать на матч',
        invite: 'Пригласить поиграть',
        statsPoints: 'Рейтинг',
        statsWins: 'Победы',
        statsLosses: 'Поражения',
        statsWinRate: '% Побед',
        pairsTitle: 'Парные', mixedTitle: 'Микст', pairsTag: 'пары', mixedTag: 'микст',
        pairsNote: 'в рейтинг не идут', pairsMatches: 'Матчей', pairsWinRate: 'побед',
        sectionGames: 'Мои игры',
        subsectionTournaments: 'Турниры',
        subsectionMatches: 'Матчи',
        subsectionChallenges: 'Вызовы',
        sectionAchievements: 'Достижения',
        sectionRatingHistory: 'История рейтинга',
        chartPoints: 'Очки',
        challengeAccepted: 'Принят',
        statsNote: 'Статистика по рейтинговым одиночным турнирам',
        ctaTitle: 'Хочешь <span>сыграть</span>?',
        ctaText: 'Зарегистрируйся в KSLT, чтобы бросить вызов игрокам и участвовать в турнирах',
        ctaBtn: 'Регистрация',
        win: 'W',
        loss: 'L',
        playerNotFound: 'Игрок не найден',
        playerNotFoundText: 'Возможно, ссылка устарела или игрок был удалён',
        challengeModalTitle: 'Бросить вызов',
        challengeMessage: 'Сообщение',
        challengeMsgHint: 'Например: сыграем в выходные?',
        challengeSend: 'Отправить вызов',
        challengeSending: 'Отправка…',
        challengeSent: 'Вызов отправлен!',
        challengeSentText: 'Соперник получит уведомление и сможет принять или отклонить вызов.\nОтвета ждём 10 дней. Дальше вызов сгорает.',
        challengeError: 'Ошибка отправки',
        challengeLimit: 'Уже три вызова ждут ответа. Дождитесь ответа хотя бы на один.',
        challengeMatchPending: 'Матч с этим игроком уже назначен. Дождитесь, пока он будет сыгран.',
        challengeBtnWaiting: 'Вызов отправлен',
        challengeBtnMatchSet: 'Матч назначен',
        challengeNotMember: 'Вызвать на баттл может только член KSLT',
        challengePending: 'Активный вызов',
        challengePendingText: 'У вас уже есть вызов этому игроку.\nДождитесь ответа или истечения срока — 10 дней.\nОтозвать вызов можно в кабинете, раздел «Баттлы».',
        challengeSelf: 'Нельзя вызвать самого себя',
        challengeLoginRequired: 'Войдите в аккаунт',
        challengeLoginText: 'Для отправки вызова необходимо авторизоваться',
        challengeMemberRequired: 'Оформите членство',
        challengeMemberText: 'Для отправки вызова необходимо членство KSLT',
        challengeNoPlayer: 'Привяжите профиль игрока для отправки вызовов'
    }));

    // ---- H2H Labels ----
    var LH = KSLT_YAZYK.выбрать({
        vs: 'VS', wins: 'Wins', setsWon: 'Sets won', gamesWon: 'Games won',
        last5: 'Last 5 matches', fullProfile: 'Open full profile',
        noMatches: 'No head-to-head matches found', loading: 'Loading...',
        noData: 'No match data yet', participated: 'Participated',
        winner: '🏆 Winner', roundF: 'Final', roundSF: 'SF', roundQF: 'QF',
        round3rd: '3rd place', round4th: '4th place', upcoming: 'Upcoming', registered: 'Registered'
    }, {
        vs: 'VS', wins: 'Жеңиштер', setsWon: 'Утулган сеттер', gamesWon: 'Утулган геймдер',
        last5: 'Акыркы 5 матч', fullProfile: 'Толук профилди ачуу',
        noMatches: 'Бетме-бет матчтар жок', loading: 'Жүктөлүүдө...',
        noData: 'Матч маалыматы жок', participated: 'Катышкан',
        winner: '🏆 Жеңүүчү', roundF: 'Финал', roundSF: '1/2', roundQF: '1/4',
        round3rd: '3-орун', round4th: '4-орун', upcoming: 'Алдыда', registered: 'Катталган'
    }, {
        vs: 'VS', wins: 'Победы', setsWon: 'Выигранные сеты', gamesWon: 'Выигранные геймы',
        last5: 'Последние 5 матчей', fullProfile: 'Открыть полный профиль',
        noMatches: 'Матчей между игроками не найдено', loading: 'Загрузка...',
        noData: 'Нет данных о матчах', participated: 'Участвовал',
        winner: '🏆 Победитель', roundF: 'Финал', roundSF: '1/2', roundQF: '1/4',
        round3rd: '3-е место', round4th: '4-е место', upcoming: 'Скоро', registered: 'Зарегистрирован'
    });

    // ---- Find player across all categories ----
    function findPlayer(id) {
        var cats = playersData.categories;
        for (var catKey in cats) {
            if (!cats.hasOwnProperty(catKey)) continue;
            var cat = cats[catKey];
            for (var i = 0; i < cat.players.length; i++) {
                if (cat.players[i].id === id) {
                    return {
                        player: cat.players[i],
                        category: cat,
                        categoryKey: catKey,
                        rank: i + 1
                    };
                }
            }
        }
        return null;
    }

    // ---- Generate mock match history (fallback) ----

    // ---- Badge data (loaded from Supabase) ----
    var _earnedBadges = [];
    var _allBadges = [];

    /**
     * Контакты игрока лежат в его профиле, а не в карточке: телефон он вводит
     * в кабинете, там же разрешает или запрещает его показывать. Раньше
     * карточка читала отдельную колонку players.phone, которую никто не
     * заполнял, — поэтому контактов на сайте не было вовсе.
     */
    async function loadPlayerContacts(playerId) {
        if (!client) return null;
        try {
            var res = await client.from('profiles')
                .select('phone, show_phone, whatsapp_phone, show_whatsapp, ' +
                        'telegram, show_telegram, instagram, show_instagram, deleted_at')
                .eq('player_id', playerId)
                .maybeSingle();
            // Человек уходит из клуба — контактов не даём, даже если
            // разрешения на показ остались включёнными
            if (res.data && res.data.deleted_at) return null;
            return res.data || null;
        } catch(e) { return null; }
    }

    /**
     * Блок контактов. Показываем только членам клуба: телефон игрока — не то,
     * что стоит отдавать случайному посетителю. Каждый вид контакта
     * показывается отдельно, по своему разрешению.
     */
    // Знаки сетей. Рисованные, а не эмодзи: эмодзи у каждой системы свои,
    // и на части устройств вместо телеграма выходил синий квадрат
    var ICON = {
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.9.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884a9.82 9.82 0 0 1 6.988 2.896 9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413Z"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98C.014 8.333 0 8.741 0 12s.014 3.668.072 4.948c.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072s3.668-.014 4.948-.072c4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948s-.014-3.667-.072-4.947c-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>'
    };

    function renderContacts(contacts) {
        var box = document.getElementById('ppContacts');
        if (!box || !contacts || _accessLevel !== 'member') return;

        // Каждый способ связи открывается отдельно: у человека может быть
        // рабочий телеграм и личный WhatsApp, и смешивать их нельзя
        var phone = contacts.show_phone ? (contacts.phone || '') : '';
        // WhatsApp живёт на своём номере, если он указан, иначе на основном.
        // Разрешение отдельное: номер можно скрыть, а WhatsApp оставить.
        var wa = contacts.show_whatsapp
            ? (contacts.whatsapp_phone || contacts.phone || '')
            : '';
        var tg = contacts.show_telegram ? (contacts.telegram || '') : '';
        var ig = contacts.show_instagram ? (contacts.instagram || '') : '';
        if (!phone && !wa && !tg && !ig) return;

        var title = KSLT_YAZYK.выбрать('Contacts', 'Байланыш', 'Контакты');
        var html = '<div class="pp-section pp-fade-in">' +
            '<h3 class="pp-section-title">\uD83D\uDCDE ' + title + '</h3>' +
            '<div class="pp-contacts">';

        // Плашка на каждый способ связи: знак сети и имя рядом. Раньше это
        // была строка во всю ширину с одним словом «Instagram @имя» —
        // выглядела как пустая полоса и не читалась как ссылка
        if (phone) {
            html += '<a href="tel:' + KSLT_экранировать(phone) + '" class="pp-contact">' + ICON.phone +
                '<span>' + KSLT_экранировать(window.KSLT_PHONE && window.KSLT_PHONE.pretty ? window.KSLT_PHONE.pretty(phone) : phone) + '</span></a>';
        }
        if (wa) {
            html += '<a href="https://wa.me/' + KSLT_экранировать(wa.replace(/[^0-9]/g, '')) + '" target="_blank" rel="noopener" class="pp-contact pp-contact-wa">' +
                ICON.whatsapp + '<span>WhatsApp</span></a>';
        }
        if (tg) {
            var handle = tg.replace('@', '');
            html += '<a href="https://t.me/' + KSLT_экранировать(handle) + '" target="_blank" rel="noopener" class="pp-contact pp-contact-tg">' +
                ICON.telegram + '<span>@' + KSLT_экранировать(handle) + '</span></a>';
        }
        if (ig) {
            var ighandle = ig.replace('@', '');
            html += '<a href="https://instagram.com/' + KSLT_экранировать(ighandle) + '" target="_blank" rel="noopener" class="pp-contact pp-contact-ig">' +
                ICON.instagram + '<span>@' + KSLT_экранировать(ighandle) + '</span></a>';
        }

        box.innerHTML = html + '</div></div>';
        initScrollAnimations();   // блок пришёл позже остальных — проявляем и его
    }

    async function loadPlayerBadges(playerId) {
        if (!client) return [];
        try {
            var res = await client.from('player_badges')
                .select('badge_id, earned_at, badge:badge_definitions(*)')
                .eq('player_id', playerId)
                .order('earned_at', { ascending: true });
            return res.data || [];
        } catch(e) { return []; }
    }

    async function loadAllBadges() {
        if (!client) return [];
        try {
            var res = await client.from('badge_definitions')
                .select('*')
                .order('sort_order', { ascending: true });
            return res.data || [];
        } catch(e) { return []; }
    }

    function getBadgeName(b) {
        if (!b) return '';
        return KSLT_YAZYK.выбрать(b.name_en || b.name, b.name_kg || b.name, b.name);
    }
    function getBadgeDesc(b) {
        if (!b) return '';
        return KSLT_YAZYK.выбрать(b.description_en || b.description, b.description_kg || b.description, b.description);
    }

    function formatBadgeDate(dateStr) {
        if (!dateStr) return '';
        // «2026-08-21» без времени читается как полночь UTC, и при часовом
        // поясе западнее нуля дата съезжает на день назад. Полные метки
        // времени оставляем как есть
        var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + 'T00:00:00' : dateStr);
        var dd = d.getDate();
        var mm = d.getMonth() + 1;
        var yy = d.getFullYear();
        return dd + '.' + (mm < 10 ? '0' : '') + mm + '.' + yy;
    }

    // ---- Generate mock tournaments (fallback) ----

    // ---- Calculate current streak ----
    function calcStreak(form) {
        if (!form || !form.length) return { count: 0, type: 'neutral' };
        var first = form[0];
        var count = 0;
        for (var i = 0; i < form.length; i++) {
            if (form[i] === first) count++;
            else break;
        }
        return { count: count, type: first === 'W' ? 'up' : 'down' };
    }

    // Badge emoji map removed — now loaded from badge_definitions

    /**
     * Какого рода этот матч.
     *
     * В историю попадает всё сыгранное, а в статистику — только рейтинговые
     * одиночные. Без метки это выглядит ошибкой: матчей одиннадцать, побед
     * четыре. Метка отвечает на вопрос прямо у строки.
     *
     * Дуэль в базе — это баттл: счёт вводится в админке только у
     * опубликованных баттлов, другого пути к match_type = 'duel' нет.
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
        return '<span class="pp-match-tag pp-tag-' + kind + '">' + KSLT_экранировать(L[KIND_LABEL[kind]] || '') + '</span>';
    }

    // ---- Score helpers ----
    function formatMatchDate(dateStr) {
        if (!dateStr) return '\u2014';
        // «2026-08-21» без времени читается как полночь UTC, и при часовом
        // поясе западнее нуля дата съезжает на день назад. Полные метки
        // времени оставляем как есть
        var d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? dateStr + 'T00:00:00' : dateStr);
        var months = KSLT_YAZYK.выбрать(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'], ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек'], ['Янв','Фев','Мар','Апр','Май','Июн','Июл','Авг','Сен','Окт','Ноя','Дек']);
        return d.getDate() + ' ' + months[d.getMonth()];
    }

    /* СЧЁТ БЕРЁТСЯ У ДОМА `js/kslt-rules.js` (19.10). Здесь стояли три
       копии — показ, переворот и разбор счёта, — а в кабинете те же три под
       префиксом `db`. Страница игрока и кабинет говорят об ОДНОМ человеке:
       счёт у них обязан быть один. */
    var показатьСчёт = function (с) { return window.KSLT_RULES.показатьСчёт(с); };
    var перевернутьСчёт = function (с) { return window.KSLT_RULES.перевернутьСчёт(с); };
    var разборСчёта = function (с) { return window.KSLT_RULES.разборСчёта(с); };

    function playerPage() {
        return KSLT_YAZYK.выбрать('player-en.html', 'player-kg.html', 'player.html');
    }

    /**
     * Парные и смешанные игры отдельным блоком.
     *
     * В рейтинг они не идут — очков за пары не начисляют, места в таблице
     * нет. Но сыгранное надо где-то показать: иначе история матчей ниже
     * длиннее, чем объясняет статистика сверху.
     *
     * Тот же вид, что в кабинете: страницы про одного человека должны
     * говорить одно и то же. У кого таких игр нет, блока нет — пустые нули
     * читаются как неудача.
     */
    function pairBlockHtml(title, tagText, tagClass, w, l) {
        var played = w + l;
        if (!played) return '';
        var rate = Math.round(w / played * 100);
        return '<div class="pp-pair-block pp-fade-in">' +
            '<div class="pp-pair-head">' +
                '<span class="pp-pair-title">' + KSLT_экранировать(title) + '</span>' +
                '<span class="pp-pair-tag ' + tagClass + '">' + KSLT_экранировать(tagText) + '</span>' +
                '<span class="pp-pair-note">' + KSLT_экранировать(L.pairsNote || '') + '</span>' +
            '</div>' +
            '<div class="pp-stats">' +
                statCard(played, L.pairsMatches, '', '') +
                statCard(w, L.statsWins, '', '') +
                statCard(l, L.statsLosses, '', '') +
                statCard(rate + '%', L.pairsWinRate, '', '') +
            '</div>' +
            '<div class="pp-cat-bar">' +
                '<i class="pp-cat-bar-w" style="width:' + rate + '%"></i>' +
                '<i class="pp-cat-bar-l" style="width:' + (100 - rate) + '%"></i>' +
            '</div>' +
        '</div>';
    }

    function pairBlocksHtml(p) {
        return pairBlockHtml(L.pairsTitle, L.pairsTag, 'pp-pair-tag-dbl',
                             p.doubles_wins || 0, p.doubles_losses || 0) +
               pairBlockHtml(L.mixedTitle, L.mixedTag, 'pp-pair-tag-mix',
                             p.mixed_wins || 0, p.mixed_losses || 0);
    }

    // ---- Render helpers ----
    function statCard(num, label, change, changeClass) {
        var h = '<div class="pp-stat"><div class="pp-stat-num">' + num + '</div>' +
            '<div class="pp-stat-label">' + label + '</div>';
        if (change) {
            h += '<div class="pp-stat-change ' + changeClass + '">' + change + '</div>';
        }
        h += '</div>';
        return h;
    }

    /**
     * Полоса побед и поражений в категории.
     *
     * Та же, что в кабинете и в админке: цвета взяты из таблицы матчей,
     * зелёный — победа, красный — поражение.
     */
    function ppCatBar(w, l) {
        var played = w + l;
        var noMatches = KSLT_YAZYK.выбрать('no matches yet', 'матчтар азырынча жок', 'матчей пока нет');
        if (!played) {
            return '<div class="pp-cat-bar"></div>' +
                '<div class="pp-cat-legend"><span>' + noMatches + '</span></div>';
        }

        var pct = Math.round(w / played * 100);
        var totalWord = KSLT_YAZYK.выбрать('Matches played', 'Бардык матчтар', 'Всего матчей');
        var rateWord = KSLT_YAZYK.выбрать('wins', 'жеңиш', 'побед');
        return '<div class="pp-cat-bar">' +
                '<i class="pp-cat-bar-w" style="width:' + (w / played * 100) + '%"></i>' +
                '<i class="pp-cat-bar-l" style="width:' + (l / played * 100) + '%"></i>' +
            '</div>' +
            '<div class="pp-cat-legend">' +
                '<span>' + totalWord + ': ' + played + '</span>' +
                '<span><span class="pp-cat-mark pp-cat-mark-w"></span>' + plural(w, 'wins') +
                    '<span class="pp-cat-mark pp-cat-mark-l"></span>' + plural(l, 'losses') + '</span>' +
                '<span class="pp-cat-rate">' + pct + '% ' + rateWord + '</span>' +
            '</div>';
    }

    /** Число со словом в нужном падеже: 1 победа, 2 победы, 5 побед. */
    function plural(n, kind) {
        var forms = KSLT_YAZYK.выбрать(kind === 'wins' ? ['win', 'wins', 'wins'] : ['loss', 'losses', 'losses'], kind === 'wins' ? ['жеңиш', 'жеңиш', 'жеңиш'] : ['жеңилүү', 'жеңилүү', 'жеңилүү'], kind === 'wins' ? ['победа', 'победы', 'побед'] : ['поражение', 'поражения', 'поражений']);

        /* ПРАВИЛО ВЫБОРА ФОРМЫ — ДОМ ЯЗЫКА (кусок 155). Оно стояло ЗДЕСЬ
           и ещё в четырёх местах; прибор копий видел две из семи, потому
           что у остальных своя обвязка вокруг того же правила. */
        return n + ' ' + KSLT_YAZYK.счёт(n, forms[0], forms[1], forms[2]);
    }

    // ---- Render Hero ----
    /**
     * Пока грузятся данные — только фон.
     *
     * Раньше здесь стояло «Профиль игрока»: одна и та же надпись на трёхстах
     * страницах, треть экрана на то, что человек и так знает — он сам сюда
     * кликнул. Теперь баннер наполняет карточка игрока.
     */
    function renderHero() {
        var el = document.getElementById('playerHero');
        if (!el) return;
        el.innerHTML = '<div class="pp-hero-bg"></div>';
    }

    // ---- Access level detection ----
    var _accessLevel = 'guest';
    var _myPlayerId = null;

    async function detectAccess() {
        /* УРОВЕНЬ ДОСТУПА И СВОЯ КАРТОЧКА — У ДОМА (js/kslt-dostup.js). */
        _accessLevel = await KSLT_DOSTUP.уровень();
        _myPlayerId = KSLT_DOSTUP.мойИгрок();
    }

    // ---- Guest block ----
    function renderGuestBlock(data) {
        var el = document.getElementById('playerDetail');
        if (!el) return;

        var player = data.player;
        var rankingsPage = KSLT_YAZYK.выбрать('players-en.html', 'players-kg.html', 'players.html');
        var authPage = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');
        var photoUrl = player.photo ? player.photo.replace('w=80&h=80', 'w=240&h=240') : '';

        var titleText = KSLT_YAZYK.выбрать('Register to view player profiles', 'Оюнчулардын профилин көрүү үчүн катталыңыз', 'Зарегистрируйтесь для просмотра профилей');
        var descText = KSLT_YAZYK.выбрать('Full stats, match history, achievements and challenges are available after registration', 'Толук статистика, матч тарыхы, жетишкендиктер жана чакырыктар каттоодон кийин жеткиликтүү', 'Полная статистика, история матчей, достижения и вызовы доступны после регистрации');
        var btnText = KSLT_YAZYK.выбрать('Sign In / Register', 'Кирүү / Каттоо', 'Войти / Регистрация');
        var back = getBackLink(null);

        document.title = player.name + ' \u2014 KSLT';

        // Пустую обложку гостю не показываем: надписей в ней нет, а первый
        // экран она съедает целиком — и заглушка уезжает вниз
        var обложка = document.getElementById('playerHero');
        if (обложка) обложка.style.display = 'none';

        el.innerHTML =
            '<div class="kslt-back-wrap">' +
                '<a href="' + back.href + '" class="kslt-back">\u2190 ' + back.text + '</a>' +
            '</div>' +
            '<div class="pp-guest-block">' +
                '<div class="pp-guest-preview">' +
                    кружокИгрока(player.name, photoUrl, 'pp-guest-photo') +
                    '<h2 class="pp-guest-name">' + KSLT_экранировать(player.name) + '</h2>' +
                '</div>' +
                '<div class="pp-guest-cta">' +
                    '<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">' +
                        '<rect x="3" y="11" width="18" height="11" rx="2"/>' +
                        '<path d="M7 11V7a5 5 0 0 1 10 0v4"/>' +
                        '<circle cx="12" cy="16" r="1"/>' +
                    '</svg>' +
                    '<h3>' + titleText + '</h3>' +
                    '<p>' + descText + '</p>' +
                    '<a href="' + authPage + '?tab=register" class="pp-guest-btn">' + btnText + '</a>' +
                '</div>' +
            '</div>';

        // Поверх заглушки — то же предложение окном. По ссылке из Телеграма
        // человек попадает сразу сюда, и окно объясняет, что дальше.
        // Окно закрывается: под ним видно, чей это профиль, а кнопка
        // регистрации остаётся на самой странице
        if (window.KSLT_INVITE && window.KSLT_INVITE.окноРегистрации) {
            setTimeout(function() {
                window.KSLT_INVITE.окноРегистрации(titleText, descText);
            }, 400);
        }
    }

    // ---- Render Profile ----
    function renderProfile(data) {
        var el = document.getElementById('playerDetail');
        if (!el) return;

        var player = data.player;
        var cat = data.category;
        var rank = data.rank;
        var streak = calcStreak(player.form || []);
        var totalM = (player.wins || 0) + (player.losses || 0);
        var winRate = totalM > 0 ? Math.round(player.wins / totalM * 100) : 0;
        var authPage = KSLT_YAZYK.выбрать('auth-en.html', 'auth-kg.html', 'auth.html');
        var back = getBackLink(data.categoryKey);

        var html = '';

        // Возврат плавающий, у левого края под шапкой.
        //
        // В потоке он стоял под баннером и уезжал при первой прокрутке, а
        // прилипание тут не спасает: оно действует в пределах родителя.
        // На узких экранах плавать негде — там он становится обычной
        // строкой над содержимым (см. css/player.css)
        html += '<div class="kslt-back-wrap pp-back-float">';
        html += '<a href="' + back.href + '" class="kslt-back">\u2190 ' + back.text + '</a>';
        html += '</div>';

        html += '<div class="pp-container">';

        // ---- Карточка игрока — в баннер ----
        //
        // Баннер занимал треть экрана и сообщал «Профиль игрока» — одно и то
        // же на всех страницах. Настоящая карточка при этом пряталась под
        // ним. На страницах тренера, корта и турнира баннер несёт имя того,
        // на кого смотришь; здесь он был единственным пустым.
        var hero = '';
        // ---- Header ----
        hero += '<div class="pp-header pp-fade-in">';
        hero += '<div class="pp-photo-wrap">';
        /* БЕЗ ФОТОГРАФИИ — ИНИЦИАЛЫ, И ЭТО ЖЕ СНИМАЕТ АНГЛИЙСКОЕ «No Photo»
           НА ТРЁХ ЯЗЫКАХ: заглушка приходила с чужого CDN с зашитой в адрес
           английской подписью. */
        var photoUrl = player.photo ? player.photo.replace('w=80&h=80', 'w=240&h=240') : '';
        hero += кружокИгрока(player.name, photoUrl, 'pp-photo');
        if (player.online) hero += '<div class="pp-online-dot"></div>';
        // Motto under photo
        var motto = KSLT_YAZYK.выбрать(player.bio_en || player.bio, player.bio_kg || player.bio, player.bio);
        if (motto) {
            hero += '<div style="text-align:center;font-style:italic;color:var(--text-secondary);font-size:0.85rem;margin-top:10px;opacity:0.8;">&laquo;' + KSLT_экранировать(motto) + '&raquo;</div>';
        }
        hero += '</div>'; // .pp-photo-wrap

        hero += '<div class="pp-info">';
        // ИМЯ ИГРОКА — ЗАГОЛОВОК ПЕРВОГО УРОВНЯ. Замер 09.10: h1 на странице
        // ноль, иерархия начиналась с h2, и диктор не находил названия экрана
        hero += '<h1 class="pp-name">' + KSLT_экранировать(player.name) + '</h1>';
        // Карточка остаётся и после ухода человека: результаты и очки
        // принадлежат турнирам, где он играл. Но связи с учётной записью
        // больше нет — об этом и говорит метка
        if (player.account_deleted_at) {
            var goneText = KSLT_YAZYK.выбрать('Account deleted', 'Аккаунт өчүрүлгөн', 'Аккаунт удалён');
            hero += '<div class="pp-account-gone">' + goneText + '</div>';
        }
        hero += '<div class="pp-meta">';
        if (player.country) hero += '<span class="pp-meta-country">' +
            KSLT_экранировать(CU.renderCountry(CU.normalizeCountry(player.country), lang, true)) + '</span>';
        if (player.online) {
            hero += '<span class="pp-meta-online">' + L.online + '</span>';
        }
        hero += '</div>';

        // Ratings block — Singles
        hero += '<div class="pp-ratings">';
        var myCats = data.categories || [];
        if (myCats.length > 0) {
            myCats.forEach(function(c) {
                // Место показываем, только когда оно есть. У игрока без
                // очков рейтинга ещё нет, и вместо номера выходило «#null»
                var placeStr = c.rank ? ' \u00b7 #' + c.rank : '';
                hero += '<div class="pp-rating-row">' +
                    '<span class="pp-rating-label">' + KSLT_экранировать(c.name) + '</span>' +
                    '<span class="pp-rating-value">' + c.points + placeStr + '</span>' +
                '</div>';
            });
        } else {
            hero += '<div class="pp-rating-row"><span class="pp-rating-label">KSLT</span><span class="pp-rating-value">' + KSLT_экранировать(cat.name) + (rank ? ' \u00b7 #' + rank : '') + '</span></div>';
        }
        // NTRP теперь двумя числами: одиночный разряд и парные турниры.
        // Строку с подписями собирает общий свод правил — тот же, что в
        // приложении, чтобы вид не разошёлся.
        var ntrpСтрока = (window.KSLT_RULES && window.KSLT_RULES.ntrpСтрока)
            ? window.KSLT_RULES.ntrpСтрока(player.ntrp_singles, player.ntrp_doubles,
                                           KSLT_YAZYK.код)
            : '';
        if (ntrpСтрока) {
            hero += '<div class="pp-rating-row"><span class="pp-rating-label">NTRP</span><span class="pp-rating-value">' + ntrpСтрока + '</span></div>';
        }
        hero += '</div>';

        // Header badges — show all earned badge emoji
        if (_earnedBadges.length > 0) {
            hero += '<div class="pp-badges">';
            _earnedBadges.forEach(function (pb) {
                var b = pb.badge;
                if (b) {
                    hero += '<span class="pp-badge" title="' + KSLT_экранировать(getBadgeName(b)) + '"><span class="pp-badge-icon">' + b.icon + '</span></span>';
                }
            });
            hero += '</div>';
        }
        hero += '</div>'; // .pp-info

        // Actions
        hero += '<div class="pp-actions">';
        if (player.online) {
            hero += '<a href="' + authPage + '" class="pp-action-btn pp-action-secondary">\u2709\uFE0F ' + L.message + '</a>';
        }
        // Вызвать можно только того, за кем есть человек: перенесённая из
        // списков NTRP карточка ждёт, когда её владелец заведёт учётную
        // запись, и вызов ей получить некому.
        // Приписку «членство не оформлено» в бесплатный период не показываем:
        // платить сейчас не за что.
        var естьЧеловек = player.has_account === true;
        var isBackground = !естьЧеловек && !_бесплатныйПериод;
        if ((!_myPlayerId || _myPlayerId !== player.id) && естьЧеловек) {
            // Огонь, а не мяч: кнопка залита лаймом, и жёлто-зелёный мяч на
            // ней растворяется. Тем же знаком помечены баттлы в кабинете
            hero += '<button class="pp-action-btn pp-action-primary" id="ppChallengeBtn">' +
                '<span class="pp-action-icon">\uD83D\uDD25</span> ' + L.challenge + '</button>';

            // Позвать поиграть — то же приглашение, что в поиске игрока.
            // Со страницы игрока его было не отправить: человек находил
            // соперника, открывал карточку и упирался в тупик
            hero += '<button class="pp-action-btn pp-action-secondary" id="ppInviteBtn">' +
                '<span class="pp-action-icon">\uD83C\uDFBE</span> ' + (L.invite || 'Пригласить поиграть') + '</button>';
        }
        if (isBackground) {
            var bgNote = KSLT_YAZYK.выбрать('This player is in the club database but has not joined yet', 'Бул оюнчу клубдун базасында бар, бирок азырынча мүчө эмес', 'Игрок есть в базе клуба, но членство пока не оформлено');
            hero += '<div class="pp-not-member">' + bgNote + '</div>';
        }
        hero += '</div>';

        hero += '</div>'; // .pp-header

        var heroEl = document.getElementById('playerHero');
        if (heroEl) {
            heroEl.innerHTML = '<div class="pp-hero-bg"></div>' +
                '<div class="pp-hero-content">' + hero + '</div>';
        }


        // ---- Singles Stats ----
        var singlesTitle = KSLT_YAZYK.выбрать('Singles Rating', 'Жеке рейтинг', 'Одиночный рейтинг');
        html += '<h3 class="pp-section-title pp-fade-in">' + singlesTitle + '</h3>';

        var changeText = player.change > 0 ? '+' + player.change : (player.change < 0 ? '' + player.change : '\u2014');
        var changeClass = player.change > 0 ? 'up' : (player.change < 0 ? 'down' : 'neutral');

        // Игрок может держать очки сразу в двух категориях, и в поиске он
        // стоит двумя строками. Здесь же показывалась только домашняя, и
        // вторая со страницы пропадала
        if (myCats.length > 0) {
            var homeLabel = KSLT_YAZYK.выбрать('home', 'негизги', 'домашняя');
            myCats.forEach(function(c) {
                var played = (c.wins || 0) + (c.losses || 0);
                var rate = played ? Math.round(c.wins / played * 100) : 0;

                html += '<div class="pp-cat-block pp-fade-in">';
                html += '<div class="pp-cat-head">' +
                    '<span class="pp-cat-name">' + KSLT_экранировать(c.name) + '</span>' +
                    (c.isHome ? '<span class="pp-cat-home">' + homeLabel + '</span>' : '') +
                    // У только что назначенной категории места ещё нет
                    (c.rank ? '<span class="pp-cat-place">#' + c.rank + '</span>' : '') +
                '</div>';
                html += '<div class="pp-stats">';
                html += statCard(c.points, L.statsPoints, c.isHome ? changeText : '', c.isHome ? changeClass : '');
                html += statCard(c.wins || 0, L.statsWins, '', '');
                html += statCard(c.losses || 0, L.statsLosses, '', '');
                html += statCard(rate + '%', L.statsWinRate, '', '');
                html += '</div>';
                html += ppCatBar(c.wins || 0, c.losses || 0);
                html += '</div>';
            });

        } else {
            html += '<div class="pp-stats pp-fade-in">';
            html += statCard(player.points, L.statsPoints, changeText, changeClass);
            html += statCard(player.wins, L.statsWins, '', '');
            html += statCard(player.losses, L.statsLosses, '', '');
            html += statCard(winRate + '%', L.statsWinRate, '', '');
            html += '</div>';
        }

        // Без этой строчки цифры выглядят враньём: в истории матчей ниже
        // одиннадцать игр, а побед и поражений здесь четыре. Дружеские,
        // парные, микст и баттлы в зачёт не идут
        html += '<div class="pp-stats-note">' + KSLT_экранировать(L.statsNote || '') + '</div>';
        html += pairBlocksHtml(player);

        // ---- Rating history: линия на категорию ----
        // Секция скрыта, пока не окажется, что игроку есть что показать —
        // её открывает сам график, когда находит записи
        html += '<div class="pp-section pp-fade-in" id="ppChartSection" style="display:none;">';
        html += '<h3 class="pp-section-title">📈 ' + L.sectionRatingHistory + '</h3>';
        // У графика NTRP подпись была, у графика очков — нет, и понять,
        // что на нём нарисовано, можно было только по оси
        html += '<div class="pp-chart-label">' + L.chartPoints + '</div>';
        html += '<div class="pp-chart-box"><canvas id="ppRatingChart"></canvas></div>';
        html += '<div id="ppNtrpWrap" style="display:none;">';
        html += '<div class="pp-chart-label">NTRP</div>';
        html += '<div class="pp-chart-box pp-chart-box-sm"><canvas id="ppNtrpChart"></canvas></div>';
        html += '</div>';
        html += '</div>';

        // ---- My Games (combined: Matches + Challenges + Tournaments) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFBE ' + L.sectionGames + '</h3>';

        // -- Subsection: Matches --
        html += '<div class="pp-subsection">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubMatches">';
        html += '<span>\u2694\uFE0F ' + L.subsectionMatches + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubMatches">';
        html += '<div class="pp-matches" id="ppMatchesContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        // -- Subsection: Challenges --
        html += '<div class="pp-subsection" id="ppChallengesSection" style="display:none">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubChallenges">';
        html += '<span>\uD83E\uDD4A ' + L.subsectionChallenges + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubChallenges">';
        html += '<div class="pp-matches" id="ppChallengesContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        // -- Subsection: Tournaments --
        html += '<div class="pp-subsection">';
        html += '<button class="pp-subsection-toggle pp-subsection-open" data-target="ppSubTournaments">';
        html += '<span>\uD83C\uDFC6 ' + L.subsectionTournaments + '</span><span class="pp-toggle-arrow">\u25BC</span></button>';
        html += '<div class="pp-subsection-body" id="ppSubTournaments">';
        html += '<div class="pp-tournaments" id="ppTournamentsContainer">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div></div>';

        html += '</div>'; // .pp-section (My Games)

        // ---- Контакты: только членам клуба и только если игрок разрешил ----
        html += '<div id="ppContacts"></div>';

        // ---- Achievements (bottom of page) ----
        html += '<div class="pp-section pp-fade-in">';
        html += '<h3 class="pp-section-title">\uD83C\uDFC5 ' + L.sectionAchievements + '</h3>';
        html += '<div class="pp-achievements" id="ppAchievements">';
        html += '<div class="pp-loading">' + LH.loading + '</div>';
        html += '</div></div>';

        // ---- CTA (guest / registered only, hidden for members) ----
        if (_accessLevel !== 'member') {
            var pricingPage = KSLT_YAZYK.выбрать('pricing-en.html', 'pricing-kg.html', 'pricing.html');
            html += '<div class="pp-cta pp-fade-in">';
            if (_accessLevel === 'registered') {
                var ctaTitleReg = KSLT_YAZYK.выбрать('Want to <span>compete</span>?', '<span>Мелдешкиңиз</span> келеби?', 'Хочешь <span>играть</span>?');
                var ctaTextReg = KSLT_YAZYK.выбрать('Get a KSLT membership to challenge players and join tournaments', 'Оюнчуларга кыйынчылык жана мелдештерге катышуу үчүн KSLT мүчөлүгүн алыңыз', 'Оформи членство KSLT, чтобы бросить вызов игрокам и участвовать в турнирах');
                var ctaBtnReg = KSLT_YAZYK.выбрать('Get Membership', 'Мүчөлүк алуу', 'Оформить членство');
                html += '<h3>' + ctaTitleReg + '</h3>';
                html += '<p>' + ctaTextReg + '</p>';
                html += '<a href="' + pricingPage + '" class="pp-cta-btn">' + ctaBtnReg + ' \u2192</a>';
            } else {
                html += '<h3>' + L.ctaTitle + '</h3>';
                html += '<p>' + L.ctaText + '</p>';
                html += '<a href="' + authPage + '" class="pp-cta-btn">' + L.ctaBtn + ' \u2192</a>';
            }
            html += '</div>';
        }

        html += '</div>'; // .pp-container
        el.innerHTML = html;

        // Back button: history.back() with ratings fallback
        var backBtn = el.querySelector('.kslt-back');
        if (backBtn) {
            backBtn.addEventListener('click', function(e) {
                e.preventDefault();
                var fallback = backBtn.getAttribute('href');
                history.back();
                setTimeout(function() { window.location.href = fallback; }, 200);
            });
        }

        // Кнопка вызова уехала в баннер вместе с карточкой игрока
        var chalBtn = document.getElementById('ppChallengeBtn');
        if (chalBtn) checkChallengeAllowed(data.player, chalBtn);
        if (chalBtn) {
            chalBtn.addEventListener('click', function() {
                handleChallengeClick(data.player);
            });
        }

        // Приглашение поиграть — общий механизм из invite-player.js: он же
        // проверяет уровень доступа и показывает окно гостю
        var invBtn = document.getElementById('ppInviteBtn');
        if (invBtn) {
            invBtn.addEventListener('click', function() {
                if (window.KSLT_INVITE) window.KSLT_INVITE.click(data.player.id);
            });
        }

        // Subsection toggle handlers
        el.querySelectorAll('.pp-subsection-toggle').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var targetId = btn.getAttribute('data-target');
                var body = document.getElementById(targetId);
                if (!body) return;
                var isOpen = btn.classList.contains('pp-subsection-open');
                if (isOpen) {
                    body.classList.add('pp-subsection-collapsed');
                    btn.classList.remove('pp-subsection-open');
                    btn.querySelector('.pp-toggle-arrow').textContent = '\u25B6';
                } else {
                    body.classList.remove('pp-subsection-collapsed');
                    btn.classList.add('pp-subsection-open');
                    btn.querySelector('.pp-toggle-arrow').textContent = '\u25BC';
                }
            });
        });

        // Async load real data from Supabase
        loadRealMatches(data);
        loadRealTournaments(data);
        loadPlayerChallenges();
    }

    // ================================================
    // SUPABASE: Real Matches
    // ================================================

    // Cache for Supabase-loaded player names (opponent display)
    var _playerCache = {};

    /**
     * Инициалы для кружка вместо фотографии.
     *
     * Две буквы, а не одна: по одной букве однофамильцы и тёзки сливаются, а
     * у пары два кружка выглядели бы одинаково. Больше двух в кружок не
     * влезает, поэтому у длинных имён берём первое слово и последнее.
     *
     * Правило взято у кабинета (`js/dashboard.js:3358`) БЕЗ нового разбора:
     * человек видит одни и те же буквы на обеих страницах.
     */
    /* Инициалы — одно определение на продукт: js/kslt-lico.js. ЭТО
       поведение и стало общим: имя плюс фамилия, как у Apple и Linear. */
    function инициалыИмени(имя) { return window.KSLT_LICO.инициалы(имя); }

    /**
     * Кружок игрока: фотография, а без неё — инициалы.
     *
     * Здесь стоял адрес на чужой CDN (`placehold.co`): три одинаковых серых
     * вопросительных знака в строке, запрос наружу на каждый из них и пустой
     * короб, когда сеть до него не дошла. Инициалы рисуются своими силами —
     * так уже сделано в кабинете, на пьедестале и в карточках вызова.
     */
    function кружокИгрока(имя, фото, класс) {
        var кл = класс || 'pp-match-opponent-photo';
        return фото
            ? '<img src="' + KSLT_экранировать(фото) + '" alt="' + KSLT_экранировать(имя || '') + '" class="' + кл + '">'
            : '<span class="' + кл + ' pp-photo-ph" aria-hidden="true">' +
                KSLT_экранировать(инициалыИмени(имя)) + '</span>';
    }

    // Look up player from static data or cache
    function lookupPlayer(id) {
        var d = findPlayer(id);
        if (d) return { id: id, name: d.player.name, photo: d.player.photo || '' };
        if (_playerCache[id]) return _playerCache[id];
        // Async load into cache for next render
        if (client) {
            client.from('players_public').select('id, name, name_en, name_kg, photo').eq('id', id).single()
                .then(function(res) {
                    if (res.data) {
                        var n = KSLT_YAZYK.выбрать(res.data.name_en || res.data.name, res.data.name_kg || res.data.name, res.data.name);
                        _playerCache[id] = { id: id, name: n || id, photo: res.data.photo || '' };
                    }
                });
        }
        return { id: id, name: id, photo: '' };
    }

    /**
     * Турниры, где игрок заявлен НАПАРНИКОМ: { турнир: капитан пары }.
     *
     * В матче помещаются только двое — `player1_id` и `player2_id`, и это
     * капитаны пар. Напарник в матче не упомянут вовсе, поэтому своих парных
     * игр он на этой странице не видел: у Дениса Ли 11.10 выходило 25 матчей
     * вместо 29 и 5 турниров вместо 7, а заявок напарником в базе 114 — у 86
     * разных игроков. Пару восстанавливаем по заявке: она знает и капитана,
     * и напарника. Приём взят из кабинета, где он уже работает
     * (js/dashboard.js:3213 и :3236), чтобы правило было одно.
     */
    async function турнирыНапарника(pid) {
        var итог = {};
        if (!client || !pid) return итог;
        var res = await client.from('tournament_registrations')
            .select('tournament_id, player_id')
            .eq('partner_id', pid)
            .in('status', ['approved', 'draw']);
        (res.data || []).forEach(function(r) {
            if (r.tournament_id && r.player_id) итог[r.tournament_id] = r.player_id;
        });
        return итог;
    }

    /**
     * Составы пар в парных турнирах списка: { турнир: { капитан: напарник } }.
     *
     * Одним запросом на все турниры сразу, а не по строке: в списке их до
     * пятидесяти. Напарник может быть не из клуба — тогда от него в заявке
     * осталось только вписанное имя, и фото взять неоткуда.
     */
    async function составыПар(matches) {
        var пары = {};
        if (!client) return пары;
        var ids = [];
        matches.forEach(function(m) {
            var род = matchKind(m);
            if (род !== 'doubles' && род !== 'mixed') return;
            if (m.tournament_id && ids.indexOf(m.tournament_id) === -1) ids.push(m.tournament_id);
        });
        if (!ids.length) return пары;
        var res = await client.from('tournament_registrations')
            .select('tournament_id, player_id, partner_id, partner_external_name')
            .in('tournament_id', ids);
        ids.forEach(function(tid) { пары[tid] = {}; });
        (res.data || []).forEach(function(r) {
            if (!пары[r.tournament_id] || !r.player_id) return;
            пары[r.tournament_id][r.player_id] = {
                id: r.partner_id || '',
                external: r.partner_external_name || ''
            };
        });
        return пары;
    }

    /** Имя и фото напарника по записи состава. */
    function напарникПоСоставу(состав) {
        if (!состав) return null;
        if (состав.id) {
            var и = lookupPlayer(состав.id);
            if (и && и.name && и.name !== состав.id) return { name: и.name, photo: и.photo || '' };
        }
        if (состав.external) return { name: состав.external, photo: '' };
        return null;
    }

    async function loadRealMatches(data) {
        var container = document.getElementById('ppMatchesContainer');
        if (!container) return;

        if (!client) {
            container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;font-size:0.9rem;">' + (KSLT_YAZYK.выбрать('No matches yet', 'Матчтар жок', 'Нет матчей')) + '</div>';
            return;
        }

        // Здесь всё сыгранное: рейтинговые и дружеские турниры, парные, микст
        // и баттлы. В зачёт из этого идут только рейтинговые одиночные —
        // об этом говорит метка у названия турнира
        // Матчи берём и там, где игрок стоит сам, и там, где за его пару
        // записан капитан — иначе напарник своих парных игр не увидит
        var капитаны = await турнирыНапарника(_playerId);
        var условия = ['player1_id.eq.' + _playerId, 'player2_id.eq.' + _playerId];
        Object.keys(капитаны).forEach(function(tid) {
            условия.push('and(tournament_id.eq.' + tid + ',player1_id.eq.' + капитаны[tid] + ')');
            условия.push('and(tournament_id.eq.' + tid + ',player2_id.eq.' + капитаны[tid] + ')');
        });

        var res = await client.from('matches')
            .select('*, match_type, tournament:tournaments(id, title, title_en, title_kg, format, category_id)')
            .or(условия.join(','))
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .limit(50);

        if (res.error || !res.data || res.data.length === 0) {
            container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;font-size:0.9rem;">' + (KSLT_YAZYK.выбрать('No matches yet', 'Матчтар жок', 'Нет матчей')) + '</div>';
            return;
        }

        var пары = await составыПар(res.data);

        // Имена соперников забираем одним запросом до отрисовки. Раньше
        // каждое имя догружалось по одному и попадало в список только
        // при следующей отрисовке — до неё в строке стоял внутренний
        // адрес карточки, вроде «erlan-shekerbekov».
        // Напарники — своей и чужой стороны — идут тем же запросом: иначе
        // первая отрисовка показала бы вместо имени адрес карточки
        var чужие = [];
        function дозапросить(id) {
            if (id && !_playerCache[id] && чужие.indexOf(id) === -1) чужие.push(id);
        }
        res.data.forEach(function(m) {
            var мойКапитан = капитаны[m.tournament_id] || _playerId;
            дозапросить(m.player1_id === мойКапитан ? m.player2_id : m.player1_id);
            if (мойКапитан !== _playerId) дозапросить(мойКапитан);
            var составы = пары[m.tournament_id];
            if (!составы) return;
            [m.player1_id, m.player2_id].forEach(function(cap) {
                if (составы[cap] && составы[cap].id) дозапросить(составы[cap].id);
            });
        });
        if (чужие.length) {
            var сп = await client.from('players_public')
                .select('id, name, name_en, name_kg, photo').in('id', чужие);
            (сп.data || []).forEach(function(p) {
                var имя = KSLT_YAZYK.выбрать(p.name_en || p.name, p.name_kg || p.name, p.name);
                _playerCache[p.id] = { id: p.id, name: имя || p.id, photo: p.photo || '' };
            });
        }

        renderRealMatches(container, res.data, капитаны, пары);
    }

    var _allMatchesLoaded = false;

    /* ОТСЕЧКА ОБЩАЯ, А НЕ СВОЯ. Здесь была ТРЕТЬЯ копия механизма — с
       пределом 25 и своими кнопками «показать все» и «свернуть», — при том
       что слово Кости 06.10 говорит «10 везде», а механизм уже жил на
       странице турнира. Теперь один: js/kslt-otsechka.js.
       Строки рисуются ВСЕ: лишние получают класс и скрыты видом, значит их
       находит поиск по странице и читает диктор. */
    function renderRealMatches(container, matches, капитаны, пары) {
        капитаны = капитаны || {};
        пары = пары || {};
        var visible = matches;
        var html = '';
        visible.forEach(function(m, индекс) {
            // Моя сторона — это я сам, а в парном турнире, где я напарник,
            // капитан моей пары: в матче записан он
            var мойКапитан = капитаны[m.tournament_id] || _playerId;
            var isP1 = m.player1_id === мойКапитан;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var opp = lookupPlayer(oppId);
            var result = m.winner_id === мойКапитан ? 'W' : 'L';
            var oppPhoto = opp.photo || '';
            var score = m.score || '';
            var displayScore = isP1 ? показатьСчёт(score) : показатьСчёт(перевернутьСчёт(score));

            var tName = m.tournament ? (KSLT_YAZYK.выбрать(m.tournament.title_en || m.tournament.title, m.tournament.title_kg || m.tournament.title, m.tournament.title)) : '';
            var tId = m.tournament ? m.tournament.id : '';

            // Пары и микст в личные встречи не идут: в матче записаны
            // капитаны, а состав пары меняется от турнира к турниру
            var kind = matchKind(m);
            var pairGame = kind === 'doubles' || kind === 'mixed';

            html += '<div class="pp-match' + (pairGame ? '' : ' pp-match-clickable') +
                window.KSLT_OTSECHKA.класс(индекс, matches.length) + '"' +
                (tId ? ' data-tournament-id="' + KSLT_экранировать(tId) + '"' : '') +
                (pairGame ? '' : ' data-opponent-id="' + KSLT_экранировать(opp.id) +
                    '" data-opponent-name="' + KSLT_экранировать(opp.name) +
                    '" data-opponent-photo="' + KSLT_экранировать(oppPhoto) + '"') + '>';
            html += '<div class="pp-match-date">' + formatMatchDate(m.played_at) + '</div>';
            var tPage = KSLT_YAZYK.выбрать('tournament-en.html', 'tournament-kg.html', 'tournament.html');

            /* С КЕМ ИГРАЛИ В ПАРЕ. Капитану напарника знает заявка; напарнику
               парой был капитан, который и записан в матче. Слова те же, что
               в кабинете (js/dashboard.js:839, :537, :235), чтобы одно и то же
               называлось одинаково. Через L не идём: словарь на этой странице
               всегда русский — window.playerProfileLabels нигде не заводится,
               померено 11.10 на player-en.html, где метки матчей выходят
               по-русски. Это записано в находки. */
            var составы = пары[m.tournament_id] || {};
            var мойНапарник = null, напарникСоперника = null;
            if (pairGame) {
                мойНапарник = (мойКапитан === _playerId)
                    ? напарникПоСоставу(составы[_playerId])
                    : { name: lookupPlayer(мойКапитан).name, photo: lookupPlayer(мойКапитан).photo };
                напарникСоперника = напарникПоСоставу(составы[oppId]);
            }
            var словоВПаре = KSLT_YAZYK.выбрать('with', 'жупташы', 'в паре с');

            html += '<div class="pp-match-tournament">' +
                '<span class="pp-match-tournament-row">' +
                    (tName ? '<a href="' + tPage + '?id=' + KSLT_экранировать(tId) + '&tab=bracket">' + KSLT_экранировать(tName) + '</a>' : '') +
                    matchKindTag(m) +
                '</span>' +
                (мойНапарник ? '<span class="pp-match-mate">' + словоВПаре +
                    ' <span class="pp-match-mate-name">' + KSLT_экранировать(мойНапарник.name) + '</span></span>' : '') +
                '</div>';

            html += '<div class="pp-match-opponent">';
            if (напарникСоперника) {
                // У пары кружков два, внахлёст, и два имени в столбик: одно
                // фото и одно имя на двоих обманывали — играли четверо
                html += '<span class="pp-match-opponent-photos">' +
                    кружокИгрока(opp.name, oppPhoto) +
                    кружокИгрока(напарникСоперника.name, напарникСоперника.photo,
                        'pp-match-opponent-photo pp-match-opponent-photo-2') +
                    '</span>';
                html += '<span class="pp-match-opponent-pair">' +
                    '<span class="pp-match-opponent-name">' + KSLT_экранировать(opp.name) + '</span>' +
                    '<span class="pp-match-opponent-name">' + KSLT_экранировать(напарникСоперника.name) + '</span>' +
                    '</span>';
            } else {
                html += кружокИгрока(opp.name, oppPhoto);
                html += '<span class="pp-match-opponent-name">' + KSLT_экранировать(opp.name) + '</span>';
            }
            html += '</div>';
            html += '<div class="pp-match-score">' + KSLT_экранировать(displayScore) + '</div>';
            html += '<div class="pp-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</div>';
            if (!pairGame) html += '<button class="pp-match-h2h" title="Head to Head">H2H</button>';
            html += '</div>';
        });

        html += window.KSLT_OTSECHKA.кнопка(matches.length, lang);

        container.innerHTML = html;
        attachMatchClickHandlers(container);
        window.KSLT_OTSECHKA.включить(container);
    }


    function attachMatchClickHandlers(container) {
        // Строка матча выглядит нажимаемой — пусть и ведёт куда-то: в сетку
        // турнира, где матчи этого игрока обведены. Кнопка H2H и ссылка на
        // турнир внутри строки работают по-своему, их не перехватываем
        container.querySelectorAll('.pp-match[data-tournament-id]').forEach(function(row) {
            row.addEventListener('click', function(e) {
                if (e.target.closest('.pp-match-h2h') || e.target.closest('a')) return;
                var tPage = KSLT_YAZYK.выбрать('tournament-en.html', 'tournament-kg.html', 'tournament.html');
                window.location.href = tPage + '?id=' + encodeURIComponent(row.getAttribute('data-tournament-id')) +
                    '&player=' + encodeURIComponent(_playerId);
            });
        });

        container.querySelectorAll('.pp-match-h2h').forEach(function(btn) {
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                var row = btn.closest('.pp-match-clickable');
                if (!row) return;
                var oppId = row.getAttribute('data-opponent-id');
                var oppName = row.getAttribute('data-opponent-name');
                var oppPhoto = row.getAttribute('data-opponent-photo');
                showH2H(oppId, oppName, oppPhoto);
            });
        });
    }

    // ================================================
    // SUPABASE: Real Tournaments
    // ================================================
    function loadRealTournaments(data) {
        var container = document.getElementById('ppTournamentsContainer');
        if (!container) return;

        /* ВЫДУМАННЫХ ТУРНИРОВ БОЛЬШЕ НЕТ. Пока базы нет, здесь рисовались
           четыре придуманных турнира с придуманными результатами —
           «KSLT Open 2026», «Winter Cup 2025» — и человек не мог отличить
           их от настоящих. Пустое говорит, ПОЧЕМУ пусто (Empty state
           37:53: «never just no data»), а не показывает выдумку.
           УМОЛЧАНИЕ — СВОЙСТВО ДАННЫХ, А НЕ РАЗМЕТКИ. */
        if (!client) {
            container.innerHTML = '<div class="pp-badges-empty">' +
                (KSLT_YAZYK.выбрать('Tournaments are not available right now', 'Турнирлер учурда жеткиликсиз', 'Турниры сейчас недоступны')) + '</div>';
            return;
        }

        Promise.all([
            // И свои заявки, и те, где игрок записан напарником: в парной
            // заявке капитан один, а играли двое
            client.from('tournament_registrations')
                .select('status, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                .or('player_id.eq.' + _playerId + ',partner_id.eq.' + _playerId)
                .in('status', ['approved', 'draw'])
                .order('registered_at', { ascending: false })
                .limit(10),
            client.from('tournament_results')
                .select('tournament_id, round_reached, points_earned, tournament:tournaments(id, title, title_en, title_kg, date_start, image)')
                .eq('player_id', _playerId)
                .order('created_at', { ascending: false })
                .limit(10),
            // Записи, добавленные админом руками: турнира с таким названием
            // в базе нет, но игра была и очки начислены
            client.from('rating_history')
                .select('tournament_name, points_earned, recorded_at')
                .eq('player_id', _playerId)
                .is('tournament_id', null)
                .not('category_id', 'is', null)
                .order('recorded_at', { ascending: false })
                .limit(10)
        ]).then(function(results) {
            var regs = results[0].data || [];
            var tResults = results[1].data || [];
            var manualRows = results[2].data || [];

            // Map results by tournament_id
            var resultsMap = {};
            tResults.forEach(function(tr) { resultsMap[tr.tournament_id] = tr; });

            // Merge registrations + results
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

            manualRows.forEach(function(rh) {
                items.push({
                    tournament: { id: '', title: rh.tournament_name, date_start: rh.recorded_at },
                    points_earned: rh.points_earned || 0,
                    manual: true
                });
            });

            if (items.length === 0) {
                container.innerHTML = '<div style="color:var(--text-muted);text-align:center;padding:20px;font-size:0.9rem;">' +
                    (KSLT_YAZYK.выбрать('No tournaments yet', 'Турнирлер жок', 'Нет турниров')) + '</div>';
                return;
            }

            // Split into upcoming and past
            var today = KSLT_VREMYA.сегодня();
            var upcoming = [];
            var past = [];
            items.forEach(function(item) {
                var isUpcoming = !item.round_reached && item.tournament.date_start && item.tournament.date_start >= today;
                if (isUpcoming) upcoming.push(item);
                else past.push(item);
            });

            var html = '';

            // Upcoming tournaments
            if (upcoming.length) {
                html += '<div class="pp-tournament-section-label">' + LH.upcoming + '</div>';
                upcoming.forEach(function(item) {
                    html += renderTournamentCard(item, true);
                });
            }

            // Past tournaments
            if (past.length) {
                if (upcoming.length) {
                    html += '<div class="pp-tournament-section-label" style="margin-top:12px;">' +
                        (KSLT_YAZYK.выбрать('Played', 'Ойнолгон', 'Сыгранные')) + '</div>';
                }
                past.forEach(function(item, индекс) {
                    html += renderTournamentCard(item, false, индекс, past.length);
                });
                /* Та же отсечка, что у матчей и у страницы турнира: прошедших
                   бывает много — у Азима Исакова 17, и список уходил вниз без
                   края. Будущие не прячем: их единицы, и они и есть новость. */
                html += window.KSLT_OTSECHKA.кнопка(past.length, lang);
            }

            container.innerHTML = html;
            window.KSLT_OTSECHKA.включить(container);
        });
    }

    function renderTournamentCard(item, isUpcoming, индекс, всего) {
        /* НАЗВАНИЕ МЕСТА — ОДНО ОПРЕДЕЛЕНИЕ НА ПРОДУКТ, `js/kslt-mesta.js`.
           Своя карта тут не просто дублировала словарь: `R16` и `R32` в
           ней НЕ БЫЛИ ПЕРЕВЕДЕНЫ ВОВСЕ — человек видел «R16» вместо
           «1/8 финала», на всех трёх языках. Копия отстаёт молча, и это
           ровно тот случай.
           Кубок остаётся здесь: эмодзи — украшение места показа, а не
           часть названия, и в словаре ему не место. */
        var ЯЗЫК = KSLT_YAZYK.выбрать('en', 'kg', 'ru');
        function подписьМеста(код) {
            var т = window.KSLT_MESTA ? window.KSLT_MESTA.подпись(ЯЗЫК, код) : код;
            return код === 'W' ? '🏆 ' + т : т;
        }
        var t = item.tournament;
        var tName = KSLT_YAZYK.выбрать(t.title_en || t.title, t.title_kg || t.title, t.title);
        var dateStr = t.date_start ? t.date_start.slice(8,10) + '.' + t.date_start.slice(5,7) + '.' + t.date_start.slice(0,4) : '';
        var tImg = t.image || '';
        var tPage = 'tournament' + (KSLT_YAZYK.суффикс) + '.html?id=' + t.id + '&tab=bracket';
        var result;
        if (isUpcoming) {
            result = LH.registered;
        } else {
            result = item.round_reached ? (подписьМеста(item.round_reached) || item.round_reached) : LH.participated;
            if (item.points_earned > 0) result += ' · +' + item.points_earned;
        }
        var resultClass = isUpcoming ? ' pp-tournament-upcoming' : (item.round_reached === 'W' ? ' pp-tournament-winner' : '');
        // Запись, добавленную админом руками, открывать нечего: такого
        // турнира в базе нет. Показываем название и очки, но без ссылки
        var manual = !t.id;
        // Номер строки приходит только у прошедших: будущие не прячем
        var отсечка = (typeof всего === 'number')
            ? window.KSLT_OTSECHKA.класс(индекс, всего) : '';
        var html = manual
            ? '<div class="pp-tournament pp-tournament-plain' + отсечка + '">'
            : '<a class="pp-tournament' + отсечка + '" href="' + tPage + '">';
        if (tImg) {
            html += '<img src="' + KSLT_экранировать(tImg) + '" alt="' + KSLT_экранировать(tName) + '" class="pp-tournament-photo">';
        } else {
            html += '<div class="pp-tournament-photo pp-tournament-photo-empty">\uD83C\uDFBE</div>';
        }
        html += '<div class="pp-tournament-info"><span class="pp-tournament-name">' + KSLT_экранировать(tName) + '</span>';
        if (dateStr) html += '<span class="pp-tournament-date">' + dateStr + '</span>';
        html += '</div>';
        html += '<span class="pp-tournament-result' + resultClass + '">' + result + '</span>';
        html += manual ? '</div>' : '</a>';
        return html;
    }


    // ================================================
    // SUPABASE: Player Challenges
    // ================================================
    function loadPlayerChallenges() {
        var section = document.getElementById('ppChallengesSection');
        var container = document.getElementById('ppChallengesContainer');
        if (!container || !section || !client) return;

        client.rpc('get_player_challenges', { p_player_id: _playerId })
            .then(function(res) {
                if (res.error || !res.data || res.data.length === 0) {
                    section.style.display = 'none';
                    return;
                }
                section.style.display = '';
                // Force expanded state
                var btn = section.querySelector('.pp-subsection-toggle');
                var body = document.getElementById('ppSubChallenges');
                if (btn && body) {
                    body.classList.remove('pp-subsection-collapsed');
                    btn.classList.add('pp-subsection-open');
                    var arrow = btn.querySelector('.pp-toggle-arrow');
                    if (arrow) arrow.textContent = '\u25BC';
                }
                renderChallenges(container, res.data);
            });
    }

    function renderChallenges(container, challenges) {
        var html = '';
        challenges.forEach(function(c) {
            var isChallenger = c.challenger_player_id === _playerId;
            var oppName, oppPhoto, oppId;
            if (isChallenger) {
                oppName = KSLT_YAZYK.выбрать(c.opponent_name_en || c.opponent_name, c.opponent_name_kg || c.opponent_name, c.opponent_name);
                oppPhoto = c.opponent_photo || '';
                oppId = c.opponent_player_id;
            } else {
                oppName = KSLT_YAZYK.выбрать(c.challenger_name_en || c.challenger_name, c.challenger_name_kg || c.challenger_name, c.challenger_name);
                oppPhoto = c.challenger_photo || '';
                oppId = c.challenger_player_id;
            }

            var date = c.proposed_date || '';
            var score = c.match_score || '';
            var result = chalWinLoss(score, isChallenger);

            var playerPage = KSLT_YAZYK.выбрать('player-en.html', 'player-kg.html', 'player.html');

            html += '<div class="pp-match' + (oppId ? ' pp-match-clickable' : '') + '" data-opponent-id="' + KSLT_экранировать(oppId || '') + '" data-opponent-name="' + KSLT_экранировать(oppName) + '" data-opponent-photo="' + KSLT_экранировать(oppPhoto) + '">';
            html += '<div class="pp-match-date">' + formatChalDate(date) + '</div>';
            html += '<div class="pp-match-tournament"></div>';
            html += '<div class="pp-match-opponent">';
            if (oppId) {
                html += '<a href="' + playerPage + '?id=' + KSLT_экранировать(oppId) + '">';
                html += кружокИгрока(oppName, oppPhoto);
                html += '</a>';
                html += '<a href="' + playerPage + '?id=' + KSLT_экранировать(oppId) + '" class="pp-match-opponent-name" style="color:inherit;text-decoration:none;">' + KSLT_экранировать(oppName) + '</a>';
            } else {
                html += кружокИгрока(oppName, oppPhoto);
                html += '<span class="pp-match-opponent-name" style="color:rgba(255,255,255,0.5);">' + KSLT_экранировать(oppName || 'Unknown') + '</span>';
            }
            html += '</div>';
            html += '<div class="pp-match-score">' + KSLT_экранировать(score || '—') + '</div>';
            if (c.status === 'completed' && result) {
                html += '<div class="pp-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</div>';
            } else {
                html += '<div class="pp-match-result accepted">' + L.challengeAccepted + '</div>';
            }
            if (oppId) {
                html += '<button class="pp-match-h2h" title="Head to Head">H2H</button>';
            }
            html += '</div>';
        });
        container.innerHTML = html;
        attachMatchClickHandlers(container);
    }

    function chalWinLoss(score, isChallenger) {
        if (!score) return null;
        var sets = score.trim().split(/\s+/);
        var s1 = 0, s2 = 0;
        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (m) {
                if (parseInt(m[1]) > parseInt(m[2])) s1++;
                else s2++;
            }
        });
        if (s1 === s2) return null;
        var p1Won = s1 > s2;
        return isChallenger ? (p1Won ? 'W' : 'L') : (p1Won ? 'L' : 'W');
    }

    function formatChalDate(d) {
        if (!d) return '';
        var parts = d.split('-');
        if (parts.length === 3) return parts[2] + '.' + parts[1];
        return d;
    }

    // ================================================
    // H2H MODAL
    // ================================================
    function showH2H(oppId, oppName, oppPhoto) {
        var old = document.querySelector('.h2h-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'h2h-overlay';
        // ОКНО НАЗЫВАЕТ СЕБЯ ОКНОМ. Замер 09.10: ни role, ни aria-modal, и
        // фокус оставался на body — с клавиатуры окно было невидимо вовсе
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', LH.title || 'Head to Head');
        overlay.innerHTML =
            '<div class="h2h-modal">' +
                '<button class="h2h-close" aria-label="' + (LH.close || 'Закрыть') + '">&times;</button>' +
                '<div class="h2h-loading">' + LH.loading + '</div>' +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });

        // Close handlers
        var closeBtn = overlay.querySelector('.h2h-close');
        closeBtn.addEventListener('click', function() { closeH2H(overlay); });

        // ЛОВУШКА TAB И ВОЗВРАТ ФОКУСА — то же решение, что у смотрелки
        // фотографий 08.10: пока окно открыто, клавиша не уводит за него, а
        // при закрытии фокус возвращается туда, откуда окно позвали
        var фокусДоОкна = document.activeElement;
        closeBtn.focus();
        /* ЗАПИРАНИЕ БЕРЁТСЯ ДОМОМ (152, 23.10). Ловушка висела НА ПОДЛОЖКЕ,
           и ветвь «фокус оказался под окном» была мёртвой: нажатие под окном
           до подложки не всплывает. И ОКНО ТЕКЛО: слушатель Escape снимался
           ТОЛЬКО на пути Escape, а при закрытии кнопкой или фоном оставался
           на `document` навсегда. Снятие теперь одно и висит на собственном
           событии окна — его дают все три пути закрытия, ровно затем оно и
           заведено. */
        var снять = window.KSLT_FOKUS.запереть(overlay, {
            поEsc: function() { closeH2H(overlay); }
        });
        overlay.addEventListener('h2h-closed', function() {
            снять();
            if (фокусДоОкна && фокусДоОкна.focus) фокусДоОкна.focus();
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeH2H(overlay);
        });

        if (!client) {
            renderH2HEmpty(overlay);
            return;
        }

        // Один источник — таблица matches. Баттлы попадают туда отдельной
        // строкой при вводе счёта, там же стоит winner_id.
        //
        // Раньше баттлы добирались вторым запросом, из challenges, а
        // победителя приходилось угадывать разбором строки счёта. Два способа
        // посчитать одно и то же: у завершённого баттла score_draft
        // обнуляется, так что второй запрос давно ничего не находил, а на
        // старых записях считал встречу дважды.
        client.from('matches')
            .select('id, player1_id, player2_id, score, winner_id, played_at, match_type, tournament:tournaments(title, title_en, title_kg, format, category_id)')
            .or('and(player1_id.eq.' + _playerId + ',player2_id.eq.' + oppId + '),and(player1_id.eq.' + oppId + ',player2_id.eq.' + _playerId + ')')
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .then(function(res) {
                var modal = overlay.querySelector('.h2h-modal');
                if (!modal) return;

                // Пары и микст сюда не идут: в матче записаны капитаны, а
                // состав пары меняется от турнира к турниру — счёт «двое на
                // двое» выдавался бы за личную встречу двоих
                var allMatches = (res.data || []).filter(function(m) {
                    var k = matchKind(m);
                    return k !== 'doubles' && k !== 'mixed';
                });

                if (allMatches.length === 0) {
                    renderH2HEmpty(overlay);
                    return;
                }

                renderH2HContent(modal, allMatches, oppId, oppName, oppPhoto);
                attachH2HCloseBtn(overlay);
            });
    }

    function renderH2HContent(modal, matches, oppId, oppName, oppPhoto) {
        var myWins = 0, oppWins = 0;
        var mySets = 0, oppSets = 0;
        var myGames = 0, oppGames = 0;

        matches.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            if (m.winner_id === _playerId) myWins++; else oppWins++;

            if (m.score) {
                var stats = разборСчёта(m.score);
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

        var profileUrl = playerPage() + '?id=' + oppId;

        var html = '<button class="h2h-close">&times;</button>';

        // Header: avatars + score
        html += '<div class="h2h-header">';
        html += '<div class="h2h-player">';
        html += кружокИгрока(_playerName, _playerPhoto, 'h2h-photo');
        html += '<div class="h2h-name">' + KSLT_экранировать(_playerName) + '</div>';
        html += '</div>';
        html += '<div class="h2h-center">';
        var totalMatches = matches.length;
        var matchesLabel = KSLT_YAZYK.выбрать(totalMatches + ' matches', totalMatches + ' матч', totalMatches + ' матчей');
        html += '<div class="h2h-score">' + myWins + ' \u2014 ' + oppWins + '</div>';
        html += '<div class="h2h-label">' + matchesLabel + '</div>';
        html += '</div>';
        html += '<div class="h2h-player">';
        html += кружокИгрока(oppName, oppPhoto, 'h2h-photo');
        html += '<div class="h2h-name">' + KSLT_экранировать(oppName) + '</div>';
        html += '</div>';
        html += '</div>';

        // Stats
        html += '<div class="h2h-stats">';
        html += '<div class="h2h-stat-row">';
        html += '<span class="h2h-stat-val h2h-val-left">' + mySets + '</span>';
        html += '<span class="h2h-stat-label">' + LH.setsWon + '</span>';
        html += '<span class="h2h-stat-val h2h-val-right">' + oppSets + '</span>';
        html += '</div>';
        html += '<div class="h2h-stat-row">';
        html += '<span class="h2h-stat-val h2h-val-left">' + myGames + '</span>';
        html += '<span class="h2h-stat-label">' + LH.gamesWon + '</span>';
        html += '<span class="h2h-stat-val h2h-val-right">' + oppGames + '</span>';
        html += '</div>';
        html += '</div>';

        // Last 5 matches
        var last5 = matches.slice(0, 5);
        html += '<div class="h2h-matches">';
        html += '<div class="h2h-matches-title">' + LH.last5 + '</div>';
        last5.forEach(function(m) {
            var isP1 = m.player1_id === _playerId;
            var result = m.winner_id === _playerId ? 'W' : 'L';
            var score = m.score || '';
            var displayScore = isP1 ? показатьСчёт(score) : показатьСчёт(перевернутьСчёт(score));
            var tName = '';
            if (m.tournament) {
                tName = KSLT_YAZYK.выбрать(m.tournament.title_en || m.tournament.title, m.tournament.title_kg || m.tournament.title, m.tournament.title);
            }

            html += '<div class="h2h-match">';
            html += '<span class="h2h-match-date">' + formatMatchDate(m.played_at) + '</span>';
            html += '<span class="h2h-match-tournament"><span class="h2h-tname">' + KSLT_экранировать(tName) +
                '</span>' + matchKindTag(m) + '</span>';
            html += '<span class="h2h-match-score">' + KSLT_экранировать(displayScore) + '</span>';
            html += '<span class="h2h-match-result ' + (result === 'W' ? 'win' : 'loss') + '">' + (result === 'W' ? L.win : L.loss) + '</span>';
            html += '</div>';
        });
        html += '</div>';

        // Profile link
        html += '<a href="' + profileUrl + '" class="h2h-profile-btn">' + LH.fullProfile + ' \u2192</a>';

        modal.innerHTML = html;
    }

    function renderH2HEmpty(overlay) {
        var modal = overlay.querySelector('.h2h-modal');
        if (!modal) return;
        modal.innerHTML =
            '<button class="h2h-close">&times;</button>' +
            '<div class="h2h-empty">' + LH.noMatches + '</div>';
        attachH2HCloseBtn(overlay);
    }

    function closeH2H(overlay) {
        overlay.classList.remove('visible');
        // Возврат фокуса слушает сам оверлей: закрыть окно можно тремя
        // способами — кнопкой, фоном и Esc, — а вернуть фокус надо один раз
        overlay.dispatchEvent(new CustomEvent('h2h-closed'));
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 300);
    }

    function attachH2HCloseBtn(overlay) {
        var btn = overlay.querySelector('.h2h-close');
        if (btn) {
            btn.addEventListener('click', function() { closeH2H(overlay); });
        }
    }

    // ---- Render Badges Section ----
    function renderBadgesSection() {
        var container = document.getElementById('ppAchievements');
        if (!container) return;

        var earnedIds = {};
        _earnedBadges.forEach(function(pb) { earnedIds[pb.badge_id] = pb; });

        var earned = [];
        var locked = [];
        _allBadges.forEach(function(b) {
            if (earnedIds[b.id]) {
                earned.push({ def: b, pb: earnedIds[b.id] });
            } else {
                locked.push(b);
            }
        });

        if (earned.length === 0 && locked.length === 0) {
            container.innerHTML = '<div class="pp-badges-empty">' +
                (KSLT_YAZYK.выбрать('No achievements yet', 'Жетишкендиктер жок', 'Достижений пока нет')) + '</div>';
            return;
        }

        // Progress bar
        var total = earned.length + locked.length;
        var pct = total > 0 ? Math.round(earned.length / total * 100) : 0;
        var progressLabel = earned.length + '/' + total;
        var html = '<div class="pp-badges-progress">' +
            '<div class="pp-badges-progress-bar"><div class="pp-badges-progress-fill" style="width:' + pct + '%"></div></div>' +
            '<span class="pp-badges-progress-text">' + progressLabel + '</span>' +
            '</div>';

        // Пока достижений нет, показываем четыре ближайших: человеку видно,
        // за что их дают. Как только появилось хоть одно — страница
        // показывает заслуги, а не список того, чего ещё нет. Остальные
        // прячутся под кнопку «Показать все».
        var LOCKED_VISIBLE = earned.length > 0 ? 0 : 4;

        // All earned badges (always visible)
        earned.forEach(function(item) {
            var b = item.def;
            html += '<div class="pp-achievement pp-achievement-earned" title="' + KSLT_экранировать(getBadgeName(b)) + ' — ' + formatBadgeDate(item.pb.earned_at) + '">';
            html += '<div class="pp-achievement-icon">' + b.icon + '</div>';
            html += '<div class="pp-achievement-info">';
            html += '<div class="pp-achievement-name">' + KSLT_экранировать(getBadgeName(b)) + '</div>';
            html += '<div class="pp-achievement-desc">' + formatBadgeDate(item.pb.earned_at) + '</div>';
            html += '</div></div>';
        });

        // Locked badges — first LOCKED_VISIBLE visible, rest hidden
        locked.forEach(function(b, idx) {
            var hidden = idx >= LOCKED_VISIBLE ? ' pp-badge-hidden' : '';
            html += '<div class="pp-achievement pp-achievement-locked' + hidden + '">';
            html += '<div class="pp-achievement-icon pp-achievement-icon-locked">' + b.icon + '</div>';
            html += '<div class="pp-achievement-info">';
            html += '<div class="pp-achievement-name pp-achievement-name-locked">' + KSLT_экранировать(getBadgeName(b)) + '</div>';
            html += '<div class="pp-achievement-desc">' + KSLT_экранировать(getBadgeDesc(b)) + '</div>';
            html += '</div></div>';
        });

        // Expand button (only if there are hidden locked badges)
        var hiddenCount = Math.max(0, locked.length - LOCKED_VISIBLE);
        if (hiddenCount > 0) {
            var moreLabel = KSLT_YAZYK.выбрать('Show all', 'Баарын көрсөтүү', 'Показать все');
            var lessLabel = KSLT_YAZYK.выбрать('Show less', 'Жашыруу', 'Свернуть');
            html += '<button class="pp-badges-expand" id="ppBadgesExpand">+' + hiddenCount + ' ' + moreLabel + '</button>';
        }

        container.innerHTML = html;

        // Expand toggle
        var expandBtn = document.getElementById('ppBadgesExpand');
        if (expandBtn) {
            var expanded = false;
            expandBtn.addEventListener('click', function() {
                expanded = !expanded;
                var moreLabel = KSLT_YAZYK.выбрать('Show all', 'Баарын көрсөтүү', 'Показать все');
                var lessLabel = KSLT_YAZYK.выбрать('Show less', 'Жашыруу', 'Свернуть');
                container.querySelectorAll('.pp-badge-hidden').forEach(function(el) {
                    el.style.display = expanded ? '' : 'none';
                });
                expandBtn.textContent = expanded ? lessLabel : ('+' + hiddenCount + ' ' + moreLabel);
            });
            // Initially hide overflow
            container.querySelectorAll('.pp-badge-hidden').forEach(function(el) {
                el.style.display = 'none';
            });
        }
    }

    // ---- Not Found ----
    function renderNotFound() {
        var el = document.getElementById('playerDetail');
        if (!el) return;
        var back = getBackLink(null);
        el.innerHTML =
            '<div class="pp-container" style="text-align:center; padding:120px 24px;">' +
            '<h2 style="font-size:1.8rem; margin-bottom:12px;">' + L.playerNotFound + '</h2>' +
            '<p style="color:var(--text-secondary); margin-bottom:24px;">' + L.playerNotFoundText + '</p>' +
            '<a href="' + back.href + '" class="pp-cta-btn">\u2190 ' + back.text + '</a>' +
            '</div>';
    }

    // ---- Scroll Animations ----
    // Наблюдатель живёт всё время жизни страницы: блоки, которые приходят
    // позже — например контакты, — тоже надо проявить. Раньше он создавался
    // один раз при построении страницы, и поздний блок оставался прозрачным
    // навсегда, занимая место пустым промежутком.
    var _fadeObserver = null;

    function initScrollAnimations() {
        if (!_fadeObserver) {
            _fadeObserver = new IntersectionObserver(function (entries) {
                entries.forEach(function (e) {
                    if (e.isIntersecting) {
                        e.target.classList.add('visible');
                        _fadeObserver.unobserve(e.target);
                    }
                });
            }, { threshold: 0.1 });
        }
        document.querySelectorAll('.pp-fade-in:not(.visible)').forEach(function (el) {
            _fadeObserver.observe(el);
        });
    }

    // ---- Update language links with ?id= ----
    function updateLangLinks(playerId) {
        if (!playerId) return;
        var langLinks = document.querySelectorAll('.lang-option, .mobile-lang-option');
        langLinks.forEach(function (link) {
            var href = link.getAttribute('href');
            if (href && href.indexOf('player') !== -1) {
                link.setAttribute('href', href.split('?')[0] + '?id=' + playerId);
            }
        });
    }

    // View counter for player detail page (localStorage dedup)
    function incrementPlayerView(id) {
        if (!id) return;
        var key = 'kslt_plview_' + id;
        if (localStorage.getItem(key)) return;
        if (!client) return;
        client.rpc('increment_player_view', { p_id: id }).then(function(res) {
            if (!res.error) localStorage.setItem(key, '1');
        });
    }

    // ---- Init ----
    document.addEventListener('DOMContentLoaded', async function () {
        var params = new URLSearchParams(window.location.search);
        var playerId = params.get('id');
        _playerId = playerId;

        // Пока идёт бесплатный период, клуб открыт всем: приписка «членство
        // не оформлено» на карточке в это время неверна
        _бесплатныйПериод = window.бесплатныйПериод ? await window.бесплатныйПериод() : false;

        renderHero();
        updateLangLinks(playerId);

        if (!playerId) {
            renderNotFound();
            return;
        }

        var data = null;
        // Supabase first — always prefer live data
        if (client) {
            try {
                var plrRes = await client.from('players_public').select('*').eq('id', playerId).single();
                // Карточка есть только у членов клуба. Гость заведён в базе,
                // чтобы стоять в турнирной сетке, но страницы у него нет
                if (plrRes.data && plrRes.data.is_guest) { renderNotFound(); return; }
                if (plrRes.data) {
                    var p = plrRes.data;
                    var catName = '';
                    var catKey = '';
                    var rank = 0;
                    if (p.category_id) {
                        var catRes = await client.from('categories').select('*').eq('id', p.category_id).single();
                        if (catRes.data) {
                            var c = catRes.data;
                            catName = KSLT_YAZYK.выбрать(c.name_en || c.name, c.name_kg || c.name, c.name);
                            catKey = (c.gender === 'women' ? 'women-' : 'men-') + (c.name_en || c.name).toLowerCase().replace(/[^a-z0-9-]/g, '');
                        }
                    }

                    // Все категории игрока с очками и местом в каждой.
                    // Игрок может стоять в двух: своей и на ступень выше, если
                    // там играл. Очки в каждой считаются отдельно.
                    var myCats = [];
                    var pcRes = await client.from('player_categories')
                        .select('category_id, points, wins, losses, closed_at')
                        .eq('player_id', p.id)
                        .order('points', { ascending: false });

                    var catById = {};
                    // sort_order — ступень лестницы категорий. Порядок карточек
                    // берётся по ней, а не по очкам: набрать в Masters больше,
                    // чем в Pro-Masters, можно, и тогда карточки вставали
                    // наоборот, споря с графиком под ними
                    var allCatsRes = await client.from('categories').select('id, name, name_en, name_kg, sort_order');
                    (allCatsRes.data || []).forEach(function(c) { catById[c.id] = c; });

                    if (pcRes.data && pcRes.data.length > 0) {

                        for (var ci = 0; ci < pcRes.data.length; ci++) {
                            var row = pcRes.data[ci];
                            // Закрытую категорию посторонним не показываем:
                            // игрок в ней больше не выступает. Себе он её
                            // видит в кабинете, вместе с причиной
                            if (row.closed_at) continue;
                            // Friendly в рейтинге не участвует: турниры и матчи
                            // записываются, очков за них нет
                            if (row.category_id === 'friendly') continue;
                            // Место считаем так же, как рейтинг: среди игроков
                            // того же пола. Категория в базе общая на оба
                            var место = window.KSLT_RULES && KSLT_RULES.местоВКатегории
                                ? await KSLT_RULES.местоВКатегории(client, row.category_id, row.points, p.gender)
                                : null;
                            var c2 = catById[row.category_id];
                            myCats.push({
                                id: row.category_id,
                                name: c2 ? (KSLT_YAZYK.выбрать(c2.name_en || c2.name, c2.name_kg || c2.name, c2.name)) : row.category_id,
                                points: row.points || 0,
                                wins: row.wins || 0,
                                losses: row.losses || 0,
                                closed: !!row.closed_at,
                                rank: место,
                                sort_order: c2 ? (Number(c2.sort_order) || 0) : 0,
                                isHome: row.category_id === p.category_id
                            });
                            if (row.category_id === p.category_id) rank = место;
                        }
                    }
                    // Домашняя категория видна и без очков: игрок в ней уже
                    // числится и стоит в рейтинге, просто ещё ничего не набрал
                    var homeClosed = (pcRes.data || []).some(function(r) {
                        return r.category_id === p.category_id && r.closed_at;
                    });
                    if (p.category_id && !homeClosed &&
                        !myCats.some(function(c) { return c.id === p.category_id; })) {
                        var hc = catById && catById[p.category_id];
                        myCats.push({
                            id: p.category_id,
                            name: hc ? (KSLT_YAZYK.выбрать(hc.name_en || hc.name, hc.name_kg || hc.name, hc.name)) : p.category_id,
                            points: 0, wins: 0, losses: 0, closed: false,
                            rank: null, isHome: true,
                            sort_order: hc ? (Number(hc.sort_order) || 0) : 0
                        });
                    }

                    // Наивысшая категория первой. Правило общее: тем же
                    // сравнением выстраивает линии график истории рейтинга
                    // (js/rating-chart.js). Домашняя категория без очков
                    // встаёт на свою ступень, а не в конец списка
                    if (window.KSLT_RULES && KSLT_RULES.поСилеКатегорий) {
                        myCats.sort(KSLT_RULES.поСилеКатегорий);
                    }

                    var playerName = KSLT_YAZYK.выбрать(p.name_en || p.name, p.name_kg || p.name, p.name);
                    // If player has no photo, try linked profile avatar
                    var playerPhoto = p.photo || '';
                    if (!playerPhoto) {
                        var avatarRes = await client.rpc('get_player_avatar', { p_player_id: p.id });
                        if (avatarRes.data) playerPhoto = avatarRes.data;
                    }
                    data = {
                        player: {
                            id: p.id,
                            name: playerName || playerId,
                            photo: playerPhoto,
                            country: p.country || '',
                            points: p.points || 0,
                            wins: p.wins || 0,
                            losses: p.losses || 0,
                            change: p.rank_change || 0,
                            form: p.form || [],
                            badges: [],
                            online: false,
                            ntrp_singles: p.ntrp_singles || null,
                            // Парный NTRP забыли перенести, и шапка печатала
                            // «4 одиночка» даже там, где в базе стоит и пара
                            ntrp_doubles: p.ntrp_doubles || null,
                            // За кем стоит живой человек: от этого зависят
                            // кнопки «Вызвать» и «Пригласить». Поле не
                            // переносилось, has_account всегда выходил
                            // пустым — и кнопок не было ни у кого
                            has_account: p.has_account === true,
                            doubles_wins: p.doubles_wins || 0,
                            doubles_losses: p.doubles_losses || 0,
                            mixed_wins: p.mixed_wins || 0,
                            mixed_losses: p.mixed_losses || 0,
                            bio: p.bio || '',
                            bio_en: p.bio_en || '',
                            bio_kg: p.bio_kg || '',
                            account_deleted_at: p.account_deleted_at || null,
                            is_member: !!p.is_member
                        },
                        category: { name: catName || '\u2014', players: [] },
                        categories: myCats,
                        categoryKey: catKey,
                        rank: rank
                    };
                }
            } catch(e) {
                console.error('[KSLT] player Supabase fallback error:', e);
            }
        }

        // Static data fallback — if Supabase failed or unavailable
        if (!data) {
            try {
                data = findPlayer(playerId);
            } catch(e) {
                console.warn('[KSLT] findPlayer static error:', e);
            }
        }

        if (!data) {
            renderNotFound();
            return;
        }

        _playerName = data.player.name;
        _playerPhoto = data.player.photo
            ? data.player.photo.replace('w=80&h=80', 'w=240&h=240')
            : '';

        // Load badges from Supabase (parallel)
        var badgeResults = await Promise.all([
            loadPlayerBadges(playerId),
            loadAllBadges()
        ]);
        _earnedBadges = badgeResults[0];
        _allBadges = badgeResults[1];

        await detectAccess();

        // Block guests from viewing profiles
        if (_accessLevel === 'guest') {
            renderGuestBlock(data);
            return;
        }

        document.title = data.player.name + ' \u2014 KSLT';
        renderProfile(data);
        // Контакты грузим после определения доступа: гостям и просто
        // зарегистрированным они не показываются, значит и запрашивать незачем
        if (_accessLevel === 'member') {
            loadPlayerContacts(playerId).then(renderContacts);
        }
        renderBadgesSection();
        renderRatingChart(data.player);
        initScrollAnimations();
        incrementPlayerView(playerId);
    });

    // ---- Rating history chart ----
    // Логика общая с кабинетом игрока — js/rating-chart.js
    function renderRatingChart(player) {
        if (!window.KSLT_RATING_CHART || !client || !player) return;
        window.KSLT_RATING_CHART.render({
            client: client,
            playerId: player.id,
            homeCategory: player.category_id,
            isEn: isEn,
            isKg: isKg,
            canvasId: 'ppRatingChart',
            wrapId: 'ppChartSection',
            ntrpCanvasId: 'ppNtrpChart',
            ntrpWrapId: 'ppNtrpWrap'
        });
    }

    // ================================================
    // CHALLENGE MODAL
    // ================================================
    var _challengeSending = false;
    var _challengeBlocked = null;

    /**
     * Можно ли вообще звать этого игрока — выясняем до нажатия.
     *
     * Раньше человек заполнял сообщение, жал «Отправить» и только тогда
     * упирался в запрет. Теперь кнопка сразу говорит, почему нельзя.
     */
    async function checkChallengeAllowed(player, btn) {
        if (!client || !_myPlayerId || !player || _myPlayerId === player.id) return;
        try {
            var res = await client.from('challenges')
                .select('status')
                .or('and(challenger_player_id.eq.' + _myPlayerId + ',opponent_player_id.eq.' + player.id + ')' +
                    ',and(challenger_player_id.eq.' + player.id + ',opponent_player_id.eq.' + _myPlayerId + ')')
                .in('status', ['active', 'accepted'])
                .limit(1);
            var row = res.data && res.data[0];
            if (!row) return;

            // Кнопка не отключается, а меняет подпись и объясняет причину
            // по нажатию. Отключённая на телефоне не объяснит ничего:
            // подсказки по наведению там нет
            _challengeBlocked = row.status === 'accepted' ? 'match' : 'pending';
            btn.classList.add('pp-action-off');
            btn.innerHTML = '<span class="pp-action-icon">\u23F3</span> ' +
                (row.status === 'accepted' ? L.challengeBtnMatchSet : L.challengeBtnWaiting);
        } catch(e) { /* не смогли спросить — кнопка останется живой, откажет база */ }
    }

    function handleChallengeClick(player) {
        // Вызов уже есть или матч назначен — объясняем, а не открываем форму,
        // которую всё равно отклонит база
        if (_challengeBlocked === 'match') {
            showChallengeAlert('\u26A0\uFE0F ' + L.challengeBtnMatchSet, L.challengeMatchPending, 'warn');
            return;
        }
        if (_challengeBlocked === 'pending') {
            showChallengeAlert('\u26A0\uFE0F ' + L.challengePending, L.challengePendingText, 'warn');
            return;
        }
        if (_accessLevel === 'guest') {
            showChallengeAlert(L.challengeLoginRequired, L.challengeLoginText, 'warn');
            return;
        }
        if (_accessLevel === 'registered') {
            showChallengeAlert(L.challengeMemberRequired, L.challengeMemberText, 'warn');
            return;
        }
        showChallengeModal(player);
    }

    /**
     * Окно-сообщение. type = 'warn' — отказ: заголовок красным.
     *
     * Отказ и удачная отправка выглядели одинаково белым, и разница между
     * «вызов ушёл» и «вызов не ушёл» читалась только из текста.
     */
    function showChallengeAlert(title, text, type) {
        var old = document.querySelector('.pp-chal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'pp-chal-overlay';
        overlay.innerHTML =
            '<div class="pp-chal-modal">' +
                '<button class="pp-chal-close">&times;</button>' +
                '<h3 class="pp-chal-title' + (type === 'warn' ? ' pp-chal-title-warn' : '') + '">' +
                    KSLT_экранировать(title) + '</h3>' +
                // Абзацы: каждое предложение — своя мысль, слитым куском
                // они читаются как одна длинная строка
                String(text).split('\n').map(function(line) {
                    return '<p class="pp-chal-alert-text">' + KSLT_экранировать(line) + '</p>';
                }).join('') +
            '</div>';
        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });
        attachChalClose(overlay);
    }

    function showChallengeModal(player) {
        var old = document.querySelector('.pp-chal-overlay');
        if (old) old.remove();

        var playerName = player.name || '';

        // Ни даты, ни времени, ни площадки. Вызов — это намерение сыграть:
        // корт назначает менеджер после того, как соперник согласится, и
        // дата, выбранная при отправке, к тому моменту устаревает. Раньше
        // это были два обязательных поля на входе — барьер там, где нужно
        // одно нажатие. Предупреждение про передачу контакта в Telegram
        // ушло вместе с самим Telegram: ответ живёт на платформе
        var overlay = document.createElement('div');
        overlay.className = 'pp-chal-overlay';
        overlay.innerHTML =
            '<div class="pp-chal-modal">' +
                '<button class="pp-chal-close">&times;</button>' +
                '<h3 class="pp-chal-title">\uD83D\uDD25 ' + KSLT_экранировать(L.challengeModalTitle) +
                    ' <span class="pp-chal-rival">' + KSLT_экранировать(playerName) + '</span></h3>' +
                '<div class="pp-chal-form">' +
                    '<div class="pp-chal-field">' +
                        '<label class="pp-chal-label">' + L.challengeMessage +
                            ' <span class="pp-chal-req">*</span></label>' +
                        '<textarea class="pp-chal-input pp-chal-textarea" id="ppChalMsg" maxlength="150" rows="3" ' +
                            'placeholder="' + KSLT_экранировать(L.challengeMsgHint) + '"></textarea>' +
                        '<div class="pp-chal-counter"><span id="ppChalMsgCount">0</span>/150</div>' +
                    '</div>' +
                    '<button class="pp-chal-submit" id="ppChalSubmit" disabled>' + L.challengeSend + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('visible'); });
        attachChalClose(overlay);

        // Message counter
        var msgInput = document.getElementById('ppChalMsg');
        var msgCount = document.getElementById('ppChalMsgCount');
        var sendBtn = document.getElementById('ppChalSubmit');
        if (msgInput && msgCount) {
            msgInput.addEventListener('input', function() {
                msgCount.textContent = msgInput.value.length;
                // Вызов без единого слова — это просто дёрганье человека
                if (sendBtn) sendBtn.disabled = !msgInput.value.trim();
            });
            // Сообщение к вызову — одна фраза. Переводы строки выталкивают
            // текст за края поля при любой его высоте
            msgInput.addEventListener('keydown', function(e) {
                if (e.key === 'Enter') e.preventDefault();
            });
        }

        // Submit
        var submitBtn = document.getElementById('ppChalSubmit');
        if (submitBtn) {
            submitBtn.addEventListener('click', function() {
                submitChallenge(player, overlay);
            });
        }
    }

    async function submitChallenge(player, overlay) {
        if (_challengeSending) return;

        var msgEl = document.getElementById('ppChalMsg');
        var submitBtn = document.getElementById('ppChalSubmit');

        _challengeSending = true;
        if (submitBtn) {
            submitBtn.textContent = L.challengeSending;
            submitBtn.disabled = true;
        }

        try {
            var session = await client.auth.getSession();
            var token = session.data.session ? session.data.session.access_token : null;
            if (!token) {
                showChalToast(L.challengeError, 'error');
                return;
            }

            var body = { opponent_player_id: _playerId };
            if (msgEl && msgEl.value.trim()) {
                body.message = msgEl.value.trim();
            }

            var res = await fetch(SUPABASE_URL + '/functions/v1/create-challenge', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': SUPABASE_ANON_KEY
                },
                body: JSON.stringify(body)
            });

            var data = await res.json();

            if (res.ok && data.success) {
                closeChalModal(overlay);
                showChallengeAlert('\uD83D\uDD25 ' + L.challengeSent, L.challengeSentText);
            } else if (data.error === 'already_pending') {
                closeChalModal(overlay);
                showChallengeAlert('\u26A0\uFE0F ' + L.challengePending, L.challengePendingText, 'warn');
            } else {
                // Отказ по правилу — не сбой: человеку нужно понять, почему
                // нельзя, а не увидеть «попробуйте позже»
                var errMsg = L.challengeError;
                if (data.error === 'too_many_pending') errMsg = L.challengeLimit;
                else if (data.error === 'match_pending') errMsg = L.challengeMatchPending;
                else if (data.error === 'not_member') errMsg = L.challengeNotMember;
                else if (data.error === 'self_challenge') errMsg = L.challengeSelf;
                else if (data.error === 'no_player') errMsg = L.challengeNoPlayer;
                else if (data.error === 'opponent_not_found') errMsg = L.challengeNoPlayer;
                showChalToast(errMsg, 'error');
            }
        } catch (e) {
            console.error('Challenge error:', e);
            showChalToast(L.challengeError, 'error');
        } finally {
            _challengeSending = false;
            if (submitBtn) {
                submitBtn.textContent = L.challengeSend;
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * Закрытие и ЗАПИРАНИЕ двух окон вызова — окна-сообщения и окна с полем.
     *
     * КУСОК 153, 24.10, СЛОВО КОСТИ: «и 5 тоже да». У обоих окон ловушки
     * фокуса не было ВОВСЕ: Tab из открытого окна уходил на страницу под
     * ним, а в окне вызова есть ПОЛЕ — ровно тот случай, про который запись
     * 21.10 говорила «первое же поле в нём, и Tab уходит под окно молча».
     * Слушатель Escape к тому же снимался ТОЛЬКО на пути Escape: закрытые
     * кнопкой или фоном, окна оставляли его на `document` навсегда.
     *
     * ФОКУС ПЕРЕВОДИТСЯ ВНУТРЬ ОКНА ПРИ ОТКРЫТИИ — раньше он оставался на
     * кнопке «Вызвать» ПОД окном. Берётся ПЕРВЫЙ фокусируемый у дома: это
     * закрывашка, а не поле и не «Отправить», — правило оболочки окна
     * админки, где первой стоит «Отмена», потому что за ней бывают
     * необратимые действия.
     *
     * И ВОЗВРАТ ФОКУСА ПОСЛЕ ЗАКРЫТИЯ — ЭТО ЦЕНА ПЕРЕВОДА, А НЕ ПОДАРОК:
     * как только фокус уехал в окно, после закрытия ему некуда вернуться,
     * и он упал бы на `body`, то есть в начало страницы.
     */
    function attachChalClose(overlay) {
        var closeBtn = overlay.querySelector('.pp-chal-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() { closeChalModal(overlay); });
        }
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeChalModal(overlay);
        });
        overlay.__ksltФокусДо = document.activeElement;
        overlay.__ksltСнять = window.KSLT_FOKUS.запереть(overlay, {
            поEsc: function() { closeChalModal(overlay); }
        });
        var первый = window.KSLT_FOKUS.фокусируемые(overlay)[0];
        if (первый) { try { первый.focus(); } catch (e) {} }
    }

    function closeChalModal(overlay) {
        if (overlay.__ksltСнять) { overlay.__ksltСнять(); overlay.__ksltСнять = null; }
        overlay.classList.remove('visible');
        var фокусДо = overlay.__ksltФокусДо;
        if (фокусДо && фокусДо.focus && document.body.contains(фокусДо)) {
            try { фокусДо.focus(); } catch (e) {}
        }
        setTimeout(function() { if (overlay.parentNode) overlay.remove(); }, 300);
    }

    function showChalToast(msg, type) {
        var toast = document.createElement('div');
        toast.className = 'pp-chal-toast pp-chal-toast-' + type;
        toast.textContent = msg;
        document.body.appendChild(toast);
        requestAnimationFrame(function() { toast.classList.add('visible'); });
        setTimeout(function() {
            toast.classList.remove('visible');
            setTimeout(function() { if (toast.parentNode) toast.remove(); }, 300);
        }, 3000);
    }
})();
