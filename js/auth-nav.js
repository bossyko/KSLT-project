// ============================================
// KSLT — Auth Nav (Войти ↔ User Dropdown)
// Lightweight — no Supabase SDK needed
// ============================================

(function() {
    'use strict';

    var btn = document.querySelector('.btn-auth');
    if (!btn) return;

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;
    var inPages = window.location.pathname.indexOf('/pages/') !== -1;
    var prefix = inPages ? '' : 'pages/';
    var dashUrl = prefix + (isEn ? 'dashboard-en.html' : (isKg ? 'dashboard-kg.html' : 'dashboard.html'));
    // Админка одна и только на русском
    var adminUrl = prefix + 'admin.html';

    var L = isEn ? {
        profile: 'My Profile',
        loyalty: 'Points',
        settings: 'Settings',
        admin: 'Admin',
        logout: 'Sign Out'
    } : isKg ? {
        profile: 'Менин профилим',
        loyalty: 'Баллдар',
        settings: 'Жөндөөлөр',
        admin: 'Админка',
        logout: 'Чыгуу'
    } : {
        profile: 'Мой профиль',
        loyalty: 'Баллы',
        settings: 'Настройки',
        admin: 'Админка',
        logout: 'Выйти'
    };

    // Admin dropdown sections
    var ADMIN_SECTIONS = isEn ? [
        { key: 'dashboard', icon: '📊', label: 'Dashboard' },
        { key: 'content', icon: '📰', label: 'News' },
        { key: 'tournaments', icon: '🏆', label: 'Tournaments' },
        { key: 'challenges', icon: '🔥', label: 'Battles' },
        { key: 'players', icon: '🎾', label: 'Players' },
        { key: 'courts', icon: '🏟️', label: 'Courts' },
        { key: 'coaches', icon: '🎓', label: 'Coaches' },
        { key: 'ratings', icon: '⭐', label: 'Ratings' },
        { key: 'users', icon: '👥', label: 'Users', adminOnly: true },
        { key: 'memberships', icon: '💳', label: 'Memberships' },
        { key: 'payments', icon: '💰', label: 'Payments' },
        { key: 'loyalty', icon: '⭐', label: 'Loyalty' }
    ] : [
        { key: 'dashboard', icon: '📊', label: 'Дашборд' },
        { key: 'content', icon: '📰', label: 'Новости' },
        { key: 'tournaments', icon: '🏆', label: 'Турниры' },
        { key: 'challenges', icon: '🔥', label: 'Вызовы' },
        { key: 'players', icon: '🎾', label: 'Игроки' },
        { key: 'courts', icon: '🏟️', label: 'Корты' },
        { key: 'coaches', icon: '🎓', label: 'Тренеры' },
        { key: 'ratings', icon: '⭐', label: 'Рейтинг' },
        { key: 'users', icon: '👥', label: 'Пользователи', adminOnly: true },
        { key: 'memberships', icon: '💳', label: 'Членство' },
        { key: 'payments', icon: '💰', label: 'Оплаты' },
        { key: 'loyalty', icon: '⭐', label: 'Лояльность' }
    ];

    /**
     * Адрес базы и ключ.
     *
     * Раньше и адрес, и ключ, и имя записи с сессией были вписаны сюда
     * буквами — на боевой проект. Из-за этого шапка не работала ни с какой
     * другой базой: проверки не видели ни входа, ни колокольчика, а сам
     * колокольчик из любого окружения ходил в боевую.
     *
     * Значения по умолчанию продублированы из js/supabase-config.js, а не
     * взяты оттуда: шапка на большинстве страниц подключена ВЫШЕ конфига
     * (иначе меню появлялось бы рывком, после загрузки половины скриптов), и
     * к моменту её запуска SUPABASE_ANON_KEY ещё не объявлен. Ключ уходил
     * пустым, база отвечала 401 — колокольчик молча показывал «Новых нет».
     * Ключ публикуемый, он и так лежит в каждой странице открытым текстом.
     */
    var DB_URL = (window.KSLT_DB && window.KSLT_DB.url) ||
        (typeof SUPABASE_URL !== 'undefined' ? SUPABASE_URL : 'https://qqkzszesviukopgjbead.supabase.co');
    var DB_KEY = (window.KSLT_DB && window.KSLT_DB.key) ||
        (typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_ANON_KEY
            ? SUPABASE_ANON_KEY
            : 'sb_publishable_JGfk-NkMln4w7iMzhYEigg_z1_2XK7G');
    var DB_REF = DB_URL.replace(/^https:\/\//, '').split('.')[0];

    // Check Supabase session in localStorage
    try {
        var key = 'sb-' + DB_REF + '-auth-token';
        var raw = localStorage.getItem(key);
        if (!raw) return;

        var session = JSON.parse(raw);
        if (session && session.access_token && session.expires_at) {
            var now = Math.floor(Date.now() / 1000);
            if (session.expires_at > now) {
                var role = localStorage.getItem('kslt_role');
                var userName = localStorage.getItem('kslt_name') || (isEn ? 'User' : (isKg ? 'Колдонуучу' : 'Пользователь'));
                var userAvatar = localStorage.getItem('kslt_avatar') || '';
                var isStaff = role === 'admin' || role === 'manager';

                // ---- Notification Bell (all logged-in users) ----
                var bellWrap = document.createElement('div');
                bellWrap.className = 'site-notif-wrap';
                bellWrap.innerHTML =
                    '<button class="site-notif-btn" id="siteNotifBell" title="' + (isEn ? 'Notifications' : isKg ? 'Билдирмелер' : 'Уведомления') + '">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 01-3.46 0"/></svg>' +
                        '<span class="site-notif-dot" id="siteNotifDot" style="display:none;"></span>' +
                    '</button>' +
                    '<div class="site-notif-dropdown" id="siteNotifDropdown" style="display:none;"></div>';
                btn.parentNode.insertBefore(bellWrap, btn);

                // Bell logic — direct REST API (no supabaseClient dependency)
                (function() {
                    var userId = session.user && session.user.id;
                    if (!userId) return;

                    var API = DB_URL + '/rest/v1';
                    var ANON = DB_KEY;
                    var TOKEN = session.access_token;

                    function apiHeaders(extra) {
                        var h = { 'apikey': ANON, 'Authorization': 'Bearer ' + TOKEN };
                        if (extra) { for (var k in extra) h[k] = extra[k]; }
                        return h;
                    }

                    var bellBtn = document.getElementById('siteNotifBell');
                    var dot = document.getElementById('siteNotifDot');

                    var L2 = isEn
                        ? { title: 'New notifications', empty: 'Nothing new', all: 'All notifications',
                            accept: 'Accept', decline: 'Decline', done: 'This challenge has already been answered',
                            gone: 'This challenge no longer exists' }
                        : isKg
                            ? { title: 'Жаңы билдирмелер', empty: 'Жаңылык жок', all: 'Бардык билдирмелер',
                                accept: 'Кабыл алуу', decline: 'Четке кагуу', done: 'Бул чакырыкка мурун жооп берилген',
                                gone: 'Бул чакырык эми жок' }
                            : { title: 'Новые уведомления', empty: 'Новых нет', all: 'Все уведомления',
                                accept: 'Принять', decline: 'Отклонить', done: 'На этот вызов уже ответили',
                                gone: 'Этого вызова больше нет' };

                    /**
                     * Сколько непрочитанных — для точки на колокольчике.
                     *
                     * Раньше ошибка здесь глушилась пустым catch: если запрос
                     * не проходил, точка просто не появлялась, и понять почему
                     * было невозможно. Теперь неудача видна в консоли.
                     *
                     * Считаем по числу записей, а не по заголовку: content-range
                     * приходит только когда браузеру разрешено его читать, и на
                     * части окружений он оказывался пустым.
                     */
                    function refreshCount() {
                        return fetch(API + '/notification_log?profile_id=eq.' + userId +
                                     '&is_read=eq.false&select=id', { headers: apiHeaders() })
                            .then(function(res) {
                                if (!res.ok) {
                                    console.warn('[KSLT] notifications: счётчик не получен,', res.status);
                                    return;
                                }
                                return res.json().then(function(rows) {
                                    var count = (rows || []).length;
                                    if (count > 0) {
                                        dot.style.display = '';
                                        dot.textContent = count > 9 ? '9+' : count;
                                    } else {
                                        dot.style.display = 'none';
                                    }
                                });
                            })
                            .catch(function(e) { console.warn('[KSLT] notifications:', e); });
                    }

                    refreshCount();

                    // Уведомление могло прийти, пока страница открыта: раз в
                    // минуту проверяем заново, иначе о новом узнаёшь только
                    // после перезагрузки
                    setInterval(refreshCount, 60000);
                    document.addEventListener('visibilitychange', function() {
                        if (!document.hidden) refreshCount();
                    });

                    /**
                     * Колокольчик в шапке и раздел «Уведомления» в кабинете —
                     * разные скрипты, и об одном и том же уведомлении каждый
                     * знал только своё. Прочитал через колокольчик — в
                     * кабинете строка оставалась непрочитанной до перезагрузки.
                     * Теперь о прочтении объявляется, и слушает кто хочет.
                     */
                    function announceRead(detail) {
                        try {
                            document.dispatchEvent(
                                new CustomEvent('kslt:notification-read', { detail: detail }));
                        } catch(e) { /* старый браузер — обойдётся без синхронизации */ }
                    }

                    document.addEventListener('kslt:notification-read', function(e) {
                        var d = e.detail || {};
                        var dd = document.getElementById('siteNotifDropdown');
                        if (dd) {
                            if (d.all) {
                                dd.querySelectorAll('.site-notif-item').forEach(function(el) { el.remove(); });
                            } else if (d.id) {
                                var one = dd.querySelector('.site-notif-item[data-id="' + d.id + '"]');
                                if (one) one.remove();
                            }
                        }
                        refreshCount();
                    });

                    function itemHtml(n) {
                        var ago = n.created_at ? timeAgo(new Date(n.created_at)) : '';
                        return '<button class="site-notif-item' + (n.is_read ? '' : ' unread') + '" ' +
                                'data-id="' + n.id + '" type="button">' +
                            '<div class="site-notif-item-title">' + esc(n.title || '') + '</div>' +
                            '<div class="site-notif-item-msg">' + esc(n.message || '') + '</div>' +
                            '<div class="site-notif-item-time">' + ago + '</div>' +
                        '</button>';
                    }

                    /**
                     * Одно уведомление целиком. Прочитанным становится именно
                     * оно, при закрытии — не весь список разом: иначе хватало
                     * открыть колокольчик, чтобы «прочитать» всё не глядя.
                     */
                    function openOne(n, onDone) {
                        var overlay = document.createElement('div');
                        overlay.className = 'site-notif-overlay';
                        overlay.innerHTML =
                            '<div class="site-notif-modal">' +
                                '<div class="site-notif-head">' +
                                    '<span class="site-notif-title">' + esc(n.title || '') + '</span>' +
                                    '<button class="site-notif-close" type="button">&times;</button>' +
                                '</div>' +
                                '<div class="site-notif-body">' +
                                    '<div class="site-notif-full">' + esc(n.message || '') + '</div>' +
                                    '<div class="site-notif-item-time" style="padding:0 20px 16px;">' +
                                        (n.created_at ? timeAgo(new Date(n.created_at)) : '') +
                                    '</div>' +
                                    // Уведомление о вызове несёт сам ответ: гонять
                                    // человека в кабинет ради двух кнопок незачем
                                    (n.action_type === 'challenge' && n.action_id
                                        ? '<div class="site-notif-actions">' +
                                            '<button class="site-notif-act site-notif-yes" type="button">' + L2.accept + '</button>' +
                                            '<button class="site-notif-act site-notif-no" type="button">' + L2.decline + '</button>' +
                                          '</div>'
                                        : '') +
                                '</div>' +
                            '</div>';
                        document.body.appendChild(overlay);
                        requestAnimationFrame(function() { overlay.classList.add('active'); });

                        function close() {
                            overlay.classList.remove('active');
                            setTimeout(function() { overlay.remove(); }, 200);
                            document.removeEventListener('keydown', onKey);

                            if (n.is_read) { if (onDone) onDone(); return; }

                            fetch(API + '/notification_log?id=eq.' + n.id, {
                                method: 'PATCH',
                                headers: apiHeaders({ 'Content-Type': 'application/json', 'Prefer': 'return=minimal' }),
                                body: JSON.stringify({ is_read: true })
                            }).then(function(res) {
                                if (!res.ok) {
                                    console.warn('[KSLT] notifications: не отмечено прочитанным,', res.status);
                                    return;
                                }
                                n.is_read = true;
                                announceRead({ id: n.id });
                                if (onDone) onDone();
                            }).catch(function(e) { console.warn('[KSLT] notifications:', e); });
                        }
                        function onKey(e) { if (e.key === 'Escape') close(); }

                        overlay.querySelector('.site-notif-close').addEventListener('click', close);
                        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
                        document.addEventListener('keydown', onKey);

                        /**
                         * Ответ на вызов прямо из уведомления.
                         *
                         * Уведомление — снимок момента: пока оно висело
                         * непрочитанным, на вызов могли ответить с другого
                         * устройства или у него вышел срок. Правило живёт в
                         * базе, кнопка только спрашивает — и говорит вслух,
                         * если ответ уже не нужен.
                         */
                        function answer(accept, btn) {
                            var box = overlay.querySelector('.site-notif-actions');
                            if (box) box.querySelectorAll('button').forEach(function(b) { b.disabled = true; });

                            fetch(DB_URL + '/rest/v1/rpc/respond_to_challenge', {
                                method: 'POST',
                                headers: apiHeaders({ 'Content-Type': 'application/json' }),
                                body: JSON.stringify({ p_id: n.action_id, p_accept: accept })
                            }).then(function(r) { return r.json(); }).then(function(res) {
                                var msg;
                                if (res && res.error) {
                                    // Вызов мог быть отвечен с другого устройства,
                                    // просрочен или вовсе удалён — код базы
                                    // человеку ничего не объясняет
                                    msg = res.error === 'not_found' ? L2.gone
                                        : (res.error === 'already_answered' || res.error === 'expired'
                                            || res.error === 'forbidden') ? L2.done
                                        : res.error;
                                } else {
                                    msg = accept ? L2.accept + ' \u2713' : L2.decline + ' \u2713';
                                }
                                if (box) box.outerHTML = '<div class="site-notif-answered">' + esc(msg) + '</div>';
                                try {
                                    document.dispatchEvent(new CustomEvent('kslt:challenge-answered'));
                                } catch(e) {}

                                // Автору вызова — личное сообщение в Telegram
                                // и на почту. В колокольчик его кладёт база,
                                // но до мессенджера она не дотягивается
                                if (!res || !res.error) {
                                    fetch(DB_URL + '/functions/v1/challenge-notify', {
                                        method: 'POST',
                                        headers: apiHeaders({ 'Content-Type': 'application/json' }),
                                        body: JSON.stringify({ challenge_id: n.action_id })
                                    }).catch(function(e) {
                                        console.warn('[KSLT] challenge-notify:', e);
                                    });
                                }
                            }).catch(function(e) {
                                console.warn('[KSLT] challenge answer:', e);
                                if (box) box.querySelectorAll('button').forEach(function(b) { b.disabled = false; });
                            });
                        }

                        var yes = overlay.querySelector('.site-notif-yes');
                        var no = overlay.querySelector('.site-notif-no');
                        if (yes) yes.addEventListener('click', function() { answer(true, yes); });
                        if (no) no.addEventListener('click', function() { answer(false, no); });

                        // Ответить могли уже из кабинета или с телефона.
                        // Настоящее состояние спрашиваем у базы: кнопки,
                        // которым нечего делать, показывать нельзя
                        if (n.action_type === 'challenge' && n.action_id) {
                            fetch(API + '/challenges?id=eq.' + n.action_id + '&select=status',
                                  { headers: apiHeaders() })
                                .then(function(r) { return r.json(); })
                                .then(function(rows) {
                                    var st = rows && rows[0] && rows[0].status;
                                    if (st === 'active') return;
                                    var box = overlay.querySelector('.site-notif-actions');
                                    if (box) box.outerHTML =
                                        '<div class="site-notif-answered">' + esc(L2.done) + '</div>';
                                })
                                .catch(function() {});
                        }
                    }

                    /**
                     * Список новых уведомлений — выпадающим под колокольчиком.
                     * Окном открывается уже само уведомление, по нажатию.
                     */
                    function openList() {
                        var dropdown = document.getElementById('siteNotifDropdown');
                        if (!dropdown) return;

                        if (dropdown.style.display !== 'none') {
                            dropdown.style.display = 'none';
                            return;
                        }

                        dropdown.innerHTML = '<div style="padding:16px;text-align:center;color:var(--text-dim);font-size:0.8rem;">...</div>';
                        dropdown.style.display = '';

                        // Только непрочитанные: колокольчик — про новое. Вся
                        // история лежит в кабинете, ссылка на неё внизу
                        fetch(API + '/notification_log?profile_id=eq.' + userId +
                              '&is_read=eq.false&select=*&order=created_at.desc&limit=20', {
                            headers: apiHeaders()
                        }).then(function(r) {
                            if (!r.ok) throw new Error('HTTP ' + r.status);
                            return r.json();
                        }).then(function(items) {
                            // При отказе база отвечает объектом с текстом ошибки,
                            // а не списком. Раньше он молча становился «Новых нет»
                            if (!Array.isArray(items)) throw new Error('unexpected response');
                            var foot = '<div class="site-notif-foot">' +
                                '<a href="' + dashUrl + '#notifications">' + L2.all + '</a></div>';

                            if (items.length === 0) {
                                dropdown.innerHTML =
                                    '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:0.85rem;">' +
                                    L2.empty + '</div>' + foot;
                                return;
                            }

                            dropdown.innerHTML = '<div id="siteNotifItems">' +
                                items.map(itemHtml).join('') + '</div>' + foot;

                            dropdown.querySelectorAll('.site-notif-item').forEach(function(el) {
                                el.addEventListener('click', function(e) {
                                    e.stopPropagation();
                                    var n = items.filter(function(x) { return x.id === el.dataset.id; })[0];
                                    if (!n) return;
                                    openOne(n, function() {
                                        // Прочитанное уходит из списка и из счётчика
                                        el.remove();
                                        refreshCount();
                                        if (!dropdown.querySelector('.site-notif-item')) {
                                            dropdown.innerHTML =
                                                '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:0.85rem;">' +
                                                L2.empty + '</div>' + foot;
                                        }
                                    });
                                });
                            });
                        }).catch(function(e) {
                            // Сбой — это не «новых нет». Молчаливая подмена одного
                            // другим и скрывала пустой ключ на страницах сайта
                            console.warn('[KSLT] notifications:', e);
                            dropdown.innerHTML =
                                '<div style="padding:24px;text-align:center;color:var(--text-dim);font-size:0.85rem;">' +
                                (isEn ? 'Failed to load' : isKg ? 'Жүктөлгөн жок' : 'Не удалось загрузить') +
                                '</div>';
                        });
                    }

                    // Щелчок мимо — список закрывается
                    document.addEventListener('click', function(e) {
                        var dropdown = document.getElementById('siteNotifDropdown');
                        if (dropdown && dropdown.style.display !== 'none' && !bellWrap.contains(e.target)) {
                            dropdown.style.display = 'none';
                        }
                    });

                    bellBtn.addEventListener('click', function(e) {
                        e.stopPropagation();
                        openList();
                    });

                    function timeAgo(date) {
                        var diff = Math.floor((new Date() - date) / 1000);
                        if (diff < 60) return isEn ? 'just now' : 'только что';
                        if (diff < 3600) return Math.floor(diff / 60) + (isEn ? 'm ago' : ' мин.');
                        if (diff < 86400) return Math.floor(diff / 3600) + (isEn ? 'h ago' : ' ч.');
                        return Math.floor(diff / 86400) + (isEn ? 'd ago' : ' дн.');
                    }

                    function esc(s) {
                        var d = document.createElement('div');
                        d.textContent = s;
                        return d.innerHTML;
                    }
                })();

                if (isStaff) {
                    // ---- ADMIN / MANAGER: single "Админка" dropdown ----
                    // Hover → dropdown with admin sections + profile/logout
                    // Click → navigates to admin page

                    var menuItems = '';
                    ADMIN_SECTIONS.forEach(function(s) {
                        if (s.adminOnly && role !== 'admin') return;
                        menuItems += '<a href="' + adminUrl + '#' + s.key + '" class="nav-dropdown-item">' +
                            '<span style="font-size:14px;">' + s.icon + '</span> ' +
                            s.label + '</a>';
                    });

                    // Add divider + logout
                    menuItems += '<div style="height:1px;background:var(--border-subtle);margin:6px 0;"></div>';
                    menuItems += '<button class="nav-dropdown-item admin-nav-logout" style="width:100%;border:none;background:none;cursor:pointer;color:#ff6b6b;font:inherit;text-align:left;">' +
                        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg> ' +
                        L.logout + '</button>';

                    var adminDd = document.createElement('div');
                    adminDd.className = 'admin-nav-dropdown';
                    adminDd.innerHTML =
                        '<a href="' + adminUrl + '" class="btn-auth admin-nav-toggle">' +
                            L.admin +
                            '<svg class="nav-arrow" width="10" height="6" viewBox="0 0 10 6" fill="currentColor" style="margin-left:4px;"><path d="M1 1l4 4 4-4"/></svg>' +
                        '</a>' +
                        '<div class="nav-dropdown-menu admin-nav-menu">' +
                            menuItems +
                        '</div>';

                    btn.parentNode.replaceChild(adminDd, btn);

                    // Logout handler
                    adminDd.querySelector('.admin-nav-logout').addEventListener('click', async function() {
                        localStorage.removeItem(key);
                        localStorage.removeItem('kslt_role');
                        localStorage.removeItem('kslt_name');
                        localStorage.removeItem('kslt_avatar');
                        if (window.supabaseClient) {
                            await window.supabaseClient.auth.signOut();
                        }
                        window.location.href = prefix + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html'));
                    });

                } else {
                    // ---- REGULAR USER: user dropdown (click) ----

                    var dropdown = document.createElement('div');
                    dropdown.className = 'user-dropdown';

                    var initials = userName.split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';
                    var avatarHtml = userAvatar
                        ? '<img src="' + userAvatar + '" class="user-dropdown-avatar" alt="">'
                        : '<div class="user-dropdown-avatar-ph">' + initials + '</div>';

                    dropdown.innerHTML =
                        '<button class="user-dropdown-toggle">' +
                            avatarHtml +
                            '<span class="user-dropdown-name">' + userName + '</span>' +
                            '<svg class="user-dropdown-arrow" width="10" height="6" viewBox="0 0 10 6" fill="currentColor"><path d="M1 1l4 4 4-4"/></svg>' +
                        '</button>' +
                        '<div class="user-dropdown-menu">' +
                            '<div class="user-dropdown-header">' + userName + '</div>' +
                            '<a href="' + dashUrl + '" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>' + L.profile + '</a>' +
                            '<a href="' + dashUrl + '#loyalty" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>' + L.loyalty + '</a>' +
                            '<a href="' + dashUrl + '#settings" class="user-dropdown-item"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><circle cx="12" cy="12" r="3"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>' + L.settings + '</a>' +
                            '<div class="user-dropdown-divider"></div>' +
                            '<button class="user-dropdown-item user-dropdown-logout" id="navLogoutBtn"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>' + L.logout + '</button>' +
                        '</div>';

                    btn.parentNode.replaceChild(dropdown, btn);

                    dropdown.querySelector('.user-dropdown-toggle').addEventListener('click', function(e) {
                        e.stopPropagation();
                        dropdown.classList.toggle('open');
                    });

                    document.addEventListener('click', function(e) {
                        if (!dropdown.contains(e.target)) {
                            dropdown.classList.remove('open');
                        }
                    });

                    dropdown.querySelector('#navLogoutBtn').addEventListener('click', async function() {
                        localStorage.removeItem(key);
                        localStorage.removeItem('kslt_role');
                        localStorage.removeItem('kslt_name');
                        localStorage.removeItem('kslt_avatar');
                        if (window.supabaseClient) {
                            await window.supabaseClient.auth.signOut();
                        }
                        window.location.href = prefix + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html'));
                    });
                }
            }
        }
    } catch (e) {
        // Ignore — stay as "Войти"
    }
})();
