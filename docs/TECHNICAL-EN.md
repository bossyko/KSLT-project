# KSLT — Technical Documentation

> Last updated: 2026-03-24
> Version: 2.0

---

## 1. Project Overview

**KSLT (Kyrgyzstan Social Lawn Tennis)** — a web platform for the tennis community of Kyrgyzstan. It brings together amateurs and professionals: rankings, tournaments, coaches, courts, membership, live matches, battles, and a loyalty program.

| Parameter | Value |
|-----------|-------|
| Languages | RU (primary), EN, KG |
| Theme | Dark, accent #CCFF00 |
| Font | Inter |
| Hosting | Netlify (frontend) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Bot | Telegram Bot API |
| Testing | Playwright (E2E) + Vitest (Unit) |
| CI/CD | GitHub Actions (test.yml + deploy.yml) |
| Frameworks | None (Vanilla HTML/CSS/JS) |
| Build | None (static, no bundler) |

---

## 2. Tech Stack

### Frontend
- **HTML5** — 80 static pages, file-based multilingual (`-en`, `-kg` suffixes)
- **CSS3** — 22 files, variables, glassmorphism, responsive (375/480/768/992px)
- **Vanilla JavaScript** — 45 files, IIFE modules, JSDoc typing, no dependencies
- **Supabase JS SDK** — connected via CDN (unpkg.com)
- **Chart.js** — analytics charts in admin panel (CDN)

### Backend (Supabase)
- **PostgreSQL** — main database (31+ tables)
- **Row Level Security (RLS)** — row-level security
- **Auth** — email/password + Google OAuth
- **Storage** — user avatars, news photos
- **Edge Functions** — 15 Deno/TypeScript functions
- **RPC** — 28+ SQL functions called from the frontend
- **Realtime** — subscriptions to changes (live match)
- **pg_cron** — scheduled automatic tasks

### Testing
- **Playwright** — E2E tests (9 test suites, 3 viewports: desktop/tablet/mobile)
- **Vitest** — Unit tests for Edge Functions (72 tests, 3 suites)
- **GitHub Actions** — CI/CD (test.yml: tests, deploy.yml: deploy to Netlify)

### Integrations
- **Telegram Bot** (`@KSLTennisBot`) — notifications, voting, registration
- **Cropper.js** — avatar cropping in dashboard
- **Chart.js** — charts: user growth, payment dynamics

---

## 3. Project Structure

