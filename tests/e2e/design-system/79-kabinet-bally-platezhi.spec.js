/**
 * БАЛЛЫ И ПЛАТЕЖИ КАБИНЕТА — 12.10.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ПЕРЕЛИВ. В файле написано «сумма 140, примечание остаток». Помещается
 *     ли оно, решает содержимое: до правки таблица платежей просила 619 при
 *     589 на 1024 — прокрутка вбок на десктопе была настоящая;
 *   • ОДНА СТУПЕНЬ. Решение Кости 12.10 по макету: все крупные числа куска
 *     одного кегля и крупнее подписей рядом. Файл показывает объявление,
 *     живая страница — кто победил по весу правил;
 *   • КОНТРАСТ. Подпись 3.82 и единица 3.21 считались на СМЕШАННОМ фоне:
 *     прозрачная краска складывается с подложкой, а не отбрасывается;
 *   • ЦЕЛИ НАЖАТИЯ. Крестик красится 44, кнопка награды 28 — слой меряется
 *     настоящим прямоугольником;
 *   • ОКНО. Его нет в списке элементов: оно ищется НАЖАТИЕМ, и каждое
 *     открывшееся окно разбирается как отдельный экран;
 *   • ПУСТОЕ СОСТОЯНИЕ. У аккаунта проб ни баллов, ни платежей нет — это
 *     не редкий случай, а основной, и он проверяется живьём.
 *
 * ОТКУДА СТРОКИ. Подменяется ОТВЕТ ЗАПРОСА, а не разметка: таблицы собирает
 * тот же боевой код, что в продукте. Правда, которую проверяет проба, —
 * геометрия и лестница; про содержимое базы она ничего не утверждает.
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];
const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];

const СЕГОДНЯ = '2026-10-08T10:00:00Z';
const ОПЕРАЦИИ = [
    { id: 'p1', type: 'earn',   action: 'tournament', points: 150, created_at: СЕГОДНЯ, expires_at: '2027-10-08T10:00:00Z' },
    { id: 'p2', type: 'redeem', action: 'voucher',    points: -500, created_at: '2026-10-01T10:00:00Z' },
    { id: 'p3', type: 'expire', action: 'expired',    points: -25,  created_at: '2026-09-20T10:00:00Z' }
];
const НАГРАДЫ = [
    { id: 'r1', code: 'COURT1', title: 'Ваучер на корт — 1 час', title_en: 'Court voucher — 1 hour', cost: 500, active: true },
    { id: 'r2', code: 'TRN',    title: 'Взнос за турнир категории «Мастерс»', title_en: 'Masters tournament fee', cost: 1200, active: true }
];
const ПЛАТЕЖИ = [
    { id: 'o1', amount: 1000000, currency: 'KGS', payment_method: 'transfer', status: 'completed',
      note: 'Взнос за турнир «Мастерс-этап», оплата на корте у администратора', created_at: СЕГОДНЯ },
    { id: 'o2', amount: 1000, currency: 'KGS', payment_method: 'cash', status: 'pending',
      note: 'Членство', created_at: '2026-09-01T10:00:00Z' }
];

/** Накладки кабинета — все три поимённо, см. пробу 77. */
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

/** Ответы запросов подменяются ДО загрузки: строки собирает боевой код. */
async function подставить(page, { баланс = 1240, операции = ОПЕРАЦИИ, награды = НАГРАДЫ, платежи = ПЛАТЕЖИ } = {}) {
    const отдать = тело => route => route.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(тело)
    });
    await page.route('**/rest/v1/rpc/get_loyalty_balance*', отдать(баланс));
    await page.route('**/rest/v1/loyalty_transactions*', отдать(операции));
    await page.route('**/rest/v1/loyalty_rewards*', отдать(награды));
    await page.route('**/rest/v1/payments*', отдать(платежи));
}

