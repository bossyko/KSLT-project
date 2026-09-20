// @ts-check
const fs = require('fs');
const path = require('path');
const { test } = require('../../fixtures');

/**
 * ВЛЕЗАЕТ ЛИ РЯД ШАПКИ — снимок, а не приговор.
 *
 * ЗАЧЕМ. Костя выбрал кегль 16 вместо 14. Тот же десктопный ряд отдаётся
 * на 844 (телефон боком) и 1024 (планшет боком) — бургера там нет. Ряд
 * от 16 становится шире, и на 844 запаса может не остаться. По арифметике
 * влезает с запасом около десяти пикселей, но арифметика — не замер, и
 * мы сегодня трижды видели, как одно расходится с другим.
 *
 * ЧТО МЕРИМ:
 *   свободное место в ряду = ширина контейнера − сумма занятого;
 *   перенос на вторую строку — по верхней координате пунктов: если у
 *   первого и последнего она разная, ряд сложился, и запас отрицательный
 *   даже если арифметика говорит обратное;
 *   налезание на «Войти» — по пересечению правого края меню с левым
 *   краем правой группы.
 *
 * ПОЧЕМУ НЕ ПРОСТО «СУММА ШИРИН». Между элементами есть зазоры, а у
 * контейнера — свои отступы. Сумма ширин без них врёт в меньшую сторону
 * и покажет запас там, где его нет.
 *
 * ПЕРВАЯ ВЕРСИЯ ЭТОГО ПРИБОРА МЕРИЛА НЕ ТО, И ЭТО ВАЖНО ЗАПОМНИТЬ.
 * Она считала «ширина ряда минус сумма ширин прямых детей» и выдала
 * свободно 0.1 на ВСЕХ пяти ширинах — красивое одинаковое число, которое
 * значит ровно ничего. Дети ряда растянуты флексом: они по определению
 * заполняют контейнер целиком, сколько бы места ни было. Разность всегда
 * будет нулём — и на 1280, где простора вдоволь, и на 844, где его нет.
 * Настоящий запас лежит ВНУТРИ .nav-links: сколько места отдано против
 * того, сколько занимает содержимое. Это и спрашиваем у браузера —
 * clientWidth против scrollWidth, а не складываем сами.
 *
 * Запуск:  npx playwright test tests/e2e/design-system/23-header-row-fit.spec.js
 * Результат: tests/reports/header-row-fit/<проект>.json
 */

const ПАПКА = path.join(__dirname, '..', '..', 'reports', 'header-row-fit');

function метка() {
    try {
        return fs.readFileSync(path.join(__dirname, '..', '..', 'reports', '.run-id'), 'utf8').trim();
    } catch (e) { return ''; }
}

// ТРИ ЯЗЫКА, А НЕ ОДИН.
// Замер 20.09 на русском показал на 844 запас в левой группе 19.3 пикселя.
// Названия разделов на английском и кыргызском другой длины, а ряд один и
// тот же. Мерить один язык и говорить «влезло» — то же самое, что мерить
// одну ширину и говорить «адаптивно».
const СТРАНИЦЫ = [
    { имя: 'ru', адрес: '/' },
    { имя: 'en', адрес: '/index-en.html' },
    { имя: 'kg', адрес: '/index-kg.html' }
];

