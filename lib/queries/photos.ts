/* eslint-disable @typescript-eslint/no-explicit-any */
import type { Database } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Type for user_photos table row (will be generated after migration, but define for now)
export interface UserPhotoRow {
  id: string;
  user_id: string;
  location_id: string | null;
  storage_path: string;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  width: number | null;
  height: number | null;
  exif_data: Record<string, unknown> | null;
  taken_at: string | null;
  camera_make: string | null;
  camera_model: string | null;
  focal_length: string | null;
  aperture: string | null;
  shutter_speed: string | null;
  iso: number | null;
  exif_latitude: number | null;
  exif_longitude: number | null;
  title: string | null;
  description: string | null;
  tags: string[] | null;
  is_public: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPhotoWithLocation extends UserPhotoRow {
  location_name: string | null;
}

export interface PhotoFilters {
  locationId?: string | null;
  tags?: string[] | null;
  sortBy?: 'created_at' | 'taken_at' | 'filename';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface LocationPhotoCount {
  location_id: string;
  photo_count: number;
}

/**
 * Create a new photo record
 */
export async function createPhoto(
  supabase: SupabaseClient<Database>,
  photo: Omit<UserPhotoRow, 'id' | 'created_at' | 'updated_at'>
): Promise<UserPhotoRow> {
  const { data, error } = await (supabase as any)
    .from('user_photos')
    .insert([photo])
    .select()
    .single();

  if (error) throw error;
  return data as UserPhotoRow;
}

/**
 * Get a single photo by ID
 */
export async function getPhotoById(
  supabase: SupabaseClient<Database>,
  photoId: string
): Promise<UserPhotoRow | null> {
  const { data, error } = await (supabase as any)
    .from('user_photos')
    .select('*')
    .eq('id', photoId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null; // Not found
    throw error;
  }
  return data as UserPhotoRow;
}

/**
 * Get photos for current user with filtering and sorting
 */
export async function getUserPhotos(
  supabase: SupabaseClient<Database>,
  filters: PhotoFilters = {}
): Promise<UserPhotoWithLocation[]> {
  const {
    locationId = null,
    tags = null,
    sortBy = 'created_at',
    sortOrder = 'desc',
    limit = 50,
    offset = 0,
  } = filters;

  const { data, error } = await (supabase as any).rpc('get_user_photos', {
    p_limit: limit,
    p_offset: offset,
    p_sort_by: sortBy,
    p_sort_order: sortOrder,
    p_location_id: locationId,
    p_tags: tags,
  });

  if (error) throw error;
  return (data || []) as UserPhotoWithLocation[];
}

/**
 * Count user's photos
 */
export async function countUserPhotos(
  supabase: SupabaseClient<Database>,
  filters: Pick<PhotoFilters, 'locationId' | 'tags'> = {}
): Promise<number> {
  const { locationId = null, tags = null } = filters;

  const { data, error } = await (supabase as any).rpc('count_user_photos', {
    p_location_id: locationId,
    p_tags: tags,
  });

  if (error) throw error;
  return Number(data) || 0;
}

/**
 * Update a photo record
 */
export async function updatePhoto(
  supabase: SupabaseClient<Database>,
  photoId: string,
  updates: Partial<Pick<UserPhotoRow, 'title' | 'description' | 'tags' | 'is_public' | 'location_id'>>
): Promise<UserPhotoRow> {
  const { data, error } = await (supabase as any)
    .from('user_photos')
    .update(updates)
    .eq('id', photoId)
    .select()
    .single();

  if (error) throw error;
  return data as UserPhotoRow;
}

/**
 * Delete a photo record (storage deletion handled separately)
 */
export async function deletePhotoRecord(
  supabase: SupabaseClient<Database>,
  photoId: string
): Promise<void> {
  const { error } = await (supabase as any)
    .from('user_photos')
    .delete()
    .eq('id', photoId);

  if (error) throw error;
}

/**
 * Get photos for a specific location
 */
export async function getLocationPhotos(
  supabase: SupabaseClient<Database>,
  locationId: string,
  limit = 50,
  offset = 0
): Promise<UserPhotoRow[]> {
  const { data, error } = await (supabase as any).rpc('get_location_photos', {
    p_location_id: locationId,
    p_limit: limit,
    p_offset: offset,
  });

  if (error) throw error;
  return (data || []) as UserPhotoRow[];
}

/**
 * Get photo counts per location for current user
 */
export async function getLocationPhotoCounts(
  supabase: SupabaseClient<Database>
): Promise<LocationPhotoCount[]> {
  const { data, error } = await (supabase as any).rpc('get_user_location_photo_counts');

  if (error) throw error;
  return (data || []) as LocationPhotoCount[];
}

/**
 * Get user's storage usage
 */
export async function getStorageUsage(
  supabase: SupabaseClient<Database>,
  userId?: string
): Promise<number> {
  const { data, error } = await (supabase as any).rpc('get_user_storage_usage', {
    p_user_id: userId || null,
  });

  if (error) throw error;
  return Number(data) || 0;
}

/**
 * Link a photo to a location
 */
export async function linkPhotoToLocation(
  supabase: SupabaseClient<Database>,
  photoId: string,
  locationId: string | null
): Promise<UserPhotoRow> {
  return updatePhoto(supabase, photoId, { location_id: locationId });
}

/**
 * Get all unique tags used by the user
 */
export async function getUserPhotoTags(
  supabase: SupabaseClient<Database>
): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from('user_photos')
    .select('tags');

  if (error) throw error;

  const allTags = new Set<string>();
  for (const row of (data || []) as Array<{ tags: string[] | null }>) {
    if (row.tags) {
      for (const tag of row.tags) {
        allTags.add(tag);
      }
    }
  }

  return Array.from(allTags).sort();
}
