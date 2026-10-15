/**
 * СТОРОНА ИГРОКА — ОДНО ОПРЕДЕЛЕНИЕ. 15.10, ветка B, заход B3, круг 2,
 * подкруг 2в.
 *
 * Замер: понятие «сторона игрока» было определено ДВАЖДЫ — баттлы,
 * обзор баттлов и страница вызова красили стороны красным `#DC2828` и
 * синим `#2563EB`, а табло матча и судейское окно токенами `--player-1`
 * и `--player-2`. Один и тот же игрок на табло голубой, в баттле
 * красный. 22 правки.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ОБЕ СТОРОНЫ ГОВОРЯТ ОДНИМ ТОКЕНОМ НА ЭКРАНЕ, после всего
 *     каскада: правило смотрит в блок по селектору, а что на живой
 *     странице у полосы, процента и кнопки вышла ОДНА краска на сторону,
 *     показывает только загрузка;
 *   • КОНТРАСТ ПРОЦЕНТОВ. Это ТЕКСТ на почти-чёрном, и тёмной краской он
 *     быть не может: померено 15.10, `#B91C1C` давал 3.06, `#1D4ED8` —
 *     2.95 при норме AA 4.5. Четыре места были ниже нормы, включая текст
 *     выбранной кнопки на своём тинте (2.69);
 *   • ЧТО СТОРОНЫ РАЗЛИЧИМЫ МЕЖДУ СОБОЙ. Две краски одной светлоты и
 *     насыщенности различает ТОН, а не контраст: контраст между ними
 *     1.65, и по нему сказать ничего нельзя. Прогон считает тон обеих и
 *     требует, чтобы они расходились.
 *
 * УЗЛЫ СОБИРАЮТСЯ, А НЕ БЕРУТСЯ СО СТРАНИЦЫ: прогон работает против
 * ТЕСТОВОЙ базы, где баттлов ноль (померено ещё в куске 66). Предмет
 * проверки — каскад, и данные ему не нужны.
 *
 * ПОРОГ: css не загрузился — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

const P1 = 'rgb(79, 195, 247)';
const P2 = 'rgb(208, 80, 247)';

/** Тон краски в градусах — им различаются стороны, а не контрастом. */
const ТОН = `(s) => {
    const m = String(s).match(/\\d+/g);
    if (!m) return null;
    const [r, g, b] = m.slice(0, 3).map(Number).map(v => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    if (mx - mn < 0.12) return null;
    const d = mx - mn;
    let H = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? ((b - r) / d + 2) : ((r - g) / d + 4);
    return Math.round(H * 60);
}`;

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

