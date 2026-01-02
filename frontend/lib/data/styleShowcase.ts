import {
  Home,
  Gift,
  Plane,
  Building2,
  Calendar,
  Store,
  type LucideIcon
} from 'lucide-react';

export interface StyleComparison {
  id: string;
  location: string;
  beforeStyle: string;
  afterStyle: string;
  beforeImage: string;
  afterImage: string;
  description: string;
}

export interface UseCase {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  targetAudience: string;
}

/**
 * Before/After style comparisons to demonstrate transformation power
 * These showcase the same location in different artistic styles
 */
export const styleComparisons: StyleComparison[] = [
  {
    id: 'salt-lake-city',
    location: 'Salt Lake City',
    beforeStyle: 'Minimal',
    afterStyle: 'Midnight',
    beforeImage: '/examples/thumbnails/slc-minimal.jpg',
    afterImage: '/examples/thumbnails/slc-midnight.jpg',
    description: 'From clean lines to dramatic atmosphere',
  },
  {
    id: 'washington-dc',
    location: 'Washington, D.C.',
    beforeStyle: 'Minimal',
    afterStyle: 'Artistic',
    beforeImage: '/examples/thumbnails/washington-minimal.jpg',
    afterImage: '/examples/thumbnails/washington-artistic.jpg',
    description: 'Transform familiar places into unique art',
  },
  {
    id: 'chesapeake',
    location: 'Chesapeake Bay',
    beforeStyle: 'Minimal',
    afterStyle: 'Artistic',
    beforeImage: '/examples/thumbnails/chesapeake-minimal.jpg',
    afterImage: '/examples/thumbnails/chesapeake-artistic.jpg',
    description: 'Add character with artistic styling and terrain',
  },
];

/**
 * Use cases that help potential users visualize how they'd use the product
 * Each targets a specific audience with concrete scenarios
 */
export const useCases: UseCase[] = [
  {
    id: 'home-decor',
    title: 'Home Decor',
    description: 'Celebrate where you live with wall art that\'s uniquely yours. Perfect for living rooms, home offices, or bedrooms.',
    icon: Home,
    targetAudience: 'homeowners, renters, interior design enthusiasts',
  },
  {
    id: 'gifts',
    title: 'Meaningful Gifts',
    description: 'Birthplace maps, wedding venues, where you first met—turn special locations into unforgettable presents.',
    icon: Gift,
    targetAudience: 'gift buyers, anniversaries, weddings, new parents',
  },
  {
    id: 'travel-memories',
    title: 'Travel Memories',
    description: 'Turn your adventures into gallery-worthy art. Favorite vacation spots, bucket list destinations, study abroad cities.',
    icon: Plane,
    targetAudience: 'travelers, digital nomads, adventure seekers',
  },
  {
    id: 'real-estate',
    title: 'Real Estate Marketing',
    description: 'Show off neighborhood walkability and local character. Stand out with custom neighborhood maps for listings.',
    icon: Building2,
    targetAudience: 'realtors, property managers, real estate marketing',
  },
  {
    id: 'events',
    title: 'Event Souvenirs',
    description: 'Race routes, festival maps, conference cities, reunion locations—commemorate events with custom cartography.',
    icon: Calendar,
    targetAudience: 'event planners, race organizers, wedding planners',
  },
  {
    id: 'business',
    title: 'Business Branding',
    description: 'Local shops showcasing their community roots. Cafes, breweries, and boutiques connecting with their neighborhood.',
    icon: Store,
    targetAudience: 'small business owners, local retailers, coffee shops',
  },
];

/**
 * Get a specific use case by ID
 */
export function getUseCase(id: string): UseCase | undefined {
  return useCases.find(useCase => useCase.id === id);
}

/**
 * Get a specific style comparison by ID
 */
export function getStyleComparison(id: string): StyleComparison | undefined {
  return styleComparisons.find(comparison => comparison.id === id);
}
