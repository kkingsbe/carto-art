// import maplibregl from 'maplibre-gl'; // Removed to avoid version/instance mismatch
import mlcontour from 'maplibre-contour';

const { DemSource } = mlcontour;

export function setupMapLibreContour(maplibreglInstance: any) {
    if (!maplibreglInstance) {
        console.error('[MapSetup] Invalid maplibregl instance provided');
        return;
    }

    // Debug: Check if addProtocol exists
    if (typeof maplibreglInstance.addProtocol !== 'function') {
        console.error('[MapSetup] maplibregl instance does not support addProtocol');
        return;
    }


    const demSource = new DemSource({
        url: 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png',
        encoding: 'terrarium',
        maxzoom: 15,
        timeoutMs: 10000,
        worker: true,
    } as any);

    try {
        const sourceAny = demSource as any;

        // Generate default options for the protocol
        let defaultQuery = '';
        try {
            const defaultUrl = sourceAny.contourProtocolUrl({
                thresholds: {
                    11: [100, 500],
                    12: [50, 200],
                    13: [20, 100],
                    14: [10, 50],
                    15: [5, 20]
                },
                multiplier: 1
            });
            if (defaultUrl && defaultUrl.includes('?')) {
                defaultQuery = defaultUrl.split('?')[1];
            }
        } catch (err) {
            console.warn('[MapSetup] Failed to generate default options:', err);
        }

        const wrapProtocol = (name: string, handler: any) => {
            if (!handler) return undefined;
            const boundHandler = handler.bind(demSource);
            return (params: any, abort: any) => {
                // Automatically inject default options if missing.
                let requestParams = params;
                if (name === 'contour' && defaultQuery && params.url && !params.url.includes('?')) {
                    requestParams = { ...params, url: `${params.url}?${defaultQuery}` };
                }

                // Call original handler
                const result = boundHandler(requestParams, abort);

                // Add basic error logging for async failures without spamming
                if (result instanceof Promise) {
                    return result.catch((err: any) => {
                        console.error(`[Protocol ${name}] Error loading ${params.url}:`, err);
                        throw err;
                    });
                }
                return result;
            };
        };

        // 1. Get correct protocol handlers (V4 preferred)
        // Bind to source instance to preserve 'this' context!
        const contourHandler = wrapProtocol('contour', sourceAny.contourProtocolV4 || sourceAny.contourProtocol);
        const sharedHandler = wrapProtocol('shared', sourceAny.sharedDemProtocolV4 || sourceAny.sharedDemProtocol);

        if (maplibreglInstance.addProtocol && contourHandler && sharedHandler) {
            // 2. Register Shared Protocol (Critical for internal fetching)
            const sharedId = sourceAny.sharedDemProtocolId || 'dem-shared';
            maplibreglInstance.addProtocol(sharedId, sharedHandler);

            // 3. Register Contour Protocol (as defined by lib)
            const contourId = sourceAny.contourProtocolId || 'dem-contour';
            maplibreglInstance.addProtocol(contourId, contourHandler);

            // 4. Register 'contour' alias (for our map style usage 'contour://')
            if (contourId !== 'contour') {
                maplibreglInstance.addProtocol('contour', contourHandler);
            }

            console.log('[MapSetup] Protocols registered successfully');
        } else {
            demSource.setupMaplibre(maplibreglInstance);
        }
    } catch (e) {
        console.error('[MapSetup] Failed to register contour protocol:', e);
    }
}

