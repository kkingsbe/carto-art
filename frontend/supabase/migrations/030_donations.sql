-- Create donations table to store Buy Me a Coffee data
CREATE TABLE IF NOT EXISTS public.donations (
    id TEXT PRIMARY KEY,
    amount NUMERIC NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    sender_name TEXT,
    sender_email TEXT,
    message TEXT,
    status TEXT DEFAULT 'success',
    type TEXT, -- 'donation', 'subscription', 'extra'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Allow based on service role for the webhook handler (which uses service role client usually)
-- and admins for the dashboard.
CREATE POLICY "Admins can manage all donations" ON public.donations
    FOR ALL
    USING ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true )
    WITH CHECK ( (SELECT is_admin FROM public.profiles WHERE id = auth.uid()) = true );

-- Trigger to update updated_at
CREATE TRIGGER update_donations_updated_at
    BEFORE UPDATE ON public.donations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
