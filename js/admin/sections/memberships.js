// ============================================
// KSLT Admin — Memberships CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var memSearchQuery = '';
    var memFilterStatus = '';

    async function renderMembershipsSection() {
        if (A.isDeepLinked('memberships')) return;
        renderMembershipsList();
    }

    // ---- Memberships List ----
    async function renderMembershipsList() {
        var container = document.getElementById('ad-memberships');
        if (!container) return;
        var isAdm = A.currentRole === 'admin';

        var statusFilterHtml = '<option value="">' + L.memAllStatuses + '</option>' +
            '<option value="active"' + (memFilterStatus === 'active' ? ' selected' : '') + '>' + L.memActive + '</option>' +
            '<option value="expiring"' + (memFilterStatus === 'expiring' ? ' selected' : '') + '>' + L.memExpiringSoon + '</option>' +
            '<option value="expired"' + (memFilterStatus === 'expired' ? ' selected' : '') + '>' + L.memExpired + '</option>' +
            '<option value="cancelled"' + (memFilterStatus === 'cancelled' ? ' selected' : '') + '>' + L.memCancelled + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.memberships + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adMemAdd">+ ' + L.memAdd + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adMemSearch" placeholder="' + L.memSearch + '" value="' + A.esc(memSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adMemStatusFilter">' + statusFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table" id="adMemTable">' +
                        '<thead><tr>' +
                            '<th>' + L.memUser + '</th>' +
                            '<th>' + L.memStatus + '</th>' +
                            '<th>' + L.memPayment + '</th>' +
                            '<th>' + L.memStartsAt + '</th>' +
                            '<th>' + L.memExpiresAt + '</th>' +
                            '<th>' + L.memDaysLeft + '</th>' +
                            '<th>' + L.memNote + '</th>' +
                            '<th></th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var memAddBtn = document.getElementById('adMemAdd');
        if (memAddBtn) {
            memAddBtn.addEventListener('click', function() {
                renderMembershipForm(null);
            });
        }

        var searchTimer = null;
        document.getElementById('adMemSearch').addEventListener('input', function() {
            memSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadMembershipsList(); }, 300);
        });

        document.getElementById('adMemStatusFilter').addEventListener('change', function() {
            memFilterStatus = this.value;
            loadMembershipsList();
        });

        await loadMembershipsList();
    }

    async function loadMembershipsList() {
        if (!A.client) return;
        var isAdm = A.currentRole === 'admin';

        var query = A.client.from('memberships')
            .select('id, profile_id, status, starts_at, expires_at, note, profiles!profile_id(full_name, email)')
            .order('created_at', { ascending: false });

        if (memFilterStatus && memFilterStatus !== 'expiring') {
            query = query.eq('status', memFilterStatus);
        }
        if (memFilterStatus === 'expiring') {
            query = query.eq('status', 'active');
        }

        var result = await query;
        if (result.error) console.error('Memberships query error:', JSON.stringify(result.error));

        var table = document.getElementById('adMemTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        // Load payments + telegram status separately to avoid join issues
        var memIds = items.map(function(m) { return m.id; });
        var profileIds = items.map(function(m) { return m.profile_id; }).filter(Boolean);
        var paymentsMap = {};
        var tgMap = {};
        if (memIds.length > 0) {
            var payResult = await A.client.from('payments').select('id, membership_id, status').in('membership_id', memIds);
            (payResult.data || []).forEach(function(p) {
                if (!paymentsMap[p.membership_id]) paymentsMap[p.membership_id] = [];
                paymentsMap[p.membership_id].push(p);
            });
        }
        if (profileIds.length > 0) {
            var tgResult = await A.client.from('profiles').select('id, telegram_chat_id').in('id', profileIds);
            (tgResult.data || []).forEach(function(p) {
                if (p.telegram_chat_id) tgMap[p.id] = true;
            });
        }

        // Client-side search filter
        if (memSearchQuery) {
            var q = memSearchQuery.toLowerCase();
            items = items.filter(function(m) {
                var name = (m.profiles && m.profiles.full_name || '').toLowerCase();
                var email = (m.profiles && m.profiles.email || '').toLowerCase();
                return name.indexOf(q) !== -1 || email.indexOf(q) !== -1;
            });
        }

        // Client-side "expiring" filter (active + ≤7 days left)
        if (memFilterStatus === 'expiring') {
            var nowMs = new Date().setHours(0,0,0,0);
            items = items.filter(function(m) {
                if (!m.expires_at) return false;
                var exp = new Date(m.expires_at); exp.setHours(0,0,0,0);
                var diff = Math.ceil((exp - nowMs) / 86400000);
                return diff > 0 && diff <= 7;
            });
        }

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">💳</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.memNoMembers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.memNoMembersText + '</div>' +
                '</td></tr>';
            return;
        }

        var today = new Date();
        today.setHours(0, 0, 0, 0);

        tbody.innerHTML = '';
        items.forEach(function(m) {
            var name = m.profiles ? A.esc(m.profiles.full_name || '') : '—';
            var email = m.profiles ? A.esc(m.profiles.email || '') : '';
            var hasTg = tgMap[m.profile_id];

            var statusClass = m.status === 'active' ? 'ad-mem-active' :
                              m.status === 'expired' ? 'ad-mem-expired' : 'ad-mem-cancelled';
            var statusLabel = m.status === 'active' ? L.memActive :
                              m.status === 'expired' ? L.memExpired : L.memCancelled;

            var daysLeft = '';
            var daysLeftNum = null;
            if (m.expires_at) {
                var exp = new Date(m.expires_at);
                exp.setHours(0, 0, 0, 0);
                var diff = Math.ceil((exp - today) / (1000 * 60 * 60 * 24));
                daysLeftNum = diff > 0 ? diff : 0;
                daysLeft = daysLeftNum + (isEn ? ' d' : ' дн.');
                if (diff <= 0 && m.status === 'active') {
                    statusClass = 'ad-mem-expired';
                    statusLabel = L.memExpired;
                }
            }

            // Expiring soon badge (active + ≤7 days)
            var expiringBadge = '';
            if (m.status === 'active' && daysLeftNum !== null && daysLeftNum > 0 && daysLeftNum <= 7) {
                expiringBadge = ' <span class="ad-mem-badge ad-mem-expiring">' + L.memExpiringSoon + '</span>';
            }

            // Payment badge
            var payBadge = '';
            var payments = paymentsMap[m.id] || [];
            var hasPaid = payments.some(function(p) { return p.status === 'completed'; });
            if (hasPaid) {
                payBadge = '<span class="ad-mem-badge ad-mem-paid">' + L.memPaid + '</span>';
            } else {
                payBadge = '<span class="ad-mem-badge ad-mem-unpaid">' + L.memUnpaid + '</span>';
            }

            // Days left color
            var daysColor = 'var(--text-primary)';
            if (daysLeftNum !== null && daysLeftNum <= 3) {
                daysColor = '#f44336';
            } else if (daysLeftNum !== null && daysLeftNum <= 7) {
                daysColor = '#ff9800';
            }

            // Telegram indicator
            var tgBadge = hasTg ? '<span class="ad-mem-badge ad-mem-tg" title="Telegram connected">' + L.memTgConnected + '</span> ' : '';

            tbody.innerHTML +=
                '<tr data-mem-id="' + m.id + '">' +
                    (isAdm ? A.bulkCheckboxTd(m.id) : '') +
                    '<td>' +
                        '<div style="font-weight:500;">' + tgBadge + '<a href="#" class="ad-mem-profile-link" data-profile-id="' + m.profile_id + '" data-mem-id="' + m.id + '">' + name + '</a></div>' +
                        '<div style="font-size:0.75rem;color:var(--text-dim);">' + email + '</div>' +
                    '</td>' +
                    '<td><span class="ad-mem-badge ' + statusClass + '">' + statusLabel + '</span>' + expiringBadge + '</td>' +
                    '<td>' + payBadge + '</td>' +
                    '<td>' + (m.starts_at || '—') + '</td>' +
                    '<td>' + (m.expires_at || '—') + '</td>' +
                    '<td style="text-align:center;font-weight:600;color:' + daysColor + ';">' + daysLeft + '</td>' +
                    '<td style="color:var(--text-dim);font-size:0.75rem;">' + A.esc(m.note || '') + '</td>' +
                    (isAdm ? '<td class="ad-mem-actions">' +
                        '<button class="ad-btn-sm ad-btn-extend" data-id="' + m.id + '" title="' + L.memExtend + '">+1</button>' +
                        '<button class="ad-btn-sm ad-btn-cancel-mem" data-id="' + m.id + '" title="' + L.memCancel + '">✕</button>' +
                        '<button class="ad-btn-sm ad-btn-edit-mem" data-id="' + m.id + '" title="' + L.memEdit + '">✎</button>' +
                    '</td>' : '') +
                '</tr>';
        });

        if (isAdm) {
            A.setupBulkDelete({ tableId: 'adMemTable', tableName: 'memberships', reloadFn: loadMembershipsList });

            // Quick action: Extend
            tbody.querySelectorAll('.ad-btn-extend').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    if (confirm(L.memExtendConfirm)) extendMembership(id);
                });
            });

            // Quick action: Cancel
            tbody.querySelectorAll('.ad-btn-cancel-mem').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    if (confirm(L.memCancelConfirm)) cancelMembership(id);
                });
            });

            // Quick action: Edit
            tbody.querySelectorAll('.ad-btn-edit-mem').forEach(function(btn) {
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    var id = this.getAttribute('data-id');
                    var mem = items.find(function(m) { return m.id === id; });
                    if (mem) {
                        A.setAdminHash('memberships', 'edit', id);
                        renderMembershipForm(mem);
                    }
                });
            });
        }

        // Profile link click
        tbody.querySelectorAll('.ad-mem-profile-link').forEach(function(link) {
            link.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();
                var profileId = this.getAttribute('data-profile-id');
                var memId = this.getAttribute('data-mem-id');
                if (profileId && memId) showMemberProfileModal(profileId, memId);
            });
        });
    }

    // ---- Member Profile Modal ----
    async function showMemberProfileModal(profileId, membershipId) {
        if (!A.client) return;

        // Load profile and payments in parallel
        var profilePromise = A.client.from('profiles').select('*').eq('id', profileId).single();
        var paymentsPromise = A.client.from('payments').select('*').eq('membership_id', membershipId).order('created_at', { ascending: false });
        var memPromise = A.client.from('memberships').select('*').eq('id', membershipId).single();

        var results = await Promise.all([profilePromise, paymentsPromise, memPromise]);
        var profile = results[0].data;
        var payments = results[1].data || [];
        var mem = results[2].data;

        if (!profile) return;

        // Avatar
        var avatarUrl = profile.avatar_url || '';
        var avatarHtml = avatarUrl
            ? '<img src="' + A.esc(avatarUrl) + '" class="ad-mem-profile-avatar" alt="">'
            : '<div class="ad-mem-profile-avatar ad-mem-profile-avatar-placeholder">' + A.esc((profile.full_name || '?').charAt(0).toUpperCase()) + '</div>';

        // Membership info
        var statusLabel = '—';
        var statusClass = '';
        if (mem) {
            var sMap = { active: 'ad-mem-active', expired: 'ad-mem-expired', cancelled: 'ad-mem-cancelled', pending: 'ad-mem-pending' };
            statusClass = sMap[mem.status] || '';
            statusLabel = '<span class="ad-mem-badge ' + statusClass + '">' + A.esc(mem.status) + '</span>';
            if (mem.expires_at) {
                var dLeft = Math.ceil((new Date(mem.expires_at) - new Date()) / (1000 * 60 * 60 * 24));
                statusLabel += ' <span style="color:var(--text-secondary);font-size:0.8rem;">(' + dLeft + ' ' + L.memDaysLeft.toLowerCase() + ')</span>';
            }
        }

        // Role
        var roleLabel = profile.role || 'user';

        // Phone
        var phone = profile.phone || '—';
        if (phone.length === 13 && phone.startsWith('+996')) {
            phone = phone.slice(0, 4) + ' ' + phone.slice(4, 7) + ' ' + phone.slice(7, 9) + '-' + phone.slice(9, 11) + '-' + phone.slice(11, 13);
        }

        // Registration date
        var regDate = profile.created_at ? profile.created_at.split('T')[0] : '—';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml = '<div style="color:var(--text-dim);padding:12px 0;">' + L.memNoPayments + '</div>';
        } else {
            paymentsHtml = '<table class="ad-mem-profile-payments"><thead><tr>' +
                '<th>' + L.memDate + '</th><th>' + L.memAmount + '</th><th>' + L.memPayStatus + '</th><th>' + L.memPayNote + '</th>' +
                '</tr></thead><tbody>';
            payments.forEach(function(p) {
                var pDate = p.created_at ? p.created_at.split('T')[0] : '—';
                var pStatusCls = p.status === 'completed' ? 'ad-mem-paid' : 'ad-mem-unpaid';
                paymentsHtml += '<tr>' +
                    '<td>' + pDate + '</td>' +
                    '<td>' + (p.amount || 0) + ' ' + A.esc(p.currency || 'KGS') + '</td>' +
                    '<td><span class="ad-mem-badge ' + pStatusCls + '">' + A.esc(p.status || '') + '</span></td>' +
                    '<td style="color:var(--text-dim);font-size:0.8rem;">' + A.esc(p.note || '') + '</td>' +
                '</tr>';
            });
            paymentsHtml += '</tbody></table>';
        }

        // Build modal
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal ad-mem-profile-modal">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.memProfile + '</h3>' +
                    '<button class="ad-modal-close" id="adMemProfileClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-mem-profile-top">' +
                        avatarHtml +
                        '<div class="ad-mem-profile-info">' +
                            '<div class="ad-mem-profile-name">' + A.esc(profile.full_name || '—') + '</div>' +
                            '<div class="ad-mem-profile-email">' + A.esc(profile.email || '') + '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-mem-profile-details">' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memPhone + '</span><span>' + A.esc(phone) + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memRole + '</span><span>' + A.esc(roleLabel) + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memRegistered + '</span><span>' + regDate + '</span></div>' +
                        '<div class="ad-mem-profile-row"><span class="ad-mem-profile-label">' + L.memMembership + '</span><span>' + statusLabel + '</span></div>' +
                    '</div>' +
                    '<div class="ad-mem-profile-payments-section">' +
                        '<h4 style="margin:0 0 8px;color:var(--text-primary);font-size:0.95rem;">' + L.memPaymentHistory + '</h4>' +
                        paymentsHtml +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close handlers
        var closeModal = function() { overlay.remove(); };
        overlay.querySelector('#adMemProfileClose').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });
        document.addEventListener('keydown', function onEsc(e) {
            if (e.key === 'Escape') { closeModal(); document.removeEventListener('keydown', onEsc); }
        });
    }

    async function extendMembership(id) {
        if (!A.client) return;
        var result = await A.client.from('memberships').select('expires_at').eq('id', id).single();
        if (!result.data) return;

        var current = result.data.expires_at ? new Date(result.data.expires_at) : new Date();
        var today = new Date();
        if (current < today) current = today;
        current.setMonth(current.getMonth() + 1);
        var newDate = current.toISOString().split('T')[0];

        await A.client.from('memberships').update({ expires_at: newDate, status: 'active' }).eq('id', id);
        loadMembershipsList();
    }

    async function cancelMembership(id) {
        if (!A.client) return;
        await A.client.from('memberships').update({ status: 'cancelled' }).eq('id', id);
        loadMembershipsList();
    }

    async function loadAndEditMembership(id) {
        if (!A.client) return;
        var result = await A.client.from('memberships')
            .select('*, profiles(full_name, email)')
            .eq('id', id).single();
        if (result.data) {
            renderMembershipForm(result.data);
        }
    }

    // ---- Membership Form ----
    async function renderMembershipForm(mem) {
        var container = document.getElementById('ad-memberships');
        if (!container) return;

        var isEdit = !!mem;
        var title = isEdit ? L.memEdit : L.memAdd;

        // Load all profiles for user select
        var profilesResult = await A.client.from('profiles').select('id, full_name, email').order('full_name', { ascending: true });
        var profiles = profilesResult.data || [];

        var today = new Date().toISOString().split('T')[0];
        var nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        var defaultEnd = nextMonth.toISOString().split('T')[0];

        var userOptions = '<option value="">' + L.memSelectUser + '</option>';
        profiles.forEach(function(p) {
            var selected = (isEdit && mem.profile_id === p.id) ? ' selected' : '';
            var label = A.esc((p.full_name || '') + ' (' + (p.email || '') + ')');
            userOptions += '<option value="' + p.id + '"' + selected + '>' + label + '</option>';
        });

        var statusOptions = '';
        ['active', 'expired', 'cancelled'].forEach(function(s) {
            var selected = (isEdit && mem.status === s) ? ' selected' : '';
            var label = s === 'active' ? L.memActive : s === 'expired' ? L.memExpired : L.memCancelled;
            statusOptions += '<option value="' + s + '"' + selected + '>' + label + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn" id="adMemBack">' + L.back + '</button>' +
            '</div>' +
            '<div class="ad-form-card">' +
                '<div class="ad-form-grid">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memUser + '</label>' +
                        '<select class="ad-field-input" id="adMemUser"' + (isEdit ? ' disabled' : '') + '>' + userOptions + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memStatus + '</label>' +
                        '<select class="ad-field-input" id="adMemStatus">' + statusOptions + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memStartsAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adMemStart" value="' + (isEdit ? (mem.starts_at || '') : today) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.memExpiresAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adMemEnd" value="' + (isEdit ? (mem.expires_at || '') : defaultEnd) + '">' +
                    '</div>' +
                    '<div class="ad-field ad-field-full">' +
                        '<label class="ad-field-label">' + L.memNote + '</label>' +
                        '<input type="text" class="ad-field-input" id="adMemNote" value="' + A.esc(isEdit ? (mem.note || '') : '') + '">' +
                    '</div>' +
                '</div>' +
                (!isEdit ?
                    '<div class="ad-field" style="margin-top:16px;">' +
                        '<label class="ad-field-label" style="display:flex;align-items:center;gap:8px;">' +
                            '<input type="checkbox" id="adMemRecordPay"> ' + L.memRecordPayment +
                        '</label>' +
                    '</div>' +
                    '<div id="adMemPayFields" style="display:none;margin-top:12px;">' +
                        '<div class="ad-form-grid">' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.memPaymentAmount + '</label>' +
                                '<input type="number" class="ad-field-input" id="adMemPayAmount" value="1000">' +
                            '</div>' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.memPaymentMethod + '</label>' +
                                '<select class="ad-field-input" id="adMemPayMethod">' +
                                    '<option value="cash">' + L.memPaymentCash + '</option>' +
                                    '<option value="transfer">' + L.memPaymentTransfer + '</option>' +
                                    '<option value="card">' + L.memPaymentCard + '</option>' +
                                '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>'
                : '') +
                (isEdit ?
                    '<div id="adMemPayHistory" style="margin-top:24px;"></div>'
                : '') +
                '<div class="ad-form-actions" style="margin-top:20px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adMemSave">' + L.save + '</button>' +
                    (isEdit ?
                        '<button class="ad-btn ad-btn-danger" id="adMemDelete" style="margin-left:auto;">' + L.delete + '</button>'
                    : '') +
                '</div>' +
            '</div>';

        // Back button
        document.getElementById('adMemBack').addEventListener('click', function() {
            A.setAdminHash('memberships');
            renderMembershipsList();
        });

        // Payment toggle
        var payCheck = document.getElementById('adMemRecordPay');
        if (payCheck) {
            payCheck.addEventListener('change', function() {
                document.getElementById('adMemPayFields').style.display = this.checked ? '' : 'none';
            });
        }

        // Save
        document.getElementById('adMemSave').addEventListener('click', function() {
            saveMembership(isEdit ? mem.id : null);
        });

        // Delete
        var delBtn = document.getElementById('adMemDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                if (confirm(L.memDeleteConfirm)) deleteMembership(mem.id);
            });
        }

        // Load payments for edit mode
        if (isEdit) {
            loadMembershipPayments(mem.id, mem.profile_id);
        }
    }

    async function saveMembership(editId) {
        if (!A.client) return;

        var profileId = document.getElementById('adMemUser').value;
        var status = document.getElementById('adMemStatus').value;
        var startsAt = document.getElementById('adMemStart').value;
        var expiresAt = document.getElementById('adMemEnd').value;
        var note = document.getElementById('adMemNote').value.trim();

        if (!editId && !profileId) {
            alert(L.memSelectUser);
            return;
        }

        var data = {
            status: status,
            starts_at: startsAt || null,
            expires_at: expiresAt || null,
            note: note || null
        };

        var saveBtn = document.getElementById('adMemSave');
        saveBtn.textContent = L.saving;
        saveBtn.disabled = true;

        if (editId) {
            await A.client.from('memberships').update(data).eq('id', editId);
        } else {
            data.profile_id = profileId;
            var result = await A.client.from('memberships').insert(data).select().single();

            // Record payment if checked
            var payCheck = document.getElementById('adMemRecordPay');
            if (payCheck && payCheck.checked && result.data) {
                var amount = parseFloat(document.getElementById('adMemPayAmount').value) || 0;
                var method = document.getElementById('adMemPayMethod').value;
                await A.client.from('payments').insert({
                    profile_id: profileId,
                    membership_id: result.data.id,
                    amount: amount,
                    currency: 'KGS',
                    status: 'completed',
                    payment_method: method,
                    note: note || null
                });
            }
        }

        saveBtn.textContent = L.saved;
        setTimeout(function() { renderMembershipsList(); }, 600);
    }

    async function deleteMembership(id) {
        if (!A.client) return;
        await A.client.from('memberships').delete().eq('id', id);
        renderMembershipsList();
    }

    async function loadMembershipPayments(membershipId, profileId) {
        if (!A.client) return;
        var container = document.getElementById('adMemPayHistory');
        if (!container) return;

        var result = await A.client.from('payments')
            .select('*')
            .eq('membership_id', membershipId)
            .order('created_at', { ascending: false });

        var payments = result.data || [];

        var html = '<h3 style="margin-bottom:12px;font-size:0.95rem;color:var(--text-secondary);">' + L.memPayments + '</h3>';

        if (payments.length === 0) {
            html += '<div style="color:var(--text-dim);font-size:0.85rem;">' + L.memNoPayments + '</div>';
        } else {
            html += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th>' + L.memPayDate + '</th>' +
                '<th>' + L.memPayAmount + '</th>' +
                '<th>' + L.memPayMethod + '</th>' +
                '<th>' + L.memPayStatus + '</th>' +
                '<th>' + L.memPayNote + '</th>' +
            '</tr></thead><tbody>';

            var methodLabels = { cash: L.memPaymentCash, transfer: L.memPaymentTransfer, card: L.memPaymentCard };

            payments.forEach(function(p) {
                html += '<tr>' +
                    '<td>' + (p.created_at ? p.created_at.split('T')[0] : '—') + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.amount || 0) + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td>' + (methodLabels[p.payment_method] || p.payment_method || '—') + '</td>' +
                    '<td><span class="ad-mem-badge ad-mem-' + (p.status === 'completed' ? 'active' : 'expired') + '">' + (p.status || '—') + '</span></td>' +
                    '<td style="color:var(--text-dim);font-size:0.8rem;">' + A.esc(p.note || '') + '</td>' +
                '</tr>';
            });

            html += '</tbody></table></div></div>';
        }

        container.innerHTML = html;
    }


    var PAYMENT_METHODS = A.PAYMENT_METHODS = { cash: L.payCash, transfer: L.payTransfer, card: L.payCard };
    var PAYMENT_PURPOSES = A.PAYMENT_PURPOSES = { promoted: L.payPromoted, sponsorship: L.paySponsorship, rental: L.payRental, other: L.payOther };
    var PAYMENT_ENTITY_TYPES = A.PAYMENT_ENTITY_TYPES = { court: L.payCourt, coach: L.payCoach, player: L.payPlayer };

    A.formatPayDate = function formatPayDate(d) {
        if (!d) return '—';
        var parts = d.split('-');
        return parts[2] + '.' + parts[1] + '.' + parts[0].slice(2);
    };
    var formatPayDate = A.formatPayDate;


    // ---- Export to namespace ----
    A.renderMembershipsSection = renderMembershipsSection;
    A.renderMembershipsList = renderMembershipsList;
    A.loadAndEditMembership = loadAndEditMembership;

})();
