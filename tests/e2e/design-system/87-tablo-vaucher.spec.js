/**
 * ТАБЛО И ПОДТВЕРЖДЕНИЕ ВАУЧЕРА. 13.10, кусок 68-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ПОЛОЖЕНИЕ ЭКРАНА ПОСЛЕ ЗАГРУЗКИ. Главную беду ваучера дала не
 *     вёрстка, а автофокус: focus() прокручивал страницу на 259, и
 *     администратор не видел ни плашки «действительная», ни имени
 *     владельца. В файле этого не прочитать — нужен `window.scrollY`.
 *     Здесь же мой собственный урок: 13.10 я прочитал
 *     getBoundingClientRect, не посмотрев на scrollY, и назвал бедой
 *     показание прибора. Щуп меряет ОБА числа разом;
 *   • ОБРЕЗКА ИМЕНИ НА ТАБЛО — это scrollWidth против clientWidth, и
 *     только браузер знает, где встало многоточие;
 *   • ПОДПИСЕЙ КОЛОНОК НЕТ В DOM — файл говорит, что строка собиралась;
 *     что она никуда не попадала, доказывает только живой документ;
 *   • ЦЕЛЬ НАЖАТИЯ — ЭТО ПОПАДАНИЕ, а не высота коробки;
 *   • КОНТРАСТ СЧИТАЕТСЯ ПО ФАКТИЧЕСКОЙ КРАСКЕ с учётом прозрачности.
 *
 * ДАННЫХ В БАЗЕ НЕТ: живого матча и действующего ваучера на прогоне не
 * бывает. Подменяем ОТВЕТ ЗАПРОСА, разметку собирает боевой код.
 * Форма снята с sql/схема/live-match-migration.sql:7-34 и с объявления
 * verify_voucher в снимке базы (строки 5656-5665).
 *
 * КНОПКА ПОДТВЕРЖДЕНИЯ ПИШЕТ В БАЗУ. Жать её можно только потому, что
 * `confirm_voucher` подменён здесь же и до сети не доходит.
 *
 * ПОРОГ: нет доски или нет карточки — проверка ПАДАЕТ, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ТАБЛО = '/pages/scoreboard.html?id=m-stend';
/* ТОКЕН В АДРЕСЕ ОБЯЗАТЕЛЕН: без него страница честно показывает отказ
   «некорректная ссылка», и мерить действительный ваучер будет не на чем. */
const ВАУЧЕР = {
    ru: '/pages/verify.html?token=t-stend',
    en: '/pages/verify-en.html?token=t-stend',
    kg: '/pages/verify-kg.html?token=t-stend'
};

/* ── Данные ──────────────────────────────────────────────────────────── */

function матч(п) {
    return Object.assign({
        id: 'm-stend', status: 'live', best_of: 5,
        player1_name: 'Жусупбекова / Абдыкадырова',
        player2_name: 'Боруев / Сулейманов-Ким',
        player1_id: 'p1', player2_id: 'p2',
        player1: { name: 'Жусупбекова / Абдыкадырова', name_en: '', photo: '' },
        player2: { name: 'Боруев / Сулейманов-Ким', name_en: '', photo: '' },
        serving_player: 1,
        sets_data: [{ g1: 6, g2: 4 }, { g1: 4, g2: 6 }, { g1: 7, g2: 6 }, { g1: 3, g2: 6 }],
        current_game_p1: 6, current_game_p2: 6,
        is_tiebreak: true, tiebreak_p1: 10, tiebreak_p2: 9,
        points_p1: '40', points_p2: 'AD',
        pause_reason: null, break_kind: null, break_until: null,
        sponsor_logo: '', tournament_label: 'ТЕСТ', created_at: new Date().toISOString()
    }, п);
}

function ваучер(п) {
    return Object.assign({
        status: 'valid',
        player_name: 'Абдыкадырова Айсулуу Жусупбековна',
        entity_type: 'court',
        entity_name: 'Теннисный центр «Ала-Тоо», Бишкек',
        service_name: 'Аренда корта с покрытием hard, вечернее время',
        discount_percent: 15,
        expires_at: new Date(Date.now() + 30 * 36e5).toISOString(),
        created_at: new Date().toISOString()
    }, п);
}

async function подменитьТабло(page, данные) {
    await page.route('**/rest/v1/live_matches*', r => r.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(данные || матч({})) }));
}

