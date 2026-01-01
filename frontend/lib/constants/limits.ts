/**
 * Application limits and constants
 * Centralized location for all magic numbers and limits
 */

// Thumbnail limits
export const THUMBNAIL_MAX_DIMENSION = 800;
export const THUMBNAIL_MAX_SIZE = 5 * 1024 * 1024; // 5MB
export const THUMBNAIL_QUALITY = 0.85; // WebP quality (0-1)
export const THUMBNAIL_DPI = 72; // DPI for thumbnail generation

// Feed limits
export const FEED_PAGE_SIZE = 20;
export const FEED_MAX_PAGE = 100; // Prevent excessive pagination

// Comment limits
export const COMMENT_MIN_LENGTH = 1;
export const COMMENT_MAX_LENGTH = 5000;

// Map title limits
export const MAP_TITLE_MIN_LENGTH = 1;
export const MAP_TITLE_MAX_LENGTH = 200;

// Map subtitle limits
export const MAP_SUBTITLE_MAX_LENGTH = 500;

// Rate limiting (requests per time window)
export const RATE_LIMITS = {
  VOTES_PER_MINUTE: 10,
  COMMENTS_PER_MINUTE: 5,
  PUBLISH_PER_HOUR: 3,
  FEED_PER_MINUTE: 60,
} as const;

