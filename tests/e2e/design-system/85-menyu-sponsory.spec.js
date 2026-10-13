/**
 * ПУНКТ «СТАТЬ СПОНСОРОМ» В МЕНЮ «ИНФО». 13.10, кусок 66-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЖИВОЕ МЕНЮ ВЫБИРАЕТ БРАУЗЕР. Ниже 993 десктопной панели нет вовсе,
 *     выше — нет бургера. Заморозка видит в разметке оба меню сразу и не
 *     знает, какое из них человек на этом виде вообще увидит;
 *   • ПАНЕЛЬ ОТКРЫВАЕТСЯ НАЖАТИЕМ И НАВЕДЕНИЕМ. Пункт лежит в разметке
 *     всегда; доступен он или нет — отвечает только браузер. На 1024
 *     отдаётся десктопная шапка, а панели висят на :hover, и у пальца
 *     наведения не существует;
 *   • ОБРЕЗКА СПИСКА ВИДНА ТОЛЬКО НА ЭКРАНЕ. У мобильной панели
 *     max-height 500 и overflow-y:auto: лишний пункт не вылезает, а
 *     прячется за ВТОРУЮ полосу прокрутки внутри открытого меню. В файле
 *     этого не видно — там просто два числа;
 *   • ЛЕСТНИЦА СРАВНИВАЕТСЯ С СОСЕДЯМИ. Новый пункт не имеет права
 *     завести новый уровень текста: кегль, вес и межстрочный у него
 *     обязаны совпасть с соседними пунктами того же списка;
 *   • КУДА ВЕДЁТ — ПРОВЕРЯЕТСЯ НАЖАТИЕМ. Адрес в разметке может быть верен
 *     и вести на 404 или на чужой язык.
 *
 * Замеры 13.10 (iframe на точной ширине, переходы сняты):
 *   десктоп 1512 / 1024 — 9 пунктов, панель 314, пункт 14 / 400 / 21, ряд 33
 *   мобильное 390×844 и 768×1024 — список 410 при пределе 500, ряд 41
 *   мобильное 844×390 — список 450 при пределе 500, ряд 45
 *
 * ПОРОГ: нет меню «Инфо» — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { я: 'ru', страница: '/pages/about.html',    цель: 'sponsors.html',    слово: 'Стать спонсором' },
    { я: 'en', страница: '/pages/about-en.html', цель: 'sponsors-en.html', слово: 'Become a sponsor' },
    { я: 'kg', страница: '/pages/about-kg.html', цель: 'sponsors-kg.html', слово: 'Демөөрчү болуу' },
];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.nav-dropdown-menu, .mobile-dropdown-menu') !== null,
        null, { timeout: 15000 }
    ).catch(() => { throw new Error('ПОРОГ: за 15 секунд не появилось меню — мерить нечего'); });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(200);
}

/** Какое меню на этом виде живое: десктопная панель или мобильный лист. */
async function режим(page) {
    return await page.evaluate(() => {
        const б = document.getElementById('burgerMenu');
        return б && getComputedStyle(б).display !== 'none' ? 'мобильное' : 'десктопное';
    });
}

/** Раскрывает «Инфо» тем способом, который на этом виде работает. */
async function раскрытьИнфо(page, как) {
    if (как === 'мобильное') {
        await page.click('#burgerMenu');
        await page.waitForTimeout(250);
        const нашли = await page.evaluate(() => {
            const li = [...document.querySelectorAll('.mobile-nav-dropdown')]
                .filter(n => n.querySelector('.mobile-dropdown-menu a[href*="sponsors"]'))[0];
            if (!li) return false;
            li.querySelector('.mobile-dropdown-toggle').id = 'shchup-info-toggle';
            return true;
        });
        expect(нашли, 'ПОРОГ: в мобильном меню нет списка со спонсорами').toBe(true);
        await page.click('#shchup-info-toggle');
        await page.waitForTimeout(600);     // 0.4s у max-height плюс запас
        return;
    }
    const есть = await page.evaluate(() => {
        const d = [...document.querySelectorAll('.nav-dropdown')]
            .filter(n => n.querySelector('.nav-dropdown-menu a[href*="sponsors"]'))[0];
        if (!d) return false;
        d.id = 'shchup-info-drop';
        return true;
    });
    expect(есть, 'ПОРОГ: в десктопной шапке нет панели со спонсорами').toBe(true);
    await page.hover('#shchup-info-drop');
    await page.waitForTimeout(500);         // 0.18s задержка панели плюс запас
}

const сел = как => как === 'мобильное'
    ? '.mobile-dropdown-menu a[href*="sponsors"]'
    : '.nav-dropdown-menu a[href*="sponsors"]';

/* ══ 1. ПУНКТ ДОСТУПЕН В ЖИВОМ МЕНЮ И ВЕДЁТ НА СВОЙ ЯЗЫК ════════════════ */

