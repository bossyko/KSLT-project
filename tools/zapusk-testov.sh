#!/bin/bash
#
# ЗАПУСК ПРОВЕРОК — то, что дёргает значок «КСЛТ Тесты» с рабочего стола.
#
# Мозги лежат ЗДЕСЬ, в репозитории, а не внутри .app на столе: значок не
# отслеживается git, и всё, что внутри него, живёт мимо истории и мимо
# правок. Значок стал тремя строками — папка, файл, вызов.
#
#   ./tools/zapusk-testov.sh           окно Playwright (--ui)
#   ./tools/zapusk-testov.sh --vse     прогон целиком, без окна
#   ./tools/zapusk-testov.sh --otchet  отчёт последнего прогона
#
# КАКОЙ КОНФИГ — РЕШАЕТ ПРОВЕРКА, А НЕ ДОГАДКА.
# Общий конфиг перед стартом входит в тестовую базу. Пока организация
# Supabase ограничена по трафику, вход отвечает 402 — и тогда не идёт ни
# один тест, даже те сорок, которым база не нужна вовсе. Поэтому сначала
# стучим в базу, и если она в отказе, берём конфиг без базы.
#
# Имена переменных латиницей НАМЕРЕННО: bash не разрешает в именах ничего,
# кроме латиницы, цифр и подчёркивания, — кириллическое имя он читает как
# команду и молча валится на первой же строке. Поймано пробой, а не глазами.

set -u

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

pause() { echo ""; echo "  Нажми любую клавишу."; read -n 1 -s -r; }

# ── node ──────────────────────────────────────────────────────────────
# Finder не даёт ни PATH пользователя, ни node. Версию НЕ ЗАШИВАЕМ:
# зашитый путь ломается при первом же обновлении nvm и ломается молча.
if [ -s "$HOME/.nvm/nvm.sh" ]; then
    # shellcheck disable=SC1091
    . "$HOME/.nvm/nvm.sh" >/dev/null 2>&1
fi
if ! command -v node >/dev/null 2>&1; then
    FRESH="$(ls -1dt "$HOME"/.nvm/versions/node/*/bin 2>/dev/null | head -1)"
    [ -n "$FRESH" ] && PATH="$FRESH:$PATH"
fi
PATH="/opt/homebrew/bin:/usr/local/bin:$PATH"
export PATH

if ! command -v node >/dev/null 2>&1; then
    echo "  Не нашёл node. Открой Терминал и скажи: nvm use --lts"
    pause
    exit 1
fi

# ── отчёт ─────────────────────────────────────────────────────────────
if [ "${1:-}" = "--otchet" ]; then
    DIR="tests/reports/html-bez-bazy"
    if [ -d "tests/reports/html" ] && [ "tests/reports/html" -nt "$DIR" ]; then
        DIR="tests/reports/html"
    fi
    if [ ! -d "$DIR" ]; then
        echo "  Отчёта ещё нет — сначала прогон."
        pause
        exit 1
    fi
    exec npx playwright show-report "$DIR"
fi

# ── база: стучим, а не гадаем ─────────────────────────────────────────
CONFIG="playwright.bez-bazy.config.js"
WHY="база не отвечает — 40 файлов из 44; четыре за входом пропущены"

if [ -f .env.test ]; then
    DB_URL="$(grep -m1 '^KSLT_TEST_DB_URL' .env.test | cut -d= -f2- | tr -d ' \r')"
    DB_KEY="$(grep -m1 '^KSLT_TEST_DB_KEY'  .env.test | cut -d= -f2- | tr -d ' \r')"
    if [ -n "$DB_URL" ] && [ -n "$DB_KEY" ]; then
        # 402 — организация ограничена за превышение квоты. 200 — база жива.
        CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 6 \
                -H "apikey: $DB_KEY" "$DB_URL/auth/v1/health" 2>/dev/null)"
        if [ "$CODE" = "200" ]; then
            CONFIG="playwright.config.js"
            WHY="база отвечает — идут все 44 файла, включая кабинет и админку"
        else
            WHY="база ответила $CODE — 40 файлов из 44; четыре за входом пропущены"
        fi
    fi
fi

echo ""
echo "  КСЛТ — ПРОВЕРКИ"
echo "  конфиг: $CONFIG"
echo "  $WHY"
echo ""

if [ "${1:-}" = "--vse" ]; then
    npx playwright test --config="$CONFIG"
    echo ""
    echo "  Отчёт: ./tools/zapusk-testov.sh --otchet"
    pause
    exit 0
fi

exec npx playwright test --config="$CONFIG" --ui
