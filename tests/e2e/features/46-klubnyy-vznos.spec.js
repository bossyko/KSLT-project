/**
 * КЛУБНЫЙ ВЗНОС — ЗА КОРТ, А НЕ ЗА КНОПКУ (Ю14, 10.11.2026).
 *
 * ЧТО ПРОВЕРЯЕТСЯ И ПОЧЕМУ ИМЕННО ЭТО. Правило Apple 3.1.1 требует
 * встроенной покупки за «features or functionality WITHIN YOUR APP», а
 * 3.1.3(e) ЗАПРЕЩАЕТ её для услуг, потребляемых вне приложения. Взнос
 * КСЛТ покупает корт, турнир и тренера — значит в приложении не должно
 * быть ни способа оплаты, ни цены на витрине Apple, ни обещаний цифровых
 * функций за деньги.
 *
 * ПЛАТФОРМА ПОДМЕНЯЕТСЯ ДО ЗАГРУЗКИ, А НЕ ПОСЛЕ. `KSLT_PLATFORMA`
 * вычисляется один раз при разборе файла: подмена вдогонку проверила бы
 * не продукт, а собственную подмену. Capacitor ставится `addInitScript`,
 * то есть раньше любого нашего кода, ровно как это делает нативный мост.
 *
 * ПРОБА НАЖИМАЕТ, А НЕ ЗОВЁТ. Окно открывается кнопкой меню, как у
 * человека: ПРОБА, КОТОРАЯ СОЗДАЁТ СВОЁ ОКНО, ПРОВЕРЯЕТ ДОМ, А НЕ ПРОДУКТ.
 */
const { test, expect } = require('../../fixtures');
const { нажатьСквозьПомехи } = require('../../pomoshniki/nazhatie');

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

/* ЯЗЫК ОДИН, И ЭТО ЗАМЕР, А НЕ ЛЕНЬ. Приложение зафиксировано на русском:
   `mobile/www/js/i18n.js:30` — `I18N.ОДИН_ЯЗЫК = 'ru'`, и строка 1127
   гасит переключение. Проба по трём языкам трижды проверила бы русский и
   отчиталась бы за три. ПРОВЕРКА, КОТОРАЯ НЕ МОЖЕТ ОТЛИЧИТЬ ТРИ ОТ ОДНОГО,
   ОТЧИТЫВАЕТСЯ ЗА ТРИ. Когда языки вернут — здесь появится перебор, и
   правило ниже упадёт само. */
const ОДИН_ЯЗЫК = 'ru';

/* ЗНАКОМСТВО — ЭТО СОСТОЯНИЕ, А НЕ ОКНО: отметка ставится до первой
   загрузки, иначе окно встаёт поверх и забирает все нажатия (куска 200). */
async function открытьВзнос(page, { платформа } = {}) {
    await page.addInitScript(п => {
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
        if (п) window.Capacitor = { getPlatform: function () { return п; }, Plugins: {} };
    }, платформа || null);

    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => !!window.KSLT_PLATFORMA, null, { timeout: 20000 });
    await page.evaluate(() => {
        ['.onb-overlay', '.splash-overlay', '#onboarding'].forEach(с =>
            document.querySelectorAll(с).forEach(э => { э.style.display = 'none'; }));
    });
    await page.waitForFunction(
        () => !!document.getElementById('menuPricing'), null, { timeout: 20000 });

    /* ЭКРАН ВХОДА СТОИТ ПОВЕРХ, ПОКА БАЗА НЕ ОТВЕТИЛА (`index.html:436`).
       Проба идёт гостем, ответа ждать неоткуда, и все 25 прогонов 10.11
       легли именно здесь — 90 секунд на нажатии по кнопке меню.
       Помощник спрашивает у браузера, КТО принимает нажатие, закрывает
       помеху её же кнопкой и говорит вслух, что убрал. */
    const помехиМеню = await нажатьСквозьПомехи(page, '#menuBtn');
    await page.waitForFunction(
        () => { const м = document.getElementById('menuOverlay');
                return !!м && м.classList.contains('open'); }, null, { timeout: 10000 });
    const помехиПункта = await нажатьСквозьПомехи(page, '#menuPricing');
    const помехи = помехиМеню.concat(помехиПункта);
    if (помехи.length) console.log('помехи на пути к окну взноса: ' + помехи.join(' | '));
    await page.waitForSelector('#infoOverlay', { timeout: 10000 });
    return page.evaluate(() => {
        const о = document.getElementById('infoOverlay');
        return {
            язык: (window.I18N && (window.I18N.ОДИН_ЯЗЫК || window.I18N.lang)) || '?',
            платформа: window.KSLT_PLATFORMA.имя,
            ценуПоказываем: window.KSLT_PLATFORMA.ценуПоказываем(),
            текст: о.textContent.replace(/\s+/g, ' ').trim(),
            ссылок: о.querySelectorAll('a[href]').length,
            адреса: [...о.querySelectorAll('a[href]')].map(a => a.getAttribute('href')),
        };
    });
}

