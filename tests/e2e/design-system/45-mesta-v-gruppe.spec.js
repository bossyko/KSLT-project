// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * МЕСТА В ГРУППЕ И ОТБОР НА СВОБОДНЫЕ МЕСТА — по стенду жеребьёвки.
 *
 * Стенд `maket/setka-zamer.html?r=N` грузит НАСТОЯЩУЮ админку и подменяет
 * только `A.client`. Базы здесь нет, поэтому прогон ничего не пишет и не ест
 * квоту, а разметку рисует тот же `bracket.js`, что и у менеджера.
 *
 * ЯЗЫКОВ ДВА, А НЕ ТРИ. Админка знает ru и en: `constants.js:9` выбирает
 * набор подписей по `-en` в адресе страницы. Киргизского в админке нет вовсе
 * — проверять третий язык значит проверять выдумку. Английский стенд —
 * `setka-zamer-en.html`, символьная ссылка на тот же файл: одно определение,
 * два адреса.
 *
 * ВИДОВ ТРИ, А НЕ ПЯТЬ. Слово Кости: админка — десктоп и планшет, телефонной
 * раскладки в ней нет и не будет. Два телефонных вида пропускаются явно,
 * с причиной, а не молча отфильтрованы.
 *
 * Проверяются РЕШЕНИЯ 29.09, а не числа:
 *   · у кого спора не было — в колонке геймов прочерк;
 *   · у спорных стоит то число, по которому место и решилось, с подписью базы;
 *   · причина места названа словом;
 *   · давший неявку помечен и стоит последним;
 *   · «без доп. матчей» — свободные места не разыгрываются: BYE, а не [X],
 *     и таблицы отбора нет вовсе;
 *   · в карточке доп. матча написан ТОЛЬКО круг.
 */

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

const ЯЗЫКИ = [
    { имя: 'ru', файл: 'setka-zamer.html',    между: 'между равными', неявка: 'в зачёт не берётся',
      жребий: 'жеребьёвка',  встреча: 'личная встреча', геймами: 'по геймам', круг: 'победитель →' },
    { имя: 'en', файл: 'setka-zamer-en.html', между: 'among tied',    неявка: 'not counted',
      жребий: 'by lot',      встреча: 'head-to-head',   геймами: 'on games',  круг: 'winner →' }
];

/* Открыть расклад и вернуть беды страницы. Сетевые отказы не беды: стенд
   грузится без сети наружу, шрифты и карты до неё не дотягиваются. */
async function открыть(page, язык, r) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_/.test(т)) беды.push('console: ' + т);
    });
    await page.goto('/maket/' + язык.файл + '?r=' + r);
    await page.waitForSelector('.ad-grp-matrix', { timeout: 15000 });
    return беды;
}

/* Таблицы ГРУПП — без таблицы отбора: она того же класса, и если её не
   отсечь, «претенденты» посчитаются лишней группой */
const ГРУППЫ = '.ad-grp-matrix:not(.ad-qual-block .ad-grp-matrix)';

async function строкиГрупп(page) {
    return page.evaluate((сел) => {
        const т = n => (n ? n.textContent.replace(/\s+/g, ' ').trim() : '');
        return [...document.querySelectorAll(сел)].map(tb =>
            [...tb.querySelectorAll('tbody tr')].map(tr => ({
                имя: т(tr.querySelectorAll('td')[1]),
                вне: !!tr.querySelector('.ad-badge-out'),
                геймы: т(tr.querySelector('.ad-grp-games')),
                место: т(tr.querySelector('.ad-grp-place')),
                причина: т(tr.querySelector('.ad-grp-place .ad-grp-lot'))
            })));
    }, ГРУППЫ);
}

