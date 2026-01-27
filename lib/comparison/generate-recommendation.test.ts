/**
 * Tests for recommendation generation
 */

import { describe, it, expect } from 'vitest';
import { generateRecommendation } from './generate-recommendation';
import { compareLocations } from './compare-locations';
import type { ComparisonLocation, ComparisonResult } from '@/src/types/comparison.types';
import type { WeatherConditions as APIWeatherConditions } from '@/src/types/weather.types';
import type {
  PhotographyScore,
  SunTimes,
} from '@/src/types/photography.types';
import type { SavedLocation } from '@/src/stores/locationStore';

// --- Helpers (same as compare-locations.test.ts) ---

function createSavedLocation(
  overrides: Partial<SavedLocation> & { id: string; name: string }
): SavedLocation {
  return {
    user_id: 'user-1',
    coordinates: 'POINT(-3.0 54.5)',
    description: null,
    radius_meters: 5000,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    collection_id: null,
    best_time_to_visit: null,
    last_visited: null,
    notes: null,
    tags: null,
    visibility: 'private',
    photo_count: 0,
    view_count: 0,
    favorite_count: 0,
    ...overrides,
  } as SavedLocation;
}

function createWeather(
  overrides: Partial<APIWeatherConditions> = {}
): APIWeatherConditions {
  return {
    temperature: 10,
    feelsLike: 8,
    cloudCover: 40,
    visibility: 20000,
    windSpeed: 10,
    windGust: 15,
    windDirection: 270,
    precipitation: 0,
    humidity: 65,
    pressure: 1013,
    uvIndex: 3,
    weatherType: 2,
    timestamp: '2026-01-27T12:00:00Z',
    ...overrides,
  };
}

function createScore(
  overrides: Partial<PhotographyScore> = {}
): PhotographyScore {
  return {
    overall: 70,
    lightingScore: 80,
    weatherScore: 65,
    visibilityScore: 75,
    conditions: {
      timeOfDay: 'golden_hour_evening',
      isGoldenHour: true,
      isBlueHour: false,
      minutesToGoldenHour: null,
      minutesToSunrise: null,
      minutesToSunset: 30,
      sunAltitude: 10,
      sunAzimuth: 250,
    },
    recommendation: 'good',
    reasons: ['Good conditions'],
    ...overrides,
  };
}

function createSunTimes(morningMinutes = 45, eveningMinutes = 40): SunTimes {
  const base = new Date('2026-01-27T08:00:00Z');
  return {
    sunrise: base,
    sunset: new Date(base.getTime() + 9 * 3600000),
    sunriseEnd: new Date(base.getTime() + 5 * 60000),
    sunsetStart: new Date(base.getTime() + 9 * 3600000 - 5 * 60000),
    goldenHourMorning: base,
    goldenHourMorningEnd: new Date(base.getTime() + morningMinutes * 60000),
    goldenHourEvening: new Date(base.getTime() + 8 * 3600000),
    goldenHourEveningEnd: new Date(
      base.getTime() + 8 * 3600000 + eveningMinutes * 60000
    ),
    solarNoon: new Date(base.getTime() + 4.5 * 3600000),
    nadir: new Date(base.getTime() - 7.5 * 3600000),
    dawn: new Date(base.getTime() - 30 * 60000),
    dusk: new Date(base.getTime() + 9.5 * 3600000),
    nauticalDawn: new Date(base.getTime() - 60 * 60000),
    nauticalDusk: new Date(base.getTime() + 10 * 3600000),
    nightEnd: new Date(base.getTime() - 90 * 60000),
    night: new Date(base.getTime() + 10.5 * 3600000),
  };
}

function createComparisonLocation(
  id: string,
  name: string,
  overrides: {
    score?: Partial<PhotographyScore>;
    weather?: Partial<APIWeatherConditions>;
    sunTimes?: SunTimes | null;
  } = {}
): ComparisonLocation {
  return {
    location: createSavedLocation({ id, name }),
    coordinates: { lat: 54.5, lng: -3.0 },
    weather: {
      current: createWeather(overrides.weather),
      hourly: [],
      location: { latitude: 54.5, longitude: -3.0 },
      fetchedAt: '2026-01-27T12:00:00Z',
    },
    photographyScore: createScore(overrides.score),
    photographyConditions: null,
    sunTimes: overrides.sunTimes !== undefined
      ? overrides.sunTimes
      : createSunTimes(),
    isLoading: false,
    error: null,
  };
}

// --- Tests ---

