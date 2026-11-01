/**
 * ЗАМЕР ХВОСТА ПОЛНОГО ПРОГОНА 01.11 — ОДНИМ ПРОГОНОМ, А НЕ ПО ОДНОМУ.
 *
 * ЗАЧЕМ. После починки сессии и посева в хвосте осталось четыре беды, и
 * три из них, похоже, МОИ: правка лестницы обложки на низком
 * горизонтальном (`css/tokens.css:883`, 31.10) опустила `--fs-hero*` в
 * `:root`, а читают их не только обложки разделов.
 *   · `30-ritm-pervogo-ekrana:265` — «цифры начинаются выше сгиба: верх
 *     385.1 при окне 390»;
 *   · `86-battly:292` — «перебивка не мельче заголовка: заголовок 26,
 *     VS 26» (было 32 против 26);
 *   · `97-mertvoe:129` — «карточки витрины схлопнулись: 2 из 8» на
 *     главной, после того как в посеве появились тренеры;
 *   · `68-novost-statya:308` — «цель „назад“ не достаёт вверх», впервые
 *     на живой статье: до посева новостей в базе не было вовсе.
 *
 * ПОЧЕМУ ОДНИМ ФАЙЛОМ. ПАДЕНИЯ СОБИРАЮТСЯ ОДНИМ ПРОГОНОМ, ПОЧИНКА ПО
 * ОДНОМУ ЗАПРЕЩЕНА. Четыре отдельных замера — четыре круга «прогони»,
 * и каждый круг стоит Костиного времени.
 *
 * ЭТО ДИАГНОСТИКА, А НЕ ЗАМОРОЗКА: она ничего не требует, она пишет
 * `tests/reports/zamer-hvosta.json`. Решение принимается по таблице.
 */
const { test, expect } = require('../../fixtures');
const fs = require('fs');
const path = require('path');

const ОТЧЁТ = path.join(__dirname, '..', '..', 'reports', 'zamer-hvosta.json');
const собрано = {};

function записать(ключ, что) {
    собрано[ключ] = что;
    fs.mkdirSync(path.dirname(ОТЧЁТ), { recursive: true });
    fs.writeFileSync(ОТЧЁТ, JSON.stringify(собрано, null, 2), 'utf8');
}

