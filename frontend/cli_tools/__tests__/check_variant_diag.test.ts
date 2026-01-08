import { checkVariant } from '../check_variant_diag';
const https = require('https');
const EventEmitter = require('events');

jest.mock('https');

describe('check_variant_diag', () => {
    beforeEach(() => {
        process.env.PRINTFUL_API_KEY = 'test_key';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should fetch variant info', async () => {
        const mockReq = new EventEmitter();
        const mockRes = new EventEmitter();
        (mockRes as any).statusCode = 200;

        // Mock https.request to return our mockReq
        (https.request as jest.Mock).mockImplementation((options, cb) => {
            cb(mockRes);
            return mockReq;
        });
        (mockReq as any).end = jest.fn();

        const promise = checkVariant();

        // Emit data
        mockRes.emit('data', JSON.stringify({ result: 'success' }));
        mockRes.emit('end');

        const result = await promise;
        expect(result).toEqual({ result: 'success' });
    });
});
