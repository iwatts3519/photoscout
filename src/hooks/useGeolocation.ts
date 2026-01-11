import { useState, useCallback } from 'react';
import type { MapLocation } from '@/src/stores/mapStore';

interface GeolocationState {
  location: MapLocation | null;
  loading: boolean;
  error: string | null;
}

interface UseGeolocationReturn extends GeolocationState {
  getLocation: () => void;
  clearError: () => void;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    loading: false,
    error: null,
  });

  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState({
        location: null,
        loading: false,
        error: 'Geolocation is not supported by your browser',
      });
      return;
    }

    setState((prev) => ({ ...prev, loading: true, error: null }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const location: MapLocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };

        setState({
          location,
          loading: false,
          error: null,
        });
      },
      (error) => {
        let errorMessage = 'Failed to get your location';

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = 'Location permission denied. Please enable location access in your browser settings.';
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = 'Location information is unavailable.';
            break;
          case error.TIMEOUT:
            errorMessage = 'Location request timed out.';
            break;
        }

        setState({
          location: null,
          loading: false,
          error: errorMessage,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }, []);

  return {
    ...state,
    getLocation,
    clearError,
  };
}
