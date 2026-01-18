'use client';

import { useEffect, useState, useRef } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import { useSettingsStore, formatDistance } from '@/src/stores/settingsStore';
import { useUIStore } from '@/src/stores/uiStore';
import {
  useLocationHistoryStore,
  formatLocationName,
} from '@/src/stores/locationHistoryStore';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { MapPin, ChevronDown, ChevronRight, Bookmark, Clock } from 'lucide-react';
import { WeatherSummary } from '@/components/weather/WeatherSummary';
import { SaveLocationForm } from '@/components/locations/SaveLocationForm';
import { SavedLocationsList } from '@/components/locations/SavedLocationsList';
import { RecentlyViewed } from '@/components/locations/RecentlyViewed';
import { POIFiltersCompact } from '@/components/map/POIFiltersCompact';
import { LocationSearch } from '@/components/map/LocationSearch';
import { DateTimePicker } from '@/components/shared/DateTimePicker';
import { DevPasswordSignIn } from '@/components/auth/DevPasswordSignIn';
import { fetchCurrentWeather } from '@/app/actions/weather';
import { useAuth } from '@/src/hooks/useAuth';
import type { WeatherConditions as MetOfficeWeather } from '@/src/types/weather.types';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export function Sidebar() {
  const {
    selectedLocation,
    radius,
    setRadius,
    selectedDateTime,
    setSelectedDateTime,
    resetDateTime,
  } = useMapStore();
  const { distanceUnit } = useSettingsStore();
  const {
    savedLocationsCollapsed,
    recentlyViewedCollapsed,
    toggleSavedLocationsCollapsed,
    toggleRecentlyViewedCollapsed,
  } = useUIStore();
  const { addToHistory } = useLocationHistoryStore();
  const { user } = useAuth();

  // Weather state
  const [weather, setWeather] = useState<MetOfficeWeather | null>(null);
  const [isLoadingWeather, setIsLoadingWeather] = useState(false);
  const [weatherError, setWeatherError] = useState<string | null>(null);

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

  // Radius range: 500m to 10km
  const minRadius = 500;
  const maxRadius = 10000;

  const handleRadiusChange = (value: number[]) => {
    setRadius(value[0]);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-background">
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center gap-2 pb-2 border-b">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="font-semibold">PhotoScout</h2>
        </div>

        {/* Location Search - Always visible */}
        <div className="space-y-1.5">
          <Label className="text-xs text-muted-foreground">Search Location</Label>
          <LocationSearch />
        </div>

        {/* Dev Only: Password Sign In */}
        {!user && <DevPasswordSignIn />}

        {selectedLocation ? (
          <>
            {/* Weather Summary - Clickable to open floating card */}
            <WeatherSummary
              weather={weather}
              isLoading={isLoadingWeather}
              error={weatherError}
              lat={selectedLocation.lat}
              lng={selectedLocation.lng}
              date={selectedDateTime}
            />

            {/* Search Radius - Compact */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-muted-foreground">Search Radius</Label>
                <span className="text-xs font-medium">
                  {formatDistance(radius, distanceUnit)}
                </span>
              </div>
              <Slider
                min={minRadius}
                max={maxRadius}
                step={100}
                value={[radius]}
                onValueChange={handleRadiusChange}
                className="w-full"
              />
            </div>

            {/* Date/Time Picker - Compact */}
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Plan Your Shoot</Label>
              <DateTimePicker
                selectedDate={selectedDateTime}
                onDateChange={setSelectedDateTime}
                onReset={resetDateTime}
              />
            </div>

            {/* POI Filters - Icon only */}
            <POIFiltersCompact />

            {/* Save Location Form */}
            {user ? (
              <div className="pt-2">
                <SaveLocationForm
                  coordinates={selectedLocation}
                  radius={radius}
                />
              </div>
            ) : (
              <div className="p-3 rounded-lg bg-muted/50 border border-dashed">
                <p className="text-xs text-muted-foreground text-center">
                  Sign in to save locations
                </p>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              Click on the map to select a location
            </p>
          </div>
        )}

        {/* Divider */}
        <div className="border-t pt-4 mt-4" />

        {/* Saved Locations - Collapsible */}
        {user && (
          <Collapsible
            open={!savedLocationsCollapsed}
            onOpenChange={() => toggleSavedLocationsCollapsed()}
          >
            <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-accent rounded-lg px-2 -mx-2 transition-colors">
              <div className="flex items-center gap-2">
                <Bookmark className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Saved Locations</span>
              </div>
              {savedLocationsCollapsed ? (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              )}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <SavedLocationsList />
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Recently Viewed - Collapsible */}
        <Collapsible
          open={!recentlyViewedCollapsed}
          onOpenChange={() => toggleRecentlyViewedCollapsed()}
        >
          <CollapsibleTrigger className="flex items-center justify-between w-full py-2 hover:bg-accent rounded-lg px-2 -mx-2 transition-colors">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">Recently Viewed</span>
            </div>
            {recentlyViewedCollapsed ? (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2">
            <RecentlyViewed collapsible={false} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </div>
  );
}
