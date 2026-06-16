# KSLT — Contributing Guide

## Quick Start

```bash
git clone https://github.com/bossyko/KSLT-project.git
cd KSLT-project
python3 -m http.server 8080
# Open http://localhost:8080
```

No build step required — the project is fully static (HTML/CSS/JS). The Supabase anon key is already in `js/supabase-config.js`.

---

## Project Structure

```
KSLT/
├── index.html                    # Homepage (RU)
├── index-en.html                 # Homepage (EN)
├── index-kg.html                 # Homepage (KG)
├── pages/                        # 76 HTML pages (RU/EN/KG)
├── css/                          # 22 CSS files (~27,500 lines)
│   └── style.css                 #   Design system + global styles
├── js/                           # 45 JS files (~42,700 lines)
│   ├── admin/                    #   Admin Panel (modular, 18 files, ~22,000 lines)
│   │   ├── core/                 #   constants.js, utils.js, layout.js, init.js
│   │   └── sections/             #   news.js, tournaments.js, bracket.js,
│   │                             #   challenges.js, live.js, loyalty.js, ...
│   ├── umpire.js                 #   Tennis scoring engine
│   ├── scoreboard.js             #   OBS overlay scoreboard
│   ├── live-match.js             #   Public live match page
│   ├── challenge-detail.js       #   Battle (VS, voting, H2H)
│   ├── supabase-config.js        #   Supabase client
│   ├── auth.js                   #   Authentication
│   ├── auth-nav.js               #   Navigation (dropdown)
│   ├── auth-guard.js             #   Route protection middleware
│   ├── dashboard.js              #   Personal Dashboard
│   └── script.js                 #   Header, burger, scroll, lang dropdown
├── data/                         # Static data (fallback)
├── sql/                          # 64 SQL migrations
├── supabase/functions/           # 15 Edge Functions (Deno/TypeScript)
├── tests/
│   ├── e2e/                      # 9 Playwright test suites
│   └── unit/                     # 72 Vitest tests (Edge Functions)
├── .github/workflows/            # CI/CD (test.yml + deploy.yml)
├── docs/                         # Documentation
└── images/                       # Images
```

---

## Git Flow

### Branches

| Branch | Purpose |
|--------|---------|
| `main` | Production — merge via PR only |
| `feature/*` | New features (`feature/livescore`, `feature/booking`) |
| `fix/*` | Bug fixes (`fix/tournament-layout`) |
| `hotfix/*` | Urgent production fixes |

### Workflow

```bash
# 1. Create a branch from main
git checkout main
git pull
git checkout -b feature/my-feature

# 2. Work and commit
git add <files>
git commit -m "Add: description of the change"

# 3. Push and create a PR
git push -u origin feature/my-feature
# Create Pull Request → CI tests → Review → Merge
```

### Commit Format

```
Add: new feature
Fix: bug fix
Update: enhancement to an existing feature
Refactor: refactoring without behavior changes
Docs: documentation
Style: CSS / formatting
Test: adding/modifying tests
```

---

## Testing

### E2E Tests (Playwright)

```bash
# Run all E2E tests
npx playwright test

# Run a specific suite
npx playwright test tests/e2e/01-pages-load.spec.js

# With UI
npx playwright test --ui
```

9 test suites, 3 viewports (desktop/tablet/mobile): page loading, navigation, responsive, CSS/JS integrity, auth, PWA, SEO, content pages.

### Unit Tests (Vitest)

```bash
# Run unit tests
npx vitest run

# Watch mode
npx vitest
```

72 tests for Edge Functions: create-challenge, admin-manage-user, battle-publish.

### CI/CD

- **test.yml** — runs automatically on push and PR (E2E + Unit)
- **deploy.yml** — auto-deploy to Netlify on push to main

---

## Code Style

### HTML
- File-based multilingual support: `page.html` (RU), `page-en.html` (EN), `page-kg.html` (KG)
- Each page is a separate file (no SPA)
- Supabase SDK is loaded via CDN (unpkg.com)

### CSS
- Page-specific prefixes: `co-` (coaches), `ct-` (courts), `pl-` (players), `td-` (tournament-detail), `ad-` (admin), `db-` (dashboard), `ch-` (challenge), `lm-` (live-match), `um-` (umpire)
- Variables in `:root` (`--accent`, `--bg-card`, `--text-primary`)
- Breakpoints: 375 / 480 / 768 / 992px
- Design: dark theme, accent `#CCFF00`, Inter font, glassmorphism

