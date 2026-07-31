// ============================================
// KSLT Admin — Settings (Points Rules + Promotions)
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;
    var L = A.L;
    var isEn = A.isEn;

    // ---- Promotions state ----
    var _promoGenderFilter = '';
    var _promoCatFilter = '';

    // ---- Main render ----
    function renderSettingsSection() {
        var container = document.getElementById('ad-settings');
        if (!container) return;

        // Only admin can see settings
        if (A.currentRole !== 'admin') {
            container.innerHTML = '<div class="ad-empty-state"><p>' + (isEn ? 'Access denied' : 'Доступ запрещён') + '</p></div>';
            return;
        }

        var tabs = [
            { key: 'rules', label: L.setSubRules },
            { key: 'promotions', label: L.setSubPromo }
        ];

        var html = '<div class="ad-rat-tabs" id="setTabs">';
        tabs.forEach(function(t, i) {
            html += '<button class="ad-rat-tab' + (i === 0 ? ' active' : '') + '" data-settab="' + t.key + '">' + t.label + '</button>';
        });
        html += '</div>';

        tabs.forEach(function(t, i) {
            html += '<div class="ad-rat-panel' + (i === 0 ? ' active' : '') + '" id="setPanel' + t.key.charAt(0).toUpperCase() + t.key.slice(1) + '"></div>';
        });

        container.innerHTML = html;

        // Tab switching
        var tabBtns = container.querySelectorAll('.ad-rat-tab[data-settab]');
        tabBtns.forEach(function(btn) {
            btn.addEventListener('click', function() {
                tabBtns.forEach(function(b) { b.classList.remove('active'); });
                btn.classList.add('active');
                container.querySelectorAll('.ad-rat-panel').forEach(function(p) { p.classList.remove('active'); });
                var key = btn.getAttribute('data-settab');
                var panelId = 'setPanel' + key.charAt(0).toUpperCase() + key.slice(1);
                var panel = document.getElementById(panelId);
                if (panel) panel.classList.add('active');
            });
        });

        // Render sub-tabs content
        renderSetRules();
        renderSetPromotions();
    }

    // ---- Points Rules Sub-tab ----
    function renderSetRules() {
        var panel = document.getElementById('setPanelRules');
        if (!panel) return;

        var cachedLevels = A.cachedLevels || [];
        var cachedRules = A.cachedRules || {};
        var ROUND_KEYS = A.ROUND_KEYS;
        var ROUND_LABELS = A.ROUND_LABELS;

        var html = '';

        if (cachedLevels.length === 0) {
            html += '<div class="ad-empty-state"><p>' + L.ratNoLevels + '</p></div>';
        } else {
            html += '<div class="ad-table-card"><div class="ad-table-wrap" style="overflow-x:auto;"><table class="ad-table" id="setRulesTable"><thead><tr>' +
                '<th>' + L.ratRound + '</th>';

            cachedLevels.forEach(function(lv) {
                var name = isEn ? (lv.name_en || lv.name) : lv.name;
                html += '<th style="text-align:center;"><span>' + A.esc(name) + '</span>' +
                    '<button class="ad-btn-icon set-del-level" data-level-id="' + lv.id + '" title="' + L.ratDeleteLevel + '" style="margin-left:4px;font-size:12px;vertical-align:middle;">&times;</button></th>';
            });
            html += '</tr></thead><tbody>';

            ROUND_KEYS.forEach(function(round) {
                html += '<tr><td><strong>' + ROUND_LABELS[round] + '</strong></td>';
                cachedLevels.forEach(function(lv) {
                    var val = (cachedRules[lv.id] && cachedRules[lv.id][round]) ? cachedRules[lv.id][round].points : 0;
                    html += '<td style="text-align:center;"><input type="number" class="ad-field-input set-rule-input" ' +
                        'data-level="' + lv.id + '" data-round="' + round + '" ' +
                        'value="' + val + '" min="0" style="width:70px;text-align:center;"></td>';
                });
                html += '</tr>';
            });

            html += '</tbody></table></div></div>';
        }

        html += '<div class="ad-rat-actions">' +
            '<button class="ad-btn ad-btn-secondary" id="setAddLevelBtn">' + L.ratAddLevel + '</button>' +
            (cachedLevels.length > 0 ? '<button class="ad-btn ad-btn-primary" id="setSaveRulesBtn">' + L.ratSaveRules + '</button>' : '') +
        '</div>';

        panel.innerHTML = html;

        // Save rules
        var saveBtn = document.getElementById('setSaveRulesBtn');
        if (saveBtn) saveBtn.addEventListener('click', savePointsRules);

        // Add level
        document.getElementById('setAddLevelBtn').addEventListener('click', showAddLevelModal);

        // Allow only digits in rule inputs
        panel.addEventListener('keydown', function(e) {
            if (!e.target.classList.contains('set-rule-input')) return;
            if (e.key.length === 1 && !/\d/.test(e.key) && !e.ctrlKey && !e.metaKey) {
                e.preventDefault();
            }
        });

        // Delete level (event delegation)
        panel.addEventListener('click', function(e) {
            var delBtn = e.target.closest('.set-del-level');
            if (!delBtn) return;
            var levelId = delBtn.getAttribute('data-level-id');
            if (levelId && confirm(L.ratDeleteLevelConfirm)) {
                deleteLevel(levelId);
            }
        });
    }

    function showAddLevelModal() {
        var overlay = document.createElement('div');
        overlay.className = 'ad-modal-overlay';
        overlay.innerHTML =
            '<div class="ad-modal" style="max-width:400px;">' +
                '<div class="ad-modal-header">' +
                    '<h3>' + L.ratAddLevel + '</h3>' +
                    '<button class="ad-modal-close" id="setLevelModalClose">&times;</button>' +
                '</div>' +
                '<div class="ad-modal-body">' +
                    '<div class="ad-field" style="margin-bottom:12px;">' +
                        '<label class="ad-field-label">' + L.ratLevelName + '</label>' +
                        '<input type="text" class="ad-field-input" id="setLevelNameInput" placeholder="' + L.ratLevelName + '">' +
                    '</div>' +
                    '<div class="ad-field" style="margin-bottom:16px;">' +
                        '<label class="ad-field-label">' + L.ratLevelNameEn + '</label>' +
                        '<input type="text" class="ad-field-input" id="setLevelNameEnInput" placeholder="' + L.ratLevelNameEn + '">' +
                    '</div>' +
                    '<div style="display:flex;gap:12px;justify-content:flex-end;">' +
                        '<button class="ad-btn ad-btn-primary" id="setLevelSaveBtn">' + L.save + '</button>' +
                    '</div>' +
                '</div>' +
            '</div>';

        document.body.appendChild(overlay);

        document.getElementById('setLevelModalClose').addEventListener('click', function() { overlay.remove(); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay) overlay.remove(); });

        // Auto-translate RU → EN on blur
        document.getElementById('setLevelNameInput').addEventListener('blur', function() {
            var srcText = this.value.trim();
            var targetEl = document.getElementById('setLevelNameEnInput');
            if (!srcText || targetEl.value.trim()) return;
            targetEl.placeholder = L.translating;
            A.translateFromRu(srcText, 'en').then(function(result) {
                if (!targetEl.value.trim()) targetEl.value = result;
                targetEl.placeholder = L.ratLevelNameEn;
            }).catch(function() {
                targetEl.placeholder = L.ratLevelNameEn;
            });
        });

        document.getElementById('setLevelSaveBtn').addEventListener('click', async function() {
            var name = document.getElementById('setLevelNameInput').value.trim();
            var nameEn = document.getElementById('setLevelNameEnInput').value.trim();
            if (!name) return;
            var cachedLevels = A.cachedLevels || [];
            var sortOrder = cachedLevels.length > 0 ? Math.max.apply(null, cachedLevels.map(function(l) { return l.sort_order || 0; })) + 1 : 1;
            var res = await A.client.from('tournament_levels').insert({ name: name, name_en: nameEn || name, sort_order: sortOrder });
            if (res.error) {
                A.showToast(res.error.message, 'error');
                return;
            }
            A.showToast(L.ratLevelAdded, 'success');
            overlay.remove();
            // Reset cache and reload
            A.cachedLevels = [];
            await A.loadTournamentLevels(true);
            await A.loadPointsRules();
            renderSetRules();
        });
    }

    async function deleteLevel(levelId) {
        // Unlink tournaments from this level, then delete rules, then level
        await A.client.from('tournaments').update({ level_id: null }).eq('level_id', levelId);
        await A.client.from('points_rules').delete().eq('level_id', levelId);
        var res = await A.client.from('tournament_levels').delete().eq('id', levelId);
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }
        A.showToast(L.ratLevelDeleted, 'success');
        A.cachedLevels = [];
        await A.loadTournamentLevels(true);
        await A.loadPointsRules();
        renderSetRules();
    }

    async function savePointsRules() {
        var inputs = document.querySelectorAll('.set-rule-input');
        var cachedRules = A.cachedRules || {};
        var toUpsert = [];

        inputs.forEach(function(inp) {
            var levelId = inp.dataset.level;
            var round = inp.dataset.round;
            var pts = parseInt(inp.value, 10) || 0;
            toUpsert.push({ level_id: levelId, round: round, points: pts });
        });

        var res = await A.client.from('points_rules').upsert(toUpsert, { onConflict: 'level_id,round', ignoreDuplicates: false });
        if (res.error) {
            A.showToast(res.error.message, 'error');
            return;
        }

        A.showToast(L.ratRulesSaved, 'success');
        await A.loadPointsRules();
    }

    // ---- Promotions Sub-tab ----
    function renderSetPromotions() {
        var panel = document.getElementById('setPanelPromotions');
        if (!panel) return;

        // Gender dropdown
        var genderOpts = '<option value="">' + L.ratAllGenders + '</option>' +
            '<option value="men">\u2642 ' + L.genderMen + '</option>' +
            '<option value="women">\u2640 ' + L.genderWomen + '</option>';

        // Category dropdown
        var catOpts = '<option value="">' + L.ratAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var name = isEn ? (c.name_en || c.name) : c.name;
            catOpts += '<option value="' + c.id + '">' + name + '</option>';
        });

        panel.innerHTML =
            '<div class="ad-rat-info-banner">' + L.ratTop5Info + '</div>' +
            '<div class="ad-filter-row">' +
                '<select class="ad-field-input ad-filter-select" id="setPromoGenderFilter">' + genderOpts + '</select>' +
                '<select class="ad-field-input ad-filter-select" id="setPromoCatFilter">' + catOpts + '</select>' +
            '</div>' +
            '<div id="setPromotionsBody"></div>';

        document.getElementById('setPromoGenderFilter').addEventListener('change', function() {
            _promoGenderFilter = this.value;
            var catSelect = document.getElementById('setPromoCatFilter');
            var newCatOpts = '<option value="">' + L.ratAllCategories + '</option>';
            A.cachedCategories.forEach(function(c) {
                if (_promoGenderFilter && c.gender !== _promoGenderFilter) return;
                var name = isEn ? (c.name_en || c.name) : c.name;
                newCatOpts += '<option value="' + c.id + '">' + name + '</option>';
            });
            catSelect.innerHTML = newCatOpts;
            _promoCatFilter = '';
            loadPromotions();
        });

        document.getElementById('setPromoCatFilter').addEventListener('change', function() {
            _promoCatFilter = this.value;
            loadPromotions();
        });

        loadPromotions();
    }

    async function loadPromotions() {
        var body = document.getElementById('setPromotionsBody');
        if (!body) return;
        body.innerHTML = '<div style="padding:20px;opacity:0.5;">Loading...</div>';

        // Load current promotions
        var res = await A.client.from('player_promotions').select('*, players(name, name_en), from_cat:categories!player_promotions_from_category_id_fkey(name, name_en), to_cat:categories!player_promotions_to_category_id_fkey(name, name_en)').order('created_at', { ascending: false });
        var promotions = res.data || [];

        // Build a set of player IDs with active promotions (eligible/transition)
        var activePromotionMap = {};
        promotions.forEach(function(pr) {
            if (pr.status === 'eligible' || pr.status === 'transition') {
                activePromotionMap[pr.player_id] = pr.status;
            }
        });

        // Group categories by gender, sort by sort_order ascending (Tour→Pro-Masters)
        var catsByGender = {};
        A.cachedCategories.forEach(function(c) {
            var g = c.gender || 'other';
            if (!catsByGender[g]) catsByGender[g] = [];
            catsByGender[g].push(c);
        });
        Object.keys(catsByGender).forEach(function(g) {
            catsByGender[g].sort(function(a, b) { return (a.sort_order || 0) - (b.sort_order || 0); });
        });

        // Build eligible list
        var eligibleHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Eligible for Promotion' : 'Доступны для промоушена') + '</h3>';
        var hasEligible = false;

        var genders = Object.keys(catsByGender);
        for (var gi = 0; gi < genders.length; gi++) {
            if (_promoGenderFilter && genders[gi] !== _promoGenderFilter) continue;

            var genderCats = catsByGender[genders[gi]];
            var genderLabel = genders[gi] === 'men' ? (isEn ? 'Men' : 'Мужчины') : (isEn ? 'Women' : 'Женщины');

            for (var ci = 0; ci < genderCats.length - 1; ci++) {
                var cat = genderCats[ci];
                var nextCat = genderCats[ci + 1];

                if (_promoCatFilter && cat.id !== _promoCatFilter) continue;

                var catName = isEn ? (cat.name_en || cat.name) : cat.name;
                var nextCatName = isEn ? (nextCat.name_en || nextCat.name) : nextCat.name;

                var plrRes = await A.client.from('players').select('id, name, name_en, points').eq('category_id', cat.id).order('points', { ascending: false }).limit(5);
                var top5 = plrRes.data || [];

                if (top5.length > 0) {
                    hasEligible = true;
                    eligibleHtml += '<div class="ad-table-card" style="margin-bottom:12px;">' +
                        '<div class="ad-table-card-title">' + genderLabel + ': ' + catName + ' → ' + nextCatName + '</div>' +
                        '<div class="ad-table-wrap"><table class="ad-table ad-promo-table"><thead><tr>' +
                        '<th style="width:40px">#</th><th>' + L.ratPlayer + '</th><th style="width:80px">' + L.ratPoints + '</th><th style="width:140px">' + L.ratActions + '</th>' +
                        '</tr></thead><tbody>';

                    top5.forEach(function(p, idx) {
                        var name = isEn ? (p.name_en || p.name) : p.name;
                        var actionCell;
                        if (activePromotionMap[p.id]) {
                            var st = activePromotionMap[p.id];
                            var stLabel = st === 'eligible' ? L.ratEligible : L.ratTransition;
                            actionCell = '<span class="ad-status-badge ad-status-' + st + '">' + stLabel + '</span>';
                        } else {
                            actionCell = '<button class="ad-btn ad-btn-sm ad-btn-primary promo-promote-btn" data-player-id="' + p.id + '" data-from-cat="' + cat.id + '" data-to-cat="' + nextCat.id + '">' + L.ratPromote + '</button>';
                        }
                        eligibleHtml += '<tr><td>' + (idx + 1) + '</td><td>' + A.esc(name) + '</td><td>' + (p.points || 0) + '</td><td>' + actionCell + '</td></tr>';
                    });
                    eligibleHtml += '</tbody></table></div></div>';
                }
            }
        }

        if (!hasEligible) {
            eligibleHtml += '<div class="ad-empty-state"><p>' + L.ratNoPlayers + '</p></div>';
        }

        // Existing promotions history
        var historyHtml = '<h3 class="ad-rat-cat-title">' + (isEn ? 'Promotion History' : 'История промоушенов') + '</h3>';

        var filteredPromotions = promotions;
        if (_promoGenderFilter || _promoCatFilter) {
            filteredPromotions = promotions.filter(function(pr) {
                if (_promoCatFilter) return pr.from_category_id === _promoCatFilter;
                var fromCatObj = A.cachedCategories.find(function(c) { return c.id === pr.from_category_id; });
                return fromCatObj && fromCatObj.gender === _promoGenderFilter;
            });
        }

        if (filteredPromotions.length === 0) {
            historyHtml += '<div class="ad-empty-state"><p>' + L.ratNoPromotions + '</p></div>';
        } else {
            historyHtml += '<div class="ad-table-card"><div class="ad-table-wrap"><table class="ad-table ad-promo-history"><thead><tr>' +
                '<th>' + L.ratPlayer + '</th>' +
                '<th>' + L.ratFromCat + '</th>' +
                '<th>' + L.ratToCat + '</th>' +
                '<th style="width:70px">' + L.ratSeason + '</th>' +
                '<th style="width:100px">' + L.ratStatus + '</th>' +
                '<th style="width:200px">' + L.ratActions + '</th>' +
            '</tr></thead><tbody>';

            filteredPromotions.forEach(function(pr) {
                var name = pr.players ? (isEn ? (pr.players.name_en || pr.players.name) : pr.players.name) : '?';
                var fromCat = pr.from_cat ? (isEn ? (pr.from_cat.name_en || pr.from_cat.name) : pr.from_cat.name) : '?';
                var toCat = pr.to_cat ? (isEn ? (pr.to_cat.name_en || pr.to_cat.name) : pr.to_cat.name) : '?';
                var statusLabel = pr.status === 'eligible' ? L.ratEligible : pr.status === 'transition' ? L.ratTransition : L.ratCompleted;
                var statusClass = 'ad-status-badge ad-status-' + pr.status;

                var actionsHtml = '';
                if (pr.status === 'eligible') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-transition-btn" data-promo-id="' + pr.id + '">' + L.ratStartTransition + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else if (pr.status === 'transition') {
                    actionsHtml = '<div class="ad-promo-actions">' +
                        '<button class="ad-btn ad-btn-sm ad-btn-primary promo-complete-btn" data-promo-id="' + pr.id + '">' + L.ratCompletePromotion + '</button>' +
                        '<button class="ad-btn ad-btn-sm ad-btn-danger promo-cancel-btn" data-promo-id="' + pr.id + '">' + L.ratCancelPromotion + '</button>' +
                    '</div>';
                } else {
                    actionsHtml = '—';
                }

                historyHtml += '<tr>' +
                    '<td>' + A.esc(name) + '</td>' +
                    '<td>' + A.esc(fromCat) + '</td>' +
                    '<td>' + A.esc(toCat) + '</td>' +
                    '<td>' + pr.season + '</td>' +
                    '<td><span class="' + statusClass + '">' + statusLabel + '</span></td>' +
                    '<td>' + actionsHtml + '</td>' +
                '</tr>';
            });
            historyHtml += '</tbody></table></div></div>';
        }

        body.innerHTML = eligibleHtml + historyHtml;
    }

    async function createPromotion(playerId, fromCatId, toCatId) {
        var season = new Date().getFullYear();
        var res = await A.client.from('player_promotions').insert({
            player_id: playerId,
            from_category_id: fromCatId,
            to_category_id: toCatId,
            season: season,
            status: 'eligible',
            eligible_date: new Date().toISOString().slice(0, 10)
        });
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function updatePromotionStatus(promotionId, newStatus) {
        if (newStatus === 'transition') {
            var res = await A.client.from('player_promotions').update({ status: 'transition' }).eq('id', promotionId);
            if (res.error) { A.showToast(res.error.message, 'error'); return; }
        } else if (newStatus === 'completed') {
            var prRes = await A.client.from('player_promotions').select('player_id, to_category_id').eq('id', promotionId).single();
            if (prRes.error) { A.showToast(prRes.error.message, 'error'); return; }
            var pr = prRes.data;
            var upd = await A.client.from('player_promotions').update({
                status: 'completed',
                completed_date: new Date().toISOString().slice(0, 10)
            }).eq('id', promotionId);
            if (upd.error) { A.showToast(upd.error.message, 'error'); return; }
            // Move player to new category, reset stats
            var plrUpd = await A.client.from('players').update({
                category_id: pr.to_category_id,
                points: 0,
                wins: 0,
                losses: 0,
                form: [],
                rank_change: 0
            }).eq('id', pr.player_id);
            if (plrUpd.error) { A.showToast(plrUpd.error.message, 'error'); return; }
        }
        A.showToast(newStatus === 'completed' ? L.ratPromotionCompleted : L.ratPromoted, 'success');
        await loadPromotions();
    }

    async function cancelPromotion(promotionId) {
        if (!confirm(L.ratConfirmCancel)) return;
        var res = await A.client.from('player_promotions').delete().eq('id', promotionId);
        if (res.error) { A.showToast(res.error.message, 'error'); return; }
        A.showToast(L.ratPromotionCancelled, 'success');
        await loadPromotions();
    }

    // Promotion action buttons (event delegation)
    document.addEventListener('click', function(e) {
        var btn = e.target.closest('.promo-promote-btn');
        if (btn) {
            createPromotion(btn.dataset.playerId, btn.dataset.fromCat, btn.dataset.toCat);
            return;
        }
        btn = e.target.closest('.promo-transition-btn');
        if (btn) {
            updatePromotionStatus(btn.dataset.promoId, 'transition');
            return;
        }
        btn = e.target.closest('.promo-complete-btn');
        if (btn) {
            if (confirm(L.ratConfirmComplete)) {
                updatePromotionStatus(btn.dataset.promoId, 'completed');
            }
            return;
        }
        btn = e.target.closest('.promo-cancel-btn');
        if (btn) {
            cancelPromotion(btn.dataset.promoId);
            return;
        }
    });

    // ---- Export to namespace ----
    A.renderSettingsSection = renderSettingsSection;

})();
