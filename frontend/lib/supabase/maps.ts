import type { PosterConfig } from '@/types/poster';

/**
 * Serialize PosterConfig to a format suitable for JSONB storage
 */
export function serializeMapConfig(config: PosterConfig): any {
  // PosterConfig is already JSON-serializable, but we can add validation
  return config;
}

/**
 * Deserialize stored config back to PosterConfig
 */
export function deserializeMapConfig(data: any): PosterConfig {
  // Validate and return as PosterConfig
  // You can add schema validation here if needed
  return data as PosterConfig;
}

