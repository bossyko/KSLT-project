#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ СОГЛАСИЙ (кусок Ю, 07.11).
 *
 * Берёт КОПИЮ файлов, возвращает в неё прежнее значение и требует, чтобы
 * упало ИМЕННО то правило, которое за это отвечает. «У меня зелёное»
 * ничего не доказывает: ОТКАТ, КОТОРЫЙ НЕ ПРИМЕНИЛСЯ, НИЧЕГО НЕ ДОКАЗАЛ,
 * поэтому якорь сверяется на единственность, а не подставляется наугад.
 *
 * Якоря держатся на СОДЕРЖИМОМ — на том, что живёт в куске постоянно, —
 * а не на положении строки и не на соседе, который может уехать.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

const ДОМ_С  = 'js/kslt-soglasiya.js';
const ДОМ_СП = 'mobile/www/js/kslt-soglasiya.js';
const ДОМ_У  = 'js/kslt-uvedomleniya.js';
const ДОМ_УП = 'mobile/www/js/kslt-uvedomleniya.js';
const САЙТ   = 'js/dashboard.js';
const ПРИЛ   = 'mobile/www/js/screens/profile.js';

/* Файлы базы ищутся по виду имени: дата в имени меняется при пересборке
   куска, и прувер, прибитый к `07nov`, упал бы на следующей. */
function файлБазы(папка, вид) {
    const д = path.join(КОРЕНЬ, папка);
    if (!fs.existsSync(д)) return null;
    const имя = fs.readdirSync(д).filter(и => вид.test(и)).sort().pop();
    return имя ? path.join(папка, имя) : null;
}
const SQL_У = файлБазы('sql/схема', /^soglasie-umolchanie-.*\.sql$/);
const SQL_Ж = файлБазы('sql/схема', /^soglasiya-zhurnal-.*\.sql$/);
const SQL_Д = файлБазы('sql/схема', /^moi-dannye-.*\.sql$/);
const SQL_П = файлБазы('sql/обслуживание', /^moi-dannye-prava-.*\.sql$/);

