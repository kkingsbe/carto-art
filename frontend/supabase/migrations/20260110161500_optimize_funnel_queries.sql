-- Optimizing analytics queries to prevent timeouts

-- 1. Main Analytics Query Optimization
-- We filter by created_at range, then group by event_type/event_name and count distinct session_id.
-- Currently, this likely requires visiting the heap for every row in the date range.
-- A covering index allows an "Index Only Scan", drastically reducing I/O.
DROP INDEX IF EXISTS idx_page_events_analytics_covering;
CREATE INDEX idx_page_events_analytics_covering
ON public.page_events (created_at)
INCLUDE (event_type, event_name, session_id);

-- 2. Landing Page Query Optimization
-- We filter by created_at, event_type='page_view', and page_url ILIKE '%/'.
-- We need distinct session_id.
-- A filtered covering index restricts the index size to only page_views.
-- Including page_url allowing filtering without heap visits (even with ILIKE, checking the index value is faster).
DROP INDEX IF EXISTS idx_page_events_landing_covering;
CREATE INDEX idx_page_events_landing_covering
ON public.page_events (created_at, page_url, session_id)
WHERE event_type = 'page_view';
