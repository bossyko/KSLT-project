/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КОПИЙ ОТКАТОМ.
 *
 * «У меня зелёное» ничего не доказывает. Каждое правило
 * `check-mobilnye-kopii.js` проверяем обратным ходом на КОПИИ дерева:
 * ломаем ровно то отношение, за которое правило отвечает, и ждём, что упадёт
 * ИМЕННО ОНО.
 *
 * Копируем только `tools`, `js`, `css`, `images` и `mobile/www` —
 * `mobile/node_modules` весит больше всего остального вместе взятого и к делу
 * не относится. `images` нужны потому, что обложки новостей тоже лежат в
 * приложении копией, и сторож сверяет их байтами.
 *
 *   node tools/check-mobilnye-kopii-otkat.js
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ВРЕМ = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-mobil-'));
['tools', 'js', 'css', 'images'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(ВРЕМ, д), { recursive: true }));
fs.mkdirSync(path.join(ВРЕМ, 'mobile'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'mobile', 'www'), path.join(ВРЕМ, 'mobile', 'www'), { recursive: true });

function прогон() {
    try {
        execFileSync('node', [path.join(ВРЕМ, 'tools/check-mobilnye-kopii.js')],
            { cwd: ВРЕМ, encoding: 'utf8' });
        return [];
    } catch (e) {
        return String(e.stdout || '').split('\n')
            .filter(с => с.trim().startsWith('✗'))
            .map(с => с.replace(/^\s*✗\s*/, '').trim());
    }
}

/** Каждый откат: что сделать на копии, что вернуть обратно, какое правило ждём. */
const ОТКАТЫ = [
    {
        имя: 'правка доехала до сайта и не доехала до приложения',
        ждём: 'копии, которые совпадали, совпадают до сих пор',
        сломать() {
            const ф = path.join(ВРЕМ, 'js/kslt-rules.js');
            const было = fs.readFileSync(ф, 'utf8');
            fs.writeFileSync(ф, было + '\n/* правка, которая не доехала до приложения */\n');
            return () => fs.writeFileSync(ф, было);
        }
    },
    {
        имя: 'в приложении завелась новая копия файла сайта',
        ждём: 'новых копий без записи в таблицу не заводится',
        сломать() {
            const откуда = path.join(ВРЕМ, 'js/kslt-otsechka.js');
            const куда = path.join(ВРЕМ, 'mobile/www/js/kslt-otsechka.js');
            fs.copyFileSync(откуда, куда);
            return () => fs.unlinkSync(куда);
        }
    },
    {
        имя: 'копия сошлась с сайтом, а в долге осталась',
        ждём: 'сведённая копия вычёркивается из долга, а не остаётся в нём',
        /* ЯКОРЬ ПЕРЕЕХАЛ 26.10, КУСОК 177: `bracket-draw.js` СВЕДЁН и из долга
           вычеркнут, и откат на нём перестал что-либо доказывать — он копировал
           файл, который и так совпадает. Взят `auth.js`: он в долге НАДОЛГО,
           потому что вход приложения и вход сайта это две разные реализации
           (общих функций 10 при 24 и 38), а не отставшая копия. ЯКОРЬ ДЕРЖИТСЯ
           НА ТОМ, ЧТО ЖИВЁТ В ДОЛГЕ ДОЛЬШЕ ВСЕХ. */
        сломать() {
            const сайт = path.join(ВРЕМ, 'js/auth.js');
            const ф = path.join(ВРЕМ, 'mobile/www/js/auth.js');
            const было = fs.readFileSync(ф);
            fs.copyFileSync(сайт, ф);
            return () => fs.writeFileSync(ф, было);
        }
    }
];

let плохо = 0;
console.log('');
ОТКАТЫ.forEach((о, и) => {
    const вернуть = о.сломать();
    const упали = прогон();
    вернуть();
    if (упали.indexOf(о.ждём) === -1) {
        console.log('  ✗ откат ' + (и + 1) + ' (' + о.имя + '): ждали «' + о.ждём + '»');
        console.log('    упало: ' + (упали.length ? упали.join(' · ') : '— ничего —'));
        плохо++;
    } else {
        console.log('  ок  ' + String(и + 1).padStart(2) + '  ' + о.ждём +
            (упали.length > 1 ? '   (+ ещё ' + (упали.length - 1) + ')' : ''));
    }
});

fs.rmSync(ВРЕМ, { recursive: true, force: true });
console.log('');
if (плохо === 0) {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
    console.log('');
    process.exit(0);
}
console.log('  НЕ ТАК  прувер: ' + плохо + ' откатов из ' + ОТКАТЫ.length + ' не доказали правило');
console.log('');
process.exit(1);
