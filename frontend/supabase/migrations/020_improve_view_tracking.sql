-- Create map_views table for accurate tracking
CREATE TABLE IF NOT EXISTS public.map_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    map_id UUID NOT NULL REFERENCES public.maps(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookup
CREATE INDEX idx_map_views_dedup ON public.map_views(map_id, viewer_id, ip_hash);
CREATE INDEX idx_map_views_created_at ON public.map_views(created_at);

-- RLS
ALTER TABLE public.map_views ENABLE ROW LEVEL SECURITY;

-- Allow insert by anon/authenticated
CREATE POLICY "Allow public insert to map_views" ON public.map_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);

-- Create profile_views table
CREATE TABLE IF NOT EXISTS public.profile_views (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ip_hash TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Index for fast lookup
CREATE INDEX idx_profile_views_dedup ON public.profile_views(profile_id, viewer_id, ip_hash);
CREATE INDEX idx_profile_views_created_at ON public.profile_views(created_at);

-- RLS
ALTER TABLE public.profile_views ENABLE ROW LEVEL SECURITY;

-- Allow insert by anon/authenticated
CREATE POLICY "Allow public insert to profile_views" ON public.profile_views
    FOR INSERT TO anon, authenticated
    WITH CHECK (true);
