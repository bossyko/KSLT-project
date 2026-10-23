/**
 * КУСОК 132 — ОТНОСИТЕЛЬНЫЕ ПУТИ.
 *
 * ПРОБА НА localhost НЕ ВИДИТ ЭТУ ОШИБКУ, И ЭТО ГЛАВНОЕ ОБ ЭТОЙ ПРОБЕ.
 * На прогоне корень сайта И ЕСТЬ корень проекта, поэтому `/images/...`
 * там отдаёт 200 — ровно так находка и дожила до боевой незамеченной.
 * Поэтому проба НЕ спрашивает «отдаёт ли 200». Она берёт атрибут со
 * страницы и РАЗРЕШАЕТ ЕГО ОТНОСИТЕЛЬНО ПОДСТАВНОЙ ПОДПАПКИ — так же,
 * как браузер разрешит его на боевой, — и требует, чтобы подпапка в
 * получившемся адресе ОСТАЛАСЬ.
 *
 * Замерено на боевой 22.10: manifest отдавал 200, а пять ссылок внутри
 * него — 404; apple-touch-icon — 404 на всех 89 страницах; start_url
 * вёл на «Site not found · GitHub Pages».
 *
 * Пути от языка не зависят, но страниц у главной три, и каждая несёт
 * свой `<head>`: мерим все три.
 *
 * `waitForSelector` ЖДЁТ ВИДИМОСТИ, А НЕ ПОЯВЛЕНИЯ. Первый прогон этой
 * пробы упал весь: `<link>` в `<head>` НЕ БЫВАЕТ видимым, и пустой
 * `#battleContainer` тоже — оба ждались до таймаута. Признак наличия
 * узла — `state: 'attached'`, и для головы страницы он единственно
 * верный. ТАЙМАУТ ОЖИДАНИЯ — НЕ ПАДЕНИЕ КОДА, А ОШИБКА ПРИБОРА.
 */
const { test, expect } = require('@playwright/test');

/* Подставной корень с подпапкой — ровно та форма, что на боевой. */
const БАЗА = 'https://example.org/podpapka/';

const ГЛАВНЫЕ = [
    ['русская',    '/index.html'],
    ['английская', '/index-en.html'],
    ['кыргызская', '/index-kg.html']
];

test.describe('относительные пути', () => {

    for (const [язык, адрес] of ГЛАВНЫЕ) {

        test('главная ' + язык + ': ссылки <head> переживают подпапку', async ({ page }) => {
            await page.goto(адрес);
            await page.waitForSelector('link[rel="manifest"]', { state: 'attached', timeout: 15000 });

            const м = await page.evaluate((база) => {
                const взять = сел => {
                    const э = document.querySelector(сел);
                    if (!э) return null;
                    const сырой = э.getAttribute('href');
                    return { сырой: сырой, разрешён: new URL(сырой, база).href };
                };
                return {
                    манифест: взять('link[rel="manifest"]'),
                    яблоко: взять('link[rel="apple-touch-icon"]'),
                    значок: взять('link[rel="icon"]'),
                    база: document.querySelectorAll('base').length
                };
            }, БАЗА);

            expect(м.манифест, 'со страницы пропал manifest').toBeTruthy();
            expect(м.яблоко, 'со страницы пропал apple-touch-icon').toBeTruthy();
            expect(м.значок, 'со страницы пропал favicon').toBeTruthy();

            /* ПОДПАПКА ОБЯЗАНА ОСТАТЬСЯ: иначе на боевой это 404. */
            expect(м.манифест.разрешён, 'manifest просится от корня домена').toContain('/podpapka/');
            expect(м.яблоко.разрешён, 'apple-touch-icon просится от корня домена').toContain('/podpapka/');
            expect(м.значок.разрешён, 'favicon просится от корня домена').toContain('/podpapka/');

            /* И НИ ОДНОЙ <base>: она переопределяет якоря, которых 106. */
            expect(м.база, '<base href> вернулась и переопределит 106 якорей').toBe(0);
        });
    }

    test('манифест: start_url, scope и все иконки переживают подпапку', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForSelector('link[rel="manifest"]', { state: 'attached', timeout: 15000 });

        const м = await page.evaluate(async (база) => {
            const href = document.querySelector('link[rel="manifest"]').getAttribute('href');
            const ответ = await fetch(href, { cache: 'reload' });
            if (!ответ.ok) return { статус: ответ.status };
            const j = await ответ.json();
            const разрешить = с => new URL(с, база).href;
            return {
                статус: ответ.status,
                start_url: разрешить(j.start_url || '/'),
                scope: разрешить(j.scope || '/'),
                иконок: (j.icons || []).length,
                иконки: (j.icons || []).map(и => разрешить(и.src))
            };
        }, БАЗА);

        expect(м.статус, 'манифест перестал отдаваться').toBe(200);
        expect(м.start_url, 'start_url уводит из проекта в корень домена').toBe(БАЗА);
        expect(м.scope, 'scope уводит из проекта в корень домена').toBe(БАЗА);
        expect(м.иконок, 'иконок в манифесте стало не 4').toBe(4);
        for (const и of м.иконки) {
            expect(и, 'иконка манифеста просится от корня домена: ' + и).toContain('/podpapka/');
        }
    });

    test('главная узнаётся по имени файла, а не по корню', async ({ page }) => {
        await page.goto('/index.html');
        await page.waitForSelector('#battleContainer', { state: 'attached', timeout: 15000 });

        /* Признак читается БЕЗ базы: берём ту же выжимку, что и код, и
           проверяем её на четырёх адресах — трёх языках и адресе,
           кончающемся косой чертой (так заходят на боевую главную).
           Опубликованных вызовов в боевой НОЛЬ, поэтому пустой контейнер
           доказывал бы и верное, и неверное условие: меряем ПРИЗНАК. */
        const м = await page.evaluate(() => {
            const признак = path => {
                const файл = path.slice(path.lastIndexOf('/') + 1);
                return файл === '' || файл.indexOf('index') === 0;
            };
            return {
                подпапкаБезИмени: признак('/KSLT-project/'),
                подпапкаИндекс:   признак('/KSLT-project/index.html'),
                подпапкаEn:       признак('/KSLT-project/index-en.html'),
                подпапкаKg:       признак('/KSLT-project/index-kg.html'),
                корень:           признак('/'),
                нутро:            признак('/KSLT-project/pages/admin.html'),
                контейнерЕсть:    !!document.getElementById('battleContainer')
            };
        });

        /* ЧЕТЫРЕ ВХОДА НА ГЛАВНУЮ — ВСЕ ЧЕТЫРЕ ДОЛЖНЫ ОПОЗНАТЬСЯ. */
        expect(м.подпапкаБезИмени, 'боевая главная перестала опознаваться').toBe(true);
        expect(м.подпапкаИндекс, 'index.html перестал опознаваться').toBe(true);
        expect(м.подпапкаEn, 'index-en.html перестал опознаваться').toBe(true);
        expect(м.подпапкаKg, 'index-kg.html перестал опознаваться').toBe(true);
        expect(м.корень, 'корень localhost перестал опознаваться').toBe(true);
        /* И НИ ОДНА ВНУТРЕННЯЯ: иначе карточки полезут на чужой экран. */
        expect(м.нутро, 'страница в подпапке опознана как главная').toBe(false);
        expect(м.контейнерЕсть, 'контейнер вызовов пропал с главной').toBe(true);
    });

});
