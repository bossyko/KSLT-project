/**
 * ОБЗОРНАЯ «ИНФО» — 09.10.
 *
 * Замер нашёл: обложка на телефоне лёжа занимала 118% экрана (была ВЫШЕ
 * окна), заголовок шёл 22.62 · 37.14 · 27.2 · 45.06 · 49.6 — ни одного
 * числа со шкалы, восемь разных межстрочных, четыре точки останова,
 * кнопка 152 × 41, поля карточек 40 и 14, ноль `:focus-visible` при 55
 * правилах.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • ДОЛЮ ЭКРАНА. Высота обложки в пикселях ничего не говорит: важно,
 *     сколько от окна она съела, а это зависит от вида;
 *   • ДОХОДИТ ЛИ НАЖАТИЕ. Высота кнопки и цель нажатия — разные вещи:
 *     меряем попаданием через elementFromPoint;
 *   • ВИДЕН ЛИ ФОКУС. Правило в css есть, а рисует ли браузер контур —
 *     решает только живой `focus()`;
 *   • КУДА ВЕДУТ ССЫЛКИ. Восемь целей на каждом из трёх языков обязаны
 *     оставаться в своём языке.
 *
 * ПОРОГ: нет карточек или нет обложки — проверка ПАДАЕТ, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/info.html',    хвост: '' },
    { имя: 'en', адрес: '/pages/info-en.html', хвост: '-en' },
    { имя: 'kg', адрес: '/pages/info-kg.html', хвост: '-kg' },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];

/* ЖДАТЬ НАДО ПРИЗНАКА, А НЕ ТИШИНЫ СЕТИ. Страницу рисует js: ждём, пока
   число карточек перестанет меняться два замера подряд, и пока сядут
   шрифты — от них зависит, обрезан текст или нет. */
