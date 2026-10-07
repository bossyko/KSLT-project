/**
 * ОБЗОРНАЯ «УСЛУГИ» — 07.10.
 *
 * Замер в ночь нашёл 21 находку; Костя прошёл по странице глазами и назвал
 * три своих: обложка выбивается из раздела, карточки карусели приплюснуты,
 * поиск игрока выделяется размером. Всё закрыто, и вот что проверяет
 * ПРОГОН, а не заморозка:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • ДОХОДИТ ЛИ НАЖАТИЕ. Высота коробки и цель нажатия — разные вещи:
 *     меряем попаданием через elementFromPoint, а не правилом в css;
 *   • НАЛОЖЕНИЯ. Два `absolute` в двух углах встречались посередине —
 *     css об этом молчит, видит только геометрия;
 *   • ОБРЕЗАНО ЛИ ИМЯ. Клэмп стоит в файле, а обрезало или нет — решают
 *     данные: длина имени, ширина колонки и язык;
 *   • ДЕРЕВО ДОСТУПНОСТИ. Клон ленты виден глазу и не должен быть виден
 *     диктору: считаем заголовки в дереве против заголовков в разметке;
 *   • ОДИН КОМПОНЕНТ НА ДВЕ ВИТРИНЫ. «Корты» и «Тренеры» обязаны давать
 *     одинаковые карточки — это проверяется ЧИСЛАМИ, а не обещанием.
 *
 * ПОРОГ: нет карточек — проверка ПАДАЕТ, а не проходит вхолостую.
 * Пустая витрина — законное состояние и проверяется отдельно.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/services.html' },
    { имя: 'en', адрес: '/pages/services-en.html' },
    { имя: 'kg', адрес: '/pages/services-kg.html' },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

/**
 * ЖДАТЬ НАДО ОСТАНОВКИ ВЕЛИЧИНЫ, А НЕ ИСТЕЧЕНИЯ ВРЕМЕНИ. Первый прогон
 * 07.10 дал две мигающие пробы: ленты и карточки игроков приезжают из
 * базы, и замер попадал в середину отрисовки. Ждём, пока число карточек
 * перестанет меняться два замера подряд, и пока сядут шрифты — от них
 * зависит, обрезано имя или нет.
 */
