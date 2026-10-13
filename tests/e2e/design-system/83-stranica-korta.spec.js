/**
 * СТРАНИЦА КОРТА И СТРАНИЦА ТРЕНЕРА. 13.10, кусок 64-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЦЕЛЬ НАЖАТИЯ — ЭТО ПОПАДАНИЕ, А НЕ ВЫСОТА КОРОБКИ. Заморозка видит
 *     в файле `min-height: var(--btn-h-md)`; дошло ли нажатие до пальца,
 *     отвечает только браузер: слой мог быть срезан `overflow`, коробку
 *     мог накрыть сосед. Мерим `elementFromPoint`, как учит правило,
 *     купленное 12.10 на чипе пола;
 *   • МЕРА АБЗАЦА СЧИТАЕТСЯ ЗНАКАМИ, А НЕ ЕДИНИЦЕЙ `ch`. 13.10 я поставил
 *     72ch и получил 85 знаков в строке: `ch` — ширина знака «0», а
 *     кириллица у Inter уже него. Число в css ничего не доказывает —
 *     доказывает замер;
 *   • ОДИН `h1` НА СТРАНИЦУ. В файле это два разных места — обложка и
 *     карточка, — и сошлись они только на экране;
 *   • ФОКУС ПРОВЕРЯЕТСЯ НАСТОЯЩИМ TAB: `:focus-visible` браузер зажигает
 *     эвристикой, от клавиатуры, а не от `element.focus()` (урок 12.10);
 *   • ПЛАШКА «НОВЫЙ» — СВОЙСТВО ДАННЫХ. В подменённом ответе один корт
 *     заведён сегодня, второй — год назад: плашка обязана быть ровно одна.
 *
 * ПОРОГ: не дождались карточки — проверка ПАДАЕТ со словами, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');

const СТУПЕНИ_КЕГЛЯ = [11, 12, 14, 16, 18, 21, 26, 32, 40, 64];
const СТУПЕНИ_МС = ['1', '1.1', '1.3', '1.5', '1.65'];

const сегодня = new Date().toISOString();
const годНазад = new Date(Date.now() - 400 * 24 * 3600 * 1000).toISOString();

/* ПОЛЯ СВЕРЕНЫ С `mapDbCourt` (js/courts.js), а не выдуманы: типы кортов
   лежат ВНУТРИ строки в `court_types`, доп. услуги — в `additional_services`,
   «новый» считается от `created_at`. Данные крайние, а не удобные: самое
   длинное имя, самое длинное описание, корт без описания вовсе. */
const КОРТЫ_ОТВЕТ = [
    {
        id: 'proba-polnyy',
        name: 'Академия тенниса КР (Академия большого тенниса им. Ч. Айтматова)',
        name_en: 'Kyrgyz Republic Tennis Academy', name_kg: '',
        city: 'Бишкек', city_en: 'Bishkek',
        address: 'ул. Исакеева, 4а, Бишкек', phone: '+996 702 554 016',
        instagram: '@tennis_academy_kg', whatsapp: '',
        /* НЕ ПАРТНЁР — И ЭТО НАШЛА ПРОБА, А НЕ ЗАМЕР. Первый прогон 13.10
           уронил десять щупов: `js/courts.js` рисует призыв только
           `if (!(court._isDb && court.partner))` — партнёрскому корту вместо
           кнопки показывают секцию скидок. Крайний случай я взял правильно,
           а вот мерить цель нажатия кнопки на корте, где кнопки нет по
           замыслу, — ошибка прибора. Партнёрство проверяет третий корт ниже. */
        photo: '', partner: false, rating: null, promoted: false,
        published_at: '2026-01-01T00:00:00Z', created_at: сегодня,
        description: ('Крупнейшая теннисная база Бишкека, открыта в 2009 году. ').repeat(14),
        description_en: ('The largest tennis base in Bishkek, open since 2009. ').repeat(14),
        amenities: ['Раздевалки', 'Душевые', 'Кафе'],
        google_maps_url: 'https://maps.google.com/?q=42.8,74.6',
        twogis_url: 'https://2gis.kg/bishkek/firm/1',
        court_types: [
            { type: 'indoor', surface: 'hard', count: 5, price: 1500 },
            { type: 'outdoor', surface: 'clay', count: null, price: null }
        ],
        additional_services: [{ name: 'Прокат ракетки', name_en: 'Racket hire', price: 150 }]
    },
    {
        id: 'proba-pustoy',
        name: 'Корт без описания', name_en: 'Court with no description', name_kg: '',
        city: 'Ош', city_en: 'Osh', address: '', phone: '', instagram: '', whatsapp: '',
        photo: '', partner: false, rating: null, promoted: false,
        published_at: '2026-01-01T00:00:00Z', created_at: годНазад,
        description: '', description_en: '',
        amenities: [], court_types: [], additional_services: []
    },
    {
        id: 'proba-partner',
        name: 'Партнёрский корт', name_en: 'Partner court', name_kg: '',
        city: 'Бишкек', city_en: 'Bishkek', address: 'ул. Партнёрская, 1',
        phone: '', instagram: '', whatsapp: '',
        photo: '', partner: true, rating: null, promoted: false,
        published_at: '2026-01-01T00:00:00Z', created_at: годНазад,
        description: 'Короткое описание', description_en: 'Short description',
        amenities: [], court_types: [{ type: 'indoor', surface: 'hard', count: 1, price: 900 }],
        additional_services: []
    }
];