async function подменитьВаучер(page, ответ, подтверждение) {
    await page.route('**/rest/v1/rpc/verify_voucher*', r => r.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(ответ || ваучер({})) }));
    await page.route('**/rest/v1/rpc/confirm_voucher*', r => r.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify(подтверждение || { status: 'confirmed' }) }));
}

async function открыть(page, адрес, признак) {
    await page.goto(адрес);
    await page.waitForFunction(с => document.querySelector(с) !== null, признак, { timeout: 15000 })
        .catch(() => { throw new Error('ПОРОГ: за 15 секунд не появился ' + признак + ' — мерить нечего'); });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

/** Контраст по ФАКТИЧЕСКОЙ краске: цвет текста с его альфой поверх
    непрозрачного фона ближайшего предка, у которого фон задан. */
const КОНТРАСТ = `(function (сел) {
    const э = document.querySelector(сел);
    if (!э) return null;
    const разбор = s => (s.match(/[\\d.]+/g) || []).map(Number);
    const фонПредка = у => {
        let п = у;
        while (п) {
            const ф = разбор(getComputedStyle(п).backgroundColor);
            if (ф.length >= 3 && (ф[3] === undefined || ф[3] > 0.5)) return [ф[0], ф[1], ф[2]];
            п = п.parentElement;
        }
        return [0, 0, 0];
    };
    const фон = фонПредка(э);
    const ц = разбор(getComputedStyle(э).color);
    const а = ц[3] === undefined ? 1 : ц[3];
    const см = ц.slice(0, 3).map((v, i) => v * а + фон[i] * (1 - а));
    const лин = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
    const Я = r => 0.2126 * лин(r[0]) + 0.7152 * лин(r[1]) + 0.0722 * лин(r[2]);
    const a = Math.max(Я(см), Я(фон)), b = Math.min(Я(см), Я(фон));
    return Math.round(((a + 0.05) / (b + 0.05)) * 100) / 100;
})`;

/* ══ 1. ТАБЛО: ЛЕСТНИЦА И ИМЯ ═══════════════════════════════════════════ */

test('табло: счёт крупнее имени, имя на ступени, межстрочный с лестницы', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const л = await page.evaluate(() => {
        const к = с => { const э = document.querySelector(с);
            return э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null; };
        const мж = с => { const э = document.querySelector(с);
            return э ? getComputedStyle(э).lineHeight : null; };
        return { имя: к('.sb-name'), сет: к('.sb-set-val'), очко: к('.sb-pts-val'),
                 межстрочныйИмени: мж('.sb-name'), ширина: window.innerWidth };
    });
    expect(л.имя, 'ПОРОГ: имени на доске нет — мерить нечего').not.toBeNull();
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: на табло ведущее — счёт, а не подпись.
       До 13.10 имя стояло 15.2 и было почти равно счёту 16. */
    expect(л.сет, 'счёт не крупнее имени: ' + JSON.stringify(л)).toBeGreaterThan(л.имя);
    expect(л.имя, 'имя мимо шкалы кеглей: ' + JSON.stringify(л)).toBe(14);
    expect(л.межстрочныйИмени, 'межстрочный имени не с лестницы').not.toBe('normal');
});

test('табло: имя не обрезано там, где доска помещается целиком', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const р = await page.evaluate(() => {
        const имена = [...document.querySelectorAll('.sb-name')];
        const доска = document.querySelector('.sb-board').getBoundingClientRect();
        return { ширина: window.innerWidth, доска: Math.round(доска.width),
                 правыйКрай: Math.round(доска.right),
                 обрезано: имена.map(э => э.scrollWidth > э.clientWidth),
                 ширины: имена.map(э => Math.round(э.getBoundingClientRect().width)) };
    });
    expect(р.обрезано.length, 'ПОРОГ: строк на доске нет').toBe(2);
    /* ОБЕ КОЛОНКИ ИМЁН ОБЯЗАНЫ БЫТЬ ОДНОЙ ШИРИНЫ: иначе счёт в строках
       разъедется. Это держится тем, что ширину задаёт доска, а она одна. */
    expect(р.ширины[0], 'колонки имён разной ширины: ' + JSON.stringify(р)).toBe(р.ширины[1]);
    if (р.ширина >= 641) {
        expect(р.обрезано.some(Boolean),
            'на широком виде имя всё ещё обрезано: ' + JSON.stringify(р)).toBe(false);
    }
});

