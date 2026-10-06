/**
 * СТРАНИЦА «ВЕСЬ РЕЙТИНГ» — ОБЛОЖКА, ФИЛЬТРЫ И ТАБЛИЦА. 06.10.
 *
 * Замер пяти видов нашёл четвёртое семейство обложек со своими числами:
 * заголовок clamp(1.9rem, 4.4vw, 3.1rem) давал 49.6 · 45.1 · 37.1 · 33.8 ·
 * 26 — ни одно число, кроме последнего, не стоит на шкале; пол 460 своим
 * числом; чип пола 37 на 768 и 390 — такой ступени на шкале кнопок нет
 * вовсе; таблица 1398 при окне 1512.
 *
 * ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя токена, число
 *     говорит замер — и только на нужной ширине;
 *   • ДОХОДИТ ЛИ НАЖАТИЕ до чипа пола: высота коробки и цель нажатия
 *     разные вещи;
 *   • ЧТО НА ОБЛОЖКЕ НЕТ ЧИСЕЛ. Это решение Кости, а не свойство css:
 *     плашку может вернуть любой, кто правит отрисовку;
 *   • ДОЛЮ ЭКРАНА, которую съедает обложка на низком горизонтальном.
 *
 * ПОРОГИ: если обложки, чипов или строк таблицы на экране нет, проверка
 * ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ШКАЛА_КНОПОК = [28, 36, 44, 52];

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/players.html', сезон: 'Сезон 2026' },
    { имя: 'en', адрес: '/pages/players-en.html', сезон: 'Season 2026' },
    { имя: 'kg', адрес: '/pages/players-kg.html', сезон: '2026-сезон' },
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(() => document.querySelectorAll('.pl-hero-title').length > 0,
        null, { timeout: 15000 });
    await page.waitForTimeout(1200);
}

const кегль = async (page, сел) => page.evaluate(с => {
    const э = document.querySelector(с);
    if (!э) return null;
    const c = getComputedStyle(э);
    return { fs: Math.round(parseFloat(c.fontSize)), fw: c.fontWeight,
             lh: Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100 };
}, сел);

for (const Я of ЯЗЫКИ) {

test.describe('страница рейтинга · ' + Я.имя, () => {

    test('обложка не съедает экран и стоит на общем полу раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const о = document.querySelector('.pl-hero');
            if (!о) return null;
            return { h: Math.round(о.getBoundingClientRect().height),
                     экран: window.innerHeight,
                     пол: getComputedStyle(о).minHeight };
        });
        expect(r, 'ПОРОГ: обложки нет на экране').not.toBeNull();
        /* ДОЛЯ ЭКРАНА, А НЕ ЧИСЛО: у турниров обложка на телефоне боком
           съедала первый экран целиком, и ровно это мы не повторяем. */
        const доля = r.h / r.экран;
        expect(доля, 'обложка занимает ' + Math.round(доля * 100) + '% экрана (' +
            r.h + ' при ' + r.экран + ')').toBeLessThanOrEqual(0.55);
        expect(r.пол, 'пол обложки снова записан своим числом, а не токеном раздела')
            .not.toBe('460px');
    });

    test('заголовок и подзаголовок обложки стоят на ступенях шкалы', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await кегль(page, '.pl-hero-title');
        const п = await кегль(page, '.pl-hero-subtitle');
        expect(з, 'ПОРОГ: заголовка обложки нет').not.toBeNull();
        expect(ШКАЛА_КЕГЛЕЙ, 'кегль заголовка ' + з.fs + ' — такой ступени на шкале нет. ' +
            'Было clamp: 49.6 · 45.1 · 37.1 · 33.8 · 26').toContain(з.fs);
        expect(з.lh, 'межстрочный заголовка ' + з.lh + ' — заголовку положен 1.1').toBe(1.1);
        if (п) {
            expect(ШКАЛА_КЕГЛЕЙ, 'кегль подзаголовка ' + п.fs + ' — такой ступени нет. ' +
                'Было 20.8').toContain(п.fs);
            expect(п.fs, 'подзаголовок не тише заголовка: ' + п.fs + ' против ' + з.fs)
                .toBeLessThan(з.fs);
        }
    });

    test('на обложке нет чисел — только название и сезон', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const с = document.querySelector('.pl-hero-content');
            return { плашек: document.querySelectorAll('.pl-hero-stat').length,
                     текст: с ? с.innerText.replace(/\s+/g, ' ').trim() : null };
        });
        expect(r.текст, 'ПОРОГ: содержимого обложки нет').not.toBeNull();
        expect(r.плашек, 'на обложку вернулись плашки с числами. Слово Кости 06.10: ' +
            '«онлайн убери» и «391 игроков — убери тоже, числа не надо»').toBe(0);
        /* Единственное число, которому здесь место, — год сезона. */
        const числа = (r.текст.match(/\d+/g) || []).filter(ч => ч !== '2026');
        expect(числа, 'на обложке стоят числа помимо года сезона: ' + числа.join(', ') +
            ' — «' + r.текст + '»').toEqual([]);
        expect(r.текст, 'в обложке пропал сезон').toContain('2026');
    });

    test('чип пола — ступень шкалы кнопок, и нажатие доходит', async ({ page }) => {
        await открыть(page, Я.адрес);
        const чипы = page.locator('.pl-gender-tab');
        const сколько = await чипы.count();
        expect(сколько, 'ПОРОГ: чипов пола нет — мерить нечего').toBeGreaterThan(0);

        const высоты = await page.evaluate(() =>
            [...document.querySelectorAll('.pl-gender-tab')]
                .filter(э => э.offsetParent !== null)
                .map(э => Math.round(э.getBoundingClientRect().height)));
        for (const h of высоты) {
            expect(ШКАЛА_КНОПОК, 'чип пола высотой ' + h + ' — такой ступени на шкале ' +
                'кнопок нет (28 · 36 · 44 · 52). Замер 06.10 давал 37 на 768 и 390')
                .toContain(h);
        }
        const к = await кегль(page, '.pl-gender-tab');
        expect(ШКАЛА_КЕГЛЕЙ, 'кегль чипа ' + к.fs + ' мимо шкалы').toContain(к.fs);

        /* НАЖАТИЕ, А НЕ КЛАСС: цель нажатия и коробка — разные вещи. */
        const второй = чипы.nth(1);
        if (await второй.count()) {
            await второй.click();
            await page.waitForTimeout(400);
            const активных = await page.evaluate(() =>
                document.querySelectorAll('.pl-gender-tab.active').length);
            expect(активных, 'после нажатия выбранным должен быть ровно один чип').toBe(1);
        }
    });

    test('таблица рейтинга живёт в колонке, а не во всю ширину окна', async ({ page }) => {
        await открыть(page, Я.адрес);
        const r = await page.evaluate(() => {
            const т = document.querySelector('.pl-table');
            /* ПРОВЕРКА ОБЯЗАНА ЗНАТЬ, КОГДА ЕЁ УСЛОВИЕ НЕ ДЕЙСТВУЕТ.
               Таблицы может не быть по двум законным причинам: в базе
               прогона нет игроков (рисуется «Игроки не найдены») или
               страница открыта гостем и список закрыт входом. Это не
               беда вёрстки, и падать тут значит врать. */
            if (!т) return { пусто: !!document.querySelector('.pl-no-results'),
                             гость: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta') };
            const ряды = [...т.querySelectorAll('.pl-row:not(.pl-row-header)')]
                .filter(э => э.offsetParent !== null);
            const к = т.getBoundingClientRect();
            return { ширина: Math.round(к.width), окно: window.innerWidth,
                     слева: Math.round(к.left),
                     справа: Math.round(window.innerWidth - к.right),
                     рядов: ряды.length,
                     высоты: [...new Set(ряды.slice(0, 10)
                         .map(э => Math.round(э.getBoundingClientRect().height)))] };
        });
        test.skip(!!(r && (r.пусто || r.гость)),
            r && r.пусто ? 'в базе прогона нет игроков — таблицу рисовать не из чего'
                         : 'список закрыт входом: это экран гостя, а не таблица');
        expect(r && r.ширина, 'ПОРОГ: таблицы рейтинга нет на экране, и это не пустая ' +
            'база и не экран гостя — значит таблица пропала').toBeTruthy();
        expect(r.рядов, 'ПОРОГ: в таблице нет строк').toBeGreaterThan(0);
        expect(r.ширина, 'таблица ' + r.ширина + ' при окне ' + r.окно +
            ' — снова во всю ширину. ATP, WTA и ITF держат рейтинг в узкой колонке')
            .toBeLessThanOrEqual(1100);
        if (r.окно > 1100) {
            expect(Math.abs(r.слева - r.справа), 'таблица уже окна, но не по центру: ' +
                'слева ' + r.слева + ', справа ' + r.справа).toBeLessThanOrEqual(2);
        }
        /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: у последней строки нет нижней границы, и она
           законно на пиксель ниже соседей. Мерим разброс, а не равенство —
           первая редакция этой проверки требовала одну высоту и падала на
           52 против 53. */
        const разброс = Math.max(...r.высоты) - Math.min(...r.высоты);
        expect(разброс, 'строки таблицы разной высоты на одном виде: ' +
            r.высоты.join(', ') + ' — разброс ' + разброс).toBeLessThanOrEqual(1);
    });

    test('страница не переливает за край экрана', async ({ page }) => {
        await открыть(page, Я.адрес);
        const п = await page.evaluate(() =>
            Math.max(0, document.documentElement.scrollWidth - document.documentElement.clientWidth));
        expect(п, 'страница рейтинга переливает вбок на ' + п).toBe(0);
    });

});

}

