/**
 * Nominatim (OpenStreetMap) Geocoding API client
 * Free, no API key required
 * Rate limit: 1 request per second (we cache for 24 hours)
 * https://nominatim.org/release-docs/latest/api/Search/
 */

import { fetchAPI, buildURL, APIError } from './base';
import type {
  NominatimResult,
  GeocodeResult,
  GeocodeSearchInput,
} from '@/src/types/geocoding.types';

const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org/search';

// Cache duration: 24 hours (place names don't change often)
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Transform Nominatim API result to app-specific format
 */
function transformNominatimResult(result: NominatimResult): GeocodeResult {
  // Create short name from display name
  const nameParts = result.display_name.split(', ');
  const shortName = nameParts.slice(0, 2).join(', ');

  return {
    id: `${result.osm_type}-${result.osm_id}`,
    lat: parseFloat(result.lat),
    lng: parseFloat(result.lon),
    displayName: result.display_name,
    shortName,
    placeType: result.type,
    importance: result.importance,
    address: result.address
      ? {
          road: result.address.road,
          city:
            result.address.city ||
            result.address.town ||
            result.address.village,
          county: result.address.county,
          postcode: result.address.postcode,
          country: result.address.country,
        }
      : undefined,
    boundingBox: result.boundingbox
      ? {
          south: parseFloat(result.boundingbox[0]),
          north: parseFloat(result.boundingbox[1]),
          west: parseFloat(result.boundingbox[2]),
          east: parseFloat(result.boundingbox[3]),
        }
      : undefined,
  };
}

/**
 * Search for locations using Nominatim geocoding API
 */
export async function geocodeSearch(
  input: GeocodeSearchInput
): Promise<GeocodeResult[]> {
  const { query, countryCode = 'gb', limit = 8 } = input;

  // Validate input
  if (!query || query.trim().length === 0) {
    throw new APIError('Search query is required', 400, NOMINATIM_BASE_URL);
  }

  if (query.length > 200) {
    throw new APIError(
      'Search query is too long (max 200 characters)',
      400,
      NOMINATIM_BASE_URL
    );
  }

  const url = buildURL(NOMINATIM_BASE_URL, {
    q: query.trim(),
    format: 'json',
    addressdetails: 1,
    limit,
    countrycodes: countryCode,
  });

  try {
    const results = await fetchAPI<NominatimResult[]>(url, {
      cache: true,
      cacheDuration: CACHE_DURATION,
      timeout: 15000, // 15 second timeout
      headers: {
        // Nominatim requires User-Agent
        'User-Agent': 'PhotoScout/1.0 (photography location planning app)',
        Accept: 'application/json',
      },
    });

    if (!Array.isArray(results)) {
      throw new APIError(
        'Invalid response format from geocoding API',
        500,
        NOMINATIM_BASE_URL
      );
    }

    return results.map(transformNominatimResult);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
      500,
      NOMINATIM_BASE_URL
    );
  }
}

/**
 * Reverse geocode coordinates to address
 */
export async function reverseGeocode(
  lat: number,
  lng: number
): Promise<GeocodeResult | null> {
  // Validate coordinates
  if (lat < -90 || lat > 90) {
    throw new APIError('Invalid latitude (must be -90 to 90)', 400);
  }
  if (lng < -180 || lng > 180) {
    throw new APIError('Invalid longitude (must be -180 to 180)', 400);
  }

  const url = buildURL('https://nominatim.openstreetmap.org/reverse', {
    lat,
    lon: lng,
    format: 'json',
    addressdetails: 1,
  });

  try {
    const result = await fetchAPI<NominatimResult>(url, {
      cache: true,
      cacheDuration: CACHE_DURATION,
      timeout: 15000,
      headers: {
        'User-Agent': 'PhotoScout/1.0 (photography location planning app)',
        Accept: 'application/json',
      },
    });

    if (!result || !result.lat || !result.lon) {
      return null;
    }

    return transformNominatimResult(result);
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Reverse geocoding failed: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}
