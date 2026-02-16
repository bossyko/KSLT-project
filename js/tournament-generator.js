// ========================================
// TOURNAMENT BRACKET GENERATOR
// ========================================
//
// Автоматически генерирует структуру турнира
// для tournament-detail.js рендеринга.
//
// Поддерживает:
//   - Single Elimination 16 (4 сеяных)
//   - Single Elimination 32 (8 сеяных)
//   - Round Robin (группы + плей-офф)
//
// ========================================
// ИСПОЛЬЗОВАНИЕ:
// ========================================
//
// tournamentDetailData["tour-2"] = generateTournament({
//     id: "tour-2",
//     name: "KSLT Tour #2",
//     category: "tour",
//     categoryName: "Tour",
//     date: "1 Марта 2026",
//     dateRange: "1–2 Марта 2026",
//     location: "Бишкек, Ахунбаева 165",
//     time: "09:00 – 18:00",
//     bracketType: "single_elimination",  // или "round_robin"
//     prize: "20,000 сом",
//     courtCount: 3,
//     startTime: "09:00",
//     matchDuration: 90,         // минут
//     days: [
//         { date: "2026-03-01", label: "День 1 — 1 Марта" },
//         { date: "2026-03-02", label: "День 2 — 2 Марта" }
//     ],
//     players: [
//         { name: "Игрок 1", country: "🇰🇬" },
//         { name: "Игрок 2", country: "🇰🇬" },
//         // ... 16 или 32 игрока, ОТСОРТИРОВАНЫ ПО РЕЙТИНГУ
//         // Первые 4 (SE-16) или 8 (SE-32) получат сид автоматически
//     ],
//     // Только для RR:
//     groupCount: 2
// });
//
// ========================================
// ОБНОВЛЕНИЕ СЧЁТА:
// ========================================
//
// После матча найти матч и заполнить:
//   match.score = "6/3 6/4";
//   match.winnerId = 1;
//   match.status = "completed";
//
// Для следующего раунда (SE) вручную заполнить
// player1Id / player2Id победителями.
//
// ========================================


// --- Позиции сеяных в сетке (стандарт ATP/WTA) ---
// Индексы 1-based (позиция в жеребьёвке)
var SEED_POSITIONS = {
    32: [1, 32, 17, 16, 9, 24, 25, 8],  // 8 сеяных
    16: [1, 16, 9, 8]                     // 4 сеяных
};

// --- Названия раундов ---
var ROUND_DEFS = {
    ru: {
        32: [
            { name: "1/16 Финала", nameShort: "R1/16", prefix: "R1" },
            { name: "1/8 Финала", nameShort: "R1/8", prefix: "R2" },
            { name: "Четвертьфинал", nameShort: "QF", prefix: "QF" },
            { name: "Полуфинал", nameShort: "SF", prefix: "SF" },
            { name: "Финал", nameShort: "F", prefix: "F" }
        ],
        16: [
            { name: "1/8 Финала", nameShort: "R1", prefix: "R1" },
            { name: "Четвертьфинал", nameShort: "QF", prefix: "QF" },
            { name: "Полуфинал", nameShort: "SF", prefix: "SF" },
            { name: "Финал", nameShort: "F", prefix: "F" }
        ]
    },
    en: {
        32: [
            { name: "Round of 32", nameShort: "R32", prefix: "R1" },
            { name: "Round of 16", nameShort: "R16", prefix: "R2" },
            { name: "Quarterfinal", nameShort: "QF", prefix: "QF" },
            { name: "Semifinal", nameShort: "SF", prefix: "SF" },
            { name: "Final", nameShort: "F", prefix: "F" }
        ],
        16: [
            { name: "Round of 16", nameShort: "R16", prefix: "R1" },
            { name: "Quarterfinal", nameShort: "QF", prefix: "QF" },
            { name: "Semifinal", nameShort: "SF", prefix: "SF" },
            { name: "Final", nameShort: "F", prefix: "F" }
        ]
    }
};

var GROUP_LABELS = {
    ru: { group: "Группа", first: "За 1-е место", third: "За 3-е место", playoff: "Плей-офф" },
    en: { group: "Group", first: "1st Place Match", third: "3rd Place Match", playoff: "Playoff" }
};


// ========================================
// MAIN GENERATOR
// ========================================

