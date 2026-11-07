/**
 * ДОКАЗАТЕЛЬСТВО ЗАМОРОЗКИ КУСКА 204 ОТКАТОМ. Работаем на КОПИИ.
 *
 *   node tools/check-udalenie-akkaunta-otkat.js
 */
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ФАЙЛЫ = ['pages/delete-account.html', 'pages/delete-account-kg.html',
                'js/dashboard.js', 'supabase/functions/delete-account/index.ts',
                'supabase/functions/purge-deleted-accounts/index.ts'];
const исходник = {};
ФАЙЛЫ.forEach(ф => { исходник[ф] = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8'); });

const С = 'pages/delete-account.html', К = 'pages/delete-account-kg.html',
      Д = 'js/dashboard.js', Ф = 'supabase/functions/delete-account/index.ts',
      У = 'supabase/functions/purge-deleted-accounts/index.ts';

const ОТКАТЫ = [

/* ЯКОРЬ НА ВЕРСИИ ФАЙЛА ПЕРЕЖИВАЕТ РОВНО ДО СЛЕДУЮЩЕЙ ВЕРСИИ (07.11).
   Здесь стояло `kslt-yazyk.js?v=4`; версия поднялась до 5, и откат
   молча перестал применяться — прувер сказал «якоря нет», а выглядело
   это как зелёный прогон. Якорь держится на теге, а не на номере. */
['увести страницу за вход', С,
 '<script src="../js/kslt-yazyk.js',
 '<script src="../js/auth-guard.js?v=9"></script>\n    <script src="../js/kslt-yazyk.js',
 'страница открывается без входа'],

/* СРОК НА СТРАНИЦЕ И В КОДЕ — ОДНО ЧИСЛО. Поменяли в функции, а на
   странице осталось прежнее — человек прочитает одно, функция сделает
   другое. */
['поменять срок возврата в функции, не тронув страницу', Ф,
 'const GRACE_DAYS = 30',
 'const GRACE_DAYS = 14',
 'срок возврата на странице совпадает с кодом'],

/* ГЛАВНОЕ, В ЧЁМ ЛЕГКО СОВРАТЬ. */
['заставить уборщика удалять карточку игрока', У,
 "          .from('players')\n          .update({ account_deleted_at: profile.deleted_at })",
 "          .from('players')\n          .delete()",
 'уборщик помечает карточку игрока, а не удаляет её'],

/* ОТКАТ УБИРАЕТ ОБЪЯСНЕНИЕ, А НЕ МЕТКУ: метка «Аккаунт өчүрүлгөн» может
   остаться в тексте и без слов о том, что карточка сохраняется, — именно
   на этом первая редакция отката и не сработала. */
/* ЯКОРЬ ПЕРЕПИСАН 07.11: страница пересобрана из редакции, утверждённой
   приказом № 1, и прежней формулировки `оюнчунун картасы калат` в ней
   больше нет — теперь `карточкасы`. */
['убрать со страницы упоминание, что карточка остаётся', К,
 'оюнчунун карточкасы калат',
 'оюнчунун карточкасы да өчөт',
 'страница называет, что карточка игрока остаётся'],

['вернуть окну обещание потерять историю матчей', Д,
 "        deleteLoses: ['Накопленные баллы и скидки', 'Настройки уведомлений',",
 "        deleteLoses: ['История турниров и матчей', 'Настройки уведомлений',",
 'окно удаления не обещает потерю рейтинга и истории матчей'],

['снять из окна ссылку на публичную страницу', Д,
 "        deleteMore: 'Что именно удаляется и что остаётся',",
 '',
 'из окна удаления ведёт ссылка на публичную страницу']

];

const песок = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-udal-'));
['js', 'pages', 'supabase', 'tools'].forEach(д =>
    fs.cpSync(path.join(КОРЕНЬ, д), path.join(песок, д), { recursive: true }));

function прогон(замена) {
    try {
        ФАЙЛЫ.forEach(ф => {
            fs.writeFileSync(path.join(песок, ф), замена && замена.файл === ф ? замена.текст : исходник[ф]);
        });
        execFileSync(process.execPath,
            [path.join(песок, 'tools', 'check-udalenie-akkaunta.js')], { encoding: 'utf8' });
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
