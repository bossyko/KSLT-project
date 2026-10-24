// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ДАННЫЕ НЕ УХОДЯТ В РАЗМЕТКУ МИМО ДОМА. Кусок 157, 24.10.
 *
 * ЧТО БЫЛО. Запись говорила об ОДНОМ месте — его я нашёл чтением одного
 * окна. Прибор по признаку дал ТРИДЦАТЬ мест, где в разметку идёт то, что
 * пишет человек. Внедрение подтверждено НАЖАТИЕМ на живой странице:
 * `<b>весна</b>` в названии турнира стало ТЕГОМ, `<i>` тегом, узел `<img>`
 * создался. Обработчик я намеренно не ставил.
 *
 * ЧТО ЭТА ПРОБА ДЕРЖИТ, ЧЕГО НЕ МОЖЕТ СТОРОЖ. Сторож читает файлы и
 * говорит, что зов экранирования стоит. Он не может сказать, что НА ЖИВОМ
 * ЭКРАНЕ тег не родился, что амперсанд не удвоился в `&amp;` и что
 * намеренная разметка всё ещё работает разметкой. Старый сторож
 * экранирования был зелёным при всех тридцати дырах: ПРАВИЛО,
 * ПРОВЕРЯЮЩЕЕ ОРУДИЕ, НЕ ПРОВЕРЯЕТ ЕГО ПРИМЕНЕНИЯ.
 *
 * ДАННЫЕ ПОДДЕЛЫВАЮТСЯ, А НЕ КОД: окна зовутся путём продукта
 * (`KSLT_REG.notice`, `KSLT_REG.confirm`) с крайним именем — с кавычкой,
 * амперсандом и тегом, — как кусок 154 поймал это стендом.
 *
 * ВИДЫ ЗДЕСЬ НЕ ОБЪЯВЛЯЮТСЯ — урок куска 155.
 */

const ЯЗЫКИ = [
    { имя: 'ru', турнир: '/pages/tournament.html' },
    { имя: 'en', турнир: '/pages/tournament-en.html' },
    { имя: 'kg', турнир: '/pages/tournament-kg.html' }
];

/* КРАЙНЕЕ ИМЯ, А НЕ УДОБНОЕ: кавычка-ёлочка, амперсанд, тег с текстом
   внутри и тег-одиночка с атрибутом. Обработчика в нём нет намеренно. */
const КРАЙНЕЕ = 'Кубок «Ала-Тоо» & Co. <b>весна</b> 2026';
const КРАЙНИЙ_ТЕКСТ = 'Заметка: <i>курсив</i> и <img src="x" alt="подделка">';

async function открыть(page, адрес) {
    const беды = [];
    page.on('pageerror', e => беды.push('pageerror: ' + e.message));
    page.on('console', m => {
        const т = m.text();
        if (m.type() === 'error' && !/Failed to load resource|ERR_|supabase|401|403|406/i.test(т)) беды.push('console: ' + т);
    });
    await page.goto(адрес);
    await page.waitForFunction(() => !!(window.KSLT_REG && window.KSLT_экранировать),
        null, { timeout: 20000 });
    return беды;
}

