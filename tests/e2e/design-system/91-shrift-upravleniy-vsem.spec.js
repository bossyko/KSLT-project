/**
 * ШРИФТ УПРАВЛЕНИЙ ДОЕЗЖАЕТ ВСЕМ. 13.10, кусок 72-й.
 *
 * Общее правило `input, button, select, textarea { font-family: inherit }`
 * завели 12.10 в `css/style.css`, и поштучные копии объявили мёртвыми. Замер
 * 13.10 показал, что мертвы НЕ ВСЕ: `style.css` не грузят две страницы из
 * тридцати одной — судейское окно и табло, — и в `css/umpire.css` копия
 * `.um-btn` была ЖИВОЙ. Снятие её давало Arial; доказано пробниками, а не
 * глазами. Правило переехало в `css/tokens.css`, который подключают все 90
 * страниц продукта, и 79 копий сняты.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ В БРАУЗЕРЕ. Заморозка видит строку в файле; какой
 *     шрифт достался кнопке — говорит только `getComputedStyle`;
 *   • ЧТО ПРАВИЛО ДОЕХАЛО ДО СТРАНИЦЫ, А НЕ ДО ФАЙЛА. Именно здесь и
 *     подвело: строка была, а две страницы её не видели;
 *   • ЧТО ЕГО НЕ ПЕРЕБИЛИ. Вес правила нулевой — любое правило с классом
 *     сильнее, и расхождение видно только на живой странице;
 *   • ПРОБНИК ВМЕСТО ДАННЫХ. Кнопки страницы зависят от входа и базы;
 *     пробник — нет. Проверяется ПРАВИЛО, а не удача отрисовки.
 *
 * ПОРОГ: нет пробников или страница ушла на другой адрес — проверка ПАДАЕТ,
 * а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

/* Судейское окно и табло держат свой css и НЕ грузят style.css — ровно на
   них правило и не доезжало. Они в списке обязательно. */
const СТРАНИЦЫ = [
    '/index.html',
    '/pages/players.html',
    '/pages/news.html',
    '/pages/courts.html',
    '/pages/coaches.html',
    '/pages/services.html',
    '/pages/partners.html',
    '/pages/pricing.html',
    '/pages/tournaments.html',
    '/pages/tournaments-overview.html',
    '/pages/battles-overview.html',
    '/pages/info.html',
    '/pages/faq.html',
    '/pages/about.html',
    '/pages/sponsors.html',
    '/pages/auth.html',
    '/pages/player.html',
    '/pages/tournament.html',
    '/pages/court.html',
    '/pages/coach.html',
    '/pages/challenge.html',
    '/pages/live-match.html',
    '/pages/verify.html',
    '/pages/umpire.html',
    '/pages/scoreboard.html'
];

const СВОЙ = /Inter|monospace/;

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
    /* ПОРОГ: страница могла увести на вход — тогда мерили бы не её. */
    const где = new URL(page.url()).pathname;
    expect(где, 'ПОРОГ: страница увела на ' + где + ' — мерили бы не её').toBe(адрес);
}

for (const адрес of СТРАНИЦЫ) {
test.describe('шрифт управлений · ' + адрес.split('/').pop(), () => {

    test('пробное управление берёт шрифт продукта', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const гн = document.createElement('div');
            гн.setAttribute('data-проба-shrifta', '1');
            document.body.appendChild(гн);
            const о = {};
            ['button', 'input', 'select', 'textarea'].forEach(т => {
                const э = document.createElement(т);
                гн.appendChild(э);
                о[т] = getComputedStyle(э).fontFamily;
            });
            о.домПодключён = [...document.styleSheets]
                .some(с => (с.href || '').indexOf('tokens.css') !== -1);
            гн.remove();
            return о;
        });
        expect(р.домПодключён, 'дом общего правила (tokens.css) не подключён').toBe(true);
        for (const т of ['button', 'input', 'select', 'textarea']) {
            expect(р[т], т + ' рисуется чужим шрифтом: ' + р[т]).toMatch(СВОЙ);
        }
    });

    test('ни одно управление страницы не выпало в системный шрифт', async ({ page }) => {
        await открыть(page, адрес);
        const р = await page.evaluate(() => {
            const все = [...document.querySelectorAll('button, input, select, textarea')]
                .filter(э => {
                    const с = getComputedStyle(э);
                    return с.display !== 'none' && с.visibility !== 'hidden';
                });
            const чужие = все
                .map(э => ({ тег: э.tagName, класс: (э.className || '').toString().slice(0, 40),
                             шрифт: getComputedStyle(э).fontFamily }))
                .filter(о => !/Inter|monospace/.test(о.шрифт));
            return { видимых: все.length, чужих: чужие.length, примеры: чужие.slice(0, 5) };
        });
        /* Управлений может не быть вовсе — табло их не рисует. Это законно,
           и пробник выше правило уже доказал. */
        expect(р.чужих, 'чужой шрифт у управлений: ' + JSON.stringify(р.примеры)).toBe(0);
    });

});
}

/* ПОЧЕМУ СЧЁТА КОПИЙ ЗДЕСЬ НЕТ. Такой щуп был и упал на всех пяти видах —
   и прав был он, а не я. В браузере `font: inherit` (сокращённая запись,
   `.rk-gender` и `.site-notif-item`) неотличима от `font-family: inherit`:
   когда рядом стоят свои `font-size` и `font-weight`, Chrome разворачивает
   шортхенд в длинные свойства, и `cssText` у обоих одинаков. А это РАЗНЫЕ
   приёмы: шортхенд наследует всю группу шрифтовых свойств вместе с
   межстрочным, и снимать его наравне с копиями нельзя.
   Копии считаются по ТЕКСТУ ФАЙЛА — в `tools/check-shrift-upravleniy.js`,
   где видно, что написано, а не что из этого вышло. Прогон держит то, чего
   не видит файл: какой шрифт достался элементу в браузере. */
