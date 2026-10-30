// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-ZOV: зов серверной функции — один дом.
 *
 * ЧТО БЫЛО, ИЗМЕРЕНО ЧТЕНИЕМ. Адрес `/functions/v1/…` собирался в 35
 * местах продукта; 23 из них рукописные, ПЯТЬЮ разными написаниями. В
 * семи публичных стоял слепой `r.json()` — упавшая на сервере функция
 * отвечает не JSON, разбор бросал `SyntaxError`, и человек видел общее
 * «ошибка» без причины. В двух местах кабинета зов уходил БЕЗ СЕССИИ, с
 * пустым `Bearer`. В профиле приложения рядом лежал ЗАШИТЫЙ адрес базы
 * со `|| ''` вместо ключа: пустой ключ — молчаливый отказ сервера.
 *
 * ЧТО ДЕРЖИТ СТОРОЖ, А ЧТО ЗДЕСЬ. Сторож читает файлы: он видит, что
 * дом один, копии равны, адрес берётся у настроек и мимо дома никто не
 * зовёт. Он НЕ ВИДИТ, ЧТО УХОДИТ В СЕТЬ и что дом делает с ответом.
 * Это работа прогона.
 *
 * НИ БАЗУ, НИ ФУНКЦИЮ ТЕСТ НЕ ЗОВЁТ: `fetch` подменяется на время и
 * возвращается на место, клиент подставной. Так проверяется, что без
 * токена сервер не зовут ВОВСЕ — это наблюдаемо только по отсутствию
 * зова.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/dashboard.html' },
    { язык: 'en', адрес: '/pages/dashboard-en.html' },
    { язык: 'kg', адрес: '/pages/dashboard-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождаться(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => window.KSLT_ZOV && typeof window.KSLT_ZOV.отИмени === 'function',
        null, { timeout: 20000 });
    return ошибки;
}

function снять(page) {
    return page.evaluate(async () => {
        const З = window.KSLT_ZOV;
        const былFetch = window.fetch;
        const былErr = console.error;
        const сказано = [];
        console.error = function () { сказано.push([].slice.call(arguments).join(' ')); };

        let поймано = [];
        function отвечать(тело, ok, status) {
            window.fetch = function (u, o) {
                поймано.push({ u: String(u), o: o });
                return Promise.resolve({
                    ok: ok !== false,
                    status: status || 200,
                    text: function () { return Promise.resolve(тело); },
                    json: function () { return Promise.reject(new Error('json() звать нельзя')); }
                });
            };
        }
        const клиент = токен => ({
            auth: {
                getSession: () => Promise.resolve({
                    data: { session: токен ? { access_token: токен } : null }
                })
            }
        });

        const итог = {};
        try {
            /* 1. ЗОВ БЕЗ ВХОДА: ключ есть, токена нет. */
            поймано = []; отвечать('{"ok":true}');
            итог.безВхода = await З.зов('rate-limit', { action: 'login' });
            итог.безВходаЗов = {
                адрес: поймано[0].u,
                заголовки: Object.keys(поймано[0].o.headers).sort(),
                ключ: поймано[0].o.headers.apikey === window.SUPABASE_ANON_KEY,
                тело: JSON.parse(поймано[0].o.body)
            };

            /* 2. ЗОВ ОТ ИМЕНИ: добавляется Authorization. */
            поймано = []; отвечать('{"success":true}');
            итог.отИмени = await З.отИмени(клиент('TOK'), 'create-challenge', { a: 1 });
            итог.отИмениЗов = {
                адрес: поймано[0].u,
                токен: поймано[0].o.headers.Authorization,
                ключ: поймано[0].o.headers.apikey === window.SUPABASE_ANON_KEY,
                тип: поймано[0].o.headers['Content-Type']
            };

            /* 3. БЕЗ СЕССИИ СЕРВЕР НЕ ЗОВУТ ВОВСЕ — та самая беда. */
            поймано = []; отвечать('{"success":true}');
            итог.безСессии = {
                ответ: await З.отИмени(клиент(null), 'create-challenge', {}),
                зовов: поймано.length
            };

            /* 4. ПУСТОЙ ТОКЕН НА РУКАХ — тоже не зовём. */
            поймано = []; отвечать('{"success":true}');
            итог.пустойТокен = {
                ответ: await З.сТокеном('', 'send-game-invite', {}),
                зовов: поймано.length
            };

            /* 5. КЛИЕНТА НЕТ ВОВСЕ — не падаем, отвечаем тем же ключом. */
            поймано = [];
            итог.безКлиента = {
                ответ: await З.отИмени(null, 'create-challenge', {}),
                зовов: поймано.length
            };

            /* 6. ОТКАЗ СЕРВЕРА — ЭТО ДАННЫЕ, а не исключение. */
            поймано = []; сказано.length = 0;
            отвечать('{"error":"already_pending"}', false, 409);
            итог.отказ = await З.сТокеном('TOK', 'send-game-invite', {});
            итог.отказСказан = сказано.join(' | ');

            /* 7. НЕ JSON — внятный бросок с именем функции и кодом. */
            поймано = []; сказано.length = 0;
            отвечать('<html>502 Bad Gateway</html>', false, 502);
            try {
                await З.сТокеном('TOK', 'delete-account', {});
                итог.неJson = 'НЕ БРОСИЛО';
            } catch (e) {
                итог.неJson = String(e.message);
            }
            итог.неJsonСказан = сказано.join(' | ');

            /* 8. ПУСТОЕ ТЕЛО — тоже не тишина. */
            отвечать('', false, 500);
            try {
                await З.зов('rate-limit', {});
                итог.пусто = 'НЕ БРОСИЛО';
            } catch (e) {
                итог.пусто = String(e.message);
            }

            /* 9. ТЕЛО НЕ ПЕРЕДАНО — уходит пустой объект, а не undefined. */
            поймано = []; отвечать('{"ok":1}');
            await З.зов('rate-limit');
            итог.безТела = поймано[0].o.body;
        } finally {
            window.fetch = былFetch;
            console.error = былErr;
        }
        return итог;
    });
}

