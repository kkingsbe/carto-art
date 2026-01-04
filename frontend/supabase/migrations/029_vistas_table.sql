-- Vista Presets Management Table
-- Stores curated vista configurations for the editor gallery

CREATE TABLE IF NOT EXISTS vistas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  location JSONB NOT NULL,  -- { name, city, subtitle, center, bounds, zoom }
  enabled BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  thumbnail_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient ordering queries
CREATE INDEX idx_vistas_display_order ON vistas(display_order);
CREATE INDEX idx_vistas_enabled ON vistas(enabled);

-- Enable RLS
ALTER TABLE vistas ENABLE ROW LEVEL SECURITY;

-- Public read policy for enabled vistas
CREATE POLICY "vistas_public_read" ON vistas
  FOR SELECT
  TO public
  USING (enabled = true);

-- Admin full access (matching pattern from feature_flags)
CREATE POLICY "vistas_admin_all" ON vistas
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_admin = TRUE
    )
  );

-- Auto-update updated_at timestamp (reuse existing function if available)
CREATE TRIGGER vistas_updated_at
  BEFORE UPDATE ON vistas
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
