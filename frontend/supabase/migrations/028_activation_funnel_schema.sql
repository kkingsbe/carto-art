-- Migration 028: Activation Funnel Schema
-- Objectives:
-- 1. Add first_view_editor_at to profiles
-- 2. Create trigger to auto-populate from page_events
-- 3. Backfill existing data

-- 1. Add column
alter table public.profiles
add column if not exists first_view_editor_at timestamptz;

-- 2. Create function and trigger
create or replace function update_profile_first_editor_view()
returns trigger as $$
begin
    -- Check if the event is a view on the editor page
    if (NEW.page_url like '%/editor%' or NEW.event_name = 'view_editor') and NEW.user_id is not null then
        update public.profiles
        set first_view_editor_at = NEW.created_at
        where id = NEW.user_id
        and first_view_editor_at is null;
    end if;
    return NEW;
end;
$$ language plpgsql security definer;

-- Trigger
drop trigger if exists on_editor_view_lifecycle on public.page_events;
create trigger on_editor_view_lifecycle
    after insert on public.page_events
    for each row
    execute function update_profile_first_editor_view();

-- 3. Backfill
-- Find the earliest editor view event for each user and update their profile
do $$
begin
    update public.profiles p
    set first_view_editor_at = sub.first_seen
    from (
        select user_id, min(created_at) as first_seen
        from public.page_events
        where (page_url like '%/editor%' or event_name = 'view_editor')
        and user_id is not null
        group by user_id
    ) sub
    where p.id = sub.user_id
    and p.first_view_editor_at is null;
end $$;
