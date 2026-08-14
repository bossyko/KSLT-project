#!/usr/bin/env node
/**
 * Резервная копия боевой базы и хранилища.
 *
 * Код лежит в GitHub и защищён историей. А игроки, рейтинг, история матчей,
 * членство, оплаты и все загруженные фотографии живут только в Supabase —
 * в одном экземпляре. Удалили проект, потеряли доступ к учётной записи,
 * стёрли данные неудачным запросом — восстанавливать не из чего.
 *
 * Скрипт складывает рядом с проектом папку с датой в имени:
 *
 *     backups/2026-08-14/
 *         db/players.json, profiles.json, ...   ← все таблицы
 *         storage/news/...                      ← все файлы хранилища
 *         ОТЧЁТ.txt                             ← что и сколько выгружено
 *
 * ЗАПУСК:
 *
 *     node tools/backup.js
 *
 * Ключи берутся из .env.backup рядом с проектом (файл в .gitignore) либо из
 * переменных окружения:
 *
 *     SUPABASE_URL=https://xxxx.supabase.co
 *     SUPABASE_SERVICE_KEY=...        ← служебный ключ, Settings → API
 *
 * Ключ нужен служебный: обычный не видит данные, закрытые правилами доступа,
 * и копия вышла бы неполной. В git он не попадает и на экран не печатается.
 */

'use strict';

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');

// ---- Ключи ----------------------------------------------------------------

function loadEnv() {
    const file = path.join(ROOT, '.env.backup');
    if (fs.existsSync(file)) {
        fs.readFileSync(file, 'utf8').split('\n').forEach(function(line) {
            const m = line.match(/^\s*([A-Z_]+)\s*=\s*(.*)\s*$/);
            if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
        });
    }
    const url = process.env.SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_KEY;
    if (!url || !key) {
        console.error(
            '\nНе хватает ключей.\n\n' +
            'Создай рядом с проектом файл .env.backup и впиши две строки:\n\n' +
            '  SUPABASE_URL=https://xxxx.supabase.co\n' +
            '  SUPABASE_SERVICE_KEY=служебный ключ из Settings → API\n\n' +
            'Файл уже в .gitignore — в репозиторий он не попадёт.\n'
        );
        process.exit(1);
    }
    return { url: url.replace(/\/+$/, ''), key: key };
}

// ---- Обращения к Supabase --------------------------------------------------

async function api(env, urlPath, opts) {
    const res = await fetch(env.url + urlPath, Object.assign({
        headers: { apikey: env.key, Authorization: 'Bearer ' + env.key }
    }, opts || {}));

    if (res.status === 402) {
        throw new Error(
            'Supabase ответил 402: проекты организации ограничены за превышение квоты.\n' +
            'Выгрузка невозможна, пока ограничение не снято.'
        );
    }
    return res;
}

/**
 * Список таблиц.
 *
 * Берём из описания, которое PostgREST отдаёт по корню: перечислять руками
 * значит однажды забыть новую таблицу и узнать об этом при восстановлении.
 */
async function listTables(env) {
    const res = await api(env, '/rest/v1/');
    if (!res.ok) throw new Error('Не удалось получить список таблиц: HTTP ' + res.status);
    const spec = await res.json();
    return Object.keys(spec.paths || {})
        .filter(function(p) { return p.startsWith('/') && p.length > 1 && !p.includes('{'); })
        .map(function(p) { return p.slice(1); })
        .filter(function(name) { return !name.startsWith('rpc/'); })
        .sort();
}

/** Таблица целиком, страницами: PostgREST отдаёт не больше тысячи строк за раз. */
async function dumpTable(env, table) {
    const PAGE = 1000;
    let from = 0;
    const rows = [];

    for (;;) {
        const res = await api(env, '/rest/v1/' + table + '?select=*', {
            headers: {
                apikey: env.key,
                Authorization: 'Bearer ' + env.key,
                Range: from + '-' + (from + PAGE - 1)
            }
        });
        if (!res.ok) throw new Error(table + ': HTTP ' + res.status);
        const chunk = await res.json();
        rows.push.apply(rows, chunk);
        if (chunk.length < PAGE) break;
        from += PAGE;
    }
    return rows;
}

async function listBuckets(env) {
    const res = await api(env, '/storage/v1/bucket');
    if (!res.ok) throw new Error('Не удалось получить список хранилищ: HTTP ' + res.status);
    return await res.json();
}

