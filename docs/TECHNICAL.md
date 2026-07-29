# KSLT — Техническая документация

> Последнее обновление: 2026-07-28
> Версия: 3.0

---

## 1. Обзор проекта

**KSLT (Kyrgyzstan Social Lawn Tennis)** — веб-платформа теннисного сообщества Кыргызстана. Объединяет любителей и профессионалов: рейтинги, турниры, тренеры, корты, членство, живые матчи, баттлы, программа лояльности.

| Параметр | Значение |
|----------|----------|
| Языки | RU (основной), EN, KG |
| Тема | Dark, accent #CCFF00 |
| Шрифт | Inter |
| Хостинг | Netlify (фронтенд) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Бот | Telegram Bot API |
| Тестирование | Playwright (E2E) + Vitest (Unit) |
| CI/CD | GitHub Actions (test.yml + deploy.yml) |
| Фреймворки | Нет (Vanilla HTML/CSS/JS) |
| Сборка | Нет (статика, без бандлера) |

---

## 2. Стек технологий

### Frontend
- **HTML5** — 80 статических страниц, файловая мультиязычность (`-en`, `-kg` суффиксы)
- **CSS3** — 22 файла, переменные, glassmorphism, responsive (375/480/768/992px)
- **Vanilla JavaScript** — 47 файлов, IIFE-модули, JSDoc типизация, без зависимостей
- **Supabase JS SDK** — подключение через CDN (unpkg.com)
- **Chart.js** — аналитические графики в админке (CDN)

### Backend (Supabase)
- **PostgreSQL** — основная база данных (31+ таблица)
- **Row Level Security (RLS)** — безопасность на уровне строк
- **Auth** — email/password + Google OAuth
- **Storage** — аватары пользователей, фото новостей
- **Edge Functions** — 20 Deno/TypeScript функций
- **RPC** — 28+ SQL-функций вызываемых с фронта
- **Realtime** — подписки на изменения (live match)
- **pg_cron** — автоматические задачи по расписанию

### Тестирование
- **Playwright** — E2E тесты (9 test suites, 3 viewport: desktop/tablet/mobile)
- **Vitest** — Unit тесты Edge Functions (72 теста, 3 suite)
- **GitHub Actions** — CI/CD (test.yml: тесты, deploy.yml: деплой на Netlify)

### Интеграции
- **Telegram Bot** (`@KSLTennisBot`) — уведомления, голосование, регистрация
- **Cropper.js** — обрезка аватаров в dashboard
- **Chart.js** — графики: рост пользователей, динамика оплат

---

## 3. Структура проекта

