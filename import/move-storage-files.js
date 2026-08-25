/**
 * Раскладывает файлы хранилища по папкам и правит ссылки в базе.
 *
 * Сейчас в бакете `news` лежит всё вперемешку: обложки новостей, логотипы
 * спонсоров, фотографии тренеров и полторы сотни файлов, на которые никто
 * не ссылается. Найти нужное невозможно, а случайно удалить чужое — легко.
 *
 * Раскладываем по владельцу, а не по теме: тему у новости могут поменять,
 * и файл пришлось бы переносить, ломая ссылку. Владелец не меняется.
 *
 *     news/       обложки, галереи и картинки внутри текстов
 *     sponsors/   логотипы
 *     coaches/    фотографии тренеров
 *     courts/     фотографии кортов
 *     players/    фотографии игроков
 *     archive/    то, на что никто не ссылается
 *
 * Файл переезжает и тут же получает новый адрес в базе — во всех полях,
 * включая ссылки внутри HTML новостей. Порядок такой: сначала копия на
 * новом месте, потом правка ссылки, потом удаление старой. Если что-то
 * оборвётся посередине, картинка останется доступной по старому адресу.
 *
 * ЗАПУСК: в консоли браузера на странице админки, войдя администратором —
 * права на запись в хранилище есть только у него.
 *
 *     await moveStorageFiles({ dryRun: true })   ← посмотреть план
 *     await moveStorageFiles()                   ← выполнить
 *     await moveStorageFiles({ archive: false }) ← не трогать ничейные
 */
