// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ОСНАСТКА ОКОН — ОДИН ЗОВ ВМЕСТО ЧЕТЫРЁХ ПРАВОК. Кусок 156, 24.10.
 *
 * ЧТО БЫЛО. Запись говорила «шесть окон без запирания», потому что я нашёл
 * их обходом двух экранов. Прибор по признаку дал ОКОН 40, БЕЗ ЗАПИРАНИЯ 32,
 * НА 87 СТРАНИЦАХ. Шестнадцать публичных взяли у дома `оснастить`.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и говорит,
 * что зов стоит. Он не может сказать, что Tab НА ЖИВОМ ЭКРАНЕ остался в
 * окне, что Escape закрыл, что фокус вернулся на кнопку, с которой окно
 * открыли, и что диктор прочтёт заголовок. Вся цена куска именно в этом.
 *
 * ОКНО ДОСТАЁТСЯ ПУТЁМ ПРОДУКТА, А НЕ ПОДДЕЛКОЙ КОДА:
 *   A · окно «войдите, чтобы записаться» — зовом `KSLT_REG.предложитьВойти`,
 *       то есть ровно так, как его зовёт кнопка записи. Прямая зависимость
 *       от турнира с открытой записью была бы зависимостью от ДАННЫХ: такой
 *       турнир в базе один, и завтра его может не быть.
 *   B · ворота профиля на странице игрока — САМИ, без нажатия: это
 *       единственное окно продукта, которое открывается гостю при загрузке.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155, где прогон дал 525 вместо 105:
 * пять видов даёт `playwright.config.js` проектами, и они несут не только
 * ширину, но и `hasTouch` с `isMobile`. ПРОБА, ЗАДАЮЩАЯ ВИД САМА, ОТМЕНЯЕТ
 * ВИД ПРОЕКТА.
 */

const ЯЗЫКИ = [
    { имя: 'ru', турнир: '/pages/tournament.html',    игрок: '/pages/player.html' },
    { имя: 'en', турнир: '/pages/tournament-en.html', игрок: '/pages/player-en.html' },
    { имя: 'kg', турнир: '/pages/tournament-kg.html', игрок: '/pages/player-kg.html' }
];
const ИГРОК = 'ermek-abakirov';

async function открыть(page, адрес, признак) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    if (признак) await page.waitForFunction(признак, null, { timeout: 20000 });
    return беды;
}

