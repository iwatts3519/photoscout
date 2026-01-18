import type { Database } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

type Location = Database['public']['Tables']['locations']['Row'];

export async function getLocationsByUser(
  supabase: SupabaseClient<Database>,
  userId: string
) {
  const { data, error } = await supabase
    .from('locations')
    .select('id, user_id, name, description, radius_meters, tags, is_public, created_at, updated_at, coordinates, collection_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) throw error;

  // Transform coordinates from PostGIS WKB to lat/lng object
  return data?.map(location => ({
    ...location,
    coordinates: parsePostGISPoint(location.coordinates)
  })) || [];
}

// Helper function to parse PostGIS geography point from WKB hex or text format
function parsePostGISPoint(coords: unknown): { lat: number; lng: number } | string {
  if (typeof coords === 'string') {
    // Try to parse as text format: "POINT(lng lat)" or "(lng,lat)"
    const textMatch = coords.match(/\(([^,\s]+)[,\s]+([^)]+)\)/);
    if (textMatch) {
      return {
        lng: parseFloat(textMatch[1]),
        lat: parseFloat(textMatch[2])
      };
    }

    // If it's WKB hex format, we need to decode it
    // WKB format: 0101000020E6100000... (binary geography data)
    // For now, return as-is and we'll handle server-side conversion
    return coords;
  }

  // If it's already an object, return as-is
  if (coords && typeof coords === 'object' && 'lat' in coords && 'lng' in coords) {
    return coords as { lat: number; lng: number };
  }

  return coords as string;
}

export async function getLocationsNearPoint(
  supabase: SupabaseClient<Database>,
  lng: number,
  lat: number,
  radiusMeters: number = 5000
) {
  const { data, error } = await supabase.rpc('locations_near_point', {
    lng,
    lat,
    radius_meters: radiusMeters,
  });

  if (error) throw error;
  return data;
}

export async function saveLocation(
  supabase: SupabaseClient<Database>,
  location: Omit<Location, 'id' | 'created_at' | 'updated_at'>
) {
  const { data, error } = await supabase
    .from('locations')
    .insert([location])
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getLocationById(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { data, error } = await supabase
    .from('locations')
    .select('*')
    .eq('id', id)
    .single();

  if (error) throw error;
  return data;
}

export async function updateLocation(
  supabase: SupabaseClient<Database>,
  id: string,
  updates: Partial<Omit<Location, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
) {
  const { data, error } = await supabase
    .from('locations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteLocation(
  supabase: SupabaseClient<Database>,
  id: string
) {
  const { error } = await supabase
    .from('locations')
    .delete()
    .eq('id', id);

  if (error) throw error;
}
