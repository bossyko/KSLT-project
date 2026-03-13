// ========================================
// NEWS ARTICLE DATA — EN
// ========================================

window.newsLabels = {
    backToNews: "Back to News",
    readTime: "min read",
    relatedTitle: "Related Articles",
    reactionsTitle: "React to this article",
    tagsTitle: "Tags",
    notFoundTitle: "Article Not Found",
    notFoundText: "The article you are looking for does not exist or has been removed.",
    notFoundBtn: "Back to Home",
    pollVote: "Vote",
    pollVoted: "You voted!",
    pollTotal: "total votes",
    sponsorsTitle: "Partners & Sponsors",
    sponsorsGeneral: "General Sponsor",
    newsListTitle: "News",
    newsListSubtitle: "Latest tennis news from Kyrgyzstan",
    featuredLabel: "Featured",
    readMore: "Read article",
    allArticles: "All Articles",
    filterAll: "All",
    searchPlaceholder: "Search news..."
};

var newsArticleData = {

    "asanov-wins-masters": {
        slug: "asanov-wins-masters",
        title: "Asanov Wins Masters #2",
        subtitle: "A dramatic three-set final crowns a new champion",
        category: "results",
        categoryLabel: "Results",
        date: "February 14, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1920&q=80",
        content: [
            { type: "paragraph", text: "The second stage of the Masters series ended in true drama. Timur Asanov claimed a hard-fought victory over Ruslan Mamatov in the final, coming back from a set down. The packed stands witnessed one of the best finals in KSLT history." },
            { type: "heading", level: 2, text: "Road to the Final" },
            { type: "paragraph", text: "Asanov cruised through the group stage without dropping a set. In the semifinals, he faced experienced Daniyar Sydykov and won in straight sets — 6:3, 6:4. Mamatov, on his part, knocked out the tournament favorite Almaz Beishenaliev in a tense three-set semifinal." },
            { type: "image", src: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80", caption: "Timur Asanov celebrates his Masters #2 victory", alt: "Tennis player celebrating" },
            { type: "heading", level: 2, text: "The Final: Three Sets on the Edge" },
            { type: "paragraph", text: "The first set went to Mamatov — 6:4. His powerful serve and precise baseline shots gave Asanov no chances. However, in the second set, Timur changed his tactics, started coming to the net more often, and seized the initiative — 6:3." },
            { type: "quote", text: "I knew that if I lost the second set, it would be over. I had to take risks and change my game. My coach suggested coming to the net — and it worked.", author: "Timur Asanov", photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&q=80", country: "" },
            { type: "paragraph", text: "The decisive third set was a real thriller. The score went point by point to 5:5, after which Asanov made a break and confidently served out the match — 7:5." },
            { type: "stats", items: [
                { label: "Aces", value: "12" },
                { label: "Serve %", value: "78%" },
                { label: "Winners", value: "34" },
                { label: "Duration", value: "2h 47m" }
            ]},
            { type: "heading", level: 2, text: "Ranking Implications" },
            { type: "paragraph", text: "The victory earned Asanov 500 ranking points and moved him to 2nd place in the overall KSLT standings. Mamatov, despite the loss, strengthened his position in the top 5." },
            { type: "list", items: [
                "Timur Asanov — +500 points (2nd in rankings)",
                "Ruslan Mamatov — +300 points (4th place)",
                "Daniyar Sydykov — +150 points (semifinalist)",
                "Almaz Beishenaliev — +150 points (semifinalist)"
            ]},
            { type: "poll", question: "Who will win the next Masters #3?", options: ["Timur Asanov", "Ruslan Mamatov", "Almaz Beishenaliev", "Other player"] }
        ],
        tags: [
            { label: "Masters", slug: "masters" },
            { label: "Final", slug: "final" },
            { label: "Asanov", slug: "asanov" },
            { label: "Mamatov", slug: "mamatov" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["interview-beishenaliev", "season-2026-preview"]
    },

    "interview-beishenaliev": {
        slug: "interview-beishenaliev",
        title: "Almaz Beishenaliev: 'The Goal Is Number One'",
        subtitle: "Exclusive interview with the KSLT ranking leader",
        category: "interview",
        categoryLabel: "Interview",
        date: "February 10, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1531315396756-905d68d21b56?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Almaz Beishenaliev has been the undisputed leader of the KSLT rankings since early 2025. We spoke with him about his plans for the season, training, and the development of tennis in Kyrgyzstan." },
            { type: "heading", level: 2, text: "On the Current Season" },
            { type: "quote", text: "This season is special for me. The competition has grown tremendously — every tournament feels like a final. Young players are pushing hard, and that's a great motivator.", author: "Almaz Beishenaliev", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80", country: "" },
            { type: "paragraph", text: "Beishenaliev started playing tennis at 15 — late by professional standards, but his talent and dedication quickly propelled him to the top of amateur tennis in the country." },
            { type: "heading", level: 2, text: "Training Routine" },
            { type: "paragraph", text: "Almaz trains 5 times a week for 2-3 hours. Besides court practice, he pays significant attention to physical conditioning and the mental side of the game." },
            { type: "stats", items: [
                { label: "Sessions/week", value: "5" },
                { label: "Court hours", value: "12" },
                { label: "KSLT titles", value: "8" },
                { label: "Win rate", value: "87%" }
            ]},
            { type: "image", src: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80", caption: "Almaz training at Dordoi Tennis Club", alt: "Tennis player training" },
            { type: "heading", level: 2, text: "On Tennis Development in KR" },
            { type: "quote", text: "KSLT is doing tremendous work. Three years ago, we played with four people on one court. Now the community has over 50 active players with regular tournaments. It's incredible growth.", author: "Almaz Beishenaliev", photo: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&q=80", country: "" },
            { type: "heading", level: 3, text: "Tips for Beginners" },
            { type: "list", items: [
                "Find a good coach from the very beginning",
                "Never skip warm-up — injuries set you back months",
                "Play against stronger opponents",
                "Work on your serve — it's the most underrated shot",
                "Participate in KSLT tournaments — competitive experience is priceless"
            ]},
            { type: "poll", question: "Which aspect of the game is most important?", options: ["Serve", "Forehand", "Physical fitness", "Psychology"] }
        ],
        tags: [
            { label: "Interview", slug: "interview" },
            { label: "Beishenaliev", slug: "beishenaliev" },
            { label: "Rankings", slug: "ranking" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "season-2026-preview"]
    },

    "season-2026-preview": {
        slug: "season-2026-preview",
        title: "Season 2026: What to Expect",
        subtitle: "A preview of upcoming tournaments and KSLT innovations",
        category: "announcement",
        categoryLabel: "Announcement",
        date: "February 5, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1529926706528-db9e5010cd3e?w=1920&q=80",
        content: [
            { type: "paragraph", text: "The 2026 season promises to be the most ambitious in KSLT history. An expanded tournament calendar, new categories, and an improved ranking system — here's everything you need to know." },
            { type: "heading", level: 2, text: "Tournament Calendar" },
            { type: "paragraph", text: "This season features 12 tournaments — 4 more than last year. The season kicked off in January and will run through November. The main event — the Grand Finals in October — will feature the top 8 players by ranking." },
            { type: "stats", items: [
                { label: "Tournaments", value: "12" },
                { label: "Categories", value: "4" },
                { label: "Prize pool", value: "500K KGS" },
                { label: "Players", value: "60+" }
            ]},
            { type: "heading", level: 2, text: "New Categories" },
            { type: "paragraph", text: "In addition to the familiar Masters and Challenger, this year introduces Futures tournaments — for beginner players. This will allow newcomers to gain competitive experience without the pressure of facing strong opponents." },
            { type: "image", src: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=800&q=80", caption: "New Dordoi Tennis Club courts ready for the season", alt: "Tennis courts" },
            { type: "heading", level: 2, text: "Updated Rankings" },
            { type: "paragraph", text: "The ranking system has been refined. Points are now distributed more balanced: not only the result matters, but also the opponent's strength. This will make the fight for top positions even more exciting." },
            { type: "list", items: [
                "January–March: Futures #1–3, Challenger #1",
                "April–June: Masters #1–2, Challenger #2–3",
                "July–September: Masters #3–4, Pro-Masters #1",
                "October: Grand Finals (top 8 players)",
                "November: Exhibition Match + awards ceremony"
            ]},
            { type: "heading", level: 2, text: "How to Join" },
            { type: "paragraph", text: "Tournament registration is open to everyone. To participate, simply create an account on the KSLT website and apply for the nearest tournament. We welcome both experienced players and beginners — there's a suitable category for everyone." },
            { type: "poll", question: "Which tournament are you most excited about?", options: ["Masters #3", "Pro-Masters", "Grand Finals"] }
        ],
        tags: [
            { label: "Announcement", slug: "announcement" },
            { label: "Season 2026", slug: "season-2026" },
            { label: "Calendar", slug: "calendar" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "new-courts-dordoi": {
        slug: "new-courts-dordoi",
        title: "Dordoi Tennis Club Opens New Courts",
        subtitle: "Two hard courts with lighting for evening practice",
        category: "announcement",
        categoryLabel: "Announcement",
        date: "February 1, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1622163642998-1ea32b0bbc67?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Dordoi Tennis Club is expanding its infrastructure. Two new hard courts with professional LED lighting will allow players to train in the evening, which is especially relevant for working athletes." },
            { type: "heading", level: 2, text: "Court Specifications" },
            { type: "stats", items: [
                { label: "Surface", value: "Hard" },
                { label: "Lighting", value: "LED" },
                { label: "Size", value: "23x11m" },
                { label: "Opening", value: "March" }
            ]},
            { type: "paragraph", text: "The courts are built to ITF standards and will be available for rental from March 2026. KSLT tournament participants will get booking priority." }
        ],
        tags: [
            { label: "Courts", slug: "courts" },
            { label: "Dordoi", slug: "dordoi" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "asanov-wins-masters"]
    },

    "sydykov-comeback": {
        slug: "sydykov-comeback",
        title: "Sydykov Returns After Injury",
        subtitle: "Daniyar is ready for Challenger #2 after two months of recovery",
        category: "results",
        categoryLabel: "Results",
        date: "January 28, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1542144582-1ba00456b5e3?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Daniyar Sydykov, ranked 3rd in KSLT, has announced his return to the court. A knee injury sustained at Masters #1 forced him to miss two months of competition." },
            { type: "quote", text: "Two months without tennis was torture. But I used the time to work on my fitness and mental game. I feel stronger than before the injury.", author: "Daniyar Sydykov", photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&q=80", country: "" },
            { type: "paragraph", text: "Sydykov's first tournament back will be Challenger #2 in March. Many experts consider him the top favorite for this event." }
        ],
        tags: [
            { label: "Sydykov", slug: "sydykov" },
            { label: "Comeback", slug: "comeback" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "junior-program-launch": {
        slug: "junior-program-launch",
        title: "KSLT Launches Junior Program",
        subtitle: "Free training sessions for kids aged 8 to 14",
        category: "announcement",
        categoryLabel: "Announcement",
        date: "January 20, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1551773188-d63e5d36860d?w=1920&q=80",
        content: [
            { type: "paragraph", text: "With sponsor support, KSLT is launching a free tennis training program for children. Sessions will be held at Dordoi Tennis Club courts three times per week." },
            { type: "heading", level: 2, text: "Program Details" },
            { type: "list", items: [
                "Ages: 8-14 years",
                "Schedule: Mon/Wed/Fri, 4:00-5:30 PM",
                "Equipment provided",
                "Enrollment: up to 20 kids per group",
                "Start date: March 1, 2026"
            ]},
            { type: "paragraph", text: "To register, fill out the form on the KSLT website. Spots are limited." }
        ],
        tags: [
            { label: "Juniors", slug: "juniors" },
            { label: "Training", slug: "training" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "new-courts-dordoi"]
    },

    "doubles-tournament-results": {
        slug: "doubles-tournament-results",
        title: "First Doubles Tournament: Results",
        subtitle: "Asanov and Beishenaliev — an unbeatable duo",
        category: "results",
        categoryLabel: "Results",
        date: "January 15, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1560012057-4372e14c5085?w=1920&q=80",
        content: [
            { type: "paragraph", text: "The first-ever KSLT doubles tournament ended with a confident victory by the Asanov/Beishenaliev duo. Eight pairs competed for the title of best tandem." },
            { type: "stats", items: [
                { label: "Pairs", value: "8" },
                { label: "Matches", value: "12" },
                { label: "Format", value: "Single Elim" },
                { label: "Prize", value: "50K KGS" }
            ]},
            { type: "paragraph", text: "In the final, Asanov/Beishenaliev defeated Mamatov/Sydykov 6:4, 7:5. The doubles format has added a new dimension to the Kyrgyzstan tennis community." }
        ],
        tags: [
            { label: "Doubles", slug: "doubles" },
            { label: "Tournament", slug: "tournament" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["asanov-wins-masters", "interview-beishenaliev"]
    },

    "coaching-masterclass": {
        slug: "coaching-masterclass",
        title: "Masterclass by Kazakh Coach",
        subtitle: "Yerzhan Utepov held a two-day intensive for KSLT players",
        category: "interview",
        categoryLabel: "Interview",
        date: "January 10, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1544298621-a21e4e4cb0a3?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Renowned Kazakh coach Yerzhan Utepov visited Bishkek and held a two-day masterclass for the top 15 KSLT players. The focus was on serve technique and hard court tactics." },
            { type: "quote", text: "The level of KSLT players pleasantly surprised me. With the right training approach, in a couple of years there could be players of international caliber here.", author: "Yerzhan Utepov", photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&q=80", country: "" },
            { type: "paragraph", text: "Following the masterclass, Utepov agreed to quarterly visits and will consult the KSLT coaching staff on an ongoing basis." }
        ],
        tags: [
            { label: "Coaching", slug: "coaching" },
            { label: "Masterclass", slug: "masterclass" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["interview-beishenaliev", "junior-program-launch"]
    },

    "ranking-system-update": {
        slug: "ranking-system-update",
        title: "New KSLT Ranking Formula",
        subtitle: "How the updated points system works",
        category: "announcement",
        categoryLabel: "Announcement",
        date: "January 5, 2026",
        author: "KSLT Media",
        heroImage: "https://images.unsplash.com/photo-1460518451285-97b6aa326961?w=1920&q=80",
        content: [
            { type: "paragraph", text: "Starting from the 2026 season, KSLT is switching to an updated ranking formula. The main change is accounting for opponent strength when awarding points. Beating a top-5 player now earns bonus points." },
            { type: "heading", level: 2, text: "Key Changes" },
            { type: "list", items: [
                "Bonus for beating a top-5 player: +25%",
                "Bonus for beating a top-10 player: +15%",
                "Points for tournament participation (even with first-round loss)",
                "Point decay for inactivity over 2 months",
                "Separate doubles ranking"
            ]},
            { type: "paragraph", text: "The new system takes effect from Challenger #1 and will run the entire season. Detailed points tables are available in the Rules section on the website." }
        ],
        tags: [
            { label: "Rankings", slug: "ranking" },
            { label: "Rules", slug: "rules" }
        ],
        reactions: { tennis: 0, fire: 0, clap: 0 },
        relatedSlugs: ["season-2026-preview", "asanov-wins-masters"]
    }
};
