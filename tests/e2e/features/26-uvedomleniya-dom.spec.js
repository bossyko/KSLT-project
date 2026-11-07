// @ts-check
const { test, expect } = require('../../fixtures');
const fs = require('fs');
const path = require('path');

/* ПРАВИЛО СЕРВЕРА ЧИТАЕТСЯ ИЗ ЖИВОГО КОДА, А НЕ ПЕРЕПИСЫВАЕТСЯ СЮДА
   (07.11). Прежде оно было переписано в этом файле «знак в знак» — и
   стало ТРЕТЬЕЙ копией одного понятия: 07.11 умолчание перевернули
   (политика требует согласия на отправку на контактные данные, ст. 44),
   и проба упала бы на починенном продукте, называя бедой правильное.
   ПРОБА, ДЕРЖАЩАЯ ФОРМУ ПРАВИЛА, ПЕРЕЖИВАЕТ РЕШЕНИЕ, КОТОРОЕ ЕЮ
   ВЫРАЖЕНО. Теперь тело берётся из `supabase/functions/<функция>/index.ts`
   (звёздочку с косой чертой внутри блочного примечания писать нельзя —
   она его закрывает, и файл ломается; ловлю это второй раз), и
   сверка сама поедет за сервером. */
function телоСервера() {
    const д = path.join(__dirname, '..', '..', '..', 'supabase', 'functions');
    for (const ф of fs.readdirSync(д)) {
        const п = path.join(д, ф, 'index.ts');
        if (!fs.existsSync(п)) continue;
        const т = fs.readFileSync(п, 'utf8');
        const и = т.indexOf('function shouldNotify');
        if (и < 0) continue;
        let г = 0, к = т.indexOf('{', и);
        for (; к < т.length; к++) { if (т[к] === '{') г++; if (т[к] === '}') { г--; if (!г) break; } }
        const тело = т.slice(т.indexOf('{', и), к + 1);
        /* Сигнатура с типами заменяется на чистую: внутри тела
           TypeScript-аннотаций нет, проверено чтением. */
        return 'function (prefs, channel, cat) ' + тело;
    }
    throw new Error('серверное правило shouldNotify не найдено в supabase/functions');
}
const КОД_СЕРВЕРА = телоСервера();

/**
 * TC-UVED-DOM: настройки уведомлений — экран не расходится с сервером
 * (кусок A2.3).
 *
 * ЧТО ЗАМОРОЖЕНО ПРАВИЛАМИ, А ЧТО ЗДЕСЬ. Сторож читает файлы как текст:
 * он видит, что имена каналов в доме совпадают с теми, что спрашивает
 * серверный код, и не видит, доехал ли дом до страницы и что отдаёт
 * живое правило. Это работа прогона.
 *
 * БАЗУ ТЕСТ НЕ ПИШЕТ: ни один ползунок не нажимается. Правило и списки
 * спрашиваются у живого дома напрямую.
 *
 * ЧТО ИМЕННО ДОКАЗЫВАЕТСЯ — ТРИ БЕДЫ, ЖИВШИЕ В ПРОДУКТЕ:
 *   1. на сайте был канал `site`, которого не спрашивает ни одна из
 *      шестнадцати серверных функций: человек выключал — и ничего не
 *      менялось;
 *   2. разделов на экране было четыре против шести серверных —
 *      `security` (письма о входе с нового устройства) и `general`
 *      нельзя было выключить вовсе;
 *   3. приложение писало в таблицу `notification_preferences`, которой
 *      в базе нет ни в одной схеме, своими именами каналов и разделов.
 *
 * ПРАВИЛО СВЕРЯЕТСЯ С СЕРВЕРНЫМ: `shouldNotify` переписан здесь знак в
 * знак с `supabase/functions/<функция>/index.ts` и прогоняется по всей решётке
 * случаев. Разойдись дом — экран показывал бы одно, а сервер делал
 * другое, и прав всегда сервер.
 */

