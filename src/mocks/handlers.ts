/**
 * MSW (Mock Service Worker) handlers for API mocking
 */

import { http, HttpResponse, delay } from 'msw';

/**
 * Base URL for Open-Meteo API
 */
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Base URL for Wikimedia Commons API
 */
const WIKIMEDIA_API_BASE_URL = 'https://commons.wikimedia.org/w/api.php';

/**
 * Base URL for Overpass API
 */
const OVERPASS_API_BASE_URL = 'https://overpass-api.de/api/interpreter';

/**
 * Generate mock Open-Meteo response
 */
function generateMockOpenMeteoResponse(lat: number, lon: number) {
  const now = new Date();
  const currentTime = now.toISOString();

  // Generate hourly data for next 24 hours
  const hourlyTimes: string[] = [];
  const hourlyTemps: number[] = [];
  const hourlyHumidity: number[] = [];
  const hourlyApparentTemp: number[] = [];
  const hourlyPrecipProb: number[] = [];
  const hourlyPrecip: number[] = [];
  const hourlyWeatherCode: number[] = [];
  const hourlyCloudCover: number[] = [];
  const hourlyVisibility: number[] = [];
  const hourlyWindSpeed: number[] = [];
  const hourlyWindDir: number[] = [];
  const hourlyWindGusts: number[] = [];
  const hourlyUvIndex: number[] = [];

  for (let i = 0; i < 24; i++) {
    const time = new Date(now.getTime() + i * 60 * 60 * 1000);
    hourlyTimes.push(time.toISOString());
    hourlyTemps.push(12 + Math.sin(i / 4) * 3);
    hourlyHumidity.push(65 + Math.random() * 15);
    hourlyApparentTemp.push(10 + Math.sin(i / 4) * 3);
    hourlyPrecipProb.push(Math.random() * 30);
    hourlyPrecip.push(0);
    hourlyWeatherCode.push(i < 6 || i > 18 ? 0 : 2); // Clear at night, partly cloudy during day
    hourlyCloudCover.push(20 + Math.random() * 40);
    hourlyVisibility.push(15000);
    hourlyWindSpeed.push(8 + Math.random() * 4);
    hourlyWindDir.push(270);
    hourlyWindGusts.push(12 + Math.random() * 6);
    hourlyUvIndex.push(i >= 6 && i <= 18 ? 3 : 0);
  }

  return {
    latitude: lat,
    longitude: lon,
    timezone: 'Europe/London',
    timezone_abbreviation: 'GMT',
    elevation: 11,
    current: {
      time: currentTime,
      temperature_2m: 12,
      relative_humidity_2m: 65,
      apparent_temperature: 10,
      precipitation: 0,
      weather_code: 2,
      cloud_cover: 40,
      pressure_msl: 1013,
      wind_speed_10m: 8,
      wind_direction_10m: 270,
      wind_gusts_10m: 12,
    },
    hourly: {
      time: hourlyTimes,
      temperature_2m: hourlyTemps,
      relative_humidity_2m: hourlyHumidity,
      apparent_temperature: hourlyApparentTemp,
      precipitation_probability: hourlyPrecipProb,
      precipitation: hourlyPrecip,
      weather_code: hourlyWeatherCode,
      cloud_cover: hourlyCloudCover,
      visibility: hourlyVisibility,
      wind_speed_10m: hourlyWindSpeed,
      wind_direction_10m: hourlyWindDir,
      wind_gusts_10m: hourlyWindGusts,
      uv_index: hourlyUvIndex,
    },
  };
}

/**
 * Generate mock Wikimedia geosearch response
 */
function generateMockGeosearchResponse(lat: number, lon: number, radius: number, limit: number) {
  const results = [];
  const maxResults = Math.min(limit, 5); // Generate up to 5 mock photos

  for (let i = 0; i < maxResults; i++) {
    // Random offset within radius (simplified)
    const offsetLat = (Math.random() - 0.5) * (radius / 111000); // ~111km per degree
    const offsetLon = (Math.random() - 0.5) * (radius / 111000);
    const distance = Math.sqrt(offsetLat ** 2 + offsetLon ** 2) * 111000;

    results.push({
      pageid: 1000000 + i,
      ns: 6,
      title: `File:Landscape_Photo_${i + 1}.jpg`,
      lat: lat + offsetLat,
      lon: lon + offsetLon,
      dist: Math.round(distance),
    });
  }

  return {
    batchcomplete: '',
    query: {
      geosearch: results,
    },
  };
}

