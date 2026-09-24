/* ============================================================================
   ВОЗВРАТ ПРОКРУТКИ
   ============================================================================
   Правило, которое мы держим:

   • «Назад» возвращает на ту страницу, откуда пришёл, И НА ТО САМОЕ МЕСТО.
     Пролистал рейтинг до пятидесятого, открыл карточку игрока, нажал назад —
     снова пятидесятый, а не верх страницы.
   • Обновление (F5) — ВСЕГДА СВЕРХУ.

   Браузер эти два случая различает сам, а мы до 24.09 — нет.

   ПОЧЕМУ НЕЛЬЗЯ ПРОСТО ОСТАВИТЬ АВТОМАТИКУ БРАУЗЕРА. Она возвращает прокрутку
   мгновенно, пока документ ещё пустой, а у нас почти всё содержимое рисует js
   после загрузки: рейтинг, партнёры, корты, новости. Браузер ставит на
   3000-й пиксель, документа на 3000 пикселей ещё нет, позиция схлопывается, а
   потом разделы дорисовываются, и «якорение прокрутки» Chrome утаскивает её
   вниз следом. Костя 24.09: страница открывалась в самом конце. Замерено:
   прокрутка 5906 при высоте документа 6894 и окне 858 — ровно низ.

   ПОЭТОМУ ДЕРЖИМ ПРОКРУТКУ САМИ:
   1. Уходя со страницы, запоминаем место И ВЫСОТУ документа — привязанные к
      этой записи в истории, а не к адресу: адрес у двух записей может
      совпадать, а места в них разные.
   2. При загрузке спрашиваем браузер, что это было: reload, обычный переход
      или back_forward. Он знает точно.
   3. Обновление и обычный переход — ставим наверх.
   4. «Назад» — ЖДЁМ, пока документ дорастёт до запомненной высоты, и только
      тогда возвращаем место. Ждём не дольше двух с половиной секунд: если
      раздел не пришёл (база молчит, сеть легла), лучше показать верх, чем
      висеть.

   Страница с якорем в адресе (#live) не трогается вовсе — там прыжок нарочный.

   СТОИТ ДО DOMContentLoaded нарочно: восстановление браузер делает раньше
   него, и забрать управление надо успеть до этого. */
(function () {
    if (!('scrollRestoration' in history)) return;
    history.scrollRestoration = 'manual';

    var ХРАН = 'kslt-прокрутка:';

    /* Ключ записи истории. Живёт в history.state, поэтому у двух записей с
       одним адресом он разный — и «назад» не путает их между собой. */
    function ключЗаписи() {
        var с = history.state;
        if (с && с.ksltKey) return с.ksltKey;
        var к = 'h' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
        var новый = {};
        if (с && typeof с === 'object') { for (var п in с) новый[п] = с[п]; }
        новый.ksltKey = к;
        try { history.replaceState(новый, ''); } catch (e) {}
        return к;
    }

    var КЛЮЧ = ключЗаписи();

    function запомнить() {
        try {
            sessionStorage.setItem(ХРАН + КЛЮЧ, JSON.stringify({
                y: Math.round(window.scrollY),
                h: document.documentElement.scrollHeight
            }));
        } catch (e) {}
    }

    /* pagehide, а не beforeunload: на телефоне Safari второй не срабатывает
       вовсе, а первый есть везде. visibilitychange ловит случай, когда
       страницу не закрыли, а свернули и потом убили. */
    window.addEventListener('pagehide', запомнить);
    document.addEventListener('visibilitychange', function () {
        if (document.visibilityState === 'hidden') запомнить();
    });

    if (window.location.hash) return;

    var вид = 'navigate';
    try {
        var зап = performance.getEntriesByType('navigation')[0];
        if (зап && зап.type) вид = зап.type;
    } catch (e) {}

    if (вид !== 'back_forward') {
        window.scrollTo(0, 0);
        window.addEventListener('load', function () {
            if (!window.location.hash && window.scrollY > 0) window.scrollTo(0, 0);
        });
        return;
    }

    var сохр = null;
    try { сохр = JSON.parse(sessionStorage.getItem(ХРАН + КЛЮЧ) || 'null'); } catch (e) {}
    if (!сохр || !сохр.y) return;

    var срок = Date.now() + 2500;
    (function ждатьРазделы() {
        var доросла = document.documentElement.scrollHeight >= сохр.h - 4;
        if (!доросла && Date.now() < срок) { requestAnimationFrame(ждатьРазделы); return; }
        window.scrollTo(0, сохр.y);
        /* Последний раздел мог прийти на полкадра позже — проверяем ещё раз. */
        setTimeout(function () {
            if (Math.abs(window.scrollY - сохр.y) > 4 &&
                document.documentElement.scrollHeight >= сохр.y) {
                window.scrollTo(0, сохр.y);
            }
        }, 350);
    })();
})();

