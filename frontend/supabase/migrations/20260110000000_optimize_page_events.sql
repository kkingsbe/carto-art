-- Migration to optimize admin analytics queries
-- 1. Add indexes for faster filtering and aggregation
-- 2. Add generic get_period_analytics RPC

-- 1. Add Indexes
-- Speed up time-range filtering
CREATE INDEX IF NOT EXISTS idx_page_events_created_at 
ON public.page_events (created_at);

-- Speed up funnel steps (filtering by event_type/name within a time range)
-- Also helps with unique session counting
CREATE INDEX IF NOT EXISTS idx_page_events_unique_session 
ON public.page_events (event_type, event_name, created_at, session_id);

-- Speed up user retention queries (filtering by user_id and dates)
CREATE INDEX IF NOT EXISTS idx_page_events_user_id_created_at 
ON public.page_events (user_id, created_at);

-- 2. Create Generic Analytics RPC
-- Returns counts of events grouped by type and name, plus specific landing page count
CREATE OR REPLACE FUNCTION get_period_analytics(
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    landing_count BIGINT;
    event_counts JSONB;
BEGIN
    -- 1. Calculate Landing Page Count (special case: matching URL pattern)
    SELECT COUNT(DISTINCT session_id)
    INTO landing_count
    FROM public.page_events
    WHERE event_type = 'page_view'
    AND page_url ILIKE '%/'
    AND created_at BETWEEN start_time AND end_time
    AND session_id IS NOT NULL;

    -- 2. Calculate Event Counts (grouped by type and name)
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO event_counts
    FROM (
        SELECT 
            event_type, 
            event_name, 
            COUNT(DISTINCT session_id) as count
        FROM public.page_events
        WHERE created_at BETWEEN start_time AND end_time
        AND session_id IS NOT NULL
        GROUP BY event_type, event_name
    ) sub;

    -- 3. Return combined result
    RETURN jsonb_build_object(
        'landing_count', landing_count,
        'event_counts', event_counts
    );
END;
$$;
