-- РУЧНОЙ ВЫБОР ЛИГИ — КОЛОНКА. Слово Кости 05.11.
--
-- «В группе из 3 игроков админ-менеджер сам определяет, кто куда идёт —
-- в высшую или утешительную», и «переключатель нужен, когда игры в
-- группе окончены».
--
-- ЗАЧЕМ ОТДЕЛЬНОЕ ХРАНЕНИЕ, А НЕ ЧЕРЕЗ МЕСТА. Переставлять место в
-- группе ради лиги нельзя: место — это результат матчей, и правка ради
-- другой цели врёт в таблице, которую видят игроки. Лига — отдельное
-- понятие, и хранится отдельно. Ручные МЕСТА (`manual_group_places`)
-- этим не затрагиваются и работают как работали.
--
-- ФОРМА ТА ЖЕ, ЧТО У РУЧНЫХ МЕСТ: jsonb на турнире, ключ — заявка,
-- значение — 'PL' или 'CL'. Ключ `__журнал` хранит след правок: кто,
-- кого, куда и когда. След пишется всегда.
--
--   { "<reg_id>": "CL", "__журнал": [ { … } ] }
--
-- ЗАПРОС БЕЗОПАСЕН НА ПОВТОРНОМ ПРОГОНЕ: `IF NOT EXISTS`.
-- Он ничего не меняет в существующих турнирах — у всех будет `{}`, то
-- есть прежнее поведение: первые `qualifiers_per_group` мест наверх.
--
--   sql/схема/ruchnoy-vybor-ligi-0511.sql

ALTER TABLE public.tournaments
  ADD COLUMN IF NOT EXISTS manual_league_sides jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.tournaments.manual_league_sides IS
  'Ручной выбор лиги для групп из трёх пар и меньше: заявка -> PL|CL. '
  'Ключ __журнал хранит след правок. Пусто = деление по месту в группе.';


-- ПРОВЕРКА ЧТЕНИЕМ БАЗЫ, А НЕ ОТВЕТОМ «Success».
-- Ждём: одна строка, tip = jsonb, umolchanie = '{}'::jsonb, turnirov_s_vyborom = 0.
SELECT c.column_name                                   AS stolbec,
       c.data_type                                     AS tip,
       c.column_default                                AS umolchanie,
       c.is_nullable                                   AS pusto_mozhno,
       (SELECT count(*) FROM public.tournaments
         WHERE manual_league_sides <> '{}'::jsonb)     AS turnirov_s_vyborom
  FROM information_schema.columns c
 WHERE c.table_schema = 'public'
   AND c.table_name   = 'tournaments'
   AND c.column_name  = 'manual_league_sides';