```
KSLT/
├── index.html / index-en.html / index-kg.html    ← Главная (3 языка)
│
├── pages/                          ← 76 HTML-страниц
│   ├── auth.html                   ← Авторизация
│   ├── dashboard.html              ← Личный кабинет
│   ├── admin.html                  ← Админ-панель
│   ├── tournaments.html            ← Список турниров
│   ├── tournament.html             ← Детали турнира + сетка
│   ├── tournaments-overview.html   ← Обзор категорий турниров
│   ├── players.html                ← Рейтинг игроков
│   ├── player.html                 ← Профиль игрока
│   ├── coaches.html                ← Каталог тренеров
│   ├── coach.html                  ← Профиль тренера
│   ├── courts.html                 ← Каталог кортов
│   ├── court.html                  ← Детали корта
│   ├── news.html                   ← Новости
│   ├── services.html               ← Обзор услуг
│   ├── info.html                   ← Информационный хаб
│   ├── partners.html               ← Найти партнёра
│   ├── challenge.html              ← Баттл (VS layout)
│   ├── battles.html                ← Обзор баттлов (карточки)
│   ├── live-match.html             ← Живой матч + стрим
│   ├── umpire.html                 ← Панель судьи (scoring)
│   ├── verify.html                 ← Верификация ваучеров
│   ├── about.html                  ← О проекте
│   ├── faq.html                    ← FAQ
│   ├── rules.html                  ← Правила
│   ├── pricing.html                ← Цены
│   └── offer.html                  ← Публичная оферта
│
├── css/                            ← 22 CSS-файла (~27 500 строк)
│   ├── style.css                   ← Дизайн-система + глобальные стили
│   ├── admin.css                   ← Админ-панель
│   ├── players.css                 ← Рейтинги
│   ├── tournament-detail.css       ← Детали турнира
│   ├── live-match.css              ← Живой матч + scoreboard
│   ├── umpire.css                  ← Панель судьи
│   ├── challenge-detail.css        ← Баттл (VS layout)
│   ├── battle-cards.css            ← Карточки баттлов
│   ├── battles-overview.css        ← Обзор баттлов
│   ├── news.css                    ← Новости
│   ├── dashboard.css               ← Личный кабинет
│   ├── partners.css                ← Найти партнёра
│   ├── courts.css                  ← Корты
│   ├── tournaments.css             ← Список турниров
│   ├── coaches.css                 ← Тренеры
│   ├── tournaments-overview.css    ← Обзор турниров
│   ├── services.css                ← Услуги
│   ├── info-pages.css              ← About/FAQ/Rules
│   ├── player.css                  ← Профиль игрока
│   ├── pricing.css                 ← Цены
│   ├── info-overview.css           ← Инфо-хаб
│   └── verify.css                  ← Верификация
│
├── js/                             ← 45 JS-файлов (~42 700 строк)
│   ├── admin/                      ← Админ-панель (~22 000, 18 файлов) ★
│   │   ├── core/
│   │   │   ├── constants.js        ← L (EN/RU), ICONS, enums, maps
│   │   │   ├── utils.js            ← toast, confirm, esc, translate, uploadImage, exportCsv
│   │   │   ├── layout.js           ← sidebar, tabs, dashboard, switchTab
│   │   │   └── init.js             ← onAuthReady orchestration
│   │   └── sections/
│   │       ├── news.js             ← CRUD + inline-фото + опрос
│   │       ├── tournaments.js      ← CRUD + заявки + финализация
│   │       ├── bracket.js          ← Сетка SE/FIC/Group Stage
│   │       ├── courts.js           ← CRUD + promoted + координаты
│   │       ├── coaches.js          ← CRUD + фото + авто-перевод
│   │       ├── players.js          ← CRUD + категория + бан
│   │       ├── settings.js         ← Правила очков + промоушен
│   │       ├── finances.js         ← CRUD + promoted + период + PDF/Excel
│   │       ├── vouchers.js         ← Дашборд + таблица + фильтры + PDF
│   │       ├── users.js            ← Список + роли + аналитика + бан
│   │       ├── challenges.js       ← Баттлы: publish, score, manage
│   │       ├── live.js             ← Живые матчи: create, control, score sync
│   │       ├── loyalty.js          ← Правила, награды, транзакции, manual adjust
│   │       └── broadcast.js        ← Email/TG рассылка
│   ├── umpire.js                   ← Движок теннисного счёта
│   ├── scoreboard.js               ← OBS overlay scoreboard
│   ├── live-match.js               ← Публичная страница живого матча
│   ├── challenge-detail.js         ← Баттл: VS, голосование, H2H, счёт
│   ├── battle-cards.js             ← Карточки баттлов (homepage/battles)
│   ├── battles-overview.js         ← Обзор баттлов
│   ├── tournament-detail.js        ← Сетка турнира
│   ├── dashboard.js                ← Личный кабинет
│   ├── players.js                  ← Рейтинги
│   ├── news.js                     ← Новости
│   ├── courts.js                   ← Корты
│   ├── partners.js                 ← Найти партнёра
│   ├── coaches.js                  ← Тренеры
│   ├── services.js                 ← Услуги
│   ├── tournament-generator.js     ← Генератор сетки
│   ├── script.js                   ← Глобальный (header, burger, scroll, lang, scroll-to-top)
│   ├── tournaments-overview.js     ← Обзор турниров + поиск
│   ├── auth.js                     ← Авторизация
│   ├── player.js                   ← Профиль игрока
│   ├── tournaments-overlay.js      ← Список турниров + поиск
│   ├── verify.js                   ← Верификация ваучеров
│   ├── auth-nav.js                 ← User dropdown
│   ├── info-overview.js            ← Инфо-хаб
│   ├── membership.js               ← Членство
│   ├── auth-guard.js               ← Защита роутов
│   ├── supabase-config.js          ← Supabase клиент
│   └── session-monitor.js          ← Мониторинг сессий
│
├── data/                           ← 18 файлов статических данных (~6 350 строк)
│   ├── tournaments-data.js / -en.js / -kg.js
│   ├── tournament-detail-data.js / -en.js
│   ├── news-data.js / -en.js / -kg.js
│   ├── players-data.js / -en.js / -kg.js
│   ├── coaches-data.js / -en.js / -kg.js
│   └── courts-data.js / -en.js / -kg.js
│
├── sql/                            ← 64 SQL-файла (миграции + тесты)
│
├── supabase/
│   ├── schema.sql                  ← Основная схема БД
│   ├── seed.sql                    ← Начальные данные
│   └── functions/                  ← 20 Edge Functions (Deno/TypeScript)
│       ├── admin-manage-user/      ← create_manager, ban/unban, delete_user
│       ├── auto-unban/             ← Авто-разбан по pg_cron
│       ├── battle-announce/        ← Анонс баттла в TG группу
│       ├── battle-publish/         ← Публикация баттла + TG кнопки голосования
│       ├── broadcast/              ← Email/TG рассылка (универсальная)
│       ├── create-challenge/       ← Создание вызова на матч
│       ├── delete-account/         ← Удаление аккаунта (soft + hard delete)
│       ├── match-notify/           ← Уведомления о матчах (cron + manual)
│       ├── membership-expire/      ← Auto-expire + TG notification (cron)
│       ├── membership-notify/      ← 7-day expiry reminder (cron)
│       ├── membership-tg-notify/   ← Admin grant/extend/cancel → TG DM
│       ├── security-notify/        ← Уведомления безопасности (пароль, устройство)
│       ├── send-email/             ← Отправка email (Resend)
│       ├── send-game-invite/       ← Приглашение на игру → TG
│       ├── telegram-auth/          ← Telegram Login Widget верификация (HMAC-SHA-256)
│       ├── telegram-webhook/       ← Webhook бота (все callbacks)
│       ├── tournament-notify/      ← Анонс турнира в TG группу
│       ├── tournament-reminder/    ← Напоминание о турнире
│       ├── tournament-results-notify/ ← Анонс результатов турнира в TG
│       └── verify-turnstile/       ← Серверная проверка Cloudflare Turnstile CAPTCHA
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
│   └── unit/edge-functions/        ← 72 Vitest теста
│       ├── create-challenge.test.js    (23 теста)
│       ├── admin-manage-user.test.js   (29 тестов)
│       └── battle-publish.test.js      (20 тестов)
│
├── .github/workflows/              ← CI/CD
│   ├── test.yml                    ← Тесты на push/PR
│   └── deploy.yml                  ← Auto-deploy на Netlify
│
├── docs/                           ← Документация
│   ├── TECHNICAL.md                ← Техническая документация (RU)
│   ├── TECHNICAL-EN.md             ← Техническая документация (EN)
│   ├── MANAGER-GUIDE.md            ← Инструкция для менеджеров (RU)
│   ├── MANAGER-GUIDE-EN.md         ← Инструкция для менеджеров (EN)
│   └── API.md                      ← API документация
│
└── images/                         ← Логотип, иконки, спонсоры
```

