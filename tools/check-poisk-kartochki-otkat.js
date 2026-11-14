#!/usr/bin/env node
/**
 * Доказательство работоспособности правил поиска карточки.
 *
 * «У меня зелёное» ничего не значит, пока не показано, что проверка умеет
 * краснеть. Прибор берёт КОПИЮ исходников, по очереди возвращает каждый
 * дефект и требует, чтобы упало ИМЕННО то правило, которое за него
 * отвечает.
 *
 * Запуск: node tools/check-poisk-kartochki-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-poisk-kartochki.js';
const ФАЙЛЫ = ['js/kslt-poisk-kartochki.js', 'js/dashboard.js',
               'js/admin/sections/users.js', 'pages/dashboard.html',
               'pages/dashboard-en.html', 'pages/dashboard-kg.html', 'pages/admin.html'];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-poisk-'));
['tools', 'js', 'js/admin', 'js/admin/sections', 'pages'].forEach(д =>
    fs.mkdirSync(path.join(песок, д), { recursive: true }));
fs.copyFileSync(path.join(КОРЕНЬ, ПРИБОР), path.join(песок, ПРИБОР));

const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(файл, текст) {
    ФАЙЛЫ.forEach(ф => {
        fs.writeFileSync(path.join(песок, ф), ф === файл ? текст : исходник[ф]);
    });
    try {
        execFileSync(process.execPath, [path.join(песок, ПРИБОР)],
            { env: Object.assign({}, process.env, { KSLT_ROOT: песок }), encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

/** [что ломаем, файл, как ломаем, какое правило обязано упасть] */
const ОТКАТЫ = [
    ['снять у дома поиск', 'js/kslt-poisk-kartochki.js',
     т => т.replace('К.искать = async function', 'К._снято = async function'),
     'дом поиска отдаёт обратную раскладку и сам поиск'],

    ['показывать занятые карточки', 'js/kslt-poisk-kartochki.js',
     т => т.replace(".eq('has_account', false)", ".eq('is_guest', false)"),
     'занятые карточки не показываются вовсе'],

    ['вернуть кабинету свою таблицу раскладки', 'js/dashboard.js',
     т => т.replace('    async function искатьКарточки(q, список, profile) {',
        "    var ЛАТ = {a:'а'};\n    async function искатьКарточки(q, список, profile) {"),
     'таблицы раскладки нет нигде, кроме дома'],

    ['кабинет ищет сам', 'js/dashboard.js',
     т => т.replace('window.KSLT_KARTOCHKA.искать(client,', 'своеИскать(client,'),
     'кабинет ищет через дом'],

    ['админка заводит карточку, не ища двойников', 'js/admin/sections/users.js',
     т => т.replace('window.KSLT_KARTOCHKA.искать(A.client,', 'своеИскать(A.client,'),
     'админка ищет двойников ПЕРЕД тем, как заводить новую'],

    /* ОБА МЕСТА, А НЕ ПЕРВОЕ (13.11): привязок к существующей карточке
       стало две — заявка на привязку и «Сменить карточку». Откат,
       подменявший одну, правило не ронял: вторая держала его зелёным.
       ОТКАТ, ПОРТЯЩИЙ ОДНО МЕСТО ИЗ ДВУХ, НИЧЕГО НЕ ДОКАЗЫВАЕТ. */
    /* ВЕРНУТЬ КНОПКУ ТОЛЬКО ТЕМ, У КОГО КАРТОЧКА ЕСТЬ — ровно то, из-за
       чего случай Закира Назарова закрывался запросом в базу. */
    ['спрятать привязку от того, у кого карточки нет', 'js/admin/sections/users.js',
     т => т.replace('if (!A.сотрудник(user.role)) {\n            actionBtns.push',
                    'if (user.player_id && !A.сотрудник(user.role)) {\n            actionBtns.push'),
     'привязать карточку можно и тому, у кого её нет'],

    /* ЗАКРЫТЬ ОКНО ПРИ НУЛЕ КАНДИДАТОВ — ровно то, из-за чего админ
       уходил в базу: догадка не сошлась, и искать руками негде. */
    ['вернуть выход при нуле кандидатов', 'js/admin/sections/users.js',
     т => т.replace('if (!двойники.length) A.showToast(L.usrSmenaNetKandidatov, \'info\');',
                    'if (!двойники.length) { A.showToast(L.usrSmenaNetKandidatov, \'info\'); return; }'),
     'в окне есть ручной поиск, и он зовёт дом'],

    ['снять поле ручного поиска', 'js/admin/sections/users.js',
     т => т.replace('id="adUsrDvSearch"', 'id="adUsrDvSearchНЕТ"'),
     'в окне есть ручной поиск, и он зовёт дом'],

    ['снять у админа путь привязки', 'js/admin/sections/users.js',
     т => т.split('update({ player_id: выбор })').join('update({ player_id: null })'),
     'у админа есть путь привязать, а не только создать'],

    ['сделать отмену молчаливой', 'js/admin/sections/users.js',
     /* ОБА МЕСТА, А НЕ ПЕРВОЕ: закрывашек с 'cancel' две — крестик и
        кнопка. Замена одной оставляла признак в силе, и откат молчал. */
     т => т.split("закрыть('cancel');").join("закрыть();"),
     'молчаливого пути из окна нет'],

    ['снять дом со страницы админки', 'pages/admin.html',
     т => т.replace(/[ \t]*<script src="\.\.\/js\/kslt-poisk-kartochki\.js\?v=\d+"><\/script>\n/, ''),
     'дом подключён на всех страницах, где его зовут']
];

console.log('');
const чисто = прогон(null, null);
if (чисто.упало) {
    console.log('  ОСТАНОВ  копия исходников уже не проходит проверку — откаты бессмысленны');
    console.log(чисто.вывод);
    process.exit(1);
}
console.log('  база    исходный код проверку проходит\n');

let сошлось = 0;
const провал = [];
for (const [имя, файл, ломать, ждём] of ОТКАТЫ) {
    const испорчен = ломать(исходник[файл]);
    if (испорчен === исходник[файл]) {
        провал.push(имя + ' — якорь не нашёлся, НИЧЕГО не сломано');
        console.log('  x ' + имя + '  ->  якорь не нашёлся');
        continue;
    }
    const р = прогон(файл, испорчен);
    if (р.упало && р.вывод.indexOf(ждём) >= 0) {
        сошлось++;
        console.log('  v ' + имя + '  ->  «' + ждём + '»');
    } else {
        провал.push(имя + ' — правило не упало');
        console.log('  x ' + имя + '  ->  правило НЕ упало');
    }
}
fs.rmSync(песок, { recursive: true, force: true });
console.log('');
if (провал.length) { console.log('  НЕ ТАК  ' + провал.length + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n'); process.exit(1); }
console.log('  ок      все ' + сошлось + ' откатов доказали свои правила\n');
