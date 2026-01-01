/**
 * Environment variable validation utilities
 * Ensures required environment variables are present at runtime
 */

import { createError } from '@/lib/errors/ServerActionError';

/**
 * Get a required environment variable
 * @throws {ServerActionError} if the environment variable is not set
 */
export function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw createError.internalError(
      `Missing required environment variable: ${key}. ` +
      `Please check your .env file and ensure ${key} is set. ` +
      `If you just added this variable, please restart your development server.`
    );
  }
  return value;
}

/**
 * Export environment variables directly from process.env
 * Validation happens in the Supabase client creation functions
 * (client.ts, server.ts, middleware.ts) to ensure it occurs
 * when the values are actually used, not at module load time
 */
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';

/**
 * Site URL for CSRF protection
 * Used to verify request origins in API routes
 */
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 
  (process.env.NODE_ENV === 'development' 
    ? 'http://localhost:3000' 
    : '');

/**
 * Get an optional environment variable with a default value
 */
export function getOptionalEnv(key: string, defaultValue: string): string {
  return process.env[key] || defaultValue;
}

/**
 * Get a boolean environment variable
 */
export function getBooleanEnv(key: string, defaultValue: boolean = false): boolean {
  const value = process.env[key];
  if (!value) return defaultValue;
  return value.toLowerCase() === 'true' || value === '1';
}

/**
 * Get a number environment variable
 */
export function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = Number(value);
  if (isNaN(parsed)) {
    throw createError.internalError(`Invalid number for environment variable ${key}: ${value}`);
  }
  return parsed;
}

