/**
 * Wikimedia Commons API Types
 * API Docs: https://www.mediawiki.org/wiki/API:Main_page
 * Geosearch: https://www.mediawiki.org/wiki/API:Geosearch
 * Imageinfo: https://www.mediawiki.org/wiki/API:Imageinfo
 */

// ============================================================================
// Geosearch API Types
// ============================================================================

export interface WikimediaGeosearchParams {
  /** Latitude coordinate */
  lat: number;
  /** Longitude coordinate */
  lon: number;
  /** Search radius in meters (max 10000) */
  radius: number;
  /** Maximum number of results (max 500) */
  limit?: number;
  /** Namespace to search (6 = File namespace for images) */
  namespace?: number;
}

export interface WikimediaGeosearchPage {
  pageid: number;
  ns: number;
  title: string;
  lat: number;
  lon: number;
  dist: number; // Distance in meters
  primary?: string; // Primary image if available
}

export interface WikimediaGeosearchResponse {
  batchcomplete?: string;
  query: {
    geosearch: WikimediaGeosearchPage[];
  };
}

// ============================================================================
// Imageinfo API Types
// ============================================================================

export interface WikimediaImageinfoParams {
  /** Pipe-separated list of image titles */
  titles: string;
  /** Properties to fetch */
  iiprop?: string;
  /** URL width for thumbnail */
  iiurlwidth?: number;
  /** URL height for thumbnail */
  iiurlheight?: number;
}

export interface WikimediaImageInfo {
  timestamp: string;
  user: string;
  url: string; // Full size image URL
  descriptionurl: string; // Commons page URL
  descriptionshorturl?: string;
  width: number;
  height: number;
  size: number; // File size in bytes
  thumburl?: string; // Thumbnail URL
  thumbwidth?: number;
  thumbheight?: number;
  extmetadata?: WikimediaExtMetadata;
}

export interface WikimediaExtMetadata {
  ObjectName?: { value: string };
  ImageDescription?: { value: string };
  Artist?: { value: string };
  Credit?: { value: string };
  LicenseShortName?: { value: string };
  UsageTerms?: { value: string };
  AttributionRequired?: { value: string };
  Copyrighted?: { value: string };
  DateTime?: { value: string };
  DateTimeOriginal?: { value: string };
  GPSLatitude?: { value: string };
  GPSLongitude?: { value: string };
}

export interface WikimediaPage {
  pageid: number;
  ns: number;
  title: string;
  imagerepository: string;
  imageinfo?: WikimediaImageInfo[];
}

export interface WikimediaImageinfoResponse {
  batchcomplete?: string;
  query: {
    pages: Record<string, WikimediaPage>;
  };
}

// ============================================================================
// Application Types
// ============================================================================

/**
 * Processed photo data for display in the app
 */
export interface WikimediaPhoto {
  /** Wikimedia page ID */
  id: number;
  /** Image title (e.g., "File:Example.jpg") */
  title: string;
  /** Photo description/caption */
  description: string;
  /** Photographer/artist name */
  photographer: string;
  /** License (e.g., "CC BY-SA 4.0") */
  license: string;
  /** Full-size image URL */
  imageUrl: string;
  /** Thumbnail URL (400px width) */
  thumbnailUrl: string;
  /** Commons page URL for attribution */
  pageUrl: string;
  /** Photo coordinates */
  coordinates: {
    lat: number;
    lng: number;
  };
  /** Distance from search point in meters */
  distance: number;
  /** Original dimensions */
  dimensions: {
    width: number;
    height: number;
  };
  /** Date photo was taken (if available) */
  dateTaken?: string;
}

/**
 * Error response from Wikimedia API
 */
export interface WikimediaError {
  error: {
    code: string;
    info: string;
  };
}
