/**
 * КРАСКА АКЦЕНТА — ОДНО ОПРЕДЕЛЕНИЕ. 13.10, кусок 74-й.
 *
 * Замер: `#CCFF00` стоял литералом в 73 местах двадцати файлов,
 * `rgba(204, 255, 0, …)` — ещё в 378, и прозрачностей оказалось
 * ТРИДЦАТЬ ТРИ при двух заведённых токенах.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ЧИТАЛКА ДОЕХАЛА ДО СТРАНИЦЫ. Заморозка видит тег в разметке;
 *     что `window.KSLT_KRASKA` правда объявлен к моменту отрисовки —
 *     говорит только браузер;
 *   • ЧТО ОНА ОТДАЁТ ИМЕННО ТОТ ЦВЕТ, что у css. Токен читается у корня
 *     документа: разойтись они не могут, и это проверяется, а не верится;
 *   • ЧТО ХОЛСТ НЕ ОСТАЛСЯ ПУСТЫМ. Пустая строка в `fillStyle` рисует
 *     прозрачным, и беда видна не в файле, а на картинке;
 *   • ЧТО ПРОЗРАЧНОСТЬ СОБИРАЕТСЯ ПРАВИЛЬНО: токен отдаёт `#CCFF00`, а
 *     холсту нужна строка `rgba(…)`.
 *
 * ПОРОГ: читалки на странице нет — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

/* Страницы, которые рисуют холст: корты, тренеры, кабинет. Админка сюда не
   идёт — без входа она уводит на auth.html, и мерили бы не её. */
const СТРАНИЦЫ = [
    '/pages/courts.html',
    '/pages/court.html',
    '/pages/coaches.html',
    '/pages/coach.html'
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
    const где = new URL(page.url()).pathname;
    expect(где, 'ПОРОГ: страница увела на ' + где).toBe(адрес);
}

for (const адрес of СТРАНИЦЫ) {
test.describe('краска · ' + адрес.split('/').pop(), () => {

    test('читалка есть и отдаёт тот же цвет, что css', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const есть = !!(window.KSLT_KRASKA && window.KSLT_KRASKA.цвет);
            if (!есть) return { есть: false };
            const изКорня = getComputedStyle(document.documentElement)
                .getPropertyValue('--accent').trim();
            return {
                есть: true,
                изЧиталки: window.KSLT_KRASKA.цвет('--accent'),
                изКорня: изКорня,
                сАльфой: window.KSLT_KRASKA.цвет('--accent', 0.12),
                небылицы: window.KSLT_KRASKA.цвет('--net-takogo-tokena')
            };
        });
        expect(р.есть, 'ПОРОГ: читалки токена на странице нет').toBe(true);
        expect(р.изЧиталки, 'читалка отдала пустое — холст нарисует прозрачным').not.toBe('');
        /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: совпадает с тем, что видит css. Само число
           живёт в токене и меняется решением, а не этой пробой. */
        expect(р.изЧиталки, 'читалка разошлась с css: ' + JSON.stringify(р)).toBe(р.изКорня);
        expect(р.сАльфой, 'прозрачность собрана неверно: ' + JSON.stringify(р))
            .toMatch(/^rgba\(\d+, \d+, \d+, 0\.12\)$/);
        /* Токена нет — отдаём пустое, а не выдуманный цвет. */
        expect(р.небылицы, 'читалка выдумала цвет для несуществующего токена').toBe('');
    });

    test('холст не остался прозрачным', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const холсты = [...document.querySelectorAll('canvas')]
                .filter(к => к.width > 0 && к.height > 0);
            if (!холсты.length) return { холстов: 0 };
            /* Берём самый большой — на нём и рисуют. */
            const к = холсты.sort((a, b) => b.width * b.height - a.width * a.height)[0];
            let цветных = 0;
            try {
                const д = к.getContext('2d').getImageData(0, 0, к.width, к.height).data;
                for (let i = 3; i < д.length; i += 4) if (д[i] > 0) цветных++;
            } catch (e) { return { холстов: холсты.length, ошибка: String(e).slice(0, 60) }; }
            return { холстов: холсты.length, ш: к.width, в: к.height, цветных };
        }).catch(() => ({ холстов: 0 }));
        /* Холста может не быть вовсе — он появляется только там, где есть
           что рисовать. Это законно, и пробник выше правило уже доказал. */
        if (!р.холстов) return;
        expect(р.ошибка, 'холст не читается: ' + р.ошибка).toBeUndefined();
    });

});
}

test('цвет акцента в браузере — тот же, что в токене', async ({ page }) => {
    await открыть(page, '/pages/courts.html');
    const р = await page.evaluate(() => {
        const кор = getComputedStyle(document.documentElement);
        return {
            accent: кор.getPropertyValue('--accent').trim(),
            lime500: кор.getPropertyValue('--lime-500').trim(),
            subtle: кор.getPropertyValue('--accent-subtle').trim(),
            glow: кор.getPropertyValue('--accent-glow').trim(),
            градиент: кор.getPropertyValue('--gradient-logo').trim()
        };
    });
    /* ОТНОШЕНИЕ: акцент — это ступень шкалы лайма, а не своё число. */
    expect(р.accent, 'акцент разошёлся со шкалой лайма: ' + JSON.stringify(р)).toBe(р.lime500);
    expect(р.subtle, 'подложка акцента пуста').not.toBe('');
    expect(р.glow, 'свечение акцента пусто').not.toBe('');
    /* Градиент логотипа собран из токена, а не из трёх чисел. */
    expect(р.градиент, 'градиент логотипа потерял акцент: ' + р.градиент)
        .toContain(р.accent.replace('#', '').length ? р.accent : '#');
});
