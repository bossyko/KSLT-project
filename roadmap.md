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
- [x] Telegram bot: tournament registration announcements to group
- [x] Telegram bot: inline registration (callback query)
- [x] pg_cron: auto-notify when registration opens (daily)
- [ ] Tournament reminders: за 3 дня + за 1 день до турнира (Telegram + email)
- [ ] Настройка уведомлений: игрок может отключить напоминания (Telegram / email / оба)
- [ ] Email templates (Resend)
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
- [x] Fix homepage tournament layout (featured card: info on right)

### 4.4 Vouchers & Reports ✅
- [x] Vouchers admin section: dashboard (total issued, total discount sum), table with filters/sort/pagination, detail modal, cancel (admin only)
- [x] Period filter (all time / this month / last month / custom) for vouchers, payments, memberships, users
- [x] PDF report export (print-ready) for vouchers, payments, memberships, users
- [x] Payments stats: active, expired, this month, total amount
- [x] Memberships stats: total, active, expired, expiring soon
- [x] User analytics: stat cards (total, members, telegram, banned, deleted, admins, managers, new this month) + current month growth chart (Chart.js)
- [x] Deleted accounts tracking (PostgreSQL trigger + admin visibility)
- [ ] Excel export
- [ ] Debtors list + auto-block

### 4.5 Automation
- [x] Telegram tournament notify button in admin (manual broadcast)
- [ ] Auto-block debtors
- [ ] Mass email / SMS campaigns

## Phase 5 — Additional Features

- [ ] AI chatbot (Claude/OpenAI, knowledge base, chat widget)
- [ ] Court booking system (calendar, payments, reminders)
- [ ] Auto-scheduling: авто-распределение матчей по кортам и времени (корты, интервалы, конфликты игроков)
- [ ] Shop / merchandise (catalog, cart, orders, admin)
- [ ] PWA (Service Worker, offline mode, push notifications)
- [ ] Coach reviews (ratings + comments from members)

## Phase 6 — Documentation

- [x] Technical docs (docs/TECHNICAL.md)
- [x] Manager guide (docs/MANAGER-GUIDE.md)
- [x] Tournament rules and regulations (rules.html)
- [x] Membership terms and conditions (offer.html)
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

## Loyalty Program (Backlog)

- [ ] Points system: earn points for tournament participation, using site services (booking, membership, etc.)
- [ ] Redeem points for tournament entry, court booking, or other benefits
- [ ] Points balance in dashboard
- [ ] Points history (earned / spent)
- [ ] Admin: manage point rules (how many points per action)

## Auth & Security (Backlog)

- [ ] Two-step password reset: email (existing) + SMS code verification
- [ ] SMS verification provider (Twilio / Nikita.kg)

### User Ban & Moderation System
- [ ] Temp ban (1d / 3d / 7d / 30d) — Supabase `ban_duration` + auto-unban
- [ ] Permanent ban — Supabase `banned_until` forever
- [ ] Early unban — restore access from admin panel
- [ ] Telegram restrict on ban (read-only in group, no tournament registration via bot)
- [ ] Telegram kick on delete (full removal from group)
- [ ] Ban UI in admin Users section (status badge, ban/unban buttons, duration modal)
- [ ] Ban reason field (optional, stored in profiles)
- [ ] Edge Function: ban_user, unban_user actions in admin-manage-user

## Infrastructure (Backlog)

- [ ] Kyrgyz language (KG) — complete all pages
- [ ] Remove Co-Authored-By from old git commits (rebase)
