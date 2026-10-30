// @ts-check
const { test, expect, db } = require('../../fixtures');

/**
 * TC-BAZA: настройки базы — один дом.
 *
 * ЧТО БЫЛО, ИЗМЕРЕНО ЧТЕНИЕМ. Адрес базы и ключ стояли литералами в ТРЁХ
 * местах. Хуже: имя записи, в которой браузер держит сессию
 * (`sb-<проект>-auth-token`), было определено в ПЯТИ местах, и только
 * одно считало его из адреса. Четыре зашиты буквами на боевой проект —
 * `coaches.js`, `players.js`, `home-rankings.js`, `session-monitor.js`.
 *
 * ПОЧЕМУ ЭТО ПРОВЕРЯЕТСЯ ПРОГОНОМ, А НЕ ТОЛЬКО СТОРОЖЕМ. Сторож читает
 * файлы: он видит, что литерал один и имя считается из адреса. Он НЕ
 * ВИДИТ, что подстановка `window.KSLT_DB` действительно доезжает до
 * чтения сессии. А ровно это и было бедой: проверки подставляют ДРУГУЮ
 * базу, четыре места читали запись боевого проекта, которой в прогоне
 * нет вовсе, и отвечали «гость» ВСЕГДА. Проверка смотрела гостевой вид,
 * считая его видом вошедшего, и молчала — поэтому доказательство должно
 * жить здесь, в прогоне, где подстановка настоящая.
 *
 * НИ БАЗУ, НИ СЕРВЕР ТЕСТ НЕ ЗОВЁТ И НИЧЕГО НЕ ПИШЕТ. Запись сессии
 * кладётся в хранилище САМОГО БРАУЗЕРА на время проверки и убирается
 * обратно; токен в ней выдуманный и никуда не уходит — спрашиваем
 * только дом, а он отвечает, не трогая сети.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/coaches.html' },
    { язык: 'en', адрес: '/pages/coaches-en.html' },
    { язык: 'kg', адрес: '/pages/coaches-kg.html' }
];

const БОЕВОЙ = 'sb-qqkzszesviukopgjbead-auth-token';

async function дождаться(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => window.KSLT_BAZA && typeof window.KSLT_BAZA.имяЗаписи === 'function',
        null, { timeout: 20000 });
    return ошибки;
}

function снять(page, боевой) {
    return page.evaluate(async (боевой) => {
        const Б = window.KSLT_BAZA;
        const имя = Б.имяЗаписи();
        const итог = {
            адрес: Б.адрес,
            ключ: Б.ключ,
            проект: Б.проект(),
            имя: имя,
            боевоеИмя: боевой,
            /* SUPABASE_URL объявлен конфигом, а конфиг на этих страницах
               идёт ПОСЛЕ дома — значит берёт значение у него. */
            конфигАдрес: window.SUPABASE_URL,
            конфигКлюч: window.SUPABASE_ANON_KEY
        };

        const было = localStorage.getItem(имя);
        const былоБоевое = localStorage.getItem(боевой);
        const потом = Math.floor(Date.now() / 1000) + 3600;
        const раньше = Math.floor(Date.now() / 1000) - 10;
        try {
            /* 1. ЗАПИСИ НЕТ — ГОСТЬ. */
            localStorage.removeItem(имя);
            localStorage.removeItem(боевой);
            итог.пусто = { вошёл: Б.вошёл(), гость: Б.гость(), запись: Б.запись() };

            /* 2. ЗАПИСЬ ПОД ИМЕНЕМ ПОДСТАВЛЕННОЙ БАЗЫ — ВОШЁЛ. */
            localStorage.setItem(имя, JSON.stringify(
                { access_token: 'нетокен', expires_at: потом }));
            итог.своя = { вошёл: Б.вошёл(), токен: (Б.запись() || {}).access_token };

            /* 3. ЗАПИСЬ ПОД БОЕВЫМ ИМЕНЕМ ДОМ НЕ ВИДИТ — ТА САМАЯ БЕДА
                  НАОБОРОТ: раньше четыре места смотрели ТОЛЬКО сюда. */
            localStorage.removeItem(имя);
            localStorage.setItem(боевой, JSON.stringify(
                { access_token: 'чужой', expires_at: потом }));
            итог.чужая = { вошёл: Б.вошёл(), запись: Б.запись() };
            localStorage.removeItem(боевой);

            /* 4. ПРОСРОЧЕННЫЙ ТОКЕН — ЭТО ВЫХОД. */
            localStorage.setItem(имя, JSON.stringify(
                { access_token: 'нетокен', expires_at: раньше }));
            итог.просрочена = { вошёл: Б.вошёл(), гость: Б.гость() };

            /* 5. БЕЗ СРОКА — ТОЖЕ НЕ ВХОД: срок нечем проверить. */
            localStorage.setItem(имя, JSON.stringify({ access_token: 'нетокен' }));
            итог.безСрока = Б.вошёл();

            /* 6. ИСПОРЧЕННАЯ ЗАПИСЬ — НЕ ПАДЕНИЕ. */
            localStorage.setItem(имя, '{это не json');
            итог.мусор = { вошёл: Б.вошёл(), запись: Б.запись() };

            /* 7. ЗАПИСЬ БЕЗ ТОКЕНА — НЕ ЗАПИСЬ. */
            localStorage.setItem(имя, JSON.stringify({ expires_at: потом }));
            итог.безТокена = { вошёл: Б.вошёл(), запись: Б.запись() };
        } finally {
            localStorage.removeItem(имя);
            localStorage.removeItem(боевой);
            if (было !== null) localStorage.setItem(имя, было);
            if (былоБоевое !== null) localStorage.setItem(боевой, былоБоевое);
        }
        return итог;
    }, боевой);
}