function проверить(д) {
    expect(д.безВходаЗов.адрес, 'зовётся серверная функция по имени')
        .toContain('/functions/v1/rate-limit');
    expect(д.безВходаЗов.заголовки, 'без входа — только тип и ключ, без Authorization')
        .toEqual(['Content-Type', 'apikey']);
    expect(д.безВходаЗов.ключ, 'ключ берётся у настроек, а не вписан в дом').toBe(true);
    expect(д.безВходаЗов.тело).toEqual({ action: 'login' });

    expect(д.отИмениЗов.токен, 'зов от имени несёт токен человека').toBe('Bearer TOK');
    expect(д.отИмениЗов.ключ, 'и ключ тоже: сервер спрашивает оба').toBe(true);
    expect(д.отИмениЗов.тип).toBe('application/json');

    expect(д.безСессии.зовов, 'БЕЗ СЕССИИ СЕРВЕР НЕ ЗОВУТ ВОВСЕ').toBe(0);
    expect(д.безСессии.ответ, 'и отвечают тем же ключом, каким ответил бы сервер')
        .toEqual({ error: 'not_logged_in' });
    expect(д.пустойТокен.зовов, 'пустой токен — это не токен').toBe(0);
    expect(д.пустойТокен.ответ).toEqual({ error: 'not_logged_in' });
    expect(д.безКлиента.зовов, 'нет клиента — нет зова и нет падения').toBe(0);
    expect(д.безКлиента.ответ).toEqual({ error: 'not_logged_in' });

    expect(д.отказ, 'отказ сервера возвращается ДАННЫМИ: по коду продукт берёт своё слово')
        .toEqual({ error: 'already_pending' });
    expect(д.отказСказан, 'и о нём сказано в консоль — иначе «почему-то не сработало»')
        .toContain('send-game-invite');

    expect(д.неJson, 'не-JSON даёт внятный бросок с именем функции и кодом')
        .toBe('delete-account: HTTP 502');
    expect(д.неJsonСказан, 'в консоли видно, ЧТО именно ответило')
        .toContain('502 Bad Gateway');
    expect(д.пусто, 'пустое тело — тоже внятный бросок, а не тишина')
        .toBe('rate-limit: HTTP 500');

    expect(д.безТела, 'тело не передано — уходит {}, а не undefined').toBe('{}');
}

