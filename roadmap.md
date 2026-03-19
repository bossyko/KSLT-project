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

### 3.1 Membership ✅
- [x] Pricing page
- [x] membership.js — checkMembership() (active/expired/guest detection)
- [x] Real membership logic (tables, access control, tournament registration block)
- [x] 3-tier access: guest → registered (full rating) → member (tournaments, challenges)
- [x] Membership creation through Finances (admin) + Telegram bot
- [x] Auto-expire cron (daily 03:30 UTC) — sets status='expired'
- [x] 7-day expiry reminder (daily 04:00 UTC) — TG + email
- [x] Notification on expiry — TG + email
- [x] Dashboard: overdue + approaching tables, stat cards
- [x] User dashboard: membership status card + renewal prompt

### 3.2 Payments
- [ ] Payment provider integration (Mbank / PayBox)
- [ ] Payment page + webhook processing
- [x] Payment history in dashboard (via Finances section)
- [ ] Recurring payments (auto-renewal)

### 3.3 Notifications
- [x] Telegram bot: tournament registration announcements to group
- [x] Telegram bot: inline registration (callback query)
- [x] pg_cron: auto-notify when registration opens (daily)
- [x] Настройка уведомлений: opt-out по 4 категориям × 2 канала (TG + Email)
- [x] Email templates (Resend) + broadcast from admin
- [x] Tournament reminders + payment reminders
- [ ] SMS integration (Nikita.kg)
- [ ] Push notifications

## Phase 4 — Admin Panel + Reports ✅

- [x] Admin panel layout + role-based access (admin / manager)
- [x] CRUD: news, tournaments, players, courts, coaches, users, finances
- [x] Tournament brackets (SE / FIC / Group Stage) + ITF seeding + auto-scoring
- [x] News: inline photos, polls, autosave, view counter
- [x] Dashboard: 10 stat cards + 6 activity tables + challenges card
- [x] Bulk delete, pagination, promoted listings, sponsors blocks
- [x] Public pages loading from Supabase with static fallback
- [x] Fix homepage tournament layout (featured card: info on right)

### 4.4 Vouchers & Reports ✅
- [x] Vouchers admin section: dashboard, table with filters/sort/pagination, detail modal, cancel (admin only)
- [x] Period filter (all time / this month / last month / custom) for all sections
- [x] PDF report export (print-ready) for vouchers, payments, users
- [x] Excel/CSV export for vouchers, payments, users (UTF-8 BOM for Excel compatibility)
- [x] Payments stats: active, expired, this month, total amount
- [x] Payment dynamics chart (12 months, 4 lines: membership/court/coach/club)
- [x] User analytics: stat cards + growth chart (Chart.js)
- [x] Deleted accounts tracking (PostgreSQL trigger + admin visibility)

### 4.5 Finances ✅
- [x] Unified finances: entity_payments + membership payments in one table
- [x] Entity types: Membership, Court, Coach, Club (KSLT)
- [x] Membership creation: profile search (profiles + players), period presets (1/3/6/12 мес), 0 KGS with mandatory note
- [x] Club type: sponsorship/grant money, free text "From", transaction date
- [x] Promoted auto-sync (court/coach promoted badge based on active payments)
- [x] Sticky "Add Payment" button, date filter with presets
- [x] Payment dynamics chart by category (Chart.js)

### 4.6 Automation ✅
- [x] Telegram tournament notify button in admin (manual broadcast)
- [x] Auto-expire memberships (cron + Edge Function)
- [x] Auto-unban expired bans (cron + TG notification)

## Phase 5 — Additional Features

### Challenge Board — Этап 1 ✅
- [x] SQL: таблица challenges + RLS + RPC + pg_cron expire (72ч)
- [x] Edge Function create-challenge (JWT auth, membership check, 5/day limit)
- [x] Challenge modal on player profile
- [x] Telegram: accept/counter/decline callbacks + counter-step flow
- [x] Dashboard: challenges tab (RPC, status colors, direction)
- [x] Admin dashboard: challenges stat card (active count)

### Challenge Board — Этап 2 (Backlog)
- [ ] Challenge match page + prediction
- [ ] Challenge results + rating impact

### Auto-scheduling ✅
- [x] Match distribution by courts (wave system: courtIndex = i % courtCount)
- [x] Auto time calculation (waveStart + duration + buffer between rounds)
- [x] Match Notify via Telegram (pg_cron + manual broadcast)

### PWA ✅
- [x] manifest.json (standalone, dark theme, icons)
- [x] Service Worker (pre-cache core assets, Network First HTML, Cache First CSS/JS/images)
- [x] PWA icons (192, 512, apple-touch-icon) from favicon.svg
- [x] Meta tags in all 68 HTML files (manifest, theme-color, apple-touch-icon)
- [x] Installable on desktop (Chrome) + mobile (Android/iOS)

### Other (Backlog)
- [ ] Shop / merchandise (catalog, cart, orders, admin)

## Phase 6 — Documentation ✅

- [x] Technical docs (docs/TECHNICAL.md)
- [x] Manager guide v5.0 (docs/MANAGER-GUIDE.md)
- [x] Tournament rules and regulations (rules.html)
- [x] Membership terms and conditions (offer.html)
- [ ] API documentation (Supabase schema, RLS, endpoints)

## Phase 7 — Refactoring + QA + CI/CD

### 7.1 Admin Refactoring ✅
- [x] Split admin.js (15,000+ lines) into 14 modular files (js/admin/)
- [x] Shared namespace window.KSLT_ADMIN, consolidated utilities
- [x] Tab consolidation: 11 tabs → 10 tabs
- [x] Users funnel analytics: conversion cards + chart

### 7.2 QA Automation
- [ ] E2E testing framework (Cypress / Playwright)
- [ ] Tests: auth, dashboard, navigation, ratings, admin CRUD

### 7.3 CI/CD
- [ ] GitHub Actions: linting (ESLint) on PR
- [ ] GitHub Actions: auto-run E2E tests
- [ ] Auto-deploy to Netlify
- [ ] Test status badge in README

## Loyalty Program (Backlog)

- [ ] Points system: earn points for participation, services
- [ ] Redeem points for tournament entry, court booking
- [ ] Points balance + history in dashboard
- [ ] Admin: manage point rules

## Auth & Security (Backlog)

- [ ] Two-step password reset: email + SMS code
- [ ] SMS verification provider (Twilio / Nikita.kg)

### User Ban & Moderation System ✅
- [x] Temp ban (7d / 30d / 90d / 1y / custom) + permanent ban
- [x] Early unban from admin panel (players + users)
- [x] Telegram DM on ban/unban + restrict/kick in group
- [x] Ban UI in admin Players + Users sections
- [x] Manager can ban/delete regular users (role=user only)
- [x] Ban check: tournament registration blocked (site + Telegram)
- [x] Ban badge on public rating pages (RU/EN/KG)
- [x] Auto-unban by pg_cron when ban expires + TG notification

### Admin Player Form Improvements ✅
- [x] Split Name into First Name + Last Name (per language tab)
- [x] Rectangular photo with accent border (140×180px)
- [x] Bio → Motto (single input, max 100 chars)
- [x] Telegram + Instagram from linked profile (read-only)
- [x] Last Matches table (auto from matches)
- [x] Remove manual W/L toggles (auto-computed from last 5 matches)

## Infrastructure (Backlog)

- [x] Kyrgyz language (KG) — all 20+ pages
- [ ] Remove Co-Authored-By from old git commits (rebase)
