/**
 * ВХОД НА ТУРНИР — ССЫЛКА, А НЕ ОБРАБОТЧИК. 04.10.
 *
 * Замер пяти видов и трёх языков нашёл: турнир открывался ТРЕМЯ разными
 * карточками. На телефоне — настоящей ссылкой `a.tc`, на планшете и
 * десктопе — ссылкой у крупной и `div[data-href]` у полосы. Полоса не
 * открывалась в новой вкладке, НЕ БРАЛАСЬ КЛАВИАТУРОЙ ВОВСЕ и диктором
 * ссылкой не называлась. Числом: клавиатурой в блоках категорий бралось
 * 12 элементов на десктопе против 22 на телефоне — вид, показывающий
 * турниров больше, был доступен меньше. После правки 27 и 31.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • ДОХОДИТ ЛИ НАЖАТИЕ. Слой может быть объявлен и не получать нажатия:
 *     04.10 при `z-index: 0` он лёг ПОД содержимое, и нажатие на название
 *     перестало вести куда-либо — поймал замер, не чтение. Меряем
 *     elementFromPoint, а не наличие правила;
 *   • ЧТО СЛОЙ НЕ СЪЕЛ КНОПКУ. Обратная беда того же дня: слой поверх
 *     `input` убил отметку строк в заявках. Кнопки записи в полосе сейчас
 *     нет ни у одного турнира — её рисует только статус registration_open,
 *     поэтому КРАЙНИЙ СЛУЧАЙ ПОДСТАВЛЯЕТСЯ В РАЗМЕТКУ, а не в базу;
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ `var(--lh-snug)` В БРАУЗЕРЕ. В файле стоит имя,
 *     число говорит замер.
 *
 * ПОЛОС НЕТ НА ТЕЛЕФОНЕ. Раскладка переключается не одной шириной: при
 * ширине ≤ 640 ИЛИ высоте ≤ 500 рисуются карточки, а не полосы. Проверки
 * полосы там пропускают себя сами, вслух и с причиной.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', обзор: '/pages/tournaments-overview.html',    турнир: 'tournament.html' },
    { имя: 'en', обзор: '/pages/tournaments-overview-en.html', турнир: 'tournament-en.html' },
    { имя: 'kg', обзор: '/pages/tournaments-overview-kg.html', турнир: 'tournament-kg.html' },
];

/** Ступени лестницы межстрочного из tokens.css */
const МЕЖСТР = [1, 1.1, 1.3, 1.5, 1.65];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelectorAll('.to-category-block').length > 0,
        null, { timeout: 15000 });
    await page.waitForTimeout(1200);
}

const полос = page => page.evaluate(() =>
    Array.from(document.querySelectorAll('.to-compact'))
        .filter(n => n.getBoundingClientRect().height > 0).length);