```
KSLT/
├── index.html / index-en.html / index-kg.html    ← Homepage (3 languages)
│
├── pages/                          ← 76 HTML pages
│   ├── auth.html                   ← Authentication
│   ├── dashboard.html              ← User dashboard
│   ├── admin.html                  ← Admin panel
│   ├── tournaments.html            ← Tournament list
│   ├── tournament.html             ← Tournament details + bracket
│   ├── tournaments-overview.html   ← Tournament categories overview
│   ├── players.html                ← Player rankings
│   ├── player.html                 ← Player profile
│   ├── coaches.html                ← Coaches catalog
│   ├── coach.html                  ← Coach profile
│   ├── courts.html                 ← Courts catalog
│   ├── court.html                  ← Court details
│   ├── news.html                   ← News
│   ├── services.html               ← Services overview
│   ├── info.html                   ← Information hub
│   ├── partners.html               ← Find a partner
│   ├── challenge.html              ← Battle (VS layout)
│   ├── battles.html                ← Battles overview (cards)
│   ├── live-match.html             ← Live match + stream
│   ├── umpire.html                 ← Umpire panel (scoring)
│   ├── verify.html                 ← Voucher verification
│   ├── about.html                  ← About the project
│   ├── faq.html                    ← FAQ
│   ├── rules.html                  ← Rules
│   ├── pricing.html                ← Pricing
│   └── offer.html                  ← Public offer
│
├── css/                            ← 22 CSS files (~27,500 lines)
│   ├── style.css                   ← Design system + global styles
│   ├── admin.css                   ← Admin panel
│   ├── players.css                 ← Rankings
│   ├── tournament-detail.css       ← Tournament details
│   ├── live-match.css              ← Live match + scoreboard
│   ├── umpire.css                  ← Umpire panel
│   ├── challenge-detail.css        ← Battle (VS layout)
│   ├── battle-cards.css            ← Battle cards
│   ├── battles-overview.css        ← Battles overview
│   ├── news.css                    ← News
│   ├── dashboard.css               ← User dashboard
│   ├── partners.css                ← Find a partner
│   ├── courts.css                  ← Courts
│   ├── tournaments.css             ← Tournament list
│   ├── coaches.css                 ← Coaches
│   ├── tournaments-overview.css    ← Tournaments overview
│   ├── services.css                ← Services
│   ├── info-pages.css              ← About/FAQ/Rules
│   ├── player.css                  ← Player profile
│   ├── pricing.css                 ← Pricing
│   ├── info-overview.css           ← Info hub
│   └── verify.css                  ← Verification
│
├── js/                             ← 45 JS files (~42,700 lines)
│   ├── admin/                      ← Admin panel (~22,000, 18 files) ★
│   │   ├── core/
│   │   │   ├── constants.js        ← L (EN/RU), ICONS, enums, maps
│   │   │   ├── utils.js            ← toast, confirm, esc, translate, uploadImage, exportCsv
│   │   │   ├── layout.js           ← sidebar, tabs, dashboard, switchTab
│   │   │   └── init.js             ← onAuthReady orchestration
│   │   └── sections/
│   │       ├── news.js             ← CRUD + inline photos + poll
│   │       ├── tournaments.js      ← CRUD + registrations + finalization
│   │       ├── bracket.js          ← Bracket SE/FIC/Group Stage
│   │       ├── courts.js           ← CRUD + promoted + coordinates
│   │       ├── coaches.js          ← CRUD + photos + auto-translate
│   │       ├── players.js          ← CRUD + category + ban
│   │       ├── settings.js         ← Points rules + promotion
│   │       ├── finances.js         ← CRUD + promoted + period + PDF/Excel
│   │       ├── vouchers.js         ← Dashboard + table + filters + PDF
│   │       ├── users.js            ← List + roles + analytics + ban
│   │       ├── challenges.js       ← Battles: publish, score, manage
│   │       ├── live.js             ← Live matches: create, control, score sync
│   │       ├── loyalty.js          ← Rules, rewards, transactions, manual adjust
│   │       └── broadcast.js        ← Email/TG broadcast
│   ├── umpire.js                   ← Tennis scoring engine
│   ├── scoreboard.js               ← OBS overlay scoreboard
│   ├── live-match.js               ← Public live match page
│   ├── challenge-detail.js         ← Battle: VS, voting, H2H, score
│   ├── battle-cards.js             ← Battle cards (homepage/battles)
│   ├── battles-overview.js         ← Battles overview
│   ├── tournament-detail.js        ← Tournament bracket
│   ├── dashboard.js                ← User dashboard
│   ├── players.js                  ← Rankings
│   ├── news.js                     ← News
│   ├── courts.js                   ← Courts
│   ├── partners.js                 ← Find a partner
│   ├── coaches.js                  ← Coaches
│   ├── services.js                 ← Services
│   ├── tournament-generator.js     ← Bracket generator
│   ├── script.js                   ← Global (header, burger, scroll, lang, scroll-to-top)
│   ├── tournaments-overview.js     ← Tournaments overview + search
│   ├── auth.js                     ← Authentication
│   ├── player.js                   ← Player profile
│   ├── tournaments-overlay.js      ← Tournament list + search
│   ├── verify.js                   ← Voucher verification
│   ├── auth-nav.js                 ← User dropdown
│   ├── info-overview.js            ← Info hub
│   ├── membership.js               ← Membership
│   ├── auth-guard.js               ← Route protection
│   ├── supabase-config.js          ← Supabase client
│   └── session-monitor.js          ← Session monitoring
│
├── data/                           ← 18 static data files (~6,350 lines)
│   ├── tournaments-data.js / -en.js / -kg.js
│   ├── tournament-detail-data.js / -en.js
│   ├── news-data.js / -en.js / -kg.js
│   ├── players-data.js / -en.js / -kg.js
│   ├── coaches-data.js / -en.js / -kg.js
│   └── courts-data.js / -en.js / -kg.js
│
├── sql/                            ← 64 SQL files (migrations + tests)
│
├── supabase/
│   ├── schema.sql                  ← Main DB schema
│   ├── seed.sql                    ← Seed data
│   └── functions/                  ← 15 Edge Functions (Deno/TypeScript)
│       ├── admin-manage-user/      ← create_manager, ban/unban, delete_user
│       ├── auto-unban/             ← Auto-unban via pg_cron
│       ├── battle-announce/        ← Battle announcement to TG group
│       ├── battle-publish/         ← Battle publishing + TG voting buttons
│       ├── broadcast/              ← Email/TG broadcast (universal)
│       ├── create-challenge/       ← Challenge creation
│       ├── match-notify/           ← Match notifications (cron + manual)
│       ├── membership-expire/      ← Auto-expire + TG notification (cron)
│       ├── membership-notify/      ← 7-day expiry reminder (cron)
│       ├── membership-tg-notify/   ← Admin grant/extend/cancel → TG DM
│       ├── send-email/             ← Email sending (Resend)
│       ├── send-game-invite/       ← Game invite → TG
│       ├── telegram-webhook/       ← Bot webhook (all callbacks)
│       ├── tournament-notify/      ← Tournament announcement to TG group
│       └── tournament-reminder/    ← Tournament reminder
│
├── tests/
│   ├── e2e/                        ← 9 Playwright test suites
│   │   ├── 01-pages-load.spec.js
│   │   ├── 02-navigation.spec.js
│   │   ├── 03-responsive.spec.js
│   │   ├── 04-css-integrity.spec.js
│   │   ├── 05-auth-page.spec.js
│   │   ├── 06-homepage-sections.spec.js
│   │   ├── 07-pwa.spec.js
│   │   ├── 08-seo-meta.spec.js
│   │   └── 09-content-pages.spec.js
│   └── unit/edge-functions/        ← 72 Vitest tests
│       ├── create-challenge.test.js    (23 tests)
│       ├── admin-manage-user.test.js   (29 tests)
│       └── battle-publish.test.js      (20 tests)
│
├── .github/workflows/              ← CI/CD
│   ├── test.yml                    ← Tests on push/PR
│   └── deploy.yml                  ← Auto-deploy to Netlify
│
├── docs/                           ← Documentation
│   ├── TECHNICAL.md                ← Technical documentation (RU)
│   ├── TECHNICAL-EN.md             ← Technical documentation (EN)
│   ├── MANAGER-GUIDE.md            ← Manager guide (RU)
│   ├── MANAGER-GUIDE-EN.md         ← Manager guide (EN)
│   └── API.md                      ← API documentation
│
└── images/                         ← Logo, icons, sponsors
```

