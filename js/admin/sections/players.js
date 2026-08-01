// ============================================
// KSLT Admin — Players CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;
    var CU = window.KSLT_COUNTRY;

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

    // ---- Country Picker ----
    var PRIORITY_COUNTRIES = ['KG', 'KZ', 'RU', 'UZ'];

    function setupCountryPicker() {
        var hidden = document.getElementById('adPlrCountry');
        var input = document.getElementById('adPlrCountryInput');
        var dropdown = document.getElementById('adPlrCountryDropdown');
        if (!hidden || !input || !dropdown) return;

        var countries = window.KSLT_COUNTRIES || [];
        var lang = isEn ? 'en' : 'ru';

        function renderDropdownItems(list) {
            dropdown.innerHTML = '';
            if (!list.length) { dropdown.style.display = 'none'; return; }
            list.forEach(function(c) {
                var div = document.createElement('div');
                div.className = 'ad-dropdown-item';
                div.style.cursor = 'pointer';
                div.textContent = CU.flagEmoji(c.code) + ' ' + (c[lang] || c.en);
                div.dataset.code = c.code;
                div.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    selectCountry(c.code);
                });
                dropdown.appendChild(div);
            });
            dropdown.style.display = 'block';
        }

        function selectCountry(code) {
            hidden.value = code;
            input.value = CU.renderCountry(code, lang, true);
            dropdown.style.display = 'none';
        }

        function filterCountries(query) {
            if (!query) {
                // Show priority countries
                var priority = countries.filter(function(c) {
                    return PRIORITY_COUNTRIES.indexOf(c.code) !== -1;
                });
                renderDropdownItems(priority);
                return;
            }
            var q = query.toLowerCase();
            var results = countries.filter(function(c) {
                return c.ru.toLowerCase().indexOf(q) !== -1 ||
                       c.en.toLowerCase().indexOf(q) !== -1 ||
                       c.kg.toLowerCase().indexOf(q) !== -1 ||
                       c.code.toLowerCase().indexOf(q) !== -1;
            });
            renderDropdownItems(results.slice(0, 10));
        }

        input.addEventListener('focus', function() {
            filterCountries(input.value && !hidden.value ? input.value : '');
        });

        input.addEventListener('input', function() {
            hidden.value = '';
            filterCountries(input.value);
        });

        input.addEventListener('blur', function() {
            setTimeout(function() { dropdown.style.display = 'none'; }, 150);
        });

        // Clear button: if user empties the field
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                dropdown.style.display = 'none';
                input.blur();
            }
        });
    }

    var plrSearchQuery = '';

    // ---- Rating state (moved from ratings.js) ----
    var cachedLevels = [];
    var cachedRules = {};
    var ROUND_KEYS = ['W', 'F', '3RD', '4TH', 'SF', 'QF', 'R16', 'R32', 'G3', 'G4', 'G5', 'G6'];
    var ROUND_LABELS = { W: L.ratW, F: L.ratF, '3RD': L.rat3RD, '4TH': L.rat4TH, SF: L.ratSF, QF: L.ratQF, R16: L.ratR16, R32: L.ratR32, G3: L.ratG3, G4: L.ratG4, G5: L.ratG5, G6: L.ratG6 };

    A.loadTournamentLevels = async function(forceRefresh) {
        if (!forceRefresh && A.cachedLevels && A.cachedLevels.length > 0) return;
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
            var catName = isEn ? c.name_en : c.name;
            var selected = plrFilterCategory === c.id ? ' selected' : '';
            catFilterHtml += '<option value="' + c.id + '"' + selected + '>' + catName + '</option>';
        });

        var isAdm = A.currentRole === 'admin';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.players + '</h2>' +
                (isAdm ? '<div class="ad-section-header-actions">' +
                    '<button class="ad-btn ad-btn-sm" id="adPlrImportBtn">\ud83d\udce5 ' + L.plrImport + '</button>' +
                    '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adPlrExportBtn">\ud83d\udcca ' + L.plrExport + '</button>' +
                '</div>' : '') +
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
                            '<th style="text-align:center;width:50px;">&#128065;</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="6" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';


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

        var impBtn = document.getElementById('adPlrImportBtn');
        if (impBtn) impBtn.addEventListener('click', showImportModal);
        var expBtn = document.getElementById('adPlrExportBtn');
        if (expBtn) expBtn.addEventListener('click', exportPlayersExcel);

        await loadPlayersList();
    }

    async function loadPlayersList() {
        if (!A.client) return;
        var isAdm = A.currentRole === 'admin';

        var query = A.client.from('players')
            .select('id,name,photo,country,category_id,points,doubles_points,wins,losses,rank_change,banned_until,view_count')
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
                '<tr><td colspan="8" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📊</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noPlayers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noPlayersText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(p) {
            var plrFlag = CU.flagEmoji(CU.normalizeCountry(p.country)) || '?';
            var thumbHtml = p.photo
                ? '<img src="' + A.esc(p.photo) + '" class="ad-table-thumb ad-table-thumb-round" alt="">'
                : '<div class="ad-table-thumb ad-table-thumb-round" style="background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:1.1rem;">' + plrFlag + '</div>';

            var catObj = A.categoriesMap[p.category_id];
            var catLabel = catObj ? (isEn ? catObj.name_en : catObj.name) : (p.category_id || L.noData);

            tbody.innerHTML +=
                '<tr data-plr-id="' + p.id + '"' + (isAdm ? ' style="cursor:pointer;"' : '') + '>' +
                    (isAdm ? A.bulkCheckboxTd(p.id) : '') +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + plrFlag + ' ' + (p.name || L.noData) +
                        (p.banned_until && new Date(p.banned_until) > new Date() ? ' <span style="display:inline-block;padding:1px 6px;border-radius:3px;font-size:0.7rem;font-weight:600;background:rgba(255,59,48,0.15);color:#ff3b30;margin-left:4px;">' + L.plrBanned + '</span>' : '') +
                    '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + (p.points || 0) + '</td>' +
                    '<td>' + (p.wins || 0) + '/' + (p.losses || 0) + '</td>' +
                    '<td style="text-align:center;color:var(--text-dim);">' + ((p.view_count || 0) > 0 ? p.view_count : '\u2014') + '</td>' +
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
            var profRes = await A.client.from('profiles').select('gender, telegram, instagram').eq('player_id', id).maybeSingle();
            if (profRes.data) {
                if (profRes.data.gender) result.data._gender = profRes.data.gender;
                result.data._telegram = profRes.data.telegram || '';
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
            ? '<img src="' + A.esc(plrImageUrl) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:12px;width:100%;height:100%;aspect-ratio:auto;max-height:none;object-fit:cover;">' +
              '<button type="button" class="ad-image-upload-remove" id="adPlrImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder" style="padding:16px 8px;font-size:0.7rem;text-align:center;">' +
                  '<div style="font-size:1.5rem;">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = plrImageUrl ? ' has-image' : '';

        // Category options
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        A.cachedCategories.forEach(function(c) {
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + catName + '</option>';
        });

        // Badges section is now loaded dynamically from player_badges table


        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adPlrBack">' + L.back + '</button>' +
            '</div>' +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrPhoto + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adPlrImgZone" style="width:140px;height:180px;border-radius:12px;margin:0 auto 16px;border:2px solid var(--accent);overflow:hidden;">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adPlrImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adPlrImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (plrImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adPlrImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Name (RU/EN/KG) — split into First + Last
            (function() {
                // Split existing names into first/last
                var nameParts = (item ? (item.name || '') : '').split(' ');
                var fnRu = nameParts[0] || '';
                var lnRu = nameParts.slice(1).join(' ') || '';
                var namePartsEn = (item ? (item.name_en || '') : '').split(' ');
                var fnEn = namePartsEn[0] || '';
                var lnEn = namePartsEn.slice(1).join(' ') || '';
                var namePartsKg = (item ? (item.name_kg || '') : '').split(' ');
                var fnKg = namePartsKg[0] || '';
                var lnKg = namePartsKg.slice(1).join(' ') || '';
                return '<div class="ad-form-card">' +
                    '<div class="ad-form-card-title">' + L.plrName + '</div>' +
                    '<div class="ad-lang-tabs">' +
                        '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                        '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                        '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                    '</div>' +
                    '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                        '<div class="ad-field-row ad-field-row-2">' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrFirstName + '</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrFirstName" placeholder="' + L.plrFirstName + '" value="' + A.esc(fnRu) + '">' +
                            '</div>' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrLastName + '</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrLastName" placeholder="' + L.plrLastName + '" value="' + A.esc(lnRu) + '">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-lang-panel" data-lang-panel="en">' +
                        '<div class="ad-field-row ad-field-row-2">' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrFirstName + ' (EN)</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrFirstNameEn" value="' + A.esc(fnEn) + '">' +
                            '</div>' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrLastName + ' (EN)</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrLastNameEn" value="' + A.esc(lnEn) + '">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-lang-panel" data-lang-panel="kg">' +
                        '<div class="ad-field-row ad-field-row-2">' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrFirstName + ' (KG)</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrFirstNameKg" value="' + A.esc(fnKg) + '">' +
                            '</div>' +
                            '<div class="ad-field">' +
                                '<label class="ad-field-label">' + L.plrLastName + ' (KG)</label>' +
                                '<input type="text" class="ad-field-input" id="adPlrLastNameKg" value="' + A.esc(lnKg) + '">' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<button type="button" class="ad-btn-translate-all" id="adPlrTranslateAll">&#127760; ' + L.translateAllBtn + '</button>' +
                '</div>';
            })() +

            // Motto (RU/EN/KG, max 100 chars each)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrMotto + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrMotto" maxlength="100" placeholder="' + (isEn ? 'e.g. Never give up!' : 'напр. Никогда не сдавайся!') + '" value="' + A.esc(item ? item.bio : '') + '">' +
                        '<div class="ad-field-hint" style="text-align:right;margin-top:2px;"><span id="adPlrMottoCount">' + ((item && item.bio) ? item.bio.length : 0) + '</span>/100</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrMottoEn" maxlength="100" placeholder="Motto (EN)" value="' + A.esc(item ? item.bio_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adPlrMottoKg" maxlength="100" placeholder="Motto (KG)" value="' + A.esc(item ? item.bio_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adPlrMotto" data-en="adPlrMottoEn" data-kg="adPlrMottoKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Category + Country
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrCategory + '</label>' +
                        '<select class="ad-field-input" id="adPlrCat">' + catOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field" style="position:relative;">' +
                        '<label class="ad-field-label">' + L.plrCountry + '</label>' +
                        '<input type="hidden" id="adPlrCountry" value="' + A.esc(item ? CU.normalizeCountry(item.country) || '' : '') + '">' +
                        '<input type="text" class="ad-field-input" id="adPlrCountryInput" placeholder="' + L.plrCountrySearch + '" autocomplete="off" value="' + A.esc(item && item.country ? CU.renderCountry(item.country, isEn ? 'en' : 'ru', true) : '') + '">' +
                        '<div class="ad-dropdown-list" id="adPlrCountryDropdown" style="display:none;"></div>' +
                    '</div>' +
                    '<div class="ad-field"></div>' +
                '</div>' +
            '</div>' +

            // Stats: Points, Wins, Losses, Rank Change (readonly by default)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title" style="display:flex;align-items:center;gap:8px;">' +
                    L.plrSinglesTitle +
                    (plrEditingId ? (
                        '<button type="button" class="ad-btn-translate" id="adPlrUnlockStats" style="margin-top:0;">✏ ' + L.plrManualEdit + '</button>' +
                        '<button type="button" class="ad-btn-translate" id="adPlrRecalcStats" style="margin-top:0;">🔄 ' + L.plrRecalc + '</button>'
                    ) : '') +
                '</div>' +
                '<div class="ad-field-hint" style="margin-bottom:8px;">' + L.plrRecalcHint + '</div>' +
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPoints + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrPoints" min="0" value="' + (item ? (item.points || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrWins + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrWins" min="0" value="' + (item ? (item.wins || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrLosses + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrLosses" min="0" value="' + (item ? (item.losses || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrRankChange + '</label>' +
                        '<input type="number" class="ad-field-input" id="adPlrRankChange" value="' + (item ? (item.rank_change || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Doubles Rating (readonly by default)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title" style="display:flex;align-items:center;gap:8px;">' +
                    L.plrDoublesTitle +
                    (plrEditingId ? (
                        '<button type="button" class="ad-btn-translate" id="adPlrUnlockDoubles" style="margin-top:0;">✏ ' + L.plrManualEdit + '</button>' +
                        '<button type="button" class="ad-btn-translate" id="adPlrRecalcDoubles" style="margin-top:0;">🔄 ' + L.plrRecalc + '</button>'
                    ) : '') +
                '</div>' +
                '<div class="ad-field-hint" style="margin-bottom:8px;">' + L.plrRecalcHint + '</div>' +
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPoints + '</label>' +
                        '<input type="number" class="ad-field-input ad-plr-doubles-field" id="adPlrDoublesPoints" min="0" value="' + (item ? (item.doubles_points || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrWins + '</label>' +
                        '<input type="number" class="ad-field-input ad-plr-doubles-field" id="adPlrDoublesWins" min="0" value="' + (item ? (item.doubles_wins || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrLosses + '</label>' +
                        '<input type="number" class="ad-field-input ad-plr-doubles-field" id="adPlrDoublesLosses" min="0" value="' + (item ? (item.doubles_losses || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrRankChange + '</label>' +
                        '<input type="number" class="ad-field-input ad-plr-doubles-field" id="adPlrDoublesRankChange" value="' + (item ? (item.doubles_rank_change || 0) : '') + '"' + (plrEditingId ? ' readonly style="opacity:0.6;cursor:not-allowed;"' : '') + '>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // NTRP Rating (manual edit by admin)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrNtrp + '</div>' +
                '<div class="ad-field" style="max-width:200px;">' +
                    '<select class="ad-field-input" id="adPlrNtrp">' + A.ntrpOptions(item && item.ntrp_rating) + '</select>' +
                    '<div class="ad-field-hint">' + L.plrNtrpHint + '</div>' +
                '</div>' +
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

            // Contact: Phone, Email, Show Phone (read-only)
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrPhone + '</label>' +
                        '<input type="text" class="ad-field-input" id="adPlrPhone" value="' + A.esc(item ? item.phone || '—' : '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.plrEmail + '</label>' +
                        '<input type="email" class="ad-field-input" id="adPlrEmail" value="' + A.esc(item ? item.email || '—' : '—') + '" readonly style="opacity:0.6;cursor:not-allowed;">' +
                    '</div>' +
                    '<div class="ad-field" style="display:flex;align-items:flex-end;padding-bottom:8px;">' +
                        '<label class="ad-checkbox-label"><input type="checkbox" id="adPlrShowPhone"' + (item && item.show_phone ? ' checked' : '') + ' disabled> ' + L.plrShowPhone + '</label>' +
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
        attachScriptValidation('adPlrFirstName', SCRIPT_RU, 'Только кириллица');
        attachScriptValidation('adPlrLastName', SCRIPT_RU, 'Только кириллица');
        attachScriptValidation('adPlrFirstNameEn', SCRIPT_EN, 'Latin characters only');
        attachScriptValidation('adPlrLastNameEn', SCRIPT_EN, 'Latin characters only');
        attachScriptValidation('adPlrFirstNameKg', SCRIPT_KG, 'Кыргыз тамгалары гана');
        attachScriptValidation('adPlrLastNameKg', SCRIPT_KG, 'Кыргыз тамгалары гана');
        var rhNameHint = isEn ? 'Latin characters only' : 'Только кириллица';
        var rhNameRegex = isEn ? SCRIPT_EN : SCRIPT_RU;
        attachScriptValidation('adPlrRhName', rhNameRegex, rhNameHint);

        // --- Country picker ---
        setupCountryPicker();

        // --- Unlock / Recalc buttons for stats ---
        var unlockStatsBtn = document.getElementById('adPlrUnlockStats');
        if (unlockStatsBtn) {
            unlockStatsBtn.addEventListener('click', function() {
                ['adPlrPoints', 'adPlrWins', 'adPlrLosses', 'adPlrRankChange'].forEach(function(fid) {
                    var el = document.getElementById(fid);
                    if (el) { el.removeAttribute('readonly'); el.style.opacity = ''; el.style.cursor = ''; }
                });
                A.showToast(isEn ? 'Fields unlocked' : 'Поля разблокированы', 'info');
            });
        }
        var recalcStatsBtn = document.getElementById('adPlrRecalcStats');
        if (recalcStatsBtn && plrEditingId) {
            recalcStatsBtn.addEventListener('click', async function() {
                recalcStatsBtn.disabled = true;
                await A.recalcPlayerPoints([plrEditingId]);
                var fresh = await A.client.from('players').select('points,wins,losses,form').eq('id', plrEditingId).single();
                if (fresh.data) {
                    var pf = document.getElementById('adPlrPoints');
                    var wf = document.getElementById('adPlrWins');
                    var lf = document.getElementById('adPlrLosses');
                    if (pf) pf.value = fresh.data.points || 0;
                    if (wf) wf.value = fresh.data.wins || 0;
                    if (lf) lf.value = fresh.data.losses || 0;
                }
                recalcStatsBtn.disabled = false;
                A.showToast(isEn ? 'Recalculated' : 'Пересчитано', 'success');
            });
        }

        // --- Unlock / Recalc buttons for doubles ---
        var unlockDoublesBtn = document.getElementById('adPlrUnlockDoubles');
        if (unlockDoublesBtn) {
            unlockDoublesBtn.addEventListener('click', function() {
                document.querySelectorAll('.ad-plr-doubles-field').forEach(function(el) {
                    el.removeAttribute('readonly'); el.style.opacity = ''; el.style.cursor = '';
                });
                A.showToast(isEn ? 'Fields unlocked' : 'Поля разблокированы', 'info');
            });
        }
        var recalcDoublesBtn = document.getElementById('adPlrRecalcDoubles');
        if (recalcDoublesBtn && plrEditingId) {
            recalcDoublesBtn.addEventListener('click', async function() {
                recalcDoublesBtn.disabled = true;
                await A.recalcDoublesPoints([plrEditingId]);
                var fresh = await A.client.from('players').select('doubles_points,doubles_wins,doubles_losses').eq('id', plrEditingId).single();
                if (fresh.data) {
                    var df = document.getElementById('adPlrDoublesPoints');
                    var dwf = document.getElementById('adPlrDoublesWins');
                    var dlf = document.getElementById('adPlrDoublesLosses');
                    if (df) df.value = fresh.data.doubles_points || 0;
                    if (dwf) dwf.value = fresh.data.doubles_wins || 0;
                    if (dlf) dlf.value = fresh.data.doubles_losses || 0;
                }
                recalcDoublesBtn.disabled = false;
                A.showToast(isEn ? 'Recalculated' : 'Пересчитано', 'success');
            });
        }

        // --- Motto character counter ---
        var mottoInput = document.getElementById('adPlrMotto');
        if (mottoInput) {
            mottoInput.addEventListener('input', function() {
                var cnt = document.getElementById('adPlrMottoCount');
                if (cnt) cnt.textContent = mottoInput.value.length;
            });
        }

        // --- Name translate buttons (EN / KG) ---
        function translateNameFields(toLang, fnTargetId, lnTargetId, btn) {
            var fnRu = document.getElementById('adPlrFirstName').value.trim();
            var lnRu = document.getElementById('adPlrLastName').value.trim();
            if (!fnRu && !lnRu) { A.showToast(L.fillRuFirst, 'error'); return; }
            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;
            var fullName = fnRu + (lnRu ? ' ' + lnRu : '');
            A.translateFromRu(fullName, toLang).then(function(result) {
                var parts = result.split(' ');
                document.getElementById(fnTargetId).value = parts[0] || '';
                document.getElementById(lnTargetId).value = parts.slice(1).join(' ') || '';
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                A.showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        }

        // Translate All — fill empty EN + KG from RU
        var translateAllBtn = document.getElementById('adPlrTranslateAll');
        if (translateAllBtn) {
            translateAllBtn.addEventListener('click', function() {
                var fnRu = document.getElementById('adPlrFirstName').value.trim();
                var lnRu = document.getElementById('adPlrLastName').value.trim();
                if (!fnRu && !lnRu) { A.showToast(L.fillRuFirst, 'error'); return; }

                var needEn = !document.getElementById('adPlrFirstNameEn').value.trim() && !document.getElementById('adPlrLastNameEn').value.trim();
                var needKg = !document.getElementById('adPlrFirstNameKg').value.trim() && !document.getElementById('adPlrLastNameKg').value.trim();
                if (!needEn && !needKg) { A.showToast(isEn ? 'All fields already filled' : 'Все поля уже заполнены', 'info'); return; }

                var origLabel = translateAllBtn.textContent;
                translateAllBtn.textContent = L.translating;
                translateAllBtn.disabled = true;
                var fullName = fnRu + (lnRu ? ' ' + lnRu : '');
                var promises = [];
                if (needEn) promises.push(A.translateFromRu(fullName, 'en').then(function(r) { var p = r.split(' '); document.getElementById('adPlrFirstNameEn').value = p[0] || ''; document.getElementById('adPlrLastNameEn').value = p.slice(1).join(' ') || ''; }));
                if (needKg) promises.push(A.translateFromRu(fullName, 'kg').then(function(r) { var p = r.split(' '); document.getElementById('adPlrFirstNameKg').value = p[0] || ''; document.getElementById('adPlrLastNameKg').value = p.slice(1).join(' ') || ''; }));
                Promise.all(promises).then(function() {
                    translateAllBtn.textContent = origLabel;
                    translateAllBtn.disabled = false;
                }).catch(function() {
                    A.showToast(L.translateError, 'error');
                    translateAllBtn.textContent = origLabel;
                    translateAllBtn.disabled = false;
                });
            });
        }

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

        // Translate All — delegate for data-ru/data-en/data-kg buttons (motto etc.)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all[data-ru]');
            if (!btn) return;
            A.translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
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
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adPlrImgPreview" style="border-radius:12px;width:100%;height:100%;aspect-ratio:auto;max-height:none;object-fit:cover;">' +
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

            // Auto-compute form (W/L) from last 5 matches
            var formArr = [];
            if (plrEditingId) {
                var matchRes = await A.client.from('matches')
                    .select('winner_id')
                    .or('player1_id.eq.' + plrEditingId + ',player2_id.eq.' + plrEditingId)
                    .not('winner_id', 'is', null)
                    .order('played_at', { ascending: false })
                    .limit(5);
                if (matchRes.data) {
                    matchRes.data.forEach(function(m) {
                        formArr.push(m.winner_id === plrEditingId ? 'W' : 'L');
                    });
                }
            }

            // Concatenate first + last name
            var fnRu = document.getElementById('adPlrFirstName').value.trim();
            var lnRu = document.getElementById('adPlrLastName').value.trim();
            var name = fnRu + (lnRu ? ' ' + lnRu : '');

            var fnEn = document.getElementById('adPlrFirstNameEn').value.trim();
            var lnEn = document.getElementById('adPlrLastNameEn').value.trim();
            var nameEn = (fnEn || lnEn) ? (fnEn + (lnEn ? ' ' + lnEn : '')) : null;

            var fnKg = document.getElementById('adPlrFirstNameKg').value.trim();
            var lnKg = document.getElementById('adPlrLastNameKg').value.trim();
            var nameKg = (fnKg || lnKg) ? (fnKg + (lnKg ? ' ' + lnKg : '')) : null;

            // Script validation
            if (fnRu && !checkScript(fnRu, SCRIPT_RU)) {
                A.showToast(isEn ? 'RU name must use Cyrillic' : 'Имя (RU) должно быть на кириллице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (lnRu && !checkScript(lnRu, SCRIPT_RU)) {
                A.showToast(isEn ? 'RU last name must use Cyrillic' : 'Фамилия (RU) должна быть на кириллице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (fnEn && !checkScript(fnEn, SCRIPT_EN)) {
                A.showToast(isEn ? 'EN name must use Latin' : 'Имя (EN) должно быть на латинице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (lnEn && !checkScript(lnEn, SCRIPT_EN)) {
                A.showToast(isEn ? 'EN last name must use Latin' : 'Фамилия (EN) должна быть на латинице', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (fnKg && !checkScript(fnKg, SCRIPT_KG)) {
                A.showToast(isEn ? 'KG name must use Kyrgyz script' : 'Имя (KG) должно быть на кыргызском', 'error');
                saveBtn.disabled = false; saveBtn.textContent = L.save; return;
            }
            if (lnKg && !checkScript(lnKg, SCRIPT_KG)) {
                A.showToast(isEn ? 'KG last name must use Kyrgyz script' : 'Фамилия (KG) должна быть на кыргызском', 'error');
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
                bio: document.getElementById('adPlrMotto').value.trim() || null,
                bio_en: document.getElementById('adPlrMottoEn').value.trim() || null,
                bio_kg: document.getElementById('adPlrMottoKg').value.trim() || null,
                ntrp_rating: parseFloat(document.getElementById('adPlrNtrp').value) || null,
                doubles_points: parseInt(document.getElementById('adPlrDoublesPoints').value, 10) || 0,
                doubles_wins: parseInt(document.getElementById('adPlrDoublesWins').value, 10) || 0,
                doubles_losses: parseInt(document.getElementById('adPlrDoublesLosses').value, 10) || 0,
                doubles_rank_change: parseInt(document.getElementById('adPlrDoublesRankChange').value, 10) || 0
            };

            if (!fnRu) {
                A.showToast(isEn ? 'First name is required' : 'Имя обязательно', 'error');
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
                    var profRes = await A.client.from('profiles').select('gender, telegram, instagram').eq('player_id', plrEditingId).maybeSingle();
                    if (profRes.data) {
                        if (profRes.data.gender) fresh.data._gender = profRes.data.gender;
                        fresh.data._telegram = profRes.data.telegram || '';
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
            .select('id, player1_id, player2_id, score, winner_id, round, played_at, created_at, tournament:tournaments(title, title_en, format)')
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

            var isDblTrn = m.tournament && (m.tournament.format === 'doubles' || m.tournament.format === 'mixed_doubles');

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
                    (isDblTrn ? '<span style="font-size:1.1rem;vertical-align:middle;" title="' + (isEn ? 'Doubles' : 'Парный') + '">\uD83D\uDC65</span> ' : '') +
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
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-filter-row ad-filter-sticky" id="ratFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="ratSearch" placeholder="' + L.ratSearchPlayer + '">' +
                '<select class="ad-field-input ad-filter-select" id="ratGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="ratCatFilter">' + catOpts + '</select>' +
                '<button class="ad-btn ad-btn-sm" id="ratRecalcAllBtn" style="margin-left:auto">' + (isEn ? 'Recalculate all' : 'Пересчитать все') + '</button>' +
            '</div>' +
            '<div id="ratRankingsBody"></div>';

        document.getElementById('ratRecalcAllBtn').addEventListener('click', recalcAllPoints);
        document.getElementById('ratCatFilter').addEventListener('change', function() {
            _ratCatFilter = this.value;
            loadRatRankings();
        });

        document.getElementById('ratGenderFilter').addEventListener('change', function() {
            _ratGenderFilter = this.value;
            _ratCatFilter = '';
            document.getElementById('ratCatFilter').value = '';
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

        var query = A.client.from('players').select('*, categories(name, name_en)').order('points', { ascending: false });
        if (_ratCatFilter) query = query.eq('category_id', _ratCatFilter);
        if (_ratGenderFilter) query = query.eq('gender', _ratGenderFilter);
        var res = await query;
        var players = res.data || [];

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
            if (catId !== 'none' && A.categoriesMap[catId]) {
                catName = isEn ? (A.categoriesMap[catId].name_en || A.categoriesMap[catId].name) : A.categoriesMap[catId].name;
            }

            if (!_ratCatFilter) {
                html += '<h3 class="ad-rat-cat-title">' + (catName || 'N/A') + '</h3>';
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
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
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
            _ratResCatFilter = '';
            document.getElementById('ratResCatFilter').value = '';
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
            if (_ratResGenderFilter && t.gender !== _ratResGenderFilter) return false;
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
            var catName = cat ? (isEn ? (cat.name_en || cat.name) : cat.name) : '';
            var genderIcon = t.gender === 'women' ? '\u2640 ' : (t.gender === 'men' ? '\u2642 ' : '');
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

    function getOldestValidYear() {
        var now = new Date();
        var year = now.getFullYear();
        return now.getMonth() >= 8 ? (year - 1) : (year - 2);
    }
    A.getOldestValidYear = getOldestValidYear;

    async function recalcPlayerPoints(playerIds) {
        var unique = playerIds.filter(function(id, i) { return playerIds.indexOf(id) === i; });

        // Get doubles tournament IDs to exclude from singles count
        var dblTrnRes = await A.client.from('tournaments').select('id').in('format', ['doubles', 'mixed_doubles']);
        var dblTrnIds = (dblTrnRes.data || []).map(function(t) { return t.id; });

        for (var i = 0; i < unique.length; i++) {
            var pid = unique[i];

            // All completed matches for this player
            var matchRes = await A.client.from('matches')
                .select('winner_id, tournament_id, played_at')
                .or('player1_id.eq.' + pid + ',player2_id.eq.' + pid)
                .not('winner_id', 'is', null)
                .order('played_at', { ascending: false });

            // Filter: only singles (exclude doubles tournaments)
            var singlesMatches = (matchRes.data || []).filter(function(m) {
                return dblTrnIds.indexOf(m.tournament_id) === -1;
            });

            var wins = 0;
            var losses = 0;
            singlesMatches.forEach(function(m) {
                if (m.winner_id === pid) wins++;
                else losses++;
            });

            // Form: last 5 singles matches
            var formArr = singlesMatches.slice(0, 5).map(function(m) {
                return m.winner_id === pid ? 'W' : 'L';
            });

            // Points from rating_history (singles only, 2-year window)
            var currentYear = new Date().getFullYear();
            var oldestYear = A.getOldestValidYear();
            var rhRes = await A.client.from('rating_history')
                .select('points_earned')
                .eq('player_id', pid)
                .neq('is_doubles', true)
                .gte('recorded_at', oldestYear + '-01-01')
                .lte('recorded_at', currentYear + '-12-31');
            var total = 0;
            (rhRes.data || []).forEach(function(r) {
                total += r.points_earned || 0;
            });

            await A.client.from('players').update({
                points: total, wins: wins, losses: losses, form: formArr
            }).eq('id', pid);
        }
    }
    A.recalcPlayerPoints = recalcPlayerPoints;

    async function recalcAllPoints() {
        var btn = document.getElementById('ratRecalcAllBtn');
        if (btn) { btn.disabled = true; btn.textContent = isEn ? 'Recalculating...' : 'Пересчёт...'; }
        try {
            var res = await A.client.from('players').select('id');
            var ids = (res.data || []).map(function(p) { return p.id; });
            if (ids.length === 0) { A.showToast(isEn ? 'No players found' : 'Игроки не найдены', 'error'); return; }
            await recalcPlayerPoints(ids);
            if (typeof A.recalcDoublesPoints === 'function') await A.recalcDoublesPoints(ids);
            A.showToast(isEn ? 'All points recalculated (' + ids.length + ' players)' : 'Все очки пересчитаны (' + ids.length + ' игроков)', 'success');
            loadRatRankings();
        } catch (err) {
            A.showToast(err.message, 'error');
        } finally {
            if (btn) { btn.disabled = false; btn.textContent = isEn ? 'Recalculate all' : 'Пересчитать все'; }
        }
    }

    // Delete result row (delegate)
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('rat-delete-row')) {
            var tr = e.target.closest('tr');
            if (tr) tr.remove();
        }
    });

    // ---- Export Players to Excel/CSV ----
    async function exportPlayersExcel() {
        if (!A.client) return;
        var res = await A.client.from('players')
            .select('id,name,name_en,category_id,points,wins,losses,ntrp_rating,country')
            .order('points', { ascending: false });
        var items = res.data || [];
        if (!items.length) { A.toast(L.plrImportNoData, 'warning'); return; }

        var headers = ['#', L.plrName, isEn ? 'Name EN' : 'Имя EN', L.plrCategory, L.plrPoints, L.plrWins, L.plrLosses, 'NTRP', L.plrCountry];
        var rows = items.map(function(p, i) {
            var cat = A.categoriesMap[p.category_id];
            var catName = cat ? (isEn ? cat.name_en : cat.name) : (p.category_id || '');
            return [i + 1, p.name || '', p.name_en || '', catName, p.points || 0, p.wins || 0, p.losses || 0, p.ntrp_rating || '', p.country || ''];
        });
        var today = new Date().toISOString().slice(0, 10);
        A.exportCsv('kslt-players-' + today + '.csv', headers, rows);
    }

    // ---- Import Players from Excel ----
    function showImportModal() {
        // Remove existing modal if any
        var old = document.getElementById('adImportOverlay');
        if (old) old.remove();

        var overlay = document.createElement('div');
        overlay.id = 'adImportOverlay';
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal ad-import-modal">' +
                '<div class="ad-modal-header">' +
                    '<h3>\ud83d\udce5 ' + L.plrImportTitle + '</h3>' +
                    '<button class="ad-modal-close" id="adImportClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div id="adImportStep1">' +
                        '<div class="ad-import-dropzone" id="adImportDropzone">' +
                            '<div class="ad-import-dropzone-icon">\ud83d\udcc2</div>' +
                            '<div class="ad-import-dropzone-text">' + L.plrImportFile + '</div>' +
                            '<div class="ad-import-dropzone-hint">' + (isEn ? 'or drag & drop file here' : 'или перетащите файл сюда') + '</div>' +
                            '<input type="file" id="adImportFileInput" accept=".xlsx,.xls,.csv" class="ad-import-dropzone-file">' +
                        '</div>' +
                        '<div id="adImportFileInfo" style="display:none;"></div>' +
                        '<div id="adImportSheetWrap" style="display:none;margin-top:12px;">' +
                            '<label class="ad-field-label">' + L.plrImportSheet + '</label>' +
                            '<select id="adImportSheetSelect" class="ad-field-input"></select>' +
                        '</div>' +
                    '</div>' +
                    '<div id="adImportStep2" style="display:none;">' +
                        '<h4 style="margin:0 0 16px;color:var(--text-primary);font-size:0.95rem;">' + L.plrImportMapCol + '</h4>' +
                        '<div id="adImportMapFields"></div>' +
                    '</div>' +
                    '<div id="adImportStep3" style="display:none;">' +
                        '<h4 style="margin:0 0 12px;color:var(--text-primary);font-size:0.95rem;">' + L.plrImportPreview + '</h4>' +
                        '<div class="ad-import-preview-wrap">' +
                            '<table class="ad-table ad-import-preview" id="adImportPreviewTable"></table>' +
                        '</div>' +
                        '<div class="ad-import-stats" id="adImportStats"></div>' +
                        '<div style="margin:12px 0;">' +
                            '<label style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);cursor:pointer;margin-bottom:8px;">' +
                                '<input type="checkbox" id="adImportChkCreate" checked> ' + L.plrImportCreateNew +
                            '</label>' +
                            '<label style="display:flex;align-items:center;gap:8px;color:var(--text-secondary);cursor:pointer;">' +
                                '<input type="checkbox" id="adImportChkUpdate" checked> ' + L.plrImportUpdatePts +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-modal-footer" id="adImportFooter" style="display:none;">' +
                    '<button class="ad-btn ad-btn-outline" id="adImportCancelBtn">' + (isEn ? 'Cancel' : 'Отмена') + '</button>' +
                    '<button class="ad-btn" id="adImportDoBtn" style="margin-left:8px;">' + L.plrImportBtn + '</button>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        // State
        var workbook = null;
        var sheetData = [];
        var headers = [];
        var mapping = {};
        var existingPlayers = [];
        var parsedRows = [];

        var FIELD_DEFS = [
            { key: 'name', label: L.plrImportColName, required: true, patterns: ['имя', 'name', 'фио', 'фамилия', 'игрок', 'player'] },
            { key: 'name_en', label: L.plrImportColNameEn, required: false, patterns: ['name_en', 'name en', 'имя en', 'english'] },
            { key: 'category', label: L.plrImportColCategory, required: false, patterns: ['категория', 'category', 'разряд', 'cat'] },
            { key: 'points', label: L.plrImportColPoints, required: false, patterns: ['очки', 'points', 'рейтинг', 'rating', 'баллы'] },
            { key: 'ntrp', label: L.plrImportColNtrp, required: false, patterns: ['ntrp', 'нтрп'] },
            { key: 'country', label: L.plrImportColCountry, required: false, patterns: ['страна', 'country', 'код', 'code'] }
        ];

        // Close modal
        function closeModal() { overlay.remove(); }
        document.getElementById('adImportClose').addEventListener('click', closeModal);
        document.getElementById('adImportCancelBtn').addEventListener('click', closeModal);
        overlay.addEventListener('click', function(e) { if (e.target === overlay) closeModal(); });

        // Step 1: File select (dropzone + drag & drop)
        var dropzone = document.getElementById('adImportDropzone');
        var fileInput = document.getElementById('adImportFileInput');

        dropzone.addEventListener('click', function() { fileInput.click(); });

        dropzone.addEventListener('dragover', function(e) {
            e.preventDefault();
            dropzone.classList.add('drag-over');
        });
        dropzone.addEventListener('dragleave', function() {
            dropzone.classList.remove('drag-over');
        });
        dropzone.addEventListener('drop', function(e) {
            e.preventDefault();
            dropzone.classList.remove('drag-over');
            if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
        });

        fileInput.addEventListener('change', function(e) {
            if (e.target.files[0]) handleFile(e.target.files[0]);
        });

        function handleFile(file) {
            // Show selected file info
            var info = document.getElementById('adImportFileInfo');
            info.innerHTML = '<div class="ad-import-file-selected">' +
                '<span>\ud83d\udcc4</span>' +
                '<span class="file-name">' + A.esc(file.name) + '</span>' +
                '<span style="color:var(--text-dim);font-size:0.75rem;">' + (file.size / 1024).toFixed(1) + ' KB</span>' +
                '<button class="file-remove" id="adImportFileRemove">&times;</button>' +
            '</div>';
            info.style.display = '';
            dropzone.style.display = 'none';

            document.getElementById('adImportFileRemove').addEventListener('click', function() {
                info.style.display = 'none';
                dropzone.style.display = '';
                fileInput.value = '';
                document.getElementById('adImportSheetWrap').style.display = 'none';
            });

            var reader = new FileReader();
            reader.onload = function(ev) {
                try {
                    workbook = XLSX.read(ev.target.result, { type: 'array' });
                } catch (err) {
                    A.toast('Error reading file: ' + err.message, 'error');
                    return;
                }
                var names = workbook.SheetNames;
                if (names.length > 1) {
                    var sel = document.getElementById('adImportSheetSelect');
                    sel.innerHTML = names.map(function(n) { return '<option>' + A.esc(n) + '</option>'; }).join('');
                    document.getElementById('adImportSheetWrap').style.display = '';
                    sel.addEventListener('change', function() { parseSheet(sel.value); });
                }
                parseSheet(names[0]);
            };
            reader.readAsArrayBuffer(file);
        }

        function parseSheet(name) {
            var ws = workbook.Sheets[name];
            var json = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });
            if (!json.length) { A.toast(L.plrImportNoData, 'warning'); return; }
            headers = json[0].map(function(h) { return String(h).trim(); });
            sheetData = json.slice(1).filter(function(row) {
                return row.some(function(c) { return String(c).trim() !== ''; });
            });
            showMappingStep();
        }

        // Step 2: Column mapping
        function showMappingStep() {
            document.getElementById('adImportStep1').style.display = 'none';
            document.getElementById('adImportStep2').style.display = '';

            var container = document.getElementById('adImportMapFields');
            container.innerHTML = '';

            FIELD_DEFS.forEach(function(fd) {
                var row = document.createElement('div');
                row.className = 'ad-import-map-row';

                var lbl = document.createElement('label');
                lbl.textContent = fd.label + (fd.required ? ' *' : '');

                var sel = document.createElement('select');
                sel.className = 'ad-field-input';
                sel.dataset.field = fd.key;
                sel.style.cssText = 'flex:1;';

                var noneOpt = '<option value="-1">' + L.plrImportNone + '</option>';
                var opts = headers.map(function(h, i) {
                    return '<option value="' + i + '">' + A.esc(h) + '</option>';
                }).join('');
                sel.innerHTML = noneOpt + opts;

                // Auto-guess
                var guessed = autoGuessColumn(fd.patterns);
                if (guessed !== -1) sel.value = String(guessed);

                row.appendChild(lbl);
                row.appendChild(sel);
                container.appendChild(row);
            });

            // Next button
            var nextBtn = document.createElement('button');
            nextBtn.className = 'ad-btn';
            nextBtn.textContent = L.plrImportPreview + ' \u2192';
            nextBtn.style.cssText = 'margin-top:12px;';
            nextBtn.addEventListener('click', function() {
                // Collect mapping
                mapping = {};
                var selects = container.querySelectorAll('select');
                var nameSet = false;
                selects.forEach(function(s) {
                    var v = parseInt(s.value, 10);
                    if (v >= 0) mapping[s.dataset.field] = v;
                    if (s.dataset.field === 'name' && v >= 0) nameSet = true;
                });
                if (!nameSet) {
                    A.toast(L.plrImportColName + ' — ' + (isEn ? 'required' : 'обязательно'), 'error');
                    return;
                }
                showPreviewStep();
            });
            container.appendChild(nextBtn);
        }

        function autoGuessColumn(patterns) {
            for (var i = 0; i < headers.length; i++) {
                var h = headers[i].toLowerCase();
                for (var j = 0; j < patterns.length; j++) {
                    if (h.indexOf(patterns[j]) !== -1) return i;
                }
            }
            return -1;
        }

        // Step 3: Preview
        async function showPreviewStep() {
            document.getElementById('adImportStep2').style.display = 'none';
            document.getElementById('adImportStep3').style.display = '';
            document.getElementById('adImportFooter').style.display = '';

            // Load existing players for matching
            var res = await A.client.from('players').select('id,name,name_en,category_id,points,ntrp_rating');
            existingPlayers = res.data || [];

            var existingMap = {};
            existingPlayers.forEach(function(p) {
                existingMap[p.name.trim().toLowerCase()] = p;
            });

            parsedRows = [];
            sheetData.forEach(function(row) {
                var name = mapping.name !== undefined ? String(row[mapping.name]).trim() : '';
                if (!name) { parsedRows.push({ name: '', status: 'error', raw: row }); return; }

                var entry = { name: name, raw: row, status: 'create' };
                if (mapping.name_en !== undefined) entry.name_en = String(row[mapping.name_en]).trim();
                if (mapping.category !== undefined) entry.categoryText = String(row[mapping.category]).trim();
                if (mapping.points !== undefined) entry.points = parseFloat(row[mapping.points]) || 0;
                if (mapping.ntrp !== undefined) entry.ntrp = parseFloat(row[mapping.ntrp]) || 0;
                if (mapping.country !== undefined) entry.country = String(row[mapping.country]).trim();

                // Match category text to id
                if (entry.categoryText) {
                    var catText = entry.categoryText.toLowerCase();
                    var found = A.cachedCategories.find(function(c) {
                        return c.name.toLowerCase() === catText || (c.name_en && c.name_en.toLowerCase() === catText);
                    });
                    if (found) entry.category_id = found.id;
                }

                // Match existing player
                var key = name.trim().toLowerCase();
                if (existingMap[key]) {
                    entry.status = 'update';
                    entry.existingId = existingMap[key].id;
                    entry.existing = existingMap[key];
                }

                parsedRows.push(entry);
            });

            renderPreview();

            document.getElementById('adImportDoBtn').addEventListener('click', doImport);
        }

        function renderPreview() {
            var table = document.getElementById('adImportPreviewTable');
            var countUpdate = 0, countCreate = 0, countError = 0;

            var html = '<thead><tr>' +
                '<th>' + L.plrName + '</th>' +
                (mapping.category !== undefined ? '<th>' + L.plrCategory + '</th>' : '') +
                (mapping.points !== undefined ? '<th>' + L.plrPoints + '</th>' : '') +
                '<th style="width:40px;">' + L.thStatus + '</th>' +
            '</tr></thead><tbody>';

            var limit = Math.min(parsedRows.length, 20);
            for (var i = 0; i < parsedRows.length; i++) {
                var r = parsedRows[i];
                if (r.status === 'update') countUpdate++;
                else if (r.status === 'create') countCreate++;
                else countError++;

                if (i < limit) {
                    var statusIcon = r.status === 'update' ? '\ud83d\udd04' : r.status === 'create' ? '\u2795' : '\u26a0\ufe0f';
                    var statusCls = 'ad-import-status-' + r.status;
                    html += '<tr>' +
                        '<td>' + A.esc(r.name || '???') + '</td>' +
                        (mapping.category !== undefined ? '<td>' + A.esc(r.categoryText || '—') + '</td>' : '') +
                        (mapping.points !== undefined ? '<td>' + (r.points !== undefined ? r.points : '—') + '</td>' : '') +
                        '<td><span class="' + statusCls + '">' + statusIcon + '</span></td>' +
                    '</tr>';
                }
            }
            html += '</tbody>';
            table.innerHTML = html;

            var total = parsedRows.length;
            document.getElementById('adImportStats').innerHTML =
                '<span>' + (isEn ? 'Found' : 'Найдено') + ': <strong>' + total + '</strong> ' + L.plrImportRows + '</span>' +
                '<span>\ud83d\udd04 ' + L.plrImportUpdated + ': <strong>' + countUpdate + '</strong></span>' +
                '<span>\u2795 ' + L.plrImportCreated + ': <strong>' + countCreate + '</strong></span>' +
                '<span>\u26a0\ufe0f ' + (isEn ? 'Errors' : 'Ошибки') + ': <strong>' + countError + '</strong></span>';
        }

        // Step 4: Do import
        async function doImport() {
            var doBtn = document.getElementById('adImportDoBtn');
            doBtn.disabled = true;
            doBtn.textContent = '...';

            var createNew = document.getElementById('adImportChkCreate').checked;
            var updatePts = document.getElementById('adImportChkUpdate').checked;
            var created = 0, updated = 0, skipped = 0;

            for (var i = 0; i < parsedRows.length; i++) {
                var r = parsedRows[i];
                if (r.status === 'error') { skipped++; continue; }

                if (r.status === 'update' && updatePts) {
                    var upd = {};
                    if (r.points !== undefined) upd.points = r.points;
                    if (r.category_id) upd.category_id = r.category_id;
                    if (r.ntrp) upd.ntrp_rating = r.ntrp;
                    if (r.name_en) upd.name_en = r.name_en;
                    if (r.country) upd.country = r.country;
                    if (Object.keys(upd).length > 0) {
                        await A.client.from('players').update(upd).eq('id', r.existingId);
                    }
                    updated++;
                } else if (r.status === 'create' && createNew) {
                    var ins = { name: r.name };
                    ins.id = A.slugify(r.name);
                    if (!ins.id) { skipped++; continue; }
                    if (r.name_en) ins.name_en = r.name_en;
                    if (r.category_id) ins.category_id = r.category_id;
                    if (r.points !== undefined) ins.points = r.points;
                    if (r.ntrp) ins.ntrp_rating = r.ntrp;
                    if (r.country) ins.country = r.country;

                    var res = await A.client.from('players').insert(ins);
                    if (res.error) {
                        // Slug conflict — try with suffix
                        ins.id = ins.id + '-' + Math.random().toString(36).slice(2, 6);
                        await A.client.from('players').insert(ins);
                    }
                    created++;
                } else {
                    skipped++;
                }
            }

            A.toast(L.plrImportSuccess + ': ' + L.plrImportUpdated + ' ' + updated + ', ' + L.plrImportCreated + ' ' + created + ', ' + L.plrImportSkipped + ' ' + skipped, 'success');
            closeModal();
            loadPlayersList();
        }
    }

    // ---- Export to namespace ----
    A.renderPlayersSection = renderPlayersSection;
    A.renderPlayersList = renderPlayersList;
    A.loadAndEditPlayer = loadAndEditPlayer;
    A.loadPointsRules = loadPointsRules;
    A.ROUND_KEYS = ROUND_KEYS;
    A.ROUND_LABELS = ROUND_LABELS;

})();