for (const { я, страница, цель, слово } of ЯЗЫКИ) {
    test('пункт спонсоров доступен и ведёт на свой язык · ' + я, async ({ page }) => {
        await открыть(page, страница);
        const как = await режим(page);
        await раскрытьИнфо(page, как);

        const пункт = page.locator(сел(как)).first();
        await expect(пункт, 'пункт спонсоров не виден в раскрытом «Инфо» (' + как + ')')
            .toBeVisible({ timeout: 5000 });
        expect((await пункт.textContent()).trim(), 'подпись пункта не на своём языке').toBe(слово);

        await пункт.click();
        await page.waitForLoadState('domcontentloaded');
        await page.waitForFunction(() => document.querySelector('h1') !== null, null, { timeout: 15000 })
            .catch(() => { throw new Error('после нажатия не открылась страница с заголовком'); });
        expect(page.url(), 'пункт увёл не на страницу спонсоров своего языка').toContain('/pages/' + цель);
        const загол = (await page.locator('h1').first().textContent()).trim();
        expect(загол.length, 'страница спонсоров открылась без заголовка').toBeGreaterThan(0);
    });
}

/* ══ 2. НОВЫЙ ПУНКТ НЕ ЗАВЁЛ НОВОГО УРОВНЯ ТЕКСТА ═══════════════════════ */

test('пункт спонсоров стоит на той же ступени, что соседи', async ({ page }) => {
    await открыть(page, '/pages/about.html');
    const как = await режим(page);
    await раскрытьИнфо(page, как);

    /* ПЕРВЫЙ ПРОГОН 13.10 УРОНИЛ ЭТОТ ЩУП НА ВСЕХ ПЯТИ ВИДАХ, и прав был он,
       а не код: я передал сюда селектор САМОГО пункта спонсоров и собрал им
       «все пункты» — соседей в наборе не оказалось ни одного, и ПОРОГ сказал
       «сравнивать не с чем». Набор берётся из СВОЕГО списка: сначала находим
       панель, в которой лежит ссылка на спонсоров, потом её собственные
       пункты. Иначе в набор попадают пункты всех пяти панелей разом —
       замером это было 28 пунктов вместо девяти, и соседом оказывался
       «Pro-Masters» из «Турниров». */
    const л = await page.evaluate((с) => {
        const свой = [...document.querySelectorAll(с.панель)]
            .filter(у => у.querySelector('a[href*="sponsors"]'))[0];
        if (!свой) return { сколько: 0, спонсор: null, сосед: null };
        const пункты = [...свой.querySelectorAll('a')].filter(a => a.offsetParent !== null);
        const снять = a => { const s = getComputedStyle(a);
            return { к: s.fontSize, в: s.fontWeight, м: s.lineHeight,
                     h: Math.round(a.getBoundingClientRect().height),
                     перенос: a.scrollWidth > a.clientWidth + 1 }; };
        const сп = пункты.filter(a => /sponsors/.test(a.getAttribute('href') || ''))[0];
        /* Сосед — ОБЫЧНЫЙ пункт: «скачать» несёт значок, а первый пункт
           мобильного списка ведёт на сам раздел и красится отдельно. */
        const сосед = пункты.filter(a => {
            const h = a.getAttribute('href') || '';
            return !/sponsors|download/.test(h) && !a.classList.contains('mobile-dropdown-self')
                && !a.classList.contains('active');
        })[0];
        return { сколько: пункты.length, спонсор: сп ? снять(сп) : null, сосед: сосед ? снять(сосед) : null };
    }, { панель: как === 'мобильное' ? '.mobile-dropdown-menu' : '.nav-dropdown-menu' });

    expect(л.спонсор, 'ПОРОГ: пункта спонсоров на экране нет — мерить нечего').not.toBeNull();
    expect(л.сосед, 'ПОРОГ: обычного соседнего пункта нет — сравнивать не с чем').not.toBeNull();
    expect(л.спонсор.к, 'кегль пункта спонсоров разошёлся с соседями').toBe(л.сосед.к);
    expect(л.спонсор.в, 'вес пункта спонсоров разошёлся с соседями').toBe(л.сосед.в);
    expect(л.спонсор.м, 'межстрочный пункта спонсоров разошёлся с соседями').toBe(л.сосед.м);
    expect(л.спонсор.h, 'высота ряда пункта спонсоров разошлась с соседями').toBe(л.сосед.h);
    expect(л.спонсор.перенос, 'подпись пункта спонсоров переносится').toBe(false);
});

/* ══ 3. СПИСОК «ИНФО» НЕ ОБРЕЗАН ════════════════════════════════════════ */

