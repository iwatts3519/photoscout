'use server';

import { createClient } from '@/lib/supabase/server';
import {
  calculateRoute,
  calculateTripRoute,
} from '@/lib/api/openrouteservice';
import {
  routeRequestSchema,
  type Coordinate,
  type RouteCalculation,
} from '@/src/types/routing.types';
import type { Json } from '@/src/types/database';
import {
  getTripWithStops,
  updateStopRouteData,
  updateTripTotals,
} from '@/lib/queries/trips';

// ============================================================================
// Route Calculation Actions
// ============================================================================

/**
 * Calculate a route between multiple coordinates
 */
export async function calculateRouteAction(input: {
  coordinates: Array<{ lat: number; lng: number }>;
  transportMode?: string;
}): Promise<{
  data: RouteCalculation | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = routeRequestSchema.safeParse(input);
    if (!result.success) {
      return { data: null, error: result.error.issues[0].message };
    }

    // Convert to [lng, lat] format for ORS
    const coordinates: Coordinate[] = result.data.coordinates.map((c) => [
      c.lng,
      c.lat,
    ]);

    // Calculate route
    const routeResult = await calculateRoute(
      coordinates,
      result.data.transportMode
    );

    if (!routeResult.success) {
      return { data: null, error: routeResult.error.message };
    }

    return { data: routeResult.data, error: null };
  } catch (error) {
    console.error('Error calculating route:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate route',
    };
  }
}

/**
 * Calculate and save route for a trip
 * This fetches the trip, calculates routes between all stops,
 * and updates the database with route information
 */
export async function calculateTripRouteAction(tripId: string): Promise<{
  data: RouteCalculation | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to calculate routes' };
    }

    // Get trip with stops
    const trip = await getTripWithStops(supabase, tripId);
    if (!trip) {
      return { data: null, error: 'Trip not found' };
    }

    // Need at least 2 stops to calculate a route
    if (trip.stops.length < 2) {
      return { data: null, error: 'At least 2 stops are required to calculate a route' };
    }

    // Build stops array with coordinates
    const stops = trip.stops.map((stop) => ({
      lat: stop.coordinates.lat,
      lng: stop.coordinates.lng,
      name: stop.display_name,
    }));

    // Calculate route
    const routeResult = await calculateTripRoute(stops, trip.transport_mode);

    if (!routeResult.success) {
      return { data: null, error: routeResult.error.message };
    }

    const route = routeResult.data;

    // Update each stop with route data to next stop
    for (let i = 0; i < route.legs.length; i++) {
      const leg = route.legs[i];
      const stop = trip.stops[i];

      await updateStopRouteData(supabase, stop.id, {
        distance_to_next_meters: leg.distance_meters,
        duration_to_next_seconds: leg.duration_seconds,
        route_geometry: leg.geometry as unknown as Json,
      });
    }

    // Update trip totals
    await updateTripTotals(supabase, tripId, {
      total_distance_meters: route.total_distance_meters,
      total_duration_seconds: route.total_duration_seconds,
    });

    return { data: route, error: null };
  } catch (error) {
    console.error('Error calculating trip route:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate trip route',
    };
  }
}

/**
 * Calculate route between two saved locations
 */
export async function calculateRouteBetweenLocationsAction(
  fromLocationId: string,
  toLocationId: string,
  transportMode: string = 'driving'
): Promise<{
  data: RouteCalculation | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in to calculate routes' };
    }

    // Fetch location coordinates using RPC
    const { data: coordsData, error: coordsError } = await supabase.rpc(
      'get_locations_with_coords',
      { location_ids: [fromLocationId, toLocationId] }
    );

    if (coordsError || !coordsData || coordsData.length < 2) {
      return { data: null, error: 'Could not find both locations' };
    }

    // Build coordinates array
    const fromLoc = coordsData.find(
      (c: { id: string }) => c.id === fromLocationId
    );
    const toLoc = coordsData.find(
      (c: { id: string }) => c.id === toLocationId
    );

    if (!fromLoc || !toLoc) {
      return { data: null, error: 'Could not find location coordinates' };
    }

    const coordinates: Coordinate[] = [
      [fromLoc.lng, fromLoc.lat],
      [toLoc.lng, toLoc.lat],
    ];

    // Calculate route
    const routeResult = await calculateRoute(coordinates, transportMode);

    if (!routeResult.success) {
      return { data: null, error: routeResult.error.message };
    }

    return { data: routeResult.data, error: null };
  } catch (error) {
    console.error('Error calculating route between locations:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to calculate route',
    };
  }
}

/**
 * Get estimated travel time between current location and a saved location
 */
export async function getEstimatedTravelTimeAction(input: {
  from: { lat: number; lng: number };
  toLocationId: string;
  transportMode?: string;
}): Promise<{
  data: {
    distance_meters: number;
    duration_seconds: number;
    duration_formatted: string;
  } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Verify user is authenticated
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return { data: null, error: 'You must be signed in' };
    }

    // Fetch destination coordinates
    const { data: coordsData, error: coordsError } = await supabase.rpc(
      'get_locations_with_coords',
      { location_ids: [input.toLocationId] }
    );

    if (coordsError || !coordsData || coordsData.length === 0) {
      return { data: null, error: 'Could not find destination location' };
    }

    const destination = coordsData[0] as { lat: number; lng: number };

    const coordinates: Coordinate[] = [
      [input.from.lng, input.from.lat],
      [destination.lng, destination.lat],
    ];

    // Calculate route
    const routeResult = await calculateRoute(
      coordinates,
      input.transportMode || 'driving'
    );

    if (!routeResult.success) {
      return { data: null, error: routeResult.error.message };
    }

    const route = routeResult.data;

    // Format duration
    const durationMins = Math.round(route.total_duration_seconds / 60);
    const hours = Math.floor(durationMins / 60);
    const mins = durationMins % 60;
    const duration_formatted = hours > 0
      ? `${hours}h ${mins}m`
      : `${mins} min`;

    return {
      data: {
        distance_meters: route.total_distance_meters,
        duration_seconds: route.total_duration_seconds,
        duration_formatted,
      },
      error: null,
    };
  } catch (error) {
    console.error('Error getting travel time:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to get travel time',
    };
  }
}

// ============================================================================
// Helper Types for Actions
// ============================================================================

export interface TripRouteData {
  tripId: string;
  stops: Array<{
    stopId: string;
    distance_to_next_meters: number;
    duration_to_next_seconds: number;
    route_geometry: Json | null;
  }>;
  total_distance_meters: number;
  total_duration_seconds: number;
}
