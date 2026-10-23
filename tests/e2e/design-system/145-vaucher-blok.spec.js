/**
 * КУСОК 145 — ВАУЧЕРНЫЙ БЛОК ОДИН НА ПРОДУКТ.
 *
 * ВЕСЬ ПУТЬ ВАУЧЕРА ЗА ЧЛЕНСТВОМ, и входа в кабинет у пробы нет. Поэтому
 * проба гоняет НАСТОЯЩИЙ дом `js/kslt-vaucher-blok.js` на стенде
 * `maket/stend-vaucher-blok.html` с подставным клиентом базы: в базу
 * ничего не пишется, `generate_voucher` отвечает заготовкой. Это сказано
 * вслух, а не выдано за живой экран.
 *
 * СТЕНД НЕУДОБНЫЙ НАМЕРЕНО: имя услуги с кавычками и амперсандом, имя
 * длиннее строки, лимиты, отказ базы, история из трёх состояний и
 * отсутствие библиотеки QR.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/stend-vaucher-blok.html';
const адрес = (сост, пр, яз) => СТЕНД + '?sost=' + сост + '&pr=' + пр + '&yaz=' + яз;

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_VAUCHER_BLOK && !!window.СТЕНД,
        null, { timeout: 15000 });
}

test.describe('ваучерный блок сведён в дом', () => {

    test('одна услуга: ваучер заводится без выбора, кнопка возвращается', async ({ page }) => {
        await page.goto(адрес('odna', 'ct', 'ru'));
        await дом(page);

        const м = await page.evaluate(async () => {
            const кнопка = document.getElementById('stCta');
            const былТекст = кнопка.textContent;
            кнопка.click();
            await new Promise(ок => setTimeout(ок, 900));
            const в = document.getElementById('ctVoucherModal');
            return {
                выбораНет: !document.getElementById('ctPickerModal'),
                окно: !!в,
                процент: в ? в.querySelector('.ct-voucher-percent').textContent : null,
                строк: в ? в.querySelectorAll('.ct-voucher-row').length : 0,
                qr: в ? !!в.querySelector('.ct-voucher-qr canvas') : false,
                кнопкаВернулась: кнопка.textContent === былТекст,
                нажатияВернулись: кнопка.style.pointerEvents === ''
            };
        });

        expect(м.выбораНет, 'при одной услуге выбор спрашивать не за что').toBe(true);
        expect(м.окно, 'окно ваучера не открылось').toBe(true);
        expect(м.процент, 'процент скидки взят не из услуги').toBe('-10%');
        expect(м.строк, 'в окне не четыре строки деталей').toBe(4);
        expect(м.qr, 'QR не нарисовался').toBe(true);
        expect(м.кнопкаВернулась, 'кнопка осталась с «...»').toBe(true);
        expect(м.нажатияВернулись, 'кнопка осталась ненажимаемой').toBe(true);
    });

    test('три услуги: выбор работает, экранирование на месте, процент берётся выбранный', async ({ page }) => {
        await page.goto(адрес('mnogo', 'co', 'ru'));
        await дом(page);

        const м = await page.evaluate(async () => {
            document.getElementById('stCta').click();
            await new Promise(ок => setTimeout(ок, 700));
            const п = document.getElementById('coPickerModal');
            const снято = {
                пунктов: п.querySelectorAll('.co-picker-option').length,
                выбранПервый: п.querySelectorAll('.co-picker-option')[0].classList.contains('selected'),
                /* ЭКРАНИРОВАНИЕ ПРОВЕРЯЕТСЯ ЦЕЛОСТНОСТЬЮ ИМЕНИ, А НЕ
                   ВИДОМ РАЗМЕТКИ. Первая запись пробы требовала `&quot;` в
                   `innerHTML` — и это ошибка прибора: браузер отдаёт
                   кавычку в тексте как есть, экранируй её или нет.
                   Настоящий признак: имя с кавычками и амперсандом дошло
                   до экрана ЗНАК В ЗНАК и не порвало разметку. */
                имяВторой: п.querySelectorAll('.co-picker-label')[1].textContent,
                амперсандГашен: п.innerHTML.indexOf('&amp;') !== -1
            };
            п.querySelectorAll('.co-picker-option')[1].click();
            снято.переключилось = п.querySelectorAll('.co-picker-option.selected').length === 1 &&
                п.querySelectorAll('.co-picker-option')[1].classList.contains('selected');
            п.querySelector('.co-picker-submit').click();
            await new Promise(ок => setTimeout(ок, 900));
            const в = document.getElementById('coVoucherModal');
            снято.выборУбран = !document.getElementById('coPickerModal');
            снято.процент = в ? в.querySelector('.co-voucher-percent').textContent : null;
            return снято;
        });

        expect(м.пунктов, 'в выборе не три услуги').toBe(3);
        expect(м.выбранПервый, 'первая услуга не выбрана заранее').toBe(true);
        expect(м.имяВторой, 'имя с кавычками и амперсандом дошло не знак в знак')
            .toBe('Тренировка с "кавычками" & амперсандом');
        expect(м.амперсандГашен, 'амперсанд не экранирован — разметка держится на удаче').toBe(true);
        expect(м.переключилось, 'выбор не переключился на вторую услугу').toBe(true);
        expect(м.выборУбран, 'окно выбора осталось на экране').toBe(true);
        expect(м.процент, 'процент взят не у выбранной услуги').toBe('-15%');
    });

    test('дневной лимит: своё окно на языке страницы, и оно закрывается', async ({ page }) => {
        await page.goto(адрес('limit-daily', 'co', 'kg'));
        await дом(page);

        const м = await page.evaluate(async () => {
            document.getElementById('stCta').click();
            await new Promise(ок => setTimeout(ок, 700));
            const п = document.getElementById('coPickerModal');
            if (п) п.querySelector('.co-picker-submit').click();
            await new Promise(ок => setTimeout(ок, 800));
            const л = document.getElementById('coLimitModal');
            const снято = л ? {
                заголовок: л.querySelector('.co-voucher-title').textContent.trim(),
                пояснение: л.querySelector('p').textContent.trim(),
                ok: !!document.getElementById('coLimitOk')
            } : null;
            if (л) document.getElementById('coLimitOk').click();
            await new Promise(ок => setTimeout(ок, 300));
            return { снято: снято, убралось: !document.getElementById('coLimitModal'),
                     ваучераНет: !document.getElementById('coVoucherModal') };
        });

        expect(м.снято, 'окно лимита не открылось').not.toBeNull();
        expect(м.снято.заголовок, 'заголовок лимита не на кыргызском').toBe('Күнүмдүк лимит');
        expect(м.снято.пояснение.length, 'лимит не объясняет, что делать').toBeGreaterThan(20);
        expect(м.снято.ok, 'кнопки OK нет').toBe(true);
        expect(м.ваучераНет, 'при лимите открылся ваучер').toBe(true);
        expect(м.убралось, 'окно лимита не убралось').toBe(true);
    });

    test('отказ базы: ни ваучера, ни лимита — уведомление', async ({ page }) => {
        await page.goto(адрес('otkaz', 'co', 'en'));
        await дом(page);

        const м = await page.evaluate(async () => {
            document.getElementById('stCta').click();
            await new Promise(ок => setTimeout(ок, 700));
            const п = document.getElementById('coPickerModal');
            if (п) п.querySelector('.co-picker-submit').click();
            await new Promise(ок => setTimeout(ок, 900));
            const ярлык = document.querySelector('.kslt-toasts');
            return {
                ваучераНет: !document.getElementById('coVoucherModal'),
                лимитаНет: !document.getElementById('coLimitModal'),
                текст: ярлык ? ярлык.textContent.trim() : ''
            };
        });

        expect(м.ваучераНет, 'при отказе базы открылся ваучер').toBe(true);
        expect(м.лимитаНет, 'при отказе базы открылось окно лимита').toBe(true);
        expect(м.текст, 'отказ базы ничего не сказал человеку').toContain('Membership');
    });

    test('история: три состояния, QR только у действующего, окно из истории', async ({ page }) => {
        await page.goto(адрес('istoriya', 'co', 'ru'));
        await дом(page);
        await page.waitForSelector('.co-vh-item', { timeout: 15000 });

        const м = await page.evaluate(async () => {
            const строки = [...document.querySelectorAll('.co-vh-item')].map(с => ({
                состояние: с.querySelector('[class*="vh-status"]').className,
                кнопка: !!с.querySelector('.co-vh-qr-btn')
            }));
            const кнопка = document.querySelector('.co-vh-qr-btn');
            /* ОБРАТНЫЙ ПУТЬ ЧЕРЕЗ АТРИБУТ. Действующий ваучер на стенде —
               именно у услуги с кавычками и амперсандом: имя уходит в
               `data-service` экранированным и должно вернуться знак в
               знак. Пока действующей была простая услуга, этот путь не
               проверялся вовсе. */
            const изАтрибута = { услуга: кнопка.dataset.service, заведение: кнопка.dataset.entity };
            кнопка.click();
            await new Promise(ок => setTimeout(ок, 800));
            const в = document.getElementById('coVoucherModal');
            return {
                строк: строки.length,
                состояния: строки.map(с => с.состояние),
                кнопок: строки.filter(с => с.кнопка).length,
                окно: !!в,
                qr: в ? !!в.querySelector('canvas') : false,
                изАтрибута: изАтрибута,
                вОкне: в ? в.querySelectorAll('.co-voucher-row')[0].textContent : null
            };
        });

        expect(м.строк, 'в истории не три строки').toBe(3);
        expect(м.состояния[0], 'первая строка не действующая').toContain('co-vh-status-active');
        expect(м.состояния[1], 'вторая строка не использованная').toContain('co-vh-status-used');
        /* СРОК РЕШАЕТ, А НЕ ПОЛЕ: у третьей строки в базе `active`, но срок
           истёк — и на экране она истёкшая. */
        expect(м.состояния[2], 'истёкший срок не пересилил поле состояния')
            .toContain('co-vh-status-expired');
        expect(м.кнопок, 'кнопка QR есть не только у действующего').toBe(1);
        expect(м.окно, 'окно ваучера из истории не открылось').toBe(true);
        expect(м.qr, 'QR в окне из истории не нарисовался').toBe(true);
        expect(м.изАтрибута.услуга, 'имя услуги не вернулось из атрибута знак в знак')
            .toBe('Тренировка с "кавычками" & амперсандом');
        expect(м.изАтрибута.заведение, 'название заведения не вернулось из атрибута')
            .toBe('Пансионат «Мурас» & "Витязь"');
        expect(м.вОкне, 'в окне из истории имя услуги потеряно')
            .toContain('Тренировка с "кавычками" & амперсандом');
    });

    test('без библиотеки QR: надпись на языке страницы и без инлайна', async ({ page }) => {
        await page.goto(адрес('net-qr', 'co', 'kg'));
        await дом(page);
        await page.waitForSelector('.co-vh-qr-btn', { timeout: 15000 });

        const м = await page.evaluate(async () => {
            document.querySelector('.co-vh-qr-btn').click();
            await new Promise(ок => setTimeout(ок, 700));
            const в = document.getElementById('coVoucherModal');
            const коробка = в ? в.querySelector('.co-voucher-qr') : null;
            return {
                окно: !!в,
                холста: коробка ? !!коробка.querySelector('canvas') : null,
                надпись: коробка ? коробка.textContent.trim() : '',
                инлайн: коробка ? коробка.innerHTML.indexOf('style=') !== -1 : null,
                скачать: !!document.getElementById('coVoucherDownload')
            };
        });

        expect(м.окно, 'окно не открылось без библиотеки QR').toBe(true);
        expect(м.холста, 'холст QR взялся без библиотеки').toBe(false);
        expect(м.надпись.length, 'коробка QR осталась пустой МОЛЧА').toBeGreaterThan(10);
        expect(м.надпись, 'надпись не на кыргызском').toContain('QR');
        expect(м.надпись, 'надпись по-английски').toMatch(/тартылбай|көрсөтүңүз/);
        expect(м.инлайн, 'в надписи инлайн-стиль').toBe(false);
        expect(м.скачать, 'кнопка скачивания исчезла').toBe(true);
    });
});
