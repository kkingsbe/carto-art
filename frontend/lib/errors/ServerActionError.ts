/**
 * Custom error class for server actions
 * Provides structured error information with codes and status codes
 */
export class ServerActionError extends Error {
  constructor(
    message: string,
    public readonly code: ErrorCode,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = 'ServerActionError';
    // Maintains proper stack trace for where our error was thrown (only available on V8)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ServerActionError);
    }
  }

  /**
   * Convert error to JSON for client-side handling
   */
  toJSON() {
    return {
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      name: this.name,
    };
  }
}

/**
 * Error codes for different error types
 */
export enum ErrorCode {
  // Authentication errors
  AUTH_REQUIRED = 'AUTH_REQUIRED',
  AUTH_FAILED = 'AUTH_FAILED',
  
  // Authorization errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  NOT_OWNER = 'NOT_OWNER',
  
  // Resource errors
  NOT_FOUND = 'NOT_FOUND',
  ALREADY_EXISTS = 'ALREADY_EXISTS',
  
  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INVALID_INPUT = 'INVALID_INPUT',
  
  // Rate limiting
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  
  // Storage errors
  STORAGE_ERROR = 'STORAGE_ERROR',
  UPLOAD_FAILED = 'UPLOAD_FAILED',
  
  // Database errors
  DATABASE_ERROR = 'DATABASE_ERROR',
  QUERY_FAILED = 'QUERY_FAILED',
  
  // Generic errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  OPERATION_FAILED = 'OPERATION_FAILED',
}

/**
 * Helper functions to create common errors
 */
export const createError = {
  authRequired: (message = 'You must be signed in to perform this action') =>
    new ServerActionError(message, ErrorCode.AUTH_REQUIRED, 401),
  
  permissionDenied: (message = 'You do not have permission to perform this action') =>
    new ServerActionError(message, ErrorCode.PERMISSION_DENIED, 403),
  
  notFound: (resource = 'Resource') =>
    new ServerActionError(`${resource} not found`, ErrorCode.NOT_FOUND, 404),
  
  validationError: (message: string) =>
    new ServerActionError(message, ErrorCode.VALIDATION_ERROR, 400),
  
  rateLimitExceeded: (message = 'Rate limit exceeded. Please try again later') =>
    new ServerActionError(message, ErrorCode.RATE_LIMIT_EXCEEDED, 429),
  
  storageError: (message: string) =>
    new ServerActionError(message, ErrorCode.STORAGE_ERROR, 500),
  
  databaseError: (message: string) =>
    new ServerActionError(message, ErrorCode.DATABASE_ERROR, 500),
  
  internalError: (message = 'An internal error occurred') =>
    new ServerActionError(message, ErrorCode.INTERNAL_ERROR, 500),
};

