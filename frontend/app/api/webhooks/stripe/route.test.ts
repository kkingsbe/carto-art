/**
 * Tests for Stripe Webhook Handler
 * 
 * Tests the /api/webhooks/stripe endpoint for handling payment events.
 */
import { NextRequest } from 'next/server';
import Stripe from 'stripe';

// Mock next/headers before importing the route
jest.mock('next/headers', () => ({
    headers: jest.fn(() => Promise.resolve({
        get: jest.fn((name: string) => {
            if (name === 'stripe-signature') {
                return 'test_signature_123';
            }
            return null;
        })
    }))
}));

// Mock modules
jest.mock('@/lib/stripe/client', () => ({
    stripe: {
        webhooks: {
            constructEvent: jest.fn()
        }
    }
}));

jest.mock('@/lib/printful/client', () => ({
    printful: {
        createOrder: jest.fn()
    }
}));

jest.mock('@/lib/supabase/server', () => ({
    createServiceRoleClient: jest.fn()
}));

// Import route AFTER mocking
import { POST } from './route';

// Import mocks after jest.mock
import { stripe } from '@/lib/stripe/client';
import { printful } from '@/lib/printful/client';
import { createServiceRoleClient } from '@/lib/supabase/server';

// Import fixtures and mock utilities
import {
    paymentIntentSucceededEvent,
    paymentIntentFailedEvent
} from '@/__tests__/fixtures/stripe-events';
import { createMockOrder } from '@/__tests__/mocks/supabase.mock';
import { createMockPrintfulOrder } from '@/__tests__/mocks/printful.mock';

