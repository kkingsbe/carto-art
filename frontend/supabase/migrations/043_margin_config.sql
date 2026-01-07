-- Add product margin configuration
-- This margin percentage is applied to all product prices during checkout

INSERT INTO site_config (key, value, description) VALUES
  ('product_margin_percent', '25', 'Profit margin percentage added to product base prices (e.g., 25 = 25% markup)')
ON CONFLICT (key) DO NOTHING;