async function moveStorageFiles(options) {
    var opts = options || {};
    var dryRun = opts.dryRun === true;
    var withArchive = opts.archive !== false;
    var BUCKET = 'news';

    var client = window.KSLT_ADMIN ? window.KSLT_ADMIN.client : window.supabaseClient;
    if (!client) {
        console.error('Нет клиента Supabase — открой страницу админки');
        return;
    }

    // Где искать ссылки: таблица → поля, в которых они встречаются
    var SOURCES = [
        { table: 'news', folder: 'news',
          fields: ['image', 'image_original', 'content', 'content_en', 'content_kg',
                   'gallery', 'content_images'] },
        { table: 'sponsors', folder: 'sponsors', fields: null },
        { table: 'coaches', folder: 'coaches', fields: null },
        { table: 'courts', folder: 'courts', fields: null },
        { table: 'players', folder: 'players', fields: null },
        { table: 'tournaments', folder: 'news', fields: null },
    ];

    var PREFIX = '/storage/v1/object/public/' + BUCKET + '/';

    function filesIn(value) {
        var out = [];
        if (!value) return out;
        var text = typeof value === 'string' ? value : JSON.stringify(value);
        var re = new RegExp(PREFIX.replace(/\//g, '\\/') + '([^"\'\\s\\\\)]+)', 'g');
        var m;
        while ((m = re.exec(text)) !== null) {
            var name = decodeURIComponent(m[1]);
            if (name.indexOf('/') === -1) out.push(name);   // уже в папке — не трогаем
        }
        return out;
    }

    // ---- 1. Читаем базу: какой файл кому принадлежит ----
    console.log('Читаю базу…');
    var owner = {};           // имя файла → папка
    var rowsByTable = {};

    for (var i = 0; i < SOURCES.length; i++) {
        var src = SOURCES[i];
        var res = await client.from(src.table).select('*');
        if (res.error) {
            console.warn('  ' + src.table + ': ' + res.error.message);
            continue;
        }
        rowsByTable[src.table] = res.data || [];
        (res.data || []).forEach(function(row) {
            filesIn(JSON.stringify(row)).forEach(function(name) {
                if (!owner[name]) owner[name] = src.folder;
            });
        });
        console.log('  ' + src.table + ': ' + (res.data || []).length + ' записей');
    }

    // ---- 2. Читаем хранилище ----
    var files = [];
    for (var page = 0; page < 50; page++) {
        var list = await client.storage.from(BUCKET).list('', { limit: 100, offset: page * 100 });
        if (list.error) { console.error(list.error.message); return; }
        if (!list.data || !list.data.length) break;
        list.data.forEach(function(f) {
            if (f.id) files.push(f.name);            // папки приходят без id
        });
        if (list.data.length < 100) break;
    }

    var plan = files.map(function(name) {
        return { name: name, folder: owner[name] || 'archive' };
    }).filter(function(x) {
        return withArchive || x.folder !== 'archive';
    });

    var counts = {};
    plan.forEach(function(x) { counts[x.folder] = (counts[x.folder] || 0) + 1; });
    console.log('Файлов в хранилище: ' + files.length);
    console.log('План переезда:', counts);

    if (dryRun) {
        console.log('Пробный прогон — ничего не менял. Убери dryRun, чтобы выполнить.');
        return plan;
    }

    // ---- 3. Переезд ----
    var moved = 0, failed = 0;

    for (var k = 0; k < plan.length; k++) {
        var item = plan[k];
        var from = item.name;
        var to = item.folder + '/' + item.name;

        var copy = await client.storage.from(BUCKET).copy(from, to);
        if (copy.error && copy.error.message.indexOf('exists') === -1) {
            console.warn('не скопировался ' + from + ': ' + copy.error.message);
            failed++;
            continue;
        }

        // Ссылки правим до удаления старого файла: оборвётся — картинка
        // останется доступной по прежнему адресу
        var ok = await rewriteLinks(from, to);
        if (!ok) { failed++; continue; }

        var del = await client.storage.from(BUCKET).remove([from]);
        if (del.error) console.warn('не удалился ' + from + ': ' + del.error.message);

        moved++;
        if (moved % 20 === 0) console.log('  перенесено ' + moved + ' из ' + plan.length);
    }

    console.log('Готово. Перенесено: ' + moved + ', не вышло: ' + failed);
    return { moved: moved, failed: failed };

    // ---- Правка ссылок во всех полях, где встречается имя файла ----
    async function rewriteLinks(from, to) {
        var oldUrl = PREFIX + from;
        var newUrl = PREFIX + to;

        for (var s = 0; s < SOURCES.length; s++) {
            var src = SOURCES[s];
            var rows = rowsByTable[src.table] || [];

            for (var r = 0; r < rows.length; r++) {
                var row = rows[r];
                if (JSON.stringify(row).indexOf(from) === -1) continue;

                var patch = {};
                Object.keys(row).forEach(function(field) {
                    var v = row[field];
                    if (v === null || v === undefined) return;
                    if (typeof v === 'string') {
                        if (v.indexOf(oldUrl) !== -1) patch[field] = v.split(oldUrl).join(newUrl);
                    } else if (typeof v === 'object') {
                        var asText = JSON.stringify(v);
                        if (asText.indexOf(oldUrl) !== -1) {
                            patch[field] = JSON.parse(asText.split(oldUrl).join(newUrl));
                        }
                    }
                });

                if (!Object.keys(patch).length) continue;

                var upd = await client.from(src.table).update(patch).eq('id', row.id);
                if (upd.error) {
                    console.error('не обновилась ссылка в ' + src.table + '/' + row.id + ': ' + upd.error.message);
                    return false;
                }
                Object.keys(patch).forEach(function(f) { row[f] = patch[f]; });
            }
        }
        return true;
    }
}

console.log('Готово к запуску: await moveStorageFiles({ dryRun: true })');

/**
 * Убирает из корня то, что уже переехало в папки.
 *
 * При переезде файл сначала копируется, потом правится ссылка, потом
 * удаляется оригинал. Удаление молча не сработало — в корне осталась
 * копия каждого файла, лишние 80 мегабайт.
 *
 * Удаляем только то, для чего нашлась пара в папке: сверяем и имя,
 * и размер. Не нашлась — файл остаётся на месте.
 *
 *     await cleanupStorageRoot({ dryRun: true })
 *     await cleanupStorageRoot()
 */
async function cleanupStorageRoot(options) {
    var opts = options || {};
    var dryRun = opts.dryRun === true;
    var BUCKET = 'news';
    var FOLDERS = ['news', 'sponsors', 'coaches', 'courts', 'players', 'archive'];

    var client = window.KSLT_ADMIN ? window.KSLT_ADMIN.client : window.supabaseClient;
    if (!client) { console.error('Нет клиента Supabase — открой страницу админки'); return; }

    async function listAll(prefix) {
        var out = [];
        for (var page = 0; page < 50; page++) {
            var r = await client.storage.from(BUCKET).list(prefix, { limit: 100, offset: page * 100 });
            if (r.error) { console.error(r.error.message); return out; }
            if (!r.data || !r.data.length) break;
            r.data.forEach(function(f) { if (f.id) out.push(f); });
            if (r.data.length < 100) break;
        }
        return out;
    }

    // Что лежит в папках: имя → размер
    var inFolders = {};
    for (var i = 0; i < FOLDERS.length; i++) {
        var items = await listAll(FOLDERS[i]);
        items.forEach(function(f) {
            inFolders[f.name] = (f.metadata && f.metadata.size) || 0;
        });
    }
    console.log('В папках файлов: ' + Object.keys(inFolders).length);

    var root = await listAll('');
    var safe = [], missing = [];
    root.forEach(function(f) {
        var size = (f.metadata && f.metadata.size) || 0;
        if (inFolders[f.name] !== undefined && inFolders[f.name] === size) safe.push(f.name);
        else missing.push(f.name);
    });

    console.log('В корне: ' + root.length + ' | переехали и можно удалить: ' + safe.length +
                ' | пары нет, оставляем: ' + missing.length);
    if (missing.length) console.log('  без пары:', missing.slice(0, 10));

    if (dryRun) { console.log('Пробный прогон — ничего не удалял.'); return { safe: safe, missing: missing }; }

    var removed = 0;
    for (var k = 0; k < safe.length; k += 20) {
        var chunk = safe.slice(k, k + 20);
        var del = await client.storage.from(BUCKET).remove(chunk);
        if (del.error) { console.error('не удалилось: ' + del.error.message); break; }

        // Считаем только то, что хранилище признало удалённым. При запрете
        // Supabase не возвращает ошибку — он молча отдаёт пустой список,
        // и отчёт «удалено» получался выдуманным
        var done = (del.data || []).length;
        removed += done;

        if (done === 0) {
            console.error('Хранилище не удалило ни одного файла из ' + chunk.length +
                          '. Ошибки нет, значит удаление запрещено правилами доступа ' +
                          'бакета: нужна политика DELETE для роли authenticated.');
            break;
        }
        console.log('  удалено ' + removed + ' из ' + safe.length);
    }

    if (!removed) console.log('Ничего не удалено.');
    else console.log('Готово. Удалено из корня: ' + removed);
    return { removed: removed, missing: missing.length };
}
