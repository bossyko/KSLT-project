# KSLT — Техническая документация

> Последнее обновление: 2026-03-17
> Версия: 1.5

---

## 1. Обзор проекта

**KSLT (Kyrgyzstan Social Lawn Tennis)** — веб-платформа теннисного сообщества Кыргызстана. Объединяет любителей и профессионалов: рейтинги, турниры, тренеры, корты, членство.

| Параметр | Значение |
|----------|----------|
| Языки | RU (основной), EN, KG |
| Тема | Dark, accent #CCFF00 |
| Шрифт | Inter |
| Хостинг | GitHub Pages (фронтенд) |
| Backend | Supabase (PostgreSQL + Auth + Storage + Edge Functions) |
| Бот | Telegram Bot API |
| Фреймворки | Нет (Vanilla HTML/CSS/JS) |
| Сборка | Нет (статика, без бандлера) |

---

## 2. Стек технологий

### Frontend
- **HTML5** — статические страницы, файловая мультиязычность (`-en`, `-kg` суффиксы)
- **CSS3** — переменные, glassmorphism, responsive (375/480/768/992px)
- **Vanilla JavaScript** — IIFE-модули, без зависимостей
- **Supabase JS SDK** — подключение через CDN (unpkg.com)

### Backend (Supabase)
- **PostgreSQL** — основная база данных
- **Row Level Security (RLS)** — безопасность на уровне строк
- **Auth** — email/password + Google OAuth
- **Storage** — аватары пользователей
- **Edge Functions** — Deno/TypeScript (серверная логика)
- **RPC** — SQL-функции вызываемые с фронта

### Интеграции
- **Telegram Bot** (`@KSLTennisBot`) — уведомления, приглашения на игру
- **Cropper.js** — обрезка аватаров в dashboard

---

## 3. Структура проекта

