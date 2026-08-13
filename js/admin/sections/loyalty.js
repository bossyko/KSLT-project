// ============================================
// KSLT Admin — Loyalty (Rules, Rewards, Transactions)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // State
    var loySubTab = 'rules';
    var loyTxSearch = '', loyTxFilterType = '';
    var loyTxPage = 1, loyTxAllData = [], loyTxFiltered = [];
    var LOY_PER_PAGE = 20;

    // ---- Type labels map ----
    var TYPE_LABELS = {
        earn: L.loyEarn,
        redeem: L.loyRedeem,
        expire: L.loyExpire,
        admin_adjust: L.loyAdjust
    };

    var ACTION_LABELS = {
        tournament: isEn ? 'Tournament' : 'Турнир',
        court: isEn ? 'Court' : 'Корт',
        coach: isEn ? 'Coach' : 'Тренер',
        membership: isEn ? 'Membership' : 'Членство',
        expiry: isEn ? 'Expiry' : 'Сгорание',
        admin: isEn ? 'Admin' : 'Админ',
        first_membership: isEn ? 'Welcome bonus' : 'Приветственный бонус',
        free_tournament: isEn ? 'Free tournament' : 'Бесп. турнир',
        free_membership_1m: isEn ? 'Free membership' : 'Бесп. членство'
    };

    // ---- Entry point ----
    function renderLoyaltySection() {
        var container = document.getElementById('ad-loyalty');
        if (!container) return;

        var tabs = [
            { key: 'rules', label: L.loySubRules },
            { key: 'rewards', label: L.loySubRewards },
            { key: 'transactions', label: L.loySubTransactions }
        ];

        var tabsHtml = '';
        tabs.forEach(function(t) {
            tabsHtml += '<button class="ad-rat-tab' + (t.key === loySubTab ? ' active' : '') + '" data-loysub="' + t.key + '">' + t.label + '</button>';
        });

        container.innerHTML =
            '<h2 class="ad-section-title">' + L.loyalty + '</h2>' +
            '<div class="ad-rat-tabs">' + tabsHtml + '</div>' +
            '<div id="adLoyContent"></div>';

        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-rat-tab');
            if (!tab || !tab.dataset.loysub) return;
            loySubTab = tab.dataset.loysub;
            container.querySelectorAll('.ad-rat-tab').forEach(function(b) {
                b.classList.toggle('active', b.dataset.loysub === loySubTab);
            });
            renderSubTab();
        });

        renderSubTab();
    }

    function renderSubTab() {
        if (loySubTab === 'rules') renderRules();
        else if (loySubTab === 'rewards') renderRewards();
        else renderTransactions();
    }

    // ============================================
    // RULES
    // ============================================
    async function renderRules() {
        var wrap = document.getElementById('adLoyContent');
        if (!wrap) return;

        wrap.innerHTML = '<div class="ad-loading">...</div>';

        var res = await A.client.from('loyalty_rules').select('*').order('action');
        var rules = res.data || [];

        var html = '<div style="margin-bottom:16px;">' +
            '<button class="ad-btn ad-btn-primary" id="adLoyAddRule">+ ' + (isEn ? 'Add Rule' : 'Добавить правило') + '</button>' +
            '</div>';

        if (rules.length === 0) {
            html += '<div class="ad-empty-state"><div class="ad-empty-icon">⭐</div><h3>' + L.loyNoRules + '</h3></div>';
            wrap.innerHTML = html;
            document.getElementById('adLoyAddRule').addEventListener('click', function() { showRuleForm(null); });
            return;
        }

        html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
            '<th>' + L.loyAction + '</th>' +
            '<th>' + (isEn ? 'Label' : 'Название') + '</th>' +
            '<th>' + L.loyPoints + '</th>' +
            '<th>' + L.thStatus + '</th>' +
            '<th></th>' +
            '</tr></thead><tbody>';

        rules.forEach(function(r) {
            var label = isEn ? (r.label_en || r.label) : r.label;
            var statusCls = r.active ? 'ad-status-active' : 'ad-status-expired';
            var statusLabel = r.active ? L.loyActive : L.loyInactive;

            html += '<tr>' +
                '<td><code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;">' + A.esc(r.action) + '</code></td>' +
                '<td>' + A.esc(label || '') + '</td>' +
                '<td style="font-weight:600;color:var(--accent);">' + r.points + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                '<td class="ad-table-actions">' +
                    '<button class="ad-btn ad-btn--sm" data-loyedit="' + r.id + '">' + (isEn ? 'Edit' : 'Ред.') + '</button>' +
                    ' <button class="ad-btn ad-btn--sm ad-btn--danger" data-loyruledel="' + r.id + '">✕</button>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;

        document.getElementById('adLoyAddRule').addEventListener('click', function() { showRuleForm(null); });

        wrap.querySelectorAll('[data-loyedit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.loyedit;
                var rule = rules.find(function(r) { return r.id === id; });
                if (rule) showRuleForm(rule);
            });
        });

        wrap.querySelectorAll('[data-loyruledel]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.loyruledel;
                A.showConfirm(isEn ? 'Delete rule?' : 'Удалить правило?', '', async function() {
                    var res = await A.client.from('loyalty_rules').delete().eq('id', id);
                    if (res.error) { A.showToast(res.error.message, 'error'); return; }
                    A.showToast(L.loyDeleted, 'success');
                    renderRules();
                });
            });
        });
    }

    function showRuleForm(existing) {
        var isEdit = !!existing;
        var formHtml =
            '<div style="text-align:left;">' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + (isEn ? 'Action code' : 'Код действия') + '</label>' +
                    '<input type="text" id="adLoyRuleAction" class="ad-field-input" placeholder="court_premium" value="' + (existing ? A.esc(existing.action) : '') + '"' + (isEdit ? ' readonly style="opacity:0.5;"' : '') + '>' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + (isEn ? 'Label (RU)' : 'Название (RU)') + '</label>' +
                    '<input type="text" id="adLoyRuleLabel" class="ad-field-input" value="' + (existing ? A.esc(existing.label || '') : '') + '">' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + (isEn ? 'Label (EN)' : 'Название (EN)') + '</label>' +
                    '<input type="text" id="adLoyRuleLabelEn" class="ad-field-input" value="' + (existing ? A.esc(existing.label_en || '') : '') + '">' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyPoints + '</label>' +
                    '<input type="text" inputmode="numeric" pattern="[0-9]*" id="adLoyRulePoints" class="ad-field-input" value="' + (existing ? existing.points : 50) + '">' +
                '</div>' +
                (isEdit ? '<div style="margin-top:4px;"><label class="ad-checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text-primary);"><input type="checkbox" id="adLoyRuleActive"' + (existing.active ? ' checked' : '') + '> ' + L.loyActive + '</label></div>' : '') +
            '</div>';

        A.showConfirm(isEdit ? (isEn ? 'Edit Rule' : 'Редактирование правила') : (isEn ? 'Add Rule' : 'Добавить правило'), formHtml, async function() {
            var action = document.getElementById('adLoyRuleAction').value.trim();
            var label = document.getElementById('adLoyRuleLabel').value.trim();
            var labelEn = document.getElementById('adLoyRuleLabelEn').value.trim();
            var pts = parseInt(document.getElementById('adLoyRulePoints').value) || 0;
            var activeEl = document.getElementById('adLoyRuleActive');
            var active = activeEl ? activeEl.checked : true;

            if (!action) {
                A.showToast(isEn ? 'Action code required' : 'Код действия обязателен', 'error');
                return;
            }

            var data = {
                label: label || null,
                label_en: labelEn || null,
                points: pts,
                active: active,
                updated_at: new Date().toISOString()
            };

            var res;
            if (isEdit) {
                res = await A.client.from('loyalty_rules').update(data).eq('id', existing.id);
            } else {
                data.action = action;
                res = await A.client.from('loyalty_rules').insert(data);
            }

            if (res.error) { A.showToast(res.error.message, 'error'); return; }
            A.showToast(L.loySaved, 'success');
            renderRules();
        }, L.loySave);
    }

    // ============================================
    // REWARDS (Обмен баллов)
    // ============================================
    async function renderRewards() {
        var wrap = document.getElementById('adLoyContent');
        if (!wrap) return;

        wrap.innerHTML = '<div class="ad-loading">...</div>';

        var res = await A.client.from('loyalty_rewards').select('*').order('cost');
        var rewards = res.data || [];

        var html = '<div style="margin-bottom:16px;">' +
            '<button class="ad-btn ad-btn-primary" id="adLoyAddReward">+ ' + L.loyAddReward + '</button>' +
            '</div>';

        if (rewards.length === 0) {
            html += '<div class="ad-empty-state"><div class="ad-empty-icon">🎁</div><h3>' + L.loyNoRewards + '</h3></div>';
            wrap.innerHTML = html;
            document.getElementById('adLoyAddReward').addEventListener('click', function() { showRewardForm(null); });
            return;
        }

        html += '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
            '<th>' + L.loyRewardCode + '</th>' +
            '<th>' + L.loyRewardTitle + '</th>' +
            '<th>' + L.loyRewardCost + '</th>' +
            '<th>' + L.thStatus + '</th>' +
            '<th></th>' +
            '</tr></thead><tbody>';

        rewards.forEach(function(r) {
            var title = isEn ? (r.title_en || r.title) : r.title;
            var statusCls = r.active ? 'ad-status-active' : 'ad-status-expired';
            var statusLabel = r.active ? L.loyActive : L.loyInactive;

            html += '<tr>' +
                '<td><code style="background:rgba(255,255,255,0.06);padding:2px 8px;border-radius:4px;">' + A.esc(r.code) + '</code></td>' +
                '<td>' + A.esc(title || '') + '</td>' +
                '<td style="font-weight:600;color:var(--accent);">' + r.cost + '</td>' +
                '<td><span class="ad-status-badge ' + statusCls + '">' + statusLabel + '</span></td>' +
                '<td class="ad-table-actions">' +
                    '<button class="ad-btn ad-btn--sm" data-loyrewardedit="' + r.id + '">' + (isEn ? 'Edit' : 'Ред.') + '</button> ' +
                    '<button class="ad-btn ad-btn--sm ad-btn--danger" data-loyrewarddel="' + r.id + '">✕</button>' +
                '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';
        wrap.innerHTML = html;

        document.getElementById('adLoyAddReward').addEventListener('click', function() { showRewardForm(null); });

        wrap.querySelectorAll('[data-loyrewardedit]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.loyrewardedit;
                var rw = rewards.find(function(r) { return r.id === id; });
                if (rw) showRewardForm(rw);
            });
        });

        wrap.querySelectorAll('[data-loyrewarddel]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                var id = this.dataset.loyrewarddel;
                A.showConfirm(L.loyDeleteReward, '', async function() {
                    var res = await A.client.from('loyalty_rewards').delete().eq('id', id);
                    if (res.error) { A.showToast(res.error.message, 'error'); return; }
                    A.showToast(L.loyDeleted, 'success');
                    renderRewards();
                });
            });
        });
    }

    function showRewardForm(existing) {
        var isEdit = !!existing;
        var formHtml =
            '<div style="text-align:left;">' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyRewardCode + '</label>' +
                    '<input type="text" id="adLoyRwCode" class="ad-field-input" placeholder="free_tournament" value="' + (existing ? A.esc(existing.code) : '') + '"' + (isEdit ? ' readonly style="opacity:0.5;"' : '') + '>' +
                '</div>' +
                '<div class="ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.loyRewardTitle + ' (RU)</label>' +
                        '<input type="text" id="adLoyRwTitle" class="ad-field-input" value="' + (existing ? A.esc(existing.title) : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.loyRewardTitle + ' (EN)</label>' +
                        '<input type="text" id="adLoyRwTitleEn" class="ad-field-input" value="' + (existing ? A.esc(existing.title_en || '') : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyRewardCost + '</label>' +
                    '<input type="number" id="adLoyRwCost" class="ad-field-input" min="1" value="' + (existing ? existing.cost : 100) + '">' +
                '</div>' +
                '<div style="margin-top:4px;">' +
                    '<label class="ad-checkbox-label" style="display:flex;align-items:center;gap:8px;cursor:pointer;color:var(--text-primary);">' +
                        '<input type="checkbox" id="adLoyRwActive"' + (existing ? (existing.active ? ' checked' : '') : ' checked') + '> ' + L.loyActive +
                    '</label>' +
                '</div>' +
            '</div>';

        A.showConfirm(isEdit ? L.loyEditReward : L.loyAddReward, formHtml, async function() {
            var code = document.getElementById('adLoyRwCode').value.trim();
            var title = document.getElementById('adLoyRwTitle').value.trim();
            var titleEn = document.getElementById('adLoyRwTitleEn').value.trim();
            var cost = parseInt(document.getElementById('adLoyRwCost').value) || 100;
            var active = document.getElementById('adLoyRwActive').checked;

            if (!code || !title) {
                A.showToast(isEn ? 'Code and title required' : 'Код и название обязательны', 'error');
                return;
            }

            var data = { title: title, title_en: titleEn || null, cost: cost, active: active, updated_at: new Date().toISOString() };

            var res;
            if (isEdit) {
                res = await A.client.from('loyalty_rewards').update(data).eq('id', existing.id);
            } else {
                data.code = code;
                res = await A.client.from('loyalty_rewards').insert(data);
            }

            if (res.error) { A.showToast(res.error.message, 'error'); return; }
            A.showToast(L.loySaved, 'success');
            renderRewards();
        }, L.loySave);
    }

    // ============================================
    // TRANSACTIONS
    // ============================================
    async function renderTransactions() {
        var wrap = document.getElementById('adLoyContent');
        if (!wrap) return;

        var isAdm = A.currentRole === 'admin';

        wrap.innerHTML = '<div class="ad-loading">...</div>';

        var res = await A.client.from('loyalty_transactions')
            .select('*, profiles!profile_id(full_name, email)')
            .order('created_at', { ascending: false });

        loyTxAllData = res.data || [];

        // Stat cards
        var totalEarned = 0, totalSpent = 0, totalExpired = 0;
        loyTxAllData.forEach(function(t) {
            if (t.type === 'earn') totalEarned += t.points;
            else if (t.type === 'redeem') totalSpent += t.points;
            else if (t.type === 'expire') totalExpired += t.points;
            else if (t.type === 'admin_adjust') {
                if (t.points > 0) totalEarned += t.points;
                else totalSpent += Math.abs(t.points);
            }
        });
        var totalActive = totalEarned - totalSpent - totalExpired;

        var statsHtml =
            '<div class="ad-stats-grid" style="margin-bottom:16px;">' +
                statCard('💎', totalEarned, L.loyStatEarned) +
                statCard('🔻', totalSpent, L.loyStatSpent) +
                statCard('⭐', totalActive, L.loyStatActive) +
                statCard('🔥', totalExpired, L.loyStatExpired) +
            '</div>';

        // Filters (standard pattern: ad-filter-row + ad-field-input)
        var typeOptions =
            '<option value="">' + L.loyAllTypes + '</option>' +
            '<option value="earn"' + (loyTxFilterType === 'earn' ? ' selected' : '') + '>' + L.loyEarn + '</option>' +
            '<option value="redeem"' + (loyTxFilterType === 'redeem' ? ' selected' : '') + '>' + L.loyRedeem + '</option>' +
            '<option value="expire"' + (loyTxFilterType === 'expire' ? ' selected' : '') + '>' + L.loyExpire + '</option>' +
            '<option value="admin_adjust"' + (loyTxFilterType === 'admin_adjust' ? ' selected' : '') + '>' + L.loyAdjust + '</option>';

        var filtersHtml =
            '<div class="ad-filter-row">' +
                '<input type="text" id="adLoySearch" class="ad-field-input ad-filter-search" placeholder="' + L.loySearch + '" value="' + A.esc(loyTxSearch) + '">' +
                '<select id="adLoyTypeFilter" class="ad-field-input ad-filter-select">' + typeOptions + '</select>' +
                (isAdm ? '<button class="ad-btn ad-btn-primary" id="adLoyAdjustBtn" style="white-space:nowrap;">' + L.loyAdjustTitle + '</button>' : '') +
            '</div>';

        wrap.innerHTML = statsHtml + filtersHtml + '<div id="adLoyTxTable"></div>';

        applyTxFilters();

        document.getElementById('adLoySearch').addEventListener('input', function() {
            loyTxSearch = this.value.toLowerCase();
            loyTxPage = 1;
            applyTxFilters();
        });
        document.getElementById('adLoyTypeFilter').addEventListener('change', function() {
            loyTxFilterType = this.value;
            loyTxPage = 1;
            applyTxFilters();
        });

        if (isAdm) {
            var adjustBtn = document.getElementById('adLoyAdjustBtn');
            if (adjustBtn) adjustBtn.addEventListener('click', showAdjustModal);
        }
    }

    function statCard(icon, value, label) {
        return '<div class="ad-stat-card">' +
            '<div class="ad-stat-icon">' + icon + '</div>' +
            '<div class="ad-stat-value">' + value + '</div>' +
            '<div class="ad-stat-label">' + label + '</div>' +
        '</div>';
    }

    function applyTxFilters() {
        loyTxFiltered = loyTxAllData.filter(function(t) {
            if (loyTxFilterType && t.type !== loyTxFilterType) return false;
            if (loyTxSearch) {
                var name = t.profiles ? (t.profiles.full_name || '').toLowerCase() : '';
                var email = t.profiles ? (t.profiles.email || '').toLowerCase() : '';
                if (name.indexOf(loyTxSearch) === -1 && email.indexOf(loyTxSearch) === -1) return false;
            }
            return true;
        });
        renderTxTable();
    }

    function renderTxTable() {
        var wrap = document.getElementById('adLoyTxTable');
        if (!wrap) return;

        var total = loyTxFiltered.length;
        var start = (loyTxPage - 1) * LOY_PER_PAGE;
        var page = loyTxFiltered.slice(start, start + LOY_PER_PAGE);

        if (total === 0) {
            wrap.innerHTML = '<div class="ad-empty-state"><div class="ad-empty-icon">⭐</div><h3>' + L.loyNoTransactions + '</h3></div>';
            return;
        }

        var html = '<div class="ad-table-wrap"><table class="ad-table"><thead><tr>' +
            '<th>' + L.loyDate + '</th>' +
            '<th>' + L.loyUser + '</th>' +
            '<th>' + L.loyType + '</th>' +
            '<th>' + L.loyPoints + '</th>' +
            '<th>' + L.loyAction + '</th>' +
            '<th>' + L.loyNote + '</th>' +
            '</tr></thead><tbody>';

        page.forEach(function(t) {
            var userName = t.profiles ? A.esc(t.profiles.full_name || t.profiles.email || '') : '—';
            var typeLabel = TYPE_LABELS[t.type] || t.type;
            var actionLabel = ACTION_LABELS[t.action] || A.esc(t.action || '—');
            var date = A.fmtDate(t.created_at);

            var pointsStyle = '';
            var pointsPrefix = '';
            if (t.type === 'earn' || (t.type === 'admin_adjust' && t.points > 0)) {
                pointsStyle = 'color:#4caf50;';
                pointsPrefix = '+';
            } else if (t.type === 'redeem' || t.type === 'expire' || (t.type === 'admin_adjust' && t.points < 0)) {
                pointsStyle = 'color:#f44336;';
                pointsPrefix = '-';
            }

            var typeCls = t.type === 'earn' ? 'ad-status-active' :
                          t.type === 'redeem' ? 'ad-status-used' :
                          t.type === 'expire' ? 'ad-status-expired' : 'ad-status-draft';

            html += '<tr>' +
                '<td>' + date + '</td>' +
                '<td style="font-weight:500;">' + userName + '</td>' +
                '<td><span class="ad-status-badge ' + typeCls + '">' + typeLabel + '</span></td>' +
                '<td style="font-weight:600;' + pointsStyle + '">' + pointsPrefix + Math.abs(t.points) + '</td>' +
                '<td>' + actionLabel + '</td>' +
                '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;color:var(--text-dim);">' + A.esc(t.note || '') + '</td>' +
            '</tr>';
        });

        html += '</tbody></table></div>';

        // Pagination
        var totalPages = Math.ceil(total / LOY_PER_PAGE);
        if (totalPages > 1) {
            html += '<div class="ad-pagination">';
            for (var p = 1; p <= totalPages; p++) {
                html += '<button class="ad-page-btn' + (p === loyTxPage ? ' active' : '') + '" data-loypage="' + p + '">' + p + '</button>';
            }
            html += '</div>';
        }

        wrap.innerHTML = html;

        wrap.querySelectorAll('[data-loypage]').forEach(function(btn) {
            btn.addEventListener('click', function() {
                loyTxPage = parseInt(this.dataset.loypage);
                renderTxTable();
            });
        });
    }

    // ---- Admin Adjust Modal ----
    function showAdjustModal() {
        var formHtml =
            '<div style="text-align:left;">' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyUser + '</label>' +
                    '<input type="text" id="adLoyAdjUser" class="ad-field-input" placeholder="' + L.loySearch + '">' +
                    '<div id="adLoyAdjResults" style="max-height:120px;overflow:auto;margin-top:4px;border-radius:var(--radius-sm);"></div>' +
                    '<input type="hidden" id="adLoyAdjProfileId">' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyAdjustPoints + '</label>' +
                    '<input type="number" id="adLoyAdjPoints" class="ad-field-input" placeholder="+50 / -20">' +
                '</div>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.loyAdjustNote + '</label>' +
                    '<input type="text" id="adLoyAdjNote" class="ad-field-input">' +
                '</div>' +
            '</div>';

        A.showConfirm(L.loyAdjustTitle, formHtml, async function() {
            var profileId = document.getElementById('adLoyAdjProfileId').value;
            var pts = parseInt(document.getElementById('adLoyAdjPoints').value);
            var note = document.getElementById('adLoyAdjNote').value.trim();

            if (!profileId) { A.showToast(isEn ? 'Select a user' : 'Выберите пользователя', 'error'); return; }
            if (!pts || pts === 0) { A.showToast(isEn ? 'Enter points' : 'Введите баллы', 'error'); return; }

            var res = await A.client.from('loyalty_transactions').insert({
                profile_id: profileId,
                type: 'admin_adjust',
                points: pts,
                action: 'admin',
                note: note || null
            });

            if (res.error) { A.showToast(res.error.message, 'error'); return; }
            A.showToast(L.loyAdjusted, 'success');
            renderTransactions();
        }, L.loyAdjustApply);

        // Profile search with delay
        setTimeout(function() {
            var input = document.getElementById('adLoyAdjUser');
            if (!input) return;
            var timer = null;
            input.addEventListener('input', function() {
                clearTimeout(timer);
                var q = this.value.trim();
                if (q.length < 2) { document.getElementById('adLoyAdjResults').innerHTML = ''; return; }
                timer = setTimeout(async function() {
                    var res = await A.client.from('profiles')
                        .select('id, full_name, email')
                        .or('full_name.ilike.%' + q + '%,email.ilike.%' + q + '%')
                        .limit(5);

                    var results = res.data || [];
                    var rHtml = '';
                    results.forEach(function(p) {
                        rHtml += '<div data-pid="' + p.id + '" style="padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border-subtle);color:var(--text-primary);transition:background 0.15s;" onmouseover="this.style.background=\'rgba(255,255,255,0.05)\'" onmouseout="this.style.background=\'none\'">' +
                            A.esc(p.full_name || '') + ' <span style="color:var(--text-dim);font-size:0.8rem;">' + A.esc(p.email || '') + '</span>' +
                        '</div>';
                    });
                    var rWrap = document.getElementById('adLoyAdjResults');
                    if (rWrap) {
                        rWrap.innerHTML = rHtml;
                        rWrap.querySelectorAll('[data-pid]').forEach(function(el) {
                            el.addEventListener('click', function() {
                                document.getElementById('adLoyAdjProfileId').value = this.dataset.pid;
                                input.value = this.textContent.trim();
                                rWrap.innerHTML = '';
                            });
                        });
                    }
                }, 300);
            });
        }, 100);
    }

    // ============================================
    // Auto-earn helper (called from finances.js / bracket.js)
    // ============================================
    async function earnLoyaltyPoints(profileId, action, sourceId, noteText) {
        if (!profileId) return;

        try {
            var ruleRes = await A.client.from('loyalty_rules')
                .select('points')
                .eq('action', action)
                .eq('active', true)
                .single();

            if (ruleRes.error || !ruleRes.data || ruleRes.data.points <= 0) return;

            var pts = ruleRes.data.points;
            var expiresAt = new Date();
            expiresAt.setFullYear(expiresAt.getFullYear() + 1);

            await A.client.from('loyalty_transactions').insert({
                profile_id: profileId,
                type: 'earn',
                points: pts,
                action: action,
                source_id: sourceId || null,
                note: noteText || null,
                expires_at: expiresAt.toISOString()
            });
        } catch (e) {
            console.error('Loyalty earn error:', e);
        }
    }

    // ---- Export to namespace ----
    A.renderLoyaltySection = renderLoyaltySection;
    A.earnLoyaltyPoints = earnLoyaltyPoints;

})();
