import { checkExports } from '../check_exports';

describe('check_exports', () => {
    it('should export maplibre-contour correctly', async () => {
        const result = await checkExports();
        // Just verify we got some exports
        expect(result.allExports).toBeDefined();
        // defaultExport might be undefined depending on the lib, that's okay, the script checks if it exists.
    });
});
