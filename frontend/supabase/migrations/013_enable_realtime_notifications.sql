-- Enable Realtime for the notifications table
begin;
  -- Add the notifications table to the supabase_realtime publication
  alter publication supabase_realtime add table notifications;
commit;