const ОТКАТЫ = [
  { имя: 'умолчание «слать» вернулось в одну функцию',
    ждём: 'умолчание «молчать» во всех копиях серверного правила',
    файл: 'supabase/functions/broadcast/index.ts',
    было: '  return !!ch && ch[cat] === true',
    станет: '  if (!prefs) return true\n  return ch[cat] !== false' },

  { имя: 'копии серверного правила разошлись',
    ждём: 'все копии серверного правила одного вида',
    файл: 'supabase/functions/broadcast/index.ts',
    было: '  const ch = prefs && prefs[channel]',
    станет: '  const ch = prefs ? prefs[channel] : undefined' },

  { имя: 'появилось третье исключение',
    ждём: 'исключений ровно два, и оба названы',
    всеФункции: true,
    было: "cat === 'security'",
    станет: "cat === 'security' || cat === 'general'" },

  { имя: 'клиентское правило разошлось с серверным',
    ждём: 'клиентское правило повторяет серверное знак в знак',
    файлы: [ДОМ_У, ДОМ_УП],
    было: '        return !!ч && ч[раздел] === true;',
    станет: '        return ч[раздел] !== false;' },

  { имя: 'security затащили в цель 1',
    ждём: 'security и general не попали в цель 1',
    файлы: [ДОМ_У, ДОМ_УП],
    было: "    API.РАЗДЕЛЫ_ЦЕЛИ_1 = ['tournaments', 'challenges', 'membership', 'matches'];",
    станет: "    API.РАЗДЕЛЫ_ЦЕЛИ_1 = ['tournaments', 'challenges', 'membership', 'matches', 'security'];" },

  { имя: 'в базе пропал раздел цели 1',
    ждём: 'разделы цели 1 — те же в доме и в базе',
    файл: SQL_У,
    было: "                     'matches',     coalesce(дано_1, false),",
    станет: "                     'matchi',      coalesce(дано_1, false)," },

  { имя: 'экран перестал гасить без согласия',
    ждём: 'без согласия экран гасит ползунок у обоих продуктов',
    файл: САЙТ, всеВхождения: true,
    было: 'разделДоступен', станет: 'разделГоден' },

  { имя: 'подсказка пропала из словаря сайта',
    ждём: 'подсказка про согласие есть в трёх словарях сайта и в приложении',
    файл: САЙТ,
    было: "        notifNeedConsent: 'Отправка на почту и в Telegram идёт только с вашего согласия — дайте его в Профиль → Согласия. Уведомления в приложении и в кабинете работают без него.',\n",
    станет: '' },

  { имя: 'триггер стал AFTER',
    ждём: 'триггер «согласие меняет настройки» объявлен BEFORE и по столбцам',
    файл: SQL_У,
    было: '    BEFORE INSERT OR UPDATE OF consent_notify, consent_news',
    станет: '    AFTER INSERT OR UPDATE OF consent_notify, consent_news' },

  { имя: 'триггер стал ловить любую правку профиля',
    ждём: 'триггер «согласие меняет настройки» объявлен BEFORE и по столбцам',
    файл: SQL_У,
    было: 'OR UPDATE OF consent_notify, consent_news',
    станет: 'OR UPDATE' },

  { имя: 'у понятия стало два определения',
    ждём: 'и триггер, и разовое приведение зовут одну функцию',
    файл: SQL_У,
    было: 'CREATE OR REPLACE FUNCTION public."согласие_в_настройки"(',
    станет: 'CREATE OR REPLACE FUNCTION public."согласие_в_настройки_иное"(' },

  { имя: 'разовое приведение стало пустым',
    ждём: 'разовое приведение настроек в файле есть',
    файл: SQL_У,
    было: ' WHERE notify_preferences IS DISTINCT FROM public."согласие_в_настройки"(',
    станет: ' WHERE notify_preferences = public."согласие_в_настройки"(' },

  { имя: 'из журнала убрали запрет правки',
    ждём: 'журнал согласий не правится и виден только своему',
    файл: SQL_Ж, всеВхождения: true,
    было: 'журнал_согласий_не_правится', станет: 'журнал_согласий_правится_молча' },

  { имя: 'у цели 2 завёлся свой столбец',
    ждём: 'цель 2 считается по контактам, своего столбца у неё нет',
    файлы: [ДОМ_С, ДОМ_СП],
    было: "    API.СТОЛБЕЦ = { 1: 'consent_notify', 3: 'consent_media', 4: 'consent_news' };",
    станет: "    API.СТОЛБЕЦ = { 1: 'consent_notify', 2: 'consent_contacts', 3: 'consent_media', 4: 'consent_news' };" },

  { имя: 'выгрузка перестала быть SECURITY DEFINER',
    ждём: 'выгрузку своих данных собирает база, а не клиент',
    файл: SQL_Д,
    было: 'SECURITY DEFINER', станет: 'SECURITY INVOKER', всеВхождения: true },

  /* ОТЗЫВ СНИМАЕТСЯ ВО ВСЕХ ФАЙЛАХ КУСКА, а не в одном: он записан и в
     файле схемы, и в файле обслуживания. Откат, снявший его в одном
     месте, правило не уронил — и был прав: отзыв оставался. */
  { имя: 'гостю вернули право на выгрузку',
    ждём: 'права на выгрузку отозваны у гостя',
    файлы: [SQL_Д, SQL_П], всеВхождения: true,
    было: 'FROM anon', станет: 'FROM kakaya_to_rol' },

  { имя: 'копия дома согласий разошлась',
    ждём: 'дома лежат побайтовыми копиями в приложении',
    файл: ДОМ_СП,
    было: "    API.ЦЕЛИ = [1, 2, 3, 4];",
    станет: "    API.ЦЕЛИ = [1, 2, 3, 4]; /* уехало */" },

  { имя: 'экран перестал перечитывать ответ базы',
    ждём: 'после записи согласия экран перечитывает ответ базы',
    файл: САЙТ, всеВхождения: true,
    было: "                .select('consent_notify, consent_media, consent_news, notify_preferences')\n",
    станет: '' },

  { имя: 'прибор ослеп на серверный код',
    ждём: 'серверное правило найдено хотя бы в десяти функциях',
    файл: 'tools/check-soglasiya.js',
    было: "    const д = path.join(КОРЕНЬ, 'supabase/functions');",
    станет: "    const д = path.join(КОРЕНЬ, 'supabase/нет-такой-папки');" }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-sogl-'));
    for (const о of ['js', 'mobile/www', 'pages', 'tools', 'supabase/functions',
                     'sql/схема', 'sql/обслуживание']) {
        const и = path.join(КОРЕНЬ, о);
        if (fs.existsSync(и)) fs.cpSync(и, path.join(к, о), { recursive: true });
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-soglasiya.js')],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

/* Куда писать откат: один файл, список файлов или все серверные функции.
   ЗАМЕНА, КОТОРАЯ НИ РАЗУ НЕ ПРИМЕНИЛАСЬ, — ЭТО НЕ ОТКАТ, поэтому
   считаются вхождения в каждом файле. */
function цели(к, о) {
    if (о.всеФункции) {
        const д = path.join(к, 'supabase/functions');
        return fs.readdirSync(д)
            .map(ф => path.join(д, ф, 'index.ts'))
            .filter(п => fs.existsSync(п) && fs.readFileSync(п, 'utf8').includes(о.было));
    }
    return (о.файлы || [о.файл]).map(ф => path.join(к, ф));
}

console.log('\n  ПРУВЕР: СОГЛАСИЯ\n');
let беда = 0;
for (const о of ОТКАТЫ) {
    if (!о.файл && !о.файлы && !о.всеФункции) {
        console.log('  ✗ ' + о.имя + ' — ФАЙЛ НЕ НАЙДЕН (нет файла базы такого вида)');
        беда++; continue;
    }
    const к = копия();
    const пути = цели(к, о);
    let плохо = '';
    if (!пути.length) плохо = 'НЕ НАШЛОСЬ НИ ОДНОГО ФАЙЛА';
    for (const п of пути) {
        if (плохо) break;
        if (!fs.existsSync(п)) { плохо = 'НЕТ ФАЙЛА ' + path.basename(п); break; }
        const было = fs.readFileSync(п, 'utf8');
        const n = было.split(о.было).length - 1;
        if (n === 0 || (!о.всеВхождения && !о.всеФункции && n !== 1)) {
            плохо = 'ЯКОРЬ В ' + path.basename(п) + ' ВСТРЕЧАЕТСЯ ' + n + ' РАЗ'; break;
        }
        fs.writeFileSync(п, (о.всеВхождения || о.всеФункции)
            ? было.split(о.было).join(о.станет)
            : было.replace(о.было, о.станет));
    }
    if (плохо) {
        console.log('  ✗ ' + о.имя + ' — ' + плохо);
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    const в = прогон(к);
    if (в.includes('✗ ' + о.ждём)) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    fs.rmSync(к, { recursive: true, force: true });
}
console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
