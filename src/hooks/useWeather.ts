/**
 * useWeather Hook
 * Fetches and caches weather data for the selected location
 * Shared between Sidebar, MobileWeatherBar, and other components
 */

import { useState, useEffect, useCallback } from 'react';
import { useMapStore } from '@/src/stores/mapStore';
import { fetchCurrentWeather } from '@/app/actions/weather';
import type { WeatherConditions } from '@/src/types/weather.types';

interface UseWeatherReturn {
  weather: WeatherConditions | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Simple in-memory cache for weather data
const weatherCache = new Map<string, { data: WeatherConditions; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

function getCacheKey(lat: number, lng: number): string {
  return `${lat.toFixed(4)}_${lng.toFixed(4)}`;
}

export function useWeather(): UseWeatherReturn {
  const selectedLocation = useMapStore((state) => state.selectedLocation);

  const [weather, setWeather] = useState<WeatherConditions | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchWeatherData = useCallback(async () => {
    if (!selectedLocation) {
      setWeather(null);
      setError(null);
      return;
    }

    const cacheKey = getCacheKey(selectedLocation.lat, selectedLocation.lng);
    const cached = weatherCache.get(cacheKey);

    // Return cached data if still valid
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      setWeather(cached.data);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchCurrentWeather(
        selectedLocation.lat,
        selectedLocation.lng
      );

      if (result.error) {
        setError(result.error);
        setWeather(null);
      } else if (result.data) {
        // Cache the result
        weatherCache.set(cacheKey, {
          data: result.data,
          timestamp: Date.now(),
        });
        setWeather(result.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch weather');
      setWeather(null);
    } finally {
      setIsLoading(false);
    }
  }, [selectedLocation]);

  // Fetch weather when location changes
  useEffect(() => {
    fetchWeatherData();
  }, [fetchWeatherData]);

  return {
    weather,
    isLoading,
    error,
    refetch: fetchWeatherData,
  };
}
