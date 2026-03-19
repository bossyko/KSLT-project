# KSLT — Тест-план и тест-кейсы

## Стек тестирования (рекомендация)

- **E2E:** Playwright (быстрее Cypress, поддержка 3 браузеров)
- **Runner:** Node.js + `@playwright/test`
- **CI:** GitHub Actions (запуск на push/PR)
- **Отчёты:** HTML reporter (встроен в Playwright)

---

## Структура тестов

```
tests/
├── e2e/
│   ├── auth.spec.js          — Авторизация
│   ├── navigation.spec.js    — Навигация + хедер
│   ├── pages-load.spec.js    — Загрузка всех страниц
│   ├── rankings.spec.js      — Рейтинг (гость / зарег / член)
│   ├── dashboard.spec.js     — Личный кабинет
│   ├── admin.spec.js         — Админ-панель
│   ├── pwa.spec.js           — PWA (manifest, SW)
│   ├── responsive.spec.js    — Адаптив (mobile/tablet/desktop)
│   └── i18n.spec.js          — Мультиязычность (RU/EN/KG)
├── fixtures/
│   └── test-users.json       — Тестовые аккаунты
└── playwright.config.js
```

---

## TC-01: Навигация и хедер

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 1.1 | Главная загружается | GET `/` | Status 200, title "KSLT" |
| 1.2 | Хедер видим | Проверить `.floating-header` | Visible, содержит лого |
| 1.3 | Навигация: все ссылки | Кликнуть каждый nav-item | Переход на соотв. страницу без 404 |
| 1.4 | Scroll effect | Скроллить 100px вниз | `.floating-header` получает класс `.scrolled` |
| 1.5 | Бургер меню (mobile) | Viewport 375px, клик бургер | `.mobile-nav` получает `.active` |
| 1.6 | Бургер закрытие | Клик вне меню | `.mobile-nav` теряет `.active` |
| 1.7 | Язык: переключение RU→EN | Клик lang dropdown → EN | URL содержит `-en`, контент на англ |
| 1.8 | Язык: переключение RU→KG | Клик lang dropdown → KG | URL содержит `-kg`, контент на кырг |
| 1.9 | Scroll-to-top | Скролл 500px → кнопка visible, клик | Возврат к top, кнопка hidden |
| 1.10 | Active nav indicator | Перейти на /pages/news.html | Соотв. nav-item имеет `.is-active` |

## TC-02: Авторизация

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 2.1 | Страница auth загружается | GET `/pages/auth.html` | Форма входа видна |
| 2.2 | Вход: валидный email+пароль | Ввести credentials, submit | Редирект на dashboard, сессия в localStorage |
| 2.3 | Вход: неверный пароль | Ввести wrong password | Toast с ошибкой, без редиректа |
| 2.4 | Вход: несуществующий email | Ввести unknown email | Toast с ошибкой |
| 2.5 | Регистрация: новый пользователь | Заполнить форму регистрации | Сообщение "Проверьте почту" |
| 2.6 | Регистрация: существующий email | Email уже занят | Toast с ошибкой |
| 2.7 | Google OAuth | Клик "Войти через Google" | Редирект на Google, возврат на dashboard |
| 2.8 | Выход | Клик "Выйти" в dropdown | Сессия удалена, редирект на главную |
| 2.9 | Auth guard: dashboard без сессии | GET `/pages/dashboard.html` без авторизации | Редирект на auth.html |
| 2.10 | Auth guard: admin без роли | Обычный user → admin.html | Редирект или блокировка |
| 2.11 | URL cleanup | Вход через email link с hash token | Hash (`#access_token`) удалён из URL |

## TC-03: Рейтинг и игроки

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 3.1 | Гость: рейтинг — top 3 видно | Без авторизации → rankings | 3 строки видны, остальные blur |
| 3.2 | Гость: CTA "Зарегистрируйтесь" | Без авторизации → rankings | CTA блок с кнопкой входа |
| 3.3 | Зарег. user: полный рейтинг | Залогиниться → rankings | Все строки видны, без blur |
| 3.4 | Players: загрузка из Supabase | GET /pages/players.html | Карточки игроков из БД |
| 3.5 | Players: fallback на static | Supabase недоступен | Данные из data/players-data.js |
| 3.6 | Player detail: профиль | GET /pages/player.html?id=X | Фото, имя, категория, статистика |
| 3.7 | Player detail: H2H | Страница игрока | Таблица "Последние матчи" |
| 3.8 | Player: бан-бейдж | Забаненный игрок | Красный бейдж "Забанен" видим |
| 3.9 | Пагинация | Больше 20 игроков | Кнопки пагинации работают |
| 3.10 | Фильтр по категории | Выбрать категорию | Только игроки этой категории |

