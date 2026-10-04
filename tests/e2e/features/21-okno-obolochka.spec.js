// @ts-check
const { test, expect } = require('../../fixtures');

/**
 * TC-OKNO: оболочка окна админки.
 *
 * Окно создавали в двенадцати местах: три сборщика в `utils.js` и девять
 * рукодельных в разделах. Замер 04.10: `role="dialog"` и фокус были ровно
 * у ОДНОГО из двенадцати, Esc — у двух, ловушки фокуса и возврата фокуса
 * не было ни у одного, включая сборщик.
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ: заморозка читает файл как текст —
 * она видит, что в коде написано `role="dialog"`, и не видит, доехало ли
 * это до разметки, забрался ли фокус внутрь, держит ли Tab и куда фокус
 * вернулся после Esc. Это работа прогона.
 *
 * ДВА ПУТИ, А НЕ ОДИН. Окно приходит либо из сборщика (`showConfirm`,
 * 60 вызовов), либо из раздела со своей готовой разметкой (девять окон).
 * Это РАЗНЫЕ ветки оболочки: у второй атрибуты и подпись доставляются
 * уже после вставки. Прибор, померивший один случай, не знает другого —
 * поэтому проверяются оба.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ. «Отклонить» и «Заменить» только ОТКРЫВАЮТ окно:
 * запись живёт в обработчике согласия, и согласия тест не даёт.
 */

test.use({ storageState: require('../../auth-setup').adminState });

/* Админка — десктоп и планшет; телефоном её не ведут. Доступность окна
   от ширины не зависит, но ловушка фокуса на узком виде ловит другое
   число элементов, поэтому виды два, а не один. */
const ВИДЫ = [
    { имя: 'Десктоп 1512', w: 1512, h: 900 },
    { имя: 'Планшет 768',  w: 768,  h: 1024 }
];

const ТУРНИР = 'test-zayavki';

async function открытьЗаявки(page) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));

    await page.goto('/pages/admin.html#tournaments/edit/' + ТУРНИР);
    try {
        await page.locator('#adTrnCat').waitFor({ state: 'visible', timeout: 20000 });
    } catch (e) {
        throw new Error('турнир не открылся. Адрес: ' + page.url() +
            ' · ошибки страницы: ' + (ошибки.length ? ошибки.join(' | ') : 'нет'));
    }
    await page.click('[data-trn-nav="regs"]');
    await page.locator('.ad-reg-check').first().waitFor({ timeout: 20000 });
}

/** Снять с ОТКРЫТОГО окна всё, что проверяет этот файл. */
function снятьОкно(page) {
    return page.evaluate(() => {
        const м = document.querySelector('.ad-confirm-modal');
        if (!м) return { беда: 'окна нет' };
        const по = м.getAttribute('aria-labelledby');
        const ч = x => Math.round(x * 100) / 100;
        return {
            роль: м.getAttribute('role'),
            модально: м.getAttribute('aria-modal'),
            подписьID: по,
            подписьНайдена: !!(по && document.getElementById(по)),
            подписейСЭтимID: по ? document.querySelectorAll('[id="' + по + '"]').length : 0,
            фокусВнутри: м.contains(document.activeElement),
            высота: ч(м.getBoundingClientRect().height),
            предел: getComputedStyle(м).maxHeight,
            телоПрокрутка: (() => {
                const т = м.querySelector('.ad-confirm-text');
                return т ? т.scrollHeight > т.clientHeight + 1 : 'тела нет';
            })(),
            кнопкиВидны: [...м.querySelectorAll('.ad-confirm-actions button')]
                .every(б => б.getBoundingClientRect().bottom <= window.innerHeight + 1)
        };
    });
}

/**
 * Ловушка фокуса: сколько ни жми Tab, фокус остаётся в окне.
 *
 * ЖМЁМ БОЛЬШЕ РАЗ, ЧЕМ В ОКНЕ ЭЛЕМЕНТОВ. Иначе проверка пройдёт вхолостую
 * на окне из двух кнопок: по кругу внутри окна Tab ходит и без ловушки —
 * уходит он на ДЕСЯТОМ нажатии, когда кончились свои.
 */
