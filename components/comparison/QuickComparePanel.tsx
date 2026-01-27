'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, ArrowRight, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLocationStore } from '@/src/stores/locationStore';
import { useComparisonStore } from '@/src/stores/comparisonStore';
import { fetchWeatherForecast } from '@/app/actions/weather';
import { getPhotographyConditions, getSunTimes } from '@/lib/utils/sun-calculations';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import { parseCoordinates } from '@/lib/utils/parse-coordinates';
import { compareLocations } from '@/lib/comparison/compare-locations';
import { generateRecommendation } from '@/lib/comparison/generate-recommendation';
import type { ComparisonLocation, ComparisonResult } from '@/src/types/comparison.types';

function getScoreBadgeColor(recommendation: string): string {
  switch (recommendation) {
    case 'excellent':
      return 'bg-green-500 text-white';
    case 'good':
      return 'bg-blue-500 text-white';
    case 'fair':
      return 'bg-amber-500 text-white';
    default:
      return 'bg-gray-400 text-white';
  }
}

export function QuickComparePanel() {
  const router = useRouter();
  const selectedLocationIds = useComparisonStore((state) => state.selectedLocationIds);
  const isCompareMode = useComparisonStore((state) => state.isCompareMode);
  const exitCompareMode = useComparisonStore((state) => state.exitCompareMode);

  const [comparisonLocations, setComparisonLocations] = useState<ComparisonLocation[]>([]);
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const shouldShow = isCompareMode && selectedLocationIds.length >= 2;

  const loadData = useCallback(async () => {
    if (selectedLocationIds.length < 2) return;

    // Read savedLocations from store at call time to avoid stale closure
    // and prevent infinite re-renders from array reference changes
    const savedLocations = useLocationStore.getState().savedLocations;

    // Resolve locations
    const resolved = selectedLocationIds
      .map((id) => {
        const loc = savedLocations.find((sl) => sl.id === id);
        if (!loc) return null;
        const coords = parseCoordinates(loc.coordinates);
        if (!coords) return null;
        return { location: loc, coordinates: coords };
      })
      .filter(
        (item): item is {
          location: (typeof savedLocations)[number];
          coordinates: { lat: number; lng: number };
        } => item !== null
      );

    if (resolved.length < 2) return;

    setIsLoading(true);

    const now = new Date();

    // Fetch weather in parallel
    const weatherResults = await Promise.allSettled(
      resolved.map(({ coordinates }) =>
        fetchWeatherForecast(coordinates.lat, coordinates.lng)
      )
    );

    const finalLocations: ComparisonLocation[] = resolved.map(
      ({ location, coordinates }, index) => {
        const weatherResult = weatherResults[index];

        let weather = null;
        let error: string | null = null;

        if (weatherResult.status === 'fulfilled') {
          if (weatherResult.value.data) {
            weather = weatherResult.value.data;
          } else {
            error = weatherResult.value.error ?? 'Failed to fetch weather';
          }
        } else {
          error = 'Weather request failed';
        }

        let photographyConditions = null;
        let photographyScore = null;
        let sunTimes = null;

        try {
          photographyConditions = getPhotographyConditions(
            now,
            coordinates.lat,
            coordinates.lng
          );
          sunTimes = getSunTimes(now, coordinates.lat, coordinates.lng);

          if (weather) {
            const photoWeather = adaptWeatherForPhotography(weather.current);
            photographyScore = calculatePhotographyScore(
              photographyConditions,
              photoWeather
            );
          }
        } catch {
          // Sun calculations can fail for extreme latitudes
        }

        return {
          location,
          coordinates,
          weather,
          photographyScore,
          photographyConditions,
          sunTimes,
          isLoading: false,
          error,
        };
      }
    );

    setComparisonLocations(finalLocations);

    const result = compareLocations(finalLocations);
    const { recommendation, tradeoffs } = generateRecommendation(
      finalLocations,
      result
    );
    setComparisonResult({ ...result, recommendation, tradeoffs });
    setIsLoading(false);
  }, [selectedLocationIds]);

  useEffect(() => {
    if (shouldShow) {
      loadData();
    } else {
      setComparisonLocations([]);
      setComparisonResult(null);
    }
  }, [shouldShow, loadData]);

  if (!shouldShow) return null;

  const handleViewFull = () => {
    router.push(`/compare?ids=${selectedLocationIds.join(',')}`);
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 w-[calc(100%-2rem)] max-w-lg">
      <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-muted-foreground">
            Comparing {selectedLocationIds.length} locations
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={exitCompareMode}
            aria-label="Close comparison"
          >
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>

        {/* Loading state */}
        {isLoading && (
          <div className="flex items-center justify-center py-3">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
            <span className="text-xs text-muted-foreground">
              Loading scores...
            </span>
          </div>
        )}

        {/* Location scores */}
        {!isLoading && comparisonLocations.length >= 2 && (
          <div className="space-y-2">
            <div className="flex flex-col gap-1.5">
              {comparisonLocations.map((loc) => {
                const isWinner =
                  comparisonResult?.overallWinner?.id === loc.location.id;
                return (
                  <div
                    key={loc.location.id}
                    className={`flex items-center gap-2 rounded-md px-2 py-1.5 ${
                      isWinner
                        ? 'bg-amber-50 dark:bg-amber-900/20 ring-1 ring-amber-300 dark:ring-amber-700'
                        : 'bg-muted/50'
                    }`}
                  >
                    {isWinner && (
                      <Trophy className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
                    )}
                    <span className="text-sm truncate flex-1 min-w-0">
                      {loc.location.name}
                    </span>
                    {loc.photographyScore ? (
                      <span
                        className={`text-xs font-bold px-1.5 py-0.5 rounded ${getScoreBadgeColor(
                          loc.photographyScore.recommendation
                        )}`}
                      >
                        {Math.round(loc.photographyScore.overall)}
                      </span>
                    ) : loc.error ? (
                      <span className="text-xs text-destructive">Error</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">--</span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Winner summary */}
            {comparisonResult?.overallWinner && (
              <p className="text-xs text-muted-foreground line-clamp-1 px-1">
                {comparisonResult.recommendation}
              </p>
            )}

            {/* Full comparison link */}
            <Button
              size="sm"
              onClick={handleViewFull}
              className="w-full h-7 text-xs"
            >
              View Full Comparison
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
