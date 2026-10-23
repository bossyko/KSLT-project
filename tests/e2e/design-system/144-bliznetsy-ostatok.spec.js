/**
 * КУСОК 144 — ОСТАТОК БЛИЗНЕЦОВ, ВИТРИННЫЙ УРОВЕНЬ.
 *
 * Сторож читает файлы и видит, что семь понятий живут в доме. Эта проба
 * читает ЭКРАН: что перенесённое РАБОТАЕТ на обеих витринах — обложка
 * рисуется, карточки появляются, полоса липнет при прокрутке, членское
 * окно открывается на своём языке и закрывается.
 *
 * ГОСТЮ КНОПКА ЕСТЬ ТОЛЬКО У ТРЕНЕРОВ: у кортов она рисуется лишь
 * партнёрским, и в боевых данных таких нет. Замерено, а не подогнано —
 * поэтому членское окно проверяется там, где кнопка есть.
 *
 * ЛИПКОСТЬ МЕРИТСЯ ПОЛОЖЕНИЕМ ПРИ ПРОКРУТКЕ, А НЕ НАЛИЧИЕМ СВОЙСТВА
 * (правило куска 139): свойство может стоять и не работать.
 *
 * ПОЯВЛЕНИЕ — ТОЖЕ ПРОКРУТКОЙ. Первая запись пробы требовала показанных
 * карточек сразу после загрузки и упала на ТЕЛЕФОНЕ БОКОМ: при 844×390
 * верх первой карточки стоит ровно на 390 — ниже сгиба, и пересекать
 * наблюдателю нечего. Код был прав, неправа была проба.
 */
const { test, expect } = require('@playwright/test');

const ВИТРИНЫ = [
    ['Корты',   '/pages/courts.html',  'ct', 'courtsHero',  'courtsFilters',  '.ct-grid', '--ct-ryadov'],
    ['Тренеры', '/pages/coaches.html', 'co', 'coachesHero', 'coachesFilters', '.co-grid', '--co-ryadov']
];
const ЯЗЫКИ = [
    ['ru', '/pages/coaches.html',    'Станьте членом KSLT', 'auth.html'],
    ['en', '/pages/coaches-en.html', 'Become a KSLT Member', 'auth-en.html'],
    ['kg', '/pages/coaches-kg.html', 'KSLT мүчөсү болуңуз', 'auth-kg.html']
];

async function дом(page) {
    await page.waitForFunction(() => !!window.KSLT_VITRINA && !!window.KSLT_DOSTUP,
        null, { timeout: 15000 });
}