**Итого: ~260 файлов, ~121 000 строк кода**

---

## 4. База данных (PostgreSQL)

### Схема таблиц

```
profiles              — пользователи (auth + профиль)
├── id (UUID, PK)     — совпадает с auth.users.id
├── full_name
├── email, phone
├── avatar_url
├── role              — user / manager / admin
├── player_id         — связь с players
├── gender
├── birthday
├── instagram, telegram
├── show_socials
├── telegram_chat_id  — для бота
├── telegram_username
├── play_level        — beginner / intermediate / advanced
├── preferred_time    — morning / afternoon / evening / weekend
├── last_seen         — онлайн-статус
├── notify_preferences — JSONB {tg: {membership, tournaments, matches, challenges}, email: {...}}
└── membership_*      — данные членства

players               — игроки рейтинга
├── id (TEXT, PK)
├── name, name_en, name_kg — ФИО (Имя Фамилия, split в админке)
├── photo
├── category_id       → categories
├── points, wins, losses
├── rank_change
├── form[]            — последние 5 результатов (W/L), авто из matches
├── bio               — девиз игрока (макс 100 символов)
├── seed
├── ntrp_rating       — NTRP Elo рейтинг (1.0–7.0)
├── banned_until      — дата окончания бана (NULL = не забанен)
└── ban_reason        — причина бана (опционально)

categories            — категории рейтинга
├── id, name, name_en
├── gender            — men / women
└── sort_order

tournaments           — турниры
├── id, name, name_en
├── category_id       → categories
├── level_id          → tournament_levels
├── dates, location
├── draw_size         — 8 / 16 / 32
├── bracket_type      — single_elimination / fic / group_stage
├── status            — upcoming / ongoing / completed
├── published_at      — null = черновик
├── youtube_url       — ссылка на YouTube стрим
└── registration_start, registration_end

tournament_levels     — уровни турниров
├── Кат.1, Кат.2, Кат.3, Кат.4, Grand (ТБШ)
└── points_rules      — очки за каждый раунд

tournament_registrations — заявки на турнир
├── player_id, tournament_id
├── status            — pending → approved → draw
├── seed_number, draw_position
└── category_check

matches               — матчи турнирной сетки
├── tournament_id, round_number, match_order
├── player1_id, player2_id
├── score             — "6-4 6-3"
├── winner_id
├── seed1, seed2
├── court, scheduled_time
├── match_type        — tournament / duel
└── status            — scheduled / completed

coaches               — тренеры
├── name, speciality, photo
├── phone, email, instagram
├── rating, experience
├── court_id          → courts
└── promoted          — платное размещение сверху

courts                — корты
├── name, address, type
├── surface, price
├── phone, facilities
├── lat, lng          — координаты
└── promoted

news                  — новости
├── title, title_en, title_kg
├── content, content_en, content_kg
├── excerpt, excerpt_en, excerpt_kg
├── slug              — URL-идентификатор
├── image             — обложка
├── content_images    — JSONB [{url, after_paragraph}] — фото в тексте
├── poll              — JSONB {question, options} | null — опрос
├── category          — results / interview / announcement / world
├── author, executor
└── published_at      — null = черновик

memberships           — членство
├── profile_id        → profiles
├── type, start_date, end_date
└── status            — active / expired

entity_payments       — оплаты (Membership / Court / Coach / Club)
├── profile_id, entity_type, entity_id
├── amount, currency, method
├── start_date, end_date
├── purpose           — promotion / sponsorship / rent / other
└── status            — active / expired

game_invites          — приглашения на игру
├── sender_id         → profiles
├── receiver_player_id → players
├── receiver_profile_id → profiles
├── status            — pending / accepted / declined / expired
└── created_at, responded_at

challenges            — вызовы на матч (Challenge Board + Battles)
├── challenger_id     → profiles
├── opponent_id       → profiles (player_id связь)
├── proposed_date, proposed_time
├── proposed_court    → courts.id или другая площадка
├── message           — до 150 символов
├── status            — pending / accepted / counter / declined / expired
├── battle_title      — заголовок баттла (для публикации)
├── battle_published  — опубликован ли баттл
├── voting_closed     — голосование закрыто
├── battle_notified_at — дата рассылки в TG
└── expires_at        — автоматически через 72ч (pg_cron)

challenge_predictions — голоса за баттлы
├── challenge_id      → challenges
├── profile_id        → profiles (или telegram_chat_id)
├── predicted_winner  — 1 (challenger) или 2 (opponent)
└── source            — 'site' / 'telegram'

discount_vouchers     — ваучеры скидок (членство)
├── profile_id        → profiles
├── entity_type       — court / coach
├── entity_id, entity_name
├── discount_percent
├── qr_token          — уникальный токен для QR-кода
├── status            — active / used / expired / cancelled
├── expires_at        — +7 дней
└── confirmed_by_ip   — IP при верификации

loyalty_rules         — правила начисления баллов
├── event_type        — payment_membership / payment_court / tournament_win / ...
├── points            — кол-во баллов
└── description

loyalty_rewards       — награды для обмена
├── name, description
├── points_cost       — стоимость в баллах
└── is_active

loyalty_transactions  — транзакции баллов
├── profile_id        → profiles
├── rule_id / reward_id
├── points            — +earn / -redeem
├── type              — earn / redeem / adjust / expire
└── expires_at        — +12 мес (pg_cron auto-expire)

live_matches          — живые матчи
├── player1_id, player2_id → players
├── source_type       — free / tournament / battle
├── source_id         — tournament_id или challenge_id
├── score_data        — JSONB (сеты, геймы, поинты, serve)
├── youtube_url       — URL YouTube стрима
├── status            — warmup / live / changeover / finished
└── finished_at

deleted_accounts      — лог удалённых аккаунтов
├── profile_id, full_name, email, role
├── had_membership
└── deleted_at
    Trigger: trg_log_deleted_profile BEFORE DELETE ON profiles

user_devices              — известные устройства (fingerprint)
├── profile_id            → profiles
├── device_hash           — hash(userAgent + screen)
├── user_agent            — полный User-Agent строка
├── last_seen             — последний вход
└── created_at
    UNIQUE(profile_id, device_hash)

notification_log      — лог уведомлений (защита от дублей)
├── profile_id, type
└── sent_at
```

