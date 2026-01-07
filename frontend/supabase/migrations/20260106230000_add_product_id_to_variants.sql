
-- Add product_id to product_variants
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS product_id BIGINT;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
