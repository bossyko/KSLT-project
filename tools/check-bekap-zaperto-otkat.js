#!/usr/bin/env node
/**
 * ПРУВЕР К ЗАМОРОЗКЕ «БЭКАП ЛОЖИТСЯ ЗАПЕРТЫМ» (04.11).
 *
 * Берёт КОПИЮ файлов, возвращает по одному прежнему значению и требует,
 * чтобы упало ИМЕННО то правило, которое за это отвечает.
 *
 *   node tools/check-bekap-zaperto-otkat.js
 */
'use strict';
const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const ПРИБОР = 'tools/check-bekap-zaperto.js';
const ВЫГ = 'tools/backup.js';
const ДОМ = 'tools/backup-shifr.js';
const ОТКР = 'tools/backup-otkryt.js';

const ОТКАТЫ = [
    { имя: 'выгрузка снова кладёт копию открытой',
      ждём: 'выгрузка зовёт шифрование',
      файл: ВЫГ,
      было: "const { зашифровать } = require('./backup-shifr.js');",
      станет: "const зашифровать = async (п, пар, ф) => ({ файл: ф, байт: 999 });" },

    { имя: 'пароль перестал быть обязательным',
      ждём: 'без пароля выгрузка останавливается',
      файл: ВЫГ,
      было: "    const пароль = process.env.BACKUP_PASSWORD;",
      станет: "    const пароль = process.env.KSLT_PAROL || 'по умолчанию';" },

    { имя: 'открытая папка остаётся рядом с запертой',
      ждём: 'открытая папка убирается после запирания',
      файл: ВЫГ,
      было: "    if (!оставить) fs.rmSync(dir, { recursive: true, force: true });",
      станет: "    if (false) { /* папку оставляем */ }" },

    { имя: 'шифр подменён на слабый без печати',
      ждём: 'шифр — AES-256-GCM',
      файл: ДОМ,
      было: "crypto.createCipheriv('aes-256-gcm'",
      станет: "crypto.createCipheriv('aes-256-ctr'" },

    { имя: 'ключом стал сам пароль, без вывода',
      ждём: 'ключ выводится из пароля, а не берётся им',
      файл: ДОМ,
      было: "    return crypto.scryptSync(String(пароль), соль, 32, { N: ЦЕНА, r: 8, p: 1, maxmem: 128 * 1024 * 1024 });",
      станет: "    return crypto.createHash('sha256').update(String(пароль)).digest();" },

    { имя: 'соль зашита одна на все копии',
      ждём: 'соль и iv берутся случайными',
      файл: ДОМ,
      было: "    const соль = crypto.randomBytes(СОЛЬ);\n    const iv = crypto.randomBytes(IV);\n    const шифр = crypto.createCipheriv",
      станет: "    const соль = Buffer.alloc(СОЛЬ, 7);\n    const iv = Buffer.alloc(IV, 9);\n    const шифр = crypto.createCipheriv" },

    { имя: 'открывалка потеряна',
      ждём: 'открывалка на месте',
      файл: ОТКР,
      убрать: true },

    { имя: 'открывалка завела свой второй дом шифрования',
      ждём: 'открывалка зовёт тот же дом',
      файл: ОТКР,
      было: "const { расшифровать } = require('./backup-shifr.js');",
      станет: "const расшифровать = async () => { throw new Error('свой разбор'); };" },

    { имя: 'ЗАМОК ПЕРЕСТАЛ ЗАПИРАТЬ, А СЛОВА ОСТАЛИСЬ',
      ждём: 'замок держит на самом деле',
      файл: ДОМ,
      было: "    fs.writeFileSync(кудаФайл, Buffer.concat([ЗАГОЛОВОК, соль, iv]));",
      станет: "    шифр.getAuthTag = () => Buffer.alloc(16);\n    шифр._transform = (ч, к, д) => д(null, ч);\n    fs.writeFileSync(кудаФайл, Buffer.concat([ЗАГОЛОВОК, соль, iv]));" },

    /* ── ОТКАТ НА МОЛЧАНИЕ ──
       Подпись о том, зачем копию запирают, — не код. Переписав её,
       правило ронять нельзя. */
    { имя: 'МОЛЧАНИЕ: подпись к дому переписана',
      ждём: null,
      файл: ДОМ,
      было: " * ШИФРОВАНИЕ РЕЗЕРВНОЙ КОПИИ — ОДНО ОПРЕДЕЛЕНИЕ НА ОБА КОНЦА.",
      станет: " * Шифрование копии. Что-то про замок." }
];

function копия() {
    const к = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-bek-'));
    fs.cpSync(path.join(КОРЕНЬ, 'tools'), path.join(к, 'tools'), { recursive: true });
    return к;
}

function прогон(к) {
    try {
        return execFileSync('node', [path.join(к, ПРИБОР)],
            { env: { ...process.env, KSLT_KOREN: к }, encoding: 'utf8', timeout: 60000 });
    } catch (e) { return (e.stdout || '') + (e.stderr || ''); }
}

console.log('\n  ПРУВЕР: БЭКАП ЛОЖИТСЯ ЗАПЕРТЫМ\n');

{
    const к = копия();
    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });
    if (вывод.indexOf('НЕ ТАК') !== -1) {
        console.log('  ОСТАНОВ  копия исходников уже не проходит проверку\n');
        console.log(вывод);
        process.exit(1);
    }
    console.log('  база    исходный код правил проходит\n');
}

let беда = 0;
for (const о of ОТКАТЫ) {
    const к = копия();
    const п = path.join(к, о.файл);

    if (о.убрать) {
        fs.rmSync(п, { force: true });
    } else {
        const было = fs.readFileSync(п, 'utf8');
        const сколько = было.split(о.было).length - 1;
        if (сколько !== 1) {
            console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
        fs.writeFileSync(п, было.replace(о.было, о.станет));
        try {
            execFileSync('node', ['--check', п], { encoding: 'utf8' });
        } catch (e) {
            console.log('  ✗ ' + о.имя + ' — ОТКАТ СЛОМАЛ СИНТАКСИС ФАЙЛА');
            беда++;
            fs.rmSync(к, { recursive: true, force: true });
            continue;
        }
    }

    const вывод = прогон(к);
    fs.rmSync(к, { recursive: true, force: true });

    if (о.ждём === null) {
        if (вывод.indexOf('НЕ ТАК') === -1) {
            console.log('  ок  ' + о.имя + ' → прибор молчит, и это верно');
        } else {
            console.log('  ✗ ' + о.имя + ' → прибор УПАЛ там, где должен молчать');
            беда++;
        }
        continue;
    }
    if (вывод.indexOf('НЕ ТАК') === -1) {
        console.log('  ✗ ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    } else if (вывод.indexOf(о.ждём) === -1) {
        console.log('  ~ ' + о.имя + ' → упало ДРУГОЕ, а не «' + о.ждём + '»');
        беда++;
    } else {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    }
}

console.log('');
if (беда) {
    console.log('  НЕ ТАК  ' + беда + ' из ' + ОТКАТЫ.length + ' откатов не доказали правило\n');
    process.exit(1);
}
console.log('  ок      все ' + ОТКАТЫ.length + ' откатов сделали своё');
console.log('          оригиналы не трогались — работа шла на копии\n');
