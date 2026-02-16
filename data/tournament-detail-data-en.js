// ========================================
// TOURNAMENT DETAIL DATA (EN) - Replace with API later
// ========================================

// English UI labels
window.statusLabels = { completed: 'Finished', live: 'Live', upcoming: 'Upcoming' };
window.heroLabels = { players: 'Players', prize: 'Prize Pool', format: 'Format', elimination: 'Elimination', roundRobin: 'Round Robin' };
window.rrHeaders = { player: 'Player', wins: 'W', points: 'P', place: 'Place', playoff: 'Playoffs' };
window.scheduleLabels = { allDays: 'All Days', court: 'Court' };
window.resultsLabels = { place: 'place', prize: 'Prize', noResults: 'Results will be available after the tournament ends' };

const tournamentDetailData = {
    // === SINGLE ELIMINATION — 16 draw, completed ===
    "tour-1": {
        id: "tour-1",
        name: "KSLT Tour Open #1",
        category: "tour",
        categoryName: "Tour",
        date: "February 15, 2026",
        dateRange: "February 15–16, 2026",
        location: "Bishkek, Akhunbaeva 165",
        time: "09:00 – 18:00",
        format: "Singles",
        surface: "Hard",
        courts: "3 courts",
        bracketType: "single_elimination",
        drawSize: 16,
        participants: "16/16",
        prize: "15,000 KGS",
        status: "completed",
        description: "First tournament of the Tour season. Open to all levels.",
        bgImage: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",

        players: [
            { id: 1, name: "Samat Djoldoshev", seed: 1, country: "🇰🇬" },
            { id: 2, name: "Arsen Kalykov", seed: 2, country: "🇰🇬" },
            { id: 3, name: "Begaly Mamatov", seed: 3, country: "🇰🇬" },
            { id: 4, name: "Nurzhigit Asylbekov", seed: 4, country: "🇰🇿" },
            { id: 5, name: "Zhanysh Omuraliev", seed: 5, country: "🇰🇬" },
            { id: 6, name: "Tilek Subanov", seed: 6, country: "🇰🇬" },
            { id: 7, name: "Murat Baisalov", seed: 7, country: "🇰🇬" },
            { id: 8, name: "Chyngyz Kasymaliev", seed: 8, country: "🇰🇬" },
            { id: 9, name: "Ermek Toktoev", seed: null, country: "🇰🇬" },
            { id: 10, name: "Bakyt Satarov", seed: null, country: "🇰🇬" },
            { id: 11, name: "Almaz Zhumabekov", seed: null, country: "🇰🇬" },
            { id: 12, name: "Daniyar Esenov", seed: null, country: "🇰🇬" },
            { id: 13, name: "Kairat Bolotov", seed: null, country: "🇰🇬" },
            { id: 14, name: "Nurbek Sadykov", seed: null, country: "🇰🇬" },
            { id: 15, name: "Timur Orozbaev", seed: null, country: "🇰🇬" },
            { id: 16, name: "Ruslan Bekturov", seed: null, country: "🇰🇬" }
        ],

        bracket: {
            rounds: [
                {
                    name: "Round of 16",
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
                    name: "Quarterfinals",
                    nameShort: "QF",
                    matches: [
                        { matchId: "QF-M1", player1Id: 1, player2Id: 8, score: "6/3 6/2", winnerId: 1, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M2", player1Id: 4, player2Id: 5, score: "4/6 6/3 7/6", winnerId: 5, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M3", player1Id: 3, player2Id: 6, score: "6/4 6/3", winnerId: 3, status: "completed", court: 3, scheduledTime: "14:00", scheduledDay: "2026-02-15" },
                        { matchId: "QF-M4", player1Id: 10, player2Id: 2, score: "3/6 2/6", winnerId: 2, status: "completed", court: 1, scheduledTime: "16:00", scheduledDay: "2026-02-15" }
                    ]
                },
                {
                    name: "Semifinals",
                    nameShort: "SF",
                    matches: [
                        { matchId: "SF-M1", player1Id: 1, player2Id: 5, score: "6/4 3/6 6/2", winnerId: 1, status: "completed", court: 1, scheduledTime: "10:00", scheduledDay: "2026-02-16" },
                        { matchId: "SF-M2", player1Id: 3, player2Id: 2, score: "6/7 6/4 7/5", winnerId: 2, status: "completed", court: 2, scheduledTime: "10:00", scheduledDay: "2026-02-16" }
                    ]
                },
                {
                    name: "Final",
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
                    label: "Day 1 — February 15",
                    matches: [
                        { matchId: "R1-M1", time: "09:00", court: 1, player1Id: 1, player2Id: 16, roundName: "Round of 16", status: "completed", score: "6/2 6/1", winnerId: 1 },
                        { matchId: "R1-M2", time: "09:00", court: 2, player1Id: 8, player2Id: 9, roundName: "Round of 16", status: "completed", score: "6/4 7/5", winnerId: 8 },
                        { matchId: "R1-M3", time: "09:00", court: 3, player1Id: 4, player2Id: 13, roundName: "Round of 16", status: "completed", score: "6/3 6/4", winnerId: 4 },
                        { matchId: "R1-M4", time: "10:30", court: 1, player1Id: 5, player2Id: 12, roundName: "Round of 16", status: "completed", score: "6/1 6/3", winnerId: 5 },
                        { matchId: "R1-M5", time: "10:30", court: 2, player1Id: 3, player2Id: 14, roundName: "Round of 16", status: "completed", score: "6/0 6/2", winnerId: 3 },
                        { matchId: "R1-M6", time: "10:30", court: 3, player1Id: 6, player2Id: 11, roundName: "Round of 16", status: "completed", score: "3/6 6/4 6/3", winnerId: 6 },
                        { matchId: "R1-M7", time: "12:00", court: 1, player1Id: 7, player2Id: 10, roundName: "Round of 16", status: "completed", score: "6/4 6/7 7/5", winnerId: 10 },
                        { matchId: "R1-M8", time: "12:00", court: 2, player1Id: 2, player2Id: 15, roundName: "Round of 16", status: "completed", score: "6/1 6/0", winnerId: 2 },
                        { matchId: "QF-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 8, roundName: "Quarterfinals", status: "completed", score: "6/3 6/2", winnerId: 1 },
                        { matchId: "QF-M2", time: "14:00", court: 2, player1Id: 4, player2Id: 5, roundName: "Quarterfinals", status: "completed", score: "4/6 6/3 7/6", winnerId: 5 },
                        { matchId: "QF-M3", time: "14:00", court: 3, player1Id: 3, player2Id: 6, roundName: "Quarterfinals", status: "completed", score: "6/4 6/3", winnerId: 3 },
                        { matchId: "QF-M4", time: "16:00", court: 1, player1Id: 10, player2Id: 2, roundName: "Quarterfinals", status: "completed", score: "3/6 2/6", winnerId: 2 }
                    ]
                },
                {
                    date: "2026-02-16",
                    label: "Day 2 — February 16",
                    matches: [
                        { matchId: "SF-M1", time: "10:00", court: 1, player1Id: 1, player2Id: 5, roundName: "Semifinals", status: "completed", score: "6/4 3/6 6/2", winnerId: 1 },
                        { matchId: "SF-M2", time: "10:00", court: 2, player1Id: 3, player2Id: 2, roundName: "Semifinals", status: "completed", score: "6/7 6/4 7/5", winnerId: 2 },
                        { matchId: "F-M1", time: "15:00", court: 1, player1Id: 1, player2Id: 2, roundName: "Final", status: "completed", score: "6/3 4/6 6/4", winnerId: 1 }
                    ]
                }
            ]
        },

        results: {
            winner: { playerId: 1, prize: "8,000 KGS" },
            runnerUp: { playerId: 2, prize: "4,000 KGS" },
            semifinalists: [
                { playerId: 5, prize: "1,500 KGS" },
                { playerId: 3, prize: "1,500 KGS" }
            ]
        }
    },

    // === ROUND ROBIN — completed ===
    "friendly-1": {
        id: "friendly-1",
        name: "Weekend Friendly #5",
        category: "friendly",
        categoryName: "Friendly",
        date: "February 17, 2026",
        dateRange: "February 17, 2026",
        location: "Bishkek, Asanbay",
        time: "14:00 – 18:00",
        format: "Singles",
        surface: "Hard",
        courts: "2 courts",
        bracketType: "round_robin",
        drawSize: 8,
        participants: "8/8",
        prize: "No prize",
        status: "completed",
        description: "Friendly tournament without ranking points. Play for fun!",
        bgImage: "https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=1920&q=80",

        players: [
            { id: 1, name: "Azat Bazarkulov", seed: null, country: "🇰🇬" },
            { id: 2, name: "Eldiyar Boruev", seed: null, country: "🇰🇬" },
            { id: 3, name: "Nurbek Nurbekov", seed: null, country: "🇰🇬" },
            { id: 4, name: "Maksat Turdaliev", seed: null, country: "🇰🇬" },
            { id: 5, name: "Bakyt Ergeshov", seed: null, country: "🇰🇬" },
            { id: 6, name: "Adilet Sydykov", seed: null, country: "🇰🇬" },
            { id: 7, name: "Talant Omorov", seed: null, country: "🇰🇬" },
            { id: 8, name: "Ulan Kozhoev", seed: null, country: "🇰🇬" }
        ],

        roundRobin: {
            groups: [
                {
                    name: "Group A",
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
                    name: "Group B",
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
                        name: "Final (1st place)",
                        matches: [
                            { matchId: "KO-F", player1Id: 2, player2Id: 8, score: "6/3 7/5", winnerId: 2, status: "completed", court: 1, scheduledTime: "16:30", scheduledDay: "2026-02-17" }
                        ]
                    },
                    {
                        name: "3rd place match",
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
                    label: "February 17",
                    matches: [
                        { matchId: "GA-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 2, roundName: "Group A", status: "completed", score: "0/6 3/6", winnerId: 2 },
                        { matchId: "GA-M2", time: "14:00", court: 2, player1Id: 1, player2Id: 3, roundName: "Group A", status: "completed", score: "1/6 1/6", winnerId: 3 },
                        { matchId: "GB-M1", time: "14:00", court: 1, player1Id: 5, player2Id: 6, roundName: "Group B", status: "completed", score: "6/4 6/3", winnerId: 5 },
                        { matchId: "GA-M3", time: "14:45", court: 1, player1Id: 1, player2Id: 4, roundName: "Group A", status: "completed", score: "6/3 6/4", winnerId: 1 },
                        { matchId: "GA-M4", time: "14:45", court: 2, player1Id: 2, player2Id: 3, roundName: "Group A", status: "completed", score: "6/1 6/0", winnerId: 2 },
                        { matchId: "GB-M2", time: "14:45", court: 2, player1Id: 5, player2Id: 7, roundName: "Group B", status: "completed", score: "3/6 6/4 6/2", winnerId: 5 },
                        { matchId: "GA-M5", time: "15:30", court: 1, player1Id: 2, player2Id: 4, roundName: "Group A", status: "completed", score: "6/2 6/1", winnerId: 2 },
                        { matchId: "GA-M6", time: "15:30", court: 2, player1Id: 3, player2Id: 4, roundName: "Group A", status: "completed", score: "6/3 6/2", winnerId: 3 },
                        { matchId: "GB-M3", time: "15:30", court: 1, player1Id: 5, player2Id: 8, roundName: "Group B", status: "completed", score: "6/7 4/6", winnerId: 8 },
                        { matchId: "GB-M4", time: "14:00", court: 2, player1Id: 6, player2Id: 7, roundName: "Group B", status: "completed", score: "6/3 6/4", winnerId: 6 },
                        { matchId: "GB-M5", time: "14:45", court: 1, player1Id: 6, player2Id: 8, roundName: "Group B", status: "completed", score: "4/6 3/6", winnerId: 8 },
                        { matchId: "GB-M6", time: "15:30", court: 2, player1Id: 7, player2Id: 8, roundName: "Group B", status: "completed", score: "6/4 3/6 6/7", winnerId: 8 },
                        { matchId: "KO-F", time: "16:30", court: 1, player1Id: 2, player2Id: 8, roundName: "Final (1st place)", status: "completed", score: "6/3 7/5", winnerId: 2 },
                        { matchId: "KO-3", time: "16:30", court: 2, player1Id: 3, player2Id: 5, roundName: "3rd place match", status: "completed", score: "6/4 6/4", winnerId: 3 }
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
        date: "February 14, 2026",
        dateRange: "February 14–15, 2026",
        location: "Bishkek, Central Court",
        time: "09:00 – 18:00",
        format: "Singles",
        surface: "Hard",
        courts: "4 courts",
        bracketType: "single_elimination",
        drawSize: 16,
        participants: "16/16",
        prize: "40,000 KGS",
        status: "live",
        description: "First Masters Series tournament of 2026.",
        bgImage: "https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=1920&q=80",

        players: [
            { id: 1, name: "Bekzhan Tursunov", seed: 1, country: "🇰🇬" },
            { id: 2, name: "Nurlan Kydyrov", seed: 2, country: "🇰🇬" },
            { id: 3, name: "Marat Suleymanov", seed: 3, country: "🇰🇿" },
            { id: 4, name: "Azat Zhanybekov", seed: 4, country: "🇰🇬" },
            { id: 5, name: "Kenzhebek Aliev", seed: 5, country: "🇺🇿" },
            { id: 6, name: "Salamat Orozov", seed: 6, country: "🇰🇬" },
            { id: 7, name: "Ivan Shevchenko", seed: 7, country: "🇷🇺" },
            { id: 8, name: "Almaz Toktogulov", seed: 8, country: "🇰🇬" },
            { id: 9, name: "Zhanat Kasymov", seed: null, country: "🇰🇬" },
            { id: 10, name: "Emil Bolotov", seed: null, country: "🇰🇬" },
            { id: 11, name: "Nursultan Kasymov", seed: null, country: "🇰🇬" },
            { id: 12, name: "Bakyt Ergeshov", seed: null, country: "🇰🇬" },
            { id: 13, name: "Adilet Sydykov", seed: null, country: "🇰🇬" },
            { id: 14, name: "Maksat Turdaliev", seed: null, country: "🇰🇬" },
            { id: 15, name: "Serik Nurmukhamedov", seed: null, country: "🇰🇿" },
            { id: 16, name: "Ulan Kozhoev", seed: null, country: "🇰🇬" }
        ],

        bracket: {
            rounds: [
                {
                    name: "Round of 16",
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
                    name: "Quarterfinals",
                    nameShort: "QF",
                    matches: [
                        { matchId: "QF-M1", player1Id: 1, player2Id: 8, score: "6/4 6/3", winnerId: 1, status: "completed", court: 1, scheduledTime: "14:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M2", player1Id: 4, player2Id: 5, score: "3/6 6/2 6/4", winnerId: 4, status: "completed", court: 2, scheduledTime: "14:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M3", player1Id: 3, player2Id: 6, score: "5/4", winnerId: null, status: "live", court: 1, scheduledTime: "16:00", scheduledDay: "2026-02-14" },
                        { matchId: "QF-M4", player1Id: 7, player2Id: 2, score: "", winnerId: null, status: "upcoming", court: 2, scheduledTime: "16:00", scheduledDay: "2026-02-14" }
                    ]
                },
                {
                    name: "Semifinals",
                    nameShort: "SF",
                    matches: [
                        { matchId: "SF-M1", player1Id: 1, player2Id: 4, score: "", winnerId: null, status: "upcoming", court: 1, scheduledTime: "10:00", scheduledDay: "2026-02-15" },
                        { matchId: "SF-M2", player1Id: null, player2Id: null, score: "", winnerId: null, status: "upcoming", court: 2, scheduledTime: "10:00", scheduledDay: "2026-02-15" }
                    ]
                },
                {
                    name: "Final",
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
                    label: "Day 1 — February 14",
                    matches: [
                        { matchId: "R1-M1", time: "09:00", court: 1, player1Id: 1, player2Id: 16, roundName: "Round of 16", status: "completed", score: "6/1 6/2", winnerId: 1 },
                        { matchId: "R1-M2", time: "09:00", court: 2, player1Id: 8, player2Id: 9, roundName: "Round of 16", status: "completed", score: "6/3 6/4", winnerId: 8 },
                        { matchId: "R1-M3", time: "09:00", court: 3, player1Id: 4, player2Id: 13, roundName: "Round of 16", status: "completed", score: "6/2 6/3", winnerId: 4 },
                        { matchId: "R1-M4", time: "09:00", court: 4, player1Id: 5, player2Id: 12, roundName: "Round of 16", status: "completed", score: "7/5 6/4", winnerId: 5 },
                        { matchId: "R1-M5", time: "11:00", court: 1, player1Id: 3, player2Id: 14, roundName: "Round of 16", status: "completed", score: "6/1 6/3", winnerId: 3 },
                        { matchId: "R1-M6", time: "11:00", court: 2, player1Id: 6, player2Id: 11, roundName: "Round of 16", status: "completed", score: "6/4 6/2", winnerId: 6 },
                        { matchId: "R1-M7", time: "11:00", court: 3, player1Id: 7, player2Id: 10, roundName: "Round of 16", status: "completed", score: "6/3 3/6 7/5", winnerId: 7 },
                        { matchId: "R1-M8", time: "11:00", court: 4, player1Id: 2, player2Id: 15, roundName: "Round of 16", status: "completed", score: "6/0 6/2", winnerId: 2 },
                        { matchId: "QF-M1", time: "14:00", court: 1, player1Id: 1, player2Id: 8, roundName: "Quarterfinals", status: "completed", score: "6/4 6/3", winnerId: 1 },
                        { matchId: "QF-M2", time: "14:00", court: 2, player1Id: 4, player2Id: 5, roundName: "Quarterfinals", status: "completed", score: "3/6 6/2 6/4", winnerId: 4 },
                        { matchId: "QF-M3", time: "16:00", court: 1, player1Id: 3, player2Id: 6, roundName: "Quarterfinals", status: "live", score: "5/4", winnerId: null },
                        { matchId: "QF-M4", time: "16:00", court: 2, player1Id: 7, player2Id: 2, roundName: "Quarterfinals", status: "upcoming", score: "", winnerId: null }
                    ]
                },
                {
                    date: "2026-02-15",
                    label: "Day 2 — February 15",
                    matches: [
                        { matchId: "SF-M1", time: "10:00", court: 1, player1Id: 1, player2Id: 4, roundName: "Semifinals", status: "upcoming", score: "", winnerId: null },
                        { matchId: "SF-M2", time: "10:00", court: 2, player1Id: null, player2Id: null, roundName: "Semifinals", status: "upcoming", score: "", winnerId: null },
                        { matchId: "F-M1", time: "15:00", court: 1, player1Id: null, player2Id: null, roundName: "Final", status: "upcoming", score: "", winnerId: null }
                    ]
                }
            ]
        },

        results: null
    }
};

// ========================================
// SE-32 — Auto-generated
// ========================================

tournamentDetailData["promasters-1"] = generateTournament({
    id: "promasters-1",
    name: "KSLT Pro-Masters #1",
    category: "promasters",
    categoryName: "Pro-Masters",
    date: "March 8, 2026",
    dateRange: "March 8–10, 2026",
    location: "Bishkek, Central Court",
    time: "09:00 – 19:00",
    lang: "en",
    bracketType: "single_elimination",
    prize: "100,000 KGS",
    status: "upcoming",
    description: "Main tournament of the season. Top 32 players.",
    bgImage: "https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=1920&q=80",
    courtCount: 4,
    startTime: "09:00",
    matchDuration: 90,
    days: [
        { date: "2026-03-08", label: "Day 1 — March 8" },
        { date: "2026-03-09", label: "Day 2 — March 9" },
        { date: "2026-03-10", label: "Day 3 — March 10" }
    ],
    players: [
        { name: "Samat Djoldoshev", country: "🇰🇬" },
        { name: "Arsen Kalykov", country: "🇰🇬" },
        { name: "Begaly Mamatov", country: "🇰🇬" },
        { name: "Nurzhigit Asylbekov", country: "🇰🇿" },
        { name: "Zhanysh Omuraliev", country: "🇰🇬" },
        { name: "Tilek Subanov", country: "🇰🇬" },
        { name: "Murat Baisalov", country: "🇰🇬" },
        { name: "Chyngyz Kasymaliev", country: "🇰🇬" },
        { name: "Ermek Toktoev", country: "🇰🇬" },
        { name: "Bakyt Satarov", country: "🇰🇬" },
        { name: "Almaz Zhumabekov", country: "🇰🇬" },
        { name: "Daniyar Esenov", country: "🇰🇬" },
        { name: "Kairat Bolotov", country: "🇰🇬" },
        { name: "Nurbek Sadykov", country: "🇰🇬" },
        { name: "Timur Orozbaev", country: "🇰🇬" },
        { name: "Ruslan Bekturov", country: "🇰🇬" },
        { name: "Bekzhan Tursunov", country: "🇰🇬" },
        { name: "Nurlan Kydyrov", country: "🇰🇬" },
        { name: "Marat Suleymanov", country: "🇰🇿" },
        { name: "Azat Zhanybekov", country: "🇰🇬" },
        { name: "Kenzhebek Aliev", country: "🇺🇿" },
        { name: "Salamat Orozov", country: "🇰🇬" },
        { name: "Ivan Shevchenko", country: "🇷🇺" },
        { name: "Almaz Toktogulov", country: "🇰🇬" },
        { name: "Zhanat Kasymov", country: "🇰🇬" },
        { name: "Emil Bolotov", country: "🇰🇬" },
        { name: "Nursultan Ismailov", country: "🇰🇬" },
        { name: "Bakyt Ergeshov", country: "🇰🇬" },
        { name: "Adilet Sydykov", country: "🇰🇬" },
        { name: "Maksat Turdaliev", country: "🇰🇬" },
        { name: "Serik Nurmukhamedov", country: "🇰🇿" },
        { name: "Ulan Kozhoev", country: "🇰🇬" }
    ]
});
