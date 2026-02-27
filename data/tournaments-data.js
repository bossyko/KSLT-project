// ========================================
// TOURNAMENTS DATA - Replace with API later
// ========================================

const tournamentsData = {
    categories: {
        promasters: {
            name: 'Pro-Masters',
            title: 'Pro-Masters Tournaments',
            description: 'Высший уровень турниров для профессионалов и сильнейших любителей.',
            stats: { tournaments: 6, participants: '120+', prize: '200K' },
            bgImage: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=1920&q=80'
        },
        masters: {
            name: 'Masters',
            title: 'Masters Tournaments',
            description: 'Турниры для продвинутых игроков с высоким уровнем подготовки.',
            stats: { tournaments: 8, participants: '180+', prize: '100K' },
            bgImage: 'https://images.unsplash.com/photo-1535131749006-b7f58c99034b?w=1920&q=80'
        },
        challenger: {
            name: 'Challenger',
            title: 'Challenger Tournaments',
            description: 'Турниры среднего уровня для игроков, стремящихся к росту.',
            stats: { tournaments: 10, participants: '200+', prize: '75K' },
            bgImage: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=1920&q=80'
        },
        futures: {
            name: 'Futures',
            title: 'Futures Tournaments',
            description: 'Турниры для начинающих и развивающихся игроков.',
            stats: { tournaments: 15, participants: '300+', prize: '40K' },
            bgImage: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=1920&q=80'
        },
        tour: {
            name: 'Tour',
            title: 'Tour Tournaments',
            description: 'Открытые турниры для всех уровней. Получите опыт соревнований и поднимитесь в рейтинге KSLT.',
            stats: { tournaments: 12, participants: '240+', prize: '50K' },
            bgImage: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80'
        },
        friendly: {
            name: 'Friendly',
            title: 'Friendly Tournaments',
            description: 'Дружеские турниры без рейтинговых очков. Играйте в удовольствие!',
            stats: { tournaments: 20, participants: '400+', prize: '—' },
            bgImage: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=1920&q=80'
        }
    },

    // Upcoming tournaments by category
    upcoming: {
        promasters: [
            { id: 1, name: 'KSLT Pro-Masters Championship', date: { day: '10', month: 'Мар' }, location: 'Бишкек, Tennis Palace', time: '09:00 - 20:00', format: 'Одиночный', participants: '16/32', prize: '100,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 2, name: 'Spring Pro-Masters Open', date: { day: '24', month: 'Мар' }, location: 'Бишкек, Elite Courts', time: '10:00 - 19:00', format: 'Одиночный', participants: '8/16', prize: '50,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 3, name: 'Pro-Masters Doubles Cup', date: { day: '07', month: 'Апр' }, location: 'Бишкек, Асанбай', time: '10:00 - 18:00', format: 'Парный', participants: '6/16 пар', prize: '60,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 4, name: 'April Pro-Masters Grand', date: { day: '21', month: 'Апр' }, location: 'Бишкек, Central Court', time: '09:00 - 20:00', format: 'Одиночный', participants: '0/32', prize: '120,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 5, name: 'Pro-Masters Mixed Invitational', date: { day: '05', month: 'Май' }, location: 'Бишкек, Tennis Park', time: '10:00 - 19:00', format: 'Микст', participants: '0/16 пар', prize: '40,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 6, name: 'May Pro-Masters Classic', date: { day: '19', month: 'Май' }, location: 'Бишкек, Ахунбаева 165', time: '09:00 - 20:00', format: 'Одиночный', participants: '0/32', prize: '80,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 7, name: 'Summer Pro-Masters Open', date: { day: '02', month: 'Июн' }, location: 'Бишкек, Elite Courts', time: '08:00 - 21:00', format: 'Одиночный', participants: '0/64', prize: '150,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'Pro-Masters Doubles Championship', date: { day: '16', month: 'Июн' }, location: 'Бишкек, Tennis Palace', time: '10:00 - 19:00', format: 'Парный', participants: '0/16 пар', prize: '70,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' }
        ],
        masters: [
            { id: 1, name: 'KSLT Masters Series #1', date: { day: '08', month: 'Мар' }, location: 'Бишкек, Central Court', time: '09:00 - 18:00', format: 'Одиночный', participants: '28/32', prize: '40,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 2, name: 'Masters Doubles Cup', date: { day: '22', month: 'Мар' }, location: 'Бишкек, Асанбай', time: '10:00 - 17:00', format: 'Парный', participants: '10/16 пар', prize: '30,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 3, name: 'April Masters Championship', date: { day: '05', month: 'Апр' }, location: 'Бишкек, Tennis Park', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '60,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 4, name: 'Masters Mixed Doubles', date: { day: '19', month: 'Апр' }, location: 'Бишкек, Джал', time: '10:00 - 18:00', format: 'Микст', participants: '0/16 пар', prize: '25,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 5, name: 'KSLT Masters Series #2', date: { day: '03', month: 'Май' }, location: 'Бишкек, Ахунбаева 165', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '40,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 6, name: 'May Masters Doubles Open', date: { day: '17', month: 'Май' }, location: 'Бишкек, Central Court', time: '10:00 - 17:00', format: 'Парный', participants: '0/16 пар', prize: '35,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 7, name: 'Masters Grand Cup', date: { day: '07', month: 'Июн' }, location: 'Бишкек, Tennis Palace', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '80,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'Summer Masters Classic', date: { day: '21', month: 'Июн' }, location: 'Бишкек, Elite Courts', time: '09:00 - 19:00', format: 'Одиночный', participants: '0/32', prize: '50,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' }
        ],
        challenger: [
            { id: 1, name: 'Challenger Cup Spring', date: { day: '01', month: 'Мар' }, location: 'Бишкек, Центральный корт', time: '09:00 - 18:00', format: 'Одиночный', participants: '30/32', prize: '25,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 2, name: 'Challenger Doubles', date: { day: '15', month: 'Мар' }, location: 'Бишкек, Джал', time: '10:00 - 17:00', format: 'Парный', participants: '12/16 пар', prize: '20,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 3, name: 'March Challenger Open', date: { day: '29', month: 'Мар' }, location: 'Бишкек, Ахунбаева', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '30,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 4, name: 'Challenger Mixed Cup', date: { day: '12', month: 'Апр' }, location: 'Бишкек, Асанбай', time: '10:00 - 18:00', format: 'Микст', participants: '0/16 пар', prize: '18,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 5, name: 'April Challenger Championship', date: { day: '26', month: 'Апр' }, location: 'Бишкек, Tennis Park', time: '09:00 - 19:00', format: 'Одиночный', participants: '0/32', prize: '28,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 6, name: 'Challenger Doubles Open', date: { day: '10', month: 'Май' }, location: 'Бишкек, Central Court', time: '10:00 - 17:00', format: 'Парный', participants: '0/16 пар', prize: '22,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 7, name: 'May Challenger Series', date: { day: '24', month: 'Май' }, location: 'Бишкек, Джал', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '25,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'Summer Challenger Grand', date: { day: '14', month: 'Июн' }, location: 'Бишкек, Ахунбаева 165', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '35,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' }
        ],
        futures: [
            { id: 1, name: 'Futures Start Cup', date: { day: '20', month: 'Фев' }, location: 'Бишкек, Ахунбаева 165', time: '10:00 - 17:00', format: 'Одиночный', participants: '20/24', prize: '10,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 2, name: 'Futures Junior Open', date: { day: '06', month: 'Мар' }, location: 'Бишкек, Асанбай', time: '09:00 - 16:00', format: 'Одиночный', participants: '15/24', prize: '8,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 3, name: 'Spring Futures Championship', date: { day: '20', month: 'Мар' }, location: 'Бишкек, Tennis Park', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '15,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 4, name: 'Futures Doubles Cup', date: { day: '03', month: 'Апр' }, location: 'Бишкек, Джал', time: '10:00 - 17:00', format: 'Парный', participants: '0/16 пар', prize: '6,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 5, name: 'April Futures Open', date: { day: '17', month: 'Апр' }, location: 'Бишкек, Центральный корт', time: '09:00 - 17:00', format: 'Одиночный', participants: '0/24', prize: '10,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 6, name: 'Futures Mixed Tournament', date: { day: '01', month: 'Май' }, location: 'Бишкек, Асанбай', time: '10:00 - 18:00', format: 'Микст', participants: '0/12 пар', prize: '8,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 7, name: 'May Futures Series', date: { day: '15', month: 'Май' }, location: 'Бишкек, Ахунбаева 165', time: '09:00 - 17:00', format: 'Одиночный', participants: '0/24', prize: '12,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'Summer Futures Championship', date: { day: '05', month: 'Июн' }, location: 'Бишкек, Tennis Park', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '15,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' },
            { id: 9, name: 'Futures Doubles Open', date: { day: '19', month: 'Июн' }, location: 'Бишкек, Central Court', time: '10:00 - 17:00', format: 'Парный', participants: '0/16 пар', prize: '7,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' }
        ],
        tour: [
            { id: 1, name: 'KSLT Tour Open #1', date: { day: '15', month: 'Фев' }, location: 'Бишкек, Ахунбаева 165', time: '09:00 - 18:00', format: 'Одиночный', participants: '24/32', prize: '15,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 2, name: 'KSLT Tour Doubles', date: { day: '22', month: 'Фев' }, location: 'Бишкек, Асанбай 21', time: '10:00 - 17:00', format: 'Парный', participants: '12/16 пар', prize: '20,000 сом', status: 'open', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 3, name: 'Spring Tour Championship', date: { day: '01', month: 'Мар' }, location: 'Бишкек, Центральный корт', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '50,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 4, name: 'Tour Mixed Cup', date: { day: '15', month: 'Мар' }, location: 'Бишкек, Джал', time: '10:00 - 18:00', format: 'Микст', participants: '0/12 пар', prize: '12,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 5, name: 'KSLT Tour Open #2', date: { day: '29', month: 'Мар' }, location: 'Бишкек, Tennis Park', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '15,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 6, name: 'April Tour Doubles', date: { day: '12', month: 'Апр' }, location: 'Бишкек, Асанбай', time: '10:00 - 17:00', format: 'Парный', participants: '0/16 пар', prize: '18,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 7, name: 'Tour Grand Series', date: { day: '03', month: 'Май' }, location: 'Бишкек, Central Court', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '50,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'KSLT Tour Open #3', date: { day: '17', month: 'Май' }, location: 'Бишкек, Ахунбаева 165', time: '09:00 - 18:00', format: 'Одиночный', participants: '0/32', prize: '15,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' },
            { id: 9, name: 'Summer Tour Championship', date: { day: '07', month: 'Июн' }, location: 'Бишкек, Tennis Palace', time: '08:00 - 20:00', format: 'Одиночный', participants: '0/64', prize: '60,000 сом', status: 'soon', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' }
        ],
        friendly: [
            { id: 1, name: 'Weekend Friendly #5', date: { day: '17', month: 'Фев' }, location: 'Бишкек, Асанбай', time: '14:00 - 18:00', format: 'Одиночный', participants: '12/16', prize: 'Без призового', status: 'open', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' },
            { id: 2, name: 'Mixed Doubles Fun', date: { day: '24', month: 'Фев' }, location: 'Бишкек, Джал', time: '15:00 - 19:00', format: 'Микст', participants: '6/8 пар', prize: 'Без призового', status: 'open', image: 'https://images.unsplash.com/photo-1560012057-4372e14c5085?w=800&q=80' },
            { id: 3, name: 'Family Tennis Day', date: { day: '02', month: 'Мар' }, location: 'Бишкек, Tennis Park', time: '10:00 - 16:00', format: 'Семейный', participants: '0/20', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80' },
            { id: 4, name: 'Weekend Friendly #6', date: { day: '16', month: 'Мар' }, location: 'Бишкек, Ахунбаева 165', time: '14:00 - 18:00', format: 'Одиночный', participants: '0/16', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80' },
            { id: 5, name: 'Doubles Fun Day', date: { day: '30', month: 'Мар' }, location: 'Бишкек, Асанбай', time: '15:00 - 19:00', format: 'Парный', participants: '0/12 пар', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80' },
            { id: 6, name: 'April Mixed Fun', date: { day: '13', month: 'Апр' }, location: 'Бишкек, Central Court', time: '14:00 - 18:00', format: 'Микст', participants: '0/10 пар', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1551773188-d63e5b03c7ce?w=800&q=80' },
            { id: 7, name: 'Weekend Friendly #7', date: { day: '27', month: 'Апр' }, location: 'Бишкек, Джал', time: '14:00 - 18:00', format: 'Одиночный', participants: '0/16', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?w=800&q=80' },
            { id: 8, name: 'Family Tennis Day #2', date: { day: '11', month: 'Май' }, location: 'Бишкек, Tennis Park', time: '10:00 - 16:00', format: 'Семейный', participants: '0/24', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=800&q=80' },
            { id: 9, name: 'Summer Mixed Fun', date: { day: '08', month: 'Июн' }, location: 'Бишкек, Асанбай', time: '15:00 - 19:00', format: 'Микст', participants: '0/10 пар', prize: 'Без призового', status: 'soon', image: 'https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80' }
        ]
    },

    // Rankings by category and gender
    rankings: {
        men: {
            promasters: [
                { rank: 1, name: 'Алексей Иванов', country: '🇰🇬', tournaments: 5, points: 2450, change: '+2' },
                { rank: 2, name: 'Максим Петров', country: '🇰🇬', tournaments: 6, points: 2380, change: '-1' },
                { rank: 3, name: 'Дмитрий Козлов', country: '🇰🇿', tournaments: 5, points: 2310, change: '+1' },
                { rank: 4, name: 'Тимур Асанов', country: '🇰🇬', tournaments: 4, points: 2180, change: '—' },
                { rank: 5, name: 'Руслан Бакиров', country: '🇺🇿', tournaments: 5, points: 2050, change: '+3' },
                { rank: 6, name: 'Эрлан Жумаев', country: '🇰🇬', tournaments: 6, points: 1980, change: '-2' },
                { rank: 7, name: 'Данияр Мамбетов', country: '🇰🇿', tournaments: 4, points: 1920, change: '+1' },
                { rank: 8, name: 'Артём Кравцов', country: '🇷🇺', tournaments: 3, points: 1870, change: '—' },
                { rank: 9, name: 'Канат Омуров', country: '🇰🇬', tournaments: 5, points: 1820, change: '+2' },
                { rank: 10, name: 'Серик Алиев', country: '🇰🇿', tournaments: 4, points: 1760, change: '-1' }
            ],
            masters: [
                { rank: 1, name: 'Бекжан Турсунов', country: '🇰🇬', tournaments: 7, points: 1850, change: '+1' },
                { rank: 2, name: 'Нурлан Кыдыров', country: '🇰🇬', tournaments: 8, points: 1780, change: '—' },
                { rank: 3, name: 'Марат Сулейманов', country: '🇰🇿', tournaments: 6, points: 1720, change: '-1' },
                { rank: 4, name: 'Азат Жаныбеков', country: '🇰🇬', tournaments: 7, points: 1690, change: '+2' },
                { rank: 5, name: 'Кенжебек Алиев', country: '🇺🇿', tournaments: 5, points: 1650, change: '—' },
                { rank: 6, name: 'Саламат Орозов', country: '🇰🇬', tournaments: 8, points: 1600, change: '+3' },
                { rank: 7, name: 'Иван Шевченко', country: '🇷🇺', tournaments: 6, points: 1560, change: '-2' },
                { rank: 8, name: 'Алмаз Токтогулов', country: '🇰🇬', tournaments: 7, points: 1520, change: '—' },
                { rank: 9, name: 'Жанат Касымов', country: '🇰🇬', tournaments: 5, points: 1480, change: '+1' },
                { rank: 10, name: 'Эмиль Болотов', country: '🇰🇬', tournaments: 6, points: 1440, change: '-1' }
            ],
            challenger: [
                { rank: 1, name: 'Элдияр Сатыбалдиев', country: '🇰🇬', tournaments: 9, points: 1420, change: '+1' },
                { rank: 2, name: 'Канат Джумагулов', country: '🇰🇬', tournaments: 10, points: 1380, change: '—' },
                { rank: 3, name: 'Алишер Рахимов', country: '🇺🇿', tournaments: 8, points: 1340, change: '-1' },
                { rank: 4, name: 'Улан Кожоев', country: '🇰🇬', tournaments: 9, points: 1290, change: '+3' },
                { rank: 5, name: 'Талант Оморов', country: '🇰🇬', tournaments: 7, points: 1250, change: '—' },
                { rank: 6, name: 'Серик Нурмухамедов', country: '🇰🇿', tournaments: 8, points: 1210, change: '+2' },
                { rank: 7, name: 'Адилет Сыдыков', country: '🇰🇬', tournaments: 10, points: 1180, change: '-1' },
                { rank: 8, name: 'Максат Турдалиев', country: '🇰🇬', tournaments: 7, points: 1150, change: '—' },
                { rank: 9, name: 'Бакыт Эргешов', country: '🇰🇬', tournaments: 9, points: 1110, change: '+2' },
                { rank: 10, name: 'Нурсултан Касымов', country: '🇰🇬', tournaments: 8, points: 1070, change: '-2' }
            ],
            futures: [
                { rank: 1, name: 'Аскар Болотов', country: '🇰🇬', tournaments: 12, points: 980, change: '+4' },
                { rank: 2, name: 'Темирлан Усенов', country: '🇰🇬', tournaments: 14, points: 920, change: '+1' },
                { rank: 3, name: 'Жандос Касымов', country: '🇰🇿', tournaments: 11, points: 870, change: '—' },
                { rank: 4, name: 'Санжар Абдиев', country: '🇰🇬', tournaments: 13, points: 840, change: '-2' },
                { rank: 5, name: 'Бакыт Назаров', country: '🇰🇬', tournaments: 10, points: 810, change: '+2' },
                { rank: 6, name: 'Кайрат Эсенов', country: '🇺🇿', tournaments: 12, points: 780, change: '—' },
                { rank: 7, name: 'Мирлан Шералиев', country: '🇰🇬', tournaments: 11, points: 750, change: '-1' },
                { rank: 8, name: 'Нурбек Токтоев', country: '🇰🇬', tournaments: 14, points: 720, change: '+1' },
                { rank: 9, name: 'Тилек Байболотов', country: '🇰🇬', tournaments: 9, points: 690, change: '+3' },
                { rank: 10, name: 'Эрмек Султанов', country: '🇰🇬', tournaments: 13, points: 660, change: '-2' }
            ],
            tour: [
                { rank: 1, name: 'Самат Джолдошев', country: '🇰🇬', tournaments: 8, points: 520, change: '+5' },
                { rank: 2, name: 'Арсен Калыков', country: '🇰🇬', tournaments: 7, points: 490, change: '+2' },
                { rank: 3, name: 'Бегалы Маматов', country: '🇰🇬', tournaments: 9, points: 460, change: '—' },
                { rank: 4, name: 'Нуржигит Асылбеков', country: '🇰🇿', tournaments: 6, points: 430, change: '-1' },
                { rank: 5, name: 'Жаныш Омуралиев', country: '🇰🇬', tournaments: 7, points: 400, change: '+1' },
                { rank: 6, name: 'Тилек Субанов', country: '🇰🇬', tournaments: 5, points: 380, change: '—' },
                { rank: 7, name: 'Мурат Байсалов', country: '🇰🇬', tournaments: 6, points: 350, change: '-3' },
                { rank: 8, name: 'Чынгыз Касымалиев', country: '🇰🇬', tournaments: 8, points: 320, change: '+2' },
                { rank: 9, name: 'Эрмек Токтоев', country: '🇰🇬', tournaments: 4, points: 290, change: '—' },
                { rank: 10, name: 'Бакыт Сатаров', country: '🇰🇬', tournaments: 5, points: 260, change: '+4' }
            ]
        },
        women: {
            promasters: [
                { rank: 1, name: 'Айгерим Ташиева', country: '🇰🇬', tournaments: 5, points: 2280, change: '+1' },
                { rank: 2, name: 'Динара Сафина', country: '🇰🇬', tournaments: 6, points: 2150, change: '+2' },
                { rank: 3, name: 'Алия Касымова', country: '🇰🇿', tournaments: 5, points: 2080, change: '-1' },
                { rank: 4, name: 'Мадина Рахимова', country: '🇺🇿', tournaments: 4, points: 1950, change: '—' },
                { rank: 5, name: 'Жазгуль Омурзакова', country: '🇰🇬', tournaments: 5, points: 1870, change: '+3' },
                { rank: 6, name: 'Нургуль Эсенова', country: '🇰🇬', tournaments: 6, points: 1780, change: '-2' },
                { rank: 7, name: 'Салтанат Жумабаева', country: '🇰🇬', tournaments: 4, points: 1720, change: '+1' },
                { rank: 8, name: 'Камила Ибрагимова', country: '🇷🇺', tournaments: 3, points: 1650, change: '—' },
                { rank: 9, name: 'Бегимай Токтосунова', country: '🇰🇬', tournaments: 5, points: 1580, change: '+2' },
                { rank: 10, name: 'Айпери Кадырова', country: '🇰🇬', tournaments: 4, points: 1510, change: '-1' }
            ],
            masters: [
                { rank: 1, name: 'Гулзат Усенова', country: '🇰🇬', tournaments: 7, points: 1650, change: '+2' },
                { rank: 2, name: 'Назгуль Алиева', country: '🇰🇬', tournaments: 8, points: 1580, change: '—' },
                { rank: 3, name: 'Айнура Бектурова', country: '🇰🇿', tournaments: 6, points: 1520, change: '-1' },
                { rank: 4, name: 'Чолпон Сатыбалдиева', country: '🇰🇬', tournaments: 7, points: 1480, change: '+1' },
                { rank: 5, name: 'Жыпара Омурбекова', country: '🇰🇬', tournaments: 5, points: 1420, change: '—' },
                { rank: 6, name: 'Нуржан Токтогулова', country: '🇰🇬', tournaments: 8, points: 1380, change: '+2' },
                { rank: 7, name: 'Элиза Жээнбекова', country: '🇰🇬', tournaments: 6, points: 1340, change: '-2' },
                { rank: 8, name: 'Асель Мамбетова', country: '🇰🇬', tournaments: 7, points: 1290, change: '—' },
                { rank: 9, name: 'Бермет Касымалиева', country: '🇰🇬', tournaments: 5, points: 1250, change: '+1' },
                { rank: 10, name: 'Айгуль Турдубаева', country: '🇰🇬', tournaments: 6, points: 1200, change: '-1' }
            ],
            challenger: [
                { rank: 1, name: 'Канышай Сыдыкова', country: '🇰🇬', tournaments: 9, points: 1220, change: '+1' },
                { rank: 2, name: 'Нурия Эргешова', country: '🇰🇬', tournaments: 10, points: 1180, change: '—' },
                { rank: 3, name: 'Жибек Асанова', country: '🇰🇬', tournaments: 8, points: 1140, change: '-1' },
                { rank: 4, name: 'Айжамал Кожобекова', country: '🇰🇬', tournaments: 9, points: 1090, change: '+2' },
                { rank: 5, name: 'Сезим Орозбаева', country: '🇰🇬', tournaments: 7, points: 1050, change: '—' },
                { rank: 6, name: 'Эльмира Токтосунова', country: '🇰🇬', tournaments: 8, points: 1010, change: '+1' },
                { rank: 7, name: 'Нургуль Джолдошева', country: '🇰🇬', tournaments: 10, points: 980, change: '-1' },
                { rank: 8, name: 'Айдай Бакытова', country: '🇰🇬', tournaments: 7, points: 950, change: '—' },
                { rank: 9, name: 'Мээрим Шералиева', country: '🇰🇬', tournaments: 9, points: 910, change: '+2' },
                { rank: 10, name: 'Гулайым Касымова', country: '🇰🇬', tournaments: 8, points: 870, change: '-2' }
            ],
            futures: [
                { rank: 1, name: 'Айсулуу Болотова', country: '🇰🇬', tournaments: 12, points: 780, change: '+3' },
                { rank: 2, name: 'Жаркынай Усенова', country: '🇰🇬', tournaments: 14, points: 720, change: '+1' },
                { rank: 3, name: 'Назира Касымова', country: '🇰🇿', tournaments: 11, points: 670, change: '—' },
                { rank: 4, name: 'Адинай Абдиева', country: '🇰🇬', tournaments: 13, points: 640, change: '-2' },
                { rank: 5, name: 'Бегайым Назарова', country: '🇰🇬', tournaments: 10, points: 610, change: '+2' },
                { rank: 6, name: 'Айчурок Эсенова', country: '🇰🇬', tournaments: 12, points: 580, change: '—' },
                { rank: 7, name: 'Нурзат Шералиева', country: '🇰🇬', tournaments: 11, points: 550, change: '-1' },
                { rank: 8, name: 'Айзада Токтоева', country: '🇰🇬', tournaments: 14, points: 520, change: '+1' },
                { rank: 9, name: 'Зарина Байболотова', country: '🇰🇬', tournaments: 9, points: 490, change: '+3' },
                { rank: 10, name: 'Жылдыз Султанова', country: '🇰🇬', tournaments: 13, points: 460, change: '-2' }
            ],
            tour: [
                { rank: 1, name: 'Айнура Джолдошева', country: '🇰🇬', tournaments: 8, points: 420, change: '+4' },
                { rank: 2, name: 'Гулмира Калыкова', country: '🇰🇬', tournaments: 7, points: 390, change: '+1' },
                { rank: 3, name: 'Нургуль Маматова', country: '🇰🇬', tournaments: 9, points: 360, change: '—' },
                { rank: 4, name: 'Жазгуль Асылбекова', country: '🇰🇬', tournaments: 6, points: 330, change: '-1' },
                { rank: 5, name: 'Чинара Омуралиева', country: '🇰🇬', tournaments: 7, points: 300, change: '+2' },
                { rank: 6, name: 'Айпери Субанова', country: '🇰🇬', tournaments: 5, points: 280, change: '—' },
                { rank: 7, name: 'Бермет Байсалова', country: '🇰🇬', tournaments: 6, points: 250, change: '-2' },
                { rank: 8, name: 'Айгерим Касымалиева', country: '🇰🇬', tournaments: 8, points: 220, change: '+1' },
                { rank: 9, name: 'Нурайым Токтоева', country: '🇰🇬', tournaments: 4, points: 190, change: '—' },
                { rank: 10, name: 'Салтанат Сатарова', country: '🇰🇬', tournaments: 5, points: 160, change: '+3' }
            ]
        }
    },

    // Past tournaments
    past: {
        promasters: [
            { name: 'Winter Pro-Masters Finals', date: '20 Янв 2026', winner: 'Алексей Иванов', participants: 32, prize: '100,000 сом' },
            { name: 'New Year Pro-Masters', date: '05 Янв 2026', winner: 'Максим Петров', participants: 16, prize: '50,000 сом' }
        ],
        masters: [
            { name: 'January Masters Cup', date: '25 Янв 2026', winner: 'Бекжан Турсунов', participants: 32, prize: '40,000 сом' },
            { name: 'Winter Masters Open', date: '11 Янв 2026', winner: 'Нурлан Кыдыров', participants: 24, prize: '30,000 сом' }
        ],
        challenger: [
            { name: 'January Challenger Cup', date: '28 Янв 2026', winner: 'Элдияр Сатыбалдиев', participants: 32, prize: '25,000 сом' },
            { name: 'New Year Challenger', date: '10 Янв 2026', winner: 'Канат Джумагулов', participants: 24, prize: '20,000 сом' }
        ],
        futures: [
            { name: 'Winter Futures Cup', date: '30 Янв 2026', winner: 'Аскар Болотов', participants: 24, prize: '10,000 сом' },
            { name: 'January Futures Open', date: '15 Янв 2026', winner: 'Темирлан Усенов', participants: 16, prize: '8,000 сом' }
        ],
        tour: [
            { name: 'KSLT Winter Tour', date: '28 Янв 2026', winner: 'Самат Джолдошев', participants: 32, prize: '15,000 сом' },
            { name: 'New Year Tour Open', date: '14 Янв 2026', winner: 'Арсен Калыков', participants: 24, prize: '10,000 сом' },
            { name: 'December Tour Finals', date: '21 Дек 2025', winner: 'Бегалы Маматов', participants: 16, prize: '8,000 сом' }
        ],
        friendly: [
            { name: 'Weekend Friendly #4', date: '02 Фев 2026', winner: 'Все участники!', participants: 16, prize: 'Без призового' },
            { name: 'January Fun Tournament', date: '19 Янв 2026', winner: 'Все участники!', participants: 12, prize: 'Без призового' }
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
// INITIALIZATION
// ========================================

document.addEventListener('DOMContentLoaded', function() {
    // Get category from URL
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'tour';

    // Load category data
    loadCategoryData(category);

    // Highlight active nav item
    highlightActiveCategory(category);

    // Initialize filters
    initFilters();

    // Initialize calendar buttons
    initCalendarButtons();
});

function loadCategoryData(category) {
    const cat = tournamentsData.categories[category];
    if (!cat) return;

    // Update hero (elements only exist on tournaments.html, not overview)
    var elBadge = document.getElementById('categoryBadge');
    var elTitle = document.getElementById('categoryTitle');
    var elDesc = document.getElementById('categoryDescription');
    var elBg = document.getElementById('heroBg');
    if (elBadge) elBadge.textContent = cat.name;
    if (elTitle) elTitle.textContent = cat.title;
    if (elDesc) elDesc.textContent = cat.description;
    if (elBg) elBg.src = cat.bgImage;

    // Hide stats for Friendly, show for others
    var statsBlock = document.querySelector('.tournament-hero-stats');
    if (category === 'friendly') {
        if (statsBlock) statsBlock.style.display = 'none';
    } else {
        if (statsBlock) statsBlock.style.display = '';
        var elStat = document.getElementById('statTournaments');
        var elPart = document.getElementById('statParticipants');
        var elPrize = document.getElementById('statPrize');
        if (elStat) elStat.textContent = cat.stats.tournaments;
        if (elPart) elPart.textContent = cat.stats.participants;
        if (elPrize) elPrize.textContent = cat.stats.prize;
    }

    // Update page title
    document.title = `KSLT — ${cat.name} Tournaments`;

    // Update ranking section title
    var elRank = document.getElementById('rankingCategoryName');
    if (elRank) elRank.textContent = cat.name;

    // These functions only work on tournaments.html (not overview)
    if (!document.getElementById('tournamentsGrid')) return;

    // Load tournaments
    loadUpcomingTournaments(category);

    // Load rankings
    loadRankings(category);

    // Load past tournaments
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
                <span class="tournament-status ${t.status}">${t.status === 'open' ? 'Регистрация открыта' : 'Скоро открытие'}</span>
            </div>
            <div class="tournament-card-body">
                <h3>${t.name}</h3>
                <div class="tournament-meta">
                    <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg> ${t.location}</span>
                    <span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg> ${t.time}</span>
                </div>
                <div class="tournament-details">
                    <div class="detail-item">
                        <span class="detail-label">Формат</span>
                        <span class="detail-value">${t.format}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Участники</span>
                        <span class="detail-value">${t.participants}</span>
                    </div>
                    <div class="detail-item">
                        <span class="detail-label">Призовой фонд</span>
                        <span class="detail-value prize">${t.prize}</span>
                    </div>
                </div>
            </div>
            <div class="tournament-card-footer">
                <button class="btn-calendar" title="Добавить в календарь">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                </button>
                <a href="tournament.html?id=${category}-${t.id}" class="btn-view-bracket" style="margin-right:auto">Подробнее</a>
                ${t.status === 'open'
                    ? '<button class="btn-register">Зарегистрироваться</button>'
                    : '<button class="btn-notify">Уведомить меня</button>'}
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
                        <p>Войдите, чтобы увидеть полный рейтинг</p>
                        <a href="auth.html?redirect=tournaments" class="btn-primary">Войти</a>
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
                <span class="past-status completed">Завершён</span>
            </div>
            <h4>${t.name}</h4>
            <div class="past-winner">
                <img src="${playerPhotos[index % playerPhotos.length]}" alt="">
                <div class="winner-info">
                    <span class="winner-label">Победитель</span>
                    <span class="winner-name">${t.winner}</span>
                </div>
                <span class="winner-trophy">🏆</span>
            </div>
            <div class="past-stats">
                <span>${t.participants} участник${t.participants > 20 ? 'ов' : 'а'}</span>
                <span>•</span>
                <span>${t.prize}</span>
            </div>
            <a href="tournament.html?id=${category}-past-${index + 1}" class="btn-view-bracket">Смотреть сетку</a>
        </div>
    `).join('');
}

function highlightActiveCategory(category) {
    document.querySelectorAll('.nav-dropdown-item[data-category]').forEach(item => {
        if (item.dataset.category === category) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });
}

function initFilters() {
    const filterBtns = document.querySelectorAll('.filter-btn');
    if (!filterBtns.length) return;

    const isEn = window.location.pathname.indexOf('-en') !== -1;
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
                    sectionTitle.textContent = isEn ? 'Completed Tournaments' : 'Завершённые турниры';
                } else {
                    sectionTitle.textContent = isEn ? 'Upcoming Tournaments' : 'Предстоящие турниры';
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

            // Create Google Calendar link
            const months = {'Янв':'01','Фев':'02','Мар':'03','Апр':'04','Май':'05','Июн':'06','Июл':'07','Авг':'08','Сен':'09','Окт':'10','Ноя':'11','Дек':'12'};
            const date = `2026${months[month] || '01'}${day.padStart(2, '0')}`;
            const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${date}T090000/${date}T180000`;

            window.open(googleUrl, '_blank');
        }

        if (e.target.closest('.btn-notify')) {
            const btn = e.target.closest('.btn-notify');
            btn.textContent = 'Уведомление ✓';
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
                window.location.href = 'auth.html';
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
// REGISTRATION MODAL
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
                '<h3 class="trn-register-modal-title">Оформите членство</h3>' +
                '<p class="trn-register-modal-text">Для регистрации на турниры необходимо членство KSLT</p>' +
                '<a href="pricing.html" class="btn-primary trn-register-modal-btn">Оформить членство</a>' +
            '</div>';
    } else {
        overlay.innerHTML =
            '<div class="trn-register-modal">' +
                '<button class="trn-register-modal-close">&times;</button>' +
                '<div class="trn-register-modal-icon" style="color:var(--accent);opacity:1"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg></div>' +
                '<h3 class="trn-register-modal-title">Скоро!</h3>' +
                '<p class="trn-register-modal-text">Онлайн-регистрация на турниры скоро будет доступна</p>' +
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
