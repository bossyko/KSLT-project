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
            '<div class="ad-modal" style="max-width:520px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>📢 ' + L.broadcastTitle + '</h3>' +
                    '<button class="ad-modal-close" id="adBroadcastClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.broadcastSubject + '</label>' +
                        '<input type="text" id="adBcSubject" class="ad-field-input" maxlength="100" placeholder="' + L.broadcastSubject + '...">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.broadcastMessage + '</label>' +
                        '<textarea id="adBcMessage" class="ad-field-input ad-field-textarea" rows="4" maxlength="2000" placeholder="' + L.broadcastMessage + '..."></textarea>' +
                    '</div>' +
                    '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:8px;">' +
                        '<div>' +
                            '<span class="ad-field-label" style="margin-bottom:8px;display:block;">' + L.broadcastAudience + '</span>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;margin-bottom:6px;"><input type="radio" name="bcAudience" value="all" checked style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> ' + L.broadcastAudienceAll + '</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;"><input type="radio" name="bcAudience" value="members" style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> ' + L.broadcastAudienceMembers + '</label>' +
                        '</div>' +
                        '<div>' +
                            '<span class="ad-field-label" style="margin-bottom:8px;display:block;">' + L.broadcastChannels + '</span>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;margin-bottom:6px;"><input type="checkbox" id="adBcChTg" checked style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> Telegram</label>' +
                            '<label style="display:flex;align-items:center;gap:6px;font-size:0.82rem;color:var(--text-muted);cursor:pointer;"><input type="checkbox" id="adBcChEmail" checked style="margin:0;width:15px;height:15px;accent-color:var(--accent);"> Email</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn" id="adBcCancel">' + L.cancel + '</button>' +
                    ' <button class="ad-btn ad-btn--accent" id="adBcSend">' + L.broadcastSend + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close handlers
        document.getElementById('adBroadcastClose').addEventListener('click', closeModal);
        document.getElementById('adBcCancel').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeModal();
        });

        // Send handler
        document.getElementById('adBcSend').addEventListener('click', sendBroadcast);
    }

    function closeModal() {
        var m = document.getElementById('adBroadcastModal');
        if (m) m.remove();
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

        // Channels
        var chTg = document.getElementById('adBcChTg').checked;
        var chEmail = document.getElementById('adBcChEmail').checked;
        if (!chTg && !chEmail) {
            A.showToast(L.broadcastChannels + '!', 'error');
            return;
        }

        // Confirm (async — returns Promise)
        var ok = await A.showConfirmAsync(L.broadcastConfirm, '', L.broadcastSend);
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
