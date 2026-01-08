import { inspectVariants } from '../inspect-product-variants';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));

// Add export to make it a module
export { };

describe('inspect-product-variants', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';
        jest.spyOn(console, 'log').mockImplementation(() => { });
        jest.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('should query product_variants', async () => {
        const mockSelect = jest.fn().mockReturnValue({ limit: jest.fn().mockResolvedValue({ data: [], error: null }) });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (createClient as jest.Mock).mockReturnValue({ from: mockFrom });

        await inspectVariants();

        expect(mockFrom).toHaveBeenCalledWith('product_variants');
    });
});
