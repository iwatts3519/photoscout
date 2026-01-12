/**
 * Tests for weather adapter utility
 */

import { describe, it, expect } from 'vitest';
import {
  adaptWeatherForPhotography,
  isFavorableWeather,
  getWeatherQuality,
} from './weather-adapter';
import { WeatherType } from '@/src/types/weather.types';
import type { WeatherConditions as MetOfficeWeather } from '@/src/types/weather.types';

describe('adaptWeatherForPhotography', () => {
  it('should convert Met Office weather to photography format', () => {
    const metOfficeWeather: MetOfficeWeather = {
      temperature: 15,
      feelsLike: 13,
      cloudCover: 40,
      visibility: 15000,
      windSpeed: 8,
      windGust: 12,
      windDirection: 270,
      precipitation: 10,
      humidity: 65,
      pressure: 1013,
      uvIndex: 3,
      weatherType: WeatherType.PartlyCloudy,
      timestamp: new Date().toISOString(),
    };

    const photoWeather = adaptWeatherForPhotography(metOfficeWeather);

    expect(photoWeather).toEqual({
      cloudCoverPercent: 40,
      visibilityMeters: 15000,
      windSpeedMph: 8,
      precipitationProbability: 10,
      temperature: 15,
    });
  });

  it('should preserve exact values', () => {
    const metOfficeWeather: MetOfficeWeather = {
      temperature: 0,
      feelsLike: -2,
      cloudCover: 100,
      visibility: 500,
      windSpeed: 30,
      windGust: 45,
      windDirection: 0,
      precipitation: 100,
      humidity: 95,
      pressure: 990,
      uvIndex: 0,
      weatherType: WeatherType.HeavyRain,
      timestamp: new Date().toISOString(),
    };

    const photoWeather = adaptWeatherForPhotography(metOfficeWeather);

    expect(photoWeather.cloudCoverPercent).toBe(100);
    expect(photoWeather.visibilityMeters).toBe(500);
    expect(photoWeather.windSpeedMph).toBe(30);
    expect(photoWeather.precipitationProbability).toBe(100);
    expect(photoWeather.temperature).toBe(0);
  });
});

describe('isFavorableWeather', () => {
  it('should return true for excellent conditions', () => {
    const excellentWeather: MetOfficeWeather = {
      temperature: 15,
      feelsLike: 15,
      cloudCover: 20,
      visibility: 25000,
      windSpeed: 5,
      windGust: 8,
      windDirection: 270,
      precipitation: 0,
      humidity: 60,
      pressure: 1020,
      uvIndex: 4,
      weatherType: WeatherType.Sunny,
      timestamp: new Date().toISOString(),
    };

    expect(isFavorableWeather(excellentWeather)).toBe(true);
  });

  it('should return true for dramatic skies (moderate clouds)', () => {
    const dramaticWeather: MetOfficeWeather = {
      temperature: 12,
      feelsLike: 11,
      cloudCover: 50,
      visibility: 15000,
      windSpeed: 8,
      windGust: 12,
      windDirection: 180,
      precipitation: 5,
      humidity: 65,
      pressure: 1013,
      uvIndex: 3,
      weatherType: WeatherType.PartlyCloudy,
      timestamp: new Date().toISOString(),
    };

    expect(isFavorableWeather(dramaticWeather)).toBe(true);
  });

  it('should return false for high precipitation', () => {
    const rainyWeather: MetOfficeWeather = {
      temperature: 10,
      feelsLike: 8,
      cloudCover: 40,
      visibility: 10000,
      windSpeed: 10,
      windGust: 15,
      windDirection: 270,
      precipitation: 50,
      humidity: 80,
      pressure: 1010,
      uvIndex: 2,
      weatherType: WeatherType.LightRain,
      timestamp: new Date().toISOString(),
    };

    expect(isFavorableWeather(rainyWeather)).toBe(false);
  });

  it('should return false for strong winds', () => {
    const windyWeather: MetOfficeWeather = {
      temperature: 12,
      feelsLike: 8,
      cloudCover: 30,
      visibility: 15000,
      windSpeed: 25,
      windGust: 35,
      windDirection: 270,
      precipitation: 10,
      humidity: 65,
      pressure: 1015,
      uvIndex: 3,
      weatherType: WeatherType.PartlyCloudy,
      timestamp: new Date().toISOString(),
    };

    expect(isFavorableWeather(windyWeather)).toBe(false);
  });

  it('should return false for poor visibility', () => {
    const foggyWeather: MetOfficeWeather = {
      temperature: 8,
      feelsLike: 8,
      cloudCover: 90,
      visibility: 2000,
      windSpeed: 5,
      windGust: 8,
      windDirection: 180,
      precipitation: 0,
      humidity: 95,
      pressure: 1010,
      uvIndex: 1,
      weatherType: WeatherType.Fog,
      timestamp: new Date().toISOString(),
    };

    expect(isFavorableWeather(foggyWeather)).toBe(false);
  });
});

