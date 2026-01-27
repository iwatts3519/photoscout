import { create } from 'zustand';
import type {
  Trip,
  TripWithStops,
  TransportMode,
} from '@/src/types/trips.types';
import type { RouteCalculation } from '@/src/types/routing.types';

// ============================================================================
// Types
// ============================================================================

// A stop being edited/added (before saving to DB)
export interface DraftStop {
  id: string; // temporary ID for UI
  location_id?: string;
  custom_name?: string;
  custom_lat?: number;
  custom_lng?: number;
  planned_duration_minutes: number;
  notes?: string;
  // Resolved display data
  display_name: string;
  coordinates: { lat: number; lng: number };
}

// Trip being planned (may not be saved yet)
export interface DraftTrip {
  id?: string; // undefined if new trip
  name: string;
  description?: string;
  trip_date?: string;
  start_time?: string;
  transport_mode: TransportMode;
  stops: DraftStop[];
}

interface TripPlannerState {
  // Current trip being edited
  currentTrip: DraftTrip | null;

  // Original trip (for detecting changes)
  originalTrip: TripWithStops | null;

  // Route calculation result
  routeCalculation: RouteCalculation | null;

  // UI state
  isOpen: boolean;
  isLoading: boolean;
  isSaving: boolean;
  isCalculatingRoute: boolean;
  hasUnsavedChanges: boolean;

  // Dialog states
  isAddStopDialogOpen: boolean;
  editingStopId: string | null;

  // User's saved trips
  userTrips: Trip[];
  isLoadingTrips: boolean;

  // Actions - Trip management
  openNewTrip: () => void;
  openExistingTrip: (trip: TripWithStops) => void;
  closeTripPlanner: () => void;

  // Actions - Trip editing
  setTripName: (name: string) => void;
  setTripDescription: (description: string) => void;
  setTripDate: (date: string | undefined) => void;
  setStartTime: (time: string | undefined) => void;
  setTransportMode: (mode: TransportMode) => void;

  // Actions - Stop management
  addStop: (stop: DraftStop) => void;
  updateStop: (id: string, updates: Partial<DraftStop>) => void;
  removeStop: (id: string) => void;
  reorderStops: (fromIndex: number, toIndex: number) => void;

  // Actions - Dialog states
  openAddStopDialog: () => void;
  closeAddStopDialog: () => void;
  setEditingStopId: (id: string | null) => void;

  // Actions - Route
  setRouteCalculation: (route: RouteCalculation | null) => void;
  setIsCalculatingRoute: (isCalculating: boolean) => void;

  // Actions - Loading states
  setIsLoading: (isLoading: boolean) => void;
  setIsSaving: (isSaving: boolean) => void;

  // Actions - User trips
  setUserTrips: (trips: Trip[]) => void;
  addUserTrip: (trip: Trip) => void;
  updateUserTrip: (id: string, updates: Partial<Trip>) => void;
  removeUserTrip: (id: string) => void;
  setIsLoadingTrips: (isLoading: boolean) => void;

