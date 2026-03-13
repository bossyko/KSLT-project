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
        newPassword: 'Жаңы сыр сөз',
        confirmPassword: 'Сыр сөздү тастыктаңыз',
        updatePassword: 'Сыр сөздү жаңылоо',
        updating: 'Жаңылануулда...',
        passwordUpdated: 'Сыр сөз ийгиликтүү жаңыланды',
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
        role_user: 'Колдонуучу', role_player: 'Оюнчу', role_admin: 'Администратор',
        category: 'Категория', points: 'Упайлар',
        wins: 'Жеңиштер', losses: 'Жеңилүүлөр', rank: 'Рейтинг өзгөрүшү',
        socialMedia: 'Социалдык тармактар',
        playLevel: 'Оюн деңгээли',
        selectLevel: '— Тандаңыз —',
        levelBeginner: 'Жаңы баштаган',
        levelIntermediate: 'Орто',
        levelAdvanced: 'Тажрыйбалуу',
        preferredTime: 'Артыкчылыктуу убакыт',
        selectTime: '— Тандаңыз —',
        timeMorning: 'Таңкы',
        timeAfternoon: 'Күндүзгү',
        timeEvening: 'Кечки',
        timeWeekend: 'Дем алыш',
        partnerPrefs: 'Өнөктөш издөө артыкчылыктары',
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
        invitationsTitle: 'Оюнга чакыруулар',
        invSent: 'Жөнөтүлдү',
        invReceived: 'Алынды',
        invAccepted: 'Кабыл алынды',
        invDeclined: 'Четке кагылды',
        invPending: 'Күтүүдө',
        invNoInvites: 'Чакыруулар жок',
        invNoInvitesText: '«Өнөктөш табуу» барагынан оюнга чакыруулар жөнөтүңүз',
        ratingHistory: 'Рейтинг тарыхы',
        rhTotalPoints: 'Жалпы упайлар'
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
        newPassword: 'New Password',
        confirmPassword: 'Confirm Password',
        updatePassword: 'Update Password',
        updating: 'Updating...',
        passwordUpdated: 'Password updated successfully',
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
        role_user: 'User', role_player: 'Player', role_admin: 'Admin',
        category: 'Category', points: 'Points',
        wins: 'Wins', losses: 'Losses', rank: 'Rank Change',
        socialMedia: 'Social Media',
        playLevel: 'Play Level',
        selectLevel: '— Select —',
        levelBeginner: 'Beginner',
        levelIntermediate: 'Intermediate',
        levelAdvanced: 'Advanced',
        preferredTime: 'Preferred Time',
        selectTime: '— Select —',
        timeMorning: 'Morning',
        timeAfternoon: 'Afternoon',
        timeEvening: 'Evening',
        timeWeekend: 'Weekend',
        partnerPrefs: 'Partner Preferences',
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
        invitationsTitle: 'Game Invitations',
        invSent: 'Sent',
        invReceived: 'Received',
        invAccepted: 'Accepted',
        invDeclined: 'Declined',
        invPending: 'Pending',
        invNoInvites: 'No invitations yet',
        invNoInvitesText: 'Send game invitations from the Partners page',
        ratingHistory: 'Rating History',
        rhTotalPoints: 'Total Points'
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
        newPassword: 'Новый пароль',
        confirmPassword: 'Подтвердите пароль',
        updatePassword: 'Обновить пароль',
        updating: 'Обновление...',
        passwordUpdated: 'Пароль успешно обновлён',
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
        role_user: 'Пользователь', role_player: 'Игрок', role_admin: 'Администратор',
        category: 'Категория', points: 'Очки',
        wins: 'Победы', losses: 'Поражения', rank: 'Изм. рейтинга',
        socialMedia: 'Соцсети',
        playLevel: 'Уровень игры',
        selectLevel: '— Выберите —',
        levelBeginner: 'Начинающий',
        levelIntermediate: 'Средний',
        levelAdvanced: 'Продвинутый',
        preferredTime: 'Предпочитаемое время',
        selectTime: '— Выберите —',
        timeMorning: 'Утро',
        timeAfternoon: 'День',
        timeEvening: 'Вечер',
        timeWeekend: 'Выходные',
        partnerPrefs: 'Предпочтения для поиска партнёра',
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
        invitationsTitle: 'Приглашения на игру',
        invSent: 'Отправлено',
        invReceived: 'Получено',
        invAccepted: 'Принято',
        invDeclined: 'Отклонено',
        invPending: 'Ожидает',
        invNoInvites: 'Приглашений пока нет',
        invNoInvitesText: 'Отправляйте приглашения со страницы «Найти партнёра»',
        ratingHistory: 'История рейтинга',
        rhTotalPoints: 'Всего очков'
    };

    // Use shared Supabase client from supabase-config.js
    var client = window.supabaseClient;

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

    // ---- Auth Ready Callback ----
    window.onAuthReady = function(user, profile) {
        renderSidebar(profile);
        renderMobileTabs();
        renderProfile(user, profile);
        renderMembershipCard().then(function(state) {
            applyMembershipRestrictions(state);
        });
        renderTournaments();
        renderStats(profile);
        renderInvitations();
        renderSettings(user);
        initTabs();
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
        var targets = ['db-tournaments', 'db-stats'];
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

        var roleLabel = L['role_' + profile.role] || profile.role;

        container.innerHTML =
            '<div class="db-sidebar-user">' +
                avatarHtml +
                '<div class="db-sidebar-name">' + (profile.full_name || 'User') + '</div>' +
                '<div class="db-sidebar-email">' + (profile.email || '') + '</div>' +
                '<div class="db-sidebar-role">' + roleLabel + '</div>' +
            '</div>' +
            '<ul class="db-sidebar-nav">' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link active" data-tab="profile"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + L.profile + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="tournaments"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9H4.5a2.5 2.5 0 010-5C7 4 7 7 7 7"/><path d="M18 9h1.5a2.5 2.5 0 000-5C17 4 17 7 17 7"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22"/><path d="M18 2H6v7a6 6 0 1012 0V2z"/></svg>' + L.tournaments + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="stats"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>' + L.stats + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="invitations"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/></svg>' + L.invitations + '</button></li>' +
                '<li class="db-sidebar-item"><button class="db-sidebar-link" data-tab="settings"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' + L.settings + '</button></li>' +
            '</ul>';
    }

    // ---- Render Mobile Tabs ----
    function renderMobileTabs() {
        var container = document.getElementById('dbMobileTabs');
        if (!container) return;

        container.innerHTML =
            '<button class="db-mobile-tab active" data-tab="profile">' + L.profile + '</button>' +
            '<button class="db-mobile-tab" data-tab="tournaments">' + L.tournaments + '</button>' +
            '<button class="db-mobile-tab" data-tab="stats">' + L.stats + '</button>' +
            '<button class="db-mobile-tab" data-tab="invitations">' + L.invitations + '</button>' +
            '<button class="db-mobile-tab" data-tab="settings">' + L.settings + '</button>';
    }

    // ---- Init Tabs ----
    function initTabs() {
        var hash = window.location.hash.replace('#', '') || 'profile';
        switchTab(hash);

        document.addEventListener('click', function(e) {
            var link = e.target.closest('[data-tab]');
            if (!link) return;
            var tab = link.dataset.tab;
            switchTab(tab);
            window.location.hash = tab;
        });

        window.addEventListener('hashchange', function() {
            var hash = window.location.hash.replace('#', '') || 'profile';
            switchTab(hash);
        });
    }

    function switchTab(tab) {
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

        // Mini stats card
        var statsHtml = '';
        if (profile.player_id) {
            statsHtml = '<div class="db-card" id="profileStatsCard"><div class="db-card-title">' + L.stats + '</div><p style="color:var(--text-muted);font-size:0.85rem;">' + L.saving + '</p></div>';
        } else {
            statsHtml = '<div class="db-card"><div class="db-card-title">' + L.stats + '</div>' +
                '<p style="color:var(--text-muted);font-size:0.85rem;">' + L.playerNotLinked + '. ' + L.playerNotLinkedText + '</p></div>';
        }

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

            // Partner preferences card
            '<div class="db-card">' +
                '<div class="db-card-title">' + L.partnerPrefs + '</div>' +
                '<div class="db-field-row">' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.playLevel + '</label>' +
                        '<select class="db-field-input" id="profilePlayLevel">' +
                            '<option value="">' + L.selectLevel + '</option>' +
                            '<option value="beginner"' + (profile.play_level === 'beginner' ? ' selected' : '') + '>' + L.levelBeginner + '</option>' +
                            '<option value="intermediate"' + (profile.play_level === 'intermediate' ? ' selected' : '') + '>' + L.levelIntermediate + '</option>' +
                            '<option value="advanced"' + (profile.play_level === 'advanced' ? ' selected' : '') + '>' + L.levelAdvanced + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="db-field">' +
                        '<label class="db-field-label">' + L.preferredTime + '</label>' +
                        '<select class="db-field-input" id="profilePreferredTime">' +
                            '<option value="">' + L.selectTime + '</option>' +
                            '<option value="morning"' + (profile.preferred_time === 'morning' ? ' selected' : '') + '>' + L.timeMorning + '</option>' +
                            '<option value="afternoon"' + (profile.preferred_time === 'afternoon' ? ' selected' : '') + '>' + L.timeAfternoon + '</option>' +
                            '<option value="evening"' + (profile.preferred_time === 'evening' ? ' selected' : '') + '>' + L.timeEvening + '</option>' +
                            '<option value="weekend"' + (profile.preferred_time === 'weekend' ? ' selected' : '') + '>' + L.timeWeekend + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Mini stats
            statsHtml +

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

        // Load mini stats if player_id linked
        if (profile.player_id && client) {
            loadProfileStats(profile.player_id);
        }
    }

    // ---- Load mini stats on profile ----
    async function loadProfileStats(playerId) {
        var card = document.getElementById('profileStatsCard');
        if (!card || !client) return;

        var result = await client.from('players').select('points, wins, losses, rank_change, categories(name)').eq('id', playerId).single();

        if (!result.data) {
            card.innerHTML = '<div class="db-card-title">' + L.stats + '</div><p style="color:var(--text-muted);">—</p>';
            return;
        }

        var p = result.data;
        var catName = p.categories ? p.categories.name : '-';

        card.innerHTML =
            '<div class="db-card-title">' + L.stats + ' — ' + catName + '</div>' +
            '<div class="db-stats-grid db-stats-grid-mini">' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.points + '</div><div class="db-stat-label">' + L.points + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.wins + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.losses + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + (p.rank_change > 0 ? '+' : '') + p.rank_change + '</div><div class="db-stat-label">' + L.rank + '</div></div>' +
            '</div>';
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
            showSocials: (document.getElementById('profileShowSocials') || {}).checked || false,
            playLevel: (document.getElementById('profilePlayLevel') || {}).value || '',
            preferredTime: (document.getElementById('profilePreferredTime') || {}).value || ''
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
                    current.showSocials !== snap.showSocials ||
                    current.playLevel !== snap.playLevel ||
                    current.preferredTime !== snap.preferredTime;

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
        var gender = document.getElementById('profileGender').value;
        var birthDay = document.getElementById('profileBirthDay').value;
        var birthMonth = document.getElementById('profileBirthMonth').value;
        var birthYear = document.getElementById('profileBirthYear').value;
        var instagram = document.getElementById('profileInstagram').value.trim();
        var telegram = document.getElementById('profileTelegram').value.trim();
        var showSocials = document.getElementById('profileShowSocials').checked;
        var playLevel = document.getElementById('profilePlayLevel').value;
        var preferredTime = document.getElementById('profilePreferredTime').value;
        var fullName = firstName + (lastName ? ' ' + lastName : '');

        btn.textContent = L.saving;
        btn.disabled = true;

        var result = await client.from('profiles').update({
            full_name: fullName,
            phone: phone,
            gender: gender,
            birth_day: birthDay ? parseInt(birthDay) : null,
            birth_month: birthMonth ? parseInt(birthMonth) : null,
            birth_year: birthYear ? parseInt(birthYear) : null,
            instagram: instagram,
            telegram: telegram,
            show_socials: showSocials,
            play_level: playLevel || null,
            preferred_time: preferredTime || null
        }).eq('id', window.ksltUser.id);

        if (result.error) {
            showMessage('profileMessage', result.error.message, true);
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
            window.ksltProfile.play_level = playLevel || null;
            window.ksltProfile.preferred_time = preferredTime || null;
            renderSidebar(window.ksltProfile);

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
    function renderTournaments() {
        var container = document.getElementById('db-tournaments');
        if (!container) return;

        container.innerHTML =
            '<h2 class="db-section-title">' + L.tournamentsTitle + '</h2>' +
            '<div class="db-card">' +
                '<div class="db-empty">' +
                    '<div class="db-empty-icon">🏆</div>' +
                    '<div class="db-empty-title">' + L.noTournaments + '</div>' +
                    '<div class="db-empty-text">' + L.noTournamentsText + '</div>' +
                '</div>' +
            '</div>';
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
        var catName = '-';
        if (p.category_id) {
            var catRes = await client.from('categories').select('name').eq('id', p.category_id).single();
            if (catRes.data) catName = catRes.data.name;
        }

        container.innerHTML =
            '<h2 class="db-section-title">' + L.statsTitle + '</h2>' +
            '<div class="db-stats-grid">' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.points + '</div><div class="db-stat-label">' + L.points + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.wins + '</div><div class="db-stat-label">' + L.wins + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + p.losses + '</div><div class="db-stat-label">' + L.losses + '</div></div>' +
                '<div class="db-stat-card"><div class="db-stat-value">' + (p.rank_change > 0 ? '+' : '') + p.rank_change + '</div><div class="db-stat-label">' + L.rank + '</div></div>' +
            '</div>' +
            '<div class="db-card">' +
                '<div class="db-card-title">' + L.category + '</div>' +
                '<p style="color:var(--accent);font-size:1.1rem;font-weight:600;">' + catName + '</p>' +
            '</div>' +
            '<div id="dbRatingChartWrap" style="display:none;">' +
                '<div class="db-card">' +
                    '<div class="db-card-title">' + L.ratingHistory + '</div>' +
                    '<div style="position:relative;height:250px;">' +
                        '<canvas id="dbRatingChart"></canvas>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Render rating history chart
        renderRatingChart(profile.player_id, 'dbRatingChart', 'dbRatingChartWrap');
    }

    // ---- Rating History Chart ----
    async function renderRatingChart(playerId, canvasId, wrapId) {
        if (!playerId || !client || typeof Chart === 'undefined') return;

        var res = await client.from('rating_history')
            .select('*')
            .eq('player_id', playerId)
            .order('recorded_at', { ascending: true });

        var data = res.data || [];
        if (data.length === 0) return;

        var wrap = document.getElementById(wrapId);
        if (wrap) wrap.style.display = '';

        var labels = [];
        var values = [];
        var cumulative = 0;
        var tooltipNames = [];

        data.forEach(function(row) {
            cumulative += row.points_earned;
            labels.push(row.recorded_at);
            values.push(cumulative);
            tooltipNames.push(row.tournament_name + ' (+' + row.points_earned + ')');
        });

        var canvas = document.getElementById(canvasId);
        if (!canvas) return;

        new Chart(canvas, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: L.rhTotalPoints,
                    data: values,
                    borderColor: '#CCFF00',
                    backgroundColor: 'rgba(204,255,0,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#CCFF00',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(ctx) { return tooltipNames[ctx[0].dataIndex]; },
                            label: function(ctx) { return L.rhTotalPoints + ': ' + ctx.parsed.y; }
                        },
                        backgroundColor: 'rgba(30,30,30,0.95)',
                        titleColor: '#CCFF00',
                        bodyColor: '#fff',
                        borderColor: '#CCFF00',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#888', maxRotation: 45 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
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
                    '<a href="dashboard.html#settings" class="db-btn ' + (!isEn ? 'db-btn-primary' : 'db-btn-outline') + '">Русский</a>' +
                    '<a href="dashboard-en.html#settings" class="db-btn ' + (isEn ? 'db-btn-primary' : 'db-btn-outline') + '">English</a>' +
                '</div>' +
            '</div>' +

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

        var newPwInput = document.getElementById('settingsNewPw');
        var confirmPwInput = document.getElementById('settingsConfirmPw');
        var updateBtn = document.getElementById('settingsUpdatePwBtn');

        function checkPwReady() {
            var val = newPwInput.value;
            var allPass = Object.keys(pwRules).every(function(k) { return pwRules[k](val); });
            var match = val && confirmPwInput.value && val === confirmPwInput.value;
            updateBtn.disabled = !(allPass && match);
        }

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
    }

    // ---- Update Password ----
    async function updatePassword() {
        if (!client) return;

        var newPw = document.getElementById('settingsNewPw').value;
        var confirmPw = document.getElementById('settingsConfirmPw').value;
        var btn = document.getElementById('settingsUpdatePwBtn');

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

        var result = await client.auth.updateUser({ password: newPw });

        if (result.error) {
            showMessage('settingsMessage', result.error.message, true);
        } else {
            showMessage('settingsMessage', L.passwordUpdated, false);
            document.getElementById('settingsNewPw').value = '';
            document.getElementById('settingsConfirmPw').value = '';
        }

        btn.textContent = L.updatePassword;
        btn.disabled = false;
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
