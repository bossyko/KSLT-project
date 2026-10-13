/**
 * ПОЛИТИКА БЕЗОПАСНОСТИ. 13.10, кусок 70-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЗАМОРОЗКА ЧИТАЕТ ПОЛИТИКУ КАК ТЕКСТ. Что браузер под ней НИЧЕГО не
 *     закрыл, знает только браузер: `securitypolicyviolation` ставится до
 *     загрузки страницы и ловит каждое закрытое обращение;
 *   • ВХОД — ГЛАВНЫЙ СЛУЧАЙ. Политики у него не было ВОВСЕ, и не просто
 *     так: Turnstile ходит на `challenges.cloudflare.com`, которого в общей
 *     политике нет. Проверяется, что скрипт капчи ЗАГРУЗИЛСЯ под новой
 *     политикой, а не что он просто объявлен;
 *   • АНГЛИЙСКАЯ АДМИНКА — перенаправление, и проверяется, что оно УВОДИТ, а
 *     не что страница открылась.
 *
 * ПОЧЕМУ ЭТО ЕСТЬ. 13.10 я попросил Костю проверить вход и админку руками.
 * Три вопроса из четырёх отвечались чтением кода, и один — этим прогоном.
 * Человек не должен проверять глазами то, что умеет проверить бегунок.
 */
const { test, expect } = require('../../fixtures');

/** Страницы, под которыми браузер не должен закрыть ничего. */
const СТРАНИЦЫ = [
    ['лендинг',            '/index.html'],
    ['лендинг en',         '/index-en.html'],
    ['вход',               '/pages/auth.html'],
    ['вход en',            '/pages/auth-en.html'],
    ['новости',            '/pages/news.html'],
    ['рейтинг',            '/pages/players.html'],
    ['турниры',            '/pages/tournaments-overview.html'],
    ['корты',              '/pages/courts.html'],
    ['поиск игрока',       '/pages/partners.html'],
    ['обзор баттлов',      '/pages/battles-overview.html'],
    ['подтверждение',      '/pages/verify.html'],
    ['трансляция',         '/pages/live-match.html']
];

/** Слушатель ставится ДО скриптов страницы — иначе ранние нарушения уйдут. */
async function слушать(page) {
    await page.addInitScript(() => {
        window.__нарушения = [];
        document.addEventListener('securitypolicyviolation', function (e) {
            window.__нарушения.push(e.violatedDirective + ' ← ' + String(e.blockedURI || '').slice(0, 90));
        });
    });
}

async function открыть(page, адрес) {
    await слушать(page);
    await page.goto(адрес);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(2500);
}

for (const [имя, адрес] of СТРАНИЦЫ) {

test('под политикой ничего не закрыто: ' + имя, async ({ page }) => {
    await открыть(page, адрес);
    const р = await page.evaluate(() => {
        const м = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        return { политика: м ? м.getAttribute('content') : null,
                 нарушения: window.__нарушения || [] };
    });
    /* ПОРОГ: страница без политики — это не «нечего проверять», это беда
       куска. До 13.10 без политики стояли три страницы входа. */
    expect(р.политика, 'у страницы нет политики безопасности').not.toBeNull();
    expect(р.нарушения, 'браузер закрыл: ' + JSON.stringify(р.нарушения)).toEqual([]);
});

}

/* ══ ТРИ ЯЗЫКА — ОДНА ПОЛИТИКА ═════════════════════════════════════════ */

