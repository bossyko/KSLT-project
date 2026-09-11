-- ============================================
-- Один номер — одна учётная запись
-- ============================================
--
-- Запускать после того, как двойники разобраны: их ищет соседний файл
-- phone-duplicates-check.sql. Пока в базе есть повторы, запрет не
-- создастся — база оборвёт запрос и назовёт первый повторяющийся номер.
--
-- Почему запрет на phone_e164, а не на phone: в phone номер лежит так,
-- как его набрал человек, и «+996 700 12-34-56» с «0700123456» для базы
-- разные строки. phone_e164 — тот же номер в едином виде, его считает
-- сама база при каждой записи.

-- ============================================
-- 1. Запрет на повторение
-- ============================================
-- Запускать, когда phone-duplicates-check.sql перестал находить двойников.

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_phone_e164_unique
    ON profiles (phone_e164)
 WHERE phone_e164 <> '';

-- ============================================
-- 2. Проверка занятости номера
-- ============================================
-- Нужна, чтобы сказать человеку про занятый номер до сохранения, а не
-- показывать ошибку базы. Своя запись не мешает: иначе нельзя было бы
-- сохранить профиль, ничего не поменяв в телефоне.

CREATE OR REPLACE FUNCTION public.is_phone_taken(p_phone text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_digits text;
BEGIN
  v_digits := regexp_replace(COALESCE(p_phone, ''), '[^0-9]', '', 'g');
  IF v_digits = '' THEN
    RETURN false;
  END IF;

  -- Приводим к тому же виду, что и phone_e164: девять цифр — наш номер
  -- без кода, десять с нуля впереди — наш же, записанный по-местному
  IF length(v_digits) = 9 THEN
    v_digits := '996' || v_digits;
  ELSIF length(v_digits) = 10 AND left(v_digits, 1) = '0' THEN
    v_digits := '996' || right(v_digits, 9);
  END IF;

  -- IS DISTINCT FROM, а не <>: у неизвестного посетителя auth.uid() пуст,
  -- и обычное сравнение дало бы «неизвестно» вместо «да» — функция молча
  -- отвечала бы, что любой номер свободен
  RETURN EXISTS(
    SELECT 1 FROM profiles
     WHERE phone_e164 = v_digits
       AND id IS DISTINCT FROM auth.uid()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_phone_taken(text) TO authenticated;

-- ============================================
-- Проверка
-- ============================================
-- SELECT public.is_phone_taken('0700 12-34-56');   -- своё написание
-- SELECT public.is_phone_taken('+996 700 123456'); -- то же самое иначе
