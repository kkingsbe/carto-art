-- Migration: Add management columns to feedback table
-- Description: Adds status, category, and notes for admin categorization and tracking

-- Create status enum-like check constraint if not using custom type
-- For simplicity and Supabase compatibility, we'll use TEXT with a CHECK constraint
ALTER TABLE public.feedback 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'new' CHECK (status IN ('new', 'investigating', 'in_progress', 'completed', 'archived')),
ADD COLUMN IF NOT EXISTS admin_category TEXT,
ADD COLUMN IF NOT EXISTS admin_notes TEXT;

-- Index for status tracking
CREATE INDEX IF NOT EXISTS idx_feedback_status ON public.feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_admin_category ON public.feedback(admin_category);

-- Allow admins to update these fields (assumes existing RLS or admin access)
-- Migration 018_admin_feedback_access.sql likely already handled some of this.
-- We ensure admins can update.
CREATE POLICY "Admins can update feedback management fields"
  ON public.feedback FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );
