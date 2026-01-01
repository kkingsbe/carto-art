-- Add rate limiting table for serverless-compatible rate limiting
-- Stores rate limit data in database to work across multiple instances

CREATE TABLE IF NOT EXISTS rate_limits (
  user_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  request_timestamps JSONB NOT NULL DEFAULT '[]'::jsonb,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, action_type)
);

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action ON rate_limits(user_id, action_type);

-- Create index for cleanup operations (old entries)
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON rate_limits(window_start);

-- Add updated_at trigger
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add comment explaining the table
COMMENT ON TABLE rate_limits IS 
  'Stores rate limiting data for users and actions. Used for serverless-compatible rate limiting across multiple instances.';

-- Add cleanup function to remove old entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS void AS $$
BEGIN
  -- Delete entries older than 24 hours
  DELETE FROM rate_limits
  WHERE window_start < NOW() - INTERVAL '24 hours';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION cleanup_old_rate_limits() IS 
  'Removes rate limit entries older than 24 hours. Can be run periodically via cron job.';

-- Enable Row Level Security
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for rate_limits
-- Note: Rate limits are internal system data. The application needs to read/write
-- rate limits, but users should not be able to directly query or modify them
-- to bypass rate limiting. These policies allow the application (using anon key)
-- to manage rate limits while restricting access to the user's own entries.

-- Allow INSERT: Users can create rate limit entries for themselves or anonymous entries
CREATE POLICY "Users can create rate limit entries"
  ON rate_limits FOR INSERT
  WITH CHECK (
    -- Authenticated users can create entries for themselves
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id) OR
    -- Allow anonymous entries (when auth.uid() is NULL and user_id is 'anonymous')
    (auth.uid() IS NULL AND user_id = 'anonymous')
  );

-- Allow UPDATE: Users can update their own rate limit entries
CREATE POLICY "Users can update own rate limit entries"
  ON rate_limits FOR UPDATE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id) OR
    (auth.uid() IS NULL AND user_id = 'anonymous')
  )
  WITH CHECK (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id) OR
    (auth.uid() IS NULL AND user_id = 'anonymous')
  );

-- Allow SELECT: Users can read their own rate limit entries
-- Note: While this technically allows users to query their rate limits,
-- the application should not expose this in the UI. The server actions
-- use this internally to enforce rate limits.
CREATE POLICY "Users can read own rate limit entries"
  ON rate_limits FOR SELECT
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id) OR
    (auth.uid() IS NULL AND user_id = 'anonymous')
  );

-- Allow DELETE: Users can delete their own rate limit entries (for cleanup)
CREATE POLICY "Users can delete own rate limit entries"
  ON rate_limits FOR DELETE
  USING (
    (auth.uid() IS NOT NULL AND auth.uid()::text = user_id) OR
    (auth.uid() IS NULL AND user_id = 'anonymous')
  );

