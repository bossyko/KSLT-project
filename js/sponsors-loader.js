// ============================================
// Sponsors Loader — universal dynamic sponsors block
// Replaces all hardcoded renderSponsors() functions
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var defaultLabels = {
        title: isEn ? 'Partners & Sponsors' : (isKg ? 'Өнөктөштөр жана демөөрчүлөр' : 'Партнёры и спонсоры'),
        general: isEn ? 'General Sponsor' : (isKg ? 'Башкы демөөрчү' : 'Генеральный спонсор')
    };

    // Cache sponsors data (loaded once, reused for both section and carousel)
    var _cache = null;
    var _pending = null;

    function fetchSponsors() {
        var client = window.supabaseClient;
        if (!client) return Promise.resolve([]);
        if (_cache) return Promise.resolve(_cache);
        if (_pending) return _pending;
        _pending = client.from('sponsors').select('*').order('sort_order').then(function(res) {
            _cache = (res.data && !res.error) ? res.data : [];
            _pending = null;
            return _cache;
        });
        return _pending;
    }

    /**
     * Load sponsors section (hero + cloud)
     * @param {string} containerId - DOM element ID
     * @param {Object} [labels] - { title, general }
     */
    window.loadSponsors = function(containerId, labels) {
        var container = document.getElementById(containerId);
        if (!container) return;

        var lbl = labels || {};
        var title = lbl.title || defaultLabels.title;
        var general = lbl.general || defaultLabels.general;

        fetchSponsors().then(function(data) {
            if (!data.length) { container.innerHTML = ''; return; }

            var heroes = [];
            var regular = [];
            data.forEach(function(s) {
                if (s.is_hero) heroes.push(s);
                else regular.push(s);
            });

            var html = '<div class="section-header"><h2>' + title + '</h2></div>';

            heroes.forEach(function(s) {
                var href = s.url ? ' href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"' : ' href="#"';
                html += '<div class="sponsor-hero">' +
                    '<span class="sponsor-hero-label">' + general + '</span>' +
                    '<a' + href + ' class="sponsor-hero-logo" title="' + esc(s.name) + '">' +
                        (s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '<span>' + esc(s.name) + '</span>') +
                    '</a>' +
                '</div>';
            });

            if (regular.length) {
                html += '<div class="sponsors-cloud">';
                regular.forEach(function(s) {
                    var href = s.url ? ' href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"' : ' href="#"';
                    html += '<a' + href + ' class="sponsor-logo-link" title="' + esc(s.name) + '">' +
                        (s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '<span>' + esc(s.name) + '</span>') +
                    '</a>';
                });
                html += '</div>';
            }

            container.innerHTML = html;
        });
    };

    /**
     * Load sponsors into a marquee/carousel (infinite scroll)
     * @param {string} containerId - DOM element ID of .hero-sponsors-carousel or similar
     */
    window.loadSponsorsCarousel = function(containerId) {
        var container = document.getElementById(containerId);
        if (!container) return;

        fetchSponsors().then(function(data) {
            if (!data.length) {
                var section = container.closest('.hero-sponsors-section');
                if (section) section.style.display = 'none';
                return;
            }

            // Build slides (all sponsors, not just non-hero)
            var slides = '';
            data.forEach(function(s) {
                var href = s.url ? ' href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer"' : '';
                var tag = s.url ? 'a' : 'div';
                slides += '<' + tag + ' class="carousel-slide-infinite"' + href + '>' +
                    (s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '') +
                    '<span>' + esc(s.name) + '</span>' +
                '</' + tag + '>';
            });

            // Duplicate for infinite scroll effect
            container.innerHTML = '<div class="carousel-track-infinite">' + slides + slides + '</div>';
        });
    };

    /**
     * Auto-update header .sponsor-badge with hero sponsor from DB
     */
    function updateHeaderSponsor() {
        var badge = document.querySelector('.sponsor-badge');
        if (!badge) return;

        fetchSponsors().then(function(data) {
            var hero = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i].is_hero) { hero = data[i]; break; }
            }
            if (!hero) { badge.style.display = 'none'; return; }

            var label = isEn ? 'supported by' : (isKg ? 'колдоосу менен' : 'при поддержке');
            var href = hero.url ? ' href="' + esc(hero.url) + '" target="_blank" rel="noopener"' : '';
            var logoHtml = hero.logo
                ? '<img src="' + esc(hero.logo) + '" alt="' + esc(hero.name) + '" class="sponsor-logo-img">'
                : '<span class="sponsor-logo-img" style="font-weight:600;color:var(--accent)">' + esc(hero.name) + '</span>';

            badge.innerHTML =
                '<span class="sponsor-label">' + label + '</span>' +
                '<a' + href + ' class="sponsor-logo-link">' + logoHtml + '</a>';
        });
    }

    // Auto-run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateHeaderSponsor);
    } else {
        updateHeaderSponsor();
    }

    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

})();
