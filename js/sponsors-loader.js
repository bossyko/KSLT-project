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

    var modalLabels = {
        website: isEn ? 'Website' : (isKg ? 'Веб-сайт' : 'Веб-сайт'),
        whatsapp: 'WhatsApp',
        instagram: 'Instagram',
        telegram: 'Telegram',
        phone: isEn ? 'Call' : (isKg ? 'Чалуу' : 'Позвонить'),
        email: isEn ? 'Email' : (isKg ? 'Электрондук почта' : 'Эл. почта'),
        address: isEn ? 'Address' : (isKg ? 'Дарек' : 'Адрес'),
        close: isEn ? 'Close' : (isKg ? 'Жабуу' : 'Закрыть')
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

    // Check if sponsor has extra contact info beyond just a URL
    function hasContactInfo(s) {
        return s.phone || s.whatsapp || s.instagram || s.telegram || s.email || s.address ||
               s.description || s.description_en || s.description_kg;
    }

    // Get localized description
    function getDescription(s) {
        if (isEn) return s.description_en || s.description || '';
        if (isKg) return s.description_kg || s.description || '';
        return s.description || '';
    }

    // Format WhatsApp number for wa.me link
    function waLink(num) {
        return 'https://wa.me/' + num.replace(/[^0-9]/g, '');
    }

    // Format Instagram username for link
    function igLink(handle) {
        var clean = handle.replace(/^@/, '');
        return 'https://instagram.com/' + clean;
    }

    // Format Telegram username for link
    function tgLink(handle) {
        if (handle.indexOf('http') === 0) return handle;
        var clean = handle.replace(/^@/, '');
        return 'https://t.me/' + clean;
    }

    // ---- Sponsor Detail Modal ----
    function showSponsorModal(s) {
        // Remove existing
        var old = document.querySelector('.spon-modal-overlay');
        if (old) old.remove();

        var desc = getDescription(s);

        // Build action buttons
        var actions = '';

        if (s.url) {
            actions += '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" class="spon-modal-action">' +
                '<span class="spon-modal-action-icon">🌐</span>' +
                '<span>' + modalLabels.website + '</span>' +
            '</a>';
        }
        if (s.phone) {
            actions += '<a href="tel:' + esc(s.phone.replace(/[^0-9+]/g, '')) + '" class="spon-modal-action spon-action-phone">' +
                '<span class="spon-modal-action-icon">📞</span>' +
                '<span>' + modalLabels.phone + ' ' + esc(s.phone) + '</span>' +
            '</a>';
        }
        if (s.whatsapp) {
            actions += '<a href="' + waLink(s.whatsapp) + '" target="_blank" rel="noopener noreferrer" class="spon-modal-action spon-action-wa">' +
                '<span class="spon-modal-action-icon">📱</span>' +
                '<span>' + modalLabels.whatsapp + '</span>' +
            '</a>';
        }
        if (s.instagram) {
            actions += '<a href="' + igLink(s.instagram) + '" target="_blank" rel="noopener noreferrer" class="spon-modal-action spon-action-ig">' +
                '<span class="spon-modal-action-icon">📷</span>' +
                '<span>' + modalLabels.instagram + '</span>' +
            '</a>';
        }
        if (s.telegram) {
            actions += '<a href="' + tgLink(s.telegram) + '" target="_blank" rel="noopener noreferrer" class="spon-modal-action spon-action-tg">' +
                '<span class="spon-modal-action-icon">✈️</span>' +
                '<span>' + modalLabels.telegram + '</span>' +
            '</a>';
        }
        if (s.email) {
            actions += '<a href="mailto:' + esc(s.email) + '" class="spon-modal-action spon-action-email">' +
                '<span class="spon-modal-action-icon">✉️</span>' +
                '<span>' + modalLabels.email + '</span>' +
            '</a>';
        }

        var addressHtml = '';
        if (s.address) {
            addressHtml = '<div class="spon-modal-address">📍 ' + esc(s.address) + '</div>';
        }

        var overlay = document.createElement('div');
        overlay.className = 'spon-modal-overlay';
        overlay.innerHTML =
            '<div class="spon-modal">' +
                '<button class="spon-modal-close">&times;</button>' +
                (s.logo ? '<div class="spon-modal-logo"><img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '"></div>' : '') +
                '<div class="spon-modal-name">' + esc(s.name) + '</div>' +
                (desc ? '<div class="spon-modal-desc">' + esc(desc) + '</div>' : '') +
                addressHtml +
                (actions ? '<div class="spon-modal-actions">' + actions + '</div>' : '') +
                '<button class="spon-modal-close-btn">' + modalLabels.close + '</button>' +
            '</div>';

        document.body.appendChild(overlay);

        requestAnimationFrame(function() {
            overlay.classList.add('visible');
        });

        // Close handlers
        overlay.querySelector('.spon-modal-close').addEventListener('click', function() {
            closeSponsorModal(overlay);
        });
        overlay.querySelector('.spon-modal-close-btn').addEventListener('click', function() {
            closeSponsorModal(overlay);
        });
        overlay.addEventListener('click', function(e) {
            if (e.target === overlay) closeSponsorModal(overlay);
        });
    }

    function closeSponsorModal(overlay) {
        overlay.classList.remove('visible');
        setTimeout(function() { overlay.remove(); }, 250);
    }

    // Build sponsor link/button — uses modal if has extra info, direct link otherwise
    function buildSponsorElement(s, className, innerHtml) {
        var hasExtra = hasContactInfo(s);
        var hasMultipleLinks = 0;
        if (s.url) hasMultipleLinks++;
        if (s.phone) hasMultipleLinks++;
        if (s.whatsapp) hasMultipleLinks++;
        if (s.instagram) hasMultipleLinks++;
        if (s.telegram) hasMultipleLinks++;
        if (s.email) hasMultipleLinks++;

        // Modal if: has description/address, or has 2+ links
        if (hasExtra || hasMultipleLinks >= 2) {
            return '<a href="#" class="' + className + '" data-sponsor-id="' + esc(s.id) + '" title="' + esc(s.name) + '">' +
                innerHtml + '</a>';
        }
        // Single link — direct
        if (s.url) {
            return '<a href="' + esc(s.url) + '" target="_blank" rel="noopener noreferrer" class="' + className + '" title="' + esc(s.name) + '">' +
                innerHtml + '</a>';
        }
        // No links at all
        return '<a href="#" class="' + className + '" title="' + esc(s.name) + '">' + innerHtml + '</a>';
    }

    /**
     * Load sponsors section (hero + cloud)
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
                var inner = s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '<span>' + esc(s.name) + '</span>';
                html += '<div class="sponsor-hero">' +
                    '<span class="sponsor-hero-label">' + general + '</span>' +
                    buildSponsorElement(s, 'sponsor-hero-logo', inner) +
                '</div>';
            });

            if (regular.length) {
                html += '<div class="sponsors-cloud">';
                regular.forEach(function(s) {
                    var inner = s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '<span>' + esc(s.name) + '</span>';
                    html += buildSponsorElement(s, 'sponsor-logo-link', inner);
                });
                html += '</div>';
            }

            container.innerHTML = html;
        });
    };

    /**
     * Load sponsors into a marquee/carousel (infinite scroll)
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

            var slides = '';
            data.forEach(function(s) {
                var inner = (s.logo ? '<img src="' + esc(s.logo) + '" alt="' + esc(s.name) + '">' : '') +
                    '<span>' + esc(s.name) + '</span>';
                slides += buildSponsorElement(s, 'carousel-slide-infinite', inner);
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

    // ---- View counter (localStorage dedup) ----
    function incrementSponsorView(id) {
        if (!id) return;
        var key = 'kslt_sponview_' + id;
        if (localStorage.getItem(key)) return;
        var cl = window.supabaseClient;
        if (!cl) return;
        cl.rpc('increment_sponsor_view', { p_id: id }).then(function() {
            localStorage.setItem(key, '1');
        });
    }

    // ---- Click delegation for sponsor modals ----
    document.addEventListener('click', function(e) {
        var link = e.target.closest('[data-sponsor-id]');
        if (!link) return;
        e.preventDefault();

        var sponsorId = link.dataset.sponsorId;
        fetchSponsors().then(function(data) {
            var sponsor = null;
            for (var i = 0; i < data.length; i++) {
                if (data[i].id === sponsorId) { sponsor = data[i]; break; }
            }
            if (sponsor) {
                incrementSponsorView(sponsor.id);
                showSponsorModal(sponsor);
            }
        });
    });

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
