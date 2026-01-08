import { listVariants } from '../list_variants_diag';
import { createClient } from '@supabase/supabase-js';

jest.mock('@supabase/supabase-js', () => ({
    createClient: jest.fn()
}));

export { };

describe('list_variants_diag', () => {
    beforeEach(() => {
        jest.resetAllMocks();
        process.env.NEXT_PUBLIC_SUPABASE_URL = 'http://test';
        process.env.SUPABASE_SERVICE_ROLE_KEY = 'key';
        jest.spyOn(console, 'log').mockImplementation(() => { });
    });

    it('should ilike search variants', async () => {
        const mockIlike = jest.fn().mockResolvedValue({ data: [], error: null });
        const mockSelect = jest.fn().mockReturnValue({ ilike: mockIlike });
        const mockFrom = jest.fn().mockReturnValue({ select: mockSelect });
        (createClient as jest.Mock).mockReturnValue({ from: mockFrom });

        await listVariants();

        expect(mockIlike).toHaveBeenCalledWith('name', '%12%36%');
    });
});
