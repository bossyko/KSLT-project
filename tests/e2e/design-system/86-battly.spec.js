/**
 * ОБЗОР БАТТЛОВ И СТРАНИЦА ВЫЗОВА. 13.10, кусок 67-й.
 *
 * ЧТО ПРОВЕРЯЕТ ПРОГОН, А НЕ ЗАМОРОЗКА:
 *
 *   • ОТНОШЕНИЯ ЛЕСТНИЦЫ СРАВНИВАЮТСЯ НА ЭКРАНЕ. Заморозка видит, что
 *     заголовок зовёт `--fs-hero`, а что он ВЫШЕЛ крупнее перебивки на
 *     каждом из пяти видов, отвечает только браузер: кегль мог прийти из
 *     другого правила, перебивающего это по весу;
 *   • ЦЕЛЬ НАЖАТИЯ — ЭТО ПОПАДАНИЕ, а не высота коробки: слой у места дан
 *     псевдоэлементом, и увидеть его можно только `elementFromPoint`;
 *   • ОКНО КАРТЫ ПРОВЕРЯЕТСЯ НАЖАТИЕМ И TAB: ловушка живёт в обработчике;
 *   • ПОБЕДИТЕЛЬ С ГОСТЕМ — проверяется тем, что строки НЕТ. Пустое поле
 *     базы сравнивалось с пустым и отвечало «да»: прочитать это в файле
 *     нельзя, только прогнать;
 *   • КОНТРАСТ СЧИТАЕТСЯ ПО ФАКТИЧЕСКОЙ КРАСКЕ с учётом прозрачности.
 *
 * ДАННЫХ В БАЗЕ НЕТ ВОВСЕ — ни в боевой, ни в тестовой. Подменяем ОТВЕТ
 * ЗАПРОСА, строки собирает боевой код: пятый случай за месяц.
 *
 * ПОРОГ: нет карточек — проверка ПАДАЕТ, а не проходит вхолостую.
 */
const { test, expect } = require('../../fixtures');

const ОБЗОР = '/pages/battles-overview.html';
const ВЫЗОВ = '/pages/challenge.html';

const ЗАВТРА = new Date(Date.now() + 20 * 36e5);
const ВЧЕРА = new Date(Date.now() - 30 * 36e5);
const дв = n => ('0' + n).slice(-2);
const дата = d => d.getFullYear() + '-' + дв(d.getMonth() + 1) + '-' + дв(d.getDate());
const время = d => дв(d.getHours()) + ':' + дв(d.getMinutes());

const ИГРОКИ = [
    { id: 'p1', name: 'Айбек Жаныбеков-Орозов', name_en: 'Aibek Zhanybekov-Orozov',
      name_kg: 'Айбек Жаныбеков-Орозов', photo: '', category_id: 'men-masters', country: 'KG' },
    { id: 'p2', name: 'Эрмек Токтогулов-Садыков', name_en: 'Ermek Toktogulov-Sadykov',
      name_kg: 'Эрмек Токтогулов-Садыков', photo: '', category_id: 'men-tour', country: 'KZ' }
];

function баттл(п) {
    return Object.assign({
        id: 'b1', battle_title: 'Баттл за место в Pro-Masters: Жаныбеков против Токтогулова',
        status: 'published', voting_closed: false,
        proposed_date: дата(ЗАВТРА), proposed_time: время(ЗАВТРА),
        proposed_venue: 'Теннисный центр «Ала-Тоо», корт № 3',
        challenger_player_id: 'p1', opponent_player_id: 'p2',
        challenger_external_name: null, opponent_external_name: null,
        format: 'singles', challenger_partner_id: null, opponent_partner_id: null,
        challenger_partner_name: null, opponent_partner_name: null,
        challenger_gender: 'male', opponent_gender: 'male',
        challenger_partner_gender: null, opponent_partner_gender: null,
        banner_url: '', battle_published_at: дата(ВЧЕРА), match_id: null,
        challenger_country: 'KG', opponent_country: 'KZ',
        challenger_partner_country: null, opponent_partner_country: null,
        challenger_photo: null, opponent_photo: null,
        challenger_partner_photo: null, opponent_partner_photo: null
    }, п);
}

const СПИСОК = [
    баттл({ id: 'b1' }),
    баттл({ id: 'b2', battle_title: 'Вечерний баттл на «Ала-Тоо»' }),
    баттл({ id: 'b3', battle_title: 'ТЕСТ второй категории — Tour мужской одиночный',
            status: 'completed', voting_closed: true,
            proposed_date: дата(ВЧЕРА), proposed_time: время(ВЧЕРА), match_id: 'm1' })
];

