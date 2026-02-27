// ========================================
// TOURNAMENTS DATA (EN) - Replace with API later
// ========================================

const tournamentsData = {
    categories: {
        promasters: {
            name: 'Pro-Masters',
            title: 'Pro-Masters Tournaments',
            description: 'Highest level tournaments for professionals and top amateurs.',
            stats: { tournaments: 6, participants: '120+', prize: '200K' },
            bgImage: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80'
        },
        masters: {
            name: 'Masters',
            title: 'Masters Tournaments',
            description: 'Tournaments for advanced players with high skill levels.',
            stats: { tournaments: 8, participants: '180+', prize: '100K' },
            bgImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80'
        },
        challenger: {
            name: 'Challenger',
            title: 'Challenger Tournaments',
            description: 'Mid-level tournaments for players aiming to grow.',
            stats: { tournaments: 10, participants: '200+', prize: '75K' },
            bgImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80'
        },
        futures: {
            name: 'Futures',
            title: 'Futures Tournaments',
            description: 'Tournaments for beginners and developing players.',
            stats: { tournaments: 15, participants: '300+', prize: '40K' },
            bgImage: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=1920&q=80'
        },
        tour: {
            name: 'Tour',
            title: 'Tour Tournaments',
            description: 'Open tournaments for all skill levels. Gain competition experience and climb the KSLT rankings.',
            stats: { tournaments: 12, participants: '240+', prize: '50K' },
            bgImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80'
        },
        friendly: {
            name: 'Friendly',
            title: 'Friendly Tournaments',
            description: 'Friendly tournaments without ranking points. Play for fun!',
            stats: { tournaments: 20, participants: '400+', prize: '—' },
            bgImage: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=1920&q=80'
        }
    },

    upcoming: {
        promasters: [
            { id: 1, name: 'KSLT Pro-Masters Championship', date: { day: '10', month: 'Mar' }, location: 'Bishkek, Tennis Palace', time: '09:00 - 20:00', format: 'Singles', participants: '16/32', prize: '100,000 som', status: 'open' },
            { id: 2, name: 'Spring Pro-Masters Open', date: { day: '24', month: 'Mar' }, location: 'Bishkek, Elite Courts', time: '10:00 - 19:00', format: 'Singles', participants: '8/16', prize: '50,000 som', status: 'open' }
        ],
        masters: [
            { id: 1, name: 'KSLT Masters Series #1', date: { day: '08', month: 'Mar' }, location: 'Bishkek, Central Court', time: '09:00 - 18:00', format: 'Singles', participants: '28/32', prize: '40,000 som', status: 'open' },
            { id: 2, name: 'Masters Doubles Cup', date: { day: '22', month: 'Mar' }, location: 'Bishkek, Asanbay', time: '10:00 - 17:00', format: 'Doubles', participants: '10/16 pairs', prize: '30,000 som', status: 'open' },
            { id: 3, name: 'April Masters Championship', date: { day: '05', month: 'Apr' }, location: 'Bishkek, Tennis Park', time: '08:00 - 20:00', format: 'Singles', participants: '0/64', prize: '60,000 som', status: 'soon' }
        ],
        challenger: [
            { id: 1, name: 'Challenger Cup Spring', date: { day: '01', month: 'Mar' }, location: 'Bishkek, Central Court', time: '09:00 - 18:00', format: 'Singles', participants: '30/32', prize: '25,000 som', status: 'open' },
            { id: 2, name: 'Challenger Doubles', date: { day: '15', month: 'Mar' }, location: 'Bishkek, Jal', time: '10:00 - 17:00', format: 'Doubles', participants: '12/16 pairs', prize: '20,000 som', status: 'open' },
            { id: 3, name: 'March Challenger Open', date: { day: '29', month: 'Mar' }, location: 'Bishkek, Akhunbaeva', time: '09:00 - 18:00', format: 'Singles', participants: '0/32', prize: '30,000 som', status: 'soon' }
        ],
        futures: [
            { id: 1, name: 'Futures Start Cup', date: { day: '20', month: 'Feb' }, location: 'Bishkek, Akhunbaeva 165', time: '10:00 - 17:00', format: 'Singles', participants: '20/24', prize: '10,000 som', status: 'open' },
            { id: 2, name: 'Futures Junior Open', date: { day: '06', month: 'Mar' }, location: 'Bishkek, Asanbay', time: '09:00 - 16:00', format: 'Singles', participants: '15/24', prize: '8,000 som', status: 'open' },
            { id: 3, name: 'Spring Futures Championship', date: { day: '20', month: 'Mar' }, location: 'Bishkek, Tennis Park', time: '09:00 - 18:00', format: 'Singles', participants: '0/32', prize: '15,000 som', status: 'soon' }
        ],
        tour: [
            { id: 1, name: 'KSLT Tour Open #1', date: { day: '15', month: 'Feb' }, location: 'Bishkek, Akhunbaeva 165', time: '09:00 - 18:00', format: 'Singles', participants: '24/32', prize: '15,000 som', status: 'open' },
            { id: 2, name: 'KSLT Tour Doubles', date: { day: '22', month: 'Feb' }, location: 'Bishkek, Asanbay 21', time: '10:00 - 17:00', format: 'Doubles', participants: '12/16 pairs', prize: '20,000 som', status: 'open' },
            { id: 3, name: 'Spring Tour Championship', date: { day: '01', month: 'Mar' }, location: 'Bishkek, Central Court', time: '08:00 - 20:00', format: 'Singles', participants: '0/64', prize: '50,000 som', status: 'soon' }
        ],
        friendly: [
            { id: 1, name: 'Weekend Friendly #5', date: { day: '17', month: 'Feb' }, location: 'Bishkek, Asanbay', time: '14:00 - 18:00', format: 'Singles', participants: '12/16', prize: 'No prize', status: 'open' },
            { id: 2, name: 'Mixed Doubles Fun', date: { day: '24', month: 'Feb' }, location: 'Bishkek, Jal', time: '15:00 - 19:00', format: 'Mixed', participants: '6/8 pairs', prize: 'No prize', status: 'open' },
            { id: 3, name: 'Family Tennis Day', date: { day: '02', month: 'Mar' }, location: 'Bishkek, Tennis Park', time: '10:00 - 16:00', format: 'Family', participants: '0/20', prize: 'No prize', status: 'soon' }
        ]
    },

    rankings: {
        men: {
            promasters: [
                { rank: 1, name: 'Alexey Ivanov', country: '🇰🇬', tournaments: 5, points: 2450, change: '+2' },
                { rank: 2, name: 'Maxim Petrov', country: '🇰🇬', tournaments: 6, points: 2380, change: '-1' },
                { rank: 3, name: 'Dmitry Kozlov', country: '🇰🇿', tournaments: 5, points: 2310, change: '+1' },
                { rank: 4, name: 'Timur Asanov', country: '🇰🇬', tournaments: 4, points: 2180, change: '—' },
                { rank: 5, name: 'Ruslan Bakirov', country: '🇺🇿', tournaments: 5, points: 2050, change: '+3' },
                { rank: 6, name: 'Erlan Zhumaev', country: '🇰🇬', tournaments: 6, points: 1980, change: '-2' },
                { rank: 7, name: 'Daniyar Mambetov', country: '🇰🇿', tournaments: 4, points: 1920, change: '+1' },
                { rank: 8, name: 'Artem Kravtsov', country: '🇷🇺', tournaments: 3, points: 1870, change: '—' },
                { rank: 9, name: 'Kanat Omurov', country: '🇰🇬', tournaments: 5, points: 1820, change: '+2' },
                { rank: 10, name: 'Serik Aliev', country: '🇰🇿', tournaments: 4, points: 1760, change: '-1' }
            ],
            masters: [
                { rank: 1, name: 'Bekzhan Tursunov', country: '🇰🇬', tournaments: 7, points: 1850, change: '+1' },
                { rank: 2, name: 'Nurlan Kydyrov', country: '🇰🇬', tournaments: 8, points: 1780, change: '—' },
                { rank: 3, name: 'Marat Suleymanov', country: '🇰🇿', tournaments: 6, points: 1720, change: '-1' },
                { rank: 4, name: 'Azat Zhanybekov', country: '🇰🇬', tournaments: 7, points: 1690, change: '+2' },
                { rank: 5, name: 'Kenzhebek Aliev', country: '🇺🇿', tournaments: 5, points: 1650, change: '—' },
                { rank: 6, name: 'Salamat Orozov', country: '🇰🇬', tournaments: 8, points: 1600, change: '+3' },
                { rank: 7, name: 'Ivan Shevchenko', country: '🇷🇺', tournaments: 6, points: 1560, change: '-2' },
                { rank: 8, name: 'Almaz Toktogulov', country: '🇰🇬', tournaments: 7, points: 1520, change: '—' },
                { rank: 9, name: 'Zhanat Kasymov', country: '🇰🇬', tournaments: 5, points: 1480, change: '+1' },
                { rank: 10, name: 'Emil Bolotov', country: '🇰🇬', tournaments: 6, points: 1440, change: '-1' }
            ],
            challenger: [
                { rank: 1, name: 'Eldiyar Satybaldiev', country: '🇰🇬', tournaments: 9, points: 1420, change: '+1' },
                { rank: 2, name: 'Kanat Dzhumagulov', country: '🇰🇬', tournaments: 10, points: 1380, change: '—' },
                { rank: 3, name: 'Alisher Rakhimov', country: '🇺🇿', tournaments: 8, points: 1340, change: '-1' },
                { rank: 4, name: 'Ulan Kozhoev', country: '🇰🇬', tournaments: 9, points: 1290, change: '+3' },
                { rank: 5, name: 'Talant Omorov', country: '🇰🇬', tournaments: 7, points: 1250, change: '—' },
                { rank: 6, name: 'Serik Nurmukhamedov', country: '🇰🇿', tournaments: 8, points: 1210, change: '+2' },
                { rank: 7, name: 'Adilet Sydykov', country: '🇰🇬', tournaments: 10, points: 1180, change: '-1' },
                { rank: 8, name: 'Maksat Turdaliev', country: '🇰🇬', tournaments: 7, points: 1150, change: '—' },
                { rank: 9, name: 'Bakyt Ergeshov', country: '🇰🇬', tournaments: 9, points: 1110, change: '+2' },
                { rank: 10, name: 'Nursultan Kasymov', country: '🇰🇬', tournaments: 8, points: 1070, change: '-2' }
            ],
            futures: [
                { rank: 1, name: 'Askar Bolotov', country: '🇰🇬', tournaments: 12, points: 980, change: '+4' },
                { rank: 2, name: 'Temirlan Usenov', country: '🇰🇬', tournaments: 14, points: 920, change: '+1' },
                { rank: 3, name: 'Zhandos Kasymov', country: '🇰🇿', tournaments: 11, points: 870, change: '—' },
                { rank: 4, name: 'Sanzhar Abdiev', country: '🇰🇬', tournaments: 13, points: 840, change: '-2' },
                { rank: 5, name: 'Bakyt Nazarov', country: '🇰🇬', tournaments: 10, points: 810, change: '+2' },
                { rank: 6, name: 'Kairat Esenov', country: '🇺🇿', tournaments: 12, points: 780, change: '—' },
                { rank: 7, name: 'Mirlan Sheraliev', country: '🇰🇬', tournaments: 11, points: 750, change: '-1' },
                { rank: 8, name: 'Nurbek Toktoev', country: '🇰🇬', tournaments: 14, points: 720, change: '+1' },
                { rank: 9, name: 'Tilek Baibolotov', country: '🇰🇬', tournaments: 9, points: 690, change: '+3' },
                { rank: 10, name: 'Ermek Sultanov', country: '🇰🇬', tournaments: 13, points: 660, change: '-2' }
            ],
            tour: [
                { rank: 1, name: 'Samat Dzholdoshev', country: '🇰🇬', tournaments: 8, points: 520, change: '+5' },
                { rank: 2, name: 'Arsen Kalykov', country: '🇰🇬', tournaments: 7, points: 490, change: '+2' },
                { rank: 3, name: 'Begaly Mamatov', country: '🇰🇬', tournaments: 9, points: 460, change: '—' },
                { rank: 4, name: 'Nurzhigit Asylbekov', country: '🇰🇿', tournaments: 6, points: 430, change: '-1' },
                { rank: 5, name: 'Zhanysh Omuraliev', country: '🇰🇬', tournaments: 7, points: 400, change: '+1' },
                { rank: 6, name: 'Tilek Subanov', country: '🇰🇬', tournaments: 5, points: 380, change: '—' },
                { rank: 7, name: 'Murat Baisalov', country: '🇰🇬', tournaments: 6, points: 350, change: '-3' },
                { rank: 8, name: 'Chyngyz Kasymaliev', country: '🇰🇬', tournaments: 8, points: 320, change: '+2' },
                { rank: 9, name: 'Ermek Toktoev', country: '🇰🇬', tournaments: 4, points: 290, change: '—' },
                { rank: 10, name: 'Bakyt Satarov', country: '🇰🇬', tournaments: 5, points: 260, change: '+4' }
            ]
        },
        women: {
            promasters: [
                { rank: 1, name: 'Aigerim Tashieva', country: '🇰🇬', tournaments: 5, points: 2280, change: '+1' },
                { rank: 2, name: 'Dinara Safina', country: '🇰🇬', tournaments: 6, points: 2150, change: '+2' },
                { rank: 3, name: 'Aliya Kasymova', country: '🇰🇿', tournaments: 5, points: 2080, change: '-1' },
                { rank: 4, name: 'Madina Rakhimova', country: '🇺🇿', tournaments: 4, points: 1950, change: '—' },
                { rank: 5, name: 'Zhazgul Omurzakova', country: '🇰🇬', tournaments: 5, points: 1870, change: '+3' },
                { rank: 6, name: 'Nurgul Esenova', country: '🇰🇬', tournaments: 6, points: 1780, change: '-2' },
                { rank: 7, name: 'Saltanat Zhumabaeva', country: '🇰🇬', tournaments: 4, points: 1720, change: '+1' },
                { rank: 8, name: 'Kamila Ibragimova', country: '🇷🇺', tournaments: 3, points: 1650, change: '—' },
                { rank: 9, name: 'Begimai Toktosunova', country: '🇰🇬', tournaments: 5, points: 1580, change: '+2' },
                { rank: 10, name: 'Aiperi Kadyrova', country: '🇰🇬', tournaments: 4, points: 1510, change: '-1' }
            ],
            masters: [
                { rank: 1, name: 'Gulzat Usenova', country: '🇰🇬', tournaments: 7, points: 1650, change: '+2' },
                { rank: 2, name: 'Nazgul Alieva', country: '🇰🇬', tournaments: 8, points: 1580, change: '—' },
                { rank: 3, name: 'Ainura Bekturova', country: '🇰🇿', tournaments: 6, points: 1520, change: '-1' },
                { rank: 4, name: 'Cholpon Satybaldiyeva', country: '🇰🇬', tournaments: 7, points: 1480, change: '+1' },
                { rank: 5, name: 'Zhypara Omurbekova', country: '🇰🇬', tournaments: 5, points: 1420, change: '—' },
                { rank: 6, name: 'Nurzhan Toktogulova', country: '🇰🇬', tournaments: 8, points: 1380, change: '+2' },
                { rank: 7, name: 'Eliza Zheenbekova', country: '🇰🇬', tournaments: 6, points: 1340, change: '-2' },
                { rank: 8, name: 'Asel Mambetova', country: '🇰🇬', tournaments: 7, points: 1290, change: '—' },
                { rank: 9, name: 'Bermet Kasymaliyeva', country: '🇰🇬', tournaments: 5, points: 1250, change: '+1' },
                { rank: 10, name: 'Aigul Turdubaeva', country: '🇰🇬', tournaments: 6, points: 1200, change: '-1' }
            ],
            challenger: [
                { rank: 1, name: 'Kanyshai Sydykova', country: '🇰🇬', tournaments: 9, points: 1220, change: '+1' },
                { rank: 2, name: 'Nuriya Ergeshova', country: '🇰🇬', tournaments: 10, points: 1180, change: '—' },
                { rank: 3, name: 'Zhibek Asanova', country: '🇰🇬', tournaments: 8, points: 1140, change: '-1' },
                { rank: 4, name: 'Aizhamal Kozhobekova', country: '🇰🇬', tournaments: 9, points: 1090, change: '+2' },
                { rank: 5, name: 'Sezim Orozbaeva', country: '🇰🇬', tournaments: 7, points: 1050, change: '—' },
                { rank: 6, name: 'Elmira Toktosunova', country: '🇰🇬', tournaments: 8, points: 1010, change: '+1' },
                { rank: 7, name: 'Nurgul Dzholdosheva', country: '🇰🇬', tournaments: 10, points: 980, change: '-1' },
                { rank: 8, name: 'Aidai Bakytova', country: '🇰🇬', tournaments: 7, points: 950, change: '—' },
                { rank: 9, name: 'Meerim Sheraliyeva', country: '🇰🇬', tournaments: 9, points: 910, change: '+2' },
                { rank: 10, name: 'Gulaiym Kasymova', country: '🇰🇬', tournaments: 8, points: 870, change: '-2' }
            ],
            futures: [
                { rank: 1, name: 'Aisuluu Bolotova', country: '🇰🇬', tournaments: 12, points: 780, change: '+3' },
                { rank: 2, name: 'Zharkynai Usenova', country: '🇰🇬', tournaments: 14, points: 720, change: '+1' },
                { rank: 3, name: 'Nazira Kasymova', country: '🇰🇿', tournaments: 11, points: 670, change: '—' },
                { rank: 4, name: 'Adinai Abdiyeva', country: '🇰🇬', tournaments: 13, points: 640, change: '-2' },
                { rank: 5, name: 'Begaiym Nazarova', country: '🇰🇬', tournaments: 10, points: 610, change: '+2' },
                { rank: 6, name: 'Aichurok Esenova', country: '🇰🇬', tournaments: 12, points: 580, change: '—' },
                { rank: 7, name: 'Nurzat Sheraliyeva', country: '🇰🇬', tournaments: 11, points: 550, change: '-1' },
                { rank: 8, name: 'Aizada Toktoyeva', country: '🇰🇬', tournaments: 14, points: 520, change: '+1' },
                { rank: 9, name: 'Zarina Baibolotova', country: '🇰🇬', tournaments: 9, points: 490, change: '+3' },
                { rank: 10, name: 'Zhyldyz Sultanova', country: '🇰🇬', tournaments: 13, points: 460, change: '-2' }
            ],
            tour: [
                { rank: 1, name: 'Ainura Dzholdosheva', country: '🇰🇬', tournaments: 8, points: 420, change: '+4' },
                { rank: 2, name: 'Gulmira Kalykova', country: '🇰🇬', tournaments: 7, points: 390, change: '+1' },
                { rank: 3, name: 'Nurgul Mamatova', country: '🇰🇬', tournaments: 9, points: 360, change: '—' },
                { rank: 4, name: 'Zhazgul Asylbekova', country: '🇰🇬', tournaments: 6, points: 330, change: '-1' },
                { rank: 5, name: 'Chinara Omuraliyeva', country: '🇰🇬', tournaments: 7, points: 300, change: '+2' },
                { rank: 6, name: 'Aiperi Subanova', country: '🇰🇬', tournaments: 5, points: 280, change: '—' },
                { rank: 7, name: 'Bermet Baisalova', country: '🇰🇬', tournaments: 6, points: 250, change: '-2' },
                { rank: 8, name: 'Aigerim Kasymaliyeva', country: '🇰🇬', tournaments: 8, points: 220, change: '+1' },
                { rank: 9, name: 'Nuraiym Toktoyeva', country: '🇰🇬', tournaments: 4, points: 190, change: '—' },
                { rank: 10, name: 'Saltanat Satarova', country: '🇰🇬', tournaments: 5, points: 160, change: '+3' }
            ]
        }
    },

    past: {
        promasters: [
            { name: 'Winter Pro-Masters Finals', date: '20 Jan 2026', winner: 'Alexey Ivanov', participants: 32, prize: '100,000 som' },
            { name: 'New Year Pro-Masters', date: '05 Jan 2026', winner: 'Maxim Petrov', participants: 16, prize: '50,000 som' }
        ],
        masters: [
            { name: 'January Masters Cup', date: '25 Jan 2026', winner: 'Bekzhan Tursunov', participants: 32, prize: '40,000 som' },
            { name: 'Winter Masters Open', date: '11 Jan 2026', winner: 'Nurlan Kydyrov', participants: 24, prize: '30,000 som' }
        ],
        challenger: [
            { name: 'January Challenger Cup', date: '28 Jan 2026', winner: 'Eldiyar Satybaldiev', participants: 32, prize: '25,000 som' },
            { name: 'New Year Challenger', date: '10 Jan 2026', winner: 'Kanat Dzhumagulov', participants: 24, prize: '20,000 som' }
        ],
        futures: [
            { name: 'Winter Futures Cup', date: '30 Jan 2026', winner: 'Askar Bolotov', participants: 24, prize: '10,000 som' },
            { name: 'January Futures Open', date: '15 Jan 2026', winner: 'Temirlan Usenov', participants: 16, prize: '8,000 som' }
        ],
        tour: [
            { name: 'KSLT Winter Tour', date: '28 Jan 2026', winner: 'Samat Dzholdoshev', participants: 32, prize: '15,000 som' },
            { name: 'New Year Tour Open', date: '14 Jan 2026', winner: 'Arsen Kalykov', participants: 24, prize: '10,000 som' },
            { name: 'December Tour Finals', date: '21 Dec 2025', winner: 'Begaly Mamatov', participants: 16, prize: '8,000 som' }
        ],
        friendly: [
            { name: 'Weekend Friendly #4', date: '02 Feb 2026', winner: 'Everyone wins!', participants: 16, prize: 'No prize' },
            { name: 'January Fun Tournament', date: '19 Jan 2026', winner: 'Everyone wins!', participants: 12, prize: 'No prize' }
        ]
    }
};

