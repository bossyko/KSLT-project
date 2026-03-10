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

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.users + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adUsrAddManager">+ ' + L.usrAddManager + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
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
                            '<th>' + L.usrThMembership + '</th>' +
                            '<th>' + L.thDate + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var addMgrBtn = document.getElementById('adUsrAddManager');
        if (addMgrBtn) {
            addMgrBtn.addEventListener('click', function() {
                openAddManagerModal();
            });
        }

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

        await loadUsersList();
    }

    async function loadUsersList() {
        if (!A.client) return;
        var isAdm = A.currentRole === 'admin';

        var query = A.client.from('profiles')
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at')
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

        // Client-side search
        if (usrSearchQuery) {
            var q = usrSearchQuery.toLowerCase();
            items = items.filter(function(u) {
                var name = (u.full_name || '').toLowerCase();
                var email = (u.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        var table = document.getElementById('adUsrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="5" style="text-align:center;padding:60px 20px;">' +
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

            // Membership badge
            var mem = memMap[u.id];
            var memBadge;
            if (mem && mem.status === 'active') {
                memBadge = '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>';
            } else if (mem && mem.status === 'expired') {
                memBadge = '<span class="ad-mem-badge ad-mem-expired">' + L.usrExpired + '</span>';
            } else {
                memBadge = '<span style="color:var(--text-dim);font-size:0.8rem;">' + L.usrNone + '</span>';
            }

            // Online indicator
            var isOnline = u.last_seen && (now - new Date(u.last_seen).getTime()) < 5 * 60 * 1000;
            var onlineDot = isOnline ? '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#34c759;margin-left:6px;" title="' + L.usrOnline + '"></span>' : '';

            var regDate = u.created_at ? u.created_at.split('T')[0] : '—';

            var tr = document.createElement('tr');
            if (isAdm) tr.style.cursor = 'pointer';
            tr.innerHTML =
                '<td><div style="display:flex;align-items:center;gap:10px;">' + avatarHtml + '<span>' + (name || email) + onlineDot + '</span></div></td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + email + '</td>' +
                '<td>' + roleBadge + '</td>' +
                '<td>' + memBadge + '</td>' +
                '<td style="color:var(--text-dim);font-size:0.85rem;">' + regDate + '</td>';

            if (isAdm) {
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
            .select('id, full_name, email, role, avatar_url, phone, telegram_chat_id, last_seen, created_at')
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

    function renderUserForm(user, membership) {
        var container = document.getElementById('ad-users');
        if (!container) return;

        var roleLabel = L['role' + user.role.charAt(0).toUpperCase() + user.role.slice(1)] || user.role;
        var tgStatus = user.telegram_chat_id ? L.usrTgConnected : L.usrTgNotConnected;
        var tgColor = user.telegram_chat_id ? '#34c759' : 'var(--text-dim)';
        var lastSeen = user.last_seen ? user.last_seen.split('T')[0] + ' ' + user.last_seen.split('T')[1].substring(0, 5) : '—';
        var regDate = user.created_at ? user.created_at.split('T')[0] : '—';

        var initials = (user.full_name || '?').split(' ').map(function(n) { return n.charAt(0); }).join('').toUpperCase();
        var avatarHtml = user.avatar_url
            ? '<img src="' + A.esc(user.avatar_url) + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:64px;height:64px;border-radius:50%;background:rgba(204,255,0,0.15);color:var(--accent);display:flex;align-items:center;justify-content:center;font-size:1.2rem;font-weight:700;">' + initials + '</div>';

        // Membership section
        var memHtml = '';
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
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;">' +
                    '<span class="ad-mem-badge ad-mem-active">' + L.usrActive + '</span>' +
                    '<span style="color:var(--text-secondary);font-size:0.85rem;">' + (isEn ? 'until ' : 'до ') + expDate + daysLeft + '</span>' +
                '</div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adUsrExtendMem">' + L.usrExtendMembership + '</button>' +
                    '<select class="ad-field-input" id="adUsrExtendPeriod" style="width:auto;padding:4px 8px;font-size:0.8rem;">' +
                        '<option value="1">' + L.usrMonths1 + '</option>' +
                        '<option value="3">' + L.usrMonths3 + '</option>' +
                        '<option value="6">' + L.usrMonths6 + '</option>' +
                        '<option value="12">' + L.usrMonths12 + '</option>' +
                    '</select>' +
                    '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adUsrCancelMem">' + L.usrCancelMembership + '</button>' +
                '</div>';
        } else {
            memHtml =
                '<div style="color:var(--text-dim);margin-bottom:12px;">' + L.usrNoMembership + '</div>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adUsrGiveMem">' + L.usrGiveMembership + '</button>' +
                    '<select class="ad-field-input" id="adUsrGivePeriod" style="width:auto;padding:4px 8px;font-size:0.8rem;">' +
                        '<option value="1">' + L.usrMonths1 + '</option>' +
                        '<option value="3">' + L.usrMonths3 + '</option>' +
                        '<option value="6">' + L.usrMonths6 + '</option>' +
                        '<option value="12">' + L.usrMonths12 + '</option>' +
                    '</select>' +
                '</div>';
        }

        // Role actions
        var isSelf = user.id === A.currentUserId;
        var roleActionsHtml = '';
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
        } else {
            roleActionsHtml = '';
        }

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
                        '<input type="text" class="ad-field-input" id="adUsrName" value="' + A.esc(user.full_name || '') + '">' +
                    '</div>' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.usrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adUsrPhone" value="' + A.esc(user.phone || '') + '">' +
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
                '<button class="ad-btn ad-btn-primary" id="adUsrSave" style="margin-top:8px;">' + L.save + '</button>' +
                // Membership
                '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrMembership + '</h3>' +
                memHtml +
                // Actions
                '<h3 style="font-size:0.9rem;color:var(--accent);margin:24px 0 12px;font-weight:600;">' + L.usrActions + '</h3>' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    roleActionsHtml +
                '</div>' +
            '</div>';

        // Event listeners
        document.getElementById('adUsrBack').addEventListener('click', function() {
            A.setAdminHash('users');
            renderUsersList();
        });

        document.getElementById('adUsrSave').addEventListener('click', function() {
            saveUserHandler(user.id);
        });

        // Membership actions
        var giveMem = document.getElementById('adUsrGiveMem');
        if (giveMem) {
            giveMem.addEventListener('click', function() {
                var months = parseInt(document.getElementById('adUsrGivePeriod').value);
                giveMembership(user.id, months);
            });
        }

        var extendMem = document.getElementById('adUsrExtendMem');
        if (extendMem) {
            extendMem.addEventListener('click', function() {
                var months = parseInt(document.getElementById('adUsrExtendPeriod').value);
                extendMembership(membership.id, months);
            });
        }

        var cancelMem = document.getElementById('adUsrCancelMem');
        if (cancelMem) {
            cancelMem.addEventListener('click', function() {
                cancelMembership(membership.id, user.id);
            });
        }

        // Role actions
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

    async function giveMembership(profileId, months) {
        var now = new Date();
        var end = new Date(now);
        end.setMonth(end.getMonth() + months);

        var result = await A.client.from('memberships').insert({
            profile_id: profileId,
            status: 'active',
            starts_at: now.toISOString(),
            expires_at: end.toISOString(),
            note: isEn ? 'Admin: free membership' : 'Админ: бесплатное членство'
        });

        if (result.error) {
            A.showToast(result.error.message, 'error');
        } else {
            A.showToast(L.usrMembershipGiven, 'success');
            loadAndEditUser(profileId);
        }
    }

    async function extendMembership(memId, months) {
        // Get current expiry
        var res = await A.client.from('memberships').select('expires_at').eq('id', memId).single();
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
                loadAndEditUser(profileId);
            }
        }, L.usrCancelMembership);
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


    // ---- Export to namespace ----
    A.renderUsersSection = renderUsersSection;
    A.renderUsersList = renderUsersList;
    A.loadAndEditUser = loadAndEditUser;

})();
