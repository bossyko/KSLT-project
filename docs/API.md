# KSLT API Documentation

Complete backend architecture reference for the Kyrgyzstan Social Lawn Tennis community platform.

## Table of Contents

1. [Overview](#1-overview)
2. [Authentication](#2-authentication)
3. [Database Schema](#3-database-schema)
4. [Row Level Security (RLS)](#4-row-level-security)
5. [RPC Functions](#5-rpc-functions)
6. [Edge Functions](#6-edge-functions)
7. [Storage](#7-storage)
8. [Realtime & Cron](#8-realtime--cron)

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
| Client SDK | `@supabase/supabase-js` v2 (CDN) |

### Security Model

The frontend uses the **anon (publishable) key** — safe to expose in browser code. All data access is governed by **RLS policies** at the database level. The anon key only grants the permissions defined by those policies.

```
Browser → Supabase JS SDK (anon key + JWT) → PostgreSQL (RLS enforcement)
```

Two-level protection:
1. **UI layer** — admin panel hides actions based on `currentRole`
2. **Database layer** — RLS policies enforce access rules regardless of client

---

## 2. Authentication

### Providers

| Provider | Method |
|----------|--------|
| Email/Password | `auth.signInWithPassword()` / `auth.signUp()` |
| Google | `auth.signInWithOAuth({ provider: 'google' })` |
| Password Reset | `auth.resetPasswordForEmail()` → `auth.updateUser()` |

### Roles

| Role | Description |
|------|-------------|
| `user` | Default. Profile, dashboard, public data |
| `manager` | Content CRUD (news, tournaments, courts, coaches, payments) |
| `admin` | Full access. User management, ratings, player cards, memberships |

Roles are stored in `profiles.role` (not in JWT claims). Checked via helper functions `is_admin()` and `is_staff()` at the database level.

### Auth Flow

```
┌─────────┐     ┌──────────────┐     ┌────────────┐     ┌──────────┐
│  Client  │────▶│ Supabase Auth │────▶│  Trigger:  │────▶│ profiles │
│ (browser)│     │  (JWT issued) │     │handle_new_ │     │  (row    │
│          │◀────│              │     │   user()   │     │ created) │
│          │ JWT │              │     └────────────┘     └──────────┘
└─────────┘     └──────────────┘

Sign Up:
1. Client calls auth.signUp() with email, password, metadata
2. Pre-check: RPC check_registration_available(email, phone) validates uniqueness
3. Supabase creates auth.users row, sends confirmation email
4. Trigger handle_new_user() auto-creates profiles row
5. User confirms email → account activated

Sign In:
1. Client calls auth.signInWithPassword()
2. Supabase returns JWT (access_token + refresh_token)
3. SDK stores tokens in localStorage, auto-refreshes on expiry
4. Client caches profile data (name, avatar, role) for UI

Google OAuth:
1. Client calls auth.signInWithOAuth({ provider: 'google' })
2. Redirect to Google → back to app with token in URL hash
3. SDK captures token automatically on page load
4. Trigger creates profile if first login

Password Reset:
1. Client calls auth.resetPasswordForEmail(email)
2. User clicks link → redirected with recovery token
3. onAuthStateChange fires PASSWORD_RECOVERY event
4. Client calls auth.updateUser({ password }) → session signed out
```

### Password Requirements

- Minimum 8 characters
- At least one uppercase letter
- At least one digit
- At least one special character (`@#$!%` etc.)

---

## 3. Database Schema

20 tables organized into four groups.

### Core

#### `categories`

Tennis skill categories for the ranking system.

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `'men-promasters'` |
| `name` | TEXT | Russian name |
| `name_en` | TEXT | English name |
| `name_kg` | TEXT | Kyrgyz name |
| `gender` | TEXT | `'men'` \| `'women'` |
| `sort_order` | INT | Display order |

9 predefined categories: Tour → Futures → Challenger → Masters → Pro-Masters (per gender).

#### `players`

KSLT member cards for the ranking system. Created manually by admin (not auto-created on registration).

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `'asanov-timur'` |
| `name` / `name_en` | TEXT | Full name |
| `photo` | TEXT | Avatar URL |
| `category_id` | TEXT FK → categories | Skill category |
| `points` | INT | Current ranking points |
| `wins` / `losses` | INT | Career stats |
| `rank_change` | INT | Position delta (+3, -2, 0) |
| `form` | TEXT[] | Last 5 results: `{'W','W','L','W','W'}` |
| `badges` | TEXT[] | Achievements: `{'champion','top1'}` |
| `bio` / `bio_en` | TEXT | Biography |
| `phone` / `email` | TEXT | Contact info |

#### `tournaments`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug: `'spring-open-2026'` |
| `title` / `title_en` / `title_kg` | TEXT | Tournament name |
| `date_start` / `date_end` | DATE | Tournament dates |
| `status` | TEXT | `upcoming` \| `registration_open` \| `registration_closed` \| `ongoing` \| `completed` \| `cancelled` |
| `category_id` | TEXT FK → categories | Player category |
| `court_id` | TEXT FK → courts | Venue |
| `level_id` | UUID FK → tournament_levels | Points tier |
| `draw_size` | INT | 8, 16, or 32 |
| `bracket_type` | TEXT | `'single_elimination'` \| `'round_robin'` |
| `max_participants` | INT | Registration cap |
| `registration_start` / `registration_end` | DATE | Registration window |

#### `matches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `tournament_id` | TEXT FK → tournaments | |
| `player1_id` / `player2_id` | TEXT FK → players | |
| `winner_id` | TEXT FK → players | |
| `score` | TEXT | `'6:4, 3:6, 7:5'` |
| `round_number` | INT | 1=R1, 2=QF, 3=SF, 4=F |
| `match_order` | INT | Position in bracket |
| `status` | TEXT | `upcoming` \| `live` \| `completed` |
| `seed1` / `seed2` | INT | Player seedings |
| `court` | INT | Court number |
| `scheduled_time` | TEXT | `'HH:MM'` |
| `group_number` | INT | For round-robin groups |

#### `tournament_levels`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | Auto-generated |
| `name` / `name_en` | TEXT | Level name |
| `sort_order` | INT | Display order |

5 levels: Category 1-4, Grand Slam.

#### `points_rules`

Points awarded per round per tournament level. Unique constraint on `(level_id, round)`.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `level_id` | UUID FK → tournament_levels | |
| `round` | TEXT | `'W'`, `'F'`, `'SF'`, `'QF'`, `'R16'`, `'R32'` |
| `points` | INT | Points awarded |

Points scale example:

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
| `tournament_id` | TEXT FK → tournaments | |
| `player_id` | TEXT FK → players | |
| `seed_number` | INT | Seeding (1-8), null = unseeded |
| `draw_position` | INT | Bracket position (1-32) |
| `status` | TEXT | `pending` → `approved` → `rejected` \| `withdrawn` |
| `group_number` | INT | For round-robin |

Unique constraint: `(tournament_id, player_id)`.

#### `tournament_results`

Historical results for ranking points calculation.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `tournament_id` | TEXT FK → tournaments | |
| `player_id` | TEXT FK → players | |
| `round_reached` | TEXT | Best round reached |
| `points_earned` | INT | Points from this tournament |
| `season` | INT | Calendar year |
| `category_id` | TEXT FK → categories | Player's category at time of play |
| `is_transition` | BOOL | Transitional period flag |

#### `player_promotions`

Tracks category promotions (Top-5 in category → promoted to next tier).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `player_id` | TEXT FK → players | |
| `from_category_id` | TEXT FK → categories | |
| `to_category_id` | TEXT FK → categories | |
| `season` | INT | Calendar year |
| `status` | TEXT | `'eligible'` → completed |

### User

#### `profiles`

Auto-created on registration via trigger. Linked to Supabase Auth.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK FK → auth.users | Same as auth user ID |
| `email` | TEXT | |
| `full_name` | TEXT | |
| `avatar_url` | TEXT | |
| `phone` | TEXT | Format: `+996XXXXXXXXX` |
| `gender` | TEXT | |
| `birth_day` / `birth_month` / `birth_year` | INT | Date of birth |
| `player_id` | TEXT FK → players | Link to player card (nullable) |
| `role` | TEXT | `'user'` \| `'manager'` \| `'admin'` |
| `last_seen` | TIMESTAMPTZ | Updated on each session |
| `play_level` | TEXT | `'beginner'` \| `'intermediate'` \| `'advanced'` |
| `preferred_time` | TEXT | `'morning'` \| `'afternoon'` \| `'evening'` \| `'weekend'` |
| `instagram` / `telegram` | TEXT | Social handles |
| `telegram_chat_id` | BIGINT | Telegram bot integration |
| `show_socials` | BOOL | Privacy toggle |

#### `memberships`

KSLT membership records.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | Member |
| `status` | TEXT | `'active'` \| `'expired'` \| `'cancelled'` |
| `starts_at` / `expires_at` | DATE | Membership period |
| `created_by` | UUID FK → profiles | Admin who issued |
| `note` | TEXT | Admin notes |

#### `payments`

Membership payments.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | Payer |
| `membership_id` | UUID FK → memberships | Related membership |
| `amount` | DECIMAL(10,2) | |
| `currency` | TEXT | Default `'KGS'` |
| `status` | TEXT | `'pending'` \| `'completed'` \| `'failed'` \| `'refunded'` |
| `payment_method` | TEXT | |
| `external_id` | TEXT | Payment gateway transaction ID |
| `created_by` | UUID FK → profiles | Admin who recorded |

### Content

#### `news`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug |
| `title` / `title_en` / `title_kg` | TEXT | Trilingual |
| `content` / `content_en` / `content_kg` | TEXT | Full article text |
| `excerpt` / `excerpt_en` / `excerpt_kg` | TEXT | Short preview |
| `image` | TEXT | Cover image URL |
| `category` | TEXT | `'tournament'` \| `'community'` \| `'interview'` |
| `content_images` | JSONB | `[{url, after_paragraph}]` — inline images |
| `poll` | JSONB | `{question, options: [...]}` — embedded poll |
| `view_count` | INT | Page views |
| `published_at` | TIMESTAMPTZ | Publish date (null = draft) |

#### `coaches`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug |
| `name` / `name_en` / `name_kg` | TEXT | |
| `specialization` / `specialization_en` | TEXT | |
| `experience` / `experience_en` | TEXT | |
| `phone` / `email` | TEXT | Contact |
| `price` | TEXT | Lesson price |
| `rating` | DECIMAL(2,1) | 0.0–5.0 |
| `bio` / `bio_en` | TEXT | |
| `promoted` | BOOL | Pinned at top of listings |

#### `courts`

| Column | Type | Notes |
|--------|------|-------|
| `id` | TEXT PK | Slug |
| `name` / `name_en` / `name_kg` | TEXT | |
| `address` / `address_en` | TEXT | |
| `surface` | TEXT | `'hard'` \| `'clay'` \| `'grass'` \| `'indoor'` \| `'carpet'` |
| `phone` | TEXT | |
| `price` | TEXT | Per hour |
| `rating` | DECIMAL(2,1) | |
| `latitude` / `longitude` | DECIMAL(10,7) | Map coordinates |
| `working_hours` | TEXT | |
| `promoted` | BOOL | Pinned at top |

#### `news_reactions`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `news_id` | TEXT FK → news | |
| `user_id` | UUID FK → auth.users | |
| `reaction_type` | TEXT | `'tennis'` \| `'fire'` \| `'clap'` |

Unique constraint: `(news_id, user_id, reaction_type)` — one reaction of each type per user per article.

#### `news_poll_votes`

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `news_id` | TEXT FK → news | |
| `user_id` | UUID FK → auth.users | |
| `option_index` | INT | Selected poll option |

Unique constraint: `(news_id, user_id)` — one vote per user per poll.

### Features

#### `game_invites`

Partner matching — game invitations via Telegram.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `sender_id` | UUID FK → profiles | Who sent |
| `receiver_player_id` | TEXT | Target player slug |
| `receiver_profile_id` | UUID FK → profiles | Target profile |
| `status` | TEXT | `'pending'` \| `'accepted'` \| `'declined'` \| `'expired'` |
| `responded_at` | TIMESTAMPTZ | When accepted/declined |

#### `entity_payments`

Financial tracking for courts, coaches, and players (sponsorships, rentals, promotions).

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `entity_type` | TEXT | `'court'` \| `'coach'` \| `'player'` |
| `entity_id` / `entity_name` | TEXT | Reference to entity |
| `amount` | NUMERIC | |
| `currency` | TEXT | Default `'KGS'` |
| `period_start` / `period_end` | DATE | Payment period |
| `payment_method` | TEXT | `'cash'` \| `'transfer'` \| `'card'` |
| `purpose` | TEXT | `'promoted'` \| `'sponsorship'` \| `'rental'` \| `'other'` |
| `created_by` | UUID FK → auth.users | Admin who recorded |

#### `notification_log`

Deduplication log for Telegram notifications.

| Column | Type | Notes |
|--------|------|-------|
| `id` | UUID PK | |
| `profile_id` | UUID FK → profiles | |
| `membership_id` | UUID FK → memberships | |
| `type` | TEXT | `'expiry_7d'` |

Unique constraint: `(membership_id, type)` — prevents sending duplicate notifications.

---

## 4. Row Level Security

Every table has RLS enabled. Policies use two helper functions:

```sql
-- Check if caller is admin
CREATE FUNCTION is_admin() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- Check if caller is admin OR manager
CREATE FUNCTION is_staff() RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')
  );
$$ LANGUAGE sql SECURITY DEFINER;
```

### Access Matrix

| Table | Guest | User | Manager | Admin |
|-------|-------|------|---------|-------|
| categories | R | R | R | R |
| players | R | R | R | R/W/D |
| tournaments | R | R | R/W/D | R/W/D |
| tournament_registrations | R | R/W | R/W/D | R/W/D |
| matches | R | R | R/W | R/W |
| profiles (own) | — | R/W | R/W | R/W |
| profiles (all) | — | — | — | R/W |
| memberships (own) | — | R | R | R |
| memberships (all) | — | — | R/W/D | R/W/D |
| payments (own) | — | R | R | R |
| payments (all) | — | — | R/W/D | R/W/D |
| coaches | R | R | R/W/D | R/W/D |
| courts | R | R | R/W/D | R/W/D |
| news | R | R | R/W/D | R/W/D |
| news_reactions | R | R/W/D | R/W/D | R/W/D |
| news_poll_votes | R | R/W | R/W | R/W |
| tournament_levels | R | R | — | R/W/D |
| points_rules | R | R | — | R/W/D |
| tournament_results | R | R | — | R/W/D |
| player_promotions | R | R | — | R/W/D |
| entity_payments | — | — | R/W/D | R/W/D |
| notification_log | — | — | R | R |
| game_invites | — | Own | Own | Own |

**Legend:** R = Read, W = Write (insert/update), D = Delete, Own = own records only, — = no access.

### Policy Pattern Examples

**Public read:**
```sql
CREATE POLICY "Public read" ON players FOR SELECT USING (true);
```

**Staff CRUD:**
```sql
CREATE POLICY "staff_insert" ON tournaments FOR INSERT
  WITH CHECK (is_staff());
CREATE POLICY "staff_update" ON tournaments FOR UPDATE
  USING (is_staff());
CREATE POLICY "staff_delete" ON tournaments FOR DELETE
  USING (is_staff());
```

**Admin only:**
```sql
CREATE POLICY "admin_insert" ON players FOR INSERT
  WITH CHECK (is_admin());
```

**Own records:**
```sql
CREATE POLICY "Users read own" ON profiles FOR SELECT
  USING (auth.uid() = id);
```

---

## 5. RPC Functions

Server-side PostgreSQL functions called via `supabaseClient.rpc('function_name', params)`.

### Auth

#### `handle_new_user()`

- **Type:** Trigger function (not callable via RPC)
- **Trigger:** `AFTER INSERT ON auth.users`
- **Action:** Creates a `profiles` row with `id`, `email`, `full_name`, `avatar_url` from auth metadata
- **Security:** `SECURITY DEFINER`

#### `check_registration_available(p_email TEXT, p_phone TEXT)`

- **Returns:** `{ email_taken: BOOL, phone_taken: BOOL }`
- **Access:** `anon, authenticated`
- **Purpose:** Pre-validates email/phone uniqueness before calling `auth.signUp()` to provide immediate UI feedback

### News

#### `increment_news_view(p_news_id TEXT)`

- **Returns:** `VOID`
- **Access:** `anon, authenticated`
- **Action:** Increments `news.view_count` by 1

#### `get_news_stats()`

- **Returns:** `{ published_count, last_published, draft_count, last_draft }`
- **Access:** `authenticated`
- **Purpose:** Dashboard statistics for admin panel

#### `get_top_news(p_limit INT DEFAULT 3)`

- **Returns:** `TABLE(news_id, title, score)`
- **Access:** `authenticated`
- **Purpose:** Top articles ranked by engagement score (views + reactions + poll votes)

#### `get_reaction_counts(p_news_id TEXT)`

- **Returns:** `TABLE(tennis BIGINT, fire BIGINT, clap BIGINT)`
- **Access:** `anon, authenticated`
- **Purpose:** Reaction counts for a single article

#### `get_user_reactions(p_news_id TEXT, p_user_id UUID)`

- **Returns:** `TABLE(reaction_type TEXT)`
- **Access:** `anon, authenticated`
- **Purpose:** Which reactions the current user has toggled on an article

#### `get_poll_results(p_news_id TEXT)`

- **Returns:** `TABLE(option_index INT, count BIGINT)`
- **Access:** `anon, authenticated`
- **Purpose:** Vote distribution for an article's embedded poll

#### `get_news_engagement(p_news_ids TEXT[])`

- **Returns:** `TABLE(news_id TEXT, total_reactions BIGINT, total_votes BIGINT)`
- **Access:** `anon, authenticated`
- **Purpose:** Batch engagement data for news list (avoids N+1 queries)

### Partners

#### `get_public_partners()`

- **Returns:** `TABLE(id, full_name, avatar_url, gender, last_seen, category_name, category_name_en, has_telegram, play_level)`
- **Access:** `anon, authenticated`
- **Purpose:** Public list of players available for game matching
- **Query:** Joins `players` ← `categories` ← `profiles`, ordered by `last_seen DESC`

#### `get_my_game_invites()`

- **Returns:** `TABLE(id, status, created_at, responded_at, direction, partner_name, partner_avatar)`
- **Access:** `authenticated`
- **Purpose:** User's sent and received game invitations (UNION of both directions)
- **Limit:** 20 most recent

All RPC functions use `SECURITY DEFINER` to bypass RLS when needed and execute with the function owner's permissions.

---

## 6. Edge Functions

Serverless functions running on Deno. Deployed to `https://<project>.supabase.co/functions/v1/<name>`.

### `send-game-invite`

Send a game invitation to another player via Telegram bot.

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/send-game-invite` |
| **Auth** | Bearer JWT (authenticated user) |
| **Requirement** | Active membership (admin/manager bypass) |

**Request:**
```json
{
  "receiver_player_id": "asanov-timur"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "invite_id": "uuid"
}
```

**Error Codes:**

| Code | Reason |
|------|--------|
| 401 | Missing or invalid JWT |
| 403 | No active membership |
| 400 | Missing receiver_player_id or player not found |
| 404 | Receiver player not found |
| 409 | Pending invite already exists for this pair |
| 429 | Daily limit exceeded (30/day) |

**Flow:**
1. Verify JWT → get sender profile
2. Check active membership (skip for admin/manager)
3. Check daily invite count < 30
4. Check no duplicate pending invite
5. Get receiver player + profile (must have `telegram_chat_id`)
6. Insert `game_invites` row with `status='pending'`
7. Send Telegram message to receiver with Accept/Decline inline buttons

---

### `telegram-webhook`

Handles incoming Telegram bot events (messages and callback queries).

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/telegram-webhook` |
| **Auth** | None (Telegram webhook) |
| **Setup** | Register via `setWebhook` API |

**Handled Events:**

| Event | Action |
|-------|--------|
| `/start <profile_uuid>` | Links Telegram account to KSLT profile (saves `telegram_chat_id`) |
| `/start` (no params) | Sends onboarding message or status |
| `invite_accept:<id>` callback | Accepts game invite, exchanges contacts via Telegram |
| `invite_decline:<id>` callback | Declines game invite, notifies sender |

**Callback Flow (Accept):**
1. Verify callback sender is the actual receiver (by `telegram_chat_id`)
2. Update invite status to `'accepted'`, set `responded_at`
3. Remove inline buttons from original message
4. Send receiver a button to open sender's Telegram chat
5. Notify sender that invite was accepted

---

### `membership-notify`

Sends Telegram reminders 7 days before membership expiry. Triggered by pg_cron.

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/membership-notify` |
| **Auth** | Bearer CRON_SECRET or service role key |
| **Schedule** | Daily at 04:00 UTC (10:00 Bishkek) |

**Success Response (200):**
```json
{
  "sent": 3,
  "skipped": 1,
  "total": 4,
  "targetDate": "2026-03-17"
}
```

**Flow:**
1. Verify authorization (CRON_SECRET or service role key)
2. Calculate target date: today + 7 days
3. Query active memberships expiring on target date (join with profiles)
4. For each membership:
   - Skip if profile has no `telegram_chat_id`
   - Skip if already notified (check `notification_log` for `type='expiry_7d'`)
   - Send Telegram reminder message
   - Log to `notification_log` for deduplication

---

### `admin-manage-user`

Admin-only user management: create managers, delete users.

| | |
|---|---|
| **Endpoint** | `POST /functions/v1/admin-manage-user` |
| **Auth** | Bearer JWT (admin role required) |

**Actions:**

#### Create Manager

```json
{
  "action": "create_manager",
  "email": "manager@example.com",
  "first_name": "John",
  "last_name": "Doe"
}
```

| Scenario | Response |
|----------|----------|
| User exists | `{ "success": true, "action": "role_updated", "user_id": "..." }` |
| New user | `{ "success": true, "action": "invited", "user_id": "..." }` |

- If user exists → updates `profiles.role` to `'manager'`
- If new → sends Supabase Auth invite email + creates profile with `role='manager'`

#### Delete User

```json
{
  "action": "delete_user",
  "user_id": "uuid"
}
```

| Response | |
|----------|---|
| Success | `{ "success": true, "action": "deleted" }` |
| Self-delete | 400 — cannot delete own account |
| Target is admin | 403 — cannot delete another admin |

**Error Codes (shared):**

| Code | Reason |
|------|--------|
| 401 | Missing or invalid JWT |
| 403 | Caller is not admin, or target is admin |
| 400 | Missing required fields, or self-delete attempt |
| 500 | Internal error |

---

## 7. Storage

### Bucket: `avatars`

| Setting | Value |
|---------|-------|
| Public | Yes |
| Max file size | Supabase default (50MB) |

**RLS Policies:**

| Operation | Policy |
|-----------|--------|
| **Read** | Public — anyone can view avatars |
| **Upload** | Authenticated — user can upload to own folder (`{user_id}/`) |
| **Update** | Authenticated — user can update files in own folder |

**Folder structure:**
```
avatars/
  {user_uuid}/
    avatar.jpg
```

**Policy implementation:**
```sql
-- Read: public
CREATE POLICY "Public avatar read" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- Upload: own folder only
CREATE POLICY "Users upload own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Update: own folder only
CREATE POLICY "Users update own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

---

## 8. Realtime & Cron

### pg_cron

| Job | Schedule | Function | Purpose |
|-----|----------|----------|---------|
| `membership-expiry-notify` | `0 4 * * *` (04:00 UTC) | `membership-notify` | Send Telegram reminders 7 days before membership expiry |

**Setup:**
```sql
SELECT cron.schedule(
  'membership-expiry-notify',
  '0 4 * * *',
  $$
  SELECT net.http_post(
    url := '<SUPABASE_URL>/functions/v1/membership-notify',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret'),
      'Content-Type', 'application/json'
    ),
    body := '{}'::jsonb
  );
  $$
);
```

Uses `pg_net` extension to make HTTP POST to the Edge Function. Authorization via `CRON_SECRET` stored in Supabase app settings.
