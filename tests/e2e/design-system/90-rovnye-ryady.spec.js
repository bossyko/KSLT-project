/**
 * РОВНЫЕ РЯДЫ. 13.10, кусок 71-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • РАВНЫ ЛИ РЯДЫ МЕЖДУ СОБОЙ — это свойство ЖИВЫХ ДАННЫХ, а не файла.
 *     Ряд рейтинга выходил 53 у всех и 52 у последнего, а на планшете один
 *     ряд из одиннадцати — 68, потому что у ЭТОГО игрока парный NTRP
 *     «4.5 / 4.0» переносился на вторую строку. В css этого не видно;
 *   • РАСТЯНУЛАСЬ ЛИ КАРТОЧКА НА СВОЮ ДОРОЖКУ — дорожки могут быть равными,
 *     а карточки в них разными: на 844 дорожки были 303, карточки 270;
 *   • ПЕРЕЛИВА ВБОК НЕТ — пункт назывался «мелкие переливы», и щуп держит
 *     это на обеих страницах на всех видах.
 *
 * ВЁРСТКА НЕ ЗАВИСИТ ОТ БАЗЫ, А ПРОБА — НЕ ОТ УДАЧИ. Первый прогон 13.10
 * уронил все двадцать пять щупов по порогу: в базе прогона нет ни рейтинга,
 * ни новостей, и мерить было нечего — снимок страницы рейтинга в
 * test-results говорил «Игроки не найдены». Это правильное падение: пустая
 * страница не должна проходить вхолостую. Данные приходят оттуда, где они
 * уже заведены для таких случаев:
 *   · рейтинг — `tests/podstava-reytinga.js`, окно получает KSLT_RANKINGS
 *     НЕЗАПИСЫВАЕМЫМ ещё до загрузки скриптов страницы;
 *   · новости — `tests/podstava-novostey.js`, карточки доливаются ТОЙ ЖЕ
 *     разметкой, что отдаёт `js/news.js` → renderGrid. Здесь нужен
 *     КОМПОНЕНТ, а не данные: раскладку бенто-сетки считает css.
 *
 * ПОРОГ: нет рядов или нет коробки витрины — проверка ПАДАЕТ, а не
 * проходит вхолостую.
 */
const { test: базовый, expect } = require('../../fixtures');
const подстава = require('../../podstava-reytinga');
const витрина = require('../../podstava-novostey');

const test = базовый.extend({
    context: async ({ context }, use) => {
        await подстава.поставить(context);
        await use(context);
    },
});

/* Ряды рейтинга въезжают с задержкой до 300 мс (`.pl-animate`), а шрифт
   меняет высоту строки — мерить до того, как оба успокоятся, значит мерить
   не то. */
async function успокоить(page) {
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(600);
}

async function рейтинг(page) {
    await page.goto('/pages/players.html');
    await page.waitForFunction(
        () => document.querySelectorAll('.pl-row').length > 2, null, { timeout: 20000 }
    ).catch(() => { throw new Error('ПОРОГ: рядов рейтинга нет — мерить нечего'); });
    await успокоить(page);
}

/** Открыть новости и долить карточек до пяти: на широком виде это ровно
 *  две дорожки бенто (крупная на оба ряда плюс четыре боковых). */
async function новости(page) {
    await page.goto('/pages/news.html');
    await page.waitForFunction(
        () => document.getElementById('newsBento') !== null, null, { timeout: 20000 }
    ).catch(() => { throw new Error('ПОРОГ: коробки витрины новостей нет'); });
    /* Витрина рисуется дважды: сеткой или пустым состоянием, а потом ещё
       раз — пересчётом шага по крутилке. Доливать можно только после. */
    await page.waitForFunction(() => {
        const г = document.getElementById('newsBento');
        const было = window.__слепок;
        const стало = г ? г.innerHTML.length : -1;
        window.__слепок = стало;
        return стало >= 0 && стало === было;
    }, null, { timeout: 20000, polling: 400 });
    const долито = await page.evaluate(код => {
        const собрать = eval(код);
        const живых = document.querySelectorAll('.news-grid > .tc').length;
        return собрать(живых >= 5 ? 0 : 5 - живых) ? живых : null;
    }, витрина.ВИТРИНА);
    expect(долито, 'ПОРОГ: сетки новостей нет, доливать некуда').not.toBeNull();
    await успокоить(page);
}