function проверить(д, тест) {
    expect(д.адрес, 'дом берёт ПОДСТАВЛЕННЫЙ адрес, а не зашитый').toBe(тест.url);
    expect(д.ключ, 'и подставленный ключ').toBe(тест.key);
    expect(д.адрес, 'боевой базы в прогоне быть не должно вовсе')
        .not.toContain('qqkzszesviukopgjbead');

    expect(д.конфигАдрес, 'конфиг берёт адрес у дома, а не у себя').toBe(тест.url);
    expect(д.конфигКлюч, 'и ключ тоже').toBe(тест.key);

    expect(д.имя, 'имя записи СЧИТАНО из подставленного адреса')
        .toBe('sb-' + д.проект + '-auth-token');
    expect(д.имя, 'и это НЕ боевое имя — ровно то, что четыре места читали раньше')
        .not.toBe(д.боевоеИмя);

    expect(д.пусто, 'записи нет — гость').toEqual(
        { вошёл: false, гость: true, запись: null });

    expect(д.своя.вошёл, 'запись под именем подставленной базы — вошёл').toBe(true);
    expect(д.своя.токен, 'и запись отдаётся как есть').toBe('нетокен');

    expect(д.чужая.вошёл, 'запись БОЕВОГО проекта дом не считает входом').toBe(false);
    expect(д.чужая.запись, 'и не отдаёт её').toBe(null);

    expect(д.просрочена, 'просроченный токен — выход').toEqual(
        { вошёл: false, гость: true });
    expect(д.безСрока, 'без срока — тоже не вход').toBe(false);

    expect(д.мусор, 'испорченная запись — «не вошёл», а не падение').toEqual(
        { вошёл: false, запись: null });
    expect(д.безТокена, 'запись без токена — не запись').toEqual(
        { вошёл: false, запись: null });
}

test.describe('Настройки базы — один дом', () => {

    for (const с of СТРАНИЦЫ) {
        test('страница тренеров · ' + с.язык, async ({ page }) => {
            const ошибки = await дождаться(page, с.адрес);
            проверить(await снять(page, БОЕВОЙ), db);
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });
    }

    test('раздел «Игроки» — тот же дом', async ({ page }) => {
        const ошибки = await дождаться(page, '/pages/players.html');
        проверить(await снять(page, БОЕВОЙ), db);
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    test('главная — тот же дом', async ({ page }) => {
        const ошибки = await дождаться(page, '/index.html');
        проверить(await снять(page, БОЕВОЙ), db);
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    test('в приложении то же самое', async ({ page }) => {
        const ошибки = await дождаться(page, '/mobile/www/index.html');
        проверить(await снять(page, БОЕВОЙ), db);
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });

    /**
     * ДОМ СТОИТ РАНЬШЕ ВСЕХ, КТО ЕГО ЗОВЁТ — проверяется ПОРЯДКОМ
     * ВЫПОЛНЕНИЯ, а не порядком тегов: теги считает сторож, а здесь
     * важно, что к моменту работы шапки дом уже есть. Шапка читает
     * сессию НА ЗАГРУЗКЕ, и именно она на 25 страницах из 80 стоит
     * выше конфига — потому дом и отдельным файлом.
     */
    test('шапка находит дом к своему запуску, и зашитого имени у неё нет',
        async ({ page }) => {
        await дождаться(page, СТРАНИЦЫ[0].адрес);
        const найдено = await page.evaluate(async () => {
            const т = await (await fetch('../js/auth-nav.js')).text();
            const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ')
                            .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
            return {
                зовДома: (безКом.match(/KSLT_BAZA/g) || []).length,
                своёИмя: (безКом.match(/-auth-token/g) || []).length,
                свояБаза: (безКом.match(/supabase\.co/g) || []).length,
                свояПодстановка: (безКом.match(/KSLT_DB/g) || []).length
            };
        });
        expect(найдено.зовДома, 'шапка зовёт дом').toBeGreaterThan(0);
        expect(найдено.своёИмя, 'своего имени записи у шапки не осталось').toBe(0);
        expect(найдено.свояБаза, 'своего адреса базы у шапки не осталось').toBe(0);
        expect(найдено.свояПодстановка,
            'и подстановку она сама не читает — это дело дома').toBe(0);
    });

    test('четыре прежних места зашитого имени больше его не держат',
        async ({ page }) => {
        await дождаться(page, СТРАНИЦЫ[0].адрес);
        const найдено = await page.evaluate(async () => {
            const из = {};
            for (const п of ['../js/coaches.js', '../js/players.js',
                             '../js/home-rankings.js', '../js/session-monitor.js']) {
                const т = await (await fetch(п)).text();
                const безКом = т.replace(/\/\*[\s\S]*?\*\//g, ' ')
                                .replace(/(^|[^:])\/\/[^\n]*/g, '$1 ');
                из[п] = {
                    зашито: (безКом.match(/sb-qqkzszesviukopgjbead/g) || []).length,
                    дом: (безКом.match(/KSLT_BAZA/g) || []).length
                };
            }
            return из;
        });
        for (const п of Object.keys(найдено)) {
            expect(найдено[п].зашито, 'зашитое имя записи в ' + п).toBe(0);
            expect(найдено[п].дом, 'дом не зовётся в ' + п).toBeGreaterThan(0);
        }
    });
});
