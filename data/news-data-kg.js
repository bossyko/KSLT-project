// ========================================
// NEWS ARTICLE DATA — KG (Kyrgyz)
// ========================================

window.newsLabels = {
    backToNews: "Жаңылыктарга кайтуу",
    openPoster: "Толук афиша",
    readTime: "мин окуу",
    relatedTitle: "Байланышкан макалалар",
    reactionsTitle: "Макаланы баалаңыз",
    tagsTitle: "Тегдер",
    notFoundTitle: "Макала табылган жок",
    notFoundText: "Сиз издеген макала жок же өчүрүлгөн.",
    notFoundBtn: "Башкы бетке",
    pollVote: "Добуш берүү",
    pollVoted: "Сиз добуш бердиңиз!",
    pollTotal: "добуш",
    sponsorsTitle: "Өнөктөштөр жана демөөрчүлөр",
    sponsorsGeneral: "Башкы демөөрчү",
    newsListTitle: "Жаңылыктар",
    newsListSubtitle: "Кыргызстандагы теннис дүйнөсүнөн акыркы жаңылыктар",
    featuredLabel: "Башкы",
    readMore: "Толугураак окуу",
    allArticles: "Бардык макалалар",
    filterAll: "Баары",
    searchPlaceholder: "Жаңылыктарды издөө..."
};

