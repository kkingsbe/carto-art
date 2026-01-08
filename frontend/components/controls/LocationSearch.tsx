import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { searchLocation } from '@/lib/geocoding/nominatim';
import type { PosterLocation } from '@/types/poster';
import { cn } from '@/lib/utils';
import { ControlInput } from '@/components/ui/control-components';
import { trackEventAction } from '@/lib/actions/events';

interface LocationSearchProps {
  onLocationSelect: (location: PosterLocation) => void;
  currentLocation: PosterLocation;
}

type SearchHit = {
  id: number;
  location: PosterLocation;
};

const MIN_QUERY_LEN = 3;
const DEBOUNCE_MS = 350;
const CACHE_TTL_MS = 5 * 60 * 1000;

// Deduplicate results with identical name+subtitle to reduce cognitive load
const deduplicateResults = (hits: SearchHit[]): SearchHit[] => {
  const seen = new Set<string>();
  return hits.filter(hit => {
    const key = `${hit.location.name}|${hit.location.subtitle || ''}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

export function LocationSearch({ onLocationSelect, currentLocation }: LocationSearchProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);

  const [query, setQuery] = useState(currentLocation?.name || '');
  const [results, setResults] = useState<SearchHit[]>([]);
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const requestSeq = useRef(0);

  const cacheRef = useRef(
    new Map<string, { storedAt: number; hits: SearchHit[] }>()
  );

  const normalizedQuery = useMemo(() => query.trim().replace(/\s+/g, ' '), [query]);

  const close = useCallback(() => {
    setIsOpen(false);
    setActiveIndex(-1);
  }, []);

  const handleSelect = useCallback(
    (location: PosterLocation) => {
      onLocationSelect(location);
      setQuery(location.name);

      trackEventAction({
        eventType: 'search_location',
        eventName: location.name,
        metadata: {
          subtitle: location.subtitle,
          center: location.center,
          latency_ms: lastSearchLatencyRef.current,
        }
      });

      close();
    },
    [close, onLocationSelect]
  );

  const lastSearchLatencyRef = useRef<number | null>(null);

  const performSearch = useCallback(async (searchQuery: string) => {
    const q = searchQuery.trim();

    // Skip redundant search if query matches active location name
    if (q === currentLocation?.name) {
      setError(null);
      setIsLoading(false);
      setResults([]);
      return;
    }

    if (q.length < MIN_QUERY_LEN) {
      abortRef.current?.abort();
      setIsLoading(false);
      setError(null);
      setResults([]);
      close();
      return;
    }

    const cacheKey = q.toLowerCase();
    const cached = cacheRef.current.get(cacheKey);
    if (cached && Date.now() - cached.storedAt < CACHE_TTL_MS) {
      setResults(cached.hits);
      setIsOpen(cached.hits.length > 0);
      setActiveIndex(cached.hits.length > 0 ? 0 : -1);
      setError(null);
      setIsLoading(false);
      // Cache hit - no latency to track
      lastSearchLatencyRef.current = null;
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const seq = ++requestSeq.current;

    setIsLoading(true);
    setError(null);

    // Track search latency
    const startTime = Date.now();

    try {
      const locations = await searchLocation(q, { limit: 5 }, controller.signal);

      // Calculate latency
      const latency = Date.now() - startTime;
      lastSearchLatencyRef.current = latency;

      // If another request started since this one began, ignore this response
      if (seq !== requestSeq.current) return;

      const hits: SearchHit[] = locations.map((loc, index) => ({
        id: index,
        location: loc
      }));

      // Deduplicate to avoid showing nearly identical results
      const uniqueHits = deduplicateResults(hits);

      cacheRef.current.set(cacheKey, { storedAt: Date.now(), hits: uniqueHits });

      setResults(uniqueHits);
      setIsOpen(uniqueHits.length > 0);
      setActiveIndex(uniqueHits.length > 0 ? 0 : -1);
    } catch (err) {
      if (controller.signal.aborted) return;
      setError(err instanceof Error ? err.message : 'Search failed');
      setResults([]);
      close();
      lastSearchLatencyRef.current = null;
    } finally {
      if (seq === requestSeq.current) setIsLoading(false);
    }
  }, [close, currentLocation]);

  // Sync query with currentLocation when it changes externally
  useEffect(() => {
    if (currentLocation?.name && query !== currentLocation.name) {
      setQuery(currentLocation.name);
    }
  }, [currentLocation?.name]); // Only depend on the name to avoid unnecessary updates

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => {
      performSearch(normalizedQuery);
    }, DEBOUNCE_MS);

    return () => clearTimeout(t);
  }, [normalizedQuery, performSearch]);

  // Click-outside to close
  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (e.target instanceof Node && !el.contains(e.target)) close();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [close]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (e.key === 'ArrowDown' || e.key === 'ArrowUp') && results.length > 0) {
      setIsOpen(true);
      setActiveIndex(0);
      e.preventDefault();
      return;
    }

    if (!isOpen) {
      if (e.key === 'Escape') close();
      return;
    }

    if (e.key === 'Escape') {
      close();
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowDown') {
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
      e.preventDefault();
      return;
    }

    if (e.key === 'ArrowUp') {
      setActiveIndex((i) => Math.max(i - 1, 0));
      e.preventDefault();
      return;
    }

    if (e.key === 'Enter') {
      const hit = results[activeIndex];
      if (hit) handleSelect(hit.location);
      e.preventDefault();
      return;
    }
  };

  return (
    <div ref={rootRef} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
        <ControlInput
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onKeyDown}
          onFocus={() => {
            if (results.length > 0) setIsOpen(true);
          }}
          placeholder="Search for a location..."
          aria-autocomplete="list"
          aria-expanded={isOpen}
          aria-controls="location-search-results"
          className="pl-10 pr-10"
        />
        {isLoading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
          </div>
        )}
      </div>

      {query.trim().length > 0 && query.trim().length < MIN_QUERY_LEN && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          Type at least {MIN_QUERY_LEN} characters…
        </p>
      )}

      {error && (
        <p className={cn(
          "mt-2 text-sm",
          error.includes('Service busy')
            ? "text-yellow-600 dark:text-yellow-400 font-medium"
            : "text-red-500"
        )}>
          {error.includes('Service busy')
            ? "Search service is momentarily busy. Please try again."
            : error}
        </p>
      )}

      {isOpen && results.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg dark:bg-gray-800 dark:border-gray-600">
          <ul id="location-search-results" role="listbox" className="py-1 max-h-80 overflow-auto">
            {results.map((hit, index) => {
              const location = hit.location;
              const isActive = index === activeIndex;

              return (
                <li key={hit.id} role="option" aria-selected={isActive}>
                  <button
                    type="button"
                    onMouseEnter={() => setActiveIndex(index)}
                    onClick={() => handleSelect(location)}
                    className={cn(
                      'w-full px-4 py-2 text-left',
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700'
                        : 'hover:bg-gray-100 dark:hover:bg-gray-700',
                      'focus:outline-none'
                    )}
                  >
                    <div className="font-medium text-gray-900 dark:text-white text-sm">{location.name}</div>
                    {location.subtitle && (
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">{location.subtitle}</div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