describe('getWeatherQuality', () => {
  it('should return "excellent" for perfect conditions', () => {
    const perfectWeather: MetOfficeWeather = {
      temperature: 15,
      feelsLike: 15,
      cloudCover: 15,
      visibility: 30000,
      windSpeed: 5,
      windGust: 8,
      windDirection: 270,
      precipitation: 0,
      humidity: 60,
      pressure: 1020,
      uvIndex: 4,
      weatherType: WeatherType.Sunny,
      timestamp: new Date().toISOString(),
    };

    expect(getWeatherQuality(perfectWeather)).toBe('excellent');
  });

  it('should return "good" for favorable conditions', () => {
    const goodWeather: MetOfficeWeather = {
      temperature: 12,
      feelsLike: 11,
      cloudCover: 65, // Higher cloud cover to reduce score
      visibility: 9000, // Slightly reduced visibility
      windSpeed: 12, // Slightly higher wind
      windGust: 16,
      windDirection: 180,
      precipitation: 22, // Higher precipitation
      humidity: 65,
      pressure: 1013,
      uvIndex: 3,
      weatherType: WeatherType.PartlyCloudy,
      timestamp: new Date().toISOString(),
    };

    expect(getWeatherQuality(goodWeather)).toBe('good');
  });

  it('should return "fair" for marginal conditions', () => {
    const fairWeather: MetOfficeWeather = {
      temperature: 10,
      feelsLike: 7,
      cloudCover: 75, // Higher cloud cover
      visibility: 7000,
      windSpeed: 15, // Higher wind
      windGust: 22,
      windDirection: 270,
      precipitation: 30, // Higher precipitation
      humidity: 70,
      pressure: 1010,
      uvIndex: 2,
      weatherType: WeatherType.Cloudy,
      timestamp: new Date().toISOString(),
    };

    expect(getWeatherQuality(fairWeather)).toBe('fair');
  });

  it('should return "poor" for bad conditions', () => {
    const poorWeather: MetOfficeWeather = {
      temperature: 8,
      feelsLike: 4,
      cloudCover: 100,
      visibility: 1500,
      windSpeed: 20,
      windGust: 30,
      windDirection: 270,
      precipitation: 80,
      humidity: 90,
      pressure: 995,
      uvIndex: 0,
      weatherType: WeatherType.HeavyRain,
      timestamp: new Date().toISOString(),
    };

    expect(getWeatherQuality(poorWeather)).toBe('poor');
  });

  it('should bonus points for dramatic skies', () => {
    const dramaticWeather: MetOfficeWeather = {
      temperature: 13,
      feelsLike: 12,
      cloudCover: 50, // Sweet spot for drama
      visibility: 20000,
      windSpeed: 7,
      windGust: 10,
      windDirection: 180,
      precipitation: 5,
      humidity: 65,
      pressure: 1015,
      uvIndex: 3,
      weatherType: WeatherType.PartlyCloudy,
      timestamp: new Date().toISOString(),
    };

    const quality = getWeatherQuality(dramaticWeather);
    expect(quality).toBe('excellent'); // Should get bonus
  });
});
