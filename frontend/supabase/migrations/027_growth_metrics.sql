-- Migration 027: Growth Metrics (Activation, Revenue, Stickiness)
-- Objectives:
-- 1. Create RPC for Activation Metrics (Time to First Map, 3-Day Activation)
-- 2. Create RPC for Revenue Metrics (ARPU, LTV)
-- 3. Create RPC for Stickiness (DAU/MAU)

-- 1. Activation Metrics
create or replace function get_activation_metrics()
returns json as $$
declare
    avg_time_to_map interval;
    median_time_to_map interval;
    activation_rate_3d float;
    total_users_3d_plus int;
    activated_users_3d int;
begin
    -- Calculate Time to First Map stats (for users who HAVE created a map)
    select 
        avg(first_map_at - created_at),
        percentile_cont(0.5) within group (order by (first_map_at - created_at))
    into avg_time_to_map, median_time_to_map
    from public.profiles
    where first_map_at is not null;

    -- Calculate 3-Day Activation Rate
    -- Denominator: Users who signed up at least 3 days ago
    select count(*) into total_users_3d_plus
    from public.profiles
    where created_at < (now() - interval '3 days');

    if total_users_3d_plus = 0 then
        activation_rate_3d := 0;
    else
        -- Numerator: Users from that group who created a map within 3 days of signup
        select count(*) into activated_users_3d
        from public.profiles
        where created_at < (now() - interval '3 days')
        and first_map_at is not null
        and first_map_at <= (created_at + interval '3 days');
        
        activation_rate_3d := (activated_users_3d::float / total_users_3d_plus::float) * 100;
    end if;

    return json_build_object(
        'avg_time_to_map_seconds', extract(epoch from avg_time_to_map),
        'median_time_to_map_seconds', extract(epoch from median_time_to_map),
        'activation_rate_3d', activation_rate_3d
    );
end;
$$ language plpgsql stable;

-- 2. Revenue Metrics
create or replace function get_revenue_metrics()
returns json as $$
declare
    total_revenue_cents bigint;
    total_users int;
    paying_users int;
    arpu float;
    arppu float; -- Average Revenue Per Paying User
begin
    -- Get total revenue from paid orders
    select coalesce(sum(amount_total), 0)
    into total_revenue_cents
    from public.orders
    where status in ('paid', 'fulfilled');

    -- Get total user count
    select count(*) into total_users from public.profiles;

    -- Get paying user count
    select count(distinct user_id) 
    into paying_users
    from public.orders
    where status in ('paid', 'fulfilled');

    -- Calculate ARPU (Total Revenue / Total Users)
    if total_users = 0 then
        arpu := 0;
    else
        arpu := (total_revenue_cents::float / 100.0) / total_users::float;
    end if;

    -- Calculate ARPPU (Total Revenue / Paying Users)
    if paying_users = 0 then
        arppu := 0;
    else
        arppu := (total_revenue_cents::float / 100.0) / paying_users::float;
    end if;

    return json_build_object(
        'total_revenue', (total_revenue_cents::float / 100.0),
        'arpu', arpu,
        'arppu', arppu,
        'paying_users', paying_users
    );
end;
$$ language plpgsql stable;

-- 3. Stickiness Metrics
create or replace function get_stickiness_metrics()
returns json as $$
declare
    dau int;
    mau int;
    stickiness_ratio float;
begin
    -- Calculate DAU (Active in last 24 hours)
    -- Using profiles.last_active_at which is updated by page_events trigger
    select count(*) into dau
    from public.profiles
    where last_active_at >= (now() - interval '24 hours');

    -- Calculate MAU (Active in last 30 days)
    select count(*) into mau
    from public.profiles
    where last_active_at >= (now() - interval '30 days');

    if mau = 0 then
        stickiness_ratio := 0;
    else
        stickiness_ratio := (dau::float / mau::float) * 100;
    end if;

    return json_build_object(
        'dau', dau,
        'mau', mau,
        'stickiness_ratio', stickiness_ratio
    );
end;
$$ language plpgsql stable;
