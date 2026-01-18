// Stub file for subscription - no-op for anonymous version
export async function createCheckoutSession(priceId: string) {
  // No-op for anonymous version
  console.log('[Subscription] Create checkout session:', priceId);
  throw new Error('Subscriptions not available in anonymous version');
}
