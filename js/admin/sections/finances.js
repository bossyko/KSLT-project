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
            '<option value="club"' + (finFilterType === 'club' ? ' selected' : '') + '>' + L.payClub + '</option>';

        var statusOptions = '<option value="">' + L.payAllStatuses + '</option>' +
            '<option value="active"' + (finFilterStatus === 'active' ? ' selected' : '') + '>' + L.payActive + '</option>' +
            '<option value="expired"' + (finFilterStatus === 'expired' ? ' selected' : '') + '>' + L.payExpired + '</option>';

        container.innerHTML =
            // Заголовок был прилипающим с непрозрачным фоном и при прокрутке
            // закрывал карточки статистики — цифры пропадали, оставались подписи
            '<div class="ad-section-header" style="padding:12px 0;">' +
                '<h2>' + L.finances + '</h2>' +
                '<button class="ad-btn ad-btn-primary" id="adFinAddBtn">+ ' + L.addPayment + '</button>' +
            '</div>' +

            '<div class="ad-pay-stats-grid">' +
                '<div class="ad-pay-stat-card" id="adFinStatActive"><div class="stat-value">0</div><div class="stat-label">' + L.payStatActive + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatExpired"><div class="stat-value">0</div><div class="stat-label">' + L.payStatExpired + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatMonth"><div class="stat-value">0</div><div class="stat-label">' + L.payStatMonth + '</div></div>' +
                '<div class="ad-pay-stat-card" id="adFinStatTotal"><div class="stat-value">0</div><div class="stat-label">' + L.payTotalAmount + '</div></div>' +
            '</div>' +

            // Payments chart
            '<div class="ad-dash-chart-card">' +
                '<div class="ad-table-card-header">' +
                    '<div class="ad-table-card-title">' + L.finChartTitle + '</div>' +
                '</div>' +
                '<div style="position:relative;height:260px;padding:12px;">' +
                    '<canvas id="adFinChart"></canvas>' +
                '</div>' +
            '</div>' +

            // Period row
            '<div class="ad-vch-period-row">' +
                '<span style="color:var(--text-secondary);font-size:0.85rem;font-weight:500;">' + (isEn ? 'Date:' : 'Дата:') + '</span>' +
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
                '<button class="ad-btn ad-btn-sm ad-btn-outline" id="adFinExcelBtn" title="' + L.payExcelExport + '">📊 Excel</button>' +
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

        // Excel
        document.getElementById('adFinExcelBtn').addEventListener('click', exportFinExcel);

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
            .select('*, profiles!profile_id(full_name, email), memberships!membership_id(starts_at, expires_at)')
            .order('created_at', { ascending: false });
        var memPayments = (mpRes.data || []).map(function(p) {
            // Имя берём из самой оплаты: оно записано на дату платежа и не
            // поедет вслед за сменой фамилии и не пропадёт с удалением аккаунта.
            // Профиль — запасной вариант для записей старше миграции
            var profileName = p.payer_name || p.payer_email ||
                (p.profiles ? (p.profiles.full_name || p.profiles.email || '—') : '—');
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
        renderFinChart();
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
            player: L.payPlayer,
            club: L.payClub
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
            var createdDate = p.created_at ? A.formatDateTime(p.created_at) : '—';
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

        var initType = item ? item.entity_type : 'court';
        var isMembership = source === 'membership' || initType === 'membership';
        var isClub = initType === 'club';
        var todayStr = new Date().toISOString().slice(0, 10);

        var entityTypeOptions = '';
        Object.keys(A.PAYMENT_ENTITY_TYPES).forEach(function(k) {
            entityTypeOptions += '<option value="' + k + '"' + (initType === k ? ' selected' : '') + '>' + A.PAYMENT_ENTITY_TYPES[k] + '</option>';
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

            // Entity search (court/coach)
            '<div class="ad-form-card" id="adFinEntityBlock"' + (isClub || isMembership ? ' style="display:none;"' : '') + '>' +
                '<div class="ad-form-card-title">' + L.payEntity + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adFinEntitySearch" placeholder="' + L.paySearchEntity + '" value="' + A.esc(item && !isClub ? item.entity_name : '') + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adFinEntityResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adFinEntityId" value="' + (item ? item.entity_id : '') + '">' +
                '<input type="hidden" id="adFinEntityName" value="' + A.esc(item ? item.entity_name : '') + '">' +
            '</div>' +

            // From (club only)
            '<div class="ad-form-card" id="adFinClubFromBlock"' + (isClub ? '' : ' style="display:none;"') + '>' +
                '<div class="ad-form-card-title">' + L.payFrom + '</div>' +
                '<input type="text" class="ad-field-input" id="adFinClubFrom" placeholder="' + (isEn ? 'Sponsor / Organization name' : 'Спонсор / Название организации') + '" value="' + A.esc(item && isClub ? item.entity_name : '') + '">' +
            '</div>' +

            // Profile search (membership only)
            '<div class="ad-form-card" id="adFinProfileBlock"' + (isMembership ? '' : ' style="display:none;"') + '>' +
                '<div class="ad-form-card-title">' + (isEn ? 'User' : 'Пользователь') + '</div>' +
                '<div class="ad-pay-entity-wrap">' +
                    '<input type="text" class="ad-field-input" id="adFinProfileSearch" placeholder="' + L.paySearchProfile + '" value="' + A.esc(isMembership && item ? item.entity_name || '' : '') + '" autocomplete="off">' +
                    '<div class="ad-pay-entity-results" id="adFinProfileResults" style="display:none;"></div>' +
                '</div>' +
                '<input type="hidden" id="adFinProfileId" value="' + (isMembership && item ? item._raw.profile_id || '' : '') + '">' +
                '<input type="hidden" id="adFinProfileName" value="' + A.esc(isMembership && item ? item.entity_name || '' : '') + '">' +
            '</div>' +

            '<div class="ad-form-card" id="adFinPurposeBlock"' + (isMembership ? ' style="display:none;"' : '') + '>' +
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

            // Period (court/coach)
            '<div class="ad-form-card" id="adFinPeriodBlock"' + (isClub || isMembership ? ' style="display:none;"' : '') + '>' +
                '<div class="ad-form-card-title">' + (isEn ? 'Period' : 'Период') + '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<input type="date" class="ad-field-input" id="adFinPeriodStart" value="' + (item && !isMembership ? item.period_start : '') + '" style="flex:1;">' +
                    '<span style="color:var(--text-dim);">—</span>' +
                    '<input type="date" class="ad-field-input" id="adFinPeriodEnd" value="' + (item && !isMembership ? item.period_end : '') + '" style="flex:1;">' +
                '</div>' +
            '</div>' +

            // Membership period
            '<div class="ad-form-card" id="adFinMemberPeriodBlock"' + (isMembership ? '' : ' style="display:none;"') + '>' +
                '<div class="ad-form-card-title">' + L.payMemberPeriod + '</div>' +
                '<div style="display:flex;gap:8px;margin-bottom:10px;flex-wrap:wrap;">' +
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-outline ad-mem-preset" data-months="1">1 ' + (isEn ? 'mo' : 'мес') + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-outline ad-mem-preset" data-months="3">3 ' + (isEn ? 'mo' : 'мес') + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-outline ad-mem-preset" data-months="6">6 ' + (isEn ? 'mo' : 'мес') + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-outline ad-mem-preset" data-months="12">1 ' + (isEn ? 'yr' : 'год') + '</button>' +
                '</div>' +
                '<div style="display:flex;gap:10px;align-items:center;">' +
                    '<input type="date" class="ad-field-input" id="adFinMemberStart" value="' + (isMembership && item && item._raw ? (item._raw.memberships ? item._raw.memberships.starts_at || '' : '').slice(0, 10) : todayStr) + '" style="flex:1;">' +
                    '<span style="color:var(--text-dim);">—</span>' +
                    '<input type="date" class="ad-field-input" id="adFinMemberEnd" value="' + (isMembership && item && item._raw && item._raw.memberships ? (item._raw.memberships.expires_at || '').slice(0, 10) : '') + '" style="flex:1;">' +
                '</div>' +
            '</div>' +

            // Transaction date (club only)
            '<div class="ad-form-card" id="adFinOpDateBlock"' + (isClub ? '' : ' style="display:none;"') + '>' +
                '<div class="ad-form-card-title">' + L.payOpDate + '</div>' +
                '<input type="date" class="ad-field-input" id="adFinOpDate" value="' + (item && isClub ? (item.period_start || todayStr) : todayStr) + '" style="max-width:200px;">' +
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

        // Toggle form fields based on type
        function toggleFormMode(typeVal) {
            var isC = typeVal === 'club';
            var isM = typeVal === 'membership';
            var isEntity = !isC && !isM;
            document.getElementById('adFinEntityBlock').style.display = isEntity ? '' : 'none';
            document.getElementById('adFinClubFromBlock').style.display = isC ? '' : 'none';
            document.getElementById('adFinProfileBlock').style.display = isM ? '' : 'none';
            document.getElementById('adFinPeriodBlock').style.display = isEntity ? '' : 'none';
            document.getElementById('adFinMemberPeriodBlock').style.display = isM ? '' : 'none';
            document.getElementById('adFinOpDateBlock').style.display = isC ? '' : 'none';
            document.getElementById('adFinPurposeBlock').style.display = isM ? 'none' : '';
        }

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
                var profileResults = document.getElementById('adFinProfileResults');
                if (profileResults) profileResults.style.display = 'none';
            }
        });

        // Profile search (membership)
        var profileInput = document.getElementById('adFinProfileSearch');
        var profileResults = document.getElementById('adFinProfileResults');
        var profileTimer;

        profileInput.addEventListener('input', function() {
            clearTimeout(profileTimer);
            var q = profileInput.value.trim();
            if (q.length < 1) {
                profileResults.style.display = 'none';
                return;
            }
            profileTimer = setTimeout(function() {
                searchProfiles(q);
            }, 300);
        });

        profileInput.addEventListener('focus', function() {
            if (profileInput.value.trim().length >= 1) {
                searchProfiles(profileInput.value.trim());
            }
        });

        document.getElementById('adFinEntityType').addEventListener('change', function() {
            var val = this.value;
            toggleFormMode(val);
            document.getElementById('adFinEntityId').value = '';
            document.getElementById('adFinEntityName').value = '';
            searchInput.value = '';
            document.getElementById('adFinClubFrom').value = '';
            document.getElementById('adFinProfileId').value = '';
            document.getElementById('adFinProfileName').value = '';
            profileInput.value = '';
            resultsDiv.style.display = 'none';
            profileResults.style.display = 'none';
        });

        // Membership period presets
        document.querySelectorAll('.ad-mem-preset').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var months = parseInt(btn.dataset.months);
                var startEl = document.getElementById('adFinMemberStart');
                var start = startEl.value ? new Date(startEl.value) : new Date();
                var end = new Date(start);
                end.setMonth(end.getMonth() + months);
                var endStr = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');
                document.getElementById('adFinMemberEnd').value = endStr;
                // highlight active preset
                document.querySelectorAll('.ad-mem-preset').forEach(function(b) { b.style.borderColor = ''; b.style.color = ''; });
                btn.style.borderColor = 'var(--accent)';
                btn.style.color = 'var(--accent)';
            });
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

    async function searchProfiles(query) {
        if (!A.client) return;
        var resultsDiv = document.getElementById('adFinProfileResults');
        if (!resultsDiv) return;

        // 1. Search profiles by full_name / email
        var profResult = await A.client.from('profiles')
            .select('id, full_name, email, player_id')
            .or('full_name.ilike.%' + query + '%,email.ilike.%' + query + '%')
            .limit(10);

        var seen = {};
        var items = [];
        (profResult.data || []).forEach(function(r) {
            if (seen[r.id]) return;
            seen[r.id] = true;
            items.push({ id: r.id, name: r.full_name || r.email || '—' });
        });

        // 2. Search players by name → find linked profiles
        var plResult = await A.client.from('players')
            .select('id, name')
            .ilike('name', '%' + query + '%')
            .limit(10);

        if (plResult.data && plResult.data.length > 0) {
            var playerIds = plResult.data.map(function(p) { return p.id; });
            var playerNames = {};
            plResult.data.forEach(function(p) { playerNames[p.id] = p.name; });

            var linkedResult = await A.client.from('profiles')
                .select('id, full_name, email, player_id')
                .in('player_id', playerIds)
                .limit(10);

            (linkedResult.data || []).forEach(function(r) {
                if (seen[r.id]) return;
                seen[r.id] = true;
                var pName = playerNames[r.player_id] || '';
                items.push({ id: r.id, name: pName || r.full_name || '—' });
            });
        }

        if (items.length === 0) {
            resultsDiv.innerHTML = '<div style="padding:10px;color:var(--text-dim);font-size:0.85rem;">' + (isEn ? 'Not found' : 'Не найдено') + '</div>';
            resultsDiv.style.display = 'block';
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
                document.getElementById('adFinProfileId').value = el.dataset.id;
                document.getElementById('adFinProfileName').value = el.dataset.name;
                document.getElementById('adFinProfileSearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
            });
        });
    }

    async function saveFinanceHandler() {
        var entityType = document.getElementById('adFinEntityType').value;
        var isClub = entityType === 'club';
        var isMembership = entityType === 'membership';
        var amount = parseFloat(document.getElementById('adFinAmount').value) || 0;
        var note = document.getElementById('adFinNote').value.trim() || null;
        var method = document.getElementById('adFinMethod').value;
        var currency = document.getElementById('adFinCurrency').value.trim() || 'KGS';

        // --- Membership save ---
        if (isMembership) {
            var profileId = document.getElementById('adFinProfileId').value;
            var profileName = document.getElementById('adFinProfileName').value;
            var memberStart = document.getElementById('adFinMemberStart').value;
            var memberEnd = document.getElementById('adFinMemberEnd').value;

            if (!profileId) {
                A.showToast(L.payProfileRequired, 'error');
                return;
            }
            if (!memberStart || !memberEnd) {
                A.showToast(L.payPeriodRequired, 'error');
                return;
            }
            if (amount === 0 && !note) {
                A.showToast(L.payNoteRequiredZero, 'error');
                return;
            }

            var saveBtn = document.getElementById('adFinSaveBtn');
            saveBtn.disabled = true;
            saveBtn.textContent = '...';

            var session = await A.client.auth.getSession();
            var createdBy = session.data.session ? session.data.session.user.id : null;

            // 1. Create membership
            var memResult = await A.client.from('memberships').insert({
                profile_id: profileId,
                status: 'active',
                starts_at: memberStart + 'T00:00:00.000Z',
                expires_at: memberEnd + 'T23:59:59.000Z',
                note: note || (isEn ? 'Admin: via finances' : 'Админ: через финансы')
            }).select('id').single();

            if (memResult.error) {
                A.showToast(memResult.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // 2. Create payment record
            var payResult = await A.client.from('payments').insert({
                profile_id: profileId,
                membership_id: memResult.data.id,
                amount: amount,
                currency: currency,
                payment_method: method,
                status: 'completed',
                note: note,
                created_by: createdBy
            });

            if (payResult.error) {
                A.showToast(payResult.error.message, 'error');
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Loyalty: earn points for membership payment
            if (amount > 0 && A.earnLoyaltyPoints) {
                A.earnLoyaltyPoints(profileId, 'membership', memResult.data.id, null);

                // First membership welcome bonus (one-time only)
                var existingBonus = await A.client.from('loyalty_transactions')
                    .select('id')
                    .eq('profile_id', profileId)
                    .eq('action', 'first_membership')
                    .limit(1);
                if (!existingBonus.data || existingBonus.data.length === 0) {
                    A.earnLoyaltyPoints(profileId, 'first_membership', memResult.data.id, null);
                }
            }

            A.showToast(L.paySaved, 'success');
            renderFinancesList();
            return;
        }

        // --- Club / Entity save ---
        var entityId, entityName, periodStart, periodEnd;

        if (isClub) {
            entityName = document.getElementById('adFinClubFrom').value.trim();
            entityId = 'club';
            var opDate = document.getElementById('adFinOpDate').value;
            periodStart = opDate;
            periodEnd = opDate;

            if (!entityName) {
                A.showToast(L.payEntityRequired, 'error');
                return;
            }
            if (!opDate) {
                A.showToast(isEn ? 'Enter transaction date' : 'Укажите дату операции', 'error');
                return;
            }
        } else {
            entityId = document.getElementById('adFinEntityId').value;
            entityName = document.getElementById('adFinEntityName').value;
            periodStart = document.getElementById('adFinPeriodStart').value;
            periodEnd = document.getElementById('adFinPeriodEnd').value;

            if (!entityId || !entityName) {
                A.showToast(L.payEntityRequired, 'error');
                return;
            }
            if (!periodStart || !periodEnd) {
                A.showToast(L.payPeriodRequired, 'error');
                return;
            }
        }

        if (amount <= 0) {
            A.showToast(L.payAmountRequired, 'error');
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
            currency: currency,
            period_start: periodStart,
            period_end: periodEnd,
            payment_method: method,
            purpose: document.getElementById('adFinPurpose').value,
            note: note
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

        // Loyalty: earn points for court/coach payment (not club, not edit)
        if (!finEditingId && amount > 0 && (entityType === 'court' || entityType === 'coach') && A.earnLoyaltyPoints) {
            // Try to find profile linked to this entity payment's created_by
            var createdBy = data.created_by || null;
            if (createdBy) {
                A.earnLoyaltyPoints(createdBy, entityType, null, null);
            }
        }

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
            var createdDate = p.created_at ? A.formatDateTime(p.created_at) : '—';
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

    // ---- Excel Export ----
    function exportFinExcel() {
        var today = new Date().toISOString().slice(0, 10);
        var filtered = finAllData.slice();
        if (finDateFrom) {
            filtered = filtered.filter(function(p) { return p.created_at && p.created_at.slice(0, 10) >= finDateFrom; });
        }
        if (finDateTo) {
            filtered = filtered.filter(function(p) { return p.created_at && p.created_at.slice(0, 10) <= finDateTo; });
        }

        var headers = ['№', L.payEntity, isEn ? 'Type' : 'Тип', L.payAmount, isEn ? 'Currency' : 'Валюта', isEn ? 'Active Until' : 'Активен до', L.payStatus, L.payCreatedAt];
        var rows = filtered.map(function(p, i) {
            var isAct = p.period_end >= today;
            var statusLabel = isAct ? L.payActive : L.payExpired;
            var createdDate = p.created_at ? p.created_at.slice(0, 10) : '—';
            return [i + 1, p.name, getTypeLabel(p.type), p.amount || 0, p.currency || 'KGS', A.formatPayDate(p.period_end), statusLabel, createdDate];
        });

        A.exportCsv('kslt-finances-' + today + '.csv', headers, rows);
    }

    // ---- Payments Chart (12 months) ----
    var finChartInstance = null;

    function renderFinChart() {
        var canvas = document.getElementById('adFinChart');
        if (!canvas || typeof Chart === 'undefined') return;

        // Build last 12 months
        var now = new Date();
        var months = [];
        for (var i = 11; i >= 0; i--) {
            var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            months.push({
                key: d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0'),
                label: d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { month: 'short', year: '2-digit' })
            });
        }

        // Aggregate by type per month
        var types = ['membership', 'court', 'coach', 'club'];
        var typeMap = {};
        types.forEach(function(t) {
            typeMap[t] = {};
            months.forEach(function(m) { typeMap[t][m.key] = 0; });
        });

        finAllData.forEach(function(p) {
            if (!p.created_at || !p.type) return;
            var mk = p.created_at.slice(0, 7);
            var t = p.type === 'player' ? 'membership' : p.type;
            if (typeMap[t] && typeMap[t][mk] !== undefined) {
                typeMap[t][mk] += (p.amount || 0);
            }
        });

        var labels = months.map(function(m) { return m.label; });

        var colors = {
            membership: { border: 'rgba(204, 255, 0, 0.9)', bg: 'rgba(204, 255, 0, 0.1)', point: 'rgba(204, 255, 0, 1)' },
            court:      { border: 'rgba(76, 175, 80, 1)',    bg: 'rgba(76, 175, 80, 0.1)',  point: 'rgba(76, 175, 80, 1)' },
            coach:      { border: 'rgba(255, 214, 0, 1)',    bg: 'rgba(255, 214, 0, 0.1)',  point: 'rgba(255, 214, 0, 1)' },
            club:       { border: 'rgba(33, 150, 243, 1)',   bg: 'rgba(33, 150, 243, 0.1)', point: 'rgba(33, 150, 243, 1)' }
        };

        var datasets = types.map(function(t) {
            return {
                label: getTypeLabel(t),
                data: months.map(function(m) { return typeMap[t][m.key]; }),
                borderColor: colors[t].border,
                backgroundColor: colors[t].bg,
                borderWidth: 2,
                pointRadius: 3,
                pointBackgroundColor: colors[t].point,
                tension: 0.3,
                fill: false
            };
        });

        if (finChartInstance) finChartInstance.destroy();

        finChartInstance = new Chart(canvas.getContext('2d'), {
            type: 'line',
            data: { labels: labels, datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: 'rgba(255,255,255,0.7)',
                            font: { size: 11 },
                            boxWidth: 12,
                            padding: 16
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20,24,36,0.95)',
                        titleColor: '#fff',
                        bodyColor: 'rgba(255,255,255,0.8)',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(ctx) {
                                return ctx.dataset.label + ': ' + ctx.parsed.y.toLocaleString() + ' KGS';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: { color: 'rgba(255,255,255,0.5)', font: { size: 10 } }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: 'rgba(255,255,255,0.06)' },
                        ticks: {
                            color: 'rgba(255,255,255,0.5)',
                            font: { size: 10 },
                            callback: function(val) { return val.toLocaleString(); }
                        },
                        title: {
                            display: true,
                            text: 'KGS',
                            color: 'rgba(255,255,255,0.4)',
                            font: { size: 10 }
                        }
                    }
                }
            }
        });
    }

    // ---- Export to namespace ----
    A.renderFinancesSection = renderFinancesSection;
    A.renderFinancesList = renderFinancesList;
    A.loadAndEditFinance = loadAndEditFinance;

})();
