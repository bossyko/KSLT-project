/**
 * ГДЕ РЯД ШАПКИ ПЕРЕСТАЁТ ВМЕЩАТЬСЯ ЧЕСТНО — ЗАМЕР ПОСЛЕ ПРАВКИ (h291).
 *
 * Запись h291 требовала трёх вещей. Две сделаны 13.11: логотип получил
 * дно и больше не сжимается никогда, новых границ в медиа не заведено.
 * Третья осталась: ПОСЧИТАТЬ, при какой ширине ряд на кыргызском
 * перестаёт вмещаться честно — с логотипом в его полные 93.
 *
 * И отдельно: после правки полный замер не снимался. По цепочке
 * лестница снимается ЗАНОВО, тем же набором видов, что и до правки.
 * Эта проба закрывает оба долга.
 *
 * ЧЕСТНО ВМЕЩАЕТСЯ — ЭТО ТРИ УСЛОВИЯ СРАЗУ, и проверять надо все:
 *   логотип равен своим 93 (а не ужат и не обрезан);
 *   зазор между логотипом и меню не отрицательный (нет наложения);
 *   документ не шире окна (нет переполнения).
 * Любое одно из трёх, взятое в одиночку, врёт: 13.11 перелив по
 * scrollWidth показывал ноль, когда логотип лежал ПОВЕРХ первого пункта.
 *
 * ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ, а не сжатием окна: внутри
 * transition свойства возвращают прежнее значение, и замер врёт.
 *
 * Проба ничего не требует и не падает — кладёт числа в test-results.
 *
 * Прогон:
 *   npx playwright test tests/e2e/diagnostika/granica-shapki-kg.spec.js --project=desktop --reporter=line
 */
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const СКЛАД = path.join(__dirname, '..', '..', '..', 'test-results', 'granica-shapki-kg.json');
const положить = (ключ, числа) => {
    let всё = {};
    try { всё = JSON.parse(fs.readFileSync(СКЛАД, 'utf-8')); } catch (e) { всё = {}; }
    всё[ключ] = числа;
    fs.mkdirSync(path.dirname(СКЛАД), { recursive: true });
    fs.writeFileSync(СКЛАД, JSON.stringify(всё, null, 2), 'utf-8');
};

/* ОТ НИЖНЕЙ ГРАНИЦЫ РЯДА ДО ЗАПАСА. Ниже 993 меню свёрнуто в бургер и
   мерить нечего; выше 1200 на кыргызском запас уже был виден 13.11.
   Шаг 20 — не круглое число для красоты: беда ищется между 1024 (где
   она была) и 1180 (где её не было), и двадцать даёт восемь замеров
   внутри этой полосы, чего хватает, чтобы назвать границу с точностью
   до шага, а не «где-то там». */
const ШИРИНЫ = [];
/* ПОЛОСА ПОД ТЫСЯЧЕЙ СНИМАЕТСЯ ПОПИКСЕЛЬНО (замер 13.11). Шаг 20 дал
   ответ «на 1000 зазор 4 и дальше растёт», то есть граница лежит прямо
   под тысячей — между нею и бургером, который включается с 993. Шаг в
   двадцать такую полосу перешагивает целиком, и «честно вмещается»
   осталось бы словом, а не числом. */
for (let ш = 993; ш <= 1000; ш += 1) ШИРИНЫ.push(ш);
/* СО СЛЕДУЮЩЕГО ШАГА, А НЕ С ТЫСЯЧИ: 1000 уже снята попиксельно выше,
   и повтор даёт Playwright два теста с одним именем — прогон не
   стартует вовсе. */
for (let ш = 1020; ш <= 1200; ш += 20) ШИРИНЫ.push(ш);

/* КЫРГЫЗСКИЙ — ГДЕ БЕДА, РУССКИЙ — КОНТРОЛЬ. Без контроля непонятно,
   меряем мы язык или саму правку. */
const СТРАНИЦЫ = [
    { язык: 'kg', путь: '/index-kg.html' },
    { язык: 'ru', путь: '/index.html' }
];

for (const ширина of ШИРИНЫ) {
for (const палец of [true, false]) {
    test.describe(`${ширина} · ${палец ? 'палец' : 'мышь'}`, () => {
        test.use({ viewport: { width: ширина, height: 800 }, hasTouch: палец, isMobile: палец });

        for (const с of СТРАНИЦЫ) {
            test(`шапка ${с.язык} при ${ширина} ${палец ? '· палец' : '· мышь'}`, async ({ page }) => {
                await page.goto(с.путь);
                await page.waitForLoadState('networkidle');
                await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });

                const ч = await page.evaluate(() => {
                    const э = (с) => document.querySelector(с);
                    const ш = (с) => { const n = э(с); return n ? Math.round(n.getBoundingClientRect().width) : null; };
                    const лого = э('.logo');
                    const меню = э('.nav-links');

                    /* СКОЛЬКО ЛОГОТИП ХОЧЕТ — СПРАШИВАЕМ У НЕГО, а не берём
                       из памяти «93»: картинку могли сменить. */
                    let хочет = null;
                    if (лого) {
                        const было = лого.style.minWidth;
                        лого.style.minWidth = 'max-content';
                        хочет = Math.round(лого.getBoundingClientRect().width);
                        лого.style.minWidth = было;
                    }

                    const пункты = [...document.querySelectorAll('.nav-links .nav-item')];
                    const стиль = пункты.length ? getComputedStyle(пункты[0]) : null;

                    return {
                        окно: window.innerWidth,
                        грубыйУказатель: matchMedia('(any-pointer: coarse)').matches,
                        бургер: меню ? getComputedStyle(меню).display === 'none' : null,
                        логотип: ш('.logo'),
                        хочет,
                        navLeft: ш('.nav-left'),
                        navLinks: ш('.nav-links'),
                        navRight: ш('.nav-right'),
                        зазор: (лого && меню)
                            ? Math.round(меню.getBoundingClientRect().left - лого.getBoundingClientRect().right)
                            : null,
                        перелив: document.documentElement.scrollWidth - window.innerWidth,
                        пунктов: пункты.length,
                        кегльПункта: стиль ? стиль.fontSize : null,
                        отступПункта: стиль ? стиль.paddingLeft : null,
                        высотаПункта: пункты.length
                            ? Math.max(...пункты.map((п) => Math.round(п.getBoundingClientRect().height)))
                            : null
                    };
                });

                положить(`${ширина}-${с.язык}-${палец ? 'палец' : 'мышь'}`, ч);
            });
        }
    });
}
}