async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.sv-hero h1') !== null, null, { timeout: 20000 });
    await page.waitForFunction(() => {
        const n = document.querySelectorAll('.sv-compact, .sv-player, .sv-featured').length;
        const было = window.__скольколо;
        window.__скольколо = n;
        return n > 0 && n === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

for (const Я of ЯЗЫКИ) {
test.describe('услуги · ' + Я.имя, () => {

    test('обложка стоит на общих крутилках раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const г = document.querySelector('.sv-hero');
            const h1 = г.querySelector('h1'), п = г.querySelector('p');
            const ч = e => Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10;
            return {
                высота: Math.round(г.getBoundingClientRect().height),
                пол: getComputedStyle(г).minHeight,
                кегльH1: ч(h1), кегльП: п ? ч(п) : null,
                строкП: п ? Math.round(п.getBoundingClientRect().height /
                    parseFloat(getComputedStyle(п).lineHeight)) : null,
            };
        });
        expect(з.высота, 'ПОРОГ: обложки нет').toBeGreaterThan(80);
        // ЧИСЛО ИЗ БРАУЗЕРА, А НЕ ИЗ ФАЙЛА: оба кегля обязаны стоять на шкале
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок обложки мимо шкалы: ' + з.кегльH1).toContain(з.кегльH1);
        if (з.кегльП !== null)
            expect(ШКАЛА_КЕГЛЕЙ, 'подзаголовок мимо шкалы: ' + з.кегльП).toContain(з.кегльП);
        // Пол приходит крутилкой, значит в браузере это конкретное число
        expect(з.пол, 'пол обложки не задан').not.toBe('0px');
        if (з.строкП !== null)
            expect(з.строкП, 'подзаголовок развалился больше чем на две строки')
                .toBeLessThanOrEqual(2);
    });

    test('ничего не наехало, ничего не обрезано, перелива нет', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const беды = [];
            let карточек = 0;
            document.querySelectorAll('.sv-player').forEach(c => {
                карточек++;
                const n = c.querySelector('.sv-player-ntrp'), k = c.querySelector('.sv-player-cat');
                if (n && k) {
                    const a = n.getBoundingClientRect(), b = k.getBoundingClientRect();
                    if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 1 &&
                        Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 1)
                        беды.push('NTRP наехал на разряд');
                }
            });
            document.querySelectorAll('.sv-player-name, .sv-compact h4').forEach(e => {
                if (e.scrollHeight > e.clientHeight + 1)
                    беды.push('обрезано: «' + e.textContent.trim().slice(0, 24) + '»');
            });
            return {
                карточек, беды: [...new Set(беды)],
                перелив: document.documentElement.scrollWidth - window.innerWidth,
                лентовых: document.querySelectorAll('.sv-compact').length,
            };
        });
        expect(з.карточек + з.лентовых, 'ПОРОГ: на странице нет ни одной карточки')
            .toBeGreaterThan(0);
        expect(з.беды, 'карточки «Услуг» поехали').toEqual([]);
        expect(з.перелив, 'страница переливается вбок').toBeLessThanOrEqual(0);
    });

    test('в каждую цель можно попасть, и она не меньше 44', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const цели = [...document.querySelectorAll(
                'main a[href], main button:not([disabled])')]
                .filter(e => !e.closest('[aria-hidden="true"]'))
                .filter(e => { const r = e.getBoundingClientRect();
                    return r.width > 0 && r.height > 0 && r.top >= 0 && r.bottom <= window.innerHeight; });
            const мелкие = [];
            цели.forEach(e => {
                const r = e.getBoundingClientRect();
                const x = Math.round(r.left + r.width / 2);
                const centerY = r.top + r.height / 2;
                const своя = y => { const э = document.elementFromPoint(x, Math.round(y));
                    return !!(э && (э === e || e.contains(э) || э.contains(e))); };
                let верх = centerY, низ = centerY;
                while (верх > 1 && своя(верх - 1)) верх--;
                while (низ < window.innerHeight - 1 && своя(низ + 1)) низ++;
                const коробка = Math.round(r.height);
                /* Шаг обхода — целый пиксель, и один он теряет: сравниваем
                   с САМОЙ коробкой, а не с числом */
                if (низ - верх < коробка - 1 || коробка < 44)
                    мелкие.push({ что: (e.textContent || '').trim().slice(0, 18) || e.className,
                                  коробка, попадание: Math.round(низ - верх) });
            });
            return { целей: цели.length, мелкие };
        });
        expect(з.целей, 'ПОРОГ: видимых целей на экране нет').toBeGreaterThan(0);
        expect(з.мелкие, 'цель нажатия меньше 44 или перекрыта').toEqual([]);
    });

    test('клон ленты виден глазу и не виден диктору', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const всего = document.querySelectorAll('main h1, main h2, main h3, main h4').length;
            const вДереве = [...document.querySelectorAll('main h1, main h2, main h3, main h4')]
                .filter(e => !e.closest('[aria-hidden="true"]')).length;
            const лент = document.querySelectorAll('.sv-carousel').length;
            const проходов = document.querySelectorAll('.sv-carousel-pass').length;
            const скрытых = document.querySelectorAll('.sv-carousel-pass[aria-hidden="true"]').length;
            return { всего, вДереве, лент, проходов, скрытых };
        });
        if (з.лент === 0) {
            // Витрина с одним элементом ленты не рисует — законное состояние
            expect(з.проходов, 'лент нет, а проходы остались').toBe(0);
            return;
        }
        expect(з.проходов, 'лента без проходов — клон не обёрнут').toBe(з.лент * 2);
        expect(з.скрытых, 'скрыт должен быть ровно один проход на ленту').toBe(з.лент);
        expect(з.вДереве, 'клон остался в оглавлении страницы').toBeLessThan(з.всего);
    });

    test('«Корты» и «Тренеры» дают ОДИНАКОВЫЕ карточки', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const р = e => e ? { ш: Math.round(e.getBoundingClientRect().width),
                                 в: Math.round(e.getBoundingClientRect().height) } : null;
            const сетки = [...document.querySelectorAll('.sv-card-grid')];
            const данные = сетки.map(g => ({
                главная: р(g.querySelector('.sv-featured')),
                лента: р(g.querySelector('.sv-compact')),
            }));

            /* РАВЕНСТВО ПРОВЕРЯЕТСЯ ПО КОМПОНЕНТУ, А НЕ ПО ЧИСЛУ ДАННЫХ.
               Первый прогон 07.10 упал тем, что в тестовой базе тренеров
               НЕТ ВОВСЕ: вторая колонка показывает пустое состояние, и
               сравнивать было нечего. Но вопрос Кости — про компонент:
               «Корты и Тренеры должны быть идентичны». Поэтому в живую
               ленту кладутся ТРИ пробные карточки — тренер с длинным
               именем, тренер с коротким и корт — и меряются ОНИ. Такая
               проверка не зависит от того, сколько тренеров завели. */
            const лента = document.querySelector('.sv-carousel');
            let пробы = null;
            if (лента) {
                const мк = (имя, портрет) => {
                    const a = document.createElement('a');
                    a.className = 'sv-compact';
                    a.dataset.proba = '1';
                    a.innerHTML = '<div class="sv-compact-img-wrap">' +
                        '<img class="' + (портрет ? 'sv-compact-avatar' : 'sv-compact-photo') +
                        '" src="../images/heroes/services.jpg" alt="">' +
                        '</div><h4>' + имя + '</h4>' +
                        '<div class="sv-compact-sub">подпись</div>' +
                        '<div class="sv-compact-price">1200</div>';
                    лента.appendChild(a);
                    return a;
                };
                const былТип = лента.dataset.type;
                лента.dataset.type = 'coaches';
                const д = мк('Лазаренко-Мифтахутдинов Константин', true);
                const к = мк('Ли О', true);
                const кт = мк('Ак-Кеме', false);
                void лента.offsetHeight;
                пробы = { длинный: р(д), короткий: р(к), корт: р(кт) };
                лента.dataset.type = былТип;
                [д, к, кт].forEach(e => e.remove());
            }
            return { данные, пробы, витрин: сетки.length };
        });

        expect(з.витрин, 'ПОРОГ: витрин на странице нет вовсе').toBeGreaterThan(0);

        // Если данных хватило на обе витрины — сравниваем их самих
        const главные = з.данные.map(x => x.главная).filter(Boolean);
        if (главные.length >= 2) {
            for (const г of главные) {
                expect(г.ш, 'главные карточки разной ширины').toBe(главные[0].ш);
                expect(г.в, 'главные карточки разной высоты').toBe(главные[0].в);
            }
        }
        const ленты = з.данные.map(x => x.лента).filter(Boolean);
        if (ленты.length >= 2) {
            for (const л of ленты) {
                expect(л.ш, 'карточки лент разной ширины').toBe(ленты[0].ш);
                expect(л.в, 'карточки лент разной высоты').toBe(ленты[0].в);
            }
        }

        // А компонент проверяется всегда, сколько бы ни было данных
        expect(з.пробы, 'ПОРОГ: ленты нет — компонент не проверен').not.toBeNull();
        const п = з.пробы;
        expect(п.длинный.ш, 'карточка тренера шире карточки корта').toBe(п.корт.ш);
        expect(п.короткий.ш, 'короткое имя сузило карточку').toBe(п.корт.ш);
        expect(п.длинный.в, 'длинное имя подняло карточку тренера над кортом').toBe(п.корт.в);
        expect(п.короткий.в, 'короткое имя опустило карточку ниже соседей').toBe(п.корт.в);
    });

    test('поиск игрока считает колонки шириной карточки, а не числом', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const б = document.querySelector('.sv-players-box');
            if (!б) return null;
            const s = getComputedStyle(б);
            const колонок = s.gridTemplateColumns.trim().split(/\s+/).filter(Boolean).length;
            const к = б.querySelector('.sv-player');
            const л = document.querySelector('.sv-compact');
            return {
                колонок, карточек: б.children.length,
                игрок: к ? Math.round(к.getBoundingClientRect().width) : null,
                лента: л ? Math.round(л.getBoundingClientRect().width) : null,
                ширина: Math.round(б.getBoundingClientRect().width),
            };
        });
        expect(з, 'ПОРОГ: блока поиска игрока нет').not.toBeNull();
        expect(з.карточек, 'ПОРОГ: в поиске игрока нет карточек').toBeGreaterThan(0);
        // Колонок не больше, чем влезает по ширине карточки ленты
        if (з.лента) {
            const влезает = Math.max(1, Math.floor(з.ширина / з.лента));
            expect(з.колонок, 'колонок больше, чем помещается карточек ленты')
                .toBeLessThanOrEqual(влезает);
        }
        expect(з.колонок, 'колонок не осталось вовсе').toBeGreaterThan(0);
    });
});
}
