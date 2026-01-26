import { create } from 'zustand';
import type {
  UserPhoto,
  UserPhotoWithLocation,
  UploadQueueItem,
  PhotoFilters,
  LocationPhotoCount,
  StorageUsage,
} from '@/src/types/photo.types';
import { defaultPhotoFilters } from '@/src/types/photo.types';

interface PhotoLibraryState {
  // Photos
  photos: UserPhotoWithLocation[];
  totalPhotos: number;
  selectedPhoto: UserPhotoWithLocation | null;

  // Loading states
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;

  // Filters
  filters: PhotoFilters;

  // Upload queue
  uploadQueue: UploadQueueItem[];
  isUploading: boolean;

  // Location photo counts (for badges)
  locationPhotoCounts: Map<string, number>;

  // Storage usage
  storageUsage: StorageUsage | null;

  // Available tags (for filter dropdown)
  availableTags: string[];

  // Photo signed URLs cache
  signedUrls: Map<string, string>;

  // Actions - Photos
  setPhotos: (photos: UserPhotoWithLocation[], total: number) => void;
  appendPhotos: (photos: UserPhotoWithLocation[]) => void;
  addPhoto: (photo: UserPhotoWithLocation) => void;
  updatePhoto: (id: string, updates: Partial<UserPhoto>) => void;
  removePhoto: (id: string) => void;
  setSelectedPhoto: (photo: UserPhotoWithLocation | null) => void;

  // Actions - Loading
  setIsLoading: (isLoading: boolean) => void;
  setIsLoadingMore: (isLoadingMore: boolean) => void;
  setError: (error: string | null) => void;

  // Actions - Filters
  setFilters: (filters: Partial<PhotoFilters>) => void;
  resetFilters: () => void;

  // Actions - Upload queue
  addToUploadQueue: (item: UploadQueueItem) => void;
  updateUploadItem: (id: string, updates: Partial<UploadQueueItem>) => void;
  removeFromUploadQueue: (id: string) => void;
  clearUploadQueue: () => void;
  setIsUploading: (isUploading: boolean) => void;

  // Actions - Location photo counts
  setLocationPhotoCounts: (counts: LocationPhotoCount[]) => void;
  updateLocationPhotoCount: (locationId: string, delta: number) => void;
  getPhotoCountForLocation: (locationId: string) => number;

  // Actions - Storage usage
  setStorageUsage: (usage: StorageUsage | null) => void;
  updateStorageUsage: (bytesAdded: number) => void;

  // Actions - Tags
  setAvailableTags: (tags: string[]) => void;
  addTag: (tag: string) => void;

  // Actions - Signed URLs
  setSignedUrl: (storagePath: string, url: string) => void;
  setSignedUrls: (urls: Map<string, string>) => void;
  getSignedUrl: (storagePath: string) => string | undefined;
}

export const usePhotoLibraryStore = create<PhotoLibraryState>((set, get) => ({
  // Initial state
  photos: [],
  totalPhotos: 0,
  selectedPhoto: null,
  isLoading: false,
  isLoadingMore: false,
  error: null,
  filters: defaultPhotoFilters,
  uploadQueue: [],
  isUploading: false,
  locationPhotoCounts: new Map(),
  storageUsage: null,
  availableTags: [],
  signedUrls: new Map(),

  // Photos actions
  setPhotos: (photos, total) =>
    set({
      photos,
      totalPhotos: total,
      error: null,
    }),

  appendPhotos: (photos) =>
    set((state) => ({
      photos: [...state.photos, ...photos],
    })),

  addPhoto: (photo) =>
    set((state) => ({
      photos: [photo, ...state.photos],
      totalPhotos: state.totalPhotos + 1,
    })),

  updatePhoto: (id, updates) =>
    set((state) => ({
      photos: state.photos.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      selectedPhoto:
        state.selectedPhoto?.id === id
          ? { ...state.selectedPhoto, ...updates }
          : state.selectedPhoto,
    })),

  removePhoto: (id) =>
    set((state) => ({
      photos: state.photos.filter((p) => p.id !== id),
      totalPhotos: Math.max(0, state.totalPhotos - 1),
      selectedPhoto: state.selectedPhoto?.id === id ? null : state.selectedPhoto,
    })),

  setSelectedPhoto: (photo) => set({ selectedPhoto: photo }),

  // Loading actions
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsLoadingMore: (isLoadingMore) => set({ isLoadingMore }),
  setError: (error) => set({ error }),

  // Filter actions
  setFilters: (filters) =>
    set((state) => ({
      filters: { ...state.filters, ...filters },
    })),

  resetFilters: () => set({ filters: defaultPhotoFilters }),

  // Upload queue actions
  addToUploadQueue: (item) =>
    set((state) => ({
      uploadQueue: [...state.uploadQueue, item],
    })),

  updateUploadItem: (id, updates) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.map((item) =>
        item.id === id ? { ...item, ...updates } : item
      ),
    })),

  removeFromUploadQueue: (id) =>
    set((state) => ({
      uploadQueue: state.uploadQueue.filter((item) => item.id !== id),
    })),

  clearUploadQueue: () => set({ uploadQueue: [] }),

  setIsUploading: (isUploading) => set({ isUploading }),

  // Location photo count actions
  setLocationPhotoCounts: (counts) => {
    const map = new Map<string, number>();
    for (const { location_id, photo_count } of counts) {
      map.set(location_id, photo_count);
    }
    set({ locationPhotoCounts: map });
  },

  updateLocationPhotoCount: (locationId, delta) =>
    set((state) => {
      const newCounts = new Map(state.locationPhotoCounts);
      const current = newCounts.get(locationId) || 0;
      const newCount = Math.max(0, current + delta);
      if (newCount === 0) {
        newCounts.delete(locationId);
      } else {
        newCounts.set(locationId, newCount);
      }
      return { locationPhotoCounts: newCounts };
    }),

  getPhotoCountForLocation: (locationId) => {
    return get().locationPhotoCounts.get(locationId) || 0;
  },

  // Storage usage actions
  setStorageUsage: (usage) => set({ storageUsage: usage }),

  updateStorageUsage: (bytesAdded) =>
    set((state) => {
      if (!state.storageUsage) return state;
      const newUsed = state.storageUsage.used + bytesAdded;
      const percentage = Math.round((newUsed / state.storageUsage.limit) * 100);
      return {
        storageUsage: {
          ...state.storageUsage,
          used: newUsed,
          percentage,
        },
      };
    }),

  // Tags actions
  setAvailableTags: (tags) => set({ availableTags: tags }),

  addTag: (tag) =>
    set((state) => {
      if (state.availableTags.includes(tag)) return state;
      return {
        availableTags: [...state.availableTags, tag].sort(),
      };
    }),

  // Signed URLs actions
  setSignedUrl: (storagePath, url) =>
    set((state) => {
      const newUrls = new Map(state.signedUrls);
      newUrls.set(storagePath, url);
      return { signedUrls: newUrls };
    }),

  setSignedUrls: (urls) =>
    set((state) => {
      const newUrls = new Map(state.signedUrls);
      urls.forEach((url, path) => newUrls.set(path, url));
      return { signedUrls: newUrls };
    }),

  getSignedUrl: (storagePath) => {
    return get().signedUrls.get(storagePath);
  },
}));
