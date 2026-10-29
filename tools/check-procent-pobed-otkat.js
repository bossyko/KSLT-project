#!/usr/bin/env node
/**
 * ПРУВЕР К СТОРОЖУ ПРОЦЕНТА ПОБЕД (шаг A3.1, 29.10).
 *
 * Берёт КОПИЮ, возвращает прежнее значение и требует, чтобы упало ИМЕННО
 * то правило, которое за это отвечает.
 *
 * Запуск: node tools/check-procent-pobed-otkat.js
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.join(__dirname, '..');

const ОТКАТЫ = [
    { имя: 'дом снесён',
      ждём: 'дом объявлен в правилах',
      файл: 'js/kslt-rules.js',
      было: '    R.процентПобед = function (побед, поражений) {',
      станет: '    R.процентПобедОтключён = function (побед, поражений) {' },

    { имя: 'копии правил разошлись',
      ждём: 'копии правил побайтово равны',
      файл: 'mobile/www/js/kslt-rules.js',
      было: '    R.процентПобедТекст = function (побед, поражений) {',
      станет: '    R.процентПобедТекст = function (побед, поражений) { /* копия уехала */' },

    { имя: 'при нуле игр снова ноль вместо прочерка',
      ждём: 'при нуле игр процента НЕТ, а не ноль',
      файл: 'js/kslt-rules.js',
      было: '        if (!игр) return null;',
      станет: '        if (!игр) return 0;' },

    { имя: 'печать прочерка унесена из дома',
      ждём: 'печать прочерка — в доме, а не у зовущих',
      файл: 'js/kslt-rules.js',
      было: "return п === null ? '\\u2014' : п + '%';",
      станет: "return п + '%';" },

    { имя: 'сайт снова считает процент сам',
      ждём: 'своих считалок процента не осталось',
      файл: 'js/dashboard.js',
      было: '        var value = KSLT_RULES.процентПобедТекст(w, l);',
      станет: "        var value = played ? Math.round(w / played * 100) + '%' : '\\u2014';" },

    { имя: 'в плитку вернули изменение места',
      ждём: 'четвёртая плитка кабинета — процент, а не изменение места',
      файл: 'js/dashboard.js',
      было: "KSLT_PLITKI.плитка(KSLT_RULES.процентПобедТекст(wins, losses), L.winRate)",
      станет: "KSLT_PLITKI.плитка((p.rank_change || 0), L.rank)" },

    { имя: 'подпись выпала из одного словаря',
      ждём: 'подпись плитки есть в трёх словарях сайта',
      файл: 'js/dashboard.js',
      было: "        winRate: '% побед',",
      станет: '' },

    { имя: 'приложение снова печатает процент само',
      ждём: 'приложение печатает процент через дом',
      файл: 'mobile/www/js/screens/player-detail.js',
      было: '    var winRate = window.KSLT_RULES.процентПобедТекст(p.wins, p.losses);',
      станет: '    var winRate = totalM > 0 ? Math.round(p.wins / totalM * 100) : 0;' },

    { имя: 'знак процента приписан снаружи',
      ждём: 'знака процента руками в плитке нет',
      файл: 'mobile/www/js/screens/profile.js',
      было: "        П.плитка(winRate,             I18N.t('profile.winRate'))",
      станет: "        П.плитка(winRate + '%',       I18N.t('profile.winRate'))" },

    { имя: 'числовой зов остался без проверки',
      ждём: 'у каждого числового зова есть проверка на нуль игр',
      файл: 'js/dashboard.js',
      было: "        if (!played) return '';\n        var rate = KSLT_RULES.процентПобед(w, l);",
      станет: "        var rate = KSLT_RULES.процентПобед(w, l);" },

    { имя: 'второе объявление сетки вернули',
      ждём: 'сетка плиток объявлена один раз',
      файл: 'mobile/www/css/app.css',
      было: '/* ОДНО ОБЪЯВЛЕНИЕ `.kst-grid` — ВТОРОЕ, НИЖЕ (шаг A3.1, 29.10).',
      станет: '.kst-grid {\n  grid-template-columns: repeat(3, 1fr);\n}\n/* ОДНО ОБЪЯВЛЕНИЕ `.stats-grid` — ВТОРОЕ, НИЖЕ (шаг A3.1, 29.10).' },

    { имя: 'отступ плитки вернули на 12',
      ждём: 'боковой отступ плитки 8, чтобы «100%» влезало',
      файл: 'mobile/www/css/app.css',
      было: '  padding: 16px 8px;\n  text-align: center;',
      станет: '  padding: 16px 12px;\n  text-align: center;' },

    { имя: 'прописные и разрядку вернули подписи',
      ждём: 'подпись плитки не торчит за край',
      файл: 'mobile/www/css/app.css',
      было: '  letter-spacing: 0;\n  overflow-wrap: anywhere;',
      станет: '  text-transform: uppercase;\n  letter-spacing: 0.03em;' }
];

function копияДерева() {
    const куда = fs.mkdtempSync(path.join(os.tmpdir(), 'kslt-procent-'));
    for (const отн of ['js', 'mobile/www', 'tools']) {
        fs.cpSync(path.join(КОРЕНЬ, отн), path.join(куда, отн), { recursive: true });
    }
    return куда;
}

function прогон(корень) {
    try {
        return execFileSync('node', [path.join(корень, 'tools/check-procent-pobed.js')],
            { env: { ...process.env, KSLT_KOREN: корень }, encoding: 'utf8' });
    } catch (e) {
        return (e.stdout || '') + (e.stderr || '');
    }
}

console.log('\n  ПРУВЕР: ПРОЦЕНТ ПОБЕД\n');

let беда = 0;
for (const о of ОТКАТЫ) {
    const корень = копияДерева();
    const п = path.join(корень, о.файл);
    const было = fs.readFileSync(п, 'utf8');
    const сколько = было.split(о.было).length - 1;

    if (сколько !== 1) {
        console.log('  ✗ ' + о.имя + ' — ЯКОРЬ ВСТРЕЧАЕТСЯ ' + сколько + ' РАЗ');
        console.log('    Якорь: ' + JSON.stringify(о.было.slice(0, 70)));
        беда++;
        fs.rmSync(корень, { recursive: true, force: true });
        continue;
    }

    fs.writeFileSync(п, было.replace(о.было, о.станет));
    const вывод = прогон(корень);
    if (вывод.includes('✗ ' + о.ждём)) {
        console.log('  ок  ' + о.имя + ' → упало «' + о.ждём + '»');
    } else {
        console.log('  ✗   ' + о.имя + ' → правило «' + о.ждём + '» НЕ УПАЛО');
        беда++;
    }
    fs.rmSync(корень, { recursive: true, force: true });
}

console.log('');
if (беда) {
    console.log('  БЕДА    откатов не поймано: ' + беда + ' из ' + ОТКАТЫ.length + '\n');
    process.exitCode = 1;
} else {
    console.log('  ок      все ' + ОТКАТЫ.length + ' откатов уронили свои правила');
    console.log('          оригиналы не трогались — работа шла на копии\n');
}
