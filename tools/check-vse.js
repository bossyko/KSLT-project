/**
 * ВСЯ ЗАМОРОЗКА ОДНОЙ КОМАНДОЙ.
 *
 * Правила читают код и говорят, не разъехался ли он с принятыми решениями.
 * Прувер берёт КОПИЮ файлов, возвращает в неё прежнее значение и требует,
 * чтобы правило упало — иначе правило ничего не держит.
 *
 *   node tools/check-vse.js          — правила и прувер
 *   node tools/check-vse.js --быстро — только правила, без прувера
 */
const path = require('path');
const { execFileSync } = require('child_process');

const быстро = process.argv.includes('--быстро');
const КУСКИ = [
    ['шапка',                'check-header.js',       'check-header-otkat.js'],
    ['первый экран',        'check-geroy.js',        'check-geroy-otkat.js'],
    ['раздел live',         'check-live.js',         'check-live-otkat.js'],
    ['цвет статусов',       'check-turniry-cvet.js', 'check-turniry-cvet-otkat.js'],
    ['узкие виды турниров', 'check-turniry-vidy.js', 'check-turniry-vidy-otkat.js'],
    ['новости',             'check-novosti.js',      'check-novosti-otkat.js'],
    ['значки',              'check-znachki.js',      'check-znachki-otkat.js'],
    ['коробка-гейт',        'check-korobka.js',      'check-korobka-otkat.js'],
    ['рейтинг',             'check-reyting.js',      'check-reyting-otkat.js'],
    ['давай сыграем',       'check-igroki.js',       'check-igroki-otkat.js'],
    ['где играть',          'check-venues.js',       'check-venues-otkat.js'],
    ['о проекте',           'check-about.js',        'check-about-otkat.js'],
    ['стань спонсором',     'check-sponsor.js',      'check-sponsor-otkat.js'],
    ['спонсоры',            'check-sponsors.js',     'check-sponsors-otkat.js'],
    ['подвал',              'check-footer.js',       'check-footer-otkat.js'],
    ['страница матча',      'check-live-stranica.js','check-live-stranica-otkat.js'],
    ['судейское окно',      'check-sudya.js',        'check-sudya-otkat.js'],
    ['страница турниров',   'check-turniry.js',      'check-turniry-otkat.js'],
    ['лента фильтров',      'check-lenta-filtrov.js', 'check-lenta-filtrov-otkat.js'],
    ['страница турнира',    'check-stranica-turnira.js', 'check-stranica-turnira-otkat.js'],
    ['обложка и вкладки',   'check-oblozhka.js',     'check-oblozhka-otkat.js'],
    ['статус турнира',      'check-status.js',       'check-status-otkat.js'],
    ['форма турнира',       'check-trn-forma.js',    'check-trn-forma-otkat.js'],
    ['вёрстка заявок',      'check-zayavki-verstka.js', 'check-zayavki-verstka-otkat.js'],
    ['оболочка окна',       'check-okno-obolochka.js', 'check-okno-obolochka-otkat.js'],
    ['жеребьёвка',          'check-zhrebiy.js',      'check-zhrebiy-otkat.js'],
    ['места в группе',      'check-mesta-v-gruppe.js','check-mesta-v-gruppe-otkat.js'],
    ['плей-офф',            'check-setka-plei-off.js','check-setka-plei-off-otkat.js'],
    ['алфавит групп',      'check-alfavit-grupp.js','check-alfavit-grupp-otkat.js'],
    ['очки и лиги',        'check-ochki-i-ligi.js','check-ochki-i-ligi-otkat.js'],
    ['проход без игры',    'check-bye-ne-zapiraet.js','check-bye-ne-zapiraet-otkat.js'],
    ['пол турнира',        'check-pol-turnira.js',   'check-pol-turnira-otkat.js'],
    ['порядок очереди',    'check-ochered-poryadok.js','check-ochered-poryadok-otkat.js'],
    ['кнопка «Снять»',     'check-knopka-snyat.js',  'check-knopka-snyat-otkat.js'],
    ['место в рейтинге',   'check-mesto-v-reytinge.js','check-mesto-v-reytinge-otkat.js'],
    ['метка группы',       'check-metka-gruppy.js',    'check-metka-gruppy-otkat.js'],
    ['прогноз выключен',   'check-prognoz-vyklyuchen.js','check-prognoz-vyklyuchen-otkat.js'],
    ['цифры обложки',      'check-cifry-oblozhki.js',  'check-cifry-oblozhki-otkat.js'],
    ['телефон раздела',    'check-telefon-razdela.js', 'check-telefon-razdela-otkat.js'],
    ['обзорная «Услуги»',  'check-uslugi.js',          'check-uslugi-otkat.js'],
    ['страница «Корты»',   'check-korty.js',           'check-korty-otkat.js'],
    ['страница «Тренеры»', 'check-trenery.js',         'check-trenery-otkat.js']
];

