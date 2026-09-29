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
    /* Афиша живёт на сайте в двух формах: обрезанной 16:9 вверху страницы
       турнира и целой в коробе 3:4 в карточке списка. Держим обе, чтобы
       окно загрузки показывало обе, а не одну и догадку про вторую */
    var trnImageFullUrl = '';
    var trnImageFullFile = null;
    /* Положение рамки в долях исходника. Файл ею не режут — по ней можно
       будет перекадрировать ту же афишу, не заставляя искать оригинал */
    var trnImageCrop = null;
    /* Целую афишу показывают в коробе 120×160 (см. --to-thumb в
       css/tournaments-overview.css). 1200 пикселей туда не нужны, а
       трафик у нас уже за лимитом: 8.3 ГБ отдано при квоте 5 */
    var ШИРИНА_ЦЕЛОЙ = 640;
    var trnAllData = [];
    var trnSearchQuery = '';
    var trnFilterCategory = '';
    var trnFilterStatus = '';
    var trnSortCol = 'date_start';
    var trnSortAsc = false;
    var trnPage = 1;
    var TRN_PER_PAGE = 15;
    var trnDraftDirty = false;

    /* СКОЛЬКО ЗАЯВОК УЖЕ ПРИНЯТО — чтобы подсказка считала от того же, от чего
       посчитает жеребьёвка. null — ещё не знаем (новый турнир или ответ не
       пришёл), и тогда подсказка честно говорит, что считает от «макс». */
    var заявокВОснове = null;

    /* ЕДИНСТВЕННЫЙ ВХОД В РАЗДЕЛ: сперва данные, потом разметка.
       Зовёт её switchTab (layout.js). Порядок важен: список рисует фильтр
       категорий из A.cachedCategories, а тот стартует пустым
       (constants.js:3052) — отрисовка до загрузки давала фильтр без
       категорий, и это было видно, просто вторая отрисовка его чинила.
       Защиты `if (A.isDeepLinked(...)) return;` тут больше нет: она стерегла
       ту самую вторую отрисовку. На глубокой ссылке switchTab сюда не
       доходит — он уходит в loadAndEditTournament, а та грузит категории
       и уровни сама (строки 653-654). */
    async function renderTournamentsSection() {
        await A.loadCategories();
        await A.loadTournamentLevels();
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

        // Category filter options
        var catFilterHtml = '<option value="">' + L.trnAllCategories + '</option>';
        A.cachedCategories.forEach(function(c) {
            var catName = isEn ? c.name_en : c.name;
            catFilterHtml += '<option value="' + c.id + '">' + catName + '</option>';
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
                // Считаем только сыгранное: предстоящий турнир может не
                // состояться, и включать его в «всего» — обманывать себя
                L.trnStatTotal + ': <span id="adTrnStatTotal">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatRating + ': <span id="adTrnStatRating">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatFriendly + ': <span id="adTrnStatFriendly">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatUpcoming + ': <span id="adTrnStatUpcoming">...</span>' +
                '<span style="color:var(--text-dim);">|</span>' +
                L.trnStatCancelled + ': <span id="adTrnStatCancelled">...</span>' +
                // Черновики в общий счёт не идут: турнира ещё нет, его никто
                // не видел. Но и прятать совсем нельзя — про недоделанное
                // забывают, поэтому показываем отдельно и только когда есть
                '<span id="adTrnStatDraftsWrap" style="display:none;">' +
                    '<span style="color:var(--text-dim);">|</span>' +
                    L.trnStatDrafts + ': <span id="adTrnStatDrafts">0</span>' +
                '</span>' +
            '</div>' +
            '<div class="ad-trn-stats-grid">' +
                '<div class="ad-crt-stat-card ad-stat-collapsible">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">' + L.trnStatMenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMS">...</span>' +
                        '<span class="ad-stat-arrow">\u25BC</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body ad-stat-hidden" id="adTrnBodyMS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card ad-stat-collapsible">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">' + L.trnStatMenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMD">...</span>' +
                        '<span class="ad-stat-arrow">\u25BC</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body ad-stat-hidden" id="adTrnBodyMD"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card ad-stat-collapsible">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">' + L.trnStatMixedDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalMX">...</span>' +
                        '<span class="ad-stat-arrow">\u25BC</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body ad-stat-hidden" id="adTrnBodyMX"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card ad-stat-collapsible">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">' + L.trnStatWomenSingles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWS">...</span>' +
                        '<span class="ad-stat-arrow">\u25BC</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body ad-stat-hidden" id="adTrnBodyWS"></div>' +
                '</div>' +
                '<div class="ad-crt-stat-card ad-stat-collapsible">' +
                    '<div class="ad-crt-stat-header">' +
                        '<span class="ad-crt-stat-title">' + L.trnStatWomenDoubles + '</span>' +
                        '<span class="ad-crt-stat-total-num" id="adTrnTotalWD">...</span>' +
                        '<span class="ad-stat-arrow">\u25BC</span>' +
                    '</div>' +
                    '<div class="ad-crt-stat-body ad-stat-hidden" id="adTrnBodyWD"></div>' +
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

        // Карточки статистики раскрываются все разом: разряды сравнивают между
        // собой, а по одной раскрытой карточке сравнивать не с чем — соседние
        // при этом стоят пустыми и высокими
        var statCards = container.querySelectorAll('.ad-stat-collapsible');
        for (var sci = 0; sci < statCards.length; sci++) {
            statCards[sci].addEventListener('click', function() {
                var своё = this.querySelector('.ad-crt-stat-body');
                if (!своё) return;
                var раскрыть = своё.classList.contains('ad-stat-hidden');
                statCards.forEach(function(карточка) {
                    var body = карточка.querySelector('.ad-crt-stat-body');
                    var arrow = карточка.querySelector('.ad-stat-arrow');
                    if (!body) return;
                    body.classList.toggle('ad-stat-hidden', !раскрыть);
                    if (arrow) arrow.textContent = раскрыть ? '\u25B2' : '\u25BC';
                });
            });
        }

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
            .select('id,title,image,category_id,format,gender,status,date_start,date_end,max_participants,bracket_type,draw_size,published_at,registration_start,registration_end')
            .order('created_at', { ascending: false });

        var items = result.data || [];
        trnAllData = items;
        updateTournamentStats();
        applyTrnFilters();
    }

    function updateTournamentStats() {
        // «Всего» — заведённые и объявленные турниры: предстоящие плюс
        // прошедшие плюс отменённые. Черновики сюда не входят, поэтому
        // три числа справа всегда складываются в общее — расхождение
        // сразу видно и означает ошибку, а не хитрый подсчёт.
        // Раньше «Всего» брало вообще все строки, вместе с черновиками
        var upcoming = 0;
        var completed = 0;
        var cancelled = 0;
        var drafts = 0;
        trnAllData.forEach(function(t) {
            var isDraft = !t.published_at && (!t.status || t.status === 'upcoming');
            if (isDraft) { drafts++; return; }
            if (t.status === 'completed') { completed++; return; }
            if (t.status === 'cancelled') { cancelled++; return; }
            // Всё остальное ещё не сыграно: объявлен, запись открыта,
            // запись закрыта, идёт прямо сейчас
            upcoming++;
        });
        // «Всего» — сыгранные турниры. Предстоящие и отменённые стоят рядом
        // своими числами, так что ничего не теряется
        var total = completed;
        var рейтинговых = 0, дружеских = 0;
        trnAllData.forEach(function(t) {
            if (t.status !== 'completed') return;
            if (t.category_id === 'friendly') дружеских++; else рейтинговых++;
        });

        var elTotal = document.getElementById('adTrnStatTotal');
        var elUp = document.getElementById('adTrnStatUpcoming');
        var elCanc = document.getElementById('adTrnStatCancelled');
        var elDrafts = document.getElementById('adTrnStatDrafts');
        var elDraftsWrap = document.getElementById('adTrnStatDraftsWrap');
        var elRating = document.getElementById('adTrnStatRating');
        var elFriendly = document.getElementById('adTrnStatFriendly');
        if (elTotal) elTotal.textContent = total;
        if (elRating) elRating.textContent = рейтинговых;
        if (elFriendly) elFriendly.textContent = дружеских;
        if (elUp) elUp.textContent = upcoming;
        if (elCanc) elCanc.textContent = cancelled;
        if (elDrafts) elDrafts.textContent = drafts;
        if (elDraftsWrap) elDraftsWrap.style.display = drafts > 0 ? '' : 'none';

        var cards = [
            { gender: 'men', format: 'singles', totalId: 'adTrnTotalMS', bodyId: 'adTrnBodyMS' },
            { gender: 'women', format: 'singles', totalId: 'adTrnTotalWS', bodyId: 'adTrnBodyWS' },
            { gender: 'men', format: 'doubles', totalId: 'adTrnTotalMD', bodyId: 'adTrnBodyMD' },
            { gender: 'women', format: 'doubles', totalId: 'adTrnTotalWD', bodyId: 'adTrnBodyWD' },
            { gender: 'mixed', format: 'mixed_doubles', totalId: 'adTrnTotalMX', bodyId: 'adTrnBodyMX' }
        ];

        cards.forEach(function(card) {
            var filtered = trnAllData.filter(function(t) {
                return t.gender === card.gender && t.format === card.format;
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
            var catLabel = catObj ? (isEn ? catObj.name_en : catObj.name) : (t.category_id || L.noData);
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
                    '<td>' + (t.bracket_type ? '<button class="ad-btn ad-btn-sm ad-btn-secondary ad-brk-btn" data-brk-id="' + t.id + '">' + L.bracketTab + '</button>' : '') +
                        // Открыть турнир людям или убрать с глаз — решение
                        // менеджера, а не побочный итог сохранения формы
                        ' <button class="ad-btn ad-btn-sm ad-btn-secondary ad-pub-btn" data-pub-id="' + t.id + '" data-pub-on="' + (t.published_at ? '1' : '') + '" title="' +
                        (t.published_at ? (isEn ? 'Unpublish' : 'Снять с публикации')
                                        : (isEn ? 'Publish' : 'Опубликовать')) + '">' +
                        // Коротко: «Снять с публикации» распирало колонку, и таблица
                        // уезжала вбок. Полная подпись осталась подсказкой
                        (t.published_at ? (isEn ? 'Unpublish' : 'Снять')
                                        : (isEn ? 'Publish' : 'Опубликовать')) + '</button>' +
                    '</td>' +
                '</tr>';
        });

        // Click bracket button / row
        tbody.onclick = async function(e) {
            var pubBtn = e.target.closest('.ad-pub-btn');
            if (pubBtn) {
                e.stopPropagation();
                var открыт = !!pubBtn.dataset.pubOn;
                pubBtn.disabled = true;

                var данные = { published_at: открыт ? null : new Date().toISOString() };

                // При публикации состояние турнира пересчитываем по датам:
                // оно могло застрять с прошлой жеребьёвки и висеть как
                // «регистрация закрыта», хотя срок записи ещё идёт
                if (!открыт) {
                    var т = await A.client.from('tournaments')
                        .select('registration_start, registration_end, date_start, date_end, status')
                        .eq('id', pubBtn.dataset.pubId).single();
                    var д = т.data || {};
                    var неприкосновенные = ['completed', 'cancelled'];
                    if (неприкосновенные.indexOf(д.status) === -1) {
                        данные.status = A.computeTournamentStatus(
                            д.registration_start, д.registration_end, д.date_start, д.date_end);
                    }
                }

                var r = await A.client.from('tournaments')
                    .update(данные)
                    .eq('id', pubBtn.dataset.pubId);
                if (r.error) {
                    pubBtn.disabled = false;
                    A.showToast(r.error.message, 'error');
                    return;
                }
                A.showToast(открыт ? (isEn ? 'Hidden from the site' : 'Убран с сайта')
                                   : (isEn ? 'Published' : 'Опубликован'), 'success');
                loadTournamentsList();
                return;
            }
            var brkBtn = e.target.closest('.ad-brk-btn');
            if (brkBtn) {
                e.stopPropagation();
                // Кнопка называется «Сетка» — на сетку и открываем. Раньше
                // завершённый турнир уводил на «Очки», хотя жали другое
                A.renderBracketManagement(brkBtn.dataset.brkId, 'bracket');
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

    /**
     * Сколько заявок реально примет основа — читаем один раз при открытии.
     *
     * Подсказка о группах считала от «макс. участников», а жеребьёвка — от
     * длины основы. Сетка на 24, пришло 17: менеджер читал «24 → 6 групп по
     * 4», а выходило 3/3/3/3/3/2. Теперь число одно на обоих.
     */
    async function узнатьЗаявкиВОснове(item) {
        заявокВОснове = null;
        if (!item || !item.id || !A.client) return;
        var ответ = await A.client
            .from('tournament_registrations')
            .select('id', { count: 'exact', head: true })
            .eq('tournament_id', item.id)
            .eq('status', 'approved');
        if (ответ.error) return;
        заявокВОснове = ответ.count || 0;
        var пересчитать = document.getElementById('adTrnDrawHint');
        if (пересчитать && A.обновитьРаскладТурнира) A.обновитьРаскладТурнира();
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
        trnImageFile = null;
        trnImageUrl = (item && item.image) ? item.image : '';
        /* image_full появится в базе отдельным столбцом; пока его нет,
           в короб карточки кладём то же, что и в обложку */
        trnImageFullUrl = (item && item.image_full) ? item.image_full : trnImageUrl;
        trnImageFullFile = null;
        trnImageCrop = (item && item.image_crop) ? item.image_crop : null;

        var title = item ? L.editTournament : L.addTournament;

        var imagePreviewHtml = trnImageUrl
            ? afishaSplitHtml(trnImageUrl, trnImageFullUrl)
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">🖼</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = trnImageUrl ? ' has-image' : '';

        // Category options (from Supabase)
        var catOptionsHtml = '<option value="">' + L.selectCategoryTrn + '</option>';
        A.cachedCategories.forEach(function(c) {
            var selected = (item && item.category_id === c.id) ? ' selected' : '';
            var catName = isEn ? c.name_en : c.name;
            catOptionsHtml += '<option value="' + c.id + '"' + selected + '>' + catName + '</option>';
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
                    // Friendly не начисляет очки — вкладка «Результаты» ему не нужна
                    (item && A.безОчковЗаКатегорию(item.category_id) ? '' :
                    '<button class="ad-tab' + (isExisting ? '' : ' disabled') + '"' + (isExisting ? ' data-trn-nav="points"' : '') + ' ' + (isExisting ? '' : 'disabled') + '>' + L.trnTabPoints + '</button>') +
                '</div>' +
            '</div>' +

            // Image
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnImage + '</div>' +
                '<div class="ad-image-upload ad-afisha-zone' + hasImageClass + '" id="adTrnImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adTrnImgInput" style="display:none">' +
                /* ПОЛЕ ССЫЛКИ УБРАНО 28.09 — решение Кости: «афиши только
                   свои». Чужая картинка живёт на чужом сайте: её могут
                   удалить, мы её не сжимаем и не кадрируем (холст не имеет
                   права читать чужой файл), а значит из неё не сделать двух
                   представлений — миниатюры и обложки.
                   Замерено перед правкой: 44 турнира, 43 афиши наши, чужих
                   ссылок ноль. Ничего не сломали. Афиша грузится файлом —
                   нажатием на поле выше или перетаскиванием. */
            '</div>' +

            // Title (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnTitle + '</div>' +
                '<div class="ad-lang-tabs" role="tablist" aria-label="' + L.trnTitle + '">' +
                    '<button type="button" class="ad-lang-tab active" data-lang="ru" role="tab" aria-selected="true" aria-controls="adTrnTitleTabs-ru">RU</button>' +
                    '<button type="button" class="ad-lang-tab" data-lang="en" role="tab" aria-selected="false" aria-controls="adTrnTitleTabs-en">EN</button>' +
                    '<button type="button" class="ad-lang-tab" data-lang="kg" role="tab" aria-selected="false" aria-controls="adTrnTitleTabs-kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" id="adTrnTitleTabs-ru" role="tabpanel" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitle" aria-label="' + L.trnTitle + ' (RU)" placeholder="' + L.trnTitle + ' (RU)" value="' + A.esc(item ? item.title : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" id="adTrnTitleTabs-en" role="tabpanel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleEn" aria-label="' + L.trnTitle + ' (EN)" placeholder="' + L.trnTitle + ' (EN)" value="' + A.esc(item ? item.title_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" id="adTrnTitleTabs-kg" role="tabpanel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adTrnTitleKg" aria-label="' + L.trnTitle + ' (KG)" placeholder="' + L.trnTitle + ' (KG)" value="' + A.esc(item ? item.title_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adTrnTitle" data-en="adTrnTitleEn" data-kg="adTrnTitleKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Description (RU/EN/KG)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.trnDescription + '</div>' +
                '<div class="ad-lang-tabs" role="tablist" aria-label="' + L.trnDescription + '">' +
                    '<button type="button" class="ad-lang-tab active" data-lang="ru" role="tab" aria-selected="true" aria-controls="adTrnDescTabs-ru">RU</button>' +
                    '<button type="button" class="ad-lang-tab" data-lang="en" role="tab" aria-selected="false" aria-controls="adTrnDescTabs-en">EN</button>' +
                    '<button type="button" class="ad-lang-tab" data-lang="kg" role="tab" aria-selected="false" aria-controls="adTrnDescTabs-kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" id="adTrnDescTabs-ru" role="tabpanel" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDesc" aria-label="' + L.trnDescription + ' (RU)" placeholder="' + L.trnDescription + ' (RU)">' + A.esc(item ? item.description : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" id="adTrnDescTabs-en" role="tabpanel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDescEn" aria-label="' + L.trnDescription + ' (EN)" placeholder="' + L.trnDescription + ' (EN)">' + A.esc(item ? item.description_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" id="adTrnDescTabs-kg" role="tabpanel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adTrnDescKg" aria-label="' + L.trnDescription + ' (KG)" placeholder="' + L.trnDescription + ' (KG)">' + A.esc(item ? item.description_kg : '') + '</textarea>' +
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

            /* РАСКЛАДКА КАРТОЧКИ — решение Кости 28.09, его порядок:
                 1  Категория · Формат · Макс. пар/участников · Резерв мест
                 2  NTRP мин · NTRP макс · [Уровень ⊕ Общий NTRP] · Статус
                 3  Взнос КСЛТ · Взнос остальным · Призовой фонд · Пол
                 4  четыре даты — как было

               ЧЕТЫРЕ РЯДА ПО ЧЕТЫРЕ, НА ГОТОВЫХ КЛАССАХ. Здесь стояли
               четыре инлайн-сетки с зашитыми repeat(N,1fr) и gap:12, при
               том что .ad-field-row-3 и -4 в admin.css:1204,1208 уже есть.
               Беда была не косметическая: медиа-правило admin.css:2132
               знает только классы, и на узком виде инлайн-ряды НЕ
               схлопывались — оставались четыре колонки по 270.

               ВЗАИМОИСКЛЮЧАЮЩИЕ ПОЛЯ СТОЯТ РЯДОМ И ДЕЛЯТ ОДНУ ЯЧЕЙКУ.
               Замер 28.09 (toggleFormatDependentFields ниже):
                 одиночный — Уровень есть, Общий NTRP нет;
                 парный и микст — наоборот.
               Вместе они не видны НИКОГДА, а скрытое поле выпадает из
               сетки, и соседнее занимает его место. Так дыра, которую
               Костя увидел справа в первом ряду, исчезает, а не прячется.
               «Пол» так же: скрыт только в миксте — тогда третий ряд
               показывает три поля, ровно как Костя и нарисовал. */

            // Ряд 1: что за турнир и на сколько человек
            '<div class="ad-form-card">' +
                '<div class="ad-field-row ad-field-row-4">' +
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
                        '<label class="ad-field-label" id="adTrnMaxPartLabel">' + L.trnMaxParticipants + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnMaxPart" placeholder="0" value="' + (item ? (item.max_participants || '') : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnReservedSpots + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnReservedSpots" placeholder="0" value="' + (item ? (item.reserved_spots || '') : '') + '">' +
                    '</div>' +
                '</div>' +

                // Ряд 2: уровень игры и состояние записи
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnNtrpMin + '</label>' +
                        '<select class="ad-field-input" id="adTrnNtrpMin">' + A.ntrpOptions(item && item.ntrp_min) + '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnNtrpMax + '</label>' +
                        '<select class="ad-field-input" id="adTrnNtrpMax">' + A.ntrpOptions(item && item.ntrp_max) + '</select>' +
                    '</div>' +
                    // Одна ячейка на двоих: вместе они не видны никогда
                    '<div class="ad-field" id="adTrnLevelWrap">' +
                        '<label class="ad-field-label">' + L.ratTournamentLevel + '</label>' +
                        '<select class="ad-field-input" id="adTrnLevel">' + trnLevelOptionsHtml + '</select>' +
                    '</div>' +
                    '<div class="ad-field" id="adTrnNtrpCombinedWrap">' +
                        '<label class="ad-field-label">' + L.trnNtrpCombinedMax + '</label>' +
                        '<select class="ad-field-input" id="adTrnNtrpCombinedMax">' + A.ntrpOptions(item && item.ntrp_combined_max, { min: 2.0, max: 14.0 }) + '</select>' +
                        '<div class="ad-field-hint">' + L.trnNtrpHint + '</div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnStatus + '</label>' +
                        '<div class="ad-field-input ad-trn-status-field" id="adTrnStatusBadge" data-status-class="' + trnStatusBadgeClass + '">' + trnStatusBadgeLabel + '</div>' +
                    '</div>' +
                '</div>' +

                /* Ряд 3: деньги и состав. Две суммы взноса: членам КСЛТ
                   дешевле. Не заполнил — на сайте про деньги не пишем
                   вовсе, как и с призовым фондом. Для парных и смешанных
                   сумма считается с пары */
                '<div class="ad-field-row ad-field-row-4">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnFeeMember + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnFeeMember" placeholder="0" value="' + (item ? (item.fee_member != null ? item.fee_member : '') : '') + '">' +
                        '<div class="ad-field-hint" id="adTrnFeeHintMember"></div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnFeeGuest + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnFeeGuest" placeholder="0" value="' + (item ? (item.fee_guest != null ? item.fee_guest : '') : '') + '">' +
                        '<div class="ad-field-hint" id="adTrnFeeHintGuest"></div>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnPrizeFund + '</label>' +
                        '<input type="text" class="ad-field-input" id="adTrnPrize" placeholder="100,000 сом" value="' + A.esc(item ? item.prize_fund : '') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.trnGender + '</label>' +
                        '<select class="ad-field-input" id="adTrnGender">' +
                            '<option value="">—</option>' +
                            '<option value="men"' + A.sel(item, 'gender', 'men') + '>' + L.genderMen + '</option>' +
                            '<option value="women"' + A.sel(item, 'gender', 'women') + '>' + L.genderWomen + '</option>' +
                            // Микст: поле скрыто и заполняется само, но пункт нужен —
                            // без него присвоение value = 'mixed' молча не срабатывает
                            '<option value="mixed"' + A.sel(item, 'gender', 'mixed') + ' hidden>' + L.genderMixed + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +

                // Ряд 4: сроки — как было
                '<div class="ad-field-row ad-field-row-4">' +
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
                /* ШИРИНА ПОЛЯ — СВОЙСТВО СОДЕРЖИМОГО. Замер 28.09: «Корты»
                   нужно 42, «В группе» 56, а жёсткая сетка давала всем 267;
                   «Тип сетки» стоял в 549 под слово «Групповая».
                   Ряд идёт потоком, поля встают по своей ступени и
                   переносятся сами — дыр в конце ряда некому оставить.
                   Ступени заведены в компоненте (admin.css, .ad-pole-*) и
                   посчитаны от самой длинной ПОДПИСИ каждого рода: значение
                   «2» занимает 10 пикселей, а «ВЫХОДЯТ ИЗ ГРУППЫ» — 121.
                   РЯДОВ ТРИ — решение Кости 28.09: настройки сетки, потом
                   расписание матча, потом подписи протокола. «Корты» уехали
                   во второй ряд: корт — это про то, где играют матчи, а не
                   про то, как устроена сетка. */
                '<div class="ad-field-row ad-field-flow">' +
                    '<div class="ad-field ad-pole-srednee" id="adTrnBracketTypeWrap">' +
                        '<label class="ad-field-label">' + L.trnBracketType + '</label>' +
                        '<select class="ad-field-input" id="adTrnBracketType">' +
                            '<option value="">' + L.selectBracketType + '</option>' +
                            '<option value="single_elimination"' + A.sel(item, 'bracket_type', 'single_elimination') + '>' + L.bracketSE + '</option>' +
                            '<option value="fic"' + A.sel(item, 'bracket_type', 'fic') + '>' + L.bracketFIC + '</option>' +
                            '<option value="round_robin"' + A.sel(item, 'bracket_type', 'round_robin') + '>' + L.bracketRR + '</option>' +
                            '<option value="group_league"' + A.sel(item, 'bracket_type', 'group_league') + '>' + L.bracketGL + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field ad-pole-srednee" id="adTrnDrawSizeWrap">' +
                        '<label class="ad-field-label">' + L.trnDrawSize + '</label>' +
                        '<select class="ad-field-input" id="adTrnDrawSize">' +
                            '<option value="">' + L.selectDrawSize + '</option>' +
                            '<option value="8"' + (item && +item.draw_size === 8 ? ' selected' : '') + '>8</option>' +
                            '<option value="16"' + (item && +item.draw_size === 16 ? ' selected' : '') + '>16</option>' +
                            '<option value="32"' + (item && +item.draw_size === 32 ? ' selected' : '') + '>32</option>' +
                            '<option value="64"' + (item && +item.draw_size === 64 ? ' selected' : '') + '>64</option>' +
                            '<option value="128"' + (item && +item.draw_size === 128 ? ' selected' : '') + '>128</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field ad-pole-uzkoe" id="adTrnGroupCountWrap">' +
                        '<label class="ad-field-label">' + L.trnGroupCount + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnGroupCount" placeholder="2" value="' + (item && item.group_count ? item.group_count : '') + '">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-uzkoe" id="adTrnPerGroupWrap">' +
                        '<label class="ad-field-label">' + L.trnPerGroup + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnPerGroup" placeholder="4">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-uzkoe" id="adTrnQualifiersWrap">' +
                        '<label class="ad-field-label">' + L.trnQualifiers + '</label>' +
                        '<input type="text" inputmode="numeric" autocomplete="off" class="ad-field-input" id="adTrnQualifiers" placeholder="2" value="' + (item && item.qualifiers_per_group ? item.qualifiers_per_group : '2') + '">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-srednee" id="adTrnPlayoffWrap">' +
                        '<label class="ad-field-label">' + L.trnPlayoffFormat + '</label>' +
                        '<select class="ad-field-input" id="adTrnPlayoffFormat">' +
                            '<option value="ig"' + A.sel(item, 'playoff_format', 'ig') + '>' + L.playoffIg + '</option>' +
                            '<option value="direct"' + A.sel(item, 'playoff_format', 'direct') + '>' + L.playoffDirectShort + '</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                // Расклад прямо под настройками: сколько выйдет, какая сетка,
                // сколько мест придётся доигрывать. Иначе менеджер узнаёт об
                // этом только в день турнира, когда менять уже поздно
                '<div id="adTrnDrawHint" class="ad-sched-note ad-sched-note-wide"></div>' +
                // Формат сета, длительность и время начала — одним рядом:
                // порознь они занимали две строки, а вместе читаются как одна
                // настройка расписания
                '<div class="ad-field-row ad-field-flow">' +
                    '<div class="ad-field ad-pole-uzkoe">' +
                        '<label class="ad-field-label">' + L.trnCourtCount + '</label>' +
                        '<input type="number" class="ad-field-input" id="adTrnCourtCount" min="1" max="10" value="' + (item ? (item.court_count || 2) : 2) + '">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-srednee">' +
                        '<label class="ad-field-label">' + L.trnSetFormat + '</label>' +
                        '<select class="ad-field-input" id="adTrnSetFormat">' +
                            '<option value="standard"' + A.sel(item, 'set_format', 'standard') + '>' + L.formatStandard + '</option>' +
                            '<option value="short"' + A.sel(item, 'set_format', 'short') + '>' + L.formatShort + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field ad-pole-uzkoe">' +
                        '<label class="ad-field-label">' + L.trnMatchDuration + '</label>' +
                        '<input type="text" inputmode="numeric" class="ad-field-input" id="adTrnMatchDuration" placeholder="90" value="' + (item ? (item.match_duration || 90) : 90) + '">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-uzkoe">' +
                        '<label class="ad-field-label">' + L.trnStartTime + '</label>' +
                        '<input type="time" class="ad-field-input" id="adTrnStartTime" value="' + (item && item.start_time ? item.start_time.slice(0, 5) : '09:00') + '">' +
                    '</div>' +
                '</div>' +

                // Кто подписывает протокол — последней настройкой: это не
                // про игру, а про бумагу. Заполнили — имена печатаются под
                // линией подписи; пусто — линия останется для ручки
                /* Имена людей длиннее номера корта, поэтому каждое поле
                   занимает две ячейки: ширина остаётся прежней, а колонка
                   формы не ломается */
                '<div class="ad-field-row ad-field-flow">' +
                    '<div class="ad-field ad-pole-shirokoe">' +
                        '<label class="ad-field-label">' + L.trnDirector + '</label>' +
                        '<input type="text" class="ad-field-input" id="adTrnDirector" placeholder="' +
                            L.trnSignHint + '" value="' + A.esc((item && item.director_name) || '') + '">' +
                    '</div>' +
                    '<div class="ad-field ad-pole-shirokoe">' +
                        '<label class="ad-field-label">' + L.trnReferee + '</label>' +
                        '<input type="text" class="ad-field-input" id="adTrnReferee" placeholder="' +
                            L.trnSignHint + '" value="' + A.esc((item && item.referee_name) || '') + '">' +
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

        /* Кнопки перевода гаснут там, где переводить нечего. Иначе после
           сохранения форма отрисовывается заново и все кнопки горят, будто
           переводов нет */
        if (A.settleTranslateButtons) A.settleTranslateButtons(container);

        /* Тот же сторож — для ухода в другой раздел левого меню.
           Вопрос и три ответа одни и те же, поэтому и окно одно */
        A.стеречьЧерновик(
            function() { return trnDraftDirty; },
            function(уйти) {
                A.showConfirm(L.unsavedChanges, L.unsavedChangesText,
                    function() { return saveTournamentHandler(уйти); },
                    L.unsavedSaveBtn,
                    null,
                    { label: L.unsavedLeaveBtn, action: function() { trnDraftDirty = false; уйти(); } });
            }
        );

        // Back (with unsaved changes protection)
        document.getElementById('adTrnBack').addEventListener('click', function() {
            if (trnDraftDirty) {
                var кСписку = function() {
                    trnDraftDirty = false;
                    A.setAdminHash('tournaments');
                    renderTournamentsList();
                };
                /* Выбор тут тройной, а не двоичный: сохранить, уйти без
                   сохранения, остаться. Главная кнопка — сохранить:
                   она не теряет работу */
                A.showConfirm(L.unsavedChanges, L.unsavedChangesText,
                    function() { return saveTournamentHandler(кСписку); },
                    L.unsavedSaveBtn,
                    null,
                    { label: L.unsavedLeaveBtn, action: кСписку });
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
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) {
                var выбрана = t.dataset.lang === lang;
                t.classList.toggle('active', выбрана);
                /* Диктору цвет плашки ничего не говорит: выбранную вкладку
                   он узнаёт только по aria-selected */
                t.setAttribute('aria-selected', выбрана ? 'true' : 'false');
            });
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
            trnVenueTimer = setTimeout(function() {
                searchTrnVenue(q);
            }, 200);
        });

        trnVenueSearchInput.addEventListener('focus', function() {
            searchTrnVenue(trnVenueSearchInput.value.trim());
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

        matchDurInput.addEventListener('wheel', function(e) { e.preventDefault(); });
        matchDurInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp' || e.key === 'ArrowDown') e.preventDefault();
        });

        // Group count — only digits. Пересчёт числа в группе висит ниже, на
        // том же событии: держим их порознь, чтобы порядок был очевиден
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
            var pgWrap = document.getElementById('adTrnPerGroupWrap');
            var qWrap = document.getElementById('adTrnQualifiersWrap');
            var poWrap = document.getElementById('adTrnPlayoffWrap');
            if (bt === 'round_robin') {
                dsWrap.style.display = 'none';
                gcWrap.style.display = '';
                if (pgWrap) pgWrap.style.display = '';
                qWrap.style.display = '';
                // Что делать со свободными местами — вопрос только для плей-офф.
                // В «Группы + Лиги» выбора нет: там играют все
                if (poWrap) poWrap.style.display = '';
            } else if (bt === 'group_league') {
                if (poWrap) poWrap.style.display = 'none';
                dsWrap.style.display = 'none';
                gcWrap.style.display = '';
                if (pgWrap) pgWrap.style.display = '';
                qWrap.style.display = '';
            } else {
                if (poWrap) poWrap.style.display = 'none';
                dsWrap.style.display = '';
                gcWrap.style.display = 'none';
                if (pgWrap) pgWrap.style.display = 'none';
                qWrap.style.display = 'none';
            }
        }
        /**
         * Расклад турнира словами: сколько выйдет из групп, какая будет сетка
         * и сколько мест придётся доигрывать.
         *
         * Считаем по тем же правилам, что и жеребьёвка, — чтобы менеджер видел
         * последствия настройки сразу, а не в день турнира.
         */
function обновитьРасклад() {
            var подсказка = document.getElementById('adTrnDrawHint');
            if (!подсказка) return;

            var тип = document.getElementById('adTrnBracketType').value;
            var групп = parseInt(document.getElementById('adTrnGroupCount').value, 10) || 0;
            var выходят = parseInt(document.getElementById('adTrnQualifiers').value, 10) || 0;
            var мест = parseInt((document.getElementById('adTrnMaxPart') || {}).value, 10) || 0;

            if (тип !== 'round_robin' && тип !== 'group_league') {
                подсказка.style.display = 'none';
                return;
            }

            /* ОТ ЧЕГО СЧИТАЕМ — И ПОДСКАЗКА ГОВОРИТ ЭТО ВСЛУХ.
               До 29.09 подсказка считала от «макс. участников», а жеребьёвка —
               от факта: сетка на 24, пришло 17, менеджер читал «24 → 6 групп
               по 4», а выходило 3/3/3/3/3/2, и узнавал он об этом в день
               турнира. Теперь: есть принятые заявки — считаем по ним и так и
               пишем; нет — от «макс», и подсказка предупреждает, что это не
               окончательно. */
            var отФакта = (заявокВОснове !== null && заявокВОснове > 0);
            var участников = отФакта ? заявокВОснове : мест;

            var показать = function (строки) {
                подсказка.style.display = '';
                подсказка.innerHTML = строки.map(function (с) {
                    return '<div>' + A.esc(с) + '</div>';
                }).join('');
            };

            /* СУДЬЯ ТОТ ЖЕ, ЧТО У ЖЕРЕБЬЁВКИ. Раньше форма не проверяла
               ничего, и настройка выглядела годной до самого дня турнира. */
            var беда = KSLT_RULES.бедаНастройкиГрупп(
                групп || null, выходят || null, участников);
            if (беда === 'групп_пусто' || беда === 'выходят_пусто') {
                подсказка.style.display = 'none';
                return;
            }

            var строки = [отФакта
                ? L.hintFromFact.replace('{n}', заявокВОснове)
                : L.hintFromMax];

            if (беда) {
                var размеры = KSLT_RULES.размерыГрупп(участников, групп).join('/');
                строки.push(беда === 'мало_участников'
                    ? (isEn ? 'Not enough players: ' + участников + ' for ' + групп + ' groups'
                            : 'Участников мало: ' + участников + ' на ' + групп + ' групп')
                    : (isEn ? 'Check the settings' : 'Проверьте настройку') +
                      (размеры ? ': ' + размеры : ''));
                показать(строки);
                return;
            }

            var проГруппы = подсказкаОГруппах(участников);
            if (проГруппы) строки.push(проГруппы);

            if (KSLT_RULES.предупреждениеОГруппах(групп, выходят, участников)) {
                строки.push(L.hintSeedsNothing
                    .replace('{sizes}', KSLT_RULES.размерыГрупп(участников, групп).join('/'))
                    .replace('{q}', выходят));
            }

            var вышло = групп * выходят;

            if (тип === 'group_league') {
                строки.push(L.hintLeagues.replace('{pl}', вышло));
                показать(строки);
                return;
            }

            var сетка = 2;
            while (сетка < вышло) сетка *= 2;
            var свободно = сетка - вышло;
            строки.push(L.hintDraw.replace('{out}', вышло).replace('{size}', сетка));

            /* ОДНО ОПРЕДЕЛЕНИЕ. Формула стояла здесь и в раскладСлотов
               (bracket.js), строки одинаковые до символа: поправил бы одну —
               вторая показала бы менеджеру не то, что построит сетка. */
            var формат = document.getElementById('adTrnPlayoffFormat').value;
            var расклад = KSLT_RULES.раскладСвободных(групп, свободно, формат);

            if (!свободно) {
                строки.push(L.hintNoExtra);
            } else {
                if (расклад.матчей > 0) {
                    строки.push(L.hintFreeExtra
                        .replace('{free}', свободно).replace('{games}', расклад.матчей));
                } else if (расклад.безИгры > 0) {
                    строки.push(L.hintFreeBye.replace('{free}', расклад.безИгры));
                }
                /* Клетки, которые некем закрыть. До 29.09 их не считал никто:
                   код создавал метку Q на каждое свободное место, даже когда
                   претендентов меньше, и клетка ждала несуществующего. */
                if (расклад.проходом > 0) {
                    строки.push(L.hintByes.replace('{bye}', расклад.проходом));
                }
            }

            var лучше = лучшийРасклад(участников, выходят, групп);
            if (лучше && лучше.групп !== групп) {
                строки.push(L.hintBetter
                    .replace('{groups}', лучше.групп)
                    .replace('{per}', лучше.вГруппе)
                    .replace('{size}', лучше.сетка));
            }

            показать(строки);
        }

        /**
         * Ближайший расклад без пустых клеток — если он вообще есть.
         *
         * Менеджер выбирает число групп вслепую: что 5 групп по 4 дадут шесть
         * клеток без игры, а 4 по 5 — ни одной, видно только после подсчёта.
         * Считаем за него: берём числа групп, при которых группы РОВНЫЕ, отсев
         * есть, и «групп × выходят» ложится на степень двойки. Называем то,
         * что ближе к набранному, — менеджер обычно уже примерно знает, чего
         * хочет, и уводить его далеко незачем.
         */
        function лучшийРасклад(участников, выходят, текущих) {
            if (!участников || !выходят) return null;
            var годные = [];
            for (var г = 2; г <= Math.floor(участников / 2); г++) {
                if (участников % г !== 0) continue;
                var вГруппе = участников / г;
                if (вГруппе <= выходят) continue;
                var вышло = г * выходят;
                var с = 2; while (с < вышло) с *= 2;
                if (с !== вышло) continue;
                годные.push({ групп: г, вГруппе: вГруппе, сетка: с });
            }
            if (!годные.length) return null;
            годные.sort(function (a, b) {
                return Math.abs(a.групп - текущих) - Math.abs(b.групп - текущих);
            });
            return годные[0];
        }

        /**
         * Группы и число игроков в группе — две стороны одного счёта.
         *
         * Менеджер знает что-то одно: либо «делаем шесть групп», либо «по
         * четыре в группе». Раньше второе приходилось делить в уме, а ошибка
         * всплывала только в день жеребьёвки. Теперь заполняешь любое поле —
         * второе считается само, от числа мест в турнире.
         *
         * Делится обычно неровно, и это нормально: лишние идут по одному в
         * первые группы. Подсказка говорит об этом прямо.
         */
        function пересчитатьГруппы(откуда) {
            var полеГрупп = document.getElementById('adTrnGroupCount');
            var полеВГруппе = document.getElementById('adTrnPerGroup');
            var полеМест = document.getElementById('adTrnMaxPart');
            if (!полеГрупп || !полеВГруппе) return;

            var мест = parseInt(полеМест && полеМест.value, 10) || 0;
            if (!мест) return;

            if (откуда === 'групп') {
                var групп = parseInt(полеГрупп.value, 10) || 0;
                полеВГруппе.value = групп > 0 ? Math.ceil(мест / групп) : '';
                return;
            }

            var вГруппе = parseInt(полеВГруппе.value, 10) || 0;
            if (вГруппе < 1) { полеГрупп.value = ''; return; }

            // Сколько групп нужно, чтобы все поместились по столько в каждой
            var надоГрупп = Math.ceil(мест / вГруппе);
            полеГрупп.value = надоГрупп;

            // И сразу обратная сверка: при 24 местах и 6 группах в группе
            // выходит ровно 4 — значения должны сходиться между собой, иначе
            // человек видит одно, а жеребьёвка считает другое
            var сошлось = Math.ceil(мест / надоГрупп);
            if (сошлось !== вГруппе) полеВГруппе.value = сошлось;
        }

        /** «24 → 6 групп по 4» или «24 → 5 групп: по 5, и одна по 4». */
        function подсказкаОГруппах(мест) {
            var групп = parseInt((document.getElementById('adTrnGroupCount') || {}).value, 10) || 0;
            if (!мест || groups_негодны(групп, мест)) return '';

            var базово = Math.floor(мест / групп);
            var остаток = мест % групп;
            if (!остаток) {
                return L.hintGroupsEven
                    .replace('{max}', мест).replace('{groups}', групп).replace('{per}', базово);
            }
            return L.hintGroupsOdd
                .replace('{max}', мест)
                .replace('{groups}', групп)
                .replace('{per}', базово + 1)
                .replace('{rest}', групп - остаток)
                .replace('{less}', базово);
        }

        function groups_негодны(групп, мест) {
            return групп < 2 || групп > мест;
        }

        /* Подсказку зовёт и чтение заявок, когда ответ придёт: считать её
           заново из другой области видимости иначе нечем. */
        A.обновитьРаскладТурнира = обновитьРасклад;
        узнатьЗаявкиВОснове(item);

        document.getElementById('adTrnBracketType').addEventListener('change', function() {
            toggleBracketFields();
            обновитьРасклад();
        });
        ['adTrnGroupCount', 'adTrnQualifiers', 'adTrnPlayoffFormat'].forEach(function(id) {
            var поле = document.getElementById(id);
            if (поле) поле.addEventListener('input', обновитьРасклад);
            if (поле) поле.addEventListener('change', обновитьРасклад);
        });

        // Взаимный пересчёт: заполняешь одно — второе подстраивается
        var полеГруппСчёт = document.getElementById('adTrnGroupCount');
        var полеВГруппеСчёт = document.getElementById('adTrnPerGroup');
        if (полеГруппСчёт) полеГруппСчёт.addEventListener('input', function() {
            пересчитатьГруппы('групп'); обновитьРасклад();
        });
        if (полеВГруппеСчёт) {
            полеВГруппеСчёт.addEventListener('input', function() {
                this.value = this.value.replace(/[^0-9]/g, '');
                пересчитатьГруппы('вГруппе'); обновитьРасклад();
            });
            полеВГруппеСчёт.addEventListener('wheel', function(e) { e.preventDefault(); });
        }
        // Изменили вместимость турнира — счёт в группе меняется вместе с ней
        var полеМестСчёт = document.getElementById('adTrnMaxPart');
        if (полеМестСчёт) полеМестСчёт.addEventListener('input', function() {
            пересчитатьГруппы('групп'); обновитьРасклад();
        });

        toggleBracketFields();
        пересчитатьГруппы('групп');
        обновитьРасклад();

        // Toggle combined NTRP max based on format (doubles/mixed only)
        // + auto-hide Gender when Mixed Doubles (gender = 'mixed' auto)
        /* Одно определение на одно понятие. Проверка стояла дважды: здесь
           и на вкладке «Результаты» (её не рисуют дружескому турниру) —
           поймано прувером заморозки 28.09. Источника два: значение поля
           в форме и категория записи из базы, поэтому решает одна функция,
           а зовут её с разным доводом */
        function дружескийТурнир() {
            var поле = document.getElementById('adTrnCat');
            return A.безОчковЗаКатегорию(поле ? поле.value : '');
        }

        function toggleFormatDependentFields() {
            var fmt = document.getElementById('adTrnFormat').value;
            var isDbl = fmt === 'doubles' || fmt === 'mixed_doubles';

            var wrap = document.getElementById('adTrnNtrpCombinedWrap');
            if (wrap) wrap.style.display = isDbl ? '' : 'none';

            /* УРОВЕНЬ ТУРНИРА ЗАДАЁТ ТАБЛИЦУ ОЧКОВ, и показывается только там,
               где очки вообще начисляются. Не начисляются в двух случаях:
                 • парные и микст — очков не дают вовсе;
                 • категория «Friendly Weekend» — дружеский турнир.
               Решение Кости 28.09: «там friendly значит без рейтинга идёт,
               уровень убрать или неактивным сделать, чтобы случайно не
               нажали и очки им не начислились».
               Поле не просто прячется — ЗНАЧЕНИЕ СБРАСЫВАЕТСЯ. Спрятанное
               поле с уровнем внутри уехало бы в базу, и турнир начислил бы
               очки, которых не должен. */
            var lvlWrap = document.getElementById('adTrnLevelWrap');
            var lvlField = document.getElementById('adTrnLevel');
            var безОчков = isDbl || дружескийТурнир();
            if (lvlWrap) lvlWrap.style.display = безОчков ? 'none' : '';
            if (безОчков && lvlField) lvlField.value = '';

            // Update max participants label: "Макс. участников" ↔ "Макс. пар"
            var maxPartLabel = document.getElementById('adTrnMaxPartLabel');
            if (maxPartLabel) maxPartLabel.textContent = (fmt === 'doubles' || fmt === 'mixed_doubles') ? L.trnMaxPairs : L.trnMaxParticipants;

            // Взнос за парный турнир берут с пары, за одиночный — с игрока
            syncFeeHints();

            var genderField = document.getElementById('adTrnGender');
            var genderWrap = genderField ? genderField.closest('.ad-field') : null;
            if (genderWrap) {
                if (fmt === 'mixed_doubles') {
                    genderWrap.style.display = 'none';
                    genderField.value = 'mixed';
                } else {
                    genderWrap.style.display = '';
                    if (genderField.value === 'mixed') genderField.value = '';
                }
            }
        }
        document.getElementById('adTrnFormat').addEventListener('change', toggleFormatDependentFields);
        // Смена категории меняет то же самое: friendly убирает уровень
        document.getElementById('adTrnCat').addEventListener('change', toggleFormatDependentFields);
        toggleFormatDependentFields();

        // Image upload zone
        var imgZone = document.getElementById('adTrnImgZone');
        var imgInput = document.getElementById('adTrnImgInput');

        /* Выбор файла открывает только тот короб, на котором это написано.
           Раньше нажатие в любое место раздела — хоть по подписи, хоть по
           пустоте — открывало окно замены: нажать было некуда */
        imgZone.addEventListener('click', function(e) {
            if (!e.target.closest('.ad-afisha-drop, .ad-image-upload-placeholder')) return;
            imgInput.click();
        });

        // Афишу кадрируем так же, как обложку новости: рисуют их какими
        // угодно, а в карточке турнира нужна одна пропорция. Менеджер сам
        // двигает и приближает картинку и видит, что попадёт на сайт
        async function выбратьАфишу(file) {
            var обрезанная = null;
            /* Окно кадрирования отдаёт null и когда отменили, и когда
               библиотека не подключилась. Различаем здесь: отмена — это
               отказ от выбора целиком. Раньше закрытие окна молча
               подменяло афишу необрезанным оригиналом, и он же уезжал
               в базу по «Сохранить» */
            var имя = (file.name || 'poster').replace(/\.\w+$/, '');
            if (A.cropCover && typeof Cropper !== 'undefined') {
                var итог = await A.cropCover(file, { сРамкой: true });
                обрезанная = итог && итог.blob;
                if (!обрезанная) {
                    imgInput.value = '';
                    return;
                }
                trnImageCrop = итог.рамка;
                trnImageFile = new File([обрезанная], имя + '.jpg', { type: 'image/jpeg' });
            } else {
                trnImageCrop = null;
                trnImageFile = file;
            }
            /* Целая афиша уезжает отдельным файлом и заметно меньше: её
               короб на сайте — 120 пикселей шириной */
            trnImageFullFile = file;
            if (A.compressImage) {
                try {
                    var м = await A.compressImage(file, ШИРИНА_ЦЕЛОЙ, 0.85);
                    trnImageFullFile = new File([м.blob], имя + '-full.jpg', { type: 'image/jpeg' });
                } catch (e) {
                    // холст не справился — грузим как есть
                }
            }
            trnImageFullUrl = URL.createObjectURL(trnImageFullFile);
            previewTrnImage(URL.createObjectURL(trnImageFile), trnImageFullUrl);
        }

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) выбратьАфишу(imgInput.files[0]);
        });

        // Drag & drop
        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                imgInput.files = e.dataTransfer.files;
                выбратьАфишу(e.dataTransfer.files[0]);
            }
        });

        // Remove image
        setupTrnImgRemove();

        // URL apply
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

                function уйти() {
                    trnDraftDirty = false;
                    if (nav === 'regs') A.renderBracketManagement(trnEditingId, 'registrations');
                    else if (nav === 'bracket') A.renderBracketManagement(trnEditingId, 'bracket');
                    else if (nav === 'schedule') A.renderBracketManagement(trnEditingId, 'schedule');
                    else if (nav === 'points') A.renderBracketManagement(trnEditingId, 'results');
                }

                // Несохранённое стережём и здесь: вкладки турнира — такой же
                // уход со страницы, как кнопка «Назад к списку»
                if (trnDraftDirty) {
                    A.showConfirm(L.unsavedChanges, L.unsavedChangesText,
                        function() { return saveTournamentHandler(уйти); },
                        L.unsavedSaveBtn,
                        null,
                        { label: L.unsavedLeaveBtn, action: уйти });
                    return;
                }
                уйти();
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

        // АВТОСОХРАНЕНИЯ БОЛЬШЕ НЕТ — решение Кости 28.09: «давай уберём
        // автосохранение, и при уходе со страницы будет окно-предупреждение,
        // что что-то не было сохранено».
        //
        // Почему это правильно: одно и то же действие вело себя двумя
        // способами. Кнопка «Сохранить» спрашивала подтверждение, а форма
        // через три секунды после любого ввода писала в базу молча — и
        // менеджер не мог ни передумать, ни понять, что уже сохранено.
        // Теперь в базу пишет только кнопка, а несохранённое стережёт
        // предупреждение.
        trnDraftDirty = false;
        container.addEventListener('input', function(e) {
            if (!e.target.closest('.ad-form-card, .ad-field')) return;
            trnDraftDirty = true;
        });

        // Уход со страницы браузером: закрытие вкладки, обновление, адрес.
        // Своё окно тут показать нельзя — браузер показывает своё, и только
        // если на странице есть несохранённое
        if (!window._кслтСторожЧерновика) {
            window._кслтСторожЧерновика = true;
            window.addEventListener('beforeunload', function(e) {
                if (!trnDraftDirty) return;
                e.preventDefault();
                e.returnValue = '';
            });
        }
    }

    /* Два представления одной афиши рядом, каждое в своей настоящей
       пропорции. Превью, которое врёт про форму, хуже, чем его отсутствие:
       менеджер кадрирует вслепую и узнаёт о срезанной надписи с сайта */
    function afishaSplitHtml(cropSrc, fullSrc) {
        return '<div class="ad-afisha-split">' +
                   '<figure class="ad-afisha-pane ad-afisha-pane--crop">' +
                       '<img src="' + A.esc(cropSrc) + '" class="ad-afisha-img" id="adTrnImgPreview" alt="">' +
                       /* Кнопка снятия сидит на самой афише, а не в углу окна:
                          рядом с коробом загрузки её читали бы как «закрыть
                          загрузку» */
                       '<button type="button" class="ad-image-upload-remove" id="adTrnImgRemove">&times;</button>' +
                       '<figcaption class="ad-afisha-cap">' + L.trnImgCapPage + '</figcaption>' +
                   '</figure>' +
                   '<figure class="ad-afisha-pane ad-afisha-pane--thumb">' +
                       '<img src="' + A.esc(fullSrc || cropSrc) + '" class="ad-afisha-img" id="adTrnImgPreviewFull" alt="">' +
                       '<figcaption class="ad-afisha-cap">' + L.trnImgCapCard + '</figcaption>' +
                   '</figure>' +
                   /* Своей кнопки у него нет: нажатие всплывает в окно, где
                      уже висит открытие выбора файла — одно определение на
                      одно понятие. Кнопка здесь ради клавиатуры и ради того,
                      чтобы замена афиши была видна, а не угадывалась */
                   '<button type="button" class="ad-afisha-drop" id="adTrnImgReplace">' +
                       '<span class="ad-image-upload-icon">\uD83D\uDDBC</span>' +
                       '<span>' + L.trnImgReplace + '</span>' +
                       '<span class="ad-field-hint">' + L.uploadHint + '</span>' +
                   '</button>' +
               '</div>';
    }

    function previewTrnImage(cropSrc, fullSrc) {
        var zone = document.getElementById('adTrnImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML = afishaSplitHtml(cropSrc, fullSrc);
        setupTrnImgRemove();
    }

    function setupTrnImgRemove() {
        var rmBtn = document.getElementById('adTrnImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                trnImageFile = null;
                trnImageUrl = '';
                trnImageFullUrl = '';
                trnImageFullFile = null;
                trnImageCrop = null;
                var zone = document.getElementById('adTrnImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">🖼</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';

                document.getElementById('adTrnImgInput').value = '';
            });
        }
    }

    /** Взнос: пусто — значит не задан, а не ноль. Ноль тоже смысл имеет: бесплатно */
    function feeValue(id) {
        var el = document.getElementById(id);
        if (!el) return null;
        var raw = el.value.replace(/[^\d.]/g, '').trim();
        if (!raw) return null;
        var num = parseFloat(raw);
        return isNaN(num) ? null : num;
    }

    /** Подпись под полями взноса: с пары или с игрока — зависит от формата */
    function syncFeeHints() {
        var fmt = document.getElementById('adTrnFormat');
        var pair = fmt && (fmt.value === 'doubles' || fmt.value === 'mixed_doubles');
        var hint = pair ? L.trnFeeHintPair : L.trnFeeHintPlayer;
        ['adTrnFeeHintMember', 'adTrnFeeHintGuest'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.textContent = hint;
        });
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
            reserved_spots: parseInt(document.getElementById('adTrnReservedSpots').value, 10) || 0,
            prize_fund: document.getElementById('adTrnPrize').value.trim() || null,
            fee_member: feeValue('adTrnFeeMember'),
            fee_guest: feeValue('adTrnFeeGuest'),
            image: trnImageUrl || null,
            image_full: trnImageFullUrl || null,
            image_crop: trnImageCrop || null,
            format: document.getElementById('adTrnFormat').value || 'singles',
            level_id: document.getElementById('adTrnLevel').value || null,
            bracket_type: document.getElementById('adTrnBracketType').value || null,
            playoff_format: document.getElementById('adTrnBracketType').value === 'round_robin'
                ? (document.getElementById('adTrnPlayoffFormat').value || 'ig') : null,
            draw_size: (function() { var v = document.getElementById('adTrnDrawSize').value; return v ? parseInt(v, 10) : null; })(),
            group_count: (function() { var v = document.getElementById('adTrnGroupCount').value; return v ? parseInt(v, 10) : null; })(),
            qualifiers_per_group: (function() { var v = document.getElementById('adTrnQualifiers').value; return v ? parseInt(v, 10) : 2; })(),
            court_count: parseInt(document.getElementById('adTrnCourtCount').value, 10) || 2,
            director_name: document.getElementById('adTrnDirector').value.trim() || null,
            referee_name: document.getElementById('adTrnReferee').value.trim() || null,
            match_duration: parseInt(document.getElementById('adTrnMatchDuration').value, 10) || 90,
            start_time: document.getElementById('adTrnStartTime').value || null,
            registration_start: document.getElementById('adTrnRegStart').value || null,
            registration_end: document.getElementById('adTrnRegEnd').value || null,
            gender: document.getElementById('adTrnFormat').value === 'mixed_doubles'
                ? 'mixed'
                : (document.getElementById('adTrnGender').value || null),
            ntrp_min: (function() { var v = document.getElementById('adTrnNtrpMin').value; return v ? parseFloat(v) : null; })(),
            ntrp_max: (function() { var v = document.getElementById('adTrnNtrpMax').value; return v ? parseFloat(v) : null; })(),
            ntrp_combined_max: (function() { var v = document.getElementById('adTrnNtrpCombinedMax').value; return v ? parseFloat(v) : null; })(),
            set_format: document.getElementById('adTrnSetFormat').value || 'standard'
        };
    }

    // Сколько суток заявка может ждать решения, прежде чем её пометят
    var STALE_REG_DAYS = 3;

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

        var staleEdge = Date.now() - STALE_REG_DAYS * 24 * 60 * 60 * 1000;
        var staleCount = active.filter(function(r) {
            return r.status === 'pending' && r.registered_at &&
                   new Date(r.registered_at).getTime() < staleEdge;
        }).length;

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
        html += '<h4 class="ad-reg-section-title">' + L.regMainDraw + ' <span class="ad-badge">' + mainDraw.length + '/' + maxPart + '</span>' +
            (staleCount > 0 ? ' <span style="color:#FFB020;font-size:0.8rem;font-weight:500;">\u23F3 ' + L.regStaleCount.replace('{n}', staleCount) + '</span>' : '') +
        '</h4>';
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
        var stale = false;
        if (reg.registered_at) {
            var d = new Date(reg.registered_at);
            regDT = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit' }) +
                ' <span style="color:var(--text-dim);">' +
                d.toLocaleTimeString(isEn ? 'en-US' : 'ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + '</span>';
            // Заявка держит место в сетке с момента подачи. Если её долго не
            // разбирать, турнир выглядит полным, а живых участников мало —
            // поэтому нерешённые старше трёх суток помечаем
            stale = reg.status === 'pending' &&
                    (Date.now() - d.getTime()) > STALE_REG_DAYS * 24 * 60 * 60 * 1000;
        }
        var staleMark = stale
            ? ' <span title="' + L.regStaleHint + '" style="color:#FFB020;">\u23F3</span>'
            : '';
        return '<tr' + (stale ? ' style="background:rgba(255,176,32,0.07);"' : '') + '>' +
            '<td><input type="checkbox" class="ad-reg-check" data-group="' + group + '" data-reg-id="' + reg.id + '" data-player-name="' + A.esc(pName) + '"></td>' +
            '<td>' + num + '</td>' +
            '<td>' + photoHtml + '</td>' +
            '<td>' + A.esc(pName) + staleMark + '</td>' +
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
    /**
     * @param {Function} [послеСохранения] — куда уйти после удачной записи.
     *        Без него форма перерисовывается на месте, как и раньше.
     */
    async function saveTournamentHandler(послеСохранения) {
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
                /* Целая афиша — отдельный файл. Не залилась — не роняем
                   сохранение: в карточке останется обрезанная, как было
                   до двух представлений */
                if (trnImageFullFile) {
                    var целая = await A.uploadImage(trnImageFullFile, 'trn-full-');
                    trnImageFullUrl = целая || uploaded;
                }
            }

            var data = collectTrnFormData();

            // Сохранение больше не публикует само: турнир открывают людям
            // отдельной кнопкой в списке. Раньше любой первый «Сохранить»
            // сразу выкладывал турнир на сайт, даже с пустой сеткой.
            data.published_at = trnEditingPublishedAt || null;

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

            // Без категории турнир проваливается мимо страниц категорий и мимо
            // правил допуска: проверка в tournament-register стоит под условием
            // «категория задана», и записаться сможет кто угодно
            if (!data.category_id) {
                A.showToast(isEn ? 'Category is required' : 'Категория обязательна', 'error');
                var catField = document.getElementById('adTrnCat');
                if (catField) catField.focus();
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Без числа участников выключается расчёт свободных мест: сетка
            // примет сколько угодно, а вытеснение в лист ожидания не сработает
            if (!data.max_participants) {
                var isDbl = data.format === 'doubles' || data.format === 'mixed_doubles';
                A.showToast(isEn
                    ? (isDbl ? 'Max pairs is required' : 'Max participants is required')
                    : (isDbl ? 'Укажите максимум пар' : 'Укажите максимум участников'), 'error');
                var maxField = document.getElementById('adTrnMaxPart');
                if (maxField) maxField.focus();
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Пол нужен рейтингу и допуску: таблицы мужские и женские раздельные
            if (!data.gender) {
                A.showToast(isEn ? 'Gender is required' : 'Пол обязателен', 'error');
                var genderField = document.getElementById('adTrnGender');
                if (genderField) genderField.focus();
                saveBtn.disabled = false;
                saveBtn.textContent = L.save;
                return;
            }

            // Validate: max_participants <= draw_size for SE/FIC
            if (data.bracket_type && data.bracket_type !== 'round_robin' && data.bracket_type !== 'group_league' && data.draw_size && data.max_participants) {
                if (data.max_participants > data.draw_size) {
                    var _isDbl = data.format === 'doubles' || data.format === 'mixed_doubles';
                    A.showToast(isEn
                        ? 'Max ' + (_isDbl ? 'pairs' : 'participants') + ' (' + data.max_participants + ') cannot exceed draw size (' + data.draw_size + ')'
                        : 'Макс. ' + (_isDbl ? 'пар' : 'участников') + ' (' + data.max_participants + ') не может превышать размер сетки (' + data.draw_size + ')', 'error');
                    saveBtn.disabled = false;
                    saveBtn.textContent = L.save;
                    return;
                }
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

            /* Уход отсюда — только после удачной записи. Если уйти раньше,
               человек решит, что сохранилось, а в базе ничего нет */
            if (послеСохранения) {
                послеСохранения();
                return;
            }

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

        // Кому турнир начислял очки — узнаём до удаления: записи истории
        // уходят вместе с ним, и потом спрашивать будет уже не у кого
        var affected = [];
        try {
            var rh = await A.client.from('rating_history')
                .select('player_id')
                .eq('tournament_id', trnEditingId);
            affected = [...new Set((rh.data || []).map(function(r) { return r.player_id; }))];
        } catch (e) { /* пересчёт не критичен для самого удаления */ }

        var result = await A.client.from('tournaments').delete().eq('id', trnEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }

        // Очки по категориям собираются из истории. Записи удалились вместе
        // с турниром, но сумма в player_categories осталась прежней — её
        // надо пересобрать, иначе игрок стоит в рейтинге выше, чем заслужил
        if (affected.length) {
            var recalc = await A.client.rpc('recalc_player_categories', { p_ids: affected });
            if (recalc.error) {
                A.showToast('Очки не пересчитались: ' + recalc.error.message, 'error');
            }
        }

        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderTournamentsList();
    }

    /* Автосохранение убрано 28.09 по решению Кости. Функция
       autosaveTrnDraft удалена целиком, а не оставлена «на всякий случай»:
       код, который никто не зовёт, гниёт молча и однажды возвращается.
       В базу пишет только кнопка «Сохранить»; несохранённое стережёт
       предупреждение при уходе со страницы и при переходе по вкладкам. */

    // ---- Venue Search (court autocomplete) ----
    /**
     * Поиск корта по справочнику.
     *
     * Ищет по названию, английскому названию, улице и городу: раньше только
     * по `name`, и корт, который помнят по адресу, не находился.
     * Лимит поднят с 20 до 50 — кортов в базе 30, и десять из них при
     * пустом запросе не показывались вовсе.
     *
     * Последней строкой — «Добавить корт»: справочник должен расти из
     * работы. Менеджер заводит турнир за полчаса до публикации, и уйти
     * в раздел «Корты», создать запись и вернуться он не успевает —
     * замерено: из 45 турниров шесть остались вовсе без места.
     */
    async function searchTrnVenue(query) {
        if (!A.client) return;
        var resultsDiv = document.getElementById('adTrnVenueResults');
        if (!resultsDiv) return;

        var qb = A.client.from('courts')
            .select('id,name,name_en,street,building,city,phone,google_maps_url,twogis_url');
        if (query) {
            var шаблон = '%' + query + '%';
            qb = qb.or('name.ilike.' + шаблон + ',name_en.ilike.' + шаблон +
                       ',street.ilike.' + шаблон + ',city.ilike.' + шаблон);
        }
        var result = await qb.order('name').limit(50);

        var items = result.data || [];
        var html = '';
        items.forEach(function(c) {
            var addr = window.KSLT_ADDRESS ? window.KSLT_ADDRESS.адрес(c) : '';
            html += '<div class="ad-pay-entity-item" data-id="' + c.id + '" data-name="' + A.esc(c.name || '') + '" data-name-en="' + A.esc(c.name_en || '') + '">' +
                A.esc(c.name) + (addr ? ' <span class="ad-venue-addr">— ' + A.esc(addr) + '</span>' : '') +
            '</div>';
        });

        var набрано = (query || '').trim();
        if (набрано) {
            html += '<div class="ad-pay-entity-item ad-venue-add" data-add="1">+ ' +
                L.trnVenueAdd.replace('{name}', A.esc(набрано)) + '</div>';
        }

        if (!html) {
            resultsDiv.style.display = 'none';
            return;
        }
        resultsDiv.innerHTML = html;
        resultsDiv.style.display = 'block';

        resultsDiv.querySelectorAll('.ad-pay-entity-item').forEach(function(el) {
            el.addEventListener('click', function() {
                if (el.dataset.add) {
                    resultsDiv.style.display = 'none';
                    окноКорта(набрано);
                    return;
                }
                document.getElementById('adTrnCourtId').value = el.dataset.id;
                document.getElementById('adTrnVenueSearch').value = el.dataset.name;
                resultsDiv.style.display = 'none';
                loadTrnVenueInfo(el.dataset.id);
            });
        });
    }

    /**
     * Окно «новый корт» прямо из формы турнира.
     *
     * Полей ровно столько, сколько нужно, чтобы место было местом:
     * название и адрес обязательны, ссылки на карты — нет (решение Кости
     * 28.09). Остальное — телефон, фотографии, покрытия, расписание —
     * дозаполняется в разделе «Корты»: здесь менеджер занят турниром.
     *
     * ПРЕДПОЛОЖЕНИЕ: город нужен, хотя Костя его не называл. Он есть у всех
     * тридцати кортов, по нему сайт группирует и ищет, и без него новый
     * корт выпал бы из этих списков. Взят выпадающим из уже существующих.
     */
    /**
     * Окно корта: создание и правка одним окном.
     *
     * @param {Object|string} что — строка courts для правки, либо набранное
     *        название для нового корта. Два окна на одно понятие разошлись
     *        бы на первой же правке полей.
     */
    async function окноКорта(что) {
        var правим = что && typeof что === 'object' ? что : null;
        var имя = правим ? (правим.name || '') : (что || '');
        var города = [], страны = [];
        if (A.client) {
            var гр = await A.client.from('courts').select('city,country');
            (гр.data || []).forEach(function(c) {
                if (c.city && города.indexOf(c.city) === -1) города.push(c.city);
                if (c.country && страны.indexOf(c.country) === -1) страны.push(c.country);
            });
            города.sort();
            страны.sort();
        }

        A.showConfirm(
            правим ? L.trnVenueEditTitle : L.trnVenueNewTitle,
            '<div class="ad-field">' +
                '<label class="ad-field-label" for="adTrnNewCrtName">' + L.trnVenueNewName + '</label>' +
                '<input type="text" class="ad-field-input" id="adTrnNewCrtName" value="' + A.esc(имя) + '">' +
            '</div>' +
            '<div class="ad-field">' +
                '<label class="ad-field-label" for="adTrnNewCrtStreet">' + L.trnVenueNewAddr + '</label>' +
                '<input type="text" class="ad-field-input" id="adTrnNewCrtStreet" placeholder="' + A.esc(L.trnVenueNewAddrHint) + '" value="' + A.esc(правим ? (правим.street || '') : '') + '">' +
            '</div>' +
            /* Город — тем же приёмом, что и сам корт: печатаешь, список
               фильтруется, а когда совпадений нет — последней строкой
               «Использовать „Каракол"». Выпадающий список из пяти городов
               запирал в справочнике: нового города туда было не вписать,
               а отдельное поле «другой» — это второе определение одного
               понятия. Одно поле на одно понятие */
            '<div class="ad-field ad-pay-entity-wrap">' +
                '<label class="ad-field-label" for="adTrnNewCrtCity">' + L.trnVenueNewCity + '</label>' +
                '<input type="text" class="ad-field-input" id="adTrnNewCrtCity" autocomplete="off" value="' + A.esc(правим ? (правим.city || '') : (города[0] || '')) + '">' +
                '<div class="ad-pay-entity-results" id="adTrnNewCrtCityList" style="display:none;"></div>' +
            '</div>' +
            /* Страна тем же полем: клуб играет в Кыргызстане, но возит
               турниры в Алматы и Ташкент, и «Алматы» без страны в списке
               рядом с «Ош» читается кыргызским городом */
            '<div class="ad-field ad-pay-entity-wrap">' +
                '<label class="ad-field-label" for="adTrnNewCrtCountry">' + L.trnVenueNewCountry + '</label>' +
                '<input type="text" class="ad-field-input" id="adTrnNewCrtCountry" autocomplete="off" value="' + A.esc(правим ? (правим.country || '') : (страны[0] || '')) + '">' +
                '<div class="ad-pay-entity-results" id="adTrnNewCrtCountryList" style="display:none;"></div>' +
            '</div>' +
            '<div class="ad-field">' +
                '<label class="ad-field-label" for="adTrnNewCrt2gis">' + L.trnVenueNew2gis + '</label>' +
                '<input type="url" class="ad-field-input" id="adTrnNewCrt2gis" placeholder="https://2gis.kg/..." value="' + A.esc(правим ? (правим.twogis_url || '') : '') + '">' +
            '</div>' +
            '<div class="ad-field">' +
                '<label class="ad-field-label" for="adTrnNewCrtGoogle">' + L.trnVenueNewGoogle + '</label>' +
                '<input type="url" class="ad-field-input" id="adTrnNewCrtGoogle" placeholder="https://www.google.com/maps/..." value="' + A.esc(правим ? (правим.google_maps_url || '') : '') + '">' +
            '</div>',
            function() { return сохранитьКорт(правим); },
            правим ? L.trnVenueEditSave : L.trnVenueNewSave
        );

        подсказки('adTrnNewCrtCity', 'adTrnNewCrtCityList', города);
        подсказки('adTrnNewCrtCountry', 'adTrnNewCrtCountryList', страны);
    }

    /**
     * Дослать переводы корта.
     *
     * ЧТО ЧЕМ ЗАПОЛНЯЕТСЯ — решено замером 28.09, а не на глаз:
     *
     *     поле       en             kg
     *     name       транслит       — (кириллица, откат на ru)
     *     street     транслит       — (кириллица, откат на ru)
     *     city       перевод        перевод
     *     country    перевод        — (столбца country_kg в базе нет)
     *
     * ПОЧЕМУ ИМЯ И УЛИЦА ТРАНСЛИТОМ, А НЕ ПЕРЕВОДОМ. Замер на «Отшибнике»
     * 28.09: переводчик отдал «Отшибник» → «Outfitter», а «2550 Waterview
     * Dr» → «2550 Waterview Доктор» — сокращение Dr прочитано как
     * «доктор». Адрес это то, по чему едут, а не то, что читают: карты
     * собственную часть адреса транслитерируют и никогда не переводят.
     * Транслитом уже работают имена тренеров (coaches.js:1003) — тот же
     * A.transliterate, второго механизма не заводим.
     *
     * ПОЧЕМУ ГОРОД И СТРАНА ПЕРЕВОДОМ, А НЕ ТРАНСЛИТОМ. Транслит даёт
     * «Чикаго» → «Chikago», «США» → «SShA»: неправильное английское
     * написание читается хуже кириллицы. У городов и стран есть
     * устоявшиеся названия — их и отдаёт переводчик.
     *
     * Кыргызский остаётся кириллицей — он ею и пишется. Переводчику это
     * безразлично: «Иссык-Куль» он отдаёт как «Ысык-Көл», а не латиницей.
     *
     * ОДИН ЗАХОД, А НЕ ПО СТРОЧКЕ. Переводчик отвечает 3–10 с на запрос;
     * три запроса подряд — до тридцати секунд ожидания. Пускаем их разом
     * через Promise.all: ждём самый долгий, а не сумму.
     *
     * Заполняем ТОЛЬКО пустые поля: свой перевод человека не трогаем.
     */
    async function доперевестиКорт(id, имя, улица, город, страна, правим) {
        if (!A.client) return;

        var поля = {};
        /* При правке оригинала перевод уже обнулён выше, при создании его
           не было вовсе — значит пусто здесь честно */
        function свободно(столбец) { return !(правим && правим[столбец]); }

        /* 1. ТРАНСЛИТ — считается на месте, сети не требует */
        function латиницей(поле, значение, как) {
            var столбец = поле + '_en';
            if (!значение || !свободно(столбец) || !как) return;
            /* Латиницу транслитерировать нечем: вышла бы копия оригинала,
               а копия — это второе место, где живёт одно значение */
            if (!/[\u0400-\u04FF]/.test(значение)) return;
            поля[столбец] = как(значение);
        }
        латиницей('name', имя, A.transliterate);
        /* У улицы родовое слово переводится и уезжает в конец:
           «улица Ахунбаева» → «Akhunbaeva St». Словарь — utils.js */
        латиницей('street', улица, A.streetEn);

        /* 2. ПЕРЕВОД — все запросы разом */
        var задания = [];
        function переводом(поле, значение, языки) {
            if (!значение) return;
            языки.forEach(function(я) {
                var столбец = поле + '_' + я;
                if (!свободно(столбец)) return;
                задания.push({ столбец: столбец, текст: значение, язык: я });
            });
        }
        переводом('city', город, ['en', 'kg']);
        переводом('country', страна, ['en']);

        if (задания.length && A.translateText) {
            var готовые = await Promise.all(задания.map(function(з) {
                // молча: перевод — удобство, а не условие сохранения
                return A.translateText(з.текст, 'ru', з.язык).catch(function() { return null; });
            }));
            for (var i = 0; i < задания.length; i++) {
                /* Сервис при отказе возвращает исходную строку. Записать её
                   значит выдать непереведённое за перевод */
                var готово = готовые[i];
                if (!готово || готово === задания[i].текст) continue;
                /* Он же отдаёт «chicago» со строчной — города и страны
                   пишутся с прописной на всех трёх языках */
                поля[задания[i].столбец] = готово.charAt(0).toUpperCase() + готово.slice(1);
            }
        }

        if (!Object.keys(поля).length) return;
        var res = await A.client.from('courts').update(поля).eq('id', id);
        if (!res.error) A.showToast(L.trnVenueTranslated, 'success');
    }

    /**
     * Подсказки к полю со своим вводом: те же классы списка, что у поиска
     * корта. Одна функция на город и страну — два одинаковых списка
     * разошлись бы на первой же правке.
     */
    function подсказки(idПоля, idСписка, значения) {
        var города = значения;
        var поле = document.getElementById(idПоля);
        var список = document.getElementById(idСписка);
        if (!поле || !список) return;

        function нарисовать() {
            var q = (поле.value || '').trim().toLowerCase();
            var под = города.filter(function(г) { return !q || г.toLowerCase().indexOf(q) !== -1; });
            var html = под.map(function(г) {
                return '<div class="ad-pay-entity-item" data-city="' + A.esc(г) + '">' + A.esc(г) + '</div>';
            }).join('');
            /* Точного совпадения нет — предлагаем взять набранное как есть */
            var своё = (поле.value || '').trim();
            if (своё && города.indexOf(своё) === -1) {
                html += '<div class="ad-pay-entity-item ad-venue-add" data-city="' + A.esc(своё) + '">+ ' +
                    L.trnVenueUseCity.replace('{name}', A.esc(своё)) + '</div>';
            }
            if (!html) { список.style.display = 'none'; return; }
            список.innerHTML = html;
            список.style.display = 'block';
            список.querySelectorAll('.ad-pay-entity-item').forEach(function(el) {
                el.addEventListener('mousedown', function(e) {
                    e.preventDefault();
                    поле.value = el.dataset.city;
                    список.style.display = 'none';
                });
            });
        }

        поле.addEventListener('input', нарисовать);
        поле.addEventListener('focus', нарисовать);
        поле.addEventListener('blur', function() { список.style.display = 'none'; });
    }

    /** @param {Object|null} правим — строка courts, если это правка */
    async function сохранитьКорт(правим) {
        var имя = (document.getElementById('adTrnNewCrtName').value || '').trim();
        var улица = (document.getElementById('adTrnNewCrtStreet').value || '').trim();
        var город = (document.getElementById('adTrnNewCrtCity').value || '').trim();
        var страна = (document.getElementById('adTrnNewCrtCountry').value || '').trim();
        var дгис = (document.getElementById('adTrnNewCrt2gis').value || '').trim();
        var гугл = (document.getElementById('adTrnNewCrtGoogle').value || '').trim();

        /* Ошибку показываем и НЕ закрываем окно: набранное не должно
           пропадать из-за незаполненного поля */
        if (!имя) { A.showToast(L.trnVenueNeedName, 'error'); throw new Error('нет названия'); }
        if (!улица) { A.showToast(L.trnVenueNeedAddr, 'error'); throw new Error('нет адреса'); }

        var поля = {
            name: имя,
            street: улица,
            city: город || null,
            country: страна || null,
            google_maps_url: гугл || null,
            twogis_url: дгис || null
        };

        /* ПЕРЕВОД НЕ ПЕРЕЖИВАЕТ ПРАВКУ ОРИГИНАЛА. Окно знает только русские
           название, город и страну; английские и кыргызские поля остаются
           в базе от прежнего значения. Замерено на «Отшибнике»: страна
           стала «США», а country_en так и остался «Kyrgyzstan» — на
           английской странице чикагский корт значился кыргызским.
           Устаревший перевод хуже его отсутствия: пустое поле сборщик
           адреса откатит на русское, и человек увидит «США», а не ложь.
           Правильный перевод дописывается в разделе «Корты», где поля есть. */
        if (правим) {
            if ((правим.city || '') !== (город || '')) {
                поля.city_en = null;
                поля.city_kg = null;
            }
            if ((правим.country || '') !== (страна || '')) {
                поля.country_en = null;
            }
            if ((правим.name || '') !== имя) {
                поля.name_en = null;
                поля.name_kg = null;
            }
        }

        var res, id;
        if (правим) {
            /* Адрес страницы корта (id) при правке НЕ меняем: по нему уже
               могут стоять ссылки, а переименование сломало бы их молча */
            id = правим.id;
            res = await A.client.from('courts').update(поля).eq('id', id);
        } else {
            id = await A.uniqueCourtId(имя);
            res = await A.client.from('courts').insert(Object.assign({ id: id }, поля));
        }
        if (res.error) {
            A.showToast(res.error.message, 'error');
            throw new Error(res.error.message);
        }

        document.getElementById('adTrnCourtId').value = id;
        document.getElementById('adTrnVenueSearch').value = имя;
        var infoDiv = document.getElementById('adTrnVenueInfo');
        if (infoDiv) infoDiv.innerHTML = '';
        loadTrnVenueInfo(id);
        trnDraftDirty = true;
        A.showToast(правим ? L.trnVenueSaved : L.trnVenueAdded, 'success');

        /* Перевод досылается следом, а не задерживает сохранение: сервис
           отвечает секундами, и держать человека у закрытого окна ради
           семи запросов — плохая сделка. Ошибка перевода сохранение не
           рушит: корт уже записан */
        доперевестиКорт(id, имя, улица, город, страна, правим);
    }

    async function loadTrnVenueInfo(courtId) {
        if (!A.client || !courtId) return;
        var result = await A.client.from('courts')
            .select('id,name,name_en,street,building,city,country,country_en,phone,google_maps_url,twogis_url,published_at')
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

        var addr = window.KSLT_ADDRESS ? window.KSLT_ADDRESS.адрес(court) : '';
        var html = '<div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;padding:12px;">' +
            '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">' +
                '<strong style="color:var(--text-primary);">' + A.esc(court.name) + '</strong>' +
                '<div style="display:flex;gap:8px;">' +
                    /* Правка на месте: ошибся в названии — поправил, а не
                       заводил корт заново. Раньше был только «Сбросить»,
                       и опечатка стоила полного перенабора */
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-secondary" id="adTrnVenueEdit">' + L.trnVenueEdit + '</button>' +
                    '<button type="button" class="ad-btn ad-btn-sm ad-btn-secondary" id="adTrnVenueClear">' + L.trnVenueClear + '</button>' +
                '</div>' +
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

        document.getElementById('adTrnVenueEdit').addEventListener('click', function() {
            окноКорта(court);
        });

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
