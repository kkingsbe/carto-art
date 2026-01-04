-- Migration 025: Decouple Maps, Votes, and Comments from Auth Users
-- This migration removes the foreign key constraints to auth.users(id) 
-- from social tables, allowing Virtual Users (profiles without auth entries)
-- to own content.

-- 1. Drop constraints from maps
ALTER TABLE public.maps DROP CONSTRAINT IF EXISTS maps_user_id_fkey;

-- 2. Drop constraints from votes
ALTER TABLE public.votes DROP CONSTRAINT IF EXISTS votes_user_id_fkey;

-- 3. Drop constraints from comments
ALTER TABLE public.comments DROP CONSTRAINT IF EXISTS comments_user_id_fkey;

-- Note: We retain the FKs to public.profiles(id) which were added in 
-- migrations 003 and 005. Since the profiles table no longer enforces
-- a reference to auth.users (via migration 024), this allows virtual users.