test('табло: доска не вылезает за экран ни на одном виде', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const р = await page.evaluate(() => {
        const d = document.querySelector('.sb-board').getBoundingClientRect();
        return { правыйКрай: Math.round(d.right), ширина: window.innerWidth,
                 переливВбок: document.documentElement.scrollWidth > window.innerWidth };
    });
    expect(р.правыйКрай, 'доска вылезает: ' + JSON.stringify(р)).toBeLessThanOrEqual(р.ширина);
});

/* ══ 2. ТАБЛО: МЁРТВОГО КОДА НЕТ В ЖИВОМ ДОКУМЕНТЕ ══════════════════════ */

test('табло: подписей колонок нет в документе, эмодзи подачи нет', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const р = await page.evaluate(() => ({
        подписей: document.querySelectorAll('.sb-col-header').length,
        эмодзи: /\u{1F3BE}/u.test(document.body.innerHTML),
        точкаПодачи: (function () {
            const э = document.querySelector('.sb-serve');
            if (!э) return null;
            const с = getComputedStyle(э), r = э.getBoundingClientRect();
            return { радиус: с.borderRadius, ш: Math.round(r.width), в: Math.round(r.height) };
        })()
    }));
    expect(р.подписей, 'подписи колонок ожили').toBe(0);
    expect(р.эмодзи, 'эмодзи подачи вернулось в кадр трансляции').toBe(false);
    expect(р.точкаПодачи, 'ПОРОГ: указателя подачи нет').not.toBeNull();
    expect(р.точкаПодачи.ш, 'точка подачи не круглая: ' + JSON.stringify(р.точкаПодачи))
        .toBe(р.точкаПодачи.в);
});

test('табло: на телефоне остаются последний сет, гейм и очко', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const р = await page.evaluate(() => ({
        ширина: window.innerWidth,
        видимых: [...document.querySelectorAll('.sb-row-p1 .sb-scores > *')]
            .filter(э => getComputedStyle(э).display !== 'none').length,
        всего: document.querySelectorAll('.sb-row-p1 .sb-scores > *').length
    }));
    expect(р.всего, 'ПОРОГ: колонок счёта нет').toBe(6);
    if (р.ширина <= 640) {
        expect(р.видимых, 'на телефоне колонок больше трёх: ' + JSON.stringify(р)).toBe(3);
    } else {
        expect(р.видимых, 'на широком виде колонки прячутся: ' + JSON.stringify(р)).toBe(6);
    }
});

/* ══ 3. ТАБЛО: ПЕРЕРЫВ ═════════════════════════════════════════════════ */

test('табло: пауза называется словом общего словаря, а не кодом', async ({ page }) => {
    await подменитьТабло(page, матч({ status: 'paused', pause_reason: 'medical' }));
    await открыть(page, ТАБЛО, '.sb-board');
    const т = await page.evaluate(() => {
        const э = document.querySelector('.sb-pause');
        return э ? э.textContent.trim() : null;
    });
    expect(т, 'ПОРОГ: плашки перерыва нет — долг 25.09 не закрыт').not.toBeNull();
    expect(т, 'на табло попал код базы, а не слово: ' + т).not.toContain('medical');
    expect(т, 'слово паузы не из словаря: ' + т).toContain('ПАУЗА');
    expect(т, 'причина не названа: ' + т).toContain('Медицинский');
});

test('табло: при идущем матче плашки перерыва нет вовсе', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    expect(await page.locator('.sb-pause').count(), 'плашка висит на идущем матче').toBe(0);
});

test('табло: лайм на гейме и очке — настоящая краска, а не похожая', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const р = await page.evaluate(() => {
        const ток = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim();
        const в = document.createElement('span');
        в.style.color = ток; document.body.appendChild(в);
        const эталон = getComputedStyle(в).color; в.remove();
        const ц = с => { const э = document.querySelector(с); return э ? getComputedStyle(э).color : null; };
        return { эталон, гейм: ц('.sb-game-val'), очко: ц('.sb-pts-val'), сет: ц('.sb-set-val') };
    });
    expect(р.гейм, 'гейм не лаймом: ' + JSON.stringify(р)).toBe(р.эталон);
    expect(р.очко, 'очко не лаймом: ' + JSON.stringify(р)).toBe(р.эталон);
    expect(р.сет, 'сыгранный сет красится как текущий: ' + JSON.stringify(р)).not.toBe(р.эталон);
});