/**
 * Generate mock Wikimedia imageinfo response
 */
function generateMockImageinfoResponse(titles: string) {
  const titleArray = titles.split('|');
  const pages: Record<string, unknown> = {};

  titleArray.forEach((title, index) => {
    const pageid = 1000000 + index;
    const photoNum = index + 1;

    pages[pageid] = {
      pageid,
      ns: 6,
      title,
      imagerepository: 'local',
      imageinfo: [
        {
          timestamp: new Date(2024, 0, photoNum).toISOString(),
          user: `Photographer${photoNum}`,
          url: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a${photoNum}/Landscape_Photo_${photoNum}.jpg/1280px-Landscape_Photo_${photoNum}.jpg`,
          descriptionurl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
          descriptionshorturl: `https://commons.wikimedia.org/wiki/${encodeURIComponent(title)}`,
          width: 4000,
          height: 3000,
          size: 2500000,
          thumburl: `https://upload.wikimedia.org/wikipedia/commons/thumb/a/a${photoNum}/Landscape_Photo_${photoNum}.jpg/400px-Landscape_Photo_${photoNum}.jpg`,
          thumbwidth: 400,
          thumbheight: 300,
          extmetadata: {
            ObjectName: { value: `Landscape Photo ${photoNum}` },
            ImageDescription: {
              value: `Beautiful landscape photograph showing stunning scenery at location ${photoNum}`,
            },
            Artist: { value: `Test Photographer ${photoNum}` },
            Credit: { value: 'Own work' },
            LicenseShortName: { value: 'CC BY-SA 4.0' },
            UsageTerms: { value: 'Creative Commons Attribution-ShareAlike 4.0' },
            AttributionRequired: { value: 'true' },
            Copyrighted: { value: 'True' },
            DateTime: { value: `2024-01-${String(photoNum).padStart(2, '0')} 12:00:00` },
            DateTimeOriginal: { value: `2024-01-${String(photoNum).padStart(2, '0')} 12:00:00` },
          },
        },
      ],
    };
  });

  return {
    batchcomplete: '',
    query: { pages },
  };
}

/**
 * Generate mock Overpass API response
 */
function generateMockOverpassResponse(lat: number, lon: number, radius: number) {
  const elements: Array<{
    type: string;
    id: number;
    lat: number;
    lon: number;
    tags: { [key: string]: string | undefined };
  }> = [];

  // Generate mock POIs of different types
  const poiTypes = [
    { type: 'node', tags: { amenity: 'parking', name: 'Main Car Park' } },
    { type: 'node', tags: { amenity: 'parking', name: 'Valley Parking' } },
    { type: 'node', tags: { amenity: 'cafe', name: 'Mountain View Cafe' } },
    { type: 'node', tags: { amenity: 'restaurant', name: 'The Peak Restaurant' } },
    { type: 'node', tags: { tourism: 'viewpoint', name: 'Sunset Point' } },
    { type: 'node', tags: { tourism: 'viewpoint', name: 'Eagle Rock Lookout' } },
    { type: 'node', tags: { amenity: 'toilets', name: 'Public Toilets' } },
    { type: 'node', tags: { tourism: 'information', name: 'Visitor Centre' } },
  ];

  poiTypes.forEach((poi, index) => {
    // Random offset within radius (simplified)
    const offsetLat = (Math.random() - 0.5) * (radius / 111000); // ~111km per degree
    const offsetLon = (Math.random() - 0.5) * (radius / 111000);

    elements.push({
      type: poi.type,
      id: 1000000 + index,
      lat: lat + offsetLat,
      lon: lon + offsetLon,
      tags: poi.tags,
    });
  });

  return {
    version: 0.6,
    generator: 'Overpass API',
    osm3s: {
      timestamp_osm_base: new Date().toISOString(),
      copyright: 'The data included in this document is from www.openstreetmap.org. The data is made available under ODbL.',
    },
    elements,
  };
}

/**
 * API request handlers
 */
