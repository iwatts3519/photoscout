import { create } from 'zustand';
import type { Map } from 'maplibre-gl';
import type { GeocodeResult, RecentSearch } from '@/src/types/geocoding.types';

export interface MapLocation {
  lat: number;
  lng: number;
}

interface MapState {
  // Map instance
  mapInstance: Map | null;

  // Selected location on the map
  selectedLocation: MapLocation | null;

  // Map center and zoom
  center: MapLocation;
  zoom: number;

  // Search radius in meters
  radius: number;

  // Selected marker (for future photo markers)
  selectedMarkerId: string | null;

  // Search state
  searchQuery: string;
  searchResults: GeocodeResult[];
  isSearching: boolean;
  searchError: string | null;
  recentSearches: RecentSearch[];
  isSearchOpen: boolean;

  // Planning date/time state
  selectedDateTime: Date;

  // Actions
  setMapInstance: (map: Map | null) => void;
  setSelectedLocation: (location: MapLocation | null) => void;
  setCenter: (center: MapLocation) => void;
  setZoom: (zoom: number) => void;
  setRadius: (radius: number) => void;
  setSelectedMarkerId: (id: string | null) => void;
  resetSelection: () => void;

  // Search actions
  setSearchQuery: (query: string) => void;
  setSearchResults: (results: GeocodeResult[]) => void;
  setIsSearching: (loading: boolean) => void;
  setSearchError: (error: string | null) => void;
  setRecentSearches: (searches: RecentSearch[]) => void;
  addRecentSearch: (search: RecentSearch) => void;
  setIsSearchOpen: (open: boolean) => void;
  clearSearch: () => void;
  selectSearchResult: (result: GeocodeResult) => void;

  // Date/time actions
  setSelectedDateTime: (date: Date) => void;
  resetDateTime: () => void;
}

// UK center coordinates
const DEFAULT_CENTER: MapLocation = {
  lat: 54.5,
  lng: -3.5,
};

const DEFAULT_ZOOM = 6;
const DEFAULT_RADIUS = 1000; // 1km

const MAX_RECENT_SEARCHES = 10;

export const useMapStore = create<MapState>((set, get) => ({
  mapInstance: null,
  selectedLocation: null,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  radius: DEFAULT_RADIUS,
  selectedMarkerId: null,

  // Search initial state
  searchQuery: '',
  searchResults: [],
  isSearching: false,
  searchError: null,
  recentSearches: [],
  isSearchOpen: false,

  // Planning date/time initial state (defaults to now)
  selectedDateTime: new Date(),

  setMapInstance: (map) => set({ mapInstance: map }),

  setSelectedLocation: (location) => set({ selectedLocation: location }),

  setCenter: (center) => set({ center }),

  setZoom: (zoom) => set({ zoom }),

  setRadius: (radius) => set({ radius }),

  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),

  resetSelection: () =>
    set({
      selectedLocation: null,
      selectedMarkerId: null,
    }),

  // Search actions
  setSearchQuery: (query) => set({ searchQuery: query }),

  setSearchResults: (results) => set({ searchResults: results }),

  setIsSearching: (loading) => set({ isSearching: loading }),

  setSearchError: (error) => set({ searchError: error }),

  setRecentSearches: (searches) => set({ recentSearches: searches }),

  addRecentSearch: (search) =>
    set((state) => {
      // Remove duplicate if exists
      const filtered = state.recentSearches.filter(
        (s) => s.result.id !== search.result.id
      );
      // Add new search at beginning, limit to max
      const updated = [search, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      return { recentSearches: updated };
    }),

  setIsSearchOpen: (open) => set({ isSearchOpen: open }),

  clearSearch: () =>
    set({
      searchQuery: '',
      searchResults: [],
      searchError: null,
      isSearchOpen: false,
    }),

  selectSearchResult: (result) => {
    const { addRecentSearch, setSelectedLocation, setCenter, clearSearch } =
      get();

    // Add to recent searches
    addRecentSearch({
      query: get().searchQuery,
      result,
      timestamp: Date.now(),
    });

    // Set selected location
    setSelectedLocation({ lat: result.lat, lng: result.lng });

    // Center map on result
    setCenter({ lat: result.lat, lng: result.lng });

    // Clear search UI
    clearSearch();

    // Fly to location if map instance exists
    const map = get().mapInstance;
    if (map) {
      map.flyTo({
        center: [result.lng, result.lat],
        zoom: 14,
        duration: 1500,
      });
    }
  },

  // Date/time actions
  setSelectedDateTime: (date) => set({ selectedDateTime: date }),

  resetDateTime: () => set({ selectedDateTime: new Date() }),
}));
