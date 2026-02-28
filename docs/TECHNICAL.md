# KSLT — Техническая документация

> Последнее обновление: 2026-02-27
> Версия: 1.0

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
├── pages/                          ← 52 HTML-страницы (26 RU + 26 EN)
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
├── css/                            ← 18 CSS-файлов (17 195 строк)
│   ├── style.css                   ← Дизайн-система (4 348 строк)
│   ├── admin.css                   ← Админ-панель (2 124)
│   ├── dashboard.css               ← Личный кабинет (1 110)
│   ├── players.css                 ← Рейтинги (1 227)
│   ├── news.css                    ← Новости (1 189)
│   ├── tournament-detail.css       ← Турнирная сетка (1 045)
│   ├── tournaments.css             ← Список турниров (704)
│   ├── tournaments-overview.css    ← Обзор турниров (623)
│   ├── courts.css                  ← Корты (702)
│   ├── coaches.css                 ← Тренеры (578)
│   ├── info-pages.css              ← About/FAQ/Rules (605)
│   ├── pricing.css                 ← Цены (579)
│   ├── services.css                ← Услуги (550)
│   ├── partners.css                ← Найти партнёра (892)
│   ├── info-overview.css           ← Инфо-хаб (324)
│   ├── player.css                  ← Профиль игрока (595)
│   └── coach.css                   ← Профиль тренера
│
├── js/                             ← 21 JS-файл (15 675 строк)
│   ├── admin.js                    ← Админ-панель (7 001) ★
│   ├── dashboard.js                ← Личный кабинет (1 233)
│   ├── tournament-detail.js        ← Сетка турнира (1 153)
│   ├── news.js                     ← Новости (830)
│   ├── players.js                  ← Рейтинги (693)
│   ├── partners.js                 ← Найти партнёра (568)
│   ├── courts.js                   ← Корты (505)
│   ├── tournament-generator.js     ← Генератор сетки (494)
│   ├── auth.js                     ← Авторизация (421)
│   ├── player.js                   ← Профиль игрока (410)
│   ├── script.js                   ← Глобальный (402)
│   ├── tournaments-overview.js     ← Обзор турниров (397)
│   ├── coaches.js                  ← Тренеры (394)
│   ├── services.js                 ← Услуги (390)
│   ├── tournaments-overlay.js      ← Список турниров (269)
│   ├── auth-nav.js                 ← User dropdown (118)
│   ├── info-overview.js            ← Инфо-хаб (117)
│   ├── auth-guard.js               ← Защита роутов (104)
│   ├── membership.js               ← Членство (89)
│   ├── supabase-config.js          ← Supabase клиент (49)
│   └── session-monitor.js          ← Мониторинг сессий (38)
│
├── data/                           ← 12 файлов статических данных (4 064 строк)
│   ├── tournaments-data.js / -en.js
│   ├── tournament-detail-data.js / -en.js
│   ├── news-data.js / -en.js
│   ├── players-data.js / -en.js
│   ├── coaches-data.js / -en.js
│   └── courts-data.js / -en.js
│
├── sql/                            ← 16 SQL-миграций
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
│   └── functions/                  ← 3 Edge Functions (Deno/TypeScript)
│       ├── send-game-invite/       ← Отправка приглашений
│       ├── telegram-webhook/       ← Telegram бот
│       └── membership-notify/      ← Уведомления о членстве
│
├── docs/                           ← Документация
├── postman/                        ← API-тесты
└── images/                         ← Логотип
```

**Итого: 117 файлов, ~58 000 строк кода**

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
├── name
├── photo
├── category_id       → categories
├── points, wins, losses
├── rank_change
├── form[]            — последние 5 результатов (W/L)
└── seed

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
├── status            — upcoming / ongoing / completed
└── registration_deadline

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
├── title, content, image
├── category          — tournament / championship / other
└── published_at

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

notification_log      — лог уведомлений (защита от дублей)
├── profile_id, type
└── sent_at
```

### RLS-политики (Row Level Security)

Каждая таблица защищена:
- **profiles** — пользователь видит/редактирует только свой
- **game_invites** — sender видит отправленные, receiver — полученные
- **coaches/courts/news** — публичное чтение, запись только admin/manager
- **players** — публичное чтение, запись через admin
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
| **manager** | Всё user + админ-панель (CRUD) |
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

### Турнирная сетка (Bracket)

```
Генерация:
1. Approved игроки → draw
2. ITF seeding: топ-сиды на фиксированных позициях (SEED_POSITIONS)
3. Fisher-Yates shuffle для несеяных
4. Byes для неполной сетки (8/16/32)

Проведение:
1. Admin вводит счёт → modal с сетами
2. Auto-detect winner → advanceWinner() в следующий раунд
3. Финализация → recalc_player_points() → обновление рейтинга
4. form[] → массив последних 5 результатов (W/L)
```

### Файлы турнирной системы

| Файл | Назначение |
|------|-----------|
| `admin.js` (секция Brackets) | Управление заявками + сеткой |
| `tournament-generator.js` | Алгоритм генерации сетки |
| `tournament-detail.js` | Публичная визуализация сетки |
| `bracket-system-migration.sql` | Таблицы: registrations, matches |
| `rating-system-migration.sql` | Таблицы: levels, points_rules |

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

**Файл:** `admin.js` (7 001 строка) — самый большой файл проекта

### Секции CRUD

| Секция | Таблица | Функции |
|--------|---------|---------|
| Тренеры | coaches | CRUD + фото + авто-перевод |
| Корты | courts | CRUD + координаты + promoted |
| Игроки | players | CRUD + категория + рейтинг |
| Турниры | tournaments | CRUD + заявки + сетка + финализация |
| Уровни | tournament_levels | CRUD + правила начисления очков |

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
| Bracket | Турнирная сетка (ITF seeding) | ✅ |
| Services | Страница услуг (promoted сверху) | ✅ |
| Info | Информационный хаб | ✅ |
| Partners | Найти партнёра + фильтры + поиск | ✅ |
| Game Invite | Приглашения через Telegram бот | ✅ |
| User Dropdown | Dropdown меню в навигации | ✅ |
| Dashboard Invitations | Таб "Приглашения" в ЛК | ✅ |

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

### Лимиты
- Приглашения на игру: 30 в день на пользователя
- Аватар: максимум 2MB (JPG/PNG)
- Турнирная сетка: 8, 16 или 32 участника

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
