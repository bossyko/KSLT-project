-- Rating Season Reset: recalculate all player points with 2 tournament-year window
-- Tournament year: September 1 → August 31
-- Rule: on September 1 of year Y, points from tournament year Y-2/Y-1 expire
-- Before September: oldest valid date = (Y-3)-09-01
-- After September:  oldest valid date = (Y-2)-09-01

CREATE OR REPLACE FUNCTION recalc_all_player_points()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  oldest_date DATE;
  cur_year INT;
BEGIN
  cur_year := EXTRACT(YEAR FROM NOW());
  IF EXTRACT(MONTH FROM NOW()) >= 9 THEN
    oldest_date := make_date(cur_year - 2, 9, 1);
  ELSE
    oldest_date := make_date(cur_year - 3, 9, 1);
  END IF;

  -- Singles points
  UPDATE players p SET points = COALESCE((
    SELECT SUM(rh.points_earned) FROM rating_history rh
    WHERE rh.player_id = p.id
      AND (rh.is_doubles IS NOT TRUE)
      AND rh.recorded_at >= oldest_date
  ), 0);

  -- Doubles points
  UPDATE players p SET doubles_points = COALESCE((
    SELECT SUM(rh.points_earned) FROM rating_history rh
    WHERE rh.player_id = p.id
      AND rh.is_doubles = TRUE
      AND rh.recorded_at >= oldest_date
  ), 0);
END;
$$;

-- pg_cron: auto-run on September 1 every year at midnight
SELECT cron.schedule(
  'yearly-rating-reset',
  '0 0 1 9 *',
  'SELECT recalc_all_player_points()'
);