for (const язык of ЯЗЫКИ) {

test.describe('сторона игрока · ' + язык.код, () => {

    test('обе стороны говорят своим токеном', async ({ page }) => {
        await открыть(page, язык.код === 'ru' ? '/index.html' : '/index' + язык.хвост + '.html',
                      '.vn-four .court-card, .vn-four .coach-card');
        const м = await page.evaluate(() => {
            const гнездо = document.createElement('div');
            гнездо.innerHTML =
                '<div class="bc-vote-bar"><div class="bc-bar-p1"></div><div class="bc-bar-p2"></div></div>' +
                '<span class="bc-pct bc-pct-p1">62%</span><span class="bc-pct bc-pct-p2">38%</span>' +
                '<button class="bc-vote-btn bc-vote-btn-p1 bc-vote-selected">За первого</button>' +
                '<button class="bc-vote-btn bc-vote-btn-p2 bc-vote-selected">За второго</button>';
            document.body.appendChild(гнездо);
            const кр = э => {
                const s = getComputedStyle(э);
                return (э.textContent || '').trim() ? s.color : s.backgroundColor;
            };
            const п1 = [...гнездо.querySelectorAll('.bc-bar-p1, .bc-pct-p1, .bc-vote-btn-p1')].map(кр);
            const п2 = [...гнездо.querySelectorAll('.bc-bar-p2, .bc-pct-p2, .bc-vote-btn-p2')].map(кр);
            гнездо.remove();
            return { п1, п2 };
        });
        expect(м.п1.length, 'ПОРОГ: узлы первой стороны не собрались').toBe(3);
        expect(м.п2.length, 'ПОРОГ: узлы второй стороны не собрались').toBe(3);
        expect([...new Set(м.п1)],
            'первая сторона говорит НЕСКОЛЬКИМИ красками: ' + JSON.stringify(м.п1) +
            '\\nДо 15.10 полоса была #DC2828, процент #B91C1C, кнопка #B91C1C — ' +
            'три оттенка на одно понятие.').toHaveLength(1);
        expect([...new Set(м.п2)], 'вторая сторона говорит несколькими красками: ' + JSON.stringify(м.п2)).toHaveLength(1);
        expect(м.п1[0], 'первая сторона красится не своим токеном').toBe(P1);
        expect(м.п2[0], 'вторая сторона красится не своим токеном').toBe(P2);
    });

    test('проценты голосования проходят AA на тёмном', async ({ page }) => {
        await открыть(page, язык.код === 'ru' ? '/index.html' : '/index' + язык.хвост + '.html',
                      '.vn-four .court-card, .vn-four .coach-card');
        const м = await page.evaluate(() => {
            const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
            const ярк = ([r, g, b]) => 0.2126 * лин(r) + 0.7152 * лин(g) + 0.0722 * лин(b);
            const K = (a, b) => { const x = Math.max(ярк(a), ярк(b)), y = Math.min(ярк(a), ярк(b)); return (x + 0.05) / (y + 0.05); };
            const чис = s => (String(s).match(/\d+/g) || []).slice(0, 3).map(Number);
            const гнездо = document.createElement('div');
            гнездо.innerHTML = '<span class="bc-pct bc-pct-p1">62%</span><span class="bc-pct bc-pct-p2">38%</span>';
            document.body.appendChild(гнездо);
            const фон = чис(getComputedStyle(document.body).backgroundColor) || [10, 10, 10];
            const из = [...гнездо.querySelectorAll('span')].map(э => {
                const s = getComputedStyle(э);
                return { цвет: s.color, кегль: parseFloat(s.fontSize), вес: s.fontWeight,
                         контраст: Math.round(K(чис(s.color), фон) * 100) / 100 };
            });
            гнездо.remove();
            return { из, фон };
        });
        expect(м.из.length, 'ПОРОГ: проценты не собрались').toBe(2);
        м.из.forEach(п => {
            const крупный = п.кегль >= 24 || (п.кегль >= 18.66 && +п.вес >= 700);
            expect(п.контраст,
                'процент голосования не проходит AA: ' + JSON.stringify(п) +
                '\\nДо 15.10 здесь было 3.06 и 2.95: тёмно-красный и тёмно-синий ТЕКСТОМ\\n' +
                'на почти-чёрном фоне.').toBeGreaterThanOrEqual(крупный ? 3 : 4.5);
        });
    });

    test('стороны различимы между собой по тону', async ({ page }) => {
        await открыть(page, язык.код === 'ru' ? '/index.html' : '/index' + язык.хвост + '.html',
                      '.vn-four .court-card, .vn-four .coach-card');
        const м = await page.evaluate(тонИсх => {
            const тон = eval('(' + тонИсх + ')');
            const к = getComputedStyle(document.documentElement);
            const p1 = к.getPropertyValue('--player-1').trim();
            const p2 = к.getPropertyValue('--player-2').trim();
            const hex2rgb = h => { h = h.replace('#', ''); return 'rgb(' + [0, 2, 4].map(i => parseInt(h.slice(i, i + 2), 16)).join(', ') + ')'; };
            const t1 = тон(/^#/.test(p1) ? hex2rgb(p1) : p1);
            const t2 = тон(/^#/.test(p2) ? hex2rgb(p2) : p2);
            const d = t1 === null || t2 === null ? null : (() => { const x = Math.abs(t1 - t2) % 360; return x > 180 ? 360 - x : x; })();
            return { p1, p2, t1, t2, расстояние: d };
        }, ТОН);
        expect(м.p1, 'ПОРОГ: токен первой стороны не виден на странице').toBeTruthy();
        expect(м.p2, 'ПОРОГ: токен второй стороны не виден на странице').toBeTruthy();
        expect(м.расстояние,
            'стороны слишком близки по тону и читаются как оттенки одной: ' + JSON.stringify(м) +
            '\\nРазличает их ТОН, а не контраст: контраст между ними 1.65, и по нему\\n' +
            'сказать нельзя ничего.').toBeGreaterThanOrEqual(40);
    });

});

}