for (const Я of ЯЗЫКИ) {

test.describe('вход на турнир · ' + Я.имя, () => {

    test('каждый вход на турнир — настоящая ссылка', async ({ page }) => {
        await открыть(page, Я.обзор);
        const з = await page.evaluate(файл => {
            const видно = n => n.getBoundingClientRect().height > 0;
            const ведут = Array.from(document.querySelectorAll(
                'a[href*="' + файл + '?id="], [data-href*="' + файл + '?id="]')).filter(видно);
            return {
                всего: ведут.length,
                неСсылки: ведут.filter(n => n.tagName !== 'A').map(n => n.className || n.tagName),
            };
        }, Я.турнир);

        expect(з.всего, 'ПОРОГ: без входов проверка прошла бы вхолостую').toBeGreaterThan(0);
        expect(з.неСсылки,
            'было 15 из 21 на десктопе: div[data-href] не открывается в новой ' +
            'вкладке, не берётся клавиатурой и диктором не называется ссылкой')
            .toEqual([]);
    });

    test('у полосы есть слой-ссылка, и у него имя турнира', async ({ page }) => {
        await открыть(page, Я.обзор);
        const n = await полос(page);
        test.skip(n === 0, 'на этом виде полос нет — раскладка телефона');

        const з = await page.evaluate(() => {
            const видно = x => x.getBoundingClientRect().height > 0;
            const пп = Array.from(document.querySelectorAll('.to-compact')).filter(видно);
            return {
                полос: пп.length,
                соСлоем: пп.filter(п => п.querySelector(':scope > a.to-compact-cover[href]')).length,
                сИменем: pp_имена(пп),
                сДатаHref: пп.filter(п => п.hasAttribute('data-href')).length,
            };
            function pp_имена(пп) {
                return пп.filter(п => {
                    const a = п.querySelector(':scope > a.to-compact-cover');
                    return a && (a.getAttribute('aria-label') || '').trim().length > 2;
                }).length;
            }
        });

        expect(з.соСлоем, 'слой — ПРЯМОЙ ребёнок полосы: изнутри h4 его обрезал бы overflow')
            .toBe(з.полос);
        expect(з.сИменем, 'пустая ссылка диктору ничего не говорит').toBe(з.полос);
        expect(з.сДатаHref, 'два входа у одной полосы — это два поведения').toBe(0);
    });

    test('нажатие в полосу доходит до ссылки, а не умирает в тексте', async ({ page }) => {
        await открыть(page, Я.обзор);
        const n = await полос(page);
        test.skip(n === 0, 'на этом виде полос нет — раскладка телефона');

        await page.evaluate(() => {
            const п = document.querySelectorAll('.to-compact')[0];
            if (п) п.scrollIntoView({ block: 'center' });
        });
        await page.waitForTimeout(300);

        const пробы = await page.evaluate(() => {
            const видно = x => x.getBoundingClientRect().height > 0;
            const из = [];
            for (const п of Array.from(document.querySelectorAll('.to-compact')).filter(видно)) {
                const r = п.getBoundingClientRect();
                if (!(r.top >= 0 && r.bottom <= window.innerHeight)) continue;
                const слой = п.querySelector(':scope > a.to-compact-cover');
                const где = (x, y) => {
                    const э = document.elementFromPoint(Math.round(x), Math.round(y));
                    return э === слой ? 'слой' : (э ? (э.className || э.tagName) : 'ничего');
                };
                const h = п.querySelector('h4').getBoundingClientRect();
                из.push({
                    середина: где(r.left + r.width / 2, r.top + r.height / 2),
                    название: где(h.left + 4, h.top + h.height / 2),
                });
                if (из.length >= 2) break;
            }
            return из;
        });

        expect(пробы.length, 'ни одна полоса не попала в окно целиком').toBeGreaterThan(0);
        for (const п of пробы) {
            expect(п.середина,
                'при z-index: 0 здесь возвращался SPAN: СОДЕРЖИМОЕ СЪЕДАЕТ СЛОЙ, ' +
                'если слой под ним').toBe('слой');
            expect(п.название, 'нажатие на название — главный способ открыть турнир').toBe('слой');
        }
    });

    test('слой не съел кнопку записи', async ({ page }) => {
        await открыть(page, Я.обзор);
        const n = await полос(page);
        test.skip(n === 0, 'на этом виде полос нет — раскладка телефона');

        /* КРАЙНИЙ СЛУЧАЙ ПОДСТАВЛЯЕТСЯ В РАЗМЕТКУ: кнопку в полосе рисует
           только статус registration_open, и такого турнира в базе может
           не быть. База не трогается. */
        const з = await page.evaluate(() => {
            const п = document.querySelectorAll('.to-compact')[0];
            п.scrollIntoView({ block: 'center' });
            let право = п.querySelector('.to-compact-right');
            if (!право) {
                право = document.createElement('div');
                право.className = 'to-compact-right';
                п.appendChild(право);
            }
            const b = document.createElement('button');
            b.className = 'btn-register to-register to-compact-regbtn';
            b.textContent = 'Регистрация';
            право.appendChild(b);

            const слой = п.querySelector(':scope > a.to-compact-cover');
            const br = b.getBoundingClientRect();
            const центр = document.elementFromPoint(
                Math.round(br.left + br.width / 2), Math.round(br.top + br.height / 2));
            return {
                виднаКнопка: br.height > 0,
                высота: Math.round(br.height),
                попадает: !!(центр && (центр === b || b.contains(центр))),
                ктоСверху: центр === слой ? 'слой' : (центр ? (центр.className || центр.tagName) : 'ничего'),
                zСлоя: getComputedStyle(слой).zIndex,
                zПравой: getComputedStyle(право).zIndex,
            };
        });

        expect(з.виднаКнопка).toBe(true);
        expect(з.высота, 'цель нажатия кнопки — ступень 44').toBeGreaterThanOrEqual(44);
        expect(з.попадает,
            'слой поверх кнопки — та самая беда 04.10, когда он убил отметку ' +
            'строк в заявках. Сверху оказался: ' + з.ктоСверху).toBe(true);
        expect(Number(з.zПравой), 'действие стоит выше слоя')
            .toBeGreaterThan(Number(з.zСлоя));
    });

    test('слой берётся клавиатурой, и фокус виден', async ({ page }) => {
        await открыть(page, Я.обзор);
        const n = await полос(page);
        test.skip(n === 0, 'на этом виде полос нет — раскладка телефона');

        const з = await page.evaluate(() => {
            const слой = document.querySelectorAll('.to-compact-cover')[0];
            слой.focus();
            const c = getComputedStyle(слой);
            return {
                дошёл: document.activeElement === слой,
                тег: document.activeElement.tagName,
                адрес: слой.getAttribute('href') || '',
                обводка: c.outlineStyle,
            };
        });

        expect(з.дошёл, 'до правки полоса не бралась клавиатурой вовсе').toBe(true);
        expect(з.тег).toBe('A');
        expect(з.адрес).toContain('?id=');
        expect(з.обводка, 'слой прозрачный: без обводки не видно, где человек')
            .not.toBe('none');
    });

    test('межстрочный названия полосы — ступень, а не число', async ({ page }) => {
        await открыть(page, Я.обзор);
        const n = await полос(page);
        test.skip(n === 0, 'на этом виде полос нет — раскладка телефона');

        const з = await page.evaluate(() => {
            const видно = x => x.getBoundingClientRect().height > 0;
            const п = Array.from(document.querySelectorAll('.to-compact')).filter(видно)[0];
            const h = п.querySelector('h4');
            const c = getComputedStyle(h);
            return {
                межстр: c.lineHeight,
                кегль: Math.round(parseFloat(c.fontSize) * 100) / 100,
                отношение: Math.round((parseFloat(c.lineHeight) / parseFloat(c.fontSize)) * 100) / 100,
            };
        });

        expect(з.межстр, '`normal` считается от шрифта — у разных людей своё число')
            .not.toBe('normal');
        expect(МЕЖСТР,
            'было 24 на 1024 и 1280 и 20 на 768 при одном кегле 16: получилось ' +
            з.отношение).toContain(з.отношение);
    });

    test('имя с кавычкой не разрывает атрибут', async ({ page }) => {
        await открыть(page, Я.обзор);
        const з = await page.evaluate(() => {
            const F = window.KSLT_TFEATURED;
            if (!F || !F.слойСсылки) return { нетМодуля: true };
            const d = document.createElement('div');
            d.innerHTML = F.слойСсылки('tournament.html?id=7', 'Кубок "Весна" & <Лига>');
            const a = d.firstElementChild;
            return {
                тег: a ? a.tagName : null,
                имя: a ? a.getAttribute('aria-label') : null,
                адрес: a ? a.getAttribute('href') : null,
                детей: d.children.length,
            };
        });

        expect(з.нетМодуля, 'слой входа живёт в KSLT_TFEATURED — одно определение').toBeFalsy();
        expect(з.тег).toBe('A');
        expect(з.детей, 'кавычка в названии разорвала бы атрибут и склеила разметку').toBe(1);
        expect(з.имя).toBe('Кубок "Весна" & <Лига>');
        expect(з.адрес).toBe('tournament.html?id=7');
    });

    test('перелива вбок нет', async ({ page }) => {
        await открыть(page, Я.обзор);
        const п = await page.evaluate(() =>
            document.documentElement.scrollWidth - window.innerWidth);
        expect(п).toBe(0);
    });

});

}
