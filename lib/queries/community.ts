import type { Database } from '@/src/types/database';
import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PublicLocation,
  LocationWithCoords,
  FavoritedLocation,
  PopularTag,
  ToggleFavoriteResult,
  SortOption,
  Visibility,
} from '@/src/types/community.types';

/**
 * Fetch public locations for discovery page
 */
export async function getPublicLocations(
  supabase: SupabaseClient<Database>,
  options: {
    limit?: number;
    offset?: number;
    sortBy?: SortOption;
    tags?: string[];
  } = {}
): Promise<PublicLocation[]> {
  const { limit = 50, offset = 0, sortBy = 'recent', tags } = options;

  const { data, error } = await supabase.rpc('get_public_locations', {
    p_limit: limit,
    p_offset: offset,
    p_sort_by: sortBy,
    p_tags: tags && tags.length > 0 ? tags : undefined,
  });

  if (error) throw error;
  // Cast visibility from string to Visibility type
  return (data || []).map((loc) => ({
    ...loc,
    visibility: loc.visibility as Visibility,
  }));
}

/**
 * Fetch a single location with coordinates
 */
export async function getLocationWithCoords(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<LocationWithCoords | null> {
  const { data, error } = await supabase.rpc('get_location_with_coords', {
    p_location_id: locationId,
  });

  if (error) throw error;
  if (!data || data.length === 0) return null;

  // Cast visibility from string to Visibility type
  return {
    ...data[0],
    visibility: data[0].visibility as Visibility,
  };
}

/**
 * Toggle favorite status for a location
 */
export async function toggleFavorite(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<ToggleFavoriteResult> {
  const { data, error } = await supabase.rpc('toggle_location_favorite', {
    p_location_id: locationId,
  });

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error('Failed to toggle favorite');
  }
  return data[0];
}

/**
 * Check if a location is favorited by the current user
 */
export async function checkIsFavorited(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<boolean> {
  const { data, error } = await supabase.rpc('check_is_favorited', {
    p_location_id: locationId,
  });

  if (error) throw error;
  return data || false;
}

/**
 * Get user's favorited locations
 */
export async function getUserFavorites(
  supabase: SupabaseClient<Database>,
  limit: number = 50
): Promise<FavoritedLocation[]> {
  const { data, error } = await supabase.rpc('get_user_favorites', {
    p_limit: limit,
  });

  if (error) throw error;
  // Cast visibility from string to Visibility type
  return (data || []).map((loc) => ({
    ...loc,
    visibility: loc.visibility as Visibility,
  }));
}

/**
 * Increment view count for a location
 */
export async function incrementViewCount(
  supabase: SupabaseClient<Database>,
  locationId: string
): Promise<number> {
  const { data, error } = await supabase.rpc('increment_location_view_count', {
    p_location_id: locationId,
  });

  if (error) throw error;
  return data || 0;
}

/**
 * Get popular tags from public locations
 */
export async function getPopularTags(
  supabase: SupabaseClient<Database>,
  limit: number = 20
): Promise<PopularTag[]> {
  const { data, error } = await supabase.rpc('get_popular_tags', {
    p_limit: limit,
  });

  if (error) throw error;
  return data || [];
}

/**
 * Submit a report for a location
 */
export async function submitReport(
  supabase: SupabaseClient<Database>,
  locationId: string,
  reason: string,
  details?: string
): Promise<void> {
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error('User must be authenticated');

  const { error } = await supabase.from('location_reports').insert({
    location_id: locationId,
    reporter_id: user.id,
    reason,
    details: details || null,
  });

  if (error) {
    if (error.code === '23505') {
      // Unique constraint violation
      throw new Error('You have already reported this location');
    }
    throw error;
  }
}
