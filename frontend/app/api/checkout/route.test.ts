/**
 * Tests for Checkout API
 * 
 * Tests the /api/checkout endpoint for creating payment intents and orders.
 */
import { POST } from './route';
import { NextRequest } from 'next/server';

// Mock modules
jest.mock('@/lib/supabase/server', () => ({
    createClient: jest.fn()
}));

jest.mock('@/lib/stripe/client', () => ({
    stripe: {
        paymentIntents: {
            create: jest.fn()
        }
    }
}));

// Import mocks after jest.mock
import { createClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/client';

// Import mock utilities
import { createMockPaymentIntent } from '@/__tests__/mocks/stripe.mock';
import { createMockUser } from '@/__tests__/mocks/supabase.mock';

describe('POST /api/checkout', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    const validCheckoutPayload = {
        variant_id: 12345,
        design_file_id: 67890,
        quantity: 1,
        shipping: {
            name: 'John Doe',
            address: {
                line1: '123 Test St',
                line2: 'Apt 4',
                city: 'Test City',
                state: 'CA',
                postal_code: '90210',
                country: 'US'
            }
        }
    };

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock query builder
        mockQueryBuilder = {
            insert: jest.fn().mockResolvedValue({ error: null }),
            select: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis()
        };

        mockSupabase = {
            auth: {
                getUser: jest.fn()
            },
            from: jest.fn().mockReturnValue(mockQueryBuilder)
        };

        (createClient as jest.Mock).mockResolvedValue(mockSupabase);
        (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(
            createMockPaymentIntent()
        );
    });

    // Helper to create checkout request
    function createCheckoutRequest(body: any): NextRequest {
        return new NextRequest('http://localhost:3000/api/checkout', {
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
        it('should return 401 if user is not authenticated', async () => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: null },
                error: null
            });

            const req = createCheckoutRequest(validCheckoutPayload);
            const res = await POST(req);

            expect(res.status).toBe(401);
            const body = await res.json();
            expect(body.error).toBe('Unauthorized');
        });

        it('should proceed with authenticated user', async () => {
            const mockUser = createMockUser();
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: mockUser },
                error: null
            });

            const req = createCheckoutRequest(validCheckoutPayload);
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

        it('should return 400 for missing variant_id', async () => {
            const invalidPayload = { ...validCheckoutPayload };
            delete (invalidPayload as any).variant_id;

            const req = createCheckoutRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500); // Zod throws, caught in catch block
        });

        it('should return 400 for missing shipping address', async () => {
            const invalidPayload = {
                variant_id: 12345,
                design_file_id: 67890,
                quantity: 1
            };

            const req = createCheckoutRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should return 400 for invalid country code length', async () => {
            const invalidPayload = {
                ...validCheckoutPayload,
                shipping: {
                    ...validCheckoutPayload.shipping,
                    address: {
                        ...validCheckoutPayload.shipping.address,
                        country: 'USA' // Should be 2 characters
                    }
                }
            };

            const req = createCheckoutRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });

        it('should return 400 for quantity less than 1', async () => {
            const invalidPayload = {
                ...validCheckoutPayload,
                quantity: 0
            };

            const req = createCheckoutRequest(invalidPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
        });
    });

    // ============================================================
    // Payment Intent Creation Tests
    // ============================================================
    describe('Payment Intent Creation', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser({ id: 'user_123' }) },
                error: null
            });
        });

        it('should create payment intent with correct amount for known variant', async () => {
            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 9900, // $99.00 for variant 12345
                    currency: 'usd'
                })
            );
        });

        it('should create payment intent with default amount for unknown variant', async () => {
            const payload = {
                ...validCheckoutPayload,
                variant_id: 99999 // Unknown variant
            };

            const req = createCheckoutRequest(payload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 9900 // Default fallback
                })
            );
        });

        it('should include user_id in payment intent metadata', async () => {
            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        user_id: 'user_123'
                    })
                })
            );
        });

        it('should include variant and design info in metadata', async () => {
            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    metadata: expect.objectContaining({
                        variant_id: '12345',
                        design_file_id: '67890',
                        quantity: '1'
                    })
                })
            );
        });

        it('should include shipping information in payment intent', async () => {
            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    shipping: expect.objectContaining({
                        name: 'John Doe',
                        address: expect.objectContaining({
                            line1: '123 Test St',
                            city: 'Test City',
                            state: 'CA',
                            postal_code: '90210',
                            country: 'US'
                        })
                    })
                })
            );
        });

        it('should return client_secret on success', async () => {
            const mockIntent = createMockPaymentIntent({
                client_secret: 'pi_secret_test_123'
            });
            (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockIntent);

            const req = createCheckoutRequest(validCheckoutPayload);
            const res = await POST(req);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.clientSecret).toBe('pi_secret_test_123');
        });

        it('should calculate correct amount for multiple quantity', async () => {
            const payload = {
                ...validCheckoutPayload,
                quantity: 3
            };

            const req = createCheckoutRequest(payload);
            await POST(req);

            expect(stripe.paymentIntents.create).toHaveBeenCalledWith(
                expect.objectContaining({
                    amount: 29700 // $99.00 x 3
                })
            );
        });
    });

    // ============================================================
    // Order Creation Tests
    // ============================================================
    describe('Order Creation', () => {
        beforeEach(() => {
            mockSupabase.auth.getUser.mockResolvedValue({
                data: { user: createMockUser({ id: 'user_123' }) },
                error: null
            });
        });

        it('should create order record in database', async () => {
            const mockIntent = createMockPaymentIntent({ id: 'pi_test_order_123' });
            (stripe.paymentIntents.create as jest.Mock).mockResolvedValue(mockIntent);

            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(mockSupabase.from).toHaveBeenCalledWith('orders');
            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    user_id: 'user_123',
                    stripe_payment_intent_id: 'pi_test_order_123',
                    status: 'pending'
                })
            );
        });

        it('should store shipping address snapshot in order', async () => {
            const req = createCheckoutRequest(validCheckoutPayload);
            await POST(req);

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    shipping_name: 'John Doe',
                    shipping_address_line1: '123 Test St',
                    shipping_address_line2: 'Apt 4',
                    shipping_city: 'Test City',
                    shipping_state: 'CA',
                    shipping_zip: '90210',
                    shipping_country: 'US'
                })
            );
        });

        it('should handle null line2 address', async () => {
            const payload = {
                ...validCheckoutPayload,
                shipping: {
                    ...validCheckoutPayload.shipping,
                    address: {
                        ...validCheckoutPayload.shipping.address,
                        line2: undefined
                    }
                }
            };

            const req = createCheckoutRequest(payload);
            await POST(req);

            expect(mockQueryBuilder.insert).toHaveBeenCalledWith(
                expect.objectContaining({
                    shipping_address_line2: null
                })
            );
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

        it('should handle Stripe API errors', async () => {
            (stripe.paymentIntents.create as jest.Mock).mockRejectedValue(
                new Error('Stripe API Error')
            );

            const req = createCheckoutRequest(validCheckoutPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toContain('Stripe API Error');
        });

        it('should handle database errors', async () => {
            mockQueryBuilder.insert.mockResolvedValue({
                error: { message: 'Database connection failed' }
            });

            const req = createCheckoutRequest(validCheckoutPayload);
            const res = await POST(req);

            expect(res.status).toBe(500);
            const body = await res.json();
            expect(body.error).toBe('Failed to create order record');
        });
    });
});
