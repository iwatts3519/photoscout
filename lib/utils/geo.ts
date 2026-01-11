/**
 * Geographic utility functions for PhotoScout
 * Uses Haversine formula for distance calculations
 */

export interface Coordinates {
  lat: number;
  lng: number;
}

/**
 * Calculate distance between two points using Haversine formula
 * @param point1 First coordinate
 * @param point2 Second coordinate
 * @returns Distance in meters
 */
export function calculateDistance(point1: Coordinates, point2: Coordinates): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

/**
 * Calculate bearing from point1 to point2
 * @param point1 Start coordinate
 * @param point2 End coordinate
 * @returns Bearing in degrees (0-360)
 */
export function calculateBearing(point1: Coordinates, point2: Coordinates): number {
  const φ1 = (point1.lat * Math.PI) / 180;
  const φ2 = (point2.lat * Math.PI) / 180;
  const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

  const y = Math.sin(Δλ) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
  const θ = Math.atan2(y, x);

  return ((θ * 180) / Math.PI + 360) % 360;
}

/**
 * Calculate bounding box for a given center point and radius
 * @param center Center coordinate
 * @param radiusMeters Radius in meters
 * @returns Bounding box [minLng, minLat, maxLng, maxLat]
 */
export function calculateBoundingBox(
  center: Coordinates,
  radiusMeters: number
): [number, number, number, number] {
  const latDelta = (radiusMeters / 111320); // 1 degree of latitude ≈ 111320 meters
  const lngDelta = radiusMeters / (111320 * Math.cos((center.lat * Math.PI) / 180));

  return [
    center.lng - lngDelta, // minLng
    center.lat - latDelta, // minLat
    center.lng + lngDelta, // maxLng
    center.lat + latDelta, // maxLat
  ];
}

/**
 * Format coordinates for display
 * @param coord Coordinate value
 * @param decimals Number of decimal places
 * @returns Formatted coordinate string
 */
export function formatCoordinate(coord: number, decimals: number = 6): string {
  return coord.toFixed(decimals);
}

/**
 * Format distance for display
 * @param meters Distance in meters
 * @returns Formatted distance string (e.g., "1.5 km" or "500 m")
 */
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Check if a point is within a radius of a center point
 * @param point Point to check
 * @param center Center point
 * @param radiusMeters Radius in meters
 * @returns True if point is within radius
 */
export function isWithinRadius(
  point: Coordinates,
  center: Coordinates,
  radiusMeters: number
): boolean {
  const distance = calculateDistance(point, center);
  return distance <= radiusMeters;
}

/**
 * Convert compass bearing to cardinal direction
 * @param bearing Bearing in degrees (0-360)
 * @returns Cardinal direction (N, NE, E, SE, S, SW, W, NW)
 */
export function bearingToCardinal(bearing: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(((bearing % 360) / 45)) % 8;
  return directions[index];
}
