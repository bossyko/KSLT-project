/**
 * ГРАНИЦЫ РАСКЛАДКИ — СЛЕПОК ДО И ПОСЛЕ (11.11.2026).
 *
 * Кусок: свести границы медиазапросов к двум — 640 и 992. Замер 11.11:
 * в css/ 304 медиазапроса, 220 из них уже на правильных границах, а 47
 * мест сидят на восемнадцати чужих: 768 (22 места), 600 (4), 480 (3),
 * 900 (3), плюс хвосты по одному.
 *
 * ЗАЧЕМ ПРОБА, А НЕ ПРОСТО ЗАМЕНА. Перенос границы меняет, КТО получает
 * правило. `max-width: 768` ловит телефон и планшет вертикально, но НЕ
 * ловит телефон боком (844). `max-width: 992` ловит и его. То есть
 * замена 768 → 992 добавляет мобильную раскладку на phone-landscape, а
 * замена 768 → 640 наоборот отнимает её у планшета. Глазами этого на
 * одном виде не видно — видно только слепком по всем пяти.
 *
 * ПРОБА НИЧЕГО НЕ ТРЕБУЕТ ОТ ПРОДУКТА, она печатает слепок и падает лишь
 * на том, что держаться обязано: страница не едет вбок ни на одном виде.
 * Сравнение «до/после» делается по напечатанным числам, а не по памяти.
 *
 * ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ: ширину задаёт проект
 * playwright.config.js. Через окно браузера это не замерить — попытка
 * 11.11 изменить окно Chrome до 844 оставила viewport 1512.
 */
const { test, expect } = require('../../fixtures');

const СТРАНИЦЫ = [
    { к: 'ru', адрес: '/index.html' },
    { к: 'en', адрес: '/index-en.html' },
    { к: 'kg', адрес: '/index-kg.html' },
];

/* Узлы, чья раскладка и есть предмет спора: они переключаются границами. */
const УЗЛЫ = [
    ['герой-заголовок', '.hero-title'],
    ['герой-статы',     '.hero-stats'],
    ['турниры',         '.tournaments-grid'],
    ['новости',         '.hn-grid'],
    ['корты',           '.courts-grid'],
    ['матчи',           '.live-matches'],
    ['спонсорам',       '.sp-offer'],
    ['подвал',          '.footer-content'],
    ['подвал-бренд',    '.footer-brand'],
];

/* Границы, которые сегодня живут в коде. Печатаются те, что сработали:
   по этому списку видно, КАКОЕ правило поймало данный вид. */
const ГРАНИЦЫ = [
    '(max-width: 375px)', '(max-width: 480px)', '(max-width: 599px)',
    '(max-width: 600px)', '(max-width: 640px)', '(max-width: 768px)',
    '(max-width: 900px)', '(max-width: 992px)', '(min-width: 641px)',
    '(min-width: 769px)', '(min-width: 901px)', '(min-width: 993px)',
];

