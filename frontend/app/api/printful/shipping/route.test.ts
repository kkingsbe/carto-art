/**
 * Tests for Printful Shipping API
 * 
 * Tests the /api/printful/shipping endpoint.
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock modules
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

jest.mock('@/lib/printful/client', () => ({
    printful: {
        getShippingRates: jest.fn()
    }
}));

// Import mocks after jest.mock
import { createClient } from '@/lib/supabase/server';
import { printful } from '@/lib/printful/client';

// Import mock utilities
import { createMockUser } from '@/__tests__/mocks/supabase.mock';
import { mockShippingRates } from '@/__tests__/mocks/printful.mock';

describe('POST /api/printful/shipping', () => {
    let mockSupabase: any;

    const validShippingPayload = {
        address: {
            address1: '123 Test St',
            city: 'Test City',
            country_code: 'US',
            state_code: 'CA',
            zip: '90210'
        },
        items: [
            { variant_id: 12345, quantity: 1 }
        ]
    };

    beforeEach(() => {
        jest.clearAllMocks();

        mockSupabase = {
            auth: {
                getUser: jest.fn()
            }
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
        (printful.getShippingRates as jest.Mock).mockResolvedValue(mockShippingRates);
    });

    // Helper to create shipping request
    function createShippingRequest(body: any): NextRequest {
        return new NextRequest('http://localhost:3000/api/printful/shipping', {
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

            const req = createShippingRequest(validShippingPayload);
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });

        it('should proceed with authenticated user', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });

            const req = createShippingRequest(validShippingPayload);
            const res = await POST(req);

            expect(res.status).toBe(200);
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

        it('should validate address schema', async () => {
            const invalidPayload = {
                address: {
                    // Missing required fields
                    city: 'Test City'
                },
                items: [{ variant_id: 12345, quantity: 1 }]
            };

            const req = createShippingRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should validate country_code is 2 characters', async () => {
            const invalidPayload = {
                ...validShippingPayload,
                address: {
                    ...validShippingPayload.address,
                    country_code: 'USA' // Should be 2 chars
                }
            };

            const req = createShippingRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should validate items array has valid variant_id', async () => {
            const invalidPayload = {
                ...validShippingPayload,
                items: [
                    { variant_id: 'invalid', quantity: 1 } // Should be number
                ]
            };

            const req = createShippingRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should validate quantity is at least 1', async () => {
            const invalidPayload = {
                ...validShippingPayload,
                items: [
                    { variant_id: 12345, quantity: 0 }
                ]
            };

            const req = createShippingRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });
    });

    // ============================================================
    // Success Tests
    // ============================================================
    describe('Success', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser() },
                error: null
            });
        });

        it('should return shipping rates from Printful', async () => {
            const req = createShippingRequest(validShippingPayload);
            const res = await POST(req);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.rates).toEqual(mockShippingRates);
        });

        it('should call Printful with correct parameters', async () => {
            const req = createShippingRequest(validShippingPayload);
            await POST(req);

            expect(printful.getShippingRates).toHaveBeenCalledWith({
                address: validShippingPayload.address,
                items: validShippingPayload.items
            });
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

        it('should handle Printful API errors', async () => {
            (printful.getShippingRates as jest.Mock).mockRejectedValue(
                new Error('Printful API Error')
            );

            const req = createShippingRequest(validShippingPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to calculate shipping');
        });
    });
});
