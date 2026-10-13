/**
 * ССЫЛКИ ВМЕСТО DIV. 13.10, кусок 69-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ДОСТИЖИМОСТЬ КЛАВИАТУРОЙ — только обходом Tab. `:focus-visible` не
 *     отвечает ни на программный `focus()`, ни на клик: правило куплено на
 *     странице игрока 09.10 и подтверждено здесь снимком 13.10;
 *   • КУДА ПОПАДАЕТ НАЖАТИЕ — `elementFromPoint`. Слой может быть объявлен
 *     верно и быть съеден содержимым: ровно это и показал замер «Услуг»,
 *     где слой стоял под содержимым и ссылка срабатывала только на пустых
 *     полях карточки;
 *   • ПЕРЕХОД РОВНО ОДИН — считается по живому документу: две ссылки на
 *     один адрес внутри карточки диктор читает дважды;
 *   • ИМЯ В `aria-label` НЕПУСТОЕ — в файле видно только вызов сборщика, а
 *     что туда пришло из базы, знает лишь страница.
 *
 * УРОВЕНЬ ДОСТУПА ПОДМЕНЯЕТСЯ НЕЗАПИСЫВАЕМЫМ `window.KSLT_INVITE` — тот же
 * приём, что у подставы рейтинга: присваивание из боевого модуля молча не
 * проходит, и страница читает подставу. Войти из прибора нельзя, а слой по
 * решению продукта даётся не гостю.
 *
 * ПОРОГ: нет карточек — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ПОИСК   = '/pages/partners.html';
const УСЛУГИ  = '/pages/services.html';
const ТУРНИРЫ = '/pages/tournaments-overview.html';

async function войти(page, уровень) {
    await page.addInitScript(у => {
        const подстава = {
            access: function () { return Promise.resolve(у); },
            myPlayerId: function () { return null; },
            окноРегистрации: function () {},
            click: function () {}
        };
        Object.defineProperty(window, 'KSLT_INVITE', {
            value: подстава, writable: false, configurable: false
        });
    }, уровень || 'member');
}

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForFunction(с => document.querySelectorAll(с).length > 0, признак, { timeout: 20000 })
        .catch(() => { throw new Error('ПОРОГ: за 20 секунд не появился ' + признак + ' — мерить нечего'); });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(400);
}

/**
 * УЗКИЙ ВИД У ПОЛОСЫ АРХИВА — НЕ ПРОПУСК, А ДРУГАЯ ПРОВЕРКА.
 *
 * Померено 13.10: на 375 и на 844 полосы `.to-compact` в документе НОЛЬ, а
 * страница рисует 23 карточки `.tc`. Если молча выйти, щуп станет зелёным
 * из ничего — правило, купленное 12.10 на чипах пола. Поэтому прежде чем
 * выйти, здесь проверяется ЗАМЕНА: карточки есть, и они настоящие ссылки.
 */
async function узкий(page, адрес) {
    await page.goto(адрес);
    await page.waitForTimeout(2500);
    const р = await page.evaluate(() => ({
        полос: document.querySelectorAll('.to-compact').length,
        карточек: document.querySelectorAll('.tc').length,
        теги: [...new Set([...document.querySelectorAll('.tc')].map(э => э.tagName))]
    }));
    if (р.полос > 0) return false;
    expect(р.карточек, 'ПОРОГ: полосы нет И карточек нет — страница пуста').toBeGreaterThan(0);
    expect(р.теги, 'замена полосы — не ссылка: ' + JSON.stringify(р)).toEqual(['A']);
    return true;
}

/** Куда попадает нажатие в середину элемента. */
const ПОПАДАНИЕ = `(function (карточка, внутри) {
    const к = document.querySelector(карточка);
    if (!к) return null;
    к.scrollIntoView({ block: 'center' });
    const э = внутри ? к.querySelector(внутри) : к;
    if (!э) return 'нет ' + внутри;
    const r = э.getBoundingClientRect();
    const t = document.elementFromPoint(Math.round(r.left + r.width / 2), Math.round(r.top + r.height / 2));
    return t ? t.tagName + '.' + String(t.className || '').split(' ')[0] : 'null';
})`;

