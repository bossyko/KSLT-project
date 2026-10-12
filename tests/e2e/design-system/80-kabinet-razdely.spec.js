/**
 * ШЕСТЬ РАЗДЕЛОВ КАБИНЕТА — статистика, скидки, уведомления, профиль,
 * настройки и списки «Игр». 12.10.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • КТО ПОБЕДИЛ ПО ВЕСУ. В файле написано min-height 44, а на экране
 *     было 40: кнопка кабинета стояла в ЧУЖОЙ шкале кнопок сайта, и
 *     удвоенный класс бил своё правило. Файл показывает объявление,
 *     живая страница — победителя;
 *   • СЛОЙ ЦЕЛИ МЕРЯЕТСЯ ПРЯМОУГОЛЬНИКОМ. Он бывает задан min-width, а
 *     бывает height плюс left/right — мой первый щуп видел только первое
 *     и соврал про общую полосу страниц;
 *   • ОДНА СТУПЕНЬ. Решение Кости 12.10: все крупные числа кабинета
 *     одного кегля. Мест пять, и сойтись они должны на живой странице;
 *   • ГРАФИК НАЗЫВАЕТ СЕБЯ. Холст рисуется только при данных, поэтому
 *     ответ запроса подменяется: у аккаунта проб истории рейтинга нет;
 *   • ОКНО QR ИЩЕТСЯ НАЖАТИЕМ — в списке элементов его нет.
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];
const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];
const РАЗДЕЛЫ = ['stats', 'vouchers', 'notifications', 'profile', 'settings', 'games'];

/** История рейтинга — без неё холсты не рисуются вовсе. */
const ИСТОРИЯ = [
    { id: 'h1', player_id: 'proba', category_id: 'masters', points_earned: 450,
      recorded_at: '2026-01-15T10:00:00Z', ntrp_after: 3.5, is_doubles: false },
    { id: 'h2', player_id: 'proba', category_id: 'masters', points_earned: 180,
      recorded_at: '2026-05-20T10:00:00Z', ntrp_after: 4.0, is_doubles: false },
    { id: 'h3', player_id: 'proba', category_id: 'masters', points_earned: 240,
      recorded_at: '2026-09-10T10:00:00Z', ntrp_after: 4.5, is_doubles: false }
];

async function погаситьНакладки(page) {
    const окно = page.locator('.ach-overlay.show');
    for (let и = 0; и < 20; и++) {
        if (!(await окно.count()) || !(await окно.first().isVisible())) break;
        const кнопка = page.locator('.ach-overlay .ach-btn');
        if (!(await кнопка.count())) break;
        await кнопка.first().click({ force: true });
        await page.waitForTimeout(250);
    }
}

async function открыть(page, хвост, раздел, сИсторией) {
    await page.addInitScript(() => {
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    });
    if (сИсторией) {
        await page.route('**/rest/v1/rating_history*', route => route.fulfill({
            status: 200, contentType: 'application/json', body: JSON.stringify(ИСТОРИЯ)
        }));
    }
    await page.goto('/pages/dashboard' + хвост + '.html#' + раздел);
    await page.waitForLoadState('networkidle');
    await погаситьНакладки(page);
    await page.locator('#db-' + раздел).waitFor({ state: 'visible', timeout: 10000 });
    await page.waitForTimeout(500);
}

/** Слой цели: он бывает задан по-разному, меряем обе записи. */
function слойЦели(sel) {
    const э = document.querySelector(sel);
    if (!э) return null;
    const к = э.getBoundingClientRect();
    const a = getComputedStyle(э, '::after');
    const ш = Math.max(parseFloat(a.minWidth) || 0, parseFloat(a.width) || 0,
        (a.left === '0px' && a.right === '0px') ? к.width : 0);
    const в = Math.max(parseFloat(a.minHeight) || 0, parseFloat(a.height) || 0);
    return { коробка: Math.round(к.width) + 'x' + Math.round(к.height), ш: Math.round(ш), в: Math.round(в) };
}