/** Баттл страницы вызова: форма из живого get_battle_public (снимок базы). */
function публичный(п) {
    return Object.assign({
        id: 'b1', battle_title: 'Баттл за место в Pro-Masters: Жаныбеков против Токтогулова',
        status: 'published', voting_closed: false, format: 'singles',
        proposed_date: дата(ЗАВТРА), proposed_time: время(ЗАВТРА),
        proposed_venue: 'Теннисный центр «Ала-Тоо», корт № 3',
        challenger_player_id: 'p1', opponent_player_id: 'p2',
        challenger_partner_id: null, opponent_partner_id: null,
        banner_url: '', match_id: null,
        challenger_name: 'Айбек Жаныбеков-Орозов', challenger_name_en: 'Aibek Zhanybekov-Orozov',
        challenger_name_kg: 'Айбек Жаныбеков-Орозов', challenger_photo: '',
        challenger_country: 'KG', challenger_cat: 'men-masters',
        challenger_wins: 34, challenger_losses: 11, challenger_points: 870,
        challenger_player_ntrp: 4.5,
        opponent_name: 'Эрмек Токтогулов-Садыков', opponent_name_en: 'Ermek Toktogulov-Sadykov',
        opponent_name_kg: 'Эрмек Токтогулов-Садыков', opponent_photo: '',
        opponent_country: 'KZ', opponent_cat: 'men-tour',
        opponent_wins: 21, opponent_losses: 19, opponent_points: 450,
        opponent_player_ntrp: 4.0,
        challenger_partner_display: null, opponent_partner_display: null,
        court_google_maps: '', court_twogis: ''
    }, п);
}

const ГОЛОСА = [{ side: 1, votes: 37 }, { side: 2, votes: 24 }];

