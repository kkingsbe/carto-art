import { Suspense } from 'react';
import { PosterEditor } from '@/components/layout/PosterEditor';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Map Poster Editor | Create Custom Wall Art - Carto-Art',
  description: 'Design custom map posters with our free online editor. Features 3D terrain, multiple styles (Minimal, Vintage, Dark), and high-res export. No signup required.',
  keywords: 'map editor, custom map maker, map poster creator, 3d terrain map, free map art tool',
  openGraph: {
    title: 'Map Poster Editor - Create Custom Wall Art',
    description: 'Design custom map posters with 3D terrain, multiple styles, and high-res export. Free, no signup required.',
    url: '/editor',
    locale: 'en_US',
    type: 'website',
    images: [
      {
        url: '/hero.jpg',
        width: 1200,
        height: 630,
        alt: 'Carto-Art Map Poster Editor',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Map Poster Editor - Carto-Art',
    description: 'Design custom map posters with 3D terrain, multiple styles, and high-res export. Free, no signup required.',
    images: ['/hero.jpg'],
  },
};

export default function Home() {
  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <PosterEditor />
      </Suspense>
    </ErrorBoundary>
  );
}
