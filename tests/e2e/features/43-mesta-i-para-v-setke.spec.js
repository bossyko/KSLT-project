// @ts-check
const { test, expect } = require('../../fixtures');
const подстава = require('../../podstava-pary-i-mesta');

/**
 * МЕСТА И ПАРА В СЕТКЕ ПАРНОГО ТУРНИРА (кусок «сетка и места», 08.11).
 *
 * ЧТО ДЕРЖИТ ЭТА ПРОБА И ЧЕГО НЕ МОЖЕТ СТОРОЖ.
 * `tools/check-podpis-ligi.js` читает файлы как текст: он видит, что
 * раздел не сносится, что пару собирает один дом, что подпись лиги
 * записана с тегом. Чего он не видит — ВЛЕЗАЕТ ЛИ ИМЯ В КЛЕТКУ. Ровно
 * здесь беда и жила: разметка была верной, а на экране второе имя
 * обрезалось краем. РАЗМЕТКА НЕ ДОКАЗЫВАЕТ ВИД.
 *
 * ДАННЫЕ СВОИ, А НЕ ИЗ БАЗЫ. Первая редакция ходила на боевой турнир и
 * падала целиком: прогон идёт против тестовой базы, где его нет. Теперь
 * данные даёт `tests/podstava-pary-i-mesta.js` — перехват на уровне сети,
 * рисует настоящий `js/tournament-detail.js`.
 *
 * ПЯТЬ ВИДОВ дают проекты `playwright.config.js` — свой `viewport` проба
 * не ставит: ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ, и загрузку делает
 * бегунок, а не сжатие уже загруженного окна.
 *
 * ТРИ РЕДАКЦИИ, А НЕ ОДНА: подпись раздела и вкладка переводятся, и
 * починка, доехавшая до русской страницы, могла не доехать до двух
 * остальных.
 */

const РЕДАКЦИИ = [
    { файл: 'tournament.html',    места: 'МЕСТА',   вкладка: 'Места' },
    { файл: 'tournament-en.html', места: 'PLACES',  вкладка: 'Places' },
    { файл: 'tournament-kg.html', места: 'ОРУНДАР', вкладка: 'Орундар' },
];

async function открыть(page, файл) {
    await подстава.подставить(page);
    await page.goto('/pages/' + файл + '?id=' + подстава.ТУРНИР,
        { waitUntil: 'domcontentloaded' });
    await page.locator('.td-bracket .td-match').first()
        .waitFor({ state: 'attached', timeout: 25000 });
}

/* ПРИЗНАК БЕРЁТСЯ ТОТ, КОТОРЫЙ МЕРЯЕМ. Пьедестал рисуется позже сетки и
   своим запросом, и ждать надо именно его карточку.
   ТЕСТ ЖДЁТ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ. */
async function ждатьПьедестал(page) {
    await page.locator('#resultsPodium .td-podium-card').first()
        .waitFor({ state: 'attached', timeout: 25000 });
}

