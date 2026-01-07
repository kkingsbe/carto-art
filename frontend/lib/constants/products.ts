export interface ProductVariant {
    id: number;
    name: string;
    price: number; // in cents
}

export const PRODUCT_VARIANTS: ProductVariant[] = [
    { id: 12345, name: '18" x 24" Framed', price: 9900 },
    { id: 67890, name: '24" x 36" Framed', price: 14900 },
];

export const getProductPrice = (variantId: number): number | null => {
    const variant = PRODUCT_VARIANTS.find(v => v.id === variantId);
    return variant ? variant.price : null;
};
