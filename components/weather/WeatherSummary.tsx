/**
 * WeatherSummary - Compact weather display for sidebar
 * Shows temperature, condition, golden hour, and photography score in 3 lines
 * Clickable to open the floating weather card
 */

'use client';

import { Sunrise, Sunset, Camera, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/src/stores/uiStore';
import { useSettingsStore, formatTemperature } from '@/src/stores/settingsStore';
import { getSunTimes, formatTime, getPhotographyConditions } from '@/lib/utils/sun-calculations';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import type { WeatherConditions } from '@/src/types/weather.types';

interface WeatherSummaryProps {
  weather: WeatherConditions | null;
  isLoading: boolean;
  error: string | null;
  lat: number;
  lng: number;
  date?: Date;
  className?: string;
}

export function WeatherSummary({
  weather,
  isLoading,
  error,
  lat,
  lng,
  date = new Date(),
  className,
}: WeatherSummaryProps) {
  const { temperatureUnit } = useSettingsStore();
  const { toggleFloatingCard, openFloatingCards } = useUIStore();
  const isWeatherCardOpen = openFloatingCards.has('weather');

  // Get sun times and photography score
  const sunTimes = getSunTimes(date, lat, lng);
  const conditions = getPhotographyConditions(date, lat, lng);

  // Calculate photography score if weather is available
  const photographyScore = weather
    ? calculatePhotographyScore(conditions, adaptWeatherForPhotography(weather))
    : null;

  // Determine which golden hour to show (next upcoming one)
  const now = date.getTime();
  const morningGoldenStart = sunTimes.goldenHourMorning.getTime();
  const morningGoldenEnd = sunTimes.goldenHourMorningEnd.getTime();
  const eveningGoldenStart = sunTimes.goldenHourEvening.getTime();
  const eveningGoldenEnd = sunTimes.goldenHourEveningEnd.getTime();

  let goldenHourLabel = '';
  let goldenHourTime = '';
  let GoldenIcon = Sunrise;

  if (now < morningGoldenStart) {
    // Before morning golden hour
    goldenHourLabel = 'Golden';
    goldenHourTime = `${formatTime(sunTimes.goldenHourMorning)} - ${formatTime(sunTimes.goldenHourMorningEnd)}`;
    GoldenIcon = Sunrise;
  } else if (now >= morningGoldenStart && now <= morningGoldenEnd) {
    // During morning golden hour
    goldenHourLabel = 'Golden NOW';
    goldenHourTime = `ends ${formatTime(sunTimes.goldenHourMorningEnd)}`;
    GoldenIcon = Sunrise;
  } else if (now < eveningGoldenStart) {
    // Between golden hours
    goldenHourLabel = 'Golden';
    goldenHourTime = `${formatTime(sunTimes.goldenHourEvening)} - ${formatTime(sunTimes.goldenHourEveningEnd)}`;
    GoldenIcon = Sunset;
  } else if (now >= eveningGoldenStart && now <= eveningGoldenEnd) {
    // During evening golden hour
    goldenHourLabel = 'Golden NOW';
    goldenHourTime = `ends ${formatTime(sunTimes.goldenHourEveningEnd)}`;
    GoldenIcon = Sunset;
  } else {
    // After evening golden hour - show tomorrow's morning
    goldenHourLabel = 'Golden';
    goldenHourTime = `Tomorrow ${formatTime(sunTimes.goldenHourMorning)}`;
    GoldenIcon = Sunrise;
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-600 dark:text-green-400';
    if (score >= 50) return 'text-blue-600 dark:text-blue-400';
    if (score >= 30) return 'text-amber-600 dark:text-amber-400';
    return 'text-gray-600 dark:text-gray-400';
  };

  const handleClick = () => {
    toggleFloatingCard('weather');
  };

  // Loading state
  if (isLoading) {
    return (
      <button
        className={cn(
          'w-full rounded-lg border bg-card p-3 text-left transition-colors',
          'hover:bg-accent cursor-pointer',
          className
        )}
        disabled
      >
        <div className="flex items-center justify-center gap-2 py-2">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Loading weather...</span>
        </div>
      </button>
    );
  }

  // Error state
  if (error) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'w-full rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-left transition-colors',
          'hover:bg-destructive/20 cursor-pointer',
          className
        )}
      >
        <div className="text-sm text-destructive">Weather unavailable</div>
        <div className="text-xs text-muted-foreground mt-1">Click to retry</div>
      </button>
    );
  }

  // No weather data yet
  if (!weather) {
    return (
      <div
        className={cn(
          'w-full rounded-lg border bg-muted/50 p-3',
          className
        )}
      >
        <div className="text-sm text-muted-foreground text-center">
          Select a location to see weather
        </div>
      </div>
    );
  }

  const weatherDescription = WeatherTypeDescription[weather.weatherType] || 'Unknown';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full rounded-lg border bg-card p-3 text-left transition-all',
        'hover:bg-accent hover:shadow-md cursor-pointer',
        isWeatherCardOpen && 'ring-2 ring-primary',
        className
      )}
      aria-label="Open weather details"
      aria-expanded={isWeatherCardOpen}
    >
      {/* Row 1: Temperature + Condition */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg font-semibold">
            {formatTemperature(weather.temperature, temperatureUnit)}
          </span>
          <span className="text-sm text-muted-foreground">
            {weatherDescription}
          </span>
        </div>
        <ChevronRight
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isWeatherCardOpen && 'rotate-90'
          )}
        />
      </div>

      {/* Row 2: Golden Hour */}
      <div className="flex items-center gap-2 mt-2">
        <GoldenIcon className="h-4 w-4 text-amber-500" />
        <span className="text-sm">
          <span className="text-muted-foreground">{goldenHourLabel}:</span>{' '}
          <span className={cn(
            goldenHourLabel.includes('NOW') && 'text-amber-600 dark:text-amber-400 font-medium'
          )}>
            {goldenHourTime}
          </span>
        </span>
      </div>

      {/* Row 3: Photography Score */}
      {photographyScore && (
        <div className="flex items-center gap-2 mt-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm">
            <span className="text-muted-foreground">Score:</span>{' '}
            <span className={cn('font-medium', getScoreColor(photographyScore.overall))}>
              {photographyScore.overall}/100
            </span>
            <span className="text-xs text-muted-foreground ml-1">
              ({photographyScore.recommendation})
            </span>
          </span>
        </div>
      )}
    </button>
  );
}
