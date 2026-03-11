// ============================================
// KSLT Admin — Ratings Section
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var cachedLevels = A.cachedLevels = [];
    var cachedRules = {};
    var ROUND_KEYS = ['W', 'F', '3RD', '4TH', 'SF', 'QF', 'R16', 'R32', 'G3', 'G4', 'G5', 'G6'];
    var ROUND_LABELS = { W: L.ratW, F: L.ratF, '3RD': L.rat3RD, '4TH': L.rat4TH, SF: L.ratSF, QF: L.ratQF, R16: L.ratR16, R32: L.ratR32, G3: L.ratG3, G4: L.ratG4, G5: L.ratG5, G6: L.ratG6 };

    A.loadTournamentLevels = async function() {
        if (cachedLevels.length > 0) return;
        var res = await A.client.from('tournament_levels').select('*').order('sort_order');
        cachedLevels = res.data || [];
        A.cachedLevels = cachedLevels;
    };
    var loadTournamentLevels = A.loadTournamentLevels;

    async function loadPointsRules() {
        var res = await A.client.from('points_rules').select('*');
        cachedRules = {};
        (res.data || []).forEach(function(r) {
            if (!cachedRules[r.level_id]) cachedRules[r.level_id] = {};
            cachedRules[r.level_id][r.round] = { id: r.id, points: r.points };
        });
    }

    function renderRatingsSection() {
        var container = document.getElementById('ad-ratings');
        if (!container) return;
        var isAdm = A.currentRole === 'admin';

        var tabsHtml = '<button class="ad-rat-tab active" data-rattab="rankings">' + L.ratSubRankings + '</button>';
        var panelsHtml = '<div class="ad-rat-panel active" id="ratPanelRankings"></div>';

        if (isAdm) {
            tabsHtml +=
                '<button class="ad-rat-tab" data-rattab="results">' + L.ratSubResults + '</button>' +
                '<button class="ad-rat-tab" data-rattab="rules">' + L.ratSubRules + '</button>' +
                '<button class="ad-rat-tab" data-rattab="promotions">' + L.ratSubPromotions + '</button>';
            panelsHtml +=
                '<div class="ad-rat-panel" id="ratPanelResults"></div>' +
                '<div class="ad-rat-panel" id="ratPanelRules"></div>' +
                '<div class="ad-rat-panel" id="ratPanelPromotions"></div>';
        }

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.ratings + '</h2>' +
            '<div class="ad-rat-tabs">' + tabsHtml + '</div>' +
            panelsHtml;

        // Sub-tab switching
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-rat-tab');
            if (!tab) return;
            var key = tab.dataset.rattab;
            container.querySelectorAll('.ad-rat-tab').forEach(function(t) { t.classList.toggle('active', t === tab); });
            container.querySelectorAll('.ad-rat-panel').forEach(function(p) {
                p.classList.toggle('active', p.id === 'ratPanel' + key.charAt(0).toUpperCase() + key.slice(1));
            });
        });

        A.loadCategories().then(function() {
            loadTournamentLevels().then(function() {
                loadPointsRules().then(function() {
                    renderRatRankings();
                    if (isAdm) {
                        renderRatResults();
                        renderRatRules();
                        renderRatPromotions();
                    }
                });
            });
        });
    }

    // ---- Rankings Sub-tab ----
    var _ratSearchQuery = '';
    var _ratGenderFilter = '';
    var _ratCatFilter = '';
    var _ratPlayerMatches = {};

    function renderRatRankings() {
        var panel = document.getElementById('ratPanelRankings');
        if (!panel) return;

        // Gender dropdown
        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

        // Category dropdown with gender icons
        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
            var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '\u2640 ' : '\u2642 ');
            catOpts += '<option value="' + c.id + '">' + genderIcon + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-filter-row ad-filter-sticky" id="ratFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="ratSearch" placeholder="' + L.ratSearchPlayer + '">' +
                '<select class="ad-field-input ad-filter-select" id="ratGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="ratCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="ratRankingsBody"></div>';

        // Category filter change
        document.getElementById('ratCatFilter').addEventListener('change', function() {
            _ratCatFilter = this.value;
            loadRatRankings();
        });

        // Gender filter change
        document.getElementById('ratGenderFilter').addEventListener('change', function() {
            _ratGenderFilter = this.value;
            // Update category dropdown to show only matching categories
            var catSelect = document.getElementById('ratCatFilter');
            var newCatOpts = '<option value="">' + L.ratAllCategories + '</option>';
            A.cachedCategories.forEach(function(c) {
                if (_ratGenderFilter && c.gender !== _ratGenderFilter) return;
                var name = isEn ? (c.name_en || c.name) : c.name;
                var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
                var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '\u2640 ' : '\u2642 ');
                newCatOpts += '<option value="' + c.id + '">' + genderIcon + name + '</option>';
            });
            catSelect.innerHTML = newCatOpts;
            _ratCatFilter = '';
            loadRatRankings();
        });

        // Search with debounce
        var ratSearchTimer = null;
        document.getElementById('ratSearch').addEventListener('input', function() {
            var val = this.value.trim();
            clearTimeout(ratSearchTimer);
            ratSearchTimer = setTimeout(function() {
                _ratSearchQuery = val.toLowerCase();
                loadRatRankings();
            }, 300);
        });

        loadRatRankings();
    }

    async function loadRatRankings() {
        var body = document.getElementById('ratRankingsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        var query = A.client.from('players').select('*, categories(name, name_en, gender)').order('points', { ascending: false });
        if (_ratCatFilter) query = query.eq('category_id', _ratCatFilter);
        var res = await query;
        var players = res.data || [];

        // Gender filter (via category gender)
        if (_ratGenderFilter) {
            players = players.filter(function(p) {
                return p.categories && p.categories.gender === _ratGenderFilter;
            });
        }

        // Search filter (name RU + name EN)
        if (_ratSearchQuery) {
            players = players.filter(function(p) {
                var nameRu = (p.name || '').toLowerCase();
                var nameEn = (p.name_en || '').toLowerCase();
                return nameRu.indexOf(_ratSearchQuery) !== -1 || nameEn.indexOf(_ratSearchQuery) !== -1;
            });
        }

        if (players.length === 0) {
            body.innerHTML = '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
            return;
        }

        // Batch-load ALL matches for form badges + W/L calculation
        var playerIds = players.map(function(p) { return p.id; });
        _ratPlayerMatches = {};
        var _ratWL = {}; // { pid: { w: N, l: N } }
        try {
            var mRes = await A.client.from('matches')
                .select('*, tournaments(title, title_en)')
                .in('status', ['completed'])
                .neq('score', 'BYE')
                .order('played_at', { ascending: false });
            var allMatches = mRes.data || [];
            allMatches.forEach(function(m) {
                [m.player1_id, m.player2_id].forEach(function(pid) {
                    if (playerIds.indexOf(pid) === -1) return;
                    if (!_ratPlayerMatches[pid]) _ratPlayerMatches[pid] = [];
                    _ratPlayerMatches[pid].push(m);
                    if (!_ratWL[pid]) _ratWL[pid] = { w: 0, l: 0 };
                    if (m.winner_id === pid) _ratWL[pid].w++;
                    else _ratWL[pid].l++;
                });
            });
        } catch (e) { /* matches optional */ }

        // Build a name lookup for opponents
        var playerNameMap = {};
        players.forEach(function(p) { playerNameMap[p.id] = isEn ? (p.name_en || p.name) : p.name; });
        var playerEditBase = '#players/edit/';

        // Group by category
        var groups = {};
        players.forEach(function(p) {
            var catId = p.category_id || 'none';
            if (!groups[catId]) groups[catId] = [];
            groups[catId].push(p);
        });

        // Sort category keys by sort_order descending (Pro-Masters first)
        var sortedCatIds = Object.keys(groups).sort(function(a, b) {
            var orderA = A.categoriesMap[a] ? (A.categoriesMap[a].sort_order || 0) : 0;
            var orderB = A.categoriesMap[b] ? (A.categoriesMap[b].sort_order || 0) : 0;
            return orderB - orderA;
        });

        var html = '';
        sortedCatIds.forEach(function(catId) {
            var catPlayers = groups[catId];
            var catName = '';
            var catGenderIcon = '';
            if (catId !== 'none' && A.categoriesMap[catId]) {
                catName = isEn ? (A.categoriesMap[catId].name_en || A.categoriesMap[catId].name) : A.categoriesMap[catId].name;
                var cg = A.categoriesMap[catId].gender;
                catGenderIcon = cg === 'women' ? '\u2640 ' : (cg === 'men' ? '\u2642 ' : '');
            }

            if (!_ratCatFilter) {
                html += '<h3 class="ad-rat-cat-title">' + catGenderIcon + (catName || 'N/A') + '</h3>';
            }

            html += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
                '<th style="width:50px">' + L.ratRank + '</th>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th style="width:80px">' + L.ratPoints + '</th>' +
                '<th style="width:80px">' + L.ratWL + '</th>' +
                '<th style="width:100px">' + L.ratForm + '</th>' +
                '<th style="width:80px;text-align:center;">' + L.thChange + '</th>' +
            '</tr></thead><tbody>';

            catPlayers.forEach(function(p, i) {
                var pMatches = _ratPlayerMatches[p.id] || [];
                var wl = _ratWL[p.id] || { w: 0, l: 0 };
                // Fallback W/L to player fields if no matches
                if (pMatches.length === 0 && (p.wins || p.losses)) {
                    wl = { w: p.wins || 0, l: p.losses || 0 };
                }
                var formHtml = '';
                if (pMatches.length > 0) {
                    // Form from matches
                    pMatches.forEach(function(m, mi) {
                        var isWin = m.winner_id === p.id;
                        var f = isWin ? 'w' : 'l';
                        formHtml += '<span class="ad-rat-form-' + f + ' ad-rat-form-clickable" data-pid="' + p.id + '" data-midx="' + mi + '">' + f.toUpperCase() + '</span>';
                    });
                } else if (p.form && p.form.length > 0) {
                    // Fallback to stored form
                    p.form.forEach(function(f) {
                        formHtml += '<span class="ad-rat-form-' + f.toLowerCase() + '">' + f + '</span>';
                    });
                }
                var name = isEn ? (p.name_en || p.name) : p.name;

                var changeStr = p.rank_change > 0 ? '+' + p.rank_change : (p.rank_change < 0 ? String(p.rank_change) : '0');
                var changeClass = p.rank_change > 0 ? 'ad-change-up' : (p.rank_change < 0 ? 'ad-change-down' : '');

                html += '<tr>' +
                    '<td>' + (i + 1) + '</td>' +
                    '<td><a href="' + playerEditBase + p.id + '" class="ad-rat-player-link">' + A.esc(name) + '</a></td>' +
                    '<td><strong>' + (p.points || 0) + '</strong></td>' +
                    '<td>' + wl.w + '/' + wl.l + '</td>' +
                    '<td class="ad-rat-form-cell">' + formHtml + '</td>' +
                    '<td style="text-align:center;"><span class="' + changeClass + '">' + changeStr + '</span></td>' +
                '</tr>';
            });

            html += '</tbody></table></div></div>';
        });

        body.innerHTML = html;

        // Event delegation for clickable form badges (remove old, add new)
        body._ratClickHandler && body.removeEventListener('click', body._ratClickHandler);
        body._ratClickHandler = function(e) {
            var badge = e.target.closest('.ad-rat-form-clickable');
            if (!badge) return;
            var pid = badge.getAttribute('data-pid');
            var midx = parseInt(badge.getAttribute('data-midx'), 10);
            if (pid && !isNaN(midx)) {
                showFormMatchModal(pid, midx, playerNameMap);
            }
        };
        body.addEventListener('click', body._ratClickHandler);
    }

    function showFormMatchModal(pid, midx, playerNameMap) {
        var matches = _ratPlayerMatches[pid];
        if (!matches || !matches[midx]) return;
        var m = matches[midx];
        var isP1 = m.player1_id === pid;
        var oppId = isP1 ? m.player2_id : m.player1_id;
        var oppName = playerNameMap[oppId] || ('ID: ' + oppId);
        var isWin = m.winner_id === pid;
        var resultText = isWin ? L.ratWin : L.ratLoss;
        var resultColor = isWin ? '#4caf50' : '#f44336';
        var trnName = '';
        if (m.tournaments) {
            trnName = isEn ? (m.tournaments.title_en || m.tournaments.title) : m.tournaments.title;
        }
        var dateStr = m.played_at ? new Date(m.played_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU') : '—';

        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.ratMatchDetails + '</h3>' +
                    '<button class="ad-modal-close" id="ratMatchModalClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div style="display:flex;flex-direction:column;gap:12px;">' +
                        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">' + L.ratResult + '</span><span style="color:' + resultColor + ';font-weight:700;">' + resultText + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">' + L.ratOpponent + '</span><span>' + A.esc(oppName) + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">' + L.ratScore + '</span><span style="font-weight:600;">' + A.esc(m.score || '—') + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">' + L.ratTournament + '</span><span>' + A.esc(trnName || '—') + '</span></div>' +
                        '<div style="display:flex;justify-content:space-between;"><span style="color:var(--text-secondary)">' + L.ratDate + '</span><span>' + dateStr + '</span></div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);
        document.getElementById('ratMatchModalClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });
    }

    // ---- Tournament Results Sub-tab ----
    var _ratResAllTournaments = [];
    var _ratResGenderFilter = '';
    var _ratResCatFilter = '';
    var _ratResSearchQuery = '';

    function renderRatResults() {
        var panel = document.getElementById('ratPanelResults');
        if (!panel) return;

        // Gender dropdown
        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

        // Category dropdown with gender icons
        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
            var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '\u2640 ' : '\u2642 ');
            catOpts += '<option value="' + c.id + '">' + genderIcon + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-filter-row ad-filter-sticky" id="ratResFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="ratResSearch" placeholder="' + L.ratSearchTournament + '">' +
                '<select class="ad-field-input ad-filter-select" id="ratResGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="ratResCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="ratResTrnList"></div>' +
            '<div id="ratResultsBody"></div>';

        // Load completed tournaments
        loadCompletedTournaments();

        // Gender filter — also updates category dropdown
        document.getElementById('ratResGenderFilter').addEventListener('change', function() {
            _ratResGenderFilter = this.value;
            var catSelect = document.getElementById('ratResCatFilter');
            var newCatOpts = '<option value="">' + L.ratAllCategories + '</option>';
            A.cachedCategories.forEach(function(c) {
                if (_ratResGenderFilter && c.gender !== _ratResGenderFilter) return;
                var name = isEn ? (c.name_en || c.name) : c.name;
                var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
                var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '\u2640 ' : '\u2642 ');
                newCatOpts += '<option value="' + c.id + '">' + genderIcon + name + '</option>';
            });
            catSelect.innerHTML = newCatOpts;
            _ratResCatFilter = '';
            rebuildTrnList();
        });

        // Category filter
        document.getElementById('ratResCatFilter').addEventListener('change', function() {
            _ratResCatFilter = this.value;
            rebuildTrnList();
        });

        // Search with debounce
        var resSearchTimer = null;
        document.getElementById('ratResSearch').addEventListener('input', function() {
            var val = this.value.trim();
            clearTimeout(resSearchTimer);
            resSearchTimer = setTimeout(function() {
                _ratResSearchQuery = val.toLowerCase();
                rebuildTrnList();
            }, 300);
        });
    }

    function rebuildTrnList() {
        var container = document.getElementById('ratResTrnList');
        if (!container) return;

        var filtered = _ratResAllTournaments.filter(function(t) {
            if (_ratResCatFilter && t.category_id !== _ratResCatFilter) return false;
            if (_ratResGenderFilter && !_ratResCatFilter) {
                var catG = A.categoriesMap[t.category_id];
                if (!catG || catG.gender !== _ratResGenderFilter) return false;
            }
            if (_ratResSearchQuery) {
                var title = isEn ? (t.title_en || t.title) : t.title;
                if (title.toLowerCase().indexOf(_ratResSearchQuery) === -1) return false;
            }
            return true;
        });

        if (filtered.length === 0) {
            container.innerHTML = '<div class="ad-empty-state"><p>' + L.ratNoResults + '</p></div>';
            document.getElementById('ratResultsBody').innerHTML = '';
            return;
        }

        var html = '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
            '<th style="width:110px">' + L.trnDateStart + '</th>' +
            '<th>' + L.trnTitle + '</th>' +
            '<th style="width:120px">' + L.trnCategory + '</th>' +
        '</tr></thead><tbody>';

        filtered.forEach(function(t) {
            var title = isEn ? (t.title_en || t.title) : t.title;
            var date = t.date_start ? t.date_start.substring(0, 10) : '';
            var cat = A.categoriesMap[t.category_id];
            var catName = '';
            var genderIcon = '';
            if (cat) {
                catName = isEn ? (cat.name_en || cat.name) : cat.name;
                genderIcon = cat.gender === 'women' ? '\u2640 ' : (cat.gender === 'men' ? '\u2642 ' : '');
            }
            html += '<tr class="ad-rat-trn-row" data-trn-id="' + t.id + '" style="cursor:pointer;">' +
                '<td>' + date + '</td>' +
                '<td><span class="ad-rat-trn-link">' + genderIcon + A.esc(title) + '</span></td>' +
                '<td>' + A.esc(catName) + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div></div>';
        container.innerHTML = html;

        // Clear results when list rebuilds
        document.getElementById('ratResultsBody').innerHTML = '';

        // Event delegation — click on tournament row
        container._ratTrnClickHandler && container.removeEventListener('click', container._ratTrnClickHandler);
        container._ratTrnClickHandler = function(e) {
            var row = e.target.closest('.ad-rat-trn-row');
            if (!row) return;
            var trnId = row.getAttribute('data-trn-id');
            if (!trnId) return;
            // Highlight selected row
            container.querySelectorAll('.ad-rat-trn-row').forEach(function(r) { r.classList.remove('ad-rat-trn-active'); });
            row.classList.add('ad-rat-trn-active');
            loadTournamentResults(trnId);
        };
        container.addEventListener('click', container._ratTrnClickHandler);
    }

    async function loadCompletedTournaments() {
        var res = await A.client.from('tournaments').select('*').eq('status', 'completed').order('date_start', { ascending: false });
        _ratResAllTournaments = res.data || [];
        rebuildTrnList();
    }

    async function loadTournamentResults(tournamentId) {
        var body = document.getElementById('ratResultsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load existing results
        var res = await A.client.from('tournament_results').select('*, players(name, name_en)').eq('tournament_id', tournamentId);
        var results = res.data || [];

        // Load tournament info
        var trnRes = await A.client.from('tournaments').select('*, tournament_levels(name, name_en)').eq('id', tournamentId).single();
        var tournament = trnRes.data;

        // Load all players for dropdown
        var plrRes = await A.client.from('players').select('id, name, name_en, category_id').order('name');
        var allPlayers = plrRes.data || [];

        var levelName = '';
        if (tournament && tournament.tournament_levels) {
            levelName = isEn ? (tournament.tournament_levels.name_en || tournament.tournament_levels.name) : tournament.tournament_levels.name;
        }

        var levelHtml = levelName
            ? '<div class="ad-rat-level-badge">' + L.ratTournamentLevel + ': <strong>' + A.esc(levelName) + '</strong></div>'
            : '<div class="ad-rat-level-badge" style="color:#f44336;">' + L.ratTournamentLevel + ': ' + (isEn ? 'Not set! Edit tournament to assign level.' : 'Не задан! Отредактируйте турнир для назначения уровня.') + '</div>';

        // Player dropdown options
        var plrOpts = '<option value="">' + L.ratSelectPlayer + '</option>';
        allPlayers.forEach(function(p) {
            var name = isEn ? (p.name_en || p.name) : p.name;
            var cat = A.categoriesMap[p.category_id] ? (isEn ? A.categoriesMap[p.category_id].name_en : A.categoriesMap[p.category_id].name) : '';
            plrOpts += '<option value="' + p.id + '">' + A.esc(name) + (cat ? ' [' + cat + ']' : '') + '</option>';
        });

        // Round dropdown
        var roundOpts = '';
        ROUND_KEYS.forEach(function(r) {
            roundOpts += '<option value="' + r + '">' + ROUND_LABELS[r] + '</option>';
        });

        var html = levelHtml +
            '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table" id="ratResultsTable"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th style="width:160px">' + L.ratRound + '</th>' +
                '<th style="width:80px">' + L.ratPointsEarned + '</th>' +
                '<th style="width:50px"></th>' +
            '</tr></thead><tbody id="ratResultsTbody">';

        results.forEach(function(r) {
            var name = r.players ? (isEn ? (r.players.name_en || r.players.name) : r.players.name) : '?';
            html += renderResultRow(r.id, r.player_id, name, r.round_reached, r.points_earned, plrOpts, roundOpts, true);
        });

        html += '</tbody></table></div></div>' +
            '<div class="ad-rat-actions">' +
                '<button class="ad-btn ad-btn-secondary" id="ratAddResultBtn">' + L.ratAddResult + '</button>' +
                '<button class="ad-btn ad-btn-primary" id="ratSaveResultsBtn">' + L.ratSaveResults + '</button>' +
            '</div>';

        body.innerHTML = html;
        body.dataset.tournamentId = tournamentId;
        body.dataset.levelId = tournament ? (tournament.level_id || '') : '';

        // Add result row
        document.getElementById('ratAddResultBtn').addEventListener('click', function() {
            var tbody = document.getElementById('ratResultsTbody');
            var tr = document.createElement('tr');
            tr.innerHTML = renderResultRowInner('', '', '', 'W', 0, plrOpts, roundOpts, false);
            tbody.appendChild(tr);
            updateResultPoints(tr);
        });

        // Save results
        document.getElementById('ratSaveResultsBtn').addEventListener('click', function() {
            saveResults(tournamentId);
        });

        // Delegate round change → auto-calc points
        document.getElementById('ratResultsTable').addEventListener('change', function(e) {
            if (e.target.classList.contains('rat-round-select')) {
                updateResultPoints(e.target.closest('tr'));
            }
        });
    }

    function renderResultRow(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) {
        return '<tr data-result-id="' + (id || '') + '">' +
            renderResultRowInner(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) +
        '</tr>';
    }

    function renderResultRowInner(id, playerId, playerName, round, points, plrOpts, roundOpts, existing) {
        // Player cell: if existing show name, else show dropdown
        var playerCell = existing
            ? '<td>' + A.esc(playerName) + '<input type="hidden" class="rat-player-id" value="' + playerId + '"></td>'
            : '<td><select class="ad-field-select rat-player-select">' + plrOpts.replace('value="' + playerId + '"', 'value="' + playerId + '" selected') + '</select></td>';

        // Round dropdown
        var roundCell = '<td><select class="ad-field-select rat-round-select">';
        ROUND_KEYS.forEach(function(r) {
            roundCell += '<option value="' + r + '"' + (r === round ? ' selected' : '') + '>' + ROUND_LABELS[r] + '</option>';
        });
        roundCell += '</select></td>';

        // Points (auto-calculated, readonly)
        var pointsCell = '<td><span class="rat-points-display">' + (points || 0) + '</span></td>';

        // Delete button
        var deleteCell = '<td><button class="ad-btn-icon rat-delete-row" title="' + L.delete + '">&times;</button></td>';

        return playerCell + roundCell + pointsCell + deleteCell;
    }

    function updateResultPoints(tr) {
        if (!tr) return;
        var body = document.getElementById('ratResultsBody');
        var levelId = body ? body.dataset.levelId : '';
        var roundSel = tr.querySelector('.rat-round-select');
        var pointsSpan = tr.querySelector('.rat-points-display');
        if (!roundSel || !pointsSpan) return;

        var round = roundSel.value;
        var pts = 0;
        if (levelId && cachedRules[levelId] && cachedRules[levelId][round]) {
            pts = cachedRules[levelId][round].points;
        }
        pointsSpan.textContent = pts;
    }

    async function saveResults(tournamentId) {
        var tbody = document.getElementById('ratResultsTbody');
        if (!tbody) return;
        var rows = tbody.querySelectorAll('tr');
        var body = document.getElementById('ratResultsBody');
        var levelId = body ? body.dataset.levelId : '';
        var season = new Date().getFullYear();

        var toUpsert = [];
        var toDelete = [];

        rows.forEach(function(tr) {
            var existingId = tr.dataset.resultId;
            var playerInput = tr.querySelector('.rat-player-id') || tr.querySelector('.rat-player-select');
            var playerId = playerInput ? playerInput.value : '';
            var roundSel = tr.querySelector('.rat-round-select');
            var round = roundSel ? roundSel.value : 'W';

            if (!playerId) return;

            var pts = 0;
            if (levelId && cachedRules[levelId] && cachedRules[levelId][round]) {
                pts = cachedRules[levelId][round].points;
            }

            var record = {
                tournament_id: tournamentId,
                player_id: playerId,
                round_reached: round,
                points_earned: pts,
                season: season
            };
            if (existingId) record.id = existingId;

            toUpsert.push(record);
        });

        if (toUpsert.length === 0) {
            A.showToast(isEn ? 'No results to save' : 'Нет результатов для сохранения', 'error');
            return;
        }

        var res = await A.client.from('tournament_results').upsert(toUpsert, { onConflict: 'tournament_id,player_id' });
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }

        // Recalculate points for affected players
        await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));

        A.showToast(L.ratResultsSaved, 'success');
        loadTournamentResults(tournamentId);
    }

    async function recalcPlayerPoints(playerIds) {
        var unique = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        for (var i = 0; i < unique.length; i++) {
            var pid = unique[i];
            // Get all results for this player in current season
            var res = await A.client.from('tournament_results').select('points_earned').eq('player_id', pid);
            var total = 0;
            var wins = 0;
            var losses = 0;
            (res.data || []).forEach(function(r) {
                total += r.points_earned || 0;
                if (r.round_reached === 'W') wins++;
                else losses++;
            });

            await A.client.from('players').update({ points: total, wins: wins, losses: losses }).eq('id', pid);
        }
    }

    // ---- Points Rules Sub-tab ----
    function renderRatRules() {
        var panel = document.getElementById('ratPanelRules');
        if (!panel) return;

        var html = '';

        if (cachedLevels.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.ratNoLevels + '</p></div>';
        } else {
            html += '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table" id="ratRulesTable"><thead><tr>' +
                '<th>' + L.ratRound + '</th>';

            cachedLevels.forEach(function(lv) {
                var name = isEn ? (lv.name_en || lv.name) : lv.name;
                html += '<th style="text-align:center;"><span>' + A.esc(name) + '</span>' +
                    '<button class="ad-btn-icon rat-del-level" data-level-id="' + lv.id + '" title="' + L.ratDeleteLevel + '" style="margin-left:4px;font-size:12px;vertical-align:middle;">&times;</button></th>';
            });
            html += '</tr></thead><tbody>';

            ROUND_KEYS.forEach(function(round) {
                html += '<tr><td><strong>' + ROUND_LABELS[round] + '</strong></td>';
                cachedLevels.forEach(function(lv) {
                    var val = (cachedRules[lv.id] && cachedRules[lv.id][round]) ? cachedRules[lv.id][round].points : 0;
                    html += '<td style="text-align:center;"><input type="number" class="ad-field-input rat-rule-input" ' +
                        'data-level="' + lv.id + '" data-round="' + round + '" ' +
                        'value="' + val + '" min="0" style="width:70px;text-align:center;"></td>';
                });
                html += '</tr>';
            });

            html += '</tbody></table></div></div>';
        }

        html += '<div class="ad-rat-actions">' +
            '<button class="ad-btn ad-btn-secondary" id="ratAddLevelBtn">' + L.ratAddLevel + '</button>' +
            (cachedLevels.length > 0 ? '<button class="ad-btn ad-btn-primary" id="ratSaveRulesBtn">' + L.ratSaveRules + '</button>' : '') +
        '</div>';

        panel.innerHTML = html;

        // Save rules
        var saveBtn = document.getElementById('ratSaveRulesBtn');
        if (saveBtn) saveBtn.addEventListener('click', savePointsRules);

        // Add level
        document.getElementById('ratAddLevelBtn').addEventListener('click', showAddLevelModal);

        // Allow only digits in rule inputs
        panel.addEventListener('keydown', function(e) {
            if (!e.target.classList.contains('rat-rule-input')) return;
            if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });

        // Delete level (event delegation)
        panel.addEventListener('click', function(e) {
            var delBtn = e.target.closest('.rat-del-level');
            if (!delBtn) return;
            var levelId = delBtn.getAttribute('data-level-id');
            if (levelId && confirm(L.ratDeleteLevelConfirm)) {
                deleteLevel(levelId);
            }
        });
    }

    function showAddLevelModal() {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.ratAddLevel + '</h3>' +
                    '<button class="ad-modal-close" id="ratLevelModalClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-field" style="margin-bottom:12px;">' +
                        '<label class="ad-field-label">' + L.ratLevelName + '</label>' +
                        '<input type="text" class="ad-field-input" id="ratLevelNameInput" placeholder="' + L.ratLevelName + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-bottom:16px;">' +
                        '<label class="ad-field-label">' + L.ratLevelNameEn + '</label>' +
                        '<input type="text" class="ad-field-input" id="ratLevelNameEnInput" placeholder="' + L.ratLevelNameEn + '">' +
                    '</div>' +
                    '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
                        '<button class="ad-btn ad-btn-primary" id="ratLevelSaveBtn">' + L.save + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('ratLevelModalClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Auto-translate RU → EN on blur
        document.getElementById('ratLevelNameInput').addEventListener('blur', function() {
            var srcText = this.value.trim();
            var targetEl = document.getElementById('ratLevelNameEnInput');
            if (!srcText || targetEl.value.trim()) return;
            targetEl.placeholder = L.translating;
            A.translateFromRu(srcText, 'en').then(function(result) {
                if (!targetEl.value.trim()) targetEl.value = result;
                targetEl.placeholder = L.ratLevelNameEn;
            }).catch(function() {
                targetEl.placeholder = L.ratLevelNameEn;
            });
        });

        document.getElementById('ratLevelSaveBtn').addEventListener('click', async function() {
            var name = document.getElementById('ratLevelNameInput').value.trim();
            var nameEn = document.getElementById('ratLevelNameEnInput').value.trim();
            if (!name) return;
            var sortOrder = cachedLevels.length > 0 ? Math.max.apply(null, cachedLevels.map(function(l) { return l.sort_order || 0; })) + 1 : 1;
            var res = await A.client.from('tournament_levels').insert({ name: name, name_en: nameEn || name, sort_order: sortOrder });
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }
            A.showToast(L.ratLevelAdded, 'success');
            overlay.remove();
            cachedLevels = [];
            await loadTournamentLevels();
            renderRatRules();
        });
    }

    async function deleteLevel(levelId) {
        // Delete rules first, then level
        await A.client.from('points_rules').delete().eq('level_id', levelId);
        var res = await A.client.from('tournament_levels').delete().eq('id', levelId);
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }
        A.showToast(L.ratLevelDeleted, 'success');
        cachedLevels = [];
        await loadTournamentLevels();
        await loadPointsRules();
        renderRatRules();
    }

    async function savePointsRules() {
        var inputs = document.querySelectorAll('.rat-rule-input');
        var toUpsert = [];

        inputs.forEach(function(inp) {
            var levelId = inp.dataset.level;
            var round = inp.dataset.round;
            var pts = parseInt(inp.value, 10) || 0;

            var existing = (cachedRules[levelId] && cachedRules[levelId][round]) ? cachedRules[levelId][round].id : null;
            var record = { level_id: levelId, round: round, points: pts };
            if (existing) record.id = existing;
            toUpsert.push(record);
        });

        var res = await A.client.from('points_rules').upsert(toUpsert, { onConflict: 'level_id,round' });
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }

        A.showToast(L.ratRulesSaved, 'success');
        await loadPointsRules();
    }

    // ---- Promotions Sub-tab ----
    var _promoGenderFilter = '';
    var _promoCatFilter = '';

    function renderRatPromotions() {
        var panel = document.getElementById('ratPanelPromotions');
        if (!panel) return;

        // Gender dropdown
        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

        // Category dropdown (plain names, no gender icons)
        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-rat-info-banner">' + L.ratTop5Info + '</div>' +
            '<div class="ad-filter-row">' +
                '<select class="ad-field-input ad-filter-select" id="promoGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="promoCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="ratPromotionsBody"></div>';

        document.getElementById('promoGenderFilter').addEventListener('change', function() {
            _promoGenderFilter = this.value;
            // Update category dropdown to show only matching categories
            var catSelect = document.getElementById('promoCatFilter');
            var newCatOpts = '<option value="">' + L.ratAllCategories + '</option>';
            A.cachedCategories.forEach(function(c) {
                if (_promoGenderFilter && c.gender !== _promoGenderFilter) return;
                var name = isEn ? (c.name_en || c.name) : c.name;
                newCatOpts += '<option value="' + c.id + '">' + name + '</option>';
            });
            catSelect.innerHTML = newCatOpts;
            _promoCatFilter = '';
            loadPromotions();
        });

        document.getElementById('promoCatFilter').addEventListener('change', function() {
            _promoCatFilter = this.value;
            loadPromotions();
        });

        loadPromotions();
    }

    async function loadPromotions() {
        var body = document.getElementById('ratPromotionsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load current promotions
        var res = await A.client.from('player_promotions').select('*, players(name, name_en), from_cat:categories!player_promotions_from_category_id_fkey(name, name_en), to_cat:categories!player_promotions_to_category_id_fkey(name, name_en)').order('created_at', { ascending: false });
        var promotions = res.data || [];

        // Build a set of player IDs with active promotions (eligible/transition)
        var activePromotionMap = {};
        promotions.forEach(function(pr) {
            if (pr.status === 'eligible' || pr.status === 'transition') {
                activePromotionMap[pr.player_id] = pr.status;
            }
        });

        // Group categories by gender, sort by sort_order ascending (Tour→Pro-Masters)
        var catsByGender = {};
        A.cachedCategories.forEach(function(c) {
            var g = c.gender || 'other';
            if (!catsByGender[g]) catsByGender[g] = [];
            catsByGender[g].push(c);
        });
        Object.keys(catsByGender).forEach(function(g) {
            catsByGender[g].sort(function(a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
        });

        // Build eligible list
        var eligibleHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Eligible for Promotion' : 'Доступны для промоушена') + '</h3>';
        var hasEligible = false;

        var genders = Object.keys(catsByGender);
        for (var gi = 0; gi < genders.length; gi++) {
            // Gender filter
            if (_promoGenderFilter && genders[gi] !== _promoGenderFilter) continue;

            var genderCats = catsByGender[genders[gi]];
            var genderLabel = genders[gi] === 'men' ? (isEn ? 'Men' : 'Мужчины') : (isEn ? 'Women' : 'Женщины');

            for (var ci = 0; ci < genderCats.length - 1; ci++) {
                var cat = genderCats[ci];
                var nextCat = genderCats[ci + 1];

                // Category filter: show only pairs involving the selected category
                if (_promoCatFilter && cat.id !== _promoCatFilter) continue;

                var catName = isEn ? (cat.name_en || cat.name) : cat.name;
                var nextCatName = isEn ? (nextCat.name_en || nextCat.name) : nextCat.name;

                var plrRes = await A.client.from('players').select('id, name, name_en, points').eq('category_id', cat.id).order('points', { ascending: false }).limit(5);
                var top5 = plrRes.data || [];

                if (top5.length > 0) {
                    hasEligible = true;
                    eligibleHtml += '<div class="ad-table-card" style="margin-bottom:12px;">' +
                        '<div class="ad-table-card-title">' + genderLabel + ': ' + catName + ' → ' + nextCatName + '</div>' +
                        '<div class="ad-table-wrap"><table class="ad-table ad-promo-table"><thead><tr>' +
                        '<th style="width:40px">#</th><th>' + L.ratPlayer + '</th><th style="width:80px">' + L.ratPoints + '</th><th style="width:140px">' + L.ratActions + '</th>' +
                        '</tr></thead><tbody>';

                    top5.forEach(function(p, idx) {
                        var name = isEn ? (p.name_en || p.name) : p.name;
                        var actionCell;
                        if (activePromotionMap[p.id]) {
                            var st = activePromotionMap[p.id];
                            var stLabel = st === 'eligible' ? L.ratEligible : L.ratTransition;
                            actionCell = '<span class="ad-status-badge ad-status-' + st + '">' + stLabel + '</span>';
                        } else {
                            actionCell = '<button class="ad-btn ad-btn-sm ad-btn-primary promo-promote-btn" data-player-id="' + p.id + '" data-from-cat="' + cat.id + '" data-to-cat="' + nextCat.id + '">' + L.ratPromote + '</button>';
                        }
                        eligibleHtml += '<tr><td>' + (idx + 1) + '</td><td>' + A.esc(name) + '</td><td>' + (p.points || 0) + '</td><td>' + actionCell + '</td></tr>';
                    });
                    eligibleHtml += '</tbody></table></div></div>';
                }
            }
        }

        if (!hasEligible) {
            eligibleHtml += '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
        }

        // Existing promotions history
        var historyHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Promotion History' : 'История промоушенов') + '</h3>';

        // Filter history by selected gender/category
        var filteredPromotions = promotions;
        if (_promoGenderFilter || _promoCatFilter) {
            filteredPromotions = promotions.filter(function(pr) {
                if (_promoCatFilter) return pr.from_category_id === _promoCatFilter;
                // Gender filter: match from_category gender
                var fromCatObj = A.cachedCategories.find(function(c) { return c.id === pr.from_category_id; });
                return fromCatObj && fromCatObj.gender === _promoGenderFilter;
            });
        }

        if (filteredPromotions.length === 0) {
            historyHtml += '<div class="ad-empty-state"><p>' + L.ratNoPromotions + '</p></div>';
        } else {
            historyHtml += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table ad-promo-history"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th>' + L.ratFromCat + '</th>' +
                '<th>' + L.ratToCat + '</th>' +
                '<th style="width:70px">' + L.ratSeason + '</th>' +
                '<th style="width:100px">' + L.ratStatus + '</th>' +
                '<th style="width:200px">' + L.ratActions + '</th>' +
            '</tr></thead><tbody>';

            filteredPromotions.forEach(function(pr) {
                var name = pr.players ? (isEn ? (pr.players.name_en || pr.players.name) : pr.players.name) : '?';
                var fromCat = pr.from_cat ? (isEn ? (pr.from_cat.name_en || pr.from_cat.name) : pr.from_cat.name) : '?';
                var toCat = pr.to_cat ? (isEn ? (pr.to_cat.name_en || pr.to_cat.name) : pr.to_cat.name) : '?';
                var statusLabel = pr.status === 'eligible' ? L.ratEligible : pr.status === 'transition' ? L.ratTransition : L.ratCompleted;
                var statusClass = 'ad-status-badge ad-status-' + pr.status;

                var actionsHtml = '';
                if (pr.status === 'eligible') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-transition-btn" data-promo-id="' + pr.id + '">' + L.ratStartTransition + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else if (pr.status === 'transition') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-complete-btn" data-promo-id="' + pr.id + '">' + L.ratCompletePromotion + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else {
                    actionsHtml = '—';
                }

                historyHtml += '<tr>' +
                    '<td>' + A.esc(name) + '</td>' +
                    '<td>' + A.esc(fromCat) + '</td>' +
                    '<td>' + A.esc(toCat) + '</td>' +
                    '<td>' + pr.season + '</td>' +
                    '<td><span class="' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td>' + actionsHtml + '</td>' +
                '</tr>';
            });
            historyHtml += '</tbody></table></div></div>';
        }

        body.innerHTML = eligibleHtml + historyHtml;
    }

    async function createPromotion(playerId, fromCatId, toCatId) {
        var season = new Date().getFullYear();
        var res = await A.client.from('player_promotions').insert({
            player_id: playerId,
            from_category_id: fromCatId,
            to_category_id: toCatId,
            season: season,
            status: 'eligible',
            eligible_date: new Date().toISOString().slice(0, 10)
        });
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function updatePromotionStatus(promotionId, newStatus) {
        if (newStatus === 'transition') {
            var res = await A.client.from('player_promotions').update({ status: 'transition' }).eq('id', promotionId);
            if (res.error) { A.showToast(res.error.message, 'error'); return; }
        } else if (newStatus === 'completed') {
            // Load promotion to get player_id and to_category_id
            var prRes = await A.client.from('player_promotions').select('player_id, to_category_id').eq('id', promotionId).single();
            if (prRes.error) { A.showToast(prRes.error.message, 'error'); return; }
            var pr = prRes.data;
            // Update promotion status
            var upd = await A.client.from('player_promotions').update({
                status: 'completed',
                completed_date: new Date().toISOString().slice(0, 10)
            }).eq('id', promotionId);
            if (upd.error) { A.showToast(upd.error.message, 'error'); return; }
            // Move player to new category, reset stats
            var plrUpd = await A.client.from('players').update({
                category_id: pr.to_category_id,
                points: 0,
                wins: 0,
                losses: 0,
                form: [],
                rank_change: 0
            }).eq('id', pr.player_id);
            if (plrUpd.error) { A.showToast(plrUpd.error.message, 'error'); return; }
        }
        A.showToast(newStatus === 'completed' ? L.ratPromotionCompleted : L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function cancelPromotion(promotionId) {
        if (!confirm(L.ratConfirmCancel)) return;
        var res = await A.client.from('player_promotions').delete().eq('id', promotionId);
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromotionCancelled, 'success');
        await loadPromotions();
    }

    // Promotion action buttons (event delegation)
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.promo-promote-btn');
        if (btn) {
            createPromotion(btn.dataset.playerId, btn.dataset.fromCat, btn.dataset.toCat);
            return;
        }
        btn = e.target.closest('.promo-transition-btn');
        if (btn) {
            updatePromotionStatus(btn.dataset.promoId, 'transition');
            return;
        }
        btn = e.target.closest('.promo-complete-btn');
        if (btn) {
            if (confirm(L.ratConfirmComplete)) {
                updatePromotionStatus(btn.dataset.promoId, 'completed');
            }
            return;
        }
        btn = e.target.closest('.promo-cancel-btn');
        if (btn) {
            cancelPromotion(btn.dataset.promoId);
            return;
        }
    });

    // Delete result row (delegate)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rat-delete-row')) {
            var tr = e.target.closest('tr');
            if (tr) tr.remove();
        }
    });


    // ---- Export to namespace ----
    A.renderRatingsSection = renderRatingsSection;

})();
