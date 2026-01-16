import { create } from 'zustand';
import type { Map } from 'maplibre-gl';

export interface MapLocation {
  lat: number;
  lng: number;
}

interface MapState {
  // Map instance
  mapInstance: Map | null;

  // Selected location on the map
  selectedLocation: MapLocation | null;

  // Map center and zoom
  center: MapLocation;
  zoom: number;

  // Search radius in meters
  radius: number;

  // Selected marker (for future photo markers)
  selectedMarkerId: string | null;

  // Actions
  setMapInstance: (map: Map | null) => void;
  setSelectedLocation: (location: MapLocation | null) => void;
  setCenter: (center: MapLocation) => void;
  setZoom: (zoom: number) => void;
  setRadius: (radius: number) => void;
  setSelectedMarkerId: (id: string | null) => void;
  resetSelection: () => void;
}

// UK center coordinates
const DEFAULT_CENTER: MapLocation = {
  lat: 54.5,
  lng: -3.5,
};

const DEFAULT_ZOOM = 6;
const DEFAULT_RADIUS = 1000; // 1km

export const useMapStore = create<MapState>((set) => ({
  mapInstance: null,
  selectedLocation: null,
  center: DEFAULT_CENTER,
  zoom: DEFAULT_ZOOM,
  radius: DEFAULT_RADIUS,
  selectedMarkerId: null,

  setMapInstance: (map) => set({ mapInstance: map }),

  setSelectedLocation: (location) => set({ selectedLocation: location }),

  setCenter: (center) => set({ center }),

  setZoom: (zoom) => set({ zoom }),

  setRadius: (radius) => set({ radius }),

  setSelectedMarkerId: (id) => set({ selectedMarkerId: id }),

  resetSelection: () => set({
    selectedLocation: null,
    selectedMarkerId: null,
  }),
}));
