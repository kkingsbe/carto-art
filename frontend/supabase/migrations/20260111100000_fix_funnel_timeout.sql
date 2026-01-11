-- Optimize get_period_analytics to prevent timeouts
-- The previous version aggregated ALL events including 'page_view', which effectively
-- meant scanning and grouping the entire table. Since 'page_view' is handled separately
-- for landing_count, we can exclude it from the main grouping query.

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
    -- This remains the same, but we should ensure it's efficient.
    SELECT COUNT(DISTINCT session_id)
    INTO landing_count
    FROM public.page_events
    WHERE event_type = 'page_view'
    AND page_url ILIKE '%/'
    AND created_at BETWEEN start_time AND end_time
    AND session_id IS NOT NULL;

    -- 2. Calculate Event Counts (grouped by type and name)
    -- OPTIMIZATION: Exclude 'page_view' from this aggregation. 
    -- It is 1) already counted above (sort of) and 2) NOT used in the breakdown in route.ts.
    -- Page views are high volume and cause the GROUP BY to assume high cardinality and scan too much.
    SELECT COALESCE(jsonb_agg(sub), '[]'::jsonb)
    INTO event_counts
    FROM (
        SELECT 
            event_type, 
            event_name, 
            COUNT(DISTINCT session_id) as count
        FROM public.page_events
        WHERE created_at BETWEEN start_time AND end_time
        AND event_type != 'page_view' -- <--- CRITICAL OPTIMIZATION
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
