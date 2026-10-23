/* РАЗБОР НАСТОЯЩИМ ПАРСЕРОМ, А НЕ СВОИМ.
   Три самодельных обхода подряд дали три ложных ответа: один упирался в
   собственные скобки литерала, другой глядел в окно и ловил соседа,
   третий жадно поглощал тернарник целиком. НЕ ПИШИ ПАРСЕР, КОГДА РЯДОМ
   ЛЕЖИТ НАСТОЯЩИЙ. */
const fs = require('fs'), path = require('path');
const acorn = require('acorn');
const walk = (() => { try { return require('acorn-walk'); } catch (e) { return null; } })();

const КИР = /[А-Яа-яЁё]/;
const файлы = [];
(function о_(д) {
  fs.readdirSync(д, { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) о_(п);
    else if (э.name.endsWith('.js') && !э.name.endsWith('constants.js')) файлы.push(п);
  });
})('js/admin');

function обойти(узел, родитель, дело) {
  if (!узел || typeof узел.type !== 'string') return;
  дело(узел, родитель);
  for (const к of Object.keys(узел)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = узел[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, узел, дело));
    else if (v && typeof v.type === 'string') обойти(v, узел, дело);
  }
}

/* Цепочка конкатенации: верхний BinaryExpression с оператором + ,
   у которого родитель НЕ такой же плюс. */
function плоско(узел, из) {
  if (узел.type === 'BinaryExpression' && узел.operator === '+') {
    плоско(узел.left, из); плоско(узел.right, из);
  } else из.push(узел);
  return из;
}

const найдено = [];
let разобрано = 0, неразобрано = [];
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  let дерево;
  try { дерево = acorn.parse(т, { ecmaVersion: 2020, locations: true }); }
  catch (e) { неразобрано.push(ф + ': ' + e.message.slice(0, 50)); return; }
  разобрано++;
  обойти(дерево, null, (у, р) => {
    if (у.type !== 'BinaryExpression' || у.operator !== '+') return;
    if (р && р.type === 'BinaryExpression' && р.operator === '+') return;  /* не верх цепочки */
    const части = плоско(у, []);
    const естьНашЛитерал = части.some(ч =>
      ч.type === 'Literal' && typeof ч.value === 'string' && КИР.test(ч.value) &&
      /^\(/.test(т.slice(ч.start - 1, ч.start)) === false ? false :
      ч.type === 'Literal' && typeof ч.value === 'string' && КИР.test(ч.value));
    if (!естьНашЛитерал) return;
    /* берём только те, где литерал стоит в СОБСТВЕННЫХ скобках */
    const свои = части.filter(ч => {
      if (ч.type !== 'Literal' || typeof ч.value !== 'string' || !КИР.test(ч.value)) return false;
      let a = ч.start - 1; while (a >= 0 && /\s/.test(т[a])) a--;
      let b = ч.end; while (b < т.length && /\s/.test(т[b])) b++;
      return т[a] === '(' && т[b] === ')';
    });
    if (!свои.length) return;
    найдено.push({ ф, стр: у.loc.start.line, начало: у.start, конец: у.end,
                   частей: части.length, свои: свои.length,
                   выр: т.slice(у.start, у.end).replace(/\s+/g, ' ').slice(0, 150) });
  });
});
console.log(JSON.stringify({ 'файлов разобрано': разобрано,
  'не разобрано': неразобрано.length, 'цепочек с нашим литералом': найдено.length }, null, 1));
неразобрано.slice(0, 4).forEach(x => console.log('   не разобран: ' + x));
console.log('\n--- образцы ---');
найдено.slice(0, 8).forEach(x =>
  console.log('  ' + path.basename(x.ф) + ':' + x.стр + ' (частей ' + x.частей + ', наших ' + x.свои + ')\n      ' + x.выр.slice(0, 120)));
fs.writeFileSync('/tmp/цепочки.json', JSON.stringify(найдено, null, 1));