// Photos for men rankings
const playerPhotos = [
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=80&h=80&fit=crop&q=80'
];

// Photos for women rankings
const playerPhotosWomen = [
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80&h=80&fit=crop&q=80',
    'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=80&h=80&fit=crop&q=80'
];

// ========================================
// INITIALIZATION (EN)
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'tour';

    loadCategoryData(category);
    highlightActiveCategory(category);
    initFilters();
    initCalendarButtons();
});

function loadCategoryData(category) {
    const cat = tournamentsData.categories[category];
    if (!cat) return;

    document.getElementById('categoryBadge').textContent = cat.name;
    document.getElementById('categoryTitle').textContent = cat.title;
    document.getElementById('categoryDescription').textContent = cat.description;
    document.getElementById('statTournaments').textContent = cat.stats.tournaments;
    document.getElementById('statParticipants').textContent = cat.stats.participants;
    document.getElementById('statPrize').textContent = cat.stats.prize;
    document.getElementById('heroBg').src = cat.bgImage;
    document.title = `KSLT — ${cat.name} Tournaments`;
    document.getElementById('rankingCategoryName').textContent = cat.name;

    loadUpcomingTournaments(category);
    loadRankings(category);
    loadPastTournaments(category);
}

function loadUpcomingTournaments(category) {
    const tournaments = tournamentsData.upcoming[category] || [];
    const grid = document.getElementById('tournamentsGrid');

    grid.innerHTML = tournaments.map(t => `
        <div class="tournament-card" data-status="${t.status}">
            <div class="tournament-card-header">
                <span class="tournament-date">
                    <span class="date-day">${t.date.day}</span>
                    <span class="date-month">${t.date.month}</span>
                </span>
                <span class="tournament-status ${t.status}">${t.status === 'open' ? 'Registration Open' : 'Coming Soon'}</span>
            </div>
            <div class="tournament-card-body">
                <h3>${t.name}</h3>
                <div class="tournament-meta">
                    <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${t.location}</span>
                    <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${t.time}</span>
                </div>
                <div class="tournament-details">
                    <div class="detail-item">
                        <span class="detail-label">Format</span>
                        <span class="detail-value">${t.format}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Participants</span>
                        <span class="detail-value">${t.participants}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Prize Pool</span>
                        <span class="detail-value prize">${t.prize}</span>
                    </div>
                </div>
            </div>
            <div class="tournament-card-footer">
                <button class="btn-calendar" title="Add to Calendar">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
                <a href="tournament-en.html?id=${category}-${t.id}" class="btn-view-bracket" style="margin-right:auto">Details</a>
                ${t.status === 'open'
                    ? '<button class="btn-register">Register</button>'
                    : '<button class="btn-notify">Notify Me</button>'}
            </div>
        </div>
    `).join('');
}

