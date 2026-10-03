#!/bin/bash
# Прувер миграции версий очков.
#
# Каждый откат ОБЯЗАН упасть, и упасть СВОИМ текстом. Каждое разрешённое
# действие обязано не только пройти, но и ТРОНУТЬ СТРОКИ: «UPDATE 0» это
# проверка, которая не может упасть.
#
# ЗАВТРА СЧИТАЕТСЯ ПО БИШКЕКУ, как и сторож. Первая редакция прувера брала
# `CURRENT_DATE + 1` (UTC) — и вечером по Чикаго это оказывался тот же
# бишкекский день: прувер уронил мою же миграцию и был прав.
D=${KSLT_PG:-/var/lib/postgresql/kslt-stend}
PSQL="psql -h $D -U postgres -d kslt -t -A -q"

SEG="(now() AT TIME ZONE 'Asia/Bishkek')::date"
ZAVTRA="($SEG + 1)"

OK=0; BAD=0

must_fail() {
    name="$1"; want="$2"; q="$3"
    out=$($PSQL -v ON_ERROR_STOP=1 -c "$q" 2>&1)
    if echo "$out" | grep -q "$want"; then
        echo "  [+] $name — упало своим текстом"; OK=$((OK+1))
    else
        echo "  [-] $name — НЕ упало или упало не тем:"; echo "      $out"; BAD=$((BAD+1))
    fi
}

# ждёт не «не упало», а конкретную отметку вроде INSERT или UPDATE 264
must_do() {
    name="$1"; want="$2"; q="$3"
    out=$(psql -h $D -U postgres -d kslt -v ON_ERROR_STOP=1 -c "$q" 2>&1)
    if echo "$out" | grep -q "^$want\$"; then
        echo "  [+] $name — $want"; OK=$((OK+1))
    else
        echo "  [-] $name — ждали «$want», получили:"; echo "      $out"; BAD=$((BAD+1))
    fi
}

eq() {
    name="$1"; want="$2"; q="$3"
    got=$($PSQL -c "$q" 2>&1 | tr -d ' ')
    if [ "$got" = "$want" ]; then
        echo "  [+] $name = $got"; OK=$((OK+1))
    else
        echo "  [-] $name: ждали $want, получили «$got»"; BAD=$((BAD+1))
    fi
}

echo "ЗАМЕР ПОСЛЕ МИГРАЦИИ"
eq "версий" 1 "SELECT count(*) FROM public.points_versions;"
eq "дата первой версии" "2021-01-01" "SELECT effective_from FROM public.points_versions;"
eq "за победу и за участие" "25|10" "SELECT per_win||'|'||per_entry FROM public.points_versions;"
eq "строк без версии" 0 "SELECT count(*) FROM public.points_by_place WHERE version_id IS NULL;"
eq "всего строк мест" 264 "SELECT count(*) FROM public.points_by_place;"
eq "старое ограничение снято" 0 "SELECT count(*) FROM pg_constraint WHERE conname='points_by_place_level_id_place_key';"
eq "новый индекс стоит" 1 "SELECT count(*) FROM pg_indexes WHERE indexname='points_by_place_version_level_place';"
eq "version_id объявлен NOT NULL" "f" \
  "SELECT is_nullable='YES' FROM information_schema.columns
    WHERE table_name='points_by_place' AND column_name='version_id';"

echo
echo "СТОРОЖ: ПРОШЛОЕ НЕ ПИШЕТСЯ"
must_fail "правка числа в действующей версии" "уже в силе" \
  "UPDATE public.points_by_place SET points = 999 WHERE place = 1;"
must_fail "вставка места в действующую версию" "уже в силе" \
  "INSERT INTO public.points_by_place (version_id, level_id, place, points)
   SELECT (SELECT id FROM public.points_versions LIMIT 1),
          (SELECT id FROM public.tournament_levels WHERE sort_order=1), 9, 5;"
must_fail "удаление места из действующей версии" "уже в силе" \
  "DELETE FROM public.points_by_place WHERE place = 64;"
must_fail "версия задним числом" "только с будущей даты" \
  "INSERT INTO public.points_versions (effective_from) VALUES ($SEG - 1);"
must_fail "версия сегодняшним числом по Бишкеку" "только с будущей даты" \
  "INSERT INTO public.points_versions (effective_from) VALUES ($SEG);"
must_fail "правка вступившей версии" "уже в силе" \
  "UPDATE public.points_versions SET per_win = 30 WHERE effective_from = DATE '2021-01-01';"
must_fail "удаление вступившей версии" "уже в силе" \
  "DELETE FROM public.points_versions WHERE effective_from = DATE '2021-01-01';"
must_fail "две версии в один день" "duplicate key" \
  "INSERT INTO public.points_versions (effective_from) VALUES ($SEG + 10), ($SEG + 10);"

echo
echo "БУДУЩАЯ ВЕРСИЯ ПРАВИТСЯ СВОБОДНО — И ТРОГАЕТ СТРОКИ"
must_do "завести версию с завтрашней даты по Бишкеку" "INSERT 0 1" \
  "INSERT INTO public.points_versions (effective_from, per_win, per_entry, note)
   VALUES ($ZAVTRA, 30, 12, 'проба');"
must_do "налить в неё 264 места копией действующей" "INSERT 0 264" \
  "INSERT INTO public.points_by_place (version_id, level_id, place, points)
   SELECT (SELECT id FROM public.points_versions WHERE effective_from = $ZAVTRA),
          level_id, place, points
     FROM public.points_by_place
    WHERE version_id = (SELECT id FROM public.points_versions WHERE effective_from = DATE '2021-01-01');"
