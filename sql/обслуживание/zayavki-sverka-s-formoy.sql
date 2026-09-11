-- ============================================================
-- Заявки дружеских турниров: что расходится с формой клуба
-- ============================================================
--
-- Читающий файл. Ничего не меняет — показывает, как заявки выглядят сейчас,
-- чтобы сверить их с таблицей «Муж пара (Ответы)».
--
-- Masters — b8a6de7b-a146-4168-aaea-b56fb5dbd135
-- Futures — 7094e2bd-02e6-476b-9e0c-efc7bffc8418

SELECT CASE WHEN r.tournament_id = 'b8a6de7b-a146-4168-aaea-b56fb5dbd135'
            THEN 'MASTERS' ELSE 'FUTURES' END AS турнир,
       row_number() OVER (PARTITION BY r.tournament_id ORDER BY r.registered_at) AS "№",
       p1.name AS участник,
       coalesce(p2.name, r.partner_external_name, '—') AS напарник,
       r.status AS состояние,
       to_char(r.registered_at, 'DD.MM HH24:MI') AS подана
  FROM public.tournament_registrations r
  LEFT JOIN public.players p1 ON p1.id = r.player_id
  LEFT JOIN public.players p2 ON p2.id = r.partner_id
 WHERE r.tournament_id IN ('b8a6de7b-a146-4168-aaea-b56fb5dbd135',
                           '7094e2bd-02e6-476b-9e0c-efc7bffc8418')
 ORDER BY турнир, r.registered_at;
-- Ожидаем до правок: Masters 12, Futures 19.
-- После правок: Masters 12, Futures 20 — 18 в составе и 2 в очереди.

-- ---- Люди, которых форма ставит в пары ----

SELECT id, name, ntrp_singles, ntrp_doubles
  FROM public.players
 WHERE id IN ('kirill-leontev', 'abdurahman-niyazov', 'altynbek-zhanybekov',
              'elzar-azhibaev', 'musa-zhanybekov', 'tengiz-atahanov',
              'ernazar-ismatov', 'sultan-sanzharov', 'timur-baygubatov')
 ORDER BY name;
-- Ожидаем: девять карточек. Пятеро первых заходят в заявки, четверо
-- последних из них уходят.
