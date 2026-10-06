/**
 * ПРИБОР РАЗДЕЛА РЕЙТИНГА — ОДИН ПРОГОН, ВСЕ ЧИСЛА В ФАЙЛ.
 *
 * Зачем. Шаг 1 (замер), шаг 2 (обход) и шаг 3 (строгий разбор) проходились
 * руками: по окну браузера на элемент, 15–30 открытий на один замер, и так
 * на каждом шаге. Отсюда время и мелькающие окна. Прибор снимает всё за
 * один запуск и кладёт таблицу в файл — разбирать её можно без браузера.
 *
 * Он НИЧЕГО не проверяет и упасть не может: это измеритель, а не проба.
 * Пороги и правила живут в 61-reyting-stranica.spec.js.
 *
 * Снимает: лестницу текста всех уровней (кегль, вес, межстрочный, цвет,
 * контраст к фону, знаки, цель нажатия) — пять видов на трёх языках;
 * обход (всё нажимаемое: что, куда ведёт, какая цель); строгий разбор
 * (focus-visible, prefers-reduced-motion, alt, имена кнопок, порядок
 * заголовков, перелив, ошибки консоли); крайние случаи — самый длинный
 * разряд и разряд без переключателя пола.
 *
 * Запускать:
 *   npx playwright test --config=playwright.bez-bazy.config.js \
 *     tests/e2e/diagnostika/zamer-reytinga.spec.js --project=desktop
 *
 * ВИД ЗАДАЁТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ, а не сжатием окна: прибор
 * заводит пять контекстов сам.
 */
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');
const подстава = require('../../podstava-reytinga');

test.setTimeout(15 * 60 * 1000);

const ВИДЫ = [
    ['десктоп', 1280, 800],
    ['планшет-бок', 1024, 768],
    ['телефон-бок', 844, 390],
    ['планшет', 768, 1024],
    ['телефон', 375, 812],
];

const ЯЗЫКИ = [
    ['ru', '/pages/players.html'],
    ['en', '/pages/players-en.html'],
    ['kg', '/pages/players-kg.html'],
];

/* Крайние случаи наравне с обычным: самое длинное имя разряда и разряд без
   переключателя пола. ПОКАЗЫВАТЬ НАДО КРАЙНИЙ СЛУЧАЙ, А НЕ УДОБНЫЙ. */
const ЭКРАНЫ = [
    ['обзорная', ''],
    ['разряд-Tour', '?tab=men-tour'],
    ['разряд-Masters', '?tab=men-masters'],
    ['разряд-ProMasters', '?tab=men-promasters'],
];

const УРОВНИ = {
    'обложка · заголовок': '.pl-hero-title, .pl-cat-title',
    'обложка · подзаголовок': '.pl-hero-subtitle, .pl-cat-subtitle',
    'подиум · медаль 1': '.pl-podium-first .pl-podium-medal',
    'подиум · медаль 2': '.pl-podium-second .pl-podium-medal',
    'подиум · медаль 3': '.pl-podium-third .pl-podium-medal',
    'подиум · имя 1': '.pl-podium-first .pl-podium-name',
    'подиум · имя 2': '.pl-podium-second .pl-podium-name',
    'подиум · имя 3': '.pl-podium-third .pl-podium-name',
    'подиум · очки 1': '.pl-podium-first .pl-podium-points',
    'подиум · очки 2': '.pl-podium-second .pl-podium-points',
    'подиум · очки 3': '.pl-podium-third .pl-podium-points',
    'полоса · назад': '.trn-back, .pl-cat-back-link',
    'полоса · поиск': '.trn-search-input',
    'полоса · чип пола': '.pl-gender-tab, .pl-cat-gender-btn',
    'полоса · имя разряда': '.trn-cat-name',
    'таблица · шапка': '.pl-row-header',
    'таблица · ряд': '.pl-row:not(.pl-row-header), .pl-cat-row:not(.pl-row-header)',
    'таблица · имя': '.pl-player-name, .pl-name',
    'таблица · очки': '.pl-points',
    'страницы · кнопка': '.pl-page-btn',
    'гость · заголовок': '.pl-guest-title',
    'гость · кнопка': '.pl-guest-btn, .pl-guest-cta a',
    'пусто': '.pl-no-results',
};

