'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface TooltipProps {
  children: React.ReactElement;
  content: string;
  disabled?: boolean;
  side?: 'top' | 'bottom' | 'left' | 'right';
}

export function Tooltip({ children, content, disabled = false, side = 'top' }: TooltipProps) {
  const [isVisible, setIsVisible] = React.useState(false);

  if (disabled || !content) {
    return children;
  }

  const sideClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1.5 text-xs font-medium text-white bg-gray-900 rounded-md shadow-lg whitespace-nowrap pointer-events-none',
            'dark:bg-gray-700 dark:text-gray-100',
            sideClasses[side]
          )}
        >
          {content}
          {/* Arrow */}
          <div
            className={cn(
              'absolute w-0 h-0 border-4 border-transparent',
              side === 'top' && 'top-full left-1/2 -translate-x-1/2 border-t-gray-900 dark:border-t-gray-700',
              side === 'bottom' && 'bottom-full left-1/2 -translate-x-1/2 border-b-gray-900 dark:border-b-gray-700',
              side === 'left' && 'left-full top-1/2 -translate-y-1/2 border-l-gray-900 dark:border-l-gray-700',
              side === 'right' && 'right-full top-1/2 -translate-y-1/2 border-r-gray-900 dark:border-r-gray-700'
            )}
          />
        </div>
      )}
    </div>
  );
}

