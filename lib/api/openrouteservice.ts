/**
 * OpenRouteService API Client
 * Provides routing and directions between locations
 * API Docs: https://openrouteservice.org/dev/#/api-docs/v2/directions
 *
 * Free tier: 2000 requests/day
 */

import { fetchAPI, APIError } from './base';
import {
  getORSProfile,
  decodePolyline,
  type Coordinate,
  type ORSDirectionsResponse,
  type ORSErrorResponse,
  type ORSFeature,
  type RouteGeometry,
  type RouteLeg,
  type RouteCalculation,
  type RouteResult,
} from '@/src/types/routing.types';

// ============================================================================
// Configuration
// ============================================================================

const ORS_BASE_URL = 'https://api.openrouteservice.org/v2/directions';

// Cache routes for 1 hour (routes don't change frequently)
const CACHE_DURATION = 60 * 60 * 1000;

// Get API key from environment
function getAPIKey(): string {
  const apiKey = process.env.OPENROUTESERVICE_API_KEY;
  if (!apiKey) {
    throw new APIError(
      'OpenRouteService API key not configured. Set OPENROUTESERVICE_API_KEY environment variable.'
    );
  }
  return apiKey;
}

// ============================================================================
// Core API Functions
// ============================================================================

/**
 * Calculate a route between multiple coordinates
 * @param coordinates Array of [lng, lat] pairs
 * @param transportMode Transport mode: 'driving', 'walking', or 'cycling'
 * @returns Route calculation result
 */
export async function calculateRoute(
  coordinates: Coordinate[],
  transportMode: string = 'driving'
): Promise<RouteResult> {
  // Validate inputs
  if (coordinates.length < 2) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'At least 2 coordinates are required',
      },
    };
  }

  // Validate each coordinate
  for (const [lng, lat] of coordinates) {
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return {
        success: false,
        error: {
          code: 'INVALID_COORDINATES',
          message: `Invalid coordinates: [${lng}, ${lat}]`,
        },
      };
    }
  }

  try {
    const apiKey = getAPIKey();
    const profile = getORSProfile(transportMode);
    const url = `${ORS_BASE_URL}/${profile}/geojson`;

    // Make API request
    const response = await fetchAPI<ORSDirectionsResponse | ORSErrorResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
          'Accept': 'application/json, application/geo+json',
        },
        body: JSON.stringify({
          coordinates,
          instructions: false,
          geometry: true,
        }),
        cache: true,
        cacheDuration: CACHE_DURATION,
        timeout: 30000,
        retries: 2,
      }
    );

    // Check for error response
    if ('error' in response) {
      return {
        success: false,
        error: {
          code: `ORS_${response.error.code}`,
          message: response.error.message,
        },
      };
    }

    // Parse GeoJSON response
    if (!response.features || response.features.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_ROUTE',
          message: 'No route found between the specified coordinates',
        },
      };
    }

    const feature = response.features[0];
    const result = parseGeoJSONRoute(feature, coordinates, transportMode);

    return {
      success: true,
      data: result,
    };
  } catch (error) {
    // Handle specific API errors
    if (error instanceof APIError) {
      // Rate limit exceeded
      if (error.statusCode === 429) {
        return {
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'API rate limit exceeded. Please try again later.',
          },
        };
      }

      // Unauthorized
      if (error.statusCode === 401 || error.statusCode === 403) {
        return {
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'Invalid or expired API key.',
          },
        };
      }

      return {
        success: false,
        error: {
          code: 'API_ERROR',
          message: error.message,
        },
      };
    }

    // Unknown error
    return {
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error occurred',
      },
    };
  }
}

/**
 * Calculate route between two points
 * Convenience function for simple A-to-B routing
 */
export async function calculateSimpleRoute(
  from: { lat: number; lng: number },
  to: { lat: number; lng: number },
  transportMode: string = 'driving'
): Promise<RouteResult> {
  const coordinates: Coordinate[] = [
    [from.lng, from.lat],
    [to.lng, to.lat],
  ];

  return calculateRoute(coordinates, transportMode);
}

/**
 * Calculate routes for a trip with multiple stops
 * Returns individual leg information for each segment
 */
export async function calculateTripRoute(
  stops: Array<{
    lat: number;
    lng: number;
    name?: string;
  }>,
  transportMode: string = 'driving'
): Promise<RouteResult> {
  if (stops.length < 2) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'At least 2 stops are required',
      },
    };
  }

  // Convert stops to coordinates
  const coordinates: Coordinate[] = stops.map((stop) => [stop.lng, stop.lat]);

  // Calculate route
  const result = await calculateRoute(coordinates, transportMode);

  // Enhance legs with stop names if successful
  if (result.success) {
    result.data.legs = result.data.legs.map((leg, index) => ({
      ...leg,
      from: {
        ...leg.from,
        name: stops[index]?.name,
      },
      to: {
        ...leg.to,
        name: stops[index + 1]?.name,
      },
    }));
  }

  return result;
}

