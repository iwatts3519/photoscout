/**
 * MSW (Mock Service Worker) handlers for API mocking
 */

import { http, HttpResponse, delay } from 'msw';

/**
 * Base URL for Open-Meteo API
 */
const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

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
];
