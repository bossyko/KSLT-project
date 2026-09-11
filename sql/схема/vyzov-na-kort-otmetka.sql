-- ============================================================
-- Вызовы на корт: помним, что уже отправляли
-- ============================================================
--
-- В расписании у каждого запуска две кнопки: «Готовьтесь» и «На корт».
-- Раньше нажать их можно было сколько угодно раз, и после обновления
-- страницы было не понять, звали пару или ещё нет.
--
-- Заводим в матче две отметки времени. «Готовьтесь» уходит один раз — это
-- предупреждение, второй раз оно только путает. «На корт» можно послать
-- снова: вдруг не услышали, — но кнопка покажет, что первый вызов уже был.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.matches
    ADD COLUMN IF NOT EXISTS called_ready_at timestamptz,
    ADD COLUMN IF NOT EXISTS called_go_at    timestamptz;

COMMENT ON COLUMN public.matches.called_ready_at IS 'Когда парам сказали «Готовьтесь»; отправляется один раз';
COMMENT ON COLUMN public.matches.called_go_at    IS 'Когда пары в последний раз позвали на корт';

COMMIT;

-- ---- Проверка ----

SELECT column_name AS поле, data_type AS тип
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'matches'
   AND column_name IN ('called_ready_at', 'called_go_at')
 ORDER BY 1;
-- Ожидаем две строки.
