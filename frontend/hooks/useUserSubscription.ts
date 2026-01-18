// User subscription hook stub - always returns unlimited for stripped version
export function useUserSubscription() {
  return {
    isLoading: false,
    subscription: null,
    hasUnlimitedExports: true,
    exportsRemaining: Infinity,
    canExport: () => true,
    subscriptionTier: 'free' as 'free' | 'carto_plus',
    isAuthenticated: false,
  };
}
