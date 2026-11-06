// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-FOKUS: фокус доезжает в окно (06.11).
 *
 * ЗАЧЕМ. Кусок A4 считался закрытым — четыре сторожа зелёные, проба 28
 * проходила. Замер 06.11 по живому приложению: из ОДИННАДЦАТИ окон
 * разметки ШЕСТЬ не получали фокус вообще, и он не приходил даже через
 * полсекунды. У них `visibility` стоит в переходе и держится `hidden`
 * все 0.25 с, а `focus()` на скрытом элементе не делает ничего.
 *
 * СТОРОЖ ВИДИТ, ЧТО ОСНАСТКА НАПИСАНА, И НЕ ВИДИТ, ЧТО ОНА НЕ ДОЕХАЛА.
 * Вот эта проба и смотрит, доехала ли: куда встал фокус, вернулся ли он
 * тому, кто окно открыл, и не растёт ли стопка открытых.
 *
 * ОКНА ОТКРЫВАЮТСЯ ПОСТАНОВКОЙ КЛАССА, как это делает продукт, — базу
 * проба не трогает и кнопок, пишущих в базу, не нажимает.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

/* Окна, которые живут в разметке. Четыре окна дома (приглашения, h2h,
   возврат учётной записи, онбординг) рисуются js по месту — их проверяет
   проба своего куска. */
const ОКНА = [
    'td-overlay', 'otp-overlay', 'notif-overlay', 'bottom-sheet-overlay',
    'menu-overlay', 'live-full', 'otp-pw-overlay', 'tg-reg-overlay',
    'push-prime-overlay'
];

async function дождатьсяДома(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.KSLT_OKNO, null, { timeout: 20000 });
    return ошибки;
}

/**
 * Открыть окно и дождаться, пока оно СТАНЕТ ВИДНО.
 *
 * Ждать появления класса мало: у шести окон `visibility` переключается
 * переходом, и ровно в этом зазоре фокус и терялся. Проба, которая
 * мерит раньше времени, врёт так же, как сжатое окно вместо загрузки на
 * нужной ширине.
 */
async function открыть(page, класс) {
    await page.evaluate((к) => {
        let кн = document.getElementById('ктоОткрыл');
        if (!кн) {
            кн = document.createElement('button');
            кн.id = 'ктоОткрыл';
            кн.textContent = 'открыть';
            document.body.appendChild(кн);
        }
        кн.focus();
        document.querySelector('.' + к).classList.add('open');
    }, класс);
    await page.waitForFunction((к) => {
        const у = document.querySelector('.' + к);
        return !!у && getComputedStyle(у).visibility === 'visible';
    }, класс, { timeout: 5000 });
    await page.waitForTimeout(120);
}

async function закрыть(page, класс) {
    await page.evaluate((к) => document.querySelector('.' + к).classList.remove('open'), класс);
    await page.waitForTimeout(150);
}

test.describe('Фокус доезжает в окно', () => {

    for (const класс of ОКНА) {
        test('фокус внутри окна · ' + класс, async ({ page }) => {
            const ошибки = await дождатьсяДома(page);
            await открыть(page, класс);

            const где = await page.evaluate((к) => {
                const у = document.querySelector('.' + к);
                const а = document.activeElement;
                return {
                    внутри: у.contains(а),
                    наОткрывшем: а && а.id === 'ктоОткрыл',
                    кто: а ? (a => a.id || a.className || a.tagName)(а) : '—',
                    вСтопке: window.KSLT_OKNO.открытые()
                };
            }, класс);

            expect(где.наОткрывшем, 'фокус остался снаружи, на ' + где.кто).toBe(false);
            expect(где.внутри, 'фокус встал на ' + где.кто + ', а это не внутри окна').toBe(true);
            /* ОДНО ОКНО — ОДНА ЗАПИСЬ. Здесь стоял `стопка.indexOf(узел)`
               по записям `{окно, открывший}`: поиск не находил ничего, и
               окно ложилось в стопку дважды. */
            expect(где.вСтопке, 'записей в стопке дома при одном окне').toBe(1);

            await закрыть(page, класс);
            const после = await page.evaluate(() => ({
                наОткрывшем: document.activeElement && document.activeElement.id === 'ктоОткрыл',
                вСтопке: window.KSLT_OKNO.открытые()
            }));
            expect(после.наОткрывшем, 'после закрытия фокус не вернулся открывшему').toBe(true);
            expect(после.вСтопке, 'стопка после закрытия').toBe(0);
            expect(ошибки, 'ошибки страницы').toEqual([]);
        });
    }

    test('фокус не уходит в окно, которое успели закрыть', async ({ page }) => {
        await дождатьсяДома(page);
        /* Открыть и тут же закрыть — дом ждёт видимости, и к моменту
           ожидания окна уже нет. ФОКУС В ЗАКРЫТОЕ ОКНО — ЭТО ФОКУС В
           НИКУДА: следующий Tab уходит читать страницу под ним. */
        await page.evaluate(() => {
            const кн = document.createElement('button');
            кн.id = 'ктоОткрыл';
            document.body.appendChild(кн);
            кн.focus();
            const у = document.querySelector('.otp-overlay');
            у.classList.add('open');
            у.classList.remove('open');
        });
        await page.waitForTimeout(600);
        const о = await page.evaluate(() => ({
            наОткрывшем: document.activeElement && document.activeElement.id === 'ктоОткрыл',
            вСтопке: window.KSLT_OKNO.открытые()
        }));
        expect(о.наОткрывшем, 'фокус уехал в закрытое окно').toBe(true);
        expect(о.вСтопке, 'стопка после открытия-закрытия').toBe(0);
    });

    test('Esc закрывает верхнее окно и возвращает фокус', async ({ page }) => {
        await дождатьсяДома(page);
        await открыть(page, 'otp-overlay');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(300);
        const о = await page.evaluate(() => ({
            открытых: document.querySelectorAll('.otp-overlay.open').length,
            вСтопке: window.KSLT_OKNO.открытые()
        }));
        expect(о.открытых, 'окон открыто после Esc').toBe(0);
        expect(о.вСтопке, 'стопка после Esc').toBe(0);
    });
});