async function подменить(page, вызов) {
    await page.route('**/rest/v1/rpc/get_battle_votes*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ГОЛОСА) }));
    await page.route('**/rest/v1/rpc/get_battle_public*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(вызов || публичный({})) }));
    await page.route('**/rest/v1/rpc/increment_page_view*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: '1' }));
    await page.route('**/rest/v1/challenges*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(СПИСОК) }));
    await page.route('**/rest/v1/players_public*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: JSON.stringify(ИГРОКИ) }));
    await page.route('**/rest/v1/matches*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/rest/v1/challenge_predictions*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: '[]' }));
    await page.route('**/rest/v1/profiles*', r => r.fulfill({
        status: 200, contentType: 'application/json', body: '[]' }));
}

async function открыть(page, адрес, признак, вызов) {
    await подменить(page, вызов);
    await page.goto(адрес);
    await page.waitForFunction(
        с => document.querySelector(с) !== null, признак, { timeout: 15000 }
    ).catch(() => { throw new Error('ПОРОГ: за 15 секунд не появился ' + признак + ' — мерить нечего'); });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

const кегль = async (page, сел) => page.evaluate(с => {
    const э = document.querySelector(с);
    return э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null;
}, сел);

/* ══ 1. ЛЕСТНИЦА ОБЗОРА ЧИТАЕТСЯ СВЕРХУ ВНИЗ ════════════════════════════ */

test('лестница обзора: обложка крупнее цифры, цифра не крупнее раздела', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-featured');
    const л = await page.evaluate(() => {
        const к = с => { const э = document.querySelector(с);
            return э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null; };
        return { обложка: к('.bo-hero h1'), цифра: к('.bo-hero-stat-value'),
                 раздел: к('.trn-block-title'), карточка: к('.bo-featured-title'),
                 ширина: window.innerWidth };
    });
    expect(л.обложка, 'ПОРОГ: заголовка обложки нет — мерить нечего').not.toBeNull();
    /* ОТНОШЕНИЕ, А НЕ ЧИСЛО, И ОНО ПРОДУКТОВОЕ, А НЕ МОЁ.
       Цифра обложки у всех разделов идёт токеном `--fs-hero-num` и на
       широких видах РАВНА заголовку (40 и 40, 32 и 32) — так на девяти
       страницах. Правило, принятое на спонсорах: цифра НЕ КРУПНЕЕ
       заголовка. До 13.10 баттлы его нарушали: на 844 цифра стояла 40 при
       заголовке 37, и самым крупным на экране было число, а не мысль.
       Первый прогон уронил этот щуп на четырёх видах, и прав был продукт:
       я потребовал строгого неравенства там, где принято равенство. */
    expect(л.цифра, 'цифра обложки крупнее заголовка: ' + JSON.stringify(л))
        .toBeLessThanOrEqual(л.обложка);
    expect(л.карточка, 'название карточки не мельче заголовка раздела: ' + JSON.stringify(л))
        .toBeLessThanOrEqual(л.раздел);
});

/* ══ 2. ЗНАЧОК ГОВОРИТ СОСТОЯНИЕ, А НЕ НАЗВАНИЕ РАЗДЕЛА ═════════════════ */

test('значок карточки называет состояние', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-status');
    const з = await page.evaluate(() => {
        const слова = window.KSLT_STATUS ? window.KSLT_STATUS.подписи('ru') : null;
        return { значки: [...document.querySelectorAll('.bo-status')].map(x => x.textContent.trim()),
                 разрешённые: слова ? Object.keys(слова).map(k => слова[k]) : null };
    });
    expect(з.разрешённые, 'ПОРОГ: модуля подписей состояний на странице нет').not.toBeNull();
    expect(з.значки.length, 'ПОРОГ: значков на экране нет').toBeGreaterThan(0);
    /* «БАТТЛЫ» — это заголовок страницы, повторённый на каждой карточке. */
    const чужие = з.значки.filter(т => з.разрешённые.indexOf(т) === -1);
    expect(чужие, 'значок говорит не состояние: ' + JSON.stringify(з.значки)).toEqual([]);
});

/* ══ 3. СЕТКА НА ТЕЛЕФОНЕ — ОДНА КОЛОНКА ════════════════════════════════ */

test('карточки не сжимаются в два столбца на телефоне', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-featured');
    const с = await page.evaluate(() => {
        const g = document.querySelector('.bo-card-grid');
        const c = document.querySelector('.bo-featured');
        if (!c) return null;
        return { колонок: g ? getComputedStyle(g).gridTemplateColumns.split(' ').length : 1,
                 ширинаКарточки: Math.round(c.getBoundingClientRect().width),
                 окно: window.innerWidth };
    });
    expect(с, 'ПОРОГ: крупной карточки на экране нет').not.toBeNull();
    if (с.окно <= 640) {
        /* Замер 13.10 на 390: сетка рисовалась чужим классом, выходило
           «173px 173px», карточка 173 × 800, название в семь строк. */
        expect(с.колонок, 'на телефоне карточки идут в два столбца').toBe(1);
        expect(с.ширинаКарточки, 'карточка уже половины экрана: ' + JSON.stringify(с))
            .toBeGreaterThan(с.окно * 0.7);
    }
});

/* ══ 4. ЦЕЛИ НАЖАТИЯ — ПОПАДАНИЕМ ═══════════════════════════════════════ */

test('управления карточки стоят на ступенях и дают цель', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-featured-link');
    const ц = await page.evaluate(() => {
        const СТУПЕНИ = [28, 36, 44, 52];
        const мера = сел => {
            const э = document.querySelector(сел);
            if (!э) return null;
            э.scrollIntoView({ block: 'center' });
            const rr = э.getBoundingClientRect();
            const x = Math.round(rr.left + rr.width / 2);
            const цY = rr.top + rr.height / 2;
            const своя = y => { const т = document.elementFromPoint(x, Math.round(y));
                return !!(т && (т === э || э.contains(т))); };
            if (!своя(цY)) return { коробка: Math.round(rr.height), попадание: null };
            let в = цY, н = цY;
            while (в > 1 && своя(в - 1)) в--;
            while (н < window.innerHeight - 1 && своя(н + 1)) н++;
            const коробка = Math.round(rr.height);
            return { коробка, попадание: Math.round(н - в), наСтупени: СТУПЕНИ.indexOf(коробка) !== -1 };
        };
        return { подробнее: мера('.bo-featured-link'), место: мера('.bo-meta-venue'),
                 узко: window.innerWidth <= 640 };
    });
    expect(ц.подробнее, 'ПОРОГ: ссылки «Подробнее» на экране нет').not.toBeNull();
    expect(ц.подробнее.наСтупени, 'высота «Подробнее» мимо ступеней 28 · 36 · 44 · 52: ' +
        JSON.stringify(ц.подробнее)).toBe(true);
    /* Место открывает окно карт, то есть это кнопка: замер 13.10 дал 20. */
    if (ц.место) {
        expect(ц.место.попадание, 'цель у места мельче 36: ' + JSON.stringify(ц.место))
            .toBeGreaterThanOrEqual(35);
    }
    if (ц.узко) {
        expect(ц.подробнее.попадание, 'на телефоне цель «Подробнее» ниже 44')
            .toBeGreaterThanOrEqual(43);
    }
});

/* ══ 5. «ПОДРОБНЕЕ» — НАСТОЯЩАЯ ССЫЛКА ══════════════════════════════════ */

test('переход карточки достижим клавиатурой', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-featured');
    const с = await page.evaluate(() => {
        const a = document.querySelector('.bo-featured-link');
        if (!a) return null;
        a.focus();
        return { тег: a.tagName, адрес: (a.getAttribute('href') || '').indexOf('challenge') !== -1,
                 вФокусе: document.activeElement === a };
    });
    expect(с, 'ПОРОГ: «Подробнее» на экране нет').not.toBeNull();
    expect(с.тег, '«Подробнее» не ссылка').toBe('A');
    expect(с.адрес, '«Подробнее» ведёт не на страницу вызова').toBe(true);
    expect(с.вФокусе, '«Подробнее» не принимает фокус').toBe(true);
});

/* ══ 6. ОКНО КАРТЫ — НАЖАТИЕМ, А НЕ ЧТЕНИЕМ ════════════════════════════ */

test('окно карты называет себя окном и закрывается Esc', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-meta-venue');
    await page.locator('.bo-meta-venue').first().click();
    await page.waitForTimeout(250);
    const о = await page.evaluate(() => {
        const м = document.getElementById('boMapModal');
        if (!м) return null;
        return { role: м.getAttribute('role'), modal: м.getAttribute('aria-modal'),
                 имя: (document.getElementById(м.getAttribute('aria-labelledby') || '') || {}).tagName,
                 фокусВОкне: м.contains(document.activeElement) };
    });
    expect(о, 'окно карты не открылось по нажатию').not.toBeNull();
    expect(о.role, 'окно не называет себя окном').toBe('dialog');
    expect(о.modal, 'окно не помечено модальным').toBe('true');
    expect(о.имя, 'имя окна не заголовок уровня').toBe('H2');
    expect(о.фокусВОкне, 'фокус не переведён в окно').toBe(true);

    await page.keyboard.press('Escape');
    await page.waitForTimeout(200);
    const закрылось = await page.evaluate(() => !document.getElementById('boMapModal'));
    expect(закрылось, 'Esc не закрывает окно карты').toBe(true);
});

/* ══ 7. ЛЕСТНИЦА СТРАНИЦЫ ВЫЗОВА ════════════════════════════════════════ */

test('перебивка VS строго мельче заголовка баттла', async ({ page }) => {
    await открыть(page, ВЫЗОВ + '?id=b1', '.ch-battle-title');
    const л = await page.evaluate(() => {
        const к = с => { const э = document.querySelector(с);
            return э ? Math.round(parseFloat(getComputedStyle(э).fontSize)) : null; };
        return { заголовок: к('.ch-battle-title'), VS: к('.ch-vs-text'),
                 имя: к('.ch-player-name'), ширина: window.innerWidth };
    });
    expect(л.заголовок, 'ПОРОГ: заголовка баттла нет — мерить нечего').not.toBeNull();
    expect(л.VS, 'ПОРОГ: перебивки VS нет').not.toBeNull();
    /* До 13.10: 40 против 37 на 844 и 26 против 21 на 390. */
    expect(л.VS, 'перебивка не мельче заголовка: ' + JSON.stringify(л)).toBeLessThan(л.заголовок);
    expect(л.имя, 'имя игрока не мельче перебивки: ' + JSON.stringify(л)).toBeLessThanOrEqual(л.VS);
});

/* ══ 8. СОПЕРНИКИ НА ТЕЛЕФОНЕ — ДВА СТОЛБЦА ════════════════════════════ */

test('соперники на телефоне стоят рядом, а не лентой', async ({ page }) => {
    await открыть(page, ВЫЗОВ + '?id=b1', '.ch-vs-container');
    const с = await page.evaluate(() => {
        const к = document.querySelector('.ch-vs-container');
        const б = document.querySelector('.ch-players');
        return { направление: getComputedStyle(к).flexDirection,
                 высота: Math.round(б.getBoundingClientRect().height),
                 окно: window.innerWidth, экран: window.innerHeight,
                 перелив: document.documentElement.scrollWidth > window.innerWidth + 1 };
    });
    expect(с.перелив, 'страница вызова переливается по ширине').toBe(false);
    if (с.окно <= 640) {
        expect(с.направление, 'на телефоне соперники идут лентой').toBe('row');
        /* Замер 13.10: блок занимал 927 при экране 844 — две высоты экрана
           на вопрос «кто с кем». */
        expect(с.высота, 'блок соперников выше экрана: ' + JSON.stringify(с))
            .toBeLessThan(с.экран);
    }
});

/* ══ 9. ПОБЕДИТЕЛЯ НЕ НАЗЫВАЮТ, ЕСЛИ СТОРОНА НЕИЗВЕСТНА ════════════════ */

test('баттл с гостем не называет победителя из пустоты', async ({ page }) => {
    const гость = публичный({
        status: 'completed', voting_closed: true, match_id: 'm1',
        proposed_date: дата(ВЧЕРА), proposed_time: время(ВЧЕРА),
        challenger_player_id: null, challenger_name: 'Сергей Приглашённый-Гость',
        challenger_name_en: 'Sergey Invited-Guest', challenger_name_kg: 'Сергей Приглашённый-Гость',
        challenger_wins: null, challenger_losses: null, challenger_points: null
    });
    await подменить(page, гость);
    /* Матч есть, а победитель в нём не указан: у гостя строки в players нет,
       и указывать не на кого. */
    await page.route('**/rest/v1/matches*', r => r.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify([{ id: 'm1', player1_id: null, player2_id: 'p2',
                                winner_id: null, score: '6/4 3/6 7/6(11-9)' }]) }));
    await page.goto(ВЫЗОВ + '?id=b1');
    await page.waitForFunction(() => document.querySelector('.ch-battle-title') !== null,
        null, { timeout: 15000 }).catch(() => {
        throw new Error('ПОРОГ: страница вызова не отрисовалась'); });
    await page.waitForTimeout(600);

    const р = await page.evaluate(() => ({
        победитель: (document.querySelector('.ch-winner-badge') || {}).textContent || '',
        точность: (document.querySelector('.ch-prediction-result') || {}).textContent || '',
        счётЕсть: !!document.querySelector('.ch-score-inner')
    }));
    /* До 13.10 здесь писалось «Победитель: Сергей Приглашённый-Гость» — из
       сравнения двух пустых значений, при любом исходе матча. */
    expect(р.победитель, 'победитель назван, хотя сторона неизвестна').toBe('');
    expect(р.точность, 'точность прогноза посчитана без победителя').toBe('');
});

