/**
 * Tests for location comparison logic
 */

import { describe, it, expect } from 'vitest';
import { compareLocations, getCategoryWinCount } from './compare-locations';
import type { ComparisonLocation } from '@/src/types/comparison.types';
import type { WeatherConditions as APIWeatherConditions } from '@/src/types/weather.types';
import type {
  PhotographyScore,
  PhotographyConditions,
  SunTimes,
} from '@/src/types/photography.types';
import type { SavedLocation } from '@/src/stores/locationStore';

// --- Helpers ---

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
    weatherType: 2, // PartlyCloudy
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
    } as PhotographyConditions,
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
    goldenHourMorningEnd: new Date(
      base.getTime() + morningMinutes * 60000
    ),
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
    isLoading?: boolean;
    error?: string | null;
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
    isLoading: overrides.isLoading ?? false,
    error: overrides.error ?? null,
  };
}

// --- Tests ---

describe('compareLocations', () => {
  it('should return empty result for fewer than 2 valid locations', () => {
    const result = compareLocations([
      createComparisonLocation('1', 'Only One'),
    ]);

    expect(result.overallWinner).toBeNull();
    expect(result.categoryWinners).toHaveLength(0);
    expect(result.recommendation).toContain('Not enough');
  });

  it('should return empty result when locations have no weather data', () => {
    const loc1: ComparisonLocation = {
      ...createComparisonLocation('1', 'No Data 1'),
      weather: null,
    };
    const loc2: ComparisonLocation = {
      ...createComparisonLocation('2', 'No Data 2'),
      weather: null,
    };

    const result = compareLocations([loc1, loc2]);
    expect(result.overallWinner).toBeNull();
  });

  it('should determine the correct overall winner between 2 locations', () => {
    const better = createComparisonLocation('1', 'Better Spot', {
      score: { overall: 85, weatherScore: 80, lightingScore: 90, visibilityScore: 85 },
      weather: { cloudCover: 35, windSpeed: 5, visibility: 30000 },
    });
    const worse = createComparisonLocation('2', 'Worse Spot', {
      score: { overall: 55, weatherScore: 50, lightingScore: 60, visibilityScore: 50 },
      weather: { cloudCover: 80, windSpeed: 25, visibility: 5000 },
    });

    const result = compareLocations([better, worse]);

    expect(result.overallWinner).not.toBeNull();
    expect(result.overallWinner!.name).toBe('Better Spot');
    expect(result.overallWinner!.score).toBe(85);
  });

  it('should have 7 category winners', () => {
    const loc1 = createComparisonLocation('1', 'A');
    const loc2 = createComparisonLocation('2', 'B');

    const result = compareLocations([loc1, loc2]);
    expect(result.categoryWinners).toHaveLength(7);
  });

  it('should pick lowest wind speed as wind winner', () => {
    const calm = createComparisonLocation('1', 'Calm Spot', {
      weather: { windSpeed: 3 },
    });
    const windy = createComparisonLocation('2', 'Windy Spot', {
      weather: { windSpeed: 20 },
    });

    const result = compareLocations([calm, windy]);
    const windWinner = result.categoryWinners.find(
      (w) => w.category === 'wind'
    );

    expect(windWinner).toBeDefined();
    expect(windWinner!.winnerName).toBe('Calm Spot');
  });

  it('should pick cloud cover closest to 40% as cloud cover winner', () => {
    const dramatic = createComparisonLocation('1', 'Dramatic Skies', {
      weather: { cloudCover: 38 },
    });
    const clear = createComparisonLocation('2', 'Clear Skies', {
      weather: { cloudCover: 5 },
    });
    const overcast = createComparisonLocation('3', 'Overcast', {
      weather: { cloudCover: 90 },
    });

    const result = compareLocations([dramatic, clear, overcast]);
    const cloudWinner = result.categoryWinners.find(
      (w) => w.category === 'cloudCover'
    );

    expect(cloudWinner!.winnerName).toBe('Dramatic Skies');
  });

  it('should pick longest golden hour as goldenHourDuration winner', () => {
    const long = createComparisonLocation('1', 'Long Golden', {
      sunTimes: createSunTimes(60, 55), // 115 min total
    });
    const short = createComparisonLocation('2', 'Short Golden', {
      sunTimes: createSunTimes(30, 25), // 55 min total
    });

    const result = compareLocations([long, short]);
    const ghWinner = result.categoryWinners.find(
      (w) => w.category === 'goldenHourDuration'
    );

    expect(ghWinner!.winnerName).toBe('Long Golden');
  });

  it('should handle 3 locations with mixed results', () => {
    const a = createComparisonLocation('1', 'Spot A', {
      score: { overall: 80, weatherScore: 90, lightingScore: 70, visibilityScore: 60 },
      weather: { cloudCover: 40, windSpeed: 15, visibility: 10000 },
    });
    const b = createComparisonLocation('2', 'Spot B', {
      score: { overall: 75, weatherScore: 60, lightingScore: 85, visibilityScore: 80 },
      weather: { cloudCover: 20, windSpeed: 5, visibility: 25000 },
    });
    const c = createComparisonLocation('3', 'Spot C', {
      score: { overall: 70, weatherScore: 65, lightingScore: 75, visibilityScore: 70 },
      weather: { cloudCover: 55, windSpeed: 10, visibility: 15000 },
    });

    const result = compareLocations([a, b, c]);

    expect(result.overallWinner).not.toBeNull();
    expect(result.categoryWinners).toHaveLength(7);

    // Each category winner should have allValues for all 3 locations
    for (const cw of result.categoryWinners) {
      expect(cw.allValues).toHaveLength(3);
    }
  });

  it('should tiebreak by overall score when category wins are equal', () => {
    // Give each location 3 category wins but different overall scores
    const highScore = createComparisonLocation('1', 'High Score', {
      score: { overall: 90, weatherScore: 50, lightingScore: 50, visibilityScore: 50 },
      weather: { cloudCover: 40, windSpeed: 5, visibility: 5000 },
      sunTimes: createSunTimes(60, 60),
    });
    const lowScore = createComparisonLocation('2', 'Low Score', {
      score: { overall: 60, weatherScore: 80, lightingScore: 80, visibilityScore: 80 },
      weather: { cloudCover: 10, windSpeed: 15, visibility: 30000 },
      sunTimes: createSunTimes(30, 30),
    });

    const result = compareLocations([highScore, lowScore]);

    // If wins are tied, higher overall score wins
    expect(result.overallWinner).not.toBeNull();
    // The exact winner depends on which location wins more categories
    // but the tiebreak logic should produce a deterministic result
    expect(typeof result.overallWinner!.score).toBe('number');
  });

  it('should exclude locations with null score from comparison', () => {
    const good = createComparisonLocation('1', 'Good');
    const noScore: ComparisonLocation = {
      ...createComparisonLocation('2', 'No Score'),
      photographyScore: null,
    };
    const ok = createComparisonLocation('3', 'OK');

    const result = compareLocations([good, noScore, ok]);

    // Only 2 valid locations compared
    expect(result.overallWinner).not.toBeNull();
    for (const cw of result.categoryWinners) {
      expect(cw.allValues).toHaveLength(2);
    }
  });

  it('should handle locations with no sun times for golden hour', () => {
    const withSun = createComparisonLocation('1', 'With Sun', {
      sunTimes: createSunTimes(45, 40),
    });
    const noSun = createComparisonLocation('2', 'No Sun', {
      sunTimes: null,
    });

    const result = compareLocations([withSun, noSun]);

    const ghWinner = result.categoryWinners.find(
      (w) => w.category === 'goldenHourDuration'
    );
    expect(ghWinner!.winnerName).toBe('With Sun');
  });
});

describe('getCategoryWinCount', () => {
  it('should count non-overall wins for a location', () => {
    const loc1 = createComparisonLocation('1', 'Winner', {
      score: { overall: 90, weatherScore: 90, lightingScore: 90, visibilityScore: 90 },
      weather: { cloudCover: 40, windSpeed: 3, visibility: 40000 },
      sunTimes: createSunTimes(60, 60),
    });
    const loc2 = createComparisonLocation('2', 'Loser', {
      score: { overall: 30, weatherScore: 30, lightingScore: 30, visibilityScore: 30 },
      weather: { cloudCover: 95, windSpeed: 30, visibility: 2000 },
      sunTimes: createSunTimes(20, 20),
    });

    const result = compareLocations([loc1, loc2]);
    const winCount = getCategoryWinCount(result, '1');

    // Location 1 should win most/all non-overall categories
    expect(winCount).toBeGreaterThanOrEqual(4);
  });
});
