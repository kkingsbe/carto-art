/**
 * Rate limiting utilities
 * Uses Supabase database for serverless-compatible rate limiting
 * Falls back to in-memory storage for development when Supabase is unavailable
 */

import { createClient } from '@/lib/supabase/server';
import { logger } from '@/lib/logger';

type RateLimitKey = `${string}:${string}`; // userId:actionType

interface RateLimitStore {
  requests: number[];
  lastCleanup: number;
}

// In-memory fallback for development
const inMemoryStore = new Map<RateLimitKey, RateLimitStore>();
const CLEANUP_INTERVAL_MS = 60 * 1000; // Clean up old entries every minute

/**
 * Check if a request is within rate limits using Supabase
 * Falls back to in-memory storage if Supabase is unavailable
 * @param userId - User ID making the request
 * @param actionType - Type of action (e.g., 'vote', 'comment', 'publish')
 * @param maxRequests - Maximum number of requests allowed
 * @param windowMs - Time window in milliseconds
 * @returns Object with allowed status and optional retryAfter seconds
 */
export async function checkRateLimit(
  userId: string,
  actionType: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  try {
    return await checkRateLimitDatabase(userId, actionType, maxRequests, windowMs);
  } catch (error) {
    // Fallback to in-memory if database is unavailable
    logger.warn('Rate limiting database unavailable, using in-memory fallback', { 
      error, 
      userId, 
      actionType 
    });
    return checkRateLimitInMemory(userId, actionType, maxRequests, windowMs);
  }
}

/**
 * Check rate limit using Supabase database
 */
async function checkRateLimitDatabase(
  userId: string,
  actionType: string,
  maxRequests: number,
  windowMs: number
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = await createClient();
  const now = Date.now();
  const windowStart = new Date(now - windowMs);
  
  // Fetch or create rate limit entry
  const { data: existing, error: fetchError } = await (supabase as any)
    .from('rate_limits')
    .select('request_timestamps, window_start')
    .eq('user_id', userId)
    .eq('action_type', actionType)
    .single();
  
  if (fetchError && fetchError.code !== 'PGRST116') {
    // PGRST116 is "not found", which is fine - we'll create a new entry
    throw fetchError;
  }
  
  // Parse existing timestamps or start fresh
  let timestamps: number[] = [];
  let storedWindowStart = windowStart;
  
  if (existing) {
    const existingData = existing as { request_timestamps: unknown; window_start: string };
    const requestTimestamps = existingData.request_timestamps;
    timestamps = (Array.isArray(requestTimestamps) 
      ? requestTimestamps 
      : []) as number[];
    storedWindowStart = new Date(existingData.window_start || windowStart);
    
    // If window has shifted significantly, reset
    if (storedWindowStart.getTime() < windowStart.getTime()) {
      timestamps = [];
      storedWindowStart = windowStart;
    }
  }
  
  // Filter out old timestamps
  const recentTimestamps = timestamps.filter(ts => ts >= now - windowMs);
  
  // Check if limit exceeded
  if (recentTimestamps.length >= maxRequests) {
    const oldestRequest = Math.min(...recentTimestamps);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    
    // Update database with current state
    await supabase
      .from('rate_limits')
      .upsert({
        user_id: userId,
        action_type: actionType,
        request_timestamps: recentTimestamps,
        window_start: storedWindowStart.toISOString(),
      } as any);
    
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  recentTimestamps.push(now);
  
  // Update database
  const { error: upsertError } = await supabase
    .from('rate_limits')
    .upsert({
      user_id: userId,
      action_type: actionType,
      request_timestamps: recentTimestamps,
      window_start: storedWindowStart.toISOString(),
    } as any);
  
  if (upsertError) {
    throw upsertError;
  }
  
  return { allowed: true };
}

/**
 * Check rate limit using in-memory storage (fallback)
 * NOTE: This only works for single-instance deployments
 */
function checkRateLimitInMemory(
  userId: string,
  actionType: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const key: RateLimitKey = `${userId}:${actionType}`;
  const now = Date.now();
  
  // Get or create store entry
  let store = inMemoryStore.get(key);
  if (!store) {
    store = { requests: [], lastCleanup: now };
    inMemoryStore.set(key, store);
  }
  
  // Clean up old entries periodically
  if (now - store.lastCleanup > CLEANUP_INTERVAL_MS) {
    store.requests = store.requests.filter(timestamp => now - timestamp < windowMs);
    store.lastCleanup = now;
  } else {
    // Remove old entries for this check
    store.requests = store.requests.filter(timestamp => now - timestamp < windowMs);
  }
  
  // Check if limit exceeded
  if (store.requests.length >= maxRequests) {
    const oldestRequest = Math.min(...store.requests);
    const retryAfter = Math.ceil((oldestRequest + windowMs - now) / 1000);
    return { allowed: false, retryAfter };
  }
  
  // Add current request
  store.requests.push(now);
  return { allowed: true };
}

/**
 * Clear rate limit entries for a specific user and action
 * Useful for testing or manual reset
 */
export async function clearRateLimit(userId: string, actionType: string): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase
      .from('rate_limits')
      .delete()
      .eq('user_id', userId)
      .eq('action_type', actionType);
  } catch (error) {
    logger.warn('Failed to clear rate limit from database, clearing in-memory', { error });
  }
  
  // Also clear in-memory
  const key: RateLimitKey = `${userId}:${actionType}`;
  inMemoryStore.delete(key);
}

/**
 * Clear all rate limit entries
 * Useful for testing
 */
export async function clearAllRateLimits(): Promise<void> {
  try {
    const supabase = await createClient();
    await supabase.from('rate_limits').delete().neq('user_id', ''); // Delete all
  } catch (error) {
    logger.warn('Failed to clear rate limits from database, clearing in-memory', { error });
  }
  
  // Also clear in-memory
  inMemoryStore.clear();
}