**Total: ~260 files, ~121,000 lines of code**

---

## 4. Database (PostgreSQL)

### Table Schema

```
profiles              — users (auth + profile)
├── id (UUID, PK)     — matches auth.users.id
├── full_name
├── email, phone
├── avatar_url
├── role              — user / manager / admin
├── player_id         — link to players
├── gender
├── birthday
├── instagram, telegram
├── show_socials
├── telegram_chat_id  — for the bot
├── telegram_username
├── play_level        — beginner / intermediate / advanced
├── preferred_time    — morning / afternoon / evening / weekend
├── last_seen         — online status
├── notify_preferences — JSONB {tg: {membership, tournaments, matches, challenges}, email: {...}}
└── membership_*      — membership data

players               — ranked players
├── id (TEXT, PK)
├── name, name_en, name_kg — Full name (First Last, split in admin)
├── photo
├── category_id       → categories
├── points, wins, losses
├── rank_change
├── form[]            — last 5 results (W/L), auto from matches
├── bio               — player motto (max 100 chars)
├── seed
├── ntrp_rating       — NTRP Elo rating (1.0–7.0)
├── banned_until      — ban end date (NULL = not banned)
└── ban_reason        — ban reason (optional)

categories            — ranking categories
├── id, name, name_en
├── gender            — men / women
└── sort_order

tournaments           — tournaments
├── id, name, name_en
├── category_id       → categories
├── level_id          → tournament_levels
├── dates, location
├── draw_size         — 8 / 16 / 32
├── bracket_type      — single_elimination / fic / group_stage
├── status            — upcoming / ongoing / completed
├── published_at      — null = draft
├── youtube_url       — YouTube stream link
└── registration_start, registration_end

tournament_levels     — tournament levels
├── Cat.1, Cat.2, Cat.3, Cat.4, Grand (Grand Slam)
└── points_rules      — points per round

tournament_registrations — tournament registrations
├── player_id, tournament_id
├── status            — pending → approved → draw
├── seed_number, draw_position
└── category_check

matches               — tournament bracket matches
├── tournament_id, round_number, match_order
├── player1_id, player2_id
├── score             — "6-4 6-3"
├── winner_id
├── seed1, seed2
├── court, scheduled_time
├── match_type        — tournament / duel
└── status            — scheduled / completed

coaches               — coaches
├── name, speciality, photo
├── phone, email, instagram
├── rating, experience
├── court_id          → courts
└── promoted          — paid placement at the top

courts                — courts
├── name, address, type
├── surface, price
├── phone, facilities
├── lat, lng          — coordinates
└── promoted

news                  — news
├── title, title_en, title_kg
├── content, content_en, content_kg
├── excerpt, excerpt_en, excerpt_kg
├── slug              — URL identifier
├── image             — cover image
├── content_images    — JSONB [{url, after_paragraph}] — inline photos
├── poll              — JSONB {question, options} | null — poll
├── category          — results / interview / announcement / world
├── author, executor
└── published_at      — null = draft

memberships           — memberships
├── profile_id        → profiles
├── type, start_date, end_date
└── status            — active / expired

entity_payments       — payments (Membership / Court / Coach / Club)
├── profile_id, entity_type, entity_id
├── amount, currency, method
├── start_date, end_date
├── purpose           — promotion / sponsorship / rent / other
└── status            — active / expired

game_invites          — game invitations
├── sender_id         → profiles
├── receiver_player_id → players
├── receiver_profile_id → profiles
├── status            — pending / accepted / declined / expired
└── created_at, responded_at

challenges            — match challenges (Challenge Board + Battles)
├── challenger_id     → profiles
├── opponent_id       → profiles (player_id link)
├── proposed_date, proposed_time
├── proposed_court    → courts.id or another venue
├── message           — up to 150 characters
├── status            — pending / accepted / counter / declined / expired
├── battle_title      — battle title (for publishing)
├── battle_published  — whether the battle is published
├── voting_closed     — voting closed
├── battle_notified_at — TG notification date
└── expires_at        — automatically after 72h (pg_cron)

challenge_predictions — battle votes
├── challenge_id      → challenges
├── profile_id        → profiles (or telegram_chat_id)
├── predicted_winner  — 1 (challenger) or 2 (opponent)
└── source            — 'site' / 'telegram'

discount_vouchers     — discount vouchers (membership)
├── profile_id        → profiles
├── entity_type       — court / coach
├── entity_id, entity_name
├── discount_percent
├── qr_token          — unique token for QR code
├── status            — active / used / expired / cancelled
├── expires_at        — +7 days
└── confirmed_by_ip   — IP at verification

loyalty_rules         — points earning rules
├── event_type        — payment_membership / payment_court / tournament_win / ...
├── points            — number of points
└── description

loyalty_rewards       — rewards for redemption
├── name, description
├── points_cost       — cost in points
└── is_active

loyalty_transactions  — points transactions
├── profile_id        → profiles
├── rule_id / reward_id
├── points            — +earn / -redeem
├── type              — earn / redeem / adjust / expire
└── expires_at        — +12 months (pg_cron auto-expire)

live_matches          — live matches
├── player1_id, player2_id → players
├── source_type       — free / tournament / battle
├── source_id         — tournament_id or challenge_id
├── score_data        — JSONB (sets, games, points, serve)
├── youtube_url       — YouTube stream URL
├── status            — warmup / live / changeover / finished
└── finished_at

deleted_accounts      — deleted accounts log
├── profile_id, full_name, email, role
├── had_membership
└── deleted_at
    Trigger: trg_log_deleted_profile BEFORE DELETE ON profiles

notification_log      — notification log (duplicate protection)
├── profile_id, type
└── sent_at
```

