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
├── pages/                        # 46 HTML страниц (RU/EN/KG)
├── css/                          # 16 CSS файлов (~20,400 строк)
│   └── style.css                 #   Дизайн-система + глобальные стили
├── js/                           # 34 JS файла (~26,400 строк)
│   ├── admin/                    #   Админка (модульная)
│   │   ├── core/                 #   constants.js, utils.js, layout.js, init.js
│   │   └── sections/             #   news.js, tournaments.js, bracket.js, ...
│   ├── supabase-config.js        #   Supabase клиент
│   ├── auth.js                   #   Авторизация
│   ├── auth-nav.js               #   Навигация (dropdown админа)
│   ├── auth-guard.js             #   Middleware защиты роутов
│   ├── dashboard.js              #   Личный кабинет
│   └── script.js                 #   Header, burger, scroll, lang dropdown
├── data/                         # Статические данные (fallback)
├── sql/                          # SQL миграции
├── supabase/functions/           # 7 Edge Functions (Deno/TypeScript)
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
# Создай Pull Request → Review → Merge
```

### Формат коммитов

```
Add: новая фича
Fix: исправление бага
Update: доработка существующей фичи
Refactor: рефакторинг без изменения поведения
Docs: документация
Style: CSS / оформление
```

---

## Код стайл

### HTML
- Файловая мультиязычность: `page.html` (RU), `page-en.html` (EN), `page-kg.html` (KG)
- Каждая страница — отдельный файл (нет SPA)
- Supabase SDK подключается через CDN (unpkg.com)

### CSS
- Префиксы по страницам: `co-` (coaches), `ct-` (courts), `pl-` (players), `td-` (tournament-detail), `ad-` (admin), `db-` (dashboard)
- Переменные в `:root` (`--accent`, `--bg-card`, `--text-primary`)
- Breakpoints: 375 / 480 / 768 / 992px
- Дизайн: dark theme, accent `#CCFF00`, Inter font, glassmorphism

### JavaScript
- **Vanilla JS** — без фреймворков и бандлеров
- IIFE паттерн для модулей
- `var` вместо `let`/`const` (поддержка старых браузеров)
- Детекция языка: `window.location.pathname.indexOf('-en') !== -1`
- Supabase primary + static fallback: загружаем из БД, при ошибке — из `data/*.js`

### Админка (js/admin/)
- Namespace: `window.KSLT_ADMIN` (сокращённо `A`)
- Каждый модуль — IIFE: `(function() { var A = window.KSLT_ADMIN; ... })()`
- Labels: `var L = A.L` (RU/EN объект в `constants.js`)
- Shared utils: `A.showToast()`, `A.esc()`, `A.showConfirm()`, `A.uploadImage()`, `A.client`
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
- **Registered** — dashboard, полный рейтинг
- **Member** — регистрация на турниры, вызовы, challenge
- **Manager** — CRUD новостей/турниров/кортов/тренеров
- **Admin** — всё + пользователи + членство + рейтинг

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
| `matches` | Матчи турниров |
| `categories` | Категории игроков (Tour → Pro-Masters) |
| `courts` | Корты |
| `coaches` | Тренеры |
| `news` | Новости |
| `challenges` | Вызовы на матч |
| `memberships` | Членство |
| `payments` | Платежи |

### Edge Functions (7 штук)
| Функция | Назначение |
|---------|-----------|
| `admin-manage-user` | Создание менеджера, удаление пользователя |
| `create-challenge` | Создание вызова на матч |
| `match-notify` | Уведомления о матчах (авто + ручные) |
| `membership-notify` | Напоминания о членстве |
| `send-game-invite` | Приглашение на игру |
| `telegram-webhook` | Webhook Telegram бота |
| `tournament-notify` | Анонс турнира в TG группу |

### Таблицы (рейтинг)
| Таблица | Назначение |
|---------|-----------|
| `tournament_results` | Результаты турниров (round_reached, points_earned, season) |
| `rating_history` | История рейтинга для графика (tournament_name, points_earned, ntrp_before/after) |
| `points_rules` | Правила начисления очков по уровням турниров |
| `categories` | Категории игроков: Tour → Futures → Challenger → Masters → Pro-Masters |

### NTRP рейтинг (Elo-алгоритм)

NTRP (National Tennis Rating Program) — универсальный рейтинг навыка от 1.0 до 7.0.
Пересчитывается автоматически при финализации турнира.

**Формула (Modified Elo):**
```
expected = 1 / (1 + 10^((Rb - Ra) / 2.0))
new_rating = old_rating + K × (actual - expected)
```

| Параметр | Значение | Описание |
|----------|----------|----------|
| `K` | 0.15 | Коэффициент изменения (меньше K → медленнее меняется рейтинг) |
| `scale` | 2.0 | Делитель разницы рейтингов (стандартный Elo = 400, для шкалы 1-7 адаптирован) |
| `actual` | 1 (победа) / 0 (поражение) | Результат матча |
| `expected` | 0.0 - 1.0 | Вероятность победы на основе текущих рейтингов |
| `clamp` | 1.0 - 7.0 | Рейтинг не выходит за пределы шкалы |
| `default` | 3.0 | Начальный рейтинг для игроков без NTRP |

**Пример:**
- Игрок A (NTRP 3.5) vs Игрок B (NTRP 3.0)
- expected_A = 1/(1 + 10^((3.0-3.5)/2.0)) = 0.64 (A фаворит)
- Если A **выигрывает**: new_A = 3.5 + 0.15×(1 - 0.64) = 3.55
- Если A **проигрывает**: new_A = 3.5 + 0.15×(0 - 0.64) = 3.40

**Особенности:**
- Матчи обрабатываются в порядке раундов (R1 → QF → SF → F)
- Рейтинг обновляется последовательно: результат R1 влияет на расчёт QF
- При повторной финализации рейтинг пересчитывается заново (не дублируется)
- BYE матчи не влияют на рейтинг
- Хранение: `players.ntrp_rating` (текущий), `rating_history.ntrp_before/after` (история)

### SQL миграции
Все миграции в папке `sql/`. Запускать в **Supabase SQL Editor** в порядке создания.

---

## Деплой

### Frontend (Netlify / Cloudflare Pages)
- Push в `main` → автодеплой
- Настроек сборки нет (статика)

### Edge Functions
```bash
supabase functions deploy <name> --no-verify-jwt
```

### Secrets (Supabase Dashboard → Edge Functions → Secrets)
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_GROUP_CHAT_ID`
- `CRON_SECRET`

---

## Полезные ссылки

- [docs/TECHNICAL.md](docs/TECHNICAL.md) — полная техническая документация
- [docs/MANAGER-GUIDE.md](docs/MANAGER-GUIDE.md) — инструкция для менеджеров
- [docs/API.md](docs/API.md) — API документация
