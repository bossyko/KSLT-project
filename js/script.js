document.addEventListener('DOMContentLoaded', function() {

    // Clean Supabase auth tokens from URL (prevent user seeing access_token in address bar)
    if (window.location.hash && window.location.hash.indexOf('access_token') !== -1) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
    }

    // Active page indicator (yellow pulsing dot)
    (function() {
        var path = window.location.pathname.toLowerCase();

        // For each nav-item, check if current page belongs to it
        document.querySelectorAll('.nav-item, .mobile-dropdown-toggle').forEach(function(navItem) {
            var parent = navItem.closest('.nav-dropdown') || navItem.closest('.mobile-nav-dropdown');
            if (parent) {
                // Dropdown: check if any child link matches current page
                var links = parent.querySelectorAll('.nav-dropdown-item, .mobile-dropdown-menu a');
                for (var i = 0; i < links.length; i++) {
                    var href = (links[i].getAttribute('href') || '').toLowerCase().replace(/\?.*$/, '').replace(/-(en|kg)\.html/, '.html');
                    var filename = href.split('/').pop().replace('.html', '');
                    if (filename && path.indexOf(filename) !== -1) {
                        navItem.classList.add('is-active');
                        links[i].classList.add('active');
                        break;
                    }
                }
                // Also check if the parent page itself matches (e.g. services.html on services page)
                var parentHref = (navItem.getAttribute('href') || '').toLowerCase().replace(/\?.*$/, '').replace(/-(en|kg)\.html/, '.html');
                var parentFilename = parentHref.split('/').pop().replace('.html', '');
                if (parentFilename && path.indexOf(parentFilename) !== -1) {
                    navItem.classList.add('is-active');
                }
            } else {
                // Simple link (no dropdown), e.g. News
                var href = (navItem.getAttribute('href') || '').toLowerCase().replace(/\?.*$/, '').replace(/-(en|kg)\.html/, '.html');
                var filename = href.split('/').pop().replace('.html', '');
                if (filename && path.indexOf(filename) !== -1) {
                    navItem.classList.add('is-active');
                }
            }
        });

        // Also handle mobile simple links (not .nav-item class)
        document.querySelectorAll('.mobile-nav-links > li:not(.mobile-nav-dropdown) > a').forEach(function(a) {
            var href = (a.getAttribute('href') || '').toLowerCase().replace(/\?.*$/, '').replace(/-(en|kg)\.html/, '.html');
            var filename = href.split('/').pop().replace('.html', '');
            if (filename && path.indexOf(filename) !== -1) {
                a.classList.add('is-active');
            }
        });
    })();

    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            var raw = this.getAttribute('href');
            if (!raw || raw.length < 2 || raw.indexOf('/') !== -1) return;
            e.preventDefault();
            var target = document.querySelector(raw);
            if (target) {
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // ========================================
    // GEOLOCATION - City Selector
    // ========================================
    const citySelector = document.getElementById('citySelector');
    const cityName = document.getElementById('cityName');

    if (citySelector && cityName) {
        citySelector.addEventListener('click', function() {
            if ('geolocation' in navigator) {
                cityName.textContent = 'Определяем...';

                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        try {
                            // Используем OpenStreetMap Nominatim API для получения названия города
                            const response = await fetch(
                                `https://nominatim.openstreetmap.org/reverse?lat=${position.coords.latitude}&lon=${position.coords.longitude}&format=json&accept-language=ru`
                            );
                            const data = await response.json();

                            const city = data.address.city ||
                                        data.address.town ||
                                        data.address.village ||
                                        data.address.state ||
                                        'Неизвестно';

                            cityName.textContent = city;
                        } catch (error) {
                            cityName.textContent = 'Ошибка';
                            console.error('Geocoding error:', error);
                        }
                    },
                    (error) => {
                        switch(error.code) {
                            case error.PERMISSION_DENIED:
                                cityName.textContent = 'Нет доступа';
                                break;
                            case error.POSITION_UNAVAILABLE:
                                cityName.textContent = 'Недоступно';
                                break;
                            default:
                                cityName.textContent = 'Ошибка';
                        }
                    },
                    {
                        enableHighAccuracy: false,
                        timeout: 10000,
                        maximumAge: 300000
                    }
                );
            } else {
                cityName.textContent = 'Не поддерживается';
            }
        });
    }

    // ========================================
    // HEADER SCROLL EFFECT
    // Прозрачный при загрузке → Glass при скролле
    // ========================================
    const headerEl = document.querySelector('.floating-header');

    if (headerEl) {
        window.addEventListener('scroll', function() {
            const currentScroll = window.pageYOffset;

            if (currentScroll > 50) {
                headerEl.classList.add('scrolled');
            } else {
                headerEl.classList.remove('scrolled');
            }
        });
    }

    // ========================================
    // COUNTER ANIMATION - Цифры "набегают"
    // ========================================
    const statValues = document.querySelectorAll('.stat-value');

    const animateCounters = () => {
        statValues.forEach((stat, index) => {
            setTimeout(() => {
                stat.classList.add('animate');
            }, index * 150);
        });
    };

    // Intersection Observer для запуска анимации при появлении
    const statsSection = document.querySelector('.hero-stats');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    animateCounters();
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.5 });

        observer.observe(statsSection);
    }

    // ========================================
    // BURGER MENU (Mobile Navigation)
    // ========================================
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileNav = document.getElementById('mobileNav');

    if (burgerMenu && mobileNav) {
        burgerMenu.addEventListener('click', function() {
            this.classList.toggle('active');
            mobileNav.classList.toggle('active');
        });

        // Закрытие меню при клике на ссылку (кроме dropdown toggle)
        mobileNav.querySelectorAll('a').forEach(link => {
            link.addEventListener('click', function(e) {
                // Не закрываем если это toggle дропдауна
                if (!this.classList.contains('mobile-dropdown-toggle')) {
                    burgerMenu.classList.remove('active');
                    mobileNav.classList.remove('active');
                }
            });
        });

        // Закрытие при клике вне меню
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.floating-header')) {
                burgerMenu.classList.remove('active');
                mobileNav.classList.remove('active');
            }
        });
    }

    // ========================================
    // DROPDOWN TOUCH SUPPORT (Mobile)
    // ========================================
    const dropdowns = document.querySelectorAll('.dropdown');

    dropdowns.forEach(dropdown => {
        dropdown.addEventListener('touchstart', function(e) {
            const isOpen = this.classList.contains('active');

            // Закрываем все дропдауны
            dropdowns.forEach(d => d.classList.remove('active'));

            // Открываем текущий, если он был закрыт
            if (!isOpen) {
                this.classList.add('active');
                e.preventDefault();
            }
        });
    });

    // Закрытие дропдаунов при клике вне
    document.addEventListener('touchstart', function(e) {
        if (!e.target.closest('.dropdown')) {
            dropdowns.forEach(d => d.classList.remove('active'));
        }
    });

    // ========================================
    // MOBILE RANKINGS DROPDOWN
    // ========================================
    const mobileNavDropdowns = document.querySelectorAll('.mobile-nav-dropdown');

    mobileNavDropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.mobile-dropdown-toggle');

        if (toggle) {
            toggle.addEventListener('click', function(e) {
                e.preventDefault();
                e.stopPropagation();

                // Закрываем другие дропдауны
                mobileNavDropdowns.forEach(d => {
                    if (d !== dropdown) {
                        d.classList.remove('active');
                    }
                });

                // Переключаем текущий
                dropdown.classList.toggle('active');
            });
        }
    });

    // ========================================
    // ACTIVE NAV HIGHLIGHT ON SCROLL
    // ========================================
    const sections = document.querySelectorAll('main section[id]');
    const navItems = document.querySelectorAll('.nav-links .nav-item');

    function highlightNav() {
        const scrollY = window.pageYOffset + 120;

        sections.forEach(section => {
            const top = section.offsetTop;
            const height = section.offsetHeight;
            const id = section.getAttribute('id');

            if (scrollY >= top && scrollY < top + height) {
                navItems.forEach(item => item.classList.remove('active'));
                // Try direct nav link first
                let activeLink = document.querySelector('.nav-links > li > a[href="#' + id + '"]');
                // If not found, check dropdown items and highlight parent
                if (!activeLink) {
                    const dropdownItem = document.querySelector('.nav-dropdown-menu a[href="#' + id + '"]');
                    if (dropdownItem) {
                        activeLink = dropdownItem.closest('.nav-dropdown').querySelector('.nav-item');
                    }
                }
                if (activeLink) {
                    activeLink.classList.add('active');
                }
            }
        });
    }

    window.addEventListener('scroll', highlightNav);
    highlightNav();

    // ========================================
    // RANKINGS TABS (hover on desktop, tap on mobile)
    // ========================================
    const rankingsTabs = document.querySelectorAll('.rankings-tabs');
    const isTouchDevice = window.matchMedia('(hover: none)').matches;

    rankingsTabs.forEach(tabBar => {
        const tabs = tabBar.querySelectorAll('.rankings-tab');
        const col = tabBar.closest('.rankings-col');
        if (!col) return;

        tabs.forEach(tab => {
            const eventType = isTouchDevice ? 'click' : 'mouseenter';
            tab.addEventListener(eventType, function() {
                const targetId = this.getAttribute('data-target');
                // Deactivate all tabs in this group
                tabs.forEach(t => t.classList.remove('active'));
                this.classList.add('active');
                // Show target panel
                col.querySelectorAll('.rankings-panel').forEach(p => p.classList.remove('active'));
                const panel = document.getElementById(targetId);
                if (panel) panel.classList.add('active');
            });
        });
    });

    // ========================================
    // LANGUAGE DROPDOWN
    // ========================================
    const langDropdown = document.getElementById('langDropdown');
    const langToggle = document.getElementById('langToggle');

    // Toggle dropdown
    if (langToggle && langDropdown) {
        langToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            langDropdown.classList.toggle('active');
        });

        // Закрытие при клике вне
        document.addEventListener('click', function(e) {
            if (!e.target.closest('.lang-dropdown')) {
                langDropdown.classList.remove('active');
            }
        });
    }

    // ========================================
    // GUEST RESTRICTIONS (Rankings + Players)
    // ========================================

    (function() {
        var rankingsSection = document.getElementById('rankings');
        var playersSection = document.getElementById('players');
        if (!rankingsSection && !playersSection) return;

        function isLoggedIn() {
            try {
                var key = 'sb-qqkzszesviukopgjbead-auth-token';
                var raw = localStorage.getItem(key);
                if (!raw) return false;
                var data = JSON.parse(raw);
                return data && data.access_token && data.expires_at > Math.floor(Date.now() / 1000);
            } catch (e) { return false; }
        }

        if (isLoggedIn()) return;

        var isEn = window.location.pathname.indexOf('-en') !== -1;
        var isKg = window.location.pathname.indexOf('-kg') !== -1;
        var authUrl = isEn ? 'pages/auth-en.html' : (isKg ? 'pages/auth-kg.html' : 'pages/auth.html');
        var ctaBtn = isEn ? 'Sign In / Register' : (isKg ? 'Кирүү / Каттоо' : 'Войти / Регистрация');

        // --- Rankings: show top 3, blur rest ---
        if (rankingsSection) {
            var panels = rankingsSection.querySelectorAll('.rankings-panel');
            panels.forEach(function(panel) {
                var rows = panel.querySelectorAll('.ranking-row:not(.ranking-header)');
                for (var i = 3; i < rows.length; i++) {
                    var blur = Math.min((i - 2) * 2, 8);
                    var opacity = Math.max(0.7 - (i - 3) * 0.15, 0.15);
                    rows[i].style.filter = 'blur(' + blur + 'px)';
                    rows[i].style.opacity = opacity;
                    rows[i].style.pointerEvents = 'none';
                    rows[i].style.userSelect = 'none';
                }
            });

            var rankTitle = isEn ? 'Sign up for full rankings' : (isKg ? 'Толук рейтинг үчүн катталыңыз' : 'Зарегистрируйтесь для полного рейтинга');
            var rankCta = document.createElement('div');
            rankCta.className = 'guest-section-cta';
            rankCta.innerHTML =
                '<div class="guest-cta-card">' +
                    '<div class="guest-cta-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/><circle cx="12" cy="16" r="1"/></svg></div>' +
                    '<h3 class="guest-cta-title">' + rankTitle + '</h3>' +
                    '<a href="' + authUrl + '" class="guest-cta-btn">' + ctaBtn + '</a>' +
                '</div>';
            rankingsSection.style.position = 'relative';
            rankingsSection.appendChild(rankCta);
        }

        // --- Players: show 2 cards, blur rest ---
        if (playersSection) {
            var cards = playersSection.querySelectorAll('.player-card');
            for (var i = 2; i < cards.length; i++) {
                var blur = Math.min((i - 1) * 2, 10);
                var opacity = Math.max(0.7 - (i - 2) * 0.12, 0.1);
                cards[i].style.filter = 'blur(' + blur + 'px)';
                cards[i].style.opacity = opacity;
                cards[i].style.pointerEvents = 'none';
                cards[i].style.userSelect = 'none';
            }

            var playersTitle = isEn ? 'Register to find a player' : (isKg ? 'Оюнчу издөө үчүн катталыңыз' : 'Зарегистрируйтесь для поиска игрока');
            var playersCta = document.createElement('div');
            playersCta.className = 'guest-section-cta guest-section-cta-players';
            playersCta.innerHTML =
                '<div class="guest-cta-card">' +
                    '<div class="guest-cta-icon"><svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>' +
                    '<h3 class="guest-cta-title">' + playersTitle + '</h3>' +
                    '<a href="' + authUrl + '" class="guest-cta-btn">' + ctaBtn + '</a>' +
                '</div>';
            playersSection.style.position = 'relative';
            playersSection.appendChild(playersCta);
        }
    })();

    // ========================================
    // STICKY BACK BUTTON — fixed bar on scroll
    // Back links are JS-generated, so we watch DOM for them
    // ========================================
    (function() {
        var SELECTORS = '.news-back-link, .trn-back-link';
        var bar = null;

        function setup(backLink) {
            if (bar) return; // already set up

            bar = document.createElement('div');
            bar.className = 'sticky-back-bar';
            var clone = backLink.cloneNode(true);
            // Remove margin from clone
            clone.style.marginBottom = '0';
            bar.appendChild(clone);
            document.body.appendChild(bar);

            var observer = new IntersectionObserver(function(entries) {
                entries.forEach(function(entry) {
                    if (entry.isIntersecting) {
                        bar.classList.remove('visible');
                    } else {
                        bar.classList.add('visible');
                    }
                });
            }, { threshold: 0, rootMargin: '-64px 0px 0px 0px' });

            observer.observe(backLink);
        }

        // Check if back link already exists
        var existing = document.querySelector(SELECTORS);
        if (existing) {
            setup(existing);
            return;
        }

        // Watch for dynamically added back links
        var domObserver = new MutationObserver(function() {
            var link = document.querySelector(SELECTORS);
            if (link) {
                setup(link);
                domObserver.disconnect();
            }
        });
        domObserver.observe(document.body, { childList: true, subtree: true });

        // Safety: stop watching after 10s
        setTimeout(function() { domObserver.disconnect(); }, 10000);
    })();

    // ========================================
    // SCROLL TO TOP BUTTON
    // ========================================
    (function() {
        var btn = document.createElement('button');
        btn.className = 'scroll-to-top';
        btn.setAttribute('aria-label', 'Scroll to top');
        btn.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>';
        document.body.appendChild(btn);

        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    if (window.scrollY > 400) {
                        btn.classList.add('visible');
                    } else {
                        btn.classList.remove('visible');
                    }
                    ticking = false;
                });
                ticking = true;
            }
        });

        btn.addEventListener('click', function() {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    })();

    // ========================================
    // SERVICE WORKER REGISTRATION (PWA)
    // ========================================
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
    }

});