var newsArticleData = {

    "asanov-wins-masters": {
        slug: "asanov-wins-masters",
        title: "Асанов Masters #2де жеңишке жетти",
        subtitle: "Драмалуу үч сеттик финал жаңы чемпионду аныктады",
        category: "results",
        categoryLabel: "Репортаж",
        date: "14 Февраль 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Masters сериясынын экинчи этабы чыныгы драма менен аяктады. Тимур Асанов финалда Руслан Маматовду жеңип, матч боюнча 0:1 сеттик артта калуудан кайтып келди." },
            { type: "heading", level: 2, text: "Финалга жол" },
            { type: "paragraph", text: "Асанов топтук этапты бир да сет утулбай ишенимдүү өттү. Жарым финалда тажрыйбалуу Данияр Сыдыков менен жолугуп, эки партияда жеңди — 6:3, 6:4." },
            { type: "image", src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80", caption: "Тимур Асанов Masters #2 финалындагы жеңишин майрамдоодо", alt: "Теннисчи жеңишин майрамдоодо" },
            { type: "heading", level: 2, text: "Финал: чектеги үч сет" },
            { type: "paragraph", text: "Биринчи сет Маматовдо калды — 6:4. Анын күчтүү подачасы жана так соккулары Асановго мүмкүнчүлүк берген жок. Бирок экинчи сетте Тимур тактикасын өзгөртүп, тордо көбүрөөк ойной баштады — 6:3." },
            { type: "quote", text: "Экинчи сетти утулсам, баары бүтөрүн билчүмүн. Тобокелге барып, оюнду өзгөртүшүм керек болду.", author: "Тимур Асанов", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", country: "" },
            { type: "paragraph", text: "Чечүүчү үчүнчү сет чыныгы триллер болду. Эсеп 5:5ке чейин упай менен жүрдү, андан кийин Асанов брейк жасап, матчты ишенимдүү бүтүрдү — 7:5." },
            { type: "stats", items: [
                { label: "Эйстер", value: "12" },
                { label: "Подача", value: "78%" },
                { label: "Виннерлер", value: "34" },
                { label: "Узактыгы", value: "2с 47м" }
            ]},
            { type: "heading", level: 2, text: "Рейтингдик натыйжалар" },
            { type: "paragraph", text: "Жеңиш Асановго 500 рейтинг упайын алып келди жана аны KSLT жалпы эсебинде 2-орунга көтөрдү." },
            { type: "list", items: [
                "Тимур Асанов — +500 упай (рейтингде 2-орун)",
                "Руслан Маматов — +300 упай (4-орун)",
                "Данияр Сыдыков — +150 упай (жарым финалист)",
                "Алмаз Бейшеналиев — +150 упай (жарым финалист)"
            ]},
            { type: "poll", question: "Кийинки Masters #3тө ким жеңет?", options: ["Тимур Асанов", "Руслан Маматов", "Алмаз Бейшеналиев", "Башка оюнчу"] }
        ],
        tags: [
            { label: "Masters", slug: "masters" },
            { label: "Финал", slug: "final" },
            { label: "Асанов", slug: "asanov" },
            { label: "Маматов", slug: "mamatov" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["interview-beishenaliev", "season-2026-preview"]
    },

    "interview-beishenaliev": {
        slug: "interview-beishenaliev",
        title: "Алмаз Бейшеналиев: «Максат — биринчи орун»",
        subtitle: "KSLT рейтинг лидери менен эксклюзивдүү интервью",
        category: "interview",
        categoryLabel: "Интервью",
        date: "10 Февраль 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1531315396756-905d68d21b56?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Алмаз Бейшеналиев — 2025-жылдын башынан бери KSLT рейтингинин талашсыз лидери. Биз аны менен сезон пландары, машыгуулар жана Кыргызстандагы теннистин өнүгүшү жөнүндө сүйлөштүк." },
            { type: "heading", level: 2, text: "Учурдагы сезон жөнүндө" },
            { type: "quote", text: "Бул сезон мен үчүн өзгөчө. Атаандаштык бир нече эсе өстү — ар бир мелдеш финалдай. Жаш балдар кысып жатышат, бул эң сонун мотивация.", author: "Алмаз Бейшеналиев", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80", country: "" },
            { type: "paragraph", text: "Бейшеналиев теннис менен 15 жашында алектене баштаган — профессионал спорт үчүн кеч, бирок анын таланты жана эмгекчилдиги аны өлкөнүн жөнөкөй теннисинин чокусуна тез алып чыккан." },
            { type: "heading", level: 2, text: "Машыгуу процесси" },
            { type: "paragraph", text: "Алмаз жумасына 5 жолу 2-3 сааттан машыгат. Корттон тышкары, ал физикалык даярдыкка жана оюндун менталдык тарабына чоң көңүл бурат." },
            { type: "stats", items: [
                { label: "Машыгуу/жума", value: "5" },
                { label: "Корттогу саат", value: "12" },
                { label: "KSLT титулдары", value: "8" },
                { label: "Жеңиш пайызы", value: "87%" }
            ]},
            { type: "image", src: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80", caption: "Алмаз Dordoi Tennis Clubда машыгууда", alt: "Теннисчи машыгууда" }
        ],
        tags: [
            { label: "Интервью", slug: "interview" },
            { label: "Бейшеналиев", slug: "beishenaliev" },
            { label: "Рейтинг", slug: "ranking" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "season-2026-preview"]
    },

    "season-2026-preview": {
        slug: "season-2026-preview",
        title: "2026-сезон: бизди эмне күтүп жатат",
        subtitle: "Алдыдагы мелдештер жана KSLT жаңылыктарынын обзору",
        category: "announcement",
        categoryLabel: "Жарыялоо",
        date: "5 Февраль 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1529926706528-db9e5010cd3e?w=1920&q=80",
        content: [
            { type: "paragraph", text: "2026-сезон KSLT тарыхындагы эң масштабдуу болуп калууга убада берет. Кеңейтилген мелдеш календары, жаңы категориялар жана жакшыртылган рейтинг системасы." },
            { type: "heading", level: 2, text: "Мелдеш календары" },
            { type: "paragraph", text: "Бул сезондо 12 мелдеш пландаштырылган — өткөн жылга караганда 4кө көп. Сезон январда башталып, ноябрга чейин созулат." },
            { type: "stats", items: [
                { label: "Мелдештер", value: "12" },
                { label: "Категориялар", value: "4" },
                { label: "Сыйлык фонду", value: "500K сом" },
                { label: "Оюнчулар", value: "60+" }
            ]}
        ],
        tags: [
            { label: "Жарыялоо", slug: "announcement" },
            { label: "Сезон 2026", slug: "season-2026" },
            { label: "Календарь", slug: "calendar" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "new-courts-dordoi": {
        slug: "new-courts-dordoi",
        title: "Dordoi Tennis Club жаңы корттор ачат",
        subtitle: "Кечки машыгуулар үчүн жарыктандыруусу бар эки хард корт",
        category: "announcement",
        categoryLabel: "Жарыялоо",
        date: "1 Февраль 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Dordoi Tennis Club инфраструктурасын кеңейтүүдө. Профессионал жарыктандыруусу бар эки жаңы хард корт оюнчуларга кечки убакта машыгууга мүмкүнчүлүк берет." },
            { type: "heading", level: 2, text: "Корттордун мүнөздөмөлөрү" },
            { type: "stats", items: [
                { label: "Капламасы", value: "Hard" },
                { label: "Жарыктандыруу", value: "LED" },
                { label: "Өлчөмү", value: "23x11м" },
                { label: "Ачылышы", value: "Март" }
            ]},
            { type: "paragraph", text: "Корттор ITF стандарттарына ылайык курулган жана 2026-жылдын мартынан ижарага жеткиликтүү болот." }
        ],
        tags: [
            { label: "Корттор", slug: "courts" },
            { label: "Dordoi", slug: "dordoi" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "asanov-wins-masters"]
    },

    "sydykov-comeback": {
        slug: "sydykov-comeback",
        title: "Сыдыков жаракаттан кийин кайтып келди",
        subtitle: "Данияр эки айлык калыбына келтирүүдөн кийин Challenger #2ге даяр",
        category: "results",
        categoryLabel: "Репортаж",
        date: "28 Январь 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=1920&q=80",
        content: [
            { type: "paragraph", text: "KSLT рейтингинде 3-орунду ээлеген Данияр Сыдыков кортко кайтканын жарыялады. Masters #1де алган тизе жаракаты аны эки ай мелдештерден четтетти." },
            { type: "quote", text: "Тенниссиз эки ай кыйноо болду. Бирок мен бул убакытты физика жана менталдык даярдык менен иштөө үчүн колдондум.", author: "Данияр Сыдыков", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80", country: "" },
            { type: "paragraph", text: "Кайткандан кийинки биринчи мелдеш марттагы Challenger #2 болот." }
        ],
        tags: [
            { label: "Сыдыков", slug: "sydykov" },
            { label: "Кайтуу", slug: "comeback" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "junior-program-launch": {
        slug: "junior-program-launch",
        title: "KSLT жаштар программасын ишке киргизди",
        subtitle: "8ден 14 жашка чейинки балдар үчүн акысыз машыгуулар",
        category: "announcement",
        categoryLabel: "Жарыялоо",
        date: "20 Январь 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1551773188-d63e5d36860d?w=1920&q=80",
        content: [
            { type: "paragraph", text: "KSLT демөөрчүлөрдүн колдоосу менен балдар үчүн акысыз теннис окутуу программасын ишке киргизет. Сабактар Dordoi Tennis Club корттарында жумасына үч жолу болот." },
            { type: "heading", level: 2, text: "Программанын чоо-жайы" },
            { type: "list", items: [
                "Жашы: 8-14 жаш",
                "Графиги: Дш/Шр/Жм, 16:00-17:30",
                "Инвентарь берилет",
                "Кабыл алуу: топко 20 балага чейин",
                "Башталышы: 2026-жылдын 1-марты"
            ]},
            { type: "paragraph", text: "Каттоо үчүн KSLT сайтындагы форманы толтуруңуз. Орундар чектелүү." }
        ],
        tags: [
            { label: "Жаштар", slug: "juniors" },
            { label: "Окутуу", slug: "training" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "new-courts-dordoi"]
    },

    "doubles-tournament-results": {
        slug: "doubles-tournament-results",
        title: "Биринчи жуптук мелдеш: натыйжалар",
        subtitle: "Асанов жана Бейшеналиев — жеңилгис дуэт",
        category: "results",
        categoryLabel: "Репортаж",
        date: "15 Январь 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1560012057-4372e14c5085?w=1920&q=80",
        content: [
            { type: "paragraph", text: "KSLT тарыхындагы биринчи жуптук мелдеш Асанов/Бейшеналиев дуэтинин ишенимдүү жеңиши менен аяктады. Сегиз жуп эң мыкты тандем наамы үчүн күрөштү." },
            { type: "stats", items: [
                { label: "Жуптар", value: "8" },
                { label: "Матчтар", value: "12" },
                { label: "Формат", value: "Single Elim" },
                { label: "Сыйлык", value: "50K сом" }
            ]},
            { type: "paragraph", text: "Финалда Асанов/Бейшеналиев Маматов/Сыдыков жубун 6:4, 7:5 эсеби менен утту." }
        ],
        tags: [
            { label: "Жуптук", slug: "doubles" },
            { label: "Мелдеш", slug: "tournament" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "coaching-masterclass": {
        slug: "coaching-masterclass",
        title: "Казакстандык машыктыруучунун мастер-классы",
        subtitle: "Ержан Утепов KSLT оюнчулары үчүн эки күндүк интенсив өткөрдү",
        category: "interview",
        categoryLabel: "Интервью",
        date: "10 Январь 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1544298621-a21e4e4cb0a3?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Белгилүү казакстандык машыктыруучу Ержан Утепов Бишкекке келип, KSLT мыкты 15 оюнчусу үчүн эки күндүк мастер-класс өткөрдү." },
            { type: "quote", text: "KSLT оюнчуларынын деңгээли мени жагымдуу таң калтырды. Машыгууга туура мамиле менен бир-эки жылдан кийин бул жерде эл аралык деңгээлдеги оюнчулар пайда болушу мүмкүн.", author: "Ержан Утепов", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", country: "" },
            { type: "paragraph", text: "Мастер-класстын жыйынтыгы боюнча Утепов квартал сайын келүүгө макул болду." }
        ],
        tags: [
            { label: "Машыгуу", slug: "coaching" },
            { label: "Мастер-класс", slug: "masterclass" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["interview-beishenaliev", "junior-program-launch"]
    },

    "ranking-system-update": {
        slug: "ranking-system-update",
        title: "KSLTнын жаңы рейтинг формуласы",
        subtitle: "Жаңыланган упай эсептөө системасы кандай иштейт",
        category: "announcement",
        categoryLabel: "Жарыялоо",
        date: "5 Январь 2026",
        author: "KSLT Медиа",
        heroImage: "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1920&q=80",
        content: [
            { type: "paragraph", text: "2026-сезондон баштап KSLT жаңыланган рейтинг формуласына өтөт. Негизги өзгөрүү — упай ыйгарууда атаандаштын күчүн эсепке алуу." },
            { type: "heading", level: 2, text: "Негизги өзгөрүүлөр" },
            { type: "list", items: [
                "Топ-5 оюнчуну жеңгени үчүн бонус: +25%",
                "Топ-10 оюнчуну жеңгени үчүн бонус: +15%",
                "Мелдешке катышкандыгы үчүн упайлар",
                "2 айдан ашык активдүү болбогондугу үчүн упай азаюу",
                "Жуптук разряд үчүн өзүнчө рейтинг"
            ]},
            { type: "paragraph", text: "Жаңы система Challenger #1ден күчүнө кирет жана бүт сезон бою иштейт." }
        ],
        tags: [
            { label: "Рейтинг", slug: "ranking" },
            { label: "Эрежелер", slug: "rules" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "asanov-wins-masters"]
    }
};
