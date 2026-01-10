-- Add admin policies for featured_maps table
-- Allows admins to insert, update, and delete featured maps

-- Allow admins to insert
create policy "Admins can insert featured maps"
  on public.featured_maps for insert
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Allow admins to update
create policy "Admins can update featured maps"
  on public.featured_maps for update
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );

-- Allow admins to delete
create policy "Admins can delete featured maps"
  on public.featured_maps for delete
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and is_admin = true
    )
  );
