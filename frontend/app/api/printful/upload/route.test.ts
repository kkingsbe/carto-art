/**
 * Tests for Printful Upload API
 * 
 * Tests the /api/printful/upload endpoint.
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Store original fetch and env
const originalFetch = global.fetch;
const originalEnv = process.env;

// Mock modules
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

// Import mocks after jest.mock
import { createClient } from '@/lib/supabase/server';

// Import mock utilities
import { createMockUser } from '@/__tests__/mocks/supabase.mock';
import { createMockPrintfulFile, createMockFileApiResponse } from '@/__tests__/mocks/printful.mock';

describe('POST /api/printful/upload', () => {
    let mockSupabase: any;

    const validUploadPayload = {
        url: 'https://storage.example.com/designs/poster.png'
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup env
        process.env = {
            ...originalEnv,
            PRINTFUL_API_KEY: 'test_api_key'
        };

        // Mock fetch
        global.fetch = jest.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(createMockFileApiResponse())
        });

        mockSupabase = {
            auth: {
                getUser: jest.fn()
            }
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    afterEach(() => {
        global.fetch = originalFetch;
        process.env = originalEnv;
    });

    // Helper to create upload request
    function createUploadRequest(body: any): NextRequest {
        return new NextRequest('http://localhost:3000/api/printful/upload', {
            method: 'POST',
            body: JSON.stringify(body),
            headers: {
                'Content-Type': 'application/json'
            }
        });
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

            const req = createUploadRequest(validUploadPayload);
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
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

        it('should validate URL schema', async () => {
            const invalidPayload = {
                url: 'not-a-valid-url'
            };

            const req = createUploadRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should require url field', async () => {
            const invalidPayload = {};

            const req = createUploadRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });
    });

    // ============================================================
    // Configuration Tests
    // ============================================================
    describe('Configuration', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });
        });

        it('should handle missing API key', async () => {
            // Remove API key
            const originalKey = process.env.PRINTFUL_API_KEY;
            delete process.env.PRINTFUL_API_KEY;

            try {
                const req = createUploadRequest(validUploadPayload);
                const res = await POST(req);

                expect(res.status).toBe(500);
            } finally {
                // Restore logic is handled by afterEach, but good practice here too
                process.env.PRINTFUL_API_KEY = originalKey;
            }
        });
    });

    // ============================================================
    // Success Tests
    // ============================================================
    describe('Success', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser({ id: 'user_123' }) },
                error: null
            });
        });

        it('should return file ID from Printful', async () => {
            const mockFile = createMockPrintfulFile({ id: 999888 });
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ result: mockFile })
            });

            const req = createUploadRequest(validUploadPayload);
            const res = await POST(req);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.id).toBe(999888);
        });

        it('should return preview URL from Printful', async () => {
            const mockFile = createMockPrintfulFile({
                id: 999888,
                preview_url: 'https://printful.com/preview/999888.png'
            });
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ result: mockFile })
            });

            const req = createUploadRequest(validUploadPayload);
            const res = await POST(req);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.preview_url).toBe('https://printful.com/preview/999888.png');
        });

        it('should call Printful files API with correct payload', async () => {
            const req = createUploadRequest(validUploadPayload);
            await POST(req);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.printful.com/files',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer test_api_key',
                        'Content-Type': 'application/json'
                    })
                })
            );

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.role).toBe('printfile');
            expect(body.url).toBe(validUploadPayload.url);
            expect(body.filename).toContain('user-user_123');
        });
    });

    // ============================================================
    // Error Handling Tests
    // ============================================================
    describe('Error Handling', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });
        });

        it('should handle Printful upload failures', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                status: 400,
                json: () => Promise.resolve({ result: 'Invalid file URL' })
            });

            const req = createUploadRequest(validUploadPayload);
            const res = await POST(req);

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid file URL');
        });

        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            const req = createUploadRequest(validUploadPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Internal Server Error');
        });
    });
});