```
KSLT/
├── index.html / index-en.html / index-kg.html    ← Главная (3 языка)
│
├── pages/                          ← 42 HTML-страницы
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
│   ├── about.html                  ← О проекте
│   ├── faq.html                    ← FAQ
│   ├── rules.html                  ← Правила
│   ├── pricing.html                ← Цены
│   └── offer.html                  ← Публичная оферта
│
├── css/                            ← 18 CSS-файлов (20 192 строк)
│   ├── style.css                   ← Дизайн-система (4 692 строк)
│   ├── admin.css                   ← Админ-панель (3 302)
│   ├── players.css                 ← Рейтинги (1 528)
│   ├── tournament-detail.css       ← Детали турнира (1 511)
│   ├── news.css                    ← Новости (1 227)
│   ├── dashboard.css               ← Личный кабинет (1 110)
│   ├── partners.css                ← Найти партнёра (980)
│   ├── courts.css                  ← Корты (908)
│   ├── tournaments.css             ← Список турниров (754)
│   ├── coaches.css                 ← Тренеры (731)
│   ├── tournaments-overview.css    ← Обзор турниров (679)
│   ├── services.css                ← Услуги (667)
│   ├── info-pages.css              ← About/FAQ/Rules (605)
│   ├── player.css                  ← Профиль игрока (595)
│   ├── pricing.css                 ← Цены (579)
│   ├── info-overview.css           ← Инфо-хаб (324)
│   └── coach.css                   ← Профиль тренера
│
├── js/                             ← 34 JS-файла (26 400 строк)
│   ├── admin/                      ← Админ-панель (17 400+, модульная) ★
│   │   ├── core/
│   │   │   ├── constants.js        ← L (EN/RU), ICONS, enums (1 700+)
│   │   │   ├── utils.js            ← toast, confirm, esc, translate, uploadImage (312)
│   │   │   ├── layout.js           ← sidebar, tabs, dashboard (450)
│   │   │   └── init.js             ← onAuthReady orchestration (33)
│   │   └── sections/
│   │       ├── news.js             ← CRUD + inline-фото + опрос (1 374)
│   │       ├── tournaments.js      ← CRUD + заявки + финализация (1 518)
│   │       ├── bracket.js          ← Сетка SE/FIC/Group Stage (3 950)
│   │       ├── courts.js           ← CRUD + promoted + координаты (1 556)
│   │       ├── coaches.js          ← CRUD + фото + авто-перевод (1 089)
│   │       ├── ratings.js          ← Таблица + промоушен + правила (1 147)
│   │       ├── players.js          ← CRUD + категория (594)
│   │       ├── memberships.js      ← Одобрение + история + статы + период + PDF (900+)
│   │       ├── payments.js         ← CRUD + promoted + статы + период + PDF (770+)
│   │       ├── vouchers.js         ← Дашборд + таблица + фильтры + PDF (430+)
│   │       └── users.js            ← Список + роли + аналитика + график + PDF (1 400+)
│   ├── tournament-detail.js        ← Сетка турнира (1 860)
│   ├── dashboard.js                ← Личный кабинет (1 233)
│   ├── players.js                  ← Рейтинги (1 039)
│   ├── news.js                     ← Новости (1 003)
│   ├── courts.js                   ← Корты (723)
│   ├── partners.js                 ← Найти партнёра (667)
│   ├── coaches.js                  ← Тренеры (561)
│   ├── services.js                 ← Услуги (573)
│   ├── tournament-generator.js     ← Генератор сетки (494)
│   ├── script.js                   ← Глобальный (492)
│   ├── tournaments-overview.js     ← Обзор турниров + поиск (453)
│   ├── auth.js                     ← Авторизация (421)
│   ├── player.js                   ← Профиль игрока (410)
│   ├── tournaments-overlay.js      ← Список турниров + поиск (359)
│   ├── auth-nav.js                 ← User dropdown (162)
│   ├── info-overview.js            ← Инфо-хаб (117)
│   ├── membership.js               ← Членство (105)
│   ├── auth-guard.js               ← Защита роутов (87)
│   ├── supabase-config.js          ← Supabase клиент (49)
│   └── session-monitor.js          ← Мониторинг сессий (38)
│
├── data/                           ← 12 файлов статических данных (4 077 строк)
│   ├── tournaments-data.js / -en.js
│   ├── tournament-detail-data.js / -en.js
│   ├── news-data.js / -en.js
│   ├── players-data.js / -en.js
│   ├── coaches-data.js / -en.js
│   └── courts-data.js / -en.js
│
├── sql/                            ← 40+ SQL-файлов
│   ├── bracket-system-migration.sql
│   ├── rating-system-migration.sql
│   ├── rating-system-fix.sql
│   ├── rls-security-fix.sql
│   ├── partners-migration.sql
│   ├── partners-rpc-update.sql
│   ├── game-invites-migration.sql
│   ├── membership-admin-migration.sql
│   ├── telegram-notifications-migration.sql
│   ├── add-promoted-column.sql
│   ├── add-women-futures.sql
│   ├── update-partners-rpc-playlevel.sql
│   └── *-seed.sql (тестовые данные)
│
├── supabase/
│   ├── schema.sql                  ← Основная схема БД
│   ├── seed.sql                    ← Начальные данные
│   └── functions/                  ← 6 Edge Functions (Deno/TypeScript)
│       ├── admin-manage-user/      ← Управление: create_manager, ban/unban user+player, delete_user
│       ├── send-game-invite/       ← Отправка приглашений
│       ├── create-challenge/       ← Вызовы на матч (Challenge Board)
│       ├── tournament-notify/      ← Рассылка турниров в Telegram
│       ├── telegram-webhook/       ← Telegram бот (все callbacks)
│       └── membership-notify/      ← Уведомления о членстве
│
├── docs/                           ← Документация
├── postman/                        ← API-тесты
└── images/                         ← Логотип
```

**Итого: ~150 файлов, ~78 000 строк кода**

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
├── gallery           — JSONB (legacy, заменён content_images)
├── category          — results / interview / announcement / world
├── author, executor
└── published_at      — null = черновик

memberships           — членство
├── profile_id        → profiles
├── type, start_date, end_date
└── status            — active / expired

