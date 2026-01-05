-- Function to get activity stats with efficient server-side aggregation
CREATE OR REPLACE FUNCTION get_activity_stats(
    p_metric_type TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_interval_minutes INTEGER
)
RETURNS TABLE (
    bucket TIMESTAMP WITH TIME ZONE,
    count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    v_interval := (p_interval_minutes || ' minutes')::interval;

    -- Special case: total_users (cumulative count)
    IF p_metric_type = 'total_users' THEN
        RETURN QUERY
        WITH time_buckets AS (
            SELECT generate_series(
                date_bin(v_interval, p_start_time, '1970-01-01'),
                date_bin(v_interval, p_end_time, '1970-01-01'),
                v_interval
            ) AS bucket
        ),
        daily_counts AS (
            SELECT
                date_bin(v_interval, created_at, '1970-01-01') AS bucket,
                count(*) as inc
            FROM profiles
            WHERE created_at >= p_start_time AND created_at <= p_end_time
            GROUP BY 1
        ),
        initial_count AS (
            SELECT count(*) as cnt FROM profiles WHERE created_at < p_start_time
        )
        SELECT
            tb.bucket,
            (COALESCE((SELECT cnt FROM initial_count), 0) + 
             SUM(COALESCE(dc.inc, 0)) OVER (ORDER BY tb.bucket))::BIGINT
        FROM time_buckets tb
        LEFT JOIN daily_counts dc ON tb.bucket = dc.bucket
        ORDER BY tb.bucket;
        
    -- Special case: donations (count of successful donations)
    ELSIF p_metric_type = 'donations' THEN
        RETURN QUERY
        SELECT
            date_bin(v_interval, tb.bucket, '1970-01-01') AS bucket,
            count(d.created_at)::BIGINT
        FROM generate_series(
            date_bin(v_interval, p_start_time, '1970-01-01'),
            date_bin(v_interval, p_end_time, '1970-01-01'),
            v_interval
        ) AS tb(bucket)
        LEFT JOIN donations d ON 
            d.created_at >= tb.bucket AND 
            d.created_at < tb.bucket + v_interval AND
            d.status = 'success'
        GROUP BY 1
        ORDER BY 1;

    -- Special case: api_request
    ELSIF p_metric_type = 'api_request' THEN
        RETURN QUERY
        SELECT
            date_bin(v_interval, tb.bucket, '1970-01-01') AS bucket,
            count(a.created_at)::BIGINT
        FROM generate_series(
            date_bin(v_interval, p_start_time, '1970-01-01'),
            date_bin(v_interval, p_end_time, '1970-01-01'),
            v_interval
        ) AS tb(bucket)
        LEFT JOIN api_usage a ON 
            a.created_at >= tb.bucket AND 
            a.created_at < tb.bucket + v_interval
        GROUP BY 1
        ORDER BY 1;

    ELSE
        -- Default: page_events
        RETURN QUERY
        SELECT
            date_bin(v_interval, tb.bucket, '1970-01-01') AS bucket,
            count(pe.created_at)::BIGINT
        FROM generate_series(
            date_bin(v_interval, p_start_time, '1970-01-01'),
            date_bin(v_interval, p_end_time, '1970-01-01'),
            v_interval
        ) AS tb(bucket)
        LEFT JOIN page_events pe ON 
            pe.created_at >= tb.bucket AND 
            pe.created_at < tb.bucket + v_interval AND
            (p_metric_type = 'all' OR pe.event_type = p_metric_type)
        GROUP BY 1
        ORDER BY 1;
    END IF;
END;
$$;

-- Function to get latency stats
CREATE OR REPLACE FUNCTION get_latency_stats(
    p_metric_type TEXT,
    p_start_time TIMESTAMP WITH TIME ZONE,
    p_end_time TIMESTAMP WITH TIME ZONE,
    p_interval_minutes INTEGER
)
RETURNS TABLE (
    bucket TIMESTAMP WITH TIME ZONE,
    avg_value NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_interval INTERVAL;
BEGIN
    v_interval := (p_interval_minutes || ' minutes')::interval;

    IF p_metric_type = 'generation' THEN
        RETURN QUERY
        SELECT
            date_bin(v_interval, tb.bucket, '1970-01-01') AS bucket,
            COALESCE(AVG(
                CASE 
                    WHEN source = 'api' THEN response_time_ms
                    WHEN source = 'ui' THEN (metadata->>'render_time_ms')::numeric
                END
            ), 0)::NUMERIC
        FROM generate_series(
            date_bin(v_interval, p_start_time, '1970-01-01'),
            date_bin(v_interval, p_end_time, '1970-01-01'),
            v_interval
        ) AS tb(bucket)
        LEFT JOIN (
            SELECT created_at, response_time_ms, 'api' as source, NULL::jsonb as metadata 
            FROM api_usage 
            WHERE created_at >= p_start_time AND created_at <= p_end_time
            UNION ALL
            SELECT created_at, NULL as response_time_ms, 'ui' as source, metadata 
            FROM page_events 
            WHERE event_type = 'poster_export' AND created_at >= p_start_time AND created_at <= p_end_time
        ) combined ON 
            combined.created_at >= tb.bucket AND 
            combined.created_at < tb.bucket + v_interval
        GROUP BY 1
        ORDER BY 1;

    ELSIF p_metric_type = 'search' THEN
        RETURN QUERY
        SELECT
            date_bin(v_interval, tb.bucket, '1970-01-01') AS bucket,
            COALESCE(AVG((metadata->>'latency_ms')::numeric), 0)::NUMERIC
        FROM generate_series(
            date_bin(v_interval, p_start_time, '1970-01-01'),
            date_bin(v_interval, p_end_time, '1970-01-01'),
            v_interval
        ) AS tb(bucket)
        LEFT JOIN page_events pe ON 
            pe.event_type = 'search_location' AND
            pe.created_at >= tb.bucket AND 
            pe.created_at < tb.bucket + v_interval
        GROUP BY 1
        ORDER BY 1;
    END IF;
END;
$$;
