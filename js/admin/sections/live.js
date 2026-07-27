/**
 * Admin Panel — Live Match Section (IIFE)
 * Create, manage, monitor live matches
 */
(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // ---- State ----
    var subTab = 'active';
    var activeList = [];
    var completedList = [];
    var allPlayers = [];

    // ---- Entry point ----
    function renderLiveSection() {
        var container = document.getElementById('ad-live');
        if (!container) return;

        container.innerHTML =
            '<div class="ad-section-header" style="display:flex;justify-content:space-between;align-items:center;">' +
                '<h2>' + L.liveSection + '</h2>' +
                '<button class="ad-btn ad-btn-accent" id="liveCreateBtn">' + L.liveCreate + '</button>' +
            '</div>' +
            '<div class="ad-rat-tabs" id="liveTabs" style="margin-bottom:20px;">' +
                '<button class="ad-rat-tab' + (subTab === 'active' ? ' active' : '') + '" data-subtab="active">' + L.liveActive + '</button>' +
                '<button class="ad-rat-tab' + (subTab === 'completed' ? ' active' : '') + '" data-subtab="completed">' + L.liveCompleted + '</button>' +
            '</div>' +
            '<div id="liveContent"></div>';

        document.getElementById('liveCreateBtn').addEventListener('click', function() {
            openCreateModal();
        });

        document.getElementById('liveTabs').addEventListener('click', function(e) {
            var btn = e.target.closest('[data-subtab]');
            if (!btn) return;
            e.stopPropagation();
            subTab = btn.dataset.subtab;
            document.querySelectorAll('#liveTabs .ad-rat-tab').forEach(function(t) {
                t.classList.toggle('active', t.dataset.subtab === subTab);
            });
            renderSubTab();
        });

        loadData();
    }

    function loadData() {
        Promise.all([
            A.client.from('live_matches')
                .select('id, match_id, player1_id, player2_id, player1_name, player2_name, best_of, set_format, youtube_url, umpire_key, status, final_score, tournament_label, sponsor_logo, created_at, sets_data, current_game_p1, current_game_p2, points_p1, points_p2, serving_player, is_tiebreak, tiebreak_p1, tiebreak_p2')
                .in('status', ['warmup', 'live', 'paused'])
                .order('created_at', { ascending: false }),
            A.client.from('live_matches')
                .select('id, match_id, player1_id, player2_id, player1_name, player2_name, status, final_score, tournament_label, completed_at')
                .eq('status', 'completed')
                .order('completed_at', { ascending: false })
                .limit(50),
            A.client.from('players').select('id, name, name_en, photo').order('name')
        ]).then(function(results) {
            activeList = results[0].data || [];
            completedList = results[1].data || [];
            allPlayers = results[2].data || [];
            renderSubTab();
        });
    }

    function renderSubTab() {
        if (subTab === 'active') renderActiveList();
        else renderCompletedList();
    }

    function playerName(id, fallback) {
        if (fallback) return fallback;
        for (var i = 0; i < allPlayers.length; i++) {
            if (allPlayers[i].id === id) return isEn ? (allPlayers[i].name_en || allPlayers[i].name) : allPlayers[i].name;
        }
        return '—';
    }

    function buildScoreDisplay(m) {
        var parts = [];
        (m.sets_data || []).forEach(function(s) {
            var set = s.g1 + '-' + s.g2;
            if (s.tb1 !== null && s.tb1 !== undefined) set += '(' + Math.min(s.tb1, s.tb2) + ')';
            parts.push(set);
        });
        if (m.status !== 'completed') {
            var g = (m.current_game_p1 || 0) + '-' + (m.current_game_p2 || 0);
            parts.push(g);
        }
        return parts.join('  ') || '0-0';
    }

    // ---- Active list ----
    function renderActiveList() {
        var content = document.getElementById('liveContent');
        if (!content) return;

        if (!activeList.length) {
            content.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:40px;">' + L.liveNoActive + '</p>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.livePlayer1 + ' vs ' + L.livePlayer2 + '</th>' +
            '<th>' + L.chalScore + '</th>' +
            '<th>Status</th>' +
            '<th>YouTube</th>' +
            '<th></th>' +
            '</tr></thead><tbody>';

        activeList.forEach(function(m) {
            var p1 = playerName(m.player1_id, m.player1_name);
            var p2 = playerName(m.player2_id, m.player2_name);
            var score = buildScoreDisplay(m);
            var statusLabel = m.status === 'warmup' ? 'Warmup' : m.status === 'paused' ? 'Paused' : 'LIVE';
            var statusStyle = m.status === 'live' ? 'color:#EF5350;font-weight:700;' : 'color:var(--text-dim);';

            var baseUrl = window.location.origin;
            var umpireUrl = baseUrl + '/pages/umpire.html?key=' + m.umpire_key;
            var pageUrl = baseUrl + '/pages/live-match.html?id=' + m.id;
            var scoreboardUrl = baseUrl + '/pages/scoreboard.html?id=' + m.id;

            html += '<tr>' +
                '<td><strong>' + A.esc(p1) + '</strong> vs <strong>' + A.esc(p2) + '</strong>' +
                    (m.tournament_label ? '<br><span style="font-size:0.8rem;color:var(--text-dim);">' + A.esc(m.tournament_label) + '</span>' : '') +
                '</td>' +
                '<td style="font-family:monospace;font-weight:600;">' + score + '</td>' +
                '<td style="' + statusStyle + '">' + statusLabel + '</td>' +
                '<td>' + (m.youtube_url ? '<span style="color:var(--accent);">✓</span>' : '—') + '</td>' +
                '<td style="display:flex;gap:6px;flex-wrap:wrap;">' +
                    '<button class="ad-btn ad-btn-sm ad-btn-accent" data-copy-url="' + A.esc(umpireUrl) + '">' + L.liveUmpireLink + '</button>' +
                    '<a href="' + A.esc(pageUrl) + '" target="_blank" class="ad-btn ad-btn-sm ad-btn-outline">' + L.liveOpenPage + '</a>' +
                    '<a href="' + A.esc(scoreboardUrl) + '" target="_blank" class="ad-btn ad-btn-sm ad-btn-outline">' + L.liveScoreboard + '</a>' +
                    '<button class="ad-btn ad-btn-sm ad-btn-danger" data-delete-live="' + m.id + '">' + L.liveDelete + '</button>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        content.innerHTML = html;

        // Copy URL buttons
        content.querySelectorAll('[data-copy-url]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                navigator.clipboard.writeText(this.dataset.copyUrl).then(function() {
                    A.showToast(L.liveCopied, 'success');
                });
            });
        });

        // Delete buttons
        content.querySelectorAll('[data-delete-live]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.deleteLive;
                A.showConfirm(L.liveDelete + '?', '', function() {
                    A.client.from('live_matches').delete().eq('id', id).then(function(res) {
                        if (res.error) return A.showToast(res.error.message, 'error');
                        A.showToast(L.liveDeleted, 'success');
                        loadData();
                    });
                });
            });
        });
    }

    // ---- Completed list ----
    function renderCompletedList() {
        var content = document.getElementById('liveContent');
        if (!content) return;

        if (!completedList.length) {
            content.innerHTML = '<p style="color:var(--text-dim);text-align:center;padding:40px;">' + L.liveNoCompleted + '</p>';
            return;
        }

        var html = '<table class="ad-table"><thead><tr>' +
            '<th>' + L.livePlayer1 + ' vs ' + L.livePlayer2 + '</th>' +
            '<th>' + L.chalScore + '</th>' +
            '<th>' + (isEn ? 'Date' : 'Дата') + '</th>' +
            '<th></th>' +
            '</tr></thead><tbody>';

        completedList.forEach(function(m) {
            var p1 = playerName(m.player1_id, m.player1_name);
            var p2 = playerName(m.player2_id, m.player2_name);
            var date = m.completed_at ? new Date(m.completed_at).toLocaleDateString() : '—';

            html += '<tr>' +
                '<td><strong>' + A.esc(p1) + '</strong> vs <strong>' + A.esc(p2) + '</strong></td>' +
                '<td style="font-family:monospace;">' + A.esc(m.final_score || '—') + '</td>' +
                '<td>' + date + '</td>' +
                '<td>' +
                    (m.match_id ? '<button class="ad-btn ad-btn-sm ad-btn-accent" data-sync-live="' + m.id + '" data-match-id="' + m.match_id + '" data-score="' + A.esc(m.final_score || '') + '">' + L.liveSync + '</button> ' : '') +
                    '<button class="ad-btn ad-btn-sm ad-btn-danger" data-delete-live="' + m.id + '">' + L.liveDelete + '</button>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        content.innerHTML = html;

        // Sync buttons
        content.querySelectorAll('[data-sync-live]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var matchId = this.dataset.matchId;
                var score = this.dataset.score;
                if (!matchId || !score) return;
                A.client.from('matches').update({ score: score, status: 'completed' }).eq('id', matchId).then(function(res) {
                    if (res.error) return A.showToast(res.error.message, 'error');
                    A.showToast(L.liveSynced, 'success');
                });
            });
        });

        // Delete buttons
        content.querySelectorAll('[data-delete-live]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.deleteLive;
                A.showConfirm(L.liveDelete + '?', '', function() {
                    A.client.from('live_matches').delete().eq('id', id).then(function(res) {
                        if (res.error) return A.showToast(res.error.message, 'error');
                        A.showToast(L.liveDeleted, 'success');
                        loadData();
                    });
                });
            });
        });
    }

    // ---- Round labels ----
    var ROUND_MAP = isEn
        ? { 1: 'R1', 2: 'R2', 3: 'QF', 4: 'SF', 5: 'F', 6: '3rd Place' }
        : { 1: 'R1', 2: 'R2', 3: 'ЧФ', 4: 'ПФ', 5: 'Финал', 6: 'За 3-е' };

    // ---- Cached data for create modal ----
    var cachedTournaments = [];
    var cachedMatches = [];
    var cachedBattles = [];

    // ---- Create modal ----
    function openCreateModal() {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:540px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.liveCreate + '</h3>' +
                    '<button class="ad-modal-close" id="liveModalClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body" style="max-height:70vh;overflow-y:auto;">' +
                    // Source dropdown
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.liveSource + '</label>' +
                        '<select id="liveSource" class="ad-field-input">' +
                            '<option value="free">' + L.liveSourceFree + '</option>' +
                            '<option value="tournament">' + L.liveSourceTournament + '</option>' +
                            '<option value="battle">' + L.liveSourceBattle + '</option>' +
                        '</select>' +
                    '</div>' +
                    // Tournament selectors (hidden by default)
                    '<div id="liveTournamentBlock" style="display:none;">' +
                        '<div class="ad-field-group">' +
                            '<label class="ad-field-label">' + L.liveSelectTournament + '</label>' +
                            '<select id="liveTournSelect" class="ad-field-input">' +
                                '<option value="">' + L.liveSelectTournament + '</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="ad-field-group">' +
                            '<label class="ad-field-label">' + L.liveSelectMatch + '</label>' +
                            '<select id="liveMatchSelect" class="ad-field-input">' +
                                '<option value="">' + L.liveSelectMatch + '</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    // Battle selector (hidden by default)
                    '<div id="liveBattleBlock" style="display:none;">' +
                        '<div class="ad-field-group">' +
                            '<label class="ad-field-label">' + L.liveSelectBattle + '</label>' +
                            '<select id="liveBattleSelect" class="ad-field-input">' +
                                '<option value="">' + L.liveSelectBattle + '</option>' +
                            '</select>' +
                        '</div>' +
                    '</div>' +
                    // Free match: player search (shown by default)
                    '<div id="liveFreeBlock">' +
                        '<div class="ad-field-group">' +
                            '<label class="ad-field-label">' + L.livePlayer1 + '</label>' +
                            '<div style="position:relative;">' +
                                '<input type="text" class="ad-field-input" id="liveP1Search" placeholder="' + L.liveSearchPlayer + '" autocomplete="off">' +
                                '<div class="ad-dropdown-list" id="liveP1Dropdown" style="display:none;"></div>' +
                            '</div>' +
                            '<input type="hidden" id="liveP1Id">' +
                            '<div id="liveP1Selected" class="ad-chal-selected-hint"></div>' +
                        '</div>' +
                        '<div class="ad-field-group">' +
                            '<label class="ad-field-label">' + L.livePlayer2 + '</label>' +
                            '<div style="position:relative;">' +
                                '<input type="text" class="ad-field-input" id="liveP2Search" placeholder="' + L.liveSearchPlayer + '" autocomplete="off">' +
                                '<div class="ad-dropdown-list" id="liveP2Dropdown" style="display:none;"></div>' +
                            '</div>' +
                            '<input type="hidden" id="liveP2Id">' +
                            '<div id="liveP2Selected" class="ad-chal-selected-hint"></div>' +
                        '</div>' +
                    '</div>' +
                    // Selected players preview (for tournament/battle)
                    '<div id="livePlayersPreview" style="display:none;padding:12px;background:rgba(255,255,255,0.04);border-radius:12px;margin-bottom:12px;"></div>' +
                    // Sponsor logo
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.liveSponsor + '</label>' +
                        '<div style="display:flex;gap:8px;align-items:center;">' +
                            '<button class="ad-btn ad-btn-outline ad-btn-sm" id="liveSponsorUpload" type="button">' + L.liveSponsorUpload + '</button>' +
                            '<input type="file" id="liveSponsorFile" accept="image/*" style="display:none;">' +
                            '<span id="liveSponsorName" style="font-size:0.8rem;color:var(--text-dim);"></span>' +
                        '</div>' +
                        '<input type="hidden" id="liveSponsorUrl">' +
                        '<div id="liveSponsorPreview" style="margin-top:8px;display:none;"><img id="liveSponsorImg" style="max-height:40px;border-radius:4px;"></div>' +
                    '</div>' +
                    // YouTube
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.liveYoutube + '</label>' +
                        '<input type="text" class="ad-field-input" id="liveYoutube" placeholder="https://youtube.com/live/...">' +
                    '</div>' +
                    // Best of + Set format + Tournament label row
                    '<div style="display:flex;gap:12px;flex-wrap:wrap;">' +
                        '<div class="ad-field-group" style="flex:0 0 120px;">' +
                            '<label class="ad-field-label">' + L.liveBestOf + '</label>' +
                            '<select id="liveBestOf" class="ad-field-input"><option value="1">1</option><option value="3" selected>3</option><option value="5">5</option></select>' +
                        '</div>' +
                        '<div class="ad-field-group" style="flex:0 0 200px;">' +
                            '<label class="ad-field-label">' + L.liveSetFormat + '</label>' +
                            '<select id="liveSetFormat" class="ad-field-input">' +
                                '<option value="standard">' + L.formatStandard + '</option>' +
                                '<option value="short">' + L.formatShort + '</option>' +
                            '</select>' +
                        '</div>' +
                        '<div class="ad-field-group" style="flex:1;">' +
                            '<label class="ad-field-label">' + L.liveTournLabel + '</label>' +
                            '<input type="text" class="ad-field-input" id="liveTournLabel" placeholder="KSLT Masters #1 • SF">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-accent" id="liveModalSave">' + L.liveCreate + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var closeModal = function() { overlay.remove(); };
        document.getElementById('liveModalClose').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

        // Player search for free mode
        setupPlayerSearch('liveP1Search', 'liveP1Dropdown', 'liveP1Id', 'liveP1Selected');
        setupPlayerSearch('liveP2Search', 'liveP2Dropdown', 'liveP2Id', 'liveP2Selected');

        // Source switcher
        var sourceSelect = document.getElementById('liveSource');
        var freeBlock = document.getElementById('liveFreeBlock');
        var tournBlock = document.getElementById('liveTournamentBlock');
        var battleBlock = document.getElementById('liveBattleBlock');
        var preview = document.getElementById('livePlayersPreview');

        sourceSelect.addEventListener('change', function() {
            var mode = sourceSelect.value;
            freeBlock.style.display = mode === 'free' ? '' : 'none';
            tournBlock.style.display = mode === 'tournament' ? '' : 'none';
            battleBlock.style.display = mode === 'battle' ? '' : 'none';
            preview.style.display = mode !== 'free' ? 'none' : 'none';

            if (mode === 'tournament' && !cachedTournaments.length) loadTournaments();
            if (mode === 'battle' && !cachedBattles.length) loadBattles();
        });

        // Tournament → load matches
        document.getElementById('liveTournSelect').addEventListener('change', function() {
            var tid = this.value;
            loadTournamentMatches(tid);
        });

        // Match selected → show players preview
        document.getElementById('liveMatchSelect').addEventListener('change', function() {
            var mid = this.value;
            if (!mid) { preview.style.display = 'none'; return; }
            var m = cachedMatches.find(function(x) { return x.id === mid; });
            if (!m) return;
            showPlayersPreview(m._p1Name, m._p2Name);
            // Auto-fill tournament label
            var tournSelect = document.getElementById('liveTournSelect');
            var tournName = tournSelect.options[tournSelect.selectedIndex].text;
            var roundLabel = ROUND_MAP[m.round_number] || ('R' + m.round_number);
            document.getElementById('liveTournLabel').value = tournName + ' • ' + roundLabel;
        });

        // Battle selected → show players preview
        document.getElementById('liveBattleSelect').addEventListener('change', function() {
            var bid = this.value;
            if (!bid) { preview.style.display = 'none'; return; }
            var b = cachedBattles.find(function(x) { return x.id === bid; });
            if (!b) return;
            showPlayersPreview(b._p1Name, b._p2Name);
            document.getElementById('liveTournLabel').value = b.battle_title || (b._p1Name + ' vs ' + b._p2Name);
        });

        // Sponsor upload
        var sponsorUploadBtn = document.getElementById('liveSponsorUpload');
        var sponsorFileInput = document.getElementById('liveSponsorFile');
        sponsorUploadBtn.addEventListener('click', function() { sponsorFileInput.click(); });
        sponsorFileInput.addEventListener('change', function() {
            var file = this.files[0];
            if (!file) return;
            sponsorUploadBtn.disabled = true;
            sponsorUploadBtn.textContent = '...';
            A.uploadImage(file, 'sponsor').then(function(url) {
                document.getElementById('liveSponsorUrl').value = url;
                document.getElementById('liveSponsorName').textContent = file.name;
                var img = document.getElementById('liveSponsorImg');
                img.src = url;
                document.getElementById('liveSponsorPreview').style.display = '';
                sponsorUploadBtn.disabled = false;
                sponsorUploadBtn.textContent = L.liveSponsorUpload;
            }).catch(function() {
                A.showToast('Upload error', 'error');
                sponsorUploadBtn.disabled = false;
                sponsorUploadBtn.textContent = L.liveSponsorUpload;
            });
        });

        // Save
        document.getElementById('liveModalSave').addEventListener('click', function() {
            var mode = sourceSelect.value;
            var row = {
                youtube_url: document.getElementById('liveYoutube').value.trim() || null,
                best_of: parseInt(document.getElementById('liveBestOf').value) || 3,
                set_format: document.getElementById('liveSetFormat').value || 'standard',
                tournament_label: document.getElementById('liveTournLabel').value.trim() || null,
                sponsor_logo: document.getElementById('liveSponsorUrl').value || null,
                status: 'warmup'
            };

            if (mode === 'free') {
                var p1Id = document.getElementById('liveP1Id').value || null;
                var p2Id = document.getElementById('liveP2Id').value || null;
                var p1Name = document.getElementById('liveP1Search').value.trim();
                var p2Name = document.getElementById('liveP2Search').value.trim();
                if (!p1Id && !p1Name) return A.showToast(L.livePlayer1 + '!', 'error');
                if (!p2Id && !p2Name) return A.showToast(L.livePlayer2 + '!', 'error');
                row.player1_id = p1Id;
                row.player2_id = p2Id;
                row.player1_name = p1Id ? null : p1Name;
                row.player2_name = p2Id ? null : p2Name;

            } else if (mode === 'tournament') {
                var mid = document.getElementById('liveMatchSelect').value;
                if (!mid) return A.showToast(L.liveSelectMatch + '!', 'error');
                var m = cachedMatches.find(function(x) { return x.id === mid; });
                if (!m) return;
                row.match_id = m.id;
                row.player1_id = m.player1_id || null;
                row.player2_id = m.player2_id || null;
                row.player1_name = m._p1Name;
                row.player2_name = m._p2Name;

            } else if (mode === 'battle') {
                var bid = document.getElementById('liveBattleSelect').value;
                if (!bid) return A.showToast(L.liveSelectBattle + '!', 'error');
                var b = cachedBattles.find(function(x) { return x.id === bid; });
                if (!b) return;
                row.player1_id = b.challenger_player_id || null;
                row.player2_id = b.opponent_player_id || null;
                row.player1_name = b._p1Name;
                row.player2_name = b._p2Name;
            }

            A.client.from('live_matches').insert(row).select().then(function(res) {
                if (res.error) return A.showToast(res.error.message, 'error');
                A.showToast(L.liveCreated, 'success');
                closeModal();
                loadData();
            });
        });
    }

    function showPlayersPreview(p1, p2) {
        var preview = document.getElementById('livePlayersPreview');
        if (!preview) return;
        preview.innerHTML = '<div style="text-align:center;font-size:1rem;">' +
            '<strong>' + A.esc(p1) + '</strong>' +
            '<span style="color:var(--text-dim);margin:0 8px;">vs</span>' +
            '<strong>' + A.esc(p2) + '</strong>' +
        '</div>';
        preview.style.display = '';
    }

    // ---- Load tournaments that have pending matches ----
    function loadTournaments() {
        A.client.from('matches')
            .select('tournament_id')
            .neq('status', 'completed')
            .then(function(res) {
                var tids = [];
                (res.data || []).forEach(function(m) {
                    if (m.tournament_id && tids.indexOf(m.tournament_id) === -1) tids.push(m.tournament_id);
                });
                if (!tids.length) {
                    var sel = document.getElementById('liveTournSelect');
                    if (sel) sel.innerHTML = '<option value="">' + L.liveNoTournaments + '</option>';
                    return;
                }
                A.client.from('tournaments').select('id, title, title_en, start_date')
                    .in('id', tids)
                    .order('start_date', { ascending: false })
                    .then(function(tRes) {
                        cachedTournaments = tRes.data || [];
                        var sel = document.getElementById('liveTournSelect');
                        if (!sel) return;
                        var html = '<option value="">' + L.liveSelectTournament + '</option>';
                        cachedTournaments.forEach(function(t) {
                            var name = isEn ? (t.title_en || t.title) : t.title;
                            html += '<option value="' + t.id + '">' + A.esc(name) + '</option>';
                        });
                        sel.innerHTML = html;
                    });
            });
    }

    // ---- Load pending matches for selected tournament ----
    function loadTournamentMatches(tournamentId) {
        var sel = document.getElementById('liveMatchSelect');
        var preview = document.getElementById('livePlayersPreview');
        if (preview) preview.style.display = 'none';
        if (!tournamentId) {
            cachedMatches = [];
            if (sel) sel.innerHTML = '<option value="">' + L.liveSelectMatch + '</option>';
            return;
        }

        A.client.from('matches')
            .select('id, player1_id, player2_id, round_number, match_order, status, round')
            .eq('tournament_id', tournamentId)
            .neq('status', 'completed')
            .order('round_number', { ascending: true })
            .order('match_order', { ascending: true })
            .then(function(res) {
                var matches = res.data || [];
                if (!matches.length) {
                    cachedMatches = [];
                    if (sel) sel.innerHTML = '<option value="">' + L.liveNoMatches + '</option>';
                    return;
                }

                // Collect player IDs to resolve names
                var pids = [];
                matches.forEach(function(m) {
                    if (m.player1_id && pids.indexOf(m.player1_id) === -1) pids.push(m.player1_id);
                    if (m.player2_id && pids.indexOf(m.player2_id) === -1) pids.push(m.player2_id);
                });

                var pPromise = pids.length
                    ? A.client.from('players').select('id,name,name_en').in('id', pids)
                    : Promise.resolve({ data: [] });

                pPromise.then(function(pRes) {
                    var pMap = {};
                    (pRes.data || []).forEach(function(p) { pMap[p.id] = p; });

                    cachedMatches = matches.map(function(m) {
                        var p1 = pMap[m.player1_id];
                        var p2 = pMap[m.player2_id];
                        m._p1Name = p1 ? (isEn ? (p1.name_en || p1.name) : p1.name) : 'TBD';
                        m._p2Name = p2 ? (isEn ? (p2.name_en || p2.name) : p2.name) : 'TBD';
                        return m;
                    });

                    var html = '<option value="">' + L.liveSelectMatch + '</option>';
                    cachedMatches.forEach(function(m) {
                        var roundLabel = ROUND_MAP[m.round_number] || ('R' + m.round_number);
                        if (m.round === '3RD') roundLabel = ROUND_MAP[6];
                        html += '<option value="' + m.id + '">' + roundLabel + ': ' + A.esc(m._p1Name) + ' vs ' + A.esc(m._p2Name) + '</option>';
                    });
                    if (sel) sel.innerHTML = html;
                });
            });
    }

    // ---- Load published battles ----
    function loadBattles() {
        A.client.from('challenges')
            .select('id, challenger_player_id, opponent_player_id, battle_title, status')
            .eq('battle_published', true)
            .neq('status', 'completed')
            .order('created_at', { ascending: false })
            .then(function(res) {
                var battles = res.data || [];
                if (!battles.length) {
                    var sel = document.getElementById('liveBattleSelect');
                    if (sel) sel.innerHTML = '<option value="">' + L.liveNoBattles + '</option>';
                    cachedBattles = [];
                    return;
                }

                var pids = [];
                battles.forEach(function(b) {
                    if (b.challenger_player_id && pids.indexOf(b.challenger_player_id) === -1) pids.push(b.challenger_player_id);
                    if (b.opponent_player_id && pids.indexOf(b.opponent_player_id) === -1) pids.push(b.opponent_player_id);
                });

                var pPromise = pids.length
                    ? A.client.from('players').select('id,name,name_en').in('id', pids)
                    : Promise.resolve({ data: [] });

                pPromise.then(function(pRes) {
                    var pMap = {};
                    (pRes.data || []).forEach(function(p) { pMap[p.id] = p; });

                    cachedBattles = battles.map(function(b) {
                        var p1 = pMap[b.challenger_player_id];
                        var p2 = pMap[b.opponent_player_id];
                        b._p1Name = p1 ? (isEn ? (p1.name_en || p1.name) : p1.name) : 'TBD';
                        b._p2Name = p2 ? (isEn ? (p2.name_en || p2.name) : p2.name) : 'TBD';
                        return b;
                    });

                    var sel = document.getElementById('liveBattleSelect');
                    if (!sel) return;
                    var html = '<option value="">' + L.liveSelectBattle + '</option>';
                    cachedBattles.forEach(function(b) {
                        var label = b.battle_title || (b._p1Name + ' vs ' + b._p2Name);
                        html += '<option value="' + b.id + '">' + A.esc(label) + '</option>';
                    });
                    sel.innerHTML = html;
                });
            });
    }

    function setupPlayerSearch(inputId, dropdownId, hiddenId, selectedId) {
        var input = document.getElementById(inputId);
        var dropdown = document.getElementById(dropdownId);
        var hidden = document.getElementById(hiddenId);
        var selected = document.getElementById(selectedId);
        var timer = null;

        input.addEventListener('input', function() {
            clearTimeout(timer);
            var q = input.value.trim().toLowerCase();
            if (q.length < 2) { dropdown.style.display = 'none'; dropdown.innerHTML = ''; return; }

            timer = setTimeout(function() {
                var filtered = allPlayers.filter(function(p) {
                    return (p.name && p.name.toLowerCase().indexOf(q) !== -1) ||
                           (p.name_en && p.name_en.toLowerCase().indexOf(q) !== -1);
                }).slice(0, 8);

                if (!filtered.length) { dropdown.style.display = 'none'; return; }

                dropdown.innerHTML = filtered.map(function(p) {
                    var name = isEn ? (p.name_en || p.name) : p.name;
                    var photo = p.photo ? '<img src="' + A.esc(p.photo) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;margin-right:8px;">' : '';
                    return '<div class="ad-dropdown-item" data-pid="' + p.id + '" data-pname="' + A.esc(name) + '">' +
                        photo + A.esc(name) +
                    '</div>';
                }).join('');
                dropdown.style.display = 'block';

                dropdown.querySelectorAll('.ad-dropdown-item').forEach(function(el) {
                    el.addEventListener('click', function() {
                        hidden.value = this.dataset.pid;
                        input.value = this.dataset.pname;
                        selected.textContent = this.dataset.pname;
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

    // ---- Export ----
    A.renderLiveSection = renderLiveSection;
})();
