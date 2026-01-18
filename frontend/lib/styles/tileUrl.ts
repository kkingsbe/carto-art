// Tile URL generation for map tiles
export function getOpenFreeMapPlanetTileJsonUrl(styleId: string): string {
  return '/api/tiles/planet/' + styleId + '.json';
}

export function getContourTileJsonUrl(styleId: string): string {
  return '/api/tiles/contour/' + styleId + '.json';
}

export function getPopulationTileUrl(styleId: string): string {
  return '/api/tiles/population/' + styleId + '.json';
}

export function getAwsTerrariumTileUrl(styleId?: string): string {
  if (styleId) {
    return '/api/tiles/terrain/' + styleId + '.json';
  }
  return '/api/tiles/terrain/terrarium/{z}/{x}/{y}.png';
}

export function getSpaceportsGeoJsonUrl(): string {
  return '/api/spaceports';
}