for (const я of ЯЗЫКИ) {

    test(`A · окно записи: роль, подпись, фокус внутрь · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турнир + '?id=нет&proba=156a',
            () => !!(window.KSLT_FOKUS && window.KSLT_FOKUS.оснастить && window.KSLT_REG));
        /* Фокус ставится на заметный узел страницы: именно на него оснастка
           обязана вернуть фокус при закрытии. */
        await page.evaluate(() => {
            var я = document.querySelector('a[href], button');
            if (я) я.focus();
            window.__ksltОткуда = document.activeElement;
            window.KSLT_REG.предложитьВойти(false, false);
        });
        const о = await page.evaluate(() => {
            var п = document.querySelector('.trn-register-modal-overlay');
            var id = п && п.getAttribute('aria-labelledby');
            var з = id && document.getElementById(id);
            return {
                открыто: !!п,
                домЗнает: window.KSLT_FOKUS.открытых(),
                role: п && п.getAttribute('role'),
                ariaModal: п && п.getAttribute('aria-modal'),
                подпись: з ? з.textContent.trim() : null,
                фокусВОкне: п ? п.contains(document.activeElement) : null
            };
        });
        expect(о.открыто).toBe(true);
        expect(о.домЗнает).toBe(1);
        expect(о.role).toBe('dialog');
        expect(о.ariaModal).toBe('true');
        /* ПОДПИСЬ — НАСТОЯЩИЙ ЗАГОЛОВОК ОКНА, а не строка, написанная
           второй раз: дом связывает `aria-labelledby` с тем, что уже есть. */
        expect(о.подпись).toBeTruthy();
        expect(о.фокусВОкне).toBe(true);
        expect(беды).toEqual([]);
    });

    test(`A2 · Tab не уходит под окно, Escape закрывает, фокус возвращается · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.турнир + '?id=нет&proba=156a2',
            () => !!(window.KSLT_FOKUS && window.KSLT_FOKUS.оснастить && window.KSLT_REG));
        const откуда = await page.evaluate(() => {
            var я = document.querySelector('a[href], button');
            if (я) { я.focus(); я.setAttribute('data-проба-откуда', '1'); }
            window.KSLT_REG.предложитьВойти(false, false);
            return document.querySelector('[data-проба-откуда]') ? 'есть' : 'нет';
        });
        expect(откуда).toBe('есть');

        /* ПЯТЬ НАЖАТИЙ TAB: в окне фокусируемых два, значит на пятом Tab
           кольцо обязано замкнуться, а не уехать под окно. */
        for (let i = 0; i < 5; i++) {
            await page.keyboard.press('Tab');
            const вОкне = await page.evaluate(() => {
                var п = document.querySelector('.trn-register-modal-overlay');
                return п ? п.contains(document.activeElement) : null;
            });
            expect(вОкне).toBe(true);
        }

        await page.keyboard.press('Escape');
        await page.waitForTimeout(500);
        const после = await page.evaluate(() => ({
            окноЕсть: !!document.querySelector('.trn-register-modal-overlay'),
            домЗнает: window.KSLT_FOKUS.открытых(),
            фокусВернулся: !!(document.activeElement &&
                document.activeElement.getAttribute &&
                document.activeElement.getAttribute('data-проба-откуда'))
        }));
        expect(после.окноЕсть).toBe(false);
        expect(после.домЗнает).toBe(0);
        /* ВОЗВРАТ ФОКУСА — ТО, ЧЕГО НЕ БЫЛО НИ У ОДНОГО ИЗ ШЕСТНАДЦАТИ ОКОН. */
        expect(после.фокусВернулся).toBe(true);
    });

    test(`B · ворота профиля открываются сами и тоже оснащены · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.игрок + '?id=' + ИГРОК + '&proba=156b',
            () => !!document.querySelector('.pt-modal-overlay'));
        const о = await page.evaluate(() => {
            var п = document.querySelector('.pt-modal-overlay');
            var id = п && п.getAttribute('aria-labelledby');
            var з = id && document.getElementById(id);
            return {
                домЗнает: window.KSLT_FOKUS.открытых(),
                role: п && п.getAttribute('role'),
                ariaModal: п && п.getAttribute('aria-modal'),
                подпись: з ? з.textContent.trim() : null,
                фокусВОкне: п ? п.contains(document.activeElement) : null
            };
        });
        expect(о.домЗнает).toBeGreaterThan(0);
        expect(о.role).toBe('dialog');
        expect(о.ariaModal).toBe('true');
        expect(о.подпись).toBeTruthy();
        /* ОКНО ОТКРЫЛОСЬ САМО, БЕЗ НАЖАТИЯ — и фокус всё равно обязан быть
           внутри: под ним лежит вся публичная страница игрока. */
        expect(о.фокусВОкне).toBe(true);
        expect(беды).toEqual([]);
    });

    test(`C · стек не течёт: открыли, закрыли, открыли снова · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.турнир + '?id=нет&proba=156c',
            () => !!(window.KSLT_FOKUS && window.KSLT_FOKUS.оснастить && window.KSLT_REG));
        const счёт = await page.evaluate(async () => {
            const пауза = м => new Promise(r => setTimeout(r, м));
            const R = window.KSLT_REG, F = window.KSLT_FOKUS;
            R.предложитьВойти(false, false);
            const первое = F.открытых();
            var п = document.querySelector('.trn-register-modal-overlay');
            p: { if (п && п.__ksltСнять) { п.__ksltСнять(); п.__ksltСнять = null; } }
            if (п) п.remove();
            await пауза(60);
            R.предложитьВойти(false, false);
            await пауза(60);
            return { первое: первое, второе: F.открытых() };
        });
        /* ЗАПИСЬ НА ОТКРЫТИЕ — ЭТО ТЕЧЬ СТЕКА, и её уже ловил кусок 153:
           дом идемпотентен по корню, но корень здесь КАЖДЫЙ РАЗ НОВЫЙ, и
           держит счёт снятие. */
        expect(счёт.первое).toBe(1);
        expect(счёт.второе).toBe(1);
    });

    test(`D · дом отдаёт оснастку на живой странице · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.игрок + '?id=' + ИГРОК + '&proba=156d', () => !!window.KSLT_FOKUS);
        const о = await page.evaluate(() => ({
            оснастить: typeof window.KSLT_FOKUS.оснастить,
            запереть: typeof window.KSLT_FOKUS.запереть,
            фокусируемые: typeof window.KSLT_FOKUS.фокусируемые
        }));
        expect(о.оснастить).toBe('function');
        expect(о.запереть).toBe('function');
        expect(о.фокусируемые).toBe('function');
    });
}
