/**
 * ЗАМЕР ХВОСТА ПОЛНОГО ПРОГОНА 01.11 — ОДНИМ ПРОГОНОМ, А НЕ ПО ОДНОМУ.
 *
 * ЗАЧЕМ. После починки сессии и посева в хвосте осталось четыре беды, и
 * три из них, похоже, МОИ: правка лестницы обложки на низком
 * горизонтальном (`css/tokens.css:883`, 31.10) опустила `--fs-hero*` в
 * `:root`, а читают их не только обложки разделов.
 *   · `30-ritm-pervogo-ekrana:265` — «цифры начинаются выше сгиба: верх
 *     385.1 при окне 390»;
 *   · `86-battly:292` — «перебивка не мельче заголовка: заголовок 26,
 *     VS 26» (было 32 против 26);
 *   · `97-mertvoe:129` — «карточки витрины схлопнулись: 2 из 8» на
 *     главной, после того как в посеве появились тренеры;
 *   · `68-novost-statya:308` — «цель „назад“ не достаёт вверх», впервые
 *     на живой статье: до посева новостей в базе не было вовсе.
 *
 * ПОЧЕМУ ОДНИМ ФАЙЛОМ. ПАДЕНИЯ СОБИРАЮТСЯ ОДНИМ ПРОГОНОМ, ПОЧИНКА ПО
 * ОДНОМУ ЗАПРЕЩЕНА. Четыре отдельных замера — четыре круга «прогони»,
 * и каждый круг стоит Костиного времени.
 *
 * ЭТО ДИАГНОСТИКА, А НЕ ЗАМОРОЗКА: она ничего не требует, она пишет
 * `tests/reports/zamer-hvosta.json`. Решение принимается по таблице.
 */
const { test, expect } = require('../../fixtures');
const fs = require('fs');
const path = require('path');

/* ОТЧЁТ, КОТОРЫЙ ПИШУТ ТРИ ВОРКЕРА В ОДИН ФАЙЛ, ТЕРЯЕТ ДВЕ ТРЕТИ (01.11).
   Поймано на себе: первый прогон этого замера оставил в файле ОДИН вид из
   пяти. Playwright грузит файл спека в КАЖДОМ воркере отдельно, `собрано`
   живёт в памяти своего процесса, а файл один — и каждый перезаписывает
   чужое целиком. Эта же ошибка уже описана в `tests/auth-setup.js` про
   метку прогона, я её прочитал и всё равно повторил.
   ЗНАЧИТ: СВОЙ ФАЙЛ НА КАЖДЫЙ ЗАМЕР, а сводит их читатель. */
const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'zamer-hvosta');

function записать(ключ, что) {
    fs.mkdirSync(ПАПКА, { recursive: true });
    const имя = ключ.replace(/[^a-zA-Zа-яА-Я0-9]+/g, '-') + '.json';
    fs.writeFileSync(path.join(ПАПКА, имя), JSON.stringify(что, null, 2), 'utf8');
}

