var courtsData = [
    {
        id: "dordoi-tennis",
        name: "Dordoi Tennis Club",
        photo: "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
            "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
            "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"
        ],
        type: "indoor",
        surface: "Hard",
        courtsCount: 4,
        rating: 4.8,
        price: 1500,
        address: "138 Zhukeev-Pudovkin St, Bishkek",
        lat: 42.8746,
        lng: 74.5698,
        phone: "+996 555 100 200",
        shortDesc: "Modern indoor tennis club with 4 hard courts. Official KSLT Pro-Masters tournament venue.",
        description: "Dordoi Tennis Club is Bishkek's flagship tennis club and the official venue for KSLT Pro-Masters tournaments. The complex features 4 professional hard courts with modern DecoTurf surface. The club offers year-round training with indoor climate-controlled courts, professional lighting, spacious locker rooms, and a lounge area.",
        amenities: ["Indoor courts", "Climate control", "Locker rooms", "Showers", "Parking", "Racket rental", "Pro-shop", "Café"],
        schedule: {
            "Weekdays (morning)": "06:00 – 12:00 — 1,200 KGS/hr",
            "Weekdays (afternoon)": "12:00 – 17:00 — 1,500 KGS/hr",
            "Weekdays (evening)": "17:00 – 22:00 — 2,000 KGS/hr",
            "Weekends": "08:00 – 22:00 — 1,800 KGS/hr"
        },
        partner: true
    },
    {
        id: "alatoo-tennis",
        name: "Ala-Too Tennis Center",
        photo: "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
            "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
            "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80"
        ],
        type: "outdoor",
        surface: "Clay",
        courtsCount: 6,
        rating: 4.6,
        price: 800,
        address: "125/1 Toktogul St, Bishkek",
        lat: 42.8700,
        lng: 74.5900,
        phone: "+996 555 200 300",
        shortDesc: "Cozy clay court center with 6 outdoor courts. Perfect for summer season and kids' training.",
        description: "Ala-Too Tennis Center is located in the heart of Bishkek and offers 6 European-standard clay courts. The center is especially popular during summer thanks to its shaded grounds and comfortable atmosphere. KSLT Futures and Tour tournaments are held here, along with children's training sessions led by experienced coaches.",
        amenities: ["Outdoor courts", "Lighting", "Locker rooms", "Parking", "Playground", "Racket rental"],
        schedule: {
            "Weekdays (morning)": "07:00 – 12:00 — 600 KGS/hr",
            "Weekdays (afternoon)": "12:00 – 17:00 — 800 KGS/hr",
            "Weekdays (evening)": "17:00 – 21:00 — 1,000 KGS/hr",
            "Weekends": "08:00 – 21:00 — 900 KGS/hr"
        },
        partner: true
    },
    {
        id: "spartak-tennis",
        name: "Spartak Fitness & Tennis",
        photo: "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80",
            "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80",
            "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"
        ],
        type: "indoor",
        surface: "Hard",
        courtsCount: 2,
        rating: 4.5,
        price: 1200,
        address: "75 Manas Ave, Bishkek",
        lat: 42.8650,
        lng: 74.5800,
        phone: "+996 555 300 400",
        shortDesc: "Fitness center with 2 indoor hard courts. Gym, pool, and tennis all in one place.",
        description: "Spartak Fitness & Tennis is a multifunctional sports complex combining a fitness gym, pool, and 2 indoor tennis courts. The perfect choice for players who want to combine tennis with general fitness. KSLT fitness coach Dmitriy Volkov works here. Courts are available year-round.",
        amenities: ["Indoor courts", "Gym", "Pool", "Sauna", "Locker rooms", "Parking", "Café"],
        schedule: {
            "Weekdays (morning)": "06:00 – 12:00 — 1,000 KGS/hr",
            "Weekdays (afternoon)": "12:00 – 17:00 — 1,200 KGS/hr",
            "Weekdays (evening)": "17:00 – 22:00 — 1,500 KGS/hr",
            "Weekends": "08:00 – 22:00 — 1,300 KGS/hr"
        },
        partner: true
    },
    {
        id: "bishkek-park",
        name: "Bishkek Park Tennis",
        photo: "https://images.unsplash.com/photo-1581092160607-ee67df30d1ea?w=800&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1581092160607-ee67df30d1ea?w=800&q=80",
            "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80",
            "https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=800&q=80"
        ],
        type: "outdoor",
        surface: "Hard",
        courtsCount: 3,
        rating: 4.4,
        price: 700,
        address: "Panfilov Park, Bishkek",
        lat: 42.8760,
        lng: 74.6000,
        phone: "+996 555 400 500",
        shortDesc: "Outdoor hard courts in Panfilov Park. Budget-friendly option downtown with evening lighting.",
        description: "Bishkek Park Tennis features three outdoor hard courts located in the scenic Panfilov Park. An excellent budget option for recreational play and training. Courts are equipped with evening lighting for late play. KSLT Friendly category tournaments are regularly held here.",
        amenities: ["Outdoor courts", "Evening lighting", "Benches", "Nearby parking"],
        schedule: {
            "Weekdays": "07:00 – 21:00 — 700 KGS/hr",
            "Weekends": "08:00 – 21:00 — 800 KGS/hr",
            "Evening (with lights)": "19:00 – 21:00 — +200 KGS"
        },
        partner: false
    },
    {
        id: "silk-road-tennis",
        name: "Silk Road Tennis Academy",
        photo: "https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80",
        gallery: [
            "https://images.unsplash.com/photo-1530915534664-4ac6423816b7?w=800&q=80",
            "https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?w=800&q=80",
            "https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=800&q=80"
        ],
        type: "indoor",
        surface: "Hard",
        courtsCount: 3,
        rating: 4.7,
        price: 1800,
        address: "98a Akhunbaev St, Bishkek",
        lat: 42.8550,
        lng: 74.6100,
        phone: "+996 555 500 600",
        shortDesc: "Tennis academy with 3 indoor courts. Professional coaching programs and kids' school.",
        description: "Silk Road Tennis Academy is Bishkek's newest tennis complex with 3 state-of-the-art indoor hard courts. The academy specializes in professional tennis training for all ages. ITF-certified coaches work here, offering masterclasses and intensive programs. Official KSLT Masters tournament venue.",
        amenities: ["Indoor courts", "Climate control", "Video analysis", "Locker rooms", "Showers", "Pro-shop", "Parking", "Kids' school"],
        schedule: {
            "Weekdays (morning)": "06:00 – 12:00 — 1,500 KGS/hr",
            "Weekdays (afternoon)": "12:00 – 17:00 — 1,800 KGS/hr",
            "Weekdays (evening)": "17:00 – 22:00 — 2,200 KGS/hr",
            "Weekends": "08:00 – 22:00 — 2,000 KGS/hr"
        },
        partner: true
    }
];

window.courtsLabels = {
    heroTitle: "KSLT Courts",
    heroSubtitle: "Tennis courts in Bishkek for training and tournaments",
    filterAll: "All",
    filterIndoor: "Indoor",
    filterOutdoor: "Outdoor",
    filterClay: "Clay",
    filterHard: "Hard",
    courts: "courts",
    rating: "rating",
    priceFrom: "from",
    priceCurrency: "KGS/hr",
    detailsBtn: "Learn more",
    bookBtn: "Book a court",
    aboutTitle: "About the venue",
    amenitiesTitle: "Amenities",
    scheduleTitle: "Schedule & Pricing",
    locationTitle: "Location",
    galleryTitle: "Gallery",
    ctaTitle: "Book a Court",
    ctaText: "Register to book courts online and get KSLT member discounts",
    ctaBtn: "Sign Up",
    backBtn: "All courts",
    partnerBadge: "KSLT Partner",
    surface: "Surface",
    phone: "Phone",
    filterType: "Court type",
    filterSurface: "Surface",
    filterCarpet: "Carpet"
};
