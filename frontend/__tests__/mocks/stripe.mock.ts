/**
 * Stripe Mock Utilities for Testing
 * 
 * Provides mock factories for Stripe objects used in e-commerce testing.
 */
import Stripe from 'stripe';

// ============================================================
// Payment Intent Mocks
// ============================================================

export interface MockPaymentIntentOptions {
    id?: string;
    client_secret?: string;
    amount?: number;
    currency?: string;
    status?: Stripe.PaymentIntent.Status;
    metadata?: Record<string, string>;
    shipping?: Stripe.PaymentIntent.Shipping | null;
}

export function createMockPaymentIntent(overrides: MockPaymentIntentOptions = {}): Stripe.PaymentIntent {
    return {
        id: overrides.id ?? 'pi_test_123456789',
        object: 'payment_intent',
        amount: overrides.amount ?? 9900,
        amount_capturable: 0,
        amount_details: { tip: {} },
        amount_received: overrides.status === 'succeeded' ? (overrides.amount ?? 9900) : 0,
        application: null,
        application_fee_amount: null,
        automatic_payment_methods: { enabled: true },
        canceled_at: null,
        cancellation_reason: null,
        capture_method: 'automatic',
        client_secret: overrides.client_secret ?? 'pi_test_123456789_secret_test',
        confirmation_method: 'automatic',
        created: Math.floor(Date.now() / 1000),
        currency: overrides.currency ?? 'usd',
        customer: null,
        description: null,
        invoice: null,
        last_payment_error: null,
        latest_charge: null,
        livemode: false,
        metadata: overrides.metadata ?? {
            user_id: 'user_test_123',
            variant_id: '12345',
            design_file_id: '67890',
            quantity: '1'
        },
        next_action: null,
        on_behalf_of: null,
        payment_method: null,
        payment_method_configuration_details: null,
        payment_method_options: {},
        payment_method_types: ['card'],
        processing: null,
        receipt_email: null,
        review: null,
        setup_future_usage: null,
        shipping: overrides.shipping ?? {
            address: {
                city: 'Test City',
                country: 'US',
                line1: '123 Test St',
                line2: null,
                postal_code: '90210',
                state: 'CA'
            },
            carrier: null,
            name: 'John Doe',
            phone: null,
            tracking_number: null
        },
        source: null,
        statement_descriptor: null,
        statement_descriptor_suffix: null,
        status: overrides.status ?? 'requires_payment_method',
        transfer_data: null,
        transfer_group: null
    } as Stripe.PaymentIntent;
}

// ============================================================
// Stripe Event Mocks
// ============================================================

export interface MockStripeEventOptions {
    id?: string;
    type: string;
    data: any;
}

export function createMockStripeEvent(options: MockStripeEventOptions): Stripe.Event {
    return {
        id: options.id ?? `evt_test_${Date.now()}`,
        object: 'event',
        api_version: '2025-12-15.clover',
        created: Math.floor(Date.now() / 1000),
        data: {
            object: options.data,
            previous_attributes: {}
        },
        livemode: false,
        pending_webhooks: 0,
        request: {
            id: 'req_test_123',
            idempotency_key: null
        },
        type: options.type as Stripe.Event['type']
    } as Stripe.Event;
}

// ============================================================
// Convenience Event Factories
// ============================================================

export function createPaymentIntentSucceededEvent(
    paymentIntentOverrides: MockPaymentIntentOptions = {}
): Stripe.Event {
    const paymentIntent = createMockPaymentIntent({
        ...paymentIntentOverrides,
        status: 'succeeded'
    });

    return createMockStripeEvent({
        type: 'payment_intent.succeeded',
        data: paymentIntent
    });
}

export function createPaymentIntentFailedEvent(
    paymentIntentOverrides: MockPaymentIntentOptions = {}
): Stripe.Event {
    const paymentIntent = createMockPaymentIntent({
        ...paymentIntentOverrides,
        status: 'requires_payment_method'
    });

    return createMockStripeEvent({
        type: 'payment_intent.payment_failed',
        data: paymentIntent
    });
}

// ============================================================
// Mock Stripe Client Factory
// ============================================================

export function createMockStripeClient() {
    return {
        paymentIntents: {
            create: jest.fn().mockResolvedValue(createMockPaymentIntent()),
            retrieve: jest.fn().mockResolvedValue(createMockPaymentIntent()),
            update: jest.fn().mockResolvedValue(createMockPaymentIntent()),
            cancel: jest.fn().mockResolvedValue(createMockPaymentIntent({ status: 'canceled' })),
        },
        webhooks: {
            constructEvent: jest.fn((body, signature, secret) => {
                // Default implementation parses body as JSON
                return JSON.parse(body);
            }),
        },
    };
}

// ============================================================
// Test Data Constants
// ============================================================

export const TEST_STRIPE_SECRET_KEY = 'sk_test_mock_key';
export const TEST_STRIPE_WEBHOOK_SECRET = 'whsec_test_mock_secret';
export const TEST_STRIPE_PUBLISHABLE_KEY = 'pk_test_mock_key';
