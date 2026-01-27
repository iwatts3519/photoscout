import { z } from 'zod';

// ============================================================================
// Constants
// ============================================================================

export const TRANSPORT_MODES = ['driving', 'walking', 'cycling'] as const;
export type TransportMode = (typeof TRANSPORT_MODES)[number];

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

// Coordinates schema
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

// Create trip schema
export const createTripSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/, 'Invalid time format').optional(),
  transport_mode: z.enum(TRANSPORT_MODES).optional().default('driving'),
});

export type CreateTripInput = z.infer<typeof createTripSchema>;

// Update trip schema
export const updateTripSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  trip_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  start_time: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  transport_mode: z.enum(TRANSPORT_MODES).optional(),
  total_distance_meters: z.number().min(0).optional(),
  total_duration_seconds: z.number().min(0).optional(),
  is_optimized: z.boolean().optional(),
});

export type UpdateTripInput = z.infer<typeof updateTripSchema>;

// Create trip stop schema - for adding a new stop
export const createTripStopSchema = z.object({
  trip_id: z.string().uuid('Invalid trip ID'),
  // Either location_id OR custom location (name + coordinates)
  location_id: z.string().uuid('Invalid location ID').optional(),
  custom_name: z.string().max(100).optional(),
  custom_coordinates: coordinatesSchema.optional(),
  stop_order: z.number().min(0),
  planned_arrival: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).optional(),
  planned_duration_minutes: z.number().min(0).max(1440).optional().default(60),
  notes: z.string().max(500).optional(),
}).refine(
  (data) => data.location_id || (data.custom_name && data.custom_coordinates),
  { message: 'Either location_id or custom location (name + coordinates) is required' }
);

export type CreateTripStopInput = z.infer<typeof createTripStopSchema>;

// Update trip stop schema
export const updateTripStopSchema = z.object({
  custom_name: z.string().max(100).optional(),
  planned_arrival: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/).nullable().optional(),
  planned_duration_minutes: z.number().min(0).max(1440).optional(),
  notes: z.string().max(500).optional(),
  distance_to_next_meters: z.number().min(0).optional(),
  duration_to_next_seconds: z.number().min(0).optional(),
  route_geometry: z.any().optional(), // GeoJSON LineString stored as Json
});

export type UpdateTripStopInput = z.infer<typeof updateTripStopSchema>;

// ============================================================================
// Database Types
// ============================================================================

export interface Trip {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  trip_date: string | null; // ISO date string YYYY-MM-DD
  start_time: string | null; // Time string HH:MM:SS
  transport_mode: TransportMode;
  total_distance_meters: number | null;
  total_duration_seconds: number | null;
  is_optimized: boolean;
  created_at: string;
  updated_at: string;
}

export interface TripStop {
  id: string;
  trip_id: string;
  location_id: string | null;
  custom_name: string | null;
  custom_lat: number | null;
  custom_lng: number | null;
  stop_order: number;
  planned_arrival: string | null; // Time string HH:MM:SS
  planned_duration_minutes: number;
  notes: string | null;
  distance_to_next_meters: number | null;
  duration_to_next_seconds: number | null;
  route_geometry: RouteGeometry | null;
  created_at: string;
}

// Stop with resolved location data
export interface TripStopWithLocation extends TripStop {
  location?: {
    id: string;
    name: string;
    coordinates: { lat: number; lng: number };
  } | null;
  // Computed coordinates (custom or from location)
  coordinates: { lat: number; lng: number };
  // Display name (custom or from location)
  display_name: string;
}

// Trip with all stops
export interface TripWithStops extends Trip {
  stops: TripStopWithLocation[];
}

// ============================================================================
// Route Geometry Types (GeoJSON)
// ============================================================================

export interface RouteGeometry {
  type: 'LineString';
  coordinates: [number, number][]; // [lng, lat] pairs
}

export interface RouteSegment {
  from_stop_id: string;
  to_stop_id: string;
  distance_meters: number;
  duration_seconds: number;
  geometry: RouteGeometry;
}

// ============================================================================
// UI Helper Types
// ============================================================================

export interface TransportModeInfo {
  value: TransportMode;
  label: string;
  icon: string;
  description: string;
}

export const TRANSPORT_MODE_INFO: Record<TransportMode, TransportModeInfo> = {
  driving: {
    value: 'driving',
    label: 'Driving',
    icon: 'Car',
    description: 'By car or motor vehicle',
  },
  walking: {
    value: 'walking',
    label: 'Walking',
    icon: 'Footprints',
    description: 'On foot',
  },
  cycling: {
    value: 'cycling',
    label: 'Cycling',
    icon: 'Bike',
    description: 'By bicycle',
  },
};

// ============================================================================
// Trip Summary Types
// ============================================================================

export interface TripSummary {
  total_stops: number;
  total_distance_km: number;
  total_travel_time_minutes: number;
  total_shooting_minutes: number;
  estimated_end_time: string | null; // Time string
}

// Helper function to calculate trip summary
export function calculateTripSummary(trip: TripWithStops): TripSummary {
  const stops = trip.stops;
  const total_stops = stops.length;

  // Sum up distances and durations from route data
  const total_distance_meters = trip.total_distance_meters ||
    stops.reduce((sum, stop) => sum + (stop.distance_to_next_meters || 0), 0);

  const total_travel_seconds = trip.total_duration_seconds ||
    stops.reduce((sum, stop) => sum + (stop.duration_to_next_seconds || 0), 0);

  const total_shooting_minutes = stops.reduce(
    (sum, stop) => sum + (stop.planned_duration_minutes || 0),
    0
  );

  // Calculate estimated end time if start_time is set
  let estimated_end_time: string | null = null;
  if (trip.start_time) {
    const [hours, minutes] = trip.start_time.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const totalMinutes = startMinutes + Math.round(total_travel_seconds / 60) + total_shooting_minutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMins = totalMinutes % 60;
    estimated_end_time = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  return {
    total_stops,
    total_distance_km: Math.round(total_distance_meters / 100) / 10, // Round to 1 decimal
    total_travel_time_minutes: Math.round(total_travel_seconds / 60),
    total_shooting_minutes,
    estimated_end_time,
  };
}

// Format duration for display
export function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.round((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
}

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters >= 1000) {
    return `${(meters / 1000).toFixed(1)} km`;
  }
  return `${Math.round(meters)} m`;
}
