-- Add foreign key from maps.user_id to profiles.id
-- This allows Supabase to recognize the relationship for joins
-- Note: Both maps.user_id and profiles.id reference auth.users(id),
-- so they share the same ID space and this FK is valid
ALTER TABLE maps
ADD CONSTRAINT maps_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