payments              — платежи
├── profile_id, membership_id
├── amount, method    — cash / transfer / card
└── status

game_invites          — приглашения на игру
├── sender_id         → profiles
├── receiver_player_id → players
├── receiver_profile_id → profiles
├── status            — pending / accepted / declined / expired
└── created_at, responded_at

challenges            — вызовы на матч (Challenge Board)
├── challenger_id     → profiles
├── opponent_id       → profiles (player_id связь)
├── proposed_date, proposed_time
├── proposed_court    → courts.id или другая площадка
├── message           — до 150 символов
├── status            — pending / accepted / counter / declined / expired
└── expires_at        — автоматически через 72ч (pg_cron)

discount_vouchers     — ваучеры скидок (членство)
├── profile_id        → profiles
├── player_name       — имя игрока
├── entity_type       — court / coach
├── entity_id, entity_name
├── service_id, service_name
├── discount_percent  — процент скидки
├── qr_token          — уникальный токен для QR-кода
├── status            — active / used / expired / cancelled
├── created_at, expires_at, used_at
└── confirmed_by_ip   — IP при верификации

deleted_accounts      — лог удалённых аккаунтов
├── profile_id        — ID удалённого профиля
├── full_name, email, role, phone
├── telegram_chat_id, player_id
├── had_membership    — была ли активная подписка
├── deleted_at        — дата удаления
└── reason            — причина (опционально)
    Trigger: trg_log_deleted_profile BEFORE DELETE ON profiles

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

### RPC-функции

```sql
get_public_partners()     — список игроков с online, telegram, уровнем
get_my_game_invites()     — история приглашений (sent + received)
recalc_player_points()    — пересчёт рейтинга после турнира
```

---

## 5. Авторизация и роли

### Уровни доступа

| Роль | Доступ |
|------|--------|
| **Гость** | Просмотр публичных страниц |
| **user** | Личный кабинет, профиль, участие в турнирах |
| **user + membership** | Все функции user + приглашения на игру |
| **manager** | Всё user + админ-панель (CRUD) + бан/удаление обычных пользователей |
| **admin** | Полный доступ ко всему |

### Поток авторизации

```
Гость → auth.html → Email/Password или Google OAuth
  → Supabase Auth → JWT токен → localStorage
  → Redirect → dashboard.html

Каждая защищённая страница:
  → auth-guard.js → проверка JWT
  → Нет токена → redirect auth.html
  → Есть токен → загрузка профиля → auth-ready
```

### Файлы авторизации

| Файл | Назначение |
|------|-----------|
| `supabase-config.js` | Инициализация Supabase клиента, кеш профиля |
| `auth.js` | Форма логина/регистрации |
| `auth-guard.js` | Защита роутов, загрузка профиля, функции requireStaff/requireAdmin |
| `auth-nav.js` | UI навигации: "Войти" ↔ User Dropdown |

### localStorage

```
sb-qqkzszesviukopgjbead-auth-token  — JWT сессия Supabase
kslt_name                            — имя для dropdown
kslt_avatar                          — URL аватара для dropdown
kslt_role                            — роль (admin/manager/user)
```

---

## 6. Frontend — Архитектурные паттерны

### Мультиязычность (файловая)

```
index.html          — RU (базовый)
index-en.html       — EN
index-kg.html       — KG

Определение: window.location.pathname.indexOf('-en') !== -1
```

Каждый JS-файл содержит объект labels для обоих языков:
```javascript
var L = isEn ? {
    profile: 'Profile',
    save: 'Save'
} : {
    profile: 'Профиль',
    save: 'Сохранить'
};
```

### IIFE-модули (изоляция)

Каждый JS-файл обёрнут в IIFE — нет глобальных переменных:
```javascript
(function() {
    'use strict';
    // вся логика модуля
})();
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

### Detail-страницы (URL-параметры)

```
coach.html?id=abc123    → загрузка по ID
court.html?id=xyz789    → загрузка по ID
player.html?id=pl001    → загрузка по ID
tournament.html?id=t01  → загрузка + сетка
```

---

## 7. Edge Functions (Serverless)

### send-game-invite (TypeScript/Deno)

**Путь:** `supabase/functions/send-game-invite/index.ts`
**JWT:** Включён (требует авторизацию)

```
POST /send-game-invite
Body: { receiver_player_id: "player_id" }
Headers: Authorization: Bearer <JWT>, apikey: <ANON_KEY>

