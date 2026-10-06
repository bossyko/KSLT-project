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
#   ./tools/zapusk-testov.sh --admin   ТОЛЬКО админка по базе — 3 файла
#   ./tools/zapusk-testov.sh --s-bazoy   ВСЕ 44 файла по базе — тратит трафик
#   ./tools/zapusk-testov.sh --otchet  отчёт последнего прогона
#
# ПО УМОЛЧАНИЮ — БЕЗ БАЗЫ, ДАЖЕ КОГДА БАЗА ЖИВА.
# Так решено 28.09: в tests/test-db.js записано, что прогон по базе съедает
# месячную квоту трафика, и организация из-за этого уже уходила в льготный
# период. Сорока файлам из сорока четырёх база не нужна вовсе — гонять их
# по базе значит платить трафиком ни за что.
#
# Полный прогон запрашивается ЯВНО: --s-bazoy. Тогда скрипт сначала стучит
# в базу и, если она молчит, честно говорит об этом и не идёт в общий
# конфиг — тот всё равно упал бы на входе.
#
# СЕРЕДИНА: --admin. Между «без базы вовсе» и «все 44 файла» ничего не было,
# и правка в админке проверялась либо никак, либо прогоном на 5945 тестов.
# Админку трогают ровно три файла из сорока пяти — 17, 12 и 20 (только они
# упоминают admin.html или admin.css, проверено грепом 29.09), и все три
# сидят за входом, то есть без базы не идут вовсе. --admin стучит в базу
# так же, как --s-bazoy, и гонит эти три: 285 тестов вместо 5945.
#
# Имена переменных латиницей НАМЕРЕННО: bash не разрешает в именах ничего,
# кроме латиницы, цифр и подчёркивания, — кириллическое имя он читает как
# команду и молча валится на первой же строке. Поймано пробой, а не глазами.

# set -u ЗДЕСЬ НЕЛЬЗЯ. 27.09: под ним `. nvm.sh` падает на первой же
# необъявленной переменной внутри самого nvm — и скрипт выходит МОЛЧА,
# без строчки в выводе. Значок при этом просто не открывался ничем.
# Правило: строгий режим не включают вокруг чужого кода.

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

# ── конфиг ────────────────────────────────────────────────────────────
CONFIG="playwright.bez-bazy.config.js"
WHY="без базы — 40 файлов из 44, трафик не тратится"
S_BAZOY=""
ADMIN=""
for arg in "$@"; do
    [ "$arg" = "--s-bazoy" ] && S_BAZOY="da"
    [ "$arg" = "--admin" ]   && { S_BAZOY="da"; ADMIN="da"; }
done

# Файлы админки — перечень ОДИН, и живёт он здесь
# 06.10: четвёртым встал прогон завершённого турнира. Он тоже сидит за
# входом и стучит в базу, значит без неё не идёт — ему место ровно здесь.
FILES_ADMIN="tests/e2e/features/17-trn-forma.spec.js \
tests/e2e/features/12-admin-page.spec.js \
tests/e2e/features/22-zavershyonnyy-turnir.spec.js \
tests/e2e/design-system/20-header-offsets.spec.js"

if [ -n "$S_BAZOY" ]; then
    CODE="000"
    if [ -f .env.test ]; then
        DB_URL="$(grep -m1 '^KSLT_TEST_DB_URL' .env.test | cut -d= -f2- | tr -d ' \r')"
        DB_KEY="$(grep -m1 '^KSLT_TEST_DB_KEY'  .env.test | cut -d= -f2- | tr -d ' \r')"
        if [ -n "$DB_URL" ] && [ -n "$DB_KEY" ]; then
            # 402 — организация ограничена за превышение квоты. 200 — база жива.
            CODE="$(curl -s -o /dev/null -w '%{http_code}' -m 6 \
                    -H "apikey: $DB_KEY" "$DB_URL/auth/v1/health")"
        fi
    fi
    if [ "$CODE" = "200" ]; then
        CONFIG="playwright.config.js"
        if [ -n "$ADMIN" ]; then
            WHY="ПО БАЗЕ, только админка — 3 файла, 285 тестов."
        else
            WHY="ПО БАЗЕ, по твоей просьбе — все 44 файла. Это тратит трафик."
        fi
    else
        echo ""
        echo "  База ответила $CODE — полный прогон не пойдёт: общий конфиг"
        echo "  падает на входе. Иду без базы."
    fi
fi

echo ""
echo "  КСЛТ — ПРОВЕРКИ"
echo "  конфиг: $CONFIG"
echo "  $WHY"
echo ""

# ЧТО ГОНИМ. Пусто — весь конфиг; --admin — три файла админки.
# Без кавычек НАМЕРЕННО: здесь нужно разбиение на три слова, а не одно имя
SHTO=""
[ -n "$ADMIN" ] && SHTO="$FILES_ADMIN"

if [ "${1:-}" = "--vse" ] || [ -n "$ADMIN" ]; then
    # shellcheck disable=SC2086
    npx playwright test --config="$CONFIG" $SHTO
    echo ""
    echo "  Отчёт: ./tools/zapusk-testov.sh --otchet"
    pause
    exit 0
fi

exec npx playwright test --config="$CONFIG" --ui
