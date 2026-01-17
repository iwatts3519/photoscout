/**
 * Forecast analyzer utility
 * Analyzes multi-day weather forecast and ranks days for photography
 */

import type { DailyForecast, MultiDayForecast } from '@/src/types/weather.types';
import { WeatherType, WeatherTypeDescription } from '@/src/types/weather.types';

/**
 * Photography score for a single day
 */
export interface DayPhotographyScore {
  date: string;
  dayOfWeek: string;
  overallScore: number; // 0-100
  weatherScore: number; // 0-100
  visibilityScore: number; // 0-100
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  reasons: string[];
  forecast: DailyForecast;
  goldenHourMorning: string; // Formatted time (approx 1hr before sunrise)
  goldenHourEvening: string; // Formatted time (approx 1hr before sunset)
}

/**
 * Analyzed forecast with ranked days
 */
export interface AnalyzedForecast {
  days: DayPhotographyScore[];
  bestDay: DayPhotographyScore | null;
  bestDays: DayPhotographyScore[]; // Top 3 days
  fetchedAt: string;
}

/**
 * Get day of week name from date string
 */
function getDayOfWeek(dateString: string): string {
  const date = new Date(dateString);
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[date.getDay()];
}

/**
 * Format time string for display (HH:mm)
 */
function formatTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Calculate golden hour times from sunrise/sunset
 * Morning golden hour: ~1 hour after sunrise
 * Evening golden hour: ~1 hour before sunset
 */
function calculateGoldenHourTimes(sunrise: string, sunset: string): { morning: string; evening: string } {
  const sunriseDate = new Date(sunrise);
  const sunsetDate = new Date(sunset);

  // Morning golden hour starts at sunrise
  const morningStart = formatTime(sunriseDate.toISOString());

  // Evening golden hour starts about 1 hour before sunset
  const eveningStart = new Date(sunsetDate.getTime() - 60 * 60 * 1000);

  return {
    morning: morningStart,
    evening: formatTime(eveningStart.toISOString()),
  };
}

/**
 * Score weather conditions for photography (0-100)
 */
