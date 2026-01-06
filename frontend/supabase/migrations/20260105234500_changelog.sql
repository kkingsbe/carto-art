-- Migration: Changelog Entries
-- Objectives:
-- 1. Create changelog_entries table
-- 2. Enable RLS and set policies
-- 3. Add updated_at trigger

CREATE TABLE IF NOT EXISTS changelog_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  is_published BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for scheduled/published sorting
CREATE INDEX IF NOT EXISTS idx_changelog_published_at ON changelog_entries(published_at DESC);

-- Enable RLS
ALTER TABLE changelog_entries ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Public can view published changelog entries"
  ON changelog_entries FOR SELECT
  USING (is_published = TRUE AND published_at <= NOW());

CREATE POLICY "Admin can manage all changelog entries"
  ON changelog_entries
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Trigger for updated_at
CREATE TRIGGER update_changelog_entries_updated_at
    BEFORE UPDATE ON changelog_entries
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
