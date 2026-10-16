/**
 * ДВИЖЕНИЕ И МЕЖСТРОЧНЫЕ. 15.10, ветка B, заход B4.
 *
 * Замер: 27 блоков `prefers-reduced-motion` в 21 файле, каждый поимённо,
 * и 26 бесконечных анимаций из 38 не гасились вовсе. Межстрочных мимо
 * лестницы 1 · 1.1 · 1.3 · 1.5 · 1.65 — 69 мест в восьми файлах.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ДВИЖЕНИЯ НЕТ НА ЭКРАНЕ, а не что в файле есть блок. Заморозка
 *     читает css как текст; сложить каскад, медиазапрос и важность может
 *     только браузер. Настройка включается по-настоящему —
 *     `prefers-reduced-motion: reduce`;
 *   • ЧТО ПРИ ВЫКЛЮЧЕННОЙ НАСТРОЙКЕ ВСЁ НА МЕСТЕ: глобальный сброс легко
 *     написать так, что он погасит движение всем подряд;
 *   • ЧТО ЛЕНТА, КОТОРАЯ ВЕЗЁТ СОДЕРЖИМОЕ, ОСТАЁТСЯ ДОСТУПНОЙ: её мало
 *     остановить, иначе спонсоры за краем экрана пропадают насовсем;
 *   • ЧТО ЛЕСТНИЦА МЕЖСТРОЧНЫХ ДЕРЖИТСЯ ПОСЛЕ КАСКАДА, на живых узлах.
 *
 * ВИДЫ ЗАДАЁТ КОНФИГ (пять проектов). Свой перебор помножил бы набор на 25.
 *
 * ПОРОГ: узлов не собралось — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

/** Считает узлы, у которых движение ЖИВОЕ после всего каскада. */
const СЧЁТ_ДВИЖЕНИЯ = `() => {
    let анимаций = 0, переходов = 0;
    const узлы = document.querySelectorAll('*');
    узлы.forEach(э => {
        const s = getComputedStyle(э);
        if (s.animationName !== 'none' && parseFloat(s.animationDuration) > 0.001) анимаций++;
        if (parseFloat(s.transitionDuration) > 0.001) переходов++;
    });
    return { узлов: узлы.length, анимаций, переходов,
             прокрутка: getComputedStyle(document.documentElement).scrollBehavior };
}`;

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

