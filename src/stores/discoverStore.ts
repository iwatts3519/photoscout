import { create } from 'zustand';
import type {
  PublicLocation,
  PopularTag,
  SortOption,
  ViewMode,
} from '@/src/types/community.types';

interface DiscoverState {
  // Locations data
  locations: PublicLocation[];
  isLoading: boolean;
  error: string | null;

  // Pagination
  offset: number;
  hasMore: boolean;

  // Filters
  sortBy: SortOption;
  selectedTags: string[];
  popularTags: PopularTag[];

  // View mode
  viewMode: ViewMode;

  // Actions
  setLocations: (locations: PublicLocation[]) => void;
  appendLocations: (locations: PublicLocation[]) => void;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setOffset: (offset: number) => void;
  setHasMore: (hasMore: boolean) => void;
  setSortBy: (sortBy: SortOption) => void;
  setSelectedTags: (tags: string[]) => void;
  toggleTag: (tag: string) => void;
  setPopularTags: (tags: PopularTag[]) => void;
  setViewMode: (mode: ViewMode) => void;
  reset: () => void;
}

const initialState = {
  locations: [],
  isLoading: false,
  error: null,
  offset: 0,
  hasMore: true,
  sortBy: 'recent' as SortOption,
  selectedTags: [],
  popularTags: [],
  viewMode: 'grid' as ViewMode,
};

export const useDiscoverStore = create<DiscoverState>((set) => ({
  ...initialState,

  setLocations: (locations) =>
    set({ locations, offset: locations.length }),

  appendLocations: (newLocations) =>
    set((state) => ({
      locations: [...state.locations, ...newLocations],
      offset: state.offset + newLocations.length,
    })),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  setOffset: (offset) => set({ offset }),

  setHasMore: (hasMore) => set({ hasMore }),

  setSortBy: (sortBy) =>
    set({
      sortBy,
      locations: [],
      offset: 0,
      hasMore: true,
    }),

  setSelectedTags: (selectedTags) =>
    set({
      selectedTags,
      locations: [],
      offset: 0,
      hasMore: true,
    }),

  toggleTag: (tag) =>
    set((state) => {
      const newTags = state.selectedTags.includes(tag)
        ? state.selectedTags.filter((t) => t !== tag)
        : [...state.selectedTags, tag];
      return {
        selectedTags: newTags,
        locations: [],
        offset: 0,
        hasMore: true,
      };
    }),

  setPopularTags: (popularTags) => set({ popularTags }),

  setViewMode: (viewMode) => set({ viewMode }),

  reset: () => set(initialState),
}));
