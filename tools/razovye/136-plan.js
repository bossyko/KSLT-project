const fs = require('fs'), path = require('path');
const acorn = require('acorn');
const КИР = /[А-Яа-яЁё]/;
const файлы = [];
(function о_(д) {
  fs.readdirSync(д, { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) о_(п);
    else if (э.name.endsWith('.js') && !э.name.endsWith('constants.js')) файлы.push(п);
  });
})('js/admin');

function обойти(у, р, дело) {
  if (!у || typeof у.type !== 'string') return;
  дело(у, р);
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, у, дело));
    else if (v && typeof v.type === 'string') обойти(v, у, дело);
  }
}
function плоско(у, из) {
  if (у.type === 'BinaryExpression' && у.operator === '+') { плоско(у.left, из); плоско(у.right, из); }
  else из.push(у);
  return из;
}
const вСкобках = (т, у) => {
  let a = у.start - 1; while (a >= 0 && /\s/.test(т[a])) a--;
  let b = у.end; while (b < т.length && /\s/.test(т[b])) b++;
  return т[a] === '(' && т[b] === ')' ? { л: a, п: b } : null;
};
const наш = (т, у) => у.type === 'Literal' && typeof у.value === 'string' &&
                      КИР.test(у.value) && !!вСкобках(т, у);

const план = { фразы: [], куски: [], селекторы: [], отладка: [] };
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  const дерево = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  const вЦепочке = new Set();
  /* сперва цепочки */
  обойти(дерево, null, (у, р) => {
    if (у.type !== 'BinaryExpression' || у.operator !== '+') return;
    if (р && р.type === 'BinaryExpression' && р.operator === '+') return;
    const части = плоско(у, []);
    const свои = части.filter(ч => наш(т, ч));
    if (!свои.length) return;
    свои.forEach(ч => вЦепочке.add(ч.start));
    /* ЦЕПОЧКА, СОБИРАЮЩАЯ РАЗМЕТКУ, — НЕ ФРАЗА. В settings.js такая
       цепочка шла на двадцать строк и несла теги; схлопнув её во
       «фразу», я сломал файл. Признак: хоть один литерал с тегом, или
       цепочка длиннее восьми частей, или подстановка — ключевое слово
       (из кода `false`/`true` выходило недопустимое имя свойства). */
    const СЛУЖ = /^(?:true|false|null|undefined|this|new|typeof|void|in|of)$/;
    const разметка = части.some(ч =>
      ч.type === 'Literal' && typeof ч.value === 'string' && /<[a-zA-Z\/!]/.test(ч.value));
    const ключевое = части.some(ч =>
      ч.type !== 'Literal' && СЛУЖ.test(т.slice(ч.start, ч.end).trim()));
    if (свои.length >= 2 && !разметка && !ключевое && части.length <= 8) {
      план.фразы.push({ ф, стр: у.loc.start.line, начало: у.start, конец: у.end,
                        части: части.map(ч => ({ тип: ч.type, наш: наш(т, ч),
                          текст: ч.type === 'Literal' && typeof ч.value === 'string' ? ч.value : null,
                          код: т.slice(ч.start, ч.end) })) });
    } else {
      свои.forEach(ч => план.куски.push({ ф, стр: ч.loc.start.line, текст: ч.value,
                                          ...вСкобках(т, ч) }));
    }
  });
  /* теперь одиночки вне цепочек */
  обойти(дерево, null, (у, р) => {
    if (!наш(т, у)) return;
    if (вЦепочке.has(у.start)) return;
    const с = вСкобках(т, у);
    /* селектор или отладка — по РОДИТЕЛЮ, который теперь известен точно */
    let вид = 'кусок';
    if (р && р.type === 'CallExpression' && р.callee) {
      const имя = т.slice(р.callee.start, р.callee.end);
      if (/(?:querySelector(All)?|getAttribute|setAttribute|closest|matches)$/.test(имя)) вид = 'селектор';
      else if (/^console\./.test(имя)) вид = 'отладка';
    }
    if (вид === 'селектор') план.селекторы.push({ ф, стр: у.loc.start.line, текст: у.value });
    else if (вид === 'отладка') план.отладка.push({ ф, стр: у.loc.start.line, текст: у.value });
    else план.куски.push({ ф, стр: у.loc.start.line, текст: у.value, ...с });
  });
});
console.log(JSON.stringify({
  'настоящих фраз (шаблон с подстановкой)': план.фразы.length,
  'кусков (хватит ключа)': план.куски.length,
  'селекторов — не трогаем': план.селекторы.length,
  'отладки — не трогаем': план.отладка.length,
  'всего': план.фразы.length + план.куски.length + план.селекторы.length + план.отладка.length
}, null, 1));
fs.writeFileSync('/tmp/план136.json', JSON.stringify(план, null, 1));
