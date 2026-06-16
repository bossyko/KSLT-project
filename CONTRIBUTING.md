# KSLT — Contributing Guide

## Быстрый старт

```bash
git clone https://github.com/bossyko/KSLT-project.git
cd KSLT-project
python3 -m http.server 8080
# Открой http://localhost:8080
```

Сборка не нужна — проект полностью статический (HTML/CSS/JS). Supabase anon key уже в `js/supabase-config.js`.

---

## Структура проекта

```
KSLT/
├── index.html                    # Главная (RU)
├── index-en.html                 # Главная (EN)
├── index-kg.html                 # Главная (KG)
├── pages/                        # 76 HTML страниц (RU/EN/KG)
├── css/                          # 22 CSS файла (~27,500 строк)
│   └── style.css                 #   Дизайн-система + глобальные стили
├── js/                           # 45 JS файлов (~42,700 строк)
│   ├── admin/                    #   Админка (модульная, 18 файлов, ~22,000 строк)
│   │   ├── core/                 #   constants.js, utils.js, layout.js, init.js
│   │   └── sections/             #   news.js, tournaments.js, bracket.js,
│   │                             #   challenges.js, live.js, loyalty.js, ...
│   ├── umpire.js                 #   Движок теннисного счёта
│   ├── scoreboard.js             #   OBS overlay scoreboard
│   ├── live-match.js             #   Публичная страница живого матча
│   ├── challenge-detail.js       #   Баттл (VS, голосование, H2H)
│   ├── supabase-config.js        #   Supabase клиент
│   ├── auth.js                   #   Авторизация
│   ├── auth-nav.js               #   Навигация (dropdown)
│   ├── auth-guard.js             #   Middleware защиты роутов
│   ├── dashboard.js              #   Личный кабинет
│   └── script.js                 #   Header, burger, scroll, lang dropdown
├── data/                         # Статические данные (fallback)
├── sql/                          # 64 SQL миграций
├── supabase/functions/           # 15 Edge Functions (Deno/TypeScript)
├── tests/
│   ├── e2e/                      # 9 Playwright test suites
│   └── unit/                     # 72 Vitest теста (Edge Functions)
├── .github/workflows/            # CI/CD (test.yml + deploy.yml)
├── docs/                         # Документация
└── images/                       # Изображения
```

---

## Git Flow

### Ветки

| Ветка | Назначение |
|-------|-----------|
| `main` | Продакшен — только через PR |
| `feature/*` | Новые фичи (`feature/livescore`, `feature/booking`) |
| `fix/*` | Баг-фиксы (`fix/tournament-layout`) |
| `hotfix/*` | Срочные фиксы в продакшене |

### Процесс

```bash
# 1. Создай ветку от main
git checkout main
git pull
git checkout -b feature/my-feature

# 2. Работай, коммить
git add <files>
git commit -m "Add: описание изменения"

# 3. Push и создай PR
git push -u origin feature/my-feature
# Создай Pull Request → CI тесты → Review → Merge
```

### Формат коммитов

```
Add: новая фича
Fix: исправление бага
Update: доработка существующей фичи
Refactor: рефакторинг без изменения поведения
Docs: документация
Style: CSS / оформление
Test: добавление/изменение тестов
```

---

## Тестирование

### E2E тесты (Playwright)

```bash
# Запуск всех E2E тестов
npx playwright test

# Запуск конкретного suite
npx playwright test tests/e2e/01-pages-load.spec.js

# С UI
npx playwright test --ui
```

9 test suites, 3 viewport (desktop/tablet/mobile): page loading, navigation, responsive, CSS/JS integrity, auth, PWA, SEO, content pages.

### Unit тесты (Vitest)

```bash
# Запуск unit тестов
npx vitest run

# Watch mode
npx vitest
```

72 теста для Edge Functions: create-challenge, admin-manage-user, battle-publish.

### CI/CD

- **test.yml** — автоматически при push и PR (E2E + Unit)
- **deploy.yml** — auto-deploy на Netlify при push в main

---

## Код стайл

### HTML
- Файловая мультиязычность: `page.html` (RU), `page-en.html` (EN), `page-kg.html` (KG)
- Каждая страница — отдельный файл (нет SPA)
- Supabase SDK подключается через CDN (unpkg.com)

### CSS
- Префиксы по страницам: `co-` (coaches), `ct-` (courts), `pl-` (players), `td-` (tournament-detail), `ad-` (admin), `db-` (dashboard), `ch-` (challenge), `lm-` (live-match), `um-` (umpire)
- Переменные в `:root` (`--accent`, `--bg-card`, `--text-primary`)
- Breakpoints: 375 / 480 / 768 / 992px
- Дизайн: dark theme, accent `#CCFF00`, Inter font, glassmorphism

### JavaScript
- **Vanilla JS** — без фреймворков и бандлеров
- IIFE паттерн для модулей
- `var` вместо `let`/`const` (поддержка старых браузеров)
- JSDoc аннотации (`@param`, `@returns`, `@typedef`) для ключевых функций
- Детекция языка: `window.location.pathname.indexOf('-en') !== -1`
- Supabase primary + static fallback: загружаем из БД, при ошибке — из `data/*.js`

