/**
 * Tests for Printful Client
 * 
 * Tests the Printful API client methods.
 */

// Store original fetch
const originalFetch = global.fetch;

// Mock fetch globally
beforeEach(() => {
    global.fetch = jest.fn();
});

afterEach(() => {
    global.fetch = originalFetch;
});

// Import after mocking
import { printful, PrintfulShippingRate, PrintfulOrder } from './client';

describe('Printful Client', () => {
    // ============================================================
    // getShippingRates Tests
    // ============================================================
    describe('getShippingRates', () => {
        const validAddress = {
            address1: '123 Test St',
            city: 'Test City',
            country_code: 'US',
            state_code: 'CA',
            zip: '90210'
        };

        const validItems = [
            { variant_id: 12345, quantity: 1 }
        ];

        it('should call correct API endpoint', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: [{
                        id: 'STANDARD',
                        name: 'Standard',
                        rate: '4.99',
                        currency: 'USD',
                        min_delivery_days: 5,
                        max_delivery_days: 8
                    }]
                })
            });

            await printful.getShippingRates({ address: validAddress, items: validItems });

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.printful.com/shipping/rates',
                expect.objectContaining({
                    method: 'POST',
                    headers: expect.objectContaining({
                        'Content-Type': 'application/json'
                    })
                })
            );
        });

        it('should include address and items in request body', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ result: [] })
            });

            await printful.getShippingRates({ address: validAddress, items: validItems });

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.recipient).toEqual(validAddress);
            expect(body.items).toEqual(validItems);
        });

        it('should transform response to expected format', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: [
                        {
                            id: 'STANDARD',
                            name: 'Standard Shipping',
                            rate: '4.99',
                            currency: 'USD',
                            min_delivery_days: 5,
                            max_delivery_days: 8
                        },
                        {
                            id: 'EXPRESS',
                            name: 'Express Shipping',
                            rate: '12.99',
                            currency: 'USD',
                            min_delivery_days: 2,
                            max_delivery_days: 3
                        }
                    ]
                })
            });

            const rates = await printful.getShippingRates({
                address: validAddress,
                items: validItems
            });

            expect(rates).toHaveLength(2);
            expect(rates[0]).toEqual({
                id: 'STANDARD',
                name: 'Standard Shipping',
                rate: '4.99',
                currency: 'USD',
                minDeliveryDays: 5,
                maxDeliveryDays: 8
            });
        });

        it('should handle API errors', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({
                    error: { message: 'Invalid address' }
                })
            });

            await expect(
                printful.getShippingRates({ address: validAddress, items: validItems })
            ).rejects.toThrow('Printful API Error');
        });

        it('should handle network errors', async () => {
            (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

            await expect(
                printful.getShippingRates({ address: validAddress, items: validItems })
            ).rejects.toThrow('Network error');
        });
    });

    // ============================================================
    // createOrder Tests
    // ============================================================
    describe('createOrder', () => {
        const validOrderPayload = {
            external_id: 'order_123',
            recipient: {
                name: 'John Doe',
                address1: '123 Test St',
                city: 'Test City',
                state_code: 'CA',
                country_code: 'US',
                zip: '90210'
            },
            items: [
                {
                    variant_id: 12345,
                    quantity: 1,
                    files: [{ id: 67890 }]
                }
            ]
        };

        it('should call orders endpoint without confirm parameter by default', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: {
                        id: 999,
                        external_id: 'order_123',
                        status: 'draft',
                        costs: { subtotal: '99.00', tax: '0.00', shipping: '4.99', total: '103.99' }
                    }
                })
            });

            await printful.createOrder(validOrderPayload);

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.printful.com/orders',
                expect.any(Object)
            );
        });

        it('should include confirm parameter when specified', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: {
                        id: 999,
                        external_id: 'order_123',
                        status: 'pending',
                        costs: { subtotal: '99.00', tax: '0.00', shipping: '4.99', total: '103.99' }
                    }
                })
            });

            await printful.createOrder({ ...validOrderPayload, confirm: true });

            expect(global.fetch).toHaveBeenCalledWith(
                'https://api.printful.com/orders?confirm=1',
                expect.any(Object)
            );
        });

        it('should include external_id in request', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: { id: 999, external_id: 'order_123', status: 'draft', costs: {} }
                })
            });

            await printful.createOrder(validOrderPayload);

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.external_id).toBe('order_123');
        });

        it('should properly format files with ID', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: { id: 999, external_id: 'order_123', status: 'draft', costs: {} }
                })
            });

            await printful.createOrder({
                ...validOrderPayload,
                items: [{
                    variant_id: 12345,
                    quantity: 1,
                    files: [{ id: 67890 }]
                }]
            });

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.items[0].files).toEqual([{ id: 67890 }]);
        });

        it('should properly format files with URL', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({
                    result: { id: 999, external_id: 'order_123', status: 'draft', costs: {} }
                })
            });

            await printful.createOrder({
                ...validOrderPayload,
                items: [{
                    variant_id: 12345,
                    quantity: 1,
                    files: [{ url: 'https://example.com/design.png' }]
                }]
            });

            const callArgs = (global.fetch as jest.Mock).mock.calls[0];
            const body = JSON.parse(callArgs[1].body);

            expect(body.items[0].files).toEqual([{ url: 'https://example.com/design.png' }]);
        });

        it('should return order data on success', async () => {
            const mockOrderResponse = {
                id: 12345,
                external_id: 'order_123',
                status: 'pending',
                costs: {
                    subtotal: '99.00',
                    tax: '8.99',
                    shipping: '4.99',
                    total: '112.98'
                }
            };

            (global.fetch as jest.Mock).mockResolvedValue({
                ok: true,
                json: () => Promise.resolve({ result: mockOrderResponse })
            });

            const order = await printful.createOrder(validOrderPayload);

            expect(order).toEqual(mockOrderResponse);
        });

        it('should handle order creation failures', async () => {
            (global.fetch as jest.Mock).mockResolvedValue({
                ok: false,
                json: () => Promise.resolve({
                    error: { message: 'Invalid variant ID' }
                })
            });

            await expect(
                printful.createOrder(validOrderPayload)
            ).rejects.toThrow('Printful Order Creation Error');
        });
    });
});