Логика:
1. Проверка JWT → получение sender_id
2. Загрузка профиля sender (имя, телефон, telegram)
3. Проверка роли: admin/manager → bypass членства
4. Проверка активного членства
5. Проверка лимита (30 приглашений/день)
6. Проверка дубликатов (pending к тому же игроку)
7. Поиск receiver: player → profile → telegram_chat_id
8. INSERT game_invites (status: pending)
9. Telegram: sendMessage с inline_keyboard [Принять] [Отклонить]
10. Ответ: { success: true }

Ошибки:
- 401: не авторизован
- 403: нет членства / лимит / дубликат
- 404: игрок не найден
- 400: telegram не привязан
```

### telegram-webhook (TypeScript/Deno)

**Путь:** `supabase/functions/telegram-webhook/index.ts`
**JWT:** Отключён (Telegram шлёт без авторизации)
**Webhook URL:** настроен через Telegram Bot API

```
POST /telegram-webhook
Body: Telegram Update object

Обработка /start <profileId>:
1. Валидация UUID
2. Сохранение chat_id + username в profiles
3. Ответ: "Telegram привязан к KSLT"

Обработка callback_query (invite_accept:UUID / invite_decline:UUID):
1. Парсинг action + invite_id
2. UPDATE game_invites SET status + responded_at
3. Если accepted:
   → Telegram получателю: "Принято! [Открыть чат]" (t.me/username)
   → Telegram отправителю: "Приглашение принято! [Открыть чат]"
4. Если declined:
   → Telegram отправителю: "Приглашение отклонено"
5. answerCallbackQuery() — убрать loading
6. editMessageReplyMarkup() — убрать кнопки
```

### membership-notify (TypeScript/Deno)

**Путь:** `supabase/functions/membership-notify/index.ts`
**Запуск:** pg_cron ежедневно в 04:00 UTC (10:00 Бишкек)

```
Логика:
1. Найти memberships с end_date через 7 дней
2. Проверить notification_log (не дублировать)
3. Telegram: напоминание об истечении членства
4. Записать в notification_log
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
| Inline: Принять | Принять приглашение на игру |
| Inline: Отклонить | Отклонить приглашение |
| Inline: Записаться | Регистрация на турнир (callback `tournament_register:{id}`) |

### Групповые рассылки

| Параметр | Значение |
|----------|----------|
| Секрет | TELEGRAM_GROUP_CHAT_ID в Supabase Vault |
| Функция | Edge Function `/tournament-notify` |
| Триггер (ручной) | Кнопка "Рассылка в Telegram" в форме турнира (admin) |
| Триггер (авто) | pg_cron ежедневно 05:00 UTC, `registration_start = today` |
| Дедупликация | Поле `tournaments.notified_at` |

### Deep Link

```
t.me/KSLTennisBot?start=UUID_PROFILE_ID
```

Ссылка размещена в dashboard → настройки → "Привязать Telegram"

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

### Уровни турниров

| Уровень | Очки за победу |
|---------|---------------|
| Кат.4 | Минимальные |
| Кат.3 | Средние |
| Кат.2 | Высокие |
| Кат.1 | Очень высокие |
| Grand (ТБШ) | Максимальные |

Очки за каждый раунд: W / F / SF / QF / R16 / R32

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

### Поиск турниров

- **Overview** (`tournaments-overview.js`): поиск по названию во всех категориях, debounce 200ms
- **Category** (`tournaments-overlay.js`): inline-поиск + фильтр статуса работают вместе

### Файлы турнирной системы