### RLS Policies (Row Level Security)

Every table is protected:
- **profiles** — user can view/edit only their own
- **game_invites** — sender sees sent invites, receiver sees received
- **coaches/courts/news** — public read, write only for admin/manager
- **players** — public read, write via admin/manager (ban)
- **memberships/payments** — staff full access
- **challenges** — participants see their own, staff sees all
- **challenge_predictions** — user gets 1 vote, staff sees all
- **loyalty_*** — staff full CRUD, users read own + redeem
- **live_matches** — public read, staff management

### RPC Functions (28+)

```sql
get_public_partners()        — partner list with online status, telegram, level
get_my_game_invites()        — invitation history (sent + received)
recalc_player_points()       — ranking recalculation after tournament
get_battle_public()          — public battle data
get_battle_votes()           — voting results
cast_battle_vote()           — vote for a player
get_loyalty_balance()        — loyalty points balance
generate_voucher()           — discount voucher generation
...
```

---

## 5. Authentication & Roles

### Access Levels

| Role | Access |
|------|--------|
| **Guest** | View public pages |
| **user** | Dashboard, profile, battle voting |
| **user + membership** | All user features + tournaments + challenges + loyalty |
| **manager** | All user features + admin panel (CRUD) + ban/delete regular users |
| **admin** | Full access to everything |