function scoreWeather(forecast: DailyForecast): number {
  let score = 100;

  // Cloud cover scoring - some clouds can enhance photos
  if (forecast.cloudCoverAvg <= 20) {
    // Clear skies - good but less dramatic
    score -= 0;
  } else if (forecast.cloudCoverAvg <= 50) {
    // Partly cloudy - ideal for dramatic photos
    score += 10; // Bonus for interesting skies
  } else if (forecast.cloudCoverAvg <= 75) {
    // Mostly cloudy
    score -= 15;
  } else {
    // Overcast
    score -= 35;
  }

  // Precipitation - rain is generally bad
  if (forecast.precipitationProbabilityMax > 70) {
    score -= 30;
  } else if (forecast.precipitationProbabilityMax > 50) {
    score -= 20;
  } else if (forecast.precipitationProbabilityMax > 30) {
    score -= 10;
  }

  // Wind - too much wind makes photography difficult
  if (forecast.windSpeedMax > 30) {
    score -= 25;
  } else if (forecast.windSpeedMax > 20) {
    score -= 15;
  } else if (forecast.windSpeedMax > 15) {
    score -= 5;
  }

  // Weather type penalties
  const badWeatherTypes = [
    WeatherType.HeavyRain,
    WeatherType.Thunder,
    WeatherType.ThunderShower,
    WeatherType.Snow,
    WeatherType.Hail,
    WeatherType.Fog,
  ];

  if (badWeatherTypes.includes(forecast.weatherType)) {
    score -= 20;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score visibility for landscape photography (0-100)
 */
function scoreVisibility(visibilityMeters: number): number {
  // Excellent visibility (>30km)
  if (visibilityMeters >= 30000) {
    return 100;
  }

  // Very good (20-30km)
  if (visibilityMeters >= 20000) {
    return 90;
  }

  // Good (10-20km)
  if (visibilityMeters >= 10000) {
    return 75;
  }

  // Moderate (5-10km)
  if (visibilityMeters >= 5000) {
    return 60;
  }

  // Poor (2-5km)
  if (visibilityMeters >= 2000) {
    return 40;
  }

  // Very poor (<2km)
  return 20;
}

/**
 * Generate recommendation based on overall score
 */
function getRecommendation(score: number): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'fair';
  return 'poor';
}

/**
 * Generate reasons explaining the score for a day
 */
function generateReasons(forecast: DailyForecast, weatherScore: number, visibilityScore: number): string[] {
  const reasons: string[] = [];

  // Weather description
  const weatherDesc = WeatherTypeDescription[forecast.weatherType] || 'Unknown';
  reasons.push(weatherDesc);

  // Cloud cover
  if (forecast.cloudCoverAvg >= 30 && forecast.cloudCoverAvg <= 50) {
    reasons.push('Good clouds for dramatic skies');
  } else if (forecast.cloudCoverAvg > 80) {
    reasons.push('Overcast - flat lighting');
  } else if (forecast.cloudCoverAvg < 20) {
    reasons.push('Clear skies');
  }

  // Visibility
  if (visibilityScore >= 90) {
    reasons.push('Excellent visibility');
  } else if (visibilityScore < 50) {
    reasons.push('Limited visibility');
  }

  // Precipitation
  if (forecast.precipitationProbabilityMax > 50) {
    reasons.push(`${forecast.precipitationProbabilityMax}% chance of rain`);
  }

  // Wind
  if (forecast.windSpeedMax > 20) {
    reasons.push(`Strong winds (${Math.round(forecast.windSpeedMax)} mph)`);
  }

  // Temperature extremes
  if (forecast.temperatureMin < 0) {
    reasons.push('Freezing temperatures');
  }

  return reasons;
}

/**
 * Score a single day for photography
 */
function scoreDayForPhotography(forecast: DailyForecast): DayPhotographyScore {
  const weatherScore = scoreWeather(forecast);
  const visibilityScore = scoreVisibility(forecast.visibilityAvg);

  // For daily forecasts, we don't have time-specific data
  // so we focus on weather and visibility (60% weather, 40% visibility)
  const overallScore = Math.round(weatherScore * 0.6 + visibilityScore * 0.4);

  const reasons = generateReasons(forecast, weatherScore, visibilityScore);
  const goldenHours = calculateGoldenHourTimes(forecast.sunrise, forecast.sunset);

  return {
    date: forecast.date,
    dayOfWeek: getDayOfWeek(forecast.date),
    overallScore,
    weatherScore,
    visibilityScore,
    recommendation: getRecommendation(overallScore),
    reasons,
    forecast,
    goldenHourMorning: goldenHours.morning,
    goldenHourEvening: goldenHours.evening,
  };
}

/**
 * Analyze multi-day forecast and rank days for photography
 */
export function analyzeForecast(forecast: MultiDayForecast): AnalyzedForecast {
  // Score each day
  const days = forecast.daily.map(scoreDayForPhotography);

  // Sort by score to find best days
  const sortedDays = [...days].sort((a, b) => b.overallScore - a.overallScore);

  // Get top 3 best days
  const bestDays = sortedDays.slice(0, 3);

  // Best single day
  const bestDay = sortedDays.length > 0 ? sortedDays[0] : null;

  return {
    days,
    bestDay,
    bestDays,
    fetchedAt: forecast.fetchedAt,
  };
}

/**
 * Get a simple summary of the best day for photography
 */
export function getBestDaySummary(analyzed: AnalyzedForecast): string | null {
  if (!analyzed.bestDay) {
    return null;
  }

  const { dayOfWeek, recommendation, goldenHourEvening } = analyzed.bestDay;

  if (recommendation === 'excellent' || recommendation === 'good') {
    return `${dayOfWeek} looks ${recommendation} for photography. Golden hour at ${goldenHourEvening}.`;
  }

  return `${dayOfWeek} is the best option, but conditions are ${recommendation}.`;
}

/**
 * Check if any day this week has excellent conditions
 */
export function hasExcellentDay(analyzed: AnalyzedForecast): boolean {
  return analyzed.days.some((day) => day.recommendation === 'excellent');
}

/**
 * Get days sorted by date (chronological order)
 */
export function getDaysChronologically(analyzed: AnalyzedForecast): DayPhotographyScore[] {
  return [...analyzed.days].sort((a, b) => a.date.localeCompare(b.date));
}
