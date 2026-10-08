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
// Своя картинка вместо стоковой: обложки новостей теперь настоящие,
// и подложка раздела должна быть нашей же
var NEWS_HERO_IMAGE = '../images/heroes/tournaments.jpg';

function mapDbArticle(row) {
    var isEn = isEnPage();
    var isKg = isKgPage();
    var title = isEn ? (row.title_en || row.title) : (isKg ? (row.title_kg || row.title) : row.title);
    var content = isEn ? (row.content_en || row.content) : (isKg ? (row.content_kg || row.content) : row.content);
    var excerpt = isEn ? (row.excerpt_en || row.excerpt) : (isKg ? (row.excerpt_kg || row.excerpt) : row.excerpt);

    var catLabels = isEn
        ? { results: 'Results', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' }
        : (isKg
            ? { results: 'Жыйынтыктар', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' }
            : { results: 'Результаты', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' });

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

    // Своей картинки может не быть — мировые новости приходят без неё. Тогда
    // ставим обложку из своего набора, по номеру новости. Раньше тут стояла
    // заглушка с чужого сайта: серый прямоугольник и запрос наружу.
    var своя = !row.image;
    var обложка = row.image || (window.KSLT_NEWS_COVERS
        ? window.KSLT_NEWS_COVERS.путь(row.id || row.slug, '../')
        : '');

    return {
        _dbId: row.id || null,
        slug: row.slug,
        title: title,
        subtitle: excerpt || '',
        heroImage: обложка,
        // Кадрирование при загрузке касается только карточек списка;
        // шапка новости осталась прежней
        cardImage: обложка,
        // Наша обложка, а не присланная афиша: поверх неё ложится знак КСЛТ
        // и тень по низу — иначе кадр читается как чужая случайная картинка
        ownCover: своя,
        // Мировая новость ведёт прямо к статье: своей страницы у неё нет,
        // наполнить её нечем — чужой текст мы не перепечатываем
        sourceUrl: row.source_url || '',
        sourceName: row.source_name || '',
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
        /* ПЕРЕВЕДЕНА ИЛИ НЕТ — решение Кости 08.10. Новости из бота приходят
           по-русски и ведут на чужую страницу, переводить их нечем: заголовок
           по-английски над русской заметкой человека только запутает. Поэтому
           на английской и киргизской версиях показываем ТОЛЬКО то, что
           переведено в админке. Признак — непустой заголовок на этом языке. */
        переведена: isEn ? !!row.title_en : (isKg ? !!row.title_kg : true),
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

            /* ЯЗЫКОВОЙ ШОВ. ЗАМЕР 08.10: список честно прячет непереведённое
               (ru 35 · en 22 · kg 16), а СТРАНИЦА не прятала — ссылка вида
               news-en.html?slug=... открывала статью целиком по-русски, без
               единого слова о том, что перевода нет.
               Прятать её нельзя: ссылка приходит извне, и «страница не
               найдена» на существующую статью — вранье. Поэтому на чужом
               языке страница показывает пустое состояние (Empty state
               37:53, его описание требует «always say what will appear
               here») и кнопку на русскую версию. */
            if (article.переведена === false) {
                renderNetPerevoda(article);
                return;
            }

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

/* ПОДПИСИ НА ТРЁХ ЯЗЫКАХ — 08.10. До этого дня `window.newsLabels` не
   задавалась НИГДЕ, и getLabels() всегда отдавала русский запасной словарь:
   ЗАМЕРЕНО в браузере 07.10 — на news-en.html и news-kg.html поиск, фильтр,
   мета и даже заголовок вкладки были русскими. Язык берётся из адреса
   страницы, а не из пары флагов — правило 06.10.
   КИРГИЗСКИЙ НЕ ПРОВЕРЕН НОСИТЕЛЕМ: ложится в тот же долг, что и 39 строк в
   docs/kslt-teksty-na-podtverzhdenie.xlsx. */
var ПОДПИСИ = {
    ru: {
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
        newsListSubtitle: "Последние новости из мира тенниса",
        featuredLabel: "Главное",
        readMore: "Читать",
        allArticles: "Все статьи",
        filterAll: "Все",
        searchPlaceholder: "Поиск новости...",
        shownOf: "из",
        pageOf: "из",
        prevPage: "\u2190 Назад",
        nextPage: "Вперёд \u2192",
        emptySearch: "Ничего не нашлось",
        emptySearchHint: "Проверьте написание или очистите поиск",
        emptyCategory: "В этой категории пока пусто",
        emptyCategoryHint: "Выберите другую категорию",
        viewerTitle: "Просмотр фотографии",
        noTranslationTitle: "Этой новости нет на этом языке",
        noTranslationText: "Здесь появится перевод, когда редакция его опубликует. Пока новость есть только по-русски.",
        noTranslationBtn: "Читать по-русски"
    },
    en: {
        backToNews: "Back to news",
        openPoster: "Full poster",
        readTime: "min read",
        relatedTitle: "Related articles",
        reactionsTitle: "Rate this article",
        tagsTitle: "Tags",
        notFoundTitle: "Article not found",
        notFoundText: "This article does not exist or has been removed.",
        notFoundBtn: "Go home",
        pollVote: "Vote",
        pollVoted: "Thanks for voting!",
        pollTotal: "votes",
        sponsorsTitle: "Partners and sponsors",
        sponsorsGeneral: "General sponsor",
        newsListTitle: "News",
        newsListSubtitle: "Latest news from the world of tennis",
        featuredLabel: "Top story",
        readMore: "Read",
        allArticles: "All articles",
        filterAll: "All",
        searchPlaceholder: "Search news...",
        shownOf: "of",
        pageOf: "of",
        prevPage: "\u2190 Back",
        nextPage: "Next \u2192",
        emptySearch: "Nothing found",
        emptySearchHint: "Check the spelling or clear the search",
        emptyCategory: "Nothing in this category yet",
        emptyCategoryHint: "Pick another category",
        viewerTitle: "Photo viewer",
        noTranslationTitle: "This story is not available in English",
        noTranslationText: "The translation will appear here once the editors publish it. For now the story exists in Russian only.",
        noTranslationBtn: "Read in Russian"
    },
    kg: {
        backToNews: "Жаңылыктарга кайтуу",
        openPoster: "Афишаны толук көрүү",
        readTime: "мүнөт окуу",
        relatedTitle: "Окшош макалалар",
        reactionsTitle: "Макаланы баалаңыз",
        tagsTitle: "Тегдер",
        notFoundTitle: "Макала табылган жок",
        notFoundText: "Суралган макала жок же өчүрүлгөн.",
        notFoundBtn: "Башкы бетке",
        pollVote: "Добуш берүү",
        pollVoted: "Добушуңуз кабыл алынды!",
        pollTotal: "добуш",
        sponsorsTitle: "Өнөктөштөр жана демөөрчүлөр",
        sponsorsGeneral: "Башкы демөөрчү",
        newsListTitle: "Жаңылыктар",
        newsListSubtitle: "Теннис дүйнөсүнөн акыркы жаңылыктар",
        featuredLabel: "Башкы жаңылык",
        readMore: "Окуу",
        allArticles: "Бардык макалалар",
        filterAll: "Баары",
        searchPlaceholder: "Жаңылык издөө...",
        shownOf: "ичинен",
        pageOf: "ичинен",
        prevPage: "\u2190 Артка",
        nextPage: "Алдыга \u2192",
        emptySearch: "Эч нерсе табылган жок",
        emptySearchHint: "Жазылышын текшериңиз же издөөнү тазалаңыз",
        emptyCategory: "Бул категорияда азырынча эч нерсе жок",
        emptyCategoryHint: "Башка категорияны тандаңыз",
        viewerTitle: "Сүрөттү көрүү",
        noTranslationTitle: "Бул жаңылык кыргызча жок",
        noTranslationText: "Котормо жарыялангандан кийин ушул жерде чыгат. Азырынча жаңылык орусча гана бар.",
        noTranslationBtn: "Орусча окуу"
    }
};

function getLabels() {
    if (typeof window.newsLabels !== 'undefined') return window.newsLabels;
    return isEnPage() ? ПОДПИСИ.en : (isKgPage() ? ПОДПИСИ.kg : ПОДПИСИ.ru);
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
    // Порог по доле блока не годится: тело статьи — один большой кусок
    // разметки высотой в десять экранов, и десятая часть его в окно не
    // помещается никогда. Такой блок так и оставался прозрачным, а вместе с
    // ним пропадал весь текст новости с фотографиями. Считаем показанным,
    // как только он краем попал в окно.
    }, { threshold: 0, rootMargin: '0px 0px -40px 0px' });

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

    /* ОБЛОЖКА СТАТЬИ НОСИТ СВОЁ ИМЯ. Класс .news-hero общий со списком, и
       правила статьи доставали обложку списка: 08.10 это стоило нам доли
       высоты окна (50vh) и трёх кеглей заголовка, которые ловились
       оговоркой :not(:has(.news-hero-content-list)). Оговорка — не имя:
       список метит себя сам (news-hero-list), теперь метит и статья. */
    container.classList.add('news-statya-hero');

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
        '<div class="news-hero-bg' + (article.ownCover ? ' news-own-cover' : '') + '">' +
            '<img src="' + esc(article.heroImage) + '" alt="">' +
            (article.ownCover ? '<img class="news-znak" src="../images/kslt-logo.svg" alt="" aria-hidden="true">' : '') +
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
                    /* КАДР — КНОПКА. Картинка фокус не берёт: окно нельзя было
                       открыть с клавиатуры вовсе, а после закрытия фокус
                       уходил в тело страницы, а не туда, откуда пришёл. */
                    '<button type="button" class="news-carousel-kadr" aria-label="' + getLabels().viewerTitle + '">' +
                        '<img class="news-carousel-main" src="' + esc(article.gallery[0]) + '" alt="" data-index="0">' +
                    '</button>' +
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
    собратьСнимкиВГалерею(container);
    собратьПобедителей(container);
    открытьСКлавиатуры(container);
    initCarousel(container, article.gallery || []);
    initPhotoViewer(container, article.gallery || []);
}

/* Значки места: золото, серебро, бронза, медаль, кубок. Строка победителя
   начинается с одного из них — так набирают в админке. */
var ЗНАЧОК_МЕСТА = /[\u{1F947}-\u{1F949}\u{1F3C5}\u{1F3C6}]/u;
var ДЛИНА_СТРОКИ_СПИСКА = 60;

/**
 * СПИСОК ПОБЕДИТЕЛЕЙ — ЭТО НЕ СПИСОК, А ПЯТЬДЕСЯТ ВОСЕМЬ АБЗАЦЕВ.
 *
 * ЗАМЕР 08.10 на «Завершение и итоги ТБШ 2026»: 58 отдельных <p>, каждый
 * короче 60 знаков, у каждого в начале значок места; тегов <ul> и <ol> —
 * ноль. Строка занимала 28 в высоту при содержимом около 140 из 837 ширины
 * колонки, и весь список уходил вниз на 1624.
 *
 * Пока редактор админки не умеет списков, разметку восстанавливаем здесь:
 * подряд идущие короткие абзацы со значком места становятся настоящим <ul>,
 * а короткая строка БЕЗ значка внутри того же хода — заголовком категории
 * («Женская категория FUTURES»).
 *
 * ЭТО ЭВРИСТИКА, А НЕ ПРАВИЛО. Длинная строка со значком в список не
 * попадёт, и ход, где медалей меньше трёх, не считается списком вовсе —
 * иначе два коротких абзаца подряд превратились бы в список на каждой
 * статье сайта. За порогами следит сторож в прувере. Отдельной строкой
 * просим завести список в админке: тогда это место уйдёт целиком.
 */
function собратьПобедителей(root) {
    Array.prototype.forEach.call(root.querySelectorAll('.news-html'), function (тело) {
        var дети = Array.prototype.slice.call(тело.children);
        var ход = [];

        function медаль(p) { return ЗНАЧОК_МЕСТА.test(p.textContent); }

        function закрыть() {
            /* Края хода без медали в список не входят: это обычные короткие
               абзацы, которые просто оказались рядом. Один такой перед
               первой медалью оставляем — это и есть заголовок категории. */
            while (ход.length && !медаль(ход[ход.length - 1])) ход.pop();
            while (ход.length > 1 && !медаль(ход[0]) && !медаль(ход[1])) ход.shift();

            if (ход.filter(медаль).length < 3) { ход = []; return; }

            var блок = document.createElement('div');
            блок.className = 'news-pobediteli';
            var список = null;

            ход.forEach(function (p) {
                if (медаль(p)) {
                    if (!список) {
                        список = document.createElement('ul');
                        список.className = 'news-pobediteli-spisok';
                        блок.appendChild(список);
                    }
                    var строка = document.createElement('li');
                    строка.innerHTML = p.innerHTML.trim();
                    список.appendChild(строка);
                } else {
                    var заголовок = document.createElement('h3');
                    заголовок.className = 'news-pobediteli-gruppa';
                    заголовок.innerHTML = p.innerHTML.trim();
                    блок.appendChild(заголовок);
                    список = null;
                }
            });

            ход[0].parentNode.insertBefore(блок, ход[0]);
            ход.forEach(function (p) { p.remove(); });
            ход = [];
        }

        дети.forEach(function (эл) {
            var коротко = эл.tagName === 'P' &&
                          эл.textContent.trim().length <= ДЛИНА_СТРОКИ_СПИСКА &&
                          !эл.querySelector('img, iframe');
            if (коротко) { ход.push(эл); return; }
            закрыть();
        });
        закрыть();
    });
}

/** Лента снимков: стрелки, миниатюры, счётчик. Крупный кадр открывает просмотр. */
/**
 * Снимки, идущие в тексте подряд, показываем галереей: крупный кадр и лента
 * миниатюр под ним. Раньше они шли лентой в столбик на всю ширину, и читатель
 * прокручивал десяток фотографий вместо того, чтобы читать.
 *
 * Одиночный снимок остаётся снимком: галерея из одного кадра ни к чему.
 */
function собратьСнимкиВГалерею(root) {
    root.querySelectorAll('.news-html').forEach(function(тело) {
        var дети = Array.prototype.slice.call(тело.children);
        var набор = [];

        function закрыть() {
            if (набор.length < 2) { набор = []; return; }
            var адреса = набор.map(function(f) { return f.querySelector('img').src; });
            var блок = document.createElement('div');
            блок.className = 'news-carousel';
            блок.dataset.photos = JSON.stringify(адреса);
            блок.innerHTML =
                '<div class="news-carousel-stage">' +
                    '<button class="news-carousel-nav news-carousel-prev" aria-label="Предыдущее">&#8249;</button>' +
                    '<button type="button" class="news-carousel-kadr" aria-label="' + getLabels().viewerTitle + '">' +
                        '<img class="news-carousel-main" src="' + esc(адреса[0]) + '" alt="" data-index="0">' +
                    '</button>' +
                    '<button class="news-carousel-nav news-carousel-next" aria-label="Следующее">&#8250;</button>' +
                    '<div class="news-carousel-count">1 / ' + адреса.length + '</div>' +
                '</div>' +
                '<div class="news-carousel-thumbs">' +
                    адреса.map(function(url, i) {
                        return '<button class="news-carousel-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">' +
                            '<img src="' + esc(url) + '" alt="" loading="lazy">' +
                        '</button>';
                    }).join('') +
                '</div>';
            набор[0].parentNode.insertBefore(блок, набор[0]);
            набор.forEach(function(f) { f.remove(); });
            набор = [];
        }

        дети.forEach(function(эл) {
            var этоСнимок = эл.tagName === 'FIGURE' && эл.querySelector('img') &&
                            !эл.textContent.trim();
            if (этоСнимок) { набор.push(эл); return; }
            закрыть();
        });
        закрыть();
    });
}

/**
 * Одиночный снимок в тексте тоже открывается с клавиатуры.
 *
 * ОБХОД 08.10: мышью снимок открывался, а Tab по нему не проходил вовсе —
 * <img> фокус не берёт. Галерея из двух кадров была устроена ссылками и
 * потому работала, а одиночный снимок — нет: ОДНО ПОНЯТИЕ, ДВА ПОВЕДЕНИЯ.
 */
function открытьСКлавиатуры(root) {
    var подпись = getLabels().viewerTitle;
    Array.prototype.forEach.call(root.querySelectorAll('.news-html figure img'), function (кадр) {
        кадр.setAttribute('tabindex', '0');
        кадр.setAttribute('role', 'button');
        кадр.setAttribute('aria-label', подпись);
    });
}

function initCarousel(root, photos) {
    // Каруселей на странице может быть несколько: галерея новости и наборы
    // снимков внутри текста. Заводим каждую по её собственным адресам.
    Array.prototype.forEach.call(root.querySelectorAll('.news-carousel'), function(wrap) {
        var свои = wrap.dataset.photos ? JSON.parse(wrap.dataset.photos) : photos;
        завестиКарусель(wrap, свои || []);
    });
}

/**
 * КОРОБКА БЕРЁТ ОТНОШЕНИЕ ПЕРВОГО КАДРА.
 *
 * ЗАМЕР 08.10: все 15 фотографий статьи — портрет 0.75 (3:4), а коробка
 * стояла ландшафтная, 834 x 560. ПОСЧИТАНО из этих чисел: видно 420 x 560,
 * по бокам 414 пустых пикселей — ровно половина ширины. Снимки с турниров
 * делают на телефон, поэтому портрет будет всегда.
 *
 * Отношение снимаем у ПЕРВОГО кадра и больше не меняем: если брать его у
 * текущего, коробка прыгала бы на каждом листании. Кадр другой формы лежит
 * на подложке по центру — за этим и подняли подложку до --bg-elevated.
 */
function отношениеКоробки(wrap, адрес) {
    if (!адрес) return;
    var пробник = new Image();
    пробник.onload = function () {
        if (!пробник.naturalWidth || !пробник.naturalHeight) return;
        wrap.style.setProperty('--kadr-shirina-k',
            (пробник.naturalWidth / пробник.naturalHeight).toFixed(4));
    };
    пробник.src = адрес;
}

function завестиКарусель(wrap, photos) {
    if (!wrap || photos.length < 2) return;

    отношениеКоробки(wrap, photos[0]);

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

    листалкаМиниатюр(wrap);
}

/**
 * Стрелки у ленты миниатюр. Когда снимков много, лента не помещается, и
 * пролистать её пальцем на настольном браузере нечем — крутить колесо вбок
 * умеют не все. Стрелки появляются, только если лента шире окна.
 */
function листалкаМиниатюр(wrap) {
    var лента = wrap.querySelector('.news-carousel-thumbs');
    if (!лента || лента.parentNode.classList.contains('news-thumbs-row')) return;

    var ряд = document.createElement('div');
    ряд.className = 'news-thumbs-row';
    лента.parentNode.insertBefore(ряд, лента);

    var назад = document.createElement('button');
    назад.className = 'news-thumbs-nav news-thumbs-back';
    назад.type = 'button';
    назад.innerHTML = '&#8249;';

    var вперёд = document.createElement('button');
    вперёд.className = 'news-thumbs-nav news-thumbs-fwd';
    вперёд.type = 'button';
    вперёд.innerHTML = '&#8250;';

    ряд.appendChild(назад);
    ряд.appendChild(лента);
    ряд.appendChild(вперёд);

    function шаг(сторона) {
        лента.scrollBy({ left: сторона * Math.round(лента.clientWidth * 0.8), behavior: 'smooth' });
    }
    назад.addEventListener('click', function() { шаг(-1); });
    вперёд.addEventListener('click', function() { шаг(1); });

    function обновить() {
        var влезает = лента.scrollWidth <= лента.clientWidth + 1;
        ряд.classList.toggle('news-thumbs-fits', влезает);
        назад.disabled = лента.scrollLeft <= 0;
        вперёд.disabled = лента.scrollLeft + лента.clientWidth >= лента.scrollWidth - 1;
    }
    лента.addEventListener('scroll', обновить);
    window.addEventListener('resize', обновить);
    setTimeout(обновить, 0);
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

    /* Enter и пробел делают то же, что нажатие: у кадра есть role="button",
       и клавиатура обязана вести себя как кнопка, а не как картинка. */
    root.addEventListener('keydown', function(e) {
        if (e.key !== 'Enter' && e.key !== ' ' && e.key !== 'Spacebar') return;
        var кадр = e.target.closest(IN_TEXT);
        if (!кадр || кадр.tagName !== 'IMG') return;
        e.preventDefault();
        кадр.click();
    });

    root.addEventListener('click', function(e) {
        /* Нажать могли и по кнопке кадра, и по самой картинке внутри неё:
           с клавиатуры цель — кнопка, мышью — чаще картинка. */
        var кнопка = e.target.closest('.news-carousel-kadr');
        var main = кнопка ? кнопка.querySelector('.news-carousel-main')
                          : e.target.closest('.news-carousel-main');
        if (main) {
            var wrap = main.closest('.news-carousel');
            var свои = (wrap && wrap.dataset.photos) ? JSON.parse(wrap.dataset.photos) : gallery;
            if (свои && свои.length) {
                e.preventDefault();
                openPhotoViewer(свои, Number(main.dataset.index) || 0);
                return;
            }
        }

        var el = e.target.closest(IN_TEXT);
        if (!el) return;
        e.preventDefault();
        var items = Array.prototype.slice.call(root.querySelectorAll(IN_TEXT));
        var i = items.indexOf(el);
        if (i !== -1) openPhotoViewer(items.map(urlOf), i);
    });
}

/**
 * Открывает снимок поверх страницы. Стрелки листают, Esc и клик по фону
 * закрывают.
 *
 * ПРОСМОТРЩИК НЕ ПРЕДСТАВЛЯЛСЯ ДИКТОРУ. ОБХОД 08.10: у .news-viewer не было
 * ни role="dialog", ни aria-modal, фокус не въезжал в окно и не возвращался
 * на кнопку после закрытия, ловушки Tab не было — Tab уводил на ссылки
 * страницы под накладкой. Esc работал, кнопки были подписаны.
 * Правило взято у Modal 26:143: окно объявляет себя окном, забирает фокус
 * и отдаёт его обратно тому, кто его открыл.
 */
function openPhotoViewer(urls, index) {
        var labels = getLabels();
        var ктоОткрыл = document.activeElement;

        var overlay = document.createElement('div');
        overlay.className = 'news-viewer';
        overlay.setAttribute('role', 'dialog');
        overlay.setAttribute('aria-modal', 'true');
        overlay.setAttribute('aria-label', labels.viewerTitle);
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
            /* ФОКУС ВОЗВРАЩАЕТСЯ ТОМУ, КТО ОТКРЫЛ ОКНО. Иначе он уезжает в
               начало страницы, и читатель на клавиатуре теряет место. */
            if (ктоОткрыл && typeof ктоОткрыл.focus === 'function') ктоОткрыл.focus();
        }
        /** Кнопки окна в порядке обхода. Пересчитывается: стрелки прячутся. */
        function кнопки() {
            return Array.prototype.filter.call(
                overlay.querySelectorAll('button'),
                function (b) { return b.offsetParent !== null; });
        }
        function onKey(e) {
            if (e.key === 'Escape') { close(); return; }
            if (e.key === 'ArrowRight') { show(index + 1); return; }
            if (e.key === 'ArrowLeft') { show(index - 1); return; }
            /* ЛОВУШКА TAB: пока окно открыто, обход идёт по его кнопкам и не
               выходит на страницу под накладкой. */
            if (e.key !== 'Tab') return;
            var свои = кнопки();
            if (!свои.length) return;
            var i = свои.indexOf(document.activeElement);
            e.preventDefault();
            var шаг = e.shiftKey ? -1 : 1;
            var след = (i === -1 ? (e.shiftKey ? свои.length - 1 : 0)
                                 : (i + шаг + свои.length) % свои.length);
            свои[след].focus();
        }

        overlay.querySelector('.news-viewer-close').addEventListener('click', close);
        overlay.querySelector('.news-viewer-prev').addEventListener('click', function(e) { e.stopPropagation(); show(index - 1); });
        overlay.querySelector('.news-viewer-next').addEventListener('click', function(e) { e.stopPropagation(); show(index + 1); });
        overlay.addEventListener('click', function(e) { if (e.target === overlay || e.target === img) close(); });
        document.addEventListener('keydown', onKey);
        show(index);
        var закрыть = overlay.querySelector('.news-viewer-close');
        if (закрыть) закрыть.focus();
}

function renderBlock(block, index) {
    var delay = Math.min(index * 50, 300);
    var style = 'transition-delay: ' + delay + 'ms';

    switch (block.type) {
        case 'html':
            // Тело статьи не прячем до прокрутки: это один блок высотой в
            // десять экранов, и появление по прокрутке для него не
            // срабатывало — текст с фотографиями просто оставался невидимым.
            return '<div class="news-html">' + block.html + '</div>';

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
            var listHtml = '<ul class="news-tekst-spisok news-animate" style="' + style + '">';
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

        var relВнешняя = !!rel.sourceUrl;
        html += '<a href="' + esc(relВнешняя ? rel.sourceUrl : (basePage + '?slug=' + rel.slug)) + '"' +
                (relВнешняя ? ' target="_blank" rel="noopener"' : '') +
                ' class="news-related-card' + (relВнешняя ? ' news-outside' : '') + '">' +
            '<div class="news-related-img' + (rel.ownCover ? ' news-own-cover' : '') + '">' +
                '<img src="' + esc(rel.heroImage) + '" alt="' + esc(rel.title) + '" loading="lazy">' +
                (rel.ownCover ? '<img class="news-znak" src="../images/kslt-logo.svg" alt="" aria-hidden="true">' : '') +
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
    /* ШАГ СТРАНИЦЫ — КОЛОНОК × РЯДОВ, А НЕ ЧИСЛО. Раскладка 07.10: крупная
       на два ряда плюс четыре боковые 2 × 2, и ряд из четырёх снизу —
       девять на широком виде. На узких колонок меньше (а на телефоне она
       одна), поэтому число приходит из живой сетки крутилкой --novostey. */
    var PER_PAGE = 9;

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
    }).filter(function (a) {
        /* На своём языке — всё, на чужом — только переведённое (см. выше) */
        return a.переведена !== false;
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
                // Лаймовой метки «Новости» нет: она повторяла раздел,
                // подсвеченный в меню — как на страницах турниров
                '<div class="news-list-header">' +
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
        ? { results: 'Results', interview: 'Interview', announcement: 'Announcement', world: 'World Tennis' }
        : (isKgPage()
            ? { results: 'Жыйынтыктар', interview: 'Интервью', announcement: 'Жарыялоо', world: 'Дүйнөлүк теннис' }
            : { results: 'Результаты', interview: 'Интервью', announcement: 'Анонс', world: 'Мировой теннис' });
    var existingKeys = categories.map(function(c) { return c.key; });
    knownCats.forEach(function(k) {
        if (existingKeys.indexOf(k) === -1) {
            categories.push({ key: k, label: catLabelsAll[k] || k });
        }
    });

    // Build filters + grid + pagination shell
    // Полоса та же, что на турнирах, кортах и тренерах: общий вид на весь сайт
    // Категории — выпадающим списком, тем же, что на кортах, тренерах и
    // поиске игрока: пять чипов занимали на телефоне две строки
    var всеКатегории = [{ key: 'all', label: labels.filterAll }].concat(categories);

    function разметкаКатегорий() {
        var подпись = labels.filterAll;
        всеКатегории.forEach(function(c) { if (c.key === currentFilter) подпись = c.label; });

        var пункты = '';
        всеКатегории.forEach(function(c) {
            пункты += '<button class="f-dd-item news-filter-btn' + (c.key === currentFilter ? ' active' : '') +
                '" data-cat="' + c.key + '" data-dd-value="' + c.key + '">' + c.label + '</button>';
        });

        return '<div class="f-dd" data-dd="category">' +
            '<button class="trn-chip f-dd-toggle' + (currentFilter !== 'all' ? ' active' : '') + '">' +
                подпись +
                '<svg class="f-dd-arrow" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M6 9l6 6 6-6"/></svg>' +
            '</button>' +
            '<div class="f-dd-menu">' + пункты + '</div>' +
        '</div>';
    }

    var chipsHtml = разметкаКатегорий();

    var filtersHtml =
        '<div class="trn-filters-inner">' +
            '<div class="trn-search-wrap">' +
                '<svg class="trn-search-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>' +
                '<input type="text" class="trn-search-input" id="newsSearch" placeholder="' + labels.searchPlaceholder + '" autocomplete="off">' +
            '</div>' +
            '<div class="trn-chips">' + chipsHtml + '</div>' +
        '</div>';

    // Insert filters as direct child of <main> so sticky works through sponsors
    var filtersWrapper = document.createElement('div');
    filtersWrapper.className = 'trn-filters';
    filtersWrapper.id = 'newsFilters';
    filtersWrapper.innerHTML = filtersHtml;
    notFound.parentNode.insertBefore(filtersWrapper, notFound);

    // Список живёт в той же секции, что и сообщение «ничего не найдено», а у неё
    // отступы под пустой экран — 128 точек сверху и снизу. Для списка они лишние.
    /* СПИСОК ЖИВЁТ В СВОЕЙ СЕКЦИИ — 07.10. Он рисовался ВНУТРИ секции
       «ничего не найдено», и брал её свойства: замер стенда показал, что
       у крупной карточки заголовок, дата и подзаголовок стояли ПО ЦЕНТРУ и
       заголовок шёл КАПСОМ — всё это правила пустого экрана, а не карточки.
       И пустому состоянию было негде появиться: его контейнер занят
       списком, поэтому фильтр без результатов молчал. Теперь секции две. */
    var список = document.getElementById('newsList');
    if (!список) {
        список = document.createElement('section');
        список.className = 'news-list';
        список.id = 'newsList';
        notFound.parentNode.insertBefore(список, notFound);
    }
    notFound.style.display = 'none';
    notFound.innerHTML = '';

    список.innerHTML =
        '<div class="news-list-page">' +
            /* ДВА КЛАССА, И ЭТО НЕ СЛУЧАЙНОСТЬ: `tournaments-grid` несёт
               ПРАВИЛА КАРТОЧКИ (кегли телефона, отступы тела, высота
               афиши), `news-grid` — СВОЮ раскладку и число строк в
               заголовке: на телефоне у списка их три, а не две. Так карточка остаётся одним компонентом без
               единой копии чисел, а бенто живёт отдельно. */
            '<div class="tournaments-grid news-grid" id="newsBento"></div>' +
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

        // Крупное место наверху отдаём новости со своей афишей. Мировые новости
        // приходят без картинки, и в высокий проём наша широкая обложка входит
        // сильным приближением — от кадра остаётся середина. Да и само место
        // разумнее отдавать своему, а не пересказу чужой заметки.
        // Если своих афиш на странице нет вовсе — крупной карточки не будет,
        // все пойдут мелкими, ряд от этого не разъезжается.
        var своя = -1;
        for (var i = 0; i < pageItems.length; i++) {
            if (!pageItems[i].ownCover) { своя = i; break; }
        }
        if (своя > 0) {
            pageItems = pageItems.slice();
            pageItems.unshift(pageItems.splice(своя, 1)[0]);
        }
        var естьКрупная = своя !== -1;

        // Bento grid
        var html = '';
        pageItems.forEach(function(article, i) {
            var readTime = calculateReadTime(article);
            var isLarge = естьКрупная && i === 0;

            var внешняя = !!article.sourceUrl;
            var адрес = внешняя ? article.sourceUrl : (basePage + '?slug=' + article.slug);
            var наружу = внешняя ? ' target="_blank" rel="noopener"' : '';

            /* КАРТОЧКА — КОМПОНЕНТ .tc ЦЕЛИКОМ, слово Кости 07.10: размеры,
               лестница и зазоры берутся с карточки турнира лендинга, своего
               не рисуем ничего. Соответствие полей: дата → .tc-date,
               заголовок → .tc-title, подзаголовок → .tc-desc (только у
               крупной, как у турнира), время чтения → .tc-meta,
               категория → .tc-badge. Кнопки у новости нет: карточка и есть
               ссылка, а кнопка внутри ссылки — недопустимая разметка. */
            var афиша = esc(article.cardImage || article.heroImage || '');
            html += '<a href="' + esc(адрес) + '"' + наружу + ' class="tc' + (isLarge ? ' tc-featured' : '') +
                    (внешняя ? ' news-outside' : '') + '">' +
                /* ЗНАК НАШЕЙ ПОДМЕНЫ — И НА ВИТРИНЕ ТОЖЕ. До 08.10 он стоял
                   только в шапке статьи и на карточке «похожей», а на витрине
                   списка его не было вовсе — при том, что кадр там такая же
                   наша подмена (js/news-covers.js). */
                '<div class="tc-image' + (article.ownCover ? ' news-own-cover' : '') + '"' + (афиша ? ' style="--tc-poster:url(&quot;' + афиша + '&quot;)"' : '') + '>' +
                    (афиша ? '<img src="' + афиша + '" alt="" loading="lazy">' : '<div class="tc-noimage">\uD83C\uDFBE</div>') +
                    (article.ownCover ? '<img class="news-znak" src="../images/kslt-logo.svg" alt="" aria-hidden="true">' : '') +
                    '<span class="tc-badge">' + esc(article.categoryLabel || '') + '</span>' +
                '</div>' +
                '<div class="tc-body">' +
                    '<span class="tc-date">' + esc(article.date || '') + '</span>' +
                    (isLarge ? '<h2 class="tc-title">' : '<h3 class="tc-title">') + esc(article.title || '') +
                    (isLarge ? '</h2>' : '</h3>') +
                    (isLarge && article.subtitle ? '<p class="tc-desc">' + esc(article.subtitle) + '</p>' : '') +
                    '<div class="tc-meta"><span>' + readTime + ' ' + esc(labels.readTime) + '</span></div>' +
                '</div>' +
            '</a>';
        });

        document.getElementById('newsBento').innerHTML = html;

        /* ПУСТО ДОЛЖНО ГОВОРИТЬ. Два случая и две разные фразы: ничего не
           нашлось по запросу — и в категории пусто. Молчащий экран человек
           читает как поломку. */
        var пусто = document.getElementById('newsEmpty');
        if (!pageItems.length) {
            if (!пусто) {
                пусто = document.createElement('div');
                пусто.className = 'news-empty';
                пусто.id = 'newsEmpty';
                document.getElementById('newsBento').parentNode.appendChild(пусто);
            }
            пусто.innerHTML = '<p class="news-empty-title">' +
                esc(searchQuery ? (labels.emptySearch || 'Ничего не нашлось') : (labels.emptyCategory || 'В этой категории пока пусто')) +
                '</p><p class="news-empty-hint">' +
                esc(searchQuery ? (labels.emptySearchHint || 'Проверьте написание или очистите поиск')
                                : (labels.emptyCategoryHint || 'Выберите другую категорию')) + '</p>';
            пусто.style.display = '';
        } else if (пусто) {
            пусто.style.display = 'none';
        }

        /* ПОЛОСА СТРАНИЦ — ОБЩИЙ КОМПОНЕНТ. Здесь лежала ПЯТАЯ копия на
           сайте: .pl-page-btn / -prev / -next / -num, все номера подряд
           без окна и без счётчика строк. Теперь её рисует
           js/polosa-stranic.js — тот же, что у рейтинга, кортов, тренеров
           и поиска игрока: шевроны, окно номеров, счётчик, кнопки 36 с
           целью 44, сжатая форма ниже 640. */
        var полоса = document.getElementById('newsPagination');
        if (!полоса) return;
        if (!window.KSLT_полосаСтраниц) { полоса.innerHTML = ''; return; }
        window.KSLT_полосаСтраниц(полоса, filtered.length, currentPage, PER_PAGE, labels);
    }

    /* ШАГ ЧИТАЕТСЯ ИЗ ЖИВОЙ СЕТКИ, а не из ширины окна: правило 07.10,
       то же, что у кортов, тренеров и поиска игрока. Повтор отрисовки один
       и у него сторож. */
    var _шагИдёт = false;
    function пересчитатьШаг() {
        var сетка = document.querySelector('.news-grid');
        if (!сетка) return false;
        var н = parseInt(window.getComputedStyle(сетка).getPropertyValue('--novostey'), 10);
        if (!н || н === PER_PAGE) return false;
        PER_PAGE = н;
        return true;
    }
    function следитьЗаШагом() {
        var сетка = document.querySelector('.news-grid');
        if (!сетка || typeof ResizeObserver === 'undefined') return;
        new ResizeObserver(function () {
            if (!_шагИдёт && пересчитатьШаг()) { _шагИдёт = true; renderGrid(); _шагИдёт = false; }
        }).observe(сетка);
    }

    renderGrid();
    if (!_шагИдёт && пересчитатьШаг()) { _шагИдёт = true; renderGrid(); _шагИдёт = false; }
    следитьЗаШагом();

    // === EVENT LISTENERS ===
    // Search
    document.getElementById('newsSearch').addEventListener('input', function(e) {
        searchQuery = e.target.value.trim();
        currentPage = 1;
        renderGrid();
    });

    // Filters
    document.getElementById('newsFilters').addEventListener('click', function(e) {
        var кнопка = e.target.closest('.f-dd-toggle');
        var пункт = e.target.closest('.news-filter-btn');

        if (кнопка) {
            var список = кнопка.closest('.f-dd');
            var былОткрыт = список.classList.contains('open');
            document.querySelectorAll('.f-dd.open').forEach(function(d) { d.classList.remove('open'); });
            if (!былОткрыт) список.classList.add('open');
            return;
        }

        if (!пункт) return;

        currentFilter = пункт.dataset.cat;
        currentPage = 1;
        // Перерисовываем только сам список: полоса целиком унесла бы с собой
        // поле поиска вместе с набранным текстом
        var полоса = document.querySelector('#newsFilters .trn-chips');
        if (полоса) полоса.innerHTML = разметкаКатегорий();
        renderGrid();
    });

    // Закрыть открытый список, если нажали мимо
    document.addEventListener('click', function(e) {
        if (e.target.closest('.f-dd')) return;
        document.querySelectorAll('.f-dd.open').forEach(function(d) { d.classList.remove('open'); });
    });

    // Pagination
    document.getElementById('newsPagination').addEventListener('click', function(e) {
        var btn = e.target.closest('.pl-page-btn');
        if (!btn || btn.disabled) return;

        if (btn.classList.contains('pl-page-prev')) {
            currentPage = Math.max(1, currentPage - 1);
        } else if (btn.classList.contains('pl-page-next')) {
            currentPage++;
        } else if (btn.dataset.page) {
            currentPage = parseInt(btn.dataset.page);
        }
        renderGrid();
        window.KSLT_прокрутитьКСписку(document.getElementById('newsBento'));
    });
}

// ========================================
// NOT FOUND
// ========================================

/** Статья есть, но не на этом языке. Пустое состояние, а не «не найдено». */
function renderNetPerevoda(article) {
    var labels = getLabels();
    var ruUrl = 'news.html?slug=' + encodeURIComponent(article.slug);

    document.title = 'KSLT — ' + labels.noTranslationTitle;

    ['newsHero', 'newsArticleBody', 'newsTags', 'newsReactions', 'newsRelated']
        .forEach(function (id) {
            var el = document.getElementById(id);
            if (el) el.style.display = 'none';
        });

    var место = document.getElementById('newsNotFound');
    if (!место) return;
    место.style.display = 'flex';
    место.innerHTML =
        '<div class="news-not-found-icon">&#127760;</div>' +
        '<h1>' + labels.noTranslationTitle + '</h1>' +
        '<p>' + labels.noTranslationText + '</p>' +
        '<a href="' + ruUrl + '" class="news-not-found-btn">' + labels.noTranslationBtn + '</a>';
}

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
