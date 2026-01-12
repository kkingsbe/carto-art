export const loadStripe = async () => ({
    redirectToCheckout: async () => { },
    elements: () => ({
        create: () => ({
            mount: () => { },
            on: () => { },
            unmount: () => { },
        }),
    }),
});
