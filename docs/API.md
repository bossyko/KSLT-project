# KSLT API Documentation

Complete backend architecture reference for the Kyrgyzstan Social Lawn Tennis community platform.

**Version:** 2.0 | **Updated:** 2026-03-23 | **Tables:** 31 | **RPCs:** 28 | **Edge Functions:** 15

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Database Schema](#3-database-schema)
4. [Row Level Security (RLS)](#4-row-level-security)
5. [RPC Functions](#5-rpc-functions)
6. [Edge Functions](#6-edge-functions)
7. [Storage](#7-storage)
8. [Realtime & Cron](#8-realtime--cron)
9. [Telegram Bot](#9-telegram-bot)
10. [Environment Variables](#10-environment-variables)

---

## 1. Overview

KSLT backend runs entirely on **Supabase** — an open-source Firebase alternative built on top of PostgreSQL.

### Stack

| Layer | Technology |
|-------|-----------|
| Database | PostgreSQL 15 (hosted by Supabase) |
| Auth | Supabase Auth (email/password + Google OAuth) |
| Storage | Supabase Storage (S3-compatible) |
| Serverless | Supabase Edge Functions (Deno runtime) |
| Security | Row Level Security (RLS) on every table |
| Notifications | Telegram Bot API + Resend (email) |
| Client SDK | `@supabase/supabase-js` v2 (CDN) |

### Architecture

```
Browser → Supabase JS SDK (anon key + JWT) → PostgreSQL (RLS enforcement)
                                            → Edge Functions (business logic)
                                            → Storage (avatars, news images)

pg_cron → Edge Functions (scheduled tasks) → Telegram Bot API
                                            → Resend Email API
```

### Security Model

Two-level protection:
1. **UI layer** — admin panel hides actions based on `currentRole`
2. **Database layer** — RLS policies enforce access rules regardless of client

The anon key is safe to expose — it only grants permissions defined by RLS policies.

---

## 2. Authentication

### Providers

| Provider | Method |
|----------|--------|
| Email/Password | `auth.signInWithPassword()` / `auth.signUp()` |
| Google OAuth | `auth.signInWithOAuth({ provider: 'google' })` |
| Password Reset | `auth.resetPasswordForEmail()` → `auth.updateUser()` |

### Roles

| Role | Access Level |
|------|-------------|
| `user` | Default. Profile, dashboard, public data |
| `manager` | Content CRUD (news, tournaments, courts, coaches, payments) |
| `admin` | Full access — user management, ratings, player cards, memberships |

Roles stored in `profiles.role`. Checked via `is_admin()` and `is_staff()` SQL functions (SECURITY DEFINER).

### Auth Flow

```
Sign Up:
1. RPC check_registration_available(email, phone) — pre-validate uniqueness
2. auth.signUp() with email, password, metadata
3. Supabase creates auth.users row, sends confirmation email
4. Trigger handle_new_user() auto-creates profiles row
5. User confirms email → account activated

Sign In:
1. auth.signInWithPassword() → JWT (access_token + refresh_token)
2. SDK stores tokens in localStorage, auto-refreshes on expiry
3. Client updates last_seen on profile

Google OAuth:
1. auth.signInWithOAuth({ provider: 'google' })
2. Redirect to Google → back with token in URL hash
3. Trigger creates profile on first login

Password Reset:
1. auth.resetPasswordForEmail(email)
2. User clicks link → PASSWORD_RECOVERY event
3. auth.updateUser({ password })
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one digit
- At least one special character

---

## 3. Database Schema

31 tables organized into 9 groups.

### 3.1 Core — Users & Players

#### `profiles`

User accounts. Auto-created on registration via trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | = auth.users.id |
| `email` | TEXT | From auth metadata |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | Storage URL |
| `phone` | TEXT | UNIQUE, format: +996XXXXXXXXX |
| `gender` | TEXT | |
| `birth_day` / `birth_month` / `birth_year` | INT | Date of birth |
| `player_id` | TEXT FK → players | Link to player card (nullable) |
| `role` | TEXT | `'user'` \| `'manager'` \| `'admin'` |
| `last_seen` | TIMESTAMPTZ | Updated each session |
| `play_level` | TEXT | `'beginner'` \| `'intermediate'` \| `'advanced'` |
| `preferred_time` | TEXT | `'morning'` \| `'afternoon'` \| `'evening'` \| `'weekend'` |
| `instagram` / `telegram` | TEXT | Social handles |
| `telegram_chat_id` | BIGINT | UNIQUE. Telegram bot link |
| `show_socials` | BOOL | Privacy toggle |
| `notify_preferences` | JSONB | `{tg: {membership, tournaments, matches, challenges}, email: {...}}` |
| `banned_until` | TIMESTAMP | null = not banned, 2099 = permanent |
| `ban_reason` | TEXT | |
| `created_at` / `updated_at` | TIMESTAMPTZ | |

#### `players`

KSLT member cards for the ranking system. Created manually by admin.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `'asanov-timur'` |
| `name` / `name_en` / `name_kg` | TEXT | Full name (3 languages) |
| `photo` | TEXT | Avatar URL |
| `category_id` | TEXT FK → categories | Skill category |
| `points` | INT | Current ranking points |
| `wins` / `losses` | INT | Career stats |
| `rank_change` | INT | Position delta |
| `form` | TEXT[] | Last 5 results: `{'W','W','L','W','W'}` |
| `bio` / `bio_en` / `bio_kg` | TEXT | Motto (max 100 chars) |
| `phone` / `email` | TEXT | Contact info |
| `show_phone` | BOOL | |
| `ntrp_rating` | NUMERIC(3,1) | 1.0–7.0 scale |
| `view_count` | INT | Profile page views |
| `banned_until` / `ban_reason` | | Same as profiles |

#### `categories`

Player skill categories.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `'men-promasters'` |
| `name` / `name_en` / `name_kg` | TEXT | |
| `gender` | TEXT | `'men'` \| `'women'` |
| `sort_order` | INT | |

9 categories: Tour → Futures → Challenger → Masters → Pro-Masters (per gender).

#### `deleted_accounts`

Audit trail for deleted user accounts. Populated automatically by trigger.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID | Copy from deleted profile |
| `full_name` / `email` / `role` / `phone` | TEXT | |
| `telegram_chat_id` | TEXT | |
| `player_id` | TEXT | |
| `had_membership` | BOOL | |
| `deleted_at` | TIMESTAMPTZ | |
| `reason` | TEXT | |

### 3.2 Tournaments & Matches

#### `tournaments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug |
| `name` / `name_en` / `name_kg` | TEXT | |
| `description` / `description_en` / `description_kg` | TEXT | |
| `start_date` / `end_date` | DATE | |
| `status` | TEXT | `upcoming` → `registration_open` → `registration_closed` → `ongoing` → `completed` \| `cancelled` |
| `category_id` | TEXT FK → categories | |
| `level_id` | UUID FK → tournament_levels | Points tier |
| `court_id` | TEXT FK → courts | Venue |
| `draw_size` | INT | 8, 16, or 32 |
| `bracket_type` | TEXT | `'single_elimination'` \| `'round_robin'` |
| `court_count` | INT | Default: 2 |
| `match_duration` | INT | Minutes, default: 90 |
| `registration_start` / `registration_end` | DATE | |
| `group_count` | INT | For round-robin |
| `qualifiers_per_group` | INT | Default: 2 |
| `published_at` | TIMESTAMPTZ | null = draft |
| `notified_at` | TIMESTAMPTZ | TG notification dedup |
| `reminded_3d_at` / `reminded_1d_at` | TIMESTAMPTZ | Reminder dedup |
| `view_count` | INT | |

#### `tournament_levels`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `name` / `name_en` | TEXT | |
| `sort_order` | INT | |

5 levels: Category 1, 2, 3, 4, Grand Slam (ТБШ).

#### `points_rules`

Points awarded per round per tournament level. UNIQUE(level_id, round).

| Round | Cat.1 | Cat.2 | Cat.3 | Cat.4 | Grand Slam |
|-------|-------|-------|-------|-------|------------|
| W | 25 | 50 | 100 | 200 | 400 |
| F | 15 | 30 | 65 | 130 | 250 |
| SF | 8 | 18 | 36 | 70 | 150 |
| QF | 4 | 9 | 18 | 35 | 75 |
| R16 | 2 | 4 | 9 | 18 | 35 |
| R32 | 0 | 2 | 4 | 9 | 18 |

#### `tournament_registrations`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `tournament_id` | TEXT FK → tournaments | ON DELETE CASCADE |
| `player_id` | TEXT FK → players | ON DELETE CASCADE |
| `seed_number` | INT | 1–8, null = unseeded |
| `draw_position` | INT | 1–32, null = not drawn |
| `group_number` | INT | For round-robin |
| `status` | TEXT | `pending` → `approved` → `rejected` \| `withdrawn` \| `waitlist` |

UNIQUE(tournament_id, player_id).

#### `matches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `tournament_id` | TEXT FK → tournaments | ON DELETE CASCADE |
| `player1_id` / `player2_id` | TEXT FK → players | |
| `winner_id` | TEXT | |
| `score` | TEXT | `'6/4 7/6'` |
| `round_number` | INT | 1=R1, 2=QF, 3=SF, 4=F |
| `match_order` | INT | Position in bracket |
| `group_number` | INT | For round-robin |
| `court` | INT | Court number |
| `scheduled_time` | TEXT | `'HH:MM'` |
| `scheduled_day` | DATE | |
| `status` | TEXT | `upcoming` \| `live` \| `completed` |
| `match_type` | TEXT | `'tournament'` \| `'duel'` |
| `seed1` / `seed2` | INT | |
| `notified_at` | TIMESTAMPTZ | Start notification dedup |

#### `tournament_results`

Historical results for ranking points calculation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `tournament_id` | TEXT FK | |
| `player_id` | TEXT FK | |
| `round_reached` | TEXT | `'W'` \| `'F'` \| `'SF'` \| `'QF'` \| `'R16'` \| `'R32'` |
| `points_earned` | INT | |
| `season` | INT | Calendar year |
| `category_id` | TEXT FK | Player's category at time |
| `is_transition` | BOOL | Category change flag |

UNIQUE(tournament_id, player_id).

#### `player_promotions`

Top-5 in category → promoted to next tier.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `player_id` | TEXT FK | |
| `from_category_id` / `to_category_id` | TEXT FK | |
| `season` | INT | |
| `status` | TEXT | `'eligible'` → `'completed'` |

#### `rating_history`

Player point/NTRP change log.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `player_id` | TEXT FK | |
| `tournament_name` | TEXT | |
| `tournament_id` | TEXT FK | nullable |
| `points_earned` | INT | |
| `ntrp_before` / `ntrp_after` | NUMERIC(4,2) | |
| `recorded_at` | DATE | |

### 3.3 Badges

#### `badge_definitions`

27 predefined badges (first_match, champion, veteran_3, dominator, etc.).

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | `'champion'`, `'first_win'` |
| `icon` | TEXT | Emoji |
| `name` / `name_en` / `name_kg` | TEXT | |
| `description` / `description_en` / `description_kg` | TEXT | |
| `condition_type` | TEXT | `matches_played` \| `wins` \| `champion` \| `streak` \| `rank` \| `manual` etc. |
| `condition_value` | INT | |
| `sort_order` | INT | |

#### `player_badges`

UNIQUE(player_id, badge_id). Auto-awarded via trigger on players update.

### 3.4 Challenges & Battles

#### `challenges`

Head-to-head match invitations with optional public battle page.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `challenger_id` | UUID FK → profiles | nullable (auto-live) |
| `challenger_player_id` / `opponent_player_id` | TEXT FK → players | |
| `opponent_profile_id` | UUID FK → profiles | nullable |
| `proposed_date` / `proposed_time` / `proposed_venue` | | Initial proposal |
| `proposed_court_id` | TEXT FK → courts | |
| `message` | TEXT | Max 150 chars |
| `counter_date` / `counter_time` / `counter_venue` | | Counter-proposal |
| `counter_court_id` | TEXT | |
| `counter_step` | TEXT | `'date'` \| `'time'` \| `'venue'` \| null |
| `status` | TEXT | `active` → `negotiating` \| `countered` \| `accepted` → `completed` \| `declined` \| `expired` |
| `match_id` | UUID FK → matches | |
| `expires_at` | TIMESTAMPTZ | Default: now() + 72h |
| `battle_title` | TEXT | Public title |
| `battle_published` | BOOL | |
| `voting_closed` | BOOL | |
| `banner_url` | TEXT | Battle page banner |
| `battle_notified_at` | TIMESTAMPTZ | TG announcement dedup |
| `score_draft` | TEXT | Auto-created from live |
| `live_match_id` | UUID FK → live_matches | |

#### `challenge_predictions`

Battle voting. UNIQUE(challenge_id, voter_type, voter_id).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `challenge_id` | UUID FK → challenges | |
| `voter_type` | TEXT | `'site'` \| `'telegram'` |
| `voter_id` | TEXT | UUID (site) or chat_id (TG) |
| `predicted_winner_id` | TEXT FK → players | |

### 3.5 Live Matches

#### `live_matches`

Real-time match scoreboard. Added to Supabase Realtime publication.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `match_id` | UUID FK → matches | nullable |
| `player1_id` / `player2_id` | TEXT FK → players | |
| `player1_name` / `player2_name` | TEXT | Fallback names |
| `best_of` | INT | 1 \| 3 \| 5 (default: 3) |
| `youtube_url` | TEXT | Live stream |
| `umpire_key` | TEXT | UNIQUE, random hex |
| `serving_player` | INT | 1 \| 2 |
| `points_p1` / `points_p2` | TEXT | `'0'` \| `'15'` \| `'30'` \| `'40'` \| `'D'` |
| `current_set` | INT | |
| `sets_data` | JSONB | `[{games_p1, games_p2, tiebreak_p1?, tiebreak_p2?}]` |
| `current_game_p1` / `current_game_p2` | INT | Games in current set |
| `is_tiebreak` | BOOL | |
| `tiebreak_p1` / `tiebreak_p2` | INT | |
| `status` | TEXT | `warmup` → `live` → `paused` → `completed` |
| `winner_player` | INT | 1 \| 2 |
| `final_score` | TEXT | `'6/4 7/6'` |
| `history` | JSONB | Point-by-point history |
| `tournament_label` | TEXT | |
| `started_at` / `completed_at` | TIMESTAMPTZ | |

### 3.6 Memberships & Payments

#### `memberships`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | |
| `status` | TEXT | `'active'` \| `'expired'` \| `'cancelled'` |
| `period_months` | INT | |
| `amount` | NUMERIC(10,2) | |
| `currency` | TEXT | Default: `'KGS'` |
| `payment_method` | TEXT | `'cash'` \| `'transfer'` \| `'card'` |
| `expires_at` | TIMESTAMPTZ | |
| `created_by` | UUID FK → profiles | Admin who issued |
| `note` | TEXT | |

#### `entity_payments`

Financial tracking (courts, coaches, players, club/KSLT).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `entity_type` | TEXT | `'court'` \| `'coach'` \| `'player'` \| `'club'` |
| `entity_id` / `entity_name` | TEXT | |
| `amount` | NUMERIC | Default: 0 |
| `currency` | TEXT | Default: `'KGS'` |
| `period_start` / `period_end` | DATE | |
| `payment_method` | TEXT | `'cash'` \| `'transfer'` \| `'card'` |
| `purpose` | TEXT | `'promoted'` \| `'sponsorship'` \| `'rental'` \| `'other'` |
| `note` | TEXT | |
| `created_by` | UUID FK | |

#### `membership_requests`

Telegram bot membership application flow.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | |
| `status` | TEXT | `select_period` → `select_category` → `pending_receipt` → `pending_approval` → `approved` \| `rejected` |
| `months` | INT | |
| `amount` | DECIMAL(10,2) | |
| `category_id` | TEXT | |
| `receipt_file_id` | TEXT | Telegram photo file_id |
| `manager_message_id` | BIGINT | |

#### `notification_log`

Deduplication for notification sends. UNIQUE(membership_id, type).

### 3.7 Content

#### `news`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `title` / `title_en` / `title_kg` | TEXT | |
| `content` / `content_en` / `content_kg` | TEXT | |
| `excerpt` / `excerpt_en` / `excerpt_kg` | TEXT | |
| `thumbnail` | TEXT | Cover image |
| `gallery` | TEXT[] | |
| `images` | JSONB | Inline images: `[{url, after_paragraph}]` |
| `status` | TEXT | `'draft'` \| `'published'` \| `'archived'` |
| `views` | INT | |
| `executor` | TEXT | Author |
| `published_at` | TIMESTAMPTZ | |
| `poll_question` | TEXT | |
| `poll_options` | TEXT[] | |
| `poll_type` | TEXT | `'single'` \| `'multiple'` |
| `content_reactions` | JSONB | `{like, love, angry}` |

#### `news_reactions`

UNIQUE(news_id, user_id, reaction_type). Types: `'tennis'` \| `'fire'` \| `'clap'`.

#### `news_poll_votes`

UNIQUE(news_id, user_id). One vote per user per poll.

#### `coaches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `last_name` / `first_name` / `patronymic` | TEXT | Split FIO |
| `name` / `name_en` / `name_kg` | TEXT | Full name |
| `bio` / `bio_en` / `bio_kg` | TEXT | |
| `specialization` | TEXT | |
| `phone` / `email` | TEXT | |
| `photo` | TEXT | |
| `court_id` | TEXT FK → courts | |
| `promoted` | BOOL | Pinned at top |
| `partner` | BOOL | Voucher system |
| `partner_pin` | TEXT | PIN for voucher verification |
| `view_count` | INT | |

#### `courts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | |
| `name` / `name_en` / `name_kg` | TEXT | |
| `description` / `description_en` / `description_kg` | TEXT | |
| `address` | TEXT | |
| `phone` / `email` / `website` | TEXT | |
| `photo` | TEXT | |
| `coordinates` | POINT | |
| `promoted` | BOOL | |
| `partner` | BOOL | |
| `partner_pin` | TEXT | |
| `view_count` | INT | |

### 3.8 Services & Vouchers

#### `partner_services`

Discount services offered by partner courts/coaches.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `entity_type` | TEXT | `'court'` \| `'coach'` |
| `entity_id` | TEXT | |
| `service_name` / `service_name_en` / `service_name_kg` | TEXT | |
| `discount_percent` | INT | 1–100 |
| `is_active` | BOOL | |
| `sort_order` | INT | |

#### `discount_vouchers`

Member discount vouchers with QR verification.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK | |
| `player_name` | TEXT | |
| `entity_type` | TEXT | `'court'` \| `'coach'` |
| `entity_id` / `entity_name` | TEXT | |
| `service_id` | UUID FK → partner_services | |
| `service_name` | TEXT | |
| `discount_percent` | INT | |
| `qr_token` | TEXT | UNIQUE, random hex |
| `status` | TEXT | `active` → `used` \| `expired` \| `cancelled` |
| `expires_at` | TIMESTAMPTZ | Default: now() + 7 days |
| `used_at` | TIMESTAMPTZ | |
| `confirmed_by_ip` | TEXT | |

### 3.9 Loyalty Program

#### `loyalty_rules`

Earning rules. UNIQUE(action).

| Action | Points | Description |
|--------|--------|-------------|
| `tournament` | 100 | Tournament finalization |
| `court` | 20 | Court payment |
| `coach` | 50 | Coach payment |
| `membership` | 100 | Membership payment |
| `first_membership` | 200 | Welcome bonus (one-time) |

#### `loyalty_rewards`

Redeemable rewards. UNIQUE(code).

| Code | Cost | Description |
|------|------|-------------|
| `free_tournament` | 500 | Free tournament entry |
| `free_membership_1m` | 300 | Free 1-month membership |

#### `loyalty_transactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | |
| `type` | TEXT | `'earn'` \| `'redeem'` \| `'expire'` \| `'admin_adjust'` |
| `points` | INT | |
| `action` | TEXT | Rule action or reward code |
| `source_id` | TEXT | Reference ID |
| `note` | TEXT | |
| `expires_at` | TIMESTAMPTZ | For auto-expiry (12 months) |

### 3.10 Analytics

#### `page_views`

Page view counters for category pages.

| Column | Type | Notes |
|--------|------|-------|
| `page_name` | TEXT PK | `'tournaments-overview'`, etc. |
| `view_count` | INT | |

#### `game_invites`

Partner matching — game invitations.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sender_id` | UUID FK → profiles | |
| `receiver_player_id` | TEXT FK → players | |
| `receiver_profile_id` | UUID FK → profiles | nullable |
| `status` | TEXT | `pending` → `accepted` \| `declined` \| `expired` |
| `responded_at` | TIMESTAMPTZ | |

---

## 4. Row Level Security

Every table has RLS enabled. Access checked via helper functions:

```sql
is_admin()  -- profiles.role = 'admin'
is_staff()  -- profiles.role IN ('admin', 'manager')
```

### Access Matrix

| Table | Guest | User | Manager | Admin |
|-------|-------|------|---------|-------|
| **Core** | | | | |
| categories | R | R | R | R |
| players | R | R | R | CRUD |
| profiles (own) | — | RW | RW | RW |
| profiles (all) | — | — | R | RW |
| deleted_accounts | — | — | — | R |
| **Tournaments** | | | | |
| tournaments | R | R | CRUD | CRUD |
| tournament_registrations | R | RW | CRUD | CRUD |
| matches | R | R | RW | RW |
| tournament_levels | R | R | — | CRUD |
| points_rules | R | R | — | CRUD |
| tournament_results | R | R | — | CRUD |
| player_promotions | R | R | — | CRUD |
| rating_history | R | R | — | CRUD |
| **Badges** | | | | |
| badge_definitions | R | R | R | CRUD |
| player_badges | R | R | R | CRUD |
| **Content** | | | | |
| news | R | R | CRUD | CRUD |
| news_reactions | R | RWD | RWD | RWD |
| news_poll_votes | R | RW | RW | RW |
| coaches | R | R | CRUD | CRUD |
| courts | R | R | CRUD | CRUD |
| **Memberships & Finance** | | | | |
| memberships (own) | — | R | — | — |
| memberships (all) | — | — | CRUD | CRUD |
| entity_payments | — | — | CRUD | CRUD |
| notification_log | — | — | R | R |
| membership_requests | — | Own | CRUD | CRUD |
| **Challenges** | | | | |
| challenges | R* | RW | CRUD | CRUD |
| challenge_predictions | R | RW | RW | RW |
| **Live** | | | | |
| live_matches | R | R | CRUD | CRUD |
| **Services** | | | | |
| partner_services | R | R | CRUD | CRUD |
| discount_vouchers | — | Own | CRUD | CRUD |
| **Loyalty** | | | | |
| loyalty_rules | R | R | CRUD | CRUD |
| loyalty_rewards | R | R | CRUD | CRUD |
| loyalty_transactions | — | Own | CRUD | CRUD |
| **Analytics** | | | | |
| page_views | R | R | R | R |
| game_invites | — | Own | Own | Own |

**Legend:** R = Read, W = Write, D = Delete, Own = own records only.
*Challenges: guests read only `battle_published = true`.

---

## 5. RPC Functions

Server-side PostgreSQL functions called via `supabaseClient.rpc('name', params)`.
All use `SECURITY DEFINER` to bypass RLS when needed.

### Auth & Profile

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `handle_new_user()` | — | trigger | system | Auto-creates profile on signup |
| `check_registration_available` | `p_email, p_phone` | `{email_taken, phone_taken}` | anon | Pre-validate uniqueness |
| `get_player_avatar` | `p_player_id` | TEXT | anon | Avatar URL from linked profile |

### View Counting

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `increment_player_view` | `p_player_id` | void | anon | Player profile views |
| `increment_coach_view` | `p_coach_id` | void | anon | Coach profile views |
| `increment_court_view` | `p_court_id` | void | anon | Court page views |
| `increment_tournament_view` | `p_tournament_id` | void | anon | Tournament views |
| `increment_news_view` | `p_news_id` | void | anon | News article views |
| `increment_page_view` | `p_page_name` | void | anon | Category page views |
| `get_page_view_stats` | — | TABLE | staff | All page view counters |
| `get_tournament_stats` | — | record | staff | Tournament count & views |

### News & Engagement

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `get_news_stats` | — | record | auth | Published/draft counts for admin |
| `get_top_news` | `p_limit (default 3)` | TABLE | auth | Top articles by engagement |
| `get_reaction_counts` | `p_news_id` | TABLE | anon | Reaction counts per article |
| `get_user_reactions` | `p_news_id, p_user_id` | TABLE | anon | User's reactions on article |
| `get_poll_results` | `p_news_id` | TABLE | anon | Poll vote distribution |
| `get_news_engagement` | `p_news_ids TEXT[]` | TABLE | anon | Batch engagement (avoids N+1) |

### Partners & Game Invites

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `get_public_partners` | — | TABLE | anon | Players for partner matching |
| `get_my_game_invites` | — | TABLE | auth | Sent/received invites (limit 20) |

### Challenges & Battles

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `get_my_challenges` | — | TABLE | auth | User's sent/received challenges |
| `get_player_challenges` | `p_player_id` | TABLE | anon | Player's accepted/completed challenges |
| `get_battle_public` | `p_challenge_id` | record | anon | Published battle data |
| `get_battle_votes` | `p_challenge_id` | TABLE | anon | Vote counts per player |
| `cast_battle_vote` | `p_challenge_id, p_player_id` | void | auth | Cast vote (one-time, auto-close on match time) |

### Vouchers

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `generate_voucher` | `p_entity_type, p_entity_id, p_service_id` | record | auth + member | Create discount voucher |
| `verify_voucher` | `p_token` | record | anon | Check voucher status by QR token |
| `confirm_voucher` | `p_token, p_pin` | record | anon | Redeem voucher with partner PIN |

### Loyalty

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `get_loyalty_balance` | `p_profile_id` | INT | auth | Current points balance |

### Live Matches

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `get_live_by_umpire_key` | `p_key` | record | anon | Fetch live match by umpire key |
| `umpire_save_state` | `p_key, p_state JSONB` | void | anon | Update live match state (auto-complete) |

### Badges

| Function | Params | Returns | Access | Purpose |
|----------|--------|---------|--------|---------|
| `check_and_award_badges` | `p_player_id` | void | system | Auto-called by trigger on players update |

---

## 6. Edge Functions

Serverless Deno functions at `https://<project>.supabase.co/functions/v1/<name>`.

### User Management

#### `admin-manage-user`

Admin user management: create managers, ban/unban, delete users.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT (admin or manager) |

**Actions:**

| Action | Required Fields | Description |
|--------|----------------|-------------|
| `create_manager` | email, first_name, last_name | Invite or promote to manager (admin only) |
| `ban_user` | user_id, duration, reason | Ban user account + restrict TG |
| `unban_user` | user_id | Restore user + TG permissions |
| `delete_user` | user_id | Delete account + kick from TG |
| `ban_player` | player_id, banned_until, reason | Ban player card |
| `unban_player` | player_id | Restore player card |

Ban durations: `'1d'` \| `'3d'` \| `'7d'` \| `'30d'` \| `'permanent'`

Protections: cannot ban/delete self, cannot target admins (unless admin), managers can only ban `role='user'`.

---

#### `auto-unban`

| | |
|---|---|
| **Method** | POST |
| **Auth** | CRON_SECRET |
| **Schedule** | Daily 03:00 UTC |

Finds players with expired bans, clears ban fields, sends TG notification.

---

### Challenge System

#### `create-challenge`

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT + active membership |

```json
{
  "opponent_player_id": "player-slug",
  "proposed_date": "2026-04-01",
  "proposed_time": "18:00",
  "court_id": "court-slug",
  "message": "Let's play!"
}
```

**Limits:** 5 per day. **Checks:** membership, self-challenge, duplicate pending, opponent contact.
**Notifications:** TG inline buttons (Accept/Counter/Decline) + email.

| Error | Code |
|-------|------|
| `no_player` | 400 |
| `no_membership` | 403 |
| `self_challenge` | 400 |
| `daily_limit` | 429 |
| `already_pending` | 409 |

---

#### `battle-publish`

Publish accepted challenge as public battle page.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT (admin/manager) |

```json
{
  "challenge_id": "uuid",
  "title": "Battle Title",
  "notify_only": false
}
```

- `notify_only: false` — sets battle_published=true, sends TG group announcement with voting buttons, DMs players
- `notify_only: true` — re-announces to group only

---

#### `battle-announce`

Re-send TG group announcement for published battle.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT (admin/manager) |

```json
{ "challenge_id": "uuid" }
```

---

### Notifications

#### `tournament-notify`

Tournament registration announcement.

| | |
|---|---|
| **Method** | POST |
| **Auth** | JWT (admin) or CRON_SECRET |
| **Schedule** | Daily 05:00 UTC |

- **Manual:** `{ "tournament_id": "slug" }` — single tournament
- **Cron:** `{}` — all tournaments where registration_start=today
- **Dedup:** `tournaments.notified_at`
- **Output:** TG group message with inline buttons + email to all profiles

---

#### `tournament-reminder`

Tournament start reminders (3 days + 1 day before).

| | |
|---|---|
| **Method** | POST |
| **Auth** | CRON_SECRET |
| **Schedule** | Daily 02:00 UTC |

- Finds tournaments starting in 3 or 1 days
- **Dedup:** `reminded_3d_at` / `reminded_1d_at`
- TG group message + DM to registered players + email

---

#### `match-notify`

Match start notifications.

| | |
|---|---|
| **Method** | POST |
| **Auth** | JWT (admin/manager) or CRON_SECRET |
| **Schedule** | Every 5 min |

- **Auto:** matches starting in 0–15 minutes (Bishkek UTC+6)
- **Manual:** `{ "tournament_id": "slug" }` — full schedule to all players
- **Dedup:** `matches.notified_at`

---

#### `membership-expire`

Auto-expire past-due memberships.

| | |
|---|---|
| **Method** | POST |
| **Auth** | CRON_SECRET |
| **Schedule** | Daily 03:30 UTC |

Sets `status='expired'` where `expires_at < now()`. Sends TG + email notification.

---

#### `membership-notify`

7-day expiry reminder.

| | |
|---|---|
| **Method** | POST |
| **Auth** | CRON_SECRET |
| **Schedule** | Daily 04:00 UTC |

Finds memberships expiring exactly 7 days from now. **Dedup:** `notification_log` type=`'expiry_7d'`.

---

#### `membership-tg-notify`

Instant TG/email notification on membership changes.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT (admin/manager) |

```json
{
  "action": "granted | extended | cancelled",
  "profile_id": "uuid",
  "expires_at": "2026-12-31T00:00:00Z"
}
```

---

#### `broadcast`

Mass notification from admin.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT (admin only) |

```json
{
  "subject": "Title",
  "message": "Text",
  "audience": "all | members | tournament:{id}",
  "channels": { "tg": true, "email": true }
}
```

Returns: `{ tg_sent, email_sent, skipped, total }`. Respects notify_preferences.

---

#### `send-game-invite`

Game invitation via TG.

| | |
|---|---|
| **Method** | POST |
| **Auth** | Bearer JWT + active membership |

```json
{ "receiver_player_id": "player-slug" }
```

**Limit:** 30/day. Sends TG inline buttons (Accept/Decline) + email.

---

#### `send-email`

Centralized email service (internal use).

| | |
|---|---|
| **Method** | POST |
| **Auth** | Service role key |

```json
{
  "to": "user@example.com",
  "subject": "Subject",
  "template": "tournament-announcement",
  "data": { "tournament_name": "..." }
}
```

**Templates:** `tournament-announcement`, `tournament-reminder`, `membership-approved`, `membership-expiring`, `membership-expired`, `match-schedule`, `challenge-received`, `broadcast`.

Dark-themed HTML emails (KSLT branding: #CCFF00 accent, #1a1a1a background). Uses **Resend API**.

---

#### `telegram-webhook`

Telegram bot webhook handler. See [Section 9](#9-telegram-bot).

---

## 7. Storage

### Bucket: `avatars`

| Setting | Value |
|---------|-------|
| Public | Yes |
| Upload | Authenticated — own folder only (`{user_id}/`) |
| Structure | `avatars/{user_uuid}/avatar.jpg` |

### Bucket: `news`

| Setting | Value |
|---------|-------|
| Public | Yes |
| Upload | Staff only |
| Usage | News thumbnails, gallery images, inline content images |

---

## 8. Realtime & Cron

### Supabase Realtime

| Table | Usage |
|-------|-------|
| `live_matches` | Real-time score updates (umpire → scoreboard → public page) |

### pg_cron Jobs

| Job | Schedule (UTC) | Edge Function | Purpose |
|-----|---------------|---------------|---------|
| `tournament-registration-notify` | `0 5 * * *` | tournament-notify | Daily tournament announcements |
| `tournament-reminder-daily` | `0 2 * * *` | tournament-reminder | 3-day & 1-day reminders |
| `match-start-notify` | `*/5 * * * *` | match-notify | Match start alerts (every 5 min) |
| `membership-auto-expire` | `30 3 * * *` | membership-expire | Auto-expire memberships |
| `membership-expiry-notify` | `0 4 * * *` | membership-notify | 7-day expiry reminders |
| `auto-unban-expired` | `0 3 * * *` | auto-unban | Auto-unban expired bans |
| `expire-challenges` | `0 * * * *` | SQL (direct) | Hourly: expire stale challenges (72h) |
| `expire-loyalty-points` | `0 5 * * *` | SQL (direct) | Daily: expire 12-month-old points |

### Triggers

| Trigger | Table | Event | Purpose |
|---------|-------|-------|---------|
| `on_auth_user_created` | auth.users | AFTER INSERT | Create profile |
| `trg_log_deleted_profile` | profiles | BEFORE DELETE | Audit deleted accounts |
| `trg_player_badges` | players | AFTER UPDATE | Auto-award badges |

---

## 9. Telegram Bot

**Bot:** @KSLTennisBot

### Commands

| Command | Action |
|---------|--------|
| `/start <profile_uuid>` | Link TG account to KSLT profile |
| `/start` | Welcome message / status check |
| `/membership` | Start membership application flow |
| `/notifications` | Toggle notification preferences |

### Callback Queries

| Callback Data | Handler | Purpose |
|---------------|---------|---------|
| `tournament_register:{id}` | Tournament registration | Register for tournament via TG |
| `challenge_accept:{id}` | Challenge accept | Accept challenge invitation |
| `challenge_counter:{id}` | Challenge counter | Start counter-proposal flow |
| `challenge_decline:{id}` | Challenge decline | Decline challenge |
| `bv:{challenge_id}:{1\|2}` | Battle vote | Vote for player 1 or 2 |
| `invite_accept:{id}` | Game invite accept | Accept game invite |
| `invite_decline:{id}` | Game invite decline | Decline game invite |
| `mem_period:{months}` | Membership flow | Select period (1/3/6/12) |
| `mem_cat:{category}` | Membership flow | Select category |
| `mem_approve:{id}` | Membership approval | Manager approves application |
| `mem_reject:{id}` | Membership rejection | Manager rejects application |
| `notif_toggle:{category}` | Notifications | Toggle notification category |

### Membership Prices

| Period | Price (KGS) |
|--------|------------|
| 1 month | 1,000 |
| 3 months | 3,000 |
| 6 months | 6,000 |
| 12 months | 12,000 |

---

## 10. Environment Variables

### Supabase Project Settings

| Variable | Where Set | Purpose |
|----------|-----------|---------|
| `SUPABASE_URL` | JS (public) | API endpoint |
| `SUPABASE_ANON_KEY` | JS (public) | Publishable key (RLS enforced) |
| `SUPABASE_SERVICE_ROLE_KEY` | Edge Functions (secret) | Full DB access |

### Edge Function Secrets

| Variable | Purpose |
|----------|---------|
| `TELEGRAM_BOT_TOKEN` | Telegram Bot API auth |
| `TELEGRAM_GROUP_CHAT_ID` | Target group for announcements |
| `RESEND_API_KEY` | Resend email service |
| `CRON_SECRET` | pg_cron → Edge Function auth |
| `SITE_URL` | Public site URL for links in notifications |

### GitHub Actions Secrets

| Variable | Purpose |
|----------|---------|
| `NETLIFY_AUTH_TOKEN` | Netlify deploy auth |
| `NETLIFY_SITE_ID` | Target Netlify site |
