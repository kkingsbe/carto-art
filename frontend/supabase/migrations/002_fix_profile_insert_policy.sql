-- Fix: Add missing INSERT policy for profiles table
-- This allows the auth trigger to create user profiles automatically

-- Add INSERT policy for profiles table
-- The trigger runs with SECURITY DEFINER, so it needs permission to insert
CREATE POLICY "Enable insert for authenticated users"
  ON profiles FOR INSERT
  WITH CHECK (true);

-- Ensure the trigger function has proper permissions
ALTER FUNCTION handle_new_user() SECURITY DEFINER SET search_path = public, auth;
