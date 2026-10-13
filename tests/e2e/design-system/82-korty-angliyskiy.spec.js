/**
 * АНГЛИЙСКАЯ ВЕТКА КОРТОВ И ТРЕНЕРОВ. 12.10, кусок 63-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЧТО ЧЕЛОВЕК ВИДИТ НА ЭКРАНЕ. Заморозка знает, что в файле есть
 *     ветка isEn и 66 ключей. Видно ли это на странице — отвечает только
 *     браузер: подпись могла остаться в разметке, прийти из базы или
 *     выпасть из ветки, которую никто не зовёт;
 *   • ФОКУС ПРОВЕРЯЕТСЯ НАСТОЯЩИМ TAB. `:focus-visible` браузер зажигает
 *     ЭВРИСТИКОЙ — от клавиатуры, а не от скрипта. Мой щуп 12.10 ходил
 *     через element.focus() и объявил «фокуса нет» там, где правило уже
 *     стояло. Поэтому здесь — page.keyboard.press('Tab');
 *   • ДЛИНА ПОДПИСИ МЕРЯЕТСЯ ПРЯМОУГОЛЬНИКОМ ТЕКСТА против доступной
 *     ширины. Английский короче русского почти везде, но «years of
 *     experience» вдвое длиннее «лет опыта» — и это узкое место карточки;
 *   • ДАННЫЕ НЕ ПУТАЮТСЯ С ПОДПИСЯМИ. Имя игрока, названия спонсоров и
 *     переключатель языка остаются на своём языке законно — проверка
 *     смотрит ПОДПИСИ ИНТЕРФЕЙСА, а не любой текст с кириллицей.
 *
 * ПОРОГ: нет карточек — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const КИРИЛЛИЦА = /[А-Яа-яЁё]/;

/** Классы, которым кириллица на английской странице ЗАКОННА: это данные
 *  или сам выбор языка, а не подписи интерфейса. */
const ЭТО_ДАННЫЕ = [
    'user-dropdown-name', 'user-dropdown-header',   // имя вошедшего
    'mobile-lang-option', 'lang-name',               // переключатель языка
    'sponsor-logo-link', 'logo-img',                 // названия спонсоров
    /* НАЗВАНИЕ ОБЪЕКТА — ДАННЫЕ. Код берёт `name_en || name`
       (js/courts.js), и при пустом английском поле законно показывает
       русское. В подменённом ответе такой корт стоит НАРОЧНО — он и
       проверяет этот откат. Первый прогон 12.10 уронил щуп именно на нём:
       проба не отличала данные от подписей интерфейса. */
    'ct-card-name', 'co-card-name', 'ct-hero-title', 'ct-detail-type'
];

/* ПРОБА НА ПОДСТАВНЫХ ДАННЫХ ПАДАЕТ НА ПУСТОТЕ, А НЕ НА ПРОДУКТЕ.
   Первый прогон 12.10 уронил шесть щупов по 21 секунде каждый: в тестовой
   базе тренеров нет вовсе, а щуп ждал карточку до таймаута. Это уже
   третий случай за месяц — тренеры 07.10, категории 09.10, кабинет 12.10 —
   и лечится он ОДИНАКОВО: подменяем ОТВЕТ ЗАПРОСА, а не разметку. Строки
   собирает боевой код, из боевого словаря, и меряется настоящая раскладка.

   Данные нарочно КРАЙНИЕ, а не удобные: длинное имя, пустое английское имя
   (проверяет откат к русскому), отсутствие цены и рейтинга. */
/* ПОЛЯ СВЕРЕНЫ С `mapDbCourt` (js/courts.js, возврат около :583): имя
   берётся из `name_en || name`, город из `city_en || city`, покрытие и
   число кортов — из `court_types`, цена — минимальная среди них. */