function loadRankings(category) {
    const rankingSection = document.getElementById('ranking');

    // Hide ranking section for friendly tournaments
    if (category === 'friendly') {
        if (rankingSection) {
            rankingSection.style.display = 'none';
        }
        return;
    }

    // Show ranking section for other categories
    if (rankingSection) {
        rankingSection.style.display = 'block';
    }

    // Load both men and women rankings side by side
    loadRankingTable('men', category);
    loadRankingTable('women', category);
}

function loadRankingTable(gender, category) {
    const tableId = gender === 'men' ? 'rankingTableMen' : 'rankingTableWomen';
    const table = document.getElementById(tableId);
    if (!table) return;

    const rankings = tournamentsData.rankings[gender]?.[category] || [];
    const header = table.querySelector('.ranking-header');

    table.innerHTML = '';
    if (header) table.appendChild(header.cloneNode(true));

    // Use different photos for women
    const photos = gender === 'women' ? playerPhotosWomen : playerPhotos;

    rankings.forEach((player, index) => {
        const isBlurred = index >= 5;
        const changeClass = player.change.startsWith('+') ? 'positive' : player.change.startsWith('-') ? 'negative' : '';
        const photo = photos[index % photos.length];

        table.innerHTML += `
            <div class="ranking-row ${isBlurred ? 'blurred' : ''}">
                <span class="rank">${player.rank}</span>
                <div class="player-col">
                    <img src="${photo}" alt="">
                    <span>${player.name}</span>
                </div>
                <span class="country">${player.country}</span>
                <span class="points">${player.points}</span>
                <span class="change ${changeClass}">${player.change}</span>
            </div>
            ${index === 4 ? `
                <div class="ranking-blur-overlay">
                    <div class="blur-content">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                        <p>Sign in to see full rankings</p>
                        <a href="auth-en.html?redirect=tournaments" class="btn-primary">Sign In</a>
                    </div>
                </div>
            ` : ''}
        `;
    });
}

