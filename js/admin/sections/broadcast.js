// ============================================
// KSLT Admin — Broadcast Module
// ============================================
// Modal for sending broadcasts via TG + Email.
// Admin only. Called from dashboard broadcast button.

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;

    // ---- Open Broadcast Modal ----
    function openBroadcastModal() {
        // Remove existing modal if any
        var existing = document.getElementById('adBroadcastModal');
        if (existing) existing.remove();

        var overlay = document.createElement('div');
        overlay.id = 'adBroadcastModal';
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:540px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>📢 ' + L.broadcastTitle + '</h3>' +
                    '<button class="ad-modal-close" id="adBroadcastClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    // Subject
                    '<div class="ad-form-group">' +
                        '<label class="ad-label">' + L.broadcastSubject + '</label>' +
                        '<input type="text" id="adBcSubject" class="ad-input" maxlength="100" placeholder="' + L.broadcastSubject + '...">' +
                    '</div>' +
                    // Message
                    '<div class="ad-form-group">' +
                        '<label class="ad-label">' + L.broadcastMessage + '</label>' +
                        '<textarea id="adBcMessage" class="ad-textarea" rows="5" maxlength="2000" placeholder="' + L.broadcastMessage + '..."></textarea>' +
                    '</div>' +
                    // Audience
                    '<div class="ad-form-group">' +
                        '<label class="ad-label">' + L.broadcastAudience + '</label>' +
                        '<div class="ad-radio-group">' +
                            '<label class="ad-radio"><input type="radio" name="bcAudience" value="all" checked> ' + L.broadcastAudienceAll + '</label>' +
                            '<label class="ad-radio"><input type="radio" name="bcAudience" value="members"> ' + L.broadcastAudienceMembers + '</label>' +
                            '<label class="ad-radio"><input type="radio" name="bcAudience" value="tournament"> ' + L.broadcastAudienceTournament + '</label>' +
                        '</div>' +
                        '<select id="adBcTournament" class="ad-select" style="display:none;margin-top:8px;">' +
                            '<option value="">' + L.broadcastSelectTournament + '</option>' +
                        '</select>' +
                    '</div>' +
                    // Channels
                    '<div class="ad-form-group">' +
                        '<label class="ad-label">' + L.broadcastChannels + '</label>' +
                        '<div style="display:flex;gap:16px;">' +
                            '<label class="ad-checkbox"><input type="checkbox" id="adBcChTg" checked> Telegram</label>' +
                            '<label class="ad-checkbox"><input type="checkbox" id="adBcChEmail" checked> Email</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn" id="adBcCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn--accent" id="adBcSend">' + L.broadcastSend + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close handlers
        document.getElementById('adBroadcastClose').addEventListener('click', closeModal);
        document.getElementById('adBcCancel').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });

        // Audience radio → show/hide tournament select
        var radios = overlay.querySelectorAll('input[name="bcAudience"]');
        var tSelect = document.getElementById('adBcTournament');
        radios.forEach(function(r) {
            r.addEventListener('change', function() {
                tSelect.style.display = r.value === 'tournament' ? 'block' : 'none';
                if (r.value === 'tournament' && tSelect.options.length <= 1) {
                    loadTournaments(tSelect);
                }
            });
        });

        // Send handler
        document.getElementById('adBcSend').addEventListener('click', sendBroadcast);
    }

    function closeModal() {
        var m = document.getElementById('adBroadcastModal');
        if (m) m.remove();
    }

    // ---- Load tournaments for dropdown ----
    async function loadTournaments(select) {
        try {
            var { data } = await A.client.from('tournaments')
                .select('id, title')
                .neq('status', 'cancelled')
                .order('date_start', { ascending: false })
                .limit(30);

            if (data) {
                data.forEach(function(t) {
                    var opt = document.createElement('option');
                    opt.value = t.id;
                    opt.textContent = t.title;
                    select.appendChild(opt);
                });
            }
        } catch (e) {
            console.error('Load tournaments error:', e);
        }
    }

    // ---- Send Broadcast ----
    async function sendBroadcast() {
        var subject = document.getElementById('adBcSubject').value.trim();
        var message = document.getElementById('adBcMessage').value.trim();

        if (!subject || !message) {
            A.showToast(L.broadcastSubject + ' + ' + L.broadcastMessage, 'error');
            return;
        }

        // Audience
        var audienceRadio = document.querySelector('input[name="bcAudience"]:checked');
        var audience = audienceRadio ? audienceRadio.value : 'all';
        if (audience === 'tournament') {
            var tId = document.getElementById('adBcTournament').value;
            if (!tId) {
                A.showToast(L.broadcastSelectTournament, 'error');
                return;
            }
            audience = 'tournament:' + tId;
        }

        // Channels
        var chTg = document.getElementById('adBcChTg').checked;
        var chEmail = document.getElementById('adBcChEmail').checked;
        if (!chTg && !chEmail) {
            A.showToast(L.broadcastChannels + '!', 'error');
            return;
        }

        // Confirm
        var ok = await A.showConfirm(L.broadcastConfirm);
        if (!ok) return;

        var btn = document.getElementById('adBcSend');
        btn.disabled = true;
        btn.textContent = L.broadcastSending;

        try {
            var session = (await A.client.auth.getSession()).data.session;
            if (!session) {
                A.showToast('Auth error', 'error');
                btn.disabled = false;
                btn.textContent = L.broadcastSend;
                return;
            }

            var url = A.client.supabaseUrl + '/functions/v1/broadcast';
            var res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + session.access_token,
                    'Content-Type': 'application/json',
                    'apikey': A.client.supabaseKey
                },
                body: JSON.stringify({
                    subject: subject,
                    message: message,
                    audience: audience,
                    channels: { tg: chTg, email: chEmail }
                })
            });

            var result = await res.json();

            if (!res.ok) {
                A.showToast(result.error || 'Error', 'error');
                btn.disabled = false;
                btn.textContent = L.broadcastSend;
                return;
            }

            var stats = 'TG: ' + (result.tg_sent || 0) + ', Email: ' + (result.email_sent || 0);
            if (result.skipped) stats += ', Skip: ' + result.skipped;
            stats += ' / ' + (result.total || 0);
            A.showToast(L.broadcastSuccess + ' (' + stats + ')', 'success');
            closeModal();

        } catch (e) {
            console.error('Broadcast error:', e);
            A.showToast('Error: ' + e.message, 'error');
            btn.disabled = false;
            btn.textContent = L.broadcastSend;
        }
    }

    // ---- Export ----
    A.openBroadcastModal = openBroadcastModal;

})();