for (const я of ЯЗЫКИ) {

    test(`A · окно уведомления: тег не родился, амперсанд не удвоился · ${я.имя}`, async ({ page }) => {
        const беды = await открыть(page, я.турнир + '?id=нет&proba=157a');
        const о = await page.evaluate(([имя, текст]) => {
            window.KSLT_REG.notice({ icon: '🎾', title: имя, text: текст }, false, false);
            var п = document.querySelector('.trn-register-modal-overlay');
            var з = п && п.querySelector('.trn-register-modal-title');
            var т = п && п.querySelector('.trn-register-modal-text');
            return {
                заголовок: з ? з.textContent : null,
                теговВокне: п ? п.querySelectorAll('b, i, img').length : null,
                текстВидимый: т ? т.textContent : null
            };
        }, [КРАЙНЕЕ, КРАЙНИЙ_ТЕКСТ]);
        /* ТЕГОВ НОЛЬ — значит разметка не родилась из данных. */
        expect(о.теговВокне).toBe(0);
        /* И ТЕКСТ ВИДЕН ЦЕЛИКОМ, вместе с угловыми скобками: человек должен
           прочесть то, что написали, а не потерять часть имени. */
        expect(о.заголовок).toContain('<b>весна</b>');
        expect(о.заголовок).toContain('«Ала-Тоо»');
        /* АМПЕРСАНД НЕ УДВОИЛСЯ: двойное экранирование — тоже беда, человек
           увидел бы `&amp;` вместо `&`. */
        expect(о.заголовок).toContain('& Co.');
        expect(о.заголовок).not.toContain('&amp;');
        expect(о.текстВидимый).toContain('<i>курсив</i>');
        expect(беды).toEqual([]);
    });

    test(`B · спрос: тег не родился ни в заголовке, ни в подписях кнопок · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.турнир + '?id=нет&proba=157b');
        const о = await page.evaluate(([имя]) => {
            window.KSLT_REG.confirm({
                icon: '🎾', title: имя, text: имя,
                okText: 'Снять <b>заявку</b>', cancelText: 'Отмена & выход', tone: 'error'
            });
            var п = document.querySelector('.trn-register-modal-overlay');
            var да = п && п.querySelector('[data-yes]');
            var нет = п && п.querySelector('[data-no]');
            var итог = {
                тегов: п ? п.querySelectorAll('b, i, img').length : null,
                подписьДа: да ? да.textContent : null,
                подписьНет: нет ? нет.textContent : null
            };
            if (нет) нет.click();     /* отвечаем ОТКАЗОМ: «да» пишет в базу */
            return итог;
        }, [КРАЙНЕЕ]);
        expect(о.тегов).toBe(0);
        expect(о.подписьДа).toContain('<b>заявку</b>');
        expect(о.подписьНет).toContain('& выход');
        expect(о.подписьНет).not.toContain('&amp;');
    });

    test(`C · намеренная разметка всё ещё работает разметкой · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.турнир + '?id=нет&proba=157c');
        const о = await page.evaluate(() => {
            /* `textHtml` — довод, НАЗВАННЫЙ разметкой: род значения в имени.
               Дом его не экранирует, и ответственность на зовущем. */
            window.KSLT_REG.notice({
                icon: '🎾', title: 'Заголовок',
                textHtml: 'Заявка на <b>Кубок</b> снята.'
            }, false, false);
            var п = document.querySelector('.trn-register-modal-overlay');
            var т = п && п.querySelector('.trn-register-modal-text');
            return { жирных: т ? т.querySelectorAll('b').length : null,
                     текст: т ? т.textContent : null };
        });
        /* ОДИН жирный — то есть разметка по замыслу не сломана правкой. */
        expect(о.жирных).toBe(1);
        expect(о.текст).toContain('Кубок');
        expect(о.текст).not.toContain('<b>');
    });

    test(`D · дом экранирования отвечает и гасит всё, что нужно · ${я.имя}`, async ({ page }) => {
        await открыть(page, я.турнир + '?id=нет&proba=157d');
        const о = await page.evaluate(() => {
            var э = window.KSLT_экранировать;
            return {
                тип: typeof э,
                кавычки: э('он сказал "да" и \'нет\''),
                скобки: э('<img src=x onerror=alert(1)>'),
                амперсанд: э('Ала-Тоо & Co.')
            };
        });
        expect(о.тип).toBe('function');
        /* ПЯТЬ СУЩНОСТЕЙ: обе кавычки, обе скобки и амперсанд — иначе
           экранирование слабое, и это держит сторож 141. */
        expect(о.кавычки).not.toContain('"');
        expect(о.кавычки).not.toContain("'");
        expect(о.скобки).not.toContain('<');
        expect(о.скобки).not.toContain('>');
        expect(о.амперсанд).toContain('&amp;');
    });
}
