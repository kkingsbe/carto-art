class Stripe {
    constructor() {
        return {
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
        };
    }
}

export default Stripe;
