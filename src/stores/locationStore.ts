import { create } from 'zustand';
import type { Database } from '@/src/types/database';

export type SavedLocation = Database['public']['Tables']['locations']['Row'];

interface LocationState {
  // Saved locations from database
  savedLocations: SavedLocation[];

  // Selected saved location (for viewing/editing)
  selectedSavedLocation: SavedLocation | null;

  // Loading state
  isLoading: boolean;

  // Actions
  setSavedLocations: (locations: SavedLocation[]) => void;
  addLocation: (location: SavedLocation) => void;
  updateLocation: (id: string, updates: Partial<SavedLocation>) => void;
  removeLocation: (id: string) => void;
  setSelectedSavedLocation: (location: SavedLocation | null) => void;
  setIsLoading: (isLoading: boolean) => void;
}

export const useLocationStore = create<LocationState>((set) => ({
  savedLocations: [],
  selectedSavedLocation: null,
  isLoading: false,

  setSavedLocations: (locations) => set({ savedLocations: locations }),

  addLocation: (location) =>
    set((state) => ({
      savedLocations: [location, ...state.savedLocations],
    })),

  updateLocation: (id, updates) =>
    set((state) => ({
      savedLocations: state.savedLocations.map((loc) =>
        loc.id === id ? { ...loc, ...updates } : loc
      ),
      selectedSavedLocation:
        state.selectedSavedLocation?.id === id
          ? { ...state.selectedSavedLocation, ...updates }
          : state.selectedSavedLocation,
    })),

  removeLocation: (id) =>
    set((state) => ({
      savedLocations: state.savedLocations.filter((loc) => loc.id !== id),
      selectedSavedLocation:
        state.selectedSavedLocation?.id === id
          ? null
          : state.selectedSavedLocation,
    })),

  setSelectedSavedLocation: (location) =>
    set({ selectedSavedLocation: location }),

  setIsLoading: (isLoading) => set({ isLoading }),
}));
