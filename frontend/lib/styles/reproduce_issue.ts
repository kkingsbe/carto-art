
import { applyPaletteToStyle } from './applyPalette';
import { TERRAIN_DETAIL_PRESETS } from './config';

const mockPalette = {
    background: '#ffffff',
    hillshade: '#000000',
    water: '#0000ff',
};

// Minimal base style with a terrain source
const baseStyle = {
    version: 8,
    sources: {
        terrain: {
            type: 'raster-dem',
            tiles: ['https://example.com/tiles/{z}/{x}/{y}.png'],
            tileSize: 256,
            maxzoom: 14
        }
    },
    layers: [
        { id: 'hillshade', type: 'hillshade', source: 'terrain' }
    ]
};

function testApplyPalette() {
    console.log('--- Test 1: Enable Ultra detail + Volumetric Terrain ---');
    const layers1 = {
        volumetricTerrain: true,
        terrainDetailLevel: 'ultra', // Should be 64
        hillshadeExaggeration: 0.5
    };

    const style1 = applyPaletteToStyle(baseStyle, mockPalette as any, layers1 as any);

    // Check if terrain source exists
    const terrainSourceId1 = 'terrain-ultra';
    const source1 = style1.sources[terrainSourceId1];

    if (source1) {
        console.log(`PASS: Source ${terrainSourceId1} exists.`);
        console.log(`tileSize: ${source1.tileSize} (Expected: 64)`);
    } else {
        console.error(`FAIL: Source ${terrainSourceId1} missing!`);
    }

    // Check if 3D terrain is enabled
    if (style1.terrain && style1.terrain.source === terrainSourceId1) {
        console.log('PASS: 3D terrain enabled and pointing to correct source.');
    } else {
        console.error('FAIL: 3D terrain not set correctly.');
    }

    console.log('\n--- Test 2: Iterative Application (Simulate Reuse) ---');
    // Simulate re-applying to the result of style1
    // This happens if the app accidentally passes the processed style back in
    // Change detail to 'high' (128)
    const layers2 = {
        volumetricTerrain: true,
        terrainDetailLevel: 'high',
        hillshadeExaggeration: 0.5
    };

    const style2 = applyPaletteToStyle(style1, mockPalette as any, layers2 as any);

    const terrainSourceId2 = 'terrain-high';
    const source2 = style2.sources[terrainSourceId2];

    if (source2) {
        console.log(`PASS: Source ${terrainSourceId2} exists.`);
        console.log(`tileSize: ${source2.tileSize} (Expected: 128)`);
    } else {
        console.error(`FAIL: Source ${terrainSourceId2} missing! (Likely the bug)`);
        console.log('Available sources:', Object.keys(style2.sources));
    }
}

testApplyPalette();
