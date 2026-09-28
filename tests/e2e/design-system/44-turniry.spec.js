/**
 * СТРАНИЦА ТУРНИРОВ — решения Кости 26–27.09.
 *
 * ТЕСТ ИДЁТ ПО СТЕНДУ `maket/turniry-zamer.html`, где `supabaseClient`
 * подменён заглушкой: разметку рисует НАСТОЯЩИЙ js/tournaments-overview.js,
 * краски — НАСТОЯЩИЙ css/tournaments-overview.css, а запросы уходят в
 * заготовленные строки. Поэтому здесь можно нажимать кнопки, и поведение
 * проверяется поведением, а не чтением кода.
 *
 * Содержимое стенда КРАЙНЕЕ: название в 76 знаков, категория с одним
 * турниром, категория без турниров вовсе, все четыре статуса.
 *
 * ЧТО ИМЕННО ЗАМОРОЖЕНО — ОТНОШЕНИЯ, А НЕ ЧИСЛА:
 *   • крупная карточка равна столбу, пока столб стоит РЯДОМ;
 *   • слотов столько, сколько заполняет целые ряды;
 *   • подзаголовок строго мельче заголовка на каждом виде;
 *   • цель нажатия не меньше ступени md.
 *
 * Два замера сюда перенесены нарочно: `:focus-visible` зависит от СПОСОБА
 * получения фокуса, а `:hover` не включается событием. В браузере через
 * расширение оба врут — здесь клавиши и мышь настоящие.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/turniry-zamer.html';

/* ТРИ ЯЗЫКА, А НЕ ОДИН. 27.09 Костя поймал: тест ходил только по русскому
   стенду, и 95 зелёных проверок ничего не говорили про английскую и
   кыргызскую страницы — а слова там длиннее, и ломается ровно это.
   Стенд один: язык он берёт из ?lang= и на миг подменяет себе путь, потому
   что код страницы определяет язык путём (js/tournaments-overview.js:6–7). */
const ЯЗЫКИ = [
    { имя: 'ru', адрес: СТЕНД },
    { имя: 'en', адрес: СТЕНД + '?lang=en' },
    { имя: 'kg', адрес: СТЕНД + '?lang=kg' }
];

const ШКАЛА = [11, 12, 14, 16, 18, 21, 26, 32, 40];

async function открыть(page, адрес) {
    await page.goto(адрес);
    // Признак, а не тишина сети: категории отрисованы
    await page.waitForFunction(
        () => document.querySelectorAll('.to-category-block').length > 0,
        null, { timeout: 15000 });
}

/** Раскладка, которую получил этот вид. Считается так же, как в коде. */
async function раскладка(page) {
    return page.evaluate(() => {
        if (document.querySelector('.to-phone-cards')) return 'лента';
        const с = document.querySelector('.to-side-stack');
        return с ? 'слоты:' + с.children.length : 'нет';
    });
}

const высота = (page, с) => page.evaluate(
    s => { const э = document.querySelector(s); return э ? Math.round(э.getBoundingClientRect().height) : null; }, с);

