/**
 * СКАНЕР — ОПИСЬ ДЕФЕКТОВ ПО ВСЕМУ САЙТУ.
 *
 * ЗАЧЕМ. Ручной аудит закрывал два экрана из тридцати за три дня, и Костя
 * находил в готовом то, чего я не смотрел. Причина не во внимательности:
 * одни и те же классы дефектов я ловил поштучно на каждом экране заново.
 * Сначала полная опись, потом починка КЛАССАМИ: одна правка гасит десятки
 * случаев — так .auth-back-link починился сразу на пяти экранах.
 *
 * С ЧЕМ СРАВНИВАЕМ:
 *   · шкала кеглей 11 12 14 16 18 21 26 32 40 (css/tokens.css)
 *   · цель нажатия 44 (WCAG 2.5.5), исключение — ссылка внутри строки
 *   · сгиб: действие не уходит ниже высоты экрана
 *   · вылет: страница не шире окна
 *   · левый край: у секций один край, а не три
 *   · ошибки JS на загрузке
 *   · привязка обработчика по классу (мина: сработает, когда кто-то
 *     добавит элемент с тем же классом выше — поймали на входе 21.09)
 *   · встроенный style="margin" там, где у контейнера уже есть gap
 *
 * ДВА УРОКА, ВСТРОЕННЫЕ В МЕТОД:
 *   1. СЧИТАЕМ ТОЛЬКО ВИДИМОЕ. Первый прогон дал 3942 мелкие цели на
 *      .nav-dropdown-item — все в ЗАКРЫТЫХ меню, размер есть, а видимости
 *      нет. Та же ошибка, что в аудите 18.09, где проход по одной папке js
 *      завысил мёртвый код в 2,4 раза.
 *   2. ОТЛИЧАЕМ ДЕФЕКТ ОТ «ДАННЫХ НЕТ». Тестовая база наполнена не
 *      полностью. Страница без содержимого — это НЕ чистая страница, это
 *      НЕ ПРОВЕРЕННАЯ страница, и она так и пишется в отчёт.
 *
 * ГДЕ ЗАПУСКАТЬ. На Маке Кости: только там есть и браузер, и сеть до базы.
 * В моей облачной машине нет ни того, ни другого.
 *
 *   node tools/skaner.js                      — гостем
 *   node tools/skaner.js --as=player          — под игроком
 *   node tools/skaner.js --as=admin           — под администратором
 *
 * Результат: tests/reports/opis-<кто>.json плюс таблица в консоль.
 */
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.join(__dirname, '..');
const ШКАЛА = [11, 12, 14, 16, 18, 21, 26, 32, 40];
const ЦЕЛЬ = 44;
const АДРЕС = process.env.KSLT_ADRES || 'http://localhost:8000';
const КТО = (process.argv.find(а => а.startsWith('--as=')) || '--as=guest').split('=')[1];

const ВИДЫ = [
    { имя: 'десктоп 1280',     w: 1280, h: 800,  тач: false },
    { имя: 'планшет 768',      w: 768,  h: 1024, тач: true },
    { имя: 'планшет бок 1024', w: 1024, h: 768,  тач: true },
    { имя: 'телефон 390',      w: 390,  h: 844,  тач: true },
    { имя: 'телефон бок 844',  w: 844,  h: 390,  тач: true }
];

