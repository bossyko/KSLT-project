/**
 * СПИСКИ КАБИНЕТА НА ТЕЛЕФОНЕ — баттлы и приглашения, 12.10.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ПЕРЕЛИВ. В файле написано «строка — грид с областями». Помещается ли
 *     она на самом деле, решает содержимое: замер до правки давал 361 при
 *     324, и прокрутка вбок была настоящей;
 *   • РЕЖИМ СТРОКИ. На ≤640 строка обязана быть списком, на широких —
 *     остаться таблицей. Это две разные раскладки одной разметки, и
 *     перепутать их файл не мешает;
 *   • ШИРИНУ КЛЕТКИ. Ширины колонок весят (0,3,1) и пережили первую
 *     редакцию правила: клетка имени вышла 44 вместо 222. Файл показывает
 *     объявление, живая страница — кто победил;
 *   • ОТСЕЧКУ ИМЕНИ. При самом длинном значке под имя остаётся около 133.
 *     Обрезается оно или переносится — видно только в браузере. ПОПРАВКА
 *     12.10: первая редакция подставляла имя в 17 знаков и требовала, чтобы
 *     оно НЕ влезло — на виде 375 оно попросило 152 при 152 и проверка
 *     упала. Влезет имя или нет — свойство вида, а не раскладки, поэтому
 *     подставляется имя, не влезающее нигде, и спрашивается механизм:
 *     три свойства отсечки и ровно одна строка;
 *   • ЦЕЛИ НАЖАТИЯ. H2H красится 40x21, кнопка ответа 28 — прозрачный слой
 *     меряется настоящим прямоугольником;
 *   • КРАЙНИЕ СЛУЧАИ. Самый длинный значок и две кнопки ответа подставляются
 *     в ЖИВУЮ строку: у подставного аккаунта таких вызовов может не быть, а
 *     раскладка обязана держать их всё равно.
 *
 * ОТКУДА СТРОКИ. У аккаунта проб ни одного вызова и ни одного приглашения
 * нет, а при пустом ответе страница рисует заглушку ВМЕСТО таблицы
 * (js/dashboard.js:3897-3900 и 2353-2361) — мерить раскладку становится
 * нечем, и прогон 12.10 уронил этим все шестьдесят проверок. Подменяется
 * ОТВЕТ ЗАПРОСА, а не разметка: строки собирает тот же battleRow/inviteRow,
 * что и в бою, и меряется настоящая раскладка настоящего кода. Правда,
 * которую здесь проверяют, — геометрия строки; про содержимое базы ни одна
 * проверка этого файла ничего не утверждает.
 *
 * ПОРОГ: таблицы баттлов нет на странице — проверка ПАДАЕТ, а не проходит
 * вхолостую.
 */
const { test, expect } = require('../../fixtures');
const { playerState } = require('../../auth-setup');

test.use({ storageState: playerState });

const ЯЗЫКИ = [{ имя: 'ru', хвост: '' }, { имя: 'en', хвост: '-en' }, { имя: 'kg', хвост: '-kg' }];
const ШКАЛА_КНОПОК = [28, 36, 44, 52];
const ЛЕСТНИЦА_СТРОК = [1, 1.1, 1.3, 1.5, 1.65];
const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

/* Запись первая держит ВСЕ уровни строки сразу: дату матча, имя со ссылкой,
   направление с датой вызова, сообщение, ссылку на баттл, место, счёт, итог и
   значок статуса. Вторая — полученный активный вызов: только у него в клетке
   стоят две кнопки ответа. Третья — свой отклонённый: короткое имя и значок. */
