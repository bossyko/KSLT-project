#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ПОЛНОТЫ ПРОГОНА (07.11.2026).
 *
 * Берёт КОПИЮ `tools/` и `check-vse.js`, портит по одному месту и
 * требует, чтобы упало ИМЕННО то правило, которое за это отвечает.
 * Правила-храповики откатываются правкой своего же числа — так же, как
 * это делает прувер шкалы: число и есть то, что правило держит.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');
const СТОРОЖ = 'tools/check-polnota-progona.js';

/* ПАРА ДЛЯ ПОРЧИ БЕРЁТСЯ ЧТЕНИЕМ, А НЕ ПО ПАМЯТИ: любой сторож, что
   внесён в прогон и имеет прувера. */
const ПАРА = (function () {
    const т = fs.readFileSync(path.join(КОРЕНЬ, 'tools/check-vse.js'), 'utf8');
    const м = т.match(/'(check-[a-z0-9-]+\.js)',\s*\n?\s*'(check-[a-z0-9-]+-otkat\.js)'/);
    return м ? { сторож: м[1], прувер: м[2] } : null;
})();

const ОТКАТЫ = [
  { имя: 'сторож выпал из общего прогона',
    ждём: 'каждый сторож внесён в общий прогон',
    действие: (к) => {
        if (!ПАРА) return false;
        const п = path.join(к, 'tools/check-vse.js');
        const т = fs.readFileSync(п, 'utf8');
        if (т.split("'" + ПАРА.сторож + "'").length - 1 !== 1) return false;
        fs.writeFileSync(п, т.replace("'" + ПАРА.сторож + "'", "'check-vydumannyy-progonom.js'"));
        return true;
    } },

  { имя: 'прувер выпал из общего прогона',
    ждём: 'каждый прувер внесён в общий прогон',
    действие: (к) => {
        if (!ПАРА) return false;
        const п = path.join(к, 'tools/check-vse.js');
        const т = fs.readFileSync(п, 'utf8');
        if (т.split("'" + ПАРА.прувер + "'").length - 1 !== 1) return false;
        fs.writeFileSync(п, т.replace("'" + ПАРА.прувер + "'", "'check-vydumannyy-progonom-otkat.js'"));
        return true;
    } },

  { имя: 'завёлся сторож без прувера',
    ждём: 'у каждого сторожа есть прувер',
    действие: (к) => {
        /* Файл заводится В ПЕСОЧНИЦЕ и вносится в прогон, чтобы упало
           ровно правило про прувер, а не про прогон. */
        fs.writeFileSync(path.join(к, 'tools/check-novyy-bez-pruvera.js'), '// пусто\n');
        const п = path.join(к, 'tools/check-vse.js');
        const т = fs.readFileSync(п, 'utf8');
        fs.writeFileSync(п, т + "\n/* 'check-novyy-bez-pruvera.js' */\n");
        return true;
    } },

  { имя: 'остался прувер без своего сторожа',
    ждём: 'у каждого прувера есть свой сторож',
    действие: (к) => {
        fs.writeFileSync(path.join(к, 'tools/check-snyatyy-kusok-otkat.js'), '// пусто\n');
        const п = path.join(к, 'tools/check-vse.js');
        const т = fs.readFileSync(п, 'utf8');
        fs.writeFileSync(п, т + "\n/* 'check-snyatyy-kusok-otkat.js' */\n");
        return true;
    } },

  { имя: 'в исключениях назван бегунок, которого нет',
    ждём: 'исключённые бегунки существуют',
    действие: (к) => {
        const п = path.join(к, СТОРОЖ);
        const т = fs.readFileSync(п, 'utf8');
        const я = "const БЕГУНКИ = ['check-vse.js', СРЕЗОМ];";
        if (т.split(я).length - 1 !== 1) return false;
        fs.writeFileSync(п, т.replace(я,
            "const БЕГУНКИ = ['check-vse.js', СРЕЗОМ, 'check-vse-tretim-sposobom.js'];"));
        return true;
    } },

  { имя: 'бегунок срезом завёл свой список пар',
    ждём: 'бегунок срезом читает список пар из общего бегунка',
    действие: (к) => {
        const п = path.join(к, 'tools/check-vse-srezom.js');
        if (!fs.existsSync(п)) return false;
        /* Снимаем чтение файла — именно это и означало бы второй список. */
        fs.writeFileSync(п, fs.readFileSync(п, 'utf8').split('readFileSync').join('читатьНекогда'));
        return true;
    } },

  { имя: 'храповик числа сторожей поднят выше настоящего',
    ждём: 'сторожей не стало меньше замеренного',
    действие: (к) => {
        const п = path.join(к, СТОРОЖ);
        const т = fs.readFileSync(п, 'utf8');
        const м = т.match(/const ПОЛ_СТОРОЖЕЙ = (\d+);/);
        if (!м) return false;
        fs.writeFileSync(п, т.replace(м[0], 'const ПОЛ_СТОРОЖЕЙ = ' + (Number(м[1]) + 50) + ';'));
        return true;
    } }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-polnota-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, СТОРОЖ)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ПОЛНОТА ПРОГОНА\n');
let беда = 0;
{
    const к = копия();
    const в = прогон(к);
    if (/БЕДА/.test(в)) {
        console.log('  ✗ песочница красная ДО откатов — прувер ничего не докажет:');
        console.log(в.split('\n').map(с => '    ' + с).join('\n'));
        беда++;
    }
    fs.rmSync(к, { recursive: true, force: true });
}

for (const о of ОТКАТЫ) {
    const к = копия();
    let вышло = false;
    try { вышло = о.действие(к); } catch (e) { вышло = false; }
    if (!вышло) {
        console.log('  ✗ ' + о.имя + ' — ОТКАТ НЕ ПРИМЕНИЛСЯ');
        беда++; fs.rmSync(к, { recursive: true, force: true }); continue;
    }
    const в = прогон(к);
    if (в.includes('✗ ' + о.ждём)) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
    fs.rmSync(к, { recursive: true, force: true });
}

console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
