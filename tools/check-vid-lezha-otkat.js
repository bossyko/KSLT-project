/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ «ТЕЛЕФОН ЛЁЖА» ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-vid-lezha-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['css/live-match.css', 'css/tokens.css', 'css/services.css', 'css/style.css',
                'tests/e2e/features/16-live-match.spec.js',
                'tests/e2e/design-system/63-uslugi.spec.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Ж = 'css/live-match.css', Т = 'css/tokens.css', У = 'css/services.css',
      С = 'css/style.css', ПЛ = 'tests/e2e/features/16-live-match.spec.js',
      ПУ = 'tests/e2e/design-system/63-uslugi.spec.js';

const ОТКАТЫ = [

['вернуть шапку в полноэкранное табло', Ж,
 '    header.floating-header { display: none; }',
 '    header.floating-header { display: block; }',
 'табло лёжа снимает шапку и подвал'],

['опустить цель нажатия лёжа', Ж,
 '    .lm-back-link { min-height: var(--btn-h-md);',
 '    .lm-back-link { min-height: 36px;',
 'цель нажатия лёжа остаётся на шкале'],

['задать полу обложки высоту на низком горизонтальном', Т,
 '    --oblozhka-pol: 0px;',
 '    --oblozhka-pol: 275px;',
 'пол обложки лёжа — ноль, и это решение, а не недосмотр'],

/* ГЛАВНЫЙ ОТКАТ КУСКА: ровно та беда, которую поймал полный прогон. */
['вернуть перебивку шага ленты на телефоне лёжа', У,
 '    .sv-players-box {',
 '    .sv-carousel { --sv-shag: 9s; }\n\n    .sv-players-box {',
 'шаг ленты услуг не перебивается на телефоне лёжа'],

['развести шаги двух лент', У,
 '        --sv-shag: 11s;',
 '        --sv-shag: 7s;',
 'лента услуг на узком виде едет шагом ленты спонсоров'],

['отнять у пробы табло знание о полноэкранном режиме', ПЛ,
 "            if (await низкийЛёжа(page)) {\n                await expect(page.locator('header'),\n" +
 "                    'лёжа табло полноэкранное — шапки быть не должно (решение 25.09)').toBeHidden();\n" +
 "            } else {\n                await expect(page.locator('header')).toBeVisible();\n            }",
 "            await expect(page.locator('header')).toBeVisible();",
 'проба табло знает про полноэкранный режим в обоих местах'],

['отнять у пробы услуг знание о нулевом поле', ПУ,
 "                низкийЛёжа: matchMedia('(max-height: 500px) and (orientation: landscape)').matches,",
 '                низкийЛёжа: false,',
 'проба услуг знает про нулевой пол обложки']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lezha-'));
['css', 'js', 'tests', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-vid-lezha.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

console.log('');
const база = прогон(null);
if (база.упало) {
    console.log('  НЕ ТАК  исходники сами по себе не проходят правило.');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}
console.log('  база    исходный код правила проходит');
console.log('');

let плохих = 0;
ОТКАТЫ.forEach(([имя, ф, что, на, ждём]) => {
    const сколько = исходник[ф].split(что).length - 1;
    if (сколько === 0) { console.log('  ? ' + имя); console.log('      якоря нет в ' + ф); плохих++; return; }
    const р = прогон({ файл: ф, текст: исходник[ф].split(что).join(на) });
    if (!р.упало) { console.log('  ✗ ' + имя); console.log('      правило не упало — значит оно ничего не держит'); плохих++; }
    else if (р.вывод.indexOf(ждём) === -1) {
        console.log('  ~ ' + имя); console.log('      упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
    } else console.log('  ✓ ' + имя + '  →  «' + ждём + '»');
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохих) { console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило'); console.log(''); process.exit(1); }
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
console.log('          оригиналы не изменялись — работа шла на копии');
console.log('');
