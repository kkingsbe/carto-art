
import { detectPrintArea } from './printful';
import sharp from 'sharp';

// Mock global fetch
global.fetch = jest.fn();

describe('detectPrintArea', () => {
    it('should correctly detect a magenta rectangle in a square image', async () => {
        const width = 100;
        const height = 100;

        // Create a 100x100 image with a magenta rectangle at 10,10 size 50x50
        const image = await sharp({
            create: {
                width,
                height,
                channels: 3,
                background: { r: 0, g: 0, b: 0 }
            }
        })
            .composite([{
                input: await sharp({
                    create: {
                        width: 50,
                        height: 50,
                        channels: 3,
                        background: { r: 255, g: 0, b: 255 } // Magenta
                    }
                }).png().toBuffer(),
                top: 10,
                left: 10
            }])
            .png()
            .toBuffer();

        (global.fetch as jest.Mock).mockResolvedValue({
            arrayBuffer: async () => image
        });

        const result = await detectPrintArea('http://example.com/mockup.png');

        expect(result.x).toBeCloseTo(0.1, 1);
        expect(result.y).toBeCloseTo(0.1, 1);
        expect(result.width).toBeCloseTo(0.5, 1);
        expect(result.height).toBeCloseTo(0.5, 1);
    });
});
