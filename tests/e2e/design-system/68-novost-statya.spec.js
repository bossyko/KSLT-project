/**
 * СТРАНИЦА ОТДЕЛЬНОЙ НОВОСТИ — `pages/news.html?slug=…`, 08.10.
 *
 * ПОЧЕМУ ПРОБА СОБИРАЕТ СТАТЬЮ САМА. В тестовой базе новостей нет вовсе, а
 * проба, которая ждёт данных, падает не на продукте, а на пустой базе —
 * это уже стоило нам прогона «Тренеров» 07.10. Поэтому страница открывается
 * с несуществующим ключом, а затем ТЕМИ ЖЕ функциями `js/news.js`
 * (renderHero → renderContent → renderTags → renderReactions) на ней
 * рисуется подставная статья. Это проба КОМПОНЕНТА, а не данных.
 *
 * ПОЧЕМУ КАДРЫ — data:. Снимки в прогоне не загружаются вовсе (см.
 * tests/fixtures.js: они съедали трафик боевой базы), а отношение коробки
 * галереи снимается с ПЕРВОГО кадра по его natural-размеру. Кадр из data:
 * не ходит в сеть и грузится всегда — и отношение получается настоящее,
 * портрет 3:4, как у всех пятнадцати снимков живой статьи.
 *
 * Что проверяет ПРОГОН, а не заморозка:
 *
 *   • ЧТО ПОЛУЧИЛОСЬ ИЗ var(--…) В БРАУЗЕРЕ. В файле имя крутилки, число
 *     даёт только замер — и оно разное на пяти видах;
 *   • ОБЛОЖКА НЕ ВЫШЕ ПОТОЛОКА И ЗАГОЛОВОК ВИДЕН БЕЗ ПРОКРУТКИ — это
 *     отношение к высоте ОКНА, его считает браузер;
 *   • ЛЕСТНИЦА ТЕКСТА: кегли стоят на ступенях, межстрочные — на своих, и
 *     пара «заголовок + подзаголовок» не схлопывается ни на одном виде;
 *   • У КОРОБКИ ГАЛЕРЕИ НЕТ КРЫЛЬЕВ: отношение коробки равно отношению
 *     кадра, и это видно только после загрузки кадра;
 *   • СПИСОК ПОБЕДИТЕЛЕЙ В ДВЕ КОЛОНКИ СТРОГО КОРОЧЕ, ЧЕМ В ОДНУ —
 *     замораживается отношение, а не число;
 *   • ЦЕЛЬ НАЖАТИЯ МЕРЯЕТСЯ ПОПАДАНИЕМ, а не правилом в css;
 *   • КОНТРАСТ СКЛАДЫВАЕТ ВСЕ ПОЛУПРОЗРАЧНЫЕ СЛОИ до непрозрачного —
 *     прибор, который их отбрасывает, врёт (06.10 и 08.10);
 *   • ПРОСМОТРЩИК ЗАБИРАЕТ ФОКУС И ОТДАЁТ ОБРАТНО, и Tab не уходит на
 *     страницу под накладкой;
 *   • ЧУЖОЙ ЯЗЫК НЕ ГОВОРИТ ПО-РУССКИ — ни на статье, ни на пустом
 *     состоянии «перевода нет».
 */
const { test, expect } = require('../../fixtures');

const ЯЗЫКИ = [
    { имя: 'ru', адрес: '/pages/news.html',    чужой: false, перевод: 'Этой новости нет' },
    { имя: 'en', адрес: '/pages/news-en.html', чужой: true,  перевод: 'not available in English' },
    { имя: 'kg', адрес: '/pages/news-kg.html', чужой: true,  перевод: 'кыргызча жок' },
];

const ВИДЫ = [
    { имя: 'десктоп',       ш: 1512, в: 900  },
    { имя: 'планшет-лёжа',  ш: 1024, в: 768  },
    { имя: 'планшет-стоя',  ш: 768,  в: 1024 },
    { имя: 'телефон',       ш: 390,  в: 844  },
    { имя: 'телефон-лёжа',  ш: 844,  в: 390  },
];

