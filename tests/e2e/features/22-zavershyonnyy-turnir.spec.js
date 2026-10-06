// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-ЗАВЕРШЁН: завершённый турнир виден экраном, а не одной строкой внизу.
 *
 * До 06.10 кнопка завершения была объявлена ЧЕТЫРЕ раза и вела себя
 * по-разному: групповая панель показывала её всегда и гасила, три остальные
 * прятали вовсе; «Турнир завершён» с пересчётом было только у олимпийки и
 * «всех мест», а у групповой и у лиг завершённый турнир не говорил о себе
 * НИЧЕГО — под сеткой оставалось пустое место. Костя 06.10: «после
 * завершения турнира не понятно что можно тут, так как всё там активно».
 *
 * Решение Кости — ГАСИТЬ И ПРЕДУПРЕЖДАТЬ, а не прятать: правка счёта после
 * завершения нужна, рядом для того и стоит «Пересчитать очки».
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТЕЛЕФОНА У НЕЁ НЕТ, ТОЛЬКО РУССКИЙ.
 * Виды `mobile` и `phone-landscape` пропускаются целиком.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ — то и проверяется здесь: заморозка читает файл
 * как текст и не знает, что вышло в браузере. Что клетка и правда перестала
 * быть лаймовой, что наведение возвращает голос, что предупреждение видно и
 * что кнопка внизу говорит нужное слово — это замер, а не чтение.
 *
 * КНОПКУ, КОТОРАЯ ПИШЕТ В БАЗУ, НЕ НАЖИМАЕМ. «Завершить турнир» и
 * «Пересчитать очки» здесь только ищутся и меряются: нажатие переписало бы
 * очки и историю рейтинга в тестовой базе.
 */

test.use({ storageState: require('../../auth-setup').adminState });

/* Три раскладки из четырёх закрыты севом; четвёртая — завершённая
   круговая — в базе отсутствует, и это ровно случай Челленджера. Её даём
   ПЕРЕХВАТОМ ответа базы, а не правкой данных: тестовая база остаётся
   нетронутой, а ветка кода проверяется настоящая. */
const ЗАВЕРШЁННЫЕ = [
    ['олимпийка',      'test-itogi'],
    ['все места',      'test-itogi-fic'],
    ['группы и лиги',  'test-dve-ligi']
];

const ИДУЩИЙ = 'test-metka';   // круговая, status = ongoing

/** Цвет в три числа: сравнивать краски строками нельзя. */
function числа(краска) {
    const м = String(краска).match(/-?\d+(\.\d+)?/g) || [];
    return м.slice(0, 3).map(Number);
}