/** Ждём покоя списков: карточки приходят ответом базы, позже загрузки. */
async function покой(page, селектор) {
    await page.waitForSelector(селектор, { timeout: 20000 });
    await page.waitForFunction((с) => {
        const n = document.querySelectorAll(с).length;
        const было = window.__покой;
        window.__покой = n;
        return n > 0 && n === было;
    }, селектор, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

test.describe('замер хвоста 01.11', () => {

    test('главная: ритм первого экрана и витрина .vn-four', async ({ page }, info) => {
        test.setTimeout(90000);
        await page.goto('/index.html');
        await покой(page, '.vn-four .court-card, .vn-four .coach-card');

        const з = await page.evaluate(() => {
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : null;
            const пр = e => {
                if (!e) return null;
                const r = e.getBoundingClientRect();
                return { верх: Math.round(r.top * 10) / 10, низ: Math.round(r.bottom * 10) / 10,
                         ш: Math.round(r.width), в: Math.round(r.height) };
            };
            const цифры = [...document.querySelectorAll('.hero-stat-value')];
            const подписи = [...document.querySelectorAll('.hero-stat-label')];
            const карточки = [...document.querySelectorAll('.vn-four .court-card, .vn-four .coach-card')];

            return {
                окно: { ш: window.innerWidth, в: window.innerHeight },
                низкийЛёжа: matchMedia('(max-height: 500px) and (orientation: landscape)').matches,
                крутилки: {
                    hero: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero').trim(),
                    heroSub: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-sub').trim(),
                    heroNum: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-num').trim(),
                    heroCap: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-cap').trim(),
                    полОбложки: getComputedStyle(document.documentElement).getPropertyValue('--oblozhka-pol').trim(),
                    потолокОбложки: getComputedStyle(document.documentElement).getPropertyValue('--oblozhka-potolok').trim()
                },
                заголовокГлавной: { кегль: ч(document.querySelector('.hero-title, .hero h1')),
                                    место: пр(document.querySelector('.hero-title, .hero h1')) },
                цифры: цифры.map(e => ({ текст: (e.textContent || '').trim().slice(0, 12),
                                         кегль: ч(e), место: пр(e) })),
                подписи: подписи.map(e => ({ кегль: ч(e), место: пр(e) })),
                /* СХЛОПНУТАЯ КАРТОЧКА — ЭТО ВЫСОТА МЕНЬШЕ 40 (проба 97). */
                витрина: карточки.map(к => ({
                    класс: к.className,
                    имя: (к.querySelector('h4') || {}).textContent || null,
                    место: пр(к),
                    картинка: пр(к.querySelector('img')),
                    'картинка.src': (к.querySelector('img') || {}).getAttribute
                        ? (к.querySelector('img').getAttribute('src') || '').slice(-40) : null,
                    'картинка.complete': (к.querySelector('img') || {}).complete,
                    строк: [...к.querySelectorAll('span, h4')].map(
                        s => (s.className || s.tagName) + ':' + Math.round(s.getBoundingClientRect().height))
                }))
            };
        });
        записать(info.project.name + ' · главная', з);
        expect(з.витрина.length, 'витрины на главной нет — мерить нечего').toBeGreaterThan(0);
    });

    test('баттлы: заголовок, VS и имена', async ({ page }, info) => {
        test.setTimeout(90000);
        await page.goto('/pages/battles.html');
        await page.waitForFunction(
            () => document.querySelector('.bo-hero, .bo-hero-stats, h1') !== null,
            null, { timeout: 20000 });
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.waitForTimeout(300);

        const з = await page.evaluate(() => {
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : null;
            const текст = e => e ? (e.textContent || '').trim().slice(0, 24) : null;
            const пары = {};
            for (const с of ['.bo-hero h1', '.bo-hero-stat-value', '.bo-hero-stat-label',
                             '.bo-vs', '.battle-vs', '[class*=vs]', '.bo-card h3',
                             '.bo-card-name', '[class*=battle] h3']) {
                const э = document.querySelector(с);
                if (э) пары[с] = { кегль: ч(э), текст: текст(э) };
            }
            return {
                окно: { ш: window.innerWidth, в: window.innerHeight },
                низкийЛёжа: matchMedia('(max-height: 500px) and (orientation: landscape)').matches,
                крутилки: {
                    hero: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero').trim(),
                    heroNum: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-num').trim()
                },
                уровни: пары
            };
        });
        записать(info.project.name + ' · баттлы', з);
        expect(Object.keys(з.уровни).length, 'на баттлах не нашлось ни одного уровня')
            .toBeGreaterThan(0);
    });

    test('страница новости: цель «назад» и лестница', async ({ page }, info) => {
        test.setTimeout(90000);
        /* СТАТЬЯ БЕРЁТСЯ ИЗ ПОСЕВА, А НЕ ИЗ БОЕВОЙ БАЗЫ: `test-news-1`
           сеется всегда (`tests/seed.js`). */
        await page.goto('/pages/news-kg.html?slug=test-news-1');
        await page.waitForFunction(
            () => document.querySelector('.nw-statya, .news-statya, article, main') !== null,
            null, { timeout: 20000 });
        await page.evaluate(() => document.fonts && document.fonts.ready);
        await page.waitForTimeout(500);

        const з = await page.evaluate(() => {
            const пр = e => {
                if (!e) return null;
                const r = e.getBoundingClientRect();
                return { верх: Math.round(r.top * 10) / 10, низ: Math.round(r.bottom * 10) / 10,
                         лево: Math.round(r.left * 10) / 10,
                         ш: Math.round(r.width * 10) / 10, в: Math.round(r.height * 10) / 10 };
            };
            /* «НАЗАД» ИЩЕТСЯ ПО СМЫСЛУ, А НЕ ПО ОДНОМУ ИМЕНИ КЛАССА. */
            const назад = document.querySelector(
                '.nw-back, .news-back, [class*=back], a[href*="news"][class*=nav]');
            const кто = (x, y) => {
                const э = document.elementFromPoint(x, y);
                return э ? (э.className || э.tagName) + '' : null;
            };
            const м = пр(назад);
            return {
                окно: { ш: window.innerWidth, в: window.innerHeight },
                назад: назад ? { класс: назад.className, текст: (назад.textContent || '').trim().slice(0, 20),
                                 место: м,
                                 /* КТО ЛОВИТ НАЖАТИЕ по четырём точкам вокруг центра */
                                 центр: м ? кто(м.лево + м.ш / 2, м.верх + м.в / 2) : null,
                                 выше: м ? кто(м.лево + м.ш / 2, Math.max(1, м.верх - 6)) : null,
                                 ниже: м ? кто(м.лево + м.ш / 2, м.низ + 6) : null,
                                 'поля': getComputedStyle(назад).padding,
                                 'до': getComputedStyle(назад, '::before').height } : null,
                заголовок: пр(document.querySelector('h1')),
                'заголовок.кегль': document.querySelector('h1')
                    ? Math.round(parseFloat(getComputedStyle(document.querySelector('h1')).fontSize) * 10) / 10
                    : null
            };
        });
        записать(info.project.name + ' · новость', з);
        expect(з.окно.ш, 'окно нулевой ширины').toBeGreaterThan(0);
    });
});
