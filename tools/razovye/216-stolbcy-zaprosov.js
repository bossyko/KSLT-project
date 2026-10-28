#!/usr/bin/env node
/** РАЗОВЫЙ ПРИБОР (кусок 216). Собирает из кода приложения пары
 *  «таблица → столбцы, которые запрос называет». Сверка со СТОЛБЦАМИ БАЗЫ
 *  делается в браузере: прибор только читает код, базу он не знает. */
const fs = require('fs'), path = require('path');
const КОРЕНЬ = path.join(__dirname, '..', '..', 'mobile', 'www', 'js');

const пары = {};
function обойти(дир) {
    fs.readdirSync(дир, { withFileTypes: true }).forEach(e => {
        const п = path.join(дир, e.name);
        if (e.isDirectory()) return обойти(п);
        if (!e.name.endsWith('.js')) return;
        const т = fs.readFileSync(п, 'utf8');
        const re = /from\('([a-z_]+)'\)/g;
        let м;
        while ((м = re.exec(т))) {
            const таблица = м[1];
            const хвост = т.slice(м.index, м.index + 600);
            const стоп = хвост.search(/\.then\(|;\s*\n\s*\n/);
            const кусок = стоп > 0 ? хвост.slice(0, стоп) : хвост;
            const стб = new Set();
            let c;
            const re2 = /\.(order|eq|in|not|gte|lte|gt|lt|neq|is|like|ilike)\('([a-z_0-9]+)'/g;
            while ((c = re2.exec(кусок))) стб.add(c[2]);
            const sel = кусок.match(/\.select\('([^']*)'/);
            if (sel) sel[1].split(',').forEach(s => {
                s = s.trim();
                if (!s || s === '*') return;
                if (s.indexOf('(') >= 0 || s.indexOf('!') >= 0 || s.indexOf(':') >= 0) return;
                стб.add(s);
            });
            if (!пары[таблица]) пары[таблица] = new Set();
            стб.forEach(s => пары[таблица].add(s + '|' + path.basename(п)));
        }
    });
}
обойти(КОРЕНЬ);
const вывод = {};
Object.keys(пары).sort().forEach(t => { вывод[t] = [...пары[t]].sort(); });
console.log(JSON.stringify(вывод));
