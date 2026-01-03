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
    createServiceRoleClient: jest.fn(),
    createAnonymousClient: jest.fn(),
}));
jest.mock('@/lib/logger', () => ({
    logger: {
        error: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
    },
}));
jest.mock('@/lib/events', () => ({
    trackEvent: jest.fn().mockResolvedValue(undefined),
}));
jest.mock('@/lib/styles', () => ({
    getStyleById: jest.fn(),
    getDefaultStyle: jest.fn(),
}));

import { authenticateApiRequest } from '@/lib/auth/api-middleware';
import { getBrowser } from '@/lib/rendering/browser';
import { createClient, createServiceRoleClient } from '@/lib/supabase/server';
import { getStyleById, getDefaultStyle } from '@/lib/styles';

describe('POST /api/v1/posters/generate', () => {
    let mockBrowser: any;
    let mockPage: any;
    let mockSupabase: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Mock Browser & Page
        mockPage = {
            setViewport: jest.fn().mockResolvedValue(undefined),
            goto: jest.fn().mockResolvedValue(undefined),
            waitForFunction: jest.fn().mockResolvedValue(undefined),
            evaluate: jest.fn().mockResolvedValue('ZmFrZS1zY3JlZW5zaG90'), // 'fake-screenshot' in base64
            on: jest.fn(),
            waitForSelector: jest.fn((selector) => {
                if (selector === '#render-complete') return Promise.resolve({});
                return new Promise(() => { }); // Never resolve others in the test
            }),
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
        (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);

        // Mock Style
        (getDefaultStyle as jest.Mock).mockReturnValue({
            id: 'minimal',
            name: 'Minimal',
            defaultPalette: { background: '#fff', text: '#000' },
            recommendedFonts: ['Inter']
        });
        (getStyleById as jest.Mock).mockReturnValue(null);
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

        it('should return 400 if location is missing', async () => {
            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify({ style: 'minimal' }),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid request');
            expect(body.details.fieldErrors.location).toBeDefined();
        });

        it('should return 400 if lat/lng are missing', async () => {
            const invalidPayload = {
                location: {} // Missing lat, lng
            };

            const req = new NextRequest('http://localhost:3000/api/v1/posters/generate', {
                method: 'POST',
                body: JSON.stringify(invalidPayload),
            });

            const res = await POST(req);
            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Invalid request');
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
                location: {
                    lat: 48.8566,
                    lng: 2.3522
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
                location: {
                    lat: 0,
                    lng: 0
                }
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