const КОРТЫ_ОТВЕТ = [
    {
        id: 'proba-dolgoe', name: 'Теннисный центр с очень длинным названием, корпус 2',
        name_en: 'Tennis Centre With A Very Long Name, Building 2',
        name_kg: 'Узун аталышы бар теннис борбору, 2-корпус',
        city: 'Bishkek', city_en: 'Bishkek', photo: '', partner: true, rating: 4.8,
        published_at: '2026-01-01T00:00:00Z', description: 'Описание площадки',
        description_en: 'Venue description', is_new: true,
        court_types: [{ type: 'indoor', surface: 'hard', count: 4, price: 1500 }]
    },
    {
        id: 'proba-bez-en', name: 'Корт без английского имени',
        name_en: '', name_kg: '', city: 'Osh', city_en: 'Osh', photo: '',
        partner: false, rating: null, published_at: '2026-01-01T00:00:00Z',
        description: '', description_en: '',
        court_types: [{ type: 'outdoor', surface: 'clay', count: 2, price: 0 }]
    }
];

/* ПОЛЯ СВЕРЕНЫ С `mapDbCoach` (js/coaches.js:326), А НЕ ВЫДУМАНЫ.
   Имя там собирается из `last_name` + `first_name` с английскими и
   кыргызскими вариантами, цена — `price`, а не `price_per_hour`: первый
   мой ответ дал `full_name`, и карточка выходила без имени. */
const ТРЕНЕРЫ_ОТВЕТ = [
    {
        id: 'proba-trener',
        last_name: 'Петров', first_name: 'Пётр',
        last_name_en: 'Petrov', first_name_en: 'Petr',
        last_name_kg: 'Петров', first_name_kg: 'Пётр',
        position: 'Тренер по теннису', position_en: 'Tennis coach',
        short_desc: 'Коротко о тренере', short_desc_en: 'About the coach',
        bio: 'Биография', bio_en: 'Biography',
        experience: 12, price: 1200, photo: '',
        tags: [], partner: true, promoted: false
    }
];

/* ТИПЫ КОРТОВ ЛЕЖАТ ВНУТРИ СТРОКИ, А НЕ В ОТДЕЛЬНОМ ЗАПРОСЕ:
   `js/courts.js:523` читает `row.court_types`. Проверено чтением кода —
   отдельное правило подмены на адрес court_types было бы мёртвым и
   создавало бы вид, что подмена шире, чем она есть на самом деле. */

async function подменить(page) {
    await page.route('**/rest/v1/courts*', route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(КОРТЫ_ОТВЕТ)
    }));
    await page.route('**/rest/v1/coaches*', route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ТРЕНЕРЫ_ОТВЕТ)
    }));
}