const СНЯТЬ = (уровни) => {
    const ч = (с) => parseFloat(с) || 0;

    function разбор(цвет) {
        const м = String(цвет).match(/rgba?\(([^)]+)\)/);
        if (!м) return null;
        const п = м[1].split(',').map(x => parseFloat(x));
        return { r: п[0], g: п[1], b: п[2], a: п.length > 3 ? п[3] : 1 };
    }
    function фонПод(э) {
        let у = э;
        while (у) {
            const c = разбор(getComputedStyle(у).backgroundColor);
            if (c && c.a > 0.95) return c;
            у = у.parentElement;
        }
        return { r: 10, g: 10, b: 10, a: 1 };
    }
    function поверх(с, н) {
        const a = с.a;
        return { r: с.r * a + н.r * (1 - a), g: с.g * a + н.g * (1 - a),
                 b: с.b * a + н.b * (1 - a), a: 1 };
    }
    function яркость(c) {
        const к = [c.r, c.g, c.b].map(v => {
            const s = v / 255;
            return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
        });
        return 0.2126 * к[0] + 0.7152 * к[1] + 0.0722 * к[2];
    }
    /* ПРОЗРАЧНАЯ КРАСКА СМЕШИВАЕТСЯ С ФОНОМ, А НЕ ОТБРАСЫВАЕТСЯ: 06.10
       прибор, отбрасывавший альфу, дал 19.8 пяти разным уровням подряд. */
    function контраст(э) {
        const т = разбор(getComputedStyle(э).color);
        if (!т) return null;
        const ф = фонПод(э);
        const сл = поверх(т, ф);
        const a = яркость(сл), b = яркость(ф);
        const бол = Math.max(a, b), мал = Math.min(a, b);
        return Math.round(((бол + 0.05) / (мал + 0.05)) * 100) / 100;
    }

    const снимки = {};
    Object.keys(уровни).forEach(имя => {
        const э = document.querySelector(уровни[имя]);
        if (!э) { снимки[имя] = null; return; }
        const s = getComputedStyle(э);
        const r = э.getBoundingClientRect();
        const после = getComputedStyle(э, '::after');
        снимки[имя] = {
            кегль: Math.round(ч(s.fontSize) * 10) / 10,
            вес: s.fontWeight,
            мс: s.lineHeight === 'normal' ? 'normal'
                : Math.round(ч(s.lineHeight) / ч(s.fontSize) * 100) / 100,
            цвет: s.color,
            контраст: контраст(э),
            ш: Math.round(r.width),
            в: Math.round(r.height),
            знаков: (э.textContent || '').trim().length,
            показ: s.display,
            слойЦели: (после && после.content && после.content !== 'none')
                ? Math.round(ч(после.height)) : null,
        };
    });

    const нажимаемое = [...document.querySelectorAll(
        'a[href], button, [role="button"], [data-page], [data-gender], [data-href]')]
        .filter(э => э.offsetParent !== null)
        .slice(0, 80)
        .map(э => {
            const r = э.getBoundingClientRect();
            const после = getComputedStyle(э, '::after');
            const слой = (после && после.content && после.content !== 'none')
                ? Math.round(ч(после.height)) : 0;
            return {
                что: (э.textContent || '').replace(/\s+/g, ' ').trim().slice(0, 36) ||
                     э.getAttribute('aria-label') || String(э.className).slice(0, 36),
                тег: э.tagName,
                куда: э.getAttribute('href') || э.getAttribute('data-href') ||
                      (э.dataset.page ? 'страница ' + э.dataset.page : null) ||
                      (э.dataset.gender ? 'пол ' + э.dataset.gender : null),
                ш: Math.round(r.width),
                в: Math.round(r.height),
                цель: Math.max(Math.min(Math.round(r.width), Math.round(r.height)), слой),
            };
        });

    let фокус = 0, движение = 0;
    try {
        [...document.styleSheets].forEach(л => {
            let п = [];
            try { п = [...(л.cssRules || [])]; } catch (e) { return; }
            п.forEach(пр => {
                const т = пр.cssText || '';
                if (т.includes(':focus-visible')) фокус++;
                if (т.includes('prefers-reduced-motion')) движение++;
            });
        });
    } catch (e) { /* чужой лист */ }

    return {
        уровни: снимки,
        обход: нажимаемое,
        строгий: {
            focusVisibleПравил: фокус,
            reducedMotionПравил: движение,
            картинокБезAlt: document.querySelectorAll('img:not([alt])').length,
            кнопокБезИмени: [...document.querySelectorAll('button')]
                .filter(б => !(б.textContent || '').trim() && !б.getAttribute('aria-label')).length,
            заголовки: [...document.querySelectorAll('h1,h2,h3,h4')].map(h => h.tagName).join(' '),
            перелив: document.documentElement.scrollWidth - window.innerWidth,
            высота: document.documentElement.scrollHeight,
            строкТаблицы: document.querySelectorAll(
                '.pl-row:not(.pl-row-header), .pl-cat-row:not(.pl-row-header)').length,
            карточекПодиума: document.querySelectorAll('.pl-podium-card').length,
            экранГостя: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta'),
        },
    };
};

