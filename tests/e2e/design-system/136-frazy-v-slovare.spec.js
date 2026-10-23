/**
 * КУСОК 136 — ФРАЗЫ АДМИНКИ ЖИВУТ В СЛОВАРЕ ЦЕЛИКОМ.
 *
 * Сторож читает файлы. Эта проба читает РАНТАЙМ: что дом подстановки
 * работает, что он знает кириллические имена, и что фразы собираются
 * целиком, а не склейкой.
 *
 * Админка за входом — словарь берётся со стенда (решение 29.09).
 *
 * ГЛАВНОЕ, ЧТО ДЕРЖИТ ЭТА ПРОБА И НЕ МОЖЕТ ДЕРЖАТЬ СТОРОЖ: подстановка
 * с КИРИЛЛИЧЕСКИМ именем. В коде эти переменные зовут `буква`, `двое`,
 * `надо`; регулярка с `\w` их не видит, и шаблон остался бы с дыркой
 * прямо на экране. Эта ошибка за день дважды сломала мои приборы и один
 * раз — сам дом.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/pustoe-sostoyanie-zamer.html';

test.describe('фразы админки в словаре', () => {

    test.beforeEach(({}, info) => {
        test.skip(['mobile', 'phone-landscape'].indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('дом подстановки есть и заполняет места', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const м = await page.evaluate(() => {
            const A = window.KSLT_ADMIN, L = A.L;
            if (typeof A.фраза !== 'function') return { домЕсть: false };
            return {
                домЕсть: true,
                кириллица: A.фраза(L.brkDrawCancelledV, { буква: 'Б' }),
                латиница: A.фраза(L.brkNewPlayerUzhe, { id: 42 }),
                несколько: A.фраза(L.brkGroupBukvaMeetings2, { буква: 'В', мг: 3, надо: 5 }),
                пропущено: A.фраза(L.brkDrawCancelledV, {}),
                пустойШаблон: A.фраза(undefined, { x: 1 }),
                безЗначений: A.фраза(L.brkDrawCancelledV)
            };
        });
        expect(м.домЕсть, 'дома A.фраза нет — фразы снова соберутся склейкой').toBe(true);

        /* КИРИЛЛИЧЕСКОЕ ИМЯ ПОДСТАНОВКИ — не придирка: именно так зовут
           переменные в этом коде. */
        expect(м.кириллица, 'кириллическое имя подстановки не заполнилось')
            .toBe('Жеребьёвка отменена: в группе Б пара встречается дважды');
        expect(м.латиница, 'латинская подстановка не заполнилась')
            .toBe('Новый игрок уже стоит в матче 42. Сетка не переписана — сперва разберите заявки.');
        expect(м.несколько, 'несколько подстановок сразу').toBe('Группа В: встреч 3 вместо 5');

        /* НЕЗАПОЛНЕННОЕ МЕСТО ДОЛЖНО БРОСАТЬСЯ В ГЛАЗА: пустая дырка в
           тексте не бросается, и ошибку никто не заметит. */
        expect(м.пропущено, 'пропущенное место исчезло вместо того, чтобы остаться видимым')
            .toContain('{буква}');
        expect(м.безЗначений, 'без второго довода место тоже должно остаться видимым')
            .toContain('{буква}');
        expect(м.пустойШаблон, 'пустой шаблон должен давать пустую строку, а не слово undefined')
            .toBe('');
    });

    test('фразы лежат целиком, а не кусками', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const м = await page.evaluate(() => {
            const L = window.KSLT_ADMIN.L;
            return {
                новыйИгрок: L.brkNewPlayerUzhe,
                исключено: L.brkWarnExcludedUnpairedEntrie,
                группаВстреч: L.brkGroupBukvaMeetings2
            };
        });
        /* Каждая из этих фраз собиралась склейкой из двух-трёх кусков.
           Признак целости — и начало, и конец в ОДНОМ значении. */
        expect(м.новыйИгрок, 'фраза снова разорвана').toContain('Новый игрок уже стоит');
        expect(м.новыйИгрок, 'конец фразы потерян').toContain('разберите заявки');
        expect(м.исключено, 'фраза разорвана').toContain('Исключено');
        expect(м.исключено, 'конец фразы потерян').toContain('незапаренных заявок');
        expect(м.группаВстреч, 'фраза разорвана').toContain('Группа');
        expect(м.группаВстреч, 'конец фразы потерян').toContain('вместо');
    });

    test('ни один ключ не отдаёт пустоты, и словарь не похудел', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForFunction(() => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.L),
            null, { timeout: 15000 });
        const м = await page.evaluate(() => {
            const L = window.KSLT_ADMIN.L;
            const имена = Object.keys(L);
            const пустые = имена.filter(k => {
                const v = L[k];
                if (Array.isArray(v)) return v.length === 0 || v.some(x => !x);
                return v === undefined || v === null || v === '';
            });
            /* места подстановки, оставшиеся без пары фигурных скобок —
               признак того, что шаблон поломан правкой */
            const кривые = имена.filter(k => typeof L[k] === 'string' &&
                (L[k].split('{').length !== L[k].split('}').length));
            return { ключей: имена.length, пустых: пустые.length,
                     примеры: пустые.slice(0, 5), кривых: кривые.length,
                     какие: кривые.slice(0, 5) };
        });
        expect(м.ключей, 'словарь похудел ниже замеренного').toBeGreaterThanOrEqual(1814);
        expect(м.пустых, 'пустые ключи: ' + м.примеры.join(', ')).toBe(0);
        expect(м.кривых, 'шаблоны с непарными скобками: ' + м.какие.join(', ')).toBe(0);
    });

});
