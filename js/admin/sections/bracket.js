// ============================================
// KSLT Admin — Bracket Management
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // Round mapping: round_number → round_reached key for points
    var ROUND_TO_KEY = {};
    // Will be populated dynamically based on draw_size

    function getRoundKey(roundNumber, totalRounds) {
        // For losers: roundsFromEnd = which round they lost in
        // Lost in Final → F, Lost in SF → SF, Lost in QF → QF, etc.
        var roundsFromEnd = totalRounds - roundNumber;
        if (roundsFromEnd === 0) return 'F';   // lost in Final
        if (roundsFromEnd === 1) return 'SF';  // lost in Semifinal
        if (roundsFromEnd === 2) return 'QF';  // lost in Quarterfinal
        if (roundsFromEnd === 3) return 'R16';
        if (roundsFromEnd === 4) return 'R32';
        return 'R32';
    }

    // Round names for bracket display
    function getRoundName(roundNum, totalRounds, drawSize) {
        var roundsFromEnd = totalRounds - roundNum;
        if (roundsFromEnd === 0) return L.roundF;
        if (roundsFromEnd === 1) return L.roundSF;
        if (roundsFromEnd === 2) return L.roundQF;
        if (roundsFromEnd === 3) return L.roundR16;
        if (roundsFromEnd === 4) return isEn ? 'Round of 32' : '1/16 финала';
        return isEn ? 'Round ' + roundNum : 'Раунд ' + roundNum;
    }

    // ---- Render Bracket Management View ----
    // Called after saving a tournament that has bracket_type set, or from edit view
    async function renderBracketManagement(tournamentId, forceTab) {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        A.setAdminHash('tournaments', 'bracket', tournamentId);

        // Ensure levels are loaded for results display
        await A.loadTournamentLevels();

        // Load tournament
        var tRes = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
        if (tRes.error || !tRes.data) {
            A.showToast(tRes.error ? tRes.error.message : 'Tournament not found', 'error');
            return;
        }
        var tournament = tRes.data;

        // Load registrations
        var regRes = await A.client.from('tournament_registrations')
            .select('*, players(id, name, name_en, points, category_id)')
            .eq('tournament_id', tournamentId)
            .order('registered_at', { ascending: true });
        var registrations = regRes.data || [];

        // Load matches
        var matchRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .order('round_number', { ascending: true })
            .order('match_order', { ascending: true });
        var matches = matchRes.data || [];

        // Load players map for display
        var playerIds = [];
        registrations.forEach(function(r) { if (r.player_id) playerIds.push(r.player_id); });
        matches.forEach(function(m) {
            if (m.player1_id) playerIds.push(m.player1_id);
            if (m.player2_id) playerIds.push(m.player2_id);
            if (m.winner_id) playerIds.push(m.winner_id);
        });
        playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        var playersMap = {};
        if (playerIds.length > 0) {
            var plRes = await A.client.from('players').select('id, name, name_en, points, category_id').in('id', playerIds);
            (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });

            // Compute rank within category: load all players for relevant categories
            var catIds = [];
            (plRes.data || []).forEach(function(p) {
                if (p.category_id && catIds.indexOf(p.category_id) === -1) catIds.push(p.category_id);
            });
            if (catIds.length > 0) {
                var rankRes = await A.client.from('players').select('id, points, category_id').in('category_id', catIds).order('points', { ascending: false });
                var catGroups = {};
                (rankRes.data || []).forEach(function(p) {
                    var cat = p.category_id;
                    if (!catGroups[cat]) catGroups[cat] = [];
                    catGroups[cat].push(p.id);
                });
                // Already sorted by points DESC — index = rank
                Object.keys(catGroups).forEach(function(cat) {
                    catGroups[cat].forEach(function(pid, idx) {
                        if (playersMap[pid]) playersMap[pid].rank = idx + 1;
                    });
                });
            }
        }

        var hasMatches = matches.length > 0;
        var isRegOpen = tournament.status === 'registration_open';
        var canGenerate = !hasMatches && registrations.filter(function(r) { return r.status === 'approved'; }).length >= 2;
        var allCompleted = hasMatches && matches.every(function(m) { return m.status === 'completed'; });
        var anyCompleted = hasMatches && matches.some(function(m) { return m.status === 'completed'; });
        var isTournamentCompleted = tournament.status === 'completed';

        // Load tournament_results if completed
        var tournamentResults = [];
        if (isTournamentCompleted) {
            var trRes = await A.client.from('tournament_results')
                .select('*')
                .eq('tournament_id', tournamentId)
                .order('points_earned', { ascending: false });
            tournamentResults = trRes.data || [];
        }

        // Build tabs
        var activeTab = forceTab || (isTournamentCompleted ? 'results' : (hasMatches ? 'bracket' : 'registrations'));

        // Determine which nav tab is active
        var navActive = (activeTab === 'registrations') ? 'regs' :
                        (activeTab === 'schedule') ? 'schedule' :
                        (activeTab === 'results') ? 'points' : 'bracket';

        var html = '<div class="ad-brk-sticky-header">' +
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + A.esc(isEn ? (tournament.title_en || tournament.title) : tournament.title) + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adBrkBack">' + L.back + '</button>' +
            '</div>' +
            '<div class="ad-tabs ad-trn-nav-tabs">' +
            '<button class="ad-tab" data-trn-nav="edit">' + L.trnTabEdit + '</button>' +
            '<button class="ad-tab' + (navActive === 'regs' ? ' active' : '') + '" data-trn-nav="regs">' + L.trnTabRegs +
                ' <span class="ad-badge">' + registrations.filter(function(r) { return r.status === 'approved' || r.status === 'draw'; }).length +
                '/' + (tournament.draw_size || tournament.max_participants || '?') + '</span>' +
            '</button>' +
            '<button class="ad-tab' + (navActive === 'bracket' ? ' active' : '') + '" data-trn-nav="bracket">' + (tournament.bracket_type === 'round_robin' ? L.groupLabel : L.trnTabBracket) + '</button>' +
            '<button class="ad-tab' + (navActive === 'schedule' ? ' active' : '') + '" data-trn-nav="schedule">' + L.trnTabSchedule + '</button>' +
            '<button class="ad-tab' + (navActive === 'points' ? ' active' : '') + '" data-trn-nav="points">' + L.trnTabPoints + '</button>' +
            '</div>' +
        '</div>'; // /ad-brk-sticky-header

        // Registrations panel
        html += '<div class="ad-brk-panel" id="adBrkRegPanel" style="' + (activeTab !== 'registrations' ? 'display:none;' : '') + '">';
        html += renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate);
        html += '</div>';

        // Bracket / Group panel
        html += '<div class="ad-brk-panel" id="adBrkBracketPanel" style="' + (activeTab !== 'bracket' ? 'display:none;' : '') + '">';
        if (hasMatches) {
            if (tournament.bracket_type === 'round_robin') {
                html += renderGroupPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted);
            } else if (tournament.bracket_type === 'fic') {
                html += renderFicBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted);
            } else {
                html += renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted);
            }
        } else {
            html += '<div class="ad-empty-state"><p>' + (isEn ? 'No bracket generated yet. Approve registrations and generate draw.' : 'Сетка ещё не сгенерирована. Одобрите заявки и сгенерируйте жеребьёвку.') + '</p></div>';
        }
        html += '</div>';

        // Schedule panel
        if (hasMatches) {
            html += '<div class="ad-brk-panel" id="adBrkSchedulePanel" style="' + (activeTab !== 'schedule' ? 'display:none;' : '') + '">';
            html += renderSchedulePanel(matches, playersMap, tournament);
            html += '</div>';
        }

        // Results panel (only for completed tournaments)
        if (isTournamentCompleted) {
            html += '<div class="ad-brk-panel" id="adBrkResultsPanel" style="' + (activeTab !== 'results' ? 'display:none;' : '') + '">';
            html += renderResultsPanel(tournament, tournamentResults, playersMap, matches);
            html += '<div style="text-align:right;margin-top:16px;">' +
                '<button class="ad-btn ad-btn-primary" id="adBrkRecalcPoints">' +
                (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button></div>';
            html += '</div>';
        }

        container.innerHTML = html;

        // Navigation tabs — switch panels without re-render
        container.querySelectorAll('[data-trn-nav]').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var nav = tab.dataset.trnNav;
                if (nav === 'edit') { A.loadAndEditTournament(tournamentId); return; }
                // Map nav value → panel tab value
                var panelTab = (nav === 'regs') ? 'registrations' :
                               (nav === 'points') ? 'results' : nav;
                // Update active tab highlight
                container.querySelectorAll('[data-trn-nav]').forEach(function(t) { t.classList.remove('active'); });
                tab.classList.add('active');
                // Hide floating bar when switching away from registrations
                if (panelTab !== 'registrations' && floatingBar) floatingBar.style.display = 'none';
                // Toggle panels
                document.getElementById('adBrkRegPanel').style.display = panelTab === 'registrations' ? '' : 'none';
                document.getElementById('adBrkBracketPanel').style.display = panelTab === 'bracket' ? '' : 'none';
                var schedPanel = document.getElementById('adBrkSchedulePanel');
                if (schedPanel) schedPanel.style.display = panelTab === 'schedule' ? '' : 'none';
                var resPanel = document.getElementById('adBrkResultsPanel');
                if (resPanel) resPanel.style.display = panelTab === 'results' ? '' : 'none';
            });
        });

        // Back button → return to tournament form (not list)
        document.getElementById('adBrkBack').addEventListener('click', function() {
            A.loadAndEditTournament(tournamentId);
        });

        // ---- Schedule save handler ----
        var saveSchedBtn = document.getElementById('adSchedSave');
        if (saveSchedBtn) {
            saveSchedBtn.addEventListener('click', async function() {
                var rows = container.querySelectorAll('[data-match-id]');
                var updates = [];
                rows.forEach(function(row) {
                    var matchId = row.dataset.matchId;
                    var timeInput = row.querySelector('.ad-sched-time');
                    var courtEl = row.querySelector('.ad-sched-court');
                    var p1Select = row.querySelector('[data-side="p1"]');
                    var p2Select = row.querySelector('[data-side="p2"]');
                    if (!timeInput) return; // completed match, skip

                    var updateData = {
                        scheduled_time: timeInput.value || null,
                        court: courtEl ? (courtEl.value || null) : null
                    };
                    // Only update players if dropdowns exist (group matches)
                    if (p1Select) updateData.player1_id = p1Select.value || null;
                    if (p2Select) updateData.player2_id = p2Select.value || null;

                    updates.push(
                        A.client.from('matches').update(updateData).eq('id', matchId)
                    );
                });
                if (updates.length) {
                    saveSchedBtn.disabled = true;
                    await Promise.all(updates);
                    A.showToast(L.schedSaved);
                    renderBracketManagement(tournamentId, 'schedule');
                }
            });
        }

        // ---- Recalculate points button ----
        var recalcBtn = document.getElementById('adBrkRecalcPoints');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', async function() {
                this.disabled = true;
                this.textContent = isEn ? 'Recalculating...' : 'Пересчёт...';
                try {
                    // Reload fresh tournament (in case level was changed)
                    var freshTrn = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
                    var trn = freshTrn.data || tournament;
                    // Reload fresh matches
                    var freshM = await A.client.from('matches').select('*')
                        .eq('tournament_id', tournamentId)
                        .order('round_number').order('match_order');
                    var freshMatches = freshM.data || [];
                    // Reload fresh players map
                    var pIds = [];
                    freshMatches.forEach(function(m) {
                        if (m.player1_id && pIds.indexOf(m.player1_id) === -1) pIds.push(m.player1_id);
                        if (m.player2_id && pIds.indexOf(m.player2_id) === -1) pIds.push(m.player2_id);
                    });
                    var freshPM = {};
                    if (pIds.length) {
                        var plR = await A.client.from('players').select('id, name, name_en, points, category_id').in('id', pIds);
                        (plR.data || []).forEach(function(p) { freshPM[p.id] = p; });
                    }
                    if (trn.bracket_type === 'round_robin') {
                        await finalizeGroupTournament(trn, freshMatches, freshPM);
                    } else {
                        await finalizeTournament(trn, freshMatches, freshPM);
                    }
                    renderBracketManagement(tournamentId, 'results');
                } catch (err) {
                    A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
                    var btn = document.getElementById('adBrkRecalcPoints');
                    if (btn) { btn.disabled = false; btn.textContent = isEn ? 'Recalculate Points' : 'Пересчитать очки'; }
                }
            });
        }

        // ---- Floating action bar for registration removal ----
        var floatingBar = document.createElement('div');
        floatingBar.className = 'ad-reg-floating-bar';
        floatingBar.style.display = 'none';
        floatingBar.innerHTML =
            '<span class="ad-reg-floating-count"></span>' +
            '<button class="ad-btn ad-btn-sm ad-btn-danger ad-reg-floating-remove">' + L.regRemoveSelected + '</button>';
        document.body.appendChild(floatingBar);

        function updateFloatingBar() {
            var allChecked = container.querySelectorAll('.ad-reg-check:checked');
            if (allChecked.length > 0) {
                floatingBar.style.display = '';
                floatingBar.querySelector('.ad-reg-floating-count').textContent =
                    (isEn ? 'Selected: ' : 'Выбрано: ') + allChecked.length;
                floatingBar.querySelector('.ad-reg-floating-remove').textContent =
                    L.regRemoveSelected + ' (' + allChecked.length + ')';
            } else {
                floatingBar.style.display = 'none';
            }
        }

        // Cleanup floating bar when leaving this view
        var origCleanup = container._cleanupFloatingBar;
        if (origCleanup) origCleanup();
        container._cleanupFloatingBar = function() { floatingBar.remove(); };

        // Registration checkboxes: select all
        container.querySelectorAll('.ad-reg-check-all').forEach(function(allCb) {
            allCb.addEventListener('change', function() {
                var group = allCb.dataset.group;
                container.querySelectorAll('.ad-reg-check[data-group="' + group + '"]').forEach(function(cb) {
                    cb.checked = allCb.checked;
                });
                updateFloatingBar();
            });
        });

        // Registration checkboxes: individual toggle
        container.querySelectorAll('.ad-reg-check').forEach(function(cb) {
            cb.addEventListener('change', function() {
                updateFloatingBar();
            });
        });

        // Waitlist: approve buttons
        container.querySelectorAll('.ad-btn-approve').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;
                await A.client.from('tournament_registrations').update({ status: 'pending' }).eq('id', regId);
                A.showToast(L.regApproved);
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Waitlist: reject buttons
        container.querySelectorAll('.ad-btn-reject').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var regId = btn.dataset.regId;
                btn.disabled = true;
                await A.client.from('tournament_registrations').update({ status: 'rejected' }).eq('id', regId);
                A.showToast(L.regRejected);
                renderBracketManagement(tournamentId, 'registrations');
            });
        });

        // Floating bar: remove button
        floatingBar.querySelector('.ad-reg-floating-remove').addEventListener('click', function() {
            var checked = container.querySelectorAll('.ad-reg-check:checked');
            if (checked.length === 0) return;

            var ids = [];
            var names = [];
            checked.forEach(function(cb) {
                ids.push(cb.dataset.regId);
                names.push(cb.dataset.playerName || '—');
            });

            var namesList = names.map(function(n) { return '• ' + n; }).join('<br>');
            var confirmText = '<div style="text-align:left;margin-top:8px;max-height:200px;overflow-y:auto;font-size:0.9rem;line-height:1.6;">' + namesList + '</div>';

            A.showConfirm(L.regRemoveConfirm, confirmText, async function() {
                await removeRegistrations(ids, tournamentId);
                floatingBar.remove();
                renderBracketManagement(tournamentId, 'registrations');
            }, L.regRemoveSelected);
        });

        // Generate draw button
        var genBtn = document.getElementById('adBrkGenerateDraw');
        if (genBtn) {
            genBtn.addEventListener('click', function() {
                A.showConfirm(L.generateDrawConfirm, '', async function() {
                    await generateBracketDraw(tournament, registrations, playersMap);
                    renderBracketManagement(tournamentId);
                }, L.generateDraw);
            });
        }

        // Score entry buttons
        container.querySelectorAll('[data-match-edit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var matchId = btn.dataset.matchEdit;
                var match = matches.find(function(m) { return m.id === matchId; });
                if (match) openScoreModal(match, playersMap, tournamentId);
            });
        });

        // Regenerate draw button
        var regenBtn = document.getElementById('adBrkRegenerate');
        if (regenBtn) {
            regenBtn.addEventListener('click', function() {
                A.showConfirm(L.regenerateConfirm, '', async function() {
                    await regenerateDraw(tournament, tournamentId);
                }, L.regenerateDraw);
            });
        }

        // Generate Playoff button
        var genPlayoffBtn = document.getElementById('adBrkGenPlayoff');
        if (genPlayoffBtn) {
            genPlayoffBtn.addEventListener('click', function() {
                A.showConfirm(L.generatePlayoffConfirm, '', async function() {
                    await generatePlayoffDraw(tournament, matches, playersMap);
                    renderBracketManagement(tournamentId, 'bracket');
                }, L.generatePlayoff);
            });
        }

        // Finalize button
        var finBtn = document.getElementById('adBrkFinalize');
        if (finBtn) {
            finBtn.addEventListener('click', function() {
                A.showConfirm(L.finalizeConfirm, '', async function() {
                    await finalizeTournament(tournament, matches, playersMap);
                    renderBracketManagement(tournamentId);
                }, L.finalizeTournament);
            });
        }

        // Recalculate points button (for completed tournaments)
        var recalcBtn = document.getElementById('adBrkRecalc');
        if (recalcBtn) {
            recalcBtn.addEventListener('click', async function() {
                recalcBtn.disabled = true;
                recalcBtn.textContent = isEn ? 'Recalculating...' : 'Пересчёт...';
                // Reload fresh matches from DB before recalculating
                var freshRes = await A.client.from('matches').select('*')
                    .eq('tournament_id', tournamentId)
                    .order('round_number', { ascending: true })
                    .order('match_order', { ascending: true });
                var freshMatches = freshRes.data || matches;
                await finalizeTournament(tournament, freshMatches, playersMap);
                renderBracketManagement(tournamentId);
            });
        }
    }

    // ---- Registrations Panel HTML ----
    function renderRegistrationsPanel(tournament, registrations, playersMap, canGenerate) {
        var html = '';
        var maxPart = tournament.max_participants || 16;

        // Split by status (not overflow)
        var mainDraw = registrations.filter(function(r) { return r.status === 'approved' || r.status === 'pending'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var waitlistRegs = registrations.filter(function(r) { return r.status === 'waitlist'; })
            .sort(function(a, b) { return (a.registered_at || '').localeCompare(b.registered_at || ''); });
        var withdrawn = registrations.filter(function(r) { return r.status === 'withdrawn' || r.status === 'rejected'; });

        if (mainDraw.length === 0 && waitlistRegs.length === 0 && withdrawn.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.noRegistrations + '</p></div>';
        } else {
            var thCategory = isEn ? 'Category' : 'Категория';
            var thRank = isEn ? 'Rank' : 'Ранг';
            var thRegTime = isEn ? 'Registered' : 'Регистрация';
            var regTableHead = '<th style="width:32px;"><input type="checkbox" class="ad-reg-check-all" data-group="GRP"></th>' +
                '<th style="width:32px;text-align:center;padding:4px 6px;">#</th><th style="width:32px;text-align:center;padding:4px 6px;">' + thRank + '</th><th>' + L.plrName + '</th><th>' + thCategory + '</th><th>' + thRegTime + '</th>';

            // Overflow warning
            if (mainDraw.length > maxPart) {
                html += '<div class="ad-alert ad-alert-warning" style="margin-bottom:12px;">' +
                    (isEn ? 'Warning: ' : 'Внимание: ') + mainDraw.length + ' ' + L.regCount + ', ' +
                    (isEn ? 'but max participants is ' : 'но макс. участников — ') + maxPart +
                '</div>';
            }

            // ---- Main Draw ----
            html += '<h3 class="ad-reg-section-title">' + L.regMainDraw + ' <span class="ad-badge">' + mainDraw.length + '/' + maxPart + '</span></h3>';
            if (mainDraw.length > 0) {
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    regTableHead.replace('GRP', 'main') +
                '</tr></thead><tbody>';
                mainDraw.forEach(function(reg, idx) {
                    html += renderRegRow(reg, idx + 1, playersMap, 'main');
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="ad-empty-state" style="padding:16px 0;"><p>' + L.noRegistrations + '</p></div>';
            }

            // ---- Waitlist ----
            var waitTableHead = regTableHead + '<th style="width:80px;text-align:center;">' + (isEn ? 'Actions' : 'Действия') + '</th>';
            html += '<h3 class="ad-reg-section-title" style="margin-top:24px;">' + L.regWaitlist + ' <span class="ad-badge">' + waitlistRegs.length + '</span></h3>';
            if (waitlistRegs.length > 0) {
                html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                    waitTableHead.replace('GRP', 'wait') +
                '</tr></thead><tbody>';
                waitlistRegs.forEach(function(reg, idx) {
                    html += renderRegRow(reg, idx + 1, playersMap, 'wait');
                });
                html += '</tbody></table></div>';
            } else {
                html += '<div class="ad-empty-state" style="padding:16px 0;"><p>' + L.regNoWaitlist + '</p></div>';
            }
        }

        // Generate draw button
        if (canGenerate && tournament.bracket_type) {
            var drawSize = tournament.draw_size || 16;
            html += '<div style="margin-top:16px;text-align:center;">' +
                '<p style="margin-bottom:8px;">' + mainDraw.length + ' ' + L.regCount + ' / ' + drawSize + '</p>' +
                '<button class="ad-btn ad-btn-primary" id="adBrkGenerateDraw">' + L.generateDraw + '</button>' +
            '</div>';
        }

        return html;
    }

    function renderRegRow(reg, num, playersMap, group) {
        var player = reg.players || playersMap[reg.player_id] || {};
        var pmEntry = playersMap[reg.player_id] || {};
        var pName = isEn ? (player.name_en || player.name || reg.player_id) : (player.name || reg.player_id);
        var seedHtml = reg.seed_number ? ' <span class="ad-badge ad-badge-accent">[' + reg.seed_number + ']</span>' : '';
        var catId = player.category_id || pmEntry.category_id || '';
        var catParts = catId.split('-');
        var catLabel = catParts.length > 1
            ? catParts.slice(1).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('-')
            : catId || '—';
        var rankVal = pmEntry.rank || '—';
        var regDT = '';
        if (reg.registered_at) {
            var d = new Date(reg.registered_at);
            regDT = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                ' <span style="color:var(--text-dim);">' +
                d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '</span>';
        }
        var actionsTd = '';
        if (group === 'wait') {
            actionsTd = '<td style="text-align:center;white-space:nowrap;">' +
                '<button class="ad-btn-icon ad-btn-approve" data-reg-id="' + reg.id + '" title="' + L.regApprove + '" style="color:#4caf50;background:none;border:none;cursor:pointer;font-size:1.1rem;padding:2px 6px;">✓</button>' +
                '<button class="ad-btn-icon ad-btn-reject" data-reg-id="' + reg.id + '" title="' + L.regReject + '" style="color:#f44336;background:none;border:none;cursor:pointer;font-size:1.1rem;padding:2px 6px;">✕</button>' +
            '</td>';
        }
        return '<tr>' +
            '<td><input type="checkbox" class="ad-reg-check" data-group="' + group + '" data-reg-id="' + reg.id + '" data-player-name="' + A.esc(pName) + '"></td>' +
            '<td style="text-align:center;padding:4px 6px;">' + num + '</td>' +
            '<td style="text-align:center;padding:4px 6px;font-size:0.65rem;color:var(--accent);font-weight:600;">' + rankVal + '</td>' +
            '<td>' + A.esc(pName) + seedHtml + '</td>' +
            '<td style="font-size:0.8rem;">' + A.esc(catLabel) + '</td>' +
            '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + regDT + '</td>' +
            actionsTd +
        '</tr>';
    }

    // ---- Schedule Panel HTML (tables by court, inline-edit) ----
    function renderSchedulePanel(matches, playersMap, tournament) {
        var courtCount = (tournament && tournament.court_count) || 2;
        var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // All matches with scheduled_time (skip BYEs)
        var allScheduled = matches.filter(function(m) {
            return m.scheduled_time && m.score !== 'BYE';
        });

        if (!allScheduled.length) {
            return '<div class="ad-empty-state"><p>' + (isEn ? 'No schedule assigned yet.' : 'Расписание ещё не назначено.') + '</p></div>';
        }

        // Split into group and playoff matches
        var groupScheduled = allScheduled.filter(function(m) { return m.group_number && m.group_number > 0; });
        var playoffScheduled = allScheduled.filter(function(m) { return !m.group_number || m.group_number <= 0; });

        // Group matches by court
        var byCourt = {};
        groupScheduled.forEach(function(m) {
            var c = m.court || '1';
            if (!byCourt[c]) byCourt[c] = [];
            byCourt[c].push(m);
        });

        // Sort courts numerically
        var courtKeys = Object.keys(byCourt).sort(function(a, b) { return parseInt(a, 10) - parseInt(b, 10); });

        // Build per-group player list directly from matches (most reliable source)
        var groupPlayerIds = {};
        matches.forEach(function(m) {
            if (!m.group_number) return;
            var g = m.group_number;
            if (!groupPlayerIds[g]) groupPlayerIds[g] = {};
            if (m.player1_id) groupPlayerIds[g][m.player1_id] = true;
            if (m.player2_id) groupPlayerIds[g][m.player2_id] = true;
        });
        // Convert to sorted player arrays
        var groupPlayerOpts = {};
        Object.keys(groupPlayerIds).forEach(function(g) {
            var players = Object.keys(groupPlayerIds[g])
                .map(function(id) { return playersMap[id]; })
                .filter(Boolean);
            players.sort(function(a, b) {
                var na = isEn ? (a.name_en || a.name) : a.name;
                var nb = isEn ? (b.name_en || b.name) : b.name;
                return na.localeCompare(nb);
            });
            groupPlayerOpts[g] = players;
        });
        // Build HTML options per group
        function buildGroupOpts(groupNum) {
            var opts = '<option value="">—</option>';
            var players = groupPlayerOpts[groupNum] || [];
            players.forEach(function(p) {
                var pName = isEn ? (p.name_en || p.name) : p.name;
                opts += '<option value="' + p.id + '">' + A.esc(pName) + '</option>';
            });
            return opts;
        }
        // Fallback: all players (for playoff or non-group matches)
        function buildAllOpts() {
            var opts = '<option value="">—</option>';
            var sorted = Object.keys(playersMap).map(function(id) { return playersMap[id]; })
                .sort(function(a, b) {
                    var na = isEn ? (a.name_en || a.name) : a.name;
                    var nb = isEn ? (b.name_en || b.name) : b.name;
                    return na.localeCompare(nb);
                });
            sorted.forEach(function(p) {
                var pName = isEn ? (p.name_en || p.name) : p.name;
                opts += '<option value="' + p.id + '">' + A.esc(pName) + '</option>';
            });
            return opts;
        }

        // Build court options
        var courtOpts = '';
        for (var ci = 1; ci <= courtCount; ci++) {
            courtOpts += '<option value="' + ci + '">' + L.schedCourtTitle + ' ' + ci + '</option>';
        }

        // Detect court→group mapping (for 1:1 scenario)
        function detectCourtGroup(courtMatches) {
            var groups = {};
            courtMatches.forEach(function(m) {
                if (m.group_number) groups[m.group_number] = (groups[m.group_number] || 0) + 1;
            });
            var gKeys = Object.keys(groups);
            if (gKeys.length === 1) return parseInt(gKeys[0], 10);
            return null;
        }

        var html = '';

        courtKeys.forEach(function(courtKey) {
            var courtMatches = byCourt[courtKey];
            // Sort by scheduled_time
            courtMatches.sort(function(a, b) {
                if (a.scheduled_time < b.scheduled_time) return -1;
                if (a.scheduled_time > b.scheduled_time) return 1;
                return a.match_order - b.match_order;
            });

            // Court title with optional group label
            var courtGroup = detectCourtGroup(courtMatches);
            var titleExtra = courtGroup ? ' (' + L.groupLabel + ' ' + (groupLetters[courtGroup - 1] || courtGroup) + ')' : '';
            html += '<div class="ad-sched-section">';
            html += '<div class="ad-sched-court-title">' + L.schedCourtTitle + ' ' + courtKey + titleExtra + '</div>';

            html += '<table class="ad-table ad-sched-table" style="margin-top:4px;">' +
                '<thead><tr>' +
                    '<th class="sched-num">№</th>' +
                    '<th class="sched-time">' + L.schedTime + '</th>' +
                    '<th class="sched-round">' + L.schedRound + '</th>' +
                    '<th class="sched-p">' + (isEn ? 'Player 1' : 'Игрок 1') + '</th>' +
                    '<th class="sched-vs"></th>' +
                    '<th class="sched-p">' + (isEn ? 'Player 2' : 'Игрок 2') + '</th>' +
                    '<th class="sched-court">' + L.schedCourt + '</th>' +
                    '<th class="sched-status">' + L.status + '</th>' +
                '</tr></thead><tbody>';

            courtMatches.forEach(function(m, idx) {
                var isDone = m.status === 'completed';
                var disabledAttr = isDone ? ' disabled' : '';
                var time = m.scheduled_time ? m.scheduled_time.slice(0, 5) : '';

                // Round label
                var round = m.round || '';
                if (m.group_number) {
                    round = L.groupLabel + ' ' + (groupLetters[m.group_number - 1] || m.group_number);
                }

                // Status
                var statusClass = isDone ? 'ad-badge-success' : (m.status === 'live' ? 'ad-badge-warning' : 'ad-badge-dim');
                var statusText = isDone ? (isEn ? 'Done' : 'Завершён') :
                                 m.status === 'live' ? 'Live' :
                                 (isEn ? 'Upcoming' : 'Ожидает');

                // Time input
                var timeHtml = isDone
                    ? '<span style="font-weight:600;">' + (time || '—') + '</span>'
                    : '<input type="text" class="ad-sched-time" value="' + time + '" placeholder="HH:MM" maxlength="5" pattern="[0-2][0-9]:[0-5][0-9]"' + disabledAttr + '>';

                // Player selects
                var p1Select, p2Select;
                if (isDone) {
                    var p1 = playersMap[m.player1_id];
                    var p2 = playersMap[m.player2_id];
                    p1Select = '<span>' + (p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : '—') + '</span>';
                    p2Select = '<span>' + (p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : '—') + '</span>';
                } else {
                    var opts = m.group_number ? buildGroupOpts(m.group_number) : buildAllOpts();
                    p1Select = '<select class="ad-sched-player" data-side="p1">' + opts.replace(
                        'value="' + m.player1_id + '"',
                        'value="' + m.player1_id + '" selected'
                    ) + '</select>';
                    p2Select = '<select class="ad-sched-player" data-side="p2">' + opts.replace(
                        'value="' + m.player2_id + '"',
                        'value="' + m.player2_id + '" selected'
                    ) + '</select>';
                }

                // Court select
                var courtHtml = isDone
                    ? '<span>' + L.schedCourtTitle + ' ' + (m.court || '1') + '</span>'
                    : '<select class="ad-sched-court">' + courtOpts.replace(
                        'value="' + (m.court || '1') + '"',
                        'value="' + (m.court || '1') + '" selected'
                    ) + '</select>';

                html += '<tr data-match-id="' + m.id + '">' +
                    '<td style="text-align:center;color:var(--text-dim);">' + (idx + 1) + '</td>' +
                    '<td>' + timeHtml + '</td>' +
                    '<td><span class="ad-badge">' + round + '</span></td>' +
                    '<td>' + p1Select + '</td>' +
                    '<td class="sched-vs">vs</td>' +
                    '<td>' + p2Select + '</td>' +
                    '<td>' + courtHtml + '</td>' +
                    '<td><span class="ad-badge ' + statusClass + '">' + statusText + '</span></td>' +
                '</tr>';
            });

            html += '</tbody></table></div>';
        });

        // ---- Playoff section (flat list, no court grouping) ----
        if (playoffScheduled.length) {
            playoffScheduled.sort(function(a, b) {
                if (a.round_number !== b.round_number) return a.round_number - b.round_number;
                return a.match_order - b.match_order;
            });

            html += '<div class="ad-sched-section">';
            html += '<div class="ad-sched-court-title">' + L.playoffTitle + '</div>';
            html += '<table class="ad-table ad-sched-table" style="margin-top:4px;">' +
                '<thead><tr>' +
                    '<th class="sched-num">№</th>' +
                    '<th class="sched-time">' + L.schedTime + '</th>' +
                    '<th class="sched-round">' + L.schedRound + '</th>' +
                    '<th class="sched-p">' + (isEn ? 'Player 1' : 'Игрок 1') + '</th>' +
                    '<th class="sched-vs"></th>' +
                    '<th class="sched-p">' + (isEn ? 'Player 2' : 'Игрок 2') + '</th>' +
                    '<th class="sched-court">' + L.schedCourt + '</th>' +
                    '<th class="sched-status">' + L.status + '</th>' +
                '</tr></thead><tbody>';

            var allOpts = buildAllOpts();

            playoffScheduled.forEach(function(m, idx) {
                var isDone = m.status === 'completed';
                var disabledAttr = isDone ? ' disabled' : '';
                var time = m.scheduled_time ? m.scheduled_time.slice(0, 5) : '';

                // Round label (SF, F, 3RD, etc.)
                var round = m.round || '';

                // Status
                var statusClass = isDone ? 'ad-badge-success' : (m.status === 'live' ? 'ad-badge-warning' : 'ad-badge-dim');
                var statusText = isDone ? (isEn ? 'Done' : 'Завершён') :
                                 m.status === 'live' ? 'Live' :
                                 (isEn ? 'Upcoming' : 'Ожидает');

                // Time input
                var timeHtml = isDone
                    ? '<span style="font-weight:600;">' + (time || '—') + '</span>'
                    : '<input type="text" class="ad-sched-time" value="' + time + '" placeholder="HH:MM" maxlength="5" pattern="[0-2][0-9]:[0-5][0-9]"' + disabledAttr + '>';

                // Player display (not editable — determined by bracket advancement)
                var p1 = playersMap[m.player1_id];
                var p2 = playersMap[m.player2_id];
                var p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (m.player1_id ? 'TBD' : '—');
                var p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (m.player2_id ? 'TBD' : '—');

                // Court — free text input (manager fills manually)
                var courtVal = m.court || '';
                var courtHtml = isDone
                    ? '<span>' + (courtVal ? L.schedCourtTitle + ' ' + courtVal : '—') + '</span>'
                    : '<input type="text" class="ad-sched-court" value="' + courtVal + '" placeholder="—" maxlength="3"' + disabledAttr + '>';

                html += '<tr data-match-id="' + m.id + '">' +
                    '<td style="text-align:center;color:var(--text-dim);">' + (idx + 1) + '</td>' +
                    '<td>' + timeHtml + '</td>' +
                    '<td><span class="ad-badge">' + round + '</span></td>' +
                    '<td>' + p1Name + '</td>' +
                    '<td class="sched-vs">vs</td>' +
                    '<td>' + p2Name + '</td>' +
                    '<td>' + courtHtml + '</td>' +
                    '<td><span class="ad-badge ' + statusClass + '">' + statusText + '</span></td>' +
                '</tr>';
            });

            html += '</tbody></table></div>';
        }

        // Save button
        html += '<div style="text-align:right;margin-top:16px;">' +
            '<button class="ad-btn ad-btn-primary" id="adSchedSave">' + L.schedSave + '</button>' +
        '</div>';

        return html;
    }

    // ---- Group Panel HTML (Round-Robin) ----
    // ---- Helpers to distinguish group vs playoff matches ----
    function isGroupMatch(m) { return m.group_number && m.group_number > 0; }
    function isPlayoffMatch(m) { return !m.group_number && m.round && m.round.charAt(0) !== 'G'; }

    function renderGroupPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted) {
        var groupCount = tournament.group_count || 2;
        var qualifiers = tournament.qualifiers_per_group || 2;
        var html = '';
        var groupLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        // Split matches into group and playoff
        var grpMatches = matches.filter(isGroupMatch);
        var plMatches = matches.filter(isPlayoffMatch);
        var hasPlayoff = plMatches.length > 0;

        // Group completion: all GROUP matches completed
        var allGroupCompleted = grpMatches.length > 0 && grpMatches.every(function(m) { return m.status === 'completed'; });
        var anyGroupCompleted = grpMatches.some(function(m) { return m.status === 'completed'; });

        // Playoff completion
        var allPlayoffCompleted = hasPlayoff && plMatches.every(function(m) { return m.status === 'completed'; });

        // Overall completion
        var totalAllCompleted = allGroupCompleted && (!hasPlayoff || allPlayoffCompleted);

        // Action buttons
        html += '<div style="display:flex;justify-content:flex-end;gap:8px;margin-bottom:16px;">';
        if (!anyGroupCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
        }
        if (allGroupCompleted && !hasPlayoff && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkGenPlayoff">' + L.generatePlayoff + '</button>';
        }
        if (totalAllCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        // ---- Playoff bracket (rendered above groups) ----
        if (hasPlayoff) {
            html += '<div class="ad-grp-playoff-section">';
            html += '<div class="ad-grp-section-title">' + L.playoffTitle + '</div>';
            // Determine draw_size for playoff bracket from playoff matches
            var plR1 = plMatches.filter(function(m) { return m.round_number === 1; });
            var plDrawSize = 1;
            while (plDrawSize < plR1.length * 2) plDrawSize *= 2;
            if (plDrawSize < 2) plDrawSize = plMatches.length * 2;
            // Use renderBracketPanel logic inline for playoff
            html += renderPlayoffBracketHtml(plMatches, playersMap, plDrawSize);
            html += '</div>';
            // Separator
            html += '<div class="ad-grp-stage-separator">';
            html += '<div class="ad-grp-section-title">' + L.groupStageTitle + '</div>';
            html += '</div>';
        }

        // ---- Group tables ----
        for (var g = 1; g <= groupCount; g++) {
            var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
            if (!groupMatchesG.length) continue;

            // Collect unique player IDs in this group
            var playerIds = [];
            groupMatchesG.forEach(function(m) {
                if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
            });

            // Calculate standings
            var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);

            // Stable order: by seed (ascending), unseeded keep draw order
            standings.sort(function(a, b) {
                var sa = a.seed || 9999;
                var sb = b.seed || 9999;
                if (sa !== sb) return sa - sb;
                return playerIds.indexOf(a.playerId) - playerIds.indexOf(b.playerId);
            });

            // Build matrix table
            var letter = groupLetters[g - 1] || String(g);
            html += '<div class="ad-grp-block">';
            html += '<div class="ad-grp-title">' + L.groupLabel + ' ' + letter + '</div>';
            html += '<div class="ad-table-wrap" style="overflow-x:auto;">';
            html += '<table class="ad-table ad-grp-matrix">';

            // Header
            html += '<thead><tr>';
            html += '<th style="width:30px;">№</th>';
            html += '<th>' + (isEn ? 'Player' : 'Игрок') + '</th>';
            for (var c = 0; c < standings.length; c++) {
                html += '<th class="ad-grp-score" style="width:60px;text-align:center;">' + (c + 1) + '</th>';
            }
            html += '<th class="ad-grp-pts" style="width:40px;text-align:center;">' + L.groupWins + '</th>';
            html += '<th class="ad-grp-place" style="width:50px;text-align:center;">' + L.groupPlace + '</th>';
            html += '</tr></thead>';

            // Body
            html += '<tbody>';
            for (var row = 0; row < standings.length; row++) {
                var st = standings[row];
                var p = playersMap[st.playerId] || {};
                var pName = isEn ? (p.name_en || p.name || '?') : (p.name || '?');
                var seedHtml = st.seed ? ' <span class="ad-badge" style="font-size:0.65rem;">[' + st.seed + ']</span>' : '';
                var isQualified = st.place <= qualifiers && allGroupCompleted;

                html += '<tr' + (isQualified && hasPlayoff ? ' style="background:rgba(204,255,0,0.06);"' : '') + '>';
                html += '<td style="font-weight:600;text-align:center;">' + (row + 1) + '</td>';
                html += '<td style="white-space:nowrap;">' + A.esc(pName) + seedHtml +
                    (isQualified && hasPlayoff ? ' <span style="color:var(--accent);font-size:0.65rem;">&#9654;</span>' : '') + '</td>';

                for (var col = 0; col < standings.length; col++) {
                    if (row === col) {
                        // Diagonal
                        html += '<td class="ad-grp-diag">&times;</td>';
                    } else {
                        var opponentId = standings[col].playerId;
                        var match = findGroupMatch(groupMatchesG, st.playerId, opponentId);
                        if (match && match.status === 'completed' && match.score) {
                            var scoreDisplay = formatGroupScore(match, st.playerId);
                            var isWin = match.winner_id === st.playerId;
                            html += '<td class="ad-grp-score ' + (isWin ? 'ad-grp-win' : 'ad-grp-loss') + '" ' +
                                'data-match-edit="' + match.id + '" style="cursor:pointer;text-align:center;">' +
                                scoreDisplay + '</td>';
                        } else if (match) {
                            html += '<td class="ad-grp-score ad-grp-pending" data-match-edit="' + match.id + '" ' +
                                'style="cursor:pointer;text-align:center;">—</td>';
                        } else {
                            html += '<td class="ad-grp-score" style="text-align:center;">—</td>';
                        }
                    }
                }

                html += '<td class="ad-grp-pts" style="text-align:center;font-weight:600;">' + st.wins + '</td>';
                html += '<td class="ad-grp-place" style="text-align:center;font-weight:700;' +
                    (st.place <= qualifiers ? 'color:var(--accent);' : '') + '">' + st.place + '</td>';
                html += '</tr>';
            }
            html += '</tbody></table></div></div>';
        }

        return html;
    }

    // ---- Render Playoff bracket HTML (reuses bracket logic for SE matches) ----
    function renderPlayoffBracketHtml(plMatches, playersMap, drawSize) {
        var totalRounds = Math.log2(drawSize);
        var html = '';

        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [] };
            var sets = score.split(' ');
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets };
        }

        html += '<div class="ad-brk-scroll"><div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = plMatches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = getRoundName(r, totalRounds, drawSize);

            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                var p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE');
                var p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE');

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match' + (isCompleted ? ' completed' : '') + (match.status === 'live' ? ' live' : '');
                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';
                if (match.scheduled_time) {
                    var schedInfo = match.scheduled_time.slice(0, 5);
                    if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
                    html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
                }
                html += '<div class="ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : '')) + '">' +
                    (match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p1Name + '</span><span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                html += '<div class="ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : '')) + '">' +
                    (match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p2Name + '</span><span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }
                html += '</div>';
            });

            html += '</div>'; // /ad-brk-matches
            html += '</div>'; // /ad-brk-round

            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                html += '<div class="ad-brk-connector-inner">';
                for (var ci = 0; ci < pairCount; ci++) {
                    html += '<div class="ad-brk-conn-pair"><div class="ad-brk-conn-top"></div><div class="ad-brk-conn-mid"></div><div class="ad-brk-conn-bottom"></div></div>';
                }
                html += '</div></div>';
            }
        }

        html += '</div></div>'; // /ad-brk-grid, /ad-brk-scroll

        // 3rd place — separate block under bracket
        var thirdMatch = plMatches.find(function(m) { return m.round === '3RD'; });
        if (thirdMatch) {
            var tp1 = playersMap[thirdMatch.player1_id];
            var tp2 = playersMap[thirdMatch.player2_id];
            var tp1Name = tp1 ? A.esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
            var tp2Name = tp2 ? A.esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
            var tCompleted = thirdMatch.status === 'completed';
            var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
            var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
            var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && thirdMatch.score !== 'BYE';
            var tSetData = parseSets(thirdMatch.score);

            html += '<div style="margin-top:20px;max-width:220px;">';
            html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>';
            html += '<div class="ad-brk-match' + (tCompleted ? ' completed' : '') + '">';
            if (thirdMatch.scheduled_time) {
                html += '<div class="ad-brk-schedule">' + thirdMatch.scheduled_time.slice(0, 5) +
                    (thirdMatch.court ? ' · ' + (isEn ? 'Court ' : 'Корт ') + thirdMatch.court : '') + '</div>';
            }
            html += '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp1Name + '</span><span class="ad-brk-sets">';
            tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            html += '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                '<span class="ad-brk-name">' + tp2Name + '</span><span class="ad-brk-sets">';
            tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            if (tCanEdit) {
                html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                    (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            }
            html += '</div></div>';
        }

        return html;
    }

    // ---- Find match between two players in group ----
    function findGroupMatch(matches, p1Id, p2Id) {
        for (var i = 0; i < matches.length; i++) {
            var m = matches[i];
            if ((m.player1_id === p1Id && m.player2_id === p2Id) ||
                (m.player1_id === p2Id && m.player2_id === p1Id)) {
                return m;
            }
        }
        return null;
    }

    // ---- Format score from perspective of a specific player ----
    function formatGroupScore(match, perspectiveId) {
        if (!match.score) return '—';
        var sets = match.score.split(' ');
        var needFlip = match.player1_id !== perspectiveId;

        return sets.map(function(s) {
            // Parse "6/3" or "7/6(7-5)"
            var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
            if (!m) return s;
            var a = m[1], b = m[2];
            if (needFlip) { var tmp = a; a = b; b = tmp; }
            return a + ':' + b;
        }).join(' ');
    }

    // ---- Parse score into sets/games for standings ----
    function parseScoreSetsGames(score, playerId, match) {
        var result = { setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
        if (!score || score === 'BYE') return result;

        var isPlayer1 = match.player1_id === playerId;
        var sets = score.split(' ');

        sets.forEach(function(s) {
            var m = s.match(/^(\d+)\/(\d+)/);
            if (!m) return;
            var s1 = parseInt(m[1], 10);
            var s2 = parseInt(m[2], 10);
            var pGames = isPlayer1 ? s1 : s2;
            var oGames = isPlayer1 ? s2 : s1;
            result.gamesWon += pGames;
            result.gamesLost += oGames;
            if (pGames > oGames) result.setsWon++;
            else result.setsLost++;
        });

        return result;
    }

    // ---- Calculate Group Standings (ITF Tiebreaking) ----
    function calculateGroupStandings(playerIds, groupMatches, playersMap) {
        // Build per-player stats
        var stats = {};
        playerIds.forEach(function(pid) {
            stats[pid] = {
                playerId: pid,
                wins: 0,
                losses: 0,
                setsWon: 0,
                setsLost: 0,
                gamesWon: 0,
                gamesLost: 0,
                place: 0,
                seed: null
            };
        });

        // Find seeds from matches
        groupMatches.forEach(function(m) {
            if (m.seed1 && stats[m.player1_id]) stats[m.player1_id].seed = m.seed1;
            if (m.seed2 && stats[m.player2_id]) stats[m.player2_id].seed = m.seed2;
        });

        // Accumulate completed match stats
        var completedMatches = groupMatches.filter(function(m) {
            return m.status === 'completed' && m.winner_id && m.score && m.score !== 'BYE';
        });

        completedMatches.forEach(function(m) {
            if (stats[m.winner_id]) stats[m.winner_id].wins++;
            var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
            if (stats[loserId]) stats[loserId].losses++;

            // Sets & games
            [m.player1_id, m.player2_id].forEach(function(pid) {
                if (!stats[pid]) return;
                var sg = parseScoreSetsGames(m.score, pid, m);
                stats[pid].setsWon += sg.setsWon;
                stats[pid].setsLost += sg.setsLost;
                stats[pid].gamesWon += sg.gamesWon;
                stats[pid].gamesLost += sg.gamesLost;
            });
        });

        var arr = playerIds.map(function(pid) { return stats[pid]; });

        // Sort by wins DESC first
        arr.sort(function(a, b) { return b.wins - a.wins; });

        // ITF Tiebreaking: group players with same wins, then resolve
        var place = 1;
        var i = 0;
        while (i < arr.length) {
            // Find cluster of same wins
            var j = i;
            while (j < arr.length && arr[j].wins === arr[i].wins) j++;
            var cluster = arr.slice(i, j);

            if (cluster.length === 1) {
                cluster[0].place = place;
            } else if (cluster.length === 2) {
                // Head-to-head
                var h2h = findGroupMatch(completedMatches, cluster[0].playerId, cluster[1].playerId);
                if (h2h && h2h.winner_id) {
                    if (h2h.winner_id === cluster[0].playerId) {
                        cluster[0].place = place;
                        cluster[1].place = place + 1;
                    } else {
                        cluster[1].place = place;
                        cluster[0].place = place + 1;
                    }
                } else {
                    // Unresolved — set% then game%
                    resolveByPercentages(cluster, completedMatches, place);
                }
            } else {
                // 3+ players tied: recalc stats among themselves only
                resolveMultiWayTie(cluster, completedMatches, place);
            }

            place += cluster.length;
            i = j;
        }

        // Re-sort by place
        arr.sort(function(a, b) { return a.place - b.place; });
        return arr;
    }

    // ---- Resolve tie by set% then game% ----
    function resolveByPercentages(cluster, matches, startPlace) {
        cluster.sort(function(a, b) {
            var aSetPct = a.setsWon + a.setsLost > 0 ? a.setsWon / (a.setsWon + a.setsLost) : 0;
            var bSetPct = b.setsWon + b.setsLost > 0 ? b.setsWon / (b.setsWon + b.setsLost) : 0;
            if (bSetPct !== aSetPct) return bSetPct - aSetPct;

            var aGamePct = a.gamesWon + a.gamesLost > 0 ? a.gamesWon / (a.gamesWon + a.gamesLost) : 0;
            var bGamePct = b.gamesWon + b.gamesLost > 0 ? b.gamesWon / (b.gamesWon + b.gamesLost) : 0;
            return bGamePct - aGamePct;
        });
        for (var k = 0; k < cluster.length; k++) {
            cluster[k].place = startPlace + k;
        }
    }

    // ---- Resolve 3+ way tie (recalc stats among tied players only) ----
    function resolveMultiWayTie(cluster, allCompletedMatches, startPlace) {
        var tiedIds = cluster.map(function(c) { return c.playerId; });

        // Filter matches to only those between tied players
        var subMatches = allCompletedMatches.filter(function(m) {
            return tiedIds.indexOf(m.player1_id) !== -1 && tiedIds.indexOf(m.player2_id) !== -1;
        });

        // Recalculate stats among tied players only
        var subStats = {};
        tiedIds.forEach(function(pid) {
            subStats[pid] = { wins: 0, setsWon: 0, setsLost: 0, gamesWon: 0, gamesLost: 0 };
        });

        subMatches.forEach(function(m) {
            if (subStats[m.winner_id]) subStats[m.winner_id].wins++;

            [m.player1_id, m.player2_id].forEach(function(pid) {
                if (!subStats[pid]) return;
                var sg = parseScoreSetsGames(m.score, pid, m);
                subStats[pid].setsWon += sg.setsWon;
                subStats[pid].setsLost += sg.setsLost;
                subStats[pid].gamesWon += sg.gamesWon;
                subStats[pid].gamesLost += sg.gamesLost;
            });
        });

        // Sort: sub-wins → set% → game%
        cluster.sort(function(a, b) {
            var sa = subStats[a.playerId], sb = subStats[b.playerId];
            if (sb.wins !== sa.wins) return sb.wins - sa.wins;

            var aSetPct = sa.setsWon + sa.setsLost > 0 ? sa.setsWon / (sa.setsWon + sa.setsLost) : 0;
            var bSetPct = sb.setsWon + sb.setsLost > 0 ? sb.setsWon / (sb.setsWon + sb.setsLost) : 0;
            if (bSetPct !== aSetPct) return bSetPct - aSetPct;

            var aGamePct = sa.gamesWon + sa.gamesLost > 0 ? sa.gamesWon / (sa.gamesWon + sa.gamesLost) : 0;
            var bGamePct = sb.gamesWon + sb.gamesLost > 0 ? sb.gamesWon / (sb.gamesWon + sb.gamesLost) : 0;
            return bGamePct - aGamePct;
        });

        for (var k = 0; k < cluster.length; k++) {
            cluster[k].place = startPlace + k;
        }
    }

    // ---- Bracket Panel HTML ----
    function renderBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var html = '';

        // Parse score into per-set arrays for each player
        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [] };
            var sets = score.split(' ');
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets };
        }

        // Visual bracket with connectors
        html += '<div class="ad-brk-scroll">' +
                '<div class="ad-brk-grid">';

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = matches.filter(function(m) { return m.round_number === r && m.round !== '3RD'; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            var roundName = getRoundName(r, totalRounds, drawSize);

            // Round column
            html += '<div class="ad-brk-round">';
            html += '<div class="ad-brk-title">' + roundName + '</div>';
            html += '<div class="ad-brk-matches">';

            roundMatches.forEach(function(match) {
                var p1 = playersMap[match.player1_id];
                var p2 = playersMap[match.player2_id];
                var p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE');
                var p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE');

                var isCompleted = match.status === 'completed';
                var isBye = match.score === 'BYE';
                var p1Winner = isCompleted && match.winner_id === match.player1_id;
                var p2Winner = isCompleted && match.winner_id === match.player2_id;
                var canEdit = match.player1_id && match.player2_id && !isBye;

                var matchClass = 'ad-brk-match';
                if (isCompleted) matchClass += ' completed';
                if (match.status === 'live') matchClass += ' live';

                var setData = parseSets(match.score);

                html += '<div class="' + matchClass + '">';

                // Schedule info
                if (match.scheduled_time) {
                    var schedInfo = match.scheduled_time.slice(0, 5);
                    if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
                    html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
                }

                // Player 1 row
                var p1Class = 'ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : ''));
                html += '<div class="' + p1Class + '">' +
                    (match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p1Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';

                // Player 2 row
                var p2Class = 'ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : ''));
                html += '<div class="' + p2Class + '">' +
                    (match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
                    '<span class="ad-brk-name">' + p2Name + '</span>' +
                    '<span class="ad-brk-sets">';
                setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
                html += '</span></div>';

                // Edit score button
                if (canEdit) {
                    html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                        (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
                }

                html += '</div>'; // /ad-brk-match
            });

            html += '</div>'; // /ad-brk-matches
            html += '</div>'; // /ad-brk-round

            // Connector column between rounds (not after last round)
            if (r < totalRounds) {
                var pairCount = Math.floor(roundMatches.length / 2);
                html += '<div class="ad-brk-connector">';
                html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                html += '<div class="ad-brk-connector-inner">';
                for (var i = 0; i < pairCount; i++) {
                    html += '<div class="ad-brk-conn-pair">' +
                        '<div class="ad-brk-conn-top"></div>' +
                        '<div class="ad-brk-conn-mid"></div>' +
                        '<div class="ad-brk-conn-bottom"></div>' +
                    '</div>';
                }
                html += '</div></div>';
            }
        }

        html += '</div>'; // /ad-brk-grid
        html += '</div>'; // /ad-brk-scroll

        // 3rd place — separate block under bracket
        var thirdMatch = matches.find(function(m) { return m.round === '3RD'; });
        if (thirdMatch) {
            var tp1 = playersMap[thirdMatch.player1_id];
            var tp2 = playersMap[thirdMatch.player2_id];
            var tp1Name = tp1 ? A.esc(isEn ? (tp1.name_en || tp1.name) : tp1.name) : (thirdMatch.player1_id ? 'TBD' : '—');
            var tp2Name = tp2 ? A.esc(isEn ? (tp2.name_en || tp2.name) : tp2.name) : (thirdMatch.player2_id ? 'TBD' : '—');
            var tCompleted = thirdMatch.status === 'completed';
            var tBye = thirdMatch.score === 'BYE';
            var tp1Win = tCompleted && thirdMatch.winner_id === thirdMatch.player1_id;
            var tp2Win = tCompleted && thirdMatch.winner_id === thirdMatch.player2_id;
            var tCanEdit = thirdMatch.player1_id && thirdMatch.player2_id && !tBye;
            var tSetData = parseSets(thirdMatch.score);
            var tMatchClass = 'ad-brk-match' + (tCompleted ? ' completed' : '') + (thirdMatch.status === 'live' ? ' live' : '');

            html += '<div style="margin-top:20px;max-width:220px;">';
            html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + L.round3rd + '</div>';
            html += '<div class="' + tMatchClass + '">';
            if (thirdMatch.scheduled_time) {
                html += '<div class="ad-brk-schedule">' + thirdMatch.scheduled_time.slice(0, 5) +
                    (thirdMatch.court ? ' · ' + (isEn ? 'Court ' : 'Корт ') + thirdMatch.court : '') + '</div>';
            }
            html += '<div class="ad-brk-player' + (tp1Win ? ' winner' : (tp2Win ? ' loser' : '')) + '">' +
                (thirdMatch.seed1 ? '<span class="ad-brk-seed">[' + thirdMatch.seed1 + ']</span>' : '') +
                '<span class="ad-brk-name">' + tp1Name + '</span><span class="ad-brk-sets">';
            tSetData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            html += '<div class="ad-brk-player' + (tp2Win ? ' winner' : (tp1Win ? ' loser' : '')) + '">' +
                (thirdMatch.seed2 ? '<span class="ad-brk-seed">[' + thirdMatch.seed2 + ']</span>' : '') +
                '<span class="ad-brk-name">' + tp2Name + '</span><span class="ad-brk-sets">';
            tSetData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
            html += '</span></div>';
            if (tCanEdit) {
                html += '<button class="ad-brk-edit" data-match-edit="' + thirdMatch.id + '">' +
                    (tCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
            }
            html += '</div></div>';
        }

        // Action buttons
        html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
        if (!anyCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
        }
        if (allCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        if (isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<span style="color:var(--accent);font-weight:600;">' + (isEn ? 'Tournament completed.' : 'Турнир завершён.') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" id="adBrkRecalc">' + (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- FIC Sections Definition ----
    function getFicSections(drawSize, lang) {
        var isEn = lang === 'en';
        var k = Math.log2(drawSize);
        var half = drawSize / 2;
        var quarter = drawSize / 4;

        if (drawSize === 8) {
            // k=3, 2 sections
            return [
                {
                    label: isEn ? 'Main Draw (1-2)' : 'Основная сетка (1-2 место)',
                    rounds: [
                        { roundNum: 1, matchStart: 1, matchEnd: 4, name: isEn ? 'Round 1' : 'Раунд 1' },
                        { roundNum: 2, matchStart: 1, matchEnd: 2, name: isEn ? 'Semifinal' : 'Полуфинал' },
                        { roundNum: 3, matchStart: 1, matchEnd: 1, name: isEn ? 'Final' : 'Финал' }
                    ],
                    placeMatch: { roundNum: 3, matchOrder: 3, label: isEn ? '3rd-4th Place' : 'За 3-4 место' }
                },
                {
                    label: isEn ? '5-8 Place' : '5-8 место',
                    rounds: [
                        { roundNum: 2, matchStart: 3, matchEnd: 4, name: isEn ? 'Semifinal 5-8' : 'Полуфинал 5-8' },
                        { roundNum: 3, matchStart: 2, matchEnd: 2, name: isEn ? 'Final 5-6' : 'Финал 5-6' }
                    ],
                    placeMatch: { roundNum: 3, matchOrder: 4, label: isEn ? '7th-8th Place' : 'За 7-8 место' }
                }
            ];
        }

        if (drawSize === 16) {
            // k=4, 4 sections
            return [
                {
                    label: isEn ? 'Main Draw (1-2)' : 'Основная сетка (1-2 место)',
                    rounds: [
                        { roundNum: 1, matchStart: 1, matchEnd: 8, name: isEn ? 'Round 1' : 'Раунд 1' },
                        { roundNum: 2, matchStart: 1, matchEnd: 4, name: isEn ? 'Quarterfinal' : 'Четвертьфинал' },
                        { roundNum: 3, matchStart: 1, matchEnd: 2, name: isEn ? 'Semifinal' : 'Полуфинал' },
                        { roundNum: 4, matchStart: 1, matchEnd: 1, name: isEn ? 'Final' : 'Финал' }
                    ],
                    placeMatch: { roundNum: 4, matchOrder: 5, label: isEn ? '3rd-4th Place' : 'За 3-4 место' }
                },
                {
                    label: isEn ? '5-8 Place' : '5-8 место',
                    rounds: [
                        { roundNum: 3, matchStart: 5, matchEnd: 6, name: isEn ? 'Semifinal 5-8' : 'Полуфинал 5-8' },
                        { roundNum: 4, matchStart: 3, matchEnd: 3, name: isEn ? 'Final 5-6' : 'Финал 5-6' }
                    ],
                    placeMatch: { roundNum: 4, matchOrder: 7, label: isEn ? '7th-8th Place' : 'За 7-8 место' }
                },
                {
                    label: isEn ? '9-12 Place' : '9-12 место',
                    rounds: [
                        { roundNum: 2, matchStart: 5, matchEnd: 8, name: isEn ? 'Round 2 (9-16)' : 'Раунд 2 (9-16)' },
                        { roundNum: 3, matchStart: 3, matchEnd: 4, name: isEn ? 'Semifinal 9-12' : 'Полуфинал 9-12' },
                        { roundNum: 4, matchStart: 2, matchEnd: 2, name: isEn ? 'Final 9-10' : 'Финал 9-10' }
                    ],
                    placeMatch: { roundNum: 4, matchOrder: 6, label: isEn ? '11th-12th Place' : 'За 11-12 место' }
                },
                {
                    label: isEn ? '13-16 Place' : '13-16 место',
                    rounds: [
                        { roundNum: 3, matchStart: 7, matchEnd: 8, name: isEn ? 'Semifinal 13-16' : 'Полуфинал 13-16' },
                        { roundNum: 4, matchStart: 4, matchEnd: 4, name: isEn ? 'Final 13-14' : 'Финал 13-14' }
                    ],
                    placeMatch: { roundNum: 4, matchOrder: 8, label: isEn ? '15th-16th Place' : 'За 15-16 место' }
                }
            ];
        }

        if (drawSize === 32) {
            // k=5, 8 sections
            return [
                {
                    label: isEn ? 'Main Draw (1-2)' : 'Основная сетка (1-2 место)',
                    rounds: [
                        { roundNum: 1, matchStart: 1, matchEnd: 16, name: isEn ? 'Round 1' : 'Раунд 1' },
                        { roundNum: 2, matchStart: 1, matchEnd: 8, name: isEn ? 'Round 2' : 'Раунд 2' },
                        { roundNum: 3, matchStart: 1, matchEnd: 4, name: isEn ? 'Quarterfinal' : 'Четвертьфинал' },
                        { roundNum: 4, matchStart: 1, matchEnd: 2, name: isEn ? 'Semifinal' : 'Полуфинал' },
                        { roundNum: 5, matchStart: 1, matchEnd: 1, name: isEn ? 'Final' : 'Финал' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 9, label: isEn ? '3rd-4th Place' : 'За 3-4 место' }
                },
                {
                    label: isEn ? '5-8 Place' : '5-8 место',
                    rounds: [
                        { roundNum: 4, matchStart: 5, matchEnd: 6, name: isEn ? 'Semifinal 5-8' : 'Полуфинал 5-8' },
                        { roundNum: 5, matchStart: 3, matchEnd: 3, name: isEn ? 'Final 5-6' : 'Финал 5-6' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 11, label: isEn ? '7th-8th Place' : 'За 7-8 место' }
                },
                {
                    label: isEn ? '9-12 Place' : '9-12 место',
                    rounds: [
                        { roundNum: 3, matchStart: 5, matchEnd: 8, name: isEn ? 'QF 9-16' : 'ЧФ 9-16' },
                        { roundNum: 4, matchStart: 3, matchEnd: 4, name: isEn ? 'Semifinal 9-12' : 'Полуфинал 9-12' },
                        { roundNum: 5, matchStart: 2, matchEnd: 2, name: isEn ? 'Final 9-10' : 'Финал 9-10' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 10, label: isEn ? '11th-12th Place' : 'За 11-12 место' }
                },
                {
                    label: isEn ? '13-16 Place' : '13-16 место',
                    rounds: [
                        { roundNum: 4, matchStart: 7, matchEnd: 8, name: isEn ? 'Semifinal 13-16' : 'Полуфинал 13-16' },
                        { roundNum: 5, matchStart: 4, matchEnd: 4, name: isEn ? 'Final 13-14' : 'Финал 13-14' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 12, label: isEn ? '15th-16th Place' : 'За 15-16 место' }
                },
                {
                    label: isEn ? '17-20 Place' : '17-20 место',
                    rounds: [
                        { roundNum: 2, matchStart: 9, matchEnd: 16, name: isEn ? 'Round 2 (17-32)' : 'Раунд 2 (17-32)' },
                        { roundNum: 3, matchStart: 9, matchEnd: 12, name: isEn ? 'QF 17-24' : 'ЧФ 17-24' },
                        { roundNum: 4, matchStart: 9, matchEnd: 10, name: isEn ? 'Semifinal 17-20' : 'Полуфинал 17-20' },
                        { roundNum: 5, matchStart: 5, matchEnd: 5, name: isEn ? 'Final 17-18' : 'Финал 17-18' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 13, label: isEn ? '19th-20th Place' : 'За 19-20 место' }
                },
                {
                    label: isEn ? '21-24 Place' : '21-24 место',
                    rounds: [
                        { roundNum: 4, matchStart: 13, matchEnd: 14, name: isEn ? 'Semifinal 21-24' : 'Полуфинал 21-24' },
                        { roundNum: 5, matchStart: 7, matchEnd: 7, name: isEn ? 'Final 21-22' : 'Финал 21-22' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 15, label: isEn ? '23rd-24th Place' : 'За 23-24 место' }
                },
                {
                    label: isEn ? '25-28 Place' : '25-28 место',
                    rounds: [
                        { roundNum: 3, matchStart: 13, matchEnd: 16, name: isEn ? 'QF 25-32' : 'ЧФ 25-32' },
                        { roundNum: 4, matchStart: 11, matchEnd: 12, name: isEn ? 'Semifinal 25-28' : 'Полуфинал 25-28' },
                        { roundNum: 5, matchStart: 6, matchEnd: 6, name: isEn ? 'Final 25-26' : 'Финал 25-26' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 14, label: isEn ? '27th-28th Place' : 'За 27-28 место' }
                },
                {
                    label: isEn ? '29-32 Place' : '29-32 место',
                    rounds: [
                        { roundNum: 4, matchStart: 15, matchEnd: 16, name: isEn ? 'Semifinal 29-32' : 'Полуфинал 29-32' },
                        { roundNum: 5, matchStart: 8, matchEnd: 8, name: isEn ? 'Final 29-30' : 'Финал 29-30' }
                    ],
                    placeMatch: { roundNum: 5, matchOrder: 16, label: isEn ? '31st-32nd Place' : 'За 31-32 место' }
                }
            ];
        }

        return [];
    }

    // ---- FIC Match Card Renderer ----
    function renderFicMatchCard(match, playersMap, parseSets) {
        var p1 = playersMap[match.player1_id];
        var p2 = playersMap[match.player2_id];
        var p1Name = p1 ? A.esc(isEn ? (p1.name_en || p1.name) : p1.name) : (match.player1_id ? 'TBD' : 'BYE');
        var p2Name = p2 ? A.esc(isEn ? (p2.name_en || p2.name) : p2.name) : (match.player2_id ? 'TBD' : 'BYE');

        var isCompleted = match.status === 'completed';
        var isBye = match.score === 'BYE';
        var p1Winner = isCompleted && match.winner_id === match.player1_id;
        var p2Winner = isCompleted && match.winner_id === match.player2_id;
        var canEdit = match.player1_id && match.player2_id && !isBye;

        var matchClass = 'ad-brk-match';
        if (isCompleted) matchClass += ' completed';
        if (match.status === 'live') matchClass += ' live';

        var setData = parseSets(match.score);
        var html = '<div class="' + matchClass + '">';

        if (match.scheduled_time) {
            var schedInfo = match.scheduled_time.slice(0, 5);
            if (match.court) schedInfo += ' · ' + (isEn ? 'Court ' : 'Корт ') + match.court;
            html += '<div class="ad-brk-schedule">' + schedInfo + '</div>';
        }

        var p1Class = 'ad-brk-player' + (p1Winner ? ' winner' : (p2Winner ? ' loser' : ''));
        html += '<div class="' + p1Class + '">' +
            (match.seed1 ? '<span class="ad-brk-seed">[' + match.seed1 + ']</span>' : '') +
            '<span class="ad-brk-name">' + p1Name + '</span>' +
            '<span class="ad-brk-sets">';
        setData.p1.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
        html += '</span></div>';

        var p2Class = 'ad-brk-player' + (p2Winner ? ' winner' : (p1Winner ? ' loser' : ''));
        html += '<div class="' + p2Class + '">' +
            (match.seed2 ? '<span class="ad-brk-seed">[' + match.seed2 + ']</span>' : '') +
            '<span class="ad-brk-name">' + p2Name + '</span>' +
            '<span class="ad-brk-sets">';
        setData.p2.forEach(function(s) { html += '<span class="ad-brk-set">' + s + '</span>'; });
        html += '</span></div>';

        if (canEdit) {
            html += '<button class="ad-brk-edit" data-match-edit="' + match.id + '">' +
                (isCompleted ? (isEn ? 'Edit' : 'Изм.') : (isEn ? 'Score' : 'Счёт')) + '</button>';
        }

        html += '</div>';
        return html;
    }

    // ---- FIC Bracket Panel ----
    function renderFicBracketPanel(tournament, matches, playersMap, allCompleted, isTournamentCompleted, anyCompleted) {
        var drawSize = tournament.draw_size || 16;
        var sections = getFicSections(drawSize, isEn ? 'en' : 'ru');
        var html = '';

        function parseSets(score) {
            if (!score || score === 'BYE') return { p1: [], p2: [] };
            var sets = score.split(' ');
            var p1Sets = [], p2Sets = [];
            sets.forEach(function(s) {
                var m = s.match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (m) {
                    p1Sets.push(m[1] + (m[3] ? '<sup>' + m[3] + '</sup>' : ''));
                    p2Sets.push(m[2] + (m[4] ? '<sup>' + m[4] + '</sup>' : ''));
                }
            });
            return { p1: p1Sets, p2: p2Sets };
        }

        sections.forEach(function(section) {
            html += '<div class="ad-fic-section">';
            html += '<div class="ad-fic-section-title">' + section.label + '</div>';

            // Mini SE bracket for this section
            html += '<div class="ad-brk-scroll"><div class="ad-brk-grid">';

            section.rounds.forEach(function(rd, ri) {
                var roundMatches = matches.filter(function(m) {
                    return m.round_number === rd.roundNum &&
                           m.match_order >= rd.matchStart &&
                           m.match_order <= rd.matchEnd;
                }).sort(function(a, b) { return a.match_order - b.match_order; });

                html += '<div class="ad-brk-round">';
                html += '<div class="ad-brk-title">' + rd.name + '</div>';
                html += '<div class="ad-brk-matches">';

                roundMatches.forEach(function(match) {
                    html += renderFicMatchCard(match, playersMap, parseSets);
                });

                html += '</div></div>';

                // Connector column between rounds (not after last)
                if (ri < section.rounds.length - 1) {
                    var pairCount = Math.floor(roundMatches.length / 2);
                    if (pairCount > 0) {
                        html += '<div class="ad-brk-connector">';
                        html += '<div class="ad-brk-title" style="visibility:hidden;">&nbsp;</div>';
                        html += '<div class="ad-brk-connector-inner">';
                        for (var i = 0; i < pairCount; i++) {
                            html += '<div class="ad-brk-conn-pair">' +
                                '<div class="ad-brk-conn-top"></div>' +
                                '<div class="ad-brk-conn-mid"></div>' +
                                '<div class="ad-brk-conn-bottom"></div>' +
                            '</div>';
                        }
                        html += '</div></div>';
                    }
                }
            });

            html += '</div></div>'; // /ad-brk-grid /ad-brk-scroll

            // Place match (separate block under section bracket)
            if (section.placeMatch) {
                var pm = matches.find(function(m) {
                    return m.round_number === section.placeMatch.roundNum &&
                           m.match_order === section.placeMatch.matchOrder;
                });
                if (pm) {
                    html += '<div style="margin-top:12px;max-width:220px;">';
                    html += '<div class="ad-brk-title" style="font-size:0.8rem;margin-bottom:8px;">' + section.placeMatch.label + '</div>';
                    html += renderFicMatchCard(pm, playersMap, parseSets);
                    html += '</div>';
                }
            }

            html += '</div>'; // /ad-fic-section
        });

        // Action buttons
        html += '<div style="display:flex;justify-content:center;gap:8px;margin-top:16px;">';
        if (!anyCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-secondary" id="adBrkRegenerate">' + L.regenerateDraw + '</button>';
        }
        if (allCompleted && !isTournamentCompleted) {
            html += '<button class="ad-btn ad-btn-primary" id="adBrkFinalize">' + L.finalizeTournament + '</button>';
        }
        html += '</div>';

        if (isTournamentCompleted) {
            html += '<div style="text-align:center;margin-top:16px;">' +
                '<span style="color:var(--accent);font-weight:600;">' + (isEn ? 'Tournament completed.' : 'Турнир завершён.') + '</span>' +
                '&nbsp;&nbsp;<button class="ad-btn ad-btn-sm ad-btn-secondary" id="adBrkRecalc">' + (isEn ? 'Recalculate Points' : 'Пересчитать очки') + '</button>' +
            '</div>';
        }

        return html;
    }

    // ---- Results Panel (points summary) ----
    function renderResultsPanel(tournament, results, playersMap, matches) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);

        // Round labels for display
        var roundLabels = isEn
            ? { W: 'Winner', F: 'Finalist', '3RD': '3rd Place', '4TH': '4th Place', SF: 'Semifinal', QF: 'Quarterfinal', R16: 'Round of 16', R32: 'Round of 32',
                G1: '1st in Group', G2: '2nd in Group', G3: '3rd in Group', G4: '4th in Group', G5: '5th in Group', G6: '6th in Group' }
            : { W: 'Победитель', F: 'Финалист', '3RD': '3-е место', '4TH': '4-е место', SF: 'Полуфинал', QF: 'Четвертьфинал', R16: '1/8 финала', R32: '1/32 финала',
                G1: '1-е в группе', G2: '2-е в группе', G3: '3-е в группе', G4: '4-е в группе', G5: '5-е в группе', G6: '6-е в группе' };

        // Sort results: by points DESC, then by round order
        var roundOrder = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 5, QF: 6, R16: 7, R32: 8,
            G3: 9, G4: 10, G5: 11, G6: 12 };
        results.sort(function(a, b) {
            var ptsA = a.points_earned || 0;
            var ptsB = b.points_earned || 0;
            if (ptsA !== ptsB) return ptsB - ptsA;
            var orderA = roundOrder[a.round_reached] || 99;
            var orderB = roundOrder[b.round_reached] || 99;
            return orderA - orderB;
        });

        var totalPoints = 0;
        results.forEach(function(r) { totalPoints += r.points_earned || 0; });

        var html = '';

        // Summary header
        html += '<div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px;">' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + L.resTotalPlayers + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + results.length + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Total Points Distributed' : 'Всего очков распределено') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--accent);">' + totalPoints + '</div>' +
            '</div>' +
            '<div style="background:var(--card-bg);border:1px solid var(--border);border-radius:8px;padding:12px 16px;flex:1;min-width:140px;">' +
                '<div style="font-size:0.75rem;color:var(--text-secondary);">' + (isEn ? 'Tournament Level' : 'Уровень турнира') + '</div>' +
                '<div style="font-size:1.4rem;font-weight:700;color:var(--text-primary);">' + (function() {
                    if (!tournament.level_id) return '—';
                    var lv = A.cachedLevels.find(function(l) { return l.id === tournament.level_id; });
                    return lv ? A.esc(isEn ? (lv.name_en || lv.name) : lv.name) : '—';
                })() + '</div>' +
            '</div>' +
        '</div>';

        // Results table
        html += '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table">' +
            '<thead><tr>' +
                '<th style="width:50px;">' + L.resPlace + '</th>' +
                '<th>' + L.resPlayer + '</th>' +
                '<th>' + L.resRound + '</th>' +
                '<th style="text-align:right;">' + L.resPoints + '</th>' +
            '</tr></thead><tbody>';

        // Place mapping: W=1, F=2, 3RD=3, 4TH=4, SF=3(fallback), QF=5, R16=9, R32=17
        var placeByRound = { W: 1, F: 2, '3RD': 3, '4TH': 4, SF: 4, QF: 5, R16: 9, R32: 17 };

        results.forEach(function(r, idx) {
            var place = placeByRound[r.round_reached] || (idx + 1);

            var p = playersMap[r.player_id] || {};
            var pName = isEn ? (p.name_en || p.name || r.player_id) : (p.name || r.player_id);
            var roundLabel = roundLabels[r.round_reached] || r.round_reached;
            var isWinner = r.round_reached === 'W';
            var isFinalist = r.round_reached === 'F';

            var medal = '';
            if (place === 1) medal = '<span style="margin-right:4px;">🥇</span>';
            else if (place === 2) medal = '<span style="margin-right:4px;">🥈</span>';
            else if (place === 3) medal = '<span style="margin-right:4px;">🥉</span>';

            html += '<tr style="' + (isWinner ? 'background:rgba(204,255,0,0.08);' : '') + '">' +
                '<td style="font-weight:600;text-align:center;">' + medal + place + '</td>' +
                '<td style="' + (isWinner ? 'font-weight:700;color:var(--accent);' : (isFinalist ? 'font-weight:600;' : '')) + '">' + A.esc(pName) + '</td>' +
                '<td>' + roundLabel + '</td>' +
                '<td style="text-align:right;font-weight:700;color:var(--accent);font-size:1.1rem;">' + (r.points_earned || 0) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div></div>';

        return html;
    }

    // ---- Remove Registrations + Auto-Promote from Waitlist ----
    async function removeRegistrations(regIds, tournamentId) {
        // Set selected to withdrawn
        var res = await A.client.from('tournament_registrations').update({ status: 'withdrawn' }).in('id', regIds);
        if (res.error) { A.showToast(res.error.message, 'error'); return; }

        // Auto-promote: load tournament max_participants, then check if main draw has room
        var trnRes = await A.client.from('tournaments').select('max_participants').eq('id', tournamentId).single();
        var maxPart = (trnRes.data && trnRes.data.max_participants) || 16;

        // Count current approved
        var appRes = await A.client.from('tournament_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', tournamentId)
            .eq('status', 'approved');
        var approvedCount = appRes.count || 0;

        // If there's room, promote from pending (waitlist) ordered by registered_at
        var slotsAvailable = maxPart - approvedCount;
        if (slotsAvailable > 0) {
            var pendRes = await A.client.from('tournament_registrations')
                .select('id')
                .eq('tournament_id', tournamentId)
                .eq('status', 'pending')
                .order('registered_at', { ascending: true })
                .limit(slotsAvailable);
            var toPromote = (pendRes.data || []).map(function(r) { return r.id; });
            if (toPromote.length > 0) {
                await A.client.from('tournament_registrations').update({ status: 'approved' }).in('id', toPromote);
            }
        }
        A.showToast(isEn ? 'Participants removed' : 'Участники удалены', 'success');
    }

    // ---- Regenerate Draw ----
    async function regenerateDraw(tournament, tournamentId) {
        try {
            // 1. Delete all matches
            var delRes = await A.client.from('matches').delete().eq('tournament_id', tournamentId);
            if (delRes.error) { A.showToast(delRes.error.message, 'error'); return; }

            // 2. Reset registrations: draw → approved, clear group_number & seed_number
            await A.client.from('tournament_registrations').update({
                status: 'approved',
                group_number: null,
                seed_number: null,
                draw_position: null
            }).eq('tournament_id', tournamentId).eq('status', 'draw');

            // 3. Reset tournament status
            await A.client.from('tournaments').update({ status: 'registration_open' }).eq('id', tournamentId);

            // 4. Re-fetch tournament and registrations, then generate
            var tRes = await A.client.from('tournaments').select('*').eq('id', tournamentId).single();
            var freshTournament = tRes.data || tournament;

            var regRes = await A.client.from('tournament_registrations')
                .select('*, players(id, name, name_en, points, category_id)')
                .eq('tournament_id', tournamentId)
                .order('registered_at', { ascending: true });
            var registrations = regRes.data || [];

            var playerIds = [];
            registrations.forEach(function(r) { if (r.player_id) playerIds.push(r.player_id); });
            playerIds = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });
            var playersMap = {};
            if (playerIds.length > 0) {
                var plRes = await A.client.from('players').select('id, name, name_en, points').in('id', playerIds);
                (plRes.data || []).forEach(function(p) { playersMap[p.id] = p; });
            }

            await generateBracketDraw(freshTournament, registrations, playersMap);
            renderBracketManagement(tournamentId);
        } catch (err) {
            console.error('Regenerate draw error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Generate Bracket Draw ----
    async function generateBracketDraw(tournament, registrations, playersMap) {
        var drawSize = tournament.draw_size || 16;
        var bracketType = tournament.bracket_type || 'single_elimination';
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;

        // Get approved registrations
        var approved = registrations.filter(function(r) { return r.status === 'approved'; });
        if (approved.length < 2) {
            A.showToast(isEn ? 'Need at least 2 approved players' : 'Нужно минимум 2 одобренных игрока', 'error');
            return;
        }

        // Sort by points DESC (seeded first)
        approved.sort(function(a, b) {
            var pA = (a.players ? a.players.points : 0) || 0;
            var pB = (b.players ? b.players.points : 0) || 0;
            return pB - pA;
        });

        // Dispatch to group draw for round_robin
        if (bracketType === 'round_robin') {
            await generateGroupDraw(tournament, approved, playersMap);
            return;
        }

        // Dispatch to FIC draw
        if (bracketType === 'fic') {
            await generateFicDraw(tournament, approved, playersMap);
            return;
        }

        // Determine seed count
        var seedCount = 0;
        if (bracketType === 'single_elimination') {
            seedCount = drawSize >= 32 ? 8 : (drawSize >= 16 ? 4 : 2);
            seedCount = Math.min(seedCount, approved.length);
        }

        // Seed positions from SEED_POSITIONS (global from tournament-generator.js)
        var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
            ? SEED_POSITIONS[drawSize]
            : (drawSize === 8 ? [1, 8, 5, 4] : [1, 16, 9, 8]);

        // Build draw array
        var draw = new Array(drawSize);
        for (var i = 0; i < drawSize; i++) draw[i] = null;

        // Place seeded players
        for (var s = 0; s < seedCount && s < seedPositions.length; s++) {
            draw[seedPositions[s] - 1] = {
                player_id: approved[s].player_id,
                seed: s + 1,
                reg_id: approved[s].id
            };
        }

        // Fisher-Yates shuffle for unseeded
        var unseeded = approved.slice(seedCount);
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Fill empty slots
        var emptySlots = [];
        for (var i = 0; i < drawSize; i++) {
            if (draw[i] === null) emptySlots.push(i);
        }
        for (var i = 0; i < unseeded.length && i < emptySlots.length; i++) {
            draw[emptySlots[i]] = {
                player_id: unseeded[i].player_id,
                seed: null,
                reg_id: unseeded[i].id
            };
        }

        // Generate matches
        var totalRounds = Math.log2(drawSize);
        var matchesToInsert = [];

        // First round
        var matchOrder = 0;
        for (var i = 0; i < drawSize; i += 2) {
            matchOrder++;
            var slot1 = draw[i];
            var slot2 = draw[i + 1];

            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: 'R1',
                round_number: 1,
                match_order: matchOrder,
                status: 'upcoming',
                seed1: slot1 ? slot1.seed : null,
                seed2: slot2 ? slot2.seed : null
            });
        }

        // Subsequent rounds (empty)
        for (var r = 2; r <= totalRounds; r++) {
            var matchesInRound = drawSize / Math.pow(2, r);
            for (var m = 1; m <= matchesInRound; m++) {
                var roundPrefix = r === totalRounds ? 'F' :
                                  r === totalRounds - 1 ? 'SF' :
                                  r === totalRounds - 2 ? 'QF' : 'R' + r;
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null,
                    player2_id: null,
                    round: roundPrefix,
                    round_number: r,
                    match_order: m,
                    status: 'upcoming',
                    seed1: null,
                    seed2: null
                });
            }
        }

        // 3rd place match (between SF losers)
        matchesToInsert.push({
            tournament_id: tournament.id,
            player1_id: null,
            player2_id: null,
            round: '3RD',
            round_number: totalRounds,
            match_order: 0,
            status: 'upcoming',
            seed1: null,
            seed2: null
        });

        // Handle BYEs in first round: if one player is null, auto-advance
        for (var i = 0; i < matchesToInsert.length; i++) {
            var match = matchesToInsert[i];
            if (match.round_number !== 1) continue;

            if (match.player1_id && !match.player2_id) {
                match.winner_id = match.player1_id;
                match.status = 'completed';
                match.score = 'BYE';
            } else if (!match.player1_id && match.player2_id) {
                match.winner_id = match.player2_id;
                match.status = 'completed';
                match.score = 'BYE';
            }
        }

        // Insert matches into DB
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Auto-advance BYE winners to round 2
        var r1Matches = matchesToInsert.filter(function(m) { return m.round_number === 1; });
        var r2Matches = matchesToInsert.filter(function(m) { return m.round_number === 2; });

        // We need the actual inserted match IDs to update round 2
        // Re-fetch matches from DB
        var freshRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var freshMatches = freshRes.data || [];

        // Advance BYE winners
        var r1Fresh = freshMatches.filter(function(m) { return m.round_number === 1; });
        var r2Fresh = freshMatches.filter(function(m) { return m.round_number === 2; });

        for (var i = 0; i < r1Fresh.length; i++) {
            var m = r1Fresh[i];
            if (m.winner_id && m.score === 'BYE') {
                // Match i in R1 → goes to match ceil((i+1)/2) in R2, slot depends on odd/even
                var nextMatchIdx = Math.floor(i / 2);
                if (nextMatchIdx < r2Fresh.length) {
                    var nextMatch = r2Fresh[nextMatchIdx];
                    var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                    var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                    var updateData = {};
                    updateData[updateField] = m.winner_id;
                    updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                    await A.client.from('matches').update(updateData).eq('id', nextMatch.id);
                }
            }
        }

        // Update tournament_registrations with seed_number and draw_position
        for (var i = 0; i < drawSize; i++) {
            if (draw[i]) {
                await A.client.from('tournament_registrations').update({
                    seed_number: draw[i].seed,
                    draw_position: i + 1
                }).eq('id', draw[i].reg_id);
            }
        }

        // Auto-assign schedule (court + time) for generated matches
        await assignSchedule(tournament);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- Generate FIC (Full Individual Consolation) Draw ----
    async function generateFicDraw(tournament, approved, playersMap) {
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var halfDraw = drawSize / 2;

        // Determine seed count (same logic as SE)
        var seedCount = drawSize >= 32 ? 8 : (drawSize >= 16 ? 4 : 2);
        seedCount = Math.min(seedCount, approved.length);

        var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
            ? SEED_POSITIONS[drawSize]
            : (drawSize === 8 ? [1, 8, 5, 4] : [1, 16, 9, 8]);

        // Build draw array
        var draw = new Array(drawSize);
        for (var i = 0; i < drawSize; i++) draw[i] = null;

        // Place seeded players
        for (var s = 0; s < seedCount && s < seedPositions.length; s++) {
            draw[seedPositions[s] - 1] = {
                player_id: approved[s].player_id,
                seed: s + 1,
                reg_id: approved[s].id
            };
        }

        // Fisher-Yates shuffle for unseeded
        var unseeded = approved.slice(seedCount);
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Fill empty slots
        var emptySlots = [];
        for (var i = 0; i < drawSize; i++) {
            if (draw[i] === null) emptySlots.push(i);
        }
        for (var i = 0; i < unseeded.length && i < emptySlots.length; i++) {
            draw[emptySlots[i]] = {
                player_id: unseeded[i].player_id,
                seed: null,
                reg_id: unseeded[i].id
            };
        }

        // Generate ALL matches for all rounds
        // FIC: every round has N/2 matches (everyone plays every round)
        var matchesToInsert = [];

        // Round 1: from draw positions
        for (var i = 0; i < drawSize; i += 2) {
            var slot1 = draw[i];
            var slot2 = draw[i + 1];
            var matchOrder = (i / 2) + 1;

            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: slot1 ? slot1.player_id : null,
                player2_id: slot2 ? slot2.player_id : null,
                round: 'FIC-R1',
                round_number: 1,
                match_order: matchOrder,
                status: 'upcoming',
                seed1: slot1 ? slot1.seed : null,
                seed2: slot2 ? slot2.seed : null
            });
        }

        // Rounds 2..totalRounds: N/2 empty matches each
        for (var r = 2; r <= totalRounds; r++) {
            for (var m = 1; m <= halfDraw; m++) {
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: null,
                    player2_id: null,
                    round: 'FIC-R' + r,
                    round_number: r,
                    match_order: m,
                    status: 'upcoming',
                    seed1: null,
                    seed2: null
                });
            }
        }

        // Handle BYEs in first round
        for (var i = 0; i < matchesToInsert.length; i++) {
            var match = matchesToInsert[i];
            if (match.round_number !== 1) continue;

            if (match.player1_id && !match.player2_id) {
                match.winner_id = match.player1_id;
                match.status = 'completed';
                match.score = 'BYE';
            } else if (!match.player1_id && match.player2_id) {
                match.winner_id = match.player2_id;
                match.status = 'completed';
                match.score = 'BYE';
            }
        }

        // Insert matches into DB
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Re-fetch matches from DB to get IDs
        var freshRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var freshMatches = freshRes.data || [];

        // Advance BYE winners (winner only, no loser for BYE)
        var r1Fresh = freshMatches.filter(function(m) { return m.round_number === 1; });
        for (var i = 0; i < r1Fresh.length; i++) {
            var m = r1Fresh[i];
            if (m.winner_id && m.score === 'BYE') {
                await advanceFicPlayer(m, m.winner_id, tournament.id, freshMatches, true);
                // Re-fetch after each advance to keep data fresh
                freshRes = await A.client.from('matches')
                    .select('*')
                    .eq('tournament_id', tournament.id)
                    .order('round_number').order('match_order');
                freshMatches = freshRes.data || [];
            }
        }

        // Update tournament_registrations with seed_number and draw_position
        for (var i = 0; i < drawSize; i++) {
            if (draw[i]) {
                await A.client.from('tournament_registrations').update({
                    seed_number: draw[i].seed,
                    draw_position: i + 1
                }).eq('id', draw[i].reg_id);
            }
        }

        // Auto-assign schedule
        await assignFicSchedule(tournament);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- FIC: Advance Player (winner + loser) ----
    async function advanceFicPlayer(match, winnerId, tournamentId, allMatches, isWinnerOnly) {
        var roundNumber = match.round_number;
        var matchOrder = match.match_order;

        // Determine drawSize from R1 match count
        var r1Count = allMatches.filter(function(m) { return m.round_number === 1; }).length;
        var drawSize = r1Count * 2;
        var totalRounds = Math.log2(drawSize);
        var quarterDraw = drawSize / 4; // N/4

        // Final round — no advancement (these are place-deciding matches)
        if (roundNumber >= totalRounds) return;

        var nextRound = roundNumber + 1;

        // Winner → (R+1, ceil(M/2)), slot = M odd ? p1 : p2
        var nextWinnerOrder = Math.ceil(matchOrder / 2);
        var winnerSlot = (matchOrder % 2 !== 0) ? 'player1_id' : 'player2_id';
        var winnerSeedSlot = (matchOrder % 2 !== 0) ? 'seed1' : 'seed2';

        // Find the winner's seed
        var winnerSeed = null;
        if (winnerId === match.player1_id) winnerSeed = match.seed1;
        else if (winnerId === match.player2_id) winnerSeed = match.seed2;

        // Find next winner match
        var nextWinnerMatch = allMatches.find(function(m) {
            return m.round_number === nextRound && m.match_order === nextWinnerOrder;
        });

        if (nextWinnerMatch) {
            var wUpdate = {};
            wUpdate[winnerSlot] = winnerId;
            wUpdate[winnerSeedSlot] = winnerSeed;
            await A.client.from('matches').update(wUpdate).eq('id', nextWinnerMatch.id);
        }

        // Loser → (R+1, ceil(M/2) + N/4), same slot
        if (!isWinnerOnly) {
            var loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
            if (loserId) {
                var loserSeed = loserId === match.player1_id ? match.seed1 : match.seed2;
                var nextLoserOrder = Math.ceil(matchOrder / 2) + quarterDraw;

                var nextLoserMatch = allMatches.find(function(m) {
                    return m.round_number === nextRound && m.match_order === nextLoserOrder;
                });

                if (nextLoserMatch) {
                    var lUpdate = {};
                    lUpdate[winnerSlot] = loserId; // same slot as winner (odd→p1, even→p2)
                    lUpdate[winnerSeedSlot] = loserSeed;
                    await A.client.from('matches').update(lUpdate).eq('id', nextLoserMatch.id);
                }
            }
        }
    }

    // ---- Round-Robin Rounds (circle method) ----
    // Returns array of rounds, each round is array of {p1, p2} pairs
    // Players don't appear twice in the same round
    function generateRoundRobinRounds(players) {
        var n = players.length;
        if (n < 2) return [];

        // If odd, add a dummy (BYE) player that we'll filter out
        var list = players.slice();
        var hasGhost = false;
        if (n % 2 !== 0) {
            list.push(null); // ghost/BYE
            hasGhost = true;
            n = list.length;
        }

        var rounds = [];
        var numRounds = n - 1;
        var half = n / 2;

        // Fix first player, rotate the rest (circle method)
        // positions[0] is fixed, positions[1..n-1] rotate
        var positions = [];
        for (var i = 0; i < n; i++) positions.push(i);

        for (var r = 0; r < numRounds; r++) {
            var roundPairs = [];
            for (var i = 0; i < half; i++) {
                var p1Idx = positions[i];
                var p2Idx = positions[n - 1 - i];
                var p1 = list[p1Idx];
                var p2 = list[p2Idx];
                // Skip if either is ghost (BYE)
                if (p1 === null || p2 === null) continue;
                roundPairs.push({ p1: p1, p2: p2 });
            }
            rounds.push(roundPairs);

            // Rotate: keep positions[0] fixed, shift rest clockwise
            var last = positions[n - 1];
            for (var i = n - 1; i > 1; i--) {
                positions[i] = positions[i - 1];
            }
            positions[1] = last;
        }

        return rounds;
    }

    // ---- Generate Group Draw (Round-Robin) ----
    async function generateGroupDraw(tournament, approvedSorted, playersMap) {
        var groupCount = tournament.group_count || 2;
        var maxPart = tournament.max_participants || approvedSorted.length;

        // Take only main draw (first maxPart players), rest = waitlist
        var mainDraw = approvedSorted.slice(0, maxPart);
        var totalPlayers = mainDraw.length;

        if (groupCount < 2) {
            A.showToast(isEn ? 'Need at least 2 groups' : 'Нужно минимум 2 группы', 'error');
            return;
        }
        if (totalPlayers < groupCount * 2) {
            A.showToast(isEn ? 'Need at least 2 players per group' : 'Нужно минимум 2 игрока в группе', 'error');
            return;
        }

        // Seed count: top N players (1 per group)
        var seedCount = Math.min(groupCount, totalPlayers);

        // Split: seeded (top N) + unseeded (rest shuffled)
        var seeded = mainDraw.slice(0, seedCount);
        var unseeded = mainDraw.slice(seedCount);

        // Fisher-Yates shuffle unseeded
        for (var i = unseeded.length - 1; i > 0; i--) {
            var j = Math.floor(Math.random() * (i + 1));
            var tmp = unseeded[i];
            unseeded[i] = unseeded[j];
            unseeded[j] = tmp;
        }

        // Combined list: seeded first, then shuffled unseeded
        var allPlayers = seeded.concat(unseeded);

        // S-curve (snake) distribution into groups
        var groups = [];
        for (var g = 0; g < groupCount; g++) groups.push([]);

        for (var idx = 0; idx < allPlayers.length; idx++) {
            var pass = Math.floor(idx / groupCount);
            var posInPass = idx % groupCount;
            var groupIdx = (pass % 2 === 0) ? posInPass : (groupCount - 1 - posInPass);
            groups[groupIdx].push({
                reg: allPlayers[idx],
                seed: idx < seedCount ? (idx + 1) : null
            });
        }

        // Generate round-robin matches using circle method (non-conflicting pairs per round)
        var matchesToInsert = [];
        for (var g = 0; g < groupCount; g++) {
            var gPlayers = groups[g];
            var rrRounds = generateRoundRobinRounds(gPlayers);
            var matchOrder = 0;

            for (var rr = 0; rr < rrRounds.length; rr++) {
                for (var mp = 0; mp < rrRounds[rr].length; mp++) {
                    matchOrder++;
                    var pair = rrRounds[rr][mp];
                    matchesToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: pair.p1.reg.player_id,
                        player2_id: pair.p2.reg.player_id,
                        round: 'G' + (g + 1),
                        round_number: rr + 1,
                        match_order: matchOrder,
                        group_number: g + 1,
                        status: 'upcoming',
                        seed1: pair.p1.seed,
                        seed2: pair.p2.seed
                    });
                }
            }
        }

        // Insert matches
        var insertRes = await A.client.from('matches').insert(matchesToInsert);
        if (insertRes.error) {
            A.showToast(insertRes.error.message, 'error');
            return;
        }

        // Update registrations: group_number, seed_number, status → draw (batch)
        var regUpdates = [];
        for (var g = 0; g < groupCount; g++) {
            for (var p = 0; p < groups[g].length; p++) {
                var entry = groups[g][p];
                regUpdates.push(
                    A.client.from('tournament_registrations').update({
                        group_number: g + 1,
                        seed_number: entry.seed,
                        status: 'draw'
                    }).eq('id', entry.reg.id)
                );
            }
        }
        await Promise.all(regUpdates);

        // Auto-assign schedule
        await assignGroupSchedule(tournament, matchesToInsert.length);

        // Update tournament status
        await A.client.from('tournaments').update({ status: 'registration_closed' }).eq('id', tournament.id);

        A.showToast(L.drawGenerated, 'success');
    }

    // ---- Generate Playoff Draw from Group Winners ----
    async function generatePlayoffDraw(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var qualifiers = tournament.qualifiers_per_group || 2;
            var grpMatches = matches.filter(isGroupMatch);

            // 1. Get standings for each group → top-N qualifiers
            var allQualified = [];
            for (var g = 1; g <= groupCount; g++) {
                var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                var playerIds = [];
                groupMatchesG.forEach(function(m) {
                    if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                    if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                });
                var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                standings.sort(function(a, b) { return a.place - b.place; });

                for (var p = 0; p < Math.min(qualifiers, standings.length); p++) {
                    allQualified.push({
                        playerId: standings[p].playerId,
                        groupIdx: g - 1,
                        place: standings[p].place
                    });
                }
            }

            if (allQualified.length < 2) {
                A.showToast(isEn ? 'Need at least 2 qualified players' : 'Нужно минимум 2 вышедших игроков', 'error');
                return;
            }

            // 2. Determine draw_size: nearest power of 2 >= qualified count
            var drawSize = 2;
            while (drawSize < allQualified.length) drawSize *= 2;

            var totalRounds = Math.log2(drawSize);
            var seedCount = Math.min(groupCount, drawSize);

            // 3. Cross-seeding: 1st places are seeds, rest fill remaining slots
            // Seed positions from SEED_POSITIONS
            var seedPositions = (typeof SEED_POSITIONS !== 'undefined' && SEED_POSITIONS[drawSize])
                ? SEED_POSITIONS[drawSize]
                : (drawSize === 8 ? [1, 8, 5, 4] : (drawSize === 4 ? [1, 4, 3, 2] : [1, 2]));

            // Separate 1st-place finishers (seeds) and rest
            var firstPlaces = allQualified.filter(function(q) { return q.place === 1; });
            var otherPlaces = allQualified.filter(function(q) { return q.place > 1; });

            // Build draw array
            var draw = new Array(drawSize);
            for (var i = 0; i < drawSize; i++) draw[i] = null;

            // Place seeds (1st place finishers) at seed positions
            for (var s = 0; s < firstPlaces.length && s < seedPositions.length; s++) {
                draw[seedPositions[s] - 1] = {
                    player_id: firstPlaces[s].playerId,
                    seed: s + 1,
                    groupIdx: firstPlaces[s].groupIdx
                };
            }

            // Shuffle other qualifiers
            for (var i = otherPlaces.length - 1; i > 0; i--) {
                var j = Math.floor(Math.random() * (i + 1));
                var tmp = otherPlaces[i];
                otherPlaces[i] = otherPlaces[j];
                otherPlaces[j] = tmp;
            }

            // Place others avoiding same-group in first round where possible
            var emptySlots = [];
            for (var i = 0; i < drawSize; i++) {
                if (draw[i] === null) emptySlots.push(i);
            }

            // Try to place each player so they don't face a same-group opponent in R1
            var placed = [];
            var unplaced = otherPlaces.slice();

            for (var attempt = 0; attempt < unplaced.length; attempt++) {
                var player = unplaced[attempt];
                var bestSlot = -1;
                for (var si = 0; si < emptySlots.length; si++) {
                    var slot = emptySlots[si];
                    // R1 opponent is in adjacent slot (even pairs with next, odd pairs with prev)
                    var opponentSlot = (slot % 2 === 0) ? slot + 1 : slot - 1;
                    var opponent = draw[opponentSlot];
                    if (!opponent || opponent.groupIdx !== player.groupIdx) {
                        bestSlot = si;
                        break;
                    }
                }
                if (bestSlot === -1) bestSlot = 0; // fallback: no conflict-free slot
                draw[emptySlots[bestSlot]] = {
                    player_id: player.playerId,
                    seed: null,
                    groupIdx: player.groupIdx
                };
                emptySlots.splice(bestSlot, 1);
            }

            // 4. Generate playoff matches (same logic as SE bracket)
            var matchesToInsert = [];
            var matchOrder = 0;

            // First round
            for (var i = 0; i < drawSize; i += 2) {
                matchOrder++;
                var slot1 = draw[i];
                var slot2 = draw[i + 1];
                matchesToInsert.push({
                    tournament_id: tournament.id,
                    player1_id: slot1 ? slot1.player_id : null,
                    player2_id: slot2 ? slot2.player_id : null,
                    round: 'R1',
                    round_number: 1,
                    match_order: matchOrder,
                    group_number: null,
                    status: 'upcoming',
                    seed1: slot1 ? slot1.seed : null,
                    seed2: slot2 ? slot2.seed : null
                });
            }

            // Subsequent rounds
            for (var r = 2; r <= totalRounds; r++) {
                var matchesInRound = drawSize / Math.pow(2, r);
                for (var m = 1; m <= matchesInRound; m++) {
                    var roundPrefix = r === totalRounds ? 'F' :
                                      r === totalRounds - 1 ? 'SF' :
                                      r === totalRounds - 2 ? 'QF' : 'R' + r;
                    matchesToInsert.push({
                        tournament_id: tournament.id,
                        player1_id: null,
                        player2_id: null,
                        round: roundPrefix,
                        round_number: r,
                        match_order: m,
                        group_number: null,
                        status: 'upcoming',
                        seed1: null,
                        seed2: null
                    });
                }
            }

            // 3rd place match
            matchesToInsert.push({
                tournament_id: tournament.id,
                player1_id: null,
                player2_id: null,
                round: '3RD',
                round_number: totalRounds,
                match_order: 0,
                group_number: null,
                status: 'upcoming',
                seed1: null,
                seed2: null
            });

            // Handle BYEs in first round
            for (var i = 0; i < matchesToInsert.length; i++) {
                var match = matchesToInsert[i];
                if (match.round_number !== 1) continue;
                if (match.player1_id && !match.player2_id) {
                    match.winner_id = match.player1_id;
                    match.status = 'completed';
                    match.score = 'BYE';
                } else if (!match.player1_id && match.player2_id) {
                    match.winner_id = match.player2_id;
                    match.status = 'completed';
                    match.score = 'BYE';
                }
            }

            // Insert playoff matches
            var insertRes = await A.client.from('matches').insert(matchesToInsert);
            if (insertRes.error) {
                A.showToast(insertRes.error.message, 'error');
                return;
            }

            // Auto-advance BYE winners
            var freshRes = await A.client.from('matches')
                .select('*')
                .eq('tournament_id', tournament.id)
                .is('group_number', null)
                .order('round_number').order('match_order');
            var freshPlMatches = freshRes.data || [];

            var r1Fresh = freshPlMatches.filter(function(m) { return m.round_number === 1; });
            var r2Fresh = freshPlMatches.filter(function(m) { return m.round_number === 2; });

            for (var i = 0; i < r1Fresh.length; i++) {
                var m = r1Fresh[i];
                if (m.winner_id && m.score === 'BYE' && r2Fresh.length > 0) {
                    var nextMatchIdx = Math.floor(i / 2);
                    if (nextMatchIdx < r2Fresh.length) {
                        var nextMatch = r2Fresh[nextMatchIdx];
                        var updateField = (i % 2 === 0) ? 'player1_id' : 'player2_id';
                        var seedField = (i % 2 === 0) ? 'seed1' : 'seed2';
                        var updateData = {};
                        updateData[updateField] = m.winner_id;
                        updateData[seedField] = (i % 2 === 0) ? m.seed1 : m.seed2;
                        await A.client.from('matches').update(updateData).eq('id', nextMatch.id);
                    }
                }
            }

            // Schedule playoff matches
            await assignPlayoffSchedule(tournament);

            A.showToast(isEn ? 'Playoff bracket generated' : 'Сетка плей-офф сформирована', 'success');
        } catch (err) {
            console.error('Generate playoff draw error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Schedule for playoff matches (after group stage) ----
    async function assignPlayoffSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var bufferMinutes = tournament.buffer_minutes || 15;
        var scheduledDay = tournament.date_start || null;

        // Fetch playoff matches
        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .is('group_number', null)
            .order('round_number').order('match_order');
        var plMatches = res.data || [];
        if (!plMatches.length) return;

        // Find latest group match time to start playoff after
        var grpRes = await A.client.from('matches')
            .select('scheduled_time')
            .eq('tournament_id', tournament.id)
            .gt('group_number', 0)
            .order('scheduled_time', { ascending: false })
            .limit(1);
        var lastGroupTime = (grpRes.data && grpRes.data[0] && grpRes.data[0].scheduled_time) || '09:00';

        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        var currentMin = timeToMin(lastGroupTime.slice(0, 5)) + matchDuration + bufferMinutes;

        // Group by round_number
        var roundsMap = {};
        plMatches.forEach(function(m) {
            var rn = m.round_number;
            if (!roundsMap[rn]) roundsMap[rn] = [];
            roundsMap[rn].push(m);
        });
        var totalRounds = Math.max.apply(null, Object.keys(roundsMap).map(Number));

        var plSchedUpdates = [];
        var finalTime = null;

        for (var r = 1; r <= totalRounds; r++) {
            var roundM = (roundsMap[r] || []).sort(function(a, b) { return a.match_order - b.match_order; });
            var playable = roundM.filter(function(m) { return m.status === 'upcoming' && m.score !== 'BYE'; });
            if (!playable.length) continue;

            var waveStartMin = currentMin;
            for (var i = 0; i < playable.length; i++) {
                var waveIndex = Math.floor(i / courtCount);
                var courtIndex = i % courtCount;
                var matchTime = waveStartMin + waveIndex * (matchDuration + bufferMinutes);
                var timeStr = minToTime(matchTime);

                // Remember final's time for 3rd place
                if (playable[i].round === 'F') finalTime = timeStr;

                plSchedUpdates.push(
                    A.client.from('matches').update({
                        scheduled_time: timeStr,
                        scheduled_day: scheduledDay,
                        court: null
                    }).eq('id', playable[i].id)
                );

                var waveEnd = matchTime + matchDuration;
                if (waveEnd + bufferMinutes > currentMin) currentMin = waveEnd + bufferMinutes;
            }
        }

        // 3rd place match — same time as Final
        var thirdM = plMatches.find(function(m) { return m.round === '3RD'; });
        if (thirdM && finalTime) {
            plSchedUpdates.push(
                A.client.from('matches').update({
                    scheduled_time: finalTime,
                    scheduled_day: scheduledDay,
                    court: null
                }).eq('id', thirdM.id)
            );
        }

        await Promise.all(plSchedUpdates);
    }

    // ---- Auto Schedule for Group Stage (Smart: 3 scenarios) ----
    async function assignGroupSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var bufferMinutes = tournament.buffer_minutes || 15;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        var groupCount = tournament.group_count || 2;
        var interval = matchDuration + bufferMinutes;

        // Fetch fresh group matches
        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .gt('group_number', 0)
            .order('round_number').order('group_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        var maxRound = 0;
        allMatches.forEach(function(m) { if (m.round_number > maxRound) maxRound = m.round_number; });

        var schedUpdates = [];

        if (groupCount === courtCount) {
            // ---- Scenario 1: 1:1 — each group on its own court ----
            for (var g = 1; g <= groupCount; g++) {
                var gMatches = allMatches
                    .filter(function(m) { return m.group_number === g; })
                    .sort(function(a, b) { return a.round_number - b.round_number || a.match_order - b.match_order; });
                var currentMin = timeToMin(startTime);
                gMatches.forEach(function(m) {
                    schedUpdates.push(
                        A.client.from('matches').update({
                            scheduled_time: minToTime(currentMin),
                            scheduled_day: scheduledDay,
                            court: String(g)
                        }).eq('id', m.id)
                    );
                    currentMin += interval;
                });
            }
        } else if (groupCount < courtCount) {
            // ---- Scenario 3: Spread — more courts than groups ----
            var courtsPerGroup = Math.floor(courtCount / groupCount);
            var extraCourts = courtCount % groupCount;
            var courtAssign = {};
            var courtIdx = 1;
            for (var g = 1; g <= groupCount; g++) {
                var nCourts = courtsPerGroup + (g <= extraCourts ? 1 : 0);
                courtAssign[g] = [];
                for (var c = 0; c < nCourts; c++) {
                    courtAssign[g].push(courtIdx++);
                }
            }
            // For each RR round, distribute group matches across assigned courts
            for (var rr = 1; rr <= maxRound; rr++) {
                for (var g = 1; g <= groupCount; g++) {
                    var rrMatches = allMatches.filter(function(m) {
                        return m.round_number === rr && m.group_number === g;
                    });
                    var courts = courtAssign[g];
                    // Determine wave time: all courts for the same group+round start at the same wave
                    // Wave = within one RR round, how many waves needed for this group
                    for (var mi = 0; mi < rrMatches.length; mi++) {
                        var waveIdx = Math.floor(mi / courts.length);
                        var cIdx = mi % courts.length;
                        var waveTime = timeToMin(startTime) + (rr - 1) * interval;
                        // Add wave offset within same RR round
                        waveTime += waveIdx * interval;
                        schedUpdates.push(
                            A.client.from('matches').update({
                                scheduled_time: minToTime(waveTime),
                                scheduled_day: scheduledDay,
                                court: String(courts[cIdx])
                            }).eq('id', rrMatches[mi].id)
                        );
                    }
                }
            }
        } else {
            // ---- Scenario 2: Waves — more groups than courts ----
            var currentMin = timeToMin(startTime);
            for (var rr = 1; rr <= maxRound; rr++) {
                var roundMatches = [];
                for (var g = 1; g <= groupCount; g++) {
                    var gRoundM = allMatches.filter(function(m) {
                        return m.round_number === rr && m.group_number === g;
                    });
                    gRoundM.forEach(function(m) { roundMatches.push(m); });
                }
                if (!roundMatches.length) continue;

                // Interleave: alternate groups to spread rest evenly
                if (rr % 2 === 0) roundMatches.reverse();

                // Distribute in waves of courtCount
                for (var i = 0; i < roundMatches.length; i++) {
                    var waveIndex = Math.floor(i / courtCount);
                    var courtIndex = i % courtCount;
                    var matchTime = currentMin + waveIndex * interval;

                    schedUpdates.push(
                        A.client.from('matches').update({
                            scheduled_time: minToTime(matchTime),
                            scheduled_day: scheduledDay,
                            court: String(courtIndex + 1)
                        }).eq('id', roundMatches[i].id)
                    );
                }

                var totalWaves = Math.ceil(roundMatches.length / courtCount);
                currentMin += totalWaves * interval;
            }
        }

        await Promise.all(schedUpdates);
    }

    // ---- Auto Schedule Assignment ----
    async function assignSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var bufferMinutes = tournament.buffer_minutes || 15;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);

        // Fetch fresh matches after BYE processing
        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        // Helper: parse "HH:MM" to total minutes
        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        // Helper: total minutes to "HH:MM"
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        // Group by round_number
        var roundsMap = {};
        allMatches.forEach(function(m) {
            var rn = m.round_number;
            if (!roundsMap[rn]) roundsMap[rn] = [];
            roundsMap[rn].push(m);
        });

        var updates = [];
        var currentStartMin = timeToMin(startTime);

        for (var r = 1; r <= totalRounds; r++) {
            var roundMatches = roundsMap[r] || [];
            // Sort by match_order
            roundMatches.sort(function(a, b) { return a.match_order - b.match_order; });

            // Filter only playable matches (exclude completed BYEs)
            var playable = roundMatches.filter(function(m) {
                return m.status === 'upcoming' && m.score !== 'BYE';
            });

            if (!playable.length) continue;

            // Distribute in waves of courtCount
            var waveStartMin = currentStartMin;
            var lastWaveEndMin = currentStartMin;

            for (var i = 0; i < playable.length; i++) {
                var waveIndex = Math.floor(i / courtCount);
                var courtIndex = i % courtCount;

                var matchTime = waveStartMin + waveIndex * (matchDuration + bufferMinutes);
                // Court number only for first wave of each round
                var courtNum = (waveIndex === 0) ? (courtIndex + 1) : null;

                updates.push({
                    id: playable[i].id,
                    scheduled_time: minToTime(matchTime),
                    scheduled_day: scheduledDay,
                    court: courtNum ? String(courtNum) : null
                });

                var waveEnd = matchTime + matchDuration;
                if (waveEnd > lastWaveEndMin) lastWaveEndMin = waveEnd;
            }

            // Next round starts after last wave + buffer
            currentStartMin = lastWaveEndMin + bufferMinutes;
        }

        // Handle 3rd place match — same time as Final
        var thirdMatch = allMatches.find(function(m) { return m.round === '3RD'; });
        var finalMatch = allMatches.find(function(m) { return m.round_number === totalRounds; });
        if (thirdMatch && finalMatch) {
            var finalUpdate = updates.find(function(u) { return u.id === finalMatch.id; });
            if (finalUpdate) {
                updates.push({
                    id: thirdMatch.id,
                    scheduled_time: finalUpdate.scheduled_time,
                    scheduled_day: scheduledDay,
                    court: null
                });
            }
        }

        // Batch update (parallel)
        await Promise.all(updates.map(function(u) {
            return A.client.from('matches').update({
                scheduled_time: u.scheduled_time,
                scheduled_day: u.scheduled_day,
                court: u.court
            }).eq('id', u.id);
        }));
    }

    // ---- FIC Schedule Assignment ----
    async function assignFicSchedule(tournament) {
        var courtCount = tournament.court_count || 2;
        var matchDuration = tournament.match_duration || 90;
        var bufferMinutes = tournament.buffer_minutes || 15;
        var startTime = tournament.start_time ? tournament.start_time.slice(0, 5) : '09:00';
        var scheduledDay = tournament.date_start || null;
        var drawSize = tournament.draw_size || 16;
        var totalRounds = Math.log2(drawSize);
        var halfDraw = drawSize / 2;

        var res = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournament.id)
            .order('round_number').order('match_order');
        var allMatches = res.data || [];
        if (!allMatches.length) return;

        function timeToMin(t) {
            var parts = t.split(':');
            return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
        }
        function minToTime(m) {
            var h = Math.floor(m / 60);
            var mm = m % 60;
            return (h < 10 ? '0' : '') + h + ':' + (mm < 10 ? '0' : '') + mm;
        }

        var updates = [];
        // Track end times keyed by 'R-M'
        var matchEndTime = {};

        // Round 1: wave-based (same as SE)
        var r1Matches = allMatches.filter(function(m) { return m.round_number === 1; })
            .sort(function(a, b) { return a.match_order - b.match_order; });
        var playableR1 = r1Matches.filter(function(m) { return m.status === 'upcoming' && m.score !== 'BYE'; });

        var currentStartMin = timeToMin(startTime);
        var lastR1End = currentStartMin;

        for (var i = 0; i < playableR1.length; i++) {
            var waveIndex = Math.floor(i / courtCount);
            var courtIndex = i % courtCount;
            var matchTime = currentStartMin + waveIndex * (matchDuration + bufferMinutes);
            var courtNum = (waveIndex === 0) ? (courtIndex + 1) : null;

            updates.push({
                id: playableR1[i].id,
                scheduled_time: minToTime(matchTime),
                scheduled_day: scheduledDay,
                court: courtNum ? String(courtNum) : null
            });

            var waveEnd = matchTime + matchDuration;
            if (waveEnd > lastR1End) lastR1End = waveEnd;
            matchEndTime['1-' + playableR1[i].match_order] = waveEnd;
        }

        // BYE matches in R1: set endTime = startTime (instant)
        r1Matches.forEach(function(m) {
            if (m.score === 'BYE' || m.status === 'completed') {
                matchEndTime['1-' + m.match_order] = timeToMin(startTime);
            }
        });

        // Rounds 2+: dependency-based
        var quarterDraw = drawSize / 4;
        for (var r = 2; r <= totalRounds; r++) {
            var roundMatches = allMatches.filter(function(m) { return m.round_number === r; })
                .sort(function(a, b) { return a.match_order - b.match_order; });

            roundMatches.forEach(function(m) {
                var mo = m.match_order;
                // Determine feeder matches from R-1
                var feeder1End = 0, feeder2End = 0;

                if (mo <= quarterDraw) {
                    // Winners bracket: feeders = winners from (R-1, 2*M-1) and (R-1, 2*M)
                    var f1 = (r - 1) + '-' + (2 * mo - 1);
                    var f2 = (r - 1) + '-' + (2 * mo);
                    feeder1End = matchEndTime[f1] || lastR1End;
                    feeder2End = matchEndTime[f2] || lastR1End;
                } else {
                    // Losers bracket: feeders = losers from (R-1, 2*(M-N/4)-1) and (R-1, 2*(M-N/4))
                    var loserBase = mo - quarterDraw;
                    var f1 = (r - 1) + '-' + (2 * loserBase - 1);
                    var f2 = (r - 1) + '-' + (2 * loserBase);
                    feeder1End = matchEndTime[f1] || lastR1End;
                    feeder2End = matchEndTime[f2] || lastR1End;
                }

                var earliestStart = Math.max(feeder1End, feeder2End) + bufferMinutes;
                matchEndTime[r + '-' + mo] = earliestStart + matchDuration;

                updates.push({
                    id: m.id,
                    scheduled_time: minToTime(earliestStart),
                    scheduled_day: scheduledDay,
                    court: null
                });
            });
        }

        await Promise.all(updates.map(function(u) {
            return A.client.from('matches').update({
                scheduled_time: u.scheduled_time,
                scheduled_day: u.scheduled_day,
                court: u.court
            }).eq('id', u.id);
        }));
    }

    // ---- Score Entry Modal ----
    // Tennis score validation
    function isValidSet(a, b) {
        a = parseInt(a); b = parseInt(b);
        if (isNaN(a) || isNaN(b)) return false;
        if (a < 0 || b < 0 || a > 7 || b > 7) return false;
        // Normal win: 6-0..6-4
        if ((a === 6 && b <= 4) || (b === 6 && a <= 4)) return true;
        // 7-5
        if ((a === 7 && b === 5) || (b === 7 && a === 5)) return true;
        // Tiebreak: 7-6
        if ((a === 7 && b === 6) || (b === 7 && a === 6)) return true;
        return false;
    }

    function formatScoreDisplay(score) {
        if (!score || score === 'BYE') return score || '';
        return score.split(' ').map(function(set) {
            var p = set.split('/');
            return p[0] + ':' + (p[1] || '0');
        }).join('  ');
    }

    function openScoreModal(match, playersMap, tournamentId) {
        var p1 = playersMap[match.player1_id] || {};
        var p2 = playersMap[match.player2_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        // Parse existing score: "6/4 7/6(11-9) 6/3" → sets + tiebreaks
        var existingSets = (match.score && match.score !== 'BYE') ? match.score.split(' ') : [];
        var sv = [['','','',''],['','','',''],['','','','']];
        for (var i = 0; i < 3; i++) {
            if (existingSets[i]) {
                var tbMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)-(\d+)\))?$/);
                if (tbMatch) {
                    sv[i] = [tbMatch[1], tbMatch[2], tbMatch[3] || '', tbMatch[4] || ''];
                } else {
                    var oldMatch = existingSets[i].match(/^(\d+)\/(\d+)(?:\((\d+)\))?$/);
                    if (oldMatch) {
                        sv[i] = [oldMatch[1], oldMatch[2], '', oldMatch[3] || ''];
                    }
                }
            }
        }

        // Determine initial visible sets count from existing data
        var visibleSets = 1;
        if (existingSets.length >= 3) visibleSets = 3;
        else if (existingSets.length === 2) visibleSets = 2;

        function setRowHtml(setNum, vals) {
            var id1 = 'adS' + setNum + 'P1';
            var id2 = 'adS' + setNum + 'P2';
            var idTB1 = 'adS' + setNum + 'TB1';
            var idTB2 = 'adS' + setNum + 'TB2';
            return '<div class="ad-score-set-row" data-set="' + setNum + '" id="adSetRow' + setNum + '">' +
                '<label class="ad-field-label" style="min-width:40px;">Set ' + setNum + '</label>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id1 + '" value="' + vals[0] + '">' +
                '<span style="font-weight:600;">:</span>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id2 + '" value="' + vals[1] + '">' +
                '<span class="ad-tb-wrap" id="' + idTB1 + 'Wrap" style="display:none;">' +
                    '<span style="font-size:11px;color:var(--text-secondary);margin-left:8px;">TB</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB1 + '" value="' + vals[2] + '">' +
                    '<span style="font-weight:600;font-size:11px;">:</span>' +
                    '<input type="text" inputmode="numeric" maxlength="2" class="ad-field-input ad-score-input ad-tb-input" id="' + idTB2 + '" value="' + vals[3] + '">' +
                '</span>' +
            '</div>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.enterScore + '</h3>' +
                    '<button class="ad-modal-close" id="adScoreClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="text-align:center;margin-bottom:16px;">' +
                        '<div style="font-weight:600;">' + A.esc(p1Name) + (match.seed1 ? ' <span style="color:var(--accent);font-size:11px;">[' + match.seed1 + ']</span>' : '') + '</div>' +
                        '<div style="color:var(--text-secondary);font-size:12px;margin:4px 0;">' + L.vsLabel + '</div>' +
                        '<div style="font-weight:600;">' + A.esc(p2Name) + (match.seed2 ? ' <span style="color:var(--accent);font-size:11px;">[' + match.seed2 + ']</span>' : '') + '</div>' +
                    '</div>' +
                    '<div id="adSetsContainer">' +
                        setRowHtml(1, sv[0]) +
                        setRowHtml(2, sv[1]) +
                        setRowHtml(3, sv[2]) +
                    '</div>' +
                    '<div id="adSetButtons" style="display:flex;gap:8px;justify-content:center;margin-top:8px;">' +
                        '<button class="ad-btn ad-btn-secondary" id="adAddSet" style="font-size:0.8rem;padding:4px 12px;">' + L.addSet + '</button>' +
                        '<button class="ad-btn ad-btn-secondary" id="adRemoveSet" style="font-size:0.8rem;padding:4px 12px;">' + L.removeSet + '</button>' +
                    '</div>' +
                    '<div style="margin-top:12px;text-align:center;">' +
                        '<label class="ad-field-label">' + L.matchWinner + '</label>' +
                        '<div id="adWinnerDisplay" style="padding:8px;font-size:0.95rem;"></div>' +
                        '<input type="hidden" id="adScoreWinner" value="' + (match.winner_id || '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-primary" id="adScoreSave">' + L.saveScore + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        var currentSets = visibleSets;

        function updateSetsVisibility() {
            for (var s = 1; s <= 3; s++) {
                var row = document.getElementById('adSetRow' + s);
                if (row) row.style.display = s <= currentSets ? '' : 'none';
            }
            document.getElementById('adAddSet').style.display = currentSets < 3 ? '' : 'none';
            document.getElementById('adRemoveSet').style.display = currentSets > 1 ? '' : 'none';
            // Clear hidden sets
            for (var s = currentSets + 1; s <= 3; s++) {
                var p1Input = document.getElementById('adS' + s + 'P1');
                var p2Input = document.getElementById('adS' + s + 'P2');
                var tb1Input = document.getElementById('adS' + s + 'TB1');
                var tb2Input = document.getElementById('adS' + s + 'TB2');
                if (p1Input) p1Input.value = '';
                if (p2Input) p2Input.value = '';
                if (tb1Input) tb1Input.value = '';
                if (tb2Input) tb2Input.value = '';
            }
            updateState();
        }

        document.getElementById('adAddSet').addEventListener('click', function() {
            if (currentSets < 3) { currentSets++; updateSetsVisibility(); }
        });
        document.getElementById('adRemoveSet').addEventListener('click', function() {
            if (currentSets > 1) { currentSets--; updateSetsVisibility(); }
        });

        // Show/hide tiebreak inputs when 7:6 or 6:7
        function checkTiebreaks() {
            for (var s = 1; s <= 3; s++) {
                var p1El = document.getElementById('adS' + s + 'P1');
                var p2El = document.getElementById('adS' + s + 'P2');
                if (!p1El || !p2El) continue;
                var v1 = parseInt(p1El.value) || 0;
                var v2 = parseInt(p2El.value) || 0;
                var tbWrap = document.getElementById('adS' + s + 'TB1Wrap');
                if (tbWrap) {
                    tbWrap.style.display = ((v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7)) ? 'inline-flex' : 'none';
                }
            }
        }

        function updateState() {
            checkTiebreaks();

            var p1Sets = 0, p2Sets = 0;
            for (var s = 1; s <= currentSets; s++) {
                var v1 = parseInt(document.getElementById('adS' + s + 'P1').value) || 0;
                var v2 = parseInt(document.getElementById('adS' + s + 'P2').value) || 0;
                if (v1 > v2) p1Sets++; else if (v2 > v1) p2Sets++;
            }

            // Winner logic based on number of visible sets
            var winnerId = '';
            var winnerDisplay = document.getElementById('adWinnerDisplay');
            var neededToWin = currentSets === 1 ? 1 : 2;

            if (p1Sets >= neededToWin) {
                winnerId = match.player1_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + A.esc(p1Name) + '</span>';
            } else if (p2Sets >= neededToWin) {
                winnerId = match.player2_id;
                winnerDisplay.innerHTML = '<span style="color:var(--accent);font-weight:600;">' + A.esc(p2Name) + '</span>';
            } else {
                var totalPlayed = p1Sets + p2Sets;
                var label = totalPlayed > 0 ? (p1Sets + ':' + p2Sets) : (isEn ? 'Enter score' : 'Введите счёт');
                winnerDisplay.innerHTML = '<span style="color:var(--text-secondary);font-size:0.85rem;">' + label + '</span>';
            }
            document.getElementById('adScoreWinner').value = winnerId;
        }

        function bindInputEvents() {
            overlay.querySelectorAll('.ad-set-game').forEach(function(input) {
                input.removeEventListener('input', input._handler);
                input._handler = function() {
                    var v = input.value.replace(/[^0-7]/g, '');
                    if (v.length > 1) v = v.charAt(v.length - 1);
                    input.value = v;
                    updateState();
                    if (v.length === 1) {
                        var allInputs = Array.from(overlay.querySelectorAll('.ad-set-game:not([style*="display: none"] *), .ad-tb-input'));
                        var visibleInputs = allInputs.filter(function(el) { return el.offsetParent !== null; });
                        var idx = visibleInputs.indexOf(input);
                        if (idx >= 0 && idx < visibleInputs.length - 1) visibleInputs[idx + 1].focus();
                    }
                };
                input.addEventListener('input', input._handler);
            });
            overlay.querySelectorAll('.ad-tb-input').forEach(function(input) {
                input.removeEventListener('input', input._tbHandler);
                input._tbHandler = function() {
                    input.value = input.value.replace(/[^0-9]/g, '').slice(0, 2);
                    updateState();
                };
                input.addEventListener('input', input._tbHandler);
            });
        }

        bindInputEvents();
        updateSetsVisibility();

        // Close
        document.getElementById('adScoreClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Save
        document.getElementById('adScoreSave').addEventListener('click', async function() {
            // Validate visible sets
            for (var s = 1; s <= currentSets; s++) {
                var v1 = document.getElementById('adS' + s + 'P1').value;
                var v2 = document.getElementById('adS' + s + 'P2').value;
                if (v1 === '' || v2 === '') {
                    A.showToast((isEn ? 'Fill in Set ' : 'Заполните сет ') + s, 'error');
                    return;
                }
                if (!isValidSet(v1, v2)) {
                    A.showToast((isEn ? 'Invalid Set ' : 'Некорректный счёт сета ') + s, 'error');
                    return;
                }
            }

            var winnerId = document.getElementById('adScoreWinner').value;
            if (!winnerId) {
                A.showToast(isEn ? 'Cannot determine winner' : 'Невозможно определить победителя', 'error');
                return;
            }

            // Build score string
            function buildSet(num) {
                var v1 = document.getElementById('adS' + num + 'P1').value;
                var v2 = document.getElementById('adS' + num + 'P2').value;
                if (v1 === '' || v2 === '') return null;
                var tb1 = document.getElementById('adS' + num + 'TB1').value;
                var tb2 = document.getElementById('adS' + num + 'TB2').value;
                var setStr = v1 + '/' + v2;
                if (tb1 !== '' && tb2 !== '' && ((+v1 === 7 && +v2 === 6) || (+v1 === 6 && +v2 === 7))) {
                    setStr += '(' + tb1 + '-' + tb2 + ')';
                }
                return setStr;
            }

            var scoreParts = [];
            for (var s = 1; s <= currentSets; s++) {
                var setStr = buildSet(s);
                if (setStr) scoreParts.push(setStr);
            }
            var scoreStr = scoreParts.join(' ');

            var updateData = {
                score: scoreStr,
                winner_id: winnerId,
                status: 'completed',
                played_at: new Date().toISOString()
            };

            var res = await A.client.from('matches').update(updateData).eq('id', match.id);
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }

            // Skip advanceWinner for group matches (no next round)
            if (!match.group_number) {
                var isFicMatch = match.round && match.round.indexOf('FIC-') === 0;
                if (isFicMatch) {
                    var ficRes = await A.client.from('matches').select('*')
                        .eq('tournament_id', tournamentId)
                        .order('round_number').order('match_order');
                    await advanceFicPlayer(match, winnerId, tournamentId, ficRes.data || [], false);
                } else {
                    await advanceWinner(match, winnerId, tournamentId);
                }
            }

            overlay.remove();
            A.showToast(L.saved, 'success');
            renderBracketManagement(tournamentId);
        });
    }

    // ---- Auto-advance winner to next round ----
    async function advanceWinner(match, winnerId, tournamentId) {
        var roundNumber = match.round_number;
        var matchOrder = match.match_order;
        var nextRound = roundNumber + 1;

        // Skip 3rd place match — it doesn't advance anywhere
        if (match.round === '3RD') return;

        // Find next match: match_order = ceil(matchOrder / 2)
        var nextMatchOrder = Math.ceil(matchOrder / 2);

        var nextRes = await A.client.from('matches')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('round_number', nextRound)
            .eq('match_order', nextMatchOrder)
            .maybeSingle();

        if (!nextRes.data) return; // Final match or error

        var nextMatch = nextRes.data;
        // If matchOrder is odd → player1, even → player2
        var isSlot1 = (matchOrder % 2 !== 0);
        var updateField = isSlot1 ? 'player1_id' : 'player2_id';
        var seedField = isSlot1 ? 'seed1' : 'seed2';

        // Carry over the seed of the winner
        var winnerSeed = null;
        if (match.winner_id === match.player1_id) winnerSeed = match.seed1;
        else if (match.winner_id === match.player2_id) winnerSeed = match.seed2;

        var update = {};
        update[updateField] = winnerId;
        update[seedField] = winnerSeed;

        await A.client.from('matches').update(update).eq('id', nextMatch.id);

        // SF match: also place LOSER into 3rd place match
        if (match.round === 'SF') {
            var loserId = winnerId === match.player1_id ? match.player2_id : match.player1_id;
            var loserSeed = loserId === match.player1_id ? match.seed1 : match.seed2;

            // Find 3rd place match
            var thirdRes = await A.client.from('matches')
                .select('*')
                .eq('tournament_id', tournamentId)
                .eq('round', '3RD')
                .maybeSingle();

            if (thirdRes.data) {
                var thirdMatch = thirdRes.data;
                // SF match 1 (match_order=1) loser → player1, SF match 2 loser → player2
                var tField = matchOrder === 1 ? 'player1_id' : 'player2_id';
                var tSeedField = matchOrder === 1 ? 'seed1' : 'seed2';
                var tUpdate = {};
                tUpdate[tField] = loserId;
                tUpdate[tSeedField] = loserSeed;
                await A.client.from('matches').update(tUpdate).eq('id', thirdMatch.id);
            }
        }
    }

    // ---- Finalize Tournament ----
    async function finalizeTournament(tournament, matches, playersMap) {
        // Dispatch to group finalization for round_robin
        if (tournament.bracket_type === 'round_robin') {
            await finalizeGroupTournament(tournament, matches, playersMap);
            return;
        }
        // Dispatch to FIC finalization
        if (tournament.bracket_type === 'fic') {
            await finalizeFicTournament(tournament, matches, playersMap);
            return;
        }

        try {
            var drawSize = tournament.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var season = new Date().getFullYear();

            // Load points rules for this tournament's level
            var rulesMap = {};
            if (tournament.level_id) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Determine round_reached for each player
            var playerResults = {}; // player_id → { round_reached, points_earned }

            // Find the final match to determine winner (exclude 3RD place match)
            var finalMatch = matches.find(function(m) { return m.round_number === totalRounds && m.round !== '3RD'; });

            if (finalMatch && finalMatch.winner_id) {
                // Winner
                playerResults[finalMatch.winner_id] = {
                    round_reached: 'W',
                    points_earned: rulesMap['W'] || 0
                };
                // Finalist (loser of final)
                var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                if (finalist) {
                    playerResults[finalist] = {
                        round_reached: 'F',
                        points_earned: rulesMap['F'] || 0
                    };
                }
            }

            // 3rd place match: winner = 3rd, loser excluded from results
            var thirdPlaceExclude = {};
            var thirdPlaceMatch = matches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
            if (thirdPlaceMatch) {
                playerResults[thirdPlaceMatch.winner_id] = {
                    round_reached: '3RD',
                    points_earned: rulesMap['3RD'] || rulesMap['SF'] || 0
                };
                // Mark loser as excluded (won't appear in results)
                var thirdLoserId = thirdPlaceMatch.winner_id === thirdPlaceMatch.player1_id ? thirdPlaceMatch.player2_id : thirdPlaceMatch.player1_id;
                if (thirdLoserId) thirdPlaceExclude[thirdLoserId] = true;
            }

            // Other players: lost in their round
            matches.forEach(function(m) {
                if (m.status !== 'completed' || !m.winner_id) return;
                if (m.score === 'BYE') return; // Skip BYEs
                if (m.round === '3RD') return; // Handled above

                var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                if (!loserId || playerResults[loserId] || thirdPlaceExclude[loserId]) return;

                // Player lost in round m.round_number → their round_reached is based on that
                var roundKey = getRoundKey(m.round_number, totalRounds);
                playerResults[loserId] = {
                    round_reached: roundKey,
                    points_earned: rulesMap[roundKey] || 0
                };
            });

            // Upsert tournament_results
            var toUpsert = [];
            Object.keys(playerResults).forEach(function(pid) {
                toUpsert.push({
                    tournament_id: tournament.id,
                    player_id: pid,
                    round_reached: playerResults[pid].round_reached,
                    points_earned: playerResults[pid].points_earned,
                    season: season,
                    category_id: tournament.category_id
                });
            });

            if (toUpsert.length > 0) {
                // Clean up old results before inserting (prevents duplicates from re-finalization)
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);

                var upsRes = await A.client.from('tournament_results').insert(toUpsert);
                if (upsRes.error) {
                    A.showToast(upsRes.error.message, 'error');
                    return;
                }

                // Recalculate player points
                await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));
            }

            // Update player form arrays (W/L from recent matches)
            var allPlayerIds = Object.keys(playerResults);
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);

                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });

                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            // Update tournament status
            var statusRes = await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            if (statusRes.error) {
                A.showToast(statusRes.error.message, 'error');
                return;
            }

            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Finalize FIC Tournament ----
    async function finalizeFicTournament(tournament, matches, playersMap) {
        try {
            var drawSize = tournament.draw_size || 16;
            var totalRounds = Math.log2(drawSize);
            var halfDraw = drawSize / 2;
            var season = new Date().getFullYear();

            // Load points rules
            var rulesMap = {};
            if (tournament.level_id) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Bit-reversal for place determination from final round
            function bitReverse(num, bits) {
                var result = 0;
                for (var i = 0; i < bits; i++) {
                    result = (result << 1) | (num & 1);
                    num >>= 1;
                }
                return result;
            }

            // Map place → points round_key
            function placeToRoundKey(place) {
                if (place === 1) return 'W';
                if (place === 2) return 'F';
                if (place === 3) return '3RD';
                if (place === 4) return '4TH';
                if (place <= 6) return 'SF';
                if (place <= 8) return 'QF';
                if (place <= 16) return 'R16';
                if (place <= 32) return 'R32';
                return 'R32';
            }

            var playerResults = {};

            // Final round matches determine all places via bit-reversal
            var finalRoundMatches = matches.filter(function(m) {
                return m.round_number === totalRounds;
            }).sort(function(a, b) { return a.match_order - b.match_order; });

            finalRoundMatches.forEach(function(m) {
                if (m.status !== 'completed' || !m.winner_id) return;

                var idx = m.match_order - 1;
                var placeGroup = bitReverse(idx, totalRounds - 1);
                var winnerPlace = placeGroup * 2 + 1;
                var loserPlace = winnerPlace + 1;

                var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;

                var winnerKey = placeToRoundKey(winnerPlace);
                playerResults[m.winner_id] = {
                    round_reached: winnerKey,
                    points_earned: rulesMap[winnerKey] || 0,
                    place: winnerPlace
                };

                if (loserId) {
                    var loserKey = placeToRoundKey(loserPlace);
                    playerResults[loserId] = {
                        round_reached: loserKey,
                        points_earned: rulesMap[loserKey] || 0,
                        place: loserPlace
                    };
                }
            });

            // Upsert tournament_results
            var toUpsert = [];
            Object.keys(playerResults).forEach(function(pid) {
                toUpsert.push({
                    tournament_id: tournament.id,
                    player_id: pid,
                    round_reached: playerResults[pid].round_reached,
                    points_earned: playerResults[pid].points_earned,
                    season: season,
                    category_id: tournament.category_id
                });
            });

            if (toUpsert.length > 0) {
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);
                var upsRes = await A.client.from('tournament_results').insert(toUpsert);
                if (upsRes.error) {
                    A.showToast(upsRes.error.message, 'error');
                    return;
                }
                await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));
            }

            // Update player form arrays (W/L from recent matches)
            var allPlayerIds = Object.keys(playerResults);
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);

                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });

                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            // Update tournament status
            var statusRes = await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            if (statusRes.error) {
                A.showToast(statusRes.error.message, 'error');
                return;
            }

            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize FIC tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Finalize Group Tournament ----
    async function finalizeGroupTournament(tournament, matches, playersMap) {
        try {
            var groupCount = tournament.group_count || 2;
            var qualifiers = tournament.qualifiers_per_group || 2;
            var season = new Date().getFullYear();

            // Load points rules
            var rulesMap = {};
            if (tournament.level_id) {
                var rulesRes = await A.client.from('points_rules').select('*').eq('level_id', tournament.level_id);
                (rulesRes.data || []).forEach(function(r) { rulesMap[r.round] = r.points; });
            }

            // Auto-fill G3-G6 if not set in rules (proportional to W)
            var wPts = rulesMap['W'] || 0;
            var groupFallback = { G3: 0.12, G4: 0.06, G5: 0.03, G6: 0.01 };
            ['G3', 'G4', 'G5', 'G6'].forEach(function(gk) {
                if (!rulesMap[gk] && wPts > 0) {
                    rulesMap[gk] = Math.round(wPts * groupFallback[gk]);
                }
            });

            var toUpsert = [];
            var plMatches = matches.filter(isPlayoffMatch);
            var hasPlayoff = plMatches.length > 0;

            if (hasPlayoff) {
                // --- Combined finalization: playoff places + group places for non-qualified ---
                var plDrawSize = 2;
                var plR1 = plMatches.filter(function(m) { return m.round_number === 1; });
                while (plDrawSize < plR1.length * 2) plDrawSize *= 2;
                var plTotalRounds = Math.log2(plDrawSize);

                var playerResults = {};

                // Final → W / F
                var finalMatch = plMatches.find(function(m) { return m.round_number === plTotalRounds && m.round !== '3RD'; });
                if (finalMatch && finalMatch.winner_id) {
                    playerResults[finalMatch.winner_id] = { round_reached: 'W', points_earned: rulesMap['W'] || 0 };
                    var finalist = finalMatch.winner_id === finalMatch.player1_id ? finalMatch.player2_id : finalMatch.player1_id;
                    if (finalist) playerResults[finalist] = { round_reached: 'F', points_earned: rulesMap['F'] || 0 };
                }

                // 3rd place match
                var thirdPM = plMatches.find(function(m) { return m.round === '3RD' && m.status === 'completed' && m.winner_id; });
                if (thirdPM) {
                    playerResults[thirdPM.winner_id] = { round_reached: '3RD', points_earned: rulesMap['3RD'] || rulesMap['SF'] || 0 };
                    var thirdLoserId = thirdPM.winner_id === thirdPM.player1_id ? thirdPM.player2_id : thirdPM.player1_id;
                    if (thirdLoserId) {
                        playerResults[thirdLoserId] = { round_reached: '4TH', points_earned: rulesMap['4TH'] || rulesMap['SF'] || 0 };
                    }
                }

                // Other playoff losers
                plMatches.forEach(function(m) {
                    if (m.status !== 'completed' || !m.winner_id || m.score === 'BYE' || m.round === '3RD') return;
                    var loserId = m.winner_id === m.player1_id ? m.player2_id : m.player1_id;
                    if (!loserId || playerResults[loserId]) return;
                    var roundKey = getRoundKey(m.round_number, plTotalRounds);
                    playerResults[loserId] = { round_reached: roundKey, points_earned: rulesMap[roundKey] || 0 };
                });

                // Add playoff results
                Object.keys(playerResults).forEach(function(pid) {
                    toUpsert.push({
                        tournament_id: tournament.id,
                        player_id: pid,
                        round_reached: playerResults[pid].round_reached,
                        points_earned: playerResults[pid].points_earned,
                        season: season,
                        category_id: tournament.category_id
                    });
                });

                // Collect qualified player IDs (in playoff)
                var qualifiedIds = {};
                plMatches.forEach(function(m) {
                    if (m.player1_id) qualifiedIds[m.player1_id] = true;
                    if (m.player2_id) qualifiedIds[m.player2_id] = true;
                });

                // Non-qualified group players → G3, G4, etc.
                var grpMatches = matches.filter(isGroupMatch);
                for (var g = 1; g <= groupCount; g++) {
                    var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                    var playerIds = [];
                    groupMatchesG.forEach(function(m) {
                        if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                        if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                    });
                    var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                    standings.sort(function(a, b) { return a.place - b.place; });

                    standings.forEach(function(st) {
                        if (qualifiedIds[st.playerId]) return; // already in playoff results
                        var roundKey = 'G' + st.place;
                        toUpsert.push({
                            tournament_id: tournament.id,
                            player_id: st.playerId,
                            round_reached: roundKey,
                            points_earned: rulesMap[roundKey] || 0,
                            season: season,
                            category_id: tournament.category_id
                        });
                    });
                }
            } else {
                // --- Pure group finalization (no playoff) ---
                var grpMatches = matches.filter(isGroupMatch);
                for (var g = 1; g <= groupCount; g++) {
                    var groupMatchesG = grpMatches.filter(function(m) { return m.group_number === g; });
                    var playerIds = [];
                    groupMatchesG.forEach(function(m) {
                        if (m.player1_id && playerIds.indexOf(m.player1_id) === -1) playerIds.push(m.player1_id);
                        if (m.player2_id && playerIds.indexOf(m.player2_id) === -1) playerIds.push(m.player2_id);
                    });
                    var standings = calculateGroupStandings(playerIds, groupMatchesG, playersMap);
                    standings.sort(function(a, b) { return a.place - b.place; });

                    standings.forEach(function(st) {
                        var roundKey = 'G' + st.place;
                        toUpsert.push({
                            tournament_id: tournament.id,
                            player_id: st.playerId,
                            round_reached: roundKey,
                            points_earned: rulesMap[roundKey] || 0,
                            season: season,
                            category_id: tournament.category_id
                        });
                    });
                }
            }

            if (toUpsert.length > 0) {
                await A.client.from('tournament_results').delete().eq('tournament_id', tournament.id);
                var insRes = await A.client.from('tournament_results').insert(toUpsert);
                if (insRes.error) {
                    A.showToast(insRes.error.message, 'error');
                    return;
                }
                await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));
            }

            // Update player form arrays
            var allPlayerIds = toUpsert.map(function(r) { return r.player_id; });
            for (var i = 0; i < allPlayerIds.length; i++) {
                var pid = allPlayerIds[i];
                try {
                    var recentRes = await A.client.from('matches')
                        .select('winner_id')
                        .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                        .eq('status', 'completed')
                        .neq('score', 'BYE')
                        .order('played_at', { ascending: false })
                        .limit(5);
                    var form = (recentRes.data || []).map(function(m) {
                        return m.winner_id === pid ? 'W' : 'L';
                    });
                    await A.client.from('players').update({ form: form }).eq('id', pid);
                } catch (formErr) {
                    console.error('Form update error for player ' + pid + ':', formErr);
                }
            }

            await A.client.from('tournaments').update({ status: 'completed' }).eq('id', tournament.id);
            A.showToast(L.tournamentFinalized, 'success');
        } catch (err) {
            console.error('Finalize group tournament error:', err);
            A.showToast((isEn ? 'Error: ' : 'Ошибка: ') + err.message, 'error');
        }
    }

    // ---- Hook: Add "Bracket" button to tournament list ----
    // Extend renderTournamentsList to add bracket management button


    // ---- Export to namespace ----
    A.renderBracketManagement = renderBracketManagement;

})();