for (const язык of ЯЗЫКИ) {

test.describe('движение и межстрочные · ' + язык.код, () => {

    test('при просьбе не двигать — на экране не движется НИЧЕГО', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await открыть(page, '/index' + язык.хвост + '.html', 'header, .site-header, body');
        const м = await page.evaluate(и => eval('(' + и + ')')(), СЧЁТ_ДВИЖЕНИЯ);
        expect(м.узлов, 'ПОРОГ: страница не поднялась').toBeGreaterThan(200);
        expect(м.анимаций,
            'на экране осталось живое движение: анимаций ' + м.анимаций +
            '\\nДо 15.10 поимённые блоки пропускали 26 бесконечных анимаций из 38:\\n' +
            'пульс эфира, мерцание отсчёта, спиннер. WCAG 2.3.3.').toBe(0);
        expect(м.переходов,
            'переходы не погашены: ' + м.переходов).toBe(0);
        expect(м.прокрутка,
            'плавная прокрутка осталась включённой: ' + м.прокрутка).toBe('auto');
    });

    test('без просьбы движение остаётся на месте', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'no-preference' });
        await открыть(page, '/index' + язык.хвост + '.html', 'header, .site-header, body');
        const м = await page.evaluate(и => eval('(' + и + ')')(), СЧЁТ_ДВИЖЕНИЯ);
        expect(м.узлов, 'ПОРОГ: страница не поднялась').toBeGreaterThan(200);
        expect(м.анимаций + м.переходов,
            'движение пропало у того, кто о нём не просил: анимаций ' + м.анимаций +
            ', переходов ' + м.переходов +
            '\\nГлобальный сброс легко написать так, что он гасит всем подряд.').toBeGreaterThan(50);
    });

    /* УЗЕЛ СОБИРАЕТСЯ, А НЕ БЕРЁТСЯ СО СТРАНИЦЫ. Первая редакция искала
       живую ленту и пропускала проверку, когда её нет: прогон идёт против
       ТЕСТОВОЙ базы, где спонсоров нет вовсе, и все пятнадцать проверок
       ушли в skip. ПРОПУСК НЕ ДОКАЗЫВАЕТ НИЧЕГО, А ВЫГЛЯДИТ КАК УСПЕХ.
       Предмет проверки — каскад, данные ему не нужны. */
    test('лента логотипов остаётся доступной, а не просто встаёт', async ({ page }) => {
        await page.emulateMedia({ reducedMotion: 'reduce' });
        await открыть(page, '/index' + язык.хвост + '.html', 'header, .site-header, body');
        const м = await page.evaluate(() => {
            const гнездо = document.createElement('div');
            гнездо.className = 'sponsors-carousel-infinite';
            гнездо.style.width = '200px';
            гнездо.innerHTML = '<div class="carousel-track-infinite">' +
                '<span style="display:inline-block;width:400px">·</span>' +
                '<span style="display:inline-block;width:400px">·</span></div>';
            document.body.appendChild(гнездо);
            const л = гнездо.querySelector('.carousel-track-infinite');
            const s = getComputedStyle(гнездо);
            const из = { аним: getComputedStyle(л).animationName,
                         прокрутка: s.overflowX, маска: s.maskImage,
                         шире: л.scrollWidth > гнездо.clientWidth };
            гнездо.remove();
            return из;
        });
        expect(м.шире, 'ПОРОГ: лента не шире окна — проба собралась неверно').toBe(true);
        expect(м.аним, 'лента едет при просьбе не двигать: ' + м.аним).toBe('none');
        expect(м.прокрутка,
            'ленту остановили и не дали прокрутить: ' + м.прокрутка +
            '\\nРодитель держит overflow: hidden — логотипы за краем становятся\\n' +
            'недоступны НИКАК. Доступность одного человека не должна прятать\\n' +
            'от него же половину спонсоров. WCAG 1.4.2.').toMatch(/auto|scroll/);
        expect(м.маска, 'маска краёв прячет то, что теперь листают руками').toBe('none');
    });

    test('каждый межстрочный на экране стоит на ступени лестницы', async ({ page }) => {
        await открыть(page, '/pages/tournaments-overview' + язык.хвост + '.html', '.to-card, .to-compact, [class^="to-"]');
        const м = await page.evaluate(() => {
            const СТУПЕНИ = [1, 1.1, 1.3, 1.5, 1.65];
            const мимо = new Map();
            let текстовых = 0;
            document.querySelectorAll('*').forEach(э => {
                if (![...э.childNodes].some(н => н.nodeType === 3 && н.textContent.trim())) return;
                const r = э.getBoundingClientRect();
                if (!r.width || !r.height) return;
                const s = getComputedStyle(э);
                const кг = parseFloat(s.fontSize);
                /* КЕГЛЬ 0 — ПРИЁМ ГАШЕНИЯ, А НЕ УРОВЕНЬ: полную подпись гасят
                   нулём и печатают короткую через ::after. */
                if (!кг) return;
                if (s.lineHeight === 'normal') return;
                текстовых++;
                const мс = +(parseFloat(s.lineHeight) / кг).toFixed(3);
                if (СТУПЕНИ.some(с => Math.abs(с - мс) < 0.005)) return;
                const к = кг + 'px/' + s.fontWeight + ' → ' + мс;
                мимо.set(к, (мимо.get(к) || 0) + 1);
            });
            return { текстовых, мимо: [...мимо.entries()].map(([к, n]) => к + ' ×' + n) };
        });
        expect(м.текстовых, 'ПОРОГ: текстовых узлов не нашлось').toBeGreaterThan(50);
        expect(м.мимо.join('\n'),
            'межстрочные мимо лестницы 1 · 1.1 · 1.3 · 1.5 · 1.65:\\n' + м.мимо.join('\\n') +
            '\\nСтупень выбирается по УРОВНЮ ТЕКСТА, а не подгонкой высоты блока.').toBe('');
    });

});

}
