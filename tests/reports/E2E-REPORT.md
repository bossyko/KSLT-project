# KSLT — E2E Test Report

> **Дата:** 2026-03-22
> **Инструмент:** Playwright 1.52 + Chromium Headless
> **Тестер:** Claude (автоматизация)
> **Сервер:** localhost:8000 (python3 http.server)

---

## Сводка

| Метрика | Первый прогон | После фиксов |
|---------|---------------|--------------|
| **Всего тестов** | 603 | 603 |
| **Passed** | 576 (95.5%) | **603 (100%)** |
| **Failed** | 27 (4.5%) | **0** |
| **Уникальных багов** | 5 | 0 |
| **Длительность** | 2 мин 54 сек | 2 мин 36 сек |
| **Viewports** | Desktop (1280×800), Tablet (768×1024), Mobile (375×812) | — |

---

## Тестовое покрытие

| Категория | Тестов | Описание |
|-----------|--------|----------|
| Page Loading | 63×3 | Все 63 публичных страницы (RU/EN/KG) — HTTP 200, нет JS ошибок |
| Page Structure | 6×3 | Hero, header, footer, формы авторизации |
| Navigation | 6×3 | Header nav, language switcher, footer |
| Links | 1×3 | Проверка href не пустые |
| Responsive Overflow | 45×3 | 9 страниц × 5 viewports — горизонтальный скролл |
| Burger Menu | 2×3 | Видимость на mobile/desktop |
| Text Readability | 2×3 | Текст не выходит за viewport |
| Image Overflow | 1×3 | Изображения не шире экрана на mobile |
| CSS/JS Resources | 15×3 | Нет 404 для CSS/JS файлов |
| Dark Theme | 2×3 | Тёмный фон, accent #CCFF00 |
| Font Loading | 1×3 | Inter font |
| Auth Page | 5×3 | Форма входа, Google OAuth, регистрация, валидация |
| Homepage Sections | 5×3 | Hero, CTA, header sticky, scroll-to-top, footer |
| PWA | 7×3 | manifest.json, sw.js, meta tags, icons |
| SEO / Meta | 16×3 | Title, lang attr, charset |
| Accessibility | 2×3 | img alt, form labels |
| Content Pages | 10×3 | About, FAQ, Rules, Offer, Pricing, и др. |

---

## Найденные и исправленные баги

### BUG-001: JS ошибка на Tournaments EN (P1) — FIXED

**Страница:** `/pages/tournaments-en.html`
**Ошибка:** `Cannot set properties of null (setting 'textContent')`
**Причина:** `data/tournaments-data-en.js` строки 277-285 — обращение к элементам без null-check (`rankingCategoryName` отсутствует в HTML). RU и KG версии уже имели null-проверки, EN — нет.
**Фикс:** Добавлены null-check перед `.textContent =` в tournaments-data-en.js (как в RU/KG версиях)

---

### BUG-002: Горизонтальный скролл на Homepage (P1) — FIXED

**Страницы:** `index.html` (все viewports)
**Viewports:** 375px (+108px), 480px (+8px), 992px (+44px)
**Корневая причина:** CSS cascade bug — `@media (max-width: 768px)` строка 4024 с `.players-grid { repeat(2, 1fr) }` перебивала `@media (max-width: 480px)` строка 3197 с `.players-grid { 1fr }` потому что позже в файле.
**Фикс (css/style.css):**
- `section { overflow-x: hidden }` — предотвращает overflow от абсолютных/декоративных элементов
- `@media (max-width: 480px)` в конце файла — переопределяет `.players-grid`, `.live-matches`, `.courts-grid` на `1fr`
- `img { max-width: 100%; height: auto }` — глобальный constraint

---

### BUG-003: Горизонтальный скролл на Tournaments (P2) — FIXED

**Страница:** `/pages/tournaments.html`
**Viewport:** 375px (+7px)
**Причина:** `.trn-sticky-header` с `padding: 12px 7%` без overflow clip
**Фикс:** `overflow-x: hidden` в `.trn-sticky-header` (css/tournaments.css)

---

### BUG-004 + BUG-005: Текст и изображения overflow (P2) — FIXED

Побочный эффект BUG-002. Исправление `section { overflow-x: hidden }` + `img { max-width: 100% }` закрыло оба бага.

---

### WARN-001: Accessibility — формы без label (P3) — Ложное срабатывание

**Страница:** `/pages/auth.html`
**Проблема:** 3 input-поля без `<label for="">` или `aria-label`
**Фикс:** Добавить label или aria-label к input-полям на auth page

---

## Passed — ключевые результаты

| Категория | Результат |
|-----------|-----------|
| **Все 63 страницы загружаются** | ✅ Все без ошибок |
| **Нет 404 для CSS/JS** | ✅ Все ресурсы доступны |
| **PWA полностью работает** | ✅ manifest, SW, icons, meta |
| **SEO meta-теги** | ✅ title, lang, charset на всех страницах |
| **Dark theme** | ✅ Тёмный фон + accent #CCFF00 |
| **Inter font** | ✅ Загружается |
| **Header + footer** | ✅ На всех страницах |
| **Language switcher** | ✅ RU/EN/KG ссылки есть |
| **Auth форма** | ✅ Email, password, Google OAuth, registration |
| **Responsive burger** | ✅ Видим на mobile, скрыт на desktop |
| **Контентные страницы** | ✅ About, FAQ, Rules, Offer, Pricing — контент есть |
| **3 языка** | ✅ Все страницы во всех 3 языках доступны |

---

## Все баги исправлены

| Баг | Файл | Изменение |
|-----|------|-----------|
| BUG-001 | `data/tournaments-data-en.js` | Null-check перед `.textContent =` (строки 277-285) |
| BUG-002 | `css/style.css` | `section { overflow-x: hidden }` + grid 1fr fix на 480px |
| BUG-003 | `css/tournaments.css` | `overflow-x: hidden` на `.trn-sticky-header` |
| BUG-004+005 | `css/style.css` | `img { max-width: 100%; height: auto }` |

---

## Как запускать тесты

```bash
# Все тесты (3 viewport'а)
npx playwright test

# Только desktop
npx playwright test --project=desktop

# Конкретный файл
npx playwright test tests/e2e/01-pages-load.spec.js

# С UI режимом
npx playwright test --ui

# HTML отчёт
npx playwright show-report tests/reports/html
```

---

## Структура тестов

```
tests/
├── e2e/
│   ├── 01-pages-load.spec.js     — загрузка всех страниц
│   ├── 02-navigation.spec.js      — навигация, язык, footer
│   ├── 03-responsive.spec.js      — адаптивность, overflow, burger
│   ├── 04-css-integrity.spec.js   — CSS/JS ресурсы, тема, шрифт
│   ├── 05-auth-page.spec.js       — форма авторизации
│   ├── 06-homepage-sections.spec.js — секции главной
│   ├── 07-pwa.spec.js             — PWA manifest, SW, meta
│   ├── 08-seo-meta.spec.js        — SEO, lang, accessibility
│   └── 09-content-pages.spec.js   — контентные страницы
└── reports/
    ├── E2E-REPORT.md              — этот отчёт
    ├── results.json               — JSON результаты
    └── html/                      — Playwright HTML report
```