test.describe('Зов серверной функции — один дом', () => {

    for (const с of СТРАНИЦЫ) {
        test('кабинет сайта · ' + с.язык, async ({ page }) => {
            const ошибки = await дождаться(page, с.адрес);
            проверить(await снять(page));
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('в приложении то же самое', async ({ page }) => {
        const ошибки = await дождаться(page, ПРИЛОЖЕНИЕ);
        проверить(await снять(page));
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    test('дом входа зовёт дом зова, а своей копии не держит', async ({ page }) => {
        await дождаться(page, СТРАНИЦЫ[0].адрес);
        const найдено = await page.evaluate(async () => {
            const т = await (await fetch('../js/kslt-vhod.js')).text();
            const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ')
                            .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
            return {
                зовДома: (безКом.match(/KSLT_ZOV/g) || []).length,
                своихЗаголовков: (безКом.match(/'apikey'/g) || []).length,
                своегоРазбора: (безКом.match(/resp\.text\(\)/g) || []).length,
                своихАдресов: (безКом.match(/functions\/v1\//g) || []).length
            };
        });
        expect(найдено.зовДома, 'вход зовёт дом зова').toBeGreaterThan(0);
        expect(найдено.своихЗаголовков, 'своего ключа у входа не осталось').toBe(0);
        expect(найдено.своегоРазбора, 'своего разбора ответа у входа не осталось').toBe(0);
        expect(найдено.своихАдресов, 'своего адреса функции у входа не осталось').toBe(0);
    });

    /**
     * АДМИНКА ПРОБОЙ НЕ ОТКРЫВАЕТСЯ — И ЭТО СКАЗАНО ПРЯМО. Её экраны за
     * входом, а кнопки пишут в базу: нажимать их тест не имеет права.
     * Поэтому здесь проверяется то, что проверить МОЖНО, не заходя: в
     * отданных браузеру файлах админки нет ни одного рукописного зова
     * функции и ни одного своего `apikey`. Четырнадцать мест переехали
     * в дом 30.10, и это чтение их не пускает обратно.
     */
    test('в файлах админки зова мимо дома нет', async ({ page }) => {
        await дождаться(page, СТРАНИЦЫ[0].адрес);
        const найдено = await page.evaluate(async () => {
            const файлы = ['../js/admin/core/utils.js',
                           '../js/admin/sections/bracket.js',
                           '../js/admin/sections/broadcast.js',
                           '../js/admin/sections/challenges.js',
                           '../js/admin/sections/notifications.js',
                           '../js/admin/sections/players.js',
                           '../js/admin/sections/tournaments.js',
                           '../js/admin/sections/users.js'];
            const из = {};
            for (const п of файлы) {
                const т = await (await fetch(п)).text();
                const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ')
                                .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
                из[п] = {
                    зовов: (безКом.match(/functions\/v1\//g) || []).length,
                    ключей: (безКом.match(/'apikey'/g) || []).length,
                    черезДом: (безКом.match(/KSLT_ZOV\./g) || []).length
                };
            }
            return из;
        });
        let черезДом = 0;
        for (const п of Object.keys(найдено)) {
            expect(найдено[п].зовов, 'рукописный зов функции в ' + п).toBe(0);
            expect(найдено[п].ключей, 'свой apikey в ' + п).toBe(0);
            черезДом += найдено[п].черезДом;
        }
        expect(черезДом, 'все зовы админки идут через дом').toBeGreaterThanOrEqual(14);
    });

    test('в кабинете и колокольчике зова мимо дома нет', async ({ page }) => {
        await дождаться(page, СТРАНИЦЫ[0].адрес);
        const найдено = await page.evaluate(async () => {
            const из = {};
            for (const п of ['../js/dashboard.js', '../js/auth-nav.js',
                             '../js/tournament-detail.js']) {
                const т = await (await fetch(п)).text();
                const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ')
                                .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
                из[п] = (безКом.match(/functions\/v1\//g) || []).length;
            }
            return из;
        });
        for (const п of Object.keys(найдено)) {
            expect(найдено[п], 'рукописный зов функции в ' + п).toBe(0);
        }
    });
});
