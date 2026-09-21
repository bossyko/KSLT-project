// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * БОКОВОЙ ЛИСТ НАВИГАЦИИ — второй способ проверки, по живой странице.
 *
 * ЗАЧЕМ ОТДЕЛЬНО ОТ ЗАМОРОЗКИ. tools/check-header.js читает исходники и
 * стережёт ПРАВИЛА. Она не видит, что получилось на экране. 20.09 я сломал
 * бургер на всех ширинах, и заморозка показывала 13 из 13 — поймал прибор
 * по живой странице. С тех пор два способа обязательны.
 *
 * ЧТО МЕРИМ (решение Кости 20.09, доска 243:145, вариант B):
 *   1) лист начинается ровно под шапкой и прижат к правому краю;
 *   2) ничего не уходит за экран — прокрутка внутри листа;
 *   3) затемнение есть и НЕ накрывает шапку;
 *   4) шапка жива: «Войти» ловит нажатие, а не затемнение поверх неё.
 *      Это главный довод в пользу B, и он обязан быть проверен, а не заявлен;
 *   5) бургер остаётся той же мишенью: те же координаты до и после;
 *   6) страница заблокирована, содержимое за затемнением выключено;
 *   7) Esc закрывает.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/25-nav-sheet.spec.js
 * Результат: tests/reports/nav-sheet/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'nav-sheet');

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

const кор = ч => Math.round(ч * 10) / 10;

test.describe('Боковой лист навигации', () => {
    test('снимок по живой странице', async ({ page }, info) => {
        const экран = page.viewportSize();
        const поЯзыкам = {};

        for (const стр of СТРАНИЦЫ) {
            await page.goto(стр.адрес);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(400);

            const бургер = page.locator('#burgerMenu');
            const виден = await бургер.isVisible();
            if (!виден) {
                поЯзыкам[стр.имя] = { бургера_нет: true, ширина: экран.width };
                continue;
            }

            const доОткрытия = await бургер.boundingBox();

            await бургер.click();
            await page.waitForTimeout(450);

            const замер = await page.evaluate(() => {
                const кор = ч => Math.round(ч * 10) / 10;
                const шапка = document.querySelector('.floating-header');
                const лист = document.getElementById('mobileNav');
                const тень = document.querySelector('.mobile-nav-scrim');
                const войти = document.querySelector('.floating-header .btn-auth');
                const rш = шапка.getBoundingClientRect();
                const rл = лист.getBoundingClientRect();
                const rт = тень ? тень.getBoundingClientRect() : null;

                // Кто на самом деле ловит нажатие в центре «Войти».
                let ктоЛовит = null;
                if (войти) {
                    const rв = войти.getBoundingClientRect();
                    const эл = document.elementFromPoint(rв.left + rв.width / 2, rв.top + rв.height / 2);
                    ктоЛовит = эл ? (эл.className || эл.tagName) + '' : null;
                    ктоЛовит = {
                        описание: ктоЛовит,
                        это_войти: !!(эл && (эл === войти || войти.contains(эл)))
                    };
                }

                // Цели нажатия внутри листа
                const цели = [];
                лист.querySelectorAll('a, button').forEach(эл => {
                    const r = эл.getBoundingClientRect();
                    if (r.width > 0 && r.height > 0) цели.push(кор(Math.min(r.width, r.height)));
                });

                const главное = document.querySelector('main');
                const подвал = document.querySelector('.site-footer');

                return {
                    шапка: { низ: кор(rш.bottom), высота: кор(rш.height) },
                    лист: {
                        верх: кор(rл.top), низ: кор(rл.bottom),
                        лево: кор(rл.left), право: кор(rл.right),
                        ширина: кор(rл.width), высота: кор(rл.height)
                    },
                    прокрутка_внутри: {
                        содержимое: лист.scrollHeight,
                        видно: лист.clientHeight,
                        нужна: лист.scrollHeight > лист.clientHeight + 1
                    },
                    затемнение: rт ? {
                        есть: true, верх: кор(rт.top), низ: кор(rт.bottom),
                        накрывает_шапку: rт.top < rш.bottom - 1
                    } : { есть: false },
                    войти: ктоЛовит,
                    страница_заблокирована: getComputedStyle(document.body).overflow === 'hidden',
                    за_затемнением_выключено: {
                        main: главное ? главное.inert === true : null,
                        подвал: подвал ? подвал.inert === true : null
                    },
                    шапка_не_выключена: !document.querySelector('.floating-header').inert,
                    целей: цели.length,
                    наименьшая_цель: цели.length ? Math.min.apply(null, цели) : null,
                    целей_меньше_44: цели.filter(ц => ц < 44).length
                };
            });

            const послеОткрытия = await бургер.boundingBox();

            await page.keyboard.press('Escape');
            await page.waitForTimeout(400);
            const закрылся = !(await page.locator('#mobileNav.active').count());
            const фокусНаБургере = await page.evaluate(
                () => document.activeElement && document.activeElement.id === 'burgerMenu');

            поЯзыкам[стр.имя] = Object.assign(замер, {
                экран: экран.width + 'x' + экран.height,
                за_экраном: кор(замер.лист.низ - экран.height),
                прижат_к_правому_краю: Math.abs(замер.лист.право - экран.width) < 1,
                начинается_под_шапкой: Math.abs(замер.лист.верх - замер.шапка.низ) < 1,
                мишень_не_сдвинулась: !!(доОткрытия && послеОткрытия
                    && Math.abs(доОткрытия.x - послеОткрытия.x) < 1
                    && Math.abs(доОткрытия.y - послеОткрытия.y) < 1
                    && Math.abs(доОткрытия.width - послеОткрытия.width) < 1),
                бургер: доОткрытия ? {
                    ширина: кор(доОткрытия.width), высота: кор(доОткрытия.height)
                } : null,
                esc_закрывает: закрылся,
                esc_вернул_фокус: фокусНаБургере
            });
        }

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify(поЯзыкам, null, 2), 'utf8');
        console.log(info.project.name + ' -> ' + JSON.stringify(поЯзыкам, null, 2));
    });
});
