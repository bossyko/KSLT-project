/**
 * ЧЕМ ИМЕННО РАЗОШЛИСЬ БЛИЗНЕЦЫ — кусок 144.
 *
 * Прибор куска 142 сказал ДОЛЮ общего. Этот говорит САМИ СТРОКИ
 * расхождения: что есть только у тренеров, что только у кортов. Решать
 * можно только по ним.
 *
 *   node tools/razovye/144-raznica.js [порог]
 */
const fs = require('fs');
const path = require('path');
const acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const ПОРОГ = Number(process.argv[2] || 100);

function норма(s) {
  return s.replace(/coach(es)?/gi, 'X').replace(/court(s)?/gi, 'X')
          .replace(/тренер\w*/gi, 'X').replace(/корт\w*/gi, 'X')
          .replace(/cch|crt/gi, 'X')
          /* СЛОВАРЬ СТРАНИЦЫ — ОДНО ПОНЯТИЕ ПОД ДВУМЯ ИМЕНАМИ: `L` у
             тренеров и `L_labels` у кортов. Пока имена разные, прибор
             считает разницей то, что разницей не является. */
          .replace(/\bL_labels\b/g, 'L');
}
/* КОММЕНТАРИИ ВЫРЕЗАЮТСЯ, И ЭТО НЕ МЕЛОЧЬ. Первый прогон считал их
   строками кода: у `renderPagination` всё расхождение оказалось РАЗНЫМИ
   СЛОВАМИ В /* * / блоке, а тела звали один и тот же дом. Доля врала в
   обе стороны — и именно по ней я собирался решать, что сводить.
   КОММЕНТАРИЙ — НЕ ПОВЕДЕНИЕ. */
function безКомментариев(s) {
  return s.replace(/\/\*[\s\S]*?\*\//g, '');
}
function строки(т, у) {
  return норма(безКомментариев(т.slice(у.start, у.end))).split('\n').map(l => l.trim())
         .filter(l => l && !/^\/\//.test(l));
}
function функции(файл) {
  const т = fs.readFileSync(path.join(КОРЕНЬ, файл), 'utf8');
  const out = new Map();
  (function о(у) {
    if (!у || typeof у.type !== 'string') return;
    let имя = null;
    if (у.type === 'FunctionDeclaration' && у.id) имя = у.id.name;
    if (у.type === 'VariableDeclarator' && у.init &&
        (у.init.type === 'FunctionExpression' || у.init.type === 'ArrowFunctionExpression')) имя = у.id.name;
    if (имя) out.set(норма(имя), { имя, линия: у.loc.start.line, стр: строки(т, у) });
    for (const к of Object.keys(у)) {
      if (['type', 'start', 'end', 'loc'].includes(к)) continue;
      const v = у[к];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && о(x));
      else if (v && typeof v.type === 'string') о(v);
    }
  })(acorn.parse(т, { ecmaVersion: 2020, locations: true }));
  return out;
}
/* РАЗНИЦА СЧИТАЕТСЯ ПО ПОРЯДКУ, А НЕ МНОЖЕСТВАМИ: одна и та же строка,
   переставленная выше, — это поведение, а не совпадение. */
function разница(a, b) {
  const n = a.length, m = b.length;
  const таб = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = 1; i <= n; i++)
    for (let j = 1; j <= m; j++)
      таб[i][j] = a[i - 1] === b[j - 1] ? таб[i - 1][j - 1] + 1 : Math.max(таб[i - 1][j], таб[i][j - 1]);
  const толькоA = [], толькоB = [];
  let i = n, j = m;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && a[i - 1] === b[j - 1]) { i--; j--; }
    else if (j > 0 && (i === 0 || таб[i][j - 1] >= таб[i - 1][j])) { толькоB.unshift(b[j - 1]); j--; }
    else { толькоA.unshift(a[i - 1]); i--; }
  }
  return { толькоA, толькоB, общих: таб[n][m] };
}

const A = функции('js/coaches.js'), B = функции('js/courts.js');
const пары = [];
for (const [к, a] of A) {
  const b = B.get(к);
  if (!b) continue;
  const р = разница(a.стр, b.стр);
  const макс = Math.max(a.стр.length, b.стр.length);
  if (!макс) continue;
  пары.push({ к, a, b, р, доля: Math.round(р.общих / макс * 100), расх: р.толькоA.length + р.толькоB.length });
}
пары.sort((x, y) => x.расх - y.расх);
пары.forEach(п => {
  if (п.доля === 100) return;
  if (п.расх > ПОРОГ) {
    console.log('\n=== ' + п.к + '  ' + п.доля + '%  расхождение ' + п.расх + ' — НЕ РАЗБИРАЮ, выше порога');
    return;
  }
  console.log('\n=== ' + п.к + '  ' + п.доля + '%  (coaches:' + п.a.линия + ' / courts:' + п.b.линия +
              ')  только у тренеров ' + п.р.толькоA.length + ', только у кортов ' + п.р.толькоB.length);
  п.р.толькоA.forEach(л => console.log('  Т- ' + л.slice(0, 150)));
  п.р.толькоB.forEach(л => console.log('  К+ ' + л.slice(0, 150)));
});
console.log('');

/* ============================================================
   ПАРЫ, КОТОРЫХ ПРИБОР НЕ УВИДЕЛ ИЗ-ЗА ИМЁН.
   `coCtaLoadServices` и `ctaLoadServices` — одно и то же поведение под
   разными именами, и нормализация «тренер/корт» их не сводит: приставка
   `co` не слово. ИМЯ У КОПИИ МОЖЕТ БЫТЬ ЛЮБЫМ, поэтому несопоставленные
   функции сравниваются ТЕЛАМИ.
   ============================================================ */
{
  const свободныеA = [...A.entries()].filter(([к]) => !B.has(к));
  const свободныеB = [...B.entries()].filter(([к]) => !A.has(к));
  const найденные = [];
  свободныеA.forEach(([ка, a]) => {
    if (a.стр.length < 4) return;
    let лучший = null;
    свободныеB.forEach(([кб, b]) => {
      if (b.стр.length < 4) return;
      const р = разница(a.стр, b.стр);
      const доля = р.общих / Math.max(a.стр.length, b.стр.length);
      if (!лучший || доля > лучший.доля) лучший = { кб, b, р, доля };
    });
    if (лучший && лучший.доля >= 0.7) найденные.push({ a, ка, ...лучший });
  });
  console.log('\n--- ПО ТЕЛАМ, А НЕ ПО ИМЕНАМ: ' + найденные.length + ' пар');
  найденные.sort((x, y) => y.доля - x.доля).forEach(п => {
    console.log('\n=== ' + п.a.имя + ' (coaches:' + п.a.линия + ')  ~  ' + п.b.имя +
                ' (courts:' + п.b.линия + ')  ' + Math.round(п.доля * 100) + '%  расхождение ' +
                (п.р.толькоA.length + п.р.толькоB.length));
    п.р.толькоA.slice(0, 6).forEach(л => console.log('  Т- ' + л.slice(0, 120)));
    п.р.толькоB.slice(0, 6).forEach(л => console.log('  К+ ' + л.slice(0, 120)));
  });
  console.log('');
}
