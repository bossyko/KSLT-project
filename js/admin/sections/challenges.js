/**
 * Admin Panel — Challenges Section (IIFE)
 * Manage challenge battles: create, publish, enter score
 */
(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // ---- State ----
    var _chalSubTabs = ['pending', 'accepted', 'published', 'completed'];
    var subTab = (function() {
        var params = new URLSearchParams(window.location.search);
        var t = params.get('chalTab');
        return _chalSubTabs.indexOf(t) !== -1 ? t : 'pending';
    })();
    var pendingList = [];
    var acceptedList = [];
    var publishedList = [];
    var completedList = [];
    var allPlayers = [];
    var allCourts = [];

    function buildHourOptions() {
        var html = '';
        for (var h = 0; h < 24; h++) {
            var val = (h < 10 ? '0' : '') + h;
            html += '<option value="' + val + '"' + (h === 10 ? ' selected' : '') + '>' + val + '</option>';
        }
        return html;
    }

    function buildMinuteOptions() {
        var html = '';
        for (var m = 0; m < 60; m += 5) {
            var val = (m < 10 ? '0' : '') + m;
            html += '<option value="' + val + '"' + (m === 0 ? ' selected' : '') + '>' + val + '</option>';
        }
        return html;
    }

    // ---- Entry point ----
    function renderChallengesSection() {
        var container = document.getElementById('ad-challenges');
        if (!container) return;

        container.innerHTML =
            '<div class="ad-section-header" style="display:flex;justify-content:space-between;align-items:center;">' +
                '<h2>' + L.challenges + '</h2>' +
                '<button class="ad-btn ad-btn-accent" id="chalCreateBtn">' + L.chalCreate + '</button>' +
            '</div>' +
            '<div class="ad-rat-tabs" id="chalTabs" style="margin-bottom:20px;">' +
                '<button class="ad-rat-tab' + (subTab === 'pending' ? ' active' : '') + '" data-subtab="pending">' + L.chalPending + '</button>' +
                '<button class="ad-rat-tab' + (subTab === 'accepted' ? ' active' : '') + '" data-subtab="accepted">' + L.chalAccepted + '</button>' +
                '<button class="ad-rat-tab' + (subTab === 'published' ? ' active' : '') + '" data-subtab="published">' + L.chalPublished + '</button>' +
                '<button class="ad-rat-tab' + (subTab === 'completed' ? ' active' : '') + '" data-subtab="completed">' + L.chalCompletedTab + '</button>' +
            '</div>' +
            '<div id="chalContent"></div>';

        document.getElementById('chalCreateBtn').addEventListener('click', function() {
            openCreateBattleModal();
        });

        document.getElementById('chalTabs').addEventListener('click', function(e) {
            var btn = e.target.closest('[data-subtab]');
            if (!btn) return;
            e.stopPropagation();
            subTab = btn.dataset.subtab;
            // Persist subtab in URL
            var url = new URL(window.location);
            url.searchParams.set('chalTab', subTab);
            history.replaceState(null, '', url);
            var tabs = document.querySelectorAll('#chalTabs .ad-rat-tab');
            tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.subtab === subTab); });
            renderSubTab();
        });

        loadData();
    }

    function loadData() {
        // Ensure categories are loaded for NTRP/category fields
        if (A.loadCategories) A.loadCategories();

        Promise.all([
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, proposed_date, proposed_time, proposed_venue, message, created_at')
                .eq('status', 'pending')
                .order('created_at', { ascending: false }),
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue, battle_title, battle_published, battle_published_at, voting_closed, match_id, accepted_at, score_draft')
                .eq('status', 'accepted')
                .eq('battle_published', false)
                .order('accepted_at', { ascending: false }),
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue, battle_title, battle_published, battle_published_at, voting_closed, match_id, accepted_at, battle_notified_at, score_draft, banner_url, proposed_court_id, challenger_ntrp, opponent_ntrp, challenger_country, opponent_country, challenger_category, opponent_category, set_format')
                .eq('battle_published', true)
                .neq('status', 'completed')
                .neq('status', 'cancelled')
                .order('battle_published_at', { ascending: false }),
            A.client.from('players').select('id, name, name_en, photo, ntrp_rating, category_id, country').order('name'),
            A.client.from('courts').select('id, name, name_en, street, street_en, district, district_en, city, city_en').order('name'),
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, battle_title, match_id, accepted_at')
                .in('status', ['completed', 'cancelled'])
                .order('accepted_at', { ascending: false })
        ]).then(function(results) {
            pendingList = results[0].data || [];
            acceptedList = results[1].data || [];
            publishedList = results[2].data || [];
            allPlayers = results[3].data || [];
            allCourts = results[4].data || [];
            completedList = results[5].data || [];

            var pMap = {};
            allPlayers.forEach(function(p) { pMap[p.id] = p; });
            A._chalPlayersMap = pMap;

            renderSubTab();
        });
    }

    function renderSubTab() {
        if (subTab === 'pending') renderPending();
        else if (subTab === 'accepted') renderAccepted();
        else if (subTab === 'published') renderPublished();
        else renderCompleted();
    }

    // ---- Pending challenges (waiting for opponent response) ----
    function renderPending() {
        var el = document.getElementById('chalContent');
        if (!el) return;
        var pMap = A._chalPlayersMap || {};

        if (pendingList.length === 0) {
            el.innerHTML = '<div class="ad-empty-state">' + L.chalNoPending + '</div>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.chalChallenger + '</th>' +
            '<th></th>' +
            '<th>' + L.chalOpponent + '</th>' +
            '<th>' + L.chalDate + '</th>' +
            '<th>' + L.chalVenue + '</th>' +
            '<th>' + (isEn ? 'Sent' : 'Отправлено') + '</th>' +
            '</tr></thead><tbody>';

        pendingList.forEach(function(c) {
            var p1 = pMap[c.challenger_player_id] || {};
            var p2 = pMap[c.opponent_player_id] || {};
            var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
            var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
            var date = c.proposed_date || '';
            var time = c.proposed_time || '';
            var venue = c.proposed_venue || '-';
            var sentAt = c.created_at ? formatDate(c.created_at.split('T')[0]) : '-';

            html += '<tr>' +
                '<td>' + A.esc(p1Name) + '</td>' +
                '<td style="text-align:center;font-weight:700;color:var(--text-dim);">⚔️</td>' +
                '<td>' + A.esc(p2Name) + '</td>' +
                '<td>' + formatDate(date) + (time ? ' ' + time : '') + '</td>' +
                '<td>' + A.esc(venue) + '</td>' +
                '<td>' + sentAt + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        el.innerHTML = html;
    }

    // ---- Accepted challenges (not yet published) ----
    function renderAccepted() {
        var el = document.getElementById('chalContent');
        if (!el) return;
        var pMap = A._chalPlayersMap || {};

        if (acceptedList.length === 0) {
            el.innerHTML = '<div class="ad-empty-state">' + L.chalNoAccepted + '</div>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.chalChallenger + '</th>' +
            '<th></th>' +
            '<th>' + L.chalOpponent + '</th>' +
            '<th>' + L.chalDate + '</th>' +
            '<th>' + L.chalVenue + '</th>' +
            '<th>' + L.chalActions + '</th>' +
            '</tr></thead><tbody>';

        acceptedList.forEach(function(c) {
            var p1 = pMap[c.challenger_player_id] || {};
            var p2 = pMap[c.opponent_player_id] || {};
            var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
            var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
            var date = c.counter_date || c.proposed_date || '';
            var venue = c.counter_venue || c.proposed_venue || '';

            html += '<tr>' +
                '<td>' + A.esc(p1Name) + '</td>' +
                '<td style="text-align:center;font-weight:700;color:var(--accent);">VS</td>' +
                '<td>' + A.esc(p2Name) + '</td>' +
                '<td>' + formatDate(date) + '</td>' +
                '<td>' + A.esc(venue || '-') + '</td>' +
                '<td><div style="display:flex;gap:6px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-sm ad-btn-accent" data-publish="' + c.id + '">' + L.chalPublish + '</button>' +
                    '<button class="ad-btn ad-btn-sm ad-btn-danger" data-delete="' + c.id + '" title="' + L.chalDelete + '">🗑</button>' +
                '</div></td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        el.innerHTML = html;

        el.querySelectorAll('[data-publish]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                openPublishModal(btn.dataset.publish);
            });
        });

        el.querySelectorAll('[data-delete]').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var cId = btn.dataset.delete;
                var ok = await A.showConfirmAsync(L.chalDelete, L.chalConfirmDelete, L.chalDelete);
                if (!ok) return;
                try {
                    await A.client.from('challenge_predictions').delete().eq('challenge_id', cId);
                    var res = await A.client.from('challenges').delete().eq('id', cId);
                    if (res.error) { A.showToast(res.error.message, 'error'); return; }
                    A.showToast(L.chalDeleted, 'success');
                    loadData();
                } catch (e) {
                    A.showToast('Error: ' + e.message, 'error');
                }
            });
        });
    }

    // ---- Published battles ----
    function renderPublished() {
        var el = document.getElementById('chalContent');
        if (!el) return;
        var pMap = A._chalPlayersMap || {};

        if (publishedList.length === 0) {
            el.innerHTML = '<div class="ad-empty-state">' + L.chalNoPublished + '</div>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.chalBattleTitle + '</th>' +
            '<th>' + L.chalChallenger + '</th>' +
            '<th>' + L.chalOpponent + '</th>' +
            '<th>' + L.chalVotes + '</th>' +
            '<th>' + L.chalStatus + '</th>' +
            '<th>' + L.chalBroadcast + '</th>' +
            '<th>' + L.chalActions + '</th>' +
            '</tr></thead><tbody>';

        publishedList.forEach(function(c) {
            var p1 = pMap[c.challenger_player_id] || {};
            var p2 = pMap[c.opponent_player_id] || {};
            var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
            var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

            var statusBadge = c.status === 'completed'
                ? '<span class="ad-badge ad-badge-green">' + L.chalCompleted + '</span>'
                : (c.voting_closed
                    ? '<span class="ad-badge ad-badge-yellow">' + L.chalVotingClosed + '</span>'
                    : '<span class="ad-badge ad-badge-blue">' + L.chalAccepted + '</span>');

            // Broadcast status
            var notified = !!c.battle_notified_at;
            var broadcastCell = '';
            if (c.status === 'completed') {
                broadcastCell = notified
                    ? '<span class="ad-badge ad-badge-green" title="' + A.fmtDate(c.battle_notified_at) + '">✅ ' + L.chalNotified + '</span>'
                    : '<span class="ad-badge" style="opacity:0.5;">—</span>';
            } else {
                broadcastCell = notified
                    ? '<span class="ad-badge ad-badge-green" title="' + A.fmtDate(c.battle_notified_at) + '">✅ ' + L.chalNotified + '</span><br><button class="ad-btn ad-btn-sm" data-notify="' + c.id + '" style="margin-top:4px;font-size:0.7rem;" title="' + L.chalNotify + '">📢 ' + (isEn ? 'Resend' : 'Повторить') + '</button>'
                    : '<button class="ad-btn ad-btn-sm" data-notify="' + c.id + '" title="' + L.chalNotify + '">📢 ' + L.chalNotify + '</button>';
            }

            var actions = '<div style="display:flex;gap:6px;align-items:center;width:100%;justify-content:space-between;">';
            if (c.status !== 'completed') {
                actions += '<button class="ad-btn ad-btn-sm" data-edit="' + c.id + '" title="' + L.chalEdit + '">✏️</button>';
                actions += '<button class="ad-btn ad-btn-sm ad-btn--accent" data-score="' + c.id + '">' + L.chalEnterScore + '</button>';
            }
            actions += '<button class="ad-btn ad-btn-sm" data-delete="' + c.id + '" title="' + L.chalDelete + '" style="color:#f44336;border-color:rgba(244,67,54,0.3);margin-left:auto;">🗑</button>';
            actions += '</div>';

            html += '<tr>' +
                '<td><a href="../pages/challenge.html?id=' + c.id + '" target="_blank" style="color:var(--accent);font-weight:600;text-decoration:none;">' + A.esc(c.battle_title || '-') + '</a></td>' +
                '<td>' + A.esc(p1Name) + '</td>' +
                '<td>' + A.esc(p2Name) + '</td>' +
                '<td id="chalVotes_' + c.id + '">...</td>' +
                '<td>' + statusBadge + '</td>' +
                '<td style="text-align:center;">' + broadcastCell + '</td>' +
                '<td>' + actions + '</td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        el.innerHTML = html;

        // Load votes (show as "X : Y")
        publishedList.forEach(function(c) {
            A.client.rpc('get_battle_votes', { p_challenge_id: c.id }).then(function(res) {
                var cell = document.getElementById('chalVotes_' + c.id);
                if (!cell) return;
                var vm = {};
                (res.data || []).forEach(function(v) { vm[v.player_id] = parseInt(v.votes) || 0; });
                var v1 = vm[c.challenger_player_id] || 0;
                var v2 = vm[c.opponent_player_id] || 0;
                cell.innerHTML = '<strong>' + v1 + '</strong> : <strong>' + v2 + '</strong>';
            });
        });

        el.querySelectorAll('[data-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cId = btn.dataset.edit;
                var challenge = publishedList.find(function(c) { return c.id === cId; });
                if (challenge) openEditBattleModal(challenge);
            });
        });

        el.querySelectorAll('[data-score]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cId = btn.dataset.score;
                var challenge = publishedList.find(function(c) { return c.id === cId; });
                if (challenge) openScoreModal(challenge);
            });
        });

        el.querySelectorAll('[data-notify]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cId = btn.dataset.notify;
                var challenge = publishedList.find(function(c) { return c.id === cId; });
                if (challenge) openNotifyModal(challenge);
            });
        });

        el.querySelectorAll('[data-delete]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cId = btn.dataset.delete;
                var challenge = publishedList.find(function(c) { return c.id === cId; });
                if (challenge) openDeleteOrCancelModal(challenge);
            });
        });
    }

    // ---- Completed battles ----
    function renderCompleted() {
        var el = document.getElementById('chalContent');
        if (!el) return;
        var pMap = A._chalPlayersMap || {};

        if (completedList.length === 0) {
            el.innerHTML = '<div class="ad-empty-state">' + L.chalNoCompleted + '</div>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.chalBattleTitle + '</th>' +
            '<th>' + L.chalChallenger + '</th>' +
            '<th>' + L.chalOpponent + '</th>' +
            '<th>' + L.chalScore + '</th>' +
            '<th>' + L.chalWinner + '</th>' +
            '<th>' + L.chalDate + '</th>' +
            '<th>' + L.chalActions + '</th>' +
            '</tr></thead><tbody>';

        completedList.forEach(function(c) {
            var p1 = pMap[c.challenger_player_id] || {};
            var p2 = pMap[c.opponent_player_id] || {};
            var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
            var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
            var date = c.accepted_at ? formatDate(c.accepted_at) : '-';
            var titleExtra = c.status === 'cancelled' ? ' <span class="ad-badge ad-badge-yellow">' + L.chalCancelledBadge + '</span>' : '';

            html += '<tr>' +
                '<td><a href="../pages/challenge.html?id=' + c.id + '" target="_blank" style="color:var(--accent);font-weight:600;text-decoration:none;">' + A.esc(c.battle_title || '-') + '</a>' + titleExtra + '</td>' +
                '<td>' + A.esc(p1Name) + '</td>' +
                '<td>' + A.esc(p2Name) + '</td>' +
                '<td id="chalCScore_' + c.id + '">' + (c.status === 'cancelled' ? '—' : '...') + '</td>' +
                '<td id="chalCWinner_' + c.id + '">' + (c.status === 'cancelled' ? '—' : '...') + '</td>' +
                '<td>' + date + '</td>' +
                '<td><button class="ad-btn ad-btn-sm ad-btn-danger" data-delete-completed="' + c.id + '" title="' + L.chalDeleteForever + '">🗑</button></td>' +
                '</tr>';
        });

        html += '</tbody></table>';
        el.innerHTML = html;

        // Load match data for score + winner
        completedList.forEach(function(c) {
            if (!c.match_id || c.status === 'cancelled') return;
            A.client.from('matches').select('score, winner_id').eq('id', c.match_id).single().then(function(res) {
                if (!res.data) return;
                var scoreCell = document.getElementById('chalCScore_' + c.id);
                var winnerCell = document.getElementById('chalCWinner_' + c.id);
                if (scoreCell) scoreCell.textContent = (res.data.score || '-').replace(/\//g, ':');
                if (winnerCell) {
                    var wp = pMap[res.data.winner_id] || {};
                    winnerCell.innerHTML = '<strong style="color:var(--accent);">' + A.esc(isEn ? (wp.name_en || wp.name || '?') : (wp.name || '?')) + '</strong>';
                }
            });
        });

        // Delete completed battle buttons
        el.querySelectorAll('[data-delete-completed]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var cId = btn.dataset.deleteCompleted;
                var c = completedList.find(function(x) { return x.id === cId; });
                if (!c) return;
                var p1 = pMap[c.challenger_player_id] || {};
                var p2 = pMap[c.opponent_player_id] || {};
                var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
                var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
                openDeleteCompletedModal(c, p1Name, p2Name);
            });
        });
    }

    // ==== DELETE COMPLETED BATTLE (full cleanup) ====
    function openDeleteCompletedModal(challenge, p1Name, p2Name) {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:440px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalDeleteForever + '</h3>' +
                    '<button class="ad-modal-close" id="dcCompClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="text-align:center;margin-bottom:16px;padding:14px;background:var(--bg-tertiary);border-radius:10px;border:1px solid var(--border);">' +
                        '<div style="font-weight:700;font-size:15px;">⚔️ ' + A.esc(challenge.battle_title || '-') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:13px;margin-top:6px;">' + A.esc(p1Name) + ' <span style="color:var(--accent);font-weight:600;">VS</span> ' + A.esc(p2Name) + '</div>' +
                    '</div>' +
                    '<p style="color:#f44336;font-size:13px;line-height:1.5;margin-bottom:12px;text-align:center;">' +
                        (isEn
                            ? 'This will permanently delete the battle, all votes, the match record, and revert player win/loss stats.'
                            : 'Баттл, все голоса, запись матча и статистика побед/поражений игроков будут удалены навсегда.') +
                    '</p>' +
                '</div>' +
                '<div class="ad-modal-footer" style="display:flex;gap:10px;justify-content:center;">' +
                    '<button class="ad-btn" id="dcCompCancel">' + (isEn ? 'Cancel' : 'Отмена') + '</button>' +
                    '<button class="ad-btn ad-btn-danger" id="dcCompConfirm">' + L.chalDeleteForever + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('dcCompClose').addEventListener('click', function() { overlay.remove(); });
        document.getElementById('dcCompCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('dcCompConfirm').addEventListener('click', async function() {
            var btn = document.getElementById('dcCompConfirm');
            btn.disabled = true;
            btn.textContent = isEn ? 'Deleting...' : 'Удаление...';

            try {
                // 1. Убрать сам матч. Откатывать победы и поражения больше
                // нечего: баттл не рейтинговая игра и в статистику не идёт
                if (challenge.match_id && challenge.status === 'completed') {
                    await A.client.from('matches').delete().eq('id', challenge.match_id);
                }

                // 2. Delete predictions (votes)
                await A.client.from('challenge_predictions').delete().eq('challenge_id', challenge.id);

                // 3. Delete challenge
                var res = await A.client.from('challenges').delete().eq('id', challenge.id);
                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    btn.disabled = false;
                    btn.textContent = L.chalDeleteForever;
                    return;
                }

                overlay.remove();
                A.showToast(L.chalDeleted, 'success');
                loadData();
            } catch (e) {
                console.error('Delete completed battle error:', e);
                A.showToast('Error: ' + e.message, 'error');
                btn.disabled = false;
                btn.textContent = L.chalDeleteForever;
            }
        });
    }

    // ==== CREATE BATTLE MODAL ====
    function openCreateBattleModal() {
        var sel1 = { id: null, name: '', ntrp: '', country: '', category: '' };
        var sel2 = { id: null, name: '', ntrp: '', country: '', category: '' };
        var selCourt = { id: null, name: '', address: '' };
        var bannerUrl = '';

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:540px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalCreate + '</h3>' +
                    '<button class="ad-modal-close" id="cbClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body" style="max-height:70vh;overflow-y:auto;">' +
                    // Player 1
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalPlayer1 + '</label>' +
                        '<div style="position:relative;">' +
                            '<input type="text" class="ad-field-input" id="cbP1Input" placeholder="' + L.chalSearchPlayer + '" autocomplete="off">' +
                            '<div class="ad-dropdown-list" id="cbP1Dropdown" style="display:none;"></div>' +
                        '</div>' +
                        '<div id="cbP1Selected" class="ad-chal-selected-hint"></div>' +
                        '<div style="display:flex;gap:8px;margin-top:6px;">' +
                            '<select class="ad-field-input" id="cbP1Ntrp" style="width:100px;flex:0 0 100px;">' + A.ntrpOptions(null, { emptyLabel: 'NTRP' }) + '</select>' +
                            '<select class="ad-field-input" id="cbP1Cat" style="flex:0 0 auto;max-width:140px;">' + buildCategoryOptions('') + '</select>' +
                            '<div style="flex:1;min-width:0;position:relative;">' +
                                '<input type="text" class="ad-field-input" id="cbP1CountryInput" placeholder="' + L.chalCountry + '" autocomplete="off" style="text-overflow:ellipsis;">' +
                                '<input type="hidden" id="cbP1Country">' +
                                '<div class="ad-dropdown-list" id="cbP1CountryDd" style="display:none;"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Player 2
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalPlayer2 + '</label>' +
                        '<div style="position:relative;">' +
                            '<input type="text" class="ad-field-input" id="cbP2Input" placeholder="' + L.chalSearchPlayer + '" autocomplete="off">' +
                            '<div class="ad-dropdown-list" id="cbP2Dropdown" style="display:none;"></div>' +
                        '</div>' +
                        '<div id="cbP2Selected" class="ad-chal-selected-hint"></div>' +
                        '<div style="display:flex;gap:8px;margin-top:6px;">' +
                            '<select class="ad-field-input" id="cbP2Ntrp" style="width:100px;flex:0 0 100px;">' + A.ntrpOptions(null, { emptyLabel: 'NTRP' }) + '</select>' +
                            '<select class="ad-field-input" id="cbP2Cat" style="flex:0 0 auto;max-width:140px;">' + buildCategoryOptions('') + '</select>' +
                            '<div style="flex:1;min-width:0;position:relative;">' +
                                '<input type="text" class="ad-field-input" id="cbP2CountryInput" placeholder="' + L.chalCountry + '" autocomplete="off" style="text-overflow:ellipsis;">' +
                                '<input type="hidden" id="cbP2Country">' +
                                '<div class="ad-dropdown-list" id="cbP2CountryDd" style="display:none;"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Title
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalBattleTitle + '</label>' +
                        '<input type="text" class="ad-field-input" id="cbTitle" placeholder="' + (isEn ? 'e.g. Derby of Champions' : 'напр. Дерби Чемпионов') + '" maxlength="100">' +
                    '</div>' +
                    // Date + Time
                    '<div style="display:flex;gap:12px;">' +
                        '<div class="ad-field-group" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.chalDate + '</label>' +
                            '<input type="date" class="ad-field-input" id="cbDate">' +
                        '</div>' +
                        '<div class="ad-field-group" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.chalTime + '</label>' +
                            '<div style="display:flex;gap:6px;align-items:center;">' +
                                '<select class="ad-field-input" id="cbTimeH" style="flex:1;">' + buildHourOptions() + '</select>' +
                                '<span style="color:var(--text-dim);font-weight:700;">:</span>' +
                                '<select class="ad-field-input" id="cbTimeM" style="flex:1;">' + buildMinuteOptions() + '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Set Format
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + (isEn ? 'Set Format' : 'Формат сетов') + '</label>' +
                        '<select class="ad-field-input" id="cbSetFormat">' +
                            '<option value="standard">' + L.formatStandard + '</option>' +
                            '<option value="short">' + L.formatShort + '</option>' +
                        '</select>' +
                    '</div>' +
                    // Court / Club
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalCourtOrClub + '</label>' +
                        '<div style="position:relative;">' +
                            '<input type="text" class="ad-field-input" id="cbCourtInput" placeholder="' + L.chalSearchCourt + '" autocomplete="off">' +
                            '<div class="ad-dropdown-list" id="cbCourtDropdown" style="display:none;"></div>' +
                        '</div>' +
                        '<div id="cbCourtSelected" class="ad-chal-selected-hint"></div>' +
                    '</div>' +
                    // Address
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalAddress + '</label>' +
                        '<input type="text" class="ad-field-input" id="cbAddress" placeholder="' + (isEn ? 'Auto-filled from court or enter manually' : 'Автозаполнение из корта или введите вручную') + '">' +
                    '</div>' +
                    // Banner
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalBanner + '</label>' +
                        '<div class="ad-chal-banner-row">' +
                            '<input type="file" id="cbBannerFile" accept="image/*" style="display:none;">' +
                            '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="cbBannerBtn">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ' +
                                L.chalUploadBanner +
                            '</button>' +
                            '<span id="cbBannerName" class="ad-chal-banner-name"></span>' +
                            '<div id="cbBannerPreview" class="ad-chal-banner-preview" style="display:none;">' +
                                '<img id="cbBannerImg">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-accent" id="cbSave">' + L.chalCreate + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Close
        document.getElementById('cbClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Player search setup with autofill
        setupPlayerSearch('cbP1Input', 'cbP1Dropdown', 'cbP1Selected', function(p) {
            sel1 = { id: p.id, name: p.name, ntrp: sel1.ntrp, country: sel1.country, category: sel1.category };
            if (p._player) {
                autofillPlayerExtras(p._player, 'cbP1Ntrp', 'cbP1Cat', 'cbP1Country', 'cbP1CountryInput', sel1);
            }
        });
        setupPlayerSearch('cbP2Input', 'cbP2Dropdown', 'cbP2Selected', function(p) {
            sel2 = { id: p.id, name: p.name, ntrp: sel2.ntrp, country: sel2.country, category: sel2.category };
            if (p._player) {
                autofillPlayerExtras(p._player, 'cbP2Ntrp', 'cbP2Cat', 'cbP2Country', 'cbP2CountryInput', sel2);
            }
        });

        // Country search inputs
        setupCountryInput('cbP1CountryInput', 'cbP1Country', 'cbP1CountryDd');
        setupCountryInput('cbP2CountryInput', 'cbP2Country', 'cbP2CountryDd');

        // Court search setup
        setupCourtSearch(function(court) {
            selCourt = court;
            if (court.address) {
                document.getElementById('cbAddress').value = court.address;
            }
        });

        // Banner upload — custom button triggers hidden file input
        document.getElementById('cbBannerBtn').addEventListener('click', function() {
            document.getElementById('cbBannerFile').click();
        });
        document.getElementById('cbBannerFile').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            document.getElementById('cbBannerName').textContent = file.name;
            var reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('cbBannerImg').src = ev.target.result;
                document.getElementById('cbBannerPreview').style.display = '';
            };
            reader.readAsDataURL(file);
            if (A.uploadImage) {
                A.uploadImage(file, 'battles').then(function(url) {
                    if (url) bannerUrl = url;
                });
            }
        });

        // Save
        document.getElementById('cbSave').addEventListener('click', function() {
            var title = document.getElementById('cbTitle').value.trim();
            var date = document.getElementById('cbDate').value;
            var timeH = document.getElementById('cbTimeH').value;
            var timeM = document.getElementById('cbTimeM').value;
            var time = timeH + ':' + timeM;
            var courtName = document.getElementById('cbCourtInput').value.trim();
            var address = document.getElementById('cbAddress').value.trim();
            var venue = courtName + (address ? ', ' + address : '');

            // Auto-capture typed names if not selected from dropdown
            if (!sel1.name) {
                var typed1 = document.getElementById('cbP1Input').value.trim();
                if (typed1) sel1 = { id: null, name: typed1, ntrp: '', country: '', category: '' };
            }
            if (!sel2.name) {
                var typed2 = document.getElementById('cbP2Input').value.trim();
                if (typed2) sel2 = { id: null, name: typed2, ntrp: '', country: '', category: '' };
            }

            if (!sel1.name || !sel2.name) {
                A.showToast(L.chalSelectPlayer, 'error');
                return;
            }
            if (!title) {
                document.getElementById('cbTitle').focus();
                return;
            }

            // Read extra fields
            sel1.ntrp = document.getElementById('cbP1Ntrp').value || '';
            sel1.category = document.getElementById('cbP1Cat').value || '';
            sel1.country = document.getElementById('cbP1Country').value || '';
            sel2.ntrp = document.getElementById('cbP2Ntrp').value || '';
            sel2.category = document.getElementById('cbP2Cat').value || '';
            sel2.country = document.getElementById('cbP2Country').value || '';

            var setFormat = document.getElementById('cbSetFormat').value || 'standard';

            var btn = document.getElementById('cbSave');
            btn.disabled = true;
            btn.textContent = L.chalCreating;

            createBattle(sel1, sel2, title, date, time, venue, bannerUrl, selCourt.id, setFormat).then(function(ok) {
                overlay.remove();
                if (ok) {
                    A.showToast(L.chalCreated, 'success');
                    subTab = 'published';
                    loadData();
                }
            });
        });
    }

    // ---- Player search dropdown ----
    function setupPlayerSearch(inputId, dropdownId, selectedId, onSelect) {
        var input = document.getElementById(inputId);
        var dropdown = document.getElementById(dropdownId);
        var selectedEl = document.getElementById(selectedId);
        if (!input || !dropdown) return;

        var debounce = null;

        input.addEventListener('input', function() {
            clearTimeout(debounce);
            var q = input.value.trim().toLowerCase();
            if (q.length < 1) { dropdown.style.display = 'none'; return; }

            debounce = setTimeout(function() {
                var matches = allPlayers.filter(function(p) {
                    var n = (p.name || '').toLowerCase();
                    var ne = (p.name_en || '').toLowerCase();
                    return n.indexOf(q) !== -1 || ne.indexOf(q) !== -1;
                }).slice(0, 8);

                var html = '';
                matches.forEach(function(p) {
                    var pName = isEn ? (p.name_en || p.name) : p.name;
                    html += '<div class="ad-dropdown-item" data-pid="' + p.id + '">' +
                        (p.photo ? '<img src="' + A.esc(p.photo) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:8px;">' : '<span style="width:24px;height:24px;border-radius:50%;background:var(--bg-tertiary);display:inline-flex;align-items:center;justify-content:center;margin-right:8px;font-size:11px;">?</span>') +
                        A.esc(pName) +
                    '</div>';
                });

                var typed = input.value.trim();
                if (typed.length >= 2) {
                    html += '<div class="ad-dropdown-item ad-dropdown-manual" data-manual="' + A.esc(typed) + '">' +
                        '+ ' + L.chalAddManual + ': <strong> ' + A.esc(typed) + '</strong>' +
                    '</div>';
                }

                dropdown.innerHTML = html;
                dropdown.style.display = html ? '' : 'none';

                dropdown.querySelectorAll('.ad-dropdown-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var pid = item.dataset.pid;
                        var manual = item.dataset.manual;
                        if (pid) {
                            var p = allPlayers.find(function(pl) { return pl.id === pid; });
                            if (p) {
                                var pName = isEn ? (p.name_en || p.name) : p.name;
                                input.value = pName;
                                selectedEl.textContent = pName + ' (ID: ' + p.id + ')';
                                onSelect({ id: p.id, name: pName, _player: p });
                            }
                        } else if (manual) {
                            input.value = manual;
                            selectedEl.innerHTML = manual + ' <span style="color:var(--text-secondary);font-size:11px;">(' + L.chalAddManual + ')</span>';
                            onSelect({ id: null, name: manual });
                        }
                        dropdown.style.display = 'none';
                    });
                });
            }, 200);
        });

        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // ---- Court search dropdown ----
    function setupCourtSearch(onSelect) {
        var input = document.getElementById('cbCourtInput');
        var dropdown = document.getElementById('cbCourtDropdown');
        var selectedEl = document.getElementById('cbCourtSelected');
        if (!input || !dropdown) return;

        var debounce = null;

        input.addEventListener('input', function() {
            clearTimeout(debounce);
            var q = input.value.trim().toLowerCase();
            if (q.length < 1) { dropdown.style.display = 'none'; return; }

            debounce = setTimeout(function() {
                var matches = allCourts.filter(function(c) {
                    var n = (c.name || '').toLowerCase();
                    var ne = (c.name_en || '').toLowerCase();
                    return n.indexOf(q) !== -1 || ne.indexOf(q) !== -1;
                }).slice(0, 6);

                var html = '';
                matches.forEach(function(c) {
                    var cName = isEn ? (c.name_en || c.name) : c.name;
                    var addr = buildCourtAddress(c);
                    html += '<div class="ad-dropdown-item" data-cid="' + c.id + '">' +
                        '<div>' +
                            '<div style="font-weight:500;">' + A.esc(cName) + '</div>' +
                            (addr ? '<div style="font-size:11px;color:var(--text-secondary);margin-top:2px;">' + A.esc(addr) + '</div>' : '') +
                        '</div>' +
                    '</div>';
                });

                var typed = input.value.trim();
                if (typed.length >= 2) {
                    html += '<div class="ad-dropdown-item ad-dropdown-manual" data-manual="' + A.esc(typed) + '">' +
                        '+ ' + L.chalAddManual + ': <strong> ' + A.esc(typed) + '</strong>' +
                    '</div>';
                }

                dropdown.innerHTML = html;
                dropdown.style.display = html ? '' : 'none';

                dropdown.querySelectorAll('.ad-dropdown-item').forEach(function(item) {
                    item.addEventListener('click', function() {
                        var cid = item.dataset.cid;
                        var manual = item.dataset.manual;
                        if (cid) {
                            var c = allCourts.find(function(ct) { return ct.id === cid; });
                            if (c) {
                                var cName = isEn ? (c.name_en || c.name) : c.name;
                                var addr = buildCourtAddress(c);
                                input.value = cName;
                                selectedEl.textContent = cName;
                                onSelect({ id: c.id, name: cName, address: addr });
                            }
                        } else if (manual) {
                            input.value = manual;
                            selectedEl.innerHTML = manual + ' <span style="color:var(--text-secondary);font-size:11px;">(' + L.chalAddManual + ')</span>';
                            onSelect({ id: null, name: manual, address: '' });
                        }
                        dropdown.style.display = 'none';
                    });
                });
            }, 200);
        });

        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    function buildCourtAddress(court) {
        var parts = [];
        if (isEn) {
            if (court.street_en || court.street) parts.push(court.street_en || court.street);
            if (court.district_en || court.district) parts.push(court.district_en || court.district);
            if (court.city_en || court.city) parts.push(court.city_en || court.city);
        } else {
            if (court.street) parts.push(court.street);
            if (court.district) parts.push(court.district);
            if (court.city) parts.push(court.city);
        }
        return parts.join(', ');
    }

    // ---- Create battle (insert player if manual + challenge) ----
    function createBattle(p1, p2, title, date, time, venue, bannerUrl, courtId, setFormat) {
        return ensurePlayer(p1).then(function(p1Id) {
            return ensurePlayer(p2).then(function(p2Id) {
                var adminId = A.currentUserId;
                return A.client.from('challenges').insert({
                    challenger_id: adminId,
                    challenger_player_id: p1Id,
                    opponent_player_id: p2Id,
                    opponent_profile_id: null,
                    proposed_date: date || new Date().toISOString().slice(0, 10),
                    proposed_time: time || '18:00',
                    proposed_venue: venue || null,
                    proposed_court_id: courtId || null,
                    status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    battle_title: title,
                    battle_published: true,
                    battle_published_at: new Date().toISOString(),
                    voting_closed: false,
                    banner_url: bannerUrl || null,
                    challenger_ntrp: p1.ntrp ? parseFloat(p1.ntrp) : null,
                    opponent_ntrp: p2.ntrp ? parseFloat(p2.ntrp) : null,
                    challenger_country: p1.country || null,
                    opponent_country: p2.country || null,
                    challenger_category: p1.category || null,
                    opponent_category: p2.category || null,
                    set_format: setFormat || 'standard'
                }).select('id').single();
            });
        }).then(function(res) {
            if (res.error) {
                console.error('Create battle error:', res.error);
                A.showToast(res.error.message, 'error');
                return false;
            }
            return true;
        }).catch(function(err) {
            console.error('Create battle error:', err);
            A.showToast('Error creating battle', 'error');
            return false;
        });
    }

    function ensurePlayer(p) {
        if (p.id) return Promise.resolve(p.id);

        var slug = A.slugify(p.name);
        var id = slug + '-' + Math.random().toString(36).slice(2, 6);

        return A.client.from('players').insert({
            id: id,
            name: p.name,
            name_en: p.name,
            points: 0,
            wins: 0,
            losses: 0,
            rank_change: 0,
            form: [],
            show_phone: false
        }).select('id').single().then(function(res) {
            if (res.error) {
                console.error('Create player error:', res.error);
                throw new Error(res.error.message);
            }
            allPlayers.push({ id: res.data.id, name: p.name, name_en: p.name, photo: null });
            A._chalPlayersMap[res.data.id] = { id: res.data.id, name: p.name, name_en: p.name };
            return res.data.id;
        });
    }

    // ---- Publish Modal ----
    function openPublishModal(challengeId) {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:450px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalPublish + '</h3>' +
                    '<button class="ad-modal-close" id="chalPublishClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalBattleTitle + '</label>' +
                        '<input type="text" class="ad-field-input" id="chalTitleInput" placeholder="' + (isEn ? 'e.g. Derby of Champions' : 'напр. Дерби Чемпионов') + '" maxlength="100">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-accent" id="chalPublishBtn">' + L.chalPublish + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('chalPublishClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('chalPublishBtn').addEventListener('click', function() {
            var title = document.getElementById('chalTitleInput').value.trim();
            if (!title) { document.getElementById('chalTitleInput').focus(); return; }
            var btn = document.getElementById('chalPublishBtn');
            btn.disabled = true;
            btn.textContent = L.chalPublishing;

            publishBattle(challengeId, title).then(function(ok) {
                overlay.remove();
                if (ok) { A.showToast(L.chalPublished2); loadData(); }
            });
        });
    }

    function publishBattle(challengeId, title) {
        return A.client.auth.getSession().then(function(sRes) {
            var token = sRes.data.session ? sRes.data.session.access_token : '';
            return fetch(window.SUPABASE_URL + '/functions/v1/battle-publish', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': 'Bearer ' + token,
                    'apikey': window.SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ challenge_id: challengeId, title: title })
            });
        }).then(function(res) { return res.json(); }).then(function(data) {
            if (data.error) { A.showToast(data.error); return false; }
            return true;
        }).catch(function(err) {
            console.error('Publish error:', err);
            A.showToast('Error publishing');
            return false;
        });
    }

    // ---- Score Modal ----
    function isValidSet(a, b, format) {
        a = parseInt(a); b = parseInt(b);
        if (isNaN(a) || isNaN(b)) return false;
        if (format === 'short') {
            if (a < 0 || b < 0 || a > 6 || b > 6) return false;
            if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
            if ((a === 6 && b === 5) || (b === 6 && a === 5)) return true;
            return false;
        }
        if (a < 0 || b < 0 || a > 7 || b > 7) return false;
        if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
        if ((a === 7 && b === 5) || (b === 7 && a === 5)) return true;
        if ((a === 7 && b === 6) || (b === 7 && a === 6)) return true;
        return false;
    }

    function isTiebreakScore(v1, v2, format) {
        if (format === 'short') return (v1 === 6 && v2 === 5) || (v1 === 5 && v2 === 6);
        return (v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7);
    }

    function openScoreModal(challenge) {
        var pMap = A._chalPlayersMap || {};
        var p1 = pMap[challenge.challenger_player_id] || {};
        var p2 = pMap[challenge.opponent_player_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');
        var _setFormat = challenge.set_format || 'standard';

        // Parse score_draft or existing match score to pre-fill
        var sv = [['','','',''],['','','',''],['','','','']];
        var visibleSets = 2;
        var draft = challenge.score_draft || '';
        if (draft) {
            var parsed = parseScoreToSets(draft);
            sv = parsed.sets;
            visibleSets = parsed.count;
        }

        function setRowHtml(setNum, vals) {
            var id1 = 'chS' + setNum + 'P1';
            var id2 = 'chS' + setNum + 'P2';
            var idTB1 = 'chS' + setNum + 'TB1';
            var idTB2 = 'chS' + setNum + 'TB2';
            var showTB = isTiebreakScore(parseInt(vals[0]) || 0, parseInt(vals[1]) || 0, _setFormat);
            return '<div class="ad-score-set-row" data-set="' + setNum + '" id="chSetRow' + setNum + '"' +
                (setNum > visibleSets ? ' style="display:none"' : '') + '>' +
                '<label class="ad-field-label" style="min-width:40px;">' + L.chalSet + ' ' + setNum + '</label>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id1 + '" value="' + vals[0] + '">' +
                '<span style="font-weight:600;">:</span>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id2 + '" value="' + vals[1] + '">' +
                '<span class="ad-tb-wrap" id="' + idTB1 + 'Wrap"' + (showTB ? '' : ' style="display:none;"') + '>' +
                    '<span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">' + L.chalTiebreak + '</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB1 + '" value="' + vals[2] + '">' +
                    '<span style="font-weight:600;font-size:11px;">:</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB2 + '" value="' + vals[3] + '">' +
                '</span>' +
            '</div>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:420px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalScoreTitle + '</h3>' +
                    '<button class="ad-modal-close" id="chScoreClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="text-align:center;margin-bottom:16px;">' +
                        '<div style="font-weight:600;">' + A.esc(p1Name) + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:12px;margin:4px 0;">VS</div>' +
                        '<div style="font-weight:600;">' + A.esc(p2Name) + '</div>' +
                        '<div style="font-size:11px;color:var(--text-dim);margin-top:6px;">' + (_setFormat === 'short' ? L.formatShort : L.formatStandard) + '</div>' +
                    '</div>' +
                    setRowHtml(1, sv[0]) +
                    setRowHtml(2, sv[1]) +
                    setRowHtml(3, sv[2]) +
                    '<div style="display:flex;gap:8px;margin:12px 0;">' +
                        '<button class="ad-btn ad-btn-sm" id="chAddSet">' + L.chalAddSet + '</button>' +
                        '<button class="ad-btn ad-btn-sm" id="chRemoveSet">' + L.chalRemoveSet + '</button>' +
                    '</div>' +
                    '<div id="chWinnerDisplay" style="text-align:center;margin:12px 0;font-weight:600;color:var(--accent);"></div>' +
                '</div>' +
                '<div class="ad-modal-footer" style="display:flex;gap:10px;">' +
                    '<button class="ad-btn" id="chSaveDraft">' + L.chalSaveDraft + '</button>' +
                    '<button class="ad-btn ad-btn-accent" id="chFinalizeScore">' + L.chalFinalize + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('chScoreClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('chAddSet').addEventListener('click', function() {
            if (visibleSets < 3) { visibleSets++; var row = document.getElementById('chSetRow' + visibleSets); if (row) row.style.display = ''; }
        });
        document.getElementById('chRemoveSet').addEventListener('click', function() {
            if (visibleSets > 1) {
                var row = document.getElementById('chSetRow' + visibleSets);
                if (row) { row.style.display = 'none'; row.querySelectorAll('input').forEach(function(inp) { inp.value = ''; }); }
                visibleSets--;
                updateWinnerDisplay();
            }
        });

        overlay.querySelectorAll('.ad-set-game').forEach(function(inp) {
            inp.addEventListener('input', function() {
                var v = inp.value.replace(/\D/g, '');
                if (v.length > 1) v = v[0];
                inp.value = v;
                if (v) checkTiebreak(inp);
                updateWinnerDisplay();
                if (v && v.length === 1) focusNext(inp);
            });
        });

        overlay.querySelectorAll('.ad-tb-input').forEach(function(inp) {
            inp.addEventListener('input', function() {
                inp.value = inp.value.replace(/\D/g, '').slice(0, 2);
                updateWinnerDisplay();
                if (inp.value.length === 2) focusNext(inp);
            });
        });

        function checkTiebreak(inp) {
            var row = inp.closest('.ad-score-set-row');
            if (!row) return;
            var setNum = row.dataset.set;
            var g1 = document.getElementById('chS' + setNum + 'P1');
            var g2 = document.getElementById('chS' + setNum + 'P2');
            var tbWrap = document.getElementById('chS' + setNum + 'TB1Wrap');
            if (!g1 || !g2 || !tbWrap) return;
            var v1 = parseInt(g1.value) || 0;
            var v2 = parseInt(g2.value) || 0;
            tbWrap.style.display = isTiebreakScore(v1, v2, _setFormat) ? '' : 'none';
        }

        function focusNext(current) {
            var inputs = Array.from(overlay.querySelectorAll('input:not([style*="display:none"])'));
            var visInputs = inputs.filter(function(inp) {
                var row = inp.closest('.ad-score-set-row');
                return !row || row.style.display !== 'none';
            });
            var idx = visInputs.indexOf(current);
            if (idx >= 0 && idx < visInputs.length - 1) visInputs[idx + 1].focus();
        }

        function updateWinnerDisplay() {
            var p1Wins = 0, p2Wins = 0;
            for (var s = 1; s <= visibleSets; s++) {
                var g1 = parseInt((document.getElementById('chS' + s + 'P1') || {}).value) || 0;
                var g2 = parseInt((document.getElementById('chS' + s + 'P2') || {}).value) || 0;
                if (g1 > g2) p1Wins++;
                else if (g2 > g1) p2Wins++;
            }
            var display = document.getElementById('chWinnerDisplay');
            if (!display) return;
            if (p1Wins >= 2) display.textContent = L.chalWinner + ': ' + p1Name;
            else if (p2Wins >= 2) display.textContent = L.chalWinner + ': ' + p2Name;
            else display.textContent = '';
        }

        function collectScore() {
            var sets = [];
            for (var s = 1; s <= visibleSets; s++) {
                var g1 = (document.getElementById('chS' + s + 'P1') || {}).value || '';
                var g2 = (document.getElementById('chS' + s + 'P2') || {}).value || '';
                if (!g1 && !g2) continue;
                var setStr = g1 + '/' + g2;
                var tb1 = (document.getElementById('chS' + s + 'TB1') || {}).value || '';
                var tb2 = (document.getElementById('chS' + s + 'TB2') || {}).value || '';
                if (tb1 && tb2) setStr += '(' + tb1 + '-' + tb2 + ')';
                sets.push(setStr);
            }
            return sets.join(' ');
        }

        // Pre-fill winner display on open
        updateWinnerDisplay();

        // ---- Save Draft ----
        document.getElementById('chSaveDraft').addEventListener('click', function() {
            var score = collectScore();
            if (!score) { A.showToast(isEn ? 'Enter at least one set' : 'Введите хотя бы один сет', 'error'); return; }
            var btn = document.getElementById('chSaveDraft');
            btn.disabled = true;
            A.client.from('challenges').update({ score_draft: score }).eq('id', challenge.id).then(function(res) {
                btn.disabled = false;
                if (res.error) { A.showToast(res.error.message, 'error'); return; }
                challenge.score_draft = score;
                A.showToast(L.chalDraftSaved, 'success');
            });
        });

        // ---- Finalize Match ----
        document.getElementById('chFinalizeScore').addEventListener('click', function() {
            var sets = [];
            var p1Wins = 0, p2Wins = 0;
            for (var s = 1; s <= visibleSets; s++) {
                var g1 = (document.getElementById('chS' + s + 'P1') || {}).value || '';
                var g2 = (document.getElementById('chS' + s + 'P2') || {}).value || '';
                if (!g1 || !g2) { A.showToast(isEn ? 'Fill all sets' : 'Заполните все сеты', 'error'); return; }
                if (!isValidSet(g1, g2, _setFormat)) {
                    A.showToast((isEn ? 'Invalid score in Set ' : 'Некорректный счёт сета ') + s, 'error');
                    return;
                }
                var v1 = parseInt(g1), v2 = parseInt(g2);
                var setStr = g1 + '/' + g2;
                var tb1 = (document.getElementById('chS' + s + 'TB1') || {}).value || '';
                var tb2 = (document.getElementById('chS' + s + 'TB2') || {}).value || '';
                if (tb1 && tb2 && isTiebreakScore(v1, v2, _setFormat)) setStr += '(' + tb1 + '-' + tb2 + ')';
                sets.push(setStr);
                if (v1 > v2) p1Wins++;
                else if (v2 > v1) p2Wins++;
            }
            if (p1Wins < 2 && p2Wins < 2) {
                A.showToast(isEn ? 'Winner must win 2 sets (2-0 or 2-1)' : 'Победитель должен выиграть 2 сета (2-0 или 2-1)', 'error');
                return;
            }

            var winnerId = p1Wins > p2Wins ? challenge.challenger_player_id : challenge.opponent_player_id;
            var loserId = p1Wins > p2Wins ? challenge.opponent_player_id : challenge.challenger_player_id;
            var score = sets.join(' ');
            var btn = document.getElementById('chFinalizeScore');
            btn.disabled = true;
            btn.textContent = L.chalFinalizing;

            finalizeMatch(challenge, score, winnerId, loserId).then(function(ok) {
                if (ok) {
                    overlay.remove();
                    A.showToast(L.chalFinalized, 'success');
                    loadData();
                } else {
                    btn.disabled = false;
                    btn.textContent = L.chalFinalize;
                }
            });
        });
    }

    // Parse score string "6/4 7/6(11-9) 6/3" → sets array for pre-fill
    function parseScoreToSets(scoreStr) {
        var sets = [['','','',''],['','','',''],['','','','']];
        var parts = (scoreStr || '').trim().split(/\s+/);
        var count = Math.min(parts.length, 3);
        if (count < 2) count = 2;
        for (var i = 0; i < parts.length && i < 3; i++) {
            var m = parts[i].match(/^(\d)\/(\d)(?:\((\d{1,2})-(\d{1,2})\))?$/);
            if (m) {
                sets[i] = [m[1], m[2], m[3] || '', m[4] || ''];
            }
        }
        return { sets: sets, count: count };
    }

    // Finalize: create match, update challenge, update player stats
    function finalizeMatch(challenge, score, winnerId, loserId) {
        return A.client.from('challenges')
            .update({ voting_closed: true })
            .eq('id', challenge.id)
            .then(function() {
                return A.client.from('matches').insert({
                    player1_id: challenge.challenger_player_id,
                    player2_id: challenge.opponent_player_id,
                    winner_id: winnerId,
                    score: score,
                    status: 'completed',
                    round_number: 0,
                    match_order: 0,
                    match_type: 'duel'
                }).select('id').single();
            }).then(function(matchRes) {
                if (matchRes.error) {
                    console.error('Match insert error:', matchRes.error);
                    A.showToast('Error: ' + matchRes.error.message, 'error');
                    return false;
                }
                // Победы, поражения и форма игрока остаются турнирными:
                // баттл — игра показательная, в зачёт она не идёт. Раньше
                // отсюда шло начисление, и баттлы попадали в статистику
                // на публичной странице и в списке админки
                return A.client.from('challenges').update({
                    status: 'completed',
                    match_id: matchRes.data.id,
                    score_draft: null
                }).eq('id', challenge.id).then(function(updRes) {
                    return !updRes.error;
                });
            }).catch(function(err) {
                console.error('Finalize match error:', err);
                A.showToast(isEn ? 'Error finalizing match' : 'Ошибка завершения матча', 'error');
                return false;
            });
    }

    // ---- Notify: send TG group announcement with inline voting buttons ----
    async function openNotifyModal(challenge) {
        var pMap = A._chalPlayersMap || {};
        var p1 = pMap[challenge.challenger_player_id] || {};
        var p2 = pMap[challenge.opponent_player_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        // Confirm before sending
        var confirmText = '⚔️ ' + (challenge.battle_title || 'Battle') + '\n' + p1Name + ' vs ' + p2Name;
        var ok = await A.showConfirmAsync(L.chalConfirmNotify, confirmText, L.broadcastSend);
        if (!ok) return;

        try {
            var session = (await A.client.auth.getSession()).data.session;
            if (!session) { A.showToast('Auth error', 'error'); return; }

            // Call battle-publish with notify_only (sends TG with inline voting buttons)
            var url = window.SUPABASE_URL + '/functions/v1/battle-publish';
            var res = await fetch(url, {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + session.access_token,
                    'Content-Type': 'application/json',
                    'apikey': window.SUPABASE_ANON_KEY
                },
                body: JSON.stringify({ challenge_id: challenge.id, notify_only: true })
            });

            var result = await res.json();
            if (!res.ok) {
                A.showToast(result.error || 'Error', 'error');
                return;
            }

            if (result.tg_sent) {
                A.showToast(isEn ? 'TG announcement sent with voting buttons!' : 'Анонс в TG отправлен с кнопками голосования!', 'success');
            } else {
                var dbg = result.debug || {};
                var reason = !dbg.has_token ? 'TELEGRAM_BOT_TOKEN not set'
                    : !dbg.has_group_id ? 'TELEGRAM_GROUP_CHAT_ID not set'
                    : 'TG API error (group: ' + (dbg.group_id || '?') + ')';
                console.error('TG send failed:', result.debug);
                A.showToast((isEn ? 'TG failed: ' : 'TG ошибка: ') + reason, 'error');
            }
            loadData();

        } catch (e) {
            console.error('Battle announce error:', e);
            A.showToast('Error: ' + e.message, 'error');
        }
    }

    // ==== EDIT BATTLE MODAL ====
    function openEditBattleModal(challenge) {
        var pMap = A._chalPlayersMap || {};
        var p1 = pMap[challenge.challenger_player_id] || {};
        var p2 = pMap[challenge.opponent_player_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        var selCourt = { id: challenge.proposed_court_id || null, name: '', address: '' };
        var bannerUrl = challenge.banner_url || '';

        // Parse existing venue: "CourtName, Address"
        var existingVenue = challenge.counter_venue || challenge.proposed_venue || '';
        var venueParts = existingVenue.split(', ');
        var existingCourtName = venueParts[0] || '';
        var existingAddress = venueParts.slice(1).join(', ') || '';

        // Parse existing date/time
        var existingDate = challenge.counter_date || challenge.proposed_date || '';
        var existingTime = challenge.counter_time || challenge.proposed_time || '';
        var timeH = '10', timeM = '00';
        if (existingTime) {
            var tp = existingTime.split(':');
            timeH = tp[0] || '10';
            timeM = tp[1] || '00';
        }

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:540px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalEditTitle + '</h3>' +
                    '<button class="ad-modal-close" id="ebClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body" style="max-height:70vh;overflow-y:auto;">' +
                    // Players info (read-only names)
                    '<div style="text-align:center;margin-bottom:16px;padding:12px;background:var(--bg-tertiary);border-radius:8px;">' +
                        '<span style="font-weight:600;">' + A.esc(p1Name) + '</span>' +
                        ' <span style="color:var(--accent);font-weight:700;">VS</span> ' +
                        '<span style="font-weight:600;">' + A.esc(p2Name) + '</span>' +
                    '</div>' +
                    // Player 1 extras
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label" style="font-size:11px;color:var(--text-secondary);">' + A.esc(p1Name) + '</label>' +
                        '<div style="display:flex;gap:8px;">' +
                            '<select class="ad-field-input" id="ebP1Ntrp" style="width:100px;flex:0 0 100px;">' + A.ntrpOptions(challenge.challenger_ntrp || null, { emptyLabel: 'NTRP' }) + '</select>' +
                            '<select class="ad-field-input" id="ebP1Cat" style="flex:0 0 auto;max-width:140px;">' + buildCategoryOptions(challenge.challenger_category || '') + '</select>' +
                            '<div style="flex:1;position:relative;">' +
                                '<input type="text" class="ad-field-input" id="ebP1CountryInput" placeholder="' + L.chalCountry + '" autocomplete="off">' +
                                '<input type="hidden" id="ebP1Country" value="' + A.esc(challenge.challenger_country || '') + '">' +
                                '<div class="ad-dropdown-list" id="ebP1CountryDd" style="display:none;"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Player 2 extras
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label" style="font-size:11px;color:var(--text-secondary);">' + A.esc(p2Name) + '</label>' +
                        '<div style="display:flex;gap:8px;">' +
                            '<select class="ad-field-input" id="ebP2Ntrp" style="width:100px;flex:0 0 100px;">' + A.ntrpOptions(challenge.opponent_ntrp || null, { emptyLabel: 'NTRP' }) + '</select>' +
                            '<select class="ad-field-input" id="ebP2Cat" style="flex:0 0 auto;max-width:140px;">' + buildCategoryOptions(challenge.opponent_category || '') + '</select>' +
                            '<div style="flex:1;position:relative;">' +
                                '<input type="text" class="ad-field-input" id="ebP2CountryInput" placeholder="' + L.chalCountry + '" autocomplete="off">' +
                                '<input type="hidden" id="ebP2Country" value="' + A.esc(challenge.opponent_country || '') + '">' +
                                '<div class="ad-dropdown-list" id="ebP2CountryDd" style="display:none;"></div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Title
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalBattleTitle + '</label>' +
                        '<input type="text" class="ad-field-input" id="ebTitle" value="' + A.esc(challenge.battle_title || '') + '" maxlength="100">' +
                    '</div>' +
                    // Date + Time
                    '<div style="display:flex;gap:12px;">' +
                        '<div class="ad-field-group" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.chalDate + '</label>' +
                            '<input type="date" class="ad-field-input" id="ebDate" value="' + existingDate + '">' +
                        '</div>' +
                        '<div class="ad-field-group" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.chalTime + '</label>' +
                            '<div style="display:flex;gap:6px;align-items:center;">' +
                                '<select class="ad-field-input" id="ebTimeH" style="flex:1;">' + buildHourOptions() + '</select>' +
                                '<span style="color:var(--text-dim);font-weight:700;">:</span>' +
                                '<select class="ad-field-input" id="ebTimeM" style="flex:1;">' + buildMinuteOptions() + '</select>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Set Format
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + (isEn ? 'Set Format' : 'Формат сетов') + '</label>' +
                        '<select class="ad-field-input" id="ebSetFormat">' +
                            '<option value="standard"' + ((challenge.set_format || 'standard') === 'standard' ? ' selected' : '') + '>' + L.formatStandard + '</option>' +
                            '<option value="short"' + (challenge.set_format === 'short' ? ' selected' : '') + '>' + L.formatShort + '</option>' +
                        '</select>' +
                    '</div>' +
                    // Court / Club
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalCourtOrClub + '</label>' +
                        '<div style="position:relative;">' +
                            '<input type="text" class="ad-field-input" id="cbCourtInput" value="' + A.esc(existingCourtName) + '" placeholder="' + L.chalSearchCourt + '" autocomplete="off">' +
                            '<div class="ad-dropdown-list" id="cbCourtDropdown" style="display:none;"></div>' +
                        '</div>' +
                        '<div id="cbCourtSelected" class="ad-chal-selected-hint"></div>' +
                    '</div>' +
                    // Address
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalAddress + '</label>' +
                        '<input type="text" class="ad-field-input" id="ebAddress" value="' + A.esc(existingAddress) + '" placeholder="' + (isEn ? 'Auto-filled from court or enter manually' : 'Автозаполнение из корта или введите вручную') + '">' +
                    '</div>' +
                    // Banner
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalBanner + '</label>' +
                        '<div class="ad-chal-banner-row">' +
                            '<input type="file" id="ebBannerFile" accept="image/*" style="display:none;">' +
                            '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="ebBannerBtn">' +
                                '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> ' +
                                L.chalUploadBanner +
                            '</button>' +
                            '<span id="ebBannerName" class="ad-chal-banner-name"></span>' +
                            '<div id="ebBannerPreview" class="ad-chal-banner-preview"' + (bannerUrl ? '' : ' style="display:none;"') + '>' +
                                '<img id="ebBannerImg"' + (bannerUrl ? ' src="' + A.esc(bannerUrl) + '"' : '') + '>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-accent" id="ebSave">' + L.save + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Pre-select hour/minute
        var hSel = document.getElementById('ebTimeH');
        var mSel = document.getElementById('ebTimeM');
        if (hSel) hSel.value = timeH;
        if (mSel) {
            // Snap to nearest 5-min option
            var mm = parseInt(timeM) || 0;
            mm = Math.round(mm / 5) * 5;
            if (mm === 60) mm = 55;
            mSel.value = (mm < 10 ? '0' : '') + mm;
        }

        // Close
        document.getElementById('ebClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Country inputs
        setupCountryInput('ebP1CountryInput', 'ebP1Country', 'ebP1CountryDd');
        setupCountryInput('ebP2CountryInput', 'ebP2Country', 'ebP2CountryDd');

        // Pre-fill country display
        var CU = window.KSLT_COUNTRY;
        if (CU) {
            var lang = isEn ? 'en' : 'ru';
            if (challenge.challenger_country) {
                var ci1 = document.getElementById('ebP1CountryInput');
                if (ci1) ci1.value = CU.renderCountry(challenge.challenger_country, lang, true);
            }
            if (challenge.opponent_country) {
                var ci2 = document.getElementById('ebP2CountryInput');
                if (ci2) ci2.value = CU.renderCountry(challenge.opponent_country, lang, true);
            }
        }

        // Court search
        setupCourtSearch(function(court) {
            selCourt = court;
            if (court.address) {
                document.getElementById('ebAddress').value = court.address;
            }
        });

        // Banner upload
        document.getElementById('ebBannerBtn').addEventListener('click', function() {
            document.getElementById('ebBannerFile').click();
        });
        document.getElementById('ebBannerFile').addEventListener('change', function(e) {
            var file = e.target.files[0];
            if (!file) return;
            document.getElementById('ebBannerName').textContent = file.name;
            var reader = new FileReader();
            reader.onload = function(ev) {
                document.getElementById('ebBannerImg').src = ev.target.result;
                document.getElementById('ebBannerPreview').style.display = '';
            };
            reader.readAsDataURL(file);
            if (A.uploadImage) {
                A.uploadImage(file, 'battles').then(function(url) {
                    if (url) bannerUrl = url;
                });
            }
        });

        // Save
        document.getElementById('ebSave').addEventListener('click', function() {
            var title = document.getElementById('ebTitle').value.trim();
            if (!title) { document.getElementById('ebTitle').focus(); return; }

            var date = document.getElementById('ebDate').value;
            var th = document.getElementById('ebTimeH').value;
            var tm = document.getElementById('ebTimeM').value;
            var time = th + ':' + tm;
            var courtName = document.getElementById('cbCourtInput').value.trim();
            var address = document.getElementById('ebAddress').value.trim();
            var venue = courtName + (address ? ', ' + address : '');

            var btn = document.getElementById('ebSave');
            btn.disabled = true;
            btn.textContent = L.chalSaving;

            var updateData = {
                battle_title: title,
                counter_date: date || null,
                counter_time: time || null,
                counter_venue: venue || null,
                banner_url: bannerUrl || null,
                challenger_ntrp: document.getElementById('ebP1Ntrp').value ? parseFloat(document.getElementById('ebP1Ntrp').value) : null,
                opponent_ntrp: document.getElementById('ebP2Ntrp').value ? parseFloat(document.getElementById('ebP2Ntrp').value) : null,
                challenger_country: document.getElementById('ebP1Country').value || null,
                opponent_country: document.getElementById('ebP2Country').value || null,
                challenger_category: document.getElementById('ebP1Cat').value || null,
                opponent_category: document.getElementById('ebP2Cat').value || null,
                set_format: document.getElementById('ebSetFormat').value || 'standard'
            };
            if (selCourt.id) updateData.proposed_court_id = selCourt.id;

            A.client.from('challenges').update(updateData).eq('id', challenge.id).then(function(res) {
                if (res.error) {
                    btn.disabled = false;
                    btn.textContent = L.save;
                    A.showToast(res.error.message, 'error');
                    return;
                }
                overlay.remove();
                A.showToast(L.chalSaved, 'success');
                loadData();
            });
        });
    }

    // ==== DELETE OR CANCEL MODAL ====
    function openDeleteOrCancelModal(challenge) {
        var pMap = A._chalPlayersMap || {};
        var p1 = pMap[challenge.challenger_player_id] || {};
        var p2 = pMap[challenge.opponent_player_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:440px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.chalDeleteOrCancel + '</h3>' +
                    '<button class="ad-modal-close" id="dcClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    // Battle info card
                    '<div style="text-align:center;margin-bottom:20px;padding:14px;background:var(--bg-tertiary);border-radius:10px;border:1px solid var(--border);">' +
                        '<div style="font-weight:700;font-size:15px;color:var(--text-primary);">⚔️ ' + A.esc(challenge.battle_title || '') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:13px;margin-top:6px;">' + A.esc(p1Name) + ' <span style="color:var(--accent);font-weight:600;">VS</span> ' + A.esc(p2Name) + '</div>' +
                    '</div>' +
                    '<p style="color:var(--text-secondary);margin-bottom:16px;font-size:13px;">' + L.chalDeleteOrCancelDesc + '</p>' +
                    // Cancel battle — card-style button
                    '<div id="dcCancel" style="cursor:pointer;padding:16px;margin-bottom:10px;border-radius:10px;border:1px solid rgba(255,193,7,0.35);background:rgba(255,193,7,0.06);transition:all 0.2s;">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<span style="font-size:24px;">🚫</span>' +
                            '<div>' +
                                '<div style="font-weight:600;font-size:14px;color:#ffc107;">' + L.chalCancelBattle + '</div>' +
                                '<div style="font-size:12px;color:var(--text-secondary);margin-top:3px;line-height:1.4;">' + (isEn ? 'Battle will be unpublished but kept in history' : 'Баттл будет снят с публикации, но сохранён в истории') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    // Delete forever — card-style button
                    '<div id="dcDelete" style="cursor:pointer;padding:16px;border-radius:10px;border:1px solid rgba(244,67,54,0.3);background:rgba(244,67,54,0.05);transition:all 0.2s;">' +
                        '<div style="display:flex;align-items:center;gap:12px;">' +
                            '<span style="font-size:24px;">🗑</span>' +
                            '<div>' +
                                '<div style="font-weight:600;font-size:14px;color:#f44336;">' + L.chalDeleteForever + '</div>' +
                                '<div style="font-size:12px;color:var(--text-secondary);margin-top:3px;line-height:1.4;">' + (isEn ? 'Battle and all votes will be permanently deleted' : 'Баттл и все голоса будут удалены навсегда') + '</div>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Hover effects for card buttons
        ['dcCancel', 'dcDelete'].forEach(function(id) {
            var el = document.getElementById(id);
            if (!el) return;
            el.addEventListener('mouseenter', function() { el.style.transform = 'scale(1.02)'; el.style.boxShadow = '0 4px 16px rgba(0,0,0,0.3)'; });
            el.addEventListener('mouseleave', function() { el.style.transform = ''; el.style.boxShadow = ''; });
        });

        document.getElementById('dcClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Cancel battle (soft)
        document.getElementById('dcCancel').addEventListener('click', async function() {
            var el = document.getElementById('dcCancel');
            el.style.opacity = '0.6'; el.style.pointerEvents = 'none';
            try {
                var res = await A.client.from('challenges').update({
                    status: 'cancelled',
                    battle_published: false,
                    voting_closed: true
                }).eq('id', challenge.id);
                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    el.style.opacity = ''; el.style.pointerEvents = '';
                    return;
                }
                overlay.remove();
                A.showToast(L.chalCancelled, 'success');
                loadData();
            } catch (e) {
                console.error('Cancel battle error:', e);
                A.showToast('Error: ' + e.message, 'error');
                el.style.opacity = ''; el.style.pointerEvents = '';
            }
        });

        // Delete forever (hard)
        document.getElementById('dcDelete').addEventListener('click', async function() {
            var el = document.getElementById('dcDelete');
            el.style.opacity = '0.6'; el.style.pointerEvents = 'none';
            try {
                await A.client.from('challenge_predictions').delete().eq('challenge_id', challenge.id);
                var res = await A.client.from('challenges').delete().eq('id', challenge.id);
                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    el.style.opacity = ''; el.style.pointerEvents = '';
                    return;
                }
                overlay.remove();
                A.showToast(L.chalDeleted, 'success');
                loadData();
            } catch (e) {
                console.error('Delete battle error:', e);
                A.showToast('Error: ' + e.message, 'error');
                el.style.opacity = ''; el.style.pointerEvents = '';
            }
        });
    }

    // ---- Helpers: NTRP / Category / Country ----

    function buildCategoryOptions(selectedVal) {
        var cats = A.cachedCategories || [];
        var html = '<option value="">' + L.chalCategory + '</option>';
        cats.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            var sel = (c.id === selectedVal) ? ' selected' : '';
            html += '<option value="' + A.esc(c.id) + '"' + sel + '>' + A.esc(name) + '</option>';
        });
        return html;
    }

    function autofillPlayerExtras(player, ntrpId, catId, hiddenCountryId, countryInputId, selObj) {
        var CU = window.KSLT_COUNTRY;
        // NTRP — format value to match select options (e.g. 4.5 → "4.5", 4.25 → "4.25")
        if (player.ntrp_rating) {
            var ntrpVal = parseFloat(player.ntrp_rating).toFixed(2).replace(/0$/, '');
            var ntrpEl = document.getElementById(ntrpId);
            if (ntrpEl) ntrpEl.value = ntrpVal;
            selObj.ntrp = ntrpVal;
        }
        // Category
        if (player.category_id) {
            var catEl = document.getElementById(catId);
            if (catEl) catEl.value = player.category_id;
            selObj.category = player.category_id;
        }
        // Country
        if (player.country && CU) {
            var code = CU.normalizeCountry(player.country);
            if (code) {
                var hiddenEl = document.getElementById(hiddenCountryId);
                var inputEl = document.getElementById(countryInputId);
                if (hiddenEl) hiddenEl.value = code;
                if (inputEl) {
                    var lang = isEn ? 'en' : 'ru';
                    inputEl.value = CU.renderCountry(code, lang, true);
                }
                selObj.country = code;
            }
        }
    }

    function setupCountryInput(inputId, hiddenId, dropdownId) {
        var input = document.getElementById(inputId);
        var hidden = document.getElementById(hiddenId);
        var dropdown = document.getElementById(dropdownId);
        if (!input || !hidden || !dropdown) return;

        var CU = window.KSLT_COUNTRY;
        var countries = window.KSLT_COUNTRIES || [];
        var lang = isEn ? 'en' : 'ru';

        function renderItems(list) {
            dropdown.innerHTML = '';
            if (!list.length) { dropdown.style.display = 'none'; return; }
            list.forEach(function(c) {
                var div = document.createElement('div');
                div.className = 'ad-dropdown-item';
                div.style.cursor = 'pointer';
                div.textContent = (CU ? CU.flagEmoji(c.code) : '') + ' ' + (c[lang] || c.en);
                div.dataset.code = c.code;
                div.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    hidden.value = c.code;
                    input.value = (CU ? CU.renderCountry(c.code, lang, true) : c.code);
                    dropdown.style.display = 'none';
                });
                dropdown.appendChild(div);
            });
            dropdown.style.display = 'block';
        }

        input.addEventListener('focus', function() {
            var q = input.value.trim().toLowerCase();
            if (!q) {
                // Show priority countries
                renderItems(countries.filter(function(c) { return ['KG','KZ','RU','UZ','TJ','TM'].indexOf(c.code) !== -1; }));
            }
        });

        input.addEventListener('input', function() {
            var q = input.value.trim().toLowerCase();
            if (!q) {
                hidden.value = '';
                renderItems(countries.filter(function(c) { return ['KG','KZ','RU','UZ','TJ','TM'].indexOf(c.code) !== -1; }));
                return;
            }
            var matches = countries.filter(function(c) {
                return (c.ru || '').toLowerCase().indexOf(q) !== -1 ||
                       (c.en || '').toLowerCase().indexOf(q) !== -1 ||
                       c.code.toLowerCase() === q;
            }).slice(0, 8);
            renderItems(matches);
        });

        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
    }

    // ---- Utils ----
    function formatDate(dateStr) {
        if (!dateStr) return '-';
        var d = new Date(dateStr);
        if (isNaN(d.getTime())) return dateStr;
        var day = ('0' + d.getDate()).slice(-2);
        var month = ('0' + (d.getMonth() + 1)).slice(-2);
        return day + '.' + month + '.' + d.getFullYear();
    }

    // ---- Exports ----
    A.renderChallengesSection = renderChallengesSection;
})();
