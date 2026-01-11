import { renderHook, act, waitFor } from '@testing-library/react';
import { useGeolocation } from './useGeolocation';
import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('useGeolocation', () => {
  beforeEach(() => {
    // Mock navigator.geolocation
    const mockGeolocation = {
      getCurrentPosition: vi.fn(),
    };
    Object.defineProperty(global.navigator, 'geolocation', {
      value: mockGeolocation,
      writable: true,
    });
  });

  it('should initialize with null location and no error', () => {
    const { result } = renderHook(() => useGeolocation());

    expect(result.current.location).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('should set loading to true when getLocation is called', () => {
    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getLocation();
    });

    expect(result.current.loading).toBe(true);
  });

  it('should successfully get location', async () => {
    const mockPosition = {
      coords: {
        latitude: 51.5074,
        longitude: -0.1278,
      },
    };

    // Mock successful geolocation
    const mockGetCurrentPosition = vi.fn((successCallback) => {
      successCallback(mockPosition);
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getLocation();
    });

    await waitFor(() => {
      expect(result.current.location).toEqual({
        lat: 51.5074,
        lng: -0.1278,
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });
  });

  it('should handle permission denied error', async () => {
    const mockError = {
      code: 1, // PERMISSION_DENIED
      message: 'User denied geolocation',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    // Mock failed geolocation
    const mockGetCurrentPosition = vi.fn((successCallback, errorCallback) => {
      errorCallback(mockError);
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getLocation();
    });

    await waitFor(() => {
      expect(result.current.location).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toContain('permission denied');
    });
  });

  it('should clear error when clearError is called', async () => {
    // Setup an error state first
    const mockError = {
      code: 1,
      message: 'Error',
      PERMISSION_DENIED: 1,
      POSITION_UNAVAILABLE: 2,
      TIMEOUT: 3,
    };

    const mockGetCurrentPosition = vi.fn((successCallback, errorCallback) => {
      errorCallback(mockError);
    });
    Object.defineProperty(global.navigator, 'geolocation', {
      value: { getCurrentPosition: mockGetCurrentPosition },
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getLocation();
    });

    await waitFor(() => {
      expect(result.current.error).not.toBeNull();
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBeNull();
  });

  it('should handle unsupported geolocation', () => {
    // Remove geolocation support
    Object.defineProperty(global.navigator, 'geolocation', {
      value: undefined,
      writable: true,
    });

    const { result } = renderHook(() => useGeolocation());

    act(() => {
      result.current.getLocation();
    });

    expect(result.current.error).toContain('not supported');
    expect(result.current.loading).toBe(false);
  });
});
