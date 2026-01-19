/**
 * ForecastBottomSheet Component
 * Displays 7-day weather forecast with photography scores in an expandable bottom sheet
 */

'use client';

import { useState, useEffect } from 'react';
import { format, parseISO, isToday, isTomorrow } from 'date-fns';
import {
  Cloud,
  Sun,
  CloudRain,
  CloudSnow,
  CloudFog,
  Loader2,
  Star,
  Sunrise,
  Sunset,
  Wind,
  Droplets,
  Camera,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { BottomSheet, type BottomSheetState } from '@/components/layout/BottomSheet';
import { Button } from '@/components/ui/button';
import { useUIStore } from '@/src/stores/uiStore';
import { useMapStore } from '@/src/stores/mapStore';
import { fetchMultiDayForecast } from '@/app/actions/weather';
import {
  analyzeForecast,
  type AnalyzedForecast,
  type DayPhotographyScore,
} from '@/lib/utils/forecast-analyzer';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import {
  useSettingsStore,
  formatTemperature,
  formatSpeed,
} from '@/src/stores/settingsStore';
import { cn } from '@/lib/utils';

interface ForecastBottomSheetProps {
  className?: string;
}

/**
 * Get display label for a date (Today, Tomorrow, or day name)
 */
function getDateLabel(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'EEE');
}

/**
 * Get score color based on recommendation
 */
function getScoreColor(recommendation: DayPhotographyScore['recommendation']): string {
  switch (recommendation) {
    case 'excellent':
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 border-green-200 dark:border-green-800';
    case 'good':
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800';
    case 'fair':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30 border-yellow-200 dark:border-yellow-800';
    case 'poor':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30 border-red-200 dark:border-red-800';
  }
}

/**
 * Get weather icon based on weather type
 */
function WeatherIcon({ weatherType, className }: { weatherType: number; className?: string }) {
  // Map weather codes to icons
  if (weatherType <= 3) return <Sun className={className} />;
  if (weatherType >= 51 && weatherType <= 67) return <CloudRain className={className} />;
  if (weatherType >= 71 && weatherType <= 77) return <CloudSnow className={className} />;
  if (weatherType >= 45 && weatherType <= 48) return <CloudFog className={className} />;
  return <Cloud className={className} />;
}

/**
 * Day Forecast Card Component
 */
