// ============================================
// KSLT — Dashboard (Личный кабинет)
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;

    // Labels
    var L = isEn ? {
        profile: 'Profile', tournaments: 'My Tournaments',
        stats: 'Statistics', settings: 'Settings',
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
        cropTitle: 'Crop Photo',
        cropApply: 'Apply',
        cropCancel: 'Cancel'
    } : {
        profile: 'Профиль', tournaments: 'Мои турниры',
        stats: 'Статистика', settings: 'Настройки',
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
        cropTitle: 'Обрезка фото',
        cropApply: 'Применить',
        cropCancel: 'Отмена'
    };

    // Use shared Supabase client from supabase-config.js
    var client = window.supabaseClient;

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
        renderMembershipCard();
        renderTournaments();
        renderStats(profile);
        renderSettings(user);
        initTabs();
    };

    // ---- Render Membership Card ----
    var pricingUrl = isEn ? 'pricing-en.html' : 'pricing.html';

    async function renderMembershipCard() {
        var container = document.getElementById('db-profile');
        if (!container) return;

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
            return;
        }

        var result = await window.checkMembership();

        if (result.active) {
            renderMembershipState(card, 'active', result.membership, result.daysLeft);
        } else {
            // Check if there was any expired membership
            var history = typeof window.getMembershipHistory === 'function' ? await window.getMembershipHistory() : [];
            if (history.length > 0) {
                renderMembershipState(card, 'expired', history[0], 0);
            } else {
                renderMembershipState(card, 'none', null, 0);
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

    // ---- Render Sidebar ----
    function renderSidebar(profile) {
        var container = document.getElementById('dbSidebar');
        if (!container) return;

        var nameParts = (profile.full_name || '').split(' ');
        var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';

        var avatarHtml = profile.avatar_url
            ? '<img src="' + profile.avatar_url + '" class="db-sidebar-avatar" alt="">'
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
            ? '<img src="' + profile.avatar_url + '" class="db-avatar-preview" id="avatarPreview" alt="">'
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
        var phone = document.getElementById('profilePhone').value.trim();
        var gender = document.getElementById('profileGender').value;
        var birthDay = document.getElementById('profileBirthDay').value;
        var birthMonth = document.getElementById('profileBirthMonth').value;
        var birthYear = document.getElementById('profileBirthYear').value;
        var instagram = document.getElementById('profileInstagram').value.trim();
        var telegram = document.getElementById('profileTelegram').value.trim();
        var showSocials = document.getElementById('profileShowSocials').checked;
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
            show_socials: showSocials
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
                    '<img id="cropImage" src="' + imageSrc + '">' +
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

        var path = window.ksltUser.id + '.jpg';

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

        var result = await client.from('players').select('*, categories(name)').eq('id', profile.player_id).single();

        if (!result.data) {
            container.innerHTML = '<h2 class="db-section-title">' + L.statsTitle + '</h2><div class="db-card"><div class="db-empty"><div class="db-empty-icon">📊</div><div class="db-empty-title">' + L.noStats + '</div></div></div>';
            return;
        }

        var p = result.data;
        var catName = p.categories ? p.categories.name : '-';

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
            '</div>';
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
        var el = document.getElementById(containerId);
        if (!el) return;
        el.innerHTML = '<div class="db-message ' + (isError ? 'db-message-error' : 'db-message-success') + '">' + escHtml(text) + '</div>';
        if (!isError) {
            setTimeout(function() { el.innerHTML = ''; }, 3000);
        }
    }

    function escHtml(str) {
        var div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

})();