## TC-04: Турниры

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 4.1 | Список турниров | GET /pages/tournaments.html | Карточки турниров из Supabase |
| 4.2 | Деталь турнира | Клик на турнир | Overlay с info + bracket |
| 4.3 | Bracket: сетка отображается | Турнир с матчами | Сетка SE/FIC/Group видна |
| 4.4 | Регистрация: член KSLT | Член → кнопка "Зарегистрироваться" | Успешная регистрация |
| 4.5 | Регистрация: не член | Обычный user → кнопка | Блокировка "Нужно членство" |
| 4.6 | Регистрация: забанен | Забаненный → кнопка | Блокировка "Вы забанены" |
| 4.7 | Tournaments overview | GET /pages/tournaments-overview.html | Турниры по месяцам |

## TC-05: Личный кабинет (Dashboard)

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 5.1 | Dashboard загружается | Авторизация → /pages/dashboard.html | Профиль, статистика |
| 5.2 | Редактирование профиля | Изменить имя, сохранить | Toast "Сохранено", данные обновлены |
| 5.3 | Аватар: загрузка | Выбрать фото, кроп, сохранить | Аватар обновлён в Supabase Storage |
| 5.4 | Смена пароля | Ввести новый пароль | Toast "Пароль изменён" |
| 5.5 | Членство: карточка | Член KSLT → dashboard | Карточка с датами и статусом |
| 5.6 | Членство: нет членства | Обычный user | "Нет активного членства" + ссылка |
| 5.7 | Challenges: вкладка | Dashboard → Challenges tab | Список вызовов (отправленные/полученные) |
| 5.8 | Платежи: история | Dashboard → Payments tab | Таблица оплат |
| 5.9 | Настройки уведомлений | Dashboard → Settings | Чекбоксы TG/Email по категориям |

## TC-06: Корты и тренеры

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 6.1 | Courts: загрузка | GET /pages/courts.html | Карточки кортов из Supabase |
| 6.2 | Court detail | Клик на корт | Overlay: фото, адрес, цены, расписание |
| 6.3 | Coaches: загрузка | GET /pages/coaches.html | Карточки тренеров из Supabase |
| 6.4 | Coach detail | Клик на тренера | Фото, ФИО, контакты (только для зарег.) |
| 6.5 | Contacts: гость | Без авторизации | Телефон/email скрыты |
| 6.6 | Contacts: залогинен | С авторизацией | Телефон/email видны |
| 6.7 | Promoted: выделение | Promoted корт/тренер | Акцентная рамка, первые в списке |

## TC-07: Админ-панель

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 7.1 | Доступ: admin | Admin → /pages/admin.html | Все секции видны |
| 7.2 | Доступ: manager | Manager → admin.html | Ограниченные секции (без Players edit, без Users edit) |
| 7.3 | Доступ: user | Обычный user → admin.html | Блокировка |
| 7.4 | News CRUD | Создать → редактировать → удалить | Данные в Supabase, toast подтверждения |
| 7.5 | Tournament CRUD | Создать турнир | Появляется в списке |
| 7.6 | Bracket management | Регистрации → жеребьёвка → scores | Сетка заполнена |
| 7.7 | Players CRUD (admin) | Создать игрока с фото | Карточка на players.html |
| 7.8 | Players: manager readonly | Manager → Players | Нет кнопок edit/delete |
| 7.9 | Finances: membership | Создать membership payment | Членство активировано |
| 7.10 | Finances: club type | Создать club payment | Появляется в таблице |
| 7.11 | Bulk delete | Выбрать чекбоксы → удалить | Множественное удаление |
| 7.12 | Excel export | Клик "Excel" в Finances | CSV файл скачивается |
| 7.13 | PDF export | Клик "PDF" в Vouchers | Print-ready PDF |
| 7.14 | Dashboard: stat cards | Админ dashboard | 10 карточек с числами |
| 7.15 | Ban player | Admin → Players → Ban | Бан применён + TG уведомление |

