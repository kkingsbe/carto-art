// import maplibregl from 'maplibre-gl'; // Removed to avoid version/instance mismatch
import mlcontour from 'maplibre-contour';

const { DemSource } = mlcontour;

let isConfigured = false;

/**
 * Registers the 'contour' protocol in MapLibre for client-side contour generation.
 * This should be called before map initialization, passing the maplibregl instance.
 */
export function setupMapLibreContour(maplibreglInstance: any) {
    if (isConfigured) return;

    if (!maplibreglInstance) {
        console.error('[MapSetup] Invalid maplibregl instance provided');
        return;
    }

    // Debug: Check if addProtocol exists
    if (typeof maplibreglInstance.addProtocol !== 'function') {
        console.error('[MapSetup] maplibregl instance does not support addProtocol');
        return;
    }


    // Initialize the contour protocol
    // This registers the 'contour://' protocol which generates vector tiles
    // from raster DEM tiles on the fly.
    const demSource = new DemSource({
        url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        encoding: 'terrarium', // 'mapbox' or 'terrarium'
        maxzoom: 14,
        timeoutMs: 10000, // Timeout for fetching tiles
    });

    try {
        demSource.setupMaplibre(maplibreglInstance);
        isConfigured = true;
        console.log('[MapSetup] Contour protocol registered successfully');
    } catch (e) {
        console.error('[MapSetup] Failed to register contour protocol:', e);
    }
}


