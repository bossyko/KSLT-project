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
            title: 'Pro-Masters мелдештер',
            description: 'Профессионалдар жана эң күчтүү сүйүүчүлөр үчүн эң жогорку деңгээлдеги мелдештер.',
            sub: 'Бул жерге жазылышпайт — бул жерге өсүп жетишет.',
            stats: { tournaments: 6, participants: '120+', prize: '200K' },
            bgImage: '../images/heroes/promasters.jpg'
        },
        masters: {
            name: 'Masters',
            title: 'Masters мелдештер',
            description: 'Жогорку деңгээлдеги даярдыктагы алдыңкы оюнчулар үчүн мелдештер.',
            sub: 'Бул жерде ар бир оюнчу кимдир бирөө үчүн эң оор каршылаш.',
            stats: { tournaments: 8, participants: '180+', prize: '100K' },
            bgImage: '../images/heroes/masters.jpg'
        },
        challenger: {
            name: 'Challenger',
            title: 'Challenger мелдештер',
            description: 'Өсүүгө умтулган оюнчулар үчүн орто деңгээлдеги мелдештер.',
            sub: 'Туруктуулугуң эмнеге татыктуу экенин текшерүү убагы.',
            stats: { tournaments: 10, participants: '200+', prize: '75K' },
            bgImage: '../images/heroes/challenger.jpg'
        },
        futures: {
            name: 'Futures',
            title: 'Futures мелдештер',
            description: 'Башталгыч жана өнүгүп жаткан оюнчулар үчүн мелдештер.',
            sub: 'Ар бир оюнчу бир кезде кортко биринчи жолу чыккан.',
            stats: { tournaments: 15, participants: '300+', prize: '40K' },
            bgImage: '../images/heroes/futures.jpg'
        },
        tour: {
            name: 'Tour',
            title: 'Tour мелдештер',
            description: 'Бардык деңгээлдер үчүн ачык мелдештер. Мелдеш тажрыйбасын алыңыз жана KSLT рейтингинде көтөрүлүңүз.',
            sub: 'Күч эмес, акыл жеңет.',
            stats: { tournaments: 12, participants: '240+', prize: '50K' },
            bgImage: '../images/heroes/tour.jpg'
        },
        friendly: {
            name: 'Friendly',
            title: 'Friendly мелдештер',
            description: 'Рейтинг упайларысыз достук мелдештер. Ырахат алып ойноңуз!',
            sub: 'Эсеп унутулат, дем алыш күндөр — жок.',
            stats: { tournaments: 20, participants: '400+', prize: '—' },
            bgImage: '../images/heroes/friendly.jpg'
        }
    }
};
