/**
 * ДОКАЗАТЕЛЬСТВО СТОРОЖА КЛЮЧА ЗАДАНИЙ (07.11.2026). На КОПИИ.
 *   node tools/check-cron-klyuch-otkat.js
 *
 * Каждый откат возвращает ОДНО прежнее состояние и обязан уронить
 * ИМЕННО то правило, которое за него отвечает. Два первых отката — тот
 * самый код, что лежал в продукте до 07.11 и отвечал 401 на каждый
 * ночной вызов.
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-cron-klyuch-'));
['tools', 'supabase', 'sql'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

const ВЫБОРКА = 'supabase/functions/news-fetch/index.ts',
      ПРЕДЛОЖЕНИЕ = 'supabase/functions/news-offer/index.ts',
      РАСПИСАНИЕ = 'sql/функции/cron-secret-vault.sql';
const ФАЙЛЫ = [ВЫБОРКА, ПРЕДЛОЖЕНИЕ, РАСПИСАНИЕ];

/* ФОРМА СВЕРКИ ЗДЕСЬ НЕ ОТКАТЫВАЕТСЯ: за неё отвечает
   `tools/check-sverka-kluchom-otkat.js`. Откат на чужое правило доказал
   бы чужой сторож и спрятал бы, что своего правила нет. */
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

/* Прежняя проверка — ровно та, что стояла в двух функциях до 07.11:
   знает только служебный ключ и не знает `CRON_SECRET`. */
const ПРЕЖНЯЯ_ПРОВЕРКА =
`  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  const authHeader = req.headers.get('Authorization') || ''
  if (!(serviceKey !== '' &&
          (authHeader === 'Bearer ' + serviceKey || authHeader === serviceKey))) {
    return json({ error: 'Unauthorized — service role only' }, 401)
  }`;

function прежняяДля(ф) {
    /* Вырезается ВЕСЬ нынешний блок проверки — от объявления ключа до
       закрывающей скобки отказа — и ставится прежний. Якорь держится на
       содержимом блока, а не на номерах строк. */
    const т = исходник[ф];
    const от = т.indexOf("  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')");
    const метка = "only' }, 401)\n  }";
    const до = т.indexOf(метка, от);
    if (от === -1 || до === -1) throw new Error('блок проверки не найден в ' + ф);
    return [ф, т.slice(от, до + метка.length), ПРЕЖНЯЯ_ПРОВЕРКА];
}

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
            [path.join(песок, 'tools', 'check-cron-klyuch.js')], { encoding: 'utf8' });
        return { упало: false, вывод: '' };
    } catch (e) { return { упало: true, вывод: (e.stdout || '') + (e.stderr || '') }; }
}

const ОТКАТЫ = [
    ['вернуть в news-fetch проверку без CRON_SECRET (код до 07.11)',
     прежняяДля(ВЫБОРКА),
     'функция задания принимает CRON_SECRET'],

    ['вернуть в news-offer проверку без CRON_SECRET (код до 07.11)',
     прежняяДля(ПРЕДЛОЖЕНИЕ),
     'функция задания принимает CRON_SECRET'],

    ['отказать не 401, а чем-то иным (news-fetch)',
     [ВЫБОРКА, "cron secret only' }, 401)", "cron secret only' }, 403)"],
     'отказ по ключу отвечает 401'],

    ['завести в расписании задание на функцию, которой нет',
     [РАСПИСАНИЕ, "позвать_функцию('news-fetch')", "позвать_функцию('novosti-fetch')"],
     'у каждого задания есть своя функция'],

    ['потерять файл расписания — списку заданий взяться неоткуда',
     ['УДАЛИТЬ', РАСПИСАНИЕ],
     'список заданий прочитан из sql/']
];

const база = прогон(null);
if (база.упало) {
    console.log('\n  x база: правило падает на ЧИСТОЙ копии — чинить сторож, а не код\n');
    console.log(база.вывод);
    fs.rmSync(песок, { recursive: true, force: true });
    process.exit(1);
}

let плохо = 0;
console.log('\n  ПРУВЕР КЛЮЧА ЗАДАНИЙ — ' + ОТКАТЫ.length + ' откатов на 4 правила\n');
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