const ШКАЛА_КЕГЛЕЙ = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ШКАЛА_МЕЖСТРОЧНЫХ = [1, 1.1, 1.3, 1.5, 1.65];

/** Портретный кадр 3:4, который не ходит в сеть. */
const КАДР = (н) => 'data:image/svg+xml;utf8,' + encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="300" height="400">' +
    '<rect width="300" height="400" fill="#2a2a2a"/>' +
    '<text x="150" y="200" fill="#ccff00" font-size="48" text-anchor="middle">' + н + '</text></svg>');

/* Подставная статья. Содержимое — крайний случай живой статьи: список
   победителей абзацами со значками места, как его отдаёт редактор админки.
   БЕЗ eval: у сайта CSP без 'unsafe-eval', и строка, съеденная eval внутри
   page.evaluate, роняет саму пробу. Объект уезжает в браузер как данные. */
const ТЕЛО =
    '<p>\u{1F33A}Женская категория FUTURES</p>' +
    '<p>\u{1F947} Канышай Бадретдинова</p><p>\u{1F948} Айдай Акматалиева</p>' +
    '<p>\u{1F949} Каныкей Турсунбаева</p><p>V\u{1F3C5}Асель Ашимова</p>' +
    '<p>IX \u{1F3C5} Нармина Ахматова</p><p>XVII\u{1F3C5}Бурул Ракишева</p>' +
    '<p>\u{1F33A}Женская категория TOUR</p>' +
    '<p>\u{1F947} Адель Джайлоева</p><p>\u{1F948} Анастасия Аджибекова</p>' +
    '<p>\u{1F949} Наталия Цурбан</p><p>V\u{1F3C5} Амина Курбанова</p>' +
    '<p>IX \u{1F3C5} Назгуль Керималиева</p><p>XVII\u{1F3C5}Айжан Темиралиева</p>' +
    '<p>\u{1F537}Мужская категория MASTERS</p>' +
    '<p>\u{1F947} Эрмек Садыков</p><p>\u{1F948} Руслан Абдыкеримов</p>' +
    '<p>\u{1F949} Темир Жумабеков</p><p>V\u{1F3C5} Азамат Осмонов</p>' +
    '<p>IX \u{1F3C5} Бакыт Турдубаев</p><p>XVII\u{1F3C5} Нурлан Акматов</p>' +
    '<p>Дальше идёт обычный абзац, который в список попасть не должен, потому ' +
    'что он длиннее шестидесяти знаков и значка места в нём нет.</p>';

const СТАТЬЯ = (кадры) => ({
    slug: 'proba-statya',
    title: 'ЗАВЕРШЕНИЕ И ИТОГИ ТБШ 2026',
    subtitle: 'Турнир Большого Шлема КСЛТ завершён: шесть категорий, пятьдесят призёров и две недели игры на четырёх кортах.',
    category: 'results',
    categoryLabel: 'Результаты',
    date: '5 октября 2026',
    author: 'КСЛТ',
    heroImage: кадры[0],
    imageOriginal: кадры[0],
    ownCover: false,
    reactions: {},
    tags: [{ label: 'ТБШ' }, { label: 'итоги' }],
    gallery: кадры,
    content: [{ type: 'html', html: ТЕЛО }]
});

