
-- Migration to split 'enabled' into 'enabled_production' and 'enabled_development'

-- 1. Add new columns
ALTER TABLE public.feature_flags
ADD COLUMN IF NOT EXISTS enabled_production BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS enabled_development BOOLEAN DEFAULT false;

-- 2. Migrate existing data
-- We'll assume the current 'enabled' state applies to both environments for existing flags
UPDATE public.feature_flags
SET 
  enabled_production = enabled,
  enabled_development = enabled;

-- 3. Drop the old column
ALTER TABLE public.feature_flags
DROP COLUMN enabled;