/* ============================================================================
   ПЬЕДЕСТАЛ, ОБЛОЖКА КАТЕГОРИИ И ПОЛОСА СТРАНИЦ — 06.10, НОЧЬ
   ============================================================================
   Замер пяти видов нашёл шесть бед, и главную из них заморозка увидеть не
   могла: `display: none` у очков пьедестала ниже 768 — правило в файле
   честное, а на экране пропадало главное число рейтинга. Такое ловит только
   прогон.

   ЧЕГО ЗАМОРОЗКА НЕ ВИДИТ, А ВИДИТ ТОЛЬКО ПРОГОН:
     • ЧТО ОЧКИ ВООБЩЕ ЕСТЬ НА ЭКРАНЕ. Кегль объявлен — и при этом коробка
       нулевая;
     • ОТНОШЕНИЕ МЕЖДУ ТРЕМЯ МЕСТАМИ. Числа стоят в разных медиа, и равными
       они оказываются только на каком-то одном виде;
     • ЧТО ЛЕСТНИЦА ОБЗОРНОЙ И КАТЕГОРИИ ОДНА. Два экрана, один файл — и
       разойтись они могут на любом из пяти видов;
     • ОКНО ПОЛОСЫ СТРАНИЦ. Сорок кнопок подряд — это правильный css и
       шесть рядов на телефоне.
   ============================================================================ */