| Файл | Назначение |
|------|-----------|
| `admin/sections/bracket.js` | Управление заявками + сеткой (SE/FIC/Group Stage) |
| `tournament-generator.js` | Алгоритм генерации сетки |
| `tournament-detail.js` | Публичная визуализация сетки |
| `tournaments-overview.js` | Обзор категорий + поиск |
| `tournaments-overlay.js` | Список турниров + поиск + фильтры |
| `bracket-system-migration.sql` | Таблицы: registrations, matches |
| `rating-system-migration.sql` | Таблицы: levels, points_rules |
| `group-stage-migration.sql` | Расширение для группового этапа |

---

## 10. Членство

### Статусы

| Статус | Доступ |
|--------|--------|
| Нет членства | Просмотр, профиль |
| Активно | Турниры, приглашения, полный доступ |
| Истекло | Ограниченный (как "нет членства") |

### Проверка членства

```javascript
// Frontend (partners.js)
var memberRes = await client.from('memberships')
    .select('id').eq('profile_id', userId)
    .gte('end_date', new Date().toISOString())
    .eq('status', 'active').limit(1);

// Backend (Edge Function)
const { data: membership } = await supabase
    .from('memberships').select('id')
    .eq('profile_id', senderId)
    .gte('end_date', new Date().toISOString())
    .eq('status', 'active').limit(1);
```

### Уведомления

- За 7 дней до истечения → Telegram напоминание
- Ежедневная cron-задача через `membership-notify`

---

## 11. Админ-панель

**Модульная архитектура:** `js/admin/` — 14 файлов, ~16 000 строк

Все модули используют namespace `window.KSLT_ADMIN` (alias `A`). Каждый файл — IIFE, регистрирующий свои функции на общем namespace. Shared utilities (`A.showToast`, `A.esc`, `A.uploadImage`, `A.setupBulkDelete`) в `core/utils.js`, layout/navigation в `core/layout.js`.

### 10 вкладок (после рефакторинга)

| # | Вкладка | Содержимое | Роли |
|---|---------|-----------|------|
| 1 | Dashboard | Статистика (9 карточек + 6 таблиц) | all |
| 2 | Новости | CRUD + inline-фото + опрос + автосохранение | all |
| 3 | Турниры | CRUD + заявки + сетка (SE/FIC/Group Stage) | all |
| 4 | **Игроки** | Подвкладки: Список / Рейтинг / Результаты | Результаты — admin only |
| 5 | Корты | CRUD + координаты + promoted | all |
| 6 | Тренеры | CRUD + фото + авто-перевод | all |
| 7 | **Пользователи** | Воронка конверсии + аналитика + фильтр игроков | all |
| 8 | **Финансы** | Единая таблица: entity_payments + payments | all |
| 9 | Ваучеры | Дашборд + таблица + фильтры + отмена | all |
| 10 | **Настройки** | Подвкладки: Правила очков / Промоушен | admin only |

### Ключевые объединения

- **Игроки** = бывшая "Игроки" + "Рейтинг" (таблица + результаты)
- **Финансы** = бывшая "Оплаты" (entity_payments) + "Членство" (payments) — единая таблица с фильтром по типу
- **Настройки** = бывшая "Рейтинг → Правила очков" + "Рейтинг → Промоушен"

### Отчёты и аналитика

Секции с аналитикой (ваучеры, финансы, пользователи):

- **Карточки статистики** — ключевые метрики (всего, активных, за период)
- **Фильтр периода** — Всё время / Этот месяц / Прошлый месяц / Свой период
- **PDF-экспорт** — открывает отчёт в новой вкладке (`window.print()` → "Сохранить как PDF")
- **Ваучеры**: сумма скидок рассчитывается из цен кортов/тренеров × процент
- **Пользователи**: воронка конверсии (зарегистрировано → стали игроками → %), график динамики за текущий месяц (Chart.js — 4 линии: регистрации, стали игроками, удалено, прирост), таблица по умолчанию показывает только не-игроков (toggle "Показать всех")

### Трекинг удалённых аккаунтов

PostgreSQL trigger `trg_log_deleted_profile` — при удалении профиля данные копируются в таблицу `deleted_accounts`. Позволяет анализировать отток пользователей.

### Новости — расширенный функционал

