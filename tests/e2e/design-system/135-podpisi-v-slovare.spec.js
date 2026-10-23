/**
 * КУСОК 135 — ПОДПИСИ АДМИНКИ ЖИВУТ В СЛОВАРЕ.
 *
 * Сторож читает файлы. Эта проба читает СЛОВАРЬ В РАНТАЙМЕ: что он
 * собрался, что ни один ключ не отдаёт undefined и что подписи, снятые
 * с разметки, вернулись тем же текстом ЗНАК В ЗНАК.
 *
 * Админка за входом, и пароля у пробы нет — поэтому словарь берётся со
 * СТЕНДА, который грузит `constants.js` ровно так же, как админка
 * (решение 29.09: экраны админки меряем стендами).
 *
 * ЧИСЛО БЕРЁТСЯ У ПРИБОРА, А НЕ ИЗ ПАМЯТИ: образцы ниже — это настоящие
 * значения из словаря на 22.10, и каждое стояло в коде зашитым.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/pustoe-sostoyanie-zamer.html';

/* Подписи, снятые с разметки, и их тексты ДО правки. Сверка идёт на
   совпадение знак в знак: кусок менял МЕСТО ХРАНЕНИЯ, а не текст. */
const ОБРАЗЦЫ = {
    brkCourt: 'Корт ',
    brkCell: 'Клетка',
    brkEdit: 'Править',
    brkPair: 'Пара 1',
    brkRegistration: 'Регистрация',
    crtTotal: 'всего',
    chalFormatSets: 'Формат сетов',
    navCategory: 'Категория',
    navRating: 'Рейтинг'
};

/* Ключи, которых не было вовсе: на экране стояло слово undefined. */
const БЫЛО_UNDEFINED = {
    expEmpty: 'Нечего выгружать',
    expDownload: 'Скачать',
    expPrint: 'Печать',
    newsViewerTitle: 'Открыть',
    plrFillRequired: 'Заполните обязательные поля'
};

/* Четыре строки фильтра ваучеров звали ключи с ЧУЖОЙ ПРИСТАВКОЙ —
   pay вместо vch, — и тексты для них были заведены давно. */
const ЧУЖАЯ_ПРИСТАВКА = {
    vchStatusActive: 'Активный',
    vchStatusUsed: 'Использован',
    vchStatusExpired: 'Истёк',
    vchStatusCancelled: 'Отменён'
};

test.describe('подписи админки в словаре', () => {

    test.beforeEach(({}, info) => {
        test.skip(['mobile', 'phone-landscape'].indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('словарь собрался и ни один ключ не отдаёт undefined', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const м = await page.evaluate(() => {
            const L = window.KSLT_ADMIN.L;
            const имена = Object.keys(L);
            return {
                ключей: имена.length,
                пустых: имена.filter(k => L[k] === undefined || L[k] === null || L[k] === '').length,
                примеры: имена.filter(k => L[k] === undefined || L[k] === '').slice(0, 6)
            };
        });
        /* ПОЛ, А НЕ ТОЧНОЕ ЧИСЛО: словарь растёт, и это законно. Упал
           ниже — значит ключи сняли, не сняв зовов, и где-то на экране
           появилось undefined. */
        expect(м.ключей, 'словарь похудел ниже замеренного').toBeGreaterThanOrEqual(1693);
        expect(м.пустых, 'пустые ключи: ' + м.примеры.join(', ')).toBe(0);
    });

    test('подписи, снятые с разметки, вернулись знак в знак', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const было = await page.evaluate(о => {
            const L = window.KSLT_ADMIN.L;
            const из = {};
            Object.keys(о).forEach(k => { из[k] = L[k]; });
            return из;
        }, ОБРАЗЦЫ);
        for (const ключ of Object.keys(ОБРАЗЦЫ)) {
            /* Пробел в конце `Корт ` НАМЕРЕН: подпись склеивается с
               номером. Сверка строгая именно поэтому. */
            expect(было[ключ], 'подпись ' + ключ + ' изменилась').toBe(ОБРАЗЦЫ[ключ]);
        }
    });

    test('места, где стояло undefined, говорят словами', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const все = { ...БЫЛО_UNDEFINED, ...ЧУЖАЯ_ПРИСТАВКА };
        const из = await page.evaluate(о => {
            const L = window.KSLT_ADMIN.L;
            const r = {};
            Object.keys(о).forEach(k => { r[k] = L[k]; });
            return r;
        }, все);
        for (const ключ of Object.keys(все)) {
            expect(из[ключ], ключ + ' снова не отдаёт текста — на экране будет undefined')
                .toBe(все[ключ]);
        }
    });

    test('словарь отдаёт строку, а не пустоту, на выборке в сотню ключей', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        /* ПРОВЕРКА, КОТОРАЯ СМОТРИТ ОДИН КЛЮЧ, НИЧЕГО НЕ ГОВОРИТ О
           СЛОВАРЕ. Берём каждый семнадцатый — выборка по всему объёму,
           а не по началу, где лежат самые старые ключи. */
        const м = await page.evaluate(() => {
            const L = window.KSLT_ADMIN.L;
            const имена = Object.keys(L);
            const взято = имена.filter((_, i) => i % 17 === 0);
            const плохие = взято.filter(k => {
                const v = L[k];
                if (Array.isArray(v)) return v.length === 0 || v.some(x => !x);
                return typeof v !== 'string' || v === '';
            });
            return { взято: взято.length, плохих: плохие.length, какие: плохие.slice(0, 6) };
        });
        expect(м.взято, 'выборка пуста — словарь не собрался').toBeGreaterThan(80);
        expect(м.плохих, 'ключи без текста: ' + м.какие.join(', ')).toBe(0);
    });

});
