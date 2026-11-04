// @ts-check
const { test, expect } = require('../../fixtures');
const подстава = require('../../podstava-bezopasnosti');

/**
 * TC-1.2: ЖАЛОБА И БЛОКИРОВКА — ТРЕБОВАНИЕ APPLE 1.2 ЦЕЛИКОМ.
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож
 * `tools/check-zhaloby-i-blokirovki.js` читает файлы: он видит, что
 * функции заведены, права сняты с `anon`, триггеры стоят, кнопки держат
 * 44 по css и слова есть на трёх языках. Он НЕ ВИДИТ, что нарисовалось в
 * окне, какая цель нажатия вышла НА САМОМ ДЕЛЕ на каждом виде, что
 * открылось по нажатию, что ушло бы в базу и что человек прочитал в
 * тосте. Это работа прогона.
 *
 * НИ БАЗУ, НИ ФУНКЦИИ ЭТОТ ФАЙЛ НЕ ЗОВЁТ: `window.supabaseClient`
 * подставной (`tests/podstava-bezopasnosti.js`), зовы записываются и
 * сверяются по имени функции и доводам. Кнопку, которая пишет в базу, мы
 * нажимаем здесь безопасно именно поэтому.
 *
 * ПЯТЬ ВИДОВ ДАЮТ ПРОЕКТЫ `playwright.config.js` — файл пишется один раз,
 * а гонится пятью: desktop, tablet, mobile, phone-landscape,
 * tablet-landscape. ВИД МЕРЯЕТСЯ ЗАГРУЗКОЙ НА НУЖНОЙ ШИРИНЕ, а не
 * сжатием уже загруженного: каждый проект открывает страницу заново.
 *
 * ТРИ ЯЗЫКА — тремя адресами на сайте и `I18N.set` в приложении.
 *
 * ПРОБА ЖДЁТ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: на сайте это
 * `document.body.dataset.ksltVid === 'profil'` (признак «страница
 * дорисована», `js/player.js:734`), в приложении — появление кнопок
 * безопасности в доме.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/player.html' },
    { язык: 'en', адрес: '/pages/player-en.html' },
    { язык: 'kg', адрес: '/pages/player-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

/* ЦЕЛЬ НАЖАТИЯ — 44. Число из шкалы кнопок 28 · 36 · 44 · 52, и 44 —
   та ступень, ниже которой палец промахивается. Меряется ПО ОКНУ, а не
   по css: css могут перебить соседи. */
const ЦЕЛЬ = 44;

/* ── САЙТ ──────────────────────────────────────────────────────────── */

async function открытьСайт(page, адрес, кого, о) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await подстава.поставить(page.context(), о);
    await page.goto(адрес + '?id=' + encodeURIComponent(кого),
        { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => document.body.dataset.ksltVid === 'profil' ||
              document.body.dataset.ksltVid === 'profil-s-bedoy',
        null, { timeout: 20000 });
    /* МЕТКА ЖИЗНИ ОКНА. Перезагрузка её сотрёт — и ровно это доказывает,
       что страница ПЕРЕРИСОВАНА, а не перезагружена. 04.11 на сайте
       стояло `location.reload()`, и тост о числе отменённых матчей не
       доживал до глаз. */
    await page.evaluate(() => { window.__жив = 1; });
    return ошибки;
}

