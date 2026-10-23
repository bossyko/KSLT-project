/**
 * ЛЕСТНИЦА ПРОЗРАЧНОСТИ. 15.10, ветка B, заход B3, круг 3.
 *
 * Замер 15.10: 632 прозрачных места в публичном css вне tokens.css и 43
 * разные альфы при шести ступенях на белый и шести на чёрный. Белую
 * границу звали пятнадцатью числами на 83 места, чёрную подложку —
 * девятнадцатью. Прозрачный текст стоял на десяти уровнях от 0.25 до 0.9,
 * и десять мест читались ниже AA: 0.25 давало 2.14, 0.40 — 3.77.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • КОНТРАСТ НА ФАКТИЧЕСКОЙ ПОДЛОЖКЕ. Правило читает файл и видит имя;
 *     сложить тинт на карточке на карточке на фоне страницы может только
 *     браузер. Прозрачный текст на прозрачной подложке — ровно тот случай,
 *     где «посчитано по формуле» и «видно на экране» расходятся;
 *   • ЧТО ПОСЛЕ ВСЕГО КАСКАДА альфа на экране — ступень своей роли, а не
 *     значение, пришедшее из правила, которое перебило токен;
 *   • ЧТО ГРАДАЦИЯ ТИХОГО ТЕКСТА ЖИВАЯ: три уровня обязаны отличаться
 *     друг от друга, иначе лестницы нет, есть одна краска под тремя
 *     именами.
 *
 * УЗЛЫ СОБИРАЮТСЯ, А НЕ БЕРУТСЯ СО СТРАНИЦЫ: прогон идёт против тестовой
 * базы, где ваучеров, скидок и баттлов может не быть вовсе. Предмет
 * проверки — каскад, данные ему не нужны.
 *
 * ВИДЫ ЗАДАЁТ КОНФИГ (пять проектов). Свой перебор видов внутри теста
 * помножил бы набор на двадцать пять.
 *
 * ПОРОГ: css не загрузился — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { код: 'ru', хвост: '' },
    { код: 'en', хвост: '-en' },
    { код: 'kg', хвост: '-kg' }
];

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
    return { контраст: Math.round(K(свой, низ) * 100) / 100, цвет: s.color, альфа: ц.a,
             подложка: низ, кегль: parseFloat(s.fontSize), вес: s.fontWeight, слоёв: слои.length };
}`;

/** Альфа фона и границы узла после каскада. */
const АЛЬФЫ = `(э, W) => {
    const разбор = s => { const m = String(s).match(/rgba?\\(([^)]+)\\)/); if (!m) return null;
        const ч = m[1].split(/[,\\s/]+/).filter(Boolean).map(Number);
        return { rgb: ч.slice(0, 3), a: ч.length > 3 ? ч[3] : 1 }; };
    const s = W.getComputedStyle(э);
    /* ГРАНИЦА БЕРЁТСЯ С ТОЙ СТОРОНЫ, ГДЕ ОНА ЕСТЬ. Сторона без ширины
       отдаёт currentColor, и проба мерила цвет ТЕКСТА вместо границы:
       у .ct-services-row граница снизу, и верх давал 0.72. */
    let грС = null;
    ['Top', 'Bottom', 'Left', 'Right'].forEach(сторона => {
        if (грС) return;
        if (parseFloat(s['border' + сторона + 'Width']) > 0) грС = s['border' + сторона + 'Color'];
    });
    const ф = разбор(s.backgroundColor), г = грС ? разбор(грС) : null;
    const бел = ц => ц && ц.rgb[0] === 255 && ц.rgb[1] === 255 && ц.rgb[2] === 255;
    const чёр = ц => ц && ц.rgb[0] === 0 && ц.rgb[1] === 0 && ц.rgb[2] === 0;
    return { фон: ф && ф.a < 1 && ф.a > 0 && (бел(ф) ? 'белый' : чёр(ф) ? 'чёрный' : null) ? { осн: бел(ф) ? 'белый' : 'чёрный', a: ф.a } : null,
             гран: г && г.a < 1 && г.a > 0 && (бел(г) ? 'белый' : чёр(г) ? 'чёрный' : null) ? { осн: бел(г) ? 'белый' : 'чёрный', a: г.a } : null };
}`;

