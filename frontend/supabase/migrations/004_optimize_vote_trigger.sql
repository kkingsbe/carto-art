-- Optimize vote score trigger to use incremental updates instead of SUM()
-- This avoids full table scans on every vote operation

-- Drop the old trigger and function
DROP TRIGGER IF EXISTS votes_score_trigger ON votes;
DROP FUNCTION IF EXISTS update_map_vote_score();

-- Create optimized function with incremental updates
CREATE OR REPLACE FUNCTION update_map_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  -- Handle INSERT: add the new vote value
  IF TG_OP = 'INSERT' THEN
    UPDATE maps
    SET vote_score = COALESCE(vote_score, 0) + NEW.value
    WHERE id = NEW.map_id;
    RETURN NEW;
  END IF;

  -- Handle UPDATE: subtract old value, add new value
  IF TG_OP = 'UPDATE' THEN
    UPDATE maps
    SET vote_score = COALESCE(vote_score, 0) - OLD.value + NEW.value
    WHERE id = NEW.map_id;
    RETURN NEW;
  END IF;

  -- Handle DELETE: subtract the old vote value
  IF TG_OP = 'DELETE' THEN
    UPDATE maps
    SET vote_score = COALESCE(vote_score, 0) - OLD.value
    WHERE id = OLD.map_id;
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER votes_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_map_vote_score();

-- Add comment explaining the optimization
COMMENT ON FUNCTION update_map_vote_score() IS 
  'Optimized vote score trigger using incremental updates instead of SUM() for better performance';

