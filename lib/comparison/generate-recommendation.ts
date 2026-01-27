/**
 * Generate natural language recommendations from comparison results.
 * Deterministic, template-based - no AI needed.
 */

import type {
  ComparisonLocation,
  ComparisonResult,
} from '@/src/types/comparison.types';
import { getCategoryWinCount } from './compare-locations';

/** Category labels for readable tradeoff text */
const CATEGORY_LABELS: Record<string, string> = {
  weather: 'weather conditions',
  lighting: 'lighting',
  visibility: 'visibility',
  wind: 'calmer winds',
  cloudCover: 'more dramatic skies',
  goldenHourDuration: 'a longer golden hour',
};

/**
 * Generate a recommendation string and tradeoffs from comparison results.
 */
export function generateRecommendation(
  locations: ComparisonLocation[],
  result: ComparisonResult
): { recommendation: string; tradeoffs: string[] } {
  if (!result.overallWinner || result.categoryWinners.length === 0) {
    return {
      recommendation: 'Not enough data to generate a recommendation.',
      tradeoffs: [],
    };
  }

  const { overallWinner, categoryWinners } = result;
  const totalCategories = categoryWinners.filter(
    (w) => w.category !== 'overall'
  ).length;
  const winnerWins = getCategoryWinCount(result, overallWinner.id);
  const winRatio = totalCategories > 0 ? winnerWins / totalCategories : 0;

  // Determine recommendation strength
  const recommendation = buildRecommendationText(
    overallWinner,
    winRatio,
    winnerWins,
    totalCategories,
    categoryWinners,
    locations
  );

  // Generate tradeoffs: categories where the overall winner did NOT win
  const tradeoffs = buildTradeoffs(
    overallWinner.id,
    categoryWinners
  );

  return { recommendation, tradeoffs };
}

function buildRecommendationText(
  winner: { id: string; name: string; score: number },
  winRatio: number,
  winnerWins: number,
  totalCategories: number,
  categoryWinners: ComparisonResult['categoryWinners'],
  locations: ComparisonLocation[]
): string {
  // Find the winning categories for the winner
  const wonCategories = categoryWinners
    .filter((w) => w.category !== 'overall' && w.winnerId === winner.id)
    .map((w) => w.label.toLowerCase());

  const reasonText =
    wonCategories.length > 0
      ? `, excelling in ${formatList(wonCategories)}`
      : '';

  // Check if all locations have poor scores
  const allPoor = locations.every(
    (loc) =>
      !loc.photographyScore || loc.photographyScore.recommendation === 'poor'
  );

  if (allPoor) {
    return (
      `None of the locations have ideal conditions right now. ` +
      `${winner.name} is the best option with a score of ${Math.round(winner.score)}/100.`
    );
  }

  if (winRatio >= 0.6) {
    // Clear winner
    return (
      `${winner.name} is the clear best choice` +
      reasonText +
      ` (score: ${Math.round(winner.score)}/100).`
    );
  }

  if (winnerWins > 0 && winRatio < 0.6) {
    // Close call - find the runner up
    const runnerUp = findRunnerUp(winner.id, categoryWinners);
    const runnerUpText = runnerUp
      ? ` over ${runnerUp.name}`
      : '';
    return (
      `${winner.name} has a slight edge${runnerUpText}` +
      reasonText +
      ` (score: ${Math.round(winner.score)}/100).`
    );
  }

  // Fallback
  return `${winner.name} has the best overall score at ${Math.round(winner.score)}/100.`;
}

/**
 * Find the runner-up location (second most category wins).
 */
function findRunnerUp(
  winnerId: string,
  categoryWinners: ComparisonResult['categoryWinners']
): { id: string; name: string } | null {
  const nonOverall = categoryWinners.filter(
    (w) => w.category !== 'overall' && w.winnerId !== winnerId
  );
  if (nonOverall.length === 0) return null;

  // Count wins for non-winner locations
  const counts = new Map<string, { count: number; name: string }>();
  for (const w of nonOverall) {
    const existing = counts.get(w.winnerId);
    if (existing) {
      existing.count++;
    } else {
      counts.set(w.winnerId, { count: 1, name: w.winnerName });
    }
  }

  let best: { id: string; name: string } | null = null;
  let bestCount = 0;
  counts.forEach(({ count, name }, id) => {
    if (count > bestCount) {
      bestCount = count;
      best = { id, name };
    }
  });

  return best;
}

/**
 * Build tradeoff strings for categories where the overall winner lost.
 * Limited to 3 most significant tradeoffs.
 */
function buildTradeoffs(
  winnerId: string,
  categoryWinners: ComparisonResult['categoryWinners']
): string[] {
  const lostCategories = categoryWinners.filter(
    (w) => w.category !== 'overall' && w.winnerId !== winnerId
  );

  if (lostCategories.length === 0) return [];

  // Sort by significance: how much better the other location is (percentage difference)
  const tradeoffsWithSignificance = lostCategories.map((w) => {
    const winnerEntry = w.allValues.find((v) => v.locationId === winnerId);
    const categoryWinnerEntry = w.allValues.find(
      (v) => v.locationId === w.winnerId
    );

    const label = CATEGORY_LABELS[w.category] ?? w.label.toLowerCase();

    if (!winnerEntry || !categoryWinnerEntry) {
      return {
        text: `${w.winnerName} has better ${label}.`,
        significance: 0,
      };
    }

    return {
      text: `${w.winnerName} has better ${label} (${categoryWinnerEntry.value} vs ${winnerEntry.value}).`,
      significance: Math.abs(
        categoryWinnerEntry.numericValue - winnerEntry.numericValue
      ),
    };
  });

  // Sort by significance descending, take top 3
  tradeoffsWithSignificance.sort((a, b) => b.significance - a.significance);

  return tradeoffsWithSignificance.slice(0, 3).map((t) => t.text);
}

/**
 * Format a list of strings as "a, b, and c".
 */
function formatList(items: string[]): string {
  if (items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`;
}
