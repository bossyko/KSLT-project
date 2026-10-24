/**
 * КУСОК 149 — НАЖАТИЯ ПОЛОСЫ СТРАНИЦ ЖИВУТ ТАМ, ГДЕ ПОЛОСА РИСУЕТСЯ.
 *
 * ЧТО БЫЛО. Полосу рисовал ОДИН дом, а решение «что делает нажатие» было
 * определено СЕМЬ раз: кабинет трижды, «Новости» один раз, «Игроки»
 * дважды и седьмой — в доме витрины, куда за ним приходили корты,
 * тренеры и партнёры.
 *
 * ПОЧЕМУ ПОЛОВИНА ПРОВЕРОК НА СТЕНДЕ, А НЕ НА ЖИВОМ ЭКРАНЕ. Три из шести
 * сведённых мест живут В КАБИНЕТЕ, за входом, и с моей стороны их не
 * видно вовсе. Четвёртое — «Игроки» — на тестовой базе отдаёт пустые
 * категории: строк ноль, полоса не рисуется, проверять нечего. Поэтому
 * дом гоняется на стенде `maket/stend-polosa-nazhatiya.html` с подставным
 * списком, а живым экраном остаются «Новости», где данных хватает.
 * Это сказано вслух, а не выдано за проверку живого кабинета.
 *
 * ГЛАВНОЕ, ЧТО ЭТА ПРОБА ДЕРЖИТ, НАШЁЛ САМ СТЕНД. Слушатель на
 * `document` слышит нажатия ВСЕХ полос страницы: на стенде с двумя
 * полосами одно нажатие уводило на вторую страницу ОБЕ, а нажатие в
 * третьей полосе уводило первые две на пятую. На живых экранах полоса
 * сегодня одна, поэтому беда не выстреливала — и именно поэтому её
 * держит проба, а не память.
 */
const { test, expect } = require('@playwright/test');

const СТЕНД = '/maket/stend-polosa-nazhatiya.html';

async function домНаМесте(page) {
    await page.waitForFunction(
        () => !!(window.KSLT_полосаСтраниц && window.KSLT_полосаСтраниц.нажатия) && !!window.СТЕНД,
        null, { timeout: 15000 });
    await page.waitForSelector('#stPolosaC .pl-page-btn', { timeout: 15000 });
}

/* МЕРКА ЕДЕТ ИСХОДНИКОМ И РАЗВОРАЧИВАЕТСЯ В СТРАНИЦЕ (урок куска 148:
   строка в `evaluate` — это выражение, а не зов). */
const СНЯТЬ = `() => {
    const снять = (и) => {
        const п = document.getElementById('stPolosa' + и);
        const акт = п.querySelector('.pl-page-btn.active');
        return {
            страница: Number(document.getElementById('stStr' + и).textContent),
            перерисовок: Number(document.getElementById('stZovov' + и).textContent),
            активная: акт ? Number(акт.textContent) : null,
            счётчик: (п.querySelector('.pl-page-count') || {}).textContent || '',
            перваяСтрока: (document.querySelector('#stSpisok' + и + ' li') || {}).textContent || ''
        };
    };
    return { A: снять('A'), B: снять('B'), C: снять('C') };
}`;

const замерить = (page) => page.evaluate(и => eval('(' + и + ')')(), СНЯТЬ);

