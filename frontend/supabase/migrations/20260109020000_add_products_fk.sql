-- Fix missing products before adding FK
-- Find product_ids in variants that don't exist in products table and create placeholder products
INSERT INTO products (id, title, description, is_active, starting_price)
SELECT DISTINCT pv.product_id, 'Restored Product ' || pv.product_id, 'Automatically restored to fix database integrity', false, 0
FROM product_variants pv
LEFT JOIN products p ON pv.product_id = p.id
WHERE p.id IS NULL AND pv.product_id IS NOT NULL
ON CONFLICT (id) DO NOTHING;

-- Now safe to add foreign key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_product_variants_products' 
        AND table_name = 'product_variants'
    ) THEN
        ALTER TABLE product_variants
        ADD CONSTRAINT fk_product_variants_products
        FOREIGN KEY (product_id)
        REFERENCES products(id)
        ON DELETE SET NULL;
    END IF;
END $$;