function loadPastTournaments(category) {
    const past = tournamentsData.past[category] || [];
    const grid = document.getElementById('pastTournamentsGrid');

    grid.innerHTML = past.map((t, index) => `
        <div class="past-tournament-card">
            <div class="past-tournament-header">
                <span class="past-date">${t.date}</span>
                <span class="past-status completed">Completed</span>
            </div>
            <h4>${t.name}</h4>
            <div class="past-winner">
                <img src="${playerPhotos[index % playerPhotos.length]}" alt="">
                <div class="winner-info">
                    <span class="winner-label">Winner</span>
                    <span class="winner-name">${t.winner}</span>
                </div>
                <span class="winner-trophy">🏆</span>
            </div>
            <div class="past-stats">
                <span>${t.participants} participants</span>
                <span>•</span>
                <span>${t.prize}</span>
            </div>
            <a href="tournament-en.html?id=${category}-past-${index + 1}" class="btn-view-bracket">View Bracket</a>
        </div>
    `).join('');
}

function highlightActiveCategory(category) {
    document.querySelectorAll('.nav-dropdown-item[data-category]').forEach(item => {
        item.classList.toggle('active', item.dataset.category === category);
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    const sectionTitle = document.querySelector('#upcoming .section-header h2');
    const pastSection = document.getElementById('past');

    // On page load — hide completed tournaments by default, hide past section
    document.querySelectorAll('.tournament-card').forEach(card => {
        if (card.dataset.status === 'past') {
            card.style.display = 'none';
        }
    });
    if (pastSection) pastSection.style.display = 'none';

    filterBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            filterBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            // Update section title based on filter
            if (sectionTitle) {
                if (filter === 'past') {
                    sectionTitle.textContent = 'Completed Tournaments';
                } else {
                    sectionTitle.textContent = 'Upcoming Tournaments';
                }
            }

            document.querySelectorAll('.tournament-card').forEach(card => {
                const status = card.dataset.status;
                var show = false;
                if (filter === 'all') {
                    show = status !== 'past';
                } else {
                    show = status === filter;
                }
                if (show) {
                    card.style.display = 'flex';
                    card.style.opacity = '1';
                } else {
                    card.style.opacity = '0';
                    setTimeout(() => card.style.display = 'none', 200);
                }
            });
        });
    });
}

