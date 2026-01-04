/**
 * Printful Mock Utilities for Testing
 * 
 * Provides mock factories for Printful API responses.
 */

// ============================================================
// Types
// ============================================================

export interface MockShippingRate {
    id: string;
    name: string;
    rate: string;
    currency: string;
    minDeliveryDays: number;
    maxDeliveryDays: number;
}

export interface MockPrintfulOrder {
    id: number;
    external_id: string;
    status: string;
    costs: {
        subtotal: string;
        tax: string;
        shipping: string;
        total: string;
    };
}

export interface MockPrintfulFile {
    id: number;
    preview_url: string;
    filename: string;
}

// ============================================================
// Shipping Rate Mocks
// ============================================================

export const mockShippingRates: MockShippingRate[] = [
    {
        id: 'STANDARD',
        name: 'Standard Shipping',
        rate: '4.99',
        currency: 'USD',
        minDeliveryDays: 5,
        maxDeliveryDays: 8
    },
    {
        id: 'EXPRESS',
        name: 'Express Shipping',
        rate: '12.99',
        currency: 'USD',
        minDeliveryDays: 2,
        maxDeliveryDays: 3
    }
];

export function createMockShippingRate(overrides: Partial<MockShippingRate> = {}): MockShippingRate {
    return {
        id: 'STANDARD',
        name: 'Standard Shipping',
        rate: '4.99',
        currency: 'USD',
        minDeliveryDays: 5,
        maxDeliveryDays: 8,
        ...overrides
    };
}

// ============================================================
// Order Mocks
// ============================================================

let orderIdCounter = 100000;

export function createMockPrintfulOrder(overrides: Partial<MockPrintfulOrder> = {}): MockPrintfulOrder {
    return {
        id: overrides.id ?? orderIdCounter++,
        external_id: overrides.external_id ?? `order_${Date.now()}`,
        status: overrides.status ?? 'draft',
        costs: overrides.costs ?? {
            subtotal: '99.00',
            tax: '0.00',
            shipping: '4.99',
            total: '103.99'
        }
    };
}

// ============================================================
// File Upload Mocks
// ============================================================

let fileIdCounter = 200000;

export function createMockPrintfulFile(overrides: Partial<MockPrintfulFile> = {}): MockPrintfulFile {
    const id = overrides.id ?? fileIdCounter++;
    return {
        id,
        preview_url: overrides.preview_url ?? `https://printful.com/files/${id}/preview.png`,
        filename: overrides.filename ?? `design_${id}.png`
    };
}

// ============================================================
// API Response Mocks (Raw Printful API format)
// ============================================================

export function createMockShippingRatesApiResponse(rates: MockShippingRate[] = mockShippingRates) {
    return {
        code: 200,
        result: rates.map(rate => ({
            id: rate.id,
            name: rate.name,
            rate: rate.rate,
            currency: rate.currency,
            min_delivery_days: rate.minDeliveryDays,
            max_delivery_days: rate.maxDeliveryDays
        }))
    };
}

export function createMockOrderApiResponse(order: MockPrintfulOrder = createMockPrintfulOrder()) {
    return {
        code: 200,
        result: order
    };
}

export function createMockFileApiResponse(file: MockPrintfulFile = createMockPrintfulFile()) {
    return {
        code: 200,
        result: file
    };
}

// ============================================================
// Error Response Mocks
// ============================================================

export function createMockPrintfulError(message: string, code: number = 400) {
    return {
        code,
        result: message,
        error: {
            reason: 'BadRequest',
            message
        }
    };
}

// ============================================================
// Mock Printful Client Factory
// ============================================================

export function createMockPrintfulClient() {
    return {
        getShippingRates: jest.fn().mockResolvedValue(mockShippingRates),
        createOrder: jest.fn().mockResolvedValue(createMockPrintfulOrder()),
    };
}

// ============================================================
// Mock Fetch Responses for Printful API
// ============================================================

export function mockPrintfulFetch() {
    const originalFetch = global.fetch;

    beforeEach(() => {
        (global.fetch as jest.Mock) = jest.fn((url: string, options?: RequestInit) => {
            const urlString = url.toString();

            // Shipping rates endpoint
            if (urlString.includes('/shipping/rates')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(createMockShippingRatesApiResponse())
                } as Response);
            }

            // Orders endpoint
            if (urlString.includes('/orders')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(createMockOrderApiResponse())
                } as Response);
            }

            // Files endpoint
            if (urlString.includes('/files')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve(createMockFileApiResponse())
                } as Response);
            }

            // Default - call original
            return originalFetch(url, options);
        });
    });

    afterEach(() => {
        global.fetch = originalFetch;
    });
}

// ============================================================
// Test Data Constants
// ============================================================

export const TEST_PRINTFUL_API_KEY = 'test_printful_api_key';
export const TEST_VARIANT_ID = 12345;
export const TEST_VARIANT_ID_LARGE = 67890;
