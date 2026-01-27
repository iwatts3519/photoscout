/**
 * OpenRouteService API Types
 * API Documentation: https://openrouteservice.org/dev/#/api-docs/v2/directions
 */

import { z } from 'zod';

// ============================================================================
// Transport Profiles
// ============================================================================

export const ORS_PROFILES = {
  driving: 'driving-car',
  walking: 'foot-walking',
  cycling: 'cycling-regular',
} as const;

export type ORSProfile = (typeof ORS_PROFILES)[keyof typeof ORS_PROFILES];

// Map our transport modes to ORS profiles
export function getORSProfile(transportMode: string): ORSProfile {
  switch (transportMode) {
    case 'driving':
      return ORS_PROFILES.driving;
    case 'walking':
      return ORS_PROFILES.walking;
    case 'cycling':
      return ORS_PROFILES.cycling;
    default:
      return ORS_PROFILES.driving;
  }
}

// ============================================================================
// Request Types
// ============================================================================

// Coordinate pair [lng, lat]
export type Coordinate = [number, number];

// Request body for directions endpoint
export interface ORSDirectionsRequest {
  coordinates: Coordinate[];
  profile?: ORSProfile;
  format?: 'json' | 'geojson';
  units?: 'km' | 'm' | 'mi';
  language?: string;
  geometry?: boolean;
  instructions?: boolean;
  elevation?: boolean;
  continue_straight?: boolean;
  preference?: 'fastest' | 'shortest' | 'recommended';
}

// Zod schema for validation
export const routeRequestSchema = z.object({
  coordinates: z.array(
    z.object({
      lat: z.number().min(-90).max(90),
      lng: z.number().min(-180).max(180),
    })
  ).min(2, 'At least 2 coordinates required'),
  transportMode: z.enum(['driving', 'walking', 'cycling']).default('driving'),
});

export type RouteRequest = z.infer<typeof routeRequestSchema>;

// ============================================================================
// Response Types
// ============================================================================

// GeoJSON LineString geometry
export interface RouteGeometry {
  type: 'LineString';
  coordinates: Coordinate[];
}

// Individual route segment info
export interface ORSSegment {
  distance: number; // meters
  duration: number; // seconds
  steps: ORSStep[];
}

// Navigation step
export interface ORSStep {
  distance: number;
  duration: number;
  type: number;
  instruction: string;
  name: string;
  way_points: [number, number];
}

// Route summary
export interface ORSSummary {
  distance: number; // total distance in meters
  duration: number; // total duration in seconds
}

// Individual route
export interface ORSRoute {
  summary: ORSSummary;
  segments: ORSSegment[];
  bbox: [number, number, number, number]; // [minLng, minLat, maxLng, maxLat]
  geometry: string; // Encoded polyline or GeoJSON
  way_points: number[];
}

// Full API response
export interface ORSDirectionsResponse {
  type?: 'FeatureCollection';
  features?: ORSFeature[];
  routes?: ORSRoute[];
  bbox?: [number, number, number, number];
  metadata: {
    attribution: string;
    service: string;
    timestamp: number;
    query: {
      coordinates: Coordinate[];
      profile: string;
      format: string;
    };
    engine: {
      version: string;
      build_date: string;
      graph_date: string;
    };
  };
}

// GeoJSON Feature format
export interface ORSFeature {
  type: 'Feature';
  bbox: [number, number, number, number];
  properties: {
    segments: ORSSegment[];
    summary: ORSSummary;
    way_points: number[];
  };
  geometry: RouteGeometry;
}

// Error response
export interface ORSErrorResponse {
  error: {
    code: number;
    message: string;
  };
  info?: {
    engine: {
      build_date: string;
      version: string;
    };
    timestamp: number;
  };
}

// ============================================================================
// Simplified Route Types (for our app)
// ============================================================================

// A single leg of a trip (between two stops)
export interface RouteLeg {
  from: {
    lat: number;
    lng: number;
    name?: string;
  };
  to: {
    lat: number;
    lng: number;
    name?: string;
  };
  distance_meters: number;
  duration_seconds: number;
  geometry: RouteGeometry;
}

// Complete route calculation result
export interface RouteCalculation {
  legs: RouteLeg[];
  total_distance_meters: number;
  total_duration_seconds: number;
  bbox: [number, number, number, number]; // For map fitting
  transport_mode: string;
}

// Error result
export interface RouteError {
  code: string;
  message: string;
}

// Result type
export type RouteResult =
  | { success: true; data: RouteCalculation }
  | { success: false; error: RouteError };

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Decode Google Polyline encoded string to coordinates
 * OpenRouteService uses this format by default
 */
export function decodePolyline(encoded: string): Coordinate[] {
  const coordinates: Coordinate[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    // Decode latitude
    let shift = 0;
    let result = 0;
    let byte: number;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += deltaLat;

    // Decode longitude
    shift = 0;
    result = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const deltaLng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += deltaLng;

    // ORS uses precision 5 (divide by 1e5)
    coordinates.push([lng / 1e5, lat / 1e5]);
  }

  return coordinates;
}

/**
 * Convert RouteGeometry to GeoJSON for MapLibre
 */
export function routeToGeoJSON(route: RouteCalculation): GeoJSON.FeatureCollection {
  const features: GeoJSON.Feature[] = route.legs.map((leg, index) => ({
    type: 'Feature',
    properties: {
      leg_index: index,
      distance_meters: leg.distance_meters,
      duration_seconds: leg.duration_seconds,
    },
    geometry: leg.geometry,
  }));

  return {
    type: 'FeatureCollection',
    features,
  };
}

/**
 * Format route summary for display
 */
export function formatRouteSummary(route: RouteCalculation): string {
  const distanceKm = route.total_distance_meters / 1000;
  const durationMins = Math.round(route.total_duration_seconds / 60);

  const hours = Math.floor(durationMins / 60);
  const mins = durationMins % 60;

  const durationStr = hours > 0
    ? `${hours}h ${mins}m`
    : `${mins}m`;

  return `${distanceKm.toFixed(1)} km - ${durationStr}`;
}
