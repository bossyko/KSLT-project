/**
 * КУСОК 134 — ОФЛАЙН-СЛУЖБА ПОДНИМАЕТСЯ И НАПОЛНЯЕТ КЭШ.
 *
 * Сторож читает файлы. Эта проба читает ЖИВОЙ БРАУЗЕР: что служба
 * действительно регистрируется, что её область покрывает проект, и что
 * предзагрузка доходит до кэша.
 *
 * ЗАМЕР НА БОЕВОЙ 22.10: служб ноль, кэшей ноль — офлайн не работал ни
 * разу. Две поломки подряд: адрес службы от корня домена и семь путей
 * предзагрузки оттуда же. `cache.addAll` АТОМАРЕН — проверено, а не
 * принято на веру: один мёртвый адрес роняет весь набор.
 *
 * УСТАНОВКЕ НУЖНО ВРЕМЯ, И ЗАМЕР ЖДЁТ ПРИЗНАКА, А НЕ ТИШИНЫ. Первый
 * ручной замер показал «кэшей ноль» просто потому, что был сделан раньше,
 * чем установка закончилась. Здесь кэш ожидается циклом с признаком.
 */
const { test, expect } = require('@playwright/test');

/* Служба живёт на всём сайте, а не на виде: одного прогона довольно. */
const ТОЛЬКО_ОДИН = ['desktop'];

test.describe('офлайн-служба', () => {

    test.beforeEach(({}, info) => {
        test.skip(ТОЛЬКО_ОДИН.indexOf(info.project.name) === -1,
            'служба одна на весь сайт — хватает одного вида');
    });

    test('служба регистрируется и её область покрывает проект', async ({ page }) => {
        await page.goto('/index.html');
        /* Чистим прежнее, чтобы мерить УСТАНОВКУ, а не остаток от прошлого
           прогона: иначе проба зеленеет на чужой работе. */
        await page.evaluate(async () => {
            for (const р of await navigator.serviceWorker.getRegistrations()) await р.unregister();
            for (const к of await caches.keys()) await caches.delete(к);
        });
        await page.reload();

        const рег = await page.waitForFunction(async () => {
            const сп = await navigator.serviceWorker.getRegistrations();
            if (!сп.length) return false;
            const р = сп[0];
            if (!р.active) return false;
            return { область: р.scope, адрес: р.active.scriptURL };
        }, null, { timeout: 30000 }).then(h => h.jsonValue());

        expect(рег.адрес, 'служба поднялась не из корня проекта').toMatch(/\/sw\.js$/);
        /* ОБЛАСТЬ — ЭТО ПАПКА СЛУЖБЫ. Она обязана покрывать страницу,
           которая её завела, иначе служба не увидит ни одного запроса. */
        const адресСтраницы = page.url();
        expect(адресСтраницы.startsWith(рег.область),
            'область службы (' + рег.область + ') не покрывает страницу ' + адресСтраницы).toBe(true);
    });

    test('предзагрузка доходит до кэша целиком', async ({ page }) => {
        await page.goto('/index.html');
        await page.evaluate(async () => {
            for (const р of await navigator.serviceWorker.getRegistrations()) await р.unregister();
            for (const к of await caches.keys()) await caches.delete(к);
        });
        await page.reload();

        /* ЖДЁМ ПРИЗНАК: кэш с нужным именем и семью записями. Семь — это
           замеренная длина PRE_CACHE; addAll атомарен, поэтому либо все
           семь, либо ни одной. */
        const в = await page.waitForFunction(async () => {
            const имена = await caches.keys();
            const моё = имена.filter(и => и.indexOf('kslt-v') === 0);
            if (!моё.length) return false;
            const c = await caches.open(моё[0]);
            const k = await c.keys();
            if (k.length < 7) return false;
            return { имя: моё[0], записей: k.length,
                     пути: k.map(x => new URL(x.url).pathname) };
        }, null, { timeout: 30000 }).then(h => h.jsonValue());

        expect(в.имя, 'имя кэша не поднято вместе с правкой службы').toMatch(/^kslt-v([7-9]|\d{2,})$/);
        expect(в.записей, 'в кэше меньше семи записей — addAll упал бы целиком')
            .toBeGreaterThanOrEqual(7);

        for (const хвост of ['favicon.svg', 'css/style.css', 'js/script.js',
                             'js/supabase-config.js', 'js/auth-nav.js',
                             'images/icons/icon-192.png', 'images/icons/icon-512.png']) {
            expect(в.пути.some(п => п.endsWith('/' + хвост)),
                'в кэше нет ' + хвост + ' — предзагрузка дошла не вся').toBe(true);
        }
    });

    test('админка мимо кэша, обычные файлы в кэш', async ({ page }) => {
        await page.goto('/index.html');
        await page.evaluate(async () => {
            for (const р of await navigator.serviceWorker.getRegistrations()) await р.unregister();
            for (const к of await caches.keys()) await caches.delete(к);
        });
        await page.reload();
        await page.waitForFunction(async () => {
            const сп = await navigator.serviceWorker.getRegistrations();
            return сп.length > 0 && !!сп[0].active;
        }, null, { timeout: 30000 });
        /* Чистим предзагрузку — меряем ПОВЕДЕНИЕ службы на запросах,
           а не то, что она положила при установке. */
        await page.evaluate(async () => { for (const к of await caches.keys()) await caches.delete(к); });

        const м = await page.evaluate(async () => {
            for (const п of ['css/admin.css', 'js/admin/core/utils.js',
                             'css/style.css', 'js/auth-nav.js']) {
                try { await fetch(п); } catch (e) {}
            }
            await new Promise(r => setTimeout(r, 2500));
            const имена = await caches.keys();
            if (!имена.length) return { пути: [] };
            const c = await caches.open(имена[0]);
            return { пути: (await c.keys()).map(x => new URL(x.url).pathname) };
        });

        const админских = м.пути.filter(п => /(?:^|\/)admin/.test(п.replace(/^.*?\/(?=css|js|pages)/, '')));
        expect(админских, 'админка попала в кэш: ' + админских.join(', ')).toHaveLength(0);
        expect(м.пути.some(п => п.endsWith('/css/style.css')),
            'обычный файл НЕ попал в кэш — служба не перехватывает запросы').toBe(true);
    });

});