- **Inline-фото** — фото вставляются между абзацами текста
  - WYSIWYG-превью: текст разбивается на абзацы, между ними кнопки "+ Фото" / "URL"
  - Хранение: `content_images JSONB [{url, after_paragraph}]`
  - Загрузка: файл (Supabase Storage) или URL (любой HTTPS)
- **Голосование** — опрос в конце статьи
  - Хранение: `poll JSONB {question, options}` или null
  - Голосование через localStorage (анонимное)
- **Автосохранение** — черновик сохраняется в Supabase каждые 3 сек (при наличии заголовка)
  - Нет localStorage-черновиков, нет модалки "Восстановить"
  - Черновик сразу виден в списке статей (published_at = null)

### Функции админа

- **Массовое удаление** — `setupBulkDelete()` универсальная функция
- **Авто-перевод** — `translateFromRu()` API для полей name_en
- **Транслитерация** — `transliterate()` Кириллица → Латиница
- **Формат телефона** — +996 XXX XX-XX-XX
- **Турнирная сетка** — полный цикл: заявки → draw → счёт → финализация
- **Членство** — одобрение/отказ + история платежей

---

## 12. Деплой

### Frontend (GitHub Pages)

```bash
git add .
git commit -m "описание"
git push origin main
# → автодеплой на GitHub Pages
```

### SQL миграции

1. Открыть Supabase Dashboard → SQL Editor
2. Вставить содержимое файла из `sql/`
3. Нажать Run

Файлы миграций:
- `sql/news-content-images-poll.sql` — content_images + poll колонки
- `sql/news-executor-column.sql` — executor колонка
- `sql/news-gallery-column.sql` — gallery колонка
- `sql/news-kg-columns.sql` — кыргызский язык колонки
- `sql/role-access-migration.sql` — RLS по ролям
- `sql/admin-users-migration.sql` — RLS для пользователей
- `sql/group-stage-migration.sql` — групповой этап турниров
- `sql/player-ban-migration.sql` — колонки бана + RLS для менеджера
- `sql/test-fic-16-players.sql` — тестовый FIC-турнир (16 игроков)
- `sql/test-32-players-promasters.sql` — тестовый SE-турнир (32 игрока)
- `sql/test-tournaments-seed.sql` — 90 тестовых турниров (6 категорий)

### Edge Functions

1. Supabase Dashboard → Edge Functions
2. "Deploy a new function" или выбрать существующую
3. "Via Editor" → вставить код из `supabase/functions/*/index.ts`
4. Deploy

### Секреты (Supabase Vault)

| Секрет | Назначение |
|--------|-----------|
| TELEGRAM_BOT_TOKEN | Токен Telegram бота |
| SUPABASE_SERVICE_ROLE_KEY | Серверный ключ (для Edge Functions) |

### Telegram Webhook

```bash
# Установка webhook
curl "https://api.telegram.org/bot<TOKEN>/setWebhook?url=https://qqkzszesviukopgjbead.supabase.co/functions/v1/telegram-webhook"
```

---

## 13. Завершённые этапы