const ОСМОТР = function (наст) {
    const окр = n => Math.round(n * 10) / 10;
    const H = window.innerHeight, W = window.innerWidth;
    const находки = [];
    const добавить = (класс, что, где) => находки.push({ класс, что, где });

    /* виден ли элемент человеку — размер сам по себе ничего не значит */
    const видим = э => {
        let у = э;
        while (у && у !== document.documentElement) {
            const с = getComputedStyle(у);
            if (с.display === 'none' || с.visibility === 'hidden' || parseFloat(с.opacity) === 0) return false;
            у = у.parentElement;
        }
        return true;
    };

    /* СКОЛЬКО СОДЕРЖИМОГО ВООБЩЕ ОТРИСОВАЛОСЬ.
       Пустая страница — не чистая, а непроверенная. */
    const карточек = Array.from(document.querySelectorAll(
        '[class*="-card"], [class*="-row"], [class*="-item"], tbody tr, li'))
        .filter(э => видим(э) && э.getBoundingClientRect().height > 8).length;
    const текста = (document.body.innerText || '').trim().length;

    document.querySelectorAll('a, button, input, select, textarea, [role="button"], [onclick]')
        .forEach(э => {
            const r = э.getBoundingClientRect();
            if (!r.width || !r.height || !видим(э)) return;
            const род = э.parentElement;
            const встроенная = э.tagName === 'A' && род &&
                ['P','SPAN','LI','LABEL','TD'].indexOf(род.tagName) !== -1 &&
                род.textContent.trim().length > э.textContent.trim().length + 3;
            if (встроенная) return;
            if (r.width < наст.цель || r.height < наст.цель)
                добавить('цель меньше 44', Math.round(r.width) + 'x' + Math.round(r.height),
                    (э.id ? '#' + э.id : (э.className || э.tagName).toString().trim().slice(0, 40)));
        });

    const кегли = {};
    document.querySelectorAll('body *').forEach(э => {
        if (э.children.length || !(э.textContent || '').trim()) return;
        const r = э.getBoundingClientRect();
        if (!r.height || !видим(э)) return;
        const к = окр(parseFloat(getComputedStyle(э).fontSize));
        if (наст.шкала.indexOf(Math.round(к)) === -1 || Math.abs(к - Math.round(к)) > 0.05)
            кегли[к] = (кегли[к] || 0) + 1;
    });
    Object.keys(кегли).forEach(к => добавить('кегль вне шкалы', к, кегли[к] + ' шт'));

    const вылет = Math.round(document.documentElement.scrollWidth - W);
    if (вылет > 1) добавить('вылет по ширине', вылет, 'страница');

    document.querySelectorAll('button[type="submit"], .auth-btn, .btn-primary, .tc-btn')
        .forEach(э => {
            const r = э.getBoundingClientRect();
            if (!r.width || !r.height || !видим(э)) return;
            if (r.bottom > H) добавить('действие за сгибом', Math.round(r.bottom - H),
                (э.id ? '#' + э.id : (э.className || '').toString().trim().slice(0, 40)));
        });

    const корень = document.querySelector('main') || document.body;
    const края = {};
    Array.from(корень.children).forEach(с => {
        const r = с.getBoundingClientRect();
        if (r.height < 20) return;
        const внутр = с.querySelector('h1,h2,h3,p,.container,[class*="container"]');
        const ri = внутр ? внутр.getBoundingClientRect() : r;
        края[окр(ri.left)] = true;
    });
    if (Object.keys(края).length > 2)
        добавить('разных левых краёв', Object.keys(края).length, 'секции страницы');

    return { находки, охват: { карточек, текста, адрес: location.pathname } };
};

function поИсходникам() {
    const находки = [];
    const обойти = п => !fs.existsSync(п) ? [] :
        fs.readdirSync(п, { withFileTypes: true }).flatMap(д =>
            д.isDirectory() ? обойти(path.join(п, д.name)) : [path.join(п, д.name)]);

    обойти(path.join(КОРЕНЬ, 'js')).filter(ф => ф.endsWith('.js')).forEach(ф => {
        const т = fs.readFileSync(ф, 'utf8');
        const re = /var\s+(\w+)\s*=\s*document\.querySelector\('\.([\w-]+)'\)/g;
        let м;
        while ((м = re.exec(т)) !== null)
            if (new RegExp(м[1] + '\\.addEventListener').test(т))
                находки.push({ класс: 'обработчик по классу', что: '.' + м[2], где: path.relative(КОРЕНЬ, ф) });
    });

    обойти(path.join(КОРЕНЬ, 'pages')).concat(
        fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).map(ф => path.join(КОРЕНЬ, ф))
    ).filter(ф => ф.endsWith('.html')).forEach(ф => {
        const n = (fs.readFileSync(ф, 'utf8').match(/<[^>]+style="[^"]*(margin|padding)[^"]*"[^>]*>/g) || []).length;
        if (n) находки.push({ класс: 'встроенный отступ в разметке', что: n + ' шт', где: path.relative(КОРЕНЬ, ф) });
    });
    return находки;
}

