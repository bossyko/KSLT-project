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

/* ИМЯ ПРАВИЛА ПЕРЕПИСАНО 08.11 ВМЕСТЕ С САМИМ ПРАВИЛОМ: оно держит
   теперь ПЛАНКУ, а не два числа, и числа в имени больше не носит.
   ЯКОРЬ, НАПИСАННЫЙ ЧИСЛОМ, СТАРЕЕТ ВМЕСТЕ С ЧИСЛОМ. */
['свести два срока в один', П,
 '      var нужно = спонсорПоказан ? SPLASH_SO_SPONSOROM_MS : SPLASH_MIN_MS;',
 '      var нужно = SPLASH_SO_SPONSOROM_MS;',
 'срока два, и оба в планке платформ'],

/* ── ОТКАТЫ НА ПРАВИЛА КУСКА «СПОНСОР РАЗ В СУТКИ» (08.11) ─────────── */

['поднять срок со спонсором выше планки Apple', П,
 '    var SPLASH_SO_SPONSOROM_MS = 2000;',
 '    var SPLASH_SO_SPONSOROM_MS = 3000;',
 'срока два, и оба в планке платформ'],

['вернуть показ спонсора на каждый запуск', П,
 '    if (спонсораУжеПоказывали()) return false;',
 '    /* показываем всегда */',
 'спонсора показываем раз в сутки'],

['считать сутки по часам устройства, а не по Бишкеку', П,
 '    if (В && typeof В.сегодня === \'function\') return В.сегодня();',
 '    return new Date().toISOString().slice(0, 10);',
 'сутки считаются по Бишкеку, а не по часам устройства'],

['снять подключение дома времени в приложении', Р,
 '<script src="js/kslt-vremya.js?v=1"></script>',
 '<!-- дом времени снят -->',
 'сутки считаются по Бишкеку, а не по часам устройства'],

['записывать день за попытку, а не за показ', П,
 '    if (показан) записатьПоказСпонсора();',
 '    записатьПоказСпонсора();',
 'день записывается за показ, а не за попытку'],

['снять защиту от запрета хранилища', П,
 '    } catch (e) { return false; }',
 '    } finally { void 0; }',
 'память не обязана быть'],

/* ── ОТКАТЫ НА ПОЯВЛЕНИЕ: РАЗМЫТИЕ + БЛИК (08.11) ─────────────────── */

['вернуть спонсору общее всплытие', К,
 '  animation: splashSponsorIn 0.65s cubic-bezier(.37, 0, .63, 1) 0.8s both;',
 '  animation: splashFadeUp 0.4s ease-out 0.9s both;',
 'спонсор проявляется из размытия, а не всплывает'],

['снять у коробки обрезку, и блик поедет по экрану', К,
 '.splash-sponsor-box {\n  position: relative;\n  overflow: hidden;',
 '.splash-sponsor-box {\n  position: relative;',
 'блик — слой на коробке, один проход'],

['пустить блик по кругу', К,
 'animation: splashSheen 0.75s cubic-bezier(.37, 0, .63, 1) 1.1s both;',
 'animation: splashSheen 0.75s cubic-bezier(.37, 0, .63, 1) 1.1s infinite;',
 'блик — слой на коробке, один проход'],

/* ЧИСЛО, ЖИВУЩЕЕ В ДВУХ ФАЙЛАХ. Двигаем блик за край экрана — правило
   обязано поймать расхождение между css и js. */
['увести конец блика за уход экрана', К,
 'animation: splashSheen 0.75s cubic-bezier(.37, 0, .63, 1) 1.1s both;',
 'animation: splashSheen 0.75s cubic-bezier(.37, 0, .63, 1) 1.8s both;',
 'движение успевает закончиться до ухода экрана'],

['укоротить экран так, что блик не успеет', П,
 '    var SPLASH_SO_SPONSOROM_MS = 2000;',
 '    var SPLASH_SO_SPONSOROM_MS = 1700;',
 'движение успевает закончиться до ухода экрана'],

['снять прикрытие «меньше движения» с экрана загрузки', К,
 '  .splash-logo,\n  .splash-tagline,',
 '  .zaglushka-bez-splesha,\n  .splash-tagline,',
 'экран загрузки уважает «меньше движения»'],

['оставить пульс свечения бесконечным при «меньше движения»', К,
 '  .splash-glow {\n    animation: none;',
 '  .splash-glow {\n    opacity: 0.5;',
 'экран загрузки уважает «меньше движения»'],

['отменить анимацию спонсора вместо снятия движения', К,
 '    animation-duration: 1ms;\n    animation-delay: 0ms;',
 '    animation: none;',
 '«меньше движения» снимает движение, а не показ'],

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