test.describe('Ряд шапки', () => {
    test('влезает ли', async ({ page }, info) => {
        const поЯзыкам = {};
        for (const стр of СТРАНИЦЫ) {
        await page.goto(стр.адрес);
        await page.waitForLoadState('domcontentloaded');
        await page.waitForTimeout(600);

        const снято = await page.evaluate(() => {
            const окр = v => Math.round(v * 10) / 10;
            const ряд = document.querySelector('.floating-header nav');
            if (!ряд) return { нет: '.floating-header nav' };
            const c = getComputedStyle(ряд);
            const rряд = ряд.getBoundingClientRect();
            const видим = el => {
                if (!el) return false;
                const r = el.getBoundingClientRect();
                const s = getComputedStyle(el);
                return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none';
            };

            const пункты = [...ряд.querySelectorAll('.nav-item')].filter(видим);
            const верх = [...new Set(пункты.map(п => Math.round(п.getBoundingClientRect().top)))];

            const меню = ряд.querySelector('.nav-links');
            const право = ряд.querySelector('.nav-right, .header-right, .nav-actions') ||
                          (ряд.querySelector('.btn-auth') ? ряд.querySelector('.btn-auth').parentElement : null);

            const занято = [...ряд.children].filter(видим)
                .map(el => ({ ключ: el.className || el.tagName, ш: окр(el.getBoundingClientRect().width) }));
            const сумма = занято.reduce((a, b) => a + b.ш, 0);

            // НАСТОЯЩИЙ ЗАПАС: сколько отдано против того, сколько занято.
            //
            // ВТОРАЯ ОШИБКА ЭТОГО ПРИБОРА, И ОНА ТОНЬШЕ ПЕРВОЙ.
            // Я взял scrollWidth как «сколько занято на самом деле» — и он
            // выдал «не влезло» на ВСЕХ трёх ширинах, включая просторные
            // 1280, где на экране ряд стоит ровно и ничего не переносится.
            // Причина: внутри пунктов лежат выпадающие панели с position:
            // absolute. Они шириной 260 и торчат за край, и scrollWidth их
            // считает — хотя они невидимы и к тому, влезает ли РЯД, никакого
            // отношения не имеют.
            // Вывод на будущее: scrollWidth отвечает на вопрос «есть ли что
            // прокручивать», а не «влезло ли содержимое потока». Для второго
            // складываем видимых детей потока и сравниваем с clientWidth,
            // а перенос ловим по верхним координатам пунктов.
            function запас(el) {
                if (!el || !видим(el)) return null;
                const r = el.getBoundingClientRect();
                const s = getComputedStyle(el);
                const зазор = parseFloat(s.columnGap || s.gap || 0) || 0;
                const дети = [...el.children].filter(el2 =>
                    видим(el2) && getComputedStyle(el2).position !== 'absolute' &&
                                  getComputedStyle(el2).position !== 'fixed');
                const сумма = дети.reduce((a, b) => a + b.getBoundingClientRect().width, 0)
                            + зазор * Math.max(0, дети.length - 1);
                return {
                    отдано: окр(el.clientWidth),
                    занято: окр(el.scrollWidth),
                    заняли: окр(сумма),
                    зазор: зазор,
                    ЗАПАС: окр(el.clientWidth - сумма),
                    scrollWidthГрязный: окр(el.clientWidth - el.scrollWidth),
                    неВлезло: сумма > el.clientWidth + 0.5,
                    ш: окр(r.width)
                };
            }

            return {
                ряд: { ш: окр(rряд.width), внутри: окр(rряд.width - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight)),
                       padding: c.padding },
                // «А ЧТО БЫЛО БЫ» — ЗАМЕР, А НЕ ПРИКИДКА.
                //
                // Кыргызский рвётся на две строки. Виноват ли в этом кегль 16
                // или так было и на 14 — по одному снимку не сказать, а гонять
                // человека на второй прогон с откатом дорого. Поэтому мерим
                // прямо здесь: временно запрещаем перенос, снимаем настоящую
                // ширину ряда в одну строку, потом временно ставим 14 и снимаем
                // ещё раз. В конце всё возвращаем.
                //
                // ОСТОРОЖНО: это единственное место в приборе, которое МЕНЯЕТ
                // страницу. Любая правка здесь обязана возвращать всё как было,
                // иначе следующий замер в этом же прогоне окажется враньём.
                естественная: (() => {
                    const меню = ряд.querySelector('.nav-links');
                    if (!меню || !видим(меню)) return null;
                    const пункты2 = [...меню.querySelectorAll('.nav-item')];
                    const былоWrap = меню.style.flexWrap;
                    const былиКегли = пункты2.map(п => п.style.fontSize);
                    const зазор = parseFloat(getComputedStyle(меню).columnGap || 0) || 0;
                    const ширина = () => пункты2.reduce((a, b) => a + b.getBoundingClientRect().width, 0)
                                        + зазор * Math.max(0, пункты2.length - 1);
                    меню.style.flexWrap = 'nowrap';
                    const приТекущем = окр(ширина());
                    пункты2.forEach(п => { п.style.fontSize = '14px'; });
                    const при14 = окр(ширина());
                    пункты2.forEach(п => { п.style.fontSize = '16px'; });
                    const при16 = окр(ширина());
                    // вернуть как было
                    пункты2.forEach((п, i) => { п.style.fontSize = былиКегли[i]; });
                    меню.style.flexWrap = былоWrap;
                    // сколько места у меню есть на самом деле
                    const лево = ряд.querySelector('.nav-left');
                    const право = ряд.querySelector('.nav-right');
                    const доступно = окр(ряд.clientWidth
                        - (лево ? [...лево.children].filter(видим).reduce((a, b) => a + b.getBoundingClientRect().width, 0) : 0)
                        - (право ? [...право.children].filter(видим).reduce((a, b) => a + b.getBoundingClientRect().width, 0) : 0));
                    return { приТекущем, при14, при16, доступно,
                             влезаетПри14: при14 <= доступно, влезаетПри16: при16 <= доступно };
                })(),
                // ЯРКОСТЬ В ПОКОЕ — по трём языкам сразу.
                // Костя 20.09: «в английской, кажется, кнопка входа и языки
                // не изменились». Разметка и подключаемые стили у ru/en/kg
                // одинаковые, значит либо правка не доехала, либо разница
                // 72% против 100% на глаз слишком мала. Спрашиваем у браузера,
                // а не спорим о впечатлении.
                яркость: (() => {
                    const снять = сел => {
                        const el = ряд.querySelector(сел);
                        if (!el || !видим(el)) return null;
                        const c = getComputedStyle(el);
                        return { цвет: c.color, кегль: окр(parseFloat(c.fontSize)), вес: c.fontWeight };
                    };
                    return {
                        пункт: снять('.nav-item:not(.nav-item-live)'),
                        войти: снять('.btn-auth'),
                        язык: снять('.lang-toggle')
                    };
                })(),
                // СКОЛЬКО СТОЯТ САМИ СЛОВА.
                // Костя предложил сократить кыргызское «Түз эфир» до «Түз».
                // Прикидывать «сэкономит пикселей сорок» нельзя — ширина
                // строки зависит от шрифта, кегля и конкретных букв. Меряем
                // кандидатов тем же шрифтом, каким набран пункт меню.
                словаКандидаты: (() => {
                    const обр = ряд.querySelector('.nav-item');
                    if (!обр) return null;
                    const c = getComputedStyle(обр);
                    const проба = document.createElement('span');
                    проба.style.cssText = 'position:absolute;visibility:hidden;white-space:nowrap;left:-9999px;' +
                        'font-family:' + c.fontFamily + ';font-size:' + c.fontSize +
                        ';font-weight:' + c.fontWeight + ';letter-spacing:' + c.letterSpacing + ';';
                    document.body.appendChild(проба);
                    const мера = s => { проба.textContent = s; return окр(проба.getBoundingClientRect().width); };
                    const итог = {};
                    for (const с of ['Түз эфир', 'Түз', 'Эфир', 'Live',
                                     'Мелдештер', 'Кызматтар', 'Жаңылыктар', 'Маалымат', 'Рейтинг'])
                        итог[с] = мера(с);
                    проба.remove();
                    return итог;
                })(),
                запасМеню: запас(ряд.querySelector('.nav-links')),
                запасЛево: запас(ряд.querySelector('.nav-left')),
                запасПраво: запас(ряд.querySelector('.nav-right')),
                дети: занято,
                суммаДетей: окр(сумма),
                свободно: окр(rряд.width - parseFloat(c.paddingLeft) - parseFloat(c.paddingRight) - сумма),
                пунктов: пункты.length,
                строкПунктов: верх.length,
                перенёсся: верх.length > 1,
                кегльПункта: пункты.length ? окр(parseFloat(getComputedStyle(пункты[0]).fontSize)) : null,
                менюПраво: меню && видим(меню) ? окр(меню.getBoundingClientRect().right) : null,
                правоЛево: право && видим(право) ? окр(право.getBoundingClientRect().left) : null,
                налезает: (меню && право && видим(меню) && видим(право))
                    ? окр(Math.max(0, меню.getBoundingClientRect().right - право.getBoundingClientRect().left))
                    : 0
            };
        });

        поЯзыкам[стр.имя] = снято;
        }

        fs.mkdirSync(ПАПКА, { recursive: true });
        fs.writeFileSync(path.join(ПАПКА, info.project.name + '.json'),
            JSON.stringify({ прогон: метка(), проект: info.project.name, окно: page.viewportSize(),
                             языки: поЯзыкам, ...поЯзыкам.ru }, null, 2) + '\n',
            'utf8');
    });
});