### Authentication Flow

```
Guest → auth.html → Email/Password or Google OAuth
  → Supabase Auth → JWT token → localStorage
  → Redirect → dashboard.html

Every protected page:
  → auth-guard.js → JWT check
  → No token → redirect auth.html
  → Token exists → load profile → auth-ready
```

### Authentication Files

| File | Purpose |
|------|---------|
| `supabase-config.js` | Supabase client initialization, profile cache |
| `auth.js` | Login/registration form |
| `auth-guard.js` | Route protection, profile loading, requireStaff/requireAdmin functions |
| `auth-nav.js` | Navigation UI: "Sign In" ↔ User Dropdown |

---

## 6. Frontend — Architecture Patterns

### Multilingual (file-based)

```
index.html          — RU (base)
index-en.html       — EN
index-kg.html       — KG

Detection: window.location.pathname.indexOf('-en') !== -1
```

Each JS file contains a labels object for languages:
```javascript
var isEn = window.location.pathname.indexOf('-en') !== -1;
var isKg = window.location.pathname.indexOf('-kg') !== -1;
var L = isEn ? { profile: 'Profile' } : isKg ? { profile: 'Профиль' } : { profile: 'Профиль' };
```

### IIFE Modules (isolation)

Each JS file is wrapped in an IIFE — no global variables:
```javascript
(function() {
    'use strict';
    // all module logic
})();
```

### JSDoc Typing

Key functions are annotated with JSDoc:
```javascript
/**
 * @param {string} profileId - User UUID
 * @param {Object} options
 * @param {number} options.amount - Amount in KGS
 * @returns {Promise<{success: boolean, error?: string}>}
 */
```

### CSS Prefixes by Page

| Prefix | Page |
|--------|------|
| `pt-` | Partners (find a partner) |
| `sv-` | Services |
| `db-` | Dashboard (user dashboard) |
| `ad-` | Admin (admin panel) |
| `io-` | Info overview (info hub) |
| `co-` | Coaches |
| `ct-` | Courts |
| `pl-` | Players (rankings) |
| `td-` | Tournament detail (bracket) |
| `pr-` | Pricing |
| `ip-` | Info pages (about, faq, rules) |
| `ch-` | Challenge detail (battle) |
| `lm-` | Live match |
| `um-` | Umpire (umpire panel) |
| `bc-` | Battle cards |
| `bo-` | Battles overview |
| `vr-` | Verify (verification) |

### Design System (CSS Variables)

```css
--accent: #CCFF00;              /* electric lime */
--bg-primary: #0A0A0F;          /* dark background */
--bg-card: rgba(255,255,255,0.03);
--border-subtle: rgba(255,255,255,0.06);
--radius-full: 9999px;          /* pill shape */
--transition-fast: 0.15s ease;
--shadow-lg: 0 25px 50px rgba(0,0,0,0.5);
```

