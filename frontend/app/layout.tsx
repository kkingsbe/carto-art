import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CartoArt | Map Poster Generator",
  description: "Create beautifully stylized map posters from real geographic data",
  icons: {
    icon: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;700&family=Poppins:wght@400;700&family=Bebas+Neue&family=Oswald:wght@400;700&family=Inter:wght@400;700&family=Outfit:wght@400;700&family=DM+Sans:wght@400;700&family=JetBrains+Mono:wght@400;700&family=IBM+Plex+Mono:wght@400;700&family=Space+Mono:wght@400;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&family=Crimson+Text:ital,wght@0,400;0,700;1,400&family=EB+Garamond:ital,wght@0,400;0,700;1,400&family=Cormorant+Garamond:ital,wght@0,400;0,700;1,400&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=G-3TZH3H4MVW"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-3TZH3H4MVW');
          `}
        </Script>
        <Script
          src="https://storage.ko-fi.com/cdn/scripts/overlay-widget.js"
          strategy="afterInteractive"
        />
        <Script id="kofi-widget-init" strategy="afterInteractive">
          {`
            (function() {
              function applyKofiStyles() {
                const isMobile = window.innerWidth <= 768;
                const style = document.createElement('style');
                style.id = 'kofi-position-style';
                style.textContent = \`
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
                \`;
                if (!document.getElementById('kofi-position-style')) {
                  document.head.appendChild(style);
                } else {
                  document.getElementById('kofi-position-style').textContent = style.textContent;
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
                popupElements.forEach(function(el) {
                  if (el instanceof HTMLElement && !isMobile) {
                    el.style.left = 'unset';
                    el.style.right = '16px';
                  }
                });
              }
              
              // Apply styles immediately and set up observer
              applyKofiStyles();
              
              // Watch for new elements being added
              const observer = new MutationObserver(function(mutations) {
                applyKofiStyles();
              });
              
              observer.observe(document.body, {
                childList: true,
                subtree: true
              });
              
              // Reapply styles on window resize (e.g., device rotation)
              window.addEventListener('resize', function() {
                applyKofiStyles();
              });
              
              function initKofi() {
                if (typeof window !== 'undefined' && window.kofiWidgetOverlay) {
                  window.kofiWidgetOverlay.draw('kkingsberry', {
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
            })();
          `}
        </Script>
        {children}
      </body>
    </html>
  );
}
