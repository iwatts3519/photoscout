/**
 * Server actions for geocoding/location search
 */

'use server';

import { z } from 'zod';
import { geocodeSearch, reverseGeocode } from '@/lib/api/geocoding';
import type { GeocodeResult } from '@/src/types/geocoding.types';

/** Schema for search input validation */
const searchSchema = z.object({
  query: z
    .string()
    .min(1, 'Search query is required')
    .max(200, 'Search query is too long'),
  countryCode: z.string().length(2).optional().default('gb'),
  limit: z.number().min(1).max(20).optional().default(8),
});

/** Schema for reverse geocode input */
const reverseSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

/**
 * Search for locations by name/address
 *
 * @param query - Search query (place name, address, etc.)
 * @param options - Optional search configuration
 * @returns Geocode results or error
 */
export async function searchLocations(
  query: string,
  options?: { countryCode?: string; limit?: number }
): Promise<{ data: GeocodeResult[] | null; error: string | null }> {
  try {
    // Validate input
    const result = searchSchema.safeParse({
      query,
      countryCode: options?.countryCode,
      limit: options?.limit,
    });

    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const { query: validQuery, countryCode, limit } = result.data;

    // Call geocoding API
    const results = await geocodeSearch({
      query: validQuery,
      countryCode,
      limit,
    });

    return { data: results, error: null };
  } catch (error) {
    console.error('Error searching locations:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Location search failed',
    };
  }
}

/**
 * Get address/place name from coordinates
 *
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Geocode result or error
 */
export async function getLocationName(
  lat: number,
  lng: number
): Promise<{ data: GeocodeResult | null; error: string | null }> {
  try {
    // Validate coordinates
    const result = reverseSchema.safeParse({ lat, lng });

    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    // Call reverse geocoding API
    const location = await reverseGeocode(lat, lng);

    return { data: location, error: null };
  } catch (error) {
    console.error('Error getting location name:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to get location name',
    };
  }
}
