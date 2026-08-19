// ============================================
// Sponsors Loader — universal dynamic sponsors block
// Replaces all hardcoded renderSponsors() functions
// ============================================

(function() {
    'use strict';

    var isEn = window.location.pathname.indexOf('-en') !== -1;
    var isKg = window.location.pathname.indexOf('-kg') !== -1;

    var defaultLabels = {
        // «Партнёры» на сайте уже означают партнёра по игре — так называется
        // страница поиска. В блоке спонсоров это слово путало: партнёр,
        // пришедший по письму о спонсорстве, попадал в поиск игроков
        title: isEn ? 'KSLT Sponsors' : (isKg ? 'КСЛТ демөөрчүлөрү' : 'Спонсоры КСЛТ'),
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
            // Ошибку нельзя выдавать за пустоту: раньше недоступная база и
            // «спонсоров нет» выглядели одинаково — блок просто исчезал, и
            // никто не мог отличить поломку от отсутствия спонсоров
            if (res.error) {
                console.error('[KSLT] спонсоры не загружены:', res.error.message || res.error);
                _pending = null;
                return null;
            }
            _cache = res.data || [];
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

    // В админку вставляют по-разному: где-то имя пользователя, где-то ссылку
    // целиком со всеми метками. Раньше ссылку приклеивали к нашему адресу и
    // получалось instagram.com/https://instagram.com/... — переход не работал.

    /** Имя пользователя из того, что ввели: хоть @имя, хоть полный адрес. */
    function handleOf(value) {
        var v = String(value || '').trim();
        if (v.indexOf('http') === 0) {
            v = v.replace(/^https?:\/\/(www\.)?[^/]+\//, '');   // убираем адрес сайта
        }
        return v.replace(/^@/, '').replace(/[?#].*$/, '').replace(/\/+$/, '');
    }

    function waLink(num) {
        var v = String(num || '');
        if (v.indexOf('http') === 0) return v;
        return 'https://wa.me/' + v.replace(/[^0-9]/g, '');
    }

    function igLink(handle) {
        return 'https://instagram.com/' + handleOf(handle);
    }

    // Format Telegram username for link
    function tgLink(handle) {
        return 'https://t.me/' + handleOf(handle);
    }

    /** Что показать рядом с иконкой: адрес сайта без протокола и хвостов. */
    function siteLabel(url) {
        return String(url || '')
            .replace(/^https?:\/\//, '')
            .replace(/^www\./, '')
            .replace(/\/+$/, '');
    }

    // Фирменные значки вместо эмодзи: эмодзи рисует операционная система,
    // на Windows они выглядят иначе, а WhatsApp и Telegram узнаются именно
    // по своим значкам, а не по трубке и самолётику.
    var ICON = {
        site: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
        phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
        whatsapp: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.5 14.4c-.3-.2-1.7-.9-2-1-.3-.1-.5-.1-.7.1-.2.3-.7 1-.9 1.2-.2.2-.3.2-.6.1-.3-.2-1.2-.5-2.3-1.4-.9-.8-1.4-1.7-1.6-2-.2-.3 0-.5.1-.6l.5-.6c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5 0-.2-.7-1.6-.9-2.2-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.7-.7 2-1.4.2-.7.2-1.3.2-1.4-.1-.1-.3-.2-.6-.3z"/><path d="M12 2A10 10 0 0 0 3.5 17.2L2 22l4.9-1.5A10 10 0 1 0 12 2zm0 18.2c-1.6 0-3.1-.4-4.4-1.2l-.3-.2-3 .9.9-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2z"/></svg>',
        instagram: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="2" y="2" width="20" height="20" rx="5.5"/><circle cx="12" cy="12" r="4.2"/><circle cx="17.6" cy="6.4" r="1.2" fill="currentColor" stroke="none"/></svg>',
        telegram: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21.9 4.3 18.7 19.4c-.2 1.1-.9 1.3-1.8.8l-4.9-3.6-2.4 2.3c-.3.3-.5.5-1 .5l.3-4.9 9-8.1c.4-.3-.1-.5-.6-.2L6.2 12.6l-4.8-1.5c-1-.3-1-1 .2-1.5l18.8-7.2c.9-.3 1.7.2 1.4 1.9z"/></svg>',
        email: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 5L2 7"/></svg>',
        pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
    };

    /** Строка действия: значок, подпись и сам адрес — чтобы было видно, куда ведёт. */
    function action(href, cls, icon, label, value, blank) {
        return '<a href="' + href + '"' + (blank ? ' target="_blank" rel="noopener noreferrer"' : '') +
            ' class="spon-modal-action' + (cls ? ' ' + cls : '') + '">' +
            '<span class="spon-modal-action-icon">' + icon + '</span>' +
            '<span class="spon-modal-action-text">' +
                '<span class="spon-modal-action-label">' + label + '</span>' +
                (value ? '<span class="spon-modal-action-value">' + esc(value) + '</span>' : '') +
            '</span>' +
        '</a>';
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
            actions += action(esc(s.url), '', ICON.site, modalLabels.website, siteLabel(s.url), true);
        }
        if (s.phone) {
            actions += action('tel:' + esc(s.phone.replace(/[^0-9+]/g, '')), 'spon-action-phone',
                ICON.phone, modalLabels.phone, s.phone, false);
        }
        if (s.whatsapp) {
            actions += action(waLink(s.whatsapp), 'spon-action-wa',
                ICON.whatsapp, modalLabels.whatsapp, s.whatsapp, true);
        }
        if (s.instagram) {
            actions += action(igLink(s.instagram), 'spon-action-ig',
                ICON.instagram, modalLabels.instagram, '@' + handleOf(s.instagram), true);
        }
        if (s.telegram) {
            actions += action(tgLink(s.telegram), 'spon-action-tg',
                ICON.telegram, modalLabels.telegram, '@' + handleOf(s.telegram), true);
        }
        if (s.email) {
            actions += action('mailto:' + esc(s.email), 'spon-action-email',
                ICON.email, modalLabels.email, s.email, false);
        }

        var addressHtml = '';
        if (s.address) {
            addressHtml = '<div class="spon-modal-address">' +
                '<span class="spon-modal-address-icon">' + ICON.pin + '</span>' + esc(s.address) + '</div>';
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
            // Посетителю сообщать не о чем — он пришёл не за спонсорами.
            // Но состояние оставляем в разметке, чтобы поломку было видно
            if (data === null) {
                container.innerHTML = '';
                container.setAttribute('data-sponsors', 'error');
                return;
            }
            if (!data.length) {
                container.innerHTML = '';
                container.setAttribute('data-sponsors', 'empty');
                return;
            }
            container.setAttribute('data-sponsors', 'ok');

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
            if (!data || !data.length) {
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
            if (!data) return;
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
            if (!data) return;
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

    // ---- Site visit tracking (once per session) ----
    function trackSiteVisit() {
        if (sessionStorage.getItem('kslt_sv')) return;
        var cl = window.supabaseClient;
        if (!cl) return;
        cl.rpc('increment_page_view', { p_page_name: 'site_visit' });
        sessionStorage.setItem('kslt_sv', '1');
    }

    // Auto-run on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function() {
            updateHeaderSponsor();
            trackSiteVisit();
        });
    } else {
        updateHeaderSponsor();
        trackSiteVisit();
    }

    function esc(str) {
        if (!str) return '';
        var d = document.createElement('div');
        d.appendChild(document.createTextNode(str));
        return d.innerHTML;
    }

})();
