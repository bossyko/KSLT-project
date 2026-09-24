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
    ['о проекте',           'check-about.js',        'check-about-otkat.js']
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
