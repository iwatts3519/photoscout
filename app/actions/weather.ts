/**
 * Server actions for weather data
 */

'use server';

import { getWeatherForecast, getCurrentWeather, getMultiDayForecast } from '@/lib/api/open-meteo';
import type { WeatherForecast, WeatherConditions, MultiDayForecast } from '@/src/types/weather.types';

/**
 * Get weather forecast for a location
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @returns Weather forecast or error
 */
export async function fetchWeatherForecast(
  latitude: number,
  longitude: number
): Promise<{ data: WeatherForecast | null; error: string | null }> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return { data: null, error: 'Invalid latitude: must be between -90 and 90' };
    }
    if (longitude < -180 || longitude > 180) {
      return { data: null, error: 'Invalid longitude: must be between -180 and 180' };
    }

    // Use Open-Meteo API (no key required)
    const forecast = await getWeatherForecast(latitude, longitude, {
      cacheDuration: 30 * 60 * 1000, // 30 minutes
      timezone: 'Europe/London', // UK timezone
    });

    return { data: forecast, error: null };
  } catch (error) {
    console.error('Error fetching weather forecast:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch weather data',
    };
  }
}

/**
 * Get current weather conditions for a location
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @returns Current weather conditions or error
 */
export async function fetchCurrentWeather(
  latitude: number,
  longitude: number
): Promise<{ data: WeatherConditions | null; error: string | null }> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return { data: null, error: 'Invalid latitude: must be between -90 and 90' };
    }
    if (longitude < -180 || longitude > 180) {
      return { data: null, error: 'Invalid longitude: must be between -180 and 180' };
    }

    // Use Open-Meteo API (no key required)
    const weather = await getCurrentWeather(latitude, longitude, {
      cacheDuration: 30 * 60 * 1000, // 30 minutes
      timezone: 'Europe/London', // UK timezone
    });

    return { data: weather, error: null };
  } catch (error) {
    console.error('Error fetching current weather:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch weather data',
    };
  }
}

/**
 * Get 7-day weather forecast for a location
 *
 * @param latitude - Latitude of location
 * @param longitude - Longitude of location
 * @returns Multi-day weather forecast or error
 */
export async function fetchMultiDayForecast(
  latitude: number,
  longitude: number
): Promise<{ data: MultiDayForecast | null; error: string | null }> {
  try {
    // Validate coordinates
    if (latitude < -90 || latitude > 90) {
      return { data: null, error: 'Invalid latitude: must be between -90 and 90' };
    }
    if (longitude < -180 || longitude > 180) {
      return { data: null, error: 'Invalid longitude: must be between -180 and 180' };
    }

    // Use Open-Meteo API (no key required)
    const forecast = await getMultiDayForecast(latitude, longitude, {
      cacheDuration: 60 * 60 * 1000, // 1 hour
      timezone: 'Europe/London', // UK timezone
    });

    return { data: forecast, error: null };
  } catch (error) {
    console.error('Error fetching multi-day forecast:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch forecast data',
    };
  }
}
