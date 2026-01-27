/**
 * Core comparison logic for comparing photography locations
 * Pure functions - no side effects, fully testable
 */

import type {
  ComparisonLocation,
  ComparisonCategory,
  CategoryWinner,
  ComparisonResult,
} from '@/src/types/comparison.types';

/** Extracted numeric metrics for a single location */
interface LocationMetrics {
  locationId: string;
  name: string;
  overallScore: number;
  weatherScore: number;
  lightingScore: number;
  visibilityScore: number;
  cloudCover: number;
  windSpeed: number;
  visibility: number;
  goldenHourMinutes: number;
}

/**
 * Extract comparable metrics from a ComparisonLocation.
 * Returns null if essential data (score or weather) is missing.
 */
function extractMetrics(
  loc: ComparisonLocation
): LocationMetrics | null {
  if (!loc.photographyScore || !loc.weather) {
    return null;
  }

  const weather = loc.weather.current;
  let goldenHourMinutes = 0;

  if (loc.sunTimes) {
    const morningMs =
      loc.sunTimes.goldenHourMorningEnd.getTime() -
      loc.sunTimes.goldenHourMorning.getTime();
    const eveningMs =
      loc.sunTimes.goldenHourEveningEnd.getTime() -
      loc.sunTimes.goldenHourEvening.getTime();
    goldenHourMinutes = (morningMs + eveningMs) / 60000;
  }

  return {
    locationId: loc.location.id,
    name: loc.location.name,
    overallScore: loc.photographyScore.overall,
    weatherScore: loc.photographyScore.weatherScore,
    lightingScore: loc.photographyScore.lightingScore,
    visibilityScore: loc.photographyScore.visibilityScore,
    cloudCover: weather.cloudCover,
    windSpeed: weather.windSpeed,
    visibility: weather.visibility,
    goldenHourMinutes,
  };
}

/** Category definitions: label, metric key, and whether higher is better */
interface CategoryDef {
  category: ComparisonCategory;
  label: string;
  getValue: (m: LocationMetrics) => number;
  formatValue: (n: number) => string;
  /** If true, highest value wins. If false, special logic applies. */
  higherIsBetter: boolean;
}

const CATEGORY_DEFS: CategoryDef[] = [
  {
    category: 'overall',
    label: 'Overall Score',
    getValue: (m) => m.overallScore,
    formatValue: (n) => `${Math.round(n)}/100`,
    higherIsBetter: true,
  },
  {
    category: 'weather',
    label: 'Weather Score',
    getValue: (m) => m.weatherScore,
    formatValue: (n) => `${Math.round(n)}/100`,
    higherIsBetter: true,
  },
  {
    category: 'lighting',
    label: 'Lighting Score',
    getValue: (m) => m.lightingScore,
    formatValue: (n) => `${Math.round(n)}/100`,
    higherIsBetter: true,
  },
  {
    category: 'visibility',
    label: 'Visibility',
    getValue: (m) => m.visibility,
    formatValue: (n) => {
      if (n >= 1000) return `${(n / 1000).toFixed(1)} km`;
      return `${Math.round(n)} m`;
    },
    higherIsBetter: true,
  },
  {
    category: 'wind',
    label: 'Wind',
    getValue: (m) => m.windSpeed,
    formatValue: (n) => `${n.toFixed(1)} mph`,
    higherIsBetter: false, // lower wind is better
  },
  {
    category: 'cloudCover',
    label: 'Cloud Cover',
    getValue: (m) => m.cloudCover,
    formatValue: (n) => `${Math.round(n)}%`,
    higherIsBetter: false, // special: closest to 40% wins
  },
  {
    category: 'goldenHourDuration',
    label: 'Golden Hour',
    getValue: (m) => m.goldenHourMinutes,
    formatValue: (n) => `${Math.round(n)} min`,
    higherIsBetter: true,
  },
];

/**
 * Determine the winner for a single category.
 */