const ВИДЫ_ПЬЕДЕСТАЛА = ['desktop', 'tablet', 'mobile', 'phone-landscape', 'tablet-landscape'];

async function открытьЭкран(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(() => document.querySelectorAll('.pl-podium-card').length > 0,
        null, { timeout: 15000 }).catch(() => null);
    await page.waitForTimeout(1400);
}

/** Кегль, вес и РЕАЛЬНАЯ коробка уровня пьедестала. */
const уровень = (page, сел) => page.evaluate(с => {
    const э = document.querySelector(с);
    if (!э) return null;
    const c = getComputedStyle(э);
    const r = э.getBoundingClientRect();
    return {
        кегль: Math.round(parseFloat(c.fontSize)),
        вес: c.fontWeight,
        мс: c.lineHeight === 'normal' ? null
            : Math.round(parseFloat(c.lineHeight) / parseFloat(c.fontSize) * 100) / 100,
        показ: c.display,
        ш: Math.round(r.width),
        в: Math.round(r.height),
    };
}, сел);

for (const Я of ЯЗЫКИ) {

test.describe('пьедестал рейтинга · ' + Я.имя, () => {
    /* ПОД СЕССИЕЙ АДМИНА, А НЕ ГОСТЕМ. Прогон 06.10 пропустил ВСЕ пятнадцать
       проверок пьедестала: гостю отдаётся обрезанный список, и трёх карточек
       на экране не оказалось. Проверка, которая всегда пропускается, ничего
       не доказывает — ровно как проверка, которая не может упасть. */
    test.use({ storageState: 'tests/.auth/admin.json' });


    test('очки видны на всех видах, а не только на широких', async ({ page }) => {
        await открытьЭкран(page, Я.адрес);

        const места = ['first', 'second', 'third'];
        const снято = [];
        for (const м of места) {
            снято.push(await уровень(page, '.pl-podium-' + м + ' .pl-podium-points'));
        }

        /* ПОРОГ: пьедестала может не быть вовсе — в базе прогона меньше трёх
           игроков, или список закрыт входом. Это не беда вёрстки, и
           проверять тогда нечего. */
        const скольжко = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.pl-podium-card').length,
            строк: document.querySelectorAll('.pl-row:not(.pl-row-header)').length,
            гость: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta'),
        }));
        test.skip(скольжко.карточек < 3,
            'пьедестала на экране нет: карточек ' + скольжко.карточек + ', строк списка ' +
            скольжко.строк + ', экран гостя: ' + скольжко.гость);

        снято.forEach((у, i) => {
            expect(у, 'очки ' + (i + 1) + '-го места: элемента нет в разметке').toBeTruthy();
            expect(у.показ,
                'очки ' + (i + 1) + '-го места погашены display:none — ровно это и было ' +
                'до 06.10 ниже 768: кегль объявлен, а главного числа рейтинга на экране нет')
                .not.toBe('none');
            expect(у.в,
                'коробка очков ' + (i + 1) + '-го места нулевой высоты: на экране их нет')
                .toBeGreaterThan(0);
        });
    });

    test('первое место крупнее второго, второе крупнее третьего', async ({ page }) => {
        await открытьЭкран(page, Я.адрес);

        const скольжко = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.pl-podium-card').length,
            строк: document.querySelectorAll('.pl-row:not(.pl-row-header)').length,
            гость: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta'),
        }));
        test.skip(скольжко.карточек < 3,
            'пьедестала на экране нет: карточек ' + скольжко.карточек + ', строк списка ' +
            скольжко.строк + ', экран гостя: ' + скольжко.гость);

        for (const часть of ['medal', 'points']) {
            const кл = часть === 'medal' ? '.pl-podium-medal' : '.pl-podium-points';
            const а = await уровень(page, '.pl-podium-first ' + кл);
            const б = await уровень(page, '.pl-podium-second ' + кл);
            const в = await уровень(page, '.pl-podium-third ' + кл);
            expect(а && б && в, часть + ': уровня нет на экране').toBeTruthy();
            expect(а.кегль, часть + ': первое место (' + а.кегль + ') не крупнее второго (' +
                б.кегль + ') — иерархия пьедестала исчезла').toBeGreaterThan(б.кегль);
            expect(б.кегль, часть + ': второе место (' + б.кегль + ') мельче третьего (' +
                в.кегль + ')').toBeGreaterThanOrEqual(в.кегль);
        }

        /* Медаль третьего места РАВНЯЛАСЬ медали второго на 844: третье
           место читалось как второе. Отношение строгое. */
        const м2 = await уровень(page, '.pl-podium-second .pl-podium-medal');
        const м3 = await уровень(page, '.pl-podium-third .pl-podium-medal');
        expect(м2.кегль, 'медаль третьего места (' + м3.кегль + ') равна медали второго')
            .toBeGreaterThan(м3.кегль);
    });

    test('кегли и межстрочный пьедестала стоят на ступенях', async ({ page }) => {
        await открытьЭкран(page, Я.адрес);

        const скольжко = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.pl-podium-card').length,
            строк: document.querySelectorAll('.pl-row:not(.pl-row-header)').length,
            гость: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta'),
        }));
        test.skip(скольжко.карточек < 3,
            'пьедестала на экране нет: карточек ' + скольжко.карточек + ', строк списка ' +
            скольжко.строк + ', экран гостя: ' + скольжко.гость);

        const ЛЕСТНИЦА_МС = [1, 1.1, 1.3, 1.5, 1.65];
        for (const сел of ['.pl-podium-first .pl-podium-name',
                           '.pl-podium-second .pl-podium-name',
                           '.pl-podium-first .pl-podium-points',
                           '.pl-podium-first .pl-podium-medal']) {
            const у = await уровень(page, сел);
            expect(у, сел + ': уровня нет на экране').toBeTruthy();
            expect(ШКАЛА_КЕГЛЕЙ, сел + ': кегль ' + у.кегль + ' мимо шкалы')
                .toContain(у.кегль);
            if (у.мс !== null) {
                expect(ЛЕСТНИЦА_МС, сел + ': межстрочный ' + у.мс + ' мимо лестницы')
                    .toContain(у.мс);
            }
        }
    });

    test('кружок пьедестала — объявленный диаметр, а не диаметр с рамкой', async ({ page }) => {
        await открытьЭкран(page, Я.адрес);

        const скольжко = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.pl-podium-card').length,
            строк: document.querySelectorAll('.pl-row:not(.pl-row-header)').length,
            гость: !!document.querySelector('.pl-guest-overlay, .pl-guest-cta'),
        }));
        test.skip(скольжко.карточек < 3,
            'пьедестала на экране нет: карточек ' + скольжко.карточек + ', строк списка ' +
            скольжко.строк + ', экран гостя: ' + скольжко.гость);

        const ДИАМЕТРЫ = [110, 80, 72, 60, 48, 40];
        const кружки = await page.evaluate(() =>
            [...document.querySelectorAll('.pl-podium-photo')].map(э => ({
                правило: Math.round(parseFloat(getComputedStyle(э).width)),
                короб: getComputedStyle(э).boxSizing,
            })));
        expect(кружки.length, 'кружков пьедестала на экране нет').toBeGreaterThanOrEqual(3);
        кружки.forEach(к => {
            expect(к.короб, 'кружок считает коробку без рамки: объявленный диаметр ' +
                'перестаёт быть диаметром, и на разных видах он гулял на шесть пикселей')
                .toBe('border-box');
            expect(ДИАМЕТРЫ, 'диаметр ' + к.правило + ' мимо шести размеров компонента')
                .toContain(к.правило);
        });
    });

    test('обложка категории живёт по тем же правилам, что обзорная', async ({ page }) => {
        await открытьЭкран(page, Я.адрес);
        const обзорная = await кегль(page, '.pl-hero-title');

        await открытьЭкран(page, Я.адрес + '?tab=men-tour');
        const категория = await кегль(page, '.pl-cat-title');

        expect(категория, 'заголовка обложки категории нет на экране').toBeTruthy();
        expect(категория.кегль,
            'заголовок категории (' + категория.кегль + ') разошёлся с обзорной (' +
            (обзорная && обзорная.кегль) + '): это ОДИН разворот на двух экранах')
            .toBe(обзорная.кегль);

        const плашек = await page.evaluate(() =>
            document.querySelectorAll('.pl-cat-stat, .pl-hero-stat').length);
        expect(плашек, 'на обложке категории вернулись плашки с числами — решение ' +
            'Кости 06.10 «числа не надо» и «онлайн убери» применяется к ней тоже')
            .toBe(0);
    });

});

}

