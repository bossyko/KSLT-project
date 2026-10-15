/**
 * ОТСЧЁТ — ОЖИДАНИЕ, А НЕ ТРЕВОГА. 15.10, ветка B, заход B3, круг 2,
 * подкруг 2г.
 *
 * Замер: отсчёт был определён дважды — красная плашка на карточках
 * против нейтральной с акцентными цифрами на странице турнира. Красная
 * давала обычному 5.69, срочному 4.09 (НИЖЕ нормы AA 4.5), а разницу
 * между ними 1.39: самое срочное читалось хуже обычного, градации не
 * было вовсе.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • КОНТРАСТ ОБОИХ СОСТОЯНИЙ на фактической подложке. У срочного фон —
 *     тинт той же краски поверх карточки, и сложить слои может только
 *     браузер. Правило же читает файл и видит имя;
 *   • ЧТО ГРАДАЦИЯ РАБОТАЕТ: обычное и срочное обязаны отличаться не
 *     только текстом. Померено до: 1.39 — почти неотличимы;
 *   • ЧТО СКИДКА ГОВОРИТ ЛАЙМОМ НА ЭКРАНЕ, после всего каскада.
 *
 * УЗЛЫ СОБИРАЮТСЯ, А НЕ БЕРУТСЯ СО СТРАНИЦЫ: прогон идёт против тестовой
 * базы, где турниров с отсчётом и кортов со скидкой может не быть вовсе.
 * Предмет проверки — каскад, данные ему не нужны.
 *
 * ПОРОГ: css не загрузился — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

const ACCENT = 'rgb(204, 255, 0)';
const DANGER = 'rgb(255, 71, 87)';

/** Контраст с фактической подложкой: слои складываются снизу вверх. */
const МЕРА = `(э, W) => {
    const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const ярк = ([r, g, b]) => 0.2126 * лин(r) + 0.7152 * лин(g) + 0.0722 * лин(b);
    const K = (a, b) => { const x = Math.max(ярк(a), ярк(b)), y = Math.min(ярк(a), ярк(b)); return (x + 0.05) / (y + 0.05); };
    const разбор = s => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
        const ч = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
        return { rgb: ч.slice(0, 3), a: ч.length > 3 ? ч[3] : 1 }; };
    const поверх = (в, н, a) => в.map((v, i) => Math.round(v * a + н[i] * (1 - a)));
    const слои = [];
    for (let у = э; у; у = у.parentElement) {
        const ц = разбор(W.getComputedStyle(у).backgroundColor);
        if (ц && ц.a > 0) { слои.push(ц); if (ц.a >= 0.999) break; }
        if (у === document.documentElement) break;
    }
    let низ = [10, 10, 10];
    for (let i = слои.length - 1; i >= 0; i--) низ = поверх(слои[i].rgb, низ, слои[i].a);
    const s = W.getComputedStyle(э);
    const ц = разбор(s.color);
    const свой = ц.a < 0.999 ? поверх(ц.rgb, низ, ц.a) : ц.rgb;
    return { контраст: Math.round(K(свой, низ) * 100) / 100, цвет: s.color, подложка: низ,
             кегль: parseFloat(s.fontSize), вес: s.fontWeight, слоёв: слои.length };
}`;

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

for (const язык of ЯЗЫКИ) {

test.describe('отсчёт — ожидание · ' + язык.код, () => {

    test('обычный и срочный проходят AA и различимы', async ({ page }) => {
        await открыть(page, '/pages/tournaments' + язык.хвост + '.html', '.trn-block, .to-compact, .trn-block-empty');
        const м = await page.evaluate(мераИсх => {
            const мера = eval('(' + мераИсх + ')');
            const гнездо = document.createElement('div');
            гнездо.innerHTML =
                '<span class="to-cd" id="об"><span>2</span><small>д</small></span>' +
                '<span class="to-cd to-cd-urgent" id="ср"><span>48</span><small>м</small></span>';
            document.body.appendChild(гнездо);
            const об = мера(гнездо.querySelector('#об'), window);
            const ср = мера(гнездо.querySelector('#ср'), window);
            гнездо.remove();
            return { об, ср };
        }, МЕРА);
        expect(м.об.слоёв, 'ПОРОГ: подложка не собралась — css не загрузился').toBeGreaterThan(0);
        expect(м.об.цвет, 'обычный отсчёт красится не акцентом: ' + м.об.цвет +
            '\\n«До начала 2 дня» — это ожидание, а не опасность.').toBe(ACCENT);
        expect(м.ср.цвет, 'срочный отсчёт красится не тревогой: ' + м.ср.цвет).toBe(DANGER);
        [['обычный', м.об], ['срочный', м.ср]].forEach(([имя, з]) => {
            const крупный = з.кегль >= 24 || (з.кегль >= 18.66 && +з.вес >= 700);
            expect(з.контраст,
                имя + ' отсчёт не проходит AA: ' + JSON.stringify(з) +
                '\\nДо 15.10 обычный давал 5.69, срочный 4.09 — САМОЕ СРОЧНОЕ читалось\\n' +
                'хуже обычного.').toBeGreaterThanOrEqual(крупный ? 3 : 4.5);
        });
        expect(м.об.цвет === м.ср.цвет,
            'обычный и срочный отсчёт неотличимы по краске — градация не работает.\\n' +
            'До 15.10 разница между ними была 1.39.').toBe(false);
    });

    test('скидка на обложке говорит лаймом', async ({ page }) => {
        await открыть(page, '/pages/courts' + язык.хвост + '.html', '.ct-card, .court-card, .ct-empty, [class^="ct-"]');
        const м = await page.evaluate(() => {
            const гнездо = document.createElement('div');
            гнездо.innerHTML = '<span class="ct-discount-overlay">−20%</span>';
            document.body.appendChild(гнездо);
            const s = getComputedStyle(гнездо.querySelector('.ct-discount-overlay'));
            const из = { фон: s.backgroundColor, цвет: s.color };
            гнездо.remove();
            return из;
        });
        expect(м.фон, 'ПОРОГ: css не загрузился').not.toBe('rgba(0, 0, 0, 0)');
        expect(м.фон,
            'скидка на обложке снова красная: ' + м.фон + '\\n' +
            'ВЫГОДА НЕ ДОЛЖНА ВЫГЛЯДЕТЬ ТРЕВОГОЙ. Лаймовой скидка сказана в шести\\n' +
            'местах, красной была только на трёх обложках.').toBe(ACCENT);
    });

});

}
