/**
 * Server actions for Wikimedia Commons photo discovery
 */

'use server';

import { searchNearbyPhotos } from '@/lib/api/wikimedia';
import type { WikimediaPhoto } from '@/src/types/wikimedia.types';

/**
 * Fetch nearby geotagged photos from Wikimedia Commons
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @param radiusMeters - Search radius in meters (default 5000, max 10000)
 * @param limit - Maximum number of results (default 20, max 50)
 * @returns Array of WikimediaPhoto objects or error
 */
export async function fetchNearbyPhotos(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000,
  limit: number = 20
): Promise<{ data: WikimediaPhoto[] | null; error: string | null }> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return { data: null, error: 'Invalid latitude: must be between -90 and 90' };
    }
    if (longitude < -180 || longitude > 180) {
      return { data: null, error: 'Invalid longitude: must be between -180 and 180' };
    }

    // Validate radius
    if (radiusMeters <= 0 || radiusMeters > 10000) {
      return { data: null, error: 'Invalid radius: must be between 1 and 10000 meters' };
    }

    // Validate limit
    if (limit <= 0 || limit > 50) {
      return { data: null, error: 'Invalid limit: must be between 1 and 50' };
    }

    // Fetch photos from Wikimedia Commons
    const photos = await searchNearbyPhotos(latitude, longitude, radiusMeters, limit);

    return { data: photos, error: null };
  } catch (error) {
    console.error('Error fetching nearby photos:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch nearby photos',
    };
  }
}
