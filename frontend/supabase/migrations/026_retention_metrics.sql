-- Migration 026: Retention Metrics Infrastructure
-- Objectives: 
-- 1. Add lifecycle tracking columns to profiles
-- 2. Add session duration to page events
-- 3. Create triggers for auto-populating first_* timestamps
-- 4. Create analytics helper functions

-- 1. Add lifecycle columns to profiles
alter table public.profiles 
add column if not exists last_active_at timestamptz default now(),
add column if not exists first_map_at timestamptz,
add column if not exists first_export_at timestamptz,
add column if not exists first_publish_at timestamptz,
add column if not exists acquisition_source text;

-- 2. Add session duration to page_events
alter table public.page_events
add column if not exists session_duration_ms integer;

-- 3. Create functions and triggers for lifecycle events

-- Function to update last_active_at on any page event
create or replace function update_profile_last_active()
returns trigger as $$
begin
    if NEW.user_id is not null then
        update public.profiles
        set last_active_at = NEW.created_at
        where id = NEW.user_id;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for last_active_at
drop trigger if exists on_page_event_update_active on public.page_events;
create trigger on_page_event_update_active
    after insert on public.page_events
    for each row
    execute function update_profile_last_active();

-- Function to set first_map_at
create or replace function update_profile_first_map()
returns trigger as $$
begin
    update public.profiles
    set first_map_at = NEW.created_at
    where id = NEW.user_id
    and first_map_at is null;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for first_map_at
drop trigger if exists on_map_created_lifecycle on public.maps;
create trigger on_map_created_lifecycle
    after insert on public.maps
    for each row
    execute function update_profile_first_map();

-- Function to set first_publish_at
create or replace function update_profile_first_publish()
returns trigger as $$
begin
    -- Only trigger if published is true
    if NEW.is_published = true then
        update public.profiles
        set first_publish_at = NEW.updated_at
        where id = NEW.user_id
        and first_publish_at is null;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for first_publish_at
drop trigger if exists on_map_published_lifecycle on public.maps;
create trigger on_map_published_lifecycle
    after insert or update on public.maps
    for each row
    execute function update_profile_first_publish();

-- Function to set first_export_at via page_events
create or replace function update_profile_first_export()
returns trigger as $$
begin
    if NEW.event_type = 'poster_export' and NEW.user_id is not null then
        update public.profiles
        set first_export_at = NEW.created_at
        where id = NEW.user_id
        and first_export_at is null;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger for first_export_at
drop trigger if exists on_export_event_lifecycle on public.page_events;
create trigger on_export_event_lifecycle
    after insert on public.page_events
    for each row
    execute function update_profile_first_export();


-- 4. Analytics Helper Functions

-- Function to calculate retention for a specific day offset (e.g. Day 1, Day 7, Day 30)
-- Returns retention rate as a percentage (0-100)
create or replace function get_retention_rate(
    days_since_signup integer, 
    lookback_days integer default 90
)
returns float as $$
declare
    total_users integer;
    retained_users integer;
begin
    -- Define the cohort window (users who signed up between lookback_days ago and days_since_signup ago)
    -- We need users who are OLD enough to have been retained
    
    with cohort as (
        select id, created_at
        from public.profiles
        where created_at < (now() - (days_since_signup || ' days')::interval)
        and created_at > (now() - (lookback_days || ' days')::interval)
    )
    select count(*) into total_users from cohort;
    
    if total_users = 0 then
        return 0;
    end if;
    
    -- Count users who had activity on or after their [days_since_signup] day
    -- We look for activity in a 24h window around the target day, or strictly AFTER the target day?
    -- Standard retention: Logged in on Day X. Let's use a 24h window for "Day X"
    
    with cohort as (
        select id, created_at
        from public.profiles
        where created_at < (now() - (days_since_signup || ' days')::interval)
        and created_at > (now() - (lookback_days || ' days')::interval)
    )
    select count(distinct c.id) into retained_users
    from cohort c
    join public.page_events e on e.user_id = c.id
    where e.created_at >= (c.created_at + (days_since_signup || ' days')::interval)
    and e.created_at < (c.created_at + ((days_since_signup + 1) || ' days')::interval);
    
    return (retained_users::float / total_users::float) * 100;
end;
$$ language plpgsql stable;

-- Function to get weekly cohort matrix
-- Returns table of (cohort_week, total_users, week_0, week_1, week_2, week_3, week_4)
create or replace function get_weekly_cohort_retention()
returns table (
    cohort_week date,
    total_users bigint,
    week_0 float,
    week_1 float,
    week_2 float,
    week_3 float,
    week_4 float
) as $$
begin
    return query
    with cohort_users as (
        select 
            date_trunc('week', created_at)::date as cohort_date,
            id as user_id,
            created_at as signup_date
        from public.profiles
        where created_at > (now() - interval '8 weeks')
    ),
    cohort_sizes as (
        select cohort_date, count(*) as num_users
        from cohort_users
        group by cohort_date
    ),
    user_activity as (
        select 
            e.user_id,
            -- Calculate which week number this activity falls into relative to signup
            floor(extract(epoch from (e.created_at - u.signup_date)) / 604800)::int as week_number
        from public.page_events e
        join cohort_users u on e.user_id = u.user_id
        where e.created_at >= u.signup_date
        group by e.user_id, week_number
    ),
    retention_counts as (
        select 
            u.cohort_date,
            ua.week_number,
            count(distinct u.user_id) as retained_count
        from cohort_users u
        join user_activity ua on u.user_id = ua.user_id
        group by u.cohort_date, ua.week_number
    )
    select 
        cs.cohort_date,
        cs.num_users,
        coalesce(max(case when rc.week_number = 0 then rc.retained_count end)::float / nullif(cs.num_users, 0) * 100, 0) as week_0,
        coalesce(max(case when rc.week_number = 1 then rc.retained_count end)::float / nullif(cs.num_users, 0) * 100, 0) as week_1,
        coalesce(max(case when rc.week_number = 2 then rc.retained_count end)::float / nullif(cs.num_users, 0) * 100, 0) as week_2,
        coalesce(max(case when rc.week_number = 3 then rc.retained_count end)::float / nullif(cs.num_users, 0) * 100, 0) as week_3,
        coalesce(max(case when rc.week_number = 4 then rc.retained_count end)::float / nullif(cs.num_users, 0) * 100, 0) as week_4
    from cohort_sizes cs
    left join retention_counts rc on cs.cohort_date = rc.cohort_date
    group by cs.cohort_date, cs.num_users
    order by cs.cohort_date desc;
end;
$$ language plpgsql stable;