// ============================================================================
// Response Parsing
// ============================================================================

/**
 * Parse GeoJSON response into our RouteCalculation format
 */
function parseGeoJSONRoute(
  feature: ORSFeature,
  coordinates: Coordinate[],
  transportMode: string
): RouteCalculation {
  const { properties, geometry, bbox } = feature;
  const { segments, summary } = properties;

  // Build legs from segments
  const legs: RouteLeg[] = [];
  let legGeometryIndex = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const fromCoord = coordinates[i];
    const toCoord = coordinates[i + 1];

    // Extract geometry for this leg
    const legGeometry = extractLegGeometry(
      geometry,
      legGeometryIndex,
      segment.steps
    );

    // Update index for next leg
    if (segment.steps.length > 0) {
      const lastStep = segment.steps[segment.steps.length - 1];
      legGeometryIndex = lastStep.way_points[1];
    }

    legs.push({
      from: {
        lat: fromCoord[1],
        lng: fromCoord[0],
      },
      to: {
        lat: toCoord[1],
        lng: toCoord[0],
      },
      distance_meters: Math.round(segment.distance),
      duration_seconds: Math.round(segment.duration),
      geometry: legGeometry,
    });
  }

  return {
    legs,
    total_distance_meters: Math.round(summary.distance),
    total_duration_seconds: Math.round(summary.duration),
    bbox: bbox,
    transport_mode: transportMode,
  };
}

/**
 * Extract geometry for a single leg from the full route geometry
 */
function extractLegGeometry(
  fullGeometry: RouteGeometry,
  startIndex: number,
  steps: Array<{ way_points: [number, number] }>
): RouteGeometry {
  // Find the end index from the last step
  let endIndex = startIndex;
  if (steps.length > 0) {
    endIndex = steps[steps.length - 1].way_points[1];
  }

  // Extract coordinates for this leg
  const coordinates = fullGeometry.coordinates.slice(startIndex, endIndex + 1);

  // Ensure we have at least 2 points
  if (coordinates.length < 2) {
    // Fall back to start and end points
    return {
      type: 'LineString',
      coordinates: [
        fullGeometry.coordinates[startIndex] || fullGeometry.coordinates[0],
        fullGeometry.coordinates[endIndex] || fullGeometry.coordinates[fullGeometry.coordinates.length - 1],
      ],
    };
  }

  return {
    type: 'LineString',
    coordinates,
  };
}

// ============================================================================
// Alternative: Encoded Polyline Format (lighter weight)
// ============================================================================

/**
 * Calculate route and return encoded polyline format
 * Use this for lighter payloads when full GeoJSON isn't needed
 */
export async function calculateRouteEncoded(
  coordinates: Coordinate[],
  transportMode: string = 'driving'
): Promise<{
  success: boolean;
  data?: {
    geometry: string; // Encoded polyline
    distance_meters: number;
    duration_seconds: number;
    bbox: [number, number, number, number];
  };
  error?: { code: string; message: string };
}> {
  if (coordinates.length < 2) {
    return {
      success: false,
      error: {
        code: 'INVALID_INPUT',
        message: 'At least 2 coordinates are required',
      },
    };
  }

  try {
    const apiKey = getAPIKey();
    const profile = getORSProfile(transportMode);
    const url = `${ORS_BASE_URL}/${profile}`;

    const response = await fetchAPI<ORSDirectionsResponse | ORSErrorResponse>(
      url,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': apiKey,
        },
        body: JSON.stringify({
          coordinates,
          instructions: false,
        }),
        cache: true,
        cacheDuration: CACHE_DURATION,
        timeout: 30000,
      }
    );

    if ('error' in response) {
      return {
        success: false,
        error: {
          code: `ORS_${response.error.code}`,
          message: response.error.message,
        },
      };
    }

    if (!response.routes || response.routes.length === 0) {
      return {
        success: false,
        error: {
          code: 'NO_ROUTE',
          message: 'No route found',
        },
      };
    }

    const route = response.routes[0];

    return {
      success: true,
      data: {
        geometry: route.geometry,
        distance_meters: Math.round(route.summary.distance),
        duration_seconds: Math.round(route.summary.duration),
        bbox: route.bbox,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: {
        code: 'API_ERROR',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
    };
  }
}

/**
 * Decode an encoded polyline response to coordinates
 * Use with calculateRouteEncoded results
 */
export function decodeRouteGeometry(encoded: string): RouteGeometry {
  return {
    type: 'LineString',
    coordinates: decodePolyline(encoded),
  };
}
