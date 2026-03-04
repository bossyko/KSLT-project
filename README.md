# KSLT — Kyrgyzstan Social Lawn Tennis

Теннисное сообщество Кыргызстана — платформа для игроков, тренеров, турниров и кортов.

## Возможности

- **Рейтинговая система** — очки по категориям (Tour → Futures → Challenger → Masters → Pro-Masters)
- **Турниры** — расписание, турнирная сетка, жеребьёвка, автоподсчёт очков
- **Тренеры и корты** — каталоги с фильтрами, пагинацией, promoted-карточки
- **Найти партнёра** — поиск теннисистов для игры, приглашения через Telegram
- **Новости** — статьи с фото, голосования, счётчик просмотров
- **Личный кабинет** — профиль, аватар с кропом, статистика, настройки
- **Админ-панель** — CRUD всех сущностей, управление рейтингом, пользователями, оплатами
- **3 языка** — Русский (основной), English, Кыргызча
- **Адаптивный дизайн** — 375px – 1920px+

## Стек технологий

| Слой | Технология |
|------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Backend | [Supabase](https://supabase.com) (PostgreSQL, Auth, Storage, RLS, Edge Functions) |
| Дизайн | Dark theme, accent `#CCFF00`, Inter font, glassmorphism |
| Авторизация | Supabase Auth (email/пароль, Google OAuth) |
| Библиотеки | [Cropper.js](https://fengyuanchen.github.io/cropperjs/) (кроп аватара, CDN) |

---

## Быстрый старт — пошаговая инструкция

### Что нужно

- Современный браузер (Chrome, Firefox, Safari, Edge)
- Один из вариантов локального сервера (см. шаг 2)

### Шаг 1. Клонировать репозиторий

```bash
git clone https://github.com/bossyko/KSLT-project.git
cd KSLT-project
```

### Шаг 2. Запустить локальный сервер

Сайт — статические файлы, но для работы Supabase SDK нужен HTTP-сервер (не `file://`).

**Вариант A — Python (есть на macOS/Linux из коробки):**
```bash
python3 -m http.server 8080
```

**Вариант B — Node.js (npx, без установки):**
```bash
npx serve .
```

**Вариант C — VS Code:**
1. Установить расширение **Live Server**
2. Правый клик на `index.html` → **Open with Live Server**

### Шаг 3. Открыть в браузере

```
http://localhost:8080
```

Готово! Сайт работает — данные загружаются из Supabase автоматически.

---

## Что доступно без дополнительных настроек

| Функция | Работает? |
|---------|-----------|
| Просмотр всех страниц | Да |
| Данные из Supabase (корты, тренеры, турниры, рейтинг, новости) | Да |
| Регистрация / Вход | Да |
| Личный кабинет | Да (после входа) |
| Админ-панель | Да (нужен аккаунт с ролью admin/manager) |

Supabase anon key и URL уже в коде (`js/supabase-config.js`). Это **публичные** ключи — безопасность обеспечивается RLS-политиками на уровне базы данных.

---

## Структура проекта

```
KSLT/
├── index.html / index-en.html          # Главная (RU / EN)
│
├── pages/                               # Все страницы
│   ├── auth.html / auth-en.html         #   Авторизация
│   ├── dashboard.html / dashboard-en.html #   Личный кабинет
│   ├── admin.html / admin-en.html       #   Админ-панель
│   ├── tournaments.html / tournament.html #   Турниры + детали
│   ├── players.html / player.html       #   Рейтинг + профиль игрока
│   ├── coaches.html / coach.html        #   Тренеры + профиль
│   ├── courts.html / court.html         #   Корты + детали
│   ├── news.html / news-en.html         #   Новости
│   ├── partners.html / partners-en.html #   Найти партнёра
│   ├── services.html / services-en.html #   Услуги
│   ├── info.html / info-en.html         #   Информация
│   └── about / faq / rules / pricing    #   Инфо-страницы
│
├── css/                                 # Стили (19 675 строк)
│   ├── style.css                        #   Дизайн-система (4 692)
│   ├── admin.css                        #   Админ-панель (2 124)
│   ├── players.css                      #   Рейтинги (1 227)
│   ├── news.css                         #   Новости (1 189)
│   ├── partners.css                     #   Партнёры (980)
│   ├── courts.css                       #   Корты (908)
│   ├── coaches.css                      #   Тренеры (731)
│   └── ...                              #   Остальные
│
├── js/                                  # Логика (22 046 строк)
│   ├── admin.js                         #   Админ-панель (11 100+)
│   ├── dashboard.js                     #   Личный кабинет (1 233)
│   ├── tournament-detail.js             #   Турнирная сетка (1 153)
│   ├── courts.js                        #   Корты (723)
│   ├── players.js                       #   Рейтинги (693)
│   ├── partners.js                      #   Партнёры (667)
│   ├── coaches.js                       #   Тренеры (561)
│   ├── supabase-config.js               #   Supabase клиент
│   └── ...                              #   Остальные
│
├── data/                                # Статические данные (fallback)
├── images/                              # Локальные изображения
├── sql/                                 # SQL-миграции для Supabase
├── supabase/                            # Schema + Edge Functions
├── postman/                             # API тест-коллекции
└── docs/                                # Документация
    ├── TECHNICAL.md                     #   Техническая документация
    └── MANAGER-GUIDE.md                 #   Гайд для менеджеров
```

---

## Архитектура

- **Без сборки** — чистый HTML/CSS/JS, нет npm, webpack, React и т.д.
- **Supabase** — БД (PostgreSQL) + Auth + Storage + Edge Functions + RLS
- **Мультиязычность** — отдельные HTML-файлы (`-en.html`, `-kg.html`)
- **RLS** — Row Level Security на уровне БД для всех таблиц
- **CSS-система** — переменные в `style.css`, префиксы по страницам (co-, ct-, pl-, pt-...)
- **Данные** — Supabase primary, статические файлы как fallback

## Roadmap

- [x] **Фаза 1** — Frontend + адаптивный дизайн
- [x] **Фаза 2** — Supabase, авторизация, личный кабинет
- [x] **Фаза 4** — Админ-панель, CRUD, рейтинговая система, турнирная сетка
- [ ] **Фаза 3** — Членство, платежи, уведомления
- [ ] **Фаза 5** — AI чат-бот, бронирование кортов, магазин, PWA

## Автор

**KSLT Team** — Kyrgyzstan Social Lawn Tennis

## Лицензия

Проект является собственностью KSLT. Все права защищены.
