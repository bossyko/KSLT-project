#!/usr/bin/env node
/**
 * ОБЩИЙ БЕГУНОК СРЕЗОМ — ТОТ ЖЕ СПИСОК ПАР, ЧТО У `check-vse.js`.
 *
 * ЗАЧЕМ ОН ЕСТЬ. Полный `check-vse.js` идёт около четырёх минут: 201 пара,
 * и у каждой прувер поднимает сторожа по разу на откат. Оболочка, из
 * которой я работаю, живёт меньше, и 29.10 это кончилось тем, что полного
 * прогона не случилось ни разу за вечер: я гонял сторожей ПО ОДНОМУ — тех,
 * которые делал. Когда прогон наконец сделали, 42 прувера из 201 оказались
 * сгнившими. БЕГУНОК, КОТОРЫЙ НЕ ЗАПУСКАЮТ, МОЛЧА ГНИЁТ.
 *
 * ЧЕГО ОН НЕ ДЕЛАЕТ: не заводит второго списка пар. Список читается ИЗ
 * `check-vse.js` текстом — два списка разошлись бы на первой же правке.
 *
 * ТОЛЬКО ПО ОДНОМУ. На восьми задачах те же срезы давали ЛИШНИЕ падения
 * (`страница матча`, `судейское окно`), а по одному те же пары зелёные:
 * часть пруверов работает не только на копии. ПАРАЛЛЕЛЬНЫЙ ПРОГОН ВРЁТ,
 * поэтому задач по умолчанию одна, и менять это без замера нельзя.
 *
 * ОДНА ПАРА ДОЛГАЯ: «данные в разметке» (признак разбирает парсером всю
 * папку js). Её прувер умеет свой срез доводами:
 *   node tools/check-dannye-v-razmetku-otkat.js 0 8
 *
 *   node tools/check-vse-srezom.js            — все пары
 *   node tools/check-vse-srezom.js 0 45       — пары с 0-й по 45-ю
 *   node tools/check-vse-srezom.js 0 45 1     — то же, явно одной задачей
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFile } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');
const текст = fs.readFileSync(path.join(__dirname, 'check-vse.js'), 'utf8');
const найдено = текст.match(/const КУСКИ = (\[[\s\S]*?\n\];)/);
if (!найдено) {
    console.log('\n  БЕДА    в check-vse.js не нашёлся список КУСКИ\n');
    process.exit(2);
}
/* eslint-disable no-eval */
const КУСКИ = eval(найдено[1].replace(/;$/, ''));

const ОТ = Number(process.argv[2] || 0);
const ДО = Number(process.argv[3] || КУСКИ.length);
const ЗАДАЧ = Number(process.argv[4] || 1);
const срез = КУСКИ.slice(ОТ, ДО);

const пуск = файл => new Promise(готово => {
    execFile(process.execPath, [path.join(__dirname, файл)],
        { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 },
        (ош, вывод, ошибки) => готово({ ок: !ош, вывод: (вывод || '') + (ошибки || '') }));
});

(async () => {
    let следующий = 0, пройдено = 0;
    const плохо = [];

    async function работник() {
        while (следующий < срез.length) {
            const [имя, правила, откат] = срез[следующий++];
            const п = await пуск(правила);
            if (!п.ок) {
                плохо.push('✗ ' + имя + ' — ПРАВИЛА НЕ ДЕРЖАТСЯ\n' +
                    п.вывод.split('\n').filter(с => s_плохая(с)).slice(0, 6).join('\n'));
                пройдено++;
                continue;
            }
            const о = await пуск(откат);
            if (!о.ок) {
                плохо.push('✗ ' + имя + ' — ОТКАТ НЕ ДОКАЗАЛ\n' +
                    о.вывод.split('\n').filter(с => s_плохая(с)).slice(0, 6).join('\n'));
            }
            пройдено++;
        }
    }
    function s_плохая(с) { return /^\s*[x✗?~]/.test(с) || /ЯКОРЬ|якор/.test(с); }

    await Promise.all(Array.from({ length: Math.max(1, ЗАДАЧ) }, работник));

    console.log('');
    console.log('  пар пройдено: ' + пройдено + ' (срез ' + ОТ + '..' +
                Math.min(ДО, КУСКИ.length) + ' из ' + КУСКИ.length + ')');
    if (плохо.length) {
        console.log('');
        console.log('  НЕ ТАК  ' + плохо.length + ':');
        console.log(плохо.join('\n\n'));
        console.log('');
        process.exit(1);
    }
    console.log('  ок      все пары среза держатся');
    console.log('');
})();
