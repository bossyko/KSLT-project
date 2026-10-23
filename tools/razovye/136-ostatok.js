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
function обойти(у, р, д_) {
  if (!у || typeof у.type !== 'string') return;
  д_(у, р);
  for (const к of Object.keys(у)) {
    if (к === 'type' || к === 'start' || к === 'end' || к === 'loc') continue;
    const v = у[к];
    if (Array.isArray(v)) v.forEach(x => x && typeof x.type === 'string' && обойти(x, у, д_));
    else if (v && typeof v.type === 'string') обойти(v, у, д_);
  }
}
let вСкобках = 0, зовов = 0; const где = [];
файлы.forEach(ф => {
  const т = fs.readFileSync(ф, 'utf8');
  зовов += (т.match(/A\.фраза\(/g) || []).length;
  const д = acorn.parse(т, { ecmaVersion: 2020, locations: true });
  обойти(д, null, у => {
    if (у.type !== 'Literal' || typeof у.value !== 'string' || !КИР.test(у.value)) return;
    let a = у.start - 1; while (a >= 0 && /\s/.test(т[a])) a--;
    let b = у.end; while (b < т.length && /\s/.test(т[b])) b++;
    if (т[a] === '(' && т[b] === ')') {
      вСкобках++;
      где.push(path.basename(ф) + ':' + у.loc.start.line + ' |' + у.value.slice(0, 44) + '|');
    }
  });
});
console.log(JSON.stringify({ 'ОСТАЛОСЬ зашитых в скобках': вСкобках,
  'было до куска': 155, 'зовов A.фраза': зовов }, null, 1));
где.forEach(x => console.log('   ' + x));