test.describe.configure({ timeout: 90000 });

test.describe('Клубный взнос — за корт, а не за кнопку', () => {

    test('на витрине Apple нет ни цены, ни способа оплаты', async ({ page }) => {
        {
            const о = await открытьВзнос(page, { платформа: 'ios' });

            /* ПРОБА НАЗЫВАЕТ, НА ЧЁМ МЕРИЛА: если языки вернут, а пробу
               забудут — упадёт здесь, а не промолчит. */
            expect(о.язык, 'приложение всё ещё на одном языке; вернули языки — верните и перебор')
                .toBe(ОДИН_ЯЗЫК);
            expect(о.платформа, 'подмена платформы дошла до продукта').toBe('ios');
            expect(о.ценуПоказываем, 'на iOS цена не показывается').toBe(false);

            /* ЦЕНА ИЩЕТСЯ ЧИСЛОМ, А НЕ КЛАССОМ: класс можно переименовать,
               а тысяча сомов останется тысячей сомов. */
            expect(о.текст, 'цены на экране нет').not.toMatch(/1\s*000/);
            expect(о.адреса.join(' '), 'ссылки на оплату нет').not.toMatch(/t\.me|wa\.me|whatsapp/i);
        }
    });

    test('в браузере цена остаётся: правило про витрину Apple, а не про деньги', async ({ page }) => {
        const о = await открытьВзнос(page);
        expect(о.платформа, 'без моста это браузер').toBe('web');
        expect(о.ценуПоказываем).toBe(true);
        expect(о.текст, 'в браузере цена видна').toMatch(/1\s*000/);
    });

    test('на Android цена тоже остаётся', async ({ page }) => {
        const о = await открытьВзнос(page, { платформа: 'android' });
        expect(о.платформа).toBe('android');
        expect(о.текст, 'правила App Store не распространяются на Play').toMatch(/1\s*000/);
    });

    test('выгоды взноса не обещают цифровых функций', async ({ page }) => {
        {
            const о = await открытьВзнос(page, { платформа: 'ios' });
            const запрещено = [
                [/рейтинг|rating|рейтингди/i, 'рейтинг открыт всем вошедшим'],
                [/систем[аы] вызов|challenge system|чакыруу системасы/i, 'вызовы открыты всем'],
                [/лояльност|loyalty|лоялдуул/i, 'баллы ничем не закрыты'],
            ];
            const найдено = запрещено
                .filter(([re]) => re.test(о.текст))
                .map(([, почему]) => почему);
            expect(найдено, 'обещаний цифровых функций за деньги нет: ' + найдено.join('; ')).toEqual([]);
        }
    });

    test('вместо способа оплаты сказано, где оформляется взнос', async ({ page }) => {
        const о = await открытьВзнос(page, { платформа: 'ios' });
        expect(о.текст, 'человек не остался без ответа «а как вступить»')
            .toMatch(/в клубе/i);
    });
});
