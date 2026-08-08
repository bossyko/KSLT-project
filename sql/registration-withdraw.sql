-- ============================================
-- KSLT — снятие заявки игроком (#6)
-- Запустить в Supabase SQL Editor целиком.
-- ============================================
--
-- Игрок снимает свою заявку сам: status → 'withdrawn'. Строку не удаляем,
-- чтобы у организатора осталась история, кто и когда снялся.
--
-- Заодно закрываем дыру. Политика registrations_self_add_partner заводилась
-- ради одного поля — добавить партнёра — но разрешает игроку UPDATE любой
-- колонки своей заявки, включая seed_number, draw_position и group_number.
-- То есть посев себе он может поправить прямо из консоли браузера.
--
-- Колоночный GRANT здесь не годится: админка ходит в базу под той же ролью
-- authenticated, и запрет на колонку сломал бы посев в админке. Поэтому
-- ограничиваем триггером, который отличает игрока от админа.

-- Когда игрок снялся. Нужно и для истории, и для будущего штрафа (#29):
-- правило клиента считает часы до жеребьёвки.
ALTER TABLE tournament_registrations ADD COLUMN IF NOT EXISTS withdrawn_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION registrations_guard_self_update()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  -- Отметка времени снятия ставится здесь, а не на клиенте: так её нельзя
  -- подделать и она появляется, откуда бы заявку ни сняли
  IF NEW.status = 'withdrawn' AND OLD.status IS DISTINCT FROM 'withdrawn' THEN
    NEW.withdrawn_at := now();
  ELSIF NEW.status IS DISTINCT FROM 'withdrawn' THEN
    NEW.withdrawn_at := NULL;
  END IF;

  -- Сервер ходит под service_role: это наши Edge Functions, у них своя проверка.
  -- Ограничиваем только браузер с пользовательским токеном.
  IF auth.uid() IS NULL OR COALESCE(auth.role(), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Админ и менеджер правят заявку как раньше
  IF EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')) THEN
    RETURN NEW;
  END IF;

  -- Игроку оставляем партнёра и снятие заявки
  IF NEW.status IS DISTINCT FROM OLD.status AND NEW.status <> 'withdrawn' THEN
    RAISE EXCEPTION 'Заявку можно только снять';
  END IF;

  IF NEW.tournament_id  IS DISTINCT FROM OLD.tournament_id
  OR NEW.player_id      IS DISTINCT FROM OLD.player_id
  OR NEW.seed_number    IS DISTINCT FROM OLD.seed_number
  OR NEW.draw_position  IS DISTINCT FROM OLD.draw_position
  OR NEW.group_number   IS DISTINCT FROM OLD.group_number
  OR NEW.registered_at  IS DISTINCT FROM OLD.registered_at
  OR NEW.block_reason   IS DISTINCT FROM OLD.block_reason
  OR NEW.is_external    IS DISTINCT FROM OLD.is_external THEN
    RAISE EXCEPTION 'Эти поля меняет только организатор';
  END IF;

  -- Снимать заявку после жеребьёвки нельзя: игрок уже в сетке
  IF NEW.status = 'withdrawn' AND OLD.status <> 'withdrawn'
     AND (OLD.draw_position IS NOT NULL OR OLD.group_number IS NOT NULL) THEN
    RAISE EXCEPTION 'Жеребьёвка проведена, снять заявку может только организатор';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS registrations_guard_self_update ON tournament_registrations;
CREATE TRIGGER registrations_guard_self_update
  BEFORE UPDATE ON tournament_registrations
  FOR EACH ROW EXECUTE FUNCTION registrations_guard_self_update();

-- Проверка: колонка на месте, статусы как ожидаем
SELECT status, count(*), count(withdrawn_at) AS with_time
FROM tournament_registrations GROUP BY status ORDER BY 2 DESC;
