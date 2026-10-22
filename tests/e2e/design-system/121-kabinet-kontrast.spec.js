// @ts-check
/**
 * КОНТРАСТ ТЕКСТОВЫХ УРОВНЕЙ КАБИНЕТА. Кусок 115, 21.10.
 *
 * ЧИНИТЬ БЫЛО НЕЧЕГО, И ЭТО ЗАМЕРЕННЫЙ РЕЗУЛЬТАТ, А НЕ ДОГАДКА. Замер
 * 21.10 снял 45 · 49 · 55 уровней (три языка) и не нашёл НИ ОДНОГО ниже
 * порога. Кусок поэтому покупает доказательство и сторожа, а не правку —
 * как кусок 109 про отказ от движения.
 *
 * ЗАЧЕМ ВООБЩЕ. Лестница кабинета (кегли, веса, межстрочные) заморожена пробой 77
 * на трёх языках и пяти видах. КОНТРАСТ не спрашивает НИ ОДНА проверка, а
 * подложек у кабинета три — #0A0A0A, #111111 и #1E1E1E, — и один и тот же
 * цвет текста даёт на них разный контраст. На тинте значок уже давал 4.10
 * при норме AA 4.5 (кусок списков кабинета).
 *
 * СЛОИ СКЛАДЫВАЮТСЯ: прозрачная краска смешивается с фоном, а не
 * отбрасывается. Идём вверх по предкам до первого непрозрачного слоя.
 *
 * РАЗДЕЛЫ ОТКРЫВАЮТСЯ АДРЕСОМ, А НЕ НАЖАТИЕМ: на узких видах бокового меню
 * нет вовсе, и замер увидел бы один раздел из восьми (урок пробы 77).
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ПОРОГ_МЕЛКИЙ = 4.5;   /* WCAG 1.4.3 для обычного текста */
const ПОРОГ_КРУПНЫЙ = 3;    /* 18.66px+700 или 24px+ — крупный */
const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];

async function открыть(page, хвост) {
    await page.goto('/pages/dashboard' + хвост + '.html');
    /* ЖДЁМ ПРИСУТСТВИЯ, А НЕ ВИДИМОСТИ. `waitForSelector` по умолчанию
       ждёт, когда станет видимым ПЕРВОЕ совпадение, а первый `[data-tab]`
       в кабинете — мобильная полоса вкладок `.db-mobile-tab`, на десктопе
       скрытая медиа-правилом. Из-за этого замер 21.10 прошёл на телефоне и
       двадцать секунд ждал скрытую кнопку на десктопе.
       Признак готовности здесь — ЧТО РАЗДЕЛЫ ЗАВЕДЕНЫ, а не что видна
       первая вкладка: на каждом виде видна своя. */
    await page.waitForSelector('[data-tab]', { state: 'attached', timeout: 20000 });
    await page.waitForFunction(() =>
        new Set([...document.querySelectorAll('[data-tab]')]
            .map(a => a.getAttribute('data-tab'))).size > 1,
        null, { timeout: 20000 });
}

