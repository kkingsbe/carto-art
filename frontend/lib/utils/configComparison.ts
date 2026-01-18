// Config comparison utilities
import type { PosterConfig } from '@/types/poster';

export function cloneConfig(config: PosterConfig): PosterConfig {
  return JSON.parse(JSON.stringify(config)) as PosterConfig;
}

export function isConfigEqual(config1: PosterConfig, config2: PosterConfig): boolean {
  return JSON.stringify(config1) === JSON.stringify(config2);
}
