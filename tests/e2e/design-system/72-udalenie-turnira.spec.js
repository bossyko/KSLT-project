// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * ПРОБА ОКНА УДАЛЕНИЯ ТУРНИРА.
 *
 * ЧЕГО НЕ ВИДИТ ЗАМОРОЗКА. Правила читают файлы как текст: что окно зовёт
 * счётчик и что крючки на месте. А вышло ли это в браузере — встала ли
 * ширина на нужную ступень, читается ли столбец значений, не разорвалось ли
 * «1 240 очков» переносом, не вылезло ли окно за край на планшете — видно
 * только прогоном.
 *
 * СТЕНД, А НЕ АДМИНКА: админка за входом, пароля в пробе быть не должно.
 * Окно рисует НАСТОЯЩАЯ `A.showConfirm`, тело собирает НАСТОЯЩАЯ
 * `текстПотерь` (отдана наружу как `A.текстПотерьТурнира`). Разметка в
 * стенд не копируется.
 *
 * ЧИСЛА В СТЕНДЕ НАМЕРЕННЫЕ, А НЕ ЗАМЕРЕННЫЕ: это пределы для проверки
 * разметки. Настоящие окно собирает запросом.
 *
 * В БАЗУ НЕ ПИШЕТ НИЧЕГО: у заглушки нет ни insert, ни update, ни delete.
 *
 * АДМИНКА — ДЕСКТОП И ПЛАНШЕТ, ТОЛЬКО РУССКИЙ (решение Кости 29.09).
 */

const СТЕНД = '/maket/stend-udalenie-turnira.html';
const ТЕЛЕФОННЫЕ = ['mobile', 'phone-landscape'];

/** Открыть случай и дождаться окна — ПРИЗНАКА, а не тишины сети. */
async function открыть(page, случай) {
    await page.evaluate((к) => {
        const о = document.querySelector('.ad-confirm-overlay');
        if (о) о.remove();
        window.показатьСлучай(к);
    }, случай);
    await page.waitForSelector('.ad-confirm-modal', { timeout: 10000 });
}

