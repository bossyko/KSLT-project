/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА «ДВА КАБИНЕТА ПИШУТ ОДНО И ТО ЖЕ» (07.11.2026).
 * На КОПИИ.
 *   node tools/check-kabinety-ne-rashodyatsya-otkat.js
 *
 * Сторож был заведён 06.11 и до 07.11 жил без прувера — то есть
 * доказывал ровно «у меня зелёное». Каждый откат возвращает ОДНО
 * прежнее состояние и обязан уронить ИМЕННО своё правило.
 *
 * Третий откат — то самое расхождение, с которого сторож начался:
 * столбец, который пишет сайт и не пишет приложение.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-kabinety-'));
fs.mkdirSync(path.join(песок, 'tools'), { recursive: true });
fs.cpSync(path.join(КОРЕНЬ, 'tools', 'check-kabinety-ne-rashodyatsya.js'),
          path.join(песок, 'tools', 'check-kabinety-ne-rashodyatsya.js'));

const САЙТ = 'js/dashboard.js',
      ПРИЛ = 'mobile/www/js/screens/profile.js',
      СТОРОЖ = 'tools/check-kabinety-ne-rashodyatsya.js';
const ФАЙЛЫ = [САЙТ, ПРИЛ, СТОРОЖ];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        const цель = path.join(песок, ф);
        fs.mkdirSync(path.dirname(цель), { recursive: true });
        if (правка && правка[0] === 'УДАЛИТЬ' && правка[1] === ф) {
            if (fs.existsSync(цель)) fs.rmSync(цель);
            return;
        }
        let т = исходник[ф];
        if (правка && правка[0] === ф) {
            if (!т.includes(правка[1])) throw new Error('откат не нашёл в ' + ф);
            т = т.replace(правка[1], правка[2]);
        }
        fs.writeFileSync(цель, т);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, СТОРОЖ)],
            { encoding: 'utf8', env: Object.assign({}, process.env, { KSLT_KOREN: песок }) });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['потерять кабинет приложения',
     ['УДАЛИТЬ', ПРИЛ],
     'оба кабинета на месте'],

    ['увести запись профиля из-под якоря (приложение)',
     [ПРИЛ, '          gender: gender,', '          gender_vremenno: gender,'],
     'запись профиля найдена в обоих кабинетах'],

    ['сайт пишет instagram, приложение — нет (расхождение 06.11)',
     [ПРИЛ, '          instagram: instagram,', '          /* убрано: */'],
     'приложение пишет всё, что пишет сайт'],

    ['приложение пишет instagram, сайт — нет',
     [САЙТ, '            instagram: instagram,', '            /* убрано: */'],
     'сайт пишет всё, что пишет приложение'],

    ['оставить исключение без внятной причины',
     [СТОРОЖ, "    full_name:  'на сайте собирается из имени и фамилии в другом месте'",
              "    full_name:  'так надо'"],
     'у каждого исключения названа причина']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: сторож падает на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}

let плохо = 0;
console.log('\n  ПРУВЕР КАБИНЕТОВ — ' + ОТКАТЫ.length + ' откатов на 5 правил\n');
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    let р;
    try { р = прогон(правка); }
    catch (e) { console.log('  x ' + имя + '\n      откат не применился: ' + e.message); плохо++; return; }
    if (!р.упало) { console.log('  x ' + имя + '\n      правило НЕ упало, а должно: «' + ждём + '»'); плохо++; return; }
    if (!р.вывод.includes(ждём)) {
        console.log('  x ' + имя + '\n      упало не то правило. Ждали: «' + ждём + '»\n' + р.вывод);
        плохо++; return;
    }
    console.log('  v ' + имя + '\n      уронило: ' + ждём);
});

fs.rmSync(песок, { recursive: true, force: true });
if (плохо) { console.log('\n  ПРУВЕР УПАЛ: ' + плохо + ' из ' + ОТКАТЫ.length + '\n'); process.exit(1); }
console.log('\n  v все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n');