test.describe('остаток близнецов сведён в дом витрины', () => {

    for (const [имя, адрес, пр, обложкаId, полосаId, сетка, ряды] of ВИТРИНЫ) {

        test(имя + ': обложку, появление и шаг даёт дом', async ({ page }) => {
            await page.goto(адрес);
            await дом(page);
            await page.waitForSelector(сетка, { timeout: 15000 });

            const м = await page.evaluate(async ([пр, обложкаId, сетка, ряды]) => {
                await new Promise(ок => setTimeout(ок, 800));
                const о = document.getElementById(обложкаId);
                const з = о ? о.querySelector('.' + пр + '-hero-title') : null;
                const фон = о ? о.querySelector('.' + пр + '-hero-bg') : null;
                const доПрокрутки = document.querySelectorAll('.' + пр + '-fade-in.visible').length;
                /* ПОЯВЛЕНИЕ ДОКАЗЫВАЕТСЯ ПРОКРУТКОЙ, А НЕ ЗАГРУЗКОЙ.
                   Первая запись пробы требовала показанных карточек СРАЗУ —
                   и упала на телефоне боком по делу своего незнания: при
                   844×390 верх первой карточки стоит РОВНО на 390, то есть
                   ниже сгиба, и наблюдателю нечего пересекать. Замерено:
                   без прокрутки 0, после прокрутки 2. Проба мерит МЕХАНИЗМ:
                   подвели карточки под глаз — метка появилась. */
                const гр = document.querySelector(сетка);
                if (гр) гр.scrollIntoView({ block: 'center' });
                await new Promise(ок => setTimeout(ок, 700));
                return {
                    заголовок: з ? з.textContent.trim() : '',
                    картинка: фон ? фон.style.backgroundImage : '',
                    всегоПоявлений: document.querySelectorAll('.' + пр + '-fade-in').length,
                    доПрокрутки: доПрокрутки,
                    показанных: document.querySelectorAll('.' + пр + '-fade-in.visible').length,
                    шаг: window.KSLT_VITRINA.шаг(сетка, ряды)
                };
            }, [пр, обложкаId, сетка, ряды]);

            expect(м.заголовок.length, 'обложка без заголовка — дом её не нарисовал').toBeGreaterThan(2);
            expect(м.картинка, 'обложка без картинки').toContain('heroes/');
            expect(м.всегоПоявлений, 'карточек с появлением нет вовсе').toBeGreaterThan(0);
            expect(м.показанных,
                'после прокрутки к сетке ни одна карточка не получила метку — ' +
                'наблюдатель не поставлен (до прокрутки было ' + м.доПрокрутки + ')')
                .toBeGreaterThan(0);
            expect(м.шаг, 'дом вернул нулевой шаг').toBeGreaterThan(0);
        });

        test(имя + ': полоса фильтров липнет при прокрутке', async ({ page }) => {
            await page.goto(адрес);
            await дом(page);
            await page.waitForSelector('#' + полосаId, { timeout: 15000 });

            const доПрокрутки = await page.evaluate(id =>
                document.getElementById(id).classList.contains('stuck'), полосаId);

            /* ПРОКРУТКА, А НЕ ЧТЕНИЕ СВОЙСТВА: метку ставит наблюдатель, и
               только когда полоса подошла под шапку. */
            await page.evaluate(() => window.scrollTo(0, 900));
            await page.waitForTimeout(700);
            const послеПрокрутки = await page.evaluate(id => {
                const п = document.getElementById(id);
                const с = п.previousElementSibling;
                return {
                    липнет: п.classList.contains('stuck'),
                    сторож: с ? с.tagName + ':' + с.style.height : null,
                    верх: Math.round(п.getBoundingClientRect().top)
                };
            }, полосаId);

            expect(доПрокрутки, 'полоса липнет ещё до прокрутки').toBe(false);
            expect(послеПрокрутки.сторож, 'сторожа перед полосой нет — его ставит дом')
                .toBe('DIV:1px');
            expect(послеПрокрутки.липнет, 'после прокрутки метки нет: наблюдатель не поставлен').toBe(true);
        });
    }

    for (const [яз, адрес, заголовок, ссылка] of ЯЗЫКИ) {

        test('членское окно гостю на ' + яз + ': текст и ссылка своего языка', async ({ page }) => {
            await page.goto(адрес);
            await дом(page);
            await page.waitForSelector('.co-card-cta', { timeout: 15000 });

            const м = await page.evaluate(async () => {
                const уровень = await window.KSLT_DOSTUP.уровень();
                document.querySelector('.co-card-cta').click();
                await new Promise(ок => setTimeout(ок, 400));
                const окно = document.querySelector('.co-membership-overlay');
                const снято = окно ? {
                    видно: окно.classList.contains('visible'),
                    заголовок: окно.querySelector('h3').textContent.trim(),
                    текст: окно.querySelector('p').textContent.trim(),
                    ссылка: окно.querySelector('a').getAttribute('href'),
                    закрывашка: !!окно.querySelector('.co-membership-close')
                } : null;
                if (окно) окно.querySelector('.co-membership-close').click();
                await new Promise(ок => setTimeout(ок, 500));
                return { уровень: уровень, снято: снято,
                         осталось: document.querySelectorAll('.co-membership-overlay').length };
            });

            expect(м.уровень, 'проба идёт гостем — иначе окна не будет').toBe('guest');
            expect(м.снято, 'членское окно не открылось').not.toBeNull();
            expect(м.снято.видно, 'окно открылось, но осталось невидимым').toBe(true);
            expect(м.снято.заголовок, 'заголовок не на языке страницы').toBe(заголовок);
            expect(м.снято.ссылка, 'кнопка ведёт не на свой язык').toBe(ссылка);
            expect(м.снято.текст.length, 'текст окна пуст').toBeGreaterThan(20);
            expect(м.снято.закрывашка, 'закрывашки нет').toBe(true);
            expect(м.осталось, 'окно не убралось после закрытия').toBe(0);
        });
    }
});
