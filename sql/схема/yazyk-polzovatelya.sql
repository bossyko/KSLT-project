-- ============================================================
-- Язык пользователя
-- ============================================================
--
-- Уведомления шлёт сервер, и языка страницы он не видит: русскоязычная
-- Айсулуу получила от бота английское «your Telegram is now connected».
--
-- Заводим одно поле на человека. Правило простое: язык — тот, который он
-- выбрал последним, неважно где — в шапке сайта, в кабинете или в
-- приложении. Он же идёт в Telegram и в push.
--
-- Значения: ru, en, kg. По умолчанию русский — на нём говорит клуб.
--
-- Запускать можно повторно.

BEGIN;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS lang text NOT NULL DEFAULT 'ru';

-- Только три наших языка: опечатка в коде не должна превратиться в
-- «язык», которого нет
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_lang_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_lang_check CHECK (lang IN ('ru', 'en', 'kg'));

COMMENT ON COLUMN public.profiles.lang IS
  'Язык человека: ru, en, kg. Ставится при каждом переключении языка на сайте, в кабинете и в приложении. На нём приходят Telegram и push.';

COMMIT;

-- ============================================================
-- Проверка
-- ============================================================

SELECT lang, count(*) AS сколько
  FROM public.profiles
 GROUP BY lang
 ORDER BY сколько DESC;
-- Ожидаем: все на ru — поле только что появилось.

SELECT column_name, data_type, column_default, is_nullable
  FROM information_schema.columns
 WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'lang';
