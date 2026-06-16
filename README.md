# KSLT — Kyrgyzstan Social Lawn Tennis

A full-featured community platform for tennis players in Kyrgyzstan — tournaments, rankings, coaches, courts, memberships, live matches, and more.

![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat&logo=javascript&logoColor=black)
![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=flat&logo=supabase&logoColor=white)
![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white)
![Playwright](https://img.shields.io/badge/Playwright-2EAD33?style=flat&logo=playwright&logoColor=white)

---

## Features

- **Ranking System** — Player ratings across 5 tiers (Tour → Futures → Challenger → Masters → Pro-Masters) with ATP/WTA-style defending points, NTRP Elo rating, and seasonal promotion
- **Tournament Brackets** — Single Elimination, Full Individual Consolation (FIC), and Group Stage formats with ITF seeding, automated draw generation, and score entry
- **Live Match** — YouTube Live stream integration, real-time scoreboard (umpire panel + OBS overlay + public page), full tennis scoring engine (games, sets, tiebreaks, deuce, serve indicator, changeover timer)
- **Challenge Battles** — Player vs player challenges with public voting (site + Telegram inline buttons), H2H stats, VS layout, battle cards grid
- **Loyalty Program** — Earn points for payments and tournament participation, redeem for rewards, auto-expire after 12 months
- **Coaches & Courts** — Searchable catalogs with filters, pagination, promoted listings, and detail pages
- **Find a Partner** — Search for players to hit with, send game invitations via Telegram bot
- **News** — Articles with inline photos, polls/voting, view counters, and autosaved drafts
- **Dashboard** — Personal profile with avatar cropping, match stats, challenges, loyalty points, notification settings
- **Admin Panel** — Full CRUD for all entities, bracket management, live match control, challenges, loyalty rules, user roles, membership approval, payment tracking (22,000+ lines, 18 modular files)
- **3 Languages** — Russian (primary), English, Kyrgyz
- **Responsive Design** — Optimized for 375px to 1920px+ screens
- **PWA** — Installable progressive web app (Service Worker, offline support, app icons)
- **Telegram Bot** — Game invitations, battle voting, tournament registration, membership reminders, account linking

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no frameworks, no build step) |
| Backend | [Supabase](https://supabase.com) — PostgreSQL, Auth, Storage, Edge Functions, Row Level Security |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Serverless | 15 Deno/TypeScript Edge Functions |
| Bot | Telegram Bot API (webhooks + inline buttons) |
| Testing | [Playwright](https://playwright.dev) (E2E) + [Vitest](https://vitest.dev) (Unit) |
| CI/CD | GitHub Actions (tests on push/PR + auto-deploy to Netlify) |
| Design | Dark theme, accent `#CCFF00`, Inter font, glassmorphism |
| Libraries | [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (avatar cropping), [Chart.js](https://www.chartjs.org/) (analytics) |

## Architecture Highlights

- **Zero-build static site** — Pure HTML/CSS/JS served directly. No npm, no webpack, no React. Every page loads in milliseconds.
- **Row Level Security (RLS)** — All database tables protected with Supabase RLS policies. Security enforced at the database level, not just the UI.
- **Modular admin panel** — 22,000+ lines split into 18 files using the `window.KSLT_ADMIN` namespace pattern. Each module is an IIFE that registers itself on the shared namespace.
- **Supabase-first with static fallback** — Public pages load data from Supabase; if unavailable, gracefully fall back to static `data/*.js` files.
- **File-based i18n** — Separate HTML files per language (`-en.html`, `-kg.html`). JS modules use inline label objects selected by URL detection.
- **CSS scope isolation** — Page-specific prefixes (`co-`, `ct-`, `pl-`, `td-`, `pt-`, `ch-`, `lm-`, etc.) prevent style collisions across 22 CSS files.
- **Three-tier access control** — Guest → Registered User → Member, with role-based admin restrictions (admin vs manager) enforced both in UI and RLS.
- **Real-time features** — Live match scoreboard with Supabase Realtime, 15-second auto-refresh on homepage live cards.

## Project Structure

```
KSLT/
├── index.html / index-en.html / index-kg.html   # Homepage (3 languages)
│
├── pages/                                 # 76 HTML pages (RU/EN/KG)
│   ├── auth.html                          #   Authentication
│   ├── dashboard.html                     #   Personal dashboard
│   ├── admin.html                         #   Admin panel
│   ├── tournaments-overview.html          #   Tournament categories
│   ├── tournaments.html                   #   Tournament list + filters
│   ├── tournament.html                    #   Tournament detail + bracket
│   ├── players.html / player.html         #   Rankings + player profile
│   ├── coaches.html / coach.html          #   Coaches catalog + profile
│   ├── courts.html / court.html           #   Courts catalog + detail
│   ├── news.html                          #   News feed
│   ├── partners.html                      #   Find a partner
│   ├── services.html                      #   Services overview
│   ├── info.html                          #   Information hub
│   ├── challenge.html                     #   Battle detail (VS layout)
│   ├── battles.html                       #   Battles overview grid
│   ├── live-match.html                    #   Live match + stream
│   ├── umpire.html                        #   Umpire scoring panel
│   └── about / faq / rules / pricing      #   Info pages
│
├── css/                                   # 22 CSS files (~27,500 lines)
│   ├── style.css                          #   Design system + globals
│   ├── admin.css                          #   Admin panel
│   ├── live-match.css                     #   Live match + scoreboard
│   ├── challenge-detail.css               #   Battle VS layout
│   └── ...                                #   Page-specific styles
│
├── js/                                    # 45 JS files (~42,700 lines)
│   ├── admin/                             #   Admin panel (modular, 18 files)
│   │   ├── core/                          #   constants, utils, layout, init
│   │   └── sections/                      #   news, tournaments, bracket,
│   │                                      #   players, courts, coaches,
│   │                                      #   finances, users, vouchers,
│   │                                      #   challenges, live, loyalty, ...
│   ├── umpire.js                          #   Tennis scoring engine
│   ├── scoreboard.js                      #   OBS overlay scoreboard
│   ├── live-match.js                      #   Public live match page
│   ├── challenge-detail.js                #   Battle page (VS, voting, H2H)
│   ├── dashboard.js                       #   Personal dashboard
│   ├── players.js                         #   Rankings page
│   ├── supabase-config.js                 #   Supabase client init
│   └── ...                                #   Page-specific scripts
│
├── data/                                  # 18 static data files (fallback)
├── sql/                                   # 64 SQL migrations
├── supabase/functions/                    # 15 Edge Functions (Deno/TS)
├── tests/
│   ├── e2e/                               # 9 Playwright test suites
│   └── unit/                              # 3 Vitest test suites (72 tests)
├── .github/workflows/                     # CI/CD (test.yml + deploy.yml)
├── docs/                                  # Technical docs + guides
└── images/                                # Assets
```

**Total: ~121,000 lines of code across 260+ files**

## Testing

| Type | Framework | Tests | Details |
|------|-----------|-------|---------|
| E2E | Playwright | 9 suites, 3 viewports (desktop/tablet/mobile) | Page loading, navigation, responsive, CSS/JS integrity, auth, PWA, SEO |
| Unit | Vitest | 72 tests across 3 suites | Edge Functions: create-challenge, admin-manage-user, battle-publish |

```bash
# Run E2E tests
npx playwright test

# Run unit tests
npx vitest run
```

## CI/CD

Two GitHub Actions workflows:

- **test.yml** — Runs E2E + unit tests on every push and pull request
- **deploy.yml** — Auto-deploys to Netlify on push to `main`

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

## Environment Variables

See [`.env.example`](.env.example) for all required variables.

| Variable | Where | Description |
|----------|-------|-------------|
| `SUPABASE_URL` | Edge Functions (auto) | Supabase project URL |
| `SUPABASE_ANON_KEY` | `js/supabase-config.js` + Edge Functions | Public key (RLS protects data) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions (auto) | Server key (bypasses RLS) |
| `TELEGRAM_BOT_TOKEN` | Edge Functions secret | Telegram bot token |
| `TELEGRAM_GROUP_CHAT_ID` | Edge Functions secret | Telegram group chat ID |
| `CRON_SECRET` | Edge Functions secret | Secret for pg_cron jobs |

## Documentation

- [CONTRIBUTING.md](CONTRIBUTING.md) — Git flow, code style, architecture patterns
- [CONTRIBUTING-EN.md](CONTRIBUTING-EN.md) — Contributing guide (English)
- [docs/TECHNICAL.md](docs/TECHNICAL.md) — Full technical documentation (RU)
- [docs/TECHNICAL-EN.md](docs/TECHNICAL-EN.md) — Full technical documentation (EN)
- [docs/MANAGER-GUIDE.md](docs/MANAGER-GUIDE.md) — Admin panel guide for managers (RU)
- [docs/MANAGER-GUIDE-EN.md](docs/MANAGER-GUIDE-EN.md) — Admin panel guide for managers (EN)
- [docs/API.md](docs/API.md) — API documentation
- [roadmap.md](roadmap.md) — Project roadmap (RU)
- [roadmap-en.md](roadmap-en.md) — Project roadmap (EN)

## Live Demo

[kslt.netlify.app](https://kslt.netlify.app)

## Screenshots

*Coming soon*

## Author

**Costa Han** — [github.com/bossyko](https://github.com/bossyko)