function прогнать(файл) {
    try {
        const out = execFileSync(process.execPath, [path.join(__dirname, файл)], { encoding: 'utf8' });
        return { ок: true, вывод: out };
    } catch (e) { return { ок: false, вывод: (e.stdout || '') + (e.stderr || '') }; }
}
const число = (текст, шаблон) => { const м = текст.match(шаблон); return м ? м[1] : '?'; };

/* ── общая предпосылка: css вообще должен разбираться ────────────────────── */
/* 23.09 в style.css нашлась ЛИШНЯЯ закрывающая скобка (строка 9440, блок
   .sp-offer). Браузер такую ошибку молча проглатывает — страница рисовалась
   как ни в чём не бывало, — а любой инструмент, который считает структуру по
   скобкам, с этого места врёт. Скобка лежала в коде ещё с коммита 21.09.
   Проверка стоит первой: если файл не разбирается, всё остальное считает
   неизвестно что. */
const fs = require('fs');

/* ── общая предпосылка: копии общих правил обязаны совпадать ─────────────── */
/* js/kslt-rules.js лежит копией в mobile/www/js/ — Capacitor раскладывает ту
   папку и в Android, и в iOS. Сверял их tools/check-rules.js, но он НЕ ВХОДИЛ
   в этот бегунок и сгнил молча: 29.09 копии разошлись на 20 строк, и никто
   не узнал. ПРОВЕРКА, НЕ ВХОДЯЩАЯ В ОБЩИЙ БЕГУНОК, МОЛЧА ГНИЁТ — теперь
   входит. Сверяем содержимое, а не дату: дата у копии своя. */
{
    const свой = path.join(__dirname, '..', 'js/kslt-rules.js');
    const копия = path.join(__dirname, '..', 'mobile/www/js/kslt-rules.js');
    if (fs.readFileSync(свой, 'utf8') !== fs.readFileSync(копия, 'utf8')) {
        console.log('\n  \u2717 ОБЩИЕ ПРАВИЛА РАЗОШЛИСЬ\n');
        console.log('    js/kslt-rules.js и mobile/www/js/kslt-rules.js не совпадают.');
        console.log('    Приложение работает по своим правилам, сайт по своим.\n');
        process.exit(1);
    }
}

/* ── общая предпосылка: правила должны СЧИТАТЬ верно ─────────────────────── */
/* Заморозка читает файл как текст: она поймает исчезнувшую функцию, но не
   поймает функцию, которая осталась и стала считать неверно. Проба зовёт
   правила и сверяет числа. Браузера ей не надо — правила чистые. */
{
    const проба = прогнать('proba-pravil.js');
    if (!проба.ок) {
        console.log(проба.вывод);
        process.exit(1);
    }
}

['css/style.css', 'css/tokens.css'].forEach(ф => {
    const s = fs.readFileSync(path.join(__dirname, '..', ф), 'utf8')
        .replace(/\/\*[\s\S]*?\*\//g, м => м.replace(/[{}]/g, ' '));
    let d = 0, строка = 0, ушло = 0;
    s.split('\n').forEach((l, i) => {
        for (const ch of l) { if (ch === '{') d++; if (ch === '}') d--; }
        if (d < 0 && !ушло) { ушло = 1; строка = i + 1; }
    });
    if (d !== 0 || ушло) {
        console.log('');
        console.log('  ✗ ' + ф + ': скобки не сходятся, баланс ' + d +
                    (строка ? ', в минус ушло на строке ' + строка : ''));
        console.log('    Пока это не починено, остальные проверки считают структуру по битому файлу.');
        console.log('');
        process.exit(1);
    }
});

console.log('');
let плохо = 0;
КУСКИ.forEach(([имя, правила, откат]) => {
    const п = прогнать(правила);
    const строка = п.вывод.match(/\n\s{2}(ок|НЕ ТАК)[^\n]*/);
    if (!п.ок) {
        плохо++;
        console.log('  ✗ ' + имя.padEnd(22) + ' ПРАВИЛА НЕ ДЕРЖАТСЯ');
        console.log(п.вывод.split('\n').filter(l => l.trim().startsWith('✗')).join('\n'));
        return;
    }
    let хвост = (строка ? строка[0] : '').replace(/\s+/g, ' ').trim();
    if (!быстро) {
        const о = прогнать(откат);
        if (!о.ок) {
            плохо++;
            console.log('  ✗ ' + имя.padEnd(22) + ' правила зелёные, но ОТКАТ ИХ НЕ ДОКАЗАЛ');
            console.log(о.вывод.split('\n').filter(l => /[✗~?!]/.test(l)).slice(0, 6).join('\n'));
            return;
        }
        хвост += '   ·   откатов: ' + число(о.вывод, /все (\d+) откатов/);
    }
    console.log('  ✓ ' + имя.padEnd(22) + хвост);
});

console.log('');
if (плохо) { console.log('  НЕ ТАК  ' + плохо + ' из ' + КУСКИ.length + ' кусков разъехались с решениями'); console.log(''); process.exit(1); }
console.log('  ок      все ' + КУСКИ.length + ' закрытых кусков держатся' + (быстро ? ' (прувер пропущен)' : ''));
console.log('');
