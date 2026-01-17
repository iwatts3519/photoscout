import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UnitSystem = 'metric' | 'imperial';
export type TemperatureUnit = 'celsius' | 'fahrenheit';
export type DistanceUnit = 'km' | 'miles';
export type SpeedUnit = 'kmh' | 'mph';

export interface UserSettings {
  // Units
  unitSystem: UnitSystem;
  temperatureUnit: TemperatureUnit;
  distanceUnit: DistanceUnit;
  speedUnit: SpeedUnit;

  // Defaults
  defaultRadius: number; // in meters
  defaultZoom: number;

  // UI preferences
  showCoordinates: boolean;
  compactMode: boolean;
}

interface SettingsState extends UserSettings {
  // Actions
  setUnitSystem: (system: UnitSystem) => void;
  setTemperatureUnit: (unit: TemperatureUnit) => void;
  setDistanceUnit: (unit: DistanceUnit) => void;
  setSpeedUnit: (unit: SpeedUnit) => void;
  setDefaultRadius: (radius: number) => void;
  setDefaultZoom: (zoom: number) => void;
  setShowCoordinates: (show: boolean) => void;
  setCompactMode: (compact: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: UserSettings = {
  unitSystem: 'metric',
  temperatureUnit: 'celsius',
  distanceUnit: 'km',
  speedUnit: 'kmh',
  defaultRadius: 1000,
  defaultZoom: 6,
  showCoordinates: true,
  compactMode: false,
};

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULT_SETTINGS,

      setUnitSystem: (system) =>
        set({
          unitSystem: system,
          // Auto-update related units when system changes
          temperatureUnit: system === 'metric' ? 'celsius' : 'fahrenheit',
          distanceUnit: system === 'metric' ? 'km' : 'miles',
          speedUnit: system === 'metric' ? 'kmh' : 'mph',
        }),

      setTemperatureUnit: (unit) => set({ temperatureUnit: unit }),

      setDistanceUnit: (unit) => set({ distanceUnit: unit }),

      setSpeedUnit: (unit) => set({ speedUnit: unit }),

      setDefaultRadius: (radius) => set({ defaultRadius: radius }),

      setDefaultZoom: (zoom) => set({ defaultZoom: zoom }),

      setShowCoordinates: (show) => set({ showCoordinates: show }),

      setCompactMode: (compact) => set({ compactMode: compact }),

      resetSettings: () => set(DEFAULT_SETTINGS),
    }),
    {
      name: 'photoscout-settings',
    }
  )
);

// Utility functions for unit conversion

/**
 * Convert temperature based on user preference
 */
export function formatTemperature(
  celsius: number,
  unit: TemperatureUnit
): string {
  if (unit === 'fahrenheit') {
    const fahrenheit = (celsius * 9) / 5 + 32;
    return `${Math.round(fahrenheit)}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

/**
 * Convert distance based on user preference
 */
export function formatDistance(
  meters: number,
  unit: DistanceUnit
): string {
  if (unit === 'miles') {
    const miles = meters / 1609.344;
    if (miles < 0.1) {
      const feet = meters * 3.28084;
      return `${Math.round(feet)} ft`;
    }
    return `${miles.toFixed(1)} mi`;
  }
  // Metric
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}

/**
 * Convert speed based on user preference
 */
export function formatSpeed(
  kmh: number,
  unit: SpeedUnit
): string {
  if (unit === 'mph') {
    const mph = kmh * 0.621371;
    return `${Math.round(mph)} mph`;
  }
  return `${Math.round(kmh)} km/h`;
}

/**
 * Convert visibility based on user preference
 */
export function formatVisibility(
  meters: number,
  unit: DistanceUnit
): string {
  if (unit === 'miles') {
    const miles = meters / 1609.344;
    return `${miles.toFixed(1)} mi`;
  }
  // Metric
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
