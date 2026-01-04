-- Add view_count to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- Function to safely increment map views
CREATE OR REPLACE FUNCTION increment_map_view(map_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.maps
  SET view_count = view_count + 1
  WHERE id = map_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to safely increment profile views
CREATE OR REPLACE FUNCTION increment_profile_view(profile_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE public.profiles
  SET view_count = view_count + 1
  WHERE id = profile_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to public (anon) and authenticated users
GRANT EXECUTE ON FUNCTION increment_map_view(UUID) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION increment_profile_view(UUID) TO anon, authenticated, service_role;
