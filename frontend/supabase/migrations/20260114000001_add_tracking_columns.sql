-- Add tracking columns to orders table
ALTER TABLE orders ADD COLUMN tracking_url TEXT;
ALTER TABLE orders ADD COLUMN tracking_number TEXT;
