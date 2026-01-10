-- Add policy for admins to manage featured maps
create policy "Enable full access for admins" on public.featured_maps for all using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