async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.io-hero h1') !== null, null, { timeout: 20000 });
    await page.waitForFunction(() => {
        const n = document.querySelectorAll('.io-card, .io-docrow').length;
        const было = window.__сколько;
        window.__сколько = n;
        return n > 0 && n === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

for (const Я of ЯЗЫКИ) {
test.describe('инфо, обзорная · ' + Я.имя, () => {

    test('обложка не забирает экран и стоит на крутилках раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const г = document.querySelector('.io-hero');
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 100) / 100 : null;
            return {
                высота: Math.round(г.getBoundingClientRect().height),
                окно: window.innerHeight,
                пол: getComputedStyle(г).minHeight,
                кегльH1: ч(г.querySelector('h1')),
                кегльНазв: ч(г.querySelector('.io-hero-full')),
                кегльПодпись: ч(г.querySelector('.io-hero-content > p')),
            };
        });
        expect(з.высота, 'ПОРОГ: обложки нет вовсе').toBeGreaterThan(80);
        const доля = з.высота / з.окно;
        expect(доля, 'обложка съела ' + Math.round(доля * 100) + '% экрана').toBeLessThanOrEqual(0.6);
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок мимо шкалы: ' + з.кегльH1).toContain(з.кегльH1);
        expect(ШКАЛА_КЕГЛЕЙ, 'название КСЛТ мимо шкалы: ' + з.кегльНазв).toContain(з.кегльНазв);
        if (з.кегльПодпись !== null)
            expect(ШКАЛА_КЕГЛЕЙ, 'подпись мимо шкалы: ' + з.кегльПодпись).toContain(з.кегльПодпись);
        /* Пара «заголовок + название» читается как пара и обязана стоять на
           РАЗНЫХ ступенях: на узких видах они сходились в один кегль. */
        expect(з.кегльH1, 'заголовок и название КСЛТ слиплись в один кегль')
            .toBeGreaterThan(з.кегльНазв);
    });

    test('лестница текста: каждый уровень на ступени', async ({ page }) => {
        await открыть(page, Я.адрес);
        const беды = await page.evaluate(({ кегли, строки }) => {
            const вых = [];
            document.querySelectorAll('main *, .io-hero *, .io-content *').forEach(el => {
                const свой = [...el.childNodes]
                    .filter(n => n.nodeType === 3 && n.textContent.trim()).length;
                if (!свой) return;
                if (el.closest('.floating-header, .mobile-nav, footer, .footer-content')) return;
                const s = getComputedStyle(el);
                if (s.display === 'none' || s.visibility === 'hidden') return;
                const к = Math.round(parseFloat(s.fontSize) * 100) / 100;
                if (!кегли.includes(к)) вых.push('кегль ' + к + ' у ' + el.className);
                if (s.lineHeight !== 'normal') {
                    const м = Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100;
                    if (!строки.includes(м)) вых.push('межстрочный ' + м + ' у ' + el.className);
                } else {
                    вых.push('межстрочный normal у ' + el.className);
                }
            });
            return [...new Set(вых)];
        }, { кегли: ШКАЛА_КЕГЛЕЙ, строки: ЛЕСТНИЦА_СТРОК });
        expect(беды, 'уровни мимо лестницы: ' + беды.join(' · ')).toHaveLength(0);
    });

    test('кнопка и карточки принимают нажатие, поля — из компонента', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const кн = document.querySelector('.io-featured-link');
            const к = кн.getBoundingClientRect();
            кн.scrollIntoView({ block: 'center' });
            const к2 = кн.getBoundingClientRect();
            const центр = document.elementFromPoint(к2.left + к2.width / 2, к2.top + к2.height / 2);
            const поля = [...document.querySelectorAll('.io-card')]
                .map(c => parseFloat(getComputedStyle(c).paddingTop));
            return {
                кнопка: { ш: Math.round(к.width), в: Math.round(к.height) },
                нажатиеДоходит: !!(центр && (центр === кн || кн.contains(центр))),
                поля: [...new Set(поля)],
                карточек: поля.length,
            };
        });
        expect(з.карточек, 'ПОРОГ: карточек на странице нет').toBeGreaterThan(0);
        expect(з.кнопка.в, 'цель нажатия ниже ступени 44: ' + з.кнопка.в).toBeGreaterThanOrEqual(44);
        expect(з.нажатиеДоходит, 'в центр кнопки попадает не кнопка').toBe(true);
        // `Card 29:65` знает две плотности: Compact 16 и Regular 24
        з.поля.forEach(п => expect([16, 24], 'поля карточки не из компонента: ' + п).toContain(п));
    });

    test('фокус с клавиатуры виден, перелива нет, ничего не обрезано', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const ц = document.querySelector('.io-card');
            ц.focus();
            const s = getComputedStyle(ц);
            const обрез = [];
            document.querySelectorAll('.io-card h3, .io-card p, .io-docrow-name, .io-docrow-sub')
                .forEach(e => { if (e.scrollHeight > e.clientHeight + 1)
                    обрез.push(e.textContent.trim().slice(0, 24)); });
            return {
                контур: s.outlineStyle + ' ' + s.outlineWidth,
                перелив: document.documentElement.scrollWidth - window.innerWidth,
                обрез,
            };
        });
        expect(з.контур, 'у карточки в фокусе нет контура').not.toMatch(/^none/);
        expect(з.перелив, 'страница едет вбок на ' + з.перелив).toBeLessThanOrEqual(1);
        expect(з.обрез, 'обрезано: ' + з.обрез.join(' · ')).toHaveLength(0);
    });

    test('все ссылки ведут на свой язык', async ({ page }) => {
        await открыть(page, Я.адрес);
        const ссылки = await page.evaluate(() => [...document.querySelectorAll('.io-content a[href]')]
            .map(a => a.getAttribute('href')).filter(h => h && !h.startsWith('#')));
        expect(ссылки.length, 'ПОРОГ: на странице нет ссылок').toBeGreaterThan(4);
        for (const h of ссылки) {
            if (Я.хвост === '') {
                expect(h, 'русская страница ведёт на чужой язык: ' + h).not.toMatch(/-(en|kg)\.html/);
            } else {
                expect(h, 'страница ' + Я.имя + ' ведёт мимо своего языка: ' + h)
                    .toContain(Я.хвост + '.html');
            }
        }
    });

});
}