const СТРАНИЦЫ = [
    { язык: 'ru', адрес: '/pages/dashboard.html' },
    { язык: 'en', адрес: '/pages/dashboard-en.html' },
    { язык: 'kg', адрес: '/pages/dashboard-kg.html' }
];

const ПРИЛОЖЕНИЕ = '/mobile/www/index.html';

async function дождатьсяДома(page, адрес) {
    const ошибки = [];
    page.on('pageerror', e => ошибки.push(String(e.message || e)));
    await page.goto(адрес, { waitUntil: 'domcontentloaded' });
    try {
        await page.waitForFunction(
            () => window.KSLT_UVEDOMLENIYA &&
                  typeof window.KSLT_UVEDOMLENIYA.включено === 'function',
            null, { timeout: 20000 });
    } catch (e) {
        throw new Error('дом уведомлений не объявился на ' + адрес +
            ' · ошибки страницы: ' + (ошибки.length ? ошибки.join(' | ') : 'нет'));
    }
    return ошибки;
}

function снятьДом(page) {
    return page.evaluate((кодСервера) => {
        const U = window.KSLT_UVEDOMLENIYA;

        /* ПРАВИЛО СЕРВЕРА — РОВНО ТО, ЧТО ЛЕЖИТ В `supabase/functions`:
           текст прочитан прогоном и внесён сюда целиком, а не пересказан. */
        const серверное = new Function('return ' + кодСервера)();

        const настройки = [null, undefined, {}, { tg: {} },
            { tg: { matches: false } }, { tg: { matches: true } },
            { email: { general: false } },
            { tg: { matches: false }, email: { matches: true } },
            { site: { matches: false } }];
        const каналы = ['tg', 'email', 'site'];
        const разделы = ['tournaments', 'challenges', 'membership', 'matches',
                         'security', 'general', 'чужой'];

        const расхождения = [];
        let сверено = 0;
        for (const н of настройки) {
            for (const к of каналы) {
                for (const р of разделы) {
                    сверено++;
                    if (U.включено(н, к, р) !== серверное(н, к, р)) {
                        расхождения.push(JSON.stringify(н) + ' ' + к + '/' + р);
                    }
                }
            }
        }

        /* `переключить` не должен трогать то, что ему дали. */
        const было = { tg: { matches: false }, email: { general: false } };
        const слепок = JSON.stringify(было);
        const стало = U.переключить(было, 'tg', 'matches', true);

        return {
            каналы: U.КАНАЛЫ.slice(),
            разделы: U.РАЗДЕЛЫ.slice(),
            расхождения, сверено,
            переключение: {
                новое: стало.tg.matches,
                чужойКаналЦел: стало.email.general,
                прежнийСлепокЦел: JSON.stringify(было) === слепок
            },
            изПустоты: U.переключить(null, 'tg', 'security', false),
            прочитать: {
                безПрофиля: U.прочитать(null),
                безСтолбца: U.прочитать({}),
                есть: U.прочитать({ notify_preferences: { tg: { matches: false } } })
            },
            бот: {
                безБота: U.каналДоступен('tg', {}),
                сБотом: U.каналДоступен('tg', { telegram_chat_id: 1 }),
                почтаВсегда: U.каналДоступен('email', {})
            },
            /* СОГЛАСИЕ (07.11): без него сервер молчит на почту и в
               телеграм, значит и включать нечего. Спрашиваем живой дом. */
            согласие: {
                разделыЦели1: U.РАЗДЕЛЫ_ЦЕЛИ_1 ? U.РАЗДЕЛЫ_ЦЕЛИ_1.slice() : null,
                безСогласия: U.разделДоступен ? U.разделДоступен('matches', {}) : null,
                сСогласием: U.разделДоступен ? U.разделДоступен('matches', { consent_notify: true }) : null,
                новостиБезЦели4: U.разделДоступен ? U.разделДоступен('general', { consent_notify: true }) : null,
                новостиСЦелью4: U.разделДоступен ? U.разделДоступен('general', { consent_news: true }) : null,
                безопасностьВсегда: U.разделДоступен ? U.разделДоступен('security', {}) : null
            }
        };
    }, КОД_СЕРВЕРА);
}

