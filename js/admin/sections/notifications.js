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
                        '<div id="adPushAudienceWrap" style="display:flex;gap:8px;margin-top:6px;flex-wrap:wrap;justify-content:center;">' +
                            '<div class="ad-push-audience-opt active" data-value="all" style="display:flex;align-items:center;justify-content:center;padding:10px 20px;border-radius:8px;border:1px solid var(--accent,#CCFF00);background:rgba(204,255,0,0.08);cursor:pointer;font-size:0.85rem;color:var(--accent,#CCFF00);transition:all 0.2s;user-select:none;">' + L.pushAll + '</div>' +
                            '<div class="ad-push-audience-opt" data-value="members" style="display:flex;align-items:center;justify-content:center;padding:10px 20px;border-radius:8px;border:1px solid var(--border-subtle,rgba(255,255,255,0.12));cursor:pointer;font-size:0.85rem;color:var(--text-secondary);transition:all 0.2s;user-select:none;">' + L.pushMembers + '</div>' +
                            '<div class="ad-push-audience-opt" data-value="user" style="display:flex;align-items:center;justify-content:center;padding:10px 20px;border-radius:8px;border:1px solid var(--border-subtle,rgba(255,255,255,0.12));cursor:pointer;font-size:0.85rem;color:var(--text-secondary);transition:all 0.2s;user-select:none;">' + L.pushUser + '</div>' +
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
                    '<button class="ad-btn ad-btn-primary" id="adPushSendBtn">' + L.pushSend + '</button>' +
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
                            '<th style="width:80px;"></th>' +
                        '</tr></thead>' +
                        '<tbody id="adPushHistoryBody"><tr><td colspan="7" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        // Audience toggle
        document.querySelectorAll('.ad-push-audience-opt').forEach(function(el) {
            el.addEventListener('click', function() {
                document.querySelectorAll('.ad-push-audience-opt').forEach(function(opt) {
                    opt.classList.remove('active');
                    opt.style.borderColor = 'var(--border-subtle, rgba(255,255,255,0.12))';
                    opt.style.background = 'transparent';
                    opt.style.color = 'var(--text-secondary, #999)';
                });
                this.classList.add('active');
                this.style.borderColor = 'var(--accent, #CCFF00)';
                this.style.background = 'rgba(204, 255, 0, 0.08)';
                this.style.color = 'var(--accent, #CCFF00)';
                var wrap = document.getElementById('adPushUserWrap');
                if (wrap) wrap.style.display = this.dataset.value === 'user' ? '' : 'none';
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

        var pattern = '%' + query + '%';
        var res = await A.client.from('profiles')
            .select('id, full_name, email')
            .or('full_name.ilike.' + pattern + ',email.ilike.' + pattern)
            .limit(10);
        // Fallback: if or() fails, try ilike on full_name only
        if (res.error) {
            res = await A.client.from('profiles')
                .select('id, full_name, email')
                .ilike('full_name', pattern)
                .limit(10);
        }

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

        var audienceEl = document.querySelector('.ad-push-audience-opt.active');
        var audience = audienceEl ? audienceEl.dataset.value : 'all';
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
            .select('id, title, message, type, audience, recipients_count, fcm_sent, created_at, recalled_at')
            .order('created_at', { ascending: false })
            .limit(50);

        var rows = res.data || [];
        if (rows.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">' + L.pushNoHistory + '</td></tr>';
            return;
        }

        var audienceLabels = { all: L.pushAll, members: L.pushMembers, user: L.pushUser };
        var typeLabels = { system: L.pushTypeSystem, tournament: L.pushTypeTournament, match: L.pushTypeMatch, battle: L.pushTypeBattle };

        var isAdmin = A.currentRole === 'admin';
        var isStaff = isAdmin || A.currentRole === 'manager';

        var recallLabel = A.isEn ? 'Recall' : 'Отозвать';
        var recallAgainLabel = A.isEn ? 'Recall again' : 'Отозвать повторно';
        var recalledLabel = A.isEn ? 'recalled' : 'отозвана';
        var delLabel = A.isEn ? 'Delete broadcast' : 'Удалить рассылку';

        tbody.innerHTML = rows.map(function(r) {
            var date = r.created_at ? new Date(r.created_at).toLocaleDateString(A.isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—';
            var recalled = !!r.recalled_at;

            // Отозвать может менеджер: это про людей — убрать сообщение у
            // получателей, запись в журнале остаётся с пометкой. Удалить —
            // только админ: убирает и у людей, и сам след рассылки
            //
            // \u041A\u043D\u043E\u043F\u043A\u0430 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0438 \u0443 \u043E\u0442\u043E\u0437\u0432\u0430\u043D\u043D\u044B\u0445: \u043F\u043E\u043C\u0435\u0442\u043A\u0430 \u0441\u0442\u043E\u0438\u0442, \u0430 \u0443\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F
            // \u043C\u043E\u0433\u043B\u0438 \u043D\u0435 \u0443\u0431\u0440\u0430\u0442\u044C\u0441\u044F \u2014 \u0442\u0430\u043A \u0432\u044B\u0448\u043B\u043E \u0441 \u0440\u0430\u0441\u0441\u044B\u043B\u043A\u0430\u043C\u0438, \u043E\u0442\u043E\u0437\u0432\u0430\u043D\u043D\u044B\u043C\u0438 \u0434\u043E
            // \u0442\u043E\u0433\u043E, \u043A\u0430\u043A \u043F\u043E\u044F\u0432\u0438\u043B\u0430\u0441\u044C \u0441\u0432\u044F\u0437\u044C \u0441 \u0436\u0443\u0440\u043D\u0430\u043B\u043E\u043C. \u041F\u043E\u0432\u0442\u043E\u0440\u043D\u044B\u0439 \u043E\u0442\u0437\u044B\u0432 \u0431\u0435\u0437\u0432\u0440\u0435\u0434\u0435\u043D
            var actions = '';
            if (isStaff) {
                actions += '<button class="ad-btn-icon ad-push-recall" data-id="' + r.id +
                    '" data-recalled="' + (recalled ? '1' : '') +
                    '" title="' + (recalled ? recallAgainLabel : recallLabel) + '">\u21A9</button>';
            }
            if (isAdmin) {
                actions += '<button class="ad-btn-icon ad-push-del" data-id="' + r.id +
                    '" data-recalled="' + (recalled ? '1' : '') +
                    '" title="' + delLabel + '">&times;</button>';
            }

            return '<tr' + (recalled ? ' style="opacity:0.55;"' : '') + '>' +
                '<td style="white-space:nowrap;font-size:0.8rem;">' + date + '</td>' +
                '<td style="font-weight:500;">' + A.esc(r.title || '') +
                    (recalled ? ' <span style="font-size:0.7rem;color:var(--text-muted);">\u00b7 ' + recalledLabel + '</span>' : '') +
                '</td>' +
                '<td>' + (audienceLabels[r.audience] || r.audience || '—') + '</td>' +
                '<td>' + (typeLabels[r.type] || r.type || '—') + '</td>' +
                '<td style="text-align:center;">' + (r.recipients_count || 0) + '</td>' +
                '<td style="text-align:center;">' + (r.fcm_sent || 0) + '</td>' +
                '<td style="text-align:right;white-space:nowrap;">' + actions + '</td>' +
            '</tr>';
        }).join('');

        tbody.querySelectorAll('.ad-push-recall').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var ok = await A.showConfirmAsync(
                    A.isEn ? 'Recall this broadcast?' : 'Отозвать рассылку?',
                    A.isEn
                        ? 'The message will disappear for everyone who received it. The journal entry stays, marked as recalled.'
                        : 'Сообщение исчезнет у всех, кто его получил. Запись в журнале останется с пометкой об отзыве.',
                    recallLabel);
                if (!ok) return;

                btn.disabled = true;
                var res = await A.client.rpc('recall_push', { p_push_id: btn.dataset.id });
                var err = (res.error && res.error.message) || (res.data && res.data.error);
                if (err) {
                    A.showToast(err === 'forbidden'
                        ? (A.isEn ? 'Not enough rights' : 'Недостаточно прав') : err, 'error');
                    btn.disabled = false;
                    return;
                }
                // Ноль убранных — не успех: у получателей сообщение осталось,
                // а запись уже помечена отозванной. Говорим об этом прямо.
                // У повторного отзыва ноль — норма, там уже всё убрано
                var removed = (res.data && res.data.removed) || 0;
                if (removed === 0 && btn.dataset.recalled) {
                    A.showToast(A.isEn
                        ? 'Already recalled, nothing left to remove'
                        : 'Уже отозвана, убирать нечего', 'success');
                } else if (removed === 0) {
                    A.showToast(A.isEn
                        ? 'Marked as recalled, but nothing was removed from recipients'
                        : 'Помечено отозванной, но у получателей ничего не убралось', 'error');
                } else {
                    A.showToast((A.isEn ? 'Recalled, removed: ' : 'Отозвано, убрано: ') + removed, 'success');
                }
                loadHistory();
            });
        });

        tbody.querySelectorAll('.ad-push-del').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var ok = await A.showConfirmAsync(
                    A.isEn ? 'Delete the broadcast?' : 'Удалить рассылку?',
                    A.isEn
                        ? 'The message will disappear for everyone who received it, and the journal entry will be erased too. This cannot be undone.'
                        : 'Сообщение исчезнет у всех, кто его получил, и запись в журнале тоже будет стёрта. Отменить это нельзя.',
                    A.isEn ? 'Delete' : 'Удалить');
                if (!ok) return;

                btn.disabled = true;

                // Сначала у получателей, потом строка журнала. Иначе получалось
                // так: запись стёрта, кнопка отзыва пропала вместе с ней, а
                // уведомление у людей висит, и убрать его больше нечем
                var rec = await A.client.rpc('recall_push', { p_push_id: btn.dataset.id });
                var recErr = (rec.error && rec.error.message) || (rec.data && rec.data.error);
                if (recErr) {
                    A.showToast(recErr === 'forbidden'
                        ? (A.isEn ? 'Not enough rights' : 'Недостаточно прав') : recErr, 'error');
                    btn.disabled = false;
                    return;
                }

                var res = await A.client.from('push_log').delete().eq('id', btn.dataset.id);
                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    btn.disabled = false;
                    return;
                }

                var removed = (rec.data && rec.data.removed) || 0;
                A.showToast(
                    (A.isEn ? 'Deleted, removed from recipients: ' : 'Удалено, убрано у получателей: ') + removed,
                    (removed === 0 && !btn.dataset.recalled) ? 'error' : 'success');
                loadHistory();
            });
        });
    }

    // ---- Export ----
    A.renderNotificationsSection = renderNotificationsSection;

})();
