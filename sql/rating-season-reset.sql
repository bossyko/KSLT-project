-- Rating Season Reset: recalculate all player points with 2-year window
-- Rule: on September 1 of year Y, points from year Y-2 expire
-- Before September: valid years = Y-2, Y-1, Y
-- After September:  valid years = Y-1, Y

CREATE OR REPLACE FUNCTION recalc_all_player_points()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  oldest_year INT;
  cur_year INT;
BEGIN
  cur_year := EXTRACT(YEAR FROM NOW());
  IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
    oldest_year := cur_year - 1;
  ELSE
    oldest_year := cur_year - 2;
  END IF;

  -- Singles points
  UPDATE players p SET points = COALESCE((
    SELECT SUM(rh.points_earned) FROM rating_history rh
    WHERE rh.player_id = p.id
      AND (rh.is_doubles IS NOT TRUE)
      AND rh.recorded_at >= make_date(oldest_year, 1, 1)
      AND rh.recorded_at <= make_date(cur_year, 12, 31)
  ), 0);

  -- Doubles points
  UPDATE players p SET doubles_points = COALESCE((
    SELECT SUM(rh.points_earned) FROM rating_history rh
    WHERE rh.player_id = p.id
      AND rh.is_doubles = TRUE
      AND rh.recorded_at >= make_date(oldest_year, 1, 1)
      AND rh.recorded_at <= make_date(cur_year, 12, 31)
  ), 0);
END;
$$;

-- pg_cron: auto-run on September 1 every year at midnight
SELECT cron.schedule(
  'yearly-rating-reset',
  '0 0 1 9 *',
  'SELECT recalc_all_player_points()'
);
