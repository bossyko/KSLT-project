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

// Фон шапки раздела «Новости». Тот же приём, что на странице турниров:
// постоянный снимок, а не меняющаяся обложка последней статьи.
var NEWS_HERO_IMAGE = 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80';

function mapDbArticle(row) {
    var isEn = isEnPage();
    var isKg = isKgPage();
    var title = isEn ? (row.title_en || row.title) : (isKg ? (row.title_kg || row.title) : row.title);
    var content = isEn ? (row.content_en || row.content) : (isKg ? (row.content_kg || row.content) : row.content);
    var excerpt = isEn ? (row.excerpt_en || row.excerpt) : (isKg ? (row.excerpt_kg || row.excerpt) : row.excerpt);

    var catLabels = isEn
        ? { results: 'Report', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' }
        : (isKg
            ? { results: 'Репортаж', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' }
            : { results: 'Репортаж', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' });

    var dateStr = '';
    if (row.published_at) {
        var d = new Date(row.published_at);
        dateStr = d.toLocaleDateString(isEn ? 'en-US' : (isKg ? 'ky-KG' : 'ru-RU'), {
            day: 'numeric', month: 'long', year: 'numeric'
        });
    }

    // Текст новости приходит размеченным: его пишут в редакторе админки,
    // и оттуда идут абзацы, списки, фотографии и видео. Разбирать его на куски
    // не нужно — отдаём как есть. Старые новости хранились простым текстом
    // с пустой строкой между абзацами, для них остаётся прежний разбор.
    var contentBlocks = [];
    if (content && /<(p|ul|ol|figure|h[23]|iframe)[\s>]/i.test(content)) {
        contentBlocks.push({ type: 'html', html: content });
    } else if (content) {
        content.split(/\n\n+/).forEach(function(para) {
            para = para.trim();
            if (para) {
                contentBlocks.push({ type: 'paragraph', text: para });
            }
        });
    }

    return {
        _dbId: row.id || null,
        slug: row.slug,
        title: title,
        subtitle: excerpt || '',
        heroImage: row.image || 'https://placehold.co/1200x600/1a1a1a/CCFF00?text=KSLT',
        // Кадрирование при загрузке касается только карточек списка;
        // шапка новости осталась прежней
        cardImage: row.image || 'https://placehold.co/1200x600/1a1a1a/CCFF00?text=KSLT',
        // Афишу рисовали, чтобы её прочитали: даты, состав, телеграм-канал.
        // В шапке она обрезана по ширине, поэтому исходник открывается по нажатию.
        imageOriginal: row.image_original || '',
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
        reactions_config: row.reactions_config || null,
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

            // Показываем только то, что есть в базе. Раньше сюда подмешивался
            // демонстрационный набор из data/news-data.js — статьи из прототипа
            // висели рядом с настоящими, и удалить их через админку было нельзя:
            // в базе их нет.
            window.newsArticleData = {};
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

            window.newsArticleData = {};
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
            incrementViewCount(result.data.id);
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
    // Демонстрационные статьи из прототипа не показываем даже когда база
    // недоступна: пустая страница честнее выдуманных новостей
    window.newsArticleData = {};

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
    if (article._dbId) incrementViewCount(article._dbId);
}

// ========================================
// HELPERS
// ========================================

function getLabels() {
    return typeof window.newsLabels !== 'undefined' ? window.newsLabels : {
        backToNews: "Назад к новостям",
        openPoster: "Афиша целиком",
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
        filterAll: "Все",
        searchPlaceholder: "Поиск новости..."
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

function isKgPage() {
    return window.location.pathname.indexOf('-kg') !== -1;
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
    var backUrl = isEnPage() ? 'news-en.html' : (isKgPage() ? 'news-kg.html' : 'news.html');

    // Возврат к списку — отдельной полосой у края страницы, как на страницах
    // услуг и турниров. Раньше ссылка стояла в одной колонке с заголовком
    // и налезала на плашку категории.
    var back = container.parentNode.querySelector('.kslt-back-wrap');
    if (!back) {
        back = document.createElement('div');
        back.className = 'kslt-back-wrap';
        container.parentNode.insertBefore(back, container);
    }
    back.innerHTML = '<a href="' + backUrl + '" class="kslt-back">\u2190 ' + labels.backToNews + '</a>';

    // Нажатие на кнопку в шапке открывает исходную афишу целиком
    if (article.imageOriginal) {
        container.addEventListener('click', function(e) {
            if (!e.target.closest('.news-hero-zoom')) return;
            e.preventDefault();
            openPhotoViewer([article.imageOriginal], 0);
        });
    }

    container.innerHTML =
        '<div class="news-hero-bg">' +
            '<img src="' + esc(article.heroImage) + '" alt="">' +
            '<div class="news-hero-overlay"></div>' +
            (article.imageOriginal
                ? '<button type="button" class="news-hero-zoom" aria-label="' + labels.openPoster + '">' +
                      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">' +
                          '<path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/>' +
                      '</svg>' +
                      '<span>' + labels.openPoster + '</span>' +
                  '</button>'
                : '') +
        '</div>' +
        '<div class="news-hero-content">' +
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

    // Галерея. Больше двух снимков выкладывать в столбик незачем — читатель
    // прокручивает их вместо того, чтобы читать. Тогда показываем один крупно,
    // остальные лентой под ним; по нажатию открывается просмотр во весь экран.
    if (article.gallery && article.gallery.length) {
        if (article.gallery.length > 2) {
            html += '<div class="news-carousel news-animate">' +
                '<div class="news-carousel-stage">' +
                    '<button class="news-carousel-nav news-carousel-prev" aria-label="Предыдущее">&#8249;</button>' +
                    '<img class="news-carousel-main" src="' + esc(article.gallery[0]) + '" alt="" data-index="0">' +
                    '<button class="news-carousel-nav news-carousel-next" aria-label="Следующее">&#8250;</button>' +
                    '<div class="news-carousel-count">1 / ' + article.gallery.length + '</div>' +
                '</div>' +
                '<div class="news-carousel-thumbs">' +
                    article.gallery.map(function(url, i) {
                        return '<button class="news-carousel-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
                            '<img src="' + esc(url) + '" alt="" loading="lazy">' +
                        '</button>';
                    }).join('') +
                '</div>' +
            '</div>';
        } else {
            html += '<div class="news-gallery news-animate">';
            article.gallery.forEach(function(url) {
                html += '<a href="' + esc(url) + '" class="news-gallery-item" data-lightbox>' +
                    '<img src="' + esc(url) + '" alt="" loading="lazy">' +
                '</a>';
            });
            html += '</div>';
        }
    }

    // Poll (from poll column)
    if (article.poll && article.poll.question && article.poll.options) {
        html += renderBlock({ type: 'poll', question: article.poll.question, options: article.poll.options }, 99);
    }

    container.innerHTML = html;
    initCarousel(container, article.gallery || []);
    initPhotoViewer(container, article.gallery || []);
}

/** Лента снимков: стрелки, миниатюры, счётчик. Крупный кадр открывает просмотр. */
function initCarousel(root, photos) {
    var wrap = root.querySelector('.news-carousel');
    if (!wrap || photos.length < 2) return;

    var main = wrap.querySelector('.news-carousel-main');
    var count = wrap.querySelector('.news-carousel-count');
    var thumbs = Array.prototype.slice.call(wrap.querySelectorAll('.news-carousel-thumb'));
    var index = 0;

    function show(i) {
        index = (i + photos.length) % photos.length;
        main.src = photos[index];
        main.dataset.index = index;
        count.textContent = (index + 1) + ' / ' + photos.length;
        thumbs.forEach(function(t, n) { t.classList.toggle('active', n === index); });
        var active = thumbs[index];
        if (active) active.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
    }

    wrap.querySelector('.news-carousel-prev').addEventListener('click', function() { show(index - 1); });
    wrap.querySelector('.news-carousel-next').addEventListener('click', function() { show(index + 1); });
    thumbs.forEach(function(t) {
        t.addEventListener('click', function() { show(Number(t.dataset.index)); });
    });
}

/**
 * Просмотр фотографии поверх страницы.
 *
 * В тексте и в галерее снимки показываются некрупно, чтобы не растаскивать
 * новость на километр. По нажатию — открываются целиком, как в привычных
 * приложениях: стрелки листают, Esc и клик по фону закрывают.
 *
 * Что именно листается — зависит от того, куда нажали. Крупный кадр ленты
 * открывает всю галерею: в разметке он одна картинка, но читатель видит
 * ленту и ждёт, что пролистает её и на весь экран. Снимки из текста
 * листаются между собой.
 */
function initPhotoViewer(root, gallery) {
    var IN_TEXT = '.news-gallery-item[data-lightbox], .news-html figure img';

    function urlOf(el) {
        return el.tagName === 'IMG' ? el.src : el.getAttribute('href');
    }

    root.addEventListener('click', function(e) {
        var main = e.target.closest('.news-carousel-main');
        if (main && gallery && gallery.length) {
            e.preventDefault();
            openPhotoViewer(gallery, Number(main.dataset.index) || 0);
            return;
        }

        var el = e.target.closest(IN_TEXT);
        if (!el) return;
        e.preventDefault();
        var items = Array.prototype.slice.call(root.querySelectorAll(IN_TEXT));
        var i = items.indexOf(el);
        if (i !== -1) openPhotoViewer(items.map(urlOf), i);
    });
}

/** Открывает снимок поверх страницы. Стрелки листают, Esc и клик по фону закрывают. */
function openPhotoViewer(urls, index) {
        var overlay = document.createElement('div');
        overlay.className = 'news-viewer';
        overlay.innerHTML =
            '<button class="news-viewer-close" aria-label="Закрыть">&times;</button>' +
            '<button class="news-viewer-nav news-viewer-prev" aria-label="Предыдущее">&#8249;</button>' +
            '<img class="news-viewer-img" src="' + esc(urls[index]) + '" alt="">' +
            '<button class="news-viewer-nav news-viewer-next" aria-label="Следующее">&#8250;</button>' +
            '<div class="news-viewer-count"></div>';
        document.body.appendChild(overlay);
        document.body.style.overflow = 'hidden';

        var img = overlay.querySelector('.news-viewer-img');
        var count = overlay.querySelector('.news-viewer-count');

        function show(i) {
            index = (i + urls.length) % urls.length;
            img.src = urls[index];
            count.textContent = (index + 1) + ' / ' + urls.length;
            overlay.querySelectorAll('.news-viewer-nav').forEach(function(b) {
                b.style.display = urls.length > 1 ? '' : 'none';
            });
        }
        function close() {
            overlay.remove();
            document.body.style.overflow = '';
            document.removeEventListener('keydown', onKey);
        }
        function onKey(e) {
            if (e.key === 'Escape') close();
            if (e.key === 'ArrowRight') show(index + 1);
            if (e.key === 'ArrowLeft') show(index - 1);
        }

        overlay.querySelector('.news-viewer-close').addEventListener('click', close);
        overlay.querySelector('.news-viewer-prev').addEventListener('click', function(e) { e.stopPropagation(); show(index - 1); });
        overlay.querySelector('.news-viewer-next').addEventListener('click', function(e) { e.stopPropagation(); show(index + 1); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay || e.target === img) close(); });
        document.addEventListener('keydown', onKey);
        show(index);
}

function renderBlock(block, index) {
    var delay = Math.min(index * 50, 300);
    var style = 'transition-delay: ' + delay + 'ms';

    switch (block.type) {
        case 'html':
            return '<div class="news-html news-animate" style="' + style + '">' + block.html + '</div>';

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
    if (!container) return;

    // Тегов у новостей из базы нет вовсе, а блок всё равно занимал место —
    // сорок точек высоты плюс отступ между текстом статьи и «Оцените статью»
    if (!article.tags || !article.tags.length) {
        container.style.display = 'none';
        return;
    }
    container.style.display = '';

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

var DEFAULT_REACTIONS = ['tennis', 'fire', 'clap'];

function getActiveReactionTypes(article) {
    var rc = article.reactions_config;
    if (rc === null || rc === undefined) return DEFAULT_REACTIONS; // backward compat
    if (Array.isArray(rc) && rc.length === 0) return []; // disabled
    return rc; // specific types
}

function renderReactions(article) {
    var container = document.getElementById('newsReactions');
    if (!container) return;

    var activeTypes = getActiveReactionTypes(article);
    if (!activeTypes.length) {
        container.innerHTML = '';
        container.style.display = 'none';
        return;
    }

    var labels = getLabels();
    var buttonsHtml = '';
    activeTypes.forEach(function(type) {
        var info = EMOJI_MAP[type];
        if (!info) return;
        buttonsHtml +=
            '<button class="news-reaction-btn" data-type="' + type + '">' +
                '<span class="news-reaction-emoji">' + info.emoji + '</span>' +
                '<span class="news-reaction-count" id="count-' + type + '">' + (article.reactions[type] || 0) + '</span>' +
            '</button>';
    });

    container.innerHTML =
        '<h3 class="news-section-title">' + labels.reactionsTitle + '</h3>' +
        '<div class="news-reactions-list">' + buttonsHtml + '</div>';
}

async function getAuthUser() {
    if (!window.supabaseClient) return null;
    var resp = await window.supabaseClient.auth.getUser();
    return (resp.data && resp.data.user) ? resp.data.user : null;
}

function getAuthRedirectUrl() {
    var isEn = isEnPage();
    var isKg = isKgPage();
    var prefix = window.location.pathname.indexOf('/pages/') !== -1 ? '' : 'pages/';
    return prefix + (isEn ? 'auth-en.html' : (isKg ? 'auth-kg.html' : 'auth.html'));
}

function showGuestModal() {
    var old = document.querySelector('.news-guest-overlay');
    if (old) old.remove();

    var isEn = isEnPage();
    var isKg = isKgPage();
    var authUrl = getAuthRedirectUrl();

    var title = isEn ? 'Join us!' : (isKg ? 'Кошулуңуз!' : 'Присоединяйтесь!');
    var text = isEn
        ? 'Sign up to vote in polls and react to articles'
        : (isKg ? 'Опростко катышуу жана макалаларды баалоо үчүн катталыңыз' : 'Зарегистрируйтесь, чтобы голосовать в опросах и оценивать статьи');
    var btnLabel = isEn ? 'Sign Up' : (isKg ? 'Каттоо' : 'Регистрация');

    var overlay = document.createElement('div');
    overlay.className = 'news-guest-overlay';
    overlay.innerHTML =
        '<div class="news-guest-modal">' +
            '<button class="news-guest-modal-close">&times;</button>' +
            '<div class="news-guest-modal-icon">&#127934;</div>' +
            '<div class="news-guest-modal-title">' + title + '</div>' +
            '<div class="news-guest-modal-text">' + text + '</div>' +
            '<a href="' + authUrl + '" class="news-guest-modal-btn">' + btnLabel + '</a>' +
        '</div>';
    document.body.appendChild(overlay);

    requestAnimationFrame(function() { overlay.classList.add('visible'); });

    overlay.querySelector('.news-guest-modal-close').addEventListener('click', function() {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
    });
    overlay.addEventListener('click', function(e) {
        if (e.target === overlay) {
            overlay.classList.remove('visible');
            setTimeout(function() { overlay.remove(); }, 250);
        }
    });
}

async function resolveNewsId(slug) {
    var client = window.supabaseClient;
    if (!client) return null;
    // Check if article data has _dbId
    if (typeof newsArticleData !== 'undefined' && newsArticleData[slug] && newsArticleData[slug]._dbId) {
        return newsArticleData[slug]._dbId;
    }
    // Fallback: query by slug
    var res = await client.from('news').select('id').eq('slug', slug).single();
    return (res.data && res.data.id) ? res.data.id : null;
}

function addReactionCheck(btn) {
    if (btn.querySelector('.news-reaction-check')) return;
    btn.insertAdjacentHTML('beforeend', '<span class="news-reaction-check">&#10003;</span>');
}

async function initReactions(slug) {
    var container = document.getElementById('newsReactions');
    if (!container || container.style.display === 'none') return;

    var client = window.supabaseClient;
    if (!client) return;

    var newsId = await resolveNewsId(slug);
    if (!newsId) return;

    // Load counts from DB (dynamic RPC: rows of {reaction_type, count})
    var countsRes = await client.rpc('get_reaction_counts', { p_news_id: newsId });
    if (countsRes.data && countsRes.data.length) {
        countsRes.data.forEach(function(row) {
            var el = document.getElementById('count-' + row.reaction_type);
            if (el) el.textContent = row.count || 0;
        });
    }

    // Load user's own reactions
    var user = await getAuthUser();
    if (user) {
        var userRes = await client.rpc('get_user_reactions', { p_news_id: newsId, p_user_id: user.id });
        if (userRes.data) {
            userRes.data.forEach(function(row) {
                var btn = container.querySelector('[data-type="' + row.reaction_type + '"]');
                if (btn) {
                    btn.classList.add('active');
                    addReactionCheck(btn);
                }
            });
        }
    }

    // Click handler — one-time reactions (no toggle)
    var busy = false;
    container.addEventListener('click', async function(e) {
        var btn = e.target.closest('.news-reaction-btn');
        if (!btn || busy) return;

        // Already reacted — ignore
        if (btn.classList.contains('active')) return;

        // Auth check — show modal for guests
        var currentUser = user || await getAuthUser();
        if (!currentUser) {
            showGuestModal();
            return;
        }

        var type = btn.dataset.type;
        var countEl = document.getElementById('count-' + type);
        var count = parseInt(countEl.textContent) || 0;

        // Optimistic UI — add reaction
        btn.classList.add('active');
        addReactionCheck(btn);
        countEl.textContent = count + 1;
        btn.classList.add('news-reaction-bounce');
        setTimeout(function() { btn.classList.remove('news-reaction-bounce'); }, 400);

        busy = true;
        var res = await client.from('news_reactions')
            .insert({ news_id: newsId, user_id: currentUser.id, reaction_type: type });
        if (res.error) {
            // Revert on error
            btn.classList.remove('active');
            countEl.textContent = count;
        }
        busy = false;
    });
}

// ========================================
// POLL
// ========================================

async function initPoll(slug) {
    var pollEl = document.getElementById('newsPoll');
    if (!pollEl) return;

    var client = window.supabaseClient;
    if (!client) return;

    var newsId = await resolveNewsId(slug);
    if (!newsId) return;

    var labels = getLabels();
    var optionBtns = pollEl.querySelectorAll('.news-poll-option');
    var optionCount = optionBtns.length;
    if (!optionCount) return;

    // Build votes array from DB
    var votes = [];
    for (var i = 0; i < optionCount; i++) votes.push(0);

    var resultsRes = await client.rpc('get_poll_results', { p_news_id: newsId });
    if (resultsRes.data) {
        resultsRes.data.forEach(function(row) {
            if (row.option_index >= 0 && row.option_index < optionCount) {
                votes[row.option_index] = row.count || 0;
            }
        });
    }

    // Check if current user already voted
    var user = await getAuthUser();
    if (user) {
        var voteRes = await client.from('news_poll_votes')
            .select('option_index')
            .eq('news_id', newsId)
            .eq('user_id', user.id)
            .maybeSingle();
        if (voteRes.data) {
            showPollResults(pollEl, votes, voteRes.data.option_index, labels);
            return;
        }
    }

    // Click handler — vote
    optionBtns.forEach(function(btn) {
        btn.addEventListener('click', async function() {
            var currentUser = user || await getAuthUser();
            if (!currentUser) {
                showGuestModal();
                return;
            }

            var index = parseInt(btn.dataset.index);
            votes[index] = (votes[index] || 0) + 1;

            // Show results immediately (optimistic)
            showPollResults(pollEl, votes, index, labels);

            // Persist to DB
            var res = await client.from('news_poll_votes')
                .insert({ news_id: newsId, user_id: currentUser.id, option_index: index });
            if (res.error) {
                console.error('Poll vote error:', res.error);
            }
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
    var basePage = isEnPage() ? 'news-en.html' : (isKgPage() ? 'news-kg.html' : 'news.html');

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
// VIEW COUNTER
// ========================================

function incrementViewCount(newsId) {
    if (!newsId) return;
    var key = 'kslt_viewed_' + newsId;
    if (localStorage.getItem(key)) return;
    var client = window.supabaseClient;
    if (!client) return;
    client.rpc('increment_news_view', { p_news_id: newsId }).then(function(res) {
        if (!res.error) localStorage.setItem(key, '1');
    });
}

// ========================================
// NEWS LIST (no slug)
// ========================================

function renderNewsList() {
    var labels = getLabels();
    var basePage = isEnPage() ? 'news-en.html' : (isKgPage() ? 'news-kg.html' : 'news.html');
    // Семь на страницу — ровно под сетку: главная карточка, три сбоку и три
    // в нижнем ряду. При шести нижний ряд оставался с пустым местом.
    var PER_PAGE = 7;

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

    // State — read ?category= from URL if present
    var urlCat = new URLSearchParams(window.location.search).get('category') || '';
    var knownCats = ['announcement', 'world', 'results', 'interview'];
    var currentFilter = (urlCat && knownCats.indexOf(urlCat) !== -1) ? urlCat : 'all';
    var currentPage = 1;
    var searchQuery = '';

    // === HERO ===
    var hero = document.getElementById('newsHero');
    if (hero) {
        // Постоянный снимок, а не обложка свежей новости: шапка раздела не должна
        // меняться каждый раз, когда выходит новая статья. Устроено так же,
        // как на странице турниров — фон, затемнение, текст поверх.
        hero.classList.add('news-hero-list');
        hero.innerHTML =
            '<div class="news-hero-bg">' +
                '<img src="' + NEWS_HERO_IMAGE + '" alt="">' +
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

    // Ensure all known categories are shown in filter chips (even if no articles yet)
    var catLabelsAll = isEnPage()
        ? { results: 'Report', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' }
        : (isKgPage()
            ? { results: 'Репортаж', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' }
            : { results: 'Репортаж', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' });
    var existingKeys = categories.map(function(c) { return c.key; });
    knownCats.forEach(function(k) {
        if (existingKeys.indexOf(k) === -1) {
            categories.push({ key: k, label: catLabelsAll[k] || k });
        }
    });

    // Build filters + grid + pagination shell
    var chipsHtml = '<button class="news-filter-btn' + (currentFilter === 'all' ? ' active' : '') + '" data-cat="all">' + labels.filterAll + '</button>';
    categories.forEach(function(cat) {
        chipsHtml += '<button class="news-filter-btn' + (currentFilter === cat.key ? ' active' : '') + '" data-cat="' + cat.key + '">' + cat.label + '</button>';
    });

    var filtersHtml =
        '<div class="nw-search-wrap">' +
            '<svg class="nw-search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
            '<input type="text" class="nw-search-input" id="newsSearch" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
        '</div>' +
        '<div class="news-filter-chips">' + chipsHtml + '</div>';

    // Insert filters as direct child of <main> so sticky works through sponsors
    var filtersWrapper = document.createElement('div');
    filtersWrapper.className = 'news-filters';
    filtersWrapper.id = 'newsFilters';
    filtersWrapper.innerHTML = filtersHtml;
    notFound.parentNode.insertBefore(filtersWrapper, notFound);

    // Список живёт в той же секции, что и сообщение «ничего не найдено», а у неё
    // отступы под пустой экран — 128 точек сверху и снизу. Для списка они лишние.
    notFound.classList.add('news-list-mode');

    notFound.innerHTML =
        '<div class="news-list-page">' +
            '<div class="news-bento" id="newsBento"></div>' +
            '<div class="news-pagination" id="newsPagination"></div>' +
        '</div>';

    // === RENDER FUNCTION ===
    function renderGrid() {
        var filtered = allArticles;
        if (searchQuery) {
            var q = searchQuery.toLowerCase();
            filtered = filtered.filter(function(a) {
                return (a.title && a.title.toLowerCase().indexOf(q) !== -1) ||
                       (a.subtitle && a.subtitle.toLowerCase().indexOf(q) !== -1) ||
                       (a.categoryLabel && a.categoryLabel.toLowerCase().indexOf(q) !== -1);
            });
        }
        if (currentFilter !== 'all') {
            filtered = filtered.filter(function(a) {
                return a.category === currentFilter;
            });
        }

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
                    '<img src="' + esc(article.cardImage || article.heroImage) + '" alt="' + esc(article.title) + '" loading="lazy">' +
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
    // Search
    document.getElementById('newsSearch').addEventListener('input', function(e) {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        renderGrid();
    });

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
    var homeUrl = isEnPage() ? '../index-en.html' : (isKgPage() ? '../index-kg.html' : '../index.html');

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
