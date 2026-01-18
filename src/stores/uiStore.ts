/**
 * UI State Store
 * Manages floating card visibility and other UI state
 */

import { create } from 'zustand';

export type FloatingCardType = 'weather' | 'location' | 'forecast';
export type BottomSheetContent = 'poi' | 'photos' | 'forecast' | null;

interface UIState {
  // Floating cards
  openFloatingCards: Set<FloatingCardType>;

  // Bottom sheet
  bottomSheetContent: BottomSheetContent;
  bottomSheetExpanded: boolean;

  // Sidebar sections (collapsed state)
  savedLocationsCollapsed: boolean;
  recentlyViewedCollapsed: boolean;

  // Actions
  openFloatingCard: (card: FloatingCardType) => void;
  closeFloatingCard: (card: FloatingCardType) => void;
  toggleFloatingCard: (card: FloatingCardType) => void;
  closeAllFloatingCards: () => void;

  openBottomSheet: (content: BottomSheetContent) => void;
  closeBottomSheet: () => void;
  setBottomSheetExpanded: (expanded: boolean) => void;

  setSavedLocationsCollapsed: (collapsed: boolean) => void;
  setRecentlyViewedCollapsed: (collapsed: boolean) => void;
  toggleSavedLocationsCollapsed: () => void;
  toggleRecentlyViewedCollapsed: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  openFloatingCards: new Set(),
  bottomSheetContent: null,
  bottomSheetExpanded: false,
  savedLocationsCollapsed: true,
  recentlyViewedCollapsed: true,

  // Floating card actions
  openFloatingCard: (card) => {
    set((state) => {
      const newCards = new Set(state.openFloatingCards);
      newCards.add(card);
      return { openFloatingCards: newCards };
    });
  },

  closeFloatingCard: (card) => {
    set((state) => {
      const newCards = new Set(state.openFloatingCards);
      newCards.delete(card);
      return { openFloatingCards: newCards };
    });
  },

  toggleFloatingCard: (card) => {
    const { openFloatingCards } = get();
    if (openFloatingCards.has(card)) {
      get().closeFloatingCard(card);
    } else {
      get().openFloatingCard(card);
    }
  },

  closeAllFloatingCards: () => {
    set({ openFloatingCards: new Set() });
  },

  // Bottom sheet actions
  openBottomSheet: (content) => {
    set({ bottomSheetContent: content, bottomSheetExpanded: false });
  },

  closeBottomSheet: () => {
    set({ bottomSheetContent: null, bottomSheetExpanded: false });
  },

  setBottomSheetExpanded: (expanded) => {
    set({ bottomSheetExpanded: expanded });
  },

  // Sidebar section actions
  setSavedLocationsCollapsed: (collapsed) => {
    set({ savedLocationsCollapsed: collapsed });
  },

  setRecentlyViewedCollapsed: (collapsed) => {
    set({ recentlyViewedCollapsed: collapsed });
  },

  toggleSavedLocationsCollapsed: () => {
    set((state) => ({ savedLocationsCollapsed: !state.savedLocationsCollapsed }));
  },

  toggleRecentlyViewedCollapsed: () => {
    set((state) => ({ recentlyViewedCollapsed: !state.recentlyViewedCollapsed }));
  },
}));