test('табло: имя на подложке читается по WCAG', async ({ page }) => {
    await подменитьТабло(page);
    await открыть(page, ТАБЛО, '.sb-board');
    const к = await page.evaluate(`${КОНТРАСТ}('.sb-name')`);
    expect(к, 'ПОРОГ: имени нет').not.toBeNull();
    expect(к, 'контраст имени на доске ' + к).toBeGreaterThanOrEqual(4.5);
});

/* ══ 4. ВАУЧЕР: ЧТО ВИДНО ПОСЛЕ ЗАГРУЗКИ ═══════════════════════════════ */

for (const [яз, адрес] of Object.entries(ВАУЧЕР)) {

test('ваучер ' + яз + ': плашка и имя видны, экран никуда не уехал', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, адрес, '.vr-valid');
    const р = await page.evaluate(() => {
        const в = э => { if (!э) return null; const r = э.getBoundingClientRect();
            return { top: Math.round(r.top), видно: r.top >= 0 && r.top < window.innerHeight }; };
        return {
            прокрутка: Math.round(window.scrollY),
            плашка: в(document.querySelector('.vr-badge')),
            имя: в(document.querySelectorAll('.vr-row')[0]),
            фокус: document.activeElement ? document.activeElement.className : '',
            высотаЭкрана: window.innerHeight
        };
    });
    expect(р.плашка, 'ПОРОГ: плашки ваучера нет').not.toBeNull();
    /* ГЛАВНОЕ ЧИСЛО ЭТОГО КУСКА. До 13.10 автофокус в поле PIN прокручивал
       страницу на 259, и администратор подтверждал скидку, не видя ни
       плашки «действительная», ни имени владельца. */
    expect(р.прокрутка, 'экран уехал вниз при загрузке: ' + JSON.stringify(р)).toBe(0);
    expect(р.плашка.видно, 'плашка «действительная» не видна: ' + JSON.stringify(р)).toBe(true);
    expect(р.имя.видно, 'имя владельца не видно: ' + JSON.stringify(р)).toBe(true);
    expect(р.фокус, 'фокус не в поле PIN: ' + JSON.stringify(р)).toContain('vr-pin-input');
});

test('ваучер ' + яз + ': перелива вбок нет', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, адрес, '.vr-valid');
    const р = await page.evaluate(() => ({
        док: document.documentElement.scrollWidth, окно: window.innerWidth }));
    expect(р.док, 'перелив вбок: ' + JSON.stringify(р)).toBeLessThanOrEqual(р.окно);
});

test('ваучер ' + яз + ': язык страницы совпадает с языком подписей', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, адрес, '.vr-valid');
    const р = await page.evaluate(() => ({
        lang: document.documentElement.lang,
        плашка: document.querySelector('.vr-badge').textContent.trim(),
        кнопка: document.querySelector('.vr-confirm-btn').textContent.trim()
    }));
    const ждём = { ru: 'ru', en: 'en', kg: 'ky' }[яз];
    expect(р.lang, 'lang страницы: ' + JSON.stringify(р)).toBe(ждём);
    const слово = { ru: 'Подтвердить', en: 'Confirm', kg: 'Ырастоо' }[яз];
    expect(р.кнопка, 'кнопка не на своём языке: ' + JSON.stringify(р)).toBe(слово);
});

}

/* ══ 5. ВАУЧЕР: УПРАВЛЕНИЯ ═════════════════════════════════════════════ */

test('ваучер: высота кнопки и поля — ступени, а не следствие полей', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    const р = await page.evaluate(() => {
        const в = с => { const э = document.querySelector(с);
            return э ? Math.round(э.getBoundingClientRect().height) : null; };
        return { кнопка: в('.vr-confirm-btn'), поле: в('.vr-pin-input'), ширина: window.innerWidth };
    });
    const ступени = [28, 36, 44, 52];
    expect(ступени, 'высота кнопки мимо ступеней: ' + JSON.stringify(р)).toContain(р.кнопка);
    expect(ступени, 'высота поля PIN мимо ступеней: ' + JSON.stringify(р)).toContain(р.поле);
});