Responsive breakpoints: 375px → 480px → 768px → 992px → 1920px+

### Data Loading (Supabase + fallback)

```javascript
// Try Supabase
var result = await supabaseClient.from('coaches').select('*');
if (result.data && result.data.length > 0) {
    renderCards(result.data);
} else {
    // Fallback to static data from data/*.js
    renderCards(coachesData);
}
```

---

## 7. Edge Functions (15 total)

| # | Function | JWT | Trigger | Purpose |
|---|----------|-----|---------|---------|
| 1 | `admin-manage-user` | Yes | Admin panel | create_manager, ban/unban, delete_user |
| 2 | `auto-unban` | No (cron) | pg_cron 09:00 | Auto-unban + TG notification |
| 3 | `battle-announce` | Yes | Admin panel | Battle announcement to TG group |
| 4 | `battle-publish` | Yes | Admin panel | Battle publishing + inline voting buttons |
| 5 | `broadcast` | Yes | Admin panel | Universal Email/TG broadcast |
| 6 | `create-challenge` | Yes | Dashboard | Challenge creation (membership check, 5/day limit) |
| 7 | `match-notify` | No (cron) | pg_cron + manual | Match notifications |
| 8 | `membership-expire` | No (cron) | pg_cron 09:30 | Auto-expire + TG + Email |
| 9 | `membership-notify` | No (cron) | pg_cron 10:00 | 7-day expiry reminder |
| 10 | `membership-tg-notify` | Yes | Admin panel | Grant/extend/cancel → TG DM |
| 11 | `send-email` | Yes | System | Email sending via Resend |
| 12 | `send-game-invite` | Yes | Dashboard | Game invite → TG |
| 13 | `telegram-webhook` | No | Telegram | All callbacks + /start + /notifications |
| 14 | `tournament-notify` | Yes + cron | Admin panel + pg_cron | Tournament announcement to TG group |
| 15 | `tournament-reminder` | No (cron) | pg_cron | Tournament reminder |

### Edge Function Pattern

```typescript
// CORS headers are required
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // JWT auth (if enabled)
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
  const { data: { user } } = await supabase.auth.getUser();

  // Logic...
  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
```

---

## 8. Telegram Bot

| Parameter | Value |
|-----------|-------|
| Username | @KSLTennisBot |
| Created via | @BotFather |
| Webhook | Edge Function `/telegram-webhook` |
| Secret | TELEGRAM_BOT_TOKEN in Supabase Vault |

### Commands

| Command | Action |
|---------|--------|
| `/start <profileId>` | Link Telegram to KSLT profile |
| `/membership` | Membership application via bot |
| `/notifications` | Notification settings (4 categories, inline toggles) |
| Inline: Accept/Decline | Game invitation |
| Inline: Register | Tournament registration |
| Inline: Vote (1/2) | Vote for a player in a battle (with % after vote) |

### Group Broadcasts

| Type | Function | Trigger |
|------|----------|---------|
| Tournament | `tournament-notify` | Admin panel button + pg_cron |
| Battle | `battle-announce` | Admin panel button |
| Match | `match-notify` | Admin panel button + pg_cron |

---

## 9. Tournament System

### Player Categories (ascending)

```
Tour → Futures → Challenger → Masters → Pro-Masters (highest)
```

- Rankings are maintained WITHIN a category
- Top 5 → promotion to the next higher category
- Season = calendar year
- Defending points (like ATP/WTA)

### Tournament Bracket Types

| Type | Description |
|------|-------------|
| **Single Elimination (SE)** | Standard Olympic bracket (8/16/32) |
| **Full Individual Consolation (FIC)** | Olympic + consolation matches (all places) |
| **Group Stage** | Group stage → playoffs |

### Tournament Bracket

