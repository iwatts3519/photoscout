/**
 * Overpass API Client
 * Fetches points of interest (POIs) from OpenStreetMap via Overpass API
 * API Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 */

import { fetchAPI, APIError } from './base';
import {
  POI_CATEGORIES,
  type OverpassQueryParams,
  type OverpassResponse,
  type OverpassElement,
  type OverpassError,
  type POI,
  type POIType,
} from '@/src/types/overpass.types';

const OVERPASS_API_URL = 'https://overpass-api.de/api/interpreter';

// Cache for 24 hours as specified in PLAN.md
const CACHE_DURATION = 24 * 60 * 60 * 1000;

/**
 * Build Overpass QL query for fetching POIs
 */
function buildOverpassQuery(params: OverpassQueryParams): string {
  const { lat, lng, radiusMeters, poiTypes } = params;

  // Build filter clauses for each POI type
  const filters: string[] = [];

  for (const poiType of poiTypes) {
    const category = POI_CATEGORIES[poiType];
    const { osmTags } = category;

    for (const [key, value] of Object.entries(osmTags)) {
      if (Array.isArray(value)) {
        // Multiple values (e.g., amenity=cafe|restaurant)
        const valuePattern = value.join('|');
        filters.push(`node["${key}"~"^(${valuePattern})$"](around:${radiusMeters},${lat},${lng});`);
        filters.push(`way["${key}"~"^(${valuePattern})$"](around:${radiusMeters},${lat},${lng});`);
      } else {
        // Single value (e.g., amenity=parking)
        filters.push(`node["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`);
        filters.push(`way["${key}"="${value}"](around:${radiusMeters},${lat},${lng});`);
      }
    }
  }

  // Combine all filters with union
  const unionQuery = filters.join('\n  ');

  // Build complete Overpass QL query
  const query = `
[out:json][timeout:25];
(
  ${unionQuery}
);
out center;
  `.trim();

  return query;
}

/**
 * Determine POI type from OSM tags
 */
function determinePOIType(tags: Record<string, string | undefined>): POIType | null {
  // Check each category to find a match
  for (const [type, category] of Object.entries(POI_CATEGORIES)) {
    const { osmTags } = category;

    for (const [key, value] of Object.entries(osmTags)) {
      const tagValue = tags[key];
      if (!tagValue) continue;

      if (Array.isArray(value)) {
        // Check if tag value matches any in the array
        if (value.includes(tagValue)) {
          return type as POIType;
        }
      } else {
        // Check for exact match
        if (tagValue === value) {
          return type as POIType;
        }
      }
    }
  }

  return null;
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Transform Overpass elements into POI objects
 */
function transformElementsToPOIs(
  elements: OverpassElement[],
  centerLat: number,
  centerLng: number
): POI[] {
  const pois: POI[] = [];

  for (const element of elements) {
    const tags = element.tags || {};

    // Determine POI type
    const poiType = determinePOIType(tags);
    if (!poiType) continue;

    // Get coordinates (use center for ways/relations)
    let lat: number | undefined;
    let lng: number | undefined;

    if (element.type === 'node') {
      lat = element.lat;
      lng = element.lon;
    } else if (element.center) {
      lat = element.center.lat;
      lng = element.center.lon;
    }

    if (!lat || !lng) continue;

    // Calculate distance from center
    const distance = calculateDistance(centerLat, centerLng, lat, lng);

    // Extract name (required)
    const name = tags.name || `Unnamed ${POI_CATEGORIES[poiType].label}`;

    // Build POI object
    const poi: POI = {
      id: `${element.type}/${element.id}`,
      type: poiType,
      name,
      description: tags.description,
      coordinates: {
        lat,
        lng,
      },
      distance: Math.round(distance),
      metadata: {
        website: tags.website,
        phone: tags.phone,
        openingHours: tags.opening_hours,
        operator: tags.operator,
      },
      osmId: element.id,
      osmType: element.type,
    };

    pois.push(poi);
  }

  return pois;
}

/**
 * Fetch nearby POIs from Overpass API
 * @param lat Center latitude
 * @param lng Center longitude
 * @param radiusMeters Search radius in meters (max 10000)
 * @param poiTypes Array of POI types to search for
 * @returns Array of POI objects
 */
export async function fetchNearbyPOIs(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
  poiTypes: POIType[] = ['parking', 'cafe', 'viewpoint', 'toilet', 'information']
): Promise<POI[]> {
  // Validate inputs
  if (lat < -90 || lat > 90) {
    throw new APIError('Invalid latitude: must be between -90 and 90');
  }
  if (lng < -180 || lng > 180) {
    throw new APIError('Invalid longitude: must be between -180 and 180');
  }
  if (radiusMeters <= 0 || radiusMeters > 10000) {
    throw new APIError('Invalid radius: must be between 1 and 10000 meters');
  }
  if (poiTypes.length === 0) {
    throw new APIError('At least one POI type must be specified');
  }

  try {
    // Build Overpass QL query
    const query = buildOverpassQuery({
      lat,
      lng,
      radiusMeters,
      poiTypes,
    });

    // Fetch data from Overpass API (POST request with query as body)
    const response = await fetchAPI<OverpassResponse | OverpassError>(
      OVERPASS_API_URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
        cache: true,
        cacheDuration: CACHE_DURATION,
        timeout: 30000, // 30 second timeout for Overpass
      }
    );

    // Check for API error response
    if ('remark' in response) {
      throw new APIError(
        `Overpass API error: ${response.remark}`,
        undefined,
        OVERPASS_API_URL
      );
    }

    // Transform elements to POIs
    const pois = transformElementsToPOIs(response.elements, lat, lng);

    // Sort by distance (closest first)
    pois.sort((a, b) => (a.distance || 0) - (b.distance || 0));

    return pois;
  } catch (error) {
    // Re-throw APIErrors
    if (error instanceof APIError) {
      throw error;
    }

    // Wrap other errors
    throw new APIError(
      `Failed to fetch POIs: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

/**
 * Fetch POIs of a specific type
 * @param lat Center latitude
 * @param lng Center longitude
 * @param poiType POI type to search for
 * @param radiusMeters Search radius in meters (default 5000, max 10000)
 * @returns Array of POI objects
 */
export async function fetchPOIsByType(
  lat: number,
  lng: number,
  poiType: POIType,
  radiusMeters: number = 5000
): Promise<POI[]> {
  return fetchNearbyPOIs(lat, lng, radiusMeters, [poiType]);
}
