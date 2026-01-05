import type { FeatureCollection, LineString, Point, MultiLineString } from 'geojson';

/**
 * Generates a GeoJSON FeatureCollection containing graticule lines and labels.
 * 
 * @param density Interval in degrees between graticule lines.
 * @returns GeoJSON FeatureCollection
 */
export function generateGraticuleGeoJSON(density: number = 10): FeatureCollection {
    const lines: FeatureCollection<MultiLineString> = {
        type: 'FeatureCollection',
        features: [
            {
                type: 'Feature',
                properties: { type: 'graticule-lines' },
                geometry: {
                    type: 'MultiLineString',
                    coordinates: []
                }
            }
        ]
    };

    const labels: FeatureCollection<Point> = {
        type: 'FeatureCollection',
        features: []
    };

    const multiLineCoords = lines.features[0].geometry.coordinates;

    // Generate meridians (longitude lines)
    for (let lon = -180; lon <= 180; lon += density) {
        const coords: [number, number][] = [];
        for (let lat = -90; lat <= 90; lat += 2) { // 2 degree segments for smoothness
            coords.push([lon, lat]);
        }
        multiLineCoords.push(coords);

        // Add labels along meridians (at equator and polar regions)
        labels.features.push({
            type: 'Feature',
            properties: {
                text: lon === 0 ? '0°' : `${Math.abs(lon)}°${lon < 0 ? 'W' : 'E'}`,
                type: 'meridian'
            },
            geometry: {
                type: 'Point',
                coordinates: [lon, 0]
            }
        });
    }

    // Generate parallels (latitude lines)
    for (let lat = -90; lat <= 90; lat += density) {
        const coords: [number, number][] = [];
        for (let lon = -180; lon <= 180; lon += 5) { // 5 degree segments for smoothness
            coords.push([lon, lat]);
        }
        multiLineCoords.push(coords);

        // Add labels along parallels (at prime meridian)
        labels.features.push({
            type: 'Feature',
            properties: {
                text: lat === 0 ? '0°' : `${Math.abs(lat)}°${lat < 0 ? 'S' : 'N'}`,
                type: 'parallel'
            },
            geometry: {
                type: 'Point',
                coordinates: [0, lat]
            }
        });
    }

    return {
        type: 'FeatureCollection',
        features: [...lines.features, ...labels.features]
    } as FeatureCollection;
}
