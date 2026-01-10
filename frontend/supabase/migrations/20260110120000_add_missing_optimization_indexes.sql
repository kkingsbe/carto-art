-- Migration to add missing indexes for performance optimization
-- Detected as part of Supabase Disk I/O investigation

-- 1. Index on comments(user_id)
-- Used in RLS policies: "Users can view own comments" (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_comments_user_id 
ON public.comments(user_id);

-- 2. Index on order_cancellations(user_id)
-- Used in RLS policies: "Users can view their own cancellations" (auth.uid() = user_id)
CREATE INDEX IF NOT EXISTS idx_order_cancellations_user_id 
ON public.order_cancellations(user_id);
