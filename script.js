document.addEventListener('DOMContentLoaded', function() {

    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
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
                const activeLink = document.querySelector('.nav-links a[href="#' + id + '"]');
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

});
