/**
 * ПРУВЕР СТОРОЖА ПРОСМОТРОВ.
 *
 * Каждый откат — настоящее прежнее состояние кода, а не выдуманное:
 * голый вызов мимо дома (так жили все шесть счётчиков до 11.11), заход
 * в загрузчике спонсоров (из-за чего site_visit стоял на нуле с 31
 * июля), два зова разом (так я сам сломал счёт на час, оставив старый
 * «чтобы не потерять»), молчание об ошибке ответа и страница без дома.
 */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'prosm-'));
    fs.cpSync(path.join(корень, 'js'), path.join(двор, 'js'), { recursive: true });
    fs.cpSync(path.join(корень, 'pages'), path.join(двор, 'pages'), { recursive: true });
    for (const ф of fs.readdirSync(корень)) {
        if (ф.endsWith('.html')) fs.copyFileSync(path.join(корень, ф), path.join(двор, ф));
    }
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-prosmotry.js'), path.join(двор, 'tools/check-prosmotry.js'));
    return двор;
}

function одно(файл, было, стало) {
    return function (двор) {
        const п = path.join(двор, файл);
        const т = fs.readFileSync(п, 'utf8');
        if (т.split(было).length - 1 !== 1) return `якорь встречается ${т.split(было).length - 1} раз`;
        fs.writeFileSync(п, т.replace(было, стало));
    };
}

const ОТКАТЫ = [
    {
        имя: 'счётчик тренеров снова зовётся голым, мимо дома',
        правка: одно('js/coaches.js',
            "window.KSLT_PROSMOTRY.считать(cl, 'increment_coach_view', { p_id: id });",
            "cl.rpc('increment_coach_view', { p_id: id });"),
        ждём: /голый вызов increment_coach_view/,
    },
    {
        имя: 'заход на сайт снова считается в загрузчике спонсоров',
        правка(двор) {
            const п = path.join(двор, 'js/sponsors-loader.js');
            const т = fs.readFileSync(п, 'utf8');
            fs.writeFileSync(п, т + "\nwindow.KSLT_PROSMOTRY.заход(window.supabaseClient);\n");
        },
        ждём: /заход считается в ДВУХ местах/,
    },
    {
        имя: 'заход убран вовсе — счётчик снова мёртв',
        правка: одно('js/script.js',
            'window.KSLT_PROSMOTRY.заход(window.supabaseClient);',
            '/* убрано */'),
        ждём: /заход на сайт не считается нигде/,
    },
    {
        имя: 'дом перестал смотреть на ошибку ответа',
        правка(двор) {
            const п = path.join(двор, 'js/kslt-prosmotry.js');
            let т = fs.readFileSync(п, 'utf8');
            т = т.replace(/if \(ответ && ответ\.error\) \{[\s\S]*?\n            \}/g, 'if (false) { }')
                 .replace(/console\.error/g, 'void 0');
            fs.writeFileSync(п, т);
        },
        ждём: /проверяет ответ базы 0 раз из двух/,
    },
    {
        имя: 'дом отвалился от части страниц',
        правка(двор) {
            const п = path.join(двор, 'index.html');
            const т = fs.readFileSync(п, 'utf8');
            const м = т.match(/\s*<script src="js\/kslt-prosmotry\.js[^>]*><\/script>/);
            if (!м) return 'подключения дома нет на главной';
            fs.writeFileSync(п, т.replace(м[0], ''));
        },
        ждём: /страниц без дома просмотров/,
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
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-prosmotry.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log(`  ✓ ${о.имя}`); }
    else if (!код) console.error(`  ✗ ${о.имя}: сторож НЕ упал`);
    else console.error(`  ✗ ${о.имя}: упало не то правило:\n${вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n')}`);
}
console.log(`прувер просмотров: ${упало} из ${всего}`);
process.exit(упало === всего ? 0 : 1);
