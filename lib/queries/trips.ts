import type { Database, Json } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Trip,
  TripStop,
  TripWithStops,
  TripStopWithLocation,
  UpdateTripInput,
  UpdateTripStopInput,
} from '@/src/types/trips.types';

type TripInsert = Database['public']['Tables']['trips']['Insert'];
type TripStopRow = Database['public']['Tables']['trip_stops']['Row'];
type TripStopInsert = Database['public']['Tables']['trip_stops']['Insert'];

// ============================================================================
// Trip CRUD Operations
// ============================================================================

/**
 * Get all trips for a user
 */
export async function getTripsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
): Promise<Trip[]> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return (data || []) as Trip[];
}

/**
 * Get a single trip by ID
 */
export async function getTripById(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<Trip | null> {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('id', tripId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as Trip;
}

/**
 * Get a trip with all its stops and location details
 */
export async function getTripWithStops(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<TripWithStops | null> {
  // Get the trip first
  const trip = await getTripById(supabase, tripId);
  if (!trip) return null;

  // Get all stops for this trip with location data
  const { data: stopsData, error: stopsError } = await supabase
    .from('trip_stops')
    .select(`
      *,
      location:locations(id, name, coordinates)
    `)
    .eq('trip_id', tripId)
    .order('stop_order', { ascending: true });

  if (stopsError) throw stopsError;

  // Transform stops to include computed coordinates and display name
  const stops: TripStopWithLocation[] = (stopsData || []).map((stop) => {
    const stopData = stop as TripStopRow & {
      location: { id: string; name: string; coordinates: unknown } | null;
    };

    // Resolve coordinates - prefer custom, fall back to location
    let coordinates: { lat: number; lng: number };
    if (stopData.custom_lat !== null && stopData.custom_lng !== null) {
      coordinates = { lat: stopData.custom_lat, lng: stopData.custom_lng };
    } else if (stopData.location) {
      // Parse PostGIS coordinates
      coordinates = parsePostGISPoint(stopData.location.coordinates);
    } else {
      // Fallback - should not happen with valid data
      coordinates = { lat: 0, lng: 0 };
    }

    // Resolve display name - prefer custom, fall back to location
    const display_name = stopData.custom_name || stopData.location?.name || 'Unknown Stop';

    return {
      ...stopData,
      location: stopData.location ? {
        id: stopData.location.id,
        name: stopData.location.name,
        coordinates: parsePostGISPoint(stopData.location.coordinates),
      } : null,
      coordinates,
      display_name,
    } as TripStopWithLocation;
  });

  return {
    ...trip,
    stops,
  };
}

/**
 * Create a new trip
 */
export async function createTrip(
  supabase: SupabaseClient<Database>,
  trip: Omit<TripInsert, 'id' | 'created_at' | 'updated_at'>
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .insert([trip])
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

/**
 * Update a trip
 */
export async function updateTrip(
  supabase: SupabaseClient<Database>,
  tripId: string,
  updates: UpdateTripInput
): Promise<Trip> {
  const { data, error } = await supabase
    .from('trips')
    .update(updates)
    .eq('id', tripId)
    .select()
    .single();

  if (error) throw error;
  return data as Trip;
}

/**
 * Delete a trip (cascades to stops)
 */
export async function deleteTrip(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', tripId);

  if (error) throw error;
}

// ============================================================================
// Trip Stop CRUD Operations
// ============================================================================

/**
 * Get all stops for a trip
 */
export async function getTripStops(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<TripStop[]> {
  const { data, error } = await supabase
    .from('trip_stops')
    .select('*')
    .eq('trip_id', tripId)
    .order('stop_order', { ascending: true });

  if (error) throw error;
  return (data || []) as TripStop[];
}

/**
 * Add a stop to a trip
 */
export async function addTripStop(
  supabase: SupabaseClient<Database>,
  stop: Omit<TripStopInsert, 'id' | 'created_at'>
): Promise<TripStop> {
  const { data, error } = await supabase
    .from('trip_stops')
    .insert([stop])
    .select()
    .single();

  if (error) throw error;
  return data as TripStop;
}

/**
 * Update a trip stop
 */
export async function updateTripStop(
  supabase: SupabaseClient<Database>,
  stopId: string,
  updates: UpdateTripStopInput
): Promise<TripStop> {
  const { data, error } = await supabase
    .from('trip_stops')
    .update(updates)
    .eq('id', stopId)
    .select()
    .single();

  if (error) throw error;
  return data as TripStop;
}

/**
 * Delete a trip stop
 */
export async function deleteTripStop(
  supabase: SupabaseClient<Database>,
  stopId: string
): Promise<void> {
  const { error } = await supabase
    .from('trip_stops')
    .delete()
    .eq('id', stopId);

  if (error) throw error;
}

/**
 * Reorder stops within a trip using the database function
 */
export async function reorderTripStops(
  supabase: SupabaseClient<Database>,
  tripId: string,
  stopIds: string[]
): Promise<void> {
  const { error } = await supabase.rpc('reorder_trip_stops', {
    p_trip_id: tripId,
    p_stop_ids: stopIds,
  });

  if (error) throw error;
}

/**
 * Update route data for a stop (after route calculation)
 */
export async function updateStopRouteData(
  supabase: SupabaseClient<Database>,
  stopId: string,
  routeData: {
    distance_to_next_meters: number;
    duration_to_next_seconds: number;
    route_geometry: Json | null;
  }
): Promise<void> {
  const { error } = await supabase
    .from('trip_stops')
    .update(routeData)
    .eq('id', stopId);

  if (error) throw error;
}

/**
 * Update trip totals after route calculation
 */
export async function updateTripTotals(
  supabase: SupabaseClient<Database>,
  tripId: string,
  totals: {
    total_distance_meters: number;
    total_duration_seconds: number;
    is_optimized?: boolean;
  }
): Promise<void> {
  const { error } = await supabase
    .from('trips')
    .update(totals)
    .eq('id', tripId);

  if (error) throw error;
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Parse PostGIS geography point to lat/lng object
 */
function parsePostGISPoint(coords: unknown): { lat: number; lng: number } {
  if (typeof coords === 'string') {
    // Try to parse as text format: "POINT(lng lat)" or "(lng,lat)"
    const textMatch = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (textMatch) {
      return {
        lng: parseFloat(textMatch[1]),
        lat: parseFloat(textMatch[2]),
      };
    }
  }

  // If it's already an object with lat/lng, return as-is
  if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return coords as { lat: number; lng: number };
  }

  // Fallback
  return { lat: 0, lng: 0 };
}

/**
 * Get the next available stop order for a trip
 */
export async function getNextStopOrder(
  supabase: SupabaseClient<Database>,
  tripId: string
): Promise<number> {
  const { data, error } = await supabase
    .from('trip_stops')
    .select('stop_order')
    .eq('trip_id', tripId)
    .order('stop_order', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return 0; // No stops yet
    throw error;
  }

  return (data?.stop_order ?? -1) + 1;
}