async function открыть(page, хвост, раздел, настройки) {
    await page.addInitScript(() => {
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    });
    await подставить(page, настройки);
    await page.goto('/pages/dashboard' + хвост + '.html#' + раздел);
    await page.waitForLoadState('networkidle');
    await погаситьНакладки(page);
    const признак = раздел === 'loyalty'
        ? '#db-loyalty .db-loy-balance-value'
        : '#db-payments .db-section-title';
    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: разделы рисует js после ответа */
    await page.locator(признак).first().waitFor({ timeout: 10000 });
    await page.waitForTimeout(400);
}

/* Контраст на СМЕШАННОМ фоне — прозрачная краска складывается с подложкой.
   ЩУП — ФУНКЦИЯ, А НЕ СТРОКА: строку Playwright считает выражением, и
   второй довод до неё не доходит вовсе. Прогон 12.10 уронил этим пять
   проверок подряд, и упал не продукт, а прибор. */
function ЩУП_КОНТРАСТА(sel) {
    const э = document.querySelector(sel);
    if (!э) return null;
    const ч = c => (c.match(/[\d.]+/g) || []).map(Number);
    const св = m => {
        const g = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
        return 0.2126 * g(m[0]) + 0.7152 * g(m[1]) + 0.0722 * g(m[2]);
    };
    const фон = el => {
        const слои = [];
        let n = el;
        while (n && n.nodeType === 1) {
            const m = ч(getComputedStyle(n).backgroundColor);
            if (m.length >= 3 && (m[3] === undefined || m[3] > 0)) слои.push(m);
            if (m.length === 3 || m[3] === 1) break;
            n = n.parentElement;
        }
        let низ = слои.pop() || [10, 10, 10];
        for (let i = слои.length - 1; i >= 0; i--) {
            const s = слои[i], a = s[3] === undefined ? 1 : s[3];
            низ = [0, 1, 2].map(k => a * s[k] + (1 - a) * низ[k]);
        }
        return низ;
    };
    const ф = фон(э);
    const m = ч(getComputedStyle(э).color);
    const цв = m[3] !== undefined && m[3] < 1
        ? [0, 1, 2].map(k => m[3] * m[k] + (1 - m[3]) * ф[k])
        : m.slice(0, 3);
    const l1 = св(цв), l2 = св(ф);
    return Math.round((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05) * 100) / 100;
}

/* ══════════════════════════════════════════════════════════════════════
   1. ПЕРЕЛИВА НЕТ НИ НА ОДНОМ ВИДЕ И НИ НА ОДНОМ ЯЗЫКЕ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('история баллов не вылезает за свою коробку · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост, 'loyalty');
        const строк = await page.locator('.db-loy-row').count();
        expect(строк, 'ПОРОГ: в истории баллов ни одной строки').toBeGreaterThan(0);
        const беды = await page.evaluate(() => {
            const плохо = [];
            document.querySelectorAll('#db-loyalty .db-loy-table, #db-loyalty .db-table-wrap').forEach(э => {
                const к = э.getBoundingClientRect();
                if (!к.width) return;
                if (э.scrollWidth > Math.round(к.width) + 1) {
                    плохо.push((э.className || '').split(' ')[0] + ': просит ' + э.scrollWidth + ' при ' + Math.round(к.width));
                }
            });
            return плохо;
        });
        expect(беды, 'перелив: ' + беды.join(' · ')).toEqual([]);
    });

    test('таблица платежей не вылезает за свою коробку · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост, 'payments');
        const строк = await page.locator('.db-pay-row').count();
        expect(строк, 'ПОРОГ: в таблице платежей ни одной строки').toBeGreaterThan(0);
        const беды = await page.evaluate(() => {
            const плохо = [];
            document.querySelectorAll('#db-payments .db-pay-table, #db-payments .db-pay-card').forEach(э => {
                const к = э.getBoundingClientRect();
                if (!к.width) return;
                if (э.scrollWidth > Math.round(к.width) + 1) {
                    плохо.push((э.className || '').split(' ')[0] + ': просит ' + э.scrollWidth + ' при ' + Math.round(к.width));
                }
            });
            return плохо;
        });
        expect(беды, 'перелив: ' + беды.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   2. ОДНА СТУПЕНЬ НА ВСЕ КРУПНЫЕ ЧИСЛА — РЕШЕНИЕ КОСТИ 12.10
   ══════════════════════════════════════════════════════════════════════ */
