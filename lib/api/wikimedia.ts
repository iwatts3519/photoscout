/**
 * Wikimedia Commons API Client
 * Fetches nearby geotagged photos from Wikimedia Commons
 * API Docs: https://www.mediawiki.org/wiki/API:Main_page
 */

import { fetchAPI, buildURL, APIError } from './base';
import type {
  WikimediaGeosearchParams,
  WikimediaGeosearchResponse,
  WikimediaImageinfoResponse,
  WikimediaPhoto,
  WikimediaError,
} from '@/src/types/wikimedia.types';

const WIKIMEDIA_API_BASE = 'https://commons.wikimedia.org/w/api.php';

// Cache for 1 hour as specified in PLAN.md
const CACHE_DURATION = 60 * 60 * 1000;

// User-Agent header required by Wikimedia API
// See: https://meta.wikimedia.org/wiki/User-Agent_policy
const USER_AGENT = 'PhotoScout/1.0 (https://github.com/iwatts3519/photoscout; photography location planning app)';

/**
 * Search for geotagged images near a location
 */
async function geosearch(
  params: WikimediaGeosearchParams
): Promise<WikimediaGeosearchResponse> {
  const url = buildURL(WIKIMEDIA_API_BASE, {
    action: 'query',
    list: 'geosearch',
    gscoord: `${params.lat}|${params.lon}`,
    gsradius: params.radius,
    gslimit: params.limit ?? 50,
    gsnamespace: params.namespace ?? 6, // 6 = File namespace
    gsprimary: 'all',
    format: 'json',
    origin: '*', // CORS
  });

  try {
    const response = await fetchAPI<WikimediaGeosearchResponse>(url, {
      cache: true,
      cacheDuration: CACHE_DURATION,
      timeout: 15000,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    // Check for API error response
    if ('error' in response) {
      const error = response as unknown as WikimediaError;
      throw new APIError(
        `Wikimedia geosearch failed: ${error.error.info}`,
        undefined,
        url
      );
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to fetch nearby photos: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      url
    );
  }
}

/**
 * Get detailed image information for a list of titles
 */
async function getImageInfo(
  titles: string[]
): Promise<WikimediaImageinfoResponse> {
  if (titles.length === 0) {
    return {
      query: {
        pages: {},
      },
    };
  }

  const url = buildURL(WIKIMEDIA_API_BASE, {
    action: 'query',
    titles: titles.join('|'),
    prop: 'imageinfo',
    iiprop: 'timestamp|user|url|size|extmetadata',
    iiurlwidth: 400, // Thumbnail width
    format: 'json',
    origin: '*', // CORS
  });

  try {
    const response = await fetchAPI<WikimediaImageinfoResponse>(url, {
      cache: true,
      cacheDuration: CACHE_DURATION,
      timeout: 15000,
      headers: {
        'User-Agent': USER_AGENT,
      },
    });

    // Check for API error response
    if ('error' in response) {
      const error = response as unknown as WikimediaError;
      throw new APIError(
        `Wikimedia imageinfo failed: ${error.error.info}`,
        undefined,
        url
      );
    }

    return response;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    throw new APIError(
      `Failed to fetch image details: ${error instanceof Error ? error.message : String(error)}`,
      undefined,
      url
    );
  }
}

/**
 * Extract text content from HTML (for descriptions)
 */
function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim();
}

/**
 * Transform API responses into WikimediaPhoto objects
 */
function transformToPhotos(
  geosearchResults: WikimediaGeosearchResponse,
  imageinfoResponse: WikimediaImageinfoResponse
): WikimediaPhoto[] {
  const photos: WikimediaPhoto[] = [];
  const pages = imageinfoResponse.query.pages;

  for (const geosearchPage of geosearchResults.query.geosearch) {
    // Find matching page in imageinfo results
    const page = Object.values(pages).find(
      (p) => p.title === geosearchPage.title
    );

    if (!page || !page.imageinfo || page.imageinfo.length === 0) {
      continue;
    }

    const imageinfo = page.imageinfo[0];
    const extmetadata = imageinfo.extmetadata;

    // Extract description
    let description = '';
    if (extmetadata?.ImageDescription?.value) {
      description = stripHtml(extmetadata.ImageDescription.value);
    } else if (extmetadata?.ObjectName?.value) {
      description = stripHtml(extmetadata.ObjectName.value);
    }

    // Extract photographer
    let photographer = 'Unknown';
    if (extmetadata?.Artist?.value) {
      photographer = stripHtml(extmetadata.Artist.value);
    } else if (imageinfo.user) {
      photographer = imageinfo.user;
    }

    // Extract license
    const license =
      extmetadata?.LicenseShortName?.value ||
      extmetadata?.UsageTerms?.value ||
      'Unknown License';

    // Extract date taken
    let dateTaken: string | undefined;
    if (extmetadata?.DateTimeOriginal?.value) {
      dateTaken = extmetadata.DateTimeOriginal.value;
    } else if (extmetadata?.DateTime?.value) {
      dateTaken = extmetadata.DateTime.value;
    }

    photos.push({
      id: page.pageid,
      title: page.title,
      description: description || 'No description available',
      photographer,
      license: stripHtml(license),
      imageUrl: imageinfo.url,
      thumbnailUrl: imageinfo.thumburl || imageinfo.url,
      pageUrl: imageinfo.descriptionurl,
      coordinates: {
        lat: geosearchPage.lat,
        lng: geosearchPage.lon,
      },
      distance: Math.round(geosearchPage.dist),
      dimensions: {
        width: imageinfo.width,
        height: imageinfo.height,
      },
      dateTaken,
    });
  }

  return photos;
}

/**
 * Search for nearby geotagged photos from Wikimedia Commons
 * @param lat Latitude
 * @param lng Longitude
 * @param radiusMeters Search radius in meters (max 10000)
 * @param limit Maximum number of results (default 20, max 50)
 * @returns Array of WikimediaPhoto objects
 */
export async function searchNearbyPhotos(
  lat: number,
  lng: number,
  radiusMeters: number = 5000,
  limit: number = 20
): Promise<WikimediaPhoto[]> {
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
  if (limit <= 0 || limit > 50) {
    throw new APIError('Invalid limit: must be between 1 and 50');
  }

  try {
    // Step 1: Search for nearby geotagged images
    const geosearchResponse = await geosearch({
      lat,
      lon: lng,
      radius: radiusMeters,
      limit,
      namespace: 6, // File namespace
    });

    // If no results, return empty array
    if (
      !geosearchResponse.query?.geosearch ||
      geosearchResponse.query.geosearch.length === 0
    ) {
      return [];
    }

    // Step 2: Get detailed image information
    const titles = geosearchResponse.query.geosearch.map((page) => page.title);
    const imageinfoResponse = await getImageInfo(titles);

    // Step 3: Transform into WikimediaPhoto objects
    const photos = transformToPhotos(geosearchResponse, imageinfoResponse);

    // Sort by distance (closest first)
    photos.sort((a, b) => a.distance - b.distance);

    return photos;
  } catch (error) {
    // Re-throw APIErrors
    if (error instanceof APIError) {
      throw error;
    }

    // Wrap other errors
    throw new APIError(
      `Failed to search nearby photos: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
