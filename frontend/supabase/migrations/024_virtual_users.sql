-- 1. Remove the foreign key constraints from profiles, maps, votes, and comments to auth.users(id)
-- These constraints prevent virtual users (who don't exist in auth.users) from owning content.

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;
ALTER TABLE public.maps DROP CONSTRAINT IF EXISTS maps_user_id_fkey;
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- 2. Add columns to track virtual users and their owners
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS is_virtual BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL;

-- 3. Update RLS policies to allow virtual user management
-- Allow owners to update/delete their virtual users
CREATE POLICY "Users can manage their own virtual users"
  ON public.profiles
  FOR ALL
  USING (
    (auth.uid() = owner_id) OR (auth.uid() = id)
  );

-- Note: 'Profiles are viewable by everyone' policy already exists and still applies.

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_owner_id ON public.profiles(owner_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_virtual ON public.profiles(is_virtual);
CREATE INDEX IF NOT EXISTS idx_profiles_api_key_id ON public.profiles(api_key_id);
