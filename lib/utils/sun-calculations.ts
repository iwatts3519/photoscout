/**
 * Sun calculations for photography planning
 * Wrapper around SunCalc library with typed interfaces
 */

import SunCalc from 'suncalc';
import type {
  SunTimes,
  SunPosition,
  TimeOfDay,
  PhotographyConditions,
} from '@/src/types/photography.types';

/**
 * Convert radians to degrees
 */
function radToDeg(radians: number): number {
  return (radians * 180) / Math.PI;
}

/**
 * Convert SunCalc azimuth (radians, south-based) to degrees (north-based)
 * SunCalc returns azimuth in radians from south, we want degrees from north
 */
function convertAzimuth(azimuthRadians: number): number {
  return (radToDeg(azimuthRadians) + 180) % 360;
}

/**
 * Get all sun times for a specific date and location
 *
 * Note: SunCalc naming is confusing:
 * - goldenHourEnd = morning golden hour ends (sun at 6° after sunrise)
 * - goldenHour = evening golden hour starts (sun at 6° before sunset)
 *
 * Photography convention:
 * - Morning golden hour: ~1 hour after sunrise
 * - Evening golden hour: ~1 hour before and after sunset
 */
export function getSunTimes(date: Date, lat: number, lng: number): SunTimes {
  const times = SunCalc.getTimes(date, lat, lng);

  return {
    sunrise: times.sunrise,
    sunset: times.sunset,
    sunriseEnd: times.sunriseEnd,
    sunsetStart: times.sunsetStart,
    // Morning golden hour: from sunrise to goldenHourEnd (~1 hour)
    goldenHourMorning: times.sunrise,
    goldenHourMorningEnd: times.goldenHourEnd,
    // Evening golden hour: from goldenHour to sunset (~1 hour before sunset)
    goldenHourEvening: times.goldenHour,
    goldenHourEveningEnd: times.sunset,
    solarNoon: times.solarNoon,
    nadir: times.nadir,
    dawn: times.dawn,
    dusk: times.dusk,
    nauticalDawn: times.nauticalDawn,
    nauticalDusk: times.nauticalDusk,
    nightEnd: times.nightEnd,
    night: times.night,
  };
}

/**
 * Get sun position (altitude and azimuth) for a specific time and location
 */
export function getSunPosition(
  date: Date,
  lat: number,
  lng: number
): SunPosition {
  const position = SunCalc.getPosition(date, lat, lng);

  return {
    altitude: position.altitude,
    azimuth: position.azimuth,
    altitudeDegrees: radToDeg(position.altitude),
    azimuthDegrees: convertAzimuth(position.azimuth),
  };
}

/**
 * Check if current time is within golden hour
 */
export function isGoldenHour(date: Date, lat: number, lng: number): boolean {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();

  const isMorningGoldenHour =
    currentTime >= times.goldenHourMorning.getTime() &&
    currentTime <= times.goldenHourMorningEnd.getTime();

  const isEveningGoldenHour =
    currentTime >= times.goldenHourEvening.getTime() &&
    currentTime <= times.goldenHourEveningEnd.getTime();

  return isMorningGoldenHour || isEveningGoldenHour;
}

/**
 * Check if current time is within blue hour
 * Blue hour is approximately 20-40 minutes before sunrise and after sunset
 */
export function isBlueHour(date: Date, lat: number, lng: number): boolean {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();

  // Morning blue hour: between nautical dawn and sunrise
  const isMorningBlueHour =
    currentTime >= times.nauticalDawn.getTime() &&
    currentTime <= times.sunrise.getTime();

  // Evening blue hour: between sunset and nautical dusk
  const isEveningBlueHour =
    currentTime >= times.sunset.getTime() &&
    currentTime <= times.nauticalDusk.getTime();

  return isMorningBlueHour || isEveningBlueHour;
}

/**
 * Determine the time of day for photography purposes
 */
