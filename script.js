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
