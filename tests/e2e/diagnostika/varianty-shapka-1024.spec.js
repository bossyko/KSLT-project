/**
 * ВАРИАНТЫ ЛЕЧЕНИЯ ШАПКИ МЕРЯЮТСЯ ДО ПРАВКИ ФАЙЛА, ОДНИМ ПРОГОНОМ.
 *
 * Беда (замер 13.11): при 1024 на кыргызском логотип выходит 23 мышью и
 * 44 под пальцем вместо своих 93. Причина не «мало места», а «платит тот,
 * у кого нет дна»: .nav-left { flex: 1 } сжимаем, и внутри него картинка
 * .logo-img { width: auto }, у которой min-content ноль. У .nav-links дно
 * есть — шесть пунктов не переносятся, 786 на кг.
 *
 * Доступно в ряду при 1024 — 979. Нужно: логотип 93 + меню X + правый
 * край 170. Значит меню обязано уложиться в 716 вместо 786, то есть
 * отдать 70.
 *
 * Варианты примеряются поверх живой страницы, файл не трогается. Проба
 * ничего не требует и не падает — она кладёт числа в test-results.
 *
 * Прогон:
 *   npx playwright test tests/e2e/diagnostika/varianty-shapka-1024.spec.js --project=desktop
 */
const { test } = require('@playwright/test');
const fs = require('fs');
const path = require('path');

const СКЛАД = path.join(__dirname, '..', '..', '..', 'test-results', 'varianty-shapka-1024.json');
const положить = (ключ, числа) => {
    let всё = {};
    try { всё = JSON.parse(fs.readFileSync(СКЛАД, 'utf-8')); } catch (e) { всё = {}; }
    всё[ключ] = числа;
    fs.mkdirSync(path.dirname(СКЛАД), { recursive: true });
    fs.writeFileSync(СКЛАД, JSON.stringify(всё, null, 2), 'utf-8');
};

/* ДНО ЛОГОТИПУ — ОБЩАЯ ЧАСТЬ ВСЕХ ВАРИАНТОВ: без него любое освобождённое
   место снова уйдёт в меню, а платить будет логотип. Ставится ему, а не
   под указатель: у картинки нет дна ни под пальцем, ни под мышью. */
const ДНО = '.logo { flex-shrink: 0; }';

const ВАРИАНТЫ = [
    { имя: '0 как есть',            css: '' },
    { имя: 'A дно логотипу',        css: ДНО },
    { имя: 'B дно + пилюля 12',     css: ДНО + ' .nav-item { padding: 0 12px; }' },
    { имя: 'C дно + пилюля 8',      css: ДНО + ' .nav-item { padding: 0 8px; }' },
    { имя: 'D дно + кегль 14',      css: ДНО + ' .nav-item { font-size: 14px; }' },
    { имя: 'E дно + пилюля 12 + кегль 14', css: ДНО + ' .nav-item { padding: 0 12px; font-size: 14px; }' }
];

const СТРАНИЦЫ = [
    { язык: 'ru', путь: '/index.html' },
    { язык: 'kg', путь: '/index-kg.html' }
];

for (const ширина of [1024, 1180]) {
for (const палец of [false, true]) {
    test.describe(`${ширина} · ${палец ? 'палец' : 'мышь'}`, () => {
        test.use({ viewport: { width: ширина, height: 768 }, hasTouch: палец, isMobile: палец });

        for (const с of СТРАНИЦЫ) {
            test(`варианты ${с.язык} при ${ширина} ${палец ? '· палец' : '· мышь'}`, async ({ page }) => {
                await page.goto(с.путь);
                await page.waitForLoadState('networkidle');
                await page.addStyleTag({ content: '*, *::before, *::after { transition: none !important; animation: none !important; }' });

                const итог = {};
                for (const в of ВАРИАНТЫ) {
                    const метка = await page.evaluate((правила) => {
                        const преж = document.getElementById('проба-вариант');
                        if (преж) преж.remove();
                        if (правила) {
                            const s = document.createElement('style');
                            s.id = 'проба-вариант';
                            s.textContent = правила;
                            document.head.appendChild(s);
                        }
                        /* ПЕРЕСЧЁТ ВЫНУЖДАЕТСЯ ЧТЕНИЕМ, иначе числа снимаются
                           до того, как раскладка пересобралась. */
                        void document.body.offsetHeight;
                        const ш = (сел) => {
                            const э = document.querySelector(сел);
                            return э ? Math.round(э.getBoundingClientRect().width) : null;
                        };
                        const высоты = [...document.querySelectorAll('.nav-links .nav-item')]
                            .map((э) => Math.round(э.getBoundingClientRect().height));
                        /* ПЕРЕЛИВ ПО scrollWidth ВРЁТ, ЕСЛИ ПРЕДОК ОБРЕЗАЕТ.
                           Поэтому снимается ещё и правый край ряда: уехал
                           за окно — значит меню ушло под обрез, а не влезло. */
                        const край = (сел) => {
                            const э = document.querySelector(сел);
                            return э ? Math.round(э.getBoundingClientRect().right) : null;
                        };
                        const рядЭл = document.querySelector('.nav-left')?.parentElement;
                        const обрезающие = [];
                        for (let э = document.querySelector('.nav-left'); э && э !== document.documentElement; э = э.parentElement) {
                            const o = getComputedStyle(э);
                            if (o.overflowX !== 'visible' || o.overflowY !== 'visible') {
                                обрезающие.push(`${э.tagName.toLowerCase()}.${(э.className || '').toString().split(' ')[0]}:${o.overflowX}/${o.overflowY}`);
                            }
                        }
                        /* ЗАЗОР — ГЛАВНОЕ ЧИСЛО: перелива нет не потому что
                           влезло, а потому что логотип вылез из своего бокса
                           и лёг поверх меню. Отрицательный зазор = наложение. */
                        const лого = document.querySelector('.logo');
                        const менюЭл = document.querySelector('.nav-links');
                        const зазор = (лого && менюЭл)
                            ? Math.round(менюЭл.getBoundingClientRect().left - лого.getBoundingClientRect().right)
                            : null;
                        return {
                            зазор,
                            крайПравого: край('.nav-right'),
                            крайМеню: край('.nav-links'),
                            рядКласс: рядЭл ? (рядЭл.className || '').toString().split(' ')[0] : null,
                            рядШирина: рядЭл ? Math.round(рядЭл.getBoundingClientRect().width) : null,
                            обрезающие,
                            логотип: ш('.logo'),
                            navLinks: ш('.nav-links'),
                            navRight: ш('.nav-right'),
                            перелив: document.documentElement.scrollWidth - window.innerWidth,
                            высотаПункта: Math.max(...высоты),
                            рядов: new Set([...document.querySelectorAll('.nav-links .nav-item')]
                                .map((э) => Math.round(э.getBoundingClientRect().top))).size
                        };
                    }, в.css);
                    итог[в.имя] = метка;

                    /* СНИМОК ДЛЯ ГЛАЗ: числа не заменяют глаза (шаг 8). */
                    if (ширина === 1024 && с.язык === 'kg' && палец) {
                        const шапка = page.locator('.nav-left').locator('..');
                        await шапка.screenshot({
                            path: path.join(__dirname, '..', '..', '..', 'test-results',
                                `shapka-1024-kg-${в.имя.split(' ')[0]}.png`)
                        }).catch(() => {});
                    }
                }
                положить(`${ширина}-${с.язык}-${палец ? 'палец' : 'мышь'}`, итог);
            });
        }
    });
}
}
