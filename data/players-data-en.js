// ========================================
// Названия категорий рейтинга — запас на случай, когда база
// недоступна. Раньше здесь лежали ещё и 135 выдуманных игроков со
// счётом и формой: код их не читал, а при сбое они могли всплыть
// на странице как настоящие
// ========================================

var playersData = {
    categories: {
        "men-promasters": { name: "Pro-Masters", gender: "men", genderLabel: "Men", players: [] },
        "men-masters": { name: "Masters", gender: "men", genderLabel: "Men", players: [] },
        "men-futures": { name: "Futures", gender: "men", genderLabel: "Men", players: [] },
        "men-challenger": { name: "Challenger", gender: "men", genderLabel: "Men", players: [] },
        "men-tour": { name: "Tour", gender: "men", genderLabel: "Men", players: [] },
        "women-promasters": { name: "Pro-Masters", gender: "women", genderLabel: "Women", players: [] },
        "women-masters": { name: "Masters", gender: "women", genderLabel: "Women", players: [] },
        "women-challenger": { name: "Challenger", gender: "women", genderLabel: "Women", players: [] },
        "women-tour": { name: "Tour", gender: "women", genderLabel: "Women", players: [] }
    }
};