test('баланс и плитки платежей стоят на ОДНОЙ ступени', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    const баланс = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('#db-loyalty .db-loy-balance-value')).fontSize));
    const подпись = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('#db-loyalty .db-loy-balance-label')).fontSize));

    await открыть(page, '', 'payments');
    const плитка = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('#db-payments .db-stat-value')).fontSize));
    const заголовок = await page.evaluate(() =>
        parseFloat(getComputedStyle(document.querySelector('#db-payments .db-section-title')).fontSize));

    expect(ШКАЛА_КЕГЛЕЙ, 'кегль цифры ' + баланс + ' мимо шкалы').toContain(баланс);
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: оба крупных числа куска равны между собой */
    expect(плитка, 'плитка платежей ' + плитка + ' разошлась с балансом ' + баланс).toBe(баланс);
    /* и крупнее подписи рядом — это и есть «они больше чем другие» */
    expect(баланс, 'цифра ' + баланс + ' не крупнее подписи ' + подпись).toBeGreaterThan(подпись);
    expect(баланс, 'цифра мельче заголовка раздела ' + заголовок).toBeGreaterThanOrEqual(заголовок);
});

/* ══════════════════════════════════════════════════════════════════════
   3. КОНТРАСТ НА СМЕШАННОМ ФОНЕ
   ══════════════════════════════════════════════════════════════════════ */
test('подписи баланса читаются на своём фоне', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    const подпись = await page.evaluate(ЩУП_КОНТРАСТА, '#db-loyalty .db-loy-balance-label');
    const единица = await page.evaluate(ЩУП_КОНТРАСТА, '#db-loyalty .db-loy-balance-unit');
    expect(подпись, 'ПОРОГ: подписи баланса нет').not.toBeNull();
    expect(подпись, 'контраст подписи ' + подпись + ' при норме AA 4.5').toBeGreaterThanOrEqual(4.5);
    expect(единица, 'контраст единицы ' + единица + ' при норме AA 4.5').toBeGreaterThanOrEqual(4.5);
});

test('приход и расход красятся системой, а не Material', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    const цвета = await page.evaluate(() => {
        const взять = sel => { const э = document.querySelector(sel); return э ? getComputedStyle(э).color : null; };
        return { плюс: взять('#db-loyalty .db-loy-points.is-plus'), минус: взять('#db-loyalty .db-loy-points.is-minus') };
    });
    expect(цвета.плюс, 'ПОРОГ: строки прихода нет').not.toBeNull();
    /* --green-500 #2ED573 и --red-500 #FF4757; Material давал 76,175,80 и 244,67,54 */
    expect(цвета.плюс, 'приход красится не токеном: ' + цвета.плюс).toBe('rgb(46, 213, 115)');
    expect(цвета.минус, 'расход красится не токеном: ' + цвета.минус).toBe('rgb(255, 71, 87)');
});

/* ══════════════════════════════════════════════════════════════════════
   4. ОКНО ОБМЕНА — ИЩЕТСЯ НАЖАТИЕМ И РАЗБИРАЕТСЯ КАК ОТДЕЛЬНЫЙ ЭКРАН
   ══════════════════════════════════════════════════════════════════════ */
test('окно обмена называет себя окном и держит фокус', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    await page.locator('#dbLoyRedeemBtn').click();
    const окно = page.locator('.db-redeem-modal');
    await окно.waitFor({ timeout: 5000 });

    await expect(окно, 'окно не называет себя диалогом').toHaveAttribute('role', 'dialog');
    await expect(окно, 'окно не объявлено модальным').toHaveAttribute('aria-modal', 'true');
    const имя = await окно.getAttribute('aria-labelledby');
    expect(имя, 'у окна нет имени — диктор прочитает пустой диалог').toBeTruthy();
    const заголовок = page.locator('#' + имя);
    expect(await заголовок.count(), 'имя окна ссылается в пустоту').toBe(1);

    const ктоСверху = await page.evaluate(() => document.activeElement && document.activeElement.className);
    expect(String(ктоСверху), 'фокус остался на странице: ' + ктоСверху).toContain('db-loy-close');
});

