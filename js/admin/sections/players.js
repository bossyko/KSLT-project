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

        // Category options
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        A.cachedCategories.forEach(function(c) {
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

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adPlrSave">' + L.save + '</button>' +
                (plrEditingId ? '<button class="ad-btn ad-btn-danger" id="adPlrDelete">' + L.delete + '</button>' : '') +
            '</div>';

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

            var data = {
                name: name,
                name_en: document.getElementById('adPlrNameEn').value.trim() || null,
                name_kg: document.getElementById('adPlrNameKg').value.trim() || null,
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
            renderPlayersList();
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


    // ---- Export to namespace ----
    A.renderPlayersSection = renderPlayersSection;
    A.renderPlayersList = renderPlayersList;
    A.loadAndEditPlayer = loadAndEditPlayer;

})();
