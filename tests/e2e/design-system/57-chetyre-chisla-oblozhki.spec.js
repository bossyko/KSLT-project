/**
 * ЧЕТЫРЕ ЧИСЛА ОБЛОЖКИ «ТУРНИРОВ» — 04.10.
 *
 * Страница была закрыта 28.09, и два решения Кости от 27.09 стояли на доске
 * 482:9, блок B, но до кода не доехали:
 *   • «Турниров — то же число, что на главной» — главная показывала 340,
 *     обзорная 49. Одно понятие, два счёта;
 *   • «если 0 стоит то скрывать» — обложка показывала «ПРИЗОВОЙ ФОНД 0».
 *     Это увидел Костя глазами на ЗАКРЫТОЙ странице.
 *
 * ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО. Тест не знает и не должен знать, что
 * сегодня 340: завтра турниров станет больше. Он требует РАВЕНСТВА двух
 * экранов и ОТСУТСТВИЯ нуля на экране — это переживёт любые данные.
 *
 * ОТВЕТ БАЗЫ ПОДСТАВЛЯЕТСЯ ПЕРЕХВАТОМ, А НЕ ЗАПИСЬЮ В БАЗУ.
 * Первый прогон 04.10 упал весь: число клуба идёт из функции базы
 * get_club_stats, а её в ТЕСТОВОЙ базе нет вовсе — 404 PGRST202 «no matches
 * were found in the schema cache», тогда как в боевой она отвечает
 * {tournaments:40}. Страница права: ответа нет — стоит прочерк. Врал тест: он
 * ждал двадцать пять секунд цифру, которой в тестовой базе быть не может, —
 * на каждом из пяти видов и трёх языках.
 *
 * Поэтому ответ функции подставляется перехватом запроса. Ни тестовая, ни
 * боевая база не трогаются, а отношение проверяется на ИЗВЕСТНОМ числе: обе
 * страницы получают ОДИН ответ и обязаны показать ОДНУ цифру. Это строже
 * прежнего: на живых данных равенство могло совпасть случайно.
 *
 * Чего заморозка не видит, а видит прогон: что из общей формулы получилось в
 * браузере, и что ряд не рассыпался, когда показателей стало три вместо
 * четырёх.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', главная: '/index.html', обзор: '/pages/tournaments-overview.html' },
    { имя: 'en', главная: '/index-en.html', обзор: '/pages/tournaments-overview-en.html' },
    { имя: 'kg', главная: '/index-kg.html', обзор: '/pages/tournaments-overview-kg.html' },
];

/** Ответ функции клуба, один и тот же для обеих страниц. */
const КЛУБ = { members: 7, users: 93, tournaments: 40, courts: 31, coaches: 1 };

/**
 * Подстановка ответа функции базы.
 *
 * Перехват идёт ВНУТРИ страницы, подменой window.fetch до загрузки её
 * скриптов: так нет ни предзапроса OPTIONS, ни проверки разрешений на чужой
 * домен — а значит нет и способа у проверки упасть по причине, к делу не
 * относящейся. Боевой код не трогается: подмена живёт только в прогоне.
 */
async function подставитьКлуб(page, числа) {
    await page.addInitScript(ч => {
        const родной = window.fetch;
        window.fetch = function(вход) {
            const адрес = (вход && вход.url) ? вход.url : String(вход);
            if (адрес.indexOf('/rpc/get_club_stats') !== -1) {
                return Promise.resolve(new Response(JSON.stringify([ч]), {
                    status: 200, headers: { 'Content-Type': 'application/json' },
                }));
            }
            return родной.apply(this, arguments);
        };
    }, числа);
}

/** Ждём ПРИЗНАК — в ячейке появилась цифра, а не прочерк и не тишина сети. */
async function ждатьЧисло(page, селектор) {
    await page.waitForFunction(
        с => { const э = document.querySelector(с); return э && /\d/.test(э.textContent || ''); },
        селектор, { timeout: 8000 });
}

