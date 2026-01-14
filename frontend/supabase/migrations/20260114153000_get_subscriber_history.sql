-- Create function to get subscriber history
-- This calculates the cumulative number of unique users who have upgraded to a subscription
-- matching the time buckets requested

create or replace function get_subscriber_history(
  p_start_time timestamp with time zone,
  p_end_time timestamp with time zone,
  p_interval_minutes int
)
returns table (
  bucket timestamp with time zone,
  count bigint
)
language plpgsql
security definer
as $$
begin
  return query
  with time_buckets as (
    select generate_series(
      p_start_time,
      p_end_time,
      (p_interval_minutes || ' minutes')::interval
    ) as bucket_start
  ),
  bucket_ends as (
      select 
        bucket_start,
        bucket_start + (p_interval_minutes || ' minutes')::interval as bucket_end
      from time_buckets
  ),
  daily_counts as (
     -- Get cumulative count for each bucket end
     select 
        be.bucket_start,
        (
            select count(distinct user_id)
            from page_eventspe
            where pe.event_type = 'subscription_upgrade'
            and pe.created_at <= be.bucket_end
            -- Ideally we would subtract cancellations here effectively
            -- but for now we only have upgrades in history.
            -- In known history, we assume upgrades ~ subscribers roughly 
            -- or accepting that this is "Total Subscriptions Ever" until we have better data.
        ) as total
     from bucket_ends be
  )
  select
    bucket_start as bucket,
    total::bigint as count
  from daily_counts;
end;
$$;
