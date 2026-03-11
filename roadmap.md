# KSLT — Roadmap

## Phase 1 — Frontend + UX ✅

- [x] All pages (tournaments, news, rankings, coaches, courts, auth, dashboard, etc.)
- [x] Responsive design (375/480/768/992px)
- [x] Mobile menu, touch optimization, global search

## Phase 2 — Backend + Auth + Dashboard ✅

- [x] Supabase (PostgreSQL, RLS, Auth, Storage)
- [x] Email/password + Google OAuth
- [x] Password reset (email)
- [x] Dashboard (profile, avatar crop, stats, settings)

## Phase 3 — Membership, Payments, Notifications

### 3.1 Membership (stub done)
- [x] Pricing page
- [x] membership.js — checkMembership() stub
- [ ] Real membership logic (tables, access control, tournament registration block)

### 3.2 Payments
- [ ] Payment provider integration (Mbank / PayBox)
- [ ] Payment page + webhook processing
- [ ] Payment history in dashboard
- [ ] Recurring payments (auto-renewal)

### 3.3 Notifications
- [ ] Email templates (Resend)
- [ ] Cron job for reminders
- [ ] SMS integration (Nikita.kg)
- [ ] Push notifications

## Phase 4 — Admin Panel + Reports ✅

- [x] Admin panel layout + role-based access (admin / manager)
- [x] CRUD: news, tournaments, players, courts, coaches, users, payments, memberships
- [x] Tournament brackets (SE / FIC / Group Stage) + ITF seeding + auto-scoring
- [x] News: inline photos, polls, autosave, view counter
- [x] Dashboard: 9 stat cards + 6 activity tables
- [x] Bulk delete, pagination, promoted listings, sponsors blocks
- [x] Public pages loading from Supabase with static fallback
- [ ] Fix homepage tournament layout (featured card: info on right)

### 4.4 Financial Reports (waiting for Phase 3)
- [ ] Payments table with filters and search
- [ ] Monthly reports, debtors list
- [ ] Excel export
- [ ] Charts and analytics

### 4.5 Automation
- [ ] Auto-block debtors
- [ ] Mass email / SMS campaigns

## Phase 5 — Additional Features

- [ ] AI chatbot (Claude/OpenAI, knowledge base, chat widget)
- [ ] Court booking system (calendar, payments, reminders)
- [ ] Shop / merchandise (catalog, cart, orders, admin)
- [ ] PWA (Service Worker, offline mode, push notifications)
- [ ] Coach reviews (ratings + comments from members)

## Phase 6 — Documentation

- [x] Technical docs (docs/TECHNICAL.md)
- [x] Manager guide (docs/MANAGER-GUIDE.md)
- [ ] Tournament rules and regulations
- [ ] Membership terms and conditions
- [ ] API documentation (Supabase schema, RLS, endpoints)

## Phase 7 — Refactoring + QA + CI/CD

### 7.1 Admin Refactoring ✅
- [x] Split admin.js (15,000+ lines) into 14 modular files (js/admin/)
- [x] Shared namespace window.KSLT_ADMIN, consolidated utilities

### 7.2 QA Automation
- [ ] E2E testing framework (Cypress / Playwright)
- [ ] Tests: auth, dashboard, navigation, ratings, admin CRUD

### 7.3 CI/CD
- [ ] GitHub Actions: linting (ESLint) on PR
- [ ] GitHub Actions: auto-run E2E tests
- [ ] Auto-deploy to Netlify
- [ ] Test status badge in README

## Auth & Security (Backlog)

- [ ] Two-step password reset: email (existing) + SMS code verification
- [ ] SMS verification provider (Twilio / Nikita.kg)

## Infrastructure (Backlog)

- [ ] Kyrgyz language (KG) — complete all pages
- [ ] Remove Co-Authored-By from old git commits (rebase)
