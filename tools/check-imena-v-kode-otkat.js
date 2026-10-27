#!/usr/bin/env node
/**
 * ПРУВЕР ЗАМОРОЗКИ ИМЁН (кусок 206).
 *
 * Работает на КОПИИ: песок собирается один раз, в нём по одному возвращается
 * прежнее значение, и требуется, чтобы упало ИМЕННО то правило, которое за
 * это отвечает. «У меня зелёное» ничего не доказывает.
 *
 * Запуск: node tools/check-imena-v-kode-otkat.js
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { spawnSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-imena-'));

function копировать(отн) {
    const откуда = path.join(КОРЕНЬ, отн);
    const куда = path.join(песок, отн);
    if (!fs.existsSync(откуда)) return;
    fs.mkdirSync(path.dirname(куда), { recursive: true });
    fs.cpSync(откуда, куда, { recursive: true });
}

/* Песок: всё, что читает линтер и сторож. `tests/reports` линтер и так
   пропускает — его не копируем, иначе песок весит 55 МБ. */
['eslint.config.mjs', 'package.json', 'js', 'mobile/www/js', 'tools',
 'tests/e2e', 'tests/unit', 'tests/seed.js', 'tests/fixtures.js'].forEach(копировать);
/* node_modules не копируем — линтер один и тот же, подкладываем ссылкой */
try {
    fs.symlinkSync(path.join(КОРЕНЬ, 'node_modules'), path.join(песок, 'node_modules'), 'dir');
} catch (e) { /* уже есть */ }

function прогон() {
    const з = spawnSync(process.execPath, [path.join(песок, 'tools', 'check-imena-v-kode.js')], {
        encoding: 'utf8',
        env: Object.assign({}, process.env, { KSLT_KOREN: песок })
    });
    return { код: з.status, вывод: (з.stdout || '') + (з.stderr || '') };
}

function правка(отн, было, стало) {
    const п = path.join(песок, отн);
    const т = fs.readFileSync(п, 'utf8');
    const сколько = т.split(было).length - 1;
    if (сколько !== 1) {
        return 'ЯКОРЬ встречается ' + сколько + ' раз в ' + отн + ': ' + было.slice(0, 60);
    }
    fs.writeFileSync(п, т.replace(было, стало));
    return null;
}

function вернуть(отн) {
    fs.copyFileSync(path.join(КОРЕНЬ, отн), path.join(песок, отн));
}

console.log('');
const база = прогон();
if (база.код !== 0) {
    console.log('  БЕДА    в песке правила НЕ проходят — откаты бессмысленны\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
    return;
}
console.log('  база    копия проходит все правила\n');

const ОТКАТЫ = [
    ['храповик долга поднят обратно на 53', 'tools/check-rules.js',
     'const ДОЛГ_ЛИНТЕРА = 0;', 'const ДОЛГ_ЛИНТЕРА = 53;',
     'долг линтера равен нулю'],

    ['линтер снова по трём папкам', 'tools/check-rules.js',
     "spawnSync(линтер, ['.'],", "spawnSync(линтер, ['js', 'mobile/www/js', 'tools'],",
     'проверка имён гоняет весь корень'],

    ['обход домов снова только по сайту', 'eslint.config.mjs',
     "    обойти('mobile/www/js');\n", '',
     'обход идёт и по приложению'],

    ['признак глобальной функции снят', 'eslint.config.mjs',
     "            for (const м of т.matchAll(/^function\\s+([A-Za-zА-Яа-яЁё_$][\\w$А-Яа-яЁё]*)\\s*\\(/gm)) имена[м[1]] = 'readonly';\n", '',
     'глобальная функция без отступа тоже считается домом'],

    ['дубли ключей перестали быть ошибкой у инструментов', 'eslint.config.mjs',
     "            'no-undef': 'error',\n            'no-dupe-keys': 'error',\n            'no-unreachable': 'error'\n        }\n    }\n];",
     "            'no-undef': 'error',\n            'no-unreachable': 'error'\n        }\n    }\n];",
     'оба блока настроек ловят неопределённые имена и дубли ключей'],

    ['инструменты снова читаются как script', 'eslint.config.mjs',
     "            sourceType: 'commonjs',", "            sourceType: 'script',",
     'инструменты читаются как commonjs'],

    ['экран рейтинга снова без дома входа', 'mobile/www/js/screens/rating.js',
     '  var AUTH = window.KSLT_AUTH;\n', '',
     'экран рейтинга приложения знает дом входа'],

    ['профиль снова зовёт несуществующее имя', 'mobile/www/js/screens/profile.js',
     'closeSubOverlay(ov);\n            P.load();', 'closeSubOverlay(ov);\n            renderProfile();',
     'профиль приложения зовёт отрисовку своим именем'],

    ['ключ «место проведения» объявлен снова дважды', 'mobile/www/js/i18n.js',
     "    'td.fee':       {", "    'td.venue':     { ru: 'Место',        en: 'Venue',       kg: 'Орду' },\n    'td.fee':       {",
     'ключ «место проведения» объявлен один раз'],

    ['ключ «онлайн» объявлен снова дважды', 'js/services.js',
     "invite: 'Предложить игру',", "invite: 'Предложить игру', online: 'недавно заходил',",
     'ключ «онлайн» объявлен один раз на язык'],

    ['заморозка имён снята из общего прогона', 'tools/check-vse.js',
     "    ['имена в коде', 'check-imena-v-kode.js',\n     'check-imena-v-kode-otkat.js']",
     "    ['место для имён', 'check-net-takogo.js', 'check-net-takogo-otkat.js']",
     'заморозка имён входит в общий прогон'],

    ['в код вернули имя, которого нет', 'mobile/www/js/screens/rating.js',
     "  var R = window.KSLT_RATING = {};",
     "  var R = window.KSLT_RATING = {};\n  R.проба = function () { return НетТакогоИмени; };",
     'линтер по всему корню чист']
];

let плохо = 0;
ОТКАТЫ.forEach(function (о, i) {
    const [имя, файл, было, стало, ждём] = о;
    const беда = правка(файл, было, стало);
    let строка = '  ' + String(i + 1).padStart(2) + '. ' + имя;
    if (беда) {
        console.log(строка + '\n      ✗ ' + беда);
        плохо++;
        return;
    }
    const р = прогон();
    вернуть(файл);
    const упалоСвоё = р.код !== 0 && р.вывод.indexOf('✗ ' + ждём) >= 0;
    if (упалоСвоё) {
        console.log(строка + '\n      ✓ упало своё правило: ' + ждём);
    } else {
        плохо++;
        console.log(строка + '\n      ✗ ждали падения правила «' + ждём + '», код ' + р.код);
        console.log(р.вывод.split('\n').filter(с => /✗|БЕДА|ок /.test(с)).slice(0, 4)
            .map(с => '        ' + с.trim()).join('\n'));
    }
});

fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (плохо) {
    console.log('  БЕДА    откатов не доказали своих правил: ' + плохо + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила\n');
}
