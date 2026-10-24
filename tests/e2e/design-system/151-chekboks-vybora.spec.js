/**
 * КУСОК 151 — ЧЕКБОКС МАССОВОГО ВЫБОРА ОДИН НА ПРОДУКТ.
 *
 * ЧТО БЫЛО. Дом `A.bulkCheckboxTd` существовал — и его ОБХОДИЛИ два
 * раздела из семи: «Корты» и «Пользователи» собирали чекбокс сами и
 * несли при нём инлайн width/height/accent-color/cursor. ДОМ, КОТОРЫЙ
 * ЕСТЬ И КОТОРЫЙ ОБХОДЯТ, ХУЖЕ ОТСУТСТВИЯ ДОМА: копия выглядит законной.
 *
 * ПРИЧИНА ОБХОДА БЫЛА НАСТОЯЩАЯ, И ОНА УЧТЕНА, А НЕ СНЕСЕНА: у кортов
 * ячейка идёт с `rowspan` (у корта несколько видов покрытия под одной
 * строкой-шапкой), а «Пользователи» дописывают ячейку к УЖЕ отрисованной
 * строке через DOM, и готовая строка не годится им вовсе. Поэтому дом
 * отдаёт ДВА понятия: ввод и ячейку вокруг него.
 *
 * ЧТО ДЕРЖИТ ЭТА ПРОБА. Все три пути рисуют ОДИН И ТОТ ЖЕ чекбокс:
 * вычисленный вид совпадает знак в знак, инлайна нет ни у одного, а
 * ячейка с `rowspan` отличается ровно тем, чем должна — числом строк и
 * выравниванием по середине.
 *
 * ПОЧЕМУ НА СТЕНДЕ. Разделы живут в админке, за входом, и пароля у меня
 * нет. Стенд `maket/chekboks-zamer.html` рисует НАСТОЯЩИМИ функциями
 * продукта — если их разметка уедет, стенд уедет вместе с ней.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/chekboks-zamer.html';

const СНЯТЬ = `() => {
    const снять = (сел) => {
        const э = document.querySelector(сел);
        if (!э) return null;
        const c = getComputedStyle(э), r = э.getBoundingClientRect();
        return {
            ширина: Math.round(r.width),
            высота: Math.round(r.height),
            appearance: c.appearance,
            курсор: c.cursor,
            границаШирина: c.borderTopWidth,
            границаКраска: c.borderTopColor,
            радиус: c.borderTopLeftRadius,
            инлайн: э.getAttribute('style')
        };
    };
    const ячейка = (сел) => {
        const td = document.querySelector(сел);
        if (!td) return null;
        const c = getComputedStyle(td);
        return { rowspan: td.getAttribute('rowspan'), выравнивание: c.verticalAlign,
                 поГоризонтали: c.textAlign };
    };
    return {
        дом: снять('#строка .ad-bulk-item'),
        корты: снять('#строкаРовспан .ad-bulk-item'),
        пользователи: снять('#строкаDOM .ad-bulk-item'),
        шапка: снять('.ad-bulk-all'),
        ячейкаДом: ячейка('#строка .ad-bulk-cell'),
        ячейкаКорты: ячейка('#строкаРовспан .ad-bulk-cell'),
        ячейкаПользователи: ячейка('#строкаDOM .ad-bulk-cell'),
        вводов: document.querySelectorAll('.ad-bulk-item').length,
        инлайнов: document.querySelectorAll('.ad-bulk-item[style], .ad-bulk-all[style]').length
    };
}`;

const замерить = (page) => page.evaluate(и => eval('(' + и + ')')(), СНЯТЬ);

async function открыть(page) {
    await page.goto(СТЕНД);
    await page.waitForFunction(
        () => !!(window.KSLT_ADMIN && window.KSLT_ADMIN.bulkCheckbox &&
                 window.KSLT_ADMIN.bulkCheckboxTd),
        null, { timeout: 15000 });
    await page.waitForSelector('#строкаDOM .ad-bulk-item', { timeout: 15000 });
}

test.describe('чекбокс массового выбора: один на продукт', () => {

    test('три пути дают один и тот же чекбокс', async ({ page }) => {
        await открыть(page);
        const м = await замерить(page);

        expect(м.вводов, 'на стенде не три пути').toBe(3);
        /* СРАВНИВАЕТСЯ ВЫЧИСЛЕННЫЙ ВИД, А НЕ РАЗМЕТКА: разметка у путей
           законно разная, вид обязан быть один. */
        expect(м.корты, 'путь кортов разошёлся с домом').toEqual(м.дом);
        expect(м.пользователи, 'путь «Пользователей» разошёлся с домом').toEqual(м.дом);
    });

    /* ЧИСЛА ЗАМЕРЕНЫ НА СТЕНДЕ 23.10, А НЕ ВЗЯТЫ ИЗ CSS ГЛАЗАМИ. */
    test('вид чекбокса — тот, что замерен', async ({ page }) => {
        await открыть(page);
        const м = await замерить(page);

        expect(м.дом.ширина, 'ширина не 18').toBe(18);
        expect(м.дом.высота, 'высота не 18').toBe(18);
        expect(м.дом.appearance, 'нативный вид вернулся — тогда accent-color снова что-то значит')
            .toBe('none');
        expect(м.дом.курсор, 'курсор не pointer').toBe('pointer');
        expect(м.дом.границаШирина, 'граница не 2px').toBe('2px');
        expect(м.дом.радиус, 'радиус не 4px').toBe('4px');
    });

    /* ИНЛАЙН МЁРТВ, И ЕГО НЕТ НИ У ОДНОГО ПУТИ. Опасен он был тем, что
       ПЕРЕБИЛ БЫ правку размера в css молча: важности css снял кусок 119. */
    test('инлайна нет ни у одного чекбокса', async ({ page }) => {
        await открыть(page);
        const м = await замерить(page);

        expect(м.инлайнов, 'инлайн вернулся').toBe(0);
        expect(м.дом.инлайн, 'у чекбокса дома появился инлайн').toBeNull();
        expect(м.корты.инлайн, 'у чекбокса кортов появился инлайн').toBeNull();
        expect(м.пользователи.инлайн, 'у чекбокса «Пользователей» появился инлайн').toBeNull();
    });

    /* ЯЧЕЙКА С `rowspan` ОТЛИЧАЕТСЯ РОВНО ТЕМ, ЧЕМ ДОЛЖНА. */
    test('ячейка кортов несёт rowspan и выравнивание по середине', async ({ page }) => {
        await открыть(page);
        const м = await замерить(page);

        expect(м.ячейкаКорты.rowspan, 'rowspan не доехал до ячейки').toBe('2');
        expect(м.ячейкаКорты.выравнивание, 'чекбокс прижат к верху высокой ячейки')
            .toBe('middle');
        expect(м.ячейкаДом.rowspan, 'rowspan появился там, где его не просили').toBeNull();
        expect(м.ячейкаПользователи.rowspan, 'rowspan появился у «Пользователей»').toBeNull();
        expect(м.ячейкаДом.поГоризонтали, 'ячейка не по центру').toBe('center');
    });

    /* ШАПКА — ЧЕТВЁРТЫЙ ВИД ТОГО ЖЕ ЧЕКБОКСА, И ОНА ТОЖЕ БЕЗ ИНЛАЙНА
       (кусок 119). Если вид шапки разойдётся со строкой, выбор «все» и
       выбор строки станут разными на глаз. */
    test('шапка выглядит как строка', async ({ page }) => {
        await открыть(page);
        const м = await замерить(page);

        expect(м.шапка.ширина, 'шапка шире строки').toBe(м.дом.ширина);
        expect(м.шапка.высота, 'шапка выше строки').toBe(м.дом.высота);
        expect(м.шапка.границаКраска, 'краска границы шапки разошлась со строкой')
            .toBe(м.дом.границаКраска);
        expect(м.шапка.инлайн, 'у шапки появился инлайн').toBeNull();
    });
});