  // Actions - Utility
  markAsChanged: () => void;
  resetChanges: () => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

function generateTempId(): string {
  return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEmptyTrip(): DraftTrip {
  return {
    name: '',
    transport_mode: 'driving',
    stops: [],
  };
}

function tripWithStopsToDraft(trip: TripWithStops): DraftTrip {
  return {
    id: trip.id,
    name: trip.name,
    description: trip.description || undefined,
    trip_date: trip.trip_date || undefined,
    start_time: trip.start_time || undefined,
    transport_mode: trip.transport_mode as TransportMode,
    stops: trip.stops.map((stop) => ({
      id: stop.id,
      location_id: stop.location_id || undefined,
      custom_name: stop.custom_name || undefined,
      custom_lat: stop.custom_lat || undefined,
      custom_lng: stop.custom_lng || undefined,
      planned_duration_minutes: stop.planned_duration_minutes,
      notes: stop.notes || undefined,
      display_name: stop.display_name,
      coordinates: stop.coordinates,
    })),
  };
}

// ============================================================================
// Store
// ============================================================================

export const useTripPlannerStore = create<TripPlannerState>((set) => ({
  // Initial state
  currentTrip: null,
  originalTrip: null,
  routeCalculation: null,
  isOpen: false,
  isLoading: false,
  isSaving: false,
  isCalculatingRoute: false,
  hasUnsavedChanges: false,
  isAddStopDialogOpen: false,
  editingStopId: null,
  userTrips: [],
  isLoadingTrips: false,

  // Trip management actions
  openNewTrip: () =>
    set({
      currentTrip: createEmptyTrip(),
      originalTrip: null,
      routeCalculation: null,
      isOpen: true,
      hasUnsavedChanges: false,
    }),

  openExistingTrip: (trip) =>
    set({
      currentTrip: tripWithStopsToDraft(trip),
      originalTrip: trip,
      routeCalculation: null,
      isOpen: true,
      hasUnsavedChanges: false,
    }),

  closeTripPlanner: () =>
    set({
      currentTrip: null,
      originalTrip: null,
      routeCalculation: null,
      isOpen: false,
      hasUnsavedChanges: false,
      isAddStopDialogOpen: false,
      editingStopId: null,
    }),

  // Trip editing actions
  setTripName: (name) =>
    set((state) => ({
      currentTrip: state.currentTrip
        ? { ...state.currentTrip, name }
        : null,
      hasUnsavedChanges: true,
    })),

  setTripDescription: (description) =>
    set((state) => ({
      currentTrip: state.currentTrip
        ? { ...state.currentTrip, description }
        : null,
      hasUnsavedChanges: true,
    })),

  setTripDate: (trip_date) =>
    set((state) => ({
      currentTrip: state.currentTrip
        ? { ...state.currentTrip, trip_date }
        : null,
      hasUnsavedChanges: true,
    })),

  setStartTime: (start_time) =>
    set((state) => ({
      currentTrip: state.currentTrip
        ? { ...state.currentTrip, start_time }
        : null,
      hasUnsavedChanges: true,
    })),

  setTransportMode: (transport_mode) =>
    set((state) => ({
      currentTrip: state.currentTrip
        ? { ...state.currentTrip, transport_mode }
        : null,
      hasUnsavedChanges: true,
      // Clear route when transport mode changes
      routeCalculation: null,
    })),

  // Stop management actions
  addStop: (stop) =>
    set((state) => {
      if (!state.currentTrip) return state;

      // Ensure stop has a temp ID if not provided
      const newStop = {
        ...stop,
        id: stop.id || generateTempId(),
      };

      return {
        currentTrip: {
          ...state.currentTrip,
          stops: [...state.currentTrip.stops, newStop],
        },
        hasUnsavedChanges: true,
        routeCalculation: null, // Clear route when stops change
        isAddStopDialogOpen: false,
      };
    }),

  updateStop: (id, updates) =>
    set((state) => {
      if (!state.currentTrip) return state;

      return {
        currentTrip: {
          ...state.currentTrip,
          stops: state.currentTrip.stops.map((stop) =>
            stop.id === id ? { ...stop, ...updates } : stop
          ),
        },
        hasUnsavedChanges: true,
      };
    }),

  removeStop: (id) =>
    set((state) => {
      if (!state.currentTrip) return state;

      return {
        currentTrip: {
          ...state.currentTrip,
          stops: state.currentTrip.stops.filter((stop) => stop.id !== id),
        },
        hasUnsavedChanges: true,
        routeCalculation: null, // Clear route when stops change
      };
    }),

  reorderStops: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.currentTrip) return state;

      const stops = [...state.currentTrip.stops];
      const [removed] = stops.splice(fromIndex, 1);
      stops.splice(toIndex, 0, removed);

      return {
        currentTrip: {
          ...state.currentTrip,
          stops,
        },
        hasUnsavedChanges: true,
        routeCalculation: null, // Clear route when stops reordered
      };
    }),

  // Dialog state actions
  openAddStopDialog: () => set({ isAddStopDialogOpen: true }),
  closeAddStopDialog: () => set({ isAddStopDialogOpen: false }),
  setEditingStopId: (id) => set({ editingStopId: id }),

  // Route actions
  setRouteCalculation: (route) => set({ routeCalculation: route }),
  setIsCalculatingRoute: (isCalculating) => set({ isCalculatingRoute: isCalculating }),

  // Loading state actions
  setIsLoading: (isLoading) => set({ isLoading }),
  setIsSaving: (isSaving) => set({ isSaving }),

  // User trips actions
  setUserTrips: (trips) => set({ userTrips: trips }),

  addUserTrip: (trip) =>
    set((state) => ({
      userTrips: [trip, ...state.userTrips],
    })),

  updateUserTrip: (id, updates) =>
    set((state) => ({
      userTrips: state.userTrips.map((trip) =>
        trip.id === id ? { ...trip, ...updates } : trip
      ),
    })),

  removeUserTrip: (id) =>
    set((state) => ({
      userTrips: state.userTrips.filter((trip) => trip.id !== id),
    })),

  setIsLoadingTrips: (isLoading) => set({ isLoadingTrips: isLoading }),

  // Utility actions
  markAsChanged: () => set({ hasUnsavedChanges: true }),
  resetChanges: () => set({ hasUnsavedChanges: false }),
}));

// ============================================================================
// Selector Hooks
// ============================================================================

export const useCurrentTrip = () => useTripPlannerStore((state) => state.currentTrip);
export const useTripStops = () => useTripPlannerStore((state) => state.currentTrip?.stops ?? []);
export const useIsTripPlannerOpen = () => useTripPlannerStore((state) => state.isOpen);
export const useHasUnsavedChanges = () => useTripPlannerStore((state) => state.hasUnsavedChanges);
export const useRouteCalculation = () => useTripPlannerStore((state) => state.routeCalculation);
export const useUserTrips = () => useTripPlannerStore((state) => state.userTrips);
export const useIsAddStopDialogOpen = () => useTripPlannerStore((state) => state.isAddStopDialogOpen);
