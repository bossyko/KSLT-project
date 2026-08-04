// ============================================
// KSLT Mobile — Подача заявки на турнир
//
// Те же правила допуска, что на сайте: решение принимает Edge Function
// tournament-register. Приложение не выбирает статус само и не может
// подвинуть чужую заявку.
// ============================================

(function() {
    'use strict';

    var I18N = window.KSLT_I18N;

    function t(key) {
        return (I18N && I18N.t) ? I18N.t(key) : key;
    }

    /**
     * Отправляет заявку на турнир.
     * @param {string} tournamentId
     * @param {Object} [extra] partner_id или partner_external_* для парных
     * @returns {Promise<{ok:boolean, data:Object}>}
     */
    function call(tournamentId, extra) {
        return supabaseClient.auth.getSession().then(function(sess) {
            var token = sess.data.session ? sess.data.session.access_token : '';
            var payload = { tournament_id: tournamentId };
            if (extra) {
                for (var k in extra) {
                    if (extra[k] !== undefined && extra[k] !== null && extra[k] !== '') payload[k] = extra[k];
                }
            }
            return fetch(SUPABASE_URL + '/functions/v1/tournament-register', {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + token,
                    'apikey': SUPABASE_ANON_KEY,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
        }).then(function(res) {
            return res.json().then(function(data) { return { ok: res.ok, data: data }; });
        }).catch(function(e) {
            return { ok: false, data: { error: e.message } };
        });
    }

    /**
     * Человеческий текст по ответу функции.
     * @returns {{title:string, text:string, note:string, tone:string, short:string}}
     */
    function resultText(data) {
        var errorKeys = {
            no_player: 'reg.errNoPlayer',
            no_membership: 'reg.errNoMember',
            not_paid: 'reg.errNotPaid',
            banned: 'reg.errBanned',
            registration_closed: 'reg.errClosed',
            gender_mismatch: 'reg.errGender',
            ntrp_too_low: 'reg.errNtrpLow',
            ntrp_too_high: 'reg.errNtrpHigh',
            ntrp_combined_exceeded: 'reg.errNtrpComb'
        };

        // Заявка уже подана — показываем её статус
        if (data && data.error === 'already_registered') {
            var stKeys = {
                approved: 'reg.stApproved', draw: 'reg.stDraw', pending: 'reg.stPending',
                waitlist: 'reg.stWaitlist', rejected: 'reg.stRejected',
                withdrawn: 'reg.stWithdrawn', blocked: 'reg.stBlocked'
            };
            var shortKeys = {
                approved: 'reg.shortInDraw', draw: 'reg.shortInDraw', pending: 'reg.shortReview',
                waitlist: 'reg.stWaitlist', rejected: 'reg.shortBlocked',
                withdrawn: 'reg.stWithdrawn', blocked: 'reg.shortBlocked'
            };
            var bad = data.status === 'rejected' || data.status === 'blocked';
            return {
                tone: bad ? 'error' : 'info', icon: bad ? '⛔' : '📋',
                title: t('reg.alreadyTitle'),
                text: stKeys[data.status] ? t(stKeys[data.status]) : (data.status || ''),
                note: '',
                short: shortKeys[data.status] ? t(shortKeys[data.status]) : t('trn.alreadyReg')
            };
        }

        if (data && data.error) {
            return {
                tone: 'error', icon: '⛔',
                title: t('reg.blockedTitle'),
                text: errorKeys[data.error] ? t(errorKeys[data.error]) : data.error,
                note: '',
                short: t('reg.shortBlocked')
            };
        }

        if (data && data.status === 'approved') {
            return {
                tone: 'success', icon: '✅',
                title: t('reg.acceptedTitle'),
                text: t('reg.inMainDraw'),
                note: data.reason === 'top_rank' ? t('reg.spotNotLocked') : '',
                short: t('reg.shortInDraw')
            };
        }

        if (data && data.status === 'waitlist') {
            var reasonKeys = {
                no_category: 'reg.noCategory',
                rank_waitlist: 'reg.rankWaitlist',
                draw_full: 'reg.drawFull'
            };
            return {
                tone: 'success', icon: '⏳',
                title: t('reg.reviewTitle'),
                text: reasonKeys[data.reason] ? t(reasonKeys[data.reason]) : t('reg.adminDecides'),
                note: '',
                short: t('reg.shortReview')
            };
        }

        return {
            tone: 'error', icon: '⛔',
            title: t('reg.blockedTitle'),
            text: (data && data.block_reason) || t('reg.blockedGeneric'),
            note: '',
            short: t('reg.shortBlocked')
        };
    }

    function injectStyles() {
        if (document.getElementById('kslt-reg-modal-styles')) return;
        var style = document.createElement('style');
        style.id = 'kslt-reg-modal-styles';
        style.textContent =
            '.mob-reg-overlay{position:fixed;inset:0;background:rgba(0,0,0,0.75);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;padding:20px;opacity:0;transition:opacity .2s ease}' +
            '.mob-reg-overlay.active{opacity:1}' +
            '.mob-reg-modal{background:var(--bg-card,#1a1a1a);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:32px 24px;max-width:400px;width:100%;text-align:center;transform:scale(0.95);transition:transform .2s ease}' +
            '.mob-reg-overlay.active .mob-reg-modal{transform:scale(1)}' +
            '.mob-reg-icon{font-size:2.2rem;line-height:1;margin-bottom:14px}' +
            '.mob-reg-title{font-size:1.15rem;font-weight:700;color:var(--text-primary,#fff);margin:0 0 10px}' +
            '.mob-reg-text{font-size:0.92rem;color:var(--text-muted,#999);line-height:1.5;margin:0}' +
            '.mob-reg-note{margin-top:16px;padding:10px 14px;border-radius:8px;background:rgba(204,255,0,0.07);border:1px solid rgba(204,255,0,0.2);color:var(--text-secondary,#aaa);font-size:0.83rem;line-height:1.45}' +
            '.mob-reg-btn{margin-top:22px;width:100%;padding:13px;border:none;border-radius:10px;font-weight:600;font-size:1rem;cursor:pointer;background:var(--accent,#CCFF00);color:#000}' +
            '.mob-reg-btn.is-error{background:#ff3b30;color:#fff}';
        document.head.appendChild(style);
    }

    /** Показывает модалку с результатом подачи. */
    function showModal(info) {
        injectStyles();
        var old = document.querySelector('.mob-reg-overlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.className = 'mob-reg-overlay';
        overlay.innerHTML =
            '<div class="mob-reg-modal">' +
                '<div class="mob-reg-icon">' + info.icon + '</div>' +
                '<h3 class="mob-reg-title">' + info.title + '</h3>' +
                '<p class="mob-reg-text">' + info.text + '</p>' +
                (info.note ? '<div class="mob-reg-note">' + info.note + '</div>' : '') +
                '<button class="mob-reg-btn' + (info.tone === 'error' ? ' is-error' : '') + '">' +
                    t('common.ok') +
                '</button>' +
            '</div>';

        document.body.appendChild(overlay);
        requestAnimationFrame(function() { overlay.classList.add('active'); });

        function close() {
            overlay.classList.remove('active');
            setTimeout(function() { overlay.remove(); }, 200);
        }
        overlay.querySelector('.mob-reg-btn').addEventListener('click', close);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) close(); });
    }

    /**
     * Подаёт заявку и показывает результат.
     * @returns {Promise<Object>} info; info.created = false, если заявка не создана
     */
    function submit(tournamentId, extra) {
        return call(tournamentId, extra).then(function(reg) {
            var info = resultText(reg.data);
            showModal(info);
            info.created = !(reg.data && reg.data.error && reg.data.error !== 'already_registered');
            return info;
        });
    }

    window.KSLT_REG = {
        call: call,
        resultText: resultText,
        showModal: showModal,
        submit: submit
    };
})();
