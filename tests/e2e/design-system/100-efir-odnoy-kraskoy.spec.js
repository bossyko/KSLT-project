/**
 * ЭФИР ОДНОЙ КРАСКОЙ. 15.10, ветка B, заход B3, круг 2, подкруг 2б.
 *
 * Замер: эфир красился ЧЕТЫРЬМЯ способами — `#FF3B30` в шапке, `#ef4444`
 * на странице турнира, ЗЕЛЁНЫЙ градиент на карточке турнира и лайм в
 * обзоре баттлов. Один и тот же живой матч человек видел зелёным на
 * карточке и красным в шапке. 30 правок.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ЭФИР ГОВОРИТ ОДНОЙ КРАСКОЙ НА ЭКРАНЕ, после всего каскада.
 *     Правило смотрит в блок по селектору; что у всех узлов роли вышла
 *     ОДНА краска, показывает только загрузка;
 *   • КОНТРАСТ ЗНАЧКА «ИДЁТ СЕЙЧАС» на фактической заливке. Белый на
 *     `#FF4757` даёт 3.34 при норме 4.5 — белым текст тут быть не может,
 *     и это видно только расчётом по снятым краскам;
 *   • ЧТО «ГОЛОСОВАНИЕ» НЕ СТАЛО ТРЕВОГОЙ. `.bo-strip-live` назван
 *     `live`, а показывает слово «Голосование» — имя класса врёт о
 *     смысле, и следующий, кто пойдёт «причёсывать эфир», найдёт его по
 *     имени. На экране он обязан остаться лаймовым.
 *
 * УЗЛЫ СОБИРАЮТСЯ, А НЕ БЕРУТСЯ СО СТРАНИЦЫ: прогон работает против
 * ТЕСТОВОЙ базы, где живых турниров в эфире нет. Предмет проверки —
 * КАСКАД, какой краской css красит роль, и данные для этого не нужны.
 * Сверено с боевой базой 15.10.
 *
 * ПОРОГ: css не загрузился — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

const DANGER = 'rgb(255, 71, 87)';
const DANGER_ON = 'rgb(10, 10, 10)';
const ACCENT = 'rgb(204, 255, 0)';

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

for (const язык of ЯЗЫКИ) {

test.describe('эфир одной краской · ' + язык.код, () => {

    test('значок «идёт сейчас» плоский, тёмным по красному', async ({ page }) => {
        await открыть(page, '/pages/tournaments' + язык.хвост + '.html', '.trn-block, .to-compact, .trn-block-empty');
        const м = await page.evaluate(() => {
            const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
            const ярк = ([r, g, b]) => 0.2126 * лин(r) + 0.7152 * лин(g) + 0.0722 * лин(b);
            const K = (a, b) => { const x = Math.max(ярк(a), ярк(b)), y = Math.min(ярк(a), ярк(b)); return (x + 0.05) / (y + 0.05); };
            const чис = s => (String(s).match(/\d+/g) || []).slice(0, 3).map(Number);
            let э = document.querySelector('.to-cd-live');
            let гнездо = null;
            if (!э) {
                гнездо = document.createElement('div');
                гнездо.innerHTML = '<span class="to-cd to-cd-live"><span class="to-cd-dot"></span>ИДЁТ СЕЙЧАС</span>';
                document.body.appendChild(гнездо);
                э = гнездо.querySelector('.to-cd-live');
            }
            const s = getComputedStyle(э);
            const точка = э.querySelector('.to-cd-dot');
            const из = { фон: s.backgroundColor, цвет: s.color, градиент: s.backgroundImage,
                         точка: точка ? getComputedStyle(точка).backgroundColor : null,
                         контраст: Math.round(K(чис(s.color), чис(s.backgroundColor)) * 100) / 100,
                         собран: !!гнездо };
            if (гнездо) гнездо.remove();
            return из;
        });
        expect(м.фон, 'ПОРОГ: css не загрузился — заливка пуста').not.toBe('rgba(0, 0, 0, 0)');
        expect(м.фон, 'значок «идёт сейчас» залит не системным красным: ' + м.фон).toBe(DANGER);
        expect(м.цвет, 'текст значка не почти-чёрный: ' + м.цвет +
            '\nБелый на #FF4757 даёт 3.34 при норме 4.5 — белым он быть не может.').toBe(DANGER_ON);
        expect(м.градиент,
            'значку вернули градиент. ЭТО РЕШЕНИЕ ГЛАЗ: градиентный вариант проходит\n' +
            'AA (4.97), но встаёт рядом с отсчётом `.to-cd`, который тоже красный и\n' +
            'тоже градиентный — два значка схлопываются в один вид.').toBe('none');
        expect(м.точка, 'точка значка не почти-чёрная: ' + м.точка).toBe(DANGER_ON);
        expect(м.контраст, 'значок «идёт сейчас» не проходит AA: ' + JSON.stringify(м)).toBeGreaterThanOrEqual(4.5);
    });

    test('эфир в шапке и на странице турнира — одна краска', async ({ page }) => {
        await открыть(page, '/pages/tournament' + язык.хвост + '.html', 'header, .site-header, body');
        const м = await page.evaluate(() => {
            const гнездо = document.createElement('div');
            гнездо.innerHTML =
                '<span class="live-dot"></span>' +
                '<span class="live-indicator"></span>' +
                '<span class="trn-live-dot"></span>' +
                '<span class="td-status-pill live">LIVE</span>' +
                '<span class="td-match-score live-score">6:4</span>';
            document.body.appendChild(гнездо);
            const краски = {};
            гнездо.querySelectorAll('span').forEach(э => {
                const s = getComputedStyle(э);
                const к = (э.textContent || '').trim() ? s.color : s.backgroundColor;
                краски[к] = (краски[к] || 0) + 1;
            });
            const из = { краски, узлов: гнездо.querySelectorAll('span').length };
            гнездо.remove();
            return из;
        });
        expect(м.узлов, 'ПОРОГ: узлы не собрались').toBe(5);
        expect(Object.keys(м.краски),
            'эфир говорит НЕСКОЛЬКИМИ красками: ' + JSON.stringify(м.краски) +
            '\nДо 15.10 их было четыре, и один живой матч виделся зелёным на карточке\n' +
            'турнира и красным в шапке.').toHaveLength(1);
        expect(Object.keys(м.краски)[0], 'эфир говорит не системным красным').toBe(DANGER);
    });

    test('«голосование» осталось лаймовым, а не стало тревогой', async ({ page }) => {
        await открыть(page, '/pages/battles-overview' + язык.хвост + '.html', '.bo-strip, .bo-block, body');
        const м = await page.evaluate(() => {
            let э = document.querySelector('.bo-strip-live');
            let гнездо = null;
            if (!э) {
                гнездо = document.createElement('div');
                гнездо.innerHTML = '<span class="bo-strip-badge bo-strip-live">Голосование</span>';
                document.body.appendChild(гнездо);
                э = гнездо.querySelector('.bo-strip-live');
            }
            const s = getComputedStyle(э);
            const из = { цвет: s.color, фон: s.backgroundColor, собран: !!гнездо };
            if (гнездо) гнездо.remove();
            return из;
        });
        expect(м.цвет, 'ПОРОГ: css не загрузился').not.toBe('rgba(0, 0, 0, 0)');
        expect(м.цвет,
            'значок «Голосование» покрашен как эфир: ' + м.цвет + '\n' +
            'Класс назван `live`, но показывает слово «Голосование»\n' +
            '(js/battles-overview.js:576). Покрасить его в danger значит объявить\n' +
            'голосование тревогой.').toBe(ACCENT);
    });

});

}
