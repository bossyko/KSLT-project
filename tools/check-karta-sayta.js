#!/usr/bin/env node
/**
 * ОДИН АДРЕС У ОДНОЙ СТРАНИЦЫ (12.11.2026).
 *
 * ОТКУДА. Сайт переехал на tennis.kg и живёт, а поиску о нём сказано
 * не было: sitemap.xml и robots.txt отдавали 404, canonical стоял на
 * ОДНОЙ странице из девяноста (и та — английская админка, ведущая на
 * русскую), hreflang не было ни одного. Три языка одного содержимого
 * без hreflang поиск считает тремя соперниками и делит вес.
 *
 * ЧТО СТОРОЖИТСЯ (отношения, а не числа):
 *   1. у каждой публичной страницы есть canonical, и он ведёт НА СЕБЯ;
 *   2. у каждой полной тройки ru/kg/en есть hreflang на всех троих
 *      плюс x-default, и язык кыргызского записан как ky, а не kg;
 *   3. служебная страница (noindex) canonical не носит — пара
 *      «не индексируй, но вот канонический адрес» противоречива;
 *   4. карта сайта собрана из файлов и не разошлась с ними;
 *   5. в карте нет ни одной служебной страницы;
 *   6. robots.txt закрывает ровно те страницы, что носят noindex,
 *      и называет карту сайта.
 */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const КОРЕНЬ = path.resolve(__dirname, '..');
const чит = ф => fs.readFileSync(path.join(КОРЕНЬ, ф), 'utf8');
const ДОМЕН = 'https://tennis.kg';

const ошибки = [];
const правило = (имя, условие, почему) => { if (!условие) ошибки.push({ имя, почему }); };

const все = fs.readdirSync(КОРЕНЬ).filter(и => и.endsWith('.html'))
    .concat(fs.readdirSync(path.join(КОРЕНЬ, 'pages')).filter(и => и.endsWith('.html')).map(и => 'pages/' + и))
    .sort();
const служебная = п => path.basename(п).startsWith('_preview') || /noindex/.test(чит(п));
const публичные = все.filter(п => !служебная(п));
const скрытые = все.filter(служебная);
const адрес = п => (п === 'index.html' ? ДОМЕН + '/' : ДОМЕН + '/' + п);

const безCanonical = [], чужойCanonical = [];
for (const п of публичные) {
    const м = чит(п).match(/<link rel="canonical" href="([^"]+)"/);
    if (!м) безCanonical.push(п);
    else if (м[1] !== адрес(п)) чужойCanonical.push(п + ' -> ' + м[1]);
}
правило('у каждой публичной страницы есть canonical',
    безCanonical.length === 0,
    'без canonical: ' + безCanonical.length + '\n  ' + безCanonical.slice(0, 5).join('\n  '));
правило('canonical ведёт на себя, а не на соседний язык',
    чужойCanonical.length === 0,
    'canonical указывает в сторону: ' + чужойCanonical.slice(0, 5).join('; ') +
    '\n  так английская страница отдаёт свой вес русской и исчезает из выдачи');

function тройка(п) {
    const д = path.dirname(п) === '.' ? '' : path.dirname(п) + '/';
    const осн = path.basename(п).replace(/-(kg|en)\.html$/, '.html');
    const пути = { ru: д + осн, kg: д + осн.replace(/\.html$/, '-kg.html'), en: д + осн.replace(/\.html$/, '-en.html') };
    return Object.values(пути).every(ф => fs.existsSync(path.join(КОРЕНЬ, ф))) ? пути : null;
}
const безHreflang = [], кривойЯзык = [];
for (const п of публичные) {
    const т = тройка(п);
    if (!т) continue;
    const т_ = чит(п);
    const нужны = [['ru', т.ru], ['ky', т.kg], ['en', т.en], ['x-default', т.ru]];
    for (const [я, ф] of нужны) {
        if (т_.indexOf('hreflang="' + я + '" href="' + адрес(ф) + '"') === -1) { безHreflang.push(п + ' (' + я + ')'); break; }
    }
    if (/hreflang="kg"/.test(т_)) кривойЯзык.push(п);
}
правило('у каждой тройки языков есть hreflang и x-default',
    безHreflang.length === 0,
    'не хватает ссылок на языки: ' + безHreflang.length + '\n  ' + безHreflang.slice(0, 5).join('\n  '));
правило('кыргызский записан кодом языка ky, а не кодом страны kg',
    кривойЯзык.length === 0,
    'hreflang="kg" — это код СТРАНЫ Киргизия, не язык: такую пару поиск пропускает.\n  ' +
    кривойЯзык.slice(0, 5).join('\n  '));

правило('служебная страница не носит canonical',
    скрытые.every(п => !/<link rel="canonical"/.test(чит(п))),
    '«не индексируй меня, но вот мой канонический адрес» — поиск вправе понять как угодно;\n' +
    '  страницы: ' + скрытые.filter(п => /<link rel="canonical"/.test(чит(п))).join(', '));

let картаСошлась = true, бедаКарты = '';
try { execFileSync(process.execPath, [path.join(КОРЕНЬ, 'tools/sitemap.js'), '--проверить'], { stdio: ['ignore', 'pipe', 'pipe'] }); }
catch (e) { картаСошлась = false; бедаКарты = ((e.stdout || '') + (e.stderr || '')).trim(); }
правило('карта сайта собрана из файлов и не отстала',
    картаСошлась,
    'sitemap.xml не совпадает с тем, что собирается из файлов: ' + бедаКарты +
    '\n  собрать заново: node tools/sitemap.js');

const карта = fs.existsSync(path.join(КОРЕНЬ, 'sitemap.xml')) ? чит('sitemap.xml') : '';
правило('в карте сайта нет служебных страниц',
    !!карта && скрытые.every(п => карта.indexOf('<loc>' + адрес(п) + '</loc>') === -1),
    'служебная страница попала в карту — поиск позовут туда, куда ходить незачем');

const robots = fs.existsSync(path.join(КОРЕНЬ, 'robots.txt')) ? чит('robots.txt') : '';
const незакрытые = скрытые.filter(п => robots.indexOf('Disallow: /' + п) === -1);
правило('robots.txt закрывает ровно служебные страницы',
    !!robots && незакрытые.length === 0,
    !robots ? 'robots.txt нет вовсе' :
        'носят noindex, но не закрыты в robots.txt: ' + незакрытые.join(', ') +
        '\n  мета видит только тот, кто страницу уже скачал; robots останавливает раньше');
правило('robots.txt называет карту сайта',
    /^Sitemap:\s*https:\/\/tennis\.kg\/sitemap\.xml$/m.test(robots),
    'в robots.txt нет строки Sitemap — карту придётся находить наугад');

if (ошибки.length) {
    console.log('\n  КАРТА САЙТА — ' + ошибки.length + ' правил не держится\n');
    ошибки.forEach(о => { console.log('  x ' + о.имя); console.log('    ' + о.почему.split('\n').join('\n    ') + '\n'); });
    process.exit(1);
}
console.log('карта сайта: 8 правил держатся, публичных страниц ' + публичные.length + ', служебных ' + скрытые.length);
