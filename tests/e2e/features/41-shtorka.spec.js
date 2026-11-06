// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-SHTORKA: шторка приложения — один дом, одна поверхность (06.11).
 *
 * Окно с классом `pd-h2h-modal` собиралось тремя руками, и они уже
 * разошлись: роль руками у одной, `type`/`aria-label` у одной, заголовок
 * по-английски у третьей при живом ключе словаря. Поверхность окна была
 * определена трижды — 10,10,10 у шторки (тот же цвет, что страница под
 * ней), 17,17,17 у окна возврата, 30,30,30 у онбординга.
 *
 * Сторож `check-shtorka.js` читает файлы как текст: он видит, что дом
 * один и что токен прописан. Он НЕ видит, каким цветом окно встало,
 * какой высоты вышла кнопка и куда уехал фокус. Это работа прогона.
 *
 * БАЗУ ПРОБА НЕ ТРОГАЕТ: шторка зовётся прямо у дома, как это делает
 * продукт, кнопок, пишущих в базу, проба не нажимает.
 */

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождатьсяДома(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.KSLT_SHTORKA && !!window.KSLT_OKNO,
        null, { timeout: 20000 });
    await page.evaluate(() => document.documentElement.setAttribute('data-theme', 'dark'));
    return ошибки;
}

async function открыть(page, заголовок) {
    await page.evaluate((з) => {
        let кн = document.getElementById('ктоОткрыл');
        if (!кн) {
            кн = document.createElement('button');
            кн.id = 'ктоОткрыл';
            document.body.appendChild(кн);
        }
        кн.focus();
        window.KSLT_SHTORKA.окно({
            id: 'probaShtorka', заголовок: з,
            тело: '<div style="padding:16px">Иванов — Петров · 3:1</div>'
        });
    }, заголовок);
    /* ЖДЁМ КОНЦА ПЕРЕХОДА, А НЕ ПОЯВЛЕНИЯ УЗЛА: у листа стоит
       `translateY(100%)`, и размеры, снятые посреди пути, врут. */
    await page.waitForFunction(() => {
        const у = document.getElementById('probaShtorka');
        if (!у || !у.classList.contains('open')) return false;
        const к = у.querySelector('.pd-h2h-content');
        const t = getComputedStyle(к).transform;
        return t === 'none' || t === 'matrix(1, 0, 0, 1, 0, 0)';
    }, null, { timeout: 5000 });
}

test.describe('Шторка приложения', () => {

    test('поверхность окна светлее страницы под ним', async ({ page }) => {
        const ошибки = await дождатьсяДома(page);
        await открыть(page, 'Личные встречи');
        const ц = await page.evaluate(() => {
            const к = document.querySelector('#probaShtorka .pd-h2h-content');
            const сумма = s => s.match(/\d+/g).slice(0, 3).reduce((a, b) => a + Number(b), 0);
            return {
                окно: сумма(getComputedStyle(к).backgroundColor),
                страница: сумма(getComputedStyle(document.body).backgroundColor)
            };
        });
        /* ЗАМОРОЖЕНО ОТНОШЕНИЕ, А НЕ ЧИСЛО: окно светлее страницы, а не
           «окно равно 30,30,30». Сменится палитра — правило переживёт. */
        expect(ц.окно, 'окно ' + ц.окно + ', страница ' + ц.страница)
            .toBeGreaterThan(ц.страница);
        expect(ошибки, 'ошибки страницы').toEqual([]);
    });

    test('кнопка закрытия не мельче ступени 44 и подписана', async ({ page }) => {
        await дождатьсяДома(page);
        await открыть(page, 'Личные встречи');
        const к = await page.evaluate(() => {
            const b = document.querySelector('#probaShtorka .pd-h2h-close');
            const r = b.getBoundingClientRect();
            return { ш: Math.round(r.width), в: Math.round(r.height),
                     подпись: b.getAttribute('aria-label'), тип: b.getAttribute('type') };
        });
        expect(к.в, 'кнопка закрытия ' + к.ш + '×' + к.в).toBeGreaterThanOrEqual(44);
        expect(к.ш, 'кнопка закрытия ' + к.ш + '×' + к.в).toBeGreaterThanOrEqual(44);
        expect(к.подпись, 'подпись для диктора').toBeTruthy();
        /* Без `type="button"` нажатие внутри формы отправляет форму. */
        expect(к.тип, 'тип кнопки').toBe('button');
    });

    test('роль стоит один раз, подпись берётся из заголовка', async ({ page }) => {
        await дождатьсяДома(page);
        await открыть(page, 'Личные встречи');
        const о = await page.evaluate(() => {
            const у = document.getElementById('probaShtorka');
            return {
                подложка: у.getAttribute('role'),
                подпись: у.getAttribute('aria-label') || у.getAttribute('aria-labelledby'),
                коробка: у.querySelector('.pd-h2h-content').getAttribute('role'),
                фокусВнутри: у.contains(document.activeElement)
            };
        });
        expect(о.подложка).toBe('dialog');
        expect(о.подпись).toContain('Личные встречи');
        expect(о.коробка, 'роль на коробке — её ставит дом окон, а не шторка').toBeNull();
        expect(о.фокусВнутри, 'фокус внутри окна').toBe(true);
    });

    test('вторая шторка не копит ни узлы, ни стопку', async ({ page }) => {
        await дождатьсяДома(page);
        await открыть(page, 'Личные встречи');
        await открыть(page, 'Жалоба');
        const о = await page.evaluate(() => ({
            узлов: document.querySelectorAll('.pd-h2h-modal').length,
            вСтопке: window.KSLT_OKNO.открытые()
        }));
        expect(о.узлов, 'шторок в дереве').toBe(1);
        expect(о.вСтопке, 'окон в стопке дома').toBe(1);
    });

    test('Esc закрывает шторку', async ({ page }) => {
        await дождатьсяДома(page);
        await открыть(page, 'Личные встречи');
        await page.keyboard.press('Escape');
        await page.waitForTimeout(400);
        const осталось = await page.evaluate(() =>
            document.querySelectorAll('.pd-h2h-modal.open').length);
        expect(осталось, 'открытых шторок после Esc').toBe(0);
    });
});
