// ============================================
// KSLT Admin — Players CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var plrEditingId = null;
    var plrImageFile = null;
    var plrImageUrl = '';
    var plrFilterCategory = '';

    // Script validation patterns
    var SCRIPT_RU = /^[а-яА-ЯёЁ\s\-'.]+$/;
    var SCRIPT_EN = /^[a-zA-Z\s\-'.]+$/;
    var SCRIPT_KG = /^[а-яА-ЯёЁңҢүҮөӨ\s\-'.]+$/;

    function attachScriptValidation(inputId, regex, hintText) {
        var el = document.getElementById(inputId);
        if (!el) return;
        var hint = document.createElement('div');
        hint.style.cssText = 'color:#ff4444;font-size:0.75rem;margin-top:2px;display:none;';
        hint.textContent = hintText;
        el.parentNode.appendChild(hint);
        el.addEventListener('input', function() {
            var v = el.value.trim();
            var bad = v.length > 0 && !regex.test(v);
            el.style.borderColor = bad ? '#ff4444' : '';
            hint.style.display = bad ? '' : 'none';
        });
    }

    function checkScript(value, regex) {
        return !value || regex.test(value);
    }
    var plrSearchQuery = '';

    // ---- Rating state (moved from ratings.js) ----
    var cachedLevels = [];
    var cachedRules = {};
    var ROUND_KEYS = ['W', 'F', '3RD', '4TH', 'SF', 'QF', 'R16', 'R32', 'G3', 'G4', 'G5', 'G6'];
    var ROUND_LABELS = { W: L.ratW, F: L.ratF, '3RD': L.rat3RD, '4TH': L.rat4TH, SF: L.ratSF, QF: L.ratQF, R16: L.ratR16, R32: L.ratR32, G3: L.ratG3, G4: L.ratG4, G5: L.ratG5, G6: L.ratG6 };

    A.loadTournamentLevels = async function() {
        if (cachedLevels.length > 0) return;
        var res = await A.client.from('tournament_levels').select('*').order('sort_order');
        cachedLevels = res.data || [];
        A.cachedLevels = cachedLevels;
    };

    async function loadPointsRules() {
        var res = await A.client.from('points_rules').select('*');
        cachedRules = {};
        (res.data || []).forEach(function(r) {
            if (!cachedRules[r.level_id]) cachedRules[r.level_id] = {};
            cachedRules[r.level_id][r.round] = { id: r.id, points: r.points };
        });
        A.cachedRules = cachedRules;
    }

    // ---- Rankings sub-tab state ----
    var _ratSearchQuery = '';
    var _ratGenderFilter = '';
    var _ratCatFilter = '';
    var _ratPlayerMatches = {};

    // ---- Results sub-tab state ----
    var _ratResAllTournaments = [];
    var _ratResGenderFilter = '';
    var _ratResCatFilter = '';
    var _ratResSearchQuery = '';

    async function renderPlayersSection() {
        await A.loadCategories();
        if (A.isDeepLinked('players')) return;

        var container = document.getElementById('ad-players');
        if (!container) return;

        var isAdm = A.currentRole === 'admin';

        // Build sub-tabs
        var tabsHtml =
            '<button class="ad-rat-tab active" data-plrtab="list">' + L.plrSubList + '</button>' +
            '<button class="ad-rat-tab" data-plrtab="rankings">' + L.plrSubRankings + '</button>';
        if (isAdm) {
            tabsHtml += '<button class="ad-rat-tab" data-plrtab="results">' + L.plrSubResults + '</button>';
        }

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.players + '</h2>' +
            '<div class="ad-rat-tabs">' + tabsHtml + '</div>' +
            '<div class="ad-rat-panel active" id="plrPanelList"></div>' +
            '<div class="ad-rat-panel" id="plrPanelRankings"></div>' +
            (isAdm ? '<div class="ad-rat-panel" id="plrPanelResults"></div>' : '');

        // Sub-tab switching
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-rat-tab');
            if (!tab || !tab.dataset.plrtab) return;
            var key = tab.dataset.plrtab;
            container.querySelectorAll('.ad-rat-tab').forEach(function(t) { t.classList.toggle('active', t === tab); });
            container.querySelectorAll('.ad-rat-panel').forEach(function(p) {
                var panelKey = p.id.replace('plrPanel', '').toLowerCase();
                p.classList.toggle('active', panelKey === key);
            });
        });

        // Render list panel
        renderPlayersList();

        // Load data for ranking/results panels
        A.loadTournamentLevels().then(function() {
            loadPointsRules().then(function() {
                renderRatRankings();
                if (isAdm) {
                    renderRatResults();
                }
            });
        });
    }

    // ---- Players List ----
    async function renderPlayersList() {
        var container = document.getElementById('plrPanelList');
        if (!container) container = document.getElementById('ad-players');
        if (!container) return;

        var catFilterHtml = '<option value="">' + L.plrAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            var selected = plrFilterCategory === c.id ? ' selected' : '';
            catFilterHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        var isAdm = A.currentRole === 'admin';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.players + '</h2>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adPlrAdd">+ ' + L.addPlayer + '</button>' : '') +
            '</div>' +
            '<div class="ad-filter-row">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adPlrSearch" placeholder="' + L.plrSearch + '" value="' + A.esc(plrSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adPlrCatFilter">' + catFilterHtml + '</select>' +
            '</div>' +
            '<div class="ad-table-card">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adPlrTable">' +
                        '<thead><tr>' +
                            '<th></th>' +
                            '<th>' + L.plrName + '</th>' +
                            '<th>' + L.plrCategory + '</th>' +
                            '<th>' + L.thPoints + '</th>' +
                            '<th>' + L.thWL + '</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="5" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        var plrAddBtn = document.getElementById('adPlrAdd');
        if (plrAddBtn) {
            plrAddBtn.addEventListener('click', function() {
                renderPlayerForm(null);
            });
        }

        var searchTimer = null;
        document.getElementById('adPlrSearch').addEventListener('input', function() {
            plrSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { loadPlayersList(); }, 300);
        });

        document.getElementById('adPlrCatFilter').addEventListener('change', function() {
            plrFilterCategory = this.value;
            loadPlayersList();
        });

        await loadPlayersList();
    }

    async function loadPlayersList() {
        if (!A.client) return;
        var isAdm = A.currentRole === 'admin';

        var query = A.client.from('players')
            .select('id,name,photo,country,category_id,points,wins,losses,rank_change,banned_until')
            .order('points', { ascending: false });

        if (plrFilterCategory) {
            query = query.eq('category_id', plrFilterCategory);
        }
        if (plrSearchQuery) {
            query = query.ilike('name', '%' + plrSearchQuery + '%');
        }

        var result = await query;

        var table = document.getElementById('adPlrTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');
        var items = result.data || [];

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📊</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noPlayers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noPlayersText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(p) {
            var thumbHtml = p.photo
                ? '<img src="' + A.esc(p.photo) + '" class="ad-table-thumb ad-table-thumb-round" alt="">'
                : '<div class="ad-table-thumb ad-table-thumb-round" style="background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">' + (p.country || '?') + '</div>';

            var catObj = A.categoriesMap[p.category_id];
            var catLabel = catObj ? (catObj.gender === 'women' ? '♀ ' : '♂ ') + (isEn ? catObj.name_en : catObj.name) : (p.category_id || L.noData);

            tbody.innerHTML +=
                '<tr data-plr-id="' + p.id + '"' + (isAdm ? ' style="cursor:pointer;"' : '') + '>' +
                    (isAdm ? A.bulkCheckboxTd(p.id) : '') +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (p.country || '') + ' ' + (p.name || L.noData) +
                        (p.banned_until && new Date(p.banned_until) > new Date() ? ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.7rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + L.plrBanned + '</span>' : '') +
                    '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.points || 0) + '</td>' +
                    '<td>' + (p.wins || 0) + '/' + (p.losses || 0) + '</td>' +
                '</tr>';
        });

        if (isAdm) {
            tbody.addEventListener('click', function(e) {
                if (e.target.closest('.ad-bulk-cell')) return;
                var row = e.target.closest('tr[data-plr-id]');
                if (!row) return;
                loadAndEditPlayer(row.dataset.plrId);
            });

            A.setupBulkDelete({ tableId: 'adPlrTable', tableName: 'players', reloadFn: loadPlayersList });
        }
    }

    async function loadAndEditPlayer(id) {
        if (!A.client) return;
        var result = await A.client.from('players').select('*').eq('id', id).single();
        if (result.data) {
            // Look up linked profile (gender, socials)
            var profRes = await A.client.from('profiles').select('gender, telegram_username, instagram').eq('player_id', id).single();
            if (profRes.data) {
                if (profRes.data.gender) result.data._gender = profRes.data.gender;
                result.data._telegram = profRes.data.telegram_username || '';
                result.data._instagram = profRes.data.instagram || '';
            }
            A.setAdminHash('players', 'edit', id);
            renderPlayerForm(result.data);
        }
    }

    // ---- Player Form ----
    function renderPlayerForm(item) {
        var container = document.getElementById('ad-players');
        if (!container) return;

        plrEditingId = item ? item.id : null;
        plrImageFile = null;
        plrImageUrl = (item && item.photo) ? item.photo : '';

        var title = item ? L.editPlayer : L.addPlayer;

        var imagePreviewHtml = plrImageUrl
            ? '<img src="' + A.esc(plrImageUrl) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:50%;">' +
              '<button type="button" class="ad-image-upload-remove" id="adPlrImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = plrImageUrl ? ' has-image' : '';

        // Category options (filtered by player gender if known)
        var plrGender = item ? item._gender : null; // 'male' or 'female' from linked profile
        var catGenderFilter = plrGender === 'male' ? 'men' : plrGender === 'female' ? 'women' : null;

        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        A.cachedCategories.forEach(function(c) {
            if (catGenderFilter && c.gender && c.gender !== catGenderFilter) return;
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var genderIcon = c.gender === 'women' ? '♀ ' : '♂ ';
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        // Badges section is now loaded dynamically from player_badges table

        // Form (W/L) — 5 toggle pairs
        var currentForm = (item && item.form) ? item.form : [];
        var formHtml = '';
        for (var i = 0; i < 5; i++) {
            var val = currentForm[i] || '';
            var wActive = val === 'W' ? ' active' : '';
            var lActive = val === 'L' ? ' active' : '';
            formHtml += '<div class="ad-form-toggle" data-index="' + i + '">' +
                '<button type="button" class="ad-form-btn-w' + wActive + '" data-val="W">W</button>' +
                '<button type="button" class="ad-form-btn-l' + lActive + '" data-val="L">L</button>' +
            '</div>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adPlrBack">' + L.back + '</button>' +
            '</div>' +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrPhoto + '</div>' +
                '<div class="ad-image-upload ad-image-upload-round' + hasImageClass + '" id="adPlrImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adPlrImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adPlrImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (plrImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adPlrImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Name (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrName + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrName" placeholder="' + L.plrName + ' (RU)" value="' + A.esc(item ? item.name : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrNameEn" placeholder="' + L.plrName + ' (EN)" value="' + A.esc(item ? item.name_en : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrName" data-target="adPlrNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrNameKg" placeholder="' + L.plrName + ' (KG)" value="' + A.esc(item ? item.name_kg : '') + '">' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrName" data-target="adPlrNameKg" data-tolang="kg">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Category + Country
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrCategory + '</label>' +
                        '<select class="ad-field-input" id="adPlrCat">' + catOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrCountry + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrCountry" placeholder="🇰🇬" value="' + A.esc(item ? item.country : '') + '" style="font-size:1.5rem;text-align:center;">' +
                    '</div>' +
                    '<div class="ad-field"></div>' +
                '</div>' +
            '</div>' +

            // Stats: Points, Wins, Losses, Rank Change
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.thPoints + '</div>' +
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPoints + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrPoints" min="0" value="' + (item ? (item.points || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrWins + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrWins" min="0" value="' + (item ? (item.wins || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrLosses + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrLosses" min="0" value="' + (item ? (item.losses || 0) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrRankChange + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrRankChange" value="' + (item ? (item.rank_change || 0) : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Form (W/L)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrForm + '</div>' +
                '<div class="ad-form-toggles" id="adPlrFormToggles">' + formHtml + '</div>' +
            '</div>' +

            // Last Matches (loaded from Supabase, edit only)
            (plrEditingId ? (
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrLastMatches + '</div>' +
                '<div id="adPlrMatchesContainer" style="color:var(--text-muted);font-size:0.85rem;">...</div>' +
            '</div>'
            ) : '') +

            // Badges (loaded from Supabase)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrBadges + '</div>' +
                '<div id="adPlrBadgesContainer" style="color:var(--text-muted);font-size:0.85rem;">...</div>' +
            '</div>' +

            // Bio (RU/EN)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrBio + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adPlrBio" placeholder="' + L.plrBio + ' (RU)">' + A.esc(item ? item.bio : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adPlrBioEn" placeholder="' + L.plrBio + ' (EN)">' + A.esc(item ? item.bio_en : '') + '</textarea>' +
                        '<button type="button" class="ad-btn-translate" data-src="adPlrBio" data-target="adPlrBioEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Contact: Phone, Email, Show Phone
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrPhone" placeholder="+996 ..." value="' + A.esc(item ? item.phone : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrEmail + '</label>' +
                        '<input type="email" class="ad-field-input" id="adPlrEmail" placeholder="email@example.com" value="' + A.esc(item ? item.email : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="display:flex;align-items:flex-end;padding-bottom:8px;">' +
                        '<label class="ad-checkbox-label"><input type="checkbox" id="adPlrShowPhone"' + (item && item.show_phone ? ' checked' : '') + '> ' + L.plrShowPhone + '</label>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Social Media (from linked profile, read-only, edit only)
            (plrEditingId ? (
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrSocials + '</div>' +
                '<div class="ad-field-row ad-field-row-2">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrTelegram + '</label>' +
                        '<div class="ad-field-input" style="background:rgba(255,255,255,0.03);cursor:default;opacity:0.85;">' +
                            (item._telegram ? '@' + A.esc(item._telegram) : '<span style="color:var(--text-dim);">\u2014</span>') +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrInstagram + '</label>' +
                        '<div class="ad-field-input" style="background:rgba(255,255,255,0.03);cursor:default;opacity:0.85;">' +
                            (item._instagram ? '@' + A.esc(item._instagram) : '<span style="color:var(--text-dim);">\u2014</span>') +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-hint" style="margin-top:4px;">' + (isEn ? 'Linked from user profile (read-only)' : 'Из профиля пользователя (только чтение)') + '</div>' +
            '</div>'
            ) : '') +

            // Rating History (edit only)
            (plrEditingId ? (
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.ratingHistory + '</div>' +
                '<div id="adPlrRhChartWrap" style="display:none;margin-bottom:16px;">' +
                    '<canvas id="adPlrRhChart" height="220"></canvas>' +
                '</div>' +
                '<div id="adPlrRhTable"></div>' +
                '<div style="margin-top:12px;display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap;">' +
                    '<div class="ad-field" style="flex:0 0 140px;">' +
                        '<label class="ad-field-label">' + L.rhDate + '</label>' +
                        '<input type="date" class="ad-field-input" id="adPlrRhDate">' +
                    '</div>' +
                    '<div class="ad-field" style="flex:1;min-width:160px;">' +
                        '<label class="ad-field-label">' + L.rhTournament + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrRhName" placeholder="' + L.rhTournament + '">' +
                    '</div>' +
                    '<div class="ad-field" style="flex:0 0 100px;">' +
                        '<label class="ad-field-label">' + L.rhPoints + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrRhPoints" min="0" placeholder="0">' +
                    '</div>' +
                    '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adPlrRhAdd">' + L.rhAdd + '</button>' +
                '</div>' +
            '</div>'
            ) : '') +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adPlrSave">' + L.save + '</button>' +
                (plrEditingId ? '<button class="ad-btn ad-btn-danger" id="adPlrDelete">' + L.delete + '</button>' : '') +
            '</div>' +

            // Ban moderation section (admin + manager, edit only)
            (plrEditingId ? (function() {
                var isPlayerBanned = item && item.banned_until && new Date(item.banned_until) > new Date();
                var banHtml = '<div style="margin-top:24px;padding-top:16px;border-top:1px solid rgba(255,255,255,0.06);">' +
                    '<h3 style="font-size:0.9rem;color:var(--accent);margin-bottom:12px;font-weight:600;">' + (isEn ? 'Moderation' : 'Модерация') + '</h3>';
                if (isPlayerBanned) {
                    var isPerm = new Date(item.banned_until).getFullYear() >= 2099;
                    var banDateStr = isPerm ? L.plrBannedForever : (L.plrBannedUntil + ' ' + new Date(item.banned_until).toLocaleDateString(isEn ? 'en-US' : 'ru-RU'));
                    var banReasonStr = item.ban_reason ? '<div style="color:var(--text-dim);font-size:0.8rem;margin-top:4px;">' + A.esc(item.ban_reason) + '</div>' : '';
                    banHtml += '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">' +
                        '<span style="display:inline-block;padding:4px 12px;border-radius:4px;font-size:0.8rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;">' + banDateStr + '</span>' +
                    '</div>' +
                    banReasonStr +
                    '<button class="ad-btn ad-btn-sm" id="adPlrUnban" style="margin-top:8px;background:rgba(52,199,89,0.15);color:#34c759;border:1px solid rgba(52,199,89,0.3);">' + L.plrUnbanPlayer + '</button>';
                } else {
                    banHtml += '<button class="ad-btn ad-btn-danger ad-btn-sm" id="adPlrBan">' + L.plrBanPlayer + '</button>';
                }
                banHtml += '</div>';
                return banHtml;
            })() : '');

        // --- Load Badges (edit only) ---
        if (plrEditingId) {
            loadPlayerBadgesAdmin(plrEditingId);
        }

        // --- Load Last Matches (edit only) ---
        if (plrEditingId) {
            loadPlayerMatchesAdmin(plrEditingId);
        }

        // --- Rating History Events (edit only) ---
        if (plrEditingId) {
            loadPlrRatingHistory(plrEditingId);

            // Fix: prevent date picker from closing due to document click handlers
            var rhDateInput = document.getElementById('adPlrRhDate');
            rhDateInput.addEventListener('mousedown', function(e) { e.stopPropagation(); });

            document.getElementById('adPlrRhAdd').addEventListener('click', async function() {
                var dateVal = document.getElementById('adPlrRhDate').value;
                var nameVal = document.getElementById('adPlrRhName').value.trim();
                var ptsVal = parseInt(document.getElementById('adPlrRhPoints').value) || 0;

                if (!dateVal || !nameVal) {
                    A.showToast(L.fillRequired || 'Fill required fields', 'error');
                    return;
                }

                if (!checkScript(nameVal, rhNameRegex)) {
                    A.showToast(rhNameHint, 'error');
                    return;
                }

                var res = await A.client.from('rating_history').insert({
                    player_id: plrEditingId,
                    tournament_name: nameVal,
                    points_earned: ptsVal,
                    recorded_at: dateVal
                });

                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    return;
                }

                document.getElementById('adPlrRhDate').value = '';
                document.getElementById('adPlrRhName').value = '';
                document.getElementById('adPlrRhPoints').value = '';
                loadPlrRatingHistory(plrEditingId);
                await recalcPointsFromHistory(plrEditingId);
            });
        }

        // --- Script validation on name fields ---
        attachScriptValidation('adPlrName', SCRIPT_RU, 'Только кириллица');
        attachScriptValidation('adPlrNameEn', SCRIPT_EN, 'Latin characters only');
        attachScriptValidation('adPlrNameKg', SCRIPT_KG, 'Кыргыз тамгалары гана');
        var rhNameHint = isEn ? 'Latin characters only' : 'Только кириллица';
        var rhNameRegex = isEn ? SCRIPT_EN : SCRIPT_RU;
        attachScriptValidation('adPlrRhName', rhNameRegex, rhNameHint);

        // --- Event Listeners ---

        // Back
        document.getElementById('adPlrBack').addEventListener('click', function() {
            A.setAdminHash('players');
            renderPlayersSection();
        });

        // Lang tabs (delegate)
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });
        });

        // Translate buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate');
            if (!btn) return;
            var srcId = btn.dataset.src;
            var targetId = btn.dataset.target;
            var toLang = btn.dataset.tolang;
            var srcEl = document.getElementById(srcId);
            var targetEl = document.getElementById(targetId);
            if (!srcEl || !targetEl) return;

            var srcText = srcEl.value.trim();
            if (!srcText) {
                A.showToast(L.fillRuFirst, 'error');
                return;
            }

            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;

            A.translateFromRu(srcText, toLang).then(function(result) {
                targetEl.value = result;
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                A.showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Form toggles (W/L)
        document.getElementById('adPlrFormToggles').addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-form-btn-w, .ad-form-btn-l');
            if (!btn) return;
            var toggle = btn.closest('.ad-form-toggle');
            toggle.querySelectorAll('button').forEach(function(b) { b.classList.remove('active'); });
            btn.classList.add('active');
        });

        // Image upload
        var imgZone = document.getElementById('adPlrImgZone');
        var imgInput = document.getElementById('adPlrImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                plrImageFile = imgInput.files[0];
                previewPlrImage(URL.createObjectURL(plrImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                plrImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewPlrImage(URL.createObjectURL(plrImageFile));
            }
        });

        setupPlrImgRemove();

        document.getElementById('adPlrImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adPlrImgUrl').value.trim();
            if (url) {
                plrImageFile = null;
                plrImageUrl = url;
                previewPlrImage(url);
            }
        });

        // Save
        document.getElementById('adPlrSave').addEventListener('click', savePlayerHandler);

        // Delete
        var delBtn = document.getElementById('adPlrDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                A.showConfirm(L.plrDeleteConfirm, L.deleteConfirmText, function() {
                    deletePlayerHandler();
                });
            });
        }

        // Ban button
        var banBtn = document.getElementById('adPlrBan');
        if (banBtn) {
            banBtn.addEventListener('click', function() {
                openPlayerBanModal(plrEditingId);
            });
        }

        // Unban button
        var unbanBtn = document.getElementById('adPlrUnban');
        if (unbanBtn) {
            unbanBtn.addEventListener('click', function() {
                unbanPlayerHandler(plrEditingId);
            });
        }
    }

    function previewPlrImage(src) {
        var zone = document.getElementById('adPlrImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:50%;">' +
            '<button type="button" class="ad-image-upload-remove" id="adPlrImgRemove">&times;</button>';
        setupPlrImgRemove();
    }

    function setupPlrImgRemove() {
        var rmBtn = document.getElementById('adPlrImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                plrImageFile = null;
                plrImageUrl = '';
                var zone = document.getElementById('adPlrImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adPlrImgUrl').value = '';
                document.getElementById('adPlrImgInput').value = '';
            });
        }
    }

    // ---- Save Player ----
    async function savePlayerHandler() {
        var saveBtn = document.getElementById('adPlrSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            var imageUrl = plrImageUrl;
            if (plrImageFile) {
                imageUrl = await A.uploadImage(plrImageFile, 'plr-');
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Collect form (W/L)
            var formArr = [];
            document.querySelectorAll('.ad-form-toggle').forEach(function(toggle) {
                var active = toggle.querySelector('button.active');
                if (active) formArr.push(active.dataset.val);
            });

            var name = document.getElementById('adPlrName').value.trim();
            var nameEn = document.getElementById('adPlrNameEn').value.trim() || null;
            var nameKg = document.getElementById('adPlrNameKg').value.trim() || null;

            // Script validation
            if (name && !checkScript(name, SCRIPT_RU)) {
                A.showToast(isEn ? 'RU name must use Cyrillic' : 'Имя (RU) должно быть на кириллице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (nameEn && !checkScript(nameEn, SCRIPT_EN)) {
                A.showToast(isEn ? 'EN name must use Latin' : 'Имя (EN) должно быть на латинице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (nameKg && !checkScript(nameKg, SCRIPT_KG)) {
                A.showToast(isEn ? 'KG name must use Kyrgyz script' : 'Имя (KG) должно быть на кыргызском', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }

            var data = {
                name: name,
                name_en: nameEn,
                name_kg: nameKg,
                photo: imageUrl || null,
                country: document.getElementById('adPlrCountry').value.trim() || null,
                category_id: document.getElementById('adPlrCat').value || null,
                points: parseInt(document.getElementById('adPlrPoints').value, 10) || 0,
                wins: parseInt(document.getElementById('adPlrWins').value, 10) || 0,
                losses: parseInt(document.getElementById('adPlrLosses').value, 10) || 0,
                rank_change: parseInt(document.getElementById('adPlrRankChange').value, 10) || 0,
                form: formArr,
                bio: document.getElementById('adPlrBio').value.trim() || null,
                bio_en: document.getElementById('adPlrBioEn').value.trim() || null,
                phone: document.getElementById('adPlrPhone').value.trim() || null,
                email: document.getElementById('adPlrEmail').value.trim() || null,
                show_phone: document.getElementById('adPlrShowPhone').checked
            };

            if (!data.name) {
                A.showToast(isEn ? 'Name is required' : 'Имя обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (plrEditingId) {
                result = await A.client.from('players').update(data).eq('id', plrEditingId);
            } else {
                data.id = A.slugify(name);
                result = await A.client.from('players').insert(data);
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            A.showToast(L.saved, 'success');
            if (plrEditingId) {
                // Stay on edit form — re-load fresh data
                var fresh = await A.client.from('players').select('*').eq('id', plrEditingId).single();
                if (fresh.data) {
                    var profRes = await A.client.from('profiles').select('gender, telegram_username, instagram').eq('player_id', plrEditingId).single();
                    if (profRes.data) {
                        if (profRes.data.gender) fresh.data._gender = profRes.data.gender;
                        fresh.data._telegram = profRes.data.telegram_username || '';
                        fresh.data._instagram = profRes.data.instagram || '';
                    }
                    renderPlayerForm(fresh.data);
                }
            } else {
                renderPlayersSection();
            }
        } catch (e) {
            A.showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Player ----
    async function deletePlayerHandler() {
        if (!plrEditingId) return;
        var result = await A.client.from('players').delete().eq('id', plrEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderPlayersSection();
    }

    // ---- Player Ban Modal ----
    function openPlayerBanModal(playerId) {
        var overlay = document.createElement('div');
        overlay.className = 'ad-confirm-overlay';
        overlay.innerHTML =
            '<div class="ad-confirm-modal" style="max-width:440px;">' +
                '<div class="ad-confirm-title">' + L.plrBanConfirm + '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.plrBanDuration + '</label>' +
                    '<select class="ad-field-input" id="adPlrBanDuration">' +
                        '<option value="7d">' + L.plrBan7d + '</option>' +
                        '<option value="30d">' + L.plrBan30d + '</option>' +
                        '<option value="90d">' + L.plrBan90d + '</option>' +
                        '<option value="1y">' + L.plrBan1y + '</option>' +
                        '<option value="permanent">' + L.plrBanPermanent + '</option>' +
                        '<option value="custom">' + L.plrBanCustom + '</option>' +
                    '</select>' +
                '</div>' +
                '<div style="margin-bottom:16px;display:none;" id="adPlrBanCustomWrap">' +
                    '<label class="ad-field-label">' + (isEn ? 'Date' : 'Дата') + '</label>' +
                    '<input type="date" class="ad-field-input" id="adPlrBanCustomDate">' +
                '</div>' +
                '<div style="margin-bottom:16px;">' +
                    '<label class="ad-field-label">' + L.plrBanReason + '</label>' +
                    '<textarea class="ad-field-input" id="adPlrBanReason" rows="2" style="resize:vertical;"></textarea>' +
                '</div>' +
                '<div class="ad-confirm-actions">' +
                    '<button class="ad-btn ad-btn-secondary" id="adPlrBanCancel">' + L.cancel + '</button>' +
                    '<button class="ad-btn ad-btn-danger" id="adPlrBanSubmit">' + L.plrBanPlayer + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // Show/hide custom date
        document.getElementById('adPlrBanDuration').addEventListener('change', function() {
            document.getElementById('adPlrBanCustomWrap').style.display = this.value === 'custom' ? '' : 'none';
        });

        document.getElementById('adPlrBanCancel').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        document.getElementById('adPlrBanSubmit').addEventListener('click', async function() {
            var duration = document.getElementById('adPlrBanDuration').value;
            var reason = document.getElementById('adPlrBanReason').value.trim();

            var bannedUntil;
            if (duration === 'permanent') {
                bannedUntil = '2099-12-31T23:59:59.000Z';
            } else if (duration === 'custom') {
                var customDate = document.getElementById('adPlrBanCustomDate').value;
                if (!customDate) {
                    A.showToast(isEn ? 'Select a date' : 'Выберите дату', 'error');
                    return;
                }
                bannedUntil = new Date(customDate + 'T23:59:59').toISOString();
            } else {
                var daysMap = { '7d': 7, '30d': 30, '90d': 90, '1y': 365 };
                var dt = new Date();
                dt.setDate(dt.getDate() + (daysMap[duration] || 7));
                bannedUntil = dt.toISOString();
            }

            var btn = document.getElementById('adPlrBanSubmit');
            btn.textContent = L.saving;
            btn.disabled = true;

            // 1. Direct DB update (works via RLS)
            var result = await A.client.from('players').update({
                banned_until: bannedUntil,
                ban_reason: reason || null
            }).eq('id', playerId);

            if (result.error) {
                A.showToast(result.error.message, 'error');
                btn.textContent = L.plrBanPlayer;
                btn.disabled = false;
                return;
            }

            overlay.remove();
            A.showToast(L.plrBanSuccess, 'success');
            loadAndEditPlayer(playerId);

            // 2. TG notification (best-effort, non-blocking)
            try {
                var session = await A.client.auth.getSession();
                var token = session.data && session.data.session ? session.data.session.access_token : null;
                if (token) {
                    fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token,
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({
                            action: 'ban_player',
                            player_id: playerId,
                            banned_until: bannedUntil,
                            reason: reason || undefined
                        })
                    }).catch(function() {});
                }
            } catch (e) { /* TG notification is best-effort */ }
        });
    }

    async function unbanPlayerHandler(playerId) {
        A.showConfirm(L.plrUnbanPlayer, L.plrUnbanConfirm, async function() {
            // 1. Direct DB update
            var result = await A.client.from('players').update({
                banned_until: null,
                ban_reason: null
            }).eq('id', playerId);

            if (result.error) {
                A.showToast(result.error.message, 'error');
                return;
            }

            A.showToast(L.plrUnbanSuccess, 'success');
            loadAndEditPlayer(playerId);

            // 2. TG notification (best-effort, non-blocking)
            try {
                var session = await A.client.auth.getSession();
                var token = session.data && session.data.session ? session.data.session.access_token : null;
                if (token) {
                    fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': 'Bearer ' + token,
                            'apikey': SUPABASE_ANON_KEY
                        },
                        body: JSON.stringify({
                            action: 'unban_player',
                            player_id: playerId
                        })
                    }).catch(function() {});
                }
            } catch (e) { /* TG notification is best-effort */ }
        });
    }

    // ---- Last Matches (read-only, from matches table) ----
    async function loadPlayerMatchesAdmin(playerId) {
        var container = document.getElementById('adPlrMatchesContainer');
        if (!container || !A.client) return;

        var res = await A.client.from('matches')
            .select('id, player1_id, player2_id, score, winner_id, round, played_at, created_at, tournament:tournaments(title, title_en)')
            .or('player1_id.eq.' + playerId + ',player2_id.eq.' + playerId)
            .not('winner_id', 'is', null)
            .order('played_at', { ascending: false })
            .limit(10);

        if (res.error || !res.data || res.data.length === 0) {
            container.innerHTML = '<div style="color:var(--text-dim);padding:8px 0;">' + L.plrNoMatches + '</div>';
            return;
        }

        // Collect unique opponent IDs
        var oppIds = [];
        res.data.forEach(function(m) {
            var oppId = m.player1_id === playerId ? m.player2_id : m.player1_id;
            if (oppId && oppIds.indexOf(oppId) === -1) oppIds.push(oppId);
        });

        // Load opponent names
        var oppMap = {};
        if (oppIds.length > 0) {
            var oppRes = await A.client.from('players').select('id, name, name_en, photo').in('id', oppIds);
            if (oppRes.data) {
                oppRes.data.forEach(function(p) { oppMap[p.id] = p; });
            }
        }

        // Render matches table
        var html = '<table style="width:100%;border-collapse:collapse;font-size:0.82rem;">' +
            '<thead><tr style="border-bottom:1px solid rgba(255,255,255,0.08);color:var(--text-dim);font-size:0.75rem;">' +
                '<th style="text-align:left;padding:6px 8px;">' + (isEn ? 'Date' : 'Дата') + '</th>' +
                '<th style="text-align:left;padding:6px 8px;">' + (isEn ? 'Opponent' : 'Соперник') + '</th>' +
                '<th style="text-align:center;padding:6px 8px;">' + (isEn ? 'Score' : 'Счёт') + '</th>' +
                '<th style="text-align:center;padding:6px 8px;">' + (isEn ? 'Result' : 'Итог') + '</th>' +
                '<th style="text-align:left;padding:6px 8px;">' + (isEn ? 'Tournament' : 'Турнир') + '</th>' +
            '</tr></thead><tbody>';

        res.data.forEach(function(m) {
            var isP1 = m.player1_id === playerId;
            var oppId = isP1 ? m.player2_id : m.player1_id;
            var opp = oppMap[oppId] || { name: '?', name_en: '?' };
            var oppName = isEn ? (opp.name_en || opp.name) : opp.name;
            var isWin = m.winner_id === playerId;
            var resultBadge = isWin
                ? '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-weight:600;font-size:0.75rem;background:rgba(52,199,89,0.15);color:#34c759;">W</span>'
                : '<span style="display:inline-block;padding:2px 8px;border-radius:3px;font-weight:600;font-size:0.75rem;background:rgba(255,59,48,0.15);color:#ff3b30;">L</span>';

            // Format score (flip if player is p2 so their sets come first)
            var score = m.score || '';
            if (!isP1 && score) {
                score = score.split(',').map(function(s) {
                    var parts = s.trim().split(':');
                    return parts.length === 2 ? parts[1] + ':' + parts[0] : s;
                }).join(', ');
            }

            var dateStr = m.played_at
                ? new Date(m.played_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' })
                : (m.created_at ? new Date(m.created_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '\u2014');

            var trnName = '';
            if (m.tournament) {
                trnName = isEn ? (m.tournament.title_en || m.tournament.title || '') : (m.tournament.title || '');
            }

            var roundLabel = m.round || '';
            if (roundLabel) {
                var roundMap = { 'final': 'F', 'semifinal': 'SF', 'quarterfinal': 'QF', 'group': 'GS' };
                roundLabel = roundMap[roundLabel] || roundLabel;
            }

            html += '<tr style="border-bottom:1px solid rgba(255,255,255,0.04);">' +
                '<td style="padding:6px 8px;white-space:nowrap;">' + dateStr + '</td>' +
                '<td style="padding:6px 8px;">' +
                    '<div style="display:flex;align-items:center;gap:6px;">' +
                        (opp.photo ? '<img src="' + A.esc(opp.photo) + '" style="width:24px;height:24px;border-radius:50%;object-fit:cover;">' : '') +
                        '<span>' + A.esc(oppName) + '</span>' +
                    '</div>' +
                '</td>' +
                '<td style="padding:6px 8px;text-align:center;font-family:monospace;">' + A.esc(score) + '</td>' +
                '<td style="padding:6px 8px;text-align:center;">' + resultBadge + '</td>' +
                '<td style="padding:6px 8px;font-size:0.75rem;color:var(--text-dim);">' +
                    A.esc(trnName) + (roundLabel ? ' <span style="opacity:0.6;">(' + A.esc(roundLabel) + ')</span>' : '') +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table>';
        container.innerHTML = html;
    }

    // ---- Rating History helpers ----
    var plrRhChart = null;

    async function loadPlrRatingHistory(playerId) {
        var res = await A.client.from('rating_history')
            .select('*')
            .eq('player_id', playerId)
            .order('recorded_at', { ascending: true });

        var data = res.data || [];
        renderPlrRhTable(data, playerId);
        renderPlrRhChart(data);
    }

    function renderPlrRhTable(data, playerId) {
        var tableEl = document.getElementById('adPlrRhTable');
        if (!tableEl) return;

        if (data.length === 0) {
            tableEl.innerHTML = '<div style="color:var(--text-muted);font-size:0.85rem;">' + L.rhNoData + '</div>';
            return;
        }

        var html = '<div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table"><thead><tr>' +
            '<th>' + L.rhDate + '</th>' +
            '<th>' + L.rhTournament + '</th>' +
            '<th style="text-align:center;">' + L.rhPoints + '</th>' +
            '<th style="width:40px;"></th>' +
            '</tr></thead><tbody>';

        // Show newest first in table
        var reversed = data.slice().reverse();
        reversed.forEach(function(row) {
            html += '<tr>' +
                '<td>' + row.recorded_at + '</td>' +
                '<td>' + A.esc(row.tournament_name) + '</td>' +
                '<td style="text-align:center;color:var(--accent);font-weight:600;">' + row.points_earned + '</td>' +
                '<td><button class="ad-btn-icon ad-rh-del" data-rh-id="' + row.id + '" title="' + L.delete + '">&times;</button></td>' +
                '</tr>';
        });

        html += '</tbody></table></div>';
        tableEl.innerHTML = html;

        // Delete handlers
        tableEl.querySelectorAll('.ad-rh-del').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var rhId = btn.dataset.rhId;
                await A.client.from('rating_history').delete().eq('id', rhId);
                loadPlrRatingHistory(playerId);
                await recalcPointsFromHistory(playerId);
            });
        });
    }

    async function recalcPointsFromHistory(playerId) {
        var currentYear = new Date().getFullYear();
        var res = await A.client.from('rating_history')
            .select('points_earned')
            .eq('player_id', playerId)
            .gte('recorded_at', currentYear + '-01-01')
            .lte('recorded_at', currentYear + '-12-31');

        var total = 0;
        (res.data || []).forEach(function(r) { total += r.points_earned || 0; });

        await A.client.from('players').update({ points: total }).eq('id', playerId);

        // Update the form field if visible
        var ptsField = document.getElementById('adPlrPoints');
        if (ptsField) ptsField.value = total;
    }

    function renderPlrRhChart(data) {
        var wrapEl = document.getElementById('adPlrRhChartWrap');
        var canvasEl = document.getElementById('adPlrRhChart');
        if (!wrapEl || !canvasEl) return;

        if (data.length === 0 || typeof Chart === 'undefined') {
            wrapEl.style.display = 'none';
            return;
        }

        wrapEl.style.display = '';

        var labels = [];
        var values = [];
        var cumulative = 0;
        var tooltipNames = [];

        data.forEach(function(row) {
            cumulative += row.points_earned;
            labels.push(row.recorded_at);
            values.push(cumulative);
            tooltipNames.push(row.tournament_name + ' (+' + row.points_earned + ')');
        });

        if (plrRhChart) {
            plrRhChart.destroy();
        }

        plrRhChart = new Chart(canvasEl, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: L.rhTotalPoints,
                    data: values,
                    borderColor: '#CCFF00',
                    backgroundColor: 'rgba(204,255,0,0.1)',
                    fill: true,
                    tension: 0.3,
                    pointBackgroundColor: '#CCFF00',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            title: function(ctx) { return tooltipNames[ctx[0].dataIndex]; },
                            label: function(ctx) { return L.rhTotalPoints + ': ' + ctx.parsed.y; }
                        },
                        backgroundColor: 'rgba(30,30,30,0.95)',
                        titleColor: '#CCFF00',
                        bodyColor: '#fff',
                        borderColor: '#CCFF00',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#888', maxRotation: 45 },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    },
                    y: {
                        beginAtZero: true,
                        ticks: { color: '#888' },
                        grid: { color: 'rgba(255,255,255,0.05)' }
                    }
                }
            }
        });
    }

    // ---- Badge Management in Player Form ----
    async function loadPlayerBadgesAdmin(playerId) {
        var container = document.getElementById('adPlrBadgesContainer');
        if (!container || !A.client) return;

        // Load all badge definitions
        var defsRes = await A.client.from('badge_definitions').select('*').order('sort_order', { ascending: true });
        var allDefs = defsRes.data || [];

        // Load earned badges for this player
        var earnedRes = await A.client.from('player_badges')
            .select('id, badge_id, earned_at')
            .eq('player_id', playerId)
            .order('earned_at', { ascending: true });
        var earned = earnedRes.data || [];

        var earnedMap = {};
        earned.forEach(function(pb) { earnedMap[pb.badge_id] = pb; });

        var html = '';

        // Earned badges table
        if (earned.length > 0) {
            html += '<table class="ad-table" style="margin-bottom:16px;"><thead><tr>' +
                '<th></th><th>' + L.plrBadges + '</th><th>' + L.badgeEarned + '</th>' +
                (A.currentRole === 'admin' ? '<th style="width:40px;"></th>' : '') +
                '</tr></thead><tbody>';

            earned.forEach(function(pb) {
                var def = allDefs.find(function(d) { return d.id === pb.badge_id; });
                if (!def) return;
                var name = isEn ? (def.name_en || def.name) : def.name;
                var dateStr = pb.earned_at ? new Date(pb.earned_at).toLocaleDateString() : '';

                html += '<tr>';
                html += '<td style="font-size:1.3rem;text-align:center;width:40px;">' + def.icon + '</td>';
                html += '<td style="font-weight:500;">' + A.esc(name) + '</td>';
                html += '<td style="color:var(--text-muted);font-size:0.82rem;">' + dateStr + '</td>';
                if (A.currentRole === 'admin') {
                    html += '<td><button class="ad-btn-icon ad-badge-del" data-pb-id="' + pb.id + '" title="' + L.badgeRemove + '">&times;</button></td>';
                }
                html += '</tr>';
            });

            html += '</tbody></table>';
        } else {
            html += '<div style="color:var(--text-muted);font-size:0.85rem;margin-bottom:12px;">' + L.badgeNoEarned + '</div>';
        }

        // Manual award (admin only)
        if (A.currentRole === 'admin') {
            // Dropdown with unearned badges
            var unearnedDefs = allDefs.filter(function(d) { return !earnedMap[d.id]; });
            var optionsHtml = '<option value="">\u2014 ' + L.badgeManualAward + ' \u2014</option>';
            unearnedDefs.forEach(function(d) {
                var name = isEn ? (d.name_en || d.name) : d.name;
                optionsHtml += '<option value="' + d.id + '">' + d.icon + ' ' + A.esc(name) + '</option>';
            });

            html += '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">';
            html += '<select class="ad-field-input" id="adPlrBadgeSelect" style="flex:1;min-width:200px;">' + optionsHtml + '</select>';
            html += '<button class="ad-btn ad-btn-primary ad-btn-sm" id="adPlrBadgeAdd">+ ' + L.badgeManualAward + '</button>';
            html += '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adPlrBadgeCheck">' + L.badgeCheckBtn + '</button>';
            html += '</div>';
        }

        container.innerHTML = html;

        // Delete badge handlers
        container.querySelectorAll('.ad-badge-del').forEach(function(btn) {
            btn.addEventListener('click', async function() {
                var pbId = btn.dataset.pbId;
                var res = await A.client.from('player_badges').delete().eq('id', pbId);
                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    return;
                }
                A.showToast(isEn ? 'Badge removed' : 'Бейдж убран', 'success');
                loadPlayerBadgesAdmin(playerId);
            });
        });

        // Add badge handler
        var addBtn = document.getElementById('adPlrBadgeAdd');
        if (addBtn) {
            addBtn.addEventListener('click', async function() {
                var sel = document.getElementById('adPlrBadgeSelect');
                var badgeId = sel.value;
                if (!badgeId) return;

                var res = await A.client.from('player_badges').insert({
                    player_id: playerId,
                    badge_id: badgeId
                });

                if (res.error) {
                    A.showToast(res.error.message, 'error');
                    return;
                }
                A.showToast(isEn ? 'Badge awarded' : 'Бейдж выдан', 'success');
                loadPlayerBadgesAdmin(playerId);
            });
        }

        // Check badges handler (runs the auto-check function)
        var checkBtn = document.getElementById('adPlrBadgeCheck');
        if (checkBtn) {
            checkBtn.addEventListener('click', async function() {
                checkBtn.disabled = true;
                checkBtn.textContent = L.saving;
                try {
                    var res = await A.client.rpc('check_and_award_badges', { p_player_id: playerId });
                    var newBadges = res.data || [];
                    if (newBadges.length > 0) {
                        A.showToast((isEn ? 'New badges: ' : 'Новые бейджи: ') + newBadges.length, 'success');
                    } else {
                        A.showToast(isEn ? 'No new badges' : 'Новых бейджей нет', 'info');
                    }
                    loadPlayerBadgesAdmin(playerId);
                } catch(e) {
                    A.showToast(e.message || 'Error', 'error');
                }
                checkBtn.disabled = false;
                checkBtn.textContent = L.badgeCheckBtn;
            });
        }
    }

    // ============================================
    // Rankings Sub-tab (moved from ratings.js)
    // ============================================

    function renderRatRankings() {
        var panel = document.getElementById('plrPanelRankings');
        if (!panel) return;

        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

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

        document.getElementById('ratCatFilter').addEventListener('change', function() {
            _ratCatFilter = this.value;
            loadRatRankings();
        });

        document.getElementById('ratGenderFilter').addEventListener('change', function() {
            _ratGenderFilter = this.value;
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

        if (_ratGenderFilter) {
            players = players.filter(function(p) {
                return p.categories && p.categories.gender === _ratGenderFilter;
            });
        }

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

        var playerIds = players.map(function(p) { return p.id; });
        _ratPlayerMatches = {};
        var _ratWL = {};
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

        var playerNameMap = {};
        players.forEach(function(p) { playerNameMap[p.id] = isEn ? (p.name_en || p.name) : p.name; });
        var playerEditBase = '#players/edit/';

        var groups = {};
        players.forEach(function(p) {
            var catId = p.category_id || 'none';
            if (!groups[catId]) groups[catId] = [];
            groups[catId].push(p);
        });

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
                if (pMatches.length === 0 && (p.wins || p.losses)) {
                    wl = { w: p.wins || 0, l: p.losses || 0 };
                }
                var formHtml = '';
                if (pMatches.length > 0) {
                    pMatches.forEach(function(m, mi) {
                        var isWin = m.winner_id === p.id;
                        var f = isWin ? 'w' : 'l';
                        formHtml += '<span class="ad-rat-form-' + f + ' ad-rat-form-clickable" data-pid="' + p.id + '" data-midx="' + mi + '">' + f.toUpperCase() + '</span>';
                    });
                } else if (p.form && p.form.length > 0) {
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

    // ============================================
    // Tournament Results Sub-tab (moved from ratings.js)
    // ============================================

    function renderRatResults() {
        var panel = document.getElementById('plrPanelResults');
        if (!panel) return;

        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

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

        loadCompletedTournaments();

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

        document.getElementById('ratResCatFilter').addEventListener('change', function() {
            _ratResCatFilter = this.value;
            rebuildTrnList();
        });

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
        document.getElementById('ratResultsBody').innerHTML = '';

        container._ratTrnClickHandler && container.removeEventListener('click', container._ratTrnClickHandler);
        container._ratTrnClickHandler = function(e) {
            var row = e.target.closest('.ad-rat-trn-row');
            if (!row) return;
            var trnId = row.getAttribute('data-trn-id');
            if (!trnId) return;
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

        var res = await A.client.from('tournament_results').select('*, players(name, name_en)').eq('tournament_id', tournamentId);
        var results = res.data || [];

        var trnRes = await A.client.from('tournaments').select('*, tournament_levels(name, name_en)').eq('id', tournamentId).single();
        var tournament = trnRes.data;

        var plrRes = await A.client.from('players').select('id, name, name_en, category_id').order('name');
        var allPlayers = plrRes.data || [];

        var levelName = '';
        if (tournament && tournament.tournament_levels) {
            levelName = isEn ? (tournament.tournament_levels.name_en || tournament.tournament_levels.name) : tournament.tournament_levels.name;
        }

        var levelHtml = levelName
            ? '<div class="ad-rat-level-badge">' + L.ratTournamentLevel + ': <strong>' + A.esc(levelName) + '</strong></div>'
            : '<div class="ad-rat-level-badge" style="color:#f44336;">' + L.ratTournamentLevel + ': ' + (isEn ? 'Not set! Edit tournament to assign level.' : 'Не задан! Отредактируйте турнир для назначения уровня.') + '</div>';

        var plrOpts = '<option value="">' + L.ratSelectPlayer + '</option>';
        allPlayers.forEach(function(p) {
            var name = isEn ? (p.name_en || p.name) : p.name;
            var cat = A.categoriesMap[p.category_id] ? (isEn ? A.categoriesMap[p.category_id].name_en : A.categoriesMap[p.category_id].name) : '';
            plrOpts += '<option value="' + p.id + '">' + A.esc(name) + (cat ? ' [' + cat + ']' : '') + '</option>';
        });

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

        document.getElementById('ratAddResultBtn').addEventListener('click', function() {
            var tbody = document.getElementById('ratResultsTbody');
            var tr = document.createElement('tr');
            tr.innerHTML = renderResultRowInner('', '', '', 'W', 0, plrOpts, roundOpts, false);
            tbody.appendChild(tr);
            updateResultPoints(tr);
        });

        document.getElementById('ratSaveResultsBtn').addEventListener('click', function() {
            saveResults(tournamentId);
        });

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
        var playerCell = existing
            ? '<td>' + A.esc(playerName) + '<input type="hidden" class="rat-player-id" value="' + playerId + '"></td>'
            : '<td><select class="ad-field-select rat-player-select">' + plrOpts.replace('value="' + playerId + '"', 'value="' + playerId + '" selected') + '</select></td>';

        var roundCell = '<td><select class="ad-field-select rat-round-select">';
        ROUND_KEYS.forEach(function(r) {
            roundCell += '<option value="' + r + '"' + (r === round ? ' selected' : '') + '>' + ROUND_LABELS[r] + '</option>';
        });
        roundCell += '</select></td>';

        var pointsCell = '<td><span class="rat-points-display">' + (points || 0) + '</span></td>';
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

        await recalcPlayerPoints(toUpsert.map(function(r) { return r.player_id; }));

        A.showToast(L.ratResultsSaved, 'success');
        loadTournamentResults(tournamentId);
    }

    async function recalcPlayerPoints(playerIds) {
        var unique = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        for (var i = 0; i < unique.length; i++) {
            var pid = unique[i];

            var trRes = await A.client.from('tournament_results').select('round_reached').eq('player_id', pid);
            var wins = 0;
            var losses = 0;
            (trRes.data || []).forEach(function(r) {
                if (r.round_reached === 'W') wins++;
                else losses++;
            });

            var currentYear = new Date().getFullYear();
            var rhRes = await A.client.from('rating_history')
                .select('points_earned')
                .eq('player_id', pid)
                .gte('recorded_at', currentYear + '-01-01')
                .lte('recorded_at', currentYear + '-12-31');
            var total = 0;
            (rhRes.data || []).forEach(function(r) {
                total += r.points_earned || 0;
            });

            await A.client.from('players').update({ points: total, wins: wins, losses: losses }).eq('id', pid);
        }
    }
    A.recalcPlayerPoints = recalcPlayerPoints;

    // Delete result row (delegate)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rat-delete-row')) {
            var tr = e.target.closest('tr');
            if (tr) tr.remove();
        }
    });

    // ---- Export to namespace ----
    A.renderPlayersSection = renderPlayersSection;
    A.renderPlayersList = renderPlayersList;
    A.loadAndEditPlayer = loadAndEditPlayer;
    A.loadPointsRules = loadPointsRules;
    A.ROUND_KEYS = ROUND_KEYS;
    A.ROUND_LABELS = ROUND_LABELS;

})();
