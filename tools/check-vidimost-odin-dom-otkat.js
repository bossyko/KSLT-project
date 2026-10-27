/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ ВИДИМОСТИ ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-vidimost-odin-dom-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['tests/fixtures.js', 'tests/e2e/design-system/94-lico.spec.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Ф = 'tests/fixtures.js', Л = 'tests/e2e/design-system/94-lico.spec.js';

const ОТКАТЫ = [

['завести второй дом видимости', Ф,
 'function виден(эл) {',
 'function виден(эл) { return !!эл; }\nfunction виден(эл) {',
 'дом видимости объявлен в фикстуре ровно один раз'],

/* ГЛАВНЫЙ ОТКАТ КУСКА: дом снова смотрит ОДИН узел — ровно то, на чём
   упала проба 94. Предки остаются неопрошенными. */
['вернуть дому слепоту к предкам', Ф,
 '    var у = эл;\n    while (у) {',
 '    var у = эл;\n    while (false) {',
 'дом поднимается по предкам, а не смотрит один узел'],

['отнять у дома прямоугольник', Ф,
 '    if (!r.width || !r.height) return false;',
 '    if (false) return false;',
 'дом смотрит и прямоугольник'],

['объявить дом ПОСЛЕ загрузки страницы', Ф,
 "        await context.addInitScript('window.КСЛТ_виден = ' + виден.toString() + ';');",
 "        /* объявлено позже: проба дома не увидит */",
 'дом объявляется ДО загрузки страницы'],

/* ИГОЛКИ В ОТКАТАХ СОБИРАЮТСЯ ИЗ ЧАСТЕЙ — иначе ПРУВЕР попадает в замер
   своего же сторожа: первая редакция дала 64 вместо 61, и три лишних
   «подсчёта» жили в тексте откатов ниже. Сторож читает песок целиком,
   а прувер лежит в песке. */
['вернуть пробе лица свой подсчёт видимости', Л,
 '            const видимые = кружки.filter(э => window.КСЛТ_виден(э));',
 '            const видимые = кружки.filter(э => {\n' +
 '                const с = getComputedStyle(э);\n' +
 '                return с.disp' + 'lay !' + "== 'none' && с.visib" + 'ility !' + "== 'hidden';\n" +
 '            });',
 'проба лица зовёт дом, а не считает видимость сама'],

['вернуть пробе лица ожидание временем', Л,
 '    await page.waitForFunction(() => !!window.KSLT_LICO, null, { timeout: 5000 });',
 '    await page.waitForTimeout(400);',
 'проба лица ждёт признак, а не время'],

/* ХРАПОВИК: новый свой подсчёт в любой пробе роняет правило. */
['завести новый свой подсчёт видимости', Л,
 '    test(\'кружки не пусты и не схлопнуты\', async ({ page }) => {',
 '    test(\'кружки не пусты и не схлопнуты\', async ({ page }) => {\n' +
 '        void (el => getComputedStyle(el).disp' + 'lay !' + "== 'none');\n" +
 '        void (el => getComputedStyle(el).visib' + 'ility !' + "== 'hidden');\n" +
 '        void (el => el.offset' + 'Parent);',
 'своих подсчётов видимости не больше потолка']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-vid-'));
['tests', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-vidimost-odin-dom.js')], { encoding: 'utf8' });
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
