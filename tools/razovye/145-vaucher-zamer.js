/**
 * ЗАМЕР ВАУЧЕРНОГО БЛОКА БЛИЗНЕЦОВ — кусок 145.
 * Пары берутся ПО ТЕЛАМ (имена разные), разница печатается строками.
 *   node tools/razovye/145-vaucher-zamer.js
 */
const fs = require('fs'); const path = require('path'); const acorn = require('acorn');
const КОРЕНЬ = path.join(__dirname, '..', '..');
function норма(s) {
  return s.replace(/coach(es)?/gi, 'X').replace(/court(s)?/gi, 'X')
          .replace(/тренер\w*/gi, 'X').replace(/корт\w*/gi, 'X')
          .replace(/\bL_labels\b/g, 'L')
          .replace(/\bco([A-Z])/g, '$1').replace(/\bcoLoad/g, 'Load');
}
const безКом = s => s.replace(/\/\*[\s\S]*?\*\//g, '');
function функции(файл) {
  const т = fs.readFileSync(path.join(КОРЕНЬ, файл), 'utf8');
  const out = [];
  (function о(у) {
    if (!у || typeof у.type !== 'string') return;
    if (у.type === 'FunctionDeclaration' && у.id) {
      out.push({ имя: у.id.name, линия: у.loc.start.line,
                 стр: норма(безКом(т.slice(у.start, у.end))).split('\n').map(l => l.trim()).filter(l => l && !/^\/\//.test(l)) });
    }
    for (const к of Object.keys(у)) {
      if (['type','start','end','loc'].includes(к)) continue;
      const v = у[к];
      if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && о(x));
      else if (v && typeof v.type === 'string') о(v);
    }
  })(acorn.parse(т, { ecmaVersion: 2020, locations: true }));
  return out;
}
function разница(a, b) {
  const n=a.length, m=b.length;
  const таб=Array.from({length:n+1},()=>new Array(m+1).fill(0));
  for(let i=1;i<=n;i++)for(let j=1;j<=m;j++)
    таб[i][j]=a[i-1]===b[j-1]?таб[i-1][j-1]+1:Math.max(таб[i-1][j],таб[i][j-1]);
  const тA=[],тB=[]; let i=n,j=m;
  while(i>0||j>0){
    if(i>0&&j>0&&a[i-1]===b[j-1]){i--;j--;}
    else if(j>0&&(i===0||таб[i][j-1]>=таб[i-1][j])){тB.unshift(b[j-1]);j--;}
    else {тA.unshift(a[i-1]);i--;}
  }
  return {тA,тB,общих:таб[n][m]};
}
const ВАУЧЕРНЫЕ = /[Vv]oucher|[Ss]ervicePicker|CtaLoadServices|taLoadServices|[Ll]imitModal/;
const A = функции('js/coaches.js').filter(ф => ВАУЧЕРНЫЕ.test(ф.имя));
const B = функции('js/courts.js').filter(ф => ВАУЧЕРНЫЕ.test(ф.имя));
console.log('тренеры: ' + A.map(ф => ф.имя + ':' + ф.линия + '(' + ф.стр.length + ')').join(', '));
console.log('корты:   ' + B.map(ф => ф.имя + ':' + ф.линия + '(' + ф.стр.length + ')').join(', '));
let строкВсего = 0, расхВсего = 0;
A.forEach(a => {
  let лучший = null;
  B.forEach(b => {
    const р = разница(a.стр, b.стр);
    const д = р.общих / Math.max(a.стр.length, b.стр.length);
    if (!лучший || д > лучший.д) лучший = { b, р, д };
  });
  if (!лучший) return;
  строкВсего += Math.max(a.стр.length, лучший.b.стр.length);
  расхВсего += лучший.р.тA.length + лучший.р.тB.length;
  console.log('\n=== ' + a.имя + ':' + a.линия + '  ~  ' + лучший.b.имя + ':' + лучший.b.линия +
              '   ' + Math.round(лучший.д * 100) + '%   строк ' + a.стр.length + '/' + лучший.b.стр.length +
              '   расхождение ' + (лучший.р.тA.length + лучший.р.тB.length));
  лучший.р.тA.forEach(л => console.log('  Т- ' + л.slice(0, 130)));
  лучший.р.тB.forEach(л => console.log('  К+ ' + л.slice(0, 130)));
});
console.log('\nВСЕГО строк в блоке: ' + строкВсего + ', расхождения: ' + расхВсего);
