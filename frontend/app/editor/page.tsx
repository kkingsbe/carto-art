import { Suspense } from 'react';
import { PosterEditor } from '@/components/layout/PosterEditor';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Metadata } from 'next';
import { getSiteConfig, CONFIG_KEYS } from '@/lib/actions/usage';

export const metadata: Metadata = {
  title: 'Map Poster Editor | Create Custom Wall Art - Carto-Art',
  description: 'Design custom map posters with our free online editor. Features 3D terrain, multiple styles (Minimal, Vintage, Dark), and high-res export. No signup required.',
  keywords: 'map editor, custom map maker, map poster creator, 3d terrain map, free map art tool',
  openGraph: {
    title: 'Map Poster Editor - Create Custom Wall Art',
    description: 'Design custom map posters with our free online editor. Features 3D terrain, multiple styles, and high-res export.',
    type: 'website',
  },
};

export default async function Home() {
  const anonExportLimit = await getSiteConfig(CONFIG_KEYS.ANON_DAILY_EXPORT_LIMIT);

  return (
    <ErrorBoundary>
      <Suspense fallback={
        <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      }>
        <PosterEditor anonExportLimit={anonExportLimit} />
      </Suspense>
    </ErrorBoundary>
  );
}