/* ══════════════════════════════════════════════════════════════════════
   1. ВЫСОТА ДЕРЖИТСЯ СТУПЕНЬЮ — И НА ЖИВОЙ СТРАНИЦЕ ТОЖЕ
   ══════════════════════════════════════════════════════════════════════ */
test('кнопки и поля кабинета стоят на ступенях шкалы', async ({ page }) => {
    await открыть(page, '', 'profile');
    const числа = await page.evaluate(() => {
        const взять = sel => {
            const э = document.querySelector(sel);
            if (!э) return null;
            const к = э.getBoundingClientRect();
            return { h: Math.round(к.height), минВысота: getComputedStyle(э).minHeight };
        };
        return { кнопка: взять('#db-profile .db-btn'), поле: взять('#db-profile .db-field-input') };
    });
    expect(числа.кнопка, 'ПОРОГ: кнопки в профиле нет').not.toBeNull();
    /* ЧУЖАЯ ШКАЛА БИЛА СВОЮ: в css/style.css жил блок со ступенями
       48/40/32 и удвоенным классом .db-btn.db-btn */
    expect([28, 36, 44, 52], 'высота кнопки ' + числа.кнопка.h + ' мимо шкалы — проверь,\n' +
        'не вернулся ли .db-btn.db-btn в общий блок кнопок сайта')
        .toContain(числа.кнопка.h);
    expect(числа.поле.h, 'поле ввода ' + числа.поле.h + ' — Input 25:5 велит 44 явно')
        .toBeGreaterThanOrEqual(44);
});

test('чипы фильтра и кнопка значков стоят на своих ступенях', async ({ page }) => {
    await открыть(page, '', 'notifications');
    const чип = await page.evaluate(() => {
        const э = document.querySelector('#db-notifications .db-chip');
        return э ? Math.round(э.getBoundingClientRect().height) : null;
    });
    expect(чип, 'ПОРОГ: чипа фильтра нет').not.toBeNull();
    expect([28, 36, 44, 52], 'чип ' + чип + ' мимо шкалы: Filter chip 49:77 велит 36').toContain(чип);

    await открыть(page, '', 'stats');
    const значки = await page.evaluate(() => {
        const э = document.querySelector('#db-stats .db-badges-expand-btn');
        return э ? Math.round(э.getBoundingClientRect().height) : 'нет';
    });
    if (значки !== 'нет') {
        expect([28, 36, 44, 52], 'кнопка значков ' + значки + ' мимо шкалы: Utility button 56:101\n' +
            'знает только xs 28 и sm 36').toContain(значки);
    }
});

/* ══════════════════════════════════════════════════════════════════════
   2. НИ ОДНОЙ ЦЕЛИ НИЖЕ 44 БЕЗ СЛОЯ — НА ВСЕХ ШЕСТИ РАЗДЕЛАХ
   ══════════════════════════════════════════════════════════════════════ */
test('у всего, что ниже 44, есть настоящий слой цели', async ({ page }) => {
    const беды = [];
    let проверено = 0;
    for (const р of РАЗДЕЛЫ) {
        await открыть(page, '', р);
        const найдено = await page.evaluate(раздел => {
            const плохо = [];
            let счёт = 0;
            document.querySelectorAll('#db-' + раздел + ' button, #db-' + раздел + ' a[href], ' +
                '#db-' + раздел + ' input, #db-' + раздел + ' select').forEach(э => {
                const к = э.getBoundingClientRect();
                if (!к.width || !к.height) return;
                счёт++;
                if (к.width >= 44 && к.height >= 44) return;
                const a = getComputedStyle(э, '::after');
                const ш = Math.max(parseFloat(a.minWidth) || 0, parseFloat(a.width) || 0,
                    (a.left === '0px' && a.right === '0px') ? к.width : 0);
                const в = Math.max(parseFloat(a.minHeight) || 0, parseFloat(a.height) || 0);
                if (ш < 44 || в < 44) {
                    плохо.push(раздел + '/' + (String(э.className || '').split(' ')[0] || э.tagName) +
                        ' ' + Math.round(к.width) + 'x' + Math.round(к.height) +
                        ' слой ' + Math.round(ш) + 'x' + Math.round(в));
                }
            });
            return { плохо, счёт };
        }, р);
        беды.push(...найдено.плохо);
        проверено += найдено.счёт;
    }
    expect(проверено, 'ПОРОГ: нажимаемых элементов не нашлось вовсе').toBeGreaterThan(10);
    expect(беды, 'целей ниже 44 без слоя: ' + беды.join(' · ')).toEqual([]);
});

