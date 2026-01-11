/**
 * Photography scoring algorithm
 * Calculates how good conditions are for landscape photography
 */

import type {
  PhotographyConditions,
  WeatherConditions,
  PhotographyScore,
  TimeOfDay,
} from '@/src/types/photography.types';

/**
 * Score lighting conditions based on time of day (0-100)
 */
function scoreLighting(conditions: PhotographyConditions): number {
  const { timeOfDay, isGoldenHour, isBlueHour } = conditions;

  // Golden hour is ideal for landscape photography
  if (isGoldenHour) {
    return 100;
  }

  // Blue hour is excellent
  if (isBlueHour) {
    return 90;
  }

  // Score based on time of day
  const timeScores: Record<TimeOfDay, number> = {
    golden_hour_morning: 100,
    golden_hour_evening: 100,
    blue_hour_morning: 90,
    blue_hour_evening: 90,
    civil_twilight: 75,
    nautical_twilight: 60,
    astronomical_twilight: 50,
    day: 50, // Midday is harsh light
    night: 30, // Night photography is specialized
  };

  return timeScores[timeOfDay];
}

/**
 * Score weather conditions for photography (0-100)
 */
function scoreWeather(weather: WeatherConditions): number {
  let score = 100;

  // Cloud cover scoring - some clouds can enhance photos
  if (weather.cloudCoverPercent <= 20) {
    // Clear skies
    score -= 0;
  } else if (weather.cloudCoverPercent <= 60) {
    // Partly cloudy - ideal for dramatic photos
    score += 10; // Bonus for interesting skies
  } else if (weather.cloudCoverPercent <= 85) {
    // Mostly cloudy
    score -= 20;
  } else {
    // Overcast
    score -= 40;
  }

  // Precipitation - rain/snow is generally bad
  if (weather.precipitationProbability > 70) {
    score -= 30;
  } else if (weather.precipitationProbability > 40) {
    score -= 15;
  } else if (weather.precipitationProbability > 20) {
    score -= 5;
  }

  // Wind - too much wind makes tripod photography difficult
  if (weather.windSpeedMph > 30) {
    score -= 25;
  } else if (weather.windSpeedMph > 20) {
    score -= 15;
  } else if (weather.windSpeedMph > 10) {
    score -= 5;
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Score visibility for landscape photography (0-100)
 */
function scoreVisibility(visibilityMeters: number): number {
  // Excellent visibility (>40km)
  if (visibilityMeters >= 40000) {
    return 100;
  }

  // Very good (20-40km)
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
function getRecommendation(
  score: number
): 'excellent' | 'good' | 'fair' | 'poor' {
  if (score >= 80) return 'excellent';
  if (score >= 65) return 'good';
  if (score >= 45) return 'fair';
  return 'poor';
}

/**
 * Generate reasons explaining the score
 */
function generateReasons(
  lightingScore: number,
  weatherScore: number,
  visibilityScore: number,
  conditions: PhotographyConditions,
  weather: WeatherConditions
): string[] {
  const reasons: string[] = [];

  // Lighting reasons
  if (conditions.isGoldenHour) {
    reasons.push('Golden hour - perfect lighting for landscapes');
  } else if (conditions.isBlueHour) {
    reasons.push('Blue hour - excellent for moody photography');
  } else if (conditions.timeOfDay === 'day' && conditions.sunAltitude > 45) {
    reasons.push('Harsh midday light - consider waiting for golden hour');
  }

  // Upcoming opportunities
  if (
    !conditions.isGoldenHour &&
    conditions.minutesToGoldenHour !== null &&
    conditions.minutesToGoldenHour < 60
  ) {
    reasons.push(
      `Golden hour starting in ${conditions.minutesToGoldenHour} minutes`
    );
  }

  // Cloud cover
  if (weather.cloudCoverPercent >= 30 && weather.cloudCoverPercent <= 60) {
    reasons.push('Partly cloudy - good for dramatic skies');
  } else if (weather.cloudCoverPercent > 85) {
    reasons.push('Overcast conditions - flat lighting');
  }

  // Visibility
  if (visibilityScore >= 90) {
    reasons.push('Excellent visibility for distant landscapes');
  } else if (visibilityScore < 50) {
    reasons.push('Limited visibility may affect distant views');
  }

  // Precipitation
  if (weather.precipitationProbability > 50) {
    reasons.push('High chance of rain - protect your gear');
  }

  // Wind
  if (weather.windSpeedMph > 20) {
    reasons.push('Strong winds - tripod stability may be challenging');
  }

  // Temperature (comfort)
  if (weather.temperature < 0) {
    reasons.push('Freezing temperatures - dress warmly, protect batteries');
  } else if (weather.temperature > 25) {
    reasons.push('Warm conditions - stay hydrated');
  }

  return reasons;
}

/**
 * Calculate comprehensive photography score
 */
export function calculatePhotographyScore(
  conditions: PhotographyConditions,
  weather: WeatherConditions
): PhotographyScore {
  const lightingScore = scoreLighting(conditions);
  const weatherScore = scoreWeather(weather);
  const visibilityScore = scoreVisibility(weather.visibilityMeters);

  // Weighted average: lighting is most important for photography
  // Lighting: 50%, Weather: 30%, Visibility: 20%
  const overall = Math.round(
    lightingScore * 0.5 + weatherScore * 0.3 + visibilityScore * 0.2
  );

  const reasons = generateReasons(
    lightingScore,
    weatherScore,
    visibilityScore,
    conditions,
    weather
  );

  return {
    overall,
    lightingScore,
    weatherScore,
    visibilityScore,
    conditions,
    recommendation: getRecommendation(overall),
    reasons,
  };
}

/**
 * Check if conditions are ideal for photography
 * Returns true if score >= 80 (excellent)
 */
export function isIdealForPhotography(
  conditions: PhotographyConditions,
  weather: WeatherConditions
): boolean {
  const score = calculatePhotographyScore(conditions, weather);
  return score.overall >= 80;
}

/**
 * Get the best upcoming photography time today
 */
export function getNextBestPhotoTime(
  conditions: PhotographyConditions
): { time: string; minutesAway: number } | null {
  if (conditions.isGoldenHour) {
    return null; // Already in golden hour
  }

  // Check for upcoming golden hour
  if (conditions.minutesToGoldenHour !== null) {
    return {
      time: 'golden hour',
      minutesAway: conditions.minutesToGoldenHour,
    };
  }

  // Check for upcoming sunset
  if (conditions.minutesToSunset !== null) {
    return {
      time: 'sunset',
      minutesAway: conditions.minutesToSunset,
    };
  }

  return null;
}
