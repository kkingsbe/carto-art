-- Create table for featured maps on landing page
create table if not exists public.featured_maps (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  image_url text not null,
  link_url text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint featured_maps_pkey primary key (id)
);

-- Allow public read access
alter table public.featured_maps enable row level security;

create policy "Featured maps are viewable by everyone"
  on public.featured_maps for select
  using (true);

-- Only admins/service role can insert/update/delete (handled by app logic usually, but here is policy)
-- Assuming we stick to service role for admin actions or use authenticated user checks if we had admin role.
-- For now, we'll just allow authenticated users to view as well (covered by everyone).

-- Creating separate policy for modification if needed, but usually server actions bypass RLS if using service role,
-- or we need a policy for admin users.
-- Given existing patterns, check if there is an 'admin' role or similar.
-- Looking at other migrations might help, but let's stick to basic enable RLS + public read.