describe('generateRecommendation', () => {
  it('should return fallback text when result has no winner', () => {
    const emptyResult: ComparisonResult = {
      overallWinner: null,
      categoryWinners: [],
      recommendation: '',
      tradeoffs: [],
    };

    const { recommendation } = generateRecommendation([], emptyResult);
    expect(recommendation).toContain('Not enough data');
  });

  it('should produce a clear winner recommendation', () => {
    const dominant = createComparisonLocation('1', 'Buttermere', {
      score: { overall: 90, weatherScore: 95, lightingScore: 85, visibilityScore: 90 },
      weather: { cloudCover: 38, windSpeed: 4, visibility: 35000 },
      sunTimes: createSunTimes(55, 50),
    });
    const weak = createComparisonLocation('2', 'Derwentwater', {
      score: { overall: 40, weatherScore: 35, lightingScore: 45, visibilityScore: 40 },
      weather: { cloudCover: 85, windSpeed: 25, visibility: 5000 },
      sunTimes: createSunTimes(30, 25),
    });

    const result = compareLocations([dominant, weak]);
    const { recommendation, tradeoffs } = generateRecommendation(
      [dominant, weak],
      result
    );

    expect(recommendation).toContain('Buttermere');
    expect(recommendation).toContain('clear best choice');
    // Dominant location should have few or no tradeoffs
    expect(tradeoffs.length).toBeLessThanOrEqual(3);
  });

  it('should produce a close call recommendation', () => {
    const a = createComparisonLocation('1', 'Spot A', {
      score: { overall: 72, weatherScore: 80, lightingScore: 65, visibilityScore: 70 },
      weather: { cloudCover: 42, windSpeed: 12, visibility: 18000 },
    });
    const b = createComparisonLocation('2', 'Spot B', {
      score: { overall: 70, weatherScore: 60, lightingScore: 78, visibilityScore: 75 },
      weather: { cloudCover: 30, windSpeed: 6, visibility: 22000 },
    });

    const result = compareLocations([a, b]);
    const { recommendation } = generateRecommendation([a, b], result);

    // Should mention the winner by name
    expect(recommendation).toMatch(/Spot [AB]/);
    // Should include a score
    expect(recommendation).toMatch(/\d+\/100/);
  });

  it('should handle all-poor conditions', () => {
    const poor1 = createComparisonLocation('1', 'Rainy Place', {
      score: { overall: 25, recommendation: 'poor' },
    });
    const poor2 = createComparisonLocation('2', 'Foggy Place', {
      score: { overall: 20, recommendation: 'poor' },
    });

    const result = compareLocations([poor1, poor2]);
    const { recommendation } = generateRecommendation(
      [poor1, poor2],
      result
    );

    expect(recommendation).toContain('None of the locations');
    expect(recommendation).toContain('best option');
  });

  it('should generate tradeoffs for the winner', () => {
    // Winner has best score but worse wind
    const winner = createComparisonLocation('1', 'Best Overall', {
      score: { overall: 85, weatherScore: 80, lightingScore: 90, visibilityScore: 85 },
      weather: { cloudCover: 38, windSpeed: 20, visibility: 30000 },
    });
    const other = createComparisonLocation('2', 'Calm Place', {
      score: { overall: 60, weatherScore: 55, lightingScore: 65, visibilityScore: 60 },
      weather: { cloudCover: 70, windSpeed: 3, visibility: 10000 },
    });

    const result = compareLocations([winner, other]);
    const { tradeoffs } = generateRecommendation([winner, other], result);

    // Should have at least one tradeoff mentioning the other location's wind advantage
    const windTradeoff = tradeoffs.find((t) => t.includes('Calm Place'));
    expect(windTradeoff).toBeDefined();
  });

  it('should limit tradeoffs to 3', () => {
    // Create a scenario where the winner loses many categories
    const winner = createComparisonLocation('1', 'Winner', {
      score: { overall: 80, weatherScore: 40, lightingScore: 40, visibilityScore: 40 },
      weather: { cloudCover: 90, windSpeed: 30, visibility: 2000 },
      sunTimes: createSunTimes(20, 20),
    });
    const other = createComparisonLocation('2', 'Other', {
      score: { overall: 50, weatherScore: 80, lightingScore: 80, visibilityScore: 80 },
      weather: { cloudCover: 40, windSpeed: 5, visibility: 30000 },
      sunTimes: createSunTimes(60, 60),
    });

    const result = compareLocations([winner, other]);
    const { tradeoffs } = generateRecommendation([winner, other], result);

    expect(tradeoffs.length).toBeLessThanOrEqual(3);
  });

  it('should work with 3 locations', () => {
    const a = createComparisonLocation('1', 'Alpha', {
      score: { overall: 80 },
    });
    const b = createComparisonLocation('2', 'Beta', {
      score: { overall: 70 },
    });
    const c = createComparisonLocation('3', 'Gamma', {
      score: { overall: 60 },
    });

    const result = compareLocations([a, b, c]);
    const { recommendation } = generateRecommendation([a, b, c], result);

    expect(recommendation.length).toBeGreaterThan(0);
    expect(recommendation).toMatch(/\d+\/100/);
  });
});
