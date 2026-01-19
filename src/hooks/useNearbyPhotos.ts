/**
 * useNearbyPhotos Hook
 * Fetches nearby photos for the selected location
 * Provides photo data with deduplication and caching
 */

import { useState, useEffect, useRef } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import { fetchNearbyPhotos } from '@/app/actions/wikimedia';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';

interface UseNearbyPhotosOptions {
  /** Maximum number of photos to fetch (default: 8) */
  limit?: number;
  /** Whether to enable fetching (default: true) */
  enabled?: boolean;
  /** Debounce delay in ms (default: 500) */
  debounceMs?: number;
}

interface UseNearbyPhotosReturn {
  photos: WikimediaPhoto[];
  isLoading: boolean;
  error: string | null;
  photoCount: number;
}

export function useNearbyPhotos(options: UseNearbyPhotosOptions = {}): UseNearbyPhotosReturn {
  const { limit = 8, enabled = true, debounceMs = 500 } = options;

  const { selectedLocation, radius } = useMapStore();
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const [photos, setPhotos] = useState<WikimediaPhoto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !selectedLocation) {
      setPhotos([]);
      setError(null);
      return;
    }

    // Clear any existing debounce timer
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    setIsLoading(true);

    debounceRef.current = setTimeout(async () => {
      try {
        const result = await fetchNearbyPhotos(
          selectedLocation.lat,
          selectedLocation.lng,
          Math.min(radius, 5000), // Limit to 5km
          limit
        );

        if (result.error) {
          setError(result.error);
          setPhotos([]);
        } else {
          // Deduplicate photos by ID
          const data = result.data || [];
          const uniquePhotos = data.filter(
            (photo, index, self) =>
              index === self.findIndex((p) => p.id === photo.id)
          );
          setPhotos(uniquePhotos);
          setError(null);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch photos');
        setPhotos([]);
      } finally {
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [enabled, selectedLocation, radius, limit, debounceMs]);

  return {
    photos,
    isLoading,
    error,
    photoCount: photos.length,
  };
}