test('ваучер: в кнопку попадает палец, а не только курсор', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    const р = await page.evaluate(() => {
        /* СНАЧАЛА ДОВЕСТИ ДО ВИДА, ПОТОМ ЦЕЛИТЬСЯ. Первый прогон уронил этот
           щуп на телефоне боком, и прав был прибор, а не продукт: карточка
           536 при экране 390, кнопка стоит на 552 — ЗА пределами вида, и
           elementFromPoint честно отдаёт null. Палец туда тоже не попадёт,
           пока не прокрутит. Меряем попадание там, где кнопка видна. */
        const э = document.querySelector('.vr-confirm-btn');
        э.scrollIntoView({ block: 'center' });
        const к = э.getBoundingClientRect();
        const точка = document.elementFromPoint(Math.round(к.left + к.width / 2), Math.round(к.top + 2));
        return { высота: Math.round(к.height), верх: Math.round(к.top),
                 экран: window.innerHeight,
                 верхПринадлежитКнопке: !!(точка && точка.closest('.vr-confirm-btn')) };
    });
    expect(р.высота, 'цель нажатия ниже 44: ' + JSON.stringify(р)).toBeGreaterThanOrEqual(44);
    expect(р.верхПринадлежитКнопке, 'верх кнопки перекрыт: ' + JSON.stringify(р)).toBe(true);
});

test('ваучер: метка строки и текст кнопки читаются по WCAG', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    const метка = await page.evaluate(`${КОНТРАСТ}('.vr-row-label')`);
    const кнопка = await page.evaluate(`${КОНТРАСТ}('.vr-confirm-btn')`);
    expect(метка, 'ПОРОГ: метки строки нет').not.toBeNull();
    /* До 13.10 метка была rgba(255,255,255,0.45) и давала 4.44. */
    expect(метка, 'контраст метки строки ' + метка).toBeGreaterThanOrEqual(4.5);
    expect(кнопка, 'контраст текста кнопки ' + кнопка).toBeGreaterThanOrEqual(4.5);
});

test('ваучер: поле PIN подписано и связано с сообщением об ошибке', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    const р = await page.evaluate(() => {
        const l = document.querySelector('.vr-pin-label');
        const i = document.querySelector('.vr-pin-input');
        const e = document.querySelector('.vr-pin-error-msg');
        return { for: l && l.getAttribute('for'), id: i && i.id,
                 describedby: i && i.getAttribute('aria-describedby'),
                 role: e && e.getAttribute('role') };
    });
    expect(р.for, 'label не связан с полем: ' + JSON.stringify(р)).toBe(р.id);
    expect(р.describedby, 'поле не знает о своём сообщении: ' + JSON.stringify(р)).toBe('vrPinError');
    expect(р.role, 'диктор не объявит смену текста: ' + JSON.stringify(р)).toBe('alert');
});

/* ══ 6. ВАУЧЕР: ОТВЕТЫ НА ДЕЙСТВИЯ ═════════════════════════════════════ */

test('ваучер: короткий PIN получает слово, а не одну красную рамку', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    await page.fill('.vr-pin-input', '12');
    await page.click('.vr-confirm-btn');
    await page.waitForTimeout(200);
    const р = await page.evaluate(() => {
        const e = document.querySelector('.vr-pin-error-msg');
        return { текст: e ? e.textContent.trim() : '',
                 видно: e ? getComputedStyle(e).display !== 'none' : false,
                 рамка: document.querySelector('.vr-pin-input').classList.contains('vr-pin-error') };
    });
    expect(р.рамка, 'поле не отметило ошибку').toBe(true);
    expect(р.текст.length, 'короткий PIN снова молчит: ' + JSON.stringify(р)).toBeGreaterThan(0);
    expect(р.видно, 'сообщение есть, но спрятано: ' + JSON.stringify(р)).toBe(true);
});

test('ваучер: неверный PIN называет причину и возвращает фокус', async ({ page }) => {
    await подменитьВаучер(page, null, { status: 'wrong_pin' });
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    await page.fill('.vr-pin-input', '9999');
    await page.click('.vr-confirm-btn');
    await page.waitForTimeout(400);
    const р = await page.evaluate(() => ({
        текст: document.querySelector('.vr-pin-error-msg').textContent.trim(),
        поле: document.querySelector('.vr-pin-input').value,
        фокус: document.activeElement ? document.activeElement.className : '',
        кнопкаЖива: !document.querySelector('.vr-confirm-btn').disabled
    }));
    expect(р.текст, 'причина не названа: ' + JSON.stringify(р)).toContain('PIN');
    expect(р.поле, 'поле не очищено: ' + JSON.stringify(р)).toBe('');
    expect(р.фокус, 'фокус не вернулся в поле: ' + JSON.stringify(р)).toContain('vr-pin-input');
    expect(р.кнопкаЖива, 'кнопка осталась запертой: ' + JSON.stringify(р)).toBe(true);
});

