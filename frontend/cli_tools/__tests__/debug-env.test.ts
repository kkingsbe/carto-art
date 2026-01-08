import { checkEnv } from '../debug-env';
import dotenv from 'dotenv';

jest.mock('dotenv');

export { };

describe('debug-env', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    it('should check env vars', () => {
        process.env.LOCATIONIQ_API_KEY = 'test_key';
        process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test';

        // Mock dotenv config
        (dotenv.config as jest.Mock).mockImplementation(() => { });

        checkEnv();

        // Verify logs via spy if critical, or just ensure no crash
        expect(dotenv.config).toHaveBeenCalled();
    });
});
