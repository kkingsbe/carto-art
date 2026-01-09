-- Add mockup_url to orders table to store the composited product preview
ALTER TABLE orders ADD COLUMN IF NOT EXISTS mockup_url TEXT;
