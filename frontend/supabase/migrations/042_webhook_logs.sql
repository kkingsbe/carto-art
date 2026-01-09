
-- Create a table to log webhook events for debugging
CREATE TABLE IF NOT EXISTS public.webhook_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source TEXT NOT NULL, -- 'buymeacoffee', 'stripe', etc.
    event_type TEXT,
    payload JSONB,
    status TEXT, -- 'processed', 'failed', 'ignored'
    error TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

-- Allow admins to read logs
CREATE POLICY "Admins can view webhook logs" ON public.webhook_events
    FOR SELECT
    USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true );

-- Allow service role to insert (webhooks use service role)
-- Service role bypasses RLS, but explicit policy is good practice if we ever switch user
-- But since using service role, we don't strictly need insert policy for it.
