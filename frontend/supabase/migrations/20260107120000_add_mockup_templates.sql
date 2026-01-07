-- Add mockup template columns to product_variants
-- mockup_template_url: URL to frame image with artwork area as magenta placeholder
-- mockup_print_area: JSON with {x, y, width, height} as percentages of template dimensions

ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS mockup_template_url TEXT;
ALTER TABLE product_variants ADD COLUMN IF NOT EXISTS mockup_print_area JSONB;

-- Example print_area format: {"x": 0.15, "y": 0.12, "width": 0.7, "height": 0.76}
-- These represent percentages of the template image dimensions
