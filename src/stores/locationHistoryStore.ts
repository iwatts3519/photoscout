import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryLocation {
  /** Unique ID for this history entry */
  id: string;
  /** Latitude */
  lat: number;
  /** Longitude */
  lng: number;
  /** Display name (from geocoding or generated) */
  name: string;
  /** Timestamp when this location was viewed */
  viewedAt: number;
}

interface LocationHistoryState {
  /** List of recently viewed locations (most recent first) */
  history: HistoryLocation[];

  /** Add a location to history */
  addToHistory: (location: Omit<HistoryLocation, 'id' | 'viewedAt'>) => void;

  /** Remove a specific location from history */
  removeFromHistory: (id: string) => void;

  /** Clear all history */
  clearHistory: () => void;

  /** Get history with optional limit */
  getHistory: (limit?: number) => HistoryLocation[];
}

const MAX_HISTORY_SIZE = 10;

/**
 * Generate a unique ID for a history entry
 */
function generateHistoryId(lat: number, lng: number): string {
  return `${lat.toFixed(6)}_${lng.toFixed(6)}_${Date.now()}`;
}

/**
 * Check if two locations are the same (within ~11m tolerance)
 */
function isSameLocation(a: { lat: number; lng: number }, b: { lat: number; lng: number }): boolean {
  const tolerance = 0.0001; // ~11 meters
  return Math.abs(a.lat - b.lat) < tolerance && Math.abs(a.lng - b.lng) < tolerance;
}

/**
 * Format coordinates as a fallback name
 */
export function formatLocationName(lat: number, lng: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lngDir = lng >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${latDir}, ${Math.abs(lng).toFixed(4)}°${lngDir}`;
}

export const useLocationHistoryStore = create<LocationHistoryState>()(
  persist(
    (set, get) => ({
      history: [],

      addToHistory: (location) => {
        set((state) => {
          // Remove existing entry for same location if exists
          const filtered = state.history.filter(
            (h) => !isSameLocation(h, location)
          );

          // Create new entry
          const newEntry: HistoryLocation = {
            id: generateHistoryId(location.lat, location.lng),
            lat: location.lat,
            lng: location.lng,
            name: location.name || formatLocationName(location.lat, location.lng),
            viewedAt: Date.now(),
          };

          // Add to beginning and limit size
          const updated = [newEntry, ...filtered].slice(0, MAX_HISTORY_SIZE);

          return { history: updated };
        });
      },

      removeFromHistory: (id) => {
        set((state) => ({
          history: state.history.filter((h) => h.id !== id),
        }));
      },

      clearHistory: () => {
        set({ history: [] });
      },

      getHistory: (limit = MAX_HISTORY_SIZE) => {
        return get().history.slice(0, limit);
      },
    }),
    {
      name: 'photoscout-location-history',
      version: 1,
    }
  )
);

/**
 * Format relative time (e.g., "2 hours ago", "Yesterday")
 */
export function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d ago`;

  // Format as date for older entries
  return new Date(timestamp).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}
