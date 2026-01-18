// Stub file for server action errors - no-op for anonymous version
export function createError(message: string, code?: string) {
  const error = new Error(message) as any;
  error.code = code || 'UNKNOWN_ERROR';
  return error;
}
