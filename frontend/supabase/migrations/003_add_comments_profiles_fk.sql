-- Add foreign key from comments.user_id to profiles.id
-- This allows Supabase to recognize the relationship for joins
ALTER TABLE comments
ADD CONSTRAINT comments_user_id_profiles_fkey
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