test('раскрытое «Инфо» помещается целиком, без второй прокрутки', async ({ page }) => {
    await открыть(page, '/pages/about.html');
    const как = await режим(page);
    await раскрытьИнфо(page, как);

    const з = await page.evaluate((как) => {
        const э = как === 'мобильное'
            ? [...document.querySelectorAll('.mobile-dropdown-menu')]
                .filter(u => u.querySelector('a[href*="sponsors"]'))[0]
            : [...document.querySelectorAll('.nav-dropdown-menu')]
                .filter(u => u.querySelector('a[href*="sponsors"]'))[0];
        if (!э) return null;
        const s = getComputedStyle(э);
        const r = э.getBoundingClientRect();
        return { нужно: э.scrollHeight, влезло: э.clientHeight, предел: s.maxHeight,
                 низ: Math.round(r.bottom), окно: window.innerHeight,
                 пунктов: э.querySelectorAll('a').length };
    }, как);

    expect(з, 'ПОРОГ: раскрытого списка «Инфо» на экране нет').not.toBeNull();
    expect(з.пунктов, 'ПОРОГ: список «Инфо» пуст').toBeGreaterThan(1);
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: сколько нужно — не больше, чем влезло.
       13.10: на 844×390 список занял 450 при пределе 500 — запас в один ряд. */
    expect(з.нужно, 'список «Инфо» обрезан пределом: ' + JSON.stringify(з))
        .toBeLessThanOrEqual(з.влезло + 1);
});

/* ══ 4. ПОДВАЛ ВЕДЁТ НА СПОНСОРОВ НА СВОЁМ ЯЗЫКЕ ════════════════════════ */

for (const { я, страница, цель } of ЯЗЫКИ) {
    test('подвал ведёт на спонсоров своего языка · ' + я, async ({ page }) => {
        await открыть(page, страница);
        const п = await page.evaluate(() => {
            const f = document.querySelector('footer');
            if (!f) return null;
            return [...f.querySelectorAll('a[href*="sponsors"]')].map(a => a.getAttribute('href'));
        });
        /* СОСТАВ БЛОКА — ОДИН НА ТРИ ЯЗЫКА. До 13.10 en и kg несли в том же
           блоке аренду кортов и проведение турниров, а русский — нет. Сведено
           по слову Кости; на экране это видно так: в блоке, где лежат ссылки
           на спонсоров, других ссылок нет вовсе, и заголовок называет
           спонсоров. Проверяется на каждом языке — значит и равенство
           языков держится, без сравнения страниц между собой. */
        const блок = await page.evaluate(() => {
            const b = [...document.querySelectorAll('footer .footer-block')]
                .filter(x => x.querySelector('a[href*="sponsors"]'))[0];
            if (!b) return null;
            const h = b.querySelector('h4');
            return { заголовок: h ? h.textContent.trim() : null,
                     все: [...b.querySelectorAll('.footer-links a')].map(a => a.getAttribute('href')) };
        });
        expect(блок, 'ПОРОГ: блока со ссылками на спонсоров в подвале нет').not.toBeNull();
        expect(блок.все.filter(h => h.indexOf('sponsors') === -1),
            'в блоке спонсоров появились чужие ссылки: ' + JSON.stringify(блок.все)).toEqual([]);
        expect(блок.заголовок, 'заголовок блока не называет спонсоров')
            .toMatch(/Спонсор|sponsor|Демөөрч/i);
        expect(п, 'ПОРОГ: подвала на странице нет').not.toBeNull();
        expect(п.length, 'в подвале нет ни одной ссылки на спонсоров').toBeGreaterThan(0);
        /* До 13.10 на en и kg ссылки не было вовсе, и страница была
           недостижима из разметки ни одним путём. */
        expect(п.every(h => h.indexOf(цель) === 0 || h.indexOf('/' + цель) !== -1),
            'подвал ведёт на чужой язык: ' + JSON.stringify(п)).toBe(true);
    });
}

/* ══ 5. НА СТРАНИЦЕ СПОНСОРОВ ПОДСВЕЧЕН РАЗДЕЛ ══════════════════════════ */

test('страница спонсоров признаёт себя разделом «Инфо»', async ({ page }) => {
    await открыть(page, '/pages/sponsors.html');
    const з = await page.evaluate(() => {
        const шапка = document.querySelector('.nav-item-dropdown.active, .nav-item-dropdown.is-active');
        const пункт = document.querySelector('.nav-dropdown-item.active, .mobile-dropdown-menu a.active');
        return { раздел: шапка ? шапка.textContent.trim().split('\n')[0] : null,
                 пункт: пункт ? (пункт.getAttribute('href') || '') : null };
    });
    expect(з.раздел, 'на странице спонсоров ни один раздел шапки не подсвечен').not.toBeNull();
    expect(з.пункт, 'подсвечен не пункт спонсоров: ' + JSON.stringify(з)).toContain('sponsors');
});
