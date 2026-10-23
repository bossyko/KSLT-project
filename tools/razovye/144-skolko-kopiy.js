/**
 * СКОЛЬКО КОПИЙ У ПОНЯТИЙ, НАЙДЕННЫХ У БЛИЗНЕЦОВ — кусок 144.
 * Считаются места по ПРИЗНАКУ, а не по имени функции: имя у копии может
 * быть любым.
 *   node tools/razovye/144-skolko-kopiy.js
 */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');
const файлы = [];
(function о(д) {
  fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
    const п = path.join(д, э.name);
    if (э.isDirectory()) { if (!/node_modules/.test(э.name)) о(п); return; }
    if (э.name.endsWith('.js')) файлы.push(п);
  });
})('js');

const ПРИЗНАКИ = [
  ['наблюдатель появления (fade-in)', /fade-in:not\(\.visible\)|classList\.add\('visible'\)/],
  ['обложка раздела (hero-bg + hero-title)', /hero-bg|hero-title/],
  ['липкость полосы (stuck + rootMargin)', /classList\.toggle\('stuck'/],
  ['членское окно (membership-overlay)', /membership-overlay/],
  ['окно в общей оболочке (дом слоя)', /KSLT_(sloy|СЛОЙ|слой)|KSLT_окно/i],
  ['выпадашка фильтра (f-dd)', /f-dd-toggle|f-dd-item/]
];

ПРИЗНАКИ.forEach(([имя, пр]) => {
  const где = [];
  файлы.forEach(ф => {
    const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
    const строки = т.split('\n');
    let сколько = 0;
    строки.forEach((л, i) => { if (пр.test(л) && !/^\s*(\/\/|\*)/.test(л)) сколько++; });
    if (сколько) где.push(ф.replace('js/', '') + ' (' + сколько + ')');
  });
  console.log('\n' + имя + ' — файлов ' + где.length);
  где.forEach(с => console.log('   ' + с));
});
console.log('');
