// ============================================
// Приглашение на игру — общее для сайта
// ============================================
//
// Одна кнопка «Пригласить» живёт в двух местах: в блоке на главной и на
// странице поиска игрока. Раньше вся работа — проверка доступа, окна и
// сама отправка — лежала внутри страницы поиска, а главная умела только
// увести туда со ссылкой `?invite=`. Ссылку там никто не читал, и нажатие
// с главной просто открывало список: запрос не уходил.
//
// Теперь отправка одна на оба места. Главная зовёт её у себя, никуда не
// уводя, страница поиска — как и раньше.
//
// Уровни доступа: гость зовётся регистрироваться, зарегистрированный без
// членства — платить, член клуба отправляет.

(function () {
    'use strict';

    var INV = {};
    window.KSLT_INVITE = INV;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    // Адрес берём из общей настройки, а не зашиваем: автотесты подставляют
    // отдельную базу через window.KSLT_DB, и зашитый адрес уводил запрос
    // в боевой проект с чужим ключом
    var FUNCTIONS_URL = (window.SUPABASE_URL || '') + '/functions/v1';
    var ANON_KEY = window.SUPABASE_ANON_KEY || '';

    var authFile = isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html');

    /**
     * Путь до страницы из папки pages.
     *
     * Модуль работает и на главной в корне, и на страницах внутри папки —
     * ссылки должны вести в одно и то же место из обоих.
     */
    function путь(file) {
        return window.location.pathname.indexOf('/pages/') !== -1 ? file : 'pages/' + file;
    }

    var L = isEn ? {
        modalGuestTitle: 'Join us!',
        modalGuestText: 'Sign up and become a KSLT member to send game invitations',
        modalGuestBtn: 'Sign Up',
        inviteConfirmTitle: 'Send game invitation?',
        inviteConfirmText: 'If the player accepts, you will exchange contacts: they will see yours, you will see theirs.',
        inviteConfirmBtn: 'Send',
        inviteConfirmCancel: 'Cancel',
        inviteSent: 'Invitation sent!',
        inviteNoAccount: 'This player is not on the platform yet',
        inviteNoContacts: 'This player has not provided any contacts',
        inviteError: 'Failed to send invitation',
        inviteLimit: 'Daily invite limit reached (5/day)',
        invitePending: 'Invitation already sent',
        inviteSelf: 'Cannot invite yourself'
    } : isKg ? {
        modalGuestTitle: 'Кошулуңуз!',
        modalGuestText: 'Оюнга чакыруу жөнөтүү үчүн катталып, КСЛТ мүчөсү болуңуз',
        modalGuestBtn: 'Каттоо',
        inviteConfirmTitle: 'Оюнга чакыруу жөнөтөсүзбү?',
        inviteConfirmText: 'Оюнчу кабыл алса, байланыш маалыматтарыңыз менен алмашасыз: ал сиздикин, сиз анын маалыматын көрөсүз.',
        inviteConfirmBtn: 'Жөнөтүү',
        inviteConfirmCancel: 'Жокко чыгаруу',
        inviteSent: 'Чакыруу жөнөтүлдү!',
        inviteNoAccount: 'Бул оюнчу платформада катталган эмес',
        inviteNoContacts: 'Бул оюнчу байланыш маалыматын көрсөткөн эмес',
        inviteError: 'Чакыруу жөнөтүлгөн жок',
        inviteLimit: 'Күнүнө 5 чакыруудан ашык болбойт',
        invitePending: 'Чакыруу мурун жөнөтүлгөн',
        inviteSelf: 'Өзүңүздү чакыра албайсыз'
    } : {
        modalGuestTitle: 'Присоединяйтесь!',
        modalGuestText: 'Зарегистрируйтесь и станьте членом КСЛТ, чтобы отправлять приглашения на игру',
        modalGuestBtn: 'Регистрация',
        inviteConfirmTitle: 'Отправить приглашение на игру?',
        inviteConfirmText: 'Если игрок примет приглашение, вы обменяетесь контактами: он увидит ваши, вы — его.',
        inviteConfirmBtn: 'Отправить',
        inviteConfirmCancel: 'Отмена',
        inviteSent: 'Приглашение отправлено!',
        inviteNoAccount: 'Этот игрок ещё не на платформе',
        inviteNoContacts: 'Игрок не указал контактов',
        inviteError: 'Не удалось отправить приглашение',
        inviteLimit: 'Дневной лимит приглашений исчерпан (5 в день)',
        invitePending: 'Приглашение уже отправлено',
        inviteSelf: 'Нельзя пригласить самого себя'
    };

    var _accessLevel = null;   // 'guest' | 'registered' | 'member'
    var _myPlayerId = null;
    var _sendingInvite = false;
    var _toastTimer = null;

    /**
     * Уровень доступа. Считаем один раз за жизнь страницы: запрос к базе
     * на каждое нажатие ни к чему.
     */
    INV.access = async function () {
        if (_accessLevel) return _accessLevel;
        var client = window.supabaseClient;
        var loggedIn = false;
        if (client) {
            try {
                var res = await client.auth.getSession();
                if (res.data && res.data.session) loggedIn = true;
            } catch (e) {}
        }
        if (!loggedIn) { _accessLevel = 'guest'; return _accessLevel; }

        _accessLevel = 'registered';
        try {
            var uid = (await client.auth.getUser()).data.user.id;
            var pr = await client.from('profiles').select('role, player_id').eq('id', uid).single();
            if (pr.data) _myPlayerId = pr.data.player_id || null;
            if (pr.data && (pr.data.role === 'admin' || pr.data.role === 'manager')) {
                _accessLevel = 'member';
                return _accessLevel;
            }
        } catch (e) {}

        if (typeof window.checkMembership === 'function') {
            try {
                var mem = await window.checkMembership();
                if (mem && mem.active) _accessLevel = 'member';
            } catch (e) {}
        }
        return _accessLevel;
    };

    /** Своя карточка игрока — чтобы не приглашать самого себя. */
    INV.myPlayerId = function () { return _myPlayerId; };

    /** Нажали «Пригласить». Дальше всё решает уровень доступа. */
    INV.click = async function (playerId) {
        await INV.access();
        handleInviteClick(playerId);
    };

    // ---- Handle invite click by access level ----
    function handleInviteClick(playerId) {
        if (_accessLevel === 'guest') {
            showModal(L.modalGuestTitle, L.modalGuestText, L.modalGuestBtn, путь(authFile));
            return;
        }

        if (_accessLevel === 'registered') {
            showPaymentModal();
            return;
        }

        // Member — show confirmation before sending
        showInviteConfirm(playerId);
    }

    function showInviteConfirm(playerId) {
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-icon">&#9888;&#65039;</div>' +
                '<div class="pt-modal-title">' + L.inviteConfirmTitle + '</div>' +
                '<div class="pt-modal-text">' + L.inviteConfirmText + '</div>' +
                '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px;">' +
                    '<button class="pt-modal-btn pt-confirm-send">' + L.inviteConfirmBtn + '</button>' +
                    '<button class="pt-modal-btn pt-confirm-cancel" style="background:rgba(255,255,255,0.08);color:var(--text-secondary);">' + L.inviteConfirmCancel + '</button>' +
                '</div>' +
            '</div>';
        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        overlay.querySelector('.pt-confirm-send').addEventListener('click', function() {
            closeModal(overlay);
            sendInvite(playerId);
        });
        overlay.querySelector('.pt-confirm-cancel').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    // ---- Send invite via Edge Function ----
    async function sendInvite(playerId) {
        if (_sendingInvite) return;

        // Телеграм больше не обязателен. Раньше без него отправка
        // запрещалась, потому что принять приглашение можно было только
        // кнопками в боте. Теперь оно живёт в кабинете и в приложении, а
        // Телеграм с почтой лишь оповещают — кому что доступно
        _sendingInvite = true;

        try {
            var session = await window.supabaseClient.auth.getSession();
            var token = session.data.session ? session.data.session.access_token : null;
            if (!token) {
                showToast(L.inviteError, 'error');
                return;
            }

            var res = await fetch(FUNCTIONS_URL + '/send-game-invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': ANON_KEY
                },
                body: JSON.stringify({ receiver_player_id: playerId })
            });

            var data = await res.json();

            if (res.ok && data.success) {
                showToast(L.inviteSent, 'success');
            } else {
                var errMsg = L.inviteError;
                if (data.error === 'daily_limit') errMsg = L.inviteLimit;
                else if (data.error === 'already_pending') errMsg = L.invitePending;
                else if (data.error === 'no_account') errMsg = L.inviteNoAccount;
                else if (data.error === 'receiver_no_contacts') errMsg = L.inviteNoContacts;
                else if (data.error === 'self_invite') errMsg = L.inviteSelf;
                showToast(errMsg, data.error === 'daily_limit' || data.error === 'already_pending' ? 'info' : 'error');
            }
        } catch(e) {
            console.error('Invite error:', e);
            showToast(L.inviteError, 'error');
        } finally {
            _sendingInvite = false;
        }
    }

    // ---- Modal ----
    function showModal(title, text, btnLabel, btnHref, disclaimer) {
        // Remove existing
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var disclaimerHtml = disclaimer ? '<div class="pt-modal-disclaimer">' + disclaimer + '</div>' : '';

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-icon">&#127934;</div>' +
                '<div class="pt-modal-title">' + title + '</div>' +
                '<div class="pt-modal-text">' + text + '</div>' +
                '<a href="' + btnHref + '" class="pt-modal-btn">' + btnLabel + '</a>' +
                disclaimerHtml +
            '</div>';
        document.body.appendChild(overlay);

        // Animate in
        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        // Close handlers
        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    function closeModal(overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
    }

    // ---- Payment Modal (for registered non-members) ----
    function showPaymentModal() {
        var old = document.querySelector('.pt-modal-overlay');
        if (old) old.remove();

        var rulesPage = путь(isEn ? 'rules-en.html' : (isKg ? 'rules-kg.html' : 'rules.html'));
        var pricePage = путь(isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html'));

        var title = isEn ? 'Become a KSLT Member' : (isKg ? 'КСЛТ мүчөсү болуңуз' : 'Станьте членом КСЛТ');
        var subtitle = isEn
            ? 'Monthly membership — <strong style="color:var(--accent)">1,000 KGS/mo</strong>'
            : (isKg ? 'Ай сайынкы мүчөлүк — <strong style="color:var(--accent)">1 000 сом/ай</strong>' : 'Ежемесячное членство — <strong style="color:var(--accent)">1 000 сом/мес</strong>');
        var cardsLabel = isEn ? 'Bank cards' : (isKg ? 'Банк карталары' : 'Банковские карты');
        var mobileLabel = isEn ? 'Mobile banks' : (isKg ? 'Мобилдик банктар' : 'Мобильные банки');
        var walletsLabel = isEn ? 'E-wallets' : (isKg ? 'Электрондук капчыктар' : 'Электронные кошельки');
        var orLabel = isEn ? 'or' : (isKg ? 'же' : 'или');
        var tgBtn = isEn ? 'Message in Telegram' : (isKg ? 'Telegram\'га жазуу' : 'Написать в Telegram');
        var noteText = isEn
            ? 'Online payment coming soon. Contact the admin for now.'
            : (isKg ? 'Онлайн төлөм жакында ишке кирет. Азырынча администраторго кайрылыңыз.' : 'Онлайн-оплата появится в ближайшее время. Пока свяжитесь с администратором.');
        var disclaimer = isEn
            ? 'By paying, you agree to the <a href="' + rulesPage + '" target="_blank">rules</a> and <a href="' + pricePage + '" target="_blank">pricing</a> of KSLT'
            : (isKg ? 'Баскычты басуу менен, <a href="' + rulesPage + '" target="_blank">эрежелер</a> жана <a href="' + pricePage + '" target="_blank">баалар</a> менен тааныштыгыңызды тастыктайсыз' : 'Нажимая кнопку, вы подтверждаете, что ознакомлены с <a href="' + rulesPage + '" target="_blank">правилами</a> и <a href="' + pricePage + '" target="_blank">тарифами</a> КСЛТ');
        var soonLabel = isEn ? 'soon' : (isKg ? 'жакында' : 'скоро');

        var overlay = document.createElement('div');
        overlay.className = 'pt-modal-overlay';
        overlay.innerHTML =
            '<div class="pt-modal pt-modal-pay">' +
                '<button class="pt-modal-close">&times;</button>' +
                '<div class="pt-modal-title">' + title + '</div>' +
                '<div class="pt-modal-text" style="margin-bottom:16px;">' + subtitle + '</div>' +

                '<div class="pt-pay-label">' + cardsLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128179;</span><span class="pt-pay-name">Visa / MC</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#127974;</span><span class="pt-pay-name">Элкарт</span></div>' +
                '</div>' +

                '<div class="pt-pay-label">' + mobileLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">MBank</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Bakai24</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Optima24</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128241;</span><span class="pt-pay-name">Демир24</span></div>' +
                '</div>' +

                '<div class="pt-pay-label">' + walletsLabel + '</div>' +
                '<div class="pt-pay-grid">' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">O! Деньги</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">Balance.kg</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">Элсом</span></div>' +
                    '<div class="pt-pay-method"><span class="pt-pay-soon">' + soonLabel + '</span><span class="pt-pay-icon">&#128176;</span><span class="pt-pay-name">MegaPay</span></div>' +
                '</div>' +

                '<div class="pt-pay-divider">' + orLabel + '</div>' +

                '<a href="https://t.me/kslt_admin" target="_blank" rel="noopener" class="pt-pay-tg-btn">&#9993; ' + tgBtn + '</a>' +

                '<div class="pt-modal-note">' + noteText + '</div>' +
                '<div class="pt-modal-disclaimer">' + disclaimer + '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        overlay.querySelector('.pt-modal-close').addEventListener('click', function() {
            closeModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal(overlay);
        });
    }

    // ---- Toast ----
    var _toastTimer = null;
    function showToast(message, type) {
        // Remove existing
        var old = document.querySelector('.pt-toast');
        if (old) old.remove();
        if (_toastTimer) clearTimeout(_toastTimer);

        var toast = document.createElement('div');
        toast.className = 'pt-toast' + (type ? ' ' + type : '');
        toast.textContent = message;
        document.body.appendChild(toast);

        requestAnimationFrame(function() {
            toast.classList.add('visible');
        });

        _toastTimer = setTimeout(function() {
            toast.classList.remove('visible');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

})();
