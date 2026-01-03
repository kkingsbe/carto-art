-- Migration: Add admin access policy for feedback table
-- Description: Allow admins to view all feedback submissions

-- Add admin policy for viewing all feedback
CREATE POLICY "Admins can view all feedback"
  ON public.feedback FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );
