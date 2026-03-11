# KSLT — Kyrgyzstan Social Lawn Tennis

A full-featured community platform for tennis players in Kyrgyzstan — tournaments, rankings, coaches, courts, memberships, and more.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)

---

## Features

- **Ranking System** — Player ratings across 5 tiers (Tour → Futures → Challenger → Masters → Pro-Masters) with ATP/WTA-style defending points and seasonal promotion
- **Tournament Brackets** — Single Elimination, Full Individual Consolation (FIC), and Group Stage formats with ITF seeding, automated draw generation, and score entry
- **Coaches & Courts** — Searchable catalogs with filters, pagination, promoted listings, and detail pages
- **Find a Partner** — Search for players to hit with, send game invitations via Telegram bot
- **News** — Articles with inline photos, polls/voting, view counters, and autosaved drafts
- **Dashboard** — Personal profile with avatar cropping, match stats, game invitation history
- **Admin Panel** — Full CRUD for all entities, bracket management, user roles, membership approval, payment tracking (15,000+ lines, 14 modular files)
- **3 Languages** — Russian (primary), English, Kyrgyz
- **Responsive Design** — Optimized for 375px to 1920px+ screens
- **Telegram Bot** — Game invitations, membership reminders, account linking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no frameworks, no build step) |
| Backend | [Supabase](https://supabase.com) — PostgreSQL, Auth, Storage, Edge Functions, Row Level Security |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Serverless | 4 Deno/TypeScript Edge Functions |
| Bot | Telegram Bot API (webhooks) |
| Design | Dark theme, accent `#CCFF00`, Inter font, glassmorphism |
| Libraries | [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (avatar cropping, CDN) |

## Architecture Highlights

- **Zero-build static site** — Pure HTML/CSS/JS served directly. No npm, no webpack, no React. Every page loads in milliseconds.
- **Row Level Security (RLS)** — All database tables protected with Supabase RLS policies. Security enforced at the database level, not just the UI.
- **Modular admin panel** — 15,300 lines split into 14 files using the `window.KSLT_ADMIN` namespace pattern. Each module is an IIFE that registers itself on the shared namespace.
- **Supabase-first with static fallback** — Public pages load data from Supabase; if unavailable, gracefully fall back to static `data/*.js` files.
- **File-based i18n** — Separate HTML files per language (`-en.html`, `-kg.html`). JS modules use inline label objects selected by URL detection.
- **CSS scope isolation** — Page-specific prefixes (`co-`, `ct-`, `pl-`, `td-`, `pt-`, etc.) prevent style collisions across 16 CSS files.
- **Three-tier access control** — Guest → Registered User → Member, with role-based admin restrictions (admin vs manager) enforced both in UI and RLS.

## Project Structure

```
KSLT/
├── index.html / index-en.html         # Homepage (RU / EN)
│
├── pages/                              # 46 HTML pages
│   ├── auth.html                       #   Authentication
│   ├── dashboard.html                  #   Personal dashboard
│   ├── admin.html                      #   Admin panel
│   ├── tournaments-overview.html       #   Tournament categories
│   ├── tournaments.html                #   Tournament list + filters
│   ├── tournament.html                 #   Tournament detail + bracket
│   ├── players.html / player.html      #   Rankings + player profile
│   ├── coaches.html / coach.html       #   Coaches catalog + profile
│   ├── courts.html / court.html        #   Courts catalog + detail
│   ├── news.html                       #   News feed
│   ├── partners.html                   #   Find a partner
│   ├── services.html                   #   Services overview
│   ├── info.html                       #   Information hub
│   └── about / faq / rules / pricing   #   Info pages
│
├── css/                                # 16 CSS files (~20,400 lines)
│   ├── style.css                       #   Design system + globals
│   ├── admin.css                       #   Admin panel
│   └── ...                             #   Page-specific styles
│
├── js/                                 # 34 JS files (~26,400 lines)
│   ├── admin/                          #   Admin panel (modular)
│   │   ├── core/                       #   constants, utils, layout, init
│   │   └── sections/                   #   news, tournaments, bracket,
│   │                                   #   players, courts, coaches,
│   │                                   #   ratings, memberships,
│   │                                   #   payments, users
│   ├── tournament-detail.js            #   Public bracket rendering
│   ├── dashboard.js                    #   Personal dashboard
│   ├── players.js                      #   Rankings page
│   ├── supabase-config.js              #   Supabase client init
│   └── ...                             #   Page-specific scripts
│
├── data/                               # Static data (Supabase fallback)
├── sql/                                # 38 SQL migrations
├── supabase/                           # Schema + 4 Edge Functions
├── docs/                               # Technical docs
└── images/                             # Assets
```

**Total: ~74,000 lines of code across 140+ files**

## Quick Start

**Option A — Python:**
```bash
git clone https://github.com/bossyko/KSLT-project.git
cd KSLT-project
python3 -m http.server 8080
# Open http://localhost:8080
```

**Option B — Node.js (npx):**
```bash
npx serve .
```

**Option C — VS Code:**
1. Install the **Live Server** extension
2. Right-click `index.html` → **Open with Live Server**

The Supabase anon key is already configured in `js/supabase-config.js`. This is a **public** key — security is enforced through RLS policies at the database level.

## Live Demo

[kslt.netlify.app](https://kslt.netlify.app)

## Screenshots

*Coming soon*

## Author

**Costa Han** — [github.com/bossyko](https://github.com/bossyko)