/* ══ 10. КРАСКА ПО ФАКТУ ════════════════════════════════════════════════ */

test('подписи обеих страниц проходят по контрасту', async ({ page }) => {
    await открыть(page, ОБЗОР, '.bo-strip-sub');
    const к = await page.evaluate(() => {
        const раз = c => { const m = c.match(/[\d.]+/g) || [];
            return { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] }; };
        const сл = (п, ф) => ({ r: п.r * п.a + ф.r * (1 - п.a), g: п.g * п.a + ф.g * (1 - п.a),
                                b: п.b * п.a + ф.b * (1 - п.a) });
        const яр = c => { const k = ['r', 'g', 'b'].map(x => { const v = c[x] / 255;
            return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
            return 0.2126 * k[0] + 0.7152 * k[1] + 0.0722 * k[2]; };
        const фон = э => { let n = э; while (n && n !== document.documentElement) {
            const b = раз(getComputedStyle(n).backgroundColor);
            if (b.a > 0.999) return b; n = n.parentElement; } return { r: 10, g: 10, b: 10, a: 1 }; };
        const пара = сел => { const э = document.querySelector(сел); if (!э) return null;
            const t = раз(getComputedStyle(э).color), b = фон(э), s = сл(t, b);
            const L1 = яр(s) + 0.05, L2 = яр(b) + 0.05;
            return Math.round(Math.max(L1, L2) / Math.min(L1, L2) * 100) / 100; };
        return { подписьПолосы: пара('.bo-strip-sub'), всегоГолосов: пара('.bo-total-votes') };
    });
    expect(к.подписьПолосы, 'ПОРОГ: подписи полосы нет').not.toBeNull();
    /* 3.21 до правки — мерено по фактической краске 13.10. */
    expect(к.подписьПолосы, 'подпись полосы ниже 4.5').toBeGreaterThanOrEqual(4.5);
    if (к.всегоГолосов) expect(к.всегоГолосов, 'счётчик голосов ниже 4.5').toBeGreaterThanOrEqual(4.5);
});