function DayCard({
  day,
  isBestDay,
  isExpanded,
  onToggle,
  onSelectDate,
}: {
  day: DayPhotographyScore;
  isBestDay: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelectDate: () => void;
}) {
  const { temperatureUnit, speedUnit } = useSettingsStore();
  const dateLabel = getDateLabel(day.date);
  const weatherDesc = WeatherTypeDescription[day.forecast.weatherType] || 'Unknown';

  // Convert wind from mph to km/h for formatting
  const windSpeedKmh = day.forecast.windSpeedMax * 1.60934;

  return (
    <div
      className={cn(
        'rounded-lg border bg-card overflow-hidden transition-all',
        isBestDay && 'ring-2 ring-yellow-400 dark:ring-yellow-600'
      )}
    >
      {/* Main row - clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          {/* Best day badge */}
          {isBestDay && (
            <div className="absolute -top-1 -left-1">
              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            </div>
          )}

          {/* Weather icon */}
          <div className="relative">
            <WeatherIcon
              weatherType={day.forecast.weatherType}
              className="h-10 w-10 text-muted-foreground"
            />
          </div>

          {/* Date and temps */}
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">{dateLabel}</p>
              {isBestDay && (
                <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                  Best Day
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              {format(parseISO(day.date), 'd MMM')}
            </p>
            <div className="flex items-center gap-2 text-sm mt-1">
              <span className="font-medium">
                {formatTemperature(day.forecast.temperatureMax, temperatureUnit)}
              </span>
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground">
                {formatTemperature(day.forecast.temperatureMin, temperatureUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* Score and expand */}
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'px-3 py-1.5 rounded-full border font-semibold text-sm',
              getScoreColor(day.recommendation)
            )}
          >
            {day.overallScore}%
          </div>
          {isExpanded ? (
            <ChevronUp className="h-5 w-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-5 w-5 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t bg-muted/30">
          {/* Weather description */}
          <p className="text-sm pt-3">{weatherDesc}</p>

          {/* Conditions grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center gap-2 text-sm">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <span>{day.forecast.cloudCoverAvg}% cloud</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span>{day.forecast.precipitationProbabilityMax}% rain</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span>{formatSpeed(windSpeedKmh, speedUnit)}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Camera className="h-4 w-4 text-muted-foreground" />
              <span className="capitalize">{day.recommendation}</span>
            </div>
          </div>

          {/* Sun times */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <Sunrise className="h-4 w-4 text-amber-500" />
              <span>{format(parseISO(day.forecast.sunrise), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-orange-500" />
              <span>{format(parseISO(day.forecast.sunset), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <span>Golden: {day.goldenHourEvening}</span>
            </div>
          </div>

          {/* Reasons */}
          {day.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {day.reasons.map((reason, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted px-2 py-1 rounded-full"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Plan button */}
          <Button
            variant="outline"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelectDate();
            }}
          >
            <Calendar className="h-4 w-4 mr-2" />
            Plan for {dateLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

export function ForecastBottomSheet({ className }: ForecastBottomSheetProps) {
  const {
    bottomSheetContent,
    bottomSheetExpanded,
    closeBottomSheet,
    setBottomSheetExpanded,
  } = useUIStore();

  const { selectedLocation, setSelectedDateTime } = useMapStore();

  const isOpen = bottomSheetContent === 'forecast';

  // Forecast state
  const [forecast, setForecast] = useState<AnalyzedForecast | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasFetched, setHasFetched] = useState(false);

  // Expanded day state
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  // Fetch forecast when sheet opens
  useEffect(() => {
    if (!isOpen || !selectedLocation) {
      return;
    }

    // Only fetch if we haven't fetched yet for this location
    if (hasFetched) return;

    setLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const result = await fetchMultiDayForecast(
          selectedLocation.lat,
          selectedLocation.lng
        );

        if (result.error) {
          setError(result.error);
          setForecast(null);
        } else if (result.data) {
          setForecast(analyzeForecast(result.data));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load forecast');
        setForecast(null);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchData();
  }, [isOpen, selectedLocation, hasFetched]);

  // Reset fetch state when location changes
  useEffect(() => {
    setHasFetched(false);
    setForecast(null);
    setExpandedDay(null);
  }, [selectedLocation]);

  const handleStateChange = (state: BottomSheetState) => {
    setBottomSheetExpanded(state === 'expanded');
  };

  const handleToggleDay = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  const handleSelectDate = (dateString: string) => {
    const date = parseISO(dateString);
    // Set time to noon for the selected day
    date.setHours(12, 0, 0, 0);
    setSelectedDateTime(date);
    closeBottomSheet();
  };

  const bestDayDate = forecast?.bestDay?.date;

  return (
    <BottomSheet
      open={isOpen}
      onClose={closeBottomSheet}
      state={bottomSheetExpanded ? 'expanded' : 'peek'}
      onStateChange={handleStateChange}
      title="7-Day Forecast"
      subtitle={
        loading
          ? 'Loading forecast...'
          : error
          ? 'Failed to load forecast'
          : forecast?.bestDay
          ? `Best day: ${getDateLabel(forecast.bestDay.date)} (${forecast.bestDay.overallScore}%)`
          : 'Photography conditions for the week'
      }
      peekHeight={350}
      className={className}
    >
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cloud className="h-12 w-12 text-destructive/50 mb-4" />
            <p className="font-medium text-destructive">Failed to load forecast</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        ) : forecast && forecast.days.length > 0 ? (
          <>
            {/* Day cards */}
            {forecast.days.map((day) => (
              <DayCard
                key={day.date}
                day={day}
                isBestDay={day.date === bestDayDate}
                isExpanded={expandedDay === day.date}
                onToggle={() => handleToggleDay(day.date)}
                onSelectDate={() => handleSelectDate(day.date)}
              />
            ))}

            {/* Attribution */}
            <p className="text-xs text-muted-foreground text-center pt-2">
              Weather data from{' '}
              <a
                href="https://open-meteo.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-foreground"
              >
                Open-Meteo
              </a>
            </p>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Cloud className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <p className="font-medium text-muted-foreground">No forecast available</p>
          </div>
        )}
      </div>
    </BottomSheet>
  );
}
