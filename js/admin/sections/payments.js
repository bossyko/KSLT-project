// ============================================
// KSLT Admin — Payments CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    var paySearchQuery = '', payFilterType = '', payFilterPurpose = '', payFilterStatus = '';
    var payPage = 1, payAllData = [], payEditingId = null;
    var PAY_PER_PAGE = 15;

    function renderPaymentsSection() {
        if (A.isDeepLinked('payments')) return;
        renderPaymentsList();
    }

    function renderPaymentsList() {
        var container = document.getElementById('ad-payments');
        if (!container) return;

        var typeOptions = '<option value="">' + L.payAllTypes + '</option>';
        Object.keys(A.PAYMENT_ENTITY_TYPES).forEach(function(k) {
            typeOptions += '<option value="' + k + '"' + (payFilterType === k ? ' selected' : '') + '>' + A.PAYMENT_ENTITY_TYPES[k] + '</option>';
        });

        var purposeOptions = '<option value="">' + L.payAllPurposes + '</option>';
        Object.keys(A.PAYMENT_PURPOSES).forEach(function(k) {
            purposeOptions += '<option value="' + k + '"' + (payFilterPurpose === k ? ' selected' : '') + '>' + A.PAYMENT_PURPOSES[k] + '</option>';
        });

        var statusOptions = '<option value="">' + L.payAllStatuses + '</option>' +
            '<option value="active"' + (payFilterStatus === 'active' ? ' selected' : '') + '>' + L.payActive + '</option>' +
            '<option value="expired"' + (payFilterStatus === 'expired' ? ' selected' : '') + '>' + L.payExpired + '</option>';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2>' + L.payments + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adPayAddBtn">+ ' + L.addPayment + '</button>' +
            '</div>' +

            '<div class="ad-pay-stats-grid">' +
                '<div class="ad-pay-stat-card" id="adPayStatActive"><div class="stat-value">0</div><div class="stat-label">' + L.payStatActive + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adPayStatExpired"><div class="stat-value">0</div><div class="stat-label">' + L.payStatExpired + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adPayStatMonth"><div class="stat-value">0</div><div class="stat-label">' + L.payStatMonth + '</div></div>' +
            '</div>' +

            '<div class="ad-filter-row sticky">' +
                '<input type="text" class="ad-field-input" id="adPaySearch" placeholder="' + L.paySearch + '" value="' + A.esc(paySearchQuery) + '" style="max-width:220px;">' +
                '<select class="ad-field-input" id="adPayTypeFilter" style="max-width:150px;">' + typeOptions + '</select>' +
                '<select class="ad-field-input" id="adPayPurposeFilter" style="max-width:150px;">' + purposeOptions + '</select>' +
                '<select class="ad-field-input" id="adPayStatusFilter" style="max-width:150px;">' + statusOptions + '</select>' +
            '</div>' +

            '<div class="ad-table-wrap">' +
                '<table class="ad-table ad-table-clickable" id="adPayTable">' +
                    '<thead><tr>' +
                        '<th>' + L.payEntity + '</th>' +
                        '<th>' + L.payEntityType + '</th>' +
                        '<th>' + L.payPurpose + '</th>' +
                        '<th>' + L.payAmount + '</th>' +
                        '<th>' + (isEn ? 'Active Until' : 'Активен до') + '</th>' +
                        '<th>' + L.payMethod + '</th>' +
                        '<th>' + L.payStatus + '</th>' +
                        '<th>' + L.payCreatedAt + '</th>' +
                    '</tr></thead>' +
                    '<tbody></tbody>' +
                '</table>' +
            '</div>';

        document.getElementById('adPayAddBtn').addEventListener('click', function() {
            renderPaymentForm(null);
        });

        var searchInput = document.getElementById('adPaySearch');
        var debounceTimer;
        searchInput.addEventListener('input', function() {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(function() {
                paySearchQuery = searchInput.value.trim().toLowerCase();
                payPage = 1;
                applyPayFilters();
            }, 300);
        });

        document.getElementById('adPayTypeFilter').addEventListener('change', function() {
            payFilterType = this.value;
            payPage = 1;
            loadPaymentsList();
        });

        document.getElementById('adPayPurposeFilter').addEventListener('change', function() {
            payFilterPurpose = this.value;
            payPage = 1;
            loadPaymentsList();
        });

        document.getElementById('adPayStatusFilter').addEventListener('change', function() {
            payFilterStatus = this.value;
            payPage = 1;
            applyPayFilters();
        });

        loadPaymentsList();
    }

    async function loadPaymentsList() {
        if (!A.client) return;

        var query = A.client.from('entity_payments').select('*').order('created_at', { ascending: false });

        if (payFilterType) {
            query = query.eq('entity_type', payFilterType);
        }
        if (payFilterPurpose) {
            query = query.eq('purpose', payFilterPurpose);
        }

        var result = await query;
        payAllData = result.data || [];

        applyPayFilters();
        updatePayStats();
    }

    function applyPayFilters() {
        var today = new Date().toISOString().slice(0, 10);
        var filtered = payAllData.slice();

        if (paySearchQuery) {
            filtered = filtered.filter(function(p) {
                return (p.entity_name || '').toLowerCase().indexOf(paySearchQuery) !== -1;
            });
        }

        if (payFilterStatus === 'active') {
            filtered = filtered.filter(function(p) { return p.period_end >= today; });
        } else if (payFilterStatus === 'expired') {
            filtered = filtered.filter(function(p) { return p.period_end < today; });
        }

        var totalItems = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / PAY_PER_PAGE));
        if (payPage > totalPages) payPage = totalPages;
        var start = (payPage - 1) * PAY_PER_PAGE;
        var pageItems = filtered.slice(start, start + PAY_PER_PAGE);

        renderPayRows(pageItems);
        renderPayPagination(totalItems, totalPages);
    }

    function updatePayStats() {
        var today = new Date().toISOString().slice(0, 10);
        var now = new Date();
        var monthStart = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-01';

        var active = 0, expired = 0, month = 0;
        payAllData.forEach(function(p) {
            if (p.period_end >= today) active++;
            else expired++;
            if (p.created_at >= monthStart) month++;
        });

        var elActive = document.querySelector('#adPayStatActive .stat-value');
        var elExpired = document.querySelector('#adPayStatExpired .stat-value');
        var elMonth = document.querySelector('#adPayStatMonth .stat-value');
        if (elActive) elActive.textContent = active;
        if (elExpired) elExpired.textContent = expired;
        if (elMonth) elMonth.textContent = month;
    }

    function renderPayRows(items) {
        var table = document.getElementById('adPayTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (items.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="9" style="text-align:center;padding:60px 20px;">' +
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
            var typeBadge = '<span class="ad-pay-badge ad-pay-type-' + p.entity_type + '">' + (A.PAYMENT_ENTITY_TYPES[p.entity_type] || p.entity_type) + '</span>';
            var purposeBadge = '<span class="ad-pay-badge ad-pay-purpose-' + p.purpose + '">' + (A.PAYMENT_PURPOSES[p.purpose] || p.purpose) + '</span>';
            var periodEnd = A.formatPayDate(p.period_end);
            var createdDate = p.created_at ? new Date(p.created_at).toLocaleDateString() : '—';

            html +=
                '<tr data-pay-id="' + p.id + '">' +
                    A.bulkCheckboxTd(p.id) +
                    '<td style="font-weight:500;color:var(--text-primary);">' + A.esc(p.entity_name || '—') + '</td>' +
                    '<td>' + typeBadge + '</td>' +
                    '<td>' + purposeBadge + '</td>' +
                    '<td style="font-weight:600;color:var(--accent);">' + p.amount + ' ' + (p.currency || 'KGS') + '</td>' +
                    '<td style="font-size:0.8rem;white-space:nowrap;">' + periodEnd + '</td>' +
                    '<td>' + (A.PAYMENT_METHODS[p.payment_method] || p.payment_method) + '</td>' +
                    '<td>' + statusBadge + '</td>' +
                    '<td style="font-size:0.8rem;color:var(--text-dim);">' + createdDate + '</td>' +
                '</tr>';
        });

        tbody.innerHTML = html;

        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-pay-id]');
            if (!row) return;
            loadAndEditPayment(row.dataset.payId);
        });

        A.setupBulkDelete({ tableId: 'adPayTable', tableName: 'entity_payments', reloadFn: loadPaymentsList });
    }

    function renderPayPagination(totalItems, totalPages) {
        var existing = document.getElementById('adPayPagination');
        if (existing) existing.remove();

        if (totalPages <= 1) return;

        var wrap = document.createElement('div');
        wrap.id = 'adPayPagination';
        wrap.className = 'ad-crt-pagination';

        var html = '';
        if (payPage > 1) {
            html += '<button class="ad-crt-page-btn" data-pay-page="' + (payPage - 1) + '">&laquo;</button>';
        }
        for (var i = 1; i <= totalPages; i++) {
            html += '<button class="ad-crt-page-btn' + (i === payPage ? ' active' : '') + '" data-pay-page="' + i + '">' + i + '</button>';
        }
        if (payPage < totalPages) {
            html += '<button class="ad-crt-page-btn" data-pay-page="' + (payPage + 1) + '">&raquo;</button>';
        }
        html += '<span class="ad-crt-page-info">' + totalItems + ' ' + (isEn ? 'total' : 'всего') + '</span>';

        wrap.innerHTML = html;
        var container = document.getElementById('ad-payments');
        if (container) container.appendChild(wrap);

        wrap.addEventListener('click', function(e) {
            var btn = e.target.closest('[data-pay-page]');
            if (!btn) return;
            payPage = parseInt(btn.dataset.payPage);
            applyPayFilters();
        });
    }

    async function loadAndEditPayment(id) {
        if (!A.client) return;
        var result = await A.client.from('entity_payments').select('*').eq('id', id).single();
        if (result.data) {
            A.setAdminHash('payments', 'edit', id);
            renderPaymentForm(result.data);
        }
    }

    function renderPaymentForm(item) {
        var container = document.getElementById('ad-payments');
        if (!container) return;

        payEditingId = item ? item.id : null;

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
                '<select class="ad-field-input" id="adPayEntityType">' + entityTypeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payEntity + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adPayEntitySearch" placeholder="' + L.paySearchEntity + '" value="' + A.esc(item ? item.entity_name : '') + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adPayEntityResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adPayEntityId" value="' + (item ? item.entity_id : '') + '">' +
                '<input type="hidden" id="adPayEntityName" value="' + A.esc(item ? item.entity_name : '') + '">' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payPurpose + '</div>' +
                '<select class="ad-field-input" id="adPayPurpose">' + purposeOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payAmount + '</div>' +
                '<div style="display:flex;gap:10px;">' +
                    '<input type="text" inputmode="numeric" class="ad-field-input" id="adPayAmount" placeholder="0" value="' + (item ? item.amount : '') + '" style="max-width:180px;">' +
                    '<input type="text" class="ad-field-input" id="adPayCurrency" value="' + (item ? item.currency : 'KGS') + '" style="width:70px;text-align:center;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + (isEn ? 'Period' : 'Период') + '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<input type="date" class="ad-field-input" id="adPayPeriodStart" value="' + (item ? item.period_start : '') + '" style="flex:1;">' +
                    '<span style="color:var(--text-dim);">—</span>' +
                    '<input type="date" class="ad-field-input" id="adPayPeriodEnd" value="' + (item ? item.period_end : '') + '" style="flex:1;">' +
                '</div>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payMethod + '</div>' +
                '<select class="ad-field-input" id="adPayMethod">' + methodOptions + '</select>' +
            '</div>' +

            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.payNote + '</div>' +
                '<textarea class="ad-field-input" id="adPayNote" rows="3">' + A.esc(item ? item.note || '' : '') + '</textarea>' +
            '</div>' +

            '<div class="ad-form-actions">' +
                '<button class="ad-btn ad-btn-primary" id="adPaySaveBtn">' + L.save + '</button>' +
                '<button class="ad-btn ad-btn-secondary" id="adPayBackBtn">' + L.back + '</button>' +
                (item ? '<button class="ad-btn ad-btn-danger" id="adPayDeleteBtn" style="margin-left:auto;">' + L.delete + '</button>' : '') +
            '</div>';

        // Entity search
        var searchInput = document.getElementById('adPayEntitySearch');
        var resultsDiv = document.getElementById('adPayEntityResults');
        var searchTimer;

        searchInput.addEventListener('input', function() {
            clearTimeout(searchTimer);
            var q = searchInput.value.trim();
            if (q.length < 2) {
                resultsDiv.style.display = 'none';
                return;
            }
            searchTimer = setTimeout(function() {
                var type = document.getElementById('adPayEntityType').value;
                searchPayEntity(type, q);
            }, 300);
        });

        searchInput.addEventListener('focus', function() {
            if (searchInput.value.trim().length >= 2) {
                var type = document.getElementById('adPayEntityType').value;
                searchPayEntity(type, searchInput.value.trim());
            }
        });

        document.addEventListener('click', function hideResults(e) {
            if (!e.target.closest('.ad-pay-entity-wrap')) {
                resultsDiv.style.display = 'none';
            }
        });

        document.getElementById('adPayEntityType').addEventListener('change', function() {
            document.getElementById('adPayEntityId').value = '';
            document.getElementById('adPayEntityName').value = '';
            searchInput.value = '';
            resultsDiv.style.display = 'none';
        });

        // Only digits allowed in amount field
        var amountInput = document.getElementById('adPayAmount');
        amountInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '');
        });
        amountInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        amountInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        });

        document.getElementById('adPaySaveBtn').addEventListener('click', savePaymentHandler);
        document.getElementById('adPayBackBtn').addEventListener('click', function() {
            A.setAdminHash('payments');
            renderPaymentsList();
        });

        if (item) {
            document.getElementById('adPayDeleteBtn').addEventListener('click', function() {
                if (confirm(L.payDeleteConfirm)) {
                    deletePayment(item.id);
                }
            });
        }
    }

    async function searchPayEntity(type, query) {
        if (!A.client) return;
        var resultsDiv = document.getElementById('adPayEntityResults');
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
                document.getElementById('adPayEntityId').value = el.dataset.id;
                document.getElementById('adPayEntityName').value = el.dataset.name;
                document.getElementById('adPayEntitySearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
            });
        });
    }

    async function savePaymentHandler() {
        var entityId = document.getElementById('adPayEntityId').value;
        var entityName = document.getElementById('adPayEntityName').value;
        var entityType = document.getElementById('adPayEntityType').value;
        var amount = parseFloat(document.getElementById('adPayAmount').value);
        var periodStart = document.getElementById('adPayPeriodStart').value;
        var periodEnd = document.getElementById('adPayPeriodEnd').value;

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

        var saveBtn = document.getElementById('adPaySaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '...';

        var data = {
            entity_type: entityType,
            entity_id: entityId,
            entity_name: entityName,
            amount: amount,
            currency: document.getElementById('adPayCurrency').value.trim() || 'KGS',
            period_start: periodStart,
            period_end: periodEnd,
            payment_method: document.getElementById('adPayMethod').value,
            purpose: document.getElementById('adPayPurpose').value,
            note: document.getElementById('adPayNote').value.trim() || null
        };

        var result;
        if (payEditingId) {
            result = await A.client.from('entity_payments').update(data).eq('id', payEditingId);
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
        renderPaymentsList();
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

    async function deletePayment(id) {
        if (!A.client) return;

        var item = payAllData.find(function(p) { return p.id === id; });
        var result = await A.client.from('entity_payments').delete().eq('id', id);

        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }

        if (item) {
            await syncPromotedStatus(item.entity_type, item.entity_id);
        }

        A.showToast(L.payDeleted, 'success');
        renderPaymentsList();
    }


    // ---- Export to namespace ----
    A.renderPaymentsSection = renderPaymentsSection;
    A.renderPaymentsList = renderPaymentsList;
    A.loadAndEditPayment = loadAndEditPayment;

})();