test('окно обмена выходит по Escape и возвращает фокус', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    await page.locator('#dbLoyRedeemBtn').click();
    await page.locator('.db-redeem-modal').waitFor({ timeout: 5000 });
    await page.keyboard.press('Escape');
    await expect(page.locator('.db-redeem-modal'), 'окно не закрылось по Escape').toHaveCount(0);
    const вернулся = await page.evaluate(() => document.activeElement && document.activeElement.id);
    expect(вернулся, 'фокус не вернулся на кнопку, с которой окно позвали').toBe('dbLoyRedeemBtn');
});

test('у кнопок окна обмена есть настоящая цель 44', async ({ page }) => {
    await открыть(page, '', 'loyalty');
    await page.locator('#dbLoyRedeemBtn').click();
    await page.locator('.db-redeem-modal').waitFor({ timeout: 5000 });

    const числа = await page.evaluate(() => {
        const гео = sel => { const э = document.querySelector(sel); if (!э) return null;
            const r = э.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height) }; };
        const слой = sel => { const э = document.querySelector(sel); if (!э) return null;
            const a = getComputedStyle(э, '::after');
            return { w: parseFloat(a.minWidth) || 0, h: parseFloat(a.minHeight) || 0 }; };
        return { крестик: гео('.db-loy-close'), награда: гео('.db-loy-redeem-item'),
                 слойНаграды: слой('.db-loy-redeem-item'),
                 наград: document.querySelectorAll('.db-redeem-item').length };
    });

    expect(числа.наград, 'ПОРОГ: в окне ни одной награды').toBeGreaterThan(0);
    expect(числа.крестик.w, 'крестик уже 44: ' + числа.крестик.w).toBeGreaterThanOrEqual(44);
    expect(числа.крестик.h, 'крестик ниже 44: ' + числа.крестик.h).toBeGreaterThanOrEqual(44);
    expect([28, 36, 44, 52], 'высота кнопки награды ' + числа.награда.h + ' мимо шкалы').toContain(числа.награда.h);
    expect(числа.слойНаграды.w, 'у кнопки награды нет слоя 44').toBeGreaterThanOrEqual(44);
    expect(числа.слойНаграды.h, 'у кнопки награды нет слоя 44').toBeGreaterThanOrEqual(44);
});

/* ══════════════════════════════════════════════════════════════════════
   5. ЛЕСТНИЦА ОБОИХ РАЗДЕЛОВ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('лестница баллов и платежей стоит на ступенях · ' + я.имя, async ({ page }) => {
        const снять = () => page.evaluate(() => {
            const из = sel => { const э = document.querySelector(sel); if (!э) return null;
                const с = getComputedStyle(э);
                return { кегль: Math.round(parseFloat(с.fontSize) * 100) / 100,
                         вес: parseInt(с.fontWeight, 10),
                         мс: с.lineHeight === 'normal' ? 'normal'
                             : Math.round(parseFloat(с.lineHeight) / parseFloat(с.fontSize) * 100) / 100 }; };
            return {
                'заголовок': из('.db-section-title'),
                'цифра': из('.db-loy-balance-value') || из('.db-stat-value'),
                'подпись цифры': из('.db-loy-balance-label') || из('.db-stat-label'),
                'дата': из('.db-loy-date') || из('.db-pay-date'),
                'главное в строке': из('.db-loy-points') || из('.db-pay-amount'),
                'мета строки': из('.db-loy-type') || из('.db-pay-method')
            };
        });

        await открыть(page, я.хвост, 'loyalty');
        const баллы = await снять();
        await открыть(page, я.хвост, 'payments');
        const платежи = await снять();

        const мимо = [];
        [['баллы', баллы], ['платежи', платежи]].forEach(([раздел, уровни]) => {
            Object.keys(уровни).forEach(к => {
                const у = уровни[к];
                if (!у) return;
                if (!ШКАЛА_КЕГЛЕЙ.includes(у.кегль)) мимо.push(раздел + '/' + к + ': кегль ' + у.кегль);
                if (![400, 500, 600, 700].includes(у.вес)) мимо.push(раздел + '/' + к + ': вес ' + у.вес);
                if (у.мс === 'normal' || !ЛЕСТНИЦА_СТРОК.includes(у.мс)) мимо.push(раздел + '/' + к + ': межстрочный ' + у.мс);
            });
        });

        const снято = Object.keys(баллы).filter(к => баллы[к]).length +
                      Object.keys(платежи).filter(к => платежи[к]).length;
        expect(снято, 'ПОРОГ: уровней снято слишком мало — ' + снято).toBeGreaterThan(8);
        expect(мимо, 'уровней снято ' + снято + ', мимо шкалы: ' + мимо.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   6. АКЦЕНТ СТРОКИ — ВЕС НА ВСЕХ ВИДАХ, КЕГЛЬ ПО РЕЖИМУ
   ══════════════════════════════════════════════════════════════════════ */
