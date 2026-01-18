'use client';

import { X, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { AppError, ErrorCode } from '@/lib/errors/AppError';
import { cn } from '@/lib/utils';

interface ErrorToastProps {
  error: AppError;
  onDismiss: () => void;
}

/**
 * Error toast component for displaying user-facing error messages.
 * Shows different styles based on error severity and recoverability.
 */
export function ErrorToast({ error, onDismiss }: ErrorToastProps) {
  const isRecoverable = error.recoverable;
  
  // Determine icon and styling based on error code
  const getErrorStyle = () => {
    // Critical errors (non-recoverable)
    if (!isRecoverable) {
      return {
        icon: AlertCircle,
        bgColor: 'bg-red-50 dark:bg-red-900/20',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-800 dark:text-red-200',
        iconColor: 'text-red-600 dark:text-red-400',
      };
    }
    
    // Warning-level errors
    if (error.code === ErrorCode.STORAGE_QUOTA_EXCEEDED || 
        error.code === ErrorCode.API_RATE_LIMIT) {
      return {
        icon: AlertTriangle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-800 dark:text-yellow-200',
        iconColor: 'text-yellow-600 dark:text-yellow-400',
      };
    }
    
    // Info-level errors (recoverable)
    return {
      icon: Info,
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-200 dark:border-blue-800',
      textColor: 'text-blue-800 dark:text-blue-200',
      iconColor: 'text-blue-600 dark:text-blue-400',
    };
  };

  const style = getErrorStyle();
  const Icon = style.icon;

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-4 rounded-lg border shadow-lg max-w-md',
        style.bgColor,
        style.borderColor,
        'animate-in slide-in-from-top-5 fade-in-0 duration-300'
      )}
      role="alert"
    >
      <Icon className={cn('h-5 w-5 flex-shrink-0 mt-0.5', style.iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', style.textColor)}>
          {error.userMessage}
        </p>
        {process.env.NODE_ENV === 'development' && error.message !== error.userMessage && (
          <p className={cn('text-xs mt-1 opacity-75', style.textColor)}>
            {error.message}
          </p>
        )}
      </div>
      <button
        onClick={onDismiss}
        className={cn(
          'flex-shrink-0 p-1 rounded-md hover:bg-black/5 dark:hover:bg-white/5 transition-colors',
          style.textColor
        )}
        aria-label="Dismiss error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

interface ErrorToastContainerProps {
  errors: Array<{ id: string; error: AppError; timestamp: number }>;
  clearError: (id: string) => void;
}

/**
 * Container component for displaying multiple error toasts.
 */
export function ErrorToastContainer({ errors, clearError }: ErrorToastContainerProps) {
  if (errors.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {errors.map(({ id, error }) => (
        <div key={id} className="pointer-events-auto">
          <ErrorToast error={error} onDismiss={() => clearError(id)} />
        </div>
      ))}
    </div>
  );
}

