/**
 * CSRF protection utilities
 * Verifies request origin to prevent cross-site request forgery attacks
 * 
 * Note: Next.js 16 provides built-in CSRF protection for server actions,
 * but API routes need manual origin verification.
 */

import { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { SITE_URL } from '@/lib/utils/env';

/**
 * Verify that the request origin matches the allowed site URL
 * @param request - Next.js request object
 * @returns true if origin is valid, false otherwise
 */
export function verifyOrigin(request: NextRequest): boolean {
  // Get origin from headers (preferred) or referer
  const origin = request.headers.get('origin');
  const referer = request.headers.get('referer');
  
  // If no origin or referer, allow in development but warn
  if (!origin && !referer) {
    if (process.env.NODE_ENV === 'development') {
      logger.warn('CSRF check: No origin or referer header, allowing in development', {
        path: request.nextUrl.pathname,
      });
      return true;
    }
    logger.warn('CSRF check: No origin or referer header', {
      path: request.nextUrl.pathname,
    });
    return false;
  }
  
  // Extract origin from referer if origin header is missing
  const requestOrigin = origin || (referer ? new URL(referer).origin : null);
  
  if (!requestOrigin) {
    logger.warn('CSRF check: Could not determine request origin', {
      path: request.nextUrl.pathname,
      origin,
      referer,
    });
    return false;
  }
  
  // Parse allowed site URL
  let allowedOrigin: string;
  try {
    const siteUrl = new URL(SITE_URL);
    allowedOrigin = siteUrl.origin;
  } catch (error) {
    logger.error('CSRF check: Invalid SITE_URL configuration', { 
      error, 
      siteUrl: SITE_URL 
    });
    // In development, allow if SITE_URL is not configured
    if (process.env.NODE_ENV === 'development') {
      logger.warn('CSRF check: Allowing request in development due to invalid SITE_URL');
      return true;
    }
    return false;
  }
  
  // Check if origins match
  const isValid = requestOrigin === allowedOrigin;
  
  if (!isValid) {
    logger.warn('CSRF check: Origin mismatch', {
      path: request.nextUrl.pathname,
      requestOrigin,
      allowedOrigin,
    });
  }
  
  return isValid;
}

/**
 * Verify CSRF protection and throw error if invalid
 * @param request - Next.js request object
 * @throws {Error} if origin verification fails
 */
export function requireValidOrigin(request: NextRequest): void {
  if (!verifyOrigin(request)) {
    throw new Error('Invalid request origin. CSRF protection check failed.');
  }
}