const ВЫЗОВЫ = [
    {
        id: 'proba-vyzov-1', direction: 'received', status: 'accepted',
        challenger_name: 'Адиль Валимамедов', challenger_avatar: null,
        challenger_player_id: 'proba-sopernik-1',
        opponent_name: 'Проба Пробова', opponent_avatar: null,
        opponent_player_id: 'proba-ya',
        proposed_date: '2026-10-08', created_at: '2026-10-01T10:00:00Z',
        match_score: '6:4 3:6 7:5', match_winner_id: 'proba-sopernik-1',
        message: 'Сыграем в субботу утром',
        battle_published: true, battle_title: 'Баттл недели',
        court_name: 'Центральный корт'
    },
    {
        id: 'proba-vyzov-2', direction: 'received', status: 'active',
        challenger_name: 'Чолпон Асанбекова', challenger_avatar: null,
        challenger_player_id: 'proba-sopernik-2',
        opponent_name: 'Проба Пробова', opponent_avatar: null,
        opponent_player_id: 'proba-ya',
        created_at: '2026-10-10T08:00:00Z',
        expires_at: '2027-01-01T00:00:00Z'
    },
    {
        id: 'proba-vyzov-3', direction: 'sent', status: 'declined',
        challenger_name: 'Проба Пробова', challenger_avatar: null,
        challenger_player_id: 'proba-ya',
        opponent_name: 'Tim', opponent_avatar: null,
        opponent_player_id: 'proba-sopernik-3',
        created_at: '2026-09-20T12:00:00Z'
    }
];

const ПРИГЛАШЕНИЯ = [
    {
        id: 'proba-priglash-1', direction: 'received', status: 'pending',
        partner_name: 'Эрмек Жумабеков', partner_avatar: null,
        created_at: '2026-10-05T09:00:00Z'
    },
    {
        id: 'proba-priglash-2', direction: 'sent', status: 'accepted',
        partner_name: 'Чолпон Асанбекова', partner_avatar: null,
        created_at: '2026-10-03T09:00:00Z'
    },
    {
        id: 'proba-priglash-3', direction: 'sent', status: 'declined',
        partner_name: 'Tim', partner_avatar: null,
        created_at: '2026-09-28T09:00:00Z'
    }
];

/** Ответ запроса подменяется ДО загрузки: строки собирает боевой код. */
async function подставитьСтроки(page) {
    const отдать = тело => route => route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(тело)
    });
    await page.route('**/rest/v1/rpc/get_my_challenges*', отдать(ВЫЗОВЫ));
    await page.route('**/rest/v1/rpc/get_my_game_invites*', отдать(ПРИГЛАШЕНИЯ));
}

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

async function открыть(page, хвост) {
    await page.addInitScript(() => {
        try { localStorage.setItem('kslt_onboarding_done', '1'); } catch (e) {}
    });
    await подставитьСтроки(page);
    await page.goto('/pages/dashboard' + хвост + '.html#games');
    await page.waitForLoadState('networkidle');
    await погаситьНакладки(page);

    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: строки рисует js после ответа
       запроса, и networkidle наступает раньше, чем появляется tbody */
    await page.locator('.db-battles-table:not(.db-invites-table) tbody tr').first().waitFor({ timeout: 10000 });
    await page.locator('.db-invites-table tbody tr').first().waitFor({ timeout: 10000 });

    const таблица = page.locator('.db-battles-table:not(.db-invites-table)');
    expect(await таблица.count(),
        'ПОРОГ: таблицы баттлов нет на странице — проверять нечего').toBeGreaterThan(0);
    const строк = await page.locator('.db-battles-table:not(.db-invites-table) tbody tr').count();
    expect(строк, 'ПОРОГ: в таблице баттлов ни одной строки').toBeGreaterThan(0);
    return таблица.first();
}

/* ══════════════════════════════════════════════════════════════════════
   1. ПЕРЕЛИВА НЕТ НИ НА ОДНОМ ВИДЕ
   ══════════════════════════════════════════════════════════════════════ */
