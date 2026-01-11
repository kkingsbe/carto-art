-- Add a partial index to support the optimized get_period_analytics function.
-- This index creates a smaller, sorted subset of data for all non-page_view events.
-- This allows the main aggregation query to run purely on this index (Index Only Scan)
-- without having to scan over the millions of 'page_view' rows.

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_page_events_metrics_subset
ON public.page_events (created_at, event_type, event_name, session_id)
WHERE event_type != 'page_view';
