// VistasGallery stub - no-op for stripped version
import type { PosterConfig, PosterLocation } from '@/types/poster';

interface VistasGalleryProps {
  onLocationSelect: (location: Partial<PosterLocation>) => void;
  currentConfig: PosterConfig;
}

export function VistasGallery({ onLocationSelect, currentConfig }: VistasGalleryProps) {
  return null;
}