function determineCategoryWinner(
  def: CategoryDef,
  metrics: LocationMetrics[]
): CategoryWinner {
  const allValues = metrics.map((m) => ({
    locationId: m.locationId,
    name: m.name,
    value: def.formatValue(def.getValue(m)),
    numericValue: def.getValue(m),
  }));

  let winnerId: string;

  if (def.category === 'cloudCover') {
    // Closest to 40% wins (ideal for dramatic skies)
    const IDEAL_CLOUD = 40;
    let bestDistance = Infinity;
    winnerId = metrics[0].locationId;
    for (const m of metrics) {
      const distance = Math.abs(m.cloudCover - IDEAL_CLOUD);
      if (distance < bestDistance) {
        bestDistance = distance;
        winnerId = m.locationId;
      }
    }
  } else if (def.category === 'wind') {
    // Lowest wind speed wins (calmest)
    let bestVal = Infinity;
    winnerId = metrics[0].locationId;
    for (const m of metrics) {
      const val = def.getValue(m);
      if (val < bestVal) {
        bestVal = val;
        winnerId = m.locationId;
      }
    }
  } else {
    // Highest value wins
    let bestVal = -Infinity;
    winnerId = metrics[0].locationId;
    for (const m of metrics) {
      const val = def.getValue(m);
      if (val > bestVal) {
        bestVal = val;
        winnerId = m.locationId;
      }
    }
  }

  const winner = metrics.find((m) => m.locationId === winnerId)!;

  return {
    category: def.category,
    label: def.label,
    winnerId,
    winnerName: winner.name,
    value: def.formatValue(def.getValue(winner)),
    allValues,
  };
}

/**
 * Compare 2-4 locations and determine category winners + overall winner.
 * Locations with missing weather/score data are excluded from comparison.
 */
export function compareLocations(
  locations: ComparisonLocation[]
): ComparisonResult {
  // Extract metrics, filtering out locations with missing data
  const metrics = locations
    .map(extractMetrics)
    .filter((m): m is LocationMetrics => m !== null);

  if (metrics.length < 2) {
    return {
      overallWinner: null,
      categoryWinners: [],
      recommendation: 'Not enough location data to compare.',
      tradeoffs: [],
    };
  }

  // Determine winner for each category
  const categoryWinners = CATEGORY_DEFS.map((def) =>
    determineCategoryWinner(def, metrics)
  );

  // Count category wins per location (excluding 'overall' category)
  const nonOverallWinners = categoryWinners.filter(
    (w) => w.category !== 'overall'
  );
  const winCounts = new Map<string, number>();
  for (const m of metrics) {
    winCounts.set(m.locationId, 0);
  }
  for (const winner of nonOverallWinners) {
    const current = winCounts.get(winner.winnerId) ?? 0;
    winCounts.set(winner.winnerId, current + 1);
  }

  // Overall winner: most category wins, tiebreak by overall score
  let overallWinnerId = metrics[0].locationId;
  let maxWins = 0;
  let maxScore = -1;

  for (const m of metrics) {
    const wins = winCounts.get(m.locationId) ?? 0;
    if (wins > maxWins || (wins === maxWins && m.overallScore > maxScore)) {
      maxWins = wins;
      maxScore = m.overallScore;
      overallWinnerId = m.locationId;
    }
  }

  const overallWinnerMetrics = metrics.find(
    (m) => m.locationId === overallWinnerId
  )!;

  const overallWinner = {
    id: overallWinnerMetrics.locationId,
    name: overallWinnerMetrics.name,
    score: overallWinnerMetrics.overallScore,
  };

  return {
    overallWinner,
    categoryWinners,
    recommendation: '', // Filled by generateRecommendation
    tradeoffs: [], // Filled by generateRecommendation
  };
}

/**
 * Get the number of non-overall category wins for a given location.
 */
export function getCategoryWinCount(
  result: ComparisonResult,
  locationId: string
): number {
  return result.categoryWinners.filter(
    (w) => w.category !== 'overall' && w.winnerId === locationId
  ).length;
}
