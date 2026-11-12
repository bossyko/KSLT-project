#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «РАССЫЛКА». */
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');

function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'rassylka-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-rassylka.js'), path.join(двор, 'tools/check-rassylka.js'));
    fs.mkdirSync(path.join(двор, 'js/admin/sections'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'js/admin/core'), { recursive: true });
    fs.copyFileSync(path.join(корень, 'js/admin/sections/broadcast.js'), path.join(двор, 'js/admin/sections/broadcast.js'));
    fs.copyFileSync(path.join(корень, 'js/admin/core/constants.js'), path.join(двор, 'js/admin/core/constants.js'));
    return двор;
}

const замена = (файл, было, стало) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n !== 1) return 'якорь встречается ' + n + ' раз';
    fs.writeFileSync(п, т.replace(было, стало));
};

const ОТКАТЫ = [
    { имя: 'подтверждение снято — рассылка уходит молча',
      правка: замена('js/admin/sections/broadcast.js',
          'var ok = await A.showConfirmAsync(L.broadcastConfirm, тело, L.broadcastSend);\n        if (!ok) return;',
          'var ok = true;\n        if (!ok) return;'),
      ждём: /подтверждение перед отправкой есть/ },

    { имя: 'счёт получателей выброшен',
      правка: замена('js/admin/sections/broadcast.js',
          'var вВыборке = await посчитатьПолучателей(audience);',
          'var вВыборке = null;'),
      ждём: /число людей в выборке считается/ },

    { имя: 'членства считаются без срока действия',
      правка: замена('js/admin/sections/broadcast.js',
          ".gte('expires_at', new Date().toISOString());",
          ';'),
      ждём: /отбор повторяет серверный/ },

    { имя: 'счёт стал писать в базу',
      правка: замена('js/admin/sections/broadcast.js',
          "var все = await A.client.from('profiles').select('id', { count: 'exact', head: true });",
          "var все = await A.client.from('profiles').update({ touched: true });"),
      ждём: /счёт — чтение, а не правка/ },

    { имя: 'строка про разницу убрана из словаря',
      правка: замена('js/admin/core/constants.js',
          "        broadcastSkolkoDoydyot:",
          "        broadcastSkolkoDoydyotУбрано:"),
      ждём: /разница «в выборке» и «получат» названа/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try {
        вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-rassylka.js')],
            { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    } catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 4).map(с => '      ' + с).join('\n'));
}
console.log('прувер рассылки: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
