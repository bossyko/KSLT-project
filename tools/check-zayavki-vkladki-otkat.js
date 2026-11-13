#!/usr/bin/env node
/** ПРУВЕР СТОРОЖА «ЗАЯВКИ ВКЛАДКАМИ». */
'use strict';
const fs = require('fs');
const path = require('path');
const os = require('os');
const { execFileSync } = require('child_process');

const корень = path.resolve(__dirname, '..');
function копия() {
    const двор = fs.mkdtempSync(path.join(os.tmpdir(), 'zayavki-vkladki-'));
    fs.mkdirSync(path.join(двор, 'tools'));
    fs.copyFileSync(path.join(корень, 'tools/check-zayavki-vkladki.js'), path.join(двор, 'tools/check-zayavki-vkladki.js'));
    /* ОТКАТУ ДОЛЖНО БЫТЬ ЧТО ПОРТИТЬ: сторож читает раздел, словарь и css. */
    fs.mkdirSync(path.join(двор, 'js/admin/sections'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'js/admin/core'), { recursive: true });
    fs.mkdirSync(path.join(двор, 'css'), { recursive: true });
    fs.copyFileSync(path.join(корень, 'js/admin/sections/users.js'), path.join(двор, 'js/admin/sections/users.js'));
    fs.copyFileSync(path.join(корень, 'js/admin/core/constants.js'), path.join(двор, 'js/admin/core/constants.js'));
    fs.copyFileSync(path.join(корень, 'css/admin.css'), path.join(двор, 'css/admin.css'));
    return двор;
}
const замена = (файл, было, стало) => function (двор) {
    const п = path.join(двор, файл);
    const т = fs.readFileSync(п, 'utf8');
    const n = т.split(было).length - 1;
    if (n < 1) return 'якорь не найден';
    if (n > 1) return 'якорь встречается ' + n + ' раз';
    fs.writeFileSync(п, т.replace(было, стало));
};
const У = 'js/admin/sections/users.js';

const ОТКАТЫ = [
    { имя: 'кнопка истории вернулась в ряд выгрузки',
      правка: замена(У, "'</div>' +\n\n            /* ЗАЯВКИ НА ПРИВЯЗКУ КАРТОЧКИ",
          "'<button class=\"ad-btn ad-btn-sm ad-btn-outline\" id=\"adLinkHistoryBtn\">' + L.linkHistory + '</button>' +\n            '</div>' +\n\n            /* ЗАЯВКИ НА ПРИВЯЗКУ КАРТОЧКИ"),
      ждём: /в ряду выгрузки нет/ },

    { имя: 'пропала вкладка решённых',
      правка: замена(У, 'data-usrlink="history"', 'data-usrlink="istoriya"'),
      ждём: /оба вида списка стоят вкладками/ },

    { имя: 'вкладки нарисованы своим классом',
      правка: замена(У, 'class="ad-rat-tabs" id="adUsrLinkTabs"', 'class="ad-usr-link-tabs" id="adUsrLinkTabs"'),
      ждём: /готовым компонентом/ },

    { имя: 'счётчик перестал браться из того же запроса',
      правка: замена(У, "var счёт = document.getElementById('adUsrLinkCount');", 'var счёт = null;'),
      ждём: /из того же запроса/ },

    { имя: 'ленивая загрузка истории снята',
      правка: замена(У, '            if (загружена) return;\n            загружена = true;\n', ''),
      ждём: /один раз за отрисовку/ },

    { имя: 'подпись вкладки зашита мимо словаря',
      правка: замена('js/admin/core/constants.js', "        linkPending: 'Ожидают решения',", ''),
      ждём: /живут в словаре/ },
];

let всего = 0, упало = 0;
for (const о of ОТКАТЫ) {
    всего++;
    const двор = копия();
    const беда = о.правка(двор);
    if (беда) { console.error('  ✗ ' + о.имя + ': ' + беда); fs.rmSync(двор, { recursive: true, force: true }); continue; }
    let вывод = '', код = 0;
    try { вывод = execFileSync(process.execPath, [path.join(двор, 'tools/check-zayavki-vkladki.js')], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }); }
    catch (e) { код = 1; вывод = (e.stdout || '') + (e.stderr || ''); }
    fs.rmSync(двор, { recursive: true, force: true });
    if (код && о.ждём.test(вывод)) { упало++; console.log('  ✓ ' + о.имя); }
    else if (!код) console.error('  ✗ ' + о.имя + ': сторож НЕ упал');
    else console.error('  ✗ ' + о.имя + ': упало не то:\n' + вывод.trim().split('\n').slice(0, 3).map(с => '      ' + с).join('\n'));
}
console.log('прувер заявок вкладками: ' + упало + ' из ' + всего);
process.exit(упало === всего ? 0 : 1);
