import { testKey } from '../verify_key';
import https from 'https';
import EventEmitter from 'events';

jest.mock('https');

export { };

describe('verify_key', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.LOCATIONIQ_API_KEY = 'test';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should make https get request', () => {
        const mockReq = new EventEmitter();
        const mockRes = new EventEmitter();
        (mockRes as any).statusCode = 200;

        (https.get as jest.Mock).mockImplementation((url, cb) => {
            cb(mockRes);
            return mockReq;
        });

        testKey();

        mockRes.emit('data', 'test output');
        mockRes.emit('end');

        expect(https.get).toHaveBeenCalledWith(expect.stringContaining('test'), expect.any(Function));
    });
});
