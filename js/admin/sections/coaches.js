// ============================================
// KSLT Admin — Coaches CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var cchEditingId = null;
    var cchImageFile = null;
    var cchImageUrl = '';
    var cchSearchQuery = '';
    var cchFilterTag = '';
    var cchAchievements = [];
    var cchAchievementsEn = [];
    var cchPage = 1;
    var cchAllData = [];
    var CCH_PER_PAGE = 15;
    var cchPartnerServices = [];
    var cchPartnerPin = '';

    var COACH_TAGS = {
        adults: isEn ? 'Adults' : 'Взрослые',
        kids: isEn ? 'Kids' : 'Дети',
        individual: isEn ? 'Individual' : 'Индивидуальные',
        group: isEn ? 'Group' : 'Групповые',
        beginner: isEn ? 'Beginner' : 'Начинающие',
        advanced: isEn ? 'Advanced' : 'Продвинутые'
    };

    function renderCoachesSection() {
        if (A.isDeepLinked('coaches')) return;
        renderCoachesList();
    }

    // ---- Coaches List ----
    function renderCoachesList() {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        var tagFilterHtml = '<option value="">' + L.cchAllTags + '</option>';
        Object.keys(COACH_TAGS).forEach(function(key) {
            tagFilterHtml += '<option value="' + key + '"' + (cchFilterTag === key ? ' selected' : '') + '>' + COACH_TAGS[key] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.coaches + '</h2>' +
            '</div>' +
            // Stat cards
            '<div class="ad-cch-stats-grid">' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatTotal + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatTotal">...</div>' +
                '</div>' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatPromoted + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatPromoted">...</div>' +
                '</div>' +
                '<div class="ad-cch-stat-card">' +
                    '<div class="ad-cch-stat-label">' + L.cchStatNew + '</div>' +
                    '<div class="ad-cch-stat-value" id="adCchStatNew">...</div>' +
                '</div>' +
            '</div>' +
            // Filter row
            '<div class="ad-filter-row ad-filter-sticky" id="adCchFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCchSearch" placeholder="' + L.cchSearch + '" value="' + A.esc(cchSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCchTagFilter">' + tagFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adCchAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addCoach + '</button>' +
            '</div>' +
            // Table
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adCchTable">' +
                        '<colgroup>' +
                            '<col style="width:40px;">' +
                            '<col style="width:36px;">' +
                            '<col style="min-width:130px;">' +
                            '<col style="width:130px;">' +
                            '<col style="width:120px;">' +
                            '<col style="width:140px;">' +
                            '<col style="width:80px;">' +
                            '<col style="width:80px;">' +
                            '<col style="width:50px;">' +
                        '</colgroup>' +
                        '<thead><tr>' +
                            '<th style="width:36px;"></th>' +
                            '<th>' + (isEn ? 'Name' : 'ФИО') + '</th>' +
                            '<th>' + L.cchPosition + '</th>' +
                            '<th>' + L.cchCourt + '</th>' +
                            '<th>' + L.cchTags + '</th>' +
                            '<th style="text-align:center;">' + (isEn ? 'Price' : 'Цена') + '</th>' +
                            '<th style="text-align:center;">' + L.cchPromoted + '</th>' +
                            '<th style="text-align:center;width:50px;">&#128065;</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="9" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        document.getElementById('adCchAdd').addEventListener('click', function() {
            renderCoachForm(null);
        });

        var searchTimer = null;
        document.getElementById('adCchSearch').addEventListener('input', function() {
            cchSearchQuery = this.value;
            cchPage = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { applyCchFilters(); }, 300);
        });
        document.getElementById('adCchTagFilter').addEventListener('change', function() {
            cchFilterTag = this.value;
            cchPage = 1;
            applyCchFilters();
        });

        loadCoachesList();
    }

    function applyCchFilters() {
        var items = cchAllData.slice();

        // Client-side tag filter
        if (cchFilterTag) {
            items = items.filter(function(r) {
                return (r.tags || []).indexOf(cchFilterTag) !== -1;
            });
        }

        // Client-side search
        if (cchSearchQuery) {
            var q = cchSearchQuery.toLowerCase();
            items = items.filter(function(r) {
                var name = ((r.last_name || '') + ' ' + (r.first_name || '')).toLowerCase();
                return name.indexOf(q) !== -1;
            });
        }

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / CCH_PER_PAGE));
        if (cchPage > totalPages) cchPage = totalPages;
        var start = (cchPage - 1) * CCH_PER_PAGE;
        var pageItems = items.slice(start, start + CCH_PER_PAGE);

        renderCchRows(pageItems);
        renderCchPagination(items.length, totalPages);
    }

    function renderCchRows(items) {
        var table = document.getElementById('adCchTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        var editBtnHtml = '<button class="ad-crt-edit-btn" title="' + L.cchViewEdit + '" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:1rem;padding:4px;border-radius:4px;transition:color 0.15s;">✏️</button>';

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🎓</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noCoaches + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noCoachesText + '</div>' +
                '</td></tr>';
            return;
        }

        var html = '';
        items.forEach(function(row) {
            var fullName = isEn
                ? ((row.last_name_en || row.last_name || '') + ' ' + (row.first_name_en || row.first_name || ''))
                : ((row.last_name || '') + ' ' + (row.first_name || ''));
            var pos = isEn ? (row.position_en || row.position || '') : (row.position || '');
            var courtText = A.esc(row.court || '—');
            var tagsHtml = '';
            (row.tags || []).forEach(function(t) {
                tagsHtml += '<span class="ad-cch-tag-badge">' + (COACH_TAGS[t] || t) + '</span>';
            });
            if (!tagsHtml) tagsHtml = '<span style="color:var(--text-dim);">—</span>';
            var promotedHtml = row.promoted ? '<span style="color:var(--accent);">⭐</span>' : '—';

            html += '<tr data-id="' + row.id + '">' +
                A.bulkCheckboxTd(row.id) +
                '<td style="text-align:center;">' + editBtnHtml + '</td>' +
                '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(fullName.trim()) + '</td>' +
                '<td>' + A.esc(pos) + '</td>' +
                '<td>' + courtText + '</td>' +
                '<td>' + tagsHtml + '</td>' +
                '<td style="font-weight:600;color:var(--accent);text-align:center;">' + (row.price || '—') + '</td>' +
                '<td style="text-align:center;">' + promotedHtml + '</td>' +
                '<td style="text-align:center;color:var(--text-dim);">' + ((row.view_count || 0) > 0 ? row.view_count : '\u2014') + '</td>' +
            '</tr>';
        });
        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            // Edit button → direct edit
            if (e.target.closest('.ad-crt-edit-btn')) {
                var row = e.target.closest('tr[data-id]');
                if (row) loadAndEditCoach(row.dataset.id);
                return;
            }
            // Row click → snapshot view
            var row = e.target.closest('tr[data-id]');
            if (!row) return;
            loadAndViewCoach(row.dataset.id);
        });

        A.setupBulkDelete({ tableId: 'adCchTable', tableName: 'coaches', reloadFn: loadCoachesList });
    }

    function renderCchPagination(totalItems, totalPages) {
        var existing = document.getElementById('adCchPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adCchPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        html += '<button class="ad-crt-page-btn" data-page="' + (cchPage - 1) + '"' + (cchPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === cchPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="ad-crt-page-btn" data-page="' + (cchPage + 1) + '"' + (cchPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adCchTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            cchPage = parseInt(btn.dataset.page, 10);
            applyCchFilters();
        });
    }

    function updateCchStats() {
        var totalEl = document.getElementById('adCchStatTotal');
        var promotedEl = document.getElementById('adCchStatPromoted');
        var newEl = document.getElementById('adCchStatNew');
        if (!totalEl) return;

        var total = cchAllData.length;
        var promoted = cchAllData.filter(function(c) { return c.promoted; }).length;

        // New this month
        var now = new Date();
        var monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
        var newCount = cchAllData.filter(function(c) {
            return c.created_at && c.created_at.slice(0, 10) >= monthStart;
        }).length;

        totalEl.textContent = total;
        promotedEl.textContent = promoted;
        newEl.textContent = newCount;
    }

    async function loadCoachesList() {
        if (!A.client) return;

        await syncAllExpiredPromotedCoaches();

        var query = A.client.from('coaches')
            .select('id,last_name,first_name,last_name_en,first_name_en,photo,position,position_en,court,tags,price,promoted,view_count,created_at')
            .order('created_at', { ascending: false });

        var result = await query;
        if (result.error) { A.showToast(result.error.message, 'error'); return; }

        cchAllData = result.data || [];
        updateCchStats();
        applyCchFilters();
    }

    // ---- Snapshot View ----
    async function loadAndViewCoach(id) {
        if (!A.client) return;
        var result = await A.client.from('coaches').select('*').eq('id', id).single();
        if (!result.data) return;

        var payments = await A.client.from('entity_payments')
            .select('*')
            .eq('entity_type', 'coach')
            .eq('entity_id', String(id))
            .order('created_at', { ascending: false });

        A.setAdminHash('coaches', 'view', id);
        renderCoachView(result.data, payments.data || []);
    }

    function renderCoachView(item, payments) {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        var today = new Date().toISOString().slice(0, 10);

        var fullName = isEn
            ? ((item.last_name_en || item.last_name || '') + ' ' + (item.first_name_en || item.first_name || ''))
            : ((item.last_name || '') + ' ' + (item.first_name || ''));
        var pos = isEn ? (item.position_en || item.position || '') : (item.position || '');
        var tagsHtml = '';
        (item.tags || []).forEach(function(t) {
            tagsHtml += '<span class="ad-cch-tag-badge" style="margin-right:4px;">' + (COACH_TAGS[t] || t) + '</span>';
        });
        if (!tagsHtml) tagsHtml = '<span style="color:var(--text-dim);">—</span>';

        var promotedHtml = item.promoted
            ? '<span class="ad-pay-badge ad-pay-active">⭐ ' + L.cchPromotedBadge + '</span>'
            : '<span style="color:var(--text-dim);">—</span>';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml =
                '<div style="text-align:center;padding:30px 20px;color:var(--text-dim);">' +
                    '<div style="font-size:1.5rem;opacity:0.3;margin-bottom:6px;">💰</div>' +
                    L.cchViewNoPayments +
                '</div>';
        } else {
            paymentsHtml =
                '<table class="ad-table" style="margin:0;">' +
                    '<thead><tr>' +
                        '<th>' + L.crtViewPurpose + '</th>' +
                        '<th>' + L.crtViewAmount + '</th>' +
                        '<th>' + L.crtViewActiveUntil + '</th>' +
                        '<th>' + L.crtViewMethod + '</th>' +
                        '<th>' + L.crtViewStatus + '</th>' +
                    '</tr></thead><tbody>';

            payments.forEach(function(p) {
                var isActive = p.period_end >= today;
                var statusBadge = isActive
                    ? '<span class="ad-pay-badge ad-pay-active">' + L.payActive + '</span>'
                    : '<span class="ad-pay-badge ad-pay-expired">' + L.payExpired + '</span>';
                var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (A.PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';

                paymentsHtml +=
                    '<tr>' +
                        '<td>' + purposeBadge + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                        '<td style="font-size:0.85rem;">' + A.formatPayDate(p.period_end) + '</td>' +
                        '<td>' + (A.PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                    '</tr>';
            });

            paymentsHtml += '</tbody></table>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.cchViewTitle + '</h2>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adCchViewEditBtn">' + L.cchViewEdit + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adCchViewBackBtn">' + L.back + '</button>' +
                '</div>' +
            '</div>' +

            // Info card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchViewInfo + '</div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:0.9rem;">' +
                    '<span style="color:var(--text-dim);">' + (isEn ? 'Name' : 'ФИО') + '</span>' +
                    '<span style="color:var(--text-primary);font-weight:500;">' + A.esc(fullName.trim()) + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPosition + '</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(pos || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchCourt + '</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(item.court || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchExperience + '</span>' +
                    '<span style="color:var(--text-secondary);">' + (item.experience || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPrice + '</span>' +
                    '<span style="color:var(--text-secondary);font-weight:600;">' + (item.price || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchTags + '</span>' +
                    '<span>' + tagsHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.cchPromoted + '</span>' +
                    '<span>' + promotedHtml + '</span>' +
                '</div>' +
            '</div>' +

            // Payments card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchViewPayments + '</div>' +
                paymentsHtml +
            '</div>';

        document.getElementById('adCchViewEditBtn').addEventListener('click', function() {
            A.setAdminHash('coaches', 'edit', item.id);
            renderCoachForm(item);
        });

        document.getElementById('adCchViewBackBtn').addEventListener('click', function() {
            A.setAdminHash('coaches');
            renderCoachesList();
        });
    }

    async function loadAndEditCoach(id) {
        if (!A.client) return;
        var result = await A.client.from('coaches').select('*').eq('id', id).single();
        if (result.error) { A.showToast(result.error.message, 'error'); return; }
        A.setAdminHash('coaches', 'edit', id);
        renderCoachForm(result.data);
    }

    async function syncAllExpiredPromotedCoaches() {
        if (!A.client) return;
        var today = new Date().toISOString().slice(0, 10);

        var promoted = await A.client.from('coaches').select('id').eq('promoted', true);
        var ids = (promoted.data || []).map(function(c) { return String(c.id); });
        if (ids.length === 0) return;

        var payments = await A.client.from('entity_payments')
            .select('entity_id')
            .eq('entity_type', 'coach')
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .in('entity_id', ids);

        var activeIds = {};
        (payments.data || []).forEach(function(p) { activeIds[p.entity_id] = true; });

        for (var i = 0; i < ids.length; i++) {
            if (!activeIds[ids[i]]) {
                await A.client.from('coaches').update({ promoted: false }).eq('id', ids[i]);
            }
        }
    }

    // ---- Coach Form ----
    async function renderCoachForm(item) {
        var container = document.getElementById('ad-coaches');
        if (!container) return;

        cchEditingId = item ? item.id : null;
        cchImageFile = null;
        cchImageUrl = (item && item.photo) ? item.photo : '';
        cchAchievements = (item && item.achievements) ? item.achievements.slice() : [];
        cchAchievementsEn = (item && item.achievements_en) ? item.achievements_en.slice() : [];
        cchPartnerPin = (item && item.partner_pin) ? item.partner_pin : '';
        cchPartnerServices = [];

        // Load courts from DB for dropdown
        var courtsList = [];
        if (A.client) {
            var cRes = await A.client.from('courts').select('id,name,name_en').order('name');
            if (cRes.data) courtsList = cRes.data;
        }
        var courtOptionsHtml = '<option value="">' + (isEn ? '— Select —' : '— Выберите —') + '</option>';
        courtsList.forEach(function(c) {
            var courtName = isEn ? (c.name_en || c.name) : c.name;
            var sel = (item && item.court === c.name) ? ' selected' : '';
            courtOptionsHtml += '<option value="' + A.esc(c.id) + '" data-name="' + A.esc(c.name) + '" data-name-en="' + A.esc(c.name_en || '') + '"' + sel + '>' + A.esc(courtName) + '</option>';
        });

        // Helper: strip phone to local digits for display (remove +996 prefix)
        function phoneToLocal(phone) {
            if (!phone) return '';
            var d = phone.replace(/\D/g, '');
            if (d.indexOf('996') === 0) d = d.substr(3);
            if (d.length > 9) d = d.substr(0, 9);
            var f = '';
            if (d.length > 0) f = d.substr(0, 3);
            if (d.length > 3) f += ' ' + d.substr(3, 2);
            if (d.length > 5) f += '-' + d.substr(5, 2);
            if (d.length > 7) f += '-' + d.substr(7, 2);
            return f;
        }

        var title = item ? L.editCoach : L.addCoach;

        var imagePreviewHtml = cchImageUrl
            ? '<img src="' + A.esc(cchImageUrl) + '" class="ad-image-upload-preview" id="adCchImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adCchImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = cchImageUrl ? ' has-image' : '';

        // Tags checkboxes
        var currentTags = (item && item.tags) ? item.tags : [];
        var tagsHtml = '';
        Object.keys(COACH_TAGS).forEach(function(key) {
            var checked = currentTags.indexOf(key) !== -1 ? ' checked' : '';
            tagsHtml += '<label style="display:inline-flex;align-items:center;gap:6px;margin-right:16px;margin-bottom:8px;cursor:pointer;">' +
                '<input type="checkbox" class="ad-cch-tag" value="' + key + '"' + checked + ' style="width:18px;height:18px;accent-color:var(--accent);appearance:auto;-webkit-appearance:auto;">' +
                '<span>' + COACH_TAGS[key] + '</span>' +
            '</label>';
        });

        // Achievements list helpers
        function renderAchievementsHtml() {
            var html = '';
            cchAchievements.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement" data-idx="' + idx + '" value="' + A.esc(ach) + '" style="flex:1;">' +
                    (cchAchievements.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            return html;
        }
        function renderAchievementsEnHtml() {
            var html = '';
            cchAchievementsEn.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement-en" data-idx="' + idx + '" value="' + A.esc(ach) + '" style="flex:1;">' +
                    (cchAchievementsEn.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-en-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            return html;
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adCchBack">' + L.back + '</button>' +
            '</div>' +

            // Promoted badge (read-only)
            (item && item.promoted
                ? '<div class="ad-form-card"><span class="ad-pay-badge ad-pay-active">⭐ ' + L.cchPromotedBadge + '</span> <span style="color:var(--text-dim);font-size:0.8rem;">' + L.cchPromotedHint + '</span></div>'
                : '') +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchPhoto + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adCchImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adCchImgInput" style="display:none">' +
                '<div style="display:flex;gap:8px;margin-top:8px;">' +
                    '<input type="text" class="ad-field-input" id="adCchImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (cchImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // ФИО (Last Name / First Name / Patronymic) — RU
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Full Name' : 'ФИО') + '</div>' +
                '<div style="font-weight:600;margin-bottom:6px;">RU</div>' +
                '<div class="ad-form-row" style="grid-template-columns:1fr 1fr 1fr;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchLastName" value="' + A.esc(item ? item.last_name : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchFirstName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchFirstName" value="' + A.esc(item ? item.first_name : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPatronymic + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPatronymic" value="' + A.esc(item ? item.patronymic : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div style="font-weight:600;margin-top:14px;margin-bottom:6px;">EN' +
                    '<button type="button" class="ad-btn-translate" data-src="adCchLastName" data-target="adCchLastNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchLastName + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchLastNameEn" value="' + A.esc(item ? item.last_name_en : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchFirstName + ' ' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchFirstName" data-target="adCchFirstNameEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchFirstNameEn" value="' + A.esc(item ? item.first_name_en : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Position + Tags
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchPosition + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPosition" placeholder="' + (isEn ? 'Head coach' : 'Старший тренер') + '" value="' + A.esc(item ? item.position : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchPosition" data-target="adCchPositionEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchPositionEn" value="' + A.esc(item ? item.position_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field" style="margin-top:12px;">' +
                    '<label class="ad-field-label">' + L.cchTags + '</label>' +
                    '<div>' + tagsHtml + '</div>' +
                '</div>' +
            '</div>' +

            // Stats + Price (experience + price only)
            '<div class="ad-form-card">' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchExperience + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adCchExp" value="' + (item ? item.experience || '' : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPrice + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adCchPrice" value="' + (item ? item.price || '' : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Court (dropdown from DB)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchCourt + '</div>' +
                '<select class="ad-field-input" id="adCchCourt">' + courtOptionsHtml + '</select>' +
            '</div>' +

            // Contacts
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Contacts' : 'Контакты') + '</div>' +
                '<div class="ad-form-row" style="grid-template-columns:1fr 1fr 1fr;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchPhone + '</label>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                            '<span style="white-space:nowrap;font-weight:600;color:var(--accent);">🇰🇬 +996</span>' +
                            '<input type="text" class="ad-field-input ad-cch-phone-fmt" id="adCchPhone" placeholder="555 12-34-56" value="' + phoneToLocal(item ? item.phone : '') + '" inputmode="numeric">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchTelegram + '</label>' +
                        '<input type="text" class="ad-field-input" id="adCchTelegram" placeholder="@username" value="' + A.esc(item ? item.telegram : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.cchWhatsapp + '</label>' +
                        '<div style="display:flex;align-items:center;gap:6px;">' +
                            '<span style="white-space:nowrap;font-weight:600;color:var(--accent);">🇰🇬 +996</span>' +
                            '<input type="text" class="ad-field-input ad-cch-phone-fmt" id="adCchWhatsapp" placeholder="555 12-34-56" value="' + phoneToLocal(item ? item.whatsapp : '') + '" inputmode="numeric">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Short description
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchShortDesc + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchShortDesc" rows="2">' + A.esc(item ? item.short_desc : '') + '</textarea>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchShortDesc" data-target="adCchShortDescEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchShortDescEn" rows="2">' + A.esc(item ? item.short_desc_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Bio
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchBio + '</div>' +
                '<div class="ad-form-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">RU</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchBio" rows="4">' + A.esc(item ? item.bio : '') + '</textarea>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">EN' +
                            '<button type="button" class="ad-btn-translate" data-src="adCchBio" data-target="adCchBioEn" data-tolang="en">&#127760; ' + L.translateBtn + '</button>' +
                        '</label>' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCchBioEn" rows="4">' + A.esc(item ? item.bio_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Achievements RU
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchAchievements + '</div>' +
                '<div style="font-weight:600;margin-bottom:6px;">RU</div>' +
                '<div id="adCchAchievements">' + renderAchievementsHtml() + '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchAchAdd">' + L.cchAchievementAdd + '</button>' +
                '<div style="font-weight:600;margin-top:14px;margin-bottom:6px;">EN' +
                    '<button type="button" class="ad-btn-translate" id="adCchAchTranslateAll">&#127760; ' + L.translateBtn + '</button>' +
                '</div>' +
                '<div id="adCchAchievementsEn">' + renderAchievementsEnHtml() + '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchAchAddEn">' + L.cchAchievementAdd + '</button>' +
            '</div>' +

            // Partner section
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.cchPartnerSection + '</div>' +
                '<label class="ad-checkbox-label" style="margin-bottom:12px;">' +
                    '<input type="checkbox" id="adCchPartner"' + (item && item.partner ? ' checked' : '') + '> ' + L.cchPartner +
                '</label>' +
                '<div id="adCchPartnerBody" style="display:' + (item && item.partner ? 'block' : 'none') + ';">' +
                    '<div class="ad-form-row" style="align-items:flex-end;">' +
                        '<div class="ad-field" style="flex:0 0 200px;">' +
                            '<label class="ad-field-label">' + L.cchPartnerPin + '</label>' +
                            '<div style="display:flex;gap:6px;">' +
                                '<input type="text" class="ad-field-input" id="adCchPartnerPin" value="' + A.esc(cchPartnerPin) + '" readonly style="font-size:1.2rem;letter-spacing:4px;text-align:center;font-weight:700;">' +
                                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchResetPin">' + L.cchResetPin + '</button>' +
                            '</div>' +
                        '</div>' +
                    '</div>' +
                    '<div style="margin-top:16px;">' +
                        '<label class="ad-field-label">' + (isEn ? 'Partner Services' : 'Услуги партнёра') + '</label>' +
                        '<div style="display:grid;grid-template-columns:1fr 100px 40px;gap:8px;margin-bottom:4px;font-size:0.75rem;color:var(--text-dim);">' +
                            '<span>' + L.cchServiceName + '</span>' +
                            '<span>' + L.cchDiscount + '</span>' +
                            '<span></span>' +
                        '</div>' +
                        '<div id="adCchPartnerServicesRows"></div>' +
                        '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCchAddService" style="margin-top:8px;">' + L.cchAddService + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-form-actions">' +
                '<button class="ad-btn ad-btn-primary" id="adCchSave">' + L.save + '</button>' +
                (cchEditingId ? '<button class="ad-btn ad-btn-danger" id="adCchDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // Back
        document.getElementById('adCchBack').addEventListener('click', function() {
            A.setAdminHash('coaches');
            renderCoachesList();
        });

        // Achievements RU: add/remove/edit
        function renderAchievementsUI() {
            var el = document.getElementById('adCchAchievements');
            if (!el) return;
            var html = '';
            cchAchievements.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement" data-idx="' + idx + '" value="' + A.esc(ach) + '" style="flex:1;">' +
                    (cchAchievements.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            el.innerHTML = html;
        }
        document.getElementById('adCchAchAdd').addEventListener('click', function() {
            cchAchievements.push('');
            renderAchievementsUI();
        });
        document.getElementById('adCchAchievements').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-cch-ach-remove');
            if (!rmBtn) return;
            cchAchievements.splice(parseInt(rmBtn.dataset.idx, 10), 1);
            renderAchievementsUI();
        });
        document.getElementById('adCchAchievements').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement')) return;
            cchAchievements[parseInt(e.target.dataset.idx, 10)] = e.target.value;
        });

        // Achievements EN: add/remove/edit
        function renderAchievementsEnUI() {
            var el = document.getElementById('adCchAchievementsEn');
            if (!el) return;
            var html = '';
            cchAchievementsEn.forEach(function(ach, idx) {
                html += '<div style="display:flex;gap:6px;margin-bottom:6px;">' +
                    '<input type="text" class="ad-field-input ad-cch-achievement-en" data-idx="' + idx + '" value="' + A.esc(ach) + '" style="flex:1;">' +
                    (cchAchievementsEn.length > 1 ? '<button type="button" class="ad-btn-icon ad-cch-ach-en-remove" data-idx="' + idx + '">&times;</button>' : '') +
                '</div>';
            });
            el.innerHTML = html;
        }
        document.getElementById('adCchAchAddEn').addEventListener('click', function() {
            cchAchievementsEn.push('');
            renderAchievementsEnUI();
        });
        document.getElementById('adCchAchievementsEn').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-cch-ach-en-remove');
            if (!rmBtn) return;
            cchAchievementsEn.splice(parseInt(rmBtn.dataset.idx, 10), 1);
            renderAchievementsEnUI();
        });
        document.getElementById('adCchAchievementsEn').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement-en')) return;
            cchAchievementsEn[parseInt(e.target.dataset.idx, 10)] = e.target.value;
        });

        // Translate all achievements RU → EN
        document.getElementById('adCchAchTranslateAll').addEventListener('click', function() {
            var btn = this;
            var ruItems = cchAchievements.filter(function(a) { return a.trim(); });
            if (ruItems.length === 0) { A.showToast(L.fillRuFirst, 'error'); return; }
            var origLabel = btn.textContent;
            btn.textContent = L.translating;
            btn.disabled = true;
            var joined = ruItems.join('\n');
            A.translateFromRu(joined, 'en').then(function(result) {
                var translated = result.split('\n');
                cchAchievementsEn = [];
                for (var i = 0; i < ruItems.length; i++) {
                    cchAchievementsEn.push(translated[i] || '');
                }
                renderAchievementsEnUI();
                btn.textContent = origLabel;
                btn.disabled = false;
            }).catch(function() {
                A.showToast(L.translateError, 'error');
                btn.textContent = origLabel;
                btn.disabled = false;
            });
        });

        // Image upload
        var imgZone = document.getElementById('adCchImgZone');
        var imgInput = document.getElementById('adCchImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                cchImageFile = imgInput.files[0];
                previewCchImage(URL.createObjectURL(cchImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                cchImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewCchImage(URL.createObjectURL(cchImageFile));
            }
        });

        setupCchImgRemove();

        document.getElementById('adCchImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adCchImgUrl').value.trim();
            if (url) {
                cchImageFile = null;
                cchImageUrl = url;
                previewCchImage(url);
            }
        });

        // Phone/WhatsApp formatting (KG: +996 XXX XX-XX-XX)
        container.querySelectorAll('.ad-cch-phone-fmt').forEach(function(inp) {
            inp.addEventListener('input', function() {
                var digits = inp.value.replace(/\D/g, '');
                if (digits.length > 9) digits = digits.substr(0, 9);
                var formatted = '';
                if (digits.length > 0) formatted = digits.substr(0, 3);
                if (digits.length > 3) formatted += ' ' + digits.substr(3, 2);
                if (digits.length > 5) formatted += '-' + digits.substr(5, 2);
                if (digits.length > 7) formatted += '-' + digits.substr(7, 2);
                inp.value = formatted;
            });
        });

        // Auto-transliterate names RU → EN on blur
        var cchNamePairs = [
            ['adCchLastName', 'adCchLastNameEn'],
            ['adCchFirstName', 'adCchFirstNameEn']
        ];
        cchNamePairs.forEach(function(pair) {
            var srcEl = document.getElementById(pair[0]);
            var targetEl = document.getElementById(pair[1]);
            if (!srcEl || !targetEl) return;
            srcEl.addEventListener('blur', function() {
                var srcText = srcEl.value.trim();
                if (!srcText || targetEl.value.trim()) return;
                targetEl.value = A.transliterate(srcText);
            });
        });

        // Auto-translate text fields RU → EN on blur (API)
        var cchTranslatePairs = [
            ['adCchPosition', 'adCchPositionEn'],
            ['adCchShortDesc', 'adCchShortDescEn'],
            ['adCchBio', 'adCchBioEn']
        ];
        cchTranslatePairs.forEach(function(pair) {
            var srcEl = document.getElementById(pair[0]);
            var targetEl = document.getElementById(pair[1]);
            if (!srcEl || !targetEl) return;
            srcEl.addEventListener('blur', function() {
                var srcText = srcEl.value.trim();
                if (!srcText || targetEl.value.trim()) return;
                targetEl.placeholder = L.translating || 'Translating...';
                A.translateFromRu(srcText, 'en').then(function(result) {
                    if (!targetEl.value.trim()) targetEl.value = result;
                    targetEl.placeholder = '';
                }).catch(function() {
                    targetEl.placeholder = '';
                });
            });
        });

        // Auto-translate achievements RU → EN on blur
        document.getElementById('adCchAchievements').addEventListener('focusout', function(e) {
            if (!e.target.classList.contains('ad-cch-achievement')) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            var ruText = cchAchievements[idx];
            if (!ruText || !ruText.trim()) return;
            // Ensure EN slot exists
            while (cchAchievementsEn.length <= idx) cchAchievementsEn.push('');
            if (cchAchievementsEn[idx] && cchAchievementsEn[idx].trim()) return;
            A.translateFromRu(ruText, 'en').then(function(result) {
                if (!cchAchievementsEn[idx] || !cchAchievementsEn[idx].trim()) {
                    cchAchievementsEn[idx] = result;
                    renderAchievementsEnUI();
                }
            }).catch(function() {});
        });

        // Manual translate buttons (fallback)
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

        // Partner toggle
        document.getElementById('adCchPartner').addEventListener('change', function() {
            var body = document.getElementById('adCchPartnerBody');
            if (body) body.style.display = this.checked ? 'block' : 'none';
            if (this.checked && !cchPartnerPin) {
                cchPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
                document.getElementById('adCchPartnerPin').value = cchPartnerPin;
            }
            if (this.checked && cchPartnerServices.length === 0) {
                cchPartnerServices.push({ id: null, service_name: L.cchDefaultService, service_name_en: '', service_name_kg: '', discount_percent: 0 });
                renderCchPartnerServices();
            }
        });
        document.getElementById('adCchResetPin').addEventListener('click', function() {
            cchPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
            document.getElementById('adCchPartnerPin').value = cchPartnerPin;
        });
        document.getElementById('adCchAddService').addEventListener('click', function() {
            cchPartnerServices.push({ id: null, service_name: '', service_name_en: '', service_name_kg: '', discount_percent: 0 });
            renderCchPartnerServices();
        });
        // Load partner services if editing
        if (cchEditingId && item && item.partner) {
            loadCchPartnerServices(cchEditingId);
            if (!cchPartnerPin) {
                cchPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
                document.getElementById('adCchPartnerPin').value = cchPartnerPin;
            }
        }

        // Save
        document.getElementById('adCchSave').addEventListener('click', saveCoachHandler);

        // Delete
        var delBtn = document.getElementById('adCchDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                A.showConfirm(L.cchDeleteConfirm, L.deleteConfirmText, function() {
                    deleteCoachHandler();
                });
            });
        }
    }

    function previewCchImage(src) {
        var zone = document.getElementById('adCchImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adCchImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adCchImgRemove">&times;</button>';
        setupCchImgRemove();
    }

    function setupCchImgRemove() {
        var rmBtn = document.getElementById('adCchImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                cchImageFile = null;
                cchImageUrl = '';
                var zone = document.getElementById('adCchImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adCchImgUrl').value = '';
                document.getElementById('adCchImgInput').value = '';
            });
        }
    }

    // ---- Partner Services (Coaches) ----
    async function loadCchPartnerServices(coachId) {
        if (!A.client) return;
        var result = await A.client.from('partner_services')
            .select('*')
            .eq('entity_type', 'coach')
            .eq('entity_id', coachId)
            .order('sort_order', { ascending: true });
        cchPartnerServices = (result.data && result.data.length) ? result.data : [];
        if (cchPartnerServices.length === 0) {
            cchPartnerServices.push({ id: null, service_name: L.cchDefaultService, service_name_en: '', service_name_kg: '', discount_percent: 0 });
        }
        renderCchPartnerServices();
    }

    function renderCchPartnerServices() {
        var container = document.getElementById('adCchPartnerServicesRows');
        if (!container) return;
        var html = '';
        cchPartnerServices.forEach(function(svc, idx) {
            html += '<div class="ad-partner-svc-row" data-idx="' + idx + '" style="display:grid;grid-template-columns:1fr 100px 40px;gap:8px;margin-bottom:6px;align-items:center;">' +
                '<input type="text" class="ad-field-input ad-psvc-name" value="' + A.esc(svc.service_name || '') + '" placeholder="' + L.cchServiceName + '">' +
                '<input type="number" class="ad-field-input ad-psvc-discount" value="' + (svc.discount_percent || '') + '" min="1" max="100" placeholder="%">' +
                (cchPartnerServices.length > 1 ? '<button type="button" class="ad-btn-icon ad-psvc-remove">&times;</button>' : '<div></div>') +
            '</div>';
        });
        container.innerHTML = html;

        container.addEventListener('input', function(e) {
            var row = e.target.closest('.ad-partner-svc-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-psvc-name')) cchPartnerServices[idx].service_name = e.target.value.trim();
            if (e.target.classList.contains('ad-psvc-discount')) cchPartnerServices[idx].discount_percent = parseInt(e.target.value, 10) || 0;
        });
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('ad-psvc-remove')) {
                var row = e.target.closest('.ad-partner-svc-row');
                var idx = parseInt(row.dataset.idx, 10);
                cchPartnerServices.splice(idx, 1);
                renderCchPartnerServices();
            }
        });
    }

    async function saveCchPartnerData(coachId) {
        if (!A.client) return;
        var isPartner = document.getElementById('adCchPartner').checked;
        if (!isPartner) return;

        await A.client.from('coaches').update({ partner_pin: cchPartnerPin }).eq('id', coachId);

        var existing = await A.client.from('partner_services')
            .select('id')
            .eq('entity_type', 'coach')
            .eq('entity_id', coachId);
        var existingIds = (existing.data || []).map(function(s) { return s.id; });
        var keepIds = cchPartnerServices.filter(function(s) { return s.id; }).map(function(s) { return s.id; });
        var toDelete = existingIds.filter(function(id) { return keepIds.indexOf(id) === -1; });

        if (toDelete.length) {
            await A.client.from('partner_services').delete().in('id', toDelete);
        }

        for (var i = 0; i < cchPartnerServices.length; i++) {
            var svc = cchPartnerServices[i];
            if (!svc.service_name) continue;
            var row = {
                entity_type: 'coach',
                entity_id: coachId,
                service_name: svc.service_name,
                service_name_en: svc.service_name_en || null,
                service_name_kg: svc.service_name_kg || null,
                discount_percent: svc.discount_percent || 0,
                sort_order: i,
                is_active: true
            };
            if (svc.id) {
                await A.client.from('partner_services').update(row).eq('id', svc.id);
            } else {
                await A.client.from('partner_services').insert(row);
            }
        }
    }

    // ---- Save Coach ----
    async function saveCoachHandler() {
        var saveBtn = document.getElementById('adCchSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Photo
            var imageUrl = cchImageUrl;
            if (cchImageFile) {
                imageUrl = await A.uploadImage(cchImageFile, 'cch-');
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Tags
            var tags = [];
            document.querySelectorAll('.ad-cch-tag:checked').forEach(function(cb) {
                tags.push(cb.value);
            });

            // Achievements (filter empty)
            var achievements = cchAchievements.filter(function(a) { return a.trim(); });

            var lastName = document.getElementById('adCchLastName').value.trim();
            var firstName = document.getElementById('adCchFirstName').value.trim();
            var lastNameEn = document.getElementById('adCchLastNameEn').value.trim();
            var firstNameEn = document.getElementById('adCchFirstNameEn').value.trim();

            // Court from dropdown
            var courtSelect = document.getElementById('adCchCourt');
            var courtOpt = courtSelect.options[courtSelect.selectedIndex];
            var courtName = courtOpt && courtOpt.dataset.name ? courtOpt.dataset.name : '';
            var courtNameEn = courtOpt && courtOpt.dataset.nameEn ? courtOpt.dataset.nameEn : '';

            // Phone & WhatsApp: add +996 prefix
            var phoneLocal = document.getElementById('adCchPhone').value.replace(/\D/g, '');
            var waLocal = document.getElementById('adCchWhatsapp').value.replace(/\D/g, '');

            var data = {
                last_name: lastName || null,
                first_name: firstName || null,
                patronymic: document.getElementById('adCchPatronymic').value.trim() || null,
                last_name_en: lastNameEn || null,
                first_name_en: firstNameEn || null,
                name: (lastName + ' ' + firstName).trim(),
                name_en: (lastNameEn + ' ' + firstNameEn).trim() || null,
                photo: imageUrl || null,
                position: document.getElementById('adCchPosition').value.trim() || null,
                position_en: document.getElementById('adCchPositionEn').value.trim() || null,
                tags: tags,
                experience: parseInt(document.getElementById('adCchExp').value, 10) || 0,
                price: parseInt(document.getElementById('adCchPrice').value, 10) || 0,
                short_desc: document.getElementById('adCchShortDesc').value.trim() || null,
                short_desc_en: document.getElementById('adCchShortDescEn').value.trim() || null,
                bio: document.getElementById('adCchBio').value.trim() || null,
                bio_en: document.getElementById('adCchBioEn').value.trim() || null,
                achievements: achievements,
                achievements_en: cchAchievementsEn.filter(function(a) { return a.trim(); }),
                court: courtName || null,
                court_en: courtNameEn || null,
                phone: phoneLocal ? '+996' + phoneLocal : null,
                telegram: document.getElementById('adCchTelegram').value.trim() || null,
                whatsapp: waLocal ? '+996' + waLocal : null,
                partner: document.getElementById('adCchPartner').checked
            };

            if (!lastName) {
                A.showToast(isEn ? 'Last name is required' : 'Фамилия обязательна', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (cchEditingId) {
                result = await A.client.from('coaches').update(data).eq('id', cchEditingId);
            } else {
                data.id = A.slugify(lastName + ' ' + firstName);
                result = await A.client.from('coaches').insert(data);
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Save partner services
            var coachId = cchEditingId || data.id;
            await saveCchPartnerData(coachId);

            A.showToast(L.saved, 'success');
            renderCoachesList();
        } catch (e) {
            A.showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Coach ----
    async function deleteCoachHandler() {
        if (!cchEditingId) return;
        var result = await A.client.from('coaches').delete().eq('id', cchEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderCoachesList();
    }


    // ---- Export to namespace ----
    A.renderCoachesSection = renderCoachesSection;
    A.renderCoachesList = renderCoachesList;
    A.loadAndEditCoach = loadAndEditCoach;
    A.loadAndViewCoach = loadAndViewCoach;

})();