function generateTournament(config) {
    var lang = config.lang || "ru";
    var drawSize = config.players.length;
    var seedCount = 0;

    if (config.bracketType === "single_elimination") {
        seedCount = drawSize >= 32 ? 8 : (drawSize >= 16 ? 4 : 0);
    }

    // Создаём игроков с ID и сидами
    var players = config.players.map(function(p, i) {
        return {
            id: i + 1,
            name: p.name,
            seed: (i < seedCount) ? (i + 1) : null,
            country: p.country || "🇰🇬"
        };
    });

    var courtsLabel = lang === "en"
        ? (config.courtCount || 2) + " courts"
        : (config.courtCount || 2) + " корта";

    var tournament = {
        id: config.id,
        name: config.name,
        category: config.category,
        categoryName: config.categoryName,
        date: config.date,
        dateRange: config.dateRange,
        location: config.location,
        time: config.time,
        format: config.format || (lang === "en" ? "Singles" : "Одиночный"),
        surface: config.surface || (lang === "en" ? "Hard" : "Хард"),
        courts: courtsLabel,
        bracketType: config.bracketType,
        drawSize: drawSize,
        participants: drawSize + "/" + drawSize,
        prize: config.prize || "—",
        status: config.status || "upcoming",
        description: config.description || "",
        bgImage: config.bgImage || "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",
        players: players,
        results: null
    };

    if (config.bracketType === "single_elimination") {
        var se = _generateSE(players, drawSize, seedCount, config, lang);
        tournament.bracket = se.bracket;
        tournament.schedule = se.schedule;
    } else if (config.bracketType === "round_robin") {
        var rr = _generateRR(players, config, lang);
        tournament.roundRobin = rr.roundRobin;
        tournament.schedule = rr.schedule;
    }

    return tournament;
}


// ========================================
// SINGLE ELIMINATION
// ========================================

function _generateSE(players, drawSize, seedCount, config, lang) {
    var positions = SEED_POSITIONS[drawSize];
    var roundDefs = ROUND_DEFS[lang][drawSize];
    var courtCount = config.courtCount || 2;
    var days = config.days || [{ date: "TBD", label: "День 1" }];
    var startTime = config.startTime || "09:00";
    var matchDuration = config.matchDuration || 90;

    // --- Расстановка в сетке ---
    var draw = new Array(drawSize);
    for (var i = 0; i < drawSize; i++) draw[i] = null;

    // Сеяные → фиксированные позиции
    for (var s = 0; s < seedCount; s++) {
        draw[positions[s] - 1] = players[s].id;
    }

    // Несеяные → оставшиеся слоты (по рейтингу, детерминировано)
    var unseeded = players.slice(seedCount);
    var emptySlots = [];
    for (var i = 0; i < drawSize; i++) {
        if (draw[i] === null) emptySlots.push(i);
    }
    for (var i = 0; i < unseeded.length; i++) {
        draw[emptySlots[i]] = unseeded[i].id;
    }

    // --- Генерация раундов ---
    var rounds = [];
    var allMatches = [];

    // Первый раунд — из расстановки
    var firstRound = roundDefs[0];
    var firstMatches = [];
    for (var i = 0; i < drawSize; i += 2) {
        var match = {
            matchId: firstRound.prefix + "-M" + (i / 2 + 1),
            player1Id: draw[i],
            player2Id: draw[i + 1],
            score: "",
            winnerId: null,
            status: "upcoming",
            court: null,
            scheduledTime: null,
            scheduledDay: null
        };
        firstMatches.push(match);
        allMatches.push({ match: match, roundName: firstRound.name });
    }
    rounds.push({
        name: firstRound.name,
        nameShort: firstRound.nameShort,
        matches: firstMatches
    });

    // Последующие раунды — пустые (TBD)
    var prevMatchCount = firstMatches.length;
    for (var r = 1; r < roundDefs.length; r++) {
        var roundDef = roundDefs[r];
        var matchCount = prevMatchCount / 2;
        var matches = [];

        for (var m = 0; m < matchCount; m++) {
            var match = {
                matchId: roundDef.prefix + "-M" + (m + 1),
                player1Id: null,
                player2Id: null,
                score: "",
                winnerId: null,
                status: "upcoming",
                court: null,
                scheduledTime: null,
                scheduledDay: null
            };
            matches.push(match);
            allMatches.push({ match: match, roundName: roundDef.name });
        }

        rounds.push({
            name: roundDef.name,
            nameShort: roundDef.nameShort,
            matches: matches
        });
        prevMatchCount = matchCount;
    }

    // --- Расписание ---
    var schedule = _distributeSchedule(allMatches, days, startTime, matchDuration, courtCount);

    return {
        bracket: { rounds: rounds },
        schedule: schedule
    };
}


// ========================================
// ROUND ROBIN
// ========================================