for (const я of ЯЗЫКИ) {
    test('ни баттлы, ни приглашения не вылезают за свою коробку · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост);

        const беды = await page.evaluate(() => {
            const плохо = [];
            document.querySelectorAll('.db-battles-table, .db-invites-table').forEach(т => {
                const к = т.getBoundingClientRect();
                if (!к.width) return;
                const имя = т.className.indexOf('db-invites-table') !== -1 ? 'приглашения' : 'баттлы';
                if (т.scrollWidth > Math.round(к.width) + 1) {
                    плохо.push(имя + ': просит ' + т.scrollWidth + ' при ' + Math.round(к.width));
                }
                const короб = т.closest('.db-subsection-body');
                if (короб && короб.scrollWidth > короб.clientWidth + 1) {
                    плохо.push(имя + ', короб листается вбок: ' + короб.scrollWidth +
                        ' при ' + короб.clientWidth);
                }
            });
            return плохо;
        });

        expect(беды, 'перелив: ' + беды.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   2. РЕЖИМ СТРОКИ — СПИСОК НА УЗКОМ, ТАБЛИЦА НА ШИРОКОМ
   ══════════════════════════════════════════════════════════════════════ */
test('строка становится списком только на узком виде', async ({ page }) => {
    await открыть(page, '');
    const ш = page.viewportSize().width;
    const ждём = ш <= 640 ? 'grid' : 'table-row';

    const режим = await page.evaluate(() =>
        getComputedStyle(document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr')).display);

    expect(режим, 'на виде ' + ш + ' строка должна быть ' + ждём).toBe(ждём);

    if (ждём === 'grid') {
        const области = await page.evaluate(() =>
            getComputedStyle(document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr')).gridTemplateAreas);
        expect(области, 'области грида не названы именами').toContain('who');
        expect(области, 'во второй линии нет места под действия').toContain('act');
    }
});

/* ══════════════════════════════════════════════════════════════════════
   3. КЛЕТКА БЕРЁТ ШИРИНУ СВОЕЙ ОБЛАСТИ, А НЕ ПРЕЖНЕЙ КОЛОНКИ
   ══════════════════════════════════════════════════════════════════════ */
test('в списке клетка имени занимает свою область целиком', async ({ page }) => {
    await открыть(page, '');
    if (page.viewportSize().width > 640) {
        test.skip(true, 'на широком виде строка остаётся таблицей по построению');
        return;
    }

    const числа = await page.evaluate(() => {
        const стр = document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr');
        const кто = стр.children[1];
        const к = кто.getBoundingClientRect();
        const ряд = стр.getBoundingClientRect();
        return { клетка: Math.round(к.width), строка: Math.round(ряд.width) };
    });

    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: клетка имени занимает больше половины строки.
       До правки она держала прежние 34 % колонки и выходила 44 из 324. */
    expect(числа.клетка / числа.строка,
        'клетка имени ' + числа.клетка + ' из ' + числа.строка + ' — она снова держит ' +
        'ширину колонки таблицы вместо своей области')
        .toBeGreaterThan(0.5);
});

/* ══════════════════════════════════════════════════════════════════════
   4. КРАЙНИЕ СЛУЧАИ — ПОДСТАВЛЯЮТСЯ В ЖИВУЮ СТРОКУ
   ══════════════════════════════════════════════════════════════════════ */
test('самый длинный значок не ломает строку, а имя обрезается', async ({ page }) => {
    await открыть(page, '');
    if (page.viewportSize().width > 640) {
        test.skip(true, 'отсечка имени нужна только там, где строка стала списком');
        return;
    }

    const итог = await page.evaluate(() => {
        const стр = document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr');
        const зн = стр.querySelector('.db-status-badge');
        const имя = стр.querySelector('.db-opp-link');
        if (!зн || !имя) return { беда: 'в строке нет значка или имени' };
        зн.textContent = 'Counter-proposal';
        /* ИМЯ ЗАВЕДОМО ДЛИННЕЕ ЛЮБОГО ВИДА. Прежняя редакция ставила
           «Адиль Валимамедов» и требовала, чтобы оно НЕ влезло: на виде 375
           оно попросило 152 при 152 — влезло, и проверка упала на ровном
           месте (прогон 12.10). Влезло — это удача вида, а не свойство
           раскладки; проверять надо, что при имени, которое не влезает
           никогда, оно обрезается многоточием, а не переносится и не
           растягивает строку */
        имя.textContent = 'Жумабек Кожомкулов-Валимамедов Асанбекович';
        const т = стр.closest('table');
        const с = getComputedStyle(имя);
        return {
            перелив: т.scrollWidth - Math.round(т.getBoundingClientRect().width),
            значок: Math.round(зн.getBoundingClientRect().width),
            имяВидно: имя.clientWidth,
            имяПросит: имя.scrollWidth,
            отсечка: с.overflow + ' · ' + с.textOverflow + ' · ' + с.whiteSpace,
            строк: Math.round(имя.getBoundingClientRect().height /
                (parseFloat(с.lineHeight) || 21))
        };
    });

    expect(итог.беда, 'ПОРОГ: ' + (итог.беда || '')).toBeUndefined();
    expect(итог.перелив, 'строка поехала вбок при самом длинном значке').toBeLessThanOrEqual(1);
    expect(итог.строк, 'имя перенеслось на вторую строку вместо отсечки').toBe(1);
    /* МЕХАНИЗМ, А НЕ УДАЧА: три свойства отсечки объявлены все три разом —
       без любого из них длинное имя либо переносится, либо вылезает */
    expect(итог.отсечка, 'у имени не объявлена отсечка многоточием')
        .toBe('hidden · ellipsis · nowrap');
    expect(итог.имяПросит,
        'имя, которое не влезает ни в один вид, не обрезано: просит ' +
        итог.имяПросит + ' при ' + итог.имяВидно)
        .toBeGreaterThan(итог.имяВидно);
});

test('две кнопки ответа встают во вторую линию и не ломают строку', async ({ page }) => {
    await открыть(page, '');
    if (page.viewportSize().width > 640) {
        test.skip(true, 'линии появляются только там, где строка стала списком');
        return;
    }

    const итог = await page.evaluate(() => {
        const стр = document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr');
        const кл = стр.querySelector('.db-cell-status') || стр.querySelector('.db-cell-actions');
        if (!кл) return { беда: 'в строке нет клетки статуса' };
        кл.className = 'db-cell-actions';
        кл.innerHTML = '<div class="db-chal-actions">' +
            '<button class="db-chal-btn db-chal-yes">Кабыл алуу</button>' +
            '<button class="db-chal-btn db-chal-no">Четке кагуу</button></div>';
        const т = стр.closest('table');
        const кнопка = стр.querySelector('.db-chal-btn');
        const h2h = стр.querySelector('.db-match-h2h');
        const рКн = кнопка.getBoundingClientRect();
        return {
            перелив: т.scrollWidth - Math.round(т.getBoundingClientRect().width),
            кнопкаНиже: h2h ? (рКн.top >= стр.querySelector('.db-opp-link').getBoundingClientRect().bottom) : true,
            высотаКнопки: Math.round(рКн.height),
            слой: (function () {
                const a = getComputedStyle(кнопка, '::after');
                return (parseFloat(a.minWidth) || 0) + 'x' + (parseFloat(a.minHeight) || 0);
            })()
        };
    });

    expect(итог.беда, 'ПОРОГ: ' + (итог.беда || '')).toBeUndefined();
    expect(итог.перелив, 'строка поехала вбок от двух кнопок ответа').toBeLessThanOrEqual(1);
    expect(итог.кнопкаНиже, 'кнопки встали в одну линию с именем — вместе они не помещаются').toBe(true);
    expect(ШКАЛА_КНОПОК, 'высота кнопки ' + итог.высотаКнопки + ' мимо шкалы')
        .toContain(итог.высотаКнопки);
    expect(итог.слой, 'у кнопки ответа нет прозрачного слоя цели 44').toBe('44x44');
});

/* ══════════════════════════════════════════════════════════════════════
   5. ЦЕЛИ НАЖАТИЯ И ЛЕСТНИЦА СТРОКИ
   ══════════════════════════════════════════════════════════════════════ */
test('у кнопок строки есть настоящая цель 44', async ({ page }) => {
    await открыть(page, '');

    const беды = await page.evaluate(() => {
        const плохо = [];
        document.querySelectorAll('.db-battles-table:not(.db-invites-table) .db-match-h2h, .db-battles-table:not(.db-invites-table) .db-chal-btn')
            .forEach(э => {
                const к = э.getBoundingClientRect();
                if (!к.width) return;
                const a = getComputedStyle(э, '::after');
                const w = parseFloat(a.minWidth) || 0, h = parseFloat(a.minHeight) || 0;
                if (w < 44 || h < 44) {
                    плохо.push((э.className || '').split(' ')[0] + ' слой ' + w + 'x' + h);
                }
            });
        return плохо;
    });

    const кнопок = await page.locator(
        '.db-battles-table:not(.db-invites-table) .db-match-h2h, ' +
        '.db-battles-table:not(.db-invites-table) .db-chal-btn').count();
    expect(кнопок, 'ПОРОГ: в строках баттлов не нашлось ни одной кнопки — ' +
        'проверять цели нечего').toBeGreaterThan(0);
    expect(беды, 'цели ниже 44: ' + беды.join(' · ')).toEqual([]);
});

for (const я of ЯЗЫКИ) {
    test('лестница строки баттла стоит на ступенях · ' + я.имя, async ({ page }) => {
        await открыть(page, я.хвост);

        const уровни = await page.evaluate(() => {
            const стр = document.querySelector('.db-battles-table:not(.db-invites-table) tbody tr');
            const из = sel => {
                const э = стр.querySelector(sel);
                if (!э) return null;
                const с = getComputedStyle(э);
                return {
                    кегль: Math.round(parseFloat(с.fontSize) * 100) / 100,
                    вес: parseInt(с.fontWeight, 10),
                    мс: с.lineHeight === 'normal' ? 'normal'
                        : Math.round(parseFloat(с.lineHeight) / parseFloat(с.fontSize) * 100) / 100
                };
            };
            return {
                'дата': из('.db-match-date'), 'имя': из('.db-opp-link'),
                'направление': из('.db-chal-dir'), 'сообщение': из('.db-chal-msg'),
                'счёт': из('.db-match-score'), 'значок': из('.db-status-badge'),
                'H2H': из('.db-match-h2h')
            };
        });

        const снято = Object.keys(уровни).filter(к => уровни[к]);
        expect(снято.length, 'ПОРОГ: не снято ни одного уровня строки').toBeGreaterThan(3);

        const мимо = [];
        снято.forEach(к => {
            const у = уровни[к];
            if (!ШКАЛА_КЕГЛЕЙ.includes(у.кегль)) мимо.push(к + ': кегль ' + у.кегль);
            if (![400, 500, 600, 700].includes(у.вес)) мимо.push(к + ': вес ' + у.вес);
            if (у.мс === 'normal' || !ЛЕСТНИЦА_СТРОК.includes(у.мс)) мимо.push(к + ': межстрочный ' + у.мс);
        });

        expect(мимо, 'уровней снято ' + снято.length + ', мимо шкалы: ' + мимо.join(' · ')).toEqual([]);
    });
}

/* ══════════════════════════════════════════════════════════════════════
   6. ЗНАЧОК СТАТУСА — КОНТРАСТ НА НАСТОЯЩЕМ ФОНЕ
   ══════════════════════════════════════════════════════════════════════ */
test('подпись значка статуса читается на своём фоне', async ({ page }) => {
    await открыть(page, '');

    const итог = await page.evaluate(() => {
        const зн = document.querySelector('.db-battles-table:not(.db-invites-table) .db-status-badge');
        if (!зн) return { беда: 'значка статуса нет в строке' };
        const ч = c => (c.match(/[\d.]+/g) || []).map(Number);
        const св = m => {
            const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
            return 0.2126 * f(m[0]) + 0.7152 * f(m[1]) + 0.0722 * f(m[2]);
        };
        /* ПРОЗРАЧНАЯ КРАСКА СМЕШИВАЕТСЯ С ФОНОМ, А НЕ ОТБРАСЫВАЕТСЯ: идём
           вверх по предкам и складываем слои до первого непрозрачного */
        const фонПод = el => {
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
        const фон = фонПод(зн);
        const т = ч(getComputedStyle(зн).color);
        const l1 = св(т), l2 = св(фон);
        return {
            контраст: Math.round(((Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05)) * 100) / 100,
            фон: фон.map(Math.round).join(','),
            прозрачныйФон: (ч(getComputedStyle(зн).backgroundColor)[3] || 1) < 1
        };
    });

    expect(итог.беда, 'ПОРОГ: ' + (итог.беда || '')).toBeUndefined();
    expect(итог.прозрачныйФон,
        'фон значка прозрачный: контраст у одного значка выходит разный на трёх ' +
        'подложках кабинета').toBe(false);
    expect(итог.контраст,
        'подпись значка ' + итог.контраст + ' на фоне rgb(' + итог.фон + ') — ниже AA 4.5')
        .toBeGreaterThanOrEqual(4.5);
});
