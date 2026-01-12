/**
 * Weather card component displaying current weather conditions
 */

'use client';

import { Cloud, Wind, Eye, Droplets, Compass, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { WeatherConditions } from '@/src/types/weather.types';
import { WeatherTypeDescription } from '@/src/types/weather.types';

interface WeatherCardProps {
  weather: WeatherConditions;
  className?: string;
}

/**
 * Format visibility in human-readable units
 */
function formatVisibility(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${meters} m`;
}

/**
 * Get compass direction from degrees
 */
function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degrees / 22.5) % 16;
  return directions[index];
}

/**
 * Get cloud cover description
 */
function getCloudCoverDescription(percentage: number): string {
  if (percentage < 20) return 'Clear';
  if (percentage < 40) return 'Mostly Clear';
  if (percentage < 60) return 'Partly Cloudy';
  if (percentage < 80) return 'Mostly Cloudy';
  return 'Overcast';
}

/**
 * Get visibility quality
 */
function getVisibilityQuality(meters: number): string {
  if (meters >= 20000) return 'Excellent';
  if (meters >= 10000) return 'Very Good';
  if (meters >= 4000) return 'Good';
  if (meters >= 1000) return 'Moderate';
  return 'Poor';
}

export function WeatherCard({ weather, className }: WeatherCardProps) {
  const weatherDescription = WeatherTypeDescription[weather.weatherType] || 'Unknown';
  const cloudCoverDesc = getCloudCoverDescription(weather.cloudCover);
  const visibilityQuality = getVisibilityQuality(weather.visibility);
  const windDirection = getCompassDirection(weather.windDirection);

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Weather Conditions</span>
          <span className="text-sm font-normal text-muted-foreground">
            {weatherDescription}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Temperature */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Temperature</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{Math.round(weather.temperature)}°C</p>
            <p className="text-xs text-muted-foreground">
              Feels like {Math.round(weather.feelsLike)}°C
            </p>
          </div>
        </div>

        {/* Cloud Cover */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Cloud className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Cloud Cover</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{weather.cloudCover}%</p>
            <p className="text-xs text-muted-foreground">{cloudCoverDesc}</p>
          </div>
        </div>

        {/* Visibility */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Visibility</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{formatVisibility(weather.visibility)}</p>
            <p className="text-xs text-muted-foreground">{visibilityQuality}</p>
          </div>
        </div>

        {/* Wind */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Wind</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">
              {Math.round(weather.windSpeed)} mph {windDirection}
            </p>
            <p className="text-xs text-muted-foreground">
              Gusts to {Math.round(weather.windGust)} mph
            </p>
          </div>
        </div>

        {/* Precipitation */}
        {weather.precipitation > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Precipitation</span>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">{weather.precipitation}%</p>
            </div>
          </div>
        )}

        {/* Humidity */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Humidity</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{weather.humidity}%</p>
          </div>
        </div>

        {/* Wind Direction Compass */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Wind Direction</span>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium">{weather.windDirection}°</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
