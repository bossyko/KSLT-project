// ============================================
// KSLT Admin — Push Notifications Section
// ============================================
// Admin-only section for sending push notifications
// via Edge Function send-push. Shows form + history.

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;

    // ---- Render Section ----
    function renderNotificationsSection() {
        var container = document.getElementById('ad-notifications');
        if (!container) return;

        container.innerHTML =
            '<h2 class="ad-section-title">' + A.SECTION_ICONS.notifications + ' ' + L.pushNotifications + '</h2>' +

            // Send form
            '<div class="ad-card" style="margin-bottom:24px;">' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.pushTitle + '</label>' +
                    '<input type="text" id="adPushTitle" class="ad-field-input" maxlength="100" placeholder="' + L.pushTitle + '...">' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.pushMessage + '</label>' +
                    '<textarea id="adPushMessage" class="ad-field-input ad-field-textarea" rows="3" maxlength="1000" placeholder="' + L.pushMessage + '..."></textarea>' +
                '</div>' +
                '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">' +
                    // Type
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.pushType + '</label>' +
                        '<select id="adPushType" class="ad-field-input">' +
                            '<option value="system">' + L.pushTypeSystem + '</option>' +
                            '<option value="tournament">' + L.pushTypeTournament + '</option>' +
                            '<option value="match">' + L.pushTypeMatch + '</option>' +
                            '<option value="battle">' + L.pushTypeBattle + '</option>' +
                        '</select>' +
                    '</div>' +
                    // Audience
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.pushAudience + '</label>' +
                        '<div style="display:flex;flex-direction:column;gap:6px;margin-top:4px;">' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;"><input type="radio" name="pushAudience" value="all" checked style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> ' + L.pushAll + '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;"><input type="radio" name="pushAudience" value="members" style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> ' + L.pushMembers + '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;"><input type="radio" name="pushAudience" value="user" style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> ' + L.pushUser + '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // User search (hidden by default)
                '<div class="ad-field" id="adPushUserWrap" style="display:none;">' +
                    '<label class="ad-field-label">' + L.pushSearchUser + '</label>' +
                    '<input type="text" id="adPushUserSearch" class="ad-field-input" placeholder="' + L.pushSearchUser + '">' +
                    '<input type="hidden" id="adPushUserId">' +
                    '<div id="adPushUserResults" style="max-height:150px;overflow-y:auto;"></div>' +
                '</div>' +
                '<div style="margin-top:12px;">' +
                    '<button class="ad-btn ad-btn--accent" id="adPushSendBtn">' + L.pushSend + '</button>' +
                '</div>' +
            '</div>' +

            // History table
            '<div class="ad-card">' +
                '<h3 class="ad-card-title">' + L.pushHistory + '</h3>' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table">' +
                        '<thead><tr>' +
                            '<th>' + L.thDate + '</th>' +
                            '<th>' + L.pushTitle + '</th>' +
                            '<th>' + L.pushAudience + '</th>' +
                            '<th>' + L.pushType + '</th>' +
                            '<th>' + L.pushRecipients + '</th>' +
                            '<th>' + L.pushFcm + '</th>' +
                        '</tr></thead>' +
                        '<tbody id="adPushHistoryBody"><tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        // Audience radio toggle
        document.querySelectorAll('input[name="pushAudience"]').forEach(function(r) {
            r.addEventListener('change', function() {
                var wrap = document.getElementById('adPushUserWrap');
                if (wrap) wrap.style.display = this.value === 'user' ? '' : 'none';
            });
        });

        // User search autocomplete
        var searchInput = document.getElementById('adPushUserSearch');
        if (searchInput) {
            var debounce;
            searchInput.addEventListener('input', function() {
                clearTimeout(debounce);
                var q = this.value.trim();
                if (q.length < 2) {
                    document.getElementById('adPushUserResults').innerHTML = '';
                    return;
                }
                debounce = setTimeout(function() { searchUsers(q); }, 300);
            });
        }

        // Send button
        document.getElementById('adPushSendBtn').addEventListener('click', sendPush);

        // Load history
        loadHistory();
    }

    // ---- User Search ----
    async function searchUsers(query) {
        var container = document.getElementById('adPushUserResults');
        if (!container || !A.client) return;

        var res = await A.client.from('profiles')
            .select('id, full_name, email')
            .or('full_name.ilike.%' + query + '%,email.ilike.%' + query + '%')
            .limit(10);

        var profiles = res.data || [];
        if (profiles.length === 0) {
            container.innerHTML = '<div style="padding:8px;color:var(--text-dim);font-size:0.8rem;">—</div>';
            return;
        }

        container.innerHTML = profiles.map(function(p) {
            return '<div class="ad-push-user-option" data-id="' + A.esc(p.id) + '" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border-subtle);font-size:0.85rem;">' +
                '<div style="font-weight:500;">' + A.esc(p.full_name || '') + '</div>' +
                '<div style="color:var(--text-dim);font-size:0.75rem;">' + A.esc(p.email || '') + '</div>' +
            '</div>';
        }).join('');

        container.querySelectorAll('.ad-push-user-option').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('adPushUserId').value = this.dataset.id;
                document.getElementById('adPushUserSearch').value = this.querySelector('div').textContent;
                container.innerHTML = '';
            });
        });
    }

    // ---- Send Push ----
    async function sendPush() {
        var title = document.getElementById('adPushTitle').value.trim();
        var message = document.getElementById('adPushMessage').value.trim();

        if (!title || !message) {
            A.showToast(L.pushTitle + ' + ' + L.pushMessage, 'error');
            return;
        }

        var audienceRadio = document.querySelector('input[name="pushAudience"]:checked');
        var audience = audienceRadio ? audienceRadio.value : 'all';
        var type = document.getElementById('adPushType').value;
        var userId = null;

        if (audience === 'user') {
            userId = document.getElementById('adPushUserId').value;
            if (!userId) {
                A.showToast(L.pushSearchUser, 'error');
                return;
            }
        }

        var ok = await A.showConfirmAsync(L.pushConfirm, '', L.pushSend);
        if (!ok) return;

        var btn = document.getElementById('adPushSendBtn');
        btn.disabled = true;
        btn.textContent = L.pushSending;

        try {
            var session = (await A.client.auth.getSession()).data.session;
            if (!session) {
                A.showToast('Auth error', 'error');
                btn.disabled = false;
                btn.textContent = L.pushSend;
                return;
            }

            var url = A.client.supabaseUrl + '/functions/v1/send-push';
            var body = { title: title, message: message, type: type, audience: audience };
            if (userId) body.user_id = userId;

            var res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + session.access_token,
                    'Content-Type': 'application/json',
                    'apikey': A.client.supabaseKey
                },
                body: JSON.stringify(body)
            });

            var result = await res.json();

            if (!res.ok) {
                A.showToast(result.error || 'Error', 'error');
                btn.disabled = false;
                btn.textContent = L.pushSend;
                return;
            }

            var stats = L.pushRecipients + ': ' + (result.notified || 0) + ', FCM: ' + (result.fcm_sent || 0) + ' / ' + (result.total || 0);
            A.showToast(L.pushSent + ' (' + stats + ')', 'success');

            // Clear form
            document.getElementById('adPushTitle').value = '';
            document.getElementById('adPushMessage').value = '';
            btn.disabled = false;
            btn.textContent = L.pushSend;

            // Reload history
            loadHistory();

        } catch (e) {
            console.error('Push send error:', e);
            A.showToast('Error: ' + e.message, 'error');
            btn.disabled = false;
            btn.textContent = L.pushSend;
        }
    }

    // ---- Load History ----
    async function loadHistory() {
        var tbody = document.getElementById('adPushHistoryBody');
        if (!tbody || !A.client) return;

        var res = await A.client.from('push_log')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(50);

        var rows = res.data || [];
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">' + L.pushNoHistory + '</td></tr>';
            return;
        }

        var audienceLabels = { all: L.pushAll, members: L.pushMembers, user: L.pushUser };
        var typeLabels = { system: L.pushTypeSystem, tournament: L.pushTypeTournament, match: L.pushTypeMatch, battle: L.pushTypeBattle };

        tbody.innerHTML = rows.map(function(r) {
            var date = r.created_at ? new Date(r.created_at).toLocaleDateString(A.isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
            return '<tr>' +
                '<td style="white-space:nowrap;font-size:0.8rem;">' + date + '</td>' +
                '<td style="font-weight:500;">' + A.esc(r.title || '') + '</td>' +
                '<td>' + (audienceLabels[r.audience] || r.audience || '—') + '</td>' +
                '<td>' + (typeLabels[r.type] || r.type || '—') + '</td>' +
                '<td style="text-align:center;">' + (r.recipients_count || 0) + '</td>' +
                '<td style="text-align:center;">' + (r.fcm_sent || 0) + '</td>' +
            '</tr>';
        }).join('');
    }

    // ---- Export ----
    A.renderNotificationsSection = renderNotificationsSection;

})();
