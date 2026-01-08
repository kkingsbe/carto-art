import * as maplibreContour from 'maplibre-contour';
import { fileURLToPath } from 'url';

// maplibre-contour might not have types, so we use any if needed or just let inference work
// The original used import * as allExports and import defaultExport
// Default export in CJS/ESM interop can be tricky.
// We'll inspect what we get.

export async function checkExports() {
    console.log('All exports:', Object.keys(maplibreContour));
    // @ts-ignore
    console.log('Default export:', maplibreContour.default);
    return { allExports: maplibreContour, defaultExport: (maplibreContour as any).default };
}

if (typeof process !== 'undefined' && process.argv[1] === fileURLToPath(import.meta.url)) {
    checkExports();
}
