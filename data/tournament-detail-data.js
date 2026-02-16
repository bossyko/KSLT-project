// ========================================
// TOURNAMENT DETAIL DATA (RU) - Replace with API later
// ========================================

const tournamentDetailData = {
    // === SINGLE ELIMINATION — 16 draw, completed ===
    "tour-1": {
        id: "tour-1",
        name: "KSLT Tour Open #1",
        category: "tour",
        categoryName: "Tour",
        date: "15 Февраля 2026",
        dateRange: "15–16 Февраля 2026",
        location: "Бишкек, Ахунбаева 165",
        time: "09:00 – 18:00",
        format: "Одиночный",
        surface: "Хард",
        courts: "3 корта",
        bracketType: "single_elimination",
        drawSize: 16,
        participants: "16/16",
        prize: "15,000 сом",
        status: "completed",
        description: "Первый турнир сезона Tour. Открытый для всех уровней.",
        bgImage: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",

        players: [
            { id: 1, name: "Самат Джолдошев", seed: 1, country: "🇰🇬" },
            { id: 2, name: "Арсен Калыков", seed: 2, country: "🇰🇬" },
            { id: 3, name: "Бегалы Маматов", seed: 3, country: "🇰🇬" },
            { id: 4, name: "Нуржигит Асылбеков", seed: 4, country: "🇰🇿" },
            { id: 5, name: "Жаныш Омуралиев", seed: 5, country: "🇰🇬" },
            { id: 6, name: "Тилек Субанов", seed: 6, country: "🇰🇬" },
            { id: 7, name: "Мурат Байсалов", seed: 7, country: "🇰🇬" },
            { id: 8, name: "Чынгыз Касымалиев", seed: 8, country: "🇰🇬" },
            { id: 9, name: "Эрмек Токтоев", seed: null, country: "🇰🇬" },
            { id: 10, name: "Бакыт Сатаров", seed: null, country: "🇰🇬" },
            { id: 11, name: "Алмаз Жумабеков", seed: null, country: "🇰🇬" },
            { id: 12, name: "Данияр Эсенов", seed: null, country: "🇰🇬" },
            { id: 13, name: "Кайрат Болотов", seed: null, country: "🇰🇬" },
            { id: 14, name: "Нурбек Садыков", seed: null, country: "🇰🇬" },
            { id: 15, name: "Тимур Орозбаев", seed: null, country: "🇰🇬" },
            { id: 16, name: "Руслан Бектуров", seed: null, country: "🇰🇬" }
        ],

        bracket: {
            rounds: [
                {
                    name: "1/8 Финала",
                    nameShort: "R1",
                    matches: [
                        { matchId: "R1-M1", player1Id: 1, player2Id: 16, score: "6/2 6/1", winnerId: 1, status: "completed", court: 1, scheduledTime: "09:00", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M2", player1Id: 8, player2Id: 9, score: "6/4 7/5", winnerId: 8, status: "completed", court: 2, scheduledTime: "09:00", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M3", player1Id: 4, player2Id: 13, score: "6/3 6/4", winnerId: 4, status: "completed", court: 3, scheduledTime: "09:00", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M4", player1Id: 5, player2Id: 12, score: "6/1 6/3", winnerId: 5, status: "completed", court: 1, scheduledTime: "10:30", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M5", player1Id: 3, player2Id: 14, score: "6/0 6/2", winnerId: 3, status: "completed", court: 2, scheduledTime: "10:30", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M6", player1Id: 6, player2Id: 11, score: "3/6 6/4 6/3", winnerId: 6, status: "completed", court: 3, scheduledTime: "10:30", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M7", player1Id: 7, player2Id: 10, score: "6/4 6/7 7/5", winnerId: 10, status: "completed", court: 1, scheduledTime: "12:00", scheduledDay: "2026-02-15" },
                        { matchId: "R1-M8", player1Id: 2, player2Id: 15, score: "6/1 6/0", winnerId: 2, status: "completed", court: 2, scheduledTime: "12:00", scheduledDay: "2026-02-15" }
                    ]
                },
                {
                    name: "Четвертьфинал",
                    nameShort: "QF",
                    matches: [
                        { matchId: "QF-M1", player1Id: 1, player2Id: 8, score: "6/3 6/2", winnerId: 1, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M2", player1Id: 4, player2Id: 5, score: "4/6 6/3 7/6", winnerId: 5, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M3", player1Id: 3, player2Id: 6, score: "6/4 6/3", winnerId: 3, status: "completed", court: 3, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M4", player1Id: 10, player2Id: 2, score: "3/6 2/6", winnerId: 2, status: "completed", court: 1, scheduledTime: "16:00", scheduledDay: "2026-02-15" }
                    ]
                },
                {
                    name: "Полуфинал",
                    nameShort: "SF",
                    matches: [
                        { matchId: "SF-M1", player1Id: 1, player2Id: 5, score: "6/4 3/6 6/2", winnerId: 1, status: "completed", court: 1, scheduledTime: "10:00", scheduledDay: "2026-02-16" },
                        { matchId: "SF-M2", player1Id: 3, player2Id: 2, score: "6/7 6/4 7/5", winnerId: 2, status: "completed", court: 2, scheduledTime: "10:00", scheduledDay: "2026-02-16" }
                    ]
                },
                {
                    name: "Финал",
                    nameShort: "F",
                    matches: [
                        { matchId: "F-M1", player1Id: 1, player2Id: 2, score: "6/3 4/6 6/4", winnerId: 1, status: "completed", court: 1, scheduledTime: "15:00", scheduledDay: "2026-02-16" }
                    ]
                }
            ]
        },

        schedule: {
            days: [
                {
                    date: "2026-02-15",
                    label: "День 1 — 15 Февраля",
                    matches: [
                        { matchId: "R1-M1", time: "09:00", court: 1, player1Id: 1, player2Id: 16, roundName: "1/8 Финала", status: "completed", score: "6/2 6/1", winnerId: 1 },
                        { matchId: "R1-M2", time: "09:00", court: 2, player1Id: 8, player2Id: 9, roundName: "1/8 Финала", status: "completed", score: "6/4 7/5", winnerId: 8 },
                        { matchId: "R1-M3", time: "09:00", court: 3, player1Id: 4, player2Id: 13, roundName: "1/8 Финала", status: "completed", score: "6/3 6/4", winnerId: 4 },
                        { matchId: "R1-M4", time: "10:30", court: 1, player1Id: 5, player2Id: 12, roundName: "1/8 Финала", status: "completed", score: "6/1 6/3", winnerId: 5 },
                        { matchId: "R1-M5", time: "10:30", court: 2, player1Id: 3, player2Id: 14, roundName: "1/8 Финала", status: "completed", score: "6/0 6/2", winnerId: 3 },
                        { matchId: "R1-M6", time: "10:30", court: 3, player1Id: 6, player2Id: 11, roundName: "1/8 Финала", status: "completed", score: "3/6 6/4 6/3", winnerId: 6 },
                        { matchId: "R1-M7", time: "12:00", court: 1, player1Id: 7, player2Id: 10, roundName: "1/8 Финала", status: "completed", score: "6/4 6/7 7/5", winnerId: 10 },
                        { matchId: "R1-M8", time: "12:00", court: 2, player1Id: 2, player2Id: 15, roundName: "1/8 Финала", status: "completed", score: "6/1 6/0", winnerId: 2 },
                        { matchId: "QF-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 8, roundName: "Четвертьфинал", status: "completed", score: "6/3 6/2", winnerId: 1 },
                        { matchId: "QF-M2", time: "14:00", court: 2, player1Id: 4, player2Id: 5, roundName: "Четвертьфинал", status: "completed", score: "4/6 6/3 7/6", winnerId: 5 },
                        { matchId: "QF-M3", time: "14:00", court: 3, player1Id: 3, player2Id: 6, roundName: "Четвертьфинал", status: "completed", score: "6/4 6/3", winnerId: 3 },
                        { matchId: "QF-M4", time: "16:00", court: 1, player1Id: 10, player2Id: 2, roundName: "Четвертьфинал", status: "completed", score: "3/6 2/6", winnerId: 2 }
                    ]
                },
                {
                    date: "2026-02-16",
                    label: "День 2 — 16 Февраля",
                    matches: [
                        { matchId: "SF-M1", time: "10:00", court: 1, player1Id: 1, player2Id: 5, roundName: "Полуфинал", status: "completed", score: "6/4 3/6 6/2", winnerId: 1 },
                        { matchId: "SF-M2", time: "10:00", court: 2, player1Id: 3, player2Id: 2, roundName: "Полуфинал", status: "completed", score: "6/7 6/4 7/5", winnerId: 2 },
                        { matchId: "F-M1", time: "15:00", court: 1, player1Id: 1, player2Id: 2, roundName: "Финал", status: "completed", score: "6/3 4/6 6/4", winnerId: 1 }
                    ]
                }
            ]
        },

        results: {
            winner: { playerId: 1, prize: "8,000 сом" },
            runnerUp: { playerId: 2, prize: "4,000 сом" },
            semifinalists: [
                { playerId: 5, prize: "1,500 сом" },
                { playerId: 3, prize: "1,500 сом" }
            ]
        }
    },

    // === ROUND ROBIN — completed ===
    "friendly-1": {
        id: "friendly-1",
        name: "Weekend Friendly #5",
        category: "friendly",
        categoryName: "Friendly",
        date: "17 Февраля 2026",
        dateRange: "17 Февраля 2026",
        location: "Бишкек, Асанбай",
        time: "14:00 – 18:00",
        format: "Одиночный",
        surface: "Хард",
        courts: "2 корта",
        bracketType: "round_robin",
        drawSize: 8,
        participants: "8/8",
        prize: "Без призового",
        status: "completed",
        description: "Дружеский турнир без рейтинговых очков. Играйте в удовольствие!",
        bgImage: "https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=1920&q=80",

        players: [
            { id: 1, name: "Азат Базаркулов", seed: null, country: "🇰🇬" },
            { id: 2, name: "Эльдияр Боруев", seed: null, country: "🇰🇬" },
            { id: 3, name: "Нурбек Нурбеков", seed: null, country: "🇰🇬" },
            { id: 4, name: "Максат Турдалиев", seed: null, country: "🇰🇬" },
            { id: 5, name: "Бакыт Эргешов", seed: null, country: "🇰🇬" },
            { id: 6, name: "Адилет Сыдыков", seed: null, country: "🇰🇬" },
            { id: 7, name: "Талант Оморов", seed: null, country: "🇰🇬" },
            { id: 8, name: "Улан Кожоев", seed: null, country: "🇰🇬" }
        ],

        roundRobin: {
            groups: [
                {
                    name: "Группа A",
                    playerIds: [1, 2, 3, 4],
                    matches: [
                        { matchId: "GA-M1", player1Id: 1, player2Id: 2, score: "0/6 3/6", winnerId: 2, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-17" },
                        { matchId: "GA-M2", player1Id: 1, player2Id: 3, score: "1/6 1/6", winnerId: 3, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-17" },
                        { matchId: "GA-M3", player1Id: 1, player2Id: 4, score: "6/3 6/4", winnerId: 1, status: "completed", court: 1, scheduledTime: "14:45", scheduledDay: "2026-02-17" },
                        { matchId: "GA-M4", player1Id: 2, player2Id: 3, score: "6/1 6/0", winnerId: 2, status: "completed", court: 2, scheduledTime: "14:45", scheduledDay: "2026-02-17" },
                        { matchId: "GA-M5", player1Id: 2, player2Id: 4, score: "6/2 6/1", winnerId: 2, status: "completed", court: 1, scheduledTime: "15:30", scheduledDay: "2026-02-17" },
                        { matchId: "GA-M6", player1Id: 3, player2Id: 4, score: "6/3 6/2", winnerId: 3, status: "completed", court: 2, scheduledTime: "15:30", scheduledDay: "2026-02-17" }
                    ],
                    standings: [
                        { playerId: 2, wins: 3, losses: 0, points: 6, place: 1 },
                        { playerId: 3, wins: 2, losses: 1, points: 4, place: 2 },
                        { playerId: 1, wins: 1, losses: 2, points: 2, place: 3 },
                        { playerId: 4, wins: 0, losses: 3, points: 0, place: 4 }
                    ]
                },
                {
                    name: "Группа B",
                    playerIds: [5, 6, 7, 8],
                    matches: [
                        { matchId: "GB-M1", player1Id: 5, player2Id: 6, score: "6/4 6/3", winnerId: 5, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-17" },
                        { matchId: "GB-M2", player1Id: 5, player2Id: 7, score: "3/6 6/4 6/2", winnerId: 5, status: "completed", court: 2, scheduledTime: "14:45", scheduledDay: "2026-02-17" },
                        { matchId: "GB-M3", player1Id: 5, player2Id: 8, score: "6/7 4/6", winnerId: 8, status: "completed", court: 1, scheduledTime: "15:30", scheduledDay: "2026-02-17" },
                        { matchId: "GB-M4", player1Id: 6, player2Id: 7, score: "6/3 6/4", winnerId: 6, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-17" },
                        { matchId: "GB-M5", player1Id: 6, player2Id: 8, score: "4/6 3/6", winnerId: 8, status: "completed", court: 1, scheduledTime: "14:45", scheduledDay: "2026-02-17" },
                        { matchId: "GB-M6", player1Id: 7, player2Id: 8, score: "6/4 3/6 6/7", winnerId: 8, status: "completed", court: 2, scheduledTime: "15:30", scheduledDay: "2026-02-17" }
                    ],
                    standings: [
                        { playerId: 8, wins: 3, losses: 0, points: 6, place: 1 },
                        { playerId: 5, wins: 2, losses: 1, points: 4, place: 2 },
                        { playerId: 6, wins: 1, losses: 2, points: 2, place: 3 },
                        { playerId: 7, wins: 0, losses: 3, points: 0, place: 4 }
                    ]
                }
            ],
            knockout: {
                rounds: [
                    {
                        name: "За 1-е место",
                        matches: [
                            { matchId: "KO-F", player1Id: 2, player2Id: 8, score: "6/3 7/5", winnerId: 2, status: "completed", court: 1, scheduledTime: "16:30", scheduledDay: "2026-02-17" }
                        ]
                    },
                    {
                        name: "За 3-е место",
                        matches: [
                            { matchId: "KO-3", player1Id: 3, player2Id: 5, score: "6/4 6/4", winnerId: 3, status: "completed", court: 2, scheduledTime: "16:30", scheduledDay: "2026-02-17" }
                        ]
                    }
                ]
            }
        },

        schedule: {
            days: [
                {
                    date: "2026-02-17",
                    label: "17 Февраля",
                    matches: [
                        { matchId: "GA-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 2, roundName: "Группа A", status: "completed", score: "0/6 3/6", winnerId: 2 },
                        { matchId: "GA-M2", time: "14:00", court: 2, player1Id: 1, player2Id: 3, roundName: "Группа A", status: "completed", score: "1/6 1/6", winnerId: 3 },
                        { matchId: "GB-M1", time: "14:00", court: 1, player1Id: 5, player2Id: 6, roundName: "Группа B", status: "completed", score: "6/4 6/3", winnerId: 5 },
                        { matchId: "GA-M3", time: "14:45", court: 1, player1Id: 1, player2Id: 4, roundName: "Группа A", status: "completed", score: "6/3 6/4", winnerId: 1 },
                        { matchId: "GA-M4", time: "14:45", court: 2, player1Id: 2, player2Id: 3, roundName: "Группа A", status: "completed", score: "6/1 6/0", winnerId: 2 },
                        { matchId: "GB-M2", time: "14:45", court: 2, player1Id: 5, player2Id: 7, roundName: "Группа B", status: "completed", score: "3/6 6/4 6/2", winnerId: 5 },
                        { matchId: "GA-M5", time: "15:30", court: 1, player1Id: 2, player2Id: 4, roundName: "Группа A", status: "completed", score: "6/2 6/1", winnerId: 2 },
                        { matchId: "GA-M6", time: "15:30", court: 2, player1Id: 3, player2Id: 4, roundName: "Группа A", status: "completed", score: "6/3 6/2", winnerId: 3 },
                        { matchId: "GB-M3", time: "15:30", court: 1, player1Id: 5, player2Id: 8, roundName: "Группа B", status: "completed", score: "6/7 4/6", winnerId: 8 },
                        { matchId: "GB-M4", time: "14:00", court: 2, player1Id: 6, player2Id: 7, roundName: "Группа B", status: "completed", score: "6/3 6/4", winnerId: 6 },
                        { matchId: "GB-M5", time: "14:45", court: 1, player1Id: 6, player2Id: 8, roundName: "Группа B", status: "completed", score: "4/6 3/6", winnerId: 8 },
                        { matchId: "GB-M6", time: "15:30", court: 2, player1Id: 7, player2Id: 8, roundName: "Группа B", status: "completed", score: "6/4 3/6 6/7", winnerId: 8 },
                        { matchId: "KO-F", time: "16:30", court: 1, player1Id: 2, player2Id: 8, roundName: "За 1-е место", status: "completed", score: "6/3 7/5", winnerId: 2 },
                        { matchId: "KO-3", time: "16:30", court: 2, player1Id: 3, player2Id: 5, roundName: "За 3-е место", status: "completed", score: "6/4 6/4", winnerId: 3 }
                    ]
                }
            ]
        },

        results: {
            winner: { playerId: 2, prize: "—" },
            runnerUp: { playerId: 8, prize: "—" },
            semifinalists: [
                { playerId: 3, prize: "—" },
                { playerId: 5, prize: "—" }
            ]
        }
    },

    // === LIVE TOURNAMENT — SE 16, in progress ===
    "masters-1": {
        id: "masters-1",
        name: "KSLT Masters Series #1",
        category: "masters",
        categoryName: "Masters",
        date: "14 Февраля 2026",
        dateRange: "14–15 Февраля 2026",
        location: "Бишкек, Central Court",
        time: "09:00 – 18:00",
        format: "Одиночный",
        surface: "Хард",
        courts: "4 корта",
        bracketType: "single_elimination",
        drawSize: 16,
        participants: "16/16",
        prize: "40,000 сом",
        status: "live",
        description: "Первый турнир серии Masters 2026.",
        bgImage: "https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=1920&q=80",

        players: [
            { id: 1, name: "Бекжан Турсунов", seed: 1, country: "🇰🇬" },
            { id: 2, name: "Нурлан Кыдыров", seed: 2, country: "🇰🇬" },
            { id: 3, name: "Марат Сулейманов", seed: 3, country: "🇰🇿" },
            { id: 4, name: "Азат Жаныбеков", seed: 4, country: "🇰🇬" },
            { id: 5, name: "Кенжебек Алиев", seed: 5, country: "🇺🇿" },
            { id: 6, name: "Саламат Орозов", seed: 6, country: "🇰🇬" },
            { id: 7, name: "Иван Шевченко", seed: 7, country: "🇷🇺" },
            { id: 8, name: "Алмаз Токтогулов", seed: 8, country: "🇰🇬" },
            { id: 9, name: "Жанат Касымов", seed: null, country: "🇰🇬" },
            { id: 10, name: "Эмиль Болотов", seed: null, country: "🇰🇬" },
            { id: 11, name: "Нурсултан Касымов", seed: null, country: "🇰🇬" },
            { id: 12, name: "Бакыт Эргешов", seed: null, country: "🇰🇬" },
            { id: 13, name: "Адилет Сыдыков", seed: null, country: "🇰🇬" },
            { id: 14, name: "Максат Турдалиев", seed: null, country: "🇰🇬" },
            { id: 15, name: "Серик Нурмухамедов", seed: null, country: "🇰🇿" },
            { id: 16, name: "Улан Кожоев", seed: null, country: "🇰🇬" }
        ],

        bracket: {
            rounds: [
                {
                    name: "1/8 Финала",
                    nameShort: "R1",
                    matches: [
                        { matchId: "R1-M1", player1Id: 1, player2Id: 16, score: "6/1 6/2", winnerId: 1, status: "completed", court: 1, scheduledTime: "09:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M2", player1Id: 8, player2Id: 9, score: "6/3 6/4", winnerId: 8, status: "completed", court: 2, scheduledTime: "09:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M3", player1Id: 4, player2Id: 13, score: "6/2 6/3", winnerId: 4, status: "completed", court: 3, scheduledTime: "09:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M4", player1Id: 5, player2Id: 12, score: "7/5 6/4", winnerId: 5, status: "completed", court: 4, scheduledTime: "09:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M5", player1Id: 3, player2Id: 14, score: "6/1 6/3", winnerId: 3, status: "completed", court: 1, scheduledTime: "11:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M6", player1Id: 6, player2Id: 11, score: "6/4 6/2", winnerId: 6, status: "completed", court: 2, scheduledTime: "11:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M7", player1Id: 7, player2Id: 10, score: "6/3 3/6 7/5", winnerId: 7, status: "completed", court: 3, scheduledTime: "11:00", scheduledDay: "2026-02-14" },
                        { matchId: "R1-M8", player1Id: 2, player2Id: 15, score: "6/0 6/2", winnerId: 2, status: "completed", court: 4, scheduledTime: "11:00", scheduledDay: "2026-02-14" }
                    ]
                },
                {
                    name: "Четвертьфинал",
                    nameShort: "QF",
                    matches: [
                        { matchId: "QF-M1", player1Id: 1, player2Id: 8, score: "6/4 6/3", winnerId: 1, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M2", player1Id: 4, player2Id: 5, score: "3/6 6/2 6/4", winnerId: 4, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M3", player1Id: 3, player2Id: 6, score: "5/4", winnerId: null, status: "live", court: 1, scheduledTime: "16:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M4", player1Id: 7, player2Id: 2, score: "", winnerId: null, status: "upcoming", court: 2, scheduledTime: "16:00", scheduledDay: "2026-02-14" }
                    ]
                },
                {
                    name: "Полуфинал",
                    nameShort: "SF",
                    matches: [
                        { matchId: "SF-M1", player1Id: 1, player2Id: 4, score: "", winnerId: null, status: "upcoming", court: 1, scheduledTime: "10:00", scheduledDay: "2026-02-15" },
                        { matchId: "SF-M2", player1Id: null, player2Id: null, score: "", winnerId: null, status: "upcoming", court: 2, scheduledTime: "10:00", scheduledDay: "2026-02-15" }
                    ]
                },
                {
                    name: "Финал",
                    nameShort: "F",
                    matches: [
                        { matchId: "F-M1", player1Id: null, player2Id: null, score: "", winnerId: null, status: "upcoming", court: 1, scheduledTime: "15:00", scheduledDay: "2026-02-15" }
                    ]
                }
            ]
        },

        schedule: {
            days: [
                {
                    date: "2026-02-14",
                    label: "День 1 — 14 Февраля",
                    matches: [
                        { matchId: "R1-M1", time: "09:00", court: 1, player1Id: 1, player2Id: 16, roundName: "1/8 Финала", status: "completed", score: "6/1 6/2", winnerId: 1 },
                        { matchId: "R1-M2", time: "09:00", court: 2, player1Id: 8, player2Id: 9, roundName: "1/8 Финала", status: "completed", score: "6/3 6/4", winnerId: 8 },
                        { matchId: "R1-M3", time: "09:00", court: 3, player1Id: 4, player2Id: 13, roundName: "1/8 Финала", status: "completed", score: "6/2 6/3", winnerId: 4 },
                        { matchId: "R1-M4", time: "09:00", court: 4, player1Id: 5, player2Id: 12, roundName: "1/8 Финала", status: "completed", score: "7/5 6/4", winnerId: 5 },
                        { matchId: "R1-M5", time: "11:00", court: 1, player1Id: 3, player2Id: 14, roundName: "1/8 Финала", status: "completed", score: "6/1 6/3", winnerId: 3 },
                        { matchId: "R1-M6", time: "11:00", court: 2, player1Id: 6, player2Id: 11, roundName: "1/8 Финала", status: "completed", score: "6/4 6/2", winnerId: 6 },
                        { matchId: "R1-M7", time: "11:00", court: 3, player1Id: 7, player2Id: 10, roundName: "1/8 Финала", status: "completed", score: "6/3 3/6 7/5", winnerId: 7 },
                        { matchId: "R1-M8", time: "11:00", court: 4, player1Id: 2, player2Id: 15, roundName: "1/8 Финала", status: "completed", score: "6/0 6/2", winnerId: 2 },
                        { matchId: "QF-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 8, roundName: "Четвертьфинал", status: "completed", score: "6/4 6/3", winnerId: 1 },
                        { matchId: "QF-M2", time: "14:00", court: 2, player1Id: 4, player2Id: 5, roundName: "Четвертьфинал", status: "completed", score: "3/6 6/2 6/4", winnerId: 4 },
                        { matchId: "QF-M3", time: "16:00", court: 1, player1Id: 3, player2Id: 6, roundName: "Четвертьфинал", status: "live", score: "5/4", winnerId: null },
                        { matchId: "QF-M4", time: "16:00", court: 2, player1Id: 7, player2Id: 2, roundName: "Четвертьфинал", status: "upcoming", score: "", winnerId: null }
                    ]
                },
                {
                    date: "2026-02-15",
                    label: "День 2 — 15 Февраля",
                    matches: [
                        { matchId: "SF-M1", time: "10:00", court: 1, player1Id: 1, player2Id: 4, roundName: "Полуфинал", status: "upcoming", score: "", winnerId: null },
                        { matchId: "SF-M2", time: "10:00", court: 2, player1Id: null, player2Id: null, roundName: "Полуфинал", status: "upcoming", score: "", winnerId: null },
                        { matchId: "F-M1", time: "15:00", court: 1, player1Id: null, player2Id: null, roundName: "Финал", status: "upcoming", score: "", winnerId: null }
                    ]
                }
            ]
        },

        results: null
    }
};

// ========================================
// SE-32 — Генерируется автоматически
// ========================================
// Чтобы создать новый турнир, скопируй этот блок
// и замени имена игроков + мета-данные.
// Игроки ОТСОРТИРОВАНЫ ПО РЕЙТИНГУ — первые 8 получат сид.

tournamentDetailData["promasters-1"] = generateTournament({
    id: "promasters-1",
    name: "KSLT Pro-Masters #1",
    category: "promasters",
    categoryName: "Pro-Masters",
    date: "8 Марта 2026",
    dateRange: "8–10 Марта 2026",
    location: "Бишкек, Central Court",
    time: "09:00 – 19:00",
    bracketType: "single_elimination",
    prize: "100,000 сом",
    status: "upcoming",
    description: "Главный турнир сезона. 32 лучших игрока.",
    bgImage: "https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=1920&q=80",
    courtCount: 4,
    startTime: "09:00",
    matchDuration: 90,
    days: [
        { date: "2026-03-08", label: "День 1 — 8 Марта" },
        { date: "2026-03-09", label: "День 2 — 9 Марта" },
        { date: "2026-03-10", label: "День 3 — 10 Марта" }
    ],
    players: [
        // === СЕЯНЫЕ (1–8) по рейтингу ===
        { name: "Самат Джолдошев", country: "🇰🇬" },
        { name: "Арсен Калыков", country: "🇰🇬" },
        { name: "Бегалы Маматов", country: "🇰🇬" },
        { name: "Нуржигит Асылбеков", country: "🇰🇿" },
        { name: "Жаныш Омуралиев", country: "🇰🇬" },
        { name: "Тилек Субанов", country: "🇰🇬" },
        { name: "Мурат Байсалов", country: "🇰🇬" },
        { name: "Чынгыз Касымалиев", country: "🇰🇬" },
        // === НЕСЕЯНЫЕ (9–32) ===
        { name: "Эрмек Токтоев", country: "🇰🇬" },
        { name: "Бакыт Сатаров", country: "🇰🇬" },
        { name: "Алмаз Жумабеков", country: "🇰🇬" },
        { name: "Данияр Эсенов", country: "🇰🇬" },
        { name: "Кайрат Болотов", country: "🇰🇬" },
        { name: "Нурбек Садыков", country: "🇰🇬" },
        { name: "Тимур Орозбаев", country: "🇰🇬" },
        { name: "Руслан Бектуров", country: "🇰🇬" },
        { name: "Бекжан Турсунов", country: "🇰🇬" },
        { name: "Нурлан Кыдыров", country: "🇰🇬" },
        { name: "Марат Сулейманов", country: "🇰🇿" },
        { name: "Азат Жаныбеков", country: "🇰🇬" },
        { name: "Кенжебек Алиев", country: "🇺🇿" },
        { name: "Саламат Орозов", country: "🇰🇬" },
        { name: "Иван Шевченко", country: "🇷🇺" },
        { name: "Алмаз Токтогулов", country: "🇰🇬" },
        { name: "Жанат Касымов", country: "🇰🇬" },
        { name: "Эмиль Болотов", country: "🇰🇬" },
        { name: "Нурсултан Исмаилов", country: "🇰🇬" },
        { name: "Бакыт Эргешов", country: "🇰🇬" },
        { name: "Адилет Сыдыков", country: "🇰🇬" },
        { name: "Максат Турдалиев", country: "🇰🇬" },
        { name: "Серик Нурмухамедов", country: "🇰🇿" },
        { name: "Улан Кожоев", country: "🇰🇬" }
    ]
});