test('ваучер: верный PIN даёт экран подтверждения', async ({ page }) => {
    /* ЖАТЬ МОЖНО ТОЛЬКО ПОТОМУ, ЧТО confirm_voucher ПОДМЕНЁН ВЫШЕ и до
       сети не доходит. В живой базе эта кнопка списывает скидку. */
    await подменитьВаучер(page, null, { status: 'confirmed' });
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    await page.fill('.vr-pin-input', '1234');
    await page.click('.vr-confirm-btn');
    await page.waitForSelector('.vr-success', { timeout: 5000 });
    const т = await page.textContent('.vr-success-title');
    expect(т.trim().length, 'экран подтверждения пуст').toBeGreaterThan(0);
});

/* ══ 7. ВАУЧЕР: ОТКАЗЫ ═════════════════════════════════════════════════ */

for (const [имя, ответ] of [
    ['недействительный', { status: 'invalid' }],
    ['истёкший', { status: 'expired' }],
    ['уже использованный', { status: 'already_used', used_at: new Date(Date.now() - 5 * 36e5).toISOString() }]
]) {

test('ваучер: отказ «' + имя + '» говорит, что делать дальше', async ({ page }) => {
    await подменитьВаучер(page, ответ);
    await открыть(page, ВАУЧЕР.ru, '.vr-error');
    const р = await page.evaluate(() => {
        const t = document.querySelector('.vr-error-title');
        const n = document.querySelector('.vr-error-next');
        return { заголовок: t ? t.textContent.trim() : '',
                 дальше: n ? n.textContent.trim() : '',
                 полеPIN: document.querySelectorAll('.vr-pin-input').length };
    });
    expect(р.заголовок.length, 'отказ без заголовка').toBeGreaterThan(0);
    /* ПРАВИЛО Empty state 37:53: «never just no data». */
    expect(р.дальше.length, 'отказ не сказал, что делать: ' + JSON.stringify(р)).toBeGreaterThan(0);
    expect(р.полеPIN, 'поле PIN осталось на отказе: ' + JSON.stringify(р)).toBe(0);
    expect(р.заголовок, 'человеку показано техническое слово: ' + JSON.stringify(р)).not.toBe('Error');
});

}

test('ваучер: без токена страница объясняет, а не падает', async ({ page }) => {
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru.replace(/\?.*$/, ''), '.vr-error');
    const р = await page.evaluate(() => ({
        заголовок: document.querySelector('.vr-error-title').textContent.trim(),
        дальше: document.querySelector('.vr-error-next')
            ? document.querySelector('.vr-error-next').textContent.trim() : ''
    }));
    expect(р.заголовок, 'техническое слово вместо объяснения').not.toBe('Error');
    expect(р.дальше.length, 'без токена не сказано, что делать').toBeGreaterThan(0);
});

/* ══ 8. ДВИЖЕНИЕ ═══════════════════════════════════════════════════════ */

test('ваучер: при запрете движения анимации молчат', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await подменитьВаучер(page);
    await открыть(page, ВАУЧЕР.ru, '.vr-valid');
    await page.fill('.vr-pin-input', '12');
    await page.click('.vr-confirm-btn');
    await page.waitForTimeout(200);
    /* ПРОВЕРЯЕМ ПРИЗНАК, А НЕ ПРИЁМ. Раньше здесь ждали `animationName ===
       'none'` — то есть конкретный способ, которым движение выключали в
       своём блоке `css/verify.css`. Заход B4 (16.10) свёл 27 таких блоков
       в один общий в `css/tokens.css` и глушит ДЛИТЕЛЬНОСТЬ: `none`
       оставляет элемент в НАЧАЛЬНОМ кадре, и анимация `opacity: 0 -> 1`
       осталась бы невидимой навсегда.

       Отношение, которое надо держать: при запрете движения тряска НЕ
       ВИДНА. Это верно и когда имени нет, и когда длительность мгновенна.
       Проба от этого не слабеет: верни анимацию без общего правила — и
       длительность станет 0.3s, а правило упадёт. */
    const движение = await page.evaluate(() => {
        const k = getComputedStyle(document.querySelector('.vr-pin-input'));
        return { имя: k.animationName, длительность: k.animationDuration };
    });
    const мгновенна = parseFloat(движение.длительность) <= 0.001;
    expect(движение.имя === 'none' || мгновенна,
        'тряска поля видна при запрете движения: имя ' + движение.имя +
        ', длительность ' + движение.длительность).toBe(true);
});
