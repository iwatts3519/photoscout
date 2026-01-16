/**
 * POI Store
 * Manages POI (Points of Interest) state using Zustand
 */

import { create } from 'zustand';
import type { POI, POIType, POIFilters } from '@/src/types/overpass.types';

interface POIStore {
  /** All fetched POIs */
  pois: POI[];

  /** POI filter settings */
  filters: POIFilters;

  /** Whether POIs are currently loading */
  loading: boolean;

  /** Error message if POI fetch failed */
  error: string | null;

  // Actions
  /** Set POIs */
  setPOIs: (pois: POI[]) => void;

  /** Clear all POIs */
  clearPOIs: () => void;

  /** Set loading state */
  setLoading: (loading: boolean) => void;

  /** Set error message */
  setError: (error: string | null) => void;

  /** Toggle POI visibility */
  togglePOIVisibility: () => void;

  /** Enable/disable specific POI type */
  togglePOIType: (type: POIType) => void;

  /** Enable all POI types */
  enableAllTypes: () => void;

  /** Disable all POI types */
  disableAllTypes: () => void;

  /** Get filtered POIs based on enabled types */
  getFilteredPOIs: () => POI[];
}

/**
 * All POI types
 */
const ALL_POI_TYPES: POIType[] = ['parking', 'cafe', 'viewpoint', 'toilet', 'information'];

/**
 * POI store
 */
export const usePOIStore = create<POIStore>((set, get) => ({
  // Initial state
  pois: [],
  filters: {
    enabledTypes: ALL_POI_TYPES,
    showPOIs: true,
  },
  loading: false,
  error: null,

  // Actions
  setPOIs: (pois) => set({ pois, error: null }),

  clearPOIs: () => set({ pois: [], error: null }),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error, loading: false }),

  togglePOIVisibility: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        showPOIs: !state.filters.showPOIs,
      },
    })),

  togglePOIType: (type) =>
    set((state) => {
      const { enabledTypes } = state.filters;
      const isEnabled = enabledTypes.includes(type);

      return {
        filters: {
          ...state.filters,
          enabledTypes: isEnabled
            ? enabledTypes.filter((t) => t !== type)
            : [...enabledTypes, type],
        },
      };
    }),

  enableAllTypes: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        enabledTypes: ALL_POI_TYPES,
      },
    })),

  disableAllTypes: () =>
    set((state) => ({
      filters: {
        ...state.filters,
        enabledTypes: [],
      },
    })),

  getFilteredPOIs: () => {
    const { pois, filters } = get();

    if (!filters.showPOIs) {
      return [];
    }

    return pois.filter((poi) => filters.enabledTypes.includes(poi.type));
  },
}));