test.describe('места в группе и отбор — стенд жеребьёвки', () => {
    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет: телефонной раскладки в ней нет (слово Кости 29.09)');
    });

    for (const язык of ЯЗЫКИ) {

        test(язык.имя + ' · r=4 · спора нет — в геймах прочерк, а не числа', async ({ page }) => {
            const беды = await открыть(page, язык, 4);
            expect(беды, беды.join(' | ')).toHaveLength(0);

            const группы = await строкиГрупп(page);
            expect(группы.length).toBe(2);
            for (const группа of группы) {
                expect(группа.length).toBe(4);
                const места = группа.map(с => parseInt(с.место, 10)).sort((a, b) => a - b);
                expect(места).toEqual([1, 2, 3, 4]);
                // Спора не было ни у кого — сравнивать не с чем
                for (const с of группа) expect(с.геймы).toBe('—');
            }
            // Сетка полная: разыгрывать нечего
            await expect(page.locator('.ad-qual-block')).toHaveCount(0);
            await expect(page.locator('.ad-ig-section')).toHaveCount(0);
            expect(await page.content()).not.toContain('[X]');
        });

        test(язык.имя + ' · r=9 · у спорных число с подписью базы и причина словом', async ({ page }) => {
            const беды = await открыть(page, язык, 9);
            expect(беды, беды.join(' | ')).toHaveLength(0);

            const группы = await строкиГрупп(page);
            let спорных = 0;
            for (const группа of группы) {
                // Первое место определилось само — у него прочерк
                const первый = группа.find(с => с.место.indexOf('1') === 0);
                expect(первый.геймы).toBe('—');
                for (const с of группа) {
                    if (с.геймы === '—') continue;
                    спорных++;
                    // Число — и подпись, по чему считали
                    expect(с.геймы).toMatch(/^\d+-\d+/);
                    expect(с.геймы).toContain(язык.между);
                    // Порядок объяснён словом, а не молчанием
                    expect(с.причина.length, 'строка ' + с.имя).toBeGreaterThan(0);
                }
            }
            expect(спорных).toBe(6);
        });

        test(язык.имя + ' · r=10 · давший неявку помечен и стоит последним', async ({ page }) => {
            const беды = await открыть(page, язык, 10);
            expect(беды, беды.join(' | ')).toHaveLength(0);

            const группы = await строкиГрупп(page);
            const снявшиеся = группы.flat().filter(с => с.вне);
            expect(снявшиеся.length).toBe(1);
            expect(await page.locator('.ad-badge-out').first().textContent()).toContain(язык.неявка);

            const его = группы.find(г => г.some(с => с.вне));
            const места = его.map(с => parseInt(с.место, 10));
            expect(Math.max(...места)).toBe(parseInt(снявшиеся[0].место, 10));
            // Его матчи выброшены, и равных развела личная встреча
            expect(его.filter(с => с.причина.indexOf(язык.встреча) !== -1).length).toBeGreaterThan(0);
        });

        test(язык.имя + ' · r=13 · отбор есть, а в карточке доп. матча только круг', async ({ page }) => {
            const беды = await открыть(page, язык, 13);
            expect(беды, беды.join(' | ')).toHaveLength(0);

            await expect(page.locator('.ad-qual-block')).toHaveCount(1);
            await expect(page.locator('.ad-ig-section')).toHaveCount(1);

            // Полное равенство разводит жребий, а не человек
            expect(await page.locator('.ad-qual-block').innerText()).toContain(язык.жребий);

            /* Строка куда ведёт — ОДИН элемент `.ad-brk-ig-to` (bracket.js:5223).
               Собирать её обходом всех узлов нельзя: у родителя текст длиннее,
               и правило начинает мерить чужое — поймано прогоном на en. */
            const строки = await page.locator('.ad-brk-ig-to').allInnerTexts();
            expect(строки.length).toBeGreaterThan(0);
            for (const с of строки) {
                const т = с.replace(/\s+/g, ' ').trim();
                expect(т).toContain(язык.круг);
                /* ЗАМОРОЖЕНО ОТНОШЕНИЕ, А НЕ ДЛИНА. Было «победитель → на
                   Абдырахманова Эракыым (1/8 финала, матч 7)»: имя, скобка,
                   запятая и номер матча. Осталось только название круга. */
                expect(т).toMatch(/^[^,(]+$/);
                expect(т).not.toMatch(/матч \d|match \d/i);
            }
        });

        test(язык.имя + ' · r=16 · без доп. матчей — BYE, а не [X], и отбора нет', async ({ page }) => {
            const беды = await открыть(page, язык, 16);
            expect(беды, беды.join(' | ')).toHaveLength(0);

            // Свободные места не разыгрываются вовсе
            await expect(page.locator('.ad-qual-block')).toHaveCount(0);
            await expect(page.locator('.ad-ig-section')).toHaveCount(0);

            const html = await page.content();
            expect(html).not.toContain('[X]');
            expect((html.match(/>BYE</g) || []).length).toBe(4);
        });

        test(язык.имя + ' · во всех раскладах в разметке нет undefined', async ({ page }) => {
            for (const r of [4, 9, 10, 13, 16]) {
                const беды = await открыть(page, язык, r);
                expect(беды, 'r=' + r + ': ' + беды.join(' | ')).toHaveLength(0);
                const раздел = await page.locator('#ad-tournaments').innerHTML();
                expect(раздел, 'r=' + r).not.toContain('undefined');
            }
        });
    }
});
