// ========================================
// Оформление разделов турниров: название, подпись и картинка.
// Запас на случай, когда база недоступна.
//
// Раньше файл был на семьсот строк: следом лежали выдуманные
// турниры со счётом, призовыми и снимками с фотостока. Код их не
// читал, но при сбое они могли всплыть на странице как настоящие
// ========================================

const tournamentsData = {
    categories: {
        promasters: {
            name: 'Pro-Masters',
            title: 'Pro-Masters Tournaments',
            description: 'Высший уровень турниров для профессионалов и сильнейших любителей.',
            sub: 'Сюда не записываются — сюда дорастают.',
            stats: { tournaments: 6, participants: '120+', prize: '200K' },
            bgImage: '../images/heroes/promasters.jpg'
        },
        masters: {
            name: 'Masters',
            title: 'Masters Tournaments',
            description: 'Турниры для продвинутых игроков с высоким уровнем подготовки.',
            sub: 'Здесь каждый — чей-то самый сложный матч.',
            stats: { tournaments: 8, participants: '180+', prize: '100K' },
            bgImage: '../images/heroes/masters.jpg'
        },
        challenger: {
            name: 'Challengers',
            title: 'Challengers Tournaments',
            description: 'Турниры среднего уровня для игроков, стремящихся к росту.',
            sub: 'Пора проверить, чего стоит твоя стабильность.',
            stats: { tournaments: 10, participants: '200+', prize: '75K' },
            bgImage: '../images/heroes/challenger.jpg'
        },
        futures: {
            name: 'Futures',
            title: 'Futures Tournaments',
            description: 'Турниры для начинающих и развивающихся игроков.',
            sub: 'Все когда-то выходили на корт впервые.',
            stats: { tournaments: 15, participants: '300+', prize: '40K' },
            bgImage: '../images/heroes/futures.jpg'
        },
        tour: {
            name: 'Tour',
            title: 'Tour Tournaments',
            description: 'Открытые турниры для всех уровней. Получите опыт соревнований и поднимитесь в рейтинге KSLT.',
            sub: 'Побеждает не сила, а голова.',
            stats: { tournaments: 12, participants: '240+', prize: '50K' },
            bgImage: '../images/heroes/tour.jpg'
        },
        friendly: {
            name: 'Friendly Weekend',
            title: 'Friendly Weekend',
            description: 'Дружеские турниры без рейтинговых очков. Играйте в удовольствие!',
            sub: 'Счёт забудется, выходные — нет.',
            stats: { tournaments: 20, participants: '400+', prize: '—' },
            bgImage: '../images/heroes/friendly.jpg'
        }
    }
};
