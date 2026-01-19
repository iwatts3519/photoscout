/**
 * MobileWeatherBar - Compact weather bar for mobile view
 * Shows temperature, condition, and golden hour in a single line
 * Tappable to open the floating weather card
 */

'use client';

import { Sunrise, Sunset, Loader2, Cloud, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/src/stores/uiStore';
import { useSettingsStore, formatTemperature } from '@/src/stores/settingsStore';
import { getSunTimes, formatTime, getPhotographyConditions } from '@/lib/utils/sun-calculations';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import type { WeatherConditions } from '@/src/types/weather.types';

interface MobileWeatherBarProps {
  weather: WeatherConditions | null;
  isLoading: boolean;
  error: string | null;
  lat: number;
  lng: number;
  date?: Date;
  className?: string;
}

export function MobileWeatherBar({
  weather,
  isLoading,
  error,
  lat,
  lng,
  date = new Date(),
  className,
}: MobileWeatherBarProps) {
  const { temperatureUnit } = useSettingsStore();
  const { openBottomSheet, bottomSheetContent } = useUIStore();
  const isForecastSheetOpen = bottomSheetContent === 'forecast';

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

  let goldenHourTime = '';
  let GoldenIcon = Sunrise;
  let isGoldenNow = false;

  if (now < morningGoldenStart) {
    goldenHourTime = formatTime(sunTimes.goldenHourMorning);
    GoldenIcon = Sunrise;
  } else if (now >= morningGoldenStart && now <= morningGoldenEnd) {
    goldenHourTime = 'NOW';
    GoldenIcon = Sunrise;
    isGoldenNow = true;
  } else if (now < eveningGoldenStart) {
    goldenHourTime = formatTime(sunTimes.goldenHourEvening);
    GoldenIcon = Sunset;
  } else if (now >= eveningGoldenStart && now <= eveningGoldenEnd) {
    goldenHourTime = 'NOW';
    GoldenIcon = Sunset;
    isGoldenNow = true;
  } else {
    goldenHourTime = formatTime(sunTimes.goldenHourMorning);
    GoldenIcon = Sunrise;
  }

  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-green-500';
    if (score >= 50) return 'text-blue-500';
    if (score >= 30) return 'text-amber-500';
    return 'text-gray-500';
  };

  const handleClick = () => {
    openBottomSheet('forecast');
  };

  // Loading state
  if (isLoading) {
    return (
      <div
        className={cn(
          'flex items-center justify-center gap-2 px-3 py-2',
          'bg-background/95 backdrop-blur-sm border-b',
          className
        )}
      >
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        <span className="text-xs text-muted-foreground">Loading...</span>
      </div>
    );
  }

  // Error state
  if (error || !weather) {
    return (
      <button
        onClick={handleClick}
        className={cn(
          'w-full flex items-center justify-center gap-2 px-3 py-2',
          'bg-background/95 backdrop-blur-sm border-b',
          'hover:bg-accent transition-colors',
          className
        )}
      >
        <Cloud className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {error ? 'Weather unavailable' : 'Tap for weather'}
        </span>
      </button>
    );
  }

  const weatherDescription = WeatherTypeDescription[weather.weatherType] || 'Unknown';

  return (
    <button
      onClick={handleClick}
      className={cn(
        'w-full flex items-center justify-between px-3 py-2',
        'bg-background/95 backdrop-blur-sm border-b',
        'hover:bg-accent transition-colors active:bg-accent/80',
        isForecastSheetOpen && 'bg-accent',
        className
      )}
      aria-label="Open weather details"
      aria-expanded={isForecastSheetOpen}
    >
      {/* Left: Temperature + Condition */}
      <div className="flex items-center gap-2">
        <span className="font-semibold text-sm">
          {formatTemperature(weather.temperature, temperatureUnit)}
        </span>
        <span className="text-xs text-muted-foreground truncate max-w-[80px]">
          {weatherDescription}
        </span>
      </div>

      {/* Center: Golden Hour */}
      <div className="flex items-center gap-1">
        <GoldenIcon className={cn(
          'h-3.5 w-3.5',
          isGoldenNow ? 'text-amber-500' : 'text-amber-400'
        )} />
        <span className={cn(
          'text-xs',
          isGoldenNow ? 'text-amber-500 font-semibold' : 'text-muted-foreground'
        )}>
          {goldenHourTime}
        </span>
      </div>

      {/* Right: Score + Chevron */}
      <div className="flex items-center gap-2">
        {photographyScore && (
          <span className={cn('text-xs font-medium', getScoreColor(photographyScore.overall))}>
            {photographyScore.overall}%
          </span>
        )}
        <ChevronDown
          className={cn(
            'h-4 w-4 text-muted-foreground transition-transform',
            isForecastSheetOpen && 'rotate-180'
          )}
        />
      </div>
    </button>
  );
}