for (const я of ЯЗЫКИ) {
    test('контраст кабинета: ни одного уровня ниже порога AA · ' + я.имя, async ({ page }, инфо) => {
        await открыть(page, я.хвост);
        const ключи = await page.evaluate(() =>
            [...new Set([...document.querySelectorAll('[data-tab]')]
                .map(a => a.getAttribute('data-tab')))]);
        expect(ключи.length, 'ПОРОГ: разделов не нашлось').toBeGreaterThan(1);

        const все = {};
        for (const к of ключи) {
            await page.evaluate(ключ => { window.location.hash = ключ; }, к);
            await page.waitForTimeout(600);
            const снято = await page.evaluate(() => {
                function разбор(с) {
                    const м = /rgba?\(([^)]+)\)/.exec(с || '');
                    if (!м) return null;
                    const ч = м[1].split(',').map(x => parseFloat(x.trim()));
                    return { r: ч[0], g: ч[1], b: ч[2], a: ч.length > 3 ? ч[3] : 1 };
                }
                function поверх(в, н) {
                    if (!в) return н;
                    const a = в.a;
                    return { r: в.r * a + н.r * (1 - a), g: в.g * a + н.g * (1 - a),
                             b: в.b * a + н.b * (1 - a), a: 1 };
                }
                function фон(э) {
                    const слои = [];
                    for (let у = э; у; у = у.parentElement) {
                        const ц = разбор(getComputedStyle(у).backgroundColor);
                        if (ц && ц.a > 0) { слои.push(ц); if (ц.a === 1) break; }
                    }
                    let и = слои.length ? слои[слои.length - 1] : { r: 0, g: 0, b: 0, a: 1 };
                    for (let k = слои.length - 2; k >= 0; k--) и = поверх(слои[k], и);
                    return и;
                }
                const ярк = ц => {
                    const к = [ц.r, ц.g, ц.b].map(v => {
                        v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
                    });
                    return 0.2126 * к[0] + 0.7152 * к[1] + 0.0722 * к[2];
                };
                const контр = (a, b) => {
                    const l1 = ярк(a), l2 = ярк(b);
                    return Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100;
                };
                const вышло = {};
                document.querySelectorAll('[class*="db-"]').forEach(э => {
                    const к = э.getBoundingClientRect();
                    if (!к.width || !к.height) return;
                    const свой = [...э.childNodes].some(у => у.nodeType === 3 && у.textContent.trim().length);
                    if (!свой) return;
                    const с = getComputedStyle(э);
                    const п = фон(э);
                    const т = поверх(разбор(с.color), п);
                    const кегль = parseFloat(с.fontSize);
                    const вес = parseInt(с.fontWeight, 10);
                    const имя = (э.className || '').toString().split(/\s+/)
                        .filter(x => x.indexOf('db-') === 0)[0] || 'db-?';
                    вышло[имя] = {
                        кегль: кегль, вес: вес,
                        крупный: кегль >= 24 || (кегль >= 18.66 && вес >= 700),
                        контраст: контр(т, п),
                        фон: 'rgb(' + [п.r, п.g, п.b].map(Math.round).join(',') + ')',
                        текст: 'rgb(' + [т.r, т.g, т.b].map(Math.round).join(',') + ')'
                    };
                });
                return вышло;
            });
            Object.assign(все, снято);
        }

        const ниже = Object.keys(все).filter(и => {
            const у = все[и];
            return у.контраст < (у.крупный ? 3 : 4.5);
        }).map(и => и + ' = ' + все[и].контраст + ' (кегль ' + все[и].кегль +
            ', вес ' + все[и].вес + ', текст ' + все[и].текст + ' на ' + все[и].фон + ')');

        const отчёт = [
            'уровней снято: ' + Object.keys(все).length,
            'ниже порога: ' + ниже.length,
            ...ниже.sort()
        ].join('\n');
        await инфо.attach('контраст-' + я.имя, { body: отчёт, contentType: 'text/plain' });
        console.log('\n=== КАБИНЕТ · ' + я.имя + ' ===\n' + отчёт + '\n');

        /* ПОРОГ ЗАМЕРА: меньше двадцати уровней — разделы не открылись, и
           проверка идёт вхолостую. Числа порога посчитаны: 45 · 49 · 55 на
           трёх языках, и беднее двадцати не бывало ни на одном виде. */
        expect(Object.keys(все).length, 'ПОРОГ: уровней меньше 20 — разделы не открылись')
            .toBeGreaterThanOrEqual(20);

        /* ГЛАВНОЕ ЧИСЛО КУСКА: ни один уровень не ниже порога AA. Порог
           берётся по КЕГЛЮ И ВЕСУ, а не один на всех: 18.66px при весе 700
           и 24px — крупный текст, ему хватает 3. WCAG НЕ ДЕЛАЕТ СКИДКИ
           «тихому» тексту, но и крупному не завышает. */
        expect(ниже, 'уровней снято ' + Object.keys(все).length +
            ', ниже порога: ' + ниже.join(' · ')).toEqual([]);
    });
}
