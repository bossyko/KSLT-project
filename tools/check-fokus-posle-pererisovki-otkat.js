/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КУСКА 200 ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-fokus-posle-pererisovki-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['js/player.js', 'js/admin/sections/bracket.js',
                'js/admin/sections/tournaments.js',
                'tests/e2e/design-system/76-stranica-igroka.spec.js'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const И = 'js/player.js', С = 'js/admin/sections/bracket.js',
      Т = 'js/admin/sections/tournaments.js',
      П = 'tests/e2e/design-system/76-stranica-igroka.spec.js';

const ОТКАТЫ = [

/* ГЛАВНЫЙ ОТКАТ: ровно та беда, которую проба ловила через раз. */
['вернуть потерю фокуса на перерисовке', И,
 "            if (!overlay.contains(document.activeElement)) {\n                try { btn.focus(); } catch (e) {}\n            }\n",
 '',
 'кнопка закрытия после перерисовки забирает фокус назад'],

['отбирать фокус у того, кто уже внутри окна', И,
 '            if (!overlay.contains(document.activeElement)) {\n                try { btn.focus(); } catch (e) {}\n            }',
 '            try { btn.focus(); } catch (e) {}',
 'фокус не отбирается у того, кто уже внутри окна'],

/* ПУСТОЕ ОКНО И ОКНО С ДАННЫМИ ПЕРЕРИСОВЫВАЮТСЯ ПО-РАЗНОМУ, а фокус
   теряют одинаково: откат оставляет один путь мимо общей кнопки. */
/* ЯКОРЬ РАЗЛИЧАЕТ ДВА ЗОВА ОТСТУПОМ: в `then` он на шестнадцати пробелах,
   в пустом окне — на восьми. Первая редакция вставляла мусор, а зовов
   оставляла два, и правило не падало. */
['увести путь с данными мимо общей кнопки закрытия', И,
 '                attachH2HCloseBtn(overlay);',
 '                void 0;',
 'оба пути перерисовки идут через одну кнопку закрытия'],

['вернуть пробе ожидание удачи вместо признака', П,
 "        await page.waitForFunction(() => {\n            const d = document.querySelector('[role=\"dialog\"]');\n            return !!d && !d.querySelector('.h2h-loading') && d.contains(document.activeElement);\n        }, null, { timeout: 15000 });\n",
 '',
 'проба ждёт признак, а не удачу'],

['запереть отказ по заявкам обратно в своём IIFE', С,
 '    A.removeRegistrations = removeRegistrations;',
 '    /* наружу не выдаём */',
 'отказ по заявкам выдан наружу домом раздела'],

['вернуть прямой зов имени из чужого IIFE', Т,
 '                        await A.removeRegistrations(ids, tournamentId);',
 '                        await removeRegistrations(ids, tournamentId);',
 'раздел турниров зовёт отказ через дом, а не прямым именем']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-fok-'));
['js', 'tests', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-fokus-posle-pererisovki.js')], { encoding: 'utf8' });
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