export const handlers = [
  /**
   * Open-Meteo weather forecast endpoint
   * Matches: /v1/forecast
   */
  http.get(OPEN_METEO_BASE_URL, async ({ request }) => {
    const url = new URL(request.url);
    const lat = parseFloat(url.searchParams.get('latitude') || '51.5074');
    const lon = parseFloat(url.searchParams.get('longitude') || '-0.1278');

    // Simulate network delay
    await delay(300);

    // Validate coordinates
    if (isNaN(lat) || lat < -90 || lat > 90) {
      return HttpResponse.json(
        { error: 'Invalid latitude parameter' },
        { status: 400 }
      );
    }

    if (isNaN(lon) || lon < -180 || lon > 180) {
      return HttpResponse.json(
        { error: 'Invalid longitude parameter' },
        { status: 400 }
      );
    }

    // Return mock data
    return HttpResponse.json(generateMockOpenMeteoResponse(lat, lon), { status: 200 });
  }),

  /**
   * Error simulation handler (for testing error handling)
   */
  http.get(`${OPEN_METEO_BASE_URL}/error-test`, async () => {
    await delay(100);
    return HttpResponse.json(
      { error: 'Service temporarily unavailable' },
      { status: 503 }
    );
  }),

  /**
   * Timeout simulation handler (for testing timeout handling)
   */
  http.get(`${OPEN_METEO_BASE_URL}/timeout-test`, async () => {
    await delay(15000); // 15 second delay to trigger timeout
    const lat = 51.5074;
    const lon = -0.1278;
    return HttpResponse.json(generateMockOpenMeteoResponse(lat, lon), { status: 200 });
  }),

  /**
   * Wikimedia Commons geosearch endpoint
   * Matches: https://commons.wikimedia.org/w/api.php?action=query&list=geosearch...
   */
  http.get(WIKIMEDIA_API_BASE_URL, async ({ request }) => {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');
    const list = url.searchParams.get('list');
    const prop = url.searchParams.get('prop');

    // Handle geosearch request
    if (action === 'query' && list === 'geosearch') {
      const gscoord = url.searchParams.get('gscoord');
      const gsradius = url.searchParams.get('gsradius');
      const gslimit = url.searchParams.get('gslimit');

      if (!gscoord || !gsradius) {
        return HttpResponse.json(
          { error: { code: 'badparams', info: 'Missing required parameters' } },
          { status: 400 }
        );
      }

      const [lat, lon] = gscoord.split('|').map(parseFloat);
      const radius = parseInt(gsradius, 10);
      const limit = parseInt(gslimit || '10', 10);

      // Simulate network delay
      await delay(200);

      return HttpResponse.json(generateMockGeosearchResponse(lat, lon, radius, limit));
    }

    // Handle imageinfo request
    if (action === 'query' && prop === 'imageinfo') {
      const titles = url.searchParams.get('titles');

      if (!titles) {
        return HttpResponse.json(
          { error: { code: 'badparams', info: 'Missing titles parameter' } },
          { status: 400 }
        );
      }

      // Simulate network delay
      await delay(200);

      return HttpResponse.json(generateMockImageinfoResponse(titles));
    }

    // Unknown request
    return HttpResponse.json(
      { error: { code: 'unknown_action', info: 'Unrecognized API action' } },
      { status: 400 }
    );
  }),

  /**
   * Overpass API endpoint
   * Matches: https://overpass-api.de/api/interpreter
   */
  http.post(OVERPASS_API_BASE_URL, async ({ request }) => {
    // Parse the request body (Overpass QL query)
    const body = await request.text();
    const queryMatch = body.match(/data=(.+)/);

    if (!queryMatch) {
      return HttpResponse.json(
        { remark: 'Missing query data' },
        { status: 400 }
      );
    }

    const query = decodeURIComponent(queryMatch[1]);

    // Extract coordinates and radius from query
    // Format: (around:RADIUS,LAT,LNG)
    const aroundMatch = query.match(/around:(\d+),([\d.-]+),([\d.-]+)/);

    if (!aroundMatch) {
      return HttpResponse.json(
        { remark: 'Invalid query format' },
        { status: 400 }
      );
    }

    const radius = parseInt(aroundMatch[1], 10);
    const lat = parseFloat(aroundMatch[2]);
    const lon = parseFloat(aroundMatch[3]);

    // Simulate network delay
    await delay(500);

    return HttpResponse.json(generateMockOverpassResponse(lat, lon, radius));
  }),
];
