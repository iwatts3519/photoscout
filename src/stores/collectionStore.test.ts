import { renderHook, act } from '@testing-library/react';
import {
  useCollectionStore,
  COLLECTION_COLORS,
  DEFAULT_COLLECTION_COLOR,
  type Collection,
} from './collectionStore';
import { describe, it, expect, beforeEach } from 'vitest';

const mockCollection: Collection = {
  id: 'collection-1',
  user_id: 'user-1',
  name: 'Coastal Spots',
  description: 'Beach and coastal photography locations',
  color: '#3b82f6',
  icon: null,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

const mockCollection2: Collection = {
  id: 'collection-2',
  user_id: 'user-1',
  name: 'Mountain Locations',
  description: null,
  color: '#8b5cf6',
  icon: null,
  created_at: '2024-01-02T00:00:00Z',
  updated_at: '2024-01-02T00:00:00Z',
};

describe('collectionStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useCollectionStore());
    act(() => {
      result.current.setCollections([]);
      result.current.setSelectedCollectionId(null);
      result.current.setIsLoading(false);
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useCollectionStore());

    expect(result.current.collections).toEqual([]);
    expect(result.current.selectedCollectionId).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });

  it('should set collections', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection, mockCollection2]);
    });

    expect(result.current.collections).toHaveLength(2);
    expect(result.current.collections[0]).toEqual(mockCollection);
  });

  it('should add a collection', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection]);
    });

    act(() => {
      result.current.addCollection(mockCollection2);
    });

    expect(result.current.collections).toHaveLength(2);
    // New collection should be at the beginning
    expect(result.current.collections[0]).toEqual(mockCollection2);
  });

  it('should update a collection', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection]);
    });

    act(() => {
      result.current.updateCollection(mockCollection.id, {
        name: 'Updated Name',
        color: '#ef4444',
      });
    });

    expect(result.current.collections[0].name).toBe('Updated Name');
    expect(result.current.collections[0].color).toBe('#ef4444');
    // Original fields should remain
    expect(result.current.collections[0].description).toBe(mockCollection.description);
  });

  it('should remove a collection', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection, mockCollection2]);
    });

    act(() => {
      result.current.removeCollection(mockCollection.id);
    });

    expect(result.current.collections).toHaveLength(1);
    expect(result.current.collections[0].id).toBe(mockCollection2.id);
  });

  it('should clear selectedCollectionId when removed collection was selected', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection, mockCollection2]);
      result.current.setSelectedCollectionId(mockCollection.id);
    });

    expect(result.current.selectedCollectionId).toBe(mockCollection.id);

    act(() => {
      result.current.removeCollection(mockCollection.id);
    });

    expect(result.current.selectedCollectionId).toBeNull();
  });

  it('should not clear selectedCollectionId when a different collection is removed', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection, mockCollection2]);
      result.current.setSelectedCollectionId(mockCollection.id);
    });

    act(() => {
      result.current.removeCollection(mockCollection2.id);
    });

    expect(result.current.selectedCollectionId).toBe(mockCollection.id);
  });

  it('should set selected collection id', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setSelectedCollectionId('collection-1');
    });

    expect(result.current.selectedCollectionId).toBe('collection-1');
  });

  it('should set loading state', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setIsLoading(true);
    });

    expect(result.current.isLoading).toBe(true);
  });

  it('should get collection by id', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection, mockCollection2]);
    });

    const found = result.current.getCollectionById(mockCollection.id);
    expect(found).toEqual(mockCollection);

    const notFound = result.current.getCollectionById('non-existent');
    expect(notFound).toBeUndefined();
  });

  it('should get collection color', () => {
    const { result } = renderHook(() => useCollectionStore());

    act(() => {
      result.current.setCollections([mockCollection]);
    });

    // Should return collection color when id exists
    const color = result.current.getCollectionColor(mockCollection.id);
    expect(color).toBe(mockCollection.color);

    // Should return default color for null
    const defaultColor = result.current.getCollectionColor(null);
    expect(defaultColor).toBe(DEFAULT_COLLECTION_COLOR);

    // Should return default color for non-existent collection
    const fallbackColor = result.current.getCollectionColor('non-existent');
    expect(fallbackColor).toBe(DEFAULT_COLLECTION_COLOR);
  });

  it('should have predefined color palette', () => {
    expect(COLLECTION_COLORS).toHaveLength(8);
    expect(COLLECTION_COLORS[0]).toEqual({ name: 'Green', value: '#10b981' });
    expect(COLLECTION_COLORS[1]).toEqual({ name: 'Blue', value: '#3b82f6' });
  });

  it('should export default collection color constant', () => {
    expect(DEFAULT_COLLECTION_COLOR).toBe('#10b981');
  });
});