async function ловушкаДержит(page, сколько) {
    for (let i = 0; i < сколько; i++) {
        await page.keyboard.press('Tab');
        const внутри = await page.evaluate(() => {
            const м = document.querySelector('.ad-confirm-modal');
            return м ? м.contains(document.activeElement) : 'окно исчезло';
        });
        if (внутри !== true) return { держит: false, нажатие: i + 1, где: внутри };
    }
    return { держит: true };
}

for (const вид of ВИДЫ) {
    test.describe(`Оболочка окна — ${вид.имя}`, () => {
        test.use({ viewport: { width: вид.w, height: вид.h } });

        /* Виды заданы внутри файла, значит проект нужен один: иначе конфиг
           прогонит те же виды пятикратно. Пропуск живёт в beforeEach — у
           test.skip(callback) второго довода нет. */
        test.beforeEach(({}, инфо) => {
            инфо.skip(инфо.project.name !== 'desktop',
                      'виды заданы внутри файла — проект берём один');
        });

        test(`${вид.имя}: окно из сборщика называет себя и берёт фокус`, async ({ page }) => {
            await открытьЗаявки(page);
            await page.locator('.ad-reg-menu-btn').first().click();
            await page.locator('.ad-reg-menu.open .ad-btn-reject').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });

            const о = await снятьОкно(page);
            expect(о.беда, String(о.беда)).toBeUndefined();
            expect(о.роль).toBe('dialog');
            expect(о.модально).toBe('true');
            expect(о.подписьНайдена, 'aria-labelledby ведёт в пустоту: ' + о.подписьID).toBe(true);
            // ОДНО ОПРЕДЕЛЕНИЕ НА ОДНО ПОНЯТИЕ: подпись окна уникальна,
            // иначе диктор прочитает заголовок прошлого окна
            expect(о.подписейСЭтимID).toBe(1);
            expect(о.фокусВнутри, 'фокус остался на странице за окном').toBe(true);
            expect(о.кнопкиВидны, 'кнопки окна уехали за край экрана').toBe(true);

            await page.keyboard.press('Escape');
            await page.locator('.ad-confirm-modal').waitFor({ state: 'detached', timeout: 5000 });
        });

        test(`${вид.имя}: окно раздела со своей разметкой — тоже`, async ({ page }) => {
            await открытьЗаявки(page);

            /* ВТОРАЯ ВЕТКА ОБОЛОЧКИ. «Заменить» — рукодельное окно: его
               разметку пишет раздел, а `role`, подпись и фокус доставляет
               оболочка уже после вставки. До 04.10 у него не было ничего
               из этого. В базу кнопка не пишет — открывает окно выбора. */
            await page.locator('.ad-btn-replace').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });

            const о = await снятьОкно(page);
            expect(о.беда, String(о.беда)).toBeUndefined();
            expect(о.роль).toBe('dialog');
            expect(о.модально).toBe('true');
            expect(о.подписьНайдена,
                'готовой разметке не доставили подпись: ' + о.подписьID).toBe(true);
            expect(о.фокусВнутри).toBe(true);

            await page.keyboard.press('Escape');
            await page.locator('.ad-confirm-modal').waitFor({ state: 'detached', timeout: 5000 });
        });

        test(`${вид.имя}: Tab не уходит из окна на страницу под ним`, async ({ page }) => {
            await открытьЗаявки(page);
            await page.locator('.ad-reg-menu-btn').first().click();
            await page.locator('.ad-reg-menu.open .ad-btn-reject').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });

            /* Под окном лежит вся страница с кнопками, которые меняют
               данные: слепой обход по ней из открытого окна — это
               нажатие вслепую. */
            const итог = await ловушкаДержит(page, 12);
            expect(итог.держит,
                'фокус ушёл из окна на ' + итог.нажатие + '-м Tab, оказался тут: ' + итог.где)
                .toBe(true);

            await page.keyboard.press('Escape');
        });

        test(`${вид.имя}: после закрытия фокус возвращается, а не падает на body`, async ({ page }) => {
            await открытьЗаявки(page);

            /* ДВА СЛУЧАЯ ВОЗВРАТА, И ОНИ РАЗНЫЕ.
               1) Звавшая кнопка осталась на экране — фокус её же.
               2) Звавшая кнопка лежала в меню, меню закрылось вместе с
                  окном: кнопка ЕСТЬ в разметке, но невидима, и `focus()`
                  на ней не делает ничего. Запасной — видимый заголовок
                  раздела. Замер 04.10 нашёл это, когда фокус уехал на
                  `body` и обход страницы начинался с начала. */
            await page.locator('.ad-btn-replace').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });
            await page.keyboard.press('Escape');
            await page.locator('.ad-confirm-modal').waitFor({ state: 'detached', timeout: 5000 });
            const первый = await page.evaluate(() => ({
                таЖеКнопка: !!(document.activeElement &&
                    document.activeElement.classList.contains('ad-btn-replace')),
                где: document.activeElement
                    ? (document.activeElement.className || document.activeElement.tagName) : 'нет'
            }));
            expect(первый.таЖеКнопка,
                'фокус не вернулся на звавшую кнопку, он тут: ' + первый.где).toBe(true);

            await page.locator('.ad-reg-menu-btn').first().click();
            await page.locator('.ad-reg-menu.open .ad-btn-reject').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });
            await page.keyboard.press('Escape');
            await page.locator('.ad-confirm-modal').waitFor({ state: 'detached', timeout: 5000 });
            const второй = await page.evaluate(() => ({
                заголовокРаздела: !!(document.activeElement &&
                    document.activeElement.classList.contains('ad-section-title')),
                где: document.activeElement
                    ? (document.activeElement.className || document.activeElement.tagName) : 'нет'
            }));
            expect(второй.заголовокРаздела,
                'звавший спрятался — фокус должен был уйти на заголовок раздела, а он тут: ' +
                второй.где).toBe(true);
        });

        test(`${вид.имя}: окно не рвёт экран — предел высоты и прокрутка тела`, async ({ page }) => {
            await открытьЗаявки(page);
            await page.locator('.ad-btn-replace').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });

            const о = await снятьОкно(page);
            /* ЗАМОРАЖИВАЕТСЯ ОТНОШЕНИЕ, А НЕ ЧИСЛО: окно не выше экрана, и
               кнопки видны. 90vh — это как, а важно что. */
            expect(о.высота,
                'окно ' + о.высота + ' при экране ' + вид.h).toBeLessThanOrEqual(вид.h);
            expect(о.кнопкиВидны, 'кнопки окна уехали за край').toBe(true);
            expect(о.предел, 'предел высоты снят').not.toBe('none');

            await page.keyboard.press('Escape');
        });

        test(`${вид.имя}: база не тронута — строки на месте`, async ({ page }) => {
            await открытьЗаявки(page);
            const было = await page.locator('.ad-reg-check').count();

            await page.locator('.ad-reg-menu-btn').first().click();
            await page.locator('.ad-reg-menu.open .ad-btn-reject').first().click();
            await page.locator('.ad-confirm-modal').waitFor({ state: 'visible', timeout: 5000 });
            await page.keyboard.press('Escape');
            await page.locator('.ad-confirm-modal').waitFor({ state: 'detached', timeout: 5000 });

            /* Проверка на холостой ход: строки должны БЫТЬ, иначе
               «ничего не изменилось» верно и при пустой таблице. */
            expect(было).toBeGreaterThan(0);
            expect(await page.locator('.ad-reg-check').count()).toBe(было);
        });
    });
}
