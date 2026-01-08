import { debugLatency } from '../debug_latency';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));

describe('debug_latency', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should query api_usage', async () => {
        const mockOrder = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockNot = jest.fn().mockReturnValue({ order: mockOrder });
        const mockGte = jest.fn().mockReturnValue({ not: mockNot });
        const mockSelect = jest.fn().mockReturnValue({ gte: mockGte });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        (createClient as jest.Mock).mockReturnValue({ from: mockFrom });

        await debugLatency();

        expect(mockFrom).toHaveBeenCalledWith('api_usage');
    });
});