```
Generation:
1. Approved players → draw
2. ITF seeding: top seeds at fixed positions (SEED_POSITIONS)
3. Fisher-Yates shuffle for unseeded players
4. Byes for incomplete draw (8/16/32)
5. FIC: bit-reversal order for final placements
6. Group Stage: division into groups, round-robin within groups

Execution:
1. Admin enters score → modal with sets
2. Auto-detect winner → advanceWinner() to next round
3. FIC: losers advance to consolation bracket
4. Finalization → recalc_player_points() → ranking update
5. form[] → array of last 5 results (W/L)
```

---

## 10. Challenge Battle System

### Challenge Lifecycle

```
Player A → creates challenge → Telegram bot sends to Player B
  → B accepts / makes counter-offer / declines
  → If accepted → challenge status = accepted
  → Admin publishes battle (battle_published = true)
  → Voting on website + in Telegram (inline buttons)
  → Match takes place → umpire enters score
  → Finalization → wins/losses/form are updated
```

### Public Battle Page

`challenge.html` / `challenge-en.html` / `challenge-kg.html`:
- VS layout (2 players, photos, stats)
- Voting (bar with percentages)
- H2H: head-to-head history
- Match details (date, time, court)
- Score (after completion)
- One-time voting: cannot change vote
- Cross-check: site ↔ Telegram (one person — one vote)

### Battle Cards

`battles.html` — overview page:
- Grid: 3 columns desktop / 2 tablet / 1 mobile
- Match banner, player names, date, status
- Filters: active / completed

---

## 11. Live Match System

### Architecture

```
Admin → creates Live Match (source: free/tournament/battle)
  → Umpire (umpire.html) enters score via panel
  → Supabase Realtime → live_matches → score_data (JSONB)
  → Public page (live-match.html): scoreboard + YouTube embed
  → Scoreboard OBS (scoreboard.html): transparent overlay
  → Homepage: live cards with 15-second auto-refresh
```

### Umpire Engine (`js/umpire.js`)

Full tennis scoring:
- Games → Sets → Match
- Deuce / Advantage
- Tiebreak (7-point, first to 7, win by 2)
- Serve indicator (first serve)
- Changeover timer (3 min game / 5 min set)
- Skip changeover button

### Creating a Live Match (from admin panel)

3 sources:
1. **Free match** — free match (select 2 players)
2. **Tournament bracket** — from tournament bracket
3. **Battle** — from an accepted challenge

### Score Sync

When a Live Match finishes (tournament source):
- Score is copied to `matches` (tournament bracket)
- Manual sync via button in admin panel

---

## 12. Loyalty Program

### Mechanics

- **Earn**: on payment (court/coach/membership) + tournament finalization
- **Welcome bonus**: 200 points for first membership (one-time)
- **Redeem**: exchange for rewards (tournament entry, membership extension)
- **Expire**: auto-deduction after 12 months (pg_cron)

### Tables

- `loyalty_rules` — earning rules (event_type, points)
- `loyalty_rewards` — rewards for redemption (name, points_cost)
- `loyalty_transactions` — history (earn/redeem/adjust/expire)

### RPC

- `get_loyalty_balance(profile_id)` — current balance

### UI

- Dashboard → "Points" tab (balance, history, redemption)
- Admin → "Loyalty" section (rules, rewards, transactions, manual adjust)

---

## 13. Membership

### Statuses

| Status | Access |
|--------|--------|
| No membership | View, profile |
| Active | Tournaments, invitations, loyalty, full access |
| Expired | Limited (same as "no membership") |

### Notifications

- 7 days before expiry → TG + Email (`membership-notify`)
- On expiry → auto-expire + TG DM (`membership-expire`)
- On grant/extend/cancel → TG DM (`membership-tg-notify`)
- All notifications check `notify_preferences` (opt-out)

### Automated Processes (pg_cron)

| Process | Time (Bishkek) | Action |
|---------|----------------|--------|
| Auto-expire | 09:30 | Expired → status='expired' → TG + Email |
| Reminder | 10:00 | Expiring in 7 days → TG + Email |
| Auto-unban | 09:00 | Removes expired bans → TG |
| Points expire | Daily | Deduction of points older than 12 months |

---

## 14. Admin Panel

**Modular architecture:** `js/admin/` — 18 files, ~22,000 lines

