// ============================================
// KSLT Admin — Users Management
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;

    var usrSearchQuery = '';
    var usrFilterRole = '';
    var usrPeriodMode = '', usrDateFrom = '', usrDateTo = '';
    var usrAllItems = [], usrMemMap = {};
    var usrDeletedCount = 0, usrDeletedPeriodCount = 0;
    var usrChartInstance = null;
    var usrSortByMembership = 0; // 0=none, 1=asc (expiring soon first), -1=desc

    async function renderUsersSection() {
        if (A.isDeepLinked('users')) return;
        renderUsersList();
    }

    async function renderUsersList() {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var roleFilterHtml = '<option value="">' + L.usrAllRoles + '</option>' +
            '<option value="admin"' + (usrFilterRole === 'admin' ? ' selected' : '') + '>' + L.roleAdmin + '</option>' +
            '<option value="manager"' + (usrFilterRole === 'manager' ? ' selected' : '') + '>' + L.roleManager + '</option>' +
            '<option value="user"' + (usrFilterRole === 'user' ? ' selected' : '') + '>' + L.roleUser + '</option>';

        var isAdm = A.currentRole === 'admin';

        var curMonthName = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][new Date().getMonth()];

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.users + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adUsrAddManager">+ ' + L.usrAddManager + '</button>' : '') +
            '</div>' +

            // Chart (current month, full width)
            '<div class="ad-dash-chart-card">' +
                '<div class="ad-table-card-header">' +
                    '<div class="ad-table-card-title">' + L.usrChartTitle + ' — ' + curMonthName + ' ' + new Date().getFullYear() + '</div>' +
                '</div>' +
                '<div style="position:relative;height:260px;padding:12px;">' +
                    '<canvas id="adUsrGrowthChart"></canvas>' +
                '</div>' +
            '</div>' +

            // Stats cards — funnel row (4)
            '<div class="ad-usr-cards" id="adUsrStatsGrid">' +
                '<div class="ad-usr-card" id="adUsrStatTotal">' +
                    '<div class="ad-usr-card-icon" style="background:var(--alpha-lime-12);color:var(--accent);">👥</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatTotal + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatPlayers">' +
                    '<div class="ad-usr-card-icon" style="background:var(--success-subtle);color:var(--success);">🎾</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatPlayers + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatConversion">' +
                    '<div class="ad-usr-card-icon" style="background:rgba(255,214,0,0.12);color:#ffd600;">📊</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatConversion + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatNewMonth">' +
                    '<div class="ad-usr-card-icon" style="background:rgba(0,136,204,0.12);color:#0088cc;">📈</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrNovyh + ' (' + curMonthName + ')</div></div>' +
                '</div>' +
            '</div>' +

            // Stats cards — detail row (4)
            '<div class="ad-usr-cards" id="adUsrBreakdown">' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatMembers">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:var(--success-subtle);color:var(--success);">🏅</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">0</div><div class="ad-usr-card-label">' + L.usrStatMembers + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatTg">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:rgba(0,136,204,0.10);color:#0088cc;">✈️</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">0</div><div class="ad-usr-card-label">' + L.usrStatTelegram + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrBrkDeletedCard">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:var(--danger-subtle);color:var(--danger);">🗑️</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value" id="adUsrBrkDeleted">0</div><div class="ad-usr-card-label">' + L.usrStatDeleted + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatBanned">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:var(--danger-subtle);color:var(--danger);">🚫</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">0</div><div class="ad-usr-card-label">' + L.usrStatBanned + '</div></div>' +
                '</div>' +
            '</div>' +

            // Period row
            '<div class="ad-vch-period-row">' +
                '<select class="ad-field-input" id="adUsrPeriod" style="max-width:160px;">' +
                    '<option value=""' + (usrPeriodMode === '' ? ' selected' : '') + '>' + L.usrPrdAll + '</option>' +
                    '<option value="this_month"' + (usrPeriodMode === 'this_month' ? ' selected' : '') + '>' + L.usrPrdThis + '</option>' +
                    '<option value="last_month"' + (usrPeriodMode === 'last_month' ? ' selected' : '') + '>' + L.usrPrdLast + '</option>' +
                    '<option value="custom"' + (usrPeriodMode === 'custom' ? ' selected' : '') + '>' + L.usrPrdCustom + '</option>' +
                '</select>' +
                '<input type="date" class="ad-field-input" id="adUsrDateFrom" value="' + usrDateFrom + '" style="max-width:150px;display:' + (usrPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<input type="date" class="ad-field-input" id="adUsrDateTo" value="' + usrDateTo + '" style="max-width:150px;display:' + (usrPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<button class="ad-btn ad-btn-sm" id="adUsrPrdApply" style="display:' + (usrPeriodMode === 'custom' ? 'inline-flex' : 'none') + ';">' + L.usrPrdApply + '</button>' +
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adUsrPdfBtn" title="' + L.usrPdfExport + '">📄 PDF</button>' +
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adUsrExcelBtn" title="' + L.usrExcelExport + '">📊 Excel</button>' +
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adLinkHistoryBtn">' + L.linkHistory + '</button>' +
            '</div>' +
            '<div id="adLinkHistory" style="display:none;margin-bottom:16px;"></div>' +

            // Заявки на привязку карточки: игрок нашёл себя в базе клуба и
            // просит отдать ему карточку. Отдаём руками — по имени карточку
            // не проверить, а с ней уходят рейтинг и вся история
            '<div id="adUsrLinkRequests"></div>' +

            '<div class="ad-filter-row ad-filter-sticky">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adUsrSearch" placeholder="' + L.usrSearch + '" value="' + A.esc(usrSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adUsrRoleFilter">' + roleFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adUsrTable">' +
                        '<thead><tr>' +
                            '<th>' + L.thUser + '</th>' +
                            '<th>' + L.thEmail + '</th>' +
                            '<th>' + L.thRole + '</th>' +
                            '<th>' + L.thStatus + '</th>' +
                            '<th style="cursor:pointer;user-select:none;" id="adUsrSortMem">' + L.usrThMembership + ' <span style="opacity:0.4;">⇅</span></th>' +
                            '<th>' + L.thDate + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td class="ad-tablica-pusto" colspan="6">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        нарисоватьЗаявкиНаКарточку();
        подключитьИсторию(container);

        var addMgrBtn = document.getElementById('adUsrAddManager');
        if (addMgrBtn) {
            addMgrBtn.addEventListener('click', function() {
                openAddManagerModal();
            });
        }

        // Sort by membership expiry
        document.getElementById('adUsrSortMem').addEventListener('click', function() {
            usrSortByMembership = usrSortByMembership === 1 ? -1 : 1;
            this.querySelector('span').textContent = usrSortByMembership === 1 ? '↑' : '↓';
            loadUsersList();
        });

        var searchTimer = null;
        document.getElementById('adUsrSearch').addEventListener('input', function() {
            usrSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadUsersList(); }, 300);
        });

        document.getElementById('adUsrRoleFilter').addEventListener('change', function() {
            usrFilterRole = this.value;
            loadUsersList();
        });

        // Period
        document.getElementById('adUsrPeriod').addEventListener('change', function() {
            usrPeriodMode = this.value;
            var fromEl = document.getElementById('adUsrDateFrom');
            var toEl = document.getElementById('adUsrDateTo');
            var applyBtn = document.getElementById('adUsrPrdApply');
            var isCustom = usrPeriodMode === 'custom';
            fromEl.style.display = isCustom ? 'block' : 'none';
            toEl.style.display = isCustom ? 'block' : 'none';
            applyBtn.style.display = isCustom ? 'inline-flex' : 'none';
            if (!isCustom) {
                computeUsrPeriodDates();
                loadUsersList();
            }
        });

        document.getElementById('adUsrPrdApply').addEventListener('click', function() {
            usrDateFrom = document.getElementById('adUsrDateFrom').value;
            usrDateTo = document.getElementById('adUsrDateTo').value;
            loadUsersList();
        });

        // PDF
        document.getElementById('adUsrPdfBtn').addEventListener('click', function() {
            openUsrPdfReport();
        });

        // Excel
        document.getElementById('adUsrExcelBtn').addEventListener('click', function() {
            exportUsrExcel();
        });

        await loadUsersList();
    }

    async function loadUsersList() {
        if (!A.client) return;
        var isAdm = A.currentRole === 'admin';

        var query = A.client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at, banned_until, player_id')
            .order('created_at', { ascending: false });

        if (usrFilterRole) {
            query = query.eq('role', usrFilterRole);
        }

        var result = await query;
        if (result.error) { console.error('Users query error:', result.error); return; }

        var items = result.data || [];

        // Load memberships for all users
        var profileIds = items.map(function(u) { return u.id; });
        var memMap = {};
        if (profileIds.length > 0) {
            var memResult = await A.client.from('memberships')
                .select('profile_id, status, expires_at')
                .in('profile_id', profileIds)
                .order('created_at', { ascending: false });
            (memResult.data || []).forEach(function(m) {
                if (!memMap[m.profile_id]) memMap[m.profile_id] = m;
            });
        }
        usrMemMap = memMap;

        // Hide role=user with active membership (they are in Players section)
        items = items.filter(function(u) {
            if (A.сотрудник(u.role)) return true;
            var mem = memMap[u.id];
            return !(mem && mem.status === 'active');
        });

        // Load deleted accounts count
        var delResult = await A.client.from('deleted_accounts').select('id, deleted_at');
        var delAll = delResult.data || [];

        // Period filter
        computeUsrPeriodDates();

        // Deleted counts
        usrDeletedCount = delAll.length;
        usrDeletedPeriodCount = delAll.filter(function(d) {
            var dt = d.deleted_at ? d.deleted_at.slice(0, 10) : '';
            if (usrDateFrom && dt < usrDateFrom) return false;
            if (usrDateTo && dt > usrDateTo) return false;
            return true;
        }).length;

        var periodFiltered = items.slice();
        if (usrDateFrom) {
            periodFiltered = periodFiltered.filter(function(u) {
                return u.created_at && u.created_at.slice(0, 10) >= usrDateFrom;
            });
        }
        if (usrDateTo) {
            periodFiltered = periodFiltered.filter(function(u) {
                return u.created_at && u.created_at.slice(0, 10) <= usrDateTo;
            });
        }

        // Update stats — use ALL items for totals (funnel needs full data)
        updateUsrStats(items, periodFiltered, memMap);
        renderUsrGrowthChart(items, delAll);
        usrAllItems = periodFiltered;
        items = periodFiltered;

        // Client-side search
        if (usrSearchQuery) {
            var q = usrSearchQuery.toLowerCase();
            items = items.filter(function(u) {
                var name = (u.full_name || '').toLowerCase();
                var email = (u.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        // Sort: admin/manager always first, then by membership if toggled
        var rolePriority = { admin: 0, manager: 1 };
        items.sort(function(a, b) {
            var ra = rolePriority[a.role] !== undefined ? rolePriority[a.role] : 2;
            var rb = rolePriority[b.role] !== undefined ? rolePriority[b.role] : 2;
            if (ra !== rb) return ra - rb;

            // Within same priority — sort by membership expiry if toggled
            if (usrSortByMembership !== 0) {
                var ma = memMap[a.id], mb = memMap[b.id];
                var da = ma && ma.expires_at ? ma.expires_at : '';
                var db = mb && mb.expires_at ? mb.expires_at : '';
                if (da || db) {
                    if (!da) return 1;
                    if (!db) return -1;
                    var cmp = da < db ? -1 : da > db ? 1 : 0;
                    return usrSortByMembership === 1 ? cmp : -cmp;
                }
            }
            return 0;
        });

        var table = document.getElementById('adUsrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        /* ДВА РАЗНЫХ ПУСТЫХ СОСТОЯНИЯ (кусок 129). */

        if ((items.length || 0) === 0) {

            tbody.innerHTML = A.пустоеСостояние({

                всего: usrAllItems.length, колонок: 6,

                значок: '👥', пусто: L.usrNoUsers, подсказка: L.usrNoUsersText

            });

            return;

        }

        var now = Date.now();
        tbody.innerHTML = '';

        items.forEach(function(u) {
            var name = A.esc(u.full_name || '');
            var email = A.esc(u.email || '');
            var initials = (u.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();

            var avatarHtml = u.avatar_url
                ? '<img src="' + A.esc(u.avatar_url) + '" style="width:32px;height:32px;border-radius:50%;object-fit:cover;">'
                : '<div style="width:32px;height:32px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:var(--fs-xs);font-weight:600;">' + initials + '</div>';

            // Role badge
            var roleLabel = L['role' + u.role.charAt(0).toUpperCase() + u.role.slice(1)] || u.role;
            // ОДНО ОПРЕДЕЛЕНИЕ: класс `.kslt-role` в style.css (96в, 19.10).
            // Здесь стоял свой инлайн — 12/600, радиус 4px, без капса и без
            // обводки, высота 18 против эталонных 24. И он не знал роли
            // «игрок» вовсе: красил её как «прочие», хотя в layout.js она
            // синяя. Админ тут был КРАСНЫМ, а там лаймовым — слово Кости
            // 19.10: лайм. Красный остаётся роли ошибки и отказа.
            var roleBadge = '<span class="kslt-role kslt-role-' + (u.role || 'user') + '">' + roleLabel + '</span>';

            // Membership badge with expiry date
            var mem = memMap[u.id];
            var memBadge;
            if (A.сотрудник(u.role)) {
                // У сотрудников клуба членства нет и быть не может: под этой
                // почтой они ведут клуб, а не играют. Срок писать нечему
                memBadge = '<span class="ad-podpis">' + L.usrStaffNoMembership + '</span>';
            } else if (mem && mem.status === 'active') {
                var expDate = mem.expires_at ? mem.expires_at.split('T')[0].split('-') : null;
                var expFormatted = expDate ? expDate[2] + '.' + expDate[1] + '.' + expDate[0] : '';
                memBadge = '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + (expFormatted ? ' ' + L.usrBannedUntil + ' ' + expFormatted : '') + '</span>';
            } else if (mem && mem.status === 'expired') {
                var expDate2 = mem.expires_at ? mem.expires_at.split('T')[0].split('-') : null;
                var expFormatted2 = expDate2 ? expDate2[2] + '.' + expDate2[1] + '.' + expDate2[0] : '';
                memBadge = '<span class="ad-mem-badge ad-mem-expired">' + L.usrExpired + (expFormatted2 ? ' ' + expFormatted2 : '') + '</span>';
            } else {
                memBadge = '<span class="ad-podpis">' + L.usrNone + '</span>';
            }

            // Ban status badge
            var isBanned = u.banned_until && new Date(u.banned_until) > new Date();
            var banBadge;
            if (isBanned) {
                var isPermanent = new Date(u.banned_until).getFullYear() >= 2099;
                var banLabel = isPermanent
                    ? L.usrBannedForever
                    : L.usrBannedUntil + ' ' + u.banned_until.split('T')[0];
                banBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:var(--fs-xs);font-weight:600;background:var(--danger-subtle);color:var(--danger);">' + banLabel + '</span>';
            } else {
                banBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:var(--fs-xs);font-weight:600;background:var(--success-subtle);color:var(--success);">' + L.usrStatusActive + '</span>';
            }

            // Online indicator
            var isOnline = u.last_seen && (now - new Date(u.last_seen).getTime()) < 5 * 60 * 1000;
            var onlineDot = isOnline ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:var(--success);margin-left:6px;" title="' + L.usrOnline + '"></span>' : '';

            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';

            // Персоналу без привязки к Телеграму не дойдут спорные счета,
            // заявки на турнир и предложения новостей. Подключить за него
            // нельзя — только напомнить, поэтому метка стоит рядом с ролью.
            var безТелеграма = A.сотрудник(u.role) && !u.telegram_chat_id
                ? '<span title="Телеграм не подключён — уведомления не приходят" ' +
                  'style="margin-left:6px;cursor:help;">\u26A0\uFE0F</span>'
                : '';

            var canClick = isAdm || A.currentRole === 'manager';
            var tr = document.createElement('tr');
            if (canClick) tr.style.cursor = 'pointer';
            tr.innerHTML =
                '<td><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml + '<span>' + (name || email) + onlineDot + '</span>' + (u.player_id ? '<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:var(--fs-2xs);font-weight:600;background:var(--alpha-lime-12);color:var(--accent);" title="Player ID: ' + A.esc(u.player_id) + '">&#127934;</span>' : '') + '</div></td>' +
                '<td style="color:var(--text-muted);font-size:var(--fs-sm);">' + email + '</td>' +
                '<td>' + roleBadge + безТелеграма + '</td>' +
                '<td>' + banBadge + '</td>' +
                '<td>' + memBadge + '</td>' +
                '<td style="color:var(--text-muted);font-size:var(--fs-sm);">' + regDate + '</td>';

            if (canClick) {
                tr.addEventListener('click', function(e) {
                    if (e.target.closest('.ad-bulk-cell') || e.target.classList.contains('ad-bulk-item')) return;
                    loadAndEditUser(u.id);
                });
            }

            tbody.appendChild(tr);
        });

        // Setup bulk delete (admin only)
        if (isAdm) {
            A.setupBulkDelete({
                tableId: 'adUsrTable',
                tableName: 'profiles',
                confirmMsg: L.deleteSelectedConfirm,
                reloadFn: loadUsersList
            });

            // Add checkbox column to rows
            var rows = tbody.querySelectorAll('tr');
            rows.forEach(function(tr, idx) {
                if (items[idx]) {
                    var td = document.createElement('td');
                    td.className = 'ad-bulk-cell';
                td.style.width = '36px';
                td.style.textAlign = 'center';
                td.innerHTML = '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + items[idx].id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">';
                tr.insertBefore(td, tr.firstChild);
            }
        });
        } // end if (isAdm)
    }

    var _selectedPeriod = 3; // default period for inline payment
    var _lastPaymentInfo = ''; // inline payment confirmation message

    async function loadAndEditUser(id) {
        if (!A.client) return;

        var userRes = await A.client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, phone_country, telegram_chat_id, last_seen, created_at, banned_until, ban_reason, player_id, gender, birth_day, birth_month, birth_year, instagram, telegram')
            .eq('id', id)
            .single();

        if (userRes.error || !userRes.data) {
            A.showToast('User not found', 'error');
            return;
        }

        var user = userRes.data;

        // Load membership
        var memRes = await A.client.from('memberships')
            .select('id, status, starts_at, expires_at')
            .eq('profile_id', id)
            .order('created_at', { ascending: false })
            .limit(1);

        var membership = (memRes.data && memRes.data.length > 0) ? memRes.data[0] : null;

        // Load player data (category + ntrp)
        var playerData = null;
        if (user.player_id) {
            var plRes = await A.client.from('players').select('category_id, ntrp_singles').eq('id', user.player_id).single();
            if (plRes.data) playerData = plRes.data;
        }

        history.pushState(null, '', '#users/edit/' + id);
        renderUserForm(user, membership, playerData);
        window.scrollTo(0, 0);
    }

    async function renderUserForm(user, membership, playerData) {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var isAdm = A.currentRole === 'admin';
        var canManageMembership = (A.currentRole === 'admin' || A.currentRole === 'manager');
        // Членство и карточка игрока — только у игроков. Сотрудник клуба под
        // своей рабочей почтой не член КСЛТ: он клуб ведёт, а не выступает,
        // и срока у него нет — ни платить, ни продлевать нечего
        var сотрудник = A.сотрудник(user.role);
        var вестиЧленство = canManageMembership && !сотрудник;

        var tgStatus = user.telegram_chat_id ? L.usrTgConnected : L.usrTgNotConnected;
        var tgColor = user.telegram_chat_id ? 'var(--success)' : 'var(--text-muted)';
        var lastSeen = user.last_seen ? user.last_seen.split('T')[0] + ' ' + user.last_seen.split('T')[1].substring(0, 5) : '—';
        var regDate = user.created_at ? user.created_at.split('T')[0] + ' ' + user.created_at.split('T')[1].substring(0, 5) : '—';

        var initials = (user.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
        var avatarHtml = user.avatar_url
            ? '<img src="' + A.esc(user.avatar_url) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:64px;height:64px;border-radius:50%;background:var(--accent-subtle);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:var(--fs-md);font-weight:700;">' + initials + '</div>';

        // --- Membership section with inline payment ---
        var memHtml = '';
        if (сотрудник) {
            memHtml = '<div style="color:var(--text-muted);margin-bottom:12px;">' + L.usrStaffNoMembershipHint + '</div>';
        } else if (вестиЧленство) {
            // Status badge
            if (membership && membership.status === 'active') {
                var expDate = membership.expires_at ? membership.expires_at.split('T')[0] : '—';
                var daysLeft = '';
                if (membership.expires_at) {
                    var today = new Date(); today.setHours(0,0,0,0);
                    var exp = new Date(membership.expires_at); exp.setHours(0,0,0,0);
                    var diff = Math.ceil((exp - today) / 86400000);
                    daysLeft = diff > 0 ? ' (' + diff + ' ' + L.usrDn + ')' : '';
                }
                memHtml =
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                        '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>' +
                        '<span style="color:var(--text-secondary);font-size:var(--fs-sm);">' + L.usrDo + expDate + daysLeft + '</span>' +
                    '</div>';
            } else {
                memHtml =
                    '<div style="color:var(--text-muted);margin-bottom:12px;">' + L.usrNoMembership + '</div>';
            }

            // Inline payment: period buttons + amount + pay button
            var periodBtns = [1, 3, 6, 12].map(function(m) {
                var isActive = _selectedPeriod === m;
                var style = isActive
                    ? 'background:var(--accent);color:var(--accent-on);border-color:var(--accent);'
                    : '';
                return '<button class="ad-btn ad-btn-secondary ad-btn-sm adUsrPeriodBtn" data-months="' + m + '" style="' + style + '">' + L['usrMonths' + m] + '</button>';
            }).join('');

            memHtml +=
                '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
                    periodBtns +
                    '<span style="color:var(--text-secondary);font-size:var(--fs-sm);margin-left:4px;">' + L.usrPayAmount + ':</span>' +
                    '<input type="number" class="ad-field-input" id="adUsrPayAmount" style="width:100px;padding:4px 8px;font-size:var(--fs-sm);" placeholder="0" min="0">' +
                    '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrPayBtn" disabled style="opacity:0.5;">' + L.usrProcessPayment + '</button>' +
                '</div>' +
                '<div id="adUsrPayInfo" style="margin-top:8px;font-size:var(--fs-xs);">' +
                    (_lastPaymentInfo ? '<span style="color:var(--success);">' + _lastPaymentInfo + '</span>' : '') +
                '</div>';
            _lastPaymentInfo = ''; // clear after showing
        }

        // --- Player category + NTRP (unified for both existing and new players) ---
        var playerCatHtml = '';
        if (вестиЧленство) {
            await A.loadCategories();
            var catGender = userGenderToCategory(user.gender);
            var catOpts = buildCatOptions(catGender, playerData ? playerData.category_id : null);
            var ntrpOpts = A.ntrpOptions(playerData ? playerData.ntrp_singles : null);

            playerCatHtml =
                '<h3 style="font-size:var(--fs-sm);color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrPlayerCategory + '</h3>' +
                '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
                    '🎾 <select class="ad-field-input" id="adUsrPlayerCat" style="width:auto;padding:4px 8px;font-size:var(--fs-sm);">' + catOpts + '</select>' +
                    '<span style="color:var(--text-secondary);font-size:var(--fs-sm);">NTRP:</span>' +
                    '<select class="ad-field-input" id="adUsrNtrp" style="width:auto;padding:4px 8px;font-size:var(--fs-sm);">' + ntrpOpts + '</select>' +
                '</div>';
        }

        // --- Actions: single row at the bottom ---
        var isSelf = user.id === A.currentUserId;
        var isUserBanned = user.banned_until && new Date(user.banned_until) > new Date();
        var canModerate = isAdm ? (!isSelf && user.role !== 'admin') : (A.currentRole === 'manager' && !isSelf && user.role === 'user');

        var actionsHtml = '';
        var actionBtns = [];

        // Save button (profile + category + NTRP) — admin and manager
        if (canManageMembership) {
            actionBtns.push('<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrSave">' + L.save + '</button>');
        }

        // Ban / Unban
        if (canModerate) {
            if (isUserBanned) {
                actionBtns.push('<button class="ad-btn ad-btn-sm" id="adUsrUnban" style="background:var(--success-subtle);color:var(--success);border:1px solid var(--success-border);">' + L.usrUnbanUser + '</button>');
            } else {
                actionBtns.push('<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrBan">' + L.usrBanUser + '</button>');
            }
        }

        // Role actions
        if (isAdm && !isSelf) {
            if (user.role === 'manager') {
                actionBtns.push('<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrRemoveManager">' + L.usrRemoveManager + '</button>');
            } else if (user.role === 'user') {
                actionBtns.push('<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrMakeManager">' + L.usrMakeManager + '</button>');
            }
        }

        // Delete
        var canDelete = isAdm ? (!isSelf) : (A.currentRole === 'manager' && !isSelf && user.role === 'user');
        if (canDelete) {
            actionBtns.push('<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>');
        }

        if (isSelf && isAdm) {
            actionsHtml = '<div style="color:var(--text-muted);font-size:var(--fs-sm);font-style:italic;">' + L.usrCannotDeleteSelf + '</div>';
        } else if (actionBtns.length > 0) {
            actionsHtml = '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + actionBtns.join('') + '</div>';
        }

        // Ban info (shown above actions if banned)
        var banInfoHtml = '';
        if (canModerate && isUserBanned) {
            var isPerm = new Date(user.banned_until).getFullYear() >= 2099;
            var banDateStr = isPerm ? L.usrBannedForever : (L.usrBannedUntil + ' ' + user.banned_until.split('T')[0]);
            var banReasonStr = user.ban_reason ? ' — ' + A.esc(user.ban_reason) : '';
            banInfoHtml =
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                    '<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:var(--fs-xs);font-weight:600;background:var(--danger-subtle);color:var(--danger);">' + L.usrBanned + ': ' + banDateStr + banReasonStr + '</span>' +
                '</div>';
        }

        // OTP block info (check async, inject later)
        var otpBlockId = 'adOtpBlock_' + user.id;

        // Profile editable for admin and manager
        var profileReadonly = !canManageMembership ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<button class="ad-btn ad-btn-secondary" id="adUsrBack">' + L.back + '</button>' +
                '<h2 class="ad-section-title">' + L.usrEdit + '</h2>' +
            '</div>' +
            '<div class="ad-form-card" style="max-width:700px;">' +
                // Avatar + info header
                '<div style="display:flex;align-items:center;gap:16px;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,0.06);">' +
                    avatarHtml +
                    '<div>' +
                        '<div style="font-size:var(--fs-md);font-weight:600;color:var(--text-primary);">' + A.esc(user.full_name || user.email) + '</div>' +
                        '<div style="color:var(--text-muted);font-size:var(--fs-sm);">' + A.esc(user.email || '') + '</div>' +
                        '<div style="display:flex;gap:8px;margin-top:4px;">' +
                            '<span style="color:' + tgColor + ';font-size:var(--fs-xs);">TG: ' + tgStatus + '</span>' +
                            '<span class="ad-podpis">' + L.usrLastSeen + ': ' + lastSeen + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Profile form
                '<h3 style="font-size:var(--fs-sm);color:var(--accent);margin-bottom:12px;font-weight:600;">' + L.usrProfile + '</h3>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrFullName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrName" value="' + A.esc(user.full_name || '') + '"' + profileReadonly + '>' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrPhone + '</label>' +
                        adminPhoneFieldHtml(user, profileReadonly) +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrEmail + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrEmail" value="' + A.esc(user.email || '') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrRegistered + '</label>' +
                        '<input type="text" class="ad-field-input" value="' + regDate + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrGender + '</label>' +
                        '<input type="text" class="ad-field-input" value="' + (user.gender === 'men' ? L.genderMen : user.gender === 'women' ? L.genderWomen : '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrDateRozhdeniya + '</label>' +
                        '<input type="text" class="ad-field-input" value="' + (user.birth_day && user.birth_month && user.birth_year ? (user.birth_day < 10 ? '0' : '') + user.birth_day + '.' + (user.birth_month < 10 ? '0' : '') + user.birth_month + '.' + user.birth_year : '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">Instagram</label>' +
                        '<input type="text" class="ad-field-input" value="' + A.esc(user.instagram || '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">Telegram</label>' +
                        '<input type="text" class="ad-field-input" value="' + A.esc(user.telegram || '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                '</div>' +
                // Membership with inline payment
                (canManageMembership ? '<h3 style="font-size:var(--fs-sm);color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrMembership + '</h3>' + memHtml : '') +
                // Player category + NTRP
                playerCatHtml +
                // Ban info + Actions (single row)
                '<div id="' + otpBlockId + '"></div>' +
                (actionsHtml ? '<div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">' + banInfoHtml + actionsHtml + '</div>' : '') +
            '</div>';

        // ---- OTP block check (async) ----
        if (canModerate) {
            (async function() {
                try {
                    var identifier = user.email || '';
                    var { data: blocks } = await A.db.from('otp_blocks')
                        .select('*')
                        .like('block_key', identifier + ':%')
                        .order('updated_at', { ascending: false })
                        .limit(1);

                    var el = document.getElementById(otpBlockId);
                    if (!el) return;

                    if (blocks && blocks.length > 0) {
                        var b = blocks[0];
                        var isBlocked = b.blocked_until && new Date(b.blocked_until) > new Date() && !b.admin_unblocked;
                        var escalLabels = ['15 мин', '1 час', '24 часа'];
                        var statusText = isBlocked
                            ? L.usrZablokirovan + ' (' + escalLabels[b.escalation || 0] + ')'
                            : L.usrNetBlokirovki;
                        var statusColor = isBlocked ? 'var(--danger)' : 'var(--success)';

                        el.innerHTML =
                            '<div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding:8px 12px;border-radius:8px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);">' +
                                '<span style="font-size:var(--fs-sm);color:' + statusColor + ';">' + statusText + '</span>' +
                                (isBlocked
                                    ? '<button class="ad-btn ad-btn-secondary" id="adUnblockOtp" style="margin-left:auto;font-size:var(--fs-xs);padding:4px 12px;">' + L.usrRazblokirovat + '</button>'
                                    : '') +
                            '</div>';

                        if (isBlocked) {
                            document.getElementById('adUnblockOtp').addEventListener('click', async function() {
                                this.disabled = true;
                                this.textContent = '...';
                                try {
                                    await A.adminAction('unblock_otp', { user_id: user.id });
                                    A.showToastL.usrMsgRazblokirovan;
                                    el.innerHTML = '<div style="margin-top:12px;font-size:var(--fs-sm);color:var(--success);">' + L.usrErrRazblokirovan + '</div>';
                                } catch (e) {
                                    A.showToast('Ошибка', 'error');
                                    this.disabled = false;
                                    this.textContent = 'Разблокировать OTP';
                                }
                            });
                        }
                    }
                } catch (e) { /* otp_blocks table may not exist yet */ }
            })();
        }

        // ---- Event listeners ----

        document.getElementById('adUsrBack').addEventListener('click', function() {
            history.pushState(null, '', '#users');
            renderUsersList();
            window.scrollTo(0, 0);
        });

        // Save all (profile + category/NTRP + create player if needed)
        var saveBtn = document.getElementById('adUsrSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveAllHandler(user);
            });
        }

        // Period buttons for inline payment
        var periodBtnsEls = container.querySelectorAll('.adUsrPeriodBtn');
        periodBtnsEls.forEach(function(btn) {
            btn.addEventListener('click', function() {
                _selectedPeriod = parseInt(btn.getAttribute('data-months'), 10);
                // Update button styles
                periodBtnsEls.forEach(function(b) {
                    if (parseInt(b.getAttribute('data-months'), 10) === _selectedPeriod) {
                        b.style.background = 'var(--accent)';
                        b.style.color = '#000';
                        b.style.borderColor = 'var(--accent)';
                    } else {
                        b.style.background = '';
                        b.style.color = '';
                        b.style.borderColor = '';
                    }
                });
            });
        });

        // Pay button — enabled only when amount is entered
        var payBtn = document.getElementById('adUsrPayBtn');
        var payAmountEl = document.getElementById('adUsrPayAmount');
        if (payBtn && payAmountEl) {
            payAmountEl.addEventListener('input', function() {
                var hasValue = payAmountEl.value !== '';
                payBtn.disabled = !hasValue;
                payBtn.style.opacity = hasValue ? '1' : '0.5';
            });
            payBtn.addEventListener('click', function() {
                processPayment(user, membership);
            });
        }

        // Role actions (admin only)
        var makeManager = document.getElementById('adUsrMakeManager');
        if (makeManager) {
            makeManager.addEventListener('click', function() {
                changeUserRole(user.id, 'manager');
            });
        }

        var removeManager = document.getElementById('adUsrRemoveManager');
        if (removeManager) {
            removeManager.addEventListener('click', function() {
                changeUserRole(user.id, 'user');
            });
        }

        var deleteBtn = document.getElementById('adUsrDelete');
        if (deleteBtn) {
            deleteBtn.addEventListener('click', function() {
                deleteUserHandler(user.id);
            });
        }

        // Ban button
        var banBtn = document.getElementById('adUsrBan');
        if (banBtn) {
            banBtn.addEventListener('click', function() {
                openBanModal(user.id);
            });
        }

        // Unban button
        var unbanBtn = document.getElementById('adUsrUnban');
        if (unbanBtn) {
            unbanBtn.addEventListener('click', function() {
                unbanUserHandler(user.id);
            });
        }
    }

    async function processPayment(user, membership) {
        var amountEl = document.getElementById('adUsrPayAmount');
        var amount = amountEl ? parseFloat(amountEl.value) || 0 : 0;

        if (!_selectedPeriod) return;

        var payBtn = document.getElementById('adUsrPayBtn');
        if (payBtn) { payBtn.disabled = true; payBtn.textContent = '...'; }

        try {
            var session = await A.client.auth.getSession();
            var createdBy = session.data.session ? session.data.session.user.id : null;

            // Calculate dates: if active membership — extend from expires_at, else from today
            var isExtend = membership && membership.status === 'active' && membership.expires_at;
            var startDate = isExtend ? new Date(membership.expires_at) : new Date();
            var endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + _selectedPeriod);

            var startStr = KSLT_VREMYA.деньПоБишкеку(startDate);
            var endStr = KSLT_VREMYA.деньПоБишкеку(endDate);

            // 1. Create membership
            var memResult = await A.client.from('memberships').insert({
                profile_id: user.id,
                status: 'active',
                starts_at: startStr + 'T00:00:00.000Z',
                expires_at: endStr + 'T23:59:59.000Z',
                note: 'Админ: через карточку пользователя'
            }).select('id').single();

            if (memResult.error) {
                A.showToast(memResult.error.message, 'error');
                if (payBtn) { payBtn.disabled = false; payBtn.textContent = L.usrProcessPayment; }
                return;
            }

            // 2. Create payment record
            var payResult = await A.client.from('payments').insert({
                profile_id: user.id,
                membership_id: memResult.data.id,
                amount: amount,
                currency: 'KGS',
                payment_method: 'cash',
                status: 'completed',
                note: null,
                created_by: createdBy
            });

            if (payResult.error) {
                A.showToast(payResult.error.message, 'error');
                if (payBtn) { payBtn.disabled = false; payBtn.textContent = L.usrProcessPayment; }
                return;
            }

            // 3. Loyalty points
            if (amount > 0 && A.earnLoyaltyPoints) {
                A.earnLoyaltyPoints(user.id, 'membership', memResult.data.id, null);

                // First membership welcome bonus
                var existingBonus = await A.client.from('loyalty_transactions')
                    .select('id')
                    .eq('profile_id', user.id)
                    .eq('action', 'first_membership')
                    .limit(1);
                if (!existingBonus.data || existingBonus.data.length === 0) {
                    A.earnLoyaltyPoints(user.id, 'first_membership', memResult.data.id, null);
                }
            }

            // 4. TG notification
            notifyMembershipTg(isExtend ? 'extended' : 'granted', user.id, endStr + 'T23:59:59.000Z');

            A.showToast(isExtend ? L.usrMembershipExtended : L.usrMembershipGiven, 'success');

            // 5. Store inline confirmation for display after reload
            var now = new Date();
            var timeStr = (now.getHours() < 10 ? '0' : '') + now.getHours() + ':' + (now.getMinutes() < 10 ? '0' : '') + now.getMinutes();
            var dateStr = (now.getDate() < 10 ? '0' : '') + now.getDate() + '.' + (now.getMonth() + 1 < 10 ? '0' : '') + (now.getMonth() + 1) + '.' + now.getFullYear();
            _lastPaymentInfo = '✓ ' + L.usrOplataProvedena + ' — ' + dateStr + ' ' + timeStr + ', ' + amount + ' KGS';

            // Reload form (will show confirmation via _lastPaymentInfo)
            loadAndEditUser(user.id);
        } catch (err) {
            A.showToast('Error: ' + err.message, 'error');
            if (payBtn) { payBtn.disabled = false; payBtn.style.opacity = '1'; payBtn.textContent = L.usrProcessPayment; }
        }
    }

    async function saveAllHandler(user) {
        // For new users (no player card) — require payment first
        if (!user.player_id) {
            var memCheck = await A.client.from('memberships')
                .select('id')
                .eq('profile_id', user.id)
                .eq('status', 'active')
                .limit(1);
            if (!memCheck.data || memCheck.data.length === 0) {
                A.showConfirm(
                    'Необходима оплата',
                    'Для создания карточки игрока сначала проведите оплату членства. Введите сумму и нажмите "Оплатить".',
                    null,
                    'OK'
                );
                return;
            }
        }

        var btn = document.getElementById('adUsrSave');
        if (btn) { btn.textContent = L.saving; btn.disabled = true; }

        try {
            // 1. Save profile (name, phone)
            var nameEl = document.getElementById('adUsrName');
            var phoneEl = document.getElementById('adUsrPhone');
            if (nameEl) {
                var phoneCountryEl = document.getElementById('adUsrPhoneCountry');
                var phoneCountry = phoneCountryEl ? phoneCountryEl.value : null;
                var phoneValue = phoneEl
                    ? (window.KSLT_PHONE ? KSLT_PHONE.join(phoneCountry, phoneEl.value) : phoneEl.value.trim())
                    : '';

                var profResult = await A.client.from('profiles').update({
                    full_name: nameEl.value.trim(),
                    phone: phoneValue || null,
                    phone_country: phoneValue ? phoneCountry : null
                }).eq('id', user.id);
                if (profResult.error) {
                    A.showToast(profResult.error.message, 'error');
                    if (btn) { btn.disabled = false; btn.textContent = L.save; }
                    return;
                }
            }

            // 2. Category + NTRP
            var catEl = document.getElementById('adUsrPlayerCat');
            var ntrpEl = document.getElementById('adUsrNtrp');
            if (catEl) {
                var catId = catEl.value;
                var ntrpVal = ntrpEl ? ntrpEl.value : null;

                if (user.player_id) {
                    // Update existing player
                    var upd = { category_id: catId };
                    upd.ntrp_singles = ntrpVal ? parseFloat(ntrpVal) : null;
                    var plResult = await A.client.from('players').update(upd).eq('id', user.player_id);
                    if (plResult.error) {
                        A.showToast(plResult.error.message, 'error');
                        if (btn) { btn.disabled = false; btn.textContent = L.save; }
                        return;
                    }
                } else if (catId) {
                    // Create new player card
                    await autoCreatePlayer(user, catId);
                    // Reload user to get player_id, then set NTRP
                    var freshUser = await A.client.from('profiles').select('player_id').eq('id', user.id).single();
                    if (freshUser.data && freshUser.data.player_id && ntrpVal) {
                        await A.client.from('players').update({
                            ntrp_singles: parseFloat(ntrpVal)
                        }).eq('id', freshUser.data.player_id);
                    }
                }
            }

            A.showToast(L.usrUserSaved, 'success');
            loadAndEditUser(user.id);
        } catch (err) {
            A.showToast('Error: ' + err.message, 'error');
        }

        if (btn) { btn.disabled = false; btn.textContent = L.save; }
    }

    /**
     * Телефон: страна списком, номер отдельно — так же, как в кабинете игрока.
     * Код страны подставляется по выбору, а не угадывается по номеру: у России
     * и Казахстана он общий, +7.
     */
    function adminPhoneFieldHtml(user, readonlyAttr) {
        var lang = 'ru';
        var parts = window.KSLT_PHONE
            ? KSLT_PHONE.split(user.phone || '', user.phone_country)
            : { iso: 'KG', rest: user.phone || '' };
        var disabled = readonlyAttr ? ' disabled' : '';

        return '<div class="ad-phone-row">' +
            (window.KSLT_PHONE
                ? KSLT_PHONE.selectHtml('adUsrPhoneCountry', parts.iso, lang, 'ad-field-input ad-phone-country').replace('<select', '<select' + disabled)
                : '') +
            '<input type="text" class="ad-field-input ad-phone-number" id="adUsrPhone" value="' +
                A.esc(parts.rest) + '" placeholder="555 123 456"' + readonlyAttr + '>' +
        '</div>';
    }

    function userGenderToCategory(userGender) {
        // Словарь один на весь проект: men/women и в учётной записи, и в
        // карточке игрока, и у категорий. Переводить больше нечего
        return (userGender === 'men' || userGender === 'women') ? userGender : null;
    }

    function buildCatOptions(filterGender, selectedId) {
        var opts = '';
        A.cachedCategories.forEach(function(c) {
            if (filterGender && c.gender && c.gender !== filterGender) return;
            var sel = (selectedId && c.id === selectedId) ? ' selected' : '';
            opts += '<option value="' + c.id + '"' + sel + '>' + (c.name) + '</option>';
        });
        return opts;
    }



    async function autoCreatePlayer(user, categoryId) {
        /* СОТРУДНИКУ КАРТОЧКА НЕ ЗАВОДИТСЯ — кусок 143, 23.10, слово Кости.
           Сюда приходят из сохранения пользователя: выбрана категория, а
           карточки нет — значит её создают. Роль здесь не спрашивалась
           вовсе, и админ мог завести карточку сотруднику, пока кабинет и
           членство уже считали, что тот не играет. Отказ ГОВОРИТСЯ, а не
           молчит: тихий возврат читается как «кнопка не работает». */
        if (A.сотрудник(user.role)) {
            A.showToast(L.usrStaffNoCardErr, 'error');
            return;
        }
        var name = (user.full_name || '').trim();
        if (!name) return;

        // Generate slug id
        var baseId = A.slugify(name);
        if (!baseId) return;

        // Check uniqueness
        var finalId = baseId;
        var suffix = 2;
        while (true) {
            var check = await A.client.from('players').select('id').eq('id', finalId).maybeSingle();
            if (!check.data) break;
            finalId = baseId + '-' + suffix;
            suffix++;
            if (suffix > 20) break; // safety
        }

        // Пол переносим из профиля как есть — словарь общий.
        // Раньше при пустом поле молча ставился мужской, и женщины без
        // указанного пола попадали в мужской рейтинг. Лучше не создавать
        // карточку вовсе, чем создать с неверным полом.
        var playerGender = (user.gender === 'men' || user.gender === 'women') ? user.gender : null;
        if (!playerGender) {
            A.showToast('Сначала укажите пол в профиле пользователя — рейтинг ведётся раздельно для мужчин и женщин', 'error');
            return;
        }

        var insertRes = await A.client.from('players').insert({
            id: finalId,
            name: name,
            category_id: categoryId,
            gender: playerGender,
            points: 0,
            wins: 0,
            losses: 0,
            country: '\ud83c\uddf0\ud83c\uddec'
        });

        if (insertRes.error) {
            A.showToast('Player: ' + insertRes.error.message, 'error');
            return;
        }

        // Link player to profile
        var linkRes = await A.client.from('profiles').update({ player_id: finalId }).eq('id', user.id);
        if (linkRes.error) {
            A.showToast('Link: ' + linkRes.error.message, 'error');
            return;
        }

        A.showToast(L.usrPlayerCreated, 'success');
    }



    function notifyMembershipTg(action, profileId, expiresAt) {
        A.client.auth.getSession().then(function(res) {
            if (!res.data || !res.data.session) return;
            var token = res.data.session.access_token;
            var body = { action: action, profile_id: profileId };
            if (expiresAt) body.expires_at = expiresAt;
            fetch(SUPABASE_URL + '/functions/v1/membership-tg-notify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token
                },
                body: JSON.stringify(body)
            }).catch(function() { /* fire and forget */ });
        }).catch(function() { /* ignore */ });
    }

    async function changeUserRole(userId, newRole) {
        if (userId === A.currentUserId) {
            A.showToast(L.usrCannotDeleteSelf, 'error');
            return;
        }

        var result = await A.client.from('profiles').update({ role: newRole }).eq('id', userId);

        if (result.error) {
            A.showToast(result.error.message, 'error');
        } else {
            A.showToast(L.usrRoleChanged, 'success');
            loadAndEditUser(userId);
        }
    }

    async function deleteUserHandler(userId) {
        if (userId === A.currentUserId) {
            A.showToast(L.usrCannotDeleteSelf, 'error');
            return;
        }

        A.showConfirm(L.usrDeleteConfirmTitle, L.usrDeleteConfirm, async function() {
            try {
                var session = await A.client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ action: 'delete_user', user_id: userId })
                });

                var data = await resp.json();
                if (data.error) {
                    A.showToast(data.error, 'error');
                } else {
                    A.showToast(L.usrUserDeleted, 'success');
                    renderUsersList();
                }
            } catch (err) {
                A.showToast('Error: ' + err.message, 'error');
            }
        });
    }

    function openBanModal(userId) {
        /* ОБОЛОЧКА ОДНА НА АДМИНКУ: role, подпись диктору, фокус,
           ловушка Tab, возврат фокуса, Esc и клик мимо — её работа. */
        var окноГот = A.оболочкаОкна({ сырое:
            '<div class="ad-confirm-modal" style="max-width:440px;">' +
                '<div class="ad-confirm-title">' + L.usrBanConfirm + '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.usrBanDuration + '</label>' +
                    '<select class="ad-field-input" id="adBanDuration">' +
                        '<option value="1d">' + L.usrBan1d + '</option>' +
                        '<option value="3d">' + L.usrBan3d + '</option>' +
                        '<option value="7d" selected>' + L.usrBan7d + '</option>' +
                        '<option value="30d">' + L.usrBan30d + '</option>' +
                        '<option value="permanent">' + L.usrBanPermanent + '</option>' +
                    '</select>' +
                '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.usrBanReason + '</label>' +
                    '<textarea class="ad-field-input ad-field-textarea-sm" id="adBanReason" rows="2" style="resize:vertical;"></textarea>' +
                '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adBanCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-danger" id="adBanSubmit">' + L.usrBanUser + '</button>' +
                '</div>' +
            '</div>' });
        var overlay = окноГот.overlay;

        document.getElementById('adBanCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('adBanSubmit').addEventListener('click', async function() {
            var duration = document.getElementById('adBanDuration').value;
            var reason = document.getElementById('adBanReason').value.trim();

            var btn = document.getElementById('adBanSubmit');
            btn.textContent = L.saving;
            btn.disabled = true;

            try {
                var session = await A.client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        action: 'ban_user',
                        user_id: userId,
                        duration: duration,
                        reason: reason || undefined
                    })
                });

                var data = await resp.json();
                if (data.error) {
                    A.showToast(data.error, 'error');
                    btn.textContent = L.usrBanUser;
                    btn.disabled = false;
                } else {
                    overlay.remove();
                    A.showToast(L.usrBanSuccess, 'success');
                    loadAndEditUser(userId);
                }
            } catch (err) {
                A.showToast('Error: ' + err.message, 'error');
                btn.textContent = L.usrBanUser;
                btn.disabled = false;
            }
        });
    }

    async function unbanUserHandler(userId) {
        A.showConfirm(L.usrUnbanUser, L.usrUnbanConfirm, async function() {
            try {
                var session = await A.client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({ action: 'unban_user', user_id: userId })
                });

                var data = await resp.json();
                if (data.error) {
                    A.showToast(data.error, 'error');
                } else {
                    A.showToast(L.usrUnbanSuccess, 'success');
                    loadAndEditUser(userId);
                }
            } catch (err) {
                A.showToast('Error: ' + err.message, 'error');
            }
        }, L.usrUnbanUser);
    }

    function openAddManagerModal() {
        /* ОБОЛОЧКА ОДНА НА АДМИНКУ: role, подпись диктору, фокус,
           ловушка Tab, возврат фокуса, Esc и клик мимо — её работа. */
        var окноГот = A.оболочкаОкна({ сырое:
            '<div class="ad-confirm-modal" style="max-width:440px;">' +
                '<div class="ad-confirm-title">' + L.usrAddManagerTitle + '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.usrAddManagerEmail + ' *</label>' +
                    '<input type="email" class="ad-field-input" id="adMgrEmail" placeholder="email@example.com">' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrAddManagerFirstName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMgrFirstName">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrAddManagerLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMgrLastName">' +
                    '</div>' +
                '</div>' +
                '<div style="color:var(--text-muted);font-size:var(--fs-xs);margin-bottom:16px;">' + L.usrAddManagerHint + '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adMgrCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-primary" id="adMgrSubmit">' + L.usrAddManager + '</button>' +
                '</div>' +
            '</div>' });
        var overlay = окноГот.overlay;

        document.getElementById('adMgrCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('adMgrSubmit').addEventListener('click', async function() {
            var email = document.getElementById('adMgrEmail').value.trim();
            var firstName = document.getElementById('adMgrFirstName').value.trim();
            var lastName = document.getElementById('adMgrLastName').value.trim();

            if (!email) {
                A.showToast('Email required', 'error');
                return;
            }

            var btn = document.getElementById('adMgrSubmit');
            btn.textContent = L.saving;
            btn.disabled = true;

            try {
                var session = await A.client.auth.getSession();
                var token = session.data.session.access_token;

                var resp = await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + token
                    },
                    body: JSON.stringify({
                        action: 'create_manager',
                        email: email,
                        first_name: firstName,
                        last_name: lastName
                    })
                });

                var data = await resp.json();
                if (data.error) {
                    A.showToast(data.error, 'error');
                    btn.textContent = L.usrAddManager;
                    btn.disabled = false;
                } else {
                    overlay.remove();
                    A.showToast(data.action === 'invited' ? L.usrManagerInvited : L.usrManagerAdded, 'success');
                    loadUsersList();
                }
            } catch (err) {
                A.showToast('Error: ' + err.message, 'error');
                btn.textContent = L.usrAddManager;
                btn.disabled = false;
            }
        });
    }


    // ---- Stats ----
    function renderUsrGrowthChart(allProfiles, allDeleted) {
        var canvas = document.getElementById('adUsrGrowthChart');
        if (!canvas || typeof Chart === 'undefined') return;

        var now = new Date();
        var year = now.getFullYear();
        var month = now.getMonth();
        var today = now.getDate();

        // Build labels: days 1..today
        var labels = [];
        for (var d = 1; d <= today; d++) {
            labels.push(d);
        }

        // Month key for filtering (e.g. "2026-03")
        var monthKey = year + '-' + String(month + 1).padStart(2, '0');

        // Count registrations per day this month
        var regPerDay = {};
        for (var i = 1; i <= today; i++) regPerDay[i] = 0;

        allProfiles.forEach(function(p) {
            if (!p.created_at) return;
            if (p.created_at.slice(0, 7) !== monthKey) return;
            var day = parseInt(p.created_at.slice(8, 10), 10);
            if (day >= 1 && day <= today) regPerDay[day]++;
        });

        // Count players (profiles with player_id) created per day this month
        var plrPerDay = {};
        for (var p = 1; p <= today; p++) plrPerDay[p] = 0;

        allProfiles.forEach(function(pr) {
            if (!pr.player_id || !pr.created_at) return;
            if (pr.created_at.slice(0, 7) !== monthKey) return;
            var day = parseInt(pr.created_at.slice(8, 10), 10);
            if (day >= 1 && day <= today) plrPerDay[day]++;
        });

        // Count deletions per day this month
        var delPerDay = {};
        for (var j = 1; j <= today; j++) delPerDay[j] = 0;

        allDeleted.forEach(function(del) {
            if (!del.deleted_at) return;
            if (del.deleted_at.slice(0, 7) !== monthKey) return;
            var day = parseInt(del.deleted_at.slice(8, 10), 10);
            if (day >= 1 && day <= today) delPerDay[day]++;
        });

        // Build cumulative data
        var regData = [], plrData = [], delData = [], netData = [];
        var regSum = 0, plrSum = 0, delSum = 0;

        for (var k = 1; k <= today; k++) {
            regSum += regPerDay[k];
            plrSum += plrPerDay[k];
            delSum += delPerDay[k];
            regData.push(regSum);
            plrData.push(plrSum);
            delData.push(delSum);
            netData.push(regSum - delSum);
        }

        // Destroy previous instance
        if (usrChartInstance) {
            usrChartInstance.destroy();
            usrChartInstance = null;
        }

        usrChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: L.usrChartRegistered,
                        data: regData,
                        borderColor: window.KSLT_KRASKA.цвет('--success'),
                        backgroundColor: window.KSLT_KRASKA.цвет('--success', 0.1),
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: window.KSLT_KRASKA.цвет('--success'),
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartPlayers,
                        data: plrData,
                        borderColor: window.KSLT_KRASKA.цвет('--warning'),
                        backgroundColor: window.KSLT_KRASKA.цвет('--warning', 0.1),
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: window.KSLT_KRASKA.цвет('--warning'),
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartDeleted,
                        data: delData,
                        borderColor: window.KSLT_KRASKA.цвет('--danger'),
                        backgroundColor: window.KSLT_KRASKA.цвет('--danger', 0.1),
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: window.KSLT_KRASKA.цвет('--danger'),
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartNet,
                        data: netData,
                        borderColor: window.KSLT_KRASKA.цвет('--accent'),
                        backgroundColor: window.KSLT_KRASKA.цвет('--accent', 0.12),
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: window.KSLT_KRASKA.цвет('--accent'),
                        tension: 0.3,
                        fill: false
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: window.KSLT_KRASKA.цвет('--neutral-white', 0.72),
                            font: { size: 11 },
                            boxWidth: 12,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: window.KSLT_KRASKA.цвет('--chart-tip-bg'),
                        titleColor: window.KSLT_KRASKA.цвет('--chart-tip-title'),
                        bodyColor: window.KSLT_KRASKA.цвет('--chart-tip-body'),
                        borderColor: window.KSLT_KRASKA.цвет('--neutral-white', 0.12),
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(items) {
                                return items[0].label + ' ' + (['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][month]);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.04) },
                        ticks: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.5), font: { size: 10 } },
                        title: {
                            display: true,
                            text: 'День',
                            color: window.KSLT_KRASKA.цвет('--neutral-white', 0.4),
                            font: { size: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: window.KSLT_KRASKA.цвет('--neutral-white', 0.06) },
                        ticks: {
                            color: window.KSLT_KRASKA.цвет('--neutral-white', 0.5),
                            font: { size: 10 },
                            stepSize: 1,
                            callback: function(val) { return Number.isInteger(val) ? val : ''; }
                        }
                    }
                }
            }
        });
    }

    function updateUsrStats(allItems, periodItems, memMap) {
        var total = allItems.length;
        var linkedPlayers = 0, activeMembers = 0;
        var tgCount = 0, bannedCount = 0;
        var now = new Date();

        // Count new this month
        var monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
        var newThisMonth = 0;

        allItems.forEach(function(u) {
            if (u.player_id) linkedPlayers++;
            if (u.telegram_chat_id) tgCount++;
            if (u.banned_until && new Date(u.banned_until) > now) bannedCount++;
            var mem = memMap[u.id];
            if (mem && mem.status === 'active') activeMembers++;
            if (u.created_at && u.created_at.slice(0, 10) >= monthStart) newThisMonth++;
        });

        var conversionPct = total > 0 ? Math.round(linkedPlayers / total * 100) : 0;

        var el = function(id, val) {
            var e = document.querySelector('#' + id + ' .ad-usr-card-value');
            if (e) e.textContent = val;
        };
        // Funnel row
        el('adUsrStatTotal', total);
        el('adUsrStatPlayers', linkedPlayers);
        el('adUsrStatConversion', conversionPct + '%');
        el('adUsrStatNewMonth', newThisMonth);
        // Detail row
        el('adUsrStatMembers', activeMembers);
        el('adUsrStatTg', tgCount);
        el('adUsrStatBanned', bannedCount);

        var setEl = function(id, val) {
            var e = document.getElementById(id);
            if (e) e.textContent = val;
        };
        setEl('adUsrBrkDeleted', usrDeletedCount);
    }

    // ---- Period ----
    function computeUsrPeriodDates() {
        var now = new Date();
        if (usrPeriodMode === 'this_month') {
            usrDateFrom = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
            usrDateTo = '';
        } else if (usrPeriodMode === 'last_month') {
            var lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            var lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            usrDateFrom = lm.getFullYear() + '-' + String(lm.getMonth() + 1).padStart(2, '0') + '-01';
            usrDateTo = lmEnd.getFullYear() + '-' + String(lmEnd.getMonth() + 1).padStart(2, '0') + '-' + String(lmEnd.getDate()).padStart(2, '0');
        } else if (usrPeriodMode !== 'custom') {
            usrDateFrom = '';
            usrDateTo = '';
        }
    }

    // ---- PDF ----
    function openUsrPdfReport() {
        var now = new Date();
        var items = usrAllItems;
        var memMap = usrMemMap;

        // Compute stats
        var total = items.length;
        var activeMembers = 0, linkedPlayers = 0;
        var admins = 0, managers2 = 0, users2 = 0, tgCount = 0, bannedCount = 0;

        items.forEach(function(u) {
            if (u.role === 'admin') admins++;
            else if (u.role === 'manager') managers2++;
            else users2++;
            if (u.telegram_chat_id) tgCount++;
            if (u.banned_until && new Date(u.banned_until) > now) bannedCount++;
            var mem = memMap[u.id];
            if (mem && mem.status === 'active') activeMembers++;
            if (u.player_id) linkedPlayers++;
        });

        // Period label
        var periodLabel = '';
        if (usrPeriodMode === 'this_month') periodLabel = L.usrPrdThis;
        else if (usrPeriodMode === 'last_month') periodLabel = L.usrPrdLast;
        else if (usrPeriodMode === 'custom' && usrDateFrom) periodLabel = fmtUsrDate(usrDateFrom) + ' – ' + (usrDateTo ? fmtUsrDate(usrDateTo) : '...');
        else periodLabel = L.usrPrdAll;

        // Table rows
        var tableRows = '';
        items.forEach(function(u, i) {
            var roleLabel = L['role' + u.role.charAt(0).toUpperCase() + u.role.slice(1)] || u.role;
            var mem = memMap[u.id];
            var memLabel = (mem && mem.status === 'active') ? L.usrActive : (mem && mem.status === 'expired') ? L.usrExpired : L.usrNone;
            var playerBadge = u.player_id ? '✓' : '—';
            var tgBadge = u.telegram_chat_id ? '✓' : '—';
            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';

            tableRows +=
                '<tr>' +
                    '<td>' + (i + 1) + '</td>' +
                    '<td>' + escUsrHtml(u.full_name || '—') + '</td>' +
                    '<td>' + escUsrHtml(u.email || '—') + '</td>' +
                    '<td>' + roleLabel + '</td>' +
                    '<td>' + memLabel + '</td>' +
                    '<td>' + playerBadge + '</td>' +
                    '<td>' + tgBadge + '</td>' +
                    '<td>' + regDate + '</td>' +
                '</tr>';
        });

        var reportDate = fmtUsrDate(KSLT_VREMYA.деньПоБишкеку(now));

        /* ЛИСТ СОБИРАЕТ ДОМ (кусок 150). Было: `window.open`, скелет,
           17 правил css, шапка, плашки, таблица, подвал и зов печати —
           всё это стояло здесь и ещё в двух разделах знак в знак.
           ПЛОТНЫЙ ЛИСТ — СВОЙСТВО ЭТОГО ОТЧЁТА, А НЕ ДОМА: у него плашки
           уже (100 вместо 120) и полоса плашек ниже (16 вместо 24).
           РАЗБИВКА ПО РОЛЯМ ПРИХОДИТ ГОТОВОЙ РАЗМЕТКОЙ: её собирает
           раздел, он же и гасит данные внутри. */
        A.печатныйЛист({
            заголовок: L.usrPdfTitle,
            периодПодпись: L.usrPeriod,
            период: periodLabel,
            плотный: true,
            плашки: [
                { значение: total, подпись: L.usrStatTotal },
                { значение: activeMembers, подпись: L.usrStatMembers },
                { значение: linkedPlayers, подпись: L.usrStatPlayers }
            ],
            разбивка:
                '\u{1F6E1}\uFE0F <span>' + escUsrHtml(String(admins)) + '</span> ' + escUsrHtml(L.usrStatAdmins) +
                ' \u00b7 <span>' + escUsrHtml(String(managers2)) + '</span> ' + escUsrHtml(L.usrStatManagers) +
                ' \u00b7 <span>' + escUsrHtml(String(users2)) + '</span> ' + escUsrHtml(L.usrStatRegular) +
                ' &nbsp;|&nbsp; \u{1F4F1} <span>' + escUsrHtml(String(tgCount)) + '</span> Telegram' +
                ' &nbsp;|&nbsp; \u{1F6AB} <span>' + escUsrHtml(String(bannedCount)) + '</span> ' + escUsrHtml(L.usrStatBanned) +
                ' &nbsp;|&nbsp; \u{1F5D1}\uFE0F <span>' + escUsrHtml(String(usrDeletedPeriodCount)) + '</span> ' + escUsrHtml(L.usrStatDeleted),
            колонки: ['\u2116', L.thUser, L.thEmail, L.thRole, L.usrThMembership,
                      '\u{1F3BE}', 'TG', L.thDate],
            строки: tableRows,
            подвалСлева: L.usrTotalCount + ': ' + total + ' ' + L.usrPdfUsers,
            подвалСправа: L.usrPdfDate + ': ' + reportDate
        });
    }

    function fmtUsrDate(dateStr) {
        if (!dateStr) return '—';
        var parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    }

    /* ЭКРАНИРОВАНИЕ ДЛЯ АТРИБУТА, А НЕ ТОЛЬКО ДЛЯ ТЕКСТА: одинарная
       кавычка тоже. Иначе безопасность держится на соглашении «атрибут
       пишется в двойных кавычках», которого никто не сторожит. Эталон
       взят дословно у `js/kslt-lenta.js`. */
    /* ЭКРАНИРОВАНИЕ — ДОМ (кусок 146): имя `escUsrHtml` правило куска 141
       не отбирало. */
    function escUsrHtml(str) {
        return window.KSLT_экранировать(str);
    }

    // ---- Excel Export ----
    function exportUsrExcel() {
        var items = usrAllItems;
        var memMap = usrMemMap;
        var today = KSLT_VREMYA.сегодня();

        var headers = ['№', L.thUser, L.thEmail, L.thRole, 'Членство', 'Игрок', 'Telegram', L.thDate];
        var rows = items.map(function(u, i) {
            var roleLabel = L['role' + u.role.charAt(0).toUpperCase() + u.role.slice(1)] || u.role;
            var mem = memMap[u.id];
            var memLabel = (mem && mem.status === 'active') ? L.usrActive : (mem && mem.status === 'expired') ? L.usrExpired : L.usrNone;
            var playerBadge = u.player_id ? '✓' : '—';
            var tgBadge = u.telegram_chat_id ? '✓' : '—';
            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';
            return [i + 1, u.full_name || '—', u.email || '—', roleLabel, memLabel, playerBadge, tgBadge, regDate];
        });

        A.exportCsv('kslt-users-' + today + '.csv', headers, rows);
    }

    // ---- Export to namespace ----
    /**
     * Заявки на привязку карточки игрока. Показываем только открытые: решённые
     * уходят из списка сразу, чтобы он не превращался в архив.
     */
    async function нарисоватьЗаявкиНаКарточку() {
        var box = document.getElementById('adUsrLinkRequests');
        if (!box || !A.client) return;

        var res = await A.client.from('player_link_requests')
            .select('id, profile_id, player_id, created_at')
            .eq('status', 'pending')
            .order('created_at', { ascending: true });

        var заявки = res.data || [];
        if (!заявки.length) { box.innerHTML = ''; return; }

        var профили = {}, карточки = {};
        var pr = await A.client.from('profiles').select('id, full_name, email, phone, role')
            .in('id', заявки.map(function(z) { return z.profile_id; }));
        (pr.data || []).forEach(function(p) { профили[p.id] = p; });
        var pl = await A.client.from('players').select('id, name, category_id, ntrp_singles')
            .in('id', заявки.map(function(z) { return z.player_id; }));
        (pl.data || []).forEach(function(p) { карточки[p.id] = p; });

        var строки = заявки.map(function(z) {
            var ч = профили[z.profile_id] || {};
            var к = карточки[z.player_id] || {};
            var ntrp = к.ntrp_singles ? ' · NTRP ' + к.ntrp_singles : '';
            return '<tr>' +
                '<td>' + A.esc(ч.full_name || '—') + '<div class="ad-podpis">' +
                    A.esc(ч.email || '') + (ч.phone ? ' · ' + A.esc(ч.phone) : '') + '</div></td>' +
                '<td>' + A.esc(к.name || z.player_id) +
                    '<div class="ad-podpis">' + A.esc((к.category_id || '') + ntrp) + '</div></td>' +
                '<td style="font-size:var(--fs-xs);color:var(--text-secondary);white-space:nowrap;">' +
                    new Date(z.created_at).toLocaleDateString('ru-RU') + '</td>' +
                '<td style="text-align:right;white-space:nowrap;">' +
                    /* ЗАЯВКА ОТ СОТРУДНИКА НЕ ОДОБРЯЕТСЯ — кусок 143. Подать
                       её из кабинета он больше не может (кусок 142 убрал
                       предложение), но заявка могла остаться с прежних дней,
                       и одобрить её было нечем остановить. Причина названа
                       на месте кнопки, а не спрятана в отказе. */
                    (A.сотрудник(ч.role)
                        ? '<span class="ad-podpis">' + A.esc(L.linkStaffNo) + '</span> '
                        : '<button class="ad-btn ad-btn-primary ad-btn-sm ad-link-yes" data-id="' + z.id + '">' + L.linkApprove + '</button> ') +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm ad-link-no" data-id="' + z.id + '">' + L.linkReject + '</button>' +
                '</td>' +
            '</tr>';
        }).join('');

        box.innerHTML =
            '<div class="ad-table-card" style="border-color:var(--warning-border);">' +
                '<div class="ad-table-card-header">' +
                    // Строка должна бросаться в глаза: это единственное здесь,
                    // что требует решения человека
                    '<div class="ad-table-card-title" style="color:var(--warning);">\u26A0 ' +
                        L.linkRequests + ' — ' + заявки.length + '</div>' +
                '</div>' +
                '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                    '<th>' + L.thUser + '</th><th>' + L.linkCard + '</th><th>' + L.thDate + '</th><th></th>' +
                '</tr></thead><tbody>' + строки + '</tbody></table></div>' +
            '</div>';

        box.querySelectorAll('.ad-link-yes, .ad-link-no').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var одобрить = btn.classList.contains('ad-link-yes');
                btn.disabled = true;
                var r = await A.client.rpc('решить_привязку', { p_request_id: btn.dataset.id, p_approve: одобрить });
                var д = r.data || {};
                if (д.error === 'already_decided') {
                    // Игрок успел передумать и выбрать другую карточку: та
                    // заявка закрыта, и решать надо уже по новой
                    A.showToast(L.linkStale, 'warning');
                    нарисоватьЗаявкиНаКарточку();
                    return;
                }
                if (д.error) { A.showToast(д.error, 'error'); btn.disabled = false; return; }
                A.showToast(одобрить ? L.linkApproved : L.linkRejected, 'success');
                нарисоватьЗаявкиНаКарточку();
                renderUsersList();
            });
        });
    }

    function подключитьИсторию(box) {
        var btn = box.querySelector('#adLinkHistoryBtn');
        if (!btn) return;
        btn.addEventListener('click', async function() {
            var окно = box.querySelector('#adLinkHistory');
            if (окно.style.display !== 'none') { окно.style.display = 'none'; return; }
            окно.style.display = '';
            окно.innerHTML = '<div style="padding:10px;color:var(--text-muted);">…</div>';

            var res = await A.client.from('player_link_requests')
                .select('id, profile_id, player_id, status, note, created_at, decided_at')
                .neq('status', 'pending')
                .order('decided_at', { ascending: false })
                .limit(30);
            var строки = res.data || [];
            if (!строки.length) {
                окно.innerHTML = '<div style="padding:10px;color:var(--text-muted);">' + L.linkHistoryEmpty + '</div>';
                return;
            }

            var профили = {}, карточки = {};
            var pr = await A.client.from('profiles').select('id, full_name, email')
                .in('id', строки.map(function(z) { return z.profile_id; }));
            (pr.data || []).forEach(function(p) { профили[p.id] = p; });
            var pl = await A.client.from('players').select('id, name')
                .in('id', строки.map(function(z) { return z.player_id; }));
            (pl.data || []).forEach(function(p) { карточки[p.id] = p; });

            var подпись = {
                approved: { текст: L.linkStApproved, цвет: 'var(--success)' },
                rejected: { текст: L.linkStRejected, цвет: 'var(--danger)' },
                withdrawn: { текст: L.linkStWithdrawn, цвет: 'var(--text-muted)' }
            };

            окно.innerHTML = '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.thUser + '</th><th>' + L.linkCard + '</th><th>' + L.thStatus + '</th><th>' + L.thDate + '</th>' +
            '</tr></thead><tbody>' + строки.map(function(z) {
                var ч = профили[z.profile_id] || {};
                var к = карточки[z.player_id] || {};
                var п = подпись[z.status] || { текст: z.status, цвет: 'var(--text-secondary)' };
                var когда = z.decided_at || z.created_at;
                return '<tr>' +
                    '<td>' + A.esc(ч.full_name || '—') +
                        '<div class="ad-podpis">' + A.esc(ч.email || '') + '</div></td>' +
                    '<td>' + A.esc(к.name || z.player_id) + '</td>' +
                    '<td style="color:' + п.цвет + ';font-weight:600;">' + п.текст +
                        (z.note ? '<div style="font-size:var(--fs-xs);color:var(--text-muted);font-weight:400;">' + A.esc(z.note) + '</div>' : '') + '</td>' +
                    '<td style="font-size:var(--fs-xs);color:var(--text-secondary);white-space:nowrap;">' +
                        (когда ? new Date(когда).toLocaleDateString('ru-RU') : '—') + '</td>' +
                '</tr>';
            }).join('') + '</tbody></table></div></div>';
        });
    }

    A.renderUsersSection = renderUsersSection;
    A.renderUsersList = renderUsersList;
    A.loadAndEditUser = loadAndEditUser;

})();
