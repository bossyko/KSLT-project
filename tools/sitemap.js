#!/usr/bin/env node
/**
 * КАРТА САЙТА СОБИРАЕТСЯ ИЗ ФАЙЛОВ, А НЕ ПИШЕТСЯ РУКАМИ (12.11.2026).
 *
 * ОТКУДА. Замена сайта на tennis.kg состоялась, а sitemap.xml и
 * robots.txt отдавали 404; canonical стоял на ОДНОЙ странице из
 * девяноста, hreflang не было ни одного. Сайт живой и индексируется,
 * три языка делят вес между собой.
 *
 * ПОЧЕМУ ГЕНЕРАТОР, А НЕ ФАЙЛ РУКАМИ: список страниц меняется, а
 * рукописная карта стареет молча. Здесь она собирается с диска, а
 * сторож check-karta-sayta.js падает, если карта разошлась с файлами.
 *
 * Зовётся: node tools/sitemap.js        — пишет sitemap.xml
 *          node tools/sitemap.js --проверить — только сравнивает
 */
'use strict';
const fs = require('fs');
const path = require('path');

const КОРЕНЬ = path.resolve(__dirname, '..');
const ДОМЕН = 'https://tennis.kg';
/* Кыргызский в BCP-47 — ky. «kg» это код СТРАНЫ, и в hreflang он
   означал бы не язык, а регион: поисковик такую пару игнорирует. */
const ЯЗЫК = { ru: 'ru', kg: 'ky', en: 'en' };

function страницы() {
    const свои = fs.readdirSync(КОРЕНЬ).filter(и => и.endsWith('.html')).map(и => и);
    const вПапке = fs.readdirSync(path.join(КОРЕНЬ, 'pages'))
        .filter(и => и.endsWith('.html')).map(и => 'pages/' + и);
    return свои.concat(вПапке).sort();
}

/** Служебная — та, что сама просит себя не индексировать, и превью. */
function служебная(п) {
    if (path.basename(п).startsWith('_preview')) return true;
    return /noindex/.test(fs.readFileSync(path.join(КОРЕНЬ, п), 'utf8'));
}

const адрес = п => (п === 'index.html' ? ДОМЕН + '/' : ДОМЕН + '/' + п);

/** ru/kg/en одной страницы — только если на диске есть все три. */
function тройка(п) {
    const д = path.dirname(п) === '.' ? '' : path.dirname(п) + '/';
    const осн = path.basename(п).replace(/-(kg|en)\.html$/, '.html');
    const пути = {
        ru: д + осн,
        kg: д + осн.replace(/\.html$/, '-kg.html'),
        en: д + осн.replace(/\.html$/, '-en.html'),
    };
    return Object.values(пути).every(ф => fs.existsSync(path.join(КОРЕНЬ, ф))) ? пути : null;
}

function собрать() {
    const публичные = страницы().filter(п => !служебная(п));
    const строки = ['<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '        xmlns:xhtml="http://www.w3.org/1999/xhtml">'];
    for (const п of публичные) {
        строки.push('  <url>');
        строки.push('    <loc>' + адрес(п) + '</loc>');
        const т = тройка(п);
        if (т) {
            for (const я of ['ru', 'kg', 'en']) {
                строки.push('    <xhtml:link rel="alternate" hreflang="' + ЯЗЫК[я] +
                    '" href="' + адрес(т[я]) + '"/>');
            }
            строки.push('    <xhtml:link rel="alternate" hreflang="x-default" href="' + адрес(т.ru) + '"/>');
        }
        строки.push('  </url>');
    }
    строки.push('</urlset>');
    return строки.join('\n') + '\n';
}

const карта = собрать();
const файл = path.join(КОРЕНЬ, 'sitemap.xml');
if (process.argv.includes('--проверить')) {
    const было = fs.existsSync(файл) ? fs.readFileSync(файл, 'utf8') : '';
    if (было !== карта) { console.error('sitemap.xml разошёлся с файлами сайта'); process.exit(1); }
    console.log('карта сайта совпадает с файлами');
} else {
    fs.writeFileSync(файл, карта);
    const адресов = (карта.match(/<loc>/g) || []).length;
    console.log('sitemap.xml записан, адресов: ' + адресов);
}
