// ============================================
// KSLT Admin — Sponsors CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var spnEditingId = null;
    var spnImageFile = null;
    var spnImageUrl = '';

    // ---- Section init ----
    function renderSponsorsSection() {
        if (A.isDeepLinked('sponsors')) return;
        renderSponsorsList();
    }

    // ---- List ----
    async function renderSponsorsList() {
        var container = document.getElementById('ad-sponsors');
        if (!container) return;

        container.innerHTML = '<div class="ad-loading">' + L.saving + '</div>';

        var res = await A.client.from('sponsors').select('*').order('sort_order');
        var data = res.data || [];

        var rows = '';
        data.forEach(function(s) {
            var logoHtml = s.logo
                ? '<img src="' + A.esc(s.logo) + '" style="width:40px;height:24px;object-fit:contain;border-radius:4px;background:var(--bg-elevated);">'
                : '<span style="color:var(--text-dim)">—</span>';
            var urlHtml = s.url
                ? '<a href="' + A.esc(s.url) + '" target="_blank" style="color:var(--accent)">' + A.esc(s.url.replace(/^https?:\/\//, '').slice(0, 30)) + '</a>'
                : '—';
            var heroHtml = s.is_hero ? '<span style="color:var(--accent)">✓</span>' : '—';

            rows += '<tr>' +
                A.bulkCheckboxTd(s.id) +
                '<td>' + logoHtml + '</td>' +
                '<td>' + A.esc(s.name) + '</td>' +
                '<td>' + urlHtml + '</td>' +
                '<td style="text-align:center">' + heroHtml + '</td>' +
                '<td style="text-align:center">' + (s.sort_order || 0) + '</td>' +
                '<td><button class="ad-btn ad-btn-sm" data-edit="' + s.id + '">' + L.editSponsor + '</button></td>' +
            '</tr>';
        });

        var emptyHtml = !data.length
            ? '<div class="ad-empty"><h3>' + L.sponNoItems + '</h3><p>' + L.sponNoItemsText + '</p></div>'
            : '';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + (A.SECTION_ICONS.sponsors || '') + ' ' + L.sponsors + '</h2>' +
                '<div class="ad-section-actions">' +
                    '<button class="ad-btn ad-btn-primary" id="spnAddBtn">' + L.addSponsor + '</button>' +
                '</div>' +
            '</div>' +
            (data.length ? (
                '<div class="ad-bulk-bar" id="spnBulkBar" style="display:none">' +
                    '<span id="spnBulkCount">0</span> ' + L.deleteSelected.toLowerCase() +
                    ' <button class="ad-btn ad-btn-danger ad-btn-sm" id="spnBulkDeleteBtn">' + L.deleteSelected + '</button>' +
                '</div>' +
                '<div class="ad-table-wrap"><table class="ad-table">' +
                    '<thead><tr>' +
                        '<th style="width:36px"><input type="checkbox" id="spnCheckAll"></th>' +
                        '<th style="width:50px">' + L.sponLogo + '</th>' +
                        '<th>' + L.sponName + '</th>' +
                        '<th>' + L.sponUrl + '</th>' +
                        '<th style="text-align:center">' + L.sponIsHero + '</th>' +
                        '<th style="text-align:center;width:80px">' + L.sponSort + '</th>' +
                        '<th style="width:120px"></th>' +
                    '</tr></thead>' +
                    '<tbody>' + rows + '</tbody>' +
                '</table></div>'
            ) : emptyHtml);

        // Add button
        var addBtn = document.getElementById('spnAddBtn');
        if (addBtn) addBtn.onclick = function() { renderSponsorForm(null); };

        // Edit buttons
        container.querySelectorAll('[data-edit]').forEach(function(btn) {
            btn.onclick = function() {
                loadAndEditSponsor(btn.dataset.edit);
            };
        });

        // Bulk delete
        if (data.length) {
            A.setupBulkDelete({
                checkAllId: 'spnCheckAll',
                bulkBarId: 'spnBulkBar',
                bulkCountId: 'spnBulkCount',
                bulkDeleteBtnId: 'spnBulkDeleteBtn',
                table: 'sponsors',
                onDone: renderSponsorsList
            });
        }
    }

    // ---- Load & Edit ----
    async function loadAndEditSponsor(id) {
        var res = await A.client.from('sponsors').select('*').eq('id', id).single();
        if (res.error || !res.data) return;
        renderSponsorForm(res.data);
    }

    // ---- Image preview HTML ----
    function buildImagePreview(url) {
        if (url) {
            return '<img src="' + A.esc(url) + '" class="ad-image-upload-preview" style="aspect-ratio:auto;max-height:120px;object-fit:contain;">' +
                   '<button type="button" class="ad-image-upload-remove" id="spnImgRemove">&times;</button>';
        }
        return '<div class="ad-image-upload-placeholder">' +
                   '<div class="ad-image-upload-icon">📷</div>' +
                   '<div>' + L.uploadImage + '</div>' +
                   '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
               '</div>';
    }

    // ---- Form ----
    function renderSponsorForm(sponsor) {
        var container = document.getElementById('ad-sponsors');
        if (!container) return;

        var isEdit = !!(sponsor && sponsor.id);
        spnEditingId = isEdit ? sponsor.id : null;
        spnImageFile = null;
        spnImageUrl = isEdit ? (sponsor.logo || '') : '';

        var hasImage = !!spnImageUrl;

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + (isEdit ? L.editSponsor : L.addSponsor) + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="spnBackBtn">' + L.back + '</button>' +
            '</div>' +
            '<form id="spnForm">' +
                // Card 1: Basic info
                '<div class="ad-form-card">' +
                    '<div class="ad-form-card-title">' + L.sponName + '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.sponName + ' *</label>' +
                        '<input type="text" class="ad-field-input" id="spnName" value="' + A.esc(isEdit ? sponsor.name : '') + '" required>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.sponUrl + '</label>' +
                        '<input type="url" class="ad-field-input" id="spnUrl" value="' + A.esc(isEdit ? (sponsor.url || '') : '') + '" placeholder="https://...">' +
                    '</div>' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.sponSort + '</label>' +
                            '<input type="number" class="ad-field-input" id="spnSortOrder" value="' + (isEdit ? (sponsor.sort_order || 0) : 0) + '">' +
                        '</div>' +
                        '<div class="ad-field" style="display:flex;align-items:flex-end;padding-bottom:4px;">' +
                            '<label class="ad-checkbox-label">' +
                                '<input type="checkbox" id="spnIsHero"' + (isEdit && sponsor.is_hero ? ' checked' : '') + '>' +
                                L.sponIsHero +
                            '</label>' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                // Card 2: Logo
                '<div class="ad-form-card">' +
                    '<div class="ad-form-card-title">' + L.sponLogo + '</div>' +
                    '<div class="ad-image-upload' + (hasImage ? ' has-image' : '') + '" id="spnUploadZone">' +
                        buildImagePreview(spnImageUrl) +
                    '</div>' +
                    '<input type="file" accept="image/jpeg,image/png,image/webp,image/gif" id="spnLogoFile" style="display:none">' +
                    '<div class="ad-image-url-row">' +
                        '<input type="text" class="ad-field-input" id="spnLogoUrl" placeholder="' + L.orPasteUrl + '" value="' + A.esc(spnImageUrl) + '">' +
                        '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="spnApplyUrl">' + L.applyUrl + '</button>' +
                    '</div>' +
                '</div>' +
                // Actions
                '<div class="ad-form-actions">' +
                    '<button type="submit" class="ad-btn ad-btn-primary" id="spnSaveBtn">' + L.save + '</button>' +
                    (isEdit ? '<button type="button" class="ad-btn ad-btn-danger" id="spnDeleteBtn">' + L.delete + '</button>' : '') +
                '</div>' +
            '</form>';

        // ---- Upload zone click ----
        var uploadZone = document.getElementById('spnUploadZone');
        var fileInput = document.getElementById('spnLogoFile');

        uploadZone.onclick = function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            fileInput.click();
        };

        fileInput.onchange = function() {
            if (!fileInput.files || !fileInput.files[0]) return;
            spnImageFile = fileInput.files[0];
            var reader = new FileReader();
            reader.onload = function(ev) {
                spnImageUrl = ev.target.result;
                uploadZone.classList.add('has-image');
                uploadZone.innerHTML = buildImagePreview(ev.target.result);
                bindRemoveBtn();
            };
            reader.readAsDataURL(spnImageFile);
        };

        // ---- Remove button ----
        function bindRemoveBtn() {
            var rm = document.getElementById('spnImgRemove');
            if (rm) {
                rm.onclick = function(e) {
                    e.stopPropagation();
                    spnImageFile = null;
                    spnImageUrl = '';
                    uploadZone.classList.remove('has-image');
                    uploadZone.innerHTML = buildImagePreview('');
                    document.getElementById('spnLogoUrl').value = '';
                };
            }
        }
        bindRemoveBtn();

        // ---- Apply URL ----
        document.getElementById('spnApplyUrl').onclick = function() {
            var url = document.getElementById('spnLogoUrl').value.trim();
            if (url) {
                spnImageUrl = url;
                spnImageFile = null;
                uploadZone.classList.add('has-image');
                uploadZone.innerHTML = buildImagePreview(url);
                bindRemoveBtn();
            }
        };

        // ---- Back ----
        document.getElementById('spnBackBtn').onclick = function() {
            A.setAdminHash('sponsors');
            renderSponsorsList();
        };

        // ---- Delete ----
        var delBtn = document.getElementById('spnDeleteBtn');
        if (delBtn) {
            delBtn.onclick = function() {
                A.showConfirm(L.sponDeleteConfirm, L.deleteConfirmText, async function() {
                    await A.client.from('sponsors').delete().eq('id', spnEditingId);
                    A.showToast(L.sponDeleted);
                    A.setAdminHash('sponsors');
                    renderSponsorsList();
                });
            };
        }

        // ---- Submit ----
        document.getElementById('spnForm').onsubmit = async function(e) {
            e.preventDefault();
            var submitBtn = document.getElementById('spnSaveBtn');
            submitBtn.disabled = true;
            submitBtn.textContent = L.saving;

            var logoUrl = spnImageUrl;

            // Upload file if selected
            if (spnImageFile) {
                var uploaded = await A.uploadImage(spnImageFile, 'sponsor-');
                if (uploaded) logoUrl = uploaded;
            }

            var payload = {
                name: document.getElementById('spnName').value.trim(),
                logo: logoUrl || null,
                url: document.getElementById('spnUrl').value.trim() || null,
                is_hero: document.getElementById('spnIsHero').checked,
                sort_order: parseInt(document.getElementById('spnSortOrder').value) || 0
            };

            var res;
            if (spnEditingId) {
                res = await A.client.from('sponsors').update(payload).eq('id', spnEditingId);
            } else {
                res = await A.client.from('sponsors').insert(payload);
            }

            if (res.error) {
                submitBtn.disabled = false;
                submitBtn.textContent = L.save;
                A.showToast(res.error.message, 'error');
                return;
            }

            A.showToast(L.sponSaved);
            A.setAdminHash('sponsors');
            renderSponsorsList();
        };

        // Set hash
        if (isEdit) {
            A.setAdminHash('sponsors', 'edit', sponsor.id);
        }
    }

    // ---- Exports ----
    A.renderSponsorsSection = renderSponsorsSection;
    A.renderSponsorsList = renderSponsorsList;
    A.loadAndEditSponsor = loadAndEditSponsor;

})();