for (const стр of СТРАНИЦЫ) {
    test(`${стр.к}: слепок раскладки`, async ({ page }, инфо) => {
        await page.goto(стр.адрес, { waitUntil: 'domcontentloaded' });
        /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ. */
        await page.waitForSelector('.hero-title, main', { timeout: 15000 });

        /* ЖДЁМ ДАННЫЕ, А НЕ РАЗМЕТКУ. Первый слепок 11.11 мерил пустые
           сетки: карточки приходят из базы, и высоты выходили 0 и 4px, а
           число колонок — мусором. ПУСТАЯ СЕТКА НЕ ИМЕЕТ РАСКЛАДКИ: у неё
           нет дорожек, и браузер отдаёт исходное значение свойства
           (`minmax(0, 1fr) minmax(0, 1fr)`) вместо вычисленных пикселей.
           Ждём, пока хотя бы одна сетка наполнится. */
        await page.waitForFunction(() => {
            const сетки = ['.courts-grid', '.hn-grid', '.tournaments-grid', '.live-matches'];
            return сетки.some(с => {
                const э = document.querySelector(с);
                return э && э.children.length > 0 && э.getBoundingClientRect().height > 20;
            });
        }, { timeout: 20000 }).catch(() => {});

        const снимок = await page.evaluate(([УЗЛЫ, ГРАНИЦЫ]) => {
            const вне = э => {
                if (!э.getClientRects().length) return true;
                const c = getComputedStyle(э);
                return c.display === 'none' || c.visibility === 'hidden' || +c.opacity === 0;
            };
            const строки = [];
            for (const [имя, селектор] of УЗЛЫ) {
                const э = document.querySelector(селектор);
                if (!э || вне(э)) { строки.push({ узел: имя, нет: true }); continue; }
                const r = э.getBoundingClientRect(), c = getComputedStyle(э);
                /* КОЛОНКИ СЧИТАЮТСЯ ПО ВЫЧИСЛЕННОЙ СЕТКЕ, а не по числу детей:
                   дети могут переноситься, и тогда их количество ничего не
                   говорит о раскладке. */
                /* КОЛОНКИ СЧИТАЮТСЯ ТОЛЬКО ПО ВЫЧИСЛЕННЫМ ДОРОЖКАМ.
                   Вычисленное grid-template-columns — это пиксели
                   («253.5px 253.5px»). Если браузер вернул что-то другое
                   (minmax, repeat, none), значит дорожек нет: сетка пуста
                   или не разложена, и считать нечего. Прежний счёт делил
                   строку по пробелам и на `minmax(0, 1fr) minmax(0, 1fr)`
                   выдавал ЧЕТЫРЕ колонки вместо двух. */
                const дорожки = c.gridTemplateColumns || '';
                const пиксельные = дорожки.split(' ').filter(ч => /^[\d.]+px$/.test(ч));
                const колонок = c.display.includes('grid')
                    ? (пиксельные.length ? пиксельные.length : null)
                    : (c.display.includes('flex') ? (c.flexDirection.startsWith('column') ? 1 : -1) : 0);
                строки.push({
                    узел: имя,
                    ш: Math.round(r.width), в: Math.round(r.height),
                    кегль: Math.round(parseFloat(c.fontSize) * 10) / 10,
                    раскладка: c.display,
                    напр: c.flexDirection,
                    колонок,
                });
            }
            return {
                строки,
                окно: innerWidth + '×' + innerHeight,
                сработали: ГРАНИЦЫ.filter(q => matchMedia(q).matches),
                едетВбок: document.documentElement.scrollWidth > innerWidth + 1,
                ширинаДокумента: document.documentElement.scrollWidth,
            };
        }, [УЗЛЫ, ГРАНИЦЫ]);

        /* СЛЕПОК ПЕЧАТАЕТСЯ ВСЕГДА, ДО ПРОВЕРОК — он и есть предмет сравнения. */
        console.log(`\n=== РАСКЛАДКА · ${стр.к} · ${инфо.project.name} · ${снимок.окно} ===`);
        console.log('сработали границы: ' + (снимок.сработали.join('  ') || '(ни одной)'));
        console.log('узел              размер        кегль  раскладка       колонок');
        for (const с of снимок.строки) {
            if (с.нет) { console.log('  ' + с.узел.padEnd(16) + ' —'); continue; }
            if (с.колонок === null) {
                /* ПУСТО НАЗЫВАЕТСЯ ПУСТЫМ, А НЕ ЧИСЛОМ. */
                console.log('  ' + с.узел.padEnd(16) + (с.ш + '×' + с.в).padStart(11) +
                    '   (сетка без дорожек — пусто)');
                continue;
            }
            console.log('  ' + [
                с.узел.padEnd(16), (с.ш + '×' + с.в).padStart(11),
                String(с.кегль).padStart(6), (с.раскладка + '/' + с.напр).padEnd(16),
                String(с.колонок).padStart(3),
            ].join(' '));
        }

        /* ЧТО ДЕРЖАТЬСЯ ОБЯЗАНО НА ЛЮБОЙ ГРАНИЦЕ. */
        expect(снимок.едетВбок,
            `страница не едет вбок (окно ${снимок.окно}, документ ${снимок.ширинаДокумента})`).toBe(false);
        expect(снимок.строки.filter(с => !с.нет).length,
            'узлы раскладки найдены, а не пустая страница').toBeGreaterThan(3);
    });
}