export function getTimeOfDay(date: Date, lat: number, lng: number): TimeOfDay {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();

  // Check golden hours first (most specific)
  if (
    currentTime >= times.goldenHourMorning.getTime() &&
    currentTime <= times.goldenHourMorningEnd.getTime()
  ) {
    return 'golden_hour_morning';
  }

  if (
    currentTime >= times.goldenHourEvening.getTime() &&
    currentTime <= times.goldenHourEveningEnd.getTime()
  ) {
    return 'golden_hour_evening';
  }

  // Check blue hours
  if (
    currentTime >= times.nauticalDawn.getTime() &&
    currentTime < times.sunrise.getTime()
  ) {
    return 'blue_hour_morning';
  }

  if (
    currentTime > times.sunset.getTime() &&
    currentTime <= times.nauticalDusk.getTime()
  ) {
    return 'blue_hour_evening';
  }

  // Check twilight periods
  if (
    currentTime >= times.dawn.getTime() &&
    currentTime < times.sunrise.getTime()
  ) {
    return 'civil_twilight';
  }

  if (
    currentTime > times.sunset.getTime() &&
    currentTime <= times.dusk.getTime()
  ) {
    return 'civil_twilight';
  }

  if (
    currentTime >= times.nauticalDawn.getTime() &&
    currentTime < times.dawn.getTime()
  ) {
    return 'nautical_twilight';
  }

  if (
    currentTime > times.dusk.getTime() &&
    currentTime <= times.nauticalDusk.getTime()
  ) {
    return 'nautical_twilight';
  }

  if (
    currentTime >= times.nightEnd.getTime() &&
    currentTime < times.nauticalDawn.getTime()
  ) {
    return 'astronomical_twilight';
  }

  if (
    currentTime > times.nauticalDusk.getTime() &&
    currentTime <= times.night.getTime()
  ) {
    return 'astronomical_twilight';
  }

  // Day or night
  if (
    currentTime >= times.sunrise.getTime() &&
    currentTime <= times.sunset.getTime()
  ) {
    return 'day';
  }

  return 'night';
}

/**
 * Calculate minutes until next golden hour
 * Returns null if currently in golden hour
 */
export function getMinutesToGoldenHour(
  date: Date,
  lat: number,
  lng: number
): number | null {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();

  // If in golden hour, return null
  if (isGoldenHour(date, lat, lng)) {
    return null;
  }

  // Check morning golden hour
  const morningGoldenHourTime = times.goldenHourMorning.getTime();
  if (currentTime < morningGoldenHourTime) {
    return Math.round((morningGoldenHourTime - currentTime) / 60000);
  }

  // Check evening golden hour
  const eveningGoldenHourTime = times.goldenHourEvening.getTime();
  if (currentTime < eveningGoldenHourTime) {
    return Math.round((eveningGoldenHourTime - currentTime) / 60000);
  }

  // Next golden hour is tomorrow morning
  const tomorrow = new Date(date);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowTimes = getSunTimes(tomorrow, lat, lng);
  return Math.round(
    (tomorrowTimes.goldenHourMorning.getTime() - currentTime) / 60000
  );
}

/**
 * Calculate minutes until sunrise
 * Returns null if sun has already risen today
 */
export function getMinutesToSunrise(
  date: Date,
  lat: number,
  lng: number
): number | null {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();
  const sunriseTime = times.sunrise.getTime();

  if (currentTime >= sunriseTime) {
    return null;
  }

  return Math.round((sunriseTime - currentTime) / 60000);
}

/**
 * Calculate minutes until sunset
 * Returns null if sun has already set today
 */
export function getMinutesToSunset(
  date: Date,
  lat: number,
  lng: number
): number | null {
  const times = getSunTimes(date, lat, lng);
  const currentTime = date.getTime();
  const sunsetTime = times.sunset.getTime();

  if (currentTime >= sunsetTime) {
    return null;
  }

  return Math.round((sunsetTime - currentTime) / 60000);
}

/**
 * Get comprehensive photography conditions for a location and time
 */
export function getPhotographyConditions(
  date: Date,
  lat: number,
  lng: number
): PhotographyConditions {
  const position = getSunPosition(date, lat, lng);

  return {
    timeOfDay: getTimeOfDay(date, lat, lng),
    isGoldenHour: isGoldenHour(date, lat, lng),
    isBlueHour: isBlueHour(date, lat, lng),
    minutesToGoldenHour: getMinutesToGoldenHour(date, lat, lng),
    minutesToSunrise: getMinutesToSunrise(date, lat, lng),
    minutesToSunset: getMinutesToSunset(date, lat, lng),
    sunAltitude: position.altitudeDegrees,
    sunAzimuth: position.azimuthDegrees,
  };
}

/**
 * Format time for display (HH:MM)
 */
export function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * Format duration in minutes to human-readable string
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  if (mins === 0) {
    return `${hours}h`;
  }

  return `${hours}h ${mins}m`;
}