/** Светлота по WCAG — для контраста погашенной кнопки. */
function светлота([r, g, b]) {
    const к = [r, g, b].map(v => {
        const с = v / 255;
        return с <= 0.03928 ? с / 12.92 : Math.pow((с + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * к[0] + 0.7152 * к[1] + 0.0722 * к[2];
}

function контраст(a, b) {
    const л1 = светлота(числа(a)), л2 = светлота(числа(b));
    const св = Math.max(л1, л2), тм = Math.min(л1, л2);
    return (св + 0.05) / (тм + 0.05);
}

/** Открыть сетку турнира и дождаться ПРИЗНАКА, а не тишины сети. */
async function открытьСетку(page, id) {
    await page.goto('/pages/admin.html#tournaments/bracket/' + id,
        { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('#adBrkBracketPanel .ad-brk-edit, #adBrkBracketPanel .ad-grp-cell-click',
        { timeout: 20000 });
}

test.describe('Завершённый турнир виден экраном', () => {
    test.beforeEach(async ({ page }, info) => {
        test.skip(/mobile|phone/.test(info.project.name),
            'админка: десктоп и планшет, телефона нет');
    });

    for (const [раскладка, id] of ЗАВЕРШЁННЫЕ) {
        test(`${раскладка}: панель помечена завершённой и предупреждает`, async ({ page }) => {
            await открытьСетку(page, id);

            const панель = page.locator('#adBrkBracketPanel');
            await expect(панель).toHaveClass(/ad-brk-zavershyon/);

            /* Предупреждение стоит ВВЕРХУ панели, а не под сеткой: оно про
               клетки, и человек должен прочесть его ДО того, как нажмёт. */
            const полоса = панель.locator('.ad-sched-note').first();
            await expect(полоса).toBeVisible();
            await expect(полоса).toContainText('пересч');

            const верхПолосы = (await полоса.boundingBox()).y;
            const перваяКлетка = панель.locator('.ad-brk-edit, .ad-grp-cell-click').first();
            await перваяКлетка.scrollIntoViewIfNeeded();
            expect(верхПолосы).toBeLessThan((await перваяКлетка.boundingBox()).y);
        });

        test(`${раскладка}: внизу сказано «Турнир завершён», а не пусто`, async ({ page }) => {
            await открытьСетку(page, id);

            const итог = page.locator('#adBrkBracketPanel .ad-brk-done');
            await expect(итог).toBeVisible();
            await expect(итог).toContainText('Турнир завершён');
            await expect(page.locator('#adBrkRecalc')).toBeVisible();

            // Завершить второй раз предлагать нечего
            await expect(page.locator('#adBrkFinalize')).toHaveCount(0);
        });
    }

    test('клетки завершённого турнира перестают звать лаймом, но остаются живыми', async ({ page }) => {
        await открытьСетку(page, 'test-itogi');

        const кнопки = page.locator('#adBrkBracketPanel .ad-brk-edit');
        const сколько = await кнопки.count();
        // ПРЯТАТЬ НЕЛЬЗЯ: правка счёта после завершения нужна
        expect(сколько).toBeGreaterThan(0);

        const первая = кнопки.first();
        await первая.scrollIntoViewIfNeeded();

        const акцент = await page.evaluate(() =>
            getComputedStyle(document.documentElement).getPropertyValue('--accent').trim());
        const покой = await первая.evaluate(у => getComputedStyle(у).color);

        // Краска ушла с акцента
        expect(числа(покой).join()).not.toBe(числа(акцент).join());

        // И при этом читается: норма WCAG AA — 4.5
        const фон = await первая.evaluate(у => {
            let у2 = у, краска = getComputedStyle(у).backgroundColor;
            // Полупрозрачный фон кнопки ложится на фон карточки — берём его
            while (у2 && /rgba?\([^)]*,\s*0(\.\d+)?\)/.test(краска)) {
                у2 = у2.parentElement;
                if (!у2) break;
                краска = getComputedStyle(у2).backgroundColor;
            }
            return краска;
        });
        expect(контраст(покой, фон)).toBeGreaterThanOrEqual(4.5);
    });

    test('наведение возвращает голос: тише не значит мертво', async ({ page }) => {
        await открытьСетку(page, 'test-itogi');

        const первая = page.locator('#adBrkBracketPanel .ad-brk-edit').first();
        await первая.scrollIntoViewIfNeeded();

        const покой = await первая.evaluate(у => getComputedStyle(у).color);
        await первая.hover();
        /* ЖДЁМ ОСТАНОВКИ ВЕЛИЧИНЫ, А НЕ ИСТЕЧЕНИЯ ВРЕМЕНИ: у кнопки есть
           переход по фону, и первый же кадр после `hover` вернул бы старое
           значение. Ждём, пока краска станет другой. */
        await expect.poll(
            () => первая.evaluate(у => getComputedStyle(у).color),
            { timeout: 3000 }
        ).not.toBe(покой);
    });

    test('у идущего турнира кнопка на месте, погашена и объясняет себя', async ({ page }) => {
        await открытьСетку(page, ИДУЩИЙ);

        const панель = page.locator('#adBrkBracketPanel');
        // Идущий — не завершённый: ни класса, ни предупреждения
        await expect(панель).not.toHaveClass(/ad-brk-zavershyon/);
        await expect(page.locator('#adBrkBracketPanel .ad-brk-done')).toHaveCount(0);

        const кнопка = page.locator('#adBrkFinalize');
        await expect(кнопка).toBeVisible();

        /* У `test-metka` группы доиграны не все — кнопка обязана быть
           погашена И сказать, сколько счетов осталось. Если сев однажды
           доиграет турнир целиком, проверка не станет врать: тогда кнопка
           будет живой, и мы требуем именно этого. */
        const погашена = await кнопка.isDisabled();
        if (погашена) {
            await expect(кнопка).toHaveAttribute('title', /Осталось записать счёт: \d+/);
            await expect(панель.locator('.ad-sched-note-flat')).toContainText(/Осталось записать счёт: \d+/);
        } else {
            await expect(кнопка).not.toHaveAttribute('title', /Осталось/);
        }
    });

    test('ЗАВЕРШЁННАЯ КРУГОВАЯ — тот самый случай Челленджера', async ({ page }) => {
        /* Четвёртая раскладка: в севе завершённой круговой нет. Подставляем
           статус ПЕРЕХВАТОМ ответа базы — данные не трогаем, ветка кода
           проверяется настоящая. */
        await page.route('**/rest/v1/tournaments*', async route => {
            const ответ = await route.fetch();
            let тело;
            try { тело = await ответ.json(); } catch (e) { return route.fulfill({ response: ответ }); }
            const правка = т => (т && т.id === ИДУЩИЙ) ? Object.assign({}, т, { status: 'completed' }) : т;
            тело = Array.isArray(тело) ? тело.map(правка) : правка(тело);
            await route.fulfill({ response: ответ, json: тело });
        });

        await открытьСетку(page, ИДУЩИЙ);

        const панель = page.locator('#adBrkBracketPanel');
        await expect(панель).toHaveClass(/ad-brk-zavershyon/);
        await expect(панель.locator('.ad-sched-note').first()).toContainText('пересч');
        await expect(панель.locator('.ad-brk-done')).toContainText('Турнир завершён');
        await expect(page.locator('#adBrkFinalize')).toHaveCount(0);
        await expect(page.locator('#adBrkRecalc')).toBeVisible();
    });
});
