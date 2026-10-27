/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КУСКА 201 ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-deystvie-nad-polzovatelem-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/admin/core/utils.js', 'js/admin/sections/users.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const У = 'js/admin/core/utils.js', П = 'js/admin/sections/users.js';

const ОТКАТЫ = [

['завести второй дом действия', У,
 '    A.adminAction = async function (действие, данные) {',
 '    A.adminAction = async function () {};\n    A.adminAction = async function (действие, данные) {',
 'дом действия над пользователем объявлен ровно один раз'],

/* ГЛАВНЫЙ ОТКАТ: дом перестаёт доносить ошибку — и кнопка показывает
   зелёный тост на несделанном деле. */
['заставить дом глотать ошибку сервера', У,
 "        if (отв && отв.error) throw new Error(отв.error);",
 "        if (отв && отв.error) return отв;",
 'дом доносит ошибку исключением, а не молча'],

/* ТОТ САМЫЙ МЁРТВЫЙ ЗОВ, С КОТОРОГО КУСОК И НАЧАЛСЯ. */
['снять дом и оставить зов в пустоту', У,
 '    A.adminAction = async function (действие, данные) {',
 '    A.adminActionСнят = async function (действие, данные) {',
 'мёртвых зовов через дом админки нет'],

['вернуть разделу пользователей свой fetch', П,
 "                await A.adminAction('unban_user', { user_id: userId });",
 "                await fetch(SUPABASE_URL + '/functions/v1/admin-manage-user', { method: 'POST' });",
 'раздел пользователей зовёт действия только домом']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-adm-'));
['js', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-deystvie-nad-polzovatelem.js')], { encoding: 'utf8' });
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