/* ══════════════════════════════════════════════════════════════════════
   3. ОДНА СТУПЕНЬ НА ВСЕ КРУПНЫЕ ЧИСЛА — РЕШЕНИЕ КОСТИ
   ══════════════════════════════════════════════════════════════════════ */
test('крупные числа кабинета сошлись на одной ступени', async ({ page }) => {
    await открыть(page, '', 'stats');
    const статистика = await page.evaluate(() => {
        const э = document.querySelector('#db-stats .db-stat-value');
        return э ? parseFloat(getComputedStyle(э).fontSize) : null;
    });
    await открыть(page, '', 'loyalty');
    const баланс = await page.evaluate(() => {
        const э = document.querySelector('#db-loyalty .db-loy-balance-value');
        return э ? parseFloat(getComputedStyle(э).fontSize) : null;
    });
    expect(статистика, 'ПОРОГ: плитки статистики нет').not.toBeNull();
    expect(баланс, 'ПОРОГ: баланса баллов нет').not.toBeNull();
    expect(ШКАЛА_КЕГЛЕЙ, 'кегль ' + статистика + ' мимо шкалы').toContain(статистика);
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: оба крупных числа кабинета равны между собой */
    expect(статистика, 'статистика ' + статистика + ' разошлась с балансом ' + баланс).toBe(баланс);
});

/* ══════════════════════════════════════════════════════════════════════
   4. ГРАФИК НАЗЫВАЕТ СЕБЯ — С ПОДСТАВЛЕННОЙ ИСТОРИЕЙ
   ══════════════════════════════════════════════════════════════════════ */
test('графики статистики представляются диктору', async ({ page }) => {
    await открыть(page, '', 'stats', true);
    await page.waitForTimeout(1500);
    const холсты = await page.evaluate(() => [...document.querySelectorAll('#db-stats canvas')]
        .filter(c => c.getBoundingClientRect().height > 0)
        .map(c => ({ id: c.id, role: c.getAttribute('role'),
                     имя: c.getAttribute('aria-label') || '', запас: (c.textContent || '').trim() })));
    expect(холсты.length, 'ПОРОГ: ни один холст не нарисовался — подстановка истории не дошла')
        .toBeGreaterThan(0);
    холсты.forEach(х => {
        expect(х.role, х.id + ': холст не называет себя картинкой').toBe('img');
        expect(х.имя.length, х.id + ': у холста нет имени — диктор прочитает пустую картинку')
            .toBeGreaterThan(10);
        /* ИМЯ СОБИРАЕТСЯ ИЗ ДАННЫХ: в нём обязаны быть числа, которые видит глазами зрячий */
        expect(/\d/.test(х.имя), х.id + ': имя без чисел — общая фраза вместо того, что нарисовано')
            .toBe(true);
        expect(х.запас.length, х.id + ': нет запасного текста внутри холста').toBeGreaterThan(10);
    });
});

/* ══════════════════════════════════════════════════════════════════════
   5. ЧЕТВЁРТОЕ ОКНО КАБИНЕТА — ИЩЕТСЯ НАЖАТИЕМ
   ══════════════════════════════════════════════════════════════════════ */
