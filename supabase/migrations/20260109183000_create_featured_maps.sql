-- Create the featured_maps table
create table public.featured_maps (
  id uuid not null default gen_random_uuid (),
  title text not null,
  description text null,
  image_url text not null,
  link_url text not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint featured_maps_pkey primary key (id)
);

-- Enable RLS
alter table public.featured_maps enable row level security;

-- Create policies
create policy "Enable read access for all users" on public.featured_maps for select using (true);
create policy "Enable all access for admins" on public.featured_maps for all using (
  exists (
    select 1 from profiles
    where profiles.id = auth.uid() and profiles.is_admin = true
  )
);
