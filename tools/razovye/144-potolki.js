/* Потолки для сторожа куска 144: сколько копий понятий осталось ВНЕ дома
   и вне близнецов. Считаются МЕСТА (строки), а не файлы. */
const fs = require('fs'); const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const файлы = [];
(function о(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/node_modules/.test(э.name)) о(п); return; }
    if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');
const ПОНЯТИЯ = [
  ['появление', /fade-in:not\(\.visible\)/],
  ['липкость полосы', /classList\.toggle\('stuck'/],
  ['обложка раздела', /-hero-bg"/]
];
ПОНЯТИЯ.forEach(([имя, пр]) => {
  let всего = 0; const где = [];
  файлы.forEach(ф => {
    if (/kslt-vitrina\.js$/.test(ф)) return;
    const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8').split('\n');
    т.forEach((л, i) => { if (пр.test(л)) { всего++; где.push(ф + ':' + (i + 1)); } });
  });
  console.log('\n' + имя + ' — мест вне дома: ' + всего);
  где.forEach(с => console.log('   ' + с));
});
