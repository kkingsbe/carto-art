-- Add image_url to product_variants table
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Update the upsert logic if needed, but standard INSERT/UPDATE works fine with the new column
-- The RLS policies should already cover the new column as it part of the table