All modules use the namespace `window.KSLT_ADMIN` (alias `A`). Each file is an IIFE that registers its functions. Shared utilities in `core/utils.js`, layout in `core/layout.js`.

### Tabs

| # | Tab | Content | Roles |
|---|-----|---------|-------|
| 1 | Dashboard | Statistics (12 cards + 6 tables) | all |
| 2 | News | CRUD + inline photos + poll + autosave | all |
| 3 | Tournaments | CRUD + registrations + bracket (SE/FIC/Group Stage) | all |
| 4 | Players | Sub-tabs: List / Rankings / Results | Results — admin only |
| 5 | Courts | CRUD + coordinates + promoted | all |
| 6 | Coaches | CRUD + photos + auto-translate | all |
| 7 | Users | Conversion funnel + analytics + ban | all |
| 8 | Finances | entity_payments + payments + PDF/Excel | all |
| 9 | Vouchers | Dashboard + table + filters + cancel | all |
| 10 | Challenges | Accepted/Published/Completed + publish/score | all |
| 11 | Live | Create/manage live matches | all |
| 12 | Loyalty | Rules + Rewards + Transactions + Adjust | all |
| 13 | Settings | Points rules / Promotion | admin only |

### Reports & Analytics

- **PDF export** — Finances, Users, Vouchers
- **Excel/CSV export** — UTF-8 BOM, all sections
- **Charts** — Chart.js: user growth, payment dynamics (4 lines)
- **Conversion funnel** — registered → became players → %

---

## 15. PWA (Progressive Web App)

- `manifest.json` — standalone, dark theme, icons (192/512/apple-touch-icon)
- **Service Worker** — pre-cache core assets, Network First HTML, Cache First CSS/JS/images
- Meta tags in all 80 HTML files
- Installable: desktop (Chrome) + mobile (Android/iOS)

---

## 16. Onboarding

Modal window for new visitors:
- Shown once (localStorage flag)
- 3 languages (RU/EN/KG)
- Steps: welcome → features → how to start
- "Don't show again" button

---

## 17. Testing

### E2E Tests (Playwright)

9 test suites x 3 viewports (desktop 1920px / tablet 768px / mobile 375px):

| Suite | What it tests |
|-------|---------------|
| 01-pages-load | All 80 pages (HTTP 200, no JS errors) |
| 02-navigation | Header links, language switcher, footer |
| 03-responsive | Horizontal overflow (5 breakpoints x 9 pages) |
| 04-css-integrity | No 404 for CSS/JS, dark theme, Inter font |
| 05-auth-page | Form elements, Google OAuth, validation |
| 06-homepage-sections | Hero, tournaments, news, courts, coaches |
| 07-pwa | Manifest, service worker, meta tags, icons |
| 08-seo-meta | Title, lang, charset, accessibility |
| 09-content-pages | About, FAQ, Rules, Pricing, etc. |

### Unit Tests (Vitest)

72 tests for Edge Functions:

| Suite | Tests | What it tests |
|-------|-------|---------------|
| create-challenge | 23 | JWT, membership, limits, validation |
| admin-manage-user | 29 | create_manager, ban/unban, delete, roles |
| battle-publish | 20 | Auth, publish flow, TG announce, retry |

### CI/CD (GitHub Actions)

| Workflow | Trigger | Action |
|----------|---------|--------|
| `test.yml` | push, PR | E2E + Unit tests |
| `deploy.yml` | push to main | Auto-deploy to Netlify |

---

## 18. Deployment

### Frontend (Netlify)

```bash
git push origin main
# → GitHub Actions → tests → deploy to Netlify
```

### SQL Migrations

1. Supabase Dashboard → SQL Editor
2. Paste file contents from `sql/`
3. Run

### Edge Functions

```bash
supabase functions deploy <name> --no-verify-jwt
```

### Secrets (Supabase Vault)

| Secret | Purpose |
|--------|---------|
| TELEGRAM_BOT_TOKEN | Telegram bot token |
| TELEGRAM_GROUP_CHAT_ID | Group ID |
| CRON_SECRET | Secret for pg_cron |
| RESEND_API_KEY | API key for email (Resend) |

---

*Documentation is updated as the project evolves.*