test('окно QR называет себя, держит фокус и выходит по Escape', async ({ page }) => {
    await открыть(page, '', 'profile');
    /* КНОПКА ЖИВЁТ В БОКОВОМ МЕНЮ, А НЕ В РАЗДЕЛЕ. Первая редакция искала её
       внутри #db-profile и уходила в пропуск на всех пяти видах — проверка
       шла вхолостую, а окно оставалось непроверенным вовсе */
    const кнопка = page.locator('#dbQrBtn');
    const естьКнопка = await кнопка.count();
    expect(естьКнопка, 'ПОРОГ: кнопки QR нет в разметке — окно не проверить')
        .toBeGreaterThan(0);

    /* НАХОДКА 12.10, ЗАФИКСИРОВАНА КАК ЕСТЬ: кнопка живёт в боковом меню, а
       на узких видах меню нет — значит показать свой код с телефона нельзя
       вовсе, хотя именно телефон для этого и достают. Это вопрос СОСТАВА
       экрана, и решает его Костя, а не я. Пока состояние заморожено таким,
       какое оно есть: когда кнопку выведут на узкий вид, упадёт эта
       проверка и напомнит, что окно надо проверять и там. */
    if (!(await кнопка.isVisible())) {
        await expect(кнопка, 'кнопка QR стала видимой на узком виде — проверку ниже\n' +
            'надо включить для этого вида, а находку снять с доски').toBeHidden();
        return;
    }

    await кнопка.click();
    const окно = page.locator('.db-qr-modal');
    await окно.waitFor({ timeout: 5000 });

    await expect(окно, 'окно не называет себя диалогом').toHaveAttribute('role', 'dialog');
    await expect(окно, 'окно не объявлено модальным').toHaveAttribute('aria-modal', 'true');
    const имя = await окно.getAttribute('aria-labelledby');
    expect(имя, 'у окна нет имени').toBeTruthy();
    expect(await page.locator('#' + имя).count(), 'имя окна ссылается в пустоту').toBe(1);

    const крестик = await page.evaluate(() => {
        const э = document.querySelector('.db-qr-close');
        const к = э.getBoundingClientRect();
        return { w: Math.round(к.width), h: Math.round(к.height) };
    });
    expect(крестик.w, 'крестик уже 44').toBeGreaterThanOrEqual(44);
    expect(крестик.h, 'крестик ниже 44').toBeGreaterThanOrEqual(44);

    await page.keyboard.press('Escape');
    await expect(page.locator('.db-qr-modal'), 'окно не закрылось по Escape').toHaveCount(0);
});

