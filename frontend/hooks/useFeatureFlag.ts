// Stub hook for feature flags - no-op for anonymous version
'use client';

export function useFeatureFlag(flag: string): boolean {
  // In anonymous version, all features are available
  return true;
}
