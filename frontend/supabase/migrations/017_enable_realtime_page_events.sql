-- Enable Realtime for the page_events table
begin;
  -- Add the page_events table to the supabase_realtime publication
  alter publication supabase_realtime add table page_events;
commit;