document.addEventListener('DOMContentLoaded', function() {

    // Clean Supabase auth tokens from URL (prevent user seeing access_token in address bar)
    if (window.location.hash && window.location.hash.indexOf('access_token') !== -1) {
        /* history.state сохраняем: в нём лежит ключ записи для возврата
           прокрутки. Раньше здесь стоял null и ключ стирался. 24.09 */
        history.replaceState(history.state, '', window.location.pathname + window.location.search);
    }

    // Active page indicator (yellow pulsing dot)
    (function() {
        var path = window.location.pathname.toLowerCase();

        // Категория текущей страницы: у турниров это ?category=, у рейтинга ?tab=
        var curParams = new URLSearchParams(window.location.search);
        var curKey = curParams.get('category') || curParams.get('tab') || '';

        /**
         * Насколько ссылка меню похожа на текущую страницу.
         *
         * Раньше у ссылки просто срезали «?...» — и все шесть категорий
         * турниров превращались в один и тот же tournaments. Совпадал первый
         * по списку, поэтому на любой категории горел Pro-Masters.
         *
         * 2 — то самое; 1 — та же страница, но параметр не проверить; 0 — мимо
         */
        function matchScore(href) {
            href = (href || '').toLowerCase();
            var file = href.split('?')[0].replace(/-(en|kg)\.html/, '.html').split('/').pop().replace('.html', '');
            if (!file || path.indexOf(file) === -1) return 0;

            var q = href.indexOf('?') !== -1 ? new URLSearchParams(href.split('?')[1]) : null;
            var key = q ? (q.get('category') || q.get('tab') || '') : '';

            if (key && curKey) return key === curKey ? 2 : 0;
            // У ссылки есть категория, а страница показывает раздел целиком —
            // подсвечивать конкретный пункт не за что
            if (key && !curKey) return 0;
            if (!key && curKey) return 1;
            return 2;
        }

        // For each nav-item, check if current page belongs to it
        document.querySelectorAll('.nav-item, .mobile-dropdown-toggle').forEach(function(navItem) {
            var parent = navItem.closest('.nav-dropdown') || navItem.closest('.mobile-nav-dropdown');
            if (parent) {
                // Из всех пунктов берём самый подходящий, а не первый попавшийся
                var links = parent.querySelectorAll('.nav-dropdown-item, .mobile-dropdown-menu a');
                var best = null, bestScore = 0;
                links.forEach(function(link) {
                    var score = matchScore(link.getAttribute('href'));
                    if (score > bestScore) { bestScore = score; best = link; }
                });
                if (best) {
                    navItem.classList.add('is-active');
                    best.classList.add('active');
                }
                // Also check if the parent page itself matches (e.g. services.html on services page)
                if (matchScore(navItem.getAttribute('href'))) {
                    navItem.classList.add('is-active');
                }
            } else {
                // Simple link (no dropdown), e.g. News
                if (matchScore(navItem.getAttribute('href'))) {
                    navItem.classList.add('is-active');
                }
            }
        });

        // Also handle mobile simple links (not .nav-item class)
        document.querySelectorAll('.mobile-nav-links > li:not(.mobile-nav-dropdown) > a').forEach(function(a) {
            if (matchScore(a.getAttribute('href'))) {
                a.classList.add('is-active');
            }
        });
    })();

    // Плавная прокрутка для навигации
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            var raw = this.getAttribute('href');
            if (!raw || raw.length < 2 || raw.charAt(0) !== '#') return;
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
            // Пока открыт боковой лист, страница заблокирована, но события
            // прокрутки всё равно приходят: от самой блокировки, от резинки
            // iOS, от прокрутки внутри листа. Костя 20.09 поймал это глазами —
            // шапка мигала лаймом поверх открытого меню, «как уродско».
            if (document.body.classList.contains('nav-open')) return;

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
    // БОКОВОЙ ЛИСТ НАВИГАЦИИ (вариант B, решение Кости 20.09, доска 243:145)
    // ========================================
    const burgerMenu = document.getElementById('burgerMenu');
    const mobileNav = document.getElementById('mobileNav');

    if (burgerMenu && mobileNav) {
        // Затемнение делает скрипт, а не разметка. Партиалов шапки три,
        // страниц двадцать четыре — лишний пустой div в каждой это двадцать
        // четыре места, где его однажды забудут, и лист останется без слоя.
        var затемнение = document.querySelector('.mobile-nav-scrim');
        if (!затемнение) {
            затемнение = document.createElement('div');
            затемнение.className = 'mobile-nav-scrim';
            document.body.appendChild(затемнение);
        }

        burgerMenu.setAttribute('aria-expanded', 'false');

        function листОткрыт() {
            return mobileNav.classList.contains('active');
        }

        // ЛИСТ НЕ МОДАЛЬНЫЙ, И ЭТО ГЛАВНОЕ ЗДЕСЬ.
        // Выключается страница ЗА затемнением — main и подвал. Шапка
        // остаётся в порядке табуляции: иначе «Войти» становится недостижим
        // с клавиатуры, а это ровно то преимущество, ради которого вариант B
        // и выбран. Фокус не запирается, Esc возвращает его на бургер.
        function переключитьЛист(открыть, вернутьФокус) {
            burgerMenu.classList.toggle('active', открыть);
            mobileNav.classList.toggle('active', открыть);
            затемнение.classList.toggle('active', открыть);
            document.body.classList.toggle('nav-open', открыть);
            burgerMenu.setAttribute('aria-expanded', открыть ? 'true' : 'false');
            document.querySelectorAll('main, .site-footer').forEach(function (эл) {
                эл.inert = открыть;
            });
            if (!открыть && вернутьФокус) burgerMenu.focus();
        }

        burgerMenu.addEventListener('click', function () {
            // Меню под аватаром и список уведомлений закрываем: три
            // раскрывающихся блока в одной шапке накладывались друг на друга
            document.querySelectorAll('.user-dropdown.open').forEach(function (эл) {
                эл.classList.remove('open');
            });
            var уведомления = document.getElementById('siteNotifDropdown');
            if (уведомления) уведомления.style.display = 'none';
            переключитьЛист(!листОткрыт(), false);
        });

        // Нажатие по затемнению — закрыть. Это ожидаемый жест: затемнение
        // и означает «здесь сейчас неактивно, ткни чтобы вернуться».
        затемнение.addEventListener('click', function () {
            переключитьЛист(false, true);
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape' && листОткрыт()) переключитьЛист(false, true);
        });

        // Закрытие меню при клике на ссылку (кроме toggle дропдауна).
        // Фокус не возвращаем: браузер уходит на другую страницу.
        mobileNav.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () {
                if (!this.classList.contains('mobile-dropdown-toggle')) {
                    переключитьЛист(false, false);
                }
            });
        });

        // Клик мимо шапки. Лист лежит ВНУТРИ .floating-header, поэтому
        // нажатия внутри самого листа сюда не попадают.
        document.addEventListener('click', function (e) {
            if (листОткрыт() && !e.target.closest('.floating-header')) {
                переключитьЛист(false, false);
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
    // ПАНЕЛИ ДЕСКТОПНОЙ ШАПКИ ПОД ПАЛЬЦЕМ
    // ========================================
    //
    // ЗАЧЕМ. На 1024 (планшет боком) отдаётся десктопная шапка, а панели
    // разделов висят на :hover. У пальца наведения не существует — значит
    // вложенные ссылки были недостижимы вовсе: тап по «Рейтингу» уводил на
    // страницу раздела, а Pro-Masters, Masters, Tour, Challengers и Futures
    // не открывались ничем. Третий случай той же ошибки: h270 и h274 в
    // подвале, теперь в шапке.
    //
    // КАК. Решение Кости 20.09: первый тап раскрывает, второй уводит на
    // страницу. То есть ссылка не ломается — она просто требует второго
    // нажатия, как на большинстве сайтов.
    //
    // ОСТОРОЖНО, ГЛАВНОЕ МЕСТО ОШИБКИ: условие спрашивает У БРАУЗЕРА про
    // способ ввода — matchMedia('(any-pointer: coarse)'), — а НЕ про ширину.
    // 21.09 условие расширено с pointer на any-pointer: pointer говорит про
    // ОСНОВНОЙ способ ввода, и ноутбук с сенсорным экраном или планшет с
    // клавиатурой отвечают «мышь», хотя человек тычет пальцем. any-pointer
    // спрашивает, есть ли грубый ввод ВООБЩЕ. Решение Кости 21.09.
    // окна. 1024 шире любого «мобильного» порога, и проверка по ширине эту
    // дыру не закрыла бы. Ровно на этой подмене мы обожглись дважды.
    //
    // Проверяем на каждом нажатии, а не один раз при загрузке: у ноутбука
    // с сенсорным экраном способ ввода меняется по ходу дела.
    const навПанели = document.querySelectorAll('.floating-header .nav-dropdown');

    function подПальцем() {
        return window.matchMedia('(any-pointer: coarse)').matches;
    }

    навПанели.forEach(function(панель) {
        const заголовок = панель.querySelector('.nav-item');
        if (!заголовок) return;

        заголовок.addEventListener('click', function(e) {
            if (!подПальцем()) return;              // мышь работает как работала
            if (панель.classList.contains('open')) return;  // второй тап — переход

            e.preventDefault();
            навПанели.forEach(function(д) {
                if (д !== панель) д.classList.remove('open');
            });
            панель.classList.add('open');
        });
    });

    // Тап мимо панели закрывает её. Без этого раскрытая панель остаётся
    // висеть навсегда: у пальца нет «увёл курсор», которым закрывался hover.
    document.addEventListener('click', function(e) {
        if (!подПальцем()) return;
        if (e.target.closest && e.target.closest('.floating-header .nav-dropdown')) return;
        навПанели.forEach(function(д) { д.classList.remove('open'); });
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
                // Try direct nav link first
                let activeLink = document.querySelector('.nav-links > li > a[href="#' + id + '"]');
                // If not found, check dropdown items and highlight parent
                if (!activeLink) {
                    const dropdownItem = document.querySelector('.nav-dropdown-menu a[href="#' + id + '"]');
                    if (dropdownItem) {
                        activeLink = dropdownItem.closest('.nav-dropdown').querySelector('.nav-item');
                    }
                }
                // Подсветку переносим, только когда есть куда. Внутренние
                // страницы отмечают свой пункт прямо в разметке и якорей в
                // меню не имеют — раньше «Рейтинг» гас сразу после загрузки
                if (activeLink) {
                    navItems.forEach(item => item.classList.remove('active'));
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

        // Закрытие, когда фокус ушёл с клавиатуры.
        //
        // НАЙДЕНО КОСТЕЙ 20.09 КЛАВИШЕЙ TAB: он открыл список языков,
        // пошёл дальше по Tab — и список остался висеть поверх страницы.
        // Закрытие было описано ТОЛЬКО для щелчка мимо. Мышь уводит
        // курсор, клавиатура уводит фокус — это два разных события, и
        // слушали мы одно.
        //
        // ОСТОРОЖНО: relatedTarget — это куда фокус УШЁЛ. Он бывает null,
        // когда фокус уходит из окна вовсе; тогда список тоже закрываем.
        langDropdown.addEventListener('focusout', function(e) {
            const куда = e.relatedTarget;
            if (!куда || !langDropdown.contains(куда)) {
                langDropdown.classList.remove('active');
            }
        });
    }

    // ========================================
    // GUEST RESTRICTIONS (Rankings + Players)
    // ========================================

    (async function() {
        var rankingsSection = document.getElementById('rankings');
        var playersSection = document.getElementById('players');
        if (!rankingsSection && !playersSection) return;

        /**
         * Гость перед нами или свой.
         *
         * Спрашиваем у самой сессии. Раньше заглядывали в хранилище по ключу
         * с зашитым адресом базы — на любой другой базе выходил вечный гость,
         * и окно «зарегистрируйтесь» накрывало карточки даже вошедшему,
         * перехватывая нажатия на «Пригласить».
         */
        async function isLoggedIn() {
            var client = window.supabaseClient;
            if (!client) return false;
            try {
                var res = await client.auth.getSession();
                return !!(res.data && res.data.session);
            } catch (e) { return false; }
        }

        if (await isLoggedIn()) return;

        var isEn = window.location.pathname.indexOf('-en') !== -1;
        var isKg = window.location.pathname.indexOf('-kg') !== -1;
        var authUrl = isEn ? 'pages/auth-en.html' : (isKg ? 'pages/auth-kg.html' : 'pages/auth.html');
        var ctaBtn = isEn ? 'Sign In / Register' : (isKg ? 'Кирүү / Каттоо' : 'Войти / Регистрация');

        // --- Rankings: show top 3, blur rest ---
        if (rankingsSection) {
            // Строки размывает js/home-rankings.js: он рисует их после ответа
            // базы, а этот код отрабатывает раньше — размывать было нечего

            var rankTitle = isEn ? 'Full rankings are visible after signing in'
                : (isKg ? 'Толук рейтинг киргенден кийин көрүнөт' : 'Весь рейтинг виден после входа');
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
        var SELECTORS = '.news-back-link';
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

    // Год в копирайте подставляется, а не лежит текстом.
    //
    // «© 2026» было записано словами в трёх партиалах и разнесено по 76
    // страницам. Каждый январь это требовало правки и пересборки, а забыть
    // ничего не стоило — на сайте просто стоял бы прошлый год.
    (function() {
        var y = String(new Date().getFullYear());
        document.querySelectorAll('.footer-year').forEach(function(el) {
            el.textContent = y;
        });
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

        // Кнопка уходит, пока подвал в кадре.
        //
        // Она закреплена в правом нижнем углу и ничего не знала о подвале,
        // поэтому ложилась прямо на него. Замерено тычками: правые 44px
        // заголовков гармошки — вся зона стрелки — принимали нажатие на себя,
        // и человек, жавший «раскрыть раздел», улетал наверх страницы.
        // Перекрыты были все четыре заголовка.
        //
        // Условие геометрическое, а не «подвал виден»: прячем, когда верх
        // подвала дошёл до нижней кромки кнопки. Считается в том же
        // requestAnimationFrame, новых слушателей не добавляем.
        var footerEl = document.querySelector('.site-footer');
        var ticking = false;
        window.addEventListener('scroll', function() {
            if (!ticking) {
                requestAnimationFrame(function() {
                    var overFooter = false;
                    if (footerEl) {
                        overFooter = footerEl.getBoundingClientRect().top < window.innerHeight - 20;
                    }
                    if (window.scrollY > 400 && !overFooter) {
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

    // Разделы подвала на телефоне складываются в гармошку
    //
    // Четыре списка ссылок подряд занимали три четверти экрана, а нажимают
    // их единицы. Оставляем видимыми заголовки, содержимое раскрывается по
    // нажатию — как в подвале Apple и ATP. На широком экране подвал прежний.
    (function() {
        var подвал = document.querySelector('footer .footer-content');
        if (!подвал) return;

        // Граница гармошки — 768, а не 640.
        //
        // Раньше здесь стояло 640, а стили .footer-acc лежат в
        // @media (max-width: 768px) — их поставил тот же коммит 34bd72a.
        // Полоса 641…768 не получала ни того, ни другого: iPad вертикально
        // (ровно 768) показывал все четыре списка открытыми — четырнадцать
        // ссылок высотой 15 при норме касания 44, шаг 26, просвет 12.
        // Расширить на месте было нельзя: нужен шаг 44, это около +234 к
        // подвалу. Замерено включение гармошки на 768: подвал 608 → 517,
        // заголовки 734×44. Лучше и короче, и нажимается.
        //
        // Число привязано к устройству, а не к шкале: 768 — это ширина
        // iPad вертикально. Округлять до 770 нельзя — появится новая пара
        // границ и полоса в два пикселя, где не сработает ни одно правило.
        // Выбор между 768 и 767.98 для всего проекта — работа шага 6.
        var УЗКО = 768;

        // Гармошка нужна там, где палец, а не там, где узко.
        //
        // Одной ширины мало: телефон боком — 844, iPad Pro стоймя — 1024,
        // оба шире 768, и оба сенсорные. Замерено на 844: подвал в колонках
        // со всеми списками занимал 988 пикселей при высоте экрана 390 —
        // почти два с половиной экрана.
        // Браузер сам говорит, чем по нему тыкают: на iPad Pro
        // (pointer: coarse) отвечает ДА, а (hover: none) — тоже ДА.
        // Ширину оставляем вторым условием: узкое окно на компьютере даёт
        // pointer: fine, но колонки в него всё равно не помещаются.
        // ТО ЖЕ САМОЕ УСЛОВИЕ стоит в css/style.css у блока .footer-acc.
        // Меняешь здесь — меняй и там, иначе класс встанет без оформления.
        function складывать() {
            return (window.matchMedia && window.matchMedia('(any-pointer: coarse)').matches)
                || window.innerWidth <= УЗКО;
        }
        var разделы = [].slice.call(подвал.querySelectorAll('.footer-block'))
            .filter(function(б) { return !б.classList.contains('footer-brand') && б.querySelector('h4'); });
        if (!разделы.length) return;

        разделы.forEach(function(раздел) {
            var заголовок = раздел.querySelector('h4');
            // role и tabindex НЕ ставятся здесь.
            // Они появляются в пересобрать() и только там, где гармошка
            // действительно работает. На десктопе списки видны, нажатие на
            // заголовок ничего не делает, и читалка объявила бы «кнопка,
            // свёрнуто» при раскрытом содержимом — WCAG 4.1.2, плюс четыре
            // мёртвые остановки Tab. Находка h271, дефект был мой.

            function переключить() {
                if (!складывать()) return;
                var открыт = раздел.classList.toggle('открыт');
                заголовок.setAttribute('aria-expanded', открыт ? 'true' : 'false');
            }

            заголовок.addEventListener('click', переключить);
            заголовок.addEventListener('keydown', function(e) {
                if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); переключить(); }
            });
        });

        // Класс ставит скрипт, а не разметка: без него списки видны всегда,
        // и подвал не превратится в четыре мёртвых заголовка
        function пересобрать() {
            var узко = складывать();
            подвал.classList.toggle('footer-acc', узко);
            разделы.forEach(function(раздел) {
                var заголовок = раздел.querySelector('h4');
                if (узко) {
                    // Гармошка есть: заголовок ведёт себя как кнопка и
                    // должен так и объявляться.
                    заголовок.setAttribute('role', 'button');
                    заголовок.setAttribute('tabindex', '0');
                    заголовок.setAttribute('aria-expanded',
                        раздел.classList.contains('открыт') ? 'true' : 'false');
                } else {
                    // Гармошки нет: снимаем ВСЕ три атрибута, а не только
                    // aria-expanded. Иначе остаются кнопки, которые ничем
                    // не управляют.
                    раздел.classList.remove('открыт');
                    заголовок.removeAttribute('role');
                    заголовок.removeAttribute('tabindex');
                    заголовок.removeAttribute('aria-expanded');
                }
            });
        }

        пересобрать();
        var таймер;
        window.addEventListener('resize', function() {
            clearTimeout(таймер);
            таймер = setTimeout(пересобрать, 150);
        });
    })();

    // Огонёк Live в шапке
    //
    // Раньше класс подставлялся при сборке страниц и только на главной:
    // огонёк горел там всегда, даже когда никто не играл, и не загорался
    // на остальных страницах, даже когда матч шёл. Теперь спрашиваем базу
    // — одним лёгким запросом без данных, только счётчик.
    (function() {
        var links = document.querySelectorAll('.nav-item-live, .mobile-nav a[href*="#live"]');
        if (!links.length) return;

        function paint(on) {
            links.forEach(function(a) { a.classList.toggle('is-live', on); });
        }

        // ОДИН ИСТОЧНИК ОГОНЬКА. Раньше класс is-live ставили ДВА независимых
        // куска кода: этот и встроенный скрипт главной — и селекторы у них были РАЗНЫЕ:
        // href*="#live" против href="#live". На главной шёл лишний запрос в базу
        // и гонка: кто ответил вторым, тот и прав. Теперь красит ТОЛЬКО этот кусок,
        // а тот, кто уже знает ответ (раздел #live на главной), сообщает его сюда.
        window.KSLT_отметитьLive = paint;

        // До ответа базы не горим: пусть лучше загорится с задержкой,
        // чем будет светить впустую
        paint(false);

        // Страница с разделом Live спрашивает базу сама, причём с полными данными.
        // Второй запрос оттуда ничего нового не узнаёт — ждём её ответа.
        if (document.getElementById('liveMatchesGrid')) {
            if (typeof window.KSLT_LIVE_АКТИВЕН === 'boolean') paint(window.KSLT_LIVE_АКТИВЕН);
            document.addEventListener('kslt:live', function(e) { paint(!!(e.detail && e.detail.active)); });
            return;
        }

        var client = window.supabaseClient;
        if (!client) return;

        client.from('live_matches')
            .select('id', { count: 'exact', head: true })
            .in('status', ['warmup', 'live', 'paused'])
            .then(function(res) {
                if (!res.error) paint((res.count || 0) > 0);
            });
    })();

});

/* ========================================
   Прокрутка к списку после смены страницы
   ========================================
   Раньше каждый раздел звал scrollIntoView, и верх списка вставал вплотную
   к верху окна — а над ним висят шапка сайта и липкая полоса фильтров.
   Первая карточка уходила под них: на телефоне у новости пропадала
   обложка, и выглядело так, будто страница открылась пустой.

   Считаем, что реально перекрывает верх экрана, и отступаем на эту
   величину плюс небольшой зазор. */
window.KSLT_прокрутитьКСписку = function(элемент) {
    if (!элемент) return;

    // Берём нижнюю границу, а не высоту: полоса фильтров липнет под шапкой,
    // и перекрытие — это её низ, а не сумма высот
    var перекрытие = 0;
    document.querySelectorAll('header, .trn-filters, .pt-filters, .pl-filters-section').forEach(function(эл) {
        var с = getComputedStyle(эл);
        if (с.position !== 'sticky' && с.position !== 'fixed') return;
        перекрытие = Math.max(перекрытие, эл.getBoundingClientRect().bottom);
    });

    var верх = Math.max(0, элемент.getBoundingClientRect().top + window.scrollY - перекрытие - 12);
    var начало = window.scrollY;

    window.scrollTo({ top: верх, behavior: 'smooth' });

    // Плавная прокрутка работает не везде: в некоторых окнах вызов проходит,
    // а страница остаётся на месте. Если через четверть секунды не сдвинулись
    // ни на пиксель — доводим обычной прокруткой
    setTimeout(function() {
        if (window.scrollY === начало && начало !== верх) window.scrollTo(0, верх);
    }, 250);
};
