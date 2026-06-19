// ============================================
// KSLT Admin — Tournaments CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var trnEditingId = null;
    var trnEditingPublishedAt = null;
    var trnEditingStatus = null;
    var trnImageFile = null;
    var trnImageUrl = '';
    var trnAllData = [];
    var trnSearchQuery = '';
    var trnFilterCategory = '';
    var trnFilterStatus = '';
    var trnSortCol = 'date_start';
    var trnSortAsc = false;
    var trnPage = 1;
    var TRN_PER_PAGE = 15;
    var trnDraftDirty = false;
    var trnAutosaveTimer = null;
    var trnAutosaving = false;

    async function renderTournamentsSection() {
        await A.loadCategories();
        await A.loadTournamentLevels();
        if (A.isDeepLinked('tournaments')) return;
        renderTournamentsList();
    }

    // ---- Tournament List ----
    async function renderTournamentsList() {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;

        // Reset filters
        trnSearchQuery = '';
        trnFilterCategory = '';
        trnFilterStatus = '';
        trnSortCol = 'date_start';
        trnSortAsc = false;
        trnPage = 1;

        // Category filter options — deduplicate Friendly
        var catFilterHtml = '<option value="">' + L.trnAllCategories + '</option>';
        var friendlyFilterSeen = false;
        A.cachedCategories.forEach(function(c) {
            var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
            if (isFriendly) {
                if (friendlyFilterSeen) return;
                friendlyFilterSeen = true;
            }
            var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '♀ ' : '♂ ');
            var catName = isEn ? c.name_en : c.name;
            catFilterHtml += '<option value="' + c.id + '">' + genderIcon + catName + '</option>';
        });

        // Status filter options
        var statusFilterHtml = '<option value="">' + L.trnAllStatuses + '</option>';
        statusFilterHtml += '<option value="draft">' + L.trnDraft + '</option>';
        Object.keys(A.TOURNAMENT_STATUSES).forEach(function(key) {
            statusFilterHtml += '<option value="' + key + '">' + A.TOURNAMENT_STATUSES[key] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.tournaments + '</h2>' +
            '</div>' +
            '<div class="ad-trn-stats-header">' +
                L.trnStatTotal + ': <span id="adTrnStatTotal">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatUpcoming + ': <span id="adTrnStatUpcoming">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatCompleted + ': <span id="adTrnStatCompleted">...</span>' +
            '</div>' +
            '<div class="ad-trn-stats-grid">' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2642 ' + L.trnStatMenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMS">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyMS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2640 ' + L.trnStatWomenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWS">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyWS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2642 ' + L.trnStatMenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMD">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyMD"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\u2640 ' + L.trnStatWomenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWD">...</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body" id="adTrnBodyWD"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">\uD83E\uDD1D ' + L.trnStatFriendly + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalFR">...</span>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky" id="adTrnFilterRow">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adTrnSearch" placeholder="' + L.trnSearch + '">' +
                '<select class="ad-field-input ad-filter-select" id="adTrnCategoryFilter">' + catFilterHtml + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="adTrnStatusFilter">' + statusFilterHtml + '</select>' +
                '<button class="ad-btn ad-btn-primary" id="adTrnAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addTournament + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-col-dropdown" id="adTrnColDropdown" style="display:none;"></div>' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adTrnTable">' +
                        '<thead><tr>' +
                            trnColHeader('title', L.trnTitle) +
                            trnColHeader('category', L.trnCategory) +
                            trnColHeader('status', L.trnStatus) +
                            trnColHeader('date_start', L.trnDateStart) +
                            trnColHeader('date_end', L.trnDateEndShort) +
                            trnColHeader('participants', L.trnMaxParticipantsShort) +
                            '<th></th>' +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="8" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
            '</div>';

        // Add button
        document.getElementById('adTrnAdd').addEventListener('click', function() {
            renderTournamentForm(null);
        });

        // Search with debounce
        var trnSearchTimer = null;
        document.getElementById('adTrnSearch').addEventListener('input', function() {
            var val = this.value.trim();
            clearTimeout(trnSearchTimer);
            trnSearchTimer = setTimeout(function() {
                trnSearchQuery = val;
                trnPage = 1;
                applyTrnFilters();
            }, 300);
        });

        // Category filter
        document.getElementById('adTrnCategoryFilter').addEventListener('change', function() {
            trnFilterCategory = this.value;
            trnPage = 1;
            applyTrnFilters();
        });

        // Status filter
        document.getElementById('adTrnStatusFilter').addEventListener('change', function() {
            trnFilterStatus = this.value;
            trnPage = 1;
            applyTrnFilters();
        });

        // Column header click → dropdown
        var thead = document.querySelector('#adTrnTable thead');
        if (thead) {
            thead.addEventListener('click', function(e) {
                var hdr = e.target.closest('.ad-col-header');
                if (!hdr) return;
                openTrnColDropdown(hdr.dataset.col, hdr);
            });
        }

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adTrnColDropdown');
            if (dd && dd.style.display === 'block' && !e.target.closest('.ad-col-dropdown') && !e.target.closest('.ad-col-header')) {
                dd.style.display = 'none';
            }
        });

        await loadTournamentsList();
    }

    async function loadTournamentsList() {
        if (!A.client) return;

        var result = await A.client.from('tournaments')
            .select('id,title,image,category_id,format,status,date_start,date_end,max_participants,bracket_type,draw_size,published_at,registration_start,registration_end')
            .order('created_at', { ascending: false });

        var items = result.data || [];
        trnAllData = items;
        updateTournamentStats();
        applyTrnFilters();
    }

    function updateTournamentStats() {
        var total = trnAllData.length;
        var upcoming = 0;
        var completed = 0;
        trnAllData.forEach(function(t) {
            var isDraft = !t.published_at && (!t.status || t.status === 'upcoming');
            if (isDraft) return; // skip drafts
            if (t.status === 'completed') { completed++; return; }
            if (t.status !== 'cancelled') upcoming++;
        });

        var elTotal = document.getElementById('adTrnStatTotal');
        var elUp = document.getElementById('adTrnStatUpcoming');
        var elComp = document.getElementById('adTrnStatCompleted');
        if (elTotal) elTotal.textContent = total;
        if (elUp) elUp.textContent = upcoming;
        if (elComp) elComp.textContent = completed;

        var cards = [
            { gender: 'men', format: 'singles', totalId: 'adTrnTotalMS', bodyId: 'adTrnBodyMS' },
            { gender: 'women', format: 'singles', totalId: 'adTrnTotalWS', bodyId: 'adTrnBodyWS' },
            { gender: 'men', format: 'doubles', totalId: 'adTrnTotalMD', bodyId: 'adTrnBodyMD' },
            { gender: 'women', format: 'doubles', totalId: 'adTrnTotalWD', bodyId: 'adTrnBodyWD' }
        ];

        cards.forEach(function(card) {
            var filtered = trnAllData.filter(function(t) {
                var cat = A.categoriesMap[t.category_id];
                return cat && cat.gender === card.gender && t.format === card.format;
            });
            var cardTotal = filtered.length;
            var totalEl = document.getElementById(card.totalId);
            var bodyEl = document.getElementById(card.bodyId);
            if (totalEl) totalEl.textContent = cardTotal;
            if (!bodyEl) return;

            var breakdown = {};
            filtered.forEach(function(t) {
                var cat = A.categoriesMap[t.category_id];
                if (!cat) return;
                var key = cat.id;
                if (!breakdown[key]) breakdown[key] = { name: isEn ? cat.name_en : cat.name, sort: cat.sort_order || 0, count: 0 };
                breakdown[key].count++;
            });

            var sorted = Object.keys(breakdown).map(function(k) { return breakdown[k]; });
            sorted.sort(function(a, b) { return a.sort - b.sort; });

            var html = '';
            sorted.forEach(function(row) {
                if (row.count > 0) {
                    var pct = cardTotal > 0 ? Math.round(row.count / cardTotal * 100) : 0;
                    html += '<div class="ad-crt-stat-row">' +
                        '<span class="ad-crt-stat-surface">' + row.name + '</span>' +
                        '<div class="ad-crt-stat-bar-wrap"><div class="ad-crt-stat-bar" style="width:' + pct + '%;"></div></div>' +
                        '<span class="ad-crt-stat-count">' + row.count + '</span>' +
                    '</div>';
                }
            });
            bodyEl.innerHTML = html;
        });

        var friendlyTotal = trnAllData.filter(function(t) { var cat = A.categoriesMap[t.category_id]; return cat && ((cat.name || '').toLowerCase() === 'friendly' || cat.gender === null); }).length;
        var elFR = document.getElementById('adTrnTotalFR');
        if (elFR) elFR.textContent = friendlyTotal;
    }

    // ---- Tournament Column Header ----
    function trnColHeader(col, label) {
        var sortable = col === 'title' || col === 'category' || col === 'status' || col === 'date_start' || col === 'date_end' || col === 'participants';
        if (!sortable) return '<th>' + label + '</th>';
        var isActive = trnSortCol === col;
        var cls = 'ad-col-header' + (isActive ? ' ad-col-active' : '');
        return '<th><div class="' + cls + '" data-col="' + col + '">' +
            '<span>' + label + '</span>' +
            (isActive ? '<span class="ad-sort-arrow">' + (trnSortAsc ? '↑' : '↓') + '</span>' : '') +
            '<span class="ad-col-filter-btn">▼</span>' +
        '</div></th>';
    }

    // ---- Tournament Apply Filters ----
    function applyTrnFilters() {
        var items = trnAllData.slice();

        // Filter by category
        if (trnFilterCategory) {
            items = items.filter(function(t) {
                return t.category_id === trnFilterCategory;
            });
        }

        // Filter by status
        if (trnFilterStatus) {
            items = items.filter(function(t) {
                var isDraft = !t.published_at && (!t.status || t.status === 'upcoming');
                if (trnFilterStatus === 'draft') return isDraft;
                return !isDraft && t.status === trnFilterStatus;
            });
        }

        // Search by title
        if (trnSearchQuery) {
            var q = trnSearchQuery.toLowerCase();
            items = items.filter(function(t) {
                return (t.title || '').toLowerCase().indexOf(q) !== -1;
            });
        }

        // Sort
        if (trnSortCol === 'title') {
            items.sort(function(a, b) {
                var va = (a.title || '').toLowerCase();
                var vb = (b.title || '').toLowerCase();
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'category') {
            items.sort(function(a, b) {
                var ca = A.categoriesMap[a.category_id];
                var cb = A.categoriesMap[b.category_id];
                var va = ca ? (isEn ? ca.name_en : ca.name) : '';
                var vb = cb ? (isEn ? cb.name_en : cb.name) : '';
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'status') {
            items.sort(function(a, b) {
                var va = (A.TOURNAMENT_STATUSES[a.status] || a.status || '').toLowerCase();
                var vb = (A.TOURNAMENT_STATUSES[b.status] || b.status || '').toLowerCase();
                return trnSortAsc ? va.localeCompare(vb) : vb.localeCompare(va);
            });
        } else if (trnSortCol === 'date_start') {
            items.sort(function(a, b) {
                var va = a.date_start || '';
                var vb = b.date_start || '';
                return trnSortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (vb < va ? -1 : vb > va ? 1 : 0);
            });
        } else if (trnSortCol === 'date_end') {
            items.sort(function(a, b) {
                var va = a.date_end || '';
                var vb = b.date_end || '';
                return trnSortAsc ? (va < vb ? -1 : va > vb ? 1 : 0) : (vb < va ? -1 : vb > va ? 1 : 0);
            });
        } else if (trnSortCol === 'participants') {
            items.sort(function(a, b) {
                var va = a.max_participants || 0;
                var vb = b.max_participants || 0;
                return trnSortAsc ? va - vb : vb - va;
            });
        }

        // Pagination
        var totalPages = Math.max(1, Math.ceil(items.length / TRN_PER_PAGE));
        if (trnPage > totalPages) trnPage = totalPages;
        var start = (trnPage - 1) * TRN_PER_PAGE;
        var pageItems = items.slice(start, start + TRN_PER_PAGE);

        renderTrnRows(pageItems);
        renderTrnPagination(items.length, totalPages);
    }

    // ---- Tournament Render Rows ----
    function renderTrnRows(items) {
        var table = document.getElementById('adTrnTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="8" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🏆</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noTournaments + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noTournamentsText + '</div>' +
                '</td></tr>';
            return;
        }

        tbody.innerHTML = '';
        items.forEach(function(t) {
            var catObj = A.categoriesMap[t.category_id];
            var isCatFriendly = catObj && ((catObj.name || '').toLowerCase() === 'friendly' || catObj.gender === null);
            var catGIcon = catObj ? (isCatFriendly ? '' : (catObj.gender === 'women' ? '♀ ' : '♂ ')) : '';
            var catLabel = catObj ? catGIcon + (isEn ? catObj.name_en : catObj.name) : (t.category_id || L.noData);
            var statusLabel, statusClass;
            var isDraft = !t.published_at && (!t.status || t.status === 'upcoming');
            if (isDraft) {
                statusLabel = L.trnDraft;
                statusClass = 'ad-status-draft';
            } else if (t.status === 'cancelled' || t.status === 'registration_closed' || t.status === 'completed') {
                statusLabel = A.TOURNAMENT_STATUSES[t.status] || t.status;
                statusClass = 'ad-status-' + (t.status || '').replace(/_/g, '-');
            } else {
                var autoSt = A.computeTournamentStatus(t.registration_start, t.registration_end, t.date_start, t.date_end);
                statusLabel = A.TOURNAMENT_STATUSES[autoSt] || L.statusUpcoming;
                statusClass = 'ad-status-' + autoSt.replace(/_/g, '-');
            }

            var dateStartStr = t.date_start
                ? new Date(t.date_start + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : L.noData;
            var dateEndStr = t.date_end
                ? new Date(t.date_end + 'T00:00:00').toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : '—';

            tbody.innerHTML +=
                '<tr data-trn-id="' + t.id + '">' +
                    A.bulkCheckboxTd(t.id) +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (t.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="text-align:center;"><span class="ad-status-badge ' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td style="text-align:center;">' + dateStartStr + '</td>' +
                    '<td style="text-align:center;">' + dateEndStr + '</td>' +
                    '<td style="text-align:center;">' + (t.max_participants || L.noData) + '</td>' +
                    '<td>' + (t.bracket_type ? '<button class="ad-btn ad-btn-sm ad-btn-secondary ad-brk-btn" data-brk-id="' + t.id + '">' + L.bracketTab + '</button>' : '') + '</td>' +
                '</tr>';
        });

        // Click bracket button / row
        tbody.onclick = function(e) {
            var brkBtn = e.target.closest('.ad-brk-btn');
            if (brkBtn) {
                e.stopPropagation();
                A.renderBracketManagement(brkBtn.dataset.brkId);
                return;
            }
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-trn-id]');
            if (!row) return;
            loadAndEditTournament(row.dataset.trnId);
        };

        A.setupBulkDelete({ tableId: 'adTrnTable', tableName: 'tournaments', reloadFn: function() { loadTournamentsList(); } });
    }

    // ---- Tournament Pagination ----
    function renderTrnPagination(totalItems, totalPages) {
        var existing = document.getElementById('adTrnPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adTrnPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        html += '<button class="ad-crt-page-btn" data-page="' + (trnPage - 1) + '"' + (trnPage <= 1 ? ' disabled' : '') + '>&laquo;</button>';
        for (var p = 1; p <= totalPages; p++) {
            html += '<button class="ad-crt-page-btn' + (p === trnPage ? ' ad-crt-page-active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }
        html += '<button class="ad-crt-page-btn" data-page="' + (trnPage + 1) + '"' + (trnPage >= totalPages ? ' disabled' : '') + '>&raquo;</button>';
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;

        var tableCard = document.querySelector('#adTrnTable')?.closest('.ad-table-card');
        if (tableCard) tableCard.after(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-crt-page-btn');
            if (!btn || btn.disabled) return;
            trnPage = parseInt(btn.dataset.page, 10);
            applyTrnFilters();
        });
    }

    // ---- Tournament Column Dropdown ----
    function openTrnColDropdown(col, hdr) {
        var dd = document.getElementById('adTrnColDropdown');
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

        var colLabels = { title: L.trnTitle, category: L.trnCategory, status: L.trnStatus, date_start: L.trnDateStart, date_end: L.trnDateEnd, participants: L.trnMaxParticipants };
        var isNumeric = col === 'participants';
        var isDate = col === 'date_start' || col === 'date_end';

        var html = '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';

        if (isNumeric) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Most first' : '↓ Сначала больше') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Least first' : '↑ Сначала меньше') + '</div>';
        } else if (isDate) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Newest first' : '↓ Сначала новые') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Oldest first' : '↑ Сначала старые') + '</div>';
        } else {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ A → Z' : '↑ А → Я') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Z → A' : '↓ Я → А') + '</div>';
        }

        dd.innerHTML = html;
        dd.style.display = 'block';

        dd.querySelectorAll('.ad-col-dd-sort').forEach(function(el) {
            el.addEventListener('click', function(ev) {
                ev.stopPropagation();
                trnSortCol = col;
                trnSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateTrnColHeaders();
                applyTrnFilters();
            });
        });
    }

    // ---- Tournament Update Column Headers ----
    function updateTrnColHeaders() {
        var table = document.getElementById('adTrnTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = trnSortCol === c;
            hdr.classList.toggle('ad-col-active', isActive);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = trnSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
        });
    }

    async function loadAndEditTournament(id) {
        if (!A.client) return;
        // Ensure categories and levels are loaded (needed for form dropdowns)
        if (A.loadCategories) await A.loadCategories();
        if (A.loadTournamentLevels) await A.loadTournamentLevels();
        if (!A.cachedCategories) A.cachedCategories = [];
        if (!A.cachedLevels) A.cachedLevels = [];
        var result = await A.client.from('tournaments').select('*').eq('id', id).single();
        if (result.data) {
            A.setAdminHash('tournaments', 'edit', id);
            renderTournamentForm(result.data);
        }
    }

    // ---- Tournament Form ----
    function renderTournamentForm(item) {
        var container = document.getElementById('ad-tournaments');
        if (!container) return;
        if (!A.cachedCategories) A.cachedCategories = [];
        if (!A.cachedLevels) A.cachedLevels = [];

        trnEditingId = item ? item.id : null;
        trnEditingPublishedAt = (item && item.published_at) ? item.published_at : null;
        trnEditingStatus = (item && item.status) ? item.status : null;
        trnDraftDirty = false;
        clearTimeout(trnAutosaveTimer);
        trnImageFile = null;
        trnImageUrl = (item && item.image) ? item.image : '';

        var title = item ? L.editTournament : L.addTournament;

        var imagePreviewHtml = trnImageUrl
            ? '<img src="' + A.esc(trnImageUrl) + '" class="ad-image-upload-preview" id="adTrnImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adTrnImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">🖼</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = trnImageUrl ? ' has-image' : '';

        // Category options (from Supabase) — deduplicate Friendly
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        var friendlySeen = false;
        A.cachedCategories.forEach(function(c) {
            var isFriendly = (c.name || '').toLowerCase() === 'friendly' || c.gender === null;
            if (isFriendly) {
                if (friendlySeen) return;
                friendlySeen = true;
            }
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var genderIcon = isFriendly ? '' : (c.gender === 'women' ? '♀ ' : '♂ ');
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + genderIcon + catName + '</option>';
        });

        // Status badge (read-only, auto-computed)
        // Backward compat: old tournaments without published_at but with status set → treat as published
        var trnIsDraft = !trnEditingPublishedAt && (!item || !item.status || item.status === 'upcoming');
        var trnStatusBadgeLabel, trnStatusBadgeClass;
        if (trnIsDraft) {
            trnStatusBadgeLabel = L.trnDraft;
            trnStatusBadgeClass = 'ad-status-draft';
        } else if (item && (item.status === 'cancelled' || item.status === 'registration_closed' || item.status === 'completed')) {
            trnStatusBadgeLabel = A.TOURNAMENT_STATUSES[item.status] || item.status;
            trnStatusBadgeClass = 'ad-status-' + (item.status || '').replace(/_/g, '-');
        } else {
            var autoStatus = A.computeTournamentStatus(
                item ? item.registration_start : null,
                item ? item.registration_end : null,
                item ? item.date_start : null,
                item ? item.date_end : null
            );
            trnStatusBadgeLabel = A.TOURNAMENT_STATUSES[autoStatus] || L.statusUpcoming;
            trnStatusBadgeClass = 'ad-status-' + autoStatus.replace(/_/g, '-');
        }

        // Tournament level options
        var trnLevelOptionsHtml = '<option value="">—</option>';
        A.cachedLevels.forEach(function(lv) {
            var selected = (item && item.level_id === lv.id) ? ' selected' : '';
            var name = isEn ? (lv.name_en || lv.name) : lv.name;
            trnLevelOptionsHtml += '<option value="' + lv.id + '"' + selected + '>' + name + '</option>';
        });

        var isExisting = !!trnEditingId && !trnIsDraft;
        var hasBracket = isExisting && item && item.bracket_type;

        container.innerHTML =
            '<div class="ad-trn-sticky-header">' +
                '<div class="ad-section-header">' +
                    '<h2 class="ad-section-title">' + title + '</h2>' +
                    '<button class="ad-btn ad-btn-secondary" id="adTrnBack">' + L.back + '</button>' +
                '</div>' +
                '<div class="ad-tabs ad-trn-nav-tabs">' +
                    '<button class="ad-tab active" data-trn-nav="edit">' + L.trnTabEdit + '</button>' +
                    '<button class="ad-tab' + (isExisting ? '' : ' disabled') + '"' + (isExisting ? ' data-trn-nav="regs"' : '') + ' ' + (isExisting ? '' : 'disabled') + '>' + L.trnTabRegs + '</button>' +
                    '<button class="ad-tab' + (hasBracket ? '' : ' disabled') + '"' + (hasBracket ? ' data-trn-nav="bracket"' : '') + ' ' + (hasBracket ? '' : 'disabled') + '>' + L.trnTabBracket + '</button>' +
                    '<button class="ad-tab' + (hasBracket ? '' : ' disabled') + '"' + (hasBracket ? ' data-trn-nav="schedule"' : '') + ' ' + (hasBracket ? '' : 'disabled') + '>' + L.trnTabSchedule + '</button>' +
                    '<button class="ad-tab' + (isExisting ? '' : ' disabled') + '"' + (isExisting ? ' data-trn-nav="points"' : '') + ' ' + (isExisting ? '' : 'disabled') + '>' + L.trnTabPoints + '</button>' +
                '</div>' +
            '</div>' +

            // Image
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnImage + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adTrnImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adTrnImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adTrnImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (trnImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adTrnImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Title (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnTitle + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitle" placeholder="' + L.trnTitle + ' (RU)" value="' + A.esc(item ? item.title : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleEn" placeholder="' + L.trnTitle + ' (EN)" value="' + A.esc(item ? item.title_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleKg" placeholder="' + L.trnTitle + ' (KG)" value="' + A.esc(item ? item.title_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adTrnTitle" data-en="adTrnTitleEn" data-kg="adTrnTitleKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Description (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnDescription + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDesc" placeholder="' + L.trnDescription + ' (RU)">' + A.esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDescEn" placeholder="' + L.trnDescription + ' (EN)">' + A.esc(item ? item.description_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDescKg" placeholder="' + L.trnDescription + ' (KG)">' + A.esc(item ? item.description_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adTrnDesc" data-en="adTrnDescEn" data-kg="adTrnDescKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Venue (court autocomplete)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnVenue + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adTrnVenueSearch" placeholder="' + L.trnVenueSearch + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adTrnVenueResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adTrnCourtId" value="' + (item && item.court_id ? item.court_id : '') + '">' +
                '<div id="adTrnVenueInfo" style="display:none;margin-top:10px;"></div>' +
            '</div>' +

            // Meta row 1: Category / Format / Level
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnCategory + '</label>' +
                        '<select class="ad-field-input" id="adTrnCat">' + catOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnFormat + '</label>' +
                        '<select class="ad-field-input" id="adTrnFormat">' +
                            '<option value="">' + L.selectFormat + '</option>' +
                            '<option value="singles"' + A.sel(item, 'format', 'singles') + '>' + L.formatSingles + '</option>' +
                            '<option value="doubles"' + A.sel(item, 'format', 'doubles') + '>' + L.formatDoubles + '</option>' +
                            '<option value="mixed_doubles"' + A.sel(item, 'format', 'mixed_doubles') + '>' + L.formatMixedDoubles + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.ratTournamentLevel + '</label>' +
                        '<select class="ad-field-input" id="adTrnLevel">' + trnLevelOptionsHtml + '</select>' +
                    '</div>' +
                '</div>' +
                // Meta row 1b: Gender / NTRP Min / NTRP Max / Combined NTRP Max
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:12px;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnGender + '</label>' +
                        '<select class="ad-field-input" id="adTrnGender">' +
                            '<option value="">—</option>' +
                            '<option value="men"' + A.sel(item, 'gender', 'men') + '>' + L.genderMen + '</option>' +
                            '<option value="women"' + A.sel(item, 'gender', 'women') + '>' + L.genderWomen + '</option>' +
                            '<option value="mixed"' + A.sel(item, 'gender', 'mixed') + '>' + L.genderMixed + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnNtrpMin + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnNtrpMin" min="1.0" max="7.0" step="0.5" placeholder="1.0" value="' + (item && item.ntrp_min ? item.ntrp_min : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnNtrpMax + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnNtrpMax" min="1.0" max="7.0" step="0.5" placeholder="7.0" value="' + (item && item.ntrp_max ? item.ntrp_max : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" id="adTrnNtrpCombinedWrap">' +
                        '<label class="ad-field-label">' + L.trnNtrpCombinedMax + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnNtrpCombinedMax" min="2.0" max="14.0" step="0.5" placeholder="14.0" value="' + (item && item.ntrp_combined_max ? item.ntrp_combined_max : '') + '">' +
                        '<div class="ad-field-hint">' + L.trnNtrpHint + '</div>' +
                    '</div>' +
                '</div>' +
                // Meta row 2: Max participants / Prize fund / Status badge
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnMaxParticipants + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnMaxPart" placeholder="0" value="' + (item ? (item.max_participants || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnPrizeFund + '</label>' +
                        '<input type="text" class="ad-field-input" id="adTrnPrize" placeholder="100,000 сом" value="' + A.esc(item ? item.prize_fund : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnStatus + '</label>' +
                        '<div class="ad-field-input ad-trn-status-field" id="adTrnStatusBadge" data-status-class="' + trnStatusBadgeClass + '">' + trnStatusBadgeLabel + '</div>' +
                    '</div>' +
                '</div>' +
                // Meta row 3: Reg start / Reg end / Tournament start / Tournament end
                '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:12px;">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnRegStart + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnRegStart" value="' + (item ? (item.registration_start || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnRegEnd + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnRegEnd" value="' + (item ? (item.registration_end || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnDateStart + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnDateStart" value="' + (item ? (item.date_start || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnDateEnd + '</label>' +
                        '<input type="date" class="ad-field-input" id="adTrnDateEnd" value="' + (item ? (item.date_end || '') : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Bracket settings
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnBracketType + '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnBracketType + '</label>' +
                        '<select class="ad-field-input" id="adTrnBracketType">' +
                            '<option value="">' + L.selectBracketType + '</option>' +
                            '<option value="single_elimination"' + A.sel(item, 'bracket_type', 'single_elimination') + '>' + L.bracketSE + '</option>' +
                            '<option value="fic"' + A.sel(item, 'bracket_type', 'fic') + '>' + L.bracketFIC + '</option>' +
                            '<option value="round_robin"' + A.sel(item, 'bracket_type', 'round_robin') + '>' + L.bracketRR + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field" id="adTrnDrawSizeWrap">' +
                        '<label class="ad-field-label">' + L.trnDrawSize + '</label>' +
                        '<select class="ad-field-input" id="adTrnDrawSize">' +
                            '<option value="">' + L.selectDrawSize + '</option>' +
                            '<option value="8"' + (item && +item.draw_size === 8 ? ' selected' : '') + '>8</option>' +
                            '<option value="16"' + (item && +item.draw_size === 16 ? ' selected' : '') + '>16</option>' +
                            '<option value="32"' + (item && +item.draw_size === 32 ? ' selected' : '') + '>32</option>' +
                            '<option value="64"' + (item && +item.draw_size === 64 ? ' selected' : '') + '>64</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field" id="adTrnGroupCountWrap" style="display:none;">' +
                        '<label class="ad-field-label">' + L.trnGroupCount + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnGroupCount" placeholder="2" value="' + (item && item.group_count ? item.group_count : '') + '">' +
                    '</div>' +
                    '<div class="ad-field" id="adTrnQualifiersWrap" style="display:none;">' +
                        '<label class="ad-field-label">' + L.trnQualifiers + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnQualifiers" placeholder="2" value="' + (item && item.qualifiers_per_group ? item.qualifiers_per_group : '2') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnCourtCount + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnCourtCount" min="1" max="10" value="' + (item ? (item.court_count || 2) : 2) + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field-row ad-field-row-3">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnMatchDuration + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adTrnMatchDuration" placeholder="90" value="' + (item ? (item.match_duration || 90) : 90) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnStartTime + '</label>' +
                        '<input type="time" class="ad-field-input" id="adTrnStartTime" value="' + (item && item.start_time ? item.start_time.slice(0, 5) : '09:00') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnBuffer + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adTrnBuffer" placeholder="15" value="' + (item ? (item.buffer_minutes || 15) : 15) + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-primary" id="adTrnSave">' + L.save + '</button>' +
                (!trnIsDraft && trnEditingId && item && item.status !== 'cancelled' ? '<button class="ad-btn ad-btn-warning" id="adTrnCancel">' + L.trnCancelTournament + '</button>' : '') +
                (trnEditingId ? '<button class="ad-btn ad-btn-danger" id="adTrnDelete">' + L.delete + '</button>' : '') +
                (trnEditingId && !trnIsDraft && A.currentRole === 'admin' ? (
                    item && item.notified_at
                        ? '<button class="ad-btn ad-btn-secondary" id="adTrnNotify" disabled title="' + L.trnNotifySent + ' ' + A.esc(item.notified_at.split('T')[0]) + '">📢 ' + L.trnNotifySent + ' ' + item.notified_at.split('T')[0] + '</button>'
                        : '<button class="ad-btn ad-btn-secondary" id="adTrnNotify">📢 ' + L.trnNotify + '</button>'
                ) : '') +
                '<span class="ad-draft-status" id="adTrnDraftStatus" style="margin-left:auto"></span>' +
            '</div>';

        // --- Event Listeners ---

        // Back (with unsaved changes protection)
        document.getElementById('adTrnBack').addEventListener('click', function() {
            if (trnDraftDirty) {
                A.showConfirm(L.unsavedChanges, L.unsavedChangesText, function() {
                    trnDraftDirty = false;
                    A.setAdminHash('tournaments');
                    renderTournamentsList();
                }, L.unsavedLeaveBtn);
            } else {
                A.setAdminHash('tournaments');
                renderTournamentsList();
            }
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

        // Translate ALL — 3-language "translate to empty" buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all');
            if (!btn) return;
            A.translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
        });

        // Venue search (court autocomplete)
        var trnVenueSearchInput = document.getElementById('adTrnVenueSearch');
        var trnVenueResultsDiv = document.getElementById('adTrnVenueResults');
        var trnVenueTimer;

        trnVenueSearchInput.addEventListener('input', function() {
            clearTimeout(trnVenueTimer);
            var q = trnVenueSearchInput.value.trim();
            if (q.length < 2) {
                trnVenueResultsDiv.style.display = 'none';
                return;
            }
            trnVenueTimer = setTimeout(function() {
                searchTrnVenue(q);
            }, 300);
        });

        trnVenueSearchInput.addEventListener('focus', function() {
            if (trnVenueSearchInput.value.trim().length >= 2) {
                searchTrnVenue(trnVenueSearchInput.value.trim());
            }
        });

        document.addEventListener('click', function hideTrnVenue(e) {
            if (!e.target.closest('.ad-pay-entity-wrap')) {
                trnVenueResultsDiv.style.display = 'none';
            }
        });

        // Load venue info if editing and court_id exists
        if (item && item.court_id) {
            loadTrnVenueInfo(item.court_id);
        }

        // Max participants — only digits + auto-sync draw size
        var maxPartInput = document.getElementById('adTrnMaxPart');
        maxPartInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
            var v = parseInt(this.value, 10);
            if ([8, 16, 32, 64].indexOf(v) !== -1) {
                var dsEl = document.getElementById('adTrnDrawSize');
                if (dsEl) dsEl.value = String(v);
            }
        });
        maxPartInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        maxPartInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        });

        // Match duration — only digits
        var matchDurInput = document.getElementById('adTrnMatchDuration');
        matchDurInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        // Buffer — only digits
        var bufferInput = document.getElementById('adTrnBuffer');
        bufferInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        matchDurInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        matchDurInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        });

        // Group count — only digits
        var groupCountInput = document.getElementById('adTrnGroupCount');
        if (groupCountInput) {
            groupCountInput.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
            });
            groupCountInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        }

        // Toggle draw_size / group_count based on bracket_type
        function toggleBracketFields() {
            var bt = document.getElementById('adTrnBracketType').value;
            var dsWrap = document.getElementById('adTrnDrawSizeWrap');
            var gcWrap = document.getElementById('adTrnGroupCountWrap');
            var qWrap = document.getElementById('adTrnQualifiersWrap');
            if (bt === 'round_robin') {
                dsWrap.style.display = 'none';
                gcWrap.style.display = '';
                qWrap.style.display = '';
            } else {
                dsWrap.style.display = '';
                gcWrap.style.display = 'none';
                qWrap.style.display = 'none';
            }
        }
        document.getElementById('adTrnBracketType').addEventListener('change', toggleBracketFields);
        toggleBracketFields();

        // Toggle combined NTRP max based on format (doubles/mixed only)
        function toggleNtrpCombinedField() {
            var fmt = document.getElementById('adTrnFormat').value;
            var wrap = document.getElementById('adTrnNtrpCombinedWrap');
            if (wrap) wrap.style.display = (fmt === 'doubles' || fmt === 'mixed_doubles') ? '' : 'none';
        }
        document.getElementById('adTrnFormat').addEventListener('change', toggleNtrpCombinedField);
        toggleNtrpCombinedField();

        // Image upload zone
        var imgZone = document.getElementById('adTrnImgZone');
        var imgInput = document.getElementById('adTrnImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                trnImageFile = imgInput.files[0];
                previewTrnImage(URL.createObjectURL(trnImageFile));
            }
        });

        // Drag & drop
        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                trnImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewTrnImage(URL.createObjectURL(trnImageFile));
            }
        });

        // Remove image
        setupTrnImgRemove();

        // URL apply
        document.getElementById('adTrnImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adTrnImgUrl').value.trim();
            if (url) {
                trnImageFile = null;
                trnImageUrl = url;
                previewTrnImage(url);
            }
        });

        // Save (with confirm for existing tournaments)
        document.getElementById('adTrnSave').addEventListener('click', function() {
            if (trnEditingId) {
                A.showConfirm(
                    isEn ? 'Save changes?' : 'Сохранить изменения?',
                    isEn ? 'Current changes will be saved.' : 'Текущие изменения будут сохранены.',
                    function() { saveTournamentHandler(); },
                    L.save
                );
            } else {
                saveTournamentHandler();
            }
        });

        // Tournament navigation tabs
        container.querySelectorAll('[data-trn-nav]').forEach(function(tab) {
            tab.addEventListener('click', function() {
                var nav = tab.dataset.trnNav;
                if (nav === 'edit') return; // Already on edit
                if (nav === 'regs') A.renderBracketManagement(trnEditingId, 'registrations');
                else if (nav === 'bracket') A.renderBracketManagement(trnEditingId, 'bracket');
                else if (nav === 'schedule') A.renderBracketManagement(trnEditingId, 'schedule');
                else if (nav === 'points') A.renderBracketManagement(trnEditingId, 'results');
            });
        });

        // Cancel tournament
        var cancelBtn = document.getElementById('adTrnCancel');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', function() {
                A.showConfirm(L.trnCancelConfirm, L.deleteConfirmText, async function() {
                    var res = await A.client.from('tournaments').update({ status: 'cancelled' }).eq('id', trnEditingId);
                    if (res.error) {
                        A.showToast(res.error.message, 'error');
                        return;
                    }
                    A.showToast(L.saved, 'success');
                    // Reload to show updated badge
                    loadAndEditTournament(trnEditingId);
                });
            });
        }

        // Delete
        var delBtn = document.getElementById('adTrnDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                A.showConfirm(L.trnDeleteConfirm, L.deleteConfirmText, function() {
                    deleteTournamentHandler();
                });
            });
        }

        // Telegram notify
        var notifyBtn = document.getElementById('adTrnNotify');
        if (notifyBtn && !notifyBtn.disabled) {
            notifyBtn.addEventListener('click', function() {
                A.showConfirm(L.trnNotifyConfirm, '', function() {
                    notifyBtn.disabled = true;
                    notifyBtn.textContent = '📢 ...';
                    (async function() {
                        try {
                            var session = await A.client.auth.getSession();
                            var token = session.data.session ? session.data.session.access_token : '';
                            var res = await fetch(SUPABASE_URL + '/functions/v1/tournament-notify', {
                                method: 'POST',
                                headers: {
                                    'Authorization': 'Bearer ' + token,
                                    'Content-Type': 'application/json',
                                    'apikey': SUPABASE_ANON_KEY
                                },
                                body: JSON.stringify({ tournament_id: trnEditingId })
                            });
                            var result = await res.json();
                            if (!res.ok) {
                                throw new Error(result.error || 'HTTP ' + res.status);
                            }
                            A.showToast(isEn ? 'Notification sent!' : 'Рассылка отправлена!', 'success');
                            var today = new Date().toISOString().split('T')[0];
                            notifyBtn.textContent = '📢 ' + L.trnNotifySent + ' ' + today;
                        } catch (err) {
                            A.showToast(err.message || 'Error', 'error');
                            notifyBtn.disabled = false;
                            notifyBtn.textContent = '📢 ' + L.trnNotify;
                        }
                    })();
                }, L.trnNotifyBtn);
            });
        }

        // Autosave on input (debounce 3s)
        trnDraftDirty = false;
        container.addEventListener('input', function(e) {
            if (!e.target.closest('.ad-form-card, .ad-field')) return;
            trnDraftDirty = true;
            clearTimeout(trnAutosaveTimer);
            trnAutosaveTimer = setTimeout(autosaveTrnDraft, 3000);
        });
    }

    function previewTrnImage(src) {
        var zone = document.getElementById('adTrnImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adTrnImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adTrnImgRemove">&times;</button>';
        setupTrnImgRemove();
    }

    function setupTrnImgRemove() {
        var rmBtn = document.getElementById('adTrnImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                trnImageFile = null;
                trnImageUrl = '';
                var zone = document.getElementById('adTrnImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">🖼</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adTrnImgUrl').value = '';
                document.getElementById('adTrnImgInput').value = '';
            });
        }
    }

    // ---- Collect Tournament Form Data ----
    function collectTrnFormData() {
        var maxPart = document.getElementById('adTrnMaxPart').value;
        var courtId = document.getElementById('adTrnCourtId').value || null;
        var venueInfo = document.getElementById('adTrnVenueInfo');
        var venueName = venueInfo && venueInfo.dataset.courtName ? venueInfo.dataset.courtName : '';
        var venueNameEn = venueInfo && venueInfo.dataset.courtNameEn ? venueInfo.dataset.courtNameEn : '';

        return {
            title: document.getElementById('adTrnTitle').value.trim(),
            title_en: document.getElementById('adTrnTitleEn').value.trim(),
            title_kg: document.getElementById('adTrnTitleKg').value.trim(),
            description: document.getElementById('adTrnDesc').value.trim(),
            description_en: document.getElementById('adTrnDescEn').value.trim(),
            description_kg: document.getElementById('adTrnDescKg').value.trim(),
            location: venueName || null,
            location_en: venueNameEn || null,
            court_id: courtId,
            category_id: document.getElementById('adTrnCat').value || null,
            date_start: document.getElementById('adTrnDateStart').value || null,
            date_end: document.getElementById('adTrnDateEnd').value || null,
            max_participants: maxPart ? parseInt(maxPart, 10) : null,
            prize_fund: document.getElementById('adTrnPrize').value.trim() || null,
            image: trnImageUrl || null,
            format: document.getElementById('adTrnFormat').value || 'singles',
            level_id: document.getElementById('adTrnLevel').value || null,
            bracket_type: document.getElementById('adTrnBracketType').value || null,
            draw_size: (function() { var v = document.getElementById('adTrnDrawSize').value; return v ? parseInt(v, 10) : null; })(),
            group_count: (function() { var v = document.getElementById('adTrnGroupCount').value; return v ? parseInt(v, 10) : null; })(),
            qualifiers_per_group: (function() { var v = document.getElementById('adTrnQualifiers').value; return v ? parseInt(v, 10) : 2; })(),
            court_count: parseInt(document.getElementById('adTrnCourtCount').value, 10) || 2,
            match_duration: parseInt(document.getElementById('adTrnMatchDuration').value, 10) || 90,
            start_time: document.getElementById('adTrnStartTime').value || null,
            buffer_minutes: parseInt(document.getElementById('adTrnBuffer').value, 10) || 15,
            registration_start: document.getElementById('adTrnRegStart').value || null,
            registration_end: document.getElementById('adTrnRegEnd').value || null,
            gender: document.getElementById('adTrnGender').value || null,
            ntrp_min: (function() { var v = document.getElementById('adTrnNtrpMin').value; return v ? parseFloat(v) : null; })(),
            ntrp_max: (function() { var v = document.getElementById('adTrnNtrpMax').value; return v ? parseFloat(v) : null; })(),
            ntrp_combined_max: (function() { var v = document.getElementById('adTrnNtrpCombinedMax').value; return v ? parseFloat(v) : null; })()
        };
    }

    // ---- Load & Render Registrations Block on Tournament Form ----
    async function loadTrnRegistrations(tournamentId) {
        var block = document.getElementById('adTrnRegBlock');
        if (!block || !tournamentId) return;

        var maxPart = parseInt(document.getElementById('adTrnMaxPart').value, 10) || 16;

        var regRes = await A.client.from('tournament_registrations')
            .select('*, players(id, name, name_en, photo, points, category_id)')
            .eq('tournament_id', tournamentId)
            .order('registered_at', { ascending: true });
        var regs = regRes.data || [];

        var active = regs.filter(function(r) { return r.status === 'approved' || r.status === 'pending'; });
        var mainDraw = active.slice(0, maxPart);
        var waitlist = active.slice(maxPart);

        var thName = isEn ? 'Name' : 'ФИО';
        var thCat = isEn ? 'Category' : 'Категория';
        var thDate = isEn ? 'Date' : 'Дата';
        var thTime = isEn ? 'Time' : 'Время';

        var thReg = isEn ? 'Registered' : 'Регистрация';
        var regTHead = '<th style="width:30px;"><input type="checkbox" class="ad-reg-check-all" data-group="GRP"></th>' +
            '<th style="width:28px;">#</th><th style="width:32px;"></th><th>' + thName + '</th><th>' + thCat + '</th><th>' + thReg + '</th>';

        var html = '<div class="ad-form-card" style="margin-top:20px;">' +
            '<h3 class="ad-form-card-title">' + L.registrationsTab + '</h3>' +
            '<div class="ad-reg-columns">';

        // Left column: Main Draw
        html += '<div>';
        html += '<h4 class="ad-reg-section-title">' + L.regMainDraw + ' <span class="ad-badge">' + mainDraw.length + '/' + maxPart + '</span></h4>';
        if (mainDraw.length > 0) {
            html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                regTHead.replace('GRP', 'main') +
            '</tr></thead><tbody>';
            mainDraw.forEach(function(reg, idx) { html += renderTrnRegRow(reg, idx + 1, 'main'); });
            html += '</tbody></table></div>';
            html += '<div style="margin-top:8px;"><button class="ad-btn ad-btn-sm ad-btn-danger" id="adTrnRegRemoveMain" disabled>' + L.regRemoveSelected + '</button></div>';
        } else {
            html += '<div class="ad-empty-state" style="padding:12px 0;"><p>' + L.noRegistrations + '</p></div>';
        }
        html += '</div>';

        // Right column: Waitlist
        html += '<div>';
        html += '<h4 class="ad-reg-section-title">' + L.regWaitlist + ' <span class="ad-badge">' + waitlist.length + '</span></h4>';
        if (waitlist.length > 0) {
            html += '<div class="ad-table-card"><table class="ad-table"><thead><tr>' +
                regTHead.replace('GRP', 'wait') +
            '</tr></thead><tbody>';
            waitlist.forEach(function(reg, idx) { html += renderTrnRegRow(reg, idx + 1, 'wait'); });
            html += '</tbody></table></div>';
            html += '<div style="margin-top:8px;"><button class="ad-btn ad-btn-sm ad-btn-danger" id="adTrnRegRemoveWait" disabled>' + L.regRemoveSelected + '</button></div>';
        } else {
            html += '<div class="ad-empty-state" style="padding:12px 0;"><p>' + L.regNoWaitlist + '</p></div>';
        }
        html += '</div>';

        html += '</div></div>';
        block.innerHTML = html;

        // Checkbox: select all
        block.querySelectorAll('.ad-reg-check-all').forEach(function(allCb) {
            allCb.addEventListener('change', function() {
                block.querySelectorAll('.ad-reg-check[data-group="' + allCb.dataset.group + '"]').forEach(function(cb) { cb.checked = allCb.checked; });
                updateTrnRegBtn(allCb.dataset.group);
            });
        });

        // Checkbox: individual
        block.querySelectorAll('.ad-reg-check').forEach(function(cb) {
            cb.addEventListener('change', function() { updateTrnRegBtn(cb.dataset.group); });
        });

        function updateTrnRegBtn(group) {
            var btn = document.getElementById(group === 'main' ? 'adTrnRegRemoveMain' : 'adTrnRegRemoveWait');
            if (!btn) return;
            var cnt = block.querySelectorAll('.ad-reg-check[data-group="' + group + '"]:checked').length;
            btn.disabled = cnt === 0;
            btn.textContent = L.regRemoveSelected + (cnt > 0 ? ' (' + cnt + ')' : '');
        }

        // Remove buttons
        ['adTrnRegRemoveMain', 'adTrnRegRemoveWait'].forEach(function(btnId) {
            var btn = document.getElementById(btnId);
            if (btn) {
                btn.addEventListener('click', function() {
                    var group = btnId === 'adTrnRegRemoveMain' ? 'main' : 'wait';
                    var ids = [];
                    block.querySelectorAll('.ad-reg-check[data-group="' + group + '"]:checked').forEach(function(cb) { ids.push(cb.dataset.regId); });
                    if (ids.length === 0) return;
                    A.showConfirm(L.regRemoveConfirm, '', async function() {
                        await removeRegistrations(ids, tournamentId);
                        loadTrnRegistrations(tournamentId);
                    }, L.regRemoveSelected);
                });
            }
        });
    }

    function renderTrnRegRow(reg, num, group) {
        var player = reg.players || {};
        var pName = isEn ? (player.name_en || player.name || '—') : (player.name || '—');
        var photo = player.photo || '';
        var photoHtml = photo
            ? '<img src="' + A.esc(photo) + '" alt="" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">'
            : '<div style="width:28px;height:28px;border-radius:50%;background:var(--bg-elevated);display:flex;align-items:center;justify-content:center;font-size:0.7rem;color:var(--text-dim);">—</div>';
        var catId = player.category_id || '';
        var catParts = catId.split('-');
        var catLabel = catParts.length > 1
            ? catParts.slice(1).map(function(w) { return w.charAt(0).toUpperCase() + w.slice(1); }).join('-')
            : catId || '—';
        var regDT = '';
        if (reg.registered_at) {
            var d = new Date(reg.registered_at);
            regDT = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                ' <span style="color:var(--text-dim);">' +
                d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '</span>';
        }
        return '<tr>' +
            '<td><input type="checkbox" class="ad-reg-check" data-group="' + group + '" data-reg-id="' + reg.id + '" data-player-name="' + A.esc(pName) + '"></td>' +
            '<td>' + num + '</td>' +
            '<td>' + photoHtml + '</td>' +
            '<td>' + A.esc(pName) + '</td>' +
            '<td style="font-size:0.8rem;">' + A.esc(catLabel) + '</td>' +
            '<td style="font-size:0.8rem;color:var(--text-secondary);white-space:nowrap;">' + regDT + '</td>' +
        '</tr>';
    }

    // ---- Update Status Badge ----
    function updateTrnStatusBadge() {
        var badge = document.getElementById('adTrnStatusBadge');
        if (!badge) return;
        var label, cls;
        if (!trnEditingPublishedAt) {
            label = L.trnDraft;
            cls = 'ad-status-draft';
        } else {
            var regStart = document.getElementById('adTrnRegStart').value || null;
            var regEnd = document.getElementById('adTrnRegEnd').value || null;
            var dateStart = document.getElementById('adTrnDateStart').value || null;
            var dateEnd = document.getElementById('adTrnDateEnd').value || null;
            var autoStatus = A.computeTournamentStatus(regStart, regEnd, dateStart, dateEnd);
            label = A.TOURNAMENT_STATUSES[autoStatus] || L.statusUpcoming;
            cls = 'ad-status-' + autoStatus.replace(/_/g, '-');
        }
        badge.className = 'ad-field-input ad-trn-status-field ' + cls;
        badge.setAttribute('data-status-class', cls);
        badge.textContent = label;
    }

    // ---- Save Tournament ----
    async function saveTournamentHandler() {
        var saveBtn = document.getElementById('adTrnSave');
        saveBtn.disabled = true;
        saveBtn.textContent = L.saving;

        try {
            // Upload image if file selected
            if (trnImageFile) {
                var uploaded = await A.uploadImage(trnImageFile, 'trn-');
                if (!uploaded) {
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
                trnImageUrl = uploaded;
            }

            var data = collectTrnFormData();

            // Auto-detect: if already published → keep published; if new/draft → publish now
            data.published_at = trnEditingPublishedAt || new Date().toISOString();

            // Preserve special statuses that shouldn't be overwritten by date-based computation
            var protectedStatuses = ['completed', 'registration_closed', 'cancelled'];
            if (trnEditingId && trnEditingStatus && protectedStatuses.indexOf(trnEditingStatus) !== -1) {
                data.status = trnEditingStatus;
            } else {
                data.status = A.computeTournamentStatus(data.registration_start, data.registration_end, data.date_start, data.date_end);
            }

            if (!data.title) {
                A.showToast(isEn ? 'Title is required' : 'Название обязательно', 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            var result;
            if (trnEditingId) {
                result = await A.client.from('tournaments').update(data).eq('id', trnEditingId);
            } else {
                data.id = crypto.randomUUID();
                result = await A.client.from('tournaments').insert(data);
                if (!result.error) {
                    trnEditingId = data.id;
                }
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Update state
            trnEditingPublishedAt = data.published_at;

            trnDraftDirty = false;
            A.showToast(L.saved, 'success');

            // Re-render form with updated state
            loadAndEditTournament(trnEditingId);

        } catch (e) {
            A.showToast(e.message || 'Error', 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
        }
    }

    // ---- Delete Tournament ----
    async function deleteTournamentHandler() {
        if (!trnEditingId) return;
        var result = await A.client.from('tournaments').delete().eq('id', trnEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderTournamentsList();
    }

    // ---- Autosave Tournament Draft ----
    async function autosaveTrnDraft() {
        var title = (document.getElementById('adTrnTitle') || {}).value || '';
        if (!title.trim()) return;

        if (trnAutosaving) return;
        trnAutosaving = true;

        try {
            var data = collectTrnFormData();

            // Keep published_at as-is (draft stays draft, published stays published)
            data.published_at = trnEditingPublishedAt;

            // Preserve special statuses that shouldn't be overwritten
            var protectedStatuses = ['completed', 'registration_closed', 'cancelled'];
            if (trnEditingStatus && protectedStatuses.indexOf(trnEditingStatus) !== -1) {
                data.status = trnEditingStatus;
            } else if (trnEditingPublishedAt) {
                data.status = A.computeTournamentStatus(data.registration_start, data.registration_end, data.date_start, data.date_end);
            } else {
                data.status = 'upcoming';
            }

            var result;
            if (trnEditingId) {
                result = await A.client.from('tournaments').update(data).eq('id', trnEditingId);
            } else {
                data.id = crypto.randomUUID();
                result = await A.client.from('tournaments').insert(data);
                if (!result.error) {
                    trnEditingId = data.id;
                }
            }

            if (!result.error) {
                trnDraftDirty = false;
                var statusEl = document.getElementById('adTrnDraftStatus');
                if (statusEl) {
                    var now = new Date();
                    var hh = String(now.getHours()).padStart(2, '0');
                    var mm = String(now.getMinutes()).padStart(2, '0');
                    statusEl.textContent = '\u2713 ' + L.draftSaved + ' ' + hh + ':' + mm;
                }
            }
        } catch (e) {
            console.error('Tournament autosave error:', e);
        }
        trnAutosaving = false;
    }

    // ---- Venue Search (court autocomplete) ----
    async function searchTrnVenue(query) {
        if (!A.client) return;
        var resultsDiv = document.getElementById('adTrnVenueResults');
        if (!resultsDiv) return;

        var result = await A.client.from('courts')
            .select('id,name,name_en,street,building,city,phone,google_maps_url,twogis_url')
            .ilike('name', '%' + query + '%')
            .limit(10);

        var items = result.data || [];
        if (items.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        var html = '';
        items.forEach(function(c) {
            var addr = [c.street, c.building, c.city].filter(Boolean).join(', ');
            html += '<div class="ad-pay-entity-item" data-id="' + c.id + '" data-name="' + A.esc(c.name || '') + '" data-name-en="' + A.esc(c.name_en || '') + '">' +
                A.esc(c.name) + (addr ? ' <span style="color:var(--text-dim);font-size:0.8rem;">— ' + A.esc(addr) + '</span>' : '') +
            '</div>';
        });
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('.ad-pay-entity-item').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('adTrnCourtId').value = el.dataset.id;
                document.getElementById('adTrnVenueSearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
                loadTrnVenueInfo(el.dataset.id);
            });
        });
    }

    async function loadTrnVenueInfo(courtId) {
        if (!A.client || !courtId) return;
        var result = await A.client.from('courts')
            .select('id,name,name_en,street,building,city,phone,google_maps_url,twogis_url')
            .eq('id', courtId)
            .single();

        var court = result.data;
        if (!court) return;

        var infoDiv = document.getElementById('adTrnVenueInfo');
        if (!infoDiv) return;

        var searchInput = document.getElementById('adTrnVenueSearch');
        if (searchInput && !searchInput.value) {
            searchInput.value = court.name || '';
        }

        // Store court names for save handler
        infoDiv.dataset.courtName = court.name || '';
        infoDiv.dataset.courtNameEn = court.name_en || '';

        var addr = [court.street, court.building, court.city].filter(Boolean).join(', ');
        var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<strong style="color:var(--text-primary);">' + A.esc(court.name) + '</strong>' +
                '<button type="button" class="ad-btn ad-btn-sm ad-btn-secondary" id="adTrnVenueClear">' + L.trnVenueClear + '</button>' +
            '</div>';
        if (addr) {
            html += '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;">' + L.trnVenueAddress + ': ' + A.esc(addr) + '</div>';
        }
        if (court.phone) {
            html += '<div style="color:var(--text-secondary);font-size:0.85rem;margin-bottom:4px;">' + L.trnVenuePhone + ': ' + A.esc(court.phone) + '</div>';
        }
        var mapLinks = '';
        if (court.google_maps_url) {
            mapLinks += '<a href="' + A.esc(court.google_maps_url) + '" target="_blank" style="color:var(--accent);">Google Maps ↗</a>';
        }
        if (court.twogis_url) {
            if (mapLinks) mapLinks += ' &nbsp;·&nbsp; ';
            mapLinks += '<a href="' + A.esc(court.twogis_url) + '" target="_blank" style="color:var(--accent);">2GIS ↗</a>';
        }
        if (mapLinks) {
            html += '<div style="font-size:0.85rem;">' + mapLinks + '</div>';
        }
        html += '</div>';

        infoDiv.innerHTML = html;
        infoDiv.style.display = 'block';

        // Clear button
        document.getElementById('adTrnVenueClear').addEventListener('click', function() {
            document.getElementById('adTrnCourtId').value = '';
            document.getElementById('adTrnVenueSearch').value = '';
            infoDiv.innerHTML = '';
            infoDiv.style.display = 'none';
            infoDiv.dataset.courtName = '';
            infoDiv.dataset.courtNameEn = '';
        });
    }


    // ---- Export to namespace ----
    A.renderTournamentsSection = renderTournamentsSection;
    A.renderTournamentsList = renderTournamentsList;
    A.loadAndEditTournament = loadAndEditTournament;

})();
