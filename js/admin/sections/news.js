// ============================================
// KSLT Admin — News CRUD
// ============================================

(function() {
    'use strict';

    var A = window.KSLT_ADMIN;

    // Чистка разметки живёт в utils.js. Если оттуда приедет старая версия из
    // кэша, сохранение не должно падать — просто обойдётся без чистки.
    function cleanHtml(value) {
        if (A.cleanNewsHtmlOnSave) return A.cleanNewsHtmlOnSave(value);
        return A.cleanNewsHtml ? A.cleanNewsHtml(value) : (value || '');
    }
    var L = A.L;
    var isEn = A.isEn;

    var newsEditingId = null;
    var newsEditingPublishedAt = null;
    var newsImageFile = null;
    var newsImageUrl = '';
    var newsGalleryUrls = [];
    var newsGalleryFiles = [];
    var newsContentImages = [];
    var newsContentImageFiles = [];
    var newsPollData = null;
    var newsSearchQuery = '';
    var newsSortCol = 'created_at';
    var newsSortAsc = false;
    var newsFilters = { category: [], published_at: [] };
    var newsAllData = [];
    var newsDraftDirty = false;

    var EMOJI_MAP = {
        tennis: { emoji: '&#127934;', label: 'Tennis' },
        fire:   { emoji: '&#128293;', label: 'Fire' },
        clap:   { emoji: '&#128079;', label: 'Clap' },
        star:   { emoji: '&#11088;',  label: 'Star' },
        heart:  { emoji: '&#10084;&#65039;', label: 'Heart' },
        like:   { emoji: '&#128077;', label: 'Like' },
        trophy: { emoji: '&#127942;', label: 'Trophy' },
        muscle: { emoji: '&#128170;', label: 'Muscle' },
        target: { emoji: '&#127919;', label: 'Target' },
        wow:    { emoji: '&#128558;', label: 'Wow' }
    };
    var EMOJI_KEYS = Object.keys(EMOJI_MAP);
    var DEFAULT_REACTIONS = ['tennis', 'fire', 'clap'];

    function renderNewsSection() {
        if (A.isDeepLinked('content')) return;
        renderNewsList();
    }

    // ---- News List ----
    async function renderNewsList() {
        var container = document.getElementById('ad-content');
        if (!container) return;

        function colHeader(col, label, filterable) {
            var isActive = newsSortCol === col;
            var hasFilter = filterable && newsFilters[col] && newsFilters[col].length > 0;
            var cls = 'ad-col-header' + (isActive || hasFilter ? ' ad-col-active' : '');
            return '<th><div class="' + cls + '" data-col="' + col + '">' +
                '<span>' + label + '</span>' +
                (isActive ? '<span class="ad-sort-arrow">' + (newsSortAsc ? '↑' : '↓') + '</span>' : '') +
                '<span class="ad-col-filter-btn' + (hasFilter ? ' ad-col-filtered' : '') + '">▼</span>' +
            '</div></th>';
        }

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + L.content + '</h2>' +
            '</div>' +
            // News stat cards
            '<div class="ad-news-stats-grid" id="adNewsStatsGrid">' +
                '<div class="ad-news-stat-card">' +
                    '<div class="ad-news-stat-icon">&#128240;</div>' +
                    '<div class="ad-news-stat-value" id="adNewsStatPubCount">...</div>' +
                    '<div class="ad-news-stat-label">' + L.newsStatPublished + '</div>' +
                    '<div class="ad-news-stat-sub" id="adNewsStatPubDate"></div>' +
                '</div>' +
                '<div class="ad-news-stat-card">' +
                    '<div class="ad-news-stat-icon">&#128221;</div>' +
                    '<div class="ad-news-stat-value" id="adNewsStatDraftCount">...</div>' +
                    '<div class="ad-news-stat-label">' + L.newsStatDrafts + '</div>' +
                    '<div class="ad-news-stat-sub" id="adNewsStatDraftDate"></div>' +
                '</div>' +
                '<div class="ad-news-stat-card ad-news-stat-card--popular">' +
                    '<div class="ad-news-stat-icon">&#128293; ' + L.newsStatPopular + '</div>' +
                    '<div class="ad-news-stat-top-list" id="adNewsStatTopList">' +
                        '<div style="color:var(--text-dim);font-size:0.8rem;">...</div>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="ad-filter-row ad-filter-sticky">' +
                '<input type="text" class="ad-field-input ad-filter-search" id="adNewsSearch" placeholder="' + L.newsSearch + '" value="' + A.esc(newsSearchQuery) + '">' +
                '<button class="ad-btn ad-btn-primary" id="adNewsAdd" style="white-space:nowrap;margin-left:auto;">+ ' + L.addNews + '</button>' +
            '</div>' +
            '<div class="ad-table-card" style="position:relative;">' +
                '<div class="ad-table-wrap">' +
                    '<table class="ad-table ad-table-clickable" id="adNewsTable">' +
                        '<thead><tr>' +
                            '<th style="width:40px;"></th>' +
                            colHeader('title', L.thTitle, false) +
                            colHeader('category', L.thCategory, true) +
                            '<th>' + L.thExecutor + '</th>' +
                            colHeader('published_at', L.thStatus, true) +
                            colHeader('created_at', L.thPublished, false) +
                            colHeader('view_count', '&#128065;', false) +
                            colHeader('reactions', L.thReactions, false) +
                            colHeader('votes', L.thVotes, false) +
                        '</tr></thead>' +
                        '<tbody><tr><td colspan="10" style="text-align:center;color:var(--text-dim);padding:40px;">...</td></tr></tbody>' +
                    '</table>' +
                '</div>' +
                '<div class="ad-col-dropdown" id="adNewsColDropdown" style="display:none;"></div>' +
            '</div>';

        document.getElementById('adNewsAdd').addEventListener('click', function() {
            renderNewsForm(null);
        });

        var searchTimer = null;
        document.getElementById('adNewsSearch').addEventListener('input', function() {
            newsSearchQuery = this.value;
            clearTimeout(searchTimer);
            searchTimer = setTimeout(loadNewsList, 300);
        });

        // Column header click → open dropdown
        document.getElementById('adNewsTable').querySelector('thead').addEventListener('click', function(e) {
            e.stopPropagation();
            var hdr = e.target.closest('.ad-col-header');
            if (!hdr) return;
            openNewsColDropdown(hdr.dataset.col, hdr);
        });

        // Close dropdown on outside click
        document.addEventListener('click', function(e) {
            var dd = document.getElementById('adNewsColDropdown');
            if (dd && dd.style.display !== 'none' && !dd.contains(e.target)) {
                dd.style.display = 'none';
            }
        });

        await loadNewsList();
        loadNewsStats(); // fire-and-forget
    }

    async function loadNewsStats() {
        if (!A.client) return;
        try {
            var results = await Promise.allSettled([
                A.client.rpc('get_news_stats'),
                A.client.rpc('get_top_news', { p_limit: 3 })
            ]);

            // Published + Drafts
            var statsRes = results[0];
            if (statsRes.status === 'fulfilled' && statsRes.value.data && statsRes.value.data.length) {
                var s = statsRes.value.data[0];
                var pubCountEl = document.getElementById('adNewsStatPubCount');
                var pubDateEl = document.getElementById('adNewsStatPubDate');
                var draftCountEl = document.getElementById('adNewsStatDraftCount');
                var draftDateEl = document.getElementById('adNewsStatDraftDate');

                if (pubCountEl) pubCountEl.textContent = s.published_count || 0;
                if (draftCountEl) draftCountEl.textContent = s.draft_count || 0;

                var dateFmt = isEn ? 'en-US' : 'ru-RU';
                var dateOpts = { day: 'numeric', month: 'short' };
                if (pubDateEl) {
                    pubDateEl.textContent = s.last_published
                        ? L.newsStatLastDate + ': ' + new Date(s.last_published).toLocaleDateString(dateFmt, dateOpts)
                        : L.newsStatNoArticles;
                }
                if (draftDateEl) {
                    draftDateEl.textContent = s.last_draft
                        ? L.newsStatLastDate + ': ' + new Date(s.last_draft).toLocaleDateString(dateFmt, dateOpts)
                        : '';
                }
            }

            // Top-3 popular
            var topRes = results[1];
            var topList = document.getElementById('adNewsStatTopList');
            if (topList && topRes.status === 'fulfilled' && topRes.value.data) {
                var medals = ['\uD83E\uDD47', '\uD83E\uDD48', '\uD83E\uDD49'];
                var rows = topRes.value.data;
                if (rows.length === 0) {
                    topList.innerHTML = '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.newsStatNoArticles + '</div>';
                } else {
                    var html = '';
                    rows.forEach(function(row, i) {
                        html += '<div class="ad-news-stat-top-item">' +
                            '<span class="ad-news-stat-top-medal">' + (medals[i] || '') + '</span>' +
                            '<span class="ad-news-stat-top-title">' + A.esc(row.title) + '</span>' +
                            '<span class="ad-news-stat-top-score">(' + (row.score || 0) + ')</span>' +
                        '</div>';
                    });
                    topList.innerHTML = html;
                }
            }
        } catch (e) {
            console.error('loadNewsStats error:', e);
        }
    }

    function openNewsColDropdown(col, hdr) {
        var dd = document.getElementById('adNewsColDropdown');
        if (!dd) return;

        // Toggle: if already open for same column, close it
        if (dd.style.display === 'block' && dd.dataset.col === col) {
            dd.style.display = 'none';
            return;
        }
        dd.dataset.col = col;

        // Position dropdown below header
        var rect = hdr.getBoundingClientRect();
        var cardRect = dd.parentElement.getBoundingClientRect();
        dd.style.left = Math.max(0, rect.left - cardRect.left) + 'px';
        dd.style.top = (rect.bottom - cardRect.top + 4) + 'px';

        var colLabels = { title: L.thTitle, category: L.thCategory, published_at: L.thStatus, created_at: L.thPublished, view_count: '&#128065;', reactions: L.thReactions, votes: L.thVotes };
        var isDateCol = col === 'created_at';
        var isNumericCol = col === 'view_count' || col === 'reactions' || col === 'votes';
        var filterable = col === 'category' || col === 'published_at';

        var html = '';

        // Checkboxes first (for filterable columns)
        if (filterable) {
            var values;
            if (col === 'category') {
                values = Object.keys(A.CATEGORIES);
            } else {
                values = ['published', 'draft'];
            }

            var activeFilters = newsFilters[col] || [];
            var allChecked = activeFilters.length === values.length;

            // Select All + Title on same line
            html += '<div class="ad-col-dd-title-row">' +
                '<label class="ad-col-dd-check-all"><input type="checkbox" id="adColSelectAll"' + (allChecked ? ' checked' : '') + '> ' + (isEn ? 'All' : 'Все') + '</label>' +
                '<span class="ad-col-dd-title">' + (colLabels[col] || col) + '</span>' +
            '</div>';

            values.forEach(function(v) {
                var label = col === 'category' ? (A.CATEGORIES[v] || v) : (v === 'published' ? L.newsPublished : L.newsDraft);
                var checked = activeFilters.indexOf(v) !== -1 ? ' checked' : '';
                html += '<label class="ad-col-dd-check"><input type="checkbox" value="' + A.esc(v) + '"' + checked + '> ' + A.esc(label) + '</label>';
            });

            html += '<div class="ad-col-dd-divider"></div>';
        } else {
            html += '<div class="ad-col-dd-title">' + (colLabels[col] || col) + '</div>';
        }

        // Sort options after checkboxes
        if (isDateCol) {
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="desc">' + (isEn ? '↓ Newest first' : '↓ Сначала новые') + '</div>';
            html += '<div class="ad-col-dd-item ad-col-dd-sort" data-sort-dir="asc">' + (isEn ? '↑ Oldest first' : '↑ Сначала старые') + '</div>';
        } else if (isNumericCol) {
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
                newsSortCol = col;
                newsSortAsc = this.dataset.sortDir === 'asc';
                dd.style.display = 'none';
                updateNewsColHeaders();
                loadNewsList();
            });
        });

        // Select All checkbox
        var selectAllCb = dd.querySelector('#adColSelectAll');
        var itemCbs = dd.querySelectorAll('input[type="checkbox"]:not(#adColSelectAll)');

        if (selectAllCb) {
            selectAllCb.addEventListener('change', function(ev) {
                ev.stopPropagation();
                var checked = this.checked;
                var arr = [];
                itemCbs.forEach(function(cb) {
                    cb.checked = checked;
                    if (checked) arr.push(cb.value);
                });
                newsFilters[col] = arr;
                applyNewsFilters();
                updateNewsColHeaders();
            });
        }

        // Checkbox change
        itemCbs.forEach(function(cb) {
            cb.addEventListener('change', function(ev) {
                ev.stopPropagation();
                var val = this.value;
                var arr = newsFilters[col] || [];
                if (this.checked) {
                    if (arr.indexOf(val) === -1) arr.push(val);
                } else {
                    arr = arr.filter(function(v) { return v !== val; });
                }
                newsFilters[col] = arr;
                // Sync "Select All" state
                if (selectAllCb) {
                    selectAllCb.checked = arr.length === itemCbs.length;
                }
                applyNewsFilters();
                updateNewsColHeaders();
            });
        });
    }

    function updateNewsColHeaders() {
        var table = document.getElementById('adNewsTable');
        if (!table) return;
        table.querySelectorAll('.ad-col-header').forEach(function(hdr) {
            var c = hdr.dataset.col;
            var isActive = newsSortCol === c;
            var filterable = c === 'category' || c === 'published_at';
            var hasFilter = filterable && newsFilters[c] && newsFilters[c].length > 0;
            hdr.classList.toggle('ad-col-active', isActive || hasFilter);
            var arrow = hdr.querySelector('.ad-sort-arrow');
            if (isActive) {
                if (!arrow) {
                    arrow = document.createElement('span');
                    arrow.className = 'ad-sort-arrow';
                    hdr.querySelector('.ad-col-filter-btn').before(arrow);
                }
                arrow.textContent = newsSortAsc ? '↑' : '↓';
            } else if (arrow) {
                arrow.remove();
            }
            var fb = hdr.querySelector('.ad-col-filter-btn');
            if (fb) fb.classList.toggle('ad-col-filtered', hasFilter);
        });
    }

    function applyNewsFilters() {
        var filtered = newsAllData.slice();

        // Category filter
        if (newsFilters.category && newsFilters.category.length > 0) {
            filtered = filtered.filter(function(a) {
                return newsFilters.category.indexOf(a.category || '') !== -1;
            });
        }

        // Status filter
        if (newsFilters.published_at && newsFilters.published_at.length > 0) {
            filtered = filtered.filter(function(a) {
                var status = a.published_at ? 'published' : 'draft';
                return newsFilters.published_at.indexOf(status) !== -1;
            });
        }

        renderNewsRows(filtered);
    }

    async function loadNewsList() {
        if (!A.client) return;

        // reactions/votes are not DB columns — sort client-side
        var serverSortCol = (newsSortCol === 'reactions' || newsSortCol === 'votes') ? 'created_at' : newsSortCol;
        var serverSortAsc = (newsSortCol === 'reactions' || newsSortCol === 'votes') ? false : newsSortAsc;

        var query = A.client.from('news')
            .select('id,title,image,category,published_at,created_at,executor,view_count')
            .order(serverSortCol, { ascending: serverSortAsc });

        if (newsSearchQuery) {
            query = query.ilike('title', '%' + newsSearchQuery + '%');
        }

        var result = await query;
        newsAllData = result.data || [];
        applyNewsFilters();
    }

    async function renderNewsRows(articles) {
        var table = document.getElementById('adNewsTable');
        if (!table) return;
        var tbody = table.querySelector('tbody');

        if (articles.length === 0) {
            tbody.innerHTML =
                '<tr><td colspan="10" style="text-align:center;padding:60px 20px;">' +
                    '<div style="font-size:2rem;opacity:0.3;margin-bottom:8px;">📝</div>' +
                    '<div style="color:var(--text-secondary);margin-bottom:4px;">' + L.noArticles + '</div>' +
                    '<div style="color:var(--text-dim);font-size:0.8rem;">' + L.noArticlesText + '</div>' +
                '</td></tr>';
            return;
        }

        // Load engagement data
        var engMap = {};
        if (A.client) {
            var ids = articles.map(function(a) { return a.id; });
            var engRes = await A.client.rpc('get_news_engagement', { p_news_ids: ids });
            if (engRes.data) {
                engRes.data.forEach(function(row) {
                    engMap[row.news_id] = { reactions: row.total_reactions || 0, votes: row.total_votes || 0 };
                });
            }
        }

        // Client-side sort for reactions/votes
        if (newsSortCol === 'reactions' || newsSortCol === 'votes') {
            var sortKey = newsSortCol;
            articles.sort(function(a, b) {
                var va = (engMap[a.id] || {})[sortKey] || 0;
                var vb = (engMap[b.id] || {})[sortKey] || 0;
                return newsSortAsc ? va - vb : vb - va;
            });
        }

        tbody.innerHTML = '';
        articles.forEach(function(a) {
            var thumbHtml = a.image
                ? '<img src="' + A.esc(a.image) + '" class="ad-table-thumb" alt="">'
                : '<div class="ad-table-thumb" style="background:var(--bg-elevated);"></div>';

            var catLabel = A.CATEGORIES[a.category] || a.category || L.noData;
            var isPublished = !!a.published_at;
            var statusHtml = isPublished
                ? '<span class="ad-status-badge ad-status-published">' + L.newsPublished + '</span>'
                : '<span class="ad-status-badge ad-status-draft">' + L.newsDraft + '</span>';

            var dateStr = a.published_at
                ? new Date(a.published_at).toLocaleDateString(isEn ? 'en-US' : 'ru-RU')
                : L.noData;

            var eng = engMap[a.id] || { reactions: 0, votes: 0 };
            var viewsCell = (a.view_count || 0) > 0 ? a.view_count : '\u2014';
            var reactionsCell = eng.reactions > 0 ? eng.reactions : '\u2014';
            var votesCell = eng.votes > 0 ? eng.votes : '\u2014';

            tbody.innerHTML +=
                '<tr data-news-id="' + a.id + '">' +
                    A.bulkCheckboxTd(a.id) +
                    '<td>' + thumbHtml + '</td>' +
                    '<td style="font-weight:500;color:var(--text-primary);">' + (a.title || L.noData) + '</td>' +
                    '<td><span class="ad-cat-badge">' + catLabel + '</span></td>' +
                    '<td style="color:var(--text-secondary);">' + A.esc(a.executor || '\u2014') + '</td>' +
                    '<td>' + statusHtml + '</td>' +
                    '<td>' + dateStr + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + viewsCell + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + reactionsCell + '</td>' +
                    '<td style="text-align:center;color:var(--text-secondary);">' + votesCell + '</td>' +
                '</tr>';
        });

        // Click to edit
        tbody.addEventListener('click', function(e) {
            if (e.target.closest('.ad-bulk-cell')) return;
            var row = e.target.closest('tr[data-news-id]');
            if (!row) return;
            loadAndEditNews(row.dataset.newsId);
        });

        A.setupBulkDelete({ tableId: 'adNewsTable', tableName: 'news', reloadFn: loadNewsList });
    }

    async function loadAndEditNews(id) {
        if (!A.client) return;
        var result = await A.client.from('news').select('*').eq('id', id).single();
        if (result.data) {
            A.setAdminHash('content', 'edit', id);
            renderNewsForm(result.data);
        }
    }

    // ---- News Form ----
    function renderNewsForm(article) {
        var container = document.getElementById('ad-content');
        if (!container) return;

        newsEditingId = article ? article.id : null;
        newsEditingPublishedAt = (article && article.published_at) ? article.published_at : null;
        newsImageFile = null;
        newsImageUrl = (article && article.image) ? article.image : '';
        newsGalleryUrls = (article && article.gallery) ? article.gallery.slice() : [];
        newsGalleryFiles = [];
        newsContentImages = (article && article.content_images) ? article.content_images.slice() : [];
        newsContentImageFiles = [];
        for (var ci = 0; ci < newsContentImages.length; ci++) newsContentImageFiles.push(null);
        newsPollData = (article && article.poll) ? { question: article.poll.question || '', options: (article.poll.options || []).slice() } : null;

        // Reactions config: null → all enabled, [] → disabled, ["tennis","fire"] → specific
        var rc = article ? article.reactions_config : null;
        var reactionsEnabled = !Array.isArray(rc) || rc.length > 0;  // null or non-empty = enabled
        var reactionsTypes = Array.isArray(rc) && rc.length > 0 ? rc : DEFAULT_REACTIONS;

        var title = article ? L.editNews : L.addNews;

        var imagePreviewHtml = newsImageUrl
            ? '<img src="' + A.esc(newsImageUrl) + '" class="ad-image-upload-preview" id="adNewsImgPreview">' +
              '<button type="button" class="ad-image-upload-remove" id="adNewsImgRemove">&times;</button>'
            : '<div class="ad-image-upload-placeholder">' +
                  '<div class="ad-image-upload-icon">🖼</div>' +
                  '<div>' + L.uploadImage + '</div>' +
                  '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
              '</div>';

        var hasImageClass = newsImageUrl ? ' has-image' : '';

        container.innerHTML =
            '<div class="ad-section-header">' +
                '<h2 class="ad-section-title">' + title + '</h2>' +
                '<button class="ad-btn ad-btn-secondary" id="adNewsBack">' + L.back + '</button>' +
            '</div>' +

            // Image
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsImage + '</div>' +
                '<div class="ad-image-upload' + hasImageClass + '" id="adNewsImgZone">' +
                    imagePreviewHtml +
                '</div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adNewsImgInput" style="display:none">' +
                '<div class="ad-image-url-row">' +
                    '<input type="text" class="ad-field-input" id="adNewsImgUrl" placeholder="' + L.orPasteUrl + '" value="' + (newsImageUrl || '') + '">' +
                    '<button class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsImgUrlBtn">' + L.applyUrl + '</button>' +
                '</div>' +
            '</div>' +

            // Meta preview
            '<div class="ad-form-card ad-news-meta-preview">' +
                '<div class="ad-news-meta-row">' +
                    '<span>\uD83D\uDCC5 <span id="adMetaDate">\u2014</span></span>' +
                    '<span>\uD83D\uDC64 <span id="adMetaAuthor">KSLT Media</span></span>' +
                    '<span>\u23F1 <span id="adMetaReadTime">0</span> ' + L.metaReadTime + '</span>' +
                '</div>' +
            '</div>' +

            // Engagement (shown only for published articles)
            '<div class="ad-form-card" id="adNewsEngagement" style="display:none">' +
                '<div class="ad-form-card-title">' + L.engagement + '</div>' +
                '<div class="ad-engagement-stats">' +
                    '<div class="ad-engagement-item">&#128065; <span id="adEngViews">0</span></div>' +
                    '<div id="adEngReactions" style="display:contents"></div>' +
                '</div>' +
                '<div id="adNewsPollStats"></div>' +
            '</div>' +

            // Title + Slug
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsTitle + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitle" placeholder="' + L.newsTitle + ' (RU)" value="' + A.esc(article ? article.title : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitleEn" placeholder="' + L.newsTitle + ' (EN)" value="' + A.esc(article ? article.title_en : '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsTitleKg" placeholder="' + L.newsTitle + ' (KG)" value="' + A.esc(article ? article.title_kg : '') + '">' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adNewsTitle" data-en="adNewsTitleEn" data-kg="adNewsTitleKg">&#127760; ' + L.translateAllBtn + '</button>' +
                '<div class="ad-field">' +
                    '<label class="ad-field-label">' + L.newsSlug + '</label>' +
                    '<input type="text" class="ad-field-input" id="adNewsSlug" placeholder="my-article-slug" value="' + A.esc(article ? article.slug : '') + '">' +
                    '<div class="ad-field-hint">' + L.slugHint + '</div>' +
                '</div>' +
            '</div>' +

            // Excerpt
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsExcerpt + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerpt" placeholder="' + L.newsExcerpt + ' (RU)">' + A.esc(article ? article.excerpt : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerptEn" placeholder="' + L.newsExcerpt + ' (EN)">' + A.esc(article ? article.excerpt_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea" id="adNewsExcerptKg" placeholder="' + L.newsExcerpt + ' (KG)">' + A.esc(article ? article.excerpt_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adNewsExcerpt" data-en="adNewsExcerptEn" data-kg="adNewsExcerptKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Content
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.newsContent + '</div>' +
                '<div class="ad-lang-tabs">' +
                    '<button class="ad-lang-tab active" data-lang="ru">RU</button>' +
                    '<button class="ad-lang-tab" data-lang="en">EN</button>' +
                    '<button class="ad-lang-tab" data-lang="kg">KG</button>' +
                '</div>' +
                '<div class="ad-lang-panel active" data-lang-panel="ru">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContent" placeholder="' + L.newsContent + ' (RU)">' + A.esc(article ? article.content : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="en">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContentEn" placeholder="' + L.newsContent + ' (EN)">' + A.esc(article ? article.content_en : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<div class="ad-lang-panel" data-lang-panel="kg">' +
                    '<div class="ad-field">' +
                        '<textarea class="ad-field-input ad-field-textarea ad-field-textarea-lg" id="adNewsContentKg" placeholder="' + L.newsContent + ' (KG)">' + A.esc(article ? article.content_kg : '') + '</textarea>' +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn-translate-all" data-ru="adNewsContent" data-en="adNewsContentEn" data-kg="adNewsContentKg">&#127760; ' + L.translateAllBtn + '</button>' +
            '</div>' +

            // Content Preview (WYSIWYG with inline photos)
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.contentPreview + '</div>' +
                '<div id="adNewsPreview"></div>' +
                '<input type="file" accept="image/jpeg,image/png" id="adNewsContentImgInput" style="display:none">' +
            '</div>' +

            // Meta: category, author, executor, date
            '<div class="ad-form-card">' +
                '<div class="ad-field-row-4 ad-field-row">' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsCategory + '</label>' +
                        '<select class="ad-field-input" id="adNewsCat">' +
                            '<option value="">' + L.selectCategory + '</option>' +
                            '<option value="results"' + A.sel(article, 'category', 'results') + '>' + A.CATEGORIES.results + '</option>' +
                            '<option value="interview"' + A.sel(article, 'category', 'interview') + '>' + A.CATEGORIES.interview + '</option>' +
                            '<option value="announcement"' + A.sel(article, 'category', 'announcement') + '>' + A.CATEGORIES.announcement + '</option>' +
                            '<option value="world"' + A.sel(article, 'category', 'world') + '>' + A.CATEGORIES.world + '</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsAuthor + '</label>' +
                        '<input type="text" class="ad-field-input" id="adNewsAuthor" value="' + A.esc(article ? article.author : 'KSLT Media') + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsExecutor + '</label>' +
                        '<input type="text" class="ad-field-input" id="adNewsExecutor" value="' + A.esc(article ? (article.executor || '') : (localStorage.getItem('kslt_name') || '')) + '">' +
                    '</div>' +
                    '<div class="ad-field">' +
                        '<label class="ad-field-label">' + L.newsPublishedAt + '</label>' +
                        '<input type="date" class="ad-field-input" id="adNewsPubDate" value="' + (article && article.published_at ? article.published_at.substring(0, 10) : '') + '">' +
                    '</div>' +
                '</div>' +
            '</div>' +

            // Poll
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.pollSection + '</div>' +
                '<div id="adNewsPollBody" style="display:none">' +
                    '<div class="ad-field">' +
                        '<input type="text" class="ad-field-input" id="adNewsPollQ" placeholder="' + L.pollQuestion + '">' +
                    '</div>' +
                    '<div id="adNewsPollOptions"></div>' +
                    '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsPollAddOpt">' + L.pollAdd + '</button>' +
                '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsPollToggle">' +
                    (newsPollData ? L.pollRemove : L.pollEnable) +
                '</button>' +
            '</div>' +

            // Reactions config
            '<div class="ad-form-card">' +
                '<div class="ad-form-card-title">' + L.reactionsSection + '</div>' +
                '<div id="adNewsReactionsBody" style="' + (reactionsEnabled ? '' : 'display:none') + '">' +
                    '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px">' +
                        EMOJI_KEYS.map(function(key) {
                            var info = EMOJI_MAP[key];
                            return '<button type="button" class="ad-reaction-tile' + (reactionsTypes.indexOf(key) !== -1 ? ' active' : '') + '" data-type="' + key + '">' +
                                '<span style="font-size:1.5em">' + info.emoji + '</span><span>' + info.label + '</span>' +
                            '</button>';
                        }).join('') +
                    '</div>' +
                '</div>' +
                '<button type="button" class="ad-btn ad-btn-secondary ad-btn-sm" id="adNewsReactionsToggle">' +
                    (reactionsEnabled ? L.reactionsDisable : L.reactionsEnable) +
                '</button>' +
            '</div>' +

            // Actions
            '<div class="ad-btn-row">' +
                '<button class="ad-btn ad-btn-secondary" id="adNewsSave">' + L.save + '</button>' +
                '<button class="ad-btn ad-btn-primary" id="adNewsPublish">' + (newsEditingPublishedAt ? L.update : L.publish) + '</button>' +
                (newsEditingId ? '<button class="ad-btn ad-btn-danger" id="adNewsDelete">' + L.delete + '</button>' : '') +
                '<span class="ad-draft-status" id="adDraftStatus">' + (function() {
                    if (!article) return '';
                    var ts = article.updated_at || article.published_at || article.created_at;
                    if (!ts) return '';
                    var d = new Date(ts);
                    var dd = String(d.getDate()).padStart(2, '0');
                    var mo = String(d.getMonth() + 1).padStart(2, '0');
                    var hh = String(d.getHours()).padStart(2, '0');
                    var mm = String(d.getMinutes()).padStart(2, '0');
                    return '\u2713 ' + (isEn ? 'Last saved' : 'Сохранено') + ' ' + dd + '.' + mo + ' ' + hh + ':' + mm;
                })() + '</span>' +
            '</div>';

        // --- Event Listeners ---

        // Back (with unsaved changes protection)
        document.getElementById('adNewsBack').addEventListener('click', function() {
            if (newsDraftDirty) {
                A.showConfirm(L.unsavedChanges, L.unsavedChangesText, function() {
                    newsDraftDirty = false;
                    A.setAdminHash('content');
                    renderNewsList();
                }, L.unsavedLeaveBtn);
            } else {
                A.setAdminHash('content');
                renderNewsList();
            }
        });

        // Lang tabs (delegate) + auto-copy
        container.addEventListener('click', function(e) {
            var tab = e.target.closest('.ad-lang-tab');
            if (!tab) return;
            var lang = tab.dataset.lang;
            var card = tab.closest('.ad-form-card');
            if (!card) return;
            card.querySelectorAll('.ad-lang-tab').forEach(function(t) { t.classList.toggle('active', t.dataset.lang === lang); });
            card.querySelectorAll('.ad-lang-panel').forEach(function(p) { p.classList.toggle('active', p.dataset.langPanel === lang); });

            // Auto-copy: if target field is empty, copy from first non-empty panel
            var activePanel = card.querySelector('.ad-lang-panel.active');
            if (!activePanel) return;
            var field = activePanel.querySelector('textarea, input.ad-field-input');
            if (field && !field.value.trim()) {
                card.querySelectorAll('.ad-lang-panel').forEach(function(p) {
                    if (p === activePanel) return;
                    var src = p.querySelector('textarea, input.ad-field-input');
                    if (src && src.value.trim() && !field.value.trim()) {
                        field.value = src.value;
                        field.classList.add('ad-auto-copied');
                    }
                });
            }
        });

        // Remove auto-copied hint on focus
        container.addEventListener('focus', function(e) {
            if (e.target.classList && e.target.classList.contains('ad-auto-copied')) {
                e.target.classList.remove('ad-auto-copied');
            }
        }, true);

        // Translate ALL — 3-language "translate to empty" buttons (delegate)
        container.addEventListener('click', function(e) {
            var btn = e.target.closest('.ad-btn-translate-all');
            if (!btn) return;
            A.translateToEmpty(btn.dataset.ru, btn.dataset.en, btn.dataset.kg, btn);
        });

        // Визуальный редактор поверх полей с текстом — менеджер не видит тегов
        ['adNewsContent', 'adNewsContentEn', 'adNewsContentKg'].forEach(function(id) {
            if (A.attachEditor) A.attachEditor(id);
        });

        // Auto-slug from title
        var titleInput = document.getElementById('adNewsTitle');
        var slugInput = document.getElementById('adNewsSlug');
        if (titleInput && slugInput && !newsEditingId) {
            titleInput.addEventListener('input', function() {
                slugInput.value = A.slugify(titleInput.value);
            });
        }

        // Meta preview live update
        var MONTHS_RU = ['Января','Февраля','Марта','Апреля','Мая','Июня','Июля','Августа','Сентября','Октября','Ноября','Декабря'];
        var MONTHS_EN = ['January','February','March','April','May','June','July','August','September','October','November','December'];
        function updateMetaPreview() {
            var dateEl = document.getElementById('adMetaDate');
            var authorEl = document.getElementById('adMetaAuthor');
            var readEl = document.getElementById('adMetaReadTime');
            var pubInput = document.getElementById('adNewsPubDate');
            var authorInput = document.getElementById('adNewsAuthor');
            var contentInput = document.getElementById('adNewsContent');
            if (dateEl && pubInput && pubInput.value) {
                var d = new Date(pubInput.value + 'T12:00:00');
                var months = isEn ? MONTHS_EN : MONTHS_RU;
                dateEl.textContent = d.getDate() + ' ' + months[d.getMonth()] + ' ' + d.getFullYear();
            } else if (dateEl) {
                dateEl.textContent = L.newsDraft;
            }
            if (authorEl && authorInput) {
                authorEl.textContent = authorInput.value.trim() || 'KSLT Media';
            }
            if (readEl && contentInput) {
                var words = contentInput.value.trim().split(/\s+/).filter(function(w) { return w; }).length;
                readEl.textContent = Math.max(1, Math.ceil(words / 200));
            }
        }
        ['adNewsPubDate', 'adNewsAuthor', 'adNewsContent'].forEach(function(id) {
            var el = document.getElementById(id);
            if (el) el.addEventListener('input', updateMetaPreview);
        });
        updateMetaPreview();

        // Load engagement stats for existing published articles
        if (article && article.id && article.published_at && A.client) {
            (async function() {
                var engCard = document.getElementById('adNewsEngagement');
                if (!engCard) return;

                // View count (from article data — already in select('*'))
                var viewsEl = document.getElementById('adEngViews');
                if (viewsEl) viewsEl.textContent = article.view_count || 0;

                // Reaction counts (dynamic RPC: rows of {reaction_type, count})
                var countsRes = await A.client.rpc('get_reaction_counts', { p_news_id: article.id });
                var engReactionsEl = document.getElementById('adEngReactions');
                if (countsRes.data && countsRes.data.length && engReactionsEl) {
                    var html = '';
                    countsRes.data.forEach(function(row) {
                        var info = EMOJI_MAP[row.reaction_type];
                        if (info && row.count > 0) {
                            html += '<div class="ad-engagement-item">' + info.emoji + ' <span>' + row.count + '</span></div>';
                        }
                    });
                    engReactionsEl.innerHTML = html;
                }

                // Poll results
                var pollStatsEl = document.getElementById('adNewsPollStats');
                if (pollStatsEl && article.poll && article.poll.options && article.poll.options.length) {
                    var pollRes = await A.client.rpc('get_poll_results', { p_news_id: article.id });
                    var votes = [];
                    for (var pi = 0; pi < article.poll.options.length; pi++) votes.push(0);
                    if (pollRes.data) {
                        pollRes.data.forEach(function(row) {
                            if (row.option_index >= 0 && row.option_index < votes.length) {
                                votes[row.option_index] = row.count || 0;
                            }
                        });
                    }
                    var totalV = votes.reduce(function(a, b) { return a + b; }, 0);
                    var pollHtml = '<div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border-color);">' +
                        '<div style="font-weight:500;margin-bottom:8px;">' + A.esc(article.poll.question || '') + '</div>';
                    for (var vi = 0; vi < article.poll.options.length; vi++) {
                        var pct = totalV > 0 ? Math.round((votes[vi] / totalV) * 100) : 0;
                        pollHtml += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px;">' +
                            '<span style="color:var(--text-secondary);">' + A.esc(article.poll.options[vi]) + '</span>' +
                            '<span style="color:var(--accent);font-weight:500;">' + pct + '% (' + votes[vi] + ')</span>' +
                        '</div>';
                    }
                    pollHtml += '<div style="margin-top:8px;color:var(--text-dim);font-size:0.85rem;">' + L.totalVotes + ': ' + totalV + '</div></div>';
                    pollStatsEl.innerHTML = pollHtml;
                }

                engCard.style.display = '';
            })();
        }

        // Image upload zone
        var imgZone = document.getElementById('adNewsImgZone');
        var imgInput = document.getElementById('adNewsImgInput');

        imgZone.addEventListener('click', function(e) {
            if (e.target.closest('.ad-image-upload-remove')) return;
            imgInput.click();
        });

        imgInput.addEventListener('change', function() {
            if (imgInput.files && imgInput.files[0]) {
                newsImageFile = imgInput.files[0];
                previewNewsImage(URL.createObjectURL(newsImageFile));
            }
        });

        // Drag & drop
        imgZone.addEventListener('dragover', function(e) { e.preventDefault(); imgZone.style.borderColor = 'var(--accent)'; });
        imgZone.addEventListener('dragleave', function() { imgZone.style.borderColor = ''; });
        imgZone.addEventListener('drop', function(e) {
            e.preventDefault();
            imgZone.style.borderColor = '';
            if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                newsImageFile = e.dataTransfer.files[0];
                imgInput.files = e.dataTransfer.files;
                previewNewsImage(URL.createObjectURL(newsImageFile));
            }
        });

        // Remove image
        setupImgRemove();

        // URL apply
        document.getElementById('adNewsImgUrlBtn').addEventListener('click', function() {
            var url = document.getElementById('adNewsImgUrl').value.trim();
            if (url) {
                newsImageFile = null;
                newsImageUrl = url;
                previewNewsImage(url);
            }
        });

        // Content Preview: render + live update
        renderNewsPreview();
        var previewTimer = null;
        var contentTextarea = document.getElementById('adNewsContent');
        if (contentTextarea) {
            contentTextarea.addEventListener('input', function() {
                clearTimeout(previewTimer);
                previewTimer = setTimeout(renderNewsPreview, 300);
            });
        }

        // Content Preview: file input handler
        var contentImgInput = document.getElementById('adNewsContentImgInput');
        contentImgInput.addEventListener('change', function() {
            var files = this.files;
            if (!files || !files[0]) return;
            var afterPar = parseInt(this.dataset.afterParagraph, 10) || 1;
            var file = files[0];
            newsContentImages.push({ url: URL.createObjectURL(file), after_paragraph: afterPar });
            newsContentImageFiles.push(file);
            renderNewsPreview();
            this.value = '';
        });

        // Content Preview: delegated clicks (insert photo + remove photo)
        document.getElementById('adNewsPreview').addEventListener('click', function(e) {
            // Insert photo from file
            var insertBtn = e.target.closest('.ad-preview-insert-btn');
            if (insertBtn) {
                var afterPar = parseInt(insertBtn.dataset.afterParagraph, 10) || 1;
                contentImgInput.dataset.afterParagraph = afterPar;
                contentImgInput.click();
                return;
            }
            // Insert photo from URL
            var urlBtn = e.target.closest('.ad-preview-insert-url-btn');
            if (urlBtn) {
                var afterPar = parseInt(urlBtn.dataset.afterParagraph, 10) || 1;
                var url = prompt(isEn ? 'Paste image URL:' : 'Вставьте URL изображения:');
                if (url && url.trim()) {
                    newsContentImages.push({ url: url.trim(), after_paragraph: afterPar });
                    newsContentImageFiles.push(null);
                    renderNewsPreview();
                }
                return;
            }
            // Remove photo button
            var rmBtn = e.target.closest('.ad-preview-img-remove');
            if (rmBtn) {
                var imgAfter = parseInt(rmBtn.dataset.afterParagraph, 10);
                var imgIdx = parseInt(rmBtn.dataset.imgIdx, 10);
                // Find and remove from arrays
                var removeAt = -1;
                var count = 0;
                for (var i = 0; i < newsContentImages.length; i++) {
                    if (newsContentImages[i].after_paragraph === imgAfter) {
                        if (count === imgIdx) { removeAt = i; break; }
                        count++;
                    }
                }
                if (removeAt >= 0) {
                    newsContentImages.splice(removeAt, 1);
                    newsContentImageFiles.splice(removeAt, 1);
                }
                renderNewsPreview();
            }
        });

        // Poll: init display
        if (newsPollData) {
            document.getElementById('adNewsPollBody').style.display = '';
            document.getElementById('adNewsPollQ').value = newsPollData.question;
            renderNewsPollOptions();
        }

        // Poll: toggle
        document.getElementById('adNewsPollToggle').addEventListener('click', function() {
            if (newsPollData) {
                newsPollData = null;
                document.getElementById('adNewsPollBody').style.display = 'none';
                this.textContent = L.pollEnable;
            } else {
                newsPollData = { question: '', options: ['', ''] };
                document.getElementById('adNewsPollBody').style.display = '';
                document.getElementById('adNewsPollQ').value = '';
                renderNewsPollOptions();
                this.textContent = L.pollRemove;
            }
        });

        // Poll: add option
        document.getElementById('adNewsPollAddOpt').addEventListener('click', function() {
            if (!newsPollData) return;
            newsPollData.options.push('');
            renderNewsPollOptions();
        });

        // Poll: question input
        document.getElementById('adNewsPollQ').addEventListener('input', function() {
            if (newsPollData) newsPollData.question = this.value;
        });

        // Poll: delegated remove + option input
        document.getElementById('adNewsPollOptions').addEventListener('click', function(e) {
            var rmBtn = e.target.closest('.ad-poll-opt-remove');
            if (!rmBtn || !newsPollData) return;
            if (newsPollData.options.length <= 2) return;
            var idx = parseInt(rmBtn.dataset.idx, 10);
            newsPollData.options.splice(idx, 1);
            renderNewsPollOptions();
        });
        document.getElementById('adNewsPollOptions').addEventListener('input', function(e) {
            if (!e.target.classList.contains('ad-poll-opt-input') || !newsPollData) return;
            var idx = parseInt(e.target.dataset.idx, 10);
            newsPollData.options[idx] = e.target.value;
        });

        // Reactions: master toggle (button like Poll)
        document.getElementById('adNewsReactionsToggle').addEventListener('click', function() {
            var body = document.getElementById('adNewsReactionsBody');
            var isVisible = body.style.display !== 'none';
            if (isVisible) {
                body.style.display = 'none';
                this.textContent = L.reactionsEnable;
            } else {
                body.style.display = '';
                this.textContent = L.reactionsDisable;
            }
        });

        // Reactions: tile click toggle
        container.addEventListener('click', function(e) {
            var tile = e.target.closest('.ad-reaction-tile');
            if (!tile) return;
            tile.classList.toggle('active');
        });

        // Save (draft)
        document.getElementById('adNewsSave').addEventListener('click', function() { saveNewsHandler(false); });

        // Publish / Update
        document.getElementById('adNewsPublish').addEventListener('click', function() { saveNewsHandler(true); });

        // Delete
        var delBtn = document.getElementById('adNewsDelete');
        if (delBtn) {
            delBtn.addEventListener('click', function() {
                A.showConfirm(L.deleteConfirm, L.deleteConfirmText, function() {
                    deleteNewsHandler();
                });
            });
        }

        // ---- Autosave to Supabase ----
        newsDraftDirty = false;

        function collectDraftData() {
            return {
                title: (document.getElementById('adNewsTitle') || {}).value || '',
                title_en: (document.getElementById('adNewsTitleEn') || {}).value || '',
                title_kg: (document.getElementById('adNewsTitleKg') || {}).value || '',
                slug: (document.getElementById('adNewsSlug') || {}).value || '',
                excerpt: (document.getElementById('adNewsExcerpt') || {}).value || '',
                excerpt_en: (document.getElementById('adNewsExcerptEn') || {}).value || '',
                excerpt_kg: (document.getElementById('adNewsExcerptKg') || {}).value || '',
                content: cleanHtml((document.getElementById('adNewsContent') || {}).value || ''),
                content_en: cleanHtml((document.getElementById('adNewsContentEn') || {}).value || ''),
                content_kg: cleanHtml((document.getElementById('adNewsContentKg') || {}).value || ''),
                category: (document.getElementById('adNewsCat') || {}).value || '',
                author: (document.getElementById('adNewsAuthor') || {}).value || '',
                executor: (document.getElementById('adNewsExecutor') || {}).value || '',
                image: newsImageUrl || null,
                content_images: newsContentImages.filter(function(ci) { return ci.url && !ci.url.startsWith('blob:'); }),
                poll: newsPollData,
                published_at: null,
                reactions_config: (function() {
                    var body = document.getElementById('adNewsReactionsBody');
                    if (body && body.style.display === 'none') return [];
                    var types = [];
                    document.querySelectorAll('.ad-reaction-tile.active').forEach(function(tile) { types.push(tile.dataset.type); });
                    return types;
                })()
            };
        }

        var autosaveTimer = null;
        var autosaving = false;

        async function autosaveDraft() {
            var title = (document.getElementById('adNewsTitle') || {}).value || '';
            if (!title.trim()) return; // Don't save empty drafts

            if (autosaving) return;
            autosaving = true;

            try {
                var data = collectDraftData();
                if (!data.slug) data.slug = A.slugify(data.title);

                var result;
                if (newsEditingId) {
                    result = await A.client.from('news').update(data).eq('id', newsEditingId);
                } else {
                    data.id = crypto.randomUUID();
                    result = await A.client.from('news').insert(data);
                    if (!result.error) {
                        newsEditingId = data.id;
                    }
                }

                if (!result.error) {
                    newsDraftDirty = false;
                    var statusEl = document.getElementById('adDraftStatus');
                    if (statusEl) {
                        var now = new Date();
                        var hh = String(now.getHours()).padStart(2, '0');
                        var mm = String(now.getMinutes()).padStart(2, '0');
                        statusEl.textContent = '\u2713 ' + L.draftSaved + ' ' + hh + ':' + mm;
                    }
                }
            } catch (e) {
                console.error('Autosave error:', e);
            }
            autosaving = false;
        }

        container.addEventListener('input', function(e) {
            if (!e.target.closest('.ad-form-card, .ad-field')) return;
            newsDraftDirty = true;
            clearTimeout(autosaveTimer);
            autosaveTimer = setTimeout(autosaveDraft, 3000);
        });
    }

    function previewNewsImage(src) {
        var zone = document.getElementById('adNewsImgZone');
        if (!zone) return;
        zone.classList.add('has-image');
        zone.innerHTML =
            '<img src="' + A.esc(src) + '" class="ad-image-upload-preview" id="adNewsImgPreview">' +
            '<button type="button" class="ad-image-upload-remove" id="adNewsImgRemove">&times;</button>';
        setupImgRemove();
    }

    function setupImgRemove() {
        var rmBtn = document.getElementById('adNewsImgRemove');
        if (rmBtn) {
            rmBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                newsImageFile = null;
                newsImageUrl = '';
                var zone = document.getElementById('adNewsImgZone');
                zone.classList.remove('has-image');
                zone.innerHTML =
                    '<div class="ad-image-upload-placeholder">' +
                        '<div class="ad-image-upload-icon">🖼</div>' +
                        '<div>' + L.uploadImage + '</div>' +
                        '<div class="ad-field-hint">' + L.uploadHint + '</div>' +
                    '</div>';
                document.getElementById('adNewsImgUrl').value = '';
                document.getElementById('adNewsImgInput').value = '';
            });
        }
    }

    // ---- Content Preview (WYSIWYG) ----
    function renderNewsPreview() {
        var container = document.getElementById('adNewsPreview');
        if (!container) return;

        var textEl = document.getElementById('adNewsContent');
        var text = textEl ? textEl.value.trim() : '';

        if (!text) {
            container.innerHTML = '<div style="color:var(--text-secondary);font-size:0.92em;padding:20px 0;text-align:center">' +
                (isEn ? 'Start typing content to see preview' : 'Начните вводить текст для предпросмотра') + '</div>';
            return;
        }

        // Показываем то же, что увидит читатель. Фото и видео вставляются
        // прямо в текст кнопками редактора, поэтому отдельных кнопок «+ Фото»
        // под абзацами больше нет — они появлялись там, где текст ещё резался
        // на куски по пустым строкам.
        container.innerHTML = '<div class="ad-news-preview-body">' + text + '</div>';
    }

    function renderNewsPollOptions() {
        var container = document.getElementById('adNewsPollOptions');
        if (!container || !newsPollData) return;
        var html = '';
        newsPollData.options.forEach(function(opt, idx) {
            html += '<div style="display:flex;align-items:center;gap:8px;margin:4px 0">' +
                '<span style="color:var(--text-secondary);font-size:0.85em;min-width:20px">' + (idx + 1) + '.</span>' +
                '<input type="text" class="ad-field-input ad-poll-opt-input" data-idx="' + idx + '" value="' + A.esc(opt) + '" placeholder="' + L.pollOption + ' ' + (idx + 1) + '" style="flex:1">' +
                (newsPollData.options.length > 2 ? '<button type="button" class="ad-gallery-remove ad-poll-opt-remove" data-idx="' + idx + '" style="position:static;width:24px;height:24px;font-size:14px">&times;</button>' : '') +
            '</div>';
        });
        container.innerHTML = html;
    }

    // ---- Save News ----
    async function saveNewsHandler(doPublish) {
        var saveBtn = document.getElementById('adNewsSave');
        var pubBtn = document.getElementById('adNewsPublish');
        var activeBtn = doPublish ? pubBtn : saveBtn;
        activeBtn.disabled = true;
        activeBtn.textContent = L.saving;

        try {
            // Upload cover image if file selected
            var imageUrl = newsImageUrl;
            if (newsImageFile) {
                imageUrl = await A.uploadImage(newsImageFile, '');
                if (!imageUrl) {
                    activeBtn.disabled = false;
                    activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                    return;
                }
            }

            // Upload new content image files
            var contentImagesFinal = [];
            for (var ci = 0; ci < newsContentImages.length; ci++) {
                var ciUrl = newsContentImages[ci].url;
                if (newsContentImageFiles[ci]) {
                    var ciUploaded = await A.uploadImage(newsContentImageFiles[ci], '');
                    if (ciUploaded) {
                        ciUrl = ciUploaded;
                    } else {
                        continue; // Skip failed uploads, don't save blob URL
                    }
                }
                // Skip blob URLs (shouldn't happen but safety check)
                if (ciUrl && ciUrl.startsWith('blob:')) continue;
                if (ciUrl) {
                    contentImagesFinal.push({ url: ciUrl, after_paragraph: newsContentImages[ci].after_paragraph || 1 });
                }
            }

            // Collect poll data
            var pollFinal = null;
            if (newsPollData && newsPollData.question && newsPollData.question.trim()) {
                var filteredOpts = newsPollData.options.filter(function(o) { return o && o.trim(); });
                if (filteredOpts.length >= 2) {
                    pollFinal = { question: newsPollData.question.trim(), options: filteredOpts };
                }
            }

            // Collect reactions config
            var reactionsConfig = null;
            var reactBody = document.getElementById('adNewsReactionsBody');
            if (reactBody && reactBody.style.display === 'none') {
                reactionsConfig = [];
            } else {
                var checkedTypes = [];
                document.querySelectorAll('.ad-reaction-tile.active').forEach(function(tile) {
                    checkedTypes.push(tile.dataset.type);
                });
                reactionsConfig = checkedTypes;
            }

            // Determine published_at (date from field, time preserved internally)
            var pubDateInput = document.getElementById('adNewsPubDate').value; // YYYY-MM-DD or ''
            var publishedAt;
            if (doPublish) {
                if (pubDateInput) {
                    // Use selected date + current time for tracking
                    var now = new Date();
                    publishedAt = pubDateInput + 'T' + String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0') + ':00.000Z';
                    // If already published, keep original time
                    if (newsEditingPublishedAt && newsEditingPublishedAt.substring(0, 10) === pubDateInput) {
                        publishedAt = newsEditingPublishedAt;
                    }
                } else {
                    publishedAt = newsEditingPublishedAt || new Date().toISOString();
                }
            } else {
                // Save draft: keep existing published_at or null
                if (pubDateInput && newsEditingPublishedAt) {
                    publishedAt = newsEditingPublishedAt;
                } else {
                    publishedAt = null;
                }
            }

            var data = {
                title: document.getElementById('adNewsTitle').value.trim(),
                title_en: document.getElementById('adNewsTitleEn').value.trim(),
                title_kg: document.getElementById('adNewsTitleKg').value.trim(),
                slug: document.getElementById('adNewsSlug').value.trim(),
                excerpt: document.getElementById('adNewsExcerpt').value.trim(),
                excerpt_en: document.getElementById('adNewsExcerptEn').value.trim(),
                excerpt_kg: document.getElementById('adNewsExcerptKg').value.trim(),
                // Разметку чистим на входе: что бы менеджер ни вставил из Word
                // или Телеграма, в базе лежит одинаковый текст
                content: cleanHtml(document.getElementById('adNewsContent').value),
                content_en: cleanHtml(document.getElementById('adNewsContentEn').value),
                content_kg: cleanHtml(document.getElementById('adNewsContentKg').value),
                image: imageUrl || null,
                content_images: contentImagesFinal,
                poll: pollFinal,
                category: document.getElementById('adNewsCat').value,
                author: document.getElementById('adNewsAuthor').value.trim(),
                executor: document.getElementById('adNewsExecutor').value.trim(),
                published_at: publishedAt,
                reactions_config: reactionsConfig
            };

            if (!data.title) {
                A.showToast(isEn ? 'Title is required' : 'Заголовок обязателен', 'error');
                activeBtn.disabled = false;
                activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                return;
            }

            if (!data.slug) {
                data.slug = A.slugify(data.title);
            }

            var result;
            if (newsEditingId) {
                result = await A.client.from('news').update(data).eq('id', newsEditingId);
            } else {
                data.id = crypto.randomUUID();
                result = await A.client.from('news').insert(data);
            }

            if (result.error) {
                A.showToast(result.error.message, 'error');
                activeBtn.disabled = false;
                activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
                return;
            }

            newsDraftDirty = false;
            // Update editing state for new articles
            if (!newsEditingId && data.id) {
                newsEditingId = data.id;
            }
            if (doPublish && publishedAt) {
                newsEditingPublishedAt = publishedAt;
            }

            // Update content images — replace blob URLs with uploaded URLs
            newsContentImages = contentImagesFinal.slice();
            newsContentImageFiles = [];
            for (var fi = 0; fi < newsContentImages.length; fi++) newsContentImageFiles.push(null);

            // Update cover image URL
            if (imageUrl) newsImageUrl = imageUrl;
            newsImageFile = null;

            A.showToast(L.saved, 'success');
            activeBtn.disabled = false;
            activeBtn.textContent = doPublish ? L.update : L.save;

            // Show last saved timestamp
            var statusEl = document.getElementById('adDraftStatus');
            if (statusEl) {
                var now = new Date();
                var hh = String(now.getHours()).padStart(2, '0');
                var mm = String(now.getMinutes()).padStart(2, '0');
                statusEl.textContent = '\u2713 ' + L.saved + ' ' + hh + ':' + mm;
            }
        } catch (e) {
            A.showToast(e.message || 'Error', 'error');
            activeBtn.disabled = false;
            activeBtn.textContent = doPublish ? (newsEditingPublishedAt ? L.update : L.publish) : L.save;
        }
    }

    // ---- Delete News ----
    async function deleteNewsHandler() {
        if (!newsEditingId) return;
        var result = await A.client.from('news').delete().eq('id', newsEditingId);
        if (result.error) {
            A.showToast(result.error.message, 'error');
            return;
        }
        A.showToast(isEn ? 'Deleted' : 'Удалено', 'success');
        renderNewsList();
    }


    // ---- Export to namespace ----
    A.renderNewsSection = renderNewsSection;
    A.renderNewsList = renderNewsList;
    A.loadAndEditNews = loadAndEditNews;

})();
