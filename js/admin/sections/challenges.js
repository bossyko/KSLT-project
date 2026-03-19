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
    var subTab = 'accepted';
    var acceptedList = [];
    var publishedList = [];
    var allPlayers = [];
    var allCourts = [];

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
                '<button class="ad-rat-tab' + (subTab === 'accepted' ? ' active' : '') + '" data-subtab="accepted">' + L.chalAccepted + '</button>' +
                '<button class="ad-rat-tab' + (subTab === 'published' ? ' active' : '') + '" data-subtab="published">' + L.chalPublished + '</button>' +
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
            var tabs = document.querySelectorAll('#chalTabs .ad-rat-tab');
            tabs.forEach(function(t) { t.classList.toggle('active', t.dataset.subtab === subTab); });
            renderSubTab();
        });

        loadData();
    }

    function loadData() {
        Promise.all([
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue, battle_title, battle_published, battle_published_at, voting_closed, match_id, accepted_at')
                .eq('status', 'accepted')
                .eq('battle_published', false)
                .order('accepted_at', { ascending: false }),
            A.client.from('challenges')
                .select('id, challenger_player_id, opponent_player_id, status, proposed_date, proposed_time, proposed_venue, counter_date, counter_time, counter_venue, battle_title, battle_published, battle_published_at, voting_closed, match_id, accepted_at, battle_notified_at')
                .eq('battle_published', true)
                .order('battle_published_at', { ascending: false }),
            A.client.from('players').select('id, name, name_en, photo').order('name'),
            A.client.from('courts').select('id, name, name_en, street, street_en, district, district_en, city, city_en').order('name')
        ]).then(function(results) {
            acceptedList = results[0].data || [];
            publishedList = results[1].data || [];
            allPlayers = results[2].data || [];
            allCourts = results[3].data || [];

            var pMap = {};
            allPlayers.forEach(function(p) { pMap[p.id] = p; });
            A._chalPlayersMap = pMap;

            renderSubTab();
        });
    }

    function renderSubTab() {
        if (subTab === 'accepted') renderAccepted();
        else renderPublished();
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
            btn.addEventListener('click', function() {
                deleteBattle(btn.dataset.delete);
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

            var actions = '<div style="display:flex;gap:10px;align-items:center;width:100%;justify-content:space-between;">';
            if (c.status !== 'completed') {
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
                deleteBattle(btn.dataset.delete);
            });
        });
    }

    // ==== CREATE BATTLE MODAL ====
    function openCreateBattleModal() {
        var sel1 = { id: null, name: '' };
        var sel2 = { id: null, name: '' };
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
                    '</div>' +
                    // Player 2
                    '<div class="ad-field-group">' +
                        '<label class="ad-field-label">' + L.chalPlayer2 + '</label>' +
                        '<div style="position:relative;">' +
                            '<input type="text" class="ad-field-input" id="cbP2Input" placeholder="' + L.chalSearchPlayer + '" autocomplete="off">' +
                            '<div class="ad-dropdown-list" id="cbP2Dropdown" style="display:none;"></div>' +
                        '</div>' +
                        '<div id="cbP2Selected" class="ad-chal-selected-hint"></div>' +
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
                            '<input type="time" class="ad-field-input" id="cbTime">' +
                        '</div>' +
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

        // Player search setup
        setupPlayerSearch('cbP1Input', 'cbP1Dropdown', 'cbP1Selected', function(p) { sel1 = p; });
        setupPlayerSearch('cbP2Input', 'cbP2Dropdown', 'cbP2Selected', function(p) { sel2 = p; });

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
            var time = document.getElementById('cbTime').value;
            var courtName = document.getElementById('cbCourtInput').value.trim();
            var address = document.getElementById('cbAddress').value.trim();
            var venue = courtName + (address ? ', ' + address : '');

            if (!sel1.name || !sel2.name) {
                A.showToast(L.chalSelectPlayer, 'error');
                return;
            }
            if (!title) {
                document.getElementById('cbTitle').focus();
                return;
            }

            var btn = document.getElementById('cbSave');
            btn.disabled = true;
            btn.textContent = L.chalCreating;

            createBattle(sel1, sel2, title, date, time, venue, bannerUrl).then(function(ok) {
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
                        '+ ' + L.chalAddManual + ': <strong>' + A.esc(typed) + '</strong>' +
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
                                onSelect({ id: p.id, name: pName });
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
                        '+ ' + L.chalAddManual + ': <strong>' + A.esc(typed) + '</strong>' +
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
    function createBattle(p1, p2, title, date, time, venue, bannerUrl) {
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
                    status: 'accepted',
                    accepted_at: new Date().toISOString(),
                    battle_title: title,
                    battle_published: true,
                    battle_published_at: new Date().toISOString(),
                    voting_closed: false,
                    banner_url: bannerUrl || null
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
    function openScoreModal(challenge) {
        var pMap = A._chalPlayersMap || {};
        var p1 = pMap[challenge.challenger_player_id] || {};
        var p2 = pMap[challenge.opponent_player_id] || {};
        var p1Name = isEn ? (p1.name_en || p1.name || '?') : (p1.name || '?');
        var p2Name = isEn ? (p2.name_en || p2.name || '?') : (p2.name || '?');

        var visibleSets = 2;
        var sv = [['','','',''],['','','',''],['','','','']];

        function setRowHtml(setNum, vals) {
            var id1 = 'chS' + setNum + 'P1';
            var id2 = 'chS' + setNum + 'P2';
            var idTB1 = 'chS' + setNum + 'TB1';
            var idTB2 = 'chS' + setNum + 'TB2';
            return '<div class="ad-score-set-row" data-set="' + setNum + '" id="chSetRow' + setNum + '"' +
                (setNum > visibleSets ? ' style="display:none"' : '') + '>' +
                '<label class="ad-field-label" style="min-width:40px;">' + L.chalSet + ' ' + setNum + '</label>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id1 + '" value="' + vals[0] + '">' +
                '<span style="font-weight:600;">:</span>' +
                '<input type="text" inputmode="numeric" maxlength="1" class="ad-field-input ad-score-input ad-set-game" id="' + id2 + '" value="' + vals[1] + '">' +
                '<span class="ad-tb-wrap" id="' + idTB1 + 'Wrap" style="display:none;">' +
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
                '<div class="ad-modal-footer">' +
                    '<button class="ad-btn ad-btn-accent" id="chSaveScore">' + L.chalSave + '</button>' +
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
            tbWrap.style.display = (v1 === 7 && v2 === 6) || (v1 === 6 && v2 === 7) ? '' : 'none';
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

        document.getElementById('chSaveScore').addEventListener('click', function() {
            var sets = [];
            var p1Wins = 0, p2Wins = 0;
            for (var s = 1; s <= visibleSets; s++) {
                var g1 = (document.getElementById('chS' + s + 'P1') || {}).value || '';
                var g2 = (document.getElementById('chS' + s + 'P2') || {}).value || '';
                if (!g1 || !g2) { A.showToast('Fill all sets'); return; }
                var setStr = g1 + '/' + g2;
                var tb1 = (document.getElementById('chS' + s + 'TB1') || {}).value || '';
                var tb2 = (document.getElementById('chS' + s + 'TB2') || {}).value || '';
                if (tb1 && tb2) setStr += '(' + tb1 + '-' + tb2 + ')';
                sets.push(setStr);
                if (parseInt(g1) > parseInt(g2)) p1Wins++;
                else if (parseInt(g2) > parseInt(g1)) p2Wins++;
            }
            if (p1Wins === 0 && p2Wins === 0) { A.showToast('No winner determined'); return; }

            var winnerId = p1Wins > p2Wins ? challenge.challenger_player_id : challenge.opponent_player_id;
            var score = sets.join(' ');
            var btn = document.getElementById('chSaveScore');
            btn.disabled = true;

            saveScore(challenge, score, winnerId).then(function(ok) {
                if (ok) {
                    overlay.remove();
                    A.showToast(L.chalScoreSaved, 'success');
                    loadData();
                } else {
                    btn.disabled = false;
                }
            });
        });
    }

    function saveScore(challenge, score, winnerId) {
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
                    match_order: 0
                }).select('id').single();
            }).then(function(matchRes) {
                if (matchRes.error) {
                    console.error('Match insert error:', matchRes.error);
                    A.showToast('Error: ' + matchRes.error.message);
                    return false;
                }
                return A.client.from('challenges').update({
                    status: 'completed',
                    match_id: matchRes.data.id
                }).eq('id', challenge.id).then(function(updRes) {
                    return !updRes.error;
                });
            }).catch(function(err) {
                console.error('Save score error:', err);
                A.showToast('Error saving score');
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

    // ---- Delete Battle ----
    async function deleteBattle(challengeId) {
        var ok = await A.showConfirmAsync(L.chalDelete, L.chalConfirmDelete, L.chalDelete);
        if (!ok) return;

        try {
            // Delete predictions first (foreign key)
            await A.client.from('challenge_predictions').delete().eq('challenge_id', challengeId);
            // Delete challenge
            var res = await A.client.from('challenges').delete().eq('id', challengeId);
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }
            A.showToast(L.chalDeleted, 'success');
            loadData();
        } catch (e) {
            console.error('Delete battle error:', e);
            A.showToast('Error: ' + e.message, 'error');
        }
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
