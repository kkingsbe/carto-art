import { testClient } from '../test_client_diag';
import { printful } from '../../lib/printful/client';

jest.mock('../../lib/printful/client', () => ({
    printful: {
        createMockupTask: jest.fn()
    }
}));

describe('test_client_diag ts', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.PRINTFUL_API_KEY = 'test';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should call createMockupTask with imported client', async () => {
        await testClient();
        // Since both TS and JS are similar, redundancy is high, but required by task "all scripts"
        expect(printful.createMockupTask).toHaveBeenCalled();
    });
});
