#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ШКАЛЫ КЕГЛЕЙ (заведён 07.11, кусок «полнота прогона»).
 *
 * Сторож `tools/check-shkala.js` стоит с 21.09 и до 07.11 жил БЕЗ ПРУВЕРА
 * и ВНЕ общего прогона: его правила не держали ничего, а падение не видел
 * никто. «У МЕНЯ ЗЕЛЁНОЕ» НИЧЕГО НЕ ДОКАЗЫВАЕТ — доказывает упавший
 * откат.
 *
 * ОСОБЕННОСТЬ ЭТОГО СТОРОЖА: корень он берёт из `__dirname/..`, а не из
 * `KSLT_KOREN`. Поэтому песочница копирует и `css`, и сам `tools`, а
 * запускается КОПИЯ сторожа — тогда её `__dirname/..` и есть песочница.
 */
const fs = require('fs'); const os = require('os'); const path = require('path');
const { execFileSync } = require('child_process');
const КОРЕНЬ = path.join(__dirname, '..');

/* ЦЕЛЬ ОТКАТА — ЛЮБОЙ ЖИВОЙ ЛИСТ, КРОМЕ `tokens.css`: сырой кегль
   стережётся везде, кроме дома шкалы. Берётся не по памяти, а чтением
   папки: ЗАМЕР ГОДЕН РОВНО ДО СЛЕДУЮЩЕЙ ПРАВКИ, и имя файла — тоже
   замер. */
const ЛИСТ = (function () {
    const д = path.join(КОРЕНЬ, 'css');
    const и = fs.existsSync(д)
        ? fs.readdirSync(д).filter(ф => ф.endsWith('.css') && ф !== 'tokens.css').sort()[0]
        : null;
    return и ? 'css/' + и : null;
})();

const ОТКАТЫ = [
  { имя: 'в лист вернулся сырой кегль',
    ждём: 'сырой font-size вне tokens.css',
    действие: (к) => {
        const п = path.join(к, ЛИСТ);
        fs.appendFileSync(п, '\n.kslt-otkat-probe { font-size: 0.85rem; }\n');
        return true;
    } },

  /* ДОЛГ ЗАМОРОЖЕН ЧИСЛОМ, И ЧИСЛО ПРОВЕРЯЕТСЯ ТОЖЕ. Чтобы уронить
     именно правило долга, откат добавляет ОДИН плавающий кегль и
     опускает потолок до замеренного сейчас: тогда новый кегль — на один
     больше потолка. Так проверяется само правило, а не способность
     написать сорок строк. */
  { имя: 'плавающих кеглей стало на один больше потолка',
    ждём: 'плавающих кеглей стало больше',
    действие: (к) => {
        const сторож = path.join(к, 'tools/check-shkala.js');
        const т = fs.readFileSync(сторож, 'utf8');
        const м = т.match(/const ПОТОЛОК = (\d+);/);
        if (!м) return false;
        /* сколько плавающих сейчас — считаем тем же якорем, что и сторож */
        let сейчас = 0;
        const д = path.join(к, 'css');
        for (const ф of fs.readdirSync(д)) {
            if (!ф.endsWith('.css') || ф === 'tokens.css') continue;
            for (const стр of fs.readFileSync(path.join(д, ф), 'utf8').split('\n')) {
                if (/font-size:\s*[0-9.]+(rem|px|em)/.test(стр)) continue;
                if (/font-size:\s*(?:clamp|calc|min|max)\([^)]*?[0-9.]+(rem|px|em)/.test(стр)) сейчас++;
            }
        }
        fs.writeFileSync(сторож, т.replace(м[0], 'const ПОТОЛОК = ' + сейчас + ';'));
        fs.appendFileSync(path.join(к, ЛИСТ),
            '\n.kslt-otkat-plavayushchiy { font-size: clamp(1.15rem, 5vw, 1.32rem); }\n');
        return true;
    } }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-shkala-'));
    for (const о of ['css', 'tools']) {
        const и = path.join(КОРЕНЬ, о);
        if (fs.existsSync(и)) fs.cpSync(и, path.join(к, о), { recursive: true });
    }
    return к;
}
function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, 'tools/check-shkala.js')], { encoding: 'utf8' });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: ШКАЛА КЕГЛЕЙ\n');
let беда = 0;

if (!ЛИСТ) {
    console.log('  ✗ в css/ нет ни одного листа, кроме tokens.css — ОТКАТУ НЕЧЕГО ПОРТИТЬ');
    беда++;
} else {
    /* СНАЧАЛА ЧИСТЫЙ ПРОГОН: правилу должно быть с чего падать. */
    const к = копия();
    const в = прогон(к);
    if (!/^\s*ок/m.test(в)) {
        console.log('  ✗ песочница красная ДО откатов — прувер ничего не докажет:');
        console.log(в.split('\n').map(с => '    ' + с).join('\n'));
        беда++;
    }
    fs.rmSync(к, { recursive: true, force: true });

    for (const о of ОТКАТЫ) {
        const к2 = копия();
        let вышло = false;
        try { вышло = о.действие(к2); } catch (e) { вышло = false; }
        if (!вышло) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ НЕ ПРИМЕНИЛСЯ');
            беда++; fs.rmSync(к2, { recursive: true, force: true }); continue;
        }
        const в2 = прогон(к2);
        if (в2.indexOf(о.ждём) !== -1) console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
        else { console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО'); беда++; }
        fs.rmSync(к2, { recursive: true, force: true });
    }
}

console.log('');
if (беда) { console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n'); process.exitCode = 1; }
else { console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила\n'); }
