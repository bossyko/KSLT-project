// @ts-check
const { test, expect } = require('@playwright/test');

/**
 * ДОМА ВМЕСТО КОПИЙ: КАРТА И УВЕДОМЛЕНИЕ. 19.10.
 *
 * ЧТО СТОРОЖ НЕ МОЖЕТ. `tools/check-kopii-funkciy.js` читает исходник:
 * одно ли определение, подключён ли дом там, где его зовут. Он не может
 * сказать, ПОЛУЧИЛАСЬ ли карта и ПОКАЗАЛОСЬ ли уведомление.
 *
 * А главный выигрыш правки — именно поведение: до 19.10 `courts.js` на
 * короткой ссылке (`maps.app.goo.gl/...`, из которой координат не
 * достать) подставлял САМУ ССЫЛКУ поисковым запросом и показывал карту
 * неизвестно чего. Теперь берётся адрес корта, который у него есть.
 * По исходнику этого не видно: там и там «карта строится».
 *
 * ПОЧЕМУ ПРОВЕРЯЕМ ДОМ, А НЕ СНИМОК КАРТЫ. Встроенная карта — чужой
 * кадр с сетью наружу; ждать его отрисовки значило бы ждать Google, а не
 * свой код. Проверяется то, за что отвечаем мы: АДРЕС кадра.
 */

const СТРАНИЦЫ_КАРТЫ = ['/pages/courts.html', '/pages/court.html', '/pages/tournament.html', '/pages/challenge.html'];

test.describe('дом карты', () => {
    for (const стр of СТРАНИЦЫ_КАРТЫ) {
        test(`${стр}: дом подключён и отвечает`, async ({ page }) => {
            await page.goto(стр);
            await page.waitForFunction(() => !!window.KSLT_KARTA, null, { timeout: 15000 });
            const есть = await page.evaluate(() => typeof window.KSLT_KARTA.встроить === 'function');
            expect(есть, 'дом карты подключён на странице, которая его зовёт').toBe(true);
        });
    }

    test('короткая ссылка берёт адрес, а не саму ссылку', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await page.waitForFunction(() => !!window.KSLT_KARTA, null, { timeout: 15000 });
        const итог = await page.evaluate(() => {
            const K = window.KSLT_KARTA;
            return {
                короткаяСАдресом: K.встроить('https://maps.app.goo.gl/xYz', 'Бишкек, Ахунбаева 1'),
                короткаяБезАдреса: K.встроить('https://maps.app.goo.gl/xYz'),
                координаты: K.встроить('https://www.google.com/maps/@42.87,74.59,15z'),
                место: K.встроить('https://www.google.com/maps/place/Tennis+Club+Ala-Too/'),
                /* СО СЛЕШЕМ НА КОНЦЕ — так требует образец, и так было во всех
                   четырёх прежних копиях. Моя первая проба дала ссылку БЕЗ
                   слеша и упала на пяти видах: виновата была проба, а не код.
                   Поведение без слеша проверяется отдельно ниже. */
                двагис: K.встроить('https://2gis.kg/bishkek/geo/15763234351106073/74.59%2C42.87/'),
                двагисБезСлеша: K.встроить('https://2gis.kg/bishkek/geo/15763234351106073/74.59%2C42.87'),
                готовый: K.встроить('https://maps.google.com/maps?q=1,2&output=embed'),
                пусто: K.встроить(null),
                пустоСАдресом: K.встроить(null, 'Бишкек, Киевская 95')
            };
        });

        /* ГЛАВНОЕ ЧИСЛО КУСКА: адрес вместо мусора. */
        expect(итог.короткаяСАдресом, 'короткая ссылка + адрес').toContain('output=embed');
        expect(итог.короткаяСАдресом, 'в запросе адрес, а не ссылка').not.toContain('goo.gl');
        expect(decodeURIComponent(итог.короткаяСАдресом)).toContain('Ахунбаева');

        /* Без адреса честный ответ — ничего, а не карта неизвестно чего. */
        expect(итог.короткаяБезАдреса, 'короткая ссылка без адреса').toBeNull();

        expect(итог.координаты, 'координаты из ссылки').toContain('q=42.87,74.59');
        /* «+» в имени места становится пробелом — это умела только богатая копия. */
        expect(decodeURIComponent(итог.место), 'имя места с пробелами').toContain('Tennis Club Ala-Too');
        /* У 2ГИС порядок обратный: сначала долгота. */
        expect(итог.двагис, 'широта и долгота 2ГИС местами').toContain('q=42.87,74.59');
        /* ЗАПИСАННАЯ НАХОДКА, А НЕ ЖЕЛАЕМОЕ: образец требует закрывающий слеш,
           и ссылка 2ГИС без него координат не отдаёт. Так было во всех четырёх
           прежних копиях — дом поведения не ухудшил. Проба держит текущее
           поведение: изменится — упадёт, и тогда это будет решением, а не
           случайностью. */
        expect(итог.двагисБезСлеша, 'ссылка 2ГИС без слеша: координат нет').toBeNull();
        expect(итог.готовый, 'готовую ссылку не трогаем').toBe('https://maps.google.com/maps?q=1,2&output=embed');
        expect(итог.пусто, 'без ссылки и адреса — ничего').toBeNull();
        expect(decodeURIComponent(итог.пустоСАдресом || ''), 'только адрес').toContain('Киевская');
    });
});

test.describe('ярлык уведомления', () => {
    test('ярлык живёт в доме и показывает уведомление', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await page.waitForFunction(() => typeof window.showToast === 'function', null, { timeout: 15000 });
        await page.evaluate(() => window.showToast('проба', 'error'));
        /* ЖДЁМ ПРИЗНАК — появление узла, а не паузу. */
        const видно = await page.waitForFunction(
            () => document.querySelectorAll('[class*="toast"], [class*="уведом"]').length > 0,
            null, { timeout: 5000 }).then(() => true).catch(() => false);
        expect(видно, 'уведомление нарисовалось после зова ярлыка').toBe(true);
    });

    test('тон переводится одним определением', async ({ page }) => {
        await page.goto('/pages/courts.html');
        await page.waitForFunction(() => !!window.KSLT_TOAST, null, { timeout: 15000 });
        const тона = await page.evaluate(() => {
            const T = window.KSLT_TOAST;
            return { ошибка: T.тон('error'), успех: T.тон('success'), внимание: T.тон('warning'),
                     админский: T.тон('ad-toast-success'), пусто: T.тон(''), чужое: T.тон('нечто') };
        });
        expect(тона.ошибка).toBe('err');
        expect(тона.успех).toBe('ok');
        expect(тона.внимание).toBe('warn');
        /* Админское имя тона переводится ТЕМ ЖЕ определением, а не седьмой копией. */
        expect(тона.админский).toBe('ok');
        /* Неизвестное имя даёт info, а не падение: уведомление обязано показаться. */
        expect(тона.пусто).toBe('info');
        expect(тона.чужое).toBe('info');
    });
});