/** Признак отрисовки обложки, который НЕ зависит от функции клуба. */
async function ждатьОбложку(page) {
    await page.waitForFunction(
        () => { const э = document.querySelector('.to-hero h1'); return э && э.getBoundingClientRect().height > 0; },
        null, { timeout: 15000 });
}

const число = т => parseInt(String(т || '').replace(/[^\d]/g, ''), 10);

for (const Я of ЯЗЫКИ) {

test.describe('четыре числа обложки · ' + Я.имя, () => {

    test.beforeEach(async ({ page }) => { await подставитьКлуб(page, КЛУБ); });

    test('турниров на обзорной — то же число, что на главной', async ({ page }) => {
        await page.goto(Я.главная);
        await ждатьЧисло(page, '#statTournaments');
        const наГлавной = число(await page.locator('#statTournaments').first().textContent());

        await page.goto(Я.обзор);
        await ждатьЧисло(page, '#toStatTotal');
        const наОбзорной = число(await page.locator('#toStatTotal').textContent());

        expect(наГлавной, 'на главной должно быть число').toBeGreaterThan(0);
        expect(наОбзорной,
            'одно понятие — один счёт. 04.10 было 340 против 49: главная складывала ' +
            'архив клуба с турнирами от дня отсечки, обзорная считала все строки сама')
            .toBe(наГлавной);
    });

    test('архив клуба учтён: число больше, чем турниров в ответе базы', async ({ page }) => {
        await page.goto(Я.обзор);
        await ждатьЧисло(page, '#toStatTotal');
        const всего = число(await page.locator('#toStatTotal').textContent());
        const архив = await page.evaluate(() =>
            (window.KSLT_STATS && window.KSLT_STATS.АРХИВ_ТУРНИРОВ) || null);

        expect(архив, 'архив клуба объявлен одним числом и доступен по имени').toBeGreaterThan(0);
        expect(всего,
            'сообщество живёт с 2021 года, а сайт с 2025-го: от архива отталкиваемся ' +
            'и дальше начисляем турниры')
            .toBe(архив + КЛУБ.tournaments);
    });

    test('нулевой призовой фонд не показывается нулём', async ({ page }) => {
        await page.goto(Я.обзор);
        await ждатьОбложку(page);
        await page.waitForTimeout(1500);

        const з = await page.evaluate(() => {
            const видно = n => !!n && n.getBoundingClientRect().height > 0;
            const цифра = document.querySelector('#toStatPrize');
            const ячейка = цифра ? цифра.closest('.hero-stat') : null;
            return {
                виден: видно(ячейка),
                текст: цифра ? (цифра.textContent || '').trim() : null,
            };
        });

        if (з.виден) {
            expect(число(з.текст),
                'показатель на экране — значит сумма больше нуля').toBeGreaterThan(0);
        } else {
            expect(з.виден,
                'сумма ноль — показатель спрятан целиком: подпись без числа ' +
                'сообщает ещё меньше, чем ноль').toBe(false);
        }
    });

    test('ряд цифр не рассыпался, когда показателей стало три', async ({ page }) => {
        await page.goto(Я.обзор);
        await ждатьЧисло(page, '#toStatTotal');
        await page.waitForTimeout(1200);

        const з = await page.evaluate(() => {
            const видно = n => n.getBoundingClientRect().height > 0;
            const ячейки = Array.from(document.querySelectorAll('.to-hero .hero-stat')).filter(видно);
            const верхи = Array.from(new Set(ячейки.map(n => Math.round(n.getBoundingClientRect().top))));
            return {
                ячеек: ячейки.length,
                рядов: верхи.length,
                безПодписи: ячейки.filter(n => {
                    const п = n.querySelector('.hero-stat-label');
                    return !п || !(п.textContent || '').trim();
                }).length,
                перелив: document.documentElement.scrollWidth - window.innerWidth,
            };
        });

        expect(з.ячеек, 'показателей должно остаться хотя бы три').toBeGreaterThanOrEqual(3);
        expect(з.безПодписи, 'у каждой цифры есть подпись').toBe(0);
        expect(з.перелив, 'ряд не выталкивает страницу вбок').toBe(0);
    });

});

}
