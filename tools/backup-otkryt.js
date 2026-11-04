#!/usr/bin/env node
/**
 * ОТКРЫТЬ РЕЗЕРВНУЮ КОПИЮ.
 *
 * ЗАПЕРТАЯ КОПИЯ, КОТОРУЮ НЕЧЕМ ОТКРЫТЬ, — ЭТО НЕ КОПИЯ. Поэтому ключ и
 * замок лежат в одной папке и пишутся в один день: `backup.js` запирает,
 * этот отпирает, оба зовут один дом `backup-shifr.js`.
 *
 * ЗАПУСК:
 *
 *     node tools/backup-otkryt.js backups/2026-11-04.enc
 *     node tools/backup-otkryt.js backups/2026-11-04.enc /куда/положить
 *
 * Пароль берётся из BACKUP_PASSWORD (.env.backup или переменная среды) —
 * тот же самый, которым копию запирали. Другого нет и быть не может.
 *
 * РАСПАКОВАННОЕ НЕ УДАЛЯЕТСЯ САМО: человек открывает копию, когда что-то
 * уже случилось, и стирать у него из-под рук — последнее дело. Уберёт сам,
 * когда закончит.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const { расшифровать } = require('./backup-shifr.js');

const ROOT = path.resolve(__dirname, '..');

function загрузитьСреду() {
    const файл = path.join(ROOT, '.env.backup');
    if (!fs.existsSync(файл)) return;
    fs.readFileSync(файл, 'utf8').split('\n').forEach(function (строка) {
        const м = строка.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
        if (м && !process.env[м[1]]) process.env[м[1]] = м[2].trim();
    });
}

async function main() {
    загрузитьСреду();

    const что = process.argv[2];
    if (!что) {
        console.error(
            '\nЧто открывать?\n\n' +
            '  node tools/backup-otkryt.js backups/2026-11-04.enc\n'
        );
        process.exit(1);
    }

    const файл = path.isAbsolute(что) ? что : path.join(ROOT, что);
    if (!fs.existsSync(файл)) {
        console.error('\nНет такого файла: ' + что + '\n');
        process.exit(1);
    }

    const пароль = process.env.BACKUP_PASSWORD;
    if (!пароль) {
        console.error(
            '\nНе задан BACKUP_PASSWORD — открыть копию нечем.\n\n' +
            'Это тот же пароль, которым её запирали. Он лежит там же, где\n' +
            'пароли от ключа подписи Android.\n'
        );
        process.exit(1);
    }

    /* КУДА КЛАДЁМ — РЯДОМ С ФАЙЛОМ И ПОД СВОИМ ИМЕНЕМ, а не поверх чего-то.
       Если папка уже есть — останавливаемся: лучше спросить человека, чем
       смешать две копии в одной папке и получить третью, которой не было. */
    const куда = process.argv[3]
        ? (path.isAbsolute(process.argv[3]) ? process.argv[3] : path.join(ROOT, process.argv[3]))
        : файл.replace(/\.enc$/, '') + '-открыто';

    if (fs.existsSync(куда)) {
        console.error('\nПапка уже есть: ' + path.relative(ROOT, куда) +
            '\nУберите её или укажите другую вторым доводом.\n');
        process.exit(1);
    }

    console.log('\nОткрываю ' + path.basename(файл) + '...');
    await расшифровать(файл, пароль, куда);

    const внутри = fs.readdirSync(куда);
    console.log('Готово: ' + path.relative(ROOT, куда));
    внутри.forEach(и => console.log('  ' + и));
    console.log('');
    console.log('Восстановление: строки из db/*.json заливаются обратно через');
    console.log('Table Editor → Import, файлы из storage — через Storage → Upload.');
    console.log('');
    console.log('ОТКРЫТАЯ КОПИЯ НЕ ЗАШИФРОВАНА — уберите её, когда закончите.');
    console.log('');
    process.exit(0);
}

main().catch(function (е) {
    console.error('\nНе получилось: ' + е.message + '\n');
    process.exit(1);
});