function initCalendarButtons() {
    document.addEventListener('click', function(e) {
        if (e.target.closest('.btn-calendar')) {
            const card = e.target.closest('.tournament-card');
            if (!card) return;

            const title = card.querySelector('h3').textContent;
            const dateEl = card.querySelector('.tournament-date');
            const day = dateEl.querySelector('.date-day').textContent;
            const month = dateEl.querySelector('.date-month').textContent;

            const months = {'Jan':'01','Feb':'02','Mar':'03','Apr':'04','May':'05','Jun':'06','Jul':'07','Aug':'08','Sep':'09','Oct':'10','Nov':'11','Dec':'12'};
            const date = `2026${months[month] || '01'}${day.padStart(2, '0')}`;
            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${date}T090000/${date}T180000`;

            window.open(googleUrl, '_blank');
        }

        if (e.target.closest('.btn-notify')) {
            const btn = e.target.closest('.btn-notify');
            btn.textContent = 'Notification set ✓';
            btn.style.color = 'var(--accent)';
            btn.style.borderColor = 'var(--accent)';
            btn.disabled = true;
        }

        // Registration gate
        var regBtn = e.target.closest('.btn-register');
        if (regBtn) {
            e.preventDefault();

            // 1. Check auth via localStorage (like auth-nav.js)
            var isLoggedIn = false;
            try {
                var key = 'sb-qqkzszesviukopgjbead-auth-token';
                var raw = localStorage.getItem(key);
                if (raw) {
                    var session = JSON.parse(raw);
                    var now = Math.floor(Date.now() / 1000);
                    if (session && session.access_token && session.expires_at > now) {
                        isLoggedIn = true;
                    }
                }
            } catch(ex) {}

            // 2. Not logged in → redirect to auth
            if (!isLoggedIn) {
                window.location.href = 'auth-en.html';
                return;
            }

            // 3. Logged in → check membership
            if (typeof window.checkMembership === 'function') {
                window.checkMembership().then(function(result) {
                    if (result.active) {
                        showRegisterModal('allowed');
                    } else {
                        showRegisterModal('blocked');
                    }
                });
            }
        }
    });
}

// ========================================
// REGISTRATION MODAL (EN)
// ========================================

function showRegisterModal(type) {
    var existing = document.querySelector('.trn-register-modal-overlay');
    if (existing) existing.remove();

    var overlay = document.createElement('div');
    overlay.className = 'trn-register-modal-overlay';

    var lockSvg = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

    if (type === 'blocked') {
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon">' + lockSvg + '</div>' +
                '<h3 class="trn-register-modal-title">Get Membership</h3>' +
                '<p class="trn-register-modal-text">KSLT membership is required to register for tournaments</p>' +
                '<a href="pricing-en.html" class="btn-primary trn-register-modal-btn">Get Membership</a>' +
            '</div>';
    } else {
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon" style="color:var(--accent);opacity:1"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></div>' +
                '<h3 class="trn-register-modal-title">Coming Soon!</h3>' +
                '<p class="trn-register-modal-text">Online tournament registration will be available soon</p>' +
            '</div>';
    }

    document.body.appendChild(overlay);
    requestAnimationFrame(function() { overlay.classList.add('active'); });

    overlay.querySelector('.trn-register-modal-close').onclick = function() {
        overlay.classList.remove('active');
        setTimeout(function() { overlay.remove(); }, 200);
    };
    overlay.onclick = function(ev) {
        if (ev.target === overlay) {
            overlay.classList.remove('active');
            setTimeout(function() { overlay.remove(); }, 200);
        }
    };
}

// Inject modal styles
(function() {
    var style = document.createElement('style');
    style.textContent =
        '.trn-register-modal-overlay{position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(0,0,0,0.7);backdrop-filter:blur(4px);z-index:10000;display:flex;align-items:center;justify-content:center;opacity:0;transition:opacity .2s ease}' +
        '.trn-register-modal-overlay.active{opacity:1}' +
        '.trn-register-modal{background:var(--bg-card,#1a1a1a);border:1px solid var(--border,#2a2a2a);border-radius:16px;padding:40px 32px;max-width:400px;width:90%;text-align:center;position:relative;transform:scale(0.95);transition:transform .2s ease}' +
        '.trn-register-modal-overlay.active .trn-register-modal{transform:scale(1)}' +
        '.trn-register-modal-close{position:absolute;top:12px;right:16px;background:none;border:none;color:var(--text-muted,#888);font-size:1.5rem;cursor:pointer;padding:4px 8px;line-height:1}' +
        '.trn-register-modal-close:hover{color:var(--text-primary,#fff)}' +
        '.trn-register-modal-icon{opacity:0.4;margin-bottom:16px;color:var(--text-muted,#888)}' +
        '.trn-register-modal-title{font-size:1.3rem;font-weight:600;color:var(--text-primary,#fff);margin:0 0 12px}' +
        '.trn-register-modal-text{font-size:0.95rem;color:var(--text-muted,#888);max-width:320px;margin:0 auto 24px;line-height:1.5}' +
        '.trn-register-modal-btn{display:inline-block;padding:12px 32px;border-radius:8px;font-weight:600;text-decoration:none;transition:opacity .2s}' +
        '.trn-register-modal-btn:hover{opacity:0.9}';
    document.head.appendChild(style);
})();
