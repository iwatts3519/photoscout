/**
 * Geocoding types for Nominatim API integration
 */

/** Nominatim API raw response */
export interface NominatimResult {
  osm_id: number;
  osm_type: 'node' | 'way' | 'relation';
  place_id: number;
  lat: string; // String in API response
  lon: string;
  display_name: string;
  type: string;
  class: string;
  importance: number;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    village?: string;
    town?: string;
    city?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  boundingbox?: [string, string, string, string]; // [south, north, west, east]
}

/** App-specific geocoding result */
export interface GeocodeResult {
  id: string;
  lat: number;
  lng: number;
  displayName: string;
  shortName: string; // Simplified name for display
  placeType: string;
  importance: number;
  address?: {
    road?: string;
    city?: string;
    county?: string;
    postcode?: string;
    country?: string;
  };
  boundingBox?: {
    south: number;
    north: number;
    west: number;
    east: number;
  };
}

/** Recent search entry stored in localStorage */
export interface RecentSearch {
  query: string;
  result: GeocodeResult;
  timestamp: number;
}

/** Search input for geocoding */
export interface GeocodeSearchInput {
  query: string;
  /** Optional bias towards UK results */
  countryCode?: string;
  /** Limit number of results */
  limit?: number;
}
