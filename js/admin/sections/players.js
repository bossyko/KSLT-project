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

    async function renderPlayersSection() {
        await A.loadCategories();
        if (A.isDeepLinked('players')) return;
        renderPlayersList();
    }

    // ---- Players List ----
    async function renderPlayersList() {
        var container = document.getElementById('ad-players');
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
            .select('id,name,photo,country,category_id,points,wins,losses,rank_change')
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
                    '<td style="font-weight:500;color:var(--text-primary);">' + (p.country || '') + ' ' + (p.name || L.noData) + '</td>' +
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
            // Look up linked profile gender
            var profRes = await A.client.from('profiles').select('gender').eq('player_id', id).single();
            if (profRes.data && profRes.data.gender) {
                result.data._gender = profRes.data.gender; // 'male' or 'female'
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

        // Badges checkboxes
        var badgesHtml = '';
        var currentBadges = (item && item.badges) ? item.badges : [];
        Object.keys(A.PLAYER_BADGES).forEach(function(key) {
            var checked = currentBadges.indexOf(key) !== -1 ? ' checked' : '';
            badgesHtml += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-plr-badge" value="' + key + '"' + checked + '> ' + A.PLAYER_BADGES[key] + '</label>';
        });

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

            // Badges
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.plrBadges + '</div>' +
                '<div class="ad-badges-grid" id="adPlrBadges">' + badgesHtml + '</div>' +
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
            '</div>';

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
            renderPlayersList();
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

            // Collect badges
            var badges = [];
            document.querySelectorAll('.ad-plr-badge:checked').forEach(function(cb) {
                badges.push(cb.value);
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
                badges: badges,
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
                    var profRes = await A.client.from('profiles').select('gender').eq('player_id', plrEditingId).single();
                    if (profRes.data && profRes.data.gender) {
                        fresh.data._gender = profRes.data.gender;
                    }
                    renderPlayerForm(fresh.data);
                }
            } else {
                renderPlayersList();
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
        renderPlayersList();
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

    // ---- Export to namespace ----
    A.renderPlayersSection = renderPlayersSection;
    A.renderPlayersList = renderPlayersList;
    A.loadAndEditPlayer = loadAndEditPlayer;

})();