const ЛЕСТНИЦА = {
    'белый|граница':  [0.04, 0.08, 0.12, 0.20],
    'белый|подложка': [0.04, 0.08, 0.12],
    'чёрный|подложка': [0.20, 0.50, 0.60, 0.85]
};

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 });
    await page.waitForTimeout(400);
}

for (const язык of ЯЗЫКИ) {

test.describe('лестница прозрачности · ' + язык.код, () => {

    test('тихий текст держит AA на фактической подложке', async ({ page }) => {
        await открыть(page, '/pages/coaches' + язык.хвост + '.html', '.co-card, .co-empty, [class^="co-"]');
        const м = await page.evaluate(мераИсх => {
            const мера = eval('(' + мераИсх + ')');
            /* Карточка на карточке: подложка у текста не фон страницы, а
               два прозрачных слоя поверх него. Именно здесь «посчитано по
               формуле» и «видно на экране» расходятся. */
            /* ИМЕНА ВАУЧЕРНОГО ВИДА ПЕРЕИМЕНОВАНЫ КУСКОМ 148: приставки
               `co-`/`ct-` сняты, вид лежит в `css/kslt-vaucher.css`. Со
               старыми именами проба молча мерила бы НЕНАЙДЕННЫЕ правила:
               цвет наследовался бы от карточки, контраст проходил бы, и
               проверка не проверяла бы ничего. */
            const гнездо = document.createElement('div');
            гнездо.className = 'co-card';
            гнездо.innerHTML =
                '<div class="kslt-voucher-history">' +
                  '<div class="kslt-vh-item">' +
                    '<span class="kslt-vh-date" id="дата">12.10.2026</span>' +
                    '<span class="kslt-vh-empty" id="пусто">Ваучеров пока нет</span>' +
                  '</div>' +
                  '<p class="co-discount-hint" id="подсказка">Доступно зарегистрированным</p>' +
                '</div>';
            document.body.appendChild(гнездо);
            const из = {};
            ['дата', 'пусто', 'подсказка'].forEach(id => { из[id] = мера(гнездо.querySelector('#' + id), window); });
            гнездо.remove();
            return из;
        }, МЕРА);
        expect(м.дата.слоёв, 'ПОРОГ: подложка не собралась — css не загрузился').toBeGreaterThan(0);
        Object.keys(м).forEach(имя => {
            const з = м[имя];
            const крупный = з.кегль >= 24 || (з.кегль >= 18.66 && +з.вес >= 700);
            expect(з.контраст,
                'тихий текст «' + имя + '» не проходит AA: ' + JSON.stringify(з) +
                '\\nДо 15.10 здесь стояли числа 0.25 и 0.40 — 2.14 и 3.77 на фоне\\n' +
                'страницы, а на карточке ещё ниже.').toBeGreaterThanOrEqual(крупный ? 3 : 4.5);
        });
    });

    test('тихих уровней три, и они различимы', async ({ page }) => {
        await открыть(page, '/pages/coaches' + язык.хвост + '.html', '.co-card, .co-empty, [class^="co-"]');
        const м = await page.evaluate(() => {
            const к = getComputedStyle(document.documentElement);
            const разбор = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
                const ч = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
                return ч.length > 3 ? ч[3] : 1; };
            /* Токен может быть объявлен цепочкой var() — считаем значение так,
               как его видит браузер, а не как написано в файле. */
            const узел = document.createElement('span');
            document.body.appendChild(узел);
            const знач = имя => { узел.style.color = 'var(' + имя + ')'; return разбор(getComputedStyle(узел).color); };
            const из = {
                secondary: знач('--text-secondary'),
                muted: знач('--text-muted'),
                dim: знач('--text-dim')
            };
            узел.remove();
            return из;
        });
        expect(м.secondary, 'ПОРОГ: токены не прочитались — css не загрузился').toBeTruthy();
        expect(м.secondary > м.muted,
            'вторичный текст не ярче тихого: ' + JSON.stringify(м) +
            '\\nЗАМОРОЖЕНО ОТНОШЕНИЕ, А НЕ ЧИСЛО.').toBe(true);
        expect(м.muted > м.dim,
            'тихий текст не ярче неактивного: ' + JSON.stringify(м)).toBe(true);
    });

    test('подложки и границы стоят на ступенях своей роли', async ({ page }) => {
        await открыть(page, '/pages/courts' + язык.хвост + '.html', '.ct-card, .ct-empty, [class^="ct-"]');
        const м = await page.evaluate(([альфыИсх, лестница]) => {
            const альфы = eval('(' + альфыИсх + ')');
            const гнездо = document.createElement('div');
            гнездо.innerHTML =
                '<div class="ct-card" id="карточка">' +
                  '<div class="ct-services-row" id="строка"></div>' +
                  '<div class="kslt-vh-item" id="ваучер"></div>' +
                '</div>' +
                '<div class="kslt-picker-overlay" id="затемнение"></div>';
            document.body.appendChild(гнездо);
            const из = {};
            ['карточка', 'строка', 'ваучер', 'затемнение'].forEach(id => {
                из[id] = альфы(гнездо.querySelector('#' + id), window);
            });
            гнездо.remove();
            const беды = [];
            Object.keys(из).forEach(имя => {
                const з = из[имя];
                [['подложка', з.фон], ['граница', з.гран]].forEach(([роль, ц]) => {
                    if (!ц) return;
                    const ст = лестница[ц.осн + '|' + роль];
                    if (!ст) return;
                    if (!ст.some(x => Math.abs(x - ц.a) < 0.001))
                        беды.push(имя + ' ' + роль + ' ' + ц.осн + ' ' + ц.a + ' мимо ' + ст.join('·'));
                });
            });
            return { из, беды };
        }, [АЛЬФЫ, ЛЕСТНИЦА]);
        const естьХотьЧто = Object.keys(м.из).some(k => м.из[k].фон || м.из[k].гран);
        expect(естьХотьЧто, 'ПОРОГ: ни одной прозрачной краски — css не загрузился').toBe(true);
        expect(м.беды.join('\n'),
            'на экране есть альфа мимо ступеней своей роли:\\n' + м.беды.join('\\n') +
            '\\nГраница, подложка и текст живут на РАЗНЫХ ступенях.').toBe('');
    });

    /* КАЖДАЯ ПРОБА — НА СТРАНИЦЕ, ГДЕ ЕЁ CSS ПОДКЛЮЧЁН. Собранный узел
       берёт краску из каскада ЭТОЙ страницы: `.bc-player-name` на странице
       услуг отдаёт сплошной белый, потому что battle-cards.css там нет, и
       проба прошла бы мимо своего предмета. */
    test('имя игрока — решение глаз от 15.10', async ({ page }) => {
        await открыть(page, '/pages/tournaments-overview' + язык.хвост + '.html', '.to-card, .bc-card, .to-compact, [class^="to-"]');
        const имя = await page.evaluate(() => {
            const разбор = s => { const m = String(s).match(/rgba?\(([^)]+)\)/); if (!m) return null;
                const ч = m[1].split(/[,\s/]+/).filter(Boolean).map(Number);
                return ч.length > 3 ? ч[3] : 1; };
            const гнездо = document.createElement('div');
            гнездо.innerHTML = '<span class="bc-player-name" id="имя"><span>Костя Хан</span></span>';
            document.body.appendChild(гнездо);
            const из = разбор(getComputedStyle(гнездо.querySelector('#имя')).color);
            гнездо.remove();
            return из;
        });
        expect(имя,
            'имя игрока ушло с решённой ступени: ' + имя +
            '\\nБыло 0.90, 15.10 по снимкам решено 0.72 — вторичный текст.\\n' +
            'Альфа 1 здесь значит, что battle-cards.css не доехал.').toBeCloseTo(0.72, 2);
    });

    test('затемнение героя — решение глаз от 15.10', async ({ page }) => {
        await открыть(page, '/pages/services' + язык.хвост + '.html', '.sv-hero, .sv-card, [class^="sv-"]');
        const герой = await page.evaluate(() => {
            const гнездо = document.createElement('div');
            гнездо.innerHTML = '<div class="sv-hero" style="position:relative"><div class="sv-hero-overlay" id="герой"></div></div>';
            document.body.appendChild(гнездо);
            const из = getComputedStyle(гнездо.querySelector('#герой')).backgroundImage;
            гнездо.remove();
            return из;
        });
        expect(герой, 'ПОРОГ: градиент не собрался — css не загрузился').toContain('linear-gradient');
        expect(герой.includes('rgba(0, 0, 0, 0.5)'),
            'затемнение героя ушло с решённой ступени: ' + герой +
            '\\nБыло 0.35, 15.10 по снимкам решено 0.50 — верх героя.').toBe(true);
    });

});

}