test.describe('Жалоба и блокировка · сайт', () => {

    for (const с of СТРАНИЦЫ) {

        test('полоса безопасности и цель нажатия · ' + с.язык, async ({ page }) => {
            const ошибки = await открытьСайт(page, с.адрес, подстава.ОН.игрок);

            const полоса = page.locator('.pp-safety');
            await expect(полоса, 'полоса безопасности на чужой карточке').toHaveCount(1);

            const кнопки = page.locator('.pp-safety-btn');
            await expect(кнопки, 'две кнопки: жалоба и блокировка').toHaveCount(2);

            const размеры = await кнопки.evaluateAll(
                сп => сп.map(э => {
                    const п = э.getBoundingClientRect();
                    return { текст: (э.textContent || '').trim(), в: п.height, ш: п.width };
                }));
            for (const р of размеры) {
                expect(р.текст, 'у кнопки есть слово, а не пустота').not.toBe('');
                expect(р.в, 'высота цели нажатия «' + р.текст + '»').toBeGreaterThanOrEqual(ЦЕЛЬ);
                expect(р.ш, 'ширина цели нажатия «' + р.текст + '»').toBeGreaterThanOrEqual(ЦЕЛЬ);
            }
            expect(ошибки, 'страница без ошибок').toEqual([]);
        });

        test('на своей карточке кнопок нет · ' + с.язык, async ({ page }) => {
            /* САМОГО СЕБЯ НЕ БЛОКИРУЮТ И НЕ ЖАЛУЮТСЯ: полосы быть не
               должно вовсе, а не «кнопки неактивны». */
            await открытьСайт(page, с.адрес, подстава.Я.игрок);
            await expect(page.locator('.pp-safety'),
                'на своей карточке полосы безопасности нет').toHaveCount(0);
        });

        test('окно жалобы: пять причин, заметка, срок · ' + с.язык, async ({ page }) => {
            await открытьСайт(page, с.адрес, подстава.ОН.игрок);

            /* МОДАЛКА ИЩЕТСЯ НАЖАТИЕМ — в списке элементов её нет. */
            await page.locator('#ppReportBtn').click();

            const окно = page.locator('.h2h-overlay[role="dialog"]');
            await expect(окно, 'окно жалобы открылось').toHaveCount(1);
            await expect(окно, 'окно объявлено модальным диктору')
                .toHaveAttribute('aria-modal', 'true');

            await expect(page.locator('.pp-rep-reason'), 'пять причин').toHaveCount(5);
            await expect(page.locator('input[name="kslt-prichina"]:checked'),
                'одна причина выбрана заранее — пустая отправка невозможна').toHaveCount(1);
            await expect(page.locator('#ppRepNote'), 'поле заметки').toHaveCount(1);
            await expect(page.locator('.pp-rep-srok'), 'срок ответа назван').toHaveCount(1);

            const слова = await page.locator('.pp-rep-reason span:last-child')
                .evaluateAll(сп => сп.map(э => (э.textContent || '').trim()));
            for (const сл of слова) expect(сл, 'причина со словом, а не с кодом').not.toBe('');

            /* ESC ЗАКРЫВАЕТ — запирание фокуса стоит общим домом. */
            await page.keyboard.press('Escape');
            await expect(page.locator('.h2h-overlay'), 'Esc закрывает окно').toHaveCount(0);
        });

        test('жалоба уходит с причиной и заметкой · ' + с.язык, async ({ page }) => {
            await открытьСайт(page, с.адрес, подстава.ОН.игрок);
            await page.locator('#ppReportBtn').click();

            /* ПРИЧИНА ВЫБИРАЕТСЯ НАЖАТИЕМ ПО СТРОКЕ, А НЕ ПО РАДИОКНОПКЕ.
               04.11, найдено прогоном: сама радиокнопка скрыта — её место
               занимает нарисованная галочка (`.pp-rep-tick`), и `.check()`
               ждал видимости того, чего человек не видит и не нажимает.
               Нажимаем ровно то, что нажимает человек. */
            await page.locator('.pp-rep-reason:has(input[value="fake"])').click();
            await expect(page.locator('input[name="kslt-prichina"][value="fake"]'),
                'выбор причины встал').toBeChecked();
            await page.locator('#ppRepNote').fill('не его фотография');
            await page.locator('.pp-rep-send').click();

            await expect(page.locator('.h2h-overlay'), 'окно закрылось после отправки')
                .toHaveCount(0);

            const зов = await page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_pozhalovatsya').pop());
            expect(зов, 'жалоба ушла серверной функцией').toBeTruthy();
            expect(зов.доводы, 'доводы жалобы — ровно те, что ждёт база').toEqual({
                p_target_kind: 'player',
                p_target: подстава.ОН.игрок,
                p_reason: 'fake',
                p_note: 'не его фотография'
            });

            await expect(page.locator('.kslt-toast-text'), 'человеку сказали вслух')
                .toHaveCount(1);
        });

        test('окно блокировки говорит, что будет и что останется · ' + с.язык, async ({ page }) => {
            await открытьСайт(page, с.адрес, подстава.ОН.игрок);
            await page.locator('#ppBlockBtn').click();

            await expect(page.locator('.pp-blk-what li'),
                'шесть последствий названы по одному').toHaveCount(6);
            await expect(page.locator('.pp-blk-keep'),
                'сказано и то, что НЕ пропадёт').toHaveCount(1);
            await expect(page.locator('.pp-blk-do'), 'кнопка «заблокировать»').toHaveCount(1);
            await expect(page.locator('.pp-blk-cancel'), 'кнопка «отмена»').toHaveCount(1);

            await page.locator('.pp-blk-cancel').click();
            await expect(page.locator('.h2h-overlay'), 'отмена закрывает окно').toHaveCount(0);

            const зовы = await page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_zablokirovat').length);
            expect(зовы, 'отмена НИЧЕГО не пишет в базу').toBe(0);
        });

        test('блокировка: число отменённых матчей и парный — вслух · ' + с.язык, async ({ page }) => {
            await открытьСайт(page, с.адрес, подстава.ОН.игрок);
            await page.locator('#ppBlockBtn').click();
            await page.locator('.pp-blk-do').click();

            const зов = await page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_zablokirovat').pop());
            expect(зов.доводы, 'блокировка идёт по карточке игрока')
                .toEqual({ p_player_id: подстава.ОН.игрок });

            const тост = page.locator('.kslt-toast-text');
            await expect(тост, 'сказано вслух').toHaveCount(1);
            const текст = (await тост.textContent()) || '';
            /* ЧИСЛО ОТМЕНЁННЫХ — В САМОЙ ФРАЗЕ. Подстава отдаёт два
               одиночных и один парный. */
            expect(текст, 'в тосте стоит число снятых матчей').toContain('2');
            expect(текст.length, 'про парный сказано отдельной фразой, а не опущено')
                .toBeGreaterThan(String(подстава.данные().отмена.otmeneno).length + 10);

            /* ТА САМАЯ БЕДА 04.11: перезагрузка съедала этот тост. */
            expect(await page.evaluate(() => window.__жив),
                'страница ПЕРЕРИСОВАНА, а не перезагружена — иначе тост не доживёт')
                .toBe(1);

            await expect(page.locator('#ppBlockBtn'), 'кнопка осталась на месте')
                .toHaveCount(1);
        });

        test('у заблокированного кнопка предлагает снять блокировку · ' + с.язык,
            async ({ page }) => {
                await открытьСайт(page, с.адрес, подстава.ОН.игрок, { заблокирован: true });

                const кнопка = page.locator('#ppBlockBtn');
                await expect(кнопка, 'кнопка блокировки на месте').toHaveCount(1);
                const слово = ((await кнопка.textContent()) || '').trim();
                expect(слово, 'у заблокированного слово ДРУГОЕ').not.toBe('');

                /* Нажатие у заблокированного снимает блокировку СРАЗУ, без
                   окна: предупреждать не о чем. */
                await кнопка.click();
                await expect
                    .poll(() => page.evaluate(
                        () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_razblokirovat').length))
                    .toBe(1);

                expect(await page.evaluate(() => window.__жив),
                    'снятие тоже перерисовывает, а не перезагружает').toBe(1);
            });

        test('отказ базы не гасит страницу и говорит вслух · ' + с.язык, async ({ page }) => {
            await открытьСайт(page, с.адрес, подстава.ОН.игрок);
            await page.evaluate(() => {
                window.КСЛТ_ОТВЕТ.kslt_zablokirovat = { __отказ: 'сеть упала' };
            });
            await page.locator('#ppBlockBtn').click();
            await page.locator('.pp-blk-do').click();

            await expect(page.locator('.kslt-toast-text'),
                'про отказ сказано вслух, а не в консоль').toHaveCount(1);
            await expect(page.locator('.pp-blk-do'),
                'кнопка вернулась в работу — человек может повторить').toBeEnabled();
        });
    }
});

/* ── ПРИЛОЖЕНИЕ ────────────────────────────────────────────────────── */

/**
 * ДВЕ ЗАНАВЕСКИ ПРИЛОЖЕНИЯ, И СНИМАЮТСЯ ОНИ ПО-РАЗНОМУ.
 *
 * 04.11, НАЙДЕНО ПРОГОНОМ: кнопка «Пожаловаться» была на месте и в доме, и
 * видимой, и нажималась — а нажатие перехватывали два чужих слоя:
 * `#splashOverlay` (заставка, `mobile/www/index.html:16`) и
 * `#onboardingOverlay` (знакомство, `mobile/www/js/app.js:480`). Playwright
 * писал это прямо: «intercepts pointer events» 54 раза подряд.
 *
 * МЕТКИ В `localStorage` НЕ ХВАТИЛО. Подстава ставит
 * `kslt_onboarding_done` до загрузки, но на это полагаться нельзя: окно
 * пробы чистое, порядок выполнения чужой, и знакомство всё равно успевало
 * открыться. ЗАНАВЕСКА СНИМАЕТСЯ ТАК ЖЕ, КАК ЕЁ СНИМАЕТ ЧЕЛОВЕК —
 * нажатием «Пропустить» (`#onbSkip`, `app.js:533` ставит ту же метку).
 * Заставка уходит сама, её просто ждём.
 */
async function убратьЗанавески(page) {
    /* Заставка уходит сама — ждём, а не торопим. */
    await page.locator('#splashOverlay')
        .waitFor({ state: 'hidden', timeout: 15000 })
        .catch(() => {});

    /* Знакомство может не появиться вовсе — тогда снимать нечего. */
    const знакомство = page.locator('#onboardingOverlay');
    if (await знакомство.count()) {
        await page.locator('#onbSkip').click({ timeout: 5000 }).catch(() => {});
        await знакомство.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
    }
}

async function открытьПрил(page, язык, кого, о) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await подстава.поставить(page.context(), о);
    await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
        () => window.KSLT_PLAYER_DETAIL &&
              typeof window.KSLT_PLAYER_DETAIL.open === 'function' &&
              window.KSLT_I18N,
        null, { timeout: 20000 });
    await убратьЗанавески(page);
    /* ЯЗЫК СТАВИТСЯ `setLang`, А НЕ `set`. 04.11 замерено: `set` у дома
       слов нет вовсе (`mobile/www/js/i18n.js:1060`), и проба, зовущая его
       под защитой `if`, молча гоняет один язык трижды. */
    await page.evaluate(({ язык, кого }) => {
        if (typeof window.KSLT_I18N.setLang !== 'function') {
            throw new Error('у дома слов нет setLang — проба проверяла бы один язык трижды');
        }
        window.KSLT_I18N.setLang(язык);
        window.KSLT_PLAYER_DETAIL.open(кого);
        window.__жив = 1;
    }, { язык, кого });
    await page.locator('#pdReportBtn, #pdBlockBtn').first()
        .waitFor({ state: 'attached', timeout: 20000 })
        .catch(() => {});
    return ошибки;
}

