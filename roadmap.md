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

### 3.2 Payments ✅
- [x] Payment history in dashboard (via Finances section)
- [x] Admin Finances: manual payment recording (membership, court, coach, club)

### 3.3 Notifications ✅
- [x] Telegram bot: tournament registration announcements to group
- [x] Telegram bot: inline registration (callback query)
- [x] pg_cron: auto-notify when registration opens (daily)
- [x] Настройка уведомлений: opt-out по 4 категориям × 2 канала (TG + Email)
- [x] Email templates (Resend) + broadcast from admin
- [x] Tournament reminders + payment reminders

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

## Phase 6 — Documentation ✅

- [x] Technical docs (docs/TECHNICAL.md)
- [x] Manager guide v5.0 (docs/MANAGER-GUIDE.md)
- [x] Tournament rules and regulations (rules.html)
- [x] Membership terms and conditions (offer.html)

## Phase 7 — Refactoring ✅

### 7.1 Admin Refactoring ✅
- [x] Split admin.js (15,000+ lines) into 14 modular files (js/admin/)
- [x] Shared namespace window.KSLT_ADMIN, consolidated utilities
- [x] Tab consolidation: 11 tabs → 10 tabs
- [x] Users funnel analytics: conversion cards + chart

## Loyalty Program ✅

- [x] Points system: earn points for participation, services
- [x] Auto-earn on payment (court, coach, membership) + tournament finalization
- [x] Welcome bonus: first membership → 200 points (one-time)
- [x] Redeem points for rewards (tournament entry, membership)
- [x] Points balance + history in dashboard
- [x] Admin: manage rules (CRUD), rewards (CRUD), transactions, manual adjust
- [x] Points expiry: auto-expire after 12 months (pg_cron)
- [x] RLS: staff full CRUD, users read own + redeem
- [x] Loyalty tab in user dropdown + admin dropdown
- [x] 3 languages: RU, EN, KG
- [x] Vouchers renamed to Discounts (all 3 languages)
- [x] Broadcast modal: removed tournament audience, fixed styling
- [x] Admin dashboard cards: compact layout
- [x] All modals: unified dark theme (--bg-card), proper ad-field-input classes

## Auth & Security ✅

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

## Infrastructure ✅

- [x] Kyrgyz language (KG) — all 20+ pages

---

## Challenge Battle Page ✅

- [x] SQL: ALTER challenges (battle_title, battle_published, voting_closed) + challenge_predictions table
- [x] RPC: get_battle_public(), get_battle_votes(), cast_battle_vote() + RLS
- [x] Public page: challenge.html (RU/EN/KG) — VS layout, voting, H2H, score
- [x] JS: challenge-detail.js (IIFE) — load battle, render hero/voting/details/h2h/score
- [x] CSS: challenge-detail.css (ch- prefix) — responsive VS layout, voting bar, score display
- [x] Admin section: challenges.js — accepted/published tabs, publish modal, score modal
- [x] Edge Function: battle-publish — JWT auth, TG announcement with inline voting buttons, retry, notify_only mode
- [x] Telegram webhook: handleBattleVote — vote via inline buttons, update buttons with % after vote
- [x] Admin sidebar: challenges section (swords icon) for admin + manager
- [x] Battle cards: dark theme grid (3 columns desktop, 2 tablet, 1 mobile), banner as inner image
- [x] One-time voting: no vote changes allowed (site + TG)
- [x] Cross-check voting: site ↔ telegram (same person can't vote twice via different channels)
- [x] Auto-close voting: when match date/time arrives (Asia/Bishkek timezone)
- [x] TG inline buttons: short callback_data (bv:UUID:1|2), vote counts + % shown after voting
- [x] Admin: delete battle, clickable title, broadcast tracking (battle_notified_at)
- [x] Breadcrumb: sticky back navigation (from home or tournaments), replaces old back link
- [x] Score modal: closes only on success, button re-enables on error
- [x] Match finalization: Save Draft + Finalize Match (two-step), player wins/losses/form update
- [x] Match type: tournament vs duel — duel matches separated from tournament stats
- [x] Completed tab in admin challenges section
- [x] H2H duel label on challenge detail page

## Admin Dashboard Improvements ✅

- [x] Pending Registrations: quick approve/reject buttons on dashboard
- [x] Pending Registrations: clickable tournament → bracket management
- [x] Pending Registrations: clickable player → player edit form
- [x] Pending Registrations: added Category and Rating columns
- [x] Rejected registrations tab in tournament bracket (admin only)

## Player Profile Improvements ✅

- [x] Reordered sections: Matches → Challenges → Tournaments → Achievements (bottom)
- [x] Filtered duel matches from Matches section (duels only in Challenges)
- [x] Applied to both dashboard (personal) and player.html (public profile)

## Live Match System ✅

- [x] YouTube Live stream integration (embed on live-match page, URL field in admin)
- [x] Live Score: real-time match scoreboard (umpire panel, scoreboard OBS, public page)
- [x] Umpire engine: full tennis scoring (games, sets, tiebreak, deuce, AD)
- [x] Serve indicator (🎾) + first serve choice before match
- [x] Changeover rest timer (3 min game / 5 min set) with skip button
- [x] Admin: create live from Free match / Tournament bracket / Battle
- [x] Auto-record completed free matches as challenges (partial player support)
- [x] Live cards on homepage (RU/EN/KG) with realtime refresh (15s)
- [x] Score sync: live → tournament bracket (manual) on completion
- [x] OBS Scoreboard overlay (transparent, auto-detect active match, sponsor + KSLT logos)

## E2E Testing ✅

- [x] Playwright setup (9 test suites, 603 tests, 3 viewports: desktop/tablet/mobile)
- [x] Page loading: all 63 pages (RU/EN/KG) — HTTP 200, no JS errors
- [x] Navigation: header links, language switcher, footer
- [x] Responsive: horizontal overflow check (5 breakpoints × 9 pages)
- [x] CSS/JS integrity: no 404 for resources, dark theme, Inter font
- [x] Auth page: form elements, Google OAuth, validation
- [x] PWA: manifest, service worker, meta tags, icons
- [x] SEO: title, lang attribute, charset, accessibility
- [x] Content pages: About, FAQ, Rules, Pricing, etc.
- [x] Bug fixes found by tests: tournaments-en JS crash, homepage overflow, image constraints

## Техдолг ✅

- [x] CI/CD: GitHub Actions — E2E tests on push/PR + auto-deploy to Netlify
- [x] API documentation v2.0 (31 tables, 28 RPCs, 15 Edge Functions, RLS matrix, Telegram bot, cron jobs)

## Идеи для реализации

- Online payments: provider integration (Mbank / PayBox), payment page, webhooks
- Recurring payments: auto-renewal memberships
- SMS integration (Nikita.kg / Twilio) — verification, notifications
- Shop / merchandise (catalog, cart, orders, admin)
