import { applyPaletteToStyle } from './applyPalette';
import { ColorPalette } from '@/types/poster';

// Mock dependencies
jest.mock('@/lib/styles/tileUrl', () => ({
    getContourTileJsonUrl: jest.fn().mockReturnValue('https://example.com/contours.json'),
}));

jest.mock('@/lib/logger', () => ({
    logger: {
        debug: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
    },
}));

describe('applyPaletteToStyle', () => {
    const mockPalette: ColorPalette = {
        id: 'test-palette',
        name: 'Test Palette',
        style: 'minimal',
        background: '#ffffff',
        text: '#000000',
        border: '#000000',
        roads: {
            motorway: '#ff0000',
            trunk: '#cc0000',
            primary: '#aa0000',
            secondary: '#880000',
            tertiary: '#660000',
            residential: '#440000',
            service: '#220000',
        },
        water: '#0000ff',
        waterLine: '#0000aa',
        greenSpace: '#00ff00',
        landuse: '#e0e0e0',
        buildings: '#cccccc',
    };

    const mockStyle = {
        version: 8,
        sources: {
            openmaptiles: { type: 'vector', url: 'https://example.com/tiles.json' },
            contours: { type: 'vector', url: '' }, // Should be filled by handleContourSource
        },
        layers: [
            { id: 'background', type: 'background', paint: {} },
            { id: 'water', type: 'fill', source: 'openmaptiles', 'source-layer': 'water', paint: {} },
            { id: 'road-primary', type: 'line', source: 'openmaptiles', 'source-layer': 'transportation', paint: {} },
        ],
    };

    it('should apply background color', () => {
        const result = applyPaletteToStyle(mockStyle, mockPalette);
        const bgLayer = result.layers.find((l: any) => l.id === 'background');
        expect(bgLayer.paint['background-color']).toBe('#ffffff');
    });

    it('should apply water color', () => {
        const result = applyPaletteToStyle(mockStyle, mockPalette);
        const waterLayer = result.layers.find((l: any) => l.id === 'water');
        expect(waterLayer.paint['fill-color']).toBe('#0000ff');
    });

    it('should handle visibility toggles', () => {
        const layersConfig = {
            water: false,
            streets: true,
        };
        const layerToggles = [
            { id: 'water', name: 'Water', layerIds: ['water'] },
            { id: 'streets', name: 'Streets', layerIds: ['road-primary'] },
        ];

        const result = applyPaletteToStyle(mockStyle, mockPalette, layersConfig as any, layerToggles as any);

        const waterLayer = result.layers.find((l: any) => l.id === 'water');
        const roadLayer = result.layers.find((l: any) => l.id === 'road-primary');

        expect(waterLayer.layout.visibility).toBe('none');
        expect(roadLayer.layout.visibility).toBe('visible');
    });

    it('should apply road weight multiplier', () => {
        const layersConfig = {
            roadWeight: 2.0,
            labels: false,
        };

        const roadStyle = {
            ...mockStyle,
            layers: [
                { id: 'background', type: 'background', paint: {} },
                {
                    id: 'road-primary-scaling',
                    type: 'line',
                    paint: { 'line-width': 1 }
                }
            ]
        };

        const result = applyPaletteToStyle(roadStyle, mockPalette, layersConfig as any);
        const roadLayer = result.layers.find((l: any) => l.id === 'road-primary-scaling');

        // factor = 2.0 * 1.0 = 2.0. Base width 1 * 2.0 = 2.0
        expect(roadLayer.paint['line-width']).toBe(2);
    });

    it('should fill missing contour source URL', () => {
        const result = applyPaletteToStyle(mockStyle, mockPalette);
        expect(result.sources.contours.url).toBe('https://example.com/contours.json');
    });
});
