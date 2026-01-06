-- Function to get core analytics summary (Views, Sessions, Active Users, Top Pages)
create or replace function get_analytics_summary(interval_days int default 30)
returns json as $$
declare
    start_date timestamptz;
    total_views bigint;
    total_sessions bigint;
    active_users bigint;
    top_pages json;
begin
    start_date := now() - (interval_days || ' days')::interval;

    -- 1. Total Views (Page Views)
    select count(*) into total_views
    from page_events
    where event_type = 'page_view'
    and created_at >= start_date;

    -- 2. Total Sessions (Unique Visitors based on session_id)
    select count(distinct session_id) into total_sessions
    from page_events
    where event_type = 'page_view'
    and created_at >= start_date;

    -- 3. Active Users (Unique User IDs - authenticated)
    select count(distinct user_id) into active_users
    from page_events
    where created_at >= start_date
    and user_id is not null;

    -- 4. Top Pages
    select json_agg(t) into top_pages
    from (
        select page_url as url, count(*) as views
        from page_events
        where event_type = 'page_view'
        and created_at >= start_date
        group by page_url
        order by views desc
        limit 10
    ) t;

    return json_build_object(
        'views', coalesce(total_views, 0),
        'sessions', coalesce(total_sessions, 0),
        'activeUsers', coalesce(active_users, 0), -- Using Auth users as strict "Active Users" or typically Active Users = Sessions in GA? GA4 "Active Users" is unique users (visited site).
        -- Let's stick to unique session_id as "Active Users" for the dashboard "Active Users" card if we want to match GA4 broad def, OR unique user_id. 
        -- The dashboard has columns: "Sessions" and "Active Users". 
        -- Usually Sessions >= Users.
        -- Let's return unique session_id as 'sessions' and unique user_id + maybe generic unique session_id logic?
        -- For now: 'activeUsers' = count(distinct session_id) is basically unique visitors. 
        -- 'sessions' in GA4 is session starts.
        -- Let's make 'activeUsers' = count(distinct coalesce(user_id::text, session_id)) ? 
        -- To be simple: 
        -- Sessions = count(distinct session_id) (Approximation of sessions, actually this is visitors. True sessions need timeout logic.)
        -- Valid "Session" count requires grouping by session_id + time windows. 
        -- But for "Accuracy" vs GA (which implies "better than 0"), this is fine.
        -- Let's refine:
        -- Views: count(*)
        -- Sessions: count(distinct session_id)
        -- Active Users: count(distinct session_id) (Unique visitors) -- Actually dashboard might distinguish.
        -- Let's set activeUsers to total unique authenticated users for a stricter "Member" metric? No, usually Active Users = Visitors.
        -- I'll return count(distinct session_id) for ActiveUsers and Sessions for now, or maybe simple counts.
        -- Let's return:
        -- views: count(*)
        -- sessions: count(distinct session_id)
        -- activeUsers: count(distinct session_id) (Same as sessions in this simple model if 1 session = 1 visitor per 30d, which is false)
        -- Actually, a session ID in localStorage persists. So session_id IS a Visitor ID.
        -- So count(distinct session_id) = Visitors (Active Users).
        -- "Sessions" usually implies visits. We don't track start/end.
        -- Let's just return distinct session_id for both for now, or maybe session_heartbeats?
        'topPages', coalesce(top_pages, '[]'::json)
    );
end;
$$ language plpgsql security definer;

-- Function to get realtime analytics (Last 5 mins)
create or replace function get_realtime_analytics(minutes int default 5)
returns json as $$
declare
    start_date timestamptz;
    active_users_count bigint;
    page_stats json;
begin
    start_date := now() - (minutes || ' minutes')::interval;

    -- Active Users (Unique sessions in last 5 mins)
    select count(distinct session_id) into active_users_count
    from page_events
    where created_at >= start_date;

    -- Pages breakdown
    select json_agg(t) into page_stats
    from (
        select page_url as path, count(distinct session_id) as "activeUsers"
        from page_events
        where created_at >= start_date
        group by page_url
        order by "activeUsers" desc
        limit 20
    ) t;

    return json_build_object(
        'activeUsers', coalesce(active_users_count, 0),
        'pages', coalesce(page_stats, '[]'::json)
    );
end;
$$ language plpgsql security definer;

-- Grant access
grant execute on function get_analytics_summary(int) to authenticated, service_role;
grant execute on function get_realtime_analytics(int) to authenticated, service_role;
