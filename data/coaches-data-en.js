var coachesData = [
    {
        id: "asanov-azamat",
        name: "Azamat Asanov",
        photo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
        specialization: "Adults, individual",
        tags: ["adults", "individual"],
        experience: 12,
        students: 150,
        rating: 4.9,
        price: 2000,
        shortDesc: "ITF certified coach. Specializes in serve technique and singles tactics.",
        bio: "Azamat is one of the most experienced KSLT coaches with 12 years of experience. He holds ITF Level 2 certification and has worked with national team players. His methodology is based on an individual approach to each student with a focus on technique and tactical thinking. Among his students are prize-winners of national tournaments and top KSLT ranked players.",
        achievements: [
            "ITF Level 2 Certificate",
            "KSLT Coach of the Year 2025",
            "150+ students over career",
            "5 students in top-10 ranking"
        ],
        schedule: {
            "Mon": "08:00 – 12:00, 16:00 – 20:00",
            "Tue": "08:00 – 12:00, 16:00 – 20:00",
            "Wed": "08:00 – 12:00",
            "Thu": "08:00 – 12:00, 16:00 – 20:00",
            "Fri": "08:00 – 12:00, 16:00 – 20:00",
            "Sat": "09:00 – 14:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Timur K.", text: "Best coach in Bishkek! Went from Tour to Futures in 3 months. Azamat broke down my technique perfectly.", rating: 5 },
            { author: "Aidana M.", text: "Very patient and attentive coach. The approach is truly individual, sessions are always productive.", rating: 5 },
            { author: "Ruslan B.", text: "A true professional. My serve became much more stable after a month of training.", rating: 5 }
        ],
        court: "Dordoi Tennis Club"
    },
    {
        id: "petrova-elena",
        name: "Elena Petrova",
        photo: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop&crop=face",
        specialization: "Kids, group",
        tags: ["kids", "group"],
        experience: 8,
        students: 200,
        rating: 4.8,
        price: 1500,
        shortDesc: "Children's coach with a teaching degree. Group and individual lessons for kids aged 5-14.",
        bio: "Elena is a certified children's coach with a teaching degree and 8 years of experience working with young tennis players. Her methodology is built on a playful approach: children learn tennis through fun exercises and mini-tournaments. Elena knows how to connect with every child, developing not only technique but also a love for the sport.",
        achievements: [
            "Teaching degree, KNU",
            "Tennis 10s Certificate (ITF)",
            "200+ graduates",
            "Organizer of KSLT Kids tournaments"
        ],
        schedule: {
            "Mon": "10:00 – 13:00, 15:00 – 18:00",
            "Tue": "10:00 – 13:00, 15:00 – 18:00",
            "Wed": "10:00 – 13:00",
            "Thu": "10:00 – 13:00, 15:00 – 18:00",
            "Fri": "10:00 – 13:00, 15:00 – 18:00",
            "Sat": "10:00 – 14:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Maria S. (parent)", text: "My son has been training with Elena for a year. Incredible progress — from zero to competing in kids tournaments. He runs to practice with joy!", rating: 5 },
            { author: "Kubat D. (parent)", text: "Elena is a wonderful teacher. My daughter became more confident and disciplined. Highly recommend to all parents.", rating: 5 },
            { author: "Anara T.", text: "Group lessons are excellently organized. Kids both learn and have fun. Price is very affordable.", rating: 4 }
        ],
        court: "Ala-Too Tennis Center"
    },
    {
        id: "kim-sergey",
        name: "Sergey Kim",
        photo: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
        specialization: "Adults, advanced",
        tags: ["adults", "individual"],
        experience: 15,
        students: 100,
        rating: 4.9,
        price: 2500,
        shortDesc: "Former KR national team player. Coaches advanced players: tactics, mental preparation, tournament play.",
        bio: "Sergey is a former Kyrgyzstan national team player with 15 years of coaching experience. He specializes in working with advanced players who want to reach the next level. His program includes deep tactical analysis, mental tournament preparation, and work on game weaknesses. Many of his students are leaders in KSLT Pro-Masters and Masters categories.",
        achievements: [
            "Former Kyrgyzstan national team player",
            "ATP coaching license",
            "8 students in Pro-Masters",
            "KSLT consulting coach"
        ],
        schedule: {
            "Mon": "07:00 – 11:00, 17:00 – 20:00",
            "Tue": "07:00 – 11:00",
            "Wed": "07:00 – 11:00, 17:00 – 20:00",
            "Thu": "07:00 – 11:00",
            "Fri": "07:00 – 11:00, 17:00 – 20:00",
            "Sat": "08:00 – 12:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Daniyar A.", text: "Sergey completely rebuilt my game. With his help, I moved from Challenger to Pro-Masters in six months.", rating: 5 },
            { author: "Alexey V.", text: "Unique tactical perspective. After every session I understand the game deeper. Definitely the best for advanced players.", rating: 5 },
            { author: "Bekbolot M.", text: "Strict but fair. Results speak for themselves — three tournament wins this season.", rating: 5 }
        ],
        court: "Dordoi Tennis Club"
    },
    {
        id: "mamytova-aida",
        name: "Aida Mamytova",
        photo: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=400&h=400&fit=crop&crop=face",
        specialization: "Beginners, group",
        tags: ["adults", "group"],
        experience: 5,
        students: 120,
        rating: 4.7,
        price: 1200,
        shortDesc: "Specializes in teaching from scratch. Group lessons for adult beginners in a friendly atmosphere.",
        bio: "Aida is an energetic and positive coach specializing in teaching adults from scratch. Her group lessons are the perfect start for those who want to try tennis. Aida creates a friendly atmosphere where beginners feel comfortable and quickly master basic technique. Many of her students later join the KSLT ranking system.",
        achievements: [
            "KSLT Coach Certificate",
            "120+ beginner students",
            "Author of 'Tennis in 30 Days' program",
            "Best Beginner Coach 2025"
        ],
        schedule: {
            "Mon": "09:00 – 12:00, 18:00 – 20:00",
            "Tue": "09:00 – 12:00, 18:00 – 20:00",
            "Wed": "09:00 – 12:00",
            "Thu": "09:00 – 12:00, 18:00 – 20:00",
            "Fri": "09:00 – 12:00",
            "Sat": "10:00 – 14:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Gulnara K.", text: "Started tennis at 35, thought it was too late. Aida proved me wrong! After 2 months I'm already playing scored matches.", rating: 5 },
            { author: "Maxim O.", text: "Excellent group sessions. Fun, dynamic, and you actually learn. Price is affordable.", rating: 4 },
            { author: "Aizhan B.", text: "The most positive coach! Every session is a burst of energy and new skills.", rating: 5 }
        ],
        court: "Ala-Too Tennis Center"
    },
    {
        id: "volkov-dmitriy",
        name: "Dmitriy Volkov",
        photo: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
        specialization: "Fitness, rehabilitation",
        tags: ["adults", "individual"],
        experience: 10,
        students: 80,
        rating: 4.8,
        price: 1800,
        shortDesc: "Fitness coach for tennis players. Injury recovery programs and prevention.",
        bio: "Dmitriy is a certified fitness trainer and sports rehabilitation specialist with tennis specialization. His programs help players improve physical fitness, speed, and endurance on court. Dmitriy also works with tennis players after injuries, creating individual recovery programs. He collaborates with KSLT as the official fitness coach.",
        achievements: [
            "NSCA Certificate (sports conditioning)",
            "Specialization: sports rehabilitation",
            "Official KSLT fitness coach",
            "10 years in sports medicine"
        ],
        schedule: {
            "Mon": "07:00 – 10:00, 16:00 – 19:00",
            "Tue": "07:00 – 10:00, 16:00 – 19:00",
            "Wed": "07:00 – 10:00",
            "Thu": "07:00 – 10:00, 16:00 – 19:00",
            "Fri": "07:00 – 10:00, 16:00 – 19:00",
            "Sat": "09:00 – 13:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Erlan N.", text: "After a knee injury I thought tennis was over for me. Dmitriy got me back on court in 2 months.", rating: 5 },
            { author: "Artem S.", text: "Fitness with Dmitriy is next level. Became faster and more enduring, less tired in the 3rd set.", rating: 5 },
            { author: "Nurbek A.", text: "Professional approach to an athlete's body. Recommend to everyone who takes tennis seriously.", rating: 4 }
        ],
        court: "Spartak Fitness & Tennis"
    },
    {
        id: "tursunova-dinara",
        name: "Dinara Tursunova",
        photo: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?w=400&h=400&fit=crop&crop=face",
        specialization: "Teens, competitive prep",
        tags: ["kids", "individual"],
        experience: 7,
        students: 90,
        rating: 4.8,
        price: 1800,
        shortDesc: "Prepares teens aged 12-18 for tournaments. Technique, tactics, and psychological preparation.",
        bio: "Dinara specializes in preparing teenagers for competitive tennis. Her program includes not only technique and tactics, but also psychological preparation — handling pressure, concentration, and motivation. Many of her students successfully compete in junior tournaments and transition to adult KSLT categories. Dinara is an active KSLT player (Masters category).",
        achievements: [
            "Active KSLT Masters player",
            "Junior team coach",
            "12 students — junior tournament prize-winners",
            "Author of 'Tennis Psychology' course"
        ],
        schedule: {
            "Mon": "14:00 – 19:00",
            "Tue": "14:00 – 19:00",
            "Wed": "14:00 – 17:00",
            "Thu": "14:00 – 19:00",
            "Fri": "14:00 – 19:00",
            "Sat": "10:00 – 15:00",
            "Sun": "Day off"
        },
        reviews: [
            { author: "Asel T. (parent)", text: "My son became a different person after training with Dinara. Court confidence, discipline, two trophies this season!", rating: 5 },
            { author: "Bakyt E.", text: "Dinara understands teenagers like no one else. My son actually asks to go to practice for the first time.", rating: 5 },
            { author: "Kanybek I.", text: "Strong tournament preparation. My daughter learned to handle nerves and shows consistent results.", rating: 5 }
        ],
        court: "Dordoi Tennis Club"
    }
];

window.coachesLabels = {
    heroTitle: "KSLT Coaches",
    heroSubtitle: "Professional coaches for players of all levels",
    filterAll: "All",
    filterAdults: "Adults",
    filterKids: "Kids",
    filterGroup: "Group",
    filterIndividual: "Individual",
    experience: "years exp.",
    students: "students",
    rating: "rating",
    priceFrom: "from",
    priceCurrency: "KGS/hr",
    detailsBtn: "Learn more",
    bookBtn: "Book a session",
    bioTitle: "About the coach",
    achievementsTitle: "Achievements",
    scheduleTitle: "Schedule",
    reviewsTitle: "Student reviews",
    ctaTitle: "Start Training Today",
    ctaText: "Choose a coach and sign up for your first lesson",
    ctaBtn: "Sign Up",
    backBtn: "All coaches",
    court: "Court"
};