test('ряды таблицы рейтинга равны между собой', async ({ page }) => {
    await рейтинг(page);
    const р = await page.evaluate(() => {
        const все = [...document.querySelectorAll('.pl-row')];
        const данные = все.filter(э => !э.className.includes('header'));
        return {
            всего: все.length,
            строк: данные.length,
            высоты: [...new Set(данные.map(э => Math.round(э.getBoundingClientRect().height * 10) / 10))],
            ширина: window.innerWidth
        };
    });
    expect(р.строк, 'ПОРОГ: строк рейтинга нет').toBeGreaterThan(2);
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: на телефоне ряд 52, на планшете 56 — важно, что
       внутри ОДНОГО вида они одинаковые. */
    expect(р.высоты.length, 'ряды разной высоты: ' + JSON.stringify(р)).toBe(1);
});

test('значок NTRP не тянет ряд вверх', async ({ page }) => {
    await рейтинг(page);
    /* МЕРИТЬ НАДО ЯЧЕЙКИ ДАННЫХ, А НЕ ШАПКУ. Первый прогон 13.10 уронил
       этот щуп на четырёх видах из пяти: класс `.pl-col-ntrp` носит и
       ячейка шапки с подписью «NTRP» (js/players.js:611 и :1000), а у неё
       свой кегль --fs-md против --fs-sm у значка — высоты честно разные,
       и это не беда, а два разных уровня текста. Прибор смотрел на оба
       под одним именем — ровно та ошибка, за которую меня спросили про
       бенто: два вида под одним именем в замере. */
    const р = await page.evaluate(() => {
        const видимые = э => getComputedStyle(э).display !== 'none';
        const данные = [...document.querySelectorAll('.pl-row:not(.pl-row-header) .pl-col-ntrp')]
            .filter(видимые);
        const все = [...document.querySelectorAll('.pl-col-ntrp')].filter(видимые);
        return { ячеек: данные.length, шапок: все.length - данные.length,
                 высоты: [...new Set(данные.map(э => Math.round(э.getBoundingClientRect().height)))],
                 перенос: [...new Set(все.map(э => getComputedStyle(э).whiteSpace))] };
    });
    if (!р.ячеек) return;  /* на узком виде колонка скрыта правилом страницы */
    /* Перенос запрещён И в шапке, и в ячейке: подпись колонки тоже тянет ряд. */
    expect(р.перенос, 'значку разрешён перенос: ' + JSON.stringify(р)).toEqual(['nowrap']);
    expect(р.высоты.length, 'ячейки NTRP разной высоты: ' + JSON.stringify(р)).toBe(1);
});

test('карточки новостей одной высоты и растянуты на свою дорожку', async ({ page }) => {
    await новости(page);
    const р = await page.evaluate(() => {
        const с = document.querySelector('.news-grid');
        const дети = [...с.children];
        const высоты = дети.map(э => Math.round(э.getBoundingClientRect().height));
        const дорожки = getComputedStyle(с).gridTemplateRows.split(' ')
            .map(в => Math.round(parseFloat(в)));
        return { карточек: дети.length, крупная: высоты[0],
                 малые: [...new Set(высоты.slice(1))], дорожки,
                 ширина: window.innerWidth };
    });
    expect(р.карточек, 'ПОРОГ: карточек новостей нет').toBeGreaterThan(2);
    /* ДО 13.10: на 1024 верхние 254, нижние 278; на 844 дорожки 303, а
       карточки 270 — то есть не растягивались. */
    expect(р.малые.length, 'малые карточки разной высоты: ' + JSON.stringify(р)).toBe(1);
    if (р.дорожки.length > 1) {
        expect([...new Set(р.дорожки)].length, 'дорожки сетки не равны: ' + JSON.stringify(р)).toBe(1);
    }
});

test('перелива вбок нет: рейтинг', async ({ page }) => {
    await рейтинг(page);
    const р = await page.evaluate(() => ({
        док: document.documentElement.scrollWidth, окно: window.innerWidth }));
    expect(р.док, 'перелив: ' + JSON.stringify(р)).toBeLessThanOrEqual(р.окно);
});

test('перелива вбок нет: новости', async ({ page }) => {
    await новости(page);
    const р = await page.evaluate(() => ({
        док: document.documentElement.scrollWidth, окно: window.innerWidth }));
    expect(р.док, 'перелив: ' + JSON.stringify(р)).toBeLessThanOrEqual(р.окно);
});
