'use client';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Navigation,
  X,
  Star,
  Cloud,
  Eye,
  Wind,
  Sun,
  Thermometer,
} from 'lucide-react';
import { useMapStore } from '@/src/stores/mapStore';
import { useRouter } from 'next/navigation';
import { useSettingsStore } from '@/src/stores/settingsStore';
import {
  formatTemperature,
  formatVisibility,
} from '@/src/stores/settingsStore';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import { toast } from 'sonner';
import type { ComparisonLocation, CategoryWinner } from '@/src/types/comparison.types';

function getScoreColor(recommendation: string): string {
  switch (recommendation) {
    case 'excellent':
      return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/30';
    case 'good':
      return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30';
    case 'fair':
      return 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30';
    default:
      return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/30';
  }
}

function getCompassDirection(degrees: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round(degrees / 45) % 8;
  return directions[index];
}

function formatTime(date: Date): string {
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function isWinner(
  category: string,
  locationId: string,
  categoryWinners: CategoryWinner[]
): boolean {
  const winner = categoryWinners.find((w) => w.category === category);
  return winner?.winnerId === locationId;
}

interface LocationComparisonCardProps {
  comparison: ComparisonLocation;
  categoryWinners: CategoryWinner[];
  isOverallWinner: boolean;
  onRemove: () => void;
}

export function LocationComparisonCard({
  comparison,
  categoryWinners,
  isOverallWinner,
  onRemove,
}: LocationComparisonCardProps) {
  const router = useRouter();
  const setCenter = useMapStore((state) => state.setCenter);
  const setSelectedLocation = useMapStore((state) => state.setSelectedLocation);
  const setZoom = useMapStore((state) => state.setZoom);
  const temperatureUnit = useSettingsStore((state) => state.temperatureUnit);
  const distanceUnit = useSettingsStore((state) => state.distanceUnit);

  const { location, coordinates, weather, photographyScore, sunTimes } =
    comparison;
  const locationId = location.id;

  const handleViewOnMap = () => {
    setCenter(coordinates);
    setSelectedLocation(coordinates);
    setZoom(14);
    router.push('/');
    toast.success('Location centered on map');
  };

  const winnerRow = (category: string) =>
    isWinner(category, locationId, categoryWinners)
      ? 'bg-amber-50 dark:bg-amber-900/10'
      : '';

  const winnerIcon = (category: string) =>
    isWinner(category, locationId, categoryWinners) ? (
      <Star className="h-3 w-3 text-amber-500 fill-amber-500 flex-shrink-0" />
    ) : null;

  return (
    <Card
      className={`p-4 space-y-3 ${isOverallWinner ? 'ring-2 ring-amber-400' : ''}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="font-semibold truncate">{location.name}</h3>
            {isOverallWinner && (
              <Star className="h-4 w-4 text-amber-500 fill-amber-500 flex-shrink-0" />
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            {coordinates.lat.toFixed(4)}, {coordinates.lng.toFixed(4)}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 w-7 p-0 flex-shrink-0"
          onClick={onRemove}
          aria-label={`Remove ${location.name}`}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Photography Score */}
      {photographyScore && (
        <div className={`rounded-md p-3 ${winnerRow('overall')}`}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Score</span>
            {winnerIcon('overall')}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-2xl font-bold">
              {Math.round(photographyScore.overall)}
            </span>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full capitalize ${getScoreColor(photographyScore.recommendation)}`}
            >
              {photographyScore.recommendation}
            </span>
          </div>
          {/* Score breakdown */}
          <div className="mt-2 space-y-1">
            {[
              { label: 'Lighting', value: photographyScore.lightingScore, cat: 'lighting' },
              { label: 'Weather', value: photographyScore.weatherScore, cat: 'weather' },
              { label: 'Visibility', value: photographyScore.visibilityScore, cat: 'visibility' },
            ].map(({ label, value, cat }) => (
              <div key={cat} className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground w-16">
                  {label}
                </span>
                <div className="flex-1 bg-secondary rounded-full h-1.5">
                  <div
                    className="bg-primary rounded-full h-1.5 transition-all"
                    style={{ width: `${value}%` }}
                  />
                </div>
                <span className="text-xs w-6 text-right">{Math.round(value)}</span>
                {winnerIcon(cat)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Weather */}
      {weather && (
        <div className={`rounded-md p-3 space-y-2 ${winnerRow('weather')}`}>
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Weather</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold">
              {formatTemperature(weather.current.temperature, temperatureUnit)}
            </span>
            <span className="text-xs text-muted-foreground">
              {WeatherTypeDescription[weather.current.weatherType] ??
                'Unknown'}
            </span>
          </div>
        </div>
      )}

      {/* Cloud Cover */}
      {weather && (
        <div className={`rounded-md p-3 ${winnerRow('cloudCover')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Cloud Cover</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {Math.round(weather.current.cloudCover)}%
              </span>
              {winnerIcon('cloudCover')}
            </div>
          </div>
        </div>
      )}

      {/* Visibility */}
      {weather && (
        <div className={`rounded-md p-3 ${winnerRow('visibility')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Visibility</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {formatVisibility(weather.current.visibility, distanceUnit)}
              </span>
              {winnerIcon('visibility')}
            </div>
          </div>
        </div>
      )}

      {/* Golden Hour */}
      {sunTimes && (
        <div className={`rounded-md p-3 ${winnerRow('goldenHourDuration')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sun className="h-4 w-4 text-amber-500" />
              <span className="text-sm">Golden Hour</span>
            </div>
            {winnerIcon('goldenHourDuration')}
          </div>
          <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
            <p>
              AM: {formatTime(sunTimes.goldenHourMorning)} -{' '}
              {formatTime(sunTimes.goldenHourMorningEnd)}
            </p>
            <p>
              PM: {formatTime(sunTimes.goldenHourEvening)} -{' '}
              {formatTime(sunTimes.goldenHourEveningEnd)}
            </p>
          </div>
        </div>
      )}

      {/* Wind */}
      {weather && (
        <div className={`rounded-md p-3 ${winnerRow('wind')}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Wind className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">Wind</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium">
                {Math.round(weather.current.windSpeed)} mph{' '}
                {getCompassDirection(weather.current.windDirection)}
              </span>
              {winnerIcon('wind')}
            </div>
          </div>
        </div>
      )}

      {/* Loading / Error states */}
      {comparison.isLoading && (
        <p className="text-xs text-muted-foreground text-center py-2">
          Loading weather data...
        </p>
      )}
      {comparison.error && (
        <p className="text-xs text-destructive text-center py-2">
          {comparison.error}
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-2 pt-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleViewOnMap}
          className="h-7 text-xs flex-1"
        >
          <Navigation className="h-3 w-3 mr-1" />
          View on Map
        </Button>
      </div>
    </Card>
  );
}
