import { useState, useEffect } from 'react';

const ANON_EXPORT_STORAGE_KEY = 'anon_export_usage';
const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000;

interface AnonUsageState {
  count: number;
  firstExportAt: number | null;
}

export function useAnonExportUsage() {
  const [usage, setUsage] = useState<AnonUsageState>({
    count: 0,
    firstExportAt: null
  });

  const loadFromStorage = () => {
    try {
      const stored = localStorage.getItem(ANON_EXPORT_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);

        // Check if 24h window has passed
        if (parsed.firstExportAt && Date.now() - parsed.firstExportAt > TWENTY_FOUR_HOURS_MS) {
          // Reset if window passed
          const newState = { count: 0, firstExportAt: null };
          setUsage(newState);
          localStorage.setItem(ANON_EXPORT_STORAGE_KEY, JSON.stringify(newState));
        } else {
          setUsage(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to load anon export usage', e);
    }
  };

  // Load from storage on mount and listen for changes
  useEffect(() => {
    loadFromStorage();

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === ANON_EXPORT_STORAGE_KEY) {
        loadFromStorage();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const increment = () => {
    // Read fresh from storage to avoid race conditions with other tabs
    let current: AnonUsageState = { count: 0, firstExportAt: null };
    try {
      const stored = localStorage.getItem(ANON_EXPORT_STORAGE_KEY);
      if (stored) {
        current = JSON.parse(stored);
      }
    } catch (e) {
      console.error('Failed to parse storage in increment', e);
    }

    const now = Date.now();
    let newState: AnonUsageState;

    // Check reset condition again before incrementing
    if (current.firstExportAt && now - current.firstExportAt > TWENTY_FOUR_HOURS_MS) {
      newState = {
        count: 1,
        firstExportAt: now
      };
    } else {
      newState = {
        count: current.count + 1,
        firstExportAt: current.firstExportAt || now
      };
    }

    setUsage(newState);
    localStorage.setItem(ANON_EXPORT_STORAGE_KEY, JSON.stringify(newState));
  };

  const getNextAvailableAt = (): string | null => {
    if (!usage.firstExportAt) return null;
    const expiry = usage.firstExportAt + TWENTY_FOUR_HOURS_MS;
    if (Date.now() > expiry) return null; // Should have reset, but just in case
    return new Date(expiry).toISOString();
  };

  return {
    count: usage.count,
    increment,
    nextAvailableAt: getNextAvailableAt()
  };
}
