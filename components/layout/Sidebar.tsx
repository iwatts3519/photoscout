'use client';

import { useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import { useSettingsStore, formatDistance } from '@/src/stores/settingsStore';
import {
  useLocationHistoryStore,
  formatLocationName,
} from '@/src/stores/locationHistoryStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, AlertCircle, Calendar, Cloud } from 'lucide-react';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { WeatherForecastCard } from '@/components/weather/WeatherForecastCard';
import { ConditionsScore } from '@/components/weather/ConditionsScore';
import { SunTimesCard } from '@/components/weather/SunTimesCard';
import { SaveLocationForm } from '@/components/locations/SaveLocationForm';
import { SavedLocationsList } from '@/components/locations/SavedLocationsList';
import { RecentlyViewed } from '@/components/locations/RecentlyViewed';
import { PhotoGallery } from '@/components/locations/PhotoGallery';
import { POIFilters } from '@/components/map/POIFilters';
import { POIList } from '@/components/map/POIList';
import { LocationSearch } from '@/components/map/LocationSearch';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { DevPasswordSignIn } from '@/components/auth/DevPasswordSignIn';
import { fetchCurrentWeather, fetchMultiDayForecast } from '@/app/actions/weather';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { analyzeForecast, type AnalyzedForecast } from '@/lib/utils/forecast-analyzer';
import { useAuth } from '@/src/hooks/useAuth';
import type { WeatherConditions as MetOfficeWeather } from '@/src/types/weather.types';
import { cn } from '@/lib/utils';

export function Sidebar() {
  const {
    selectedLocation,
    radius,
    setRadius,
    selectedDateTime,
    setSelectedDateTime,
    resetDateTime,
  } = useMapStore();
  const { showCoordinates, distanceUnit } = useSettingsStore();
  const { addToHistory } = useLocationHistoryStore();
  const { user } = useAuth();
  const [weather, setWeather] = useState<MetOfficeWeather | null>(null);
  const [forecast, setForecast] = useState<AnalyzedForecast | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [isLoadingForecast, setIsLoadingForecast] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);
  const [weatherView, setWeatherView] = useState<'current' | 'forecast'>('current');

  // Track last added location to avoid duplicates
  const lastAddedLocationRef = useRef<string | null>(null);

  // Add selected location to history
  useEffect(() => {
    if (!selectedLocation) return;

    // Create a key for this location
    const locationKey = `${selectedLocation.lat.toFixed(6)}_${selectedLocation.lng.toFixed(6)}`;

    // Only add if it's a different location from the last one added
    if (lastAddedLocationRef.current !== locationKey) {
      lastAddedLocationRef.current = locationKey;

      // Add to history with a formatted name
      addToHistory({
        lat: selectedLocation.lat,
        lng: selectedLocation.lng,
        name: formatLocationName(selectedLocation.lat, selectedLocation.lng),
      });
    }
  }, [selectedLocation, addToHistory]);

  // Fetch weather data when location changes
  useEffect(() => {
    if (!selectedLocation) {
      setWeather(null);
      setForecast(null);
      setWeatherError(null);
      setForecastError(null);
      return;
    }

    // Fetch current weather
    const fetchWeather = async () => {
      setIsLoadingWeather(true);
      setWeatherError(null);

      const result = await fetchCurrentWeather(
        selectedLocation.lat,
        selectedLocation.lng
      );

      if (result.error) {
        setWeatherError(result.error);
        setWeather(null);
      } else {
        setWeather(result.data);
      }

      setIsLoadingWeather(false);
    };

    // Fetch multi-day forecast
    const fetchForecast = async () => {
      setIsLoadingForecast(true);
      setForecastError(null);

      const result = await fetchMultiDayForecast(
        selectedLocation.lat,
        selectedLocation.lng
      );

      if (result.error) {
        setForecastError(result.error);
        setForecast(null);
      } else if (result.data) {
        const analyzed = analyzeForecast(result.data);
        setForecast(analyzed);
      }

      setIsLoadingForecast(false);
    };

    // Fetch both in parallel
    fetchWeather();
    fetchForecast();
  }, [selectedLocation]);

  // Handle selecting a date from the forecast card
  const handleForecastDateSelect = (date: Date) => {
    setSelectedDateTime(date);
    setWeatherView('current'); // Switch to current view to see that day's details
  };

  const formatCoordinate = (value: number, decimals: number = 6): string => {
    return value.toFixed(decimals);
  };

  // Radius range: 500m to 10km
  const minRadius = 500;
  const maxRadius = 10000;

  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <Card className="border-0 rounded-none h-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Location Details
          </CardTitle>
          <CardDescription>
            {selectedLocation
              ? 'Adjust your search parameters'
              : 'Click on the map to select a location'}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Location Search */}
          <div className="space-y-2">
            <Label>Search Location</Label>
            <LocationSearch />
          </div>

          {/* Dev Only: Password Sign In */}
          {!user && <DevPasswordSignIn />}
          {selectedLocation ? (
            <>
              {/* Coordinates Display - Conditional based on settings */}
              {showCoordinates && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="latitude">Latitude</Label>
                    <Input
                      id="latitude"
                      value={formatCoordinate(selectedLocation.lat)}
                      readOnly
                      className="font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="longitude">Longitude</Label>
                    <Input
                      id="longitude"
                      value={formatCoordinate(selectedLocation.lng)}
                      readOnly
                      className="font-mono"
                    />
                  </div>
                </div>
              )}

              {/* Radius Slider */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label htmlFor="radius">Search Radius</Label>
                  <span className="text-sm font-medium text-muted-foreground">
                    {formatDistance(radius, distanceUnit)}
                  </span>
                </div>
                <Slider
                  id="radius"
                  min={minRadius}
                  max={maxRadius}
                  step={100}
                  value={[radius]}
                  onValueChange={handleRadiusChange}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatDistance(minRadius, distanceUnit)}</span>
                  <span>{formatDistance(maxRadius, distanceUnit)}</span>
                </div>
              </div>

              {/* Date/Time Picker for Planning */}
              <div className="space-y-2">
                <Label>Plan Your Shoot</Label>
                <DateTimePicker
                  selectedDate={selectedDateTime}
                  onDateChange={setSelectedDateTime}
                  onReset={resetDateTime}
                />
              </div>

              {/* Save Location Form */}
              <div className="space-y-2">
                <Label>Save Location</Label>
                {user ? (
                  <SaveLocationForm
                    coordinates={selectedLocation}
                    radius={radius}
                  />
                ) : (
                  <div className="p-4 rounded-lg bg-muted border-2 border-dashed border-muted-foreground/25">
                    <p className="text-sm text-muted-foreground text-center">
                      Sign in to save your favorite photography locations
                    </p>
                  </div>
                )}
              </div>

              {/* Weather and Photography Conditions */}
              <div className="space-y-4 pt-4">
                {/* Weather View Toggle */}
                <div className="flex gap-1 p-1 bg-muted rounded-lg">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-1 gap-2',
                      weatherView === 'current' && 'bg-background shadow-sm'
                    )}
                    onClick={() => setWeatherView('current')}
                  >
                    <Cloud className="h-4 w-4" />
                    Current
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      'flex-1 gap-2',
                      weatherView === 'forecast' && 'bg-background shadow-sm'
                    )}
                    onClick={() => setWeatherView('forecast')}
                  >
                    <Calendar className="h-4 w-4" />
                    7-Day
                  </Button>
                </div>

                {/* Loading State */}
                {((weatherView === 'current' && isLoadingWeather) ||
                  (weatherView === 'forecast' && isLoadingForecast)) && (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading weather data...
                      </span>
                    </CardContent>
                  </Card>
                )}

                {/* Error State - Current Weather */}
                {weatherView === 'current' && weatherError && !isLoadingWeather && (
                  <Card className="border-destructive">
                    <CardContent className="flex items-start gap-2 py-4">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Failed to load weather
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {weatherError}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Error State - Forecast */}
                {weatherView === 'forecast' && forecastError && !isLoadingForecast && (
                  <Card className="border-destructive">
                    <CardContent className="flex items-start gap-2 py-4">
                      <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-destructive">
                          Failed to load forecast
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {forecastError}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Current Weather View */}
                {weatherView === 'current' && weather && !isLoadingWeather && (
                  <>
                    {/* Sun Times */}
                    <SunTimesCard
                      lat={selectedLocation.lat}
                      lng={selectedLocation.lng}
                      date={selectedDateTime}
                    />

                    {/* Weather Conditions */}
                    <WeatherCard weather={weather} />

                    {/* Photography Score */}
                    <ConditionsScore
                      lat={selectedLocation.lat}
                      lng={selectedLocation.lng}
                      weather={adaptWeatherForPhotography(weather)}
                      date={selectedDateTime}
                    />

                    {/* Nearby Photos */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Nearby Photos</CardTitle>
                        <CardDescription>
                          Geotagged photos from Wikimedia Commons
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <PhotoGallery
                          lat={selectedLocation.lat}
                          lng={selectedLocation.lng}
                          radiusMeters={radius}
                          limit={20}
                        />
                      </CardContent>
                    </Card>
                  </>
                )}

                {/* 7-Day Forecast View */}
                {weatherView === 'forecast' && forecast && !isLoadingForecast && (
                  <WeatherForecastCard
                    forecast={forecast}
                    onSelectDate={handleForecastDateSelect}
                  />
                )}

                {/* POI Filters - Always visible when location selected */}
                <POIFilters />

                {/* POI List - Always visible when location selected */}
                <POIList />
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <MapPin className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-sm text-muted-foreground">
                Click anywhere on the map to select a location and start planning your shoot
              </p>
            </div>
          )}

          {/* Saved Locations List - Always visible when user is signed in */}
          {user && (
            <div className="pt-6 mt-6 border-t">
              <SavedLocationsList />
            </div>
          )}

          {/* Recently Viewed Locations - Always visible */}
          <div className="pt-6 mt-6 border-t">
            <RecentlyViewed collapsible defaultCollapsed={false} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
