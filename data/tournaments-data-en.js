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
            description: 'Highest level tournaments for professionals and top amateurs.',
            sub: 'You do not sign up for this — you grow into it.',
            stats: { tournaments: 6, participants: '120+', prize: '200K' },
            bgImage: '../images/heroes/promasters.jpg'
        },
        masters: {
            name: 'Masters',
            title: 'Masters Tournaments',
            description: 'Tournaments for advanced players with high skill levels.',
            sub: 'Here everyone is somebody\'s toughest match.',
            stats: { tournaments: 8, participants: '180+', prize: '100K' },
            bgImage: '../images/heroes/masters.jpg'
        },
        challenger: {
            name: 'Challenger',
            title: 'Challenger Tournaments',
            description: 'Mid-level tournaments for players aiming to grow.',
            sub: 'Time to find out what your consistency is worth.',
            stats: { tournaments: 10, participants: '200+', prize: '75K' },
            bgImage: '../images/heroes/challenger.jpg'
        },
        futures: {
            name: 'Futures',
            title: 'Futures Tournaments',
            description: 'Tournaments for beginners and developing players.',
            sub: 'Everyone stepped onto a court for the first time once.',
            stats: { tournaments: 15, participants: '300+', prize: '40K' },
            bgImage: '../images/heroes/futures.jpg'
        },
        tour: {
            name: 'Tour',
            title: 'Tour Tournaments',
            description: 'Open tournaments for all skill levels. Gain competition experience and climb the KSLT rankings.',
            sub: 'The head wins, not the arm.',
            stats: { tournaments: 12, participants: '240+', prize: '50K' },
            bgImage: '../images/heroes/tour.jpg'
        },
        friendly: {
            name: 'Friendly',
            title: 'Friendly Tournaments',
            description: 'Friendly tournaments without ranking points. Play for fun!',
            sub: 'The score fades, the weekend does not.',
            stats: { tournaments: 20, participants: '400+', prize: '—' },
            bgImage: '../images/heroes/friendly.jpg'
        }
    }
};