function проверить(д) {
    // ТА САМАЯ БЕДА: канала `site` больше нет
    expect(д.каналы, 'каналы — ровно те, что спрашивает сервер').toEqual(['tg', 'email']);
    expect(д.каналы, 'канала `site` в доме нет').not.toContain('site');

    // ТА САМАЯ БЕДА: шесть разделов, а не четыре
    expect(д.разделы.slice().sort(), 'разделы — ровно те, что спрашивает сервер')
        .toEqual(['challenges', 'general', 'matches', 'membership', 'security', 'tournaments']);

    // Правило совпадает с серверным на всей решётке
    expect(д.сверено, 'решётка случаев прогнана целиком').toBe(189);
    expect(д.расхождения, 'правило дома совпадает с серверным').toEqual([]);

    expect(д.переключение.новое).toBe(true);
    expect(д.переключение.чужойКаналЦел, 'чужой канал не затёрт').toBe(false);
    expect(д.переключение.прежнийСлепокЦел, 'прежний слепок цел — его есть куда вернуть').toBe(true);
    expect(д.изПустоты).toEqual({ tg: { security: false } });

    expect(д.прочитать.безПрофиля).toEqual({});
    expect(д.прочитать.безСтолбца).toEqual({});
    expect(д.прочитать.есть).toEqual({ tg: { matches: false } });

    expect(д.бот.безБота, 'без привязанного бота телеграм гасится').toBe(false);
    expect(д.бот.сБотом).toBe(true);
    expect(д.бот.почтаВсегда).toBe(true);

    /* СОГЛАСИЕ — ТА САМАЯ БЕДА 07.11: код слал письма и сообщения людям,
       не давшим ни одного согласия, хотя политика требует согласия на
       направление уведомлений НА КОНТАКТНЫЕ ДАННЫЕ (ст. 44). */
    expect(д.согласие.разделыЦели1, 'дом знает разделы цели 1').not.toBeNull();
    expect(д.согласие.разделыЦели1.slice().sort(), 'цель 1 — четыре служебных раздела')
        .toEqual(['challenges', 'matches', 'membership', 'tournaments']);
    expect(д.согласие.безСогласия, 'без согласия раздел цели 1 недоступен').toBe(false);
    expect(д.согласие.сСогласием, 'с согласием раздел цели 1 доступен').toBe(true);
    expect(д.согласие.новостиБезЦели4, 'новости не открываются согласием цели 1').toBe(false);
    expect(д.согласие.новостиСЦелью4, 'новости открываются согласием цели 4').toBe(true);
    expect(д.согласие.безопасностьВсегда,
        'вход с нового устройства согласия не требует — законный интерес').toBe(true);
}

