import { create } from 'zustand';
import type { FavoritedLocation } from '@/src/types/community.types';

interface FavoritesState {
  // Favorites data
  favorites: FavoritedLocation[];
  favoriteIds: Set<string>;
  isLoading: boolean;
  error: string | null;

  // Actions
  setFavorites: (favorites: FavoritedLocation[]) => void;
  addFavorite: (location: FavoritedLocation) => void;
  removeFavorite: (locationId: string) => void;
  isFavorited: (locationId: string) => boolean;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

const initialState = {
  favorites: [],
  favoriteIds: new Set<string>(),
  isLoading: false,
  error: null,
};

export const useFavoritesStore = create<FavoritesState>((set, get) => ({
  ...initialState,

  setFavorites: (favorites) =>
    set({
      favorites,
      favoriteIds: new Set(favorites.map((f) => f.id)),
    }),

  addFavorite: (location) =>
    set((state) => {
      const newFavoriteIds = new Set(state.favoriteIds);
      newFavoriteIds.add(location.id);
      return {
        favorites: [location, ...state.favorites],
        favoriteIds: newFavoriteIds,
      };
    }),

  removeFavorite: (locationId) =>
    set((state) => {
      const newFavoriteIds = new Set(state.favoriteIds);
      newFavoriteIds.delete(locationId);
      return {
        favorites: state.favorites.filter((f) => f.id !== locationId),
        favoriteIds: newFavoriteIds,
      };
    }),

  isFavorited: (locationId) => get().favoriteIds.has(locationId),

  setIsLoading: (isLoading) => set({ isLoading }),

  setError: (error) => set({ error }),

  reset: () => set(initialState),
}));
