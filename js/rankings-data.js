// ============================================
// Рейтинг — откуда берутся данные
// ============================================
//
// Один источник для страницы рейтинга и для блока «Топ рейтинга» на главной.
// Раньше на главной висели восемьдесят две строки, вписанные в разметку
// руками: выдуманные имена, выдуманные очки, и они не менялись никогда.
//
// Возвращает объект вида { 'men-promasters': { name, gender, players: [...] } }.
// Очки берутся по категориям: игрок может стоять в двух — своей и на ступень
// выше, если там играл.
//
// window.KSLT_RANKINGS.load()

(function() {
    'use strict';

    var CU = window.KSLT_COUNTRY;

    async function load() {
        if (!window.supabaseClient) return null;
        var client = window.supabaseClient;
        var isEn = window.location.pathname.indexOf('-en') !== -1;
        var isKg = window.location.pathname.indexOf('-kg') !== -1;

        try {
            // Load categories
            // Сильные категории сверху: Pro-Masters → Masters → Tour → Challenger → Futures
            var catResult = await client.from('categories').select('*').order('sort_order', { ascending: false });
            if (catResult.error || !catResult.data || catResult.data.length === 0) return null;

            // Рейтинг только одиночный: парные и микст очков не дают
            var plrResult = await client.from('players').select('*').order('points', { ascending: false });
            if (plrResult.error) return null;

            var players = plrResult.data || [];
            var categories = catResult.data;

            // Очки по категориям: игрок может стоять в двух — своей и на ступень
            // выше, если играл там. В каждой таблице он показан со своими очками
            // именно этой категории.
            var pcRes = await client.from('player_categories')
                .select('player_id, category_id, points, closed_at');
            var pointsIn = {};
            var closedIn = {};
            (pcRes.data || []).forEach(function(r) {
                // Закрытая категория из рейтинга уходит: игрок в ней больше не
                // выступает. Очки и история остаются при нём, их видно в кабинете
                if (r.closed_at) {
                    if (!closedIn[r.category_id]) closedIn[r.category_id] = {};
                    closedIn[r.category_id][r.player_id] = true;
                    return;
                }
                if (!pointsIn[r.category_id]) pointsIn[r.category_id] = {};
                pointsIn[r.category_id][r.player_id] = r.points || 0;
            });

            // Build categoriesData: composite keys men-{catId} / women-{catId}
            // Categories are gender-neutral (masters, tour), player.gender is separate
            // Нерейтинговые категории в таблицы не идут. Раньше их узнавали по
            // слову «friendly» в названии — переименование ломало проверку.
            // Признак по идентификатору оставлен запасным: он работает и до
            // того, как в базе появится колонка is_rating.
            var result = {};
            var genders = ['men', 'women'];
            categories.forEach(function(cat) {
                if (cat.is_rating === false || cat.id === 'friendly') return;
                var catName = isEn ? (cat.name_en || cat.name) : (isKg ? (cat.name_kg || cat.name) : cat.name);
                genders.forEach(function(g) {
                    var inCat = pointsIn[cat.id] || {};
                    var closedHere = closedIn[cat.id] || {};
                    var catPlayers = players.filter(function(p) {
                        if (p.gender !== g) return false;
                        if (closedHere[p.id]) return false;
                        // Домашняя категория — всегда, чужая — только если там есть очки
                        return p.category_id === cat.id || inCat[p.id] > 0;
                    }).sort(function(a, b) {
                        return (inCat[b.id] || 0) - (inCat[a.id] || 0);
                    });
                    if (catPlayers.length === 0) return;
                    var key = g + '-' + cat.id;
                    result[key] = {
                        name: catName,
                        gender: g,
                        genderLabel: isEn ? (g === 'men' ? 'Men' : 'Women') : (isKg ? (g === 'men' ? 'Эркектер' : 'Аялдар') : (g === 'men' ? 'Мужчины' : 'Женщины')),
                        players: catPlayers.map(function(p) {
                            return {
                                id: p.id,
                                name: isEn ? (p.name_en || p.name) : (isKg ? (p.name_kg || p.name) : p.name),
                                photo: p.photo || 'https://placehold.co/80x80/1a1a1a/888?text=?',
                                country: (CU ? CU.flagEmoji(CU.normalizeCountry(p.country)) : p.country) || '🇰🇬',
                                points: inCat[p.id] || 0,
                                wins: p.wins || 0,
                                losses: p.losses || 0,
                                change: p.rank_change || 0,
                                form: p.form || [],
                                online: false,
                                ntrp_rating: p.ntrp_rating || null,
                                banned_until: p.banned_until || null
                            };
                        })
                    };
                });
            });

            return result;
        } catch (e) {
            console.error('Supabase players load error:', e);
            return null;
        }
    }


    window.KSLT_RANKINGS = { load: load };
})();
