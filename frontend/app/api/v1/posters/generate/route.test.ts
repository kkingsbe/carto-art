/**
 * Integration tests for the /posters/generate endpoint.
 * 
 * These tests verify that the API and renderer correctly handle various payload scenarios,
 * including incomplete configurations that might come from the sandbox or external API clients.
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mocks
jest.mock('@/lib/auth/api-middleware', () => ({
    authenticateApiRequest: jest.fn(),
}));
jest.mock('@/lib/rendering/browser', () => ({
    getBrowser: jest.fn(),
}));
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
    },
}));

import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { getBrowser } from '@/lib/rendering/browser';
import { createClient } from '@/lib/supabase/server';

describe('POST /api/v1/posters/generate', () => {
    let mockBrowser: any;
    let mockPage: any;
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Browser & Page
        mockPage = {
            setViewport: jest.fn(),
            goto: jest.fn(),
            waitForFunction: jest.fn(),
            evaluate: jest.fn(),
            on: jest.fn(),
            waitForSelector: jest.fn(),
            screenshot: jest.fn().mockResolvedValue(Buffer.from('fake-screenshot')),
        };
        mockBrowser = {
            newPage: jest.fn().mockResolvedValue(mockPage),
            close: jest.fn(),
        };
        (getBrowser as jest.Mock).mockResolvedValue(mockBrowser);

        // Mock Supabase
        mockSupabase = {
            storage: {
                from: jest.fn().mockReturnThis(),
                upload: jest.fn().mockResolvedValue({ error: null }),
                getPublicUrl: jest.fn().mockReturnValue({ data: { publicUrl: 'https://example.com/poster.png' } }),
            },
            from: jest.fn().mockReturnThis(),
            insert: jest.fn().mockResolvedValue({ error: null }),
        };
        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
    });

    // ============================================================
    // Authentication Tests
    // ============================================================
    describe('Authentication', () => {
        it('should return 401 if authentication fails', async () => {
            (authenticateApiRequest as jest.Mock).mockResolvedValue({
                success: false,
                reason: 'unauthorized',
                message: 'Invalid key',
            });

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify({}),
            });

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
            (authenticateApiRequest as jest.Mock).mockResolvedValue({
                success: true,
                context: { keyId: '123', userId: '456' },
            });
        });

        it('should return 400 if request body is empty', async () => {
            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify({}),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid request');
        });

        it('should return 400 if config is missing', async () => {
            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify({ resolution: { width: 800, height: 600 } }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid request');
            expect(body.details.fieldErrors.config).toBeDefined();
        });

        it('should return 400 if palette is missing (sandbox scenario)', async () => {
            const sandboxPayload = {
                config: {
                    location: { center: [0, 0], zoom: 10 },
                    style: { id: 'minimal' },
                    format: { orientation: 'portrait' }
                    // Missing: palette
                },
                resolution: { width: 800, height: 600 }
            };

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify(sandboxPayload),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid request');
        });

        it('should return 400 if palette.background is missing', async () => {
            const payload = {
                config: {
                    palette: { text: '#000000' }  // Missing background
                },
                resolution: { width: 800, height: 600 }
            };

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify(payload),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
        });
    });

    // ============================================================
    // Success Tests
    // ============================================================
    describe('Success', () => {
        beforeEach(() => {
            (authenticateApiRequest as jest.Mock).mockResolvedValue({
                success: true,
                context: { keyId: '123', userId: '456' },
            });
        });

        it('should generate a poster with minimal valid payload', async () => {
            const validPayload = {
                config: {
                    palette: { background: '#fff', text: '#000' }
                },
                resolution: {
                    width: 800,
                    height: 600,
                    pixelRatio: 1
                }
            };

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify(validPayload),
            });

            const res = await POST(req);
            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.status).toBe('completed');
            expect(body.download_url).toBe('https://example.com/poster.png');
        });
    });

    // ============================================================
    // Error Handling Tests
    // ============================================================
    describe('Error Handling', () => {
        beforeEach(() => {
            (authenticateApiRequest as jest.Mock).mockResolvedValue({
                success: true,
                context: { keyId: '123', userId: '456' },
            });
        });

        it('should handle rendering errors gracefully', async () => {
            (getBrowser as jest.Mock).mockRejectedValue(new Error('Browser failed'));

            const validPayload = {
                config: {
                    palette: { background: '#fff', text: '#000' }
                },
                resolution: { width: 800, height: 600 }
            };

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify(validPayload),
            });

            const res = await POST(req);
            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Rendering failed or timed out');
        });
    });
});
