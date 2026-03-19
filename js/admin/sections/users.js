// ============================================
// KSLT Admin — Users Management
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var usrSearchQuery = '';
    var usrFilterRole = '';
    var usrPeriodMode = '', usrDateFrom = '', usrDateTo = '';
    var usrAllItems = [], usrMemMap = {};
    var usrDeletedCount = 0, usrDeletedPeriodCount = 0;
    var usrChartInstance = null;
    var usrSortByMembership = 0; // 0=none, 1=asc (expiring soon first), -1=desc
    var usrHidePlayers = true; // hide users who became players by default

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

        var curMonthName = isEn
            ? ['January','February','March','April','May','June','July','August','September','October','November','December'][new Date().getMonth()]
            : ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'][new Date().getMonth()];

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
                    '<div class="ad-usr-card-icon" style="background:rgba(204,255,0,0.12);color:#ccff00;">👥</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatTotal + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatPlayers">' +
                    '<div class="ad-usr-card-icon" style="background:rgba(52,199,89,0.12);color:#34c759;">🎾</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatPlayers + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatConversion">' +
                    '<div class="ad-usr-card-icon" style="background:rgba(255,214,0,0.12);color:#ffd600;">📊</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + L.usrStatConversion + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card" id="adUsrStatNewMonth">' +
                    '<div class="ad-usr-card-icon" style="background:rgba(0,136,204,0.12);color:#0088cc;">📈</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">...</div><div class="ad-usr-card-label">' + (isEn ? 'New' : 'Новых') + ' (' + curMonthName + ')</div></div>' +
                '</div>' +
            '</div>' +

            // Stats cards — detail row (4)
            '<div class="ad-usr-cards" id="adUsrBreakdown">' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatMembers">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:rgba(52,199,89,0.10);color:#34c759;">🏅</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">0</div><div class="ad-usr-card-label">' + L.usrStatMembers + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatTg">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:rgba(0,136,204,0.10);color:#0088cc;">✈️</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value">0</div><div class="ad-usr-card-label">' + L.usrStatTelegram + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrBrkDeletedCard">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:rgba(255,59,48,0.10);color:#ff3b30;">🗑️</div>' +
                    '<div class="ad-usr-card-body"><div class="ad-usr-card-value" id="adUsrBrkDeleted">0</div><div class="ad-usr-card-label">' + L.usrStatDeleted + '</div></div>' +
                '</div>' +
                '<div class="ad-usr-card ad-usr-card--sm" id="adUsrStatBanned">' +
                    '<div class="ad-usr-card-icon ad-usr-card-icon--sm" style="background:rgba(255,59,48,0.10);color:#ff3b30;">🚫</div>' +
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
            '</div>' +

            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adUsrSearch" placeholder="' + L.usrSearch + '" value="' + A.esc(usrSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adUsrRoleFilter">' + roleFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-sm' + (usrHidePlayers ? ' ad-btn-primary' : ' ad-btn-outline') + '" id="adUsrTogglePlayers" style="white-space:nowrap;">' + (usrHidePlayers ? L.usrHidePlayers : L.usrShowAll) + '</button>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adUsrTable">' +
                        '<thead><tr>' +
                            '<th>' + L.thUser + '</th>' +
                            '<th>' + L.thEmail + '</th>' +
                            '<th>' + L.thRole + '</th>' +
                            '<th>' + L.usrThStatus + '</th>' +
                            '<th style="cursor:pointer;user-select:none;" id="adUsrSortMem">' + L.usrThMembership + ' <span style="opacity:0.4;">⇅</span></th>' +
                            '<th>' + L.thDate + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

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

        // Toggle: show all vs hide players
        document.getElementById('adUsrTogglePlayers').addEventListener('click', function() {
            usrHidePlayers = !usrHidePlayers;
            this.textContent = usrHidePlayers ? L.usrHidePlayers : L.usrShowAll;
            this.className = 'ad-btn ad-btn-sm ' + (usrHidePlayers ? 'ad-btn-primary' : 'ad-btn-outline');
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

        // Filter out users who became players (if toggle is on)
        if (usrHidePlayers) {
            items = items.filter(function(u) { return !u.player_id; });
        }

        // Client-side search
        if (usrSearchQuery) {
            var q = usrSearchQuery.toLowerCase();
            items = items.filter(function(u) {
                var name = (u.full_name || '').toLowerCase();
                var email = (u.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        // Sort by membership expiry if toggled
        if (usrSortByMembership !== 0) {
            items.sort(function(a, b) {
                var ma = memMap[a.id], mb = memMap[b.id];
                var da = ma && ma.expires_at ? ma.expires_at : '';
                var db = mb && mb.expires_at ? mb.expires_at : '';
                if (!da && !db) return 0;
                if (!da) return 1;
                if (!db) return -1;
                return usrSortByMembership === 1 ? (da < db ? -1 : da > db ? 1 : 0) : (da > db ? -1 : da < db ? 1 : 0);
            });
        }

        var table = document.getElementById('adUsrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="6" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">👥</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.usrNoUsers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.usrNoUsersText + '</div>' +
                '</td></tr>';
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
                : '<div style="width:32px;height:32px;border-radius:50%;background:rgba(204,255,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:0.75rem;font-weight:600;">' + initials + '</div>';

            // Role badge
            var roleLabel = L['role' + u.role.charAt(0).toUpperCase() + u.role.slice(1)] || u.role;
            var roleBg = u.role === 'admin' ? 'rgba(255,59,48,0.15)' : u.role === 'manager' ? 'rgba(204,255,0,0.15)' : 'rgba(255,255,255,0.08)';
            var roleColor = u.role === 'admin' ? '#ff3b30' : u.role === 'manager' ? 'var(--accent)' : 'var(--text-secondary)';
            var roleBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;background:' + roleBg + ';color:' + roleColor + ';">' + roleLabel + '</span>';

            // Membership badge with expiry date
            var mem = memMap[u.id];
            var memBadge;
            if (mem && mem.status === 'active') {
                var expDate = mem.expires_at ? mem.expires_at.split('T')[0].split('-') : null;
                var expFormatted = expDate ? expDate[2] + '.' + expDate[1] + '.' + expDate[0] : '';
                memBadge = '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + (expFormatted ? ' ' + (isEn ? 'until' : 'до') + ' ' + expFormatted : '') + '</span>';
            } else if (mem && mem.status === 'expired') {
                var expDate2 = mem.expires_at ? mem.expires_at.split('T')[0].split('-') : null;
                var expFormatted2 = expDate2 ? expDate2[2] + '.' + expDate2[1] + '.' + expDate2[0] : '';
                memBadge = '<span class="ad-mem-badge ad-mem-expired">' + L.usrExpired + (expFormatted2 ? ' ' + expFormatted2 : '') + '</span>';
            } else {
                memBadge = '<span style="color:var(--text-dim);font-size:0.8rem;">' + L.usrNone + '</span>';
            }

            // Ban status badge
            var isBanned = u.banned_until && new Date(u.banned_until) > new Date();
            var banBadge;
            if (isBanned) {
                var isPermanent = new Date(u.banned_until).getFullYear() >= 2099;
                var banLabel = isPermanent
                    ? L.usrBannedForever
                    : L.usrBannedUntil + ' ' + u.banned_until.split('T')[0];
                banBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;">' + banLabel + '</span>';
            } else {
                banBadge = '<span style="display:inline-block;padding:2px 8px;border-radius:4px;font-size:0.75rem;font-weight:600;background:rgba(52,199,89,0.15);color:#34c759;">' + L.usrStatusActive + '</span>';
            }

            // Online indicator
            var isOnline = u.last_seen && (now - new Date(u.last_seen).getTime()) < 5 * 60 * 1000;
            var onlineDot = isOnline ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34c759;margin-left:6px;" title="' + L.usrOnline + '"></span>' : '';

            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';

            var canClick = isAdm || A.currentRole === 'manager';
            var tr = document.createElement('tr');
            if (canClick) tr.style.cursor = 'pointer';
            tr.innerHTML =
                '<td><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml + '<span>' + (name || email) + onlineDot + '</span>' + (u.player_id ? '<span style="display:inline-block;margin-left:6px;padding:1px 6px;border-radius:4px;font-size:0.7rem;font-weight:600;background:rgba(204,255,0,0.12);color:var(--accent);" title="Player ID: ' + A.esc(u.player_id) + '">&#127934;</span>' : '') + '</div></td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + email + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + banBadge + '</td>' +
                '<td>' + memBadge + '</td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + regDate + '</td>';

            if (canClick) {
                tr.addEventListener('click', function() {
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

    async function loadAndEditUser(id) {
        if (!A.client) return;

        var userRes = await A.client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at, banned_until, ban_reason, player_id, gender')
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

        A.setAdminHash('users', 'edit', id);
        renderUserForm(user, membership);
    }

    async function renderUserForm(user, membership) {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var isAdm = A.currentRole === 'admin';
        var canManageMembership = (A.currentRole === 'admin' || A.currentRole === 'manager');

        var roleLabel = L['role' + user.role.charAt(0).toUpperCase() + user.role.slice(1)] || user.role;
        var tgStatus = user.telegram_chat_id ? L.usrTgConnected : L.usrTgNotConnected;
        var tgColor = user.telegram_chat_id ? '#34c759' : 'var(--text-dim)';
        var lastSeen = user.last_seen ? user.last_seen.split('T')[0] + ' ' + user.last_seen.split('T')[1].substring(0, 5) : '—';
        var regDate = user.created_at ? user.created_at.split('T')[0] : '—';

        var initials = (user.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
        var avatarHtml = user.avatar_url
            ? '<img src="' + A.esc(user.avatar_url) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:64px;height:64px;border-radius:50%;background:rgba(204,255,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;">' + initials + '</div>';

        // Membership section (info only — management through Finances)
        var memHtml = '';
        if (canManageMembership) {
            if (membership && membership.status === 'active') {
                var expDate = membership.expires_at ? membership.expires_at.split('T')[0] : '—';
                var daysLeft = '';
                if (membership.expires_at) {
                    var today = new Date(); today.setHours(0,0,0,0);
                    var exp = new Date(membership.expires_at); exp.setHours(0,0,0,0);
                    var diff = Math.ceil((exp - today) / 86400000);
                    daysLeft = diff > 0 ? ' (' + diff + ' ' + (isEn ? 'days left' : 'дн.') + ')' : '';
                }
                memHtml =
                    '<div style="display:flex;align-items:center;gap:8px;">' +
                        '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>' +
                        '<span style="color:var(--text-secondary);font-size:0.85rem;">' + (isEn ? 'until ' : 'до ') + expDate + daysLeft + '</span>' +
                    '</div>';
            } else {
                memHtml =
                    '<div style="color:var(--text-dim);">' + L.usrNoMembership + '</div>';
            }
            memHtml += '<div style="margin-top:8px;">' +
                '<a href="#finances" style="color:var(--accent);font-size:0.85rem;text-decoration:none;" onclick="window.KSLT_ADMIN.switchTab(\'finances\');return false;">→ ' + (isEn ? 'Manage in Finances' : 'Управление в Финансах') + '</a>' +
            '</div>';
        }

        // Player category section
        var playerCatHtml = '';
        if (canManageMembership) {
            await A.loadCategories();
            var catGender = userGenderToCategory(user.gender);

            if (user.player_id) {
                // Has player — show current category + change dropdown
                var plRes = await A.client.from('players').select('category_id').eq('id', user.player_id).single();
                if (plRes.data) {
                    var selCatOpts = buildCatOptions(catGender, plRes.data.category_id);

                    playerCatHtml =
                        '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrPlayerCategory + '</h3>' +
                        '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
                            '<select class="ad-field-input" id="adUsrPlayerCat" style="width:auto;padding:4px 8px;font-size:0.85rem;">' + selCatOpts + '</select>' +
                            '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrChangeCat">' + L.usrChangeCategory + '</button>' +
                        '</div>';
                }
            } else {
                // No player — show "Create player card" button with category picker
                var newCatOpts = buildCatOptions(catGender, null);
                playerCatHtml =
                    '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrPlayerCategory + '</h3>' +
                    '<div style="color:var(--text-dim);margin-bottom:8px;font-size:0.85rem;">' + L.usrCategoryHint + '</div>' +
                    '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">' +
                        '<select class="ad-field-input" id="adUsrNewPlayerCat" style="width:auto;padding:4px 8px;font-size:0.85rem;">' + newCatOpts + '</select>' +
                        '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrCreatePlayer">' + (isEn ? 'Create Player Card' : 'Создать карточку игрока') + '</button>' +
                    '</div>';
            }
        }

        // Moderation section (ban/unban) — admin or manager (manager only for role=user)
        var isSelf = user.id === A.currentUserId;
        var isUserBanned = user.banned_until && new Date(user.banned_until) > new Date();
        var moderationHtml = '';
        var canModerate = isAdm ? (!isSelf && user.role !== 'admin') : (A.currentRole === 'manager' && !isSelf && user.role === 'user');
        if (canModerate) {
            if (isUserBanned) {
                var isPerm = new Date(user.banned_until).getFullYear() >= 2099;
                var banDateStr = isPerm ? L.usrBannedForever : (L.usrBannedUntil + ' ' + user.banned_until.split('T')[0]);
                var banReasonStr = user.ban_reason ? '<div style="color:var(--text-dim);font-size:0.8rem;margin-top:4px;">' + A.esc(user.ban_reason) + '</div>' : '';
                moderationHtml =
                    '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                        '<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:0.8rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;">' + L.usrBanned + ': ' + banDateStr + '</span>' +
                    '</div>' +
                    banReasonStr +
                    '<button class="ad-btn ad-btn-sm" id="adUsrUnban" style="margin-top:8px;background:rgba(52,199,89,0.15);color:#34c759;border:1px solid rgba(52,199,89,0.3);">' + L.usrUnbanUser + '</button>';
            } else {
                moderationHtml =
                    '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrBan">' + L.usrBanUser + '</button>';
            }
        }

        // Role actions — admin, or manager (delete user only)
        var roleActionsHtml = '';
        if (isAdm) {
            if (isSelf) {
                roleActionsHtml = '<div style="color:var(--text-dim);font-size:0.85rem;font-style:italic;">' + L.usrCannotDeleteSelf + '</div>';
            } else if (user.role === 'manager') {
                roleActionsHtml =
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrRemoveManager">' + L.usrRemoveManager + '</button>' +
                    '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>';
            } else if (user.role === 'user') {
                roleActionsHtml =
                    '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrMakeManager">' + L.usrMakeManager + '</button>' +
                    '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>';
            }
        } else if (A.currentRole === 'manager' && !isSelf && user.role === 'user') {
            roleActionsHtml =
                '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrDelete">' + L.usrDeleteUser + '</button>';
        }

        // Profile readonly for manager
        var profileReadonly = !isAdm ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '';

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
                        '<div style="font-size:1.1rem;font-weight:600;color:var(--text-primary);">' + A.esc(user.full_name || user.email) + '</div>' +
                        '<div style="color:var(--text-dim);font-size:0.85rem;">' + A.esc(user.email || '') + '</div>' +
                        '<div style="display:flex;gap:8px;margin-top:4px;">' +
                            '<span style="color:' + tgColor + ';font-size:0.8rem;">TG: ' + tgStatus + '</span>' +
                            '<span style="color:var(--text-dim);font-size:0.8rem;">' + L.usrLastSeen + ': ' + lastSeen + '</span>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Profile form
                '<h3 style="font-size:0.9rem;color:var(--accent);margin-bottom:12px;font-weight:600;">' + L.usrProfile + '</h3>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrFullName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrName" value="' + A.esc(user.full_name || '') + '"' + profileReadonly + '>' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrPhone" value="' + A.esc(user.phone || '') + '"' + profileReadonly + '>' +
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
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adUsrSave" style="margin-top:8px;">' + L.save + '</button>' : '') +
                // Membership
                (canManageMembership ? '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrMembership + '</h3>' + memHtml : '') +
                // Player category
                playerCatHtml +
                // Moderation (admin or manager for regular users)
                (moderationHtml ? '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrModeration + '</h3>' + moderationHtml : '') +
                // Actions (admin, or manager for regular users)
                (roleActionsHtml ? '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrActions + '</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' + roleActionsHtml + '</div>' : '') +
            '</div>';

        // Event listeners
        document.getElementById('adUsrBack').addEventListener('click', function() {
            A.setAdminHash('users');
            renderUsersList();
        });

        var saveBtn = document.getElementById('adUsrSave');
        if (saveBtn) {
            saveBtn.addEventListener('click', function() {
                saveUserHandler(user.id);
            });
        }

        // Change player category
        var changeCatBtn = document.getElementById('adUsrChangeCat');
        if (changeCatBtn) {
            changeCatBtn.addEventListener('click', function() {
                var newCat = document.getElementById('adUsrPlayerCat').value;
                changePlayerCategory(user.player_id, newCat, user.id);
            });
        }

        // Create player card (when player_id is null)
        var createPlayerBtn = document.getElementById('adUsrCreatePlayer');
        if (createPlayerBtn) {
            createPlayerBtn.addEventListener('click', async function() {
                var catId = document.getElementById('adUsrNewPlayerCat').value;
                if (!catId) return;
                createPlayerBtn.disabled = true;
                createPlayerBtn.textContent = L.saving;
                await autoCreatePlayer(user, catId);
                loadAndEditUser(user.id);
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

    async function saveUserHandler(userId) {
        var nameEl = document.getElementById('adUsrName');
        var phoneEl = document.getElementById('adUsrPhone');
        if (!nameEl) return;

        var btn = document.getElementById('adUsrSave');
        if (btn) { btn.textContent = L.saving; btn.disabled = true; }

        var result = await A.client.from('profiles').update({
            full_name: nameEl.value.trim(),
            phone: phoneEl.value.trim() || null
        }).eq('id', userId);

        if (btn) { btn.disabled = false; btn.textContent = L.save; }

        if (result.error) {
            A.showToast(result.error.message, 'error');
        } else {
            A.showToast(L.usrUserSaved, 'success');
        }
    }

    function userGenderToCategory(userGender) {
        // profiles.gender: 'male'/'female' → categories.gender: 'men'/'women'
        if (userGender === 'female') return 'women';
        if (userGender === 'male') return 'men';
        return null; // no filter
    }

    function buildCatOptions(filterGender, selectedId) {
        var opts = '';
        A.cachedCategories.forEach(function(c) {
            if (filterGender && c.gender && c.gender !== filterGender) return;
            var sel = (selectedId && c.id === selectedId) ? ' selected' : '';
            var gIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            opts += '<option value="' + c.id + '"' + sel + '>' + gIcon + (isEn ? c.name_en : c.name) + '</option>';
        });
        return opts;
    }

    async function openGiveMembershipModal(user) {
        await A.loadCategories();

        var catGender = userGenderToCategory(user.gender);
        var catOpts = buildCatOptions(catGender, null);

        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal" style="max-width:440px;">' +
                '<div class="ad-confirm-title">' + L.usrGiveMembershipTitle + '</div>' +
                (user.player_id ? '' :
                    '<div style="margin-bottom:16px;">' +
                        '<label class="ad-field-label">' + L.usrSelectCategory + '</label>' +
                        '<select class="ad-field-input" id="adMemCategory">' + catOpts + '</select>' +
                        '<div style="color:var(--text-dim);font-size:0.8rem;margin-top:4px;">' + L.usrCategoryHint + '</div>' +
                    '</div>'
                ) +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.usrMembershipPeriod + '</label>' +
                    '<select class="ad-field-input" id="adUsrMemPeriod">' +
                        '<option value="1">' + L.usrMonths1 + '</option>' +
                        '<option value="3">' + L.usrMonths3 + '</option>' +
                        '<option value="6">' + L.usrMonths6 + '</option>' +
                        '<option value="12">' + L.usrMonths12 + '</option>' +
                    '</select>' +
                '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adMemCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-primary" id="adMemSubmit">' + L.usrGiveMembership + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('adMemCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('adMemSubmit').addEventListener('click', async function() {
            var btn = document.getElementById('adMemSubmit');
            btn.textContent = L.saving;
            btn.disabled = true;

            var months = parseInt(document.getElementById('adUsrMemPeriod').value, 10) || 1;
            var categoryId = null;
            var catEl = document.getElementById('adMemCategory');
            if (catEl) categoryId = catEl.value;

            try {
                await giveMembership(user, months, categoryId);
                overlay.remove();
            } catch (err) {
                A.showToast('Error: ' + err.message, 'error');
                btn.textContent = L.usrGiveMembership;
                btn.disabled = false;
            }
        });
    }

    async function giveMembership(user, months, categoryId) {
        var now = new Date();
        var end = new Date(now);
        end.setMonth(end.getMonth() + months);

        var result = await A.client.from('memberships').insert({
            profile_id: user.id,
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: end.toISOString(),
            note: isEn ? 'Admin: free membership' : 'Админ: бесплатное членство'
        });

        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }

        A.showToast(L.usrMembershipGiven, 'success');

        // TG notification (fire and forget)
        notifyMembershipTg('granted', user.id, end.toISOString());

        // Auto-create player if no player_id
        if (!user.player_id && categoryId) {
            await autoCreatePlayer(user, categoryId);
        }

        loadAndEditUser(user.id);
    }

    async function autoCreatePlayer(user, categoryId) {
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

        var insertRes = await A.client.from('players').insert({
            id: finalId,
            name: name,
            category_id: categoryId,
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

    async function changePlayerCategory(playerId, newCategoryId, profileId) {
        var result = await A.client.from('players').update({ category_id: newCategoryId }).eq('id', playerId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
        } else {
            A.showToast(L.usrCategorySaved, 'success');
        }
    }

    async function extendMembership(memId, months) {
        // Get current expiry
        var res = await A.client.from('memberships').select('expires_at, profile_id').eq('id', memId).single();
        if (res.error || !res.data) { A.showToast('Error', 'error'); return; }

        var expiry = new Date(res.data.expires_at);
        if (expiry < new Date()) expiry = new Date();
        expiry.setMonth(expiry.getMonth() + months);

        var result = await A.client.from('memberships').update({
            expires_at: expiry.toISOString(),
            status: 'active'
        }).eq('id', memId);

        if (result.error) {
            A.showToast(result.error.message, 'error');
        } else {
            A.showToast(L.usrMembershipExtended, 'success');

            // TG notification (fire and forget)
            if (res.data.profile_id) {
                notifyMembershipTg('extended', res.data.profile_id, expiry.toISOString());
            }

            // Reload current user
            var profileRes = await A.client.from('memberships').select('profile_id').eq('id', memId).single();
            if (profileRes.data) loadAndEditUser(profileRes.data.profile_id);
        }
    }

    async function cancelMembership(memId, profileId) {
        A.showConfirm(L.usrCancelMembership, L.deleteConfirmText, async function() {
            var result = await A.client.from('memberships').update({
                status: 'cancelled'
            }).eq('id', memId);

            if (result.error) {
                A.showToast(result.error.message, 'error');
            } else {
                A.showToast(L.usrMembershipCancelled, 'success');

                // TG notification (fire and forget)
                notifyMembershipTg('cancelled', profileId);

                loadAndEditUser(profileId);
            }
        }, L.usrCancelMembership);
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
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
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
                    '<textarea class="ad-field-input" id="adBanReason" rows="2" style="resize:vertical;"></textarea>' +
                '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adBanCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-danger" id="adBanSubmit">' + L.usrBanUser + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

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
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
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
                '<div style="color:var(--text-dim);font-size:0.8rem;margin-bottom:16px;">' + L.usrAddManagerHint + '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adMgrCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-primary" id="adMgrSubmit">' + L.usrAddManager + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

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
                        borderColor: 'rgba(76, 175, 80, 1)',
                        backgroundColor: 'rgba(76, 175, 80, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(76, 175, 80, 1)',
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartPlayers,
                        data: plrData,
                        borderColor: 'rgba(255, 214, 0, 1)',
                        backgroundColor: 'rgba(255, 214, 0, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(255, 214, 0, 1)',
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartDeleted,
                        data: delData,
                        borderColor: 'rgba(244, 67, 54, 1)',
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(244, 67, 54, 1)',
                        tension: 0.3,
                        fill: false
                    },
                    {
                        label: L.usrChartNet,
                        data: netData,
                        borderColor: 'rgba(204, 255, 0, 0.9)',
                        backgroundColor: 'rgba(204, 255, 0, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointBackgroundColor: 'rgba(204, 255, 0, 1)',
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
                            color: 'rgba(255,255,255,0.7)',
                            font: { size: 11 },
                            boxWidth: 12,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20,24,36,0.95)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            title: function(items) {
                                return items[0].label + ' ' + (isEn
                                    ? ['January','February','March','April','May','June','July','August','September','October','November','December'][month]
                                    : ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'][month]);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } },
                        title: {
                            display: true,
                            text: isEn ? 'Day' : 'День',
                            color: 'rgba(255,255,255,0.4)',
                            font: { size: 10 }
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
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

        var reportDate = fmtUsrDate(now.toISOString().slice(0, 10));

        var win = window.open('', '_blank');
        if (!win) return;

        var htmlContent =
            '<!DOCTYPE html><html><head>' +
            '<meta charset="UTF-8">' +
            '<title>' + L.usrPdfTitle + '</title>' +
            '<style>' +
                '* { margin: 0; padding: 0; box-sizing: border-box; }' +
                'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1a1a1a; font-size: 12px; }' +
                '.report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #333; }' +
                '.report-header h1 { font-size: 20px; margin-bottom: 4px; }' +
                '.report-header .period { font-size: 13px; color: #666; }' +
                '.stats-grid { display: flex; gap: 16px; margin-bottom: 16px; flex-wrap: wrap; }' +
                '.stat-box { flex: 1; min-width: 100px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }' +
                '.stat-box .val { font-size: 20px; font-weight: 700; }' +
                '.stat-box .lbl { font-size: 11px; color: #666; margin-top: 2px; }' +
                '.breakdown { display: flex; gap: 20px; margin-bottom: 24px; font-size: 12px; color: #555; flex-wrap: wrap; }' +
                '.breakdown span { font-weight: 600; color: #1a1a1a; }' +
                'table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }' +
                'th { background: #f5f5f5; padding: 8px 6px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 11px; }' +
                'td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; }' +
                'tr:nth-child(even) { background: #fafafa; }' +
                '.report-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; color: #888; }' +
                '@media print { body { padding: 15px; } }' +
            '</style>' +
            '</head><body>' +
            '<div class="report-header">' +
                '<h1>' + escUsrHtml(L.usrPdfTitle) + '</h1>' +
                '<div class="period">' + L.usrPeriod + ': ' + escUsrHtml(periodLabel) + '</div>' +
            '</div>' +
            '<div class="stats-grid">' +
                '<div class="stat-box"><div class="val">' + total + '</div><div class="lbl">' + L.usrStatTotal + '</div></div>' +
                '<div class="stat-box"><div class="val">' + activeMembers + '</div><div class="lbl">' + L.usrStatMembers + '</div></div>' +
                '<div class="stat-box"><div class="val">' + linkedPlayers + '</div><div class="lbl">' + L.usrStatPlayers + '</div></div>' +
            '</div>' +
            '<div class="breakdown">' +
                '🛡️ <span>' + admins + '</span> ' + L.usrStatAdmins +
                ' · <span>' + managers2 + '</span> ' + L.usrStatManagers +
                ' · <span>' + users2 + '</span> ' + L.usrStatRegular +
                ' &nbsp;|&nbsp; 📱 <span>' + tgCount + '</span> Telegram' +
                ' &nbsp;|&nbsp; 🚫 <span>' + bannedCount + '</span> ' + L.usrStatBanned +
                ' &nbsp;|&nbsp; 🗑️ <span>' + usrDeletedPeriodCount + '</span> ' + L.usrStatDeleted +
            '</div>' +
            '<table>' +
                '<thead><tr>' +
                    '<th>№</th>' +
                    '<th>' + L.thUser + '</th>' +
                    '<th>' + L.thEmail + '</th>' +
                    '<th>' + L.thRole + '</th>' +
                    '<th>' + L.usrThMembership + '</th>' +
                    '<th>🎾</th>' +
                    '<th>TG</th>' +
                    '<th>' + L.thDate + '</th>' +
                '</tr></thead>' +
                '<tbody>' + tableRows + '</tbody>' +
            '</table>' +
            '<div class="report-footer">' +
                '<span>' + L.usrTotalCount + ': ' + total + ' ' + L.usrPdfUsers + '</span>' +
                '<span>' + L.usrPdfDate + ': ' + reportDate + '</span>' +
            '</div>' +
            '<script>window.onload=function(){window.print();}<\/script>' +
            '</body></html>';

        win.document.write(htmlContent);
        win.document.close();
    }

    function fmtUsrDate(dateStr) {
        if (!dateStr) return '—';
        var parts = dateStr.split('-');
        if (parts.length !== 3) return dateStr;
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    }

    function escUsrHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Excel Export ----
    function exportUsrExcel() {
        var items = usrAllItems;
        var memMap = usrMemMap;
        var today = new Date().toISOString().slice(0, 10);

        var headers = ['№', L.thUser, L.thEmail, L.thRole, isEn ? 'Membership' : 'Членство', isEn ? 'Player' : 'Игрок', 'Telegram', L.thDate];
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
    A.renderUsersSection = renderUsersSection;
    A.renderUsersList = renderUsersList;
    A.loadAndEditUser = loadAndEditUser;

})();
