'use client';

import { useState } from 'react';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import {
  Cloud,
  Sun,
  Sunrise,
  Sunset,
  Droplets,
  Wind,
  Star,
  ChevronDown,
  ChevronUp,
  Camera,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { DayPhotographyScore, AnalyzedForecast } from '@/lib/utils/forecast-analyzer';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import {
  useSettingsStore,
  formatTemperature,
  formatSpeed,
} from '@/src/stores/settingsStore';

interface WeatherForecastCardProps {
  forecast: AnalyzedForecast;
  onSelectDate?: (date: Date) => void;
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
      return 'text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30';
    case 'good':
      return 'text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30';
    case 'fair':
      return 'text-yellow-600 dark:text-yellow-400 bg-yellow-100 dark:bg-yellow-900/30';
    case 'poor':
      return 'text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30';
  }
}

/**
 * Get weather icon based on weather type
 */
function WeatherIcon({ weatherType, className }: { weatherType: number; className?: string }) {
  // Simple mapping - could be expanded
  if (weatherType <= 3) {
    return <Sun className={className} />;
  }
  return <Cloud className={className} />;
}

/**
 * Single day forecast row
 */
function DayForecastRow({
  day,
  isBestDay,
  isExpanded,
  onToggle,
  onSelect,
}: {
  day: DayPhotographyScore;
  isBestDay: boolean;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: () => void;
}) {
  const { temperatureUnit, speedUnit } = useSettingsStore();
  const dateLabel = getDateLabel(day.date);
  const weatherDesc = WeatherTypeDescription[day.forecast.weatherType] || 'Unknown';

  // Convert wind from mph to km/h for formatting
  const windSpeedKmh = day.forecast.windSpeedMax * 1.60934;

  return (
    <div className="border-b last:border-b-0 border-border">
      {/* Main row */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Best day indicator */}
          {isBestDay && (
            <Star className="h-4 w-4 text-yellow-500 flex-shrink-0" />
          )}

          {/* Date */}
          <div className="min-w-[60px]">
            <p className="text-sm font-medium">{dateLabel}</p>
            <p className="text-xs text-muted-foreground">
              {format(parseISO(day.date), 'd MMM')}
            </p>
          </div>

          {/* Weather icon & temp */}
          <div className="flex items-center gap-2">
            <WeatherIcon
              weatherType={day.forecast.weatherType}
              className="h-5 w-5 text-muted-foreground"
            />
            <div className="text-sm">
              <span className="font-medium">
                {formatTemperature(day.forecast.temperatureMax, temperatureUnit)}
              </span>
              <span className="text-muted-foreground mx-1">/</span>
              <span className="text-muted-foreground">
                {formatTemperature(day.forecast.temperatureMin, temperatureUnit)}
              </span>
            </div>
          </div>
        </div>

        {/* Score badge & expand button */}
        <div className="flex items-center gap-2">
          <span
            className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              getScoreColor(day.recommendation)
            )}
          >
            {day.overallScore}%
          </span>
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3 bg-muted/30">
          {/* Weather description */}
          <p className="text-sm text-muted-foreground">{weatherDesc}</p>

          {/* Key metrics */}
          <div className="grid grid-cols-2 gap-2 text-sm">
            {/* Cloud cover */}
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <span>{day.forecast.cloudCoverAvg}% cloud</span>
            </div>

            {/* Rain chance */}
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span>{day.forecast.precipitationProbabilityMax}% rain</span>
            </div>

            {/* Wind */}
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span>{formatSpeed(windSpeedKmh, speedUnit)}</span>
            </div>

            {/* Golden hour evening */}
            <div className="flex items-center gap-2">
              <Sunset className="h-4 w-4 text-muted-foreground" />
              <span>Golden {day.goldenHourEvening}</span>
            </div>
          </div>

          {/* Sun times */}
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Sunrise className="h-3 w-3" />
              <span>{format(parseISO(day.forecast.sunrise), 'HH:mm')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Sunset className="h-3 w-3" />
              <span>{format(parseISO(day.forecast.sunset), 'HH:mm')}</span>
            </div>
          </div>

          {/* Reasons */}
          {day.reasons.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {day.reasons.slice(0, 3).map((reason, i) => (
                <span
                  key={i}
                  className="text-xs bg-muted px-2 py-0.5 rounded-full"
                >
                  {reason}
                </span>
              ))}
            </div>
          )}

          {/* Plan for this day button */}
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={(e) => {
              e.stopPropagation();
              onSelect();
            }}
          >
            <Camera className="h-4 w-4 mr-2" />
            Plan for {dateLabel}
          </Button>
        </div>
      )}
    </div>
  );
}

/**
 * Weather forecast card showing 7-day forecast with photography scores
 */
export function WeatherForecastCard({
  forecast,
  onSelectDate,
  className,
}: WeatherForecastCardProps) {
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  const bestDayDate = forecast.bestDay?.date;

  const handleToggle = (date: string) => {
    setExpandedDay(expandedDay === date ? null : date);
  };

  const handleSelectDate = (dateString: string) => {
    if (onSelectDate) {
      const date = parseISO(dateString);
      // Set time to noon for the selected day
      date.setHours(12, 0, 0, 0);
      onSelectDate(date);
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>7-Day Forecast</span>
          {forecast.bestDay && (
            <span className="text-xs font-normal text-muted-foreground flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500" />
              Best: {getDateLabel(forecast.bestDay.date)}
            </span>
          )}
        </CardTitle>
        <CardDescription>
          Photography conditions for the week ahead
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {forecast.days.map((day) => (
            <DayForecastRow
              key={day.date}
              day={day}
              isBestDay={day.date === bestDayDate}
              isExpanded={expandedDay === day.date}
              onToggle={() => handleToggle(day.date)}
              onSelect={() => handleSelectDate(day.date)}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
