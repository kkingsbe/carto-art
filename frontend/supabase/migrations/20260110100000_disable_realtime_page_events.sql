-- Disable Realtime for the page_events table to reduce WAL overhead and Disk I/O
begin;
  -- Remove the page_events table from the supabase_realtime publication
  alter publication supabase_realtime drop table page_events;
commit;
