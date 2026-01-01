-- Add vote score reconciliation function
-- This function can be run manually to fix any vote_score drift
-- that may occur if triggers are disabled or fail

CREATE OR REPLACE FUNCTION reconcile_vote_scores()
RETURNS TABLE(map_id UUID, old_score INTEGER, new_score INTEGER) AS $$
BEGIN
  RETURN QUERY
  WITH old_scores AS (
    SELECT 
      id,
      vote_score
    FROM maps
    WHERE vote_score != COALESCE(
      (SELECT SUM(value) FROM votes WHERE map_id = maps.id),
      0
    )
  ),
  score_updates AS (
    UPDATE maps m
    SET vote_score = COALESCE(
      (SELECT SUM(value) FROM votes WHERE map_id = m.id),
      0
    )
    FROM old_scores os
    WHERE m.id = os.id
    RETURNING 
      m.id,
      os.vote_score AS old_score,
      m.vote_score AS new_score
  )
  SELECT * FROM score_updates;
END;
$$ LANGUAGE plpgsql;

-- Add comment explaining the function
COMMENT ON FUNCTION reconcile_vote_scores() IS 
  'Reconciles vote scores by recalculating from votes table. Returns map_id, old_score, and new_score for each corrected map. Run manually when needed.';