/* ПОЛЯ СВЕРЕНЫ С `mapDbCoach` (js/coaches.js:326). */
const ТРЕНЕРЫ_ОТВЕТ = [
    {
        id: 'proba-trener',
        last_name: 'Петров', first_name: 'Пётр',
        last_name_en: 'Petrov', first_name_en: 'Petr',
        last_name_kg: 'Петров', first_name_kg: 'Пётр',
        position: 'Тренер по теннису', position_en: 'Tennis coach',
        short_desc: 'Коротко о тренере', short_desc_en: 'About the coach',
        bio: ('Биография тренера, достаточно длинная, чтобы проверить меру абзаца. ').repeat(8),
        bio_en: ('Coach biography, long enough to measure the paragraph. ').repeat(8),
        experience: 12, price: 1200, photo: '', tags: [], partner: true, promoted: false,
        published_at: '2026-01-01T00:00:00Z', created_at: годНазад
    }
];

async function открыть(page, адрес, признак) {
    await page.route('**/rest/v1/courts*', route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(КОРТЫ_ОТВЕТ)
    }));
    await page.route('**/rest/v1/coaches*', route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ТРЕНЕРЫ_ОТВЕТ)
    }));
    await page.goto(адрес);
    await page.waitForFunction(
        (с) => document.querySelector(с) !== null, признак, { timeout: 15000 }
    ).catch(() => {
        throw new Error('ПОРОГ: за 15 секунд не появился ' + признак +
            ' — подменённый ответ не доехал до страницы, и мерить нечего');
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

const КОРТ = '/pages/court.html?id=proba-polnyy';
const ТРЕНЕР = '/pages/coach.html?id=proba-trener';

/* ══ 1. ОДИН ЗАГОЛОВОК ПЕРВОГО УРОВНЯ ═══════════════════════════════════ */

for (const [имя, адрес, признак] of [
    ['корта', КОРТ, '.ct-detail-header'],
    ['тренера', ТРЕНЕР, '.co-detail-header, .co-detail-info']
]) {
    test('на странице ' + имя + ' ровно один h1', async ({ page }) => {
        await открыть(page, адрес, признак);
        const з = await page.evaluate(() => ({
            h1: [...document.querySelectorAll('main h1')].map(h => h.textContent.trim().slice(0, 40)),
            имяКарточки: !!document.querySelector('.ct-detail-name, .co-detail-name')
        }));
        expect(з.имяКарточки, 'ПОРОГ: имени в карточке нет вовсе — мерить нечего').toBe(true);
        expect(з.h1, 'заголовков первого уровня должно быть ровно один').toHaveLength(1);
    });
}

/* ══ 2. ЦЕЛЬ НАЖАТИЯ — ПОПАДАНИЕМ ═══════════════════════════════════════ */

test('все управления страницы корта берутся пальцем', async ({ page }) => {
    await открыть(page, КОРТ, '.ct-detail-header');
    const мелкие = await page.evaluate(() => {
        const СЕЛЕКТОРЫ = [
            ['возврат', '.kslt-back'],
            ['контакт', '.ct-detail-phone a'],
            ['ссылка карты', '.ct-map-link'],
            ['кнопка призыва', '.ct-cta-btn']
        ];
        const беды = [];
        СЕЛЕКТОРЫ.forEach(([имя, сел]) => {
            const э = document.querySelector(сел);
            if (!э) { беды.push(имя + ': нет на странице'); return; }
            э.scrollIntoView({ block: 'center' });
            const r = э.getBoundingClientRect();
            const x = Math.round(r.left + r.width / 2);
            const цY = r.top + r.height / 2;
            const своя = y => {
                const т = document.elementFromPoint(x, Math.round(y));
                return !!(т && (т === э || э.contains(т)));
            };
            if (!своя(цY)) { беды.push(имя + ': центр отдаёт чужой элемент'); return; }
            let a = цY, b = цY;
            while (a > 1 && своя(a - 1)) a--;
            while (b < window.innerHeight - 1 && своя(b + 1)) b++;
            /* ШАГ ОБХОДА — ЦЕЛЫЙ ПИКСЕЛЬ, И ОДИН ОН ТЕРЯЕТ: порог 43, как
               в тестах 61 и 62 (правило записано 07.10, подтверждено 12.10). */
            const цель = Math.round(b - a);
            if (цель < 43) беды.push(имя + ': цель ' + цель + ' при коробке ' + Math.round(r.height));
        });
        return беды;
    });
    expect(мелкие, 'цель нажатия меньше 44 — мерено попаданием, а не коробкой').toEqual([]);
});

/* ══ 3. МЕРА АБЗАЦА И СТУПЕНЬ МЕЖСТРОЧНОГО ══════════════════════════════ */

for (const [имя, адрес, признак, сел] of [
    ['о площадке', КОРТ, '.ct-detail-header', '.ct-about-text'],
    ['био тренера', ТРЕНЕР, '.co-detail-info', '.co-bio-text']
]) {
    test('у абзаца «' + имя + '» есть мера и ступень', async ({ page }) => {
        await открыть(page, адрес, признак);
        const з = await page.evaluate((с) => {
            const э = document.querySelector(с);
            if (!э) return null;
            const cs = getComputedStyle(э);
            const текст = (э.textContent || '').replace(/\s+/g, ' ').trim();
            const s = document.createElement('span');
            s.style.cssText = 'position:absolute;visibility:hidden;white-space:pre;font:' + cs.font;
            s.textContent = текст.slice(0, 60);
            document.body.appendChild(s);
            const один = s.getBoundingClientRect().width / 60;
            s.remove();
            return {
                знаков: Math.round(э.getBoundingClientRect().width / один),
                межстрочный: (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2)
            };
        }, сел);
        expect(з, 'ПОРОГ: абзаца нет на странице — мерить нечего').not.toBeNull();
        /* Норма 45–75; верх с запасом на округление шрифта, низ — чтобы
           колонка не выродилась в столбик на узком виде. */
        expect(з.знаков, 'мера абзаца вышла за норму 45–75 знаков').toBeLessThanOrEqual(80);
        expect(з.знаков, 'абзац сжался в столбик').toBeGreaterThanOrEqual(35);
        expect(['1.65', '1.50'], 'межстрочный абзаца не со ступени лестницы')
            .toContain(з.межстрочный);
    });
}

/* ══ 4. ЛЕСТНИЦА: КЕГЛИ И МЕЖСТРОЧНЫЕ СО СТУПЕНЕЙ ═══════════════════════ */

test('вся видимая лестница страницы корта стоит на ступенях', async ({ page }) => {
    await открыть(page, КОРТ, '.ct-detail-header');
    const мимо = await page.evaluate(({ кегли, мс }) => {
        const беды = [];
        const узлы = document.querySelectorAll('main *');
        const видел = {};
        узлы.forEach(э => {
            if (!э.textContent || !э.textContent.trim()) return;
            const r = э.getBoundingClientRect();
            if (!r.width || !r.height) return;
            const cs = getComputedStyle(э);
            const к = Math.round(parseFloat(cs.fontSize));
            const м = cs.lineHeight === 'normal' ? '1.2'
                : (parseFloat(cs.lineHeight) / parseFloat(cs.fontSize)).toFixed(2);
            const ключ = э.className + '|' + к + '|' + м;
            if (видел[ключ]) return;
            видел[ключ] = true;
            if (кегли.indexOf(к) === -1) беды.push('кегль ' + к + ' у ' + (э.className || э.tagName));
            const нормМс = String(parseFloat(м));
            if (мс.indexOf(нормМс) === -1 && мс.indexOf(м) === -1)
                беды.push('межстрочный ' + м + ' у ' + (э.className || э.tagName));
        });
        return беды;
    }, { кегли: СТУПЕНИ_КЕГЛЯ, мс: СТУПЕНИ_МС });
    expect(мимо, 'кегли и межстрочные вне шкалы').toEqual([]);
});

/* ══ 5. КОНТРАСТ ШАПКИ ТАБЛИЦЫ ══════════════════════════════════════════ */

test('шапка таблицы типов кортов читается', async ({ page }) => {
    await открыть(page, КОРТ, '.ct-detail-header');
    const к = await page.evaluate(() => {
        const э = document.querySelector('.ct-types-header span');
        if (!э) return null;
        const яр = c => {
            const ф = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            return 0.2126 * ф(c[0]) + 0.7152 * ф(c[1]) + 0.0722 * ф(c[2]);
        };
        const раз = s => { const m = s.match(/[\d.]+/g).map(Number); return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
        let p = э, фон = [10, 10, 10];
        while (p && p !== document.documentElement) {
            const b = раз(getComputedStyle(p).backgroundColor);
            if (b.a > 0.95) { фон = b.rgb; break; }
            p = p.parentElement;
        }
        const c = раз(getComputedStyle(э).color);
        const l1 = яр(c.rgb.map((v, i) => v * c.a + фон[i] * (1 - c.a)));
        const l2 = яр(фон);
        return +(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)).toFixed(2));
    });
    expect(к, 'ПОРОГ: шапки таблицы нет — мерить нечего').not.toBeNull();
    expect(к, 'контраст шапки таблицы ниже нормы WCAG AA 4.5').toBeGreaterThanOrEqual(4.5);
});

/* ══ 6. «НОВЫЙ» — СВОЙСТВО ДАННЫХ ═══════════════════════════════════════ */

test('плашку «новый» носит только свежий корт', async ({ page }) => {
    await открыть(page, '/pages/courts.html', '.ct-card');
    const з = await page.evaluate(() => ({
        карточек: document.querySelectorAll('.ct-card').length,
        плашек: document.querySelectorAll('.ct-new-badge').length,
        высота: (() => {
            const б = document.querySelector('.ct-new-badge');
            return б ? Math.round(б.getBoundingClientRect().height) : null;
        })()
    }));
    expect(з.карточек, 'ПОРОГ: карточек нет — проверять нечего').toBe(3);
    expect(з.плашек, 'в ответе один свежий корт и два годовалых — плашка должна быть одна').toBe(1);
    expect(з.высота, 'плашка не держит высоту компонента Badge 27:53').toBe(24);
});

test('партнёрская плашка на странице корта несёт класс, а не инлайн-стиль', async ({ page }) => {
    await открыть(page, '/pages/court.html?id=proba-partner', '.ct-detail-header');
    const з = await page.evaluate(() => {
        const б = document.querySelector('.ct-partner-badge');
        if (!б) return null;
        const cs = getComputedStyle(б);
        return {
            инлайн: б.getAttribute('style') || '',
            высота: Math.round(б.getBoundingClientRect().height),
            кегль: Math.round(parseFloat(cs.fontSize)),
            вес: cs.fontWeight
        };
    });
    expect(з, 'ПОРОГ: партнёрской плашки нет — проверять нечего').not.toBeNull();
    expect(з.инлайн, 'плашка снова написана инлайн-стилем в js').toBe('');
    expect(з.высота, 'плашка не держит высоту компонента Badge 27:53').toBe(24);
    expect(з.кегль, 'кегль плашки не со шкалы').toBe(11);
    expect(з.вес, 'Badge 27:53 говорит Medium, а не 700/800').toBe('500');
});

/* ══ 7. ФОКУС ВИДЕН ОТ КЛАВИАТУРЫ ═══════════════════════════════════════ */

test('фокус на странице корта виден от настоящего Tab', async ({ page }) => {
    await открыть(page, КОРТ, '.ct-detail-header');
    await page.evaluate(() => {
        const э = document.querySelector('.ct-cta-btn');
        э.scrollIntoView({ block: 'center' });
        const пред = document.createElement('a');
        пред.href = '#';
        пред.textContent = 'щуп';
        пред.id = 'shchup-pered';
        э.parentNode.insertBefore(пред, э);
        пред.focus();
    });
    await page.keyboard.press('Tab');
    const о = await page.evaluate(() => {
        const э = document.querySelector('.ct-cta-btn');
        if (document.activeElement !== э) return { активен: false };
        const cs = getComputedStyle(э);
        return { активен: true, стиль: cs.outlineStyle, ширина: parseFloat(cs.outlineWidth) };
    });
    expect(о.активен, 'ПОРОГ: Tab не довёл фокус до кнопки — проверять нечего').toBe(true);
    expect(о.стиль, 'обводки фокуса нет').not.toBe('none');
    expect(о.ширина, 'обводка фокуса нулевой ширины — её анимирует transition').toBeGreaterThanOrEqual(2);
});

/* ══ 8. ВОЗВРАТ БЕЗ ПОДЛОЖКИ НА ШИРОКИХ ВИДАХ ══════════════════════════
   Колонка 840 отменена Костей 13.10 («верни как было»), и щупы на неё сняты.
   Осталось то, о чём он просил отдельно: подложек у возврата быть не должно.
   ══════════════════════════════════════════════════════════════════════ */

test('у возврата на широком виде нет подложки', async ({ page }) => {
    await открыть(page, КОРТ, '.ct-detail-header');
    const з = await page.evaluate(() => {
        if (window.innerWidth < 993) return { узкий: true };
        const к = document.querySelector('.kslt-back-wrap');
        if (!к) return { узкий: false, нет: true };
        const cs = getComputedStyle(к);
        const до = getComputedStyle(к, '::before');
        const ссылка = document.querySelector('.kslt-back');
        ссылка.scrollIntoView({ block: 'center' });
        const r = ссылка.getBoundingClientRect();
        const x = Math.round(r.left + r.width / 2), цY = r.top + r.height / 2;
        const своя = y => {
            const т = document.elementFromPoint(x, Math.round(y));
            return !!(т && (т === ссылка || ссылка.contains(т)));
        };
        let a = цY, b = цY;
        while (a > 1 && своя(a - 1)) a--;
        while (b < window.innerHeight - 1 && своя(b + 1)) b++;
        return { узкий: false, фон: cs.backgroundColor, размытие: cs.backdropFilter,
                 до: до.display, цель: Math.round(b - a) };
    });
    test.skip(з.узкий === true, 'вид уже 993 — там возврат в потоке по прежнему правилу');
    expect(з.нет, 'ПОРОГ: возврата нет на странице — проверять нечего').toBeUndefined();
    expect(з.размытие, 'у возврата осталось размытие — это та самая подложка').toBe('none');
    expect(['rgba(0, 0, 0, 0)', 'transparent'], 'у возврата осталась заливка').toContain(з.фон);
    expect(з.до, 'у возврата осталась полоса во всю ширину окна').toBe('none');
    expect(з.цель, 'поле под выступ слоя цели снято — нажатие перехватывают соседи')
        .toBeGreaterThanOrEqual(43);
});

/* ══ 9. СТРАНИЦА НЕ ШИРЕ ОКНА ══════════════════════════════════════════ */

for (const [имя, адрес, признак] of [
    ['корта', КОРТ, '.ct-detail-header'],
    ['тренера', ТРЕНЕР, '.co-detail-info']
]) {
    test('страница ' + имя + ' не переливает за край экрана', async ({ page }) => {
        await открыть(page, адрес, признак);
        const перелив = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth);
        expect(перелив, 'страница шире окна').toBeLessThanOrEqual(0);
    });
}
