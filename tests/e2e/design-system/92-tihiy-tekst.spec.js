/**
 * ТИХИЙ ТЕКСТ ПРОХОДИТ AA. 13.10, кусок 73-й.
 *
 * Решение Кости 06.10: «тихих уровней текста ТРИ: --text-dim уходит из
 * текста». Замер 13.10 нашёл его в 220 местах, из них 206 — цвет текста,
 * контраст 3.14-3.21 при норме AA 4.5. Переведено 215 мест; осталось
 * четыре неактивных и одна иконка.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. Заморозка видит имя токена;
 *     цвет, альфу и фон под ним даёт только страница;
 *   • КОНТРАСТ СЧИТАЕТСЯ ПО ЖИВЫМ ПИКСЕЛЯМ. Фон у текста может прийти от
 *     любого предка, а не от того, что написано рядом;
 *   • ЧТО ЭТО ВИДИМЫЙ ТЕКСТ. Скрытое и пустое к порогу не относится;
 *   • ЧТО НЕАКТИВНОЕ ОСТАЛОСЬ НЕАКТИВНЫМ. WCAG 1.4.3 освобождает только
 *     его — и только там тихому уровню позволено быть ниже порога.
 *
 * ПОРОГ: нет текстовых узлов — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const СТРАНИЦЫ = [
    '/index.html',
    '/pages/players.html',
    '/pages/news.html',
    '/pages/courts.html',
    '/pages/coaches.html',
    '/pages/services.html',
    '/pages/partners.html',
    '/pages/tournaments.html',
    '/pages/tournaments-overview.html',
    '/pages/info.html',
    '/pages/sponsors.html',
    '/pages/pricing.html'
];

/* Считаем ровно по WCAG 2.1: относительная яркость и (L1+0.05)/(L2+0.05).
   Крупным считается текст от 24px, или от 18.66px при весе 700 и выше —
   ему хватает 3.0. */
const СЧЁТ = `() => {
    const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const ярк = ([r, g, b]) => 0.2126 * лин(r) + 0.7152 * лин(g) + 0.0722 * лин(b);
    const разбор = s => {
        const м = (s || '').match(/rgba?\\(([^)]+)\\)/);
        if (!м) return null;
        const ч = м[1].split(',').map(x => parseFloat(x));
        return { c: [ч[0], ч[1], ч[2]], a: ч.length > 3 ? ч[3] : 1 };
    };
    /* ФОН СКЛАДЫВАЕТСЯ ИЗ СЛОЁВ, А НЕ БЕРЁТСЯ ПЕРВЫЙ ПОПАВШИЙСЯ. Прибор,
       считавший первый непрозрачный цвет сплошным, объявил белые инициалы
       на подложке 8% контрастом 1.0 — подложка полупрозрачная, под ней
       тёмная страница, и настоящее число 14.1. Идём вверх, копим слои и
       складываем их снизу вверх.
       КАРТИНКА ИЛИ ГРАДИЕНТ НА ПУТИ — УЗЕЛ НЕ МЕРИТСЯ: одним числом такой
       фон не описать, а число, которого не померить, не выдумывается. */
    const фонПод = э => {
        const слои = [];
        let у = э;
        while (у) {
            const с = getComputedStyle(у);
            if (с.backgroundImage && с.backgroundImage !== 'none') return null;
            const ф = разбор(с.backgroundColor);
            if (ф && ф.a > 0) { слои.push(ф); if (ф.a >= 0.999) break; }
            у = у.parentElement;
        }
        let фон = [10, 10, 10];
        for (let i = слои.length - 1; i >= 0; i--)
            фон = слои[i].c.map((c, j) => c * слои[i].a + фон[j] * (1 - слои[i].a));
        return фон;
    };
    const поверх = (ц, a, фон) => ц.map((c, i) => c * a + фон[i] * (1 - a));
    const видим = э => {
        const с = getComputedStyle(э);
        if (с.display === 'none' || с.visibility === 'hidden' || parseFloat(с.opacity) === 0) return false;
        const к = э.getBoundingClientRect();
        return к.width > 0 && к.height > 0;
    };
    const свой = э => [...э.childNodes]
        .some(у => у.nodeType === 3 && у.textContent.trim().length > 1);

    const плохие = [];
    let узлов = 0, неМерено = 0;
    [...document.querySelectorAll('body *')].forEach(э => {
        if (!свой(э) || !видим(э)) return;
        /* WCAG 1.4.3: неактивное из порога исключено. */
        if (э.disabled || э.closest('[disabled]') || э.getAttribute('aria-disabled') === 'true') return;
        const с = getComputedStyle(э);
        const цв = разбор(с.color);
        if (!цв) return;
        const фон = фонПод(э);
        if (!фон) { неМерено++; return; }
        узлов++;
        const пер = поверх(цв.c, цв.a, фон);
        const l1 = ярк(пер), l2 = ярк(фон);
        const к = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
        const кегль = parseFloat(с.fontSize);
        const вес = parseInt(с.fontWeight, 10) || 400;
        const порог = (кегль >= 24 || (кегль >= 18.66 && вес >= 700)) ? 3 : 4.5;
        if (к < порог) плохие.push({
            тег: э.tagName, класс: (э.className || '').toString().slice(0, 40),
            кегль: Math.round(кегль), вес: вес,
            цвет: с.color, контраст: Math.round(к * 100) / 100, порог: порог,
            текст: (э.textContent || '').trim().slice(0, 28)
        });
    });
    return { узлов, неМерено, плохих: плохие.length, примеры: плохие.slice(0, 6) };
}`;

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(500);
}

