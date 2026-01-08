-- Migration: Add referrer/acquisition source tracking
-- Tracks where users came from (referrer URL, UTM params) for analytics

-- Add referrer columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referrer_source TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS utm_source TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS utm_medium TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS utm_campaign TEXT;

-- Create index for efficient aggregation queries
CREATE INDEX IF NOT EXISTS idx_profiles_referrer_source ON profiles(referrer_source) WHERE referrer_source IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_utm_source ON profiles(utm_source) WHERE utm_source IS NOT NULL;

-- RPC function to get referrer leaderboard with aggregated user counts
CREATE OR REPLACE FUNCTION get_referrer_leaderboard(days_back INT DEFAULT 30)
RETURNS JSON AS $$
DECLARE
    start_date TIMESTAMPTZ;
    result JSON;
BEGIN
    -- Calculate start date (NULL means all time)
    IF days_back IS NULL OR days_back <= 0 THEN
        start_date := '1970-01-01'::TIMESTAMPTZ;
    ELSE
        start_date := NOW() - (days_back || ' days')::INTERVAL;
    END IF;

    -- Aggregate referrer sources
    SELECT json_build_object(
        'sources', COALESCE((
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT 
                    COALESCE(referrer_source, 'Direct / Unknown') AS source,
                    COUNT(*) AS users,
                    ROUND((COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 1) AS percentage
                FROM profiles
                WHERE created_at >= start_date
                GROUP BY referrer_source
                ORDER BY COUNT(*) DESC
                LIMIT 20
            ) t
        ), '[]'::JSON),
        'utm_sources', COALESCE((
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT 
                    COALESCE(utm_source, 'None') AS source,
                    COUNT(*) AS users,
                    ROUND((COUNT(*)::NUMERIC / NULLIF(SUM(COUNT(*)) OVER (), 0)) * 100, 1) AS percentage
                FROM profiles
                WHERE created_at >= start_date
                  AND utm_source IS NOT NULL
                GROUP BY utm_source
                ORDER BY COUNT(*) DESC
                LIMIT 10
            ) t
        ), '[]'::JSON),
        'total_users', (
            SELECT COUNT(*) FROM profiles WHERE created_at >= start_date
        )
    ) INTO result;

    RETURN result;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_referrer_leaderboard(INT) TO authenticated, service_role;
