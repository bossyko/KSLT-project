const fs = require('fs'), path = require('path');
const { чистые } = JSON.parse(fs.readFileSync('/tmp/137-тройки.json', 'utf8'));

const поФайлам = {};
чистые.forEach(т_ => { (поФайлам[т_.ф] = поФайлам[т_.ф] || []).push(т_); });

let замен = 0;
const сверка = [];
Object.keys(поФайлам).forEach(ф => {
  let т = fs.readFileSync(ф, 'utf8');
  поФайлам[ф].sort((a, b) => b.нач - a.нач).forEach(з => {
    const было = т.slice(з.нач, з.кон);
    /* ВЕТВИ ПЕРЕНОСЯТСЯ ДОСЛОВНО И В ТОМ ЖЕ ПОРЯДКЕ: en, kg, ru —
       ровно как их принимает дом (кусок 133). */
    const стало = 'KSLT_YAZYK.выбрать(' + з.en + ', ' + з.kg + ', ' + з.ru + ')';
    т = т.slice(0, з.нач) + стало + т.slice(з.кон);
    замен++;
    сверка.push({ ф, стр: з.стр, en: з.en, kg: з.kg, ru: з.ru });
  });
  fs.writeFileSync(ф, т);
});
console.log(JSON.stringify({ 'файлов тронуто': Object.keys(поФайлам).length, 'замен': замен }, null, 1));
fs.writeFileSync('/tmp/137-сверка.json', JSON.stringify(сверка, null, 1));
