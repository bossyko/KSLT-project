// ============================================
// KSLT Admin — Finances (unified: entity_payments + membership payments)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var finSearchQuery = '', finFilterType = '', finFilterStatus = '';
    var finPeriodMode = '', finDateFrom = '', finDateTo = '';
    var finPage = 1, finAllData = [], finEditingId = null, finEditingSource = null;
    var FIN_PER_PAGE = 15;

    function renderFinancesSection() {
        if (A.isDeepLinked('finances')) return;
        renderFinancesList();
    }

    function renderFinancesList() {
        var container = document.getElementById('ad-finances');
        if (!container) return;

        var typeOptions = '<option value="">' + L.payAllTypes + '</option>' +
            '<option value="membership"' + (finFilterType === 'membership' ? ' selected' : '') + '>' + L.finTypeMembership + '</option>' +
            '<option value="court"' + (finFilterType === 'court' ? ' selected' : '') + '>' + L.payCourt + '</option>' +
            '<option value="coach"' + (finFilterType === 'coach' ? ' selected' : '') + '>' + L.payCoach + '</option>' +
            '<option value="player"' + (finFilterType === 'player' ? ' selected' : '') + '>' + L.payPlayer + '</option>';

        var statusOptions = '<option value="">' + L.payAllStatuses + '</option>' +
            '<option value="active"' + (finFilterStatus === 'active' ? ' selected' : '') + '>' + L.payActive + '</option>' +
            '<option value="expired"' + (finFilterStatus === 'expired' ? ' selected' : '') + '>' + L.payExpired + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.finances + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adFinAddBtn">+ ' + L.addPayment + '</button>' +
            '</div>' +

            '<div class="ad-pay-stats-grid">' +
                '<div class="ad-pay-stat-card" id="adFinStatActive"><div class="stat-value">0</div><div class="stat-label">' + L.payStatActive + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatExpired"><div class="stat-value">0</div><div class="stat-label">' + L.payStatExpired + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatMonth"><div class="stat-value">0</div><div class="stat-label">' + L.payStatMonth + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatTotal"><div class="stat-value">0</div><div class="stat-label">' + L.payTotalAmount + '</div></div>' +
            '</div>' +

            // Period row
            '<div class="ad-vch-period-row">' +
                '<select class="ad-field-input" id="adFinPeriod" style="max-width:160px;">' +
                    '<option value=""' + (finPeriodMode === '' ? ' selected' : '') + '>' + L.payPrdAll + '</option>' +
                    '<option value="this_month"' + (finPeriodMode === 'this_month' ? ' selected' : '') + '>' + L.payPrdThis + '</option>' +
                    '<option value="last_month"' + (finPeriodMode === 'last_month' ? ' selected' : '') + '>' + L.payPrdLast + '</option>' +
                    '<option value="custom"' + (finPeriodMode === 'custom' ? ' selected' : '') + '>' + L.payPrdCustom + '</option>' +
                '</select>' +
                '<input type="date" class="ad-field-input" id="adFinDateFrom" value="' + finDateFrom + '" style="max-width:150px;display:' + (finPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<input type="date" class="ad-field-input" id="adFinDateTo" value="' + finDateTo + '" style="max-width:150px;display:' + (finPeriodMode === 'custom' ? 'block' : 'none') + ';">' +
                '<button class="ad-btn ad-btn-sm" id="adFinPrdApply" style="display:' + (finPeriodMode === 'custom' ? 'inline-flex' : 'none') + ';">' + L.payPrdApply + '</button>' +
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adFinPdfBtn" title="' + L.payPdfExport + '">📄 PDF</button>' +
            '</div>' +

            '<div class="ad-filter-row sticky">' +
                '<input type="text" class="ad-field-input" id="adFinSearch" placeholder="' + L.paySearch + '" value="' + A.esc(finSearchQuery) + '" style="max-width:220px;">' +
                '<select class="ad-field-input" id="adFinTypeFilter" style="max-width:150px;">' + typeOptions + '</select>' +
                '<select class="ad-field-input" id="adFinStatusFilter" style="max-width:150px;">' + statusOptions + '</select>' +
            '</div>' +

            '<div class="ad-table-wrap">' +
                '<table class="ad-table ad-table-clickable" id="adFinTable">' +
                    '<thead><tr>' +
                        '<th>' + L.payEntity + '</th>' +
                        '<th>' + (isEn ? 'Type' : 'Тип') + '</th>' +
                        '<th>' + L.payAmount + '</th>' +
                        '<th>' + (isEn ? 'Active Until' : 'Активен до') + '</th>' +
                        '<th>' + L.payMethod + '</th>' +
                        '<th>' + L.payStatus + '</th>' +
                        '<th>' + L.payCreatedAt + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>';

        document.getElementById('adFinAddBtn').addEventListener('click', function() {
            renderFinanceForm(null, null);
        });

        var debounceTimer;
        document.getElementById('adFinSearch').addEventListener('input', function() {
            var input = this;
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                finSearchQuery = input.value.trim().toLowerCase();
                finPage = 1;
                applyFinFilters();
            }, 300);
        });

        document.getElementById('adFinTypeFilter').addEventListener('change', function() {
            finFilterType = this.value;
            finPage = 1;
            applyFinFilters();
        });

        document.getElementById('adFinStatusFilter').addEventListener('change', function() {
            finFilterStatus = this.value;
            finPage = 1;
            applyFinFilters();
        });

        // Period
        document.getElementById('adFinPeriod').addEventListener('change', function() {
            finPeriodMode = this.value;
            var fromEl = document.getElementById('adFinDateFrom');
            var toEl = document.getElementById('adFinDateTo');
            var applyBtn = document.getElementById('adFinPrdApply');
            var isCustom = finPeriodMode === 'custom';
            fromEl.style.display = isCustom ? 'block' : 'none';
            toEl.style.display = isCustom ? 'block' : 'none';
            applyBtn.style.display = isCustom ? 'inline-flex' : 'none';
            if (!isCustom) {
                computeFinPeriodDates();
                finPage = 1;
                applyFinFilters();
            }
        });

        document.getElementById('adFinPrdApply').addEventListener('click', function() {
            finDateFrom = document.getElementById('adFinDateFrom').value;
            finDateTo = document.getElementById('adFinDateTo').value;
            finPage = 1;
            applyFinFilters();
        });

        // PDF
        document.getElementById('adFinPdfBtn').addEventListener('click', openFinPdfReport);

        loadFinancesList();
    }

    async function loadFinancesList() {
        if (!A.client) return;

        // Load entity_payments
        var epRes = await A.client.from('entity_payments').select('*').order('created_at', { ascending: false });
        var entityPayments = (epRes.data || []).map(function(p) {
            return {
                id: p.id,
                source: 'entity',
                name: p.entity_name || '—',
                type: p.entity_type, // court, coach, player
                amount: p.amount || 0,
                currency: p.currency || 'KGS',
                period_end: p.period_end,
                payment_method: p.payment_method,
                purpose: p.purpose,
                note: p.note,
                created_at: p.created_at,
                _raw: p
            };
        });

        // Load membership payments
        var mpRes = await A.client.from('payments')
            .select('*, profiles!profile_id(full_name, email), memberships!membership_id(expires_at)')
            .order('created_at', { ascending: false });
        var memPayments = (mpRes.data || []).map(function(p) {
            var profileName = p.profiles ? (p.profiles.full_name || p.profiles.email || '—') : '—';
            var expiresAt = p.memberships ? p.memberships.expires_at : null;
            return {
                id: p.id,
                source: 'membership',
                name: profileName,
                type: 'membership',
                amount: p.amount || 0,
                currency: p.currency || 'KGS',
                period_end: expiresAt,
                payment_method: p.payment_method,
                purpose: 'membership',
                note: p.note,
                created_at: p.created_at,
                _raw: p
            };
        });

        // Merge and sort by created_at desc
        finAllData = entityPayments.concat(memPayments);
        finAllData.sort(function(a, b) {
            return (b.created_at || '').localeCompare(a.created_at || '');
        });

        computeFinPeriodDates();
        applyFinFilters();
    }

    function applyFinFilters() {
        var today = new Date().toISOString().slice(0, 10);
        var filtered = finAllData.slice();

        // Type filter
        if (finFilterType) {
            filtered = filtered.filter(function(p) { return p.type === finFilterType; });
        }

        // Period filter
        if (finDateFrom) {
            filtered = filtered.filter(function(p) {
                return p.created_at && p.created_at.slice(0, 10) >= finDateFrom;
            });
        }
        if (finDateTo) {
            filtered = filtered.filter(function(p) {
                return p.created_at && p.created_at.slice(0, 10) <= finDateTo;
            });
        }

        // Update stats
        updateFinStats(filtered);

        // Search filter
        if (finSearchQuery) {
            filtered = filtered.filter(function(p) {
                return (p.name || '').toLowerCase().indexOf(finSearchQuery) !== -1;
            });
        }

        // Status filter
        if (finFilterStatus === 'active') {
            filtered = filtered.filter(function(p) { return p.period_end >= today; });
        } else if (finFilterStatus === 'expired') {
            filtered = filtered.filter(function(p) { return !p.period_end || p.period_end < today; });
        }

        var totalItems = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / FIN_PER_PAGE));
        if (finPage > totalPages) finPage = totalPages;
        var start = (finPage - 1) * FIN_PER_PAGE;
        var pageItems = filtered.slice(start, start + FIN_PER_PAGE);

        renderFinRows(pageItems);
        renderFinPagination(totalItems, totalPages);
    }

    function updateFinStats(data) {
        var today = new Date().toISOString().slice(0, 10);
        var now = new Date();
        var monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';

        var active = 0, expired = 0, month = 0, totalAmount = 0;
        data.forEach(function(p) {
            if (p.period_end >= today) active++;
            else expired++;
            if (p.created_at >= monthStart) month++;
            totalAmount += (p.amount || 0);
        });

        var el = function(id, val) {
            var e = document.querySelector('#' + id + ' .stat-value');
            if (e) e.textContent = val;
        };
        el('adFinStatActive', active);
        el('adFinStatExpired', expired);
        el('adFinStatMonth', month);
        el('adFinStatTotal', totalAmount.toLocaleString() + ' KGS');
    }

    function computeFinPeriodDates() {
        var now = new Date();
        if (finPeriodMode === 'this_month') {
            finDateFrom = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';
            finDateTo = '';
        } else if (finPeriodMode === 'last_month') {
            var lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            var lmEnd = new Date(now.getFullYear(), now.getMonth(), 0);
            finDateFrom = lm.getFullYear() + '-' + String(lm.getMonth() + 1).padStart(2, '0') + '-01';
            finDateTo = lmEnd.getFullYear() + '-' + String(lmEnd.getMonth() + 1).padStart(2, '0') + '-' + String(lmEnd.getDate()).padStart(2, '0');
        } else if (finPeriodMode !== 'custom') {
            finDateFrom = '';
            finDateTo = '';
        }
    }

    function getTypeLabel(type) {
        var map = {
            membership: L.finTypeMembership,
            court: L.payCourt,
            coach: L.payCoach,
            player: L.payPlayer
        };
        return map[type] || type;
    }

    function renderFinRows(items) {
        var table = document.getElementById('adFinTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="7" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">💰</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.payNoPayments + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.payNoPaymentsText + '</div>' +
                '</td></tr>';
            return;
        }

        var today = new Date().toISOString().slice(0, 10);
        var html = '';
        items.forEach(function(p) {
            var isActive = p.period_end >= today;
            var statusBadge = isActive
                ? '<span class="ad-pay-badge ad-pay-active">' + L.payActive + '</span>'
                : '<span class="ad-pay-badge ad-pay-expired">' + L.payExpired + '</span>';
            var typeBadge = '<span class="ad-pay-badge ad-pay-type-' + p.type + '">' + getTypeLabel(p.type) + '</span>';
            var periodEnd = A.formatPayDate(p.period_end);
            var createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';
            var methodLabel = A.PAYMENT_METHODS[p.payment_method] || p.payment_method || '—';

            html +=
                '<tr data-fin-id="' + p.id + '" data-fin-source="' + p.source + '">' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(p.name) + '</td>' +
                    '<td>' + typeBadge + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td style="font-size:0.8rem;white-space:nowrap;">' + periodEnd + '</td>' +
                    '<td>' + methodLabel + '</td>' +
                    '<td>' + statusBadge + '</td>' +
                    '<td style="font-size:0.8rem;color:var(--text-dim);">' + createdDate + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            var row = e.target.closest('tr[data-fin-id]');
            if (!row) return;
            var id = row.dataset.finId;
            var source = row.dataset.finSource;
            if (source === 'entity') {
                loadAndEditFinance(id);
            }
            // membership payments — click opens nothing for now (read-only)
        });
    }

    function renderFinPagination(totalItems, totalPages) {
        var existing = document.getElementById('adFinPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adFinPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        if (finPage > 1) {
            html += '<button class="ad-crt-page-btn" data-fin-page="' + (finPage - 1) + '">&laquo;</button>';
        }
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="ad-crt-page-btn' + (i === finPage ? ' active' : '') + '" data-fin-page="' + i + '">' + i + '</button>';
        }
        if (finPage < totalPages) {
            html += '<button class="ad-crt-page-btn" data-fin-page="' + (finPage + 1) + '">&raquo;</button>';
        }
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;
        var container = document.getElementById('ad-finances');
        if (container) container.appendChild(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-fin-page]');
            if (!btn) return;
            finPage = parseInt(btn.dataset.finPage);
            applyFinFilters();
        });
    }

    // ---- Edit entity payment ----
    async function loadAndEditFinance(id) {
        if (!A.client) return;
        var result = await A.client.from('entity_payments').select('*').eq('id', id).single();
        if (result.data) {
            A.setAdminHash('finances', 'edit', id);
            renderFinanceForm(result.data, 'entity');
        }
    }

    function renderFinanceForm(item, source) {
        var container = document.getElementById('ad-finances');
        if (!container) return;

        finEditingId = item ? item.id : null;
        finEditingSource = source;

        var entityTypeOptions = '';
        Object.keys(A.PAYMENT_ENTITY_TYPES).forEach(function(k) {
            entityTypeOptions += '<option value="' + k + '"' + (item && item.entity_type === k ? ' selected' : '') + '>' + A.PAYMENT_ENTITY_TYPES[k] + '</option>';
        });

        var purposeOptions = '';
        Object.keys(A.PAYMENT_PURPOSES).forEach(function(k) {
            purposeOptions += '<option value="' + k + '"' + (item && item.purpose === k ? ' selected' : '') + '>' + A.PAYMENT_PURPOSES[k] + '</option>';
        });

        var methodOptions = '';
        Object.keys(A.PAYMENT_METHODS).forEach(function(k) {
            methodOptions += '<option value="' + k + '"' + (item && item.payment_method === k ? ' selected' : '') + '>' + A.PAYMENT_METHODS[k] + '</option>';
        });

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + (item ? L.editPayment : L.addPayment) + '</h2>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payEntityType + '</div>' +
                '<select class="ad-field-input" id="adFinEntityType">' + entityTypeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payEntity + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adFinEntitySearch" placeholder="' + L.paySearchEntity + '" value="' + A.esc(item ? item.entity_name : '') + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adFinEntityResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adFinEntityId" value="' + (item ? item.entity_id : '') + '">' +
                '<input type="hidden" id="adFinEntityName" value="' + A.esc(item ? item.entity_name : '') + '">' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payPurpose + '</div>' +
                '<select class="ad-field-input" id="adFinPurpose">' + purposeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payAmount + '</div>' +
                '<div style="display:flex;gap:10px;">' +
                    '<input type="text" inputmode="numeric" class="ad-field-input" id="adFinAmount" placeholder="0" value="' + (item ? item.amount : '') + '" style="max-width:180px;">' +
                    '<input type="text" class="ad-field-input" id="adFinCurrency" value="' + (item ? item.currency : 'KGS') + '" style="width:70px;text-align:center;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Period' : 'Период') + '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<input type="date" class="ad-field-input" id="adFinPeriodStart" value="' + (item ? item.period_start : '') + '" style="flex:1;">' +
                    '<span style="color:var(--text-dim);">—</span>' +
                    '<input type="date" class="ad-field-input" id="adFinPeriodEnd" value="' + (item ? item.period_end : '') + '" style="flex:1;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payMethod + '</div>' +
                '<select class="ad-field-input" id="adFinMethod">' + methodOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payNote + '</div>' +
                '<textarea class="ad-field-input" id="adFinNote" rows="3">' + A.esc(item ? item.note || '' : '') + '</textarea>' +
            '</div>' +

            '<div class="ad-form-actions">' +
                '<button class="ad-btn ad-btn-primary" id="adFinSaveBtn">' + L.save + '</button>' +
                '<button class="ad-btn ad-btn-secondary" id="adFinBackBtn">' + L.back + '</button>' +
                (item ? '<button class="ad-btn ad-btn-danger" id="adFinDeleteBtn" style="margin-left:auto;">' + L.delete + '</button>' : '') +
            '</div>';

        // Entity search
        var searchInput = document.getElementById('adFinEntitySearch');
        var resultsDiv = document.getElementById('adFinEntityResults');
        var searchTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            var q = searchInput.value.trim();
            if (q.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            searchTimer = setTimeout(function() {
                var type = document.getElementById('adFinEntityType').value;
                searchFinEntity(type, q);
            }, 300);
        });

        searchInput.addEventListener('focus', function() {
            if (searchInput.value.trim().length >= 2) {
                var type = document.getElementById('adFinEntityType').value;
                searchFinEntity(type, searchInput.value.trim());
            }
        });

        document.addEventListener('click', function hideResults(e) {
            if (!e.target.closest('.ad-pay-entity-wrap')) {
                resultsDiv.style.display = 'none';
            }
        });

        document.getElementById('adFinEntityType').addEventListener('change', function() {
            document.getElementById('adFinEntityId').value = '';
            document.getElementById('adFinEntityName').value = '';
            searchInput.value = '';
            resultsDiv.style.display = 'none';
        });

        // Only digits allowed in amount field
        var amountInput = document.getElementById('adFinAmount');
        amountInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });

        document.getElementById('adFinSaveBtn').addEventListener('click', saveFinanceHandler);
        document.getElementById('adFinBackBtn').addEventListener('click', function() {
            A.setAdminHash('finances');
            renderFinancesList();
        });

        if (item) {
            document.getElementById('adFinDeleteBtn').addEventListener('click', function() {
                if (confirm(L.payDeleteConfirm)) {
                    deleteFinance(item.id);
                }
            });
        }
    }

    async function searchFinEntity(type, query) {
        if (!A.client) return;
        var resultsDiv = document.getElementById('adFinEntityResults');
        if (!resultsDiv) return;

        var result;
        var items = [];

        if (type === 'court') {
            result = await A.client.from('courts').select('id,name').ilike('name', '%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: r.name }; });
        } else if (type === 'coach') {
            result = await A.client.from('coaches').select('id,last_name,first_name').or('last_name.ilike.%' + query + '%,first_name.ilike.%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: (r.last_name || '') + ' ' + (r.first_name || '') }; });
        } else if (type === 'player') {
            result = await A.client.from('players').select('id,name').ilike('name', '%' + query + '%').limit(10);
            items = (result.data || []).map(function(r) { return { id: String(r.id), name: r.name }; });
        }

        if (items.length === 0) {
            resultsDiv.style.display = 'none';
            return;
        }

        var html = '';
        items.forEach(function(item) {
            html += '<div class="ad-pay-entity-item" data-id="' + item.id + '" data-name="' + A.esc(item.name) + '">' + A.esc(item.name) + '</div>';
        });
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('.ad-pay-entity-item').forEach(function(el) {
            el.addEventListener('click', function() {
                document.getElementById('adFinEntityId').value = el.dataset.id;
                document.getElementById('adFinEntityName').value = el.dataset.name;
                document.getElementById('adFinEntitySearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
            });
        });
    }

    async function saveFinanceHandler() {
        var entityId = document.getElementById('adFinEntityId').value;
        var entityName = document.getElementById('adFinEntityName').value;
        var entityType = document.getElementById('adFinEntityType').value;
        var amount = parseFloat(document.getElementById('adFinAmount').value);
        var periodStart = document.getElementById('adFinPeriodStart').value;
        var periodEnd = document.getElementById('adFinPeriodEnd').value;

        if (!entityId || !entityName) {
            A.showToast(L.payEntityRequired, 'error');
            return;
        }
        if (!amount || amount <= 0) {
            A.showToast(L.payAmountRequired, 'error');
            return;
        }
        if (!periodStart || !periodEnd) {
            A.showToast(L.payPeriodRequired, 'error');
            return;
        }

        var saveBtn = document.getElementById('adFinSaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '...';

        var data = {
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            amount: amount,
            currency: document.getElementById('adFinCurrency').value.trim() || 'KGS',
            period_start: periodStart,
            period_end: periodEnd,
            payment_method: document.getElementById('adFinMethod').value,
            purpose: document.getElementById('adFinPurpose').value,
            note: document.getElementById('adFinNote').value.trim() || null
        };

        var result;
        if (finEditingId) {
            result = await A.client.from('entity_payments').update(data).eq('id', finEditingId);
        } else {
            var session = await A.client.auth.getSession();
            data.created_by = session.data.session ? session.data.session.user.id : null;
            result = await A.client.from('entity_payments').insert(data);
        }

        if (result.error) {
            A.showToast(result.error.message, 'error');
            saveBtn.disabled = false;
            saveBtn.textContent = L.save;
            return;
        }

        await syncPromotedStatus(entityType, entityId);
        A.showToast(L.paySaved, 'success');
        renderFinancesList();
    }

    async function syncPromotedStatus(entityType, entityId) {
        if (entityType !== 'court' && entityType !== 'coach') return;
        var today = new Date().toISOString().slice(0, 10);
        var check = await A.client.from('entity_payments')
            .select('id')
            .eq('entity_type', entityType)
            .eq('entity_id', entityId)
            .eq('purpose', 'promoted')
            .gte('period_end', today)
            .lte('period_start', today)
            .limit(1);
        var hasActive = (check.data && check.data.length > 0);
        var tableName = entityType === 'court' ? 'courts' : 'coaches';
        await A.client.from(tableName).update({ promoted: hasActive }).eq('id', entityId);
    }

    async function deleteFinance(id) {
        if (!A.client) return;
        var item = finAllData.find(function(p) { return p.id === id && p.source === 'entity'; });
        var result = await A.client.from('entity_payments').delete().eq('id', id);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        if (item && item._raw) {
            await syncPromotedStatus(item._raw.entity_type, item._raw.entity_id);
        }
        A.showToast(L.payDeleted, 'success');
        renderFinancesList();
    }

    // ---- PDF ----
    function openFinPdfReport() {
        var today = new Date().toISOString().slice(0, 10);
        var filtered = finAllData.slice();
        if (finDateFrom) {
            filtered = filtered.filter(function(p) { return p.created_at && p.created_at.slice(0, 10) >= finDateFrom; });
        }
        if (finDateTo) {
            filtered = filtered.filter(function(p) { return p.created_at && p.created_at.slice(0, 10) <= finDateTo; });
        }

        var active = 0, expired = 0, totalAmount = 0;
        filtered.forEach(function(p) {
            if (p.period_end >= today) active++;
            else expired++;
            totalAmount += (p.amount || 0);
        });

        var periodLabel = '';
        if (finPeriodMode === 'this_month') periodLabel = L.payPrdThis;
        else if (finPeriodMode === 'last_month') periodLabel = L.payPrdLast;
        else if (finPeriodMode === 'custom' && finDateFrom) periodLabel = A.formatPayDate(finDateFrom) + ' – ' + (finDateTo ? A.formatPayDate(finDateTo) : '...');
        else periodLabel = L.payPrdAll;

        var tableRows = '';
        filtered.forEach(function(p, i) {
            var isAct = p.period_end >= today;
            var statusLabel = isAct ? L.payActive : L.payExpired;
            var createdDate = p.created_at ? A.formatPayDate(p.created_at.slice(0, 10)) : '—';
            tableRows +=
                '<tr>' +
                    '<td>' + (i + 1) + '</td>' +
                    '<td>' + escH(p.name) + '</td>' +
                    '<td>' + escH(getTypeLabel(p.type)) + '</td>' +
                    '<td>' + (p.amount || 0) + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td>' + A.formatPayDate(p.period_end) + '</td>' +
                    '<td>' + statusLabel + '</td>' +
                    '<td>' + createdDate + '</td>' +
                '</tr>';
        });

        var reportDate = A.formatPayDate(new Date().toISOString().slice(0, 10));

        var win = window.open('', '_blank');
        if (!win) return;

        var htmlContent =
            '<!DOCTYPE html><html><head>' +
            '<meta charset="UTF-8">' +
            '<title>' + L.payPdfTitle + '</title>' +
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
                '@media print { body { padding: 15px; } }' +
            '</style>' +
            '</head><body>' +
            '<div class="report-header">' +
                '<h1>' + escH(L.payPdfTitle) + '</h1>' +
                '<div class="period">' + L.payPeriod + ': ' + escH(periodLabel) + '</div>' +
            '</div>' +
            '<div class="stats-grid">' +
                '<div class="stat-box"><div class="val">' + filtered.length + '</div><div class="lbl">' + L.payTotalCount + '</div></div>' +
                '<div class="stat-box"><div class="val">' + totalAmount.toLocaleString() + ' KGS</div><div class="lbl">' + L.payTotalAmount + '</div></div>' +
                '<div class="stat-box"><div class="val">' + active + '</div><div class="lbl">' + L.payStatActive + '</div></div>' +
                '<div class="stat-box"><div class="val">' + expired + '</div><div class="lbl">' + L.payStatExpired + '</div></div>' +
            '</div>' +
            '<table>' +
                '<thead><tr>' +
                    '<th>№</th>' +
                    '<th>' + L.payEntity + '</th>' +
                    '<th>' + (isEn ? 'Type' : 'Тип') + '</th>' +
                    '<th>' + L.payAmount + '</th>' +
                    '<th>' + (isEn ? 'Active Until' : 'Активен до') + '</th>' +
                    '<th>' + L.payStatus + '</th>' +
                    '<th>' + L.payCreatedAt + '</th>' +
                '</tr></thead>' +
                '<tbody>' + tableRows + '</tbody>' +
            '</table>' +
            '<div class="report-footer">' +
                '<span>' + L.payTotalCount + ': ' + filtered.length + ' ' + L.payPdfPayments + '</span>' +
                '<span>' + L.payPdfDate + ': ' + reportDate + '</span>' +
            '</div>' +
            '<script>window.onload=function(){window.print();}<\/script>' +
            '</body></html>';

        win.document.write(htmlContent);
        win.document.close();
    }

    function escH(str) {
        return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    }

    // ---- Export to namespace ----
    A.renderFinancesSection = renderFinancesSection;
    A.renderFinancesList = renderFinancesList;
    A.loadAndEditFinance = loadAndEditFinance;

})();
