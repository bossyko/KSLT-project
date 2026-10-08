/**
 * РАЗДЕЛ «НОВОСТИ» — список `pages/news.html`, 08.10.
 *
 * Те же проверки, что у кортов, тренеров и поиска игрока: решения на эти
 * страницы приняты одни, и правило, выведенное на одном куске, применяется
 * к следующему без нового разбора. Отличий два — карточку рисует ОБЩИЙ
 * компонент витрины лендинга (`.tc`), а раскладка своя: крупная на два
 * ряда, боковые 2 × 2, ряд из четырёх снизу.
 *
 * Что проверяет ПРОГОН, а не заморозка:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • «КРУПНАЯ = ДВЕ БОКОВЫЕ» — это ОТНОШЕНИЕ ВЫСОТ, и его считает сетка;
 *   • ШАГ СТРАНИЦЫ = КОЛОНОК × РЯДОВ, крутилка --novostey доезжает до js;
 *   • ЗАГОЛОВОК НЕ ОБРЕЗАН. Обрезку делает -webkit-line-clamp, и увидеть
 *     её можно только сравнив scrollHeight с clientHeight в браузере;
 *   • ОДНА КОЛОНКА НА ТЕЛЕФОНЕ — у новости товар это заголовок;
 *   • ЦЕЛИ НАЖАТИЯ. Коробка кнопки полосы 36, цель 44 прозрачным слоем —
 *     решение 04.10, и меряется попаданием, а не правилом в css;
 *   • ЛЕСТНИЦА ТЕКСТА: кегли уровней стоят на ступенях и не схлопываются;
 *   • ЧУЖОЙ ЯЗЫК НЕ ГОВОРИТ ПО-РУССКИ.
 *
 * ПОРОГ ДВУСТОРОННИЙ: либо карточки есть и разбираются, либо витрина
 * честно пуста и говорит об этом. Молчаливого «ничего нет и всё хорошо»
 * не бывает. Где нужен КОМПОНЕНТ, а не данные, — собираем пробу сами
 * ТОЙ ЖЕ разметкой, что отдаёт js/news.js → renderGrid.
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/news.html',    чужой: false },
    { имя: 'en', адрес: '/pages/news-en.html', чужой: true  },
    { имя: 'kg', адрес: '/pages/news-kg.html', чужой: true  },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];

async function открыть(page, адрес) {
    await page.goto(адрес);
    await page.waitForFunction(
        () => document.querySelector('.news-list-header h1') !== null, null, { timeout: 20000 });
    /* Дождаться, пока витрина перестанет меняться: она рисуется либо
       сеткой, либо пустым состоянием, и оба варианта законны. Вдобавок
       пересчёт шага по крутилке перерисовывает её ещё раз. */
    await page.waitForFunction(() => {
        const g = document.getElementById('newsBento');
        const было = window.__слепок;
        const стало = g ? g.innerHTML.length : -1;
        window.__слепок = стало;
        return стало >= 0 && стало === было;
    }, null, { timeout: 20000, polling: 400 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(300);
}

/** Пробная витрина: доливает карточки той же разметкой, что отдаёт
 *  `js/news.js` → renderGrid. Возвращает функцию-уборщицу. */
const ПРОБНАЯ_ВИТРИНА = `(сколько) => {
    const сетка = document.getElementById('newsBento');
    if (!сетка) return null;
    for (let i = 0; i < сколько; i++) {
        const крупная = i === 0 && !document.querySelector('.news-grid > .tc');
        const a = document.createElement('a');
        a.href = '#проба';
        a.className = 'tc проба' + (крупная ? ' tc-featured' : '');
        a.innerHTML =
            '<div class="tc-image"><div class="tc-noimage">🎾</div>' +
                '<span class="tc-badge">Результаты</span></div>' +
            '<div class="tc-body">' +
                '<span class="tc-date">5 сентября 2026 г.</span>' +
                (крупная ? '<h2 class="tc-title">' : '<h3 class="tc-title">') +
                'Завершение и итоги ТБШ 2026 — рейтинговый турнир высшей категории' +
                (крупная ? '</h2>' : '</h3>') +
                (крупная ? '<p class="tc-desc">Подзаголовок пробы</p>' : '') +
                '<div class="tc-meta"><span>1 мин чтения</span></div>' +
            '</div>';
        сетка.appendChild(a);
    }
    return { было: сколько };
}`;

const УБРАТЬ_ПРОБУ = `() => {
    document.querySelectorAll('.news-grid > .tc.проба').forEach(e => e.remove());
}`;

for (const Я of ЯЗЫКИ) {
test.describe('новости · ' + Я.имя, () => {

    test('обложка списка стоит на общей крутилке раздела', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const h = document.querySelector('.news-hero-list');
            const t = document.querySelector('.news-list-header h1');
            return {
                пол: parseFloat(getComputedStyle(h).minHeight),
                высота: Math.round(h.getBoundingClientRect().height),
                h1: parseFloat(getComputedStyle(t).fontSize),
                крутилкаПол: parseFloat(getComputedStyle(document.documentElement)
                    .getPropertyValue('--oblozhka-pol')),
            };
        });
        expect(з.пол, 'пол обложки разошёлся с крутилкой раздела').toBe(з.крутилкаПол);
        expect(з.высота, 'обложка ниже собственного пола').toBeGreaterThanOrEqual(з.пол - 1);
        expect(ШКАЛА_КЕГЛЕЙ, 'заголовок обложки мимо шкалы').toContain(Math.round(з.h1));
    });

    test('шаг страницы — колонок × рядов, и это видно на экране', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const сетка = document.getElementById('newsBento');
            if (!сетка) return null;
            const s = getComputedStyle(сетка);
            return {
                шаг: parseInt(s.getPropertyValue('--novostey'), 10),
                колонок: s.gridTemplateColumns.split(' ').filter(Boolean).length,
                показано: document.querySelectorAll('.news-grid > .tc').length,
                пусто: !!document.getElementById('newsEmpty'),
                полоса: (document.querySelector('.news-pagination') || {}).textContent || '',
            };
        });
        expect(з, 'ПОРОГ: коробки витрины новостей нет').not.toBeNull();
        expect(з.шаг, 'крутилка шага не доехала до браузера').toBeGreaterThan(0);
        expect(з.колонок, 'сетка перестала быть двенадцатиколоночной').toBe(12);
        expect(з.показано > 0 || з.пусто,
            'ПОРОГ: карточек нет, и пустое состояние тоже не нарисовано').toBe(true);
        if (з.показано) {
            expect(з.показано, 'показано больше, чем шаг страницы')
                .toBeLessThanOrEqual(з.шаг);
        }
    });

    test('крупная занимает оба ряда боковых — на широком виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.news-grid > .tc').length;
            if (!собрать(живых >= 5 ? 0 : 5 - живых)) return null;
            const все = [...document.querySelectorAll('.news-grid > .tc')];
            const о = {
                ширина: window.innerWidth,
                крупная: все[0].getBoundingClientRect().height,
                боковые: все.slice(1, 3).map(e => e.getBoundingClientRect().height),
                зазор: parseFloat(getComputedStyle(document.getElementById('newsBento')).rowGap),
                рядов: getComputedStyle(все[0]).gridRow,
            };
            уборка();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины новостей нет').not.toBeNull();
        if (з.ширина > 992) {
            expect(з.рядов, 'крупная перестала занимать два ряда').toContain('span 2');
            const двеБоковые = з.боковые[0] + з.зазор + з.боковые[1];
            expect(Math.abs(з.крупная - двеБоковые),
                'крупная ' + Math.round(з.крупная) + ' против двух боковых ' +
                Math.round(двеБоковые)).toBeLessThanOrEqual(2);
        } else {
            expect(з.рядов, 'на узком виде крупная обязана идти одним рядом')
                .not.toContain('span 2');
        }
    });

    test('на телефоне новости идут по одной', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.news-grid > .tc').length;
            if (!собрать(живых >= 4 ? 0 : 4 - живых)) return null;
            const сетка = document.getElementById('newsBento');
            const ш = сетка.getBoundingClientRect().width;
            const о = {
                ширина: window.innerWidth,
                доли: [...document.querySelectorAll('.news-grid > .tc')]
                    .map(e => Math.round(e.getBoundingClientRect().width / ш * 100)),
            };
            уборка();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины новостей нет').not.toBeNull();
        if (з.ширина <= 640) {
            for (const д of з.доли) {
                expect(д, 'на телефоне карточка занимает не всю ширину: ' + д + '%')
                    .toBeGreaterThanOrEqual(99);
            }
        } else {
            expect(Math.max(...з.доли.slice(1)),
                'боковая карточка шире половины витрины').toBeLessThan(60);
        }
    });

    test('заголовок карточки не обрезан ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.news-grid > .tc').length;
            if (!собрать(живых >= 4 ? 0 : 4 - живых)) return null;
            const о = [...document.querySelectorAll('.news-grid .tc-title')].map(t => ({
                текст: t.textContent.trim().slice(0, 30),
                видно: t.clientHeight,
                нужно: t.scrollHeight,
            })).filter(x => x.нужно > x.видно + 1);
            уборка();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины новостей нет').not.toBeNull();
        expect(з, 'заголовки срезаны: ' + JSON.stringify(з)).toEqual([]);
    });

    test('лестница текста витрины стоит на ступенях', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            const живых = document.querySelectorAll('.news-grid > .tc').length;
            if (!собрать(живых >= 3 ? 0 : 3 - живых)) return null;
            const кегль = e => e ? Math.round(parseFloat(getComputedStyle(e).fontSize)) : null;
            const все = [...document.querySelectorAll('.news-grid > .tc')];
            const о = {
                крупныйЗаголовок: кегль(все[0].querySelector('.tc-title')),
                боковойЗаголовок: кегль(все[1] && все[1].querySelector('.tc-title')),
                дата: кегль(все[1] && все[1].querySelector('.tc-date')),
                значок: кегль(все[1] && все[1].querySelector('.tc-badge')),
                капс: все[0].querySelector('.tc-title')
                    ? getComputedStyle(все[0].querySelector('.tc-title')).textTransform : null,
            };
            уборка();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з, 'ПОРОГ: коробки витрины новостей нет').not.toBeNull();
        for (const [имя, к] of Object.entries(з)) {
            if (имя === 'капс' || к === null) continue;
            expect(ШКАЛА_КЕГЛЕЙ, имя + ' мимо шкалы: ' + к).toContain(к);
        }
        expect(з.крупныйЗаголовок, 'крупная перестала быть крупнее боковой')
            .toBeGreaterThanOrEqual(з.боковойЗаголовок);
        expect(з.дата, 'дата не мельче заголовка карточки')
            .toBeLessThan(з.боковойЗаголовок);
        expect(з.капс, 'название карточки взяло капс у заголовка секции').toBe('none');
    });

    test('цели нажатия витрины не меньше 44', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const цели = [...document.querySelectorAll(
                '.trn-search-input, .trn-chip, .news-pagination .pl-page-btn')];
            const плохо = [];
            цели.forEach(e => {
                const r = e.getBoundingClientRect();
                if (!r.width) return;
                const сц = window.getComputedStyle(e, '::after');
                const слой = parseFloat(сц.height) || 0;
                const высота = Math.max(r.height, слой);
                const ширина = Math.max(r.width, parseFloat(сц.width) || 0);
                if (высота < 43.5 || ширина < 43.5) {
                    плохо.push(e.className + ' ' + Math.round(ширина) + '×' + Math.round(высота));
                }
            });
            return { целей: цели.length, плохо };
        });
        expect(з.целей, 'ПОРОГ: нажимаемых мест на странице нет').toBeGreaterThan(0);
        expect(з.плохо, 'цели нажатия меньше 44').toEqual([]);
    });

    test('витрина не переливается вбок ни на одном виде', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(([код, убрать]) => {
            const собрать = eval(код), уборка = eval(убрать);
            собрать(9);
            const о = {
                перелив: document.documentElement.scrollWidth - document.documentElement.clientWidth,
                карточек: document.querySelectorAll('.news-grid > .tc').length,
            };
            уборка();
            return о;
        }, [ПРОБНАЯ_ВИТРИНА, УБРАТЬ_ПРОБУ]);
        expect(з.карточек, 'ПОРОГ: даже проба не собралась').toBeGreaterThan(0);
        expect(з.перелив, 'страница новостей поехала вбок').toBeLessThanOrEqual(0);
    });

    test('полоса страниц идёт по краям своей витрины', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const п = document.querySelector('.news-pagination');
            const с = document.getElementById('newsBento');
            if (!п || !с || !п.textContent.trim()) return { нет: true };
            const a = п.getBoundingClientRect(), b = с.getBoundingClientRect();
            return { слева: Math.round(a.left - b.left), справа: Math.round(b.right - a.right) };
        });
        if (з.нет) return;
        expect(Math.abs(з.слева), 'полоса страниц не по левому краю витрины: ' + з.слева)
            .toBeLessThanOrEqual(1);
        expect(Math.abs(з.справа), 'полоса страниц не по правому краю витрины: ' + з.справа)
            .toBeLessThanOrEqual(1);
    });

    test('витрина либо показывает карточки, либо честно говорит, что пусто', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => ({
            карточек: document.querySelectorAll('.news-grid > .tc').length,
            пусто: !!document.getElementById('newsEmpty'),
            текстПустого: (document.getElementById('newsEmpty') || {}).textContent || '',
            вложено: [...document.querySelectorAll('.news-grid > .tc')]
                .reduce((н, c) => н + c.querySelectorAll('a').length, 0),
            наружу: [...document.querySelectorAll('.news-grid > .tc.news-outside')]
                .filter(a => a.target !== '_blank').length,
        }));
        expect(з.карточек > 0 || з.пусто,
            'ПОРОГ: карточек нет, и пустое состояние тоже не нарисовано').toBe(true);
        if (з.пусто) {
            expect(з.текстПустого.trim().length, 'пустое состояние молчит').toBeGreaterThan(0);
        }
        if (з.карточек) {
            expect(з.вложено, 'внутрь карточки вложена ссылка').toBe(0);
            expect(з.наружу, 'внешняя новость открывается в той же вкладке').toBe(0);
        }
    });

    if (Я.чужой) {
    test('чужой язык не говорит по-русски', async ({ page }) => {
        await открыть(page, Я.адрес);
        const з = await page.evaluate(() => {
            const и = document.querySelector('.trn-search-input');
            const ч = document.querySelector('.trn-chip');
            const п = document.querySelector('.news-pagination');
            return {
                поиск: и ? (и.placeholder || '') : '',
                чип: ч ? ч.textContent.trim() : '',
                полоса: п ? п.textContent.trim() : '',
                заголовок: (document.querySelector('.news-list-header h1') || {}).textContent || '',
            };
        });
        const русские = /[А-Яа-яЁё]/;
        /* Кыргызская страница пишет кириллицей — её отличаем по словам,
           а не по азбуке: проверяем, что это НЕ русские подписи. */
        expect(з.поиск, 'поиск остался с русской подписью')
            .not.toBe('Поиск новости...');
        expect(з.чип, 'фильтр остался с русской подписью').not.toBe('Все');
        if (з.полоса) {
            expect(з.полоса, 'полоса страниц осталась русской').not.toMatch(/Назад|Вперёд/);
        }
        if (!русские.test(з.заголовок)) {
            expect(з.заголовок.trim().length, 'заголовок раздела пуст').toBeGreaterThan(0);
        }
    });
    }
});
}
