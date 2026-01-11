'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import {
  getPhotographyConditions,
  formatDuration,
} from '@/lib/utils/sun-calculations';
import type { WeatherConditions } from '@/src/types/photography.types';
import { Camera, TrendingUp, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConditionsScoreProps {
  lat: number;
  lng: number;
  weather: WeatherConditions;
  date?: Date;
}

export function ConditionsScore({
  lat,
  lng,
  weather,
  date = new Date(),
}: ConditionsScoreProps) {
  const conditions = getPhotographyConditions(date, lat, lng);
  const score = calculatePhotographyScore(conditions, weather);

  const getRecommendationColor = (
    recommendation: string
  ): { bg: string; text: string; border: string } => {
    switch (recommendation) {
      case 'excellent':
        return {
          bg: 'bg-green-50 dark:bg-green-950/20',
          text: 'text-green-900 dark:text-green-100',
          border: 'border-green-200 dark:border-green-800',
        };
      case 'good':
        return {
          bg: 'bg-blue-50 dark:bg-blue-950/20',
          text: 'text-blue-900 dark:text-blue-100',
          border: 'border-blue-200 dark:border-blue-800',
        };
      case 'fair':
        return {
          bg: 'bg-amber-50 dark:bg-amber-950/20',
          text: 'text-amber-900 dark:text-amber-100',
          border: 'border-amber-200 dark:border-amber-800',
        };
      default:
        return {
          bg: 'bg-gray-50 dark:bg-gray-950/20',
          text: 'text-gray-900 dark:text-gray-100',
          border: 'border-gray-200 dark:border-gray-800',
        };
    }
  };

  const colors = getRecommendationColor(score.recommendation);

  const getScoreIcon = (recommendation: string) => {
    if (recommendation === 'excellent' || recommendation === 'good') {
      return <CheckCircle2 className="h-5 w-5" />;
    }
    return <AlertCircle className="h-5 w-5" />;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Camera className="h-5 w-5" />
          Photography Conditions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Score */}
        <div
          className={cn(
            'rounded-lg border p-4',
            colors.bg,
            colors.border
          )}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getScoreIcon(score.recommendation)}
              <div>
                <div className={cn('text-sm font-semibold uppercase', colors.text)}>
                  {score.recommendation}
                </div>
                <div className="text-xs text-muted-foreground">
                  Overall Score
                </div>
              </div>
            </div>
            <div className={cn('text-3xl font-bold', colors.text)}>
              {score.overall}
            </div>
          </div>
        </div>

        {/* Score Breakdown */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm font-medium">
            <TrendingUp className="h-4 w-4" />
            Score Breakdown
          </div>

          {/* Lighting Score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Lighting</span>
              <span className="font-medium">{score.lightingScore}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full bg-amber-500 transition-all"
                style={{ width: `${score.lightingScore}%` }}
              />
            </div>
          </div>

          {/* Weather Score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Weather</span>
              <span className="font-medium">{score.weatherScore}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full bg-blue-500 transition-all"
                style={{ width: `${score.weatherScore}%` }}
              />
            </div>
          </div>

          {/* Visibility Score */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Visibility</span>
              <span className="font-medium">{score.visibilityScore}/100</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
              <div
                className="h-full bg-green-500 transition-all"
                style={{ width: `${score.visibilityScore}%` }}
              />
            </div>
          </div>
        </div>

        {/* Current Conditions */}
        <div className="space-y-2 rounded-md bg-muted/50 p-3">
          <div className="text-sm font-medium">Current Conditions</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-muted-foreground">Time of Day:</span>{' '}
              <span className="font-medium">
                {conditions.timeOfDay.replace(/_/g, ' ')}
              </span>
            </div>
            <div>
              <span className="text-muted-foreground">Sun Altitude:</span>{' '}
              <span className="font-medium">
                {conditions.sunAltitude.toFixed(1)}°
              </span>
            </div>
          </div>
        </div>

        {/* Next Golden Hour */}
        {conditions.minutesToGoldenHour !== null && (
          <div className="rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
            <div className="text-sm font-medium text-amber-900 dark:text-amber-100">
              Golden Hour in {formatDuration(conditions.minutesToGoldenHour)}
            </div>
          </div>
        )}

        {/* Reasons */}
        {score.reasons.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Insights</div>
            <ul className="space-y-1">
              {score.reasons.map((reason, index) => (
                <li key={index} className="flex items-start gap-2 text-xs">
                  <span className="mt-1 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary" />
                  <span className="text-muted-foreground">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