/* ══════════════════════════════════════════════════════════════════════
   6. ЛЕСТНИЦА ШЕСТИ РАЗДЕЛОВ И ПЕРЕЛИВ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('лестница шести разделов стоит на ступенях · ' + я.имя, async ({ page }) => {
        const мимо = [];
        let снято = 0;
        for (const р of РАЗДЕЛЫ) {
            await открыть(page, я.хвост, р);
            const уровни = await page.evaluate(раздел => {
                const из = {};
                document.querySelectorAll('#db-' + раздел + ' [class*="db-"]').forEach(э => {
                    const свой = String(э.className).split(' ').find(c => c.indexOf('db-') === 0);
                    if (!свой || из[свой]) return;
                    const к = э.getBoundingClientRect();
                    if (!к.width || !к.height) return;
                    if (![...э.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
                    const с = getComputedStyle(э);
                    из[свой] = Math.round(parseFloat(с.fontSize) * 100) / 100 + '/' +
                        parseInt(с.fontWeight, 10) + '/' +
                        (с.lineHeight === 'normal' ? 'normal'
                            : Math.round(parseFloat(с.lineHeight) / parseFloat(с.fontSize) * 100) / 100);
                });
                return из;
            }, р);
            Object.keys(уровни).forEach(кл => {
                снято++;
                const [к, в, м] = уровни[кл].split('/');
                if (!ШКАЛА_КЕГЛЕЙ.includes(+к)) мимо.push(р + '/' + кл + ' кегль ' + к);
                if (![400, 500, 600, 700].includes(+в)) мимо.push(р + '/' + кл + ' вес ' + в);
                if (м === 'normal' || !ЛЕСТНИЦА_СТРОК.includes(+м)) мимо.push(р + '/' + кл + ' межстрочный ' + м);
            });
        }
        expect(снято, 'ПОРОГ: уровней снято слишком мало — ' + снято).toBeGreaterThan(20);
        expect(мимо, 'уровней снято ' + снято + ', мимо шкалы: ' + мимо.join(' · ')).toEqual([]);
    });
}

test('ни один раздел не вылезает за свою коробку', async ({ page }) => {
    const беды = [];
    for (const р of РАЗДЕЛЫ) {
        await открыть(page, '', р);
        const найдено = await page.evaluate(раздел => {
            const плохо = [];
            document.querySelectorAll('#db-' + раздел + ' table, #db-' + раздел + ' .db-card, ' +
                '#db-' + раздел + ' .db-table-wrap').forEach(э => {
                const к = э.getBoundingClientRect();
                if (к.width && э.scrollWidth > Math.round(к.width) + 1) {
                    плохо.push(раздел + '/' + String(э.className).split(' ')[0] +
                        ' просит ' + э.scrollWidth + ' при ' + Math.round(к.width));
                }
            });
            return плохо;
        }, р);
        беды.push(...найдено);
    }
    expect(беды, 'перелив: ' + беды.join(' · ')).toEqual([]);
});

/* ══════════════════════════════════════════════════════════════════════
   7. КОНТРАСТ ПОДПИСЕЙ, КОТОРЫЕ БЫЛИ НИЖЕ НОРМЫ
   ══════════════════════════════════════════════════════════════════════ */
test('подписи скидок и кнопка Телеграма читаются на своём фоне', async ({ page }) => {
    const щуп = sel => {
        const э = document.querySelector(sel);
        if (!э) return null;
        const ч = c => (c.match(/[\d.]+/g) || []).map(Number);
        const св = m => { const g = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            return 0.2126 * g(m[0]) + 0.7152 * g(m[1]) + 0.0722 * g(m[2]); };
        const фон = el => { const слои = []; let n = el;
            while (n && n.nodeType === 1) {
                const m = ч(getComputedStyle(n).backgroundColor);
                if (m.length >= 3 && (m[3] === undefined || m[3] > 0)) слои.push(m);
                if (m.length === 3 || m[3] === 1) break;
                n = n.parentElement;
            }
            let низ = слои.pop() || [10, 10, 10];
            for (let i = слои.length - 1; i >= 0; i--) { const s = слои[i], a = s[3] === undefined ? 1 : s[3];
                низ = [0, 1, 2].map(k => a * s[k] + (1 - a) * низ[k]); }
            return низ; };
        const ф = фон(э);
        const m = ч(getComputedStyle(э).color);
        const цв = m[3] !== undefined && m[3] < 1 ? [0, 1, 2].map(k => m[3] * m[k] + (1 - m[3]) * ф[k]) : m.slice(0, 3);
        const l1 = св(цв), l2 = св(ф);
        return Math.round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) * 100) / 100;
    };

    await открыть(page, '', 'vouchers');
    const даты = await page.evaluate(щуп, '#db-vouchers .db-voucher-dates');
    if (даты !== null) {
        expect(даты, 'контраст срока действия ' + даты + ' при норме AA 4.5').toBeGreaterThanOrEqual(4.5);
    }

    await открыть(page, '', 'profile');
    const тг = await page.evaluate(щуп, '#db-profile .db-tg-btn');
    if (тг !== null) {
        expect(тг, 'контраст кнопки Телеграма ' + тг + ' при норме AA 4.5').toBeGreaterThanOrEqual(4.5);
    }
    expect(даты !== null || тг !== null, 'ПОРОГ: ни одной из двух подписей не нашлось').toBe(true);
});
