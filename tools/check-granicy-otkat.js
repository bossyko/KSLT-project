/**
 * ПРУВЕР СТОРОЖА ГРАНИЦ РАСКЛАДКИ.
 *
 * Откаты настоящие: декоративная ширина мимо шкалы (их было двадцать
 * восемь при заявленных пяти), щель между парой, справочник, объявляющий
 * границу, которой в коде нет, и ШОВ — порог в js, разошедшийся с
 * условием в css. Последний и есть h264, воспроизведённый 11.11 мной же
 * в другую сторону: CSS подняли до 992, а УЗКО в скрипте забыли.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'gran-'));
    fs.cpSync(path.join(корень, 'css'), path.join(двор, 'css'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'js'));
    fs.copyFileSync(path.join(корень, 'js/script.js'), path.join(двор, 'js/script.js'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-granicy.js'), path.join(двор, 'tools/check-granicy.js'));
    /* С 12.11 сторож читает ещё и пробы, и справочник границ: без них
       откат падал бы на «файла нет», а не на своём правиле. */
    fs.cpSync(path.join(корень, 'tools/lib'), path.join(двор, 'tools/lib'), { recursive: true });
    fs.cpSync(path.join(корень, 'tests'), path.join(двор, 'tests'), { recursive: true,
        filter: и => !/node_modules|[\\/]reports([\\/]|$)|test-results/.test(и) });
    return двор;
}

const ОТКАТЫ = [
    {
        имя: 'проба снова судит ширину зашитым числом 768',
        правка(двор) {
            const п = path.join(двор, 'tests/e2e/design-system/30-ritm-pervogo-ekrana.spec.js');
            const т = fs.readFileSync(п, 'utf8');
            const было = 'ширина <= ГРАНИЦА_ТЕЛЕФОНА';
            if (т.split(было).length - 1 < 1) return 'в пробе нет сравнения через справочник';
            fs.writeFileSync(п, т.replace(было, 'ширина <= 768'));
        },
        ждём: /проба сравнивает ширину с числом мимо справочника границ/,
    },
    {
        имя: 'декоративная ширина вернулась в медиа-условие',
        правка(двор) {
            const п = path.join(двор, 'css/style.css');
            const т = fs.readFileSync(п, 'utf8');
            const м = т.match(/@media\s*\(max-width:\s*992px\)/);
            if (!м) return 'в style.css нет границы 992';
            fs.writeFileSync(п, т.replace(м[0], '@media (max-width: 1023.98px)'));
        },
        ждём: /мимо шкалы \(разрешены 640, 641, 992, 993\)/,
    },
    {
        имя: 'шов: порог в скрипте разошёлся с условием в css',
        правка(двор) {
            const п = path.join(двор, 'js/script.js');
            const т = fs.readFileSync(п, 'utf8');
            if (т.split('var УЗКО = 992;').length - 1 !== 1) return 'якорь УЗКО не единственный';
            fs.writeFileSync(п, т.replace('var УЗКО = 992;', 'var УЗКО = 640;'));
        },
        ждём: /описано разными числами/,
    },
    {
        имя: 'порог в скрипте пропал вовсе',
        правка(двор) {
            const п = path.join(двор, 'js/script.js');
            const т = fs.readFileSync(п, 'utf8');
            fs.writeFileSync(п, т.replace('var УЗКО = 992;', 'var УЗКО_ПОРОГ = 992;').replace(/УЗКО(?![_А-Яа-я])/g, 'УЗКО_ПОРОГ'));
        },
        ждём: /порог УЗКО для гармошки подвала не найден/,
    },
    {
        имя: 'справочник в tokens.css перестал называть границу',
        правка(двор) {
            const п = path.join(двор, 'css/tokens.css');
            const т = fs.readFileSync(п, 'utf8');
            const i = т.indexOf('БРЕЙКПОИНТЫ');
            if (i < 0) return 'раздела 9 нет';
            const хвост = т.slice(i).replace('992px', '992px'.replace('992', '99' + '2')).replace('992px', 'девятьсот девяносто два');
            fs.writeFileSync(п, т.slice(0, i) + хвост);
        },
        ждём: /справочник не называет границу 992px/,
    },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error(`  ✗ ${о.имя}: ${беда}`); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-granicy.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер границ: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);
