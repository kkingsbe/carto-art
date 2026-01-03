'use client';

import { useEffect } from 'react';
import Script from 'next/script';

/**
 * Ko-fi widget component that handles the donation button and styling.
 * Extracted from layout.tsx for better organization and maintainability.
 */
export function KofiWidget() {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    function applyKofiStyles() {
      const isMobile = window.innerWidth <= 768;
      const style = document.createElement('style');
      style.id = 'kofi-position-style';
      style.textContent = `
        .floatingchat-container-wrap,
        [class*="floatingchat"],
        [class*="floating-chat"],
        div[class*="kofi"] {
          left: unset !important;
          right: 16px !important;
        }
        .floating-chat-kofi-popup-iframe,
        [class*="floating-chat"][class*="popup"],
        [class*="floating-chat"][class*="iframe"],
        [id*="floating-chat"],
        iframe[src*="ko-fi.com"] {
          left: unset !important;
          right: 16px !important;
        }
        @media (max-width: 768px) {
          .floatingchat-container-wrap,
          [class*="floatingchat"]:not([class*="popup"]):not([class*="iframe"]) {
            display: none !important;
            visibility: hidden !important;
          }
        }
        .floatingchat-container-wrap,
        .floatingchat-container-wrap-mo498,
        .floatingchat-container,
        .floatingchat-container-mo498,
        [class*="floatingchat-container"],
        [class*="floatingchat"] > div,
        .floating-chat-kofi-popup-iframe,
        .kofi-widget-overlay-wrapper,
        [id*="kofi"],
        [class*="kofi"] {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          border: none !important;
        }
        .floatingchat-container-wrap img,
        .floatingchat-container-wrap-mo498 img,
        [class*="floatingchat"] img {
          background: transparent !important;
        }
      `;
      if (!document.getElementById('kofi-position-style')) {
        document.head.appendChild(style);
      } else {
        const existingStyle = document.getElementById('kofi-position-style');
        if (existingStyle) {
          existingStyle.textContent = style.textContent;
        }
      }

      // Apply positioning styles to button container
      const buttonContainer = document.querySelector('.floatingchat-container-wrap');
      if (buttonContainer && buttonContainer instanceof HTMLElement) {
        if (isMobile) {
          // Hide only the button container on mobile
          buttonContainer.style.display = 'none';
          buttonContainer.style.visibility = 'hidden';
        } else {
          // Position button on right side
          buttonContainer.style.left = 'unset';
          buttonContainer.style.right = '16px';
        }
      }

      // Apply positioning to popup/iframe (but don't hide on mobile)
      const popupElements = document.querySelectorAll('.floating-chat-kofi-popup-iframe, [class*="floating-chat"][class*="popup"], [class*="floating-chat"][class*="iframe"]');
      popupElements.forEach(function (el) {
        if (el instanceof HTMLElement && !isMobile) {
          el.style.left = 'unset';
          el.style.right = '16px';
        }
      });
    }

    // Apply styles immediately and set up observer
    applyKofiStyles();

    // Watch for new elements being added
    const observer = new MutationObserver(function () {
      applyKofiStyles();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Reapply styles on window resize (e.g., device rotation)
    const handleResize = () => {
      applyKofiStyles();
    };
    window.addEventListener('resize', handleResize);

    function initKofi() {
      if (typeof window !== 'undefined' && (window as any).kofiWidgetOverlay) {
        (window as any).kofiWidgetOverlay.draw('kkingsberry', {
          'type': 'floating-chat',
          'floating-chat.donateButton.text': 'Support me',
          'floating-chat.donateButton.background-color': '#00b9fe',
          'floating-chat.donateButton.text-color': '#fff'
        });

        // Apply styles after widget draws
        setTimeout(applyKofiStyles, 300);
        setTimeout(applyKofiStyles, 1000);
      } else {
        setTimeout(initKofi, 100);
      }
    }
    initKofi();

    // Cleanup
    return () => {
      observer.disconnect();
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <>
      <Script
        src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
        strategy="afterInteractive"
      />
    </>
  );
}

