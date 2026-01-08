import { checkDb } from '../debug-db';
import { createClient } from '@supabase/supabase-js';

// Mock supabase-js
jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));

export { };

describe('debug-db', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        // Setup env
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test.com';
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should query feature_flags', async () => {
        const mockSelect = jest.fn().mockReturnValue({ data: [], error: null });
        const mockLimit = jest.fn().mockResolvedValue({ data: [], error: null });
        mockSelect.mockReturnValue({ limit: mockLimit });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });

        (createClient as jest.Mock).mockReturnValue({
            from: mockFrom
        });

        await checkDb();

        expect(createClient).toHaveBeenCalledWith('http://test.com', 'anon');
        expect(mockFrom).toHaveBeenCalledWith('feature_flags');
        expect(mockSelect).toHaveBeenCalledWith('*');
    });
});
