// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * ВЫПАДАЮЩАЯ ПАНЕЛЬ ДЕСКТОПНОЙ ШАПКИ — снимок, а не приговор.
 *
 * ЗАЧЕМ. На доске решений 201:145 в списке «NOT MEASURED» прямым текстом
 * стоит «geometry of the desktop dropdown panel». Костя 20.09 посмотрел
 * глазами и сказал три вещи: много пустоты, подложка не того размера,
 * текст уходит влево — и спросил, не лишнее ли это движение мышью.
 * Отвечать на такое по коду нельзя: в коде видно правило, а не то,
 * насколько далеко курсору идти. Меряем.
 *
 * ЧТО ИМЕННО МЕРИМ, И ПОЧЕМУ ИМЕННО ЭТО:
 *   1) ширина панели против ширины самого длинного пункта — это и есть
 *      «пустота»: min-width 260 задан один на все панели, а длина
 *      названий у них разная;
 *   2) сдвиг между левым краем ТЕКСТА в шапке и левым краем ТЕКСТА в
 *      панели — это длина лишнего движения вбок. Панель центрована по
 *      кнопке (left: 50% + translateX(-50%)), а текст в ней прижат влево,
 *      поэтому колонка текста уезжает левее своего же заголовка;
 *   3) кегль заголовка против кегля пункта — на глаз «название мелковато».
 *      Проверяем, не крупнее ли ребёнок родителя;
 *   4) вылезает ли панель за край окна — это ограничение для любой правки
 *      выравнивания, и узнать его надо ДО того, как рисовать варианты.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/22-header-dropdowns.spec.js
 * Результат: tests/reports/header-dropdowns/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'header-dropdowns');

function метка() {
    try {
        return fs.readFileSync(path.join(__dirname, '..', '..', 'reports', '.run-id'), 'utf8').trim();
    } catch (e) { return ''; }
}

test.describe('Выпадающая панель шапки', () => {
    test('снимок геометрии', async ({ page }, info) => {
        await page.goto('/');
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        const окно = page.viewportSize();
        const триггеры = page.locator('.floating-header .nav-dropdown');
        const сколько = await триггеры.count();

        const панели = [];
        for (let i = 0; i < сколько; i++) {
            const т = триггеры.nth(i);
            if (!(await т.isVisible().catch(() => false))) continue;
            await т.hover().catch(() => {});
            await page.waitForTimeout(450);   // 0.3s переход + запас

            const снимок = await т.evaluate((узел, ширинаОкна) => {
                const окр = v => Math.round(v * 10) / 10;
                const заголовок = узел.querySelector('.nav-item');
                const панель = узел.querySelector('.nav-dropdown-menu');
                if (!заголовок || !панель) return null;
                const cп = getComputedStyle(панель);
                if (cп.visibility === 'hidden') return { имя: (заголовок.textContent||'').trim(), неРаскрылась: true };

                // левый край ТЕКСТА заголовка: сам <a> имеет padding,
                // поэтому берём диапазон текстового узла, а не рамку элемента
                function текстЛево(el) {
                    const t = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
                    if (!t) return окр(el.getBoundingClientRect().left);
                    const r = document.createRange(); r.selectNodeContents(t);
                    const rc = r.getBoundingClientRect();
                    return окр(rc.width ? rc.left : el.getBoundingClientRect().left);
                }
                function текстШирина(el) {
                    const t = [...el.childNodes].find(n => n.nodeType === 3 && n.textContent.trim());
                    if (!t) return окр(el.getBoundingClientRect().width);
                    const r = document.createRange(); r.selectNodeContents(t);
                    return окр(r.getBoundingClientRect().width);
                }

                const rз = заголовок.getBoundingClientRect();
                const rп = панель.getBoundingClientRect();
                const пункты = [...панель.querySelectorAll('.nav-dropdown-item')].map(п => ({
                    текст: (п.textContent || '').trim().slice(0, 30),
                    лево: окр(п.getBoundingClientRect().left),
                    текстЛево: текстЛево(п),
                    текстШирина: текстШирина(п),
                    в: окр(п.getBoundingClientRect().height),
                    кегль: окр(parseFloat(getComputedStyle(п).fontSize))
                }));
                const самыйДлинный = пункты.reduce((a, b) => (b.текстШирина > a.текстШирина ? b : a), пункты[0] || { текстШирина: 0, текст: '' });

                return {
                    имя: (заголовок.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 20),
                    заголовок: {
                        лево: окр(rз.left), право: окр(rз.right), ш: окр(rз.width),
                        текстЛево: текстЛево(заголовок),
                        кегль: окр(parseFloat(getComputedStyle(заголовок).fontSize)),
                        вес: getComputedStyle(заголовок).fontWeight
                    },
                    панель: {
                        лево: окр(rп.left), право: окр(rп.right), ш: окр(rп.width), в: окр(rп.height),
                        minWidth: cп.minWidth, padding: cп.padding,
                        выходитЗаПравыйКрай: окр(Math.max(0, rп.right - ширинаОкна)),
                        выходитЗаЛевыйКрай: окр(Math.max(0, -rп.left))
                    },
                    // сколько курсору идти вбок от текста заголовка до текста пункта
                    сдвигТекста: окр(пункты.length ? пункты[0].текстЛево - текстЛево(заголовок) : 0),
                    // пустота: ширина панели минус то, что реально занято текстом
                    самыйДлинныйПункт: самыйДлинный.текст,
                    самыйДлинныйТекст: самыйДлинный.текстШирина,
                    пустотаСправа: окр(rп.width - (самыйДлинный.текстШирина + 8 * 2 + 16 * 2)),
                    пунктов: пункты.length,
                    пункты
                };
            }, окно.width);

            if (снимок) панели.push(снимок);
            await page.mouse.move(5, окно.height - 5);
            await page.waitForTimeout(250);
        }

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(
            path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify({ прогон: метка(), проект: info.project.name, окно, панелей: панели.length, панели }, null, 2) + '\n',
            'utf8');
    });
});