test('сумма платежа выделена весом на любом виде', async ({ page }) => {
    await открыть(page, '', 'payments');
    const числа = await page.evaluate(() => {
        const с = э => getComputedStyle(document.querySelector(э));
        const сум = с('.db-pay-amount'), способ = с('.db-pay-method');
        return { весСуммы: parseInt(сум.fontWeight, 10), весСпособа: parseInt(способ.fontWeight, 10),
                 кегльСуммы: parseFloat(сум.fontSize), кегльСпособа: parseFloat(способ.fontSize),
                 режим: getComputedStyle(document.querySelector('.db-pay-row')).display };
    });
    expect(числа.весСуммы, 'сумма не выделена весом: ' + числа.весСуммы).toBeGreaterThan(числа.весСпособа);
    if (числа.режим === 'grid') {
        /* В СПИСКЕ СУММА — ТОВАР: ступень выше соседей. В таблице колонки равны */
        expect(числа.кегльСуммы, 'в списке сумма не крупнее соседа').toBeGreaterThan(числа.кегльСпособа);
    } else {
        expect(числа.кегльСуммы, 'в таблице сумма вышла из ряда колонок').toBe(числа.кегльСпособа);
    }
});

/* ══════════════════════════════════════════════════════════════════════
   7. ПУСТЫЕ СОСТОЯНИЯ — ОСНОВНОЙ СЛУЧАЙ, А НЕ РЕДКИЙ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('пустые платежи говорят, что здесь появится · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост, 'payments', { платежи: [] });
        const пусто = page.locator('#db-payments .db-empty');
        await expect(пусто, 'пустого состояния нет вовсе').toHaveCount(1);
        const текст = await page.locator('#db-payments .db-empty-text').textContent();
        expect((текст || '').trim().length,
            'Empty state 37:53: «always say what will appear here» — строки нет').toBeGreaterThan(10);
    });
}

test('пустая история баллов не ломает карточку баланса', async ({ page }) => {
    await открыть(page, '', 'loyalty', { баланс: 0, операции: [] });
    const числа = await page.evaluate(() => {
        const б = document.querySelector('#db-loyalty .db-loy-balance');
        const к = document.querySelector('#dbLoyCard');
        return { баланс: document.querySelector('.db-loy-balance-value').textContent.trim(),
                 переливКарточки: к.scrollWidth - к.clientWidth,
                 высотаБаланса: Math.round(б.getBoundingClientRect().height),
                 пусто: !!document.querySelector('#db-loyalty .db-empty') };
    });
    expect(числа.баланс, 'ноль баллов не нарисован').toBe('0');
    expect(числа.пусто, 'пустого состояния истории нет').toBe(true);
    expect(числа.переливКарточки, 'карточка баланса поехала вбок').toBeLessThanOrEqual(1);
});