must_do "поправить пять первых мест в невступившей" "UPDATE 5" \
  "UPDATE public.points_by_place SET points = 1200
    WHERE place = 1
      AND version_id = (SELECT id FROM public.points_versions WHERE effective_from = $ZAVTRA);"
must_do "поправить за-победу в невступившей" "UPDATE 1" \
  "UPDATE public.points_versions SET per_win = 28 WHERE effective_from = $ZAVTRA;"

eq "строк мест после второй версии" 528 "SELECT count(*) FROM public.points_by_place;"
eq "действующее первое место Высшей не поехало" 1000 \
  "SELECT points FROM public.points_by_place p
     JOIN public.tournament_levels l ON l.id = p.level_id
     JOIN public.points_versions v ON v.id = p.version_id
    WHERE p.place = 1 AND l.sort_order = 5 AND v.effective_from = DATE '2021-01-01';"
eq "в новой версии первое место уже 1200" 1200 \
  "SELECT points FROM public.points_by_place p
     JOIN public.tournament_levels l ON l.id = p.level_id
     JOIN public.points_versions v ON v.id = p.version_id
    WHERE p.place = 1 AND l.sort_order = 5 AND v.effective_from = $ZAVTRA;"

echo
echo "ВЕРСИЯ НА ДАТУ ТУРНИРА — ОДНО ОПРЕДЕЛЕНИЕ"
eq "прошедший турнир считается по версии 2021" "2021-01-01" \
  "SELECT max(v.effective_from) FROM public.tournaments t
     JOIN public.points_versions v ON v.effective_from <= t.start_date
    WHERE t.name = 'Прошедший';"
eq "турнир через пять дней считается по новой" "ok" \
  "SELECT CASE WHEN (SELECT max(effective_from) FROM public.points_versions
                      WHERE effective_from <= $SEG + 5) = $ZAVTRA
              THEN 'ok' ELSE 'нет' END;"
eq "очки прошедшего турнира не тронуты" 360 \
  "SELECT points_earned FROM public.tournament_results LIMIT 1;"

echo
echo "RLS НЕ ПУСКАЕТ МЕНЕДЖЕРА — ПРОВЕРЕНО НЕ ВЛАДЕЛЬЦЕМ ТАБЛИЦЫ"
# Владелец и суперпользователь RLS обходят: политика может быть верной и
# ничего не запрещать. Поэтому отдельная роль.
$PSQL -c "DROP ROLE IF EXISTS klient;" >/dev/null 2>&1
$PSQL -c "CREATE ROLE klient; GRANT USAGE ON SCHEMA public, auth TO klient;
          GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO klient;" >/dev/null 2>&1

ADMIN=11111111-1111-1111-1111-111111111111
MANAGER=22222222-2222-2222-2222-222222222222

run_as() {
  psql -h $D -U postgres -d kslt -v ON_ERROR_STOP=1 \
    -c "SET ROLE klient; SET \"стенд.uid\" = '$1'; $2" 2>&1
}

out=$(run_as $MANAGER "INSERT INTO public.points_versions (effective_from) VALUES ($SEG + 30);")
if echo "$out" | grep -q "row-level security"; then
  echo "  [+] менеджер не может завести версию — упало на RLS"; OK=$((OK+1))
else
  echo "  [-] менеджер ЗАВЁЛ версию:"; echo "      $out"; BAD=$((BAD+1))
fi

out=$(run_as $MANAGER "UPDATE public.points_by_place SET points = 7
    WHERE version_id = (SELECT id FROM public.points_versions WHERE effective_from = $ZAVTRA);")
if echo "$out" | grep -q "^UPDATE 0\$"; then
  echo "  [+] менеджер не правит места — ноль строк"; OK=$((OK+1))
else
  echo "  [-] менеджер ПОПРАВИЛ места:"; echo "      $out"; BAD=$((BAD+1))
fi

out=$(run_as $MANAGER "SELECT count(*) FROM public.points_by_place;")
if echo "$out" | grep -q "528"; then
  echo "  [+] менеджер видит таблицу целиком (528)"; OK=$((OK+1))
else
  echo "  [-] менеджер не видит таблицу:"; echo "      $out"; BAD=$((BAD+1))
fi

out=$(run_as $ADMIN "UPDATE public.points_by_place SET points = 1300
    WHERE place = 2
      AND version_id = (SELECT id FROM public.points_versions WHERE effective_from = $ZAVTRA);")
if echo "$out" | grep -q "^UPDATE 5\$"; then
  echo "  [+] администратор правит невступившую версию — UPDATE 5"; OK=$((OK+1))
else
  echo "  [-] администратор не смог поправить невступившую версию:"; echo "      $out"; BAD=$((BAD+1))
fi

out=$(run_as $ADMIN "UPDATE public.points_by_place SET points = 1
    WHERE version_id = (SELECT id FROM public.points_versions WHERE effective_from = DATE '2021-01-01');")
if echo "$out" | grep -q "уже в силе"; then
  echo "  [+] и администратору сторож не даёт править прошлое"; OK=$((OK+1))
else
  echo "  [-] администратор переписал прошлое:"; echo "      $out"; BAD=$((BAD+1))
fi

echo
echo "УДАЛЕНИЕ БУДУЩЕЙ ВЕРСИИ УВОДИТ ЕЁ МЕСТА, И ТОЛЬКО ЕЁ"
must_do "удалить невступившую версию" "DELETE 1" \
  "DELETE FROM public.points_versions WHERE effective_from = $ZAVTRA;"
eq "строк мест вернулось к 264" 264 "SELECT count(*) FROM public.points_by_place;"
eq "действующая версия на месте" 1 "SELECT count(*) FROM public.points_versions;"

echo
echo "ИТОГ: прошло $OK, не прошло $BAD"
[ "$BAD" = 0 ] || exit 1
