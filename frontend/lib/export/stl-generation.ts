import sharp from 'sharp';
import { getAwsTerrariumTileUrl } from '@/lib/styles/tileUrl';

interface StlOptions {
    bounds: [number, number, number, number]; // [west, south, east, north]
    resolution?: number; // Target resolution (e.g. 512 for a 512x512 grid)
    minHeight?: number; // Base height thickness in mm (scaled relative to model)
    modelScale?: number; // Not used yet, assuming unit scale for now
}

// Math helpers
function long2tile(lon: number, zoom: number) {
    return (Math.floor((lon + 180) / 360 * Math.pow(2, zoom)));
}

function lat2tile(lat: number, zoom: number) {
    return (Math.floor((1 - Math.log(Math.tan(lat * Math.PI / 180) + 1 / Math.cos(lat * Math.PI / 180)) / Math.PI) / 2 * Math.pow(2, zoom)));
}

function tile2long(x: number, z: number) {
    return (x / Math.pow(2, z) * 360 - 180);
}

function tile2lat(y: number, z: number) {
    var n = Math.PI - 2 * Math.PI * y / Math.pow(2, z);
    return (180 / Math.PI * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n))));
}

/**
 * Generates a binary STL buffer from the given bounds
 */
export async function generateStl(options: StlOptions): Promise<Buffer> {
    const { bounds, resolution = 512, minHeight = 2.0 } = options;
    const [west, south, east, north] = bounds;

    // 1. Calculate appropriate zoom level to satisfy resolution
    // We want the total pixel width of the covered area to be at least 'resolution'
    // Width in degrees = east - west
    // World width in degrees = 360
    // Fraction of world = (east - west) / 360
    // Total pixels at zoom Z = 256 * 2^Z
    // We need Fraction * 256 * 2^Z >= resolution
    let zoom = 0;
    for (let z = 0; z <= 15; z++) { // Cap at 15 for Terrarium
        const totalPixels = 256 * Math.pow(2, z);
        const coveredPixels = totalPixels * ((east - west) / 360);
        if (coveredPixels >= resolution) {
            zoom = z;
            break;
        }
        zoom = z;
    }

    // 2. Identify tiles
    const xMin = long2tile(west, zoom);
    const xMax = long2tile(east, zoom);
    const yMin = lat2tile(north, zoom);
    const yMax = lat2tile(south, zoom);

    const tilesX = xMax - xMin + 1;
    const tilesY = yMax - yMin + 1;

    // Guard against excessive resource usage
    if (tilesX * tilesY > 20) {
        throw new Error(`Area too large for this resolution (requires ${tilesX * tilesY} tiles). Try a smaller area or lower resolution.`);
    }

    // 3. Fetch composite image
    const canvasWidth = tilesX * 256;
    const canvasHeight = tilesY * 256;
    const compositeList: { input: Buffer; top: number; left: number }[] = [];

    const tilePromises = [];
    const urlTemplate = getAwsTerrariumTileUrl();

    for (let x = xMin; x <= xMax; x++) {
        for (let y = yMin; y <= yMax; y++) {
            const fetchTile = async (tx: number, ty: number) => {
                const url = urlTemplate
                    .replace('{z}', zoom.toString())
                    .replace('{x}', tx.toString())
                    .replace('{y}', ty.toString());

                try {
                    const res = await fetch(url);
                    if (!res.ok) throw new Error(`Failed to fetch tile ${url}`);
                    const buffer = Buffer.from(await res.arrayBuffer());
                    compositeList.push({
                        input: buffer,
                        top: (ty - yMin) * 256,
                        left: (tx - xMin) * 256
                    });
                } catch (e) {
                    console.error('Tile fetch error:', e);
                    // Create a flat zero tile to prevent crash
                    const zeroTile = await sharp({
                        create: { width: 256, height: 256, channels: 3, background: { r: 0, g: 0, b: 0 } }
                    }).png().toBuffer();
                    compositeList.push({
                        input: zeroTile,
                        top: (ty - yMin) * 256,
                        left: (tx - xMin) * 256
                    });
                }
            };
            tilePromises.push(fetchTile(x, y));
        }
    }

    await Promise.all(tilePromises);

    // Composite using sharp
    const compositeImage = await sharp({
        create: {
            width: canvasWidth,
            height: canvasHeight,
            channels: 3,
            background: { r: 0, g: 0, b: 0 }
        }
    })
        .composite(compositeList)
        .raw()
        .toBuffer({ resolveWithObject: true });

    const { data: pixels, info } = compositeImage;
    const { width, height, channels } = info;

    // 4. Sample and Mesh
    // Helper to project Lat/Lon to Pixel coordinates relative to the canvas origin
    const tileBoundsWest = tile2long(xMin, zoom);
    const tileBoundsEast = tile2long(xMax + 1, zoom);

    // Web Mercator project helper (returns pixels relative to the fetched canvas)
    const project = (lng: number, lat: number) => {
        // X is linear with longitude
        const x = (lng - tileBoundsWest) / (tileBoundsEast - tileBoundsWest) * canvasWidth;

        // Y is standard Web Mercator
        const latRad = lat * Math.PI / 180;
        const n = Math.pow(2, zoom);
        const yTile = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

        const y = (yTile - yMin) * 256;
        return { x, y };
    };

    // Calculate aspect ratio using Projected coordinates (Mercator) for the exact bounds
    const pNW = project(west, north);
    const pSE = project(east, south);
    const projectedWidth = pSE.x - pNW.x;
    const projectedHeight = pSE.y - pNW.y;
    // Protect against zero division or negative (shouldn't happen with valid bounds)
    const aspectRatio = Math.abs(projectedHeight / projectedWidth) || 1;

    const meshWidth = resolution;
    const meshHeight = Math.round(resolution * aspectRatio);

    const vertices: Float32Array = new Float32Array(meshWidth * meshHeight * 3);

    // Find min/max elevation to normalize or set base
    let minElev = Infinity;

    for (let iy = 0; iy < meshHeight; iy++) {
        for (let ix = 0; ix < meshWidth; ix++) {
            // Percentages (0 to 1)
            const pctX = ix / (meshWidth - 1);
            const pctY = iy / (meshHeight - 1);

            // Lat/Lon
            const lng = west + pctX * (east - west);
            const lat = north + pctY * (south - north);

            // Get pixel coordinates
            const p = project(lng, lat);

            // Bilinear sample from 'pixels'
            const px = Math.max(0, Math.min(width - 1.001, p.x));
            const py = Math.max(0, Math.min(height - 1.001, p.y));

            const x1 = Math.floor(px);
            const x2 = x1 + 1;
            const y1 = Math.floor(py);
            const y2 = y1 + 1;

            const wx = px - x1;
            const wy = py - y1;

            // Manual inline decode to avoid function call overhead in tight loop
            const idx1 = (y1 * width + x1) * channels;
            const idx2 = (y1 * width + x2) * channels;
            const idx3 = (y2 * width + x1) * channels;
            const idx4 = (y2 * width + x2) * channels;

            const decode = (idx: number) => (pixels[idx] * 256 + pixels[idx + 1] + pixels[idx + 2] / 256) - 32768;

            const h1 = decode(idx1);
            const h2 = decode(idx2);
            const h3 = decode(idx3);
            const h4 = decode(idx4);

            const hTop = h1 * (1 - wx) + h2 * wx;
            const hBot = h3 * (1 - wx) + h4 * wx;
            const h = hTop * (1 - wy) + hBot * wy;

            const vIdx = (iy * meshWidth + ix) * 3;
            // X: 0 to 100
            vertices[vIdx] = pctX * 100;
            // Y: Aspect * 100 (Inverted so North is +Y or 'Up' on the plate)
            // Note: We use the calculated Mercator aspect ratio here
            vertices[vIdx + 1] = (1 - pctY) * 100 * aspectRatio;
            // Z: Raw height for now
            vertices[vIdx + 2] = h;

            if (h < minElev) minElev = h;
        }
    }

    // Apply scale to Z
    // Calculate real world width in meters
    const centerLat = (north + south) / 2;
    const metersPerDegree = 111320 * Math.cos(centerLat * Math.PI / 180);
    const widthMeters = (east - west) * metersPerDegree;
    const scaleFactor = 100 / widthMeters;

    for (let i = 0; i < vertices.length; i += 3) {
        let z = vertices[i + 2];
        z = (z - minElev); // Zero-based
        z = z * scaleFactor * 1000; // Meters to mm scale
        z = z * 1.5; // Exaggeration
        vertices[i + 2] = z + minHeight; // Add base thickness
    }

    // 5. Generate Binary STL Directly
    // Calculate size
    const numQuads = (meshWidth - 1) * (meshHeight - 1);
    const topTriangles = numQuads * 2;
    const bottomTriangles = 2; // Simple flat base
    const wallTriangles = 4 * (meshWidth + meshHeight - 2); // 2 triangles per segment, 4 sides
    const totalTriangles = topTriangles + bottomTriangles + wallTriangles;

    const bufferSize = 80 + 4 + (totalTriangles * 50);
    const buffer = Buffer.alloc(bufferSize);

    // Header
    buffer.write('Carto Art Plus 3D Export', 0);
    // Count
    buffer.writeUInt32LE(totalTriangles, 80);

    let offset = 84;

    // Helper to write a triangle
    const writeTriangle = (
        v1x: number, v1y: number, v1z: number,
        v2x: number, v2y: number, v2z: number,
        v3x: number, v3y: number, v3z: number
    ) => {
        // Calculate normal
        const ux = v2x - v1x;
        const uy = v2y - v1y;
        const uz = v2z - v1z;
        const vx = v3x - v1x;
        const vy = v3y - v1y;
        const vz = v3z - v1z;

        const nx = uy * vz - uz * vy;
        const ny = uz * vx - ux * vz;
        const nz = ux * vy - uy * vx;

        const len = Math.sqrt(nx * nx + ny * ny + nz * nz) || 1.0;

        buffer.writeFloatLE(nx / len, offset);
        buffer.writeFloatLE(ny / len, offset + 4);
        buffer.writeFloatLE(nz / len, offset + 8);

        buffer.writeFloatLE(v1x, offset + 12);
        buffer.writeFloatLE(v1y, offset + 16);
        buffer.writeFloatLE(v1z, offset + 20);

        buffer.writeFloatLE(v2x, offset + 24);
        buffer.writeFloatLE(v2y, offset + 28);
        buffer.writeFloatLE(v2z, offset + 32);

        buffer.writeFloatLE(v3x, offset + 36);
        buffer.writeFloatLE(v3y, offset + 40);
        buffer.writeFloatLE(v3z, offset + 44);

        buffer.writeUInt16LE(0, offset + 48); // Attribute
        offset += 50;
    };

    // Helper to get vertex coords
    const getV = (ix: number, iy: number) => {
        const idx = (iy * meshWidth + ix) * 3;
        return { x: vertices[idx], y: vertices[idx + 1], z: vertices[idx + 2] };
    };

    // --- Write Top Surface ---
    for (let iy = 0; iy < meshHeight - 1; iy++) {
        for (let ix = 0; ix < meshWidth - 1; ix++) {
            const p1 = getV(ix, iy);
            const p2 = getV(ix + 1, iy);
            const p3 = getV(ix + 1, iy + 1);
            const p4 = getV(ix, iy + 1);

            // Tri 1: p1-p2-p4
            writeTriangle(p1.x, p1.y, p1.z, p2.x, p2.y, p2.z, p4.x, p4.y, p4.z);
            // Tri 2: p2-p3-p4
            writeTriangle(p2.x, p2.y, p2.z, p3.x, p3.y, p3.z, p4.x, p4.y, p4.z);
        }
    }

    // --- Write Base (Z=0) ---
    const b1 = { x: 0, y: vertices[1], z: 0 }; // TL (approx)
    const b2 = { x: 100, y: vertices[1], z: 0 }; // TR
    const b3 = { x: 100, y: vertices[(meshHeight * meshWidth - 1) * 3 + 1], z: 0 }; // BR
    const b4 = { x: 0, y: vertices[(meshHeight * meshWidth - 1) * 3 + 1], z: 0 }; // BL

    // Tri 1: b1-b4-b2 (Facing down)
    writeTriangle(b1.x, b1.y, b1.z, b4.x, b4.y, b4.z, b2.x, b2.y, b2.z);
    // Tri 2: b2-b4-b3
    writeTriangle(b2.x, b2.y, b2.z, b4.x, b4.y, b4.z, b3.x, b3.y, b3.z);

    // --- Write Sides ---

    // North Side (iy=0)
    for (let ix = 0; ix < meshWidth - 1; ix++) {
        const top1 = getV(ix, 0);
        const top2 = getV(ix + 1, 0);
        const bot1 = { x: top1.x, y: top1.y, z: 0 };
        const bot2 = { x: top2.x, y: top2.y, z: 0 };

        // T1-T2-B1
        writeTriangle(top1.x, top1.y, top1.z, top2.x, top2.y, top2.z, bot1.x, bot1.y, bot1.z);
        // B1-T2-B2
        writeTriangle(bot1.x, bot1.y, bot1.z, top2.x, top2.y, top2.z, bot2.x, bot2.y, bot2.z);
    }

    // South Side (iy=Max)
    const maxY = meshHeight - 1;
    for (let ix = 0; ix < meshWidth - 1; ix++) {
        const top1 = getV(ix, maxY);
        const top2 = getV(ix + 1, maxY);
        const bot1 = { x: top1.x, y: top1.y, z: 0 };
        const bot2 = { x: top2.x, y: top2.y, z: 0 };

        // T1-B1-T2
        writeTriangle(top1.x, top1.y, top1.z, bot1.x, bot1.y, bot1.z, top2.x, top2.y, top2.z);
        // B1-B2-T2
        writeTriangle(bot1.x, bot1.y, bot1.z, bot2.x, bot2.y, bot2.z, top2.x, top2.y, top2.z);
    }

    // West Side (ix=0)
    for (let iy = 0; iy < meshHeight - 1; iy++) {
        const top1 = getV(0, iy);
        const top2 = getV(0, iy + 1);
        const bot1 = { x: top1.x, y: top1.y, z: 0 };
        const bot2 = { x: top2.x, y: top2.y, z: 0 };

        // T1-B1-T2
        writeTriangle(top1.x, top1.y, top1.z, bot1.x, bot1.y, bot1.z, top2.x, top2.y, top2.z);
        // B1-B2-T2
        writeTriangle(bot1.x, bot1.y, bot1.z, bot2.x, bot2.y, bot2.z, top2.x, top2.y, top2.z);
    }

    // East Side (ix=Max)
    const maxX = meshWidth - 1;
    for (let iy = 0; iy < meshHeight - 1; iy++) {
        const top1 = getV(maxX, iy);
        const top2 = getV(maxX, iy + 1);
        const bot1 = { x: top1.x, y: top1.y, z: 0 };
        const bot2 = { x: top2.x, y: top2.y, z: 0 };

        // T1-T2-B1
        writeTriangle(top1.x, top1.y, top1.z, top2.x, top2.y, top2.z, bot1.x, bot1.y, bot1.z);
        // B1-B2-T2 (Actually B1-T2-B2?)
        // Previous logic: T1-T2-B1 and B1-B2-T2?
        // Let's re-verify normal.
        // Facing +X. 
        // top1(HighY), top2(LowY). Vector 1->2 is -Y.
        // T1-T2-B1: (-Y)x(-Z) = +X. Correct.
        // B1-T2-B2: (bot1, top2, bot2). (B1-B2 is -Y, B1-T2 is +Z + -Y).
        // Let's use B1-T2-B2. (T2-B1)x(B2-B1).
        // T2-B1 = (+Z, -Y). B2-B1 = (-Y).
        // (+Z -Y) x (-Y) = (+Z x -Y) - (-Y x -Y).
        // +Z x -Y = -(-Y x +Z) = -( -X) = +X. Correct.
        writeTriangle(bot1.x, bot1.y, bot1.z, top2.x, top2.y, top2.z, bot2.x, bot2.y, bot2.z);
    }

    return buffer;
}
