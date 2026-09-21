// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * БУРГЕР ИЗНУТРИ — снимок геометрии, а не приговор.
 *
 * ЗАЧЕМ. Цели нажатия внутри бургера мы мерили (21-header-tap-targets) и
 * довели до 44. Но воздух, отступы, выравнивание и ритм не мерили НИ РАЗУ.
 * Костя 20.09 сказал про бургер: «не нравится что там много пустоты и
 * размер подложки, и текст уходит влево». Отвечать на это по коду нельзя:
 * в коде видно правило, а не то, сколько между строками воздуха.
 *
 * ЧТО МЕРИМ И ПОЧЕМУ ИМЕННО ЭТО:
 *   1) ритм — расстояния между строками. Разнобой в ритме читается как
 *      «разъехалось» раньше, чем человек назовёт причину;
 *   2) левые края текста на всех трёх уровнях (верхняя строка, раскрытый
 *      пункт, чип языка). Если они не выстраиваются в одну-две вертикали,
 *      список выглядит рассыпанным;
 *   3) кегли и цвета по уровням — не крупнее ли ребёнок родителя, как это
 *      было в десктопной панели (14.4 против 14);
 *   4) высота панели против высоты экрана — 20.09 замерено 842 при экране
 *      812, то есть выбор языка уходил за сгиб;
 *   5) отступы самой панели и её нижнего блока.
 *
 * ОСТОРОЖНО, ГЛАВНОЕ МЕСТО ОШИБКИ: раздел бургера надо РАСКРЫТЬ, иначе
 * померим шесть видимых строк из сорока одной — ровно это и случилось при
 * переписи 19.09. При этом разделы работают ГАРМОШКОЙ: открытым остаётся
 * последний нажатый, «раскрыть все» невозможно. Вложенные ссылки меряются
 * и в свёрнутом разделе, потому что свёрнутый список — это max-height: 0
 * с overflow: hidden, а не display: none.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/24-burger-inside.spec.js
 * Результат: tests/reports/burger-inside/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'burger-inside');

function метка() {
    try {
        return fs.readFileSync(path.join(__dirname, '..', '..', 'reports', '.run-id'), 'utf8').trim();
    } catch (e) { return ''; }
}

const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

test.describe('Бургер изнутри', () => {
    test('снимок геометрии', async ({ page }, info) => {
        const поЯзыкам = {};

        for (const стр of СТРАНИЦЫ) {
            await page.goto(стр.адрес);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(500);

            const кнопка = page.locator('#burgerMenu');
            if (!(await кнопка.isVisible().catch(() => false))) {
                поЯзыкам[стр.имя] = { бургераНет: true };
                continue;
            }
            await кнопка.click();
            await page.waitForTimeout(400);
            // раскрываем ОДИН раздел — «Инфо», самый длинный. Гармошка не даёт
            // раскрыть все, и притворяться, что даёт, не нужно.
            const тумблеры = page.locator('#mobileNav .mobile-dropdown-toggle');
            const сколько = await тумблеры.count();
            if (сколько > 0) {
                await тумблеры.nth(сколько - 1).click({ force: true }).catch(() => {});
                await page.waitForTimeout(450);
            }

            поЯзыкам[стр.имя] = await page.evaluate(() => {
                const окр = v => Math.round(v * 10) / 10;
                const нав = document.querySelector('#mobileNav');
                if (!нав) return { нет: '#mobileNav' };
                const c = getComputedStyle(нав);
                const r = нав.getBoundingClientRect();

                // левый край ТЕКСТА, а не рамки элемента
                function текстЛево(el) {
                    const t = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
                    if (!t) return окр(el.getBoundingClientRect().left);
                    const rg = document.createRange(); rg.selectNodeContents(t);
                    const rc = rg.getBoundingClientRect();
                    return окр(rc.width ? rc.left : el.getBoundingClientRect().left);
                }
                function снять(el, уровень) {
                    const rr = el.getBoundingClientRect();
                    const cc = getComputedStyle(el);
                    return {
                        уровень,
                        текст: (el.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 24),
                        верх: окр(rr.top), в: окр(rr.height), ш: окр(rr.width),
                        лево: окр(rr.left), текстЛево: текстЛево(el),
                        кегль: окр(parseFloat(cc.fontSize)), вес: cc.fontWeight,
                        цвет: cc.color, отступы: cc.padding
                    };
                }

                const верхние = [...нав.querySelectorAll('.mobile-nav-links > li > a')].map(e => снять(e, 'верх'));
                const раскрытый = нав.querySelector('.mobile-nav-dropdown.active');
                const вложенные = раскрытый
                    ? [...раскрытый.querySelectorAll('.mobile-dropdown-menu li a')].map(e => снять(e, 'вложенный'))
                    : [];
                const чипы = [...нав.querySelectorAll('.mobile-lang-option')].map(e => снять(e, 'язык'));
                const заголовокЯзыка = нав.querySelector('.mobile-lang-title');

                // ритм: расстояния между верхними строками
                const шаги = [];
                for (let i = 1; i < верхние.length; i++)
                    шаги.push(окр(верхние[i].верх - (верхние[i - 1].верх + верхние[i - 1].в)));

                return {
                    панель: {
                        ш: окр(r.width), в: окр(r.height),
                        padding: c.padding, фон: c.backgroundColor,
                        экран: окр(window.innerHeight),
                        заСгибом: окр(Math.max(0, r.bottom - window.innerHeight))
                    },
                    раскрытыйРаздел: раскрытый
                        ? (раскрытый.querySelector('.mobile-dropdown-toggle')?.textContent || '').trim().slice(0, 16)
                        : null,
                    ритмВерхних: шаги,
                    вертикали: {
                        верх: [...new Set(верхние.map(x => x.текстЛево))],
                        вложенные: [...new Set(вложенные.map(x => x.текстЛево))],
                        язык: [...new Set(чипы.map(x => x.текстЛево))]
                    },
                    кегли: {
                        верх: [...new Set(верхние.map(x => x.кегль))],
                        вложенные: [...new Set(вложенные.map(x => x.кегль))],
                        язык: [...new Set(чипы.map(x => x.кегль))],
                        заголовокЯзыка: заголовокЯзыка ? окр(parseFloat(getComputedStyle(заголовокЯзыка).fontSize)) : null
                    },
                    высоты: {
                        верх: [...new Set(верхние.map(x => x.в))],
                        вложенные: [...new Set(вложенные.map(x => x.в))],
                        язык: [...new Set(чипы.map(x => x.в))]
                    },
                    верхние, вложенные, чипы
                };
            });

            await page.locator('#burgerMenu').click().catch(() => {});
            await page.waitForTimeout(200);
        }

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify({ прогон: метка(), проект: info.project.name, окно: page.viewportSize(), языки: поЯзыкам }, null, 2) + '\n',
            'utf8');
    });
});
