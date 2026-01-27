import { create } from 'zustand';

const MAX_COMPARISON_LOCATIONS = 4;

interface ComparisonState {
  /** Whether compare mode is active (shows checkboxes on location cards) */
  isCompareMode: boolean;
  /** IDs of locations selected for comparison (max 4) */
  selectedLocationIds: string[];

  // Actions
  enterCompareMode: () => void;
  exitCompareMode: () => void;
  toggleCompareMode: () => void;
  toggleLocationSelection: (locationId: string) => void;
  addLocationToCompare: (locationId: string) => void;
  removeLocationFromCompare: (locationId: string) => void;
  clearSelection: () => void;
}

export const useComparisonStore = create<ComparisonState>((set, get) => ({
  isCompareMode: false,
  selectedLocationIds: [],

  enterCompareMode: () => set({ isCompareMode: true }),

  exitCompareMode: () =>
    set({ isCompareMode: false, selectedLocationIds: [] }),

  toggleCompareMode: () => {
    const { isCompareMode } = get();
    if (isCompareMode) {
      set({ isCompareMode: false, selectedLocationIds: [] });
    } else {
      set({ isCompareMode: true });
    }
  },

  toggleLocationSelection: (locationId: string) => {
    const { selectedLocationIds } = get();
    if (selectedLocationIds.includes(locationId)) {
      set({
        selectedLocationIds: selectedLocationIds.filter(
          (id) => id !== locationId
        ),
      });
    } else if (selectedLocationIds.length < MAX_COMPARISON_LOCATIONS) {
      set({
        selectedLocationIds: [...selectedLocationIds, locationId],
      });
    }
  },

  addLocationToCompare: (locationId: string) => {
    const { selectedLocationIds, isCompareMode } = get();
    if (
      selectedLocationIds.length < MAX_COMPARISON_LOCATIONS &&
      !selectedLocationIds.includes(locationId)
    ) {
      set({
        isCompareMode: isCompareMode || true,
        selectedLocationIds: [...selectedLocationIds, locationId],
      });
    }
  },

  removeLocationFromCompare: (locationId: string) =>
    set((state) => ({
      selectedLocationIds: state.selectedLocationIds.filter(
        (id) => id !== locationId
      ),
    })),

  clearSelection: () => set({ selectedLocationIds: [] }),
}));
