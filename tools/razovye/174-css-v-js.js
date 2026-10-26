/* РАЗОВЫЙ ПРИБОР: CSS, ЖИВУЩИЙ В СТРОКАХ JS.
   Третий вид «вид живёт не в css»: сторож инлайнов читает style="…",
   сторожа красок и шкал читают css — правило в js-строке не читает НИКТО.
   Прибор вырезает тело вставляемого <style> и мерит его как css. */
const fs = require('fs');
const path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..');

const ФАЙЛЫ = [];
(function обойти(д) {
    fs.readdirSync(path.join(КОРЕНЬ, д), { withFileTypes: true }).forEach(э => {
        const п = д + '/' + э.name;
        if (э.isDirectory()) {
            if (/node_modules|\.git|tests|mobile|_sync|dist|build/.test(э.name)) return;
            обойти(п);
        } else if (э.name.endsWith('.js')) ФАЙЛЫ.push(п);
    });
})('js');

const ШКАЛА_ОТСТУПОВ = new Set(['0','0px','4px','8px','12px','16px','24px','32px','40px']);
const ШКАЛА_КЕГЛЕЙ = new Set(['11px','12px','14px','16px','18px','21px','26px','32px','40px']);
const ШКАЛА_КНОПОК = new Set(['28px','36px','44px','52px']);
const ОТСТУПЫ = /^(padding|margin|gap|row-gap|column-gap|border-radius)(-top|-bottom|-left|-right)?$/;

let всего = 0;
const итог = [];
ФАЙЛЫ.forEach(ф => {
    const т = fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
    if (!/createElement\('style'\)|createElement\("style"\)/.test(т)) return;
    /* тело стиля — всё между textContent = и ближайшим `;` на уровне строки,
       со склейками: берём строковые литералы подряд */
    const иСоздания = т.search(/createElement\(['"]style['"]\)/);
    const и = т.indexOf('textContent', иСоздания);
    let собрано = '';
    const re = /'([^'\\]*(?:\\.[^'\\]*)*)'/g;
    const хвост = т.slice(и, и + 20000);
    const конец = хвост.indexOf('appendChild');
    const кусок = хвост.slice(0, конец === -1 ? 20000 : конец);
    let м;
    while ((м = re.exec(кусок))) собрано += м[1];
    /* правила: селектор { тело } */
    const правила = [];
    const rr = /([^{}]+)\{([^{}]*)\}/g;
    while ((м = rr.exec(собрано))) правила.push({ сел: м[1].trim(), тело: м[2] });
    const краски = {}, кегли = {}, отступыМимо = {}, радиусы = {}, важные = [];
    правила.forEach(п => {
        п.тело.split(';').forEach(об => {
            const д = об.indexOf(':');
            if (д === -1) return;
            const имя = об.slice(0, д).trim(), v = об.slice(д + 1).trim();
            if (/!important/.test(v)) важные.push(п.сел + ' ' + имя);
            (v.match(/#[0-9a-fA-F]{3,8}\b/g) || []).forEach(ц => {
                краски[ц.toLowerCase()] = (краски[ц.toLowerCase()] || 0) + 1; });
            if (/rgba?\(/.test(v) && !/var\(/.test(v)) краски['rgba(…)'] = (краски['rgba(…)'] || 0) + 1;
            if (имя === 'font-size' && !ШКАЛА_КЕГЛЕЙ.has(v) && !/var\(/.test(v)) кегли[v] = (кегли[v] || 0) + 1;
            if (ОТСТУПЫ.test(имя)) v.split(/\s+/).forEach(ч => {
                if (/^\d+(\.\d+)?px$/.test(ч) && !ШКАЛА_ОТСТУПОВ.has(ч)) отступыМимо[ч] = (отступыМимо[ч] || 0) + 1;
            });
            if (имя === 'border-radius' && !/var\(/.test(v)) радиусы[v] = (радиусы[v] || 0) + 1;
        });
    });
    всего += правила.length;
    итог.push({ файл: ф, правил: правила.length, краски, кегли, отступыМимо, радиусы, важных: важные.length,
                селекторы: правила.map(п => п.сел) });
});

console.log('ФАЙЛОВ, ВПИСЫВАЮЩИХ CSS ИЗ JS: ' + итог.length);
console.log('ПРАВИЛ ВСЕГО: ' + всего);
итог.forEach(о => {
    console.log('');
    console.log('--- ' + о.файл + '  правил ' + о.правил + ', !important ' + о.важных);
    console.log('    краски мимо системы: ' + (Object.keys(о.краски).length ? JSON.stringify(о.краски) : 'нет'));
    console.log('    кегли мимо шкалы:    ' + (Object.keys(о.кегли).length ? JSON.stringify(о.кегли) : 'нет'));
    console.log('    отступы мимо шкалы:  ' + (Object.keys(о.отступыМимо).length ? JSON.stringify(о.отступыМимо) : 'нет'));
    console.log('    радиусы числом:      ' + (Object.keys(о.радиусы).length ? JSON.stringify(о.радиусы) : 'нет'));
    console.log('    селекторы: ' + о.селекторы.join(' · ').slice(0, 400));
});
