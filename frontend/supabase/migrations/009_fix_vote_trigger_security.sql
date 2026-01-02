-- Fix vote score trigger permissions by adding SECURITY DEFINER
-- This allows the trigger to update maps even if the voter doesn't own them (bypassing RLS)

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment
COMMENT ON FUNCTION update_map_vote_score() IS 
  'Optimized vote score trigger using incremental updates. SECURITY DEFINER added to bypass RLS for vote counts.';
