/**
 * Adapter to convert Open-Meteo weather data to photography scoring format
 */

import type { WeatherConditions as OpenMeteoWeather } from '@/src/types/weather.types';
import type { WeatherConditions as PhotoWeather } from '@/src/types/photography.types';

/**
 * Convert Open-Meteo weather conditions to photography weather format
 *
 * This adapter bridges the detailed Open-Meteo API data with the
 * simplified format used by the photography scoring algorithm.
 */
export function adaptWeatherForPhotography(
  openMeteoWeather: OpenMeteoWeather
): PhotoWeather {
  return {
    cloudCoverPercent: openMeteoWeather.cloudCover,
    visibilityMeters: openMeteoWeather.visibility,
    windSpeedMph: openMeteoWeather.windSpeed,
    precipitationProbability: openMeteoWeather.precipitation,
    temperature: openMeteoWeather.temperature,
  };
}

/**
 * Check if weather conditions are favorable for photography
 * (Convenience function for quick checks)
 */
export function isFavorableWeather(weather: OpenMeteoWeather): boolean {
  // Favorable if:
  // - Low precipitation (<30%)
  // - Moderate wind (<20 mph)
  // - Good visibility (>5km)
  // - Moderate cloud cover (20-70% for drama)

  const hasLowPrecipitation = weather.precipitation < 30;
  const hasModerateWind = weather.windSpeed < 20;
  const hasGoodVisibility = weather.visibility > 5000;
  const hasInterestingSkies = weather.cloudCover >= 20 && weather.cloudCover <= 70;

  // Must have good basics
  if (!hasLowPrecipitation || !hasModerateWind || !hasGoodVisibility) {
    return false;
  }

  // Either clear skies or dramatic clouds
  return weather.cloudCover < 20 || hasInterestingSkies;
}

/**
 * Get a simple weather quality rating
 */
export function getWeatherQuality(
  weather: OpenMeteoWeather
): 'excellent' | 'good' | 'fair' | 'poor' {
  const photoWeather = adaptWeatherForPhotography(weather);

  let score = 100;

  // Cloud cover scoring
  if (photoWeather.cloudCoverPercent <= 20) {
    score -= 0; // Clear is good
  } else if (photoWeather.cloudCoverPercent <= 50) {
    score += 5; // Small bonus for drama
  } else if (photoWeather.cloudCoverPercent <= 70) {
    score -= 10;
  } else if (photoWeather.cloudCoverPercent <= 85) {
    score -= 25;
  } else {
    score -= 40;
  }

  // Precipitation
  if (photoWeather.precipitationProbability > 70) {
    score -= 30;
  } else if (photoWeather.precipitationProbability > 40) {
    score -= 15;
  } else if (photoWeather.precipitationProbability > 20) {
    score -= 5;
  }

  // Wind
  if (photoWeather.windSpeedMph > 30) {
    score -= 25;
  } else if (photoWeather.windSpeedMph > 20) {
    score -= 15;
  } else if (photoWeather.windSpeedMph > 10) {
    score -= 5;
  }

  // Visibility
  if (photoWeather.visibilityMeters < 2000) {
    score -= 30;
  } else if (photoWeather.visibilityMeters < 5000) {
    score -= 15;
  } else if (photoWeather.visibilityMeters < 10000) {
    score -= 5;
  }

  if (score >= 85) return 'excellent';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}