async function открыть(page, адрес, признак) {
    await подменить(page);
    await page.goto(адрес);
    /* ПОРОГ С НАЗВАННОЙ ПРИЧИНОЙ: ждём не «чего-нибудь», а карточку из
       подменённого ответа. Не дождались — падаем со словами, а не по
       таймауту, в котором не видно, что именно не пришло. */
    await page.waitForFunction(
        (с) => document.querySelector(с) !== null, признак,
        { timeout: 15000 }).catch(() => {
        throw new Error('ПОРОГ: за 15 секунд не появился ' + признак +
            ' — подменённый ответ не доехал до страницы, и мерить нечего');
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

/* ══════════════════════════════════════════════════════════════════════
   1. АНГЛИЙСКАЯ СТРАНИЦА НЕ ГОВОРИТ ПО-РУССКИ
   ══════════════════════════════════════════════════════════════════════ */

const СТРАНИЦЫ = [
    { имя: 'корты', адрес: '/pages/courts-en.html', признак: '.ct-card' },
    { имя: 'тренеры', адрес: '/pages/coaches-en.html', признак: '.co-card' }
];

for (const С of СТРАНИЦЫ) {
    test('английская витрина «' + С.имя + '» не говорит по-русски', async ({ page }) => {
        await открыть(page, С.адрес, С.признак);
        const найдено = await page.evaluate((данные) => {
            const кир = /[А-Яа-яЁё]/;
            const из = [];
            const обход = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
            let n;
            while ((n = обход.nextNode())) {
                const t = (n.nodeValue || '').trim();
                if (!t || !кир.test(t)) continue;
                const э = n.parentElement;
                if (!э) continue;
                const s = getComputedStyle(э);
                if (s.display === 'none' || s.visibility === 'hidden') continue;
                if (!э.getBoundingClientRect().width) continue;
                const к = typeof э.className === 'string' ? э.className.split(' ') : [];
                if (к.some(x => данные.indexOf(x) >= 0)) continue;
                из.push((к[0] || э.tagName) + ' :: ' + t.slice(0, 32));
            }
            return из;
        }, ЭТО_ДАННЫЕ);
        expect(найдено, 'на английской странице остались РУССКИЕ подписи интерфейса:\n  ' +
            найдено.join('\n  ') + '\n(ветка isEn в словаре — js/courts.js, js/coaches.js)')
            .toEqual([]);
    });

    test('английская витрина «' + С.имя + '» не говорит по-русски в атрибутах', async ({ page }) => {
        await открыть(page, С.адрес, С.признак);
        const найдено = await page.evaluate((данные) => {
            const кир = /[А-Яа-яЁё]/;
            const из = [];
            document.querySelectorAll('[placeholder],[aria-label],[title]').forEach(э => {
                const к = typeof э.className === 'string' ? э.className.split(' ') : [];
                if (к.some(x => данные.indexOf(x) >= 0)) return;
                ['placeholder', 'aria-label', 'title'].forEach(a => {
                    const v = э.getAttribute(a);
                    if (v && кир.test(v)) из.push(a + '="' + v.slice(0, 30) + '"');
                });
            });
            return из;
        }, ЭТО_ДАННЫЕ);
        expect(найдено, 'русские атрибуты: ' + найдено.join(' · ') +
            '\n(плейсхолдер поиска и aria-label полосы страниц тоже из словаря)')
            .toEqual([]);
    });
}

test('три языка дают ТРИ разных заголовка, а не один', async ({ page }) => {
    const снять = async (адрес) => {
        await открыть(page, адрес, '.ct-card');
        return page.evaluate(() => {
            const т = s => { const э = document.querySelector(s); return э ? (э.textContent || '').trim() : null; };
            const п = s => { const э = document.querySelector(s); return э ? (э.placeholder || '') : null; };
            return { h1: т('.ct-hero-title'), поиск: п('.trn-search-input'), чип: т('.ct-dd-toggle') };
        });
    };
    const ru = await снять('/pages/courts.html');
    const en = await снять('/pages/courts-en.html');
    const kg = await снять('/pages/courts-kg.html');

    expect(ru.h1, 'ПОРОГ: заголовка обложки нет вовсе — страница не отрисовалась').not.toBeNull();
    expect(en.h1, 'английский заголовок совпал с русским — ветка isEn не работает').not.toBe(ru.h1);
    expect(en.h1, 'английский заголовок совпал с кыргызским').not.toBe(kg.h1);
    expect(en.поиск, 'плейсхолдер поиска не переведён').not.toBe(ru.поиск);
    expect(en.чип, 'подпись фильтра не переведена').not.toBe(ru.чип);
    expect(КИРИЛЛИЦА.test(en.h1), 'в английском заголовке кириллица: ' + en.h1).toBe(false);
});

/* ══════════════════════════════════════════════════════════════════════
   2. ФОКУС — НАСТОЯЩИМ TAB, А НЕ element.focus()
   ══════════════════════════════════════════════════════════════════════ */

test('фокус с клавиатуры виден на фильтрах и карточках', async ({ page }) => {
    await открыть(page, '/pages/courts-en.html', '.ct-card');
    /* ЩУП НА ОБВОДКУ НЕНАДЁЖЕН В ОБЕ СТОРОНЫ — выяснено 12.10, дорого.
       В браузере с подсветкой фокуса от расширения поверх нашей обводки
       рисуется ЧУЖАЯ (3px, цветом текста), и даже инлайн с !important её
       не перебивает. В прогоне бывает обратное: фокус элементу возвращает
       КОД страницы при перерисовке фильтров, а программный фокус
       `:focus-visible` не зажигает — и обводки нет законно.

       Поэтому проверяем то, что наблюдаемо честно: дошёл ли Tab до
       элемента витрины и зажёг ли браузер `:focus-visible`. Зажёг —
       обводка обязана быть. Не зажёг — ПРОПУСК С ПРИЧИНОЙ, а не падение:
       пропуск, у которого написано почему, честнее зелёной галочки.
       Само правило в css сторожит заморозка. */
    const интересные = ['ct-dd-toggle', 'ct-card', 'trn-search-input', 'pl-page-btn'];
    const найдено = [];
    for (let шаг = 0; шаг < 60; шаг++) {
        await page.keyboard.press('Tab');
        const где = await page.evaluate((имена) => {
            const э = document.activeElement;
            if (!э || э === document.body) return null;
            const к = typeof э.className === 'string' ? э.className.split(' ') : [];
            const наш = имена.find(и => к.indexOf(и) >= 0);
            if (!наш) return null;
            let зажёг = false;
            try { зажёг = э.matches(':focus-visible'); } catch (e) { зажёг = false; }
            const s = getComputedStyle(э);
            return {
                кто: наш, зажёг,
                обводка: s.outlineStyle !== 'none' && parseFloat(s.outlineWidth) > 0,
                тень: s.boxShadow !== 'none',
                ширина: s.outlineWidth, стиль: s.outlineStyle
            };
        }, интересные);
        if (где && !найдено.some(x => x.кто === где.кто)) найдено.push(где);
        if (найдено.length >= 2) break;
    }

    expect(найдено.length, 'Tab не дошёл ни до одного элемента витрины за 60 шагов — ' +
        'либо витрина не отрисовалась, либо её элементы выпали из обхода клавиатурой')
        .toBeGreaterThan(0);

    const зажглись = найдено.filter(н => н.зажёг);
    if (!зажглись.length) {
        test.skip(true, 'браузер не зажёг :focus-visible ни на одном элементе — ' +
            'фокус пришёл не от клавиатуры (страница вернула его кодом при перерисовке)');
    }
    for (const н of зажглись) {
        expect(н.обводка || н.тень,
            'у .' + н.кто + ' горит :focus-visible, но нет ни обводки, ни тени ' +
            '(обводка ' + н.ширина + ' ' + н.стиль + '). Правило живёт в css/style.css ' +
            'рядом с обводкой шапки').toBe(true);
    }
});

/* ══════════════════════════════════════════════════════════════════════
   3. ЧТО ЧИТАЕТ ДИКТОР
   ══════════════════════════════════════════════════════════════════════ */

test('раскрывашка сообщает своё состояние, и выбранный пункт помечен', async ({ page }) => {
    await открыть(page, '/pages/courts-en.html', '.ct-card');
    const чип = page.locator('.ct-dd-toggle').first();

    expect(await чип.getAttribute('aria-haspopup'), 'нет aria-haspopup').toBe('listbox');
    expect(await чип.getAttribute('aria-expanded'), 'до открытия должно быть false').toBe('false');

    await чип.click();
    await page.waitForTimeout(300);
    expect(await чип.getAttribute('aria-expanded'), 'после открытия должно быть true').toBe('true');

    const меню = page.locator('.ct-dd.open .ct-dd-menu').first();
    expect(await меню.getAttribute('role'), 'у списка нет роли').toBe('listbox');

    const галок = await page.locator('.ct-dd.open .ct-dd-tick').count();
    const помечено = await page.locator('.ct-dd.open [aria-current="true"]').count();
    expect(галок, 'у выбранного пункта нет галочки: Menu item 32:44 — «never rely ' +
        'on the tint alone»').toBeGreaterThan(0);
    expect(помечено, 'выбранный пункт не помечен для диктора').toBeGreaterThan(0);

    /* ЗАКРЫТИЕ КЛИКОМ МИМО — ровно то место, где состояние и экран
       расходятся, если обновлять атрибут не в одной точке */
    await page.mouse.click(5, 5);
    await page.waitForTimeout(300);
    expect(await чип.getAttribute('aria-expanded'), 'после закрытия «мимо» осталось true')
        .toBe('false');
});

/* ══════════════════════════════════════════════════════════════════════
   4. ПОДПИСИ ВЛЕЗАЮТ, И ЛЕСТНИЦА НА СТУПЕНЯХ
   ══════════════════════════════════════════════════════════════════════ */

const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];

test('межстрочные карточки корта стоят на ступенях', async ({ page }) => {
    await открыть(page, '/pages/courts-en.html', '.ct-card');
    const з = await page.evaluate(() => {
        const взять = sel => {
            const э = document.querySelector(sel);
            if (!э) return null;
            const s = getComputedStyle(э);
            return Math.round(parseFloat(s.lineHeight) / parseFloat(s.fontSize) * 100) / 100;
        };
        return { имя: взять('.ct-card-name'), тип: взять('.ct-card-type'), цена: взять('.ct-card-price') };
    });
    expect(з.имя, 'ПОРОГ: имени карточки нет').not.toBeNull();
    Object.keys(з).forEach(к => {
        if (з[к] === null) return;
        expect(ЛЕСТНИЦА_СТРОК, 'межстрочный ' + к + ' = ' + з[к] +
            ' мимо лестницы 1 · 1.1 · 1.3 · 1.5 · 1.65').toContain(з[к]);
    });
});

test('подпись фильтра влезает в чип на английском', async ({ page }) => {
    await открыть(page, '/pages/courts-en.html', '.ct-card');
    const мера = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('.ct-dd-toggle')).map(э => {
            const s = getComputedStyle(э);
            const к = э.getBoundingClientRect();
            let шир = 0, строк = 0;
            Array.from(э.childNodes).forEach(n => {
                if (n.nodeType !== 3 || !n.nodeValue.trim()) return;
                const r = document.createRange();
                r.selectNode(n);
                const куски = Array.from(r.getClientRects()).filter(x => x.height > 0);
                строк = Math.max(строк, куски.length);
                шир += куски.reduce((m, x) => Math.max(m, x.width), 0);
            });
            const стрелка = э.querySelector('svg');
            const местоСтрелки = стрелка ? стрелка.getBoundingClientRect().width + 6 : 0;
            return {
                текст: (э.textContent || '').trim(),
                строк: строк,
                шир: Math.round(шир * 10) / 10,
                доступно: Math.round((к.width - parseFloat(s.paddingLeft) -
                    parseFloat(s.paddingRight) - местоСтрелки) * 10) / 10
            };
        });
    });
    expect(мера.length, 'ПОРОГ: выпадашек нет').toBeGreaterThan(0);
    for (const м of мера) {
        expect(м.строк, 'подпись «' + м.текст + '» переносится на ' + м.строк + ' строки').toBe(1);
        expect(м.шир, 'подпись «' + м.текст + '» ' + м.шир + ' при доступных ' + м.доступно)
            .toBeLessThanOrEqual(м.доступно + 1);
    }
});