/** Открыть страницу и нарисовать на ней подставную статью. */
async function открыть(page, адрес) {
    await page.goto(адрес + '?slug=proba-net-takoy');
    /* ЖДЁМ, ПОКА СТРАНИЦА ДОДЕЛАЕТ СВОЁ, И ТОЛЬКО ПОТОМ РИСУЕМ.
       Ключа в базе нет, и её ответ приходит ПОЗЖЕ загрузки скриптов: если
       рисовать сразу, renderNotFound() приезжает следом и прячет всё
       нарисованное. ЭЛЕМЕНТ СО СКРЫТЫМ РОДИТЕЛЕМ ОТДАЁТ НУЛИ — и проба
       меряет нули, не падая на самом рисовании.
       Признак готовности — отрисованное «не найдено», а не тишина сети. */
    await page.waitForSelector('#newsNotFound h1', { timeout: 20000 });
    const статья = СТАТЬЯ([1, 2, 3, 4, 5].map(КАДР));
    await page.evaluate((a) => {
        const пусто = document.getElementById('newsNotFound');
        if (пусто) { пусто.style.display = 'none'; пусто.innerHTML = ''; }
        ['newsHero', 'newsArticleBody', 'newsTags', 'newsReactions'].forEach(id => {
            const el = document.getElementById(id); if (el) el.style.display = '';
        });
        window.renderProgressBar();
        window.renderHero(a, 3);
        window.renderContent(a);
        window.renderTags(a);
        window.renderReactions(a);
    }, статья);
    /* ЖДЁМ ПРИЗНАК, А НЕ ТИШИНУ СЕТИ: отношение коробки ставит js после
       загрузки первого кадра, и до этого коробка стоит на запасном 4:3. */
    await page.waitForFunction(() => {
        const s = document.querySelector('.news-carousel-stage');
        return document.querySelector('.news-pobediteli') && s &&
               getComputedStyle(s).aspectRatio.indexOf('0.75') === 0;
    }, null, { timeout: 20000, polling: 200 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await page.waitForTimeout(200);
}

for (const Я of ЯЗЫКИ) {
test.describe('страница новости · ' + Я.имя, () => {

    for (const В of ВИДЫ) {
    test.describe(В.имя, () => {
        test.use({ viewport: { width: В.ш, height: В.в } });

        test('обложка не выше потолка, и заголовок виден без прокрутки', async ({ page }) => {
            await открыть(page, Я.адрес);
            const з = await page.evaluate(() => {
                const bg = document.querySelector('.news-statya-hero .news-hero-bg');
                const h1 = document.querySelector('.news-statya-hero h1');
                const cs = getComputedStyle(bg);
                return {
                    обложка: bg.getBoundingClientRect().height,
                    потолок: parseFloat(getComputedStyle(bg.querySelector('img')).maxHeight),
                    пол: cs.minHeight,
                    верхЗаголовка: h1.getBoundingClientRect().top + window.scrollY,
                    окно: window.innerHeight
                };
            });
            /* ПОЛА НЕТ ВОВСЕ — это и есть решение куска */
            expect(['0px', 'auto', 'none']).toContain(з.пол);
            expect(з.обложка).toBeLessThanOrEqual(з.потолок + 1);
            expect(з.потолок).toBeLessThanOrEqual(Math.min(0.46 * В.в, 420) + 1);
            /* Заголовок виден на первом экране: это была цель правки */
            expect(з.верхЗаголовка).toBeLessThan(з.окно);
        });

        test('лестница текста: ступени, межстрочные и неслипшаяся пара', async ({ page }) => {
            await открыть(page, Я.адрес);
            const л = await page.evaluate(() => {
                const снять = сел => {
                    const el = document.querySelector(сел); if (!el) return null;
                    const s = getComputedStyle(el);
                    return { кегль: parseFloat(s.fontSize),
                             межстрочный: +(parseFloat(s.lineHeight) / parseFloat(s.fontSize)).toFixed(2),
                             вес: s.fontWeight };
                };
                return {
                    h1: снять('.news-statya-hero h1'),
                    подзаголовок: снять('.news-subtitle'),
                    значок: снять('.news-category-badge'),
                    мета: снять('.news-meta-item'),
                    категория: снять('.news-html .news-pobediteli-gruppa'),
                    строка: снять('.news-pobediteli-spisok li'),
                    тег: снять('.news-tag'),
                    оценка: снять('.news-reaction-count')
                };
            });
            for (const [имя, у] of Object.entries(л)) {
                expect(у, имя + ' не найден').not.toBeNull();
                expect(ШКАЛА_КЕГЛЕЙ, имя + ': кегль ' + у.кегль).toContain(у.кегль);
                const близко = ШКАЛА_МЕЖСТРОЧНЫХ.some(с => Math.abs(с - у.межстрочный) <= 0.03);
                expect(близко, имя + ': межстрочный ' + у.межстрочный).toBe(true);
            }
            /* ПАРА, КОТОРАЯ ЧИТАЕТСЯ КАК ПАРА, ЕДЕТ ОДНОЙ ГРАНИЦЕЙ */
            expect(л.h1.кегль, 'заголовок не крупнее подзаголовка').toBeGreaterThan(л.подзаголовок.кегль);
            expect(л.подзаголовок.кегль).toBeGreaterThanOrEqual(л.строка.кегль);
            expect(л.значок.кегль).toBeLessThanOrEqual(л.мета.кегль);
        });

        test('у коробки галереи нет крыльев, и миниатюра той же формы', async ({ page }) => {
            await открыть(page, Я.адрес);
            const г = await page.evaluate(() => {
                const s = document.querySelector('.news-carousel-stage');
                const t = document.querySelector('.news-carousel-thumb');
                const n = document.querySelector('.news-carousel-nav');
                const к = s.getBoundingClientRect(), м = t.getBoundingClientRect(), ст = n.getBoundingClientRect();
                return {
                    коробка: +(к.width / к.height).toFixed(3),
                    высотаКоробки: к.height,
                    потолок: parseFloat(getComputedStyle(s).getPropertyValue('--galereya-potolok')) || null,
                    фон: getComputedStyle(s).backgroundColor,
                    фонСтраницы: getComputedStyle(document.body).backgroundColor,
                    мини: +(м.width / м.height).toFixed(3),
                    миниШ: м.width, миниВ: м.height,
                    стрелка: { ш: ст.width, в: ст.height },
                    окно: window.innerHeight
                };
            });
            /* ОТНОШЕНИЕ КОРОБКИ = ОТНОШЕНИЕ КАДРА: крыльев нет */
            expect(Math.abs(г.коробка - 0.75), 'отношение коробки ' + г.коробка).toBeLessThan(0.02);
            expect(Math.abs(г.мини - 0.75), 'отношение миниатюры ' + г.мини).toBeLessThan(0.05);
            expect(г.высотаКоробки).toBeLessThanOrEqual(Math.min(0.7 * В.в, 560) + 1);
            /* Миниатюра — цель нажатия по обеим сторонам */
            expect(г.миниВ).toBeGreaterThanOrEqual(44);
            expect(г.миниШ).toBeGreaterThanOrEqual(44);
            /* Стрелка 44 на всех видах: Icon button 40:93 */
            expect(г.стрелка.ш).toBeGreaterThanOrEqual(44);
            expect(г.стрелка.в).toBeGreaterThanOrEqual(44);
            /* ПОДЛОЖКА, НЕОТЛИЧИМАЯ ОТ ФОНА, — ЭТО НЕ ПОДЛОЖКА */
            expect(г.фон).not.toBe(г.фонСтраницы);
        });

        test('список победителей — настоящий список, и в две колонки он короче', async ({ page }) => {
            await открыть(page, Я.адрес);
            const с = await page.evaluate(() => {
                const бл = document.querySelector('.news-pobediteli');
                const было = бл.getBoundingClientRect().height;
                const колонок = getComputedStyle(бл).columnCount;
                const гр = бл.querySelector('.news-pobediteli-gruppa');
                /* Заголовок категории идёт на всю ширину блока */
                const наВсюШирину = Math.abs(гр.getBoundingClientRect().width - бл.getBoundingClientRect().width) < 2;
                /* ОТНОШЕНИЕ, А НЕ ЧИСЛО: сравниваем с одноколоночной раскладкой */
                бл.style.columns = '1';
                const одна = бл.getBoundingClientRect().height;
                бл.style.columns = '';
                return {
                    строк: document.querySelectorAll('.news-pobediteli-spisok li').length,
                    групп: document.querySelectorAll('.news-pobediteli-gruppa').length,
                    абзацев: document.querySelectorAll('.news-html > p').length,
                    списков: document.querySelectorAll('.news-pobediteli-spisok').length,
                    колонок, было, одна, наВсюШирину
                };
            });
            expect(с.строк, 'восемнадцать строк победителей').toBe(18);
            expect(с.групп, 'три заголовка категорий').toBe(3);
            /* Длинный абзац без значка в список не попал — это сторож эвристики */
            expect(с.абзацев, 'обычный абзац остался абзацем').toBe(1);
            expect(с.наВсюШирину, 'заголовок категории на всю ширину').toBe(true);
            if (В.ш > 640) {
                expect(с.колонок).toBe('2');
                expect(с.было, 'в две колонки короче, чем в одну').toBeLessThan(с.одна);
            } else {
                expect(с.колонок).toBe('1');
            }
        });

        test('цели нажатия берутся попаданием, а не правилом', async ({ page }) => {
            await открыть(page, Я.адрес);
            const ц = await page.evaluate(() => {
                const попал = (el, сдвиг) => {
                    const r = el.getBoundingClientRect();
                    const x = r.left + r.width / 2, y = r.top + r.height / 2 + сдвиг;
                    const n = document.elementFromPoint(x, y);
                    return !!(n && (n === el || el.contains(n) || n.contains(el)));
                };
                const back = document.querySelector('.kslt-back');
                const zoom = document.querySelector('.news-hero-zoom');
                return {
                    назадКоробка: back.getBoundingClientRect().height,
                    назадВверх: попал(back, -15),
                    назадВниз: попал(back, 15),
                    афиша: zoom ? zoom.getBoundingClientRect().height : null
                };
            });
            /* Высоту ссылке не давали — цель даёт прозрачный слой */
            expect(ц.назадКоробка).toBeLessThan(44);
            expect(ц.назадВверх, 'цель «назад» не достаёт вверх').toBe(true);
            expect(ц.назадВниз, 'цель «назад» не достаёт вниз').toBe(true);
            expect(ц.афиша, 'высота «Афиши целиком»').toBeGreaterThanOrEqual(44);
        });

        test('контраст: прибор складывает слои, и провалов нет', async ({ page }) => {
            await открыть(page, Я.адрес);
            const к = await page.evaluate((сел) => {
                /* ПРОЗРАЧНАЯ КРАСКА СМЕШИВАЕТСЯ С ФОНОМ, А НЕ ОТБРАСЫВАЕТСЯ:
                   складываем все слои до первого непрозрачного. Прибор,
                   который их отбрасывает, соврал уже дважды — 06.10 и 08.10. */
                const разбор = c => { const m = String(c).match(/[\d.]+/g);
                    return m ? { r: +m[0], g: +m[1], b: +m[2], a: m[3] === undefined ? 1 : +m[3] } : null; };
                const L = c => { const g = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
                    return 0.2126 * g(c.r) + 0.7152 * g(c.g) + 0.0722 * g(c.b); };
                const контраст = с => {
                    const el = document.querySelector(с);
                    if (!el) return null;
                    let фон = { r: 255, g: 255, b: 255 };
                    const слои = [];
                    for (let n = el; n && n.nodeType === 1; n = n.parentElement) слои.push(getComputedStyle(n).backgroundColor);
                    for (let i = слои.length - 1; i >= 0; i--) { const c = разбор(слои[i]); if (!c || c.a === 0) continue;
                        фон = { r: c.r * c.a + фон.r * (1 - c.a), g: c.g * c.a + фон.g * (1 - c.a), b: c.b * c.a + фон.b * (1 - c.a) }; }
                    const т = разбор(getComputedStyle(el).color);
                    const текст = { r: т.r * т.a + фон.r * (1 - т.a), g: т.g * т.a + фон.g * (1 - т.a), b: т.b * т.a + фон.b * (1 - т.a) };
                    const a = L(текст), b = L(фон);
                    return +(((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2));
                };
                const из = {};
                сел.forEach(с => { из[с] = контраст(с); });
                return из;
            }, ['.news-statya-hero h1', '.news-subtitle', '.news-reaction-btn',
                '.news-reaction-count', '.news-pobediteli-spisok li',
                '.news-html .news-pobediteli-gruppa', '.kslt-back', '.news-tag',
                '.news-carousel-count']);
            for (const [сел, зн] of Object.entries(к)) {
                expect(зн, сел + ' не найден').not.toBeNull();
                expect(зн, сел + ': контраст ' + зн).toBeGreaterThanOrEqual(4.5);
            }
        });
    });
    }

    /* Просмотрщик и языковой шов меряются на одном виде: они не зависят от
       ширины, а пятнадцать лишних прогонов — это пятнадцать минут. */
    test.describe('окно и язык', () => {
        test.use({ viewport: { width: 1512, height: 900 } });

        test('просмотрщик объявляет себя окном, держит Tab и отдаёт фокус', async ({ page }) => {
            await открыть(page, Я.адрес);
            await page.click('.news-carousel-next');
            await page.click('.news-carousel-main');
            await page.waitForSelector('.news-viewer', { state: 'attached' });
            const о = await page.evaluate(() => {
                const ov = document.querySelector('.news-viewer');
                return { role: ov.getAttribute('role'), modal: ov.getAttribute('aria-modal'),
                         подпись: (ov.getAttribute('aria-label') || '').length,
                         фокус: document.activeElement.className,
                         кнопок: ov.querySelectorAll('button').length,
                         прокрутка: document.body.style.overflow };
            });
            expect(о.role).toBe('dialog');
            expect(о.modal).toBe('true');
            expect(о.подпись).toBeGreaterThan(3);
            expect(о.фокус).toContain('news-viewer-close');
            expect(о.прокрутка).toBe('hidden');
            /* Ловушка: после обхода всех кнопок фокус возвращается в окно */
            for (let i = 0; i < о.кнопок + 1; i++) await page.keyboard.press('Tab');
            const вОкне = await page.evaluate(() =>
                !!document.querySelector('.news-viewer').contains(document.activeElement));
            expect(вОкне, 'Tab ушёл на страницу под накладкой').toBe(true);
            await page.keyboard.press('Escape');
            await page.waitForSelector('.news-viewer', { state: 'detached' });
            const после = await page.evaluate(() => ({
                фокус: document.activeElement.className, прокрутка: document.body.style.overflow }));
            expect(после.фокус, 'фокус не вернулся тому, кто открыл окно').toContain('news-carousel');
            expect(после.прокрутка).toBe('');
        });

        test('статья без перевода говорит об этом на своём языке', async ({ page }) => {
            await page.goto(Я.адрес + '?slug=proba-net-takoy');
            /* Тот же порядок: сперва страница доделывает своё «не найдено» */
            await page.waitForSelector('#newsNotFound h1', { timeout: 20000 });
            const п = await page.evaluate(() => {
                window.renderNetPerevoda({ slug: 'proba-statya' });
                const м = document.getElementById('newsNotFound');
                const кн = м.querySelector('a');
                return { заголовок: м.querySelector('h1').textContent,
                         текст: м.querySelector('p').textContent,
                         кнопка: кн.textContent, адрес: кн.getAttribute('href'),
                         высотаКнопки: кн.getBoundingClientRect().height,
                         шапка: document.getElementById('newsHero').style.display,
                         тело: document.getElementById('newsArticleBody').style.display,
                         вкладка: document.title };
            });
            expect(п.заголовок).toContain(Я.перевод);
            /* Описание Empty state 37:53: «always say what will appear here» */
            expect(п.текст.length).toBeGreaterThan(30);
            expect(п.адрес).toBe('news.html?slug=proba-statya');
            expect(п.высотаКнопки).toBeGreaterThanOrEqual(44);
            expect(п.шапка).toBe('none');
            expect(п.тело).toBe('none');
            expect(п.вкладка).toContain(Я.перевод.slice(0, 12));
            if (Я.чужой) {
                /* ЧУЖОЙ ЯЗЫК НЕ ГОВОРИТ ПО-РУССКИ */
                expect(п.текст).not.toContain('перевод, когда редакция');
            }
        });
    });
});
}