/** Файлы хранилища, включая вложенные папки. */
async function listObjects(env, bucket, prefix) {
    const out = [];
    let offset = 0;

    for (;;) {
        const res = await api(env, '/storage/v1/object/list/' + bucket, {
            method: 'POST',
            headers: {
                apikey: env.key,
                Authorization: 'Bearer ' + env.key,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ prefix: prefix || '', limit: 100, offset: offset })
        });
        if (!res.ok) throw new Error(bucket + ': HTTP ' + res.status);
        const items = await res.json();
        if (!items.length) break;

        for (const it of items) {
            const full = (prefix ? prefix + '/' : '') + it.name;
            // У папки нет сведений о файле — заходим внутрь
            if (!it.id && !it.metadata) {
                out.push.apply(out, await listObjects(env, bucket, full));
            } else {
                out.push({ path: full, size: (it.metadata && it.metadata.size) || 0 });
            }
        }
        if (items.length < 100) break;
        offset += 100;
    }
    return out;
}

// ---- Выгрузка --------------------------------------------------------------

function human(bytes) {
    if (bytes < 1024) return bytes + ' Б';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' КБ';
    if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(1) + ' МБ';
    return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' ГБ';
}

async function main() {
    const env = loadEnv();
    const stamp = new Date().toISOString().slice(0, 10);
    const dir = path.join(ROOT, 'backups', stamp);
    const dbDir = path.join(dir, 'db');
    const stDir = path.join(dir, 'storage');

    fs.mkdirSync(dbDir, { recursive: true });
    fs.mkdirSync(stDir, { recursive: true });

    const report = [];
    report.push('Резервная копия KSLT — ' + new Date().toLocaleString('ru-RU'));
    report.push('База: ' + env.url);
    report.push('');

    // ---- Таблицы ----
    console.log('Таблицы...');
    const tables = await listTables(env);
    let totalRows = 0;

    for (const t of tables) {
        try {
            const rows = await dumpTable(env, t);
            fs.writeFileSync(path.join(dbDir, t + '.json'), JSON.stringify(rows, null, 2));
            totalRows += rows.length;
            console.log('  ' + t + ' — ' + rows.length);
            report.push('  ' + t + ': ' + rows.length + ' строк');
        } catch (e) {
            // Одна недоступная таблица не должна ронять всю выгрузку, но и
            // молчать о ней нельзя: неполная копия хуже отсутствующей, если
            // о неполноте не знать
            console.warn('  ' + t + ' — ПРОПУЩЕНА: ' + e.message);
            report.push('  ' + t + ': ПРОПУЩЕНА — ' + e.message);
        }
    }

    report.push('');
    report.push('Всего строк: ' + totalRows);
    report.push('');

    // ---- Хранилище ----
    console.log('Хранилище...');
    const buckets = await listBuckets(env);
    let totalFiles = 0;
    let totalBytes = 0;

    for (const b of buckets) {
        const objects = await listObjects(env, b.name, '');
        console.log('  ' + b.name + ' — файлов: ' + objects.length);

        for (const o of objects) {
            const res = await api(env, '/storage/v1/object/' + b.name + '/' + encodeURI(o.path));
            if (!res.ok) {
                console.warn('    ' + o.path + ' — ПРОПУЩЕН: HTTP ' + res.status);
                report.push('  ' + b.name + '/' + o.path + ': ПРОПУЩЕН — HTTP ' + res.status);
                continue;
            }
            const buf = Buffer.from(await res.arrayBuffer());
            const dest = path.join(stDir, b.name, o.path);
            fs.mkdirSync(path.dirname(dest), { recursive: true });
            fs.writeFileSync(dest, buf);
            totalFiles++;
            totalBytes += buf.length;
        }
        report.push('  ' + b.name + ': ' + objects.length + ' файлов');
    }

    report.push('');
    report.push('Всего файлов: ' + totalFiles + ' (' + human(totalBytes) + ')');
    report.push('');
    report.push('Восстановление: строки из db/*.json заливаются обратно через');
    report.push('Table Editor → Import, файлы из storage — через Storage → Upload.');

    fs.writeFileSync(path.join(dir, 'ОТЧЁТ.txt'), report.join('\n') + '\n');

    console.log('');
    console.log('Готово: ' + path.relative(ROOT, dir));
    console.log('  таблиц: ' + tables.length + ', строк: ' + totalRows);
    console.log('  файлов: ' + totalFiles + ' (' + human(totalBytes) + ')');
    console.log('');
    console.log('Папку стоит скопировать в облако или на внешний диск:');
    console.log('рядом с проектом она защищает только от ошибки в базе,');
    console.log('но не от потери самого компьютера.');
}

main().catch(function(err) {
    console.error('\nНе получилось: ' + err.message + '\n');
    process.exit(1);
});
