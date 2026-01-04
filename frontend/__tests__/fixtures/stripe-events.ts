/**
 * Stripe Event Fixtures
 * 
 * Realistic Stripe webhook event payloads for testing.
 */
import Stripe from 'stripe';

// ============================================================
// Payment Intent Succeeded Event
// ============================================================

export const paymentIntentSucceededEvent: Stripe.Event = {
    id: 'evt_test_payment_succeeded_001',
    object: 'event',
    api_version: '2025-12-15.clover',
    created: 1704326400, // 2026-01-04
    data: {
        object: {
            id: 'pi_test_succeeded_123',
            object: 'payment_intent',
            amount: 9900,
            amount_capturable: 0,
            amount_details: { tip: {} },
            amount_received: 9900,
            application: null,
            application_fee_amount: null,
            automatic_payment_methods: { enabled: true },
            canceled_at: null,
            cancellation_reason: null,
            capture_method: 'automatic',
            client_secret: 'pi_test_succeeded_123_secret',
            confirmation_method: 'automatic',
            created: 1704326400,
            currency: 'usd',
            customer: null,
            description: null,
            invoice: null,
            last_payment_error: null,
            latest_charge: 'ch_test_123',
            livemode: false,
            metadata: {
                user_id: 'user_fixture_123',
                variant_id: '12345',
                design_file_id: '67890',
                quantity: '1'
            },
            next_action: null,
            on_behalf_of: null,
            payment_method: 'pm_test_card',
            payment_method_configuration_details: null,
            payment_method_options: {},
            payment_method_types: ['card'],
            processing: null,
            receipt_email: 'customer@example.com',
            review: null,
            setup_future_usage: null,
            shipping: {
                address: {
                    city: 'San Francisco',
                    country: 'US',
                    line1: '123 Market St',
                    line2: 'Suite 100',
                    postal_code: '94105',
                    state: 'CA'
                },
                carrier: null,
                name: 'Jane Doe',
                phone: '+1-555-123-4567',
                tracking_number: null
            },
            source: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'succeeded',
            transfer_data: null,
            transfer_group: null
        } as Stripe.PaymentIntent,
        previous_attributes: {}
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
        id: 'req_fixture_001',
        idempotency_key: null
    },
    type: 'payment_intent.succeeded'
};

// ============================================================
// Payment Intent Failed Event
// ============================================================

export const paymentIntentFailedEvent: Stripe.Event = {
    id: 'evt_test_payment_failed_001',
    object: 'event',
    api_version: '2025-12-15.clover',
    created: 1704326400,
    data: {
        object: {
            id: 'pi_test_failed_123',
            object: 'payment_intent',
            amount: 9900,
            amount_capturable: 0,
            amount_details: { tip: {} },
            amount_received: 0,
            application: null,
            application_fee_amount: null,
            automatic_payment_methods: { enabled: true },
            canceled_at: null,
            cancellation_reason: null,
            capture_method: 'automatic',
            client_secret: 'pi_test_failed_123_secret',
            confirmation_method: 'automatic',
            created: 1704326400,
            currency: 'usd',
            customer: null,
            description: null,
            invoice: null,
            last_payment_error: {
                charge: 'ch_test_failed',
                code: 'card_declined',
                decline_code: 'generic_decline',
                doc_url: 'https://stripe.com/docs/error-codes/card-declined',
                message: 'Your card was declined.',
                type: 'card_error'
            } as any,
            latest_charge: 'ch_test_failed',
            livemode: false,
            metadata: {
                user_id: 'user_fixture_123',
                variant_id: '12345',
                design_file_id: '67890',
                quantity: '1'
            },
            next_action: null,
            on_behalf_of: null,
            payment_method: 'pm_test_declined_card',
            payment_method_configuration_details: null,
            payment_method_options: {},
            payment_method_types: ['card'],
            processing: null,
            receipt_email: 'customer@example.com',
            review: null,
            setup_future_usage: null,
            shipping: {
                address: {
                    city: 'San Francisco',
                    country: 'US',
                    line1: '123 Market St',
                    line2: null,
                    postal_code: '94105',
                    state: 'CA'
                },
                carrier: null,
                name: 'Jane Doe',
                phone: null,
                tracking_number: null
            },
            source: null,
            statement_descriptor: null,
            statement_descriptor_suffix: null,
            status: 'requires_payment_method',
            transfer_data: null,
            transfer_group: null
        } as Stripe.PaymentIntent,
        previous_attributes: {}
    },
    livemode: false,
    pending_webhooks: 0,
    request: {
        id: 'req_fixture_002',
        idempotency_key: null
    },
    type: 'payment_intent.payment_failed'
};

// ============================================================
// Large Order Event (24x36 variant)
// ============================================================

export const largeOrderSucceededEvent: Stripe.Event = {
    ...paymentIntentSucceededEvent,
    id: 'evt_test_large_order_001',
    data: {
        object: {
            ...(paymentIntentSucceededEvent.data.object as Stripe.PaymentIntent),
            id: 'pi_test_large_order_123',
            amount: 14900, // $149.00
            amount_received: 14900,
            metadata: {
                user_id: 'user_fixture_456',
                variant_id: '67890', // Large variant
                design_file_id: '11111',
                quantity: '1'
            }
        },
        previous_attributes: {}
    }
};

// ============================================================
// Multi-Quantity Order Event
// ============================================================

export const multiQuantitySucceededEvent: Stripe.Event = {
    ...paymentIntentSucceededEvent,
    id: 'evt_test_multi_quantity_001',
    data: {
        object: {
            ...(paymentIntentSucceededEvent.data.object as Stripe.PaymentIntent),
            id: 'pi_test_multi_qty_123',
            amount: 29700, // $99 x 3
            amount_received: 29700,
            metadata: {
                user_id: 'user_fixture_789',
                variant_id: '12345',
                design_file_id: '22222',
                quantity: '3'
            }
        },
        previous_attributes: {}
    }
};

// ============================================================
// Helper to create custom events
// ============================================================

export function createCustomPaymentEvent(
    type: 'payment_intent.succeeded' | 'payment_intent.payment_failed',
    overrides: Partial<Stripe.PaymentIntent> = {}
): Stripe.Event {
    const baseEvent = type === 'payment_intent.succeeded'
        ? paymentIntentSucceededEvent
        : paymentIntentFailedEvent;

    return {
        ...baseEvent,
        id: `evt_custom_${Date.now()}`,
        data: {
            object: {
                ...(baseEvent.data.object as Stripe.PaymentIntent),
                ...overrides
            },
            previous_attributes: {}
        }
    };
}
