// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * СНИМОК ВСЕГО, ЧТО ОТСЧИТЫВАЕТСЯ ОТ ШАПКИ.
 *
 * Это не проверка с ожиданиями, а измерительный прибор. Он ничего не
 * утверждает — он записывает, где что стоит, чтобы потом сравнить снимок
 * ДО правки со снимком ПОСЛЕ.
 *
 * Зачем прибор, а не глаза: высота шапки зашита числом в двадцати шести
 * местах в двенадцати файлах (h275). Переезд на токен --header-h обязан
 * не сдвинуть ни одного из них. Двадцать шесть мест на пяти ширинах —
 * сто тридцать чисел, человек их глазами не сверит.
 *
 * ГЛАВНОЕ В УСТРОЙСТВЕ: прибор ищет НЕ ПО ИМЕНАМ КЛАССОВ, а по
 * вычисленному стилю — всё, что position: sticky или fixed и имеет
 * заданный top. Имена классов я уже искал регуляркой дважды, и дважды
 * находил только то, что этим именем названо: h274 (девятнадцать правил
 * подвала) и h277 (путь, собранный через path.resolve). Прибор,
 * построенный на именах, повторил бы ту же ошибку и промолчал ровно о
 * том, о чём я не знаю.
 *
 * Запуск:
 *   npx playwright test tests/e2e/design-system/20-header-offsets.spec.js
 * Результат: tests/reports/header-snapshot/<проект>__<страница>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'header-snapshot');

/** Публичные страницы, на которых живут липкие панели (h275). */
const СТРАНИЦЫ = [
    { key: 'home',        path: '/' },
    { key: 'tournaments', path: '/pages/tournaments.html' },
    { key: 'trn-over',    path: '/pages/tournaments-overview.html' },
    { key: 'players',     path: '/pages/players.html' },
    { key: 'coaches',     path: '/pages/coaches.html' },
    { key: 'courts',      path: '/pages/courts.html' },
    { key: 'partners',    path: '/pages/partners.html' },
    { key: 'news',        path: '/pages/news.html' },
    { key: 'info',        path: '/pages/info.html' },
    { key: 'pricing',     path: '/pages/pricing.html' },
    // Страница турнира — ради .td-tabs-bar и .td-section-header: там
    // осталось составное число 120, и без замера его не пересчитать.
    { key: 'tournament',  path: '/pages/tournament.html' },
];

/** Кабинет и админка — за входом, сессии готовит tests/auth-setup.js. */
const ЗАКРЫТЫЕ = [
    { key: 'dashboard', path: '/pages/dashboard.html', роль: 'player' },
    { key: 'admin',     path: '/pages/admin.html',     роль: 'admin'  },
];

/**
 * Снять со страницы всё, что отсчитывается от верха окна.
 *
 * Возвращает:
 *   шапка   — высота самой шапки и её нижняя граница
 *   main    — верхняя отбивка содержимого (та, что сейчас врёт, h273)
 *   первый  — отбивка первой секции страницы
 *   липкие  — каждый элемент с position sticky/fixed и заданным top
 */
async function снять(page) {
    return page.evaluate(() => {
        const окр = (v) => Math.round(v * 10) / 10;

        function ключ(el) {
            const кл = (el.className && typeof el.className === 'string')
                ? '.' + el.className.trim().split(/\s+/).join('.')
                : '';
            return el.tagName.toLowerCase() + (el.id ? '#' + el.id : '') + кл;
        }

        const шапка = document.querySelector('.floating-header, header, nav');
        const main = document.querySelector('main');
        const первый = main ? main.querySelector(':scope > section') : null;

        const липкие = [];
        for (const el of document.querySelectorAll('*')) {
            const c = getComputedStyle(el);
            if (c.position !== 'sticky' && c.position !== 'fixed') continue;
            if (c.top === 'auto' || c.top === '') continue;
            const r = el.getBoundingClientRect();
            // невидимое не мерим: ноль на ноль это не «уехало», это «скрыто»
            if (r.width === 0 && r.height === 0) continue;
            липкие.push({
                ключ: ключ(el).slice(0, 80),
                позиция: c.position,
                top: c.top,
                высота: окр(r.height),
                верх: окр(r.top)
            });
        }
        липкие.sort((a, b) => a.ключ.localeCompare(b.ключ));

        return {
            шапка: шапка ? {
                ключ: ключ(шапка).slice(0, 80),
                высота: окр(шапка.getBoundingClientRect().height),
                низ: окр(шапка.getBoundingClientRect().bottom)
            } : null,
            main: main ? {
                paddingTop: getComputedStyle(main).paddingTop,
                верх: окр(main.getBoundingClientRect().top)
            } : null,
            перваяСекция: первый ? {
                ключ: ключ(первый).slice(0, 80),
                paddingTop: getComputedStyle(первый).paddingTop,
                верх: окр(первый.getBoundingClientRect().top)
            } : null,
            липкие
        };
    });
}

