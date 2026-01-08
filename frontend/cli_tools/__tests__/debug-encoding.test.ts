import { checkEncoding } from '../debug-encoding';
import * as fs from 'fs';
import * as path from 'path';

jest.mock('fs');

export { };

describe('debug-encoding', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should read .env file', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue(Buffer.from('TEST=1'));

        const result = checkEncoding();
        expect(result.size).toBe(6);
        expect(result.contentHeader).toBe('TEST=1');
    });

    it('should handle missing .env', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        const result = checkEncoding();
        expect(result).toBeUndefined();
        expect(console.error).toHaveBeenCalled();
    });
});
