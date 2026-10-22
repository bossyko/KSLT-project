/**
 * КУСОК 129 — ДВА РАЗНЫХ ПУСТЫХ СОСТОЯНИЯ.
 *
 * Сторож читает файлы. Эта проба читает ЭКРАН и держит РАЗНИЦУ: при
 * пустой базе — приглашение завести первое, при пустой выборке —
 * «ничего не найдено» и совет сбросить фильтры.
 *
 * ЗАМЕРЕНО НА БОЕВОЙ 22.10: двенадцать кортов в базе, поиск без
 * совпадений — и экран говорил «Кортов пока нет. Нажмите "Добавить
 * корт" для создания».
 *
 * Админка — десктоп и планшет (решение Кости 29.09).
 */
const { test, expect } = require('@playwright/test');

const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];
const СТЕНД = '/maket/pustoe-sostoyanie-zamer.html';

async function текст(page, id) {
    return page.evaluate(i => {
        const б = document.querySelector('#' + i + ' .ad-pusto');
        return б ? б.textContent.replace(/\s+/g, ' ').trim() : '';
    }, id);
}

test.describe('пустое состояние админки', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТЕЛЕФОННЫЕ.indexOf(info.project.name) !== -1,
            'админка — десктоп и планшет (слово Кости 29.09)');
    });

    test('пустая база зовёт завести первое', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#пусто .ad-pusto', { timeout: 15000 });
        const т = await текст(page, 'пусто');
        expect(т, 'пустая база перестала приглашать завести первое').toContain('пока нет');
        expect(т, 'на пустой базе появился совет сбросить фильтры, которых нет')
            .not.toContain('Ничего не найдено');
    });

    test('пустая выборка говорит «ничего не найдено», а не «пока нет»', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#нетНаходок .ad-pusto', { timeout: 15000 });
        const т = await текст(page, 'нетНаходок');
        expect(т, 'при непустой базе экран снова говорит «пока нет» — это и была беда: ' +
            'человеку с двенадцатью кортами предлагали завести первый').toContain('Ничего не найдено');
        expect(т, 'совет сбросить фильтры пропал').toContain('сбросьте фильтры');
        expect(т, 'на непустой базе осталось приглашение завести первое').not.toContain('пока нет');
    });

    test('признак фильтров работает там, где фильтр уходит в базу', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#поПризнаку .ad-pusto', { timeout: 15000 });
        const т = await текст(page, 'поПризнаку');
        expect(т, 'второй вход дома (признак вместо числа) перестал работать')
            .toContain('Ничего не найдено');
    });

    test('у пустоты есть вид, а не голый текст в потоке', async ({ page }) => {
        await page.goto(СТЕНД);
        await page.waitForSelector('#пусто .ad-pusto', { timeout: 15000 });
        const в = await page.evaluate(() => {
            const б = document.querySelector('#пусто .ad-pusto');
            const c = getComputedStyle(б);
            const зн = getComputedStyle(б.querySelector('.ad-pusto-znak'));
            return { выравнивание: c.textAlign, отступ: c.paddingTop,
                     знакКегль: зн.fontSize, знакПрозрачность: зн.opacity };
        });
        /* Прежнее имя `.ad-empty-state` звали 22 места, и правила под него
           не было ни в одном css — блок рисовался голым текстом. */
        expect(в.выравнивание, 'пустота перестала быть по центру').toBe('center');
        expect(в.отступ, 'воздух вокруг пустоты ушёл со ступени 40').toBe('40px');
        expect(в.знакКегль, 'знак ушёл с кегля 40').toBe('40px');
        expect(в.знакПрозрачность, 'знак перестал быть приглушённым').toBe('0.3');
    });

});
