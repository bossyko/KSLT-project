// ============================================
// KSLT Admin — Layout (Sidebar, Tabs, Dashboard)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // ---- Render Sidebar ----
    function renderSidebar(profile) {
        var container = document.getElementById('adSidebar');
        if (!container) return;

        var nameParts = (profile.full_name || '').split(' ');
        var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';

        var avatarHtml = profile.avatar_url
            ? '<img src="' + A.esc(profile.avatar_url) + '" class="ad-sidebar-avatar" alt="">'
            : '<div class="ad-sidebar-avatar-placeholder">' + initials + '</div>';

        var roleLabel = L['role' + profile.role.charAt(0).toUpperCase() + profile.role.slice(1)] || profile.role;

        var sections = A.ROLE_SECTIONS[A.currentRole] || A.ROLE_SECTIONS.manager;

        var allItems = [
            { key: 'dashboard', icon: A.ICONS.grid,   label: L.dashboard, badge: false },
            { key: 'content',   icon: A.ICONS.file,   label: L.content,   badge: false },
            { key: 'tournaments', icon: A.ICONS.trophy, label: L.tournaments, badge: false },
            { key: 'challenges', icon: A.ICONS.swords, label: L.challenges, badge: false },
            { key: 'players',   icon: A.ICONS.chart,  label: L.players,   badge: false },
            { key: 'courts',   icon: A.ICONS.location, label: L.courts,  badge: false },
            { key: 'coaches', icon: A.ICONS.coach,    label: L.coaches, badge: false },
            { key: '_divider' },
            { key: 'users',     icon: A.ICONS.users,  label: L.users,     badge: false },
            { key: 'finances', icon: A.ICONS.wallet, label: L.finances, badge: false },
            { key: 'vouchers', icon: A.ICONS.ticket, label: L.vouchers, badge: false },
            { key: 'loyalty', icon: A.ICONS.star, label: L.loyalty, badge: false },
            { key: 'settings', icon: A.ICONS.settings, label: L.settings, badge: false }
        ];

        var navHtml = '';
        allItems.forEach(function(item) {
            if (item.key === '_divider') {
                if (A.currentRole === 'admin') {
                    navHtml += '<li class="ad-sidebar-item"><div class="ad-sidebar-divider"></div></li>';
                }
                return;
            }
            if (sections.indexOf(item.key) === -1) return;
            var isActive = item.key === 'dashboard' ? ' active' : '';
            var badgeHtml = item.badge ? '<span class="ad-sidebar-badge">' + L.soon + '</span>' : '';
            navHtml += '<li class="ad-sidebar-item"><button class="ad-sidebar-link' + isActive + '" data-tab="' + item.key + '">' + item.icon + item.label + badgeHtml + '</button></li>';
        });

        container.innerHTML =
            '<div class="ad-sidebar-user">' +
                avatarHtml +
                '<div class="ad-sidebar-name">' + (profile.full_name || 'Admin') + '</div>' +
                '<div class="ad-sidebar-email">' + (profile.email || '') + '</div>' +
                '<div class="ad-sidebar-role">' + roleLabel + '</div>' +
            '</div>' +
            '<ul class="ad-sidebar-nav">' + navHtml + '</ul>';
    }

    // ---- Render Mobile Tabs ----
    function renderMobileTabs() {
        var container = document.getElementById('adMobileTabs');
        if (!container) return;

        var sections = A.ROLE_SECTIONS[A.currentRole] || A.ROLE_SECTIONS.manager;
        var html = '';
        sections.forEach(function(key) {
            var isActive = key === 'dashboard' ? ' active' : '';
            html += '<button class="ad-mobile-tab' + isActive + '" data-tab="' + key + '">' + (L[key] || key) + '</button>';
        });
        container.innerHTML = html;
    }

    // ---- Init Tabs ----
    function parseHash(hash) {
        // Formats: "tab", "tab/edit/ID", "tab/view/ID", "tab/bracket/ID"
        var m = hash.match(/^(\w+)\/(edit|view|bracket)\/(.+)$/);
        if (m) return { tab: m[1], action: m[2], itemId: m[3] };
        return { tab: hash || 'dashboard', action: null, itemId: null };
    }

    function setAdminHash(tab, action, id) {
        var hash = action && id ? tab + '/' + action + '/' + id : tab;
        history.replaceState(null, '', '#' + hash);
    }

    function isDeepLinked(sectionTab) {
        var parsed = A.parseHash(window.location.hash.replace('#', ''));
        return parsed.itemId && parsed.tab === sectionTab;
    }

    function initTabs() {
        var parsed = A.parseHash(window.location.hash.replace('#', ''));
        switchTab(parsed.tab, parsed.action, parsed.itemId);

        document.addEventListener('click', function(e) {
            var link = e.target.closest('[data-tab]');
            if (!link) return;
            var tab = link.dataset.tab;
            switchTab(tab);
            window.location.hash = tab;
        });

        window.addEventListener('hashchange', function() {
            var parsed = A.parseHash(window.location.hash.replace('#', ''));
            switchTab(parsed.tab, parsed.action, parsed.itemId);
        });
    }

    function switchTab(tab, action, itemId) {
        // Backward compat: redirect old hashes to new tabs
        if (tab === 'ratings') tab = 'players';
        if (tab === 'memberships' || tab === 'payments') tab = 'finances';

        document.querySelectorAll('.ad-sidebar-link').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.ad-mobile-tab').forEach(function(el) {
            el.classList.toggle('active', el.dataset.tab === tab);
        });
        document.querySelectorAll('.ad-section').forEach(function(el) {
            el.classList.toggle('active', el.id === 'ad-' + tab);
        });

        // Deep-link: open edit/view form directly
        if (itemId && action) {
            var deepMap = {
                content:     { edit: A.loadAndEditNews },
                tournaments: { edit: A.loadAndEditTournament, bracket: A.renderBracketManagement },
                players:     { edit: A.loadAndEditPlayer },
                courts:      { edit: A.loadAndEditCourt, view: A.loadAndViewCourt },
                coaches:     { edit: A.loadAndEditCoach, view: A.loadAndViewCoach },
                finances:    { edit: A.loadAndEditFinance },
                users:       { edit: A.loadAndEditUser },
                vouchers:    { view: A.loadAndViewVoucher }
            };
            if (deepMap[tab] && deepMap[tab][action]) {
                deepMap[tab][action](itemId);
                return;
            }
        }

        // Reset to list view when switching tabs via sidebar
        var resetMap = {
            content: A.renderNewsList,
            tournaments: A.renderTournamentsList,
            players: A.renderPlayersSection,
            courts: A.renderCourtsList,
            coaches: A.renderCoachesList,
            users: A.renderUsersList,
            finances: A.renderFinancesList,
            settings: A.renderSettingsSection,
            vouchers: A.renderVouchersList,
            loyalty: A.renderLoyaltySection,
            challenges: A.renderChallengesSection
        };
        if (resetMap[tab]) {
            resetMap[tab]();
        }
    }

    // ---- Render Dashboard ----
    function renderDashboard() {
        var container = document.getElementById('ad-dashboard');
        if (!container) return;

        var isAdm = A.currentRole === 'admin';

        container.innerHTML =
            '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px;">' +
                '<h2 class="ad-section-title" style="margin-bottom:0;">' + L.dashboardTitle + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn--accent" id="adBroadcastBtn" style="white-space:nowrap;">📢 ' + L.broadcastBtn + '</button>' : '') +
            '</div>' +
            // Stat cards (3x3 grid)
            '<div class="ad-stats-grid" id="adStatsGrid">' +
                // Row 1: Members, Overdue, Approaching
                renderStatCard(L.iconUsers, '...', L.statMembersDetail) +
                renderStatCard(L.iconOverdue, '...', L.statOverdueDetail, 'ad-stat-card--danger', 'adDashOverdue') +
                renderStatCard(L.iconApproaching, '...', L.statApproachingDetail, 'ad-stat-card--warning', 'adDashApproaching') +
                // Row 2: Pending regs, Tournaments, News
                renderStatCard(L.iconPending, '...', L.statPendingDetail, 'ad-stat-card--warning', 'adDashPendingRegs') +
                renderStatCard(L.iconTournaments, '...', L.statTournamentsDetail) +
                renderStatCard(L.iconNews, '...', L.statNewsDetail) +
                // Row 3: Courts, Coaches, Challenges
                renderStatCard(L.iconCourts, '...', L.statCourtsDetail) +
                renderStatCard(L.iconCoaches, '...', L.statCoachesDetail) +
                renderStatCard(L.iconChallenges, '...', L.statChallengesDetail) +
                // Row 4: Managers (admin only)
                (isAdm ? renderStatCard(L.iconManagers, '...', L.statManagersDetail) : '') +
            '</div>' +
            // Activity tables
            '<div class="ad-dash-activity-grid">' +
                buildActivityTableHtml('adDashPendingRegs', L.actPendingRegs, 'warning',
                    [L.thPlayer, L.thTournament, L.thDate], 'tournaments') +
                buildActivityTableHtml('adDashApproaching', L.actApproaching, 'warning',
                    [L.thName, L.thExpires, L.thDaysLeft], 'users') +
                buildActivityTableHtml('adDashOverdue', L.actOverdue, 'danger',
                    [L.thName, L.thExpires, L.thOverdueDays], 'users') +
                buildActivityTableHtml('adDashRecentUsers', L.actRecentRegistrations, 'neutral',
                    [L.thUser, L.thEmail, L.thRole, L.thDate], 'users') +
                buildActivityTableHtml('adDashRecentTournaments', L.actRecentTournaments, 'neutral',
                    [L.thTournament, L.thDateStart, L.thStatus, '&#128065;'], 'tournaments') +
                buildActivityTableHtml('adDashRecentNews', L.actRecentNews, 'neutral',
                    [L.thArticle, L.thCategory, L.thExecutor, L.thStatus, L.thPubDate, '&#128065;'], 'content') +
            '</div>';

        loadStats();

        // Broadcast button (admin only)
        var broadcastBtn = document.getElementById('adBroadcastBtn');
        if (broadcastBtn && A.openBroadcastModal) {
            broadcastBtn.addEventListener('click', A.openBroadcastModal);
        }
    }

    function renderStatCard(icon, value, label, modifier, clickTarget) {
        var cls = 'ad-stat-card' + (modifier ? ' ' + modifier : '');
        var clickAttr = clickTarget ? ' data-scroll-to="' + clickTarget + '"' : '';
        return '<div class="' + cls + '"' + clickAttr + '>' +
            '<div class="ad-stat-icon">' + icon + '</div>' +
            '<div class="ad-stat-value">' + value + '</div>' +
            '<div class="ad-stat-label">' + label + '</div>' +
        '</div>';
    }

    function buildActivityTableHtml(id, title, badgeType, headers, tabTarget) {
        var headerHtml = '';
        headers.forEach(function(h) { headerHtml += '<th>' + h + '</th>'; });
        return '<div class="ad-table-card" id="' + id + '">' +
            '<div class="ad-table-card-header">' +
                '<div class="ad-table-card-title">' + title +
                    '<span class="ad-dash-count-badge ad-dash-count-badge--' + badgeType + '" id="' + id + 'Count"></span>' +
                '</div>' +
                '<a class="ad-dash-view-all" data-tab="' + tabTarget + '">' + L.viewAll + ' →</a>' +
            '</div>' +
            '<div class="ad-table-wrap">' +
                '<table class="ad-table">' +
                    '<thead><tr>' + headerHtml + '</tr></thead>' +
                    '<tbody><tr><td colspan="' + headers.length + '" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                '</table>' +
            '</div>' +
        '</div>';
    }

    function fillDashTable(containerId, result, rowFn, emptyMsg) {
        var container = document.getElementById(containerId);
        if (!container) return;
        var tbody = container.querySelector('tbody');
        if (!tbody) return;
        var items = (result.status === 'fulfilled' && result.value.data) ? result.value.data : [];
        // Update count badge
        var badge = document.getElementById(containerId + 'Count');
        if (badge) badge.textContent = items.length > 0 ? items.length : '';
        if (items.length === 0) {
            tbody.innerHTML = '<tr><td colspan="10"><div class="ad-dash-empty"><div class="ad-dash-empty-icon">✅</div>' + emptyMsg + '</div></td></tr>';
            return;
        }
        tbody.innerHTML = '';
        items.forEach(function(item) { tbody.innerHTML += rowFn(item); });
    }

    function fmtDate(dateStr) {
        if (!dateStr) return L.noData;
        return new Date(dateStr).toLocaleDateString(isEn ? 'en-US' : 'ru-RU');
    }

    async function loadStats() {
        if (!A.client) return;

        var isAdm = A.currentRole === 'admin';
        var now = new Date();
        var today = now.toISOString().split('T')[0];
        var plus10 = new Date(now);
        plus10.setDate(plus10.getDate() + 10);
        var todayPlus10 = plus10.toISOString().split('T')[0];
        var todayMs = new Date(today).getTime();

        var results = await Promise.allSettled([
            // Counts
            A.client.from('players').select('id', { count: 'exact', head: true }),                                                       // [0] members
            A.client.from('profiles').select('id', { count: 'exact', head: true }),                                                      // [1] users
            A.client.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').lt('expires_at', today),     // [2] overdue
            A.client.from('memberships').select('id', { count: 'exact', head: true }).eq('status', 'active').gte('expires_at', today).lte('expires_at', todayPlus10), // [3] approaching
            A.client.from('tournament_registrations').select('id', { count: 'exact', head: true }).eq('status', 'pending'),               // [4] pending regs
            A.client.from('tournaments').select('id', { count: 'exact', head: true }).lt('date_start', today),                           // [5] past tournaments
            A.client.from('tournaments').select('id', { count: 'exact', head: true }).gte('date_start', today),                          // [6] upcoming tournaments
            A.client.from('news').select('id', { count: 'exact', head: true }).not('published_at', 'is', null),                           // [7] published news
            A.client.from('courts').select('id', { count: 'exact', head: true }),                                                        // [8] courts
            A.client.from('coaches').select('id', { count: 'exact', head: true }),                                                       // [9] coaches
            A.client.from('profiles').select('id', { count: 'exact', head: true }).eq('role', 'manager'),                                // [10] managers
            // Data for tables
            A.client.from('memberships').select('id, profile_id, expires_at, profiles!profile_id(full_name, email)')
                .eq('status', 'active').gte('expires_at', today).lte('expires_at', todayPlus10)
                .order('expires_at', { ascending: true }).limit(10),                                                                   // [11] approaching list
            A.client.from('memberships').select('id, profile_id, expires_at, profiles!profile_id(full_name, email)')
                .eq('status', 'active').lt('expires_at', today)
                .order('expires_at', { ascending: true }).limit(10),                                                                   // [12] overdue list
            A.client.from('tournament_registrations').select('id, player_id, tournament_id, registered_at, players(name), tournaments(title)')
                .eq('status', 'pending')
                .order('registered_at', { ascending: false }).limit(10),                                                               // [13] pending regs list
            A.client.from('profiles').select('id,full_name,email,role,avatar_url,created_at')
                .order('created_at', { ascending: false }).limit(10),                                                                  // [14] recent users
            A.client.from('tournaments').select('id, title, date_start, status, view_count')
                .order('date_start', { ascending: false }).limit(10),                                                                  // [15] recent tournaments
            A.client.from('news').select('id, title, category, executor, published_at, created_at, view_count')
                .order('created_at', { ascending: false }).limit(10),                                                                   // [16] recent news
            A.client.from('challenges').select('id', { count: 'exact', head: true }).in('status', ['active', 'negotiating', 'countered']) // [17] active challenges
        ]);

        // --- Stat cards ---
        var grid = document.getElementById('adStatsGrid');
        if (grid) {
            var membersCount = getCount(results[0]);
            var usersCount = getCount(results[1]);
            var overdueCount = getCount(results[2]);
            var approachingCount = getCount(results[3]);
            var pendingCount = getCount(results[4]);
            var pastTrn = getCount(results[5]);
            var upcomingTrn = getCount(results[6]);
            var newsCount = getCount(results[7]);
            var courtsCount = getCount(results[8]);
            var coachesCount = getCount(results[9]);
            var managersCount = getCount(results[10]);
            var challengesCount = getCount(results[17]);

            grid.innerHTML =
                // Row 1
                renderStatCard(L.iconUsers, membersCount + ' / ' + usersCount, L.statMembersDetail) +
                renderStatCard(L.iconOverdue, overdueCount, L.statOverdueDetail, 'ad-stat-card--danger', 'adDashOverdue') +
                renderStatCard(L.iconApproaching, approachingCount, L.statApproachingDetail, 'ad-stat-card--warning', 'adDashApproaching') +
                // Row 2
                renderStatCard(L.iconPending, pendingCount, L.statPendingDetail, 'ad-stat-card--warning', 'adDashPendingRegs') +
                renderStatCard(L.iconTournaments, pastTrn + ' / ' + upcomingTrn, L.statTournamentsDetail) +
                renderStatCard(L.iconNews, newsCount, L.statNewsDetail) +
                // Row 3
                renderStatCard(L.iconCourts, courtsCount, L.statCourtsDetail) +
                renderStatCard(L.iconCoaches, coachesCount, L.statCoachesDetail) +
                renderStatCard(L.iconChallenges, challengesCount, L.statChallengesDetail) +
                // Row 4
                (isAdm ? renderStatCard(L.iconManagers, managersCount, L.statManagersDetail) : '');
        }

        // --- Activity tables ---

        // Approaching payments
        fillDashTable('adDashApproaching', results[11], function(m) {
            var name = m.profiles ? A.esc(m.profiles.full_name || '') : L.noData;
            var email = m.profiles ? A.esc(m.profiles.email || '') : '';
            var expMs = m.expires_at ? new Date(m.expires_at).getTime() : 0;
            var diff = Math.ceil((expMs - todayMs) / 86400000);
            var dCls = diff <= 3 ? 'ad-days-danger' : diff <= 7 ? 'ad-days-warning' : 'ad-days-caution';
            return '<tr>' +
                '<td><div style="font-weight:500;">' + name + '</div><div style="font-size:0.7rem;color:var(--text-dim);">' + email + '</div></td>' +
                '<td>' + A.fmtDate(m.expires_at) + '</td>' +
                '<td class="' + dCls + '">' + diff + (isEn ? 'd' : ' дн.') + '</td>' +
            '</tr>';
        }, L.noApproaching);

        // Overdue payments
        fillDashTable('adDashOverdue', results[12], function(m) {
            var name = m.profiles ? A.esc(m.profiles.full_name || '') : L.noData;
            var email = m.profiles ? A.esc(m.profiles.email || '') : '';
            var expMs = m.expires_at ? new Date(m.expires_at).getTime() : 0;
            var diff = Math.ceil((todayMs - expMs) / 86400000);
            return '<tr>' +
                '<td><div style="font-weight:500;">' + name + '</div><div style="font-size:0.7rem;color:var(--text-dim);">' + email + '</div></td>' +
                '<td style="color:#f44336;">' + A.fmtDate(m.expires_at) + '</td>' +
                '<td class="ad-days-danger">' + diff + (isEn ? 'd' : ' дн.') + '</td>' +
            '</tr>';
        }, L.noOverdue);

        // Pending registrations
        fillDashTable('adDashPendingRegs', results[13], function(r) {
            var playerName = r.players ? A.esc(r.players.name || '') : L.noData;
            var trnName = r.tournaments ? A.esc(r.tournaments.title || '') : L.noData;
            return '<tr>' +
                '<td style="font-weight:500;">' + playerName + '</td>' +
                '<td>' + trnName + '</td>' +
                '<td>' + A.fmtDate(r.registered_at) + '</td>' +
            '</tr>';
        }, L.noPendingRegs);

        // Recent registrations
        fillDashTable('adDashRecentUsers', results[14], function(u) {
            var nameParts = (u.full_name || '').split(' ');
            var initials = nameParts.map(function(n) { return n.charAt(0); }).join('').toUpperCase() || '?';
            var avatarHtml = u.avatar_url
                ? '<img src="' + A.esc(u.avatar_url) + '" class="ad-table-avatar" alt="">'
                : '<div class="ad-table-avatar-placeholder">' + initials + '</div>';
            var roleClass = 'ad-role-badge-' + (u.role || 'user');
            var roleLabel = L['role' + (u.role || 'user').charAt(0).toUpperCase() + (u.role || 'user').slice(1)] || u.role;
            return '<tr>' +
                '<td><div class="ad-table-user-cell">' + avatarHtml +
                    '<div><div class="ad-table-user-name">' + A.esc(u.full_name || L.noData) + '</div></div>' +
                '</div></td>' +
                '<td>' + A.esc(u.email || L.noData) + '</td>' +
                '<td><span class="ad-role-badge ' + roleClass + '">' + roleLabel + '</span></td>' +
                '<td>' + A.fmtDate(u.created_at) + '</td>' +
            '</tr>';
        }, L.noRecentUsers);

        // Recent tournaments
        fillDashTable('adDashRecentTournaments', results[15], function(t) {
            var statusCls = 'ad-status-' + (t.status || '').replace(/_/g, '-');
            var statusLabel = t.status ? t.status.replace(/_/g, ' ') : L.noData;
            return '<tr>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(t.title || L.noData) + '</td>' +
                '<td>' + A.fmtDate(t.date_start) + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                '<td style="text-align:center;">' + (t.view_count || 0) + '</td>' +
            '</tr>';
        }, L.noRecentTournaments);

        // Recent news
        fillDashTable('adDashRecentNews', results[16], function(n) {
            var isPublished = !!n.published_at;
            var statusCls = isPublished ? 'ad-status-published' : 'ad-status-draft';
            var statusLabel = isPublished ? (isEn ? 'Published' : 'Опубликована') : (isEn ? 'Draft' : 'Черновик');
            var title = n.title || L.noData;
            if (title.length > 50) title = title.substring(0, 47) + '...';
            return '<tr>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(title) + '</td>' +
                '<td>' + A.esc(n.category || '—') + '</td>' +
                '<td>' + A.esc(n.executor || '—') + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                '<td>' + (n.published_at ? A.fmtDate(n.published_at) : '—') + '</td>' +
                '<td style="text-align:center;">' + (n.view_count || 0) + '</td>' +
            '</tr>';
        }, L.noRecentNews);

        // --- Click handlers ---

        // Stat card scroll-to
        document.querySelectorAll('#ad-dashboard .ad-stat-card[data-scroll-to]').forEach(function(card) {
            card.addEventListener('click', function() {
                var target = document.getElementById(this.dataset.scrollTo);
                if (target) target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            });
        });

        // "View all" → switchTab
        document.querySelectorAll('#ad-dashboard .ad-dash-view-all[data-tab]').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                var tab = this.dataset.tab;
                switchTab(tab);
                window.location.hash = tab;
            });
        });
    }

    function getCount(result) {
        if (result.status === 'fulfilled' && result.value.count !== null && result.value.count !== undefined) {
            return result.value.count;
        }
        return L.noData;
    }

    // ---- Export to namespace ----
    A.renderSidebar = renderSidebar;
    A.renderMobileTabs = renderMobileTabs;
    A.renderDashboard = renderDashboard;
    A.initTabs = initTabs;
    A.switchTab = switchTab;
    A.setAdminHash = setAdminHash;
    A.parseHash = parseHash;
    A.isDeepLinked = isDeepLinked;
    A.fmtDate = fmtDate;

})();
