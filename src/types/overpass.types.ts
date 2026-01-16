/**
 * Overpass API Types
 * API Docs: https://wiki.openstreetmap.org/wiki/Overpass_API
 * Overpass QL: https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_QL
 */

// ============================================================================
// POI Categories
// ============================================================================

/**
 * Supported POI types for photographers
 */
export type POIType = 'parking' | 'cafe' | 'viewpoint' | 'toilet' | 'information';

/**
 * POI category metadata
 */
export interface POICategory {
  type: POIType;
  label: string;
  icon: string;
  color: string;
  osmTags: Record<string, string | string[]>;
}

/**
 * POI category definitions
 */
export const POI_CATEGORIES: Record<POIType, POICategory> = {
  parking: {
    type: 'parking',
    label: 'Parking',
    icon: 'P',
    color: '#3b82f6', // blue-500
    osmTags: {
      amenity: 'parking',
    },
  },
  cafe: {
    type: 'cafe',
    label: 'Cafes',
    icon: 'C',
    color: '#f59e0b', // amber-500
    osmTags: {
      amenity: ['cafe', 'restaurant'],
    },
  },
  viewpoint: {
    type: 'viewpoint',
    label: 'Viewpoints',
    icon: 'V',
    color: '#8b5cf6', // violet-500
    osmTags: {
      tourism: 'viewpoint',
    },
  },
  toilet: {
    type: 'toilet',
    label: 'Toilets',
    icon: 'T',
    color: '#06b6d4', // cyan-500
    osmTags: {
      amenity: 'toilets',
    },
  },
  information: {
    type: 'information',
    label: 'Information',
    icon: 'i',
    color: '#10b981', // emerald-500
    osmTags: {
      tourism: 'information',
    },
  },
};

// ============================================================================
// Overpass API Request Types
// ============================================================================

/**
 * Parameters for Overpass API query
 */
export interface OverpassQueryParams {
  /** Center latitude */
  lat: number;
  /** Center longitude */
  lng: number;
  /** Search radius in meters */
  radiusMeters: number;
  /** POI types to search for */
  poiTypes: POIType[];
}

// ============================================================================
// Overpass API Response Types
// ============================================================================

/**
 * OSM element tags (key-value pairs)
 */
export interface OSMTags {
  name?: string;
  amenity?: string;
  tourism?: string;
  description?: string;
  website?: string;
  phone?: string;
  opening_hours?: string;
  operator?: string;
  [key: string]: string | undefined;
}

/**
 * Overpass API element (node, way, or relation)
 */
export interface OverpassElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  tags?: OSMTags;
  // For ways and relations, center coordinates
  center?: {
    lat: number;
    lon: number;
  };
  // For ways, list of nodes
  nodes?: number[];
  // For relations, list of members
  members?: Array<{
    type: string;
    ref: number;
    role: string;
  }>;
}

/**
 * Overpass API response
 */
export interface OverpassResponse {
  version: number;
  generator: string;
  osm3s: {
    timestamp_osm_base: string;
    copyright: string;
  };
  elements: OverpassElement[];
}

/**
 * Overpass API error response
 */
export interface OverpassError {
  remark: string;
}

// ============================================================================
// Application Types
// ============================================================================

/**
 * Processed POI data for display in the app
 */
export interface POI {
  /** Unique identifier (OSM type + id) */
  id: string;
  /** POI type category */
  type: POIType;
  /** POI name */
  name: string;
  /** POI description (if available) */
  description?: string;
  /** Coordinates */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** Distance from search center in meters */
  distance?: number;
  /** Additional metadata */
  metadata?: {
    website?: string;
    phone?: string;
    openingHours?: string;
    operator?: string;
  };
  /** OSM element ID */
  osmId: number;
  /** OSM element type */
  osmType: 'node' | 'way' | 'relation';
}

/**
 * POI filter state
 */
export interface POIFilters {
  /** Enabled POI types */
  enabledTypes: POIType[];
  /** Whether to show POIs on map */
  showPOIs: boolean;
}