/** Ждём покоя списков: карточки приходят ответом базы, позже загрузки. */
async function покой(page, селектор) {
    await page.waitForSelector(селектор, { timeout: 20000 });
    await page.waitForFunction((с) => {
        const n = document.querySelectorAll(с).length;
        const было = window.__покой;
        window.__покой = n;
        return n > 0 && n === было;
    }, селектор, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

test.describe('замер хвоста 01.11', () => {

    test('главная: ритм первого экрана и витрина .vn-four', async ({ page }, info) => {
        test.setTimeout(90000);
        await page.goto('/index.html');
        await покой(page, '.vn-four .court-card, .vn-four .coach-card');

        const з = await page.evaluate(() => {
            const ч = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize) * 10) / 10 : null;
            const пр = e => {
                if (!e) return null;
                const r = e.getBoundingClientRect();
                return { верх: Math.round(r.top * 10) / 10, низ: Math.round(r.bottom * 10) / 10,
                         ш: Math.round(r.width), в: Math.round(r.height) };
            };
            const цифры = [...document.querySelectorAll('.hero-stat-value')];
            const подписи = [...document.querySelectorAll('.hero-stat-label')];
            const карточки = [...document.querySelectorAll('.vn-four .court-card, .vn-four .coach-card')];

            return {
                окно: { ш: window.innerWidth, в: window.innerHeight },
                низкийЛёжа: matchMedia('(max-height: 500px) and (orientation: landscape)').matches,
                крутилки: {
                    hero: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero').trim(),
                    heroSub: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-sub').trim(),
                    heroNum: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-num').trim(),
                    heroCap: getComputedStyle(document.documentElement).getPropertyValue('--fs-hero-cap').trim(),
                    полОбложки: getComputedStyle(document.documentElement).getPropertyValue('--oblozhka-pol').trim(),
                    потолокОбложки: getComputedStyle(document.documentElement).getPropertyValue('--oblozhka-potolok').trim()
                },
                заголовокГлавной: { кегль: ч(document.querySelector('.hero-title, .hero h1')),
                                    место: пр(document.querySelector('.hero-title, .hero h1')) },
                цифры: цифры.map(e => ({ текст: (e.textContent || '').trim().slice(0, 12),
                                         кегль: ч(e), место: пр(e) })),
                подписи: подписи.map(e => ({ кегль: ч(e), место: пр(e) })),
                /* СЕЛЕКТОРЫ ВЗЯТЫ У ПРОБЫ, КОТОРАЯ ПАДАЕТ
                   (`30-ritm-pervogo-ekrana.spec.js:265`), а не придуманы:
                   иначе замер мерит не то, что упало. */
                ритм: {
                    'hero-stats': пр(document.querySelector('.hero-stats')),
                    'hero-cta': пр(document.querySelector('.hero-cta')),
                    'hero-full': document.querySelector('.hero-full')
                        ? { display: getComputedStyle(document.querySelector('.hero-full')).display,
                            место: пр(document.querySelector('.hero-full')) } : null,
                    'hero-title': пр(document.querySelector('.hero-title')),
                    'hero-title.кегль': ч(document.querySelector('.hero-title')),
                    'hero-subtitle': пр(document.querySelector('.hero-subtitle')),
                    'hero': пр(document.querySelector('.hero')),
                    'hero.minHeight': document.querySelector('.hero')
                        ? getComputedStyle(document.querySelector('.hero')).minHeight : null,
                    'hero.padding': document.querySelector('.hero')
                        ? getComputedStyle(document.querySelector('.hero')).padding : null
                },
                /* СХЛОПНУТАЯ КАРТОЧКА — ЭТО ВЫСОТА МЕНЬШЕ 40 (проба 97). */
                витрина: карточки.map(к => ({
                    класс: к.className,
                    имя: (к.querySelector('h4') || {}).textContent || null,
                    место: пр(к),
                    картинка: пр(к.querySelector('img')),
                    'картинка.src': (к.querySelector('img') || {}).getAttribute
                        ? (к.querySelector('img').getAttribute('src') || '').slice(-40) : null,
                    'картинка.complete': (к.querySelector('img') || {}).complete,
                    строк: [...к.querySelectorAll('span, h4')].map(
                        s => (s.className || s.tagName) + ':' + Math.round(s.getBoundingClientRect().height))
                }))
            };
        });
        записать(info.project.name + ' · главная', з);
        expect(з.витрина.length, 'витрины на главной нет — мерить нечего').toBeGreaterThan(0);
    });

    /* ЗАМЕРА ПО СТРАНИЦЕ ВЫЗОВА ЗДЕСЬ ТОЖЕ НЕТ (01.11).
       Баттла в тестовой базе нет вовсе: проба 86 ПОДМЕНЯЕТ ответ запроса
       (`подменить(page, вызов)`) и мерит подставной баттл. Мой замер
       открыл страницу напрямую и честно не дождался `.ch-battle-title` —
       пять падений на ровном месте. А числа уже есть, и их дал сам отказ
       пробы 86: «заголовок 26, VS 26, имя 18». ЗАМЕР, ДУБЛИРУЮЩИЙ
       ГОВОРЛИВЫЙ ОТКАЗ, — ЛИШНЕЕ ЗВЕНО. */
    /* ЗАМЕРА ПО СТРАНИЦЕ НОВОСТИ ЗДЕСЬ НЕТ НАРОЧНО (01.11).
       Проба 68 открывает ЗАВЕДОМО ОТСУТСТВУЮЩИЙ slug, ждёт отрисованное
       «не найдено» и САМА вставляет подставную статью в DOM. Повторить
       этот сценарий со стороны — значит завести второе определение одной
       разметки, и мерил бы я свою копию, а не то, что падает. Вместо
       замера проба 68 научена НАЗЫВАТЬ состояние в своём отказе: кто
       ловит нажатие, сколько строк в ссылке и где прозрачный слой цели.
       ОТКАЗ ИМЕНУЕТ СОСТОЯНИЕ, А НЕ ОТСУТСТВИЕ УЗЛА. */
});
