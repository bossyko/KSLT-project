/**
 * Выгрузка таблиц базы в файлы — перед удалением тестовых данных.
 *
 * На бесплатном тарифе Supabase автоматических резервных копий нет. Если
 * удалить лишнее, вернуть будет нечем, поэтому копию делаем сами.
 *
 * Запускать в консоли браузера на странице админки, войдя администратором:
 * читать всё подряд может только он. Файлы скачаются по одному.
 *
 *     await backupDatabase()
 */
async function backupDatabase() {
    var TABLES = [
        'profiles', 'players', 'tournaments', 'tournament_registrations',
        'matches', 'rating_history', 'player_badges', 'badge_definitions',
        'challenges', 'challenge_predictions',
        'memberships', 'payments', 'news', 'courts', 'coaches', 'sponsors',
        'tournament_levels', 'points_rules', 'categories'
    ];

    var client = (window.KSLT_ADMIN && window.KSLT_ADMIN.client) || window.supabaseClient;
    if (!client) { console.error('Нет клиента Supabase — открой страницу админки'); return; }

    var dump = {};
    var report = [];

    for (var i = 0; i < TABLES.length; i++) {
        var table = TABLES[i];
        var rows = [];
        var from = 0;

        // Выгружаем страницами: PostgREST отдаёт не больше тысячи строк за раз
        while (true) {
            var res = await client.from(table).select('*').range(from, from + 999);
            if (res.error) {
                report.push(table + ' — пропущено: ' + res.error.message);
                rows = null;
                break;
            }
            rows = rows.concat(res.data || []);
            if (!res.data || res.data.length < 1000) break;
            from += 1000;
        }

        if (rows) {
            dump[table] = rows;
            report.push(table + ' — ' + rows.length + ' строк');
        }
    }

    console.log(report.join('\n'));

    var stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    var blob = new Blob([JSON.stringify(dump, null, 1)], { type: 'application/json' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kslt-backup-' + stamp + '.json';
    a.click();
    setTimeout(function() { URL.revokeObjectURL(a.href); }, 5000);

    var total = Object.values(dump).reduce(function(s, r) { return s + r.length; }, 0);
    console.log('\nВыгружено таблиц: ' + Object.keys(dump).length + ', строк: ' + total);
    console.log('Файл скачан. Положи его туда, откуда не потеряется.');

    return { tables: Object.keys(dump).length, rows: total };
}

window.backupDatabase = backupDatabase;