test.describe('нажатия полосы страниц: одно понятие на продукт', () => {

    test('нажатие двигает СВОЮ полосу, а не все на странице', async ({ page }) => {
        await page.goto(СТЕНД);
        await домНаМесте(page);

        const было = await замерить(page);
        expect(было.A.страница, 'A начинается не с первой').toBe(1);
        expect(было.C.страница, 'C считает страницы не с нуля').toBe(0);

        await page.click('#stPolosaA .pl-page-next');
        const послеA = await замерить(page);

        expect(послеA.A.страница, 'A не сдвинулась').toBe(2);
        expect(послеA.A.перваяСтрока, 'список A не перерисовался').toBe('запись 11');
        /* ВОТ ЭТО И ЕСТЬ БЕДА, КОТОРУЮ НАШЁЛ СТЕНД: без довода `полоса`
           обе соседние полосы уходили на вторую страницу от одного
           нажатия. */
        expect(послеA.B.страница, 'нажатие в полосе A сдвинуло полосу B').toBe(1);
        expect(послеA.B.перерисовок, 'полоса B перерисовалась от чужого нажатия').toBe(1);
        expect(послеA.C.страница, 'нажатие в полосе A сдвинуло полосу C').toBe(0);
    });

    /* УЗКИЙ ВИД НЕ ПОКАЗЫВАЕТ НОМЕРА ВОВСЕ, И ЭТО РЕШЕНИЕ, А НЕ ПОМЕХА:
       ниже 640 полоса сжата до «страница N из M» между стрелками (замер
       куска 100 на стенде полосы: сорок номеров в ряд 343 не влезают ни
       при каком окне). Поэтому проба идёт двумя путями — номером там, где
       номера есть, и стрелками там, где их нет, — и в обоих случаях
       проверяет ОДНО: номер страницы берётся с того, что нажали. */
    test('номер страницы берётся с нажатого, а соседняя полоса стоит', async ({ page }) => {
        await page.goto(СТЕНД);
        await домНаМесте(page);

        const номера = page.locator('#stPolosaB .pl-page-num');
        const всего = await номера.count();

        if (всего > 1) {
            await номера.nth(всего - 1).click();
        } else {
            /* сжатая форма: три шага стрелкой до той же четвёртой */
            for (let i = 0; i < 3; i++) await page.click('#stPolosaB .pl-page-next');
        }

        const м = await замерить(page);
        expect(м.B.страница, 'не доехали до последней страницы').toBe(4);
        expect(м.B.счётчик, 'счётчик строк не доехал до последней страницы').toContain('31');
        expect(м.B.перваяСтрока, 'список B не перерисовался').toBe('запись 31');
        expect(м.A.страница, 'полоса A сдвинулась от нажатий в B').toBe(1);
        expect(м.A.перерисовок, 'полоса A перерисовалась от чужих нажатий').toBe(1);
    });

    /* СЧЁТ С НУЛЯ — СВОЙСТВО ЗОВУЩЕГО. Так считают «Мои игры» в кабинете:
       в состоянии 0, на экране 1. Ошибка на единицу видна сразу. */
    test('счёт с нуля: в состоянии ноль, на экране единица', async ({ page }) => {
        await page.goto(СТЕНД);
        await домНаМесте(page);

        const было = await замерить(page);
        expect(было.C.страница, 'состояние C не ноль').toBe(0);
        expect(было.C.активная, 'на экране C не первая страница').toBe(1);

        await page.click('#stPolosaC .pl-page-next');
        const стало = await замерить(page);
        expect(стало.C.страница, 'состояние C после шага не единица').toBe(1);
        expect(стало.C.активная, 'на экране C после шага не вторая').toBe(2);
        expect(стало.C.перваяСтрока, 'список C не перерисовался').toBe('запись 11');
    });

    /* ПОВТОРНАЯ РЕГИСТРАЦИЯ — ТО, ЧТО ДЕЛАЕТ КАЖДАЯ ОТРИСОВКА СПИСКА.
       Если дом перестанет помнить пару «область + ключ», одно нажатие
       начнёт давать два шага. */
    test('повторная регистрация не удваивает шаг', async ({ page }) => {
        await page.goto(СТЕНД);
        await домНаМесте(page);

        await page.click('#stZanovo');
        await page.click('#stZanovo');
        await page.click('#stPolosaC .pl-page-next');

        const м = await замерить(page);
        expect(м.C.страница, 'одно нажатие дало не один шаг — слушателей больше одного').toBe(1);
        expect(м.C.активная, 'на экране не вторая страница').toBe(2);
    });

    test('назад с первой страницы не уводит в минус', async ({ page }) => {
        await page.goto(СТЕНД);
        await домНаМесте(page);

        /* Кнопка «назад» на первой странице обязана быть недоступной —
           это рисование, и проба это проверяет, а не обходит. */
        const назад = page.locator('#stPolosaA .pl-page-prev');
        await expect(назад, 'на первой странице «назад» доступна').toBeDisabled();

        const м = await замерить(page);
        expect(м.A.страница, 'страница уехала сама').toBe(1);
    });
});

/* ЖИВОЙ ЭКРАН — «НОВОСТИ». Там же проверяется ветвь, которой на стенде
   нет вовсе: прокрутка к списку после перехода. */
const ЯЗЫКИ = [['ru', '/pages/news.html'], ['en', '/pages/news-en.html'], ['kg', '/pages/news-kg.html']];

test.describe('полоса «Новостей» на живом экране', () => {
    for (const [яз, адрес] of ЯЗЫКИ) {
        test('язык ' + яз + ': полоса листает, счётчик меняется, список едет', async ({ page }) => {
            await page.goto(адрес);
            await page.waitForFunction(
                () => !!(window.KSLT_полосаСтраниц && window.KSLT_полосаСтраниц.нажатия),
                null, { timeout: 15000 });
            await page.waitForSelector('#newsPagination .pl-page-btn', { timeout: 20000 });

            const снять = () => page.evaluate(() => {
                const п = document.getElementById('newsPagination');
                const акт = п.querySelector('.pl-page-btn.active');
                return {
                    активная: акт ? акт.textContent : null,
                    счётчик: (п.querySelector('.pl-page-count') || {}).textContent || '',
                    первая: (document.querySelector('#newsBento h2, #newsBento h3, #newsBento .nw-title') || {}).textContent || '',
                    прокрутка: Math.round(window.scrollY)
                };
            });

            const было = await снять();
            expect(было.активная, 'полоса открылась не на первой странице').toBe('1');

            await page.click('#newsPagination .pl-page-next');
            await page.waitForFunction(
                () => {
                    const акт = document.querySelector('#newsPagination .pl-page-btn.active');
                    return акт && акт.textContent === '2';
                }, null, { timeout: 15000 });
            const стало = await снять();

            expect(стало.счётчик, 'счётчик строк не изменился').not.toBe(было.счётчик);
            expect(стало.первая, 'список не перерисовался').not.toBe(было.первая);
            /* ПРОКРУТКА К СПИСКУ — ветвь дома, которой на стенде нет. */
            expect(стало.прокрутка, 'после перехода не прокрутило к списку')
                .toBeGreaterThan(0);

            /* ВТОРОЕ НАЖАТИЕ — ОДИН ШАГ. Если бы отрисовка вешала второго
               слушателя, тут вышла бы четвёртая страница вместо третьей. */
            await page.click('#newsPagination .pl-page-next');
            await page.waitForFunction(
                () => {
                    const акт = document.querySelector('#newsPagination .pl-page-btn.active');
                    return акт && акт.textContent !== '2';
                }, null, { timeout: 15000 });
            const третья = await снять();
            expect(третья.активная, 'одно нажатие дало не один шаг').toBe('3');
        });
    }
});
