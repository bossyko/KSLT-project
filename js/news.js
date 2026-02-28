// ========================================
// NEWS — Supabase + Static Fallback
// ========================================

function esc(str) {
    if (!str) return '';
    return String(str).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

document.addEventListener('DOMContentLoaded', function() {
    var urlParams = new URLSearchParams(window.location.search);
    var slug = urlParams.get('slug');

    if (slug) {
        updateLangLinks(slug);
    }

    // Try Supabase first, fallback to static data
    var client = window.supabaseClient;
    if (client) {
        initFromSupabase(client, slug);
    } else {
        initFromStatic(slug);
    }
});

// ========================================
// SUPABASE FETCH LAYER
// ========================================

function mapDbArticle(row) {
    var isEn = isEnPage();
    var title = isEn ? (row.title_en || row.title) : row.title;
    var content = isEn ? (row.content_en || row.content) : row.content;
    var excerpt = isEn ? (row.excerpt_en || row.excerpt) : row.excerpt;

    var catLabels = isEn
        ? { results: 'Report', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' }
        : { results: 'Репортаж', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' };

    var dateStr = '';
    if (row.published_at) {
        var d = new Date(row.published_at);
        dateStr = d.toLocaleDateString(isEn ? 'en-US' : 'ru-RU', {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Convert plain text content to blocks (paragraphs by double newline)
    var contentBlocks = [];
    if (content) {
        content.split(/\n\n+/).forEach(function(para) {
            para = para.trim();
            if (para) {
                contentBlocks.push({ type: 'paragraph', text: para });
            }
        });
    }

    return {
        slug: row.slug,
        title: title,
        subtitle: excerpt || '',
        heroImage: row.image || 'https://placehold.co/1200x600/1a1a1a/CCFF00?text=KSLT',
        date: dateStr,
        author: row.author || 'KSLT',
        category: row.category || 'announcement',
        categoryLabel: catLabels[row.category] || row.category,
        content: contentBlocks,
        gallery: (row.gallery && Array.isArray(row.gallery)) ? row.gallery : [],
        content_images: (row.content_images && Array.isArray(row.content_images)) ? row.content_images : [],
        poll: row.poll || null,
        tags: [],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: [],
        _publishedAt: row.published_at || row.created_at || ''
    };
}

async function initFromSupabase(client, slug) {
    try {
        if (!slug) {
            // News list — fetch all published
            var result = await client.from('news')
                .select('*')
                .not('published_at', 'is', null)
                .order('published_at', { ascending: false });

            if (result.error) throw result.error;

            // Merge: keep static examples, add DB articles on top
            if (typeof newsArticleData === 'undefined') window.newsArticleData = {};
            (result.data || []).forEach(function(row) {
                var article = mapDbArticle(row);
                newsArticleData[article.slug] = article;
            });

            renderNewsList();
        } else {
            // Article detail — fetch single by slug
            var result = await client.from('news')
                .select('*')
                .eq('slug', slug)
                .not('published_at', 'is', null)
                .single();

            if (result.error) throw result.error;

            var article = mapDbArticle(result.data);

            // Fetch 3 related articles (latest, excluding current)
            var relResult = await client.from('news')
                .select('*')
                .not('published_at', 'is', null)
                .neq('id', result.data.id)
                .order('published_at', { ascending: false })
                .limit(3);

            if (typeof newsArticleData === 'undefined') window.newsArticleData = {};
            newsArticleData[article.slug] = article;

            if (relResult.data && relResult.data.length) {
                relResult.data.forEach(function(row) {
                    var rel = mapDbArticle(row);
                    newsArticleData[rel.slug] = rel;
                });
                article.relatedSlugs = relResult.data.map(function(r) { return r.slug; });
            }

            document.title = 'KSLT — ' + article.title;
            var readTime = calculateReadTime(article);

            renderProgressBar();
            renderHero(article, readTime);
            renderContent(article);
            renderTags(article);
            renderReactions(article);
            renderRelated(article);

            initProgressBar();
            initParallax();
            initScrollAnimations();
            initReactions(slug);
            initPoll(slug);
        }
    } catch (e) {
        console.error('Supabase news error:', e);
        initFromStatic(slug);
    }
}

// ========================================
// STATIC DATA FALLBACK
// ========================================

function initFromStatic(slug) {
    if (typeof newsArticleData === 'undefined') {
        window.newsArticleData = {};
    }

    if (!slug) {
        renderNewsList();
        return;
    }

    if (!newsArticleData[slug]) {
        renderNotFound();
        return;
    }

    var article = newsArticleData[slug];
    document.title = 'KSLT — ' + article.title;
    var readTime = calculateReadTime(article);

    renderProgressBar();
    renderHero(article, readTime);
    renderContent(article);
    renderTags(article);
    renderReactions(article);
    renderRelated(article);

    initProgressBar();
    initParallax();
    initScrollAnimations();
    initReactions(slug);
    initPoll(slug);
}

// ========================================
// HELPERS
// ========================================

function getLabels() {
    return typeof window.newsLabels !== 'undefined' ? window.newsLabels : {
        backToNews: "Назад к новостям",
        readTime: "мин чтения",
        relatedTitle: "Похожие статьи",
        reactionsTitle: "Оцените статью",
        tagsTitle: "Теги",
        notFoundTitle: "Статья не найдена",
        notFoundText: "Запрашиваемая статья не существует или была удалена.",
        notFoundBtn: "На главную",
        pollVote: "Голосовать",
        pollVoted: "Вы проголосовали!",
        pollTotal: "голосов",
        sponsorsTitle: "Партнёры и спонсоры",
        sponsorsGeneral: "Генеральный спонсор",
        newsListTitle: "Новости",
        newsListSubtitle: "Последние новости из мира тенниса в Кыргызстане",
        featuredLabel: "Главное",
        readMore: "Читать",
        allArticles: "Все статьи",
        filterAll: "Все"
    };
}

function calculateReadTime(article) {
    var wordCount = 0;
    article.content.forEach(function(block) {
        if (block.type === 'paragraph' || block.type === 'heading') {
            wordCount += block.text.split(/\s+/).length;
        } else if (block.type === 'quote') {
            wordCount += block.text.split(/\s+/).length;
        } else if (block.type === 'list') {
            block.items.forEach(function(item) {
                wordCount += item.split(/\s+/).length;
            });
        } else if (block.type === 'poll') {
            wordCount += block.question.split(/\s+/).length;
        }
    });
    return Math.max(1, Math.ceil(wordCount / 200));
}

function isEnPage() {
    return window.location.pathname.indexOf('-en') !== -1;
}

// ========================================
// PROGRESS BAR
// ========================================

function renderProgressBar() {
    var bar = document.createElement('div');
    bar.className = 'news-progress-bar';
    bar.innerHTML = '<div class="news-progress-fill" id="progressFill"></div>';
    document.body.prepend(bar);
}

function initProgressBar() {
    var fill = document.getElementById('progressFill');
    var articleBody = document.getElementById('newsArticleBody');
    if (!fill || !articleBody) return;

    window.addEventListener('scroll', function() {
        var rect = articleBody.getBoundingClientRect();
        var articleTop = rect.top + window.pageYOffset;
        var articleHeight = articleBody.offsetHeight;
        var scrolled = window.pageYOffset - articleTop;
        var progress = Math.min(Math.max(scrolled / articleHeight * 100, 0), 100);
        fill.style.width = progress + '%';
    });
}

// ========================================
// PARALLAX
// ========================================

function initParallax() {
    var heroEl = document.querySelector('.news-hero');
    var heroImg = document.querySelector('.news-hero-bg img');
    if (!heroEl || !heroImg) return;

    if (window.innerWidth < 768) return;

    window.addEventListener('scroll', function() {
        var scrollY = window.pageYOffset;
        var heroH = heroEl.offsetHeight;
        if (scrollY > heroH) return;
        var offset = scrollY * 0.4;
        heroImg.style.transform = 'translateY(' + offset + 'px) scale(1.1)';
    });
}

// ========================================
// SCROLL ANIMATIONS
// ========================================

function initScrollAnimations() {
    var elements = document.querySelectorAll('.news-animate');
    if (!elements.length) return;

    var observer = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
            if (entry.isIntersecting) {
                entry.target.classList.add('news-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });

    elements.forEach(function(el) { observer.observe(el); });
}

// ========================================
// HERO
// ========================================

function renderHero(article, readTime) {
    var container = document.getElementById('newsHero');
    if (!container) return;

    var labels = getLabels();
    var backUrl = isEnPage() ? 'news-en.html' : 'news.html';

    container.innerHTML =
        '<div class="news-hero-bg">' +
            '<img src="' + esc(article.heroImage) + '" alt="">' +
            '<div class="news-hero-overlay"></div>' +
        '</div>' +
        '<div class="news-hero-content">' +
            '<a href="' + backUrl + '" class="news-back-link">' +
                '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg> ' +
                labels.backToNews +
            '</a>' +
            '<span class="news-category-badge news-category-' + article.category + '">' + article.categoryLabel + '</span>' +
            '<h1>' + article.title + '</h1>' +
            '<p class="news-subtitle">' + article.subtitle + '</p>' +
            '<div class="news-hero-meta">' +
                '<span class="news-meta-item">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg> ' +
                    article.date +
                '</span>' +
                '<span class="news-meta-item">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg> ' +
                    article.author +
                '</span>' +
                '<span class="news-meta-item">' +
                    '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ' +
                    readTime + ' ' + labels.readTime +
                '</span>' +
            '</div>' +
        '</div>';
}

// ========================================
// CONTENT BODY
// ========================================

function renderContent(article) {
    var container = document.getElementById('newsArticleBody');
    if (!container) return;

    // Sort content_images by after_paragraph (parseInt for JSONB safety)
    var cimgs = (article.content_images || []).filter(function(ci) {
        return ci && ci.url;
    }).map(function(ci) {
        return { url: ci.url, after_paragraph: parseInt(ci.after_paragraph, 10) || 1 };
    }).sort(function(a, b) {
        return a.after_paragraph - b.after_paragraph;
    });
    var cimgIdx = 0;

    var html = '';
    article.content.forEach(function(block, index) {
        html += renderBlock(block, index);
        // Insert inline photos after paragraph (index+1 = 1-based paragraph number)
        while (cimgIdx < cimgs.length && cimgs[cimgIdx].after_paragraph === index + 1) {
            html += '<figure class="news-figure news-animate">' +
                '<img src="' + esc(cimgs[cimgIdx].url) + '" loading="lazy">' +
            '</figure>';
            cimgIdx++;
        }
    });

    // Remaining content images (position > paragraph count) — render at end of text
    while (cimgIdx < cimgs.length) {
        html += '<figure class="news-figure news-animate">' +
            '<img src="' + esc(cimgs[cimgIdx].url) + '" loading="lazy">' +
        '</figure>';
        cimgIdx++;
    }

    // Gallery (from gallery column, like courts)
    if (article.gallery && article.gallery.length) {
        html += '<div class="news-gallery news-animate">';
        article.gallery.forEach(function(url) {
            html += '<a href="' + esc(url) + '" class="news-gallery-item" target="_blank">' +
                '<img src="' + esc(url) + '" alt="" loading="lazy">' +
            '</a>';
        });
        html += '</div>';
    }

    // Poll (from poll column)
    if (article.poll && article.poll.question && article.poll.options) {
        html += renderBlock({ type: 'poll', question: article.poll.question, options: article.poll.options }, 99);
    }

    container.innerHTML = html;
}

function renderBlock(block, index) {
    var delay = Math.min(index * 50, 300);
    var style = 'transition-delay: ' + delay + 'ms';

    switch (block.type) {
        case 'paragraph':
            return '<p class="news-paragraph news-animate" style="' + style + '">' + block.text + '</p>';

        case 'heading':
            var tag = block.level === 3 ? 'h3' : 'h2';
            return '<' + tag + ' class="news-heading news-animate" style="' + style + '">' + block.text + '</' + tag + '>';

        case 'image':
            return '<figure class="news-figure news-animate" style="' + style + '">' +
                '<img src="' + esc(block.src) + '" alt="' + esc(block.alt || '') + '" loading="lazy">' +
                (block.caption ? '<figcaption>' + block.caption + '</figcaption>' : '') +
                '</figure>';

        case 'quote':
            return '<blockquote class="news-quote news-animate" style="' + style + '">' +
                '<div class="news-quote-body">' +
                    '<svg class="news-quote-icon" width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M6 17h3l2-4V7H5v6h3zm8 0h3l2-4V7h-6v6h3z"/></svg>' +
                    '<p>' + block.text + '</p>' +
                '</div>' +
                '<div class="news-quote-author">' +
                    (block.photo ? '<img src="' + esc(block.photo) + '" alt="' + esc(block.author) + '">' : '') +
                    '<span>' + block.author + (block.country ? ' ' + block.country : '') + '</span>' +
                '</div>' +
            '</blockquote>';

        case 'stats':
            var statsHtml = '<div class="news-stats news-animate" style="' + style + '">';
            block.items.forEach(function(item) {
                statsHtml += '<div class="news-stat-item">' +
                    '<span class="news-stat-value">' + item.value + '</span>' +
                    '<span class="news-stat-label">' + item.label + '</span>' +
                '</div>';
            });
            statsHtml += '</div>';
            return statsHtml;

        case 'list':
            var listHtml = '<ul class="news-list news-animate" style="' + style + '">';
            block.items.forEach(function(item) {
                listHtml += '<li>' + item + '</li>';
            });
            listHtml += '</ul>';
            return listHtml;

        case 'poll':
            return '<div class="news-poll news-animate" id="newsPoll" data-question="' + block.question + '" style="' + style + '">' +
                '<div class="news-poll-question">' + block.question + '</div>' +
                '<div class="news-poll-options" id="pollOptions">' +
                    block.options.map(function(opt, i) {
                        return '<button class="news-poll-option" data-index="' + i + '">' + opt + '</button>';
                    }).join('') +
                '</div>' +
                '<div class="news-poll-results" id="pollResults" style="display:none;"></div>' +
            '</div>';

        default:
            return '';
    }
}

// ========================================
// TAGS
// ========================================

function renderTags(article) {
    var container = document.getElementById('newsTags');
    if (!container || !article.tags || !article.tags.length) return;

    var labels = getLabels();
    var html = '<h3 class="news-section-title">' + labels.tagsTitle + '</h3><div class="news-tags-list">';
    article.tags.forEach(function(tag) {
        html += '<a href="#" class="news-tag">' + tag.label + '</a>';
    });
    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// REACTIONS
// ========================================

function renderReactions(article) {
    var container = document.getElementById('newsReactions');
    if (!container) return;

    var labels = getLabels();
    container.innerHTML =
        '<h3 class="news-section-title">' + labels.reactionsTitle + '</h3>' +
        '<div class="news-reactions-list">' +
            '<button class="news-reaction-btn" data-type="tennis">' +
                '<span class="news-reaction-emoji">&#127934;</span>' +
                '<span class="news-reaction-count" id="count-tennis">' + article.reactions.tennis + '</span>' +
            '</button>' +
            '<button class="news-reaction-btn" data-type="fire">' +
                '<span class="news-reaction-emoji">&#128293;</span>' +
                '<span class="news-reaction-count" id="count-fire">' + article.reactions.fire + '</span>' +
            '</button>' +
            '<button class="news-reaction-btn" data-type="clap">' +
                '<span class="news-reaction-emoji">&#128079;</span>' +
                '<span class="news-reaction-count" id="count-clap">' + article.reactions.clap + '</span>' +
            '</button>' +
        '</div>';
}

function initReactions(slug) {
    var container = document.getElementById('newsReactions');
    if (!container) return;

    var storageKey = 'news-reactions-' + slug;
    var saved = JSON.parse(localStorage.getItem(storageKey) || '{}');

    // Restore saved state
    Object.keys(saved).forEach(function(type) {
        if (saved[type]) {
            var btn = container.querySelector('[data-type="' + type + '"]');
            var countEl = document.getElementById('count-' + type);
            if (btn) btn.classList.add('active');
            if (countEl) countEl.textContent = parseInt(countEl.textContent) + 1;
        }
    });

    container.addEventListener('click', function(e) {
        var btn = e.target.closest('.news-reaction-btn');
        if (!btn) return;

        var type = btn.dataset.type;
        var countEl = document.getElementById('count-' + type);
        var count = parseInt(countEl.textContent);

        if (btn.classList.contains('active')) {
            btn.classList.remove('active');
            countEl.textContent = Math.max(0, count - 1);
            saved[type] = false;
        } else {
            btn.classList.add('active');
            countEl.textContent = count + 1;
            saved[type] = true;
            btn.classList.add('news-reaction-bounce');
            setTimeout(function() { btn.classList.remove('news-reaction-bounce'); }, 400);
        }

        localStorage.setItem(storageKey, JSON.stringify(saved));
    });
}

// ========================================
// POLL
// ========================================

function initPoll(slug) {
    var pollEl = document.getElementById('newsPoll');
    if (!pollEl) return;

    var storageKey = 'news-poll-' + slug;
    var votesKey = 'news-poll-votes-' + slug;
    var savedVote = localStorage.getItem(storageKey);
    var votes = JSON.parse(localStorage.getItem(votesKey) || '[]');
    var labels = getLabels();

    var optionBtns = pollEl.querySelectorAll('.news-poll-option');

    // Init votes array if empty
    if (!votes.length) {
        votes = [];
        for (var i = 0; i < optionBtns.length; i++) {
            votes.push(0);
        }
    }

    if (savedVote !== null) {
        showPollResults(pollEl, votes, parseInt(savedVote), labels);
        return;
    }

    optionBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            var index = parseInt(btn.dataset.index);
            votes[index] = (votes[index] || 0) + 1;
            localStorage.setItem(storageKey, index.toString());
            localStorage.setItem(votesKey, JSON.stringify(votes));
            showPollResults(pollEl, votes, index, labels);
        });
    });
}

function showPollResults(pollEl, votes, votedIndex, labels) {
    var optionsEl = document.getElementById('pollOptions');
    var resultsEl = document.getElementById('pollResults');
    if (!optionsEl || !resultsEl) return;

    optionsEl.style.display = 'none';
    resultsEl.style.display = 'block';

    var total = votes.reduce(function(a, b) { return a + b; }, 0);
    var optionBtns = pollEl.querySelectorAll('.news-poll-option');

    var html = '';
    for (var i = 0; i < votes.length; i++) {
        var pct = total > 0 ? Math.round((votes[i] / total) * 100) : 0;
        var optionText = optionBtns[i] ? optionBtns[i].textContent : '';
        var isVoted = i === votedIndex;
        html += '<div class="news-poll-result-item' + (isVoted ? ' voted' : '') + '">' +
            '<div class="news-poll-result-header">' +
                '<span class="news-poll-result-label">' + optionText + (isVoted ? ' &#10003;' : '') + '</span>' +
                '<span class="news-poll-result-pct">' + pct + '%</span>' +
            '</div>' +
            '<div class="news-poll-result-bar">' +
                '<div class="news-poll-result-fill" style="width: ' + pct + '%"></div>' +
            '</div>' +
        '</div>';
    }
    html += '<div class="news-poll-total">' + total + ' ' + labels.pollTotal + '</div>';
    resultsEl.innerHTML = html;
}

// ========================================
// RELATED ARTICLES
// ========================================

function renderRelated(article) {
    var container = document.getElementById('newsRelated');
    if (!container || !article.relatedSlugs || !article.relatedSlugs.length) return;

    var labels = getLabels();
    var basePage = isEnPage() ? 'news-en.html' : 'news.html';

    var html = '<h2 class="news-section-title">' + labels.relatedTitle + '</h2><div class="news-related-grid">';

    article.relatedSlugs.forEach(function(relSlug) {
        var rel = newsArticleData[relSlug];
        if (!rel) return;

        html += '<a href="' + basePage + '?slug=' + rel.slug + '" class="news-related-card">' +
            '<div class="news-related-img">' +
                '<img src="' + esc(rel.heroImage) + '" alt="' + esc(rel.title) + '" loading="lazy">' +
            '</div>' +
            '<div class="news-related-info">' +
                '<span class="news-related-category news-category-' + rel.category + '">' + rel.categoryLabel + '</span>' +
                '<h3>' + rel.title + '</h3>' +
                '<span class="news-related-date">' + rel.date + '</span>' +
            '</div>' +
        '</a>';
    });

    html += '</div>';
    container.innerHTML = html;
}

// ========================================
// LANGUAGE LINKS
// ========================================

function updateLangLinks(slug) {
    document.querySelectorAll('.lang-option, .mobile-lang-option').forEach(function(link) {
        var href = link.getAttribute('href');
        if (href && href.indexOf('news') !== -1) {
            var base = href.split('?')[0];
            link.setAttribute('href', base + '?slug=' + slug);
        }
    });
}

// ========================================
// NEWS LIST (no slug)
// ========================================

function renderNewsList() {
    var labels = getLabels();
    var basePage = isEnPage() ? 'news-en.html' : 'news.html';
    var PER_PAGE = 6;

    document.title = 'KSLT — ' + labels.newsListTitle;

    // Hide article-only sections
    var body = document.getElementById('newsArticleBody');
    if (body) body.style.display = 'none';
    var tags = document.getElementById('newsTags');
    if (tags) tags.style.display = 'none';
    var reactions = document.getElementById('newsReactions');
    if (reactions) reactions.style.display = 'none';
    var related = document.getElementById('newsRelated');
    if (related) related.style.display = 'none';

    var allArticles = Object.keys(newsArticleData).map(function(key) {
        return newsArticleData[key];
    });

    // Sort by date (newest first)
    allArticles.sort(function(a, b) {
        return (b._publishedAt || '').localeCompare(a._publishedAt || '');
    });

    // Get unique categories
    var categories = [];
    var catMap = {};
    allArticles.forEach(function(a) {
        if (!catMap[a.category]) {
            catMap[a.category] = a.categoryLabel;
            categories.push({ key: a.category, label: a.categoryLabel });
        }
    });

    // State
    var currentFilter = 'all';
    var currentPage = 1;

    // === HERO ===
    var hero = document.getElementById('newsHero');
    if (hero) {
        hero.classList.add('news-hero-list');
        hero.innerHTML =
            '<div class="news-hero-bg">' +
                '<img src="' + esc(allArticles[0].heroImage) + '" alt="">' +
                '<div class="news-hero-overlay news-hero-overlay-list"></div>' +
            '</div>' +
            '<div class="news-hero-content news-hero-content-list">' +
                '<div class="news-list-header">' +
                    '<span class="news-list-label">' + labels.newsListTitle + '</span>' +
                    '<h1>' + labels.newsListSubtitle + '</h1>' +
                '</div>' +
            '</div>';
    }

    // === LIST CONTAINER ===
    var notFound = document.getElementById('newsNotFound');
    if (!notFound) return;
    notFound.style.display = 'block';

    // Build filters + grid + pagination shell
    var filtersHtml = '<button class="news-filter-btn active" data-cat="all">' + labels.filterAll + '</button>';
    categories.forEach(function(cat) {
        filtersHtml += '<button class="news-filter-btn" data-cat="' + cat.key + '">' + cat.label + '</button>';
    });

    notFound.innerHTML =
        '<div class="news-list-page">' +
            '<div class="news-filters" id="newsFilters">' + filtersHtml + '</div>' +
            '<div class="news-bento" id="newsBento"></div>' +
            '<div class="news-pagination" id="newsPagination"></div>' +
        '</div>';

    // === RENDER FUNCTION ===
    function renderGrid() {
        var filtered = currentFilter === 'all' ? allArticles : allArticles.filter(function(a) {
            return a.category === currentFilter;
        });

        var totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
        if (currentPage > totalPages) currentPage = totalPages;

        var start = (currentPage - 1) * PER_PAGE;
        var pageItems = filtered.slice(start, start + PER_PAGE);

        // Bento grid
        var html = '';
        pageItems.forEach(function(article, i) {
            var readTime = calculateReadTime(article);
            var isLarge = i === 0;
            var cardClass = isLarge ? 'news-bento-card news-bento-large' : 'news-bento-card';

            html += '<a href="' + basePage + '?slug=' + article.slug + '" class="' + cardClass + '">' +
                '<div class="news-bento-img">' +
                    '<img src="' + esc(article.heroImage) + '" alt="' + esc(article.title) + '" loading="lazy">' +
                    '<div class="news-bento-img-overlay"></div>' +
                '</div>' +
                '<div class="news-bento-content">' +
                    '<span class="news-category-badge news-category-' + article.category + '">' + article.categoryLabel + '</span>' +
                    (isLarge ? '<h2>' + article.title + '</h2>' : '<h3>' + article.title + '</h3>') +
                    '<p>' + article.subtitle + '</p>' +
                    '<div class="news-bento-meta">' +
                        '<span>' + article.date + '</span>' +
                        '<span class="news-bento-dot"></span>' +
                        '<span>' + readTime + ' ' + labels.readTime + '</span>' +
                    '</div>' +
                '</div>' +
            '</a>';
        });

        document.getElementById('newsBento').innerHTML = html;

        // Pagination
        if (totalPages <= 1) {
            document.getElementById('newsPagination').innerHTML = '';
            return;
        }

        var pagHtml = '<button class="news-page-btn news-page-prev" ' + (currentPage === 1 ? 'disabled' : '') + '>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 12H5"/><polyline points="12 19 5 12 12 5"/></svg>' +
        '</button>';

        for (var p = 1; p <= totalPages; p++) {
            pagHtml += '<button class="news-page-btn news-page-num' + (p === currentPage ? ' active' : '') + '" data-page="' + p + '">' + p + '</button>';
        }

        pagHtml += '<button class="news-page-btn news-page-next" ' + (currentPage === totalPages ? 'disabled' : '') + '>' +
            '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14"/><polyline points="12 5 19 12 12 19"/></svg>' +
        '</button>';

        document.getElementById('newsPagination').innerHTML = pagHtml;
    }

    renderGrid();

    // === EVENT LISTENERS ===
    // Filters
    document.getElementById('newsFilters').addEventListener('click', function(e) {
        var btn = e.target.closest('.news-filter-btn');
        if (!btn) return;
        document.querySelectorAll('.news-filter-btn').forEach(function(b) { b.classList.remove('active'); });
        btn.classList.add('active');
        currentFilter = btn.dataset.cat;
        currentPage = 1;
        renderGrid();
    });

    // Pagination
    document.getElementById('newsPagination').addEventListener('click', function(e) {
        var btn = e.target.closest('.news-page-btn');
        if (!btn || btn.disabled) return;

        if (btn.classList.contains('news-page-prev')) {
            currentPage = Math.max(1, currentPage - 1);
        } else if (btn.classList.contains('news-page-next')) {
            currentPage++;
        } else if (btn.dataset.page) {
            currentPage = parseInt(btn.dataset.page);
        }
        renderGrid();
        var bentoEl = document.getElementById('newsBento');
        if (bentoEl) bentoEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
}

// ========================================
// NOT FOUND
// ========================================

function renderNotFound() {
    var labels = getLabels();
    var homeUrl = isEnPage() ? '../index-en.html' : '../index.html';

    var hero = document.getElementById('newsHero');
    if (hero) hero.style.display = 'none';

    var body = document.getElementById('newsArticleBody');
    if (body) body.style.display = 'none';

    var tags = document.getElementById('newsTags');
    if (tags) tags.style.display = 'none';

    var reactions = document.getElementById('newsReactions');
    if (reactions) reactions.style.display = 'none';

    var related = document.getElementById('newsRelated');
    if (related) related.style.display = 'none';

    var sponsors = document.getElementById('sponsors');
    if (sponsors) sponsors.style.display = 'none';

    var notFound = document.getElementById('newsNotFound');
    if (notFound) {
        notFound.style.display = 'flex';
        notFound.innerHTML =
            '<div class="news-not-found-icon">&#127934;</div>' +
            '<h1>' + labels.notFoundTitle + '</h1>' +
            '<p>' + labels.notFoundText + '</p>' +
            '<a href="' + homeUrl + '" class="news-not-found-btn">' + labels.notFoundBtn + '</a>';
    }
}
