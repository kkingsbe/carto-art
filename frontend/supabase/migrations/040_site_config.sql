-- Site Configuration Table for Admin-Configurable Settings
-- Used for free tier limits and other site-wide settings

CREATE TABLE IF NOT EXISTS site_config (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_site_config_key ON site_config(key);

-- Enable RLS
ALTER TABLE site_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read config values
CREATE POLICY "site_config_read_all" ON site_config
  FOR SELECT USING (true);

-- Only admins can update
CREATE POLICY "site_config_admin_update" ON site_config
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Only admins can insert
CREATE POLICY "site_config_admin_insert" ON site_config
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Trigger for updated_at
CREATE TRIGGER update_site_config_updated_at
    BEFORE UPDATE ON site_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert default free tier limits
INSERT INTO site_config (key, value, description) VALUES
  ('free_tier_daily_export_limit', '5', 'Maximum exports per rolling 24-hour period for free tier users'),
  ('free_tier_project_limit', '3', 'Maximum saved projects (maps) for free tier users')
ON CONFLICT (key) DO NOTHING;
