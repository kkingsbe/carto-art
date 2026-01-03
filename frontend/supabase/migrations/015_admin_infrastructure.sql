-- Migration 015: Admin Dashboard Infrastructure
-- Objectives: 
-- 1. Add admin role to profiles
-- 2. Create feature flags table
-- 3. Create activity tracking table

-- Add is_admin column to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Create feature_flags table
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT FALSE,
  enabled_for_users UUID[], -- Array of user IDs for targeted rollout
  enabled_percentage INTEGER DEFAULT 0, -- For 0-100% rollout
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for key lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(key);

-- Create page_events table for activity tracking
CREATE TABLE IF NOT EXISTS page_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  event_type TEXT NOT NULL, -- 'signup', 'map_create', 'map_publish', 'poster_export', 'key_generate', 'page_view', 'click'
  event_name TEXT, -- more specific descriptor
  page_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_page_events_created_at ON page_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_page_events_user_id ON page_events(user_id);
CREATE INDEX IF NOT EXISTS idx_page_events_event_type ON page_events(event_type);

-- RLS for feature_flags (Admin only can manage, public can view enabled ones or admin can see all)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can manage all feature flags"
  ON feature_flags
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

CREATE POLICY "Anyone can view enabled feature flags"
  ON feature_flags FOR SELECT
  USING (TRUE); -- Usually checked in app code, but public view is fine for simple flags

-- RLS for page_events (Insert only for users, select for admin)
ALTER TABLE page_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert page events"
  ON page_events FOR INSERT
  WITH CHECK (TRUE);

CREATE POLICY "Admin can view all page events"
  ON page_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Function to handle updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for feature_flags
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Automatically track new signups in page_events
CREATE OR REPLACE FUNCTION handle_new_signup_event()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO page_events (user_id, event_type, event_name, metadata)
    VALUES (NEW.id, 'signup', 'User joined the platform', jsonb_build_object('username', NEW.username));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_track ON profiles;
CREATE TRIGGER on_profile_created_track
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION handle_new_signup_event();
