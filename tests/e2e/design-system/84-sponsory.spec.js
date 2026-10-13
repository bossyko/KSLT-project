/**
 * СТРАНИЦА «СПОНСОРАМ» И ОБЗОРНАЯ «УСЛУГИ». 13.10, кусок 65-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ЛЕСТНИЦА СРАВНИВАЕТСЯ НА ЭКРАНЕ, А НЕ В ФАЙЛЕ. Заморозка видит
 *     `--fs-xl` в медиа; что заголовок раздела ВЫШЕЛ мельче заголовка
 *     обложки, отвечает только браузер — кегль мог прийти из другого
 *     правила, перебивающего это по весу;
 *   • КНОПКИ ОДНОГО РЯДА МЕРЯЮТСЯ ВМЕСТЕ. В файле у них одно правило, а на
 *     экране 13.10 выходило 50 и 56: разницу давало содержимое;
 *   • ОКНО ПРОВЕРЯЕТСЯ НАЖАТИЕМ И TAB, а не чтением атрибутов: ловушка
 *     живёт в обработчике, и работает она или нет — видно только в браузере;
 *   • КОНТРАСТ СЧИТАЕТСЯ ПО ФАКТИЧЕСКОЙ КРАСКЕ с учётом прозрачности и
 *     подложки, а не по имени токена.
 *
 * ПОРОГ: нет блока цифр — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const СПОНСОРЫ = '/pages/sponsors.html';
const УСЛУГИ = '/pages/services.html';

/* ПОДМЕНА ОТВЕТА — ТОЛЬКО ДЛЯ ОБЗОРНОЙ «УСЛУГИ». Первый прогон 13.10 уронил
   её щупы на всех пяти видах с «уровней 2»: колонки рисуются ИЗ БАЗЫ
   (`js/services.js` — courts, coaches, players_public, partner_services), а в
   тестовой базе их нет. Признак `.sv-columns` лежит в разметке и приходит
   всегда — ждать его было мало. Четвёртый случай за месяц, и лечится он
   одинаково: подменяем ОТВЕТ ЗАПРОСА, строки собирает боевой код.
   Страница спонсоров подмены НЕ требует: она статическая, из базы приходят
   только логотипы, и без них блок просто пуст. */
const КОРТЫ = [{
    id: 'proba-kort', name: 'Теннисный центр «Проба»', name_en: 'Proba tennis centre',
    city: 'Бишкек', city_en: 'Bishkek', photo: '', partner: true, published_at: '2026-01-01T00:00:00Z',
    created_at: '2026-01-01T00:00:00Z', description: 'Описание корта', description_en: 'Court description',
    address: 'ул. Пробная, 1', court_types: [{ type: 'indoor', surface: 'hard', count: 4, price: 1200 }],
    additional_services: []
}];
const ТРЕНЕРЫ = [{
    id: 'proba-trener', last_name: 'Петров', first_name: 'Пётр',
    last_name_en: 'Petrov', first_name_en: 'Petr',
    position: 'Тренер по теннису', position_en: 'Tennis coach',
    short_desc: 'Коротко о тренере', short_desc_en: 'About the coach',
    experience: 12, price: 1200, photo: '', partner: true, published_at: '2026-01-01T00:00:00Z'
}];
const ИГРОКИ = [{
    id: 'proba-igrok', first_name: 'Азамат', last_name: 'Пробный',
    ntrp_singles: 4.5, category: 'men-tour', city: 'Бишкек',
    photo: '', last_seen: '2026-10-13T10:00:00Z', is_guest: false
}];

