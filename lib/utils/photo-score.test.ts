/**
 * Tests for photography scoring algorithm
 */

import { describe, it, expect } from 'vitest';
import {
  calculatePhotographyScore,
  isIdealForPhotography,
  getNextBestPhotoTime,
} from './photo-score';
import type {
  PhotographyConditions,
  WeatherConditions,
} from '@/src/types/photography.types';

// Test data helpers
function createConditions(
  overrides: Partial<PhotographyConditions> = {}
): PhotographyConditions {
  return {
    timeOfDay: 'day',
    isGoldenHour: false,
    isBlueHour: false,
    minutesToGoldenHour: 120,
    minutesToSunrise: null,
    minutesToSunset: 240,
    sunAltitude: 45,
    sunAzimuth: 180,
    ...overrides,
  };
}

function createWeather(
  overrides: Partial<WeatherConditions> = {}
): WeatherConditions {
  return {
    cloudCoverPercent: 30,
    visibilityMeters: 20000,
    windSpeedMph: 8,
    precipitationProbability: 10,
    temperature: 15,
    ...overrides,
  };
}

describe('photo-score', () => {
  describe('calculatePhotographyScore', () => {
    it('should give excellent score during golden hour with good weather', () => {
      const conditions = createConditions({
        isGoldenHour: true,
        timeOfDay: 'golden_hour_evening',
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.overall).toBeGreaterThanOrEqual(80);
      expect(score.recommendation).toBe('excellent');
      expect(score.lightingScore).toBe(100);
    });

    it('should include golden hour in reasons', () => {
      const conditions = createConditions({
        isGoldenHour: true,
        timeOfDay: 'golden_hour_morning',
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.reasons).toContain(
        'Golden hour - perfect lighting for landscapes'
      );
    });

    it('should give high score during blue hour', () => {
      const conditions = createConditions({
        isBlueHour: true,
        timeOfDay: 'blue_hour_evening',
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.lightingScore).toBe(90);
      expect(score.overall).toBeGreaterThanOrEqual(70);
      expect(score.reasons).toContain(
        'Blue hour - excellent for moody photography'
      );
    });

    it('should give moderate score during midday', () => {
      const conditions = createConditions({
        timeOfDay: 'day',
        sunAltitude: 60,
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.lightingScore).toBeLessThan(70);
      expect(score.overall).toBeLessThan(80);
    });

    it('should penalize overcast conditions', () => {
      const conditions = createConditions();
      const clearWeather = createWeather({ cloudCoverPercent: 10 });
      const overcastWeather = createWeather({ cloudCoverPercent: 95 });

      const clearScore = calculatePhotographyScore(conditions, clearWeather);
      const overcastScore = calculatePhotographyScore(
        conditions,
        overcastWeather
      );

      expect(clearScore.weatherScore).toBeGreaterThan(
        overcastScore.weatherScore
      );
      expect(overcastScore.reasons).toContain(
        'Overcast conditions - flat lighting'
      );
    });

    it('should bonus partly cloudy conditions', () => {
      const conditions = createConditions();
      const clearWeather = createWeather({ cloudCoverPercent: 10 });
      const partlyCloudyWeather = createWeather({ cloudCoverPercent: 45 });

      const clearScore = calculatePhotographyScore(conditions, clearWeather);
      const partlyCloudyScore = calculatePhotographyScore(
        conditions,
        partlyCloudyWeather
      );

      // Partly cloudy should get bonus for dramatic skies
      expect(partlyCloudyScore.weatherScore).toBeGreaterThanOrEqual(
        clearScore.weatherScore
      );
      expect(partlyCloudyScore.reasons).toContain(
        'Partly cloudy - good for dramatic skies'
      );
    });

    it('should penalize high precipitation probability', () => {
      const conditions = createConditions();
      const dryWeather = createWeather({ precipitationProbability: 5 });
      const rainyWeather = createWeather({ precipitationProbability: 80 });

      const dryScore = calculatePhotographyScore(conditions, dryWeather);
      const rainyScore = calculatePhotographyScore(conditions, rainyWeather);

      expect(dryScore.weatherScore).toBeGreaterThan(rainyScore.weatherScore);
      expect(rainyScore.reasons).toContain(
        'High chance of rain - protect your gear'
      );
    });

    it('should penalize strong winds', () => {
      const conditions = createConditions();
      const calmWeather = createWeather({ windSpeedMph: 5 });
      const windyWeather = createWeather({ windSpeedMph: 35 });

      const calmScore = calculatePhotographyScore(conditions, calmWeather);
      const windyScore = calculatePhotographyScore(conditions, windyWeather);

      expect(calmScore.weatherScore).toBeGreaterThan(windyScore.weatherScore);
      expect(windyScore.reasons).toContain(
        'Strong winds - tripod stability may be challenging'
      );
    });

    it('should score visibility correctly', () => {
      const conditions = createConditions();

      // Excellent visibility
      const excellentVis = createWeather({ visibilityMeters: 50000 });
      const excellentScore = calculatePhotographyScore(
        conditions,
        excellentVis
      );
      expect(excellentScore.visibilityScore).toBe(100);
      expect(excellentScore.reasons).toContain(
        'Excellent visibility for distant landscapes'
      );

      // Poor visibility
      const poorVis = createWeather({ visibilityMeters: 3000 });
      const poorScore = calculatePhotographyScore(conditions, poorVis);
      expect(poorScore.visibilityScore).toBeLessThan(60);
      expect(poorScore.reasons).toContain(
        'Limited visibility may affect distant views'
      );
    });

    it('should alert about upcoming golden hour', () => {
      const conditions = createConditions({
        minutesToGoldenHour: 45,
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.reasons).toContain('Golden hour starting in 45 minutes');
    });

    it('should warn about harsh midday light', () => {
      const conditions = createConditions({
        timeOfDay: 'day',
        sunAltitude: 70,
      });
      const weather = createWeather();

      const score = calculatePhotographyScore(conditions, weather);

      expect(score.reasons).toContain(
        'Harsh midday light - consider waiting for golden hour'
      );
    });

    it('should include temperature warnings', () => {
      const conditions = createConditions();

      // Freezing
      const coldWeather = createWeather({ temperature: -5 });
      const coldScore = calculatePhotographyScore(conditions, coldWeather);
      expect(coldScore.reasons).toContain(
        'Freezing temperatures - dress warmly, protect batteries'
      );

      // Hot
      const hotWeather = createWeather({ temperature: 28 });
      const hotScore = calculatePhotographyScore(conditions, hotWeather);
      expect(hotScore.reasons).toContain('Warm conditions - stay hydrated');
    });

    it('should weight lighting most heavily in overall score', () => {
      // Golden hour with poor weather should still score well
      const goldenHourBadWeather = createConditions({
        isGoldenHour: true,
        timeOfDay: 'golden_hour_evening',
      });
      const badWeather = createWeather({
        cloudCoverPercent: 95,
        windSpeedMph: 30,
        visibilityMeters: 3000,
      });

      const score = calculatePhotographyScore(
        goldenHourBadWeather,
        badWeather
      );

      // Should still get decent score because lighting is weighted 50%
      expect(score.overall).toBeGreaterThan(50);
      expect(score.lightingScore).toBe(100);
    });

    it('should return correct recommendation levels', () => {
      // Excellent
      const excellentWeather = createWeather({
        cloudCoverPercent: 40,
        visibilityMeters: 50000,
        windSpeedMph: 5,
        precipitationProbability: 0,
      });
      const excellentConditions = createConditions({
        isGoldenHour: true,
        timeOfDay: 'golden_hour_evening',
      });
      const excellent = calculatePhotographyScore(
        excellentConditions,
        excellentWeather
      );
      expect(excellent.recommendation).toBe('excellent');
      expect(excellent.overall).toBeGreaterThanOrEqual(80);

      // Fair
      const fairConditions = createConditions({ timeOfDay: 'day' });
      const fairWeather = createWeather({
        cloudCoverPercent: 85,
        windSpeedMph: 25,
        visibilityMeters: 8000,
      });
      const fair = calculatePhotographyScore(fairConditions, fairWeather);
      expect(fair.recommendation).toBe('fair');
      expect(fair.overall).toBeLessThan(65);
    });
  });

  describe('isIdealForPhotography', () => {
    it('should return true for excellent conditions', () => {
      const conditions = createConditions({
        isGoldenHour: true,
        timeOfDay: 'golden_hour_evening',
      });
      const weather = createWeather({
        cloudCoverPercent: 40,
        visibilityMeters: 30000,
        windSpeedMph: 8,
        precipitationProbability: 5,
      });

      expect(isIdealForPhotography(conditions, weather)).toBe(true);
    });

    it('should return false for poor conditions', () => {
      const conditions = createConditions({
        timeOfDay: 'day',
        sunAltitude: 70,
      });
      const weather = createWeather({
        cloudCoverPercent: 95,
        precipitationProbability: 80,
        windSpeedMph: 35,
      });

      expect(isIdealForPhotography(conditions, weather)).toBe(false);
    });
  });

  describe('getNextBestPhotoTime', () => {
    it('should return null if already in golden hour', () => {
      const conditions = createConditions({
        isGoldenHour: true,
        minutesToGoldenHour: null,
      });

      expect(getNextBestPhotoTime(conditions)).toBeNull();
    });

    it('should return golden hour if upcoming', () => {
      const conditions = createConditions({
        minutesToGoldenHour: 90,
      });

      const result = getNextBestPhotoTime(conditions);

      expect(result).not.toBeNull();
      expect(result?.time).toBe('golden hour');
      expect(result?.minutesAway).toBe(90);
    });

    it('should return sunset if no golden hour', () => {
      const conditions = createConditions({
        minutesToGoldenHour: null,
        minutesToSunset: 180,
      });

      const result = getNextBestPhotoTime(conditions);

      expect(result).not.toBeNull();
      expect(result?.time).toBe('sunset');
      expect(result?.minutesAway).toBe(180);
    });

    it('should return null if no upcoming opportunities', () => {
      const conditions = createConditions({
        minutesToGoldenHour: null,
        minutesToSunset: null,
      });

      expect(getNextBestPhotoTime(conditions)).toBeNull();
    });
  });
});
