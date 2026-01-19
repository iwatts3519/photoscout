/**
 * FloatingWeatherCard - Detailed weather card that floats over the map
 * Opens when clicking the weather summary in the sidebar
 * Has tabs for current weather and 7-day forecast
 */

'use client';

import { useEffect, useRef, useState } from 'react';
import {
  X,
  Sunrise,
  Sunset,
  Cloud,
  Wind,
  Eye,
  Droplets,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Expand,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/src/stores/uiStore';
import { useMapStore } from '@/src/stores/mapStore';
import {
  useSettingsStore,
  formatTemperature,
  formatSpeed,
  formatVisibility,
} from '@/src/stores/settingsStore';
import { getSunTimes, formatTime, getPhotographyConditions, formatDuration } from '@/lib/utils/sun-calculations';
import { calculatePhotographyScore } from '@/lib/utils/photo-score';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { fetchCurrentWeather, fetchMultiDayForecast } from '@/app/actions/weather';
import { analyzeForecast, type AnalyzedForecast } from '@/lib/utils/forecast-analyzer';
import { WeatherForecastCard } from '@/components/weather/WeatherForecastCard';
import { WeatherTypeDescription } from '@/src/types/weather.types';
import type { WeatherConditions } from '@/src/types/weather.types';

interface FloatingWeatherCardProps {
  className?: string;
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

export function FloatingWeatherCard({ className }: FloatingWeatherCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const { openFloatingCards, closeFloatingCard, openBottomSheet } = useUIStore();
  const { selectedLocation, selectedDateTime, setSelectedDateTime } = useMapStore();
  const { temperatureUnit, speedUnit, distanceUnit } = useSettingsStore();

  const isOpen = openFloatingCards.has('weather');
  const [activeTab, setActiveTab] = useState<'current' | 'forecast'>('current');

  // Weather state
  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Forecast state
  const [forecast, setForecast] = useState<AnalyzedForecast | null>(null);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [hasFetchedForecast, setHasFetchedForecast] = useState(false);

  const date = selectedDateTime || new Date();

  // Fetch current weather when card opens
  useEffect(() => {
    if (!isOpen || !selectedLocation) return;

    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);

      const result = await fetchCurrentWeather(selectedLocation.lat, selectedLocation.lng);

      if (result.error) {
        setWeatherError(result.error);
        setWeather(null);
      } else {
        setWeather(result.data);
      }

      setIsLoadingWeather(false);
    };

    fetchWeather();
  }, [isOpen, selectedLocation]);

  // Fetch forecast when forecast tab is opened (lazy load)
  useEffect(() => {
    if (!isOpen || !selectedLocation || activeTab !== 'forecast' || hasFetchedForecast) return;

    const fetchForecastData = async () => {
      setIsLoadingForecast(true);
      setForecastError(null);

      const result = await fetchMultiDayForecast(selectedLocation.lat, selectedLocation.lng);

      if (result.error) {
        setForecastError(result.error);
        setForecast(null);
      } else if (result.data) {
        setForecast(analyzeForecast(result.data));
      }

      setIsLoadingForecast(false);
      setHasFetchedForecast(true);
    };

    fetchForecastData();
  }, [isOpen, selectedLocation, activeTab, hasFetchedForecast]);

  // Reset forecast cache when location changes
  useEffect(() => {
    setHasFetchedForecast(false);
    setForecast(null);
  }, [selectedLocation]);

  // Handle click outside to close
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(event.target as Node)) {
        closeFloatingCard('weather');
      }
    };

    // Delay adding listener to avoid immediate close
    const timeoutId = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, closeFloatingCard]);

  // Handle escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeFloatingCard('weather');
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, closeFloatingCard]);

  if (!isOpen || !selectedLocation) return null;

  const sunTimes = getSunTimes(date, selectedLocation.lat, selectedLocation.lng);
  const conditions = getPhotographyConditions(date, selectedLocation.lat, selectedLocation.lng);

  // Calculate photography score if weather is available
  const photographyScore = weather
    ? calculatePhotographyScore(conditions, adaptWeatherForPhotography(weather))
    : null;

  const handleClose = () => {
    closeFloatingCard('weather');
  };

  const handleSelectDate = (newDate: Date) => {
    setSelectedDateTime(newDate);
  };

  const getRecommendationColor = (recommendation: string): { bg: string; text: string; border: string } => {
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

  return (
    <div
      ref={cardRef}
      className={cn(
        'absolute top-4 left-4 z-20 w-80 max-h-[calc(100%-2rem)] overflow-hidden',
        'rounded-lg border bg-background shadow-lg',
        'animate-in slide-in-from-left-2 fade-in-0 duration-200',
        // Hidden on mobile - use bottom sheet instead
        'hidden lg:block',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/30">
        <h3 className="font-semibold text-sm">Weather Details</h3>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={handleClose}
          aria-label="Close weather card"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'current' | 'forecast')}>
        <TabsList className="w-full rounded-none border-b bg-transparent h-9">
          <TabsTrigger value="current" className="flex-1 text-xs">
            Current
          </TabsTrigger>
          <TabsTrigger value="forecast" className="flex-1 text-xs">
            7-Day
          </TabsTrigger>
        </TabsList>

        {/* Current Weather Tab */}
        <TabsContent value="current" className="m-0 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {isLoadingWeather ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading weather...</span>
            </div>
          ) : weatherError ? (
            <div className="p-4 text-center">
              <p className="text-sm text-destructive">{weatherError}</p>
            </div>
          ) : weather ? (
            <div className="p-3 space-y-4">
              {/* Weather Summary */}
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-2xl font-bold">
                    {formatTemperature(weather.temperature, temperatureUnit)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {WeatherTypeDescription[weather.weatherType] || 'Unknown'}
                  </p>
                </div>
                <div className="text-right text-sm text-muted-foreground">
                  <p>Feels like {formatTemperature(weather.feelsLike, temperatureUnit)}</p>
                </div>
              </div>

              {/* Sun Times */}
              <div className="space-y-2 rounded-lg bg-muted/50 p-3">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sun Times
                </h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Sunrise className="h-4 w-4 text-amber-500" />
                    <span className="text-muted-foreground">Sunrise</span>
                    <span className="ml-auto font-medium">{formatTime(sunTimes.sunrise)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sunset className="h-4 w-4 text-orange-500" />
                    <span className="text-muted-foreground">Sunset</span>
                    <span className="ml-auto font-medium">{formatTime(sunTimes.sunset)}</span>
                  </div>
                </div>
              </div>

              {/* Golden Hour */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Golden Hour
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 text-xs">
                    <p className="font-medium text-amber-900 dark:text-amber-100">Morning</p>
                    <p className="text-amber-800 dark:text-amber-200">
                      {formatTime(sunTimes.goldenHourMorning)} - {formatTime(sunTimes.goldenHourMorningEnd)}
                    </p>
                  </div>
                  <div className="rounded-md bg-orange-50 dark:bg-orange-950/20 p-2 text-xs">
                    <p className="font-medium text-orange-900 dark:text-orange-100">Evening</p>
                    <p className="text-orange-800 dark:text-orange-200">
                      {formatTime(sunTimes.goldenHourEvening)} - {formatTime(sunTimes.goldenHourEveningEnd)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Blue Hour */}
              <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                <div>
                  <span className="text-muted-foreground">Blue Hour AM:</span>{' '}
                  <span>{formatTime(sunTimes.nauticalDawn)} - {formatTime(sunTimes.sunrise)}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Blue Hour PM:</span>{' '}
                  <span>{formatTime(sunTimes.sunset)} - {formatTime(sunTimes.nauticalDusk)}</span>
                </div>
              </div>

              {/* Weather Details */}
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Conditions
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cloud className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Cloud</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{weather.cloudCover}%</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({getCloudCoverDescription(weather.cloudCover)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Eye className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Visibility</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">{formatVisibility(weather.visibility, distanceUnit)}</span>
                      <span className="text-xs text-muted-foreground ml-1">
                        ({getVisibilityQuality(weather.visibility)})
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wind className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Wind</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium">
                        {formatSpeed(weather.windSpeed * 1.60934, speedUnit)} {getCompassDirection(weather.windDirection)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Droplets className="h-4 w-4 text-muted-foreground" />
                      <span className="text-muted-foreground">Humidity</span>
                    </div>
                    <span className="font-medium">{weather.humidity}%</span>
                  </div>
                </div>
              </div>

              {/* Photography Score */}
              {photographyScore && (
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Photography Score
                  </h4>
                  <div
                    className={cn(
                      'rounded-lg border p-3',
                      getRecommendationColor(photographyScore.recommendation).bg,
                      getRecommendationColor(photographyScore.recommendation).border
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {photographyScore.recommendation === 'excellent' ||
                        photographyScore.recommendation === 'good' ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : (
                          <AlertCircle className="h-5 w-5" />
                        )}
                        <span
                          className={cn(
                            'font-semibold uppercase text-sm',
                            getRecommendationColor(photographyScore.recommendation).text
                          )}
                        >
                          {photographyScore.recommendation}
                        </span>
                      </div>
                      <span
                        className={cn(
                          'text-2xl font-bold',
                          getRecommendationColor(photographyScore.recommendation).text
                        )}
                      >
                        {photographyScore.overall}
                      </span>
                    </div>
                  </div>

                  {/* Score Breakdown */}
                  <div className="space-y-1.5">
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Lighting</span>
                        <span>{photographyScore.lightingScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full bg-amber-500"
                          style={{ width: `${photographyScore.lightingScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Weather</span>
                        <span>{photographyScore.weatherScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full bg-blue-500"
                          style={{ width: `${photographyScore.weatherScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Visibility</span>
                        <span>{photographyScore.visibilityScore}/100</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${photographyScore.visibilityScore}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Next Golden Hour */}
                  {conditions.minutesToGoldenHour !== null && (
                    <div className="rounded-md bg-amber-50 dark:bg-amber-950/20 p-2 text-xs">
                      <span className="font-medium text-amber-900 dark:text-amber-100">
                        Golden Hour in {formatDuration(conditions.minutesToGoldenHour)}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No weather data available</p>
            </div>
          )}
        </TabsContent>

        {/* 7-Day Forecast Tab */}
        <TabsContent value="forecast" className="m-0 overflow-y-auto max-h-[calc(100vh-16rem)]">
          {isLoadingForecast ? (
            <div className="flex items-center justify-center gap-2 py-12">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Loading forecast...</span>
            </div>
          ) : forecastError ? (
            <div className="p-4 text-center">
              <p className="text-sm text-destructive">{forecastError}</p>
            </div>
          ) : forecast ? (
            <>
              <WeatherForecastCard
                forecast={forecast}
                onSelectDate={handleSelectDate}
                className="border-0 shadow-none rounded-none"
              />
              <div className="p-3 border-t">
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    openBottomSheet('forecast');
                    closeFloatingCard('weather');
                  }}
                >
                  <Expand className="h-4 w-4 mr-2" />
                  View Full Forecast
                </Button>
              </div>
            </>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-muted-foreground">No forecast data available</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
