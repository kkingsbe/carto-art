-- Update get_analytics_summary to include custom marker stats
CREATE OR REPLACE FUNCTION get_analytics_summary(interval_days int default 30)
RETURNS json AS $$
DECLARE
    start_date timestamptz;
    total_views bigint;
    total_sessions bigint;
    active_users bigint;
    custom_markers bigint;
    marker_adoption bigint;
    top_pages json;
BEGIN
    start_date := now() - (interval_days || ' days')::interval;

    -- 1. Total Views (Page Views)
    SELECT count(*) INTO total_views
    FROM page_events
    WHERE event_type = 'page_view'
    AND created_at >= start_date;

    -- 2. Total Sessions (Unique Visitors based on session_id)
    SELECT count(distinct session_id) INTO total_sessions
    FROM page_events
    WHERE event_type = 'page_view'
    AND created_at >= start_date;

    -- 3. Active Users (Unique User IDs - authenticated)
    SELECT count(distinct user_id) INTO active_users
    FROM page_events
    WHERE created_at >= start_date
    AND user_id IS NOT NULL;

    -- 4. Custom Markers Created (Total events)
    SELECT count(*) INTO custom_markers
    FROM page_events
    WHERE event_type = 'marker_add'
    AND created_at >= start_date;

    -- 5. Marker Adoption (Unique users who added a marker)
    SELECT count(distinct user_id) INTO marker_adoption
    FROM page_events
    WHERE event_type = 'marker_add'
    AND created_at >= start_date
    AND user_id IS NOT NULL;

    -- 6. Top Pages
    SELECT json_agg(t) INTO top_pages
    FROM (
        SELECT page_url AS url, count(*) AS views
        FROM page_events
        WHERE event_type = 'page_view'
        AND created_at >= start_date
        GROUP BY page_url
        ORDER BY views DESC
        LIMIT 10
    ) t;

    RETURN json_build_object(
        'views', coalesce(total_views, 0),
        'sessions', coalesce(total_sessions, 0),
        'activeUsers', coalesce(active_users, 0),
        'customMarkers', coalesce(custom_markers, 0),
        'markerAdoption', coalesce(marker_adoption, 0),
        'topPages', coalesce(top_pages, '[]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
