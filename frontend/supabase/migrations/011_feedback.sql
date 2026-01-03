-- Migration: Add feedback collection tables
-- Description: Creates tables for user feedback and tracking to prevent over-prompting

-- Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- User association (nullable for anonymous feedback)
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT, -- For anonymous tracking
  
  -- Trigger context
  trigger_type TEXT NOT NULL, -- 'post_export', 'gallery_browse', 'voluntary', etc.
  trigger_context JSONB, -- e.g., { "export_count": 1, "map_id": "..." }
  
  -- Ratings
  overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
  nps_score INTEGER CHECK (nps_score >= 0 AND nps_score <= 10),
  
  -- Structured responses
  use_cases TEXT[], -- Array of selected use cases
  pain_points TEXT[], -- Array of selected pain points
  feature_ratings JSONB, -- { "ease_of_use": 3, "map_quality": 3, ... }
  
  -- Open feedback
  open_feedback TEXT,
  
  -- Permissions
  allow_followup BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_agent TEXT,
  page_url TEXT
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON public.feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON public.feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_trigger_type ON public.feedback(trigger_type);
CREATE INDEX IF NOT EXISTS idx_feedback_nps_score ON public.feedback(nps_score);

-- RLS Policies for feedback
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can insert feedback (for anonymous users too)
CREATE POLICY "Anyone can submit feedback"
  ON public.feedback FOR INSERT
  WITH CHECK (true);

-- Users can only read their own feedback
CREATE POLICY "Users can view own feedback"
  ON public.feedback FOR SELECT
  USING (auth.uid() = user_id);


-- Create feedback tracking table
CREATE TABLE IF NOT EXISTS public.feedback_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  
  -- What was shown/dismissed
  last_prompt_at TIMESTAMPTZ,
  last_submitted_at TIMESTAMPTZ,
  prompt_count INTEGER DEFAULT 0,
  dismiss_count INTEGER DEFAULT 0,
  
  -- User preference
  opted_out BOOLEAN DEFAULT FALSE,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Unique constraints (only one can be set)
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_tracking_user_id ON public.feedback_tracking(user_id) WHERE user_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS idx_feedback_tracking_session_id ON public.feedback_tracking(session_id) WHERE session_id IS NOT NULL;

-- RLS Policies for feedback_tracking
ALTER TABLE public.feedback_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own tracking
CREATE POLICY "Users can view own feedback tracking"
  ON public.feedback_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Anyone can insert tracking (for sessions)
CREATE POLICY "Anyone can create feedback tracking"
  ON public.feedback_tracking FOR INSERT
  WITH CHECK (true);

-- Users can update their own tracking
CREATE POLICY "Users can update own feedback tracking"
  ON public.feedback_tracking FOR UPDATE
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_feedback_tracking_updated_at
  BEFORE UPDATE ON public.feedback_tracking
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
