/**
 * Input sanitization utilities
 * Sanitizes user-generated content to prevent XSS and other security issues
 */

/**
 * Sanitize text input by removing HTML tags and dangerous content
 * @param text - Text to sanitize
 * @returns Sanitized text
 */
export function sanitizeText(text: string): string {
  // Remove HTML tags
  let sanitized = text.replace(/<[^>]*>/g, '');

  // Remove zero-width characters
  sanitized = sanitized.replace(/[\u200B-\u200D\uFEFF]/g, '');

  // Normalize Unicode to NFC form
  sanitized = sanitized.normalize('NFC');

  return sanitized.trim();
}

/**
 * Normalize comment content
 * - Normalizes Unicode (NFC)
 * - Removes zero-width characters
 * - Trims whitespace
 * @param content - Comment content to normalize
 * @returns Normalized content
 */
export function normalizeComment(content: string): string {
  // Normalize Unicode to NFC form
  let normalized = content.normalize('NFC');
  
  // Remove zero-width characters (zero-width space, zero-width non-joiner, etc.)
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF]/g, '');
  
  return normalized.trim();
}