describe('POST /api/webhooks/stripe', () => {
    let mockSupabase: any;
    let mockQueryBuilder: any;

    beforeEach(() => {
        jest.clearAllMocks();

        // Setup mock query builder
        mockQueryBuilder = {
            select: jest.fn().mockReturnThis(),
            insert: jest.fn().mockReturnThis(),
            update: jest.fn().mockReturnThis(),
            eq: jest.fn().mockReturnThis(),
            single: jest.fn()
        };

        mockSupabase = {
            from: jest.fn().mockReturnValue(mockQueryBuilder)
        };

        (createServiceRoleClient as jest.Mock).mockReturnValue(mockSupabase);
    });

    // Helper to create webhook request
    function createWebhookRequest(event: Stripe.Event): NextRequest {
        return new NextRequest('http://localhost:3000/api/webhooks/stripe', {
            method: 'POST',
            body: JSON.stringify(event),
            headers: {
                'stripe-signature': 'test_signature_123'
            }
        });
    }

    // ============================================================
    // Webhook Signature Verification Tests
    // ============================================================
    describe('Webhook Signature Verification', () => {
        it('should reject requests with invalid signature', async () => {
            (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
                throw new Error('Invalid signature');
            });

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            const res = await POST(req);

            expect(res.status).toBe(400);
            const body = await res.json();
            expect(body.error).toBe('Webhook Error');
        });

        it('should reject requests without signature header', async () => {
            const req = new NextRequest('http://localhost:3000/api/webhooks/stripe', {
                method: 'POST',
                body: JSON.stringify(paymentIntentSucceededEvent)
                // No stripe-signature header
            });

            (stripe.webhooks.constructEvent as jest.Mock).mockImplementation(() => {
                throw new Error('No signature header');
            });

            const res = await POST(req);

            expect(res.status).toBe(400);
        });
    });

    // ============================================================
    // payment_intent.succeeded Tests
    // ============================================================
    describe('payment_intent.succeeded', () => {
        beforeEach(() => {
            (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(paymentIntentSucceededEvent);
        });

        it('should find the order by payment_intent_id', async () => {
            const mockOrder = createMockOrder({
                stripe_payment_intent_id: 'pi_test_succeeded_123'
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            mockQueryBuilder.update.mockReturnThis();
            (printful.createOrder as jest.Mock).mockResolvedValue(createMockPrintfulOrder());

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            await POST(req);

            expect(mockSupabase.from).toHaveBeenCalledWith('orders');
            expect(mockQueryBuilder.eq).toHaveBeenCalledWith(
                'stripe_payment_intent_id',
                'pi_test_succeeded_123'
            );
        });

        it('should create Printful order with correct data', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123',
                variant_id: 12345,
                quantity: 1,
                design_id: '67890'
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockResolvedValue(createMockPrintfulOrder());

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            await POST(req);

            expect(printful.createOrder).toHaveBeenCalledWith(expect.objectContaining({
                external_id: 'order_123',
                confirm: true,
                items: expect.arrayContaining([
                    expect.objectContaining({
                        variant_id: 12345,
                        quantity: 1
                    })
                ])
            }));
        });

        it('should update order status to paid after successful Printful order', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123'
            });
            const mockPrintfulOrder = createMockPrintfulOrder({ id: 999999 });

            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockResolvedValue(mockPrintfulOrder);

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
                status: 'paid',
                printful_order_id: 999999,
                stripe_payment_status: 'succeeded'
            }));
        });

        it('should store printful_order_id', async () => {
            const mockOrder = createMockOrder({
                stripe_payment_intent_id: 'pi_test_succeeded_123'
            });
            const mockPrintfulOrder = createMockPrintfulOrder({ id: 888888 });

            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockResolvedValue(mockPrintfulOrder);

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            await POST(req);

            expect(mockQueryBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ printful_order_id: 888888 })
            );
        });

        it('should handle missing order gracefully', async () => {
            mockQueryBuilder.single.mockResolvedValue({
                data: null,
                error: { message: 'Not found' }
            });

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            const res = await POST(req);

            expect(res.status).toBe(404);
            const body = await res.json();
            expect(body.error).toBe('Order not found');
            expect(printful.createOrder).not.toHaveBeenCalled();
        });

        it('should be idempotent (not process already paid orders)', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123',
                status: 'paid' // Already paid
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(printful.createOrder).not.toHaveBeenCalled();
            expect(mockQueryBuilder.update).not.toHaveBeenCalled();
        });

        it('should handle Printful API failures and mark order appropriately', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123'
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockRejectedValue(new Error('Printful API Error'));

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            const res = await POST(req);

            // Should still return 200 (webhook processed)
            expect(res.status).toBe(200);

            // Should update order as failed
            expect(mockQueryBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'failed' })
            );
        });

        it('should handle design_id as URL when not numeric', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123',
                design_id: 'https://storage.example.com/designs/poster.png'
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockResolvedValue(createMockPrintfulOrder());

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            await POST(req);

            expect(printful.createOrder).toHaveBeenCalledWith(expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({
                        files: [{ url: 'https://storage.example.com/designs/poster.png' }]
                    })
                ])
            }));
        });

        it('should handle design_id as Printful file ID when numeric', async () => {
            const mockOrder = createMockOrder({
                id: 'order_123',
                stripe_payment_intent_id: 'pi_test_succeeded_123',
                design_id: '12345'
            });
            mockQueryBuilder.single.mockResolvedValue({ data: mockOrder, error: null });
            (printful.createOrder as jest.Mock).mockResolvedValue(createMockPrintfulOrder());

            const req = createWebhookRequest(paymentIntentSucceededEvent);
            await POST(req);

            expect(printful.createOrder).toHaveBeenCalledWith(expect.objectContaining({
                items: expect.arrayContaining([
                    expect.objectContaining({
                        files: [{ id: 12345 }]
                    })
                ])
            }));
        });
    });

    // ============================================================
    // payment_intent.payment_failed Tests
    // ============================================================
    describe('payment_intent.payment_failed', () => {
        beforeEach(() => {
            (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(paymentIntentFailedEvent);
        });

        it('should update order status to failed', async () => {
            mockQueryBuilder.update.mockReturnThis();
            mockQueryBuilder.eq.mockResolvedValue({ error: null });

            const req = createWebhookRequest(paymentIntentFailedEvent);
            const res = await POST(req);

            expect(res.status).toBe(200);
            expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
                status: 'failed'
            }));
        });

        it('should set stripe_payment_status to failed', async () => {
            mockQueryBuilder.update.mockReturnThis();
            mockQueryBuilder.eq.mockResolvedValue({ error: null });

            const req = createWebhookRequest(paymentIntentFailedEvent);
            await POST(req);

            expect(mockQueryBuilder.update).toHaveBeenCalledWith(expect.objectContaining({
                stripe_payment_status: 'failed'
            }));
        });

        it('should not create Printful order for failed payments', async () => {
            mockQueryBuilder.update.mockReturnThis();
            mockQueryBuilder.eq.mockResolvedValue({ error: null });

            const req = createWebhookRequest(paymentIntentFailedEvent);
            await POST(req);

            expect(printful.createOrder).not.toHaveBeenCalled();
        });
    });

    // ============================================================
    // Unknown Event Tests
    // ============================================================
    describe('Unknown Events', () => {
        it('should return 200 for unhandled event types', async () => {
            const unknownEvent: Stripe.Event = {
                ...paymentIntentSucceededEvent,
                type: 'customer.created' as any
            };
            (stripe.webhooks.constructEvent as jest.Mock).mockReturnValue(unknownEvent);

            const req = createWebhookRequest(unknownEvent);
            const res = await POST(req);

            expect(res.status).toBe(200);
            const body = await res.json();
            expect(body.received).toBe(true);
        });
    });
});
