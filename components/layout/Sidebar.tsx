'use client';

import { useEffect, useState } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import { useSettingsStore, formatDistance } from '@/src/stores/settingsStore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, Loader2, AlertCircle } from 'lucide-react';
import { WeatherCard } from '@/components/weather/WeatherCard';
import { ConditionsScore } from '@/components/weather/ConditionsScore';
import { SunTimesCard } from '@/components/weather/SunTimesCard';
import { SaveLocationForm } from '@/components/locations/SaveLocationForm';
import { SavedLocationsList } from '@/components/locations/SavedLocationsList';
import { PhotoGallery } from '@/components/locations/PhotoGallery';
import { POIFilters } from '@/components/map/POIFilters';
import { POIList } from '@/components/map/POIList';
import { LocationSearch } from '@/components/map/LocationSearch';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { DevPasswordSignIn } from '@/components/auth/DevPasswordSignIn';
import { fetchCurrentWeather } from '@/app/actions/weather';
import { adaptWeatherForPhotography } from '@/lib/utils/weather-adapter';
import { useAuth } from '@/src/hooks/useAuth';
import type { WeatherConditions as MetOfficeWeather } from '@/src/types/weather.types';

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
  const { user } = useAuth();
  const [weather, setWeather] = useState<MetOfficeWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

  // Fetch weather data when location changes
  useEffect(() => {
    if (!selectedLocation) {
      setWeather(null);
      setWeatherError(null);
      return;
    }

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

    fetchWeather();
  }, [selectedLocation]);

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
                {/* Loading State */}
                {isLoadingWeather && (
                  <Card>
                    <CardContent className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-sm text-muted-foreground">
                        Loading weather data...
                      </span>
                    </CardContent>
                  </Card>
                )}

                {/* Error State */}
                {weatherError && !isLoadingWeather && (
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

                {/* Weather and Conditions Cards */}
                {weather && !isLoadingWeather && (
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
        </CardContent>
      </Card>
    </div>
  );
}
