# KSLT — Kyrgyzstan Social Lawn Tennis

A full-featured tennis community platform for Kyrgyzstan, featuring player rankings, tournament management, coach profiles, court listings, and a user dashboard with Supabase backend.

## Features

- **Multi-language** — Russian (base), English, Kyrgyz
- **Player Rankings** — Points-based rating system with categories (PRO, A, B, C, Juniors, Women)
- **Tournaments** — Event listings, bracket generation, match results
- **Coaches & Courts** — Searchable profiles with booking-ready infrastructure
- **News** — Articles with category filtering and full article view
- **Authentication** — Email/password + Google OAuth via Supabase Auth
- **User Dashboard** — Profile management, avatar upload with crop, password change, stats
- **Responsive Design** — Mobile-first, tested on 375px–1920px+

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, RLS) |
| Design | Dark theme, accent `#CCFF00`, Inter font, glassmorphism |
| Auth | Supabase Auth (email/password, Google OAuth) |
| Storage | Supabase Storage (avatar uploads) |
| Libraries | [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (avatar crop) |

## Project Structure

```
KSLT/
├── index.html / index-en.html / index-kg.html   # Main page (3 languages)
├── auth.html / auth-en.html                      # Login / Register
├── dashboard.html / dashboard-en.html            # User dashboard
├── tournaments.html / tournament.html            # Tournament list & detail
├── players.html / player.html                    # Rankings & player profile
├── coaches.html / coach.html                     # Coaches list & profile
├── courts.html / court.html                      # Courts list & detail
├── news.html / news-en.html                      # News & articles
├── about.html / faq.html / rules.html            # Info pages
│
├── css/                                          # Stylesheets
│   ├── style.css                                 #   Design system & global styles
│   ├── dashboard.css                             #   Dashboard layout & components
│   ├── tournaments.css                           #   Tournament pages
│   ├── tournament-detail.css                     #   Tournament brackets & detail
│   ├── players.css                               #   Rankings page
│   ├── player.css                                #   Player profile
│   ├── coaches.css                               #   Coaches pages
│   ├── courts.css                                #   Courts pages
│   ├── news.css                                  #   News pages
│   └── info-pages.css                            #   About, FAQ, Rules
│
├── js/                                           # Application logic
│   ├── script.js                                 #   Global (header, burger, lang)
│   ├── supabase-config.js                        #   Supabase client init
│   ├── auth.js                                   #   Login/register logic
│   ├── auth-guard.js                             #   Route protection middleware
│   ├── auth-nav.js                               #   Logged-in nav toggle
│   ├── dashboard.js                              #   Dashboard logic
│   ├── players.js                                #   Rankings logic
│   ├── player.js                                 #   Player profile logic
│   ├── coaches.js                                #   Coaches logic
│   ├── courts.js                                 #   Courts logic
│   ├── news.js                                   #   News logic
│   ├── tournament-detail.js                      #   Tournament bracket viewer
│   └── tournament-generator.js                   #   Bracket generation
│
├── data/                                         # Static data (RU + EN)
│   ├── tournaments-data.js / -en.js
│   ├── tournament-detail-data.js / -en.js
│   ├── players-data.js / -en.js
│   ├── coaches-data.js / -en.js
│   ├── courts-data.js / -en.js
│   └── news-data.js / -en.js
│
├── images/                                       # Static assets
├── postman/                                      # API test collections
│
├── supabase/                                     # Database migrations
│   ├── schema.sql                                #   Tables & RLS policies
│   ├── seed.sql                                  #   Initial data
│   ├── migrate-players.sql                       #   Player data migration
│   └── add-social-fields.sql                     #   Social media fields
│
├── .gitignore
└── README.md
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3 (for local development server)
- A [Supabase](https://supabase.com) project (for backend features)

### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/bossyko/KSLT-project.git
   cd KSLT-project
   ```

2. **Start a local server**
   ```bash
   python3 -m http.server 8080
   ```

3. **Open in browser**
   ```
   http://localhost:8080
   ```

### Supabase Setup

1. Create a project at [supabase.com](https://supabase.com)
2. Run `supabase/schema.sql` in the SQL Editor to create tables
3. Run `supabase/seed.sql` to populate initial data
4. Update `js/supabase-config.js` with your project URL and anon key
5. Configure Auth providers (email, Google OAuth) in Supabase Dashboard
6. Create a public `avatars` bucket in Supabase Storage

### Environment

| Setting | Value |
|---------|-------|
| Supabase Site URL | `http://localhost:8080/index.html` |
| Redirect URLs | `http://localhost:8080/**` |
| Auth Providers | Email, Google |

## Architecture

- **No build tools** — Pure HTML/CSS/JS, zero dependencies (except Cropper.js CDN)
- **Multi-language** — Separate HTML files per language (`-en.html`, `-kg.html` suffixes)
- **Auth flow** — `auth-guard.js` protects dashboard routes, `auth-nav.js` toggles nav state
- **Shared Supabase client** — Single `window.supabaseClient` instance from `supabase-config.js`
- **RLS (Row Level Security)** — Database-level access control for all tables
- **CSS design system** — CSS variables in `style.css` for consistent theming

## Roadmap

- [x] **Phase 1** — Frontend pages + responsive design
- [x] **Phase 2** — Supabase backend, auth, user dashboard
- [ ] **Phase 3** — Membership, payments, notifications
- [ ] **Phase 4** — Admin panel, CRUD, financial reports
- [ ] **Phase 5** — AI chatbot, court booking, shop, PWA

## Author

**KSLT Team** — Kyrgyzstan Social Lawn Tennis

## License

This project is proprietary. All rights reserved.
