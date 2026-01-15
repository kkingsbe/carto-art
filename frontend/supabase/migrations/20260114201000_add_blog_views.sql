-- Create table for tracking individual blog views
create table if not exists public.blog_views (
  id uuid default gen_random_uuid() primary key,
  slug text not null,
  viewer_id uuid references auth.users(id),
  ip_hash text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create table for aggregated stats
create table if not exists public.blog_stats (
  slug text primary key,
  view_count bigint default 0,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add RLS policies
alter table public.blog_views enable row level security;
alter table public.blog_stats enable row level security;

-- Allow anyone to insert views (handled by server action anyway, but good for completeness if using client-side)
-- Actually, strict RLS meant we usually only allow specific actions.
-- Since we are using a server action with service role or similar, RLS might not block us if we bypass it.
-- But standard practice:
create policy "Anyone can insert blog views"
  on public.blog_views for insert
  with check (true);

-- Allow public read of stats
create policy "Anyone can read blog stats"
  on public.blog_stats for select
  using (true);

-- Function to increment view count
create or replace function increment_blog_view(post_slug text)
returns void
language plpgsql
security definer
as $$
begin
  insert into public.blog_stats (slug, view_count, updated_at)
  values (post_slug, 1, now())
  on conflict (slug)
  do update set
    view_count = blog_stats.view_count + 1,
    updated_at = now();
end;
$$;
