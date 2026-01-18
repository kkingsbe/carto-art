// Stub file for map actions - no-op for anonymous version
import type { PosterConfig, ColorPalette, LayerToggle } from '@/types/poster';

export interface SavedMap {
  id: string;
  name: string;
  title: string;
  subtitle?: string;
  thumbnail_url?: string;
  vote_score: number;
  config: PosterConfig;
}

export async function publishMap(mapId: string) {
  // No-op for anonymous version
  console.log('[Maps] Publish map:', mapId);
}

export async function unpublishMap(mapId: string) {
  // No-op for anonymous version
  console.log('[Maps] Unpublish map:', mapId);
}
