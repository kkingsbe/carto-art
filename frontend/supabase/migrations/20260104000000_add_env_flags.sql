-- Add environment-specific columns to feature_flags table
ALTER TABLE feature_flags
ADD COLUMN IF NOT EXISTS enabled_development BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS enabled_production BOOLEAN DEFAULT FALSE;

-- Migrate existing 'enabled' values to the new columns
UPDATE feature_flags 
SET 
  enabled_development = enabled, 
  enabled_production = enabled;

-- Comment on columns
COMMENT ON COLUMN feature_flags.enabled_development IS 'Enable feature in development environment';
COMMENT ON COLUMN feature_flags.enabled_production IS 'Enable feature in production environment';
