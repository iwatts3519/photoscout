import type { LngLatBoundsLike } from 'maplibre-gl';

/**
 * Convert a route bbox [minLng, minLat, maxLng, maxLat] to MapLibre LngLatBoundsLike
 */
export function routeBboxToLngLatBounds(
  bbox: [number, number, number, number]
): LngLatBoundsLike {
  return [
    [bbox[0], bbox[1]], // [minLng, minLat]
    [bbox[2], bbox[3]], // [maxLng, maxLat]
  ];
}

/**
 * Calculate bounds from an array of stop coordinates.
 * Returns null if fewer than 2 stops.
 */
export function stopsBoundsFromCoordinates(
  stops: { coordinates: { lat: number; lng: number } }[]
): LngLatBoundsLike | null {
  if (stops.length < 2) return null;

  let minLng = Infinity;
  let minLat = Infinity;
  let maxLng = -Infinity;
  let maxLat = -Infinity;

  for (const stop of stops) {
    const { lng, lat } = stop.coordinates;
    if (lng < minLng) minLng = lng;
    if (lat < minLat) minLat = lat;
    if (lng > maxLng) maxLng = lng;
    if (lat > maxLat) maxLat = lat;
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat],
  ];
}

/**
 * Return an empty GeoJSON FeatureCollection
 */
export function emptyFeatureCollection(): GeoJSON.FeatureCollection {
  return { type: 'FeatureCollection', features: [] };
}
