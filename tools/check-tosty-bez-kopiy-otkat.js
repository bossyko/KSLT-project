/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КУСКА 203 ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-tosty-bez-kopiy-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/admin/core/constants.js', 'js/admin/sections/coaches.js',
                'js/admin/sections/news.js', 'pages/admin-en.html'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const С = 'js/admin/core/constants.js', Т = 'js/admin/sections/coaches.js',
      Н = 'js/admin/sections/news.js', П = 'pages/admin-en.html';

/* ИГОЛКА СОБИРАЕТСЯ ИЗ ЧАСТЕЙ: иначе прувер попадает в замер своего же
   сторожа — кусок 196 стоял на этих граблях дважды. */
const зов = 'show' + 'Toast(';

const ОТКАТЫ = [

/* ГЛАВНЫЙ ОТКАТ: ровно та беда, ради которой кусок и делался — ОДИН
   ТЕКСТ В ДВУХ МЕСТАХ. Первая редакция возвращала «Удалено», и повтора
   не выходило: остальные места уже на ключе, а один зашитый текст — не
   копия. Берётся текст, который ЕЩЁ СТОИТ зашитым в другом файле
   (`sections/users.js`), и тогда их становится два. */
['завести второе место с тем же текстом', Т,
 '    A.' + зов + "L.toastDeleted, 'success')",
 '    A.' + зов + "'Ошибка', 'success')",
 'ни один текст тоста не стоит в админке дважды'],

['снять общий ключ из словаря', С,
 "        toastSaved: 'Сохранено',",
 "        toastSavedСнят: 'Сохранено',",
 'общие ключи тостов заведены в словаре'],

/* ЧИСЛО ЗОВОВ СТРАХУЕТ ПРИЗНАК ВЫШЕ: откат уводит зов на свой текст,
   который в админке больше нигде не встречается, поэтому правило про
   повторы молчит, а замер числа падает. */
['увести один зов с общего ключа на свой текст', Н,
 '    A.' + зов + "L.toastDeleted, 'success')",
 '    A.' + зов + "'Статья убрана', 'success')",
 'общие ключи зовут из всех четырнадцати мест'],

['дать админке второй язык', П,
 "<script>window.location.replace('admin.html');</script>",
 '<script>/* перенаправления больше нет */</script>',
 'админка одноязычна, и перевод тостов не нужен']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-tost-'));
['js', 'pages', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-tosty-bez-kopiy.js')], { encoding: 'utf8' });
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
