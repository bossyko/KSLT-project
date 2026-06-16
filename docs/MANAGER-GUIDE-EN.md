# KSLT — Manager Guide

> Version: 6.0 | Date: 2026-03-24

---

## Table of Contents

1. [Accessing the Admin Panel](#1-accessing-the-admin-panel)
2. [Dashboard](#2-dashboard)
3. [News (Content)](#3-news-content)
4. [Tournaments](#4-tournaments)
5. [Courts](#5-courts)
6. [Coaches](#6-coaches)
7. [Finances](#7-finances)
8. [Vouchers](#8-vouchers)
9. [Users & Analytics](#9-users--analytics)
10. [Challenges & Battles](#10-challenges--battles)
11. [Live Match](#11-live-match)
12. [Loyalty (Points)](#12-loyalty-points)
13. [View-only Sections](#13-view-only-sections)
14. [Reports & Export](#14-reports--export)
15. [Notification Settings](#15-notification-settings)
16. [Membership: Full Cycle](#16-membership-full-cycle)
17. [Website Access Levels](#17-website-access-levels)
18. [FAQ](#18-faq)

---

## 1. Accessing the Admin Panel

1. Log in to your account on the KSLT website
2. In the site header, hover over the **"Admin Panel"** button
3. Select the desired section from the dropdown menu

> The "Admin Panel" button is only visible to managers and administrators.

### Access by Role

| Section | Manager | Administrator |
|---------|---------|---------------|
| News | Create, edit, delete | Full access |
| Tournaments | Create, edit, delete | Full access |
| Courts | Create, edit, delete | Full access |
| Coaches | Create, edit, delete | Full access |
| Players | View only + ban/unban players | + Results + CRUD |
| Users | View only + analytics + ban/delete regular users | + Roles + ban all |
| Finances | CRUD + statistics + PDF + Excel | Full access |
| Vouchers | View only + statistics + PDF + Excel | + Cancel vouchers |
| Challenges | Publish + score + manage | Full access |
| Live | Create + umpire + manage | Full access |
| Loyalty | View only | + CRUD rules/rewards + adjust |
| Settings | — | Points rules + Promotion |

---

## 2. Dashboard

The Dashboard is the main page of the admin panel. It displays key metrics.

### 2.1 Statistics Cards

**Row 1:**
| Card | Description |
|------|-------------|
| Users | Total registered accounts |
| Memberships | Active memberships |
| Tournaments | Past / upcoming |
| Players | In the ranking system |

**Row 2:**
| Card | Description |
|------|-------------|
| Expired | Memberships past their expiry date |
| Expiring | Memberships expiring within 10 days |
| News | Published articles |
| Applications | Pending tournament approvals |

**Row 3:**
| Card | Description |
|------|-------------|
| Courts | Total courts in the database |
| Coaches | Total coaches |
| Challenges | Active challenges |
| Managers | Number of managers (admin only) |

### 2.2 Activity Tables

- **Expired payments** — who needs a renewal reminder
- **Expiring memberships** — who will lose access soon (color: red <3 days, yellow 4-7 days)
- **Pending applications** — tournament applications (with quick actions, see below)
- **Recent registrations** — new users
- **Recent tournaments** — recently created
- **Recent news** — latest publications

### 2.3 Quick Actions in "Pending Applications"

The table shows tournament applications awaiting approval. Columns:
- **Player** — clickable: navigates to the player card in the admin panel
- **Category** — player category (Tour, Futures, Challenger, etc.)
- **Rating** — current KSLT points
- **Tournament** — clickable: navigates to the tournament bracket
- **Date** — registration date
- **Actions**:
  - Check mark (green) — approve application
  - Cross mark (red) — reject application

> This saves time: no need to go to tournament -> applications -> approve. Everything is right on the dashboard.

### 2.4 User Growth Chart

Line chart for the current month:
- Green — registrations (cumulative)
- Yellow — became players
- Red — deleted accounts
- Lime — net growth

---

## 3. News (Content)

### 3.1 Creating an Article

1. Go to the **"Content"** (News) section
2. Click **"+ Add Article"**

### 3.2 Filling Out the Form

**Cover Image:**
- Click on the upload area and select a photo (JPG/PNG)
- Or drag and drop a file into the area
- Or paste an image URL and click **"Apply"**

**Title and Slug:**
- Enter the title in Russian (RU) — the primary language
- **Slug** (URL path) is generated automatically
- Switch between **RU / EN / KG** tabs for translations
- The **"Translate"** button will automatically translate the text

**Short Description:**
- Displayed on the article card in the news list

**Article Text:**
- The **"Content"** field — the main text
- Separate paragraphs with a **blank line** (press Enter twice)

**Metadata:**
- **Category** — Report / Interview / Announcement / World Tennis
- **Author** — defaults to "KSLT Media"
- **Assignee** — your name
- **Publication date** — select a date (empty = draft)

### 3.3 Photos in Text

Below the "Content" field there is a **"Preview"** block.

1. Between paragraphs you will see **"+ Photo"** and **"URL"** buttons
2. **"+ Photo"** — select a file from your computer
3. **"URL"** — paste an image link
4. To delete a photo: hover over the photo and click **"x"**

### 3.4 Polls

1. Find the **"Poll"** section in the form
2. Click **"Add Poll"**
3. Enter the question and answer options (minimum 2)
4. **"+ Add Option"** — for additional options
5. **"Remove Poll"** — to delete the poll

> Polls are anonymous. A reader votes once and sees the results.

### 3.5 Auto-save

- The article is **auto-saved** every 3 seconds
- Indicator: **"Draft saved 15:24"**
- The draft appears in the list with **"Draft"** status

### 3.6 Publishing

1. Fill in all fields
2. Set the publication date
3. Click **"Publish"**

---

## 4. Tournaments

### 4.1 Creating a Tournament

1. Go to the **"Tournaments"** section
2. Click **"+ Add Tournament"**

### 4.2 Filling Out the Form

| Field | Description |
|-------|-------------|
| **Name (RU/EN/KG)** | 3 languages, "Translate" button |
| **Description (RU/EN/KG)** | Detailed tournament description |
| **Venue** | Court search from database (autocomplete) |
| **Category** | Tour / Futures / Challenger / Masters / Pro-Masters |
| **Format** | Singles / Doubles / Mixed |
| **Level** | Cat.1 / Cat.2 / Cat.3 / Cat.4 / Grand |
| **Draw Type** | Single Elimination / FIC / Round Robin |
| **Draw Size** | 8 / 16 / 32 / 64 (for SE and FIC) |
| **Number of Groups** | Round Robin only |
| **Max Participants** | Application limit |
| **Prize Pool** | For example: "100,000 som" |
| **Registration Dates** | Start and end of application period |
| **Tournament Dates** | Start and end of tournament |

### 4.3 Tournament Draw Types

| Type | Description | When to Use |
|------|-------------|-------------|
| **Single Elimination** | Olympic system. Loser is eliminated | Standard tournaments with 8-64 players |
| **FIC** | Main Draw + Consolation. First-round losers go to consolation | Tournaments where more matches are important |
| **Round Robin** | Everyone plays everyone in a group | Small tournaments, leagues |

### 4.4 Managing Applications

1. Open the tournament -> **"Applications"** tab
2. Application status: `pending` -> `approved` -> `draw`
3. **Approve** — player is included in the list
4. **Reject** — application is cancelled
5. Gender check: a male cannot enter a women's tournament
6. Waitlist: if the category doesn't match -> status `waitlist`

### 4.5 Rejected Applications (admin only)

The administrator sees an additional **"Rejected"** section in the applications tab:
- Shows applications with status `rejected`
- Red header with count
- Rows are semi-transparent (for visual distinction)
- Columns: #, Rank, Full Name, Category, Registration Date
- Managers **cannot see** this section

> Useful for statistics: how many applications were rejected, who applied.

### 4.6 Draw

1. Go to the **"Bracket"** tab
2. Click **"Generate Draw"**
3. The system will automatically seed players (ITF) and shuffle unseeded players (Fisher-Yates)

### 4.7 Entering Results

1. Click on a match in the bracket
2. Enter the score by sets (e.g.: 6-3, 7-5)
3. The system will determine the winner and advance them to the next round

### 4.8 Finalization

1. Click **"Finalize Tournament"**
2. The system will calculate points based on the `points_rules` table
3. Player rankings will update automatically

### 4.9 Telegram Broadcast

The **"Broadcast to Telegram"** button in the tournament form sends an announcement to the group (admin only). An automatic cron job also works: if the registration start date = today, a broadcast is sent.

---

## 5. Courts

### 5.1 Creating a Court

1. Go to the **"Courts"** section
2. Click **"+ Add Court"**

### 5.2 Filling Out the Form

| Field | Description |
|-------|-------------|
| **Photo** | File upload or URL |
| **Name (RU/EN/KG)** | "Translate" button |
| **Court Types** | Dynamic rows: type, surface, quantity, price, partner |
| **Address (RU/EN/KG)** | Street, district, city |
| **Google Maps / 2GIS** | Map links |
| **Amenities** | Checkboxes: parking, WiFi, cafe, lighting, etc. |
| **Phones** | Mobile + landline (format: `555 12-34-56`) |

### 5.3 Court Types

Each court can have multiple types:
- **Type** — Outdoor / Indoor / Mini
- **Surface** — Hard / Clay / Grass / Carpet
- **Quantity / Price / KSLT Partner**

### 5.4 Phone Format

- Enter **9 digits** without the country code: `555 12-34-56`
- Stored as `+996555123456`
- Displayed: `+996 555 12-34-56`

---

## 6. Coaches

### 6.1 Creating a Profile

1. Go to the **"Coaches"** section
2. Click **"+ Add Coach"**

### 6.2 Filling Out the Form

| Field | Description |
|-------|-------------|
| **Photo** | File upload or URL |
| **Full Name** | Last name, First name, Patronymic (separate fields) |
| **Name EN** | Transliteration button (Kyrgyzbaev -> Kyrgyzbaev) |
| **Position (RU/EN)** | "Senior Coach" |
| **Tags** | Checkboxes: kids, adults, beginners, advanced |
| **Experience** | Years (number) |
| **Price** | Per hour (som) |
| **Court** | Select from database |
| **Phone / Telegram / WhatsApp** | Contact details |
| **Description / Bio (RU/EN)** | Texts |
| **Achievements (RU/EN)** | Dynamic list |

---

## 7. Finances

The **"Finances"** section is the central hub for all financial operations. It combines payments for courts, coaches, membership fees, and sponsorship income.

### 7.1 Table Overview

Each row has a **type badge**:

| Badge | Description |
|-------|-------------|
| **Membership** | Membership fee (new or renewal) |
| **Court** | Payment for court promotion |
| **Coach** | Payment for coach promotion |
| **Club** | Sponsorship / grant income for KSLT |

**Table columns:**
- Payer — name/title
- Type — badge (Membership / Court / Coach / Club)
- Amount — in KGS
- Active Until — expiry date
- Payment Method — Cash / Transfer / Card
- Status — Active (green) / Expired (grey)
- Created — record creation date (DD.MM.YY format)

### 7.2 Creating a Payment — Membership

To set up a new membership or renewal:

1. Click **"+ Add Payment"** (the button is sticky — stays visible when scrolling)
2. In the **"Entity Type"** field, select **"Membership"**
3. In the **"User"** field, start typing the name:
   - Search covers the users database (profiles) and players database (players)
   - Select the correct person from the dropdown
4. Enter the **amount** (0 is allowed — see below)
5. Select the **membership period**:
   - Preset buttons: **1 mo | 3 mo | 6 mo | 1 year** (auto-fills the end date)
   - Or enter dates manually using the calendar
6. Select the **payment method**: Cash / Transfer / Card
7. Add a **note** if needed
8. Click **"Save"**

**Free membership (0 som):**
- Allowed when the amount is 0
- The **"Note"** field becomes required — specify the reason (e.g.: "Tournament winner", "Sponsorship promotion")

> When saving, two records are created: in the `memberships` table (membership) and `payments` table (payment). Both are displayed in Finances.

### 7.3 Creating a Payment — Court / Coach

To pay for court or coach promotion:

1. Click **"+ Add Payment"**
2. Select type: **"Court"** or **"Coach"**
3. Start typing the name -> select from autocomplete
4. Select the **purpose**: Promotion / Sponsorship / Rental / Other
5. Enter the amount, currency, period (start date -> end date)
6. Payment method + note
7. **"Save"**

### 7.4 Creating a Payment — Club (KSLT)

To record sponsorship or grant funds:

1. Click **"+ Add Payment"**
2. Select type: **"Club"**
3. In the **"From"** field, enter the sponsor/organization name
4. Enter the **amount**
5. Select the **transaction date** (single date, not a period)
6. Payment method + note (purpose of the funds)
7. **"Save"**

### 7.5 How Promoted Works

1. Create a payment with type "Court" or "Coach" and purpose **"Promotion"**
2. Set the period (e.g.: 01.03 -> 31.03)
3. As long as the end date >= today, the star icon appears next to the court/coach on the website
4. When the period expires, the icon automatically disappears

### 7.6 Filters

- **Date** — All / This Month / Last Month / Custom Period
- **Search** — by payer name
- **Type** — All / Membership / Court / Coach / Club
- **Status** — All / Active / Expired

### 7.7 Statistics

Cards at the top:
- **Active** — payments with unexpired dates
- **Expired** — overdue payments
- **This Month** — new transactions
- **Total Amount** — sum of all payments (KGS)

### 7.8 Payment Dynamics Chart

Line chart for the last 12 months with 4 lines:
- **Membership** — lime (accent)
- **Court** — green
- **Coach** — yellow
- **Club** — blue

Hover over a point to see the amount in KGS for that specific month.

### 7.9 Editing and Deleting

- **Click on a row** in the table -> the edit form opens (for Court / Coach / Club types)
- **"Delete"** button — delete the transaction (irreversible, confirmation required)

> Membership payments are currently create-only; editing through Finances is in development.

---

## 8. Vouchers

The **"Vouchers"** section shows discount vouchers for members with active memberships.

### 8.1 Voucher Issuance Rules

| Rule | Description |
|------|-------------|
| **Validity Period** | 7 days from the time of receipt |
| **Per-Service Limit** | Cannot get a new voucher for the same service if there is an active one |
| **Daily Limit** | 1 voucher per day per service (prevents abuse) |
| **Multiple Services** | A player can get vouchers for ALL services of a single club/coach |
| **Other Partners** | Can simultaneously have vouchers at different courts and coaches |
| **Verification** | Club manager scans QR -> enters PIN -> voucher is marked as used |

**Example:** A player at "Dordoi" court sees 2 services (Court Rental -25%, Daytime Rental -30%). They can get a voucher for both. But only one active voucher per service. After use or expiry, a new one can be obtained.

### 8.2 Branded QR

When downloading a QR, a **branded card** (PNG 380x520) is created:
- KSLT logo + header
- Discount percentage and service name
- Court/coach name
- QR code for verification
- Validity period and URL

### 8.3 Dashboard

**Large cards:**
- **Total Issued** — number of vouchers
- **Total Discount Amount** — calculated from prices x discount percentage

**Small cards:**
- **Used** — with status `used` (+ conversion rate)
- **Active** — unused and not expired
- **Expired** — past due

### 8.4 Filters

| Filter | Description |
|--------|-------------|
| **Period** | All / This Month / Last Month / Custom |
| **Search** | By player name |
| **Status** | All / Active / Used / Expired / Cancelled |
| **Service Type** | All / Courts / Coaches |
| **Sort** | By date / By name / By status |

### 8.5 Actions

- **View** (eye icon) — detailed information
- **Cancel** (x icon) — cancel the voucher (**administrator only**)

---

## 9. Users & Analytics

### 9.1 Statistics Cards

**Top row (funnel):**
| Card | Description |
|------|-------------|
| **Total** | Registered accounts |
| **Became Players** | Linked player_id |
| **Conversion** | Conversion % |
| **New** | This month |

**Bottom row:**
| Card | Description |
|------|-------------|
| **Members** | With active membership |
| **Telegram** | Linked Telegram |
| **Deleted** | Deleted accounts |
| **Banned** | Blocked accounts |

### 9.2 Filters

- **Period** — by registration date
- **Search** — by name or email
- **Role** — All / Admin / Manager / User
- **"Users Only"** — shows those who have not yet become players. **"Show All"** — full list

### 9.3 User Card

Click on a user -> the card opens:

- **Profile**: Full name, phone, email, registration date
- **Membership**: status (Active until DD.MM.YYYY / No membership) + "Manage in Finances" link
- **Player Category**: change category (if player_id exists)
- **Moderation**: ban/unban

> Issuing and renewing memberships is done through the **"Finances"** section (type "Membership").

### 9.4 What a Manager Can Do

- View the list and user cards
- Export PDF and Excel reports
- **Ban / unban** regular users (role = user)
- **Delete** regular users

> A manager **cannot** ban/delete other managers and administrators.

---

## 10. Challenges & Battles

The **"Challenges"** section (swords icon) manages match challenges and public battles.

### 10.1 What is a Challenge

A player with an active membership can challenge another player to a match through the website. The challenge is sent via Telegram. The opponent can accept, make a counter-offer, or decline. The challenge automatically expires after 72 hours.

### 10.2 Three Tabs

| Tab | Description |
|-----|-------------|
| **Accepted** | Challenges with status `accepted` — ready for publishing |
| **Published** | Battles on the website — voting is underway |
| **Completed** | Match played, score recorded |

### 10.3 Publishing a Battle

1. Go to the **"Accepted"** tab
2. Click on a challenge -> a modal window opens
3. Enter the **battle title** (will be visible on the public page)
4. Click **"Publish"**
5. The battle will appear on the website (`battles.html` page) and in cards on the homepage
6. An announcement will be sent to the Telegram group with voting buttons

### 10.4 Voting

- Registered users can vote on the website
- In Telegram — inline buttons directly in the announcement
- **One vote** — cannot change your vote
- **Cross-check**: a vote on the website blocks the Telegram vote (and vice versa)
- Voting closes automatically by the match date

### 10.5 Entering the Score

1. Go to the **"Published"** tab
2. Click on a battle -> **"Enter Score"**
3. Enter the score by sets
4. **"Save Draft"** — save without completing
5. **"Finalize Match"** — match is completed, wins/losses/form are updated

### 10.6 Deleting a Battle

The **"Delete"** button in the modal window deletes the publication (irreversible).

---

## 11. Live Match

The **"Live"** section allows you to broadcast tennis matches in real time.

### 11.1 Creating a Live Match

1. Go to the **"Live"** section
2. Click **"+ Create Live"**
3. Select the source:

| Source | Description |
|--------|-------------|
| **Free Match** | Select 2 players from the list |
| **Tournament Match** | Select a match from the tournament bracket |
| **Battle** | Select from accepted challenges |

4. Optionally: paste a **YouTube URL** for video streaming
5. Click **"Create"**

### 11.2 Umpire Panel

After creating, open the **umpire panel** (separate page `umpire.html`):

- **Choose first serve** — before the match starts
- **Score buttons** — buttons with player names (press the one who won the point)
- **Automatic scoring** — games, sets, tiebreaks, deuce/advantage
- **Serve** — indicator switches automatically
- **Changeover** — rest timer (3 min between games, 5 min between sets)
- **Skip** — skip rest

### 11.3 Public Page

The `live-match.html` page shows:
- **Scoreboard** — score in real time (auto-refresh)
- **YouTube embed** — video stream (if URL is provided)
- **Match information** — players, source, status

### 11.4 OBS Scoreboard

For streamers: the `scoreboard.html` page is a transparent overlay for OBS Studio:
- Compact scoreboard with logos
- Automatic detection of the active match
- KSLT logo + sponsor

### 11.5 Live Cards on the Homepage

Active Live matches are displayed on the homepage (RU/EN/KG):
- Cards with the score
- Auto-refresh every 15 seconds
- Link to the match page

### 11.6 Syncing with the Tournament Bracket

If a Live match was created from the tournament bracket:
1. Enter the score via the umpire panel
2. After completion, click **"Sync to bracket"** in the admin panel
3. The score will be copied to the tournament bracket

---

## 12. Loyalty (Points)

The **"Loyalty"** section manages the points program for members.

### 12.1 How Points Work

- Players **earn points** through payments and tournament participation
- Points can be **redeemed for rewards** (tournament entry, membership renewal)
- Points **expire after 12 months** (automatically)
- **Welcome bonus**: 200 points for the first membership (one-time)

### 12.2 Three Sub-tabs

| Tab | Description |
|-----|-------------|
| **Rules** | Which events award points (and how many) |
| **Rewards** | What can be redeemed for points |
| **Transactions** | All operations (earn/redeem/adjust/expire) |

### 12.3 Rules (CRUD)

Each rule contains:
- **Event** — payment_membership, payment_court, tournament_win, etc.
- **Points** — number of points awarded
- **Description** — what it is for

### 12.4 Rewards (CRUD)

Each reward:
- **Name** — e.g.: "Free Tournament Entry"
- **Cost** — how many points are needed
- **Active** — toggle (on/off)

### 12.5 Manual Adjust

An administrator can manually add or deduct points:
1. In the transactions table, click **"+ Adjustment"**
2. Find the user
3. Enter the amount (positive = add, negative = deduct)
4. Enter the reason
5. **"Apply"**

### 12.6 Where Users See Their Points

- **Dashboard -> "Points" tab** — balance, history, redemption button
- **User dropdown** — link to "Loyalty"

---

## 13. View-only Sections

A manager can view but **cannot** edit:

| Section | What is Visible |
|---------|-----------------|
| **Players -> List** | Cards: name, category, points, motto, matches |
| **Players -> Rankings** | Rankings table by category and gender |
| **Settings** | Not accessible (admin only) |

### 13.1 Blocking Players

1. Open a player card -> **"Moderation"** section
2. Click **"Block Player"**
3. Select the duration: 7 days / 30 days / 90 days / 1 year / Permanent / Custom date
4. Enter a reason (optional)

**Consequences:**
- Cannot register for tournaments (website + Telegram)
- Red "Blocked" badge in rankings
- Telegram notification

**Unblocking:** Click the "Unblock" button in the player card -> confirm -> Telegram notification.

**Automatic unblocking:** When the ban duration expires, a cron job (09:00 Bishkek time) automatically lifts the ban and sends a Telegram notification.

---

## 14. Reports & Export

### 14.1 Period Filter

| Period | Description |
|--------|-------------|
| **All** | All records |
| **This Month** | From the 1st of the current month |
| **Last Month** | The entire previous month |
| **Custom Period** | "From" and "To" dates -> "Apply" |

### 14.2 PDF Export

1. Set the period and filters
2. Click **"PDF"**
3. A new tab will open -> **"Save as PDF"**

**Available in:** Finances, Users, Vouchers

### 14.3 Excel Export

1. Set the period and filters
2. Click **"Excel"**
3. A .csv file will be downloaded — opens in Excel, Google Sheets, Numbers
4. Cyrillic characters display correctly (UTF-8 BOM)

**Available in:** Finances, Users, Vouchers

### 14.4 Report Contents

| Section | Columns |
|---------|---------|
| **Finances** | #, Payer, Type, Amount, Currency, Active Until, Status, Created |
| **Users** | #, Name, Email, Role, Membership, Player, Telegram, Registration |
| **Vouchers** | #, Player, Entity, Service, Discount%, Date, Status |

---

## 15. Notification Settings

Users manage notifications on their own.

### 15.1 Through the Personal Dashboard

**Dashboard -> Settings -> Notifications** — a table with toggles:

| Category | What it Includes |
|----------|-----------------|
| **Membership** | Reminder 7 days before, expiry, issuance/renewal |
| **Tournaments** | Registration confirmation |
| **Matches** | Schedule, reminders |
| **Challenges** | Incoming challenge, accept/decline |

2 channels: **Telegram** and **Email** — each can be enabled/disabled separately.

### 15.2 Through the Telegram Bot

Command `/notifications` -> inline buttons for toggling.

### 15.3 What Cannot Be Disabled

Always sent: ban/unban, account deletion, `/start`, `/membership` flow.

---

## 16. Membership: Full Cycle

### 16.1 How Membership Works

```
Website Registration -> Membership Payment -> Club Member (full access)
                                                    |
                                              Reminder 7 days before
                                                    |
                                              Expiry -> status='expired'
                                                    |
                                              Expiry notification (TG + Email)
                                                    |
                                              Limited access (registered)
                                                    |
                                              Renewal -> full access again
```

### 16.2 Two Paths to Set Up

**Path 1 — Manager manually (admin panel):**
1. Finances -> + Add Payment -> Membership
2. Find the user -> set the period and amount -> Save

**Path 2 — Telegram bot (automatic):**
1. The user sends `/membership` to the bot
2. The bot guides them through payment
3. After confirmation — membership and payment are created automatically

### 16.3 Website Access Levels

| Level | Rankings | Player Profiles | Tournaments | Challenges |
|-------|----------|-----------------|-------------|------------|
| **Guest** | 8 rows + blur | No | No | No |
| **Registered** | Full | Full | No | No |
| **Club Member** | Full | Full | Registration | Send |

### 16.4 Automated Processes

| Process | Time (Bishkek) | What it Does |
|---------|----------------|--------------|
| Auto-expiry | 09:30 | Finds expired memberships -> status='expired' -> TG + Email |
| Reminder | 10:00 | Finds memberships expiring in 7 days -> TG + Email |
| Auto-unban | 09:00 | Lifts expired bans -> TG notification |

### 16.5 Where to View Membership Information

- **Dashboard** -> "Expired" and "Expiring" tables
- **Finances** -> "Membership" filter — all transactions
- **User card** -> membership status (informational)

---

## 17. Website Access Levels

The KSLT website has a 3-tier access system for visitors. Each level unlocks additional features.

### 17.1 User Roles

| Role | Who | How to Get |
|------|-----|------------|
| **Guest** | Any website visitor without registration | Simply visit the website |
| **User** | Registered account | Register on the website (email/Google) |
| **Player (KSLT Member)** | User with active membership | Set up membership through Finances |

### 17.2 Access by Section

| Feature | Guest | User | Player (KSLT Member) |
|---------|-------|------|----------------------|
| Browse the website (news, courts, coaches) | Yes | Yes | Yes |
| View rankings | Blurred | Full | Full |
| Player profile | Basic only | Full | Full |
| Tournament registration | No | No | Yes |
| Send challenges | No | No | Yes |
| Vote in battles | No | Yes | Yes |
| Find a partner | No | Yes | Yes |
| Court and coach discounts | No | No | Yes |
| Loyalty points | No | No | Yes |
| Personal dashboard | No | Yes | Yes |

### 17.3 How it Works on the Website

On court pages, coach pages, and the homepage, the **"KSLT Discount"** button works differently depending on the role:

- **Guest** -> a modal appears offering to **register**
- **User** -> a modal appears offering to **set up membership** (link to pricing)
- **Player (KSLT Member)** -> select a service -> receive a voucher (QR) valid for **7 days**

**Abuse prevention:**
- If there is an active voucher for this service -> message "You have an active voucher"
- If a voucher for this service was already used today -> message "Daily limit"

> The same logic applies on pages: Courts, Coaches, Services, Homepage.

---

## 18. FAQ

**How do I set up membership for a user?**
Finances -> + Add Payment -> type "Membership" -> find the user -> set the period -> Save. Use presets (1/3/6/12 mo) for quick selection.

**How do I renew a membership?**
Same way through Finances — create a new payment with type "Membership". A new membership will be created with the specified dates.

**Can I set up a free membership?**
Yes, enter amount 0 and be sure to fill in the note (reason: tournament winner, promotion, etc.).

**How do I record sponsorship money?**
Finances -> + Add Payment -> type "Club" -> enter "From" -> amount -> date -> specify the purpose in the note.

**How do I make a court or coach Promoted?**
Finances -> create a transaction with type "Court"/"Coach" and purpose "Promotion", set the period.

**How do I export a report?**
Set the filters -> "PDF" button (new tab for printing) or "Excel" button (.csv file download).

**Why is the tournament not visible on the website?**
Check the publication date. Without a date, it is a draft.

**What if a membership has expired?**
The system automatically: sets status='expired', sends a notification via TG and email. The user loses access to tournaments and challenges but can still view rankings.

**What if I accidentally deleted a record?**
Deletion is irreversible. The system asks for confirmation.

**How do I check if a payment is active?**
In Finances: green "Active" badge / grey "Expired" badge. Use the status filter for convenience.

**What does "Users Only" mean in the Users section?**
Shows only those who are registered on the website but do not yet have a player card in the ranking system. "Show All" displays the full list.

**How do notifications work?**
Automatically: 7 days before expiry + upon expiry. Users can disable them in Settings or via /notifications in the Telegram bot. Ban notifications are always sent.

**How do I publish a battle?**
Challenges -> "Accepted" tab -> click on a challenge -> enter the title -> "Publish". An announcement will be sent to the Telegram group.

**How do I create a Live match?**
Live -> "+ Create Live" -> select a source (free / tournament / battle) -> select players -> optionally paste a YouTube URL -> "Create". Then open the umpire panel to keep score.

**How do loyalty points work?**
Points are awarded automatically for payments and tournaments. Users see their balance in Dashboard -> "Points". An administrator can manually adjust points via Loyalty -> Transactions -> "+ Adjustment".

---

*Version 6.0 — updated 2026-03-24*
*If something is not working — contact the administrator.*
