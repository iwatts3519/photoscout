/**
 * Hook for managing recent searches in localStorage
 */

import { useEffect } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import type { RecentSearch } from '@/src/types/geocoding.types';

const STORAGE_KEY = 'photoscout:recent-searches';
const MAX_RECENT_SEARCHES = 10;

/**
 * Load recent searches from localStorage
 */
function loadRecentSearches(): RecentSearch[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const searches = JSON.parse(stored) as RecentSearch[];

    // Validate and filter out invalid entries
    return searches.filter(
      (search) =>
        search &&
        typeof search.query === 'string' &&
        search.result &&
        typeof search.result.lat === 'number' &&
        typeof search.result.lng === 'number' &&
        typeof search.timestamp === 'number'
    );
  } catch (error) {
    console.error('Failed to load recent searches:', error);
    return [];
  }
}

/**
 * Save recent searches to localStorage
 */
function saveRecentSearches(searches: RecentSearch[]): void {
  if (typeof window === 'undefined') return;

  try {
    // Only keep the most recent searches
    const toSave = searches.slice(0, MAX_RECENT_SEARCHES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
  } catch (error) {
    console.error('Failed to save recent searches:', error);
  }
}

/**
 * Hook to sync recent searches with localStorage
 * Call this in a top-level component (e.g., AppShell)
 */
export function useRecentSearches(): void {
  const { recentSearches, setRecentSearches } = useMapStore();

  // Load from localStorage on mount
  useEffect(() => {
    const stored = loadRecentSearches();
    if (stored.length > 0) {
      setRecentSearches(stored);
    }
  }, [setRecentSearches]);

  // Save to localStorage when recentSearches changes
  useEffect(() => {
    // Only save if we have searches (don't overwrite with empty on initial load)
    if (recentSearches.length > 0) {
      saveRecentSearches(recentSearches);
    }
  }, [recentSearches]);
}

/**
 * Clear all recent searches
 */
export function clearRecentSearches(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