test.describe('парный турнир: места и пара в сетке', () => {

    for (const р of РЕДАКЦИИ) {
        test(`${р.файл}: оба игрока пары видны целиком`, async ({ page }) => {
            await открыть(page, р.файл);

            const пары = page.locator('.td-bracket .td-player-name:has(.td-team-p)');
            const сколько = await пары.count();
            expect(сколько, 'в парной сетке не нашлось ни одного имени пары').toBeGreaterThan(0);

            /* ОБА ИМЕНИ ОТДЕЛЬНЫМИ БЛОКАМИ. Склейка одной строкой — это и
               есть прежняя беда: текст в разметке был, а виден один. */
            for (let i = 0; i < сколько; i++) {
                const части = пары.nth(i).locator('.td-team-p');
                expect(await части.count(), 'имя пары собрано не из двух блоков').toBe(2);
            }

            /* ГЛАВНОЕ ЧИСЛО КУСКА: НИ ОДНО ИМЯ НЕ ОБРЕЗАНО. Меряем по
               самому узлу — его собственная ширина против прокрутки. */
            const обрезанных = await page.evaluate(() =>
                [...document.querySelectorAll('.td-bracket .td-player-name')]
                    .filter(n => n.scrollWidth > n.clientWidth + 1).length);
            expect(обрезанных, 'имя в клетке обрезано краем — второго игрока не видно').toBe(0);
        });

        test(`${р.файл}: раздел зовётся «${р.места}» и держит два пьедестала`, async ({ page }) => {
            await открыть(page, р.файл);
            await ждатьПьедестал(page);

            const вкладка = page.locator('.td-tab[data-target="results"]');
            await expect(вкладка, 'вкладка раздела мест пропала').toHaveCount(1);
            await expect(вкладка).toHaveText(р.вкладка);

            const заголовок = page.locator('#results h2');
            await expect(заголовок, 'заголовок раздела пропал').toHaveCount(1);
            await expect(заголовок).toHaveText(р.места);

            /* ПЬЕДЕСТАЛОВ ДВА — по одному на лигу. Один на обе читался бы
               так, будто утешительная часть верхней. */
            await expect(page.locator('#resultsPodium .td-podium'),
                'пьедестал снова один на две лиги').toHaveCount(2);

            /* ОЧКИ ЗА ПАРНЫЙ НЕ ИДУТ — таблицы в разделе быть не должно. */
            await expect(page.locator('#resultsPodium .td-results-table'),
                'в нерейтинговом турнире появилась таблица очков').toHaveCount(0);
        });

        test(`${р.файл}: имя пары на пьедестале стоит двумя строками`, async ({ page }) => {
            await открыть(page, р.файл);
            await ждатьПьедестал(page);

            const имена = page.locator('#resultsPodium .td-podium-name');
            const сколько = await имена.count();
            expect(сколько, 'на пьедесталах нет ни одной карточки').toBeGreaterThan(0);

            for (let i = 0; i < сколько; i++) {
                expect(await имена.nth(i).locator('.td-team-p').count(),
                    'напарник на пьедестале не вынесен отдельной строкой').toBe(2);
            }
        });
    }

    /* БРОНЗА ЕСТЬ ТОЛЬКО ТАМ, ГДЕ ЕЁ РАЗЫГРАЛИ. У высшей лиги матч за
       третье сыгран, у утешительной отменён — и пьедесталы обязаны выйти
       РАЗНЫМИ. Проверка ловит ветку, где третье место дорисовывают всем
       подряд или не дорисовывают никому. */
    test('третье место показано там, где матч за него сыгран', async ({ page }) => {
        await открыть(page, 'tournament.html');
        await ждатьПьедестал(page);

        const карточек = await page.locator('#resultsPodium .td-podium').evaluateAll(
            узлы => узлы.map(у => у.querySelectorAll('.td-podium-card').length));
        expect(карточек, 'у высшей лиги должно быть три места, у утешительной два')
            .toEqual([3, 2]);
    });

    /* ЛЕСТНИЦА ТЕКСТА: МОРОЗИТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО. Подпись лиги —
       рамка, имя победителя — содержание, и рамка не кричит громче. Это
       отношение обязано держаться на ВСЕХ пяти видах: на телефоне кегли
       переопределяются своим блоком. */
    test('подпись лиги мельче имени победителя и крупнее подписи круга', async ({ page }) => {
        await открыть(page, 'tournament.html');
        await ждатьПьедестал(page);

        const кегли = await page.evaluate(() => {
            const ч = (s) => {
                const э = document.querySelector(s);
                return э ? parseFloat(getComputedStyle(э).fontSize) : null;
            };
            return {
                раздел: ч('#results h2'),
                лига: ч('#resultsPodium .td-league-title'),
                победитель: ч('.td-podium-1 .td-podium-name'),
                круг: ч('.td-round-title'),
            };
        });

        expect(кегли.лига, 'подпись лиги не найдена').not.toBeNull();
        expect(кегли.лига, 'подпись лиги не мельче заголовка раздела')
            .toBeLessThan(кегли.раздел);
        expect(кегли.лига, 'рамка кричит громче содержания: лига крупнее победителя')
            .toBeLessThan(кегли.победитель);
        expect(кегли.лига, 'подпись лиги сравнялась с метой внутри блока')
            .toBeGreaterThan(кегли.круг);
    });

    /* СЕТКА ПОМЕЩАЕТСЯ, А НЕ ЛИСТАЕТСЯ ВБОК. На узких видах прокрутка —
       это решение (имена целиком важнее), а на десктопе лиги встают друг
       под другом ровно затем, чтобы прокрутки не было. */
    test('на десктопе парные лиги помещаются без прокрутки вбок', async ({ page }, info) => {
        test.skip(!/desktop/i.test(info.project.name), 'правило десктопа');
        await открыть(page, 'tournament.html');

        const листается = await page.evaluate(() =>
            [...document.querySelectorAll('.td-bracket-scroll')]
                .some(s => s.scrollWidth > s.clientWidth + 1));
        expect(листается, 'парные лиги снова делят ширину и листаются вбок').toBe(false);

        const подряд = await page.evaluate(() => {
            const л = [...document.querySelectorAll('.td-league-bracket')];
            if (л.length !== 2) return false;
            return л[1].getBoundingClientRect().top >= л[0].getBoundingClientRect().bottom - 5;
        });
        expect(подряд, 'лиги снова стоят в ряд').toBe(true);
    });
});