### Админка (js/admin/)
- Namespace: `window.KSLT_ADMIN` (сокращённо `A`)
- Каждый модуль — IIFE: `(function() { var A = window.KSLT_ADMIN; ... })()`
- Labels: `var L = A.L` (RU/EN объект в `constants.js`)
- Shared utils: `A.showToast()`, `A.esc()`, `A.showConfirm()`, `A.uploadImage()`, `A.exportCsv()`, `A.client`
- Экспорт для cross-module: `A.renderXxxSection`, `A.loadAndEditXxx`

### Edge Functions (Deno/TypeScript)
- Каждая функция в отдельной папке: `supabase/functions/<name>/index.ts`
- CORS headers обязательны
- Auth: JWT через `getUser()` или `CRON_SECRET`
- Deploy: `supabase functions deploy <name> --no-verify-jwt`

---

## Ключевые паттерны

### Supabase → публичная страница
```javascript
// 1. Загрузка из Supabase
var { data, error } = await supabaseClient.from('table').select('*');
if (data && data.length) {
    renderCards(data);
} else {
    // 2. Fallback на статику
    renderCards(window.staticData);
}
```

### Доступ по ролям
- **Guest** — публичные страницы, ограниченный рейтинг (blur)
- **Registered** — dashboard, полный рейтинг, голосование в баттлах
- **Member** — регистрация на турниры, вызовы, challenge, лояльность
- **Manager** — CRUD новостей/турниров/кортов/тренеров + баттлы + live
- **Admin** — всё + пользователи + членство + рейтинг + настройки

### Edge Function вызов из фронта
```javascript
var session = await supabaseClient.auth.getSession();
var token = session.data.session.access_token;
var res = await fetch(SUPABASE_URL + '/functions/v1/<name>', {
    method: 'POST',
    headers: {
        'Authorization': 'Bearer ' + token,
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY           // ОБЯЗАТЕЛЬНО
    },
    body: JSON.stringify({ ... })
});
```

---

## Supabase

### Таблицы (основные)
| Таблица | Назначение |
|---------|-----------|
| `profiles` | Аккаунты пользователей (auth) |
| `players` | Карточки игроков (рейтинг) |
| `tournaments` | Турниры |
| `tournament_registrations` | Заявки на турниры |
| `matches` | Матчи турниров (tournament / duel) |
| `categories` | Категории игроков (Tour → Pro-Masters) |
| `courts` | Корты |
| `coaches` | Тренеры |
| `news` | Новости |
| `challenges` | Вызовы на матч + баттлы |
| `challenge_predictions` | Голоса за баттлы |
| `memberships` | Членство |
| `entity_payments` | Оплаты (membership/court/coach/club) |
| `live_matches` | Живые матчи |
| `loyalty_rules` | Правила лояльности |
| `loyalty_rewards` | Награды лояльности |
| `loyalty_transactions` | Транзакции баллов |
| `discount_vouchers` | Ваучеры скидок |

### Edge Functions (15 штук)
| Функция | Назначение |
|---------|-----------|
| `admin-manage-user` | Создание менеджера, бан/разбан, удаление |
| `auto-unban` | Авто-разбан по pg_cron |
| `battle-announce` | Анонс баттла в TG группу |
| `battle-publish` | Публикация баттла + TG inline голосование |
| `broadcast` | Универсальная Email/TG рассылка |
| `create-challenge` | Создание вызова на матч |
| `match-notify` | Уведомления о матчах |
| `membership-expire` | Auto-expire членства |
| `membership-notify` | Напоминания о членстве |
| `membership-tg-notify` | TG DM при выдаче/отмене |
| `send-email` | Email через Resend |
| `send-game-invite` | Приглашение на игру |
| `telegram-webhook` | Webhook Telegram бота |
| `tournament-notify` | Анонс турнира в TG |
| `tournament-reminder` | Напоминание о турнире |

### SQL миграции
Все миграции в папке `sql/` (64 файла). Запускать в **Supabase SQL Editor**.

---

## Деплой

### Frontend (Netlify)
- Push в `main` → GitHub Actions → tests → auto-deploy
- Настроек сборки нет (статика)

### Edge Functions
```bash
supabase functions deploy <name> --no-verify-jwt
```

### Secrets (Supabase Dashboard → Edge Functions → Secrets)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_CHAT_ID`
- `CRON_SECRET`
- `RESEND_API_KEY`

---

## Полезные ссылки

- [docs/TECHNICAL.md](docs/TECHNICAL.md) — полная техническая документация (RU)
- [docs/TECHNICAL-EN.md](docs/TECHNICAL-EN.md) — полная техническая документация (EN)
- [docs/MANAGER-GUIDE.md](docs/MANAGER-GUIDE.md) — инструкция для менеджеров (RU)
- [docs/MANAGER-GUIDE-EN.md](docs/MANAGER-GUIDE-EN.md) — инструкция для менеджеров (EN)
- [docs/API.md](docs/API.md) — API документация
