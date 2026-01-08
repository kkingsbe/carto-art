import { testMockup } from '../test-mockup';
import { createClient } from '@supabase/supabase-js';
import { printful } from '../../lib/printful/client';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));
jest.mock('../../lib/printful/client', () => ({
    printful: {
        createMockupTask: jest.fn()
    }
}));

describe('test-mockup', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should fetch variant and create task', async () => {
        const mockSelect = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: [{ id: 123, name: 'Test Variant' }], error: null }) });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (createClient as jest.Mock).mockReturnValue({ from: mockFrom });

        await testMockup();

        expect(mockFrom).toHaveBeenCalledWith('product_variants');
        expect(printful.createMockupTask).toHaveBeenCalled();
    });
});