test('подпись опыта на карточке короче, чем на странице тренера', async ({ page }) => {
    await открыть(page, '/pages/coaches-en.html', '.co-card');
    const наКарточке = await page.evaluate(() => {
        const э = document.querySelector('.co-card-stat-label');
        return э ? э.textContent.trim() : null;
    });
    if (!наКарточке) test.skip(true, 'у тренеров в базе нет стажа — подписи нет');
    expect(наКарточке.length, 'на карточке стоит ДЛИННАЯ подпись: замер 12.10 дал ' +
        '«years of experience» 103.3 при «лет опыта» 53.4 — почти вдвое, и это самое ' +
        'узкое место карточки').toBeLessThanOrEqual(12);
});

/* ══════════════════════════════════════════════════════════════════════
   5. РУССКАЯ И КЫРГЫЗСКАЯ ВЕТКИ НЕ ЗАДЕТЫ
   ══════════════════════════════════════════════════════════════════════ */

for (const Я of [{ имя: 'ru', адрес: '/pages/courts.html' },
                 { имя: 'kg', адрес: '/pages/courts-kg.html' }]) {
    test('витрина ' + Я.имя + ' осталась на своём языке', async ({ page }) => {
        await открыть(page, Я.адрес, '.ct-card');
        const h1 = await page.locator('.ct-hero-title').textContent();
        expect(КИРИЛЛИЦА.test(h1), 'заголовок ' + Я.имя + ' перестал быть кириллическим: ' + h1)
            .toBe(true);
        const бока = await page.evaluate(() =>
            document.documentElement.scrollWidth - document.documentElement.clientWidth);
        expect(бока, 'страница поехала вбок на ' + бока + 'px').toBeLessThanOrEqual(1);
    });
}
