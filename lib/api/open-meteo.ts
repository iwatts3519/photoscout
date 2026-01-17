/**
 * Open-Meteo API client
 * Free weather API with no key required for non-commercial use
 * Documentation: https://open-meteo.com/en/docs
 */

import { fetchAPI, buildURL } from './base';
import type {
  WeatherConditions,
  WeatherForecast,
  DailyForecast,
  MultiDayForecast,
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
  // Transform current conditions (use first hourly visibility as current)
  const current = transformCurrentConditions(response.current, response.hourly);

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
  current: OpenMeteoResponse['current'],
  hourly: OpenMeteoResponse['hourly']
): WeatherConditions {
  return {
    temperature: current.temperature_2m,
    feelsLike: current.apparent_temperature,
    cloudCover: current.cloud_cover,
    // Use first hourly visibility as current (Open-Meteo doesn't provide current visibility)
    visibility: hourly.visibility?.[0] ?? 10000,
    windSpeed: current.wind_speed_10m,
    windGust: current.wind_gusts_10m,
    windDirection: current.wind_direction_10m,
    precipitation: current.precipitation,
    humidity: current.relative_humidity_2m,
    pressure: current.pressure_msl,
    // Use first hourly UV index as current (Open-Meteo doesn't provide current UV)
    uvIndex: hourly.uv_index?.[0] ?? 0,
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

/**
 * Open-Meteo API response structure for multi-day forecast
 */
interface OpenMeteoMultiDayResponse {
  latitude: number;
  longitude: number;
  timezone: string;
  timezone_abbreviation: string;
  elevation: number;
  daily: {
    time: string[]; // Array of dates (YYYY-MM-DD)
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    precipitation_sum: number[];
    precipitation_probability_max: number[];
    weather_code: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
  hourly?: {
    time: string[];
    cloud_cover: number[];
    visibility: number[];
  };
}

/**
 * Get 7-day weather forecast for a location
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @param config - API configuration
 * @returns Multi-day weather forecast data
 */
export async function getMultiDayForecast(
  latitude: number,
  longitude: number,
  config: OpenMeteoConfig = {}
): Promise<MultiDayForecast> {
  // Validate coordinates
  if (latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude: must be between -90 and 90');
  }
  if (longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude: must be between -180 and 180');
  }

  const timezone = config.timezone || 'Europe/London';

  // Build request URL with daily parameters
  const url = buildURL(OPEN_METEO_BASE_URL, {
    latitude: latitude.toFixed(4),
    longitude: longitude.toFixed(4),
    daily: [
      'temperature_2m_max',
      'temperature_2m_min',
      'precipitation_sum',
      'precipitation_probability_max',
      'weather_code',
      'wind_speed_10m_max',
      'wind_gusts_10m_max',
      'sunrise',
      'sunset',
      'uv_index_max',
    ].join(','),
    hourly: [
      'cloud_cover',
      'visibility',
    ].join(','),
    timezone,
    windspeed_unit: 'mph',
    temperature_unit: 'celsius',
    forecast_days: 7, // 7-day forecast
  });

  const response = await fetchAPI<OpenMeteoMultiDayResponse>(url, {
    cache: true,
    cacheDuration: config.cacheDuration || 60 * 60 * 1000, // 1 hour default for forecast
  });

  // Transform Open-Meteo response to our format
  return transformMultiDayResponse(response);
}

/**
 * Transform Open-Meteo multi-day API response to our MultiDayForecast format
 */
function transformMultiDayResponse(response: OpenMeteoMultiDayResponse): MultiDayForecast {
  const daily: DailyForecast[] = [];

  for (let i = 0; i < response.daily.time.length; i++) {
    const date = response.daily.time[i];
    const tempMin = response.daily.temperature_2m_min[i];
    const tempMax = response.daily.temperature_2m_max[i];

    // Calculate daily averages from hourly data if available
    let cloudCoverAvg = 50; // Default
    let visibilityAvg = 10000; // Default 10km

    if (response.hourly) {
      // Find hourly data for this day (24 hours starting at midnight)
      const dayStartIndex = i * 24;
      const dayEndIndex = Math.min(dayStartIndex + 24, response.hourly.time.length);

      if (dayStartIndex < response.hourly.time.length) {
        const dayCloudCover = response.hourly.cloud_cover.slice(dayStartIndex, dayEndIndex);
        const dayVisibility = response.hourly.visibility.slice(dayStartIndex, dayEndIndex);

        if (dayCloudCover.length > 0) {
          cloudCoverAvg = Math.round(
            dayCloudCover.reduce((sum, v) => sum + v, 0) / dayCloudCover.length
          );
        }

        if (dayVisibility.length > 0) {
          visibilityAvg = Math.round(
            dayVisibility.reduce((sum, v) => sum + v, 0) / dayVisibility.length
          );
        }
      }
    }

    daily.push({
      date,
      temperatureMin: tempMin,
      temperatureMax: tempMax,
      temperatureAvg: Math.round((tempMin + tempMax) / 2),
      cloudCoverAvg,
      precipitationProbabilityMax: response.daily.precipitation_probability_max[i],
      precipitationSum: response.daily.precipitation_sum[i],
      weatherType: mapWMOCodeToWeatherType(response.daily.weather_code[i]),
      windSpeedMax: response.daily.wind_speed_10m_max[i],
      windGustMax: response.daily.wind_gusts_10m_max[i],
      sunrise: response.daily.sunrise[i],
      sunset: response.daily.sunset[i],
      uvIndexMax: response.daily.uv_index_max[i],
      visibilityAvg,
    });
  }

  return {
    daily,
    location: {
      latitude: response.latitude,
      longitude: response.longitude,
    },
    fetchedAt: new Date().toISOString(),
  };
}
