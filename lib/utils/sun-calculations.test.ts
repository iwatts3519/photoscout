/**
 * Tests for sun calculations
 */

import { describe, it, expect } from 'vitest';
import {
  getSunTimes,
  getSunPosition,
  isGoldenHour,
  isBlueHour,
  getTimeOfDay,
  getMinutesToGoldenHour,
  getMinutesToSunrise,
  getMinutesToSunset,
  getPhotographyConditions,
  formatTime,
  formatDuration,
} from './sun-calculations';

// Test location: London, UK
const LONDON_LAT = 51.5074;
const LONDON_LNG = -0.1278;

// Test location: Lake District, UK
const LAKE_DISTRICT_LAT = 54.4609;
const LAKE_DISTRICT_LNG = -3.0886;

describe('sun-calculations', () => {
  describe('getSunTimes', () => {
    it('should calculate sun times for a summer day in London', () => {
      // June 21, 2024 (summer solstice)
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      expect(times.sunrise).toBeInstanceOf(Date);
      expect(times.sunset).toBeInstanceOf(Date);
      expect(times.goldenHourMorning).toBeInstanceOf(Date);
      expect(times.goldenHourEvening).toBeInstanceOf(Date);

      // Summer day should have sunrise before noon and sunset after noon
      expect(times.sunrise.getTime()).toBeLessThan(date.getTime());
      expect(times.sunset.getTime()).toBeGreaterThan(date.getTime());

      // Golden hour timing checks
      // Morning golden hour starts at sunrise, ends after sunrise
      expect(times.goldenHourMorning.getTime()).toBeLessThanOrEqual(
        times.sunrise.getTime()
      );
      expect(times.goldenHourMorningEnd.getTime()).toBeGreaterThan(
        times.sunrise.getTime()
      );

      // Evening golden hour starts before sunset, ends at sunset
      expect(times.goldenHourEvening.getTime()).toBeLessThan(
        times.sunset.getTime()
      );
      expect(times.goldenHourEveningEnd.getTime()).toBeLessThanOrEqual(
        times.sunset.getTime()
      );
    });

    it('should calculate sun times for a winter day in London', () => {
      // December 21, 2024 (winter solstice)
      const date = new Date('2024-12-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // Winter day should have later sunrise and earlier sunset than summer
      const summerDate = new Date('2024-06-21T12:00:00Z');
      const summerTimes = getSunTimes(summerDate, LONDON_LAT, LONDON_LNG);

      expect(times.sunrise.getHours()).toBeGreaterThan(
        summerTimes.sunrise.getHours()
      );
      expect(times.sunset.getHours()).toBeLessThan(
        summerTimes.sunset.getHours()
      );
    });

    it('should include all required sun time properties', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      expect(times).toHaveProperty('sunrise');
      expect(times).toHaveProperty('sunset');
      expect(times).toHaveProperty('sunriseEnd');
      expect(times).toHaveProperty('sunsetStart');
      expect(times).toHaveProperty('goldenHourMorning');
      expect(times).toHaveProperty('goldenHourMorningEnd');
      expect(times).toHaveProperty('goldenHourEvening');
      expect(times).toHaveProperty('goldenHourEveningEnd');
      expect(times).toHaveProperty('solarNoon');
      expect(times).toHaveProperty('dawn');
      expect(times).toHaveProperty('dusk');
      expect(times).toHaveProperty('nauticalDawn');
      expect(times).toHaveProperty('nauticalDusk');
    });
  });

  describe('getSunPosition', () => {
    it('should calculate sun position at solar noon', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);
      const position = getSunPosition(times.solarNoon, LONDON_LAT, LONDON_LNG);

      // At solar noon, sun should be at highest altitude
      expect(position.altitude).toBeGreaterThan(0);
      expect(position.altitudeDegrees).toBeGreaterThan(0);
      expect(position.altitudeDegrees).toBeLessThan(90);

      // Azimuth should be roughly south (180 degrees)
      expect(position.azimuthDegrees).toBeGreaterThan(170);
      expect(position.azimuthDegrees).toBeLessThan(190);
    });

    it('should convert radians to degrees correctly', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const position = getSunPosition(date, LONDON_LAT, LONDON_LNG);

      // Altitude in degrees should be in valid range
      expect(position.altitudeDegrees).toBeGreaterThanOrEqual(-90);
      expect(position.altitudeDegrees).toBeLessThanOrEqual(90);

      // Azimuth in degrees should be 0-360
      expect(position.azimuthDegrees).toBeGreaterThanOrEqual(0);
      expect(position.azimuthDegrees).toBeLessThan(360);
    });

    it('should show negative altitude at night', () => {
      // Midnight
      const date = new Date('2024-06-21T00:00:00Z');
      const position = getSunPosition(date, LONDON_LAT, LONDON_LNG);

      expect(position.altitudeDegrees).toBeLessThan(0);
    });
  });

  describe('isGoldenHour', () => {
    it('should return true during morning golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 10 minutes after golden hour starts
      const goldenHourTime = new Date(
        times.goldenHourMorning.getTime() + 10 * 60000
      );
      expect(isGoldenHour(goldenHourTime, LONDON_LAT, LONDON_LNG)).toBe(true);
    });

    it('should return true during evening golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 10 minutes after evening golden hour starts
      const goldenHourTime = new Date(
        times.goldenHourEvening.getTime() + 10 * 60000
      );
      expect(isGoldenHour(goldenHourTime, LONDON_LAT, LONDON_LNG)).toBe(true);
    });

    it('should return false during midday', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      expect(isGoldenHour(date, LONDON_LAT, LONDON_LNG)).toBe(false);
    });

    it('should return false at night', () => {
      const date = new Date('2024-06-21T00:00:00Z');
      expect(isGoldenHour(date, LONDON_LAT, LONDON_LNG)).toBe(false);
    });
  });

  describe('isBlueHour', () => {
    it('should return true during morning blue hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // Between nautical dawn and sunrise
      const blueHourTime = new Date(
        times.nauticalDawn.getTime() +
          (times.sunrise.getTime() - times.nauticalDawn.getTime()) / 2
      );
      expect(isBlueHour(blueHourTime, LONDON_LAT, LONDON_LNG)).toBe(true);
    });

    it('should return true during evening blue hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // Between sunset and nautical dusk
      const blueHourTime = new Date(
        times.sunset.getTime() +
          (times.nauticalDusk.getTime() - times.sunset.getTime()) / 2
      );
      expect(isBlueHour(blueHourTime, LONDON_LAT, LONDON_LNG)).toBe(true);
    });

    it('should return false during day', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      expect(isBlueHour(date, LONDON_LAT, LONDON_LNG)).toBe(false);
    });
  });

  describe('getTimeOfDay', () => {
    it('should identify morning golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);
      const goldenHourTime = new Date(
        times.goldenHourMorning.getTime() + 10 * 60000
      );

      expect(getTimeOfDay(goldenHourTime, LONDON_LAT, LONDON_LNG)).toBe(
        'golden_hour_morning'
      );
    });

    it('should identify evening golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);
      const goldenHourTime = new Date(
        times.goldenHourEvening.getTime() + 10 * 60000
      );

      expect(getTimeOfDay(goldenHourTime, LONDON_LAT, LONDON_LNG)).toBe(
        'golden_hour_evening'
      );
    });

    it('should identify day', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      expect(getTimeOfDay(date, LONDON_LAT, LONDON_LNG)).toBe('day');
    });

    it('should identify night', () => {
      const date = new Date('2024-12-21T02:00:00Z');
      expect(getTimeOfDay(date, LONDON_LAT, LONDON_LNG)).toBe('night');
    });

    it('should identify blue hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // Morning blue hour
      const morningBlueHour = new Date(
        times.nauticalDawn.getTime() + 10 * 60000
      );
      expect(getTimeOfDay(morningBlueHour, LONDON_LAT, LONDON_LNG)).toBe(
        'blue_hour_morning'
      );

      // Evening blue hour
      const eveningBlueHour = new Date(times.sunset.getTime() + 10 * 60000);
      expect(getTimeOfDay(eveningBlueHour, LONDON_LAT, LONDON_LNG)).toBe(
        'blue_hour_evening'
      );
    });
  });

  describe('getMinutesToGoldenHour', () => {
    it('should return null during golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);
      const goldenHourTime = new Date(
        times.goldenHourMorning.getTime() + 10 * 60000
      );

      expect(
        getMinutesToGoldenHour(goldenHourTime, LONDON_LAT, LONDON_LNG)
      ).toBeNull();
    });

    it('should calculate minutes to morning golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 1 hour before golden hour
      const beforeGoldenHour = new Date(
        times.goldenHourMorning.getTime() - 60 * 60000
      );
      const minutes = getMinutesToGoldenHour(
        beforeGoldenHour,
        LONDON_LAT,
        LONDON_LNG
      );

      expect(minutes).toBe(60);
    });

    it('should calculate minutes to evening golden hour', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 30 minutes before evening golden hour
      const beforeGoldenHour = new Date(
        times.goldenHourEvening.getTime() - 30 * 60000
      );
      const minutes = getMinutesToGoldenHour(
        beforeGoldenHour,
        LONDON_LAT,
        LONDON_LNG
      );

      expect(minutes).toBe(30);
    });
  });

  describe('getMinutesToSunrise', () => {
    it('should return null after sunrise', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      expect(getMinutesToSunrise(date, LONDON_LAT, LONDON_LNG)).toBeNull();
    });

    it('should calculate minutes to sunrise', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 1 hour before sunrise
      const beforeSunrise = new Date(times.sunrise.getTime() - 60 * 60000);
      const minutes = getMinutesToSunrise(
        beforeSunrise,
        LONDON_LAT,
        LONDON_LNG
      );

      expect(minutes).toBe(60);
    });
  });

  describe('getMinutesToSunset', () => {
    it('should return null after sunset', () => {
      const date = new Date('2024-06-21T22:00:00Z');
      expect(getMinutesToSunset(date, LONDON_LAT, LONDON_LNG)).toBeNull();
    });

    it('should calculate minutes to sunset', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const times = getSunTimes(date, LONDON_LAT, LONDON_LNG);

      // 2 hours before sunset
      const beforeSunset = new Date(times.sunset.getTime() - 120 * 60000);
      const minutes = getMinutesToSunset(beforeSunset, LONDON_LAT, LONDON_LNG);

      expect(minutes).toBe(120);
    });
  });

  describe('getPhotographyConditions', () => {
    it('should return comprehensive conditions', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const conditions = getPhotographyConditions(
        date,
        LONDON_LAT,
        LONDON_LNG
      );

      expect(conditions).toHaveProperty('timeOfDay');
      expect(conditions).toHaveProperty('isGoldenHour');
      expect(conditions).toHaveProperty('isBlueHour');
      expect(conditions).toHaveProperty('minutesToGoldenHour');
      expect(conditions).toHaveProperty('minutesToSunrise');
      expect(conditions).toHaveProperty('minutesToSunset');
      expect(conditions).toHaveProperty('sunAltitude');
      expect(conditions).toHaveProperty('sunAzimuth');
    });

    it('should include sun position', () => {
      const date = new Date('2024-06-21T12:00:00Z');
      const conditions = getPhotographyConditions(
        date,
        LONDON_LAT,
        LONDON_LNG
      );

      expect(typeof conditions.sunAltitude).toBe('number');
      expect(typeof conditions.sunAzimuth).toBe('number');
      expect(conditions.sunAzimuth).toBeGreaterThanOrEqual(0);
      expect(conditions.sunAzimuth).toBeLessThan(360);
    });

    it('should work for different UK locations', () => {
      const date = new Date('2024-06-21T12:00:00Z');

      const londonConditions = getPhotographyConditions(
        date,
        LONDON_LAT,
        LONDON_LNG
      );
      const lakeDistrictConditions = getPhotographyConditions(
        date,
        LAKE_DISTRICT_LAT,
        LAKE_DISTRICT_LNG
      );

      // Both should return valid conditions
      expect(londonConditions.timeOfDay).toBeDefined();
      expect(lakeDistrictConditions.timeOfDay).toBeDefined();

      // Sun times should differ slightly between locations
      expect(londonConditions.sunAltitude).not.toBe(
        lakeDistrictConditions.sunAltitude
      );
    });
  });

  describe('formatTime', () => {
    it('should format time as HH:MM', () => {
      const date = new Date('2024-06-21T14:30:00Z');
      const formatted = formatTime(date);

      expect(formatted).toMatch(/^\d{2}:\d{2}$/);
    });

    it('should use 24-hour format', () => {
      const afternoon = new Date('2024-06-21T14:30:00Z');
      const formatted = formatTime(afternoon);

      // Should not contain AM/PM
      expect(formatted).not.toMatch(/AM|PM/i);
    });
  });

  describe('formatDuration', () => {
    it('should format minutes only', () => {
      expect(formatDuration(45)).toBe('45m');
      expect(formatDuration(1)).toBe('1m');
    });

    it('should format hours only', () => {
      expect(formatDuration(60)).toBe('1h');
      expect(formatDuration(120)).toBe('2h');
    });

    it('should format hours and minutes', () => {
      expect(formatDuration(90)).toBe('1h 30m');
      expect(formatDuration(125)).toBe('2h 5m');
    });
  });
});
