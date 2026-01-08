import { fixEncoding } from '../fix-encoding';
import * as fs from 'fs';

jest.mock('fs');

export { };

describe('fix-encoding', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should fail if file not found', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(false);
        fixEncoding();
        expect(console.error).toHaveBeenCalled();
    });

    it('should read and write file', () => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readFileSync as jest.Mock).mockReturnValue('test content');
        fixEncoding();
        expect(fs.writeFileSync).toHaveBeenCalledWith(expect.stringContaining('.env'), 'test content', 'utf8');
    });
});
