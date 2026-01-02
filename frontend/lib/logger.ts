/**
 * Environment-aware logger utility.
 * Only logs in development mode to avoid performance overhead and information leakage in production.
 */

const isDev = process.env.NODE_ENV === 'development';

/**
 * Log levels for filtering
 */
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
}

let currentLogLevel = isDev ? LogLevel.DEBUG : LogLevel.ERROR;

/**
 * Set the current log level
 */
export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

/**
 * Get the current log level
 */
export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Logger interface
 */
export const logger = {
  /**
   * Log an error message
   * Errors are logged in both development and production to help with debugging
   */
  error: (...args: unknown[]): void => {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(...args);
    }
    // In production, you might want to send errors to an error tracking service
    // Example: errorTrackingService.captureException(args[0]);
  },

  /**
   * Log a warning message
   */
  warn: (...args: unknown[]): void => {
    if (isDev && currentLogLevel >= LogLevel.WARN) {
      console.warn(...args);
    }
  },

  /**
   * Log an info message
   */
  info: (...args: unknown[]): void => {
    if (isDev && currentLogLevel >= LogLevel.INFO) {
      console.info(...args);
    }
  },

  /**
   * Log a debug message
   */
  debug: (...args: unknown[]): void => {
    if (isDev && currentLogLevel >= LogLevel.DEBUG) {
      console.debug(...args);
    }
  },

  /**
   * Log a message (alias for info)
   */
  log: (...args: unknown[]): void => {
    if (isDev && currentLogLevel >= LogLevel.INFO) {
      console.log(...args);
    }
  },
};