### JavaScript
- **Vanilla JS** — no frameworks or bundlers
- IIFE pattern for modules
- `var` instead of `let`/`const` (legacy browser support)
- JSDoc annotations (`@param`, `@returns`, `@typedef`) for key functions
- Language detection: `window.location.pathname.indexOf('-en') !== -1`
- Supabase primary + static fallback: load from DB, on error — fall back to `data/*.js`

### Admin Panel (js/admin/)
- Namespace: `window.KSLT_ADMIN` (abbreviated as `A`)
- Each module is an IIFE: `(function() { var A = window.KSLT_ADMIN; ... })()`
- Labels: `var L = A.L` (RU/EN object in `constants.js`)
- Shared utils: `A.showToast()`, `A.esc()`, `A.showConfirm()`, `A.uploadImage()`, `A.exportCsv()`, `A.client`
- Cross-module exports: `A.renderXxxSection`, `A.loadAndEditXxx`

### Edge Functions (Deno/TypeScript)
- Each function in its own folder: `supabase/functions/<name>/index.ts`
- CORS headers are required
- Auth: JWT via `getUser()` or `CRON_SECRET`
- Deploy: `supabase functions deploy <name> --no-verify-jwt`

---

## Key Patterns

### Supabase to Public Page
```javascript
// 1. Load from Supabase
var { data, error } = await supabaseClient.from('table').select('*');
if (data && data.length) {
    renderCards(data);
} else {
    // 2. Fall back to static data
    renderCards(window.staticData);
}
```

### Role-based Access
- **Guest** — public pages, limited rankings (blur)
- **Registered** — dashboard, full rankings, battle voting
- **Member** — tournament registration, challenges, challenge board, loyalty
- **Manager** — CRUD for news/tournaments/courts/coaches + battles + live
- **Admin** — everything + users + memberships + rankings + settings

### Edge Function Call from Frontend
```javascript
var session = await supabaseClient.auth.getSession();
var token = session.data.session.access_token;
var res = await fetch(SUPABASE_URL + '/functions/v1/<name>', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY           // REQUIRED
    },
    body: JSON.stringify({ ... })
});
```

---

## Supabase

### Tables (main)
| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (auth) |
| `players` | Player cards (rankings) |
| `tournaments` | Tournaments |
| `tournament_registrations` | Tournament registrations |
| `matches` | Tournament matches (tournament / duel) |
| `categories` | Player categories (Tour → Pro-Masters) |
| `courts` | Courts |
| `coaches` | Coaches |
| `news` | News |
| `challenges` | Match challenges + battles |
| `challenge_predictions` | Battle votes |
| `memberships` | Memberships |
| `entity_payments` | Payments (membership/court/coach/club) |
| `live_matches` | Live matches |
| `loyalty_rules` | Loyalty rules |
| `loyalty_rewards` | Loyalty rewards |
| `loyalty_transactions` | Points transactions |
| `discount_vouchers` | Discount vouchers |

### Edge Functions (15 total)
| Function | Purpose |
|----------|---------|
| `admin-manage-user` | Create manager, ban/unban, delete |
| `auto-unban` | Auto-unban via pg_cron |
| `battle-announce` | Battle announcement to TG group |
| `battle-publish` | Publish battle + TG inline voting |
| `broadcast` | Universal Email/TG broadcast |
| `create-challenge` | Create a match challenge |
| `match-notify` | Match notifications |
| `membership-expire` | Auto-expire memberships |
| `membership-notify` | Membership reminders |
| `membership-tg-notify` | TG DM on membership grant/revoke |
| `send-email` | Email via Resend |
| `send-game-invite` | Game invitation |
| `telegram-webhook` | Telegram bot webhook |
| `tournament-notify` | Tournament announcement to TG |
| `tournament-reminder` | Tournament reminder |

### SQL Migrations
All migrations are in the `sql/` folder (64 files). Run them in the **Supabase SQL Editor**.

---

## Deployment

### Frontend (Netlify)
- Push to `main` → GitHub Actions → tests → auto-deploy
- No build configuration needed (static site)

### Edge Functions
```bash
supabase functions deploy <name> --no-verify-jwt
```

### Secrets (Supabase Dashboard → Edge Functions → Secrets)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_CHAT_ID`
- `CRON_SECRET`
- `RESEND_API_KEY`

---

## Useful Links

- [docs/TECHNICAL.md](docs/TECHNICAL.md) — full technical documentation (RU)
- [docs/TECHNICAL-EN.md](docs/TECHNICAL-EN.md) — full technical documentation (EN)
- [docs/MANAGER-GUIDE.md](docs/MANAGER-GUIDE.md) — manager guide (RU)
- [docs/MANAGER-GUIDE-EN.md](docs/MANAGER-GUIDE-EN.md) — manager guide (EN)
- [docs/API.md](docs/API.md) — API documentation