for (const адрес of СТРАНИЦЫ) {
test('контраст текста проходит AA · ' + адрес.split('/').pop(), async ({ page }) => {
    await открыть(page, адрес);
    const р = await page.evaluate(код => eval('(' + код + ')')(), СЧЁТ);
    expect(р.узлов, 'ПОРОГ: текстовых узлов нет — мерить нечего').toBeGreaterThan(10);
    expect(р.плохих, 'текст ниже порога WCAG AA: ' + JSON.stringify(р.примеры)).toBe(0);
});
}

test('тихий уровень в браузере даёт не меньше 4.5', async ({ page }) => {
    await открыть(page, '/pages/players.html');
    const р = await page.evaluate(() => {
        const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
        const ярк = ([r, g, b]) => 0.2126 * лин(r) + 0.7152 * лин(g) + 0.0722 * лин(b);
        const кор = getComputedStyle(document.documentElement);
        const разбор = s => {
            const м = (s || '').match(/rgba?\(([^)]+)\)/);
            if (!м) return null;
            const ч = м[1].split(',').map(x => parseFloat(x));
            return { c: [ч[0], ч[1], ч[2]], a: ч.length > 3 ? ч[3] : 1 };
        };
        const фон = разбор(кор.getPropertyValue('--bg-base')) || { c: [10, 10, 10], a: 1 };
        const о = {};
        ['--text-dim', '--text-muted', '--text-secondary'].forEach(т => {
            const ц = разбор(кор.getPropertyValue(т));
            if (!ц) return;
            const пер = ц.c.map((c, i) => c * ц.a + фон.c[i] * (1 - ц.a));
            const l1 = ярк(пер), l2 = ярк(фон.c);
            о[т] = Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
        });
        return о;
    });
    expect(р['--text-muted'], 'тихий уровень мимо AA: ' + JSON.stringify(р)).toBeGreaterThanOrEqual(4.5);
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: три уровня идут по возрастанию. */
    expect(р['--text-dim'], 'лестница сломалась: ' + JSON.stringify(р))
        .toBeLessThan(р['--text-muted']);
    expect(р['--text-muted'], 'лестница сломалась: ' + JSON.stringify(р))
        .toBeLessThan(р['--text-secondary']);
});
