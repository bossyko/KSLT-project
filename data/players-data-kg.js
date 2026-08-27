// ========================================
// Названия категорий рейтинга — запас на случай, когда база
// недоступна. Раньше здесь лежали ещё и 135 выдуманных игроков со
// счётом и формой: код их не читал, а при сбое они могли всплыть
// на странице как настоящие
// ========================================

var playersData = {
    categories: {
        "men-promasters": { name: "Pro-Masters", gender: "men", genderLabel: "Эркектер", players: [] },
        "men-masters": { name: "Masters", gender: "men", genderLabel: "Эркектер", players: [] },
        "men-futures": { name: "Futures", gender: "men", genderLabel: "Эркектер", players: [] },
        "men-challenger": { name: "Challenger", gender: "men", genderLabel: "Эркектер", players: [] },
        "men-tour": { name: "Tour", gender: "men", genderLabel: "Эркектер", players: [] },
        "women-promasters": { name: "Pro-Masters", gender: "women", genderLabel: "Аялдар", players: [] },
        "women-masters": { name: "Masters", gender: "women", genderLabel: "Аялдар", players: [] },
        "women-challenger": { name: "Challenger", gender: "women", genderLabel: "Аялдар", players: [] },
        "women-tour": { name: "Tour", gender: "women", genderLabel: "Аялдар", players: [] }
    }
};
