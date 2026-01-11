/**
 * Photography-specific types for sun calculations and scoring
 */

/**
 * Sun time periods for a given date and location
 */
export interface SunTimes {
  sunrise: Date;
  sunset: Date;
  sunriseEnd: Date;
  sunsetStart: Date;
  goldenHourMorning: Date;
  goldenHourMorningEnd: Date;
  goldenHourEvening: Date;
  goldenHourEveningEnd: Date;
  solarNoon: Date;
  nadir: Date;
  dawn: Date;
  dusk: Date;
  nauticalDawn: Date;
  nauticalDusk: Date;
  nightEnd: Date;
  night: Date;
}

/**
 * Sun position at a specific time
 */
export interface SunPosition {
  altitude: number; // Sun altitude above horizon in radians
  azimuth: number; // Sun azimuth in radians (direction)
  altitudeDegrees: number; // Altitude in degrees
  azimuthDegrees: number; // Azimuth in degrees (0° = North, 90° = East)
}

/**
 * Time period types for photography
 */
export type TimeOfDay =
  | 'golden_hour_morning'
  | 'golden_hour_evening'
  | 'blue_hour_morning'
  | 'blue_hour_evening'
  | 'day'
  | 'night'
  | 'civil_twilight'
  | 'nautical_twilight'
  | 'astronomical_twilight';

/**
 * Photography conditions assessment
 */
export interface PhotographyConditions {
  timeOfDay: TimeOfDay;
  isGoldenHour: boolean;
  isBlueHour: boolean;
  minutesToGoldenHour: number | null;
  minutesToSunrise: number | null;
  minutesToSunset: number | null;
  sunAltitude: number;
  sunAzimuth: number;
}

/**
 * Weather conditions for photography scoring
 */
export interface WeatherConditions {
  cloudCoverPercent: number; // 0-100
  visibilityMeters: number;
  windSpeedMph: number;
  precipitationProbability: number; // 0-100
  temperature: number; // Celsius
}

/**
 * Photography score breakdown
 */
export interface PhotographyScore {
  overall: number; // 0-100
  lightingScore: number; // 0-100
  weatherScore: number; // 0-100
  visibilityScore: number; // 0-100
  conditions: PhotographyConditions;
  recommendation: 'excellent' | 'good' | 'fair' | 'poor';
  reasons: string[];
}
