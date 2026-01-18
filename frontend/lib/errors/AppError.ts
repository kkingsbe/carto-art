// Application error types and utilities
export enum ErrorCode {
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  MAP_LOAD_FAILED = 'MAP_LOAD_FAILED',
  EXPORT_FAILED = 'EXPORT_FAILED',
  GEOCODING_FAILED = 'GEOCODING_FAILED',
  STORAGE_QUOTA_EXCEEDED = 'STORAGE_QUOTA_EXCEEDED',
  API_RATE_LIMIT = 'API_RATE_LIMIT',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  SERVICE_UNAVAILABLE = 'SERVICE_UNAVAILABLE',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface AppError extends Error {
  code: ErrorCode;
  details?: any;
  recoverable?: boolean;
  userMessage?: string;
  originalError?: Error;
}

export class AppError extends Error {
  code: ErrorCode;
  details?: any;
  recoverable?: boolean;
  userMessage?: string;
  originalError?: Error;

  constructor(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, details?: any) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export function createAppError(message: string, code: ErrorCode = ErrorCode.UNKNOWN_ERROR, details?: any): AppError {
  return new AppError(message, code, details);
}