for (const Я of ЯЗЫКИ) {

test.describe('страница турниров · ' + Я.имя, () => {

    /* ══ РАСКЛАДКА ═══════════════════════════════════════════════════════ */

    test('раскладка выбрана по ширине и повороту, а не по одной ширине', async ({ page }, info) => {
        await открыть(page, Я.адрес);
        const р = await раскладка(page);
        const { width, height } = page.viewportSize();
        const низкийБоком = height <= 500 && width >= height;

        if (низкийБоком || width <= 640) {
            expect(р, 'узкий или низкий горизонтальный экран получает ленту').toBe('лента');
        } else if (width < 992) {
            expect(р, 'планшет — четыре слота, два целых ряда').toBe('слоты:4');
        } else {
            expect(р, 'десктоп — три слота столбом сбоку').toBe('слоты:3');
        }
    });

    test('крупная карточка равна столбу, пока столб стоит рядом', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) === 'лента') return;
        const { width } = page.viewportSize();
        if (width < 992) return;                    // здесь столб уже под карточкой

        const пары = await page.evaluate(() =>
            [...document.querySelectorAll('.to-card-grid')].map(g => ({
                крупная: Math.round(g.firstElementChild.getBoundingClientRect().height),
                столб: Math.round(g.querySelector('.to-side-stack').getBoundingClientRect().height)
            })));
        expect(пары.length).toBeGreaterThan(0);
        пары.forEach(п => expect(Math.abs(п.крупная - п.столб),
            'колонки разного роста: ' + п.крупная + ' против ' + п.столб).toBeLessThanOrEqual(1));
    });

    test('все блоки категорий одного роста — ритм не гуляет', async ({ page }) => {
        await открыть(page, Я.адрес);
        const высоты = await page.evaluate(() =>
            [...document.querySelectorAll('.to-category-block')]
                .map(б => Math.round(б.getBoundingClientRect().height)));
        expect(высоты.length).toBeGreaterThan(1);
        const разброс = Math.max(...высоты) - Math.min(...высоты);
        expect(разброс, 'высоты блоков: ' + высоты.join(' · ')).toBeLessThanOrEqual(2);
    });

    /* Решение Кости 28.09: «только не рисуй там ничего, а то то одна
       большая, другая маленькая — все одного размера и стандарта», и
       отдельно про планшет: «не надо держать пустые места». Прежняя
       проверка требовала от пустого слота ПОДПИСИ — это отменено. */
    test('пустой слот держит место и молчит, а на планшете не держит вовсе', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) === 'лента') return;
        const { width } = page.viewportSize();
        const пустые = await page.evaluate(() =>
            [...document.querySelectorAll('.to-slot-empty')].map(э => ({
                высота: Math.round(э.getBoundingClientRect().height),
                текст: э.textContent.trim()
            })));
        expect(пустые.length, 'в стенде есть категория с одним турниром — пустые слоты обязаны быть')
            .toBeGreaterThan(0);
        пустые.forEach(п => {
            if (width < 992) {
                expect(п.высота, 'на планшете пустое место не держится').toBe(0);
            } else {
                expect(п.высота, 'пустой слот схлопнулся').toBeGreaterThan(100);
            }
            expect(п.текст, 'пустой слот что-то рисует').toBe('');
        });
    });

    /* НАЙДЕНО ЗАМЕРОМ 28.09, А НЕ ТЕСТОМ: на 768 под афишу держалось 232
       при ширине карточки 332, названия турнира не было видно вовсе, а
       overflow: hidden срезал это молча. Тест был зелёным всё это время,
       потому что мерил высоты блоков и лестницу — но не перелив. */
    test('содержимое боковой карточки не переливает за её край', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) === 'лента') return;
        const беда = await page.evaluate(() => {
            const вышло = [];
            document.querySelectorAll('.to-side-stack .to-compact').forEach(к => {
                const r = к.getBoundingClientRect();
                к.querySelectorAll('*').forEach(э => {
                    const b = э.getBoundingClientRect();
                    if (b.height === 0 && b.width === 0) return;
                    if (b.bottom > r.bottom + 1 || b.right > r.right + 1) {
                        вышло.push((э.getAttribute('class') || э.tagName).split(' ')[0] +
                                   ' низ +' + Math.round(b.bottom - r.bottom) +
                                   ' право +' + Math.round(b.right - r.right));
                    }
                });
            });
            return вышло;
        });
        expect(беда.length, 'переливает из карточки: ' + беда.slice(0, 6).join(' · ')).toBe(0);
    });

    /* Решение Кости 28.09: «на афишу не залезай — до границы афиш».
       Проверяется ГЕОМЕТРИЕЙ, а не правилом в файле: плашка обязана
       начинаться правее правого края афиши. */
    test('плашка статуса не залезает на афишу', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) === 'лента') return;
        const наложения = await page.evaluate(() => {
            const плохо = [];
            document.querySelectorAll('.to-side-stack .to-compact-thumb').forEach(к => {
                const фон = getComputedStyle(к, '::before');
                if (фон.display === 'none') return;         // афиши нет — нечего беречь
                const ширинаАфиши = parseFloat(фон.width) || 0;
                if (!ширинаАфиши) return;
                const край = к.getBoundingClientRect().left + ширинаАфиши;
                const п = к.querySelector('.to-compact-status');
                if (п && п.getBoundingClientRect().left < край - 1) {
                    плохо.push(п.textContent.trim() + ' заходит на афишу на ' +
                               Math.round(край - п.getBoundingClientRect().left));
                }
            });
            return плохо;
        });
        expect(наложения.length, наложения.join(' · ')).toBe(0);
    });

    test('лента листается вбок, и следующая карточка выглядывает', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) !== 'лента') return;
        const л = await page.evaluate(() => {
            const к = document.querySelector('.to-phone-cards');
            const карточки = [...к.querySelectorAll('.tc')];
            const край = к.getBoundingClientRect().right;
            return {
                карточек: карточки.length,
                листается: к.scrollWidth > к.clientWidth + 4,
                снап: getComputedStyle(к).scrollSnapType.indexOf('x') !== -1,
                выглядывает: карточки.some(c => {
                    const r = c.getBoundingClientRect();
                    return r.left < край && r.right > край;   // пересекает правый край
                })
            };
        });
        expect(л.карточек).toBeGreaterThanOrEqual(2);
        expect(л.листается, 'лента не листается').toBe(true);
        expect(л.снап, 'нет снапа — лента останавливается где попало').toBe(true);
        expect(л.выглядывает, 'ряд обрезан ровно по краю и читается как законченный').toBe(true);
    });

    /* ══ ПОРЯДОК ═════════════════════════════════════════════════════════ */

    test('категория с идущим турниром идёт первой', async ({ page }) => {
        await открыть(page, Я.адрес);
        const порядок = await page.evaluate(() =>
            [...document.querySelectorAll('.to-category-block')].map(б => б.dataset.cat));
        expect(порядок[0], 'в стенде идущий турнир заведён в promasters').toBe('promasters');
        expect(порядок[порядок.length - 1], 'категория из одних завершённых уходит вниз').toBe('tour');
    });

    /* ══ ЛЕСТНИЦА ════════════════════════════════════════════════════════ */

    test('каждый текстовый уровень стоит на ступени шкалы', async ({ page }) => {
        await открыть(page, Я.адрес);
        const уровни = await page.evaluate(() => {
            const с = ['.to-hero h1', '.to-hero-sub', '.hero-stat-value', '.hero-stat-label',
                       '.to-category-title', '.to-view-all', '.to-slot-empty',
                       '.to-compact-info h4', '.to-phone-cards .tc-title'];
            const из = {};
            с.forEach(k => { const э = document.querySelector(k);
                if (э) из[k] = Math.round(parseFloat(getComputedStyle(э).fontSize)); });
            return из;
        });
        Object.entries(уровни).forEach(([имя, кегль]) => {
            expect(ШКАЛА, имя + ' = ' + кегль + ', такой ступени на шкале нет').toContain(кегль);
        });
    });

    test('подзаголовок обложки СТРОГО мельче заголовка на каждом виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const [з, п] = await page.evaluate(() => [
            parseFloat(getComputedStyle(document.querySelector('.to-hero h1')).fontSize),
            parseFloat(getComputedStyle(document.querySelector('.to-hero-sub')).fontSize)
        ]);
        expect(п, 'пара схлопнулась: ' + з + ' и ' + п).toBeLessThan(з);
    });

    /* ══ ОБЛОЖКА ═════════════════════════════════════════════════════════ */

    test('обложка не запирает первый экран на низком горизонтальном', async ({ page }) => {
        await открыть(page, Я.адрес);
        const { height } = page.viewportSize();
        if (height > 500) return;
        const о = await высота(page, '.to-hero');
        expect(о, 'обложка ' + о + ' при экране ' + height).toBeLessThan(height * 0.75);
    });

    /* ══ ПОИСК ═══════════════════════════════════════════════════════════ */

    test('поиск прилипает под шапку при прокрутке', async ({ page }) => {
        await открыть(page, Я.адрес);
        await page.evaluate(() => window.scrollTo(0, 1200));
        await page.waitForTimeout(400);
        const р = await page.evaluate(() => {
            const w = document.querySelector('.to-search-wrap');
            const шапка = parseFloat(getComputedStyle(document.documentElement)
                .getPropertyValue('--header-h')) || 64;
            return { верх: Math.round(w.getBoundingClientRect().top), шапка: Math.round(шапка) };
        });
        expect(Math.abs(р.верх - р.шапка), 'поиск встал на ' + р.верх + ', ждали ' + р.шапка)
            .toBeLessThanOrEqual(1);
    });

    test('поле поиска держит ступень кнопки, а лупа стоит внутри него', async ({ page }) => {
        await открыть(page, Я.адрес);
        const р = await page.evaluate(() => {
            const поле = document.querySelector('.to-search-input');
            const лупа = document.querySelector('.to-search-icon');
            const п = поле.getBoundingClientRect(), л = лупа.getBoundingClientRect();
            return {
                высота: Math.round(п.height),
                внутри: л.left > п.left && л.right < п.right + 1,
                поЦентру: Math.abs((л.top + л.height / 2) - (п.top + п.height / 2))
            };
        });
        expect(р.высота).toBe(44);
        expect(р.внутри, 'лупа вне поля').toBe(true);
        expect(р.поЦентру, 'лупа не по центру поля').toBeLessThanOrEqual(1);
    });

    /* ══ ДОСТУПНОСТЬ ═════════════════════════════════════════════════════ */

    test('клавиатурой видно, где ты находишься', async ({ page }) => {
        await открыть(page, Я.адрес);
        // НАСТОЯЩИЙ Tab: :focus-visible зависит от способа получения фокуса,
        // и программный focus() его не включает
        let найдено = null;
        for (let i = 0; i < 12 && !найдено; i++) {
            await page.keyboard.press('Tab');
            найдено = await page.evaluate(() => {
                const э = document.activeElement;
                if (!э || э === document.body) return null;
                if (!э.matches(':focus-visible')) return null;
                const s = getComputedStyle(э);
                return {
                    элемент: э.className || э.tagName,
                    контур: s.outlineStyle,
                    толщина: parseFloat(s.outlineWidth) || 0
                };
            });
        }
        expect(найдено, 'за двенадцать нажатий Tab ни один элемент не показал обводку').not.toBeNull();
        expect(найдено.контур, найдено.элемент + ': обводки нет').not.toBe('none');
        expect(найдено.толщина, найдено.элемент + ': обводка тоньше двух').toBeGreaterThanOrEqual(2);
    });

    test('цель нажатия не меньше ступени md', async ({ page }) => {
        await открыть(page, Я.адрес);
        const мелкие = await page.evaluate(() =>
            [...document.querySelectorAll('a[href], button, input')]
                .map(э => ({ э, r: э.getBoundingClientRect() }))
                .filter(({ r }) => r.width > 0 && r.height > 0 && r.height < 44)
                .map(({ э, r }) => (э.className || э.tagName) + ' ' + Math.round(r.width) + '×' + Math.round(r.height)));
        expect(мелкие, 'цели ниже 44: ' + мелкие.join(' · ')).toEqual([]);
    });

    test('подсказка и граница поля читаются по WCAG', async ({ page }) => {
        await открыть(page, Я.адрес);
        const к = await page.evaluate(() => {
            const разбор = c => { const m = c.match(/[\d.]+/g).map(Number);
                return { r: m[0], g: m[1], b: m[2], a: m.length > 3 ? m[3] : 1 }; };
            const налож = (в, на) => ({ r: в.r * в.a + на.r * (1 - в.a),
                g: в.g * в.a + на.g * (1 - в.a), b: в.b * в.a + на.b * (1 - в.a), a: 1 });
            const ярк = c => { const f = [c.r, c.g, c.b].map(v => { v /= 255;
                return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
                return 0.2126 * f[0] + 0.7152 * f[1] + 0.0722 * f[2]; };
            const фон = э => { const сл = []; let n = э;
                while (n && n !== document.documentElement) {
                    const b = разбор(getComputedStyle(n).backgroundColor);
                    if (b.a > 0) сл.push(b); n = n.parentElement; }
                сл.push({ r: 10, g: 10, b: 10, a: 1 });
                let и = сл[сл.length - 1];
                for (let i = сл.length - 2; i >= 0; i--) и = налож(сл[i], и);
                return и; };
            const пара = (э, цвет) => { const ф = фон(э), т = налож(разбор(цвет), ф);
                const L1 = ярк(т), L2 = ярк(ф), hi = Math.max(L1, L2), lo = Math.min(L1, L2);
                return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100; };
            const поле = document.querySelector('.to-search-input');
            return {
                подсказка: пара(поле, getComputedStyle(поле, '::placeholder').color),
                граница: пара(поле, getComputedStyle(поле).borderTopColor)
            };
        });
        expect(к.подсказка, 'подсказка ' + к.подсказка + ', норма 4.5').toBeGreaterThanOrEqual(4.5);
        expect(к.граница, 'граница поля ' + к.граница + ', норма 3').toBeGreaterThanOrEqual(3);
    });

    test('настройка «меньше движения» выключает движение', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await открыть(page, Я.адрес);
        const длительности = await page.evaluate(() =>
            [...document.querySelectorAll('.to-categories *, .to-hero *')]
                .map(э => parseFloat(getComputedStyle(э).transitionDuration) || 0)
                .filter(д => д > 0.05));
        expect(длительности, 'осталось движение длиннее 50 мс: ' + длительности.length).toEqual([]);
    });

    test('у поля поиска есть имя для диктора', async ({ page }) => {
        await открыть(page, Я.адрес);
        const имя = await page.getAttribute('.to-search-input', 'aria-label');
        expect(имя && имя.trim().length, 'диктор прочитает только подсказку').toBeTruthy();
    });

    /* ══ ЦЕЛОСТНОСТЬ ═════════════════════════════════════════════════════ */

    test('страница не переливается вбок ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const перелив = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(перелив, 'горизонтальный перелив ' + перелив + ' px').toBeLessThanOrEqual(1);
    });

    test('наведение мышью поднимает карточку, но не ломает ряд', async ({ page }) => {
        await открыть(page, Я.адрес);
        if (await раскладка(page) === 'лента') return;
        const карточка = page.locator('.to-side-stack .to-compact').first();
        if (!(await карточка.count())) return;
        const до = await карточка.boundingBox();
        await карточка.hover();               // НАСТОЯЩАЯ мышь: :hover событием не включается
        await page.waitForTimeout(400);
        const после = await карточка.boundingBox();
        expect(Math.round(после.height), 'наведение поменяло высоту строки')
            .toBe(Math.round(до.height));
    });

    test('в консоли нет ошибок за загрузку', async ({ page }) => {
        const ошибки = [];
        page.on('pageerror', e => ошибки.push(e.message));
        page.on('console', m => { if (m.type() === 'error') ошибки.push(m.text()); });
        await открыть(page, Я.адрес);
        await page.waitForTimeout(1200);
        expect(ошибки, ошибки.join(' · ')).toEqual([]);
    });
});

}
