-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create maps table
CREATE TABLE IF NOT EXISTS maps (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subtitle TEXT,
  config JSONB NOT NULL,
  is_published BOOLEAN NOT NULL DEFAULT FALSE,
  thumbnail_url TEXT,
  vote_score INTEGER NOT NULL DEFAULT 0,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  value INTEGER NOT NULL CHECK (value IN (-1, 1)),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, map_id)
);

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  map_id UUID NOT NULL REFERENCES maps(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_maps_user_id ON maps(user_id);
CREATE INDEX IF NOT EXISTS idx_maps_published ON maps(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_maps_vote_score ON maps(vote_score DESC, published_at DESC) WHERE is_published = TRUE;
CREATE INDEX IF NOT EXISTS idx_votes_map_id ON votes(map_id);
CREATE INDEX IF NOT EXISTS idx_votes_user_id ON votes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_map_id ON comments(map_id);
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON comments(map_id, created_at DESC);

-- Create function to update vote_score
CREATE OR REPLACE FUNCTION update_map_vote_score()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE maps
  SET vote_score = COALESCE(
    (SELECT SUM(value) FROM votes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)),
    0
  )
  WHERE id = COALESCE(NEW.map_id, OLD.map_id);
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote_score updates
DROP TRIGGER IF EXISTS votes_score_trigger ON votes;
CREATE TRIGGER votes_score_trigger
  AFTER INSERT OR UPDATE OR DELETE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_map_vote_score();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  username_base TEXT;
  final_username TEXT;
  counter INTEGER := 0;
BEGIN
  -- Try to generate username from email or metadata
  username_base := LOWER(COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'preferred_username',
    SPLIT_PART(NEW.email, '@', 1)
  ));
  
  -- Remove non-alphanumeric characters except underscore and hyphen
  username_base := REGEXP_REPLACE(username_base, '[^a-z0-9_-]', '', 'g');
  
  -- Ensure it's not empty
  IF username_base = '' OR username_base IS NULL THEN
    username_base := 'user';
  END IF;
  
  -- Ensure length constraints (3-30 chars)
  IF LENGTH(username_base) < 3 THEN
    username_base := username_base || '_123';
  END IF;
  IF LENGTH(username_base) > 30 THEN
    username_base := SUBSTRING(username_base, 1, 30);
  END IF;
  
  final_username := username_base;
  
  -- Try to create unique username
  WHILE EXISTS (SELECT 1 FROM profiles WHERE username = final_username) LOOP
    counter := counter + 1;
    final_username := username_base || '_' || counter::TEXT;
  END LOOP;
  
  INSERT INTO profiles (id, username, display_name, avatar_url)
  VALUES (
    NEW.id,
    final_username,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', NEW.raw_user_meta_data->>'picture')
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user profile creation
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for profiles
-- Anyone can read profiles
CREATE POLICY "Profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- RLS Policies for maps
-- Users can read their own maps
CREATE POLICY "Users can view own maps"
  ON maps FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can read published maps
CREATE POLICY "Published maps are viewable by everyone"
  ON maps FOR SELECT
  USING (is_published = true);

-- Users can insert their own maps
CREATE POLICY "Users can create own maps"
  ON maps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own maps
CREATE POLICY "Users can update own maps"
  ON maps FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own maps
CREATE POLICY "Users can delete own maps"
  ON maps FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for votes
-- Anyone can read votes
CREATE POLICY "Votes are viewable by everyone"
  ON votes FOR SELECT
  USING (true);

-- Authenticated users can create votes
CREATE POLICY "Users can create votes"
  ON votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own votes
CREATE POLICY "Users can update own votes"
  ON votes FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
  ON votes FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for comments
-- Anyone can read comments on published maps
CREATE POLICY "Comments are viewable by everyone"
  ON comments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM maps
      WHERE maps.id = comments.map_id
      AND maps.is_published = true
    )
  );

-- Users can read their own comments
CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  USING (auth.uid() = user_id);

-- Authenticated users can create comments on published maps
CREATE POLICY "Users can create comments on published maps"
  ON comments FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM maps
      WHERE maps.id = comments.map_id
      AND maps.is_published = true
    )
  );

-- Users can delete their own comments
CREATE POLICY "Users can delete own comments"
  ON comments FOR DELETE
  USING (auth.uid() = user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maps_updated_at
  BEFORE UPDATE ON maps
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_votes_updated_at
  BEFORE UPDATE ON votes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON comments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

