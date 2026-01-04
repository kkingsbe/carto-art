/**
 * Tests for E-commerce Server Actions
 * 
 * Tests the uploadDesignFile server action.
 */

// Mock modules before imports
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

// Import after mocking
import { uploadDesignFile } from './ecommerce';
import { createClient } from '@/lib/supabase/server';

// Import mock utilities
import { createMockUser, createMockStorage } from '@/__tests__/mocks/supabase.mock';

describe('uploadDesignFile', () => {
    let mockSupabase: any;
    let mockStorage: ReturnType<typeof createMockStorage>;

    beforeEach(() => {
        jest.clearAllMocks();

        mockStorage = createMockStorage();

        mockSupabase = {
            auth: {
                getUser: jest.fn()
            },
            storage: mockStorage
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    // Helper to create FormData with file
    function createFormDataWithFile(
        content: string = 'fake image data',
        filename: string = 'test.png',
        type: string = 'image/png'
    ): FormData {
        const formData = new FormData();
        const blob = new Blob([content], { type });
        const file = new File([blob], filename, { type });
        formData.append('file', file);
        return formData;
    }

    // ============================================================
    // Authentication Tests
    // ============================================================
    describe('Authentication', () => {
        it('should require authentication', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null
            });

            const formData = createFormDataWithFile();

            await expect(uploadDesignFile(formData)).rejects.toThrow('Unauthorized');
        });

        it('should proceed with authenticated user', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });

            const formData = createFormDataWithFile();
            const result = await uploadDesignFile(formData);

            expect(result.signedUrl).toBeDefined();
        });
    });

    // ============================================================
    // Validation Tests
    // ============================================================
    describe('Validation', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });
        });

        it('should validate file presence', async () => {
            const formData = new FormData();
            // No file attached

            await expect(uploadDesignFile(formData)).rejects.toThrow('No valid file provided');
        });

        it('should reject non-file data', async () => {
            const formData = new FormData();
            formData.append('file', 'not a file');

            await expect(uploadDesignFile(formData)).rejects.toThrow('No valid file provided');
        });

        it('should enforce file size limit (50MB)', async () => {
            // Create a file larger than 50MB
            const largeContent = 'x'.repeat(51 * 1024 * 1024);
            const formData = createFormDataWithFile(largeContent);

            await expect(uploadDesignFile(formData)).rejects.toThrow('File too large');
        });

        it('should accept files under size limit', async () => {
            // Create a file under 50MB
            const smallContent = 'x'.repeat(1024); // 1KB
            const formData = createFormDataWithFile(smallContent);

            const result = await uploadDesignFile(formData);
            expect(result.signedUrl).toBeDefined();
        });
    });

    // ============================================================
    // Storage Upload Tests
    // ============================================================
    describe('Storage Upload', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser({ id: 'user_test_123' }) },
                error: null
            });
        });

        it('should upload to Supabase storage', async () => {
            const formData = createFormDataWithFile();
            await uploadDesignFile(formData);

            expect(mockStorage.from).toHaveBeenCalledWith('print-files');
            expect(mockStorage.from('print-files').upload).toHaveBeenCalled();
        });

        it('should use user ID in file path', async () => {
            const formData = createFormDataWithFile();
            await uploadDesignFile(formData);

            const uploadCall = mockStorage.from('print-files').upload.mock.calls[0];
            const fileName = uploadCall[0];

            expect(fileName).toContain('user_test_123/');
        });

        it('should set correct content type', async () => {
            const formData = createFormDataWithFile('data', 'test.png', 'image/png');
            await uploadDesignFile(formData);

            const uploadCall = mockStorage.from('print-files').upload.mock.calls[0];
            const options = uploadCall[2];

            expect(options.contentType).toBe('image/png');
        });

        it('should handle upload errors', async () => {
            mockStorage.from('print-files').upload.mockResolvedValue({
                error: { message: 'Storage quota exceeded' },
                data: null
            });

            const formData = createFormDataWithFile();

            await expect(uploadDesignFile(formData)).rejects.toThrow('Failed to upload file');
        });
    });

    // ============================================================
    // Signed URL Tests
    // ============================================================
    describe('Signed URL Generation', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });
        });

        it('should return signed URL', async () => {
            mockStorage.from('print-files').createSignedUrl.mockResolvedValue({
                data: { signedUrl: 'https://storage.example.com/signed/file.png?token=abc123' },
                error: null
            });

            const formData = createFormDataWithFile();
            const result = await uploadDesignFile(formData);

            expect(result.signedUrl).toBe('https://storage.example.com/signed/file.png?token=abc123');
        });

        it('should request 1 hour validity for signed URL', async () => {
            const formData = createFormDataWithFile();
            await uploadDesignFile(formData);

            const signedUrlCall = mockStorage.from('print-files').createSignedUrl.mock.calls[0];
            const expiresIn = signedUrlCall[1];

            expect(expiresIn).toBe(3600); // 1 hour in seconds
        });

        it('should handle signed URL generation errors', async () => {
            mockStorage.from('print-files').createSignedUrl.mockResolvedValue({
                data: null,
                error: { message: 'Failed to sign URL' }
            });

            const formData = createFormDataWithFile();

            await expect(uploadDesignFile(formData)).rejects.toThrow('Failed to generate secure link');
        });
    });
});