test('замер раздела рейтинга — всё в файл', async ({ browser }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop',
        'прибор заводит виды сам: пять ширин внутри одного прогона');

    const отчёт = { когда: new Date().toISOString(), страницы: [] };

    for (const [вид, w, h] of ВИДЫ) {
        for (const [яз, путь] of ЯЗЫКИ) {
            for (const [экран, хвост] of ЭКРАНЫ) {
                /* Контекст заводит подстава: прибор меряет вёрстку на своих
                   данных, а не на том, что сегодня лежит в базе прогона. */
                const ctx = await подстава.контекст(browser, { width: w, height: h });
                const page = await ctx.newPage();
                const ошибки = [];
                page.on('console', c => {
                    if (c.type() === 'error' && !c.text().includes('supabase')) {
                        ошибки.push(c.text().slice(0, 140));
                    }
                });
                try {
                    await page.goto('http://localhost:8000' + путь + хвост,
                        { waitUntil: 'domcontentloaded' });
                    /* ЖДАТЬ НАДО ПРИЗНАК, А НЕ ИСТЕЧЕНИЕ ВРЕМЕНИ: на шестидесяти
                       игроках отрисовка дольше, и полторы секунды врали. */
                    await page.waitForFunction(() =>
                        document.querySelectorAll('.pl-row, .pl-cat-row, .pl-podium-card').length > 0
                        || document.querySelector('.pl-no-results'),
                        null, { timeout: 8000 }).catch(() => null);
                    await page.waitForTimeout(500);
                    const д = await page.evaluate(СНЯТЬ, УРОВНИ);
                    отчёт.страницы.push({ вид, яз, экран, ...д, ошибкиКонсоли: ошибки });
                } catch (e) {
                    отчёт.страницы.push({ вид, яз, экран, беда: String(e.message).slice(0, 160) });
                }
                await ctx.close();
            }
        }
    }

    const куда = path.join(__dirname, '..', '..', 'reports', 'zamer-reytinga.json');
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.writeFileSync(куда, JSON.stringify(отчёт, null, 1), 'utf8');
    console.log('снято страниц: ' + отчёт.страницы.length +
        ' → tests/reports/zamer-reytinga.json');
});
