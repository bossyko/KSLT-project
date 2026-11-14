/**
 * ЗАМЕР, А НЕ ПРАВИЛО: почему логотип на кыргызском сжимается при 1180.
 *
 * Запись h291 говорит: на kg при 1180 под пальцем логотип выходил 31 при
 * своих 93. Коммит 06566012 поставил ему нижний предел в ступень касания
 * (стало 44), но ПРИЧИНА осталась: ряд шапки не вмещает шесть пунктов, и
 * уступает тот, кто может, — логотип.
 *
 * ЗАМЕР МЫШЬЮ 13.11 БЕДЫ НЕ ПОКАЗАЛ: на боевой и на localhost при 1180
 * логотип целый, 93, переполнения ноль. Значит дело в пальце: под ним
 * цели растут до 44, меню становится шире, и места логотипу не остаётся.
 * Проверить это из браузера нельзя — нужен вид с hasTouch.
 *
 * ПРОБА НИЧЕГО НЕ ТРЕБУЕТ И НЕ ПАДАЕТ. Она печатает числа: ширину ряда
 * по частям на трёх языках, под пальцем и мышью. По ним будет решение —
 * раньше бургер, короче подписи или знак вместо слова.
 *
 * Прогон:
 *   npx playwright test tests/e2e/diagnostika/zamer-logotip-kg-1180.spec.js --project=desktop
 */
/* ОБВЯЗКА, А НЕ ГОЛЫЙ PLAYWRIGHT (13.11): иначе проба идёт в БОЕВУЮ
   базу и тянет из неё снимки — квота считается на всю организацию. */
const { test } = require('../../fixtures');
const fs = require('fs');
const path = require('path');

/* СЛЕД ПИШЕТСЯ В ФАЙЛ, А НЕ В КОНСОЛЬ (13.11).
   console.log тонет в выводе бегунка и до разбора не доезжает.
   Правило цепочки: прогон разбирается по следу в test-results. */
const СКЛАД = path.join(__dirname, '..', '..', '..', 'test-results', 'zamer-logotip-kg-1180.json');
const положить = (ключ, числа) => {
    let всё = {};
    try { всё = JSON.parse(fs.readFileSync(СКЛАД, 'utf-8')); } catch (e) { всё = {}; }
    всё[ключ] = числа;
    fs.mkdirSync(path.dirname(СКЛАД), { recursive: true });
    fs.writeFileSync(СКЛАД, JSON.stringify(всё, null, 2), 'utf-8');
};

const СТРАНИЦЫ = [
    { язык: 'ru', путь: '/index.html' },
    { язык: 'en', путь: '/index-en.html' },
    { язык: 'kg', путь: '/index-kg.html' }
];

/* ТРИ ШИРИНЫ, А НЕ ОДНА (13.11): ряд шапки живёт от 992 — ниже него
   бургер. Беда ищется у НИЖНЕЙ границы ряда, где места меньше всего,
   а 1180 — её верх. Мерить только верх значит мерить там, где хорошо. */
const ШИРИНЫ = [992, 1024, 1180];

for (const ширина of ШИРИНЫ) {
for (const палец of [false, true]) {
    test.describe(`${ширина} · ${палец ? 'под пальцем' : 'на мыши'}`, () => {
        test.use({ viewport: { width: ширина, height: 820 }, hasTouch: палец, isMobile: палец });

        for (const с of СТРАНИЦЫ) {
            test(`шапка ${с.язык} при ${ширина} ${палец ? '· палец' : '· мышь'}`, async ({ page }) => {
                await page.goto(с.путь);
                await page.waitForLoadState('networkidle');

                /* ПЕРЕХОДЫ ГАСЯТСЯ НА ВРЕМЯ ЗАМЕРА: внутри transition
                   свойства возвращают прежнее значение, и число врёт. */
                await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });

                const ч = await page.evaluate(() => {
                    const ш = (с) => {
                        const э = document.querySelector(с);
                        return э ? Math.round(э.getBoundingClientRect().width) : null;
                    };
                    const пункты = [...document.querySelectorAll('.nav-links > *')]
                        .map((э) => Math.round(э.getBoundingClientRect().width));
                    return {
                        окно: window.innerWidth,
                        /* СВИДЕТЕЛИ ЗАМЕРА: без них «палец» и «мышь»
                           дают одно число и замер врёт молча (13.11). */
                        грубыйУказатель: matchMedia('(any-pointer: coarse)').matches,
                        основнойГрубый: matchMedia('(pointer: coarse)').matches,
                        логотипMinWidth: (() => {
                            const э = document.querySelector('.logo');
                            return э ? getComputedStyle(э).minWidth : null;
                        })(),
                        navLeft: ш('.nav-left'),
                        логотип: ш('.logo'),
                        логотипХочет: (() => {
                            const э = document.querySelector('.logo');
                            if (!э) return null;
                            const было = э.style.minWidth;
                            э.style.minWidth = 'max-content';
                            const w = Math.round(э.getBoundingClientRect().width);
                            э.style.minWidth = было;
                            return w;
                        })(),
                        navLinks: ш('.nav-links'),
                        navRight: ш('.nav-right'),
                        пункты,
                        переполнение: document.documentElement.scrollWidth - window.innerWidth,
                        бургерВиден: (() => {
                            const б = document.querySelector('.burger, .mobile-menu-btn, .nav-burger');
                            /* ВИДИМОСТЬ СПРАШИВАЕТСЯ У ДОМА (13.11). Своя
                               проверка display видит только сам узел: скрытый
                               предок её обманет. Дом из tests/fixtures.js
                               поднимается по предкам и смотрит прямоугольник. */
                            return б ? window.КСЛТ_виден(б) : null;
                        })()
                    };
                });

                положить(`${ширина}-${с.язык}-${палец ? 'палец' : 'мышь'}`, ч);
            });
        }
    });
}
}
