// Stub file for rate limiting - no-op for anonymous version
export function checkRateLimit(identifier: string, action: string, limit?: number, window?: number): { allowed: boolean; retryAfter?: number } {
  // No-op for anonymous version - no rate limiting
  return { allowed: true, retryAfter: 0 };
}
