/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА ДВОЙНОЙ СВЯЗИ (07.11.2026). На КОПИИ.
 *   node tools/check-dvoynaya-svyaz-otkat.js
 *
 * Каждый откат возвращает ОДНО прежнее состояние и обязан уронить
 * ИМЕННО то правило, которое за него отвечает. Два первых отката —
 * ровно тот код, что лежал в продукте до 07.11 и падал каждый день.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-svyaz-'));
['tools', 'js', 'supabase', 'sql'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ТРН = 'js/admin/sections/tournaments.js',
      ЧЛЕН = 'supabase/functions/membership-notify/index.ts',
      СНИМОК = 'sql/схема/schema-snapshot.sql';
const ФАЙЛЫ = [ТРН, ЧЛЕН, СНИМОК];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

function прогон(правка) {
    ФАЙЛЫ.forEach(ф => {
        const цель = path.join(песок, ф);
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
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-dvoynaya-svyaz.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть безымянную связь в заявки админки (код до 07.11)',
     [ТРН, "players!tournament_registrations_player_id_fkey(id, name, name_en, photo, points, category_id)",
           "players(id, name, name_en, photo, points, category_id)"],
     'вложенная таблица с двумя связями названа по имени ключа'],

    ['вернуть безымянную связь в уведомление о членстве (код до 07.11)',
     [ЧЛЕН, "profiles!memberships_profile_id_fkey(full_name, telegram_chat_id, email, notify_preferences, lang)",
            "profiles(full_name, telegram_chat_id, email, notify_preferences, lang)"],
     'вложенная таблица с двумя связями названа по имени ключа'],

    ['потерять снимок схемы — правилу неоткуда взять связи',
     ['УДАЛИТЬ', СНИМОК],
     'снимок схемы на месте']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правило падает на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}

let плохо = 0;
console.log('\n  ПРУВЕР ДВОЙНОЙ СВЯЗИ — ' + ОТКАТЫ.length + ' отката на 2 правила\n');
ОТКАТЫ.forEach(([имя, правка, ждём]) => {
    let р;
    try { р = прогон(правка); }
    catch (e) { console.log('  x ' + имя + '\n      откат не применился: ' + e.message); плохо++; return; }
    if (!р.упало) { console.log('  x ' + имя + '\n      правило НЕ упало, а должно: «' + ждём + '»'); плохо++; return; }
    if (!р.вывод.includes(ждём)) {
        console.log('  x ' + имя + '\n      упало не то правило. Ждали: «' + ждём + '»');
        плохо++; return;
    }
    console.log('  v ' + имя + '\n      уронило: ' + ждём);
});

fs.rmSync(песок, { recursive: true, force: true });
if (плохо) { console.log('\n  ПРУВЕР УПАЛ: ' + плохо + ' из ' + ОТКАТЫ.length + '\n'); process.exit(1); }
console.log('\n  v все ' + ОТКАТЫ.length + ' отката уронили свои правила\n');
