'use client';

import { useEffect, useState } from 'react';
import { X, MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface KofiTipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function KofiTipModal({ isOpen, onClose }: KofiTipModalProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    // Fix mobile viewport height issue
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', `${vh}px`);

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
      document.documentElement.style.removeProperty('--vh');
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center",
        "animate-in fade-in duration-200",
        // Mobile: full screen with minimal padding
        isMobile ? "p-0" : "p-4"
      )}
      style={isMobile ? { height: '100dvh' } : undefined}
      onClick={(e) => {
        // Close when clicking backdrop (only on desktop)
        if (!isMobile && e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-md animate-in fade-in duration-200" />

      {/* Modal Content */}
      <div
        className={cn(
          "relative w-full flex flex-col z-10",
          "bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl",
          "shadow-2xl shadow-blue-500/10",
          "border border-white/20 dark:border-gray-700/50",
          "animate-in fade-in zoom-in-95 duration-300",
          "ring-1 ring-black/5 dark:ring-white/10",
          // Mobile: full screen
          isMobile
            ? "h-full max-h-[100dvh] rounded-none"
            : "max-w-2xl max-h-[90vh] rounded-2xl"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className={cn(
            "flex items-center justify-between flex-shrink-0",
            "border-b border-gray-200/50 dark:border-gray-700/50",
            "bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm",
            // Mobile: larger touch targets, reduced padding
            isMobile
              ? "px-4 py-4"
              : "px-6 py-5"
          )}
        >
          <h2
            className={cn(
              "font-semibold tracking-tight text-gray-900 dark:text-white",
              isMobile ? "text-lg" : "text-xl"
            )}
          >
            Support the Project
          </h2>
          <button
            onClick={onClose}
            className={cn(
              "rounded-lg hover:bg-gray-100/80 dark:hover:bg-gray-700/80",
              "active:bg-gray-200/80 dark:active:bg-gray-600/80",
              "text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white",
              "transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500/50",
              "touch-manipulation",
              // Mobile: larger touch target (min 44x44px)
              isMobile ? "p-3 min-w-[44px] min-h-[44px] flex items-center justify-center" : "p-3"
            )}
            aria-label="Close"
          >
            <X className={cn(isMobile ? "h-7 w-7" : "h-6 w-6")} />
          </button>
        </div>

        {/* Ko-fi Iframe Container */}
        <div
          className={cn(
            "flex-1",
            // Mobile: no overflow on container, let iframe handle scrolling
            // Desktop: allow overflow for scrolling
            isMobile ? "overflow-hidden" : "overflow-auto overscroll-contain",
            // Mobile: minimal padding, smoother scrolling, prevent pull-to-refresh
            isMobile ? "p-2 touch-pan-y" : "p-6"
          )}
          style={isMobile ? { WebkitOverflowScrolling: 'touch' } : undefined}
        >
          <div
            className={cn(
              "overflow-hidden border border-gray-200/50 dark:border-gray-700/50",
              "bg-gray-50/50 dark:bg-gray-900/50",
              // Mobile: minimal border radius, desktop: rounded
              isMobile ? "rounded-lg" : "rounded-xl",
              // Mobile: make container fill available height
              isMobile ? "h-full" : undefined
            )}
          >
            <iframe
              id="kofiframe"
              src="https://ko-fi.com/kkingsberry/?hidefeed=true&widget=true&embed=true&preview=true"
              style={{
                border: 'none',
                width: '100%',
                background: 'transparent',
                // Responsive height: adjust based on screen size
                // On mobile, fill the container height (which fills flex-1 space)
                height: isMobile 
                  ? '100%' 
                  : '712px',
                minHeight: isMobile ? '500px' : '600px',
                display: 'block',
              }}
              title="kkingsberry"
              className="dark:bg-transparent"
              allow="payment"
              loading="lazy"
              scrolling="yes"
            />
          </div>
        </div>

        {/* Footer with Discord Button */}
        <div
          className={cn(
            "flex-shrink-0 border-t border-gray-200/50 dark:border-gray-700/50",
            "bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm",
            isMobile ? "px-4 py-4" : "px-6 py-4"
          )}
        >
          <button
            onClick={() => window.open('https://discord.gg/UVKEfcfZVc', '_blank', 'noopener,noreferrer')}
            className={cn(
              "w-full flex items-center justify-center gap-2",
              "px-4 py-2.5 rounded-lg font-medium",
              "bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600",
              "text-white transition-colors duration-200",
              "focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:ring-offset-2",
              "touch-manipulation",
              isMobile ? "text-sm" : "text-base"
            )}
          >
            <MessageCircle className={cn(isMobile ? "w-4 h-4" : "w-5 h-5")} />
            Join Our Discord
          </button>
        </div>
      </div>
    </div>
  );
}

