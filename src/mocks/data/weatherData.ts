/**
 * Mock weather data for testing and development
 */

import { WeatherType, type WeatherConditions } from '@/src/types/weather.types';

/**
 * Generate mock weather conditions
 */
export function generateMockWeatherConditions(
  baseDate: Date = new Date(),
  options: Partial<WeatherConditions> = {}
): WeatherConditions {
  return {
    temperature: 12,
    feelsLike: 10,
    cloudCover: 40,
    visibility: 15000,
    windSpeed: 8,
    windGust: 12,
    windDirection: 270,
    precipitation: 0,
    humidity: 65,
    pressure: 1013,
    uvIndex: 3,
    weatherType: WeatherType.PartlyCloudy,
    timestamp: baseDate.toISOString(),
    ...options,
  };
}

/**
 * Mock weather scenarios for different conditions
 */
export const weatherScenarios = {
  excellent: generateMockWeatherConditions(new Date(), {
    temperature: 15,
    feelsLike: 15,
    cloudCover: 20,
    visibility: 25000,
    windSpeed: 5,
    windGust: 8,
    precipitation: 0,
    weatherType: WeatherType.PartlyCloudy,
  }),
  good: generateMockWeatherConditions(new Date(), {
    temperature: 12,
    feelsLike: 10,
    cloudCover: 40,
    visibility: 15000,
    windSpeed: 8,
    windGust: 12,
    precipitation: 0,
    weatherType: WeatherType.PartlyCloudy,
  }),
  fair: generateMockWeatherConditions(new Date(), {
    temperature: 10,
    feelsLike: 7,
    cloudCover: 70,
    visibility: 8000,
    windSpeed: 12,
    windGust: 18,
    precipitation: 0,
    weatherType: WeatherType.Cloudy,
  }),
  poor: generateMockWeatherConditions(new Date(), {
    temperature: 8,
    feelsLike: 4,
    cloudCover: 100,
    visibility: 3000,
    windSpeed: 15,
    windGust: 25,
    precipitation: 2,
    weatherType: WeatherType.LightRain,
  }),
};
