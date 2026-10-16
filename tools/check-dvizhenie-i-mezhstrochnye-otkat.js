/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ДВИЖЕНИЕ И МЕЖСТРОЧНЫЕ» ОТКАТОМ. На КОПИИ.
 *
 * Прувер легко подпереть обманом: поставить межстрочный больше трёх —
 * правило промолчит, потому что это уже не отношение, а пиксели без
 * единицы, и ловит их другое правило. Один откат нарочно такой, и от
 * него ждётся МОЛЧАНИЕ.
 *
 *   node tools/check-dvizhenie-i-mezhstrochnye-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const врем = fs.mkdtempSync(path.join(os.tmpdir(), 'b4-otkat-'));
fs.mkdirSync(path.join(врем, 'css'));
fs.mkdirSync(path.join(врем, 'tools'));
fs.readdirSync(path.join(КОРЕНЬ, 'css')).forEach(ф =>
    fs.copyFileSync(path.join(КОРЕНЬ, 'css', ф), path.join(врем, 'css', ф)));
['check-dvizhenie-i-mezhstrochnye.js', 'dvizhenie.js'].forEach(ф =>
    fs.copyFileSync(path.join(__dirname, ф), path.join(врем, 'tools', ф)));

const чистый = {};
['css/tokens.css', 'css/style.css', 'css/services.css', 'css/admin.css', 'css/dashboard.css']
    .forEach(ф => { чистый[ф] = fs.readFileSync(path.join(врем, ф), 'utf8'); });

function прогон() {
    try {
        return { код: 0, вывод: execFileSync('node',
            [path.join(врем, 'tools', 'check-dvizhenie-i-mezhstrochnye.js')], { encoding: 'utf8' }) };
    } catch (e) { return { код: 1, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const Т = 'css/tokens.css', С = 'css/style.css', У = 'css/services.css',
      А = 'css/admin.css', К = 'css/dashboard.css';

const ОТКАТЫ = [

['вернуть перечень имён вместо звёздочки', Т,
 '    *,\n    *::before,\n    *::after {',
 '    .db-mobile-tab,\n    .site-header,\n    .pl-row {',
 'движение выключается одним общим местом'],

['вернуть `none` вместо 0.01ms — элемент застрянет невидимым', Т,
 'animation-duration: 0.01ms !important;',
 'animation: none !important;',
 'движение выключается одним общим местом'],

['снять гашение переходов', Т,
 'transition-duration: 0.01ms !important;',
 'transition-property: color;',
 'движение выключается одним общим местом'],

['завести свою копию блока в админке', А,
 '.ad-qual-note {',
 '@media (prefers-reduced-motion: reduce) {\n    .ad-qual-note { animation: none; }\n}\n\n.ad-qual-note {',
 'копии общего блока не заводятся по файлам'],

['завести свою копию блока в кабинете', К,
 '.db-loy-redeem-item.is-off {',
 '@media (prefers-reduced-motion: reduce) {\n    .db-sidebar-link { transition: none; }\n}\n\n.db-loy-redeem-item.is-off {',
 'копии общего блока не заводятся по файлам'],

['отнять у ленты логотипов прокрутку — останется стоп', С,
 '        overflow-x: auto;\n        mask-image: none;',
 '        mask-image: none;',
 'ленте логотипов отдают прокрутку, а не просто стоп'],

['отнять у ленты услуг прокрутку', У,
 '    .sv-carousel-wrap {\n        overflow-x: auto;\n    }',
 '    .sv-carousel-wrap {\n        overflow: hidden;\n    }',
 'ленте услуг отдают прокрутку, а не просто стоп'],

['вернуть межстрочный мимо ступени', А,
 '.ad-stat-label {\n    font-size',
 '.ad-stat-label { line-height: 1.45; }\n\n.ad-stat-label {\n    font-size',
 'каждый межстрочный стоит на ступени лестницы'],

/* ── ОБМАН: это не отношение, а пиксели без единицы ── */
['поставить межстрочный больше трёх — ловит другое правило', А,
 '.ad-stat-value {\n    font-size',
 '.ad-stat-value { line-height: 24; }\n\n.ad-stat-value {\n    font-size',
 null]

];

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    console.log(база.вывод);
    fs.rmSync(врем, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');

    let бед = 0;
    ОТКАТЫ.forEach(([имя, ф, якорь, замена, ждём]) => {
        const было = чистый[ф];
        const сколько = было.split(якорь).length - 1;
        if (сколько !== 1) {
            console.log('  ✗ ' + имя + '  ->  якорь встречается ' + сколько + ' раз, нужен ровно один');
            бед++;
            return;
        }
        fs.writeFileSync(path.join(врем, ф), было.replace(якорь, замена));
        const р = прогон();
        fs.writeFileSync(path.join(врем, ф), было);

        if (ждём === null) {
            if (р.код === 0) console.log('  v ' + имя + '  ->  молчит, и это верно');
            else { console.log('  ✗ ' + имя + '  ->  правило заговорило там, где не его дело'); бед++; }
            return;
        }
        if (р.код === 0) { console.log('  ✗ ' + имя + '  ->  правило НЕ упало, откат ничего не доказал'); бед++; }
        else if (р.вывод.indexOf(ждём) === -1) { console.log('  ✗ ' + имя + '  ->  упало ДРУГОЕ правило, не «' + ждём + '»'); бед++; }
        else console.log('  v ' + имя + '  ->  «' + ждём + '»');
    });

    fs.rmSync(врем, { recursive: true, force: true });

    if (бед === 0) {
        console.log('\n  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
        console.log('          оригиналы не трогались — работа шла на копии\n');
    } else {
        console.log('\n  НЕ ТАК  ' + бед + ' откатов не доказали ничего\n');
        process.exitCode = 1;
    }
}