/* ══ 1. КАРТОЧКА ЕСТЬ ССЫЛКА ═══════════════════════════════════════════ */

const СЕМЬИ = [
    { имя: 'поиск игрока',   адрес: ПОИСК,   карточка: '.pt-card',     слой: '.pt-card-cover',     вошедший: true,
      внутри: ['.pt-name', '.pt-avatar-wrap'], действие: '.pt-invite-btn' },
    { имя: 'игрок «Услуги»', адрес: УСЛУГИ,  карточка: '.sv-player',   слой: '.sv-player-cover',   вошедший: false,
      внутри: ['.sv-player-name', '.sv-player-ava-wrap'], действие: '.sv-player-btn' },
    /* ПОЛОСА АРХИВА ЖИВЁТ ТОЛЬКО НА ШИРОКИХ ВИДАХ. Померено 13.10: на 375 и
       на 844 её в документе НОЛЬ, а страница рисует 23 карточки `.tc` —
       настоящие <a>. Поэтому на узких видах у этой семьи своя проверка
       (ниже), а не пропуск: пропуск — это зелёное из ничего. */
    { имя: 'полоса турнира', адрес: ТУРНИРЫ, карточка: '.to-compact',  слой: '.to-compact-cover',  вошедший: false,
      внутри: ['h4'], действие: null, толькоШирокие: true }
];

for (const с of СЕМЬИ) {

test('карточка — ссылка, а не div: ' + с.имя, async ({ page }) => {
    if (с.вошедший) await войти(page);
    if (с.толькоШирокие && await узкий(page, с.адрес)) return;
    await открыть(page, с.адрес, с.карточка);
    const р = await page.evaluate(([карточка, слой]) => {
        const к = document.querySelector(карточка);
        const сл = к.querySelector(':scope > ' + слой);
        return {
            карточек: document.querySelectorAll(карточка).length,
            слойЕсть: !!сл,
            тег: сл ? сл.tagName : null,
            href: сл ? (сл.getAttribute('href') || '') : '',
            имя: сл ? (сл.getAttribute('aria-label') || '') : '',
            ссылокНаТотЖеАдрес: сл
                ? [...к.querySelectorAll('a[href]')].filter(a => a.getAttribute('href') === сл.getAttribute('href')).length
                : 0
        };
    }, [с.карточка, с.слой]);
    expect(р.карточек, 'ПОРОГ: карточек нет — мерить нечего').toBeGreaterThan(0);
    expect(р.слойЕсть, 'слоя-ссылки нет: ' + JSON.stringify(р)).toBe(true);
    expect(р.тег, 'слой не ссылка: ' + JSON.stringify(р)).toBe('A');
    expect(р.href.length, 'ссылка без адреса: ' + JSON.stringify(р)).toBeGreaterThan(0);
    /* В ФАЙЛЕ ВИДЕН ТОЛЬКО ВЫЗОВ СБОРЩИКА. Что имя пришло из базы и не
       пустое, знает лишь живая страница. */
    expect(р.имя.length, 'диктор прочитает пустую ссылку: ' + JSON.stringify(р)).toBeGreaterThan(0);
    /* ПЕРЕХОД РОВНО ОДИН. */
    expect(р.ссылокНаТотЖеАдрес, 'две ссылки на один адрес: ' + JSON.stringify(р)).toBe(1);
});

test('нажатие в любое место карточки попадает в ссылку: ' + с.имя, async ({ page }) => {
    if (с.вошедший) await войти(page);
    if (с.толькоШирокие && await узкий(page, с.адрес)) return;
    await открыть(page, с.адрес, с.карточка);
    const куда = {};
    for (const вн of ['', ...с.внутри]) {
        куда[вн || 'середина'] = await page.evaluate(
            `${ПОПАДАНИЕ}(${JSON.stringify(с.карточка)}, ${JSON.stringify(вн)})`);
    }
    for (const где of Object.keys(куда)) {
        if (String(куда[где]).startsWith('нет ')) continue;
        /* СОДЕРЖИМОЕ СЪЕДАЕТ СЛОЙ, ЕСЛИ СЛОЙ ПОД НИМ: на «Услугах» до 13.10
           нажатие на фотографию попадало в IMG, на имя — в DIV. */
        expect(куда[где], 'нажатие «' + где + '» мимо ссылки: ' + JSON.stringify(куда))
            .toContain('cover');
    }
});

if (с.действие) {
test('своё действие карточки остаётся нажимаемым: ' + с.имя, async ({ page }) => {
    if (с.вошедший) await войти(page);
    await открыть(page, с.адрес, с.карточка);
    const куда = await page.evaluate(
        `${ПОПАДАНИЕ}(${JSON.stringify(с.карточка)}, ${JSON.stringify(с.действие)})`);
    expect(String(куда).startsWith('нет '), 'ПОРОГ: действия в карточке нет').toBe(false);
    expect(куда, 'слой съел собственное действие карточки: ' + куда).not.toContain('cover');
});
}

test('до карточки доходит Tab, и фокус виден: ' + с.имя, async ({ page }) => {
    if (с.вошедший) await войти(page);
    if (с.толькоШирокие && await узкий(page, с.адрес)) return;
    await открыть(page, с.адрес, с.карточка);
    /* ТОЛЬКО НАСТОЯЩИЙ ОБХОД. Программный focus() кольца не даёт —
       правило куплено на странице игрока 09.10. */
    await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
    let дошли = false;
    for (let i = 0; i < 120 && !дошли; i++) {
        await page.keyboard.press('Tab');
        дошли = await page.evaluate(слой => {
            const a = document.activeElement;
            return !!(a && a.matches && a.matches(слой));
        }, с.слой);
    }
    expect(дошли, 'за 120 нажатий Tab до карточки не дошли').toBe(true);
    const кольцо = await page.evaluate(() => {
        const a = document.activeElement;
        const c = getComputedStyle(a);
        return { outline: c.outlineWidth + ' ' + c.outlineStyle,
                 ширина: parseFloat(c.outlineWidth) || 0,
                 тень: c.boxShadow };
    });
    expect(кольцо.ширина > 0 || кольцо.тень !== 'none',
        'фокус на карточке не виден: ' + JSON.stringify(кольцо)).toBe(true);
});

}

