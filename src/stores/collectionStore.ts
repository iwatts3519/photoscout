import { create } from 'zustand';
import type { Database } from '@/src/types/database';

export type Collection = Database['public']['Tables']['collections']['Row'];

// Predefined color palette for collections
export const COLLECTION_COLORS = [
  { name: 'Green', value: '#10b981' },   // emerald-500 (default)
  { name: 'Blue', value: '#3b82f6' },    // blue-500
  { name: 'Purple', value: '#8b5cf6' },  // violet-500
  { name: 'Pink', value: '#ec4899' },    // pink-500
  { name: 'Red', value: '#ef4444' },     // red-500
  { name: 'Orange', value: '#f97316' },  // orange-500
  { name: 'Yellow', value: '#eab308' },  // yellow-500
  { name: 'Teal', value: '#14b8a6' },    // teal-500
] as const;

export const DEFAULT_COLLECTION_COLOR = '#10b981';

interface CollectionState {
  // Collections from database
  collections: Collection[];

  // Selected collection for filtering locations
  selectedCollectionId: string | null;

  // Loading state
  isLoading: boolean;

  // Actions
  setCollections: (collections: Collection[]) => void;
  addCollection: (collection: Collection) => void;
  updateCollection: (id: string, updates: Partial<Collection>) => void;
  removeCollection: (id: string) => void;
  setSelectedCollectionId: (id: string | null) => void;
  setIsLoading: (isLoading: boolean) => void;

  // Helpers
  getCollectionById: (id: string) => Collection | undefined;
  getCollectionColor: (collectionId: string | null) => string;
}

export const useCollectionStore = create<CollectionState>((set, get) => ({
  collections: [],
  selectedCollectionId: null,
  isLoading: false,

  setCollections: (collections) => set({ collections }),

  addCollection: (collection) =>
    set((state) => ({
      collections: [collection, ...state.collections],
    })),

  updateCollection: (id, updates) =>
    set((state) => ({
      collections: state.collections.map((col) =>
        col.id === id ? { ...col, ...updates } : col
      ),
    })),

  removeCollection: (id) =>
    set((state) => ({
      collections: state.collections.filter((col) => col.id !== id),
      // Clear selection if the deleted collection was selected
      selectedCollectionId:
        state.selectedCollectionId === id ? null : state.selectedCollectionId,
    })),

  setSelectedCollectionId: (id) => set({ selectedCollectionId: id }),

  setIsLoading: (isLoading) => set({ isLoading }),

  getCollectionById: (id) => {
    return get().collections.find((col) => col.id === id);
  },

  getCollectionColor: (collectionId) => {
    if (!collectionId) return DEFAULT_COLLECTION_COLOR;
    const collection = get().collections.find((col) => col.id === collectionId);
    return collection?.color || DEFAULT_COLLECTION_COLOR;
  },
}));
