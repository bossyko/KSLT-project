/**
 * Разовая перезапись файлов хранилища с правильным сроком кэша.
 *
 * Картинки отдавались с «no-cache»: браузеру запрещено их запоминать, и при
 * каждом открытии страницы всё скачивалось заново. 80 МБ файлов давали 27 ГБ
 * трафика при бесплатном лимите в 5 ГБ.
 *
 * Заголовок берётся из самого файла, а не из строки в базе, — правка
 * метаданных запросом на выдачу не влияет. Поэтому файлы нужно перезаписать.
 *
 * Запускать в консоли браузера на странице админки, войдя администратором:
 * права на запись в хранилище есть только у него.
 *
 *     await fixStorageCache('news')
 *     await fixStorageCache('avatars')
 */
async function fixStorageCache(bucket) {
    var CACHE = {
        // Имена файлов случайные и не переиспользуются — картинка по адресу
        // всегда одна и та же, можно кэшировать на год
        news: '31536000',
        // Аватар лежит по постоянному адресу, но к ссылке дописывается метка
        // времени, поэтому новая фотография подхватывается сразу
        avatars: '31536000'
    };
    var cacheControl = CACHE[bucket] || '604800';

    var client = window.KSLT_ADMIN ? window.KSLT_ADMIN.client : window.supabaseClient;
    if (!client) { console.error('Нет клиента Supabase — открой страницу админки'); return; }

    // Список файлов, включая вложенные папки
    async function listAll(prefix) {
        var out = [];
        var page = 0;
        while (true) {
            var res = await client.storage.from(bucket).list(prefix, { limit: 100, offset: page * 100 });
            if (res.error) { console.error(res.error); break; }
            var items = res.data || [];
            for (var i = 0; i < items.length; i++) {
                var name = prefix ? prefix + '/' + items[i].name : items[i].name;
                if (items[i].id === null) {
                    out = out.concat(await listAll(name));   // папка
                } else {
                    out.push(name);
                }
            }
            if (items.length < 100) break;
            page++;
        }
        return out;
    }

    var files = await listAll('');
    console.log('Файлов в «' + bucket + '»: ' + files.length);

    var done = 0, failed = 0;
    for (var i = 0; i < files.length; i++) {
        var path = files[i];
        try {
            var dl = await client.storage.from(bucket).download(path);
            if (dl.error) throw dl.error;

            var up = await client.storage.from(bucket).update(path, dl.data, {
                cacheControl: cacheControl,
                upsert: true,
                contentType: dl.data.type || undefined
            });
            if (up.error) throw up.error;

            done++;
        } catch (e) {
            failed++;
            console.warn('не удалось: ' + path, e.message || e);
        }
        if ((i + 1) % 20 === 0) console.log('  ' + (i + 1) + ' из ' + files.length);
    }

    console.log('Готово: перезаписано ' + done + ', с ошибкой ' + failed);
    return { bucket: bucket, total: files.length, done: done, failed: failed };
}

window.fixStorageCache = fixStorageCache;
