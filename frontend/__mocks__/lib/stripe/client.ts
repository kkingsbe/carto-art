export const stripe = {
    checkout: {
        sessions: {
            create: async () => ({ url: 'http://localhost:6006/mock-checkout' }),
        },
    },
    billingPortal: {
        sessions: {
            create: async () => ({ url: 'http://localhost:6006/mock-portal' }),
        },
    },
} as any;