### RLS-политики (Row Level Security)

Каждая таблица защищена:
- **profiles** — пользователь видит/редактирует только свой
- **game_invites** — sender видит отправленные, receiver — полученные
- **coaches/courts/news** — публичное чтение, запись только admin/manager
- **players** — публичное чтение, запись через admin/manager (бан)
- **memberships/payments** — staff full access
- **challenges** — участники видят свои, staff — все
- **challenge_predictions** — пользователь 1 голос, staff видят все
- **loyalty_*** — staff full CRUD, users read own + redeem
- **live_matches** — публичное чтение, staff управление

### RPC-функции (28+)

```sql
get_public_partners()        — список партнёров с online, telegram, уровнем
get_my_game_invites()        — история приглашений (sent + received)
recalc_player_points()       — пересчёт рейтинга после турнира
get_battle_public()          — публичные данные баттла
get_battle_votes()           — результаты голосования
cast_battle_vote()           — проголосовать за игрока
get_loyalty_balance()        — баланс баллов лояльности
generate_voucher()           — генерация ваучера со скидкой
...
```

---

## 5. Авторизация и роли

### Уровни доступа

| Роль | Доступ |
|------|--------|
| **Гость** | Просмотр публичных страниц |
| **user** | Личный кабинет, профиль, голосование в баттлах |
| **user + membership** | Все функции user + турниры + вызовы + лояльность |
| **manager** | Всё user + админ-панель (CRUD) + бан/удаление обычных пользователей |
| **admin** | Полный доступ ко всему |

### Поток авторизации

```
Гость → auth.html → Email/Password или Google OAuth или Telegram Login
  → Turnstile CAPTCHA проверка (серверная)
  → Supabase Auth → JWT токен → localStorage
  → Device fingerprint → проверка user_devices
  → Новое устройство? → security-notify (email + TG)
  → Redirect → dashboard.html

Каждая защищённая страница:
  → auth-guard.js → проверка JWT
  → session-monitor.js → таймаут 30 мин / макс 7 дней
  → Нет токена → redirect auth.html?return=<url>
  → Есть токен → загрузка профиля → auth-ready
```

### Файлы авторизации

| Файл | Назначение |
|------|-----------|
| `supabase-config.js` | Инициализация Supabase клиента, кеш профиля |
| `auth.js` | Форма логина/регистрации |
| `auth-guard.js` | Защита роутов, загрузка профиля, функции requireStaff/requireAdmin |
| `auth-nav.js` | UI навигации: "Войти" ↔ User Dropdown |

### Безопасность и защита

#### Аутентификация

| Механизм | Реализация | Файл |
|----------|-----------|------|
| **Email/Password** | Supabase Auth (bcrypt hash) | `auth.js` |
| **Google OAuth** | Supabase OAuth provider | `auth.js` |
| **Telegram Login** | HMAC-SHA-256 подпись + auth_date < 24ч | `telegram-auth/index.ts` |
| **CAPTCHA** | Cloudflare Turnstile (серверная проверка) | `verify-turnstile/index.ts` |

#### Пароли

