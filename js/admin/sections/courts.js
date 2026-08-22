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
    var crtAdditionalServices = [];
    var crtPhones = [];
    var crtPartnerServices = [];
    var crtPartnerPin = '';

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

        var surfaceKeys = ['hard', 'clay', 'carpet', 'grass'];
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
                '<tr><td colspan="12" style="text-align:center;padding:60px 20px;">' +
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

            var viewsCell = (c.view_count || 0) > 0 ? c.view_count : '\u2014';

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
                        '<td style="text-align:center;color:var(--text-dim);">' + viewsCell + '</td>' +
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
                        '<td rowspan="' + rowCount + '" style="text-align:center;vertical-align:middle;color:var(--text-dim);">' + viewsCell + '</td>' +
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
                            '<th style="text-align:center;width:50px;">&#128065;</th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="11" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
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
        await loadKnownCities();
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
            .select('id,name,court_types,additional_services,partner,city,promoted,view_count')
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
                    '<span style="color:var(--text-dim);">' + (isEn ? 'Phone' : 'Телефон') + '</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(item.phone || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">WhatsApp</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(item.whatsapp || '—') + '</span>' +
                    '<span style="color:var(--text-dim);">Instagram</span>' +
                    '<span style="color:var(--text-secondary);">' + A.esc(item.instagram || '—') + '</span>' +
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
    // Номер показываем без кода страны — код стоит отдельной плашкой
    function phoneDigits(value) {
        if (!value) return '';
        var d = String(value).replace(/^\+?996\s*/, '').replace(/\D/g, '').substr(0, 9);
        if (!d) return '';
        var out = d.substr(0, 3);
        if (d.length > 3) out += ' ' + d.substr(3, 2);
        if (d.length > 5) out += '-' + d.substr(5, 2);
        if (d.length > 7) out += '-' + d.substr(7, 2);
        return out;
    }

    /**
     * В поле номера пускаем только цифры и держим их в формате страны.
     * Раньше можно было ввести что угодно: буквы вырезались при сохранении,
     * и в базу уходил обрубок вроде «+713235».
     */
    /**
     * Приводит поле к формату страны. Возвращает страну, на которую нужно
     * переключить выбор: номер могли вставить целиком, вместе с чужим кодом.
     */
    function reformatPhoneInput(input, iso, pickerEl) {
        if (!window.KSLT_PHONE) return iso;
        var caretAtEnd = input.selectionStart === input.value.length;
        var raw = input.value;

        var parsed = KSLT_PHONE.parseInput(raw, iso);
        var usedIso = parsed.iso;

        if (parsed.switched && pickerEl) {
            KSLT_PHONE.setPicker(pickerEl, usedIso);
            input.placeholder = KSLT_PHONE.placeholder(usedIso);
        } else if (parsed.switched) {
            usedIso = iso;                       // переключать нечего — держим прежнюю
        }

        input.value = KSLT_PHONE.format(usedIso, parsed.digits);
        if (caretAtEnd) input.setSelectionRange(input.value.length, input.value.length);

        // Говорим, почему набранное не появилось: молча вырезать символы —
        // значит оставить человека в недоумении
        var country = KSLT_PHONE.byIso(usedIso);
        var hadJunk = /[^0-9\s+()\-]/.test(raw);
        var tooLong = parsed.digits.length > country.len;

        if (hadJunk) {
            phoneWarn(input, isEn ? 'Digits only' : 'Только цифры');
        } else if (tooLong) {
            phoneWarn(input, (isEn ? 'Number is longer than ' : 'В номере больше ') + country.len + (isEn ? ' digits' : ' цифр'));
        } else if (parsed.switched) {
            phoneWarn(input, (isEn ? 'Country set from the number' : 'Страна определена по номеру'));
        } else {
            phoneWarn(input, '');
        }

        return usedIso;
    }

    function phoneWarnCheckFull(input, iso) {
        if (!window.KSLT_PHONE) return;
        var country = KSLT_PHONE.byIso(iso);
        var n = input.value.replace(/[^0-9]/g, '').length;
        if (n && n < country.len) {
            phoneWarn(input, (isEn ? 'Number is short: ' : 'Номер короткий: нужно ') + country.len + (isEn ? ' digits needed' : ' цифр'));
        } else {
            phoneWarn(input, '');
        }
    }

    var _phoneWarnTimers = {};

    function phoneWarn(input, text, sticky) {
        var row = input.closest('.ad-field') || input.parentNode;
        var hint = row.querySelector('.ad-input-hint');

        if (!text) {
            input.classList.remove('ad-input-error');
            if (hint) hint.remove();
            return;
        }

        input.classList.add('ad-input-error');
        if (!hint) {
            hint = document.createElement('div');
            hint.className = 'ad-input-hint';
            row.appendChild(hint);
        }
        hint.textContent = text;

        // Подсказка при наборе живёт недолго — она про то, что человек делает
        // сейчас. А та, что не пустила сохранение, висит до исправления
        var key = input.dataset.idx || input.id || 'wa';
        clearTimeout(_phoneWarnTimers[key]);
        if (!sticky) {
            _phoneWarnTimers[key] = setTimeout(function() { phoneWarn(input, ''); }, 2500);
        }
    }

    function whatsappRowHtml(item) {
        var stored = item ? (item.whatsapp || '') : '';
        var parts = window.KSLT_PHONE
            ? KSLT_PHONE.split(stored)
            : { iso: 'KG', rest: stored.replace(/\D/g, '') };

        return '<div style="display:flex;gap:6px;">' +
            (window.KSLT_PHONE
                ? KSLT_PHONE.pickerHtml(parts.iso, isEn ? 'en' : 'ru', 'ad-crt-wa-country')
                : '') +
            '<input type="text" inputmode="numeric" class="ad-field-input" id="adCrtWhatsapp" value="' +
                A.esc(window.KSLT_PHONE ? KSLT_PHONE.format(parts.iso, parts.rest) : parts.rest) +
                '" placeholder="' + (window.KSLT_PHONE ? KSLT_PHONE.placeholder(parts.iso) : '000 000 000') + '" style="flex:1;">' +
        '</div>';
    }

    function phoneFull(value) {
        var d = String(value || '').replace(/\D/g, '');
        if (d.length < 9) return null;
        d = d.substr(-9);
        return '+996 ' + d.substr(0, 3) + ' ' + d.substr(3, 2) + ' ' + d.substr(5, 2) + ' ' + d.substr(7, 2);
    }

    // Принимаем и «@name», и «name», и ссылку целиком
    function whatsappValue() {
        var num = document.getElementById('adCrtWhatsapp');
        if (!num || !num.value.trim()) return null;
        var picker = document.querySelector('.ad-crt-wa-country');
        if (window.KSLT_PHONE && picker) return KSLT_PHONE.join(picker.dataset.iso, num.value) || null;
        return phoneFull(num.value);
    }

    function instagramHandle(value) {
        var v = String(value || '').trim();
        if (!v) return null;
        var m = v.match(/instagram\.com\/([\w.]+)/i);
        if (m) return '@' + m[1];
        return '@' + v.replace(/^@/, '');
    }

    // Города, уже заведённые в базе: название на трёх языках. Заполняется
    // при открытии раздела, используется подсказкой в поле города
    var crtKnownCities = [];

    async function loadKnownCities() {
        if (!A.client) return;
        var res = await A.client.from('courts').select('city, city_en, city_kg');
        if (res.error || !res.data) return;

        var seen = {};
        crtKnownCities = [];
        res.data.forEach(function(row) {
            var name = (row.city || '').trim();
            if (!name || seen[name.toLowerCase()]) return;
            seen[name.toLowerCase()] = true;
            crtKnownCities.push({ ru: name, en: (row.city_en || '').trim(), kg: (row.city_kg || '').trim() });
        });
        crtKnownCities.sort(function(a, b) { return a.ru.localeCompare(b.ru, 'ru'); });
    }

    /**
     * Приводит название города к общему виду: без приставок «г.» и лишних
     * пробелов, с заглавной буквы. После дефиса тоже заглавная, чтобы
     * «джалал-абад» стал «Джалал-Абад», а «ошская область» осталась
     * областью, а не «Ошской Областью».
     */
    /**
     * Числовое поле: только цифры и не больше разумного предела. Скидка в
     * 150% или цена в миллион попадали в базу молча, а потом всплывали
     * в ваучере.
     */
    function clampNumberInput(input, max) {
        var digits = input.value.replace(/\D/g, '').replace(/^0+(?=\d)/, '');
        var n = parseInt(digits, 10);
        if (isNaN(n)) { input.value = ''; return 0; }
        if (n > max) n = max;
        input.value = String(n);
        return n;
    }

    function normalizeCity(value) {
        var v = String(value || '').trim().replace(/\s+/g, ' ');
        if (!v) return '';
        v = v.replace(/^(г\.|гор\.|город|с\.|село|пос\.|посёлок|поселок)\s+/i, '').trim();
        if (!v) return '';
        v = v.toLowerCase();
        return v.replace(/(^|[-\s])([a-zа-яё])/g, function(all, sep, ch) {
            return sep + ch.toUpperCase();
        }).replace(/(\s)([А-ЯЁ])/g, function(all, sep, ch) {
            // Второе слово — со строчной: «Ошская область», «Чуйская долина»
            return sep + ch.toLowerCase();
        });
    }

    /** Похожий город из уже заведённых: «каракол» ↔ «Кара-Кол». */
    function similarCity(name) {
        var key = String(name || '').toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
        if (!key) return null;
        for (var i = 0; i < crtKnownCities.length; i++) {
            var known = crtKnownCities[i].ru.toLowerCase().replace(/[^a-zа-яё0-9]/g, '');
            if (known === key && crtKnownCities[i].ru !== name) return crtKnownCities[i];
        }
        return null;
    }

    function renderCourtForm(item) {
        var container = document.getElementById('ad-courts');
        if (!container) return;

        crtEditingId = item ? item.id : null;
        crtImageFile = null;
        crtImageUrl = (item && item.photo) ? item.photo : '';
        crtGalleryUrls = (item && item.gallery) ? item.gallery.slice() : [];
        crtGalleryFiles = [];
        crtCourtTypes = (item && item.court_types) ? JSON.parse(JSON.stringify(item.court_types)) : [];
        crtAdditionalServices = (item && item.additional_services) ? JSON.parse(JSON.stringify(item.additional_services)) : [];
        crtPartnerPin = (item && item.partner_pin) ? item.partner_pin : '';
        crtPartnerServices = [];

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
                '<div class="ad-form-card-title">' + L.crtCourtType + '</div>' +
                '<div class="ad-court-type-header">' +
                    '<span>' + L.crtType + '</span>' +
                    '<span>' + L.crtSurface + '</span>' +
                    '<span>' + L.crtCourtsCount + '</span>' +
                    '<span>' + L.crtPrice + '</span>' +
                    '<span>' + L.crtPartner + '</span>' +
                    '<span>' + L.crtDiscount + '</span>' +
                    '<span></span>' +
                '</div>' +
                '<div id="adCrtTypesRows"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtTypesAdd">' + L.crtAdd + '</button>' +
            '</div>' +

            // Additional Services (dynamic rows)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.crtAdditionalServices + '</div>' +
                '<div class="ad-court-type-header ad-court-svc-header">' +
                    '<span>' + L.crtServiceName + '</span>' +
                    '<span>' + L.crtServicePrice + '</span>' +
                    '<span>' + L.crtPartner + '</span>' +
                    '<span>' + L.crtDiscount + '</span>' +
                    '<span></span>' +
                '</div>' +
                '<div id="adCrtServicesRows"></div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtServicesAdd">' + L.crtAdd + '</button>' +
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
                            '<input type="text" class="ad-field-input" id="adCrtCity" list="adCrtCityList" autocomplete="off" value="' + A.esc(item ? item.city : 'Бишкек') + '">' +
                            '<datalist id="adCrtCityList">' +
                                crtKnownCities.map(function(c) { return '<option value="' + A.esc(c.ru) + '">'; }).join('') +
                            '</datalist>' +
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
                '<div class="ad-form-row" style="margin-top:12px;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">WhatsApp</label>' +
                        whatsappRowHtml(item) +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">Instagram</label>' +
                        '<input type="text" class="ad-field-input" id="adCrtInstagram" placeholder="@tclubkg" value="' + A.esc(item ? (item.instagram || '') : '') + '">' +
                    '</div>' +
                '</div>' +
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

            // Partner section (visible when court is partner)
            '<div class="ad-form-card" id="adCrtPartnerCard" style="display:' + (item && item.partner ? 'block' : 'none') + ';">' +
                '<div class="ad-form-card-title">' + L.crtPartnerSection + '</div>' +
                '<p class="ad-field-hint" style="margin-bottom:12px;">' + L.crtPartnerHint + '</p>' +
                '<div class="ad-form-row" style="align-items:flex-end;">' +
                    '<div class="ad-field" style="flex:0 0 200px;">' +
                        '<label class="ad-field-label">' + L.crtPartnerPin + '</label>' +
                        '<div style="display:flex;gap:6px;">' +
                            '<input type="text" class="ad-field-input" id="adCrtPartnerPin" value="' + A.esc(crtPartnerPin) + '" readonly style="font-size:1.2rem;letter-spacing:4px;text-align:center;font-weight:700;">' +
                            '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adCrtResetPin">' + L.crtResetPin + '</button>' +
                        '</div>' +
                    '</div>' +
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
                    '<input type="text" class="ad-field-input ad-ct-discount" inputmode="numeric" pattern="[0-9]*" placeholder="%" value="' + (ct.discount || '') + '"' + (ct.partner ? '' : ' style="visibility:hidden"') + '>' +
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
            if (e.target.classList.contains('ad-ct-partner')) {
                crtCourtTypes[idx].partner = e.target.checked;
                var discountInput = row.querySelector('.ad-ct-discount');
                if (discountInput) {
                    discountInput.style.visibility = e.target.checked ? 'visible' : 'hidden';
                    if (!e.target.checked) { crtCourtTypes[idx].discount = 0; discountInput.value = ''; }
                }
                updatePartnerVisibility();
            }
        });
        document.getElementById('adCrtTypesRows').addEventListener('input', function(e) {
            var row = e.target.closest('.ad-court-type-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-ct-count')) {
                crtCourtTypes[idx].count = clampNumberInput(e.target, 99);
            }
            if (e.target.classList.contains('ad-ct-price')) {
                crtCourtTypes[idx].price = clampNumberInput(e.target, 999999);
            }
            if (e.target.classList.contains('ad-ct-surface-custom')) {
                crtCourtTypes[idx].surface = e.target.value.trim();
            }
            if (e.target.classList.contains('ad-ct-discount')) {
                crtCourtTypes[idx].discount = clampNumberInput(e.target, 100);
            }
        });

        // Additional Services rows
        function renderCrtServiceRows() {
            var rowsEl = document.getElementById('adCrtServicesRows');
            if (!rowsEl) return;
            var html = '';
            crtAdditionalServices.forEach(function(svc, idx) {
                html += '<div class="ad-court-type-row ad-court-svc-row" data-idx="' + idx + '">' +
                    '<input type="text" class="ad-field-input ad-svc-name" placeholder="' + L.crtServiceName + '..." value="' + A.esc(svc.name || '') + '">' +
                    '<input type="text" class="ad-field-input ad-svc-price" inputmode="numeric" pattern="[0-9]*" value="' + (svc.price || '') + '">' +
                    '<label class="ad-ct-partner-wrap"><input type="checkbox" class="ad-svc-partner"' + (svc.partner ? ' checked' : '') + '></label>' +
                    '<input type="text" class="ad-field-input ad-svc-discount" inputmode="numeric" pattern="[0-9]*" placeholder="%" value="' + (svc.discount || '') + '"' + (svc.partner ? '' : ' style="visibility:hidden"') + '>' +
                    '<button type="button" class="ad-btn-icon ad-svc-remove">&times;</button>' +
                '</div>';
            });
            rowsEl.innerHTML = html;
        }
        renderCrtServiceRows();

        document.getElementById('adCrtServicesAdd').addEventListener('click', function() {
            crtAdditionalServices.push({ name: '', name_en: '', name_kg: '', price: 0, partner: false });
            renderCrtServiceRows();
        });

        document.getElementById('adCrtServicesRows').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-svc-remove');
            if (!rmBtn) return;
            var row = rmBtn.closest('.ad-court-svc-row');
            var idx = parseInt(row.dataset.idx, 10);
            crtAdditionalServices.splice(idx, 1);
            renderCrtServiceRows();
            updatePartnerVisibility();
        });

        document.getElementById('adCrtServicesRows').addEventListener('change', function(e) {
            var row = e.target.closest('.ad-court-svc-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-svc-partner')) {
                crtAdditionalServices[idx].partner = e.target.checked;
                var discountInput = row.querySelector('.ad-svc-discount');
                if (discountInput) {
                    discountInput.style.visibility = e.target.checked ? 'visible' : 'hidden';
                    if (!e.target.checked) { crtAdditionalServices[idx].discount = 0; discountInput.value = ''; }
                }
                updatePartnerVisibility();
            }
        });

        document.getElementById('adCrtServicesRows').addEventListener('input', function(e) {
            var row = e.target.closest('.ad-court-svc-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-svc-name')) {
                crtAdditionalServices[idx].name = e.target.value.trim();
            }
            if (e.target.classList.contains('ad-svc-price')) {
                crtAdditionalServices[idx].price = clampNumberInput(e.target, 999999);
            }
            if (e.target.classList.contains('ad-svc-discount')) {
                crtAdditionalServices[idx].discount = clampNumberInput(e.target, 100);
            }
        });

        function updatePartnerVisibility() {
            var isAnyPartner = crtCourtTypes.some(function(ct) { return ct.partner; }) || crtAdditionalServices.some(function(s) { return s.partner; });
            var partnerCard = document.getElementById('adCrtPartnerCard');
            if (partnerCard) {
                partnerCard.style.display = isAnyPartner ? 'block' : 'none';
                if (isAnyPartner && !crtPartnerPin) {
                    crtPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
                    document.getElementById('adCrtPartnerPin').value = crtPartnerPin;
                }
            }
        }

        // Phones: render
        function renderCrtPhones() {
            var phonesEl = document.getElementById('adCrtPhones');
            if (!phonesEl) return;
            var html = '';
            crtPhones.forEach(function(ph, idx) {
                var label = idx === 0 ? (isEn ? 'Phone' : 'Телефон') : (isEn ? 'Additional phone' : 'Доп. телефон');
                var parts = window.KSLT_PHONE
                    ? KSLT_PHONE.split(ph)
                    : { iso: 'KG', rest: String(ph || '').replace(/\D/g, '') };

                var shown = window.KSLT_PHONE ? KSLT_PHONE.format(parts.iso, parts.rest) : parts.rest;
                var hint = window.KSLT_PHONE ? KSLT_PHONE.placeholder(parts.iso) : '000 000 000';

                html += '<div class="ad-phone-row">' +
                    '<div class="ad-field" style="flex:1;">' +
                        '<label class="ad-field-label">' + label + '</label>' +
                        '<div style="display:flex;gap:6px;">' +
                            (window.KSLT_PHONE
                                ? KSLT_PHONE.pickerHtml(parts.iso, isEn ? 'en' : 'ru', 'ad-crt-phone-country" data-idx="' + idx)
                                : '') +
                            '<input type="text" inputmode="numeric" class="ad-field-input ad-crt-phone" data-idx="' + idx + '" placeholder="' + hint + '" value="' + A.esc(shown) + '" style="flex:1;">' +
                        '</div>' +
                    '</div>' +
                    (idx >= 1 ? '<button type="button" class="ad-btn-icon ad-phone-remove" data-idx="' + idx + '" title="' + (isEn ? 'Remove' : 'Убрать') + '">&times;</button>' : '') +
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
            reformatPhoneInput(e.target, phoneIso(idx), document.querySelector('.ad-crt-phone-country[data-idx="' + idx + '"]'));
            storePhone(idx);
        });

        function phoneIso(idx) {
            var picker = document.querySelector('.ad-crt-phone-country[data-idx="' + idx + '"]');
            return picker ? picker.dataset.iso : 'KG';
        }

        // Номер собираем вместе с кодом выбранной страны
        function storePhone(idx) {
            var input = document.querySelector('.ad-crt-phone[data-idx="' + idx + '"]');
            if (!input) return;
            crtPhones[idx] = window.KSLT_PHONE
                ? (KSLT_PHONE.join(phoneIso(idx), input.value) || '')
                : (input.value.replace(/\D/g, '') ? '+996' + input.value.replace(/\D/g, '') : '');
        }

        if (window.KSLT_PHONE) {
            KSLT_PHONE.initPickers(function(root, iso) {
                if (root.classList.contains('ad-crt-wa-country')) {
                    // Формат номера у каждой страны свой — подсказка и уже
                    // введённые цифры перестраиваются под выбранную
                    var wa = document.getElementById('adCrtWhatsapp');
                    if (wa) {
                        wa.placeholder = KSLT_PHONE.placeholder(iso);
                        reformatPhoneInput(wa, iso);
                    }
                    return;
                }
                if (!root.classList.contains('ad-crt-phone-country')) return;
                var idx = parseInt(root.dataset.idx, 10);
                var input = document.querySelector('.ad-crt-phone[data-idx="' + idx + '"]');
                if (input) {
                    input.placeholder = KSLT_PHONE.placeholder(iso);
                    reformatPhoneInput(input, iso);
                }
                storePhone(idx);
            });
        }

        var cityInput = document.getElementById('adCrtCity');
        if (cityInput) {
            cityInput.addEventListener('change', applyCityChoice);
            cityInput.addEventListener('blur', applyCityChoice);
        }

        function applyCityChoice() {
            var input = document.getElementById('adCrtCity');
            if (!input) return;

            var value = normalizeCity(input.value);
            if (!value) { input.value = ''; return; }

            // Тот же город, записанный иначе: «Кара-Кол» вместо «Каракол».
            // Берём написание, которое уже в базе — иначе в фильтре
            // появится второй город с одним кортом
            var twin = similarCity(value);
            if (twin) value = twin.ru;

            input.value = value;

            var known = null;
            crtKnownCities.forEach(function(c) { if (c.ru === value) known = c; });
            if (!known) return;

            // Переводы подставляем от уже заведённого города: вручную их
            // забывали заполнить, и на английской версии фильтр разъезжался
            var en = document.getElementById('adCrtCityEn');
            var kg = document.getElementById('adCrtCityKg');
            if (en && known.en && !en.value.trim()) en.value = known.en;
            if (kg && known.kg && !kg.value.trim()) kg.value = known.kg;
        }

        var waInput = document.getElementById('adCrtWhatsapp');
        if (waInput) {
            waInput.addEventListener('input', function() {
                var picker = document.querySelector('.ad-crt-wa-country');
                reformatPhoneInput(waInput, picker ? picker.dataset.iso : 'KG', picker);
            });
            waInput.addEventListener('blur', function() {
                var picker = document.querySelector('.ad-crt-wa-country');
                phoneWarnCheckFull(waInput, picker ? picker.dataset.iso : 'KG');
            });
        }

        document.getElementById('adCrtPhones').addEventListener('blur', function(e) {
            if (!e.target.classList.contains('ad-crt-phone')) return;
            phoneWarnCheckFull(e.target, phoneIso(parseInt(e.target.dataset.idx, 10)));
        }, true);

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

        // Partner section
        document.getElementById('adCrtResetPin').addEventListener('click', function() {
            crtPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
            document.getElementById('adCrtPartnerPin').value = crtPartnerPin;
        });
        // Load partner PIN if editing
        if (crtEditingId && item && item.partner) {
            // Auto-generate PIN if missing
            if (!crtPartnerPin) {
                crtPartnerPin = String(Math.floor(1000 + Math.random() * 9000));
                document.getElementById('adCrtPartnerPin').value = crtPartnerPin;
            }
        }

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

    // ---- Partner Services (Courts) ----
    async function loadCrtPartnerServices(courtId) {
        if (!A.client) return;
        var result = await A.client.from('partner_services')
            .select('*')
            .eq('entity_type', 'court')
            .eq('entity_id', courtId)
            .order('sort_order', { ascending: true });
        crtPartnerServices = (result.data && result.data.length) ? result.data : [];
        if (crtPartnerServices.length === 0) {
            crtPartnerServices.push({ id: null, service_name: L.crtDefaultService, service_name_en: '', service_name_kg: '', discount_percent: 0 });
        }
        renderCrtPartnerServices();
    }

    function renderCrtPartnerServices() {
        var container = document.getElementById('adCrtPartnerServicesRows');
        if (!container) return;
        var html = '';
        crtPartnerServices.forEach(function(svc, idx) {
            html += '<div class="ad-partner-svc-row" data-idx="' + idx + '" style="display:grid;grid-template-columns:1fr 100px 40px;gap:8px;margin-bottom:6px;align-items:center;">' +
                '<input type="text" class="ad-field-input ad-psvc-name" value="' + A.esc(svc.service_name || '') + '" placeholder="' + L.crtServiceName + '">' +
                '<input type="number" class="ad-field-input ad-psvc-discount" value="' + (svc.discount_percent || '') + '" min="1" max="100" placeholder="%">' +
                (crtPartnerServices.length > 1 ? '<button type="button" class="ad-btn-icon ad-psvc-remove">&times;</button>' : '<div></div>') +
            '</div>';
        });
        container.innerHTML = html;

        // Events
        container.addEventListener('input', function handler(e) {
            var row = e.target.closest('.ad-partner-svc-row');
            if (!row) return;
            var idx = parseInt(row.dataset.idx, 10);
            if (e.target.classList.contains('ad-psvc-name')) crtPartnerServices[idx].service_name = e.target.value.trim();
            if (e.target.classList.contains('ad-psvc-discount')) crtPartnerServices[idx].discount_percent = parseInt(e.target.value, 10) || 0;
        });
        container.addEventListener('click', function(e) {
            if (e.target.classList.contains('ad-psvc-remove')) {
                var row = e.target.closest('.ad-partner-svc-row');
                var idx = parseInt(row.dataset.idx, 10);
                crtPartnerServices.splice(idx, 1);
                renderCrtPartnerServices();
            }
        });
    }

    async function saveCrtPartnerData(courtId) {
        if (!A.client) return;
        var isPartner = crtCourtTypes.some(function(ct) { return ct.partner; }) || crtAdditionalServices.some(function(s) { return s.partner; });
        if (!isPartner) {
            // Not a partner — remove all partner_services and pin
            await A.client.from('partner_services').delete().eq('entity_type', 'court').eq('entity_id', courtId);
            return;
        }

        // Save partner_pin
        await A.client.from('courts').update({ partner_pin: crtPartnerPin }).eq('id', courtId);

        // Build services list from court_types + additional_services with partner=true
        var newServices = [];
        var sortIdx = 0;
        crtCourtTypes.forEach(function(ct) {
            if (!ct.partner || !ct.discount) return;
            var typeName = A.COURT_TYPES[ct.type] || ct.type || '';
            var surfaceName = A.COURT_SURFACES[ct.surface] || ct.surface || '';
            var name = typeName + (surfaceName ? ' (' + surfaceName + ')' : '');
            newServices.push({ service_name: name, discount_percent: ct.discount, sort_order: sortIdx++ });
        });
        crtAdditionalServices.forEach(function(svc) {
            if (!svc.partner || !svc.discount) return;
            newServices.push({ service_name: svc.name || '', discount_percent: svc.discount, sort_order: sortIdx++ });
        });

        // Delete all existing partner_services for this court
        await A.client.from('partner_services').delete().eq('entity_type', 'court').eq('entity_id', courtId);

        // Insert new
        for (var i = 0; i < newServices.length; i++) {
            var s = newServices[i];
            if (!s.service_name) continue;
            await A.client.from('partner_services').insert({
                entity_type: 'court',
                entity_id: courtId,
                service_name: s.service_name,
                service_name_en: null,
                service_name_kg: null,
                discount_percent: s.discount_percent || 0,
                sort_order: s.sort_order,
                is_active: true
            });
        }
    }

    // ---- Save Court ----
    /**
     * Номера проверяем перед записью, а не только при наборе: подсказка под
     * полем ничего не запрещает. Особенно это заметно при смене страны —
     * кыргызские девять цифр остаются в поле, а России нужно десять.
     */
    function validatePhones() {
        if (!window.KSLT_PHONE) return true;
        var bad = null;

        document.querySelectorAll('.ad-crt-phone').forEach(function(input) {
            var idx = parseInt(input.dataset.idx, 10);
            var picker = document.querySelector('.ad-crt-phone-country[data-idx="' + idx + '"]');
            var iso = picker ? picker.dataset.iso : 'KG';
            var n = input.value.replace(/[^0-9]/g, '').length;
            var need = KSLT_PHONE.byIso(iso).len;
            if (n && n !== need) {
                phoneWarn(input, (isEn ? 'Number is incomplete: ' : 'Неполный номер: нужно ') + need + (isEn ? ' digits needed' : ' цифр'), true);
                if (!bad) bad = input;
            }
        });

        var wa = document.getElementById('adCrtWhatsapp');
        if (wa) {
            var waPicker = document.querySelector('.ad-crt-wa-country');
            var waIso = waPicker ? waPicker.dataset.iso : 'KG';
            var waN = wa.value.replace(/[^0-9]/g, '').length;
            var waNeed = KSLT_PHONE.byIso(waIso).len;
            if (waN && waN !== waNeed) {
                phoneWarn(wa, (isEn ? 'Number is incomplete: ' : 'Неполный номер: нужно ') + waNeed + (isEn ? ' digits needed' : ' цифр'), true);
                if (!bad) bad = wa;
            }
        }

        // Один и тот же номер в двух полях — на карточке корта он выведется
        // дважды через запятую
        if (!bad) {
            var seen = {};
            document.querySelectorAll('.ad-crt-phone').forEach(function(input) {
                var idx = parseInt(input.dataset.idx, 10);
                var picker = document.querySelector('.ad-crt-phone-country[data-idx="' + idx + '"]');
                var full = KSLT_PHONE.join(picker ? picker.dataset.iso : 'KG', input.value);
                if (!full) return;
                if (seen[full]) {
                    phoneWarn(input, isEn ? 'This number is already listed' : 'Этот номер уже есть выше', true);
                    if (!bad) bad = input;
                }
                seen[full] = true;
            });
        }

        if (bad) {
            bad.scrollIntoView({ behavior: 'smooth', block: 'center' });
            bad.focus();
            A.showToast(isEn ? 'Check the phone numbers' : 'Проверьте номера телефонов', 'error');
            return false;
        }
        return true;
    }

    /** Почта: браузерная проверка не срабатывает — сохраняем скриптом. */
    function validateEmail() {
        var input = document.getElementById('adCrtEmail');
        if (!input) return true;
        var v = input.value.trim();
        if (!v) return true;
        if (/^[^\s@]+@[^\s@]+\.[a-zA-Z]{2,}$/.test(v)) {
            input.classList.remove('ad-input-error');
            var hint = input.parentNode.querySelector('.ad-input-hint');
            if (hint) hint.remove();
            return true;
        }
        input.classList.add('ad-input-error');
        var box = input.parentNode;
        var h = box.querySelector('.ad-input-hint');
        if (!h) {
            h = document.createElement('div');
            h.className = 'ad-input-hint';
            box.appendChild(h);
        }
        h.textContent = isEn ? 'Check the email address' : 'Проверьте адрес почты';
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
        input.focus();
        A.showToast(isEn ? 'Check the email address' : 'Проверьте адрес почты', 'error');
        return false;
    }

    /**
     * Адрес страницы корта делается из названия и должен быть единственным
     * на весь сайт. Два корта с одним названием раньше упирались в отказ
     * базы: человек видел техническую ошибку про дубликат ключа.
     */
    async function uniqueCourtId(name) {
        var base = A.slugify(name) || 'court';
        if (!A.client) return base;

        var res = await A.client.from('courts').select('id').like('id', base + '%');
        if (res.error || !res.data || !res.data.length) return base;

        var taken = {};
        res.data.forEach(function(row) { taken[row.id] = true; });
        if (!taken[base]) return base;

        for (var n = 2; n < 100; n++) {
            if (!taken[base + '-' + n]) return base + '-' + n;
        }
        return base + '-' + Date.now();
    }

    async function saveCourtHandler() {
        if (!validatePhones()) return;
        if (!validateEmail()) return;

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
                city: normalizeCity(document.getElementById('adCrtCity').value) || null,
                city_en: document.getElementById('adCrtCityEn').value.trim() || null,
                city_kg: document.getElementById('adCrtCityKg').value.trim() || null,
                postal_code: document.getElementById('adCrtPostal').value.trim() || null,
                phone: phonesStr || null,
                whatsapp: whatsappValue(),
                instagram: instagramHandle(document.getElementById('adCrtInstagram').value),
                email: document.getElementById('adCrtEmail').value.trim() || null,
                description: document.getElementById('adCrtDesc').value.trim() || null,
                description_en: document.getElementById('adCrtDescEn').value.trim() || null,
                description_kg: document.getElementById('adCrtDescKg').value.trim() || null,
                amenities: amenities,
                slogan: document.getElementById('adCrtSlogan').value.trim() || null,
                slogan_en: document.getElementById('adCrtSloganEn').value.trim() || null,
                slogan_kg: document.getElementById('adCrtSloganKg').value.trim() || null,
                additional_services: crtAdditionalServices,
                partner: crtCourtTypes.some(function(ct) { return ct.partner; }) || crtAdditionalServices.some(function(s) { return s.partner; })
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
                data.id = await uniqueCourtId(name);
                result = await A.client.from('courts').insert(data);
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Save partner services
            var courtId = crtEditingId || data.id;
            await saveCrtPartnerData(courtId);

            await loadKnownCities();

            A.showToast(L.saved, 'success');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
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
