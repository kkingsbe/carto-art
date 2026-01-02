-- Create follows table for social graph
create table if not exists public.follows (
  follower_id uuid references public.profiles(id) on delete cascade not null,
  following_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (follower_id, following_id)
);

-- Enable RLS on follows
alter table public.follows enable row level security;

-- Policies for follows
create policy "Anyone can read follows"
  on public.follows for select
  using (true);

create policy "Authenticated users can follow others"
  on public.follows for insert
  with check (auth.uid() = follower_id);

create policy "Users can unfollow"
  on public.follows for delete
  using (auth.uid() = follower_id);

-- Add view_count to maps
alter table public.maps 
add column if not exists view_count integer default 0 not null;

-- Add featured_map_ids to profiles
alter table public.profiles
add column if not exists featured_map_ids uuid[] default '{}'::uuid[];

-- Add indexes for performance
create index if not exists follows_follower_id_idx on public.follows(follower_id);
create index if not exists follows_following_id_idx on public.follows(following_id);
