/**
 * ДОКАЗАТЕЛЬСТВО ЛЕСТНИЦЫ РОЛИ. На КОПИИ.
 *
 * Каждый откат возвращает ровно то, что было до круга 5, и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-lestnica-roli-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-lestnica-'));
['css', 'js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const T = 'css/tokens.css', C = 'css/admin.css', J = 'js/admin/sections/players.js';
const исходник = {};
[T, C, J].forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(замена) {
    [T, C, J].forEach(ф => {
        fs.writeFileSync(path.join(песок, ф),
            замена && замена.файл === ф ? замена.текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, 'tools', 'check-lestnica-roli.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/* ЯКОРЯ — на содержимом, которое живёт в блоке постоянно */
const Я_ГРАНИЦА = '  --success-border: var(--alpha-green-30);';
const Я_ПОДЛОЖКА = '  --success-subtle: var(--alpha-green-15);';
const Я_INFO = '  --info:           var(--blue-400);';
const Я_МЕНЕДЖЕР = '  --role-manager:        var(--violet-400);';
const Я_ON = '  --success-on:     var(--neutral-950);';
const Я_CSS = '\n.ad-status-badge {';
const Я_JS = 'var A = window.KSLT_ADMIN;';

const ОТКАТЫ = [
    ['снять у роли ступень границы', T,
     т => т.replace(Я_ГРАНИЦА, ''),
     'у каждой роли объявлены все три ступени'],

    ['сравнять границу с подложкой — рамка пропадёт', T,
     т => т.replace(Я_ГРАНИЦА, '  --success-border: var(--alpha-green-15);'),
     'граница строго ярче подложки, подложка строго ярче тусклой'],

    ['опустить подложку до тусклой', T,
     т => т.replace(Я_ПОДЛОЖКА, '  --success-subtle: var(--alpha-green-06);'),
     'граница строго ярче подложки, подложка строго ярче тусклой'],

    ['намешать ступень роли из чужого тона', T,
     т => т.replace(Я_ПОДЛОЖКА, '  --success-subtle: rgba(76, 175, 80, 0.15);'),
     'ступени роли намешаны из её же тона'],

    ['вернуть --info на #3B82F6 — замер 22.09 давал 4.19', T,
     т => т.replace(Я_INFO, '  --info:           var(--blue-500);'),
     'текст роли на своей подложке не ниже 4.5'],

    ['поставить белый поверх сплошной заливки успеха', T,
     т => т.replace(Я_ON, '  --success-on:     var(--neutral-white);'),
     'текст поверх сплошной заливки роли не ниже 4.5'],

    ['увести менеджера в синий — роль станет копией сведений', T,
     т => т.replace(Я_МЕНЕДЖЕР, '  --role-manager:        var(--blue-400);'),
     'роли различимы по тону не меньше чем на 25°'],

    ['вернуть тон роли числом в admin.css', C,
     т => т.replace(Я_CSS, '.ad-порча { color: #2ED573; }\n' + Я_CSS),
     'тон роли не написан числом в слое админки'],

    ['вернуть тон роли в записи rgba в js/admin', J,
     т => т.replace(Я_JS, 'var _порча = \'<i style="color:rgba(255, 71, 87, 0.9)"></i>\';\n    ' + Я_JS),
     'тон роли не написан числом в слое админки'],
];

console.log('');
const якорей = [[T, Я_ГРАНИЦА], [T, Я_ПОДЛОЖКА], [T, Я_INFO], [T, Я_МЕНЕДЖЕР], [T, Я_ON],
                [C, Я_CSS], [J, Я_JS]];
const нетЯкоря = якорей.filter(([ф, я]) => исходник[ф].split(я).length !== 2);
if (нетЯкоря.length) {
    console.log('  БЕДА    якорь не единственный или отсутствует: ' +
        нетЯкоря.map(([ф, я]) => ф + ' / ' + я.trim()).join(' | ') + '\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else if (прогон(null).упало) {
    console.log('  БЕДА    исходный код правила НЕ проходит — откаты бессмысленны\n');
    fs.rmSync(песок, { recursive: true, force: true });
    process.exitCode = 1;
} else {
    console.log('  база    исходный код правила проходит\n');
    let плохих = 0;
    ОТКАТЫ.forEach(([имя, ф, порча, ждём]) => {
        const испорчен = порча(исходник[ф]);
        if (испорчен === исходник[ф]) {
            console.log('  ? ' + имя + '  ->  якорь не сработал'); плохих++; return;
        }
        const р = прогон({ файл: ф, текст: испорчен });
        if (!р.упало) { console.log('  x ' + имя + '  ->  правило НЕ упало'); плохих++; }
        else if (р.вывод.indexOf(ждём) === -1) {
            console.log('  ~ ' + имя + '  ->  упало ДРУГОЕ. Ждали: ' + ждём); плохих++;
        } else console.log('  v ' + имя + '  ->  «' + ждём + '»');
    });
    прогон(null);
    fs.rmSync(песок, { recursive: true, force: true });
    console.log('');
    if (плохих === 0) {
        console.log('  ок      все ' + ОТКАТЫ.length + ' откатов доказали свои правила');
        console.log('          оригиналы не трогались — работа шла на копии\n');
    } else {
        console.log('  НЕ ТАК  ' + плохих + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
        process.exitCode = 1;
    }
}