/* ══ 2. ОБЩИЙ СБОРЩИК ══════════════════════════════════════════════════ */

test('слой собирает один общий модуль, и он подключён', async ({ page }) => {
    await войти(page);
    await открыть(page, ПОИСК, '.pt-card');
    const есть = await page.evaluate(() =>
        !!(window.KSLT_SLOY && typeof window.KSLT_SLOY.слой === 'function'));
    expect(есть, 'общий сборщик слоя не подключён к странице').toBe(true);
});

test('гостю слой не дают, и карточка не ведёт в тупик', async ({ page }) => {
    await войти(page, 'guest');
    await открыть(page, ПОИСК, '.pt-card');
    const р = await page.evaluate(() => {
        const к = document.querySelector('.pt-card');
        return { слой: k(), класс: к.className.indexOf('pt-card-link') > -1,
                 курсор: getComputedStyle(к).cursor };
        function k() { return !!document.querySelector('.pt-card-cover'); }
    });
    expect(р.слой, 'гостю дали ссылку на страницу, где его ждёт замок').toBe(false);
    expect(р.класс, 'гостевой карточке повесили класс слоя').toBe(false);
    /* Карточка всё равно нажимаема: она открывает окно регистрации. */
    expect(р.курсор, 'гостевая карточка не выглядит нажимаемой').toBe('pointer');
});

/* ══ 3. АДРЕС ВЕДЁТ КУДА НАДО ══════════════════════════════════════════ */

test('адрес карточки игрока несёт номер игрока', async ({ page }) => {
    await войти(page);
    await открыть(page, ПОИСК, '.pt-card');
    const адреса = await page.evaluate(() =>
        [...document.querySelectorAll('.pt-card-cover')].map(a => a.getAttribute('href')));
    expect(адреса.length, 'ПОРОГ: слоёв нет').toBeGreaterThan(0);
    адреса.forEach(а => {
        expect(а, 'адрес без номера игрока: ' + а).toMatch(/player(-en|-kg)?\.html\?id=.+/);
    });
    expect(new Set(адреса).size, 'все карточки ведут на одного игрока').toBe(адреса.length);
});
