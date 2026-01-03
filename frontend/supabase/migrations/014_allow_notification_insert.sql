-- Allow users to insert notifications for themselves (e.g. for testing)
create policy "Users can insert their own notifications"
  on notifications for insert
  with check (auth.uid() = recipient_id);
