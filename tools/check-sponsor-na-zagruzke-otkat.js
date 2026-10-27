/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КУСКА 205 ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-sponsor-na-zagruzke-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/kslt-sponsory.js', 'js/sponsors-loader.js', 'js/sponsors-page.js',
                'mobile/www/js/app.js', 'mobile/www/index.html', 'mobile/www/css/app.css'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const Д = 'js/kslt-sponsory.js', З = 'js/sponsors-loader.js', С = 'js/sponsors-page.js',
      П = 'mobile/www/js/app.js', Р = 'mobile/www/index.html', К = 'mobile/www/css/app.css';

const ОТКАТЫ = [

/* ГЛАВНЫЙ ОТКАТ: ровно та беда, которую правило нашло само — своё
   чтение таблицы на стороне показа. */
['вернуть странице спонсоров свой запрос', С,
 '        window.KSLT_SPONSORY.все().then(function (data) {',
 "        window.supabaseClient.from('sponsors').select('*').then(function (res) {\n            var data = res.data;",
 'таблицу спонсоров для показа читает только дом'],

['заставить загрузчик ходить в базу сам', З,
 '        var Д = window.KSLT_SPONSORY;',
 '        var Д = null;',
 'загрузчик сайта берёт список у дома'],

['утащить перемешивание в дом', Д,
 '    function генеральный() {',
 '    function тасовка() { return Math.random(); }\n    function генеральный() {',
 'перемешивание равных живёт в показе, а не в чтении'],

['отнять у дома память', Д,
 '            window.localStorage.setItem(ПАМЯТЬ, JSON.stringify({',
 '            void (ПАМЯТЬ, JSON.stringify({',
 'дом помнит последнего генерального и отдаёт его без сети'],

['положить в память лишние поля спонсора', Д,
 "                name: с.name || '', logo: с.logo || ''",
 "                name: с.name || '', logo: с.logo || '', phone: с.phone || ''",
 'в памяти лежат только имя и логотип'],

['заставить экран загрузки ждать базу', П,
 '    var показан = поставить(Д.изПамяти());',
 '    var показан = false;',
 'экран загрузки берёт спонсора из памяти и догоняет свежего'],

['свести два срока в один', П,
 '      var нужно = спонсорПоказан ? SPLASH_SO_SPONSOROM_MS : SPLASH_MIN_MS;',
 '      var нужно = SPLASH_SO_SPONSOROM_MS;',
 'срока два: без спонсора 1500, со спонсором 3000'],

['увести числа блока спонсора с токенов', К,
 '  gap: var(--space-3);\n  margin-top: var(--space-6);',
 '  gap: 13px;\n  margin-top: 25px;',
 'блок спонсора объявлен и стоит на токенах'],

['отнять у логотипа коробку постоянной высоты', К,
 '  height: 52px;\n  max-width: 200px;',
 '  max-width: 200px;',
 'логотип встаёт в коробку постоянной высоты'],

['показать пустой блок спонсора на первом запуске', Р,
 '<div class="splash-sponsor" id="splashSponsor" hidden>',
 '<div class="splash-sponsor" id="splashSponsor">',
 'разметка экрана загрузки держит блок спонсора скрытым'],

['поставить дом приложения позже его зовущих', Р,
 '<script src="js/kslt-sponsory.js?v=1"></script>\n',
 '',
 'в приложении дом спонсоров стоит раньше своих зовущих']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-spon-'));
['js', 'css', 'pages', 'maket', 'mobile', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));
fs.readdirSync(КОРЕНЬ).filter(ф => /^index.*\.html$/.test(ф))
    .forEach(ф => fs.cpSync(path.join(КОРЕНЬ, ф), path.join(песок, ф)));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-sponsor-na-zagruzke.js')], { encoding: 'utf8' });
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
