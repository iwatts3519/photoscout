'use server';

import { createClient } from '@/lib/supabase/server';
import {
  saveLocation,
  updateLocation,
  deleteLocation,
  getLocationById,
} from '@/lib/queries/locations';
import type { SavedLocation } from '@/src/stores/locationStore';
import { z } from 'zod';

// Validation schemas
const coordinatesSchema = z.object({
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
});

const createLocationSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  coordinates: coordinatesSchema,
  radius_meters: z.number().min(100).max(50000).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  collection_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000, 'Notes are too long').optional(),
  best_time_to_visit: z.string().max(500, 'Best time is too long').optional(),
});

const updateLocationSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  radius_meters: z.number().min(100).max(50000).optional(),
  tags: z.array(z.string()).optional(),
  is_public: z.boolean().optional(),
  collection_id: z.string().uuid().nullable().optional(),
  notes: z.string().max(2000).optional(),
  best_time_to_visit: z.string().max(500).optional(),
  last_visited: z.string().optional(), // ISO date string
});

/**
 * Fetch all locations for the current user
 */
export async function fetchUserLocations(): Promise<{
  data: SavedLocation[] | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to view saved locations',
      };
    }

    // Use raw SQL to extract lat/lng from PostGIS geography
    const { data: rawLocations, error: queryError } = await supabase
      .from('locations')
      .select('id, user_id, name, description, radius_meters, tags, is_public, created_at, updated_at, coordinates, collection_id, notes, best_time_to_visit, last_visited')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (queryError) throw queryError;

    // Transform coordinates from WKB to lat/lng by extracting from database
    // We need to do a second query with ST_X and ST_Y functions
    const locationIds = rawLocations?.map(loc => loc.id) || [];

    if (locationIds.length === 0) {
      return { data: [], error: null };
    }

    // Query with PostGIS functions to get lat/lng
    const { data: coordsData, error: coordsError } = await supabase.rpc('get_locations_with_coords', {
      location_ids: locationIds
    });

    if (coordsError) {
      // Fallback: Return locations with original coordinates
      console.warn('Failed to fetch coordinates, using fallback:', coordsError);
      return {
        data: rawLocations,
        error: null,
      };
    }

    // Merge coordinates with location data
    const locationsWithCoords = rawLocations?.map(loc => {
      const coords = coordsData?.find((c: { id: string; lat: number; lng: number }) => c.id === loc.id);
      return {
        ...loc,
        coordinates: coords ? { lat: coords.lat, lng: coords.lng } : loc.coordinates
      };
    });

    return {
      data: locationsWithCoords || [],
      error: null,
    };
  } catch (error) {
    console.error('Error fetching user locations:', error);
    return {
      data: null,
      error:
        error instanceof Error
          ? error.message
          : 'Failed to fetch saved locations',
    };
  }
}

/**
 * Create a new location
 */
export async function createLocation(input: {
  name: string;
  description?: string;
  coordinates: { lat: number; lng: number };
  radius_meters?: number;
  tags?: string[];
  is_public?: boolean;
  collection_id?: string | null;
  notes?: string;
  best_time_to_visit?: string;
}): Promise<{
  data: SavedLocation | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = createLocationSchema.safeParse(input);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to save locations',
      };
    }

    // Convert coordinates to PostGIS point format
    const { lat, lng } = result.data.coordinates;
    const coordinatesGeoJSON = `POINT(${lng} ${lat})`;

    const location = await saveLocation(supabase, {
      user_id: user.id,
      name: result.data.name,
      description: result.data.description || null,
      coordinates: coordinatesGeoJSON as unknown,
      radius_meters: result.data.radius_meters || 1000,
      tags: result.data.tags || null,
      is_public: result.data.is_public || false,
      collection_id: result.data.collection_id || null,
      notes: result.data.notes || null,
      best_time_to_visit: result.data.best_time_to_visit || null,
      last_visited: null, // Set via edit form when user visits location
    });

    return {
      data: location,
      error: null,
    };
  } catch (error) {
    console.error('Error creating location:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to save location',
    };
  }
}

/**
 * Update an existing location
 */
export async function updateLocationAction(
  id: string,
  updates: {
    name?: string;
    description?: string;
    radius_meters?: number;
    tags?: string[];
    is_public?: boolean;
    collection_id?: string | null;
    notes?: string;
    best_time_to_visit?: string;
    last_visited?: string;
  }
): Promise<{
  data: SavedLocation | null;
  error: string | null;
}> {
  try {
    // Validate input
    const result = updateLocationSchema.safeParse(updates);
    if (!result.success) {
      return {
        data: null,
        error: result.error.issues[0].message,
      };
    }

    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to update locations',
      };
    }

    const location = await updateLocation(supabase, id, result.data);

    return {
      data: location,
      error: null,
    };
  } catch (error) {
    console.error('Error updating location:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to update location',
    };
  }
}

/**
 * Delete a location
 */
export async function deleteLocationAction(id: string): Promise<{
  data: { success: boolean } | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to delete locations',
      };
    }

    await deleteLocation(supabase, id);

    return {
      data: { success: true },
      error: null,
    };
  } catch (error) {
    console.error('Error deleting location:', error);
    return {
      data: null,
      error:
        error instanceof Error ? error.message : 'Failed to delete location',
    };
  }
}

/**
 * Fetch a single location by ID
 */
export async function fetchLocationById(id: string): Promise<{
  data: SavedLocation | null;
  error: string | null;
}> {
  try {
    const supabase = await createClient();

    // Get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return {
        data: null,
        error: 'You must be signed in to view locations',
      };
    }

    const location = await getLocationById(supabase, id);

    return {
      data: location,
      error: null,
    };
  } catch (error) {
    console.error('Error fetching location:', error);
    return {
      data: null,
      error: error instanceof Error ? error.message : 'Failed to fetch location',
    };
  }
}