async function подменить(page) {
    await page.route('**/rest/v1/courts*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(КОРТЫ) }));
    await page.route('**/rest/v1/coaches*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ТРЕНЕРЫ) }));
    await page.route('**/rest/v1/players_public*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ИГРОКИ) }));
    await page.route('**/rest/v1/partner_services*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify([]) }));
}

async function открыть(page, адрес, признак) {
    if (адрес === УСЛУГИ) await подменить(page);
    await page.goto(адрес);
    await page.waitForFunction(
        (с) => document.querySelector(с) !== null, признак, { timeout: 15000 }
    ).catch(() => {
        throw new Error('ПОРОГ: за 15 секунд не появился ' + признак + ' — мерить нечего');
    });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

/* ══ 1. ЛЕСТНИЦА СЖИМАЕТСЯ, А НЕ СТОИТ ══════════════════════════════════ */

test('лестница страницы спонсоров читается сверху вниз', async ({ page }) => {
    await открыть(page, СПОНСОРЫ, '.sn-nums');
    const л = await page.evaluate(() => {
        const к = с => {
            const э = document.querySelector(с);
            return э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;
        };
        return { обложка: к('.sn-hero h1'), раздел: к('.sn-h2'), цифра: к('.sn-num-val'),
                 ширина: window.innerWidth };
    });
    expect(л.обложка, 'ПОРОГ: заголовка обложки нет — мерить нечего').not.toBeNull();
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: заголовок раздела строго мельче заголовка
       обложки на любом виде. До 13.10 на 390 оба стояли 32. */
    expect(л.раздел, 'заголовок раздела не мельче заголовка обложки: ' + JSON.stringify(л))
        .toBeLessThan(л.обложка);
    /* Цифра аудитории не крупнее заголовка обложки: иначе самое крупное на
       экране — число, а не мысль. */
    expect(л.цифра, 'цифра аудитории крупнее заголовка обложки: ' + JSON.stringify(л))
        .toBeLessThanOrEqual(л.обложка);
});

/* ══ 2. КНОПКИ ОДНОГО РЯДА — ОДНОЙ ВЫСОТЫ И НА СТУПЕНИ ══════════════════ */

test('кнопки страницы спонсоров стоят на ступенях шкалы', async ({ page }) => {
    await открыть(page, СПОНСОРЫ, '.sn-btn');
    const з = await page.evaluate(() => {
        const СТУПЕНИ = [28, 36, 44, 52];
        const кн = [...document.querySelectorAll('.sn-btn')].filter(э => э.offsetParent !== null);
        const высоты = кн.map(э => Math.round(э.getBoundingClientRect().height));
        return { сколько: кн.length, высоты, мимо: высоты.filter(в => СТУПЕНИ.indexOf(в) === -1) };
    });
    expect(з.сколько, 'ПОРОГ: кнопок на странице нет — мерить нечего').toBeGreaterThan(0);
    expect(з.мимо, 'высота кнопки мимо шкалы 28 · 36 · 44 · 52').toEqual([]);
    expect([...new Set(з.высоты)], 'кнопки страницы разной высоты: ' + JSON.stringify(з.высоты))
        .toHaveLength(1);
});

/* ══ 3. ОКНО КОНТАКТОВ — НАЖАТИЕМ, А НЕ ЧТЕНИЕМ ════════════════════════ */

test('окно контактов держит фокус и возвращает его', async ({ page }) => {
    await открыть(page, СПОНСОРЫ, '[data-open-contacts]');
    const до = await page.evaluate(() => {
        const к = document.querySelector('[data-open-contacts]');
        к.id = 'shchup-otkryl';
        к.focus();
        к.click();
        return { окноСкрыто: document.getElementById('snModal').hidden };
    });
    expect(до.окноСкрыто, 'окно не открылось по нажатию').toBe(false);

    const внутри = await page.evaluate(() => {
        const м = document.getElementById('snModal');
        return { фокусВОкне: м.contains(document.activeElement),
                 role: м.getAttribute('role'), modal: м.getAttribute('aria-modal'),
                 имя: (document.getElementById(м.getAttribute('aria-labelledby') || '') || {}).tagName };
    });
    expect(внутри.role, 'окно не называет себя окном').toBe('dialog');
    expect(внутри.modal, 'окно не помечено модальным').toBe('true');
    expect(внутри.имя, 'имя окна не заголовок уровня').toBe('H2');
    expect(внутри.фокусВОкне, 'фокус не переведён в окно').toBe(true);

    /* ЛОВУШКА TAB: с последнего поля фокус идёт на первое, а не на страницу
       под окном. Жмём настоящим Tab, а не вызовом focus(). */
    const последнее = await page.evaluate(() => {
        const м = document.getElementById('snModal');
        const поля = [].slice.call(м.querySelectorAll('a[href], button:not([disabled])'))
            .filter(э => э.offsetParent !== null);
        поля[поля.length - 1].focus();
        return поля.length;
    });
    expect(последнее, 'ПОРОГ: в окне нет управлений — ловушку проверять не на чем')
        .toBeGreaterThan(1);
    await page.keyboard.press('Tab');
    const после = await page.evaluate(() =>
        document.getElementById('snModal').contains(document.activeElement));
    expect(после, 'Tab с последнего поля ушёл из окна на страницу под ним').toBe(true);

    await page.keyboard.press('Escape');
    const закрыто = await page.evaluate(() => ({
        скрыто: document.getElementById('snModal').hidden,
        вернулся: document.activeElement && document.activeElement.id === 'shchup-otkryl'
    }));
    expect(закрыто.скрыто, 'Esc не закрыл окно').toBe(true);
    expect(закрыто.вернулся, 'фокус не вернулся на кнопку, которая открыла окно').toBe(true);
});

/* ══ 4. КОНТРАСТ ПО ФАКТИЧЕСКОЙ КРАСКЕ ═════════════════════════════════ */

for (const [имя, адрес, признак] of [
    ['спонсоров', СПОНСОРЫ, '.sn-nums'],
    ['услуг', УСЛУГИ, '.sv-compact, .sv-featured']
]) {
    test('текст страницы ' + имя + ' читается', async ({ page }) => {
        await открыть(page, адрес, признак);
        const плохие = await page.evaluate(() => {
            const яр = c => { const ф = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                return 0.2126 * ф(c[0]) + 0.7152 * ф(c[1]) + 0.0722 * ф(c[2]); };
            const раз = s => { const m = (s.match(/[\d.]+/g) || [0, 0, 0]).map(Number);
                return { rgb: m.slice(0, 3), a: m.length > 3 ? m[3] : 1 }; };
            const беды = [], видел = {};
            document.querySelectorAll('main *').forEach(э => {
                const свой = [...э.childNodes].some(n => n.nodeType === 3 && n.textContent.trim());
                if (!свой || э.offsetParent === null) return;
                const cs = getComputedStyle(э);
                const ключ = (typeof э.className === 'string' ? э.className : э.tagName).split(' ')[0] || э.tagName;
                if (видел[ключ]) return; видел[ключ] = true;
                let p = э, фон = null;
                while (p && p !== document.documentElement) {
                    const b = раз(getComputedStyle(p).backgroundColor);
                    if (b.a > 0.95) { фон = b.rgb; break; }
                    p = p.parentElement;
                }
                if (!фон) фон = [10, 10, 10];
                const c = раз(cs.color);
                const l1 = яр(c.rgb.map((v, i) => v * c.a + фон[i] * (1 - c.a))), l2 = яр(фон);
                const k = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
                const кегль = parseFloat(cs.fontSize), вес = parseInt(cs.fontWeight);
                const крупный = кегль >= 24 || (кегль >= 18.66 && вес >= 700);
                if (k < (крупный ? 3 : 4.5)) беды.push(ключ + ' ' + k.toFixed(2));
            });
            return { беды, уровней: Object.keys(видел).length };
        });
        expect(плохие.уровней, 'ПОРОГ: текстовых уровней не нашлось — мерить нечего')
            .toBeGreaterThan(5);
        expect(плохие.беды, 'контраст ниже нормы WCAG AA').toEqual([]);
    });
}

/* ══ 5. СТРАНИЦЫ НЕ ШИРЕ ОКНА ══════════════════════════════════════════ */

for (const [имя, адрес, признак] of [
    ['спонсоров', СПОНСОРЫ, '.sn-nums'],
    ['услуг', УСЛУГИ, '.sv-compact, .sv-featured']
]) {
    test('страница ' + имя + ' не переливает за край экрана', async ({ page }) => {
        await открыть(page, адрес, признак);
        const перелив = await page.evaluate(
            () => document.documentElement.scrollWidth - window.innerWidth);
        expect(перелив, 'страница шире окна').toBeLessThanOrEqual(0);
    });
}
