import type { PosterConfig } from '@/types/poster';
import { validatePosterConfig, safeValidatePosterConfig } from '@/lib/validation/posterConfig';
import { createError } from '@/lib/errors/ServerActionError';
import { logger } from '@/lib/logger';

/**
 * Serialize PosterConfig to a format suitable for JSONB storage
 * Validates the config before serialization
 */
export function serializeMapConfig(config: PosterConfig): any {
  // Validate before serialization
  const validated = validatePosterConfig(config);
  return validated;
}

/**
 * Deserialize stored config back to PosterConfig
 * Validates the config after deserialization
 * In production: throws error if validation fails (data corruption)
 * In development: logs warning and returns data (for debugging)
 */
export function deserializeMapConfig(data: any): PosterConfig {
  // Validate after deserialization
  const result = safeValidatePosterConfig(data);
  if (!result.success) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (isProduction) {
      logger.error('Invalid map config in database', { errors: result.error?.issues });
      throw createError.validationError(
        'Map configuration stored in database is invalid. Please contact support.'
      );
    } else {
      logger.warn('Map config validation failed (dev mode)', { errors: result.error?.issues });
      return data as PosterConfig; // Allow in dev for debugging
    }
  }
  return result.data!;
}

