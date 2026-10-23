/**
 * ЗАМЕР ОСТАТКА БЛИЗНЕЦОВ — кусок 142.
 *
 * Кусок 140 свёл то, что совпало. Осталось 14 пар, разошедшихся на 50–88%.
 * Этот прибор меряет ЧЕМ именно они разошлись: длиной, числом строк
 * расхождения и первыми строками различия — чтобы решать по числам, а не
 * «похожи вроде».
 *
 *   node tools/razovye/142-bliznetsy.js
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');

/* ИМЕНА НОРМАЛИЗУЮТСЯ: иначе разница в словаре читается как разница в
   поведении (правило куска 140). */
function норма(s) {
  return s
    .replace(/coach(es)?/gi, 'X').replace(/court(s)?/gi, 'X')
    .replace(/тренер\w*/gi, 'X').replace(/корт\w*/gi, 'X')
    .replace(/cch|crt/gi, 'X');
}
function тело(т, у) {
  return норма(т.slice(у.start, у.end))
    .split('\n').map(l => l.trim()).filter(l => l && !/^\/\//.test(l));
}
function функции(файл) {
  const т = fs.readFileSync(path.join(КОРЕНЬ, файл), 'utf8');
  const дер = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  const out = new Map();
  (function о(у, род) {
    if (!у || typeof у.type !== 'string') return;
    let имя = null;
    if (у.type === 'FunctionDeclaration' && у.id) имя = у.id.name;
    if (у.type === 'VariableDeclarator' && у.init &&
        (у.init.type === 'FunctionExpression' || у.init.type === 'ArrowFunctionExpression')) имя = у.id.name;
    if (имя) out.set(норма(имя), { линия: у.loc.start.line, строки: тело(т, у), имя });
    for (const к of Object.keys(у)) {
      if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
      const v = у[к];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && о(x, у));
      else if (v && typeof v.type === 'string') о(v, у);
    }
  })(дер, null);
  return out;
}
/* ДЛИННЕЙШАЯ ОБЩАЯ ПОДПОСЛЕДОВАТЕЛЬНОСТЬ СТРОК — а не доля совпавших
   строк: порядок здесь и есть поведение. */
function лоп(a, b) {
  const n = a.length, m = b.length;
  let пред = new Array(m + 1).fill(0);
  for (let i = 1; i <= n; i++) {
    const тек = new Array(m + 1).fill(0);
    for (let j = 1; j <= m; j++) {
      тек[j] = a[i - 1] === b[j - 1] ? пред[j - 1] + 1 : Math.max(пред[j], тек[j - 1]);
    }
    пред = тек;
  }
  return пред[m];
}

const A = функции('js/coaches.js');
const B = функции('js/courts.js');
const пары = [];
for (const [к, a] of A) {
  const b = B.get(к);
  if (!b) continue;
  const общих = лоп(a.строки, b.строки);
  const макс = Math.max(a.строки.length, b.строки.length);
  if (!макс) continue;
  пары.push({
    ключ: к, доля: Math.round(общих / макс * 100),
    coaches: a.имя + ':' + a.линия + ' (' + a.строки.length + ')',
    courts: b.имя + ':' + b.линия + ' (' + b.строки.length + ')',
    общих, расхождение: макс - общих
  });
}
пары.sort((x, y) => y.доля - x.доля);
let сведено = 0, остаток = 0, строкРасхождения = 0;
пары.forEach(п => {
  if (п.доля === 100) сведено++;
  else { остаток++; строкРасхождения += п.расхождение; }
});
console.log('');
console.log('  пар с общим именем: ' + пары.length +
            ' · совпали знак в знак: ' + сведено + ' · разошлись: ' + остаток);
console.log('  строк расхождения всего: ' + строкРасхождения);
console.log('');
пары.filter(п => п.доля < 100).forEach(п => {
  console.log('  ' + String(п.доля).padStart(3) + '%  ' + п.ключ);
  console.log('        coaches ' + п.coaches + '   courts ' + п.courts +
              '   расхождение ' + п.расхождение);
});
console.log('');
