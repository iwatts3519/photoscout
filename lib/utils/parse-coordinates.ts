/**
 * Parse coordinates from various formats (PostGIS, object, etc.)
 */

/**
 * Parse coordinates from PostGIS geography format or object
 *
 * Handles:
 * - PostGIS POINT format: "POINT(lng lat)"
 * - Parenthesized format: "(lng,lat)"
 * - Object with lat/lng properties
 *
 * @returns Parsed coordinates or null if parsing fails
 */
export function parseCoordinates(
  coords: unknown
): { lat: number; lng: number } | null {
  if (typeof coords === 'string') {
    // Format: "POINT(lng lat)" or "(lng,lat)"
    const match = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (match) {
      return {
        lng: parseFloat(match[1]),
        lat: parseFloat(match[2]),
      };
    }
  }

  // If it's an object with lat/lng properties
  if (
    coords &&
    typeof coords === 'object' &&
    'lat' in coords &&
    'lng' in coords
  ) {
    return coords as { lat: number; lng: number };
  }

  return null;
}