test.describe('Уведомления — экран не расходится с сервером', () => {

    test.describe('кабинет сайта', () => {
        test.use({ storageState: require('../../auth-setup').playerState });

        for (const с of СТРАНИЦЫ) {
            test('дом доехал до кабинета · ' + с.язык, async ({ page }) => {
                const ошибки = await дождатьсяДома(page, с.адрес);
                проверить(await снятьДом(page));
                expect(ошибки, 'страница без ошибок').toEqual([]);
            });
        }

        test('в таблице настроек два столбца и шесть строк, и нет «На сайте»', async ({ page }) => {
            await дождатьсяДома(page, СТРАНИЦЫ[0].адрес);
            await page.goto(СТРАНИЦЫ[0].адрес + '#settings', { waitUntil: 'domcontentloaded' });
            const таблица = page.locator('.db-notify-table');
            await таблица.waitFor({ timeout: 20000 });
            const снимок = await page.evaluate(() => {
                const т = document.querySelector('.db-notify-table');
                if (!т) return null;
                return {
                    столбцов: т.querySelectorAll('thead th').length,
                    шапки: Array.from(т.querySelectorAll('thead th')).map(э => (э.textContent || '').trim()),
                    строк: т.querySelectorAll('tbody tr').length,
                    имена: Array.from(т.querySelectorAll('tbody .db-notify-name'))
                        .map(э => (э.textContent || '').trim()),
                    ползунков: т.querySelectorAll('input[type=checkbox]').length,
                    разделы: Array.from(т.querySelectorAll('input[type=checkbox]'))
                        .map(э => э.getAttribute('data-cat')),
                    каналы: Array.from(new Set(Array.from(т.querySelectorAll('input[type=checkbox]'))
                        .map(э => э.getAttribute('data-ch')))),
                    /* ЭКРАН СВЕРЯЕТСЯ С ДАННЫМИ, А НЕ С ОЖИДАНИЕМ (07.11):
                       проба не знает, дано ли согласие у этого игрока, и
                       не должна знать. Она берёт согласие из профиля и
                       требует, чтобы ползунки цели 1 были погашены ровно
                       тогда, когда согласия нет. */
                    согласиеВПрофиле: !!(window.ksltProfile && window.ksltProfile.consent_notify),
                    ползунки: Array.from(т.querySelectorAll('input[type=checkbox]'))
                        .map(э => ({
                            канал: э.getAttribute('data-ch'),
                            раздел: э.getAttribute('data-cat'),
                            погашен: э.disabled
                        })),
                    подсказка: !!document.querySelector('.db-notif-hint')
                };
            });
            expect(снимок, 'таблица настроек нарисована').not.toBeNull();
            expect(снимок.столбцов, 'пустая клетка плюс два канала').toBe(3);
            expect(снимок.шапки.join('|'), 'столбца «На сайте» нет')
                .toBe('|Telegram|Email');
            expect(снимок.строк, 'шесть разделов').toBe(6);
            expect(снимок.ползунков, 'шесть разделов на два канала').toBe(12);
            expect(снимок.каналы.sort(), 'в разметке только серверные каналы')
                .toEqual(['email', 'tg']);
            expect(снимок.разделы, 'в разметке все шесть серверных разделов')
                .toEqual(expect.arrayContaining(['security', 'general']));
            expect(снимок.имена.every(и => и.length > 0), 'ни одного пустого имени раздела').toBe(true);

            /* ПОЛЗУНОК, КОТОРЫЙ ВКЛЮЧАЮТ ВПУСТУЮ, ХУЖЕ ОТСУТСТВУЮЩЕГО —
               ровно та беда, за которую 29.10 сняли канал `site`. */
            const ЦЕЛЬ_1 = ['tournaments', 'challenges', 'membership', 'matches'];
            const цели1 = снимок.ползунки.filter(п => ЦЕЛЬ_1.includes(п.раздел));
            expect(цели1.length, 'четыре раздела цели 1 на два канала').toBe(8);

            /* ПОЧТА БЕРЁТСЯ НАРОЧНО: телеграм гасится ещё и без
               привязанного бота, и по нему нельзя судить о согласии. */
            const почтаЦели1 = цели1.filter(п => п.канал === 'email');
            if (снимок.согласиеВПрофиле) {
                expect(почтаЦели1.every(п => п.погашен === false),
                    'с согласием ползунки цели 1 по почте живые').toBe(true);
            } else {
                expect(почтаЦели1.every(п => п.погашен === true),
                    'без согласия ползунки цели 1 по почте погашены').toBe(true);
                expect(снимок.подсказка, 'погашенному ползунку дана подсказка, куда идти').toBe(true);
            }
            expect(снимок.ползунки.filter(п => п.раздел === 'security' && п.канал === 'email')
                .every(п => п.погашен === false),
                'ползунок безопасности жив без согласия — законный интерес').toBe(true);
        });
    });

    test('дом доехал до приложения — и три беды там закрыты', async ({ page }) => {
        const ошибки = await дождатьсяДома(page, ПРИЛОЖЕНИЕ);
        проверить(await снятьДом(page));
        expect(ошибки, 'страница без ошибок').toEqual([]);
    });
});