- Хранение: **bcrypt** в Supabase Auth (таблица `auth.users`, недоступна напрямую)
- Требования: 8+ символов, заглавная буква (A-Z), цифра (0-9), спецсимвол (!@#$)
- Одинаковые правила на web и mobile
- Сброс через email (Supabase resetPasswordForEmail)

#### CAPTCHA (Cloudflare Turnstile)

```
Форма → Turnstile widget → _turnstileToken (клиент)
  ↓
fetch → Edge Function verify-turnstile (серверная проверка)
  ↓
Cloudflare API → success/fail
  ↓
Только при success → signInWithPassword / signUp
```

Установлена на: login, signup.
**TODO:** добавить на форму сброса пароля.

#### Rate Limiting

| Уровень | Механизм | Лимиты |
|---------|----------|--------|
| **Клиентский** | `_loginAttempts` + `_lockoutUntil` | 5 попыток → блок 60 сек |
| **Supabase Auth** | Встроенный rate limit | Дефолтные (настраиваемые в Dashboard) |
| **Edge Functions** | Supabase Gateway | Per-function limits |

> ⚠️ Клиентский лимит обходится через DevTools/curl. Серверный rate limiting через Edge Function — в планах.

#### Защита от перебора вызовов

| Функция | Лимит | Механизм |
|---------|-------|----------|
| Создание вызовов | 5/день | `create-challenge` (серверная проверка) |
| Приглашения на игру | 5/день | `send-game-invite` (серверная проверка) |
| Голосование в баттлах | 1 голос | `cast_battle_vote` RPC + UNIQUE constraint |

#### Управление сессиями (`session-monitor.js`)

| Параметр | Значение |
|----------|----------|
| Таймаут бездействия | 30 минут |
| Максимальный возраст сессии | 7 дней |
| Cross-tab синхронизация | StorageEvent → logout во всех вкладках |
| JWT expiry | Настраивается в Supabase Dashboard |

#### Fingerprint устройства

```
Login → simpleHash(userAgent + screenSize) → device_hash
  ↓
SELECT user_devices WHERE profile_id + device_hash
  ↓
Новое устройство? → security-notify (email + TG)
  ↓
UPSERT user_devices (обновляем last_seen)
```

Таблица `user_devices`: profile_id, device_hash, user_agent, last_seen.
RLS: пользователь видит/вставляет/обновляет только свои записи.

#### Уведомления безопасности (`security-notify/index.ts`)

| Событие | Email | Telegram |
|---------|-------|----------|
| Смена пароля | ✅ | ✅ |
| Вход с нового устройства | ✅ | ✅ |

Уведомления проверяют `notify_preferences.security` (opt-out).

#### RLS (Row Level Security)

Каждая таблица защищена политиками:
- **profiles** — SELECT/UPDATE только свой (auth.uid() = id)
- **user_devices** — SELECT/INSERT/UPDATE только свои
- **game_invites** — sender видит отправленные, receiver — полученные
- **challenges** — участники видят свои, staff — все
- **challenge_predictions** — 1 голос на пользователя
- **loyalty_*** — staff full CRUD, users read own + redeem
- **coaches/courts/news/players** — публичное чтение, запись только staff
- **memberships/payments** — staff full access

#### UNIQUE constraints (защита данных)

| Поле | Таблица | Назначение |
|------|---------|-----------|
| phone | profiles | Один телефон = один аккаунт |
| telegram_chat_id | profiles | Один Telegram = один аккаунт |
| (profile_id, device_hash) | user_devices | Одно устройство = одна запись |
| (challenge_id, profile_id) | challenge_predictions | Один голос на баттл |

#### Удаление аккаунта (`delete-account/index.ts`)

1. Soft delete: данные логируются в `deleted_accounts` (trigger)
2. Hard delete: `auth.admin.deleteUser()` — удаление из Supabase Auth
3. Каскадное удаление: `ON DELETE CASCADE` на связанных таблицах

#### Известные ограничения и TODO

| Проблема | Приоритет | Статус |
|----------|-----------|--------|
| Смена пароля через signInWithPassword (brute force вектор) | КРИТИЧНО | TODO: перейти на нативный Supabase requireCurrentPassword |
| Сброс пароля без CAPTCHA (email bombing) | КРИТИЧНО | TODO: добавить Turnstile |
| signOut({ scope: 'others' }) после смены пароля | ВАЖНО | TODO |
| Серверный rate limiting (Edge Function middleware) | ВАЖНО | TODO |
| Ужесточить дефолтные Supabase rate limits | СРЕДНЕ | TODO: настройки в Dashboard |
| Единообразный ответ при сбросе (anti-enumeration) | СРЕДНЕ | TODO |
| Уведомление при смене телефона/email | НИЗКО | TODO |
| Валидация формата Instagram/Telegram handles | НИЗКО | TODO |
| Нет 2FA | НИЗКО | Не планируется на текущем этапе |
| Нет верификации телефона (OTP/SMS) | НИЗКО | Дорого, не критично |

---

## 6. Frontend — Архитектурные паттерны

### Мультиязычность (файловая)

```
index.html          — RU (базовый)
index-en.html       — EN
index-kg.html       — KG

Определение: window.location.pathname.indexOf('-en') !== -1
```

Каждый JS-файл содержит объект labels для языков:
```javascript
var isEn = window.location.pathname.indexOf('-en') !== -1;
var isKg = window.location.pathname.indexOf('-kg') !== -1;
var L = isEn ? { profile: 'Profile' } : isKg ? { profile: 'Профиль' } : { profile: 'Профиль' };
```

### IIFE-модули (изоляция)

Каждый JS-файл обёрнут в IIFE — нет глобальных переменных:
```javascript
(function() {
    'use strict';
    // вся логика модуля
})();
```

### JSDoc типизация

Ключевые функции аннотированы JSDoc:
```javascript
/**
 * @param {string} profileId - UUID пользователя
 * @param {Object} options
 * @param {number} options.amount - Сумма в KGS
 * @returns {Promise<{success: boolean, error?: string}>}
 */
```

### CSS-префиксы по страницам

| Префикс | Страница |
|---------|----------|
| `pt-` | Partners (найти партнёра) |
| `sv-` | Services (услуги) |
| `db-` | Dashboard (личный кабинет) |
| `ad-` | Admin (админ-панель) |
| `io-` | Info overview (инфо-хаб) |
| `co-` | Coaches (тренеры) |
| `ct-` | Courts (корты) |
| `pl-` | Players (рейтинг) |
| `td-` | Tournament detail (сетка) |
| `pr-` | Pricing (цены) |
| `ip-` | Info pages (about, faq, rules) |
| `ch-` | Challenge detail (баттл) |
| `lm-` | Live match (живой матч) |
| `um-` | Umpire (панель судьи) |
| `bc-` | Battle cards (карточки баттлов) |
| `bo-` | Battles overview |
| `vr-` | Verify (верификация) |

### Дизайн-система (CSS-переменные)

```css
--accent: #CCFF00;              /* electric lime */
--bg-primary: #0A0A0F;          /* тёмный фон */
--bg-card: rgba(255,255,255,0.03);
--border-subtle: rgba(255,255,255,0.06);
--radius-full: 9999px;          /* pill shape */
--transition-fast: 0.15s ease;
--shadow-lg: 0 25px 50px rgba(0,0,0,0.5);
```

Responsive breakpoints: 375px → 480px → 768px → 992px → 1920px+

### Загрузка данных (Supabase + fallback)

```javascript
// Пробуем Supabase
var result = await supabaseClient.from('coaches').select('*');
if (result.data && result.data.length > 0) {
    renderCards(result.data);
} else {
    // Fallback на статические данные из data/*.js
    renderCards(coachesData);
}
```

---

## 7. Edge Functions (20 штук)

| # | Функция | JWT | Триггер | Назначение |
|---|---------|-----|---------|-----------|
| 1 | `admin-manage-user` | Да | Админка | create_manager, ban/unban, delete_user |
| 2 | `auto-unban` | Нет (cron) | pg_cron 09:00 | Авто-разбан + TG уведомление |
| 3 | `battle-announce` | Да | Админка | Анонс баттла в TG группу |
| 4 | `battle-publish` | Да | Админка | Публикация баттла + inline кнопки голосования |
| 5 | `broadcast` | Да | Админка | Универсальная Email/TG рассылка |
| 6 | `create-challenge` | Да | Dashboard | Создание вызова (membership check, 5/day limit) |
| 7 | `delete-account` | Да | Dashboard | Soft delete + hard delete auth.users |
| 8 | `match-notify` | Нет (cron) | pg_cron + manual | Уведомления о матчах |
| 9 | `membership-expire` | Нет (cron) | pg_cron 09:30 | Auto-expire + TG + Email |
| 10 | `membership-notify` | Нет (cron) | pg_cron 10:00 | 7-day expiry reminder |
| 11 | `membership-tg-notify` | Да | Админка | Grant/extend/cancel → TG DM |
| 12 | `security-notify` | Да | Dashboard/Auth | Уведомление: смена пароля, новое устройство |
| 13 | `send-email` | Да | Система | Отправка email через Resend |
| 14 | `send-game-invite` | Да | Dashboard | Приглашение на игру → TG (5/day limit) |
| 15 | `telegram-auth` | Нет | Auth page | HMAC-SHA-256 верификация Telegram Login Widget |
| 16 | `telegram-webhook` | Нет | Telegram | Все callbacks + /start + /notifications + battle vote |
| 17 | `tournament-notify` | Да + cron | Админка + pg_cron | Анонс турнира в TG группу |
| 18 | `tournament-reminder` | Нет (cron) | pg_cron | Напоминание о турнире |
| 19 | `tournament-results-notify` | Да | Админка | Анонс результатов турнира в TG |
| 20 | `verify-turnstile` | Нет | Auth page | Серверная проверка Cloudflare Turnstile CAPTCHA |

### Паттерн Edge Function

```typescript
// CORS headers обязательны
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  // JWT auth (если включена)
  const supabase = createClient(url, anonKey, {
    global: { headers: { Authorization: req.headers.get('Authorization')! } }
  });
  const { data: { user } } = await supabase.auth.getUser();

  // Логика...
  return new Response(JSON.stringify(result), { headers: corsHeaders });
});
```

---

## 8. Telegram Bot

| Параметр | Значение |
|----------|----------|
| Username | @KSLTennisBot |
| Создан через | @BotFather |
| Webhook | Edge Function `/telegram-webhook` |
| Секрет | TELEGRAM_BOT_TOKEN в Supabase Vault |

### Команды

| Команда | Действие |
|---------|----------|
| `/start <profileId>` | Привязка Telegram к профилю KSLT |
| `/membership` | Заявка на членство через бот |
| `/notifications` | Настройка уведомлений (4 категории, inline toggles) |
| Inline: Принять/Отклонить | Приглашение на игру |
| Inline: Записаться | Регистрация на турнир |
| Inline: Голосование (1/2) | Голос за игрока в баттле (с % после голоса) |

### Групповые рассылки

| Тип | Функция | Триггер |
|-----|---------|---------|
| Турнир | `tournament-notify` | Кнопка в админке + pg_cron |
| Баттл | `battle-announce` | Кнопка в админке |
| Матч | `match-notify` | Кнопка в админке + pg_cron |

---

## 9. Турнирная система

### Категории игроков (по возрастанию)

```
Tour → Futures → Challenger → Masters → Pro-Masters (высшая)
```

- Рейтинг ведётся ВНУТРИ категории
- Топ-5 → промоушен в высшую категорию
- Сезон = календарный год
- Defending points (как ATP/WTA)

### Типы турнирных сеток

| Тип | Описание |
|-----|----------|
| **Single Elimination (SE)** | Стандартная олимпийская сетка (8/16/32) |
| **Full Individual Consolation (FIC)** | Олимпийская + утешительные матчи (все места) |
| **Group Stage** | Групповой этап → плей-офф |

### Турнирная сетка (Bracket)

```
Генерация:
1. Approved игроки → draw
2. ITF seeding: топ-сиды на фиксированных позициях (SEED_POSITIONS)
3. Fisher-Yates shuffle для несеяных
4. Byes для неполной сетки (8/16/32)
5. FIC: bit-reversal order для финальных мест
6. Group Stage: деление на группы, round-robin в группах

Проведение:
1. Admin вводит счёт → modal с сетами
2. Auto-detect winner → advanceWinner() в следующий раунд
3. FIC: проигравшие продвигаются в утешительную сетку
4. Финализация → recalc_player_points() → обновление рейтинга
5. form[] → массив последних 5 результатов (W/L)
```

---

## 10. Challenge Battle System

### Жизненный цикл вызова

```
Игрок A → создаёт challenge → Telegram бот отправляет Игроку B
  → B принимает / делает counter-offer / отклоняет
  → Если accepted → статус challenge = accepted
  → Админ публикует баттл (battle_published = true)
  → Голосование на сайте + в Telegram (inline кнопки)
  → Матч проходит → umpire вводит счёт
  → Финализация → wins/losses/form обновляются
```

### Публичная страница баттла

`challenge.html` / `challenge-en.html` / `challenge-kg.html`:
- VS layout (2 игрока, фото, статистика)
- Голосование (бар с процентами)
- H2H: история личных встреч
- Детали матча (дата, время, корт)
- Score (после завершения)
- One-time voting: нельзя переголосовать
- Cross-check: site ↔ Telegram (один человек — один голос)

### Карточки баттлов

`battles.html` — обзорная страница:
- Grid: 3 колонки desktop / 2 tablet / 1 mobile
- Баннер матча, имена игроков, дата, статус
- Фильтры: активные / завершённые

---

## 11. Live Match System

### Архитектура

```
Admin → создаёт Live Match (source: free/tournament/battle)
  → Umpire (umpire.html) вводит счёт через панель
  → Supabase Realtime → live_matches → score_data (JSONB)
  → Публичная страница (live-match.html): scoreboard + YouTube embed
  → Scoreboard OBS (scoreboard.html): transparent overlay
  → Homepage: live cards с 15-секундным auto-refresh
```

### Umpire Engine (`js/umpire.js`)

Полный теннисный счёт:
- Games → Sets → Match
- Deuce / Advantage
- Tiebreak (7-point, first to 7, win by 2)
- Serve indicator (первая подача)
- Changeover timer (3 мин game / 5 мин set)
- Skip changeover button

### Создание Live Match (из админки)

3 источника:
1. **Free match** — свободный матч (выбор 2 игроков)
2. **Tournament bracket** — из сетки турнира
3. **Battle** — из принятого вызова

### Score sync

При завершении Live Match (tournament source):
- Score копируется в `matches` (tournament bracket)
- Ручной sync через кнопку в админке

---

## 12. Loyalty Program

### Механика

- **Earn**: при оплате (court/coach/membership) + финализации турнира
- **Welcome bonus**: 200 баллов за первое членство (one-time)
- **Redeem**: обмен на награды (запись на турнир, продление членства)
- **Expire**: авто-списание через 12 мес (pg_cron)

### Таблицы

- `loyalty_rules` — правила начисления (event_type, points)
- `loyalty_rewards` — награды для обмена (name, points_cost)
- `loyalty_transactions` — история (earn/redeem/adjust/expire)

### RPC

- `get_loyalty_balance(profile_id)` — текущий баланс

### UI

- Dashboard → вкладка "Баллы" (баланс, история, обмен)
- Admin → секция "Лояльность" (правила, награды, транзакции, manual adjust)

---

## 13. Членство

### Статусы

| Статус | Доступ |
|--------|--------|
| Нет членства | Просмотр, профиль |
| Активно | Турниры, приглашения, лояльность, полный доступ |
| Истекло | Ограниченный (как "нет членства") |

### Уведомления

- За 7 дней до истечения → TG + Email (`membership-notify`)
- При истечении → авто-expire + TG DM (`membership-expire`)
- При выдаче/продлении/отмене → TG DM (`membership-tg-notify`)
- Все уведомления проверяют `notify_preferences` (opt-out)

### Автоматические процессы (pg_cron)

| Процесс | Время (Бишкек) | Что делает |
|---------|----------------|------------|
| Авто-истечение | 09:30 | Просроченные → status='expired' → TG + Email |
| Напоминание | 10:00 | Истекающие через 7 дней → TG + Email |
| Авто-разбан | 09:00 | Снимает истёкшие баны → TG |
| Баллы expire | Ежедневно | Списание баллов старше 12 мес |

---

## 14. Админ-панель

**Модульная архитектура:** `js/admin/` — 18 файлов, ~22 000 строк

Все модули используют namespace `window.KSLT_ADMIN` (alias `A`). Каждый файл — IIFE, регистрирующий свои функции. Shared utilities в `core/utils.js`, layout в `core/layout.js`.

### Вкладки

| # | Вкладка | Содержимое | Роли |
|---|---------|-----------|------|
| 1 | Dashboard | Статистика (12 карточек + 6 таблиц) | all |
| 2 | Новости | CRUD + inline-фото + опрос + автосохранение | all |
| 3 | Турниры | CRUD + заявки + сетка (SE/FIC/Group Stage) | all |
| 4 | Игроки | Подвкладки: Список / Рейтинг / Результаты | Результаты — admin only |
| 5 | Корты | CRUD + координаты + promoted | all |
| 6 | Тренеры | CRUD + фото + авто-перевод | all |
| 7 | Пользователи | Воронка конверсии + аналитика + бан | all |
| 8 | Финансы | entity_payments + payments + PDF/Excel | all |
| 9 | Ваучеры | Дашборд + таблица + фильтры + отмена | all |
| 10 | Вызовы | Accepted/Published/Completed + publish/score | all |
| 11 | Live | Создание/управление живыми матчами | all |
| 12 | Лояльность | Правила + Награды + Транзакции + Adjust | all |
| 13 | Настройки | Правила очков / Промоушен | admin only |

### Отчёты и аналитика

- **PDF-экспорт** — Финансы, Пользователи, Ваучеры
- **Excel/CSV-экспорт** — UTF-8 BOM, все секции
- **Графики** — Chart.js: рост пользователей, динамика оплат (4 линии)
- **Воронка конверсии** — зарегистрировано → стали игроками → %

---

## 15. PWA (Progressive Web App)

- `manifest.json` — standalone, dark theme, icons (192/512/apple-touch-icon)
- **Service Worker** — pre-cache core assets, Network First HTML, Cache First CSS/JS/images
- Meta tags в всех 80 HTML-файлах
- Installable: desktop (Chrome) + mobile (Android/iOS)

---

## 16. Onboarding

Модальное окно для новых посетителей:
- Показывается один раз (localStorage flag)
- 3 языка (RU/EN/KG)
- Шаги: приветствие → возможности → как начать
- Кнопка "Не показывать снова"

---

## 17. Тестирование

### E2E тесты (Playwright)

9 test suites × 3 viewport (desktop 1920px / tablet 768px / mobile 375px):

| Suite | Что тестирует |
|-------|--------------|
| 01-pages-load | Все 80 страниц (HTTP 200, нет JS ошибок) |
| 02-navigation | Header links, language switcher, footer |
| 03-responsive | Horizontal overflow (5 breakpoints × 9 pages) |
| 04-css-integrity | No 404 for CSS/JS, dark theme, Inter font |
| 05-auth-page | Form elements, Google OAuth, validation |
| 06-homepage-sections | Hero, tournaments, news, courts, coaches |
| 07-pwa | Manifest, service worker, meta tags, icons |
| 08-seo-meta | Title, lang, charset, accessibility |
| 09-content-pages | About, FAQ, Rules, Pricing, etc. |

### Unit тесты (Vitest)

72 теста для Edge Functions:

| Suite | Тесты | Что тестирует |
|-------|-------|--------------|
| create-challenge | 23 | JWT, membership, limits, validation |
| admin-manage-user | 29 | create_manager, ban/unban, delete, roles |
| battle-publish | 20 | Auth, publish flow, TG announce, retry |

### CI/CD (GitHub Actions)

| Workflow | Триггер | Что делает |
|----------|---------|-----------|
| `test.yml` | push, PR | E2E + Unit тесты |
| `deploy.yml` | push to main | Auto-deploy на Netlify |

---

## 18. Деплой

### Frontend (Netlify)

```bash
git push origin main
# → GitHub Actions → tests → deploy на Netlify
```

### SQL миграции

1. Supabase Dashboard → SQL Editor
2. Вставить содержимое файла из `sql/`
3. Run

### Edge Functions

```bash
supabase functions deploy <name> --no-verify-jwt
```

### Секреты (Supabase Vault)

| Секрет | Назначение |
|--------|-----------|
| TELEGRAM_BOT_TOKEN | Токен Telegram бота |
| TELEGRAM_GROUP_CHAT_ID | ID группы |
| CRON_SECRET | Секрет для pg_cron |
| RESEND_API_KEY | API ключ для email (Resend) |

---

*Документация обновляется по мере развития проекта.*