/**
 * Метка прогона — одна на весь запуск.
 *
 * ОСТОРОЖНО, ЗДЕСЬ ЛЕГКО ОШИБИТЬСЯ, И 21.09 Я ОШИБСЯ. Снимки лежат файлами
 * и переживают прогон. Если прогнать набор на трёх проектах из пяти, два
 * файла останутся от ПРЕДЫДУЩЕГО прогона — и сравнение «до/после» молча
 * смешает старое с новым. Я так чуть не завёл несуществующий дефект:
 * два проекта «не изменились», потому что их просто не перезапускали.
 *
 * Поэтому каждый снимок несёт метку времени запуска. Сравнение обязано
 * проверить, что все снимки одного прогона — tools/compare-header.js.
 */
function меткаПрогона() {
    try {
        return fs.readFileSync(path.join(__dirname, '..', '..', 'reports', '.run-id'), 'utf8').trim();
    } catch (e) {
        return '';   // пусто — сравнение откажется работать, и это верно
    }
}
const МЕТКА = меткаПрогона();

function записать(проект, ключ, данные) {
    fs.mkdirSync(ПАПКА, { recursive: true });
    fs.writeFileSync(
        path.join(ПАПКА, проект + '__' + ключ + '.json'),
        JSON.stringify(Object.assign({ прогон: МЕТКА }, данные), null, 2) + '\n',
        'utf8'
    );
}

/**
 * Ширина 390 снимается ВНУТРИ проекта mobile, а не отдельным проектом.
 *
 * Почему так. Полоса 376-599 — единственная, где шапка узкая, и ни одна из
 * наших ширин в неё не попадает: 375 ниже обеих границ, 768 выше обеих.
 * Отдельный проект для 390 завести можно, но окно Playwright подхватывает
 * новый список проектов только при полном перезапуске — кнопка перезагрузки
 * пересматривает файлы, а не конфиг. Два прогона подряд это уже съели.
 *
 * ПОЧЕМУ ЭТО ЧЕСТНО, А НЕ ОБХОДНОЙ ПУТЬ: высота шапки зависит ТОЛЬКО от
 * ширины окна, а палец у проекта mobile и так включён (hasTouch). Смена
 * ширины через setViewportSize перевычисляет медиазапросы — это делает сам
 * браузер, без событий.
 *
 * ЧЕГО ТАК МЕРИТЬ НЕЛЬЗЯ: всё, что решает JS по событию resize. Оно на
 * программную смену размера не срабатывает — обожглись 20.09 на гармошке
 * подвала (разбор И-13). Здесь мы читаем вычисленный стиль, а не результат
 * работы обработчика, поэтому годится.
 */
const ДОП_ШИРИНА = { проект: 'mobile', имя: 'phone-390', ширина: 390, высота: 844 };

test.describe('Снимок отступов от шапки — публичные страницы', () => {
    for (const с of СТРАНИЦЫ) {
        test('снимок: ' + с.key, async ({ page }, info) => {
            await page.goto(с.path);
            // Даём отрисоваться: часть панелей появляется после загрузки данных
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(600);
            записать(info.project.name, с.key, {
                страница: с.path,
                проект: info.project.name,
                окно: page.viewportSize(),
                снято: await снять(page)
            });

            if (info.project.name === ДОП_ШИРИНА.проект) {
                await page.setViewportSize({ width: ДОП_ШИРИНА.ширина, height: ДОП_ШИРИНА.высота });
                await page.waitForTimeout(300);
                записать(ДОП_ШИРИНА.имя, с.key, {
                    страница: с.path,
                    проект: ДОП_ШИРИНА.имя,
                    окно: page.viewportSize(),
                    снято: await снять(page)
                });
            }
        });
    }
});

for (const з of ЗАКРЫТЫЕ) {
    test.describe('Снимок отступов от шапки — ' + з.key, () => {
        test.use({ storageState: require('../../auth-setup')[з.роль + 'State'] });
        test('снимок: ' + з.key, async ({ page }, info) => {
            await page.goto(з.path);
            await page.waitForLoadState('domcontentloaded');
            await page.waitForTimeout(900);
            записать(info.project.name, з.key, {
                страница: з.path,
                проект: info.project.name,
                окно: page.viewportSize(),
                снято: await снять(page)
            });
        });
    });
}
