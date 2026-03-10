// ============================================
// KSLT Admin — Courts CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var crtEditingId = null;
    var crtImageFile = null;
    var crtImageUrl = '';
    var crtGalleryUrls = [];
    var crtGalleryFiles = [];
    var crtFilterType = '';
    var crtFilterSurface = '';
    var crtSortCol = 'name';
    var crtSortAsc = true;
    var crtAllData = [];
    var crtSearchQuery = '';
    var crtPage = 1;
    var CRT_PER_PAGE = 10;
    var crtCourtTypes = [];
    var crtPhones = [];

    async function renderCourtsSection() {
        if (A.isDeepLinked('courts')) return;
        renderCourtsList();
    }

    // ---- Courts List ----

    function crtColHeader(col, label) {
        var sortable = col === 'name' || col === 'price' || col === 'count' || col === 'city' || col === 'type' || col === 'surface' || col === 'partner';
        if (!sortable) return '<th>' + label + '</th>';
        var isActive = crtSortCol === col;
        var cls = 'ad-col-header' + (isActive ? ' ad-col-active' : '');
        return '<th><div class="' + cls + '" data-col="' + col + '">' +
            '<span>' + label + '</span>' +
            (isActive ? '<span class="ad-sort-arrow">' + (crtSortAsc ? '↑' : '↓') + '</span>' : '') +
            '<span class="ad-col-filter-btn">▼</span>' +
        '</div></th>';
    }

    function openCrtColDropdown(col, hdr) {
        var dd = document.getElementById('adCrtColDropdown');
        if (!dd) return;

        if (dd.style.display === 'block' && dd.dataset.col === col) {
            dd.style.display = 'none';
            return;
        }
        dd.dataset.col = col;

        var rect = hdr.getBoundingClientRect();
        var cardRect = dd.parentElement.getBoundingClientRect();
        dd.style.left = Math.max(0, rect.left - cardRect.left) + 'px';
        dd.style.top = (rect.bottom - cardRect.top + 4) + 'px';

        var colLabels = { name: L.crtName, price: L.crtPrice, count: isEn ? 'Count' : 'Кол-во', city: L.crtCity, type: L.crtType, surface: L.crtSurface, partner: L.crtPartner };
        var isNumeric = col === 'price' || col === 'count' || col === 'partner';

        var html = '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';

        if (isNumeric) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Most first' : '↓ Сначала больше') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Least first' : '↑ Сначала меньше') + '</div>';
        } else {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ A → Z' : '↑ А → Я') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Z → A' : '↓ Я → А') + '</div>';
        }

        dd.innerHTML = html;
        dd.style.display = 'block';

        // Sort click
        dd.querySelectorAll('.ad-col-dd-sort').forEach(function(el) {
            el.addEventListener('click', function(ev) {
                ev.stopPropagation();
                crtSortCol = col;
                crtSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateCrtColHeaders();
                applyCrtFilters();
            });
        });

    }

    function updateCrtColHeaders() {
        var table = document.getElementById('adCrtTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = crtSortCol === c;
            hdr.classList.toggle('ad-col-active', isActive);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = crtSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
        });
    }

    function updateCourtStats() {
        var outdoorEl = document.getElementById('adCrtStatOutdoor');
        var indoorEl = document.getElementById('adCrtStatIndoor');
        var totalOutEl = document.getElementById('adCrtTotalOutdoor');
        var totalInEl = document.getElementById('adCrtTotalIndoor');
        if (!outdoorEl || !indoorEl) return;

        var stats = { outdoor: {}, indoor: {} };
        crtAllData.forEach(function(c) {
            (c.court_types || []).forEach(function(t) {
                var type = t.type || 'indoor';
                var surface = t.surface || 'hard';
                var count = t.count || 1;
                if (!stats[type]) stats[type] = {};
                stats[type][surface] = (stats[type][surface] || 0) + count;
            });
        });

        var surfaceKeys = ['hard', 'clay', 'carpet'];
        ['outdoor', 'indoor'].forEach(function(type) {
            var el = type === 'outdoor' ? outdoorEl : indoorEl;
            var totalEl = type === 'outdoor' ? totalOutEl : totalInEl;
            var total = 0;
            surfaceKeys.forEach(function(s) { total += (stats[type][s] || 0); });

            if (totalEl) totalEl.textContent = total;

            var html = '';
            surfaceKeys.forEach(function(s) {
                var cnt = stats[type][s] || 0;
                if (cnt > 0) {
                    var pct = total > 0 ? Math.round(cnt / total * 100) : 0;
                    html += '<div class="ad-crt-stat-row">' +
                        '<span class="ad-crt-stat-surface">' + (A.COURT_SURFACES[s] || s) + '</span>' +
                        '<div class="ad-crt-stat-bar-wrap"><div class="ad-crt-stat-bar" style="width:' + pct + '%;"></div></div>' +
                        '<span class="ad-crt-stat-count">' + cnt + '</span>' +
                    '</div>';
                }
            });
            el.innerHTML = html;
        });
    }

    function getFilteredCrtTypes(c) {
        var types = c.court_types || [];
        if (crtFilterType) {
            types = types.filter(function(t) { return t.type === crtFilterType; });
        }
        if (crtFilterSurface) {
            types = types.filter(function(t) { return t.surface === crtFilterSurface; });
        }
        return types;
    }

    function applyCrtFilters() {
        var items = crtAllData.slice();

        // Filter — keep courts that have at least one matching type
        if (crtFilterType || crtFilterSurface) {
            items = items.filter(function(c) {
                return getFilteredCrtTypes(c).length > 0;
            });
        }

        // Search by name
        if (crtSearchQuery) {
            var q = crtSearchQuery.toLowerCase();
            items = items.filter(function(c) {
                return (c.name || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        // Client-side sort for price/count (sum of visible types only)
        if (crtSortCol === 'price') {
            items.sort(function(a, b) {
                var va = getFilteredCrtTypes(a).reduce(function(s, t) { return s + (t.price || 0); }, 0);
                var vb = getFilteredCrtTypes(b).reduce(function(s, t) { return s + (t.price || 0); }, 0);
                return crtSortAsc ? va - vb : vb - va;
            });
        } else if (crtSortCol === 'count') {
            items.sort(function(a, b) {
                var va = getFilteredCrtTypes(a).reduce(function(s, t) { return s + (t.count || 0); }, 0);
                var vb = getFilteredCrtTypes(b).reduce(function(s, t) { return s + (t.count || 0); }, 0);
                return crtSortAsc ? va - vb : vb - va;
            });
        } else if (crtSortCol === 'city') {
            items.sort(function(a, b) {
                var va = (a.city || '').toLowerCase();
                var vb = (b.city || '').toLowerCase();
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'type') {
            items.sort(function(a, b) {
                var va = ((a.court_types || [])[0] || {}).type || '';
                var vb = ((b.court_types || [])[0] || {}).type || '';
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'surface') {
            items.sort(function(a, b) {
                var va = ((a.court_types || [])[0] || {}).surface || '';
                var vb = ((b.court_types || [])[0] || {}).surface || '';
                return crtSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (crtSortCol === 'partner') {
            items.sort(function(a, b) {
                var va = a.partner ? 1 : 0;
                var vb = b.partner ? 1 : 0;
                return crtSortAsc ? va - vb : vb - va;
            });
        }
        // name sort is handled server-side (default)

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / CRT_PER_PAGE));
        if (crtPage > totalPages) crtPage = totalPages;
        var start = (crtPage - 1) * CRT_PER_PAGE;
        var pageItems = items.slice(start, start + CRT_PER_PAGE);

        renderCrtRows(pageItems);
        renderCrtPagination(items.length, totalPages);
    }

    function renderCrtRows(items) {
        var table = document.getElementById('adCrtTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        var editBtnHtml = '<button class="ad-crt-edit-btn" title="' + L.crtViewEdit + '" style="background:none;border:none;cursor:pointer;color:var(--text-dim);font-size:1rem;padding:4px;border-radius:4px;transition:color 0.15s;">✏️</button>';

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="11" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏟️</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noCourts + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noCourtsText + '</div>' +
                '</td></tr>';
            return;
        }

        var html = '';
        items.forEach(function(c) {
            var types = getFilteredCrtTypes(c);
            var rowCount = Math.max(1, types.length);
            var partnerHtml = c.partner ? '<span class="ad-partner-badge">✓</span>' : '';
            var promotedHtml = c.promoted ? '<span style="color:var(--accent);">⭐</span>' : '—';
            var cityText = A.esc(c.city || '—');

            if (types.length === 0) {
                html +=
                    '<tr data-crt-id="' + c.id + '">' +
                        A.bulkCheckboxTd(c.id) +
                        '<td style="text-align:center;">' + editBtnHtml + '</td>' +
                        '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(c.name || L.noData) + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td style="text-align:center;">' + L.noData + '</td>' +
                        '<td>' + L.noData + '</td>' +
                        '<td>' + cityText + '</td>' +
                        '<td style="text-align:center;">' + partnerHtml + '</td>' +
                        '<td style="text-align:center;">' + promotedHtml + '</td>' +
                    '</tr>';
            } else {
                // First row with rowspan
                var t0 = types[0];
                html +=
                    '<tr data-crt-id="' + c.id + '">' +
                        '<td class="ad-bulk-cell" rowspan="' + rowCount + '" style="width:36px;text-align:center;vertical-align:middle;">' +
                            '<input type="checkbox" class="ad-bulk-item" data-bulk-id="' + c.id + '" style="width:18px;height:18px;accent-color:var(--accent);cursor:pointer;">' +
                        '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + editBtnHtml + '</td>' +
                        '<td rowspan="' + rowCount + '" style="font-weight:500;color:var(--text-primary);vertical-align:middle;">' + A.esc(c.name || L.noData) + '</td>' +
                        '<td><span class="ad-type-badge ad-type-' + (t0.type || 'indoor') + '">' + (A.COURT_TYPES[t0.type] || t0.type || '') + '</span></td>' +
                        '<td style="text-align:center;">' + (A.COURT_SURFACES[t0.surface] || t0.surface || '') + '</td>' +
                        '<td style="text-align:center;">' + (t0.count || 1) + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + (t0.price || 0) + '</td>' +
                        '<td rowspan="' + rowCount + '" style="vertical-align:middle;">' + cityText + '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + partnerHtml + '</td>' +
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;">' + promotedHtml + '</td>' +
                    '</tr>';

                // Sub-rows
                for (var i = 1; i < types.length; i++) {
                    var ti = types[i];
                    html +=
                        '<tr class="ad-crt-subrow" data-crt-id="' + c.id + '">' +
                            '<td><span class="ad-type-badge ad-type-' + (ti.type || 'indoor') + '">' + (A.COURT_TYPES[ti.type] || ti.type || '') + '</span></td>' +
                            '<td style="text-align:center;">' + (A.COURT_SURFACES[ti.surface] || ti.surface || '') + '</td>' +
                            '<td style="text-align:center;">' + (ti.count || 1) + '</td>' +
                            '<td style="font-weight:600;color:var(--accent);">' + (ti.price || 0) + '</td>' +
                        '</tr>';
                }
            }
        });

        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            // Edit button → direct edit
            if (e.target.closest('.ad-crt-edit-btn')) {
                var row = e.target.closest('tr[data-crt-id]');
                if (row) loadAndEditCourt(row.dataset.crtId);
                return;
            }
            // Row click → snapshot view
            var row = e.target.closest('tr[data-crt-id]');
            if (!row) return;
            loadAndViewCourt(row.dataset.crtId);
        });

        A.setupBulkDelete({ tableId: 'adCrtTable', tableName: 'courts', reloadFn: loadCourtsList });
    }

    function renderCrtPagination(totalItems, totalPages) {
        var existing = document.getElementById('adCrtPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adCrtPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        // Prev
        html += '<button class="ad-crt-page-btn" data-page="' + (crtPage - 1) + '"' + (crtPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        // Page numbers
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === crtPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        // Next
        html += '<button class="ad-crt-page-btn" data-page="' + (crtPage + 1) + '"' + (crtPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        // Info
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adCrtTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            crtPage = parseInt(btn.dataset.page, 10);
            applyCrtFilters();
        });
    }

    async function renderCourtsList() {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        var typeFilterHtml = '<option value="">' + L.crtAllTypes + '</option>';
        Object.keys(A.COURT_TYPES).forEach(function(k) {
            var selected = crtFilterType === k ? ' selected' : '';
            typeFilterHtml += '<option value="' + k + '"' + selected + '>' + A.COURT_TYPES[k] + '</option>';
        });

        var surfaceFilterHtml = '<option value="">' + L.crtAllSurfaces + '</option>';
        Object.keys(A.COURT_SURFACES).forEach(function(k) {
            var selected = crtFilterSurface === k ? ' selected' : '';
            surfaceFilterHtml += '<option value="' + k + '"' + selected + '>' + A.COURT_SURFACES[k] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.courts + '</h2>' +
            '</div>' +
            // Court stat cards
            '<div class="ad-crt-stats-grid">' +
                '<div class="ad-crt-stat-card" id="adCrtCardOutdoor">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">🌤 ' + L.crtStatOutdoor + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adCrtTotalOutdoor">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adCrtStatOutdoor"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card" id="adCrtCardIndoor">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">🏠 ' + L.crtStatIndoor + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adCrtTotalIndoor">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adCrtStatIndoor"></div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky" id="adCrtFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adCrtSearch" placeholder="' + L.crtSearch + '" value="' + A.esc(crtSearchQuery) + '">' +
                '<select class="ad-field-input ad-filter-select" id="adCrtTypeFilter">' + typeFilterHtml + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="adCrtSurfaceFilter">' + surfaceFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adCrtAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addCourt + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adCrtTable">' +
                        '<colgroup>' +
                            '<col style="width:40px;">' +
                            '<col style="width:36px;">' +
                            '<col style="min-width:180px;">' +
                            '<col style="width:90px;">' +
                            '<col style="width:80px;">' +
                            '<col style="width:55px;">' +
                            '<col style="width:100px;">' +
                            '<col style="width:90px;">' +
                            '<col style="width:70px;">' +
                            '<col style="width:70px;">' +
                        '</colgroup>' +
                        '<thead><tr>' +
                            '<th style="width:36px;"></th>' +
                            crtColHeader('name', L.crtName) +
                            crtColHeader('type', L.crtType) +
                            crtColHeader('surface', L.crtSurface) +
                            crtColHeader('count', isEn ? 'Count' : 'Кол-во') +
                            crtColHeader('price', L.crtPrice) +
                            crtColHeader('city', L.crtCity) +
                            crtColHeader('partner', L.crtPartner) +
                            crtColHeader('promoted', L.crtPromoted) +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="10" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="ad-col-dropdown" id="adCrtColDropdown" style="display:none;"></div>' +
            '</div>';

        document.getElementById('adCrtAdd').addEventListener('click', function() {
            renderCourtForm(null);
        });

        var searchTimer = null;
        document.getElementById('adCrtSearch').addEventListener('input', function() {
            crtSearchQuery = this.value;
            crtPage = 1;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(function() { applyCrtFilters(); }, 300);
        });

        document.getElementById('adCrtTypeFilter').addEventListener('change', function() {
            crtFilterType = this.value;
            crtPage = 1;
            applyCrtFilters();
        });

        document.getElementById('adCrtSurfaceFilter').addEventListener('change', function() {
            crtFilterSurface = this.value;
            crtPage = 1;
            applyCrtFilters();
        });

        // Column header click → open dropdown
        document.getElementById('adCrtTable').querySelector('thead').addEventListener('click', function(e) {
            e.stopPropagation();
            var hdr = e.target.closest('.ad-col-header');
            if (!hdr) return;
            openCrtColDropdown(hdr.dataset.col, hdr);
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adCrtColDropdown');
            if (dd && dd.style.display !== 'none' && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        await loadCourtsList();
    }

    async function syncAllExpiredPromoted() {
        if (!A.client) return;
        var today = new Date().toISOString().slice(0, 10);

        // Find courts that are promoted but have no active promoted payment
        var promoted = await A.client.from('courts').select('id').eq('promoted', true);
        var ids = (promoted.data || []).map(function(c) { return String(c.id); });
        if (ids.length === 0) return;

        // Check which have active promoted payments
        var payments = await A.client.from('entity_payments')
            .select('entity_id')
            .eq('entity_type', 'court')
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .in('entity_id', ids);

        var activeIds = {};
        (payments.data || []).forEach(function(p) { activeIds[p.entity_id] = true; });

        // Reset promoted for courts without active payment
        for (var i = 0; i < ids.length; i++) {
            if (!activeIds[ids[i]]) {
                await A.client.from('courts').update({ promoted: false }).eq('id', ids[i]);
            }
        }
    }

    async function loadCourtsList() {
        if (!A.client) return;

        await syncAllExpiredPromoted();

        var serverSortCol = (crtSortCol === 'name' || crtSortCol === 'city') ? crtSortCol : 'name';

        var query = A.client.from('courts')
            .select('id,name,court_types,partner,city,promoted')
            .order(serverSortCol, { ascending: crtSortCol === serverSortCol ? crtSortAsc : true });

        var result = await query;
        crtAllData = result.data || [];

        // Update surface filter dropdown with custom surfaces from DB
        var surfaceSelect = document.getElementById('adCrtSurfaceFilter');
        if (surfaceSelect) {
            var knownSurfaces = {};
            Object.keys(A.COURT_SURFACES).forEach(function(k) { knownSurfaces[k] = true; });
            var customSurfaces = [];
            crtAllData.forEach(function(c) {
                (c.court_types || []).forEach(function(t) {
                    if (t.surface && !knownSurfaces[t.surface]) {
                        knownSurfaces[t.surface] = true;
                        customSurfaces.push(t.surface);
                    }
                });
            });
            customSurfaces.sort().forEach(function(s) {
                var opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                if (crtFilterSurface === s) opt.selected = true;
                surfaceSelect.appendChild(opt);
            });
        }

        applyCrtFilters();
        updateCourtStats();
    }

    async function loadAndViewCourt(id) {
        if (!A.client) return;
        var result = await A.client.from('courts').select('*').eq('id', id).single();
        if (!result.data) return;

        var payments = await A.client.from('entity_payments')
            .select('*')
            .eq('entity_type', 'court')
            .eq('entity_id', String(id))
            .order('created_at', { ascending: false });

        A.setAdminHash('courts', 'view', id);
        renderCourtView(result.data, payments.data || []);
    }

    function renderCourtView(item, payments) {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        var today = new Date().toISOString().slice(0, 10);

        // Court types info
        var typesHtml = '';
        (item.court_types || []).forEach(function(t) {
            typesHtml +=
                '<span class="ad-type-badge ad-type-' + (t.type || 'indoor') + '" style="margin-right:6px;">' +
                    (A.COURT_TYPES[t.type] || t.type || '') +
                '</span>' +
                '<span style="color:var(--text-secondary);margin-right:12px;">' +
                    (A.COURT_SURFACES[t.surface] || t.surface || '') + ' × ' + (t.count || 1) +
                    ' — ' + (t.price || 0) + ' ' + (isEn ? 'som' : 'сом') +
                '</span>';
        });
        if (!typesHtml) typesHtml = '<span style="color:var(--text-dim);">' + L.noData + '</span>';

        // Promoted status
        var promotedHtml = item.promoted
            ? '<span class="ad-pay-badge ad-pay-active">⭐ ' + L.crtPromotedBadge + '</span>'
            : '<span style="color:var(--text-dim);">—</span>';

        // Partner
        var partnerHtml = item.partner
            ? '<span class="ad-partner-badge" style="margin-right:4px;">✓</span>' + (isEn ? 'Yes' : 'Да')
            : '<span style="color:var(--text-dim);">' + (isEn ? 'No' : 'Нет') + '</span>';

        // Payments table
        var paymentsHtml = '';
        if (payments.length === 0) {
            paymentsHtml =
                '<div style="text-align:center;padding:30px 20px;color:var(--text-dim);">' +
                    '<div style="font-size:1.5rem;opacity:0.3;margin-bottom:6px;">💰</div>' +
                    L.crtViewNoPayments +
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
                var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';

                paymentsHtml +=
                    '<tr>' +
                        '<td>' + purposeBadge + '</td>' +
                        '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                        '<td style="font-size:0.85rem;">' + formatPayDate(p.period_end) + '</td>' +
                        '<td>' + (PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                        '<td>' + statusBadge + '</td>' +
                    '</tr>';
            });

            paymentsHtml += '</tbody></table>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.crtViewTitle + '</h2>' +
                '<div style="display:flex;gap:8px;">' +
                    '<button class="ad-btn ad-btn-primary" id="adCrtViewEditBtn">' + L.crtViewEdit + '</button>' +
                    '<button class="ad-btn ad-btn-secondary" id="adCrtViewBackBtn">' + L.back + '</button>' +
                '</div>' +
            '</div>' +

            // Info card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtViewInfo + '</div>' +
                '<div style="display:grid;grid-template-columns:auto 1fr;gap:8px 16px;font-size:0.9rem;">' +
                    '<span style="color:var(--text-dim);">' + L.crtName + '</span>' +
                    '<span style="color:var(--text-primary);font-weight:500;">' + A.esc(item.name || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtCity + '</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(item.city || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtType + ' / ' + L.crtSurface + '</span>' +
                    '<span>' + typesHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtPartner + '</span>' +
                    '<span>' + partnerHtml + '</span>' +
                    '<span style="color:var(--text-dim);">' + L.crtPromoted + '</span>' +
                    '<span>' + promotedHtml + '</span>' +
                '</div>' +
            '</div>' +

            // Payments card
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtViewPayments + '</div>' +
                paymentsHtml +
            '</div>';

        document.getElementById('adCrtViewEditBtn').addEventListener('click', function() {
            A.setAdminHash('courts', 'edit', item.id);
            renderCourtForm(item);
        });

        document.getElementById('adCrtViewBackBtn').addEventListener('click', function() {
            A.setAdminHash('courts');
            renderCourtsList();
        });
    }

    async function loadAndEditCourt(id) {
        if (!A.client) return;
        var result = await A.client.from('courts').select('*').eq('id', id).single();
        if (result.data) {
            A.setAdminHash('courts', 'edit', id);
            renderCourtForm(result.data);
        }
    }

    // ---- Court Form ----
    function renderCourtForm(item) {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        crtEditingId = item ? item.id : null;
        crtImageFile = null;
        crtImageUrl = (item && item.photo) ? item.photo : '';
        crtGalleryUrls = (item && item.gallery) ? item.gallery.slice() : [];
        crtGalleryFiles = [];
        crtCourtTypes = (item && item.court_types) ? JSON.parse(JSON.stringify(item.court_types)) : [];

        var title = item ? L.editCourt : L.addCourt;

        var imagePreviewHtml = crtImageUrl
            ? '<img src="' + A.esc(crtImageUrl) + '" class="ad-image-upload-preview" id="adCrtImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adCrtImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">📷</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = crtImageUrl ? ' has-image' : '';

        // Amenities checkboxes
        var currentAmenities = (item && item.amenities) ? item.amenities : [];
        var amenitiesCheckboxHtml = '';
        A.COURT_AMENITIES.forEach(function(a) {
            var checked = currentAmenities.indexOf(a.key) !== -1 ? ' checked' : '';
            amenitiesCheckboxHtml += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-crt-amenity" value="' + a.key + '"' + checked + '> ' + a.label + '</label>';
        });

        // Phones
        crtPhones = [];
        if (item && item.phone) {
            crtPhones = item.phone.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
        }
        if (crtPhones.length < 2) {
            while (crtPhones.length < 2) crtPhones.push('');
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adCrtBack">' + L.back + '</button>' +
            '</div>' +

            // Photo
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtPhoto + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adCrtImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adCrtImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adCrtImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (crtImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Promoted badge (read-only, managed via Payments)
            (item && item.promoted ?
                '<div class="ad-form-card"><span class="ad-pay-badge ad-pay-active">⭐ ' + L.crtPromotedBadge + '</span> <span style="color:var(--text-dim);font-size:0.8rem;">' + L.crtPromotedHint + '</span></div>'
            : '') +

            // Name (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtName + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtName" placeholder="' + L.crtName + ' (RU)" value="' + A.esc(item ? item.name : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtNameEn" placeholder="' + L.crtName + ' (EN)" value="' + A.esc(item ? item.name_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adCrtNameKg" placeholder="' + L.crtName + ' (KG)" value="' + A.esc(item ? item.name_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtName" data-en="adCrtNameEn" data-kg="adCrtNameKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Court Types (dynamic rows with headers)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtType + '</div>' +
                '<div class="ad-court-type-header">' +
                    '<span>' + L.crtType + '</span>' +
                    '<span>' + L.crtSurface + '</span>' +
                    '<span>' + L.crtCourtsCount + '</span>' +
                    '<span>' + L.crtPrice + '</span>' +
                    '<span>' + L.crtPartner + '</span>' +
                    '<span></span>' +
                '</div>' +
                '<div id="adCrtTypesRows"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtTypesAdd">' + L.crtAdd + '</button>' +
            '</div>' +

            // Address form (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Address' : 'Адрес') + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreet" value="' + A.esc(item ? item.street : '') + '">' +
                        '</div>' +
                        '<div class="ad-field" style="max-width:100px;">' +
                            '<label class="ad-field-label">' + L.crtBuilding + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtBuilding" value="' + A.esc(item ? item.building : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field-row" style="margin-top:8px;">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtDistrict + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtDistrict" value="' + A.esc(item ? item.district : '') + '">' +
                        '</div>' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtCity + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtCity" value="' + A.esc(item ? item.city : 'Бишкек') + '">' +
                        '</div>' +
                        '<div class="ad-field" style="max-width:100px;">' +
                            '<label class="ad-field-label">' + L.crtPostalCode + '</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtPostal" value="' + A.esc(item ? item.postal_code : '') + '">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + ' (EN)</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreetEn" value="' + A.esc(item ? item.street_en : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtDistrict + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtDistrictEn" value="' + A.esc(item ? item.district_en : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtCity + ' (EN)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtCityEn" value="' + A.esc(item ? item.city_en : 'Bishkek') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field-row">' +
                        '<div class="ad-field">' +
                            '<label class="ad-field-label">' + L.crtStreet + ' (KG)</label>' +
                            '<input type="text" class="ad-field-input" id="adCrtStreetKg" value="' + A.esc(item ? item.street_kg : '') + '">' +
                        '</div>' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtDistrict + ' (KG)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtDistrictKg" value="' + A.esc(item ? item.district_kg : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-top:8px;">' +
                        '<label class="ad-field-label">' + L.crtCity + ' (KG)</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtCityKg" value="' + A.esc(item ? item.city_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-group="address">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Links: Google Maps + 2GIS with iframe preview
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtGoogleMaps + ' / ' + L.crtTwoGis + '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.crtGoogleMaps + '</label>' +
                        '<input type="url" class="ad-field-input" id="adCrtGoogleMaps" placeholder="https://maps.google.com/..." value="' + A.esc(item ? item.google_maps_url : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.crtTwoGis + '</label>' +
                        '<input type="url" class="ad-field-input" id="adCrtTwoGis" placeholder="https://2gis.kg/..." value="' + A.esc(item ? item.twogis_url : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-crt-map-preview" id="adCrtMapPreview"></div>' +
            '</div>' +

            // Phones + Email
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Contacts' : 'Контакты') + '</div>' +
                '<div id="adCrtPhones"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtAddPhone">' + L.crtAddPhone + '</button>' +
                '<div class="ad-field" style="margin-top:12px;max-width:400px;">' +
                    '<label class="ad-field-label">' + L.crtEmail + '</label>' +
                    '<input type="email" class="ad-field-input" id="adCrtEmail" placeholder="info@example.com" value="' + A.esc(item ? item.email : '') + '">' +
                '</div>' +
            '</div>' +

            // Description (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtDescription + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDesc" rows="4" placeholder="' + L.crtDescription + ' (RU)">' + A.esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDescEn" rows="4" placeholder="' + L.crtDescription + ' (EN)">' + A.esc(item ? item.description_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtDescKg" rows="4" placeholder="' + L.crtDescription + ' (KG)">' + A.esc(item ? item.description_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtDesc" data-en="adCrtDescEn" data-kg="adCrtDescKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Amenities (checkbox grid + custom)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtAmenities + '</div>' +
                '<div class="ad-badges-grid" id="adCrtAmenities">' + amenitiesCheckboxHtml + '</div>' +
                '<div id="adCrtCustomAmenities"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtAmenityAdd" style="margin-top:8px;">' + L.crtAddCustom + '</button>' +
            '</div>' +

            // Slogan / Additional Info (RU/EN/KG) — textarea
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtSlogan + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSlogan" rows="3" placeholder="' + L.crtSlogan + ' (RU)">' + A.esc(item ? item.slogan : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSloganEn" rows="3" placeholder="' + L.crtSlogan + ' (EN)">' + A.esc(item ? item.slogan_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adCrtSloganKg" rows="3" placeholder="' + L.crtSlogan + ' (KG)">' + A.esc(item ? item.slogan_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adCrtSlogan" data-en="adCrtSloganEn" data-kg="adCrtSloganKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Gallery (moved to bottom — thumbnails + upload + URL)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtGallery + '</div>' +
                '<div class="ad-gallery-grid" id="adCrtGalleryGrid"></div>' +
                '<input type="file" accept="image/jpeg,image/png" multiple id="adCrtGalleryInput" style="display:none">' +
                '<div style="display:flex;gap:8px;flex-wrap:wrap;">' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtGalleryAdd">+ ' + L.uploadImage + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtGalleryAddUrl">' + L.crtAddByUrl + '</button>' +
                '</div>' +
                '<div id="adCrtGalleryUrlRow" style="display:none;" class="ad-crt-gallery-url-row">' +
                    '<input type="url" class="ad-field-input" id="adCrtGalleryUrlInput" placeholder="https://example.com/photo.jpg" style="flex:1;">' +
                    '<button type="button" class="ad-btn ad-btn-sm" id="adCrtGalleryUrlConfirm">&#10003;</button>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adCrtSave">' + L.save + '</button>' +
                (crtEditingId ? '<button class="ad-btn ad-btn-danger" id="adCrtDelete">' + L.delete + '</button>' : '') +
            '</div>';

        // --- Event Listeners ---

        // Back
        document.getElementById('adCrtBack').addEventListener('click', function() {
            A.setAdminHash('courts');
            renderCourtsList();
        });

        // Lang tabs (delegate)
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card') || tab.closest('.ad-field');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });
        });

        // Translate ALL — 3-language "translate to empty" buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all');
            if (!btn) return;

            // Address group has 3 field-pairs
            if (btn.dataset.group === 'address') {
                var fields = [
                    { ru: 'adCrtStreet', en: 'adCrtStreetEn', kg: 'adCrtStreetKg' },
                    { ru: 'adCrtDistrict', en: 'adCrtDistrictEn', kg: 'adCrtDistrictKg' },
                    { ru: 'adCrtCity', en: 'adCrtCityEn', kg: 'adCrtCityKg' }
                ];
                var origLabel = btn.textContent;
                btn.textContent = L.translating;
                btn.disabled = true;
                (async function() {
                    try {
                        for (var f = 0; f < fields.length; f++) {
                            await A.translateToEmpty(fields[f].ru, fields[f].en, fields[f].kg, { textContent: '', disabled: false });
                        }
                    } catch (ex) { /* handled inside */ }
                    btn.textContent = origLabel;
                    btn.disabled = false;
                })();
                return;
            }

            // Standard: data-ru, data-en, data-kg
            A.translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
        });

        // Map preview on URL blur
        function updateCrtMapPreview() {
            var preview = document.getElementById('adCrtMapPreview');
            if (!preview) return;
            var gUrl = document.getElementById('adCrtGoogleMaps').value.trim();
            var tUrl = document.getElementById('adCrtTwoGis').value.trim();
            var embedUrl = getCrtMapEmbed(gUrl) || getCrtMapEmbed(tUrl);
            if (embedUrl) {
                preview.innerHTML = '<iframe src="' + A.esc(embedUrl) + '" allowfullscreen loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe>';
            } else {
                preview.innerHTML = '';
            }
        }
        document.getElementById('adCrtGoogleMaps').addEventListener('blur', updateCrtMapPreview);
        document.getElementById('adCrtTwoGis').addEventListener('blur', updateCrtMapPreview);
        updateCrtMapPreview();

        // Custom amenities
        var crtCustomAmenities = [];
        if (item && item.amenities) {
            var knownKeys = A.COURT_AMENITIES.map(function(a) { return a.key; });
            item.amenities.forEach(function(a) {
                if (knownKeys.indexOf(a) === -1) crtCustomAmenities.push(a);
            });
        }
        function renderCrtCustomAmenities() {
            var wrap = document.getElementById('adCrtCustomAmenities');
            if (!wrap) return;
            var html = '';
            crtCustomAmenities.forEach(function(a, idx) {
                html += '<label class="ad-checkbox-label"><input type="checkbox" class="ad-crt-amenity ad-crt-custom-amenity" value="' + A.esc(a) + '" checked> ' + A.esc(a) +
                    ' <button type="button" class="ad-btn-icon ad-crt-custom-amenity-remove" data-idx="' + idx + '" style="font-size:0.7rem;">&times;</button></label>';
            });
            wrap.innerHTML = html;
        }
        renderCrtCustomAmenities();

        document.getElementById('adCrtAmenityAdd').addEventListener('click', function() {
            var wrap = document.getElementById('adCrtCustomAmenities');
            // Check if input row already exists
            if (wrap.querySelector('.ad-crt-custom-amenity-row')) return;
            var row = document.createElement('div');
            row.className = 'ad-crt-custom-amenity-row';
            row.innerHTML = '<input type="text" class="ad-field-input" placeholder="' + L.crtCustomAmenity + '..." style="flex:1;">' +
                '<button type="button" class="ad-btn ad-btn-sm ad-crt-custom-amenity-confirm">&#10003;</button>';
            wrap.appendChild(row);
            row.querySelector('input').focus();
        });
        document.getElementById('adCrtCustomAmenities').addEventListener('click', function(e) {
            // Confirm custom amenity
            var confirmBtn = e.target.closest('.ad-crt-custom-amenity-confirm');
            if (confirmBtn) {
                var row = confirmBtn.closest('.ad-crt-custom-amenity-row');
                var val = row.querySelector('input').value.trim();
                if (val) {
                    crtCustomAmenities.push(val);
                    renderCrtCustomAmenities();
                }
                return;
            }
            // Remove custom amenity
            var rmBtn = e.target.closest('.ad-crt-custom-amenity-remove');
            if (rmBtn) {
                var idx = parseInt(rmBtn.dataset.idx, 10);
                crtCustomAmenities.splice(idx, 1);
                renderCrtCustomAmenities();
            }
        });
        // Enter key in custom amenity input
        document.getElementById('adCrtCustomAmenities').addEventListener('keydown', function(e) {
            if (e.key === 'Enter') {
                var row = e.target.closest('.ad-crt-custom-amenity-row');
                if (row) {
                    e.preventDefault();
                    var val = e.target.value.trim();
                    if (val) {
                        crtCustomAmenities.push(val);
                        renderCrtCustomAmenities();
                    }
                }
            }
        });

        // Gallery URL add
        document.getElementById('adCrtGalleryAddUrl').addEventListener('click', function() {
            var row = document.getElementById('adCrtGalleryUrlRow');
            row.style.display = row.style.display === 'none' ? 'flex' : 'none';
            if (row.style.display === 'flex') document.getElementById('adCrtGalleryUrlInput').focus();
        });
        document.getElementById('adCrtGalleryUrlConfirm').addEventListener('click', function() {
            var input = document.getElementById('adCrtGalleryUrlInput');
            var url = input.value.trim();
            if (url) {
                crtGalleryUrls.push(url);
                crtGalleryFiles.push(null);
                renderCrtGallery();
                input.value = '';
                document.getElementById('adCrtGalleryUrlRow').style.display = 'none';
            }
        });

        // Court types: render rows
        if (crtCourtTypes.length === 0) {
            crtCourtTypes.push({ type: '', surface: '', count: 1, price: 0, partner: false });
        }

        function buildTypeOptions(selected) {
            var html = '<option value="">—</option>';
            Object.keys(A.COURT_TYPES).forEach(function(k) {
                html += '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>' + A.COURT_TYPES[k] + '</option>';
            });
            return html;
        }
        function buildSurfaceOptions(selected) {
            var html = '<option value="">—</option>';
            Object.keys(A.COURT_SURFACES).forEach(function(k) {
                html += '<option value="' + k + '"' + (selected === k ? ' selected' : '') + '>' + A.COURT_SURFACES[k] + '</option>';
            });
            html += '<option value="__other__"' + (selected === '__other__' ? ' selected' : '') + '>' + L.crtOther + '...</option>';
            return html;
        }
        function isCustomSurface(val) {
            return val && val !== '__other__' && !A.COURT_SURFACES.hasOwnProperty(val);
        }
        function renderCrtTypeRows() {
            var rowsEl = document.getElementById('adCrtTypesRows');
            if (!rowsEl) return;
            var html = '';
            crtCourtTypes.forEach(function(ct, idx) {
                var surfaceHtml;
                if (isCustomSurface(ct.surface)) {
                    surfaceHtml = '<input type="text" class="ad-field-input ad-ct-surface ad-ct-surface-custom" value="' + A.esc(ct.surface) + '" placeholder="' + L.crtSurface + '...">';
                } else {
                    surfaceHtml = '<select class="ad-field-input ad-ct-surface">' + buildSurfaceOptions(ct.surface) + '</select>';
                }
                html += '<div class="ad-court-type-row" data-idx="' + idx + '">' +
                    '<select class="ad-field-input ad-ct-type">' + buildTypeOptions(ct.type) + '</select>' +
                    surfaceHtml +
                    '<input type="text" class="ad-field-input ad-ct-count" inputmode="numeric" pattern="[0-9]*" value="' + (ct.count || '') + '">' +
                    '<input type="text" class="ad-field-input ad-ct-price" inputmode="numeric" pattern="[0-9]*" value="' + (ct.price || '') + '">' +
                    '<label class="ad-ct-partner-wrap"><input type="checkbox" class="ad-ct-partner"' + (ct.partner ? ' checked' : '') + '></label>' +
                    (crtCourtTypes.length > 1 ? '<button type="button" class="ad-btn-icon ad-ct-remove">&times;</button>' : '<div></div>') +
                '</div>';
            });
            rowsEl.innerHTML = html;
        }
        renderCrtTypeRows();

        document.getElementById('adCrtTypesAdd').addEventListener('click', function() {
            crtCourtTypes.push({ type: '', surface: '', count: 1, price: 0, partner: false });
            renderCrtTypeRows();
        });

        document.getElementById('adCrtTypesRows').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-ct-remove');
            if (!rmBtn) return;
            if (crtCourtTypes.length <= 1) return; // keep at least 1
            var row = rmBtn.closest('.ad-court-type-row');
            var idx = parseInt(row.dataset.idx, 10);
            crtCourtTypes.splice(idx, 1);
            renderCrtTypeRows();
        });

        // Sync court types on change
        document.getElementById('adCrtTypesRows').addEventListener('change', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-type')) crtCourtTypes[idx].type = e.target.value;
            if (e.target.classList.contains('ad-ct-surface')) {
                if (e.target.value === '__other__') {
                    crtCourtTypes[idx].surface = '';
                    renderCrtTypeRows();
                    var newInput = document.querySelector('.ad-court-type-row[data-idx="' + idx + '"] .ad-ct-surface-custom');
                    if (newInput) newInput.focus();
                } else {
                    crtCourtTypes[idx].surface = e.target.value;
                }
            }
            if (e.target.classList.contains('ad-ct-partner')) crtCourtTypes[idx].partner = e.target.checked;
        });
        document.getElementById('adCrtTypesRows').addEventListener('input', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-count')) {
                e.target.value = e.target.value.replace(/\D/g, '');
                crtCourtTypes[idx].count = parseInt(e.target.value, 10) || 0;
            }
            if (e.target.classList.contains('ad-ct-price')) {
                e.target.value = e.target.value.replace(/\D/g, '');
                crtCourtTypes[idx].price = parseInt(e.target.value, 10) || 0;
            }
            if (e.target.classList.contains('ad-ct-surface-custom')) {
                crtCourtTypes[idx].surface = e.target.value.trim();
            }
        });

        // Phones: render
        function renderCrtPhones() {
            var phonesEl = document.getElementById('adCrtPhones');
            if (!phonesEl) return;
            var html = '';
            crtPhones.forEach(function(ph, idx) {
                var label = idx === 0 ? L.crtMobile : (idx === 1 ? L.crtLandline : (isEn ? 'Phone ' + (idx + 1) : 'Телефон ' + (idx + 1)));
                var placeholder = idx === 0 ? '555 12-34-56' : (idx === 1 ? '312 12-34-56' : '555 12-34-56');
                // Strip +996 prefix and format for display
                var rawDigits = ph.replace(/^\+?996\s*/, '').replace(/\D/g, '');
                if (rawDigits.length > 9) rawDigits = rawDigits.substr(0, 9);
                var displayVal = '';
                if (rawDigits.length > 0) displayVal = rawDigits.substr(0, 3);
                if (rawDigits.length > 3) displayVal += ' ' + rawDigits.substr(3, 2);
                if (rawDigits.length > 5) displayVal += '-' + rawDigits.substr(5, 2);
                if (rawDigits.length > 7) displayVal += '-' + rawDigits.substr(7, 2);
                html += '<div class="ad-phone-row">' +
                    '<div class="ad-field" style="flex:1;">' +
                        '<label class="ad-field-label">' + label + '</label>' +
                        '<div style="display:flex;gap:6px;">' +
                            '<div class="ad-phone-prefix">🇰🇬 +996</div>' +
                            '<input type="text" class="ad-field-input ad-crt-phone" data-idx="' + idx + '" placeholder="' + placeholder + '" value="' + A.esc(displayVal) + '" style="flex:1;">' +
                        '</div>' +
                    '</div>' +
                    (idx >= 2 ? '<button type="button" class="ad-btn-icon ad-phone-remove" data-idx="' + idx + '" style="margin-bottom:4px;">&times;</button>' : '') +
                '</div>';
            });
            phonesEl.innerHTML = html;
        }
        renderCrtPhones();

        document.getElementById('adCrtAddPhone').addEventListener('click', function() {
            crtPhones.push('');
            renderCrtPhones();
        });
        document.getElementById('adCrtPhones').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-phone-remove');
            if (!rmBtn) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            crtPhones.splice(idx, 1);
            renderCrtPhones();
        });
        document.getElementById('adCrtPhones').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-crt-phone')) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            // Strip non-digits
            var digits = e.target.value.replace(/\D/g, '');
            // Limit to 9 digits (KG local number after +996)
            if (digits.length > 9) digits = digits.substr(0, 9);
            // Format: XXX XX-XX-XX
            var formatted = '';
            if (digits.length > 0) formatted = digits.substr(0, 3);
            if (digits.length > 3) formatted += ' ' + digits.substr(3, 2);
            if (digits.length > 5) formatted += '-' + digits.substr(5, 2);
            if (digits.length > 7) formatted += '-' + digits.substr(7, 2);
            // Update input display
            e.target.value = formatted;
            // Store with +996 prefix
            crtPhones[idx] = digits ? '+996 ' + formatted : '';
        });

        // Gallery: render thumbnails
        renderCrtGallery();

        // Gallery: add files
        document.getElementById('adCrtGalleryAdd').addEventListener('click', function() {
            document.getElementById('adCrtGalleryInput').click();
        });

        document.getElementById('adCrtGalleryInput').addEventListener('change', function() {
            var files = this.files;
            if (!files) return;
            for (var i = 0; i < files.length; i++) {
                crtGalleryFiles.push(files[i]);
                crtGalleryUrls.push(URL.createObjectURL(files[i]));
            }
            renderCrtGallery();
            this.value = '';
        });

        // Gallery: remove (delegated)
        document.getElementById('adCrtGalleryGrid').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-gallery-remove');
            if (!rmBtn) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            crtGalleryUrls.splice(idx, 1);
            crtGalleryFiles.splice(idx, 1);
            renderCrtGallery();
        });

        // Image upload
        var imgZone = document.getElementById('adCrtImgZone');
        var imgInput = document.getElementById('adCrtImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                crtImageFile = imgInput.files[0];
                previewCrtImage(URL.createObjectURL(crtImageFile));
            }
        });

        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                crtImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewCrtImage(URL.createObjectURL(crtImageFile));
            }
        });

        setupCrtImgRemove();

        document.getElementById('adCrtImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adCrtImgUrl').value.trim();
            if (url) {
                crtImageFile = null;
                crtImageUrl = url;
                previewCrtImage(url);
            }
        });

        // Save
        document.getElementById('adCrtSave').addEventListener('click', saveCourtHandler);

        // Delete
        var delBtn = document.getElementById('adCrtDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                A.showConfirm(L.crtDeleteConfirm, L.deleteConfirmText, function() {
                    deleteCourtHandler();
                });
            });
        }
    }

    // ---- Map embed URL parser ----
    function getCrtMapEmbed(url) {
        if (!url) return null;
        // Google Maps
        if (url.indexOf('google.com/maps') !== -1 || url.indexOf('goo.gl/maps') !== -1 || url.indexOf('maps.app.goo.gl') !== -1) {
            if (url.indexOf('/embed') !== -1) return url;
            var qMatch = url.match(/[?&]q=([^&]+)/);
            if (qMatch) return 'https://maps.google.com/maps?q=' + qMatch[1] + '&output=embed';
            var coordMatch = url.match(/@(-?[\d.]+),(-?[\d.]+)/);
            if (coordMatch) return 'https://maps.google.com/maps?q=' + coordMatch[1] + ',' + coordMatch[2] + '&output=embed';
            var placeMatch = url.match(/\/place\/([^/]+)/);
            if (placeMatch) return 'https://maps.google.com/maps?q=' + placeMatch[1] + '&output=embed';
            return 'https://maps.google.com/maps?q=' + encodeURIComponent(url) + '&output=embed';
        }
        // 2GIS
        if (url.indexOf('2gis.') !== -1) {
            var gisMatch = url.match(/\/([\d.]+)%2C([\d.]+)\//);
            if (!gisMatch) gisMatch = url.match(/\/([\d.]+),([\d.]+)\//);
            if (gisMatch) {
                return 'https://maps.google.com/maps?q=' + gisMatch[2] + ',' + gisMatch[1] + '&output=embed';
            }
        }
        return null;
    }

    // ---- Gallery Thumbnails ----
    function renderCrtGallery() {
        var grid = document.getElementById('adCrtGalleryGrid');
        if (!grid) return;
        if (crtGalleryUrls.length === 0) {
            grid.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;padding:8px 0;">' + (isEn ? 'No photos yet' : 'Фото ещё нет') + '</div>';
            return;
        }
        var html = '';
        crtGalleryUrls.forEach(function(url, idx) {
            html += '<div class="ad-gallery-thumb">' +
                '<img src="' + A.esc(url) + '" alt="">' +
                '<button type="button" class="ad-gallery-remove" data-idx="' + idx + '">&times;</button>' +
            '</div>';
        });
        grid.innerHTML = html;
    }

    function previewCrtImage(src) {
        var zone = document.getElementById('adCrtImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adCrtImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adCrtImgRemove">&times;</button>';
        setupCrtImgRemove();
    }

    function setupCrtImgRemove() {
        var rmBtn = document.getElementById('adCrtImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                crtImageFile = null;
                crtImageUrl = '';
                var zone = document.getElementById('adCrtImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">📷</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adCrtImgUrl').value = '';
                document.getElementById('adCrtImgInput').value = '';
            });
        }
    }

    // ---- Save Court ----
    async function saveCourtHandler() {
        var saveBtn = document.getElementById('adCrtSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Main photo
            var imageUrl = crtImageUrl;
            if (crtImageFile) {
                imageUrl = await A.uploadImage(crtImageFile, 'crt-');
                if (!imageUrl) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
            }

            // Upload new gallery files
            var galleryFinal = [];
            for (var g = 0; g < crtGalleryUrls.length; g++) {
                if (crtGalleryFiles[g]) {
                    var uploaded = await A.uploadImage(crtGalleryFiles[g], 'crt-');
                    if (uploaded) galleryFinal.push(uploaded);
                } else {
                    galleryFinal.push(crtGalleryUrls[g]);
                }
            }

            // Amenities (from checkboxes)
            var amenities = [];
            document.querySelectorAll('.ad-crt-amenity:checked').forEach(function(cb) {
                amenities.push(cb.value);
            });

            // Phones
            var phonesStr = crtPhones.filter(Boolean).join(', ');

            var name = document.getElementById('adCrtName').value.trim();

            var data = {
                name: name,
                name_en: document.getElementById('adCrtNameEn').value.trim() || null,
                name_kg: document.getElementById('adCrtNameKg').value.trim() || null,
                photo: imageUrl || null,
                gallery: galleryFinal,
                court_types: crtCourtTypes,
                google_maps_url: document.getElementById('adCrtGoogleMaps').value.trim() || null,
                twogis_url: document.getElementById('adCrtTwoGis').value.trim() || null,
                street: document.getElementById('adCrtStreet').value.trim() || null,
                street_en: document.getElementById('adCrtStreetEn').value.trim() || null,
                street_kg: document.getElementById('adCrtStreetKg').value.trim() || null,
                building: document.getElementById('adCrtBuilding').value.trim() || null,
                district: document.getElementById('adCrtDistrict').value.trim() || null,
                district_en: document.getElementById('adCrtDistrictEn').value.trim() || null,
                district_kg: document.getElementById('adCrtDistrictKg').value.trim() || null,
                city: document.getElementById('adCrtCity').value.trim() || null,
                city_en: document.getElementById('adCrtCityEn').value.trim() || null,
                city_kg: document.getElementById('adCrtCityKg').value.trim() || null,
                postal_code: document.getElementById('adCrtPostal').value.trim() || null,
                phone: phonesStr || null,
                email: document.getElementById('adCrtEmail').value.trim() || null,
                description: document.getElementById('adCrtDesc').value.trim() || null,
                description_en: document.getElementById('adCrtDescEn').value.trim() || null,
                description_kg: document.getElementById('adCrtDescKg').value.trim() || null,
                amenities: amenities,
                slogan: document.getElementById('adCrtSlogan').value.trim() || null,
                slogan_en: document.getElementById('adCrtSloganEn').value.trim() || null,
                slogan_kg: document.getElementById('adCrtSloganKg').value.trim() || null,
                partner: crtCourtTypes.some(function(ct) { return ct.partner; })
            };

            if (!data.name) {
                A.showToast(isEn ? 'Name is required' : 'Название обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (crtEditingId) {
                result = await A.client.from('courts').update(data).eq('id', crtEditingId);
            } else {
                data.id = A.slugify(name);
                result = await A.client.from('courts').insert(data);
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            A.showToast(L.saved, 'success');
            renderCourtsList();
        } catch (e) {
            A.showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Court ----
    async function deleteCourtHandler() {
        if (!crtEditingId) return;
        var result = await A.client.from('courts').delete().eq('id', crtEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderCourtsList();
    }


    // ---- Export to namespace ----
    A.renderCourtsSection = renderCourtsSection;
    A.renderCourtsList = renderCourtsList;
    A.loadAndEditCourt = loadAndEditCourt;
    A.loadAndViewCourt = loadAndViewCourt;

})();
