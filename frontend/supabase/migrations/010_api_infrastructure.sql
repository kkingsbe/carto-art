-- Create API Keys table
create table if not exists public.api_keys (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Key details
  key_prefix text not null, -- Stores the prefix 'ca_live_' or 'ca_test_'
  key_hash text not null unique, -- Stores bcrypt hash of the full key
  name text not null, -- User-friendly name e.g. "Production App"
  
  -- Tier and limits
  tier text not null default 'free', -- 'free', 'maker', 'pro', 'enterprise'
  
  -- Status
  is_active boolean not null default true,
  last_used_at timestamptz,
  
  -- Metadata
  created_at timestamptz not null default now(),
  expires_at timestamptz,
  rate_limit_override jsonb -- Optional custom rate limits
);

create index if not exists idx_api_keys_user_id on public.api_keys(user_id);
create index if not exists idx_api_keys_prefix on public.api_keys(key_prefix);
create index if not exists idx_api_keys_key_hash on public.api_keys(key_hash);


-- Create API Usage Application Tracking table
create table if not exists public.api_usage (
  id uuid primary key default uuid_generate_v4(),
  api_key_id uuid references public.api_keys(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  
  -- Request details
  endpoint text not null,
  method text not null,
  status_code integer not null,
  
  -- Resource tracking
  resource_type text, -- 'poster_generation', 'geocode', 'style_fetch'
  credits_used integer default 1,
  
  -- Metadata
  request_metadata jsonb,
  response_time_ms integer,
  
  created_at timestamptz not null default now()
);

create index if not exists idx_api_usage_key_id on public.api_usage(api_key_id, created_at desc);
create index if not exists idx_api_usage_user_id on public.api_usage(user_id, created_at desc);
create index if not exists idx_api_usage_created_at on public.api_usage(created_at desc);


-- Enable RLS
alter table public.api_keys enable row level security;
alter table public.api_usage enable row level security;

-- RLS Policies for API Keys
create policy "Users can view their own API keys"
  on public.api_keys for select
  using (auth.uid() = user_id);

create policy "Users can create their own API keys"
  on public.api_keys for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own API keys"
  on public.api_keys for delete
  using (auth.uid() = user_id);

-- RLS Policies for API Usage
create policy "Users can view their own API usage"
  on public.api_usage for select
  using (auth.uid() = user_id);

-- Storage Bucket Setup for Posters
-- Note: 'storage' schema objects are usually managed via UI/Supabase client, but we'll try to init via SQL if permissions allow.
-- If this fails, the user might need to create the bucket manually, but usually new Supabase projects allow this.

insert into storage.buckets (id, name, public)
values ('posters', 'posters', true)
on conflict (id) do nothing;

-- Storage Policies
-- Allow public read access to generated posters
create policy "Public read access to posters"
  on storage.objects for select
  using (bucket_id = 'posters');

-- Allow authenticated users (via API key logic or direct) to upload posters
-- NOTE: For the API route (server-side), we use the SERVICE_ROLE key which bypasses RLS.
-- But if we ever allow client-side upload or authenticated user upload:
create policy "Authenticated users can upload posters"
  on storage.objects for insert
  with check (
    bucket_id = 'posters' 
    and auth.role() = 'authenticated'
  );

-- Helper function to update last_used_at on api_keys
-- This allows us to update the timestamp without needing a full round-trip in application code if we wanted to use a trigger
-- But for now we will handle it in the application layer for simplicity.