for (const [имя, ру, en, kg] of [
    ['лендинг', '/index.html', '/index-en.html', '/index-kg.html'],
    ['новости',  '/pages/news.html', '/pages/news-en.html', '/pages/news-kg.html'],
    ['вход',     '/pages/auth.html', '/pages/auth-en.html', '/pages/auth-kg.html']
]) {

test('три языка несут одну политику: ' + имя, async ({ page }) => {
    const снять = async адрес => {
        await page.goto(адрес);
        return page.evaluate(() => {
            const м = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return м ? м.getAttribute('content') : null;
        });
    };
    const а = await снять(ру), б = await снять(en), в = await снять(kg);
    expect(а, 'ПОРОГ: у русской страницы политики нет').not.toBeNull();
    /* До 13.10 расходился лендинг: у ru не было ни frame-src, ни wss, у en и
       kg были — при том что кадра на лендинге нет ни на одном языке. */
    expect(б, 'английская расходится с русской').toBe(а);
    expect(в, 'кыргызская расходится с русской').toBe(а);
});

}

/* ══ ВХОД ══════════════════════════════════════════════════════════════ */

test('вход: капча загрузилась под новой политикой', async ({ page }) => {
    await открыть(page, '/pages/auth.html');
    const р = await page.evaluate(() => ({
        turnstile: typeof window.turnstile !== 'undefined',
        форма: !!document.querySelector('form'),
        кнопокВхода: document.querySelectorAll('.auth-option-btn').length,
        нарушения: window.__нарушения || []
    }));
    /* ИМЕННО ЗАГРУЗИЛСЯ. Политики у входа не было вовсе ровно потому, что
       общая закрыла бы challenges.cloudflare.com и сломала бы вход. */
    expect(р.turnstile, 'скрипт Turnstile не загрузился: ' + JSON.stringify(р.нарушения)).toBe(true);
    expect(р.форма, 'формы входа нет').toBe(true);
    expect(р.кнопокВхода, 'способов входа на странице нет').toBeGreaterThan(0);
});

test('вход: лишних источников кадров в политике нет', async ({ page }) => {
    await page.goto('/pages/auth.html');
    const кадры = await page.evaluate(() => {
        const м = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        const п = м ? м.getAttribute('content') : '';
        const д = п.split(';').map(s => s.trim()).find(s => s.indexOf('frame-src') === 0);
        return д ? д.slice('frame-src'.length).trim().split(/\s+/) : [];
    });
    /* signInWithOAuth уводит на страницу Google ЦЕЛИКОМ (js/auth.js:1792), а
       Telegram идёт своим потоком (js/auth.js:1964): кадр на входе нужен
       ровно один — Turnstile. */
    expect(кадры, 'в кадрах входа лишнее: ' + JSON.stringify(кадры))
        .toEqual(['https://challenges.cloudflare.com']);
});

/* ══ АНГЛИЙСКАЯ АДМИНКА — ПЕРЕНАПРАВЛЕНИЕ ══════════════════════════════ */

test('английская админка уводит на русскую, а не открывается', async ({ page }) => {
    await слушать(page);
    await page.goto('/pages/admin-en.html');
    await page.waitForTimeout(1500);
    const адрес = page.url();
    /* Админка ведётся только по-русски — слово Кости, и оно написано прямо
       в том файле. Это не вторая админка, а заглушка для старых закладок. */
    expect(адрес, 'перенаправление не сработало: ' + адрес).toContain('admin.html');
    expect(адрес, 'остались на английской странице').not.toContain('admin-en.html');
});

test('у перенаправления админки узкая политика, а не админская', async ({ page }) => {
    const снять = async адрес => {
        await page.goto(адрес);
        return page.evaluate(() => {
            const м = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
            return м ? м.getAttribute('content') : null;
        });
    };
    /* Переход сам уводит на русскую, поэтому политику заглушки читаем из
       разметки запросом, а не из открытой страницы. */
    const ответ = await page.request.get('/pages/admin-en.html');
    const текст = await ответ.text();
    const м = текст.match(/Content-Security-Policy"\s+content="([^"]*)"/);
    expect(м, 'у заглушки нет политики').not.toBeNull();
    const лендинг = await снять('/index.html');
    expect(м[1], 'заглушке дали политику админки').toBe(лендинг);
    expect(м[1], 'в заглушке оказалась выгрузка в Excel').not.toContain('sheetjs');
});
