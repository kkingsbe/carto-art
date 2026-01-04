/**
 * Supabase Mock Utilities for Testing
 * 
 * Provides mock factories for Supabase client and operations.
 */

// ============================================================
// Types
// ============================================================

export interface MockUser {
    id: string;
    email?: string;
    created_at?: string;
}

export interface MockOrder {
    id: string;
    user_id: string;
    stripe_payment_intent_id: string;
    stripe_payment_status: string | null;
    amount_total: number;
    status: 'pending' | 'paid' | 'fulfilled' | 'failed';
    variant_id: number;
    design_id: string;
    quantity: number;
    printful_order_id: number | null;
    shipping_name: string;
    shipping_address_line1: string;
    shipping_address_line2: string | null;
    shipping_city: string;
    shipping_state: string;
    shipping_zip: string;
    shipping_country: string;
    created_at: string;
    updated_at: string;
}

// ============================================================
// User Mocks
// ============================================================

export function createMockUser(overrides: Partial<MockUser> = {}): MockUser {
    return {
        id: overrides.id ?? 'user_test_123',
        email: overrides.email ?? 'test@example.com',
        created_at: overrides.created_at ?? new Date().toISOString()
    };
}

// ============================================================
// Order Mocks
// ============================================================

export function createMockOrder(overrides: Partial<MockOrder> = {}): MockOrder {
    return {
        id: overrides.id ?? `order_${Date.now()}`,
        user_id: overrides.user_id ?? 'user_test_123',
        stripe_payment_intent_id: overrides.stripe_payment_intent_id ?? 'pi_test_123456789',
        stripe_payment_status: overrides.stripe_payment_status ?? null,
        amount_total: overrides.amount_total ?? 9900,
        status: overrides.status ?? 'pending',
        variant_id: overrides.variant_id ?? 12345,
        design_id: overrides.design_id ?? '67890',
        quantity: overrides.quantity ?? 1,
        printful_order_id: overrides.printful_order_id ?? null,
        shipping_name: overrides.shipping_name ?? 'John Doe',
        shipping_address_line1: overrides.shipping_address_line1 ?? '123 Test St',
        shipping_address_line2: overrides.shipping_address_line2 ?? null,
        shipping_city: overrides.shipping_city ?? 'Test City',
        shipping_state: overrides.shipping_state ?? 'CA',
        shipping_zip: overrides.shipping_zip ?? '90210',
        shipping_country: overrides.shipping_country ?? 'US',
        created_at: overrides.created_at ?? new Date().toISOString(),
        updated_at: overrides.updated_at ?? new Date().toISOString()
    };
}

// ============================================================
// Mock Supabase Query Builder
// ============================================================

export function createMockQueryBuilder<T>(data: T | T[] | null = null, error: any = null) {
    const builder = {
        select: jest.fn().mockReturnThis(),
        insert: jest.fn().mockReturnThis(),
        update: jest.fn().mockReturnThis(),
        delete: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        neq: jest.fn().mockReturnThis(),
        gt: jest.fn().mockReturnThis(),
        gte: jest.fn().mockReturnThis(),
        lt: jest.fn().mockReturnThis(),
        lte: jest.fn().mockReturnThis(),
        like: jest.fn().mockReturnThis(),
        ilike: jest.fn().mockReturnThis(),
        is: jest.fn().mockReturnThis(),
        in: jest.fn().mockReturnThis(),
        contains: jest.fn().mockReturnThis(),
        containedBy: jest.fn().mockReturnThis(),
        order: jest.fn().mockReturnThis(),
        limit: jest.fn().mockReturnThis(),
        range: jest.fn().mockReturnThis(),
        single: jest.fn().mockResolvedValue({ data, error }),
        maybeSingle: jest.fn().mockResolvedValue({ data, error }),
        then: jest.fn((resolve) => resolve({ data: Array.isArray(data) ? data : (data ? [data] : []), error })),
    };

    // Make chainable methods return mock resolved values when awaited
    Object.keys(builder).forEach(key => {
        if (key !== 'single' && key !== 'maybeSingle' && key !== 'then') {
            (builder as any)[key].mockReturnValue(builder);
        }
    });

    return builder;
}

// ============================================================
// Mock Supabase Storage
// ============================================================

export function createMockStorage() {
    return {
        from: jest.fn().mockReturnValue({
            upload: jest.fn().mockResolvedValue({ data: { path: 'test/file.png' }, error: null }),
            download: jest.fn().mockResolvedValue({ data: new Blob(), error: null }),
            getPublicUrl: jest.fn().mockReturnValue({
                data: { publicUrl: 'https://storage.supabase.co/test/file.png' }
            }),
            createSignedUrl: jest.fn().mockResolvedValue({
                data: { signedUrl: 'https://storage.supabase.co/signed/test/file.png?token=abc123' },
                error: null
            }),
            remove: jest.fn().mockResolvedValue({ data: [], error: null }),
            list: jest.fn().mockResolvedValue({ data: [], error: null }),
        })
    };
}

// ============================================================
// Mock Supabase Auth
// ============================================================

export function createMockAuth(user: MockUser | null = createMockUser()) {
    return {
        getUser: jest.fn().mockResolvedValue({
            data: { user },
            error: null
        }),
        getSession: jest.fn().mockResolvedValue({
            data: { session: user ? { user } : null },
            error: null
        }),
        signInWithPassword: jest.fn().mockResolvedValue({
            data: { user, session: { user } },
            error: null
        }),
        signOut: jest.fn().mockResolvedValue({ error: null }),
    };
}

// ============================================================
// Mock Supabase Client Factory
// ============================================================

export function createMockSupabaseClient(options: {
    user?: MockUser | null;
    orders?: MockOrder[];
} = {}) {
    const { user = createMockUser(), orders = [] } = options;

    const mockClient = {
        auth: createMockAuth(user),
        storage: createMockStorage(),
        from: jest.fn((table: string) => {
            if (table === 'orders') {
                return createMockQueryBuilder(orders.length > 0 ? orders[0] : null);
            }
            return createMockQueryBuilder();
        })
    };

    return mockClient;
}

// ============================================================
// Mock Server Client Helpers
// ============================================================

export function mockSupabaseServerModules() {
    const mockClient = createMockSupabaseClient();

    jest.mock('@/lib/supabase/server', () => ({
        createClient: jest.fn().mockResolvedValue(mockClient),
        createServiceRoleClient: jest.fn().mockReturnValue(mockClient),
        createAnonymousClient: jest.fn().mockReturnValue(mockClient),
    }));

    return mockClient;
}

// ============================================================
// Test Data Constants
// ============================================================

export const TEST_SUPABASE_URL = 'https://test.supabase.co';
export const TEST_SUPABASE_ANON_KEY = 'test_anon_key';
export const TEST_SUPABASE_SERVICE_ROLE_KEY = 'test_service_role_key';
