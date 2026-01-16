/**
 * Server actions for Overpass POI data
 */

'use server';

import { fetchNearbyPOIs, fetchPOIsByType } from '@/lib/api/overpass';
import type { POI, POIType } from '@/src/types/overpass.types';

/**
 * Fetch nearby POIs from Overpass API
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @param radiusMeters - Search radius in meters (default 5000, max 10000)
 * @param poiTypes - Array of POI types to fetch (default all types)
 * @returns Array of POI objects or error
 */
export async function fetchPOIs(
  latitude: number,
  longitude: number,
  radiusMeters: number = 5000,
  poiTypes?: POIType[]
): Promise<{ data: POI[] | null; error: string | null }> {
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

    // Fetch POIs from Overpass API
    const pois = await fetchNearbyPOIs(latitude, longitude, radiusMeters, poiTypes);

    return { data: pois, error: null };
  } catch (error) {
    console.error('Error fetching POIs:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch POIs',
    };
  }
}

/**
 * Fetch POIs of a specific type
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @param poiType - POI type to fetch
 * @param radiusMeters - Search radius in meters (default 5000, max 10000)
 * @returns Array of POI objects or error
 */
export async function fetchPOIByType(
  latitude: number,
  longitude: number,
  poiType: POIType,
  radiusMeters: number = 5000
): Promise<{ data: POI[] | null; error: string | null }> {
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

    // Fetch POIs from Overpass API
    const pois = await fetchPOIsByType(latitude, longitude, poiType, radiusMeters);

    return { data: pois, error: null };
  } catch (error) {
    console.error('Error fetching POIs by type:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch POIs',
    };
  }
}