/* ---------------------------------------------------------------------------
   ПОЛОСА СТРАНИЦ ВИДНА ТОЛЬКО ВОШЕДШЕМУ: гостю отдаются первые десять строк,
   и страниц у него одна. Поэтому эти проверки идут под сессией админа.
   --------------------------------------------------------------------------- */
test.describe('полоса страниц рейтинга', () => {
    test.use({ storageState: 'tests/.auth/admin.json' });

    test('страниц показывается окно, а не все подряд', async ({ page }, testInfo) => {
        test.skip(!ВИДЫ_ПЬЕДЕСТАЛА.includes(testInfo.project.name), 'вид не из набора');

        await page.goto('/pages/players.html?tab=men-tour');
        await page.waitForTimeout(1800);

        const r = await page.evaluate(() => {
            const кнопки = [...document.querySelectorAll('.pl-page-btn.pl-page-num')];
            if (!кнопки.length) return { нет: true };
            const s = getComputedStyle(кнопки[0]);
            return {
                номеров: кнопки.length,
                первая: кнопки[0].textContent.trim(),
                последняя: кнопки[кнопки.length - 1].textContent.trim(),
                многоточий: document.querySelectorAll('.pl-page-gap').length,
                высота: Math.round(parseFloat(s.height)),
                ширина: Math.round(parseFloat(s.minWidth)),
                строк: document.querySelectorAll('.pl-cat-row:not(.pl-row-header)').length,
            };
        });

        /* ПОРОГ С НАЗВАННОЙ ПРИЧИНОЙ: страниц может быть одна — в базе
           прогона меньше двадцати игроков этого разряда. */
        test.skip(!!(r && r.нет), 'полосы страниц нет: в разряде меньше одной страницы игроков');

        expect(r.номеров, 'номеров страниц ' + r.номеров + ' — окно должно показывать ' +
            'не больше семи: первую, последнюю, текущую и по соседу с каждой стороны')
            .toBeLessThanOrEqual(7);
        expect(r.первая, 'первая страница пропала из окна').toBe('1');
        expect(Number(r.последняя), 'последняя страница пропала из окна')
            .toBeGreaterThanOrEqual(Number(r.первая));
        expect(ШКАЛА_КНОПОК, 'кнопка страницы ' + r.высота + ' мимо шкалы кнопок')
            .toContain(r.высота);
        expect(r.ширина, 'кнопка страницы уже цели нажатия 44').toBeGreaterThanOrEqual(44);
    });
});
