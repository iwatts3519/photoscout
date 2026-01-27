/**
 * Types for the location comparison feature
 */

import type { SavedLocation } from '@/src/stores/locationStore';
import type { WeatherForecast } from '@/src/types/weather.types';
import type {
  PhotographyScore,
  PhotographyConditions,
  SunTimes,
} from '@/src/types/photography.types';

/** A location enriched with weather and scoring data for comparison */
export interface ComparisonLocation {
  location: SavedLocation;
  coordinates: { lat: number; lng: number };
  weather: WeatherForecast | null;
  photographyScore: PhotographyScore | null;
  photographyConditions: PhotographyConditions | null;
  sunTimes: SunTimes | null;
  isLoading: boolean;
  error: string | null;
}

/** Categories that can be compared across locations */
export type ComparisonCategory =
  | 'overall'
  | 'weather'
  | 'lighting'
  | 'visibility'
  | 'wind'
  | 'cloudCover'
  | 'goldenHourDuration';

/** Winner for a specific comparison category */
export interface CategoryWinner {
  category: ComparisonCategory;
  label: string;
  winnerId: string;
  winnerName: string;
  value: string;
  allValues: {
    locationId: string;
    name: string;
    value: string;
    numericValue: number;
  }[];
}

/** Full comparison result across all locations */
export interface ComparisonResult {
  overallWinner: { id: string; name: string; score: number } | null;
  categoryWinners: CategoryWinner[];
  recommendation: string;
  tradeoffs: string[];
}
