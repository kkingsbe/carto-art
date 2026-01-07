-- Create product_variants table
CREATE TABLE IF NOT EXISTS product_variants (
    id BIGINT PRIMARY KEY, -- Printful Variant ID
    name TEXT NOT NULL,
    price_cents INTEGER NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_product_variants_updated_at
    BEFORE UPDATE ON product_variants
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();

-- Enable RLS
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow public read-only access to active variants" 
    ON product_variants
    FOR SELECT 
    USING (is_active = true);

CREATE POLICY "Allow admins full access" 
    ON product_variants
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Insert initial data
INSERT INTO product_variants (id, name, price_cents, display_order)
VALUES 
    (12345, '18" x 24" Framed', 9900, 1),
    (67890, '24" x 36" Framed', 14900, 2)
ON CONFLICT (id) DO NOTHING;