function _generateRR(players, config, lang) {
    var groupCount = config.groupCount || 2;
    var courtCount = config.courtCount || 2;
    var days = config.days || [{ date: "TBD", label: "День 1" }];
    var startTime = config.startTime || "09:00";
    var matchDuration = config.matchDuration || 60;
    var labels = GROUP_LABELS[lang];
    var groupLetters = "ABCDEFGH";

    // --- Распределение по группам (серпантин по рейтингу) ---
    var groupPlayerIds = [];
    for (var g = 0; g < groupCount; g++) groupPlayerIds.push([]);

    players.forEach(function(player, idx) {
        var row = Math.floor(idx / groupCount);
        var gi = (row % 2 === 0)
            ? (idx % groupCount)
            : (groupCount - 1 - (idx % groupCount));
        groupPlayerIds[gi].push(player.id);
    });

    // --- Матчи в группах ---
    var allMatches = [];
    var rrGroups = [];

    groupPlayerIds.forEach(function(pIds, gi) {
        var letter = groupLetters[gi];
        var groupName = labels.group + " " + letter;
        var matches = [];
        var matchIdx = 1;

        for (var i = 0; i < pIds.length; i++) {
            for (var j = i + 1; j < pIds.length; j++) {
                var match = {
                    matchId: "G" + letter + "-M" + matchIdx,
                    player1Id: pIds[i],
                    player2Id: pIds[j],
                    score: "",
                    winnerId: null,
                    status: "upcoming",
                    court: null,
                    scheduledTime: null,
                    scheduledDay: null
                };
                matches.push(match);
                allMatches.push({ match: match, roundName: groupName });
                matchIdx++;
            }
        }

        // Пустые standings
        var standings = pIds.map(function(pid, idx) {
            return { playerId: pid, wins: 0, losses: 0, points: 0, place: idx + 1 };
        });

        rrGroups.push({
            name: groupName,
            playerIds: pIds,
            matches: matches,
            standings: standings
        });
    });

    // --- Плей-офф ---
    var koFinal = {
        matchId: "KO-F",
        player1Id: null, player2Id: null,
        score: "", winnerId: null, status: "upcoming",
        court: null, scheduledTime: null, scheduledDay: null
    };
    var ko3rd = {
        matchId: "KO-3",
        player1Id: null, player2Id: null,
        score: "", winnerId: null, status: "upcoming",
        court: null, scheduledTime: null, scheduledDay: null
    };

    allMatches.push({ match: koFinal, roundName: labels.first });
    allMatches.push({ match: ko3rd, roundName: labels.third });

    // --- Расписание ---
    var schedule = _distributeSchedule(allMatches, days, startTime, matchDuration, courtCount);

    return {
        roundRobin: {
            groups: rrGroups,
            knockout: {
                rounds: [
                    { name: labels.first, matches: [koFinal] },
                    { name: labels.third, matches: [ko3rd] }
                ]
            }
        },
        schedule: schedule
    };
}


// ========================================
// SCHEDULE DISTRIBUTION
// ========================================

function _distributeSchedule(allMatches, days, startTime, matchDuration, courtCount) {
    var startMin = _timeToMin(startTime);

    // Группируем матчи по раундам
    var roundGroups = [];
    var lastRound = null;
    allMatches.forEach(function(md) {
        if (md.roundName !== lastRound) {
            roundGroups.push([]);
            lastRound = md.roundName;
        }
        roundGroups[roundGroups.length - 1].push(md);
    });

    // Распределяем раунды по дням (жадный алгоритм)
    // SE-32 + 3 дня → День1: R1(16), День2: R2+QF(12), День3: SF+F(3)
    // SE-16 + 2 дня → День1: R1+QF(12), День2: SF+F(3)
    var total = allMatches.length;
    var avgPerDay = total / days.length;
    var dayBuckets = [];
    var bucket = [];
    var bucketSize = 0;

    for (var i = 0; i < roundGroups.length; i++) {
        var rg = roundGroups[i];
        var daysLeft = days.length - dayBuckets.length;
        var roundsLeft = roundGroups.length - i;

        if (bucket.length > 0 && daysLeft > 1 &&
            (roundsLeft <= daysLeft || bucketSize + rg.length > avgPerDay * 2)) {
            dayBuckets.push(bucket);
            bucket = [];
            bucketSize = 0;
        }

        bucket = bucket.concat(rg);
        bucketSize += rg.length;
    }
    if (bucket.length > 0) dayBuckets.push(bucket);

    // Подгоняем под количество дней
    while (dayBuckets.length < days.length) dayBuckets.push([]);
    while (dayBuckets.length > days.length) {
        var last = dayBuckets.pop();
        dayBuckets[dayBuckets.length - 1] = dayBuckets[dayBuckets.length - 1].concat(last);
    }

    // Генерируем расписание с временными слотами
    var daySchedules = [];

    dayBuckets.forEach(function(matches, di) {
        var day = days[di];
        var dayMatches = [];
        var currentMin = startMin;
        var courtIdx = 0;

        matches.forEach(function(md) {
            var court = (courtIdx % courtCount) + 1;
            var time = _minToTime(currentMin);

            md.match.court = court;
            md.match.scheduledTime = time;
            md.match.scheduledDay = day.date;

            dayMatches.push({
                matchId: md.match.matchId,
                time: time,
                court: court,
                player1Id: md.match.player1Id,
                player2Id: md.match.player2Id,
                roundName: md.roundName,
                status: "upcoming",
                score: "",
                winnerId: null
            });

            courtIdx++;
            if (courtIdx % courtCount === 0) {
                currentMin += matchDuration;
            }
        });

        daySchedules.push({
            date: day.date,
            label: day.label,
            matches: dayMatches
        });
    });

    return { days: daySchedules };
}


// ========================================
// HELPERS
// ========================================

function _timeToMin(t) {
    var p = t.split(":");
    return parseInt(p[0]) * 60 + parseInt(p[1]);
}

function _minToTime(m) {
    var h = Math.floor(m / 60);
    var mm = m % 60;
    return (h < 10 ? "0" : "") + h + ":" + (mm < 10 ? "0" : "") + mm;
}
