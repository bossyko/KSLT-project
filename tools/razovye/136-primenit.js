const fs = require('fs'), path = require('path');
const план = JSON.parse(fs.readFileSync('/tmp/план136.json', 'utf8'));

const ПР = { 'courts.js':'crt','users.js':'usr','players.js':'plr','tournaments.js':'trn',
  'coaches.js':'cch','news.js':'news','loyalty.js':'loy','finances.js':'fin','settings.js':'set',
  'bracket.js':'brk','challenges.js':'chal','sponsors.js':'spn','broadcast.js':'bcast',
  'analytics.js':'anl','memberships.js':'mem','vouchers.js':'vch','layout.js':'nav',
  'utils.js':'ut','editor.js':'ed','export.js':'exp','cover-crop.js':'crop','init.js':'ini',
  'telegram-strip.js':'tg','dashboard.js':'dash','live.js':'live','notifications.js':'ntf',
  'results.js':'res','ratings.js':'rat','registrations.js':'reg','admin.html':'pg' };

const СЛОВА = { 'ошибка':'Err','игрок':'Player','игроков':'Players','матч':'Match','матча':'Match',
 'группа':'Group','группе':'Group','сетка':'Draw','жеребьёвка':'Draw','заявка':'Entry',
 'заявки':'Entries','заявок':'Entries','счёт':'Score','сет':'Set','пара':'Pair','пар':'Pairs',
 'категория':'Category','категории':'Category','турнир':'Tournament','очки':'Points',
 'выбрано':'Selected','исключено':'Excluded','сохранено':'Saved','добавлен':'Added',
 'удалено':'Deleted','отменена':'Cancelled','отменён':'Cancelled','резерв':'Reserve',
 'гость':'Guest','сезон':'Season','перевод':'Translate','переводы':'Translate',
 'лимит':'Limit','сервис':'Service','место':'Place','плей':'Playoff','встреч':'Meetings',
 'участников':'Members','незапаренных':'Unpaired','недостаточно':'NoRights','прав':'NoRights',
 'заполните':'FillIn','сначала':'First','новый':'New','опубликована':'Published',
 'черновик':'Draft','супер':'SuperTb','мужчины':'Men','женщины':'Women','открыты':'Open' };
const ТР = { а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',
 н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',
 ь:'',э:'e',ю:'yu',я:'ya' };

