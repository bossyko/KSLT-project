#!/usr/bin/env node
/**
 * Сверка общих правил клуба.
 *
 * Правила лежат в двух местах: js/kslt-rules.js для сайта и копией в
 * mobile/www/js/ для приложения — Capacitor раскладывает эту папку в
 * Android и iOS. Копии обязаны совпадать до знака.
 *
 * Заодно проверяем данные: не оказался ли игрок в разряде, который его полу
 * не положен. Именно это однажды и не проверили — женщины в Masters были, а
 * приложение показывало им пять разрядов вместо трёх.
 *
 * Запуск:  node tools/check-rules.js
 * С базой: node tools/check-rules.js --data
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
// Файлы, которые обязаны совпадать в сайте и приложении
const SHARED = ['kslt-rules.js', 'site-content.js', 'contact-icons.js', 'tournament-slots.js'];

const SITE = path.join(ROOT, 'js', 'kslt-rules.js');
const APP = path.join(ROOT, 'mobile', 'www', 'js', 'kslt-rules.js');

let failed = false;

function fail(msg) {
    console.error('  ✗ ' + msg);
    failed = true;
}

// ---- Копии совпадают? -------------------------------------------------

const siteSrc = fs.readFileSync(SITE, 'utf8');

SHARED.forEach(function (name) {
    const a = path.join(ROOT, 'js', name);
    const b = path.join(ROOT, 'mobile', 'www', 'js', name);
    if (!fs.existsSync(a)) return;
    if (!fs.existsSync(b)) {
        fail('в приложении нет копии: mobile/www/js/' + name);
    } else if (fs.readFileSync(a, 'utf8') !== fs.readFileSync(b, 'utf8')) {
        fail(name + ': сайт и приложение разошлись — скопируйте js/' + name + ' в mobile/www/js/');
    } else {
        console.log('  ✓ ' + name + ' — совпадает');
    }
});

// ---- Никто не завёл вторую копию правил? ------------------------------

const STALE = [
    ['mobile/www/js/screens/player-detail.js', /var CAT_MAP\s*=/, 'своя карта категорий вместо общего свода'],
    ['mobile/www/js/screens/partners.js', /var CAT_MAP\s*=/, 'своя карта категорий вместо общего свода'],
    ['js/players.js', /var WOMEN_CATEGORIES\s*=/, 'свой список женских разрядов вместо общего свода']
];

STALE.forEach(function (item) {
    const file = path.join(ROOT, item[0]);
    if (!fs.existsSync(file)) return;
    if (item[1].test(fs.readFileSync(file, 'utf8'))) fail(item[0] + ': ' + item[2]);
});

// ---- Данные: игроки стоят в положенных разрядах? ----------------------

if (process.argv.includes('--data')) {
    // Свод — обычный файл для браузера, поэтому подсовываем ему window
    const sandbox = { window: {} };
    new Function('window', siteSrc)(sandbox.window);
    const RULES = sandbox.window.KSLT_RULES;

    const CFG = fs.readFileSync(path.join(ROOT, 'js', 'supabase-config.js'), 'utf8');
    const url = (CFG.match(/https:\/\/[a-z0-9]+\.supabase\.co/) || [])[0];
    const key = (CFG.match(/(sb_publishable_[A-Za-z0-9_-]+|eyJ[A-Za-z0-9_.-]{40,})/) || [])[0];

    if (!url || !key) {
        fail('не нашёл адрес базы или ключ в js/supabase-config.js');
    } else {
        const req = url + '/rest/v1/players?select=id,name,gender,category_id';
        fetch(req, { headers: { apikey: key, Authorization: 'Bearer ' + key } })
            .then(function (r) { return r.json(); })
            .then(function (rows) {
                const bad = (rows || []).filter(function (p) {
                    if (!p.gender || !p.category_id) return false;
                    return !RULES.allowsCategory(p.gender, p.category_id);
                });
                if (bad.length) {
                    fail('игроки в чужом разряде — ' + bad.length + ':');
                    bad.slice(0, 10).forEach(function (p) {
                        console.error('      ' + p.name + ' (' + p.gender + ') → ' + p.category_id);
                    });
                } else {
                    console.log('  ✓ все игроки стоят в разрядах, положенных их полу');
                }
                done();
            })
            .catch(function (e) {
                fail('не смог опросить базу: ' + e.message);
                done();
            });
    }
} else {
    done();
}

function done() {
    if (failed) {
        console.error('\nПравила разошлись.');
        process.exit(1);
    }
    console.log('\nПравила в порядке.');
}