## TC-08: PWA

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 8.1 | Manifest | DevTools → Application → Manifest | name, icons, theme_color корректны |
| 8.2 | Service Worker | DevTools → Application → SW | Status: "activated and running" |
| 8.3 | Cache Storage | DevTools → Application → Cache | Файлы kslt-v1 закэшированы |
| 8.4 | Installable | Lighthouse → PWA | "Installable" = pass |
| 8.5 | Install prompt | Chrome → адресная строка | Иконка установки видна |
| 8.6 | Offline: cached page | Network → Offline → reload | Страница загружается из кэша |
| 8.7 | Offline: uncached page | Offline → новая страница | Graceful fallback |
| 8.8 | Apple-touch-icon | iOS Safari → "На экран Домой" | Иконка KSLT корректна |

## TC-09: Адаптивность (Responsive)

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 9.1 | Mobile 375px | Viewport 375px | Layout без overflow, читаемый текст |
| 9.2 | Tablet 768px | Viewport 768px | 2-колоночная сетка |
| 9.3 | Desktop 1200px | Viewport 1200px | Полный layout |
| 9.4 | Бургер меню (375px) | Mobile viewport | Бургер видим, nav скрыт |
| 9.5 | Desktop nav | 992px+ | Горизонтальная навигация |

## TC-10: Мультиязычность

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 10.1 | RU: контент | index.html | Текст на русском |
| 10.2 | EN: контент | index-en.html | Текст на английском |
| 10.3 | KG: контент | index-kg.html | Текст на кыргызском |
| 10.4 | Lang switch | RU → EN через dropdown | URL меняется, контент на EN |
| 10.5 | Subpages: EN | /pages/players-en.html | Labels на английском |
| 10.6 | Subpages: KG | /pages/players-kg.html | Labels на кыргызском |
| 10.7 | Admin: EN | /pages/admin-en.html | Admin labels на английском |
| 10.8 | Auth: KG | /pages/auth-kg.html | Форма на кыргызском |

## TC-11: Services и Partners

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 11.1 | Services: загрузка | GET /pages/services.html | Promoted + остальные |
| 11.2 | Services: карусель | Свайп на mobile | Карточки переключаются |
| 11.3 | Partners: загрузка | GET /pages/partners.html | Список партнёров из RPC |
| 11.4 | Partners: фильтры | Фильтр по уровню/предпочтениям | Список обновляется |

## TC-12: Info Pages

| # | Тест-кейс | Шаги | Ожидание |
|---|-----------|------|----------|
| 12.1 | Info overview | GET /pages/info.html | Ссылки на about, rules, faq, pricing, offer |
| 12.2 | About page | GET /pages/about.html | Контент "О нас" |
| 12.3 | FAQ page | GET /pages/faq.html | Accordion вопросы/ответы |
| 12.4 | Pricing page | GET /pages/pricing.html | Тарифы + сравнение |
| 12.5 | Rules page | GET /pages/rules.html | Правила KSLT |

---

## Приоритет автоматизации

### P0 — Критичные (первыми автоматизировать)
- TC-01 (навигация) — smoke test для всех страниц
- TC-02 (авторизация) — core flow
- TC-03.1-3.3 (доступ по ролям к рейтингу)
- TC-08 (PWA)

### P1 — Важные
- TC-05 (dashboard)
- TC-07.1-7.3 (доступ к админке по ролям)
- TC-09 (адаптивность)
- TC-10 (мультиязычность)

### P2 — Функциональные
- TC-04 (турниры)
- TC-06 (корты/тренеры)
- TC-07.4+ (админ CRUD)
- TC-11, TC-12

---

## Тестовые данные

### Тестовые аккаунты (Supabase)
```json
{
  "admin": { "email": "admin@test.kslt.kg", "role": "admin" },
  "manager": { "email": "manager@test.kslt.kg", "role": "manager" },
  "member": { "email": "member@test.kslt.kg", "role": "user", "membership": "active" },
  "user": { "email": "user@test.kslt.kg", "role": "user", "membership": null },
  "banned": { "email": "banned@test.kslt.kg", "role": "user", "banned": true }
}
```

### Окружения
- **Local:** `http://localhost:8000` (python3 -m http.server)
- **Staging:** Netlify preview deploy
- **Production:** основной домен

---

## Запуск тестов (будущее)

```bash
# Все тесты
npx playwright test

# Конкретный файл
npx playwright test tests/e2e/auth.spec.js

# С UI
npx playwright test --ui

# Отчёт
npx playwright show-report
```
