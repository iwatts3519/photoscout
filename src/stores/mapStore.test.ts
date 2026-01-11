import { renderHook, act } from '@testing-library/react';
import { useMapStore } from './mapStore';
import { describe, it, expect, beforeEach } from 'vitest';

describe('mapStore', () => {
  beforeEach(() => {
    // Reset store to initial state before each test
    const { result } = renderHook(() => useMapStore());
    act(() => {
      result.current.resetSelection();
      result.current.setCenter({ lat: 54.5, lng: -3.5 });
      result.current.setZoom(6);
      result.current.setRadius(1000);
    });
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useMapStore());

    expect(result.current.selectedLocation).toBeNull();
    expect(result.current.center).toEqual({ lat: 54.5, lng: -3.5 });
    expect(result.current.zoom).toBe(6);
    expect(result.current.radius).toBe(1000);
    expect(result.current.selectedMarkerId).toBeNull();
  });

  it('should set selected location', () => {
    const { result } = renderHook(() => useMapStore());
    const location = { lat: 51.5074, lng: -0.1278 };

    act(() => {
      result.current.setSelectedLocation(location);
    });

    expect(result.current.selectedLocation).toEqual(location);
  });

  it('should set center', () => {
    const { result } = renderHook(() => useMapStore());
    const center = { lat: 55.9533, lng: -3.1883 };

    act(() => {
      result.current.setCenter(center);
    });

    expect(result.current.center).toEqual(center);
  });

  it('should set zoom', () => {
    const { result } = renderHook(() => useMapStore());

    act(() => {
      result.current.setZoom(12);
    });

    expect(result.current.zoom).toBe(12);
  });

  it('should set radius', () => {
    const { result } = renderHook(() => useMapStore());

    act(() => {
      result.current.setRadius(5000);
    });

    expect(result.current.radius).toBe(5000);
  });

  it('should set selected marker id', () => {
    const { result } = renderHook(() => useMapStore());
    const markerId = 'marker-123';

    act(() => {
      result.current.setSelectedMarkerId(markerId);
    });

    expect(result.current.selectedMarkerId).toBe(markerId);
  });

  it('should reset selection', () => {
    const { result } = renderHook(() => useMapStore());

    // Set some values
    act(() => {
      result.current.setSelectedLocation({ lat: 51.5074, lng: -0.1278 });
      result.current.setSelectedMarkerId('marker-123');
    });

    // Verify they are set
    expect(result.current.selectedLocation).not.toBeNull();
    expect(result.current.selectedMarkerId).not.toBeNull();

    // Reset
    act(() => {
      result.current.resetSelection();
    });

    expect(result.current.selectedLocation).toBeNull();
    expect(result.current.selectedMarkerId).toBeNull();
  });

  it('should clear selected location when set to null', () => {
    const { result } = renderHook(() => useMapStore());

    act(() => {
      result.current.setSelectedLocation({ lat: 51.5074, lng: -0.1278 });
    });

    expect(result.current.selectedLocation).not.toBeNull();

    act(() => {
      result.current.setSelectedLocation(null);
    });

    expect(result.current.selectedLocation).toBeNull();
  });
});
