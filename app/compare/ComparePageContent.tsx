'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { format, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, Loader2, ArrowLeft, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useLocationStore } from '@/src/stores/locationStore';
import { useComparisonStore } from '@/src/stores/comparisonStore';
import { fetchWeatherForecast } from '@/app/actions/weather';
import { getPhotographyConditions } from '@/lib/utils/sun-calculations';
import { getSunTimes } from '@/lib/utils/sun-calculations';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import { parseCoordinates } from '@/lib/utils/parse-coordinates';
import { compareLocations } from '@/lib/comparison/compare-locations';
import { generateRecommendation } from '@/lib/comparison/generate-recommendation';
import { ComparisonGrid } from '@/components/comparison/ComparisonGrid';
import { ComparisonRecommendation } from '@/components/comparison/ComparisonRecommendation';
import { toast } from 'sonner';
import type { ComparisonLocation, ComparisonResult } from '@/src/types/comparison.types';

export function ComparePageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const savedLocations = useLocationStore((state) => state.savedLocations);
  const removeLocationFromCompare = useComparisonStore(
    (state) => state.removeLocationFromCompare
  );

  const [comparisonDate, setComparisonDate] = useState<Date>(new Date());
  const [comparisonLocations, setComparisonLocations] = useState<
    ComparisonLocation[]
  >([]);
  const [comparisonResult, setComparisonResult] =
    useState<ComparisonResult | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);

  // Read location IDs from URL params
  const locationIds = useMemo(() => {
    const idsParam = searchParams.get('ids');
    if (!idsParam) return [];
    return idsParam.split(',').filter(Boolean);
  }, [searchParams]);

  // Resolve saved locations from IDs
  const resolvedLocations = useMemo(() => {
    return locationIds
      .map((id) => {
        const loc = savedLocations.find((sl) => sl.id === id);
        if (!loc) return null;
        const coords = parseCoordinates(loc.coordinates);
        if (!coords) return null;
        return { location: loc, coordinates: coords };
      })
      .filter(
        (item): item is { location: (typeof savedLocations)[number]; coordinates: { lat: number; lng: number } } =>
          item !== null
      );
  }, [locationIds, savedLocations]);

  // Fetch weather and compute scores for all locations
  const loadComparisonData = useCallback(async () => {
    if (resolvedLocations.length < 2) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    // Initialize comparison locations with loading state
    const initialLocations: ComparisonLocation[] = resolvedLocations.map(
      ({ location, coordinates }) => ({
        location,
        coordinates,
        weather: null,
        photographyScore: null,
        photographyConditions: null,
        sunTimes: null,
        isLoading: true,
        error: null,
      })
    );
    setComparisonLocations(initialLocations);

    // Fetch weather for all locations in parallel
    const weatherResults = await Promise.allSettled(
      resolvedLocations.map(({ coordinates }) =>
        fetchWeatherForecast(coordinates.lat, coordinates.lng)
      )
    );

    // Build final comparison locations with weather + scores
    const finalLocations: ComparisonLocation[] = resolvedLocations.map(
      ({ location, coordinates }, index) => {
        const weatherResult = weatherResults[index];

        // Handle weather fetch result
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

        // Compute photography conditions and score
        let photographyConditions = null;
        let photographyScore = null;
        let sunTimes = null;

        try {
          photographyConditions = getPhotographyConditions(
            comparisonDate,
            coordinates.lat,
            coordinates.lng
          );
          sunTimes = getSunTimes(comparisonDate, coordinates.lat, coordinates.lng);

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

    // Run comparison logic
    const result = compareLocations(finalLocations);
    const { recommendation, tradeoffs } = generateRecommendation(
      finalLocations,
      result
    );
    setComparisonResult({
      ...result,
      recommendation,
      tradeoffs,
    });

    setIsLoading(false);
  }, [resolvedLocations, comparisonDate]);

  // Load data on mount and when date changes
  useEffect(() => {
    loadComparisonData();
  }, [loadComparisonData]);

  const handleRemove = (locationId: string) => {
    removeLocationFromCompare(locationId);
    const remaining = locationIds.filter((id) => id !== locationId);
    if (remaining.length < 2) {
      router.push('/');
      toast.info('Need at least 2 locations to compare');
    } else {
      router.replace(`/compare?ids=${remaining.join(',')}`);
    }
  };

  const handleDateSelect = (date: Date | undefined) => {
    if (date) {
      // Preserve current time on the new date
      const newDate = new Date(date);
      newDate.setHours(comparisonDate.getHours(), comparisonDate.getMinutes());
      setComparisonDate(newDate);
      setCalendarOpen(false);
    }
  };

  const handleResetDate = () => {
    setComparisonDate(new Date());
  };

  const isToday = isSameDay(comparisonDate, new Date());

  // No locations to compare
  if (resolvedLocations.length < 2 && !isLoading) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground mb-4">
          Select at least 2 saved locations to compare.
        </p>
        <Button variant="outline" onClick={() => router.push('/')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Map
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toolbar: Back + Date Picker */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/')}
          className="h-8"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Map
        </Button>

        <div className="flex items-center gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs">
                <CalendarIcon className="h-3.5 w-3.5 mr-1.5" />
                {format(comparisonDate, 'EEE, d MMM yyyy')}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="single"
                selected={comparisonDate}
                onSelect={handleDateSelect}
                initialFocus
              />
            </PopoverContent>
          </Popover>

          {!isToday && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleResetDate}
              className="h-8 text-xs"
            >
              <RotateCcw className="h-3.5 w-3.5 mr-1" />
              Today
            </Button>
          )}
        </div>
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground mr-2" />
          <span className="text-sm text-muted-foreground">
            Loading comparison data...
          </span>
        </div>
      )}

      {/* Comparison Grid */}
      {!isLoading && comparisonLocations.length >= 2 && (
        <>
          <ComparisonGrid
            locations={comparisonLocations}
            result={comparisonResult}
            onRemove={handleRemove}
          />

          {comparisonResult && (
            <ComparisonRecommendation
              result={comparisonResult}
              locations={comparisonLocations}
            />
          )}
        </>
      )}
    </div>
  );
}
