// URL state encoding/decoding for poster config
import type { PosterConfig } from '@/types/poster';
import { getStyleById } from '@/lib/styles';
import { logger } from '@/lib/logger';

export function encodeConfig(config: PosterConfig): string {
  // Simplified encoding for anonymous version
  const params = new URLSearchParams();
  params.set('style', config.style.id);
  params.set('lat', config.location.center[1].toString());
  params.set('lng', config.location.center[0].toString());
  params.set('zoom', config.location.zoom.toString());
  return params.toString();
}

export function decodeConfig(searchParams: URLSearchParams | string): Partial<PosterConfig> {
  // Simplified decoding for anonymous version
  const params = typeof searchParams === 'string' ? new URLSearchParams(searchParams) : searchParams;
  
  const styleId = params.get('style') || 'minimal';
  const lat = parseFloat(params.get('lat') || '0');
  const lng = parseFloat(params.get('lng') || '0');
  const zoom = parseFloat(params.get('zoom') || '2');
  
  const style = getStyleById(styleId);
  
  return {
    style,
    location: {
      center: [lng, lat] as [number, number],
      zoom,
      name: 'Custom Location',
      city: '',
      subtitle: '',
      bounds: [[lng - 0.1, lat - 0.1], [lng + 0.1, lat + 0.1]],
    },
  };
}
