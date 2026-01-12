/**
 * Open-Meteo API client
 * Free weather API with no key required for non-commercial use
 * Documentation: https://open-meteo.com/en/docs
 */

import { fetchAPI, buildURL } from './base';
import type {
  WeatherConditions,
  WeatherForecast,
} from '@/src/types/weather.types';
import { WeatherType } from '@/src/types/weather.types';

const OPEN_METEO_BASE_URL = 'https://api.open-meteo.com/v1/forecast';

/**
 * Configuration for Open-Meteo API
 */
interface OpenMeteoConfig {
  cacheDuration?: number; // milliseconds
  timezone?: string; // e.g., 'Europe/London'
}

/**
 * Open-Meteo API response structure
 */
interface OpenMeteoResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    precipitation: number;
    weather_code: number;
    cloud_cover: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    cloud_cover: number[];
    visibility: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
  };
}

/**
 * Get weather forecast for a location
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @param config - API configuration
 * @returns Weather forecast data
 */
export async function getWeatherForecast(
  latitude: number,
  longitude: number,
  config: OpenMeteoConfig = {}
): Promise<WeatherForecast> {
  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }

  const timezone = config.timezone || 'Europe/London';

  // Build request URL with required parameters
  const url = buildURL(OPEN_METEO_BASE_URL, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    current: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'pressure_msl',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
    ].join(','),
    hourly: [
      'temperature_2m',
      'relative_humidity_2m',
      'apparent_temperature',
      'precipitation_probability',
      'precipitation',
      'weather_code',
      'cloud_cover',
      'visibility',
      'wind_speed_10m',
      'wind_direction_10m',
      'wind_gusts_10m',
      'uv_index',
    ].join(','),
    timezone,
    windspeed_unit: 'mph',
    temperature_unit: 'celsius',
    forecast_days: 1, // Just today
  });

  const response = await fetchAPI<OpenMeteoResponse>(url, {
    cache: true,
    cacheDuration: config.cacheDuration || 30 * 60 * 1000, // 30 minutes default
  });

  // Transform Open-Meteo response to our format
  return transformOpenMeteoResponse(response);
}

/**
 * Transform Open-Meteo API response to our WeatherForecast format
 */
function transformOpenMeteoResponse(response: OpenMeteoResponse): WeatherForecast {
  // Transform current conditions
  const current = transformCurrentConditions(response.current);

  // Transform hourly forecast (next 24 hours)
  const hourly: WeatherConditions[] = [];
  for (let i = 0; i < Math.min(response.hourly.time.length, 24); i++) {
    hourly.push({
      temperature: response.hourly.temperature_2m[i],
      feelsLike: response.hourly.apparent_temperature[i],
      cloudCover: response.hourly.cloud_cover[i],
      visibility: response.hourly.visibility[i],
      windSpeed: response.hourly.wind_speed_10m[i],
      windGust: response.hourly.wind_gusts_10m[i],
      windDirection: response.hourly.wind_direction_10m[i],
      precipitation: response.hourly.precipitation_probability[i] || 0,
      humidity: response.hourly.relative_humidity_2m[i],
      pressure: 1013, // Not provided in hourly, use standard pressure
      uvIndex: response.hourly.uv_index[i] || 0,
      weatherType: mapWMOCodeToWeatherType(response.hourly.weather_code[i]),
      timestamp: response.hourly.time[i],
    });
  }

  return {
    current,
    hourly,
    location: {
      latitude: response.latitude,
      longitude: response.longitude,
    },
    fetchedAt: new Date().toISOString(),
  };
}

/**
 * Transform current conditions from Open-Meteo format
 */
function transformCurrentConditions(
  current: OpenMeteoResponse['current']
): WeatherConditions {
  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    cloudCover: current.cloud_cover,
    visibility: 10000, // Open-Meteo doesn't provide current visibility, use default
    windSpeed: current.wind_speed_10m,
    windGust: current.wind_gusts_10m,
    windDirection: current.wind_direction_10m,
    precipitation: current.precipitation,
    humidity: current.relative_humidity_2m,
    pressure: current.pressure_msl,
    uvIndex: 0, // UV not provided in current, only hourly
    weatherType: mapWMOCodeToWeatherType(current.weather_code),
    timestamp: current.time,
  };
}

/**
 * Map WMO weather codes to our WeatherType enum
 * WMO codes: https://open-meteo.com/en/docs
 */
function mapWMOCodeToWeatherType(wmoCode: number): WeatherType {
  // WMO Weather interpretation codes (WW)
  // 0: Clear sky
  // 1-3: Mainly clear, partly cloudy, overcast
  // 45, 48: Fog
  // 51-55: Drizzle
  // 56-57: Freezing drizzle
  // 61-65: Rain
  // 66-67: Freezing rain
  // 71-75: Snow
  // 77: Snow grains
  // 80-82: Rain showers
  // 85-86: Snow showers
  // 95: Thunderstorm
  // 96, 99: Thunderstorm with hail

  if (wmoCode === 0) return WeatherType.Sunny;
  if (wmoCode === 1) return WeatherType.PartlyCloudy;
  if (wmoCode === 2) return WeatherType.Cloudy;
  if (wmoCode === 3) return WeatherType.Overcast;
  if (wmoCode === 45 || wmoCode === 48) return WeatherType.Fog;
  if (wmoCode >= 51 && wmoCode <= 55) return WeatherType.Drizzle;
  if (wmoCode >= 56 && wmoCode <= 57) return WeatherType.Drizzle;
  if (wmoCode >= 61 && wmoCode <= 65) return WeatherType.LightRain;
  if (wmoCode >= 66 && wmoCode <= 67) return WeatherType.Sleet;
  if (wmoCode >= 71 && wmoCode <= 75) return WeatherType.Snow;
  if (wmoCode === 77) return WeatherType.Snow;
  if (wmoCode >= 80 && wmoCode <= 82) return WeatherType.LightRainShower;
  if (wmoCode >= 85 && wmoCode <= 86) return WeatherType.Snow;
  if (wmoCode === 95) return WeatherType.Thunder;
  if (wmoCode >= 96 && wmoCode <= 99) return WeatherType.ThunderShower;

  return WeatherType.Cloudy; // Default fallback
}

/**
 * Get simple weather conditions for current time
 * (Convenience function for quick lookups)
 */
export async function getCurrentWeather(
  latitude: number,
  longitude: number,
  config: OpenMeteoConfig = {}
): Promise<WeatherConditions> {
  const forecast = await getWeatherForecast(latitude, longitude, config);
  return forecast.current;
}