test.describe('Жалоба и блокировка · приложение', () => {

    for (const язык of ['ru', 'en', 'kg']) {

        test('полоса безопасности и цель нажатия · ' + язык, async ({ page }) => {
            const ошибки = await открытьПрил(page, язык, подстава.ОН.игрок);

            await expect(page.locator('.pd-safety-row'), 'полоса безопасности')
                .toHaveCount(1);
            const кнопки = page.locator('.pd-safety-btn');
            await expect(кнопки, 'две кнопки').toHaveCount(2);

            const размеры = await кнопки.evaluateAll(
                сп => сп.map(э => {
                    const п = э.getBoundingClientRect();
                    return { текст: (э.textContent || '').trim(), в: п.height, ш: п.width };
                }));
            for (const р of размеры) {
                expect(р.текст, 'у кнопки есть слово').not.toBe('');
                expect(р.в, 'высота цели «' + р.текст + '»').toBeGreaterThanOrEqual(ЦЕЛЬ);
                expect(р.ш, 'ширина цели «' + р.текст + '»').toBeGreaterThanOrEqual(ЦЕЛЬ);
            }
            expect(ошибки, 'экран без ошибок').toEqual([]);
        });

        test('блокировка говорит число и не перезагружает · ' + язык, async ({ page }) => {
            await открытьПрил(page, язык, подстава.ОН.игрок);
            await page.locator('#pdBlockBtn').click();
            await page.locator('.pd-blk-do').click();

            const зов = await page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_zablokirovat').pop());
            expect(зов.доводы).toEqual({ p_player_id: подстава.ОН.игрок });

            const текст = (await page.locator('.toast').textContent()) || '';
            expect(текст, 'число снятых матчей в самой фразе').toContain('2');
            expect(await page.evaluate(() => window.__жив),
                'экран перерисован, а не перезагружен').toBe(1);
        });

        test('жалоба уходит с причиной · ' + язык, async ({ page }) => {
            await открытьПрил(page, язык, подстава.ОН.игрок);
            await page.locator('#pdReportBtn').click();
            await expect(page.locator('.pd-rep-reason'), 'пять причин').toHaveCount(5);
            await page.locator('.pd-rep-send').click();

            const зов = await page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_pozhalovatsya').pop());
            expect(зов, 'жалоба ушла').toBeTruthy();
            expect(зов.доводы.p_target_kind).toBe('player');
            expect(зов.доводы.p_target).toBe(подстава.ОН.игрок);
            expect(зов.доводы.p_reason, 'причина выбрана заранее, а не пуста').not.toBe('');
        });
    }

    /* ЭКРАН «ЗАБЛОКИРОВАННЫЕ» ОТКРЫВАЕТСЯ НАЖАТИЕМ, А НЕ ЗОВОМ.
       `showBlocked` — своя функция экрана кабинета, снаружи её нет
       (`mobile/www/js/screens/profile.js:2035`), и это правильно: окно
       ищется нажатием по ряду, как его открывает человек. */
    async function открытьКабинет(page, о) {
        await подстава.поставить(page.context(), о);
        await page.goto(ПРИЛОЖЕНИЕ, { waitUntil: 'domcontentloaded' });
        await page.waitForFunction(
            () => window.KSLT_PROFILE && typeof window.KSLT_PROFILE.load === 'function',
            null, { timeout: 20000 });
        await убратьЗанавески(page);

        /* ЭКРАН ОТКРЫВАЕТСЯ НАЖАТИЕМ ПО НИЖНЕЙ ПОЛОСЕ, А НЕ ЗОВОМ ЗАГРУЗКИ.
           04.11, найдено прогоном: `KSLT_PROFILE.load()` тянет данные, но
           экран остаётся спрятанным — ряд «Заблокированные» лежал в доме и
           был НЕ ВИДИМ, Playwright писал «element is not visible» 53 раза.
           Нажимаем вкладку «Профиль» (`mobile/www/index.html:270`), как
           человек. ЕСТЬ В ДОМЕ — ЕЩЁ НЕ ЗНАЧИТ ПОКАЗАНО. */
        await page.locator('.tab-item[data-screen="screenProfile"]').click();
        await page.locator('#profBlockedRow')
            .waitFor({ state: 'visible', timeout: 20000 });
        await page.locator('#profBlockedRow').click();
    }

    test('список заблокированных: строки, дата и снятие', async ({ page }) => {
        await открытьКабинет(page);

        await expect(page.locator('.prof-blk-row'), 'две записи из подставы')
            .toHaveCount(2);

        const имена = await page.locator('.prof-blk-name')
            .evaluateAll(сп => сп.map(э => (э.textContent || '').trim()));
        for (const и of имена) expect(и, 'у записи есть имя, а не код').not.toBe('');

        const даты = await page.locator('.prof-blk-date')
            .evaluateAll(сп => сп.map(э => (э.textContent || '').trim()));
        for (const д of даты) expect(д, 'у записи есть дата').not.toBe('');

        await page.locator('.prof-blk-off').first().click();
        await expect
            .poll(() => page.evaluate(
                () => window.КСЛТ_ЗОВЫ.filter(з => з.имя === 'kslt_razblokirovat').length))
            .toBe(1);
    });

    test('пустой список заблокированных — тоже вид, и у него есть надпись', async ({ page }) => {
        await открытьКабинет(page, { блокировки: [] });

        await expect(page.locator('.prof-blk-row'), 'записей нет').toHaveCount(0);
        const пусто = page.locator('.pd-empty-title');
        await expect(пусто, 'надпись на пустой список').toHaveCount(1);
        expect(((await пусто.textContent()) || '').trim(),
            'надпись не пустая').not.toBe('');
    });
});
