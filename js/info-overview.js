// ========================================
// Info Overview — static page (no Supabase)
// ========================================

(function() {
    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var L = isEn ? {
        heroTagline: 'KSLT Information',
        heroTitle: 'All about <span>KSLT</span>',
        heroFull: 'Kyrgyzstan Social Lawn Tennis',
        heroSub: 'an amateur tennis community platform',
        heroDesc: 'Rules, ratings, pricing and everything about the community',
        featuredTitle: 'About the Project',
        featuredDesc: 'KSLT is the first tennis community in Kyrgyzstan, uniting amateurs and professionals. Learn about our mission, history and plans.',
        featuredBtn: 'Learn more',
        rulesTitle: 'Rules',
        rulesDesc: 'Tournament rules, player code of conduct and league regulations.',
        faqTitle: 'FAQ',
        faqDesc: 'Answers to frequently asked questions about KSLT membership and tournaments.',
        pricingTitle: 'Pricing',
        pricingDesc: 'Membership fees, tournament participation costs and available packages.',
        offerTitle: 'Public Offer',
        offerDesc: 'Legal terms of service, membership agreement and official documentation.',
        more: 'Learn more'
    } : isKg ? {
        heroTagline: 'КСЛТ Маалымат',
        heroTitle: '<span>КСЛТ</span> жөнүндө баары',
        // Название пишем как имя собственное, с заглавных — как русское и
        // английское. Официального киргизского названия у нас пока нет,
        // это перевод и его должна подтвердить Айсулуу
        heroFull: 'Кыргызстан Теннис Ышкыбоздорунун Коомчулугу',
        heroDesc: 'Эрежелер, рейтинг, баалар жана коомчулук жөнүндө билүү керек болгон бардыгы',
        featuredTitle: 'Долбоор жөнүндө',
        featuredDesc: 'KSLT — Кыргызстандагы биринчи теннис коомчулугу, ышкыбоздорду жана профессионалдарды бириктирет. Биздин миссия, тарых жана пландар жөнүндө билиңиз.',
        featuredBtn: 'Толугураак',
        rulesTitle: 'Эрежелер',
        rulesDesc: 'Мелдеш эрежелери, оюнчулар кодекси жана лига регламенти.',
        faqTitle: 'FAQ',
        faqDesc: 'KSLT мүчөлүгү жана мелдештер жөнүндө көп берилүүчү суроолорго жооптор.',
        pricingTitle: 'Баалар',
        pricingDesc: 'Мүчөлүк төлөмдөр, мелдештерге катышуу наркы жана жеткиликтүү пакеттер.',
        offerTitle: 'Ачык оферта',
        offerDesc: 'Юридикалык шарттар, мүчөлүк келишими жана расмий документация.',
        more: 'Толугураак'
    } : {
        heroTagline: 'КСЛТ Информация',
        heroTitle: 'Всё о <span>КСЛТ</span>',
        heroFull: 'Кыргызстанское Сообщество Любителей Тенниса',
        heroDesc: 'Правила, рейтинг, цены и всё, что нужно знать о сообществе',
        featuredTitle: 'О проекте',
        featuredDesc: 'KSLT — первое теннисное сообщество в Кыргызстане, объединяющее любителей и профессионалов. Узнайте о нашей миссии, истории и планах.',
        featuredBtn: 'Подробнее',
        rulesTitle: 'Правила',
        rulesDesc: 'Правила турниров, кодекс игрока и регламент лиги.',
        faqTitle: 'FAQ',
        faqDesc: 'Ответы на частые вопросы о членстве в KSLT и турнирах.',
        pricingTitle: 'Цены',
        pricingDesc: 'Членские взносы, стоимость участия в турнирах и доступные пакеты.',
        offerTitle: 'Публичная оферта',
        offerDesc: 'Юридические условия, договор членства и официальная документация.',
        more: 'Подробнее'
    };

    var aboutPage = isEn ? 'about-en.html' : (isKg ? 'about-kg.html' : 'about.html');
    var rulesPage = isEn ? 'rules-en.html' : (isKg ? 'rules-kg.html' : 'rules.html');
    var faqPage = isEn ? 'faq-en.html' : (isKg ? 'faq-kg.html' : 'faq.html');
    var pricingPage = isEn ? 'pricing-en.html' : (isKg ? 'pricing-kg.html' : 'pricing.html');
    var offerPage = isEn ? 'offer-en.html' : (isKg ? 'offer-kg.html' : 'offer.html');

    // SVG icons
    var bookSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>';
    var helpSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>';
    var tagSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>';
    var fileSvg = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>';
    var arrowSvg = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M12 5l7 7-7 7"/></svg>';

    var cards = [
        { title: L.rulesTitle, desc: L.rulesDesc, href: rulesPage, icon: bookSvg },
        { title: L.pricingTitle, desc: L.pricingDesc, href: pricingPage, icon: tagSvg },
        { title: L.faqTitle, desc: L.faqDesc, href: faqPage, icon: helpSvg },
        { title: L.offerTitle, desc: L.offerDesc, href: offerPage, icon: fileSvg }
    ];

    document.addEventListener('DOMContentLoaded', init);

    function init() {
        renderHero();
        renderCards();
    }

    function renderHero() {
        var el = document.getElementById('ioHero');
        if (!el) return;
        var heroImg = 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80';
        el.innerHTML =
            '<div class="io-hero-bg"><img src="' + heroImg + '" alt=""></div>' +
            '<div class="io-hero-overlay"></div>' +
            '<div class="io-hero-content">' +
                '<div class="io-hero-tagline">' + L.heroTagline + '</div>' +
                '<h1>' + L.heroTitle + '</h1>' +
                // Расшифровка аббревиатуры прямо под заголовком: человек,
                // впервые попавший на сайт, из трёх букв ничего не понимает
                // Полное название — вторым заголовком: аббревиатура сама по
                // себе ничего не говорит, а название организации это и есть
                // главное, что человек должен унести со страницы
                (L.heroFull ? '<h2 class="io-hero-full">' + L.heroFull + '</h2>' : '') +
                (L.heroSub ? '<div class="io-hero-sub">' + L.heroSub + '</div>' : '') +
                '<p>' + L.heroDesc + '</p>' +
            '</div>';
    }

    function renderCards() {
        var el = document.getElementById('ioContent');
        if (!el) return;

        var featuredImg = 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200&q=80';
        var html = '';

        // Featured card — About
        html += '<a class="io-featured" href="' + aboutPage + '">' +
            '<div class="io-featured-bg"><img src="' + featuredImg + '" alt="" loading="lazy"></div>' +
            '<div class="io-featured-overlay"></div>' +
            '<div class="io-featured-content">' +
                '<h2>' + L.featuredTitle + '</h2>' +
                '<p>' + L.featuredDesc + '</p>' +
                '<span class="io-featured-link">' + L.featuredBtn + ' &rarr;</span>' +
            '</div>' +
        '</a>';

        // Grid 2x2
        html += '<div class="io-grid">';
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            html += '<a class="io-card" href="' + c.href + '">' +
                '<div class="io-card-icon">' + c.icon + '</div>' +
                '<h3>' + c.title + '</h3>' +
                '<p>' + c.desc + '</p>' +
                '<span class="io-card-arrow">' + L.more + ' ' + arrowSvg + '</span>' +
            '</a>';
        }
        html += '</div>';

        el.innerHTML = html;
    }

})();
