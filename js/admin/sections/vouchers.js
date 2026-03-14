// ============================================
// KSLT Admin — Vouchers (reporting + PDF)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // State
    var vchSearchQuery = '', vchFilterStatus = '', vchFilterType = '';
    var vchPeriodMode = '', vchDateFrom = '', vchDateTo = '';
    var vchSortField = 'created_at', vchSortAsc = false;
    var vchPage = 1, vchAllData = [], vchFilteredData = [];
    var vchCourtsMap = {}, vchCoachesMap = {};
    var VCH_PER_PAGE = 20;

    // ---- Entry point ----
    function renderVouchersSection() {
        if (A.isDeepLinked('vouchers')) return;
        renderVouchersList();
    }

    function renderVouchersList() {
        var container = document.getElementById('ad-vouchers');
        if (!container) return;

        var statusOptions =
            '<option value="">' + L.vchAllStatuses + '</option>' +
            '<option value="active"' + (vchFilterStatus === 'active' ? ' selected' : '') + '>' + L.vchStatusActive + '</option>' +
            '<option value="used"' + (vchFilterStatus === 'used' ? ' selected' : '') + '>' + L.vchStatusUsed + '</option>' +
            '<option value="expired"' + (vchFilterStatus === 'expired' ? ' selected' : '') + '>' + L.vchStatusExpired + '</option>' +
            '<option value="cancelled"' + (vchFilterStatus === 'cancelled' ? ' selected' : '') + '>' + L.vchStatusCancelled + '</option>';

        var typeOptions =
            '<option value="">' + L.vchAllTypes + '</option>' +
            '<option value="court"' + (vchFilterType === 'court' ? ' selected' : '') + '>' + L.vchTypeCourt + '</option>' +
            '<option value="coach"' + (vchFilterType === 'coach' ? ' selected' : '') + '>' + L.vchTypeCoach + '</option>';

        var sortOptions =
            '<option value="created_at"' + (vchSortField === 'created_at' ? ' selected' : '') + '>' + L.vchSortDate + '</option>' +
            '<option value="player_name"' + (vchSortField === 'player_name' ? ' selected' : '') + '>' + L.vchSortName + '</option>' +
            '<option value="status"' + (vchSortField === 'status' ? ' selected' : '') + '>' + L.vchSortStatus + '</option>';

        var periodOptions =
            '<option value=""' + (vchPeriodMode === '' ? ' selected' : '') + '>' + L.vchAllTime + '</option>' +
            '<option value="this_month"' + (vchPeriodMode === 'this_month' ? ' selected' : '') + '>' + L.vchThisMonth + '</option>' +
            '<option value="last_month"' + (vchPeriodMode === 'last_month' ? ' selected' : '') + '>' + L.vchLastMonth + '</option>' +
            '<option value="custom"' + (vchPeriodMode === 'custom' ? ' selected' : '') + '>' + L.vchCustom + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.vouchers + '</h2>' +
            '</div>' +

            // Stats — big cards
            '<div class="ad-vch-stats-big" id="adVchStatsBig">' +
                '<div class="ad-vch-stat-big">' +
                    '<div class="stat-icon">🎫</div>' +
                    '<div class="stat-value" id="adVchStatTotal">...</div>' +
                    '<div class="stat-label">' + L.vchTotal + '</div>' +
                '</div>' +
                '<div class="ad-vch-stat-big">' +
                    '<div class="stat-icon">💰</div>' +
                    '<div class="stat-value" id="adVchStatDiscount">...</div>' +
                    '<div class="stat-label">' + L.vchTotalDiscount + '</div>' +
                '</div>' +
            '</div>' +

            // Stats — small cards
            '<div class="ad-vch-stats-small" id="adVchStatsSmall">' +
                '<div class="ad-vch-stat ad-vch-stat--used">✅ <span id="adVchStatUsed">0</span> ' + L.vchUsed + ' <small id="adVchStatConv"></small></div>' +
                '<div class="ad-vch-stat ad-vch-stat--active">⏰ <span id="adVchStatActive">0</span> ' + L.vchActive + '</div>' +
                '<div class="ad-vch-stat ad-vch-stat--expired">❌ <span id="adVchStatExpired">0</span> ' + L.vchExpired + '</div>' +
            '</div>' +

            // Period row
            '<div class="ad-vch-period-row">' +
                '<select class="ad-field-input" id="adVchPeriod" style="max-width:160px;">' + periodOptions + '</select>' +
                '<input type="date" class="ad-field-input" id="adVchDateFrom" value="' + vchDateFrom + '" style="max-width:150px;display:' + (vchPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<input type="date" class="ad-field-input" id="adVchDateTo" value="' + vchDateTo + '" style="max-width:150px;display:' + (vchPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<button class="ad-btn ad-btn-sm" id="adVchApply" style="display:' + (vchPeriodMode === 'custom' ? 'inline-flex' : 'none') + ';">' + L.vchApply + '</button>' +
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adVchExportPdf" title="' + L.vchExportPdf + '">📄 PDF</button>' +
            '</div>' +

            // Filters
            '<div class="ad-filter-row sticky">' +
                '<input type="text" class="ad-field-input" id="adVchSearch" placeholder="' + L.vchSearch + '" value="' + A.esc(vchSearchQuery) + '" style="max-width:220px;">' +
                '<select class="ad-field-input" id="adVchStatusFilter" style="max-width:160px;">' + statusOptions + '</select>' +
                '<select class="ad-field-input" id="adVchTypeFilter" style="max-width:140px;">' + typeOptions + '</select>' +
                '<select class="ad-field-input" id="adVchSort" style="max-width:150px;">' + sortOptions + '</select>' +
            '</div>' +

            // Table
            '<div class="ad-table-wrap">' +
                '<table class="ad-table" id="adVchTable">' +
                    '<thead><tr>' +
                        '<th>№</th>' +
                        '<th>' + L.vchPlayer + '</th>' +
                        '<th>' + L.vchEntity + '</th>' +
                        '<th>' + L.vchServiceType + '</th>' +
                        '<th>' + L.vchDiscount + '</th>' +
                        '<th>' + L.vchDate + '</th>' +
                        '<th>' + L.vchStatus + '</th>' +
                        '<th></th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>';

        // --- Event listeners ---

        // Search
        var searchInput = document.getElementById('adVchSearch');
        var debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                vchSearchQuery = searchInput.value.trim().toLowerCase();
                vchPage = 1;
                applyVchFilters();
            }, 300);
        });

        // Status filter
        document.getElementById('adVchStatusFilter').addEventListener('change', function() {
            vchFilterStatus = this.value;
            vchPage = 1;
            applyVchFilters();
        });

        // Type filter
        document.getElementById('adVchTypeFilter').addEventListener('change', function() {
            vchFilterType = this.value;
            vchPage = 1;
            applyVchFilters();
        });

        // Sort
        document.getElementById('adVchSort').addEventListener('change', function() {
            vchSortField = this.value;
            vchPage = 1;
            applyVchFilters();
        });

        // Period
        document.getElementById('adVchPeriod').addEventListener('change', function() {
            vchPeriodMode = this.value;
            var fromEl = document.getElementById('adVchDateFrom');
            var toEl = document.getElementById('adVchDateTo');
            var applyBtn = document.getElementById('adVchApply');
            var isCustom = vchPeriodMode === 'custom';
            fromEl.style.display = isCustom ? 'block' : 'none';
            toEl.style.display = isCustom ? 'block' : 'none';
            applyBtn.style.display = isCustom ? 'inline-flex' : 'none';

            if (!isCustom) {
                computePeriodDates();
                vchPage = 1;
                applyVchFilters();
                renderVchStats(vchFilteredData);
            }
        });

        // Apply custom period
        document.getElementById('adVchApply').addEventListener('click', function() {
            vchDateFrom = document.getElementById('adVchDateFrom').value;
            vchDateTo = document.getElementById('adVchDateTo').value;
            vchPage = 1;
            applyVchFilters();
            renderVchStats(vchFilteredData);
        });

        // Export PDF
        document.getElementById('adVchExportPdf').addEventListener('click', function() {
            openPdfReport();
        });

        // Load data
        loadVouchersData();
    }

    // ---- Period computation ----
    function computePeriodDates() {
        var now = new Date();
        if (vchPeriodMode === 'this_month') {
            vchDateFrom = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
            vchDateTo = '';
        } else if (vchPeriodMode === 'last_month') {
            var lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            var lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            vchDateFrom = lm.getFullYear() + '-' + String(lm.getMonth() + 1).padStart(2, '0') + '-01';
            vchDateTo = lmEnd.getFullYear() + '-' + String(lmEnd.getMonth() + 1).padStart(2, '0') + '-' + String(lmEnd.getDate()).padStart(2, '0');
        } else {
            vchDateFrom = '';
            vchDateTo = '';
        }
    }

    // ---- Data loading ----
    async function loadVouchersData() {
        if (!A.client) return;

        var results = await Promise.all([
            A.client.from('discount_vouchers').select('*').order('created_at', { ascending: false }),
            A.client.from('courts').select('id, name, price'),
            A.client.from('coaches').select('id, name, price')
        ]);

        vchAllData = results[0].data || [];
        vchCourtsMap = {};
        vchCoachesMap = {};
        (results[1].data || []).forEach(function(c) { vchCourtsMap[c.id] = c; });
        (results[2].data || []).forEach(function(c) { vchCoachesMap[c.id] = c; });

        computePeriodDates();
        applyVchFilters();
        renderVchStats(vchFilteredData);
    }

    // ---- Filtering + sorting ----
    function applyVchFilters() {
        var filtered = vchAllData.slice();

        // Period filter
        if (vchDateFrom) {
            filtered = filtered.filter(function(v) {
                return v.created_at && v.created_at.slice(0, 10) >= vchDateFrom;
            });
        }
        if (vchDateTo) {
            filtered = filtered.filter(function(v) {
                return v.created_at && v.created_at.slice(0, 10) <= vchDateTo;
            });
        }

        // Status filter
        if (vchFilterStatus) {
            filtered = filtered.filter(function(v) { return v.status === vchFilterStatus; });
        }

        // Type filter
        if (vchFilterType) {
            filtered = filtered.filter(function(v) { return v.entity_type === vchFilterType; });
        }

        // Search
        if (vchSearchQuery) {
            filtered = filtered.filter(function(v) {
                return (v.player_name || '').toLowerCase().indexOf(vchSearchQuery) !== -1 ||
                       (v.entity_name || '').toLowerCase().indexOf(vchSearchQuery) !== -1 ||
                       (v.service_name || '').toLowerCase().indexOf(vchSearchQuery) !== -1;
            });
        }

        // Sort
        filtered.sort(function(a, b) {
            var va, vb;
            if (vchSortField === 'player_name') {
                va = (a.player_name || '').toLowerCase();
                vb = (b.player_name || '').toLowerCase();
            } else if (vchSortField === 'status') {
                var order = { active: 0, used: 1, expired: 2, cancelled: 3 };
                va = order[a.status] !== undefined ? order[a.status] : 9;
                vb = order[b.status] !== undefined ? order[b.status] : 9;
            } else {
                va = a.created_at || '';
                vb = b.created_at || '';
            }
            if (va < vb) return vchSortAsc ? -1 : 1;
            if (va > vb) return vchSortAsc ? 1 : -1;
            return 0;
        });

        vchFilteredData = filtered;

        var totalItems = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / VCH_PER_PAGE));
        if (vchPage > totalPages) vchPage = totalPages;
        var start = (vchPage - 1) * VCH_PER_PAGE;
        var pageItems = filtered.slice(start, start + VCH_PER_PAGE);

        renderVchTable(pageItems, start);
        renderVchPagination(totalItems, totalPages);
        renderVchStats(filtered);
    }

    // ---- Stats rendering ----
    function renderVchStats(data) {
        var total = data.length;
        var used = 0, active = 0, expired = 0;
        var totalDiscount = 0;

        data.forEach(function(v) {
            if (v.status === 'used') {
                used++;
                var entity = v.entity_type === 'court' ? vchCourtsMap[v.entity_id] : vchCoachesMap[v.entity_id];
                var basePrice = entity && entity.price ? entity.price : 0;
                totalDiscount += Math.round(basePrice * v.discount_percent / 100);
            } else if (v.status === 'active') {
                active++;
            } else if (v.status === 'expired') {
                expired++;
            }
        });

        var convPct = total > 0 ? Math.round(used / total * 100) : 0;

        var elTotal = document.getElementById('adVchStatTotal');
        var elDiscount = document.getElementById('adVchStatDiscount');
        var elUsed = document.getElementById('adVchStatUsed');
        var elActive = document.getElementById('adVchStatActive');
        var elExpired = document.getElementById('adVchStatExpired');
        var elConv = document.getElementById('adVchStatConv');

        if (elTotal) elTotal.textContent = total;
        if (elDiscount) elDiscount.textContent = totalDiscount.toLocaleString() + ' ' + L.vchCurrency;
        if (elUsed) elUsed.textContent = used;
        if (elActive) elActive.textContent = active;
        if (elExpired) elExpired.textContent = expired;
        if (elConv) elConv.textContent = '(' + convPct + '% ' + L.vchConversion + ')';
    }

    // ---- Table rendering ----
    function renderVchTable(items, startIndex) {
        var table = document.getElementById('adVchTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="8" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">🎫</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.vchNoVouchers + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.vchNoVouchersText + '</div>' +
                '</td></tr>';
            return;
        }

        var isAdmin = A.currentRole === 'admin';
        var html = '';
        items.forEach(function(v, i) {
            var num = startIndex + i + 1;
            var typeIcon = v.entity_type === 'court' ? '🏟️' : '🎓';
            var statusCls = 'ad-vch-badge-' + v.status;
            var statusLabel = L['vchStatus' + v.status.charAt(0).toUpperCase() + v.status.slice(1)] || v.status;
            var dateStr = v.created_at ? formatVchDate(v.created_at) : '—';

            var actionHtml = '<button class="ad-btn-icon" data-vch-view="' + v.id + '" title="' + (isEn ? 'View' : 'Просмотр') + '">👁</button>';
            if (isAdmin && v.status === 'active') {
                actionHtml += ' <button class="ad-btn-icon ad-btn-danger-icon" data-vch-cancel="' + v.id + '" title="' + L.vchCancel + '">✕</button>';
            }

            html +=
                '<tr>' +
                    '<td style="color:var(--text-dim);font-size:0.8rem;">' + num + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(v.player_name || '—') + '</td>' +
                    '<td>' + typeIcon + ' ' + A.esc(v.entity_name || '—') + '</td>' +
                    '<td style="font-size:0.85rem;">' + A.esc(v.service_name || '—') + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + v.discount_percent + '%</td>' +
                    '<td style="font-size:0.8rem;white-space:nowrap;">' + dateStr + '</td>' +
                    '<td><span class="ad-vch-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                    '<td style="white-space:nowrap;">' + actionHtml + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html;

        // Action handlers
        tbody.addEventListener('click', function(e) {
            var viewBtn = e.target.closest('[data-vch-view]');
            if (viewBtn) {
                var vid = viewBtn.dataset.vchView;
                var voucher = vchAllData.find(function(v) { return v.id === vid; });
                if (voucher) viewVoucherDetail(voucher);
                return;
            }

            var cancelBtn = e.target.closest('[data-vch-cancel]');
            if (cancelBtn) {
                cancelVoucher(cancelBtn.dataset.vchCancel);
            }
        });
    }

    // ---- Pagination ----
    function renderVchPagination(totalItems, totalPages) {
        var existing = document.getElementById('adVchPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adVchPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        if (vchPage > 1) {
            html += '<button class="ad-crt-page-btn" data-vch-page="' + (vchPage - 1) + '">&laquo;</button>';
        }
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="ad-crt-page-btn' + (i === vchPage ? ' active' : '') + '" data-vch-page="' + i + '">' + i + '</button>';
        }
        if (vchPage < totalPages) {
            html += '<button class="ad-crt-page-btn" data-vch-page="' + (vchPage + 1) + '">&raquo;</button>';
        }
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;
        var container = document.getElementById('ad-vouchers');
        if (container) container.appendChild(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-vch-page]');
            if (!btn) return;
            vchPage = parseInt(btn.dataset.vchPage);
            applyVchFilters();
        });
    }

    // ---- Actions ----
    async function cancelVoucher(id) {
        if (A.currentRole !== 'admin') return;

        A.showConfirm(L.vchCancelConfirm, async function() {
            var result = await A.client.from('discount_vouchers').update({ status: 'cancelled' }).eq('id', id).eq('status', 'active');
            if (result.error) {
                A.showToast(result.error.message, 'error');
                return;
            }
            A.showToast(L.vchCancelled, 'success');
            loadVouchersData();
        });
    }

    function viewVoucherDetail(voucher) {
        if (typeof voucher === 'string') {
            // Deep-link: load by id
            if (!A.client) return;
            A.client.from('discount_vouchers').select('*').eq('id', voucher).single().then(function(res) {
                if (res.data) viewVoucherDetail(res.data);
            });
            return;
        }

        var v = voucher;
        var typeIcon = v.entity_type === 'court' ? '🏟️' : '🎓';
        var statusLabel = L['vchStatus' + v.status.charAt(0).toUpperCase() + v.status.slice(1)] || v.status;
        var statusCls = 'ad-vch-badge-' + v.status;

        var entity = v.entity_type === 'court' ? vchCourtsMap[v.entity_id] : vchCoachesMap[v.entity_id];
        var basePrice = entity && entity.price ? entity.price : 0;
        var discountAmount = Math.round(basePrice * v.discount_percent / 100);

        var html =
            '<div class="ad-modal-overlay" id="adVchModal">' +
                '<div class="ad-modal" style="max-width:500px;">' +
                    '<div class="ad-modal-header">' +
                        '<h3>🎫 ' + (isEn ? 'Voucher Details' : 'Детали ваучера') + '</h3>' +
                        '<button class="ad-modal-close" id="adVchModalClose">✕</button>' +
                    '</div>' +
                    '<div class="ad-modal-body" style="padding:20px;">' +
                        '<div class="ad-vch-detail-grid">' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchPlayer + '</span><span>' + A.esc(v.player_name || '—') + '</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchEntity + '</span><span>' + typeIcon + ' ' + A.esc(v.entity_name || '—') + '</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchService + '</span><span>' + A.esc(v.service_name || '—') + '</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchDiscount + '</span><span style="font-weight:600;color:var(--accent);">' + v.discount_percent + '% (' + discountAmount + ' ' + L.vchCurrency + ')</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchStatus + '</span><span class="ad-vch-badge ' + statusCls + '">' + statusLabel + '</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchDate + '</span><span>' + formatVchDate(v.created_at) + '</span></div>' +
                            '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + (isEn ? 'Expires' : 'Истекает') + '</span><span>' + formatVchDate(v.expires_at) + '</span></div>' +
                            (v.used_at ? '<div class="ad-vch-detail-row"><span class="ad-vch-detail-label">' + L.vchUsedAt + '</span><span>' + formatVchDate(v.used_at) + '</span></div>' : '') +
                        '</div>' +
                    '</div>' +
                '</div>' +
            '</div>';

        // Remove existing modal
        var existingModal = document.getElementById('adVchModal');
        if (existingModal) existingModal.remove();

        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('adVchModalClose').addEventListener('click', function() {
            document.getElementById('adVchModal').remove();
        });
        document.getElementById('adVchModal').addEventListener('click', function(e) {
            if (e.target === this) this.remove();
        });
    }

    // ---- PDF Report ----
    function openPdfReport() {
        var data = vchFilteredData;
        var stats = computeStats(data);

        // Period label
        var periodLabel = '';
        if (vchPeriodMode === 'this_month') periodLabel = L.vchThisMonth;
        else if (vchPeriodMode === 'last_month') periodLabel = L.vchLastMonth;
        else if (vchPeriodMode === 'custom' && vchDateFrom) periodLabel = formatVchDate(vchDateFrom + 'T00:00:00') + ' – ' + (vchDateTo ? formatVchDate(vchDateTo + 'T00:00:00') : '...');
        else periodLabel = L.vchAllTime;

        var win = window.open('', '_blank');
        if (!win) return;

        var tableRows = '';
        data.forEach(function(v, i) {
            var typeIcon = v.entity_type === 'court' ? '🏟️' : '🎓';
            var statusLabel = L['vchStatus' + v.status.charAt(0).toUpperCase() + v.status.slice(1)] || v.status;
            tableRows +=
                '<tr>' +
                    '<td>' + (i + 1) + '</td>' +
                    '<td>' + escHtml(v.player_name || '—') + '</td>' +
                    '<td>' + typeIcon + ' ' + escHtml(v.entity_name || '—') + '</td>' +
                    '<td>' + escHtml(v.service_name || '—') + '</td>' +
                    '<td>' + v.discount_percent + '%</td>' +
                    '<td>' + formatVchDate(v.created_at) + '</td>' +
                    '<td>' + statusLabel + '</td>' +
                '</tr>';
        });

        var now = new Date();
        var reportDate = formatVchDate(now.toISOString());

        var htmlContent =
            '<!DOCTYPE html><html><head>' +
            '<meta charset="UTF-8">' +
            '<title>' + L.vchReportTitle + '</title>' +
            '<style>' +
                '* { margin: 0; padding: 0; box-sizing: border-box; }' +
                'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #1a1a1a; font-size: 12px; }' +
                '.report-header { text-align: center; margin-bottom: 24px; padding-bottom: 16px; border-bottom: 2px solid #333; }' +
                '.report-header h1 { font-size: 20px; margin-bottom: 4px; }' +
                '.report-header .period { font-size: 13px; color: #666; }' +
                '.stats-grid { display: flex; gap: 16px; margin-bottom: 24px; flex-wrap: wrap; }' +
                '.stat-box { flex: 1; min-width: 120px; padding: 12px; border: 1px solid #ddd; border-radius: 6px; text-align: center; }' +
                '.stat-box .val { font-size: 20px; font-weight: 700; }' +
                '.stat-box .lbl { font-size: 11px; color: #666; margin-top: 2px; }' +
                'table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }' +
                'th { background: #f5f5f5; padding: 8px 6px; text-align: left; font-weight: 600; border-bottom: 2px solid #ddd; font-size: 11px; }' +
                'td { padding: 6px; border-bottom: 1px solid #eee; font-size: 11px; }' +
                'tr:nth-child(even) { background: #fafafa; }' +
                '.report-footer { margin-top: 20px; padding-top: 12px; border-top: 1px solid #ddd; display: flex; justify-content: space-between; font-size: 11px; color: #888; }' +
                '@media print { body { padding: 15px; } .no-print { display: none; } }' +
            '</style>' +
            '</head><body>' +

            '<div class="report-header">' +
                '<h1>' + escHtml(L.vchReportTitle) + '</h1>' +
                '<div class="period">' + L.vchPeriod + ': ' + escHtml(periodLabel) + '</div>' +
            '</div>' +

            '<div class="stats-grid">' +
                '<div class="stat-box"><div class="val">' + stats.total + '</div><div class="lbl">' + L.vchTotal + '</div></div>' +
                '<div class="stat-box"><div class="val">' + stats.totalDiscount.toLocaleString() + ' ' + L.vchCurrency + '</div><div class="lbl">' + L.vchTotalDiscount + '</div></div>' +
                '<div class="stat-box"><div class="val">' + stats.used + ' (' + stats.convPct + '%)</div><div class="lbl">' + L.vchUsed + '</div></div>' +
                '<div class="stat-box"><div class="val">' + stats.active + '</div><div class="lbl">' + L.vchActive + '</div></div>' +
                '<div class="stat-box"><div class="val">' + stats.expired + '</div><div class="lbl">' + L.vchExpired + '</div></div>' +
            '</div>' +

            '<table>' +
                '<thead><tr>' +
                    '<th>№</th>' +
                    '<th>' + L.vchPlayer + '</th>' +
                    '<th>' + L.vchEntity + '</th>' +
                    '<th>' + L.vchService + '</th>' +
                    '<th>' + L.vchDiscount + '</th>' +
                    '<th>' + L.vchDate + '</th>' +
                    '<th>' + L.vchStatus + '</th>' +
                '</tr></thead>' +
                '<tbody>' + tableRows + '</tbody>' +
            '</table>' +

            '<div class="report-footer">' +
                '<span>' + L.vchTotal2 + ': ' + stats.total + ' ' + L.vchVouchers + '</span>' +
                '<span>' + L.vchReportDate + ': ' + reportDate + '</span>' +
            '</div>' +

            '<script>window.onload=function(){window.print();}<\/script>' +
            '</body></html>';

        win.document.write(htmlContent);
        win.document.close();
    }

    function computeStats(data) {
        var total = data.length;
        var used = 0, active = 0, expired = 0;
        var totalDiscount = 0;

        data.forEach(function(v) {
            if (v.status === 'used') {
                used++;
                var entity = v.entity_type === 'court' ? vchCourtsMap[v.entity_id] : vchCoachesMap[v.entity_id];
                var basePrice = entity && entity.price ? entity.price : 0;
                totalDiscount += Math.round(basePrice * v.discount_percent / 100);
            } else if (v.status === 'active') {
                active++;
            } else if (v.status === 'expired') {
                expired++;
            }
        });

        return {
            total: total,
            used: used,
            active: active,
            expired: expired,
            totalDiscount: totalDiscount,
            convPct: total > 0 ? Math.round(used / total * 100) : 0
        };
    }

    // ---- Helpers ----
    function formatVchDate(dateStr) {
        if (!dateStr) return '—';
        var d = new Date(dateStr);
        var dd = String(d.getDate()).padStart(2, '0');
        var mm = String(d.getMonth() + 1).padStart(2, '0');
        var yy = String(d.getFullYear()).slice(-2);
        return dd + '.' + mm + '.' + yy;
    }

    function escHtml(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Export ----
    A.renderVouchersSection = renderVouchersSection;
    A.renderVouchersList = renderVouchersList;
    A.loadAndViewVoucher = viewVoucherDetail;

})();