test.describe('Окно удаления турнира', () => {

    test.beforeEach(async ({ page }, testInfo) => {
        test.skip(ТЕЛЕФОННЫЕ.includes(testInfo.project.name),
            'админка — десктоп и планшет, телефонной раскладки в ней нет');
        await page.goto(СТЕНД);
        await page.waitForSelector('body[data-stend-gotov="1"]', { timeout: 15000 });
    });

    test('окно называет ЧИСЛАМИ всё, что уйдёт каскадом', async ({ page }) => {
        await открыть(page, 'krayniy');
        const строки = page.locator('.ad-udalenie-spisok li');
        await expect(строки).toHaveCount(4);
        const текст = await page.locator('.ad-udalenie').innerText();
        expect(текст).toContain('заявок');
        expect(текст).toContain('матчей');
        expect(текст).toContain('результатов');
        expect(текст).toContain('начислений');
        // Начисления — три числа в одной строке: строк, игроков, очков
        expect(текст).toMatch(/36\s*·\s*8 игроков\s*·\s*1 240 очков/);
    });

    test('о том, что ОСТАНЕТСЯ, окно молчит — решение Кости', async ({ page }) => {
        await открыть(page, 'krayniy');
        const текст = await page.locator('.ad-confirm-modal').innerText();
        expect(текст).not.toContain('Останется');
        expect(текст).not.toContain('потеряют связь');
    });

    test('массовое добавляет строку «из них с начислениями»', async ({ page }) => {
        await открыть(page, 'massovoe');
        await expect(page.locator('.ad-udalenie-spisok li')).toHaveCount(5);
        expect(await page.locator('.ad-udalenie').innerText()).toContain('из них с начислениями');
    });

    test('пустой турнир: одна фраза, окно на ступени sm 400', async ({ page }) => {
        await открыть(page, 'pusto');
        await expect(page.locator('.ad-udalenie-spisok')).toHaveCount(0);
        await expect(page.locator('.ad-udalenie-pusto')).toHaveCount(1);
        const ш = await page.locator('.ad-confirm-modal').evaluate(el => el.getBoundingClientRect().width);
        expect(Math.round(ш)).toBe(400);
    });

    test('со списком окно встаёт на ступень md 520, а не шире', async ({ page }) => {
        await открыть(page, 'krayniy');
        const ш = await page.locator('.ad-confirm-modal').evaluate(el => el.getBoundingClientRect().width);
        expect(Math.round(ш)).toBe(520);
    });

    test('столбец значений читается справа, подписи слева', async ({ page }) => {
        await открыть(page, 'krayniy');
        const пары = await page.locator('.ad-udalenie-spisok li').evaluateAll(списки =>
            списки.map(li => {
                const s = li.querySelector('span').getBoundingClientRect();
                const b = li.querySelector('b').getBoundingClientRect();
                return { слева: Math.round(s.left), правее: b.left > s.right, край: Math.round(b.right) };
            }));
        // подписи выровнены по одной линии слева
        expect(new Set(пары.map(п => п.слева)).size).toBe(1);
        // значение всегда правее подписи и тоже по одной линии справа
        expect(пары.every(п => п.правее)).toBe(true);
        expect(new Set(пары.map(п => п.край)).size).toBe(1);
    });

    test('число не разрывается переносом', async ({ page }) => {
        await открыть(page, 'massovoe');
        const высоты = await page.locator('.ad-udalenie-spisok b')
            .evaluateAll(els => els.map(e => Math.round(e.getBoundingClientRect().height)));
        expect(new Set(высоты).size).toBe(1);
    });

    test('длинное имя турнира не ломает окно и не уводит его за край', async ({ page }) => {
        await открыть(page, 'krayniy');
        const м = await page.locator('.ad-confirm-modal').evaluate(el => {
            const r = el.getBoundingClientRect();
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom,
                     w: window.innerWidth, h: window.innerHeight };
        });
        expect(м.left).toBeGreaterThanOrEqual(0);
        expect(м.right).toBeLessThanOrEqual(м.w);
        expect(м.top).toBeGreaterThanOrEqual(0);
        expect(м.bottom).toBeLessThanOrEqual(м.h);
    });

    test('кнопки стоят на ступени 44 и не слипаются', async ({ page }) => {
        await открыть(page, 'krayniy');
        const к = await page.evaluate(() => {
            const о = document.getElementById('adConfirmCancel').getBoundingClientRect();
            const у = document.getElementById('adConfirmOk').getBoundingClientRect();
            return { вО: Math.round(о.height), вУ: Math.round(у.height),
                     зазор: Math.round(у.left - о.right), порядок: у.left > о.left };
        });
        expect(к.вО).toBe(44);
        expect(к.вУ).toBe(44);
        expect(к.зазор).toBeGreaterThanOrEqual(8);
        // «сначала вторичная, потом основная» — описание Modal 26:143
        expect(к.порядок).toBe(true);
    });

    test('лестница текста: заголовок крупнее тела, межстрочные со шкалы', async ({ page }) => {
        await открыть(page, 'krayniy');
        const л = await page.evaluate(() => {
            const снять = (sel) => {
                const s = getComputedStyle(document.querySelector(sel));
                return { к: parseFloat(s.fontSize), в: s.fontWeight, м: parseFloat(s.lineHeight) };
            };
            return { заголовок: снять('.ad-confirm-title'),
                     шапка: снять('.ad-udalenie-zagolovok'),
                     подпись: снять('.ad-udalenie-spisok li span'),
                     значение: снять('.ad-udalenie-spisok li b') };
        });
        /* ЧИСЛА ПОПРАВЛЕНЫ 24.10, И ПОПРАВИЛО ИХ РЕШЕНИЕ 19.10, А НЕ Я.
           Кусок «заголовок окна: одно определение, пара на ступень» перевёл
           `.ad-confirm-text` с `--fs-sm` на `--fs-base`: тело окна стало 16.
           Проба написана 13.10 и с тех пор не звалась — НЕПРОГНАННАЯ ПРОБА
           НЕ ЗНАЕТ, ЧТО РЕШЕНИЕ ИЗМЕНИЛОСЬ, и держала прежние 14.
           Оба кегля стоят на шкале (14 · 16 · 18), пара «заголовок + тело»
           отстоит на ступень, и дальше проба держит ОТНОШЕНИЕ, а не числа. */
        expect(л.заголовок.к).toBe(18);
        expect(л.шапка.к).toBe(16);
        expect(л.подпись.к).toBe(16);
        expect(л.значение.к).toBe(16);
        // заголовок СТРОГО крупнее тела на каждом виде — замораживаем отношение
        expect(л.заголовок.к).toBeGreaterThan(л.подпись.к);
        // подпись легче значения: вес несёт число, а не слово
        expect(Number(л.подпись.в)).toBeLessThan(Number(л.значение.в));
        // межстрочные со шкалы: 1.3 у заголовка, 1.5 у текста
        expect(л.заголовок.м / л.заголовок.к).toBeCloseTo(1.3, 2);
        expect(л.подпись.м / л.подпись.к).toBeCloseTo(1.5, 2);
    });

    /* ═══ СПРОС ПЕРЕД ПУБЛИКАЦИЕЙ И СНЯТИЕМ — КУСОК 154, 24.10 ═══
       Окно то же, его держат проверки выше. Новое здесь только ТЕКСТ, и он
       берётся из НАСТОЯЩЕГО словаря через НАСТОЯЩУЮ `A.фраза`: копия текста
       в стенде показывала бы стенд, а не продукт.
       До куска 154 «Опубликовать» и «Снять» писали в базу С ОДНОГО
       НАЖАТИЯ — в строке, где рядом стоит безобидная «Сетка». */

    async function спрос(page, вид) {
        await page.evaluate((в) => {
            const о = document.querySelector('.ad-confirm-overlay');
            if (о) о.remove();
            window.показатьСпрос(в);
        }, вид);
        await page.waitForSelector('.ad-confirm-modal', { timeout: 10000 });
    }

    test('спрос публикации называет последствие и несёт название турнира', async ({ page }) => {
        await спрос(page, 'opublikovat');
        const заголовок = await page.locator('.ad-confirm-title').innerText();
        const тело = await page.locator('.ad-confirm-text').innerText();
        expect(заголовок).toBe('Опубликовать турнир?');
        /* ПОСЛЕДСТВИЕ, А НЕ ПОВТОР КНОПКИ: эталон взят у отзыва рассылки. */
        expect(тело).toContain('появится на сайте');
        expect(тело).toContain('смогут записаться');
        /* ОБРАТНЫЙ ПУТЬ ЭКРАНИРОВАНИЯ: кавычка, амперсанд и угловые скобки в
           названии возвращаются ЗНАК В ЗНАК, а не приезжают как `&amp;` и не
           превращаются в разметку. Урок куска 145. */
        const имя = await page.evaluate(() => window.ИМЕНА_СПРОСА.opublikovat);
        expect(тело).toContain(имя);
        expect(await page.locator('.ad-confirm-text b').count()).toBe(0);
    });

    test('спрос снятия называет и потерю, и обратимость', async ({ page }) => {
        await спрос(page, 'snyat');
        expect(await page.locator('.ad-confirm-title').innerText()).toBe('Снять с публикации?');
        const тело = await page.locator('.ad-confirm-text').innerText();
        expect(тело).toContain('исчезнет с сайта');
        /* СНЯТИЕ НИЧЕГО НЕ УДАЛЯЕТ, И ОБ ЭТОМ СКАЗАНО В ТЕКСТЕ: без этой
           строки менеджер читает снятие как потерю заявок и сетки. */
        expect(тело).toContain('останутся');
        expect(тело).toMatch(/вернуть можно/i);
    });

    test('подпись согласия — полная, а не короткая подпись кнопки строки', async ({ page }) => {
        await спрос(page, 'snyat');
        /* НА КНОПКЕ СТРОКИ СТОИТ «Снять» — иначе колонка распирает таблицу.
           В окне места хватает, и человек читает, ЧТО подтверждает. */
        expect(await page.locator('#adConfirmOk').innerText()).toBe('Снять с публикации');
        await спрос(page, 'opublikovat');
        expect(await page.locator('#adConfirmOk').innerText()).toBe('Опубликовать');
    });

    test('длинное название не распирает окно спроса и не уводит его за край', async ({ page }) => {
        await спрос(page, 'snyat');
        const м = await page.evaluate(() => {
            const окно = document.querySelector('.ad-confirm-modal');
            const к = окно.getBoundingClientRect();
            return { ширина: Math.round(к.width), слева: Math.round(к.left),
                     справа: Math.round(к.right), экран: window.innerWidth,
                     перелив: окно.scrollWidth - окно.clientWidth };
        });
        /* ОКНО СПРОСА — ступень `sm` 400 по компоненту `Modal 26:143`: поле
           здесь одно, текст. Шире — значит название распёрло окно. */
        expect(м.ширина).toBeLessThanOrEqual(400);
        expect(м.слева).toBeGreaterThanOrEqual(0);
        expect(м.справа).toBeLessThanOrEqual(м.экран);
        expect(м.перелив).toBe(0);
    });

    test('Escape закрывает спрос, и отказ приходит ответом', async ({ page }) => {
        /* ОТКАЗ — ПОЛНОПРАВНЫЙ ИСХОД: `showConfirmAsync` отдаёт `false`, и
           раздел не трогает базу. В стенде у клиента нет ни `update`, ни
           `insert` вовсе — писать было бы нечем, и это сказано вслух.
           ОКНО ОТКРЫВАЕТСЯ ОДНО: второе снесло бы первое своей же
           оболочкой, и ответ пришёл бы от снесённого. */
        const обещание = page.evaluate(() => window.показатьСпрос('snyat'));
        await page.waitForSelector('.ad-confirm-modal', { timeout: 10000 });
        await page.keyboard.press('Escape');
        expect(await обещание).toBe(false);
        expect(await page.locator('.ad-confirm-modal').count()).toBe(0);
    });
});
