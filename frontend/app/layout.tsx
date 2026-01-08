import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import "maplibre-gl/dist/maplibre-gl.css";
import { BuyMeACoffeeWidget } from "@/components/third-party/BuyMeACoffeeWidget";
import { Navbar } from "@/components/layout/Navbar";
import { Toaster } from "sonner";
import { PageViewTracker } from "@/components/analytics/PageViewTracker";
import { ReferrerSaver } from "@/components/analytics/ReferrerSaver";
import { StructuredData } from "@/components/seo/StructuredData";
import { Suspense } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Free Map Poster Maker | Create Custom Wall Art - Carto-Art",
  description: "Turn any location into beautiful wall art. Free map poster creator with no watermarks. Export at 24×36\" print size. Trusted by 10k+ users. No signup required.",
  keywords: "map poster, custom map art, free poster maker, wall art, personalized map, location poster, map print, cartographic art, Mapiful alternative, Grafomap alternative",
  icons: {
    icon: "/icon.svg",
  },
  openGraph: {
    title: "Free Map Poster Maker - Turn Any Place Into Wall Art",
    description: "Create personalized map posters in minutes. Free to use, no watermarks, print-ready at 24×36\". Join thousands of creators worldwide.",
    images: ["/hero.jpg"],
    type: "website",
    siteName: "Carto-Art",
  },
  twitter: {
    card: "summary_large_image",
    title: "Free Map Poster Maker - Carto-Art",
    description: "Turn any place into personalized wall art. Free forever, no watermarks, print-ready quality.",
    images: ["/hero.jpg"],
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "https://cartoart.net"),
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
        className={`${geistSans.variable} ${geistMono.variable} antialiased h-screen flex flex-col overflow-hidden`}
      >
        {process.env.NEXT_PUBLIC_GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());

                gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
              `}
            </Script>
          </>
        )}
        <StructuredData type="software" />
        <BuyMeACoffeeWidget />
        <Navbar />
        <Suspense fallback={null}>
          <PageViewTracker />
          <ReferrerSaver />
        </Suspense>
        <main className="flex-1 flex flex-col overflow-y-auto overflow-x-hidden">
          {children}
        </main>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