| Этап | Описание | Статус |
|------|----------|--------|
| Phase 1 | Frontend — все страницы + responsive | ✅ |
| Phase 2 | Supabase backend + Auth + Dashboard | ✅ |
| Phase 3.1 | Членство (stub) | ✅ |
| Phase 4 | Админ-панель CRUD (5 секций) | ✅ |
| Phase 4.3 | Публичные страницы ← Supabase | ✅ |
| Рейтинг | Рейтинговая система в админке | ✅ |
| Bracket | Турнирная сетка SE (ITF seeding) | ✅ |
| Bracket FIC | Full Individual Consolation (все места) | ✅ |
| Bracket Group | Групповой этап + плей-офф | ✅ |
| Services | Страница услуг (promoted сверху) | ✅ |
| Info | Информационный хаб | ✅ |
| Partners | Найти партнёра + фильтры + поиск | ✅ |
| Game Invite | Приглашения через Telegram бот | ✅ |
| User Dropdown | Dropdown меню в навигации | ✅ |
| Dashboard Invitations | Таб "Приглашения" в ЛК | ✅ |
| Admin Users | Секция "Пользователи" в админке | ✅ |
| Admin Nav | Единый dropdown "Админка" для staff | ✅ |
| Admin Dashboard | 9 карточек статистики + 6 таблиц активности | ✅ |
| News Inline Photos | Фото в тексте + WYSIWYG-превью | ✅ |
| News Polls | Голосование в статьях | ✅ |
| News Autosave | Автосохранение черновиков в Supabase | ✅ |
| News Stats | Счётчик просмотров + статистика | ✅ |
| Sticky Filters | Фиксированные фильтры + scroll-to-top | ✅ |
| Category Ratings | Страницы рейтинга по категориям | ✅ |
| Pagination | Пагинация (тренеры, корты, партнёры) | ✅ |
| Sponsors | Блоки спонсоров на страницах | ✅ |
| Homepage CTA | Кнопки действий на главной (корты, тренеры) | ✅ |
| Tournament Search | Поиск турниров (overview + category) | ✅ |
| Admin Refactoring | 15 000 строк → 14 модулей (KSLT_ADMIN namespace) | ✅ |
| Admin Tab Consolidation | 11 вкладок → 10 (Рейтинг→Игроки, Членство+Оплаты→Финансы, Настройки) | ✅ |
| Users Funnel | Воронка конверсии: регистрации → игроки (карточки + график) | ✅ |
| KG Translation | 20 HTML + 6 data + 14 JS — кыргызский язык | ✅ |
| Voucher System | QR-ваучеры, лимиты, верификация, история | ✅ |
| Vouchers Admin | Дашборд, таблица, фильтры, период, PDF | ✅ |
| Period Filters + PDF | Оплаты, членства, пользователи — период + экспорт | ✅ |
| User Analytics | Карточки статистики + Chart.js график роста | ✅ |
| Deleted Accounts | PostgreSQL trigger + admin visibility | ✅ |
| Challenge Board | Вызовы на матч через Telegram (counter-offer, expire) | ✅ |
| Player Ban System | Бан/разбан игроков + TG уведомления + бейджи | ✅ |
| Manager Rights | Менеджер может банить/удалять обычных пользователей | ✅ |
| Admin Player Form | Имя+Фамилия, девиз, соцсети, матчи, прямоугольное фото | ✅ |
| Auto-Unban | pg_cron 09:00 Bishkek + Edge Function + TG уведомление | ✅ |

---

## 14. Известные особенности

### JWT в Edge Functions
- `telegram-webhook` — JWT **отключён** (Telegram шлёт без авторизации)
- `send-game-invite` — JWT **включён** + требует `apikey` header
- `membership-notify` — вызывается через pg_cron (service role)

### Self-invite
- В `send-game-invite` проверка `sender !== receiver` временно отключена для тестирования
- Нужно включить обратно для продакшена

### Статические данные (fallback)
- Файлы в `data/` — резервные данные если Supabase недоступен
- Используются на: coaches, courts, players, news, tournaments

### Content Security Policy
- `img-src 'self' data: https:` — разрешены все HTTPS-изображения (для inline-фото по URL)
- CSP задаётся в `<meta>` теге каждого HTML-файла (43 файла)

### Лимиты
- Приглашения на игру: 30 в день на пользователя
- Аватар: максимум 2MB (JPG/PNG)
- Турнирная сетка: 8, 16 или 32 участника (SE, FIC, Group Stage)

---

## 15. Полезные команды

### Supabase RPC (из консоли браузера)

```javascript
// Список партнёров
supabaseClient.rpc('get_public_partners').then(r => console.log(r.data))

// Мои приглашения
supabaseClient.rpc('get_my_game_invites').then(r => console.log(r.data))

// Профиль текущего пользователя
supabaseClient.from('profiles').select('*').eq('id', ksltUser.id).single()
```

### Git

```bash
git status          # текущее состояние
git log --oneline   # история коммитов
git push            # деплой на GitHub Pages
```

---

*Документация обновляется по мере развития проекта.*
