'use server';

import { createClient } from '@/lib/supabase/server';
import type { Json } from '@/src/types/database';
import {
  getTripsByUser,
  getTripById,
  getTripWithStops,
  createTrip as createTripQuery,
  updateTrip as updateTripQuery,
  deleteTrip as deleteTripQuery,
  addTripStop as addTripStopQuery,
  updateTripStop as updateTripStopQuery,
  deleteTripStop as deleteTripStopQuery,
  reorderTripStops as reorderTripStopsQuery,
  getNextStopOrder,
  updateTripTotals,
  updateStopRouteData,
} from '@/lib/queries/trips';
import {
  createTripSchema,
  updateTripSchema,
  createTripStopSchema,
  updateTripStopSchema,
  type Trip,
  type TripWithStops,
  type TripStop,
  type CreateTripInput,
  type UpdateTripInput,
  type CreateTripStopInput,
  type UpdateTripStopInput,
} from '@/src/types/trips.types';

// ============================================================================
// Trip Actions
// ============================================================================

/**
 * Fetch all trips for the current user
 */
export async function fetchUserTrips(): Promise<{
  data: Trip[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view trips' };
    }

    const trips = await getTripsByUser(supabase, user.id);
    return { data: trips, error: null };
  } catch (error) {
    console.error('Error fetching trips:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch trips',
    };
  }
}

/**
 * Fetch a single trip by ID
 */
export async function fetchTrip(tripId: string): Promise<{
  data: Trip | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view trips' };
    }

    const trip = await getTripById(supabase, tripId);
    if (!trip) {
      return { data: null, error: 'Trip not found' };
    }

    return { data: trip, error: null };
  } catch (error) {
    console.error('Error fetching trip:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch trip',
    };
  }
}

/**
 * Fetch a trip with all its stops
 */
export async function fetchTripWithStops(tripId: string): Promise<{
  data: TripWithStops | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to view trips' };
    }

    const trip = await getTripWithStops(supabase, tripId);
    if (!trip) {
      return { data: null, error: 'Trip not found' };
    }

    return { data: trip, error: null };
  } catch (error) {
    console.error('Error fetching trip with stops:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch trip',
    };
  }
}

/**
 * Create a new trip
 */
export async function createTripAction(input: CreateTripInput): Promise<{
  data: Trip | null;
  error: string | null;
}> {
  try {
    const result = createTripSchema.safeParse(input);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to create trips' };
    }

    const trip = await createTripQuery(supabase, {
      user_id: user.id,
      name: result.data.name,
      description: result.data.description || null,
      trip_date: result.data.trip_date || null,
      start_time: result.data.start_time || null,
      transport_mode: result.data.transport_mode,
    });

    return { data: trip, error: null };
  } catch (error) {
    console.error('Error creating trip:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to create trip',
    };
  }
}

/**
 * Update a trip
 */
export async function updateTripAction(
  tripId: string,
  updates: UpdateTripInput
): Promise<{
  data: Trip | null;
  error: string | null;
}> {
  try {
    const result = updateTripSchema.safeParse(updates);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update trips' };
    }

    const trip = await updateTripQuery(supabase, tripId, result.data);
    return { data: trip, error: null };
  } catch (error) {
    console.error('Error updating trip:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update trip',
    };
  }
}

/**
 * Delete a trip
 */
export async function deleteTripAction(tripId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to delete trips' };
    }

    await deleteTripQuery(supabase, tripId);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting trip:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete trip',
    };
  }
}

// ============================================================================
// Trip Stop Actions
// ============================================================================

/**
 * Add a stop to a trip
 */
export async function addTripStopAction(input: CreateTripStopInput): Promise<{
  data: TripStop | null;
  error: string | null;
}> {
  try {
    const result = createTripStopSchema.safeParse(input);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to add stops' };
    }

    // Get the next stop order if not provided
    let stopOrder = result.data.stop_order;
    if (stopOrder === undefined || stopOrder < 0) {
      stopOrder = await getNextStopOrder(supabase, result.data.trip_id);
    }

    const stop = await addTripStopQuery(supabase, {
      trip_id: result.data.trip_id,
      location_id: result.data.location_id || null,
      custom_name: result.data.custom_name || null,
      custom_lat: result.data.custom_coordinates?.lat || null,
      custom_lng: result.data.custom_coordinates?.lng || null,
      stop_order: stopOrder,
      planned_arrival: result.data.planned_arrival || null,
      planned_duration_minutes: result.data.planned_duration_minutes ?? 60,
      notes: result.data.notes || null,
    });

    return { data: stop, error: null };
  } catch (error) {
    console.error('Error adding trip stop:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to add stop',
    };
  }
}

/**
 * Update a trip stop
 */
export async function updateTripStopAction(
  stopId: string,
  updates: UpdateTripStopInput
): Promise<{
  data: TripStop | null;
  error: string | null;
}> {
  try {
    const result = updateTripStopSchema.safeParse(updates);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update stops' };
    }

    const stop = await updateTripStopQuery(supabase, stopId, result.data);
    return { data: stop, error: null };
  } catch (error) {
    console.error('Error updating trip stop:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update stop',
    };
  }
}

/**
 * Delete a trip stop
 */
export async function deleteTripStopAction(stopId: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to delete stops' };
    }

    await deleteTripStopQuery(supabase, stopId);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error deleting trip stop:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to delete stop',
    };
  }
}

/**
 * Reorder stops within a trip
 */
export async function reorderTripStopsAction(
  tripId: string,
  stopIds: string[]
): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to reorder stops' };
    }

    await reorderTripStopsQuery(supabase, tripId, stopIds);
    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error reordering trip stops:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to reorder stops',
    };
  }
}

/**
 * Update route data for stops after route calculation
 */
export async function updateRouteDataAction(
  tripId: string,
  routeData: {
    stops: Array<{
      stopId: string;
      distance_to_next_meters: number;
      duration_to_next_seconds: number;
      route_geometry: Json | null;
    }>;
    total_distance_meters: number;
    total_duration_seconds: number;
  }
): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to update routes' };
    }

    // Update each stop's route data
    for (const stop of routeData.stops) {
      await updateStopRouteData(supabase, stop.stopId, {
        distance_to_next_meters: stop.distance_to_next_meters,
        duration_to_next_seconds: stop.duration_to_next_seconds,
        route_geometry: stop.route_geometry,
      });
    }

    // Update trip totals
    await updateTripTotals(supabase, tripId, {
      total_distance_meters: routeData.total_distance_meters,
      total_duration_seconds: routeData.total_duration_seconds,
    });

    return { data: { success: true }, error: null };
  } catch (error) {
    console.error('Error updating route data:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to update route data',
    };
  }
}