(async () => {
    const { chromium } = require('playwright-core');
    const страницы = fs.readdirSync(path.join(КОРЕНЬ, 'pages'))
        .filter(ф => ф.endsWith('.html')).map(ф => '/pages/' + ф)
        .concat(fs.readdirSync(КОРЕНЬ).filter(ф => ф.endsWith('.html')).map(ф => '/' + ф)).sort();

    /* сессия: файлы кладёт tests/auth-setup.js */
    let состояние;
    if (КТО !== 'guest') {
        const ф = path.join(КОРЕНЬ, 'tests', '.auth', КТО + '.json');
        if (!fs.existsSync(ф)) { console.error('нет сессии ' + ф + ' — сначала прогон тестов'); process.exit(1); }
        состояние = ф;
    }
    const бд = (() => { try { return require('../tests/test-db'); } catch (e) { return null; } })();

    const б = await chromium.launch();
    const всё = [], охват = [];
    for (const вид of ВИДЫ) {
        const c = await б.newContext({ viewport: { width: вид.w, height: вид.h },
            hasTouch: вид.тач, isMobile: вид.тач, storageState: состояние });
        if (бд) await c.addInitScript(cfg => { window.KSLT_DB = cfg; }, { url: бд.url, key: бд.key });
        for (const адрес of страницы) {
            const p = await c.newPage();
            const ошибки = [];
            p.on('pageerror', e => ошибки.push(String(e).slice(0, 120)));
            try {
                await p.goto(АДРЕС + адрес, { waitUntil: 'domcontentloaded', timeout: 20000 });
                await p.waitForTimeout(1200);
                const { находки, охват: о } = await p.evaluate(ОСМОТР, { цель: ЦЕЛЬ, шкала: ШКАЛА });
                ошибки.forEach(е => находки.push({ класс: 'ошибка JS', что: е, где: 'загрузка' }));
                находки.forEach(x => всё.push(Object.assign({ вид: вид.имя, страница: адрес, кто: КТО }, x)));
                охват.push({ вид: вид.имя, страница: адрес, увело: о.адрес !== адрес ? о.адрес : '',
                             карточек: о.карточек, текста: о.текста });
            } catch (e) {
                всё.push({ вид: вид.имя, страница: адрес, кто: КТО,
                           класс: 'страница не открылась', что: String(e).slice(0, 80), где: '' });
            }
            await p.close();
        }
        await c.close();
    }
    await б.close();
    if (КТО === 'guest') поИсходникам().forEach(н => всё.push(Object.assign({ вид: 'исходники', страница: '', кто: КТО }, н)));

    const счёт = (набор, ключ) => набор.reduce((м, н) => (м[ключ(н)] = (м[ключ(н)] || 0) + 1, м), {});
    const поКлассам = {};
    всё.forEach(н => {
        поКлассам[н.класс] = поКлассам[н.класс] || { всего: 0, страницы: new Set() };
        поКлассам[н.класс].всего++; поКлассам[н.класс].страницы.add(н.страница);
    });

    /* ЧЕСТНЫЙ ОХВАТ: где смотреть было нечего */
    const наДесктопе = охват.filter(о => о.вид === 'десктоп 1280');
    const увели = наДесктопе.filter(о => о.увело);
    const пустые = наДесктопе.filter(о => !о.увело && о.карточек < 5);

    console.log('\nОПИСЬ ДЕФЕКТОВ — ' + страницы.length + ' страниц × ' + ВИДЫ.length + ' видов, роль: ' + КТО + '\n');
    console.log('класс дефекта'.padEnd(34) + 'случаев'.padStart(8) + 'страниц'.padStart(9));
    console.log('-'.repeat(51));
    Object.keys(поКлассам).sort((a, b) => поКлассам[b].всего - поКлассам[a].всего).forEach(к =>
        console.log(к.padEnd(34) + String(поКлассам[к].всего).padStart(8) + String(поКлассам[к].страницы.size).padStart(9)));
    console.log('-'.repeat(51));
    console.log('ВСЕГО'.padEnd(34) + String(всё.length).padStart(8) + '\n');

    console.log('ЧТО ПОСМОТРЕТЬ НЕ УДАЛОСЬ — это НЕ «чисто», это «не проверено»');
    console.log('  увело на другую страницу: ' + увели.length +
                (увели.length ? ' — ' + увели.slice(0, 6).map(о => о.страница).join(', ') : ''));
    console.log('  открылось, но пусто (<5 карточек): ' + пустые.length +
                (пустые.length ? ' — ' + пустые.slice(0, 6).map(о => о.страница).join(', ') : ''));
    console.log('  разобрано по-настоящему: ' + (наДесктопе.length - увели.length - пустые.length) +
                ' из ' + наДесктопе.length + '\n');

    fs.mkdirSync(path.join(КОРЕНЬ, 'tests', 'reports'), { recursive: true });
    fs.writeFileSync(path.join(КОРЕНЬ, 'tests', 'reports', 'opis-' + КТО + '.json'),
        JSON.stringify({ роль: КТО, находки: всё, охват }, null, 1));
    console.log('подробности: tests/reports/opis-' + КТО + '.json');
})();