function основа(текст, слов) {
  const ч = текст.replace(/[^А-Яа-яЁё\s]/g, ' ').trim().split(/\s+/).filter(Boolean).slice(0, слов || 3);
  if (!ч.length) return 'Label';
  return ч.map(с => {
    const н = с.toLowerCase();
    if (СЛОВА[н]) return СЛОВА[н];
    let л = ''; for (const z of н) л += (ТР[z] !== undefined ? ТР[z] : z);
    return л.charAt(0).toUpperCase() + л.slice(1);
  }).join('').slice(0, 22);
}
function видПоМесту(ф, стр) {
  const строки = fs.readFileSync(ф, 'utf8').split('\n');
  const окно = строки.slice(Math.max(0, стр - 1), стр + 2).join('\n');
  if (/showToast\([\s\S]{0,260}'error'/.test(окно)) return 'Err';
  if (/showToast\([\s\S]{0,260}'success'/.test(окно)) return 'Ok';
  if (/showToast\([\s\S]{0,260}'warning'/.test(окно)) return 'Warn';
  if (/showToast/.test(окно)) return 'Msg';
  if (/\b(?:confirm|prompt)\s*\(/.test(окно)) return 'Ask';
  if (/placeholder/.test(окно)) return 'Hint';
  if (/title\s*=/.test(окно)) return 'Tip';
  return '';
}

/* занятые имена */
const занято = new Set();
const СЛ = fs.readFileSync('js/admin/core/constants.js', 'utf8');
for (const м of СЛ.matchAll(/^\s*([A-Za-z_$][\w$]*)\s*:/gm)) занято.add(м[1]);

function имя(ф, текст, вид) {
  const пр = ПР[path.basename(ф)];
  if (!пр) throw new Error('НЕТ ПРИСТАВКИ для ' + ф);
  let осн_ = основа(текст, 3);
  /* ВИД НЕ ПОВТОРЯЕТСЯ В ПРЕДМЕТЕ: из «Ошибка: » при виде Err выходило
     brkErrErr — имя, которое ничего не добавляет. */
  if (вид && осн_.indexOf(вид) === 0) осн_ = осн_.slice(вид.length) || 'Text';
  let и = пр + вид + осн_, n = 2;
  const баз = и;
  while (занято.has(и)) { и = баз + n; n++; }
  занято.add(и);
  return и;
}

/* 1. ФРАЗЫ: шаблон + подстановки */
const новые = [];
план.фразы.forEach(ф_ => {
  const вид = видПоМесту(ф_.ф, ф_.стр);
  let шаблон = '', подст = [], занятыеП = new Set();
  ф_.части.forEach(ч => {
    if (ч.текст !== null) { шаблон += ч.текст; return; }
    /* `\w` В РЕГУЛЯРКЕ НЕ ЗНАЕТ КИРИЛЛИЦЫ: имя `буква` обрывалось на
       первой букве и подстановка выходила `{б}`. Класс выписан явно. */
    const ИМЯ = '[A-Za-zА-Яа-яЁё_$][A-Za-zА-Яа-яЁё0-9_$]*';
    const СЛУЖЕБНЫЕ = /^(esc|join|toString|trim|slice|map|filter|length)$/;
    let все = (ч.код.match(new RegExp(ИМЯ, 'g')) || [])
                .filter(x => !СЛУЖЕБНЫЕ.test(x) && !/^[A-Z_]+$/.test(x));
    let осн = все.length ? все[все.length - 1] : 'x';
    /* у `a.b` берём `b`, но если это служебное — отбросили выше */
    осн = осн.replace(/[^A-Za-zА-Яа-яЁё0-9_]/g, '') || 'x';
    let п = осн, k = 2;
    while (занятыеП.has(п)) { п = осн + k; k++; }
    занятыеП.add(п);
    шаблон += '{' + п + '}';
    подст.push({ имя: п, код: ч.код });
  });
  ф_.ключ = имя(ф_.ф, шаблон, вид);
  ф_.шаблон = шаблон;
  ф_.подст = подст;
  новые.push({ имя: ф_.ключ, текст: шаблон });
});

/* 2. КУСКИ: один ключ на текст в пределах файла */
const поКуску = {};
план.куски.forEach(к => {
  const клч = к.ф + '\u0000' + к.текст;
  if (!поКуску[клч]) {
    const вид = видПоМесту(к.ф, к.стр);
    поКуску[клч] = имя(к.ф, к.текст, вид);
    новые.push({ имя: поКуску[клч], текст: к.текст });
  }
  к.ключ = поКуску[клч];
});

console.log(JSON.stringify({ 'ключей завести': новые.length,
  'фраз': план.фразы.length, 'кусков': план.куски.length }, null, 1));
console.log('\n--- образцы фраз ---');
план.фразы.slice(0, 8).forEach(ф_ => {
  console.log('  ' + ф_.ключ);
  console.log('      |' + ф_.шаблон.slice(0, 104) + '|');
  console.log('      ' + ф_.подст.map(p => p.имя + ' = ' + p.код.slice(0, 22)).join(' · '));
});
console.log('\n--- образцы кусков ---');
новые.slice(план.фразы.length, план.фразы.length + 14)
  .forEach(н => console.log('  ' + н.имя.padEnd(26) + ' = |' + н.текст.slice(0, 44) + '|'));
fs.writeFileSync('/tmp/план136.json', JSON.stringify(план, null, 1));
fs.writeFileSync('/tmp/новые136.json', JSON.stringify(новые, null, 1));

/* ===== ПРИМЕНЕНИЕ ===== */
if (process.argv[2] === '--пиши') {
  /* 1. ключи в словарь */
  const путьСл = 'js/admin/core/constants.js';
  let сл = fs.readFileSync(путьСл, 'utf8');
  const н0 = сл.indexOf('var L ='), о0 = сл.indexOf('{', н0);
  let г = 0, з0 = -1;
  for (let i = о0; i < сл.length; i++) { if (сл[i] === '{') г++; else if (сл[i] === '}') { г--; if (!г) { з0 = i; break; } } }
  const строки = новые.map(p =>
    '        ' + p.имя + ": '" + p.текст.replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "',");
  const блок =
    '\n        /* ФРАЗЫ И СООБЩЕНИЯ, СНЯТЫЕ С КОДА 22.10 (кусок 136).\n' +
    '           Остаток куска 135: там в словарь ушли ПОДПИСИ, а фразы\n' +
    '           остались — им не находилось читаемого имени.\n' +
    '           ПРИЁМ: ФРАЗА ЗОВЁТСЯ ПО ВИДУ И ПРЕДМЕТУ, А НЕ ПО ТЕКСТУ.\n' +
    '           Вид виден из места: Err, Ok, Warn, Msg, Ask, Hint, Tip.\n' +
    '           Фраза, собиравшаяся склейкой из кусков, лежит ЦЕЛИКОМ, а\n' +
    '           места подстановки помечены фигурными скобками и\n' +
    '           заполняются домом A.фраза. Склейка задавала порядок слов\n' +
    '           расположением плюсов; шаблон его отпускает. */\n' +
    строки.join('\n') + '\n';
  let до = сл.slice(0, з0);
  if (!/,\s*$/.test(до)) до = до.replace(/\s*$/, ',\n');
  fs.writeFileSync(путьСл, до + блок + сл.slice(з0));

  /* 2. замены по файлам, с конца */
  const поФайлам = {};
  план.фразы.forEach(ф_ => {
    const код = 'A.фраза(L.' + ф_.ключ + (ф_.подст.length
      ? ', { ' + ф_.подст.map(p => p.имя + ': ' + p.код).join(', ') + ' }' : '') + ')';
    (поФайлам[ф_.ф] = поФайлам[ф_.ф] || []).push({ a: ф_.начало, b: ф_.конец - 1, код,
      текстБыл: ф_.части.filter(ч => ч.текст !== null).map(ч => ч.текст).join('\u0001') });
  });
  план.куски.forEach(к => {
    (поФайлам[к.ф] = поФайлам[к.ф] || []).push({ a: к.л, b: к.п, код: 'L.' + к.ключ,
      текстБыл: к.текст });
  });
  let замен = 0;
  Object.keys(поФайлам).forEach(ф => {
    let т = fs.readFileSync(ф, 'utf8');
    поФайлам[ф].sort((x, y) => y.a - x.a).forEach(з => {
      т = т.slice(0, з.a) + з.код + т.slice(з.b + 1);
      замен++;
    });
    fs.writeFileSync(ф, т);
  });
  console.log('\nзаведено ключей: ' + новые.length + ', замен: ' + замен);
  fs.writeFileSync('/tmp/сверка136.json', JSON.stringify(
    { фразы: план.фразы.map(ф_ => ({ ключ: ф_.ключ, шаблон: ф_.шаблон,
        текстовыеЧасти: ф_.части.filter(ч => ч.текст !== null).map(ч => ч.текст) })),
      куски: план.куски.map(к => ({ ключ: к.ключ, текст: к.текст })) }, null, 1));
}
