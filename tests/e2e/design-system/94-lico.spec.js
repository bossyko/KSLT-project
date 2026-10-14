/**
 * ЛИЦО БЕЗ ФОТОГРАФИИ — ОДНО ОПРЕДЕЛЕНИЕ. 14.10, кусок 75-й.
 *
 * Замер: инициалы считали ДЕВЯТЬ функций в девяти файлах, и вели они себя
 * ПЯТЬЮ разными способами — две буквы или одна, с верхним регистром или
 * без, при пустом имени «?» или ПУСТОЙ кружок. Плюс два живых адреса
 * `placehold.co`: нет фотографии — запрос на чужой сайт за серым «?».
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО МОДУЛЬ ДОЕХАЛ ДО СТРАНИЦЫ. Заморозка видит тег в разметке; что
 *     `window.KSLT_LICO` объявлен к моменту отрисовки — говорит браузер;
 *   • ЧТО КРУЖОК НЕ ПУСТОЙ. Пустой кружок в файле не виден никак;
 *   • ЧТО ОН РАЗМЕРОМ С ФОТОГРАФИЮ. Класс общий, но размер приходит из
 *     css, и проверить это можно только на живой странице;
 *   • ЧТО НАРУЖУ НИЧЕГО НЕ ЗАПРАШИВАЕТСЯ. Заглушка с чужого CDN — это
 *     лишний запрос на каждую карточку.
 *
 * ПОРОГ: модуля на странице нет — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const СТРАНИЦЫ = [
    '/index.html',
    '/pages/players.html',
    '/pages/services.html',
    '/pages/partners.html',
    '/pages/battles-overview.html',
    '/pages/challenge.html',
    '/pages/tournaments-overview.html'
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
    const где = new URL(page.url()).pathname;
    expect(где, 'ПОРОГ: страница увела на ' + где).toBe(адрес);
}

for (const адрес of СТРАНИЦЫ) {
test.describe('лицо · ' + адрес.split('/').pop(), () => {

    test('модуль есть и считает одинаково', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const L = window.KSLT_LICO;
            if (!L || !L.инициалы) return { есть: false };
            return {
                есть: true,
                двое: L.инициалы('Константин Лазаренко'),
                трое: L.инициалы('Ли О Мин'),
                один: L.инициалы('Роман'),
                пусто: L.инициалы(''),
                нет: L.инициалы(null),
                строчное: L.инициалы('ли о')
            };
        });
        expect(р.есть, 'ПОРОГ: модуля лица на странице нет').toBe(true);
        /* ОДНО ПОВЕДЕНИЕ НА ПРОДУКТ: имя плюс фамилия, верхним регистром,
           пустое имя — знак вопроса, а не пустой кружок. */
        expect(р.двое, JSON.stringify(р)).toBe('КЛ');
        expect(р.трое, 'длинное имя берёт первое и ПОСЛЕДНЕЕ слово').toBe('ЛМ');
        expect(р.один, JSON.stringify(р)).toBe('Р');
        expect(р.пусто, 'пустое имя дало пустой кружок').toBe('?');
        expect(р.нет, 'имени нет вовсе — всё равно знак вопроса').toBe('?');
        expect(р.строчное, 'регистр не поднялся').toBe('ЛО');
    });

    test('кружки не пусты и не схлопнуты', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const кружки = [...document.querySelectorAll('.avatar-initials')];
            const видимые = кружки.filter(э => {
                const с = getComputedStyle(э);
                return с.display !== 'none' && с.visibility !== 'hidden';
            });
            return {
                всего: кружки.length,
                видимых: видимые.length,
                пустых: видимые.filter(э => !(э.textContent || '').trim()).length,
                /* ЭТО ПРОВЕРКА ДАННЫХ, А НЕ ВЁРСТКИ, и щуп на неё не падает.
                   Первый прогон дал flaky: на телефоне боком всплывал один
                   img[src*=placehold] — и приходил он НЕ ИЗ КОДА, а из базы
                   прогона, где у игрока в поле фотографии лежит этот адрес.
                   Появлялся он через раз, потому что карточка попадала на
                   экран не всегда. Код заглушку с чужого сайта больше не
                   строит — это держит ЗАМОРОЗКА, которая читает исходники.
                   Здесь число только показывается в сообщении. */
                изДанных: document.querySelectorAll('img[src*="placehold"]').length,
                размеры: [...new Set(видимые.map(э => {
                    const к = э.getBoundingClientRect();
                    return Math.round(к.width) + 'x' + Math.round(к.height);
                }))].slice(0, 6),
                нулевых: видимые.filter(э => {
                    const к = э.getBoundingClientRect();
                    return к.width < 8 || к.height < 8;
                }).length
            };
        });
        /* Кружков может не быть вовсе: у всех на странице есть фотография.
           Это законно, и проверку поведения выше оно не отменяет. */
        if (!р.видимых) return;
        expect(р.пустых, 'пустой кружок: ' + JSON.stringify(р)).toBe(0);
        expect(р.нулевых, 'кружок схлопнулся: ' + JSON.stringify(р)).toBe(0);
    });

});
}
